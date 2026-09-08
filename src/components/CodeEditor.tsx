import React, { useMemo } from 'react';
import CodeMirror, { Extension } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { sql } from '@codemirror/lang-sql';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';

export type SupportedLanguage =
  | 'json'
  | 'xml'
  | 'sql'
  | 'javascript'
  | 'typescript'
  | 'css'
  | 'html'
  | 'markdown'
  | 'text';

interface CodeEditorProps {
  id?: string;
  value: string;
  onChange?: (value: string) => void;
  language?: SupportedLanguage;
  placeholder?: string;
  readOnly?: boolean;
  theme?: 'light' | 'dark';
  minHeight?: string;
  maxHeight?: string;
  height?: string;
  className?: string;
  lineNumbers?: boolean;
  errorMessage?: string | null;
  errorLine?: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  id,
  value,
  onChange,
  language = 'text',
  placeholder = 'Type or paste code here...',
  readOnly = false,
  theme,
  minHeight = '360px',
  maxHeight = '700px',
  height = '500px',
  className = '',
  lineNumbers = true,
  errorMessage,
  errorLine,
}) => {
  // Check if current theme is dark (prop or DOM fallback)
  const isDark =
    theme !== undefined
      ? theme === 'dark'
      : typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // Dynamic language extension
  const langExtension = useMemo<Extension | null>(() => {
    switch (language) {
      case 'json':
        return json();
      case 'xml':
        return xml();
      case 'html':
        return html();
      case 'markdown':
        return markdown();
      case 'sql':
        return sql();
      case 'javascript':
        return javascript({ jsx: true });
      case 'typescript':
        return javascript({ jsx: true, typescript: true });
      case 'css':
        return css();
      default:
        return null;
    }
  }, [language]);

  // CodeMirror theme tailored to Codepackr theme tokens
  const themeExtension = useMemo(() => {
    return EditorView.theme(
      {
        '&': {
          fontSize: '13.5px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          backgroundColor: 'transparent',
          height: '100%',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'inherit',
          lineHeight: '1.65',
        },
        '.cm-content': {
          padding: '16px 12px',
          caretColor: 'var(--brand)',
        },
        '&.cm-focused': {
          outline: 'none',
        },
        '.cm-line': {
          padding: '0 4px',
        },
        '.cm-gutters': {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.6)',
          color: 'var(--ink-muted)',
          borderRight: '1px solid var(--border)',
          paddingRight: '8px',
        },
        '.cm-activeLineGutter': {
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
          color: 'var(--brand)',
          fontWeight: '600',
        },
        '.cm-activeLine': {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        },
        '.cm-selectionMatch': {
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.18)',
        },
        '&.cm-focused .cm-cursor': {
          borderLeftColor: 'var(--brand)',
          borderLeftWidth: '2px',
        },
      },
      { dark: isDark }
    );
  }, [isDark]);

  const extensions = useMemo(() => {
    const list: Extension[] = [themeExtension, EditorView.lineWrapping];
    if (langExtension) list.push(langExtension);
    return list;
  }, [langExtension, themeExtension]);

  return (
    <div id={id} className={`relative flex flex-col w-full h-full ${className}`}>
      <CodeMirror
        value={value}
        height={height}
        minHeight={minHeight}
        maxHeight={maxHeight}
        theme={isDark ? 'dark' : 'light'}
        extensions={extensions}
        readOnly={readOnly}
        editable={!readOnly}
        basicSetup={{
          lineNumbers,
          highlightActiveLineGutter: true,
          highlightActiveLine: !readOnly,
          bracketMatching: true,
          closeBrackets: !readOnly,
          autocompletion: !readOnly,
          foldGutter: true,
        }}
        placeholder={placeholder}
        onChange={(val) => {
          if (onChange && !readOnly) {
            onChange(val);
          }
        }}
        className="w-full h-full font-mono text-sm"
      />

      {/* Error squiggle notification badge if line is detected */}
      {errorMessage && (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border-t border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span className="truncate">
            {errorLine ? `Line ${errorLine}: ` : ''}
            {errorMessage}
          </span>
        </div>
      )}
    </div>
  );
};
