from app.services.risk_engine import risk_engine

class TelemetryAnalyzer:
    def __init__(self):
        self.data_points = []
        self.max_window = 100

    def add_data_point(self, point: dict):
        self.data_points.append(point)
        if len(self.data_points) > self.max_window:
            self.data_points.pop(0)

    def get_current_status(self) -> dict:
        if not self.data_points:
            return {
                "status": "STALE",
                "message": "Ma'lumotlar kutilmoqda...",
                "risk_budget": {},
                "recommendation": {
                    "rule_id": "RULE_STALE",
                    "action": "Kuting...",
                    "reason": "Sensorlardan hali ma'lumot kelmadi.",
                    "confidence": "0%"
                }
            }

        # Eng oxirgi kelgan nuqtani olamiz
        latest_point = self.data_points[-1]
        
        # Risk Engine orqali hisob-kitob qilamiz
        evaluation = risk_engine.evaluate(latest_point)

        return {
            "window_samples": len(self.data_points),
            "latest_metrics": latest_point,
            "status": evaluation["status"],
            "risk_budget": evaluation["risk_budget"],
            "recommendation": evaluation["recommendation"]
        }

analyzer = TelemetryAnalyzer()