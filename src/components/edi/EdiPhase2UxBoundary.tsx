import React, { useMemo, useState } from 'react';
import { Code2, Info, Sparkles } from 'lucide-react';
import { ToolShell } from './ToolShell';
import { EdiTreeView, EdiTreeSegment } from './EdiTreeView';
import { EDI_TRANSACTIONS } from '../../data/ediDictionary';

interface EdiPhase2UxBoundaryProps {
  title: string;
  description: string;
  badge?: string;
  defaultSampleId?: string;
  initialInput?: string;
  onSampleLoad?: (payload: string, sampleId: string) => void;
  children: React.ReactNode;
}

function parseGatewayTree(input: string): EdiTreeSegment[] {
  if (!input.trim()) return [];
  const isEdifact = /^\s*(?:UNA|UNB|UNH)/.test(input);
  const element = isEdifact ? '+' : '*';
  const terminator = isEdifact ? "'" : '~';
  return input.split(terminator).map(s => s.trim()).filter(Boolean).map((raw, index) => {
    const parts = raw.split(element);
    const tag = (parts.shift() || '').trim().toUpperCase();
    return { id: `gateway-${tag}-${index}`, tag, name: tag, lineNumber: index + 1, elements: parts.map((value, i) => ({ position: `${tag}${String(i + 1).padStart(2, '0')}`, index: i, value: value.trim(), name: `Element ${i + 1}` })) };
  });
}

/** Phase 2 gateway UX: Simple/Advanced progressive disclosure, Story Mode samples, and visual inspection. */
export const EdiPhase2UxBoundary: React.FC<EdiPhase2UxBoundaryProps> = ({ title, description, badge = 'PHASE 2', defaultSampleId = '850', initialInput = '', onSampleLoad, children }) => {
  const [selectedSampleId, setSelectedSampleId] = useState(defaultSampleId);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const tree = useMemo(() => parseGatewayTree(initialInput), [initialInput]);

  const handleSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    const sample = EDI_TRANSACTIONS.find(tx => tx.id === sampleId || tx.code === sampleId);
    if (sample) onSampleLoad?.(sample.samplePayload, sample.id);
  };

  return (
    <ToolShell
      title={title}
      description={description}
      badge={badge}
      selectedSampleId={selectedSampleId}
      onSelectSample={handleSample}
      hasInput={Boolean(initialInput)}
      secondaryActions={
        <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg)' }}>
          <button type="button" onClick={() => setMode('simple')} aria-pressed={mode === 'simple'} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${mode === 'simple' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)]'}`}><Sparkles className="inline w-3 h-3 mr-1" />Simple</button>
          <button type="button" onClick={() => setMode('advanced')} aria-pressed={mode === 'advanced'} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${mode === 'advanced' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)]'}`}><Code2 className="inline w-3 h-3 mr-1" />Advanced</button>
        </div>
      }
      leftPaneTitle={mode === 'simple' ? 'Guided Gateway' : 'Advanced Gateway'}
      leftPaneContent={
        <div>
          {mode === 'simple' && <div className="p-4 border-b flex items-start gap-3" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}><div className="p-2 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]"><Info className="w-4 h-4" /></div><div><div className="text-xs font-bold text-[var(--ink)]">Start with a guided transaction</div><p className="text-[11px] leading-5 text-[var(--muted)] mt-0.5">Choose a Story Mode step or individual sample above. Switch to Advanced when you need the complete gateway controls.</p></div></div>}
          {children}
        </div>
      }
      rightPaneTitle="Segment Inspector"
      rightPaneContent={<div className="p-3">{tree.length ? <EdiTreeView segments={tree} /> : <div className="min-h-[280px] flex items-center justify-center text-center"><div><Info className="w-5 h-5 mx-auto text-[var(--muted)]" /><p className="text-xs font-semibold text-[var(--ink)] mt-2">No EDI payload yet</p><p className="text-[11px] text-[var(--muted)] mt-1">Load a sample or paste an inbound/outbound message.</p></div></div>}</div>}
    />
  );
};
