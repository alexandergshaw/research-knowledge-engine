-- supabase/schema.sql
-- Consolidated Supabase schema combining all table definitions.
-- This file is used as the canonical reference for the Supabase project schema.
--
-- Individual table definitions live in packages/db/schema/.
-- To apply: use the Supabase CLI or copy into the Supabase dashboard SQL editor.
--
-- TODO: Replace with numbered migration files in supabase/migrations/ (Phase 2)

-- array_to_string() is only STABLE, so it cannot be used directly in a
-- GENERATED column. This IMMUTABLE wrapper makes the sources.search_vector
-- generation expression valid.
CREATE OR REPLACE FUNCTION immutable_array_to_string(text[])
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    PARALLEL SAFE
AS $$ SELECT array_to_string($1, ' ') $$;

-- Sources: indexed research documents
CREATE TABLE IF NOT EXISTS sources (
    id          BIGSERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    url         TEXT NOT NULL UNIQUE,
    domain      TEXT NOT NULL,
    source_type TEXT NOT NULL,
    category    TEXT,
    subcategory TEXT,
    trust_level TEXT,
    published_at TIMESTAMPTZ,
    fetched_at   TIMESTAMPTZ,
    accessed_at  TIMESTAMPTZ NOT NULL,
    raw_path             TEXT,
    extracted_text_path  TEXT,
    content     TEXT,
    tags        TEXT[] NOT NULL DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector(
            'english',
            COALESCE(title, '') || ' ' ||
            COALESCE(content, '') || ' ' ||
            COALESCE(category, '') || ' ' ||
            COALESCE(subcategory, '') || ' ' ||
            COALESCE(immutable_array_to_string(tags), '')
        )
    ) STORED
);

CREATE INDEX IF NOT EXISTS sources_search_vector_idx ON sources USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS sources_tags_idx ON sources USING GIN (tags);
CREATE INDEX IF NOT EXISTS sources_category_idx ON sources (category);
CREATE INDEX IF NOT EXISTS sources_published_at_idx ON sources (published_at DESC NULLS LAST);

-- Feeds: configured RSS feed definitions
CREATE TABLE IF NOT EXISTS feeds (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    url         TEXT NOT NULL UNIQUE,
    category    TEXT,
    tags        TEXT[] NOT NULL DEFAULT '{}',
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    last_fetched_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs: background worker queue
CREATE TABLE IF NOT EXISTS jobs (
    id          BIGSERIAL PRIMARY KEY,
    job_type    TEXT NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}',
    status      TEXT NOT NULL DEFAULT 'pending',
    error       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at  TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    retry_count INTEGER NOT NULL DEFAULT 0
);

-- Research reports: generated Markdown reports
CREATE TABLE IF NOT EXISTS research_reports (
    id          BIGSERIAL PRIMARY KEY,
    query       TEXT NOT NULL,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    markdown    TEXT,
    source_ids  BIGINT[] NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved queries: reusable research prompts created from the dashboard
CREATE TABLE IF NOT EXISTS saved_queries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    query       TEXT NOT NULL,
    category    TEXT,
    subcategory TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_queries_created_at_idx
    ON saved_queries (created_at DESC);
CREATE INDEX IF NOT EXISTS saved_queries_active_idx
    ON saved_queries (active);

-- Query results: join table linking a saved query to its generated reports
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

-- Source tags: normalized tag join table
CREATE TABLE IF NOT EXISTS source_tags (
    source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    tag       TEXT NOT NULL,
    PRIMARY KEY (source_id, tag)
);

-- Report sources: which sources were used to build each report
CREATE TABLE IF NOT EXISTS report_sources (
    report_id  BIGINT NOT NULL REFERENCES research_reports(id) ON DELETE CASCADE,
    source_id  BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    rank       INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (report_id, source_id)
);

CREATE INDEX IF NOT EXISTS report_sources_report_id_idx ON report_sources (report_id);
CREATE INDEX IF NOT EXISTS report_sources_source_id_idx ON report_sources (source_id);
