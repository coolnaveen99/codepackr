import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowRight, Star, Share2, Check, EyeOff, Terminal, Zap, Lock } from 'lucide-react';
import { ToolDef, CategoryFilter } from '../types';
import { TOOLS, CATEGORIES } from '../data/tools';
import { getIcon } from '../lib/icons';
import { useBookmarks, shareToolUrl } from '../lib/bookmarks';
import { useToolGovernance } from '../lib/useToolGovernance';
import { useAdminAuth } from '../lib/useAdminAuth';
import { SmartPasteHero } from './SmartPasteHero';
import { HeroPreviewCards } from './HeroPreviewCards';

interface HomeDashboardProps {
  onSelectTool: (tool: ToolDef, initialPayload?: string) => void;
  onOpenSearch: () => void;
  selectedCategory: CategoryFilter;
  onSelectCategory: (cat: CategoryFilter) => void;
}

const ROTATING_EXAMPLES = [
  { text: 'Format JSON instantly…', toolId: 'json-formatter' },
  { text: 'Validate EDI 850 in the browser…', toolId: 'edi-validator' },
  { text: 'Decode JWT securely…', toolId: 'jwt-inspector' },
  { text: 'Convert cURL to code…', toolId: 'curl-code-converter' },
  { text: 'Convert EDI to JSON…', toolId: 'edi-to-json' },
  { text: 'Format SQL queries…', toolId: 'sql-formatter' },
  { text: 'Generate EDI 997 Acknowledgment…', toolId: 'edi-997-generator' },
  { text: 'Compute SHA-256 hashes…', toolId: 'hash-generator' },
  { text: 'Format & validate XML…', toolId: 'xml-formatter' },
  { text: 'Encode & decode Base64…', toolId: 'base64' },
  { text: 'Sanitize EDI HIPAA PHI…', toolId: 'edi-hipaa-sanitizer' },
  { text: 'Split & merge EDI batches…', toolId: 'edi-batch-splitter' },
  { text: 'Format YAML configurations…', toolId: 'yaml-formatter' },
  { text: 'Generate OAuth PKCE verifier…', toolId: 'pkce-generator' },
  { text: 'Compare code with Diff Checker…', toolId: 'diff-checker' },
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onSelectTool,
  selectedCategory,
  onSelectCategory,
  onOpenSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeConfetti, setActiveConfetti] = useState<string | null>(null);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { isToolVisible, getToolStatus } = useToolGovernance();
  const { isAuthenticated } = useAdminAuth();
  const [isMac, setIsMac] = React.useState(false);

  // Dynamic Rotating Example State with smooth crossfade
  const [exampleIdx, setExampleIdx] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(navigator.userAgent.includes('Mac'));
    }
  }, []);

  // Smooth rotating text transition: fade out (240ms) -> change text -> fade in (240ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setExampleIdx((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
        setFadeState('in');
      }, 240);
    }, 3400);

    return () => clearInterval(timer);
  }, []);

  const handleLaunchCurrentLiveTool = () => {
    const currentItem = ROTATING_EXAMPLES[exampleIdx];
    const targetTool = TOOLS.find((t) => t.id === currentItem.toolId);
    if (targetTool) {
      onSelectTool(targetTool);
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

  const handleToggleBookmark = (e: React.MouseEvent, toolId: string) => {
    e.stopPropagation();
    const wasBookmarked = isBookmarked(toolId);
    toggleBookmark(toolId);
    if (!wasBookmarked) {
      setActiveConfetti(toolId);
      setTimeout(() => setActiveConfetti(null), 650);
    }
  };

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      if (!isToolVisible(tool.id, isAuthenticated)) return false;
      if (selectedCategory === 'bookmarks' && !isBookmarked(tool.id)) return false;
      if (
        selectedCategory !== 'all' &&
        selectedCategory !== 'bookmarks' &&
        tool.category !== selectedCategory &&
        !tool.secondaryCategories?.includes(selectedCategory as any)
      ) {
        return false;
      }
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

        {/* Ambient Moving Gradient & Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0" aria-hidden="true">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-teal-500/5 blur-3xl animate-drift-slow" />
          <div
            className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-tl from-teal-500/10 via-blue-500/10 to-purple-500/5 blur-3xl animate-drift-slow"
            style={{ animationDelay: '-8s' }}
          />

          {/* Floating code symbols */}
          <span className="absolute top-12 left-1/4 font-mono text-xs text-[color:var(--brand)]/15 select-none animate-soft-float-1 hidden sm:block">
            &lt;code /&gt;
          </span>
          <span className="absolute top-28 right-1/3 font-mono text-sm text-teal-500/15 select-none animate-soft-float-2 hidden sm:block">
            &#123;&nbsp;&#125;
          </span>
          <span className="absolute bottom-16 left-1/3 font-mono text-xs text-indigo-500/15 select-none animate-soft-float-3 hidden sm:block">
            010101
          </span>
          <span className="absolute bottom-20 right-1/4 font-mono text-xs text-amber-500/15 select-none animate-soft-float-1 hidden sm:block">
            ST*850~
          </span>
          <span className="absolute top-36 left-10 font-mono text-sm text-[color:var(--ink-muted)]/15 select-none animate-soft-float-2 hidden md:block">
            &lambda;
          </span>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl flex-1 w-full">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[color:var(--border)] bg-[color:var(--surface-elevated)]/85 text-[color:var(--ink-muted)] mb-6 shadow-xs backdrop-blur-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-lock-pulse" />
              <span className="text-[color:var(--ink)] font-semibold">100% Client-Side Execution</span>
              <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                Zero Telemetry
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[color:var(--ink)] mb-3 leading-tight">
              Enterprise Developer Utilities,<br />
              Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--accent)]">Speed &amp; Privacy.</span>
            </h1>

            {/* Dynamic Rotating Example Line with LIVE Indicator */}
            <div className="flex items-center gap-2.5 text-sm sm:text-base font-mono text-[color:var(--brand)] font-semibold mb-4 h-7">
              {/* Broadcast LIVE indicator with animated red dot placed directly after LIVE - stays completely stable */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-sans font-extrabold text-[11px] uppercase tracking-wider select-none shadow-xs shrink-0"
                title="Live developer utilities stream"
              >
                <span>LIVE</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-90"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                </span>
              </div>

              {/* Smooth crossfading text container with fixed height preventing layout shift */}
              <div className="overflow-hidden flex items-center h-full min-w-0">
                <span
                  onClick={handleLaunchCurrentLiveTool}
                  className={`cursor-pointer hover:underline truncate inline-block transition-all duration-250 ease-out ${
                    fadeState === 'in'
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-1.5'
                  }`}
                  title="Click to open this tool"
                >
                  {ROTATING_EXAMPLES[exampleIdx].text}
                </span>
              </div>
            </div>

            <p className="text-base sm:text-lg text-[color:var(--ink-muted)] mb-8 max-w-xl leading-relaxed">
              Elevate your workflow with a premium suite of offline-first engineering utilities. Securely process JSON, XML, EDI, and cryptographic operations—instantly and entirely within your browser.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => document.getElementById('tool-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 rounded-xl font-bold text-white bg-[color:var(--brand)] hover:bg-[color:var(--brand-hover)] transition-all duration-200 shadow-md hover:shadow-[0_0_24px_rgba(37,99,235,0.4)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-2 group"
              >
                <span>Explore Utilities</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                type="button"
                onClick={onOpenSearch}
                className="px-6 py-3 rounded-xl font-bold border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink)] hover:border-[color:var(--brand)] hover:ring-2 hover:ring-[color:var(--brand)]/15 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2.5 shadow-sm cursor-pointer"
              >
                <Search className="w-4 h-4 text-[color:var(--brand)]" />
                <span>Search Tools</span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink-muted)]">
                  {isMac ? '⌘' : 'Ctrl'} K
                </kbd>
              </button>
            </div>
          </div>

          {/* Desktop Floating Glassmorphic Preview Cards */}
          <HeroPreviewCards onSelectTool={onSelectTool} />
        </div>
      </div>

      {/* Enterprise Smart Paste Discovery Box */}
      <SmartPasteHero onSelectTool={onSelectTool} />

      {/* Toolbar & Filters */}
      <div id="tool-grid" className="space-y-3 border-b border-[color:var(--border)] pb-4 sticky top-16 bg-[color:var(--bg)] z-30 py-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[color:var(--ink)]">Featured Utilities</h2>
            <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[color:var(--surface-elevated)] border border-[color:var(--border)] text-[color:var(--ink-muted)]">
              <Zap className="w-3.5 h-3.5 text-[color:var(--warning)]"/> {filteredTools.length} Available
            </div>
          </div>
          <div className="w-full md:max-w-md">
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
        </div>
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTools.map((tool, idx) => {
          const bookmarked = isBookmarked(tool.id);
          const isCopied = copiedId === tool.id;
          const gov = getToolStatus(tool.id);
          const isHidden = gov.status === 'hidden' || gov.visibility === 'admin_only';
          const hasConfetti = activeConfetti === tool.id;

          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              style={{ animationDelay: `${Math.min(idx * 45, 450)}ms` }}
              className="stagger-card-in group relative flex flex-col bg-[color:var(--surface)] rounded-2xl border border-[color:var(--border)] p-5 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-3 hover:scale-[1.02] hover:border-[color:var(--brand)] hover:ring-2 hover:ring-[color:var(--brand)]/35 hover:shadow-[0_24px_50px_-10px_rgba(37,99,235,0.26)] dark:hover:shadow-[0_24px_50px_-10px_rgba(0,0,0,0.85)]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink)] group-hover:text-[color:var(--brand)] group-hover:border-[color:var(--brand)] group-hover:bg-[color:var(--brand)]/10 group-hover:scale-110 group-hover:shadow-md transition-all duration-200 shadow-sm">
                  {getIcon(tool.icon, 24)}
                </div>
                <div className="flex items-center gap-2">
                   {tool.popular && (
                     <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-[color:var(--warning)]/10 text-[color:var(--warning)] animate-badge-shimmer border border-[color:var(--warning)]/20 shadow-2xs">
                       Featured
                     </span>
                   )}
                   {isHidden && (
                     <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-[color:var(--danger)]/10 text-[color:var(--danger)] flex items-center gap-1">
                       <EyeOff className="w-3 h-3"/> Hidden
                     </span>
                   )}
                  
                  {/* Favorite Button with Confetti Burst */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(e, tool.id)}
                      className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer active:scale-125 ${
                        bookmarked
                          ? 'bg-[color:var(--warning)]/10 border-[color:var(--warning)]/30 text-[color:var(--warning)]'
                          : 'border-transparent text-[color:var(--ink-muted)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--ink)]'
                      }`}
                      aria-label="Bookmark"
                    >
                      <Star className={`w-4 h-4 transition-transform ${bookmarked ? 'fill-current' : ''} ${hasConfetti ? 'animate-star-pop' : ''}`} />
                    </button>

                    {/* Micro Confetti Particle Pop */}
                    {hasConfetti && (
                      <div className="absolute inset-0 pointer-events-none overflow-visible -z-0" aria-hidden="true">
                        {[
                          { x: '18px', y: '-20px', bg: 'bg-amber-400', delay: '0ms' },
                          { x: '-16px', y: '-18px', bg: 'bg-blue-500', delay: '40ms' },
                          { x: '20px', y: '-6px', bg: 'bg-emerald-400', delay: '80ms' },
                          { x: '-18px', y: '-4px', bg: 'bg-purple-500', delay: '120ms' },
                          { x: '0px', y: '-24px', bg: 'bg-pink-400', delay: '60ms' },
                        ].map((p, pIdx) => (
                          <span
                            key={pIdx}
                            style={{
                              '--tw-particle-x': p.x,
                              '--tw-particle-y': p.y,
                              animation: 'particleFly 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                              animationDelay: p.delay,
                            } as React.CSSProperties}
                            className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full ${p.bg}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
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
                <span className="flex items-center gap-1.5 text-sm font-bold text-[color:var(--brand)] group-hover:text-[color:var(--brand-hover)] group-hover:translate-x-1.5 transition-all duration-200">
                  Open <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
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
