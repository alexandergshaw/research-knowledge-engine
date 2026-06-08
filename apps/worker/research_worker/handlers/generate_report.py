"""Handler for ``generate_report`` jobs.

Builds a deterministic Markdown "source packet" from full-text search results.
No LLMs, embeddings, or external AI APIs are used — the report only contains
metadata and verbatim excerpts extracted from stored source content.

Payload schemas (either form is accepted)::

    {"saved_query_id": "uuid"}

or::

    {
        "query": "search text",
        "title": "optional title",
        "category": "optional category",
        "subcategory": "optional subcategory",
        "limit": 10
    }
"""

from __future__ import annotations

import logging
import re
from datetime import UTC, datetime
from typing import Any

from research_worker import db

logger = logging.getLogger(__name__)

_MAX_EXCERPT_CHARS = 500
_DEFAULT_SOURCE_LIMIT = 10


def _fmt_dt(value: Any) -> str:
    """Format a timestamp value for display, or '—' when missing."""
    if value is None or value == "":
        return "—"
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    return str(value)


def _truncate(text: str | None, max_chars: int) -> str:
    if not text:
        return ""
    text = text.strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + " …"


def _extract_excerpt(
    content: str | None, query: str, max_chars: int = _MAX_EXCERPT_CHARS
) -> str:
    """Return an excerpt centered on the first query term found in ``content``.

    Falls back to the first ``max_chars`` characters when no query term is
    present. Never paraphrases — the excerpt is a verbatim slice of content.
    """
    if not content:
        return ""
    content = content.strip()

    terms = [t for t in re.findall(r"\w+", query.lower()) if len(t) > 2]
    lower = content.lower()

    pos = -1
    for term in terms:
        idx = lower.find(term)
        if idx != -1:
            pos = idx
            break

    if pos == -1:
        return _truncate(content, max_chars)

    start = max(0, pos - max_chars // 4)
    end = min(len(content), start + max_chars)
    snippet = content[start:end].strip()
    if start > 0:
        snippet = "… " + snippet
    if end < len(content):
        snippet = snippet + " …"
    return snippet


def _build_markdown(title: str, query: str, sources: list[dict[str, Any]]) -> str:
    """Render the deterministic Markdown source packet."""
    timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")

    lines: list[str] = [
        f"# {title}",
        "",
        f"Generated: {timestamp}",
        "",
        f"Query: {query}",
        "",
        "## Sources Reviewed",
        "",
    ]

    if not sources:
        lines.append("_No matching sources found._")
        lines.append("")
    else:
        for i, source in enumerate(sources, start=1):
            source_title = source.get("title") or "Untitled"
            source_url = source.get("url") or ""
            lines.append(f"{i}. [{source_title}]({source_url})")
            lines.append(f"   - Domain: {source.get('domain') or '—'}")
            lines.append(f"   - Category: {source.get('category') or '—'}")
            lines.append(f"   - Published: {_fmt_dt(source.get('published_at'))}")
            lines.append(f"   - Accessed: {_fmt_dt(source.get('accessed_at'))}")
            lines.append("")

    lines.append("## Key Excerpts")
    lines.append("")
    if not sources:
        lines.append("_No excerpts available._")
        lines.append("")
    else:
        for source in sources:
            source_title = source.get("title") or "Untitled"
            source_url = source.get("url") or ""
            excerpt = _extract_excerpt(source.get("content"), query)
            lines.append(f"### {source_title}")
            lines.append("")
            lines.append(f"URL: {source_url}")
            lines.append("")
            lines.append("Excerpt:")
            lines.append("")
            lines.append(excerpt if excerpt else "_No content available._")
            lines.append("")

    lines.append("## Source List")
    lines.append("")
    if not sources:
        lines.append("_No sources._")
    else:
        for source in sources:
            source_title = source.get("title") or "Untitled"
            source_url = source.get("url") or ""
            lines.append(f"- [{source_title}]({source_url})")
    lines.append("")

    return "\n".join(lines)


def _resolve_request(
    job_id: Any, payload: dict[str, Any]
) -> tuple[str, str, str | None, str | None]:
    """Resolve (query, title, category, subcategory) from the job payload.

    Supports both the ``saved_query_id`` form and the direct ``query`` form.
    Raises ValueError with a clear message when the request is invalid.
    """
    saved_query_id = payload.get("saved_query_id")

    if saved_query_id:
        saved_query = db.get_saved_query(saved_query_id)
        if saved_query is None:
            raise ValueError(f"saved_query_id not found: {saved_query_id}")

        query = (saved_query.get("query") or "").strip()
        if not query:
            raise ValueError(f"saved_query {saved_query_id} has an empty query")
        title = saved_query.get("title") or f"Research Report: {query}"
        category = saved_query.get("category")
        subcategory = saved_query.get("subcategory")

        db.write_job_log(
            job_id,
            "info",
            f"Loaded saved query: {title!r}",
            {"saved_query_id": str(saved_query_id)},
        )
        return query, title, category, subcategory

    query = (payload.get("query") or "").strip()
    if not query:
        raise ValueError(
            "generate_report payload missing required field: provide "
            "'query' or 'saved_query_id'"
        )
    title = payload.get("title") or f"Research Report: {query}"
    category = payload.get("category")
    subcategory = payload.get("subcategory")
    return query, title, category, subcategory


def run(job: dict[str, Any]) -> None:
    """Execute a ``generate_report`` job."""
    job_id = job["id"]
    payload: dict[str, Any] = job.get("payload") or {}

    db.write_job_log(job_id, "info", "Report generation started")
    logger.info("[job %s] Report generation started", job_id)

    saved_query_id = payload.get("saved_query_id")
    query, title, category, subcategory = _resolve_request(job_id, payload)

    limit = int(payload.get("limit", _DEFAULT_SOURCE_LIMIT))

    logger.info("[job %s] Searching sources for query=%r", job_id, query)
    sources = db.search_sources(
        query, limit=limit, category=category, subcategory=subcategory
    )
    db.write_job_log(
        job_id,
        "info",
        f"Source search completed: {len(sources)} source(s)",
        {"source_count": len(sources)},
    )

    markdown = _build_markdown(title, query, sources)
    report_id = db.save_report(query=query, title=title, markdown=markdown)

    db.write_job_log(
        job_id,
        "info",
        f"Report saved id={report_id}",
        {"report_id": report_id, "source_count": len(sources)},
    )
    logger.info("[job %s] Saved research report id=%s", job_id, report_id)

    if saved_query_id:
        db.link_query_result(saved_query_id, report_id)
        db.write_job_log(
            job_id,
            "info",
            f"Linked saved query to report id={report_id}",
            {"saved_query_id": str(saved_query_id), "report_id": report_id},
        )
