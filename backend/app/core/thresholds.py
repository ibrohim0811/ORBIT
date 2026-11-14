"""Barcha qoida chegaralari bir joyda.

DIQQAT: bu qiymatlar DEMO/PROTOTIP uchun sun'iy (simulyatsiya). Real klinik
yoki kosmik ishlatishdan oldin mutaxassislar tomonidan tasdiqlanishi shart.
"""

# Yurak urishi (bpm)
HR_WARNING = 100.0
HR_CRITICAL = 120.0
# Radiatsiya (mSv/h)
RAD_WARNING = 1.0
RAD_CRITICAL = 2.0
# CO2 (%)
CO2_WARNING = 0.07
CO2_CRITICAL = 0.10
# Uyqu qarzi (soat)
SLEEP_DEBT_WARNING = 5.0

# Holat faqat shuncha ketma-ket namuna bir xil bo'lganda o'zgaradi (tebranishni oldini oladi)
CONFIRM_SAMPLES = 3
# Shu soniyadan keyin yangi ma'lumot kelmasa holat STALE (NORMAL emas)
STALE_AFTER_S = 10.0
# Sliding window o'lchami
WINDOW_SIZE = 100
# Ketma-ket namunalar orasidagi vaqt (soat); simulyator 1 s da yuboradi
SAMPLE_INTERVAL_H = 1.0 / 3600.0

# Xavf byudjeti normalizatsiyasi (0..100%)
HR_RISK_LOW = 60.0
HR_RISK_HIGH = 140.0
RAD_RISK_MAX = 3.0
CO2_RISK_MAX = 0.12
SLEEP_RISK_MAX = 8.0
BUDGET_WEIGHTS = {"radiation": 0.4, "heart_rate": 0.3, "co2": 0.2, "sleep": 0.1}

# Ekipaj va missiya (standart qiymatlar; har bir so'rovda o'zgartirish mumkin)
DEFAULT_CREW_ID = "CREW-1"
DEFAULT_MISSION_ID = "MISSION-1"
# CRITICAL holat boshlanib, shu soniyadan keyin ham check-in bo'lmasa ESCALATION yoziladi
CHECKIN_TIMEOUT_S = 300.0
# Monitor (holat o'tishlarini kuzatish) davri
MONITOR_INTERVAL_S = 1.0
# Tendentsiya (trend) hisoblash uchun minimal namuna
TREND_MIN_SAMPLES = 5
