import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Search,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Code2,
  FileText,
  Info,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import {
  COMPREHENSIVE_SEGMENT_DICTIONARY,
  EDI_TRANSACTIONS,
} from '../../data/ediDictionary';
import { SmartDownload } from '../common/SmartDownload';

interface EdiSchemaViewerProps {
  initialInput?: string;
  onNavigateToTab?: (tabId: string) => void;
}

interface ElementDef {
  id: string; // e.g. "BEG01"
  index: number;
  name: string;
  value: string;
  type: string; // "ID", "AN", "DT", "TM", "N0", "R"
  requirement: 'M' | 'O' | 'C';
  codeMeaning?: string;
}

interface SegmentNode {
  id: string; // unique ID
  tag: string;
  name: string;
  lineNumber: number;
  raw: string;
  elements: ElementDef[];
  loopCategory: 'Interchange' | 'Functional Group' | 'Header' | 'Detail' | 'Summary';
  hlLevel?: string; // S, O, P, I
}

interface LoopGroup {
  id: string;
  title: string;
  category: 'Interchange' | 'Functional Group' | 'Header' | 'Detail' | 'Summary';
  segments: SegmentNode[];
}

// Well-known element definitions for common EDI segments
const ELEMENT_SPECS: Record<string, Array<{ name: string; type: string; req: 'M' | 'O' | 'C'; codes?: Record<string, string> }>> = {
  ISA: [
    { name: 'Authorization Information Qualifier', type: 'ID', req: 'M', codes: { '00': 'No Authorization Information Present', '03': 'Additional Data Identification' } },
    { name: 'Authorization Information', type: 'AN', req: 'M' },
    { name: 'Security Information Qualifier', type: 'ID', req: 'M', codes: { '00': 'No Security Information Present', '01': 'Password' } },
    { name: 'Security Information', type: 'AN', req: 'M' },
    { name: 'Interchange ID Qualifier (Sender)', type: 'ID', req: 'M', codes: { '01': 'Duns (Dun & Bradstreet)', '14': 'EAN / GLN', 'ZZ': 'Mutually Defined' } },
    { name: 'Interchange Sender ID', type: 'AN', req: 'M' },
    { name: 'Interchange ID Qualifier (Receiver)', type: 'ID', req: 'M', codes: { '01': 'Duns', '14': 'EAN / GLN', 'ZZ': 'Mutually Defined' } },
    { name: 'Interchange Receiver ID', type: 'AN', req: 'M' },
    { name: 'Interchange Date', type: 'DT', req: 'M' },
    { name: 'Interchange Time', type: 'TM', req: 'M' },
    { name: 'Repetition Separator', type: 'AN', req: 'M' },
    { name: 'Interchange Control Version', type: 'ID', req: 'M', codes: { '00401': 'Standards Approved by ANSI ASC X12 Release 004010', '00501': 'Release 005010' } },
    { name: 'Interchange Control Number', type: 'N0', req: 'M' },
    { name: 'Acknowledgment Requested', type: 'ID', req: 'M', codes: { '0': 'No Interchange Acknowledgment Requested', '1': 'Interchange Acknowledgment Requested (TA1)' } },
    { name: 'Usage Indicator', type: 'ID', req: 'M', codes: { 'P': 'Production Data', 'T': 'Test Data', 'I': 'Information' } },
    { name: 'Component Element Separator', type: 'AN', req: 'M' },
  ],
  GS: [
    { name: 'Functional Identifier Code', type: 'ID', req: 'M', codes: { 'PO': 'Purchase Order (850)', 'PR': 'Purchase Order Acknowledgment (855)', 'SH': 'Ship Notice/Manifest (856)', 'IN': 'Invoice (810)', 'FA': 'Functional Acknowledgment (997)' } },
    { name: 'Application Sender Code', type: 'AN', req: 'M' },
    { name: 'Application Receiver Code', type: 'AN', req: 'M' },
    { name: 'Date', type: 'DT', req: 'M' },
    { name: 'Time', type: 'TM', req: 'M' },
    { name: 'Group Control Number', type: 'N0', req: 'M' },
    { name: 'Responsible Agency Code', type: 'ID', req: 'M', codes: { 'X': 'Accredited Standards Committee X12', 'T': 'Transportation Data Coordinating Committee' } },
    { name: 'Version / Release ID Code', type: 'AN', req: 'M', codes: { '004010': 'Draft Standards Release 004010', '005010': 'Draft Standards Release 005010' } },
  ],
  ST: [
    { name: 'Transaction Set Identifier Code', type: 'ID', req: 'M', codes: { '850': 'Purchase Order', '855': 'PO Acknowledgment', '856': 'Ship Notice / Manifest (ASN)', '810': 'Invoice', '997': 'Functional Acknowledgment', '820': 'Payment Order', '204': 'Motor Carrier Load Tender' } },
    { name: 'Transaction Set Control Number', type: 'AN', req: 'M' },
    { name: 'Implementation Convention Reference', type: 'AN', req: 'O' },
  ],
  BEG: [
    { name: 'Transaction Set Purpose Code', type: 'ID', req: 'M', codes: { '00': 'Original', '01': 'Cancellation', '04': 'Change', '05': 'Replace', '07': 'Duplicate' } },
    { name: 'Purchase Order Type Code', type: 'ID', req: 'M', codes: { 'NE': 'New Order', 'SA': 'Stand-alone Order', 'RL': 'Release Order', 'DS': 'Drop Ship', 'BK': 'Blanket Order' } },
    { name: 'Purchase Order Number', type: 'AN', req: 'M' },
    { name: 'Release Number', type: 'AN', req: 'O' },
    { name: 'Purchase Order Date', type: 'DT', req: 'M' },
    { name: 'Contract Number', type: 'AN', req: 'O' },
  ],
  BAK: [
    { name: 'Transaction Set Purpose Code', type: 'ID', req: 'M', codes: { '00': 'Original', '06': 'Confirmation' } },
    { name: 'Acknowledgment Type', type: 'ID', req: 'M', codes: { 'AD': 'Acknowledge - With Detail, No Change', 'AC': 'Acknowledge - With Detail and Change', 'RD': 'Reject with Detail', 'AT': 'Accepted' } },
    { name: 'Purchase Order Number', type: 'AN', req: 'M' },
    { name: 'Purchase Order Date', type: 'DT', req: 'M' },
  ],
  BIG: [
    { name: 'Invoice Date', type: 'DT', req: 'M' },
    { name: 'Invoice Number', type: 'AN', req: 'M' },
    { name: 'Purchase Order Date', type: 'DT', req: 'O' },
    { name: 'Purchase Order Number', type: 'AN', req: 'O' },
  ],
  BSN: [
    { name: 'Transaction Set Purpose Code', type: 'ID', req: 'M', codes: { '00': 'Original', '01': 'Cancellation', '04': 'Change' } },
    { name: 'Shipment Identification (ASN #)', type: 'AN', req: 'M' },
    { name: 'Date', type: 'DT', req: 'M' },
    { name: 'Time', type: 'TM', req: 'M' },
    { name: 'Hierarchical Structure Code', type: 'ID', req: 'O', codes: { '0001': 'Shipment, Order, Packaging, Item (SOPI)', '0002': 'Shipment, Order, Item (SOI)' } },
  ],
  CUR: [
    { name: 'Entity Identifier Code', type: 'ID', req: 'M', codes: { 'BY': 'Buying Party', 'SE': 'Selling Party', 'PR': 'Payer' } },
    { name: 'Currency Code', type: 'ID', req: 'M', codes: { 'USD': 'US Dollar', 'CAD': 'Canadian Dollar', 'EUR': 'Euro', 'GBP': 'British Pound', 'INR': 'Indian Rupee', 'JPY': 'Japanese Yen', 'AUD': 'Australian Dollar' } },
  ],
  REF: [
    { name: 'Reference Identification Qualifier', type: 'ID', req: 'M', codes: { 'DP': 'Department Number', 'IA': 'Internal Vendor Number', 'IT': 'Customer Order Number', 'PO': 'Purchase Order', 'BM': 'Bill of Lading', 'LT': 'Lot Number', 'VN': 'Vendor Order Number' } },
    { name: 'Reference Identification', type: 'AN', req: 'M' },
    { name: 'Description', type: 'AN', req: 'O' },
  ],
  PER: [
    { name: 'Contact Function Code', type: 'ID', req: 'M', codes: { 'BD': 'Buyer Contact', 'IC': 'Information Contact', 'OC': 'Order Contact', 'CN': 'General Contact' } },
    { name: 'Name', type: 'AN', req: 'O' },
    { name: 'Communication Number Qualifier', type: 'ID', req: 'C', codes: { 'TE': 'Telephone', 'EM': 'Electronic Mail', 'FX': 'Facsimile' } },
    { name: 'Communication Number', type: 'AN', req: 'C' },
  ],
  N1: [
    { name: 'Entity Identifier Code', type: 'ID', req: 'M', codes: { 'BY': 'Buying Party (Buyer)', 'ST': 'Ship To', 'BT': 'Bill To', 'VN': 'Vendor', 'SU': 'Supplier', 'SF': 'Ship From', 'WH': 'Warehouse' } },
    { name: 'Name', type: 'AN', req: 'O' },
    { name: 'Identification Code Qualifier', type: 'ID', req: 'C', codes: { '1': 'D-U-N-S Number', '9': 'D-U-N-S with 4-character suffix', '91': 'Assigned by Seller', '92': 'Assigned by Buyer', 'UL': 'Global Location Number (GLN)' } },
    { name: 'Identification Code', type: 'AN', req: 'C' },
  ],
  N3: [
    { name: 'Address Information (Line 1)', type: 'AN', req: 'M' },
    { name: 'Address Information (Line 2)', type: 'AN', req: 'O' },
  ],
  N4: [
    { name: 'City Name', type: 'AN', req: 'O' },
    { name: 'State or Province Code', type: 'ID', req: 'O' },
    { name: 'Postal Code', type: 'ID', req: 'O' },
    { name: 'Country Code', type: 'ID', req: 'O' },
  ],
  PO1: [
    { name: 'Assigned Identification (Line #)', type: 'AN', req: 'O' },
    { name: 'Quantity Ordered', type: 'R', req: 'C' },
    { name: 'Unit or Basis for Measurement Code', type: 'ID', req: 'C', codes: { 'EA': 'Each', 'CA': 'Case', 'BX': 'Box', 'CT': 'Carton', 'DZ': 'Dozen', 'KG': 'Kilogram', 'LB': 'Pound', 'PC': 'Piece', 'PK': 'Package' } },
    { name: 'Unit Price', type: 'R', req: 'C' },
    { name: 'Basis of Unit Price Code', type: 'ID', req: 'O', codes: { 'PE': 'Price per Each', 'WE': 'Wholesale', 'SR': 'Suggested Retail' } },
    { name: 'Product/Service ID Qualifier 1', type: 'ID', req: 'C', codes: { 'VN': 'Vendor Item Number', 'SK': 'SKU', 'UP': 'UPC (12 digits)', 'EN': 'EAN/UCC-13', 'UK': 'GTIN-14', 'IN': 'Buyer Item Number' } },
    { name: 'Product/Service ID 1', type: 'AN', req: 'C' },
    { name: 'Product/Service ID Qualifier 2', type: 'ID', req: 'C' },
    { name: 'Product/Service ID 2', type: 'AN', req: 'C' },
    { name: 'Product/Service ID Qualifier 3', type: 'ID', req: 'C' },
    { name: 'Product/Service ID 3', type: 'AN', req: 'C' },
  ],
  PID: [
    { name: 'Item Description Type', type: 'ID', req: 'M', codes: { 'F': 'Free-form', 'S': 'Structured' } },
    { name: 'Product/Process Characteristic Code', type: 'ID', req: 'O', codes: { '08': 'Product', '73': 'Vendor Color', '74': 'Vendor Size' } },
    { name: 'Agency Qualifier Code', type: 'ID', req: 'O' },
    { name: 'Product Description Code', type: 'AN', req: 'O' },
    { name: 'Description (Free-form text)', type: 'AN', req: 'C' },
  ],
  PO4: [
    { name: 'Pack', type: 'N0', req: 'O' },
    { name: 'Size', type: 'R', req: 'O' },
    { name: 'Unit of Measure', type: 'ID', req: 'C' },
    { name: 'Packaging Code', type: 'ID', req: 'O', codes: { 'CTN': 'Carton', 'BOX': 'Box', 'PLT': 'Pallet' } },
    { name: 'Weight Qualifier', type: 'ID', req: 'O', codes: { 'G': 'Gross Weight', 'N': 'Net Weight' } },
    { name: 'Gross Weight per Pack', type: 'R', req: 'C' },
    { name: 'Unit of Measure (Weight)', type: 'ID', req: 'C', codes: { 'LB': 'Pounds', 'KG': 'Kilograms' } },
  ],
  HL: [
    { name: 'Hierarchical ID Number', type: 'AN', req: 'M' },
    { name: 'Hierarchical Parent ID Number', type: 'AN', req: 'O' },
    { name: 'Hierarchical Level Code', type: 'ID', req: 'M', codes: { 'S': 'Shipment Level', 'O': 'Order Level', 'P': 'Pack / Tare / Pallet Level', 'I': 'Item Level' } },
    { name: 'Hierarchical Child Code', type: 'ID', req: 'O', codes: { '0': 'No Subordinate HL Present', '1': 'Additional Subordinate HL Present' } },
  ],
  MAN: [
    { name: 'Marks and Numbers Qualifier', type: 'ID', req: 'M', codes: { 'GM': 'SSCC-18 and Application Identifier (GS1-128)', 'UC': 'U.P.C. Shipping Container Code', 'SM': 'Shipper-Assigned' } },
    { name: 'Marks and Numbers (Barcode / SSCC-18)', type: 'AN', req: 'M' },
  ],
  CTT: [
    { name: 'Number of Line Items', type: 'N0', req: 'M' },
    { name: 'Hash Total (Quantity Sum)', type: 'R', req: 'O' },
  ],
  SE: [
    { name: 'Number of Included Segments', type: 'N0', req: 'M' },
    { name: 'Transaction Set Control Number', type: 'AN', req: 'M' },
  ],
  GE: [
    { name: 'Number of Transaction Sets Included', type: 'N0', req: 'M' },
    { name: 'Group Control Number', type: 'N0', req: 'M' },
  ],
  IEA: [
    { name: 'Number of Included Functional Groups', type: 'N0', req: 'M' },
    { name: 'Interchange Control Number', type: 'N0', req: 'M' },
  ],
};

