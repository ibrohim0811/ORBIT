from services import state
from services.ingest import ingest

NORMAL = {"heart_rate": 75, "radiation_level": 0.1, "co2_level": 0.04, "sleep_debt": 1.0}


def test_sample_is_persisted():
    ingest({**NORMAL, "crew_id": "CREW-A"})
    assert len(state.storage.load_recent_samples("CREW-A", 10)) == 1


def test_duplicate_event_id_is_ignored():
    first = ingest({**NORMAL, "event_id": "evt-1"})
    second = ingest({**NORMAL, "event_id": "evt-1"})
    assert first["status"] == "accepted"
    assert second["status"] == "duplicate"
    assert len(state.storage.load_recent_samples("CREW-1", 10)) == 1
    assert len(state.get_analyzer("CREW-1").window) == 1


def test_state_restored_after_restart():
    for _ in range(5):
        ingest({"radiation_level": 1.0, "crew_id": "CREW-R"})
    dose_before = state.get_analyzer("CREW-R").cumulative_dose_msv
    state.reset_memory()  # server qayta ishga tushdi
    restored = state.get_analyzer("CREW-R")
    assert abs(restored.cumulative_dose_msv - dose_before) < 1e-12
    assert len(restored.window) == 5
    assert restored.is_stale()  # yangi ma'lumot kelmaguncha STALE


def test_crews_are_isolated():
    ingest({"crew_id": "CREW-X", "heart_rate": 150, "radiation_level": 3.5, "co2_level": 0.2})
    assert state.get_analyzer("CREW-Y").window == type(state.get_analyzer("CREW-Y").window)()
    assert "CREW-X" in state.known_crews()
