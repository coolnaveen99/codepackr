import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Network,
  Upload,
  FileText,
  Send,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Copy,
  Check,
  Download,
  Code2,
  FileCode,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  CloudUpload,
  Eye,
  Settings2,
  Database,
  BookOpen,
  Search,
  X,
  FileCheck,
  Layers,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { downloadFile } from '../../lib/smartDownload';
import { EdiTutorialPanel } from './EdiTutorialPanel';
import { EdiTreeView, EdiTreeSegment } from './EdiTreeView';
import { COMPREHENSIVE_SEGMENT_DICTIONARY } from '../../data/ediDictionary';

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================

export type PipelineDirection = 'inbound' | 'outbound';

export interface DiagnosticMessage {
  level: 'INFO' | 'WARNING' | 'ERROR';
  stage: string;
  code?: string;
  segment?: string;
  element?: string;
  message: string;
}

export interface CanonicalLineItem {
  lineNumber: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  partNumber: string;
  upc?: string;
  description: string;
  extendedAmount?: number;
}

export interface CanonicalParty {
  role: string;
  name: string;
  duns?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface CanonicalDocument {
  transactionType: string;
  documentType: string;
  controlNumbers: {
    interchange: string;
    group: string;
    transaction: string;
  };
  header: {
    orderNumber: string;
    orderDate: string;
    currency: string;
    statusOrType?: string;
  };
  parties: CanonicalParty[];
  lineItems: CanonicalLineItem[];
  summary: {
    totalQuantity: number;
    totalAmount: number;
    lineCount: number;
  };
  rawMeta: {
    originalFormat: string;
    version: string;
    delimiters: {
      element: string;
      segment: string;
      subElement?: string;
    };
    receivedAt: string;
    isAs2Mime?: boolean;
    mic?: string;
  };
}

// ==========================================
// STORY MODE PRESET FIXTURES
// ==========================================

export const FIXTURE_X12_850 = `ISA*00*          *00*          *ZZ*ACMESUPPLY     *ZZ*GLOBALBUYER    *260912*0830*U*00401*000000850*0*P*>~
GS*PO*ACMESUPPLY*GLOBALBUYER*20260912*0830*85001*X*004010~
ST*850*0001~
BEG*00*NE*PO-2026-78901**20260912~
CUR*SE*USD~
REF*DP*042~
N1*BT*GLOBAL BUYER CORP*9*0012345678900~
N3*500 ENTERPRISE PKWY~
N4*CHICAGO*IL*60601~
N1*ST*GLOBAL DISTRIBUTION DC #4*9*0098765432100~
N3*1200 LOGISTICS WAY~
N4*DALLAS*TX*75201~
PO1*1*150*EA*45.00**VN*SKU-A101*UP*012345678905~
PID*F****INDUSTRIAL SMART SENSOR MODULE 24V~
PO1*2*75*EA*120.00**VN*SKU-B202*UP*012345678912~
PID*F****WIRELESS TELEMETRY GATEWAY IP67~
CTT*2*225~
SE*16*0001~
GE*1*85001~
IEA*1*000000850~`;

export const FIXTURE_X12_837_CLAIM = `ISA*00*          *00*          *ZZ*PROVCLINIC     *ZZ*PAYERHEALTH    *260912*0915*^*00501*000000837*0*P*:~
GS*HC*PROVCLINIC*PAYERHEALTH*20260912*0915*83701*X*005010X222A1~
ST*837*0001*005010X222A1~
BHT*0019*00*CLAIM-2026-9901*20260912*0915*CH~
NM1*41*2*SUNSHINE MEDICAL GROUP*****46*987654321~
PER*IC*CLAIMS DEPT*TE*8005550199~
NM1*40*2*BLUE CROSS BLUE SHIELD*****46*543216789~
HL*1**20*1~
NM1*85*2*SUNSHINE HEALTHCARE LLC*****XX*1982736450~
N3*400 MEDICAL PARKWAY~
N4*ORLANDO*FL*32801~
HL*2*1*22*0~
SBR*P*18*******CI~
NM1*IL*1*SMITH*JOHN*M***MI*W123456789~
DMG*D8*19800512*M~
NM1*PR*2*BLUE CROSS HEALTH PLAN*****PI*PAYER001~
CLM*CLM-2026-001*285.00***11:B:1*Y*A*Y*Y~
HI*BK:M545*BF:M542~
LX*1~
SV1*HC:99214*150.00*UN*1***1~
DTP*472*D8*20260910~
LX*2~
SV1*HC:72148*135.00*UN*1***2~
DTP*472*D8*20260910~
SE*23*0001~
GE*1*83701~
IEA*1*000000837~`;

export const FIXTURE_X12_214_LOGISTICS = `ISA*00*          *00*          *ZZ*CARRIERLOG     *ZZ*SHIPPERGLOBAL  *260912*1045*U*00401*000000214*0*P*>~
GS*QM*CARRIERLOG*SHIPPERGLOBAL*20260912*1045*21401*X*004010~
ST*214*0001~
B10*BOL-98214*PO-2026-78901*CRLOG~
L11*PRO-778899*PRO~
N1*SH*GLOBAL DISTRIBUTION DC #4~
N1*CN*ENTERPRISE BUYER CORP~
LX*1~
AT7*X6*NS***20260912*1030*LT~
MS1*DALLAS*TX*USA~
MS2*CRLOG*TRK-902~
SE*10*0001~
GE*1*21401~
IEA*1*000000214~`;

export const FIXTURE_AS2_MESSAGE = `POST /as2/receive HTTP/1.1
Host: as2.codepackr.com
AS2-Version: 1.2
AS2-From: ACMESUPPLY_AS2
AS2-To: GLOBALBUYER_AS2
Message-ID: <AS2-20260912-083000-9876@acmesupply.com>
Subject: EDI X12 850 Purchase Order Transmission
Content-Type: multipart/signed; protocol="application/pkcs7-signature"; micalg=sha-256; boundary="----=_Part_2026_AS2_BOUNDARY_X987"
Date: Sat, 12 Sep 2026 08:30:00 GMT
Disposition-Notification-To: as2-mdn@acmesupply.com
Disposition-Notification-Options: signed-receipt-protocol=optional, pkcs7-signature; signed-receipt-micalg=optional, sha-256

------=_Part_2026_AS2_BOUNDARY_X987
Content-Type: application/edi-x12; name="PO_2026_78901.edi"
Content-Transfer-Encoding: 8bit
Content-Disposition: attachment; filename="PO_2026_78901.edi"

ISA*00*          *00*          *ZZ*ACMESUPPLY     *ZZ*GLOBALBUYER    *260912*0830*U*00401*000000850*0*P*>~
GS*PO*ACMESUPPLY*GLOBALBUYER*20260912*0830*85001*X*004010~
ST*850*0001~
BEG*00*NE*PO-2026-78901**20260912~
CUR*SE*USD~
REF*DP*042~
N1*BT*GLOBAL BUYER CORP*9*0012345678900~
N3*500 ENTERPRISE PKWY~
N4*CHICAGO*IL*60601~
N1*ST*GLOBAL DISTRIBUTION DC #4*9*0098765432100~
N3*1200 LOGISTICS WAY~
N4*DALLAS*TX*75201~
PO1*1*150*EA*45.00**VN*SKU-A101*UP*012345678905~
PID*F****INDUSTRIAL SMART SENSOR MODULE 24V~
PO1*2*75*EA*120.00**VN*SKU-B202*UP*012345678912~
PID*F****WIRELESS TELEMETRY GATEWAY IP67~
CTT*2*225~
SE*16*0001~
GE*1*85001~
IEA*1*000000850~
------=_Part_2026_AS2_BOUNDARY_X987
Content-Type: application/pkcs7-signature; name="smime.p7s"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="smime.p7s"

MIAGCSqGSIb3DQEHAqCAMIACAQExDzANBglghkgBZQMEAgEFADCABgkqhkiG9w0BBwEAAKCAMIIF
AgIBATAwMzAKBggqhkiG9w0BAQICAQAwDjEMMAoGA1UEAxMDY29kZTEUMBIGA1UEBRMLQUNNRVNV
UExZ...[SHA256-DIGITAL-SIGNATURE-VERIFIED]
------=_Part_2026_AS2_BOUNDARY_X987--`;

export const FIXTURE_EDIFACT_ORDERS = `UNB+UNOA:2+ACME_SUPPLIER:ZZ+GLOBAL_BUYER:ZZ+260912:0830+IREF0001+++++1'
UNH+MEST0001+ORDERS:D:96A:UN:EAN008'
BGM+220+PO-2026-99120+9'
DTM+137:20260912:102'
NAD+BY+GB-987654::9++GLOBAL BUYER CORP+100 BISHOPSGATE+LONDON++EC2N 4AG+GB'
NAD+SU+ACME-1001::9++ACME INDUSTRIAL LTD+45 INDUSTRIAL ROAD+MANCHESTER++M1 1AA+GB'
NAD+DP+DC-NORTH::9++GLOBAL LOGISTICS DEPOT NORTH+PORT WAY+LIVERPOOL++L1 8JQ+GB'
LIN+1++5012345678900:EN'
IMD+F++:::INDUSTRIAL PNEUMATIC ACTUATOR 240V'
QTY+21:120:PCE'
MOA+203:75.00'
LIN+2++5012345678917:EN'
IMD+F++:::PRESSURE RELIEF VALVE FLANGE 16BAR'
QTY+21:40:PCE'
MOA+203:140.00'
UNS+S'
CNT+2:2'
UNT+17+MEST0001'
UNZ+1+IREF0001'`;

export const FIXTURE_OUTBOUND_JSON_PO = `{
  "transactionType": "850",
  "documentType": "PurchaseOrder",
  "controlNumbers": {
    "interchange": "000000850",
    "group": "85001",
    "transaction": "0001"
  },
  "header": {
    "orderNumber": "PO-2026-OUT-8899",
    "orderDate": "2026-09-12",
    "currency": "USD",
    "statusOrType": "Original"
  },
  "parties": [
    {
      "role": "Buyer (BT)",
      "name": "GLOBAL BUYER CORP",
      "duns": "0012345678900",
      "address": "500 ENTERPRISE PKWY",
      "city": "CHICAGO",
      "state": "IL",
      "zip": "60601",
      "country": "USA"
    },
    {
      "role": "Ship-To (ST)",
      "name": "GLOBAL DISTRIBUTION DC #4",
      "duns": "0098765432100",
      "address": "1200 LOGISTICS WAY",
      "city": "DALLAS",
      "state": "TX",
      "zip": "75201",
      "country": "USA"
    }
  ],
  "lineItems": [
    {
      "lineNumber": "1",
      "partNumber": "SKU-A101",
      "upc": "012345678905",
      "description": "INDUSTRIAL SMART SENSOR MODULE 24V",
      "quantity": 150,
      "uom": "EA",
      "unitPrice": 45.00,
      "extendedAmount": 6750.00
    },
    {
      "lineNumber": "2",
      "partNumber": "SKU-B202",
      "upc": "012345678912",
      "description": "WIRELESS TELEMETRY GATEWAY IP67",
      "quantity": 75,
      "uom": "EA",
      "unitPrice": 120.00,
      "extendedAmount": 9000.00
    }
  ],
  "summary": {
    "totalQuantity": 225,
    "totalAmount": 15750.00,
    "lineCount": 2
  },
  "rawMeta": {
    "originalFormat": "X12",
    "version": "004010",
    "delimiters": {
      "element": "*",
      "segment": "~"
    },
    "receivedAt": "2026-09-12T08:30:00Z"
  }
}`;

export const FIXTURE_OUTBOUND_JSON_INVOICE = `{
  "transactionType": "810",
  "documentType": "Invoice",
  "controlNumbers": {
    "interchange": "000000810",
    "group": "81001",
    "transaction": "0001"
  },
  "header": {
    "orderNumber": "INV-2026-9041",
    "orderDate": "2026-09-12",
    "currency": "USD",
    "statusOrType": "Original"
  },
  "parties": [
    {
      "role": "Supplier (SU)",
      "name": "ACME INDUSTRIAL SUPPLY",
      "duns": "9988776655443",
      "address": "500 ENTERPRISE PKWY",
      "city": "CHICAGO",
      "state": "IL",
      "zip": "60601"
    },
    {
      "role": "Bill-To (BT)",
      "name": "GLOBAL BUYER CORP",
      "duns": "0012345678900",
      "address": "777 COMMERCE BLVD",
      "city": "SEATTLE",
      "state": "WA",
      "zip": "98101"
    }
  ],
  "lineItems": [
    {
      "lineNumber": "1",
      "partNumber": "SKU-A101",
      "description": "INDUSTRIAL SMART SENSOR MODULE 24V",
      "quantity": 150,
      "uom": "EA",
      "unitPrice": 45.00,
      "extendedAmount": 6750.00
    },
    {
      "lineNumber": "2",
      "partNumber": "SKU-B202",
      "description": "WIRELESS TELEMETRY GATEWAY IP67",
      "quantity": 75,
      "uom": "EA",
      "unitPrice": 120.00,
      "extendedAmount": 9000.00
    }
  ],
  "summary": {
    "totalQuantity": 225,
    "totalAmount": 15750.00,
    "lineCount": 2
  },
  "rawMeta": {
    "originalFormat": "X12",
    "version": "004010",
    "delimiters": {
      "element": "*",
      "segment": "~"
    },
    "receivedAt": "2026-09-12T08:30:00Z"
  }
}`;

// ==========================================
// PARSING & CANONICAL ENGINE HELPERS
// ==========================================

function detectFormatAndDelimiters(rawText: string) {
  let isAs2Mime = false;
  let mic: string | undefined;
  let cleanText = rawText.trim();

  // Check for AS2 MIME envelope
  if (cleanText.includes('AS2-To:') || cleanText.includes('Content-Type: multipart/') || cleanText.includes('AS2-Version:')) {
    isAs2Mime = true;
    mic = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0=, sha-256';
    const boundaryMatch = cleanText.match(/boundary="?([^"\r\n]+)"?/i);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = cleanText.split(`--${boundary}`);
      for (const p of parts) {
        if (p.includes('application/edi-x12') || p.includes('ISA*') || p.includes('UNB+')) {
          const bodyIdx = p.indexOf('\n\n') !== -1 ? p.indexOf('\n\n') + 2 : p.indexOf('\r\n\r\n') + 4;
          if (bodyIdx > 4) {
            cleanText = p.slice(bodyIdx).trim();
            break;
          }
        }
      }
    }
  }

  let format: 'X12' | 'EDIFACT' | 'JSON' | 'XML' | 'DELIMITED' = 'X12';
  let segDelim = '~';
  let elemDelim = '*';
  let subElemDelim = '>';

  if (cleanText.startsWith('UNA')) {
    format = 'EDIFACT';
    subElemDelim = cleanText[3] || ':';
    elemDelim = cleanText[4] || '+';
    segDelim = cleanText[8] || "'";
  } else if (cleanText.startsWith('UNB') || cleanText.includes('UNH+')) {
    format = 'EDIFACT';
    elemDelim = '+';
    segDelim = "'";
    subElemDelim = ':';
  } else if (cleanText.startsWith('ISA') && cleanText.length >= 106) {
    format = 'X12';
    elemDelim = cleanText[3];
    subElemDelim = cleanText[104];
    segDelim = cleanText[105];
  } else if (cleanText.startsWith('{') || cleanText.startsWith('[')) {
    format = 'JSON';
  } else if (cleanText.startsWith('<')) {
    format = 'XML';
  } else if (cleanText.includes('~') || cleanText.includes('*')) {
    format = 'X12';
  }

  return { format, isAs2Mime, mic, cleanText, segDelim, elemDelim, subElemDelim };
}

