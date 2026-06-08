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

  report_sources:
    report_id (BIGINT), source_id (BIGINT), rank (INT), created_at
"""

from __future__ import annotations

import json
import logging
import os
import uuid
from functools import lru_cache
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


@lru_cache(maxsize=None)
def _table_columns(table_name: str) -> frozenset[str]:
    """Return the set of column names for a table (cached for the process).

    Used to adapt queries to schema variants — e.g. whether ``sources`` has a
    ``search_vector`` or ``subcategory`` column, or whether ``research_reports``
    stores its body in ``markdown`` or the legacy ``content`` column.
    """
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = %s
            """,
            (table_name,),
        )
        return frozenset(row["column_name"] for row in cur.fetchall())


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


def search_sources(
    query: str,
    limit: int = 10,
    category: str | None = None,
    subcategory: str | None = None,
) -> list[dict[str, Any]]:
    """Full-text search over the sources table.

    Ranks rows with ``ts_rank`` against ``plainto_tsquery('english', query)``.
    Prefers the precomputed ``search_vector`` column when present, otherwise
    falls back to a tsvector computed on the fly from title + content.

    Optional ``category`` / ``subcategory`` filters are applied only when the
    corresponding columns exist on the sources table, so a missing
    ``subcategory`` column is ignored safely.

    Results are ordered by rank (desc), then most-recent published / accessed.
    """
    conn = get_connection()
    cols = _table_columns("sources")

    if "search_vector" in cols:
        rank_expr = "ts_rank(search_vector, plainto_tsquery('english', %(q)s))"
        match_expr = "search_vector @@ plainto_tsquery('english', %(q)s)"
    else:
        computed = (
            "to_tsvector('english', "
            "COALESCE(title, '') || ' ' || COALESCE(content, ''))"
        )
        rank_expr = f"ts_rank({computed}, plainto_tsquery('english', %(q)s))"
        match_expr = f"{computed} @@ plainto_tsquery('english', %(q)s)"

    select_cols = ["id", "title", "url", "domain", "category", "content"]
    for optional in ("subcategory", "source_type", "trust_level", "published_at", "accessed_at"):
        if optional in cols:
            select_cols.append(optional)

    where_clauses = [match_expr]
    params: dict[str, Any] = {"q": query, "limit": limit}

    if category and "category" in cols:
        where_clauses.append("category = %(category)s")
        params["category"] = category
    if subcategory and "subcategory" in cols:
        where_clauses.append("subcategory = %(subcategory)s")
        params["subcategory"] = subcategory

    order_clauses = [f"{rank_expr} DESC"]
    if "published_at" in cols:
        order_clauses.append("published_at DESC NULLS LAST")
    if "accessed_at" in cols:
        order_clauses.append("accessed_at DESC NULLS LAST")

    sql = (
        f"SELECT {', '.join(select_cols)}, {rank_expr} AS rank\n"
        f"FROM sources\n"
        f"WHERE {' AND '.join(where_clauses)}\n"
        f"ORDER BY {', '.join(order_clauses)}\n"
        f"LIMIT %(limit)s"
    )

    with conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


# ---------------------------------------------------------------------------
# Saved queries & report linkage
# ---------------------------------------------------------------------------


def get_saved_query(saved_query_id: str) -> dict[str, Any] | None:
    """Return a single saved_queries row by id, or None if not found.

    Returns None for malformed ids (e.g. a non-UUID placeholder) instead of
    raising a raw psycopg ``InvalidTextRepresentation``, so callers can surface
    a clean "not found" error.
    """
    try:
        normalized_id = str(uuid.UUID(str(saved_query_id)))
    except (ValueError, AttributeError, TypeError):
        return None

    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM saved_queries WHERE id = %s", (normalized_id,))
        return cur.fetchone()


