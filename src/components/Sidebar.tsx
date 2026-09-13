import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, Star, Workflow, Code2, ArrowLeftRight, Calculator,
  CheckCircle2, Binary, Wrench, Type, FileCode, ShieldCheck,
  ChevronLeft, ChevronRight, X, Image as ImageIcon, ExternalLink, Lock
} from 'lucide-react';
import { ToolCategory, CategoryFilter } from '../types';
import { TOOLS, CATEGORIES } from '../data/tools';
import { useBookmarks } from '../lib/bookmarks';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedCategory: CategoryFilter;
  onSelectCategory: (cat: CategoryFilter) => void;
  onGoHome: () => void;
  onGoBookmarks: () => void;
  onGoContact: () => void;
  onGoPrivacy: () => void;
  onGoTerms: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon className="w-4 h-4" />,
  edi: <Workflow className="w-4 h-4" />,
  formatters: <Code2 className="w-4 h-4" />,
  converters: <ArrowLeftRight className="w-4 h-4" />,
  'financial-calculators': <Calculator className="w-4 h-4" />,
  validators: <CheckCircle2 className="w-4 h-4" />,
  encoders: <Binary className="w-4 h-4" />,
  utilities: <Wrench className="w-4 h-4" />,
  text: <Type className="w-4 h-4" />,
  xml: <FileCode className="w-4 h-4" />,
};

// Smooth count-up micro-animation for numbers
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setDisplayValue(value);
      return;
    }
    const duration = 400;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(value);
      }
    };

    const frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span>{displayValue}</span>;
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen, onClose, isCollapsed, onToggleCollapse,
  selectedCategory, onSelectCategory, onGoHome, onGoBookmarks
}) => {
  const { count: bookmarkCount } = useBookmarks();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        id="app-sidebar"
        className={`
          fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)]
          transition-all duration-300 ease-in-out
          border-r border-[color:var(--border)] bg-[color:var(--surface)] flex flex-col justify-between shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-18' : 'w-72 xl:w-[295px]'}
        `}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-5 custom-scrollbar">
          
          <div className="flex items-center justify-between lg:hidden pb-4 border-b border-[color:var(--border)]">
            <span className="font-semibold text-[color:var(--ink)]">Menu</span>
            <button onClick={onClose} className="p-1.5 rounded-lg border border-[color:var(--border)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <a
            id="mobile-nav-codepackr-finance-link"
            href="https://finance.codepackr.com/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            title="Codepackr Finance — Calculators, Planning & Wealth Projections"
            className="lg:hidden flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer group"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Codepackr Finance</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          <div className="space-y-1">
            <button
              onClick={() => { onSelectCategory('all'); onGoHome(); onClose(); }}
              className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group overflow-hidden ${
                selectedCategory === 'all'
                  ? 'bg-[color:var(--brand)] text-white shadow-sm'
                  : 'text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-elevated)]'
              }`}
            >
              {selectedCategory === 'all' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-white shadow-xs" />
              )}
              <div className="flex items-center gap-3 min-w-0">
                <LayoutGrid className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="font-medium">All Tools</span>}
              </div>
              {!isCollapsed && (
                <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${selectedCategory === 'all' ? 'bg-white/20 font-bold' : 'bg-[color:var(--surface-muted)]'}`}>
                  <AnimatedNumber value={TOOLS.length} />
                </span>
              )}
            </button>

            <button
              onClick={() => { onSelectCategory('bookmarks'); onGoBookmarks(); onClose(); }}
              className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group overflow-hidden ${
                selectedCategory === 'bookmarks'
                  ? 'bg-[color:var(--warning)] text-white shadow-sm'
                  : 'text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-elevated)]'
              }`}
            >
              {selectedCategory === 'bookmarks' && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-white shadow-xs" />
              )}
              <div className="flex items-center gap-3 min-w-0">
                <Star className={`w-4 h-4 shrink-0 ${selectedCategory === 'bookmarks' ? 'fill-white' : bookmarkCount > 0 ? 'text-[color:var(--warning)] fill-[color:var(--warning)]' : ''}`} />
                {!isCollapsed && <span className="font-medium">Favorites</span>}
              </div>
              {!isCollapsed && bookmarkCount > 0 && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${selectedCategory === 'bookmarks' ? 'bg-white/20' : 'bg-[color:var(--warning)]/10 text-[color:var(--warning)]'}`}>
                  <AnimatedNumber value={bookmarkCount} />
                </span>
              )}
            </button>
          </div>

          <div>
            {!isCollapsed && (
              <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-muted)] px-3 mb-2 block">
                Categories
              </span>
            )}
            <div className="space-y-1">
              {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                const count = TOOLS.filter((t) => t.category === cat.id || t.secondaryCategories?.includes(cat.id as any)).length;
                const isSelected = selectedCategory === cat.id;
                const icon = CATEGORY_ICONS[cat.id] || <Wrench className="w-4 h-4" />;

                if (cat.externalUrl) {
                  return (
                    <a
                      key={cat.id}
                      href={cat.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      title={`${cat.label} — finance.codepackr.com (Opens in new tab)`}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-elevated)]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1.5 text-left">
                        <span className="shrink-0 text-emerald-500 group-hover:scale-110 transition-transform">{icon}</span>
                        {!isCollapsed && (
                          <span className="text-sm font-medium leading-snug break-words" title={cat.label}>
                            {cat.label}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                          <span>finance</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </a>
                  );
                }
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => { onSelectCategory(cat.id); onClose(); }}
                    title={cat.label}
                    className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group overflow-hidden ${
                      isSelected
                        ? 'bg-[color:var(--brand-light)] text-[color:var(--brand)] font-semibold'
                        : 'text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-elevated)]'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[color:var(--brand)] shadow-xs animate-scale-in" />
                    )}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1.5 text-left">
                      <span className="shrink-0">{icon}</span>
                      {!isCollapsed && (
                        <span className="text-sm font-medium leading-snug break-words" title={cat.label}>
                          {cat.label}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-md shrink-0 ml-1 ${isSelected ? 'bg-[color:var(--brand)]/10 font-bold' : 'bg-[color:var(--surface-muted)]'}`}>
                        <AnimatedNumber value={count} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[color:var(--border)] bg-[color:var(--surface)] space-y-3">
          {!isCollapsed ? (
            <div className="p-3 rounded-xl border border-[color:var(--success)]/20 bg-[color:var(--success)]/5 text-xs space-y-1.5 group hover:border-[color:var(--success)]/40 transition-colors">
              <div className="flex items-center gap-2 text-[color:var(--success)] font-semibold">
                <ShieldCheck className="w-4 h-4 animate-lock-pulse" />
                <span>Client-Side Processing</span>
                <span className="relative flex h-2 w-2 ml-auto">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[color:var(--ink-muted)] leading-relaxed flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Zero server data transmission.</span>
              </p>
            </div>
          ) : (
            <div className="flex justify-center py-1" title="100% Client-Side Processing">
              <ShieldCheck className="w-5 h-5 text-[color:var(--success)] animate-lock-pulse" />
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-2 rounded-xl border border-[color:var(--border)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-elevated)] transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span className="text-sm font-medium">Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
};
