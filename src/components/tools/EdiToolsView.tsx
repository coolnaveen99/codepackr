import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Table,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  FileCode2,
  Send,
  Trash2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { EdiAckGenerator } from '../edi/EdiAckGenerator';
import { JsonToEdiConverter } from '../edi/JsonToEdiConverter';
import { EdiTemplateGenerator } from '../edi/EdiTemplateGenerator';
import { EdiDelimiterCleaner } from '../edi/EdiDelimiterCleaner';
import { As2ToolsView } from '../edi/As2ToolsView';
import { COMPREHENSIVE_SEGMENT_DICTIONARY, EDI_TRANSACTIONS } from '../../data/ediDictionary';
import { TOOLS } from '../../data/tools';

const SEGMENT_NAMES: Record<string, string> = COMPREHENSIVE_SEGMENT_DICTIONARY;

const ENVELOPE_ELEMENT_NAMES: Record<string, string[]> = {
  ISA: [
    'Authorization Information Qualifier',
    'Authorization Information',
    'Security Information Qualifier',
    'Security Information',
    'Interchange ID Qualifier',
    'Interchange Sender ID',
    'Interchange ID Qualifier',
    'Interchange Receiver ID',
    'Interchange Date (YYMMDD)',
    'Interchange Time (HHMM)',
    'Repetition Separator',
    'Interchange Control Version',
    'Interchange Control Number',
    'Acknowledgment Requested',
    'Usage Indicator (P=Prod, T=Test)',
    'Component Element Separator',
  ],
  GS: [
    'Functional Identifier Code',
    'Application Sender Code',
    'Application Receiver Code',
    'Date (CCYYMMDD)',
    'Time (HHMM[SS])',
    'Group Control Number',
    'Responsible Agency Code',
    'Version / Release / Industry ID Code',
  ],
  ST: [
    'Transaction Set Identifier Code',
    'Transaction Set Control Number',
    'Implementation Convention Reference',
  ],
  SE: [
    'Number of Included Segments',
    'Transaction Set Control Number',
  ],
  GE: [
    'Number of Transaction Sets Included',
    'Group Control Number',
  ],
  IEA: [
    'Number of Included Functional Groups',
    'Interchange Control Number',
  ],
};

const SAMPLE_850 = `ISA*00*          *00*          *ZZ*ACMESUPPLY     *ZZ*GLOBALBUYER    *260903*1430*U*00401*000000001*0*P*>~
GS*PO*ACMESUPPLY*GLOBALBUYER*20260903*1430*1*X*004010~
ST*850*0001~
BEG*00*NE*PO-987654**20260903~
CUR*BY*USD~
REF*DP*014~
PER*BD*JANE DOE*TE*555-0199*EM*jane@globalbuyer.com~
N1*ST*EAST DISTRIBUTION CENTER*92*104~
N3*450 INDUSTRIAL PARKWAY~
N4*NEW YORK*NY*10001*US~
N1*BT*GLOBAL BUYER HQ*91*HQ01~
N3*100 WALL STREET 22ND FL~
N4*NEW YORK*NY*10005*US~
PO1*1*50*EA*18.50**VN*PROD-A101*UP*012345678901~
PID*F****PREMIUM COTTON T-SHIRT L~
PO1*2*100*EA*12.00**VN*PROD-B202*UP*012345678902~
PID*F****CANVAS WORK TOTE BAG~
CTT*2*150~
SE*17*0001~
GE*1*1~
IEA*1*000000001~`;

interface ParsedSegment {
  id: string;
  tag: string;
  name: string;
  elements: string[];
  raw: string;
  lineNumber: number;
  level: number;
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  segment?: string;
}

