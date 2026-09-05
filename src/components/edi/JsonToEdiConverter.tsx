import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, ArrowLeftRight, Sparkles, FileCode2, AlertTriangle, Upload, Trash2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface JsonToEdiConverterProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const SAMPLE_850_PO_JSON = `{
  "interchange": {
    "sender": "BUYER_RETAIL",
    "senderQualifier": "ZZ",
    "receiver": "ACME_SUPPLIER",
    "receiverQualifier": "ZZ",
    "controlNumber": "000000850"
  },
  "group": {
    "functionalCode": "PO",
    "controlNumber": "85001",
    "version": "004010"
  },
  "transaction": {
    "set": "850",
    "controlNumber": "0001",
    "poNumber": "PO-2026-9901",
    "poDate": "20260904",
    "currency": "USD"
  },
  "parties": [
    {
      "type": "ST",
      "name": "CENTRAL DISTRIBUTION #12",
      "idQualifier": "92",
      "idCode": "DC12",
      "address": "1500 LOGISTICS PKWY",
      "city": "DALLAS",
      "state": "TX",
      "zip": "75261"
    },
    {
      "type": "BT",
      "name": "RETAIL CORP ACCOUNTS",
      "idQualifier": "91",
      "idCode": "CORP01",
      "address": "100 HEADQUARTERS BLVD",
      "city": "BENTONVILLE",
      "state": "AR",
      "zip": "72712"
    }
  ],
  "items": [
    {
      "line": 1,
      "quantity": 100,
      "uom": "CA",
      "unitPrice": 32.50,
      "vendorPart": "SKU-A101",
      "upc": "012345678901",
      "description": "PREMIUM COTTON CREW SHIRT 12PK"
    },
    {
      "line": 2,
      "quantity": 50,
      "uom": "CA",
      "unitPrice": 45.00,
      "vendorPart": "SKU-B202",
      "upc": "012345678918",
      "description": "HEAVYWEIGHT FLEECE HOODIE 6PK"
    }
  ]
}`;

const SAMPLE_860_CHANGE_JSON = `{
  "interchange": {
    "sender": "BUYER_RETAIL",
    "receiver": "ACME_SUPPLIER",
    "controlNumber": "000000860"
  },
  "group": {
    "functionalCode": "PC",
    "controlNumber": "86001",
    "version": "004010"
  },
  "transaction": {
    "set": "860",
    "controlNumber": "0001",
    "poNumber": "PO-2026-9901",
    "changeOrderSequence": "01",
    "changeDate": "20260904",
    "currency": "USD"
  },
  "parties": [
    {
      "type": "ST",
      "name": "CENTRAL DISTRIBUTION #12",
      "idQualifier": "92",
      "idCode": "DC12"
    }
  ],
  "items": [
    {
      "line": 1,
      "changeTypeCode": "CA",
      "quantity": 120,
      "originalQuantity": 100,
      "uom": "CA",
      "unitPrice": 32.50,
      "vendorPart": "SKU-A101",
      "description": "REVISED QUANTITY REQUEST (+20 CASES)"
    },
    {
      "line": 2,
      "changeTypeCode": "DI",
      "quantity": 0,
      "originalQuantity": 50,
      "uom": "CA",
      "unitPrice": 45.00,
      "vendorPart": "SKU-B202",
      "description": "LINE ITEM CANCELLATION REQUEST"
    }
  ]
}`;

const SAMPLE_856_ASN_JSON = `{
  "interchange": {
    "sender": "ACME_SUPPLIER",
    "receiver": "BUYER_RETAIL",
    "controlNumber": "000000856"
  },
  "group": {
    "functionalCode": "SH",
    "controlNumber": "85601",
    "version": "004010"
  },
  "transaction": {
    "set": "856",
    "controlNumber": "0001",
    "shipmentId": "ASN-2026-1102",
    "shipDate": "20260904",
    "bolNumber": "BOL-98841",
    "carrierCode": "FDEG",
    "carrierName": "FEDEX FREIGHT"
  },
  "parties": [
    {
      "type": "SF",
      "name": "ACME LOGISTICS DOCK",
      "address": "12 INDUSTRIAL WAY",
      "city": "CHICAGO",
      "state": "IL",
      "zip": "60601"
    },
    {
      "type": "ST",
      "name": "CENTRAL DISTRIBUTION #12",
      "address": "1500 LOGISTICS PKWY",
      "city": "DALLAS",
      "state": "TX",
      "zip": "75261"
    }
  ],
  "orders": [
    {
      "poNumber": "PO-2026-9901",
      "items": [
        {
          "line": 1,
          "vendorPart": "SKU-A101",
          "upc": "012345678901",
          "quantityShipped": 120,
          "uom": "CA",
          "packSscc": "00100123450000000018",
          "description": "PREMIUM COTTON CREW SHIRT 12PK"
        }
      ]
    }
  ]
}`;

