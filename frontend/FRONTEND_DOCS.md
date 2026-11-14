# ORBIT Frontend: Mission Control

Next.js 15 (App Router), React 19, Tailwind CSS v4, Recharts, Framer Motion, Lucide React.

Bu hujjat frontendning **haqiqiy holatini** tasvirlaydi. Ayrim qismlar hali backendga ulanmagan. Ularni "Ma'lum muammolar" bo'limida ko'rsatdim.

## 1. Tezkor ishga tushirish

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start
npm run lint
```

Backend alohida ishga tushirilishi kerak (`backend/`, `http://localhost:8000`). Hozirgi holatda sahifa backendga so'rov yubormaydi, shuning uchun backend bo'lmasa ham ko'rinish ishlaydi.

## 2. Muhit o'zgaruvchilari

| O'zgaruvchi | Standart | Vazifasi |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | REST API manzili (`/status`, `/push`) |
| `NEXT_PUBLIC_WS_URL` | `API_URL` dan `ws://…/ws/telemetry` | WebSocket manzili |

`.env.local` faylida yozing, masalan:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/telemetry
```

Bu o'zgaruvchilar `NEXT_PUBLIC_` bilan boshlanadi, shuning uchun brauzerga ochiq bo'ladi. Maxfiy kalit bunga qo'yilmasin.

## 3. Papkalar tuzilishi

```
frontend/src/
├── app/
│   ├── layout.tsx        # Metadata (sarlavha, tavsif), global CSS
│   ├── page.tsx          # Asosiy sahifa (Mission Control dashboard)
│   └── globals.css       # Tailwind va global stillar
├── components/           # UI komponentlar
│   ├── DigitalTwin3D.tsx # 3D astronavt modeli (props: heartRate, isAnomaly)
│   ├── Header.tsx        # Sarlavha (props: connected, systemStatus)
│   ├── MetricCard.tsx    # Ko'rsatkich kartasi
│   ├── SystemGauge.tsx   # Doira shkala (value, max, label, unit, color)
│   ├── VitalsChart.tsx   # Grafik (data, title, dataKeys, type)
│   ├── AlertsFeed.tsx    # Ogohlantirishlar oqimi
│   ├── CrewPanel.tsx     # Ekipaj holati
│   └── MissionTimeline.tsx # Missiya bosqichlari
├── hooks/
│   ├── useWebSocket.ts   # Backend WebSocket ulanishi (avto-qayta ulanish, 3 s)
│   └── useMockData.ts    # Lokal demo ma'lumot generatori
└── lib/
    └── api.ts            # URL'lar, TypeScript tiplari, fetchStatus, pushTelemetry
