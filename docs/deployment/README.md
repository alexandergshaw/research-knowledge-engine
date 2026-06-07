# Deployment

Deployment documentation for all services in the research knowledge engine.

## Services

| Service | Platform | Application |
|---|---|---|
| Web dashboard | Vercel | `apps/web` |
| Background worker | Railway | `apps/worker` |
| Database | Supabase | `supabase/` |

Important: Railway should run only the worker service (`apps/worker`).
Do not deploy the web app (`apps/web`) to Railway in this architecture.

## Configuration

See `infrastructure/` for deployment configuration files:
- `infrastructure/vercel/vercel.json`
- `infrastructure/railway/railway.toml`

## Environment Variables

See `.env.example` in the repo root for all required variables.

## Status

**Phase 6 — Not yet deployed.** Placeholder documentation.
