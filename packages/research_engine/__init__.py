"""Utilities for retrieving, storing, indexing, and searching online sources."""

from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent
# packages/research_engine → packages → repo root
REPO_ROOT = PACKAGE_ROOT.parent.parent
DEFAULT_DATABASE_PATH = REPO_ROOT / "database" / "research.db"
DEFAULT_DOCUMENTS_PATH = REPO_ROOT / "documents"
DEFAULT_EXPORTS_PATH = REPO_ROOT / "exports"
DEFAULT_RSS_CONFIG_PATH = REPO_ROOT / "data" / "feeds" / "rss_feeds.yaml"
DEFAULT_TRUSTED_SITES_PATH = REPO_ROOT / "data" / "trusted_sites" / "trusted_sites.yaml"
