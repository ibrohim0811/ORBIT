from services.risk_engine import classify_point, compute_risk_budget, confirmed_status

NORMAL = {"heart_rate": 75, "radiation_level": 0.1, "co2_level": 0.04, "sleep_debt": 1.0}
CRIT = {"heart_rate": 150, "radiation_level": 3.5, "co2_level": 0.2, "sleep_debt": 9.0}


def test_classify_levels():
    assert classify_point(NORMAL) == "NORMAL"
    assert classify_point({**NORMAL, "heart_rate": 110}) == "WARNING"
    assert classify_point(CRIT) == "CRITICAL"


def test_escalation_needs_consecutive_samples():
    assert confirmed_status("NORMAL", ["NORMAL", "CRITICAL", "CRITICAL"]) == "NORMAL"
    assert confirmed_status("NORMAL", ["CRITICAL", "CRITICAL", "CRITICAL"]) == "CRITICAL"


def test_no_change_on_mixed_samples():
    assert confirmed_status("CRITICAL", ["CRITICAL", "NORMAL", "CRITICAL"]) == "CRITICAL"


def test_recovery_needs_full_normal_streak():
    assert confirmed_status("CRITICAL", ["NORMAL", "NORMAL"]) == "CRITICAL"
    assert confirmed_status("CRITICAL", ["NORMAL", "NORMAL", "NORMAL"]) == "NORMAL"


def test_too_few_samples_keep_current():
    assert confirmed_status("NORMAL", ["CRITICAL", "CRITICAL"]) == "NORMAL"


def test_risk_budget_bounded():
    b = compute_risk_budget(CRIT, 0.5)
    for k in ("radiation_risk_pct", "heart_rate_risk_pct", "co2_risk_pct", "sleep_risk_pct", "overall_score"):
        assert 0.0 <= b[k] <= 100.0
    assert b["cumulative_radiation_msv"] == 0.5
