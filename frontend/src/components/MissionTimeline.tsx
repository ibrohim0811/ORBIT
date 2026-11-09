"use client";

import { motion } from "framer-motion";
import { Rocket, Flag, Clock } from "lucide-react";

interface Phase {
  name: string;
  progress: number;
  status: "completed" | "active" | "upcoming";
}

const phases: Phase[] = [
  { name: "Launch", progress: 100, status: "completed" },
  { name: "Transit", progress: 100, status: "completed" },
  { name: "Orbit Ops", progress: 65, status: "active" },
  { name: "EVA", progress: 0, status: "upcoming" },
  { name: "Return", progress: 0, status: "upcoming" },
];

export default function MissionTimeline() {
  const overallProgress = Math.round(
    phases.reduce((acc, p) => acc + p.progress, 0) / phases.length
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card hud-corners p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          Mission Timeline — Demo Alpha
        </h3>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-white/20" />
          <span className="text-[10px] font-mono text-white/30">
            Day 18 / 30
          </span>
          <span className="text-[10px] font-mono neon-text-cyan">
            {overallProgress}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mb-4">
        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #00f0ff, #39ff14)",
              boxShadow: "0 0 10px rgba(0,240,255,0.4)",
            }}
          />
        </div>
        {/* Rocket indicator */}
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${overallProgress}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute -top-2 -translate-x-1/2"
        >
          <Rocket className="w-4 h-4 text-neon-cyan rotate-90" style={{ filter: "drop-shadow(0 0 4px rgba(0,240,255,0.6))" }} />
        </motion.div>
      </div>

      {/* Phase markers */}
      <div className="flex justify-between">
        {phases.map((phase, i) => (
          <div key={phase.name} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                phase.status === "completed"
                  ? "bg-neon-green"
                  : phase.status === "active"
                  ? "bg-neon-cyan animate-pulse-neon"
                  : "bg-white/10"
              }`}
              style={
                phase.status === "completed"
                  ? { boxShadow: "0 0 6px rgba(57,255,20,0.5)" }
                  : phase.status === "active"
                  ? { boxShadow: "0 0 6px rgba(0,240,255,0.5)" }
                  : {}
              }
            />
            <span
              className={`text-[8px] font-mono uppercase tracking-wider ${
                phase.status === "active"
                  ? "text-neon-cyan"
                  : phase.status === "completed"
                  ? "text-white/40"
                  : "text-white/15"
              }`}
            >
              {phase.name}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
