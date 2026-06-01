"""Handler for reindex_sources jobs.

The sources table uses a Postgres trigger to maintain a search_vector
tsvector column.  Touching updated_at (or accessed_at if updated_at is
absent) causes the trigger to re-run, refreshing the index without
requiring a full table rebuild.

Payload schema::

    {}   # no parameters required
"""

from __future__ import annotations

import logging
from typing import Any

from research_worker import db

logger = logging.getLogger(__name__)


def run(job: dict[str, Any]) -> None:
    """Execute a reindex_sources job."""
    job_id: int = job["id"]

    db.write_job_log(job_id, "info", "Starting trigger-backed reindex of sources")
    logger.info("[job %s] Reindexing sources via trigger", job_id)

    conn = db.get_connection()
    # The connection uses autocommit=True (set in db.get_connection()), so each
    # statement runs in its own implicit transaction.  A failed execute() does
    # not leave the connection in an error state and no explicit rollback is
    # required before issuing the fallback query.
    with conn.cursor() as cur:
        # Touch accessed_at to fire the search_vector trigger on every row.
        # If the table has an updated_at column the trigger may prefer that;
        # falling back to accessed_at (which exists in the baseline schema)
        # ensures the query works either way.
        try:
            cur.execute("UPDATE sources SET updated_at = NOW()")
            count = cur.rowcount
            col_used = "updated_at"
        except Exception:  # column may not exist
            cur.execute("UPDATE sources SET accessed_at = NOW()")
            count = cur.rowcount
            col_used = "accessed_at"

    db.write_job_log(
        job_id,
        "info",
        f"Trigger-backed indexing refreshed for {count} sources via {col_used}",
        {"updated_rows": count, "column": col_used},
    )
    logger.info(
        "[job %s] Reindex complete: touched %s rows via %s", job_id, count, col_used
    )
