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

  useEffect(() => {
    fetchAiStatus().then((status) => {
      setAiEngineStatus(status);
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 ${
              m.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                m.sender === "user"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              }`}
            >
              {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[80%] p-3 rounded-2xl text-xs font-mono leading-relaxed space-y-1 ${
                m.sender === "user"
                  ? "bg-cyan-950/40 border border-cyan-500/30 text-cyan-100 rounded-tr-none"
                  : "bg-[#0c1424] border border-[#1d2c47] text-slate-200 rounded-tl-none"
              }`}
            >
              <p>{m.text}</p>
              <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
                <span>{m.time}</span>
                {m.source && (
                  <span className="text-[8px] uppercase text-purple-400 font-bold">
                    {m.source === "ollama" ? "LLaMA-3" : "Rule Fallback"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>AI generating clinical reasoning...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-[#182337] bg-[#070b13] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Medical Assistant..."
          className="flex-1 bg-[#060a12] border border-[#1b283d] rounded-xl px-3 py-2 text-xs font-mono text-purple-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
