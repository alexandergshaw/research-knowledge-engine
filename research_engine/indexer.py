"""Search index management."""

from __future__ import annotations

from research_engine.db import Database


def rebuild_index(db: Database) -> int:
    """Rebuild the full-text index for all sources."""

    return db.rebuild_search_index()


def index_new_sources(db: Database) -> int:
    """Index sources that have not yet been added to the FTS table."""

    return db.index_new_sources()
