import React from 'react';
import {
  FileText,
  Upload,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { SampleSelector } from './SampleSelector';
import { PhiMaskToggle } from './PhiMaskToggle';

export interface ToolShellProps {
  title?: string;
  description?: string;
  badge?: string;
  selectedSampleId?: string;
  onSelectSample?: (sampleId: string) => void;
  isPhiMasked?: boolean;
  onTogglePhiMask?: (next: boolean) => void;
  maskedPhiCount?: number;
  segmentTerminator?: string;
  elementSeparator?: string;
  subElementSeparator?: string;
  onSegmentTerminatorChange?: (val: string) => void;
  onElementSeparatorChange?: (val: string) => void;
  onSubElementSeparatorChange?: (val: string) => void;
  onAutoDetectDelimiters?: () => void;
  onClear?: () => void;
  onResetSample?: () => void;
  hasInput?: boolean;
  secondaryActions?: React.ReactNode;
  leftPaneTitle?: string;
  leftPaneBadge?: React.ReactNode;
  leftPaneActions?: React.ReactNode;
  leftPaneContent: React.ReactNode;
  rightPaneTitle?: string;
  rightPaneBadge?: React.ReactNode;
  rightPaneActions?: React.ReactNode;
  rightPaneContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  statusBarMetrics?: {
    segmentCount?: number;
    byteSize?: number;
    encodingStandard?: string;
    functionalGroup?: string;
    complianceStatus?: 'valid' | 'warning' | 'error';
    customMessage?: string;
  };
}

export const ToolShell: React.FC<ToolShellProps> = ({
  title,
  description,
  badge,
  selectedSampleId,
  onSelectSample,
  isPhiMasked,
  onTogglePhiMask,
  maskedPhiCount = 0,
  segmentTerminator,
  elementSeparator,
  subElementSeparator,
  onSegmentTerminatorChange,
  onElementSeparatorChange,
  onSubElementSeparatorChange,
  onAutoDetectDelimiters,
  onClear,
  onResetSample,
  hasInput = false,
  secondaryActions,
  leftPaneTitle = 'EDI Input Payload',
  leftPaneBadge,
  leftPaneActions,
  leftPaneContent,
  rightPaneTitle,
  rightPaneBadge,
  rightPaneActions,
  rightPaneContent,
  bottomContent,
  statusBarMetrics,
}) => {
  const formatBytes = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || description) && (
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            {title && (
              <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                {title}
                {badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20">
                    {badge}
                  </span>
                )}
              </h2>
            )}
            {description && (
              <p className="text-sm text-[var(--muted)] mt-0.5">{description}</p>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div
        className="flex items-center gap-2 flex-wrap p-2.5 rounded-2xl border shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        {onSelectSample && selectedSampleId !== undefined && (
          <SampleSelector selectedSampleId={selectedSampleId} onSelectSample={onSelectSample} />
        )}

        {onTogglePhiMask && isPhiMasked !== undefined && (
          <PhiMaskToggle isMasked={isPhiMasked} onToggle={onTogglePhiMask} maskedCount={maskedPhiCount} />
        )}

        {onAutoDetectDelimiters && (
          <button
            type="button"
            onClick={onAutoDetectDelimiters}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 hover:border-[var(--brand)] transition-colors"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            title="Auto-detect segment and element delimiters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Auto Delims</span>
          </button>
        )}

        {secondaryActions}

        <div className="flex-1" />

        {onClear && (
          <button
            type="button"
            onClick={onClear}
            disabled={!hasInput}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 hover:border-rose-400 transition-colors"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}

        {onResetSample && (
          <button
            type="button"
            onClick={onResetSample}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 hover:border-[var(--brand)] transition-colors"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Sample</span>
          </button>
        )}
      </div>

      {/* Dual Pane */}
      <div className={`grid gap-4 ${rightPaneContent ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        <div
          className="rounded-2xl border overflow-hidden flex flex-col shadow-xs min-h-[280px]"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="px-3 py-2 border-b flex items-center justify-between gap-2" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
              <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>{leftPaneTitle}</span>
              {leftPaneBadge}
            </div>
            <div className="flex items-center gap-1.5">{leftPaneActions}</div>
          </div>
          <div className="flex-1">{leftPaneContent}</div>
        </div>

        {rightPaneContent && (
          <div
            className="rounded-2xl border overflow-hidden flex flex-col shadow-xs min-h-[280px]"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="px-3 py-2 border-b flex items-center justify-between gap-2" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
                <span>{rightPaneTitle || 'Output'}</span>
                {rightPaneBadge}
              </div>
              <div className="flex items-center gap-1.5">{rightPaneActions}</div>
            </div>
            <div className="flex-1">{rightPaneContent}</div>
          </div>
        )}
      </div>

      {bottomContent}

      {/* Status Bar */}
      <div
        className="px-4 py-2.5 rounded-xl border flex items-center justify-between text-[11px] font-mono flex-wrap gap-2 text-[var(--muted)] shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {statusBarMetrics?.encodingStandard && (
            <span className="font-bold text-[var(--ink)]">{statusBarMetrics.encodingStandard}</span>
          )}
          {statusBarMetrics?.functionalGroup && <span>Group: {statusBarMetrics.functionalGroup}</span>}
          {statusBarMetrics?.segmentCount !== undefined && (
            <span>Segments: {statusBarMetrics.segmentCount}</span>
          )}
          {statusBarMetrics?.byteSize !== undefined && (
            <span>Size: {formatBytes(statusBarMetrics.byteSize)}</span>
          )}
          {statusBarMetrics?.customMessage && (
            <span className="text-[var(--brand)] font-sans">{statusBarMetrics.customMessage}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {statusBarMetrics?.complianceStatus === 'error' ? (
            <span className="text-rose-600 font-semibold flex items-center gap-1 font-sans">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Syntax Issues
            </span>
          ) : statusBarMetrics?.complianceStatus === 'warning' ? (
            <span className="text-amber-600 font-semibold flex items-center gap-1 font-sans">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Warnings
            </span>
          ) : (
            <span className="text-emerald-600 font-semibold flex items-center gap-1 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Valid Syntax
            </span>
          )}
          <span className="opacity-50">|</span>
          <span className="font-sans text-[10px] text-emerald-600 dark:text-emerald-400">
            100% In-Browser Privacy
          </span>
        </div>
      </div>
    </div>
  );
};
