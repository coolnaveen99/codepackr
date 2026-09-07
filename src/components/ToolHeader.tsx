import React, { useState } from 'react';
import { Share2, Check, ArrowLeft, Star } from 'lucide-react';
import { ToolDef } from '../types';
import { TOOLS } from '../data/tools';
import { useBookmarks, shareToolUrl } from '../lib/bookmarks';

interface ToolHeaderProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ tool, onBackToHome, onSelectRelated }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(tool.id);

  const handleShare = async () => {
    const success = await shareToolUrl(tool.id, tool.name, tool.description);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleToggleBookmark = () => {
    toggleBookmark(tool.id);
  };

  const relatedTools = TOOLS.filter((t) => t.category === tool.category && t.id !== tool.id).slice(0, 4);

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl border hover:opacity-80 transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--muted)' }}
              title="Back to all tools"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
                {tool.name}
              </h1>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand)' }}
              >
                {tool.category}
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              {tool.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Bookmark Button */}
          <button
            id={`header-bookmark-btn-${tool.id}`}
            onClick={handleToggleBookmark}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-sm ${
              bookmarked
                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : 'hover:border-[var(--brand)]'
            }`}
            style={
              bookmarked
                ? {}
                : { backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }
            }
            title={bookmarked ? 'Remove from Bookmarks' : 'Bookmark this tool'}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                bookmarked ? 'text-amber-500 fill-amber-500' : 'text-zinc-400'
              }`}
            />
            <span>{bookmarked ? 'Saved' : 'Bookmark'}</span>
          </button>

          {/* Share Button */}
          <button
            id={`header-share-btn-${tool.id}`}
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer hover:border-[var(--brand)] shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            title="Share or copy direct link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Related tools shortcuts */}
      {relatedTools.length > 0 && onSelectRelated && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 pb-1 text-xs">
          <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: 'var(--muted)' }}>
            Related:
          </span>
          {relatedTools.map((rt) => (
            <button
              key={rt.id}
              onClick={() => onSelectRelated(rt)}
              className="px-2.5 py-1 rounded-md border text-[11px] whitespace-nowrap transition-colors hover:text-[var(--brand)] hover:border-[var(--brand)]"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {rt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
