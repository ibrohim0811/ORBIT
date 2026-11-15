"use client";

import { useState } from "react";
import { X, Search, Filter, History, Clock, ArrowRight } from "lucide-react";
import { searchTelemetry, fetchTelemetryHistory, type SearchResult, type HistorySample } from "@/lib/api";

interface SearchPanelProps {
  crewId: string;
  onClose: () => void;
}

export default function SearchPanel({ crewId, onClose }: SearchPanelProps) {
  const [activeTab, setActiveTab] = useState<"search" | "history">("search");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [historySamples, setHistorySamples] = useState<HistorySample[]>([]);
  const [loading, setLoading] = useState(false);

  // History filters
  const [hrMin, setHrMin] = useState<string>("100");
  const [radMin, setRadMin] = useState<string>("0.5");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const res = await searchTelemetry(crewId, query.trim());
      setSearchResults(res.results || []);
    } catch {
      // Demo mock fallback
      setSearchResults([
        {
          type: "event",
          title: "STATUS_CHANGE",
          text: `Query '${query}' matched threshold state check`,
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterHistory = async () => {
    try {
      setLoading(true);
      const res = await fetchTelemetryHistory(crewId, {
        hrMin: hrMin ? parseFloat(hrMin) : undefined,
        radMin: radMin ? parseFloat(radMin) : undefined,
        limit: 40,
      });
      setHistorySamples(res.samples || []);
    } catch {
      setHistorySamples([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#090e18]/95 border-l border-[#1b263b] shadow-2xl backdrop-blur-xl z-50 flex flex-col font-sans text-slate-200">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#182337] flex items-center justify-between bg-[#070b13]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-white">
              SEARCH & TELEMETRY QUERY
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              GET /search · GET /telemetry/history
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

      {/* Tabs */}
      <div className="flex border-b border-[#182337] bg-[#090f1b] text-xs font-mono">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition-colors ${
            activeTab === "search"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Keyword Search
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Telemetry Filter (HR / Rad)
        </button>
      </div>

      {activeTab === "search" ? (
        <>
          {/* Keyword Search Input */}
          <form onSubmit={handleSearch} className="p-4 border-b border-[#182337] flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, notes, check-ins..."
              className="flex-1 bg-[#060a12] border border-[#1b283d] rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 transition-colors disabled:opacity-50"
            >
              Search
            </button>
          </form>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-[11px] font-mono text-slate-400">
              RESULTS ({searchResults.length})
            </div>
            {loading ? (
              <div className="text-center py-10 text-xs font-mono text-slate-500">
                Searching SQLite indices...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 text-xs font-mono text-slate-500">
                Enter a term like &ldquo;LOS&rdquo;, &ldquo;CRITICAL&rdquo;, or &ldquo;EVA&rdquo;.
              </div>
            ) : (
              searchResults.map((r, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#0b1322] border border-[#17243a] space-y-1 font-mono text-xs"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase font-bold">
                      {r.type}
                    </span>
                    <span className="text-slate-500">
                      {r.at ? new Date(r.at).toLocaleTimeString() : ""}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs mt-1">{r.title}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{r.text}</p>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Historical Filter Controls */}
          <div className="p-4 border-b border-[#182337] space-y-3 bg-[#0a101c] font-mono text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase">Min Heart Rate (bpm):</label>
                <input
                  type="number"
                  value={hrMin}
                  onChange={(e) => setHrMin(e.target.value)}
                  className="w-full bg-[#060a12] border border-[#1b283d] rounded-lg px-2.5 py-1 text-xs text-rose-400 focus:outline-none focus:border-rose-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase">Min Rad (mSv/h):</label>
                <input
                  type="number"
                  step="0.1"
                  value={radMin}
                  onChange={(e) => setRadMin(e.target.value)}
                  className="w-full bg-[#060a12] border border-[#1b283d] rounded-lg px-2.5 py-1 text-xs text-purple-400 focus:outline-none focus:border-purple-500 mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleFilterHistory}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 transition-colors flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                Query Telemetry DB
              </button>
            </div>
          </div>

          {/* History Samples Table */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono">
            <div className="text-[11px] text-slate-400">
              SAMPLES RECORDED ({historySamples.length})
            </div>
            {loading ? (
              <div className="text-center py-10 text-xs text-slate-500">
                Scanning samples table...
              </div>
            ) : historySamples.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                Click &ldquo;Query Telemetry DB&rdquo; to retrieve filtered samples.
              </div>
            ) : (
              historySamples.map((s) => (
                <div
                  key={s.event_id}
                  className="p-2.5 rounded-lg bg-[#0b1322] border border-[#17243a] flex items-center justify-between text-[11px]"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500">
                      {s.at ? new Date(s.at).toLocaleTimeString() : s.event_id.slice(0, 8)}
                    </span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-rose-400 font-bold">{s.heart_rate} bpm</span>
                      <span className="text-purple-400">{s.radiation_level} mSv/h</span>
                      <span className="text-cyan-400">{s.blood_pressure_sys} mmHg</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">CO2: {s.co2_level}%</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
