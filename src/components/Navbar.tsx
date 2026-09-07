import React, { useRef, useEffect } from 'react';
import { Search, Moon, Sun, Terminal, MessageSquare, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToolCategory, CategoryFilter } from '../types';
import { CATEGORIES } from '../data/tools';
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
}) => {
  const darkMode = theme === 'dark';
  const { count: bookmarkCount } = useBookmarks();
  const navTabsRef = useRef<HTMLDivElement>(null);

  // Automatically scroll active category pill into view in the navbar
  useEffect(() => {
    if (!selectedCategory || !navTabsRef.current) return;
    const targetId = `cat-tab-${selectedCategory}`;
    const activeBtn = navTabsRef.current.querySelector(`#${targetId}`) as HTMLElement | null;
    if (activeBtn) {
      const container = navTabsRef.current;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerWidth = container.clientWidth;
      const targetScroll = btnLeft - (containerWidth / 2) + (btnWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [selectedCategory]);

  const scrollNavTabs = (direction: 'left' | 'right') => {
    if (navTabsRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      navTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSelectBookmarks = () => {
    if (onGoBookmarks) {
      onGoBookmarks();
    } else if (onSelectCategory) {
      onSelectCategory('bookmarks');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors"
      style={{
        borderColor: 'var(--line)',
        backgroundColor: darkMode ? 'rgba(26, 34, 52, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <a
            id="brand-logo-btn"
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                e.preventDefault();
                onGoHome();
              }
            }}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #5B52E8 0%, #009f88 100%)' }}
            >
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight" style={{ color: 'var(--ink)' }}>
                  Codepackr
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand)' }}
                >
                  Local
                </span>
              </div>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--muted)' }}>
                Browser-based developer tools
              </p>
            </div>
          </a>

          {/* Quick Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6">
            <button
              id="search-trigger-btn"
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 text-sm rounded-xl border transition-all hover:border-[var(--brand)] focus:outline-none shadow-sm cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
                color: 'var(--muted)',
              }}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <span>Search tools...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono font-medium rounded border"
                style={{ backgroundColor: 'var(--surface-3)', borderColor: 'var(--line)' }}
              >
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bookmarks Quick Shortcut Button */}
            <button
              id="bookmarks-nav-btn"
              onClick={handleSelectBookmarks}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                selectedCategory === 'bookmarks'
                  ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  : 'hover:border-[var(--brand)]'
              }`}
              style={
                selectedCategory === 'bookmarks'
                  ? {}
                  : {
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                      color: 'var(--ink)',
                    }
              }
              title="Saved & Bookmarked Tools"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  bookmarkCount > 0
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-zinc-400'
                }`}
              />
              <span className="hidden sm:inline">Bookmarks</span>
              {bookmarkCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-tight">
                  {bookmarkCount}
                </span>
              )}
            </button>

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
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer hover:border-[var(--brand)]"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
                color: 'var(--ink)',
              }}
              title="Feedback & Contact"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Contact</span>
            </a>

            {/* Global Currency Selector Dropdown Button */}
            <CurrencySelector idPrefix="nav-currency" variant="nav" />

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border transition-colors hover:border-[var(--brand)] cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
                color: 'var(--ink)',
              }}
              aria-label="Toggle Theme"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Category Horizontal Navigation (Heading Sub-menu) */}
        {onSelectCategory && (
          <div className="relative flex items-center border-t py-1.5" style={{ borderColor: 'var(--line)' }}>
            <button
              onClick={() => scrollNavTabs('left')}
              className="flex items-center justify-center w-6 h-6 rounded-md border mr-1 shrink-0 text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--brand)] transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              title="Scroll categories left"
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={navTabsRef}
              className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar scrollbar-none text-xs scroll-smooth flex-1"
            >
              {/* All Tools Tab */}
              <button
                id="cat-tab-all"
                onClick={() => onSelectCategory('all')}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all cursor-pointer ${
                  selectedCategory === 'all' ? 'shadow-sm font-semibold' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: selectedCategory === 'all' ? 'var(--brand)' : 'var(--surface)',
                  color: selectedCategory === 'all' ? '#ffffff' : 'var(--ink)',
                  border: selectedCategory === 'all' ? '1px solid var(--brand)' : '1px solid var(--line)',
                }}
              >
                All Tools
              </button>

              {/* Bookmarks Tab in Heading Menu */}
              <button
                id="cat-tab-bookmarks"
                onClick={() => onSelectCategory('bookmarks')}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'bookmarks'
                    ? 'shadow-sm font-semibold bg-amber-500 text-white border border-amber-500'
                    : 'hover:opacity-80'
                }`}
                style={
                  selectedCategory === 'bookmarks'
                    ? { backgroundColor: '#f59e0b', color: '#ffffff', border: '1px solid #f59e0b' }
                    : {
                        backgroundColor: 'var(--surface)',
                        color: 'var(--ink)',
                        border: '1px solid var(--line)',
                      }
                }
              >
                <Star
                  className={`w-3 h-3 ${
                    selectedCategory === 'bookmarks'
                      ? 'text-white fill-white'
                      : bookmarkCount > 0
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-zinc-400'
                  }`}
                />
                <span>Favorites</span>
                {bookmarkCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      selectedCategory === 'bookmarks'
                        ? 'bg-white text-amber-600'
                        : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {bookmarkCount}
                  </span>
                )}
              </button>

              {/* Other Categories */}
              {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`cat-tab-${cat.id}`}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all cursor-pointer ${
                      isActive ? 'shadow-sm font-semibold' : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--brand)' : 'var(--surface)',
                      color: isActive ? '#ffffff' : 'var(--ink)',
                      border: isActive ? '1px solid var(--brand)' : '1px solid var(--line)',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollNavTabs('right')}
              className="flex items-center justify-center w-6 h-6 rounded-md border ml-1 shrink-0 text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--brand)] transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              title="Scroll categories right"
              aria-label="Scroll categories right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