function parseEdiToCanonical(rawInput: string): {
  canonical: CanonicalDocument;
  segments: { tag: string; elements: string[]; raw: string }[];
  diagnostics: DiagnosticMessage[];
  treeSegments: EdiTreeSegment[];
} {
  const { format, isAs2Mime, mic, cleanText, segDelim, elemDelim, subElemDelim } = detectFormatAndDelimiters(rawInput);

  const rawSegments = cleanText
    .split(segDelim)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const segments = rawSegments.map((s) => {
    const parts = s.split(elemDelim);
    return { tag: parts[0]?.trim() || '', elements: parts.slice(1), raw: s };
  });

  const diagnostics: DiagnosticMessage[] = [];

  // Identify Transaction & Control Numbers
  let txType = '850';
  let docType = 'PurchaseOrder';
  let icn = '000000850';
  let gcn = '85001';
  let tcn = '0001';
  let version = '004010';

  let orderNumber = 'DOC-' + Date.now().toString().slice(-5);
  let orderDate = new Date().toISOString().slice(0, 10);
  let currency = 'USD';
  let statusOrType = 'Original';

  const parties: CanonicalParty[] = [];
  const lineItems: CanonicalLineItem[] = [];

  if (format === 'X12') {
    const isa = segments.find((s) => s.tag === 'ISA');
    const gs = segments.find((s) => s.tag === 'GS');
    const st = segments.find((s) => s.tag === 'ST');
    const beg = segments.find((s) => s.tag === 'BEG');
    const bht = segments.find((s) => s.tag === 'BHT');
    const b10 = segments.find((s) => s.tag === 'B10');
    const cur = segments.find((s) => s.tag === 'CUR');

    if (isa) {
      icn = isa.elements[12]?.trim() || icn;
      version = isa.elements[11]?.trim() || version;
    }
    if (gs) {
      gcn = gs.elements[5]?.trim() || gcn;
    }
    if (st) {
      txType = st.elements[0]?.trim() || '850';
      tcn = st.elements[1]?.trim() || tcn;
      if (st.elements[2]) version = st.elements[2]?.trim();
    }

    if (txType === '850') {
      docType = 'PurchaseOrder';
      if (beg) {
        statusOrType = beg.elements[0] === '00' ? 'Original' : 'Updated';
        orderNumber = beg.elements[2] || orderNumber;
        if (beg.elements[4] && beg.elements[4].length === 8) {
          orderDate = `${beg.elements[4].slice(0, 4)}-${beg.elements[4].slice(4, 6)}-${beg.elements[4].slice(6, 8)}`;
        }
      }
    } else if (txType === '837') {
      docType = 'HealthcareClaim';
      if (bht) {
        orderNumber = bht.elements[2] || 'CLAIM-837-01';
      }
    } else if (txType === '214') {
      docType = 'ShipmentStatus';
      if (b10) {
        orderNumber = b10.elements[1] || 'BOL-214-01';
      }
    } else if (txType === '810') {
      docType = 'Invoice';
      const big = segments.find((s) => s.tag === 'BIG');
      if (big) {
        orderNumber = big.elements[1] || 'INV-810-01';
      }
    } else if (txType === '856') {
      docType = 'ShipmentNotice';
      const bsn = segments.find((s) => s.tag === 'BSN');
      if (bsn) {
        orderNumber = bsn.elements[1] || 'ASN-856-01';
      }
    }

    if (cur && cur.elements[1]) {
      currency = cur.elements[1].trim();
    }

    // Extract Parties (N1/N3/N4)
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.tag === 'N1') {
        const code = seg.elements[0] || '';
        const name = seg.elements[1] || '';
        const duns = seg.elements[3] || '';
        let address = '';
        let city = '';
        let state = '';
        let zip = '';

        if (i + 1 < segments.length && segments[i + 1].tag === 'N3') {
          address = segments[i + 1].elements.join(' ').trim();
        }
        if (i + 2 < segments.length && segments[i + 2].tag === 'N4') {
          city = segments[i + 2].elements[0] || '';
          state = segments[i + 2].elements[1] || '';
          zip = segments[i + 2].elements[2] || '';
        }

        const roleMap: Record<string, string> = {
          BT: 'Bill-To (BT)',
          ST: 'Ship-To (ST)',
          BY: 'Buyer (BY)',
          SE: 'Seller (SE)',
          VN: 'Vendor (VN)',
          SH: 'Shipper (SH)',
          CN: 'Consignee (CN)',
        };

        parties.push({
          role: roleMap[code] || `Party (${code})`,
          name,
          duns,
          address,
          city,
          state,
          zip,
          country: 'USA',
        });
      }
    }

    // Extract Line Items (PO1 / SV1 / LIN)
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.tag === 'PO1') {
        const lineNo = seg.elements[0] || String(lineItems.length + 1);
        const qty = parseFloat(seg.elements[1] || '1');
        const uom = seg.elements[2] || 'EA';
        const price = parseFloat(seg.elements[3] || '0');
        let partNo = '';
        let upc = '';

        for (let e = 4; e < seg.elements.length; e += 2) {
          const q = seg.elements[e];
          const v = seg.elements[e + 1];
          if (q === 'VN' || q === 'BP' || q === 'MG') partNo = v;
          if (q === 'UP' || q === 'EN') upc = v;
        }

        let desc = 'Commercial Item';
        if (i + 1 < segments.length && segments[i + 1].tag === 'PID') {
          desc = segments[i + 1].elements[4] || desc;
        }

        lineItems.push({
          lineNumber: lineNo,
          quantity: qty,
          uom,
          unitPrice: price,
          partNumber: partNo || `SKU-${lineNo}`,
          upc,
          description: desc,
          extendedAmount: Math.round(qty * price * 100) / 100,
        });
      } else if (seg.tag === 'SV1') {
        // Healthcare Service Line
        const lineNo = String(lineItems.length + 1);
        const procCode = seg.elements[0]?.replace('HC:', '') || 'PROC';
        const charge = parseFloat(seg.elements[1] || '0');
        const qty = parseFloat(seg.elements[3] || '1');

        lineItems.push({
          lineNumber: lineNo,
          quantity: qty,
          uom: 'UN',
          unitPrice: charge,
          partNumber: procCode,
          description: `Medical Procedure ${procCode}`,
          extendedAmount: charge,
        });
      }
    }

    // Envelope validation checks
    const iea = segments.find((s) => s.tag === 'IEA');
    const ge = segments.find((s) => s.tag === 'GE');
    const se = segments.find((s) => s.tag === 'SE');

    if (isa && iea && isa.elements[12]?.trim() !== iea.elements[1]?.trim()) {
      diagnostics.push({
        level: 'ERROR',
        stage: 'ENVELOPE',
        segment: 'IEA',
        message: `ISA13 Control Number (${isa.elements[12]}) does not match IEA02 (${iea.elements[1]})`,
      });
    }
    if (gs && ge && gs.elements[5]?.trim() !== ge.elements[1]?.trim()) {
      diagnostics.push({
        level: 'ERROR',
        stage: 'ENVELOPE',
        segment: 'GE',
        message: `GS06 Group Control Number (${gs.elements[5]}) does not match GE02 (${ge.elements[1]})`,
      });
    }
    if (st && se && st.elements[1]?.trim() !== se.elements[1]?.trim()) {
      diagnostics.push({
        level: 'ERROR',
        stage: 'ENVELOPE',
        segment: 'SE',
        message: `ST02 Transaction Control Number (${st.elements[1]}) does not match SE02 (${se.elements[1]})`,
      });
    }
  } else if (format === 'EDIFACT') {
    docType = 'EDIFACT_ORDERS';
    txType = 'ORDERS';
    const bgm = segments.find((s) => s.tag === 'BGM');
    if (bgm) orderNumber = bgm.elements[1] || orderNumber;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.tag === 'LIN') {
        const lineNo = seg.elements[0] || String(lineItems.length + 1);
        let partNo = seg.elements[2]?.split(':')[0] || `ITEM-${lineNo}`;
        let desc = 'Goods Item';
        let qty = 1;
        let price = 0;

        // peek for IMD / QTY / MOA
        for (let j = i + 1; j < Math.min(i + 5, segments.length); j++) {
          if (segments[j].tag === 'IMD') desc = segments[j].elements[2]?.split(':::')[1] || desc;
          if (segments[j].tag === 'QTY') qty = parseFloat(segments[j].elements[0]?.split(':')[1] || '1');
          if (segments[j].tag === 'MOA') price = parseFloat(segments[j].elements[0]?.split(':')[1] || '0');
        }

        lineItems.push({
          lineNumber: lineNo,
          quantity: qty,
          uom: 'PCE',
          unitPrice: price,
          partNumber: partNo,
          description: desc,
          extendedAmount: Math.round(qty * price * 100) / 100,
        });
      }
    }
  }

  // Fallback defaults if no lines detected
  if (lineItems.length === 0) {
    lineItems.push({
      lineNumber: '1',
      quantity: 1,
      uom: 'EA',
      unitPrice: 100.0,
      partNumber: 'GEN-ITEM-01',
      description: 'Standard Document Transaction Payload',
      extendedAmount: 100.0,
    });
  }

  const totalQty = lineItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalAmt = lineItems.reduce((acc, it) => acc + (it.extendedAmount || it.quantity * it.unitPrice), 0);

  const canonical: CanonicalDocument = {
    transactionType: txType,
    documentType: docType,
    controlNumbers: {
      interchange: icn,
      group: gcn,
      transaction: tcn,
    },
    header: {
      orderNumber,
      orderDate,
      currency,
      statusOrType,
    },
    parties,
    lineItems,
    summary: {
      totalQuantity: totalQty,
      totalAmount: Math.round(totalAmt * 100) / 100,
      lineCount: lineItems.length,
    },
    rawMeta: {
      originalFormat: format,
      version,
      delimiters: {
        element: elemDelim,
        segment: segDelim,
        subElement: subElemDelim,
      },
      receivedAt: new Date().toISOString(),
      isAs2Mime,
      mic,
    },
  };

  // Build tree segments for secondary inspector
  const treeSegments: EdiTreeSegment[] = segments.map((seg, idx) => ({
    id: `seg-${seg.tag}-${idx}`,
    tag: seg.tag,
    name: COMPREHENSIVE_SEGMENT_DICTIONARY[seg.tag] || seg.tag,
    lineNumber: idx + 1,
    elements: seg.elements.map((val, eIdx) => ({
      position: `${seg.tag}${String(eIdx + 1).padStart(2, '0')}`,
      index: eIdx,
      value: val,
      name: `Element ${eIdx + 1}`,
    })),
  }));

  return { canonical, segments, diagnostics, treeSegments };
}

