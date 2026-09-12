import React, { useMemo, useState } from 'react';
import { Code2, Copy, Check, Eye, GitCompare, Info, Search, Sparkles } from 'lucide-react';
import { EdiTreeView, EdiTreeSegment } from './EdiTreeView';
import { EDI_TRANSACTIONS } from '../../data/ediDictionary';

interface EdiPhase2InspectorProps {
  input: string;
  elementSeparator: string;
  segmentTerminator: string;
  onLoadSample?: (sampleId: string) => void;
}

const ENVELOPE_NAMES: Record<string, string[]> = {
  ISA: ['Authorization Qualifier','Authorization Information','Security Qualifier','Security Information','Sender ID Qualifier','Interchange Sender ID','Receiver ID Qualifier','Interchange Receiver ID','Interchange Date','Interchange Time','Repetition Separator','Control Version','Interchange Control Number','Acknowledgment Requested','Usage Indicator','Component Separator'],
  GS: ['Functional Identifier','Application Sender','Application Receiver','Date','Time','Group Control Number','Responsible Agency','Version / Release'],
  ST: ['Transaction Set Identifier','Transaction Set Control Number','Implementation Convention'],
  SE: ['Segment Count','Transaction Set Control Number'],
  GE: ['Transaction Set Count','Group Control Number'],
  IEA: ['Group Count','Interchange Control Number'],
};

function parseTree(input: string, elementSeparator: string, segmentTerminator: string): EdiTreeSegment[] {
  if (!input.trim()) return [];
  let term = segmentTerminator || '~';
  if (term === '~' && !input.includes('~') && /\r?\n/.test(input)) term = '\n';
  const raw = term === '\n' ? input.split(/\r?\n+/) : input.split(term);
  return raw.map((part, index) => part.trim()).filter(Boolean).map((rawSeg, index) => {
    const values = rawSeg.split(elementSeparator || '*');
    const tag = (values.shift() || '').trim().toUpperCase();
    return {
      id: `phase2-${tag}-${index}`,
      tag,
      name: tag,
      lineNumber: index + 1,
      color: undefined,
      elements: values.map((value, i) => ({
        position: `${tag}${String(i + 1).padStart(2, '0')}`,
        index: i,
        value: value.trim(),
        name: ENVELOPE_NAMES[tag]?.[i] || `Element ${i + 1}`,
      })),
    };
  });
}

export const EdiPhase2Inspector: React.FC<EdiPhase2InspectorProps> = ({
  input,
  elementSeparator,
  segmentTerminator,
  onLoadSample,
}) => {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [selected, setSelected] = useState<EdiTreeSegment | null>(null);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('');

  const segments = useMemo(
    () => parseTree(input, elementSeparator, segmentTerminator),
    [input, elementSeparator, segmentTerminator],
  );

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return segments;
    return segments.filter(s => s.tag.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.elements.some(e => e.value.toLowerCase().includes(q)));
  }, [segments, filter]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  if (!input.trim()) {
    return (
      <section className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]"><GitCompare className="w-4 h-4 text-[var(--brand)]" /> Phase 2 Visual Inspector</div>
        <p className="text-[11px] text-[var(--muted)] mt-1">Load or paste an EDI document to inspect its hierarchy, segment positions, and element values side-by-side.</p>
      </section>
    );
  }

  const treeSegments = visible;
  return (
    <section className="space-y-3 rounded-2xl border p-3" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]"><GitCompare className="w-4 h-4 text-[var(--brand)]" /> Visual Tree & Segment Inspector <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">PHASE 2</span></div>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">Synchronized document view: inspect hierarchy and exact element positions without losing the original EDI payload.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg)' }}>
          <button type="button" onClick={() => setMode('simple')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${mode === 'simple' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)]'}`}><Sparkles className="inline w-3 h-3 mr-1" />Simple</button>
          <button type="button" onClick={() => setMode('advanced')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${mode === 'advanced' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)]'}`}><Code2 className="inline w-3 h-3 mr-1" />Advanced</button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Find segment or element value…" className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }} />
        </div>
        {onLoadSample && (
          <select aria-label="Phase 2 sample" className="px-2.5 py-1.5 rounded-xl border text-xs" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }} onChange={e => e.target.value && onLoadSample(e.target.value)} defaultValue="">
            <option value="">Quick sample…</option>
            {EDI_TRANSACTIONS.slice(0, 12).map(tx => <option key={tx.id} value={tx.id}>{tx.code} — {tx.name}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="min-w-0">
          <EdiTreeView segments={treeSegments} onSegmentClick={setSelected} />
        </div>
        <div className="rounded-2xl border overflow-hidden min-h-[280px]" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}>
          <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--line)' }}><Eye className="w-3.5 h-3.5 text-[var(--brand)]" /><span className="text-xs font-bold text-[var(--ink)]">Element Inspector</span></div>
          {selected ? (
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2 flex-wrap"><span className="px-2 py-1 rounded-lg font-mono text-xs font-bold bg-[var(--brand)]/10 text-[var(--brand)]">{selected.tag}</span><span className="text-xs font-semibold text-[var(--ink)]">{selected.name}</span><span className="text-[10px] text-[var(--muted)]">Line {selected.lineNumber}</span></div>
              <div className="p-2.5 rounded-xl border font-mono text-[11px] break-all" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}><span className="text-[var(--muted)]">Raw: </span>{selected.elements.length ? `${selected.tag}${elementSeparator}${selected.elements.map(e => e.value).join(elementSeparator)}${segmentTerminator === '\n' ? '' : segmentTerminator}` : selected.tag}</div>
              <div className="overflow-x-auto"><table className="w-full text-[11px]"><thead><tr className="border-b text-left" style={{ borderColor: 'var(--line)' }}><th className="p-2">Position</th><th className="p-2">Description</th><th className="p-2">Value</th><th className="p-2">Length</th></tr></thead><tbody>{selected.elements.map(el => <tr key={el.index} className="border-b" style={{ borderColor: 'var(--line)' }}><td className="p-2 font-mono text-[var(--brand)]">{el.position}</td><td className="p-2 text-[var(--muted)]">{el.name}</td><td className="p-2 font-mono text-[var(--ink)] break-all">{el.value || '—'}</td><td className="p-2 font-mono text-[var(--muted)]">{el.value.length}</td></tr>)}</tbody></table></div>
              <button type="button" onClick={() => copy(selected.elements.map(e => e.value).join(elementSeparator))} className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)' }}>{copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy elements'}</button>
            </div>
          ) : (
            <div className="h-full min-h-[260px] flex items-center justify-center p-6 text-center"><div><Info className="w-5 h-5 mx-auto text-[var(--muted)]" /><p className="text-xs font-semibold text-[var(--ink)] mt-2">Select a segment</p><p className="text-[11px] text-[var(--muted)] mt-1">The element-position inspector will appear here.</p></div></div>
          )}
        </div>
      </div>

      {mode === 'advanced' && (
        <div className="text-[10px] text-[var(--muted)] px-1">{segments.length} segments parsed • separator <code>{elementSeparator}</code> • terminator <code>{segmentTerminator === '\n' ? 'newline' : segmentTerminator}</code> • Phase 2 preserves the original input and performs inspection in-browser.</div>
      )}
    </section>
  );
};
