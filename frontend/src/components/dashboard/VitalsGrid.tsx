"use client";

import { Heart, Wind, Thermometer, Radio, Activity } from "lucide-react";
import { formatMetric, getStatusConfig } from "@/lib/status";

interface VitalsGridProps {
  heartRate: number | null | undefined;
  spo2: number | null | undefined;
  bodyTemp?: number | null | undefined;
  bloodPressureSys?: number | null | undefined;
  radiationLevel: number | null | undefined;
  systemStatus?: string | null;
}

export default function VitalsGrid({
  heartRate,
  spo2,
  bodyTemp,
  bloodPressureSys,
  radiationLevel,
  systemStatus = "NORMAL",
}: VitalsGridProps) {
  const statusCfg = getStatusConfig(systemStatus);

  const hrFmt = formatMetric(heartRate, "BPM");
  const spo2Fmt = formatMetric(spo2, "%");
  const tempFmt = formatMetric(bodyTemp, "°C");
  const bpFmt = formatMetric(bloodPressureSys, "mmHg");
  const radFmt = formatMetric(radiationLevel, "mSv/h");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: HEART RATE */}
      <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
              HEART RATE
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-extrabold tracking-tight ${hrFmt.hasValue ? "text-white" : "text-slate-600"}`}>
                {hrFmt.display}
              </span>
              {hrFmt.hasValue && <span className="text-xs text-slate-400 font-mono">{hrFmt.unit}</span>}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Heart className="w-4 h-4 fill-rose-500" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#162033] flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Target Range: 60 - 100</span>
          <span
            className="font-bold tracking-wider"
            style={{ color: hrFmt.hasValue ? statusCfg.color : "#64748b" }}
          >
            {hrFmt.hasValue ? statusCfg.label : "NO DATA"}
          </span>
        </div>
        {hrFmt.hasValue && heartRate && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"
            style={{
              width: `${Math.min(100, (heartRate / 160) * 100)}%`,
              transition: "width 0.5s ease-in-out",
            }}
          />
        )}
      </div>

      {/* Card 2: OXYGEN SATURATION (SpO2) */}
      <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
              OXYGEN SATURATION (SpO2)
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-extrabold tracking-tight ${spo2Fmt.hasValue ? "text-white" : "text-slate-600"}`}>
                {spo2Fmt.display}
              </span>
              {spo2Fmt.hasValue && <span className="text-xs text-slate-400 font-mono">%</span>}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Wind className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#162033] flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Safe Limit: &gt; 95%</span>
          <span
            className="font-bold tracking-wider"
            style={{ color: spo2Fmt.hasValue ? statusCfg.color : "#64748b" }}
          >
            {spo2Fmt.hasValue ? statusCfg.label : "SENSOR UNCONNECTED"}
          </span>
        </div>
        {spo2Fmt.hasValue && spo2 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400"
            style={{
              width: `${spo2}%`,
              transition: "width 0.5s ease-in-out",
            }}
          />
        )}
      </div>

      {/* Card 3: CORE TEMPERATURE / BLOOD PRESSURE */}
      <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
              {tempFmt.hasValue ? "CORE TEMPERATURE" : "SYSTOLIC PRESSURE"}
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-extrabold tracking-tight ${tempFmt.hasValue || bpFmt.hasValue ? "text-white" : "text-slate-600"}`}>
                {tempFmt.hasValue ? tempFmt.display : bpFmt.hasValue ? bpFmt.display : "—"}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {tempFmt.hasValue ? tempFmt.unit : bpFmt.hasValue ? bpFmt.unit : ""}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Thermometer className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#162033] flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">
            {tempFmt.hasValue ? "Range: 36.5 - 37.5" : "Target: 90 - 130"}
          </span>
          <span
            className="font-bold tracking-wider"
            style={{ color: tempFmt.hasValue || bpFmt.hasValue ? statusCfg.color : "#64748b" }}
          >
            {tempFmt.hasValue || bpFmt.hasValue ? statusCfg.label : "NO SENSOR"}
          </span>
        </div>
      </div>

      {/* Card 4: AMBIENT RADIATION */}
      <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
              RADIATION FLUX
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-extrabold tracking-tight ${radFmt.hasValue ? "text-white" : "text-slate-600"}`}>
                {radFmt.display}
              </span>
              {radFmt.hasValue && <span className="text-xs text-slate-400 font-mono">{radFmt.unit}</span>}
            </div>
          </div>
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              radiationLevel && radiationLevel > 1.0
                ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            <Radio className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#162033] flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Threshold: &lt; 0.50</span>
          <span
            className="font-bold tracking-wider"
            style={{ color: radFmt.hasValue ? statusCfg.color : "#64748b" }}
          >
            {radFmt.hasValue ? statusCfg.label : "NO DATA"}
          </span>
        </div>
        {radFmt.hasValue && radiationLevel && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1 bg-purple-400"
            style={{
              width: `${Math.min(100, (radiationLevel / 3.0) * 100)}%`,
              transition: "width 0.5s ease-in-out",
            }}
          />
        )}
      </div>
    </div>
  );
}
