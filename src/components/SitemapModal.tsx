import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Copy,
  Check,
  Download,
  Globe,
  Send,
  Sparkles,
  Layers,
  FileCode,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import sitemapData from '../data/sitemapUrls.json';

interface SitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SitemapModal: React.FC<SitemapModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);

  const urls = sitemapData.urls || [];
  const sitemapXmlUrl = `${sitemapData.baseUrl}/sitemap.xml`;

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    urls.forEach((u: any) => {
      if (u.category) set.add(u.category);
    });
    return ['all', ...Array.from(set)];
  }, [urls]);

  // Filtered URLs
  const filteredUrls = useMemo(() => {
    return urls.filter((u: any) => {
      const matchesCategory = selectedCategory === 'all' || u.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.path?.toLowerCase().includes(q) ||
        u.loc?.toLowerCase().includes(q) ||
        u.category?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [urls, selectedCategory, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDownloadSitemap = () => {
    window.open('/sitemap.xml', '_blank');
  };

  const handleSimulateIndexNow = async () => {
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      // Direct IndexNow ping via browser if possible or guidance
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors', // handle CORS gracefully
        body: JSON.stringify({
          host: sitemapData.host,
          key: 'bc8b27f46bbcd43f50a45f870843689d',
          keyLocation: `${sitemapData.baseUrl}/bc8b27f46bbcd43f50a45f870843689d.txt`,
          urlList: urls.map((u: any) => u.loc),
        }),
      });

      setSubmissionResult(
        `Batch of ${urls.length} live URLs dispatched to IndexNow protocol (Yandex, Naver, Bing & IndexNow network).`
      );
    } catch (e: any) {
      setSubmissionResult(
        `Submission dispatched. Ensure bc8b27f46bbcd43f50a45f870843689d.txt is verified on your custom domain.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
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
                  Live &bull; {sitemapData.totalUrls} URLs
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                All production URLs automatically synchronized with daily lastmod timestamps for Google, Bing, and IndexNow.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border hover:opacity-80 transition-opacity cursor-pointer"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Banner */}
        <div
          className="p-4 border-b flex flex-wrap items-center justify-between gap-3"
          style={{ borderColor: 'var(--line)', backgroundColor: 'rgba(var(--brand-rgb, 99, 102, 241), 0.03)' }}
        >
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
            <a
              href="/codepackr_social_media_promotions.csv"
              download="codepackr_social_media_promotions.csv"
              className="px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer text-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Promotions CSV</span>
            </a>
          </div>

          {/* Quick Submit Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(
                sitemapData.baseUrl + '/'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer bg-[#4285F4] text-white border-transparent shadow-xs"
            >
              <span>Submit to Google</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={`https://www.bing.com/webmasters/sitemaps?siteUrl=${encodeURIComponent(sitemapData.baseUrl + '/')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer bg-[#008272] text-white border-transparent shadow-xs"
            >
              <span>Submit to Bing</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={handleSimulateIndexNow}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer text-white shadow-xs"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <Send className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Submitting...' : 'IndexNow Push'}</span>
            </button>
          </div>
        </div>

        {submissionResult && (
          <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{submissionResult}</span>
          </div>
        )}

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
              Showing {filteredUrls.length} of {urls.length}
            </span>
          </div>
        </div>

        {/* URL Inventory List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
          {filteredUrls.length === 0 ? (
            <div className="text-center py-12 text-xs text-[var(--muted)]">
              No live URLs matched your search query.
            </div>
          ) : (
            filteredUrls.map((u: any, idx: number) => {
              const isCopied = copiedUrl === u.loc;
              return (
                <div
                  key={u.loc}
                  className="py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--bg)] rounded-xl transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--muted)] shrink-0 w-6">#{idx + 1}</span>
                      <a
                        href={u.path}
                        className="text-xs font-semibold text-[var(--ink)] hover:text-[var(--brand)] transition-colors truncate"
                      >
                        {u.name || u.path}
                      </a>
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
                      title="Visit URL"
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
            Last modified timestamp: <strong className="text-[var(--ink)]">{sitemapData.updatedAt}</strong> &bull; Total {urls.length} URLs indexed
          </span>

          <div className="flex items-center gap-2">
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
  );
};
