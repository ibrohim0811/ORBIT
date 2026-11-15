# ORBIT Frontend: Hatolar ro'yxati

Bu papka frontend bo'yicha topilgan hatolarni o'z ichiga oladi. Frontend kodi bu yerda o'zgartirilmagan, faqat tekshirilgan.

## Fayllar

- `README.md`: bu fayl, qisqa xulosa va tekshiruv natijalari.
- `HATOLAR.md`: har bir xatoning batafsil tavsifi, fayl va qator raqami, tavsiya etilgan tuzatish.
- `eslint-natija.txt`: ESLint'ning to'liq natijasi (fayl va qator bo'yicha).

## Qanday tekshirildi

Loyiha nusxasida (`npm install` bilan) quyidagilar ishga tushirildi:

| Tekshiruv | Natija |
|---|---|
| `npm install` | Muvaffaqiyatli, lekin 2 ta ogohlantirish (eskirgan `eslint`, zaif `next@15.1.7`) |
| `npx tsc --noEmit` | Xatosiz o'tdi |
| `npx next build` | Muvaffaqiyatli yakunlandi (lint build ichida o'tkazib yuborilgan) |
| `npx eslint src` | 9 ta xato, 26 ta ogohlantirish |

Ya'ni kod tipi jihatidan to'g'ri va build bo'ladi, lekin lint xatolari va bir nechta xavfli joylar bor.

## Muhimlik bo'yicha qisqacha

**Yuqori (ishlash yoki xavfsizlikka ta'sir qiladi):**

1. `package.json` dagi `"22": "^0.0.0"` bog'liqligi noto'g'ri, olib tashlash kerak.
2. `next@15.1.7` da ma'lum xavfsizlik zaifligi bor (CVE-2025-66478), yangilash kerak.
3. Sozlamalar panelidagi "API URL" maydoni hech narsani saqlamaydi (faqat ko'rinish).
4. `eslint-config-next@16.4.5` `next@15.1.7` bilan mos emas. Shu sababli React qoidalari xatolari paydo bo'lgan.
5. `page.tsx` da `aiEngineStatus` backend javobini to'g'ridan-to'g'ri ishlatadi. Backend endi string qaytaradi, lekin bu kontrakt frontendda tekshirilmagan.

**O'rta:**

6. React hook xatolari (`set-state-in-effect`, `immutability`): sahifa va 4 ta komponentda.
7. `page.tsx` tashqi Unsplash rasmlariga bog'liq. Bu "offline-first" maqsadiga zid.
8. `<img>` o'rniga `next/image` ishlatilmagan (3 ta joy).
9. `any` tiplari (`VitalsChart.tsx`).
10. Missing dependency'lar `useEffect` da (`NotesPanel`, `SyncPanel`).

**Past:**

11. Ishlatilmayotgan importlar (~20 ta).
12. Ishlatilmayotgan fayl: `hooks/useMockData.ts`.
13. Ishlatilmayotgan `public/*.svg` fayllari (create-next-app'dan qolgan).
14. `page.tsx` juda katta (800+ qator), komponentlarga bo'lish kerak.

## Backend bilan bog'liq (backendda tuzatildi)

Quyidagi frontend nomuvofiqliklari backend tomonida tuzatildi, lekin frontend tomonidan ham tekshirilishi tavsiya etiladi:

- `/ai/status` endi oddiy string qaytaradi (masalan, `Ollama llama3 (Active)`). Oldin obyekt qaytardi va `aiEngineStatus.includes(...)` sahifani yiqitardi.
- `/chat` javobidagi `engine` maydoni string.
- `/dashboard` dagi `risk_budget` maydonlari frontend tipiga mos (`radiation`, `heart_rate`, `co2`, `sleep`).
- `/notes` javobida `crew_id` bor.

Batafsil: `HATOLAR.md` ning "Backend bilan bog'liq" bo'limi.
