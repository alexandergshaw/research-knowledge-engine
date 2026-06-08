"""Pytest configuration for the worker package.

Adds ``apps/worker`` to ``sys.path`` so ``research_worker`` can be imported
without installation when running the test suite from the repo root.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
