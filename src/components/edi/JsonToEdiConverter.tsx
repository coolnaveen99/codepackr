import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, RefreshCw, ArrowLeftRight, Sparkles, FileCode2, AlertTriangle } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface JsonToEdiConverterProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const SAMPLE_PO_JSON = `{
  "interchange": {
    "sender": "ACMESUPPLY",
    "senderQualifier": "ZZ",
    "receiver": "GLOBALBUYER",
    "receiverQualifier": "ZZ",
    "controlNumber": "000000001"
  },
  "group": {
    "functionalCode": "PO",
    "controlNumber": "1",
    "version": "004010"
  },
  "transaction": {
    "set": "850",
    "controlNumber": "0001",
    "poNumber": "PO-987654",
    "poDate": "20260903",
    "currency": "USD"
  },
  "parties": [
    {
      "type": "ST",
      "name": "EAST DISTRIBUTION CENTER",
      "idQualifier": "92",
      "idCode": "104",
      "address": "450 INDUSTRIAL PARKWAY",
      "city": "NEW YORK",
      "state": "NY",
      "zip": "10001"
    },
    {
      "type": "BT",
      "name": "GLOBAL BUYER HQ",
      "idQualifier": "91",
      "idCode": "HQ01",
      "address": "100 WALL STREET 22ND FL",
      "city": "NEW YORK",
      "state": "NY",
      "zip": "10005"
    }
  ],
  "items": [
    {
      "line": 1,
      "quantity": 50,
      "uom": "EA",
      "unitPrice": 18.50,
      "vendorPart": "PROD-A101",
      "upc": "012345678901",
      "description": "PREMIUM COTTON T-SHIRT L"
    },
    {
      "line": 2,
      "quantity": 100,
      "uom": "EA",
      "unitPrice": 12.00,
      "vendorPart": "PROD-B202",
      "upc": "012345678902",
      "description": "CANVAS WORK TOTE BAG"
    }
  ]
}`;

const SAMPLE_SEGMENTS_JSON = `{
  "format": "ANSI_X12",
  "delimiters": { "element": "*", "segment": "~", "subElement": ">" },
  "segments": [
    { "tag": "BEG", "elements": ["00", "NE", "PO-987654", "", "20260903"] },
    { "tag": "CUR", "elements": ["BY", "USD"] },
    { "tag": "REF", "elements": ["DP", "014"] },
    { "tag": "N1", "elements": ["ST", "EAST DISTRIBUTION CENTER", "92", "104"] },
    { "tag": "N3", "elements": ["450 INDUSTRIAL PARKWAY"] },
    { "tag": "N4", "elements": ["NEW YORK", "NY", "10001", "US"] },
    { "tag": "PO1", "elements": ["1", "50", "EA", "18.50", "", "VN", "PROD-A101"] },
    { "tag": "PID", "elements": ["F", "", "", "", "PREMIUM COTTON T-SHIRT L"] },
    { "tag": "CTT", "elements": ["1", "50"] }
  ]
}`;

