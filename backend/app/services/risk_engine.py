class RiskEngine:
    def __init__(self):
        # Kumulyativ radiatsiya dozasi (mSv) - vaqt o'tishi bilan yigilib boradi
        self.cumulative_radiation = 0.0

    def evaluate(self, metrics: dict) -> dict:
        hr = metrics.get("heart_rate", 75.0)
        radiation = metrics.get("radiation_level", 0.1)
        co2 = metrics.get("co2_level", 0.04)
        sleep_debt = metrics.get("sleep_debt", 1.0)

        # Kumulyativ radiatsiyani oshirib boramiz (har bir siklda qo'shiladi)
        self.cumulative_radiation += radiation * 0.01

        # Xavf byudjeti komponentlari (0% - xavfsiz, 100% - o'ta xavfli)
        # 1. Radiatsiya xavfi (masalan, 3.0 mSv dan yuqori bo'lsa critical)
        radiation_risk = min(100.0, (radiation / 3.0) * 100)
        
        # 2. Yurak urishi xavfi (140 bpm dan yuqori bo'lsa 100%)
        hr_risk = min(100.0, max(0.0, (hr - 60.0) / 80.0 * 100))
        
        # 3. CO2 xavfi (0.1% dan yuqori bo'lsa xavfli)
        co2_risk = min(100.0, (co2 / 0.12) * 100)
        
        # 4. Uyqu qarzi xavfi (8 soatdan ko'p bo'lsa xavfli)
        sleep_risk = min(100.0, (sleep_debt / 8.0) * 100)

        # Umumiy o'rtacha xavf byudjeti balli
        overall_risk_score = round(
            (radiation_risk * 0.4) + (hr_risk * 0.3) + (co2_risk * 0.2) + (sleep_risk * 0.1), 1
        )

        # Qoidalar va tavsiyalar logikasi (Rule Engine)
        rule_id = "RULE_NORMAL"
        status = "NORMAL"
        action = "Kuzatishni davom ettirish"
        reason = "Barcha ko'rsatkichlar nominal chegarada."
        confidence = "98.5%"

        if radiation_risk > 70.0 or hr > 130.0:
            rule_id = "RULE_SOLAR_STORM_CRITICAL"
            status = "CRITICAL"
            action = "Zudlik bilan kabinaning radiatsiyadan himoyalangan sektoriga o'ting!"
            reason = f"Kritik radiatsiya ({radiation} mSv/s) yoki yurak urishi ({hr} bpm) aniqlandi."
            confidence = "99.1%"
        elif radiation_risk > 30.0 or hr > 100.0 or co2 > 0.07:
            rule_id = "RULE_WARNING_ELEVATED"
            status = "WARNING"
            action = "Dam oling va havo almashtirish tizimini tekshiring."
            reason = "Ko'rsatkichlarda me'yordan og'ish boshlandi."
            confidence = "95.0%"

        return {
            "status": status,
            "risk_budget": {
                "overall_score": overall_risk_score,
                "radiation_risk_pct": round(radiation_risk, 1),
                "heart_rate_risk_pct": round(hr_risk, 1),
                "co2_risk_pct": round(co2_risk, 1),
                "sleep_risk_pct": round(sleep_risk, 1),
                "cumulative_radiation_msv": round(self.cumulative_radiation, 3)
            },
            "recommendation": {
                "rule_id": rule_id,
                "action": action,
                "reason": reason,
                "confidence": confidence
            }
        }

risk_engine = RiskEngine()