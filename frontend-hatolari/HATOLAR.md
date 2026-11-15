# Frontend hatolari: batafsil

Yo'llar `frontend/` papkasiga nisbatan berilgan. Qator raqamlari loyihaning yuklangan (o'zgartirilmagan) versiyasiga tegishli.

---

## 1. Yuqori muhimlik

### 1.1 `package.json`: noto'g'ri bog'liqlik `"22"`
- **Joy:** `package.json`, 16-qator
- **Muammo:** `"22": "^0.0.0"` loyihaning haqiqiy bog'liqligi emas, xato yozuv. `npm install` uni o'rnatadi, hech qanday ish uchun kerak emas.
- **Tuzatish:** qatorni olib tashlash, keyin `npm install`.

### 1.2 `next@15.1.7`: ma'lum xavfsizlik zaifligi
- **Joy:** `package.json`, 21-qator
- **Muammo:** `npm install` ogohlantiradi: `next@15.1.7` CVE-2025-66478 zaifligiga ega.
- **Tuzatish:** Next.js 15 ning yamalangan versiyasiga yangilash (`npm install next@latest-15`), keyin build'ni qayta tekshirish.

### 1.3 `eslint-config-next` versiyasi `next` bilan mos emas
- **Joy:** `package.json`, 32-qator (`eslint-config-next: 16.4.5`), 21-qator (`next: 15.1.7`)
- **Muammo:** Lint 16-versiyaning React qoidalarini 15-versiyali loyihaga qo'llaydi. Shu sababli 1.4 dagi xatolar paydo bo'lgan.
- **Tuzatish:** ikkalasini bir xil major versiyaga keltirish (masalan, `eslint-config-next@15.x`).

### 1.4 Sozlamalar panelidagi "API URL" hech narsani saqlamaydi
- **Joy:** `src/components/panels/SettingsPanel.tsx`, 13-qator va 61-62-qatorlar
- **Muammo:** `apiUrl` faqat lokal state. Maydon o'zgartirilganda hech qanday saqlash yoki qayta ulanish yo'q. `BACKEND_URL` esa build vaqtida belgilanadi (`NEXT_PUBLIC_API_URL`), shuning uchun foydalanuvchi o'zgartirgan manzil ishlatilmaydi. Foydalanuvchi "saqlandi" deb o'ylaydi, lekin ta'sir qilmaydi.
- **Tuzatish:** yo'q bo'lsa, maydonni olib tashlash yoki saqlash (localStorage) va `BACKEND_URL` o'rniga shu qiymatni ishlatish.

### 1.5 `aiEngineStatus` backend javobini to'g'ridan-to'g'ri ko'rsatadi
- **Joy:** `src/app/page.tsx`, 115, 155-156, 696, 701-qatorlar. `src/lib/api.ts`, 303-307.
- **Muammo:** `aiEngineStatus.includes("Offline")` va JSX'da `{aiEngineStatus}`. Agar `/ai/status` obyekt qaytarsa, sahifa render paytida yiqiladi ("Objects are not valid as a React child", `includes` funksiya emas).
- **Holat:** backendda tuzatildi, endi `/ai/status` string qaytaradi. Frontendda `fetchAiStatus` hali `request<string>` deb yozilgan, bu to'g'ri. Qo'shimcha himoya tavsiya etiladi: `typeof res === "string" ? res : "Offline"`.

---

## 2. React hook xatolari (ESLint xatolari)

Bular ESLint'da **XATO** sifatida chiqadi (`react-hooks/set-state-in-effect`, `react-hooks/immutability`).

### 2.1 `useEffect` ichida `setState` to'g'ridan-to'g'ri chaqirilgan
| Fayl | Qator |
|---|---|
| `src/app/page.tsx` | 173, 351 |
| `src/components/panels/NotesPanel.tsx` | 43 |
| `src/components/panels/SyncPanel.tsx` | 43 |
| `src/hooks/useMockData.ts` | 65 |

- **Muammo:** effect ichida sinxron `setState` ortiqcha render'larga olib keladi.
- **Tuzatish:** ma'lumotni effect'dan tashqarida yuklash (masalan, `useEffect` ichida async funksiya va `setState` uni `then`dan keyin chaqirish) yoki `useSyncExternalStore` / `useQuery`-uslubidagi yechim.