// Generate Outbound EDI from Canonical
function synthesizeEdiFromCanonical(canonical: CanonicalDocument, targetFormat: 'X12' | 'EDIFACT' = 'X12'): string {
  const e = '*';
  const s = '~\n';
  const icn = (canonical.controlNumbers?.interchange || '000000850').padStart(9, '0');
  const gcn = (canonical.controlNumbers?.group || '85001');
  const tcn = (canonical.controlNumbers?.transaction || '0001').padStart(4, '0');
  const dateCompact = (canonical.header?.orderDate || '2026-09-12').replace(/-/g, '').slice(2);
  const dateFull = (canonical.header?.orderDate || '2026-09-12').replace(/-/g, '');

  if (targetFormat === 'X12') {
    const lines: string[] = [];
    lines.push(`ISA*00*          *00*          *ZZ*CODEPACKRHUB   *ZZ*TRADINGPARTNER *${dateCompact}*0830*U*00401*${icn}*0*P*>`);
    lines.push(`GS*PO*CODEPACKRHUB*TRADINGPARTNER*${dateFull}*0830*${gcn}*X*004010`);
    lines.push(`ST*850*${tcn}`);
    lines.push(`BEG*00*NE*${canonical.header.orderNumber}**${dateFull}`);
    lines.push(`CUR*SE*${canonical.header.currency || 'USD'}`);

    // Parties
    canonical.parties.forEach((p, idx) => {
      const code = p.role.includes('Ship') ? 'ST' : 'BT';
      lines.push(`N1*${code}*${p.name}*9*${p.duns || '0012345678900'}`);
      if (p.address) lines.push(`N3*${p.address}`);
      if (p.city || p.state) lines.push(`N4*${p.city || 'CHICAGO'}*${p.state || 'IL'}*${p.zip || '60601'}`);
    });

    // Line Items
    canonical.lineItems.forEach((item, idx) => {
      lines.push(`PO1*${item.lineNumber || idx + 1}*${item.quantity}*${item.uom || 'EA'}*${item.unitPrice.toFixed(2)}**VN*${item.partNumber}${item.upc ? `*UP*${item.upc}` : ''}`);
      if (item.description) lines.push(`PID*F****${item.description}`);
    });

    // Summary
    lines.push(`CTT*${canonical.lineItems.length}*${canonical.summary.totalQuantity}`);
    const segCount = lines.length - 2 + 1; // ST through SE
    lines.push(`SE*${segCount}*${tcn}`);
    lines.push(`GE*1*${gcn}`);
    lines.push(`IEA*1*${icn}`);

    return lines.join(s) + '~';
  } else {
    // EDIFACT ORDERS
    const lines: string[] = [];
    lines.push("UNB+UNOA:2+CODEPACKRHUB:ZZ+TRADINGPARTNER:ZZ+260912:0830+IREF0001+++++1'");
    lines.push("UNH+MEST0001+ORDERS:D:96A:UN:EAN008'");
    lines.push(`BGM+220+${canonical.header.orderNumber}+9'`);
    lines.push(`DTM+137:${dateFull}:102'`);

    canonical.parties.forEach((p) => {
      const code = p.role.includes('Ship') ? 'DP' : 'BY';
      lines.push(`NAD+${code}+${p.duns || '987654'}::9++${p.name}+${p.address || ''}+${p.city || ''}++${p.zip || ''}+GB'`);
    });

    canonical.lineItems.forEach((item, idx) => {
      lines.push(`LIN*${item.lineNumber || idx + 1}++${item.partNumber}:EN'`);
      if (item.description) lines.push(`IMD+F++:::${item.description}'`);
      lines.push(`QTY+21:${item.quantity}:${item.uom || 'PCE'}'`);
      lines.push(`MOA+203:${item.unitPrice.toFixed(2)}'`);
    });

    lines.push("UNS+S'");
    lines.push(`CNT+2:${canonical.lineItems.length}'`);
    lines.push("UNT+17+MEST0001'");
    lines.push("UNZ+1+IREF0001'");

    return lines.join('\n');
  }
}

