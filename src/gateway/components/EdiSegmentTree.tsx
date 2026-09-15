import React, { useState } from 'react';
import { ParsedSegment } from '../../edi-core/models/segments';
import { Search, ChevronRight, Hash, Layers } from 'lucide-react';

interface EdiSegmentTreeProps {
  segments: ParsedSegment[];
  highlightTag?: string;
  onSelectSegment?: (segment: ParsedSegment) => void;
}

export const EdiSegmentTree: React.FC<EdiSegmentTreeProps> = ({
  segments,
  highlightTag,
  onSelectSegment,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'ISA':
      case 'IEA':
      case 'UNB':
      case 'UNZ':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'GS':
      case 'GE':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'ST':
      case 'SE':
      case 'UNH':
      case 'UNT':
        return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30';
      case 'N1':
      case 'N2':
      case 'N3':
      case 'N4':
      case 'NAD':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'PO1':
      case 'POC':
      case 'LIN':
      case 'IT1':
      case 'W07':
      case 'SV1':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'CTT':
      case 'TDS':
      case 'CNT':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30';
    }
  };

  const filtered = segments.filter((s) => {
    if (highlightTag && s.tag === highlightTag) return true;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.tag.toLowerCase().includes(q) || s.elements.some((e) => e.toLowerCase().includes(q));
  });

  const activeSegment = selectedIdx !== null ? segments[selectedIdx] : segments[0] || null;

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
      {/* Segments Stream */}
      <div className="w-full md:w-1/2 flex flex-col min-w-0">
        <div className="p-2.5 bg-[var(--bg)] border-b border-[var(--line)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              EDI Segments ({segments.length})
            </span>
          </div>
        </div>

        <div className="p-2 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search segment tags or element contents..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-[var(--line)] bg-[var(--surface)]">
          {filtered.map((seg, idx) => {
            const isSelected = activeSegment === seg;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedIdx(idx);
                  if (onSelectSegment) onSelectSegment(seg);
                }}
                className={`w-full p-2.5 text-left text-xs font-mono flex items-center gap-2.5 transition-colors ${
                  isSelected ? 'bg-[var(--brand)]/10 text-[var(--ink)]' : 'hover:bg-[var(--bg)]/50 text-[var(--ink)]'
                }`}
              >
                <span className="text-[10px] text-[var(--muted)] w-5 text-right shrink-0">
                  {seg.lineNumber}
                </span>

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${getTagColor(
                    seg.tag
                  )}`}
                >
                  {seg.tag}
                </span>

                <span className="truncate flex-1 text-[var(--ink)] opacity-90 text-[11px]">
                  {seg.elements.join(' * ')}
                </span>

                <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)] shrink-0 opacity-40" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Element Inspector */}
      <div className="w-full md:w-1/2 p-3 bg-[var(--bg)]/30 flex flex-col min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center justify-between">
          <span>Segment Elements Inspector</span>
          {activeSegment && (
            <span className="font-mono text-[10px] text-[var(--brand)] font-bold">
              Line {activeSegment.lineNumber}
            </span>
          )}
        </div>

        {activeSegment ? (
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)]">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)] mb-1">Raw Segment String</div>
              <div className="font-mono text-xs text-[var(--ink)] break-all font-semibold">
                {activeSegment.raw}
              </div>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Elements Detail</div>
              {activeSegment.elements.map((elemVal, eIdx) => (
                <div
                  key={eIdx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs font-mono"
                >
                  <span className="text-[var(--muted)] font-semibold flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {activeSegment.tag}
                    {String(eIdx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[var(--ink)] font-medium truncate max-w-xs" title={elemVal}>
                    {elemVal || '<empty>'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-6 text-xs text-[var(--muted)]">
            Select a segment to inspect individual element values and positions.
          </div>
        )}
      </div>
    </div>
  );
};
