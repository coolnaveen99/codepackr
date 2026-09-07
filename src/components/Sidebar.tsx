import React from 'react';
import {
  LayoutGrid,
  Star,
  Workflow,
  Code2,
  ArrowLeftRight,
  Calculator,
  CheckCircle2,
  Binary,
  Wrench,
  Type,
  FileCode,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Zap,
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
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  selectedCategory,
  onSelectCategory,
  onGoHome,
  onGoBookmarks,
  onGoContact,
  onGoPrivacy,
  onGoTerms,
}) => {
  const { count: bookmarkCount } = useBookmarks();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)]
          transition-all duration-300 ease-in-out
          border-r flex flex-col justify-between
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-18' : 'w-64 lg:w-64'}
          bg-[var(--surface)] border-[var(--line)] shrink-0
        `}
      >
        {/* Top Header / Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-5 no-scrollbar">
          {/* Mobile Close Button & Header */}
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-[var(--line)]">
            <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
              Developer Utilities
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Primary Actions */}
          <div className="space-y-1">
            {/* All Tools Item */}
            <button
              id="sidebar-cat-all"
              onClick={() => {
                onSelectCategory('all');
                onGoHome();
                onClose();
              }}
              title="All Tools"
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold
                transition-all cursor-pointer group
                ${
                  selectedCategory === 'all'
                    ? 'bg-[var(--brand)] text-white shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)]'
                }
              `}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LayoutGrid className={`w-4 h-4 shrink-0 ${selectedCategory === 'all' ? 'text-white' : 'text-zinc-500'}`} />
                {!isCollapsed && <span className="truncate">All Tools</span>}
              </div>
              {!isCollapsed && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    selectedCategory === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--muted)]'
                  }`}
                >
                  {TOOLS.length}
                </span>
              )}
            </button>

            {/* Bookmarks Item */}
            <button
              id="sidebar-cat-bookmarks"
              onClick={() => {
                onSelectCategory('bookmarks');
                onGoBookmarks();
                onClose();
              }}
              title="Favorites & Bookmarks"
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold
                transition-all cursor-pointer group
                ${
                  selectedCategory === 'bookmarks'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)]'
                }
              `}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Star
                  className={`w-4 h-4 shrink-0 ${
                    selectedCategory === 'bookmarks'
                      ? 'text-white fill-white'
                      : bookmarkCount > 0
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-zinc-500'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Favorites</span>}
              </div>
              {!isCollapsed && bookmarkCount > 0 && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                    selectedCategory === 'bookmarks'
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {bookmarkCount}
                </span>
              )}
            </button>
          </div>

          {/* Categories Section */}
          <div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] px-3 mb-1.5 block">
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
                    id={`sidebar-cat-${cat.id}`}
                    onClick={() => {
                      onSelectCategory(cat.id);
                      onClose();
                    }}
                    title={`${cat.label} (${count})`}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium
                      transition-all cursor-pointer group
                      ${
                        isSelected
                          ? 'bg-[var(--brand)] text-white font-semibold shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`shrink-0 ${isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-[var(--brand)]'}`}>
                        {icon}
                      </span>
                      {!isCollapsed && <span className="truncate">{cat.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800/80 text-[var(--muted)]'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Panel: Privacy Shield & Desktop Collapse Toggle */}
        <div className="p-3 border-t border-[var(--line)] space-y-2 shrink-0 bg-[var(--surface-2)]/50">
          {!isCollapsed ? (
            <div className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Client-Side</span>
              </div>
              <p className="text-[10px] leading-relaxed text-[var(--muted)]">
                Local in-browser sandbox. Zero server data transmission.
              </p>
            </div>
          ) : (
            <div className="flex justify-center" title="100% Client-Side Sandbox">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-1.5 rounded-lg border border-[var(--line)] text-xs text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px]">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
