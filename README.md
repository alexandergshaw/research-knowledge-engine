# research-knowledge-engine

Local-first online source retrieval, extraction, indexing, and search for research workflows.

## Purpose

This project collects online sources from RSS feeds and direct URL imports, stores them locally, indexes them in SQLite FTS5, and generates basic Markdown research reports.

## Architecture

- `sources/`: YAML configuration for RSS feeds, trusted sites, and saved query lists
- `documents/`: stored raw HTML, extracted text, and reserved PDF directory
- `database/research.db`: SQLite database for source metadata and FTS search
- `research_engine/`: reusable Python modules for database access, fetching, extraction, indexing, search, and reporting
- `scripts/`: CLI entry points for RSS fetching, URL import, indexing, search, and report generation
- `tests/`: unit tests for config loading, parsing, duplicate handling, extraction fallback, database behavior, FTS search, and report generation

## Why this does not use LLMs

The system is intentionally deterministic and local-first. It uses RSS, HTTP requests, HTML parsing, text extraction, SQLite FTS5, and rule-based configuration only. It does not call LLMs or external AI APIs.

## Requirements

- Python 3.12+
- SQLite with FTS5 support

Install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configuration

### RSS feeds

Edit `/tmp/workspace/alexandergshaw/research-knowledge-engine/sources/rss_feeds.yaml`:

```yaml
feeds:
  - name: NIST Cybersecurity
    url: https://www.nist.gov/news-events/cybersecurity/rss.xml
    category: cybersecurity
    tags: [nist, cybersecurity, standards]
```

### Trusted sites

Edit `/tmp/workspace/alexandergshaw/research-knowledge-engine/sources/trusted_sites.yaml`:

```yaml
trusted_sites:
  - domain: nist.gov
    category: cybersecurity
    trust_level: high
```

Imports from domains not in this file are rejected unless `--force` is passed.

## Usage

### Import a URL

```bash
python3 scripts/import_url.py "https://example.com/article"
```

### Fetch RSS feeds

```bash
python3 scripts/fetch_rss.py
```

To also fetch discovered article pages:

```bash
python3 scripts/fetch_rss.py --fetch-full-articles
```

### Rebuild the index

```bash
python3 scripts/index_sources.py --rebuild
```

To index only newly added sources:

```bash
python3 scripts/index_sources.py --new-only
```

### Search

```bash
python3 scripts/search.py "rubric based assessment"
python3 scripts/search.py "cybersecurity framework" --category cybersecurity
python3 scripts/search.py "python testing" --domain docs.python.org
```

### Generate a research report

```bash
python3 scripts/research_report.py "automated grading systems" --limit 10
```

This writes a Markdown report under `exports/`, for example:

- `exports/automated-grading-systems-report.md`

## Data model

The `sources` table stores:

- title
- url
- domain
- source_type
- category
- trust_level
- published_at
- fetched_at
- accessed_at
- raw_path
- extracted_text_path
- content
- tags

The `search_index` virtual table uses SQLite FTS5 over title, content, tags, category, and domain.

## Running tests

```bash
pytest -q
```

## Limitations

- No web UI yet
- No local document ingestion yet
- No citation export formats yet
- HTML extraction quality depends on source structure
- RSS article discovery depends on feed quality and item metadata