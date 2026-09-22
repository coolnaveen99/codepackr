// src/components/CodepackrFamilyBar.tsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ExternalLink, Code2, BookOpen, Scale, TrendingUp, Sparkles } from "lucide-react";
import { CODEPACKR_FAMILY, CURRENT_PRODUCT, FamilyProductId } from "../lib/codepackr-family";

const ACTIVE_CLASS: Record<FamilyProductId, string> = {
  tools:   "text-cyan-400 font-semibold border-b-2 border-cyan-400 shadow-[0_2px_8px_-2px_rgba(6,182,212,0.4)]",
  study:   "text-indigo-600 font-semibold border-b-2 border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40",
  law:     "text-slate-900 dark:text-slate-100 font-semibold border-b-2 border-slate-800 dark:border-slate-200",
  finance: "text-emerald-700 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40",
  astro:   "text-amber-800 dark:text-amber-300 font-semibold border-b-2 border-amber-600 bg-amber-50/80 dark:bg-amber-950/50",
};

function FamilyIcon({ id, size = 14 }: { id: FamilyProductId; size?: number }) {
  const p = { size, strokeWidth: 1.75, className: "shrink-0", "aria-hidden": "true" as const };
  switch (id) {
    case "tools":   return <Code2 {...p} />;
    case "study":   return <BookOpen {...p} />;
    case "law":     return <Scale {...p} />;
    case "finance": return <TrendingUp {...p} />;
    case "astro":   return <Sparkles {...p} />;
    default:        return null;
  }
}

export interface CodepackrFamilyBarProps {
  language?: "en" | "ta";
  showIcons?: boolean;
  linkTarget?: "_self" | "_blank";
  className?: string;
}

export function CodepackrFamilyBar({
  language = "en",
  showIcons = true,
  linkTarget = "_self",
  className = "",
}: CodepackrFamilyBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setMobileOpen(false);
    }
    if (mobileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMobileOpen(false); }
    if (mobileOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const currentItem = CODEPACKR_FAMILY.find((item) => item.id === CURRENT_PRODUCT);

  return (
    <nav id="codepackr-family-navigation" aria-label="Codepackr Family"
      className={`relative z-40 w-full text-[12px] select-none transition-colors duration-200 bg-slate-950 border-b border-slate-800 text-slate-400 ${className}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-9 flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex items-center gap-1.5 opacity-90 font-semibold tracking-tight">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            <span>Codepackr Family</span>
          </span>
          <span className="text-[10px] opacity-40 hidden md:inline">|</span>
          <span className="text-[11px] opacity-60 hidden md:inline font-normal">Ecosystem</span>
        </div>
        <ul className="hidden sm:flex items-center gap-1 lg:gap-2 h-full">
          {CODEPACKR_FAMILY.map((item) => {
            const isCurrent = item.id === CURRENT_PRODUCT;
            const labelText = language === "ta" && item.labelTa ? item.labelTa : item.label;
            return (
              <li key={item.id} className="h-full flex items-center">
                {isCurrent ? (
                  <span aria-current="page" className={`h-full inline-flex items-center gap-1.5 px-2.5 py-0 text-[12px] cursor-default ${ACTIVE_CLASS[CURRENT_PRODUCT]}`}>
                    {showIcons && <FamilyIcon id={item.id} size={14} />}<span>{labelText}</span>
                    <span className="inline-block w-1 h-1 rounded-full bg-current opacity-80" />
                  </span>
                ) : (
                  <a href={item.href} target={linkTarget} rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
                    className="h-full inline-flex items-center gap-1.5 px-2.5 py-0 text-[12px] opacity-75 hover:opacity-100 transition-all rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current text-slate-300 hover:text-cyan-300">
                    {showIcons && <FamilyIcon id={item.id} size={14} />}<span>{labelText}</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
        <div className="sm:hidden relative" ref={dropdownRef}>
          <button type="button" aria-expanded={mobileOpen} aria-haspopup="true" aria-label="Toggle Codepackr Family sites menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center gap-1.5 py-1 px-2 min-h-[44px] rounded text-[11px] font-medium border border-current/20 bg-current/5">
            {showIcons && currentItem && <FamilyIcon id={currentItem.id} size={13} />}
            <span>{language === "ta" && currentItem?.labelTa ? currentItem.labelTa : currentItem?.label}</span>
            <ChevronDown size={13} className={`transition-transform duration-200 ${mobileOpen ? "rotate-180" : ""}`} />
          </button>
          {mobileOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 py-1.5 rounded-lg shadow-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 z-50">
              <div className="px-3 py-1.5 border-b border-black/5 dark:border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-400">Codepackr Network</div>
              <ul className="py-1">
                {CODEPACKR_FAMILY.map((item) => {
                  const isCurrent = item.id === CURRENT_PRODUCT;
                  const labelText = language === "ta" && item.labelTa ? item.labelTa : item.label;
                  return (
                    <li key={item.id}>
                      {isCurrent ? (
                        <div className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-[12px] font-medium bg-slate-100 dark:bg-slate-800/70" aria-current="page">
                          <div className="flex items-center gap-2"><FamilyIcon id={item.id} size={15} /><div><div className="font-semibold">{labelText}</div><div className="text-[10px] opacity-70">{item.description}</div></div></div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-current/10">Current</span>
                        </div>
                      ) : (
                        <a href={item.href} target={linkTarget} rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
                          className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center gap-2"><FamilyIcon id={item.id} size={15} /><div><div className="font-medium">{labelText}</div><div className="text-[10px] opacity-60">{item.description}</div></div></div>
                          <ExternalLink size={11} className="opacity-50" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
