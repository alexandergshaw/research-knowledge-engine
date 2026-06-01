-- packages/db/schema/feeds.sql
-- Placeholder schema for the feeds table (Supabase / Postgres)
--
-- TODO: Apply via Supabase migration when Phase 2 begins.

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

-- TODO: Add RLS policies when Supabase Auth is integrated (Phase 5)
