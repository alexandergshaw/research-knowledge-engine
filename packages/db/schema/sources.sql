-- packages/db/schema/sources.sql
-- Placeholder schema for the sources table (Supabase / Postgres)
--
-- TODO: Apply via Supabase migration when Phase 2 begins.
-- This mirrors the SQLite schema used in Phase 1 (packages/research_engine/db.py).

CREATE TABLE IF NOT EXISTS sources (
    id          BIGSERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    url         TEXT NOT NULL UNIQUE,
    domain      TEXT NOT NULL,
    source_type TEXT NOT NULL,
    category    TEXT,
    trust_level TEXT,
    published_at TIMESTAMPTZ,
    fetched_at   TIMESTAMPTZ,
    accessed_at  TIMESTAMPTZ NOT NULL,
    raw_path             TEXT,
    extracted_text_path  TEXT,
    content     TEXT,
    tags        TEXT[] NOT NULL DEFAULT '{}'
);

-- TODO: Add RLS policies when Supabase Auth is integrated (Phase 5)
-- TODO: Add GIN index on tags and tsvector index on content