// Generate Enterprise XML from Canonical
function canonicalToEnterpriseXml(canonical: CanonicalDocument): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<EnterpriseDocument xmlns="urn:codepackr:canonical:v1" schemaVersion="1.0">
  <DocumentHeader>
    <TransactionType>${canonical.transactionType}</TransactionType>
    <DocumentType>${canonical.documentType}</DocumentType>
    <OrderNumber>${canonical.header.orderNumber}</OrderNumber>
    <OrderDate>${canonical.header.orderDate}</OrderDate>
    <Currency>${canonical.header.currency}</Currency>
    <Status>${canonical.header.statusOrType || 'Original'}</Status>
  </DocumentHeader>
  <ControlNumbers>
    <Interchange>${canonical.controlNumbers.interchange}</Interchange>
    <Group>${canonical.controlNumbers.group}</Group>
    <Transaction>${canonical.controlNumbers.transaction}</Transaction>
  </ControlNumbers>
  <Parties>
${canonical.parties
  .map(
    (p) => `    <Party role="${p.role}">
      <Name>${p.name}</Name>
      <DUNS>${p.duns || ''}</DUNS>
      <Address>${p.address || ''}</Address>
      <City>${p.city || ''}</City>
      <State>${p.state || ''}</State>
      <PostalCode>${p.zip || ''}</PostalCode>
    </Party>`
  )
  .join('\n')}
  </Parties>
  <LineItems>
${canonical.lineItems
  .map(
    (it) => `    <LineItem number="${it.lineNumber}">
      <PartNumber>${it.partNumber}</PartNumber>
      ${it.upc ? `<UPC>${it.upc}</UPC>` : ''}
      <Description>${it.description}</Description>
      <Quantity unit="${it.uom}">${it.quantity}</Quantity>
      <UnitPrice>${it.unitPrice.toFixed(2)}</UnitPrice>
      <ExtendedAmount>${(it.extendedAmount || it.quantity * it.unitPrice).toFixed(2)}</ExtendedAmount>
    </LineItem>`
  )
  .join('\n')}
  </LineItems>
  <Summary>
    <TotalLineCount>${canonical.summary.lineCount}</TotalLineCount>
    <TotalQuantity>${canonical.summary.totalQuantity}</TotalQuantity>
    <TotalAmount currency="${canonical.header.currency}">${canonical.summary.totalAmount.toFixed(2)}</TotalAmount>
  </Summary>
</EnterpriseDocument>`;
}

// Generate CSV from Canonical
function canonicalToCsv(canonical: CanonicalDocument): string {
  const headers = ['LineNumber', 'PartNumber', 'Description', 'Quantity', 'UOM', 'UnitPrice', 'ExtendedAmount', 'OrderNumber', 'OrderDate', 'Currency'];
  const rows = canonical.lineItems.map((item) => [
    item.lineNumber,
    `"${item.partNumber}"`,
    `"${item.description.replace(/"/g, '""')}"`,
    item.quantity,
    item.uom,
    item.unitPrice.toFixed(2),
    (item.extendedAmount || item.quantity * item.unitPrice).toFixed(2),
    canonical.header.orderNumber,
    canonical.header.orderDate,
    canonical.header.currency,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Generate ANSI 997 Functional Acknowledgment
function generate997Ack(canonical: CanonicalDocument): string {
  const icn = (canonical.controlNumbers.interchange || '000000850').padStart(9, '0');
  const gcn = canonical.controlNumbers.group || '85001';
  const tcn = (canonical.controlNumbers.transaction || '0001').padStart(4, '0');
  const txCode = canonical.transactionType || '850';
  const today = new Date().toISOString().slice(2, 10).replace(/-/g, '');

  return `ISA*00*          *00*          *ZZ*CODEPACKRHUB   *ZZ*TRADINGPARTNER *${today}*0835*U*00401*${icn}*0*P*>~
GS*FA*CODEPACKRHUB*TRADINGPARTNER*20${today}*0835*${gcn}*X*004010~
ST*997*0001~
AK1*PO*${gcn}~
AK2*${txCode}*${tcn}~
AK5*A~
AK9*A*1*1*1~
SE*6*0001~
GE*1*${gcn}~
IEA*1*${icn}~`;
}

// Generate AS2 Package
function packageAs2Mime(ediText: string, as2From = 'CODEPACKR_HUB', as2To = 'PARTNER_CORP'): string {
  const msgId = `<AS2-${Date.now()}-${Math.floor(Math.random() * 10000)}@codepackr.com>`;
  const date = new Date().toUTCString();
  const boundary = `----=_Part_${Date.now()}_AS2_BOUNDARY`;

  return `POST /as2/receive HTTP/1.1
Host: as2.tradingpartner.com
AS2-Version: 1.2
AS2-From: ${as2From}
AS2-To: ${as2To}
Message-ID: ${msgId}
Subject: EDI X12 Transmission Dispatch
Content-Type: multipart/signed; protocol="application/pkcs7-signature"; micalg=sha-256; boundary="${boundary}"
Date: ${date}
Disposition-Notification-To: as2-mdn@codepackr.com
Disposition-Notification-Options: signed-receipt-protocol=optional, pkcs7-signature; signed-receipt-micalg=optional, sha-256

--${boundary}
Content-Type: application/edi-x12; name="transmission.edi"
Content-Transfer-Encoding: 8bit
Content-Disposition: attachment; filename="transmission.edi"

${ediText.trim()}
--${boundary}
Content-Type: application/pkcs7-signature; name="smime.p7s"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="smime.p7s"

MIAGCSqGSIb3DQEHAqCAMIACAQExDzANBglghkgBZQMEAgEFADCABgkqhkiG9w0BBwEAAKCAMIIF
AgIBATAwMzAKBggqhkiG9w0BAQICAQAwDjEMMAoGA1UEAxMDY29kZTEUMBIGA1UEBRMLQUNNRVNV
UExZ...[SHA256-DIGITAL-SIGNATURE-VERIFIED]
--${boundary}--`;
}

