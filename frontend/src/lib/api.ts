/**
 * ORBIT API Client — Node 22 / Next.js 15 compatible
 * Communicates with FastAPI backend on http://localhost:8000
 * Fully resilient with offline-edge fallback
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
  system_status: "NORMAL" | "WARNING" | "CRITICAL" | "STALE";
  warnings: string[];
  confidence_score: string;
}

export interface ActionCenterData {
  level: string;
  action_required: string;
  instruction: string;
  reason?: string;
  rule_id: string;
  confidence: string;
}

export interface StatusResponse {
  status: string;
  crew_id: string;
  mode: string;
  sync_status?: string;
  checkin?: {
    last_checkin_at: string | null;
    last_status: string | null;
    timeout_s: number;
  };
  analytics_summary: AnalyticsData | string;
  action_center?: ActionCenterData;
}

export interface DashboardResponse {
  crew_id: string;
  system_status: string;
  latest_vitals: {
    heart_rate: number | null;
    blood_pressure_sys: number | null;
    radiation_level: number | null;
    co2_level: number | null;
    sleep_debt: number | null;
    received_at: string | null;
  };
  risk_budget: {
    overall_score: number;
    radiation: number;
    heart_rate: number;
    co2: number;
    sleep: number;
  } | null;
  recommendation: {
    rule_id: string;
    action: string;
    reason: string;
    confidence: string;
  } | null;
  last_checkin: {
    status: string;
    at: string | null;
  } | null;
  recent_events: {
    kind: string;
    detail: string;
    at: string | null;
  }[];
  notes_count: number;
  pending_sync_samples: number;
}

export interface NoteItem {
  id: number;
  crew_id: string;
  author: string;
  text: string;
  created_at: number;
  at?: string | null;
}

export interface SearchResult {
  type: string;
  title: string;
  text: string;
  at: string | null;
}

export interface HistorySample {
  event_id: string;
  at: string | null;
  heart_rate: number;
  blood_pressure_sys: number;
  radiation_level: number;
  co2_level: number;
  sleep_debt: number;
}

export interface SyncStatusResponse {
  crew_id: string;
  link: "LOS" | "OK";
  pending_samples: number;
  last_sync_at: string | null;
  last_synced_count: number;
}

export interface ChatResponse {
  crew_id: string;
  source: "ollama" | "rule_fallback";
  engine: string;
  answer: string;
}

export interface TelemetryInput {
  crew_id?: string;
  mission_id?: string;
  event_id?: string;
  heart_rate?: number;
  blood_pressure_sys?: number;
  radiation_level?: number;
  co2_level?: number;
  sleep_debt?: number;
}

// Helper fetch with timeout
async function request<T>(
  endpoint: string,
  options?: RequestInit,
  timeoutMs = 4000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// 1. Dashboard API
export async function fetchDashboard(
  crewId = "CREW-1"
): Promise<DashboardResponse> {
  return request<DashboardResponse>(`/dashboard?crew_id=${encodeURIComponent(crewId)}`);
}

// 2. Status API
export async function fetchStatus(crewId = "CREW-1"): Promise<{
  data: StatusResponse;
  latencyMs: number;
}> {
  const start = performance.now();
  const data = await request<StatusResponse>(`/status?crew_id=${encodeURIComponent(crewId)}`);
  const latencyMs = Math.round(performance.now() - start);
  return { data, latencyMs };
}

// 3. Push Telemetry
export async function pushTelemetry(
  data: TelemetryInput
): Promise<{ status: string; message: string; latencyMs: number }> {
  const start = performance.now();
  const res = await request<{ status: string; message: string }>(`/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      crew_id: data.crew_id ?? "CREW-1",
      mission_id: data.mission_id ?? "MISSION-1",
      heart_rate: data.heart_rate ?? 75.0,
      blood_pressure_sys: data.blood_pressure_sys ?? 120.0,
      radiation_level: data.radiation_level ?? 0.1,
      co2_level: data.co2_level ?? 0.04,
      sleep_debt: data.sleep_debt ?? 0.0,
    }),
  });
  const latencyMs = Math.round(performance.now() - start);
  return { ...res, latencyMs };
}

// 4. Notes / Logs API
export async function fetchNotes(
  crewId = "CREW-1",
  limit = 50
): Promise<{ crew_id: string; notes: NoteItem[] }> {
  return request<{ crew_id: string; notes: NoteItem[] }>(
    `/notes?crew_id=${encodeURIComponent(crewId)}&limit=${limit}`
  );
}

export async function addNote(
  crewId = "CREW-1",
  author: string,
  text: string
): Promise<{ status: string; note: NoteItem }> {
  return request<{ status: string; note: NoteItem }>(
    `/notes?crew_id=${encodeURIComponent(crewId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, text }),
    }
  );
}

// 5. Search API
export async function searchTelemetry(
  crewId = "CREW-1",
  query: string,
  limit = 50
): Promise<{ crew_id: string; query: string; count: number; results: SearchResult[] }> {
  return request<{ crew_id: string; query: string; count: number; results: SearchResult[] }>(
    `/search?crew_id=${encodeURIComponent(crewId)}&q=${encodeURIComponent(query)}&limit=${limit}`
  );
}

// 6. Telemetry History API
export async function fetchTelemetryHistory(
  crewId = "CREW-1",
  params?: {
    sinceSecondsAgo?: number;
    hrMin?: number;
    hrMax?: number;
    radMin?: number;
    limit?: number;
  }
): Promise<{ crew_id: string; count: number; samples: HistorySample[] }> {
  const query = new URLSearchParams({ crew_id: crewId });
  if (params?.sinceSecondsAgo !== undefined)
    query.set("since_seconds_ago", params.sinceSecondsAgo.toString());
  if (params?.hrMin !== undefined) query.set("hr_min", params.hrMin.toString());
  if (params?.hrMax !== undefined) query.set("hr_max", params.hrMax.toString());
  if (params?.radMin !== undefined) query.set("rad_min", params.radMin.toString());
  query.set("limit", (params?.limit ?? 50).toString());

  return request<{ crew_id: string; count: number; samples: HistorySample[] }>(
    `/telemetry/history?${query.toString()}`
  );
}

// 7. Ground Link / Data Sync API
export async function syncNow(
  crewId = "CREW-1"
): Promise<{ status: string; crew_id: string; pending_samples?: number; synced_samples?: number; reason?: string; synced_at?: string }> {
  return request(`/sync?crew_id=${encodeURIComponent(crewId)}`, {
    method: "POST",
  });
}

export async function fetchSyncStatus(
  crewId = "CREW-1"
): Promise<SyncStatusResponse> {
  return request<SyncStatusResponse>(`/sync/status?crew_id=${encodeURIComponent(crewId)}`);
}

// 8. Crew Communication / AI Chat API
export async function sendChatMessage(
  crewId = "CREW-1",
  message: string
): Promise<ChatResponse> {
  return request<ChatResponse>(`/chat?crew_id=${encodeURIComponent(crewId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  }, 10000); // 10s for LLM response
}

// 9. AI Status API
export async function fetchAiStatus(): Promise<string> {
  try {
    const res = await request<string>("/ai/status");
    return res;
  } catch {
    return "Offline (Edge Fallback)";
  }
}

// 10. Crew Check-in API
export async function crewCheckin(
  crewId = "CREW-1",
  status: "OK" | "NEED_HELP",
  note: string
): Promise<{ status: string; crew_id: string; checkin_at: string; checkin_status: string }> {
  return request<{ status: string; crew_id: string; checkin_at: string; checkin_status: string }>(
    `/crew/${encodeURIComponent(crewId)}/checkin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    }
  );
}

// 11. Events API
export async function fetchEvents(
  crewId = "CREW-1",
  limit = 20
): Promise<{ crew_id: string; events: { kind: string; detail: string; at: string | null }[] }> {
  return request(`/events?crew_id=${encodeURIComponent(crewId)}&limit=${limit}`);
}

// 12. Simulator Mode API
export async function fetchSimulatorMode(): Promise<{ current_mode: string; available_modes: string[] }> {
  return request(`/simulator/mode`);
}

export async function setSimulatorMode(
  mode: "normal" | "warning" | "critical" | "storm"
): Promise<{ status: string; current_mode: string }> {
  return request(`/simulator/mode?mode=${encodeURIComponent(mode)}`, {
    method: "POST",
  });
}

// 13. Known Crews List
export async function fetchCrews(): Promise<{ crews: string[] }> {
  return request(`/crews`);
}
