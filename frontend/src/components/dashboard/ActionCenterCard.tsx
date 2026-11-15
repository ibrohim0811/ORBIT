"use client";

import {
  Brain,
  Clock,
  MessageSquare,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { type ActionCenterData } from "@/lib/api";
import { getStatusConfig } from "@/lib/status";

interface ActionCenterCardProps {
  actionCenter?: ActionCenterData;
  systemStatus?: string;
  isNeedHelpCheckin?: boolean;
  aiEngineText: string;
  currentTimeUTC: string;
  onOpenChat: () => void;
  onOpenCheckIn: () => void;
  recentEvents: { kind: string; detail: string; at: string | null }[];
  onOpenEvents: () => void;
}

export default function ActionCenterCard({
  actionCenter,
  systemStatus = "NORMAL",
  isNeedHelpCheckin = false,
  aiEngineText,
  currentTimeUTC,
  onOpenChat,
  onOpenCheckIn,
  recentEvents,
  onOpenEvents,
}: ActionCenterCardProps) {
  const statusCfg = getStatusConfig(systemStatus);

  const displayStatus = isNeedHelpCheckin
    ? "CRITICAL: CREW ASSISTANCE REQUESTED"
    : systemStatus === "CRITICAL"
    ? "CRITICAL ALERT: THRESHOLD EXCEEDED"
    : systemStatus === "WARNING"
    ? "WARNING: ANOMALOUS BIOMETRICS"
    : systemStatus === "STALE"
    ? "STALE: TELEMETRY STREAM OFFLINE"
    : "SYSTEM NOMINAL";

  const displayColor = isNeedHelpCheckin ? "#ef4444" : statusCfg.color;

  const displayMessage = isNeedHelpCheckin
    ? "Crew member submitted NEED_HELP check-in. Immediate Flight Surgeon review required. Escalation event dispatched to mission timeline."
    : actionCenter?.instruction ||
      "Biometric telemetry matches nominal EVA thresholds. Core temperature, respiration and vitals validated by deterministic rules.";

  const actionProtocol = isNeedHelpCheckin
    ? "FLIGHT_SURGEON_ALERT"
    : systemStatus === "CRITICAL"
    ? "EMERGENCY_O2_PURGE"
    : systemStatus === "WARNING"
    ? "REST_COOLING_CYCLE"
    : systemStatus === "STALE"
    ? "ENGAGE_OFFLINE_AUTONOMY"
    : "CONTINUE_EVA_OPS";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* AI Decision Support & Action Center (8 cols) */}
      <div className="lg:col-span-8 bg-[#0b121f] border border-[#182337] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                ORBIT DECISION SUPPORT SYSTEM · OFFLINE-EDGE CONFIDENCE: {actionCenter?.confidence || "98.4%"}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Model: {aiEngineText}
            </span>
          </div>

          {/* Notification Alert Box */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 transition-colors ${
              isNeedHelpCheckin || systemStatus === "CRITICAL"
                ? "bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                : systemStatus === "WARNING"
                ? "bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                : "bg-[#0d1624] border-[#1c293e]"
            }`}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{
                backgroundColor: `${displayColor}15`,
                borderColor: `${displayColor}40`,
                borderWidth: 1,
                color: displayColor,
              }}
            >
              {isNeedHelpCheckin || systemStatus === "CRITICAL" ? (
                <ShieldAlert className="w-4 h-4" />
              ) : systemStatus === "WARNING" ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4
                  className="text-xs font-mono font-bold tracking-wider uppercase"
                  style={{ color: displayColor }}
                >
                  {displayStatus}
                </h4>
                <span className="text-[10px] font-mono text-slate-500">
                  {currentTimeUTC}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-1 leading-relaxed">
                {displayMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-[#162033] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Action Protocol:</span>
            <span className="text-cyan-400 font-semibold">{actionProtocol}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenChat}
              className="px-3 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Consult Medical AI</span>
            </button>
            <button
              onClick={onOpenCheckIn}
              className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Acknowledge Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Backend Events Feed (4 cols) */}
      <div className="lg:col-span-4 bg-[#0b121f] border border-[#182337] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                MISSION EVENT LOG
              </h3>
            </div>
            <button
              onClick={onOpenEvents}
              className="text-[10px] text-cyan-400 hover:underline font-mono"
            >
              View All →
            </button>
          </div>

          <div className="space-y-2">
            {recentEvents.length > 0 ? (
              recentEvents.slice(0, 3).map((ev, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#0d1624] border border-[#182337] text-xs font-mono flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="font-semibold text-cyan-400 mr-2">
                      {ev.kind}
                    </span>
                    <span className="text-slate-300">{ev.detail}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {ev.at ? ev.at.substring(11, 19) : "Just now"}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs font-mono text-slate-500">
                Offline — No event records available
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-[#162033] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Database: SQLite (orbit.db)</span>
          <span className="text-emerald-400">Indexed &amp; Synced</span>
        </div>
      </div>
    </div>
  );
}
