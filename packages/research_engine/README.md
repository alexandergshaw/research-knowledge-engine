# packages/research_engine

Core research engine package — shared business logic for ingestion, extraction, indexing, search, and report generation.

## Purpose

This package contains all Phase 1 local-first research logic. It is framework-agnostic Python and can be imported by:

- `apps/worker` — background job processing on Railway
- CLI scripts (`apps/worker/scripts/`) — direct developer use
- Tests (`tests/`) — unit and integration testing

## Module Layout

| Module | Responsibility |
|---|---|
| `__init__.py` | Package constants and default paths |
| `db.py` | SQLite database wrapper (Phase 1 local storage) |
| `models.py` | Pydantic data models |
| `rss.py` | RSS feed fetching and parsing |
| `web_fetcher.py` | URL importing and trusted-site enforcement |
| `extractor.py` | HTML text extraction |
| `indexer.py` | SQLite FTS5 index management |
| `search.py` | Full-text search interface |
| `reports.py` | Markdown research report generation |

## Subdirectory Placeholders

These subdirectories are scaffolded for Phase 2+ modularization:

- `ingestion/` — future modular ingestion pipeline (RSS, web, PDF, podcast)
- `extraction/` — future extraction strategies (HTML, PDF, Markdown)
- `indexing/` — future indexing pipeline (FTS, vector/semantic)
- `search/` — future search interface (FTS, semantic, hybrid)
- `reports/` — future report formats (Markdown, PDF, BibTeX, API)

## Usage (Phase 1 CLI)

```bash
cd <repo-root>
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run via worker scripts
python3 apps/worker/scripts/fetch_rss.py
python3 apps/worker/scripts/import_url.py "https://example.com/article"
python3 apps/worker/scripts/index_sources.py --rebuild
python3 apps/worker/scripts/search.py "search query"
python3 apps/worker/scripts/research_report.py "report topic"
```

## Future Plans

See `docs/roadmap/` for the phased deployment plan.
