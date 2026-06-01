"""Handler for import_url jobs.

Payload schema::

    {
        "url": "https://example.com/article",
        "category": "software",        # optional
        "tags": ["python", "docs"]     # optional
    }
"""

from __future__ import annotations

import logging
import os
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
import trafilatura

from research_worker import db

logger = logging.getLogger(__name__)

FETCH_TIMEOUT = int(os.environ.get("FETCH_TIMEOUT_SECONDS", "30"))
MAX_CONTENT_CHARS = int(os.environ.get("MAX_CONTENT_CHARS", "100000"))


def _fetch_html(url: str) -> str:
    response = requests.get(
        url,
        timeout=FETCH_TIMEOUT,
        headers={"User-Agent": "research-knowledge-engine-worker/1.0"},
    )
    response.raise_for_status()
    return response.text


def _extract_title(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    if soup.title and soup.title.text.strip():
        return soup.title.text.strip()
    heading = soup.find(["h1", "h2"])
    if heading and heading.get_text(strip=True):
        return heading.get_text(strip=True)
    return "Untitled"


def _extract_text(html: str, url: str) -> str:
    extracted = trafilatura.extract(
        html,
        url=url,
        include_comments=False,
        include_links=False,
    )
    if extracted and extracted.strip():
        return extracted.strip()[:MAX_CONTENT_CHARS]

    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    container = soup.find("article") or soup.find("main") or soup.body or soup
    lines = [line.strip() for line in container.get_text("\n").splitlines()]
    text = "\n".join(line for line in lines if line)
    return text[:MAX_CONTENT_CHARS]


def _extract_domain(url: str) -> str:
    parsed = urlparse(url)
    return (parsed.netloc or parsed.path).lower().split(":")[0]


def run(job: dict[str, Any]) -> None:
    """Execute an import_url job."""
    job_id: int = job["id"]
    payload: dict[str, Any] = job.get("payload") or {}

    url: str | None = payload.get("url")
    if not url:
        raise ValueError("import_url payload missing required field: url")

    category: str | None = payload.get("category")
    tags: list[str] = payload.get("tags") or []

    db.write_job_log(job_id, "info", f"Fetching URL: {url}")
    logger.info("[job %s] Fetching URL: %s", job_id, url)

    html = _fetch_html(url)
    title = _extract_title(html)
    content = _extract_text(html, url)
    domain = _extract_domain(url)

    db.write_job_log(job_id, "info", f"Extracted title: {title!r}", {"domain": domain})

    source_id = db.upsert_source(
        {
            "url": url,
            "title": title,
            "domain": domain,
            "source_type": "web",
            "category": category,
            "trust_level": None,
            "published_at": None,
            "fetched_at": datetime.now(UTC).isoformat(),
            "content": content,
            "tags": tags,
        }
    )

    db.write_job_log(
        job_id,
        "info",
        f"Upserted source id={source_id}",
        {"source_id": source_id, "url": url},
    )
    logger.info("[job %s] Upserted source id=%s for %s", job_id, source_id, url)
