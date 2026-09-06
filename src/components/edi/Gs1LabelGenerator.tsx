import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Barcode,
  Copy,
  Check,
  Download,
  Printer,
  FileText,
  Truck,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface Gs1LabelGeneratorProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  onNavigateToTab?: (tabId: string) => void;
}

// Standard Code 128 Character Patterns (0-106)
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

// GS1 Modulo-10 Check Digit Calculation
export function calculateGs1CheckDigit(str: string): number {
  let sum = 0;
  let weight = 3;
  for (let i = str.length - 1; i >= 0; i--) {
    const digit = parseInt(str[i], 10);
    if (!isNaN(digit)) {
      sum += digit * weight;
      weight = weight === 3 ? 1 : 3;
    }
  }
  return (10 - (sum % 10)) % 10;
}

// Generate pure SVG barcode bars for numeric GS1-128 (Subset C with FNC1)
function generateGs1NumericBarcodeSvg(
  numericAiPayload: string, // Digits only, including AI (e.g. "00" + 18 digits)
  height = 70,
  moduleWidth = 2
) {
  // Ensure even number of digits for Subset C
  const digits = numericAiPayload.length % 2 === 0 ? numericAiPayload : `0${numericAiPayload}`;
  const codes: number[] = [105, 102]; // START C (105), FNC1 (102)

  for (let i = 0; i < digits.length; i += 2) {
    codes.push(parseInt(digits.slice(i, i + 2), 10));
  }

  // Calculate Code 128 Checksum
  let checkSum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    checkSum += codes[i] * i;
  }
  codes.push(checkSum % 103);
  codes.push(106); // STOP

  // Convert to widths pattern
  let patternStr = '';
  for (const c of codes) {
    patternStr += CODE128_PATTERNS[c] || '';
  }

  // Generate SVG bars
  const quietZoneModules = 12;
  let currentX = quietZoneModules * moduleWidth;
  const bars: { x: number; width: number }[] = [];

  for (let i = 0; i < patternStr.length; i++) {
    const w = parseInt(patternStr[i], 10) * moduleWidth;
    if (i % 2 === 0) {
      // Bar (black)
      bars.push({ x: currentX, width: w });
    }
    currentX += w;
  }

  const totalWidth = currentX + quietZoneModules * moduleWidth;

  return {
    svgWidth: totalWidth,
    svgHeight: height,
    bars,
    patternStr,
  };
}

