import time

from fastapi.testclient import TestClient

from main import app
from services import ai, state
from services.ingest import ingest

client = TestClient(app)
NORMAL = {"heart_rate": 75, "radiation_level": 0.1}


def test_dashboard_stale_when_empty():
    body = client.get("/dashboard?crew_id=CREW-D").json()
    assert body["system_status"] == "STALE"
    assert body["latest_vitals"]["heart_rate"] is None


def test_dashboard_has_vitals_after_data():
    ingest({**NORMAL, "crew_id": "CREW-D2", "heart_rate": 88})
    body = client.get("/dashboard?crew_id=CREW-D2").json()
    assert body["latest_vitals"]["heart_rate"] == 88
    assert body["risk_budget"] is not None


def test_notes_save_and_list():
    r = client.post("/notes?crew_id=CREW-N", json={"author": "Stone", "text": "Suit O2 tekshirildi"})
    assert r.status_code == 200
    notes = client.get("/notes?crew_id=CREW-N").json()["notes"]
    assert notes[0]["text"] == "Suit O2 tekshirildi"


def test_notes_validation():
    assert client.post("/notes", json={"author": "", "text": "x"}).status_code == 422


def test_search_finds_notes_and_events():
    client.post("/notes?crew_id=CREW-S", json={"author": "A", "text": "Radiatsiya ogohlantirish"})
    state.storage.add_event("CREW-S", "LOS_START", "Aloqa uzildi", time.time())
    res = client.get("/search?crew_id=CREW-S&q=radiatsiya").json()
    assert res["count"] == 1 and res["results"][0]["type"] == "note"
    res2 = client.get("/search?crew_id=CREW-S&q=aloqa").json()
    assert res2["results"][0]["type"] == "event"


def test_history_filter_by_heart_rate():
    ingest({"crew_id": "CREW-H", "heart_rate": 70})
    ingest({"crew_id": "CREW-H", "heart_rate": 140})
    rows = client.get("/telemetry/history?crew_id=CREW-H&hr_min=120").json()["samples"]
    assert len(rows) == 1 and rows[0]["heart_rate"] == 140


def test_sync_synced_when_link_ok_then_no_pending():
    ingest({"crew_id": "CREW-Y"})
    ingest({"crew_id": "CREW-Y"})
    r = client.post("/sync?crew_id=CREW-Y").json()
    assert r["status"] == "synced" and r["synced_samples"] == 2
    assert client.get("/sync/status?crew_id=CREW-Y").json()["pending_samples"] == 0


def test_sync_deferred_during_los():
    state.get_analyzer("CREW-L2")  # ma'lumot yo'q: LOS
    r = client.post("/sync?crew_id=CREW-L2").json()
    assert r["status"] == "deferred"


def test_chat_falls_back_when_ollama_offline(monkeypatch):
    monkeypatch.setattr(ai, "OLLAMA_URL", "http://127.0.0.1:9")  # hech kim tinglamaydigan port
    ai._STATUS_CACHE.update(at=0.0, value=None)
    ingest({"crew_id": "CREW-C", "heart_rate": 150, "radiation_level": 3.5, "co2_level": 0.2})
    for _ in range(2):
        ingest({"crew_id": "CREW-C", "heart_rate": 150, "radiation_level": 3.5, "co2_level": 0.2})
    body = client.post("/chat?crew_id=CREW-C", json={"message": "Holat qanday?"}).json()
    assert body["source"] == "rule_fallback"
    assert "qoida asosidagi" in body["answer"]
    assert body["engine"]["state"] == "Offline"


def test_ai_status_offline(monkeypatch):
    monkeypatch.setattr(ai, "OLLAMA_URL", "http://127.0.0.1:9")
    ai._STATUS_CACHE.update(at=0.0, value=None)
    assert client.get("/ai/status").json()["state"] == "Offline"