interface EdiToolsViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const EdiToolsView: React.FC<EdiToolsViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>(tool.id);
  const [input, setInput] = useState<string>(initialInput || SAMPLE_850);
  const [output, setOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [expandedSegment, setExpandedSegment] = useState<number | null>(0);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('850');

  // Delimiters
  const [segmentTerminator, setSegmentTerminator] = useState<string>('~');
  const [elementSeparator, setElementSeparator] = useState<string>('*');
  const [subElementSeparator, setSubElementSeparator] = useState<string>('>');
  const [indentOutput, setIndentOutput] = useState<boolean>(true);

  // Sync activeTab when URL or tool navigation changes
  useEffect(() => {
    setActiveTab(tool.id);
  }, [tool.id]);

  // Find the exact tool definition for the currently active subtab
  const currentActiveToolDef = useMemo(() => {
    return TOOLS.find((t) => t.id === activeTab) || tool;
  }, [activeTab, tool]);

  const loadTransactionSample = (txId: string) => {
    const found = EDI_TRANSACTIONS.find((t) => t.id === txId);
    if (!found) return;
    setSelectedSampleId(txId);
    setInput(found.samplePayload);
    if (found.standard === 'EDIFACT') {
      setSegmentTerminator("'");
      setElementSeparator('+');
      setSubElementSeparator(':');
    } else {
      setSegmentTerminator('~');
      setElementSeparator('*');
      setSubElementSeparator('>');
    }
  };

  const autoDetectDelimiters = () => {
    const trimmed = input.trim();
    if (trimmed.startsWith('ISA') && trimmed.length >= 106) {
      const elemSep = trimmed[3];
      const compSep = trimmed[104];
      const segTerm = trimmed[105];
      setElementSeparator(elemSep);
      setSubElementSeparator(compSep);
      if (segTerm && !/\s/.test(segTerm)) {
        setSegmentTerminator(segTerm);
      } else {
        setSegmentTerminator('~');
      }
    }
  };

  const parsedSegments = useMemo<ParsedSegment[]>(() => {
    if (!input) return [];
    let rawSegs: string[] = [];
    const term = segmentTerminator || '~';
    if (term === '\n') {
      rawSegs = input.split(/\r?\n/);
    } else {
      rawSegs = input.split(term);
    }
    const segments: ParsedSegment[] = [];
    let currentLevel = 0;
    rawSegs.forEach((seg, idx) => {
      const cleaned = seg.trim();
      if (!cleaned) return;
      const elements = cleaned.split(elementSeparator);
      const tag = elements[0].trim().toUpperCase();
      const name = SEGMENT_NAMES[tag] || 'User Data Segment';

      if (tag === 'ISA') currentLevel = 0;
      else if (tag === 'GS') currentLevel = 1;
      else if (tag === 'ST') currentLevel = 2;
      else if (tag === 'HL') currentLevel = 3;
      else if (tag === 'SE') currentLevel = 2;
      else if (tag === 'GE') currentLevel = 1;
      else if (tag === 'IEA') currentLevel = 0;

      segments.push({
        id: `${tag}-${idx}`,
        tag,
        name,
        elements: elements.slice(1),
        raw: cleaned,
        lineNumber: idx + 1,
        level: currentLevel,
      });
    });
    return segments;
  }, [input, segmentTerminator, elementSeparator]);

  const validationIssues = useMemo<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = [];
    if (!input.trim()) {
      return [{ type: 'info', message: 'Enter or load an EDI document to validate.' }];
    }
    const segments = parsedSegments;
    if (segments.length === 0) {
      return [{ type: 'error', message: 'No valid EDI segments detected with current delimiters.' }];
    }
    const isa = segments.find((s) => s.tag === 'ISA');
    const iea = segments.find((s) => s.tag === 'IEA');
    const gs = segments.find((s) => s.tag === 'GS');
    const ge = segments.find((s) => s.tag === 'GE');
    const stList = segments.filter((s) => s.tag === 'ST');
    const seList = segments.filter((s) => s.tag === 'SE');

    if (!isa) {
      issues.push({ type: 'error', message: 'Missing mandatory Interchange Header (ISA).' });
    } else if (isa.elements.length !== 16) {
      issues.push({
        type: 'warning',
        message: `ISA segment has ${isa.elements.length} elements. Standard ANSI X12 requires exactly 16 elements.`,
        line: isa.lineNumber,
        segment: 'ISA',
      });
    }
    if (!iea) {
      issues.push({ type: 'error', message: 'Missing mandatory Interchange Trailer (IEA).' });
    } else if (isa && iea) {
      const isaCtrl = isa.elements[12]?.trim();
      const ieaCtrl = iea.elements[1]?.trim();
      if (isaCtrl && ieaCtrl && isaCtrl !== ieaCtrl) {
        issues.push({
          type: 'error',
          message: `Interchange Control Number mismatch: ISA13 (${isaCtrl}) != IEA02 (${ieaCtrl}).`,
          line: iea.lineNumber,
          segment: 'IEA',
        });
      }
    }

    if (!gs && isa) {
      issues.push({ type: 'warning', message: 'No Functional Group Header (GS) found.' });
    }
    if (gs && !ge) {
      issues.push({ type: 'error', message: 'Missing Functional Group Trailer (GE).' });
    } else if (gs && ge) {
      const gsCtrl = gs.elements[5]?.trim();
      const geCtrl = ge.elements[1]?.trim();
      if (gsCtrl && geCtrl && gsCtrl !== geCtrl) {
        issues.push({
          type: 'error',
          message: `Functional Group Control Number mismatch: GS06 (${gsCtrl}) != GE02 (${geCtrl}).`,
          line: ge.lineNumber,
          segment: 'GE',
        });
      }
    }

    if (stList.length !== seList.length) {
      issues.push({
        type: 'error',
        message: `Transaction Set Header/Trailer count mismatch: found ${stList.length} ST and ${seList.length} SE.`,
      });
    }

    if (issues.length === 0) {
      issues.push({
        type: 'info',
        message: 'All envelope pairing, control numbers, and segment counts passed validation successfully!',
      });
    }
    return issues;
  }, [input, parsedSegments]);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }
    if (activeTab === 'edi-formatter') {
      const term = segmentTerminator || '~';
      const lines = parsedSegments.map((seg) => {
        const indent = indentOutput ? '  '.repeat(seg.level) : '';
        return `${indent}${seg.raw}${term}`;
      });
      setOutput(lines.join('\n'));
    } else if (activeTab === 'edi-to-json') {
      try {
        const interchange: Record<string, any> = {
          format: 'ANSI_X12',
          delimiters: {
            segment: segmentTerminator,
            element: elementSeparator,
            subElement: subElementSeparator,
          },
          totalSegments: parsedSegments.length,
          functionalGroups: [] as any[],
        };
        setOutput(JSON.stringify(interchange, null, 2));
      } catch (err: any) {
        setOutput(`Error parsing EDI: ${err.message}`);
      }
    }
  }, [input, activeTab, parsedSegments, segmentTerminator, elementSeparator, subElementSeparator, indentOutput]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setInput(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredSegments = useMemo(() => {
    if (!filterQuery.trim()) return parsedSegments;
    const q = filterQuery.toLowerCase();
    return parsedSegments.filter(
      (s) =>
        s.tag.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.elements.some((e) => e.toLowerCase().includes(q))
    );
  }, [parsedSegments, filterQuery]);

  return (
    <div className="space-y-6">
      {/* SINGLE UNIFIED TOP HEADER: Dynamic to current tab */}
      <ToolHeader tool={currentActiveToolDef} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Sub-tools Navigation Tabs */}
      <div
        className="flex items-center gap-2 border-b overflow-x-auto pb-2"
        style={{ borderColor: 'var(--line)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {[
          { id: 'edi-formatter', label: 'EDI Formatter & Indenter', icon: Sparkles },
          { id: 'edi-segment-viewer', label: 'EDI Segment & Element Viewer', icon: Table },
          { id: 'edi-to-json', label: 'EDI to JSON Converter', icon: ArrowLeftRight },
          { id: 'json-to-edi', label: 'JSON to EDI Converter', icon: FileCode2 },
          { id: 'edi-validator', label: 'EDI Compliance Validator', icon: ShieldCheck },
          { id: 'edi-997-generator', label: '997 & CONTRL Ack Generator', icon: CheckCircle2 },
          { id: 'edi-sample-generator', label: 'Template & Sample Generator', icon: FileText },
          { id: 'edi-delimiter-converter', label: 'Delimiter Swapper & Normalizer', icon: SlidersHorizontal },
          { id: 'as2-tools', label: 'AS2 Encoder, Decoder & MDN', icon: Send },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                const targetTool = TOOLS.find((t) => t.id === tab.id);
                if (targetTool) {
                  window.history.pushState({}, '', `/${targetTool.id}`);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive ? 'shadow-sm' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--brand)' : 'var(--surface)',
                color: isActive ? '#ffffff' : 'var(--muted)',
                border: isActive ? '1px solid var(--brand)' : '1px solid var(--line)',
              }}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Delimiter & Sample Controls Bar for core viewer/formatter/validator */}
      {['edi-formatter', 'edi-segment-viewer', 'edi-to-json', 'edi-validator'].includes(activeTab) && (
        <div
          className="p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--muted)]">Load Transaction:</span>
            <select
              aria-label="Load EDI Sample Document"
              value={selectedSampleId}
              onChange={(e) => loadTransactionSample(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border font-medium text-xs outline-none cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {Array.from(new Set(EDI_TRANSACTIONS.map((t) => t.category))).map((category) => (
                <optgroup key={category} label={category}>
                  {EDI_TRANSACTIONS.filter((t) => t.category === category).map((tx) => (
                    <option key={tx.id} value={tx.id}>
                      {tx.code} – {tx.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 flex-wrap border-t lg:border-t-0 pt-2 lg:pt-0" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--muted)]">Segment:</span>
              <input
                type="text"
                value={segmentTerminator}
                onChange={(e) => setSegmentTerminator(e.target.value)}
                className="w-10 px-2 py-1 rounded-md border text-center font-mono"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--muted)]">Element:</span>
              <input
                type="text"
                value={elementSeparator}
                onChange={(e) => setElementSeparator(e.target.value)}
                className="w-10 px-2 py-1 rounded-md border text-center font-mono"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
            <button
              onClick={autoDetectDelimiters}
              className="px-2.5 py-1 rounded-lg border font-medium hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--brand)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Auto-detect</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      {activeTab === 'edi-formatter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl border flex flex-col space-y-3" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>Raw EDI Input</span>
              <button onClick={() => setInput('')} className="hover:opacity-80 text-[var(--muted)]">Clear</button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={16}
              className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
          <div className="p-4 rounded-2xl border flex flex-col space-y-3" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>Formatted EDI Output</span>
              <button
                onClick={() => handleCopy(output)}
                className="px-2.5 py-1 rounded-lg border flex items-center gap-1 hover:opacity-80"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              rows={16}
              className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
        </div>
      )}

      {activeTab === 'edi-segment-viewer' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter segments..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs border outline-none font-medium"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>
          <div className="rounded-2xl border divide-y overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
            {filteredSegments.map((seg, idx) => (
              <div key={seg.id} className="p-3.5 text-xs font-mono">
                #{seg.lineNumber} [{seg.tag}] {seg.name} - {seg.raw}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'edi-to-json' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={16}
            className="w-full p-3.5 rounded-xl font-mono text-xs border"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
          <textarea
            readOnly
            value={output}
            rows={16}
            className="w-full p-3.5 rounded-xl font-mono text-xs border"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      )}

      {activeTab === 'edi-validator' && (
        <div className="space-y-4">
          <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
            {validationIssues.map((issue, idx) => (
              <div key={idx} className="text-xs py-1">
                [{issue.type}] {issue.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tools wrapped in a container that suppresses internal duplicate ToolHeaders */}
      <div className="[&>div>div:first-child]:hidden">
        {activeTab === 'json-to-edi' && (
          <JsonToEdiConverter tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />
        )}
        {activeTab === 'edi-997-generator' && (
          <EdiAckGenerator tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} initialInput={input} />
        )}
        {activeTab === 'edi-sample-generator' && (
          <EdiTemplateGenerator tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />
        )}
        {activeTab === 'edi-delimiter-converter' && (
          <EdiDelimiterCleaner tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} initialInput={input} />
        )}
        {activeTab === 'as2-tools' && (
          <As2ToolsView tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} initialInput={input} />
        )}
      </div>
    </div>
  );
};