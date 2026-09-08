import React from 'react';
import {
  LayoutGrid, Star, Workflow, Code2, ArrowLeftRight, Calculator,
  CheckCircle2, Binary, Wrench, Type, FileCode, ShieldCheck,
  ChevronLeft, ChevronRight, X
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
  edi: <Workflow className="w-4 h-4" />,
  formatters: <Code2 className="w-4 h-4" />,
  converters: <ArrowLeftRight className="w-4 h-4" />,
  calculators: <Calculator className="w-4 h-4" />,
  validators: <CheckCircle2 className="w-4 h-4" />,
  encoders: <Binary className="w-4 h-4" />,
  utilities: <Wrench className="w-4 h-4" />,
  text: <Type className="w-4 h-4" />,
  xml: <FileCode className="w-4 h-4" />,
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
          ${isCollapsed ? 'w-18' : 'w-64'}
        `}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 custom-scrollbar">
          
          <div className="flex items-center justify-between lg:hidden pb-4 border-b border-[color:var(--border)]">
            <span className="font-semibold text-[color:var(--ink)]">Menu</span>
            <button onClick={onClose} className="p-1.5 rounded-lg border border-[color:var(--border)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => { onSelectCategory('all'); onGoHome(); onClose(); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                selectedCategory === 'all'
                  ? 'bg-[color:var(--brand)] text-white shadow-sm'
                  : 'text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-elevated)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <LayoutGrid className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">All Tools</span>}
              </div>
              {!isCollapsed && (
                <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-[color:var(--surface-muted)]'}`}>
                  {TOOLS.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { onSelectCategory('bookmarks'); onGoBookmarks(); onClose(); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                selectedCategory === 'bookmarks'
                  ? 'bg-[color:var(--warning)] text-white shadow-sm'
                  : 'text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-elevated)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Star className={`w-4 h-4 shrink-0 ${selectedCategory === 'bookmarks' ? 'fill-white' : bookmarkCount > 0 ? 'text-[color:var(--warning)] fill-[color:var(--warning)]' : ''}`} />
                {!isCollapsed && <span className="truncate">Favorites</span>}
              </div>
              {!isCollapsed && bookmarkCount > 0 && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${selectedCategory === 'bookmarks' ? 'bg-white/20' : 'bg-[color:var(--warning)]/10 text-[color:var(--warning)]'}`}>
                  {bookmarkCount}
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
                const count = TOOLS.filter((t) => t.category === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                const icon = CATEGORY_ICONS[cat.id] || <Wrench className="w-4 h-4" />;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => { onSelectCategory(cat.id); onClose(); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-[color:var(--brand-light)] text-[color:var(--brand)] font-semibold'
                        : 'text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-elevated)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0">{icon}</span>
                      {!isCollapsed && <span className="truncate">{cat.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${isSelected ? 'bg-[color:var(--brand)]/10' : 'bg-[color:var(--surface-muted)]'}`}>
                        {count}
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
            <div className="p-3 rounded-xl border border-[color:var(--success)]/20 bg-[color:var(--success)]/5 text-xs space-y-1">
              <div className="flex items-center gap-2 text-[color:var(--success)] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Client-Side Processing</span>
              </div>
              <p className="text-[color:var(--ink-muted)] leading-relaxed">
                Zero server data transmission.
              </p>
            </div>
          ) : (
            <div className="flex justify-center" title="100% Client-Side Processing">
              <ShieldCheck className="w-5 h-5 text-[color:var(--success)]" />
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
