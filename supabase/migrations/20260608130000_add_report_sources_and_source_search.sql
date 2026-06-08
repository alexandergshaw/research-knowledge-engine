-- supabase/migrations/20260608130000_add_report_sources_and_source_search.sql
--
-- Adds report->source traceability and Postgres full-text search support.
--
--  * report_sources: join table linking a research report to each source used.
--      NOTE: sources.id is BIGSERIAL (bigint), so source_id is BIGINT here to
--      keep a valid foreign key. (The original task sketch said uuid, but the
--      live sources table uses bigint ids — bigint is required for the FK.)
--  * sources.subcategory: taxonomy refinement used by search filters.
--  * sources.search_vector: generated tsvector + GIN index for fast FTS.
--  * sources tags GIN index for tag filtering.
--
-- Safe to run on an existing database (idempotent).
-- Apply with the Supabase CLI or paste into the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Sources: search + taxonomy columns
-- ---------------------------------------------------------------------------
ALTER TABLE sources ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- array_to_string() is only marked STABLE, so Postgres rejects it inside a
-- GENERATED column ("generation expression is not immutable"). Wrap it in an
-- IMMUTABLE helper: joining a text[] with a constant separator is genuinely
-- immutable, so this is safe.
CREATE OR REPLACE FUNCTION immutable_array_to_string(text[])
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    PARALLEL SAFE
AS $$ SELECT array_to_string($1, ' ') $$;

-- Generated full-text search vector over title, content, category, and tags.
-- GENERATED ALWAYS ... STORED keeps it in sync automatically on insert/update.
ALTER TABLE sources
    ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector(
            'english',
            COALESCE(title, '') || ' ' ||
            COALESCE(content, '') || ' ' ||
            COALESCE(category, '') || ' ' ||
            COALESCE(subcategory, '') || ' ' ||
            COALESCE(immutable_array_to_string(tags), '')
        )
    ) STORED;

CREATE INDEX IF NOT EXISTS sources_search_vector_idx
    ON sources USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS sources_tags_idx
    ON sources USING GIN (tags);
CREATE INDEX IF NOT EXISTS sources_category_idx
    ON sources (category);
CREATE INDEX IF NOT EXISTS sources_published_at_idx
    ON sources (published_at DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- report_sources: which sources were used to build each report
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_sources (
    report_id  BIGINT NOT NULL REFERENCES research_reports(id) ON DELETE CASCADE,
    source_id  BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    rank       INTEGER,                                  -- 1-based position in the report
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (report_id, source_id)
);

CREATE INDEX IF NOT EXISTS report_sources_report_id_idx
    ON report_sources (report_id);
CREATE INDEX IF NOT EXISTS report_sources_source_id_idx
    ON report_sources (source_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The dashboard and public API use the anon key (no end-user auth yet), the
-- same access model as the existing feeds/jobs/sources tables.
-- ---------------------------------------------------------------------------
ALTER TABLE report_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_sources_anon_all ON report_sources;
CREATE POLICY report_sources_anon_all
    ON report_sources
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Refresh the PostgREST schema cache so the new table/columns are visible.
NOTIFY pgrst, 'reload schema';
