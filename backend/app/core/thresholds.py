"""Barcha qoida chegaralari bir joyda.

DIQQAT: bu qiymatlar DEMO/PROTOTIP uchun sun'iy (simulyatsiya), klinik emas.
Real klinik yoki kosmik parvozda ishlatishdan oldin NASA Flight Surgeon mutaxassislari tomonidan tasdiqlanishi shart.
"""

# Yurak urishi (bpm)
HR_WARNING = 100.0       # Manba: NASA Human Research Program (HRP) / AHA resting tachycardia (>100 bpm)
HR_CRITICAL = 120.0      # Manba: NASA HRP Space Medicine standard - sustained sub-maximal exertion limit
HR_WARNING_LOW = 50.0   # Manba: AHA / NASA Flight Surgeon - bradikardiya chegarasi
HR_CRITICAL_LOW = 40.0  # Manba: Klinik kardiologiya / NASA HRP - o'tkir bradikardiya

# Radiatsiya (mSv/h)
RAD_WARNING = 1.0        # Manba: NASA Space Radiation Program Element (SRPE) ALARA 30-day exposure guideline
RAD_CRITICAL = 2.0       # Manba: NASA STD-3001 Vol 1 / SPE (Solar Particle Event) acute radiation limit

# CO2 (%)
CO2_WARNING = 0.07       # Manba: NASA ISS Environmental Control and Life Support System (ECLSS) Flight Rule
CO2_CRITICAL = 0.10      # Manba: NASA STD-3001 Vol 2 / ISS Hypercapnia emergency threshold (>0.10%)

# Uyqu (soat)
SLEEP_HOURS_WARNING = 6.0  # Manba: NASA HRP Behavioral Health & Performance (BHP) - acute sleep deprivation (<6 h)
SLEEP_DEBT_WARNING = 5.0   # Manba: NASA BHP cumulative fatigue index (>5 h debt)

# Qon glyukozasi (blood_glucose_mgdl, mg/dL)
GLUCOSE_WARNING_LOW = 70.0    # Manba: ADA (American Diabetes Association) Standards of Care - gipoglikemiya
GLUCOSE_WARNING_HIGH = 140.0  # Manba: ADA post-prandial normativ chegarasi (>140 mg/dL)
GLUCOSE_CRITICAL_LOW = 54.0   # Manba: ADA Level 2 Severe Hypoglycemia / NASA Flight Medicine protocol
GLUCOSE_CRITICAL_HIGH = 250.0 # Manba: ADA Diabetic Ketoacidosis / Hyperglycemia crisis threshold (>250 mg/dL)
GLUCOSE_NORMAL_TARGET = 95.0  # Manba: Klinik norma (70..110 mg/dL)

# Tana harorati (body_temp_c, °C)
TEMP_WARNING_LOW = 35.5   # Manba: NASA Space Medicine / Wilderness Medical Society (Gipotermiya 1-daraja)
TEMP_WARNING_HIGH = 37.8  # Manba: NASA Spaceflight Clinical Protocols (Subfebril tana harorati >=37.8 °C)
TEMP_CRITICAL_LOW = 35.0  # Manba: NASA STD-3001 (O'tkir gipotermiya chegarasi <35.0 °C)
TEMP_CRITICAL_HIGH = 39.0 # Manba: NASA STD-3001 Vol 1 / Yuqori isitma va issiqlik urishi (>=39.0 °C)
TEMP_NORMAL_TARGET = 36.8 # Manba: Klinik me'yor (36.5..37.2 °C)

# Orqaga moslik (Aliases)
SUGAR_WARNING_LOW = GLUCOSE_WARNING_LOW
SUGAR_WARNING_HIGH = GLUCOSE_WARNING_HIGH
SUGAR_CRITICAL_LOW = GLUCOSE_CRITICAL_LOW
SUGAR_CRITICAL_HIGH = GLUCOSE_CRITICAL_HIGH
SUGAR_NORMAL_TARGET = GLUCOSE_NORMAL_TARGET

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
# Og'irliklar yig'indisi: 0.25 + 0.20 + 0.20 + 0.15 + 0.10 + 0.10 = 1.0
BUDGET_WEIGHTS = {
    "radiation": 0.25,
    "heart_rate": 0.20,
    "co2": 0.20,
    "sleep": 0.15,
    "glucose": 0.10,
    "temperature": 0.10,
}

# Ekipaj va missiya (standart qiymatlar)
DEFAULT_CREW_ID = "CREW-1"
DEFAULT_MISSION_ID = "MISSION-1"
# CRITICAL holat boshlanib, shu soniyadan keyin ham check-in bo'lmasa ESCALATION yoziladi
CHECKIN_TIMEOUT_S = 300.0
# Monitor (holat o'tishlarini kuzatish) davri
MONITOR_INTERVAL_S = 1.0
# Tendentsiya (trend) hisoblash uchun minimal namuna
TREND_MIN_SAMPLES = 5
