# packages/db

Database schema, migrations, seeds, and client configuration for the research knowledge engine.

## Purpose

This package is the single source of truth for the database schema. It is used by:

- `supabase/` — Supabase migration files (generated from schema here)
- `apps/web/` — Supabase JS client
- `apps/worker/` — Supabase Python client

## Directory Layout

| Path | Purpose |
|---|---|
| `schema/` | SQL table definitions (Postgres / Supabase) |
| `migrations/` | Numbered Supabase migration files (auto-generated) |
| `seeds/` | Seed SQL for development and staging environments |
| `client/` | Client configuration helpers |

## Tables

| Table | Description |
|---|---|
| `sources` | Indexed research sources (URLs, metadata, extracted text) |
| `feeds` | Configured RSS feed definitions |
| `jobs` | Background job queue |
| `research_reports` | Generated research reports |
| `source_tags` | Normalised source tag join table |

## Phase 1 Note

Phase 1 uses a local SQLite database (`database/research.db`). The Postgres schema
defined here mirrors the SQLite schema and will replace it in Phase 2.

## Status

**Phase 2 — Not yet applied.** Schema files are placeholders.

See `docs/roadmap/` for the phased implementation plan.
