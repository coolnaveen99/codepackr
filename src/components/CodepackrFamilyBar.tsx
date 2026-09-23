// src/components/CodepackrFamilyBar.tsx
import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ExternalLink,
  Code2,
  BookOpen,
  Scale,
  TrendingUp,
  Sparkles,
  LayoutGrid,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  CODEPACKR_FAMILY,
  CURRENT_PRODUCT,
  FamilyProductId,
  FamilyLink,
} from "../lib/codepackr-family";

const ACTIVE_PILL_STYLES: Record<FamilyProductId, { pill: string; dot: string; badge: string }> = {
  tools: {
    pill: "text-blue-600 dark:text-blue-400 bg-blue-500/10 ring-1 ring-inset ring-blue-500/30 font-semibold shadow-xs",
    dot: "bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.7)]",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  study: {
    pill: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/30 font-semibold shadow-xs",
    dot: "bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.7)]",
    badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  },
  law: {
    pill: "text-amber-700 dark:text-amber-400 bg-amber-500/10 ring-1 ring-inset ring-amber-500/30 font-semibold shadow-xs",
    dot: "bg-amber-600 dark:bg-amber-400 shadow-[0_0_8px_rgba(217,119,6,0.7)]",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  finance: {
    pill: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/30 font-semibold shadow-xs",
    dot: "bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  astro: {
    pill: "text-amber-700 dark:text-amber-400 bg-amber-500/10 ring-1 ring-inset ring-amber-500/30 font-semibold shadow-xs",
    dot: "bg-amber-600 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
};

function FamilyIcon({ id, size = 14, className = "" }: { id: FamilyProductId; size?: number; className?: string }) {
  const p = { size, strokeWidth: 2, className: `shrink-0 ${className}`, "aria-hidden": "true" as const };
  switch (id) {
    case "tools":
      return <Code2 {...p} />;
    case "study":
      return <BookOpen {...p} />;
    case "law":
      return <Scale {...p} />;
    case "finance":
      return <TrendingUp {...p} />;
    case "astro":
      return <Sparkles {...p} />;
    default:
      return null;
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
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const launcherRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (launcherRef.current && !launcherRef.current.contains(e.target as Node)) {
        setLauncherOpen(false);
      }
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (launcherOpen || mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [launcherOpen, mobileOpen]);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLauncherOpen(false);
        setMobileOpen(false);
      }
    }
    if (launcherOpen || mobileOpen) {
      document.addEventListener("keydown", onKeyDown);
    }
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [launcherOpen, mobileOpen]);

  const currentItem = CODEPACKR_FAMILY.find((item) => item.id === CURRENT_PRODUCT);
  const currentStyles = ACTIVE_PILL_STYLES[CURRENT_PRODUCT];

  return (
    <nav
      id="codepackr-family-navigation"
      aria-label="Codepackr Family Ecosystem"
      className={`relative z-50 w-full select-none text-[12px] font-sans border-b backdrop-blur-md transition-colors bg-white/90 dark:bg-slate-950/90 border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 ${className}`}
    >
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 h-9.5 flex items-center justify-between gap-3">
        {/* Left: Brand Identity & Network Beacon */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://codepackr.com"
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
            title="Codepackr Ecosystem"
          >
            {/* 5-Nodes Network Emblem */}
            <div className="relative flex items-center justify-center size-5 rounded-md bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-xs group-hover:scale-105 transition-transform">
              <div className="size-full bg-white dark:bg-slate-950 rounded-[3px] flex items-center justify-center">
                <span className="size-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-semibold tracking-tight text-slate-800 dark:text-slate-100">
              <span className="font-bold">Codepackr</span>
              <span className="text-slate-400 dark:text-slate-500 font-normal">Family</span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>5 Free Suites</span>
          </div>
        </div>

        {/* Center: Desktop Navigation Capsules */}
        <ul className="hidden sm:flex items-center gap-1 lg:gap-1.5 h-full">
          {CODEPACKR_FAMILY.map((item) => {
            const isCurrent = item.id === CURRENT_PRODUCT;
            const labelText = language === "ta" && item.labelTa ? item.labelTa : item.label;

            return (
              <li key={item.id} className="h-full flex items-center">
                {isCurrent ? (
                  <span
                    aria-current="page"
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] cursor-default transition-all ${currentStyles.pill}`}
                  >
                    {showIcons && <FamilyIcon id={item.id} size={13} />}
                    <span>{labelText}</span>
                    <span className={`size-1.5 rounded-full ${currentStyles.dot}`} />
                  </span>
                ) : (
                  <a
                    href={item.href}
                    target={linkTarget}
                    rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
                    title={item.tagline}
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {showIcons && (
                      <FamilyIcon
                        id={item.id}
                        size={13}
                        className="transition-transform group-hover:scale-115 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                      />
                    )}
                    <span>{labelText}</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>

        {/* Right: Ecosystem App Launcher Popover */}
        <div className="flex items-center gap-2">
          {/* Desktop Launcher Toggle */}
          <div className="relative hidden sm:block" ref={launcherRef}>
            <button
              type="button"
              onClick={() => setLauncherOpen((prev) => !prev)}
              aria-expanded={launcherOpen}
              aria-haspopup="true"
              aria-label="Toggle Codepackr App Launcher"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer ${
                launcherOpen
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-slate-300 dark:ring-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <LayoutGrid size={13} className="shrink-0" />
              <span className="hidden lg:inline">Ecosystem</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${launcherOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Desktop Launcher Popover Card */}
            {launcherOpen && (
              <div className="absolute right-0 top-full mt-2 w-84 p-2.5 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                      Codepackr Ecosystem
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">100% In-Browser</span>
                </div>

                <div className="space-y-1">
                  {CODEPACKR_FAMILY.map((item) => {
                    const isCurrent = item.id === CURRENT_PRODUCT;
                    const labelText = language === "ta" && item.labelTa ? item.labelTa : item.label;

                    return (
                      <div key={item.id}>
                        {isCurrent ? (
                          <div
                            aria-current="page"
                            className="flex items-center justify-between p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-slate-900 dark:text-slate-100"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`size-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${item.gradient} shadow-xs shrink-0`}
                              >
                                <FamilyIcon id={item.id} size={15} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 font-semibold text-[12px] text-blue-600 dark:text-blue-400">
                                  <span>{labelText}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono uppercase bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
                                    Current
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0 mr-1" />
                          </div>
                        ) : (
                          <a
                            href={item.href}
                            target={linkTarget}
                            rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
                            className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all text-slate-700 dark:text-slate-300"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`size-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${item.gradient} opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all shadow-xs shrink-0`}
                              >
                                <FamilyIcon id={item.id} size={15} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-[12px] text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {labelText}
                                </div>
                                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <ExternalLink
                              size={12}
                              className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mr-1"
                            />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span>Privacy First</span>
                  </div>
                  <span>Zero Server Logging</span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Switcher Drawer Trigger */}
          <div className="sm:hidden relative" ref={mobileRef}>
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-haspopup="true"
              aria-label="Toggle Codepackr Family Menu"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[11px] font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {showIcons && currentItem && <FamilyIcon id={currentItem.id} size={13} />}
              <span>{language === "ta" && currentItem?.labelTa ? currentItem.labelTa : currentItem?.label}</span>
              <span className={`size-1.5 rounded-full ${currentStyles.dot}`} />
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${mobileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Mobile Dropdown Menu */}
            {mobileOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 p-2 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Codepackr Family
                  </span>
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-mono font-medium">
                    100% Client-Side
                  </span>
                </div>

                <div className="space-y-1">
                  {CODEPACKR_FAMILY.map((item) => {
                    const isCurrent = item.id === CURRENT_PRODUCT;
                    const labelText = language === "ta" && item.labelTa ? item.labelTa : item.label;

                    return (
                      <div key={item.id}>
                        {isCurrent ? (
                          <div
                            aria-current="page"
                            className="flex items-center justify-between p-2 rounded-xl bg-blue-500/10 text-slate-900 dark:text-slate-100 font-semibold"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`size-7.5 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${item.gradient} shadow-xs shrink-0`}
                              >
                                <FamilyIcon id={item.id} size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12px] text-blue-600 dark:text-blue-400 font-bold">
                                  {labelText}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {item.description}
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold uppercase bg-blue-500/20 text-blue-700 dark:text-blue-300">
                              Active
                            </span>
                          </div>
                        ) : (
                          <a
                            href={item.href}
                            target={linkTarget}
                            rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`size-7.5 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${item.gradient} opacity-90 shadow-xs shrink-0`}
                              >
                                <FamilyIcon id={item.id} size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                                  {labelText}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  {item.description}
                                </div>
                              </div>
                            </div>
                            <ExternalLink size={12} className="opacity-40" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
