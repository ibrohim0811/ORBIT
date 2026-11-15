import os
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent / "app"
sys.path.insert(0, str(APP_DIR))
# Testlar alohida test bazasida ishlaydi (TRUNCATE qiladi, asosiy bazaga tegmasin)
os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL", "postgresql://orbit_user:orbit_password@localhost:5432/orbit_test"
)

import pytest  # noqa: E402

from services import state  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_state():
    state.storage.clear()
    state.reset_memory()
    yield
    state.storage.clear()
    state.reset_memory()
