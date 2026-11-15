from fastapi.testclient import TestClient
from main import app
from services import state
from services.ingest import ingest
from services.risk_engine import classify_point, compute_risk_budget
from services.simulator import TelemetrySimulator

client = TestClient(app)


def test_telemetry_new_fields_in_simulator():
    sim = TelemetrySimulator()
    sim.set_mode("normal")
    p_norm = sim.generate_point("CREW-1")
    assert "blood_sugar" in p_norm and "body_temperature" in p_norm
    assert 70.0 <= p_norm["blood_sugar"] <= 110.0
    assert 36.5 <= p_norm["body_temperature"] <= 37.5

    sim.set_mode("warning")
    p_warn = sim.generate_point("CREW-1")
    assert 120.0 <= p_warn["blood_sugar"] <= 160.0
    assert 37.4 <= p_warn["body_temperature"] <= 38.5

    sim.set_mode("critical")
    p_crit = sim.generate_point("CREW-1")
    assert p_crit["blood_sugar"] >= 180.0
    assert p_crit["body_temperature"] >= 38.5


def test_risk_engine_evaluates_new_metrics():
    # Normal point
    p_normal = {
        "heart_rate": 72.0,
        "radiation_level": 0.1,
        "co2_level": 0.04,
        "sleep_debt": 1.0,
        "blood_glucose_mgdl": 92.0,
        "body_temp_c": 36.8,
        "sleep_hours_last_night": 7.5,
    }
    assert classify_point(p_normal) == "NORMAL"

    # Critical sugar high (> 250) and low (< 54)
    assert classify_point({**p_normal, "blood_glucose_mgdl": 260.0}) == "CRITICAL"
    assert classify_point({**p_normal, "blood_glucose_mgdl": 50.0}) == "CRITICAL"

    # Warning sugar high (> 140) and low (< 70)
    assert classify_point({**p_normal, "blood_glucose_mgdl": 150.0}) == "WARNING"
    assert classify_point({**p_normal, "blood_glucose_mgdl": 65.0}) == "WARNING"

    # Critical temperature high (>= 39.0) and low (< 35.0)
    assert classify_point({**p_normal, "body_temp_c": 39.2}) == "CRITICAL"
    assert classify_point({**p_normal, "body_temp_c": 34.8}) == "CRITICAL"

    # Warning temperature high (>= 37.8) and low (< 35.5)
    assert classify_point({**p_normal, "body_temp_c": 38.0}) == "WARNING"
    assert classify_point({**p_normal, "body_temp_c": 35.2}) == "WARNING"

    # Sleep hours warning (< 6.0)
    assert classify_point({**p_normal, "sleep_hours_last_night": 5.5}) == "WARNING"

    # Risk budget calculation
    budget = compute_risk_budget({**p_normal, "blood_glucose_mgdl": 260.0}, 0.25)
    assert "blood_glucose_risk_pct" in budget
    assert "body_temp_risk_pct" in budget
    assert budget["blood_glucose_risk_pct"] > 50.0
    assert 0.0 <= budget["overall_score"] <= 100.0


def test_storage_and_api_with_new_metrics():
    crew = "CREW-TEST-METRICS"
    p = {
        "crew_id": crew,
        "heart_rate": 80.0,
        "blood_pressure_sys": 122.0,
        "radiation_level": 0.15,
        "co2_level": 0.04,
        "sleep_debt": 1.5,
        "blood_sugar": 96.5,
        "body_temperature": 36.9,
    }
    res = ingest(p)
    assert res["status"] == "accepted"

    latest = state.storage.latest_sample(crew)
    assert latest is not None
    assert latest["blood_sugar"] == 96.5
    assert latest["body_temperature"] == 36.9

    # Test dashboard endpoint
    dash = client.get(f"/dashboard?crew_id={crew}").json()
    assert dash["latest_vitals"]["blood_sugar"] == 96.5
    assert dash["latest_vitals"]["body_temperature"] == 36.9


def test_gamification_endpoints():
    crew = "CREW-TEST-GAMIFICATION"
    state.storage.reset_gamification(crew)

    # 1. Get gamification state
    res = client.get(f"/gamification?crew_id={crew}").json()
    assert res["crew_id"] == crew
    assert res["streak_days"] >= 1
    assert "tasks" in res and len(res["tasks"]) == 5
    assert "badges" in res and len(res["badges"]) >= 5

    # 2. Toggle task
    task = res["tasks"][0]
    toggle_res = client.post(
        "/gamification/task/toggle",
        json={"crew_id": crew, "task_id": task["task_id"], "completed": True},
    ).json()
    assert toggle_res["tasks_completed"] >= 1
    t0 = next(t for t in toggle_res["tasks"] if t["task_id"] == task["task_id"])
    assert t0["completed"] is True
    assert toggle_res["total_points"] > res["total_points"]

    # 3. Toggle back
    uncheck_res = client.post(
        "/gamification/task/toggle",
        json={"crew_id": crew, "task_id": task["task_id"], "completed": False},
    ).json()
    t0_back = next(t for t in uncheck_res["tasks"] if t["task_id"] == task["task_id"])
    assert t0_back["completed"] is False


def test_checkin_mood_symptoms_and_behavioral_warning():
    crew = "CREW-TEST-MOOD"
    # First check-in with mood 2
    res1 = client.post(
        f"/crew/{crew}/checkin",
        json={"status": "OK", "note": "Charchoq bor", "mood": 2, "symptoms": ["Charchoq", "Bosh og'rig'i"]},
    ).json()
    assert res1["status"] == "recorded"
    assert res1["mood"] == 2
    assert "Bosh og'rig'i" in res1["symptoms"]

    # Verify no behavioral warning yet
    events1 = client.get(f"/events?crew_id={crew}").json()["events"]
    assert not any(e["type"] == "BEHAVIORAL_WARNING" for e in events1)

    # Second consecutive check-in with mood 1
    res2 = client.post(
        f"/crew/{crew}/checkin",
        json={"status": "OK", "note": "Kayfiyat juda yomon", "mood": 1, "symptoms": ["Uyqusizlik"]},
    ).json()
    assert res2["status"] == "recorded"

    # Now BEHAVIORAL_WARNING event must be recorded
    events2 = client.get(f"/events?crew_id={crew}").json()["events"]
    assert any(e["type"] == "BEHAVIORAL_WARNING" for e in events2)

    # Check gamification auto-completed task_checkin
    gam = client.get(f"/gamification?crew_id={crew}").json()
    checkin_task = next(t for t in gam["tasks"] if t["task_id"] == "task_checkin")
    assert checkin_task["completed"] is True
