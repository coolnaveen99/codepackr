import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, RefreshCw, SlidersHorizontal, CheckCircle2, AlertTriangle, ShieldCheck, Upload, Trash2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface EdiDelimiterCleanerProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const SAMPLE_RAW_EDI = `ISA*00*          *00*          *ZZ*ACME*ZZ*BUYER*260903*1430*U*00401*123*0*P*>~GS*PO*ACME*BUYER*20260903*1430*1*X*004010~ST*850*0001~BEG*00*NE*PO-987654**20260903~PO1*1*50*EA*18.50~SE*4*0001~GE*1*1~IEA*1*000000123~`;

export const EdiDelimiterCleaner: React.FC<EdiDelimiterCleanerProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [input, setInput] = useState<string>(initialInput || SAMPLE_RAW_EDI);
  const [targetElemSep, setTargetElemSep] = useState<string>('*');
  const [targetSegTerm, setTargetSegTerm] = useState<string>('~');
  const [wrapLines, setWrapLines] = useState<boolean>(true);
  const [normalizeIsa, setNormalizeIsa] = useState<boolean>(true);
  const [stripTrailingSpaces, setStripTrailingSpaces] = useState<boolean>(true);
  const [removeCR, setRemoveCR] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Auto-detect current separators
  const currentDelims = useMemo(() => {
    const trimmed = input.trim();
    let elem = '*';
    let term = '~';
    if (trimmed.startsWith('ISA') && trimmed.length >= 106) {
      elem = trimmed[3];
      const charAt105 = trimmed[105];
      if (charAt105 && !/\s/.test(charAt105)) {
        term = charAt105;
      }
    } else if (trimmed.includes('~')) {
      term = '~';
    } else if (trimmed.includes("'")) {
      term = "'";
      elem = '+';
    }
    return { elem, term };
  }, [input]);

  // Process and clean EDI
  const { cleanedEdi, isaStatus } = useMemo(() => {
    if (!input.trim()) return { cleanedEdi: '', isaStatus: null };

    let text = input;
    if (removeCR) {
      text = text.replace(/\r/g, '');
    }

    const { elem: srcElem, term: srcTerm } = currentDelims;
    const rawSegments = text.split(srcTerm).map((s) => s.trim()).filter(Boolean);

    let isaLen = 0;
    let isaError = null;

    const processedSegments = rawSegments.map((seg) => {
      const parts = seg.split(srcElem);
      const tag = parts[0]?.toUpperCase();

      if (tag === 'ISA' && normalizeIsa && parts.length >= 16) {
        // Enforce ANSI X12 strict fixed-width lengths:
        // ISA01: 2, ISA02: 10, ISA03: 2, ISA04: 10, ISA05: 2, ISA06: 15, ISA07: 2, ISA08: 15
        // ISA09: 6, ISA10: 4, ISA11: 1, ISA12: 5, ISA13: 9, ISA14: 1, ISA15: 1, ISA16: 1
        const isa01 = (parts[1] || '00').padEnd(2, ' ').slice(0, 2);
        const isa02 = (parts[2] || '').padEnd(10, ' ').slice(0, 10);
        const isa03 = (parts[3] || '00').padEnd(2, ' ').slice(0, 2);
        const isa04 = (parts[4] || '').padEnd(10, ' ').slice(0, 10);
        const isa05 = (parts[5] || 'ZZ').padEnd(2, ' ').slice(0, 2);
        const isa06 = (parts[6] || '').padEnd(15, ' ').slice(0, 15);
        const isa07 = (parts[7] || 'ZZ').padEnd(2, ' ').slice(0, 2);
        const isa08 = (parts[8] || '').padEnd(15, ' ').slice(0, 15);
        const isa09 = (parts[9] || '260903').padEnd(6, ' ').slice(0, 6);
        const isa10 = (parts[10] || '1200').padEnd(4, ' ').slice(0, 4);
        const isa11 = (parts[11] || 'U').slice(0, 1);
        const isa12 = (parts[12] || '00401').padEnd(5, ' ').slice(0, 5);
        const isa13 = (parts[13] || '000000001').padStart(9, '0').slice(-9);
        const isa14 = (parts[14] || '0').slice(0, 1);
        const isa15 = (parts[15] || 'P').slice(0, 1);
        const isa16 = (parts[16] || '>').slice(0, 1);

        const normalizedParts = [
          'ISA',
          isa01,
          isa02,
          isa03,
          isa04,
          isa05,
          isa06,
          isa07,
          isa08,
          isa09,
          isa10,
          isa11,
          isa12,
          isa13,
          isa14,
          isa15,
          isa16,
        ];
        const rebuilt = normalizedParts.join(targetElemSep);
        isaLen = rebuilt.length + (targetSegTerm ? targetSegTerm.length : 1);
        return rebuilt;
      }

      // Other segments
      const cleanedParts = parts.map((p) => (stripTrailingSpaces ? p.trim() : p));
      return cleanedParts.join(targetElemSep);
    });

    let result = '';
    if (wrapLines) {
      result = processedSegments.map((s) => `${s}${targetSegTerm}`).join('\n');
    } else {
      result = processedSegments.map((s) => `${s}${targetSegTerm}`).join('');
    }

    return {
      cleanedEdi: result,
      isaStatus: {
        length: isaLen,
        isExact106: isaLen === 106,
        segmentCount: processedSegments.length,
      },
    };
  }, [input, currentDelims, targetElemSep, targetSegTerm, wrapLines, normalizeIsa, stripTrailingSpaces, removeCR]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedEdi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([cleanedEdi], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_edi.edi';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearWorkspace = () => {
    setInput('');
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleClearWorkspace}
        resetLabel="Clear Workspace"
      />

      {/* Control Panel */}
      <div
        className="p-4 rounded-2xl border space-y-3 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-[var(--ink)]">Target Delimiters:</span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted)]">Element Separator:</span>
              <input
                type="text"
                maxLength={1}
                value={targetElemSep}
                onChange={(e) => setTargetElemSep(e.target.value || '*')}
                className="w-8 h-8 text-center rounded-lg border font-mono font-bold"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted)]">Segment Terminator:</span>
              <input
                type="text"
                maxLength={1}
                value={targetSegTerm}
                onChange={(e) => setTargetSegTerm(e.target.value || '~')}
                className="w-8 h-8 text-center rounded-lg border font-mono font-bold"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInput(SAMPLE_RAW_EDI)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border font-medium hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Sample</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: copied ? 'var(--ok)' : 'var(--brand)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Clean EDI!' : 'Copy Clean EDI'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl border font-semibold hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="flex flex-wrap items-center gap-5 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
          <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
            <input
              type="checkbox"
              checked={normalizeIsa}
              onChange={(e) => setNormalizeIsa(e.target.checked)}
              className="rounded"
            />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Fix ISA 106-Char Mandatory Padding (ISA01-16)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={wrapLines}
              onChange={(e) => setWrapLines(e.target.checked)}
              className="rounded"
            />
            <span>Wrap segments into new lines</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={stripTrailingSpaces}
              onChange={(e) => setStripTrailingSpaces(e.target.checked)}
              className="rounded"
            />
            <span>Trim element whitespace</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={removeCR}
              onChange={(e) => setRemoveCR(e.target.checked)}
              className="rounded"
            />
            <span>Strip Windows CR (\r)</span>
          </label>
        </div>
      </div>

      {/* ISA 106-Char Health Banner */}
      {isaStatus && (
        <div
          className="p-3.5 rounded-xl border flex items-center justify-between text-xs"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-2">
            {isaStatus.isExact106 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span className="font-semibold" style={{ color: 'var(--ink)' }}>
              ISA Segment Length: {isaStatus.length} characters{' '}
              {isaStatus.isExact106 ? (
                <span className="text-emerald-600">(Complies with ANSI X12 106-character standard)</span>
              ) : (
                <span className="text-amber-600">(Standard requires exactly 106 chars)</span>
              )}
            </span>
          </div>
          <span className="text-[var(--muted)] font-mono">{isaStatus.segmentCount} Segments Cleaned</span>
        </div>
      )}

      {/* Editor & Output Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source EDI */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              RAW OR UNWRAPPED EDI
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--muted)] hidden sm:inline">
                Detected: {currentDelims.elem} &amp; {currentDelims.term}
              </span>
              <label className="cursor-pointer hover:opacity-80 flex items-center gap-1 text-[var(--muted)] text-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept=".edi,.txt,.x12"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        if (typeof evt.target?.result === 'string') {
                          setInput(evt.target.result);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setInput('')}
                disabled={!input}
                className="hover:opacity-80 text-rose-500 disabled:opacity-40 flex items-center gap-1 text-xs cursor-pointer"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        {/* Cleaned EDI */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              CLEANED &amp; NORMALIZED EDI
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!cleanedEdi}
                className="text-xs flex items-center gap-1 hover:opacity-80 text-[var(--brand)] font-medium disabled:opacity-40 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!cleanedEdi}
                className="text-xs flex items-center gap-1 hover:opacity-80 text-[var(--muted)] font-medium disabled:opacity-40 cursor-pointer"
                title="Download cleaned .edi"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={cleanedEdi}
            rows={14}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/20"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>
    </div>
  );
};
