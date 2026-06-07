# Category System

The category system is the shared taxonomy used to classify sources, RSS feeds,
imported URLs, research reports, and saved searches across the Research
Knowledge Engine and its sibling projects:

- Research Knowledge Engine
- Personal Knowledge Base
- Classroom Artifact Grader
- Course Generator
- Workflow Automation Platform
- Resume Tailoring Engine

## Canonical sources of truth

| Artifact | Path | Purpose |
|---|---|---|
| Taxonomy data | [data/source_categories.yaml](../../data/source_categories.yaml) | The single source of truth for categories and subcategories |
| Python model + helpers | [packages/shared/models/source_category.py](../../packages/shared/models/source_category.py) | Typed loading and validation for Python services |
| TypeScript types + helpers | [packages/shared/types/source-category.ts](../../packages/shared/types/source-category.ts) | Typed access for the Next.js web app |
| Sample feeds | [data/sample_feeds.yaml](../../data/sample_feeds.yaml) | Reference feeds mapped to the taxonomy |

The YAML file is authoritative. The Python model loads it directly; the
TypeScript constant mirrors it and must be kept in sync when the taxonomy
changes.

## Taxonomy philosophy

1. **Broad and stable over precise and trendy.** Top-level categories are chosen
   to remain meaningful for at least five years. They describe durable domains
   (e.g. `software`, `education`), not products or frameworks.
2. **Two levels only.** A `category` and a `subcategory`. Deeper nuance lives in
   free-form `tags`, which can evolve freely without destabilizing the taxonomy.
3. **Reusable across projects.** The same taxonomy classifies a graded classroom
   artifact, a resume bullet, an automation workflow, and a research source.
4. **Tags absorb churn.** Company names, library names, and emerging buzzwords
   belong in `tags`, never in categories or subcategories.

## Naming conventions

- All category and subcategory names use **kebab-case** (e.g.
  `programming-languages`, `incident-response`).
- Names are lowercase ASCII; no spaces, underscores, or camelCase.
- Prefer nouns or noun phrases (`curriculum-development`, not `develop-curriculum`).
- Avoid abbreviations unless they are the dominant term (`nlp`, `rag`, `llms`).
- A subcategory key may repeat across categories when genuinely shared
  (e.g. `computer-science` appears under both `computer-science` and `research`).

## Category assignment rules

When classifying any item (source, feed, report, saved query):

1. **Pick exactly one top-level category** — the primary domain of the content.
2. **Pick one subcategory** that exists under that category. Validate with
   `validate_subcategory(category, subcategory)`.
3. **Add tags** for anything more specific: vendors, tools, techniques, named
   standards. Tags are additive and unconstrained.
4. **When ambiguous**, choose the category a reader would browse first, and use
   tags to capture the secondary domain. Example: an article on securing an ML
   pipeline → category `cybersecurity`, subcategory `defensive-security`, tags
   `[ai, ml, pipelines]`.
5. **Never invent a category inline.** Extend the taxonomy via pull request
   (see below) so all projects stay aligned.

## Feed classification guidelines

- Classify a feed by the **dominant** topic of its content, not by occasional
  posts.
- Use the most specific valid subcategory. For a broad publisher, choose the
  subcategory that best matches its center of gravity (e.g. Martin Fowler →
  `software` / `architecture`).
- Keep a feed's `tags` aligned with its category's tags plus any
  publisher-specific aliases (e.g. `aws`, `nist`).
- See [data/sample_feeds.yaml](../../data/sample_feeds.yaml) for worked examples.

### Example classifications

| Feed | Category | Subcategory |
|---|---|---|
| Python Insider | software | programming-languages |
| AWS Blog | software | cloud |
| GitHub Blog | software | open-source |
| Cloudflare Blog | software | distributed-systems |
| Microsoft DevBlogs | software | architecture |
| Martin Fowler | software | architecture |
| NIST | cybersecurity | standards |
| CISA | cybersecurity | defensive-security |
| SANS | cybersecurity | incident-response |
| Krebs on Security | cybersecurity | defensive-security |
| EDUCAUSE | education | higher-education |
| Inside Higher Ed | education | higher-education |
| Chronicle of Higher Education | education | student-success |
| OpenAI News | ai | industry |
| Anthropic News | ai | industry |
| arXiv cs.AI | ai | machine-learning |
| Google Research | research | computer-science |

