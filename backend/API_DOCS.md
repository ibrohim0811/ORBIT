# ORBIT Backend API (v1.1)

Asosiy manzil: `http://localhost:8000`. Ma'lumotlar **simulyatsiya** (prototip) hisoblanadi.

## Endpointlar

| Metod | Yo'l | Vazifasi |
|---|---|---|
| GET | `/` | Tirikligini tekshirish |
| POST | `/push` | Telemetriya qabul qilish (validatsiya, idempotentlik) |
| GET | `/status?crew_id=` | Holat, xavf byudjeti, check-in va Action Center |
| POST | `/crew/{crew_id}/checkin` | Ekipaj check-in (`OK` yoki `NEED_HELP`) |
| GET | `/events?crew_id=&limit=` | LOS, holat o'zgarishi va eskalatsiya hodisalari |
| GET | `/crews` | Ma'lum ekipajlar ro'yxati |
| GET | `/simulator/mode` | Joriy simulyator rejimi |
| POST | `/simulator/mode?mode=` | Rejim: `normal`, `warning`, `critical`, `storm` (= critical) |
| WS | `/ws/telemetry?crew_id=` | Har 1 soniyada holat (JSON) |

## /push tanasi (barcha maydonlar ixtiyoriy)

| Maydon | Standart / chegara | Izoh |
|---|---|---|
| crew_id | `CREW-1` | Ekipaj ID |
| mission_id | `MISSION-1` | Missiya ID (saqlanadi) |
| event_id | avtomatik UUID | Bir xil ID ikkinchi marta kelsa `duplicate`, hisoblanmaydi |
| heart_rate | 20–250 | bpm |
| blood_pressure_sys | 40–250 | mmHg |
| radiation_level | 0–10 | mSv/h |
| co2_level | 0–5 | % |
| sleep_debt | 0–24 | soat |

Chegaradan tashqari yoki manfiy qiymat `422` qaytaradi. Javob: `{"status": "accepted"|"duplicate", ...}`.

## Holatlar

- `NORMAL`, `WARNING`, `CRITICAL`: faqat so'nggi 3 namuna bir xil yangi darajada bo'lsa o'zgaradi.
- `STALE`: 10 soniyadan beri yangi ma'lumot kelmasa yoki ma'lumot umuman yo'q bo'lsa. Hech qachon `NORMAL` emas. Server qayta ishga tushganda ham yangi ma'lumot kelguncha `STALE` bo'ladi.

## Hodisalar (`/events`)

| Turi | Qachon yoziladi |
|---|---|
| STATUS_CHANGE | Holat o'zgarganda |
| LOS_START | Ma'lumot kelishi to'xtaganda (STALE) |
| LOS_END | Ma'lumot qayta kelganda |
| ESCALATION | CRITICAL holat `CHECKIN_TIMEOUT_S` (300 s) dan oshib check-in bo'lmasa, yoki ekipaj `NEED_HELP` yuborsa |

## /status javobi (qisqa)

```json
{
  "status": "active",
  "crew_id": "CREW-1",
  "checkin": {"last_checkin_at": "...", "last_status": "OK", "timeout_s": 300.0},
  "analytics_summary": {
    "system_status": "NORMAL",
    "metrics": {"heart_rate_std": 1.9, "heart_rate_trend_bpm_per_min": 0.5, "cumulative_radiation_dose": 0.0037},
    "risk_budget": {"overall_score": 12.3},
    "recommendation": {"rule_id": "RULE_NORMAL", "action": "...", "confidence": "RULE_BASED"}
  },
  "action_center": {"level": "NORMAL", "rule_id": "RULE_NORMAL", "confidence": "RULE_BASED"}
}
```

Tendentsiya 1 Hz namuna tezligi deb hisoblanadi (nishab × 60 = bpm/daqiqa). Tezlik boshqacha bo'lsa, `analytics.py` ni moslash kerak.

## Ma'lumotlar bazasi

SQLite (stdlib), fayl yo'li `DATABASE_PATH` muhit o'zgaruvchisida (standart `orbit.db`). Jadvallar: `samples`, `events`, `checkins`. Namunalar cheksiz o'sadi (tozalash/arxivlash hali yo'q).

## Ishga tushirish

```bash
cd backend/app
python main.py                                  # http://localhost:8000
DATABASE_PATH=/data/orbit.db python main.py     # bazani tanlash
CORS_ORIGINS=http://localhost:3000 python main.py
cd .. && pytest                                 # testlar (requirements-dev.txt)
```

## Eslatma

Chegaralar (`app/core/thresholds.py`) klinik tasdiqlanmagan. Real ishlatishdan oldin mutaxassis tekshiruvi shart.

## Panel API'lari (frontend chap paneli uchun)

Ikonkalar tartibi bo'yicha: Notes/Logs, Search, Dashboard, Crew Communication, Data Sync.

| Ikonka | Metod | Yo'l | Vazifasi |
|---|---|---|---|
| Notes/Logs | GET / POST | `/notes?crew_id=` | Ekipaj eslatmalari (`{author, text}`) |
| Search | GET | `/search?crew_id=&q=` | Hodisa, eslatma, check-in izohlari bo'yicha qidiruv |
| Search | GET | `/telemetry/history?crew_id=&since_seconds_ago=&hr_min=&hr_max=&rad_min=&limit=` | Telemetriya tarixi, filtrlar bilan |
| Dashboard | GET | `/dashboard?crew_id=` | Bitta so'rovda: holat, so'nggi ko'rsatkichlar, xavf byudjeti, hodisalar, sinxronizatsiya |
| Data Sync | POST | `/sync?crew_id=` | Yer stansiyasiga yuborish. LOS bo'lsa `deferred` (navbatda qoladi) |
| Data Sync | GET | `/sync/status?crew_id=` | Aloqa holati, navbatdagi namunalar, oxirgi sinxronizatsiya |
| Crew Communication | POST | `/chat?crew_id=` | `{message}` yuboriladi. Javobni Ollama beradi, o'chiq bo'lsa `rule_fallback` |
| Header (AI Engine) | GET | `/ai/status` | Ollama holati: `Active` yoki `Offline` |

Ollama sozlamalari: `OLLAMA_URL` (standart `http://localhost:11434`), `OLLAMA_MODEL` (standart `llama3`).
Ollama holati 10 soniya keshlanadi. AI tavsiya bermaydi, holatni qoida hisoblaydi: AI faqat tushuntiradi.
