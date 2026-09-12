import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, Eye, EyeOff } from 'lucide-react';

interface PhiMaskToggleProps {
  isMasked: boolean;
  onToggle: (nextState: boolean) => void;
  maskedCount?: number;
  className?: string;
}

export const PhiMaskToggle: React.FC<PhiMaskToggleProps> = ({
  isMasked,
  onToggle,
  maskedCount = 0,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={() => onToggle(!isMasked)}
      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
        isMasked
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
          : 'hover:border-[var(--brand)] text-[var(--muted)]'
      } ${className}`}
      style={{
        backgroundColor: isMasked ? undefined : 'var(--surface)',
        borderColor: isMasked ? undefined : 'var(--line)',
      }}
      title="HIPAA Safe Harbor PHI Masking: Redact real patient names, member IDs, DOBs, and addresses locally in-browser"
    >
      {isMasked ? (
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>PHI Redacted</span>
          {maskedCount > 0 && (
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 font-bold">
              {maskedCount}
            </span>
          )}
        </>
      ) : (
        <>
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>Mask PHI</span>
        </>
      )}
    </button>
  );
};
