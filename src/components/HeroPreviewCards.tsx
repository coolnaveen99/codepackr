import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { ToolDef } from '../types';
import { TOOLS } from '../data/tools';
import { HERO_TOOL_ADS, HeroToolAd, BadgeTone, AccentFamily } from '../data/heroToolAds';

interface HeroPreviewCardsProps {
  onSelectTool: (tool: ToolDef, initialPayload?: string) => void;
}

const glowClassForAccent = (accent: AccentFamily): string => {
  switch (accent) {
    case 'teal':
      return 'hover:border-teal-500/70 hover:shadow-[0_20px_45px_-12px_rgba(20,184,166,0.25)]';
    case 'purple':
      return 'hover:border-purple-500/70 hover:shadow-[0_20px_45px_-12px_rgba(168,85,247,0.25)]';
    case 'emerald':
      return 'hover:border-emerald-500/70 hover:shadow-[0_20px_45px_-12px_rgba(16,185,129,0.25)]';
    case 'amber':
      return 'hover:border-amber-500/70 hover:shadow-[0_20px_45px_-12px_rgba(245,158,11,0.25)]';
    case 'orange':
      return 'hover:border-orange-500/70 hover:shadow-[0_20px_45px_-12px_rgba(249,115,22,0.25)]';
    case 'cyan':
      return 'hover:border-cyan-500/70 hover:shadow-[0_20px_45px_-12px_rgba(6,182,212,0.25)]';
    case 'rose':
      return 'hover:border-rose-500/70 hover:shadow-[0_20px_45px_-12px_rgba(244,63,94,0.25)]';
    case 'indigo':
      return 'hover:border-indigo-500/70 hover:shadow-[0_20px_45px_-12px_rgba(99,102,241,0.25)]';
    case 'blue':
    default:
      return 'hover:border-blue-500/70 hover:shadow-[0_20px_45px_-12px_rgba(37,99,235,0.25)]';
  }
};

const badgeStyleForTone = (tone: BadgeTone): string => {
  switch (tone) {
    case 'teal':
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    case 'purple':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'emerald':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'amber':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'orange':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    case 'cyan':
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    case 'rose':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'indigo':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    case 'blue':
    default:
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  }
};

const iconBgForAccent = (accent: AccentFamily): string => {
  switch (accent) {
    case 'teal':
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
    case 'purple':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case 'emerald':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'amber':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'orange':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    case 'cyan':
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
    case 'rose':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    case 'indigo':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    case 'blue':
    default:
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  }
};

const ctaColorForAccent = (accent: AccentFamily): string => {
  switch (accent) {
    case 'teal':
      return 'text-teal-600 dark:text-teal-400';
    case 'purple':
      return 'text-purple-600 dark:text-purple-400';
    case 'emerald':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'amber':
      return 'text-amber-600 dark:text-amber-400';
    case 'orange':
      return 'text-orange-600 dark:text-orange-400';
    case 'cyan':
      return 'text-cyan-600 dark:text-cyan-400';
    case 'rose':
      return 'text-rose-600 dark:text-rose-400';
    case 'indigo':
      return 'text-indigo-600 dark:text-indigo-400';
    case 'blue':
    default:
      return 'text-blue-600 dark:text-blue-400';
  }
};

