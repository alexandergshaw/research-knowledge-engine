-- packages/db/schema/jobs.sql
-- Placeholder schema for the jobs table (Supabase / Postgres)
--
-- TODO: Apply via Supabase migration when Phase 3 begins.

CREATE TABLE IF NOT EXISTS jobs (
    id          BIGSERIAL PRIMARY KEY,
    job_type    TEXT NOT NULL,   -- e.g. 'ingest_rss', 'import_url', 'rebuild_index', 'generate_report'
    payload     JSONB NOT NULL DEFAULT '{}',
    status      TEXT NOT NULL DEFAULT 'pending',  -- pending | running | done | failed
    error       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at  TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    retry_count INTEGER NOT NULL DEFAULT 0
);

-- TODO: Add index on (status, created_at) for efficient queue polling
-- TODO: Add RLS policies when Supabase Auth is integrated (Phase 5)
