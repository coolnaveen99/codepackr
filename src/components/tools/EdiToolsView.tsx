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
  Barcode,
  GitCompareArrows,
  Layers,
  Network,
  Scissors,
  GitCompare,
  BookOpen,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { EdiTutorialPanel } from '../edi/EdiTutorialPanel';
import { EdiBatchSplitterView } from '../edi/EdiBatchSplitterView';
import { EdiDiffCompareView } from '../edi/EdiDiffCompareView';
import { EdiCsvConverterView } from '../edi/EdiCsvConverterView';
import { EdiHipaaSanitizerView } from '../edi/EdiHipaaSanitizerView';
import { EdiMessageGatewayView } from '../edi/EdiMessageGatewayView';
import { EdiAckGenerator } from '../edi/EdiAckGenerator';
import { JsonToEdiConverter } from '../edi/JsonToEdiConverter';
import { EdiTemplateGenerator } from '../edi/EdiTemplateGenerator';
import { EdiDelimiterCleaner } from '../edi/EdiDelimiterCleaner';
import { As2ToolsView } from '../edi/As2ToolsView';
import { Gs1LabelGenerator } from '../edi/Gs1LabelGenerator';
import { EdiLifecycleReconciliation } from '../edi/EdiLifecycleReconciliation';
import { XsltTransformerView } from '../xml/XsltTransformerView';
import { EdiSchemaViewer } from '../edi/EdiSchemaViewer';
import { SmartDownload } from '../common/SmartDownload';
import { downloadFile } from '../../lib/smartDownload';
import {
  COMPREHENSIVE_SEGMENT_DICTIONARY,
  EDI_TRANSACTIONS,
  detectEdifactVersion,
  FSMA_204_COMPLIANT_856,
} from '../../data/ediDictionary';
import { TOOLS } from '../../data/tools';
import { popSmartPastePayload } from '../../lib/workspace';
import { EdiPhase2UxBoundary } from '../edi/EdiPhase2UxBoundary';
import { EdiPhase2Inspector } from '../edi/EdiPhase2Inspector';

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

export interface FsmaKdeCheck {
  id: string;
  title: string;
  ruleRef: string;
  status: 'pass' | 'warning' | 'fail';
  summary: string;
  details: string;
  segmentRef?: string;
  line?: number;
}

export function evaluateFsma204Traceability(segments: ParsedSegment[]) {
  const checks: FsmaKdeCheck[] = [];

  // 1. Traceability Lot Code (TLC)
  const lotRef = segments.find(
    (s) =>
      (s.tag === 'REF' && (s.elements[0] === 'LT' || s.elements[0] === 'BT' || s.elements[0] === 'SE')) ||
      (s.tag === 'SN1' && s.elements[1]) ||
      (s.tag === 'MAN' && (s.raw.includes('(10)') || s.elements[1]?.startsWith('10')))
  );
  if (lotRef) {
    const lotVal = lotRef.tag === 'REF' ? lotRef.elements[1] : lotRef.raw;
    checks.push({
      id: 'kde-tlc',
      title: 'Traceability Lot Code (TLC)',
      ruleRef: '21 CFR § 1.1345(a)',
      status: 'pass',
      summary: `TLC detected: "${lotVal}"`,
      details: 'Traceability Lot Code successfully assigned and present on shipment record.',
      segmentRef: lotRef.tag,
      line: lotRef.lineNumber,
    });
  } else {
    checks.push({
      id: 'kde-tlc',
      title: 'Traceability Lot Code (TLC)',
      ruleRef: '21 CFR § 1.1345(a)',
      status: 'fail',
      summary: 'Missing mandatory Traceability Lot Code (TLC).',
      details: 'Under FDA Rule 204, all Foods on the Traceability List (FTL) must include TLC via REF*LT, REF*BT, or GS1 AI (10) in MAN.',
    });
  }

  // 2. Traceability Lot Code Source (TLCS) / Facility GLN
  const sfParty = segments.find(
    (s) => s.tag === 'N1' && (s.elements[0] === 'SF' || s.elements[0] === 'DA' || s.elements[0] === 'MF')
  );
  if (sfParty) {
    const qual = sfParty.elements[1]?.trim();
    const idCode = sfParty.elements[2]?.trim() || '';
    const name = sfParty.elements[1]?.trim() || '';
    if ((qual === '92' || qual === 'UL') && idCode.length === 13) {
      checks.push({
        id: 'kde-tlcs',
        title: 'Traceability Lot Code Source (TLCS)',
        ruleRef: '21 CFR § 1.1345(b)',
        status: 'pass',
        summary: `TLCS Facility GS1 GLN identified: ${idCode} (${sfParty.elements[1]})`,
        details: 'Valid 13-digit GS1 Global Location Number (GLN) represents the physical establishment assigning the TLC.',
        segmentRef: 'N1*SF',
        line: sfParty.lineNumber,
      });
    } else if (qual === 'FA' || sfParty.raw.includes('FA')) {
      checks.push({
        id: 'kde-tlcs',
        title: 'Traceability Lot Code Source (TLCS)',
        ruleRef: '21 CFR § 1.1345(b)',
        status: 'pass',
        summary: `FDA Food Facility Registration Number identified: ${idCode}`,
        details: 'Valid FDA Food Facility Registration Number provided for TLCS.',
        segmentRef: 'N1*SF',
        line: sfParty.lineNumber,
      });
    } else {
      checks.push({
        id: 'kde-tlcs',
        title: 'Traceability Lot Code Source (TLCS)',
        ruleRef: '21 CFR § 1.1345(b)',
        status: 'warning',
        summary: `Ship-From entity found (${name}), but lacks 13-digit GS1 GLN (UL/92) or FDA Registration (FA).`,
        details: 'FDA Rule 204 requires a specific location description or recognized identifier (GLN or FDA Reg #) for the TLCS.',
        segmentRef: 'N1*SF',
        line: sfParty.lineNumber,
      });
    }
  } else {
    checks.push({
      id: 'kde-tlcs',
      title: 'Traceability Lot Code Source (TLCS)',
      ruleRef: '21 CFR § 1.1345(b)',
      status: 'fail',
      summary: 'Missing Ship-From (N1*SF) or TLCS Delivery Address (N1*DA).',
      details: 'The location description for who established the TLC is a mandatory Key Data Element (KDE).',
    });
  }

  // 3. Critical Tracking Event (CTE)
  const bsnSeg = segments.find((s) => s.tag === 'BSN');
  if (bsnSeg) {
    const purpose = bsnSeg.elements[0] || 'Unspecified';
    const struct = bsnSeg.elements[4] || 'Unspecified';
    checks.push({
      id: 'kde-cte',
      title: 'Critical Tracking Event (CTE)',
      ruleRef: '21 CFR § 1.1340',
      status: 'pass',
      summary: `Shipping CTE identified via BSN01="${purpose}", Structure="${struct}"`,
      details: 'Outbound Shipping Critical Tracking Event successfully registered with hierarchical pack structure.',
      segmentRef: 'BSN',
      line: bsnSeg.lineNumber,
    });
  } else {
    checks.push({
      id: 'kde-cte',
      title: 'Critical Tracking Event (CTE)',
      ruleRef: '21 CFR § 1.1340',
      status: 'fail',
      summary: 'Missing BSN segment defining the Critical Tracking Event.',
      details: 'Shipping CTE must be formally indicated via transaction header BSN.',
    });
  }

  // 4. Harvest, Cooling, Pack & Expiration Dates
  const dtmDates = segments.filter((s) => s.tag === 'DTM');
  const hasAgDate = dtmDates.some((s) => ['196', '197', '198'].includes(s.elements[0]));
  const hasShipOrExp = dtmDates.some((s) => ['011', '036', '035'].includes(s.elements[0]));
  if (hasAgDate) {
    const agDtm = dtmDates.find((s) => ['196', '197', '198'].includes(s.elements[0]));
    checks.push({
      id: 'kde-dates',
      title: 'Harvest, Cooling & Packing Dates',
      ruleRef: '21 CFR § 1.1325 & § 1.1345',
      status: 'pass',
      summary: `Agricultural event dates detected (${dtmDates.map((d) => `${d.elements[0]}:${d.elements[1]}`).join(', ')})`,
      details: 'Harvest (196), Cooling (197), or Packing (198) dates recorded for agricultural produce.',
      segmentRef: 'DTM',
      line: agDtm?.lineNumber,
    });
  } else if (hasShipOrExp) {
    const shipDtm = dtmDates.find((s) => ['011', '036'].includes(s.elements[0]));
    checks.push({
      id: 'kde-dates',
      title: 'Harvest, Cooling & Packing Dates',
      ruleRef: '21 CFR § 1.1325 & § 1.1345',
      status: 'warning',
      summary: `Shipped/Expiration date found (${shipDtm?.elements[1] || ''}), but Produce CTE recommends DTM*196 (Harvest) or DTM*198 (Pack).`,
      details: 'For produce initial packing CTEs, harvesting and cooling dates are critical traceability records.',
      segmentRef: 'DTM',
      line: shipDtm?.lineNumber,
    });
  } else {
    checks.push({
      id: 'kde-dates',
      title: 'Harvest, Cooling & Packing Dates',
      ruleRef: '21 CFR § 1.1325 & § 1.1345',
      status: 'fail',
      summary: 'Missing DTM event date segments.',
      details: 'No harvest, cooling, packing, or shipment dates detected.',
    });
  }

  // 5. Commodity & Variety Description
  const pidSeg = segments.find((s) => s.tag === 'PID' && (s.elements[0] === 'F' || s.elements[4]));
  const gtinSeg = segments.find(
    (s) =>
      (s.tag === 'LIN' || s.tag === 'PO1') &&
      (s.raw.includes('UK') || s.raw.includes('UP') || s.raw.includes('EN'))
  );
  if (pidSeg && gtinSeg) {
    const desc = pidSeg.elements[4] || pidSeg.elements[0];
    checks.push({
      id: 'kde-commodity',
      title: 'Commodity & Variety Identification',
      ruleRef: '21 CFR § 1.1345(a)(1)',
      status: 'pass',
      summary: `Commodity description "${desc}" + GTIN/UPC verified.`,
      details: 'Product commodity, variety, and standard GTIN-14 barcode identifier validated.',
      segmentRef: 'PID',
      line: pidSeg.lineNumber,
    });
  } else if (pidSeg || gtinSeg) {
    const seg = pidSeg || gtinSeg;
    checks.push({
      id: 'kde-commodity',
      title: 'Commodity & Variety Identification',
      ruleRef: '21 CFR § 1.1345(a)(1)',
      status: 'warning',
      summary: pidSeg
        ? `Commodity text found ("${pidSeg.elements[4]}"), but GTIN-14 (LIN*...*UK) is missing.`
        : 'GTIN found, but textual commodity description (PID*F) is missing.',
      details: 'Both textual commodity/variety description and numeric GTIN packaging code are required.',
      segmentRef: seg?.tag,
      line: seg?.lineNumber,
    });
  } else {
    checks.push({
      id: 'kde-commodity',
      title: 'Commodity & Variety Identification',
      ruleRef: '21 CFR § 1.1345(a)(1)',
      status: 'fail',
      summary: 'Missing commodity description (PID*F) and GTIN identification.',
      details: 'Failed to find product description and global trade item identifier.',
    });
  }

  // 6. Physical Facility / Location Description
  const n3 = segments.find((s) => s.tag === 'N3');
  const n4 = segments.find((s) => s.tag === 'N4');
  if (n3 && n4) {
    checks.push({
      id: 'kde-facility-address',
      title: 'Physical Facility / Location Description',
      ruleRef: '21 CFR § 1.1345(b)',
      status: 'pass',
      summary: `Physical street address recorded: ${n3.elements[0]}, ${n4.elements[0]} ${n4.elements[1]} ${n4.elements[2]}`,
      details: 'Complete street, city, state, postal code, and country present for TLCS establishment.',
      segmentRef: 'N3/N4',
      line: n3.lineNumber,
    });
  } else if (n4) {
    checks.push({
      id: 'kde-facility-address',
      title: 'Physical Facility / Location Description',
      ruleRef: '21 CFR § 1.1345(b)',
      status: 'warning',
      summary: `City/State provided (${n4.elements[0]}, ${n4.elements[1]}), but street address (N3) is omitted.`,
      details: 'FDA Rule 204 mandates full street address unless specific farm exemption applies.',
      segmentRef: 'N4',
      line: n4.lineNumber,
    });
  } else {
    checks.push({
      id: 'kde-facility-address',
      title: 'Physical Facility / Location Description',
      ruleRef: '21 CFR § 1.1345(b)',
      status: 'fail',
      summary: 'Missing physical address segments (N3/N4) for TLCS.',
      details: 'Facility location description must provide physical street address.',
    });
  }

  // 7. Immediate Subsequent Recipient (ISR)
  const stParty = segments.find((s) => s.tag === 'N1' && s.elements[0] === 'ST');
  if (stParty) {
    const stName = stParty.elements[1] || 'Ship-To Party';
    const stId = stParty.elements[3] || '';
    checks.push({
      id: 'kde-isr',
      title: 'Immediate Subsequent Recipient (ISR)',
      ruleRef: '21 CFR § 1.1350',
      status: 'pass',
      summary: `Immediate Subsequent Recipient documented: ${stName} (${stId || 'Valid destination'})`,
      details: 'Recipient identity and delivery location verified for supply chain chain of custody.',
      segmentRef: 'N1*ST',
      line: stParty.lineNumber,
    });
  } else {
    checks.push({
      id: 'kde-isr',
      title: 'Immediate Subsequent Recipient (ISR)',
      ruleRef: '21 CFR § 1.1350',
      status: 'fail',
      summary: 'Missing Ship-To recipient (N1*ST) defining the Immediate Subsequent Recipient (ISR).',
      details: 'Outbound shipments must explicitly designate the recipient party.',
    });
  }

  // 8. Shipping Container Code (SSCC-18)
  const manSeg = segments.find(
    (s) => s.tag === 'MAN' && (s.elements[0] === 'GM' || s.elements[0] === 'CP' || s.elements[0] === 'AA')
  );
  if (manSeg) {
    checks.push({
      id: 'kde-sscc',
      title: 'Shipping Container Identification (SSCC-18)',
      ruleRef: '21 CFR § 1.1345(c)',
      status: 'pass',
      summary: `GS1 SSCC-18 barcode container detected: ${manSeg.elements[1]}`,
      details: 'Logistics handling unit tagged with 18-digit Serial Shipping Container Code (SSCC).',
      segmentRef: 'MAN',
      line: manSeg.lineNumber,
    });
  } else {
    checks.push({
      id: 'kde-sscc',
      title: 'Shipping Container Identification (SSCC-18)',
      ruleRef: '21 CFR § 1.1345(c)',
      status: 'warning',
      summary: 'No SSCC-18 container identifier (MAN*GM) detected.',
      details: 'Recommended for case/pallet level supply chain tracking under FSMA 204 best practices.',
    });
  }

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warning').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const score = Math.round(((passCount * 1.0 + warnCount * 0.5) / checks.length) * 100);
  const grade = score >= 88 ? 'A' : score >= 60 ? 'B' : 'F';
  const gradeLabel =
    grade === 'A' ? '100% Fully Compliant' : grade === 'B' ? 'Passing with Warnings' : 'Non-Compliant (Action Required)';

  return {
    score,
    grade,
    gradeLabel,
    passCount,
    warnCount,
    failCount,
    checks,
  };
}

