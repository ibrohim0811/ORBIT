"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Bell, XCircle } from "lucide-react";
import { fetchEvents } from "@/lib/api";

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
    message: "Telemetriya sinxronizatsiyasi yakunlandi — 847 ma'lumot punkti",
    time: "21:14:32",
  },
  {
    id: "2",
    severity: "warning",
    message: "Ekipajda yurak urishi tezlashishi qayd etildi (95 bpm)",
    time: "21:12:08",
    crewMember: "CREW-1",
  },
  {
    id: "3",
    severity: "info",
    message: "Radiatsiya foni xavfsiz darajada — 0.12 mSv/h",
    time: "21:10:45",
  },
  {
    id: "4",
    severity: "info",
    message: "Barcha ekipaj a'zolarining check-in hisoboti qabul qilindi",
    time: "21:05:00",
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
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadEvents = async () => {
      try {
        const res = await fetchEvents("CREW-1", 15);
        if (!mounted) return;
        if (res.events && res.events.length > 0) {
          const mapped: Alert[] = res.events.map((ev, idx) => {
            const kind = ev.kind || (ev as any).type || "EVENT";
            let sev: "info" | "warning" | "critical" = "info";
            if (kind.includes("CRITICAL") || kind.includes("ESCALATION")) sev = "critical";
            else if (kind.includes("WARNING") || kind.includes("LOS")) sev = "warning";
            const timeStr = ev.at ? ev.at.split("T")[1]?.slice(0, 8) || "Hozir" : "Hozir";
            return {
              id: `${idx}-${kind}`,
              severity: sev,
              message: `[${kind}] ${ev.detail}`,
              time: timeStr,
              crewMember: "CREW-1",
            };
          });
          setAlerts(mapped);
          setIsOffline(false);
        }
      } catch {
        if (!mounted) return;
        setIsOffline(true);
      }
    };

    loadEvents();
    const interval = setInterval(loadEvents, 6000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card hud-corners p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          Missiya Tarixi (/events)
        </h3>
        <div className="flex items-center gap-2">
          {isOffline && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              offline/demo
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <Bell className="w-3 h-3 text-white/20" />
            <span className="text-[9px] font-mono text-white/20">
              {alerts.length} HODISA
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        <AnimatePresence>
          {alerts.map((alert, i) => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const IconComp = config.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-3 p-3 rounded-lg border ${config.borderColor} ${config.bgColor} transition-all hover:bg-white/[0.03]`}
              >
                <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${config.textColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 leading-relaxed break-words font-mono">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-white/30 font-mono">
                      {alert.time}
                    </span>
                    {alert.crewMember && (
                      <span className="text-[9px] text-white/20 font-mono">
                        • {alert.crewMember}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
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