```

## 4. Ma'lumot oqimi (hozirgi holat)

**Muhim:** `page.tsx` hozir `useWebSocket` yoki `fetchStatus` ni import qilmaydi. Asosiy sahifa o'zining ichki simulyatsiyasi bilan ishlaydi (`Math.random` va sinus). Shuning uchun backend ishlab turganda ham dashboard backend ma'lumotini ko'rsatmaydi.

Mavjud ulanish mexanizmi:

1. `useWebSocket()` `WS_URL` ga ulanadi.
2. Har xabarda `data.analytics` (agar `message` bo'lmasa) `analytics` state'ga yoziladi.
3. Oxirgi 60 nuqta `history` massivida saqlanadi.
4. Uzilsa, 3 soniyadan keyin qayta ulanadi.
5. `connectionStatus`: `connecting` | `connected` | `disconnected` | `error`.

Ulanish uchun tavsiya etilgan qadam: `page.tsx` da `useWebSocket()` ni chaqirib, `analytics` va `history` ni `Header`, `MetricCard`, `VitalsChart` ga uzatish.

## 5. Backend bilan shartnoma (API tiplari)

`src/lib/api.ts` dagi tiplar backend javobiga mos keladi:

- `AnalyticsData`: `window_samples`, `metrics` (`avg_heart_rate`, `max_heart_rate`, `current_radiation`, `cumulative_radiation_dose`, `current_co2`, `sleep_debt_hours`), `system_status`, `warnings`, `confidence_score`.
- `StatusResponse`: `status`, `mode`, `sync_status`, `analytics_summary`, `action_center`.
- `WebSocketMessage`: `status`, `mode`, `analytics`.
- `TelemetryInput`: barcha maydonlar ixtiyoriy (backend chegaralari: `API_DOCS.md` ga qarang).

**Eslatma:** backend endi qo'shimcha maydonlar qaytaradi, lekin frontend tiplari ularni hali bilmaydi:

- `analytics`: `risk_budget`, `recommendation`, `pending_status`.
- `action_center`: `rule_id`, `reason`. `estimated_dose_saved` olib tashlangan.
- `system_status` yangi qiymat: `STALE` (eskirgan yoki yo'q ma'lumot). Tipda hozir faqat `NORMAL | WARNING | CRITICAL`.

Tiplarni yangilash kerak. Aks holda `STALE` holatida `Header` va boshqa komponentlar noto'g'ri ko'rsatishi mumkin.

## 6. Komponentlar

| Komponent | Props | Eslatma |
|---|---|---|
| `Header` | `connected: boolean`, `systemStatus: NORMAL \| WARNING \| CRITICAL` | Ulanish va holat belgisi |
| `MetricCard` | `title`, `value`, `unit`, `icon`, `color` (`cyan\|green\|red\|orange\|purple`), `trend?`, `subtitle?`, `delay?` | Bitta ko'rsatkich |
| `SystemGauge` | `value`, `max`, `label`, `unit`, `color`, `size?` | Doira shkala |
| `VitalsChart` | `data: any[]`, `title`, `dataKeys: {key,color,label}[]`, `height?`, `type?` (`line\|area`) | Recharts grafigi |
| `DigitalTwin3D` | `heartRate`, `isAnomaly` | 3D model (Three.js) |
| `AlertsFeed` | yo'q (ichki ma'lumot) | Hozir statik ma'lumot |
| `CrewPanel` | yo'q (ichki ma'lumot) | Hozir statik ma'lumot |
| `MissionTimeline` | yo'q (ichki ma'lumot) | Hozir statik ma'lumot |

## 7. Foydalanuvchi interfeysi haqida

`page.tsx` ichida:

- **Ssenariy tanlash:** `normal`, `hypoxia` (gipoksiya), `tachycardia` (taxikardiya). Hozir bu faqat lokal simulyatsiyani o'zgartiradi, backend `/simulator/mode` ga yubormaydi.
- **Astronavtlar ro'yxati:** 3 ta statik profil, avatarlar Unsplash'dan tashqi havola bilan olinadi.
- **Docker modali:** dasturni ishga tushirish ko'rsatmasi.
- **Ogohlantirish va 3D model:** holat o'zgarganda animatsiya.

## 8. Ma'lum muammolar (tuzatilmagan)

1. **Backendga ulanmagan:** `page.tsx` `useWebSocket` ni ishlatmaydi. Dashboard faqat lokal demo ma'lumot ko'rsatadi.
2. **Komponentlar ishlatilmaydi:** `AlertsFeed`, `CrewPanel`, `MissionTimeline`, `MetricCard`, `SystemGauge`, `VitalsChart`, `Header` hozir `page.tsx` da import qilinmagan yoki faqat ichki kod sifatida mavjud. `DigitalTwin3D` yagona import qilingan komponent.
3. **`useMockData` va `useWebSocket` dublikati:** ikkalasi ham bir xil vazifani bajaradi.
4. **Tiplar eskirgan:** `STALE` holati va yangi maydonlar tipda yo'q (5-bo'limga qarang).
5. **`blood_pressure_sys` doim 120:** `useWebSocket` backend'dan qon bosimini olmaydi, `120` qattiq yozilgan.
6. **Qattiq yozilgan ma'lumotlar:** astronavt ismlari, Unsplash rasmlari (tashqi tarmoqqa bog'liq, "offline-first" da'vosiga zid).
7. **README bilan nomuvofiqlik:** README da "Nominal Orbit / EVA Fatigue / Solar Flare" ssenariylari yozilgan, kodda esa `normal / hypoxia / tachycardia`.
8. **`package.json` xatolari:**
   - `"22": "^0.0.0"` bog'liqligi keraksiz va xato.
   - `eslint-config-next` 16.4.5, `next` 15.1.7: versiyalar mos emas.
   - `react` / `react-dom` `19.3.0` deb yozilgan: bu versiya mavjudligini tekshirish kerak.
   - `framer-motion` ~ `lucide-react` versiyalari tekshirilmagan.
9. **Build sinalmagan:** bu hujjat `npm install` / `npm run build` ni tekshirmasdan yozilgan. Birinchi navbatda ularni ishga tushirib ko'ring.
10. **Testlar yo'q:** komponent yoki E2E testlar mavjud emas.

## 9. Tavsiya etilgan keyingi qadamlar

1. `package.json` ni tuzatib, `npm install` va `npm run build` xatosiz o'tishini ta'minlash.
2. `lib/api.ts` tiplarini backend shartnomasiga moslash (`STALE`, `risk_budget`, `recommendation`).
3. `page.tsx` ga `useWebSocket` ulash va lokal simulyatsiyani olib tashlash (yoki "demo" rejimi sifatida qoldirish).
4. Ishlatilmayotgan komponentlarni ulash yoki o'chirish.
5. Ssenariy tugmalarini `POST /simulator/mode` ga ulash.
6. Unsplash rasmlarini lokal `public/` ga ko'chirish.
7. README ni haqiqiy holatga moslash.

## 10. Litsenziya va eslatma

Dashboard prototip. Sog'liq ko'rsatkichlari va chegaralar demo uchun sun'iy qiymatlar hisoblanadi va klinik tasdiqlanmagan.