## How to extend the taxonomy

1. Edit [data/source_categories.yaml](../../data/source_categories.yaml) — add a
   subcategory to an existing category, or (rarely) a new top-level category.
2. Mirror the change in
   [packages/shared/types/source-category.ts](../../packages/shared/types/source-category.ts).
3. Prefer **adding subcategories** over adding top-level categories. New
   top-level categories require cross-project review because every consumer
   inherits them.
4. **Never rename or delete** an existing key without a migration plan —
   stored records reference these values. Deprecate by leaving the key in place
   and steering new content elsewhere.
5. Keep additions broad and non-proprietary (see design constraints).

## Database recommendations

Apply these taxonomy values consistently across the database tables. Store the
top-level value in a `category` column and the second level in a `subcategory`
column; keep granular terms in the existing `tags` array.

### sources

- `category`: one top-level category key (required for classified sources).
- `subcategory`: one valid subcategory for that category (optional but
  recommended).
- `tags`: granular aliases (vendors, tools, techniques).

### feeds

- `category`: the feed's dominant top-level category.
- `subcategory`: the feed's dominant subcategory.
- `tags`: publisher aliases plus inherited category tags.

### research_reports

- `category`: the primary domain of the report's query/topic.
- `subcategory`: the closest matching subcategory.
- `tags`: query terms and notable source domains.

### saved_queries

- `category`: the domain the saved search targets.
- `subcategory`: the closest matching subcategory.
- `tags`: free-form filters used by the query.

### Suggested columns (Postgres)

```sql
-- Add taxonomy columns where they do not yet exist.
alter table sources          add column if not exists category    text;
alter table sources          add column if not exists subcategory text;
alter table feeds            add column if not exists subcategory text; -- feeds already have category
alter table research_reports add column if not exists category    text;
alter table research_reports add column if not exists subcategory text;

-- saved_queries is a future table; recommended shape:
create table if not exists saved_queries (
    id          bigserial primary key,
    name        text not null,
    query       text not null,
    category    text,
    subcategory text,
    tags        text[] not null default '{}',
    created_at  timestamptz not null default now()
);
```

Validation of `category` / `subcategory` values is performed in application code
using the shared helpers (`validate_category`, `validate_subcategory`) rather
than database constraints, so the taxonomy can evolve without migrations.

## Design constraints

These constraints are intentional and should guide every change:

1. **Five-year stability.** Top-level categories must stay valid for at least
   five years.
2. **Broad categories.** Favor wide domains; push specificity into subcategories
   and tags.
3. **No company-specific categories.** `aws`, `openai`, `microsoft` are tags, not
   categories.
4. **No technology-specific categories.** `react`, `kubernetes`, `postgres` are
   tags, not categories.
5. **Reuse across all projects.** The taxonomy is shared; changes must make
   sense for every consumer.
6. **Consistent kebab-case.** Always.
7. **Long-term maintainability first.** Prefer a slightly less convenient but
   durable classification over a convenient but brittle one.

## Using the helpers

Python:

```python
from shared.models.source_category import (
    list_categories,
    list_subcategories,
    validate_category,
    validate_subcategory,
    find_category_by_tag,
)

list_categories()                          # ['software', 'computer-science', ...]
list_subcategories("software")             # ['frontend', 'backend', ...]
validate_category("ai")                    # True
validate_subcategory("ai", "rag")          # True
find_category_by_tag("infosec")            # 'cybersecurity'
```

TypeScript:

```ts
import {
  listCategories,
  listSubcategories,
  validateCategory,
  validateSubcategory,
  findCategoryByTag,
} from "@/shared/types/source-category";

listCategories();                          // ['software', 'computer-science', ...]
listSubcategories("software");             // ['frontend', 'backend', ...]
validateCategory("ai");                    // true
validateSubcategory("ai", "rag");          // true
findCategoryByTag("infosec");              // 'cybersecurity'
```
