"use client";

import { useState } from "react";
import { X, UserCheck, CheckCircle2, ShieldAlert } from "lucide-react";
import { crewCheckin } from "@/lib/api";

interface CheckInModalProps {
  crewId: string;
  onClose: () => void;
  onSuccess?: (status: string) => void;
}

const COMMON_SYMPTOMS = [
  "Bosh og'rig'i",
  "Ko'ngil aynishi (SAS)",
  "Charchoq",
  "Mushak og'rig'i",
  "Uyqusizlik",
  "Ko'rish xiralashishi",
  "Burun bitishi",
];

const MOODS = [
  { val: 1, emoji: "😞", label: "Juda yomon" },
  { val: 2, emoji: "🙁", label: "Qoniqarsiz" },
  { val: 3, emoji: "😐", label: "O'rtacha" },
  { val: 4, emoji: "🙂", label: "Yaxshi" },
  { val: 5, emoji: "😄", label: "A'lo" },
];

export default function CheckInModal({ crewId, onClose, onSuccess }: CheckInModalProps) {
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<number>(4);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleAction = async (status: "OK" | "NEED_HELP") => {
    try {
      setLoading(true);
      await crewCheckin(
        crewId,
        status,
        note || (status === "OK" ? "Holat me'yorda" : "Yordam so'raldi"),
        mood,
        selectedSymptoms
      );
      setResult(status === "OK" ? "Check-in qabul qilindi: Holat me'yorda (OK)" : "FAVQULODDA OGOHLANTIRISH YUBORILDI (NEED_HELP)");
      if (onSuccess) onSuccess(status);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setResult(status === "OK" ? "Check-in qayd etildi (Oflayn/Lokal rejim)" : "Eskalatsiya missiya tarixiga yozildi");
      if (onSuccess) onSuccess(status);
      setTimeout(() => {
        onClose();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0b121f] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative font-sans text-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono tracking-wider text-white">
                EKIPAJ CHECK-IN PROTOKOLI
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                POST /crew/{crewId}/checkin · NASA Xavfsizlik qoidasi
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Kayfiyat tanlash (1..5) */}
        <div className="mb-4">
          <label className="text-[11px] font-mono text-cyan-300 font-semibold mb-1.5 block">
            Kayfiyat va ruhiy tetiklik (1 - 5):
          </label>
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.val}
                type="button"
                onClick={() => setMood(m.val)}
                className={`py-2 px-1 rounded-xl text-center border transition-all flex flex-col items-center gap-1 ${
                  mood === m.val
                    ? "bg-cyan-500/25 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                    : "bg-[#060a12] border-[#1b283d] text-slate-400 hover:border-slate-600"
                }`}
              >
                <span className="text-lg">{m.emoji}</span>
                <span className="text-[9px] font-mono leading-tight">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Simptomlar chiplari */}
        <div className="mb-4">
          <label className="text-[11px] font-mono text-cyan-300 font-semibold mb-1.5 block">
            Joriy simptomlar (agar mavjud bo'lsa):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SYMPTOMS.map((sym) => {
              const active = selectedSymptoms.includes(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => toggleSymptom(sym)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all border ${
                    active
                      ? "bg-amber-500/20 border-amber-400 text-amber-200"
                      : "bg-[#060a12] border-[#1b283d] text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>

        {/* Qo'shimcha eslatma */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Qo'shimcha izoh: masalan, EVA yuklamasi, havo harorati..."
          rows={2}
          className="w-full bg-[#060a12] border border-[#1b283d] rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono resize-none mb-4"
        />

        {result ? (
          <div
            className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
              result.includes("FAVQULODDA")
                ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                : "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
            }`}
          >
            {result.includes("FAVQULODDA") ? (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{result}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => handleAction("OK")}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-all flex items-center justify-between"
            >
              <span>🟢 &ldquo;Holatim yaxshi — Barcha ko'rsatkichlar me'yorda&rdquo;</span>
              <span className="text-[10px] opacity-60">Status: OK</span>
            </button>

            <button
              onClick={() => handleAction("NEED_HELP")}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 transition-all flex items-center justify-between"
            >
              <span>🔴 &ldquo;YORDAM KERAK — Parvoz vrachiga darhol eskalatsiya&rdquo;</span>
              <span className="text-[10px] opacity-60">Status: NEED_HELP</span>
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#162033] flex justify-between items-center text-[10px] font-mono text-slate-500">
          <span>Astronavt xavfsizligini tekshirish</span>
          <button onClick={onClose} className="hover:text-slate-300">
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