export const Gs1LabelGenerator: React.FC<Gs1LabelGeneratorProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  onNavigateToTab,
}) => {
  // SSCC Form State
  const [extensionDigit, setExtensionDigit] = useState('0');
  const [companyPrefix, setCompanyPrefix] = useState('0614141');
  const [serialReference, setSerialReference] = useState('123456789');

  // Trade Item / Content State
  const [gtin, setGtin] = useState('00012345678905');
  const [quantity, setQuantity] = useState('24');
  const [itemDescription, setItemDescription] = useState('PREMIUM COTTON APPAREL 12PK');
  const [batchLot, setBatchLot] = useState('BATCH-2026-X');
  const [expirationDate, setExpirationDate] = useState('271231');

  // Shipping & Logistics State
  const [shipFromCompany, setShipFromCompany] = useState('ACME LOGISTICS INC.');
  const [shipFromStreet, setShipFromStreet] = useState('1200 COMMERCE WAY');
  const [shipFromCityStateZip, setShipFromCityStateZip] = useState('CHICAGO, IL 60601');

  const [shipToCompany, setShipToCompany] = useState('TARGET DISTRIBUTION #0584');
  const [shipToStreet, setShipToStreet] = useState('900 LOGISTICS BLVD');
  const [shipToCityStateZip, setShipToCityStateZip] = useState('ONTARIO, CA 91761');
  const [shipToPostal, setShipToPostal] = useState('91761');

  const [carrierName, setCarrierName] = useState('FEDEX FREIGHT (FDEG)');
  const [bolNumber, setBolNumber] = useState('BOL-994821');
  const [poNumber, setPoNumber] = useState('PO-2026-9901');

  // UI state
  const [copiedSscc, setCopiedSscc] = useState(false);
  const [copiedAsn, setCopiedAsn] = useState(false);
  const [viewMode, setViewMode] = useState<'label' | 'asn' | 'details'>('label');
  const labelPrintRef = useRef<HTMLDivElement>(null);

  // Compute SSCC-18
  const { sscc17, checkDigit, fullSscc18, formattedHri } = useMemo(() => {
    // Standard SSCC-18 requires exactly 17 digits before check digit
    // Format: Extension (1) + Company Prefix (7-10) + Serial (remaining to reach 17)
    const ext = (extensionDigit || '0').slice(0, 1);
    const prefix = companyPrefix.replace(/\D/g, '');
    const neededSerialLen = Math.max(1, 16 - prefix.length);
    const rawSerial = serialReference.replace(/\D/g, '');
    const paddedSerial = rawSerial.padStart(neededSerialLen, '0').slice(0, neededSerialLen);

    const base17 = `${ext}${prefix}${paddedSerial}`.slice(0, 17);
    const chk = calculateGs1CheckDigit(base17);
    const full18 = `${base17}${chk}`;

    // Human Readable Interpretation (HRI) with standard GS1 spaces
    const hri = `(00) ${ext} ${prefix} ${paddedSerial} ${chk}`;

    return {
      sscc17: base17,
      checkDigit: chk,
      fullSscc18: full18,
      formattedHri: hri,
    };
  }, [extensionDigit, companyPrefix, serialReference]);

  // Primary SSCC Barcode SVG Data (AI 00)
  const ssccBarcode = useMemo(() => {
    return generateGs1NumericBarcodeSvg(`00${fullSscc18}`, 85, 2.2);
  }, [fullSscc18]);

  // Secondary GTIN/Qty Barcode SVG Data (AI 02 + 37)
  const contentBarcode = useMemo(() => {
    const cleanGtin = gtin.replace(/\D/g, '').padStart(14, '0').slice(0, 14);
    const cleanQty = quantity.replace(/\D/g, '').padStart(4, '0').slice(0, 4);
    return generateGs1NumericBarcodeSvg(`02${cleanGtin}37${cleanQty}`, 60, 1.8);
  }, [gtin, quantity]);

  // Destination Postal Barcode SVG (AI 420)
  const postalBarcode = useMemo(() => {
    const cleanZip = shipToPostal.replace(/\D/g, '').slice(0, 5);
    return generateGs1NumericBarcodeSvg(`420${cleanZip}`, 45, 1.6);
  }, [shipToPostal]);

  // Matching 856 ASN Snippet
  const matching856Snippet = useMemo(() => {
    const now = new Date();
    const ccyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const cleanGtin = gtin.replace(/\D/g, '');

    return `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260905*1600*U*00401*000000856*0*P*>~
GS*SH*ACME_SUPPLIER*BUYER_RETAIL*${ccyymmdd}*1600*85601*X*004010~
ST*856*0001~
BSN*00*ASN-${fullSscc18.slice(-6)}*${ccyymmdd}*1600*0001~
DTM*011*${ccyymmdd}~
HL*1**S~
TD1*CTN25*1~
TD5*B*2*FDEG*M*${carrierName.split(' ')[0] || 'FEDEX FREIGHT'}~
REF*BM*${bolNumber}~
N1*SF*${shipFromCompany}*91*FAC01~
N3*${shipFromStreet}~
N4*${shipFromCityStateZip.replace(/,\s*/g, '*')}~
N1*ST*${shipToCompany}*92*DC0584~
N3*${shipToStreet}~
N4*${shipToCityStateZip.replace(/,\s*/g, '*')}~
HL*2*1*O~
PRF*${poNumber}***${ccyymmdd}~
HL*3*2*P~
MAN*GM*${fullSscc18}~
HL*4*3*I~
LIN*1*VN*SKU-A101*UP*${cleanGtin}~
SN1*1*${quantity}*CA~
PID*F****${itemDescription}~
REF*LT*${batchLot}~
DTM*036*20${expirationDate}~
CTT*4~
SE*23*0001~
GE*1*85601~
IEA*1*000000856~`;
  }, [
    fullSscc18,
    carrierName,
    bolNumber,
    shipFromCompany,
    shipFromStreet,
    shipFromCityStateZip,
    shipToCompany,
    shipToStreet,
    shipToCityStateZip,
    poNumber,
    gtin,
    quantity,
    itemDescription,
    batchLot,
    expirationDate,
  ]);

  const handleCopySscc = () => {
    navigator.clipboard.writeText(fullSscc18);
    setCopiedSscc(true);
    setTimeout(() => setCopiedSscc(false), 2000);
  };

  const handleCopyAsn = () => {
    navigator.clipboard.writeText(matching856Snippet);
    setCopiedAsn(true);
    setTimeout(() => setCopiedAsn(false), 2000);
  };

  const handleDownloadSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ssccBarcode.svgWidth} ${ssccBarcode.svgHeight + 25}" width="${ssccBarcode.svgWidth}" height="${ssccBarcode.svgHeight + 25}">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${ssccBarcode.bars.map((b) => `<rect x="${b.x}" y="10" width="${b.width}" height="${ssccBarcode.svgHeight}" fill="#000000" />`).join('\n  ')}
  <text x="${ssccBarcode.svgWidth / 2}" y="${ssccBarcode.svgHeight + 20}" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle" fill="#000000">${formattedHri}</text>
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSCC18_${fullSscc18}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    document.body.classList.add('gs1-tool-active');
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-gs1-label');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('printing-gs1-label');
      document.body.classList.remove('gs1-tool-active');
    };
  }, []);

  const handlePrint = () => {
    document.body.classList.add('printing-gs1-label');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  // Reusable 4" x 6" Logistics Shipping Container Label
  const renderPhysicalLabel = (isPortal = false) => (
    <div
      ref={!isPortal ? labelPrintRef : undefined}
      id={isPortal ? 'gs1-printable-label-card' : undefined}
      className={`w-full bg-white text-black border-2 border-black font-sans text-[11px] leading-tight select-none ${
        isPortal ? 'p-2.5 shadow-none' : 'max-w-[440px] p-4 shadow-lg'
      }`}
      style={
        isPortal
          ? {
              width: '3.8in',
              maxWidth: '3.8in',
              height: '5.75in',
              maxHeight: '5.75in',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
            }
          : { minHeight: '620px' }
      }
    >
      {/* 1. Header: From & To */}
      <div className="grid grid-cols-2 border-b-2 border-black pb-1.5">
        <div className="pr-2 border-r border-black">
          <span className="block font-bold text-[9px] uppercase tracking-wider text-neutral-600">
            FROM:
          </span>
          <p className="font-bold text-xs leading-none">{shipFromCompany}</p>
          <p className="text-[10px] mt-0.5">{shipFromStreet}</p>
          <p className="text-[10px]">{shipFromCityStateZip}</p>
        </div>
        <div className="pl-2">
          <span className="block font-bold text-[9px] uppercase tracking-wider text-neutral-600">
            SHIP TO POSTAL (420):
          </span>
          <p className="font-mono font-bold text-sm leading-none">{shipToPostal}</p>
          <div className="mt-1 flex justify-start">
            <svg
              viewBox={`0 0 ${postalBarcode.svgWidth} ${postalBarcode.svgHeight}`}
              className="h-6 w-auto"
            >
              {postalBarcode.bars.map((b, i) => (
                <rect key={i} x={b.x} y={0} width={b.width} height={postalBarcode.svgHeight} fill="#000000" />
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Ship To Destination Block */}
      <div className="border-b-2 border-black py-1.5">
        <span className="block font-bold text-[9px] uppercase tracking-wider text-neutral-600">
          TO:
        </span>
        <p className="font-bold text-sm leading-tight uppercase">{shipToCompany}</p>
        <p className="text-xs">{shipToStreet}</p>
        <p className="text-xs font-bold">{shipToCityStateZip}</p>
      </div>

      {/* 3. Carrier, BOL, PO Row */}
      <div className="grid grid-cols-3 border-b-2 border-black py-1 text-[10px]">
        <div className="border-r border-black pr-1">
          <span className="block font-semibold text-[8px] text-neutral-600">CARRIER:</span>
          <p className="font-bold truncate">{carrierName}</p>
        </div>
        <div className="border-r border-black px-1">
          <span className="block font-semibold text-[8px] text-neutral-600">B/L:</span>
          <p className="font-mono font-bold truncate">{bolNumber}</p>
        </div>
        <div className="pl-1">
          <span className="block font-semibold text-[8px] text-neutral-600">PO #:</span>
          <p className="font-mono font-bold truncate">{poNumber}</p>
        </div>
      </div>

      {/* 4. Content Block (GTIN, Qty, Batch) */}
      <div className="border-b-2 border-black py-1.5">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-xs uppercase truncate max-w-[260px]">
            {itemDescription}
          </span>
          <span className="font-mono text-xs font-bold">QTY: {quantity}</span>
        </div>
        <div className="flex justify-between text-[10px] mt-0.5 text-neutral-700">
          <span>LOT: <strong className="font-mono">{batchLot}</strong></span>
          <span>EXP: <strong className="font-mono">{expirationDate}</strong></span>
        </div>
        {/* Secondary Barcode */}
        <div className="mt-1 flex flex-col items-center">
          <svg
            viewBox={`0 0 ${contentBarcode.svgWidth} ${contentBarcode.svgHeight}`}
            className="h-8 w-auto"
          >
            {contentBarcode.bars.map((b, i) => (
              <rect key={i} x={b.x} y={0} width={b.width} height={contentBarcode.svgHeight} fill="#000000" />
            ))}
          </svg>
          <span className="font-mono text-[9px] tracking-wide mt-0.5">
            (02) {gtin} (37) {quantity}
          </span>
        </div>
      </div>

      {/* 5. SSCC-18 Primary Barcode Block (GS1-128 AI 00) */}
      <div className="pt-1.5 flex flex-col items-center">
        <span className="font-bold text-xs tracking-wider uppercase mb-0.5">
          SERIAL SHIPPING CONTAINER CODE (SSCC-18)
        </span>

        {/* Scannable SVG Barcode */}
        <div className="w-full flex justify-center py-0.5">
          <svg
            viewBox={`0 0 ${ssccBarcode.svgWidth} ${ssccBarcode.svgHeight}`}
            className="w-full max-h-20"
          >
            {ssccBarcode.bars.map((b, i) => (
              <rect key={i} x={b.x} y={0} width={b.width} height={ssccBarcode.svgHeight} fill="#000000" />
            ))}
          </svg>
        </div>

        {/* Human Readable Interpretation */}
        <p className="font-mono font-bold text-xs tracking-widest mt-0.5 text-center">
          {formattedHri}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Mode Navigation Bar */}
      <div
        className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold" style={{ color: 'var(--ink)' }}>
            Active View:
          </span>
          <div className="flex rounded-xl border p-0.5" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <button
              onClick={() => setViewMode('label')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'label' ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--brand)]' : 'text-[var(--muted)]'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>4&quot; x 6&quot; Logistics Label</span>
            </button>
            <button
              onClick={() => setViewMode('asn')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'asn' ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--brand)]' : 'text-[var(--muted)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>856 ASN Synchronizer</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                MAN Sync
              </span>
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'details' ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--brand)]' : 'text-[var(--muted)]'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>GS1 Standards Guide</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySscc}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            {copiedSscc ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSscc ? 'Copied SSCC-18!' : 'Copy SSCC-18'}</span>
          </button>
          <button
            onClick={handleDownloadSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            title="Download pure SVG vector barcode"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG Barcode</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Label</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Label / ASN on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Parameters */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section 1: SSCC-18 Core Calculation */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                <Barcode className="w-4 h-4 text-[var(--brand)]" />
                <span>SSCC-18 IDENTIFIER (AI 00)</span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                Check Digit: {checkDigit}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  Extension (0-9)
                </label>
                <input
                  type="text"
                  maxLength={1}
                  value={extensionDigit}
                  onChange={(e) => setExtensionDigit(e.target.value.replace(/\D/g, '').slice(0, 1))}
                  className="w-full p-2.5 rounded-xl border font-mono text-center outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  GS1 Company Prefix (7-10)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={companyPrefix}
                  onChange={(e) => setCompanyPrefix(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                Serial Reference (Pallet / Carton Serial)
              </label>
              <input
                type="text"
                value={serialReference}
                onChange={(e) => setSerialReference(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2.5 rounded-xl border font-mono outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>

            {/* Computed SSCC Badge */}
            <div
              className="p-3 rounded-xl border font-mono text-xs flex flex-col gap-1"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">
                Computed SSCC-18 (AI 00)
              </span>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {fullSscc18}
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  {formattedHri}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Trade Item & Traceability (GTIN, Batch, Expiration) */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                <Package className="w-4 h-4 text-sky-500" />
                <span>CONTENT &amp; TRACEABILITY (AI 02, 37, 10, 17)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  GTIN-14 / UPC (AI 02 / AI 01)
                </label>
                <input
                  type="text"
                  value={gtin}
                  onChange={(e) => setGtin(e.target.value)}
                  className="w-full p-2 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  Pack Quantity (AI 37)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-2 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  Batch / Lot # (AI 10)
                </label>
                <input
                  type="text"
                  value={batchLot}
                  onChange={(e) => setBatchLot(e.target.value)}
                  className="w-full p-2 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  Expiration (AI 17: YYMMDD)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full p-2 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  Customer PO #
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full p-2 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full p-2 rounded-xl border font-mono outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Shipping & Routing */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                <Truck className="w-4 h-4 text-amber-500" />
                <span>SHIPPER &amp; CONSIGNEE ROUTING</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  Ship To (Consignee Name &amp; DC)
                </label>
                <input
                  type="text"
                  value={shipToCompany}
                  onChange={(e) => setShipToCompany(e.target.value)}
                  className="w-full p-2 rounded-xl border outline-none font-medium"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  Ship To Street
                </label>
                <input
                  type="text"
                  value={shipToStreet}
                  onChange={(e) => setShipToStreet(e.target.value)}
                  className="w-full p-2 rounded-xl border outline-none font-mono"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  City, State Zip (AI 420 Postal)
                </label>
                <input
                  type="text"
                  value={shipToCityStateZip}
                  onChange={(e) => {
                    setShipToCityStateZip(e.target.value);
                    const match = e.target.value.match(/\d{5}/);
                    if (match) setShipToPostal(match[0]);
                  }}
                  className="w-full p-2 rounded-xl border outline-none font-mono"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  Carrier &amp; SCAC
                </label>
                <input
                  type="text"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full p-2 rounded-xl border outline-none font-mono"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                  Bill of Lading (BOL #)
                </label>
                <input
                  type="text"
                  value={bolNumber}
                  onChange={(e) => setBolNumber(e.target.value)}
                  className="w-full p-2 rounded-xl border outline-none font-mono"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Preview Screen */}
        <div className="lg:col-span-7 space-y-4">
          {viewMode === 'label' && (
            <div
              className="p-4 rounded-2xl border shadow-sm flex flex-col items-center"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="w-full flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                  <Printer className="w-4 h-4 text-emerald-500" />
                  <span>4&quot; x 6&quot; GS1 LOGISTICS SHIPPING CONTAINER LABEL</span>
                </span>
                <span className="text-[11px] text-[var(--muted)] font-mono">
                  ANSI MH10.8 / GS1 General Spec
                </span>
              </div>

              {/* Physical 4x6 Label Card (White thermal sticker look) */}
              {renderPhysicalLabel(false)}

              {/* Action Buttons under label */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: 'var(--brand)' }}
                  title="Print 4x6 label only without webpage headers or extra pages"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Label (4&quot; x 6&quot;)</span>
                </button>
                <button
                  onClick={handleCopySscc}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {copiedSscc ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy SSCC-18</span>
                </button>
                <button
                  onClick={() => setViewMode('asn')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Insert into 856 ASN Sample &rarr;</span>
                </button>
              </div>

              {/* Printing Helper Guidance */}
              <p className="text-[11px] text-[var(--muted)] text-center max-w-sm mt-2 leading-relaxed">
                Single-page thermal 4&quot; x 6&quot; mode active. When printing, <strong>only the shipping label</strong> is sent to the printer. Select &quot;Margins: None&quot; in printer settings for full border alignment.
              </p>
            </div>
          )}

          {viewMode === 'asn' && (
            <div
              className="p-4 rounded-2xl border shadow-sm space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-semibold text-xs flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span>SYNCHRONIZED 856 ADVANCE SHIP NOTICE (ASN)</span>
                  </span>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    SSCC-18 ({fullSscc18}) is embedded in MAN*GM* segment of the Tare/Pack hierarchy.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAsn}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer text-xs"
                    style={{ backgroundColor: copiedAsn ? 'var(--ok)' : 'var(--brand)' }}
                  >
                    {copiedAsn ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAsn ? 'Copied 856!' : 'Copy 856 ASN'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([matching856Snippet], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `856_ASN_${fullSscc18}.edi`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer text-xs"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download EDI</span>
                  </button>
                  {onNavigateToTab && (
                    <button
                      onClick={() => onNavigateToTab('edi-sample-generator')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 text-emerald-600 dark:text-emerald-400 cursor-pointer text-xs"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                    >
                      <span>Open in Template Tool</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Segment Highlight Card */}
              <div
                className="p-3 rounded-xl border font-mono text-xs space-y-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Cross-Referenced MAN Segment:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 font-mono font-bold">
                    HL*3*2*P (Pack Level)
                  </span>
                </div>
                <code className="text-sm font-bold block pt-1">
                  MAN*GM*{fullSscc18}~
                </code>
                <p className="text-[11px] opacity-90 pt-0.5">
                  &bull; <code>GM</code> = SSCC-18 and Application Identifier 00 in ANSI ASC X12 standard.
                </p>
              </div>

              {/* Full 856 ASN Payload Viewer */}
              <textarea
                readOnly
                value={matching856Snippet}
                rows={16}
                className="w-full p-3 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          )}

          {viewMode === 'details' && (
            <div
              className="p-4 rounded-2xl border space-y-4 text-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <span className="font-semibold text-sm block" style={{ color: 'var(--ink)' }}>
                GS1-128 &amp; SSCC-18 Engineering Reference
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  className="p-3.5 rounded-xl border space-y-1.5"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
                    SSCC-18 Anatomy (18 Digits)
                  </span>
                  <ul className="space-y-1 text-[11px] text-[var(--muted)] leading-relaxed list-disc list-inside">
                    <li>
                      <strong>Extension Digit (1 digit):</strong> 0-9 assigned by shipper to define packaging level (carton, master case, pallet).
                    </li>
                    <li>
                      <strong>GS1 Company Prefix (7-10 digits):</strong> Globally unique company identifier issued by GS1 member organization.
                    </li>
                    <li>
                      <strong>Serial Reference (6-9 digits):</strong> Unique consecutive or randomized serial assigned to this physical container.
                    </li>
                    <li>
                      <strong>Check Digit (1 digit):</strong> Modulo-10 check digit verifying barcode scan integrity.
                    </li>
                  </ul>
                </div>

                <div
                  className="p-3.5 rounded-xl border space-y-1.5"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <span className="font-semibold text-sky-600 dark:text-sky-400 block">
                    Application Identifiers (AI)
                  </span>
                  <ul className="space-y-1 text-[11px] text-[var(--muted)] leading-relaxed list-disc list-inside">
                    <li>
                      <strong>AI (00):</strong> SSCC-18 logistics unit identifier.
                    </li>
                    <li>
                      <strong>AI (01) / (02):</strong> GTIN item identification in logistics unit.
                    </li>
                    <li>
                      <strong>AI (37):</strong> Number of trade units contained.
                    </li>
                    <li>
                      <strong>AI (10):</strong> Batch or Lot number for FSMA 204 traceability.
                    </li>
                    <li>
                      <strong>AI (17):</strong> Expiration date in YYMMDD format.
                    </li>
                    <li>
                      <strong>AI (420):</strong> Deliver-to postal code for automated carrier sortation.
                    </li>
                  </ul>
                </div>
              </div>

              <div
                className="p-3.5 rounded-xl border space-y-2 bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Info className="w-4 h-4" />
                  <span>How Barcode Scanning Works in EDI Logistics</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-95">
                  When a forklift driver or automated conveyor scanner reads the GS1-128 barcode on a pallet receiving dock, the WMS (Warehouse Management System) extracts the 18-digit SSCC. It looks up the previously received <strong>EDI 856 ASN</strong> matching <code>MAN*GM*&lt;SSCC&gt;</code> to immediately identify the PO number, packing structure, and item quantities without breaking open the pallet wrap or manual physical tallying.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Clean Print Portal: Ensures 100% ONLY the 4" x 6" label is printed with 0 extra pages */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="gs1-print-portal" aria-hidden="true">
            {renderPhysicalLabel(true)}
          </div>,
          document.body
        )}
    </div>
  );
};
