"use client";

import { motion } from "framer-motion";

interface SystemGaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  size?: number;
}

export default function SystemGauge({
  value,
  max,
  label,
  unit,
  color,
  size = 120,
}: SystemGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Value arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={value}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-lg font-bold font-mono"
            style={{ color, textShadow: `0 0 10px ${color}40` }}
          >
            {typeof value === "number" ? value.toFixed(1) : value}
          </motion.span>
          <span className="text-[8px] text-white/30 font-mono">{unit}</span>
        </div>
      </div>
      <span className="text-[9px] uppercase tracking-[0.15em] text-white/30">
        {label}
      </span>
    </div>
  );
}
