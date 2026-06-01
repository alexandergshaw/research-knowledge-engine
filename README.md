# research-knowledge-engine

Monorepo for the research knowledge engine — a platform for collecting, indexing, searching, and reporting on online research sources.

## Architecture

| Layer | Platform | Application |
|---|---|---|
| UI + API | Vercel | `apps/web` (Next.js) |
| Database + Storage | Supabase | `supabase/` |
| Background workers | Railway | `apps/worker` (Python) |
| Core logic | Shared | `packages/research_engine` |

See [docs/architecture/system-overview.md](docs/architecture/system-overview.md) for the full architecture description.

## Repository Layout

```
research-knowledge-engine/
├── apps/
│   ├── web/            # Next.js dashboard (Vercel)
│   └── worker/         # Python background worker (Railway)
│       └── scripts/    # Phase 1 CLI scripts
│
├── packages/
│   ├── db/             # Database schema and migrations
│   ├── shared/         # Cross-package models and constants
│   └── research_engine/ # Core research business logic (Phase 1 ✅)
│
├── supabase/           # Supabase schema, migrations, seed data
├── infrastructure/     # Vercel and Railway deployment configs
├── docs/               # Architecture, API, deployment, roadmap
├── data/               # RSS feed config, trusted sites, sample data
├── tests/              # Root-level test suite
│
├── .env.example        # Environment variable template
├── package.json        # Root workspace config (Turborepo)
├── turbo.json          # Turborepo task pipeline
└── requirements.txt    # Python dependencies (Phase 1)
```

## Current Status — Phase 1 (Local CLI)

Phase 1 is fully implemented and functional. All core research logic lives in
`packages/research_engine/` and is accessible via CLI scripts in `apps/worker/scripts/`.

### Quick Start (Phase 1 CLI)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Import a URL:**
```bash
python3 apps/worker/scripts/import_url.py "https://example.com/article"
```

**Fetch RSS feeds:**
```bash
python3 apps/worker/scripts/fetch_rss.py
python3 apps/worker/scripts/fetch_rss.py --fetch-full-articles
```

**Rebuild the search index:**
```bash
python3 apps/worker/scripts/index_sources.py --rebuild
```

**Search:**
```bash
python3 apps/worker/scripts/search.py "rubric based assessment"
python3 apps/worker/scripts/search.py "cybersecurity framework" --category cybersecurity
```

**Generate a research report:**
```bash
python3 apps/worker/scripts/research_report.py "automated grading systems" --limit 10
```

Reports are written to `exports/` as Markdown files.

## Configuration

### RSS Feeds

Edit `data/feeds/rss_feeds.yaml`:

```yaml
feeds:
  - name: NIST Cybersecurity
    url: https://www.nist.gov/news-events/cybersecurity/rss.xml
    category: cybersecurity
    tags: [nist, cybersecurity, standards]
```

### Trusted Sites

Edit `data/trusted_sites/trusted_sites.yaml`:

```yaml
trusted_sites:
  - domain: nist.gov
    category: cybersecurity
    trust_level: high
```

Imports from unlisted domains are rejected unless `--force` is passed.

## Running Tests

```bash
python3 -m pytest -q
```

## Roadmap

See [docs/roadmap/README.md](docs/roadmap/README.md) for the full phased plan:

- **Phase 1** — Local CLI ✅
- **Phase 2** — Supabase migration
- **Phase 3** — Job system
- **Phase 4** — Worker deployment (Railway)
- **Phase 5** — Dashboard (Vercel)
- **Phase 6** — Full production deployment

## Why No LLMs

The system is intentionally deterministic and local-first. It uses RSS, HTTP requests,
HTML parsing, text extraction, SQLite FTS5, and rule-based configuration only.
It does not call LLMs or external AI APIs.
