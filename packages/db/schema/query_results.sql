-- packages/db/schema/query_results.sql
-- Schema for the query_results join table (Supabase / Postgres).
-- Links a saved query to each research report generated from it.

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
