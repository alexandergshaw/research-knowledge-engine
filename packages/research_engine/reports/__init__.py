"""Research report generation for the research engine.

Phase 1 implementation (Markdown report over SQLite FTS results) lives directly
in this module.

TODO:
- Add reports.pdf for PDF export (Phase 4+)
- Add reports.citation for BibTeX / RIS citation export
- Add reports.api for report delivery via REST API (Phase 5)
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
import re

from research_engine.db import Database
from research_engine.search import search_sources


def _slugify(value: str) -> str:
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", value.lower())).strip("-")


def generate_research_report(
    db: Database,
    query: str,
    *,
    limit: int = 10,
    output_dir: str | Path,
) -> Path:
    """Generate a Markdown report for a research query."""

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    results = search_sources(db, query, limit=limit)
    timestamp = datetime.now(UTC).isoformat()
    file_path = output_path / f"{_slugify(query)}-report.md"

    lines = [
        f"# Research Report: {query}",
        "",
        f"- Query: `{query}`",
        f"- Generated: {timestamp}",
        f"- Sources included: {len(results)}",
        "",
        "## Top sources",
        "",
    ]

    for index, result in enumerate(results, start=1):
        lines.extend(
            [
                f"### {index}. {result.title}",
                f"- URL: {result.url}",
                f"- Domain: {result.domain}",
                f"- Category: {result.category or 'uncategorized'}",
                f"- Date: {result.published_at or result.accessed_at or 'unknown'}",
                f"- Tags: {', '.join(result.tags) if result.tags else 'none'}",
                f"- Excerpt: {result.snippet or 'No snippet available.'}",
                "",
            ]
        )

    lines.extend(["## Bibliography", ""])
    for result in results:
        lines.append(
            f"- {result.title}. {result.domain}. {result.published_at or result.accessed_at or 'n.d.'}. {result.url}"
        )

    file_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return file_path
