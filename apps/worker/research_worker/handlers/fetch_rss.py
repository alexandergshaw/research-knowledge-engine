"""Handler for fetch_rss jobs.

Payload schema::

    {}                            # fetch all active feeds
    {"feed_id": "<uuid>"}         # fetch a specific feed

For each RSS item an import_url child job is enqueued so that full article
content is fetched asynchronously.
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlparse

import feedparser

from research_worker import db

logger = logging.getLogger(__name__)


def _extract_domain(url: str) -> str:
    parsed = urlparse(url)
    return (parsed.netloc or parsed.path).lower().split(":")[0]


def _process_feed(job_id: int, feed: dict[str, Any]) -> int:
    """Fetch a single feed and enqueue import_url jobs for each item.

    Returns the number of jobs enqueued.
    """
    feed_url: str = feed["url"]
    feed_name: str = feed.get("name") or feed_url
    category: str | None = feed.get("category")
    feed_tags: list[str] = list(feed.get("tags") or [])

    db.write_job_log(job_id, "info", f"Fetching feed: {feed_name}", {"url": feed_url})
    logger.info("[job %s] Fetching RSS feed: %s", job_id, feed_url)

    parsed = feedparser.parse(feed_url)
    if getattr(parsed, "bozo", False):
        bozo_exc = getattr(parsed, "bozo_exception", None)
        logger.warning("[job %s] Feed parse warning for %s: %s", job_id, feed_name, bozo_exc)

    enqueued = 0
    for entry in parsed.entries:
        item_url: str | None = entry.get("link")
        if not item_url:
            continue

        item_tags: list[str] = []
        for tag in entry.get("tags", []):
            term = getattr(tag, "term", None) or (tag.get("term") if isinstance(tag, dict) else None)
            if term:
                item_tags.append(str(term))

        merged_tags = sorted(set(feed_tags + item_tags))

        db.insert_job(
            "import_url",
            {
                "url": item_url,
                "category": category,
                "tags": merged_tags,
            },
        )
        enqueued += 1

    db.update_feed_last_fetched(int(feed["id"]))
    db.write_job_log(
        job_id,
        "info",
        f"Enqueued {enqueued} import_url jobs for feed {feed_name}",
        {"feed_id": feed["id"], "enqueued": enqueued},
    )
    logger.info("[job %s] Enqueued %s import_url jobs for %s", job_id, enqueued, feed_name)
    return enqueued


def run(job: dict[str, Any]) -> None:
    """Execute a fetch_rss job."""
    job_id: int = job["id"]
    payload: dict[str, Any] = job.get("payload") or {}

    feed_id: str | None = payload.get("feed_id")

    if feed_id:
        feed = db.get_feed_by_id(feed_id)
        if feed is None:
            raise ValueError(f"Feed not found: feed_id={feed_id}")
        feeds = [feed]
    else:
        feeds = db.list_active_feeds()
        db.write_job_log(job_id, "info", f"Processing {len(feeds)} active feeds")
        logger.info("[job %s] Processing %s active feeds", job_id, len(feeds))

    total_enqueued = 0
    errors = 0
    for feed in feeds:
        try:
            total_enqueued += _process_feed(job_id, feed)
        except Exception:
            errors += 1
            logger.exception("[job %s] Error processing feed id=%s", job_id, feed.get("id"))
            db.write_job_log(
                job_id,
                "error",
                f"Error processing feed id={feed.get('id')}",
                {"feed_id": str(feed.get("id"))},
            )

    db.write_job_log(
        job_id,
        "info",
        f"fetch_rss complete: enqueued={total_enqueued} errors={errors}",
        {"total_enqueued": total_enqueued, "errors": errors},
    )
