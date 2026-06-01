"""Database access layer for the research worker.

Connects to Supabase Postgres via DATABASE_URL using psycopg (v3).

Expected schema columns used by this module:

  jobs:
    id, job_type, payload (JSONB), status, error,
    created_at, started_at, finished_at, retry_count,
    priority (INT, optional — defaults to 0 when absent),
    locked_at (TIMESTAMPTZ, optional),
    locked_by (TEXT, optional)

  job_logs:
    id, job_id, level, message, metadata (JSONB), created_at

  sources:
    id, title, url, domain, source_type, category,
    trust_level, published_at, fetched_at, accessed_at,
    content, tags (TEXT[])

  feeds:
    id, name, url, category, tags (TEXT[]), enabled,
    last_fetched_at, created_at

  research_reports:
    id, query, title, content, source_ids (BIGINT[]), created_at
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import psycopg
from psycopg.rows import dict_row

logger = logging.getLogger(__name__)

_connection: psycopg.Connection | None = None


def get_connection() -> psycopg.Connection:
    """Return a reusable psycopg connection, reconnecting if closed."""
    global _connection  # noqa: PLW0603
    if _connection is None or _connection.closed:
        url = os.environ.get("DATABASE_URL")
        if not url:
            raise RuntimeError("DATABASE_URL environment variable is not set")
        _connection = psycopg.connect(url, row_factory=dict_row, autocommit=True)
        logger.info("Database connection established")
    return _connection


# ---------------------------------------------------------------------------
# Job queue
# ---------------------------------------------------------------------------


def claim_next_job(worker_id: str) -> dict[str, Any] | None:
    """Claim the next pending job using SELECT FOR UPDATE SKIP LOCKED.

    Returns the claimed job row as a dict, or None if the queue is empty.

    The UPDATE is expressed as a single statement so it remains atomic in
    autocommit mode.  Optional columns (priority, locked_at, locked_by) are
    set only when they exist in the table; a missing column causes psycopg to
    raise ProgrammingError which is caught and the query is retried without
    those columns.
    """
    conn = get_connection()
    try:
        return _claim_with_optional_cols(conn, worker_id)
    except psycopg.errors.UndefinedColumn:
        logger.debug(
            "priority/locked_at/locked_by columns absent — retrying with minimal claim query"
        )
        return _claim_minimal(conn, worker_id)


def _claim_with_optional_cols(
    conn: psycopg.Connection, worker_id: str
) -> dict[str, Any] | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE jobs
            SET
                status      = 'running',
                retry_count = retry_count + 1,
                started_at  = NOW(),
                locked_at   = NOW(),
                locked_by   = %s
            WHERE id = (
                SELECT id FROM jobs
                WHERE status = 'pending'
                -- COALESCE handles rows where priority is NULL.
                -- For optimal index usage add: ALTER TABLE jobs ALTER COLUMN priority SET DEFAULT 0;
                -- then a partial index: CREATE INDEX ON jobs (priority, created_at) WHERE status='pending';
                ORDER BY COALESCE(priority, 0) ASC, created_at ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING *
            """,
            (worker_id,),
        )
        return cur.fetchone()


def _claim_minimal(
    conn: psycopg.Connection, worker_id: str
) -> dict[str, Any] | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE jobs
            SET
                status      = 'running',
                retry_count = retry_count + 1,
                started_at  = NOW()
            WHERE id = (
                SELECT id FROM jobs
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING *
            """
        )
        return cur.fetchone()


def mark_job_completed(job_id: int) -> None:
    """Set job status to done and record finish time."""
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE jobs SET status = 'done', finished_at = NOW() WHERE id = %s",
            (job_id,),
        )


def mark_job_failed(job_id: int, error_message: str) -> None:
    """Set job status to failed and record the error."""
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE jobs
            SET status = 'failed', error = %s, finished_at = NOW()
            WHERE id = %s
            """,
            (error_message, job_id),
        )


