-- packages/db/schema/source_tags.sql
-- Placeholder schema for the source_tags join table (Supabase / Postgres)
--
-- TODO: Apply via Supabase migration when Phase 2 begins.
-- Normalised alternative to the tags TEXT[] column on sources.

CREATE TABLE IF NOT EXISTS source_tags (
    source_id BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    tag       TEXT NOT NULL,
    PRIMARY KEY (source_id, tag)
);

-- TODO: Add index on tag for efficient tag-based filtering
