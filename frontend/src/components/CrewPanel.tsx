"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Activity, AlertCircle } from "lucide-react";
import { fetchCrews } from "@/lib/api";

interface CrewMemberItem {
  id: string;
  name: string;
  role: string;
  status: "nominal" | "caution" | "alert";
}

interface CrewPanelProps {
  activeCrewId?: string;
  onSelectCrew?: (crewId: string) => void;
}

export default function CrewPanel({
  activeCrewId = "CREW-1",
  onSelectCrew,
}: CrewPanelProps) {
  const [crews, setCrews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrews()
      .then((res) => {
        if (res.crews && res.crews.length > 0) {
          setCrews(res.crews);
        } else {
          setCrews([]);
        }
      })
      .catch(() => {
        setCrews([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card hud-corners p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          Active Crew Register (GET /crews)
        </h3>
        <span className="text-[9px] font-mono text-cyan-400">
          {crews.length} REGISTERED
        </span>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs font-mono text-slate-500">
          Querying active crew nodes...
        </div>
      ) : crews.length === 0 ? (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center text-xs font-mono text-slate-500 flex flex-col items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-slate-600" />
          <span>Offline — No crew data available</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {crews.map((crewId, i) => {
            const isActive = crewId === activeCrewId;
            return (
              <motion.div
                key={crewId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
                onClick={() => onSelectCrew && onSelectCrew(crewId)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                    : "bg-white/[0.02] border-white/[0.04] hover:border-cyan-500/20 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-xs text-cyan-400">
                    {crewId.replace("CREW-", "C")}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{crewId}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Telemetry Node Online
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    ACTIVE
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
