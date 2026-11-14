from fastapi.testclient import TestClient

from main import app

client = TestClient(app)  # lifespan ishlatilmaydi: simulyator testda o'chiq


def test_root():
    assert client.get("/").json()["message"] == "ORBIT is working..."


def test_status_without_data_is_stale():
    body = client.get("/status").json()
    assert body["action_center"]["level"] == "STALE"


def test_push_validation_rejects_negative_and_out_of_range():
    assert client.post("/push", json={"heart_rate": -500}).status_code == 422
    assert client.post("/push", json={"radiation_level": 99}).status_code == 422


def test_push_then_status_critical():
    for _ in range(3):
        assert client.post("/push", json={"heart_rate": 150, "radiation_level": 3.5}).status_code == 200
    body = client.get("/status").json()
    assert body["action_center"]["level"] == "CRITICAL"
    assert "risk_budget" in body["analytics_summary"]


def test_simulator_mode_endpoint():
    assert client.post("/simulator/mode?mode=bogus").status_code == 400
    r = client.post("/simulator/mode?mode=storm").json()
    assert r["current_mode"] == "critical"
    assert client.post("/simulator/mode?mode=normal").status_code == 200


def test_websocket_sends_payload():
    with client.websocket_connect("/ws/telemetry") as ws:
        msg = ws.receive_json()
        assert msg["status"] == "connected"
        assert "analytics" in msg
