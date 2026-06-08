-- packages/db/schema/report_sources.sql
-- Schema for the report_sources join table (Supabase / Postgres).
-- Links a research report to each source used to build it, enabling
-- report->source and source->report traceability in the UI and public API.
--
-- NOTE: sources.id is BIGSERIAL (bigint), so source_id is BIGINT to keep a
-- valid foreign key.

CREATE TABLE IF NOT EXISTS report_sources (
    report_id  BIGINT NOT NULL REFERENCES research_reports(id) ON DELETE CASCADE,
    source_id  BIGINT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    rank       INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (report_id, source_id)
);

CREATE INDEX IF NOT EXISTS report_sources_report_id_idx
    ON report_sources (report_id);
CREATE INDEX IF NOT EXISTS report_sources_source_id_idx
    ON report_sources (source_id);
