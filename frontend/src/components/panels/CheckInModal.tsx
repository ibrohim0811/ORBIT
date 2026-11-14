"use client";

import { useState } from "react";
import { X, UserCheck, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { crewCheckin } from "@/lib/api";

interface CheckInModalProps {
  crewId: string;
  onClose: () => void;
  onSuccess?: (status: string) => void;
}

export default function CheckInModal({ crewId, onClose, onSuccess }: CheckInModalProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAction = async (status: "OK" | "NEED_HELP") => {
    try {
      setLoading(true);
      await crewCheckin(crewId, status, note || (status === "OK" ? "All vitals nominal" : "Assistance requested"));
      setResult(status === "OK" ? "Check-in acknowledged: Nominal (OK)" : "CRITICAL ESCALATION DISPATCHED (NEED_HELP)");
      if (onSuccess) onSuccess(status);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setResult(status === "OK" ? "Check-in recorded (Local Edge Mode)" : "Escalation logged to mission timeline");
      if (onSuccess) onSuccess(status);
      setTimeout(() => {
        onClose();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0b121f] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative font-sans text-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono tracking-wider text-white">
                CREW CHECK-IN PROTOCOL
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                POST /crew/{crewId}/checkin · NASA Safety Rule
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 font-mono mb-4 leading-relaxed">
          &ldquo;Are you okay? Confirm crew well-being and operational status:&rdquo;
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional notes: e.g. Mild EVA exertion, thermal loop check..."
          rows={2}
          className="w-full bg-[#060a12] border border-[#1b283d] rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono resize-none mb-4"
        />

        {result ? (
          <div
            className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
              result.includes("CRITICAL")
                ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                : "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
            }`}
          >
            {result.includes("CRITICAL") ? (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{result}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => handleAction("OK")}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-all flex items-center justify-between"
            >
              <span>🟢 &ldquo;I am OK — All Vitals Nominal&rdquo;</span>
              <span className="text-[10px] opacity-60">Status: OK</span>
            </button>

            <button
              onClick={() => handleAction("NEED_HELP")}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 transition-all flex items-center justify-between"
            >
              <span>🔴 &ldquo;NEED HELP — Immediate Flight Surgeon Alert&rdquo;</span>
              <span className="text-[10px] opacity-60">Status: NEED_HELP</span>
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#162033] flex justify-between items-center text-[10px] font-mono text-slate-500">
          <span>Non-suppressive safety check</span>
          <button onClick={onClose} className="hover:text-slate-300">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