export const JsonToEdiConverter: React.FC<JsonToEdiConverterProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [jsonInput, setJsonInput] = useState<string>(initialInput || SAMPLE_PO_JSON);
  const [ediOutput, setEdiOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Delimiters
  const [elemSep, setElemSep] = useState<string>('*');
  const [segTerm, setSegTerm] = useState<string>('~');
  const [subSep, setSubSep] = useState<string>('>');
  const [multiLine, setMultiLine] = useState<boolean>(true);

  // Convert JSON to EDI
  useEffect(() => {
    if (!jsonInput.trim()) {
      setEdiOutput('');
      setJsonError(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setJsonError(null);

      const segments: string[] = [];
      const now = new Date();
      const yy = String(now.getFullYear()).slice(2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const yymmdd = `${yy}${mm}${dd}`;
      const ccyymmdd = `${now.getFullYear()}${mm}${dd}`;
      const hhmm = `${hh}${min}`;

      // Case A: Raw Segment array format
      if (Array.isArray(parsed.segments)) {
        const sender = parsed.interchange?.sender || 'SENDERCO';
        const receiver = parsed.interchange?.receiver || 'RECEIVERCO';
        const ctrl = String(parsed.interchange?.controlNumber || '000000001');

        segments.push(
          `ISA*00*          *00*          *ZZ*${sender.padEnd(15, ' ')}*ZZ*${receiver.padEnd(15, ' ')}*${yymmdd}*${hhmm}*U*00401*${ctrl.padStart(9, '0')}*0*P*${subSep}`
        );
        segments.push(`GS*PO*${sender}*${receiver}*${ccyymmdd}*${hhmm}*${ctrl}*X*004010`);
        segments.push(`ST*850*0001`);

        parsed.segments.forEach((s: any) => {
          if (s.tag && Array.isArray(s.elements)) {
            segments.push([s.tag, ...s.elements].join(elemSep));
          }
        });

        // Calculate count between ST and SE inclusive
        const seCount = segments.length - 2 + 1; // +1 for SE itself
        segments.push(`SE*${seCount}*0001`);
        segments.push(`GE*1*${ctrl}`);
        segments.push(`IEA*1*${ctrl.padStart(9, '0')}`);
      } else {
        // Case B: Semantic Model (850 Purchase Order / 810 Invoice)
        const sender = parsed.interchange?.sender || 'ACMESUPPLY';
        const receiver = parsed.interchange?.receiver || 'GLOBALBUYER';
        const ctrl = String(parsed.interchange?.controlNumber || '000000001');
        const poNumber = parsed.transaction?.poNumber || 'PO-987654';
        const poDate = parsed.transaction?.poDate || ccyymmdd;
        const cur = parsed.transaction?.currency || 'USD';

        // Envelopes
        segments.push(
          `ISA*00*          *00*          *ZZ*${sender.padEnd(15, ' ')}*ZZ*${receiver.padEnd(15, ' ')}*${yymmdd}*${hhmm}*U*00401*${ctrl.padStart(9, '0')}*0*P*${subSep}`
        );
        segments.push(`GS*PO*${sender}*${receiver}*${ccyymmdd}*${hhmm}*1*X*004010`);
        segments.push(`ST*850*0001`);
        segments.push(`BEG*00*NE*${poNumber}**${poDate}`);
        segments.push(`CUR*BY*${cur}`);

        // Parties
        if (Array.isArray(parsed.parties)) {
          parsed.parties.forEach((p: any) => {
            segments.push(`N1*${p.type || 'ST'}*${p.name || ''}*${p.idQualifier || '92'}*${p.idCode || ''}`);
            if (p.address) segments.push(`N3*${p.address}`);
            if (p.city || p.state || p.zip) {
              segments.push(`N4*${p.city || ''}*${p.state || ''}*${p.zip || ''}*US`);
            }
          });
        }

        // Line items
        let totalQuantity = 0;
        if (Array.isArray(parsed.items)) {
          parsed.items.forEach((item: any, idx: number) => {
            const line = item.line || idx + 1;
            const qty = item.quantity || 1;
            totalQuantity += Number(qty);
            const uom = item.uom || 'EA';
            const price = Number(item.unitPrice || 0).toFixed(2);
            segments.push(`PO1*${line}*${qty}*${uom}*${price}**VN*${item.vendorPart || ''}*UP*${item.upc || ''}`);
            if (item.description) {
              segments.push(`PID*F****${item.description}`);
            }
          });
          segments.push(`CTT*${parsed.items.length}*${totalQuantity}`);
        }

        const bodySegCount = segments.length - 2 + 1; // Between ST and SE inclusive
        segments.push(`SE*${bodySegCount}*0001`);
        segments.push(`GE*1*1`);
        segments.push(`IEA*1*${ctrl.padStart(9, '0')}`);
      }

      // Format output with delimiters
      const formattedLines = segments.map((s) => s.replace(/\*/g, elemSep));
      if (multiLine) {
        setEdiOutput(formattedLines.map((l) => `${l}${segTerm}`).join('\n'));
      } else {
        setEdiOutput(formattedLines.map((l) => `${l}${segTerm}`).join(''));
      }
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
      setEdiOutput('');
    }
  }, [jsonInput, elemSep, segTerm, subSep, multiLine]);

  const handleCopy = () => {
    navigator.clipboard.writeText(ediOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([ediOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_transaction.edi';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Control Bar */}
      <div
        className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-[var(--muted)]">Templates:</span>
          <button
            onClick={() => setJsonInput(SAMPLE_PO_JSON)}
            className="px-2.5 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            850 Purchase Order JSON
          </button>
          <button
            onClick={() => setJsonInput(SAMPLE_SEGMENTS_JSON)}
            className="px-2.5 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            Raw Segments Array JSON
          </button>

          <div className="h-4 w-px bg-[var(--line)] mx-1" />

          {/* Delimiters */}
          <span className="font-semibold text-[var(--muted)]">Delimiters:</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span title="Element Separator" className="text-[11px] text-[var(--muted)]">Elem:</span>
            <input
              type="text"
              maxLength={1}
              value={elemSep}
              onChange={(e) => setElemSep(e.target.value || '*')}
              className="w-7 h-7 text-center rounded border outline-none font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <span title="Segment Terminator" className="text-[11px] text-[var(--muted)] ml-1">Term:</span>
            <input
              type="text"
              maxLength={1}
              value={segTerm}
              onChange={(e) => setSegTerm(e.target.value || '~')}
              className="w-7 h-7 text-center rounded border outline-none font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none ml-2">
            <input
              type="checkbox"
              checked={multiLine}
              onChange={(e) => setMultiLine(e.target.checked)}
              className="rounded"
            />
            <span>Wrap lines</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!ediOutput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: copied ? 'var(--ok)' : 'var(--brand)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied EDI!' : 'Copy EDI'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!ediOutput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {jsonError && (
        <div className="p-3 rounded-xl border flex items-center gap-2 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>JSON Syntax Error: {jsonError}</span>
        </div>
      )}

      {/* Editor & Output Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source JSON */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              INPUT JSON PAYLOAD
            </span>
            <span className="text-[11px] text-[var(--muted)]">API / ERP Format</span>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={16}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        {/* Generated EDI */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              GENERATED ANSI X12 DOCUMENT
            </span>
            <span className="text-[11px] text-[var(--muted)]">Calculated SE &amp; Envelopes</span>
          </div>
          <textarea
            readOnly
            value={ediOutput}
            rows={16}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/20"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>
    </div>
  );
};
