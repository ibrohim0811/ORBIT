import asyncio

from fastapi.testclient import TestClient

from main import app
from services import ai
from services.ingest import ingest

client = TestClient(app)


def test_dashboard_risk_budget_has_frontend_keys():
    ingest({"crew_id": "CREW-RB", "heart_rate": 90})
    rb = client.get("/dashboard?crew_id=CREW-RB").json()["risk_budget"]
    assert set(rb) == {"overall_score", "radiation", "heart_rate", "co2", "sleep"}


def test_notes_include_crew_id():
    client.post("/notes?crew_id=CREW-NC", json={"author": "A", "text": "salom"})
    note = client.get("/notes?crew_id=CREW-NC").json()["notes"][0]
    assert note["crew_id"] == "CREW-NC"


def test_chat_engine_is_string(monkeypatch):
    monkeypatch.setattr(ai, "OLLAMA_URL", "http://127.0.0.1:9")
    ai._STATUS_CACHE.update(at=0.0, value=None)
    body = client.post("/chat?crew_id=CREW-CE", json={"message": "salom"}).json()
    assert isinstance(body["engine"], str)
    assert body["engine"].endswith("(Offline)")


def test_cors_never_wildcard_with_credentials():
    from main import app as a
    cors = [m for m in a.user_middleware if "CORS" in str(m.cls)]
    assert cors and cors[0].kwargs.get("allow_credentials") is False
    assert "*" not in cors[0].kwargs["allow_origins"]


def test_ai_status_string_contract(monkeypatch):
    monkeypatch.setattr(ai, "OLLAMA_URL", "http://127.0.0.1:9")
    ai._STATUS_CACHE.update(at=0.0, value=None)
    body = client.get("/ai/status").json()
    assert isinstance(body, str)
    assert body.endswith("(Offline)")
