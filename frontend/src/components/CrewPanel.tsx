"use client";

import { motion } from "framer-motion";
import { User, Heart, Activity } from "lucide-react";

interface CrewMember {
  id: string;
  name: string;
  role: string;
  status: "nominal" | "caution" | "alert";
  heartRate: number;
  avatar?: string;
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
};

export default function CrewPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card hud-corners p-5"
    >
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">
        Crew Status
      </h3>
      <div className="space-y-3">
        {mockCrew.map((member, i) => (
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
                <span className={`status-dot ${statusStyles[member.status].dot}`} />
                <span className={`text-[9px] font-mono font-bold ${statusStyles[member.status].text}`}>
                  {statusStyles[member.status].label}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
