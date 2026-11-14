"""Ekipajga xos analyzer'lar reestri. Holat bazadan tiklanadi."""
import os

from core import thresholds as T
from services.storage import Storage
from utils.analytics import TelemetryAnalyzer

storage = Storage(os.getenv("DATABASE_PATH", "orbit.db"))
_analyzers: dict[str, TelemetryAnalyzer] = {}


def get_analyzer(crew_id: str) -> TelemetryAnalyzer:
    if crew_id not in _analyzers:
        analyzer = TelemetryAnalyzer()
        analyzer.restore(
            storage.load_recent_samples(crew_id, T.WINDOW_SIZE),
            storage.total_dose(crew_id),
        )
        _analyzers[crew_id] = analyzer
    return _analyzers[crew_id]


def known_crews() -> list[str]:
    return sorted(set(storage.known_crews()) | set(_analyzers) | {T.DEFAULT_CREW_ID})


def reset_memory() -> None:
    _analyzers.clear()
