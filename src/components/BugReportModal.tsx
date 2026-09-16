import React, { useState, useEffect, useMemo } from 'react';
import {
  Bug,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  ShieldCheck,
  Monitor,
  Cpu,
  Layers,
} from 'lucide-react';
import { ToolDef } from '../types';
import {
  collectSystemDiagnostics,
  formatDiagnosticsMarkdown,
  sendBugReport,
  buildBugReportMailto,
  SystemDiagnostics,
} from '../lib/diagnostics';
import { copyText } from '../lib/clipboard';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool?: ToolDef | null;
  inputContent?: string;
  outputContent?: string;
  onNavigateContact?: () => void;
}

const SEVERITY_OPTIONS = [
  { id: 'bug', label: 'Bug / Unexpected Error', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  { id: 'parsing', label: 'Parsing / Format Defect', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  { id: 'crash', label: 'Crash / Browser Freeze', badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' },
  { id: 'ui', label: 'UI / Display Layout Glitch', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  { id: 'feature', label: 'Feature Request / Enhancement', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' },
];

export const BugReportModal: React.FC<BugReportModalProps> = ({
  isOpen,
  onClose,
  tool,
  inputContent,
  outputContent,
  onNavigateContact,
}) => {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [severity, setSeverity] = useState('bug');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [includeSnippet, setIncludeSnippet] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedDiag, setCopiedDiag] = useState(false);

  // Collect diagnostics whenever modal opens
  const diagnostics: SystemDiagnostics = useMemo(() => {
    if (!isOpen) {
      return collectSystemDiagnostics({ tool: null });
    }
    return collectSystemDiagnostics({
      tool: tool || null,
      inputContent,
      outputContent,
      includeSnippet,
    });
  }, [isOpen, tool, inputContent, outputContent, includeSnippet]);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setErrorMessage(null);
      setTicketId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSeverityObj =
    SEVERITY_OPTIONS.find((s) => s.id === severity) || SEVERITY_OPTIONS[0];

  const fullReportMarkdown = formatDiagnosticsMarkdown(diagnostics, {
    name: reporterName,
    email: reporterEmail,
    severity: currentSeverityObj.label,
    summary,
    description,
    steps,
  });

  const mailtoUrl = buildBugReportMailto(
    `[Bug Report] ${tool ? `${tool.name}: ` : ''}${summary.trim() || 'Technical Issue'}`,
    fullReportMarkdown
  );

  const handleCopyDiagnostics = async () => {
    const success = await copyText(fullReportMarkdown);
    if (success) {
      setCopiedDiag(true);
      setTimeout(() => setCopiedDiag(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedSummary = summary.trim();
    const trimmedDesc = description.trim();

    if (!trimmedSummary) {
      setErrorMessage('Please provide a short summary of the issue.');
      return;
    }

    if (!trimmedDesc) {
      setErrorMessage('Please describe what happened or what you observed.');
      return;
    }

    setIsSubmitting(true);

    const generatedTicket = `CP-BUG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const subject = `[Bug Report] [${currentSeverityObj.label}] ${tool ? `${tool.name}: ` : ''}${trimmedSummary} (#${generatedTicket})`;

    const result = await sendBugReport({
      name: reporterName.trim() || 'Anonymous Developer',
      email: reporterEmail.trim() || 'no-reply@codepackr.com',
      subject,
      message: fullReportMarkdown,
      category: 'Bug Report',
    });

    setIsSubmitting(false);

    if (result.success) {
      setTicketId(generatedTicket);
      setSubmitted(true);
    } else {
      setErrorMessage(
        result.error ||
          'Failed to transmit bug report to contact server. You can still send it via your email client using the button below.'
      );
    }
  };

  const handleReset = () => {
    setSummary('');
    setDescription('');
    setSteps('');
    setSeverity('bug');
    setSubmitted(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-report-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-scale-up"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
          color: 'var(--ink)',
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 id="bug-report-title" className="text-lg font-bold flex items-center gap-2">
                <span>Report an Issue</span>
                {tool && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[color:var(--brand-light)] text-[color:var(--brand)]">
                    {tool.name}
                  </span>
                )}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Automatically collects technical diagnostics to help our engineers fix it fast.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
            style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}
            aria-label="Close Bug Reporter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold">Bug Report Dispatched</h3>
                <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
                  Thank you! Your bug report and automated system diagnostics have been sent to our core engineering team.
                </p>
              </div>

              {ticketId && (
                <div
                  className="inline-block p-3 rounded-xl border font-mono text-xs font-semibold"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  Reference ID: <span className="text-[var(--brand)]">{ticketId}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCopyDiagnostics}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  {copiedDiag ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDiag ? 'Diagnostics Copied!' : 'Copy Diagnostics Markdown'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Severity / Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                  Issue Type &amp; Severity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSeverity(opt.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                        severity === opt.id
                          ? 'border-[color:var(--brand)] bg-[color:var(--brand-light)] font-semibold shadow-xs'
                          : 'hover:border-[color:var(--border-hover)]'
                      }`}
                      style={{
                        backgroundColor: severity === opt.id ? undefined : 'var(--surface-2)',
                        borderColor: severity === opt.id ? undefined : 'var(--line)',
                      }}
                    >
                      <span>{opt.label}</span>
                      {severity === opt.id && <Check className="w-3.5 h-3.5 text-[color:var(--brand)]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                  Issue Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={tool ? `e.g. ${tool.name} throws syntax error on valid input` : 'Briefly summarize what went wrong...'}
                  className="w-full p-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-[color:var(--brand)]"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                  Description / What Happened <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional details or error messages shown in the output..."
                  className="w-full p-2.5 rounded-xl border text-xs sm:text-sm outline-none leading-relaxed transition-colors focus:border-[color:var(--brand)]"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                />
              </div>

              {/* Steps to Reproduce */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                  Steps to Reproduce (Optional)
                </label>
                <textarea
                  rows={2}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="1. Pasted sample input&#10;2. Clicked format&#10;3. Page showed unexpected error..."
                  className="w-full p-2.5 rounded-xl border text-xs outline-none leading-relaxed transition-colors focus:border-[color:var(--brand)] font-mono"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Developer"
                    className="w-full p-2 rounded-xl border text-xs outline-none"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                    Your Email (For Follow-up)
                  </label>
                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full p-2 rounded-xl border text-xs outline-none"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                  />
                </div>
              </div>

              {/* Diagnostics Summary Card */}
              <div
                className="p-3.5 rounded-xl border space-y-2.5"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Automatically Collected Diagnostics</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDiagnostics((p) => !p)}
                    className="text-xs font-semibold text-[color:var(--brand)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showDiagnostics ? 'Hide Details' : 'Inspect Diagnostics'}</span>
                    {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Scannable Quick Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
                    <span className="block text-[10px] text-gray-400 uppercase font-sans">Browser</span>
                    <span className="truncate block font-semibold">{diagnostics.client.browser}</span>
                  </div>
                  <div className="p-2 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
                    <span className="block text-[10px] text-gray-400 uppercase font-sans">OS</span>
                    <span className="truncate block font-semibold">{diagnostics.client.os}</span>
                  </div>
                  <div className="p-2 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
                    <span className="block text-[10px] text-gray-400 uppercase font-sans">Viewport</span>
                    <span className="truncate block font-semibold">{diagnostics.client.viewport}</span>
                  </div>
                  <div className="p-2 rounded-lg border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
                    <span className="block text-[10px] text-gray-400 uppercase font-sans">Tool</span>
                    <span className="truncate block font-semibold">{tool?.id || 'global'}</span>
                  </div>
                </div>

                {inputContent !== undefined && (
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={includeSnippet}
                      onChange={(e) => setIncludeSnippet(e.target.checked)}
                      className="rounded text-[var(--brand)]"
                    />
                    <span>Include safe input metrics (character count &amp; sanitized preview)</span>
                  </label>
                )}

                {showDiagnostics && (
                  <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase">
                        Diagnostics Payload Preview
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyDiagnostics}
                        className="text-[11px] font-semibold text-[color:var(--brand)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDiag ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDiag ? 'Copied' : 'Copy Payload'}</span>
                      </button>
                    </div>
                    <pre
                      className="p-3 rounded-lg border text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                    >
                      {fullReportMarkdown}
                    </pre>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={mailtoUrl}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold hover:opacity-80 transition-opacity text-center cursor-pointer"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                    title="Open your desktop or mobile email client directly"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send via Email App</span>
                  </a>

                  {onNavigateContact && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateContact();
                      }}
                      className="hidden sm:inline-flex text-xs font-semibold text-gray-500 hover:text-[color:var(--brand)] transition-colors px-2 py-1"
                    >
                      Full Contact Form &rarr;
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border text-xs font-semibold hover:opacity-80 cursor-pointer"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand)' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transmitting Report...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Bug Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
