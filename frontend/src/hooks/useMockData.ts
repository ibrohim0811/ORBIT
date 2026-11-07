"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalyticsData } from "@/lib/api";

interface TelemetryPoint {
  time: string;
  heart_rate: number;
  blood_pressure_sys: number;
  radiation: number;
  co2: number;
  sleep_debt: number;
  timestamp: number;
}

const MAX_HISTORY = 60;

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export function useMockData() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);

  const generatePoint = useCallback((): TelemetryPoint => {
    const now = new Date();
    return {
      time: now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      heart_rate: randomBetween(62, 88),
      blood_pressure_sys: randomBetween(110, 130),
      radiation: randomBetween(0.05, 0.35),
      co2: randomBetween(0.03, 0.055),
      sleep_debt: randomBetween(0, 2.5),
      timestamp: now.getTime(),
    };
  }, []);

  useEffect(() => {
    // Seed initial history
    const initial: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      const t = new Date(now - i * 2000);
      initial.push({
        time: t.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        heart_rate: randomBetween(62, 88),
        blood_pressure_sys: randomBetween(110, 130),
        radiation: randomBetween(0.05, 0.35),
        co2: randomBetween(0.03, 0.055),
        sleep_debt: randomBetween(0, 2.5),
        timestamp: t.getTime(),
      });
    }
    setHistory(initial);

    const interval = setInterval(() => {
      const point = generatePoint();
      setHistory((prev) => {
        const updated = [...prev, point];
        return updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated;
      });

      setAnalytics({
        window_samples: Math.floor(Math.random() * 50) + 20,
        metrics: {
          avg_heart_rate: point.heart_rate,
          max_heart_rate: point.heart_rate + randomBetween(5, 15),
          current_radiation: point.radiation,
          cumulative_radiation_dose: randomBetween(0.5, 3.0),
          current_co2: point.co2,
          sleep_debt_hours: point.sleep_debt,
        },
        system_status: "NORMAL",
        warnings: [],
        confidence_score: "98.4%",
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [generatePoint]);

  return { analytics, history, connected: true, connectionStatus: "connected" as const };
}
