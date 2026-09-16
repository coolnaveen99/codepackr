import React, { useRef, useState } from 'react';
import { Upload, Download, Trash2, Copy, Check, Sparkles } from 'lucide-react';
import { readUploadedFile, downloadContentAsFile } from '../../lib/fileIO';

export interface EditorPaneHeaderProps {
  /** Label for the pane, e.g. "ORIGINAL (LEFT)", "MODIFIED (RIGHT)", "INPUT", "OUTPUT" */
  title: string;
  /** Optional language badge or mode indicator (e.g. "JSON", "SQL") */
  badge?: string;
  /** Line count to display alongside title */
  lineCount?: number;
  /** Character count to display alongside title */
  charCount?: number;
  /** File accept pattern for import (defaults to standard developer file types) */
  accept?: string;
  /** Callback triggered when user uploads/imports a file into this pane */
  onImport?: (content: string, filename: string) => void;
  /** Optional callback to clear the pane */
  onClear?: () => void;
  /** Custom export handler, or specify exportContent + exportFilename */
  onExport?: () => void;
  exportContent?: string;
  exportFilename?: string;
  /** Custom copy handler, or specify copyContent */
  onCopy?: () => void;
  copyContent?: string;
  /** Optional sample loader */
  onSample?: () => void;
  /** Additional custom actions/buttons */
  extraActions?: React.ReactNode;
  /** Optional right-side slot for custom indicators or controls (alias for extraActions) */
  rightSlot?: React.ReactNode;
  /** Optional HTML id prefix for buttons */
  idPrefix?: string;
  className?: string;
}

export const EditorPaneHeader: React.FC<EditorPaneHeaderProps> = ({
  title,
  badge,
  lineCount,
  charCount,
  accept = '.txt,.json,.xml,.sql,.yaml,.yml,.css,.html,.js,.ts,.diff,.patch,.md,.env',
  onImport,
  onClear,
  onExport,
  exportContent,
  exportFilename = 'export.txt',
  onCopy,
  copyContent,
  onSample,
  extraActions,
  rightSlot,
  idPrefix = 'editor-pane',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;

    try {
      setIsImporting(true);
      const { content, name } = await readUploadedFile(file);
      onImport(content, name);
    } catch (err) {
      console.error('Failed to read uploaded file:', err);
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleExportClick = () => {
    if (onExport) {
      onExport();
    } else if (exportContent) {
      downloadContentAsFile(exportContent, exportFilename);
    }
  };

  const handleCopyClick = async () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (copyContent) {
      try {
        await navigator.clipboard.writeText(copyContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const hasExport = Boolean(onExport || exportContent);
  const hasCopy = Boolean(onCopy || copyContent);

  return (
    <div
      className={`flex items-center justify-between mb-2.5 flex-wrap gap-2 ${className}`}
    >
      {/* Title & Metadata Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="block text-xs font-bold tracking-wider text-[color:var(--ink-muted)] uppercase">
          {title}
        </span>
        {badge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[color:var(--surface-muted)] text-[color:var(--ink-muted)] uppercase">
            {badge}
          </span>
        )}
        {typeof lineCount === 'number' && (
          <span className="text-[11px] font-mono text-[color:var(--ink-muted)]">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            {typeof charCount === 'number' ? ` · ${charCount.toLocaleString()} chars` : ''}
          </span>
        )}
        {typeof charCount === 'number' && typeof lineCount !== 'number' && (
          <span className="text-[11px] font-mono text-[color:var(--ink-muted)]">
            {charCount.toLocaleString()} chars
          </span>
        )}
      </div>

      {/* Action Controls */}
      {(onSample || onImport || hasExport || hasCopy || onClear || extraActions || rightSlot) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Sample Button */}
          {onSample && (
            <button
              id={`${idPrefix}-btn-sample`}
              type="button"
              onClick={onSample}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink)] hover:text-amber-500 hover:border-amber-500/40 transition-colors cursor-pointer"
              title="Load sample test data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sample</span>
            </button>
          )}

          {/* Hidden File Input for Import */}
          {onImport && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                className="hidden"
                accept={accept}
              />
              <button
                id={`${idPrefix}-btn-import`}
                type="button"
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink)] hover:text-[color:var(--brand)] hover:border-[color:var(--brand)] transition-colors cursor-pointer disabled:opacity-50"
                title="Import file directly into this workspace"
              >
                <Upload className="w-3.5 h-3.5 text-[color:var(--brand)]" />
                <span>Import</span>
              </button>
            </>
          )}

          {/* Export / Download Button */}
          {hasExport && (
            <button
              id={`${idPrefix}-btn-export`}
              type="button"
              onClick={handleExportClick}
              disabled={!onExport && !exportContent}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink)] hover:text-[color:var(--brand)] hover:border-[color:var(--brand)] transition-colors cursor-pointer disabled:opacity-40"
              title="Export content as file"
            >
              <Download className="w-3.5 h-3.5 text-[color:var(--brand)]" />
              <span>Export</span>
            </button>
          )}

          {/* Copy Button */}
          {hasCopy && (
            <button
              id={`${idPrefix}-btn-copy`}
              type="button"
              onClick={handleCopyClick}
              disabled={!onCopy && !copyContent}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
                copied
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink)] hover:text-[color:var(--brand)] hover:border-[color:var(--brand)]'
              }`}
              title="Copy content to clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          {/* Clear Button */}
          {onClear && (
            <button
              id={`${idPrefix}-btn-clear`}
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink-muted)] hover:text-rose-500 hover:border-rose-500/40 transition-colors cursor-pointer"
              title="Clear pane content"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          {/* Extra contextual actions */}
          {extraActions}
          {rightSlot}
        </div>
      )}
    </div>
  );
};
