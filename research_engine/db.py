"""SQLite database helpers for the research knowledge engine."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Mapping

from research_engine.models import SourceRecord


class Database:
    """Thin wrapper around the SQLite database."""

    def __init__(self, db_path: str | Path) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def connect(self) -> sqlite3.Connection:
        """Open a new SQLite connection."""

        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self) -> None:
        """Create the application tables if they do not exist."""

        with self.connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS sources (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    url TEXT NOT NULL UNIQUE,
                    domain TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    category TEXT,
                    trust_level TEXT,
                    published_at TEXT,
                    fetched_at TEXT,
                    accessed_at TEXT,
                    raw_path TEXT,
                    extracted_text_path TEXT,
                    content TEXT,
                    tags TEXT NOT NULL DEFAULT '[]'
                )
                """
            )
            connection.execute(
                """
                CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
                    title,
                    content,
                    tags,
                    category,
                    domain
                )
                """
            )

    def get_source_by_url(self, url: str) -> sqlite3.Row | None:
        """Fetch a source row by URL."""

        with self.connect() as connection:
            return connection.execute(
                "SELECT * FROM sources WHERE url = ?",
                (url,),
            ).fetchone()

    def insert_source(self, source: SourceRecord | Mapping[str, Any]) -> tuple[int, bool]:
        """Insert a source record unless the URL already exists."""

        payload = source.model_dump() if isinstance(source, SourceRecord) else dict(source)
        existing = self.get_source_by_url(str(payload["url"]))
        if existing:
            return int(existing["id"]), False

        tags = payload.get("tags") or []
        with self.connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO sources (
                    title,
                    url,
                    domain,
                    source_type,
                    category,
                    trust_level,
                    published_at,
                    fetched_at,
                    accessed_at,
                    raw_path,
                    extracted_text_path,
                    content,
                    tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload["title"],
                    str(payload["url"]),
                    payload["domain"],
                    payload["source_type"],
                    payload.get("category"),
                    payload.get("trust_level"),
                    payload.get("published_at"),
                    payload.get("fetched_at"),
                    payload.get("accessed_at"),
                    payload.get("raw_path"),
                    payload.get("extracted_text_path"),
                    payload.get("content"),
                    json.dumps(tags),
                ),
            )
            return int(cursor.lastrowid), True

    def update_source_content(
        self,
        source_id: int,
        *,
        title: str | None = None,
        accessed_at: str | None = None,
        raw_path: str | None = None,
        extracted_text_path: str | None = None,
        content: str | None = None,
    ) -> None:
        """Update content-related fields for an existing source."""

        with self.connect() as connection:
            connection.execute(
                """
                UPDATE sources
                SET title = COALESCE(?, title),
                    accessed_at = COALESCE(?, accessed_at),
                    raw_path = COALESCE(?, raw_path),
                    extracted_text_path = COALESCE(?, extracted_text_path),
                    content = COALESCE(?, content)
                WHERE id = ?
                """,
                (title, accessed_at, raw_path, extracted_text_path, content, source_id),
            )

    def rebuild_search_index(self) -> int:
        """Rebuild the full-text index from all stored sources."""

        with self.connect() as connection:
            connection.execute("DELETE FROM search_index")
            connection.execute(
                """
                INSERT INTO search_index (rowid, title, content, tags, category, domain)
                SELECT
                    id,
                    title,
                    COALESCE(content, ''),
                    COALESCE(tags, '[]'),
                    COALESCE(category, ''),
                    domain
                FROM sources
                """
            )
            return int(connection.execute("SELECT COUNT(*) FROM search_index").fetchone()[0])

    def index_new_sources(self) -> int:
        """Insert newly added sources into the full-text index."""

        with self.connect() as connection:
            before_count = int(connection.execute("SELECT COUNT(*) FROM search_index").fetchone()[0])
            connection.execute(
                """
                INSERT INTO search_index (rowid, title, content, tags, category, domain)
                SELECT
                    s.id,
                    s.title,
                    COALESCE(s.content, ''),
                    COALESCE(s.tags, '[]'),
                    COALESCE(s.category, ''),
                    s.domain
                FROM sources AS s
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM search_index AS i
                    WHERE i.rowid = s.id
                )
                """
            )
            after_count = int(connection.execute("SELECT COUNT(*) FROM search_index").fetchone()[0])
            return max(after_count - before_count, 0)
