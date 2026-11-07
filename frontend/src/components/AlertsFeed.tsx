"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, Bell, XCircle } from "lucide-react";

interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  time: string;
  crewMember?: string;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    severity: "info",
    message: "Telemetry sync completed — 847 data points",
    time: "21:14:32",
  },
  {
    id: "2",
    severity: "warning",
    message: "Eng. Petrov — elevated heart rate detected (95 bpm)",
    time: "21:12:08",
    crewMember: "Petrov",
  },
  {
    id: "3",
    severity: "info",
    message: "Radiation levels nominal — 0.12 mSv/h",
    time: "21:10:45",
  },
  {
    id: "4",
    severity: "info",
    message: "All crew check-ins received for current cycle",
    time: "21:05:00",
  },
  {
    id: "5",
    severity: "warning",
    message: "CO₂ sensor recalibration recommended",
    time: "20:58:22",
  },
];

const severityConfig = {
  info: {
    icon: Info,
    borderColor: "border-neon-cyan/20",
    textColor: "text-neon-cyan",
    bgColor: "bg-neon-cyan/5",
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "border-neon-orange/20",
    textColor: "text-neon-orange",
    bgColor: "bg-neon-orange/5",
  },
  critical: {
    icon: XCircle,
    borderColor: "border-neon-red/20",
    textColor: "text-neon-red",
    bgColor: "bg-neon-red/5",
  },
};

export default function AlertsFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card hud-corners p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          Mission Log
        </h3>
        <div className="flex items-center gap-1.5">
          <Bell className="w-3 h-3 text-white/20" />
          <span className="text-[9px] font-mono text-white/20">
            {mockAlerts.length} EVENTS
          </span>
        </div>
      </div>
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        <AnimatePresence>
          {mockAlerts.map((alert, i) => {
            const config = severityConfig[alert.severity];
            const IconComp = config.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-start gap-3 p-3 rounded-lg border ${config.borderColor} ${config.bgColor} transition-all hover:bg-white/[0.03]`}
              >
                <IconComp className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${config.textColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {alert.message}
                  </p>
                  <p className="text-[9px] font-mono text-white/20 mt-1">
                    {alert.time} UTC
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
