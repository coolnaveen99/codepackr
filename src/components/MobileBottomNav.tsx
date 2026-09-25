import React from 'react';
import { Home, Search, Star, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  active: 'home' | 'search' | 'favorites' | 'menu';
  onHome: () => void;
  onSearch: () => void;
  onFavorites: () => void;
  onMenu: () => void;
  favoriteCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  active,
  onHome,
  onSearch,
  onFavorites,
  onMenu,
  favoriteCount = 0,
}) => {
  const items = [
    { id: 'home' as const, label: 'Home', icon: Home, onClick: onHome },
    { id: 'search' as const, label: 'Search', icon: Search, onClick: onSearch },
    { id: 'favorites' as const, label: 'Saved', icon: Star, onClick: onFavorites, badge: favoriteCount },
    { id: 'menu' as const, label: 'Menu', icon: Menu, onClick: onMenu },
  ];

  return (
    <nav
      aria-label="Mobile app navigation"
      className="mobile-app-nav fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--border)] bg-[color:var(--surface)]/95 backdrop-blur-xl supports-[backdrop-filter]:bg-[color:var(--surface)]/80 lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ id, label, icon: Icon, onClick, badge }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={onClick}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-semibold transition-all active:scale-95 ${isActive ? 'text-[color:var(--brand)]' : 'text-[color:var(--ink-muted)]'}`}
            >
              <span className={`relative flex h-7 w-10 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-[color:var(--brand-light)]' : ''}`}>
                <Icon className={`h-5 w-5 ${id === 'favorites' && badge ? 'fill-current' : ''}`} />
                {badge ? (
                  <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[color:var(--warning)] px-1 text-[9px] leading-4 text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
