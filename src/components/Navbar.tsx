import React from 'react';
import { Search, Moon, Sun, Terminal, MessageSquare, Star, Menu } from 'lucide-react';
import { CategoryFilter } from '../types';
import { useBookmarks } from '../lib/bookmarks';
import { CurrencySelector } from './CurrencySelector';

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
}

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
}) => {
  const darkMode = theme === 'dark';
  const { count: bookmarkCount } = useBookmarks();

  const handleSelectBookmarks = () => {
    if (onGoBookmarks) {
      onGoBookmarks();
    } else if (onSelectCategory) {
      onSelectCategory('bookmarks');
    }
  };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors"
      style={{
        borderColor: 'var(--line)',
        backgroundColor: darkMode ? 'rgba(18, 18, 21, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Left: Sidebar Toggle & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            {onToggleSidebar && (
              <button
                id="sidebar-toggle-btn"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl border transition-colors hover:border-[var(--brand)] text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                }}
                aria-label="Toggle navigation sidebar"
                title="Toggle Sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            <a
              id="brand-logo-btn"
              href="/"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                  e.preventDefault();
                  onGoHome();
                }
              }}
              className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0d9488 100%)' }}
              >
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight" style={{ color: 'var(--ink)' }}>
                  Codepackr
                </span>
                <span
                  className="text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: 'var(--brand-light)',
                    borderColor: 'var(--brand)',
                    color: 'var(--brand)',
                  }}
                >
                  Client-Side
                </span>
              </div>
            </a>
          </div>

          {/* Center: Raycast / Linear Style Search Trigger */}
          <div className="flex-1 max-w-xl mx-2">
            <button
              id="search-trigger-btn"
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm rounded-xl border transition-all hover:border-[var(--brand)] focus:outline-none shadow-xs group cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
                color: 'var(--muted)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[var(--brand)] transition-colors shrink-0" />
                <span className="truncate">Search 30+ tools, EDI segments, formats...</span>
              </div>
              <kbd
                className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium rounded-md border shrink-0"
                style={{ backgroundColor: 'var(--surface-3)', borderColor: 'var(--line)', color: 'var(--muted)' }}
              >
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Bookmarks Pill */}
            <button
              id="bookmarks-nav-btn"
              onClick={handleSelectBookmarks}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                selectedCategory === 'bookmarks'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'hover:border-amber-400 text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
              style={
                selectedCategory === 'bookmarks'
                  ? {}
                  : {
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                    }
              }
              title="Saved & Bookmarked Tools"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  selectedCategory === 'bookmarks'
                    ? 'text-white fill-white'
                    : bookmarkCount > 0
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-zinc-400'
                }`}
              />
              <span className="hidden sm:inline">Favorites</span>
              {bookmarkCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedCategory === 'bookmarks'
                      ? 'bg-white/30 text-white'
                      : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {bookmarkCount}
                </span>
              )}
            </button>

            {/* Currency Selector */}
            <CurrencySelector idPrefix="nav-currency" variant="nav" />

            {/* Contact Button */}
            <a
              id="contact-nav-btn"
              href="/contact.html"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                  e.preventDefault();
                  onGoContact();
                }
              }}
              className="hidden md:flex px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors items-center gap-1.5 cursor-pointer hover:border-[var(--brand)] text-[var(--muted)] hover:text-[var(--ink)]"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
              title="Feedback & Contact"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact</span>
            </a>

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border transition-colors hover:border-[var(--brand)] cursor-pointer text-[var(--muted)] hover:text-[var(--ink)]"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
              aria-label="Toggle Theme"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
