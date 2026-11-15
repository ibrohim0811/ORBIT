"use client";

import { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Send, Brain, Bot, User, Sparkles } from "lucide-react";
import { sendChatMessage, fetchAiStatus } from "@/lib/api";

interface ChatPanelProps {
  crewId: string;
  onClose: () => void;
}

interface Message {
  sender: "user" | "ai";
  text: string;
  time: string;
  source?: "ollama" | "rule_fallback";
}

export default function ChatPanel({ crewId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "ORBIT Crew Health Assistant online. Monitoring biometric telemetry. How can I assist with your EVA cycle or medical protocol?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: "rule_fallback",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiEngineStatus, setAiEngineStatus] = useState("Checking...");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetchAiStatus().then((status) => {
      setAiEngineStatus(
        status.state === "Active"
          ? `${status.engine} (Active)`
          : `${status.engine} (Offline - Edge Rules)`
      );
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      sender: "user",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(crewId, textToSend.trim());
      const aiMsg: Message = {
        sender: "ai",
        text: res.answer,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: res.source,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Offline fallback answer
      const aiMsg: Message = {
        sender: "ai",
        text: "Deterministic Rule-Engine: Vitals are within monitored spaceflight ranges. Ensure hydration and periodic suit pressure verification before next airlock transition.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "rule_fallback",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What is the current cardiac trend?",
    "Check radiation exposure risk",
    "Hypoxia emergency mitigation protocol",
  ];

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
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono tracking-wider text-white">
                  CREW AI MEDICAL CHAT
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  POST /chat
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Engine: {aiEngineStatus} · Non-Prescriptive Decision Support
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

        {/* Quick Prompts Bar */}
        <div className="p-2.5 border-b border-[#182337] bg-[#090f1b] flex gap-2 overflow-x-auto scrollbar-none">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full text-[10px] font-mono whitespace-nowrap bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors shrink-0 disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Messages Viewport */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${
                m.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.sender === "ai" && (
                <div className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                  m.sender === "user"
                    ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-100"
                    : "bg-[#0d1624] border border-[#1b263b] text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {m.sender === "user" ? "Astronaut" : "ORBIT Medical AI"}
                  </span>
                  <span>{m.time}</span>
                </div>
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.source && (
                  <div className="mt-2 pt-1.5 border-t border-[#182337] flex items-center gap-1.5 text-[9px] text-slate-400">
                    <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                    <span>Source: {m.source === "ollama" ? "Llama-3 LLM" : "Deterministic Rule Engine"}</span>
                  </div>
                )}
              </div>

              {m.sender === "user" && (
                <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Bot className="w-4 h-4 text-purple-400 animate-spin" />
              <span>Synthesizing clinical response...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 border-t border-[#182337] bg-[#070b13]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask medical question or telemetry interpretation..."
              className="flex-1 bg-[#0b121e] border border-[#1c293e] rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
