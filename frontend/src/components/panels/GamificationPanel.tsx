"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Award, CheckCircle2, Circle, Flame, RotateCcw, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import {
  fetchGamification,
  toggleGamificationTask,
  resetGamification,
  type GamificationData,
  type GamificationTask,
} from "@/lib/api";

interface GamificationPanelProps {
  crewId: string;
  onClose: () => void;
}

const DEFAULT_DEMO_TASKS: GamificationTask[] = [
  {
    id: "eva-suit-check",
    title: "Complete pre-EVA airlock seal check",
    category: "eva",
    points: 50,
    completed: true,
  },
  {
    id: "cycle-ergometer",
    title: "45-min CEVIS aerobic countermeasure",
    category: "exercise",
    points: 100,
    completed: false,
  },
  {
    id: "hydration-intake",
    title: "Log 2.5L electrolyte water intake",
    category: "nutrition",
    points: 30,
    completed: true,
  },
  {
    id: "sleep-protocol",
    title: "Maintain 8h dark-cycle circadian rest",
    category: "medical",
    points: 75,
    completed: false,
  },
  {
    id: "radiation-dosimeter",
    title: "Verify active dosimeter baseline sync",
    category: "medical",
    points: 40,
    completed: false,
  },
];

export default function GamificationPanel({ crewId, onClose }: GamificationPanelProps) {
  const [data, setData] = useState<GamificationData | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchGamification(crewId);
      setData(res);
      setIsDemoMode(false);
    } catch {
      // 404 or backend offline -> OFFLINE DEMO fallback
      setIsDemoMode(true);
      setData({
        crew_id: crewId,
        level: 3,
        xp: 420,
        next_level_xp: 600,
        streak_days: 12,
        tasks: DEFAULT_DEMO_TASKS,
      });
    } finally {
      setLoading(false);
    }
  }, [crewId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (taskId: string) => {
    if (!data) return;

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      const gained = updatedTasks.find((t) => t.id === taskId)?.completed;
      const taskPts = prev.tasks.find((t) => t.id === taskId)?.points || 0;
      const nextXp = Math.max(0, prev.xp + (gained ? taskPts : -taskPts));
      return { ...prev, xp: nextXp, tasks: updatedTasks };
    });

    try {
      await toggleGamificationTask(taskId);
    } catch {
      // Keep optimistic state in demo mode
    }
  };

  const handleReset = async () => {
    try {
      await resetGamification();
      await loadData();
    } catch {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          xp: 150,
          tasks: prev.tasks.map((t) => ({ ...t, completed: false })),
        };
      });
    }
  };

  const progressPct = data ? Math.min(100, Math.round((data.xp / data.next_level_xp) * 100)) : 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#090e18]/95 border-l border-[#1b263b] shadow-2xl backdrop-blur-xl z-50 flex flex-col font-sans text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-[#182337] flex items-center justify-between bg-[#070b13]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono tracking-wider text-white">
                  CREW HEALTH PROTOCOL GAMIFICATION
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Countermeasure Adherence &amp; Microgravity Habit Loops
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151f33] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* OFFLINE DEMO Banner */}
        {isDemoMode && (
          <div className="px-4 py-1.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>OFFLINE DEMO (Backend /gamification endpoint pending)</span>
            </div>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-bold">
              Edge Fallback
            </span>
          </div>
        )}

        <div className="p-5 overflow-y-auto space-y-5 flex-1 font-mono text-xs">
          {/* Level Progress Card */}
          <div className="p-4 rounded-xl bg-[#0b1322] border border-[#17243a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base">
                  L{data?.level ?? 1}
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                    Adherence Level
                  </span>
                  <span className="text-sm font-bold text-white">
                    EVA Specialist Grade {data?.level ?? 1}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[10px]">
                <Flame className="w-3.5 h-3.5" />
                <span>{data?.streak_days ?? 0} Day Streak</span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>XP Progress</span>
                <span className="text-cyan-400 font-bold">
                  {data?.xp ?? 0} / {data?.next_level_xp ?? 500} XP ({progressPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#050912] overflow-hidden border border-[#1b263b]">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Daily Protocol Checklist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider">
              <span>Daily Health Directives</span>
              <button
                onClick={handleReset}
                className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                title="Reset tasks for daily shift"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Shift</span>
              </button>
            </div>

            <div className="space-y-2">
              {data?.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggle(task.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    task.completed
                      ? "bg-emerald-950/20 border-emerald-500/30 text-slate-300"
                      : "bg-[#0b1322] border-[#17243a] hover:border-cyan-500/40 text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <span
                        className={`text-xs block ${
                          task.completed ? "line-through text-slate-400" : "font-medium"
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#101b2e] text-slate-400 border border-[#1c2e4c]">
                        {task.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-400 shrink-0">
                    +{task.points} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#182337] bg-[#070b13] flex justify-between items-center text-[10px] font-mono text-slate-500">
          <span>Behavioral Health Countermeasure</span>
          <span className="text-cyan-400">NASA HRP Adherence Model</span>
        </div>
      </div>
    </>
  );
}
