# Roadmap

Phased implementation plan for the research knowledge engine.

---

## Phase 1 — Local CLI ✅ (Complete)

**Goal:** Functional local-first research tool usable from the command line.

- [x] RSS feed ingestion from YAML-configured feeds
- [x] URL importing with trusted-site enforcement
- [x] HTML text extraction (trafilatura + BeautifulSoup fallback)
- [x] SQLite FTS5 search index
- [x] Full-text search with domain and category filtering
- [x] Markdown research report generation
- [x] CLI scripts: `fetch_rss`, `import_url`, `index_sources`, `search`, `research_report`
- [x] Unit test suite (pytest)

---

## Phase 2 — Supabase Migration

**Goal:** Replace local SQLite with Supabase Postgres, preserving all CLI functionality.

- [ ] Apply schema from `supabase/schema.sql` to a Supabase project
- [ ] Replace `packages/research_engine/db.py` SQLite client with Supabase Python client
- [ ] Migrate stored documents to Supabase Storage
- [ ] Update CLI scripts to read from environment variables
- [ ] Write integration tests against the Supabase test instance

---

## Phase 3 — Job System

**Goal:** Introduce an asynchronous job queue so research tasks can be triggered without blocking.

- [ ] Define job types in `packages/db/schema/jobs.sql`
- [ ] Implement job dispatcher in `packages/shared/`
- [ ] Add job creation via CLI (e.g. `enqueue_rss_fetch`)
- [ ] Test job round-trip: create → execute → complete

---

## Phase 4 — Worker

**Goal:** Deploy the background worker to Railway.

- [ ] Implement `apps/worker/research_worker/` entrypoint
- [ ] Implement job handlers in `apps/worker/jobs/`
- [ ] Configure Railway deployment via `infrastructure/railway/railway.toml`
- [ ] Set Railway environment variables
- [ ] End-to-end test: enqueue job → worker executes → Supabase updated

---

## Phase 5 — Dashboard

**Goal:** Build the Next.js web dashboard for browsing and searching indexed sources.

- [ ] Scaffold `apps/web/app/` with App Router pages
- [ ] Implement search page with Supabase query
- [ ] Implement source browser
- [ ] Implement report viewer
- [ ] Add Supabase Auth (login / logout)
- [ ] Protect dashboard routes with auth middleware

---

## Phase 6 — Deployment

**Goal:** Full production deployment across all three platforms.

- [ ] Deploy `apps/web` to Vercel (link repo, set env vars)
- [ ] Deploy `apps/worker` to Railway (link repo, set env vars)
- [ ] Configure Supabase RLS policies for authenticated access
- [ ] Set up GitHub Actions CI: lint + test on every push
- [ ] Configure Vercel preview deployments for pull requests
- [ ] Write deployment runbook in `docs/deployment/`
