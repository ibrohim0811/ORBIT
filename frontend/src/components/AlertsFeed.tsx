"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Bell, XCircle, AlertCircle } from "lucide-react";
import { fetchEvents } from "@/lib/api";

interface AlertsFeedProps {
  crewId?: string;
}

export default function AlertsFeed({ crewId = "CREW-1" }: AlertsFeedProps) {
  const [events, setEvents] = useState<{ kind: string; detail: string; at: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents(crewId, 20)
      .then((res) => {
        setEvents(res.events || []);
      })
      .catch(() => {
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, [crewId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card hud-corners p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          Mission Event Log (GET /events)
        </h3>
        <div className="flex items-center gap-1.5">
          <Bell className="w-3 h-3 text-cyan-400" />
          <span className="text-[9px] font-mono text-cyan-400">
            {events.length} EVENTS
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-6 text-center text-xs font-mono text-slate-500">
            Scanning event database...
          </div>
        ) : events.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center text-xs font-mono text-slate-500 flex flex-col items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-slate-600" />
            <span>Offline — No event records available</span>
          </div>
        ) : (
          <AnimatePresence>
            {events.map((ev, i) => {
              const isCrit = ev.kind.includes("CRITICAL") || ev.kind.includes("ESCALATION");
              const isWarn = ev.kind.includes("WARNING") || ev.kind.includes("LOS");

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    isCrit
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      : isWarn
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : "bg-white/[0.02] border-white/[0.05] text-slate-300"
                  }`}
                >
                  <div className="p-1 rounded bg-black/40 mt-0.5 shrink-0">
                    {isCrit ? (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold font-mono tracking-wide">
                        {ev.kind}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0">
                        {ev.at ? new Date(ev.at).toLocaleTimeString() : "Recent"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      {ev.detail}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
