"""Yagona kirish nuqtasi: API ham, simulyator ham shu funksiyadan foydalanadi."""
import uuid
from datetime import datetime, timezone

from core import thresholds as T
from services import state


def ingest(data: dict) -> dict:
    crew_id = data.get("crew_id") or T.DEFAULT_CREW_ID
    mission_id = data.get("mission_id") or T.DEFAULT_MISSION_ID
    event_id = data.get("event_id") or str(uuid.uuid4())

    analyzer = state.get_analyzer(crew_id)
    point = analyzer.build_point(data)
    received_at = datetime.now(timezone.utc).timestamp()

    is_new = state.storage.insert_sample(event_id, crew_id, mission_id, received_at, point)
    if not is_new:
        return {"status": "duplicate", "crew_id": crew_id, "event_id": event_id}

    analyzer._append(point)
    return {"status": "accepted", "crew_id": crew_id, "event_id": event_id}
