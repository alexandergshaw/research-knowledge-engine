"""Research worker entrypoint.

Usage::

    # Run forever, polling every 10 s (Railway deployment):
    python -m research_worker.main --poll-interval 10

    # Claim and process a single job then exit:
    python -m research_worker.main --once

Environment variables
---------------------
DATABASE_URL            Required.  Postgres connection string.
WORKER_ID               Optional.  Unique name for this worker instance.
POLL_INTERVAL_SECONDS   Optional.  Overrides --poll-interval (default 10).
FETCH_TIMEOUT_SECONDS   Optional.  HTTP fetch timeout per URL (default 30).
MAX_CONTENT_CHARS       Optional.  Maximum extracted text length (default 100000).
"""

from __future__ import annotations

import argparse
import logging
import os
import signal
import time
import uuid

# Load .env.local / .env only when present (optional for local dev).
try:
    from dotenv import load_dotenv

    load_dotenv(".env.local", override=False)
    load_dotenv(".env", override=False)
except ImportError:
    pass

from research_worker import db
from research_worker.job_runner import process_job
from research_worker.logging_config import configure_logging

logger = logging.getLogger(__name__)

_SHUTDOWN = False


def _handle_signal(signum: int, frame: object) -> None:
    global _SHUTDOWN  # noqa: PLW0603
    logger.info("Received signal %s — shutting down after current job", signum)
    _SHUTDOWN = True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Research knowledge engine worker")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Claim and process one job then exit (useful for testing)",
    )
    parser.add_argument(
        "--poll-interval",
        type=int,
        default=int(os.environ.get("POLL_INTERVAL_SECONDS", "10")),
        metavar="SECONDS",
        help="Seconds to sleep when no jobs are available (default: 10)",
    )
    return parser.parse_args()


def main() -> None:
    configure_logging(os.environ.get("LOG_LEVEL", "INFO"))

    args = parse_args()
    poll_interval = args.poll_interval

    worker_id = os.environ.get("WORKER_ID") or f"worker-{uuid.uuid4().hex[:8]}"
    logger.info("Research worker starting — id=%s poll_interval=%ss", worker_id, poll_interval)

    # Verify database connectivity at startup; exit hard if missing.
    try:
        db.get_connection()
    except RuntimeError as exc:
        logger.critical("Cannot start worker: %s", exc)
        raise SystemExit(1) from exc
    except Exception as exc:
        logger.critical("Database connection failed: %s", exc)
        raise SystemExit(1) from exc

    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)

    logger.info("Worker ready — waiting for jobs")

    while not _SHUTDOWN:
        try:
            job = db.claim_next_job(worker_id)
        except Exception:
            logger.exception("Error claiming job — will retry after %ss", poll_interval)
            time.sleep(poll_interval)
            continue

        if job is None:
            if args.once:
                logger.info("--once: no pending jobs found, exiting")
                break
            logger.debug("No pending jobs — sleeping %ss", poll_interval)
            time.sleep(poll_interval)
            continue

        try:
            process_job(job)
        except Exception:
            logger.exception("Unexpected error processing job id=%s", job.get("id"))

        if args.once:
            break

    logger.info("Worker shut down cleanly")


if __name__ == "__main__":
    main()