export const EdiSchemaViewer: React.FC<EdiSchemaViewerProps> = ({
  initialInput = '',
  onNavigateToTab,
}) => {
  const [ediText, setEdiText] = useState<string>(initialInput || EDI_TRANSACTIONS[0].samplePayload);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLoops, setExpandedLoops] = useState<Record<string, boolean>>({
    Interchange: true,
    'Functional Group': true,
    Header: true,
    Detail: true,
    Summary: true,
  });
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementDef | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showOnlyPopulated, setShowOnlyPopulated] = useState<boolean>(false);

  // Sync if initialInput changes
  useEffect(() => {
    if (initialInput && initialInput.trim()) {
      setEdiText(initialInput);
    }
  }, [initialInput]);

  // Delimiter detection
  const delimiters = useMemo(() => {
    let segTerm = '~';
    let elemSep = '*';
    let subSep = ':';

    const trimmed = ediText.trim();
    if (trimmed.startsWith('ISA') && trimmed.length >= 106) {
      elemSep = trimmed.charAt(3);
      const p105 = trimmed.charAt(105);
      const p106 = trimmed.charAt(106);
      if (p105 === '\r' && p106 === '\n') segTerm = '\r\n';
      else if (p105 === '\n') segTerm = '\n';
      else if (p105 === '\r') segTerm = '\r';
      else segTerm = p105;
      subSep = trimmed.charAt(104) || ':';
      return { segTerm, elemSep, subSep };
    }

    if (trimmed.startsWith('UNA') && trimmed.length >= 9) {
      subSep = trimmed.charAt(3);
      elemSep = trimmed.charAt(4);
      segTerm = trimmed.charAt(8);
      return { segTerm, elemSep, subSep };
    }

    if (trimmed.includes('~')) segTerm = '~';
    else if (trimmed.includes('\n')) segTerm = '\n';
    else if (trimmed.includes("'")) segTerm = "'";

    if (trimmed.includes('*')) elemSep = '*';
    else if (trimmed.includes('+')) elemSep = '+';

    return { segTerm, elemSep, subSep };
  }, [ediText]);

  // Parse EDI into structured loop groups and segment nodes
  const loopGroups: LoopGroup[] = useMemo(() => {
    const lines = ediText
      .split(delimiters.segTerm === '\r\n' ? /\r\n/ : delimiters.segTerm === '\n' ? /\r?\n+/ : delimiters.segTerm)
      .map((s) => s.replace(/[\r\n]/g, '').trim())
      .filter(Boolean);

    let currentCategory: 'Interchange' | 'Functional Group' | 'Header' | 'Detail' | 'Summary' = 'Interchange';
    const groupsMap: Record<string, SegmentNode[]> = {
      Interchange: [],
      'Functional Group': [],
      Header: [],
      Detail: [],
      Summary: [],
    };

    lines.forEach((line, idx) => {
      const parts = line.split(delimiters.elemSep);
      const tag = parts[0].trim().toUpperCase();
      if (!tag) return;

      const rawElements = parts.slice(1);

      // Determine category hierarchy
      if (tag === 'ISA') {
        currentCategory = 'Interchange';
      } else if (tag === 'GS') {
        currentCategory = 'Functional Group';
      } else if (tag === 'ST') {
        currentCategory = 'Header';
      } else if (['PO1', 'IT1', 'HL', 'LIN', 'SN1'].includes(tag)) {
        currentCategory = 'Detail';
      } else if (['CTT', 'TDS', 'SE'].includes(tag)) {
        currentCategory = 'Summary';
      } else if (['GE'].includes(tag)) {
        currentCategory = 'Functional Group';
      } else if (['IEA'].includes(tag)) {
        currentCategory = 'Interchange';
      }

      // Build element definitions
      const specs = ELEMENT_SPECS[tag] || [];
      const elementDefs: ElementDef[] = rawElements.map((val, elIdx) => {
        const posStr = `${tag}${String(elIdx + 1).padStart(2, '0')}`;
        const spec = specs[elIdx];
        const valTrimmed = val.trim();
        const codeMeaning = spec?.codes && valTrimmed ? spec.codes[valTrimmed] : undefined;

        return {
          id: posStr,
          index: elIdx + 1,
          name: spec?.name || `Element ${elIdx + 1}`,
          value: valTrimmed,
          type: spec?.type || 'AN',
          requirement: spec?.req || 'O',
          codeMeaning,
        };
      });

      // Special hierarchical HL code
      let hlLevel: string | undefined;
      if (tag === 'HL' && elementDefs[2]?.value) {
        hlLevel = elementDefs[2].value;
      }

      const node: SegmentNode = {
        id: `seg_${idx}_${tag}`,
        tag,
        name: COMPREHENSIVE_SEGMENT_DICTIONARY[tag] || tag,
        lineNumber: idx + 1,
        raw: line,
        elements: elementDefs,
        loopCategory: currentCategory,
        hlLevel,
      };

      groupsMap[currentCategory].push(node);
    });

    const result: LoopGroup[] = [
      { id: 'interchange', title: 'Interchange Envelope (ISA / IEA)', category: 'Interchange', segments: groupsMap.Interchange },
      { id: 'functional_group', title: 'Functional Group Envelope (GS / GE)', category: 'Functional Group', segments: groupsMap['Functional Group'] },
      { id: 'header', title: 'Header Area (Order, Parties & Terms)', category: 'Header', segments: groupsMap.Header },
      { id: 'detail', title: 'Detail Loop (Line Items / PO1 / HL Structure)', category: 'Detail', segments: groupsMap.Detail },
      { id: 'summary', title: 'Summary Loop (Totals & Control Counts)', category: 'Summary', segments: groupsMap.Summary },
    ];
    return result.filter((g) => g.segments.length > 0);
  }, [ediText, delimiters]);

  // Select first segment by default if none selected
  useEffect(() => {
    if (!selectedSegmentId && loopGroups.length > 0 && loopGroups[0].segments.length > 0) {
      setSelectedSegmentId(loopGroups[0].segments[0].id);
      if (loopGroups[0].segments[0].elements.length > 0) {
        setSelectedElement(loopGroups[0].segments[0].elements[0]);
      }
    }
  }, [loopGroups]);

  // Current selected segment object
  const activeSegmentNode = useMemo(() => {
    for (const group of loopGroups) {
      const found = group.segments.find((s) => s.id === selectedSegmentId);
      if (found) return found;
    }
    return null;
  }, [loopGroups, selectedSegmentId]);

  // Filtered groups based on search query
  const filteredLoopGroups = useMemo(() => {
    if (!searchQuery.trim()) return loopGroups;
    const q = searchQuery.toLowerCase().trim();

    return loopGroups
      .map((group) => {
        const matchingSegments = group.segments.filter((s) => {
          if (s.tag.toLowerCase().includes(q)) return true;
          if (s.name.toLowerCase().includes(q)) return true;
          return s.elements.some(
            (el) =>
              el.id.toLowerCase().includes(q) ||
              el.name.toLowerCase().includes(q) ||
              el.value.toLowerCase().includes(q) ||
              (el.codeMeaning && el.codeMeaning.toLowerCase().includes(q))
          );
        });
        return { ...group, segments: matchingSegments };
      })
      .filter((g) => g.segments.length > 0);
  }, [loopGroups, searchQuery]);

  const toggleLoop = (cat: string) => {
    setExpandedLoops((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="p-5 rounded-2xl border space-y-2"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl text-white"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                EDI Hierarchical Schema Viewer & Element Lookup
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Explore ANSI X12 loops, segment definitions, element positions (BEG01, PO102), and code-list meanings with synchronized raw text highlighting.
              </p>
            </div>
          </div>

          {/* Quick sample loader dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              Sample:
            </span>
            <select
              onChange={(e) => {
                const sample = EDI_TRANSACTIONS.find((t) => t.id === e.target.value);
                if (sample) setEdiText(sample.samplePayload);
              }}
              className="px-2.5 py-1.5 rounded-xl border text-xs outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--line)',
                color: 'var(--ink)',
              }}
            >
              {EDI_TRANSACTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} - {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toolbar: Search & View Toggles */}
        <div className="flex items-center justify-between gap-3 pt-2 flex-wrap border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search segment (BEG), element (PO102), or term..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--line)',
                color: 'var(--ink)',
              }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer select-none" style={{ color: 'var(--muted)' }}>
              <input
                type="checkbox"
                checked={showOnlyPopulated}
                onChange={(e) => setShowOnlyPopulated(e.target.checked)}
                className="rounded accent-[var(--brand)]"
              />
              <span>Hide empty elements</span>
            </label>

            <button
              onClick={() => {
                const allOpen = Object.values(expandedLoops).every(Boolean);
                const nextState: Record<string, boolean> = {};
                ['Interchange', 'Functional Group', 'Header', 'Detail', 'Summary'].forEach((k) => {
                  nextState[k] = !allOpen;
                });
                setExpandedLoops(nextState);
              }}
              className="px-2.5 py-1 rounded-lg border hover:opacity-80 transition-opacity font-medium cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--brand)' }}
            >
              Toggle All Loops
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left = Hierarchical Tree, Right = Element Inspector & Synchronized Raw View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Tree View (7 cols) */}
        <div
          className="lg:col-span-7 p-4 rounded-2xl border space-y-4 shadow-sm max-h-[750px] overflow-y-auto"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              HIERARCHICAL STRUCTURE (LOOPS & SEGMENTS)
            </span>
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
              {loopGroups.reduce((acc, g) => acc + g.segments.length, 0)} Segments
            </span>
          </div>

          <div className="space-y-3">
            {filteredLoopGroups.map((group) => {
              const isExpanded = expandedLoops[group.category] ?? true;

              return (
                <div
                  key={group.id}
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}
                >
                  {/* Loop Group Header */}
                  <button
                    onClick={() => toggleLoop(group.category)}
                    className="w-full p-2.5 flex items-center justify-between text-xs font-bold hover:opacity-90 transition-all cursor-pointer select-none"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--ink)' }}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[var(--brand)]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                      )}
                      <span>{group.title}</span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono border"
                      style={{
                        backgroundColor: 'var(--bg)',
                        borderColor: 'var(--line)',
                        color: 'var(--muted)',
                      }}
                    >
                      {group.segments.length}
                    </span>
                  </button>

                  {/* Segments within this Loop */}
                  {isExpanded && (
                    <div className="p-2 space-y-1.5" style={{ backgroundColor: 'var(--bg)' }}>
                      {group.segments.map((seg) => {
                        const isSelected = seg.id === selectedSegmentId;

                        return (
                          <div
                            key={seg.id}
                            onClick={() => {
                              setSelectedSegmentId(seg.id);
                              if (seg.elements.length > 0) {
                                setSelectedElement(seg.elements[0]);
                              }
                            }}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-[var(--brand)] shadow-sm'
                                : 'hover:opacity-90'
                            }`}
                            style={{
                              backgroundColor: isSelected ? 'var(--surface-2)' : 'var(--surface)',
                              borderColor: isSelected ? 'var(--brand)' : 'var(--line)',
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="px-2 py-0.5 rounded-md font-mono text-xs font-bold text-white shadow-xs"
                                  style={{
                                    backgroundColor:
                                      seg.tag === 'ST' || seg.tag === 'SE'
                                        ? 'var(--brand)'
                                        : seg.tag === 'PO1' || seg.tag === 'HL'
                                        ? '#10b981'
                                        : '#64748b',
                                  }}
                                >
                                  {seg.tag}
                                </span>
                                <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
                                  {seg.name}
                                </span>
                                {seg.hlLevel && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-600 font-mono font-bold">
                                    HL Level: {seg.hlLevel}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                                Line {seg.lineNumber}
                              </span>
                            </div>

                            {/* Brief element tags summary */}
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              {seg.elements.map((el) => {
                                if (showOnlyPopulated && !el.value) return null;
                                return (
                                  <span
                                    key={el.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSegmentId(seg.id);
                                      setSelectedElement(el);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${
                                      selectedElement?.id === el.id && isSelected
                                        ? 'ring-1 ring-[var(--brand)] font-bold text-[var(--brand)]'
                                        : 'text-[var(--muted)]'
                                    }`}
                                    style={{
                                      backgroundColor: 'var(--surface-2)',
                                      borderColor: 'var(--line)',
                                    }}
                                    title={`${el.name}: ${el.value || '(empty)'}`}
                                  >
                                    {el.id}: {el.value ? (el.value.length > 12 ? el.value.slice(0, 10) + '…' : el.value) : '—'}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Details Panel: Element Inspector & Source Highlighting (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Element Inspector Card */}
          {activeSegmentNode ? (
            <div
              className="p-5 rounded-2xl border space-y-4 shadow-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-mono font-bold text-white"
                    style={{ backgroundColor: 'var(--brand)' }}
                  >
                    {activeSegmentNode.tag}
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
                    {activeSegmentNode.name}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyText(activeSegmentNode.raw, 'seg_raw')}
                  className="text-xs flex items-center gap-1 font-medium hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ color: 'var(--brand)' }}
                >
                  {copiedId === 'seg_raw' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'seg_raw' ? 'Copied' : 'Copy Segment'}</span>
                </button>
              </div>

              {/* Elements Table */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activeSegmentNode.elements.map((el) => {
                  const isElSelected = selectedElement?.id === el.id;

                  return (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElement(el)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isElSelected ? 'ring-2 ring-[var(--brand)] bg-[var(--surface-2)]' : 'hover:opacity-90'
                      }`}
                      style={{
                        backgroundColor: isElSelected ? 'var(--surface-2)' : 'var(--bg)',
                        borderColor: isElSelected ? 'var(--brand)' : 'var(--line)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold" style={{ color: 'var(--brand)' }}>
                            {el.id}
                          </span>
                          <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>
                            {el.name}
                          </span>
                        </div>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--line)',
                            color: 'var(--muted)',
                          }}
                        >
                          {el.type} • {el.requirement}
                        </span>
                      </div>

                      {/* Element Value & Code Meaning */}
                      <div className="mt-1 flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold" style={{ color: el.value ? 'var(--ink)' : 'var(--muted)' }}>
                          Value: {el.value || '<empty>'}
                        </span>
                        {el.value && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyText(el.value, el.id);
                            }}
                            className="text-[var(--muted)] hover:text-[var(--brand)] p-0.5"
                            title="Copy element value"
                          >
                            {copiedId === el.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>

                      {el.codeMeaning && (
                        <div className="mt-1 text-[11px] font-sans p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                          <strong>Standard Definition:</strong> {el.codeMeaning}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className="p-8 rounded-2xl border text-center text-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--muted)' }}
            >
              Select any segment from the left hierarchical tree to view element documentation and standard code values.
            </div>
          )}

          {/* Synchronized Raw Source Viewer with Highlight */}
          <div
            className="p-5 rounded-2xl border space-y-2 shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[var(--brand)]" />
                <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
                  SYNCHRONIZED RAW EDI SOURCE
                </span>
              </div>
              <span className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                Active: Line {activeSegmentNode?.lineNumber || 1}
              </span>
            </div>

            <div
              className="p-3 rounded-xl border font-mono text-xs overflow-x-auto max-h-56 leading-relaxed bg-slate-950 text-slate-200"
              style={{ borderColor: 'var(--line)' }}
            >
              {ediText.split(delimiters.segTerm === '\r\n' ? /\r\n/ : delimiters.segTerm === '\n' ? /\r?\n+/ : delimiters.segTerm).map((line, idx) => {
                const isHighlighted = activeSegmentNode?.lineNumber === idx + 1;
                return (
                  <div
                    key={idx}
                    className={`px-2 py-0.5 rounded transition-all ${
                      isHighlighted ? 'bg-amber-400/20 text-amber-300 font-bold border-l-2 border-amber-400' : ''
                    }`}
                  >
                    <span className="text-slate-500 select-none mr-3 inline-block w-6 text-right">
                      {idx + 1}
                    </span>
                    <span>{line}{delimiters.segTerm}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart File Name & Download integration */}
          <SmartDownload
            file={ediText}
            extension="edi"
            operation="edi-schema-viewer"
            toolContext="edi"
            metadata={{
              transactionType: activeSegmentNode?.tag === 'ST' ? activeSegmentNode.elements[0]?.value : '850',
              controlNumber: activeSegmentNode?.elements.find((e) => e.id.endsWith('02'))?.value,
            }}
            label="Download EDI Payload"
          />
        </div>
      </div>
    </div>
  );
};
