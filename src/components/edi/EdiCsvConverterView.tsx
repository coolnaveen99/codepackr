import React, { useState, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  ArrowLeftRight,
  Download,
  Copy,
  Check,
  Sparkles,
  Upload,
  RotateCcw,
  Table,
  FileCode2,
  Sliders,
  CheckCircle2,
  Search,
  ExternalLink,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { useCurrency } from '../../lib/CurrencyContext';
import { downloadFile } from '../../lib/smartDownload';

interface EdiCsvConverterViewProps {
  tool: ToolDef;
  onBackToHome: () => void;
  onSelectRelated: (t: ToolDef) => void;
  initialInput?: string;
}

interface FlattenedRow {
  poNumber: string;
  poDate: string;
  vendorName: string;
  shipToName: string;
  shipToCity: string;
  shipToState: string;
  shipToZip: string;
  lineNo: string;
  sku: string;
  upc: string;
  description: string;
  qty: number;
  uom: string;
  unitPrice: number;
  lineTotal: number;
}

export const EdiCsvConverterView: React.FC<EdiCsvConverterViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const { formatAmount } = useCurrency();
  const [activeDirection, setActiveDirection] = useState<'edi-to-csv' | 'csv-to-edi'>('edi-to-csv');

  // -------------------------------------------------------------
  // EDI TO CSV STATE
  // -------------------------------------------------------------
  const [ediInput, setEdiInput] = useState<string>(initialInput || '');
  const [flattenMode, setFlattenMode] = useState<'line-items' | 'headers' | 'raw-matrix'>('line-items');
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);
  const [tableSearch, setTableSearch] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // CSV TO EDI STATE
  // -------------------------------------------------------------
  const [csvInput, setCsvInput] = useState<string>('');
  const [targetTxType, setTargetTxType] = useState<'850' | '810'>('850');
  const [senderId, setSenderId] = useState<string>('ACMEBUYER');
  const [receiverId, setReceiverId] = useState<string>('SUPPLIERCO');
  const [testProdIndicator, setTestProdIndicator] = useState<'P' | 'T'>('P');
  const [copiedEdi, setCopiedEdi] = useState<boolean>(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Preloaded Samples
  const loadSample850Edi = () => {
    const sample = `ISA*00*          *00*          *ZZ*ACMEBUYER      *ZZ*SUPPLIERCO     *260912*1030*U*00401*000000850*0*P*>~
GS*PO*ACMEBUYER*SUPPLIERCO*20260912*1030*85001*X*004010~
ST*850*0001~
BEG*00*NE*PO-994820**20260912~
CUR*SE*USD~
REF*DP*042~
N1*BY*ACME GLOBAL PURCHASING*9*0012345678901~
N3*100 CORPORATE PARKWAY*SUITE 400~
N4*CHICAGO*IL*60601~
N1*ST*ACME FULFILLMENT DC #8*9*0098765432100~
N3*4500 LOGISTICS BOULEVARD~
N4*INDIANAPOLIS*IN*46241~
N1*VN*PRECISION INDUSTRIAL TOOLS*92*VEND-7731~
N3*12 INDUSTRIAL WAY~
N4*DETROIT*MI*48201~
PO1*1*150*EA*45.50**VN*SKU-A101*UP*012345678905~
PID*F****24V BRUSHLESS MOTOR CONTROLLER~
PO1*2*80*EA*120.00**VN*SKU-B202*UP*012345678912~
PID*F****SMART TELEMETRY GATEWAY IP67~
PO1*3*250*EA*18.75**VN*SKU-C303*UP*012345678929~
PID*F****HIGH TORQUE MOUNTING BRACKET KIT~
PO1*4*60*EA*85.00**VN*SKU-D404*UP*012345678936~
PID*F****WATERPROOF OPTICAL ENCODER 1000PPR~
CTT*4*540~
AMT*TT*26237.50~
SE*24*0001~
GE*1*85001~
IEA*1*000000850~`;
    setEdiInput(sample);
  };

  const loadSample810Edi = () => {
    const sample = `ISA*00*          *00*          *ZZ*SUPPLIERCO     *ZZ*ACMEBUYER      *260915*1400*U*00401*000000810*0*P*>~
GS*IN*SUPPLIERCO*ACMEBUYER*20260915*1400*81001*X*004010~
ST*810*0001~
BIG*20260915*INV-2026-8812*20260912*PO-994820~
CUR*SE*USD~
N1*RE*PRECISION INDUSTRIAL TOOLS*92*VEND-7731~
N3*12 INDUSTRIAL WAY~
N4*DETROIT*MI*48201~
N1*BT*ACME GLOBAL PURCHASING*9*0012345678901~
N3*100 CORPORATE PARKWAY*SUITE 400~
N4*CHICAGO*IL*60601~
IT1*1*150*EA*45.50**VN*SKU-A101*UP*012345678905~
PID*F****24V BRUSHLESS MOTOR CONTROLLER~
IT1*2*80*EA*120.00**VN*SKU-B202*UP*012345678912~
PID*F****SMART TELEMETRY GATEWAY IP67~
TDS*1642500~
CAD*T***FEDEX FREIGHT~
CTT*2~
SE*16*0001~
GE*1*81001~
IEA*1*000000810~`;
    setEdiInput(sample);
  };

  const loadSampleCsv = () => {
    const sample = `PO_Number,PO_Date,Vendor_Name,ShipTo_Name,ShipTo_City,ShipTo_State,ShipTo_Zip,Item_No,SKU,UPC,Description,Quantity,UOM,Unit_Price
PO-88310,2026-09-12,PRECISION TOOLS,MIDWEST DC #4,CHICAGO,IL,60601,1,TOOL-001,012345678901,HEAVY DUTY DRILL PRESS,25,EA,349.00
PO-88310,2026-09-12,PRECISION TOOLS,MIDWEST DC #4,CHICAGO,IL,60601,2,TOOL-002,012345678918,CARBIDE END MILL 1/2 INCH,100,EA,28.50
PO-88310,2026-09-12,PRECISION TOOLS,MIDWEST DC #4,CHICAGO,IL,60601,3,TOOL-003,012345678925,TITANIUM COATED DRILL BIT SET,50,EA,45.00`;
    setCsvInput(sample);
  };

  // -------------------------------------------------------------
  // EDI TO CSV PARSING ENGINE
  // -------------------------------------------------------------
  const parsedData = useMemo(() => {
    if (!ediInput.trim()) {
      return { lineRows: [], headerRows: [], matrixRows: [], totals: { lines: 0, units: 0, amount: 0 } };
    }

    const text = ediInput.trim();
    const isEdifact = text.includes('UNB') || text.includes('UNH');
    const term = isEdifact ? "'" : '~';
    const sep = isEdifact ? '+' : '*';

    const segments = text
      .split(term)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((raw, idx) => {
        const parts = raw.split(sep);
        return {
          line: idx + 1,
          tag: parts[0] || '',
          elements: parts.slice(1),
          raw,
        };
      });

    // Extract headers
    let poNumber = '';
    let poDate = '';
    let vendorName = '';
    let shipToName = '';
    let shipToCity = '';
    let shipToState = '';
    let shipToZip = '';

    let currentN1Entity = '';

    const lineRows: FlattenedRow[] = [];
    const headerRows: any[] = [];
    const matrixRows: string[][] = [];

    // Matrix rows (Segment, E1, E2, ...)
    segments.forEach((seg) => {
      const row = [String(seg.line), seg.tag, ...seg.elements];
      matrixRows.push(row);
    });

    let currentLine: Partial<FlattenedRow> | null = null;
    let totalUnits = 0;
    let totalAmount = 0;

    segments.forEach((seg) => {
      const tag = seg.tag;
      const el = seg.elements;

      if (tag === 'BEG') {
        poNumber = el[2] || '';
        poDate = el[4] || '';
      } else if (tag === 'BIG') {
        poNumber = el[3] || el[1] || '';
        poDate = el[0] || '';
      } else if (tag === 'BGM') {
        poNumber = el[1] || '';
      }

      // N1 Entities
      if (tag === 'N1') {
        currentN1Entity = el[0] || '';
        const name = el[1] || '';
        if (currentN1Entity === 'VN' || currentN1Entity === 'SE' || currentN1Entity === 'RE') {
          vendorName = name;
        } else if (currentN1Entity === 'ST') {
          shipToName = name;
        }
      } else if (tag === 'N4') {
        if (currentN1Entity === 'ST') {
          shipToCity = el[0] || '';
          shipToState = el[1] || '';
          shipToZip = el[2] || '';
        }
      }

      // Line items: PO1, IT1, LIN
      if (tag === 'PO1' || tag === 'IT1') {
        if (currentLine && currentLine.sku) {
          lineRows.push(currentLine as FlattenedRow);
        }

        const lineNo = el[0] || String(lineRows.length + 1);
        const qty = parseFloat(el[1] || '0') || 0;
        const uom = el[2] || 'EA';
        const unitPrice = parseFloat(el[3] || '0') || 0;

        let sku = '';
        let upc = '';

        // Find qualifiers in PO1 (e.g. VN, UP, IN, BP, MG)
        for (let i = 5; i < el.length; i += 2) {
          const qual = el[i];
          const val = el[i + 1] || '';
          if (qual === 'VN' || qual === 'BP' || qual === 'IN') sku = val;
          if (qual === 'UP' || qual === 'UK' || qual === 'EN') upc = val;
        }
        if (!sku && el[6]) sku = el[6];

        const lineTotal = +(qty * unitPrice).toFixed(2);
        totalUnits += qty;
        totalAmount += lineTotal;

        currentLine = {
          poNumber: poNumber || 'PO-DATA',
          poDate: poDate || new Date().toISOString().split('T')[0],
          vendorName: vendorName || 'SUPPLIER',
          shipToName: shipToName || 'SHIP-TO DC',
          shipToCity,
          shipToState,
          shipToZip,
          lineNo,
          sku: sku || `ITEM-${lineNo}`,
          upc: upc || '-',
          description: '',
          qty,
          uom,
          unitPrice,
          lineTotal,
        };
      } else if (tag === 'PID' && currentLine) {
        if (el[4]) {
          currentLine.description = el[4];
        }
      }
    });

    if (currentLine && currentLine.sku) {
      lineRows.push(currentLine as FlattenedRow);
    }

    // Header Summary Row
    headerRows.push({
      poNumber: poNumber || 'N/A',
      poDate: poDate || 'N/A',
      vendor: vendorName || 'N/A',
      shipTo: shipToName || 'N/A',
      totalLines: lineRows.length,
      totalUnits,
      totalAmount: +totalAmount.toFixed(2),
    });

    return {
      lineRows,
      headerRows,
      matrixRows,
      totals: {
        lines: lineRows.length,
        units: totalUnits,
        amount: +totalAmount.toFixed(2),
      },
    };
  }, [ediInput]);

  // Generate CSV text based on mode
  const generatedCsv = useMemo(() => {
    if (flattenMode === 'line-items') {
      const headers = [
        'PO_Number',
        'PO_Date',
        'Vendor_Name',
        'ShipTo_Name',
        'ShipTo_City',
        'ShipTo_State',
        'ShipTo_Zip',
        'Line_No',
        'SKU',
        'UPC',
        'Description',
        'Quantity',
        'UOM',
        'Unit_Price',
        'Line_Total',
      ];
      const rows = parsedData.lineRows.map((r) => [
        `"${r.poNumber}"`,
        `"${r.poDate}"`,
        `"${r.vendorName}"`,
        `"${r.shipToName}"`,
        `"${r.shipToCity}"`,
        `"${r.shipToState}"`,
        `"${r.shipToZip}"`,
        `"${r.lineNo}"`,
        `"${r.sku}"`,
        `"${r.upc}"`,
        `"${r.description}"`,
        r.qty,
        `"${r.uom}"`,
        r.unitPrice.toFixed(2),
        r.lineTotal.toFixed(2),
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (flattenMode === 'headers') {
      const headers = ['PO_Number', 'PO_Date', 'Vendor', 'Ship_To', 'Total_Lines', 'Total_Units', 'Total_Amount'];
      const rows = parsedData.headerRows.map((h) => [
        `"${h.poNumber}"`,
        `"${h.poDate}"`,
        `"${h.vendor}"`,
        `"${h.shipTo}"`,
        h.totalLines,
        h.totalUnits,
        h.totalAmount.toFixed(2),
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      // Raw Segment Matrix
      const maxCols = Math.max(...parsedData.matrixRows.map((r) => r.length), 5);
      const headers = ['Line_No', 'Segment_Tag', ...Array.from({ length: maxCols - 2 }, (_, i) => `E${String(i + 1).padStart(2, '0')}`)];
      const rows = parsedData.matrixRows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(','));
      return [headers.join(','), ...rows].join('\n');
    }
  }, [parsedData, flattenMode]);

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(generatedCsv);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const handleDownloadCsv = (format: 'csv' | 'tsv') => {
    const delimiter = format === 'tsv' ? '\t' : ',';
    const content =
      format === 'tsv'
        ? generatedCsv
            .split('\n')
            .map((line) =>
              line
                .split(',')
                .map((c) => c.replace(/^"|"$/g, ''))
                .join('\t')
            )
            .join('\n')
        : generatedCsv;
    downloadFile({ file: content, filename: `edi_export_${flattenMode}.${format}` });
  };

  // -------------------------------------------------------------
  // CSV TO EDI GENERATION ENGINE
  // -------------------------------------------------------------
  const generatedEdi = useMemo(() => {
    if (!csvInput.trim()) return '';

    const lines = csvInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return '';

    // Simple CSV parser supporting quotes
    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = lines.slice(1).map(parseCsvLine);

    const findCol = (...aliases: string[]) => {
      for (const a of aliases) {
        const idx = header.findIndex((h) => h.includes(a));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const poCol = findCol('ponumber', 'po', 'order', 'docnumber');
    const dateCol = findCol('date', 'podate');
    const vendorCol = findCol('vendor', 'supplier', 'seller');
    const shipToCol = findCol('shipto', 'destination', 'dc');
    const cityCol = findCol('city');
    const stateCol = findCol('state');
    const zipCol = findCol('zip', 'postal');
    const itemCol = findCol('item', 'line');
    const skuCol = findCol('sku', 'part', 'product');
    const upcCol = findCol('upc', 'gtin', 'barcode');
    const descCol = findCol('desc', 'title', 'name');
    const qtyCol = findCol('qty', 'quantity');
    const priceCol = findCol('price', 'unitprice', 'cost');

    const firstRow = rows[0] || [];
    const poNum = poCol !== -1 ? firstRow[poCol] || 'PO-10001' : 'PO-10001';
    const rawDate = dateCol !== -1 ? firstRow[dateCol] || '20260912' : '20260912';
    const dateFmt = rawDate.replace(/[^0-9]/g, '').slice(0, 8) || '20260912';
    const dateYYMMDD = dateFmt.length >= 8 ? dateFmt.slice(2, 8) : '260912';

    const vName = vendorCol !== -1 ? firstRow[vendorCol] || 'SUPPLIER CO' : 'SUPPLIER CO';
    const sName = shipToCol !== -1 ? firstRow[shipToCol] || 'CENTRAL DC' : 'CENTRAL DC';
    const sCity = cityCol !== -1 ? firstRow[cityCol] || 'CHICAGO' : 'CHICAGO';
    const sState = stateCol !== -1 ? firstRow[stateCol] || 'IL' : 'IL';
    const sZip = zipCol !== -1 ? firstRow[zipCol] || '60601' : '60601';

    const segs: string[] = [];
    const is850 = targetTxType === '850';

    // ISA Envelope
    const padSender = senderId.padEnd(15, ' ').slice(0, 15);
    const padReceiver = receiverId.padEnd(15, ' ').slice(0, 15);
    const ctrlNum = '000000001';

    segs.push(`ISA*00*          *00*          *ZZ*${padSender}*ZZ*${padReceiver}*${dateYYMMDD}*1200*U*00401*${ctrlNum}*0*${testProdIndicator}*>`);
    segs.push(`GS*${is850 ? 'PO' : 'IN'}*${senderId}*${receiverId}*${dateFmt}*1200*1*X*004010`);
    segs.push(`ST*${is850 ? '850' : '810'}*0001`);

    let totalQty = 0;
    let totalAmt = 0;

    if (is850) {
      segs.push(`BEG*00*NE*${poNum}**${dateFmt}`);
      segs.push(`CUR*SE*USD`);
      segs.push(`N1*VN*${vName}`);
      segs.push(`N1*ST*${sName}`);
      segs.push(`N4*${sCity}*${sState}*${sZip}`);

      rows.forEach((r, idx) => {
        const lineIdx = itemCol !== -1 && r[itemCol] ? r[itemCol] : String(idx + 1);
        const qty = parseFloat(qtyCol !== -1 ? r[qtyCol] : '1') || 1;
        const price = parseFloat(priceCol !== -1 ? r[priceCol] : '10.00') || 10.0;
        const sku = skuCol !== -1 && r[skuCol] ? r[skuCol] : `SKU-${lineIdx}`;
        const upc = upcCol !== -1 && r[upcCol] ? r[upcCol] : '';
        const desc = descCol !== -1 && r[descCol] ? r[descCol] : '';

        totalQty += qty;
        totalAmt += qty * price;

        let po1 = `PO1*${lineIdx}*${qty}*EA*${price.toFixed(2)}**VN*${sku}`;
        if (upc) po1 += `*UP*${upc}`;
        segs.push(po1);

        if (desc) {
          segs.push(`PID*F****${desc.toUpperCase()}`);
        }
      });

      segs.push(`CTT*${rows.length}*${totalQty}`);
      segs.push(`AMT*TT*${totalAmt.toFixed(2)}`);
    } else {
      // 810 Invoice
      segs.push(`BIG*${dateFmt}*INV-${poNum}*${dateFmt}*${poNum}`);
      segs.push(`CUR*SE*USD`);
      segs.push(`N1*RE*${vName}`);
      segs.push(`N1*BT*${sName}`);
      segs.push(`N4*${sCity}*${sState}*${sZip}`);

      rows.forEach((r, idx) => {
        const lineIdx = itemCol !== -1 && r[itemCol] ? r[itemCol] : String(idx + 1);
        const qty = parseFloat(qtyCol !== -1 ? r[qtyCol] : '1') || 1;
        const price = parseFloat(priceCol !== -1 ? r[priceCol] : '10.00') || 10.0;
        const sku = skuCol !== -1 && r[skuCol] ? r[skuCol] : `SKU-${lineIdx}`;
        const desc = descCol !== -1 && r[descCol] ? r[descCol] : '';

        totalQty += qty;
        totalAmt += qty * price;

        segs.push(`IT1*${lineIdx}*${qty}*EA*${price.toFixed(2)}**VN*${sku}`);
        if (desc) {
          segs.push(`PID*F****${desc.toUpperCase()}`);
        }
      });

      // TDS is represented in cents or standard decimal
      const cents = Math.round(totalAmt * 100);
      segs.push(`TDS*${cents}`);
      segs.push(`CTT*${rows.length}`);
    }

    // Trailers
    // Number of segments between ST and SE inclusive
    const stIndex = 2; // ISA=0, GS=1, ST=2
    const currentCount = segs.length - stIndex + 1; // including SE
    segs.push(`SE*${currentCount}*0001`);
    segs.push(`GE*1*1`);
    segs.push(`IEA*1*${ctrlNum}`);

    return segs.join('~\n') + '~';
  }, [csvInput, targetTxType, senderId, receiverId, testProdIndicator]);

  const handleCopyEdi = () => {
    navigator.clipboard.writeText(generatedEdi);
    setCopiedEdi(true);
    setTimeout(() => setCopiedEdi(false), 2000);
  };

  const handleDownloadEdi = () => {
    downloadFile({ file: generatedEdi, filename: `generated_${targetTxType}.edi` });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Main Conversion Mode Selector */}
      <div
        className="p-3 rounded-2xl border flex items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-2 bg-[var(--surface-2)] p-1 rounded-xl border flex-wrap" style={{ borderColor: 'var(--line)' }}>
          <button
            type="button"
            onClick={() => setActiveDirection('edi-to-csv')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeDirection === 'edi-to-csv'
                ? 'bg-[var(--brand)] text-white shadow-sm'
                : 'text-[var(--ink)] hover:bg-[var(--surface)]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EDI &rarr; CSV / Excel Spreadsheet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDirection('csv-to-edi')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeDirection === 'csv-to-edi'
                ? 'bg-[var(--brand)] text-white shadow-sm'
                : 'text-[var(--ink)] hover:bg-[var(--surface)]'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>CSV / Spreadsheet &rarr; EDI X12 Generator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDirection(activeDirection === 'edi-to-csv' ? 'csv-to-edi' : 'edi-to-csv')}
            className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all hover:opacity-85"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
              color: 'var(--brand)',
            }}
            title="Swap conversion direction between Inbound EDI to CSV and Outbound CSV to EDI"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>
        </div>

        {/* Quick Sample Action */}
        <div className="flex items-center gap-2">
          {activeDirection === 'edi-to-csv' ? (
            <>
              <button
                type="button"
                onClick={loadSample850Edi}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" /> Load 850 PO (4 Lines)
              </button>
              <button
                type="button"
                onClick={loadSample810Edi}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                Load 810 Invoice
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={loadSampleCsv}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1 cursor-pointer"
              style={{ borderColor: 'var(--line)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" /> Load Sample PO CSV
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: EDI TO CSV */}
      {/* ========================================================= */}
      {activeDirection === 'edi-to-csv' && (
        <div className="space-y-6">
          {/* EDI Input Box */}
          <div
            className="p-5 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4" /> Source EDI Document (ANSI X12 or EDIFACT)
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setEdiInput((ev.target?.result as string) || '');
                      reader.readAsText(f);
                    }
                  }}
                  accept=".edi,.x12,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload EDI File
                </button>
                <button
                  type="button"
                  onClick={() => setEdiInput('')}
                  className="p-1.5 rounded-xl border hover:bg-[var(--surface-2)] text-[var(--muted)] cursor-pointer"
                  style={{ borderColor: 'var(--line)' }}
                  title="Clear"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={ediInput}
              onChange={(e) => setEdiInput(e.target.value)}
              placeholder="Paste raw ANSI X12 (850, 810, 856, 855, etc.) or UN/EDIFACT text here..."
              className="w-full p-3 font-mono text-xs rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none"
              style={{ borderColor: 'var(--line)' }}
            />
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-[var(--surface)] text-center" style={{ borderColor: 'var(--line)' }}>
              <div className="text-xs font-semibold text-[var(--muted)]">PO / Reference #</div>
              <div className="text-base font-bold font-mono text-[var(--ink)] mt-0.5">
                {parsedData.lineRows[0]?.poNumber || 'None'}
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-[var(--surface)] text-center" style={{ borderColor: 'var(--line)' }}>
              <div className="text-xs font-semibold text-[var(--muted)]">Line Items Extracted</div>
              <div className="text-base font-bold font-mono text-[var(--brand)] mt-0.5">
                {parsedData.totals.lines}
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-[var(--surface)] text-center" style={{ borderColor: 'var(--line)' }}>
              <div className="text-xs font-semibold text-[var(--muted)]">Total Units Ordered</div>
              <div className="text-base font-bold font-mono text-[var(--ink)] mt-0.5">
                {parsedData.totals.units}
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-[var(--surface)] text-center" style={{ borderColor: 'var(--line)' }}>
              <div className="text-xs font-semibold text-[var(--muted)]">Total Order Amount</div>
              <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatAmount(parsedData.totals.amount)}
              </div>
            </div>
          </div>

          {/* Table Controls & Export */}
          <div
            className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            {/* Flattening Mode Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--muted)]">Export Layout:</span>
              <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl border" style={{ borderColor: 'var(--line)' }}>
                <button
                  type="button"
                  onClick={() => setFlattenMode('line-items')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    flattenMode === 'line-items'
                      ? 'bg-[var(--brand)] text-white shadow-sm'
                      : 'text-[var(--ink)] hover:bg-[var(--surface)]'
                  }`}
                >
                  Line-Item Flattened ({parsedData.lineRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFlattenMode('headers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    flattenMode === 'headers'
                      ? 'bg-[var(--brand)] text-white shadow-sm'
                      : 'text-[var(--ink)] hover:bg-[var(--surface)]'
                  }`}
                >
                  Order Summary
                </button>
                <button
                  type="button"
                  onClick={() => setFlattenMode('raw-matrix')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    flattenMode === 'raw-matrix'
                      ? 'bg-[var(--brand)] text-white shadow-sm'
                      : 'text-[var(--ink)] hover:bg-[var(--surface)]'
                  }`}
                >
                  Raw Segment Matrix ({parsedData.matrixRows.length})
                </button>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCsv}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCsv ? 'Copied CSV!' : 'Copy CSV'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadCsv('csv')}
                className="px-3 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadCsv('tsv')}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
                title="Tab-Separated Values for Microsoft Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel TSV</span>
              </button>
            </div>
          </div>

          {/* Table Preview */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                <Table className="w-4 h-4 text-[var(--brand)]" /> Tabular Data Preview
              </span>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--muted)]" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter rows..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs bg-[var(--surface-2)] text-[var(--ink)] outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>

            {parsedData.lineRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted)] italic border border-dashed rounded-xl" style={{ borderColor: 'var(--line)' }}>
                No line items found. Paste an ANSI X12 850, 810, or EDIFACT message above to see extracted table rows.
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-xl" style={{ borderColor: 'var(--line)' }}>
                {flattenMode === 'line-items' ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-[var(--surface-2)] text-[var(--muted)] font-semibold" style={{ borderColor: 'var(--line)' }}>
                        <th className="py-2.5 px-3">Line #</th>
                        <th className="py-2.5 px-3">SKU / Part #</th>
                        <th className="py-2.5 px-3">UPC / GTIN</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-2">UOM</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                        <th className="py-2.5 px-3">Ship-To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono text-[11px]" style={{ borderColor: 'var(--line)' }}>
                      {parsedData.lineRows
                        .filter(
                          (r) =>
                            !tableSearch ||
                            r.sku.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            r.description.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            r.upc.toLowerCase().includes(tableSearch.toLowerCase())
                        )
                        .map((r, i) => (
                          <tr key={i} className="hover:bg-[var(--surface-2)] text-[var(--ink)] transition-colors">
                            <td className="py-2 px-3 font-semibold">{r.lineNo}</td>
                            <td className="py-2 px-3 font-bold text-[var(--brand)]">{r.sku}</td>
                            <td className="py-2 px-3 text-[var(--muted)]">{r.upc}</td>
                            <td className="py-2 px-3 font-sans truncate max-w-xs">{r.description || '-'}</td>
                            <td className="py-2 px-3 text-right font-bold">{r.qty}</td>
                            <td className="py-2 px-2 text-[var(--muted)]">{r.uom}</td>
                            <td className="py-2 px-3 text-right">{formatAmount(r.unitPrice)}</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {formatAmount(r.lineTotal)}
                            </td>
                            <td className="py-2 px-3 font-sans text-xs truncate max-w-[150px]">{r.shipToName}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-3">
                    <textarea
                      rows={10}
                      readOnly
                      value={generatedCsv}
                      className="w-full p-3 font-mono text-xs rounded-lg border bg-[var(--surface-2)] text-[var(--ink)] outline-none"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: CSV TO EDI */}
      {/* ========================================================= */}
      {activeDirection === 'csv-to-edi' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div
            className="p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-4 gap-4"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div>
              <label className="text-xs font-semibold text-[var(--muted)] block mb-1">Target EDI Document</label>
              <select
                value={targetTxType}
                onChange={(e) => setTargetTxType(e.target.value as any)}
                className="w-full p-2 text-xs font-bold rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                <option value="850">ANSI X12 850 (Purchase Order)</option>
                <option value="810">ANSI X12 810 (Commercial Invoice)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted)] block mb-1">Interchange Sender ID (ISA06)</label>
              <input
                type="text"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value.toUpperCase())}
                className="w-full p-2 text-xs font-mono font-bold rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none"
                style={{ borderColor: 'var(--line)' }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted)] block mb-1">Interchange Receiver ID (ISA08)</label>
              <input
                type="text"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value.toUpperCase())}
                className="w-full p-2 text-xs font-mono font-bold rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none"
                style={{ borderColor: 'var(--line)' }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted)] block mb-1">Usage Indicator (ISA15)</label>
              <select
                value={testProdIndicator}
                onChange={(e) => setTestProdIndicator(e.target.value as any)}
                className="w-full p-2 text-xs font-bold rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                <option value="P">P - Production</option>
                <option value="T">T - Test / Staging</option>
              </select>
            </div>
          </div>

          {/* Dual Columns: CSV Input vs Generated EDI Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CSV Input */}
            <div
              className="p-5 rounded-2xl border space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> CSV / Spreadsheet Data
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={csvFileInputRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setCsvInput((ev.target?.result as string) || '');
                        reader.readAsText(f);
                      }
                    }}
                    accept=".csv,.tsv,.txt"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => csvFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvInput('')}
                    className="p-1.5 rounded-xl border hover:bg-[var(--surface-2)] text-[var(--muted)] cursor-pointer"
                    style={{ borderColor: 'var(--line)' }}
                    title="Clear"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                rows={16}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="Paste CSV rows with headers: PO_Number, PO_Date, Vendor_Name, ShipTo_Name, SKU, Description, Quantity, Unit_Price..."
                className="w-full p-3 font-mono text-xs rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none resize-y"
                style={{ borderColor: 'var(--line)' }}
              />
            </div>

            {/* Generated EDI Output */}
            <div
              className="p-5 rounded-2xl border space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <FileCode2 className="w-4 h-4" /> Generated ANSI X12 {targetTxType} Document
                </span>

                {generatedEdi && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyEdi}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      {copiedEdi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedEdi ? 'Copied EDI!' : 'Copy EDI'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadEdi}
                      className="px-3 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .EDI</span>
                    </button>
                  </div>
                )}
              </div>

              <textarea
                rows={16}
                readOnly
                value={generatedEdi}
                placeholder="EDI document with valid ISA/GS envelopes, ST transaction set, line loops, and CTT trailers will be generated here..."
                className="w-full p-3 font-mono text-xs rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none resize-y"
                style={{ borderColor: 'var(--line)' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
