"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Wifi,
  Brain,
  ChevronDown,
  Layers,
  Settings,
  Search,
  PenTool,
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
  X,
  Activity,
  RadioTower,
  UserCheck,
  Award,
  BookOpen,
} from "lucide-react";

import SidebarRail, { type ActivePanel } from "@/components/dashboard/SidebarRail";
import VitalsGrid from "@/components/dashboard/VitalsGrid";
import TelemetryChart, { type TelemetryPoint } from "@/components/dashboard/TelemetryChart";
import ActionCenterCard from "@/components/dashboard/ActionCenterCard";
import InteractiveAnatomy from "@/components/InteractiveAnatomy";
import MedicalGuideModal, { type NasaHazardKey } from "@/components/MedicalGuideModal";
import NotesPanel from "@/components/panels/NotesPanel";
import SearchPanel from "@/components/panels/SearchPanel";
import ChatPanel from "@/components/panels/ChatPanel";
import SyncPanel from "@/components/panels/SyncPanel";
import SettingsPanel from "@/components/panels/SettingsPanel";
import CheckInModal from "@/components/panels/CheckInModal";
import GamificationPanel from "@/components/panels/GamificationPanel";

import {
  WS_URL,
  fetchStatus,
  fetchAiStatus,
  fetchEvents,
  fetchSyncStatus,
  fetchTelemetryHistory,
  fetchCrews,
  setSimulatorMode,
  type AnalyticsData,
  type StatusResponse,
  type AiStatusResponse,
  type SyncStatusResponse,
} from "@/lib/api";
import { getStatusConfig } from "@/lib/status";

type AnomalyMode = "normal" | "hypoxia" | "tachycardia" | "storm";

interface Astronaut {
  id: string;
  name: string;
  mission: string;
  initials: string;
}

const DEFAULT_ASTRONAUTS: Astronaut[] = [
  {
    id: "CREW-1",
    name: "Cmdr. Sarah Stone",
    mission: "EVA Mission 1",
    initials: "SS",
  },
  {
    id: "CREW-2",
    name: "Dr. Alex Vance",
    mission: "Lunar Module",
    initials: "AV",
  },
  {
    id: "CREW-3",
    name: "Eng. Kenji Sato",
    mission: "Mars Habitat 01",
    initials: "KS",
  },
];

