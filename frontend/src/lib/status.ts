/**
 * Unified System Status & Color Mappings for NASA Space Apps ORBIT
 * Derived directly from FastAPI Backend: NORMAL | WARNING | CRITICAL | STALE
 */

export type SystemStatusLevel = "NORMAL" | "WARNING" | "CRITICAL" | "STALE" | "UNKNOWN";

export interface StatusConfig {
  label: string;
  labelUz: string;
  color: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  glowClass: string;
}

export const STATUS_CONFIGS: Record<SystemStatusLevel, StatusConfig> = {
  NORMAL: {
    label: "NOMINAL",
    labelUz: "BARQAROR",
    color: "#10b981",
    borderClass: "border-emerald-500/40",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    glowClass: "shadow-[0_0_12px_rgba(16,185,129,0.25)]",
  },
  WARNING: {
    label: "WARNING",
    labelUz: "OGOHLANTIRISH",
    color: "#f59e0b",
    borderClass: "border-amber-500/40",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-400",
    glowClass: "shadow-[0_0_12px_rgba(245,158,11,0.25)]",
  },
  CRITICAL: {
    label: "CRITICAL",
    labelUz: "XAVFLI",
    color: "#ef4444",
    borderClass: "border-rose-500/40",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-400",
    glowClass: "shadow-[0_0_12px_rgba(239,68,68,0.25)]",
  },
  STALE: {
    label: "STALE (NO DATA)",
    labelUz: "MA'LUMOT YO'Q",
    color: "#64748b",
    borderClass: "border-slate-500/40",
    bgClass: "bg-slate-500/10",
    textClass: "text-slate-400",
    glowClass: "shadow-none",
  },
  UNKNOWN: {
    label: "UNKNOWN",
    labelUz: "NOMA'LUM",
    color: "#64748b",
    borderClass: "border-slate-500/30",
    bgClass: "bg-slate-500/10",
    textClass: "text-slate-400",
    glowClass: "shadow-none",
  },
};

export function getStatusConfig(status?: string | null): StatusConfig {
  if (!status) return STATUS_CONFIGS.STALE;
  const upper = status.toUpperCase().trim() as SystemStatusLevel;
  return STATUS_CONFIGS[upper] || STATUS_CONFIGS.UNKNOWN;
}

export function formatMetric(
  value: number | null | undefined,
  unit?: string,
  emptyText = "—"
): { display: string; unit: string; hasValue: boolean } {
  if (value === null || value === undefined || isNaN(value)) {
    return { display: emptyText, unit: unit || "", hasValue: false };
  }
  return {
    display: typeof value === "number" ? (value % 1 === 0 ? value.toString() : value.toFixed(1)) : String(value),
    unit: unit || "",
    hasValue: true,
  };
}
