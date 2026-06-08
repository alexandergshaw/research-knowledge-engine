"""Handler for ``weekly_digest`` jobs.

Builds a deterministic Markdown digest of the most recent sources in a
category. Like ``generate_report``, this uses NO LLMs, embeddings, or external
AI APIs — it is a curated "source packet" assembled from stored metadata and
verbatim excerpts.

Payload schemas (either form is accepted)::

    {"digest": "ai"}          # preset: ai | cyber | software | education

or::

    {
        "category": "ai",     # any source category key
        "title": "AI Weekly",  # optional display title
        "days": 7,             # look-back window (default 7)
        "limit": 10            # max sources (default 10)
    }
"""

from __future__ import annotations

import logging
import re
from collections import Counter
from datetime import UTC, datetime
from typing import Any

from research_worker import db

logger = logging.getLogger(__name__)

_MAX_EXCERPT_CHARS = 400
_DEFAULT_LIMIT = 10
_DEFAULT_DAYS = 7

# Preset digests map a short key to a display title and source category.
_DIGEST_PRESETS: dict[str, dict[str, str]] = {
    "ai": {"title": "AI Weekly", "category": "ai"},
    "cyber": {"title": "Cyber Weekly", "category": "cybersecurity"},
    "software": {"title": "Software Weekly", "category": "software"},
    "education": {"title": "Education Weekly", "category": "education"},
}


def _fmt_dt(value: Any) -> str:
    if value is None or value == "":
        return "—"
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    return str(value)


def _first_excerpt(content: str | None, max_chars: int = _MAX_EXCERPT_CHARS) -> str:
    """Return the first ``max_chars`` of content, trimmed at a word boundary."""
    if not content:
        return ""
    text = re.sub(r"\s+", " ", content).strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + " …"


def _resolve_request(payload: dict[str, Any]) -> tuple[str, str | None, int, int]:
    """Resolve (title, category, days, limit) from the payload."""
    preset_key = payload.get("digest")
    if preset_key:
        preset = _DIGEST_PRESETS.get(str(preset_key).lower())
        if preset is None:
            valid = ", ".join(sorted(_DIGEST_PRESETS))
            raise ValueError(
                f"unknown digest preset: {preset_key!r} (valid: {valid})"
            )
        title = payload.get("title") or preset["title"]
        category = preset["category"]
    else:
        category = payload.get("category")
        if not category:
            raise ValueError(
                "weekly_digest payload missing required field: provide "
                "'digest' (preset) or 'category'"
            )
        title = payload.get("title") or f"{category.title()} Weekly"

    days = int(payload.get("days", _DEFAULT_DAYS))
    limit = int(payload.get("limit", _DEFAULT_LIMIT))
    return title, category, days, limit


def _build_markdown(
    title: str, category: str | None, days: int, sources: list[dict[str, Any]]
) -> str:
    timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")

    lines: list[str] = [
        f"# Weekly Digest: {title}",
        "",
        f"Generated: {timestamp}",
        "",
        f"Category: {category or 'all'} · Window: last {days} day(s) · "
        f"{len(sources)} source(s)",
        "",
    ]

    # ---- Top Sources (by domain frequency) --------------------------------
    lines.append("## Top Sources")
    lines.append("")
    if not sources:
        lines.append("_No sources in this window._")
        lines.append("")
    else:
        domain_counts = Counter(
            (s.get("domain") or "unknown") for s in sources
        )
        for domain, count in domain_counts.most_common(5):
            label = "article" if count == 1 else "articles"
            lines.append(f"- **{domain}** — {count} {label}")
        lines.append("")

    # ---- Top Articles -----------------------------------------------------
    lines.append("## Top Articles")
    lines.append("")
    if not sources:
        lines.append("_No articles in this window._")
        lines.append("")
    else:
        for i, source in enumerate(sources, start=1):
            source_title = source.get("title") or "Untitled"
            url = source.get("url") or ""
            published = _fmt_dt(source.get("published_at"))
            lines.append(f"{i}. [{source_title}]({url}) — {source.get('domain') or '—'} ({published})")
        lines.append("")

    # ---- Key Excerpts -----------------------------------------------------
    lines.append("## Key Excerpts")
    lines.append("")
    if not sources:
        lines.append("_No excerpts available._")
        lines.append("")
    else:
        for source in sources:
            source_title = source.get("title") or "Untitled"
            excerpt = _first_excerpt(source.get("content"))
            lines.append(f"### {source_title}")
            lines.append("")
            lines.append(excerpt if excerpt else "_No content available._")
            lines.append("")

    # ---- Links ------------------------------------------------------------
    lines.append("## Links")
    lines.append("")
    if not sources:
        lines.append("_No links._")
    else:
        for source in sources:
            source_title = source.get("title") or "Untitled"
            url = source.get("url") or ""
            lines.append(f"- [{source_title}]({url})")
    lines.append("")

    return "\n".join(lines)


def run(job: dict[str, Any]) -> None:
    """Execute a ``weekly_digest`` job."""
    job_id = job["id"]
    payload: dict[str, Any] = job.get("payload") or {}

    db.write_job_log(job_id, "info", "Weekly digest started")
    logger.info("[job %s] Weekly digest started", job_id)

    title, category, days, limit = _resolve_request(payload)

    sources = db.recent_sources_by_category(category=category, days=days, limit=limit)
    db.write_job_log(
        job_id,
        "info",
        f"Collected {len(sources)} source(s) for digest",
        {"category": category, "days": days, "source_count": len(sources)},
    )

    markdown = _build_markdown(title, category, days, sources)
    source_ids = [int(s["id"]) for s in sources if s.get("id") is not None]
    report_query = f"weekly_digest:{category or 'all'}"
    report_id = db.save_report(
        query=report_query,
        title=f"{title} — {datetime.now(UTC).strftime('%Y-%m-%d')}",
        markdown=markdown,
        source_ids=source_ids,
    )

    if source_ids:
        db.insert_report_sources(report_id, source_ids)

    db.write_job_log(
        job_id,
        "info",
        f"Digest saved id={report_id}",
        {"report_id": report_id, "source_count": len(sources)},
    )
    logger.info("[job %s] Saved weekly digest id=%s", job_id, report_id)
