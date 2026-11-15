"use client";

import { useState } from "react";
import {
  X,
  Radio,
  Wind,
  Moon,
  Heart,
  Droplets,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Search,
  BookOpen,
} from "lucide-react";

export interface MedicalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHazard?: string;
}

interface HazardGuide {
  id: string;
  name: string;
  subtitle: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE";
  icon: any;
  accentColor: string;
  badgeBg: string;
  whyDangerous: string;
  immediateActions: string[];
  equipmentNeeded: string;
  thresholdsInfo: string;
}

const HAZARDS: HazardGuide[] = [
  {
    id: "radiation",
    name: "Radiatsiya Bo'roni (Solar Storm / GCR)",
    subtitle: "Ionlashtiruvchi quyosh va kosmik nurlanish xavfi",
    severity: "CRITICAL",
    icon: Radio,
    accentColor: "text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/40",
    whyDangerous:
      "Kosmik nurlanish hujayralar va DNKni to'g'ridan-to'g'ri shikastlaydi. Astronavt o'tkir nurlanish kasalligi (ko'ngil aynishi, holsizlik, immunitet halokati) va qon hujayralarining keskin kamayishi xavfiga uchraydi. Kosmik stansiya tashqarisida yoki qalqonsiz modulda bu bir necha soat ichida halokatli bo'lishi mumkin.",
    immediateActions: [
      "1. DARHOL OCHIQ KOSMOS (EVA) FAOLIYATINI TO'XTATING va havo shlyuziga qayting.",
      "2. Stansiyaning eng qalin himoyalangan 'Storm Shelter' (masalan, suv baklari yoki polietilen devorlari bilan o'ralgan yotoqxona) moduliga o'ting.",
      "3. Shaxsiy dozimetr (EPD) ko'rsatkichini Mission Control bazasiga xabar qiling.",
      "4. Tibbiy qutidagi radioprotektor (antioksidant va nurlanishga qarshi preparatlar) tabletkalarini shifokor protokoli bo'yicha qabul qiling.",
      "5. Boshqa ekipaj a'zolarining dozimetrlarini o'zaro solishtirib chiqaring.",
    ],
    equipmentNeeded: "Elektron Shaxsiy Dozimetr (EPD), Suv devorli boshpana, Radioprotektor to'plami.",
    thresholdsInfo: "Normal: < 0.3 mSv/h | Ogohlantirish: > 1.0 mSv/h | Kritik: > 2.0 mSv/h",
  },
  {
    id: "co2",
    name: "CO2 Ko'tarilishi (Kabina Giperkapniyasi)",
    subtitle: "Kabina gaz almashinuvi va karbonat angidrid yig'ilishi",
    severity: "CRITICAL",
    icon: Wind,
    accentColor: "text-cyan-400",
    badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/40",
    whyDangerous:
      "Mikrogravitatsiyada astronavt chiqaradigan nafas havosi uning boshi atrofida turg'un 'CO2 cho'ntagi' hosil qiladi. Kabinada CO2 0.08% dan oshsa, bosh og'rig'i, nafas qisishi, diqqat tarqoqligi va jiddiy qaror qabul qilishda xatolar boshlanadi. 0.1% dan yuqorisi ong chalkashishi va hushdan ketishga sabab bo'ladi.",
    immediateActions: [
      "1. Zudlik bilan kislorod niqobini (Quick-Don Mask) taqing yoki toza shamollatiladigan modulga o'ting.",
      "2. CDRA (Carbon Dioxide Removal Assembly) tizimini 'MAXIMUM PURGE' rejimiga o'tkazing.",
      "3. Kabina sirkulyatsiya ventilyatorlari ishlayotganini va havo oqimi to'silmaganini tekshiring.",
      "4. Kuchli jismoniy mashqlarni darhol to'xtating (chunki mashq CO2 ajralishini 3 barobar oshiradi).",
      "5. Agar alomatlar (ko'ngil aynishi, bosh aylanishi) saqlansa, portativ O2 ballonidan foydalaning.",
    ],
    equipmentNeeded: "O2 Favqulodda Niqobi, Portativ CO2 Detektori, CDRA Scrubber boshqaruvi.",
    thresholdsInfo: "Normal: < 0.05% | Ogohlantirish: > 0.07% | Kritik: > 0.10%",
  },
  {
    id: "sleep",
    name: "Uyqu Qarzi va Kognitiv Charchoq",
    subtitle: "Sirkad ritm buzilishi va neyro-psixologik zo'riqish",
    severity: "MODERATE",
    icon: Moon,
    accentColor: "text-purple-400",
    badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/40",
    whyDangerous:
      "Stansiyada har 90 daqiqada quyosh chiqishi va shovqin sirkad ritmni buzadi. Surunkali uyqu qarzi (sleep debt > 5 soat) miya faoliyatini kuchli sekinlashtiradi. Bu holat 0.08% qon alkogol mastligiga teng bo'lib, dokovka yoki boshqaruv operatsiyalarida kritik xatolarga olib kelishi mumkin.",
    immediateActions: [
      "1. Kritik robototexnika, kosmik kema boshqaruvi yoki EVA vazifalarini boshqa dam olgan ekipaj a'zosiga topshiring.",
      "2. 20-30 daqiqalik nazoratli 'Power Nap' (qisqa orom) oling.",
      "3. Moduldagi yorug'likni 'Sirkad Tungi Spektr'ga (qizil/sariq, ko'k nurni filtrlovchi) o'tkazing.",
      "4. Kofein qabul qilishni uyqudan kamida 6 soat oldin to'xtating.",
      "5. Shovqin to'suvchi maxsus quloqchinlar va ko'z niqobidan foydalanib 8 soatlik reabilitatsion uyqu rejasini tuzing.",
    ],
    equipmentNeeded: "Sirkad yoritgich boshqaruvi, Shovqin to'suvchi quloqchin, Kognitiv test (PVT).",
    thresholdsInfo: "Normal: < 2.0 soat qarz | Ogohlantirish: > 4.0 soat | Kritik: > 6.0 soat",
  },
  {
    id: "heart",
    name: "Yurak Yuklamasi va Taxikardiya",
    subtitle: "Yurak qon-tomir tizimi zo'riqishi va gemodinamik siljish",
    severity: "HIGH",
    icon: Heart,
    accentColor: "text-rose-400",
    badgeBg: "bg-rose-500/10 text-rose-300 border-rose-500/40",
    whyDangerous:
      "Vaznsizlikda 2 litrgacha qon tananing pastki qismidan ko'krak va bosh qismiga siljiydi (fluid shift). Yurak kengayadi, qon bosimi va ritmi o'zgaradi. Yuqori puls (HR > 120 bpm) uzoq davom etsa, miokard kislorod ochligiga uchraydi va hushdan ketish xavfi yuzaga keladi.",
    immediateActions: [
      "1. Mashg'ulot yoki yuklamani to'xtating va fiksator tasmalar yordamida tinch, bo'shashgan holatga o'ting.",
      "2. '4-7-8' diafragma nafas olish texnikasini bajaring (4 soniya nafas olish, 7 soniya ushlash, 8 soniya chiqarish).",
      "3. Portativ EKG/Pulsoksimetrni ulab, aritmiya belgilarini tekshiring.",
      "4. Elektrolitli iliq suv iching (suvsizlanish yurak urishini yanada tezlashtiradi).",
      "5. Agar yurak urishi 15 daqiqada pasaymasa, bort shifokori bilan telemeditsina seansini yoqing.",
    ],
    equipmentNeeded: "Avtomatik qon bosimi o'lchagich, Portativ 12-kanalli EKG, Elektrolit paketlari.",
    thresholdsInfo: "Normal: 60-100 bpm | Ogohlantirish: > 100 bpm | Kritik: > 120 bpm",
  },
  {
    id: "sugar",
    name: "Qon Shakari va Metabolik Og'ish",
    subtitle: "Gipoglikemiya (past shakar) va Giperglikemiya (yuqori shakar)",
    severity: "HIGH",
    icon: Droplets,
    accentColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
    whyDangerous:
      "Mikrogravitatsiyada insulin sezuvchanligi va moddalar almashinuvi sekinlashadi. Qon shakari 70 mg/dL dan tushib ketsa (Gipoglikemiya) astronavtda titroq, sovuq ter, ong xiralashishi va kutilmagan hushdan ketish sodir bo'ladi. Yuqori shakar (> 180 mg/dL) esa suvsizlanish va metabolik kislotalanishni keltirib chiqaradi.",
    immediateActions: [
      "1. AGAR SHAKAR < 70 mg/dL BO'LSA: Darhol tez so'riluvchi 15-20g glyukoza tabletkasi yoki meva sharbatini iste'mol qiling.",
      "2. 15 daqiqa kuting va glyukometr bilan qon shakarini qayta tekshiring (15-15 qoidasi).",
      "3. AGAR SHAKAR > 160 mg/dL BO'LSA: Uglevodli ovqatlarni to'xtating, kamida 500 ml toza suv iching va engil yurish mashqini bajaring.",
      "4. Astronavt hushini yo'qotsa: Unga og'izdan hech narsa bermang, darhol favqulodda Glukagon inyeksiyasini tayyorlang.",
      "5. Kunlik parhez va energiya balansini qayta ko'rib chiqing.",
    ],
    equipmentNeeded: "Kosmik Glyukometr & Test tasmachalari, Favqulodda Glyukoza tabletkalari, Glukagon to'plami.",
    thresholdsInfo: "Normal: 70 - 110 mg/dL | Ogohlantirish: < 70 yoki > 140 | Kritik: < 54 yoki > 180",
  },
];

