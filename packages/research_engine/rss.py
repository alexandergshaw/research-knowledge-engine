"""RSS feed loading, parsing, and storage."""

from __future__ import annotations

import logging
import time
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

import feedparser
import yaml

from research_engine.db import Database
from research_engine.models import RSSFeedDefinition, RSSFeedsConfig, SourceRecord
from research_engine.web_fetcher import import_url

LOGGER = logging.getLogger(__name__)


def load_rss_config(path: str | Path) -> RSSFeedsConfig:
    """Load RSS feed configuration from YAML."""

    with Path(path).open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return RSSFeedsConfig.model_validate(data)


def _format_struct_time(value: time.struct_time | None) -> str | None:
    if value is None:
        return None
    return datetime(*value[:6], tzinfo=UTC).isoformat()


def parse_feed_entries(parsed_feed: feedparser.FeedParserDict, feed: RSSFeedDefinition) -> list[SourceRecord]:
    """Convert parsed RSS entries into source records."""

    fetched_at = datetime.now(UTC).isoformat()
    parsed_entries: list[SourceRecord] = []
    for entry in parsed_feed.entries:
        url = entry.get("link")
        if not url:
            LOGGER.warning("Skipping RSS entry without a URL in feed %s", feed.name)
            continue

        item_tags = []
        for tag in entry.get("tags", []):
            term = getattr(tag, "term", None)
            if term is None and isinstance(tag, dict):
                term = tag.get("term")
            if term:
                item_tags.append(str(term))

        published_at = _format_struct_time(entry.get("published_parsed"))
        if published_at is None and entry.get("published"):
            published_at = str(entry.get("published"))

        parsed_entries.append(
            SourceRecord(
                title=entry.get("title") or url,
                url=url,
                domain=urlparse(url).netloc.lower().split(":")[0],
                source_type="rss",
                category=feed.category,
                trust_level=None,
                published_at=published_at,
                fetched_at=fetched_at,
                accessed_at=None,
                raw_path=None,
                extracted_text_path=None,
                content=entry.get("summary") or entry.get("description"),
                tags=sorted(set(feed.tags + item_tags)),
            )
        )
    return parsed_entries


def fetch_rss_items(
    *,
    db: Database,
    config_path: str | Path,
    fetch_full_articles: bool = False,
    trusted_sites_path: str | Path | None = None,
    documents_dir: str | Path | None = None,
) -> dict[str, int]:
    """Fetch RSS feeds, store unique items, and optionally import full articles."""

    stats = {"feeds": 0, "new_items": 0, "duplicates": 0, "errors": 0}
    config = load_rss_config(config_path)
    for feed in config.feeds:
        stats["feeds"] += 1
        try:
            parsed_feed = feedparser.parse(str(feed.url))
            if getattr(parsed_feed, "bozo", False):
                LOGGER.warning("Feed parse warning for %s: %s", feed.name, parsed_feed.get("bozo_exception"))

            for item in parse_feed_entries(parsed_feed, feed):
                source_id, created = db.insert_source(item)
                if created:
                    stats["new_items"] += 1
                    if fetch_full_articles and trusted_sites_path and documents_dir:
                        try:
                            import_url(
                                str(item.url),
                                db=db,
                                trusted_sites_path=trusted_sites_path,
                                documents_dir=documents_dir,
                                force=True,
                            )
                        except Exception:  # noqa: BLE001
                            LOGGER.exception("Unable to fetch full article for RSS item: %s", item.url)
                else:
                    stats["duplicates"] += 1
        except Exception:  # noqa: BLE001
            stats["errors"] += 1
            LOGGER.exception("Unable to fetch feed %s", feed.name)
    return stats
