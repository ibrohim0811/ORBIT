import os
import sys
import tempfile
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent / "app"
sys.path.insert(0, str(APP_DIR))
# Testlar haqiqiy bazaga tegmasligi uchun vaqtinchalik SQLite fayli
os.environ["DATABASE_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

import pytest  # noqa: E402

from services import state  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_state():
    state.storage.clear()
    state.reset_memory()
    yield
    state.storage.clear()
    state.reset_memory()
