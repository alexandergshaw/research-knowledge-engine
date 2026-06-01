"""Fetch configured RSS feeds and store them locally."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

# packages/ directory is three levels up from apps/worker/scripts/
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "packages"))

from research_engine import DEFAULT_DATABASE_PATH, DEFAULT_DOCUMENTS_PATH, DEFAULT_RSS_CONFIG_PATH, DEFAULT_TRUSTED_SITES_PATH
from research_engine.db import Database
from research_engine.rss import fetch_rss_items


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config-path", default=str(DEFAULT_RSS_CONFIG_PATH))
    parser.add_argument("--trusted-sites-path", default=str(DEFAULT_TRUSTED_SITES_PATH))
    parser.add_argument("--documents-dir", default=str(DEFAULT_DOCUMENTS_PATH))
    parser.add_argument("--db-path", default=str(DEFAULT_DATABASE_PATH))
    parser.add_argument("--fetch-full-articles", action="store_true")
    return parser.parse_args()


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    args = parse_args()
    db = Database(args.db_path)
    db.initialize()
    stats = fetch_rss_items(
        db=db,
        config_path=args.config_path,
        fetch_full_articles=args.fetch_full_articles,
        trusted_sites_path=args.trusted_sites_path,
        documents_dir=args.documents_dir,
    )
    print(
        f"Processed {stats['feeds']} feeds | new items: {stats['new_items']} | "
        f"duplicates: {stats['duplicates']} | errors: {stats['errors']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
