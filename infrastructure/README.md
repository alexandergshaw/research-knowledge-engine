# infrastructure

Deployment configuration for all services in the research knowledge engine.

## Services

| Directory | Platform | Application |
|---|---|---|
| `railway/` | Railway | `apps/worker` — Python background worker |
| `vercel/` | Vercel | `apps/web` — Next.js dashboard |
| `docker/` | Docker | Local development / self-hosted deployment |

Important: do not create a Railway service for `apps/web`. Deploy the web app on
Vercel and use Railway only for `apps/worker`.

## Status

**Phase 4–5 — Not yet deployed.** Placeholder configuration files only.

See `docs/deployment/` and `docs/roadmap/` for deployment plans.