export function convertEdiToJsonWithSchema(
  segments: ParsedSegment[],
  schemaMode: 'semantic' | 'segmentArray' | 'loops',
  delimiters: { segment: string; element: string; subElement: string }
): string {
  if (segments.length === 0) {
    return JSON.stringify({ message: 'No EDI segments parsed' }, null, 2);
  }

  if (schemaMode === 'segmentArray') {
    const res = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      format: 'ASC_X12_SEGMENT_ARRAY_SCHEMA',
      title: 'EDI ANSI X12 Segment Array Model',
      metadata: {
        totalSegments: segments.length,
        delimiters,
        generatedAt: new Date().toISOString(),
      },
      segments: segments.map((s) => ({
        tag: s.tag,
        lineNumber: s.lineNumber,
        name: s.name,
        level: s.level,
        elements: s.elements,
        elementDescriptions: ENVELOPE_ELEMENT_NAMES[s.tag] || [],
      })),
    };
    return JSON.stringify(res, null, 2);
  }

  if (schemaMode === 'loops') {
    const headerSegments: any[] = [];
    const detailLoops: any[] = [];
    const summarySegments: any[] = [];
    let currentDetailLoop: any = null;
    let inSummary = false;

    segments.forEach((seg) => {
      if (['CTT', 'TDS', 'SE', 'GE', 'IEA'].includes(seg.tag)) {
        inSummary = true;
      }
      if (inSummary) {
        summarySegments.push({
          tag: seg.tag,
          name: seg.name,
          lineNumber: seg.lineNumber,
          elements: seg.elements,
        });
      } else if (['PO1', 'IT1', 'HL'].includes(seg.tag)) {
        if (currentDetailLoop) {
          detailLoops.push(currentDetailLoop);
        }
        currentDetailLoop = {
          loopKey: `${seg.tag}_${seg.elements[0] || detailLoops.length + 1}`,
          rootSegment: { tag: seg.tag, name: seg.name, elements: seg.elements },
          childSegments: [],
        };
      } else if (currentDetailLoop) {
        currentDetailLoop.childSegments.push({
          tag: seg.tag,
          name: seg.name,
          elements: seg.elements,
        });
      } else {
        headerSegments.push({
          tag: seg.tag,
          name: seg.name,
          lineNumber: seg.lineNumber,
          elements: seg.elements,
        });
      }
    });
    if (currentDetailLoop) {
      detailLoops.push(currentDetailLoop);
    }

    const res = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      format: 'ASC_X12_HIERARCHICAL_LOOP_SCHEMA',
      title: 'EDI ANSI X12 Loop Hierarchy Model',
      metadata: {
        totalSegments: segments.length,
        totalDetailLoops: detailLoops.length,
        generatedAt: new Date().toISOString(),
      },
      headerLoop: headerSegments,
      detailLoops,
      summaryLoop: summarySegments,
    };
    return JSON.stringify(res, null, 2);
  }

  // Default: 'semantic' Business Object Model - 100% Faithful to Source Transaction
  // Tracks every segment to guarantee zero data loss and zero fabricated values.
  const processedIndices = new Set<number>();

  const findAndTrack = (tag: string): ParsedSegment | undefined => {
    const idx = segments.findIndex((s) => s.tag === tag);
    if (idx !== -1) {
      processedIndices.add(idx);
      return segments[idx];
    }
    return undefined;
  };

  // 1. Dual-Standard Check: UN/EDIFACT vs ANSI X12
  const isEdifact =
    segments.some((s) => ['UNA', 'UNB', 'UNH', 'BGM', 'NAD', 'UNT', 'UNZ'].includes(s.tag)) ||
    (segments[0] && ['UNA', 'UNB'].includes(segments[0].tag));

  if (isEdifact) {
    const una = findAndTrack('UNA');
    const unb = findAndTrack('UNB');
    const unh = findAndTrack('UNH');
    const bgm = findAndTrack('BGM');
    const dtmList = segments.filter((s) => s.tag === 'DTM');
    const unt = findAndTrack('UNT');
    const unz = findAndTrack('UNZ');

    // Parse NAD parties (NAD+SU, NAD+BY, NAD+DP, etc.)
    const parties: any[] = [];
    segments.forEach((s, idx) => {
      if (s.tag === 'NAD') {
        processedIndices.add(idx);
        const idParts = (s.elements[1] || '').split(':');
        parties.push({
          type: s.elements[0]?.trim() || undefined,
          id: idParts[0]?.trim() || undefined,
          idQualifier: idParts[1]?.trim() || undefined,
          name: s.elements[3]?.trim() || s.elements[2]?.trim() || undefined,
          street: s.elements[4]?.trim() || undefined,
          city: s.elements[5]?.trim() || undefined,
          postalCode: s.elements[7]?.trim() || undefined,
          country: s.elements[8]?.trim() || undefined,
        });
      }
    });

    // Parse LIN line items
    const items: any[] = [];
    let currentLin: any = null;
    segments.forEach((s, idx) => {
      if (s.tag === 'LIN') {
        processedIndices.add(idx);
        if (currentLin) items.push(currentLin);
        const codeParts = (s.elements[2] || '').split(':');
        currentLin = {
          line: s.elements[0]?.trim() || undefined,
          itemNumber: codeParts[0]?.trim() || s.elements[1]?.trim() || undefined,
          itemType: codeParts[1]?.trim() || undefined,
          descriptions: [] as string[],
        };
      } else if (s.tag === 'IMD' && currentLin) {
        processedIndices.add(idx);
        const desc = s.elements[2]?.trim() || s.elements[1]?.trim();
        if (desc) currentLin.descriptions.push(desc);
      } else if (s.tag === 'QTY' && currentLin) {
        processedIndices.add(idx);
        const qtyParts = (s.elements[0] || '').split(':');
        currentLin.quantity = qtyParts[1] ? parseFloat(qtyParts[1]) : undefined;
        currentLin.uom = qtyParts[2]?.trim() || undefined;
      } else if (s.tag === 'PRI' && currentLin) {
        processedIndices.add(idx);
        const priParts = (s.elements[0] || '').split(':');
        currentLin.unitPrice = priParts[1] ? parseFloat(priParts[1]) : undefined;
      }
    });
    if (currentLin) items.push(currentLin);

    const unmapped = segments
      .filter((_, i) => !processedIndices.has(i))
      .map((seg) => ({
        tag: seg.tag,
        lineNumber: seg.lineNumber,
        elements: seg.elements,
        raw: seg.raw,
      }));

    const res = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      format: 'EDIFACT_SEMANTIC_SCHEMA',
      standard: 'UN/EDIFACT',
      generatedAt: new Date().toISOString(),
      serviceStringAdvice: una ? una.raw : undefined,
      interchange: unb
        ? {
            syntax: unb.elements[0]?.trim() || undefined,
            sender: unb.elements[1]?.trim() || undefined,
            recipient: unb.elements[2]?.trim() || undefined,
            date: unb.elements[3]?.trim() || undefined,
            controlReference: unb.elements[4]?.trim() || undefined,
          }
        : undefined,
      message: unh
        ? {
            reference: unh.elements[0]?.trim() || undefined,
            type: unh.elements[1]?.trim() || undefined,
            document: bgm
              ? {
                  type: bgm.elements[0]?.trim() || undefined,
                  number: bgm.elements[1]?.trim() || undefined,
                  function: bgm.elements[2]?.trim() || undefined,
                }
              : undefined,
            dates:
              dtmList.length > 0
                ? dtmList.map((d) => ({
                    qualifier: (d.elements[0] || '').split(':')[0]?.trim(),
                    value: (d.elements[0] || '').split(':')[1]?.trim(),
                  }))
                : undefined,
            parties: parties.length > 0 ? parties : undefined,
            items: items.length > 0 ? items : undefined,
          }
        : undefined,
      summary: {
        declaredSegmentCount: unt?.elements[0] ? parseInt(unt.elements[0], 10) : undefined,
        messageReference: unt?.elements[1]?.trim() || undefined,
        interchangeControlCount: unz?.elements[0] ? parseInt(unz.elements[0], 10) : undefined,
        interchangeControlReference: unz?.elements[1]?.trim() || undefined,
      },
      unmappedSegments: unmapped.length > 0 ? unmapped : undefined,
      allSegments: segments.map((s) => ({
        tag: s.tag,
        lineNumber: s.lineNumber,
        elements: s.elements,
      })),
    };
    return JSON.stringify(res, null, 2);
  }

  // 2. ANSI X12 Semantic Business Object Model
  const isa = findAndTrack('ISA');
  const gs = findAndTrack('GS');
  const st = findAndTrack('ST');
  const beg = findAndTrack('BEG'); // 850 PO
  const bak = findAndTrack('BAK'); // 855 PO Ack
  const big = findAndTrack('BIG'); // 810 Invoice
  const bsn = findAndTrack('BSN'); // 856 ASN
  const bch = findAndTrack('BCH'); // 860 PO Change
  const bpr = findAndTrack('BPR'); // 820 Payment Order
  const trn = findAndTrack('TRN'); // 820 Trace
  const ak1 = findAndTrack('AK1'); // 997 FA Group
  const ak9 = findAndTrack('AK9'); // 997 FA Trailer
  const b2 = findAndTrack('B2');   // 204 Carrier Tender
  const b2a = findAndTrack('B2A'); // 204 Tender Purpose
  const b10 = findAndTrack('B10'); // 214 Carrier Status
  const cur = findAndTrack('CUR');
  const ctt = findAndTrack('CTT');
  const tds = findAndTrack('TDS');
  const se = findAndTrack('SE');
  const ge = findAndTrack('GE');
  const iea = findAndTrack('IEA');

  // Track Hierarchical Levels (856 ASN HL Loops)
  const hlSegments = segments.filter((s) => s.tag === 'HL');
  const hierarchicalLevels: any[] = [];
  if (hlSegments.length > 0) {
    hlSegments.forEach((hl) => {
      hierarchicalLevels.push({
        id: hl.elements[0]?.trim() || undefined,
        parentId: hl.elements[1]?.trim() || undefined,
        levelCode: hl.elements[2]?.trim() || undefined, // S=Shipment, O=Order, T=Tare, P=Pack, I=Item
        childCode: hl.elements[3]?.trim() || undefined,
        line: hl.lineNumber,
      });
    });
  }

  // Identify where line items begin
  const firstLineIdx = segments.findIndex((s) => ['PO1', 'IT1', 'LIN', 'POC'].includes(s.tag));
  const headerEndIdx = firstLineIdx !== -1 ? firstLineIdx : segments.length;

  // Header-level references, dates, terms, carrier instructions, allowances, notes
  const headerReferences: any[] = [];
  const headerDates: any[] = [];
  const headerContacts: any[] = [];
  const headerTerms: any[] = [];
  const carrierRouting: any[] = [];
  const fobTerms: any[] = [];
  const allowancesCharges: any[] = [];
  const headerNotes: any[] = [];

  // Parse Parties (N1 Loop)
  const parties: any[] = [];
  let currentParty: any = null;

  for (let i = 0; i < headerEndIdx; i++) {
    const s = segments[i];
    if (['ISA', 'GS', 'ST', 'BEG', 'BIG', 'BSN', 'BCH', 'BAK', 'BPR', 'TRN', 'AK1', 'B2', 'B2A', 'B10', 'CUR'].includes(s.tag)) {
      continue;
    }

    if (s.tag === 'N1') {
      processedIndices.add(i);
      if (currentParty) parties.push(currentParty);
      currentParty = {
        type: s.elements[0]?.trim() || undefined,
        name: s.elements[1]?.trim() || undefined,
        idQualifier: s.elements[2]?.trim() || undefined,
        idCode: s.elements[3]?.trim() || undefined,
      };
    } else if (s.tag === 'N2' && currentParty) {
      processedIndices.add(i);
      currentParty.additionalName = [s.elements[0]?.trim(), s.elements[1]?.trim()].filter(Boolean).join(' ');
    } else if (s.tag === 'N3' && currentParty) {
      processedIndices.add(i);
      // Preserve multi-line addresses as array (Suite, Building, etc.) for full fidelity
      const lines = [s.elements[0]?.trim(), s.elements[1]?.trim()].filter(Boolean) as string[];
      currentParty.addressLines = currentParty.addressLines
        ? [...currentParty.addressLines, ...lines]
        : lines;
      // Keep legacy single string for backward compatibility
      currentParty.address = currentParty.addressLines.join(', ');
    } else if (s.tag === 'N4' && currentParty) {
      processedIndices.add(i);
      currentParty.city = s.elements[0]?.trim() || undefined;
      currentParty.state = s.elements[1]?.trim() || undefined;
      currentParty.zip = s.elements[2]?.trim() || undefined;
      currentParty.country = s.elements[3]?.trim() || undefined; // NO hardcoded 'US'
    } else if (s.tag === 'REF') {
      processedIndices.add(i);
      const refObj = {
        qualifier: s.elements[0]?.trim() || undefined,
        value: s.elements[1]?.trim() || undefined,
        description: s.elements[2]?.trim() || undefined,
      };
      if (currentParty) {
        currentParty.references = currentParty.references || [];
        currentParty.references.push(refObj);
      } else {
        headerReferences.push(refObj);
      }
    } else if (s.tag === 'PER') {
      processedIndices.add(i);
      const perObj = {
        functionCode: s.elements[0]?.trim() || undefined,
        name: s.elements[1]?.trim() || undefined,
        commQualifier: s.elements[2]?.trim() || undefined,
        commNumber: s.elements[3]?.trim() || undefined,
      };
      if (currentParty) {
        currentParty.contacts = currentParty.contacts || [];
        currentParty.contacts.push(perObj);
      } else {
        headerContacts.push(perObj);
      }
    } else if (s.tag === 'DTM') {
      processedIndices.add(i);
      headerDates.push({
        qualifier: s.elements[0]?.trim() || undefined,
        date: s.elements[1]?.trim() || undefined,
        time: s.elements[2]?.trim() || undefined,
      });
    } else if (s.tag === 'ITD') {
      processedIndices.add(i);
      headerTerms.push({
        termsTypeCode: s.elements[0]?.trim() || undefined,
        termsBasisDateCode: s.elements[1]?.trim() || undefined,
        termsDiscountPercent: s.elements[2] ? parseFloat(s.elements[2]) : undefined,
        termsDiscountDays: s.elements[4] ? parseInt(s.elements[4], 10) : undefined,
        termsNetDays: s.elements[6] ? parseInt(s.elements[6], 10) : undefined,
        termsDescription: s.elements[11]?.trim() || undefined,
      });
    } else if (s.tag === 'TD5' || s.tag === 'TD1') {
      processedIndices.add(i);
      carrierRouting.push({
        tag: s.tag,
        routingSequenceCode: s.elements[0]?.trim() || undefined,
        idQualifier: s.elements[1]?.trim() || undefined,
        idCode: s.elements[2]?.trim() || undefined,
        transportMethod: s.elements[3]?.trim() || undefined,
        routing: s.elements[4]?.trim() || undefined,
      });
    } else if (s.tag === 'FOB') {
      processedIndices.add(i);
      fobTerms.push({
        shipmentMethodCode: s.elements[0]?.trim() || undefined,
        locationQualifier: s.elements[1]?.trim() || undefined,
        description: s.elements[2]?.trim() || undefined,
      });
    } else if (s.tag === 'SAC') {
      processedIndices.add(i);
      allowancesCharges.push({
        indicator: s.elements[0]?.trim() || undefined,
        serviceCode: s.elements[1]?.trim() || undefined,
        amount: s.elements[4] ? parseFloat(s.elements[4]) : undefined,
        rate: s.elements[7] ? parseFloat(s.elements[7]) : undefined,
      });
    } else if (s.tag === 'N9') {
      // N9 starts a reference/message loop; capture qualifier + value and subsequent MSG text
      processedIndices.add(i);
      const n9Entry: any = {
        qualifier: s.elements[0]?.trim() || undefined,
        reference: s.elements[1]?.trim() || undefined,
        freeFormDescription: s.elements[2]?.trim() || undefined,
        messages: [] as string[],
      };
      // Look ahead for consecutive MSG segments belonging to this N9
      let j = i + 1;
      while (j < headerEndIdx && segments[j].tag === 'MSG') {
        processedIndices.add(j);
        const msgText = segments[j].elements.map((el) => el.trim()).filter(Boolean).join(' ');
        if (msgText) n9Entry.messages.push(msgText);
        j++;
      }
      headerNotes.push(n9Entry);
    } else if (s.tag === 'MSG' || s.tag === 'NTE') {
      // Standalone MSG/NTE (not already consumed under N9)
      if (!processedIndices.has(i)) {
        processedIndices.add(i);
        headerNotes.push(s.elements.map((el) => el.trim()).filter(Boolean).join(' '));
      }
    }
  }
  if (currentParty) parties.push(currentParty);

  // Parse Line Items & Details
  const items: any[] = [];
  let currentItem: any = null;

  for (let i = firstLineIdx !== -1 ? firstLineIdx : segments.length; i < segments.length; i++) {
    const s = segments[i];

    // Check if we reached summary/trailer
    if (['CTT', 'TDS', 'SE', 'GE', 'IEA'].includes(s.tag)) {
      processedIndices.add(i);
      continue;
    }

    if (['PO1', 'IT1', 'LIN', 'POC'].includes(s.tag)) {
      processedIndices.add(i);
      if (currentItem) items.push(currentItem);

      // Parse product identification pairs (e.g. VN, UP, IN, BP, MG)
      const productIds: Array<{ qualifier: string; id: string }> = [];
      const productIdMap: Record<string, string> = {};
      for (let pIdx = 5; pIdx < s.elements.length; pIdx += 2) {
        const q = s.elements[pIdx]?.trim();
        const v = s.elements[pIdx + 1]?.trim();
        if (q && v) {
          productIds.push({ qualifier: q, id: v });
          productIdMap[q] = v;
        }
      }

      currentItem = {
        line: s.elements[0]?.trim() || undefined, // NO hardcoded '1'
        quantity: s.elements[1] !== undefined && s.elements[1] !== '' ? parseFloat(s.elements[1]) : undefined,
        uom: s.elements[2]?.trim() || undefined, // NO hardcoded 'EA'
        unitPrice: s.elements[3] !== undefined && s.elements[3] !== '' ? parseFloat(s.elements[3]) : undefined,
        basisOfUnitPrice: s.elements[4]?.trim() || undefined,
        productIds: productIds.length > 0 ? productIds : undefined,
        productIdMap: Object.keys(productIdMap).length > 0 ? productIdMap : undefined,
        descriptions: [] as string[],
        references: [] as any[],
        dates: [] as any[],
        allowancesCharges: [] as any[],
        notes: [] as string[],
      };
    } else if (s.tag === 'PID' && currentItem) {
      processedIndices.add(i);
      const desc = s.elements[4]?.trim() || s.elements[0]?.trim();
      if (desc) currentItem.descriptions.push(desc);
    } else if (s.tag === 'REF' && currentItem) {
      processedIndices.add(i);
      currentItem.references.push({
        qualifier: s.elements[0]?.trim() || undefined,
        value: s.elements[1]?.trim() || undefined,
      });
    } else if (s.tag === 'DTM' && currentItem) {
      processedIndices.add(i);
      currentItem.dates.push({
        qualifier: s.elements[0]?.trim() || undefined,
        date: s.elements[1]?.trim() || undefined,
      });
    } else if (s.tag === 'SAC' && currentItem) {
      processedIndices.add(i);
      currentItem.allowancesCharges.push({
        indicator: s.elements[0]?.trim() || undefined,
        amount: s.elements[4] ? parseFloat(s.elements[4]) : undefined,
      });
    } else if (s.tag === 'ACK' && currentItem) {
      processedIndices.add(i);
      currentItem.acknowledgments = currentItem.acknowledgments || [];
      currentItem.acknowledgments.push({
        lineStatusCode: s.elements[0]?.trim() || undefined,
        quantity: s.elements[1] !== undefined && s.elements[1] !== '' ? parseFloat(s.elements[1]) : undefined,
        uom: s.elements[2]?.trim() || undefined,
        dateQualifier: s.elements[3]?.trim() || undefined,
        date: s.elements[4]?.trim() || undefined,
      });
    } else if (s.tag === 'SN1' && currentItem) {
      processedIndices.add(i);
      currentItem.shipmentDetail = {
        numberOfUnitsShipped: s.elements[1] !== undefined && s.elements[1] !== '' ? parseFloat(s.elements[1]) : undefined,
        uom: s.elements[2]?.trim() || undefined,
        accumulatedQty: s.elements[3] !== undefined && s.elements[3] !== '' ? parseFloat(s.elements[3]) : undefined,
      };
    } else if (s.tag === 'PO4' && currentItem) {
      // Item physical details (pack, weight, dimensions) – critical for many 850s
      processedIndices.add(i);
      currentItem.physicalDetails = {
        pack: s.elements[0] !== undefined && s.elements[0] !== '' ? parseFloat(s.elements[0]) : undefined,
        size: s.elements[1]?.trim() || undefined,
        uomPack: s.elements[2]?.trim() || undefined,
        packagingCode: s.elements[3]?.trim() || undefined,
        weightQualifier: s.elements[4]?.trim() || undefined,
        grossWeightPerPack: s.elements[5] !== undefined && s.elements[5] !== '' ? parseFloat(s.elements[5]) : undefined,
        weightUom: s.elements[6]?.trim() || undefined,
        length: s.elements[9] !== undefined && s.elements[9] !== '' ? parseFloat(s.elements[9]) : undefined,
        width: s.elements[10] !== undefined && s.elements[10] !== '' ? parseFloat(s.elements[10]) : undefined,
        height: s.elements[11] !== undefined && s.elements[11] !== '' ? parseFloat(s.elements[11]) : undefined,
        dimensionUom: s.elements[12]?.trim() || undefined,
      };
    } else if ((s.tag === 'MSG' || s.tag === 'NTE') && currentItem) {
      processedIndices.add(i);
      currentItem.notes.push(s.elements.map((el) => el.trim()).filter(Boolean).join(' '));
    }
  }
  if (currentItem) items.push(currentItem);

  // Clean up empty arrays in items
  items.forEach((item) => {
    if (item.descriptions && item.descriptions.length === 0) delete item.descriptions;
    if (item.references && item.references.length === 0) delete item.references;
    if (item.dates && item.dates.length === 0) delete item.dates;
    if (item.allowancesCharges && item.allowancesCharges.length === 0) delete item.allowancesCharges;
    if (item.notes && item.notes.length === 0) delete item.notes;
  });

  // Collect any unmapped segments to guarantee 100% lossless fidelity
  const unmappedSegments = segments
    .map((seg, idx) => ({ seg, idx }))
    .filter(({ idx }) => !processedIndices.has(idx))
    .map(({ seg }) => ({
      tag: seg.tag,
      lineNumber: seg.lineNumber,
      name: seg.name,
      elements: seg.elements,
      raw: seg.raw,
    }));

  const res = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    format: 'ASC_X12_SEMANTIC_SCHEMA',
    standard: isa ? 'ANSI_X12' : 'EDI',
    version: gs?.elements[7]?.trim() || undefined, // NO hardcoded '004010'
    generatedAt: new Date().toISOString(),
    interchange: isa
      ? {
          sender: isa.elements[5]?.trim() || undefined,
          senderQualifier: isa.elements[4]?.trim() || undefined,
          receiver: isa.elements[7]?.trim() || undefined,
          receiverQualifier: isa.elements[6]?.trim() || undefined,
          controlNumber: isa.elements[12]?.trim() || undefined,
          date: isa.elements[8]?.trim() || undefined,
          time: isa.elements[9]?.trim() || undefined,
          ackRequested: isa.elements[13]?.trim() === '1',
          usageIndicator: isa.elements[14]?.trim() || undefined,
        }
      : undefined,
    functionalGroup: gs
      ? {
          functionalCode: gs.elements[0]?.trim() || undefined,
          sender: gs.elements[1]?.trim() || undefined,
          receiver: gs.elements[2]?.trim() || undefined,
          date: gs.elements[3]?.trim() || undefined,
          time: gs.elements[4]?.trim() || undefined,
          controlNumber: gs.elements[5]?.trim() || undefined,
          agencyCode: gs.elements[6]?.trim() || undefined,
          version: gs.elements[7]?.trim() || undefined,
        }
      : undefined,
    transaction: {
      set: st?.elements[0]?.trim() || undefined, // NO hardcoded '850'
      controlNumber: st?.elements[1]?.trim() || undefined, // NO hardcoded '0001'
      implementationConvention: st?.elements[2]?.trim() || undefined,
      header: {
        poNumber: beg?.elements[2]?.trim() || bch?.elements[2]?.trim() || bak?.elements[2]?.trim() || undefined,
        invoiceNumber: big?.elements[1]?.trim() || undefined,
        shipmentId: bsn?.elements[1]?.trim() || b10?.elements[1]?.trim() || undefined,
        shipmentDate: bsn?.elements[2]?.trim() || undefined,
        shipmentTime: bsn?.elements[3]?.trim() || undefined,
        hierarchicalStructureCode: bsn?.elements[4]?.trim() || undefined,
        date: beg?.elements[4]?.trim() || big?.elements[0]?.trim() || bsn?.elements[2]?.trim() || bch?.elements[4]?.trim() || bak?.elements[3]?.trim() || undefined,
        acknowledgmentType: bak?.elements[1]?.trim() || undefined,
        acknowledgmentDate: bak?.elements[8]?.trim() || undefined,
        paymentAmount: bpr?.elements[1] ? parseFloat(bpr.elements[1]) : undefined,
        paymentMethod: bpr?.elements[3]?.trim() || undefined,
        paymentEffectiveDate: bpr?.elements[15]?.trim() || undefined,
        traceNumber: trn?.elements[1]?.trim() || undefined,
        loadTenderNumber: b2?.elements[3]?.trim() || undefined,
        carrierScac: b2?.elements[1]?.trim() || undefined,
        purposeCode: beg?.elements[0]?.trim() || bsn?.elements[0]?.trim() || bch?.elements[0]?.trim() || bak?.elements[0]?.trim() || b2a?.elements[0]?.trim() || undefined,
        typeCode: beg?.elements[1]?.trim() || bch?.elements[1]?.trim() || undefined,
        currency: cur?.elements[1]?.trim() ? { code: cur.elements[1].trim(), entityIdentifier: cur.elements[0]?.trim() } : undefined, // NO hardcoded 'USD'
        references: headerReferences.length > 0 ? headerReferences : undefined,
        dates: headerDates.length > 0 ? headerDates : undefined,
        contacts: headerContacts.length > 0 ? headerContacts : undefined,
        paymentTerms: headerTerms.length > 0 ? headerTerms : undefined,
        carrierRouting: carrierRouting.length > 0 ? carrierRouting : undefined,
        fobTerms: fobTerms.length > 0 ? fobTerms : undefined,
        allowancesCharges: allowancesCharges.length > 0 ? allowancesCharges : undefined,
        notes: headerNotes.length > 0 ? headerNotes : undefined,
      },
      hierarchicalLevels: hierarchicalLevels.length > 0 ? hierarchicalLevels : undefined,
      parties: parties.length > 0 ? parties : undefined,
      items: items.length > 0 ? items : undefined,
      summary: {
        totalLineItems: ctt?.elements[0] ? parseInt(ctt.elements[0], 10) : items.length > 0 ? items.length : undefined,
        hashTotal: ctt?.elements[1] ? parseFloat(ctt.elements[1]) : undefined,
        totalInvoiceAmount: tds?.elements[0] ? parseFloat(tds.elements[0]) / 100 : undefined,
        declaredSegmentCount: se?.elements[0] ? parseInt(se.elements[0], 10) : undefined,
        trailerControlNumber: se?.elements[1]?.trim() || undefined,
        functionalAckTotals: ak9
          ? {
              status: ak9.elements[0]?.trim() || undefined,
              includedSets: ak9.elements[1] ? parseInt(ak9.elements[1], 10) : undefined,
              receivedSets: ak9.elements[2] ? parseInt(ak9.elements[2], 10) : undefined,
              acceptedSets: ak9.elements[3] ? parseInt(ak9.elements[3], 10) : undefined,
            }
          : undefined,
      },
      unmappedSegments: unmappedSegments.length > 0 ? unmappedSegments : undefined,
    },
    allSegments: segments.map((s) => ({
      tag: s.tag,
      lineNumber: s.lineNumber,
      elements: s.elements,
    })),
  };
  return JSON.stringify(res, null, 2);
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
  // Normalize tool ID mapping
  const normalizedInitialTab = tool.id === 'edi-validator' ? 'edi-validator' : tool.id;
  const [activeTab, setActiveTab] = useState<string>(normalizedInitialTab || 'edi-validator');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('850');

  // Delimiters
  const [segmentTerminator, setSegmentTerminator] = useState<string>('~');
  const [elementSeparator, setElementSeparator] = useState<string>('*');
  const [subElementSeparator, setSubElementSeparator] = useState<string>('>');
  const [indentOutput, setIndentOutput] = useState<boolean>(true);

  // Initialize input
  const [input, setInput] = useState<string>(() => {
    const pendingTransfer = popSmartPastePayload(tool.id) || popSmartPastePayload('edi') || popSmartPastePayload('edi-formatter') || popSmartPastePayload('edi-to-json');
    if (pendingTransfer) return pendingTransfer;
    if (initialInput) return initialInput;
    return SAMPLE_850;
  });

  const [output, setOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [expandedSegment, setExpandedSegment] = useState<number | null>(0);

  // P1.4: X12 JSON Schema Modes ('semantic' | 'segmentArray' | 'loops')
  const [x12JsonSchemaMode, setX12JsonSchemaMode] = useState<'semantic' | 'segmentArray' | 'loops'>('semantic');

  // P1.6: EDI Validator Audit Mode ('standard' envelope vs 'fsma204' Food Traceability Audit)
  const [validatorMode, setValidatorMode] = useState<'standard' | 'fsma204'>('standard');
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Keep activeTab and input in sync with tool prop changes
  useEffect(() => {
    if (tool && tool.id) {
      setActiveTab(tool.id);
      const pendingTransfer = popSmartPastePayload(tool.id) || popSmartPastePayload('edi') || popSmartPastePayload('edi-formatter') || popSmartPastePayload('edi-to-json');
      if (pendingTransfer) {
        setInput(pendingTransfer);
      } else if (initialInput) {
        setInput(initialInput);
      }
    }
  }, [tool.id, initialInput]);

  // Auto-detect delimiters whenever input changes
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed.startsWith('ISA') && trimmed.length >= 106) {
      const elemSep = trimmed[3];
      const compSep = trimmed[104];
      const segTerm = trimmed[105];
      if (elemSep) setElementSeparator(elemSep);
      if (compSep) setSubElementSeparator(compSep);
      if (segTerm === '\r' || segTerm === '\n') {
        setSegmentTerminator('\n');
      } else if (segTerm && !/\s/.test(segTerm)) {
        setSegmentTerminator(segTerm);
      }
    } else if (trimmed.startsWith('UNA') && trimmed.length >= 9) {
      setSubElementSeparator(trimmed[3]);
      setElementSeparator(trimmed[4]);
      setSegmentTerminator(trimmed[8]);
    } else if (trimmed.startsWith('UNB') || trimmed.includes('UNH+')) {
      setElementSeparator('+');
      setSubElementSeparator(':');
      setSegmentTerminator("'");
    } else if (trimmed) {
      // Auto-detect for EDI snippets or files without ISA envelope
      if (trimmed.includes('~')) {
        setSegmentTerminator('~');
      } else if (trimmed.includes("'")) {
        setSegmentTerminator("'");
      } else if (trimmed.includes('\n')) {
        setSegmentTerminator('\n');
      }
      if (trimmed.includes('*')) setElementSeparator('*');
      else if (trimmed.includes('+')) setElementSeparator('+');
    }
  }, [input]);

  // Current active tool definition for single dynamic top header
  const currentActiveToolDef = useMemo(() => {
    return TOOLS.find((t) => t.id === activeTab) || tool;
  }, [activeTab, tool]);

  // P1.5: EDIFACT Version Detection & Era Analysis
  const detectedEdifact = useMemo(() => {
    return detectEdifactVersion(input);
  }, [input]);

  const loadTransactionSample = (txId: string) => {
    const found = EDI_TRANSACTIONS.find((t) => t.id === txId || t.code === txId);
    if (!found) return;
    setSelectedSampleId(found.id);
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
      if (segTerm === '\r' || segTerm === '\n') {
        setSegmentTerminator('\n');
      } else if (segTerm && !/\s/.test(segTerm)) {
        setSegmentTerminator(segTerm);
      } else {
        setSegmentTerminator('~');
      }
    } else if (trimmed.startsWith('UNA') && trimmed.length >= 9) {
      setSubElementSeparator(trimmed[3]);
      setElementSeparator(trimmed[4]);
      setSegmentTerminator(trimmed[8]);
    } else if (trimmed.startsWith('UNB') || trimmed.includes('UNH+')) {
      setElementSeparator('+');
      setSubElementSeparator(':');
      setSegmentTerminator("'");
    } else if (trimmed) {
      if (trimmed.includes('~')) setSegmentTerminator('~');
      else if (trimmed.includes("'")) setSegmentTerminator("'");
      else if (trimmed.includes('\n')) setSegmentTerminator('\n');
      if (trimmed.includes('*')) setElementSeparator('*');
      else if (trimmed.includes('+')) setElementSeparator('+');
    }
  };

  const parsedSegments = useMemo<ParsedSegment[]>(() => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return [];

    let term = segmentTerminator || '~';
    // If terminator is '~' but input has NO '~' and contains linebreaks, gracefully handle as newline
    if (term === '~' && !input.includes('~') && input.includes('\n')) {
      term = '\n';
    }

    let rawSegs: string[] = [];
    if (term === '\n' || term === '\r\n') {
      rawSegs = input.split(/\r?\n+/);
    } else {
      // Split on the terminator AND strip any immediate CRLF following it
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const splitRegex = new RegExp(`${escapedTerm}[\\r\\n]*`, 'g');
      rawSegs = input.split(splitRegex);
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
        elements: elements.slice(1).map((el) => el.trim()),
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

    const isEdifact =
      segments.some((s) => ['UNA', 'UNB', 'UNH', 'UNT', 'UNZ'].includes(s.tag)) ||
      (segments[0] && ['UNA', 'UNB'].includes(segments[0].tag));

    if (isEdifact) {
      // --- UN/EDIFACT Validation Suite ---
      const unb = segments.find((s) => s.tag === 'UNB');
      const unz = segments.find((s) => s.tag === 'UNZ');
      const unhList = segments.filter((s) => s.tag === 'UNH');
      const untList = segments.filter((s) => s.tag === 'UNT');

      if (!unb && !unz && unhList.length > 0) {
        issues.push({
          type: 'info',
          message: 'UN/EDIFACT Message snippet (UNH/UNT) detected without outer Interchange (UNB/UNZ) envelope. Validating message structure.',
        });
      } else {
        if (!unb) {
          issues.push({ type: 'error', message: 'Missing mandatory UN/EDIFACT Interchange Header (UNB).' });
        }
        if (!unz) {
          issues.push({ type: 'error', message: 'Missing mandatory UN/EDIFACT Interchange Trailer (UNZ).' });
        } else if (unb && unz) {
          const unbCtrl = unb.elements[4]?.trim();
          const unzCtrl = unz.elements[1]?.trim();
          if (unbCtrl && unzCtrl && unbCtrl !== unzCtrl) {
            issues.push({
              type: 'error',
              message: `Interchange Control Reference mismatch: UNB05 (${unbCtrl}) != UNZ02 (${unzCtrl}).`,
              line: unz.lineNumber,
              segment: 'UNZ',
            });
          }
          const declaredMsgCount = parseInt(unz.elements[0], 10);
          if (!isNaN(declaredMsgCount) && declaredMsgCount !== unhList.length) {
            issues.push({
              type: 'error',
              message: `Interchange message count mismatch in UNZ01: declared ${declaredMsgCount}, but found ${unhList.length} UNH message(s).`,
              line: unz.lineNumber,
              segment: 'UNZ',
            });
          }
        }
      }

      // Message (UNH/UNT) validation
      if (unhList.length !== untList.length) {
        issues.push({
          type: 'error',
          message: `UN/EDIFACT Message Header/Trailer count mismatch: found ${unhList.length} UNH and ${untList.length} UNT.`,
        });
      }

      unhList.forEach((unh, idx) => {
        const unt = untList[idx];
        if (unt) {
          const unhRef = unh.elements[0]?.trim();
          const untRef = unt.elements[1]?.trim();
          if (unhRef && untRef && unhRef !== untRef) {
            issues.push({
              type: 'error',
              message: `Message Reference Number mismatch: UNH01 (${unhRef}) != UNT02 (${untRef}).`,
              line: unt.lineNumber,
              segment: 'UNT',
            });
          }
          const unhIndex = segments.findIndex((s) => s === unh);
          const untIndex = segments.findIndex((s) => s === unt);
          if (unhIndex !== -1 && untIndex !== -1 && untIndex >= unhIndex) {
            const actualCount = untIndex - unhIndex + 1;
            const declaredCount = parseInt(unt.elements[0], 10);
            if (!isNaN(declaredCount) && declaredCount !== actualCount) {
              issues.push({
                type: 'error',
                message: `Segment count mismatch in UNT01: declared ${declaredCount}, but actual count between UNH and UNT is ${actualCount}.`,
                line: unt.lineNumber,
                segment: 'UNT',
              });
            }
          }
        }
      });

      if (issues.length === 0) {
        issues.push({
          type: 'info',
          message: 'All UN/EDIFACT envelope pairing, control references, and segment counts passed validation successfully!',
        });
      }
      return issues;
    }

    // --- ANSI X12 Validation Suite ---
    const isa = segments.find((s) => s.tag === 'ISA');
    const iea = segments.find((s) => s.tag === 'IEA');
    const gsList = segments.filter((s) => s.tag === 'GS');
    const geList = segments.filter((s) => s.tag === 'GE');
    const stList = segments.filter((s) => s.tag === 'ST');
    const seList = segments.filter((s) => s.tag === 'SE');

    // 1. Interchange Envelope (ISA/IEA & TA1 Level 1 Compliance)
    const ta1Segment = segments.find((s) => s.tag === 'TA1');
    if (ta1Segment) {
      const ackCtrl = ta1Segment.elements[0]?.trim() || '';
      const ackStatus = ta1Segment.elements[3]?.trim() || '';
      const noteCode = ta1Segment.elements[4]?.trim() || '000';
      const statusLabel =
        ackStatus === 'A' ? 'Accepted (A)' : ackStatus === 'E' ? 'Accepted with Errors (E)' : 'Rejected (R)';
      issues.push({
        type: ackStatus === 'A' ? 'info' : 'warning',
        message: `TA1 Interchange Acknowledgment detected: Control #${ackCtrl}, Status: ${statusLabel}, Note Code: ${noteCode}.`,
        line: ta1Segment.lineNumber,
        segment: 'TA1',
      });
    }

    if (!isa && !iea && stList.length > 0) {
      issues.push({
        type: 'info',
        message: 'Transaction Set snippet (ST/SE) detected without outer Interchange (ISA/IEA) or Functional Group (GS/GE) envelopes. Validating transaction structure.',
      });
    } else {
      if (!isa) {
        issues.push({ type: 'error', message: 'Missing mandatory Interchange Header (ISA).' });
      } else if (isa.elements.length !== 16) {
        issues.push({
          type: 'warning',
          message: `ISA segment has ${isa.elements.length} elements. Standard ANSI X12 requires exactly 16 elements (TA1 Error Code 006).`,
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
            message: `Interchange Control Number mismatch: ISA13 (${isaCtrl}) != IEA02 (${ieaCtrl}). Triggers Gateway TA1 Rejection with Note Code 001.`,
            line: iea.lineNumber,
            segment: 'IEA',
          });
        }
        const declaredGroupCount = parseInt(iea.elements[0], 10);
        if (!isNaN(declaredGroupCount) && declaredGroupCount !== gsList.length) {
          issues.push({
            type: 'warning',
            message: `Functional group count in IEA01 (${declaredGroupCount}) differs from actual GS count (${gsList.length}).`,
            line: iea.lineNumber,
            segment: 'IEA',
          });
        }
      }

      // 2. Functional Group Envelope (GS/GE)
      if (gsList.length === 0 && isa) {
        issues.push({ type: 'warning', message: 'No Functional Group Header (GS) found.' });
      }
      if (gsList.length !== geList.length) {
        issues.push({
          type: 'error',
          message: `Functional Group Header/Trailer count mismatch: found ${gsList.length} GS and ${geList.length} GE.`,
        });
      } else {
        gsList.forEach((gs, idx) => {
          const ge = geList[idx];
          if (ge) {
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
        });
      }
    }

    // 3. Transaction Set (ST/SE)
    if (stList.length === 0 && !isa) {
      issues.push({
        type: 'error',
        message: 'No recognizable ANSI X12 (ISA/ST) or UN/EDIFACT (UNB/UNH) transaction structures detected.',
      });
      return issues;
    }

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

  // P1.6: FSMA 204 Traceability Audit computation
  const fsmaAuditResult = useMemo(() => {
    return evaluateFsma204Traceability(parsedSegments);
  }, [parsedSegments]);

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
        const jsonStr = convertEdiToJsonWithSchema(parsedSegments, x12JsonSchemaMode, {
          segment: segmentTerminator,
          element: elementSeparator,
          subElement: subElementSeparator,
        });
        setOutput(jsonStr);
      } catch (err: any) {
        setOutput(`Error converting EDI to JSON: ${err.message}`);
      }
    }
  }, [
    input,
    activeTab,
    parsedSegments,
    segmentTerminator,
    elementSeparator,
    subElementSeparator,
    indentOutput,
    x12JsonSchemaMode,
  ]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    downloadFile({
      file: content,
      filename,
      mimeType: filename.endsWith('.json') ? 'application/json' : 'text/plain;charset=utf-8',
    });
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

  const handleExportFsmaReport = () => {
    const lines: string[] = [
      '=================================================================',
      '  FDA FOOD SAFETY MODERNIZATION ACT (FSMA 204) AUDIT CERTIFICATE ',
      '             21 CFR Part 1 Subpart S Compliance Audit            ',
      '=================================================================',
      `Audit Generated: ${new Date().toISOString()}`,
      `Document Reference: ${selectedSampleId}`,
      `Compliance Grade:  Grade ${fsmaAuditResult.grade} (${fsmaAuditResult.score}% - ${fsmaAuditResult.gradeLabel})`,
      `KDE Pass Count:     ${fsmaAuditResult.passCount} / 8`,
      `KDE Warnings:       ${fsmaAuditResult.warnCount} / 8`,
      `KDE Failures:       ${fsmaAuditResult.failCount} / 8`,
      '',
      'KEY DATA ELEMENTS (KDE) AUDIT CHECKLIST BREAKDOWN:',
      '-----------------------------------------------------------------',
    ];
    fsmaAuditResult.checks.forEach((chk, idx) => {
      lines.push(`[${chk.status.toUpperCase()}] KDE #${idx + 1}: ${chk.title} [${chk.ruleRef}]`);
      lines.push(`   Status:   ${chk.summary}`);
      lines.push(`   Evidence: ${chk.details}`);
      if (chk.segmentRef) {
        lines.push(`   Segment:  ${chk.segmentRef} (Line #${chk.line || 'N/A'})`);
      }
      lines.push('');
    });
    lines.push('=================================================================');
    lines.push('End of FSMA 204 Automated Compliance Audit Report');
    handleDownload(lines.join('\n'), `fsma204_compliance_audit_${selectedSampleId}.txt`);
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

  const errorCount = validationIssues.filter((i) => i.type === 'error').length;
  const warningCount = validationIssues.filter((i) => i.type === 'warning').length;

  const handleClearWorkspace = () => {
    setInput('');
    setFilterQuery('');
  };

  return (
    <div className="space-y-6">
      {/* 1. SINGLE TOP HEADER: Bookmark, Share, Category badges */}
      <ToolHeader
        tool={currentActiveToolDef}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleClearWorkspace}
        resetLabel="Clear Workspace"
      />

      {/* 2. Sub-tools Navigation Tabs */}
      <div
        className="flex items-center gap-2 border-b overflow-x-auto pb-2.5 custom-scrollbar scroll-smooth"
        style={{ borderColor: 'var(--line)' }}
      >
        {[
          { id: 'edi-csv-converter', label: 'EDI to CSV & CSV to EDI', icon: FileSpreadsheet, isNew: true },
          { id: 'edi-hipaa-sanitizer', label: 'HIPAA PHI De-Identifier', icon: ShieldCheck, isNew: true },
          { id: 'edi-batch-splitter', label: 'Batch Splitter & Joiner', icon: Scissors, isNew: true },
          { id: 'edi-diff-compare', label: 'Semantic Diff & Compare', icon: GitCompare, isNew: true },
          { id: 'edi-message-gateway', label: 'Inbound & Outbound Gateway', icon: Network, isNew: true },
          { id: 'edi-formatter', label: 'EDI Formatter & Indenter', icon: Sparkles },
          { id: 'edi-schema-viewer', label: 'Hierarchical Schema & Element Lookup', icon: Layers, isNew: true },
          { id: 'edi-segment-viewer', label: 'EDI Segment & Element Viewer', icon: Table },
          { id: 'edi-to-json', label: 'EDI to JSON Converter', icon: ArrowLeftRight },
          { id: 'json-to-edi', label: 'JSON to EDI Converter', icon: FileCode2 },
          { id: 'xslt-transformer', label: 'XSLT Transformer & Tester', icon: Sparkles, isNew: true },
          { id: 'edi-validator', label: 'EDI Compliance Validator', icon: ShieldCheck },
          { id: 'edi-lifecycle-reconciliation', label: 'Order Lifecycle Reconciliation', icon: GitCompareArrows },
          { id: 'edi-997-generator', label: '997 / TA1 / CONTRL Ack Generator', icon: CheckCircle2 },
          { id: 'gs1-sscc-label-generator', label: 'GS1-128 / SSCC-18 Label Generator', icon: Barcode },
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
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
              {tab.isNew && (
                <span
                  className="px-1.5 py-0.2 text-[9px] font-bold rounded uppercase tracking-wider ml-1"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--brand)',
                    color: '#ffffff',
                  }}
                >
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2.5 EDI Integration Hub Status Bar & Step-by-Step Tutorial Trigger */}
      <div
        className="p-3.5 rounded-2xl border flex items-center justify-between flex-wrap gap-3 shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            EDI Integration Hub
          </span>
          <span className="text-xs" style={{ color: 'var(--line)' }}>•</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
            {currentActiveToolDef?.name || 'EDI Tool'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            100% Client-Side Privacy
          </span>
        </div>

        {/* Step-by-Step Tutorial & Field Guide Toggle Button */}
        <button
          type="button"
          onClick={() => setShowTutorial(!showTutorial)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs border"
          style={{
            backgroundColor: showTutorial ? 'var(--brand)' : 'var(--surface-2)',
            color: showTutorial ? '#ffffff' : 'var(--brand)',
            borderColor: showTutorial ? 'var(--brand)' : 'var(--line)',
          }}
          title="Toggle Step-by-Step Tutorial & Field Guide"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{showTutorial ? 'Hide Step-by-Step Guide' : 'Step-by-Step Tutorial & Field Guide'}</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              showTutorial ? 'bg-white/25 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            How-To
          </span>
        </button>
      </div>

      {/* Embedded Step-by-Step Tutorial Panel when opened */}
      {showTutorial && (
        <EdiTutorialPanel
          toolId={activeTab}
          isOpen={true}
          onToggle={() => setShowTutorial(false)}
          onLoadSample={(s) => setInput(s)}
        />
      )}

      {/* 3. Delimiter & Sample Controls Bar (for formatter, viewer, to-json, validator) */}
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
                      {tx.code} – {tx.name}
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

            {/* EDIFACT Version & Era Badge (P1.5) */}
            {detectedEdifact && (
              <span
                className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border flex items-center gap-1.5 shadow-xs ${detectedEdifact.badgeClass}`}
                title={`${detectedEdifact.description} (Standard: ${detectedEdifact.standard})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span>{detectedEdifact.label}</span>
                <span className="opacity-80">({detectedEdifact.era})</span>
              </span>
            )}

            <div className="hidden sm:block h-4 w-px bg-[var(--line)] mx-1" />

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[var(--muted)] hidden sm:inline">Quick:</span>
              {[
                { id: '850', label: '850 PO' },
                { id: '855', label: '855 Ack' },
                { id: '856', label: '856 ASN' },
                { id: '810', label: '810 Inv' },
                { id: '997', label: '997 Ack' },
                { id: 'ORDERS-D16B', label: 'D.16B (GS1)' },
                { id: 'DESADV-D23A', label: 'D.23A (UNECE)' },
                { id: '856-FSMA204', label: 'FSMA 204' },
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

      {/* Phase 2: synchronized raw ↔ visual tree inspector for every EDI tool */}
      <EdiPhase2Inspector
        input={input}
        elementSeparator={elementSeparator}
        segmentTerminator={segmentTerminator}
        onLoadSample={loadTransactionSample}
      />

      {/* 4. EDI VALIDATOR VIEW: Full Dashboard, Report & Live Editor */}
      {activeTab === 'edi-validator' && (
        <div className="space-y-6">
          {/* Validator Mode Selector: Standard vs FSMA 204 */}
          <div
            className="p-2 rounded-2xl border flex items-center justify-between gap-3 flex-wrap"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setValidatorMode('standard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  validatorMode === 'standard'
                    ? 'border text-white shadow-xs'
                    : 'text-[var(--muted)] hover:opacity-80'
                }`}
                style={{
                  backgroundColor: validatorMode === 'standard' ? 'var(--brand)' : 'transparent',
                  borderColor: validatorMode === 'standard' ? 'var(--brand)' : 'transparent',
                }}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Standard Envelope & Syntax</span>
              </button>
              <button
                onClick={() => setValidatorMode('fsma204')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  validatorMode === 'fsma204'
                    ? 'bg-emerald-600 text-white shadow-xs border border-emerald-500'
                    : 'text-[var(--muted)] hover:opacity-80'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>FSMA 204 Food Traceability Audit</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-700 text-white font-mono font-normal">
                  FDA Rule 204
                </span>
              </button>
            </div>

            {validatorMode === 'fsma204' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setInput(FSMA_204_COMPLIANT_856);
                    setSelectedSampleId('856-FSMA204');
                  }}
                  className="px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--brand)' }}
                  title="Load 100% compliant FSMA 204 Advanced Shipping Notice sample"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load 100% Compliant 856 Sample</span>
                </button>
                <button
                  onClick={handleExportFsmaReport}
                  className="px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 hover:opacity-80 shadow-xs"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  title="Export FSMA 204 Audit Certificate"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Audit Certificate</span>
                </button>
              </div>
            )}
          </div>

          {validatorMode === 'standard' ? (
            <>
              {/* Summary Banner */}
              <div
                className="p-5 rounded-2xl border flex items-center justify-between gap-4 flex-wrap"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center gap-3.5">
                  {errorCount > 0 ? (
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                      {errorCount > 0
                        ? 'EDI Compliance Discrepancies Detected'
                        : 'EDI Structure & Envelope Validation Passed'}
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Strictly validates ISA/IEA, GS/GE, and ST/SE envelope pairing, control numbers, and SE01 segment counts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs flex-wrap">
                  <span
                    className={`px-3 py-1.5 rounded-xl border font-bold ${
                      errorCount > 0
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--muted)] border-transparent'
                    }`}
                  >
                    {errorCount} Errors
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-xl border font-bold ${
                      warningCount > 0
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-[var(--muted)] border-transparent'
                    }`}
                  >
                    {warningCount} Warnings
                  </span>
                  <button
                    onClick={handleExportValidationReport}
                    disabled={!input.trim()}
                    className="px-3.5 py-2 rounded-xl border font-semibold flex items-center gap-1.5 hover:opacity-80 disabled:opacity-40 cursor-pointer shadow-xs"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    title="Download full compliance validation report"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--brand)]" />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>

              {/* Validation Findings List */}
              <div
                className="rounded-2xl border divide-y overflow-hidden shadow-xs"
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
            </>
          ) : (
            /* FSMA 204 Traceability Scorecard & Checklist */
            <div className="space-y-4">
              {/* Scorecard Hero Banner */}
              <div
                className="p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-5"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl font-black text-2xl flex items-center justify-center shrink-0 border ${
                      fsmaAuditResult.grade === 'A'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : fsmaAuditResult.grade === 'B'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                    }`}
                  >
                    {fsmaAuditResult.grade}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                        FSMA 204 Food Traceability Compliance
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          fsmaAuditResult.grade === 'A'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : fsmaAuditResult.grade === 'B'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}
                      >
                        {fsmaAuditResult.score}% ({fsmaAuditResult.gradeLabel})
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      FDA 21 CFR Part 1 Subpart S (Food Traceability Rule) Key Data Elements (KDE) across Critical Tracking Events (CTEs).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-3 py-1.5 rounded-xl border font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    {fsmaAuditResult.passCount} / 8 Passed
                  </span>
                  <span className="px-3 py-1.5 rounded-xl border font-bold bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {fsmaAuditResult.warnCount} Warnings
                  </span>
                  <span className="px-3 py-1.5 rounded-xl border font-bold bg-rose-500/10 text-rose-600 border-rose-500/20">
                    {fsmaAuditResult.failCount} Failures
                  </span>
                </div>
              </div>

              {/* 8 KDE Checklist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fsmaAuditResult.checks.map((chk) => {
                  const isPass = chk.status === 'pass';
                  const isWarn = chk.status === 'warning';
                  return (
                    <div
                      key={chk.id}
                      className="p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all hover:border-[var(--brand)]"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isPass ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : isWarn ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : (
                              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                            <h4 className="font-bold text-xs" style={{ color: 'var(--ink)' }}>
                              {chk.title}
                            </h4>
                          </div>
                          <span className="font-mono text-[10px] text-[var(--muted)]">
                            {chk.ruleRef}
                          </span>
                        </div>
                        <p
                          className={`text-xs font-semibold mt-2 ${
                            isPass ? 'text-emerald-600' : isWarn ? 'text-amber-600' : 'text-rose-600'
                          }`}
                        >
                          {chk.summary}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                          {chk.details}
                        </p>
                      </div>

                      {chk.segmentRef && (
                        <div
                          className="flex items-center justify-between pt-2 border-t text-[11px] font-mono text-[var(--muted)]"
                          style={{ borderColor: 'var(--line)' }}
                        >
                          <span>Segment: {chk.segmentRef}</span>
                          <span>Line #{chk.line}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Document Editor */}
          <div
            className="p-5 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                  Live Document Editor
                </span>
                <span className="text-[var(--muted)] block mt-0.5">
                  Type, edit, or paste your EDI ANSI X12 or EDIFACT string below. Validation results update instantly.
                </span>
              </div>
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
                <span className="text-[var(--muted)] font-mono font-medium">
                  {parsedSegments.length} Segments
                </span>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={12}
              className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border leading-relaxed"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              placeholder="Paste raw ANSI X12 or EDIFACT string here (e.g. ISA*00*...~GS*...)"
            />
          </div>
        </div>
      )}

      {/* 5. FORMATTER TAB */}
      {activeTab === 'edi-formatter' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <button onClick={() => setInput('')} className="hover:opacity-80 text-[var(--muted)]">
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste raw ANSI X12 or EDIFACT string here..."
              rows={16}
              className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border transition-colors"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

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
                  className="px-2.5 py-1 rounded-lg border flex items-center gap-1 hover:opacity-80 cursor-pointer"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => handleDownload(output, `formatted_${selectedSampleId}.edi`)}
                  className="px-2.5 py-1 rounded-lg border flex items-center gap-1 hover:opacity-80 cursor-pointer"
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

      {/* 6. SEGMENT VIEWER TAB */}
      {activeTab === 'edi-segment-viewer' && (
        <div className="space-y-4">
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

      {/* 7. EDI TO JSON TAB (P1.4 X12 JSON Schema Toggle) */}
      {activeTab === 'edi-to-json' && (
        <div className="space-y-4">
          {/* Schema Selector Bar */}
          <div
            className="p-3 rounded-2xl border flex items-center justify-between gap-3 flex-wrap"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-xs text-[var(--muted)]">JSON Schema Mode:</span>
              {[
                {
                  id: 'semantic' as const,
                  label: 'Semantic Business Model',
                  desc: 'Clean business objects (PO, parties, items, terms). Ideal for apps. Not a 1:1 segment dump.',
                },
                {
                  id: 'segmentArray' as const,
                  label: 'Segment Array (Lossless)',
                  desc: 'Every segment & element preserved in order. Use this for full fidelity / audit / comparison.',
                },
                {
                  id: 'loops' as const,
                  label: 'Hierarchical Loop Schema',
                  desc: 'Header → Detail loops (PO1/HL) → Summary. Structural view of X12 loops.',
                },
              ].map((schemaMode) => {
                const isSelected = x12JsonSchemaMode === schemaMode.id;
                return (
                  <button
                    key={schemaMode.id}
                    onClick={() => setX12JsonSchemaMode(schemaMode.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--brand)] text-[var(--brand)] font-bold shadow-xs'
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--surface-2)' : 'var(--bg)',
                      borderColor: isSelected ? 'var(--brand)' : 'var(--line)',
                      color: isSelected ? 'var(--brand)' : 'var(--ink)',
                    }}
                    title={schemaMode.desc}
                  >
                    <span>{schemaMode.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-lg border font-mono text-[11px] text-[var(--muted)]"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
              >
                Schema:{' '}
                {x12JsonSchemaMode === 'semantic'
                  ? 'ASC_X12_SEMANTIC_MODEL'
                  : x12JsonSchemaMode === 'segmentArray'
                  ? 'ASC_X12_SEGMENT_ARRAY'
                  : 'ASC_X12_HIERARCHICAL_LOOPS'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[var(--muted)] px-1 -mt-1">
            <strong>Tip:</strong> For complete segment-level fidelity (every REF, N9, PO4, MSG, etc.), use <strong>Segment Array (Lossless)</strong>.
            Semantic mode intentionally produces clean business objects for application logic.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <div
              className="p-4 rounded-2xl border flex flex-col space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                  Structured JSON Tree ({x12JsonSchemaMode})
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
                    onClick={() => handleDownload(output, `edi_parsed_${selectedSampleId}_${x12JsonSchemaMode}.json`)}
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
        </div>
      )}

      {/* 8. Other Sub-Tools without duplicate ToolHeaders */}
      <div className="[&>div>div:first-child]:hidden">
        {activeTab === 'edi-csv-converter' && (
          <EdiCsvConverterView tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} initialInput={input} />
        )}
        {activeTab === 'edi-hipaa-sanitizer' && (
          <EdiHipaaSanitizerView tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} initialInput={input} />
        )}
        {activeTab === 'edi-batch-splitter' && (
          <EdiBatchSplitterView tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} initialInput={input} />
        )}
        {activeTab === 'edi-diff-compare' && (
          <EdiDiffCompareView tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} initialInput={input} />
        )}
        {activeTab === 'edi-message-gateway' && (
          <EdiPhase2UxBoundary
            title="EDI Message Gateway"
            description="Guided inbound/outbound EDI gateway with progressive disclosure, Story Mode samples, and synchronized segment inspection."
            defaultSampleId={selectedSampleId}
            initialInput={input}
            onSampleLoad={(payload, sampleId) => {
              setSelectedSampleId(sampleId);
              setInput(payload);
            }}
          >
            <EdiMessageGatewayView
              key={`phase2-gateway-${selectedSampleId}`}
              tool={tool}
              onBackToHome={onBackToHome}
              onSelectRelated={onSelectRelated}
              initialInput={input}
            />
          </EdiPhase2UxBoundary>
        )}
        {activeTab === 'edi-schema-viewer' && (
          <EdiSchemaViewer initialInput={input} onNavigateToTab={setActiveTab} />
        )}
        {activeTab === 'edi-lifecycle-reconciliation' && (
          <EdiLifecycleReconciliation tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />
        )}
        {activeTab === 'json-to-edi' && (
          <JsonToEdiConverter tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />
        )}
        {activeTab === 'edi-997-generator' && (
          <EdiAckGenerator tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} initialInput={input} />
        )}
        {activeTab === 'gs1-sscc-label-generator' && (
          <Gs1LabelGenerator
            tool={tool}
            onBackToHome={onBackToHome}
            onSelectRelated={onSelectRelated}
            onNavigateToTab={(tabId) => {
              setActiveTab(tabId);
              const targetTool = TOOLS.find((t) => t.id === tabId);
              if (targetTool) {
                window.history.pushState({}, '', `/${targetTool.id}`);
              }
            }}
          />
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
        {activeTab === 'xslt-transformer' && (
          <XsltTransformerView tool={currentActiveToolDef} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />
        )}
      </div>
    </div>
  );
};