# API Reference

Public HTTP API exposed by the Next.js routes in `apps/web`. All endpoints use
the Supabase anon key (no end-user auth yet) and return JSON unless noted.

> **No AI.** Search and reports are powered entirely by Postgres full-text
> search and deterministic assembly — no LLMs, embeddings, vector databases, or
> external AI APIs.

## Conventions

- Pagination uses a `page` query param (1-based). The page size is fixed
  (`PAGE_SIZE = 20`). List responses return `{ data: [...], count: <total> }`.
- Dates are ISO 8601 strings. Date-range filters apply to `accessed_at`.

## Endpoints

### Search

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/search` | Ranked full-text search over sources (`ts_rank`) |

Query params: `keyword`, `category`, `subcategory`, `tag`, `from`, `to`,
`sort` (`relevance` \| `newest` \| `oldest`), `page`.

```http
GET /api/search?keyword=database%20normalization&category=computer-science&sort=relevance
```

Each result is a source object plus a numeric `rank` (0 when no keyword).

### Sources

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/sources` | List/browse sources with filters and sorting |
| `GET` | `/api/sources/:id` | Get one source plus the reports that used it |

`/api/sources` query params: `page`, `search` (title/domain `ilike`),
`category`, `subcategory`, `tag`, `from`, `to`, `sort`
(`newest` \| `oldest` \| `title`).

`/api/sources/:id` returns the source fields plus a `reports` array
(`{ id, title, created_at, rank }`) sourced from `report_sources`.

### Reports

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/reports` | List reports (`id`, `query`, `title`, `created_at`) |
| `GET` | `/api/reports/:id` | Retrieve a single report (incl. `markdown`) |
| `GET` | `/api/reports/:id/sources` | Sources used by a report, ordered by `rank` |
| `GET` | `/api/reports/:id/export` | Download a report (`format=md` \| `json` \| `csv`) |

`/api/reports/:id/sources` falls back to `research_reports.source_ids` for
legacy reports created before `report_sources` existed.

`/api/reports/:id/export` formats:

- `md` (default) — the Markdown body, `text/markdown`
- `json` — the full report plus its sources, `application/json`
- `csv` — the list of sources used (`rank,id,title,domain,url`), `text/csv`

### Saved Queries

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/queries` | List saved queries |
| `POST` | `/api/queries` | Create a saved query |
| `GET` | `/api/queries/:id` | Get a saved query and its related reports |
| `PATCH` | `/api/queries/:id` | Update a saved query |

### Jobs, Feeds, Taxonomy, Import

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/jobs` | List background jobs |
| `POST` | `/api/generate-report` | Enqueue a `generate_report` job |
| `GET` | `/api/feeds` | List configured RSS feeds |
| `POST` | `/api/import-url` | Enqueue an `import_url` job |
| `GET` | `/api/categories` | Canonical category taxonomy |
