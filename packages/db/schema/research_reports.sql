-- packages/db/schema/research_reports.sql
-- Placeholder schema for the research_reports table (Supabase / Postgres)
--
-- TODO: Apply via Supabase migration when Phase 5 begins.

CREATE TABLE IF NOT EXISTS research_reports (
    id          BIGSERIAL PRIMARY KEY,
    query       TEXT NOT NULL,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,      -- Legacy Markdown body
    markdown    TEXT,               -- Markdown body written by the worker
    source_ids  BIGINT[] NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TODO: Add storage_path column when Supabase Storage is integrated
-- TODO: Add RLS policies when Supabase Auth is integrated (Phase 5)
