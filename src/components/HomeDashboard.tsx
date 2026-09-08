import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowRight,
  Star,
  Share2,
  Check,
  Workflow,
  Sparkles,
  ShieldCheck,
  Shield,
  EyeOff,
  Lock,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { ToolDef, CategoryFilter } from '../types';
import { TOOLS, CATEGORIES } from '../data/tools';
import { getIcon } from '../lib/icons';
import { useBookmarks, shareToolUrl } from '../lib/bookmarks';
import { getToolPath } from '../lib/urls';
import { useToolGovernance } from '../lib/useToolGovernance';
import { useAdminAuth } from '../lib/useAdminAuth';

interface HomeDashboardProps {
  onSelectTool: (tool: ToolDef) => void;
  onOpenSearch: () => void;
  selectedCategory: CategoryFilter;
  onSelectCategory: (cat: CategoryFilter) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onSelectTool,
  onOpenSearch,
  selectedCategory,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { isBookmarked, toggleBookmark, count: bookmarkCount } = useBookmarks();
  const { isToolVisible, getToolStatus } = useToolGovernance();
  const { isAuthenticated } = useAdminAuth();

  const handleCardShare = async (e: React.MouseEvent, tool: ToolDef) => {
    e.stopPropagation();
    const success = await shareToolUrl(tool.id, tool.name, tool.description);
    if (success) {
      setCopiedId(tool.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCardBookmark = (e: React.MouseEvent, toolId: string) => {
    e.stopPropagation();
    toggleBookmark(toolId);
  };

  // Filter tools by category, governance status, and instant in-page query
  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      // Governance check: Hide hidden/admin-only tools from public view unless admin
      if (!isToolVisible(tool.id, isAuthenticated)) return false;

      // Category filter
      if (selectedCategory === 'bookmarks') {
        if (!isBookmarked(tool.id)) return false;
      } else if (selectedCategory !== 'all') {
        if (tool.category !== selectedCategory) return false;
      }

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = tool.name.toLowerCase().includes(q);
        const matchesDesc = tool.description.toLowerCase().includes(q);
        const matchesKeywords = tool.keywords?.some((k) => k.toLowerCase().includes(q));
        const matchesCategory = tool.category.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesKeywords || matchesCategory;
      }

      return true;
    });
  }, [selectedCategory, searchQuery, isBookmarked, isToolVisible, isAuthenticated]);

  const hiddenToolsCount = useMemo(() => {
    return TOOLS.filter((tool) => !isToolVisible(tool.id, false)).length;
  }, [isToolVisible]);

  const activeCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return 'All Developer Tools';
    if (selectedCategory === 'bookmarks') return 'Saved Favorites';
    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
    return cat ? cat.label : selectedCategory;
  }, [selectedCategory]);

  return (
    <div className="space-y-8 pb-16">
      {/* Sleek Minimalist Developer Hero */}
      <div className="relative pt-2 pb-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Client-Side In-Memory Sandbox</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--ink)' }}>
              Professional Developer Tools &amp; EDI Suite
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--muted)]">
              Powerful, free-to-use tools for formatting, validation, conversion, EDI processing, encoding, and more. Your data stays in your browser.
            </p>
          </div>

          {/* In-Page Quick Filter Search Input */}
          <div className="w-full md:w-72 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter current view..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--brand)] transition-colors shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="dash-cat-all"
              onClick={() => onSelectCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedCategory === 'all'
                  ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-xs'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              <span>All Tools</span>
              <span className={`text-[10px] font-mono px-1 rounded ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--muted)]'}`}>
                {TOOLS.length}
              </span>
            </button>

            {/* EDI Category Highlight */}
            <button
              id="dash-cat-edi"
              onClick={() => onSelectCategory('edi')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedCategory === 'edi'
                  ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-xs'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>EDI Tools</span>
              <span className={`text-[10px] font-mono px-1 rounded ${selectedCategory === 'edi' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--muted)]'}`}>
                {TOOLS.filter((t) => t.category === 'edi').length}
              </span>
            </button>

            {/* Other Categories */}
            {CATEGORIES.filter((c) => c.id !== 'all' && c.id !== 'edi').map((cat) => {
              const count = TOOLS.filter((t) => t.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`dash-cat-${cat.id}`}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-xs'
                      : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-zinc-400 dark:hover:border-zinc-600'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--muted)]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Bookmarks */}
            <button
              id="dash-cat-bookmarks"
              onClick={() => onSelectCategory('bookmarks')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedCategory === 'bookmarks'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-amber-400'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${selectedCategory === 'bookmarks' ? 'fill-white' : bookmarkCount > 0 ? 'text-amber-500 fill-amber-500' : ''}`} />
              <span>Favorites</span>
              {bookmarkCount > 0 && (
                <span className={`text-[10px] font-mono px-1 rounded ${selectedCategory === 'bookmarks' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                  {bookmarkCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Mode Indicator Banner */}
      {isAuthenticated && hiddenToolsCount > 0 && (
        <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200">
            <Shield className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Admin Mode Active:</strong> Showing all {TOOLS.length} utilities, including{' '}
              <strong>{hiddenToolsCount} hidden/unlisted</strong> tools. Public visitors only see listed utilities.
            </span>
          </div>
          <a
            href="/admin"
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 text-amber-950 dark:text-amber-100 hover:bg-amber-500/30 transition-colors whitespace-nowrap"
          >
            Governance Console &rarr;
          </a>
        </div>
      )}

      {/* Grid Header / Counter */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono">
        <span>
          {activeCategoryLabel} • {filteredTools.length} {filteredTools.length === 1 ? 'utility' : 'utilities'}
        </span>
        {searchQuery && (
          <span className="text-[var(--brand)]">
            Matching "{searchQuery}"
          </span>
        )}
      </div>

      {/* Bento Grid: Clean Modern Developer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTools.map((tool) => {
          const bookmarked = isBookmarked(tool.id);
          const isCopied = copiedId === tool.id;
          const gov = getToolStatus(tool.id);
          const isHiddenTool = gov.status === 'hidden' || gov.visibility === 'admin_only';

          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:border-[var(--brand)] shadow-2xs hover:shadow-sm ${
                isHiddenTool ? 'border-amber-500/40 bg-amber-500/5' : ''
              }`}
              style={{
                backgroundColor: isHiddenTool ? undefined : 'var(--surface)',
                borderColor: isHiddenTool ? undefined : 'var(--line)',
              }}
            >
              <div className="space-y-3">
                {/* Card Header: Icon & Badges / Actions */}
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] group-hover:text-[var(--brand)] group-hover:border-[var(--brand)] transition-colors"
                  >
                    {getIcon(tool.icon)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isHiddenTool ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Hidden
                      </span>
                    ) : gov.status === 'maintenance' ? (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Maintenance
                      </span>
                    ) : gov.status === 'beta' ? (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        Beta
                      </span>
                    ) : (
                      <>
                        {tool.popular && (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Popular
                          </span>
                        )}
                        {tool.isNew && (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            New
                          </span>
                        )}
                      </>
                    )}

                    {/* Bookmark Action */}
                    <button
                      onClick={(e) => handleCardBookmark(e, tool.id)}
                      className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                        bookmarked
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                          : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-[var(--surface-3)]'
                      }`}
                      title={bookmarked ? 'Remove from favorites' : 'Save to favorites'}
                      aria-label="Bookmark tool"
                    >
                      <Star className={`w-3.5 h-3.5 ${bookmarked ? 'fill-amber-500' : ''}`} />
                    </button>

                    {/* Share Link Action */}
                    <button
                      onClick={(e) => handleCardShare(e, tool)}
                      className="p-1.5 rounded-md border border-transparent text-zinc-400 hover:text-[var(--ink)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                      title={isCopied ? 'URL copied!' : 'Share tool'}
                      aria-label="Share tool URL"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Card Title & Description */}
                <div>
                  <h3 className="font-bold text-sm leading-snug group-hover:text-[var(--brand)] transition-colors" style={{ color: 'var(--ink)' }}>
                    <a
                      href={getToolPath(tool)}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                          e.preventDefault();
                          onSelectTool(tool);
                        }
                      }}
                      className="hover:underline focus:outline-none"
                    >
                      {tool.name}
                    </a>
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2 mt-1">
                    {tool.description}
                  </p>
                  {gov.noticeMessage && (
                    <div className="mt-2 px-2 py-1 rounded-md text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                      {gov.noticeMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Category Pill & Launch Arrow */}
              <div className="pt-3 mt-3 border-t border-[var(--line)] flex items-center justify-between text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  {tool.category}
                </span>

                <span className="flex items-center gap-1 font-semibold text-[11px] text-[var(--brand)] group-hover:translate-x-0.5 transition-transform">
                  <span>Launch</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] max-w-md mx-auto space-y-3">
          <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center bg-[var(--surface-2)] text-[var(--muted)]">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
            No matching utilities found
          </h3>
          <p className="text-xs text-[var(--muted)]">
            {selectedCategory === 'bookmarks'
              ? 'You have not added any tools to your favorites yet. Click the star icon on any tool card to bookmark it.'
              : `No tools matched "${searchQuery}". Try searching for another keyword or EDI segment.`}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              onSelectCategory('all');
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            Clear Filters &amp; View All Tools
          </button>
        </div>
      )}
    </div>
  );
};
