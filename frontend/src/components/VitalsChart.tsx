"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export interface DataPoint {
  time: string;
  heart_rate?: number;
  blood_pressure_sys?: number;
  radiation?: number;
  co2?: number;
  [key: string]: any;
}

interface VitalsChartProps {
  data: any[];
  title: string;
  dataKeys: { key: string; color: string; label: string }[];
  height?: number;
  type?: "line" | "area";
}

export default function VitalsChart({
  data,
  title,
  dataKeys,
  height = 220,
  type = "area",
}: VitalsChartProps) {
  const ChartComponent = type === "area" ? AreaChart : LineChart;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card hud-corners p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          {title}
        </h3>
        <div className="flex gap-4">
          {dataKeys.map((dk) => (
            <div key={dk.key} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: dk.color,
                  boxShadow: `0 0 6px ${dk.color}`,
                }}
              />
              <span className="text-[9px] text-white/30 font-mono uppercase">
                {dk.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          <defs>
            {dataKeys.map((dk) => (
              <linearGradient
                key={dk.key}
                id={`gradient-${dk.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={dk.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={dk.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.03)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0,0,0,0.9)",
              border: "1px solid rgba(0,240,255,0.2)",
              borderRadius: "8px",
              fontSize: "11px",
              color: "#e0e0e0",
              backdropFilter: "blur(10px)",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.5)" }}
          />
          {dataKeys.map((dk) =>
            type === "area" ? (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                stroke={dk.color}
                strokeWidth={2}
                fill={`url(#gradient-${dk.key})`}
                dot={false}
                activeDot={{
                  r: 3,
                  fill: dk.color,
                  stroke: dk.color,
                  strokeWidth: 1,
                }}
                isAnimationActive={false}
              />
            ) : (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                stroke={dk.color}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 3,
                  fill: dk.color,
                  stroke: dk.color,
                  strokeWidth: 1,
                }}
                isAnimationActive={false}
              />
            )
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </motion.div>
  );
}
