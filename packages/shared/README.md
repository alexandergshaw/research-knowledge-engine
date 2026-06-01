# packages/shared

Shared models, constants, configuration, and type stubs used across both Python and TypeScript packages.

## Purpose

This package provides common definitions that need to stay consistent across:

- `packages/research_engine` — Python engine
- `apps/worker` — Python background worker
- `apps/web` — Next.js TypeScript frontend

## Directory Layout

| Path | Purpose |
|---|---|
| `models/` | Shared Pydantic data models (Python) |
| `constants/` | String constants for job types, source types, trust levels |
| `config/` | Centralised environment variable loading |
| `types/` | TypeScript type stubs (reference for the web frontend) |

## Status

**Phase 2 — Not yet implemented.** Placeholder structure only.

See `docs/roadmap/` for the phased implementation plan.
