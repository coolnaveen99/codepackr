import React, { useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, FileText, ArrowUpDown, Trash2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

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
      'Codepackr provides free browser-based developer utilities.\nAll tools run completely locally in your browser.\nInput is not uploaded anywhere.\n\nCodepackr provides free browser-based developer utilities.\nEnjoy lightning-fast productivity!'
  );
  const [copied, setCopied] = useState(false);

  // Find and replace
  const [findStr, setFindStr] = useState('');
  const [replaceStr, setReplaceStr] = useState('');

  // Metrics
  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split('\n').length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter(Boolean).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(Boolean).length : 0;

  // Actions
  const handleRemoveDuplicateLines = () => {
    const unique = Array.from(new Set(text.split('\n'))).join('\n');
    setText(unique);
  };

  const handleRemoveEmptyLines = () => {
    const cleaned = text
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .join('\n');
    setText(cleaned);
  };

  const handleRemoveExtraSpaces = () => {
    const cleaned = text
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .join('\n');
    setText(cleaned);
  };

  const handleSortLines = (asc = true) => {
    const sorted = text
      .split('\n')
      .sort((a, b) => (asc ? a.localeCompare(b) : b.localeCompare(a)))
      .join('\n');
    setText(sorted);
  };

  const handleReverseLines = () => {
    const rev = text.split('\n').reverse().join('\n');
    setText(rev);
  };

  const handleCaseChange = (type: 'upper' | 'lower' | 'title') => {
    if (type === 'upper') setText(text.toUpperCase());
    else if (type === 'lower') setText(text.toLowerCase());
    else if (type === 'title') {
      setText(
        text
          .toLowerCase()
          .replace(/(?:^|\s|\n)\w/g, (match) => match.toUpperCase())
      );
    }
  };

  const handleFindReplace = () => {
    if (!findStr) return;
    setText(text.split(findStr).join(replaceStr));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {[
          { label: 'Words', val: words },
          { label: 'Characters', val: charCount },
          { label: 'No Spaces', val: charNoSpaces },
          { label: 'Lines', val: lines },
          { label: 'Sentences', val: sentences },
          { label: 'Paragraphs', val: paragraphs },
        ].map(({ label, val }) => (
          <div
            key={label}
            className="p-3 rounded-xl border text-center shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <span className="text-[11px] font-semibold text-gray-500 uppercase block">{label}</span>
            <span className="text-xl font-bold font-mono text-[var(--brand)]">{val}</span>
          </div>
        ))}
      </div>

      {/* Action Toolbar */}
      <div className="p-3 rounded-xl border mb-4 space-y-3 shadow-sm"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 mr-1">Quick Clean:</span>
          <button
            onClick={handleRemoveDuplicateLines}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            Deduplicate Lines
          </button>
          <button
            onClick={handleRemoveEmptyLines}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            Remove Empty Lines
          </button>
          <button
            onClick={handleRemoveExtraSpaces}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            Collapse Spaces
          </button>
          <button
            onClick={() => handleSortLines(true)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            Sort A-Z
          </button>
          <button
            onClick={() => handleSortLines(false)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            Sort Z-A
          </button>
          <button
            onClick={handleReverseLines}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            Reverse Lines
          </button>
          <button
            onClick={() => handleCaseChange('upper')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            UPPERCASE
          </button>
          <button
            onClick={() => handleCaseChange('lower')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            lowercase
          </button>
          <button
            onClick={() => handleCaseChange('title')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            Title Case
          </button>
        </div>

        {/* Find and Replace */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
          <span className="text-xs font-semibold text-gray-500 mr-1">Find & Replace:</span>
          <input
            type="text"
            placeholder="Find text..."
            value={findStr}
            onChange={(e) => setFindStr(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border outline-none font-mono"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceStr}
            onChange={(e) => setReplaceStr(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border outline-none font-mono"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          />
          <button
            onClick={handleFindReplace}
            className="px-3 py-1 text-xs font-semibold rounded-lg text-white"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            Replace All
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setText('')}
              className="px-2.5 py-1 text-xs rounded-lg border text-gray-400 hover:text-gray-600"
              style={{ borderColor: 'var(--line)' }}
            >
              Clear
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1"
              style={{
                backgroundColor: copied ? 'var(--ok)' : 'var(--surface-2)',
                color: copied ? '#ffffff' : 'var(--ink)',
                borderColor: copied ? 'var(--ok)' : 'var(--line)',
              }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="p-4 rounded-2xl border shadow-sm"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Paste or type text to inspect, count, clean, or sort..."
          className="w-full font-mono text-xs sm:text-sm bg-transparent border-none outline-none leading-relaxed resize-y"
          style={{ color: 'var(--ink)' }}
        />
      </div>
    </div>
  );
};
