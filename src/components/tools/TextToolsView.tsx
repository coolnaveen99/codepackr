import React, { useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, FileText, ArrowUpDown, Trash2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { copyText } from '../../lib/clipboard';
import { downloadContentAsFile } from '../../lib/fileIO';
import { EditorPaneHeader } from '../common/EditorPaneHeader';

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
        onUploadFile={(content) => setText(content)}
        downloadContent={text}
        inputContent={text}
        hideFileActions={true}
      />

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleUpper} className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>UPPERCASE</button>
            <button type="button" onClick={handleLower} className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>lowercase</button>
            <button type="button" onClick={handleTitle} className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>Title Case</button>
            <button type="button" onClick={handleReverse} className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>Reverse</button>
            <button type="button" onClick={handleTrimLines} className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>Trim Lines</button>
            <button type="button" onClick={handleSortLines} className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>Sort Lines</button>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono" style={{ color: 'var(--muted)' }}>
            <span>{words} words</span>
            <span>{chars} chars</span>
            <span>{lines} lines</span>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
            <EditorPaneHeader
              idPrefix="text-editor"
              title="TEXT EDITOR"
              charCount={chars}
              lineCount={lines}
              accept=".txt,.md,.text"
              onImport={(content) => setText(content)}
              onExport={text ? () => downloadContentAsFile(text, 'text-content.txt') : undefined}
              onSample={() => setText('Sample text for formatting, transformations, and sorting.\nLine 2: Codepackr text utilities.\nLine 3: Fast, offline-first developer suite.')}
              onClear={text ? handleClear : undefined}
              onCopy={text ? handleCopy : undefined}
              copyContent={text}
            />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[360px] p-4 bg-transparent border-none font-mono text-sm outline-none resize-y leading-relaxed"
            style={{ color: 'var(--ink)' }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
