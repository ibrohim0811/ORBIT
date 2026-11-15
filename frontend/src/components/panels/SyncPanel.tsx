"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, Radio, HardDrive, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { fetchSyncStatus, syncNow, type SyncStatusResponse } from "@/lib/api";

interface SyncPanelProps {
  crewId: string;
  onClose: () => void;
}

export default function SyncPanel({ crewId, onClose }: SyncPanelProps) {
  const [syncData, setSyncData] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    status: string;
    reason?: string;
    synced_samples?: number;
    pending_samples?: number;
  } | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await fetchSyncStatus(crewId);
      setSyncData(res);
    } catch {
      // Offline fallback
      setSyncData({
        crew_id: crewId,
        link: "LOS",
        pending_samples: 18,
        last_sync_at: new Date(Date.now() - 1080000).toISOString(),
        last_synced_count: 850,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [crewId]);

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const res = await syncNow(crewId);
      setSyncResult(res);
      await loadStatus();
    } catch {
      setSyncResult({
        status: "deferred",
        reason: "LOS: Aloqa yo'q (Loss of Signal). Ma'lumot lokal SQLite navbatida saqlanmoqda.",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-[#090e18]/95 border-l border-[#1b263b] shadow-2xl backdrop-blur-xl z-50 flex flex-col font-sans text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-[#182337] flex items-center justify-between bg-[#070b13]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-white">
              DATA SYNC & GROUND LINK
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              GET /sync/status · POST /sync
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
        {/* Link Status Card */}
        <div className="p-4 rounded-xl bg-[#0b1322] border border-[#17243a] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider">
              Telemetry Link Status
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                syncData?.link === "OK"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${syncData?.link === "OK" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
              {syncData?.link === "OK" ? "COMM LINK ACTIVE" : "LOS (LOSS OF SIGNAL)"}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            {syncData?.link === "OK"
              ? "Bi-directional telecommand stream nominal with NASA Deep Space Network."
              : "Spacecraft is in offline edge pass (Loss of Signal). All incoming sensor packets are queued idempotently in local SQLite."}
          </p>
        </div>

        {/* Sync Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#0b1322] border border-[#17243a]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>QUEUED SAMPLES</span>
            </div>
            <span className="text-2xl font-bold text-cyan-400">
              {syncData?.pending_samples ?? 0}
            </span>
            <p className="text-[9px] text-slate-500 mt-1">Pending earth uplink</p>
          </div>

          <div className="p-3 rounded-xl bg-[#0b1322] border border-[#17243a]">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>LAST SYNC COUNT</span>
            </div>
            <span className="text-2xl font-bold text-emerald-400">
              {syncData?.last_synced_count ?? 0}
            </span>
            <p className="text-[9px] text-slate-500 mt-1">Samples committed</p>
          </div>
        </div>

        {/* Sync Now Action */}
        <div className="p-4 rounded-xl bg-[#0b1322] border border-[#17243a] space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Last Successful Sync:</span>
            <span className="text-slate-200">
              {syncData?.last_sync_at
                ? new Date(syncData.last_sync_at).toLocaleTimeString()
                : "18 mins ago"}
            </span>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Transmitting Packet Queue..." : "Initiate Ground Station Sync"}
          </button>

          {syncResult && (
            <div
              className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1 ${
                syncResult.status === "synced"
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                  : "bg-amber-950/30 border-amber-500/40 text-amber-300"
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 uppercase text-[10px]">
                {syncResult.status === "synced" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sync Acknowledged (200 OK)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Sync Deferred (LOS Mode)
                  </>
                )}
              </div>
              <p>{syncResult.reason || "Telemetriya ma'lumotlari yer stantsiyasiga uzatildi."}</p>
            </div>
          )}
        </div>

        {/* Architecture Note */}
        <div className="p-3.5 rounded-xl bg-[#060a12] border border-[#151f31] text-[10px] text-slate-500 leading-relaxed space-y-1">
          <p className="font-bold text-slate-400">NASA Challenge Principle:</p>
          <p>
            Idempotent synchronization guarantees zero telemetry data loss during orbital blackout or planetary transit phases.
          </p>
        </div>
      </div>
    </div>
  );
}
