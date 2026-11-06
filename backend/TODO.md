# ORBIT: hozirgi holat, roadmap va g'alaba TODO

Nov 1, 2026 · @Ibrohim

## Hozirgi holat

Loyiha hozir **backend skeleti + oddiy tahlilchi** bosqichida: 3 ta commit, taxminan 300 qator ishchi kod, frontend va baza yo'q. README esa kodning hali yozilmagan qismini ham tasvirlaydi (o'zi ham "Architecture and development plan" deb yozilgan). Kodni men ishga tushirib tekshirdim; Docker build'ini bu yerda sinay olmadim.

| Qism | Holat | Izoh |
| --- | --- | --- |
| FastAPI + CORS (`main.py`) | Ishlaydi | `/` javob beradi |
| `POST /push`, `GET /status` | Qisman | `/status` ikki marta yozilgan, ikkinchisi hech qachon ishlamaydi |
| WebSocket `/ws/telemetry` | Ishlaydi | Har 1 s yuboradi, lekin faqat qo'lda `/push` qilingan ma'lumotni |
| `TelemetryAnalyzer` | Qisman | Oyna (100 nuqta), o'rtacha, maksimum, 3 holat. Standart og'ish va trend yo'q |
| `TelemetrySimulator` | Ulanmagan | 3 rejim bor, lekin hech joyda chaqirilmaydi, rejimni o'zgartiruvchi endpoint yo'q |
| PostgreSQL, SQLAlchemy, Alembic | Yo'q | `docker-compose.yml`da baza turibdi; `config.py`, `database.py`, `models/telemetry.py` bo'sh (0 qator) |
| Frontend | Yo'q |  |
| Testlar | Yo'q |  |
| Risk engine, check-in, Ollama, hisobot, DONKI | Yo'q | Faqat README'da; `donki.py`dan faqat eski `.pyc` izi qolgan, manba yo'q |

## Bo'shliqlar

Demo hozir ochilganda bo'sh ekran beradi, g'oya esa hali kodda yo'q. Birinchisi bir kunlik tuzatish, ikkinchisi asosiy ish.

**Kodda tasdiqlangan xatolar** (ilovani ishga tushirib tekshirdim):

1. `/status` `telemetry.py`da ikki marta yozilgan. Birinchisi ishlaydi, shuning uchun Action Center, `sync_status` va tavsiyalar hech qachon qaytmaydi.
2. Simulyator hech joyda ulanmagan. WebSocket ochilganda "Ma'lumotlar kutilmoqda" chiqadi, ma'lumot faqat qo'lda `/push` qilinsa keladi.
3. Ba'zi qiymatlar qattiq yozilgan, hisoblanmaydi: `confidence_score` "98.4%", "74% doza tejaldi", "18 daqiqadan so'ng". Hakam kodni ochsa, ishonch yo'qoladi.
4. `cumulative_radiation_dose` faqat oxirgi 100 nuqta yig'indisi × 0.01. Oyna aylangach eski doza yo'qoladi, demak kumulyativ emas.
5. Status `hr_max` ga tayanadi. Bitta sakrash 100 nuqta davomida CRITICAL ushlab turadi.
6. Standart og'ish va tendentsiya tavsifda bor, kodda yo'q.
7. Gigiena: `api/__init.py` nomi xato, `.pyc` fayllar git'da, ildiz `.gitignore` o'chirilgan, Dockerfile `reload=True` bilan ishlaydi.

**Strategik bo'shliqlar** (NASA tadqiqoti va challenge nomiga nisbatan):

- Yagona **Xavf byudjeti** yo'q: doza, uyqu qarzi va yuklama bitta ballga birlashmagan.
- **"Hozir nima qilish kerak"** matni qattiq yozilgan, qoida ID'si va hisoblangan sababi yo'q.
- **Quyosh bo'roni stsenariysi** va "tejalgan doza" raqami hisoblanmaydi. DONKI uchun faqat o'chirilgan fayl izi bor.
- **Check-in va eskalatsiya**, **LOS tugmasi** va haqiqiy sinxronlash navbati yo'q.
- **Frontend** yo'q, hakamlar esa ekranni ko'radi.
- **Baza** ulangan emas, shuning uchun "offline'da ma'lumot saqlanadi" da'vosi hozircha isbotlanmagan.

## Roadmap

&#91;embedded content: roadmap · 4 bosqich, 3 darvoza, 1 ixtiyoriy\]

Muddat menga ma'lum emas, shuning uchun bosqichlar sana bilan emas, ketma-ketlik va o'tish mezoni (darvoza) bilan berilgan. Darvoza o'tilmaguncha keyingi bosqichga o'tmang; P2 dagi frontendni esa `/status` javob formati qotirilgach P1 bilan parallel boshlash mumkin.

## TODO

Tartib muhim: P0 demo'ni ishlatadi, P1 g'oyani kodga soladi, P2 uni ko'rsatadi. P3 faqat vaqt qolsa.

**P0. Tuzatish (avval shu)**

- [ ] `/status` dublikatini olib tashlab, Action Center'li bitta handler qoldirish
- [ ] Simulyatorni fon vazifa (asyncio) sifatida ishga tushirish: har 1 s `generate_point()` natijasi analyzer'ga tushsin
- [ ] `POST /simulator/mode` endpointi: normal, warning, storm
- [ ] `98.4%`, `74%`, `18 daqiqa` qiymatlarini hisoblangan qiymatga almashtirish yoki "demo qiymat" deb belgilash
- [ ] `api/__init.py` ni `__init__.py` ga o'zgartirish, `.pyc` fayllarni git'dan chiqarish, ildiz `.gitignore` va `.env.example` qo'shish
- [ ] `docker compose up --build` ni toza kompyuterda sinash va aniq buyruqni README'ga yozish

