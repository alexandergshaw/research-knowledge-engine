-- supabase/migrations/20260608140000_add_search_sources_function.sql
--
-- Deterministic full-text search over sources using Postgres FTS only.
-- NO LLMs, embeddings, or vector search — just ts_rank over the generated
-- search_vector column. Returns a relevance rank plus a window-function total
-- count so the API can paginate in a single round-trip.
--
-- Idempotent: CREATE OR REPLACE. Apply via Supabase CLI or SQL editor.

CREATE OR REPLACE FUNCTION search_sources(
    keyword             text        DEFAULT NULL,
    category_filter     text        DEFAULT NULL,
    subcategory_filter  text        DEFAULT NULL,
    tag_filter          text        DEFAULT NULL,
    from_date           timestamptz DEFAULT NULL,
    to_date             timestamptz DEFAULT NULL,
    sort_order          text        DEFAULT 'relevance',
    page_limit          integer     DEFAULT 20,
    page_offset         integer     DEFAULT 0
)
RETURNS TABLE (
    id                  bigint,
    title               text,
    url                 text,
    domain              text,
    source_type         text,
    category            text,
    subcategory         text,
    trust_level         text,
    published_at        timestamptz,
    fetched_at          timestamptz,
    accessed_at         timestamptz,
    raw_path            text,
    extracted_text_path text,
    content             text,
    tags                text[],
    rank                real,
    total_count         bigint
)
LANGUAGE sql
STABLE
AS $$
    WITH q AS (
        SELECT CASE
            WHEN keyword IS NULL OR btrim(keyword) = '' THEN NULL
            ELSE websearch_to_tsquery('english', keyword)
        END AS tsq
    )
    SELECT
        s.id,
        s.title,
        s.url,
        s.domain,
        s.source_type,
        s.category,
        s.subcategory,
        s.trust_level,
        s.published_at,
        s.fetched_at,
        s.accessed_at,
        s.raw_path,
        s.extracted_text_path,
        s.content,
        s.tags,
        CASE WHEN q.tsq IS NULL THEN 0::real
             ELSE ts_rank(s.search_vector, q.tsq) END AS rank,
        count(*) OVER () AS total_count
    FROM sources s, q
    WHERE (q.tsq IS NULL OR s.search_vector @@ q.tsq)
      AND (category_filter    IS NULL OR s.category = category_filter)
      AND (subcategory_filter IS NULL OR s.subcategory = subcategory_filter)
      AND (tag_filter         IS NULL OR s.tags @> ARRAY[tag_filter])
      AND (from_date          IS NULL OR s.accessed_at >= from_date)
      AND (to_date            IS NULL OR s.accessed_at <= to_date)
    ORDER BY
        CASE WHEN sort_order = 'relevance' THEN
            CASE WHEN q.tsq IS NULL THEN 0::real ELSE ts_rank(s.search_vector, q.tsq) END
        END DESC NULLS LAST,
        CASE WHEN sort_order = 'oldest' THEN s.accessed_at END ASC,
        CASE WHEN sort_order = 'newest' THEN s.accessed_at END DESC,
        s.accessed_at DESC
    LIMIT GREATEST(page_limit, 0)
    OFFSET GREATEST(page_offset, 0);
$$;

-- Allow the anon/authenticated roles to call the function (matches the rest of
-- the public, anon-key API surface).
GRANT EXECUTE ON FUNCTION search_sources(
    text, text, text, text, timestamptz, timestamptz, text, integer, integer
) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
