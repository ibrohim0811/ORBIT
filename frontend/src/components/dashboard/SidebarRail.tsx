"use client";

import {
  PenTool,
  Search,
  Layers,
  MessageSquare,
  RefreshCw,
  Settings,
  Award,
  BookOpen,
  RadioTower,
} from "lucide-react";

export type ActivePanel =
  | "none"
  | "notes"
  | "search"
  | "chat"
  | "sync"
  | "settings"
  | "gamification"
  | "guide";

interface SidebarRailProps {
  activePanel: ActivePanel;
  onSelectPanel: (panel: ActivePanel) => void;
  syncPendingCount?: number;
}

export default function SidebarRail({
  activePanel,
  onSelectPanel,
  syncPendingCount = 0,
}: SidebarRailProps) {
  const togglePanel = (panel: ActivePanel) => {
    onSelectPanel(activePanel === panel ? "none" : panel);
  };

  return (
    <aside className="w-14 shrink-0 bg-[#060910] border-r border-[#151d2d] flex flex-col items-center py-4 justify-between z-30 select-none">
      <div className="flex flex-col items-center gap-6">
        {/* Logo / Gemini colorful sparkle icon */}
        <button
          onClick={() => onSelectPanel("none")}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          title="ORBIT Mission Home"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
              fill="url(#sparkle-grad)"
            />
            <defs>
              <linearGradient
                id="sparkle-grad"
                x1="2"
                y1="2"
                x2="22"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#818cf8" />
                <stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>
        </button>

        {/* Navigation Icons mapped directly to Backend APIs */}
        <nav className="flex flex-col items-center gap-3 text-slate-500">
          {/* Main Dashboard View */}
          <button
            title="Mission Control Dashboard (GET /dashboard)"
            onClick={() => onSelectPanel("none")}
            className={`p-2.5 rounded-xl transition-all relative ${
              activePanel === "none"
                ? "bg-[#0e1726] text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                : "hover:text-slate-300 hover:bg-[#131b2c]"
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Notes / Mission Logs */}
          <button
            title="Notes / Mission Logs (GET/POST /notes)"
            onClick={() => togglePanel("notes")}
            className={`p-2.5 rounded-xl transition-all relative ${
              activePanel === "notes"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                : "hover:text-slate-300 hover:bg-[#131b2c]"
            }`}
          >
            <PenTool className="w-4 h-4" />
          </button>

          {/* Search Telemetry Drawer */}
          <button
            title="Search & Telemetry History (GET /search & /telemetry/history)"
            onClick={() => togglePanel("search")}
            className={`p-2.5 rounded-xl transition-all relative ${
              activePanel === "search"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                : "hover:text-slate-300 hover:bg-[#131b2c]"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Crew Communication / Ollama AI Chat */}
          <button
            title="Crew Communication / Medical AI (POST /chat)"
            onClick={() => togglePanel("chat")}
            className={`p-2.5 rounded-xl transition-all relative ${
              activePanel === "chat"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                : "hover:text-slate-300 hover:bg-[#131b2c]"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Gamification Panel */}
          <button
            title="Habit & Countermeasure Gamification"
            onClick={() => togglePanel("gamification")}
            className={`p-2.5 rounded-xl transition-all relative ${
              activePanel === "gamification"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                : "hover:text-slate-300 hover:bg-[#131b2c]"
            }`}
          >
            <Award className="w-4 h-4" />
          </button>

          {/* Data Sync & LOS Monitor Drawer */}
          <button
            title="Ground Data Sync & LOS Handling (GET/POST /sync)"
            onClick={() => togglePanel("sync")}
            className={`p-2.5 rounded-xl transition-all relative ${
              activePanel === "sync"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                : "hover:text-slate-300 hover:bg-[#131b2c]"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            {syncPendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* NASA 5 Hazards Guide */}
          <button
            title="NASA 5 Hazards Medical Guide"
            onClick={() => togglePanel("guide")}
            className={`p-2.5 rounded-xl transition-all relative ${
              activePanel === "guide"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                : "hover:text-slate-300 hover:bg-[#131b2c]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </nav>
      </div>

      {/* Bottom Navigation Rails */}
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <button
          title="Settings & Clinical Thresholds"
          onClick={() => togglePanel("settings")}
          className={`p-2.5 rounded-xl transition-all ${
            activePanel === "settings"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              : "hover:text-slate-300 hover:bg-[#131b2c]"
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Earth Link Indicator */}
        <button
          title="Earth Ground Station Link (Click for Sync & LOS Details)"
          onClick={() => togglePanel("sync")}
          className="w-8 h-8 rounded-full border border-cyan-500/50 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.4)] hover:scale-110 transition-transform bg-cyan-950/60 flex items-center justify-center text-cyan-400"
        >
          <RadioTower className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
