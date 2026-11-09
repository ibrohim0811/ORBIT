# ORBIT — Frontend Mission Control Dashboard

Offline-first astronaut health monitoring dashboard designed for the NASA Space Apps Challenge 2026.
Built with Next.js 15, React 19, Tailwind CSS v4, Recharts, Framer Motion, and Lucide React.
Styled with an OLED dark mode, SpaceX / NASA mission control aesthetic, glassmorphism, and neon telemetry indicators.

---

## 🚀 Quick Start

### 1. Development Mode
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Production Build & Start
```bash
cd frontend
npm run build
npm run start
```

---

## ⚙️ Environment Variables
Optional configuration in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/telemetry
```

---

## 🛰️ Dashboard Features

1. **SpaceX / NASA Mission Control Room Design**:
   - Pure OLED Black (`#000000`) background with subtle cosmic starfield and HUD alignment grid.
   - Frosted glassmorphism panels with 20px backdrop blur and micro-borders.
   - High-contrast neon accents: Cyan (`#00f0ff`), Green (`#39ff14`), Red (`#ff073a`), Orange (`#ff6600`), and Purple (`#bf00ff`).
   - HUD corner brackets and animated status beacons.

2. **Real-time Live Telemetry Graphs (Recharts)**:
   - Astronaut Cardiac & Hemodynamic Response (Heart Rate & Systolic BP).
   - Environmental Ionizing Radiation Exposure & Cabin CO₂ Concentration.
   - Toggle views between Cardio, Environmental, and Full HUD.

3. **Decision-Support Action Center (Explainable AI / Edge Rules)**:
   - Deterministic risk assessment (`NORMAL`, `WARNING`, `CRITICAL`).
   - Dynamic actionable guidance with confidence scores and radiation dose savings.
   - Non-suppressive Crew Check-In protocol prompt: *"Are you okay?"*

4. **Interactive Scenario Injector (Judges Demonstration)**:
   - **Nominal Orbit**: Normal resting baselines.
   - **EVA Fatigue**: Elevated heart rate and fatigue indicators.
   - **Solar Flare**: Critical radiation surge anomaly triggering automated storm shelter protocols.

5. **Offline-First & Loss-of-Signal (LOS) Resilience**:
   - Automatically connects to FastAPI WebSocket (`/ws/telemetry`).
   - Gracefully falls back to local edge telemetry simulation when disconnected from the backend.
