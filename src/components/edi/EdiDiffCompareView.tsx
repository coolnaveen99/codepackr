import React, { useState, useMemo, useRef } from 'react';
import {
  GitCompare,
  ArrowLeftRight,
  Sparkles,
  Upload,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Sliders,
  Columns,
  AlignLeft,
  Download,
  RotateCcw,
  FileCode2,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { downloadFile } from '../../lib/smartDownload';

interface EdiDiffCompareViewProps {
  tool: ToolDef;
  onBackToHome: () => void;
  onSelectRelated: (t: ToolDef) => void;
  initialInput?: string;
}

interface ElementDiff {
  index: number;
  label: string;
  valA: string;
  valB: string;
  isChanged: boolean;
}

interface SegmentDiffRow {
  id: string;
  lineA?: number;
  lineB?: number;
  segA?: string;
  segB?: string;
  tag: string;
  status: 'identical' | 'modified' | 'added' | 'removed';
  elementDiffs?: ElementDiff[];
  summaryNote?: string;
}

export const EdiDiffCompareView: React.FC<EdiDiffCompareViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [docA, setDocA] = useState<string>(initialInput || '');
  const [docB, setDocB] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [ignoreControlNumbers, setIgnoreControlNumbers] = useState<boolean>(true);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(true);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  // Quick swap Doc A & Doc B
  const handleSwapDocs = () => {
    const temp = docA;
    setDocA(docB);
    setDocB(temp);
  };

  // -------------------------------------------------------------
  // PRELOAD SAMPLES
  // -------------------------------------------------------------
  const load850RevisionSample = () => {
    const sampleA = `ISA*00*          *00*          *ZZ*ACMESUPPLY     *ZZ*GLOBALBUYER    *260910*0830*U*00401*000000850*0*P*>~
GS*PO*ACMESUPPLY*GLOBALBUYER*20260910*0830*85001*X*004010~
ST*850*0001~
BEG*00*NE*PO-2026-78901**20260910~
CUR*SE*USD~
REF*DP*042~
N1*ST*GLOBAL DISTRIBUTION DC #4*9*0098765432100~
N3*1200 LOGISTICS WAY~
N4*DALLAS*TX*75201~
PO1*1*150*EA*45.00**VN*SKU-A101*UP*012345678905~
PID*F****INDUSTRIAL SMART SENSOR MODULE 24V~
PO1*2*75*EA*120.00**VN*SKU-B202*UP*012345678912~
PID*F****WIRELESS TELEMETRY GATEWAY IP67~
CTT*2*225~
SE*13*0001~
GE*1*85001~
IEA*1*000000850~`;

    const sampleB = `ISA*00*          *00*          *ZZ*ACMESUPPLY     *ZZ*GLOBALBUYER    *260912*1420*U*00401*000000855*0*P*>~
GS*PO*ACMESUPPLY*GLOBALBUYER*20260912*1420*85002*X*004010~
ST*850*0002~
BEG*00*NE*PO-2026-78901**20260912~
CUR*SE*USD~
REF*DP*042~
N1*ST*GLOBAL DISTRIBUTION DC #4*9*0098765432100~
N3*1200 LOGISTICS WAY SUITE 200~
N4*DALLAS*TX*75201~
PO1*1*200*EA*42.50**VN*SKU-A101*UP*012345678905~
PID*F****INDUSTRIAL SMART SENSOR MODULE 24V~
PO1*2*75*EA*120.00**VN*SKU-B202*UP*012345678912~
PID*F****WIRELESS TELEMETRY GATEWAY IP67~
PO1*3*50*EA*15.00**VN*SKU-C303*UP*012345678929~
PID*F****MOUNTING BRACKET KIT~
CTT*3*325~
SE*15*0002~
GE*1*85002~
IEA*1*000000855~`;

    setDocA(sampleA);
    setDocB(sampleB);
  };

  const load856AsnSample = () => {
    const sampleA = `ISA*00*          *00*          *ZZ*SHIPPER123     *ZZ*RECEIVER456    *260911*0900*U*00401*000000856*0*P*>~
GS*SH*SHIPPER123*RECEIVER456*20260911*0900*85601*X*004010~
ST*856*0001~
BSN*00*ASN-2026-001*20260911*0900~
HL*1**S~
TD1*CTN*50~
TD5*B*2*UPSN*U~
HL*2*1*O~
PRF*PO-98765~
HL*3*2*I~
LIN*1*VN*SKU-ITEM-01~
SN1*1*50*EA~
SE*11*0001~
GE*1*85601~
IEA*1*000000856~`;

    const sampleB = `ISA*00*          *00*          *ZZ*SHIPPER123     *ZZ*RECEIVER456    *260912*1100*U*00401*000000857*0*P*>~
GS*SH*SHIPPER123*RECEIVER456*20260912*1100*85602*X*004010~
ST*856*0002~
BSN*00*ASN-2026-001*20260912*1100~
HL*1**S~
TD1*CTN*80~
TD5*B*2*FDXG*U~
HL*2*1*O~
PRF*PO-98765~
HL*3*2*T~
MAN*GM*000012345600000001~
HL*4*3*I~
LIN*1*VN*SKU-ITEM-01~
SN1*1*80*EA~
SE*13*0002~
GE*1*85602~
IEA*1*000000857~`;

    setDocA(sampleA);
    setDocB(sampleB);
  };

  // -------------------------------------------------------------
  // SEMANTIC DIFF ENGINE
  // -------------------------------------------------------------
  const diffAnalysis = useMemo(() => {
    if (!docA.trim() && !docB.trim()) {
      return { rows: [], stats: { totalA: 0, totalB: 0, added: 0, removed: 0, modified: 0, identical: 0, matchPct: 100 } };
    }

    const isEdifactA = docA.includes('UNB') || docA.includes('UNH');
    const isEdifactB = docB.includes('UNB') || docB.includes('UNH');
    const termA = isEdifactA ? "'" : '~';
    const termB = isEdifactB ? "'" : '~';

    const parseSegments = (text: string, term: string) => {
      return text
        .split(term)
        .map((s) => (ignoreWhitespace ? s.trim() : s))
        .filter(Boolean);
    };

    const segsA = parseSegments(docA, termA);
    const segsB = parseSegments(docB, termB);

    // Helpers to mask volatile control numbers and timestamps
    const normalizeSegForComparison = (seg: string) => {
      const sep = seg.includes('+') ? '+' : '*';
      const parts = seg.split(sep);
      const tag = parts[0];

      if (!ignoreControlNumbers) return seg;

      // Mask control numbers and dates
      if (tag === 'ISA') {
        // Mask date/time (9, 10), control number (13)
        return parts.map((p, i) => (i === 9 || i === 10 || i === 13 ? '###' : p)).join(sep);
      }
      if (tag === 'GS') {
        // Mask date/time (4, 5), group control (6)
        return parts.map((p, i) => (i === 4 || i === 5 || i === 6 ? '###' : p)).join(sep);
      }
      if (tag === 'ST' || tag === 'SE') {
        // Mask ST02 / SE02
        return parts.map((p, i) => (i === 2 ? '###' : p)).join(sep);
      }
      if (tag === 'GE' || tag === 'IEA') {
        // Mask control numbers
        return parts.map((p, i) => (i === 2 ? '###' : p)).join(sep);
      }
      if (tag === 'UNB') {
        return parts.map((p, i) => (i === 4 || i === 5 ? '###' : p)).join(sep);
      }
      if (tag === 'UNH' || tag === 'UNT') {
        return parts.map((p, i) => (i === 1 ? '###' : p)).join(sep);
      }
      return seg;
    };

    // Semantic Key generator for alignment (e.g. "PO1-1", "N1-ST", "BEG")
    const getSemanticKey = (seg: string) => {
      const sep = seg.includes('+') ? '+' : '*';
      const parts = seg.split(sep);
      const tag = parts[0];
      if (tag === 'PO1' || tag === 'IT1' || tag === 'LIN') {
        return `${tag}_${parts[1] || ''}`;
      }
      if (tag === 'N1' || tag === 'NAD') {
        return `${tag}_${parts[1] || ''}`;
      }
      if (tag === 'HL') {
        return `${tag}_${parts[3] || parts[1] || ''}`;
      }
      if (tag === 'REF' || tag === 'RFF') {
        return `${tag}_${parts[1] || ''}`;
      }
      if (tag === 'PID') {
        return `${tag}_${parts[5] || parts[1] || ''}`;
      }
      return tag;
    };

    // Element diff calculator
    const computeElementDiffs = (sA: string, sB: string): ElementDiff[] => {
      const sepA = sA.includes('+') ? '+' : '*';
      const sepB = sB.includes('+') ? '+' : '*';
      const pA = sA.split(sepA);
      const pB = sB.split(sepB);
      const maxLen = Math.max(pA.length, pB.length);
      const diffs: ElementDiff[] = [];

      for (let i = 1; i < maxLen; i++) {
        const vA = pA[i] || '';
        const vB = pB[i] || '';
        const tag = pA[0] || pB[0];
        const elemLabel = `${tag}${String(i).padStart(2, '0')}`;

        // Check if volatile
        const isVolatile =
          ignoreControlNumbers &&
          ((tag === 'ISA' && (i === 9 || i === 10 || i === 13)) ||
            (tag === 'GS' && (i === 4 || i === 5 || i === 6)) ||
            ((tag === 'ST' || tag === 'SE') && i === 2) ||
            ((tag === 'GE' || tag === 'IEA') && i === 2));

        const isChanged = !isVolatile && vA !== vB;
        if (vA || vB) {
          diffs.push({
            index: i,
            label: elemLabel,
            valA: vA,
            valB: vB,
            isChanged,
          });
        }
      }
      return diffs;
    };

    // Align segments between A and B
    const rows: SegmentDiffRow[] = [];
    let ptrA = 0;
    let ptrB = 0;

    let statsAdded = 0;
    let statsRemoved = 0;
    let statsModified = 0;
    let statsIdentical = 0;

    while (ptrA < segsA.length || ptrB < segsB.length) {
      const curA = segsA[ptrA];
      const curB = segsB[ptrB];

      if (curA !== undefined && curB !== undefined) {
        const normA = normalizeSegForComparison(curA);
        const normB = normalizeSegForComparison(curB);

        if (normA === normB) {
          // Identical
          const tag = curA.split(/[*+]/)[0];
          rows.push({
            id: `row_${ptrA}_${ptrB}`,
            lineA: ptrA + 1,
            lineB: ptrB + 1,
            segA: curA,
            segB: curB,
            tag,
            status: 'identical',
          });
          statsIdentical++;
          ptrA++;
          ptrB++;
          continue;
        }

        // Check if same semantic key
        const keyA = getSemanticKey(curA);
        const keyB = getSemanticKey(curB);

        if (keyA === keyB) {
          // Modified segment
          const tag = curA.split(/[*+]/)[0];
          const elemDiffs = computeElementDiffs(curA, curB);
          const changedCount = elemDiffs.filter((d) => d.isChanged).length;

          rows.push({
            id: `row_${ptrA}_${ptrB}`,
            lineA: ptrA + 1,
            lineB: ptrB + 1,
            segA: curA,
            segB: curB,
            tag,
            status: changedCount > 0 ? 'modified' : 'identical',
            elementDiffs: elemDiffs,
            summaryNote: `${changedCount} element(s) changed`,
          });

          if (changedCount > 0) statsModified++;
          else statsIdentical++;

          ptrA++;
          ptrB++;
          continue;
        }

        // Lookahead to find best alignment
        let foundInB = -1;
        for (let lookB = ptrB + 1; lookB < Math.min(segsB.length, ptrB + 6); lookB++) {
          if (getSemanticKey(curA) === getSemanticKey(segsB[lookB])) {
            foundInB = lookB;
            break;
          }
        }

        let foundInA = -1;
        for (let lookA = ptrA + 1; lookA < Math.min(segsA.length, ptrA + 6); lookA++) {
          if (getSemanticKey(curB) === getSemanticKey(segsA[lookA])) {
            foundInA = lookA;
            break;
          }
        }

        if (foundInB !== -1 && (foundInA === -1 || foundInB - ptrB <= foundInA - ptrA)) {
          // Segments in B were added before curA
          while (ptrB < foundInB) {
            const addedSeg = segsB[ptrB];
            rows.push({
              id: `add_${ptrB}`,
              lineB: ptrB + 1,
              segB: addedSeg,
              tag: addedSeg.split(/[*+]/)[0],
              status: 'added',
              summaryNote: 'Segment added in Doc B',
            });
            statsAdded++;
            ptrB++;
          }
          continue;
        } else if (foundInA !== -1) {
          // Segments in A were removed
          while (ptrA < foundInA) {
            const removedSeg = segsA[ptrA];
            rows.push({
              id: `rem_${ptrA}`,
              lineA: ptrA + 1,
              segA: removedSeg,
              tag: removedSeg.split(/[*+]/)[0],
              status: 'removed',
              summaryNote: 'Segment removed in Doc B',
            });
            statsRemoved++;
            ptrA++;
          }
          continue;
        } else {
          // If no near match, treat as modification if same tag family, otherwise removal + addition
          const tagA = curA.split(/[*+]/)[0];
          const tagB = curB.split(/[*+]/)[0];

          if (tagA === tagB) {
            const elemDiffs = computeElementDiffs(curA, curB);
            rows.push({
              id: `mod_${ptrA}_${ptrB}`,
              lineA: ptrA + 1,
              lineB: ptrB + 1,
              segA: curA,
              segB: curB,
              tag: tagA,
              status: 'modified',
              elementDiffs: elemDiffs,
            });
            statsModified++;
            ptrA++;
            ptrB++;
          } else {
            rows.push({
              id: `rem_${ptrA}`,
              lineA: ptrA + 1,
              segA: curA,
              tag: tagA,
              status: 'removed',
            });
            statsRemoved++;
            ptrA++;
          }
        }
      } else if (curA !== undefined) {
        // Remaining in A are removed
        rows.push({
          id: `rem_${ptrA}`,
          lineA: ptrA + 1,
          segA: curA,
          tag: curA.split(/[*+]/)[0],
          status: 'removed',
        });
        statsRemoved++;
        ptrA++;
      } else if (curB !== undefined) {
        // Remaining in B are added
        rows.push({
          id: `add_${ptrB}`,
          lineB: ptrB + 1,
          segB: curB,
          tag: curB.split(/[*+]/)[0],
          status: 'added',
        });
        statsAdded++;
        ptrB++;
      }
    }

    const totalSegs = Math.max(segsA.length, segsB.length);
    const matchPct = totalSegs > 0 ? Math.round((statsIdentical / totalSegs) * 100) : 100;

    return {
      rows,
      stats: {
        totalA: segsA.length,
        totalB: segsB.length,
        added: statsAdded,
        removed: statsRemoved,
        modified: statsModified,
        identical: statsIdentical,
        matchPct,
      },
    };
  }, [docA, docB, ignoreControlNumbers, ignoreWhitespace]);

  // Generate markdown / plain text diff report
  const handleCopyReport = () => {
    const lines = [
      '# Codepackr EDI Semantic Comparison Report',
      `Date: ${new Date().toISOString()}`,
      `Total Segments: Doc A (${diffAnalysis.stats.totalA}) | Doc B (${diffAnalysis.stats.totalB})`,
      `Metrics: +${diffAnalysis.stats.added} Added | -${diffAnalysis.stats.removed} Removed | Δ ${diffAnalysis.stats.modified} Modified | ${diffAnalysis.stats.identical} Identical (${diffAnalysis.stats.matchPct}% Match)`,
      '',
      '## Detailed Differences',
    ];

    diffAnalysis.rows
      .filter((r) => r.status !== 'identical')
      .forEach((r) => {
        if (r.status === 'added') {
          lines.push(`[+] ADDED Line ${r.lineB}: ${r.segB}`);
        } else if (r.status === 'removed') {
          lines.push(`[-] REMOVED Line ${r.lineA}: ${r.segA}`);
        } else if (r.status === 'modified') {
          lines.push(`[Δ] MODIFIED Line A:${r.lineA} -> Line B:${r.lineB}`);
          lines.push(`    Doc A: ${r.segA}`);
          lines.push(`    Doc B: ${r.segB}`);
          if (r.elementDiffs) {
            const changed = r.elementDiffs.filter((d) => d.isChanged);
            changed.forEach((c) => {
              lines.push(`    * ${c.label}: "${c.valA}" -> "${c.valB}"`);
            });
          }
        }
      });

    const reportText = lines.join('\n');
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Tool Header */}
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Control Bar & Sample Loaders */}
      <div
        className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* Layout Toggle */}
          <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl border" style={{ borderColor: 'var(--line)' }}>
            <button
              type="button"
              onClick={() => setViewLayout('side-by-side')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewLayout === 'side-by-side'
                  ? 'bg-[var(--brand)] text-white shadow-sm'
                  : 'text-[var(--ink)] hover:bg-[var(--surface)]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('unified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewLayout === 'unified'
                  ? 'bg-[var(--brand)] text-white shadow-sm'
                  : 'text-[var(--ink)] hover:bg-[var(--surface)]'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Unified Diff</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSwapDocs}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
            style={{ borderColor: 'var(--line)' }}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap A &harr; B</span>
          </button>
        </div>

        {/* Golden Sample Loaders */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" /> Load Diffs:
          </span>
          <button
            type="button"
            onClick={load850RevisionSample}
            className="px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-[var(--surface-2)] text-[var(--ink)] cursor-pointer"
            style={{ borderColor: 'var(--line)' }}
          >
            850 PO Revision (Qty & Price)
          </button>
          <button
            type="button"
            onClick={load856AsnSample}
            className="px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-[var(--surface-2)] text-[var(--ink)] cursor-pointer"
            style={{ borderColor: 'var(--line)' }}
          >
            856 ASN Packaging Diff
          </button>
        </div>
      </div>

      {/* Semantic Options Panel */}
      <div
        className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="chk-ignore-ctrl"
              checked={ignoreControlNumbers}
              onChange={(e) => setIgnoreControlNumbers(e.target.checked)}
              className="rounded text-[var(--brand)] cursor-pointer"
            />
            <label htmlFor="chk-ignore-ctrl" className="text-xs font-medium text-[var(--ink)] cursor-pointer select-none">
              <strong>Ignore Transient Envelopes & Dates</strong> (ISA13, GS06, ST02, timestamps)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="chk-ignore-ws"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="rounded text-[var(--brand)] cursor-pointer"
            />
            <label htmlFor="chk-ignore-ws" className="text-xs font-medium text-[var(--ink)] cursor-pointer select-none">
              Normalize whitespace & formatting
            </label>
          </div>
        </div>

        {diffAnalysis.rows.length > 0 && (
          <button
            type="button"
            onClick={handleCopyReport}
            className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
            style={{ borderColor: 'var(--line)' }}
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReport ? 'Copied Report!' : 'Copy Diff Report'}</span>
          </button>
        )}
      </div>

      {/* Document Input Dual Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Document A (Original) */}
        <div
          className="p-4 rounded-2xl border space-y-2"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
              <MinusCircle className="w-4 h-4" /> Document A (Original / Baseline)
            </span>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputARef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setDocA((ev.target?.result as string) || '');
                    reader.readAsText(f);
                  }
                }}
                accept=".edi,.x12,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputARef.current?.click()}
                className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--muted)] cursor-pointer"
                title="Upload Doc A"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDocA('')}
                className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--muted)] cursor-pointer"
                title="Clear Doc A"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            rows={6}
            value={docA}
            onChange={(e) => setDocA(e.target.value)}
            placeholder="Paste original EDI document (Doc A) here..."
            className="w-full p-2.5 font-mono text-xs rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none"
            style={{ borderColor: 'var(--line)' }}
          />
        </div>

        {/* Document B (Revision) */}
        <div
          className="p-4 rounded-2xl border space-y-2"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" /> Document B (Modified / Revision)
            </span>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputBRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setDocB((ev.target?.result as string) || '');
                    reader.readAsText(f);
                  }
                }}
                accept=".edi,.x12,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputBRef.current?.click()}
                className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--muted)] cursor-pointer"
                title="Upload Doc B"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDocB('')}
                className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--muted)] cursor-pointer"
                title="Clear Doc B"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            rows={6}
            value={docB}
            onChange={(e) => setDocB(e.target.value)}
            placeholder="Paste revised EDI document (Doc B) here..."
            className="w-full p-2.5 font-mono text-xs rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none"
            style={{ borderColor: 'var(--line)' }}
          />
        </div>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border bg-[var(--surface)] text-center" style={{ borderColor: 'var(--line)' }}>
          <div className="text-xs font-semibold text-[var(--muted)]">Segments (A / B)</div>
          <div className="text-lg font-bold font-mono text-[var(--ink)] mt-0.5">
            {diffAnalysis.stats.totalA} / {diffAnalysis.stats.totalB}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-center">
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Added Segments</div>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-300 mt-0.5">
            +{diffAnalysis.stats.added}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-rose-500/10 border-rose-500/30 text-center">
          <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">Removed Segments</div>
          <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-300 mt-0.5">
            -{diffAnalysis.stats.removed}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-center">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">Modified Segments</div>
          <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-300 mt-0.5">
            Δ {diffAnalysis.stats.modified}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-[var(--surface)] text-center col-span-2 sm:col-span-1" style={{ borderColor: 'var(--line)' }}>
          <div className="text-xs font-semibold text-[var(--muted)]">Identical Match</div>
          <div className="text-lg font-bold font-mono text-[var(--brand)] mt-0.5">
            {diffAnalysis.stats.matchPct}%
          </div>
        </div>
      </div>

      {/* Semantic Diff Visualizer */}
      <div
        className="p-5 rounded-2xl border space-y-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-2">
              <GitCompare className="w-4 h-4" />
              Semantic Diff Inspection
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Color-coded segments and highlighted granular element mutations.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Added
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Removed
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Modified
            </span>
          </div>
        </div>

        {diffAnalysis.rows.length === 0 ? (
          <div className="p-10 text-center text-xs text-[var(--muted)] italic border border-dashed rounded-xl" style={{ borderColor: 'var(--line)' }}>
            Enter or load two EDI documents above to see semantic comparison results.
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-xl" style={{ borderColor: 'var(--line)' }}>
            {viewLayout === 'side-by-side' ? (
              /* SIDE BY SIDE TABLE */
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b bg-[var(--surface-2)] text-[var(--muted)] font-sans" style={{ borderColor: 'var(--line)' }}>
                    <th className="py-2 px-2 w-12 text-right"># A</th>
                    <th className="py-2 px-3 border-r" style={{ borderColor: 'var(--line)' }}>Original Segment (Doc A)</th>
                    <th className="py-2 px-2 w-12 text-right"># B</th>
                    <th className="py-2 px-3">Revised Segment (Doc B)</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]" style={{ borderColor: 'var(--line)' }}>
                  {diffAnalysis.rows.map((r) => {
                    const isAdded = r.status === 'added';
                    const isRemoved = r.status === 'removed';
                    const isMod = r.status === 'modified';

                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors ${
                          isAdded
                            ? 'bg-emerald-500/10'
                            : isRemoved
                            ? 'bg-rose-500/10'
                            : isMod
                            ? 'bg-amber-500/10'
                            : 'hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        {/* Doc A Cell */}
                        <td className="py-1.5 px-2 text-right text-[var(--muted)] select-none">
                          {r.lineA || ''}
                        </td>
                        <td className={`py-1.5 px-3 border-r break-all ${isRemoved ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}`} style={{ borderColor: 'var(--line)' }}>
                          {r.segA || <span className="text-[var(--muted)] italic">&mdash;</span>}
                        </td>

                        {/* Doc B Cell */}
                        <td className="py-1.5 px-2 text-right text-[var(--muted)] select-none">
                          {r.lineB || ''}
                        </td>
                        <td className={`py-1.5 px-3 break-all ${isAdded ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                          {isMod && r.elementDiffs ? (
                            <div>
                              <span>{r.tag}</span>
                              {r.elementDiffs.map((e) => (
                                <React.Fragment key={e.index}>
                                  <span className="text-[var(--muted)]">*</span>
                                  <span
                                    className={`px-1 py-0.5 rounded ${
                                      e.isChanged
                                        ? 'bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold underline'
                                        : 'text-[var(--ink)]'
                                    }`}
                                    title={e.isChanged ? `${e.label}: was "${e.valA}", now "${e.valB}"` : undefined}
                                  >
                                    {e.valB || ' '}
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>
                          ) : (
                            r.segB || <span className="text-[var(--muted)] italic">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* UNIFIED TABLE */
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b bg-[var(--surface-2)] text-[var(--muted)] font-sans" style={{ borderColor: 'var(--line)' }}>
                    <th className="py-2 px-2 w-8 text-center">&plusmn;</th>
                    <th className="py-2 px-2 w-12 text-right">Line</th>
                    <th className="py-2 px-3">Segment Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]" style={{ borderColor: 'var(--line)' }}>
                  {diffAnalysis.rows.map((r) => {
                    if (r.status === 'identical') {
                      return (
                        <tr key={r.id} className="hover:bg-[var(--surface-2)] text-[var(--muted)]">
                          <td className="py-1 px-2 text-center select-none">&nbsp;</td>
                          <td className="py-1 px-2 text-right select-none">{r.lineB || r.lineA}</td>
                          <td className="py-1 px-3 break-all">{r.segB || r.segA}</td>
                        </tr>
                      );
                    }
                    if (r.status === 'removed') {
                      return (
                        <tr key={r.id} className="bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <td className="py-1.5 px-2 text-center font-bold select-none">-</td>
                          <td className="py-1.5 px-2 text-right select-none">{r.lineA}</td>
                          <td className="py-1.5 px-3 break-all font-semibold">{r.segA}</td>
                        </tr>
                      );
                    }
                    if (r.status === 'added') {
                      return (
                        <tr key={r.id} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <td className="py-1.5 px-2 text-center font-bold select-none">+</td>
                          <td className="py-1.5 px-2 text-right select-none">{r.lineB}</td>
                          <td className="py-1.5 px-3 break-all font-semibold">{r.segB}</td>
                        </tr>
                      );
                    }
                    // Modified: show - then +
                    return (
                      <React.Fragment key={r.id}>
                        <tr className="bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <td className="py-1 px-2 text-center font-bold select-none">-</td>
                          <td className="py-1 px-2 text-right select-none">{r.lineA}</td>
                          <td className="py-1 px-3 break-all">{r.segA}</td>
                        </tr>
                        <tr className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <td className="py-1 px-2 text-center font-bold select-none">+</td>
                          <td className="py-1 px-2 text-right select-none">{r.lineB}</td>
                          <td className="py-1 px-3 break-all font-semibold">
                            {r.elementDiffs ? (
                              <div>
                                <span>{r.tag}</span>
                                {r.elementDiffs.map((e) => (
                                  <React.Fragment key={e.index}>
                                    <span className="text-[var(--muted)]">*</span>
                                    <span
                                      className={`px-1 py-0.5 rounded ${
                                        e.isChanged
                                          ? 'bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold underline'
                                          : ''
                                      }`}
                                    >
                                      {e.valB || ' '}
                                    </span>
                                  </React.Fragment>
                                ))}
                              </div>
                            ) : (
                              r.segB
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
