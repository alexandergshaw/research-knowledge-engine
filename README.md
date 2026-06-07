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

## Using the Deployed App (Supabase + Railway + Vercel)

Once deployed, the system runs without the local CLI: the **Vercel** dashboard
manages feeds and triggers jobs, the **Railway** worker processes them, and
**Supabase** stores everything. Feeds and jobs live in the Supabase `feeds` and
`jobs` tables (not the Phase 1 `rss_feeds.yaml`).

### Adding feeds via the dashboard

1. Open the deployed site and go to `/research/feeds`.
2. Click **Add Feed**, fill in name + RSS URL (category and tags optional), save.
3. Click **Fetch now** to queue a `fetch_rss` job for all enabled feeds.
4. Watch progress on `/research/jobs` (`pending → running → done`).

### Seeding a starter set of feeds (SQL)

Run in the Supabase SQL Editor. `ON CONFLICT (url) DO NOTHING` makes it safe to
re-run (the `feeds.url` column is `UNIQUE`).

```sql
insert into feeds (name, url, category, tags, enabled) values
  -- General tech / engineering
  ('Hacker News Front Page', 'https://hnrss.org/frontpage',            'tech', '{news,dev}',        true),
  ('Hacker News Best',        'https://hnrss.org/best',                 'tech', '{news,dev}',        true),
  ('Lobsters',                'https://lobste.rs/rss',                  'tech', '{news,dev}',        true),
  ('GitHub Blog',             'https://github.blog/feed/',              'tech', '{github,dev}',      true),
  ('Stack Overflow Blog',     'https://stackoverflow.blog/feed/',       'tech', '{dev}',             true),

  -- Cloud / infra / deployment
  ('Vercel Blog',             'https://vercel.com/atom',                'cloud', '{vercel,deploy}',  true),
  ('Supabase Blog',           'https://supabase.com/rss.xml',           'cloud', '{supabase,db}',    true),
  ('Cloudflare Blog',         'https://blog.cloudflare.com/rss/',       'cloud', '{cloudflare}',     true),
  ('AWS What''s New',         'https://aws.amazon.com/about-aws/whats-new/recent/feed/', 'cloud', '{aws}', true),

  -- AI / ML
  ('OpenAI News',             'https://openai.com/news/rss.xml',        'ai', '{openai,llm}',        true),
  ('Hugging Face Blog',       'https://huggingface.co/blog/feed.xml',   'ai', '{huggingface,ml}',    true),
  ('Google AI Blog',          'https://blog.research.google/feeds/posts/default', 'ai', '{google,ml}', true)
on conflict (url) do nothing;
```

Tip: for a focused project, add a keyword-filtered Hacker News feed and swap the
`q=` term, e.g. `https://hnrss.org/newest?q=rag`.

### Triggering jobs

Use the dashboard buttons (**Fetch now** on Feeds, **Generate report** on
Reports), or enqueue directly via SQL:

```sql
-- Fetch all enabled feeds
insert into jobs (job_type, payload, status)
values ('fetch_rss', '{}', 'pending');

-- Generate a report for a topic
insert into jobs (job_type, payload, status)
values ('generate_report', '{"query": "vector database", "limit": 10}', 'pending');

-- Import a single URL
insert into jobs (job_type, payload, status)
values ('import_url', '{"url": "https://example.com/article"}', 'pending');

-- Refresh the search index
insert into jobs (job_type, payload, status)
values ('reindex_sources', '{}', 'pending');
```

Valid `job_type` values: `import_url`, `fetch_rss`, `generate_report`,
`reindex_sources`. Job status flows `pending → running → done` (or `failed`).

### Verifying results

```sql
select id, job_type, status, error from jobs order by id desc limit 20;
select id, title, domain from sources order by id desc limit 10;
select id, title, query from research_reports order by id desc limit 5;
```

### Troubleshooting

**500 error when saving a feed or clicking "Fetch now" / "Generate report"**

The most common cause is Supabase **Row Level Security (RLS)**. RLS is enabled by
default on new tables and blocks inserts made with the anon key, so reads work
(pages load) but writes return a 500. Confirm via DevTools → Network → the failed
request → Response: a message like
`new row violates row-level security policy for table "jobs"` points to RLS.

For a personal project, disable RLS on the app tables (run in the Supabase SQL
Editor):

```sql
alter table feeds            disable row level security;
alter table jobs             disable row level security;
alter table sources          disable row level security;
alter table research_reports disable row level security;
alter table job_logs         disable row level security;
```

To keep RLS enabled instead, add permissive policies (tighten once Supabase Auth
is added in Phase 5):

```sql
create policy "jobs_anon_all"  on jobs  for all to anon using (true) with check (true);
create policy "feeds_anon_all" on feeds for all to anon using (true) with check (true);
```

**500 with response body `Internal server error`** — usually missing Vercel
environment variables. Confirm `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are set for Production, then redeploy (env changes
require a new deployment).

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
