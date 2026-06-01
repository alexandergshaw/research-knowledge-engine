"""Root pytest configuration.

Adds the packages/ directory to sys.path so that shared packages
(e.g. research_engine) can be imported without installation.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure packages/ is on the path for all tests in the monorepo
sys.path.insert(0, str(Path(__file__).resolve().parent / "packages"))
