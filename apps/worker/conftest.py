"""Pytest configuration for the worker package.

Adds ``apps/worker`` to ``sys.path`` so ``research_worker`` can be imported
without installation when running the test suite from the repo root.

The worker's ``db`` module imports ``psycopg`` at import time, but the unit
tests stub out the entire database layer and never open a real connection.  To
keep the suite runnable in CI environments that only install the lightweight
root ``requirements.txt`` (which omits the Postgres driver), we register a
minimal ``psycopg`` stub when the real package is not available.
"""

from __future__ import annotations

import sys
import types
from importlib.util import find_spec
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))


def _install_psycopg_stub() -> None:
    """Provide a minimal ``psycopg`` stub when the real driver is absent.

    ``research_worker.db`` only needs ``psycopg`` and ``psycopg.rows.dict_row``
    to import successfully (type annotations are strings thanks to
    ``from __future__ import annotations``). The stub is never used to talk to a
    database — tests monkeypatch the DB functions directly.
    """
    if find_spec("psycopg") is not None:
        return

    psycopg_stub = types.ModuleType("psycopg")

    def _unavailable(*_args, **_kwargs):  # pragma: no cover - guard only
        raise RuntimeError(
            "psycopg is not installed; database access is unavailable in this "
            "environment"
        )

    psycopg_stub.connect = _unavailable  # type: ignore[attr-defined]
    psycopg_stub.Connection = object  # type: ignore[attr-defined]

    rows_stub = types.ModuleType("psycopg.rows")
    rows_stub.dict_row = object()  # type: ignore[attr-defined]
    psycopg_stub.rows = rows_stub  # type: ignore[attr-defined]

    sys.modules["psycopg"] = psycopg_stub
    sys.modules["psycopg.rows"] = rows_stub


_install_psycopg_stub()
