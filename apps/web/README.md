# apps/web

Next.js dashboard application — the user-facing UI and lightweight API layer for the research knowledge engine.

## Purpose

This application provides:
- A web dashboard for browsing and searching indexed research sources
- Lightweight Next.js API routes for search and report generation
- Authentication flow (Phase 5 — not yet implemented)

## Deployment Target

**Vercel** — serverless Next.js hosting with automatic CI/CD from the main branch.

## Directory Layout

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router pages and layouts |
| `components/` | Reusable React components |
| `lib/` | Client-side utility functions and Supabase client setup |
| `api/` | Next.js API route handlers |
| `public/` | Static assets |

## Environment Variables

Copy `.env.example` from the repo root and populate:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Development

```bash
cd apps/web
npm install
npm run dev
```

## Status

**Phase 5 — Not yet implemented.** Placeholder structure only.

See `docs/roadmap/` for the phased implementation plan.
