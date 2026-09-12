import React, { useState, useEffect, useMemo } from 'react';
import { Download, Check, RefreshCw, AlertCircle, FileText, Sparkles } from 'lucide-react';
import {
  suggestFilename,
  sanitizeFilename,
  downloadFile,
  SuggestFilenameOptions,
} from '../../lib/smartDownload';

export interface SmartDownloadProps {
  /** The file data: Blob, File, or raw string content */
  file?: Blob | File | string | null;
  /** Explicit default filename. If omitted, derived automatically */
  defaultFilename?: string;
  /** Explicit suggestions list. If omitted, derived from options */
  suggestions?: string[];
  /** Expected MIME type (e.g. 'image/jpeg', 'application/json') */
  mimeType?: string;
  /** Target file extension (e.g. 'jpg', 'webp', 'json', 'edi') */
  extension?: string;
  /** Original uploaded file name for derivation */
  originalName?: string;
  /** Operation description (e.g. 'resize-compress', 'format', 'edi') */
  operation?: string;
  /** Additional metadata (width, height, maxBytes, transactionType, etc.) */
  metadata?: Record<string, any>;
  /** Context category: 'image' | 'edi' | 'formatter' | 'generic' */
  toolContext?: string;
  /** Label for the download button (default: "Download") */
  label?: string;
  /** Compact inline mode for toolbars */
  compact?: boolean;
  /** Additional container CSS class */
  className?: string;
  /** Callback fired upon download with final sanitized filename */
  onDownload?: (finalFilename: string) => void;
  /** Whether the download button should be disabled */
  disabled?: boolean;
}

export const SmartDownload: React.FC<SmartDownloadProps> = ({
  file,
  defaultFilename: explicitDefault,
  suggestions: explicitSuggestions,
  mimeType,
  extension,
  originalName,
  operation,
  metadata,
  toolContext,
  label = 'Download',
  compact = false,
  className = '',
  onDownload,
  disabled = false,
}) => {
  // Generate intelligent defaults & suggestions from context
  const derived = useMemo(() => {
    const opts: SuggestFilenameOptions = {
      originalName,
      operation,
      outputFormat: extension,
      metadata,
      toolContext,
    };
    return suggestFilename(opts);
  }, [originalName, operation, extension, metadata, toolContext]);

  const targetExtension = extension || derived.extension;
  const initialDefaultName = explicitDefault || derived.defaultName;
  const activeSuggestions = explicitSuggestions && explicitSuggestions.length > 0
    ? explicitSuggestions
    : derived.suggestions;

  const [filename, setFilename] = useState<string>(initialDefaultName);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Sync filename when initialDefaultName changes
  useEffect(() => {
    if (initialDefaultName) {
      setFilename(initialDefaultName);
    }
  }, [initialDefaultName]);

  // Validation & Sanitization preview
  const sanitized = useMemo(() => {
    return sanitizeFilename(filename, targetExtension, targetExtension);
  }, [filename, targetExtension]);

  // Calculate file size string if available
  const fileSizeString = useMemo(() => {
    if (!file) return null;
    let bytes = 0;
    if (file instanceof Blob) {
      bytes = file.size;
    } else if (typeof file === 'string') {
      bytes = new Blob([file]).size;
    }
    if (bytes === 0) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [file]);

  const handleDownload = () => {
    if (!file || disabled) return;

    const finalName = sanitized.sanitizedName;
    const downloadedName = downloadFile({
      file,
      filename: finalName,
      mimeType: mimeType || derived.mimeType,
      expectedExtension: targetExtension,
    });

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);

    if (onDownload) {
      onDownload(downloadedName);
    }
  };

  const handleReset = () => {
    setFilename(initialDefaultName);
  };

  const handleSelectSuggestion = (sug: string) => {
    setFilename(sug);
  };

  // Compact inline toolbar mode
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex-1 min-w-[140px] max-w-[240px]">
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
            placeholder={initialDefaultName}
            className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono outline-none transition-all"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--line)',
              color: 'var(--ink)',
            }}
            title="Filename (optional - press enter to download)"
          />
        </div>
        <button
          onClick={handleDownload}
          disabled={!file || disabled}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          style={{ backgroundColor: 'var(--brand)' }}
          title="Download file with selected filename"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>{label}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Standard full-fidelity card mode
  return (
    <div
      className={`p-4 rounded-2xl border space-y-3 transition-all ${className}`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--line)',
      }}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--brand)' }}
          >
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold block" style={{ color: 'var(--ink)' }}>
              Ready to Download
            </span>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              Rename before download — <span className="font-semibold">optional</span>
            </span>
          </div>
        </div>

        {fileSizeString && (
          <div
            className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--line)',
              color: 'var(--ink)',
            }}
          >
            {targetExtension.toUpperCase()} • {fileSizeString}
          </div>
        )}
      </div>

      {/* Filename input & reset button */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <label className="font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Filename (Optional)
          </label>
          {filename !== initialDefaultName && (
            <button
              onClick={handleReset}
              className="text-[11px] font-medium flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
              style={{ color: 'var(--brand)' }}
              title="Reset to tool-generated default filename"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset to default</span>
            </button>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
            placeholder={initialDefaultName}
            className="w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition-all focus:ring-2 focus:ring-[var(--brand)]"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--line)',
              color: 'var(--ink)',
            }}
            aria-label="Filename (optional)"
          />
        </div>

        {/* Extension Conflict / Sanitization Notice */}
        {sanitized.warning && (
          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{sanitized.warning}</span>
          </div>
        )}
      </div>

      {/* Smart Suggestions Chips */}
      {activeSuggestions.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted)' }}>
            <Sparkles className="w-3 h-3 text-[var(--brand)]" />
            <span className="font-medium">Suggested names:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeSuggestions.map((sug) => {
              const isSelected = sug.toLowerCase() === filename.trim().toLowerCase();
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSelectSuggestion(sug)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'ring-2 ring-[var(--brand)] font-bold'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--surface-2)' : 'var(--bg)',
                    borderColor: isSelected ? 'var(--brand)' : 'var(--line)',
                    color: isSelected ? 'var(--brand)' : 'var(--ink)',
                  }}
                  title={`Use "${sug}"`}
                >
                  <span>{sug}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Immediate Download Button */}
      <button
        onClick={handleDownload}
        disabled={!file || disabled}
        className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'var(--brand)' }}
      >
        {downloadSuccess ? (
          <>
            <Check className="w-4 h-4" />
            <span>Downloaded as {sanitized.sanitizedName}</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>{label}</span>
          </>
        )}
      </button>

      <p className="text-[10px] text-center" style={{ color: 'var(--muted)' }}>
        🔒 100% processed locally in your browser. No files are uploaded to any server.
      </p>
    </div>
  );
};