def write_job_log(
    job_id: int,
    level: str,
    message: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Insert a row into job_logs.  Silently skips if the table does not exist."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO job_logs (job_id, level, message, metadata)
                VALUES (%s, %s, %s, %s)
                """,
                (job_id, level.upper(), message, json.dumps(metadata or {})),
            )
    except psycopg.errors.UndefinedTable:
        logger.warning("job_logs table not found — skipping log write for job %s", job_id)


# ---------------------------------------------------------------------------
# Sources
# ---------------------------------------------------------------------------


def upsert_source(source_data: dict[str, Any]) -> int:
    """Insert or update a source row.  Returns the source id."""
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO sources (
                title, url, domain, source_type, category, trust_level,
                published_at, fetched_at, accessed_at, content, tags
            ) VALUES (
                %(title)s, %(url)s, %(domain)s, %(source_type)s,
                %(category)s, %(trust_level)s,
                %(published_at)s, %(fetched_at)s, NOW(),
                %(content)s, %(tags)s
            )
            ON CONFLICT (url) DO UPDATE SET
                title       = EXCLUDED.title,
                content     = EXCLUDED.content,
                accessed_at = EXCLUDED.accessed_at,
                fetched_at  = EXCLUDED.fetched_at,
                tags        = EXCLUDED.tags
            RETURNING id
            """,
            {
                "title": source_data.get("title", "Untitled"),
                "url": source_data["url"],
                "domain": source_data.get("domain", ""),
                "source_type": source_data.get("source_type", "web"),
                "category": source_data.get("category"),
                "trust_level": source_data.get("trust_level"),
                "published_at": source_data.get("published_at"),
                "fetched_at": source_data.get("fetched_at"),
                "content": source_data.get("content"),
                "tags": source_data.get("tags", []),
            },
        )
        row = cur.fetchone()
        return int(row["id"])


# ---------------------------------------------------------------------------
# Feeds
# ---------------------------------------------------------------------------


def list_active_feeds() -> list[dict[str, Any]]:
    """Return all feeds where enabled = true."""
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM feeds WHERE enabled = TRUE ORDER BY created_at ASC")
        return cur.fetchall()


def get_feed_by_id(feed_id: str) -> dict[str, Any] | None:
    """Return a single feed row by id, or None."""
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM feeds WHERE id = %s", (feed_id,))
        return cur.fetchone()


def update_feed_last_fetched(feed_id: int) -> None:
    """Stamp last_fetched_at = NOW() on a feed row."""
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE feeds SET last_fetched_at = NOW() WHERE id = %s",
            (feed_id,),
        )


# ---------------------------------------------------------------------------
# Research reports
# ---------------------------------------------------------------------------


def save_research_report(report_data: dict[str, Any]) -> int:
    """Insert a research report and return its id."""
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO research_reports (query, title, content, source_ids)
            VALUES (%(query)s, %(title)s, %(content)s, %(source_ids)s)
            RETURNING id
            """,
            {
                "query": report_data["query"],
                "title": report_data.get("title", report_data["query"]),
                "content": report_data["content"],
                "source_ids": report_data.get("source_ids", []),
            },
        )
        row = cur.fetchone()
        return int(row["id"])


def search_sources(query: str, limit: int = 10) -> list[dict[str, Any]]:
    """Full-text search over the sources table using Postgres tsvector."""
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                id, title, url, domain, category, content,
                ts_rank(
                    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '')),
                    plainto_tsquery('english', %s)
                ) AS rank
            FROM sources
            WHERE
                to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
                @@ plainto_tsquery('english', %s)
            ORDER BY rank DESC
            LIMIT %s
            """,
            (query, query, limit),
        )
        return cur.fetchall()


# ---------------------------------------------------------------------------
# Job insertion (used by handlers that enqueue child jobs)
# ---------------------------------------------------------------------------


def insert_job(job_type: str, payload: dict[str, Any]) -> int:
    """Insert a new pending job and return its id."""
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO jobs (job_type, payload, status)
            VALUES (%s, %s, 'pending')
            RETURNING id
            """,
            (job_type, json.dumps(payload)),
        )
        row = cur.fetchone()
        return int(row["id"])
