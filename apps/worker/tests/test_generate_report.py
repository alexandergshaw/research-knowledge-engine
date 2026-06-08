"""Tests for the generate_report worker handler.

These tests exercise the handler logic with the database layer stubbed out, so
no live Postgres connection is required. They verify payload resolution, the
deterministic Markdown output, and that the saved-query path links results with
a bigint report id.
"""

from __future__ import annotations

import pytest

from research_worker.handlers import generate_report


class FakeDB:
    """In-memory stand-in for research_worker.db used by the handler."""

    def __init__(self, sources=None, saved_queries=None):
        self.sources = sources or []
        self.saved_queries = saved_queries or {}
        self.logs: list[tuple] = []
        self.saved_reports: list[dict] = []
        self.links: list[tuple] = []
        self._next_report_id = 101
        self.search_calls: list[dict] = []

    def write_job_log(self, job_id, level, message, metadata=None):
        self.logs.append((job_id, level, message, metadata))

    def get_saved_query(self, saved_query_id):
        return self.saved_queries.get(saved_query_id)

    def search_sources(self, query, limit=10, category=None, subcategory=None):
        self.search_calls.append(
            {
                "query": query,
                "limit": limit,
                "category": category,
                "subcategory": subcategory,
            }
        )
        return self.sources

    def save_report(self, query, title, markdown):
        report_id = self._next_report_id
        self._next_report_id += 1
        self.saved_reports.append(
            {"id": report_id, "query": query, "title": title, "markdown": markdown}
        )
        return report_id

    def link_query_result(self, saved_query_id, report_id):
        # Mirror the production contract: report_id is a bigint (int).
        assert isinstance(report_id, int)
        self.links.append((saved_query_id, int(report_id)))


@pytest.fixture
def patch_db(monkeypatch):
    def _apply(fake: FakeDB) -> FakeDB:
        monkeypatch.setattr(generate_report, "db", fake)
        return fake

    return _apply


SAMPLE_SOURCES = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "title": "Database Normalization Explained",
        "url": "https://example.com/normalization",
        "domain": "example.com",
        "category": "computer-science",
        "content": (
            "Database normalization is the process of structuring a relational "
            "database to reduce redundancy. Third normal form removes transitive "
            "dependencies."
        ),
        "published_at": None,
        "accessed_at": None,
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "title": "SQL Pedagogy Notes",
        "url": "https://example.com/sql-teaching",
        "domain": "example.com",
        "category": "education",
        "content": "Teaching SQL effectively requires hands-on exercises.",
        "published_at": None,
        "accessed_at": None,
    },
]


def test_generate_report_with_direct_query(patch_db):
    fake = patch_db(FakeDB(sources=SAMPLE_SOURCES))
    job = {
        "id": 1,
        "payload": {
            "query": "database normalization",
            "title": "Database Normalization Report",
            "limit": 5,
        },
    }

    generate_report.run(job)

    assert len(fake.saved_reports) == 1
    report = fake.saved_reports[0]
    assert report["title"] == "Database Normalization Report"
    assert report["query"] == "database normalization"
    # No saved_query_id → no link created.
    assert fake.links == []
    # Limit propagated to the search call.
    assert fake.search_calls[0]["limit"] == 5


def test_generate_report_markdown_includes_source_titles(patch_db):
    fake = patch_db(FakeDB(sources=SAMPLE_SOURCES))
    job = {"id": 2, "payload": {"query": "database normalization"}}

    generate_report.run(job)

    markdown = fake.saved_reports[0]["markdown"]
    assert "# Research Report: database normalization" in markdown
    assert "Generated:" in markdown
    assert "## Sources Reviewed" in markdown
    assert "## Key Excerpts" in markdown
    assert "## Source List" in markdown
    for source in SAMPLE_SOURCES:
        assert source["title"] in markdown
        assert source["url"] in markdown


def test_generate_report_with_saved_query_id(patch_db):
    saved_query_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    fake = patch_db(
        FakeDB(
            sources=SAMPLE_SOURCES,
            saved_queries={
                saved_query_id: {
                    "id": saved_query_id,
                    "title": "Database Education",
                    "query": "database normalization sql pedagogy",
                    "category": "computer-science",
                    "subcategory": "databases",
                    "active": True,
                }
            },
        )
    )
    job = {"id": 3, "payload": {"saved_query_id": saved_query_id}}

    generate_report.run(job)

    # Report uses the saved query's title and query text.
    report = fake.saved_reports[0]
    assert report["title"] == "Database Education"
    assert report["query"] == "database normalization sql pedagogy"

    # Filters from the saved query are passed to search.
    call = fake.search_calls[0]
    assert call["category"] == "computer-science"
    assert call["subcategory"] == "databases"

    # query_results link created with a bigint report id.
    assert len(fake.links) == 1
    linked_query_id, linked_report_id = fake.links[0]
    assert linked_query_id == saved_query_id
    assert linked_report_id == report["id"]
    assert isinstance(linked_report_id, int)


def test_generate_report_missing_query_fails(patch_db):
    fake = patch_db(FakeDB())
    job = {"id": 4, "payload": {}}

    with pytest.raises(ValueError, match="query.*saved_query_id"):
        generate_report.run(job)

    assert fake.saved_reports == []


def test_generate_report_missing_saved_query_fails(patch_db):
    fake = patch_db(FakeDB(saved_queries={}))
    job = {"id": 5, "payload": {"saved_query_id": "does-not-exist"}}

    with pytest.raises(ValueError, match="saved_query_id not found"):
        generate_report.run(job)

    assert fake.saved_reports == []
    assert fake.links == []


def test_excerpt_centers_on_query_term():
    content = (
        "Intro paragraph with filler text. " * 20
        + "The keyword normalization appears here in the middle. "
        + "More trailing filler text. " * 20
    )
    excerpt = generate_report._extract_excerpt(content, "normalization")
    assert "normalization" in excerpt
    assert len(excerpt) <= generate_report._MAX_EXCERPT_CHARS + 4  # plus ellipsis


def test_excerpt_falls_back_to_first_chars_when_no_match():
    content = "alpha beta gamma delta " * 100
    excerpt = generate_report._extract_excerpt(content, "zzzznotpresent")
    assert excerpt.startswith("alpha beta gamma")