export const HeroPreviewCards: React.FC<HeroPreviewCardsProps> = ({ onSelectTool }) => {
  const [slotAIndex, setSlotAIndex] = useState(0);
  const [slotBIndex, setSlotBIndex] = useState(1);
  const [slotCIndex, setSlotCIndex] = useState(2);

  const [fadingA, setFadingA] = useState(false);
  const [fadingB, setFadingB] = useState(false);
  const [fadingC, setFadingC] = useState(false);

  const isHoveredARef = useRef(false);
  const isHoveredBRef = useRef(false);
  const isHoveredCRef = useRef(false);
  const cursorRef = useRef(3);

  const slotAIndexRef = useRef(slotAIndex);
  slotAIndexRef.current = slotAIndex;

  const slotBIndexRef = useRef(slotBIndex);
  slotBIndexRef.current = slotBIndex;

  const slotCIndexRef = useRef(slotCIndex);
  slotCIndexRef.current = slotCIndex;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleLaunch = useCallback(
    (toolId: string, initialPayload?: string) => {
      const target = TOOLS.find((t) => t.id === toolId);
      if (target) {
        onSelectTool(target, initialPayload);
      }
    },
    [onSelectTool]
  );

  const rotateSlotA = useCallback(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    if (isHoveredARef.current) return;
    if (prefersReducedMotion) return;

    setFadingA(true);
    setTimeout(() => {
      setSlotAIndex(() => {
        let next = cursorRef.current % HERO_TOOL_ADS.length;
        cursorRef.current = (cursorRef.current + 1) % HERO_TOOL_ADS.length;
        let attempts = 0;
        while (
          (next === slotBIndexRef.current || next === slotCIndexRef.current) &&
          attempts < HERO_TOOL_ADS.length
        ) {
          next = cursorRef.current % HERO_TOOL_ADS.length;
          cursorRef.current = (cursorRef.current + 1) % HERO_TOOL_ADS.length;
          attempts++;
        }
        return next;
      });
      setFadingA(false);
    }, 220);
  }, [prefersReducedMotion]);

  const rotateSlotB = useCallback(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    if (isHoveredBRef.current) return;
    if (prefersReducedMotion) return;

    setFadingB(true);
    setTimeout(() => {
      setSlotBIndex(() => {
        let next = cursorRef.current % HERO_TOOL_ADS.length;
        cursorRef.current = (cursorRef.current + 1) % HERO_TOOL_ADS.length;
        let attempts = 0;
        while (
          (next === slotAIndexRef.current || next === slotCIndexRef.current) &&
          attempts < HERO_TOOL_ADS.length
        ) {
          next = cursorRef.current % HERO_TOOL_ADS.length;
          cursorRef.current = (cursorRef.current + 1) % HERO_TOOL_ADS.length;
          attempts++;
        }
        return next;
      });
      setFadingB(false);
    }, 220);
  }, [prefersReducedMotion]);

  const rotateSlotC = useCallback(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    if (isHoveredCRef.current) return;
    if (prefersReducedMotion) return;

    setFadingC(true);
    setTimeout(() => {
      setSlotCIndex(() => {
        let next = cursorRef.current % HERO_TOOL_ADS.length;
        cursorRef.current = (cursorRef.current + 1) % HERO_TOOL_ADS.length;
        let attempts = 0;
        while (
          (next === slotAIndexRef.current || next === slotBIndexRef.current) &&
          attempts < HERO_TOOL_ADS.length
        ) {
          next = cursorRef.current % HERO_TOOL_ADS.length;
          cursorRef.current = (cursorRef.current + 1) % HERO_TOOL_ADS.length;
          attempts++;
        }
        return next;
      });
      setFadingC(false);
    }, 220);
  }, [prefersReducedMotion]);

  // Delay time increased by 3.5s (from 4000ms to 7500ms) with evenly staggered 2500ms transitions across the 3 slots
  useEffect(() => {
    if (prefersReducedMotion) return;

    const ROTATION_INTERVAL = 7500;
    const STAGGER_STEP = 2500;

    const intervalA = setInterval(() => {
      rotateSlotA();
    }, ROTATION_INTERVAL);

    let intervalB: NodeJS.Timeout | null = null;
    const timeoutB = setTimeout(() => {
      rotateSlotB();
      intervalB = setInterval(() => {
        rotateSlotB();
      }, ROTATION_INTERVAL);
    }, STAGGER_STEP);

    let intervalC: NodeJS.Timeout | null = null;
    const timeoutC = setTimeout(() => {
      rotateSlotC();
      intervalC = setInterval(() => {
        rotateSlotC();
      }, ROTATION_INTERVAL);
    }, STAGGER_STEP * 2);

    return () => {
      clearInterval(intervalA);
      clearTimeout(timeoutB);
      clearTimeout(timeoutC);
      if (intervalB) clearInterval(intervalB);
      if (intervalC) clearInterval(intervalC);
    };
  }, [rotateSlotA, rotateSlotB, rotateSlotC, prefersReducedMotion]);

  const adA = HERO_TOOL_ADS[slotAIndex] || HERO_TOOL_ADS[0];
  const adB = HERO_TOOL_ADS[slotBIndex] || HERO_TOOL_ADS[1];
  const adC = HERO_TOOL_ADS[slotCIndex] || HERO_TOOL_ADS[2];

  const renderCard = (
    ad: HeroToolAd,
    slotKey: 'A' | 'B' | 'C',
    floatingClass: string,
    isFading: boolean,
    onMouseEnter: () => void,
    onMouseLeave: () => void
  ) => {
    const IconComponent = ad.icon;

    return (
      <div
        key={`hero-slot-${slotKey}`}
        id={`hero-card-slot-${slotKey.toLowerCase()}`}
        role="button"
        tabIndex={0}
        onClick={() => handleLaunch(ad.toolId, ad.launchPayload)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLaunch(ad.toolId, ad.launchPayload);
          }
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label={`${ad.title}: ${ad.badge}. Click to open ${ad.cta}`}
        className={`${floatingClass} group relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/90 backdrop-blur-md p-3 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer h-[156px] flex flex-col justify-between select-none ${glowClassForAccent(
          ad.accent
        )}`}
      >
        <div
          className={`flex flex-col justify-between h-full transition-all duration-200 ease-in-out ${
            isFading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
          }`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-[color:var(--border)]/60 text-xs">
            <div className="flex items-center gap-2 font-mono font-bold text-[color:var(--ink)] truncate pr-2">
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${iconBgForAccent(
                  ad.accent
                )}`}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">{ad.title}</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold border shrink-0 whitespace-nowrap ${badgeStyleForTone(
                ad.badgeTone
              )}`}
            >
              {ad.badgeTone === 'emerald' && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
              <span>{ad.badge}</span>
            </span>
          </div>

          {/* Monospace Code Preview */}
          <div className="font-mono text-[10.5px] leading-relaxed text-[color:var(--ink-muted)] bg-[color:var(--surface-elevated)] p-2 rounded-xl border border-[color:var(--border)]/50 h-[68px] flex flex-col justify-center overflow-hidden">
            {ad.body}
          </div>

          {/* Card Footer / CTA */}
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium opacity-85 group-hover:opacity-100 transition-opacity">
            <span className="text-[color:var(--ink-muted)] text-[10px] truncate pr-2">{ad.footerLeft}</span>
            <span
              className={`inline-flex items-center gap-1 font-bold shrink-0 whitespace-nowrap group-hover:translate-x-1 transition-transform ${ctaColorForAccent(
                ad.accent
              )}`}
            >
              {ad.cta} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      aria-label="Interactive tool previews"
      className="hidden lg:flex flex-col gap-3 relative w-[320px] xl:w-[360px] shrink-0 pointer-events-auto select-none"
    >
      {/* Decorative ambient backdrop glow behind floating cards */}
      <div
        className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-teal-500/10 blur-xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {renderCard(
        adA,
        'A',
        'hero-floating-card-1',
        fadingA,
        () => {
          isHoveredARef.current = true;
        },
        () => {
          isHoveredARef.current = false;
        }
      )}

      {renderCard(
        adB,
        'B',
        'hero-floating-card-2',
        fadingB,
        () => {
          isHoveredBRef.current = true;
        },
        () => {
          isHoveredBRef.current = false;
        }
      )}

      {renderCard(
        adC,
        'C',
        'hero-floating-card-3',
        fadingC,
        () => {
          isHoveredCRef.current = true;
        },
        () => {
          isHoveredCRef.current = false;
        }
      )}
    </div>
  );
};

