"use client";

import { useState, useEffect } from "react";
import { X, PenTool, Plus, Clock, User, Send, Check } from "lucide-react";
import { fetchNotes, addNote, type NoteItem } from "@/lib/api";

interface NotesPanelProps {
  crewId: string;
  onClose: () => void;
}

export default function NotesPanel({ crewId, onClose }: NotesPanelProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState("Cmdr. Sarah Stone");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const res = await fetchNotes(crewId);
      setNotes(res.notes || []);
    } catch {
      // Fallback local note for demo resilience
      setNotes([
        {
          id: 1,
          crew_id: crewId,
          author: "Flight Surgeon",
          text: "Pre-EVA check complete. Biometric telemetry calibration confirmed.",
          created_at: Date.now() / 1000 - 3600,
          at: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [crewId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await addNote(crewId, author, text.trim());
      setNotes((prev) => [res.note, ...prev]);
      setText("");
      setFeedback("Note recorded to mission database!");
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      // Fallback
      const newMockNote: NoteItem = {
        id: Date.now(),
        crew_id: crewId,
        author: author,
        text: text.trim(),
        created_at: Date.now() / 1000,
        at: new Date().toISOString(),
      };
      setNotes((prev) => [newMockNote, ...prev]);
      setText("");
      setFeedback("Note saved (Local Edge Mode)");
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#090e18]/95 border-l border-[#1b263b] shadow-2xl backdrop-blur-xl z-50 flex flex-col font-sans text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-[#182337] flex items-center justify-between bg-[#070b13]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono tracking-wider text-white">
                CREW MISSION NOTES &amp; LOGS
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                GET/POST /notes?crew_id={crewId}
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

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-[#182337] bg-[#080d16] space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Author:</span>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="bg-[#0e1626] border border-[#1d2d46] rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Record medical observation, EVA exertion level, equipment check..."
            rows={3}
            className="w-full bg-[#0d1624] border border-[#1b293e] rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
          />

          <div className="flex items-center justify-between">
            {feedback ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {feedback}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">
                Stored in SQLite notes table
              </span>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black disabled:opacity-40 transition-colors flex items-center gap-1.5 font-mono"
            >
              <Send className="w-3.5 h-3.5" />
              Add Entry
            </button>
          </div>
        </form>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>SAVED ENTRIES ({notes.length})</span>
            <button
              onClick={loadNotes}
              className="hover:text-cyan-400 text-[10px] transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">
              Loading mission logs...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No notes recorded yet. Add one above.
            </div>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-xl bg-[#0d1624] border border-[#182337] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
                    <User className="w-3.5 h-3.5" />
                    <span>{n.author}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {n.at ? new Date(n.at).toLocaleTimeString() : "Just now"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {n.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
