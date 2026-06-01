"""Job definitions for the research worker.

Each job type maps to a unit of work that the worker picks up from the queue.

TODO:
- ingest_rss_feed: fetch and store all items from a configured RSS feed
- import_url: fetch, extract, and store a single URL
- rebuild_index: rebuild the full-text search index
- generate_report: generate a Markdown research report for a query
"""
