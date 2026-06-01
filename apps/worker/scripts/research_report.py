"""Generate a Markdown research report from indexed sources."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# packages/ directory is three levels up from apps/worker/scripts/
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "packages"))

from research_engine import DEFAULT_DATABASE_PATH, DEFAULT_EXPORTS_PATH
from research_engine.db import Database
from research_engine.reports import generate_research_report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--db-path", default=str(DEFAULT_DATABASE_PATH))
    parser.add_argument("--output-dir", default=str(DEFAULT_EXPORTS_PATH))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    db = Database(args.db_path)
    db.initialize()
    report_path = generate_research_report(
        db,
        args.query,
        limit=args.limit,
        output_dir=args.output_dir,
    )
    print(report_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