export default function OrbitTelemetryDashboard() {
  const [astronautList, setAstronautList] = useState<Astronaut[]>(DEFAULT_ASTRONAUTS);
  const [selectedAstronaut, setSelectedAstronaut] = useState<Astronaut>(DEFAULT_ASTRONAUTS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [anomalyMode, setAnomalyMode] = useState<AnomalyMode>("normal");
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  const [activeHazardGuide, setActiveHazardGuide] = useState<NasaHazardKey | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isDockerModalOpen, setIsDockerModalOpen] = useState(false);
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [currentTimeUTC, setCurrentTimeUTC] = useState("11:34:02 UTC");
  const [lang, setLang] = useState<"EN" | "UZ">("EN");

  // Real API & WebSocket States
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "live" | "reconnecting" | "los">("connecting");
  const [wsLatency, setWsLatency] = useState(45);
  const [lastApiAction, setLastApiAction] = useState<string | null>(null);
  const [apiStatusSummary, setApiStatusSummary] = useState<StatusResponse | null>(null);
  const [aiEngineStatus, setAiEngineStatus] = useState<AiStatusResponse>({
    engine: "Ollama LLaMA-3",
    state: "Active",
  });
  const [recentEvents, setRecentEvents] = useState<
    { kind: string; detail: string; at: string | null }[]
  >([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);

  // Live incoming telemetry snapshot (strictly from backend)
  const [latestLiveMetrics, setLatestLiveMetrics] = useState<{
    hr: number | null;
    rad: number | null;
    co2: number | null;
    sleep: number | null;
    status?: string;
  } | null>(null);

  // Chart telemetry rolling window
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  // 1. Clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeUTC(now.toISOString().substring(11, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Load dynamic crews list from GET /crews
  useEffect(() => {
    fetchCrews()
      .then((res) => {
        if (res.crews && res.crews.length > 0) {
          const merged: Astronaut[] = res.crews.map((cId) => {
            const found = DEFAULT_ASTRONAUTS.find((a) => a.id === cId);
            if (found) return found;
            return {
              id: cId,
              name: `Astronaut ${cId}`,
              mission: "Orbital Lab",
              initials: cId.replace("CREW-", "C"),
            };
          });
          setAstronautList(merged);
        }
      })
      .catch(() => {
        // Keep default list offline
      });
  }, []);

  // 3. Load initial REST status & events
  const loadInitialStatus = useCallback(async () => {
    const crewId = selectedAstronaut.id;
    try {
      const { data, latencyMs } = await fetchStatus(crewId);
      setApiStatusSummary(data);
      setWsLatency(latencyMs);
      setLastApiAction(`GET /status (${latencyMs}ms) OK`);

      if (
        typeof data.analytics_summary === "object" &&
        data.analytics_summary !== null &&
        "metrics" in data.analytics_summary
      ) {
        const m = data.analytics_summary.metrics;
        setLatestLiveMetrics({
          hr: m.avg_heart_rate ?? null,
          rad: m.current_radiation ?? null,
          co2: m.current_co2 ?? null,
          sleep: m.sleep_debt_hours ?? null,
          status: data.analytics_summary.system_status,
        });
      }
    } catch {
      setLastApiAction("API: Offline-Edge (LOS)");
    }

    try {
      const aiStatus = await fetchAiStatus();
      setAiEngineStatus(aiStatus);
    } catch {
      setAiEngineStatus({ engine: "Deterministic Rules", state: "Offline" });
    }

    try {
      const evRes = await fetchEvents(crewId, 5);
      if (evRes.events && evRes.events.length > 0) {
        setRecentEvents(evRes.events);
      }
    } catch {
      // Offline fallback
    }

    try {
      const syncRes = await fetchSyncStatus(crewId);
      setSyncStatus(syncRes);
    } catch {
      // Offline fallback
    }
  }, [selectedAstronaut.id]);

  useEffect(() => {
    loadInitialStatus();
    const interval = setInterval(loadInitialStatus, 8000);
    return () => clearInterval(interval);
  }, [loadInitialStatus]);

  // 4. Load initial 25 points from telemetry history (no Math.random)
  useEffect(() => {
    fetchTelemetryHistory(selectedAstronaut.id, { limit: 25 })
      .then((res) => {
        if (res.samples && res.samples.length > 0) {
          const pts: TelemetryPoint[] = res.samples.reverse().map((s, idx) => ({
            second: `${idx}s`,
            hr: s.heart_rate,
            spo2: null,
          }));
          setTelemetryHistory(pts);
        }
      })
      .catch(() => {
        // Keep empty if offline
      });
  }, [selectedAstronaut.id]);

  // 5. Resilient WebSocket connection with exponential backoff
  // (Notice: anomalyMode is NOT in the dependencies so scenario injection won't drop connection)
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      setConnectionStatus("connecting");
      const ws = new WebSocket(`${WS_URL}?crew_id=${encodeURIComponent(selectedAstronaut.id)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("live");
        reconnectAttemptsRef.current = 0;
        setLastApiAction("WS: Connected /ws/telemetry (1 Hz)");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.analytics &&
            typeof payload.analytics === "object" &&
            "metrics" in payload.analytics
          ) {
            const a = payload.analytics as AnalyticsData;
            setConnectionStatus("live");

            const nextHr = a.metrics.avg_heart_rate ?? null;

            setLatestLiveMetrics({
              hr: nextHr,
              rad: a.metrics.current_radiation ?? null,
              co2: a.metrics.current_co2 ?? null,
              sleep: a.metrics.sleep_debt_hours ?? null,
              status: a.system_status,
            });

            if (nextHr !== null) {
              setTelemetryHistory((prev) => {
                const maxLen = 25;
                const nextSecond = `${prev.length}s`;
                if (prev.length < maxLen) {
                  return [...prev, { second: nextSecond, hr: Math.round(nextHr * 10) / 10 }];
                }
                const shifted = prev.slice(1).map((pt, idx) => ({
                  ...pt,
                  second: `${idx}s`,
                }));
                shifted.push({
                  second: "24s",
                  hr: Math.round(nextHr * 10) / 10,
                });
                return shifted;
              });
            }
          }
        } catch (e) {
          console.error("WS Parse error:", e);
        }
      };

      ws.onclose = () => {
        setConnectionStatus("reconnecting");
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 15000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      };

      ws.onerror = () => {
        setConnectionStatus("los");
        ws.close();
      };
    } catch {
      setConnectionStatus("los");
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 15000);
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
    }
  }, [selectedAstronaut.id]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connectWebSocket]);

  // 6. Handle Scenario Injection via POST /simulator/mode (No manual fake payload)
  const handleSelectAnomaly = async (mode: AnomalyMode) => {
    setAnomalyMode(mode);
    const simMode = mode === "hypoxia" ? "warning" : mode === "tachycardia" ? "critical" : mode === "storm" ? "storm" : "normal";

    try {
      await setSimulatorMode(simMode);
      setLastApiAction(`SIM: ${simMode.toUpperCase()} mode dispatched to backend`);
      loadInitialStatus();
    } catch {
      setLastApiAction("POST /simulator/mode failed");
    }
  };

  const copyDockerCmd = () => {
    navigator.clipboard.writeText("docker compose up --build");
    setCopiedDocker(true);
    setTimeout(() => setCopiedDocker(false), 2000);
  };

  const currentSystemStatus =
    latestLiveMetrics?.status ||
    (typeof apiStatusSummary?.analytics_summary === "object" && apiStatusSummary.analytics_summary !== null
      ? apiStatusSummary.analytics_summary.system_status
      : "NORMAL");

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex font-sans select-none antialiased relative overflow-x-hidden">
      {/* 1. LEFT SIDEBAR NAVIGATION RAIL */}
      <SidebarRail
        activePanel={activePanel}
        onSelectPanel={setActivePanel}
        syncPendingCount={syncStatus?.pending_samples}
      />

      {/* 2. MAIN MISSION CONTROL VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-[#131b2c] flex flex-wrap items-center justify-between gap-4 bg-[#080d16]/90 backdrop-blur-md sticky top-0 z-20">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-wider text-white font-mono">
                  ORBIT<span className="text-cyan-400">.TELEMETRY</span>
                </h1>
                <span className="text-[10px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-400 bg-cyan-500/10">
                  NASA SPACE APPS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hidden sm:inline">
                  OFFLINE-EDGE v1.1
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 tracking-wide font-sans">
                {lang === "EN"
                  ? "Astronaut Health & Vital Telemetry Bio-Monitoring Center"
                  : "Astronavt salomatligi va biometrik telemetriya monitoringi"}
              </p>
            </div>
          </div>

          {/* Right Status Indicators */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs font-mono">
            {/* Stream Status */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                connectionStatus === "live"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : connectionStatus === "connecting"
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>
                {connectionStatus === "live"
                  ? `Live 1 Hz (${wsLatency}ms)`
                  : connectionStatus === "connecting"
                  ? "Connecting..."
                  : "LOS (Reconnecting)"}
              </span>
            </div>

            {/* AI Engine Status */}
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0e1626] border border-[#1b263b] text-purple-400">
              <Brain className="w-3.5 h-3.5" />
              <span>{aiEngineStatus.engine}</span>
            </div>

            {/* Crew Check-in Trigger */}
            <button
              onClick={() => setIsCheckInModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-all font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>CHECK-IN</span>
              {apiStatusSummary?.checkin?.last_status && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] ${
                    apiStatusSummary.checkin.last_status === "OK"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {apiStatusSummary.checkin.last_status}
                </span>
              )}
            </button>

            {/* Ground Link / Sync Queue */}
            <button
              onClick={() => setActivePanel("sync")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all font-semibold border ${
                syncStatus?.link === "OK"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
              }`}
            >
              <RadioTower className="w-3.5 h-3.5" />
              {syncStatus?.link === "OK" ? (
                <span>LINK OK</span>
              ) : (
                <span>LOS{syncStatus?.pending_samples ? ` · ${syncStatus.pending_samples}Q` : ""}</span>
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === "EN" ? "UZ" : "EN")}
              className="px-2 py-1 rounded bg-[#0e1626] border border-[#1d2d46] text-slate-300 hover:text-white transition-colors"
            >
              {lang}
            </button>
          </div>
        </header>

        {/* 1-Click Docker Subheader Strip */}
        <div className="px-4 sm:px-6 pt-3 pb-1 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDockerModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-[#00d2ff] hover:bg-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)] transition-all flex items-center gap-2 font-mono"
            >
              🐳 1-CLICK DOCKER DEPLOY
            </button>

            {/* Quick Panel Shortcuts */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono">
              <button
                onClick={() => setActivePanel("notes")}
                className="px-2.5 py-1 rounded bg-[#0d1624] hover:bg-[#15233a] border border-[#1d2d46] text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <PenTool className="w-3 h-3 text-cyan-400" />
                <span>Logs</span>
              </button>
              <button
                onClick={() => setActivePanel("chat")}
                className="px-2.5 py-1 rounded bg-[#0d1624] hover:bg-[#15233a] border border-[#1d2d46] text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3 h-3 text-purple-400" />
                <span>AI Chat</span>
              </button>
              <button
                onClick={() => setActivePanel("gamification")}
                className="px-2.5 py-1 rounded bg-[#0d1624] hover:bg-[#15233a] border border-[#1d2d46] text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <Award className="w-3 h-3 text-amber-400" />
                <span>Habits</span>
              </button>
              <button
                onClick={() => setActiveHazardGuide("radiation")}
                className="px-2.5 py-1 rounded bg-[#0d1624] hover:bg-[#15233a] border border-[#1d2d46] text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3 h-3 text-cyan-400" />
                <span>5 Hazards</span>
              </button>
            </div>
          </div>

          {/* Activity / Action indicator */}
          <div className="flex items-center gap-2 text-[11px] font-mono px-3 py-1 rounded-lg bg-[#0e1626] border border-[#1b263b] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{lastApiAction || "FastAPI Monitoring Engine Active"}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 space-y-6">
          {/* Active Astronaut Bar & Scenario Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0b121f] border border-[#182337] shadow-lg">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Offline Initial Circle Avatar (No Unsplash URL) */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-950 via-[#0d1c33] to-cyan-500/30 border-2 border-cyan-400 flex items-center justify-center font-mono font-bold text-sm text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] shrink-0">
                <span>{selectedAstronaut.initials}</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                    ACTIVE SUBJECT MONITORING
                  </p>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" />
                    Multi-Crew Sim Active
                  </span>
                </div>

                <div className="relative mt-1">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-sm font-semibold text-white bg-[#101a2c] hover:bg-[#162238] border border-[#22334f] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span>
                      {selectedAstronaut.name} ({selectedAstronaut.id})
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-[#0d1624] border border-[#1e2d44] rounded-xl shadow-2xl py-1 z-40 backdrop-blur-md">
                      {astronautList.map((astro) => (
                        <button
                          key={astro.id}
                          onClick={() => {
                            setSelectedAstronaut(astro);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center gap-2.5 transition-colors ${
                            astro.id === selectedAstronaut.id
                              ? "bg-cyan-500/15 text-cyan-300"
                              : "text-slate-300 hover:bg-[#142033]"
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-400 font-bold">
                            {astro.initials}
                          </span>
                          <span>
                            {astro.name} ({astro.mission})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                EVA ACTIVE
              </div>
            </div>

            {/* Scenario Injector (Triggers POST /simulator/mode) */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono tracking-wide hidden sm:inline">
                Scenario Injector:
              </span>
              <div className="flex flex-wrap items-center gap-2 font-mono">
                <button
                  onClick={() => handleSelectAnomaly("normal")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    anomalyMode === "normal"
                      ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "bg-[#0f1726] text-slate-400 hover:text-white border border-[#1e2a40]"
                  }`}
                >
                  🟢 1. Nominal Orbit
                </button>
                <button
                  onClick={() => handleSelectAnomaly("hypoxia")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    anomalyMode === "hypoxia"
                      ? "bg-amber-950/80 text-amber-300 border border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                      : "bg-[#0f1726] text-amber-400/80 hover:text-amber-300 border border-amber-500/30"
                  }`}
                >
                  🟡 2. Hypoxia (Low SpO2)
                </button>
                <button
                  onClick={() => handleSelectAnomaly("tachycardia")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    anomalyMode === "tachycardia"
                      ? "bg-rose-950/80 text-rose-300 border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                      : "bg-[#0f1726] text-rose-400/80 hover:text-rose-300 border border-rose-500/30"
                  }`}
                >
                  🔴 3. Tachycardia Stress
                </button>
                <button
                  onClick={() => handleSelectAnomaly("storm")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    anomalyMode === "storm"
                      ? "bg-purple-950/80 text-purple-300 border border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                      : "bg-[#0f1726] text-purple-400/80 hover:text-purple-300 border border-purple-500/30"
                  }`}
                >
                  🟣 4. Solar Flare Storm
                </button>
              </div>
            </div>
          </div>

          {/* 4 Vitals Cards Grid (Real numbers or '—') */}
          <VitalsGrid
            heartRate={latestLiveMetrics?.hr}
            spo2={null}
            bodyTemp={null}
            bloodPressureSys={120}
            radiationLevel={latestLiveMetrics?.rad}
            systemStatus={currentSystemStatus}
          />

          {/* Middle Section: Live Telemetry Chart (8 cols) + Interactive Anatomy (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <TelemetryChart
                data={telemetryHistory}
                isConnected={connectionStatus === "live"}
                latencyMs={wsLatency}
              />
            </div>

            <div className="lg:col-span-4 bg-[#0b121f] border border-[#182337] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <InteractiveAnatomy
                heartRate={latestLiveMetrics?.hr ?? null}
                radiationLevel={latestLiveMetrics?.rad ?? null}
                co2Level={latestLiveMetrics?.co2 ?? null}
                sleepDebt={latestLiveMetrics?.sleep ?? null}
                systemStatus={currentSystemStatus}
                onOpenMedGuide={(hazardKey) => setActiveHazardGuide(hazardKey)}
              />
            </div>
          </div>

          {/* Bottom Section: AI Decision Support + Events Feed */}
          <ActionCenterCard
            actionCenter={apiStatusSummary?.action_center}
            systemStatus={currentSystemStatus}
            isNeedHelpCheckin={apiStatusSummary?.checkin?.last_status === "NEED_HELP"}
            aiEngineText={aiEngineStatus.engine}
            currentTimeUTC={currentTimeUTC}
            onOpenChat={() => setActivePanel("chat")}
            onOpenCheckIn={() => setIsCheckInModalOpen(true)}
            recentEvents={recentEvents}
            onOpenEvents={() => setActivePanel("search")}
          />
        </main>
      </div>

      {/* Slide-over Drawers */}
      {activePanel === "notes" && (
        <NotesPanel
          crewId={selectedAstronaut.id}
          crewName={selectedAstronaut.name}
          onClose={() => setActivePanel("none")}
        />
      )}

      {activePanel === "search" && (
        <SearchPanel
          crewId={selectedAstronaut.id}
          onClose={() => setActivePanel("none")}
        />
      )}

      {activePanel === "chat" && (
        <ChatPanel
          crewId={selectedAstronaut.id}
          onClose={() => setActivePanel("none")}
        />
      )}

      {activePanel === "sync" && (
        <SyncPanel
          crewId={selectedAstronaut.id}
          onClose={() => setActivePanel("none")}
        />
      )}

      {activePanel === "settings" && (
        <SettingsPanel
          crewId={selectedAstronaut.id}
          onClose={() => setActivePanel("none")}
        />
      )}

      {activePanel === "gamification" && (
        <GamificationPanel
          crewId={selectedAstronaut.id}
          onClose={() => setActivePanel("none")}
        />
      )}

      {/* NASA 5 Hazards Modal */}
      {(activePanel === "guide" || activeHazardGuide !== null) && (
        <MedicalGuideModal
          initialHazard={activeHazardGuide || "radiation"}
          onClose={() => {
            setActiveHazardGuide(null);
            if (activePanel === "guide") setActivePanel("none");
          }}
        />
      )}

      {/* Check-In Modal */}
      {isCheckInModalOpen && (
        <CheckInModal
          crewId={selectedAstronaut.id}
          onClose={() => setIsCheckInModalOpen(false)}
          onSuccess={() => loadInitialStatus()}
        />
      )}

      {/* Docker Deployment Modal */}
      {isDockerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b121f] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative font-sans">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold text-base font-mono">
                  🐳 1-Click Docker Deployment
                </span>
              </div>
              <button
                onClick={() => setIsDockerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 font-mono leading-relaxed">
              Deploy the entire ORBIT Offline Telemetry Stack (FastAPI Backend +
              NumPy Analysis + WebSocket Stream + Next.js Control Dashboard) on
              any spacecraft edge node or local hardware:
            </p>

            <div className="bg-[#060a12] border border-[#1b263b] rounded-xl p-3 flex items-center justify-between font-mono text-xs text-cyan-300 mb-4">
              <code className="truncate mr-2">docker compose up --build</code>
              <button
                onClick={copyDockerCmd}
                className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 shrink-0 transition-colors"
              >
                {copiedDocker ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-mono space-y-1">
              <p>• Offline-Edge ready (No internet connectivity required)</p>
              <p>• Local Ollama Llama3 AI integration enabled</p>
              <p>• WebSocket active on port 8000</p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsDockerModalOpen(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono bg-[#162033] hover:bg-[#1d2a42] text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
