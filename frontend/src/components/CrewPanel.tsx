"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Heart } from "lucide-react";
import { fetchCrews } from "@/lib/api";

interface CrewMember {
  id: string;
  name: string;
  role: string;
  status: "nominal" | "caution" | "alert" | "stale";
  heartRate: number;
}

const mockCrew: CrewMember[] = [
  { id: "1", name: "Cmdr. Chen", role: "Commander", status: "nominal", heartRate: 72 },
  { id: "2", name: "Dr. Okafor", role: "Medical Officer", status: "nominal", heartRate: 68 },
  { id: "3", name: "Eng. Petrov", role: "Flight Engineer", status: "caution", heartRate: 95 },
  { id: "4", name: "Spc. Tanaka", role: "Mission Specialist", status: "nominal", heartRate: 74 },
];

const statusStyles = {
  nominal: { dot: "normal", text: "text-neon-green", label: "NOM" },
  caution: { dot: "warning", text: "text-neon-orange", label: "CAU" },
  alert: { dot: "critical", text: "text-neon-red", label: "ALT" },
  stale: { dot: "stale", text: "text-slate-400", label: "STL" },
};

export default function CrewPanel() {
  const [crewList, setCrewList] = useState<CrewMember[]>(mockCrew);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadCrews = async () => {
      try {
        const res = (await fetchCrews()) as { crews: string[]; crew_details?: any[] };
        if (!mounted) return;
        if (res.crew_details && res.crew_details.length > 0) {
          const mapped: CrewMember[] = res.crew_details.map((c) => {
            const rawStatus = (c.status || "NORMAL").toUpperCase();
            let st: "nominal" | "caution" | "alert" | "stale" = "nominal";
            if (rawStatus === "CRITICAL") st = "alert";
            else if (rawStatus === "WARNING") st = "caution";
            else if (rawStatus === "STALE") st = "stale";
            return {
              id: c.id,
              name: c.name || `Astronavt ${c.id}`,
              role: c.role || "Ekipaj a'zosi",
              status: st,
              heartRate: c.heartRate || c.heart_rate || 75,
            };
          });
          setCrewList(mapped);
          setIsOffline(false);
        } else if (res.crews && res.crews.length > 0) {
          setCrewList(
            res.crews.map((cid, idx) => ({
              id: cid,
              name: `Astronavt ${cid}`,
              role: idx === 0 ? "Commander" : "Specialist",
              status: "nominal",
              heartRate: 72 + idx * 3,
            }))
          );
          setIsOffline(false);
        }
      } catch {
        if (!mounted) return;
        setIsOffline(true);
      }
    };

    loadCrews();
    const timer = setInterval(loadCrews, 8000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
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
          Ekipaj Holati (/crews)
        </h3>
        {isOffline && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            offline/demo
          </span>
        )}
      </div>
      <div className="space-y-3">
        {crewList.map((member, i) => {
          const currentStyle = statusStyles[member.status] || statusStyles.nominal;
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-neon-cyan/20 transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.08] group-hover:border-neon-cyan/30 transition-colors">
                <User className="w-4 h-4 text-white/40 group-hover:text-neon-cyan/70 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">
                  {member.name}
                </p>
                <p className="text-[9px] text-white/30 font-mono">
                  {member.role}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-neon-red/60" />
                  <span className="text-[10px] font-mono text-white/50">
                    {member.heartRate}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`status-dot ${currentStyle.dot}`} />
                  <span className={`text-[9px] font-mono font-bold ${currentStyle.text}`}>
                    {currentStyle.label}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
