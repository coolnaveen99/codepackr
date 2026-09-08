import React, { useState } from 'react';
import { Share2, Check, ArrowLeft, Star } from 'lucide-react';
import { ToolDef } from '../types';
import { TOOLS } from '../data/tools';
import { useBookmarks, shareToolUrl } from '../lib/bookmarks';
import { getIcon } from '../lib/icons';

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

  const relatedTools = TOOLS.filter((t) => t.category === tool.category && t.id !== tool.id).slice(0, 4);

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2.5 mt-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:border-[color:var(--brand)] transition-colors shadow-sm cursor-pointer"
              title="Back to all tools"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)] shadow-xs shrink-0 mt-0.5">
              {getIcon(tool.icon, 28)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-[color:var(--ink)]">
                  {tool.name}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[color:var(--brand-light)] text-[color:var(--brand)]">
                  {tool.category}
                </span>
              </div>
              <p className="text-base text-[color:var(--ink-muted)] max-w-2xl leading-relaxed">
                {tool.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto mt-2 md:mt-0">
          <button
            onClick={() => toggleBookmark(tool.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border transition-all shadow-sm cursor-pointer ${
              bookmarked
                ? 'bg-[color:var(--warning)]/10 border-[color:var(--warning)]/30 text-[color:var(--warning)]'
                : 'bg-[color:var(--surface)] border-[color:var(--border)] text-[color:var(--ink)] hover:border-[color:var(--brand)]'
            }`}
          >
            <Star className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            <span>{bookmarked ? 'Saved' : 'Save'}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink)] hover:border-[color:var(--brand)] transition-all shadow-sm cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[color:var(--success)]" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {relatedTools.length > 0 && onSelectRelated && (
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2 pt-2 border-t border-[color:var(--border)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-muted)] whitespace-nowrap">
            Related:
          </span>
          {relatedTools.map((rt) => (
            <button
              key={rt.id}
              onClick={() => onSelectRelated(rt)}
              className="px-3 py-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-xs font-semibold text-[color:var(--ink-muted)] whitespace-nowrap hover:text-[color:var(--brand)] hover:border-[color:var(--brand)] transition-colors shadow-sm cursor-pointer"
            >
              {rt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
