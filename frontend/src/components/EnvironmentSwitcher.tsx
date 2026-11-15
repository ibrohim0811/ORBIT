"use client";

import { useState, useEffect } from "react";
import { Rocket, Moon, Globe, ChevronDown, Check } from "lucide-react";

export interface Environment {
  id: "spacecraft" | "lunar" | "mars";
  name: string;
  shortName: string;
  gravity: number; // in g
  gravityLabel: string;
  radiationMultiplier: number;
  description: string;
  icon: string;
  badgeColor: string;
}

export const ENVIRONMENTS: Environment[] = [
  {
    id: "spacecraft",
    name: "Spacecraft (LEO / Transit)",
    shortName: "Spacecraft",
    gravity: 1.0,
    gravityLabel: "1.00g (Microgravity Ref)",
    radiationMultiplier: 1.0,
    description: "Deep Space Vehicle / Centrifugal Habitat (Standard baseline)",
    icon: "Rocket",
    badgeColor: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
  },
  {
    id: "lunar",
    name: "Lunar Gateway / Base",
    shortName: "Lunar Base",
    gravity: 0.166,
    gravityLabel: "0.16g (Lunar Gravity)",
    radiationMultiplier: 1.35,
    description: "Artemis Base Camp (Reduced gravity, regolith dust & GCR exposure)",
    icon: "Moon",
    badgeColor: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  },
  {
    id: "mars",
    name: "Mars Habitat 01",
    shortName: "Mars Base",
    gravity: 0.38,
    gravityLabel: "0.38g (Martian Gravity)",
    radiationMultiplier: 1.15,
    description: "Mars Surface Habitat (Moderate gravity, atmospheric shielding)",
    icon: "Globe",
    badgeColor: "border-rose-500/40 text-rose-400 bg-rose-500/10",
  },
];

interface EnvironmentSwitcherProps {
  currentEnv?: Environment;
  onEnvironmentChange?: (env: Environment) => void;
}

export default function EnvironmentSwitcher({
  currentEnv,
  onEnvironmentChange,
}: EnvironmentSwitcherProps) {
  const [selected, setSelected] = useState<Environment>(
    currentEnv || ENVIRONMENTS[0]
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("orbit_environment");
      if (saved) {
        const found = ENVIRONMENTS.find((e) => e.id === saved);
        if (found) {
          setSelected(found);
          onEnvironmentChange?.(found);
        }
      }
    } catch {
      // ignore SSR or storage exceptions
    }
  }, []);

  const handleSelect = (env: Environment) => {
    setSelected(env);
    setIsOpen(false);
    try {
      localStorage.setItem("orbit_environment", env.id);
    } catch {
      // ignore
    }
    onEnvironmentChange?.(env);
  };

  const renderIcon = (id: string, className = "w-3.5 h-3.5") => {
    switch (id) {
      case "lunar":
        return <Moon className={className} />;
      case "mars":
        return <Globe className={className} />;
      default:
        return <Rocket className={className} />;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1624] hover:bg-[#15233a] border border-[#1d2d46] hover:border-cyan-500/40 transition-all text-xs font-mono"
        title="Tanlangan kosmik muhit va gravitatsiya darajasi"
      >
        <span className="flex items-center gap-1.5 text-cyan-400">
          {renderIcon(selected.id)}
          <span className="text-white font-semibold">{selected.shortName}</span>
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] border font-bold ${selected.badgeColor}`}
        >
          {selected.gravity}g
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? "rotate-180 text-cyan-400" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#090e18]/95 backdrop-blur-xl border border-[#1e293b] shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-40 p-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-2 border-b border-slate-800/80 mb-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Mission Environment Switcher
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gravitatsion koeffitsiyent va atrof-muhit xavfini sozlash
              </p>
            </div>

            <div className="space-y-1">
              {ENVIRONMENTS.map((env) => {
                const isCurrent = env.id === selected.id;
                return (
                  <button
                    key={env.id}
                    onClick={() => handleSelect(env)}
                    className={`w-full text-left p-2.5 rounded-lg flex items-start justify-between gap-2 transition-all ${
                      isCurrent
                        ? "bg-cyan-500/10 border border-cyan-500/30 text-white"
                        : "hover:bg-[#121d30] text-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 text-cyan-400">
                        {renderIcon(env.id, "w-4 h-4")}
                      </div>
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-2">
                          <span>{env.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${env.badgeColor}`}
                          >
                            {env.gravityLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {env.description}
                        </p>
                      </div>
                    </div>
                    {isCurrent && (
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 px-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Gravity Factor:</span>
              <span className="text-cyan-300 font-bold">
                {selected.gravity} Earth g
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
