from core import thresholds as T
from services.simulator import TelemetrySimulator
from utils.analytics import TelemetryAnalyzer

NORMAL = {"heart_rate": 75, "radiation_level": 0.1, "co2_level": 0.04, "sleep_debt": 1.0}
CRIT = {"heart_rate": 150, "radiation_level": 3.5, "co2_level": 0.2, "sleep_debt": 9.0}


class Clock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


def test_empty_is_stale_not_normal():
    a = TelemetryAnalyzer(clock=Clock())
    assert a.get_statistics() == {}
    assert a.is_stale()


def test_stale_after_silence():
    clock = Clock()
    a = TelemetryAnalyzer(clock=clock)
    a.add_data_point(NORMAL)
    assert a.get_statistics()["system_status"] == "NORMAL"
    clock.t += T.STALE_AFTER_S + 1
    stats = a.get_statistics()
    assert stats["system_status"] == "STALE"
    assert stats["recommendation"]["rule_id"] == "RULE_STALE"


def test_dose_is_cumulative_beyond_window():
    a = TelemetryAnalyzer(window_size=10, clock=Clock())
    for _ in range(50):
        a.add_data_point({"radiation_level": 1.0})
    assert len(a.window) == 10
    expected = 50 * 1.0 * T.SAMPLE_INTERVAL_H
    assert abs(a.cumulative_dose_msv - expected) < 1e-12


def test_critical_confirmed_after_three_samples():
    a = TelemetryAnalyzer(clock=Clock())
    for _ in range(2):
        a.add_data_point(CRIT)
    assert a.get_statistics()["system_status"] == "NORMAL"
    a.add_data_point(CRIT)
    stats = a.get_statistics()
    assert stats["system_status"] == "CRITICAL"
    assert stats["recommendation"]["rule_id"].startswith("RULE_")
    assert stats["confidence_score"] == "RULE_BASED"


def test_recovers_to_normal_after_three_normal_samples():
    a = TelemetryAnalyzer(clock=Clock())
    for _ in range(3):
        a.add_data_point(CRIT)
    assert a.get_statistics()["system_status"] == "CRITICAL"
    for _ in range(2):
        a.add_data_point(NORMAL)
    assert a.get_statistics()["system_status"] == "CRITICAL"
    a.add_data_point(NORMAL)
    assert a.get_statistics()["system_status"] == "NORMAL"


def test_no_hardcoded_confidence_or_dose_claims():
    a = TelemetryAnalyzer(clock=Clock())
    a.add_data_point(NORMAL)
    text = str(a.get_statistics())
    assert "98.4" not in text and "74%" not in text


def test_simulator_modes_and_ranges():
    s = TelemetrySimulator()
    assert s.set_mode("storm") and s.mode == "critical"
    assert not s.set_mode("bogus")
    for mode in ("normal", "warning", "critical"):
        s.mode = mode
        p = s.generate_point()
        assert 20 <= p["heart_rate"] <= 250
        assert 0 <= p["radiation_level"] <= 10


def test_heart_rate_std_and_trend():
    a = TelemetryAnalyzer(clock=Clock())
    for i in range(10):
        a.add_data_point({"heart_rate": 70 + 2 * i})  # har namunada +2 bpm
    m = a.get_statistics()["metrics"]
    assert m["heart_rate_std"] > 0
    # 1 Hz varsayimi: +2 bpm/namuna = +120 bpm/daqiqa
    assert abs(m["heart_rate_trend_bpm_per_min"] - 120.0) < 0.5


def test_trend_none_with_few_samples():
    a = TelemetryAnalyzer(clock=Clock())
    a.add_data_point({"heart_rate": 80})
    assert a.get_statistics()["metrics"]["heart_rate_trend_bpm_per_min"] is None
