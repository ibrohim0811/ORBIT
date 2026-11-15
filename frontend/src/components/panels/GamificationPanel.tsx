"use client";

import { useState, useEffect } from "react";
import {
  X,
  Flame,
  Award,
  Shield,
  Droplets,
  Moon,
  Zap,
  CheckCircle2,
  Circle,
  Trophy,
  RefreshCw,
  Sparkles,
  Check,
} from "lucide-react";
import {
  fetchGamification,
  toggleGamificationTask,
  resetGamification,
  type GamificationState,
  type TaskItem,
  type BadgeItem,
} from "@/lib/api";

interface GamificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  crewId?: string;
}

export default function GamificationPanel({
  isOpen,
  onClose,
  crewId = "CREW-1",
}: GamificationPanelProps) {
  const [data, setData] = useState<GamificationState | null>(null);
  const [loading, setLoading] = useState(false);
  const [celebrateTask, setCelebrateTask] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchGamification(crewId);
      setData(res);
    } catch {
      // Fallback local mock data if offline
      setData({
        crew_id: crewId,
        streak_days: 5,
        total_points: 240,
        date: new Date().toISOString().split("T")[0],
        tasks_completed: 3,
        tasks_total: 5,
        tasks: [
          {
            task_id: "task_exercise",
            title: "2.5 soat trenajyor",
            description: "T2 Treadmill & ARED kuch mashqlari (suyak/mushak profilaktikasi)",
            category: "fitness",
            points: 30,
            completed: true,
          },
          {
            task_id: "task_hydration",
            title: "Suv balansi",
            description: "2.5L ionlashtirilgan suv iste'moli va elektrolit nazorati",
            category: "hydration",
            points: 20,
            completed: true,
          },
          {
            task_id: "task_checkin",
            title: "Kunlik tibbiy check-in",
            description: "Sog'liq va ruhiy holat bo'yicha rasmiy hisobot",
            category: "health",
            points: 25,
            completed: true,
          },
          {
            task_id: "task_sleep",
            title: "8 soat optimal uyqu",
            description: "Sirkad ritm va kognitiv dam olish tsikli",
            category: "recovery",
            points: 25,
            completed: false,
          },
          {
            task_id: "task_radiation",
            title: "Radiatsiya nazorati",
            description: "Shaxsiy dozimetr va modul qalqonlarini ko'rikdan o'tkazish",
            category: "safety",
            points: 15,
            completed: false,
          },
        ],
        badges: [
          {
            badge_id: "rad_shield",
            title: "Radiation Shield Master",
            description: "Radiatsiya foni va dozimetriya doimiy nazoratda",
            icon: "Shield",
            unlocked: true,
          },
          {
            badge_id: "hydration_hero",
            title: "Hydration Hero",
            description: "Kunlik suv balansi va elektrolit me'yori to'liq bajarildi",
            icon: "Droplets",
            unlocked: true,
          },
          {
            badge_id: "sleep_guardian",
            title: "Sleep Guardian",
            description: "Uyqu gigiyenasi saqlangan, uyqu qarzi minimal",
            icon: "Moon",
            unlocked: false,
          },
          {
            badge_id: "fitness_commander",
            title: "Fitness Commander",
            description: "2.5 soatlik kosmik trenajyor mashqlari muvaffaqiyatli yakunlandi",
            icon: "Flame",
            unlocked: true,
          },
          {
            badge_id: "streak_master",
            title: "Orbit Pioneer (5-Day Streak)",
            description: "Ketma-ket 5 kunlik barcha vazifalar a'lo darajada bajarildi",
            icon: "Award",
            unlocked: true,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, crewId]);

  const handleToggle = async (task: TaskItem) => {
    const nextState = !task.completed;
    if (nextState) {
      setCelebrateTask(task.task_id);
      setTimeout(() => setCelebrateTask(null), 1500);
    }
    // Optimistic UI update
    if (data) {
      const updatedTasks = data.tasks.map((t) =>
        t.task_id === task.task_id ? { ...t, completed: nextState } : t
      );
      const completedCount = updatedTasks.filter((t) => t.completed).length;
      setData({
        ...data,
        tasks: updatedTasks,
        tasks_completed: completedCount,
        total_points: Math.max(
          0,
          data.total_points + (nextState ? task.points : -task.points)
        ),
      });
    }

    try {
      const updated = await toggleGamificationTask(
        crewId,
        task.task_id,
        nextState
      );
      setData(updated);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Shield":
        return <Shield className="w-5 h-5 text-amber-400" />;
      case "Droplets":
        return <Droplets className="w-5 h-5 text-cyan-400" />;
      case "Moon":
        return <Moon className="w-5 h-5 text-purple-400" />;
      case "Flame":
        return <Flame className="w-5 h-5 text-rose-400" />;
      default:
        return <Award className="w-5 h-5 text-yellow-400" />;
    }
  };

  const tasksCompleted = data?.tasks_completed || 0;
  const tasksTotal = data?.tasks_total || 5;
  const progressPct = Math.round((tasksCompleted / Math.max(1, tasksTotal)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl bg-[#090e18] border border-[#1e2a40] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#141f33] flex items-center justify-between bg-[#0b1220]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-wide text-white">
                  CREW HEALTH GAMIFICATION &amp; STREAK
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/40 text-amber-400 bg-amber-500/10 font-bold">
                  ORBIT REWARDS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kundalik salomatlik vazifalari, ketma-ketlik va kosmik nishonlar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg bg-[#111c2e] hover:bg-[#192842] text-slate-400 hover:text-white transition-colors"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#111c2e] hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#090e18]">
          {/* Top Banner: Streak Card + Points Counter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Streak Hero Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-[#0d1627] to-[#090f1b] border border-amber-500/30 relative overflow-hidden flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
                  <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>KETMA-KET KUNLAR (STREAK)</span>
                </div>
                <div className="text-3xl font-extrabold text-white mt-1 font-mono flex items-baseline gap-2">
                  <span>🔥 {data?.streak_days || 5}</span>
                  <span className="text-xs text-amber-300/80 font-normal">
                    KUNLIK STREAK
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Barcha kunlik vazifalarni to&apos;liq bajarganingiz uchun streak davom etmoqda!
                </p>
              </div>
            </div>

            {/* Total Points & Rank Card */}
            <div className="p-4 rounded-xl bg-[#0d1627] border border-[#1b2b46] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  SOG&apos;LIQ BALLARI (POINTS)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-300 bg-cyan-500/10">
                  RANK: ORBITAL SPECIALIST
                </span>
              </div>
              <div className="text-3xl font-extrabold text-cyan-300 mt-1 font-mono">
                {data?.total_points || 240} <span className="text-xs text-slate-400">PTS</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Kunlik Progress: {tasksCompleted}/{tasksTotal} vazifa</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#121c2e] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Kunlik Vazifalar Ro'yxati */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>KUNLIK SALOMATLIK VAZIFALARI</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Sana: {data?.date || "Bugun"}
              </span>
            </div>

            <div className="space-y-2">
              {data?.tasks.map((task) => (
                <div
                  key={task.task_id}
                  onClick={() => handleToggle(task)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                    task.completed
                      ? "bg-emerald-500/5 border-emerald-500/30 text-slate-200"
                      : "bg-[#0c1424] border-[#18273f] hover:border-cyan-500/40 text-slate-300"
                  } ${celebrateTask === task.task_id ? "ring-2 ring-emerald-400 animate-pulse" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                        task.completed
                          ? "bg-emerald-500 border-emerald-400 text-black font-bold"
                          : "border-slate-600 bg-[#090f1a] hover:border-cyan-400"
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div>
                      <div
                        className={`text-xs font-semibold flex items-center gap-2 ${
                          task.completed ? "line-through text-slate-400" : "text-white"
                        }`}
                      >
                        <span>{task.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        task.completed
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                      }`}
                    >
                      +{task.points} PTS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Salomatlik Nishonlari (Badges) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>SALOMATLIK VA ERISHILGAN NISHONLAR (BADGES)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data?.badges.map((badge) => (
                <div
                  key={badge.badge_id}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    badge.unlocked
                      ? "bg-[#0d1728] border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.12)] text-white"
                      : "bg-[#090e18]/60 border-[#141f33] text-slate-500 opacity-60"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl border shrink-0 ${
                      badge.unlocked
                        ? "bg-[#111e33] border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                        : "bg-[#070b13] border-[#162338]"
                    }`}
                  >
                    {renderBadgeIcon(badge.icon)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span className="truncate">{badge.title}</span>
                      {badge.unlocked && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                          EARNED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#141f33] bg-[#070c16] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Har kuni 5 ta vazifani bajaring va streakni saqlang!</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