def save_report(
    query: str,
    title: str,
    markdown: str,
    source_ids: list[int] | None = None,
) -> int:
    """Insert a research report and return its (bigint) id.

    Adapts to the table schema: writes the body to ``markdown`` and/or the
    legacy ``content`` column, whichever exist, and records ``source_ids`` when
    that column is present. ``research_reports.id`` is a bigint, so the returned
    value is an int.
    """
    conn = get_connection()
    cols = _table_columns("research_reports")

    insert_cols = ["query", "title"]
    values: dict[str, Any] = {"query": query, "title": title}

    if "markdown" in cols:
        insert_cols.append("markdown")
        values["markdown"] = markdown
    if "content" in cols:
        insert_cols.append("content")
        values["content"] = markdown
    if "source_ids" in cols:
        insert_cols.append("source_ids")
        values["source_ids"] = [int(s) for s in (source_ids or [])]

    placeholders = ", ".join(f"%({col})s" for col in insert_cols)
    sql = (
        f"INSERT INTO research_reports ({', '.join(insert_cols)}) "
        f"VALUES ({placeholders}) RETURNING id"
    )
    with conn.cursor() as cur:
        cur.execute(sql, values)
        row = cur.fetchone()
        return int(row["id"])


def insert_report_sources(report_id: int, source_ids: list[int]) -> None:
    """Record which sources were used to build a report.

    Inserts one row per source into ``report_sources`` (report_id, source_id,
    rank). When the table is absent (older schemas) the insert is skipped so
    report generation never fails for lack of traceability storage. Ordering of
    ``source_ids`` is preserved as the 1-based ``rank``.

    The insert is attempted directly and a missing table is detected from the
    database error, rather than from cached ``information_schema`` metadata.
    This avoids permanently disabling linkage when the worker process started
    before the ``report_sources`` migration was applied (the schema-column
    cache would otherwise stay empty for the lifetime of the process).
    """
    if not source_ids:
        return

    conn = get_connection()
    rows = [
        (int(report_id), int(source_id), rank)
        for rank, source_id in enumerate(source_ids, start=1)
    ]
    try:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO report_sources (report_id, source_id, rank)
                VALUES (%s, %s, %s)
                ON CONFLICT (report_id, source_id) DO NOTHING
                """,
                rows,
            )
    except psycopg.errors.UndefinedTable:
        logger.warning(
            "report_sources table not found — skipping source linkage for report %s. "
            "Apply the report_sources migration to enable report→source traceability.",
            report_id,
        )


def recent_sources_by_category(
    category: str | None = None,
    days: int = 7,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Return the most recent sources, optionally filtered by category.

    Used by the weekly_digest handler. Orders by most-recent published /
    accessed time so the digest highlights fresh material. Falls back to all
    categories when ``category`` is None or the column is absent.
    """
    conn = get_connection()
    cols = _table_columns("sources")

    select_cols = ["id", "title", "url", "domain", "category", "content"]
    for optional in ("subcategory", "source_type", "trust_level", "published_at", "accessed_at"):
        if optional in cols:
            select_cols.append(optional)

    where_clauses: list[str] = []
    params: dict[str, Any] = {"limit": limit}

    if category and "category" in cols:
        where_clauses.append("category = %(category)s")
        params["category"] = category

    # Restrict to recent items when a usable timestamp column exists.
    recency_col = (
        "published_at" if "published_at" in cols
        else "accessed_at" if "accessed_at" in cols
        else None
    )
    if recency_col and days > 0:
        # ``days`` is an int we control, inlined safely via make_interval.
        where_clauses.append(
            f"COALESCE({recency_col}, NOW()) >= NOW() - make_interval(days => {int(days)})"
        )

    order_clauses = []
    if "published_at" in cols:
        order_clauses.append("published_at DESC NULLS LAST")
    if "accessed_at" in cols:
        order_clauses.append("accessed_at DESC NULLS LAST")
    order_clauses.append("id DESC")

    sql = f"SELECT {', '.join(select_cols)}\nFROM sources\n"
    if where_clauses:
        sql += f"WHERE {' AND '.join(where_clauses)}\n"
    sql += f"ORDER BY {', '.join(order_clauses)}\nLIMIT %(limit)s"

    with conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def link_query_result(saved_query_id: str, report_id: int) -> None:
    """Link a saved query to a generated report via query_results.

    ``query_results.report_id`` is a bigint referencing
    ``research_reports.id``, so ``report_id`` is inserted as an int.
    """
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO query_results (saved_query_id, report_id)
            VALUES (%s, %s)
            """,
            (saved_query_id, int(report_id)),
        )



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