### 2.2 `connect` / `connectWebSocket` o'zgaruvchisi e'lon qilinishidan oldin ishlatilgan
- **Joy:** `src/hooks/useWebSocket.ts`, 75-qator (`connect` 33-qatorda e'lon qilingan). `src/app/page.tsx`, 229-qator (`connectWebSocket` 179-qatorda).
- **Muammo:** qayta ulanish `setTimeout` ichida o'zini chaqiradi. Hozir ishlaydi, lekin bu "keyin e'lon qilingan" o'zgaruvchi va React Compiler buni xato deb belgilaydi.
- **Tuzatish:** qayta ulanish mantiqini `useRef` ichida saqlash yoki funksiyani `useCallback` oldida ref orqali chaqirish.

---

## 3. Boshqa ogohlantirishlar

### 3.1 `useEffect` bog'liqliklari yetishmaydi
- `src/components/panels/NotesPanel.tsx`, 44-qator: `loadNotes` yetishmaydi.
- `src/components/panels/SyncPanel.tsx`, 44-qator: `loadStatus` yetishmaydi.
- **Tuzatish:** funksiyani `useCallback` bilan o'rash va bog'liqlikka qo'shish.

### 3.2 `any` tiplari
- `src/components/VitalsChart.tsx`, 22 va 26-qatorlar. `data: any[]` va `(props: any)`.
- **Tuzatish:** aniq tip (masalan, `Record<string, number | string>[]`).

### 3.3 Next.js `<img>` ogohlantirishlari
- `src/app/page.tsx`, 626, 792, 838-qatorlar.
- **Tuzatish:** `next/image` ishlatish yoki rasmlarni `public/` ga ko'chirish.

### 3.4 Tashqi rasmlarga bog'liqlik (Unsplash)
- `src/app/page.tsx`, 80, 87, 94 (astronavt avatarlari) va 627-qator.
- **Muammo:** internet bo'lmasa rasmlar ko'rinmaydi. Loyiha "offline-edge" deb ataladi, bu maqsadga zid. Shuningdek, Unsplash litsenziya va uzoq muddatli barqarorlik savolini tug'diradi.
- **Tuzatish:** rasmlarni `public/` ga joylashtirish.

### 3.5 Ishlatilmayotgan importlar (~20 ta)
| Fayl | Qator | Nomi |
|---|---|---|
| `src/app/page.tsx` | 26, 29, 30, 33 | `Send`, `Zap`, `Shield`, `ArrowUpRight` |
| `src/components/AlertsFeed.tsx` | 4 | `CheckCircle` |
| `src/components/CrewPanel.tsx` | 4 | `Activity` |
| `src/components/MissionTimeline.tsx` | 4, 74 | `Flag`, `i` |
| `src/components/panels/ChatPanel.tsx` | 4 | `MessageSquare`, `Sparkles` |
| `src/components/panels/CheckInModal.tsx` | 4 | `AlertTriangle` |
| `src/components/panels/NotesPanel.tsx` | 4 | `Send` |
| `src/components/panels/SearchPanel.tsx` | 4 | `History`, `Clock`, `ArrowRight` |
| `src/components/panels/SettingsPanel.tsx` | 4 | `Sliders`, `AlertTriangle` |
| `src/components/panels/SyncPanel.tsx` | 4, 14 | `Radio`, `ArrowUpRight`, `loading` |
| `src/hooks/useWebSocket.ts` | 82 | `e` (catch) |

- **Tuzatish:** ishlatilmaganlarini olib tashlash (`eslint --fix` ba'zilarini o'zi tuzatadi).

### 3.6 Ishlatilmayotgan fayllar
- `src/hooks/useMockData.ts`: hech qayerda import qilinmagan.
- `src/hooks/useWebSocket.ts`: hech qayerda import qilinmagan. Sahifa o'z `connectWebSocket` funksiyasini ishlatadi, shuning uchun bu hook ikkilamchi va xato (2.2) ham shu faylda.
- `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`: create-next-app'dan qolgan, ishlatilmaydi.
- `src/components/` dagi bir nechta komponent (`AlertsFeed`, `CrewPanel`, `MissionTimeline`) sahifada ishlatilmaydi.

### 3.7 `page.tsx` juda katta
- 800+ qator, bitta faylda holat, API chaqiruvlar, UI va simulyatsiya mantiqi. Komponentlarga va hook'larga bo'lish kerak.

---

## 4. Eslatmalar

- Sahifa "Edge Fallback" rejimida backend o'chiq bo'lganda ichki simulyatsiya ishlatadi. Bu niyat qilingan, lekin foydalanuvchiga aniq ko'rsatilishi kerak (hozir "API: Offline-Edge" yozuvi bor).
- Backend'da autentifikatsiya yo'q: `/notes`, `/crew/{id}/checkin` va boshqa yozish endpoint'lari hamma uchun ochiq. Prototip uchun mumkin, lekin real ishlatishdan oldin himoya kerak.
- `docker-compose.yml` da parollar kodga yozilgan (`orbit_password`). Faqat lokal ishlatish uchun.
