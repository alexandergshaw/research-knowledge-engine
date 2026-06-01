# apps/worker

Python background worker — long-running job processor for Railway deployment.

## Overview

The worker polls the Supabase `jobs` table, claims pending rows with
`SELECT FOR UPDATE SKIP LOCKED`, dispatches them to the correct handler, and
writes results and logs back to the database.

## Directory Layout

| Path | Purpose |
|---|---|
| `research_worker/main.py` | Entry point and polling loop |
| `research_worker/db.py` | All database access (psycopg v3) |
| `research_worker/job_runner.py` | Job dispatcher |
| `research_worker/handlers/` | Per-job-type handler modules |
| `research_worker/logging_config.py` | Logging setup |
| `scripts/` | Phase 1 CLI scripts (local development only) |
| `tests/` | Worker-specific tests |
| `requirements.txt` | Python dependencies |
| `railway.json` | Railway deployment configuration |

## Railway Setup

1. Create a new Railway service and point the **root directory** to `apps/worker`.
2. Railway will detect `railway.json` and use NIXPACKS to build from `requirements.txt`.
3. The start command is:
   ```
   python -m research_worker.main --poll-interval 10
   ```
4. Set the environment variables listed below in the Railway service settings.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | Postgres connection string (from Supabase) |
| `WORKER_ID` | No | random | Unique name stamped onto claimed jobs |
| `POLL_INTERVAL_SECONDS` | No | `10` | Seconds to sleep when queue is empty |
| `FETCH_TIMEOUT_SECONDS` | No | `30` | HTTP request timeout for URL imports |
| `MAX_CONTENT_CHARS` | No | `100000` | Maximum extracted text stored per source |
| `LOG_LEVEL` | No | `INFO` | Python log level (`DEBUG`, `INFO`, `WARNING`) |

## Supported Job Types

| `job_type` | Payload fields | Description |
|---|---|---|
| `import_url` | `url` (required), `category`, `tags` | Fetch a URL and upsert into `sources` |
| `fetch_rss` | `feed_id` (optional UUID) | Fetch one or all active RSS feeds and enqueue `import_url` jobs |
| `generate_report` | `query` (required), `limit` | Full-text search sources and save a Markdown report |
| `reindex_sources` | _(none)_ | Touch all source rows to re-fire the `search_vector` trigger |

## Database Schema Requirements

The worker reads and writes several Postgres tables.  The baseline schema is
in `packages/db/schema/`.  Apply migrations before deploying:

```sql
-- Recommended additions to the jobs table:
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS priority   INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by  TEXT;

CREATE INDEX IF NOT EXISTS jobs_pending_idx ON jobs (status, created_at ASC)
  WHERE status = 'pending';

-- job_logs table (not yet in schema files):
CREATE TABLE IF NOT EXISTS job_logs (
  id         BIGSERIAL PRIMARY KEY,
  job_id     BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  level      TEXT NOT NULL,
  message    TEXT NOT NULL,
  metadata   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS job_logs_job_id_idx ON job_logs (job_id);
```

## Insert a Test Job

```sql
-- import_url
INSERT INTO jobs (job_type, payload, status)
VALUES ('import_url', '{"url": "https://docs.python.org/3/tutorial/index.html", "tags": ["python"]}', 'pending');

-- fetch_rss (all active feeds)
INSERT INTO jobs (job_type, payload, status)
VALUES ('fetch_rss', '{}', 'pending');

-- generate_report
INSERT INTO jobs (job_type, payload, status)
VALUES ('generate_report', '{"query": "Python async patterns"}', 'pending');

-- reindex_sources
INSERT INTO jobs (job_type, payload, status)
VALUES ('reindex_sources', '{}', 'pending');
```

## Check Logs

```sql
-- Recent job activity:
SELECT j.id, j.job_type, j.status, j.started_at, j.finished_at, j.error
FROM jobs j
ORDER BY j.created_at DESC
LIMIT 20;

-- Logs for a specific job:
SELECT level, message, metadata, created_at
FROM job_logs
WHERE job_id = <job_id>
ORDER BY created_at ASC;
```

## Run Locally (Optional)

```bash
cd apps/worker

# Install dependencies:
pip install -r requirements.txt

# Create a .env.local with your DATABASE_URL:
echo 'DATABASE_URL=postgresql://...' > .env.local

# Process one job and exit:
python -m research_worker.main --once

# Run the polling loop (Ctrl-C to stop):
python -m research_worker.main --poll-interval 5
```

`python-dotenv` loads `.env.local` automatically when present.
In Railway, environment variables are injected directly — no `.env` file needed.

## Phase 1 CLI Scripts

The `scripts/` directory contains the original local CLI tools.
Run them directly during development (no worker queue required):

```bash
# From repo root, with packages/ on the Python path:
python3 apps/worker/scripts/fetch_rss.py
python3 apps/worker/scripts/import_url.py "https://example.com/article"
python3 apps/worker/scripts/index_sources.py --rebuild
python3 apps/worker/scripts/research_report.py "report topic"
```
