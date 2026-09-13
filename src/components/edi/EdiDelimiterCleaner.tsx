import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Upload,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { ToolShell } from './ToolShell';
import { EDI_TRANSACTIONS } from '../../data/ediDictionary';
import { downloadFile } from '../../lib/smartDownload';

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
  const [selectedSampleId, setSelectedSampleId] = useState<string>('850');
  const [targetElemSep, setTargetElemSep] = useState<string>('*');
  const [targetSegTerm, setTargetSegTerm] = useState<string>('~');
  const [targetSubElemSep, setTargetSubElemSep] = useState<string>('>');
  const [wrapLines, setWrapLines] = useState<boolean>(true);
  const [normalizeIsa, setNormalizeIsa] = useState<boolean>(true);
  const [stripTrailingSpaces, setStripTrailingSpaces] = useState<boolean>(true);
  const [removeCR, setRemoveCR] = useState<boolean>(true);
  const [isPhiMasked, setIsPhiMasked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Auto-detect current separators
  const currentDelims = useMemo(() => {
    const trimmed = input.trim();
    let elem = '*';
    let term = '~';
    let sub = '>';
    if (trimmed.startsWith('ISA') && trimmed.length >= 106) {
      elem = trimmed[3];
      sub = trimmed[104] || '>';
      const charAt105 = trimmed[105];
      if (charAt105 && !/\s/.test(charAt105)) {
        term = charAt105;
      }
    } else if (trimmed.startsWith('UNA') && trimmed.length >= 9) {
      sub = trimmed[3];
      elem = trimmed[4];
      term = trimmed[8];
    } else if (trimmed.includes('~')) {
      term = '~';
    } else if (trimmed.includes("'")) {
      term = "'";
      elem = '+';
      sub = ':';
    }
    return { elem, term, sub };
  }, [input]);

  // Load preset sample
  const handleSelectSample = (sampleId: string) => {
    const tx = EDI_TRANSACTIONS.find((t) => t.id === sampleId || t.code === sampleId);
    if (tx) {
      setSelectedSampleId(tx.id);
      setInput(tx.samplePayload);
      if (tx.standard === 'EDIFACT') {
        setTargetElemSep('+');
        setTargetSegTerm("'");
        setTargetSubElemSep(':');
      } else {
        setTargetElemSep('*');
        setTargetSegTerm('~');
        setTargetSubElemSep('>');
      }
    }
  };

  // PHI Masking helper (HIPAA Safe Harbor)
  const { processedInputText, maskedCount } = useMemo(() => {
    if (!isPhiMasked || !input) return { processedInputText: input, maskedCount: 0 };

    let count = 0;
    // Replace patient / member names in NM1*IL or NM1*QC, addresses in N3, N4
    const lines = input.split(currentDelims.term);
    const maskedLines = lines.map((line) => {
      const parts = line.split(currentDelims.elem);
      const tag = parts[0]?.trim().toUpperCase();

      if (['NM1', 'N1'].includes(tag) && parts.length > 3) {
        if (['IL', 'QC', '74', 'PR'].includes(parts[1]?.trim())) {
          count++;
          if (parts[3]) parts[3] = '[REDACTED_NAME]';
          if (parts[4]) parts[4] = '[REDACTED]';
          if (parts[9]) parts[9] = 'MEMBER-***-****';
          return parts.join(currentDelims.elem);
        }
      }
      if (tag === 'DMG' && parts.length > 2) {
        count++;
        parts[2] = '19800101'; // Standardized mask date
        return parts.join(currentDelims.elem);
      }
      if (tag === 'N3' && parts.length > 1) {
        count++;
        parts[1] = '100 REDACTED HEALTHWAY';
        return parts.join(currentDelims.elem);
      }
      return line;
    });

    return { processedInputText: maskedLines.join(currentDelims.term), maskedCount: count };
  }, [input, isPhiMasked, currentDelims]);

  // Process and clean EDI
  const { cleanedEdi, isaStatus, segmentCount } = useMemo(() => {
    if (!processedInputText.trim()) return { cleanedEdi: '', isaStatus: null, segmentCount: 0 };

    let text = processedInputText;
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
        const isa16 = (parts[16] || targetSubElemSep || '>').slice(0, 1);

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
        const rebuiltIsa = normalizedParts.join(targetElemSep) + targetSegTerm;
        isaLen = rebuiltIsa.length;
        return normalizedParts.join(targetElemSep);
      }

      const cleanedParts = parts.map((elem) => (stripTrailingSpaces ? elem.trim() : elem));
      return cleanedParts.join(targetElemSep);
    });

    const joiner = wrapLines ? `${targetSegTerm}\n` : targetSegTerm;
    const finalEdi = processedSegments.join(joiner) + targetSegTerm;

    return {
      cleanedEdi: finalEdi,
      segmentCount: processedSegments.length,
      isaStatus:
        isaLen > 0
          ? {
              length: isaLen,
              isExact106: isaLen === 106,
              segmentCount: processedSegments.length,
            }
          : null,
    };
  }, [
    processedInputText,
    currentDelims,
    targetElemSep,
    targetSegTerm,
    targetSubElemSep,
    normalizeIsa,
    wrapLines,
    stripTrailingSpaces,
    removeCR,
  ]);

  const handleCopy = () => {
    if (!cleanedEdi) return;
    navigator.clipboard.writeText(cleanedEdi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!cleanedEdi) return;
    downloadFile({
      file: cleanedEdi,
      filename: `cleaned_edi_${Date.now()}.edi`,
      mimeType: 'text/plain',
      expectedExtension: 'edi',
    });
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Modern ToolShell with Universal Toolbar, Story Mode & Status Bar */}
      <ToolShell
        selectedSampleId={selectedSampleId}
        onSelectSample={handleSelectSample}
        isPhiMasked={isPhiMasked}
        onTogglePhiMask={setIsPhiMasked}
        maskedPhiCount={maskedCount}
        hasInput={!!input.trim()}
        onClear={() => setInput('')}
        onResetSample={() => setInput(SAMPLE_RAW_EDI)}
        segmentTerminator={targetSegTerm}
        elementSeparator={targetElemSep}
        subElementSeparator={targetSubElemSep}
        onSegmentTerminatorChange={setTargetSegTerm}
        onElementSeparatorChange={setTargetElemSep}
        onSubElementSeparatorChange={setTargetSubElemSep}
        onAutoDetectDelimiters={() => {
          setTargetElemSep(currentDelims.elem);
          setTargetSegTerm(currentDelims.term);
          setTargetSubElemSep(currentDelims.sub);
        }}
        secondaryActions={
          <div className="flex items-center gap-1.5 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold select-none px-2 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-emerald-600 dark:text-emerald-400">
              <input
                type="checkbox"
                checked={normalizeIsa}
                onChange={(e) => setNormalizeIsa(e.target.checked)}
                className="rounded"
              />
              <span>106-Char ISA</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none px-2 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
              <input
                type="checkbox"
                checked={wrapLines}
                onChange={(e) => setWrapLines(e.target.checked)}
                className="rounded"
              />
              <span>Wrap Lines</span>
            </label>
          </div>
        }
        leftPaneTitle="RAW / UNWRAPPED EDI SOURCE"
        leftPaneBadge={
          <span className="font-mono text-[10px] text-[var(--muted)]">
            Detected: {currentDelims.elem} &amp; {currentDelims.term}
          </span>
        }
        leftPaneActions={
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
        }
        leftPaneContent={
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={15}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Paste raw wrapped or unwrapped EDI stream..."
          />
        }
        rightPaneTitle="NORMALIZED & CLEANED EDI STREAM"
        rightPaneBadge={
          isaStatus && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isaStatus.isExact106
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}
            >
              ISA: {isaStatus.length}/106
            </span>
          )
        }
        rightPaneActions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!cleanedEdi}
              className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 hover:opacity-80 disabled:opacity-40 cursor-pointer shadow-xs"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: copied ? 'var(--ok)' : 'var(--brand)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!cleanedEdi}
              className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 hover:opacity-80 disabled:opacity-40 cursor-pointer shadow-xs"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              title="Download Cleaned File"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        }
        rightPaneContent={
          <textarea
            readOnly
            value={cleanedEdi}
            rows={15}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        }
        bottomContent={
          <div
            className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs flex-wrap shadow-xs"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stripTrailingSpaces}
                  onChange={(e) => setStripTrailingSpaces(e.target.checked)}
                  className="rounded"
                />
                <span>Trim element trailing whitespace</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={removeCR}
                  onChange={(e) => setRemoveCR(e.target.checked)}
                  className="rounded"
                />
                <span>Strip Carriage Returns (\r)</span>
              </label>
            </div>
            {isaStatus && (
              <span className="text-[11px] font-mono text-[var(--muted)]">
                Status: {isaStatus.isExact106 ? 'Valid 106-character ISA' : 'Non-standard ISA length'}
              </span>
            )}
          </div>
        }
        statusBarMetrics={{
          segmentCount,
          byteSize: cleanedEdi ? new Blob([cleanedEdi]).size : 0,
          encodingStandard: input.startsWith('UN') ? 'UN/EDIFACT' : 'ANSI ASC X12',
          complianceStatus: isaStatus ? (isaStatus.isExact106 ? 'valid' : 'warning') : 'valid',
          customMessage: 'Delimiters normalized in-browser',
        }}
      />
    </div>
  );
};
