import React, { useState } from 'react';
import { As2Package } from '../../edi-core/models/envelope';
import { ShieldCheck, Download, Copy, Check, Mail, Lock } from 'lucide-react';

interface As2ViewerProps {
  as2Package: As2Package;
}

export const As2Viewer: React.FC<As2ViewerProps> = ({ as2Package }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEml = () => {
    navigator.clipboard.writeText(as2Package.rawEml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadEml = () => {
    const blob = new Blob([as2Package.rawEml], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AS2_${as2Package.as2To}_${Date.now()}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 bg-[var(--bg)] border-b border-[var(--line)] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-indigo-500/10 text-indigo-500">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
              AS2 S/MIME Package Dispatch
            </span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono">
              RFC 4130 Profile
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyEml}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />}
            <span>{copied ? 'Copied' : 'Copy MIME'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadEml}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 transition-colors font-medium shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .eml</span>
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[var(--line)] bg-[var(--surface)] text-xs">
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Routing Identifiers</div>
          <div className="flex items-center justify-between p-2 rounded bg-[var(--bg)] font-mono">
            <span className="text-[var(--muted)]">AS2-From:</span>
            <span className="font-semibold text-[var(--ink)]">{as2Package.as2From}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-[var(--bg)] font-mono">
            <span className="text-[var(--muted)]">AS2-To:</span>
            <span className="font-semibold text-[var(--ink)]">{as2Package.as2To}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Security & Receipts</div>
          <div className="flex items-center justify-between p-2 rounded bg-[var(--bg)] font-mono">
            <span className="text-[var(--muted)]">MDN Receipt:</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Synchronous Signed (SHA-256)
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-[var(--bg)] font-mono">
            <span className="text-[var(--muted)]">Signature:</span>
            <span className="text-[var(--brand)] font-semibold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> PKCS#7 / S/MIME
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-[var(--bg)]/40 font-mono text-xs max-h-60 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold text-[var(--muted)] mb-2">Raw MIME Headers & Payload Preview</div>
        <pre className="text-[var(--ink)] whitespace-pre-wrap break-all leading-relaxed font-mono">
          {as2Package.rawEml}
        </pre>
      </div>
    </div>
  );
};
