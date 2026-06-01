"""Full-text search helpers."""

from __future__ import annotations

import json

from research_engine.db import Database
from research_engine.models import SearchResult


def search_sources(
    db: Database,
    query: str,
    *,
    category: str | None = None,
    domain: str | None = None,
    limit: int = 10,
) -> list[SearchResult]:
    """Run an FTS query over indexed sources."""

    sql = """
        SELECT
            s.title,
            s.url,
            s.domain,
            s.category,
            s.published_at,
            s.accessed_at,
            snippet(search_index, 1, '[', ']', '...', 18) AS snippet,
            bm25(search_index, 10.0, 1.0, 2.0, 3.0, 3.0) AS rank,
            s.tags
        FROM search_index
        JOIN sources AS s ON s.id = search_index.rowid
        WHERE search_index MATCH ?
          AND (? IS NULL OR s.category = ?)
          AND (? IS NULL OR s.domain = ? OR s.domain LIKE '%.' || ?)
        ORDER BY rank
        LIMIT ?
    """

    with db.connect() as connection:
        rows = connection.execute(
            sql,
            (query, category, category, domain, domain, domain, limit),
        ).fetchall()

    return [
        SearchResult(
            title=row["title"],
            url=row["url"],
            domain=row["domain"],
            category=row["category"],
            published_at=row["published_at"],
            accessed_at=row["accessed_at"],
            snippet=row["snippet"],
            rank=float(row["rank"]),
            tags=json.loads(row["tags"] or "[]"),
        )
        for row in rows
    ]