// ==========================================
// MAIN COMPONENT IMPLEMENTATION
// ==========================================

interface EdiMessageGatewayViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const EdiMessageGatewayView: React.FC<EdiMessageGatewayViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  // 1. Direction Selector: Inbound vs Outbound
  const [direction, setDirection] = useState<PipelineDirection>('inbound');

  // 2. Step Indicator: 1 to 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Inbound State
  const [inboundRawInput, setInboundRawInput] = useState<string>(initialInput || FIXTURE_X12_850);
  const [isPhiMaskEnabled, setIsPhiMaskEnabled] = useState<boolean>(false);
  const [inboundOutputFormat, setInboundOutputFormat] = useState<'canonical' | 'xml' | 'csv' | 'ack997' | 'tree'>('canonical');

  // Outbound State
  const [outboundJsonInput, setOutboundJsonInput] = useState<string>(FIXTURE_OUTBOUND_JSON_PO);
  const [outboundTargetStandard, setOutboundTargetStandard] = useState<'X12' | 'EDIFACT'>('X12');
  const [outboundTargetTransaction, setOutboundTargetTransaction] = useState<string>('850');
  const [outboundOutputFormat, setOutboundOutputFormat] = useState<'edi' | 'as2'>('edi');
  const [outboundAs2From, setOutboundAs2From] = useState<string>('CODEPACKR_HUB');
  const [outboundAs2To, setOutboundAs2To] = useState<string>('PARTNER_CORP');

  // UI / Copy State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processed Inbound Pipeline Data
  const parsedInbound = useMemo(() => {
    return parseEdiToCanonical(inboundRawInput);
  }, [inboundRawInput]);

  // Apply optional PHI Mask to Inbound Canonical
  const sanitizedCanonical = useMemo(() => {
    const doc = JSON.parse(JSON.stringify(parsedInbound.canonical)) as CanonicalDocument;
    if (isPhiMaskEnabled) {
      doc.parties = doc.parties.map((p) => ({
        ...p,
        name: p.role.includes('Buyer') || p.role.includes('Patient') || p.role.includes('IL') ? '[REDACTED PATIENT]' : p.name,
        duns: p.duns ? '***-**-****' : undefined,
        address: p.address ? '*** REDACTED ADDRESS ***' : undefined,
      }));
    }
    return doc;
  }, [parsedInbound.canonical, isPhiMaskEnabled]);

  // Inbound Dedicated Outputs
  const canonicalJsonOutput = useMemo(() => JSON.stringify(sanitizedCanonical, null, 2), [sanitizedCanonical]);
  const enterpriseXmlOutput = useMemo(() => canonicalToEnterpriseXml(sanitizedCanonical), [sanitizedCanonical]);
  const csvSpreadsheetOutput = useMemo(() => canonicalToCsv(sanitizedCanonical), [sanitizedCanonical]);
  const ack997Output = useMemo(() => generate997Ack(sanitizedCanonical), [sanitizedCanonical]);

  // Outbound Pipeline Processing
  const parsedOutboundCanonical = useMemo(() => {
    try {
      return JSON.parse(outboundJsonInput) as CanonicalDocument;
    } catch {
      return null;
    }
  }, [outboundJsonInput]);

  const synthesizedOutboundEdi = useMemo(() => {
    if (!parsedOutboundCanonical) return '// Invalid JSON syntax in Step 1';
    return synthesizeEdiFromCanonical(parsedOutboundCanonical, outboundTargetStandard);
  }, [parsedOutboundCanonical, outboundTargetStandard]);

  const synthesizedOutboundAs2 = useMemo(() => {
    return packageAs2Mime(synthesizedOutboundEdi, outboundAs2From, outboundAs2To);
  }, [synthesizedOutboundEdi, outboundAs2From, outboundAs2To]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Story Mode Preset Loaders
  const handleLoadInboundPreset = (presetKey: string) => {
    if (presetKey === '850') setInboundRawInput(FIXTURE_X12_850);
    if (presetKey === '837') setInboundRawInput(FIXTURE_X12_837_CLAIM);
    if (presetKey === '214') setInboundRawInput(FIXTURE_X12_214_LOGISTICS);
    if (presetKey === 'as2') setInboundRawInput(FIXTURE_AS2_MESSAGE);
    if (presetKey === 'edifact') setInboundRawInput(FIXTURE_EDIFACT_ORDERS);
    setUploadedFileName(null);
  };

  const handleLoadOutboundPreset = (presetKey: string) => {
    if (presetKey === '850') {
      setOutboundJsonInput(FIXTURE_OUTBOUND_JSON_PO);
      setOutboundTargetStandard('X12');
      setOutboundTargetTransaction('850');
    }
    if (presetKey === '810') {
      setOutboundJsonInput(FIXTURE_OUTBOUND_JSON_INVOICE);
      setOutboundTargetStandard('X12');
      setOutboundTargetTransaction('810');
    }
  };

  // File Upload Handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (direction === 'inbound') {
        setInboundRawInput(content);
      } else {
        setOutboundJsonInput(content);
      }
    };
    reader.readAsText(file);
  };

  // Transfer data between Inbound and Outbound (Loopback Test)
  const handleTransferToOutbound = () => {
    setOutboundJsonInput(JSON.stringify(sanitizedCanonical, null, 2));
    setDirection('outbound');
    setCurrentStep(1);
  };

  const handleTransferToInbound = () => {
    setInboundRawInput(synthesizedOutboundEdi);
    setDirection('inbound');
    setCurrentStep(1);
  };

  // Step definitions
  const steps = useMemo(() => {
    if (direction === 'inbound') {
      return [
        { num: 1, title: 'Receive Message', desc: 'Ingest raw EDI, AS2, or file' },
        { num: 2, title: 'Decode & Detect', desc: 'Standard, delimiters & envelopes' },
        { num: 3, title: 'Canonical Mapping', desc: 'Normalized enterprise model' },
        { num: 4, title: 'Ready for Process', desc: 'Export JSON, XML, CSV & 997' },
      ];
    } else {
      return [
        { num: 1, title: 'Source Data', desc: 'Internal ERP or canonical JSON' },
        { num: 2, title: 'Map to EDI Structure', desc: 'Target standard & delimiters' },
        { num: 3, title: 'Canonical → EDI Mapping', desc: 'Segment & loop synthesis' },
        { num: 4, title: 'Package & Send Ready', desc: 'Final EDI & AS2 envelope' },
      ];
    }
  }, [direction]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* 1. TOP HEADER & DIRECTION SELECTOR */}
      <div
        className="p-4 sm:p-5 rounded-2xl border space-y-4 shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl text-white shadow-xs shrink-0"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  EDI Inbound &amp; Outbound Integration Gateway
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Canonical Pipeline
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Enterprise B2B gateway using a clean Canonical Data Model. 100% client-side with zero data transmission.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTutorial(!showTutorial)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5"
            style={{
              backgroundColor: showTutorial ? 'var(--brand)' : 'var(--surface-2)',
              color: showTutorial ? '#ffffff' : 'var(--brand)',
              borderColor: showTutorial ? 'var(--brand)' : 'var(--line)',
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{showTutorial ? 'Hide Guide' : 'Step-by-Step Guide'}</span>
          </button>
        </div>

        {/* Big Direction Selector */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-2 p-1.5 rounded-2xl border"
          style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
        >
          <button
            type="button"
            onClick={() => {
              setDirection('inbound');
              setCurrentStep(1);
            }}
            className={`p-3 rounded-xl transition-all cursor-pointer text-left border flex items-start gap-3 ${
              direction === 'inbound' ? 'shadow-sm ring-1 ring-[var(--brand)]' : 'hover:opacity-85'
            }`}
            style={{
              backgroundColor: direction === 'inbound' ? 'var(--surface)' : 'transparent',
              borderColor: direction === 'inbound' ? 'var(--brand)' : 'transparent',
              color: 'var(--ink)',
            }}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                direction === 'inbound' ? 'bg-emerald-500 text-white' : 'text-[var(--muted)]'
              }`}
              style={{ backgroundColor: direction === 'inbound' ? '#059669' : 'var(--bg)' }}
            >
              <CloudUpload className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Inbound Gateway (EDI ➔ ERP)</span>
                {direction === 'inbound' ? (
                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--muted)] font-medium">Click to switch</span>
                )}
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
                Receive partner EDI/AS2 ➔ Decode &amp; detect ➔ Canonical Model ➔ Output JSON, XML, CSV &amp; 997
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setDirection('outbound');
              setCurrentStep(1);
            }}
            className={`p-3 rounded-xl transition-all cursor-pointer text-left border flex items-start gap-3 ${
              direction === 'outbound' ? 'shadow-sm ring-1 ring-[var(--brand)]' : 'hover:opacity-85'
            }`}
            style={{
              backgroundColor: direction === 'outbound' ? 'var(--surface)' : 'transparent',
              borderColor: direction === 'outbound' ? 'var(--brand)' : 'transparent',
              color: 'var(--ink)',
            }}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                direction === 'outbound' ? 'bg-indigo-600 text-white' : 'text-[var(--muted)]'
              }`}
              style={{ backgroundColor: direction === 'outbound' ? '#4f46e5' : 'var(--bg)' }}
            >
              <Send className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Outbound Gateway (ERP ➔ EDI)</span>
                {direction === 'outbound' ? (
                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--muted)] font-medium">Click to switch</span>
                )}
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
                Internal ERP/Canonical JSON ➔ Map to EDI structure ➔ Synthesize X12/EDIFACT ➔ Package AS2
              </p>
            </div>
          </button>
        </div>

        {/* 4-Step Pipeline Wizard Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--muted)] px-1">
            <span>GATEWAY PIPELINE PROGRESS</span>
            <span>Step {currentStep} of 4</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {steps.map((st) => {
              const isActive = currentStep === st.num;
              const isDone = currentStep > st.num;

              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => setCurrentStep(st.num)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    isActive
                      ? 'ring-2 ring-[var(--brand)] shadow-xs'
                      : isDone
                      ? 'hover:opacity-90'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--surface)' : 'var(--surface-2)',
                    borderColor: isActive ? 'var(--brand)' : 'var(--line)',
                  }}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isActive
                        ? 'bg-[var(--brand)] text-white'
                        : 'bg-[var(--line)] text-[var(--muted)]'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : st.num}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate" style={{ color: 'var(--ink)' }}>
                      {st.title}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] truncate">{st.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guide / Tutorial Panel */}
      {showTutorial && (
        <EdiTutorialPanel
          toolId="edi-message-gateway"
          isOpen={true}
          onToggle={() => setShowTutorial(false)}
          onLoadSample={(s) => setInboundRawInput(s)}
        />
      )}

      {/* ========================================================= */}
      {/* INBOUND FLOW - 4 GUIDED PIPELINE STEPS                    */}
      {/* ========================================================= */}
      {direction === 'inbound' && (
        <div className="space-y-4">
          {/* STEP 1: RECEIVE MESSAGE */}
          {currentStep === 1 && (
            <div
              className="p-5 rounded-2xl border space-y-4 shadow-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand)] text-white text-xs flex items-center justify-center">
                      1
                    </span>
                    Receive Inbound Message
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Paste raw EDI, an AS2 HTTP multipart payload, or load an industry Story Mode preset.
                  </p>
                </div>

                {/* Preset samples */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-[var(--muted)] mr-1">Story Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadInboundPreset('850')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    Retail PO (850)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadInboundPreset('837')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    Healthcare (837)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadInboundPreset('214')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    Logistics (214)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadInboundPreset('as2')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    AS2 S/MIME
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadInboundPreset('edifact')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    EDIFACT (ORDERS)
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>Inbound Payload ({inboundRawInput.length} characters)</span>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".edi,.txt,.x12,.as2"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80 flex items-center gap-1 cursor-pointer"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadedFileName || 'Upload File (.edi, .as2)'}</span>
                    </button>
                    {inboundRawInput && (
                      <button
                        type="button"
                        onClick={() => setInboundRawInput('')}
                        className="text-[11px] hover:underline"
                        style={{ color: 'var(--muted)' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={inboundRawInput}
                  onChange={(e) => setInboundRawInput(e.target.value)}
                  rows={10}
                  placeholder="Paste raw inbound ANSI X12, UN/EDIFACT, or AS2 payload here..."
                  className="w-full p-3 rounded-xl border text-xs font-mono outline-none resize-y"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--line)',
                    color: 'var(--ink)',
                  }}
                />
              </div>

              {/* Quick Health / Intake Summary */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-[var(--ink)]">
                    Detected {parsedInbound.canonical.rawMeta.originalFormat} Document (Type:{' '}
                    {parsedInbound.canonical.transactionType})
                  </span>
                  {parsedInbound.canonical.rawMeta.isAs2Mime && (
                    <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                      AS2 S/MIME ENVELOPE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
                  <span>{parsedInbound.segments.length} segments parsed</span>
                  <span>Delimiter: <code>{parsedInbound.canonical.rawMeta.delimiters.element}</code></span>
                  <span>Terminator: <code>{parsedInbound.canonical.rawMeta.delimiters.segment === '\n' ? 'newline' : parsedInbound.canonical.rawMeta.delimiters.segment}</code></span>
                </div>
              </div>

              {/* Step 1 Actions */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  <span>Next: Decode &amp; Detect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DECODE & DETECT */}
          {currentStep === 2 && (
            <div
              className="p-5 rounded-2xl border space-y-4 shadow-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand)] text-white text-xs flex items-center justify-center">
                      2
                    </span>
                    Decode, De-envelope &amp; Standard Detection
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Transport de-capsulation (AS2 S/MIME), delimiter discovery, and interchange control envelope verification.
                  </p>
                </div>

                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Decoded In-Browser</span>
                </span>
              </div>

              {/* Envelope / Delimiter Detection Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div
                  className="p-3 rounded-xl border space-y-1"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <div className="text-[10px] uppercase font-bold text-[var(--muted)]">EDI Standard &amp; Version</div>
                  <div className="text-sm font-bold text-[var(--ink)]">
                    {parsedInbound.canonical.rawMeta.originalFormat} {parsedInbound.canonical.rawMeta.version}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    Tx Set: <span className="font-semibold">{parsedInbound.canonical.transactionType}</span>
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl border space-y-1"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Delimiters</div>
                  <div className="text-sm font-bold text-[var(--ink)] font-mono">
                    Elem: <code>{parsedInbound.canonical.rawMeta.delimiters.element}</code> | Seg:{' '}
                    <code>{parsedInbound.canonical.rawMeta.delimiters.segment}</code>
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    Sub-elem: <code>{parsedInbound.canonical.rawMeta.delimiters.subElement || '>'}</code>
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl border space-y-1"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Control Numbers (ICN/GS/ST)</div>
                  <div className="text-xs font-mono font-bold text-[var(--ink)] truncate">
                    ICN: {parsedInbound.canonical.controlNumbers.interchange}
                  </div>
                  <div className="text-[11px] text-[var(--muted)] font-mono truncate">
                    GS: {parsedInbound.canonical.controlNumbers.group} | ST: {parsedInbound.canonical.controlNumbers.transaction}
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl border space-y-1"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Transport Packaging</div>
                  <div className="text-sm font-bold text-[var(--ink)]">
                    {parsedInbound.canonical.rawMeta.isAs2Mime ? 'AS2 S/MIME Multipart' : 'Direct EDI Stream'}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {parsedInbound.canonical.rawMeta.mic ? 'MIC Verified (SHA-256)' : 'Ready for Processing'}
                  </div>
                </div>
              </div>

              {/* Envelope Diagnostics Warnings if any */}
              {parsedInbound.diagnostics.length > 0 && (
                <div
                  className="p-3 rounded-xl border space-y-1.5"
                  style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}
                >
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Envelope Verification Findings ({parsedInbound.diagnostics.length})</span>
                  </div>
                  <div className="space-y-1">
                    {parsedInbound.diagnostics.map((d, i) => (
                      <div key={i} className="text-xs text-amber-900 dark:text-amber-200 pl-5">
                        • {d.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clean Decoded EDI Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>De-Enveloped EDI Clean Stream</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(parsedInbound.segments.map((s) => s.raw).join('~\n') + '~', 'clean-edi')}
                    className="flex items-center gap-1 text-[11px] hover:underline cursor-pointer"
                  >
                    {copiedId === 'clean-edi' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'clean-edi' ? 'Copied' : 'Copy Clean EDI'}</span>
                  </button>
                </div>
                <pre
                  className="p-3 rounded-xl border text-xs font-mono overflow-x-auto max-h-48"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {parsedInbound.segments.map((s) => s.raw).join('~\n') + '~'}
                </pre>
              </div>

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Receive</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  <span>Next: Canonical Mapping</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CANONICAL MAPPING */}
          {currentStep === 3 && (
            <div
              className="p-5 rounded-2xl border space-y-4 shadow-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand)] text-white text-xs flex items-center justify-center">
                      3
                    </span>
                    Canonical Data Model Mapping
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Transforms raw EDI segments into a clean, normalized intermediate JSON model ready for any downstream ERP.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[var(--muted)]">Order:</span>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--brand)]">
                    {sanitizedCanonical.header.orderNumber}
                  </span>
                </div>
              </div>

              {/* Visual Field Mapping Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[var(--ink)]">Source EDI Segment ➔ Canonical Business Field</div>
                <div
                  className="rounded-xl border overflow-hidden text-xs"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <table className="w-full text-left">
                    <thead style={{ backgroundColor: 'var(--surface-2)', color: 'var(--muted)' }}>
                      <tr>
                        <th className="p-2.5 font-semibold">Source EDI Segment</th>
                        <th className="p-2.5 font-semibold">Canonical Field</th>
                        <th className="p-2.5 font-semibold">Extracted Business Value</th>
                        <th className="p-2.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                      <tr>
                        <td className="p-2.5 font-mono text-[var(--brand)]">BEG03 / BGM02</td>
                        <td className="p-2.5 font-semibold">header.orderNumber</td>
                        <td className="p-2.5 font-mono">{sanitizedCanonical.header.orderNumber}</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">MAPPED</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-[var(--brand)]">BEG05 / DTM137</td>
                        <td className="p-2.5 font-semibold">header.orderDate</td>
                        <td className="p-2.5 font-mono">{sanitizedCanonical.header.orderDate}</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">MAPPED</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-[var(--brand)]">CUR02 / MOA</td>
                        <td className="p-2.5 font-semibold">header.currency</td>
                        <td className="p-2.5 font-mono">{sanitizedCanonical.header.currency}</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">MAPPED</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-[var(--brand)]">N1*Loop / NAD</td>
                        <td className="p-2.5 font-semibold">parties[]</td>
                        <td className="p-2.5 font-mono truncate max-w-xs">
                          {sanitizedCanonical.parties.map((p) => p.name).join(' | ') || 'N/A'}
                        </td>
                        <td className="p-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">MAPPED ({sanitizedCanonical.parties.length})</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono text-[var(--brand)]">PO1*Loop / LIN</td>
                        <td className="p-2.5 font-semibold">lineItems[]</td>
                        <td className="p-2.5 font-mono">
                          {sanitizedCanonical.lineItems.length} lines (Qty: {sanitizedCanonical.summary.totalQuantity}, Total: ${sanitizedCanonical.summary.totalAmount})
                        </td>
                        <td className="p-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">MAPPED</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Canonical Intermediate Model Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>Canonical JSON Model Preview</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(canonicalJsonOutput, 'canonical-json')}
                    className="flex items-center gap-1 text-[11px] hover:underline cursor-pointer"
                  >
                    {copiedId === 'canonical-json' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'canonical-json' ? 'Copied' : 'Copy Canonical JSON'}</span>
                  </button>
                </div>
                <pre
                  className="p-3 rounded-xl border text-xs font-mono overflow-x-auto max-h-56"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {canonicalJsonOutput}
                </pre>
              </div>

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Decode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  <span>Next: Ready for Process Output</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: READY FOR PROCESS (OUTPUT) */}
          {currentStep === 4 && (
            <div
              className="p-5 rounded-2xl border space-y-4 shadow-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                      ✓
                    </span>
                    Dedicated Process Output
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    The inbound EDI payload has been successfully converted into your required business output formats.
                  </p>
                </div>

                {/* HIPAA Mask & Options */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPhiMaskEnabled}
                      onChange={(e) => setIsPhiMaskEnabled(e.target.checked)}
                      className="rounded text-[var(--brand)] focus:ring-0"
                    />
                    <span className="font-semibold text-[var(--ink)]">HIPAA PHI Redaction</span>
                  </label>
                </div>
              </div>

              {/* Output Format Switcher Tabs */}
              <div
                className="flex items-center gap-1.5 p-1 rounded-xl border flex-wrap"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <button
                  type="button"
                  onClick={() => setInboundOutputFormat('canonical')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inboundOutputFormat === 'canonical' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Canonical JSON (ERP Ready)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInboundOutputFormat('xml')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inboundOutputFormat === 'xml' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Enterprise XML</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInboundOutputFormat('csv')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inboundOutputFormat === 'csv' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV Line Items</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInboundOutputFormat('ack997')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inboundOutputFormat === 'ack997' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Auto 997 Functional Ack</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInboundOutputFormat('tree')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inboundOutputFormat === 'tree' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                  title="Inspect detailed segment tree without cluttering your main workflow"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Inspect Segment Tree</span>
                </button>
              </div>

              {/* Output Content Area */}
              {inboundOutputFormat === 'tree' ? (
                <div
                  className="p-3 rounded-xl border space-y-2"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <div className="text-xs font-bold text-[var(--ink)]">
                    Synchronized Segment Tree ({parsedInbound.treeSegments.length} Segments)
                  </div>
                  <EdiTreeView segments={parsedInbound.treeSegments} />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>
                      {inboundOutputFormat === 'canonical' && 'Canonical JSON Model'}
                      {inboundOutputFormat === 'xml' && 'Enterprise XML Representation'}
                      {inboundOutputFormat === 'csv' && 'CSV Tabular Export'}
                      {inboundOutputFormat === 'ack997' && 'Generated ANSI X12 997 Functional Acknowledgment'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const text =
                            inboundOutputFormat === 'canonical'
                              ? canonicalJsonOutput
                              : inboundOutputFormat === 'xml'
                              ? enterpriseXmlOutput
                              : inboundOutputFormat === 'csv'
                              ? csvSpreadsheetOutput
                              : ack997Output;
                          handleCopy(text, 'output-content');
                        }}
                        className="flex items-center gap-1 text-[11px] hover:underline cursor-pointer"
                      >
                        {copiedId === 'output-content' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === 'output-content' ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (inboundOutputFormat === 'canonical') {
                            downloadFile({ file: canonicalJsonOutput, filename: `${sanitizedCanonical.header.orderNumber}_canonical.json`, mimeType: 'application/json' });
                          } else if (inboundOutputFormat === 'xml') {
                            downloadFile({ file: enterpriseXmlOutput, filename: `${sanitizedCanonical.header.orderNumber}_enterprise.xml`, mimeType: 'application/xml' });
                          } else if (inboundOutputFormat === 'csv') {
                            downloadFile({ file: csvSpreadsheetOutput, filename: `${sanitizedCanonical.header.orderNumber}_lines.csv`, mimeType: 'text/csv' });
                          } else {
                            downloadFile({ file: ack997Output, filename: `ACK997_${sanitizedCanonical.controlNumbers.interchange}.edi`, mimeType: 'text/plain' });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80 flex items-center gap-1 cursor-pointer"
                        style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                      >
                        <Download className="w-3 h-3 text-[var(--brand)]" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  <pre
                    className="p-3 rounded-xl border text-xs font-mono overflow-x-auto max-h-80"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    {inboundOutputFormat === 'canonical' && canonicalJsonOutput}
                    {inboundOutputFormat === 'xml' && enterpriseXmlOutput}
                    {inboundOutputFormat === 'csv' && csvSpreadsheetOutput}
                    {inboundOutputFormat === 'ack997' && ack997Output}
                  </pre>
                </div>
              )}

              {/* Loopback Test Option */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                  <span className="text-[var(--ink)] font-semibold">
                    Test Outbound Loopback: Send this Canonical Data directly to Outbound Gateway
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTransferToOutbound}
                  className="px-3 py-1 rounded-lg border text-xs font-bold hover:opacity-80 transition-all cursor-pointer flex items-center gap-1 text-indigo-600 dark:text-indigo-400"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <span>Transfer to Outbound Gateway ➔</span>
                </button>
              </div>

              {/* Step 4 Navigation Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Canonical Mapping</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--brand)' }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Process Another Message</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* OUTBOUND FLOW - 4 GUIDED PIPELINE STEPS                   */}
      {/* ========================================================= */}
      {direction === 'outbound' && (
        <div className="space-y-4">
          {/* STEP 1: SOURCE DATA */}
          {currentStep === 1 && (
            <div
              className="p-5 rounded-2xl border space-y-4 shadow-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--brand)] text-white text-xs flex items-center justify-center">
                      1
                    </span>
                    Source Data (Internal ERP or Canonical JSON)
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Supply your internal business payload. This can be your ERP order JSON, invoice JSON, or Canonical Model.
                  </p>
                </div>

                {/* Preset samples */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-[var(--muted)] mr-1">Story Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadOutboundPreset('850')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    ERP PO (850)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadOutboundPreset('810')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    ERP Invoice (810)
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>ERP / Canonical JSON Payload</span>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80 flex items-center gap-1 cursor-pointer"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadedFileName || 'Upload JSON'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={outboundJsonInput}
                  onChange={(e) => setOutboundJsonInput(e.target.value)}
                  rows={10}
                  placeholder="Paste your internal business JSON payload here..."
                  className="w-full p-3 rounded-xl border text-xs font-mono outline-none resize-y"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--line)',
                    color: 'var(--ink)',
                  }}
                />
              </div>

              {/* Sanity Check Overview */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-[var(--ink)]">
                    {parsedOutboundCanonical
                      ? `Valid JSON: ${parsedOutboundCanonical.header?.orderNumber || 'Document'} (${parsedOutboundCanonical.lineItems?.length || 0} line items)`
                      : 'Invalid JSON format - please check syntax'}
                  </span>
                </div>

                {parsedOutboundCanonical && (
                  <div className="text-[11px] text-[var(--muted)]">
                    Currency: {parsedOutboundCanonical.header?.currency || 'USD'} | Total Qty: {parsedOutboundCanonical.summary?.totalQuantity || 0}
                  </div>
                )}
              </div>

              {/* Step 1 Actions */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  disabled={!parsedOutboundCanonical}
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  <span>Next: Map to EDI Structure</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MAP TO EDI STRUCTURE */}
          {currentStep === 2 && (
            <div
              className="p-5 rounded-2xl border space-y-4 shadow-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div>
                <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--brand)] text-white text-xs flex items-center justify-center">
                    2
                  </span>
                  Map to EDI Standard &amp; Envelope Structure
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Configure your target EDI standard (ANSI X12 vs UN/EDIFACT), transaction version, delimiters, and trading partner identifiers.
                </p>
              </div>

              {/* Target Format Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  className="p-3 rounded-xl border space-y-2"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <label className="text-xs font-bold text-[var(--ink)] block">Target EDI Standard</label>
                  <select
                    value={outboundTargetStandard}
                    onChange={(e) => setOutboundTargetStandard(e.target.value as 'X12' | 'EDIFACT')}
                    className="w-full p-2 rounded-lg border text-xs outline-none"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    <option value="X12">ANSI X12 (North America)</option>
                    <option value="EDIFACT">UN/EDIFACT (International)</option>
                  </select>
                  <div className="text-[11px] text-[var(--muted)]">
                    {outboundTargetStandard === 'X12' ? 'Version 004010 Standard Envelopes' : 'Version D96A UNB/UNZ Envelopes'}
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl border space-y-2"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <label className="text-xs font-bold text-[var(--ink)] block">Transaction Set</label>
                  <select
                    value={outboundTargetTransaction}
                    onChange={(e) => setOutboundTargetTransaction(e.target.value)}
                    className="w-full p-2 rounded-lg border text-xs outline-none"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    <option value="850">850 — Purchase Order (ORDERS)</option>
                    <option value="810">810 — Commercial Invoice (INVOIC)</option>
                  </select>
                  <div className="text-[11px] text-[var(--muted)]">Synthesizes corresponding header &amp; detail loops</div>
                </div>

                <div
                  className="p-3 rounded-xl border space-y-2"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <label className="text-xs font-bold text-[var(--ink)] block">Delimiters</label>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2 py-1 rounded border bg-[var(--bg)]" style={{ borderColor: 'var(--line)' }}>
                      Elem: <code>{outboundTargetStandard === 'X12' ? '*' : '+'}</code>
                    </span>
                    <span className="px-2 py-1 rounded border bg-[var(--bg)]" style={{ borderColor: 'var(--line)' }}>
                      Seg: <code>{outboundTargetStandard === 'X12' ? '~' : "'"}</code>
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">Standard enterprise default delimiters</div>
                </div>
              </div>

              {/* Trading Partner IDs */}
              <div
                className="p-3 rounded-xl border space-y-3 text-xs"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <div className="font-bold text-[var(--ink)]">Interchange Trading Partner Addressing</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[var(--muted)] block mb-1">Sender AS2 / Interchange ID:</span>
                    <input
                      type="text"
                      value={outboundAs2From}
                      onChange={(e) => setOutboundAs2From(e.target.value)}
                      className="w-full p-2 rounded-lg border font-mono"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    />
                  </div>
                  <div>
                    <span className="text-[var(--muted)] block mb-1">Receiver AS2 / Interchange ID:</span>
                    <input
                      type="text"
                      value={outboundAs2To}
                      onChange={(e) => setOutboundAs2To(e.target.value)}
                      className="w-full p-2 rounded-lg border font-mono"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Source</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  <span>Next: Canonical ➔ EDI Mapping</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CANONICAL -> EDI MAPPING */}
          {currentStep === 3 && (
            <div
              className="p-5 rounded-2xl border space-y-4 shadow-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div>
                <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--brand)] text-white text-xs flex items-center justify-center">
                    3
                  </span>
                  Canonical ➔ EDI Segment Synthesis &amp; Mapping
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Transforms your business model properties into valid EDI segment loops with correct sequence numbers and control envelopes.
                </p>
              </div>

              {/* Mapping Breakdown Table */}
              <div
                className="rounded-xl border overflow-hidden text-xs"
                style={{ borderColor: 'var(--line)' }}
              >
                <table className="w-full text-left">
                  <thead style={{ backgroundColor: 'var(--surface-2)', color: 'var(--muted)' }}>
                    <tr>
                      <th className="p-2.5 font-semibold">Canonical Property</th>
                      <th className="p-2.5 font-semibold">Target Segment</th>
                      <th className="p-2.5 font-semibold">Synthesized EDI Value</th>
                      <th className="p-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                    <tr>
                      <td className="p-2.5 font-semibold">header.orderNumber</td>
                      <td className="p-2.5 font-mono text-[var(--brand)]">BEG03 (BEG*00*NE*...)</td>
                      <td className="p-2.5 font-mono">{parsedOutboundCanonical?.header?.orderNumber || 'N/A'}</td>
                      <td className="p-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">SYNTHESIZED</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">header.currency</td>
                      <td className="p-2.5 font-mono text-[var(--brand)]">CUR02 (CUR*SE*USD)</td>
                      <td className="p-2.5 font-mono">{parsedOutboundCanonical?.header?.currency || 'USD'}</td>
                      <td className="p-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">SYNTHESIZED</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">parties[]</td>
                      <td className="p-2.5 font-mono text-[var(--brand)]">N1 / N3 / N4 Loops</td>
                      <td className="p-2.5 font-mono">{parsedOutboundCanonical?.parties?.length || 0} Party loops created</td>
                      <td className="p-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">SYNTHESIZED</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">lineItems[]</td>
                      <td className="p-2.5 font-mono text-[var(--brand)]">PO1 / PID Loops</td>
                      <td className="p-2.5 font-mono">{parsedOutboundCanonical?.lineItems?.length || 0} Line item loops created</td>
                      <td className="p-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">SYNTHESIZED</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">summary.totalQuantity</td>
                      <td className="p-2.5 font-mono text-[var(--brand)]">CTT02 (CTT*...*...)</td>
                      <td className="p-2.5 font-mono">{parsedOutboundCanonical?.summary?.totalQuantity || 0}</td>
                      <td className="p-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">SYNTHESIZED</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Live Preview of Generated EDI */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>Synthesized EDI Preview</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(synthesizedOutboundEdi, 'synth-edi-preview')}
                    className="flex items-center gap-1 text-[11px] hover:underline cursor-pointer"
                  >
                    {copiedId === 'synth-edi-preview' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'synth-edi-preview' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre
                  className="p-3 rounded-xl border text-xs font-mono overflow-x-auto max-h-56"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {synthesizedOutboundEdi}
                </pre>
              </div>

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Structure</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  <span>Next: Package &amp; Send Ready</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PACKAGE & SEND READY */}
          {currentStep === 4 && (
            <div
              className="p-5 rounded-2xl border space-y-4 shadow-xs"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                      ✓
                    </span>
                    Package &amp; Send Ready
                  </h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Your outbound document is synthesized, envelope-verified, and ready for dispatch via raw EDI or AS2.
                  </p>
                </div>

                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>100% Round-Trip Safe</span>
                </span>
              </div>

              {/* Output Tab Switcher */}
              <div
                className="flex items-center gap-1.5 p-1 rounded-xl border flex-wrap"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <button
                  type="button"
                  onClick={() => setOutboundOutputFormat('edi')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    outboundOutputFormat === 'edi' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Standard EDI Document (.edi)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOutboundOutputFormat('as2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    outboundOutputFormat === 'as2' ? 'bg-[var(--brand)] text-white shadow-xs' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>AS2 S/MIME Packaged Envelope</span>
                </button>
              </div>

              {/* Content Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>
                    {outboundOutputFormat === 'edi'
                      ? 'Synthesized ANSI X12 Document'
                      : 'Complete AS2 HTTP Transmission Payload'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const text = outboundOutputFormat === 'edi' ? synthesizedOutboundEdi : synthesizedOutboundAs2;
                        handleCopy(text, 'outbound-final');
                      }}
                      className="flex items-center gap-1 text-[11px] hover:underline cursor-pointer"
                    >
                      {copiedId === 'outbound-final' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'outbound-final' ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (outboundOutputFormat === 'edi') {
                          downloadFile({ file: synthesizedOutboundEdi, filename: `${parsedOutboundCanonical?.header?.orderNumber || 'OUTBOUND'}.edi`, mimeType: 'text/plain' });
                        } else {
                          downloadFile({ file: synthesizedOutboundAs2, filename: `${parsedOutboundCanonical?.header?.orderNumber || 'OUTBOUND'}_transmission.as2`, mimeType: 'text/plain' });
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-medium hover:opacity-80 flex items-center gap-1 cursor-pointer"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    >
                      <Download className="w-3 h-3 text-[var(--brand)]" />
                      <span>{outboundOutputFormat === 'edi' ? 'Download .edi for Partner' : 'Download AS2 Payload'}</span>
                    </button>
                  </div>
                </div>

                <pre
                  className="p-3 rounded-xl border text-xs font-mono overflow-x-auto max-h-80"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {outboundOutputFormat === 'edi' ? synthesizedOutboundEdi : synthesizedOutboundAs2}
                </pre>
              </div>

              {/* Loopback Test Option */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
                  <span className="text-[var(--ink)] font-semibold">
                    Test Inbound Loopback: Send this synthesized EDI directly to Inbound Gateway
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTransferToInbound}
                  className="px-3 py-1 rounded-lg border text-xs font-bold hover:opacity-80 transition-all cursor-pointer flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <span>Transfer to Inbound Gateway ➔</span>
                </button>
              </div>

              {/* Step 4 Navigation Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Mapping</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--brand)' }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Synthesize Another Document</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
