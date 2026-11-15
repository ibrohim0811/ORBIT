"use client";

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
import { Activity, Clock } from "lucide-react";

export interface TelemetryPoint {
  second: string;
  hr: number | null;
  spo2?: number | null;
}

interface TelemetryChartProps {
  data: TelemetryPoint[];
  isConnected: boolean;
  latencyMs: number;
}

export default function TelemetryChart({
  data,
  isConnected,
  latencyMs,
}: TelemetryChartProps) {
  const hasPoints = data.length > 0;

  return (
    <div className="bg-[#0b121f] border border-[#182337] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            LIVE CARDIO-RESPIRATORY TELEMETRY STREAM
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            WS 1 Hz
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span className="text-slate-400">Heart Rate (BPM)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 border-t-2 border-dashed border-cyan-400" />
            <span className="text-slate-400">SpO2 (When attached)</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock className="w-3 h-3" />
            <span>25s Sliding Window</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas or Awaiting State */}
      <div className="h-[260px] w-full relative">
        {!hasPoints ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-mono text-slate-500 space-y-2 bg-[#080d16]/60 rounded-xl border border-dashed border-[#1a283e]">
            <Activity className="w-6 h-6 text-cyan-500/40 animate-pulse" />
            <span>
              {isConnected
                ? "Awaiting live telemetry packets from FastAPI backend..."
                : "Offline / LOS — Waiting for telemetry stream connection"}
            </span>
            <span className="text-[10px] text-slate-600">
              Deterministic WebSocket feed: ws://localhost:8000/ws/telemetry
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#162033"
                vertical={false}
              />
              <XAxis
                dataKey="second"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                domain={[40, 180]}
                stroke="#f43f5e"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[70, 100]}
                stroke="#06b6d4"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                isAnimationActive={false}
                contentStyle={{
                  backgroundColor: "#070c14",
                  borderColor: "#1e293b",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
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
        )}
      </div>

      {/* Chart Footer Indicator */}
      <div className="mt-3 pt-2 border-t border-[#141e30] flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
          <span>Stream: {isConnected ? `Synchronized (${latencyMs}ms latency)` : "LOS / Edge Reconnecting"}</span>
        </div>
        <span>Buffer: 25 samples rolling window</span>
      </div>
    </div>
  );
}
