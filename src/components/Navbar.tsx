import React from 'react';
import { Search, Moon, Sun, Terminal, Star, Menu, Shield, Bug } from 'lucide-react';
import { CategoryFilter } from '../types';
import { useBookmarks } from '../lib/bookmarks';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  selectedCategory?: CategoryFilter;
  onSelectCategory?: (cat: CategoryFilter) => void;
  onGoHome: () => void;
  onGoContact: () => void;
  onGoBookmarks?: () => void;
  onToggleSidebar?: () => void;
  isAdmin?: boolean;
  onGoAdmin?: () => void;
  onOpenBugReport?: () => void;
}

const FinanceIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  onOpenSearch,
  selectedCategory = 'all',
  onSelectCategory,
  onGoHome,
  onGoContact,
  onGoBookmarks,
  onToggleSidebar,
  isAdmin = false,
  onGoAdmin,
  onOpenBugReport,
}) => {
  const darkMode = theme === 'dark';
  const { count: bookmarkCount } = useBookmarks();
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(navigator.userAgent.includes('Mac'));
    }
  }, []);

  const handleSelectBookmarks = () => {
    if (onGoBookmarks) {
      onGoBookmarks();
    } else if (onSelectCategory) {
      onSelectCategory('bookmarks');
    }
  };

  // Shared styles WITHOUT display utilities (avoid Tailwind conflict with hidden/sm:inline-flex)
  // Option D — Dual-Tone Gradient Pill (emerald → teal)
  const financePillBase =
    'items-center gap-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm hover:from-emerald-600 hover:to-teal-600 transition-all cursor-pointer group shrink-0';

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors border-[color:var(--border)] bg-[color:var(--surface)]/85">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3 min-w-0">

          {/* Left: Menu + Brand + Finance link */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {onToggleSidebar && (
              <button
                id="sidebar-toggle-btn"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl border border-[color:var(--border)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-elevated)] transition-colors cursor-pointer shrink-0"
                aria-label="Toggle navigation sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <a
              href="/"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                  e.preventDefault();
                  onGoHome();
                }
              }}
              className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none min-w-0 shrink"
              aria-label="CodePackr home"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm bg-[color:var(--brand)] transition-transform group-hover:scale-105 shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-base sm:text-lg leading-tight tracking-tight text-[color:var(--ink)] truncate">
                  CodePackr
                </span>
                <span className="hidden sm:block text-[10px] font-mono font-medium tracking-wider text-[color:var(--ink-muted)] uppercase">
                  Enterprise
                </span>
              </div>
            </a>

            {/* Single Finance cross-link — short on mobile, full on sm+ */}
            <a
              id="nav-codepackr-finance-link"
              href="https://finance.codepackr.com/"
              target="_blank"
              rel="noopener noreferrer"
              title="Codepackr Finance — Calculators & Planning"
              aria-label="Open Codepackr Finance"
              className={`inline-flex ${financePillBase} px-2.5 sm:px-3 py-1.5 ml-0.5`}
            >
              <span className="text-white">
                <FinanceIcon />
              </span>
              <span className="sm:hidden">Finance</span>
              <span className="hidden sm:inline">Codepackr Finance</span>
            </a>
          </div>

          {/* Center search — desktop only */}
          <div className="flex-1 max-w-xl mx-2 hidden md:block min-w-0">
            <button
              id="search-trigger-btn"
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-4 py-2 text-sm rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink-muted)] hover:border-[color:var(--brand)] hover:ring-2 hover:ring-[color:var(--brand)]/15 focus:outline-none transition-all duration-200 hover:scale-[1.008] shadow-sm cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Search className="w-4 h-4 group-hover:text-[color:var(--brand)] transition-colors shrink-0" />
                <span className="truncate group-hover:text-[color:var(--ink)] transition-colors">Search tools...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink-muted)] group-hover:border-[color:var(--brand)]/40 transition-colors shrink-0">
                <span className="text-[10px]">{isMac ? '⌘' : 'Ctrl'}</span>K
              </kbd>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 rounded-xl border border-[color:var(--border)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-elevated)] active:scale-95 transition-all cursor-pointer"
              aria-label="Search tools"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              id="nav-bookmarks-btn"
              onClick={handleSelectBookmarks}
              className={`px-2 sm:px-3 py-1.5 text-sm font-medium rounded-xl border transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm ${
                selectedCategory === 'bookmarks'
                  ? 'bg-[color:var(--warning)] text-white border-[color:var(--warning)] shadow-md'
                  : 'bg-[color:var(--surface)] border-[color:var(--border)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:border-[color:var(--border-hover)]'
              }`}
              title="Saved Tools"
            >
              <Star className={`w-4 h-4 ${selectedCategory === 'bookmarks' ? 'fill-white' : bookmarkCount > 0 ? 'text-[color:var(--warning)] fill-[color:var(--warning)]' : ''}`} />
              <span className="hidden lg:inline">Favorites</span>
              {bookmarkCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${selectedCategory === 'bookmarks' ? 'bg-white/20' : 'bg-[color:var(--surface-elevated)] text-[color:var(--ink)]'}`}>
                  {bookmarkCount}
                </span>
              )}
            </button>

            {isAdmin && onGoAdmin && (
              <button
                id="nav-admin-btn"
                onClick={onGoAdmin}
                className="hidden sm:flex px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all items-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs"
                title="Admin Console"
              >
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Admin Console</span>
              </button>
            )}

            {onOpenBugReport && (
              <button
                id="nav-bug-report-btn"
                onClick={onOpenBugReport}
                className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/50 hover:scale-[1.05] active:scale-95 transition-all duration-200 cursor-pointer shadow-xs"
                title="Report a Bug (Automatic Diagnostics)"
                aria-label="Report a Bug"
              >
                <Bug className="w-5 h-5" />
              </button>
            )}

            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="group p-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:border-[color:var(--brand)]/40 hover:bg-[color:var(--surface-elevated)] hover:scale-[1.05] active:scale-95 transition-all duration-200 cursor-pointer shadow-xs"
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400 transition-transform duration-500 group-hover:rotate-90" />
              ) : (
                <Moon className="w-5 h-5 text-blue-500 transition-transform duration-500 group-hover:-rotate-45" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
