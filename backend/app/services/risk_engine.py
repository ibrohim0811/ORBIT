"""Deterministik qoidalar va xavf byudjeti. Holat hisoblashda AI ishtirok etmaydi."""
from core import thresholds as T

LEVEL_NAMES = ("NORMAL", "WARNING", "CRITICAL")
LEVEL_VALUE = {name: i for i, name in enumerate(LEVEL_NAMES)}

# (rule_id, daraja, shart, xabar). Kritik qoidalar birinchi turadi.
RULES = [
    ("RULE_HR_CRITICAL", "CRITICAL", lambda p: p["heart_rate"] > T.HR_CRITICAL,
     "Yurak urishi kritik darajada yuqori"),
    ("RULE_RAD_CRITICAL", "CRITICAL", lambda p: p["radiation_level"] > T.RAD_CRITICAL,
     "Radiatsiya xavfli darajada"),
    ("RULE_CO2_CRITICAL", "CRITICAL", lambda p: p["co2_level"] > T.CO2_CRITICAL,
     "Kabina havosida CO2 kritik darajada"),
    ("RULE_HR_WARNING", "WARNING", lambda p: p["heart_rate"] > T.HR_WARNING,
     "Yurak urishi tezlashgan"),
    ("RULE_RAD_WARNING", "WARNING", lambda p: p["radiation_level"] > T.RAD_WARNING,
     "Radiatsiya fonida o'sish"),
    ("RULE_CO2_WARNING", "WARNING", lambda p: p["co2_level"] > T.CO2_WARNING,
     "Kabina havosida CO2 ko'tarilgan"),
    ("RULE_SLEEP_WARNING", "WARNING", lambda p: p["sleep_debt"] > T.SLEEP_DEBT_WARNING,
     "Uyqu qarzi yig'ilgan"),
]


def classify_point(point: dict) -> str:
    """Bitta namuna darajasi (tasdiqlanmagan)."""
    worst = "NORMAL"
    for _rid, level, cond, _msg in RULES:
        if cond(point) and LEVEL_VALUE[level] > LEVEL_VALUE[worst]:
            worst = level
    return worst


def triggered_rules(point: dict) -> list[tuple[str, str, str]]:
    """Shu namuna uchun ishlagan qoidalar: (rule_id, daraja, xabar)."""
    return [(rid, level, msg) for rid, level, cond, msg in RULES if cond(point)]


def confirmed_status(current: str, recent_levels: list[str]) -> str:
    """Holat faqat so'nggi CONFIRM_SAMPLES namuna HAMMASI bir xil yangi darajada bo'lsa o'zgaradi.
    Aks holda avvalgi tasdiqlangan holat saqlanadi (tebranish va bitta sakrash ta'sir qilmaydi)."""
    if len(recent_levels) < T.CONFIRM_SAMPLES:
        return current
    last = recent_levels[-T.CONFIRM_SAMPLES:]
    if len(set(last)) == 1 and last[0] != current:
        return last[0]
    return current


def compute_risk_budget(point: dict, cumulative_dose_msv: float) -> dict:
    """Har komponent 0..100%. Umumiy ball — og'irlikli o'rtacha (T.BUDGET_WEIGHTS)."""
    hr = point["heart_rate"]
    radiation_risk = min(100.0, point["radiation_level"] / T.RAD_RISK_MAX * 100)
    hr_risk = min(100.0, max(0.0, (hr - T.HR_RISK_LOW) / (T.HR_RISK_HIGH - T.HR_RISK_LOW) * 100))
    co2_risk = min(100.0, point["co2_level"] / T.CO2_RISK_MAX * 100)
    sleep_risk = min(100.0, point["sleep_debt"] / T.SLEEP_RISK_MAX * 100)
    w = T.BUDGET_WEIGHTS
    overall = (
        radiation_risk * w["radiation"]
        + hr_risk * w["heart_rate"]
        + co2_risk * w["co2"]
        + sleep_risk * w["sleep"]
    )
    return {
        "overall_score": round(overall, 1),
        "radiation_risk_pct": round(radiation_risk, 1),
        "heart_rate_risk_pct": round(hr_risk, 1),
        "co2_risk_pct": round(co2_risk, 1),
        "sleep_risk_pct": round(sleep_risk, 1),
        "cumulative_radiation_msv": round(cumulative_dose_msv, 6),
        "formula": "overall = 0.4*radiation + 0.3*heart_rate + 0.2*co2 + 0.1*sleep (each 0..100)",
    }


ACTIONS = {
    "CRITICAL": "Darhol himoyalangan yotoqxonaga o'ting va radiatsiya qalqonini tekshiring.",
    "WARNING": "Aerobik yuklamani kamaytiring, dam oling va havo almashtirishni tekshiring.",
    "NORMAL": "Kuzatishni davom ettiring.",
    "STALE": "Sensor ma'lumoti yangilanmagan. Bu holat NORMAL emas: ma'lumot oqimini tekshiring.",
}


def recommendation(status: str, rules: list[tuple[str, str, str]], reasons: list[str]) -> dict:
    """Tavsiya: qaysi qoida ishlagani va sababi bilan."""
    primary = next((rid for rid, level, _ in rules if level == status), None)
    if status == "STALE":
        rule_id = "RULE_STALE"
    elif status == "NORMAL":
        rule_id = "RULE_NORMAL"
    else:
        rule_id = primary or f"RULE_{status}_CONFIRMED"
    return {
        "rule_id": rule_id,
        "action": ACTIONS[status],
        "reason": "; ".join(reasons) if reasons else "Barcha ko'rsatkichlar me'yorda.",
        "confidence": "RULE_BASED",
    }
