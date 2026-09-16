import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check, CheckCircle2, AlertTriangle, Search, Split, Table, Columns, AlignJustify, GitCompare, Edit3, ChevronDown, ChevronUp, Download, Sparkles } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { safeLocalStorage } from '../../lib/storage';
import { diffLines, diffWordsWithSpace } from 'diff';
import { CodeEditor } from '../CodeEditor';
import { useWorkspace, popSmartPastePayload } from '../../lib/workspace';
import { downloadContentAsFile } from '../../lib/fileIO';
import { copyText } from '../../lib/clipboard';
import { EditorPaneHeader } from '../common/EditorPaneHeader';

interface ValidatorsViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const ValidatorsView: React.FC<ValidatorsViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  // Common states
  const [copied, setCopied] = useState(false);

  // Diff Checker & JSON structural diff
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [diffViewMode, setDiffViewMode] = useState<'split' | 'unified'>(() => {
    const saved = safeLocalStorage.getItem('codepackr_diff_view_mode');
    if (saved === 'unified' || saved === 'split') return saved;
    return 'split';
  });
  const [showInputsInUnified, setShowInputsInUnified] = useState(false);
  const [diffResults, setDiffResults] = useState<{
    type: 'same' | 'add' | 'del';
    text: string;
    leftLineNum?: number;
    rightLineNum?: number;
    lineNum?: number;
    wordTokens?: { value: string; added?: boolean; removed?: boolean }[];
  }[]>([]);
  const [structuralDiff, setStructuralDiff] = useState<string>('');

  const handleViewModeChange = (mode: 'split' | 'unified') => {
    setDiffViewMode(mode);
    safeLocalStorage.setItem('codepackr_diff_view_mode', mode);
  };

  // Diff Checker sample loader
  const handleLoadDiffSample = () => {
    const sampleOriginal = `// User service configuration
const config = {
  port: 8080,
  host: 'localhost',
  timeout: 5000,
  retries: 3,
  debug: false
};

function startServer() {
  console.log("Starting server on port", config.port);
}`;
    const sampleModified = `// User service configuration
const config = {
  port: 3000,
  host: '0.0.0.0',
  timeout: 10000,
  retries: 5,
  debug: true,
  environment: 'production'
};

function startServer() {
  console.log("Server listening at http://" + config.host + ":" + config.port);
}`;
    setLeftText(sampleOriginal);
    setRightText(sampleModified);
    computeDiff(sampleOriginal, sampleModified);
  };

  // Regex Tester
  const [regexPattern, setRegexPattern] = useState('[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexTestText, setRegexTestText] = useState('Contact us at support@codepackr.com or admin@example.org for assistance!');
  const [regexMatches, setRegexMatches] = useState<RegExpMatchArray[]>([]);
  const [regexError, setRegexError] = useState<string | null>(null);

  // JSON Validator
  const [jsonInput, setJsonInput] = useState('{\n  "name": "Codepackr",\n  "offline": true,\n  "version": "1.0.0"\n}');
  const [jsonValidationResult, setJsonValidationResult] = useState<{ valid: boolean; error?: string; stats?: string }>({ valid: true });

  // JSONPath Tester
  const [jsonPathData, setJsonPathData] = useState('{\n  "store": {\n    "book": [\n      { "category": "reference", "author": "Nigel", "title": "Sayings", "price": 8.95 },\n      { "category": "fiction", "author": "Evelyn", "title": "Sword", "price": 12.99 }\n    ]\n  }\n}');
  const [jsonPathQuery, setJsonPathQuery] = useState('$.store.book[*].title');
  const [jsonPathOutput, setJsonPathOutput] = useState('');

  // CSV Viewer
  const [csvText, setCsvText] = useState('id,name,role,department,active\n1,Alice Morgan,Lead Engineer,Backend,true\n2,Bob Smith,Designer,UI/UX,true\n3,Charlie Rose,Product Manager,Growth,false\n4,Dana White,Security Analyst,Infra,true');
  const [csvSearch, setCsvSearch] = useState('');
  const [csvRows, setCsvRows] = useState<string[][]>([]);

  // dotenv Validator
  const [dotenvInput, setDotenvInput] = useState('NODE_ENV=production\nPORT=3000\nDATABASE_URL=postgres://localhost:5432/db\nCACHE_ENABLED=true\nAPI_KEY=');
  const [dotenvOutput, setDotenvOutput] = useState('');

  useEffect(() => {
    const pending = popSmartPastePayload(tool.id) || popSmartPastePayload('validators') || initialInput;
    if (tool.id === 'diff-checker') {
      const left = 'function greet(name) {\n  console.log("Hello " + name);\n  return true;\n}';
      const right = 'function greet(name, title = "") {\n  console.log(`Hello ${title} ${name}`.trim());\n  return true;\n  // updated for 2026\n}';
      setLeftText(left);
      setRightText(right);
      computeDiff(left, right);
    } else if (tool.id === 'json-structural-diff') {
      const left = '{\n  "version": "1.0",\n  "enabled": true,\n  "count": 5,\n  "tags": ["alpha", "beta"]\n}';
      const right = '{\n  "version": "1.1",\n  "enabled": true,\n  "count": 10,\n  "tags": ["alpha", "beta", "gamma"],\n  "newProp": "codepackr"\n}';
      setLeftText(left);
      setRightText(right);
      computeStructuralDiff(left, right);
    } else if (tool.id === 'regex-tester') {
      evaluateRegex(regexPattern, regexFlags, regexTestText);
    } else if (tool.id === 'json-validator') {
      const payload = pending || jsonInput;
      if (pending) setJsonInput(payload);
      validateJSON(payload);
    } else if (tool.id === 'json-path-tester') {
      evaluateJSONPath(jsonPathData, jsonPathQuery);
    } else if (tool.id === 'csv-viewer') {
      const payload = pending || csvText;
      if (pending) setCsvText(payload);
      parseCSV(payload);
    } else if (tool.id === 'dotenv-formatter') {
      const payload = pending || dotenvInput;
      if (pending) setDotenvInput(payload);
      formatDotenv(payload);
    }
  }, [tool.id, initialInput]);

  // Diff computation with diff library and intra-line word diffing
  const computeDiff = (l: string, r: string) => {
    if (!l && !r) {
      setDiffResults([]);
      return;
    }

    const lineDiff = diffLines(l, r);
    const res: {
      type: 'same' | 'add' | 'del';
      text: string;
      leftLineNum?: number;
      rightLineNum?: number;
      lineNum?: number;
      wordTokens?: { value: string; added?: boolean; removed?: boolean }[];
    }[] = [];

    let curL = 1;
    let curR = 1;

    for (let i = 0; i < lineDiff.length; i++) {
      const part = lineDiff[i];
      const rawLines = part.value.split('\n');
      // If ends with newline, omit trailing empty string produced by split
      const lines = part.value.endsWith('\n') ? rawLines.slice(0, -1) : rawLines;

      if (part.added) {
        // Check if previous part was a deletion to pair intra-line word diffing
        const prevPart = i > 0 && lineDiff[i - 1].removed ? lineDiff[i - 1] : null;
        const prevRaw = prevPart ? prevPart.value.split('\n') : [];
        const prevLines = prevPart && prevPart.value.endsWith('\n') ? prevRaw.slice(0, -1) : prevRaw;

        lines.forEach((line, idx) => {
          let wordTokens = undefined;
          if (prevLines[idx] !== undefined) {
            wordTokens = diffWordsWithSpace(prevLines[idx], line);
          }
          res.push({
            type: 'add',
            text: line,
            rightLineNum: curR++,
            lineNum: curR - 1,
            wordTokens,
          });
        });
      } else if (part.removed) {
        // Check if next part is an addition to pair intra-line word diffing
        const nextPart = i + 1 < lineDiff.length && lineDiff[i + 1].added ? lineDiff[i + 1] : null;
        const nextRaw = nextPart ? nextPart.value.split('\n') : [];
        const nextLines = nextPart && nextPart.value.endsWith('\n') ? nextRaw.slice(0, -1) : nextRaw;

        lines.forEach((line, idx) => {
          let wordTokens = undefined;
          if (nextLines[idx] !== undefined) {
            wordTokens = diffWordsWithSpace(line, nextLines[idx]);
          }
          res.push({
            type: 'del',
            text: line,
            leftLineNum: curL++,
            lineNum: curL - 1,
            wordTokens,
          });
        });
      } else {
        lines.forEach((line) => {
          res.push({
            type: 'same',
            text: line,
            leftLineNum: curL++,
            rightLineNum: curR++,
            lineNum: curR - 1,
          });
        });
      }
    }

    setDiffResults(res);
  };

  const copyDiffToClipboard = () => {
    const diffText = diffResults
      .map((r) => {
        const prefix = r.type === 'add' ? '+ ' : r.type === 'del' ? '- ' : '  ';
        return prefix + r.text;
      })
      .join('\n');
    copyToClipboard(diffText);
  };

  // Structural JSON diff
  const computeStructuralDiff = (lStr: string, rStr: string) => {
    try {
      const l = JSON.parse(lStr);
      const r = JSON.parse(rStr);
      const diffReport: string[] = [];

      const compare = (obj1: any, obj2: any, path: string) => {
        const keys1 = Object.keys(obj1 || {});
        const keys2 = Object.keys(obj2 || {});
        const allKeys = Array.from(new Set([...keys1, ...keys2]));

        for (const k of allKeys) {
          const currentPath = path ? `${path}.${k}` : k;
          if (!(k in obj1)) {
            diffReport.push(`+ Added [${currentPath}]: ${JSON.stringify(obj2[k])}`);
          } else if (!(k in obj2)) {
            diffReport.push(`- Removed [${currentPath}]: ${JSON.stringify(obj1[k])}`);
          } else if (typeof obj1[k] === 'object' && obj1[k] !== null && typeof obj2[k] === 'object' && obj2[k] !== null) {
            compare(obj1[k], obj2[k], currentPath);
          } else if (obj1[k] !== obj2[k]) {
            diffReport.push(`~ Modified [${currentPath}]: ${JSON.stringify(obj1[k])} -> ${JSON.stringify(obj2[k])}`);
          }
        }
      };

      compare(l, r, '');
      setStructuralDiff(diffReport.length > 0 ? diffReport.join('\n') : 'Identical structures: No differences found.');
    } catch (e: any) {
      setStructuralDiff('Error parsing JSON on one of the sides: ' + e.message);
    }
  };

  // Regex evaluation
  const evaluateRegex = (pat: string, flg: string, text: string) => {
    setRegexError(null);
    if (!pat) {
      setRegexMatches([]);
      return;
    }
    try {
      const re = new RegExp(pat, flg);
      const matches: RegExpMatchArray[] = [];
      if (flg.includes('g')) {
        let match;
        while ((match = re.exec(text)) !== null) {
          matches.push(match);
          if (re.lastIndex === match.index) re.lastIndex++; // prevent infinite loop
        }
      } else {
        const single = text.match(re);
        if (single) matches.push(single);
      }
      setRegexMatches(matches);
    } catch (err: any) {
      setRegexError(err.message);
      setRegexMatches([]);
    }
  };

  // JSON validation
  const validateJSON = (val: string) => {
    if (!val.trim()) {
      setJsonValidationResult({ valid: false, error: 'Empty JSON' });
      return;
    }
    try {
      const parsed = JSON.parse(val);
      const isArray = Array.isArray(parsed);
      const keysCount = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 1;
      setJsonValidationResult({
        valid: true,
        stats: `Type: ${isArray ? 'Array' : typeof parsed}, ${keysCount} root entries`,
      });
    } catch (err: any) {
      setJsonValidationResult({
        valid: false,
        error: err.message,
      });
    }
  };

  // JSONPath evaluation
  const evaluateJSONPath = (dataStr: string, queryStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      // Lightweight JSONPath implementation for common expressions: $.store.book[*].title or $.book[0]
      const cleanQ = queryStr.replace(/^\$\.?/, '');
      const segments = cleanQ.split(/\.(?![^\[]*\])/);

      let current: any = [data];

      for (const seg of segments) {
        if (!seg) continue;
        const next: any[] = [];
        for (const item of current) {
          if (!item) continue;
          if (seg.includes('[*]')) {
            const prop = seg.replace(/\[\*\]/g, '');
            const target = prop ? item[prop] : item;
            if (Array.isArray(target)) next.push(...target);
          } else if (seg.includes('[')) {
            const prop = seg.substring(0, seg.indexOf('['));
            const idx = parseInt(seg.substring(seg.indexOf('[') + 1, seg.indexOf(']')), 10);
            const target = prop ? item[prop] : item;
            if (Array.isArray(target) && target[idx] !== undefined) next.push(target[idx]);
          } else {
            if (item[seg] !== undefined) next.push(item[seg]);
          }
        }
        current = next;
      }
      setJsonPathOutput(JSON.stringify(current.length === 1 ? current[0] : current, null, 2));
    } catch (e: any) {
      setJsonPathOutput('Error: ' + e.message);
    }
  };

  // CSV parse
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const parsed = lines.map((line) => {
      // Basic comma split respecting quotes
      const row: string[] = [];
      let inQuotes = false;
      let cur = '';
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') inQuotes = !inQuotes;
        else if (ch === ',' && !inQuotes) {
          row.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      row.push(cur.trim());
      return row;
    });
    setCsvRows(parsed);
  };

  // dotenv formatter
  const formatDotenv = (text: string) => {
    const lines = text.split('\n');
    const cleaned: { key: string; val: string; comment?: string }[] = [];
    for (const l of lines) {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim().toUpperCase();
        const val = trimmed.substring(eqIdx + 1).trim();
        cleaned.push({ key, val });
      }
    }
    // Sort keys alphabetically
    cleaned.sort((a, b) => a.key.localeCompare(b.key));
    const res = cleaned.map((item) => `${item.key}=${item.val}`).join('\n');
    setDotenvOutput(res);
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diffAdditionsCount = diffResults.filter((r) => r.type === 'add').length;
  const diffDeletionsCount = diffResults.filter((r) => r.type === 'del').length;

  interface SplitDiffRow {
    left: {
      lineNum?: number;
      text: string;
      type: 'same' | 'del' | 'empty';
      wordTokens?: { value: string; added?: boolean; removed?: boolean }[];
    };
    right: {
      lineNum?: number;
      text: string;
      type: 'add' | 'empty' | 'same';
      wordTokens?: { value: string; added?: boolean; removed?: boolean }[];
    };
  }

  const splitRows: SplitDiffRow[] = useMemo(() => {
    const rows: SplitDiffRow[] = [];
    let i = 0;
    while (i < diffResults.length) {
      if (diffResults[i].type === 'same') {
        rows.push({
          left: { lineNum: diffResults[i].leftLineNum, text: diffResults[i].text, type: 'same' },
          right: { lineNum: diffResults[i].rightLineNum, text: diffResults[i].text, type: 'same' },
        });
        i++;
      } else {
        const delChunk: typeof diffResults = [];
        const addChunk: typeof diffResults = [];
        while (i < diffResults.length && diffResults[i].type !== 'same') {
          if (diffResults[i].type === 'del') delChunk.push(diffResults[i]);
          if (diffResults[i].type === 'add') addChunk.push(diffResults[i]);
          i++;
        }
        const maxRows = Math.max(delChunk.length, addChunk.length);
        for (let r = 0; r < maxRows; r++) {
          const hasBoth = r < delChunk.length && r < addChunk.length;
          const leftTokens = hasBoth
            ? diffWordsWithSpace(delChunk[r].text, addChunk[r].text)
            : delChunk[r]?.wordTokens;
          const rightTokens = hasBoth
            ? diffWordsWithSpace(delChunk[r].text, addChunk[r].text)
            : addChunk[r]?.wordTokens;

          rows.push({
            left:
              r < delChunk.length
                ? {
                    lineNum: delChunk[r].leftLineNum,
                    text: delChunk[r].text,
                    type: 'del',
                    wordTokens: leftTokens,
                  }
                : { type: 'empty', text: '' },
            right:
              r < addChunk.length
                ? {
                    lineNum: addChunk[r].rightLineNum,
                    text: addChunk[r].text,
                    type: 'add',
                    wordTokens: rightTokens,
                  }
                : { type: 'empty', text: '' },
          });
        }
      }
    }
    return rows;
  }, [diffResults]);

  const handleResetToDefaults = () => {
    if (tool.id === 'diff-checker') {
      const left = 'function greet(name) {\n  console.log("Hello " + name);\n  return true;\n}';
      const right = 'function greet(name, title = "") {\n  console.log(`Hello ${title} ${name}`.trim());\n  return true;\n  // updated for 2026\n}';
      setLeftText(left);
      setRightText(right);
      computeDiff(left, right);
    } else if (tool.id === 'json-structural-diff') {
      const left = '{\n  "version": "1.0",\n  "enabled": true,\n  "count": 5,\n  "tags": ["alpha", "beta"]\n}';
      const right = '{\n  "version": "1.1",\n  "enabled": true,\n  "count": 10,\n  "tags": ["alpha", "beta", "gamma"],\n  "newProp": "codepackr"\n}';
      setLeftText(left);
      setRightText(right);
      computeStructuralDiff(left, right);
    } else if (tool.id === 'regex-tester') {
      const p = '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b';
      const f = 'g';
      const t = 'Contact support@codepackr.com or developer.team@company.org for assistance with EDI 850 transactions.';
      setRegexPattern(p);
      setRegexFlags(f);
      setRegexTestText(t);
      evaluateRegex(p, f, t);
    } else if (tool.id === 'json-validator') {
      const defaultJson = '{\n  "status": "success",\n  "code": 200,\n  "message": "Valid JSON payload",\n  "data": {\n    "user": "developer",\n    "tools": ["formatter", "validator"]\n  }\n}';
      setJsonInput(defaultJson);
      validateJSON(defaultJson);
    } else if (tool.id === 'json-path-tester') {
      const sample = '{\n  "store": {\n    "book": [\n      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },\n      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99 }\n    ]\n  }\n}';
      setJsonPathData(sample);
      setJsonPathQuery('$.store.book[*].author');
      evaluateJSONPath(sample, '$.store.book[*].author');
    } else if (tool.id === 'csv-viewer') {
      const sample = 'id,name,role,department\n1,Alice,Engineer,Platform\n2,Bob,Architect,EDI Integration\n3,Charlie,Analyst,Data Systems';
      setCsvText(sample);
      parseCSV(sample);
    } else if (tool.id === 'dotenv-formatter') {
      const sample = 'NODE_ENV=production\nPORT=3000\nDATABASE_URL=postgres://localhost:5432/db\nCACHE_ENABLED=true\nAPI_KEY=';
      setDotenvInput(sample);
      formatDotenv(sample);
    }
  };

  const getActiveValidatorContent = () => {
    if (tool.id === 'json-validator') return jsonInput;
    if (tool.id === 'diff-checker' || tool.id === 'json-structural-diff') return rightText || leftText;
    if (tool.id === 'csv-viewer') return csvText;
    if (tool.id === 'dotenv-validator') return dotenvOutput || dotenvInput;
    if (tool.id === 'regex-tester') return regexTestText;
    if (tool.id === 'json-path-tester') return jsonPathOutput || jsonPathData;
    return '';
  };

  const handleValidatorUpload = (content: string) => {
    if (tool.id === 'json-validator') {
      setJsonInput(content);
      validateJSON(content);
    } else if (tool.id === 'diff-checker') {
      setLeftText(content);
      computeDiff(content, rightText);
    } else if (tool.id === 'json-structural-diff') {
      setLeftText(content);
      computeStructuralDiff(content, rightText);
    } else if (tool.id === 'csv-viewer') {
      setCsvText(content);
      parseCSV(content);
    } else if (tool.id === 'dotenv-validator') {
      setDotenvInput(content);
      formatDotenv(content);
    } else if (tool.id === 'regex-tester') {
      setRegexTestText(content);
      evaluateRegex(regexPattern, regexFlags, content);
    } else if (tool.id === 'json-path-tester') {
      setJsonPathData(content);
      evaluateJSONPath(content, jsonPathQuery);
    }
  };

  return (
    <div>
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleResetToDefaults}
        resetLabel="Reset to Defaults"
        onUploadFile={handleValidatorUpload}
        downloadContent={getActiveValidatorContent}
        inputContent={leftText || jsonInput || csvText || dotenvInput}
        outputContent={rightText || dotenvOutput || jsonPathOutput}
        hideFileActions={true}
      />

      {/* Diff Checker View */}
      {tool.id === 'diff-checker' && (
        <div className="space-y-4">
          {/* Split View: show the two side-by-side textareas */}
          {diffViewMode === 'split' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ORIGINAL (LEFT) PANEL */}
              <div className="p-4 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <EditorPaneHeader
                  idPrefix="diff-left"
                  title="ORIGINAL (LEFT)"
                  lineCount={leftText ? leftText.split('\n').length : 0}
                  accept=".txt,.json,.xml,.sql,.yaml,.yml,.css,.html,.js,.ts,.diff,.patch,.md"
                  onImport={(content) => {
                    setLeftText(content);
                    computeDiff(content, rightText);
                  }}
                  onClear={leftText ? () => {
                    setLeftText('');
                    computeDiff('', rightText);
                  } : undefined}
                />
                <CodeEditor
                  id="diff-checker-original-input"
                  value={leftText}
                  onChange={(val) => {
                    setLeftText(val);
                    computeDiff(val, rightText);
                  }}
                  height="220px"
                  language="text"
                  placeholder="Paste or type original content here, or click Import..."
                />
              </div>

              {/* MODIFIED (RIGHT) PANEL */}
              <div className="p-4 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <EditorPaneHeader
                  idPrefix="diff-right"
                  title="MODIFIED (RIGHT)"
                  lineCount={rightText ? rightText.split('\n').length : 0}
                  accept=".txt,.json,.xml,.sql,.yaml,.yml,.css,.html,.js,.ts,.diff,.patch,.md"
                  onImport={(content) => {
                    setRightText(content);
                    computeDiff(leftText, content);
                  }}
                  onClear={rightText ? () => {
                    setRightText('');
                    computeDiff(leftText, '');
                  } : undefined}
                />
                <CodeEditor
                  id="diff-checker-modified-input"
                  value={rightText}
                  onChange={(val) => {
                    setRightText(val);
                    computeDiff(leftText, val);
                  }}
                  height="220px"
                  language="text"
                  placeholder="Paste or type modified content here, or click Import..."
                />
              </div>
            </div>
          ) : (
            /* Unified View: Replace the two side-by-side textareas with a single merged diff window */
            showInputsInUnified && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border shadow-sm"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <EditorPaneHeader
                    idPrefix="diff-unified-left"
                    title="ORIGINAL (LEFT)"
                    lineCount={leftText ? leftText.split('\n').length : 0}
                    accept=".txt,.json,.xml,.sql,.yaml,.yml,.css,.html,.js,.ts,.diff,.patch,.md"
                    onImport={(content) => {
                      setLeftText(content);
                      computeDiff(content, rightText);
                    }}
                    onClear={leftText ? () => {
                      setLeftText('');
                      computeDiff('', rightText);
                    } : undefined}
                  />
                  <CodeEditor
                    id="diff-checker-unified-original-input"
                    value={leftText}
                    onChange={(val) => {
                      setLeftText(val);
                      computeDiff(val, rightText);
                    }}
                    height="180px"
                    language="text"
                    placeholder="Paste or type original content here..."
                  />
                </div>
                <div className="p-4 rounded-2xl border shadow-sm"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <EditorPaneHeader
                    idPrefix="diff-unified-right"
                    title="MODIFIED (RIGHT)"
                    lineCount={rightText ? rightText.split('\n').length : 0}
                    accept=".txt,.json,.xml,.sql,.yaml,.yml,.css,.html,.js,.ts,.diff,.patch,.md"
                    onImport={(content) => {
                      setRightText(content);
                      computeDiff(leftText, content);
                    }}
                    onClear={rightText ? () => {
                      setRightText('');
                      computeDiff(leftText, '');
                    } : undefined}
                  />
                  <CodeEditor
                    id="diff-checker-unified-modified-input"
                    value={rightText}
                    onChange={(val) => {
                      setRightText(val);
                      computeDiff(leftText, val);
                    }}
                    height="180px"
                    language="text"
                    placeholder="Paste or type modified content here..."
                  />
                </div>
              </div>
            )
          )}

          {/* Diff Inspection / Unified Diff Panel */}
          <div className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="px-4 py-2.5 border-b text-xs font-semibold flex flex-wrap items-center justify-between gap-2"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center gap-2">
                {diffViewMode === 'split' ? (
                  <Split className="w-4 h-4 text-[var(--brand)]" />
                ) : (
                  <GitCompare className="w-4 h-4 text-[var(--brand)]" />
                )}
                <span>DIFF INSPECTION</span>
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    +{diffAdditionsCount}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    -{diffDeletionsCount}
                  </span>
                </div>
                {diffViewMode === 'unified' && (
                  <button
                    id="diff-checker-toggle-inputs"
                    type="button"
                    onClick={() => setShowInputsInUnified(!showInputsInUnified)}
                    className="ml-2 px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1 transition-colors hover:bg-[var(--surface)]"
                    style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                    title={showInputsInUnified ? 'Hide source textareas' : 'Edit original and modified source inputs'}
                  >
                    <Edit3 className="w-3 h-3 text-[var(--brand)]" />
                    <span>{showInputsInUnified ? 'Hide Inputs' : 'Edit Inputs'}</span>
                    {showInputsInUnified ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleLoadDiffSample}
                  className="px-2.5 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1 hover:bg-[var(--surface)] text-amber-600 dark:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--line)' }}
                  title="Load sample code with differences"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Sample</span>
                </button>

                <button
                  id="diff-checker-export-btn"
                  type="button"
                  onClick={() => {
                    const diffText = diffResults.map(d => `${d.type === 'add' ? '+' : d.type === 'del' ? '-' : ' '} ${d.text}`).join('\n');
                    downloadContentAsFile(diffText, 'changes.diff');
                  }}
                  disabled={diffResults.length === 0}
                  className="px-2.5 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1 hover:bg-[var(--surface)] transition-colors cursor-pointer disabled:opacity-40"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                  title="Export diff as .diff patch file"
                >
                  <Download className="w-3 h-3 text-[var(--brand)]" />
                  <span>Export Diff</span>
                </button>

                <button
                  id="diff-checker-copy-btn"
                  type="button"
                  onClick={copyDiffToClipboard}
                  className="px-2.5 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1 hover:bg-[var(--surface)] transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
                  title="Copy diff to clipboard"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--muted)' }}>
                  Green = Added, Red = Removed
                </span>

                {/* View Mode Segmented Control */}
                <div
                  id="diff-checker-view-toggle"
                  className="flex items-center p-0.5 rounded-lg border text-xs"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <button
                    id="diff-checker-split-view-btn"
                    type="button"
                    onClick={() => handleViewModeChange('split')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                      diffViewMode === 'split'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'hover:text-[var(--ink)]'
                    }`}
                    style={{ color: diffViewMode === 'split' ? '#ffffff' : 'var(--muted)' }}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Split View</span>
                  </button>
                  <button
                    id="diff-checker-unified-view-btn"
                    type="button"
                    onClick={() => handleViewModeChange('unified')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                      diffViewMode === 'unified'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'hover:text-[var(--ink)]'
                    }`}
                    style={{ color: diffViewMode === 'unified' ? '#ffffff' : 'var(--muted)' }}
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                    <span>Unified View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Split View Diff Inspection panel */}
            {diffViewMode === 'split' ? (
              <div id="diff-checker-split-container">
                {/* Column sub-headers matching Original (Left) and Modified (Right) */}
                <div
                  className="grid grid-cols-2 divide-x border-b text-xs font-semibold py-2.5 px-3"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center justify-between pr-3">
                    <span style={{ color: 'var(--muted)' }}>ORIGINAL (LEFT)</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                        {leftText ? leftText.split('\n').length : 0} lines
                      </span>
                      {diffDeletionsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          -{diffDeletionsCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pl-3">
                    <span style={{ color: 'var(--muted)' }}>MODIFIED (RIGHT)</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                        {rightText ? rightText.split('\n').length : 0} lines
                      </span>
                      {diffAdditionsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          +{diffAdditionsCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Side-by-side aligned diff lines */}
                <div className="p-2 font-mono text-xs overflow-x-auto max-h-[520px]">
                  <div className="min-w-[600px]">
                    {splitRows.length === 0 ? (
                      <div className="py-12 text-center text-xs" style={{ color: 'var(--muted)' }}>
                        No differences found — both files are identical.
                      </div>
                    ) : (
                      splitRows.map((row, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-2 divide-x divide-[var(--line)] border-b border-[var(--line)]/25 last:border-b-0 min-h-[26px]"
                        >
                          {/* Left: Original */}
                          <div
                            className={`flex items-center px-2.5 py-0.5 gap-2 overflow-x-auto ${
                              row.left.type === 'del'
                                ? 'bg-rose-100/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                : row.left.type === 'empty'
                                ? 'bg-neutral-500/5 select-none'
                                : 'opacity-85'
                            }`}
                          >
                            <span className="w-6 text-right select-none opacity-40 shrink-0 text-[11px]">
                              {row.left.lineNum ?? ''}
                            </span>
                            <span className="w-3 select-none font-bold text-center shrink-0">
                              {row.left.type === 'del' ? '-' : ' '}
                            </span>
                            <span className="flex-1 whitespace-pre">
                              {row.left.wordTokens && row.left.type === 'del' ? (
                                row.left.wordTokens.map((token, idx) =>
                                  token.added ? null : (
                                    <span
                                      key={idx}
                                      className={token.removed ? 'bg-rose-500/35 text-rose-950 dark:text-rose-100 font-semibold px-0.5 rounded line-through' : ''}
                                    >
                                      {token.value}
                                    </span>
                                  )
                                )
                              ) : (
                                <span className={row.left.type === 'del' ? 'line-through decoration-rose-500/70' : ''}>
                                  {row.left.text}
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Right: Modified */}
                          <div
                            className={`flex items-center px-2.5 py-0.5 gap-2 overflow-x-auto ${
                              row.right.type === 'add'
                                ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : row.right.type === 'empty'
                                ? 'bg-neutral-500/5 select-none'
                                : 'opacity-85'
                            }`}
                          >
                            <span className="w-6 text-right select-none opacity-40 shrink-0 text-[11px]">
                              {row.right.lineNum ?? ''}
                            </span>
                            <span className="w-3 select-none font-bold text-center shrink-0">
                              {row.right.type === 'add' ? '+' : ' '}
                            </span>
                            <span className="flex-1 whitespace-pre">
                              {row.right.wordTokens && row.right.type === 'add' ? (
                                row.right.wordTokens.map((token, idx) =>
                                  token.removed ? null : (
                                    <span
                                      key={idx}
                                      className={token.added ? 'bg-emerald-500/35 text-emerald-950 dark:text-emerald-100 font-semibold px-0.5 rounded shadow-xs' : ''}
                                    >
                                      {token.value}
                                    </span>
                                  )
                                )
                              ) : (
                                row.right.text
                              )}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Unified View merged window */
              <div className="p-3 font-mono text-xs space-y-0.5 overflow-x-auto min-h-[320px] max-h-[580px]">
                {diffResults.length === 0 ? (
                  <div className="py-12 text-center" style={{ color: 'var(--muted)' }}>
                    No differences found — both files are identical.
                  </div>
                ) : (
                  diffResults.map((r, i) => (
                    <div
                      key={i}
                      className={`px-3 py-1 rounded flex items-center gap-3 ${
                        r.type === 'add'
                          ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : r.type === 'del'
                          ? 'bg-rose-100/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-2 select-none opacity-40 text-[11px] shrink-0">
                        <span className="w-6 text-right">{r.leftLineNum ?? ''}</span>
                        <span className="w-6 text-right">{r.rightLineNum ?? ''}</span>
                      </div>
                      <span className="w-3 select-none font-bold text-center shrink-0">
                        {r.type === 'add' ? '+' : r.type === 'del' ? '-' : ' '}
                      </span>
                      <span className="flex-1 whitespace-pre">
                        {r.wordTokens ? (
                          r.wordTokens.map((token, idx) => {
                            if (r.type === 'add' && token.removed) return null;
                            if (r.type === 'del' && token.added) return null;
                            return (
                              <span
                                key={idx}
                                className={
                                  r.type === 'add' && token.added
                                    ? 'bg-emerald-500/35 text-emerald-950 dark:text-emerald-100 font-semibold px-0.5 rounded shadow-xs'
                                    : r.type === 'del' && token.removed
                                    ? 'bg-rose-500/35 text-rose-950 dark:text-rose-100 font-semibold px-0.5 rounded line-through'
                                    : ''
                                }
                              >
                                {token.value}
                              </span>
                            );
                          })
                        ) : (
                          <span className={r.type === 'del' ? 'line-through decoration-rose-500/70' : ''}>
                            {r.text}
                          </span>
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Regex Tester View */}
      {tool.id === 'regex-tester' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border shadow-sm space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                  REGULAR EXPRESSION PATTERN
                </label>
                <div className="flex items-center rounded-xl border px-3"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <span className="font-mono text-gray-400 mr-1">/</span>
                  <input
                    type="text"
                    value={regexPattern}
                    onChange={(e) => {
                      setRegexPattern(e.target.value);
                      evaluateRegex(e.target.value, regexFlags, regexTestText);
                    }}
                    placeholder="Enter regex pattern..."
                    className="w-full py-2 bg-transparent font-mono text-xs sm:text-sm outline-none"
                    style={{ color: 'var(--ink)' }}
                  />
                  <span className="font-mono text-gray-400 ml-1">/</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                  FLAGS
                </label>
                <input
                  type="text"
                  value={regexFlags}
                  onChange={(e) => {
                    setRegexFlags(e.target.value);
                    evaluateRegex(regexPattern, e.target.value, regexTestText);
                  }}
                  placeholder="g, i, m, s"
                  className="w-full px-3 py-2 rounded-xl border font-mono text-xs sm:text-sm outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>

            <div>
              <EditorPaneHeader
                idPrefix="regex-test"
                title="TEST STRING"
                charCount={regexTestText.length}
                lineCount={regexTestText ? regexTestText.split('\n').length : 0}
                accept=".txt"
                onImport={(val) => {
                  setRegexTestText(val);
                  evaluateRegex(regexPattern, regexFlags, val);
                }}
                onClear={regexTestText ? () => {
                  setRegexTestText('');
                  evaluateRegex(regexPattern, regexFlags, '');
                } : undefined}
                onCopy={regexTestText ? () => copyText(regexTestText) : undefined}
                copyContent={regexTestText}
              />
              <CodeEditor
                id="regex-test-string"
                value={regexTestText}
                onChange={(val) => {
                  setRegexTestText(val);
                  evaluateRegex(regexPattern, regexFlags, val);
                }}
                height="150px"
                language="text"
                placeholder="Enter string to test regex matching..."
              />
            </div>
          </div>

          {regexError && (
            <div className="p-3 rounded-xl border text-xs font-mono bg-rose-50 text-rose-600 border-rose-200">
              Regex Error: {regexError}
            </div>
          )}

          {/* Matches List */}
          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase" style={{ color: 'var(--muted)' }}>
                MATCHES FOUND ({regexMatches.length})
              </span>
            </div>

            {regexMatches.length === 0 ? (
              <p className="text-xs italic" style={{ color: 'var(--muted)' }}>
                No matches found with the current pattern.
              </p>
            ) : (
              <div className="space-y-2">
                {regexMatches.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]"
                        style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand)' }}
                      >
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        &ldquo;{m[0]}&rdquo;
                      </span>
                      {m.index !== undefined && (
                        <span className="text-[11px] opacity-60">Index: {m.index}</span>
                      )}
                    </div>
                    <button
                      onClick={() => copyToClipboard(m[0])}
                      className="px-2 py-0.5 rounded border text-[11px] hover:opacity-80"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* JSON Validator View */}
      {tool.id === 'json-validator' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <EditorPaneHeader
              idPrefix="json-val"
              title="JSON STRING TO VALIDATE"
              charCount={jsonInput.length}
              lineCount={jsonInput ? jsonInput.split('\n').length : 0}
              accept=".json,.txt"
              onImport={(content) => {
                setJsonInput(content);
                validateJSON(content);
              }}
              onExport={jsonInput ? () => downloadContentAsFile(jsonInput, 'document.json') : undefined}
              onClear={jsonInput ? () => {
                setJsonInput('');
                validateJSON('');
              } : undefined}
              onSample={() => {
                const sample = JSON.stringify(
                  {
                    status: 'success',
                    code: 200,
                    data: {
                      user: {
                        id: 'usr_49210',
                        name: 'Jane Doe',
                        email: 'jane.doe@example.com',
                        verified: true,
                        roles: ['admin', 'developer']
                      }
                    }
                  },
                  null,
                  2
                );
                setJsonInput(sample);
                validateJSON(sample);
              }}
              onCopy={jsonInput ? () => copyText(jsonInput) : undefined}
              copyContent={jsonInput}
              rightSlot={
                <div className="flex items-center gap-1.5">
                  {jsonValidationResult.valid ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid JSON
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-100/60 dark:bg-rose-950/40 px-2.5 py-1 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" /> Invalid JSON
                    </span>
                  )}
                </div>
              }
            />

            <CodeEditor
              id="json-validator-input"
              value={jsonInput}
              onChange={(val) => {
                setJsonInput(val);
                validateJSON(val);
              }}
              height="380px"
              language="json"
              errorMessage={jsonValidationResult.error}
            />

            {jsonValidationResult.error && (
              <div className="mt-3 p-3 rounded-xl border text-xs font-mono bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900">
                {jsonValidationResult.error}
              </div>
            )}
            {jsonValidationResult.stats && (
              <div className="mt-2 text-xs font-mono" style={{ color: 'var(--muted)' }}>
                {jsonValidationResult.stats}
              </div>
            )}
          </div>
        </div>
      )}

      {/* JSONPath Tester */}
      {tool.id === 'json-path-tester' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              JSONPATH QUERY
            </label>
            <input
              type="text"
              value={jsonPathQuery}
              onChange={(e) => {
                setJsonPathQuery(e.target.value);
                evaluateJSONPath(jsonPathData, e.target.value);
              }}
              placeholder="$.store.book[*].title"
              className="w-full px-3 py-2 rounded-xl border font-mono text-xs sm:text-sm outline-none mb-3"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <EditorPaneHeader
                  idPrefix="jsonpath-data"
                  title="JSON DATA"
                  charCount={jsonPathData.length}
                  lineCount={jsonPathData ? jsonPathData.split('\n').length : 0}
                  accept=".json,.txt"
                  onImport={(val) => {
                    setJsonPathData(val);
                    evaluateJSONPath(val, jsonPathQuery);
                  }}
                  onClear={jsonPathData ? () => {
                    setJsonPathData('');
                    evaluateJSONPath('', jsonPathQuery);
                  } : undefined}
                  onCopy={jsonPathData ? () => copyText(jsonPathData) : undefined}
                  copyContent={jsonPathData}
                />
                <CodeEditor
                  id="json-path-data-input"
                  value={jsonPathData}
                  onChange={(val) => {
                    setJsonPathData(val);
                    evaluateJSONPath(val, jsonPathQuery);
                  }}
                  height="300px"
                  language="json"
                />
              </div>
              <div>
                <EditorPaneHeader
                  idPrefix="jsonpath-result"
                  title="EVALUATION RESULT"
                  charCount={jsonPathOutput.length}
                  lineCount={jsonPathOutput ? jsonPathOutput.split('\n').length : 0}
                  onExport={jsonPathOutput ? () => downloadContentAsFile(jsonPathOutput, 'evaluation-result.json') : undefined}
                  onCopy={jsonPathOutput ? () => copyText(jsonPathOutput) : undefined}
                  copyContent={jsonPathOutput}
                />
                <CodeEditor
                  id="json-path-output"
                  readOnly
                  value={jsonPathOutput}
                  height="300px"
                  language="json"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Viewer */}
      {tool.id === 'csv-viewer' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <EditorPaneHeader
              idPrefix="csv-raw"
              title="RAW CSV INPUT"
              charCount={csvText.length}
              lineCount={csvText ? csvText.split('\n').length : 0}
              accept=".csv,.txt,.tsv"
              onImport={(val) => {
                setCsvText(val);
                parseCSV(val);
              }}
              onExport={csvText ? () => downloadContentAsFile(csvText, 'data.csv') : undefined}
              onClear={csvText ? () => {
                setCsvText('');
                parseCSV('');
              } : undefined}
              onCopy={csvText ? () => copyText(csvText) : undefined}
              copyContent={csvText}
            />
            <div className="mb-3">
              <CodeEditor
                id="csv-raw-input"
                value={csvText}
                onChange={(val) => {
                  setCsvText(val);
                  parseCSV(val);
                }}
                height="150px"
                language="text"
                placeholder="Paste or type CSV content..."
              />
            </div>

            {/* Table Search */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-1 max-w-xs"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter table rows..."
                  value={csvSearch}
                  onChange={(e) => setCsvSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full"
                  style={{ color: 'var(--ink)' }}
                />
              </div>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {csvRows.length > 1 ? `${csvRows.length - 1} rows` : '0 rows'}
              </span>
            </div>

            {/* Table */}
            {csvRows.length > 0 && (
              <div className="border rounded-xl overflow-x-auto max-h-96" style={{ borderColor: 'var(--line)' }}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b font-bold"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                    >
                      {csvRows[0].map((header, i) => (
                        <th key={i} className="p-2.5 border-r last:border-r-0" style={{ borderColor: 'var(--line)' }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(1)
                      .filter((row) => !csvSearch || row.some((cell) => cell.toLowerCase().includes(csvSearch.toLowerCase())))
                      .map((row, rIdx) => (
                        <tr key={rIdx} className="border-b last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ borderColor: 'var(--line)' }}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 border-r last:border-r-0 font-mono" style={{ borderColor: 'var(--line)' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Structural JSON Diff */}
      {tool.id === 'json-structural-diff' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border shadow-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <EditorPaneHeader
                idPrefix="json-diff-left"
                title="LEFT JSON OBJECT"
                lineCount={leftText ? leftText.split('\n').length : 0}
                accept=".json,.txt"
                onImport={(content) => {
                  setLeftText(content);
                  computeStructuralDiff(content, rightText);
                }}
                onClear={leftText ? () => {
                  setLeftText('');
                  computeStructuralDiff('', rightText);
                } : undefined}
              />
              <CodeEditor
                id="json-structural-diff-left"
                value={leftText}
                onChange={(val) => {
                  setLeftText(val);
                  computeStructuralDiff(val, rightText);
                }}
                height="240px"
                language="json"
              />
            </div>
            <div className="p-4 rounded-2xl border shadow-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <EditorPaneHeader
                idPrefix="json-diff-right"
                title="RIGHT JSON OBJECT"
                lineCount={rightText ? rightText.split('\n').length : 0}
                accept=".json,.txt"
                onImport={(content) => {
                  setRightText(content);
                  computeStructuralDiff(leftText, content);
                }}
                onClear={rightText ? () => {
                  setRightText('');
                  computeDiff(leftText, '');
                  computeStructuralDiff(leftText, '');
                } : undefined}
              />
              <CodeEditor
                id="json-structural-diff-right"
                value={rightText}
                onChange={(val) => {
                  setRightText(val);
                  computeStructuralDiff(leftText, val);
                }}
                height="240px"
                language="json"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <EditorPaneHeader
              idPrefix="json-diff-report"
              title="STRUCTURAL KEY DIFFERENCE REPORT"
              onExport={structuralDiff ? () => downloadContentAsFile(structuralDiff, 'json-structural-diff.txt') : undefined}
              onCopy={structuralDiff ? () => copyToClipboard(structuralDiff) : undefined}
              copyContent={structuralDiff}
            />
            <pre className="p-3 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--ink)' }}
            >
              {structuralDiff}
            </pre>
          </div>
        </div>
      )}

      {/* dotenv Formatter */}
      {tool.id === 'dotenv-formatter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <EditorPaneHeader
              idPrefix="dotenv-input"
              title="INPUT .ENV CONTENT"
              lineCount={dotenvInput ? dotenvInput.split('\n').length : 0}
              accept=".env,.txt"
              onImport={(content) => {
                setDotenvInput(content);
                formatDotenv(content);
              }}
              onClear={dotenvInput ? () => {
                setDotenvInput('');
                setDotenvOutput('');
              } : undefined}
            />
            <CodeEditor
              id="dotenv-input"
              value={dotenvInput}
              onChange={(val) => {
                setDotenvInput(val);
                formatDotenv(val);
              }}
              height="260px"
              language="text"
            />
          </div>
          <div className="p-4 rounded-2xl border shadow-sm flex flex-col"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <EditorPaneHeader
              idPrefix="dotenv-output"
              title="SORTED & CLEANED .ENV"
              lineCount={dotenvOutput ? dotenvOutput.split('\n').length : 0}
              onExport={dotenvOutput ? () => downloadContentAsFile(dotenvOutput, '.env') : undefined}
              onCopy={dotenvOutput ? () => copyToClipboard(dotenvOutput) : undefined}
              copyContent={dotenvOutput}
            />
            <CodeEditor
              id="dotenv-output"
              readOnly
              value={dotenvOutput}
              height="260px"
              language="text"
            />
          </div>
        </div>
      )}
    </div>
  );
};
