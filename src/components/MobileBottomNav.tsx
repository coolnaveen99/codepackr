import React from 'react';
import { Home, LayoutGrid, Search, Star, MoreHorizontal } from 'lucide-react';

export type MobileTab = 'home' | 'tools' | 'search' | 'saved' | 'more';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  bookmarkCount?: number;
  className?: string;
}

const TABS: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" strokeWidth={2} /> },
  { id: 'tools', label: 'Tools', icon: <LayoutGrid className="w-5 h-5" strokeWidth={2} /> },
  { id: 'search', label: 'Search', icon: <Search className="w-5 h-5" strokeWidth={2} /> },
  { id: 'saved', label: 'Saved', icon: <Star className="w-5 h-5" strokeWidth={2} /> },
  { id: 'more', label: 'More', icon: <MoreHorizontal className="w-5 h-5" strokeWidth={2} /> },
];

/**
 * Mobile bottom navigation — CodePackr developer suite.
 * Spec: Home · Tools · Search · Saved · More
 * Visible only on mobile (< lg). Respects safe-area insets.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  bookmarkCount = 0,
  className = '',
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Primary mobile navigation"
      className={`lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[color:var(--border)] bg-[color:var(--surface)]/95 backdrop-blur-md ${className}`}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)',
      }}
    >
      <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto px-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 min-h-[44px] px-1 py-1 rounded-xl transition-colors cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[color:var(--brand)]'
                  : 'text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]'
              }`}
            >
              <span className="relative flex items-center justify-center">
                {tab.id === 'saved' && bookmarkCount > 0 ? (
                  <Star
                    className={`w-5 h-5 ${isActive ? 'fill-[color:var(--brand)]' : 'fill-[color:var(--warning)] text-[color:var(--warning)]'}`}
                    strokeWidth={2}
                  />
                ) : (
                  tab.icon
                )}
                {tab.id === 'saved' && bookmarkCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[color:var(--warning)] text-white text-[10px] font-bold leading-4 text-center">
                    {bookmarkCount > 99 ? '99+' : bookmarkCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium leading-tight truncate max-w-full ${
                isActive ? 'font-semibold' : ''
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[color:var(--brand)]"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
