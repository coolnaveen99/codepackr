import React, { useState, useRef, useEffect } from 'react';
import { Search, Shield, Sparkles, ArrowRight, CheckCircle2, Star, Share2, Check, BookmarkCheck, Workflow, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToolDef, CategoryFilter } from '../types';
import { TOOLS, CATEGORIES } from '../data/tools';
import { getIcon } from '../lib/icons';
import { useBookmarks, shareToolUrl } from '../lib/bookmarks';
import { getToolPath } from '../lib/urls';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { isBookmarked, toggleBookmark, count: bookmarkCount } = useBookmarks();
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Automatically scroll the active category tab into view so it is always visible
  useEffect(() => {
    if (!selectedCategory || !tabsContainerRef.current) return;
    const targetId = `dash-cat-${selectedCategory}`;
    const activeBtn = tabsContainerRef.current.querySelector(`#${targetId}`) as HTMLElement | null;
    if (activeBtn) {
      const container = tabsContainerRef.current;
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

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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

  const filteredTools = TOOLS.filter((tool) => {
    if (selectedCategory === 'bookmarks') {
      return isBookmarked(tool.id);
    }
    if (selectedCategory !== 'all') {
      return tool.category === selectedCategory;
    }
    return true;
  });

  const popularTools = TOOLS.filter((t) => t.popular);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto pt-4 space-y-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border"
          style={{ backgroundColor: 'var(--brand-light)', borderColor: 'var(--brand)', color: 'var(--brand)' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Local Developer Utilities Suite</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--ink)' }}>
          Format, Convert, Inspect &amp; Validate Code
        </h1>

        <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
          Over 30+ browser-based tools for developers. Fully offline-capable, lightning fast, with zero server uploads.
        </p>

        {/* Quick Search Trigger */}
        <div className="max-w-md mx-auto pt-2">
          <div
            onClick={onOpenSearch}
            className="flex items-center justify-between px-4 py-3 rounded-2xl border cursor-pointer shadow-sm hover:border-[var(--brand)] transition-all"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2.5" style={{ color: 'var(--muted)' }}>
              <Search className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Search 30+ developer tools...</span>
            </div>
            <kbd
              className="px-2 py-0.5 rounded text-[10px] font-mono border"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--muted)' }}
            >
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Popular Quick Pills: In between Popular: and JSON Formatter add EDI tools */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <span className="text-xs font-semibold mr-1" style={{ color: 'var(--muted)' }}>
            Popular:
          </span>

          {/* EDI Tools Shortcut Button */}
          <button
            id="popular-pill-edi-tools"
            onClick={() => onSelectCategory('edi')}
            className="px-2.5 py-1 text-xs font-semibold rounded-full border border-[var(--brand)] text-[var(--brand)] bg-[var(--brand-light)] hover:opacity-90 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            title="Browse all EDI X12, EDIFACT & AS2 Tools"
          >
            <Workflow className="w-3 h-3" />
            <span>EDI Tools</span>
          </button>

          {popularTools.slice(0, 6).map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTool(t)}
              className="px-2.5 py-1 text-xs rounded-full border hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Guarantee Pill */}
      <div
        className="max-w-3xl mx-auto p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3 text-left">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand)' }}
          >
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold block" style={{ color: 'var(--ink)' }}>
              Zero Data Sent to Servers
            </span>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              All formatting, hashing, and conversions happen 100% inside your browser's JavaScript sandbox.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> No Cookies
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Offline-Ready
          </span>
        </div>
      </div>

      {/* Category Tabs Section */}
      <div id="categories-section" className="space-y-4">
        <div
          className="flex items-center justify-between border-b pb-3"
          style={{ borderColor: 'var(--line)' }}
        >
          {/* Scrollable category pills container with left/right scroll arrows and no-scrollbar */}
          <div className="relative flex items-center w-full min-w-0">
            <button
              onClick={() => scrollTabs('left')}
              className="flex items-center justify-center w-7 h-7 rounded-lg border mr-1.5 shrink-0 text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--brand)] transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              title="Scroll categories left"
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={tabsContainerRef}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 w-full"
            >
              {/* All Tools tab */}
              <button
                id="dash-cat-all"
                onClick={() => onSelectCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border ${
                  selectedCategory === 'all'
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-xs'
                    : 'border-[var(--line)] hover:border-[var(--brand)]/50 hover:bg-[var(--surface-3)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
                style={{
                  backgroundColor: selectedCategory === 'all' ? 'var(--brand)' : 'var(--surface)',
                }}
              >
                <span>All Tools</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    selectedCategory === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 opacity-75'
                  }`}
                >
                  {TOOLS.length}
                </span>
              </button>

              {/* Bookmarked / Favorites Tab */}
              <button
                id="dash-cat-bookmarks"
                onClick={() => onSelectCategory('bookmarks')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border ${
                  selectedCategory === 'bookmarks'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'border-[var(--line)] hover:border-amber-500/50 hover:bg-[var(--surface-3)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
                style={{
                  backgroundColor: selectedCategory === 'bookmarks' ? '#f59e0b' : 'var(--surface)',
                }}
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
                <span>Favorites</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    selectedCategory === 'bookmarks'
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 opacity-75'
                  }`}
                >
                  {bookmarkCount}
                </span>
              </button>

              {/* Other Categories */}
              {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                const count = TOOLS.filter((t) => t.category === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`dash-cat-${cat.id}`}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border ${
                      isSelected
                        ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-xs'
                        : 'border-[var(--line)] hover:border-[var(--brand)]/50 hover:bg-[var(--surface-3)] text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--brand)' : 'var(--surface)',
                    }}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-black/5 dark:bg-white/10 opacity-75'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollTabs('right')}
              className="flex items-center justify-center w-7 h-7 rounded-lg border ml-1.5 shrink-0 text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--brand)] transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              title="Scroll categories right"
              aria-label="Scroll categories right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const bookmarked = isBookmarked(tool.id);
            const isCopied = copiedId === tool.id;
            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                className="group p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between hover:border-[var(--brand)] relative"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand)' }}
                    >
                      {getIcon(tool.icon)}
                    </div>

                    {/* Top Action Pills */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleCardShare(e, tool)}
                        className="p-1.5 rounded-lg border transition-colors hover:border-[var(--brand)] cursor-pointer"
                        style={{
                          backgroundColor: isCopied ? 'var(--brand-light)' : 'var(--surface-2)',
                          borderColor: isCopied ? 'var(--brand)' : 'var(--line)',
                          color: isCopied ? 'var(--brand)' : 'var(--muted)',
                        }}
                        title={isCopied ? 'Link Copied!' : 'Share Tool Link'}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => handleCardBookmark(e, tool.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          bookmarked
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                            : 'hover:border-[var(--brand)]'
                        }`}
                        style={
                          bookmarked
                            ? {}
                            : { backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }
                        }
                        title={bookmarked ? 'Remove Bookmark' : 'Save Tool to Bookmarks'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            bookmarked
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                          }`}
                        />
                      </button>

                      {tool.popular && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                          Popular
                        </span>
                      )}

                      {tool.isNew && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3
                      className="font-bold text-base group-hover:text-[var(--brand)] transition-colors"
                      style={{ color: 'var(--ink)' }}
                    >
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
                    <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--muted)' }}>
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div
                  className="pt-4 mt-4 border-t flex items-center justify-between text-xs"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <span className="font-medium capitalize text-[11px]" style={{ color: 'var(--muted)' }}>
                    {tool.category}
                  </span>
                  <a
                    href={getToolPath(tool)}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                        e.preventDefault();
                        onSelectTool(tool);
                      }
                    }}
                    className="flex items-center gap-1 font-semibold text-[var(--brand)] group-hover:translate-x-1 transition-transform"
                  >
                    <span>Launch tool</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State when Bookmarks are empty */}
        {selectedCategory === 'bookmarks' && filteredTools.length === 0 && (
          <div
            className="text-center py-16 px-4 rounded-3xl border border-dashed space-y-4 max-w-md mx-auto"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-amber-100 dark:bg-amber-950/50 text-amber-500">
              <Star className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                No Bookmarked Tools Yet
              </h3>
              <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--muted)' }}>
                Click the star icon on any developer tool to save your favorites for instant 1-click access anytime!
              </p>
            </div>
            <button
              onClick={() => onSelectCategory('all')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Browse All 30+ Tools
            </button>
          </div>
        )}
      </div>
    </div>
  );
};