import React, { useState, useRef } from 'react';
import {
  Share2,
  Check,
  ArrowLeft,
  Star,
  RotateCcw,
  Upload,
  Download,
  Bug,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { ToolDef } from '../types';
import { TOOLS } from '../data/tools';
import { useBookmarks, shareToolUrl } from '../lib/bookmarks';
import { getIcon } from '../lib/icons';
import {
  readUploadedFile,
  downloadContentAsFile,
  inferToolFilename,
  formatFileSize,
} from '../lib/fileIO';
import { BugReportModal } from './BugReportModal';

export interface ToolHeaderProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onBack?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  onResetOrClear?: () => void;
  resetLabel?: string;
  onUploadFile?: (content: string, filename: string) => void;
  onDownloadFile?: () => void;
  downloadContent?: string | (() => string);
  downloadFilename?: string;
  inputContent?: string;
  outputContent?: string;
  onReportBug?: () => void;
  hideFileActions?: boolean;
  hideReportIssue?: boolean;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  tool,
  onBackToHome,
  onBack,
  onSelectRelated,
  onResetOrClear,
  resetLabel,
  onUploadFile,
  onDownloadFile,
  downloadContent,
  downloadFilename,
  inputContent,
  outputContent,
  onReportBug,
  hideFileActions = false,
  hideReportIssue = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(tool.id);

  const isCalcOrPlanner = tool.category === 'validators';
  const defaultActionLabel = isCalcOrPlanner ? 'Reset to Defaults' : 'Clear Workspace';
  const effectiveResetLabel = resetLabel || defaultActionLabel;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onBackToHome) {
      onBackToHome();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const handleShare = async () => {
    const success = await shareToolUrl(tool.id, tool.name, tool.description);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Trigger file selection
  const handleUploadClick = () => {
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Process uploaded file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { content, name, size } = await readUploadedFile(file);

      if (onUploadFile) {
        onUploadFile(content, name);
      } else {
        // Fallback: Dispatch custom event & attempt to populate primary textarea
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('codepackr:file-upload', {
              detail: { content, name, toolId: tool.id },
            })
          );

          const mainTextarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
          if (mainTextarea) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              'value'
            )?.set;
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(mainTextarea, content);
            } else {
              mainTextarea.value = content;
            }
            mainTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            mainTextarea.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }

      setUploadNotice(`Loaded "${name}" (${formatFileSize(size)})`);
      setUploadError(null);
      setTimeout(() => setUploadNotice(null), 4000);
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err?.message || 'Failed to read the selected file.');
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  // Trigger file download
  const handleDownloadClick = () => {
    if (onDownloadFile) {
      onDownloadFile();
      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 2000);
      return;
    }

    let targetContent = '';
    if (typeof downloadContent === 'function') {
      targetContent = downloadContent();
    } else if (typeof downloadContent === 'string') {
      targetContent = downloadContent;
    } else if (outputContent) {
      targetContent = outputContent;
    } else if (inputContent) {
      targetContent = inputContent;
    } else {
      // Fallback: Try reading output or input textarea / pre element from page
      const textareas = document.querySelectorAll('textarea');
      if (textareas.length > 1 && textareas[1].value) {
        targetContent = textareas[1].value;
      } else if (textareas.length > 0 && textareas[0].value) {
        targetContent = textareas[0].value;
      }
    }

    if (!targetContent) {
      // If nothing to download yet, inform the user
      setUploadError('No output or content available to download yet. Enter or generate some data first.');
      setTimeout(() => setUploadError(null), 3500);
      return;
    }

    const { filename: defaultFilename, mimeType } = inferToolFilename(tool, true);
    const finalFilename = downloadFilename || defaultFilename;

    const ok = downloadContentAsFile(targetContent, finalFilename, mimeType);
    if (ok) {
      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 2000);
    }
  };

  const handleOpenBugModal = () => {
    setIsBugModalOpen(true);
    if (onReportBug) {
      onReportBug();
    }
  };

  const relatedTools = TOOLS.filter((t) => t.category === tool.category && t.id !== tool.id).slice(0, 4);

  return (
    <div className="mb-8 animate-fade-in">
      {/* Hidden File Input for universal upload */}
      <input
        ref={fileInputRef}
        type="file"
        id={`upload-file-input-${tool.id}`}
        onChange={handleFileChange}
        className="hidden"
        style={{ display: 'none' }}
        accept=".txt,.json,.xml,.edi,.x12,.sql,.yaml,.yml,.csv,.tsv,.md,.markdown,.env,.js,.ts,.html,.css,*/*"
        aria-label="Upload data file"
      />

      {/* Main Tool Header Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        {/* Left: Back Button + Tool Title & Description */}
        <div className="flex items-start gap-4">
          <button
            onClick={handleBack}
            className="p-2.5 mt-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:border-[color:var(--brand)] transition-colors shadow-sm cursor-pointer"
            title="Go back to previous page"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)] shadow-xs shrink-0 mt-0.5">
              {getIcon(tool.icon, 28)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[color:var(--ink)]">
                  {tool.name}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[color:var(--brand-light)] text-[color:var(--brand)]">
                  {tool.category}
                </span>
              </div>
              <p className="text-sm sm:text-base text-[color:var(--ink-muted)] max-w-2xl leading-relaxed">
                {tool.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Modern Structured Command Bar */}
        <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-auto mt-2 lg:mt-0 flex-wrap">
          {/* File Operations Segment (Import & Export) */}
          {!hideFileActions && (
            <div
              className="inline-flex items-center p-0.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-xs"
              role="group"
              aria-label="File data actions"
            >
              {/* Import Button */}
              <button
                id={`btn-upload-${tool.id}`}
                type="button"
                onClick={handleUploadClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[color:var(--ink)] hover:text-[color:var(--brand)] hover:bg-[color:var(--surface-elevated)] transition-all cursor-pointer"
                title="Import or upload local file (.json, .xml, .edi, .sql, .yaml, .txt, etc.)"
              >
                <Upload className="w-3.5 h-3.5 text-[color:var(--brand)]" />
                <span>Import</span>
              </button>

              <div className="w-px h-4 bg-[color:var(--border)] mx-0.5" />

              {/* Export Button */}
              <button
                id={`btn-download-${tool.id}`}
                type="button"
                onClick={handleDownloadClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isDownloaded
                    ? 'bg-[color:var(--brand)] text-white shadow-xs'
                    : 'text-[color:var(--ink)] hover:text-[color:var(--brand)] hover:bg-[color:var(--surface-elevated)]'
                }`}
                title="Export or download workspace output as file"
              >
                {isDownloaded ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Exported!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-[color:var(--brand)]" />
                    <span>Export</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Reset / Clear Button */}
          {onResetOrClear && (
            <button
              onClick={onResetOrClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] text-xs font-semibold text-[color:var(--ink-muted)] hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all cursor-pointer shadow-xs"
              title={effectiveResetLabel}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{effectiveResetLabel === 'Clear Workspace' ? 'Clear' : effectiveResetLabel}</span>
            </button>
          )}

          {/* Divider */}
          {!hideFileActions && <div className="hidden sm:block w-px h-5 bg-[color:var(--border)] mx-0.5" />}

          {/* Meta & Utility Actions */}
          <div className="inline-flex items-center gap-1.5">
            {/* Bookmark / Favorite Button */}
            <button
              onClick={() => toggleBookmark(tool.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all shadow-xs cursor-pointer ${
                bookmarked
                  ? 'bg-[color:var(--warning)]/10 border-[color:var(--warning)]/30 text-[color:var(--warning)]'
                  : 'bg-[color:var(--surface)] border-[color:var(--border)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:border-[color:var(--brand)]'
              }`}
              title={bookmarked ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Star className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current text-amber-500' : ''}`} />
              <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] hover:border-[color:var(--brand)] transition-all shadow-xs cursor-pointer"
              title="Copy link to this tool"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            {/* Report Issue / Bug Button */}
            {!hideReportIssue && (
              <button
                id={`btn-report-bug-${tool.id}`}
                type="button"
                onClick={handleOpenBugModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--ink-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all shadow-xs cursor-pointer"
                title="Report an issue or bug with automated technical diagnostics"
              >
                <Bug className="w-3.5 h-3.5 text-rose-500/80" />
                <span className="hidden md:inline">Report Issue</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Status / Upload Notice Banner */}
      {uploadNotice && (
        <div className="mb-4 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{uploadNotice}</span>
          </div>
          <button
            onClick={() => setUploadNotice(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {uploadError && (
        <div className="mb-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Related Tools Sub-bar */}
      {relatedTools.length > 0 && onSelectRelated && (
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2 pt-2 border-t border-[color:var(--border)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-muted)] whitespace-nowrap">
            Related:
          </span>
          {relatedTools.map((rt) => (
            <button
              key={rt.id}
              onClick={() => onSelectRelated(rt)}
              className="px-3 py-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-xs font-semibold text-[color:var(--ink-muted)] whitespace-nowrap hover:text-[color:var(--brand)] hover:border-[color:var(--brand)] transition-colors shadow-sm cursor-pointer"
            >
              {rt.name}
            </button>
          ))}
        </div>
      )}

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
        tool={tool}
        inputContent={inputContent}
        outputContent={outputContent}
        onNavigateContact={() => {
          if (onBackToHome) onBackToHome();
        }}
      />
    </div>
  );
};
