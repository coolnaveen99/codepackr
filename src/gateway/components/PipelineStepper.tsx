import React from 'react';
import { PipelineContext } from '../../edi-core/models/pipeline';
import { CheckCircle2, Circle, AlertCircle, PlayCircle } from 'lucide-react';

interface PipelineStepperProps {
  context: PipelineContext;
  onSelectStage?: (stageId: string) => void;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ context, onSelectStage }) => {
  const { stages, currentStage, completedStages, status, errors } = context;

  return (
    <div className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">
        {stages.map((st, idx) => {
          const isCompleted = completedStages.includes(st.id);
          const isCurrent = currentStage === st.id;
          const hasError = errors.some((e) => e.stageId === st.id);

          return (
            <React.Fragment key={st.id}>
              <button
                type="button"
                onClick={() => onSelectStage && onSelectStage(st.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
                  isCurrent
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm'
                    : hasError
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-[var(--bg)] text-[var(--muted)] border-transparent hover:border-[var(--line)]'
                }`}
                title={st.shortDesc}
              >
                {hasError ? (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <PlayCircle className="w-4 h-4 text-white shrink-0 animate-pulse" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-[var(--muted)] shrink-0 opacity-40" />
                )}
                <span>
                  {idx + 1}. {st.label}
                </span>
              </button>

              {idx < stages.length - 1 && (
                <div
                  className={`h-0.5 w-4 sm:w-6 shrink-0 transition-colors ${
                    isCompleted ? 'bg-emerald-500/50' : 'bg-[var(--line)]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
