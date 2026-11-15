"use client";

import { useEffect } from "react";
import { X, ShieldAlert, Radio, Moon, Compass, Orbit, AlertTriangle, Activity, Stethoscope } from "lucide-react";

export type NasaHazardKey = "radiation" | "isolation" | "distance" | "gravity" | "environment";

export interface HazardDetail {
  key: NasaHazardKey;
  title: string;
  subtitle: string;
  icon: typeof Radio;
  color: string;
  affectedMetrics: string[];
  whyMeasured: string;
  clinicalThreshold: string;
  groundConsultCriterion: string;
  countermeasures: string[];
}

export const NASA_5_HAZARDS: Record<NasaHazardKey, HazardDetail> = {
  radiation: {
    key: "radiation",
    title: "Space Radiation",
    subtitle: "Galactic Cosmic Rays (GCR) & Solar Particle Events (SPE)",
    icon: Radio,
    color: "#a855f7",
    affectedMetrics: ["Ambient Radiation (mSv/h)", "Cumulative Dose (mSv)", "Cardiac Stress"],
    whyMeasured:
      "Deep space radiation penetrates vehicle hulls and EVA suits, ionizing biological tissue, damaging cellular DNA, and inducing acute radiation syndrome or cardiac micro-vascular inflammation.",
    clinicalThreshold:
      "> 1.0 mSv/h (Elevated Warning) · > 2.0 mSv/h (Critical SPE Event) · 30-day cumulative limit: 250 mSv.",
    groundConsultCriterion:
      "Immediate alert if flux exceeds 1.5 mSv/h for over 15 minutes or cumulative dose passes 10 mSv in a single EVA pass.",
    countermeasures: [
      "Retreat to designated storm shelter / water-shielded habitat module.",
      "Abort ongoing EVA immediately and close airlock inner hatch.",
      "Administer prophylactic radio-protectants and electrolyte hydration.",
    ],
  },
  isolation: {
    key: "isolation",
    title: "Isolation & Confinement",
    subtitle: "Circadian Desynchronization & Behavioral Health",
    icon: Moon,
    color: "#38bdf8",
    affectedMetrics: ["Sleep Debt Accumulation (hours)", "Resting Heart Rate Variability", "Crew Mood"],
    whyMeasured:
      "Long-duration microgravity environments alter melatonin secretion and circadian cycles, producing chronic sleep debt, cognitive fatigue, and impaired emergency response reflexes.",
    clinicalThreshold:
      "Sleep debt > 5.0 hours triggers Warning protocol · Sustained insomnia > 48 hours escalates to Flight Surgeon.",
    groundConsultCriterion:
      "Crew reporting mood index ≤ 2/5 or cumulative sleep deficit > 6 hours across 3 consecutive flight days.",
    countermeasures: [
      "Implement scheduled 8-hour dynamic LED spectrum shift (blue-enriched morning, melatonin-preserving red evening).",
      "Engage in 45-minute daily cycle ergometer or ARED exercise regimen.",
      "Conduct structured peer debriefing and private medical conferences (PMC).",
    ],
  },
  distance: {
    key: "distance",
    title: "Distance from Earth",
    subtitle: "Communication Latency & Loss of Signal (LOS)",
    icon: Compass,
    color: "#00f0ff",
    affectedMetrics: ["Ground Link State (LOS/OK)", "Pending Sync Queue", "Local Inference Confidence"],
    whyMeasured:
      "As distance to Mars or Lunar Gateway increases, round-trip radio latency grows from seconds to 22 minutes, making real-time telemedicine from Houston mission control physically impossible.",
    clinicalThreshold:
      "LOS duration > 10.0 seconds automatically engages deterministic edge rule autonomy.",
    groundConsultCriterion:
      "Telemetry sync packets deferred in local SQLite database until Deep Space Network (DSN) uplink window opens.",
    countermeasures: [
      "Rely on offline deterministic risk engine and local Ollama decision support.",
      "Utilize pre-cached clinical protocols for acute trauma or suit depressurization.",
      "Maintain offline-first audit log with cryptographic sample hashing.",
    ],
  },
  gravity: {
    key: "gravity",
    title: "Gravity Fields",
    subtitle: "Microgravity, Hyper-G & Orthostatic Intolerance",
    icon: Orbit,
    color: "#10b981",
    affectedMetrics: ["Systolic Blood Pressure (mmHg)", "Bone Mineral Density", "Core Temperature"],
    whyMeasured:
      "Weightlessness shifts 1.5–2.0 liters of cephalad fluid, elevating intracranial pressure and de-conditioning cardiovascular baroreceptors, leading to presyncope upon planetary landing.",
    clinicalThreshold:
      "Systolic blood pressure < 90 mmHg or > 160 mmHg during EVA exertion.",
    groundConsultCriterion:
      "Persistent postural dizziness or visual acuity changes (Spaceflight Associated Neuro-ocular Syndrome - SANS).",
    countermeasures: [
      "Don Lower Body Negative Pressure (LBNP) suit or pneumatic compression garments.",
      "Pre-landing fluid loading: 1 liter isotonic saline with 8 salt tablets.",
      "Daily 2.5-hour high-resistance load-bearing exercise countermeasure.",
    ],
  },
  environment: {
    key: "environment",
    title: "Hostile Closed Environment",
    subtitle: "Life Support (ECLSS), Suit Pressure & Toxic Loop Gases",
    icon: AlertTriangle,
    color: "#f59e0b",
    affectedMetrics: ["Cabin / Suit CO2 (%)", "O2 Partial Pressure", "Suit Thermal Loop (°C)"],
    whyMeasured:
      "Without convective gravity, exhaled carbon dioxide forms toxic stagnant pockets around astronaut helmets. Elevated CO2 induces hypercapnia, severe headache, confusion, and acidosis.",
    clinicalThreshold:
      "> 0.07% CO2 (Warning) · > 0.10% CO2 (Critical airlock purge) · SpO2 < 90% (Hypoxia).",
    groundConsultCriterion:
      "Any sudden drop in suit oxygen concentration or suit loop pressure variance > 0.3 psi.",
    countermeasures: [
      "Initiate immediate 100% O2 emergency flush and check LiOH/amine CO2 scrubbers.",
      "Verify suit ventilation fan RPM and swap secondary umbilical loop.",
      "Perform airlock leak verification before hatch ingress/egress cycle.",
    ],
  },
};