const SAMPLE_810_INVOICE_JSON = `{
  "interchange": {
    "sender": "ACME_SUPPLIER",
    "receiver": "BUYER_RETAIL",
    "controlNumber": "000000810"
  },
  "group": {
    "functionalCode": "IN",
    "controlNumber": "81001",
    "version": "004010"
  },
  "transaction": {
    "set": "810",
    "controlNumber": "0001",
    "invoiceNumber": "INV-2026-4401",
    "invoiceDate": "20260904",
    "poNumber": "PO-2026-9901",
    "currency": "USD"
  },
  "parties": [
    {
      "type": "RE",
      "name": "ACME REMITTANCE CENTER",
      "address": "PO BOX 7700",
      "city": "DALLAS",
      "state": "TX",
      "zip": "75201"
    },
    {
      "type": "BT",
      "name": "BUYER CORPORATE ACCOUNTS",
      "address": "100 HEADQUARTERS BLVD",
      "city": "BENTONVILLE",
      "state": "AR",
      "zip": "72712"
    }
  ],
  "items": [
    {
      "line": 1,
      "quantity": 120,
      "uom": "CA",
      "unitPrice": 32.50,
      "vendorPart": "SKU-A101",
      "upc": "012345678901",
      "description": "PREMIUM COTTON CREW SHIRT 12PK"
    }
  ]
}`;

const SAMPLE_SEGMENTS_JSON = `{
  "format": "ANSI_X12",
  "delimiters": { "element": "*", "segment": "~", "subElement": ">" },
  "segments": [
    { "tag": "BEG", "elements": ["00", "NE", "PO-987654", "", "20260903"] },
    { "tag": "CUR", "elements": ["BY", "USD"] },
    { "tag": "REF", "elements": ["DP", "014"] },
    { "tag": "N1", "elements": ["ST", "EAST DISTRIBUTION CENTER", "92", "104"] },
    { "tag": "N3", "elements": ["450 INDUSTRIAL PARKWAY"] },
    { "tag": "N4", "elements": ["NEW YORK", "NY", "10001", "US"] },
    { "tag": "PO1", "elements": ["1", "50", "EA", "18.50", "", "VN", "PROD-A101"] },
    { "tag": "PID", "elements": ["F", "", "", "", "PREMIUM COTTON T-SHIRT L"] },
    { "tag": "CTT", "elements": ["1", "50"] }
  ]
}`;

