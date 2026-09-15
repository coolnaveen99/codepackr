import React, { useState } from 'react';
import { MockFile } from '../../edi-core/models/envelope';
import { FileText, Download, Copy, Check, ExternalLink, Code } from 'lucide-react';

interface VirtualFilesListProps {
  files: MockFile[];
}

export const VirtualFilesList: React.FC<VirtualFilesListProps> = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState<MockFile | null>(files[0] || null);
  const [copied, setCopied] = useState(false);

  // Sync selected file if list changes
  React.useEffect(() => {
    if (files.length > 0 && (!selectedFile || !files.some((f) => f.name === selectedFile.name))) {
      setSelectedFile(files[0]);
    }
  }, [files, selectedFile]);

  const handleDownload = (file: MockFile) => {
    const blob = new Blob([file.content], { type: file.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (files.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6 text-center text-xs text-[var(--muted)]">
        No virtual files generated yet. Run the pipeline to stage or produce download artifacts.
      </div>
    );
  }

  const active = selectedFile || files[0];

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
      {/* File list sidebar */}
      <div className="w-full md:w-64 p-3 bg-[var(--bg)]/50 shrink-0 space-y-1">
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Virtual Files ({files.length})
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono">
            Simulated
          </span>
        </div>

        {files.map((f) => {
          const isSelected = active?.name === f.name;
          return (
            <button
              key={f.name}
              type="button"
              onClick={() => setSelectedFile(f)}
              className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 ${
                isSelected
                  ? 'bg-[var(--brand)] text-white shadow-sm'
                  : 'hover:bg-[var(--surface)] text-[var(--ink)]'
              }`}
            >
              <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-white' : 'text-[var(--brand)]'}`} />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-xs truncate font-medium">{f.name}</div>
                <div className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-[var(--muted)]'}`}>
                  {f.format.toUpperCase()} · {(f.content.length / 1024).toFixed(1)} KB
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* File Preview and Actions */}
      <div className="flex-1 flex flex-col min-w-0">
        {active && (
          <>
            <div className="p-3 bg-[var(--bg)] border-b border-[var(--line)] flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="font-mono text-xs font-semibold text-[var(--ink)] truncate">{active.name}</div>
                <div className="text-[10px] text-[var(--muted)] font-mono truncate">{active.path}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(active.content)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(active)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 transition-colors font-medium shadow-sm"
                  title="Download file to disk"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="p-3 flex-1 overflow-auto max-h-80 bg-[var(--surface)] font-mono text-xs">
              <pre className="text-[var(--ink)] whitespace-pre-wrap break-all leading-relaxed font-mono">
                {active.content}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
