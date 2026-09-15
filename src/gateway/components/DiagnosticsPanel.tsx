import React, { useState } from 'react';
import { DiagnosticMessage } from '../../edi-core/models/canonical';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Search } from 'lucide-react';

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticMessage[];
  onSelectSegment?: (segTag: string) => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ diagnostics, onSelectSegment }) => {
  const [filter, setFilter] = useState<'ALL' | 'ERROR' | 'WARNING' | 'INFO'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = diagnostics.filter((d) => {
    if (filter !== 'ALL' && d.level !== filter) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      d.message.toLowerCase().includes(term) ||
      (d.code && d.code.toLowerCase().includes(term)) ||
      (d.segment && d.segment.toLowerCase().includes(term))
    );
  });

  const errorCount = diagnostics.filter((d) => d.level === 'ERROR').length;
  const warnCount = diagnostics.filter((d) => d.level === 'WARNING').length;
  const infoCount = diagnostics.filter((d) => d.level === 'INFO').length;

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 bg-[var(--bg)] border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Diagnostics</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--line)] text-[var(--ink)] font-mono">
            {diagnostics.length}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2 py-1 rounded transition-colors ${
              filter === 'ALL' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)] hover:bg-[var(--line)]'
            }`}
          >
            All ({diagnostics.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('ERROR')}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              filter === 'ERROR'
                ? 'bg-rose-500 text-white'
                : 'text-rose-500 hover:bg-rose-500/10'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Errors ({errorCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('WARNING')}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              filter === 'WARNING'
                ? 'bg-amber-500 text-white'
                : 'text-amber-500 hover:bg-amber-500/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Warnings ({warnCount})
          </button>
        </div>
      </div>

      <div className="p-2 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diagnostic messages or segment tags..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
          />
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto divide-y divide-[var(--line)]">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--muted)] flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>No validation diagnostics in this category.</span>
          </div>
        ) : (
          filtered.map((diag, idx) => (
            <div key={idx} className="p-3 text-xs flex items-start gap-2.5 hover:bg-[var(--bg)]/50 transition-colors">
              {diag.level === 'ERROR' ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              ) : diag.level === 'WARNING' ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                      diag.level === 'ERROR'
                        ? 'bg-rose-500/15 text-rose-500'
                        : diag.level === 'WARNING'
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-sky-500/15 text-sky-500'
                    }`}
                  >
                    {diag.code || diag.level}
                  </span>

                  {diag.stage && (
                    <span className="text-[10px] text-[var(--muted)] bg-[var(--line)] px-1.5 py-0.5 rounded">
                      {diag.stage}
                    </span>
                  )}

                  {diag.segment && (
                    <button
                      type="button"
                      onClick={() => onSelectSegment && onSelectSegment(diag.segment!)}
                      className="text-[10px] font-mono font-bold text-[var(--brand)] bg-[var(--brand)]/10 px-1.5 py-0.5 rounded hover:underline cursor-pointer"
                    >
                      {diag.segment}
                      {diag.element ? ` > ${diag.element}` : ''}
                    </button>
                  )}
                </div>

                <p className="text-[var(--ink)] leading-relaxed">{diag.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