export default function MedicalGuideModal({
  isOpen,
  onClose,
  initialHazard,
}: MedicalGuideModalProps) {
  const [selectedId, setSelectedId] = useState<string>(
    initialHazard || HAZARDS[0].id
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredHazards = HAZARDS.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.whyDangerous.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const active =
    HAZARDS.find((h) => h.id === selectedId) || filteredHazards[0] || HAZARDS[0];

  const handleCopy = () => {
    const text = `[ORBIT SPACE MEDICAL GUIDE: ${active.name}]\n\nNIMA UCHUN XAVFLI?\n${active.whyDangerous}\n\nZUDLIK BILAN NIMA QILISH KERAK?\n${active.immediateActions.join(
      "\n"
    )}\n\nChegaralar: ${active.thresholdsInfo}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-[#090e18] border border-[#1e2a40] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#141f33] flex items-center justify-between bg-[#0b1220]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-wide text-white">
                  SPACE MEDICAL GUIDE &amp; FIRST-AID
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-400 bg-cyan-500/10">
                  CREW PROTOCOL v1.2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Astronavtlar uchun sodda tibbiy qo&apos;llanma va favqulodda harakatlar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-[#111c2e] hover:bg-[#192842] border border-[#1e2d46] text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Ko'rsatmalarni nusxalash"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Nusxalandi</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nusxa olish</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#111c2e] hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar tabs + Detail view */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Navigation Tabs */}
          <div className="w-full md:w-72 border-r border-[#141f33] bg-[#070b13]/60 p-3 flex flex-col gap-2 shrink-0 overflow-y-auto">
            {/* Search Input */}
            <div className="relative mb-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Xavfni qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0c1424] border border-[#1a2840] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="space-y-1.5">
              {filteredHazards.map((h) => {
                const isSelected = h.id === active.id;
                const Icon = h.icon;
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedId(h.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-[#101b2e] border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white"
                        : "bg-[#090f1c]/50 border-transparent hover:bg-[#0d1728] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg bg-[#070c16] border ${
                        isSelected ? "border-cyan-500/40 text-cyan-400" : "border-[#19263c] text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center justify-between">
                        <span>{h.name.split(" ")[0]} {h.name.split(" ")[1]}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded border font-mono ${h.badgeBg}`}>
                          {h.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {h.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-300/80 leading-relaxed">
              💡 <strong>Eslatma:</strong> Barcha qadamlar NASA Space Medicine va ISS Flight Surgeon yo&apos;riqnomalari asosida soddalashtirilgan.
            </div>
          </div>

          {/* Right Main Detail Guide */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#090e18]">
            {/* Title & Severity Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#142036] pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl bg-[#0e192c] border border-cyan-500/30 ${active.accentColor}`}
                >
                  <active.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {active.name}
                  </h3>
                  <p className="text-xs text-slate-400">{active.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${active.badgeBg}`}>
                  {active.severity} SEVERITY
                </span>
              </div>
            </div>

            {/* Threshold limits box */}
            <div className="p-3 rounded-xl bg-[#0b1424] border border-[#1a2942] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Nazorat Ko&apos;rsatkichlari:</span>
              <span className="text-cyan-300 font-semibold">{active.thresholdsInfo}</span>
            </div>

            {/* Section 1: Nima uchun bu xavfli? */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>NIMA UCHUN BU XAVFLI? (Sodda tushuntirish)</span>
              </div>
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-slate-200 leading-relaxed">
                {active.whyDangerous}
              </div>
            </div>

            {/* Section 2: Zudlik bilan nima qilish kerak? (Step-by-step checklist) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ZUDLIK BILAN NIMA QILISH KERAK? (Qadam-baqadam ko&apos;rsatma)</span>
              </div>
              <div className="space-y-2">
                {active.immediateActions.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#0c1424] border border-[#16253c] hover:border-emerald-500/30 transition-colors flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-200 font-medium leading-relaxed">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Kerakli uskunalar */}
            <div className="p-3 rounded-xl bg-[#080d17] border border-[#142036] flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Kerakli Uskunalar:</span>
              <span className="text-slate-200 font-semibold">{active.equipmentNeeded}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#141f33] bg-[#070c16] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Autonomous Medical Guidance System Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
          >
            Tushundim / Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
