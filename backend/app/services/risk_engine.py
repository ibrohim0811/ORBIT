"""Deterministik qoidalar va xavf byudjeti. Holat hisoblashda AI ishtirok etmaydi."""
from core import thresholds as T

LEVEL_NAMES = ("NORMAL", "WARNING", "CRITICAL")
LEVEL_VALUE = {name: i for i, name in enumerate(LEVEL_NAMES)}


def _val(point: dict, *keys, default=None):
    for k in keys:
        if k in point and point[k] is not None:
            return point[k]
    return default


# (rule_id, daraja, shart, xabar). Kritik qoidalar birinchi turadi.
RULES = [
    (
        "RULE_HR_CRITICAL",
        "CRITICAL",
        lambda p: _val(p, "heart_rate", default=75.0) > T.HR_CRITICAL or _val(p, "heart_rate", default=75.0) < T.HR_CRITICAL_LOW,
        "Yurak urishi kritik darajada (taxikardiya yoki o'tkir bradikardiya)",
    ),
    (
        "RULE_RAD_CRITICAL",
        "CRITICAL",
        lambda p: _val(p, "radiation_level", default=0.1) > T.RAD_CRITICAL,
        "Radiatsiya xavfli darajada (quyosh chaqnashi / yuqori doza)",
    ),
    (
        "RULE_CO2_CRITICAL",
        "CRITICAL",
        lambda p: _val(p, "co2_level", default=0.04) > T.CO2_CRITICAL,
        "Kabina havosida CO2 kritik darajada (giperkapniya xavfi)",
    ),
    (
        "RULE_GLUCOSE_CRITICAL",
        "CRITICAL",
        lambda p: _val(p, "blood_glucose_mgdl", "blood_sugar", default=95.0) < T.GLUCOSE_CRITICAL_LOW
        or _val(p, "blood_glucose_mgdl", "blood_sugar", default=95.0) > T.GLUCOSE_CRITICAL_HIGH,
        "Qon glyukozasi kritik darajada (<54 yoki >250 mg/dL)",
    ),
    (
        "RULE_TEMP_CRITICAL",
        "CRITICAL",
        lambda p: _val(p, "body_temp_c", "body_temperature", default=36.8) >= T.TEMP_CRITICAL_HIGH
        or _val(p, "body_temp_c", "body_temperature", default=36.8) < T.TEMP_CRITICAL_LOW,
        "Tana harorati kritik darajada (isitma >=39°C yoki gipotermiya <35°C)",
    ),
    (
        "RULE_HR_WARNING",
        "WARNING",
        lambda p: _val(p, "heart_rate", default=75.0) > T.HR_WARNING or _val(p, "heart_rate", default=75.0) < T.HR_WARNING_LOW,
        "Yurak urishi tezlashgan yoki sekinlashgan",
    ),
    (
        "RULE_RAD_WARNING",
        "WARNING",
        lambda p: _val(p, "radiation_level", default=0.1) > T.RAD_WARNING,
        "Radiatsiya fonida o'sish qayd etildi",
    ),
    (
        "RULE_CO2_WARNING",
        "WARNING",
        lambda p: _val(p, "co2_level", default=0.04) > T.CO2_WARNING,
        "Kabina havosida CO2 ko'tarilgan",
    ),
    (
        "RULE_SLEEP_WARNING",
        "WARNING",
        lambda p: _val(p, "sleep_hours_last_night", default=8.0) < T.SLEEP_HOURS_WARNING
        or _val(p, "sleep_debt", default=0.0) > T.SLEEP_DEBT_WARNING,
        "Uyqu me'yoridan kam (<6 soat) yoki uyqu qarzi yig'ilgan",
    ),
    (
        "RULE_GLUCOSE_WARNING",
        "WARNING",
        lambda p: _val(p, "blood_glucose_mgdl", "blood_sugar", default=95.0) < T.GLUCOSE_WARNING_LOW
        or _val(p, "blood_glucose_mgdl", "blood_sugar", default=95.0) > T.GLUCOSE_WARNING_HIGH,
        "Qon glyukozasida og'ish (<70 yoki >140 mg/dL)",
    ),
    (
        "RULE_TEMP_WARNING",
        "WARNING",
        lambda p: _val(p, "body_temp_c", "body_temperature", default=36.8) >= T.TEMP_WARNING_HIGH
        or _val(p, "body_temp_c", "body_temperature", default=36.8) < T.TEMP_WARNING_LOW,
        "Tana haroratida og'ish (>=37.8°C yoki <35.5°C)",
    ),
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
    hr = float(_val(point, "heart_rate", default=75.0))
    rad = float(_val(point, "radiation_level", default=0.1))
    co2 = float(_val(point, "co2_level", default=0.04))
    sleep_debt = float(_val(point, "sleep_debt", default=0.0))
    sleep_hours = float(_val(point, "sleep_hours_last_night", default=8.0))
    glucose = float(_val(point, "blood_glucose_mgdl", "blood_sugar", default=95.0))
    temp = float(_val(point, "body_temp_c", "body_temperature", default=36.8))

    radiation_risk = min(100.0, max(0.0, rad / T.RAD_RISK_MAX * 100))
    hr_risk = min(100.0, max(0.0, (hr - T.HR_RISK_LOW) / (T.HR_RISK_HIGH - T.HR_RISK_LOW) * 100))
    co2_risk = min(100.0, max(0.0, co2 / T.CO2_RISK_MAX * 100))

    sleep_hours_shortage = max(0.0, (8.0 - sleep_hours) / 6.0 * 100)
    sleep_debt_risk = min(100.0, max(0.0, sleep_debt / T.SLEEP_RISK_MAX * 100))
    sleep_risk = min(100.0, max(sleep_hours_shortage, sleep_debt_risk))

    glucose_risk = min(100.0, max(0.0, abs(glucose - T.GLUCOSE_NORMAL_TARGET) / 105.0 * 100))
    temp_risk = min(100.0, max(0.0, abs(temp - T.TEMP_NORMAL_TARGET) / 2.2 * 100))

    w = T.BUDGET_WEIGHTS
    overall = (
        radiation_risk * w.get("radiation", 0.25)
        + hr_risk * w.get("heart_rate", 0.20)
        + co2_risk * w.get("co2", 0.20)
        + sleep_risk * w.get("sleep", 0.15)
        + glucose_risk * w.get("glucose", 0.10)
        + temp_risk * w.get("temperature", 0.10)
    )

    return {
        "overall_score": round(overall, 1),
        "radiation_risk_pct": round(radiation_risk, 1),
        "heart_rate_risk_pct": round(hr_risk, 1),
        "co2_risk_pct": round(co2_risk, 1),
        "sleep_risk_pct": round(sleep_risk, 1),
        "glucose_risk_pct": round(glucose_risk, 1),
        "temperature_risk_pct": round(temp_risk, 1),
        # Backwards compatibility and schema aliases
        "blood_glucose_risk_pct": round(glucose_risk, 1),
        "body_temp_risk_pct": round(temp_risk, 1),
        "blood_sugar_risk_pct": round(glucose_risk, 1),
        "body_temperature_risk_pct": round(temp_risk, 1),
        "cumulative_radiation_msv": round(cumulative_dose_msv, 6),
        "formula": "overall = 0.25*radiation + 0.20*heart_rate + 0.20*co2 + 0.15*sleep + 0.10*glucose + 0.10*temperature (each 0..100)",
    }


ACTIONS = {
    "CRITICAL": "Darhol himoyalangan yotoqxonaga o'ting va favqulodda tibbiy yordam protokolini oching.",
    "WARNING": "Fiziologik yuklamani kamaytiring, dam oling va ko'rsatkichlarni monitoring qiling.",
    "NORMAL": "Kuzatishni davom ettiring.",
    "STALE": "Sensor ma'lumoti yangilanmagan. Bu holat NORMAL emas: ma'lumot oqimini tekshiring.",
    "RULE_HR_CRITICAL": "Barcha jismoniy harakatni to'xtating, qon bosimi va EKG monitoringini ishga tushiring.",
    "RULE_RAD_CRITICAL": "Darhol suv devorlari bilan himoyalangan 'Storm Shelter' moduliga o'ting va dozimetrni tekshiring.",
    "RULE_CO2_CRITICAL": "Kislorod niqobini taqing, CDRA tozalash tizimini maksimal quvvatga yoqing.",
    "RULE_GLUCOSE_CRITICAL": "Gipoglikemiyada zudlik bilan glyukoza tabletkasi qabul qiling, giperglikemiyada suv iching va yer bilan bog'laning.",
    "RULE_TEMP_CRITICAL": "Termoregulatsiya kombinezonini sozlang, isitmaga qarshi yoki isitish choralari ko'ring.",
    "RULE_HR_WARNING": "Aerobik yuklamani kamaytiring, nafas mashqini bajaring va suv iching.",
    "RULE_RAD_WARNING": "EVA faoliyatini rejalashtirishni cheklang, dozimetr ko'rsatkichini kuzatib boring.",
    "RULE_CO2_WARNING": "Ventilyatorlar havo oqimini tekshiring va kabina ventilyatsiyasini kuchaytiring.",
    "RULE_SLEEP_WARNING": "20-30 daqiqalik qisqa uyqu (Power Nap) oling va tungi sirkad yorug'lik rejimini yoqing.",
    "RULE_GLUCOSE_WARNING": "Uglevod va energiya balansini tiklang, 15 daqiqadan so'ng qayta o'lchang.",
    "RULE_TEMP_WARNING": "Suyuqlik iching, haroratni qayta o'lchang va termal qulaylikni ta'minlang.",
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

    action = ACTIONS.get(rule_id, ACTIONS.get(status, "Kuzatishni davom ettiring va sensor holatini tekshiring."))

    return {
        "rule_id": rule_id,
        "action": action,
        "reason": "; ".join(reasons) if reasons else "Barcha ko'rsatkichlar me'yorda.",
        "confidence": "RULE_BASED",
    }
