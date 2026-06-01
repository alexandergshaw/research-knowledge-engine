# supabase

Supabase project configuration — database schema, migrations, seed data, and Edge Functions.

## Purpose

Supabase provides:
- **Postgres database** — persistent storage for sources, feeds, jobs, and reports
- **Storage** — raw HTML, extracted text, and PDF files (Phase 3+)
- **Auth** — user authentication (Phase 5+)
- **Edge Functions** — lightweight server-side logic close to the database (optional)

## Directory Layout

| Path | Purpose |
|---|---|
| `schema.sql` | Consolidated schema (reference; apply via Supabase CLI or dashboard) |
| `migrations/` | Numbered Supabase CLI migration files |
| `seed.sql` | Development seed data |
| `functions/` | Supabase Edge Function stubs |

## Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Apply schema
supabase db push
```

## Tables

| Table | Description |
|---|---|
| `sources` | Indexed research sources |
| `feeds` | Configured RSS feed definitions |
| `jobs` | Background worker job queue |
| `research_reports` | Generated research reports |
| `source_tags` | Normalised source tag join table |

## Status

**Phase 2 — Not yet applied.** Schema files are placeholders.

See `docs/roadmap/` for the phased implementation plan.
