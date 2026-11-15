"use client";

import { useState } from "react";
import {
  Brain,
  Heart,
  Wind,
  Shield,
  Activity,
  AlertCircle,
  Thermometer,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export type AnatomicalRegion = "brain" | "heart" | "lungs" | "skeleton" | "immune";

interface InteractiveAnatomyProps {
  heartRate?: number | null;
  bloodPressureSys?: number | null;
  radiationLevel?: number | null;
  cumulativeDose?: number | null;
  co2Level?: number | null;
  sleepDebt?: number | null;
  bloodSugar?: number | null;
  bodyTemperature?: number | null;
  mood?: number | null;
  systemStatus?: string;
  onOpenMedGuide?: (hazardKey?: string) => void;
}

export default function InteractiveAnatomy({
  heartRate = 75,
  bloodPressureSys = 120,
  radiationLevel = 0.12,
  cumulativeDose = 0.045,
  co2Level = 0.04,
  sleepDebt = 1.2,
  bloodSugar = 94,
  bodyTemperature = 36.8,
  mood = 4,
  systemStatus = "NORMAL",
  onOpenMedGuide,
}: InteractiveAnatomyProps) {
  const [selectedRegion, setSelectedRegion] = useState<AnatomicalRegion>("heart");
  const [hoveredRegion, setHoveredRegion] = useState<AnatomicalRegion | null>(null);

  const safeSleep = sleepDebt ?? 1.0;
  const safeHr = heartRate ?? 75;
  const safeBp = bloodPressureSys ?? 120;
  const safeCo2 = co2Level ?? 0.04;
  const safeRad = radiationLevel ?? 0.12;
  const safeTemp = bodyTemperature ?? 36.8;
  const safeSugar = bloodSugar ?? 95;

  // Region specific health evaluations
  const regionData = {
    brain: {
      name: "Miya & Neyro-kognitiv Tizim",
      latin: "Cerebrum & Neuro-Cognitive",
      icon: Brain,
      color: "text-purple-400",
      borderColor: "border-purple-500/40",
      glowColor: "rgba(168, 85, 247, 0.4)",
      badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      status: safeSleep > 5 || (mood !== null && mood !== undefined && mood <= 2) ? "CRITICAL" : safeSleep > 3 ? "WARNING" : "NORMAL",
      summary:
        safeSleep > 5
          ? "Og'ir uyqu qarzi va kognitiv charchoq aniqlandi. Reaksiya tezligi 40% pasaygan."
          : mood !== null && mood !== undefined && mood <= 2
          ? "Ruhiy zo'riqish va past kayfiyat qayd etildi. Izolyatsiya xavfi (NASA BHP)."
          : safeSleep > 2
          ? "O'rtacha uyqu qarzi. Kognitiv yuklama nazorat ostida."
          : "Neyro-kognitiv holat optimal. Sirkad ritm va diqqat barqaror.",
      metrics: [
        { label: "Uyqu Qarzi", value: sleepDebt !== null && sleepDebt !== undefined ? `${sleepDebt} h` : "—", normal: "< 2.0 h", warning: safeSleep > 3 },
        { label: "Kayfiyat (Mood)", value: mood !== null && mood !== undefined ? `${mood}/5` : "—", normal: "3-5 ball", warning: mood !== null && mood !== undefined && mood <= 2 },
        { label: "Neyro-reaksiya", value: safeSleep > 4 ? "420 ms" : "210 ms", normal: "< 250 ms", warning: safeSleep > 4 },
      ],
      hazardNote: "Izolyatsiya va Yerdan masofa xavfi: Yopiq modulda uzoq muddat yashash sirkad ritm va ruhiy salomatlikka bosim o'tkazadi.",
      hazardKey: "sleep",
    },
    heart: {
      name: "Yurak & Qon Tomir Tizimi",
      latin: "Cardiovascular System",
      icon: Heart,
      color: "text-rose-400",
      borderColor: "border-rose-500/40",
      glowColor: "rgba(244, 63, 94, 0.4)",
      badgeBg: "bg-rose-500/10 text-rose-300 border-rose-500/30",
      status: safeHr > 120 || safeBp > 150 ? "CRITICAL" : safeHr > 100 ? "WARNING" : "NORMAL",
      summary:
        safeHr > 120
          ? "Taxikardiya: Yurak urishi kritik darajada yuqori. Kardio zo'riqish kuzatilmoqda."
          : safeHr > 100
          ? "Yurak urishi tezlashgan. Fiziologik yuklamani kamaytirish lozim."
          : "Yurak-qon tomir faoliyati to'liq barqaror. Ritm va bosim me'yorda.",
      metrics: [
        { label: "Puls (Heart Rate)", value: heartRate !== null && heartRate !== undefined ? `${heartRate} bpm` : "—", normal: "60-100 bpm", warning: safeHr > 100 },
        { label: "Qon Bosimi (Sys)", value: bloodPressureSys !== null && bloodPressureSys !== undefined ? `${bloodPressureSys} mmHg` : "—", normal: "110-130", warning: safeBp > 140 },
        { label: "Kardio Yuklama", value: safeHr > 110 ? "85%" : "32%", normal: "< 50%", warning: safeHr > 100 },
      ],
      hazardNote: "Gravitatsiya o'zgarishi: Suyuqlik tana yuqori qismiga ko'tariladi ('puffy face'), yurak mushaklarining atrofiyasi kuzatilishi mumkin.",
      hazardKey: "heart",
    },
    lungs: {
      name: "O'pka & Metabolizm (Qon Shakari)",
      latin: "Pulmonary & Blood Glucose",
      icon: Wind,
      color: "text-cyan-400",
      borderColor: "border-cyan-500/40",
      glowColor: "rgba(6, 182, 212, 0.4)",
      badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      status: safeCo2 > 0.1 || safeSugar > 180 || safeSugar < 54 ? "CRITICAL" : safeCo2 > 0.07 || safeSugar > 140 || safeSugar < 70 ? "WARNING" : "NORMAL",
      summary:
        safeCo2 > 0.08
          ? "Kabina havosida CO2 konsentratsiyasi yuqori. Giperkapniya va nafas zo'riqishi xavfi."
          : safeSugar > 180 || safeSugar < 54
          ? "Qon glyukozasida kritik og'ish! Gipoglikemiya yoki o'tkir giperglikemiya."
          : safeSugar > 140 || safeSugar < 70
          ? "Qon shakar miqdorida og'ish kuzatilmoqda. Metabolik kompensatsiya talab etiladi."
          : "Nafas olish va moddalar almashinuvi to'liq me'yorda.",
      metrics: [
        { label: "Kabina CO2", value: co2Level !== null && co2Level !== undefined ? `${co2Level}%` : "—", normal: "< 0.06%", warning: safeCo2 > 0.07 },
        { label: "Qon Glyukozasi", value: bloodSugar !== null && bloodSugar !== undefined ? `${bloodSugar} mg/dL` : "—", normal: "70-140", warning: safeSugar > 140 || safeSugar < 70 },
        { label: "SpO2 To'yinish", value: safeCo2 > 0.08 ? "94%" : "98.5%", normal: "> 96%", warning: safeCo2 > 0.08 },
      ],
      hazardNote: "Yopiq muhit (Hostile Environment): Konveksiya yo'qligi tufayli CO2 astronavt boshi atrofida cho'ntak hosil qiladi.",
      hazardKey: "co2",
    },
    skeleton: {
      name: "Skelet & Mushak Tizimi",
      latin: "Musculoskeletal System (Bone Density)",
      icon: Shield,
      color: "text-amber-400",
      borderColor: "border-amber-500/40",
      glowColor: "rgba(245, 158, 11, 0.4)",
      badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      status: safeRad > 2.0 || safeTemp > 38.5 ? "CRITICAL" : safeRad > 1.0 || safeTemp > 37.5 ? "WARNING" : "NORMAL",
      summary:
        safeRad > 1.5
          ? "Radiatsiya bo'roni: Dozimetr nurlanish o'sishini qayd etmoqda. Suyak iligiga jiddiy tahdid!"
          : "Vaznsizlikda suyak zichligi har oyda 1.0-1.5% yo'qotiladi (osteopeniya xavfi). Kunlik 2.5 soat ARED mashqlari talab etiladi.",
      metrics: [
        { label: "Radiatsiya Foni", value: radiationLevel !== null && radiationLevel !== undefined ? `${radiationLevel} mSv/h` : "—", normal: "< 0.5 mSv/h", warning: safeRad > 1.0 },
        { label: "Tana Harorati", value: bodyTemperature !== null && bodyTemperature !== undefined ? `${bodyTemperature} °C` : "—", normal: "36.5 - 37.2", warning: safeTemp > 37.8 || safeTemp < 35.5 },
        { label: "Kumulyativ Doza", value: cumulativeDose !== null && cumulativeDose !== undefined ? `${cumulativeDose} mSv` : "—", normal: "< 20 mSv", warning: (cumulativeDose ?? 0) > 5.0 },
      ],
      hazardNote: "NASA Hazard (Gravitatsiya va Radiatsiya): Suyak minerallari yo'qotilishi qonda kaltsiy ortishi va buyrakda tosh paydo bo'lish xavfini kuchaytiradi.",
      hazardKey: "radiation",
    },
    immune: {
      name: "Immun Tizimi & Qalqon",
      latin: "Immune Dysregulation & Latent Pathogens",
      icon: Activity,
      color: "text-emerald-400",
      borderColor: "border-emerald-500/40",
      glowColor: "rgba(16, 185, 129, 0.4)",
      badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      status: safeTemp > 38.5 || safeRad > 2.0 ? "CRITICAL" : safeTemp > 37.5 ? "WARNING" : "NORMAL",
      summary:
        safeTemp > 37.8
          ? "Tana harorati ko'tarilgan: infeksiya yoki termal regulyatsiya zo'riqishi. Immun javob faollashgan."
          : "Kosmik parvozda T-hujayralar faolligi pasayishi va latent viruslar (EBV, Herpes) uyg'onishi kuzatiladi.",
      metrics: [
        { label: "Tana Harorati", value: bodyTemperature !== null && bodyTemperature !== undefined ? `${bodyTemperature} °C` : "—", normal: "36.5-37.2 °C", warning: safeTemp > 37.8 },
        { label: "Immun Reaktivlik", value: safeRad > 1.0 ? "Susaygan (-35%)" : "Faol (Normal)", normal: "Normal", warning: safeRad > 1.0 },
        { label: "Leykotsit Indeksi", value: safeTemp > 37.8 ? "8.8 x10^9/L" : "6.2 x10^9/L", normal: "4.5-11.0", warning: safeTemp > 38.5 },
      ],
      hazardNote: "NASA Hazard (Kosmik nurlanish va Izolyatsiya): Radiatsiya va stress gormonlari immun tizimini bostiradi, allergik va autoimmun reaksiyalar xavfi ortadi.",
      hazardKey: "radiation",
    },
  };

  const active = regionData[selectedRegion];

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6 p-4 rounded-xl bg-[#070b13]/80 border border-[#141f33] backdrop-blur-md">
      {/* 1. Interactive Astronaut Anatomy Silhouette (SVG) */}
      <div className="relative w-64 h-80 flex items-center justify-center select-none shrink-0">
        {/* Subtle background radar/glow ring */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />

        <svg
          viewBox="0 0 200 320"
          className="w-full h-full filter drop-shadow-[0_0_12px_rgba(6,182,212,0.2)]"
        >
          {/* Astronaut Suit Silhouette Outline */}
          <path
            d="M100 20 C85 20, 75 32, 75 50 C75 62, 82 72, 92 76 C70 82, 55 98, 52 120 L42 180 C40 192, 50 196, 56 186 L64 140 C65 145, 66 170, 68 200 L68 280 C68 295, 84 295, 86 280 L94 205 L106 205 L114 280 C116 295, 132 295, 132 280 L132 200 C134 170, 135 145, 136 140 L144 186 C150 196, 160 192, 158 180 L148 120 C145 98, 130 82, 108 76 C118 72, 125 62, 125 50 C125 32, 115 20, 100 20 Z"
            fill="#091322"
            stroke="#1d2d48"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Torso Suit Details / Seams */}
          <ellipse cx="100" cy="50" rx="16" ry="18" fill="#0c1a30" stroke="#253a5c" strokeWidth="1.5" />
          <path d="M85 85 Q100 95 115 85" fill="none" stroke="#203350" strokeWidth="1.5" />
          <path d="M78 135 L122 135" stroke="#1d2d48" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M82 170 L118 170" stroke="#1d2d48" strokeWidth="1" strokeDasharray="3 3" />

          {/* HOTSPOT 1: Brain (Miya) */}
          <g
            className="cursor-pointer transition-transform duration-200 hover:scale-110"
            onClick={() => setSelectedRegion("brain")}
            onMouseEnter={() => setHoveredRegion("brain")}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <circle
              cx="100"
              cy="48"
              r="14"
              fill={selectedRegion === "brain" ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.1)"}
              stroke="#a855f7"
              strokeWidth={selectedRegion === "brain" ? "2.5" : "1.5"}
              className="animate-pulse"
            />
            <circle cx="100" cy="48" r="4" fill="#d8b4fe" />
          </g>

          {/* HOTSPOT 2: Lungs (O'pka) */}
          <g
            className="cursor-pointer transition-transform duration-200 hover:scale-110"
            onClick={() => setSelectedRegion("lungs")}
            onMouseEnter={() => setHoveredRegion("lungs")}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <circle
              cx="86"
              cy="105"
              r="10"
              fill={selectedRegion === "lungs" ? "rgba(6,182,212,0.35)" : "rgba(6,182,212,0.15)"}
              stroke="#06b6d4"
              strokeWidth={selectedRegion === "lungs" ? "2.5" : "1.5"}
            />
            <circle
              cx="114"
              cy="105"
              r="10"
              fill={selectedRegion === "lungs" ? "rgba(6,182,212,0.35)" : "rgba(6,182,212,0.15)"}
              stroke="#06b6d4"
              strokeWidth={selectedRegion === "lungs" ? "2.5" : "1.5"}
            />
            <circle cx="100" cy="105" r="3" fill="#67e8f9" />
          </g>

          {/* HOTSPOT 3: Heart (Yurak) */}
          <g
            className="cursor-pointer transition-transform duration-200 hover:scale-110"
            onClick={() => setSelectedRegion("heart")}
            onMouseEnter={() => setHoveredRegion("heart")}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <circle
              cx="108"
              cy="120"
              r="11"
              fill={selectedRegion === "heart" ? "rgba(244,63,94,0.4)" : "rgba(244,63,94,0.15)"}
              stroke="#f43f5e"
              strokeWidth={selectedRegion === "heart" ? "2.5" : "1.5"}
              className="animate-ping"
              style={{ animationDuration: `${Math.max(0.4, 60 / heartRate)}s` }}
            />
            <circle
              cx="108"
              cy="120"
              r="7"
              fill="#fb7185"
              stroke="#f43f5e"
              strokeWidth="1.5"
            />
          </g>

          {/* HOTSPOT 4: Skeleton / Body / Pelvis (Suyak & Tana) */}
          <g
            className="cursor-pointer transition-transform duration-200 hover:scale-110"
            onClick={() => setSelectedRegion("skeleton")}
            onMouseEnter={() => setHoveredRegion("skeleton")}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <circle
              cx="100"
              cy="175"
              r="12"
              fill={selectedRegion === "skeleton" ? "rgba(245,158,11,0.35)" : "rgba(245,158,11,0.15)"}
              stroke="#f59e0b"
              strokeWidth={selectedRegion === "skeleton" ? "2.5" : "1.5"}
            />
            <circle cx="100" cy="175" r="4" fill="#fcd34d" />
          </g>
        </svg>

        {/* Hotspot Region Selector Chips */}
        <div className="absolute -bottom-1 flex items-center justify-center gap-1.5 w-full">
          {(["brain", "lungs", "heart", "skeleton"] as AnatomicalRegion[]).map((r) => {
            const isSel = selectedRegion === r;
            const item = regionData[r];
            const Icon = item.icon;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRegion(r)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  isSel
                    ? `${item.badgeBg} ${item.borderColor} font-bold shadow-[0_0_10px_${item.glowColor}]`
                    : "bg-[#090e18] border-[#1a2638] text-slate-400 hover:text-slate-200"
                }`}
                title={item.name}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Anatomical Telemetry & Diagnostics Card */}
      <div className="flex-1 min-w-0 w-full space-y-3">
        {/* Header of selected organ */}
        <div className="flex items-center justify-between border-b border-[#142036] pb-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl bg-[#0d1624] border ${active.borderColor} ${active.color}`}
            >
              <active.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{active.name}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  [{active.latin}]
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Organ bo&apos;yicha real vaqtda telemetrik monitoring
              </p>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              active.status === "CRITICAL"
                ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                : active.status === "WARNING"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
            }`}
          >
            {active.status}
          </span>
        </div>

        {/* Real-time metrics grid for the selected organ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {active.metrics.map((m, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg bg-[#09101c] border transition-all ${
                m.warning ? "border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]" : "border-[#17243a]"
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                {m.label}
              </div>
              <div
                className={`text-base font-bold font-mono mt-0.5 ${
                  m.warning ? "text-amber-400" : "text-white"
                }`}
              >
                {m.value}
              </div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                Normal: {m.normal}
              </div>
            </div>
          ))}
        </div>

        {/* Physiological Assessment & Explanation */}
        <div className="p-2.5 rounded-lg bg-[#0a1220] border border-[#16233a] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            {active.summary}
          </div>
        </div>

        {/* NASA Hazard Note */}
        {active.hazardNote && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed font-mono flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">NASA Hazard: </span>
              {active.hazardNote}
            </div>
          </div>
        )}

        {/* Action Button: Jump to First-Aid / Medical Guide */}
        {onOpenMedGuide && (
          <button
            type="button"
            onClick={() => onOpenMedGuide(active.hazardKey)}
            className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>USHBU ORGAN BO&apos;YICHA TIBBIY QO&apos;LLANMA (FIRST-AID)</span>
          </button>
        )}
      </div>
    </div>
  );
}
