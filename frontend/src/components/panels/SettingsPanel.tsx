"use client";

import { useState } from "react";
import { X, Settings, Sliders, Shield, AlertTriangle, Radio } from "lucide-react";
import { BACKEND_URL } from "@/lib/api";

interface SettingsPanelProps {
  crewId: string;
  onClose: () => void;
}

export default function SettingsPanel({ crewId, onClose }: SettingsPanelProps) {
  const [apiUrl, setApiUrl] = useState(BACKEND_URL);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-[#090e18]/95 border-l border-[#1b263b] shadow-2xl backdrop-blur-xl z-50 flex flex-col font-sans text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-[#182337] flex items-center justify-between bg-[#070b13]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-white">
              MISSION CONFIGURATION
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Deterministic Rule Engine &amp; Thresholds
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151f33] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5 overflow-y-auto flex-1 font-mono text-xs">
        {/* Active Crew & API */}
        <div className="p-4 rounded-xl bg-[#0b1322] border border-[#17243a] space-y-3">
          <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            Active Target Context
          </h4>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 uppercase">Selected Crew ID:</label>
              <input
                type="text"
                readOnly
                value={crewId}
                className="w-full bg-[#060a12] border border-[#1b283d] rounded-lg px-3 py-1.5 text-xs text-white mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase">Backend API Base URL:</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full bg-[#060a12] border border-[#1b283d] rounded-lg px-3 py-1.5 text-xs text-cyan-300 mt-1"
              />
            </div>
          </div>
        </div>

        {/* Rule Engine Thresholds from backend thresholds.py */}
        <div className="p-4 rounded-xl bg-[#0b1322] border border-[#17243a] space-y-3">
          <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Validated Decision Thresholds
          </h4>
          <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
            Thresholds enforced by backend risk engine (app/core/thresholds.py):
          </p>

          <div className="space-y-2 text-[11px]">
            <div className="p-2 rounded-lg bg-[#060a12] border border-[#17243a] flex justify-between items-center">
              <span className="text-slate-300">Heart Rate (Warning / Critical)</span>
              <span className="font-bold text-rose-400">100 / 120 bpm</span>
            </div>

            <div className="p-2 rounded-lg bg-[#060a12] border border-[#17243a] flex justify-between items-center">
              <span className="text-slate-300">Radiation (Warning / Critical)</span>
              <span className="font-bold text-purple-400">1.0 / 2.0 mSv/h</span>
            </div>

            <div className="p-2 rounded-lg bg-[#060a12] border border-[#17243a] flex justify-between items-center">
              <span className="text-slate-300">Cabin CO2 (Warning / Critical)</span>
              <span className="font-bold text-amber-400">0.07 / 0.10 %</span>
            </div>

            <div className="p-2 rounded-lg bg-[#060a12] border border-[#17243a] flex justify-between items-center">
              <span className="text-slate-300">Sleep Debt Accumulation</span>
              <span className="font-bold text-cyan-400">&gt; 5.0 hours</span>
            </div>

            <div className="p-2 rounded-lg bg-[#060a12] border border-[#17243a] flex justify-between items-center">
              <span className="text-slate-300">LOS Stale Detection Window</span>
              <span className="font-bold text-slate-400">10.0 seconds</span>
            </div>

            <div className="p-2 rounded-lg bg-[#060a12] border border-[#17243a] flex justify-between items-center">
              <span className="text-slate-300">Check-In Escalation Timeout</span>
              <span className="font-bold text-slate-400">300 seconds</span>
            </div>
          </div>
        </div>

        {/* Safety Principles */}
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[10px] text-amber-200/80 leading-relaxed font-sans">
          <strong>NASA Safety Principle:</strong> Local LLM (Ollama) does NOT make autonomous clinical diagnosis. Deterministic rules calculate risk; AI only provides explainability.
        </div>
      </div>
    </div>
  );
}
