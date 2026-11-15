import asyncio
import time
from unittest.mock import patch

from fastapi.testclient import TestClient

from core import thresholds as T
from main import app
from services import state
from services.ingest import ingest
from services.monitor import Monitor
from services.simulator import TelemetrySimulator

client = TestClient(app)


def test_need_help_does_not_clear_timeout_escalation():
    """Problem 2.1: NEED_HELP checkin should not clear escalation timeout."""
    crew = "CREW-TEST-NH"
    mon = Monitor(clock=lambda: 1000.0)
    # Add critical telemetry
    for _ in range(3):
        ingest({"crew_id": crew, "heart_rate": 150, "radiation_level": 3.5})
    mon.tick()

    # Ekipaj NEED_HELP yubordi
    state.storage.add_checkin(crew, "NEED_HELP", "Nafas qisilyapti")
    assert not mon._checked_in_since(crew, 1000.0)

    # Ekipaj OK yubordi
    state.storage.add_checkin(crew, "OK", "Hammasi joyida")
    assert mon._checked_in_since(crew, 1000.0)


def test_action_center_safe_lookup():
    """Problem 2.4: action_center should not raise KeyError on unknown/empty/lowercase status."""
    from api.telemetry import action_center
    from services.risk_engine import recommendation

    rec = recommendation("UNKNOWN", [], [])
    res = action_center("unknown_status", rec)
    assert res["action_required"] == "NOMA'LUM"

    res_lower = action_center("critical", rec)
    assert res_lower["action_required"] == "HARAKAT QILISH SHART"

    res_none = action_center(None, rec)
    assert res_none["action_required"] == "NOMA'LUM"


def test_simulator_multi_crew_and_error_resilience():
    """Problem 1.3 & 2.2: Simulator generates data for all configured crews and survives exceptions."""
    sim = TelemetrySimulator(interval=0.01, crew_ids=("CREW-1", "CREW-2", "CREW-3"))
    p1 = sim.generate_point("CREW-1")
    p2 = sim.generate_point("CREW-2")
    assert p1["crew_id"] == "CREW-1"
    assert p2["crew_id"] == "CREW-2"

    async def _async_test():
        with patch("services.simulator.ingest", side_effect=RuntimeError("DB error")):
            task = asyncio.create_task(sim._run())
            await asyncio.sleep(0.03)
            assert not task.done()  # Task must still be running, not crashed!
            task.cancel()

    asyncio.run(_async_test())


def test_storage_count_notes_and_prune():
    """Problem 3.1 & 3.3: count_notes and prune_old_samples."""
    crew = "CREW-COUNT"
    assert state.storage.count_notes(crew) == 0
    state.storage.add_note(crew, "Doctor", "Note 1")
    state.storage.add_note(crew, "Doctor", "Note 2")
    assert state.storage.count_notes(crew) == 2

    # Prune
    deleted = state.storage.prune_old_samples(max_age_seconds=0)  # Prune everything older than now
    assert isinstance(deleted, int)


def test_no_double_stale_event():
    """Problem 2.3: STALE transition should not double record STATUS_CHANGE and LOS_START."""
    crew = "CREW-STALE-CHECK"
    t = 1000.0
    mon = Monitor(clock=lambda: t)
    state.get_analyzer(crew)._clock = lambda: t

    ingest({"crew_id": crew, "heart_rate": 75})
    mon.tick()  # NORMAL

    t += T.STALE_AFTER_S + 5  # Goes to STALE
    mon.tick()

    events = state.storage.list_events(crew, 10)
    kinds = [e["kind"] for e in events]
    # Should contain LOS_START, but NOT duplicate STATUS_CHANGE in the same tick
    assert kinds.count("LOS_START") == 1
    assert kinds.count("STATUS_CHANGE") == 0
