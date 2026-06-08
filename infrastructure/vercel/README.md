# infrastructure/vercel

Vercel deployment configuration for the Next.js web application (`apps/web`).

## Purpose

Vercel hosts the Next.js dashboard and API routes with automatic deployments
triggered by pushes to the main branch.

## Files

| File | Purpose |
|---|---|
| `vercel.json` (repo root) | Vercel project configuration |

The `vercel.json` file lives at the **repository root** so Vercel picks it up
automatically. This directory contains documentation only.

## Setup

1. Import the repository in the Vercel dashboard
2. Set the root directory to `.` (monorepo root) — Vercel will find `vercel.json` automatically
3. Configure environment variables (copy from `.env.example`)

## Environment Variables (set in Vercel dashboard)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Status

**Phase 5 — Not yet deployed.** Placeholder configuration only.
