"""Pydantic models used by the research knowledge engine."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class RSSFeedDefinition(BaseModel):
    """An RSS feed definition loaded from configuration."""

    name: str
    url: HttpUrl
    category: str | None = None
    tags: list[str] = Field(default_factory=list)


class RSSFeedsConfig(BaseModel):
    """A collection of RSS feeds."""

    feeds: list[RSSFeedDefinition] = Field(default_factory=list)


class TrustedSite(BaseModel):
    """A trusted site definition loaded from configuration."""

    domain: str
    category: str | None = None
    trust_level: str = "unknown"


class TrustedSitesConfig(BaseModel):
    """A collection of trusted sites."""

    trusted_sites: list[TrustedSite] = Field(default_factory=list)


class SourceRecord(BaseModel):
    """The canonical source record stored in SQLite."""

    title: str
    url: HttpUrl
    domain: str
    source_type: Literal["rss", "web"]
    category: str | None = None
    trust_level: str | None = None
    published_at: str | None = None
    fetched_at: str | None = None
    accessed_at: str | None = None
    raw_path: str | None = None
    extracted_text_path: str | None = None
    content: str | None = None
    tags: list[str] = Field(default_factory=list)


class SearchResult(BaseModel):
    """A search result returned from the FTS index."""

    title: str
    url: str
    domain: str
    category: str | None = None
    published_at: str | None = None
    accessed_at: str | None = None
    snippet: str | None = None
    rank: float
    tags: list[str] = Field(default_factory=list)
