import React, { useState } from 'react';
import { Copy, Check, Download, ArrowLeftRight, RefreshCw, Sparkles, FileCode2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface XmlEscapeViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const SAMPLE_TEXT = `<item id="A101" status="active">
  <description>Special 100% Cotton & Silk Blend > 50% "Organic" <Quality></description>
  <!-- Needs warehouse verification -->
</item>`;

export const XmlEscapeView: React.FC<XmlEscapeViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [input, setInput] = useState<string>(initialInput || SAMPLE_TEXT);
  const [output, setOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Operations
  const escapeXml = () => {
    const res = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    setOutput(res);
  };

  const unescapeXml = () => {
    const res = input
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    setOutput(res);
  };

  const wrapCdata = () => {
    setOutput(`<![CDATA[${input}]]>`);
  };

  const unwrapCdata = () => {
    const res = input.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    setOutput(res);
  };

  const minifyXml = () => {
    // Remove comments
    let res = input.replace(/<!--[\s\S]*?-->/g, '');
    // Collapse whitespace between tags
    res = res.replace(/>\s+</g, '><').trim();
    setOutput(res);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xml_processed.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Actions Toolbar */}
      <div
        className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[var(--muted)]">Operations:</span>
          <button
            onClick={escapeXml}
            className="px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            Escape Entities (&lt;, &gt;, &amp;)
          </button>
          <button
            onClick={unescapeXml}
            className="px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            Unescape Entities
          </button>
          <button
            onClick={wrapCdata}
            className="px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            Wrap in CDATA
          </button>
          <button
            onClick={unwrapCdata}
            className="px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            Unwrap CDATA
          </button>
          <button
            onClick={minifyXml}
            className="px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            Minify XML
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInput(SAMPLE_TEXT)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleCopy}
            disabled={!output}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: copied ? 'var(--ok)' : 'var(--brand)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Result'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!output}
            className="p-2 rounded-xl border font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              INPUT TEXT / XML
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              PROCESSED OUTPUT
            </span>
          </div>
          <textarea
            readOnly
            value={output}
            rows={14}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/20"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Click one of the operation buttons above to transform text..."
          />
        </div>
      </div>
    </div>
  );
};
