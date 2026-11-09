"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Satellite, Wifi, WifiOff, Shield, Radio } from "lucide-react";

interface HeaderProps {
  connected: boolean;
  systemStatus: "NORMAL" | "WARNING" | "CRITICAL";
}

export default function Header({ connected, systemStatus }: HeaderProps) {
  const statusColor = {
    NORMAL: "neon-text-green",
    WARNING: "neon-text-orange",
    CRITICAL: "neon-text-red",
  }[systemStatus];

  const statusDot = {
    NORMAL: "normal",
    WARNING: "warning",
    CRITICAL: "critical",
  }[systemStatus];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card mx-4 mt-4 mb-2 px-6 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Satellite className="w-7 h-7 text-neon-cyan" />
        </motion.div>
        <div>
          <h1 className="text-xl font-bold tracking-wider neon-text-cyan">
            ORBIT
          </h1>
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">
            Mission Control • Health Monitoring
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs">
          <Radio className="w-3.5 h-3.5 text-white/40" />
          <span className="text-white/40 font-mono">LOS MODE</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`status-dot ${statusDot}`} />
          <span className={`font-mono font-bold ${statusColor}`}>
            {systemStatus}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {connected ? (
            <Wifi className="w-3.5 h-3.5 text-neon-green" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-neon-red animate-pulse-neon" />
          )}
          <span className={`font-mono ${connected ? "text-neon-green" : "text-neon-red"}`}>
            {connected ? "LINK" : "NO LINK"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Shield className="w-3.5 h-3.5 text-white/40" />
          <span className="text-white/40 font-mono">OFFLINE-EDGE</span>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono text-white/50" suppressHydrationWarning>
            {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}
          </div>
          <MissionClock />
        </div>
      </div>
    </motion.header>
  );
}

function MissionClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm font-mono neon-text-cyan tracking-wider" suppressHydrationWarning>
      <span>{time || "--:--:--"}</span>
    </div>
  );
}
