-- packages/db/schema/sources.sql
-- Placeholder schema for the sources table (Supabase / Postgres)
--
-- TODO: Apply via Supabase migration when Phase 2 begins.
-- This mirrors the SQLite schema used in Phase 1 (packages/research_engine/db.py).

-- array_to_string() is only STABLE, so it cannot be used directly in a
-- GENERATED column. This IMMUTABLE wrapper makes the search_vector valid.
CREATE OR REPLACE FUNCTION immutable_array_to_string(text[])
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    PARALLEL SAFE
AS $$ SELECT array_to_string($1, ' ') $$;

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

-- TODO: Add RLS policies when Supabase Auth is integrated (Phase 5)