export const JsonToEdiConverter: React.FC<JsonToEdiConverterProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [jsonInput, setJsonInput] = useState<string>(initialInput || SAMPLE_850_PO_JSON);
  const [ediOutput, setEdiOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Delimiters
  const [elemSep, setElemSep] = useState<string>('*');
  const [segTerm, setSegTerm] = useState<string>('~');
  const [subSep, setSubSep] = useState<string>('>');
  const [multiLine, setMultiLine] = useState<boolean>(true);

  // Convert JSON to EDI
  useEffect(() => {
    if (!jsonInput.trim()) {
      setEdiOutput('');
      setJsonError(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setJsonError(null);

      const segments: string[] = [];
      const now = new Date();
      const yy = String(now.getFullYear()).slice(2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const yymmdd = `${yy}${mm}${dd}`;
      const ccyymmdd = `${now.getFullYear()}${mm}${dd}`;
      const hhmm = `${hh}${min}`;

      const sender = parsed.interchange?.sender || 'BUYER_RETAIL';
      const receiver = parsed.interchange?.receiver || 'ACME_SUPPLIER';
      const sQual = parsed.interchange?.senderQualifier || 'ZZ';
      const rQual = parsed.interchange?.receiverQualifier || 'ZZ';
      const ctrl = String(parsed.interchange?.controlNumber || '000000001');
      const setCode = parsed.transaction?.set || '850';
      const grpCode = parsed.group?.functionalCode || (setCode === '850' ? 'PO' : setCode === '860' ? 'PC' : setCode === '856' ? 'SH' : setCode === '810' ? 'IN' : 'PO');
      const grpCtrl = String(parsed.group?.controlNumber || '1');
      const tranCtrl = String(parsed.transaction?.controlNumber || '0001');

      // Case A: Raw Segment array format
      if (Array.isArray(parsed.segments)) {
        segments.push(
          `ISA*00*          *00*          *${sQual}*${sender.padEnd(15, ' ')}*${rQual}*${receiver.padEnd(15, ' ')}*${yymmdd}*${hhmm}*U*00401*${ctrl.padStart(9, '0')}*0*P*${subSep}`
        );
        segments.push(`GS*${grpCode}*${sender}*${receiver}*${ccyymmdd}*${hhmm}*${grpCtrl}*X*004010`);
        segments.push(`ST*${setCode}*${tranCtrl}`);

        parsed.segments.forEach((s: any) => {
          if (s.tag && Array.isArray(s.elements)) {
            segments.push([s.tag, ...s.elements].join('*'));
          }
        });

        const seCount = segments.length - 2 + 1; // inclusive ST to SE
        segments.push(`SE*${seCount}*${tranCtrl}`);
        segments.push(`GE*1*${grpCtrl}`);
        segments.push(`IEA*1*${ctrl.padStart(9, '0')}`);
      } else if (setCode === '860') {
        // Case B1: 860 Purchase Order Change Request
        const poNumber = parsed.transaction?.poNumber || 'PO-2026-9901';
        const changeDate = parsed.transaction?.changeDate || ccyymmdd;
        const changeSeq = parsed.transaction?.changeOrderSequence || '01';
        const cur = parsed.transaction?.currency || 'USD';

        segments.push(`ISA*00*          *00*          *${sQual}*${sender.padEnd(15, ' ')}*${rQual}*${receiver.padEnd(15, ' ')}*${yymmdd}*${hhmm}*U*00401*${ctrl.padStart(9, '0')}*0*P*${subSep}`);
        segments.push(`GS*PC*${sender}*${receiver}*${ccyymmdd}*${hhmm}*${grpCtrl}*X*004010`);
        segments.push(`ST*860*${tranCtrl}`);
        segments.push(`BCH*04*NE*${poNumber}**${changeDate}*${changeSeq}*${changeDate}`);
        segments.push(`CUR*BY*${cur}`);

        if (Array.isArray(parsed.parties)) {
          parsed.parties.forEach((p: any) => {
            segments.push(`N1*${p.type || 'ST'}*${p.name || ''}*${p.idQualifier || '92'}*${p.idCode || ''}`);
            if (p.address) segments.push(`N3*${p.address}`);
            if (p.city || p.state || p.zip) {
              segments.push(`N4*${p.city || ''}*${p.state || ''}*${p.zip || ''}*US`);
            }
          });
        }

        let totalQty = 0;
        if (Array.isArray(parsed.items)) {
          parsed.items.forEach((item: any, idx: number) => {
            const line = item.line || idx + 1;
            const changeType = item.changeTypeCode || 'CA';
            const qty = Number(item.quantity || 0);
            const origQty = Number(item.originalQuantity || qty);
            totalQty += qty;
            const uom = item.uom || 'CA';
            const price = Number(item.unitPrice || 0).toFixed(2);
            segments.push(`POC*${line}*${changeType}*${qty}*${origQty}*${uom}*${price}**VN*${item.vendorPart || ''}*UP*${item.upc || ''}`);
            if (item.description) {
              segments.push(`PID*F****${item.description}`);
            }
          });
          segments.push(`CTT*${parsed.items.length}*${totalQty}`);
        }

        const bodySegCount = segments.length - 2 + 1;
        segments.push(`SE*${bodySegCount}*${tranCtrl}`);
        segments.push(`GE*1*${grpCtrl}`);
        segments.push(`IEA*1*${ctrl.padStart(9, '0')}`);
      } else if (setCode === '856') {
        // Case B2: 856 Advance Shipping Notice (ASN)
        const shipId = parsed.transaction?.shipmentId || 'ASN-2026-1102';
        const shipDate = parsed.transaction?.shipDate || ccyymmdd;
        const bol = parsed.transaction?.bolNumber || 'BOL-98841';
        const carrierCode = parsed.transaction?.carrierCode || 'FDEG';
        const carrierName = parsed.transaction?.carrierName || 'FEDEX FREIGHT';

        segments.push(`ISA*00*          *00*          *${sQual}*${sender.padEnd(15, ' ')}*${rQual}*${receiver.padEnd(15, ' ')}*${yymmdd}*${hhmm}*U*00401*${ctrl.padStart(9, '0')}*0*P*${subSep}`);
        segments.push(`GS*SH*${sender}*${receiver}*${ccyymmdd}*${hhmm}*${grpCtrl}*X*004010`);
        segments.push(`ST*856*${tranCtrl}`);
        segments.push(`BSN*00*${shipId}*${shipDate}*${hhmm}*0001`);
        segments.push(`DTM*011*${shipDate}`);

        // HL 1: Shipment
        segments.push(`HL*1**S`);
        segments.push(`TD1*CTN25*${parsed.orders?.length || 1}`);
        segments.push(`TD5*B*2*${carrierCode}*M*${carrierName}`);
        segments.push(`REF*BM*${bol}`);

        if (Array.isArray(parsed.parties)) {
          parsed.parties.forEach((p: any) => {
            segments.push(`N1*${p.type || 'ST'}*${p.name || ''}*${p.idQualifier || '91'}*${p.idCode || ''}`);
            if (p.address) segments.push(`N3*${p.address}`);
            if (p.city || p.state || p.zip) {
              segments.push(`N4*${p.city || ''}*${p.state || ''}*${p.zip || ''}*US`);
            }
          });
        }

        let hlCount = 1;
        if (Array.isArray(parsed.orders)) {
          parsed.orders.forEach((ord: any) => {
            hlCount++;
            const orderHl = hlCount;
            segments.push(`HL*${orderHl}*1*O`);
            segments.push(`PRF*${ord.poNumber || 'PO-2026-9901'}***${shipDate}`);

            if (Array.isArray(ord.items)) {
              ord.items.forEach((item: any, iIdx: number) => {
                hlCount++;
                const packHl = hlCount;
                segments.push(`HL*${packHl}*${orderHl}*P`);
                if (item.packSscc) {
                  segments.push(`MAN*GM*${item.packSscc}`);
                }
                hlCount++;
                const itemHl = hlCount;
                segments.push(`HL*${itemHl}*${packHl}*I`);
                segments.push(`LIN*${iIdx + 1}*VN*${item.vendorPart || ''}*UP*${item.upc || ''}`);
                segments.push(`SN1*${iIdx + 1}*${item.quantityShipped || 1}*${item.uom || 'CA'}`);
                if (item.description) {
                  segments.push(`PID*F****${item.description}`);
                }
              });
            }
          });
        }

        segments.push(`CTT*${hlCount}`);
        const bodySegCount = segments.length - 2 + 1;
        segments.push(`SE*${bodySegCount}*${tranCtrl}`);
        segments.push(`GE*1*${grpCtrl}`);
        segments.push(`IEA*1*${ctrl.padStart(9, '0')}`);
      } else if (setCode === '810') {
        // Case B3: 810 Commercial Invoice
        const invNumber = parsed.transaction?.invoiceNumber || 'INV-2026-4401';
        const invDate = parsed.transaction?.invoiceDate || ccyymmdd;
        const poNumber = parsed.transaction?.poNumber || 'PO-2026-9901';
        const cur = parsed.transaction?.currency || 'USD';

        segments.push(`ISA*00*          *00*          *${sQual}*${sender.padEnd(15, ' ')}*${rQual}*${receiver.padEnd(15, ' ')}*${yymmdd}*${hhmm}*U*00401*${ctrl.padStart(9, '0')}*0*P*${subSep}`);
        segments.push(`GS*IN*${sender}*${receiver}*${ccyymmdd}*${hhmm}*${grpCtrl}*X*004010`);
        segments.push(`ST*810*${tranCtrl}`);
        segments.push(`BIG*${invDate}*${invNumber}*${invDate}*${poNumber}`);
        segments.push(`CUR*SE*${cur}`);

        if (Array.isArray(parsed.parties)) {
          parsed.parties.forEach((p: any) => {
            segments.push(`N1*${p.type || 'RE'}*${p.name || ''}*${p.idQualifier || '91'}*${p.idCode || ''}`);
            if (p.address) segments.push(`N3*${p.address}`);
            if (p.city || p.state || p.zip) {
              segments.push(`N4*${p.city || ''}*${p.state || ''}*${p.zip || ''}*US`);
            }
          });
        }
        segments.push(`ITD*01*3*2**10*${invDate}*30`);

        let totalCents = 0;
        if (Array.isArray(parsed.items)) {
          parsed.items.forEach((item: any, idx: number) => {
            const line = item.line || idx + 1;
            const qty = Number(item.quantity || 1);
            const uom = item.uom || 'CA';
            const price = Number(item.unitPrice || 0);
            totalCents += Math.round(qty * price * 100);
            segments.push(`IT1*${line}*${qty}*${uom}*${price.toFixed(2)}**VN*${item.vendorPart || ''}*UP*${item.upc || ''}`);
            if (item.description) {
              segments.push(`PID*F****${item.description}`);
            }
          });
        }
        segments.push(`TDS*${totalCents}`);
        segments.push(`CTT*${parsed.items?.length || 1}`);

        const bodySegCount = segments.length - 2 + 1;
        segments.push(`SE*${bodySegCount}*${tranCtrl}`);
        segments.push(`GE*1*${grpCtrl}`);
        segments.push(`IEA*1*${ctrl.padStart(9, '0')}`);
      } else {
        // Case B4: Default 850 Purchase Order
        const poNumber = parsed.transaction?.poNumber || 'PO-2026-9901';
        const poDate = parsed.transaction?.poDate || ccyymmdd;
        const cur = parsed.transaction?.currency || 'USD';

        segments.push(
          `ISA*00*          *00*          *${sQual}*${sender.padEnd(15, ' ')}*${rQual}*${receiver.padEnd(15, ' ')}*${yymmdd}*${hhmm}*U*00401*${ctrl.padStart(9, '0')}*0*P*${subSep}`
        );
        segments.push(`GS*PO*${sender}*${receiver}*${ccyymmdd}*${hhmm}*${grpCtrl}*X*004010`);
        segments.push(`ST*850*${tranCtrl}`);
        segments.push(`BEG*00*NE*${poNumber}**${poDate}`);
        segments.push(`CUR*BY*${cur}`);

        if (Array.isArray(parsed.parties)) {
          parsed.parties.forEach((p: any) => {
            segments.push(`N1*${p.type || 'ST'}*${p.name || ''}*${p.idQualifier || '92'}*${p.idCode || ''}`);
            if (p.address) segments.push(`N3*${p.address}`);
            if (p.city || p.state || p.zip) {
              segments.push(`N4*${p.city || ''}*${p.state || ''}*${p.zip || ''}*US`);
            }
          });
        }

        let totalQuantity = 0;
        if (Array.isArray(parsed.items)) {
          parsed.items.forEach((item: any, idx: number) => {
            const line = item.line || idx + 1;
            const qty = item.quantity || 1;
            totalQuantity += Number(qty);
            const uom = item.uom || 'EA';
            const price = Number(item.unitPrice || 0).toFixed(2);
            segments.push(`PO1*${line}*${qty}*${uom}*${price}**VN*${item.vendorPart || ''}*UP*${item.upc || ''}`);
            if (item.description) {
              segments.push(`PID*F****${item.description}`);
            }
          });
          segments.push(`CTT*${parsed.items.length}*${totalQuantity}`);
        }

        const bodySegCount = segments.length - 2 + 1;
        segments.push(`SE*${bodySegCount}*${tranCtrl}`);
        segments.push(`GE*1*${grpCtrl}`);
        segments.push(`IEA*1*${ctrl.padStart(9, '0')}`);
      }

      // Format output with delimiters
      const formattedLines = segments.map((s) => s.replace(/\*/g, elemSep));
      if (multiLine) {
        setEdiOutput(formattedLines.map((l) => `${l}${segTerm}`).join('\n'));
      } else {
        setEdiOutput(formattedLines.map((l) => `${l}${segTerm}`).join(''));
      }
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
      setEdiOutput('');
    }
  }, [jsonInput, elemSep, segTerm, subSep, multiLine]);

  const handleCopy = () => {
    navigator.clipboard.writeText(ediOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([ediOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_edi_transaction.x12';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonInput], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edi_source_document.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          setJsonInput(evt.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Control Bar */}
      <div
        className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[var(--muted)]">Templates:</span>
          <button
            onClick={() => setJsonInput(SAMPLE_850_PO_JSON)}
            className="px-2.5 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            850 PO
          </button>
          <button
            onClick={() => setJsonInput(SAMPLE_860_CHANGE_JSON)}
            className="px-2.5 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity cursor-pointer font-semibold text-[var(--brand)]"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--brand)', color: 'var(--brand)' }}
          >
            860 PO Change
          </button>
          <button
            onClick={() => setJsonInput(SAMPLE_856_ASN_JSON)}
            className="px-2.5 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity cursor-pointer font-semibold"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            856 ASN (Shipment)
          </button>
          <button
            onClick={() => setJsonInput(SAMPLE_810_INVOICE_JSON)}
            className="px-2.5 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            810 Invoice
          </button>
          <button
            onClick={() => setJsonInput(SAMPLE_SEGMENTS_JSON)}
            className="px-2.5 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            Raw Segments
          </button>
          <button
            onClick={() => setJsonInput('')}
            disabled={!jsonInput}
            className="px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-40 cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--muted)' }}
            title="Clear JSON Input"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Clear</span>
          </button>

          <div className="h-4 w-px bg-[var(--line)] mx-1" />

          {/* Delimiters */}
          <span className="font-semibold text-[var(--muted)]">Delimiters:</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span title="Element Separator" className="text-[11px] text-[var(--muted)]">Elem:</span>
            <input
              type="text"
              maxLength={1}
              value={elemSep}
              onChange={(e) => setElemSep(e.target.value || '*')}
              className="w-7 h-7 text-center rounded border outline-none font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <span title="Segment Terminator" className="text-[11px] text-[var(--muted)] ml-1">Term:</span>
            <input
              type="text"
              maxLength={1}
              value={segTerm}
              onChange={(e) => setSegTerm(e.target.value || '~')}
              className="w-7 h-7 text-center rounded border outline-none font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <label className="flex items-center gap-1.5 ml-2 cursor-pointer select-none text-[var(--muted)] hover:text-[var(--ink)]">
            <input
              type="checkbox"
              checked={multiLine}
              onChange={(e) => setMultiLine(e.target.checked)}
              className="rounded"
            />
            <span>Wrap Lines</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!ediOutput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
            style={{ backgroundColor: copied ? 'var(--ok)' : 'var(--brand)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy EDI'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!ediOutput}
            className="p-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            title="Download .edi file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JSON Input Panel */}
        <div
          className="p-4 rounded-2xl border flex flex-col space-y-3"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
              <FileCode2 className="w-4 h-4 text-[var(--brand)]" />
              Source JSON Document (Semantic Object or Segments Array)
            </span>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer hover:opacity-80 flex items-center gap-1 text-[var(--muted)]">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload JSON</span>
                <input type="file" accept=".json,.txt" onChange={handleJsonUpload} className="hidden" />
              </label>
              <button
                onClick={handleDownloadJson}
                disabled={!jsonInput}
                className="hover:opacity-80 text-[var(--muted)] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                title="Save/Download JSON document"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={() => setJsonInput('')}
                disabled={!jsonInput}
                className="hover:opacity-80 text-rose-500 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                title="Clear JSON input"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={20}
            className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border leading-relaxed"
            style={{ backgroundColor: 'var(--bg)', borderColor: jsonError ? 'var(--error)' : 'var(--line)', color: 'var(--ink)' }}
            placeholder="Paste structured JSON payload or click one of the templates above..."
          />

          {jsonError && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}
        </div>

        {/* Generated EDI X12 Output Panel */}
        <div
          className="p-4 rounded-2xl border flex flex-col space-y-3"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Generated ANSI X12 Output
            </span>
            <span className="text-[var(--muted)] font-mono">
              {ediOutput ? ediOutput.split('\n').filter(Boolean).length : 0} Segments
            </span>
          </div>

          <textarea
            readOnly
            value={ediOutput}
            rows={20}
            placeholder="Generated ANSI X12 segments will appear here automatically..."
            className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/20"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>
    </div>
  );
};
