"""Strongly typed category taxonomy model and helpers.

This module loads the canonical taxonomy from ``data/source_categories.yaml`` and
exposes typed access plus validation helpers shared across all projects that
consume the taxonomy (Research Knowledge Engine, Personal Knowledge Base,
Classroom Artifact Grader, Course Generator, Workflow Automation Platform,
Resume Tailoring Engine).

All category and subcategory names are kebab-case.

Public helpers
--------------
list_categories()                      -> list[str]
list_subcategories(category)           -> list[str]
validate_category(category)            -> bool
validate_subcategory(category, sub)    -> bool
find_category_by_tag(tag)              -> str | None
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import yaml
from pydantic import BaseModel, Field

# Repo root is four levels up: packages/shared/models/source_category.py
_REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CATEGORIES_PATH = _REPO_ROOT / "data" / "source_categories.yaml"


class SourceCategory(BaseModel):
    """A single top-level category in the taxonomy."""

    name: str
    description: str
    tags: list[str] = Field(default_factory=list)
    subcategories: list[str] = Field(default_factory=list)


class SourceCategoryTaxonomy(BaseModel):
    """The full taxonomy: a mapping of kebab-case key -> SourceCategory."""

    categories: dict[str, SourceCategory] = Field(default_factory=dict)


def load_taxonomy(path: str | Path | None = None) -> SourceCategoryTaxonomy:
    """Load and validate the taxonomy from YAML.

    Args:
        path: Optional override for the taxonomy file location.

    Returns:
        A validated :class:`SourceCategoryTaxonomy`.
    """
    config_path = Path(path) if path is not None else DEFAULT_CATEGORIES_PATH
    with config_path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    return SourceCategoryTaxonomy.model_validate(data)


@lru_cache(maxsize=1)
def _cached_taxonomy() -> SourceCategoryTaxonomy:
    """Return the taxonomy loaded from the default path, cached per process."""
    return load_taxonomy()


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def list_categories() -> list[str]:
    """Return all top-level category keys (kebab-case)."""
    return list(_cached_taxonomy().categories.keys())


def list_subcategories(category: str) -> list[str]:
    """Return the subcategories for ``category``.

    Args:
        category: A top-level category key.

    Returns:
        The list of subcategory names, or an empty list if the category is
        unknown.
    """
    entry = _cached_taxonomy().categories.get(category)
    return list(entry.subcategories) if entry else []


def validate_category(category: str) -> bool:
    """Return ``True`` if ``category`` is a known top-level category."""
    return category in _cached_taxonomy().categories


def validate_subcategory(category: str, subcategory: str) -> bool:
    """Return ``True`` if ``subcategory`` is valid for ``category``."""
    entry = _cached_taxonomy().categories.get(category)
    return bool(entry) and subcategory in entry.subcategories


def find_category_by_tag(tag: str) -> str | None:
    """Return the category key whose tags include ``tag``.

    Matching is case-insensitive. Returns the first matching category key, or
    ``None`` if no category lists the tag.
    """
    needle = tag.strip().lower()
    for key, entry in _cached_taxonomy().categories.items():
        if needle == key.lower() or needle in {t.lower() for t in entry.tags}:
            return key
    return None


__all__ = [
    "SourceCategory",
    "SourceCategoryTaxonomy",
    "DEFAULT_CATEGORIES_PATH",
    "load_taxonomy",
    "list_categories",
    "list_subcategories",
    "validate_category",
    "validate_subcategory",
    "find_category_by_tag",
]
