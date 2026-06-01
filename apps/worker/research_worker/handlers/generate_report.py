"""Handler for generate_report jobs.

Payload schema::

    {"query": "Python async patterns"}
"""

from __future__ import annotations

import logging
import textwrap
from datetime import UTC, datetime
from typing import Any

from research_worker import db

logger = logging.getLogger(__name__)

_MAX_EXCERPT_CHARS = 500
_DEFAULT_SOURCE_LIMIT = 10


def _truncate(text: str | None, max_chars: int) -> str:
    if not text:
        return ""
    text = text.strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + " …"


def _build_markdown(query: str, sources: list[dict[str, Any]]) -> tuple[str, str]:
    """Return (title, markdown_content) for the report."""
    now = datetime.now(UTC).strftime("%Y-%m-%d")
    title = f"Research Report: {query}"

    lines: list[str] = [
        f"# {title}",
        f"*Generated {now} — {len(sources)} sources*",
        "",
        f"## Query\n\n{query}",
        "",
        "## Sources",
        "",
    ]

    for i, source in enumerate(sources, start=1):
        source_title = source.get("title") or "Untitled"
        source_url = source.get("url") or ""
        excerpt = _truncate(source.get("content"), _MAX_EXCERPT_CHARS)
        category = source.get("category") or ""

        lines.append(f"### {i}. [{source_title}]({source_url})")
        if category:
            lines.append(f"*Category: {category}*")
        lines.append("")
        if excerpt:
            lines.append(textwrap.fill(excerpt, width=100))
        lines.append("")

    if not sources:
        lines.append("*No matching sources found.*")
        lines.append("")

    return title, "\n".join(lines)


def run(job: dict[str, Any]) -> None:
    """Execute a generate_report job."""
    job_id: int = job["id"]
    payload: dict[str, Any] = job.get("payload") or {}

    query: str | None = payload.get("query")
    if not query:
        raise ValueError("generate_report payload missing required field: query")

    limit: int = int(payload.get("limit", _DEFAULT_SOURCE_LIMIT))

    db.write_job_log(job_id, "info", f"Searching sources for: {query!r}")
    logger.info("[job %s] Generating report for query: %r", job_id, query)

    sources = db.search_sources(query, limit=limit)

    db.write_job_log(
        job_id,
        "info",
        f"Found {len(sources)} matching sources",
        {"source_count": len(sources)},
    )

    title, content = _build_markdown(query, sources)
    source_ids = [int(s["id"]) for s in sources]

    report_id = db.save_research_report(
        {
            "query": query,
            "title": title,
            "content": content,
            "source_ids": source_ids,
        }
    )

    db.write_job_log(
        job_id,
        "info",
        f"Saved report id={report_id}",
        {"report_id": report_id, "source_count": len(sources)},
    )
    logger.info("[job %s] Saved research report id=%s", job_id, report_id)
