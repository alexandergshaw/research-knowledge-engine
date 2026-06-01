# apps/worker

Python background worker application — long-running job processor for Railway deployment.

## Purpose

This application:
- Polls the Supabase jobs queue for pending work
- Executes research engine tasks (RSS ingestion, URL import, indexing, report generation)
- Reports job status and errors back to the database

## Deployment Target

**Railway** — always-on Python worker process with environment-based configuration.

## Directory Layout

| Path | Purpose |
|---|---|
| `research_worker/` | Worker entrypoint and job dispatcher |
| `jobs/` | Individual job handler implementations |
| `scripts/` | Phase 1 CLI scripts (local development only) |
| `tests/` | Worker-specific unit and integration tests |
| `requirements.txt` | Python dependencies |

## Phase 1 CLI Scripts

The `scripts/` directory contains the original local CLI tools from Phase 1.
Run them directly during development (no worker queue required):

```bash
# From repo root, with packages/ on the Python path:
python3 apps/worker/scripts/fetch_rss.py
python3 apps/worker/scripts/import_url.py "https://example.com/article"
python3 apps/worker/scripts/index_sources.py --rebuild
python3 apps/worker/scripts/search.py "query terms"
python3 apps/worker/scripts/research_report.py "report topic"
```

## Environment Variables

```
RAILWAY_ENVIRONMENT=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

## Status

**Phase 4 — Not yet implemented.** Phase 1 CLI scripts are functional.

See `docs/roadmap/` for the phased implementation plan.
