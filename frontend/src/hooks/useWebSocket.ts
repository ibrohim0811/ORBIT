"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WS_URL, type AnalyticsData } from "@/lib/api";

interface TelemetryPoint {
  time: string;
  heart_rate: number;
  blood_pressure_sys: number;
  radiation: number;
  co2: number;
  sleep_debt: number;
  timestamp: number;
}

interface UseWebSocketReturn {
  analytics: AnalyticsData | null;
  connected: boolean;
  history: TelemetryPoint[];
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
}

const MAX_HISTORY = 60;

export function useWebSocket(): UseWebSocketReturn {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<UseWebSocketReturn["connectionStatus"]>("connecting");
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setConnectionStatus("connecting");

      ws.onopen = () => {
        setConnected(true);
        setConnectionStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.analytics && !("message" in data.analytics)) {
            const a = data.analytics as AnalyticsData;
            setAnalytics(a);

            const now = new Date();
            const point: TelemetryPoint = {
              time: now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              heart_rate: a.metrics.avg_heart_rate,
              blood_pressure_sys: 120,
              radiation: a.metrics.current_radiation,
              co2: a.metrics.current_co2,
              sleep_debt: a.metrics.sleep_debt_hours,
              timestamp: now.getTime(),
            };

            setHistory((prev) => {
              const updated = [...prev, point];
              return updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated;
            });
          }
        } catch (e) {
          console.error("WebSocket parse error:", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setConnectionStatus("disconnected");
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setConnectionStatus("error");
        ws.close();
      };
    } catch (e) {
      setConnectionStatus("error");
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { analytics, connected, history, connectionStatus };
}
