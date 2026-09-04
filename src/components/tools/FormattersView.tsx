import React, { useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, Play, FileCode, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format as formatSQL } from 'sql-formatter';
import yaml from 'js-yaml';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface FormattersViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const FormattersView: React.FC<FormattersViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [indent, setIndent] = useState<2 | 4 | 'tab'>(2);

  // Load sample on tool change or initial
  useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
      executeFormatting(initialInput);
      return;
    }

    let sample = '';
    switch (tool.id) {
      case 'json-formatter':
        sample = '{"title":"Codepackr","tools":["json","jwt","regex","uuid"],"rating":5,"active":true,"meta":{"offline":true,"author":"Naveen"}}';
        break;
      case 'html-formatter':
        sample = '<div class="container"><header><h1>Welcome to Codepackr</h1><nav><a href="#home">Home</a><a href="#tools">Tools</a></nav></header><main><p>Browser developer utilities.</p></main></div>';
        break;
      case 'css-formatter':
        sample = '.card{background-color:#ffffff;border:1px solid #d8e0eb;border-radius:12px;padding:16px}.card:hover{box-shadow:0 8px 24px rgba(0,0,0,0.08)}';
        break;
      case 'sql-formatter':
        sample = 'select u.id, u.name, count(o.id) as total_orders from users u left join orders o on u.id = o.user_id where u.active = 1 and u.created_at >= "2026-01-01" group by u.id, u.name order by total_orders desc limit 10;';
        break;
      case 'xml-formatter':
        sample = '<project name="codepackr"><version>1.0.0</version><features><feature id="1">Zero upload</feature><feature id="2">Local crypto</feature></features></project>';
        break;
      case 'yaml-formatter':
        sample = 'server:\n  host: 0.0.0.0\n  port: 3000\ntools:\n  - name: json\n    enabled: true\n  - name: sql\n    enabled: true';
        break;
      case 'js-minifier':
        sample = 'function calculateDiscount(price, percentage) {\n  // Apply discount formula\n  const factor = 1 - (percentage / 100);\n  return price * factor;\n}\nconsole.log(calculateDiscount(100, 20));';
        break;
    }
    setInput(sample);
    executeFormatting(sample);
  }, [tool.id]);

  const executeFormatting = (valToFormat: string, forceMinify = false) => {
    setError(null);
    if (!valToFormat.trim()) {
      setOutput('');
      return;
    }

    try {
      if (tool.id === 'json-formatter') {
        const parsed = JSON.parse(valToFormat);
        if (forceMinify) {
          setOutput(JSON.stringify(parsed));
        } else {
          const space = indent === 'tab' ? '\t' : indent;
          setOutput(JSON.stringify(parsed, null, space));
        }
      } else if (tool.id === 'html-formatter') {
        let formatted = '';
        const reg = /(>)(<)(\/*)/g;
        let xml = valToFormat.replace(reg, '$1\r\n$2$3');
        let pad = 0;
        const indentStr = indent === 'tab' ? '\t' : ' '.repeat(indent);
        xml.split('\r\n').forEach((node) => {
          let indentLevel = 0;
          if (node.match(/.+<\/\w[^>]*>$/)) {
            indentLevel = 0;
          } else if (node.match(/^<\/\w/)) {
            if (pad !== 0) pad -= 1;
          } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indentLevel = 1;
          } else {
            indentLevel = 0;
          }
          let padding = '';
          for (let i = 0; i < pad; i++) padding += indentStr;
          formatted += padding + node.trim() + '\r\n';
          pad += indentLevel;
        });
        setOutput(formatted.trim());
      } else if (tool.id === 'css-formatter') {
        if (forceMinify) {
          setOutput(
            valToFormat
              .replace(/\/\*[\s\S]*?\*\//g, '')
              .replace(/\s+/g, ' ')
              .replace(/\s*([\{\};:,])\s*/g, '$1')
              .replace(/;}/g, '}')
              .trim()
          );
        } else {
          let css = valToFormat
            .replace(/\s+/g, ' ')
            .replace(/\{\s*/g, ' {\n  ')
            .replace(/;\s*/g, ';\n  ')
            .replace(/\s*\}\s*/g, '\n}\n\n')
            .replace(/\n\s*\n\s*\}/g, '\n}')
            .trim();
          setOutput(css);
        }
      } else if (tool.id === 'sql-formatter') {
        const formatted = formatSQL(valToFormat, {
          language: 'sql',
          tabWidth: indent === 'tab' ? 2 : indent,
          keywordCase: 'upper',
        });
        setOutput(formatted);
      } else if (tool.id === 'xml-formatter') {
        const PADDING = indent === 'tab' ? '\t' : ' '.repeat(indent);
        const reg = /(>)(<)(\/*)/g;
        let formatted = '';
        let pad = 0;
        valToFormat
          .replace(reg, '$1\r\n$2$3')
          .split('\r\n')
          .forEach((node) => {
            let indentStep = 0;
            if (node.match(/.+<\/\w[^>]*>$/)) {
              indentStep = 0;
            } else if (node.match(/^<\/\w/)) {
              if (pad > 0) pad -= 1;
            } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
              indentStep = 1;
            }
            formatted += PADDING.repeat(pad) + node.trim() + '\n';
            pad += indentStep;
          });
        setOutput(formatted.trim());
      } else if (tool.id === 'yaml-formatter') {
        const parsed = yaml.load(valToFormat);
        const dumped = yaml.dump(parsed, { indent: indent === 'tab' ? 2 : indent });
        setOutput(dumped);
      } else if (tool.id === 'js-minifier') {
        // Strip single line comments, multiline comments, excess whitespace
        const minified = valToFormat
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/(^|[^\\])\/\/.*$/gm, '$1')
          .replace(/\s+/g, ' ')
          .replace(/\s*([=+\-*\/%&|^!<>?:;,{}()[\]])\s*/g, '$1')
          .trim();
        setOutput(minified);
      }
    } catch (err: any) {
      setError(err.message || 'Formatting failed. Please check input syntax.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border mb-4 shadow-sm"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => executeFormatting(input)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Format (Ctrl+Enter)</span>
          </button>

          {(tool.id === 'json-formatter' || tool.id === 'css-formatter' || tool.id === 'js-minifier') && (
            <button
              onClick={() => executeFormatting(input, true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:opacity-80 transition-colors"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              Minify
            </button>
          )}

          {tool.id !== 'js-minifier' && (
            <div className="flex items-center gap-1 text-xs border rounded-lg p-0.5 ml-1"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <span className="px-2 text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Indent:</span>
              <button
                onClick={() => { setIndent(2); setTimeout(() => executeFormatting(input), 0); }}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${indent === 2 ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
              >
                2
              </button>
              <button
                onClick={() => { setIndent(4); setTimeout(() => executeFormatting(input), 0); }}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${indent === 4 ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
              >
                4
              </button>
              <button
                onClick={() => { setIndent('tab'); setTimeout(() => executeFormatting(input), 0); }}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${indent === 'tab' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
              >
                Tab
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setInput(''); setOutput(''); setError(null); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border hover:opacity-80"
            style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleCopy}
            disabled={!output}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40"
            style={{
              backgroundColor: copied ? 'var(--ok)' : 'var(--surface)',
              color: copied ? '#ffffff' : 'var(--ink)',
              borderColor: copied ? 'var(--ok)' : 'var(--line)',
            }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Output'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-xl border flex items-start gap-2 text-xs"
          style={{ backgroundColor: 'rgba(240, 62, 62, 0.1)', borderColor: 'var(--warn)', color: 'var(--warn)' }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="font-mono">{error}</div>
        </div>
      )}

      {/* Two-Column Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Pane */}
        <div className="flex flex-col rounded-2xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b text-xs font-semibold"
            style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)', color: 'var(--muted)' }}
          >
            <span>INPUT ({input.length} chars, {input.split('\n').length} lines)</span>
            <span className="text-[11px] font-normal">Edit or paste code</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              executeFormatting(e.target.value);
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                executeFormatting(input);
              }
            }}
            placeholder="Paste your code or text here..."
            className="w-full h-96 p-4 font-mono text-xs sm:text-sm bg-transparent border-none outline-none resize-y leading-relaxed"
            style={{ color: 'var(--ink)' }}
            spellCheck={false}
          />
        </div>

        {/* Output Pane */}
        <div className="flex flex-col rounded-2xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b text-xs font-semibold"
            style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)', color: 'var(--muted)' }}
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>FORMATTED OUTPUT ({output.length} chars)</span>
            </div>
            {output && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Valid</span>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Formatted output will appear here..."
            className="w-full h-96 p-4 font-mono text-xs sm:text-sm bg-transparent border-none outline-none resize-y leading-relaxed"
            style={{ color: 'var(--ink)', backgroundColor: 'var(--surface-2)' }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
