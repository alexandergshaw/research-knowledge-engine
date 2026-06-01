"""Fetch and import web pages into local storage and SQLite."""

from __future__ import annotations

import hashlib
import logging
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

import requests
import yaml

from research_engine.db import Database
from research_engine.extractor import extract_text, extract_title
from research_engine.models import SourceRecord, TrustedSite, TrustedSitesConfig

LOGGER = logging.getLogger(__name__)


def load_trusted_sites(path: str | Path) -> TrustedSitesConfig:
    """Load trusted site configuration from YAML."""

    with Path(path).open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return TrustedSitesConfig.model_validate(data)


def _normalize_domain(domain_or_url: str) -> str:
    parsed = urlparse(domain_or_url)
    value = parsed.netloc or parsed.path
    return value.lower().split(":")[0]


def get_trusted_site(domain_or_url: str, config: TrustedSitesConfig) -> TrustedSite | None:
    """Return the matching trusted site for a domain or URL, if any."""

    domain = _normalize_domain(domain_or_url)
    for site in config.trusted_sites:
        trusted_domain = site.domain.lower()
        if domain == trusted_domain or domain.endswith(f".{trusted_domain}"):
            return site
    return None


def is_trusted_domain(domain_or_url: str, config: TrustedSitesConfig) -> bool:
    """Check whether a domain or URL is trusted."""

    return get_trusted_site(domain_or_url, config) is not None


def fetch_html(
    url: str,
    *,
    session: requests.Session | None = None,
    timeout: int = 30,
) -> str:
    """Fetch HTML for a URL."""

    client = session or requests.Session()
    response = client.get(
        url,
        timeout=timeout,
        headers={"User-Agent": "research-knowledge-engine/0.1"},
    )
    response.raise_for_status()
    return response.text


def import_url(
    url: str,
    *,
    db: Database,
    trusted_sites_path: str | Path,
    documents_dir: str | Path,
    force: bool = False,
    session: requests.Session | None = None,
    html_content: str | None = None,
) -> tuple[int, bool]:
    """Import a URL into local storage and SQLite."""

    existing = db.get_source_by_url(url)
    if existing and existing["raw_path"] and existing["extracted_text_path"]:
        LOGGER.info("Skipping duplicate URL import: %s", url)
        return int(existing["id"]), False

    trusted_config = load_trusted_sites(trusted_sites_path)
    matched_site = get_trusted_site(url, trusted_config)
    if matched_site is None and not force:
        raise ValueError(f"Domain is not trusted: {url}. Use --force to continue.")
    if matched_site is None:
        LOGGER.warning("Importing untrusted URL because --force was provided: %s", url)

    html = html_content if html_content is not None else fetch_html(url, session=session)
    title = extract_title(html)
    content = extract_text(html, url=url)
    accessed_at = datetime.now(UTC).isoformat()
    domain = _normalize_domain(url)

    doc_root = Path(documents_dir)
    raw_dir = doc_root / "raw_html"
    extracted_dir = doc_root / "extracted_text"
    raw_dir.mkdir(parents=True, exist_ok=True)
    extracted_dir.mkdir(parents=True, exist_ok=True)

    file_hash = hashlib.sha256(url.encode("utf-8")).hexdigest()
    raw_path = raw_dir / f"{file_hash}.html"
    extracted_path = extracted_dir / f"{file_hash}.txt"
    raw_path.write_text(html, encoding="utf-8")
    extracted_path.write_text(content, encoding="utf-8")

    if existing:
        db.update_source_content(
            int(existing["id"]),
            title=title,
            accessed_at=accessed_at,
            raw_path=str(raw_path),
            extracted_text_path=str(extracted_path),
            content=content,
        )
        return int(existing["id"]), False

    source = SourceRecord(
        title=title,
        url=url,
        domain=domain,
        source_type="web",
        category=matched_site.category if matched_site else None,
        trust_level=matched_site.trust_level if matched_site else "untrusted",
        published_at=None,
        fetched_at=None,
        accessed_at=accessed_at,
        raw_path=str(raw_path),
        extracted_text_path=str(extracted_path),
        content=content,
        tags=[],
    )
    return db.insert_source(source)
