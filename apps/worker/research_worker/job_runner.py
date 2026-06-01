"""Job dispatcher: routes a claimed job to the correct handler."""

from __future__ import annotations

import logging
from typing import Any

from research_worker import db
from research_worker.handlers import fetch_rss, generate_report, import_url, reindex_sources

logger = logging.getLogger(__name__)

_HANDLERS = {
    "import_url": import_url.run,
    "fetch_rss": fetch_rss.run,
    "generate_report": generate_report.run,
    "reindex_sources": reindex_sources.run,
}


def process_job(job: dict[str, Any]) -> None:
    """Dispatch a job to its handler and mark it completed or failed."""
    job_id: int = job["id"]
    job_type: str = job.get("job_type", "")

    handler = _HANDLERS.get(job_type)
    if handler is None:
        message = f"Unknown job type: {job_type!r}"
        logger.error("[job %s] %s", job_id, message)
        db.write_job_log(job_id, "error", message)
        db.mark_job_failed(job_id, message)
        return

    logger.info("[job %s] Starting handler for job_type=%s", job_id, job_type)
    db.write_job_log(job_id, "info", f"Starting job type={job_type}")

    try:
        handler(job)
        db.mark_job_completed(job_id)
        db.write_job_log(job_id, "info", "Job completed successfully")
        logger.info("[job %s] Completed successfully", job_id)
    except Exception as exc:
        error_message = f"{type(exc).__name__}: {exc}"
        logger.exception("[job %s] Handler raised an exception", job_id)
        db.write_job_log(job_id, "error", error_message)
        db.mark_job_failed(job_id, error_message)
