import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Copy,
  Check,
  Download,
  Globe,
  Shield,
  Lock,
  EyeOff,
  Eye,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import sitemapData from '../data/sitemapUrls.json';
import { useAdminAuth } from '../lib/useAdminAuth';
import { useToolGovernance } from '../lib/useToolGovernance';
import { SLUG_TO_TOOL_ID } from '../lib/urls';
import { TOOLS } from '../data/tools';
import { ToolDef } from '../types';
import { AdminLoginModal } from './admin/AdminLoginModal';

interface SitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool?: (tool: ToolDef) => void;
  onNavigateAdmin?: () => void;
}

export const SitemapModal: React.FC<SitemapModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  onNavigateAdmin,
}) => {
  const { user, isAuthenticated, logout } = useAdminAuth();
  const { getToolStatus } = useToolGovernance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [adminVisibilityFilter, setAdminVisibilityFilter] = useState<'all' | 'public' | 'hidden'>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Deduplicated URL inventory annotated with governance status
  const urls = useMemo(() => {
    const seen = new Set<string>();
    const unique: any[] = [];

    (sitemapData.urls || []).forEach((u: any) => {
      const locKey = u.loc || u.path;
      if (!seen.has(locKey)) {
        seen.add(locKey);

        const slug = (u.path || '').replace(/^\/+|\.html$/g, '') || 'home';
        const toolId = SLUG_TO_TOOL_ID[slug] || (TOOLS.some((t) => t.id === slug) ? slug : null);
        const gov = toolId ? getToolStatus(toolId) : null;
        const isHidden = gov ? gov.status === 'hidden' || gov.visibility === 'admin_only' : false;

        unique.push({
          ...u,
          toolId,
          gov,
          isHidden,
        });
      }
    });

    return unique;
  }, [getToolStatus]);

  const sitemapXmlUrl = `${sitemapData.baseUrl}/sitemap.xml`;

  // Filtered by public vs admin
  const publicUrls = useMemo(() => urls.filter((u) => !u.isHidden), [urls]);
  const hiddenUrls = useMemo(() => urls.filter((u) => u.isHidden), [urls]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    urls.forEach((u: any) => {
      if (u.category) set.add(u.category);
    });
    return ['all', ...Array.from(set)];
  }, [urls]);

  // Filtered URLs based on category, search, and visibility permission
  const filteredUrls = useMemo(() => {
    return urls.filter((u: any) => {
      // If not admin, completely conceal hidden URLs
      if (!isAuthenticated && u.isHidden) {
        return false;
      }

      // If admin, honor visibility filter toggle
      if (isAuthenticated) {
        if (adminVisibilityFilter === 'public' && u.isHidden) return false;
        if (adminVisibilityFilter === 'hidden' && !u.isHidden) return false;
      }

      // Category filter
      const matchesCategory = selectedCategory === 'all' || u.category === selectedCategory;

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.path?.toLowerCase().includes(q) ||
        u.loc?.toLowerCase().includes(q) ||
        u.category?.toLowerCase().includes(q) ||
        (u.toolId && u.toolId.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [urls, isAuthenticated, adminVisibilityFilter, selectedCategory, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDownloadSitemap = () => {
    window.open('/sitemap.xml', '_blank');
  };

  const handleItemClick = (e: React.MouseEvent, u: any) => {
    if (u.toolId && onSelectTool) {
      const toolDef = TOOLS.find((t) => t.id === u.toolId);
      if (toolDef) {
        e.preventDefault();
        onSelectTool(toolDef);
        onClose();
        return;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="w-full max-w-4xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
        >
          {/* Header */}
          <div
            className="p-5 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <Globe className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Live Sitemap &amp; Search Indexing Hub</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {isAuthenticated ? `All ${urls.length} URLs` : `${publicUrls.length} Public URLs`}
                  </span>
                  {isAuthenticated && hiddenUrls.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {hiddenUrls.length} Hidden/Drafts
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Automated production URL index synchronized with search engines and real-time governance status.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-xl border hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin Status Banner */}
          {!isAuthenticated ? (
            <div
              className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}
            >
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  Public visitor view active ({publicUrls.length} indexed URLs). Hidden/draft utilities are filtered out.
                </span>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Login to View Hidden</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="font-bold">Admin Mode Active:</span>
                  <span className="ml-1 opacity-90">
                    Viewing full catalog ({urls.length} total URLs, including {hiddenUrls.length} hidden/unlisted utilities).
                  </span>
                  <span className="ml-1.5 font-mono text-[11px] opacity-75">({user?.email})</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onNavigateAdmin && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateAdmin();
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-100 transition-colors cursor-pointer"
                  >
                    Governance Matrix &rarr;
                  </button>
                )}
                <button
                  onClick={logout}
                  className="px-2.5 py-1 rounded-lg text-xs border border-amber-500/30 hover:bg-amber-500/20 text-amber-950 dark:text-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Admin Scope Toggle Bar (when authenticated) */}
          {isAuthenticated && (
            <div
              className="p-2.5 border-b flex items-center gap-1.5 text-xs flex-wrap"
              style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-3)' }}
            >
              <span className="text-[11px] font-semibold text-[var(--muted)] mr-2 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" />
                <span>Scope:</span>
              </span>
              <button
                onClick={() => setAdminVisibilityFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  adminVisibilityFilter === 'all'
                    ? 'bg-[var(--brand)] text-white font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--surface)] border border-[var(--line)]'
                }`}
              >
                All URLs ({urls.length})
              </button>
              <button
                onClick={() => setAdminVisibilityFilter('public')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  adminVisibilityFilter === 'public'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--surface)] border border-[var(--line)]'
                }`}
              >
                Public Only ({publicUrls.length})
              </button>
              <button
                onClick={() => setAdminVisibilityFilter('hidden')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  adminVisibilityFilter === 'hidden'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--surface)] border border-[var(--line)]'
                }`}
              >
                Hidden / Drafts ({hiddenUrls.length})
              </button>
            </div>
          )}

          {/* XML Action Banner */}
          <div
            className="p-4 border-b flex flex-wrap items-center justify-between gap-3"
            style={{ borderColor: 'var(--line)', backgroundColor: 'rgba(var(--brand-rgb, 99, 102, 241), 0.03)' }}
          >
            {/* Public Sitemap Links */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[var(--muted)] font-mono text-[11px] px-2.5 py-1 rounded-lg border bg-[var(--bg)] border-[var(--line)]">
                {sitemapXmlUrl}
              </span>
              <button
                onClick={() => handleCopy(sitemapXmlUrl)}
                className="px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer text-xs"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                {copiedUrl === sitemapXmlUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl === sitemapXmlUrl ? 'Copied' : 'Copy XML URL'}</span>
              </button>
              <button
                onClick={handleDownloadSitemap}
                className="px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer text-xs"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>View XML</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--line)' }}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live indexed URLs, slugs, or tool names..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-1 focus:ring-[var(--brand)] transition-all font-mono"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === cat
                      ? 'border-[var(--brand)] text-[var(--brand)] font-bold'
                      : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === cat ? 'rgba(var(--brand-rgb, 99, 102, 241), 0.08)' : 'transparent',
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
              <span className="text-[11px] text-[var(--muted)] ml-auto shrink-0 pl-2">
                Showing {filteredUrls.length} of {isAuthenticated ? urls.length : publicUrls.length}
              </span>
            </div>
          </div>

          {/* URL Inventory List */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
            {filteredUrls.length === 0 ? (
              <div className="text-center py-12 text-xs text-[var(--muted)]">
                No indexed URLs matched your filter criteria.
              </div>
            ) : (
              filteredUrls.map((u: any, idx: number) => {
                const isCopied = copiedUrl === u.loc;
                return (
                  <div
                    key={`${u.loc || u.path}-${idx}`}
                    className={`py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl transition-colors group ${
                      u.isHidden ? 'bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 my-1' : 'hover:bg-[var(--bg)]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-[var(--muted)] shrink-0 w-6">#{idx + 1}</span>
                        <a
                          href={u.path}
                          onClick={(e) => handleItemClick(e, u)}
                          className={`text-xs font-semibold transition-colors truncate cursor-pointer ${
                            u.isHidden
                              ? 'text-amber-800 dark:text-amber-300 hover:text-amber-600'
                              : 'text-[var(--ink)] hover:text-[var(--brand)]'
                          }`}
                        >
                          {u.name || u.path}
                        </a>

                        {/* Category Badge */}
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-sans border uppercase tracking-wider shrink-0"
                          style={{
                            backgroundColor: 'var(--bg)',
                            borderColor: 'var(--line)',
                            color: 'var(--muted)',
                          }}
                        >
                          {u.category || 'tool'}
                        </span>

                        {/* Governance Hidden / Admin Badge */}
                        {u.isHidden && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-sans border font-bold uppercase tracking-wider shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            <span>Hidden from Public</span>
                          </span>
                        )}

                        {u.gov?.status === 'maintenance' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-sans border font-semibold uppercase tracking-wider shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                            Maintenance
                          </span>
                        )}

                        {u.gov?.status === 'beta' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-sans border font-semibold uppercase tracking-wider shrink-0 bg-blue-500/10 text-blue-600 border-blue-500/20">
                            Beta
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--muted)] truncate pl-8 mt-0.5">
                        {u.loc}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pl-8 sm:pl-0">
                      <div className="text-right text-[11px] text-[var(--muted)] font-sans hidden md:block">
                        <span>Pri: {u.priority}</span> &bull; <span>{u.changefreq}</span>
                      </div>

                      <button
                        onClick={() => handleCopy(u.loc)}
                        title="Copy URL"
                        className="p-1.5 rounded-lg border text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--brand)] transition-colors cursor-pointer"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <a
                        href={u.path}
                        onClick={(e) => handleItemClick(e, u)}
                        title={u.isHidden ? 'Admin Preview URL' : 'Visit URL'}
                        className="p-1.5 rounded-lg border text-[var(--muted)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-colors cursor-pointer"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg)' }}
          >
            <span className="text-[var(--muted)]">
              Last modified timestamp: <strong className="text-[var(--ink)]">{sitemapData.updatedAt}</strong> &bull;{' '}
              {isAuthenticated ? `${urls.length} Total URLs` : `${publicUrls.length} Public URLs`}
            </span>

            <div className="flex items-center gap-2">
              {!isAuthenticated && (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-[var(--line)] text-xs font-semibold hover:border-[var(--brand)] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[var(--muted)]" />
                  <span>Admin Sign In</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
        }}
      />
    </>
  );
};

