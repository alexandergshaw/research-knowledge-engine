"""Build or update the SQLite full-text search index."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# packages/ directory is three levels up from apps/worker/scripts/
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "packages"))

from research_engine import DEFAULT_DATABASE_PATH
from research_engine.db import Database
from research_engine.indexer import index_new_sources, rebuild_index


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db-path", default=str(DEFAULT_DATABASE_PATH))
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--rebuild", action="store_true")
    mode.add_argument("--new-only", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    db = Database(args.db_path)
    db.initialize()
    count = rebuild_index(db) if args.rebuild else index_new_sources(db)
    print(f"Indexed {count} sources")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
