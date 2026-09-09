import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Copy, Check, RotateCcw, Play, AlertTriangle, CheckCircle2, Trash2, Save, Clock, Loader2, Cpu } from 'lucide-react';
import { format as formatSQL } from 'sql-formatter';
import yaml from 'js-yaml';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { CodeEditor, SupportedLanguage } from '../CodeEditor';
import { useWorkspace } from '../../lib/workspace';
import { executeAsyncTransform, formatJsonInWorker, WorkerTaskResult } from '../../lib/workerBridge';

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
  const getDefaultSample = useCallback((): string => {
    switch (tool.id) {
      case 'json-formatter':
        return '{"title":"CodePackr","tools":["json","jwt"],"rating":5,"active":true,"meta":{"offline":true,"version":"2026.1"}}';
      case 'html-formatter':
        return '<div class="container"><header><h1>Welcome</h1></header><main><p>Enterprise Utilities.</p></main></div>';
      case 'css-formatter':
        return '.card{background-color:#ffffff;border:1px solid #d8e0eb;border-radius:12px;padding:16px}.card:hover{box-shadow:0 8px 24px rgba(0,0,0,0.08)}';
      case 'sql-formatter':
        return 'select u.id, u.name, count(o.id) as total from users u left join orders o on u.id = o.user_id where u.active = 1 group by u.id order by total desc limit 10;';
      case 'xml-formatter':
        return '<?xml version="1.0" encoding="UTF-8"?>\n<project name="codepackr"><version>1.0.0</version><features><feature>local-first</feature><feature>privacy</feature></features></project>';
      case 'yaml-formatter':
        return 'server:\n  host: 0.0.0.0\n  port: 3000\ntools:\n  - name: json\n    enabled: true\n  - name: sql\n    enabled: true';
      case 'js-minifier':
        return 'function calculateDiscount(price, percentage) {\n  // Apply discount\n  return price * (1 - (percentage / 100));\n}';
      default:
        return '';
    }
  }, [tool.id]);

  const {
    content: input,
    setContent: setInput,
    clearWorkspace,
    resetToSample,
    isSavedLocally,
  } = useWorkspace(tool.id, initialInput || getDefaultSample());

  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [indent, setIndent] = useState<2 | 4 | 'tab'>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [execTimeMs, setExecTimeMs] = useState<number | null>(null);

  // Determine language mode for CodeMirror
  const editorLang = useMemo<SupportedLanguage>(() => {
    switch (tool.id) {
      case 'json-formatter':
        return 'json';
      case 'html-formatter':
        return 'html';
      case 'css-formatter':
        return 'css';
      case 'sql-formatter':
        return 'sql';
      case 'xml-formatter':
        return 'xml';
      case 'js-minifier':
        return 'javascript';
      case 'yaml-formatter':
        return 'text';
      default:
        return 'text';
    }
  }, [tool.id]);

  // Execute formatting with Worker / Async offloading
  const executeFormatting = useCallback(
    async (valToFormat: string, forceMinify = false) => {
      setError(null);
      setErrorLine(null);

      if (!valToFormat.trim()) {
        setOutput('');
        setExecTimeMs(null);
        return;
      }

      setIsProcessing(true);

      let res: WorkerTaskResult<string>;

      if (tool.id === 'json-formatter') {
        // Strict Web Worker execution for native JSON parse & stringify
        res = await formatJsonInWorker(valToFormat, indent, forceMinify);
      } else if (tool.id === 'sql-formatter') {
        // SQL formatting with async yielding pattern to prevent UI freeze
        res = await executeAsyncTransform(
          () =>
            formatSQL(valToFormat, {
              language: 'sql',
              tabWidth: indent === 'tab' ? 2 : (indent as number),
              keywordCase: 'upper',
            }),
          { payloadLength: valToFormat.length }
        );
      } else {
        res = await executeAsyncTransform(
          () => {
            if (tool.id === 'html-formatter') {
              let formatted = '';
              const reg = /(>)(<)(\/*)/g;
              let xmlStr = valToFormat.replace(reg, '$1\r\n$2$3');
              let pad = 0;
              const indentStr = indent === 'tab' ? '\t' : ' '.repeat(indent);
              xmlStr.split('\r\n').forEach((node) => {
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
              return formatted.trim();
            } else if (tool.id === 'css-formatter') {
              if (forceMinify) {
                return valToFormat
                  .replace(/\/\*[\s\S]*?\*\//g, '')
                  .replace(/\s+/g, ' ')
                  .replace(/\s*([\{\};:,])\s*/g, '$1')
                  .replace(/;}/g, '}')
                  .trim();
              } else {
                return valToFormat
                  .replace(/\s+/g, ' ')
                  .replace(/\{\s*/g, ' {\n  ')
                  .replace(/;\s*/g, ';\n  ')
                  .replace(/\s*\}\s*/g, '\n}\n\n')
                  .replace(/\n\s*\n\s*\}/g, '\n}')
                  .trim();
              }
            } else if (tool.id === 'xml-formatter') {
              const PADDING = indent === 'tab' ? '\t' : ' '.repeat(indent);
              const reg = /(>)(<)(\/*)/g;
              let formatted = '';
              let pad = 0;
              const xmlStr = valToFormat.replace(reg, '$1\r\n$2$3');
              xmlStr.split('\r\n').forEach((node) => {
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
                for (let i = 0; i < pad; i++) padding += PADDING;
                formatted += padding + node.trim() + '\r\n';
                pad += indentLevel;
              });
              return formatted.trim();
            } else if (tool.id === 'yaml-formatter') {
              const parsed = yaml.load(valToFormat);
              return yaml.dump(parsed, {
                indent: indent === 'tab' ? 2 : (indent as number),
              });
            } else if (tool.id === 'js-minifier') {
              return valToFormat
                .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '')
                .replace(/\s+/g, ' ')
                .replace(/\s*([=\{\}\(\);,:<>\+\-\*\/])\s*/g, '$1')
                .trim();
            }
            return valToFormat;
          },
          { payloadLength: valToFormat.length }
        );
      }

      setIsProcessing(false);
      setExecTimeMs(res.durationMs);

      if (res.success && res.data !== undefined) {
        setOutput(res.data);
      } else {
        const errMsg = res.error || 'Formatting error';
        setError(errMsg);

        // Try extracting line number from syntax errors
        const lineMatch = errMsg.match(/line\s+(\d+)/i) || errMsg.match(/position\s+(\d+)/i);
        if (lineMatch) {
          setErrorLine(parseInt(lineMatch[1], 10));
        }
      }
    },
    [tool.id, indent]
  );

  // Initial formatting execution & initialInput synchronization
  useEffect(() => {
    if (initialInput && initialInput !== input) {
      setInput(initialInput);
      executeFormatting(initialInput);
    } else if (input) {
      executeFormatting(input);
    }
  }, [tool.id, initialInput]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearWorkspace = () => {
    clearWorkspace('');
    setOutput('');
    setError(null);
    setErrorLine(null);
    setExecTimeMs(null);
  };

  const handleResetSample = () => {
    const sample = getDefaultSample();
    resetToSample(sample);
    executeFormatting(sample);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleClearWorkspace}
        resetLabel="Clear Workspace"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => executeFormatting(input)}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-[color:var(--brand)] hover:bg-[color:var(--brand-hover)] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Format Code
          </button>

          {['json-formatter', 'css-formatter', 'js-minifier'].includes(tool.id) && (
            <button
              onClick={() => executeFormatting(input, true)}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl font-bold border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink)] hover:border-[color:var(--brand)] transition-colors cursor-pointer disabled:opacity-50"
            >
              Minify
            </button>
          )}

          {tool.id !== 'js-minifier' && (
            <div className="flex items-center gap-1 p-1 border border-[color:var(--border)] rounded-xl bg-[color:var(--surface-elevated)] ml-1">
              <span className="px-2.5 text-xs font-semibold text-[color:var(--ink-muted)]">Indent:</span>
              {[2, 4, 'tab'].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setIndent(val as any);
                    setTimeout(() => executeFormatting(input), 0);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    indent === val
                      ? 'bg-[color:var(--surface)] text-[color:var(--brand)] shadow-xs'
                      : 'text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]'
                  }`}
                >
                  {val === 'tab' ? 'Tab' : `${val} Spaces`}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleResetSample}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--ink-muted)] hover:text-[color:var(--brand)] hover:border-[color:var(--brand)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Sample
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Local Workspace Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[color:var(--surface-elevated)] text-[11px] font-medium text-[color:var(--ink-muted)] border border-[color:var(--border)]">
            <Save className="w-3 h-3 text-[color:var(--brand)]" />
            <span>{isSavedLocally ? 'Workspace Saved' : 'Auto-Saving'}</span>
          </div>

          {tool.id === 'json-formatter' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[color:var(--surface-elevated)] text-[11px] font-medium text-[color:var(--brand)] border border-[color:var(--border)]">
              <Cpu className="w-3 h-3" />
              <span>Web Worker</span>
            </div>
          )}

          {execTimeMs !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[color:var(--surface-elevated)] text-[11px] font-mono text-[color:var(--ink-muted)] border border-[color:var(--border)]">
              <Clock className="w-3 h-3 text-[color:var(--warning)]" />
              <span>{execTimeMs}ms</span>
            </div>
          )}

          <button
            onClick={handleClearWorkspace}
            title="Clear tool workspace and local cache"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-[color:var(--border)] text-[color:var(--ink-muted)] hover:text-[color:var(--danger)] hover:border-[color:var(--danger)] hover:bg-[color:var(--danger)]/5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Workspace
          </button>

          <button
            onClick={handleCopy}
            disabled={!output}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
              copied
                ? 'bg-[color:var(--success)] text-white border-transparent'
                : 'bg-[color:var(--surface-elevated)] border border-[color:var(--border)] text-[color:var(--ink)] hover:border-[color:var(--brand)]'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Output'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 text-[color:var(--danger)] flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-xs uppercase tracking-wider">Syntax Validation Failed</div>
            <div className="font-mono text-xs sm:text-sm leading-relaxed">{error}</div>
          </div>
        </div>
      )}

      {/* Editor Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input CodeEditor */}
        <div className="flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden shadow-xs focus-within:border-[color:var(--brand)] transition-colors">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--border)] bg-[color:var(--surface-elevated)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-[color:var(--ink-muted)] uppercase">Input</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[color:var(--surface-muted)] text-[color:var(--ink-muted)] uppercase">
                {editorLang}
              </span>
            </div>
            <span className="text-xs font-mono text-[color:var(--ink-muted)]">
              {input.length.toLocaleString()} chars
            </span>
          </div>

          <div className="min-h-[500px] h-[550px] bg-transparent">
            <CodeEditor
              value={input}
              onChange={(val) => {
                setInput(val);
                executeFormatting(val);
              }}
              language={editorLang}
              placeholder="Paste or type code here..."
              height="550px"
              errorMessage={error}
              errorLine={errorLine}
            />
          </div>
        </div>

        {/* Output CodeEditor */}
        <div className="flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--border)] bg-[color:var(--surface-elevated)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-[color:var(--ink-muted)] uppercase">Output</span>
              {output && !error && <CheckCircle2 className="w-4 h-4 text-[color:var(--success)]" />}
            </div>
            <span className="text-xs font-mono text-[color:var(--ink-muted)]">
              {output.length.toLocaleString()} chars
            </span>
          </div>

          <div className="min-h-[500px] h-[550px] bg-[color:var(--surface-elevated)]/30">
            <CodeEditor
              value={output}
              readOnly
              language={editorLang}
              placeholder="Formatted output will appear here..."
              height="550px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
