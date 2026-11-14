import time
from collections import deque
from typing import Callable

import numpy as np
import pandas as pd

from core import thresholds as T
from services.risk_engine import (
    classify_point,
    compute_risk_budget,
    confirmed_status,
    recommendation,
    triggered_rules,
)


class TelemetryAnalyzer:
    def __init__(self, window_size: int = T.WINDOW_SIZE, clock: Callable[[], float] = time.time):
        """NumPy/Pandas bilan lokal tahlil: sliding window, tendentsiya va kumulyativ doza."""
        self._clock = clock
        self.window: deque[dict] = deque(maxlen=window_size)
        self.cumulative_dose_msv: float = 0.0
        self.last_received_at: float | None = None
        self.confirmed_level: str = "NORMAL"

    def reset(self) -> None:
        self.window.clear()
        self.cumulative_dose_msv = 0.0
        self.last_received_at = None
        self.confirmed_level = "NORMAL"

    def build_point(self, data: dict) -> dict:
        point = {
            "heart_rate": float(data.get("heart_rate", 75.0)),
            "blood_pressure_sys": float(data.get("blood_pressure_sys", 120.0)),
            "radiation_level": float(data.get("radiation_level", 0.1)),  # mSv/h
            "co2_level": float(data.get("co2_level", 0.04)),            # %
            "sleep_debt": float(data.get("sleep_debt", 0.0)),           # soat
        }
        point["dose_msv"] = point["radiation_level"] * T.SAMPLE_INTERVAL_H
        point["level"] = classify_point(point)
        return point

    def _append(self, point: dict) -> None:
        self.window.append(point)
        self.cumulative_dose_msv += point["dose_msv"]
        self.last_received_at = self._clock()
        recent = [p["level"] for p in list(self.window)[-T.CONFIRM_SAMPLES:]]
        self.confirmed_level = confirmed_status(self.confirmed_level, recent)

    def add_data_point(self, data: dict) -> None:
        self._append(self.build_point(data))

    def restore(self, samples: list[dict], dose_total: float) -> None:
        """Bazadan tiklash. Oxirgi ma'lumot vaqti tiklanmaydi, shuning uchun yangi namuna
        kelguncha holat STALE bo'ladi (eski holat NORMAL deb qabul qilinmaydi)."""
        self.reset()
        for s in samples:
            self.window.append(self.build_point(s))
        self.cumulative_dose_msv = dose_total
        recent = [p["level"] for p in list(self.window)[-T.CONFIRM_SAMPLES:]]
        self.confirmed_level = confirmed_status("NORMAL", recent)
        self.last_received_at = None

    def is_stale(self) -> bool:
        if self.last_received_at is None:
            return True
        return (self._clock() - self.last_received_at) > T.STALE_AFTER_S

    def get_statistics(self) -> dict:
        if not self.window:
            return {}

        df = pd.DataFrame(list(self.window))
        latest = self.window[-1]
        stale = self.is_stale()

        status = "STALE" if stale else self.confirmed_level
        rules = [] if stale else triggered_rules(latest)
        reasons = (
            ["Sensor ma'lumoti yangilanmagan."] if stale
            else [msg for _rid, _lvl, msg in rules]
        )

        hr = df["heart_rate"].to_numpy(dtype=float)
        hr_trend = None
        if len(hr) >= T.TREND_MIN_SAMPLES:
            # Namunalar taxminan 1 Hz deb olinadi: nishab (bpm/namuna) × 60 = bpm/daqiqa
            slope = float(np.polyfit(np.arange(len(hr)), hr, 1)[0])
            hr_trend = round(slope * 60, 2)

        return {
            "window_samples": len(df),
            "metrics": {
                "avg_heart_rate": round(float(np.mean(hr)), 2),
                "max_heart_rate": round(float(np.max(hr)), 2),
                "heart_rate_std": round(float(np.std(hr)), 2),
                "heart_rate_trend_bpm_per_min": hr_trend,
                "current_radiation": round(latest["radiation_level"], 3),
                "cumulative_radiation_dose": round(self.cumulative_dose_msv, 6),
                "current_co2": round(latest["co2_level"], 3),
                "sleep_debt_hours": round(latest["sleep_debt"], 2),
            },
            "system_status": status,
            "pending_status": None if stale else latest["level"],
            "warnings": reasons,
            "risk_budget": compute_risk_budget(latest, self.cumulative_dose_msv),
            "recommendation": recommendation(status, rules, reasons),
            "confidence_score": "RULE_BASED",
        }
