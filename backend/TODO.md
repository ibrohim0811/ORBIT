====================================================================
🚀 ORBIT - NASA SPACE APPS CHALLENGE: TO-DO LIST & AI PROMPTS
====================================================================

📋 QILINISHI KERAK BO'LGAN ISHLAR RO'YXATI:

[ ] 1. Telemetriyaga yangi ko'rsatkichlarni qo'shish (Backend)
    - Qon shakar miqdori (blood_sugar, mg/dL)
    - Tana harorati (body_temperature, °C)
    - TelemetrySimulator, RiskEngine va SQLite bazasini yangilash.

[ ] 2. Interaktiv Anatomik Model (Frontend - Clickable Human Anatomy)
    - Astronavt tanasining qismlariga (Miya, Yurak, O'pka, Suyak) bosilganda
      real vaqtda metrikalar ko'rinadigan interaktiv panel qo'shish.

[ ] 3. Muhitni Tanlash (Frontend - Environment Switcher)
    - Header qismiga Spacecraft, Lunar Base (0.16g) va Mars Base (0.38g)
      rejimlarini o'tkazgich tugmasini qo'shish.

[ ] 4. Geymifikatsiya va Streak Tizimi (Full-Stack)
    - Kunlik vazifalar ro'yxati ("2.5 soat trenajyor", "Suv balansi", "Check-in").
    - Ketma-ketlik (Streak) hisoblagichi va salomatlik nishonlari (Badges).

[ ] 5. Sodda Tibbiy Qo'llanma (First-Aid / Explanation Modal)
    - Astronavt shifokor emasligini hisobga olib, har bir xavf (masalan, CO2
      ko'tarilishi yoki radiatsiya) bo'yicha sodda tushuntirish va yordam oynasi.

====================================================================
🤖 AI UCHUN TAYYOR PROMPTLAR TO'PLAMI
====================================================================

--- 1-PROMPT: Qon shakari va Tana haroratini qo'shish (Backend) ---
Bizning NASA Space Apps loyihamiz uchun FastAPI backend va Python simulyatoriga yana ikkita muhim tibbiy ko'rsatkichni qo'shishimiz kerak:
1. blood_sugar (mg/dL, normal: 70.0 - 110.0)
2. body_temperature (°C, normal: 36.5 - 37.2)

Iltimos, quyidagi fayllar uchun tayyor kodni yangilab yozib ber:
- backend/app/services/simulator.py (generate_point metodiga normal, warning, critical rejimlari uchun shu ikki ko'rsatkichning qiymatlarini qo'shish)
- backend/app/services/risk_engine.py (evaluate metodiga shu ikkalasi bo'yicha xavf foizini hisoblash mantiqini qo'shish)
- backend/app/services/storage.py (ma'lumotlar bazasi sxemasiga yangi ustunlarni qo'shish)

--------------------------------------------------------------------

--- 2-PROMPT: Interaktiv Anatomik Model (Frontend) ---
Bizning Next.js 15 (Tailwind CSS) frontend loyihamizga interaktiv "Clickable Human Anatomy" (Inson tanasining bosiluvchi anatomik modeli) komponentini qo'shishimiz kerak.
Talablar:
- Ekranda astronavtning silueti yoki organlari ko'rsatilib turadi.
- Foydalanuvchi tananing qismlariga (Miya, Yurak, O'pka, Suyak/Tana) bosganda, o'sha organ bo'yicha real vaqtda metrikalar (Miya uchun uyqu/stress, Yurak uchun puls/bosim, O'pka uchun CO2, Suyak uchun radiatsiya) popup yoki yon panelda chiqishi kerak.
- Dizayn dark-mode, kosmik uslubda (glassmorphism, OLED dark) bo'lsin.
Shu komponent uchun to'liq React/TypeScript kodini yozib ber.

--------------------------------------------------------------------

--- 3-PROMPT: Environment Switcher (Muhitni Tanlash) ---
Next.js frontend uchun "Environment Switcher" komponentini yozib ber.
U Header qismida joylashadi va quyidagi 3 ta rejimni tanlash imkonini beradi:
1. Spacecraft (Kosmik kema - 1.0g / standart)
2. Lunar Gateway / Base (Oy bazasi - 0.16g gravitatsiya)
3. Mars Base (Mars bazasi - 0.38g gravitatsiya)

Tanlangan muhit localStorage'da saqlansin va global state yoki context orqali boshqa sahifalarga (masalan, Risk Engine hisob-kitoblariga) gravitatsiya koeffitsiyentini ta'sir qildirsin. Tailwind CSS'da chiroyli dropdown yoki tabs ko'rinishida kodini yozib ber.

--------------------------------------------------------------------

--- 4-PROMPT: Geymifikatsiya va Streak tizimi ---
Next.js va FastAPI uchun astronavtlar sog'lig'ini qo'llab-quvvatlash maqsadida "Gamification & Streak System" (Geymifikatsiya va kundalik vazifalar) modulini qo'shmoqchimiz.
Quyidagilarni o'z ichiga olgan kod yozib ber:
- Kunlik vazifalar ro'yxati (Masalan: "2.5 soat trenajyor", "Suv balansi", "Psixologik check-in").
- Streak (Ketma-ket bajarilgan kunlar hisoblagichi, masalan 🔥 5 days streak).
- Salomatlik nishonlari (Badges: "Radiation Shield Master", "Hydration Hero", "Sleep Guardian").
Frontend uchun Tailwind CSS komponentini va backend uchun sodda API endpointlarini tuzib ber.

--------------------------------------------------------------------

--- 5-PROMPT: Sodda Tibbiy Qo'llanma (First-Aid Modal) ---
Next.js frontend uchun astronavtlarga mo'ljallangan "Space Medical Guide / First-Aid" (Sodda tibbiy qo'llanma) modal oynasini yaratib ber.
Unda 5 ta asosiy kosmik xavf (Radiatsiya, CO2 ko'tarilishi, Uyqu qarzi, Yurak yuklamasi, Qon shakarining o'zgarishi) bo'yicha:
- Nima uchun bu xavfli? (Sodda tilda tushuntirish)
- Zudlik bilan nima qilish kerak? (Qadam-baqadam ko'rsatma)
Tailwind CSS va Lucide icons yordamida zamonaviy kosmik dizaynda yozib ber.
====================================================================