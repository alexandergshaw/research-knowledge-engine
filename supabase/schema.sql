-- supabase/schema.sql
-- Consolidated Supabase schema combining all table definitions.
-- This file is used as the canonical reference for the Supabase project schema.
--
-- Individual table definitions live in packages/db/schema/.
-- To apply: use the Supabase CLI or copy into the Supabase dashboard SQL editor.
--
-- TODO: Replace with numbered migration files in supabase/migrations/ (Phase 2)

-- Sources: indexed research documents
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
    source_ids  BIGINT[] NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Source tags: normalised tag join table
CREATE TABLE IF NOT EXISTS source_tags (
    source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    tag       TEXT NOT NULL,
    PRIMARY KEY (source_id, tag)
);
