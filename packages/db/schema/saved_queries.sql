-- packages/db/schema/saved_queries.sql
-- Schema for the saved_queries table (Supabase / Postgres).
-- Reusable research prompts created from the dashboard.

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
