import random
from datetime import datetime

class TelemetrySimulator:
    def __init__(self):
        self.mode = "normal"  # normal, warning, critical

    def set_mode(self, mode: str):
        """Simulyatsiya rejimini o'zgartirish"""
        # "storm" so'rovini ham qo'shamiz, u avtomatik ravishda "critical" rejimga o'tadi
        if mode in ["normal", "warning", "critical", "storm"]:
            if mode == "storm":
                self.mode = "critical"
            else:
                self.mode = mode
            return True
        return False

    def generate_point(self) -> dict:
        """Joriy rejimga qarab telemetriya ma'lumotlarini ishlab chiqadi"""
        timestamp = datetime.utcnow().isoformat()

        if self.mode == "normal":
            return {
                "timestamp": timestamp,
                "heart_rate": round(random.uniform(65.0, 85.0), 1),
                "blood_pressure_sys": round(random.uniform(110.0, 125.0), 1),
                "radiation_level": round(random.uniform(0.05, 0.3), 3),
                "co2_level": round(random.uniform(0.03, 0.05), 3),
                "sleep_debt": round(random.uniform(0.0, 2.0), 1)
            }
        elif self.mode == "warning":
            return {
                "timestamp": timestamp,
                "heart_rate": round(random.uniform(95.0, 115.0), 1),
                "blood_pressure_sys": round(random.uniform(130.0, 145.0), 1),
                "radiation_level": round(random.uniform(1.0, 1.8), 3),
                "co2_level": round(random.uniform(0.06, 0.09), 3),
                "sleep_debt": round(random.uniform(4.0, 6.0), 1)
            }
        else:  # critical (Quyosh bo'roni holati)
            return {
                "timestamp": timestamp,
                "heart_rate": round(random.uniform(125.0, 150.0), 1),
                "blood_pressure_sys": round(random.uniform(150.0, 175.0), 1),
                "radiation_level": round(random.uniform(2.2, 4.5), 3),
                "co2_level": round(random.uniform(0.1, 0.15), 3),
                "sleep_debt": round(random.uniform(6.0, 10.0), 1)
            }

simulator = TelemetrySimulator()