**P1. Qaror yordamchisi yadrosi (g'oya shu yerda)**

- [ ] `risk_engine.py`: qoidalar YAML'da, har birida ID, chegara va "simulyatsiya" yorlig'i
- [ ] Har holatga `recommendation = {action, reason, confidence, rule_id}`; action: kuzatish, harakat qilish yoki Yerga murojaat
- [ ] Kumulyativ radiatsiya dozasi (mSv) bazada yig'ilib borsin, 100 nuqtalik oynaga bog'lanmasin
- [ ] **Xavf byudjeti**: radiatsiya, uyqu, yuklama, salomatlik uchun 0–100% va umumiy ball; formula `docs/`da yozilgan bo'lsin
- [ ] Standart og'ish, harakatlanuvchi o'rtacha va o'sish tendentsiyasi qoidasi
- [ ] Statusni bitta `hr_max` emas, ketma-ket N nuqtaga tayantirish (alert tebranmasin)
- [ ] Yo'q yoki eskirgan ma'lumot "normal" hisoblanmasin, alohida `STALE` holati bo'lsin
- [ ] Async SQLAlchemy modellari va Alembic migratsiyasi: o'lchovlar, voqealar, alertlar, check-in'lar
- [ ] Avval bazaga yozish, keyin WebSocket; stabil event ID va idempotent yozuv

**P2. Demo hikoyasi va frontend**

- [ ] Quyosh bo'roni stsenariysi: DONKI formatidagi oflayn namuna JSON, ogohlantirish → boshpana → "chiqish xavfsiz" vaqti
- [ ] "Qolish va ko'chish" solishtirmasi va **tejalgan doza** raqami (formula ochiq, "simulyatsiya" yorlig'i bilan)
- [ ] Kabina zonalari (2–3 ta, himoya koeffitsienti bilan) va "siz uchun eng xavfsiz joy"
- [ ] Check-in: "Yaxshimisiz?" so'rovi, javob yoki javobsizlik yozuvi, eskalatsiya jadvali va timeout'lar
- [ ] LOS tugmasi: aloqani uzish va ulash, "Yer bilan sinxronlash kutilmoqda" indikatori, navbatni qayta yuborish
- [ ] Shifokor uchun qarorlar jurnali: voqea, qoida, javob, vaqt
- [ ] Frontend (Vite + React yoki oddiy statik sahifa, qaysi biri tezroq bo'lsa), Docker Compose ichida
- [ ] Xavf byudjeti ekrani: to'rt xavf, to'rt rang
- [ ] "Hozir nima qilish kerak" kartasi: bir qator sabab va ishonch
- [ ] Bo'ron rejimi ekrani: teskari sanoq, boshpana qadamlari, kabina xaritasi
- [ ] WebSocket uzilsa avtomatik qayta ulanish

**Testlar (P1 bilan birga)**

- [ ] `pytest`: qoidalar, kumulyativ doza, bo'ron stsenariysi, idempotentlik, Ollama'siz ishlash

**P3. Faqat vaqt qolsa**

- [ ] Ollama tushuntirishi: ixtiyoriy, o'chiq bo'lsa shablon matn; alert LLM'ni kutmasin
- [ ] Oddiy xronologik post-missiya hisoboti (HTML yoki PDF)
- [ ] Mission roadmap generatsiyasi: challenge'ga eng kam bog'liq va tekshirish qiyin, kesib tashlashni tavsiya qilaman

## Demo va topshirish

Hakam 2–3 daqiqada bitta hikoya ko'rishi kerak: "Anna, yotoqxonaga o't, chiqish xavfsiz bo'ladigan vaqt mana bu, standart protseduraga nisbatan shuncha doza tejaldi." Demo shu tartibda borsin:

1. `docker compose up --build` va normal holatdagi Xavf byudjeti ekrani.
2. Quyosh bo'roni ogohlantirishi: byudjet qizaradi, "hozir nima qilish kerak" kartasi chiqadi.
3. "Qolish va ko'chish" solishtirmasi va tejalgan doza raqami.
4. LOS tugmasi: aloqa uziladi, tizim ishlashda davom etadi, "sinxronlash kutilmoqda" ko'rinadi.
5. Check-in javobsiz qoladi va eskalatsiya ishga tushadi.
6. Ollama o'chiriladi (ulangan bo'lsa), kritik alert baribir ishlaydi.
7. Qarorlar jurnali: nima, qaysi qoida, kim javob berdi.

**Topshirishdan oldin**

- [ ] Rasmiy Space Apps sahifasida muddat, topshirish shakli va talab qilingan materiallarni (video uzunligi, havolalar) tekshirish
- [ ] Demo videoni yuqoridagi tartib bo'yicha yozib olish va ikki marta qayta ko'rish
- [ ] README'ni haqiqiy holatga moslash: bajarilgan va rejalashtirilgan alohida, bir buyruqli ishga tushirish eng tepada
- [ ] Barcha demo ma'lumot "synthetic" deb belgilansin, cheklovlar bo'limi yozilsin
- [ ] Qaysi RIDGE bandlari (radiatsiya, uzoqlik, yopiq muhit) qoplanishi README'da aytilsin
- [ ] Litsenziya tanlash; DONKI/NOAA manbalari va ularning shartlarini ko'rsatish
- [ ] Bir sahifalik taqdimot: muammo → bo'shliq → yechim → demo
- [ ] Toza kompyuterda va internetsiz oxirgi sinov, hakam qilgandek
- [ ] Repo ochiq ekanini va havolalar ishlashini tekshirish
