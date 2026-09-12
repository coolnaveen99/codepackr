import React, { useMemo, useState } from 'react';
import { ChevronDown, Code2, Info, Sparkles } from 'lucide-react';
import { ToolShell } from './ToolShell';
import { SampleSelector } from './SampleSelector';
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

/**
 * Phase 2 UX boundary for tools that still own their internal workspace UI.
 * Keeps the existing pipeline intact while adding the shared ToolShell chrome,
 * a Story Mode-aware sample selector, and a Simple/Advanced disclosure control.
 */
export const EdiPhase2UxBoundary: React.FC<EdiPhase2UxBoundaryProps> = ({
  title,
  description,
  badge = 'PHASE 2',
  defaultSampleId = '850',
  initialInput = '',
  onSampleLoad,
  children,
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState(defaultSampleId);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

  const selectedSample = useMemo(
    () => EDI_TRANSACTIONS.find((tx) => tx.id === selectedSampleId || tx.code === selectedSampleId),
    [selectedSampleId],
  );

  const handleSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    const sample = EDI_TRANSACTIONS.find((tx) => tx.id === sampleId || tx.code === sampleId);
    if (sample) onSampleLoad?.(sample.samplePayload, sample.id);
  };

  return (
    <ToolShell
      title={title}
      description={description}
      badge={badge}
      selectedSampleId={selectedSampleId}
      onSelectSample={handleSample}
      hasInput={Boolean(initialInput || selectedSample)}
      secondaryActions={
        <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg)' }}>
          <button
            type="button"
            onClick={() => setMode('simple')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${mode === 'simple' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
            aria-pressed={mode === 'simple'}
            title="Show the guided EDI workspace"
          >
            <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Simple</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('advanced')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${mode === 'advanced' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
            aria-pressed={mode === 'advanced'}
            title="Show the full gateway controls"
          >
            <span className="inline-flex items-center gap-1.5"><Code2 className="w-3 h-3" /> Advanced</span>
          </button>
        </div>
      }
      leftPaneTitle={mode === 'simple' ? 'Guided EDI Gateway' : 'Advanced EDI Gateway'}
      leftPaneContent={
        <div className="relative">
          {mode === 'simple' && (
            <div className="p-4 border-b flex items-start gap-3" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
              <div className="p-2 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]"><Info className="w-4 h-4" /></div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[var(--ink)]">Start with a guided sample</div>
                <p className="text-[11px] leading-5 text-[var(--muted)] mt-0.5">
                  Choose a transaction above, then switch to Advanced when you need the complete inbound/outbound gateway controls. Existing gateway processing remains unchanged.
                </p>
                {selectedSample && (
                  <div className="mt-2 inline-flex items-center gap-2 text-[10px] font-mono px-2 py-1 rounded-lg border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
                    <span className="font-bold text-[var(--brand)]">{selectedSample.code}</span>
                    <span className="text-[var(--muted)]">{selectedSample.standard}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className={mode === 'simple' ? 'border-t' : ''} style={{ borderColor: 'var(--line)' }}>
            {children}
          </div>
        </div>
      }
    />
  );
};
