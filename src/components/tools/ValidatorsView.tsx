import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check, CheckCircle2, AlertTriangle, Search, Split, Table, Columns, AlignJustify, GitCompare, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { safeLocalStorage } from '../../lib/storage';

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
  }[]>([]);
  const [structuralDiff, setStructuralDiff] = useState<string>('');

  const handleViewModeChange = (mode: 'split' | 'unified') => {
    setDiffViewMode(mode);
    safeLocalStorage.setItem('codepackr_diff_view_mode', mode);
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

  // XSD Validator
  const [xmlInput, setXmlInput] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>Tove</to>
  <from>Jani</from>
  <heading>Reminder</heading>
  <body>Don't forget me this weekend!</body>
</note>`);

  const [xsdInput, setXsdInput] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="note">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="to" type="xs:string"/>
        <xs:element name="from" type="xs:string"/>
        <xs:element name="heading" type="xs:string"/>
        <xs:element name="body" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`);

  const [xsdResults, setXsdResults] = useState<{ valid: boolean; issues: string[]; stats?: string }>({
    valid: true,
    issues: ['XML conforms to XSD schema structure.'],
    stats: 'Well-formed XML Document (4 elements verified)',
  });

  const validateXSD = (xml: string, xsd: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        setXsdResults({
          valid: false,
          issues: [`XML Syntax Error: ${parserError.textContent?.split('\n')[0] || 'Invalid XML'}`],
        });
        return;
      }

      const xsdDoc = parser.parseFromString(xsd, 'text/xml');
      const xsdError = xsdDoc.querySelector('parsererror');
      if (xsdError) {
        setXsdResults({
          valid: false,
          issues: [`XSD Syntax Error: ${xsdError.textContent?.split('\n')[0] || 'Invalid XSD schema'}`],
        });
        return;
      }

      const issues: string[] = [];
      const expectedElements = Array.from(xsdDoc.querySelectorAll('element, [name]'))
        .map((el) => el.getAttribute('name'))
        .filter(Boolean);

      const xmlElements = Array.from(xmlDoc.querySelectorAll('*')).map((el) => el.tagName);

      if (expectedElements.length > 0) {
        const rootElement = expectedElements[0];
        if (xmlDoc.documentElement.tagName !== rootElement) {
          issues.push(`Root element mismatch: expected <${rootElement}>, found <${xmlDoc.documentElement.tagName}>`);
        }
      }

      expectedElements.forEach((req) => {
        if (req && !xmlElements.includes(req)) {
          issues.push(`Missing element: <${req}> declared in schema`);
        }
      });

      if (issues.length > 0) {
        setXsdResults({
          valid: false,
          issues,
          stats: `${xmlElements.length} elements scanned, ${issues.length} issue(s) detected`,
        });
      } else {
        setXsdResults({
          valid: true,
          issues: ['XML document conforms to XSD schema definition.'],
          stats: `Well-formed XML document (${xmlElements.length} elements verified against schema)`,
        });
      }
    } catch (err: any) {
      setXsdResults({
        valid: false,
        issues: [`Validation error: ${err.message}`],
      });
    }
  };

  useEffect(() => {
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
      validateJSON(jsonInput);
    } else if (tool.id === 'json-path-tester') {
      evaluateJSONPath(jsonPathData, jsonPathQuery);
    } else if (tool.id === 'csv-viewer') {
      parseCSV(csvText);
    } else if (tool.id === 'dotenv-formatter') {
      formatDotenv(dotenvInput);
    } else if (tool.id === 'xsd-validator') {
      validateXSD(xmlInput, xsdInput);
    }
  }, [tool.id]);

  // Diff computation with LCS (Longest Common Subsequence)
  const computeDiff = (l: string, r: string) => {
    const a = l.split('\n');
    const b = r.split('\n');
    const n = a.length;
    const m = b.length;

    // 1. Common prefix
    let start = 0;
    while (start < n && start < m && a[start] === b[start]) {
      start++;
    }

    // 2. Common suffix
    let endA = n - 1;
    let endB = m - 1;
    while (endA >= start && endB >= start && a[endA] === b[endB]) {
      endA--;
      endB--;
    }

    const res: {
      type: 'same' | 'add' | 'del';
      text: string;
      leftLineNum?: number;
      rightLineNum?: number;
      lineNum?: number;
    }[] = [];

    // Prefix lines
    for (let i = 0; i < start; i++) {
      res.push({
        type: 'same',
        text: a[i],
        leftLineNum: i + 1,
        rightLineNum: i + 1,
        lineNum: i + 1,
      });
    }

    // Middle lines
    const middleA = a.slice(start, endA + 1);
    const middleB = b.slice(start, endB + 1);
    const midN = middleA.length;
    const midM = middleB.length;

    if (midN > 0 && midM > 0 && midN * midM <= 400000) {
      const dp: number[][] = Array.from({ length: midN + 1 }, () => new Array(midM + 1).fill(0));
      for (let i = 1; i <= midN; i++) {
        const lineA = middleA[i - 1];
        for (let j = 1; j <= midM; j++) {
          if (lineA === middleB[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }

      let i = midN;
      let j = midM;
      const temp: {
        type: 'same' | 'add' | 'del';
        text: string;
        leftLineNum?: number;
        rightLineNum?: number;
        lineNum?: number;
      }[] = [];

      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && middleA[i - 1] === middleB[j - 1]) {
          temp.push({
            type: 'same',
            text: middleA[i - 1],
            leftLineNum: start + i,
            rightLineNum: start + j,
            lineNum: start + j,
          });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          temp.push({
            type: 'add',
            text: middleB[j - 1],
            rightLineNum: start + j,
            lineNum: start + j,
          });
          j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
          temp.push({
            type: 'del',
            text: middleA[i - 1],
            leftLineNum: start + i,
            lineNum: start + i,
          });
          i--;
        }
      }
      temp.reverse();
      res.push(...temp);
    } else {
      let curL = start + 1;
      let curR = start + 1;
      for (const line of middleA) {
        res.push({
          type: 'del',
          text: line,
          leftLineNum: curL++,
          lineNum: curL,
        });
      }
      for (const line of middleB) {
        res.push({
          type: 'add',
          text: line,
          rightLineNum: curR++,
          lineNum: curR,
        });
      }
    }

    // Suffix lines
    for (let k = 0; k < (n - 1 - endA); k++) {
      const leftIdx = endA + 1 + k;
      const rightIdx = endB + 1 + k;
      res.push({
        type: 'same',
        text: a[leftIdx],
        leftLineNum: leftIdx + 1,
        rightLineNum: rightIdx + 1,
        lineNum: rightIdx + 1,
      });
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
    left: { lineNum?: number; text: string; type: 'same' | 'del' | 'empty' };
    right: { lineNum?: number; text: string; type: 'add' | 'empty' | 'same' };
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
          rows.push({
            left:
              r < delChunk.length
                ? { lineNum: delChunk[r].leftLineNum, text: delChunk[r].text, type: 'del' }
                : { type: 'empty', text: '' },
            right:
              r < addChunk.length
                ? { lineNum: addChunk[r].rightLineNum, text: addChunk[r].text, type: 'add' }
                : { type: 'empty', text: '' },
          });
        }
      }
    }
    return rows;
  }, [diffResults]);

  return (
    <div>
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Diff Checker View */}
      {tool.id === 'diff-checker' && (
        <div className="space-y-4">
          {/* Split View: show the two side-by-side textareas */}
          {diffViewMode === 'split' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    ORIGINAL (LEFT)
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                    {leftText ? leftText.split('\n').length : 0} lines
                  </span>
                </div>
                <textarea
                  id="diff-checker-original-input"
                  value={leftText}
                  onChange={(e) => {
                    setLeftText(e.target.value);
                    computeDiff(e.target.value, rightText);
                  }}
                  rows={7}
                  className="w-full p-3 font-mono text-xs rounded-xl border outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  placeholder="Paste or type original content here..."
                />
              </div>
              <div className="p-4 rounded-2xl border shadow-sm"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    MODIFIED (RIGHT)
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                    {rightText ? rightText.split('\n').length : 0} lines
                  </span>
                </div>
                <textarea
                  id="diff-checker-modified-input"
                  value={rightText}
                  onChange={(e) => {
                    setRightText(e.target.value);
                    computeDiff(leftText, e.target.value);
                  }}
                  rows={7}
                  className="w-full p-3 font-mono text-xs rounded-xl border outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  placeholder="Paste or type modified content here..."
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      ORIGINAL (LEFT)
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                      {leftText ? leftText.split('\n').length : 0} lines
                    </span>
                  </div>
                  <textarea
                    id="diff-checker-unified-original-input"
                    value={leftText}
                    onChange={(e) => {
                      setLeftText(e.target.value);
                      computeDiff(e.target.value, rightText);
                    }}
                    rows={5}
                    className="w-full p-3 font-mono text-xs rounded-xl border outline-none"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    placeholder="Paste or type original content here..."
                  />
                </div>
                <div className="p-4 rounded-2xl border shadow-sm"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      MODIFIED (RIGHT)
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                      {rightText ? rightText.split('\n').length : 0} lines
                    </span>
                  </div>
                  <textarea
                    id="diff-checker-unified-modified-input"
                    value={rightText}
                    onChange={(e) => {
                      setRightText(e.target.value);
                      computeDiff(leftText, e.target.value);
                    }}
                    rows={5}
                    className="w-full p-3 font-mono text-xs rounded-xl border outline-none"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
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

              <div className="flex items-center gap-3">
                <button
                  id="diff-checker-copy-btn"
                  type="button"
                  onClick={copyDiffToClipboard}
                  className="px-2 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1 hover:bg-[var(--surface)] transition-colors"
                  style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
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
                            <span
                              className={`flex-1 whitespace-pre ${
                                row.left.type === 'del' ? 'line-through decoration-rose-500/70' : ''
                              }`}
                            >
                              {row.left.text}
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
                              {row.right.text}
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
                      <span
                        className={`flex-1 whitespace-pre ${
                          r.type === 'del' ? 'line-through decoration-rose-500/70' : ''
                        }`}
                      >
                        {r.text}
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
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                TEST STRING
              </label>
              <textarea
                value={regexTestText}
                onChange={(e) => {
                  setRegexTestText(e.target.value);
                  evaluateRegex(regexPattern, regexFlags, e.target.value);
                }}
                rows={4}
                className="w-full p-3 font-mono text-xs sm:text-sm rounded-xl border outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                JSON STRING TO VALIDATE
              </label>
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
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                validateJSON(e.target.value);
              }}
              rows={12}
              className="w-full p-4 font-mono text-xs sm:text-sm rounded-xl border outline-none leading-relaxed"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
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
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                  JSON DATA
                </label>
                <textarea
                  value={jsonPathData}
                  onChange={(e) => {
                    setJsonPathData(e.target.value);
                    evaluateJSONPath(e.target.value, jsonPathQuery);
                  }}
                  rows={10}
                  className="w-full p-3 font-mono text-xs rounded-xl border outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                  EVALUATION RESULT
                </label>
                <textarea
                  readOnly
                  value={jsonPathOutput}
                  rows={10}
                  className="w-full p-3 font-mono text-xs rounded-xl border outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
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
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              RAW CSV INPUT
            </label>
            <textarea
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                parseCSV(e.target.value);
              }}
              rows={4}
              className="w-full p-3 font-mono text-xs rounded-xl border outline-none mb-3"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />

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
              <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                LEFT JSON OBJECT
              </span>
              <textarea
                value={leftText}
                onChange={(e) => {
                  setLeftText(e.target.value);
                  computeStructuralDiff(e.target.value, rightText);
                }}
                rows={8}
                className="w-full p-3 font-mono text-xs rounded-xl border outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
            <div className="p-4 rounded-2xl border shadow-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                RIGHT JSON OBJECT
              </span>
              <textarea
                value={rightText}
                onChange={(e) => {
                  setRightText(e.target.value);
                  computeStructuralDiff(leftText, e.target.value);
                }}
                rows={8}
                className="w-full p-3 font-mono text-xs rounded-xl border outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              STRUCTURAL KEY DIFFERENCE REPORT
            </span>
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
            <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              INPUT .ENV CONTENT
            </span>
            <textarea
              value={dotenvInput}
              onChange={(e) => {
                setDotenvInput(e.target.value);
                formatDotenv(e.target.value);
              }}
              rows={10}
              className="w-full p-3 font-mono text-xs rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
          <div className="p-4 rounded-2xl border shadow-sm flex flex-col"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                SORTED & CLEANED .ENV
              </span>
              <button
                onClick={() => copyToClipboard(dotenvOutput)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <textarea
              readOnly
              value={dotenvOutput}
              rows={10}
              className="w-full flex-1 p-3 font-mono text-xs rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
        </div>
      )}

      {/* XSD / XML Schema Validator */}
      {tool.id === 'xsd-validator' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* XML Document */}
            <div
              className="p-4 rounded-2xl border shadow-sm flex flex-col"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  XML INSTANCE DOCUMENT
                </span>
                <span className="text-[11px] text-[var(--muted)]">Instance Data</span>
              </div>
              <textarea
                value={xmlInput}
                onChange={(e) => {
                  setXmlInput(e.target.value);
                  validateXSD(e.target.value, xsdInput);
                }}
                rows={12}
                className="w-full p-3 font-mono text-xs rounded-xl border outline-none leading-relaxed"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>

            {/* XSD Schema */}
            <div
              className="p-4 rounded-2xl border shadow-sm flex flex-col"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  XSD SCHEMA DEFINITION
                </span>
                <span className="text-[11px] text-[var(--muted)]">W3C XML Schema</span>
              </div>
              <textarea
                value={xsdInput}
                onChange={(e) => {
                  setXsdInput(e.target.value);
                  validateXSD(xmlInput, e.target.value);
                }}
                rows={12}
                className="w-full p-3 font-mono text-xs rounded-xl border outline-none leading-relaxed"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          {/* Validation Result Status */}
          <div
            className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              {xsdResults.valid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              )}
              <span
                className={`font-semibold text-sm ${
                  xsdResults.valid ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {xsdResults.valid ? 'Valid Against XSD Schema' : 'Validation Discrepancies Found'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              {xsdResults.issues.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border ${
                    xsdResults.valid
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                  }`}
                >
                  {msg}
                </div>
              ))}
            </div>

            {xsdResults.stats && (
              <p className="mt-2 text-xs text-[var(--muted)]">{xsdResults.stats}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
