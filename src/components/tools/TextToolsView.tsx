import React, { useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, FileText, ArrowUpDown, Trash2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { copyText } from '../../lib/clipboard';

interface TextToolsViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const TextToolsView: React.FC<TextToolsViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [text, setText] = useState(
    initialInput ||
      'Paste or type your text here.\n\nCodepackr text tools run 100% client-side — nothing leaves your browser.'
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialInput) setText(initialInput);
  }, [initialInput, tool.id]);

  const handleCopy = async () => {
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => setText('');
  const handleUpper = () => setText((t) => t.toUpperCase());
  const handleLower = () => setText((t) => t.toLowerCase());
  const handleTitle = () =>
    setText((t) =>
      t.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    );
  const handleReverse = () => setText((t) => t.split('').reverse().join(''));
  const handleTrimLines = () =>
    setText((t) =>
      t
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .join('\n')
    );
  const handleSortLines = () =>
    setText((t) =>
      t
        .split('\n')
        .slice()
        .sort((a, b) => a.localeCompare(b))
        .join('\n')
    );

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;

  return (
    <div>
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleClear}
        resetLabel="Clear Text"
      />

      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleUpper} className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>UPPERCASE</button>
          <button type="button" onClick={handleLower} className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>lowercase</button>
          <button type="button" onClick={handleTitle} className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>Title Case</button>
          <button type="button" onClick={handleReverse} className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>Reverse</button>
          <button type="button" onClick={handleTrimLines} className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>Trim Lines</button>
          <button type="button" onClick={handleSortLines} className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>Sort Lines</button>
          <button type="button" onClick={handleCopy} className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: copied ? 'var(--brand)' : 'var(--surface)', borderColor: copied ? 'var(--brand)' : 'var(--line)', color: copied ? '#fff' : undefined }}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full min-h-[320px] p-4 rounded-2xl border font-mono text-sm outline-none"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          spellCheck={false}
        />

        <div className="flex gap-4 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{words} words</span>
          <span>{chars} chars</span>
          <span>{lines} lines</span>
        </div>
      </div>
    </div>
  );
};
