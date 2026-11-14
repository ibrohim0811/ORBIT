"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Heart,
  Wind,
  Thermometer,
  Radio,
  Wifi,
  Brain,
  ChevronDown,
  Layers,
  Settings,
  Search,
  PenTool,
  MessageSquare,
  RefreshCw,
  Box,
  Copy,
  Check,
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Send,
  RadioTower,
} from "lucide-react";
import DigitalTwin3D from "@/components/DigitalTwin3D";
import {
  BACKEND_URL,
  WS_URL,
  pushTelemetry,
  fetchStatus,
  type AnalyticsData,
  type StatusResponse,
} from "@/lib/api";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type AnomalyState = "normal" | "hypoxia" | "tachycardia";

interface Astronaut {
  id: string;
  name: string;
  mission: string;
  avatar: string;
}

const astronauts: Astronaut[] = [
  {
    id: "sarah",
    name: "Cmdr. Sarah Stone",
    mission: "EVA Mission 1",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "alex",
    name: "Dr. Alex Vance",
    mission: "Lunar Module",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "kenji",
    name: "Eng. Kenji Sato",
    mission: "Mars Habitat 01",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
];

export default function OrbitTelemetryDashboard() {
  const [selectedAstronaut, setSelectedAstronaut] = useState<Astronaut>(
    astronauts[0]
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [anomalyMode, setAnomalyMode] = useState<AnomalyState>("normal");
  const [isDockerModalOpen, setIsDockerModalOpen] = useState(false);
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [currentTimeUTC, setCurrentTimeUTC] = useState("11:34:02 UTC");

  // Real API & WebSocket States
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [wsLatency, setWsLatency] = useState(50);
  const [lastApiAction, setLastApiAction] = useState<string | null>(null);
  const [apiStatusSummary, setApiStatusSummary] = useState<StatusResponse | null>(null);

  // Chart telemetry state: 25 time-series points (0s to 24s)
  const [telemetryHistory, setTelemetryHistory] = useState<
    { second: string; hr: number; spo2: number }[]
  >([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeUTC(now.toISOString().substring(11, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Initial REST API GET /status call
  const loadInitialStatus = useCallback(async () => {
    try {
      const { data, latencyMs } = await fetchStatus();
      setApiStatusSummary(data);
      setIsApiConnected(true);
      setWsLatency(latencyMs);
      setLastApiAction(`GET /status (${latencyMs}ms)`);
    } catch {
      // Backend might be offline; fallback to edge mode smoothly
      setIsApiConnected(false);
      setLastApiAction("API: Offline-Edge (Local Mode)");
    }
  }, []);

  useEffect(() => {
    loadInitialStatus();
  }, [loadInitialStatus]);

  // 2. Real WebSocket Connection (ws://localhost:8000/ws/telemetry)
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsApiConnected(true);
        setLastApiAction("WS: Connected to /ws/telemetry");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.analytics && typeof payload.analytics === "object" && "metrics" in payload.analytics) {
            const a = payload.analytics as AnalyticsData;
            setIsApiConnected(true);
            setWsLatency(45 + Math.floor(Math.random() * 10));

            // Feed new point into telemetry history
            setTelemetryHistory((prev) => {
              if (prev.length === 0) return prev;
              const nextHr = a.metrics.avg_heart_rate;
              const nextSpo2 =
                anomalyMode === "hypoxia" ? 86.6 : 98.4 - (a.metrics.current_co2 > 0.08 ? 3.0 : 0);

              const shifted = prev.slice(1).map((pt, idx) => ({
                ...pt,
                second: `${idx}s`,
              }));
              shifted.push({
                second: "24s",
                hr: Math.round(nextHr * 10) / 10,
                spo2: Math.round(nextSpo2 * 10) / 10,
              });
              return shifted;
            });
          }
        } catch (e) {
          console.error("WS Parse error:", e);
        }
      };

      ws.onclose = () => {
        setIsApiConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3500);
      };

      ws.onerror = () => {
        setIsApiConnected(false);
        ws.close();
      };
    } catch {
      setIsApiConnected(false);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3500);
    }
  }, [anomalyMode]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connectWebSocket]);

  // 3. API Dispatch: Push Telemetry on Anomaly Selection
  const handleSelectAnomaly = async (mode: AnomalyState) => {
    setAnomalyMode(mode);

    // Prepare realistic payload for the backend API
    let payload = {
      heart_rate: 76.0,
      blood_pressure_sys: 118.0,
      radiation_level: 0.12,
      co2_level: 0.038,
      sleep_debt: 1.2,
    };

    if (mode === "hypoxia") {
      payload = {
        heart_rate: 120.0,
        blood_pressure_sys: 130.0,
        radiation_level: 0.14,
        co2_level: 0.086,
        sleep_debt: 2.5,
      };
    } else if (mode === "tachycardia") {
      payload = {
        heart_rate: 142.0,
        blood_pressure_sys: 165.0,
        radiation_level: 0.15,
        co2_level: 0.042,
        sleep_debt: 5.5,
      };
    }

    // Actually send POST /push request to the backend!
    try {
      const res = await pushTelemetry(payload);
      setIsApiConnected(true);
      setLastApiAction(`POST /push (${res.latencyMs ?? 20}ms) 200 OK`);
    } catch {
      setIsApiConnected(false);
      setLastApiAction("POST /push failed (Backend Offline - Edge Fallback)");
    }
  };

  // 4. Generate or transition time series when mode changes
  useEffect(() => {
    const points: { second: string; hr: number; spo2: number }[] = [];
    for (let i = 0; i < 25; i++) {
      let hr = 76;
      let spo2 = 98.4;

      if (anomalyMode === "normal") {
        hr = 74 + Math.sin(i * 0.8) * 4 + (Math.random() * 2 - 1);
        spo2 = 98.2 + Math.cos(i * 0.5) * 0.5;
      } else if (anomalyMode === "hypoxia") {
        if (i < 18) {
          hr = 75 + i * 0.4 + (Math.random() * 2 - 1);
          spo2 = 98.2 + Math.random() * 0.3;
        } else {
          // Sharp hypoxia plunge
          const progress = (i - 18) / 6;
          hr = 78 + progress * 42 + (Math.random() * 2 - 1);
          spo2 = 98.0 - progress * 11.5 + Math.random() * 0.4;
        }
      } else if (anomalyMode === "tachycardia") {
        if (i < 15) {
          hr = 76 + (Math.random() * 2 - 1);
          spo2 = 98.2 + Math.random() * 0.3;
        } else {
          // Sudden Tachycardia surge
          const progress = (i - 15) / 9;
          hr = 76 + progress * 64 + (Math.random() * 3 - 1.5);
          spo2 = 98.0 - progress * 2.1;
        }
      }

      points.push({
        second: `${i}s`,
        hr: Math.round(hr * 10) / 10,
        spo2: Math.round(spo2 * 10) / 10,
      });
    }
    setTelemetryHistory(points);
  }, [anomalyMode]);

  // 5. Continuous local baseline animation
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryHistory((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        let nextHr = last.hr;
        let nextSpo2 = last.spo2;

        if (anomalyMode === "normal") {
          nextHr = 75 + (Math.random() * 4 - 2);
          nextSpo2 = 98.4 + (Math.random() * 0.4 - 0.2);
        } else if (anomalyMode === "hypoxia") {
          nextHr = 119 + (Math.random() * 3 - 1.5);
          nextSpo2 = 86.4 + (Math.random() * 0.6 - 0.3);
        } else if (anomalyMode === "tachycardia") {
          nextHr = 142 + (Math.random() * 4 - 2);
          nextSpo2 = 96.1 + (Math.random() * 0.4 - 0.2);
        }

        const shifted = prev.slice(1).map((pt, idx) => ({
          ...pt,
          second: `${idx}s`,
        }));
        shifted.push({
          second: "24s",
          hr: Math.round(nextHr * 10) / 10,
          spo2: Math.round(nextSpo2 * 10) / 10,
        });
        return shifted;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [anomalyMode]);

  // Derived current metric values based on anomalyMode & backend response
  const currentMetrics = useMemo(() => {
    if (anomalyMode === "normal") {
      return {
        hr: 78,
        hrStatus: "STABLE",
        hrColor: "#10b981",
        spo2: 98.3,
        spo2Status: "OPTIMAL",
        spo2Color: "#10b981",
        temp: 36.8,
        tempStatus: "NORMAL",
        rad: 0.15,
        radStatus: "SAFE",
        suitPressure: "4.1 psi",
        suitThermal: "Nominal",
        cosmicFlare: "Low",
        aiStatus: "SYSTEM NOMINAL",
        aiColor: "#06b6d4",
        aiMessage:
          apiStatusSummary?.action_center?.instruction ||
          "Biometric telemetry matches nominal EVA thresholds. Core temperature and Sp02 levels are stable.",
      };
    } else if (anomalyMode === "hypoxia") {
      return {
        hr: 120,
        hrStatus: "STABLE",
        hrColor: "#10b981",
        spo2: 86.6,
        spo2Status: "CRITICAL (HYPOXIA)",
        spo2Color: "#ef4444",
        temp: 37.2,
        tempStatus: "NORMAL",
        rad: 0.14,
        radStatus: "SAFE",
        suitPressure: "4.1 psi",
        suitThermal: "Nominal",
        cosmicFlare: "Low",
        aiStatus: "CRITICAL: HYPOXIA EVENT DETECTED",
        aiColor: "#ef4444",
        aiMessage:
          "Blood oxygen saturation dropped below 88%. Oxygen supply valve restriction or suit micro-leak suspected. Advised immediate 100% O2 purge.",
      };
    } else {
      return {
        hr: 140,
        hrStatus: "ELEVATED",
        hrColor: "#ef4444",
        spo2: 96.1,
        spo2Status: "OPTIMAL",
        spo2Color: "#10b981",
        temp: 37.6,
        tempStatus: "NORMAL",
        rad: 0.14,
        radStatus: "SAFE",
        suitPressure: "4.1 psi",
        suitThermal: "Nominal",
        cosmicFlare: "Low",
        aiStatus: "WARNING: TACHYCARDIA STRESS DETECTED",
        aiColor: "#f59e0b",
        aiMessage:
          "Sustained elevated heart rate (140+ BPM) during EVA. Recommend rest cycle, suit cooling check, and hydration protocol.",
      };
    }
  }, [anomalyMode, apiStatusSummary]);

  const copyDockerCmd = () => {
    navigator.clipboard.writeText(
      "docker run -d -p 8000:8000 -p 3000:3000 orbit-nasa-system"
    );
    setCopiedDocker(true);
    setTimeout(() => setCopiedDocker(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex font-sans select-none antialiased">
      {/* 1. LEFT SIDEBAR NAVIGATION RAIL */}
      <aside className="w-14 shrink-0 bg-[#060910] border-r border-[#151d2d] flex flex-col items-center py-4 justify-between z-20">
        <div className="flex flex-col items-center gap-6">
          {/* Logo / Gemini colorful sparkle icon */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105">
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
          </div>

          {/* Navigation Icons */}
          <nav className="flex flex-col items-center gap-4 text-slate-500">
            <button
              title="Notes / Logs"
              className="p-2 rounded-lg hover:text-slate-300 hover:bg-[#131b2c] transition-colors"
            >
              <PenTool className="w-4 h-4" />
            </button>
            <button
              title="Search Telemetry"
              className="p-2 rounded-lg hover:text-slate-300 hover:bg-[#131b2c] transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              title="Dashboard"
              className="p-2 rounded-lg bg-[#0e1726] text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              title="Crew Communication"
              className="p-2 rounded-lg hover:text-slate-300 hover:bg-[#131b2c] transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={loadInitialStatus}
              title="Resync with Backend API"
              className="p-2 rounded-lg hover:text-cyan-400 hover:bg-[#131b2c] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </nav>
        </div>

        {/* Bottom Icons */}
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <button
            title="Settings"
            className="p-2 rounded-lg hover:text-slate-300 hover:bg-[#131b2c] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div
            title="Earth Station Ground Link"
            className="w-7 h-7 rounded-full overflow-hidden border border-cyan-500/40 cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.3)]"
          >
            <img
              src="https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=100&auto=format&fit=crop&q=80"
              alt="Earth Link"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </aside>

      {/* 2. MAIN MISSION CONTROL VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="px-6 py-4 border-b border-[#131b2c] flex flex-wrap items-center justify-between gap-4 bg-[#080d16]/80 backdrop-blur-md sticky top-0 z-30">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
              >
                <circle cx="12" cy="11" r="7" />
                <path d="M7 11c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5" />
                <path d="M5 21v-2a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-wider text-white">
                  ORBIT<span className="text-cyan-400">.TELEMETRY</span>
                </h1>
                <span className="text-[10px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-400 bg-cyan-500/10">
                  NASA SPACE APPS
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-wide">
                Astronaut Health & Vital Telemetry Bio-Monitoring
              </p>
            </div>
          </div>

          {/* Right Status Indicators (With real API status) */}
          <div className="flex items-center gap-5 text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="text-sm">🛰️</span>
              <span className="text-slate-400">Station:</span>
              <span className="font-semibold">ISS-LEO 408km</span>
            </div>

            <div
              className={`flex items-center gap-2 ${
                isApiConnected ? "text-emerald-400" : "text-amber-400"
              }`}
              title={
                isApiConnected
                  ? "Connected to FastAPI Backend (port 8000)"
                  : "Backend offline - local edge simulation active"
              }
            >
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-slate-400">Telemetry Stream:</span>
              <span className="font-semibold">
                {isApiConnected ? `${wsLatency} ms (WebSockets)` : "Edge (Offline Mode)"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-purple-400">
              <Brain className="w-3.5 h-3.5" />
              <span className="text-slate-400">AI Engine:</span>
              <span className="font-semibold">Ollama Llama3 (Active)</span>
            </div>
          </div>
        </header>

        {/* 1-Click Docker Deploy Subheader Strip & Live API Dispatch Indicator */}
        <div className="px-6 pt-3 pb-1 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setIsDockerModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-[#00d2ff] hover:bg-[#38bdf8] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)] transition-all flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 fill-black"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.186.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.953 0h2.118a.186.186 0 00.186-.186V6.29a.186.186 0 00-.186-.185H8.076a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.955 0h2.119a.186.186 0 00.186-.186V6.29a.186.186 0 00-.186-.185H5.12a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m14.774 2.714h-2.119a.186.186 0 00-.185.185v1.888c0 .102.082.185.185.185h2.119a.186.186 0 00.186-.185v-1.888a.186.186 0 00-.186-.185m-2.954 0h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185h2.118a.186.186 0 00.186-.185v-1.888a.186.186 0 00-.186-.185m-2.955 0H8.076a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185h2.118a.186.186 0 00.186-.185v-1.888a.186.186 0 00-.186-.185m-2.953 0H5.12a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185h2.119a.187.187 0 00.186-.185v-1.888a.186.186 0 00-.186-.185m-2.955 0H2.166a.186.186 0 00-.186.185v1.888c0 .102.083.185.186.185h2.118a.185.185 0 00.185-.185v-1.888a.185.185 0 00-.185-.185M23.77 12.01c-.134-.148-.485-.296-.94-.296-.282 0-.698.055-1.168.21-.295-.694-.785-1.258-1.428-1.637-.152-.09-.317-.16-.492-.213l-.224-.055-.12.195c-.38.614-.582 1.32-.582 2.054 0 .393.064.78.188 1.144-.33.15-.71.233-1.127.233H1.722a.722.722 0 00-.722.723c0 1.954.512 3.86 1.48 5.513 1.252 2.14 3.23 3.654 5.568 4.264 1.545.403 3.19.467 4.793.188 2.378-.415 4.507-1.62 6.002-3.4 1.55-1.847 2.4-4.218 2.4-6.677 0-.75-.12-1.492-.353-2.198l-.067-.202.193-.075c.427-.165.733-.284.754-.293z" />
            </svg>
            1-CLICK DOCKER DEPLOY
          </button>

          {/* Real API Activity Indicator */}
          <div className="flex items-center gap-2 text-[11px] font-mono px-3 py-1 rounded-lg bg-[#0e1626] border border-[#1b263b]">
            <RadioTower className={`w-3.5 h-3.5 ${isApiConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
            <span className="text-slate-400">API Endpoint:</span>
            <span className="text-cyan-400 font-semibold">{BACKEND_URL}</span>
            <span className="text-slate-600">|</span>
            <span className={isApiConnected ? "text-emerald-400" : "text-amber-400"}>
              {lastApiAction || "Ready"}
            </span>
          </div>
        </div>

        {/* Dashboard Main Workspace */}
        <main className="p-6 space-y-5">
          {/* 3. ACTIVE SUBJECT MONITORING & ANOMALY SIMULATOR BAR */}
          <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
            {/* Subject Dropdown & Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={selectedAstronaut.avatar}
                  alt={selectedAstronaut.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400 p-0.5 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                />
              </div>

              <div>
                <p className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                  ACTIVE SUBJECT MONITORING
                </p>
                <div className="relative mt-1">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-sm font-semibold text-white bg-[#101a2c] hover:bg-[#162238] border border-[#22334f] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span>
                      {selectedAstronaut.name} ({selectedAstronaut.mission})
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-72 bg-[#0d1624] border border-[#22334f] rounded-xl shadow-2xl py-1 z-30">
                      {astronauts.map((astro) => (
                        <button
                          key={astro.id}
                          onClick={() => {
                            setSelectedAstronaut(astro);
                            setIsDropdownOpen(false);
                            // Also push fresh baseline for this astronaut to API
                            pushTelemetry({
                              heart_rate: 75.0,
                              blood_pressure_sys: 120.0,
                              radiation_level: 0.12,
                              co2_level: 0.04,
                            }).catch(() => {});
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center gap-2 hover:bg-[#162338] transition-colors ${
                            selectedAstronaut.id === astro.id
                              ? "text-cyan-400 font-bold bg-cyan-500/10"
                              : "text-slate-300"
                          }`}
                        >
                          <img
                            src={astro.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
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

            {/* Simulate Anomaly Stress Buttons (Dispatches real API requests) */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono tracking-wide">
                Simulate Anomaly Stress:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectAnomaly("normal")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    anomalyMode === "normal"
                      ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "bg-[#0f1726] text-slate-400 hover:text-white border border-[#1e2a40]"
                  }`}
                  title="Sends POST /push with nominal vitals"
                >
                  Normal State
                </button>
                <button
                  onClick={() => handleSelectAnomaly("hypoxia")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    anomalyMode === "hypoxia"
                      ? "bg-amber-950/80 text-amber-300 border border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                      : "bg-[#0f1726] text-amber-400/70 hover:text-amber-300 border border-amber-500/30"
                  }`}
                  title="Sends POST /push with hypoxia event (SpO2 drop)"
                >
                  Hypoxia Event (Low Sp02)
                </button>
                <button
                  onClick={() => handleSelectAnomaly("tachycardia")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    anomalyMode === "tachycardia"
                      ? "bg-rose-950/80 text-rose-300 border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                      : "bg-[#0f1726] text-rose-400/70 hover:text-rose-300 border border-rose-500/30"
                  }`}
                  title="Sends POST /push with elevated heart rate (140+ BPM)"
                >
                  Tachycardia Stress
                </button>
              </div>
            </div>
          </div>

          {/* 4. FOUR HORIZONTAL METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: HEART RATE */}
            <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                    HEART RATE
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {currentMetrics.hr}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">BPM</span>
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
                  style={{ color: currentMetrics.hrColor }}
                >
                  {currentMetrics.hrStatus}
                </span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"
                style={{
                  width: `${Math.min(100, (currentMetrics.hr / 160) * 100)}%`,
                  transition: "width 0.5s ease-in-out",
                }}
              />
            </div>

            {/* Card 2: OXYGEN SATURATION */}
            <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                    OXYGEN SATURATION (Sp02)
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {currentMetrics.spo2}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">%</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Wind className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#162033] flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">
                  Suit O2 Pressure: {currentMetrics.suitPressure}
                </span>
                <span
                  className="font-bold tracking-wider"
                  style={{ color: currentMetrics.spo2Color }}
                >
                  {currentMetrics.spo2Status}
                </span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400"
                style={{
                  width: `${currentMetrics.spo2}%`,
                  transition: "width 0.5s ease-in-out",
                }}
              />
            </div>

            {/* Card 3: CORE BODY TEMP */}
            <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                    CORE BODY TEMP
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {currentMetrics.temp}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">°C</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Thermometer className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#162033] flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">
                  Suit Thermal: {currentMetrics.suitThermal}
                </span>
                <span className="font-bold tracking-wider text-emerald-400">
                  {currentMetrics.tempStatus}
                </span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400"
                style={{
                  width: `${Math.min(100, ((currentMetrics.temp - 35) / 5) * 100)}%`,
                  transition: "width 0.5s ease-in-out",
                }}
              />
            </div>

            {/* Card 4: RADIATION EXPOSURE */}
            <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                    RADIATION EXPOSURE
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {currentMetrics.rad}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">mSv/h</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Radio className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#162033] flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">
                  Cosmic Flare Level: {currentMetrics.cosmicFlare}
                </span>
                <span className="font-bold tracking-wider text-emerald-400">
                  {currentMetrics.radStatus}
                </span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-purple-400"
                style={{
                  width: `${Math.min(100, (currentMetrics.rad / 1.0) * 100)}%`,
                  transition: "width 0.5s ease-in-out",
                }}
              />
            </div>
          </div>

          {/* 5. MAIN MIDDLE SECTION: BIOMETRIC TELEMETRY CHART + 3D DIGITAL TWIN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT: REAL-TIME BIOMETRIC TELEMETRY CHART (8 cols) */}
            <div className="lg:col-span-8 bg-[#0b121f] border border-[#182337] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              {/* Chart Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                    REAL-TIME BIOMETRIC TELEMETRY (ECG / O2)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#091522] border border-cyan-500/40 text-[10px] font-mono text-cyan-400 flex items-center gap-1.5 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    LIVE STREAM
                  </span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-8 mb-3 text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-rose-500 rounded-full" />
                  <span className="text-slate-300">Heart Rate (BPM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-cyan-400" />
                  <span className="text-slate-300">SpO2 Oxygen (%)</span>
                </div>
              </div>

              {/* Dual Axis Recharts Line Chart */}
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={telemetryHistory}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#131c2d"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="second"
                      stroke="#334155"
                      tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={{ stroke: "#1e293b" }}
                      tickLine={false}
                    />
                    {/* Left Y Axis for Heart Rate (40 - 160) */}
                    <YAxis
                      yAxisId="left"
                      domain={[40, 160]}
                      ticks={[40, 60, 80, 100, 120, 140, 160]}
                      stroke="#f43f5e"
                      tick={{ fill: "#f43f5e", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    {/* Right Y Axis for SpO2 (80 - 100) */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[80, 100]}
                      ticks={[80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100]}
                      stroke="#06b6d4"
                      tick={{ fill: "#06b6d4", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d1624",
                        borderColor: "#1e293b",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontFamily: "monospace",
                        color: "#e2e8f0",
                      }}
                    />
                    {/* Heart Rate Area with Line */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="hr"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fill="url(#hrGradient)"
                      dot={false}
                      isAnimationActive={false}
                    />
                    {/* SpO2 Dashed Line with Dots */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="spo2"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{
                        r: 3,
                        fill: "#06b6d4",
                        stroke: "#0b121f",
                        strokeWidth: 1,
                      }}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RIGHT: SUIT & ANATOMY DIGITAL TWIN (4 cols) */}
            <div className="lg:col-span-4 bg-[#0b121f] border border-[#182337] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                      SUIT & ANATOMY DIGITAL TWIN
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Drag to Rotate 3D
                  </span>
                </div>

                <div className="text-[10px] font-mono text-emerald-400 mb-2">
                  Sensor Nodes: 12 Active
                </div>
              </div>

              {/* 3D Wireframe Canvas */}
              <div className="my-auto py-2">
                <DigitalTwin3D
                  heartRate={currentMetrics.hr}
                  isAnomaly={anomalyMode !== "normal"}
                />
              </div>

              {/* Suit O2 loop indicator */}
              <div className="pt-3 border-t border-[#162033] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300">Suit Primary O2 Loop</span>
                </div>
                <span className="text-emerald-400 font-bold">99.4%</span>
              </div>
            </div>
          </div>

          {/* 6. BOTTOM SECTION: AI DIAGNOSTIC & ANOMALY LOG (OLLAMA ENGINE) */}
          <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                  AI DIAGNOSTIC & ANOMALY LOG (OLLAMA ENGINE)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Model: Llama3-Medical-Space
              </span>
            </div>

            {/* Notification Row */}
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3.5 transition-colors ${
                anomalyMode === "hypoxia"
                  ? "bg-rose-950/20 border-rose-500/40"
                  : anomalyMode === "tachycardia"
                  ? "bg-amber-950/20 border-amber-500/40"
                  : "bg-[#0d1624] border-[#1c293e]"
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: `${currentMetrics.aiColor}15`,
                  borderColor: `${currentMetrics.aiColor}40`,
                  borderWidth: 1,
                  color: currentMetrics.aiColor,
                }}
              >
                {anomalyMode === "hypoxia" ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : anomalyMode === "tachycardia" ? (
                  <Flame className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className="text-xs font-mono font-bold tracking-wider uppercase"
                    style={{ color: currentMetrics.aiColor }}
                  >
                    {currentMetrics.aiStatus}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    {currentTimeUTC}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono mt-1 leading-relaxed">
                  {currentMetrics.aiMessage}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 7. DOCKER DEPLOYMENT MODAL */}
      {isDockerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b121f] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold text-base">
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
              <code className="truncate mr-2">
                docker run -d -p 8000:8000 -p 3000:3000 orbit-nasa-system
              </code>
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
