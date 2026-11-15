"use client";

import { useState } from "react";
import { Heart, Wind, Radio, Moon, Bone, ShieldAlert, Sparkles, Info } from "lucide-react";
import DigitalTwin3D from "./DigitalTwin3D";
import { type NasaHazardKey } from "./MedicalGuideModal";
import { getStatusConfig } from "@/lib/status";

interface InteractiveAnatomyProps {
  heartRate: number | null;
  radiationLevel: number | null;
  co2Level: number | null;
  sleepDebt: number | null;
  systemStatus?: string | null;
  onOpenMedGuide: (hazardKey: NasaHazardKey) => void;
}

export default function InteractiveAnatomy({
  heartRate,
  radiationLevel,
  co2Level,
  sleepDebt,
  systemStatus = "NORMAL",
  onOpenMedGuide,
}: InteractiveAnatomyProps) {
  const [activeTab, setActiveTab] = useState<"twin" | "systems">("twin");
  const statusCfg = getStatusConfig(systemStatus);

  const systems = [
    {
      id: "cardio",
      name: "Cardiovascular System",
      hazard: "gravity" as NasaHazardKey,
      metricName: "Heart Rate",
      value: heartRate !== null && heartRate !== undefined ? `${heartRate} bpm` : "—",
      status: heartRate !== null ? statusCfg.label : "NO SENSOR",
      statusColor: heartRate !== null ? statusCfg.color : "#64748b",
      icon: Heart,
    },
    {
      id: "respiratory",
      name: "Respiratory & Gas Exchange",
      hazard: "environment" as NasaHazardKey,
      metricName: "Cabin CO2",
      value: co2Level !== null && co2Level !== undefined ? `${co2Level}%` : "—",
      status: co2Level !== null ? statusCfg.label : "NO SENSOR",
      statusColor: co2Level !== null ? statusCfg.color : "#64748b",
      icon: Wind,
    },
    {
      id: "cellular",
      name: "Cellular & DNA Shielding",
      hazard: "radiation" as NasaHazardKey,
      metricName: "Radiation Flux",
      value: radiationLevel !== null && radiationLevel !== undefined ? `${radiationLevel} mSv/h` : "—",
      status: radiationLevel !== null ? statusCfg.label : "NO SENSOR",
      statusColor: radiationLevel !== null ? statusCfg.color : "#64748b",
      icon: Radio,
    },
    {
      id: "neuro",
      name: "Circadian / Nervous System",
      hazard: "isolation" as NasaHazardKey,
      metricName: "Sleep Deficit",
      value: sleepDebt !== null && sleepDebt !== undefined ? `${sleepDebt} hrs` : "—",
      status: sleepDebt !== null ? statusCfg.label : "NO SENSOR",
      statusColor: sleepDebt !== null ? statusCfg.color : "#64748b",
      icon: Moon,
    },
    {
      id: "skeletal",
      name: "Skeletal Bone Matrix (DEXA)",
      hazard: "gravity" as NasaHazardKey,
      metricName: "Bone Mineral Mass",
      value: "—",
      status: "NO SENSOR",
      statusColor: "#64748b",
      note: "Continuous telemetry sensor not attached for this subsystem. Monitored via post-EVA DEXA scan.",
      icon: Bone,
    },
    {
      id: "immune",
      name: "Immune / Leukocyte Panel",
      hazard: "radiation" as NasaHazardKey,
      metricName: "WBC count",
      value: "—",
      status: "NO SENSOR",
      statusColor: "#64748b",
      note: "Continuous telemetry sensor not attached for this subsystem. Monitored via flight saliva assay.",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              SUIT &amp; ANATOMY DIGITAL TWIN
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <button
              onClick={() => setActiveTab("twin")}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === "twin"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              3D Wireframe
            </button>
            <button
              onClick={() => setActiveTab("systems")}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === "systems"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Subsystems
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
          <span>Overall Biometric Status:</span>
          <span
            className="font-bold uppercase tracking-wider"
            style={{ color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      {activeTab === "twin" ? (
        <div className="my-auto py-2">
          <DigitalTwin3D
            heartRate={heartRate || 75}
            isAnomaly={systemStatus === "WARNING" || systemStatus === "CRITICAL"}
          />
          <div className="mt-2 text-center text-[10px] text-slate-500 font-mono">
            Drag to Rotate 3D Suit · Real-time Cardiac Phase Coupling
          </div>
        </div>
      ) : (
        <div className="my-auto py-1 space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {systems.map((s) => (
            <div
              key={s.id}
              onClick={() => onOpenMedGuide(s.hazard)}
              className="p-2 rounded-lg bg-[#080d16] border border-[#162134] hover:border-cyan-500/50 cursor-pointer transition-all flex items-start justify-between gap-2"
              title="Click to view NASA 5 Hazards clinical protocol"
            >
              <div className="flex items-center gap-2">
                <s.icon className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block">
                    {s.name}
                  </span>
                  {s.note ? (
                    <span className="text-[9px] text-slate-500 font-sans leading-tight block">
                      {s.note}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {s.metricName}: {s.value}
                    </span>
                  )}
                </div>
              </div>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0"
                style={{
                  color: s.statusColor,
                  backgroundColor: `${s.statusColor}15`,
                  border: `1px solid ${s.statusColor}30`,
                }}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer trigger */}
      <div className="pt-3 border-t border-[#162033] flex items-center justify-between text-xs font-mono">
        <button
          onClick={() => onOpenMedGuide("radiation")}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
        >
          <Sparkles className="w-3 h-3" />
          <span>Open NASA 5 Hazards Medical Guide →</span>
        </button>
        <span className="text-[10px] text-slate-500">Mk-VI EVA Suit</span>
      </div>
    </div>
  );
}
