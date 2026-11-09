"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: "cyan" | "green" | "red" | "orange" | "purple";
  trend?: "up" | "down" | "stable";
  subtitle?: string;
  delay?: number;
}

const colorMap = {
  cyan: {
    text: "text-neon-cyan",
    neon: "neon-text-cyan",
    border: "neon-border-cyan",
    bg: "bg-neon-cyan/5",
    iconBg: "bg-neon-cyan/10",
  },
  green: {
    text: "text-neon-green",
    neon: "neon-text-green",
    border: "neon-border-green",
    bg: "bg-neon-green/5",
    iconBg: "bg-neon-green/10",
  },
  red: {
    text: "text-neon-red",
    neon: "neon-text-red",
    border: "neon-border-red",
    bg: "bg-neon-red/5",
    iconBg: "bg-neon-red/10",
  },
  orange: {
    text: "text-neon-orange",
    neon: "neon-text-orange",
    border: "border-neon-orange/30",
    bg: "bg-neon-orange/5",
    iconBg: "bg-neon-orange/10",
  },
  purple: {
    text: "text-neon-purple",
    neon: "text-neon-purple",
    border: "border-neon-purple/30",
    bg: "bg-neon-purple/5",
    iconBg: "bg-neon-purple/10",
  },
};

const trendArrows = {
  up: "↑",
  down: "↓",
  stable: "→",
};

export default function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  trend,
  subtitle,
  delay = 0,
}: MetricCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className={`glass-card hud-corners p-5 ${c.border}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${c.iconBg}`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
        {trend && (
          <span className={`text-xs font-mono ${c.text}`}>
            {trendArrows[trend]}
          </span>
        )}
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">
        {title}
      </p>
      <div className="flex items-baseline gap-1.5">
        <motion.span
          key={String(value)}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-2xl font-bold font-mono ${c.neon}`}
        >
          {value}
        </motion.span>
        <span className="text-xs text-white/30 font-mono">{unit}</span>
      </div>
      {subtitle && (
        <p className="text-[10px] text-white/20 mt-1.5 font-mono">{subtitle}</p>
      )}
    </motion.div>
  );
}
