# infrastructure/railway

Railway deployment configuration for the background worker (`apps/worker`).

## Purpose

Railway runs the Python background worker as an always-on process that polls
the Supabase job queue and executes research engine tasks.

## Files

| File | Purpose |
|---|---|
| `apps/worker/railway.json` (repo) | Railway config-as-code (build + deploy settings) |

The Railway configuration lives in `apps/worker/railway.json` — the service
source directory — so Railway picks it up automatically for that service.
This directory contains documentation only.

## Environment Variables (set in Railway dashboard)

```
RAILWAY_ENVIRONMENT=production
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

## Status

**Phase 4 — Not yet deployed.** Placeholder configuration only.