interface MedicalGuideModalProps {
  initialHazard?: NasaHazardKey;
  onClose: () => void;
}

export default function MedicalGuideModal({
  initialHazard = "radiation",
  onClose,
}: MedicalGuideModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="med-guide-title"
    >
      <div className="bg-[#0b121f] border border-cyan-500/40 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative font-sans text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#182337] flex items-center justify-between bg-[#070b13]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="med-guide-title" className="text-sm sm:text-base font-bold font-mono tracking-wider text-white">
                  NASA 5 HUMAN SPACEFLIGHT HAZARDS
                </h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  CLINICAL PROTOCOL GUIDE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Aerospace Medicine Decision Thresholds · Bio-monitoring Reference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151f33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(NASA_5_HAZARDS).map((h) => {
              const IconComp = h.icon;
              return (
                <div
                  key={h.key}
                  className="p-4 rounded-xl bg-[#090e18] border border-[#1b263b] hover:border-cyan-500/50 transition-colors space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1.5 rounded-lg shrink-0"
                          style={{
                            backgroundColor: `${h.color}15`,
                            color: h.color,
                            border: `1px solid ${h.color}40`,
                          }}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-xs tracking-wide">
                            {h.title}
                          </h3>
                          <span className="text-[9px] text-slate-400 font-sans block">
                            {h.subtitle}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-2 pt-2 border-t border-[#141e30] text-[11px] font-sans">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                          Monitored Vitals:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {h.affectedMetrics.map((m, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10192a] text-slate-300 border border-[#1d2a40]"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                          Clinical Rationale:
                        </span>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {h.whyMeasured}
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-[#0e1726] border border-[#1a283f] text-[10px] font-mono">
                        <span className="text-amber-400 font-bold block mb-0.5">Threshold Alert:</span>
                        <span className="text-slate-300">{h.clinicalThreshold}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#141e30] text-[10px]">
                    <span className="text-emerald-400 font-mono font-bold block mb-1">Preventive Actions:</span>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5 font-sans">
                      {h.countermeasures.slice(0, 2).map((cm, idx) => (
                        <li key={idx} className="leading-tight">{cm}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subsystem notice for Skeletal & Immune sensors */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-2.5 font-sans text-xs text-cyan-200">
            <Activity className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <div>
              <strong>Subsystem Sensor Coverage:</strong> Cardiac, Respiration, Radiation Flux, Cabin CO2, and Sleep telemetry are actively streamed. Skeletal bone density (DEXA) and cellular immune panels are assessed via scheduled periodic blood/saliva assays; continuous real-time suit telemetry is not currently attached for these two sub-systems.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#182337] bg-[#070b13] flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400 text-[11px]">NASA Human Research Program (HRP) Compliant</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold transition-colors"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
