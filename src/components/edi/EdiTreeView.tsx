import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Search,
  Copy,
  Check,
  Tag,
  Hash,
} from 'lucide-react';

export interface EdiTreeElement {
  position: string;
  index: number;
  value: string;
  name: string;
}

export interface EdiTreeSegment {
  id: string;
  tag: string;
  name: string;
  lineNumber?: number;
  elements: EdiTreeElement[];
  color?: string;
}

interface EdiTreeViewProps {
  segments: EdiTreeSegment[];
  onSegmentClick?: (segment: EdiTreeSegment) => void;
  className?: string;
}

const SEGMENT_COLORS: Record<string, string> = {
  ISA: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  GS: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
  ST: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  SE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  GE: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
  IEA: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  UNB: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  UNH: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  UNT: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  UNZ: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
};

export const EdiTreeView: React.FC<EdiTreeViewProps> = ({
  segments,
  onSegmentClick,
  className = '',
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(segments.slice(0, 5).map((s) => s.id)));
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = search.trim()
    ? segments.filter(
        (s) =>
          s.tag.toLowerCase().includes(search.toLowerCase()) ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.elements.some((e) => e.value.toLowerCase().includes(search.toLowerCase()))
      )
    : segments;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-xs ${className}`} style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
      <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--line)' }}>
        <Layers className="w-3.5 h-3.5 text-[var(--muted)]" />
        <span className="text-xs font-semibold text-[var(--ink)]">Segment Tree</span>
        <span className="text-[10px] text-[var(--muted)] font-mono">{filtered.length} segments</span>
        <div className="flex-1" />
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter..."
            className="pl-7 pr-2 py-1 rounded-lg border text-[11px] w-28 focus:outline-none focus:border-[var(--brand)]"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y" style={{ borderColor: 'var(--line)' }}>
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--muted)]">No segments match.</div>
        ) : (
          filtered.map((seg) => {
            const isOpen = expanded.has(seg.id);
            const colorClass = SEGMENT_COLORS[seg.tag] || 'bg-[var(--surface-2)] text-[var(--ink)] border-[var(--line)]';
            return (
              <div key={seg.id}>
                <button
                  type="button"
                  onClick={() => {
                    toggle(seg.id);
                    onSegmentClick?.(seg);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--bg)] transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${colorClass}`}>
                    {seg.tag}
                  </span>
                  <span className="text-xs font-medium text-[var(--ink)] truncate flex-1">{seg.name}</span>
                  {seg.lineNumber !== undefined && (
                    <span className="text-[10px] font-mono text-[var(--muted)]">L{seg.lineNumber}</span>
                  )}
                  <span className="text-[10px] font-mono text-[var(--muted)]">{seg.elements.length} el</span>
                </button>

                {isOpen && (
                  <div className="px-3 pb-2 pl-9 space-y-1">
                    {seg.elements.length === 0 ? (
                      <p className="text-[10px] text-[var(--muted)] italic">No elements in this segment.</p>
                    ) : (
                      seg.elements.map((el) => (
                        <div
                          key={`${seg.id}-${el.index}`}
                          className="flex items-center gap-2 py-1 px-2 rounded-lg text-[11px] group"
                          style={{ backgroundColor: 'var(--bg)' }}
                        >
                          <span className="font-mono text-[10px] text-[var(--brand)] w-12 shrink-0">{el.position}</span>
                          <span className="text-[var(--muted)] truncate w-24 shrink-0">{el.name}</span>
                          <span className="font-mono text-[var(--ink)] flex-1 truncate">{el.value || '—'}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(el.value, `${seg.id}-${el.index}`);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--surface)]"
                          >
                            {copiedId === `${seg.id}-${el.index}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-[var(--muted)]" />
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
