import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Package,
  Truck,
  Globe,
  ArrowRight,
  Check,
} from 'lucide-react';
import { EDI_TRANSACTIONS } from '../../data/ediDictionary';
import { STORY_MODE_FLOWS, StoryModeFlow } from '../../data/ediStoryFlows';

interface SampleSelectorProps {
  selectedSampleId: string;
  onSelectSample: (sampleId: string) => void;
  className?: string;
}

export const SampleSelector: React.FC<SampleSelectorProps> = ({
  selectedSampleId,
  onSelectSample,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStoryFlow, setActiveStoryFlow] = useState<StoryModeFlow | null>(null);

  const currentTransaction = EDI_TRANSACTIONS.find((t) => t.id === selectedSampleId);

  const getFlowIcon = (iconName: string) => {
    switch (iconName) {
      case 'Truck':
        return <Truck className="w-3.5 h-3.5 text-blue-500" />;
      case 'Globe':
        return <Globe className="w-3.5 h-3.5 text-amber-500" />;
      case 'Package':
      default:
        return <Package className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const categories = Array.from(new Set(EDI_TRANSACTIONS.map((t) => t.category)));

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:border-[var(--brand)]"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: isOpen ? 'var(--brand)' : 'var(--line)',
          color: 'var(--ink)',
        }}
        title="Browse Realistic Samples & Supply Chain Story Mode Presets"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Try Sample</span>
        {currentTransaction && (
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--brand)] border border-[var(--line)]">
            {currentTransaction.code}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute left-0 top-full mt-2 w-[340px] sm:w-[480px] max-h-[500px] overflow-y-auto rounded-2xl border shadow-xl z-50 p-3 space-y-4"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            {/* Story Mode */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2 px-1">
                Story Mode — Supply Chain Cycles
              </div>
              <div className="space-y-1.5">
                {STORY_MODE_FLOWS.map((flow) => (
                  <button
                    key={flow.id}
                    type="button"
                    onClick={() => setActiveStoryFlow(activeStoryFlow?.id === flow.id ? null : flow)}
                    className="w-full p-2.5 rounded-xl border text-left transition-all hover:border-[var(--brand)] flex items-start gap-2.5"
                    style={{
                      backgroundColor: activeStoryFlow?.id === flow.id ? 'var(--surface-2)' : 'var(--bg)',
                      borderColor: activeStoryFlow?.id === flow.id ? 'var(--brand)' : 'var(--line)',
                    }}
                  >
                    <div className="mt-0.5">{getFlowIcon(flow.iconName)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[var(--ink)]">{flow.title}</div>
                      <div className="text-[10px] text-[var(--muted)] mt-0.5 line-clamp-1">{flow.description}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>

              {activeStoryFlow && (
                <div className="mt-2 p-2 rounded-xl border space-y-1" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg)' }}>
                  {activeStoryFlow.steps.map((step, idx) => (
                    <button
                      key={step.sampleId}
                      type="button"
                      onClick={() => {
                        onSelectSample(step.sampleId);
                        setIsOpen(false);
                        setActiveStoryFlow(null);
                      }}
                      className="w-full flex items-center gap-2 p-1.5 rounded-lg text-left hover:bg-[var(--surface)] transition-colors"
                    >
                      <span className="w-5 h-5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-[var(--ink)]">
                          {step.transaction} — {step.role}
                        </div>
                        <div className="text-[10px] text-[var(--muted)] truncate">{step.description}</div>
                      </div>
                      {selectedSampleId === step.sampleId && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Individual samples by category */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2 px-1">
                Individual Transaction Samples
              </div>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category}>
                    <div className="text-[10px] font-semibold text-[var(--muted)] mb-1.5 px-1">{category}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {EDI_TRANSACTIONS.filter((t) => t.category === category).map((tx) => {
                        const isSelected = selectedSampleId === tx.id;
                        return (
                          <button
                            key={tx.id}
                            type="button"
                            onClick={() => {
                              onSelectSample(tx.id);
                              setIsOpen(false);
                            }}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-[var(--brand)] bg-[var(--surface-2)] shadow-xs'
                                : 'border-[var(--line)] hover:border-[var(--brand)] bg-[var(--bg)]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className="font-mono font-bold text-xs"
                                style={{ color: isSelected ? 'var(--brand)' : 'var(--ink)' }}
                              >
                                {tx.code}
                              </span>
                              <span
                                className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold"
                                style={{
                                  backgroundColor: tx.standard === 'EDIFACT' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(91, 82, 232, 0.1)',
                                  color: tx.standard === 'EDIFACT' ? '#d97706' : 'var(--brand)',
                                }}
                              >
                                {tx.standard}
                              </span>
                            </div>
                            <span className="text-[11px] font-medium truncate mt-0.5" style={{ color: 'var(--ink)' }}>
                              {tx.name.replace(`${tx.code} `, '')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
