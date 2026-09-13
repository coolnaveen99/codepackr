import React, { useEffect, useState } from 'react';
import { Search, Home, ArrowLeft, FileQuestion } from 'lucide-react';
import { TOOLS } from '../data/tools';
import { ToolDef } from '../types';
import { getIcon } from '../lib/icons';

interface NotFoundViewProps {
  onGoHome: () => void;
  onOpenSearch: () => void;
  onSelectTool: (tool: ToolDef) => void;
  attemptedPath?: string;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  onGoHome,
  onOpenSearch,
  onSelectTool,
  attemptedPath,
}) => {
  const [path, setPath] = useState(attemptedPath || '');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPath(window.location.pathname);
      // Soft signal for crawlers / monitoring that this is not a valid page
      document.title = '404 – Page Not Found | Codepackr';
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) {
        robots.setAttribute('content', 'noindex, follow');
      }
    }
  }, []);

  const popular = TOOLS.filter((t) => t.popular).slice(0, 6);

  return (
    <div
      id="not-found-page"
      className="max-w-2xl mx-auto py-12 sm:py-20 px-4 text-center animate-fade-in"
      role="main"
      aria-labelledby="not-found-heading"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink-muted)]">
        <FileQuestion className="w-10 h-10" aria-hidden="true" />
      </div>

      <p className="text-sm font-bold uppercase tracking-widest text-[color:var(--brand)] mb-2">
        Error 404
      </p>
      <h1
        id="not-found-heading"
        className="text-3xl sm:text-4xl font-extrabold text-[color:var(--ink)] mb-3 tracking-tight"
      >
        Page not found
      </h1>
      <p className="text-base text-[color:var(--ink-muted)] mb-2 leading-relaxed">
        We couldn&apos;t find a tool or page at this address.
      </p>
      {path && path !== '/' && (
        <p className="text-sm font-mono text-[color:var(--ink-muted)] mb-8 px-3 py-1.5 rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--border)] inline-block max-w-full truncate">
          {path}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-[color:var(--brand)] hover:bg-[color:var(--brand-hover)] transition-colors cursor-pointer shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </button>
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink)] hover:border-[color:var(--brand)] transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
          Search tools
        </button>
        <button
          type="button"
          onClick={() => window.history.length > 1 ? window.history.back() : onGoHome()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>
      </div>

      <div className="text-left">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[color:var(--ink-muted)] mb-4">
          Popular tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {popular.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool)}
              className="flex items-center gap-3 p-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--brand)] hover:shadow-sm transition-all text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink)] group-hover:text-[color:var(--brand)] shrink-0">
                {getIcon(tool.icon, 18)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-[color:var(--ink)] group-hover:text-[color:var(--brand)] truncate">
                  {tool.name}
                </div>
                <div className="text-xs text-[color:var(--ink-muted)] truncate">{tool.category}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
