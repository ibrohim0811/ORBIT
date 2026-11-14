/**
 * ORBIT API Client — Node 22 / Next.js 15 compatible
 * Communicates with FastAPI backend on http://localhost:8000
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  BACKEND_URL.replace(/^http/, "ws") + "/ws/telemetry";

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

export interface ActionCenterData {
  level: string;
  action_required: string;
  instruction: string;
  confidence: string;
  estimated_dose_saved?: string;
}

export interface StatusResponse {
  status: string;
  mode: string;
  sync_status?: string;
  analytics_summary: AnalyticsData | string;
  action_center?: ActionCenterData;
}

export interface TelemetryInput {
  heart_rate?: number;
  blood_pressure_sys?: number;
  radiation_level?: number;
  co2_level?: number;
  sleep_debt?: number;
}

export interface PushResponse {
  status: string;
  message: string;
  timestamp: string;
  latencyMs?: number;
}

/**
 * Fetch system status and latest analytics from GET /status
 */
export async function fetchStatus(): Promise<{
  data: StatusResponse;
  latencyMs: number;
}> {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${BACKEND_URL}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data: StatusResponse = await res.json();
    return { data, latencyMs };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Push real telemetry data to POST /push
 */
export async function pushTelemetry(
  data: TelemetryInput
): Promise<PushResponse> {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${BACKEND_URL}/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        heart_rate: data.heart_rate ?? 75.0,
        blood_pressure_sys: data.blood_pressure_sys ?? 120.0,
        radiation_level: data.radiation_level ?? 0.1,
        co2_level: data.co2_level ?? 0.04,
        sleep_debt: data.sleep_debt ?? 0.0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    return {
      status: json.status || "success",
      message: json.message || "Telemetry accepted and analyzed",
      timestamp: new Date().toISOString(),
      latencyMs,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Check if the backend is reachable (GET /)
 */
export async function checkApiHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(`${BACKEND_URL}/`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}
