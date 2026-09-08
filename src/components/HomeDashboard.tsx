import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, Star, Share2, Check, EyeOff, Terminal, Zap } from 'lucide-react';
import { ToolDef, CategoryFilter } from '../types';
import { TOOLS, CATEGORIES } from '../data/tools';
import { getIcon } from '../lib/icons';
import { useBookmarks, shareToolUrl } from '../lib/bookmarks';
import { useToolGovernance } from '../lib/useToolGovernance';
import { useAdminAuth } from '../lib/useAdminAuth';
import { SmartPasteHero } from './SmartPasteHero';

interface HomeDashboardProps {
  onSelectTool: (tool: ToolDef, initialPayload?: string) => void;
  onOpenSearch: () => void;
  selectedCategory: CategoryFilter;
  onSelectCategory: (cat: CategoryFilter) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onSelectTool,
  selectedCategory,
  onSelectCategory,
  onOpenSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { isToolVisible, getToolStatus } = useToolGovernance();
  const { isAuthenticated } = useAdminAuth();
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(navigator.userAgent.includes('Mac'));
    }
  }, []);

  const handleCardShare = async (e: React.MouseEvent, tool: ToolDef) => {
    e.stopPropagation();
    const success = await shareToolUrl(tool.id, tool.name, tool.description);
    if (success) {
      setCopiedId(tool.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      if (!isToolVisible(tool.id, isAuthenticated)) return false;
      if (selectedCategory === 'bookmarks' && !isBookmarked(tool.id)) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'bookmarks' && tool.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q) || tool.keywords?.some((k) => k.toLowerCase().includes(q));
      }
      return true;
    });
  }, [selectedCategory, searchQuery, isBookmarked, isToolVisible, isAuthenticated]);

  return (
    <div id="home-dashboard" className="space-y-10 pb-16 animate-fade-in">
      
      {/* Hero Section */}
      <div className="relative py-12 px-6 lg:px-12 rounded-3xl bg-[color:var(--surface)] border border-[color:var(--border)] overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[color:var(--brand)] via-[color:var(--accent)] to-[color:var(--success)]"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink-muted)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[color:var(--success)] animate-pulse"></span>
            100% Client-Side Execution
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[color:var(--ink)] mb-4 leading-tight">
            Developer Tools,<br />Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--accent)]">Speed &amp; Privacy.</span>
          </h1>
          <p className="text-lg text-[color:var(--ink-muted)] mb-8 max-w-2xl leading-relaxed">
            A premium suite of formatters, converters, and engineering utilities. Process JSON, XML, EDI, and cryptographic operations instantly in your browser.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => document.getElementById('tool-grid')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 rounded-xl font-bold text-white bg-[color:var(--brand)] hover:bg-[color:var(--brand-hover)] transition-colors shadow-sm cursor-pointer"
            >
              Explore Utilities
            </button>
            <button
              onClick={onOpenSearch}
              className="px-6 py-3 rounded-xl font-bold border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink)] hover:border-[color:var(--brand)] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Search className="w-5 h-5" />
              Search Tools ({isMac ? '⌘' : 'Ctrl'} K)
            </button>
          </div>
        </div>
        {/* Abstract Background Decoration */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-10 pointer-events-none hidden lg:block">
           <Terminal className="w-96 h-96 text-[color:var(--brand)]" />
        </div>
      </div>

      {/* Enterprise Smart Paste Discovery Box */}
      <SmartPasteHero onSelectTool={onSelectTool} />

      {/* Toolbar & Filters */}
      <div id="tool-grid" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4 sticky top-16 bg-[color:var(--bg)] z-30 py-2">
        <div className="flex-1 w-full md:max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-[color:var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter current view..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink)] focus:outline-none focus:border-[color:var(--brand)] transition-colors shadow-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-[color:var(--ink-muted)]">
           <div className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-[color:var(--warning)]"/> {filteredTools.length} Utilities</div>
        </div>
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTools.map((tool) => {
          const bookmarked = isBookmarked(tool.id);
          const isCopied = copiedId === tool.id;
          const gov = getToolStatus(tool.id);
          const isHidden = gov.status === 'hidden' || gov.visibility === 'admin_only';

          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className="group relative flex flex-col bg-[color:var(--surface)] rounded-2xl border border-[color:var(--border)] p-5 cursor-pointer transition-all hover:border-[color:var(--brand)] hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink)] group-hover:text-[color:var(--brand)] group-hover:border-[color:var(--brand)] transition-colors shadow-sm">
                  {getIcon(tool.icon, 24)}
                </div>
                <div className="flex items-center gap-2">
                   {tool.popular && <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-[color:var(--warning)]/10 text-[color:var(--warning)]">Popular</span>}
                   {isHidden && <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-[color:var(--danger)]/10 text-[color:var(--danger)] flex items-center gap-1"><EyeOff className="w-3 h-3"/> Hidden</span>}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(tool.id); }}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${bookmarked ? 'bg-[color:var(--warning)]/10 border-[color:var(--warning)]/30 text-[color:var(--warning)]' : 'border-transparent text-[color:var(--ink-muted)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--ink)]'}`}
                    aria-label="Bookmark"
                  >
                    <Star className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => handleCardShare(e, tool)}
                    className="p-2 rounded-lg border border-transparent text-[color:var(--ink-muted)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--ink)] transition-colors cursor-pointer"
                    aria-label="Share"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-[color:var(--success)]" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-[color:var(--ink)] mb-2 group-hover:text-[color:var(--brand)] transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-[color:var(--ink-muted)] line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[color:var(--border)] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-muted)]">
                  {tool.category}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-[color:var(--brand)] group-hover:translate-x-1 transition-transform">
                  Open <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto bg-[color:var(--surface-elevated)] rounded-2xl flex items-center justify-center text-[color:var(--ink-muted)] mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[color:var(--ink)] mb-2">No tools found</h3>
          <p className="text-[color:var(--ink-muted)] mb-6">We couldn't find any utilities matching your search criteria.</p>
          <button onClick={() => { setSearchQuery(''); onSelectCategory('all'); }} className="px-5 py-2.5 rounded-xl font-bold bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-hover)] transition-colors cursor-pointer">
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
