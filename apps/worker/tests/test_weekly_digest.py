"""Tests for the weekly_digest worker handler.

The database layer is stubbed so no live Postgres is required. These tests
verify preset resolution, deterministic Markdown structure, and that digests
populate report_sources with bigint ids.
"""

from __future__ import annotations

import pytest

from research_worker.handlers import weekly_digest


class FakeDB:
    """In-memory stand-in for research_worker.db used by the handler."""

    def __init__(self, sources=None):
        self.sources = sources or []
        self.logs: list[tuple] = []
        self.saved_reports: list[dict] = []
        self.report_sources: list[tuple] = []
        self.recent_calls: list[dict] = []
        self._next_report_id = 201

    def write_job_log(self, job_id, level, message, metadata=None):
        self.logs.append((job_id, level, message, metadata))

    def recent_sources_by_category(self, category=None, days=7, limit=10):
        self.recent_calls.append({"category": category, "days": days, "limit": limit})
        return self.sources

    def save_report(self, query, title, markdown, source_ids=None):
        report_id = self._next_report_id
        self._next_report_id += 1
        self.saved_reports.append(
            {
                "id": report_id,
                "query": query,
                "title": title,
                "markdown": markdown,
                "source_ids": list(source_ids or []),
            }
        )
        return report_id

    def insert_report_sources(self, report_id, source_ids):
        assert isinstance(report_id, int)
        for source_id in source_ids:
            assert isinstance(source_id, int)
            self.report_sources.append((report_id, source_id))


@pytest.fixture
def patch_db(monkeypatch):
    def _apply(fake: FakeDB) -> FakeDB:
        monkeypatch.setattr(weekly_digest, "db", fake)
        return fake

    return _apply


SAMPLE_SOURCES = [
    {
        "id": 31,
        "title": "New LLM Benchmarks Released",
        "url": "https://ai.example.com/benchmarks",
        "domain": "ai.example.com",
        "category": "ai",
        "content": "Researchers published a new suite of benchmarks this week.",
        "published_at": None,
    },
    {
        "id": 32,
        "title": "Transformer Optimizations",
        "url": "https://ml.example.com/transformers",
        "domain": "ml.example.com",
        "category": "ai",
        "content": "Memory-efficient attention reduces compute costs.",
        "published_at": None,
    },
]


def test_digest_preset_resolves_to_category(patch_db):
    fake = patch_db(FakeDB(sources=SAMPLE_SOURCES))
    job = {"id": 1, "payload": {"digest": "ai"}}

    weekly_digest.run(job)

    assert fake.recent_calls[0]["category"] == "ai"
    report = fake.saved_reports[0]
    assert report["title"].startswith("AI Weekly")
    assert report["query"] == "weekly_digest:ai"


def test_digest_markdown_structure(patch_db):
    fake = patch_db(FakeDB(sources=SAMPLE_SOURCES))
    job = {"id": 2, "payload": {"digest": "cyber", "category": None}}

    weekly_digest.run(job)

    markdown = fake.saved_reports[0]["markdown"]
    assert "# Weekly Digest: Cyber Weekly" in markdown
    assert "## Top Sources" in markdown
    assert "## Top Articles" in markdown
    assert "## Key Excerpts" in markdown
    assert "## Links" in markdown
    for source in SAMPLE_SOURCES:
        assert source["title"] in markdown
        assert source["url"] in markdown


def test_digest_populates_report_sources(patch_db):
    fake = patch_db(FakeDB(sources=SAMPLE_SOURCES))
    job = {"id": 3, "payload": {"digest": "ai"}}

    weekly_digest.run(job)

    report_id = fake.saved_reports[0]["id"]
    assert fake.report_sources == [(report_id, 31), (report_id, 32)]
    assert fake.saved_reports[0]["source_ids"] == [31, 32]


def test_digest_with_explicit_category(patch_db):
    fake = patch_db(FakeDB(sources=SAMPLE_SOURCES))
    job = {"id": 4, "payload": {"category": "software", "days": 14, "limit": 5}}

    weekly_digest.run(job)

    call = fake.recent_calls[0]
    assert call["category"] == "software"
    assert call["days"] == 14
    assert call["limit"] == 5
    assert fake.saved_reports[0]["title"].startswith("Software Weekly")


def test_digest_unknown_preset_fails(patch_db):
    fake = patch_db(FakeDB())
    job = {"id": 5, "payload": {"digest": "nonsense"}}

    with pytest.raises(ValueError, match="unknown digest preset"):
        weekly_digest.run(job)

    assert fake.saved_reports == []


def test_digest_missing_category_fails(patch_db):
    fake = patch_db(FakeDB())
    job = {"id": 6, "payload": {}}

    with pytest.raises(ValueError, match="missing required field"):
        weekly_digest.run(job)

    assert fake.saved_reports == []


def test_digest_handles_no_sources(patch_db):
    fake = patch_db(FakeDB(sources=[]))
    job = {"id": 7, "payload": {"digest": "education"}}

    weekly_digest.run(job)

    markdown = fake.saved_reports[0]["markdown"]
    assert "_No sources in this window._" in markdown
    assert fake.report_sources == []
