from __future__ import annotations

from pathlib import Path

import feedparser
import pytest

from research_engine.db import Database
from research_engine.extractor import extract_text
from research_engine.indexer import rebuild_index
from research_engine.models import RSSFeedDefinition, SourceRecord
from research_engine.reports import generate_research_report
from research_engine.rss import load_rss_config, parse_feed_entries
from research_engine.search import search_sources
from research_engine.web_fetcher import import_url, is_trusted_domain, load_trusted_sites


def create_database(tmp_path: Path) -> Database:
    db = Database(tmp_path / "research.db")
    db.initialize()
    return db


def test_load_rss_config(tmp_path: Path) -> None:
    config_path = tmp_path / "rss_feeds.yaml"
    config_path.write_text(
        """
feeds:
  - name: Example Feed
    url: https://example.com/feed.xml
    category: news
    tags: [example]
""".strip(),
        encoding="utf-8",
    )

    config = load_rss_config(config_path)

    assert len(config.feeds) == 1
    assert config.feeds[0].name == "Example Feed"


def test_parse_feed_entries() -> None:
    parsed = feedparser.parse(
        """
        <rss version="2.0">
          <channel>
            <title>Example Feed</title>
            <item>
              <title>Example Item</title>
              <link>https://example.com/item</link>
              <description>Item summary</description>
              <category>security</category>
              <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
        """
    )

    entries = parse_feed_entries(
        parsed,
        RSSFeedDefinition(
            name="Example Feed",
            url="https://example.com/feed.xml",
            category="security",
            tags=["feed-tag"],
        ),
    )

    assert len(entries) == 1
    assert str(entries[0].url) == "https://example.com/item"
    assert entries[0].category == "security"
    assert "feed-tag" in entries[0].tags


def test_trusted_domain_checking(tmp_path: Path) -> None:
    trusted_sites_path = tmp_path / "trusted_sites.yaml"
    trusted_sites_path.write_text(
        """
trusted_sites:
  - domain: python.org
    category: software
    trust_level: high
""".strip(),
        encoding="utf-8",
    )

    config = load_trusted_sites(trusted_sites_path)

    assert is_trusted_domain("https://docs.python.org/3/", config)
    assert not is_trusted_domain("https://example.com/page", config)


def test_import_url_duplicate_detection(tmp_path: Path) -> None:
    trusted_sites_path = tmp_path / "trusted_sites.yaml"
    trusted_sites_path.write_text(
        """
trusted_sites:
  - domain: example.com
    category: news
    trust_level: medium
""".strip(),
        encoding="utf-8",
    )
    documents_dir = tmp_path / "documents"
    db = create_database(tmp_path)

    first = import_url(
        "https://example.com/article",
        db=db,
        trusted_sites_path=trusted_sites_path,
        documents_dir=documents_dir,
        html_content="<html><head><title>Example</title></head><body><article>Alpha text</article></body></html>",
    )
    second = import_url(
        "https://example.com/article",
        db=db,
        trusted_sites_path=trusted_sites_path,
        documents_dir=documents_dir,
        html_content="<html><body>Different body</body></html>",
    )

    assert first[1] is True
    assert second[1] is False


def test_text_extraction_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("research_engine.extractor.trafilatura.extract", lambda *args, **kwargs: None)

    text = extract_text(
        "<html><body><main><h1>Heading</h1><p>Useful content.</p></main></body></html>"
    )

    assert "Heading" in text
    assert "Useful content." in text


def test_database_insert_and_query(tmp_path: Path) -> None:
    db = create_database(tmp_path)

    source_id, created = db.insert_source(
        SourceRecord(
            title="Database test",
            url="https://example.com/db",
            domain="example.com",
            source_type="web",
            category="testing",
            trust_level="high",
            accessed_at="2024-01-01T00:00:00+00:00",
            content="database content",
            tags=["database"],
        )
    )

    stored = db.get_source_by_url("https://example.com/db")
    assert created is True
    assert source_id > 0
    assert stored is not None
    assert stored["title"] == "Database test"


def test_fts_search(tmp_path: Path) -> None:
    db = create_database(tmp_path)
    db.insert_source(
        SourceRecord(
            title="Python testing guide",
            url="https://docs.python.org/testing",
            domain="docs.python.org",
            source_type="web",
            category="software",
            trust_level="high",
            accessed_at="2024-01-01T00:00:00+00:00",
            content="Python testing and unittest reference material",
            tags=["python", "testing"],
        )
    )
    rebuild_index(db)

    results = search_sources(db, "python testing", domain="docs.python.org")

    assert len(results) == 1
    assert results[0].title == "Python testing guide"


def test_report_generation(tmp_path: Path) -> None:
    db = create_database(tmp_path)
    db.insert_source(
        SourceRecord(
            title="Automated grading systems",
            url="https://example.com/grading",
            domain="example.com",
            source_type="web",
            category="education",
            trust_level="high",
            accessed_at="2024-01-01T00:00:00+00:00",
            content="Automated grading systems can support rubric based assessment.",
            tags=["grading", "assessment"],
        )
    )
    rebuild_index(db)

    report_path = generate_research_report(
        db,
        "automated grading systems",
        limit=10,
        output_dir=tmp_path / "exports",
    )

    report_text = report_path.read_text(encoding="utf-8")
    assert report_path.name == "automated-grading-systems-report.md"
    assert "Automated grading systems" in report_text
    assert "Bibliography" in report_text
