export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  BACKEND_URL.replace("http://", "ws://").replace("https://", "wss://") +
    "/ws/telemetry";

export interface TelemetryMetrics {
  avg_heart_rate: number;
  max_heart_rate: number;
  current_radiation: number;
  cumulative_radiation_dose: number;
  current_co2: number;
  sleep_debt_hours: number;
}

export interface AnalyticsData {
  window_samples: number;
  metrics: TelemetryMetrics;
  system_status: "NORMAL" | "WARNING" | "CRITICAL";
  warnings: string[];
  confidence_score: string;
}

export interface StatusResponse {
  status: string;
  mode: string;
  sync_status?: string;
  analytics_summary: AnalyticsData | string;
  action_center?: {
    level: string;
    action_required: string;
    instruction: string;
    confidence: string;
    estimated_dose_saved?: string;
  };
}

export interface WebSocketMessage {
  status: string;
  mode: string;
  analytics: AnalyticsData | { message: string };
}

export interface TelemetryInput {
  heart_rate?: number;
  blood_pressure_sys?: number;
  radiation_level?: number;
  co2_level?: number;
  sleep_debt?: number;
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${BACKEND_URL}/status`);
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function pushTelemetry(data: TelemetryInput): Promise<void> {
  await fetch(`${BACKEND_URL}/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
