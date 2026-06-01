"""Search locally indexed sources."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from research_engine import DEFAULT_DATABASE_PATH
from research_engine.db import Database
from research_engine.search import search_sources


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query")
    parser.add_argument("--category")
    parser.add_argument("--domain")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--db-path", default=str(DEFAULT_DATABASE_PATH))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    db = Database(args.db_path)
    db.initialize()
    results = search_sources(
        db,
        args.query,
        category=args.category,
        domain=args.domain,
        limit=args.limit,
    )
    for result in results:
        print(result.title)
        print(f"  URL: {result.url}")
        print(f"  Domain: {result.domain}")
        print(f"  Category: {result.category or 'uncategorized'}")
        print(f"  Date: {result.published_at or result.accessed_at or 'unknown'}")
        print(f"  Score: {result.rank:.4f}")
        print(f"  Snippet: {result.snippet or 'No snippet available.'}")
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
