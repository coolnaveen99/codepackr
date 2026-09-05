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

// Standard ANSI X12 and EDIFACT segment dictionary
const SEGMENT_NAMES: Record<string, string> = COMPREHENSIVE_SEGMENT_DICTIONARY;

// Known element descriptions for critical envelope and header segments
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
  BEG: [
    'Transaction Set Purpose Code',
    'Purchase Order Type Code',
    'Purchase Order Number',
    'Release Number',
    'Date (CCYYMMDD)',
  ],
  BCH: [
    'Transaction Set Purpose Code (04=Change)',
    'Purchase Order Type Code',
    'Purchase Order Number',
    'Release Number',
    'Date (CCYYMMDD)',
    'Contract Number',
    'Reference Number',
    'Change Order Sequence Number',
    'Change Date (CCYYMMDD)',
  ],
  BSN: [
    'Transaction Set Purpose Code (00=Original)',
    'Shipment Identification (Ship Notice / ASN)',
    'Date (CCYYMMDD)',
    'Time (HHMM[SS])',
    'Hierarchical Structure Code (0001=SOPI)',
  ],
  POC: [
    'Assigned Identification (Line #)',
    'Change Type Code (CA=Change, DI=Delete, AI=Add)',
    'Quantity Ordered (Revised)',
    'Quantity Left to Receive',
    'Unit or Basis for Measurement Code',
    'Unit Price',
    'Basis of Unit Price Code',
    'Product/Service ID Qualifier (VN=Vendor Part)',
    'Product/Service ID',
    'Product/Service ID Qualifier (UP=UPC)',
    'Product/Service ID',
  ],
  HL: [
    'Hierarchical ID Number',
    'Hierarchical Parent ID Number',
    'Hierarchical Level Code (S=Shipment, O=Order, P=Pack, I=Item)',
    'Hierarchical Child Code',
  ],
  BIG: [
    'Invoice Date',
    'Invoice Number',
    'Purchase Order Date',
    'Purchase Order Number',
  ],
  N1: [
    'Entity Identifier Code (BT=BillTo, ST=ShipTo, VN=Vendor, SF=ShipFrom)',
    'Name',
    'Identification Code Qualifier',
    'Identification Code',
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

const SAMPLE_810 = `ISA*00*          *00*          *ZZ*SELLERCO       *ZZ*BUYERCO        *260903*1600*U*00401*000045812*0*P*>~
GS*IN*SELLERCO*BUYERCO*20260903*1600*45812*X*004010~
ST*810*0001~
BIG*20260903*INV-2026-8819*20260828*PO-987654~
CUR*SE*USD~
N1*RE*SELLER REMIT TO*91*REMIT1~
N3*PO BOX 500~
N4*DALLAS*TX*75201~
N1*BT*BUYER CORPORATE*92*BUY01~
N3*100 WALL STREET~
N4*NEW YORK*NY*10005~
ITD*01*3*2**10*20260913*30~
IT1*1*50*EA*18.50**VN*PROD-A101~
PID*F****PREMIUM COTTON T-SHIRT L~
IT1*2*100*EA*12.00**VN*PROD-B202~
PID*F****CANVAS WORK TOTE BAG~
TDS*212500~
CTT*2~
SE*16*0001~
GE*1*45812~
IEA*1*000045812~`;

const SAMPLE_997 = `ISA*00*          *00*          *ZZ*RECEIVER       *ZZ*SENDER         *260903*1615*U*00401*000000099*0*P*>~
GS*FA*RECEIVER*SENDER*20260903*1615*99*X*004010~
ST*997*0001~
AK1*PO*1~
AK2*850*0001~
AK5*A~
AK9*A*1*1*1~
SE*6*0001~
GE*1*99~
IEA*1*000000099~`;

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

  // Sync activeTab if tool prop changes
  useEffect(() => {
    setActiveTab(tool.id);
  }, [tool.id]);

  // Load a transaction sample and auto-configure standard delimiters
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

  // Auto-detect delimiters from raw EDI input (ISA standard: element sep at index 3, terminator at 105 or end of ISA)
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

  // Parse EDI into structured segments
  const parsedSegments = useMemo<ParsedSegment[]>(() => {
    if (!input) return [];

    let rawSegs: string[] = [];
    const term = segmentTerminator || '~';

    if (term === '\n') {
      rawSegs = input.split(/\r?\n/);
    } else {
      // Split by terminator, taking care if newlines follow terminator
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

      // Hierarchy calculation
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

  // Validation Engine
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

    // 1. Interchange Envelope (ISA/IEA)
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

    // 2. Functional Group Envelope (GS/GE)
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

    // 3. Transaction Set (ST/SE)
    if (stList.length !== seList.length) {
      issues.push({
        type: 'error',
        message: `Transaction Set Header/Trailer count mismatch: found ${stList.length} ST and ${seList.length} SE.`,
      });
    }

    stList.forEach((st, idx) => {
      const se = seList[idx];
      if (se) {
        const stCtrl = st.elements[1]?.trim();
        const seCtrl = se.elements[1]?.trim();
        if (stCtrl && seCtrl && stCtrl !== seCtrl) {
          issues.push({
            type: 'error',
            message: `Transaction Set Control Number mismatch: ST02 (${stCtrl}) != SE02 (${seCtrl}).`,
            line: se.lineNumber,
            segment: 'SE',
          });
        }

        // Count segments between ST and SE inclusive
        const stIndex = segments.findIndex((s) => s === st);
        const seIndex = segments.findIndex((s) => s === se);
        if (stIndex !== -1 && seIndex !== -1 && seIndex >= stIndex) {
          const actualCount = seIndex - stIndex + 1;
          const declaredCount = parseInt(se.elements[0], 10);
          if (!isNaN(declaredCount) && declaredCount !== actualCount) {
            issues.push({
              type: 'error',
              message: `Segment count mismatch in SE01: declared ${declaredCount}, but actual count between ST and SE is ${actualCount}.`,
              line: se.lineNumber,
              segment: 'SE',
            });
          }
        }
      }
    });

    if (issues.length === 0) {
      issues.push({
        type: 'info',
        message: 'All envelope pairing, control numbers, and segment counts passed validation successfully!',
      });
    }

    return issues;
  }, [input, parsedSegments]);

  // Execute active tool action
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    if (activeTab === 'edi-formatter') {
      // Format EDI with clean line wraps and indentation
      const term = segmentTerminator || '~';
      const lines = parsedSegments.map((seg) => {
        const indent = indentOutput ? '  '.repeat(seg.level) : '';
        return `${indent}${seg.raw}${term}`;
      });
      setOutput(lines.join('\n'));
    } else if (activeTab === 'edi-to-json') {
      // Convert EDI to JSON structure
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

        let currentGroup: any = null;
        let currentTransaction: any = null;

        parsedSegments.forEach((seg) => {
          if (seg.tag === 'ISA') {
            interchange.sender = seg.elements[5];
            interchange.receiver = seg.elements[7];
            interchange.date = seg.elements[8];
            interchange.time = seg.elements[9];
            interchange.controlNumber = seg.elements[12];
          } else if (seg.tag === 'GS') {
            currentGroup = {
              code: seg.elements[0],
              sender: seg.elements[1],
              receiver: seg.elements[2],
              controlNumber: seg.elements[5],
              transactionSets: [],
            };
            interchange.functionalGroups.push(currentGroup);
          } else if (seg.tag === 'ST') {
            currentTransaction = {
              code: seg.elements[0],
              controlNumber: seg.elements[1],
              segments: [],
            };
            if (currentGroup) {
              currentGroup.transactionSets.push(currentTransaction);
            }
          } else if (seg.tag === 'SE') {
            if (currentTransaction) {
              currentTransaction.declaredSegments = parseInt(seg.elements[0], 10);
            }
            currentTransaction = null;
          } else if (seg.tag === 'GE') {
            currentGroup = null;
          } else {
            const segObj = {
              tag: seg.tag,
              name: seg.name,
              elements: seg.elements,
            };
            if (currentTransaction) {
              currentTransaction.segments.push(segObj);
            } else if (currentGroup) {
              if (!currentGroup.segments) currentGroup.segments = [];
              currentGroup.segments.push(segObj);
            } else {
              if (!interchange.orphanSegments) interchange.orphanSegments = [];
              interchange.orphanSegments.push(segObj);
            }
          }
        });

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

  const handleExportSegmentsCsv = () => {
    if (parsedSegments.length === 0) return;
    const rows: string[] = ['"Line","Tag","Name","ElementCount","RawSegment"'];
    parsedSegments.forEach((s) => {
      rows.push(
        `"${s.lineNumber}","${s.tag}","${s.name.replace(/"/g, '""')}","${s.elements.length}","${s.raw.replace(/"/g, '""')}"`
      );
    });
    handleDownload(rows.join('\n'), `edi_segments_${selectedSampleId}.csv`);
  };

  const handleExportSegmentsJson = () => {
    if (parsedSegments.length === 0) return;
    const json = JSON.stringify(parsedSegments, null, 2);
    handleDownload(json, `edi_segments_${selectedSampleId}.json`);
  };

  const handleExportValidationReport = () => {
    const lines: string[] = [
      '==================================================',
      '         EDI COMPLIANCE VALIDATION REPORT         ',
      '==================================================',
      `Timestamp: ${new Date().toISOString()}`,
      `Selected Sample: ${selectedSampleId}`,
      `Total Segments Parsed: ${parsedSegments.length}`,
      `Delimiters: Segment='${segmentTerminator}' Element='${elementSeparator}' Sub-Elem='${subElementSeparator}'`,
      '',
      'SUMMARY:',
      `  Errors:   ${validationIssues.filter((i) => i.type === 'error').length}`,
      `  Warnings: ${validationIssues.filter((i) => i.type === 'warning').length}`,
      `  Info:     ${validationIssues.filter((i) => i.type === 'info').length}`,
      '',
      'FINDINGS:',
    ];
    validationIssues.forEach((issue, idx) => {
      lines.push(`[${issue.type.toUpperCase()}] #${idx + 1}: ${issue.message}`);
      if (issue.line) lines.push(`   At line ${issue.line} (${issue.segment || 'segment'})`);
    });
    handleDownload(lines.join('\n'), `edi_validation_report_${selectedSampleId}.txt`);
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
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

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
              onClick={() => setActiveTab(tab.id)}
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
        {/* Sample Selectors */}
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
                    {tx.code} — {tx.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Active Standard Indicator Badge */}
          {(() => {
            const currentTx = EDI_TRANSACTIONS.find((t) => t.id === selectedSampleId);
            if (!currentTx) return null;
            return (
              <span
                className="px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold border"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--line)',
                  color: currentTx.standard === 'EDIFACT' ? '#d97706' : 'var(--brand)',
                }}
              >
                {currentTx.standard} • {currentTx.functionalGroup}
              </span>
            );
          })()}

          <div className="hidden sm:block h-4 w-px bg-[var(--line)] mx-1" />

          {/* Quick Presets (Synchronized with dropdown) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[var(--muted)] hidden sm:inline">Quick:</span>
            {[
              { id: '850', label: '850 PO' },
              { id: '860', label: '860 Change' },
              { id: '856', label: '856 ASN' },
              { id: '810', label: '810 Inv' },
              { id: '997', label: '997 Ack' },
            ].map((preset) => {
              const isPresetActive = selectedSampleId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => loadTransactionSample(preset.id)}
                  className={`px-2 py-1 rounded-lg border font-medium text-xs transition-all cursor-pointer ${
                    isPresetActive
                      ? 'border-[var(--brand)] text-[var(--brand)] font-semibold shadow-xs'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isPresetActive ? 'var(--surface-2)' : 'var(--bg)',
                    borderColor: isPresetActive ? 'var(--brand)' : 'var(--line)',
                    color: isPresetActive ? 'var(--brand)' : 'var(--ink)',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}

            {/* Clear Input Document Button */}
            <button
              onClick={() => setInput('')}
              disabled={!input}
              className="px-2.5 py-1 rounded-lg border font-medium text-xs transition-all cursor-pointer flex items-center gap-1 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed ml-1"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--muted)' }}
              title="Clear EDI input payload"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Delimiter Settings */}
        <div className="flex items-center gap-3 flex-wrap border-t lg:border-t-0 pt-2 lg:pt-0" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--muted)]">Segment:</span>
            <input
              type="text"
              value={segmentTerminator}
              onChange={(e) => setSegmentTerminator(e.target.value)}
              className="w-10 px-2 py-1 rounded-md border text-center font-mono"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              title="Segment Terminator"
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
              title="Element Separator"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--muted)]">Sub-Elem:</span>
            <input
              type="text"
              value={subElementSeparator}
              onChange={(e) => setSubElementSeparator(e.target.value)}
              className="w-10 px-2 py-1 rounded-md border text-center font-mono"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              title="Sub-element / Component Separator"
            />
          </div>
          <button
            onClick={autoDetectDelimiters}
            className="px-2.5 py-1 rounded-lg border font-medium hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--brand)' }}
            title="Auto-detect from ISA or UNA header"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Auto-detect</span>
          </button>
        </div>
      </div>
      )}

      {/* Main Workspace based on Active Tab */}
      {activeTab === 'edi-formatter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div
            className="p-4 rounded-2xl border flex flex-col space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                Raw EDI Input
              </span>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer hover:opacity-80 flex items-center gap-1 text-[var(--muted)]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .edi/.txt</span>
                  <input type="file" accept=".edi,.txt,.x12" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={() => setInput('')}
                  className="hover:opacity-80 text-[var(--muted)]"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste raw ANSI X12 or EDIFACT string here (e.g. ISA*00*...~GS*...)"
              rows={16}
              className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border transition-colors"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          {/* Output Panel */}
          <div
            className="p-4 rounded-2xl border flex flex-col space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                  Formatted EDI Output
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={indentOutput}
                    onChange={(e) => setIndentOutput(e.target.checked)}
                    className="rounded"
                  />
                  <span>Smart loop indent</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(output)}
                  className="px-2.5 py-1 rounded-lg border flex items-center gap-1 hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => handleDownload(output, `formatted_${selectedSampleId}.edi`)}
                  className="px-2.5 py-1 rounded-lg border flex items-center gap-1 hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
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
          {/* Search filter & Export Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter by segment tag (e.g. ISA, N1, PO1) or element value..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs border outline-none font-medium"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-2.5 text-[var(--muted)] hover:opacity-80 p-0.5 cursor-pointer"
                  title="Clear filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="text-xs text-[var(--muted)]">
                Showing {filteredSegments.length} of {parsedSegments.length} segments
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportSegmentsCsv}
                  disabled={parsedSegments.length === 0}
                  className="px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 disabled:opacity-40 cursor-pointer shadow-xs"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  title="Export parsed segments to CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleExportSegmentsJson}
                  disabled={parsedSegments.length === 0}
                  className="px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 disabled:opacity-40 cursor-pointer shadow-xs"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  title="Export parsed segments structure to JSON"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--brand)]" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Segment Accordion / Table */}
          <div
            className="rounded-2xl border divide-y overflow-hidden"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            {filteredSegments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted)]">
                No segments matched your filter criteria.
              </div>
            ) : (
              filteredSegments.map((seg, idx) => {
                const isExpanded = expandedSegment === idx;
                const elementDescriptions = ENVELOPE_ELEMENT_NAMES[seg.tag];
                return (
                  <div key={seg.id} className="transition-colors">
                    <button
                      onClick={() => setExpandedSegment(isExpanded ? null : idx)}
                      className="w-full p-3.5 flex items-center justify-between text-left hover:opacity-90 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="w-6 text-[10px] font-mono text-[var(--muted)]">
                          #{seg.lineNumber}
                        </span>
                        <span
                          className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs"
                          style={{ backgroundColor: 'rgba(91, 82, 232, 0.12)', color: 'var(--brand)' }}
                        >
                          {seg.tag}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                          {seg.name}
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          ({seg.elements.length} elements)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[var(--muted)] max-w-[200px] sm:max-w-md truncate hidden md:inline">
                          {seg.raw}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        className="p-4 border-t space-y-3"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
                      >
                        <div className="text-[11px] font-mono text-[var(--muted)] break-all">
                          <strong>Raw:</strong> {seg.raw}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                                <th className="py-1.5 px-2 font-medium">Position</th>
                                <th className="py-1.5 px-2 font-medium">Description</th>
                                <th className="py-1.5 px-2 font-medium">Value</th>
                                <th className="py-1.5 px-2 font-medium">Length</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                              {seg.elements.map((elem, elemIdx) => {
                                const posNum = elemIdx + 1;
                                const posTag = `${seg.tag}${posNum < 10 ? '0' + posNum : posNum}`;
                                const desc = elementDescriptions?.[elemIdx] || 'Element Data';
                                return (
                                  <tr key={posTag} className="hover:opacity-80">
                                    <td className="py-1.5 px-2 font-semibold text-[var(--brand)]">{posTag}</td>
                                    <td className="py-1.5 px-2 text-[var(--ink)] font-sans">{desc}</td>
                                    <td className="py-1.5 px-2 text-[var(--ink)] font-bold">
                                      {elem || <span className="text-[var(--muted)] font-normal italic">[empty]</span>}
                                    </td>
                                    <td className="py-1.5 px-2 text-[var(--muted)]">{elem.length}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'edi-to-json' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div
            className="p-4 rounded-2xl border flex flex-col space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                EDI ANSI X12 Input
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInput('')}
                  disabled={!input}
                  className="flex items-center gap-1 hover:opacity-80 text-[var(--muted)] disabled:opacity-40 cursor-pointer"
                  title="Clear EDI input payload"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Clear</span>
                </button>
                <button onClick={() => setInput(SAMPLE_850)} className="hover:opacity-80 text-[var(--brand)] cursor-pointer">
                  Reset Sample
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={16}
              className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          {/* JSON Tree Output */}
          <div
            className="p-4 rounded-2xl border flex flex-col space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                Structured JSON Tree
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(output)}
                  className="px-2.5 py-1 rounded-lg border flex items-center gap-1 hover:opacity-80 cursor-pointer"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => handleDownload(output, `edi_parsed_${selectedSampleId}.json`)}
                  className="px-2.5 py-1 rounded-lg border flex items-center gap-1 hover:opacity-80 cursor-pointer"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
              </div>
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

      {activeTab === 'edi-validator' && (
        <div className="space-y-6">
          {/* Validation Summary Card */}
          <div
            className="p-5 rounded-2xl border flex items-center justify-between gap-4 flex-wrap"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-3">
              {validationIssues.some((i) => i.type === 'error') ? (
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                  {validationIssues.some((i) => i.type === 'error')
                    ? 'EDI Compliance Issues Detected'
                    : 'EDI Document Structure Verified'}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Checked ISA/IEA, GS/GE, and ST/SE envelopes, segment counts, and control numbers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs flex-wrap">
              <span className="px-3 py-1 rounded-full border bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold">
                {validationIssues.filter((i) => i.type === 'error').length} Errors
              </span>
              <span className="px-3 py-1 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold">
                {validationIssues.filter((i) => i.type === 'warning').length} Warnings
              </span>
              <button
                onClick={handleExportValidationReport}
                disabled={!input.trim()}
                className="px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 hover:opacity-80 disabled:opacity-40 cursor-pointer shadow-xs"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                title="Download full compliance validation report"
              >
                <Download className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Validation Issues List */}
          <div
            className="rounded-2xl border divide-y overflow-hidden"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            {validationIssues.map((issue, idx) => {
              const isError = issue.type === 'error';
              const isWarn = issue.type === 'warning';
              return (
                <div key={idx} className="p-4 flex items-start gap-3">
                  {isError ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-xs">
                    <p className={`font-semibold ${isError ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {issue.message}
                    </p>
                    {issue.line && (
                      <p className="text-[var(--muted)] mt-1 font-mono">
                        At line #{issue.line} ({issue.segment})
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editable Test Area for Live Fixing */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                Live Document Editor (Fix &amp; Re-validate)
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setInput('')}
                  disabled={!input}
                  className="flex items-center gap-1 text-[var(--muted)] hover:opacity-80 disabled:opacity-40 text-xs cursor-pointer"
                  title="Clear document"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Clear</span>
                </button>
                <span className="text-[var(--muted)]">{parsedSegments.length} Segments Parsed</span>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
        </div>
      )}

      {/* New EDI Subtools */}
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
  );
};
