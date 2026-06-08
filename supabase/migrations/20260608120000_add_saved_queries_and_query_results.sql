-- supabase/migrations/20260608120000_add_saved_queries_and_query_results.sql
--
-- Adds the tables backing the "Saved Queries" and "Research Reports" dashboard
-- features. Without these tables, POST /api/queries fails and saved queries
-- never appear in the list.
--
-- Safe to run on an existing database (idempotent via IF NOT EXISTS / IF EXISTS).
-- Apply with the Supabase CLI or paste into the Supabase SQL editor.

-- Saved queries: reusable research prompts created from the dashboard.
CREATE TABLE IF NOT EXISTS saved_queries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    query       TEXT NOT NULL,
    category    TEXT,
    subcategory TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Self-heal a previously created partial table (e.g. missing subcategory).
ALTER TABLE saved_queries ADD COLUMN IF NOT EXISTS category    TEXT;
ALTER TABLE saved_queries ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE saved_queries ADD COLUMN IF NOT EXISTS active      BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE saved_queries ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS saved_queries_created_at_idx
    ON saved_queries (created_at DESC);
CREATE INDEX IF NOT EXISTS saved_queries_active_idx
    ON saved_queries (active);

-- Research reports already exist; add the Markdown body column used by the
-- worker's generate_report handler and the report detail page.
ALTER TABLE research_reports
    ADD COLUMN IF NOT EXISTS markdown TEXT;

-- query_results: join table linking a saved query to the reports it produced.
CREATE TABLE IF NOT EXISTS query_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_query_id  UUID NOT NULL REFERENCES saved_queries(id) ON DELETE CASCADE,
    report_id       BIGINT NOT NULL REFERENCES research_reports(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS query_results_saved_query_id_idx
    ON query_results (saved_query_id);
CREATE INDEX IF NOT EXISTS query_results_report_id_idx
    ON query_results (report_id);

-- Row Level Security
-- The dashboard talks to Supabase with the anon key and no end-user auth, the
-- same way the existing feeds/jobs/sources tables are accessed. Enable RLS and
-- add permissive policies so the anon (and authenticated) roles can read and
-- write these tables. Tighten these once Supabase Auth is introduced.
ALTER TABLE saved_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_queries_anon_all ON saved_queries;
CREATE POLICY saved_queries_anon_all
    ON saved_queries
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS query_results_anon_all ON query_results;
CREATE POLICY query_results_anon_all
    ON query_results
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
