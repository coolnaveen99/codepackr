import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  Wrench,
  Download,
  Check,
} from 'lucide-react';

export interface ValidationItem {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  segment?: string;
  fixable?: boolean;
  fixDescription?: string;
}

interface ValidationPanelProps {
  issues: ValidationItem[];
  onFixMismatch?: () => void;
  onExportReport?: () => void;
  fidelityScore?: number;
  fidelityNote?: string;
  className?: string;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  issues,
  onFixMismatch,
  onExportReport,
  fidelityScore,
  fidelityNote,
  className = '',
}) => {
  const errorCount = issues.filter((i) => i.type === 'error').length;
  const warnCount = issues.filter((i) => i.type === 'warning').length;
  const hasFixable = issues.some((i) => i.fixable);

  const getStatusBadge = () => {
    if (errorCount > 0) {
      return {
        bg: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
        label: `${errorCount} ${errorCount === 1 ? 'Error' : 'Errors'}`,
        icon: ShieldAlert,
      };
    }
    if (warnCount > 0) {
      return {
        bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        label: `${warnCount} Warnings`,
        icon: AlertTriangle,
      };
    }
    return {
      bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      label: 'Valid Syntax & Envelope',
      icon: CheckCircle2,
    };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 shadow-xs ${className}`}
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${status.bg}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{status.label}</span>
          </span>

          {fidelityScore !== undefined && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{fidelityScore}% Fidelity</span>
              {fidelityNote && <span className="opacity-70 font-normal">· {fidelityNote}</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasFixable && onFixMismatch && (
            <button
              type="button"
              onClick={onFixMismatch}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Auto-Fix</span>
            </button>
          )}
          {onExportReport && (
            <button
              type="button"
              onClick={onExportReport}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 hover:border-[var(--brand)] transition-colors"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      <div
        className="rounded-xl border divide-y overflow-hidden text-xs"
        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
      >
        {issues.length === 0 ? (
          <div className="p-3 text-center text-[var(--muted)]">No validation issues detected.</div>
        ) : (
          issues.map((issue, idx) => {
            const isErr = issue.type === 'error';
            const isWarn = issue.type === 'warning';
            return (
              <div key={idx} className="p-3 flex items-start gap-2.5">
                {isErr ? (
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                ) : isWarn ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold ${isErr ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {issue.message}
                    </span>
                    {issue.segment && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)]">
                        Segment: {issue.segment}
                      </span>
                    )}
                    {issue.line && (
                      <span className="font-mono text-[10px] text-[var(--muted)]">Line #{issue.line}</span>
                    )}
                  </div>
                  {issue.fixDescription && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                      <span>Tip:</span> {issue.fixDescription}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
