from core import thresholds as T
from fastapi.testclient import TestClient

from main import app
from services import state
from services.ingest import ingest
from services.monitor import Monitor

CRIT = {"heart_rate": 150, "radiation_level": 3.5, "co2_level": 0.2, "sleep_debt": 9.0}
NORMAL = {"heart_rate": 75}


class Clock:
    def __init__(self):
        self.t = 10_000.0

    def __call__(self):
        return self.t


def make(crew):
    """Analyzer va monitor bir xil soatdan foydalanadi (sinov uchun)."""
    clock = Clock()
    state.get_analyzer(crew)._clock = clock
    return clock, Monitor(clock=clock)


def events(crew):
    return [e["kind"] for e in state.storage.list_events(crew, 100)]


def test_status_change_recorded():
    crew = "CREW-S"
    clock, mon = make(crew)
    ingest({**NORMAL, "crew_id": crew})
    mon.tick()                      # boshlang'ich holat: NORMAL
    for _ in range(3):
        ingest({**CRIT, "crew_id": crew})
    mon.tick()                      # CRITICAL ga o'tdi
    assert "STATUS_CHANGE" in events(crew)


def test_escalation_when_critical_without_checkin():
    crew = "CREW-E"
    clock, mon = make(crew)
    for _ in range(3):
        ingest({**CRIT, "crew_id": crew})
    mon.tick()
    assert "ESCALATION" not in events(crew)
    clock.t += T.CHECKIN_TIMEOUT_S + 1
    for _ in range(3):
        ingest({**CRIT, "crew_id": crew})  # hali ham CRITICAL
    mon.tick()
    assert "ESCALATION" in events(crew)


def test_checkin_prevents_escalation():
    crew = "CREW-OK"
    clock, mon = make(crew)
    for _ in range(3):
        ingest({**CRIT, "crew_id": crew})
    mon.tick()
    state.storage.add_checkin(crew, "OK", "hammasi yaxshi")
    clock.t += T.CHECKIN_TIMEOUT_S + 1
    mon.tick()
    assert "ESCALATION" not in events(crew)


def test_need_help_checkin_escalates_immediately():
    client = TestClient(app)
    r = client.post("/crew/CREW-H/checkin", json={"status": "NEED_HELP", "note": "nafas qisilyapti"})
    assert r.status_code == 200
    assert "ESCALATION" in events("CREW-H")


def test_los_start_and_end():
    crew = "CREW-L"
    clock, mon = make(crew)
    ingest({**NORMAL, "crew_id": crew})
    mon.tick()                      # NORMAL
    clock.t += T.STALE_AFTER_S + 5  # ma'lumot kelmayapti
    mon.tick()                      # STALE
    assert "LOS_START" in events(crew)
    ingest({**NORMAL, "crew_id": crew})
    mon.tick()
    assert "LOS_END" in events(crew)
