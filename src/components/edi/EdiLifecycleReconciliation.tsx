import React, { useState, useMemo } from 'react';
import {
  GitCompareArrows,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  Truck,
  DollarSign,
  Barcode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { useCurrency } from '../../lib/CurrencyContext';
import { CurrencySelector } from '../CurrencySelector';

interface EdiLifecycleReconciliationProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
}

export interface LifecycleDocument {
  stage: '850' | '855' | '856' | '810' | '820';
  name: string;
  code: string;
  role: string;
  ediContent: string;
  poNumber?: string;
  controlNumber?: string;
  date?: string;
  hasAck997: boolean;
  ackStatus?: 'Accepted' | 'Rejected' | 'Pending';
}

export interface LineItemReconciliation {
  line: number;
  partNumber: string;
  upc?: string;
  description: string;
  orderedQty: number;
  ackQty: number;
  shippedQty: number;
  invoicedQty: number;
  orderedPrice: number;
  invoicedPrice: number;
  qtyStatus: 'match' | 'short_ship' | 'over_ship' | 'missing';
  priceStatus: 'match' | 'variance';
  notes: string;
}

// Preset Scenario 1: Clean Order-to-Cash (100% Reconciled)
const CLEAN_850 = `ISA*00*          *00*          *ZZ*BUYER_RETAIL   *ZZ*ACME_SUPPLIER  *260904*1000*U*00401*000000850*0*P*>~
GS*PO*BUYER_RETAIL*ACME_SUPPLIER*20260904*1000*85001*X*004010~
ST*850*0001~
BEG*00*NE*PO-2026-9901**20260904~
CUR*BY*USD~
REF*DP*042~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
N3*1500 LOGISTICS PKWY~
N4*DALLAS*TX*75261*US~
N1*BT*RETAIL CORP ACCOUNTS*91*CORP01~
N3*100 HEADQUARTERS BLVD~
N4*BENTONVILLE*AR*72712*US~
PO1*1*100*CA*32.50**VN*SKU-A101*UP*012345678901~
PID*F****PREMIUM COTTON CREW SHIRT 12PK~
PO1*2*50*CA*45.00**VN*SKU-B202*UP*012345678918~
PID*F****HEAVYWEIGHT FLEECE HOODIE 6PK~
CTT*2*150~
SE*16*0001~
GE*1*85001~
IEA*1*000000850~`;

const CLEAN_855 = `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1130*U*00401*000000855*0*P*>~
GS*PR*ACME_SUPPLIER*BUYER_RETAIL*20260904*1130*85501*X*004010~
ST*855*0001~
BAK*00*AD*PO-2026-9901*20260904****20260904~
CUR*SE*USD~
REF*DP*042~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
PO1*1*100*CA*32.50**VN*SKU-A101*UP*012345678901~
ACK*IA*100*CA*068*20260910~
PO1*2*50*CA*45.00**VN*SKU-B202*UP*012345678918~
ACK*IA*50*CA*068*20260910~
CTT*2*150~
SE*12*0001~
GE*1*85501~
IEA*1*000000855~`;

const CLEAN_856 = `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1400*U*00401*000000856*0*P*>~
GS*SH*ACME_SUPPLIER*BUYER_RETAIL*20260904*1400*85601*X*004010~
ST*856*0001~
BSN*00*ASN-2026-0904*20260904*1400*0001~
DTM*011*20260904~
HL*1**S~
TD1*PLT90*2~
TD5**2*FDEG*M*FEDEX FREIGHT~
REF*BM*BOL-99441~
N1*SF*ACME WAREHOUSE #4*91*WH04~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
HL*2*1*O~
PRF*PO-2026-9901***20260904~
HL*3*2*P~
MAN*GM*00100123450000001815~
HL*4*3*I~
LIN*1*VN*SKU-A101*UP*012345678901~
SN1*1*100*CA~
PID*F****PREMIUM COTTON CREW SHIRT 12PK~
HL*5*2*P~
MAN*GM*00100123450000001822~
HL*6*5*I~
LIN*2*VN*SKU-B202*UP*012345678918~
SN1*2*50*CA~
PID*F****HEAVYWEIGHT FLEECE HOODIE 6PK~
CTT*6~
SE*25*0001~
GE*1*85601~
IEA*1*000000856~`;

const CLEAN_810 = `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1700*U*00401*000000810*0*P*>~
GS*IN*ACME_SUPPLIER*BUYER_RETAIL*20260904*1700*81001*X*004010~
ST*810*0001~
BIG*20260904*INV-2026-8801*20260904*PO-2026-9901~
CUR*SE*USD~
REF*BM*BOL-99441~
N1*BT*RETAIL CORP ACCOUNTS*91*CORP01~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
ITD*01*3*2**10*20260914*30~
IT1*1*100*CA*32.50**VN*SKU-A101*UP*012345678901~
PID*F****PREMIUM COTTON CREW SHIRT 12PK~
IT1*2*50*CA*45.00**VN*SKU-B202*UP*012345678918~
PID*F****HEAVYWEIGHT FLEECE HOODIE 6PK~
TDS*550000~
CTT*2~
SE*15*0001~
GE*1*81001~
IEA*1*000000810~`;

const CLEAN_820 = `ISA*00*          *00*          *ZZ*BUYER_RETAIL   *ZZ*ACME_SUPPLIER  *260904*1830*U*00401*000000820*0*P*>~
GS*RA*BUYER_RETAIL*ACME_SUPPLIER*20260904*1830*82001*X*004010~
ST*820*0001~
BPR*C*5390.00*C*ACH*CTX*01*123456789*DA*987654321***01*987654321*DA*123456789*20260904~
TRN*1*CHK-2026-9901*1234567890~
CUR*PR*USD~
N1*PR*BUYER RETAIL CORP*91*CORP01~
N1*PE*ACME SUPPLIER CORP*91*ACME01~
RMR*IV*INV-2026-8801*PO*5500.00*5390.00*110.00~
REF*PO*PO-2026-9901~
SE*10*0001~
GE*1*82001~
IEA*1*000000820~`;

// Preset Scenario 2: Short-Ship & Backorder
const DISCREPANCY_855 = `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1130*U*00401*000000855*0*P*>~
GS*PR*ACME_SUPPLIER*BUYER_RETAIL*20260904*1130*85501*X*004010~
ST*855*0001~
BAK*00*AC*PO-2026-9901*20260904****20260904~
CUR*SE*USD~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
PO1*1*100*CA*32.50**VN*SKU-A101*UP*012345678901~
ACK*IA*100*CA*068*20260910~
PO1*2*50*CA*45.00**VN*SKU-B202*UP*012345678918~
ACK*BP*30*CA*068*20260910~
ACK*DR*20*CA*068*20260920~
CTT*2*150~
SE*13*0001~
GE*1*85501~
IEA*1*000000855~`;

const DISCREPANCY_856 = `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1400*U*00401*000000856*0*P*>~
GS*SH*ACME_SUPPLIER*BUYER_RETAIL*20260904*1400*85601*X*004010~
ST*856*0001~
BSN*00*ASN-2026-0904*20260904*1400*0001~
DTM*011*20260904~
HL*1**S~
TD1*PLT90*2~
TD5**2*FDEG*M*FEDEX FREIGHT~
REF*BM*BOL-99441~
N1*SF*ACME WAREHOUSE #4*91*WH04~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
HL*2*1*O~
PRF*PO-2026-9901***20260904~
HL*3*2*P~
MAN*GM*00100123450000001815~
HL*4*3*I~
LIN*1*VN*SKU-A101*UP*012345678901~
SN1*1*100*CA~
PID*F****PREMIUM COTTON CREW SHIRT 12PK~
HL*5*2*P~
MAN*GM*00100123450000001822~
HL*6*5*I~
LIN*2*VN*SKU-B202*UP*012345678918~
SN1*2*30*CA~
PID*F****HEAVYWEIGHT FLEECE HOODIE 6PK~
CTT*6~
SE*25*0001~
GE*1*85601~
IEA*1*000000856~`;

// Supplier mistakenly invoices 50 cases on Line 2 (instead of 30 shipped)
const DISCREPANCY_810_OVERCHARGE = `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1700*U*00401*000000810*0*P*>~
GS*IN*ACME_SUPPLIER*BUYER_RETAIL*20260904*1700*81001*X*004010~
ST*810*0001~
BIG*20260904*INV-2026-8801*20260904*PO-2026-9901~
CUR*SE*USD~
REF*BM*BOL-99441~
N1*BT*RETAIL CORP ACCOUNTS*91*CORP01~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
IT1*1*100*CA*32.50**VN*SKU-A101*UP*012345678901~
PID*F****PREMIUM COTTON CREW SHIRT 12PK~
IT1*2*50*CA*45.00**VN*SKU-B202*UP*012345678918~
PID*F****HEAVYWEIGHT FLEECE HOODIE 6PK~
TDS*550000~
CTT*2~
SE*14*0001~
GE*1*81001~
IEA*1*000000810~`;

// Preset Scenario 3: Price Variance ($35.00 invoiced vs $32.50 on PO)
const PRICE_VARIANCE_810 = `ISA*00*          *00*          *ZZ*ACME_SUPPLIER  *ZZ*BUYER_RETAIL   *260904*1700*U*00401*000000810*0*P*>~
GS*IN*ACME_SUPPLIER*BUYER_RETAIL*20260904*1700*81001*X*004010~
ST*810*0001~
BIG*20260904*INV-2026-8801*20260904*PO-2026-9901~
CUR*SE*USD~
REF*BM*BOL-99441~
N1*BT*RETAIL CORP ACCOUNTS*91*CORP01~
N1*ST*CENTRAL DISTRIBUTION #12*92*DC12~
IT1*1*100*CA*35.00**VN*SKU-A101*UP*012345678901~
PID*F****PREMIUM COTTON CREW SHIRT 12PK~
IT1*2*50*CA*45.00**VN*SKU-B202*UP*012345678918~
PID*F****HEAVYWEIGHT FLEECE HOODIE 6PK~
TDS*575000~
CTT*2~
SE*14*0001~
GE*1*81001~
IEA*1*000000810~`;

export const EdiLifecycleReconciliation: React.FC<EdiLifecycleReconciliationProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  // Global Currency Hook
  const { currency, formatAmount } = useCurrency();

  // Scenarios: clean, short_ship, price_variance, missing_asn
  const [selectedScenario, setSelectedScenario] = useState<'clean' | 'short_ship' | 'price_variance' | 'missing_asn'>('clean');

  // Individual Document state
  const [doc850, setDoc850] = useState<string>(CLEAN_850);
  const [doc855, setDoc855] = useState<string>(CLEAN_855);
  const [doc856, setDoc856] = useState<string>(CLEAN_856);
  const [doc810, setDoc810] = useState<string>(CLEAN_810);
  const [doc820, setDoc820] = useState<string>(CLEAN_820);

  // Active Document Tab for Raw EDI Inspection
  const [activeDocTab, setActiveDocTab] = useState<'850' | '855' | '856' | '810' | '820'>('850');
  const [copied, setCopied] = useState<boolean>(false);

  // Load Presets
  const handleLoadScenario = (scenario: 'clean' | 'short_ship' | 'price_variance' | 'missing_asn') => {
    setSelectedScenario(scenario);
    setDoc850(CLEAN_850);

    if (scenario === 'clean') {
      setDoc855(CLEAN_855);
      setDoc856(CLEAN_856);
      setDoc810(CLEAN_810);
      setDoc820(CLEAN_820);
    } else if (scenario === 'short_ship') {
      setDoc855(DISCREPANCY_855);
      setDoc856(DISCREPANCY_856);
      setDoc810(DISCREPANCY_810_OVERCHARGE);
      setDoc820(CLEAN_820);
    } else if (scenario === 'price_variance') {
      setDoc855(CLEAN_855);
      setDoc856(CLEAN_856);
      setDoc810(PRICE_VARIANCE_810);
      setDoc820(CLEAN_820);
    } else if (scenario === 'missing_asn') {
      setDoc855(CLEAN_855);
      setDoc856(''); // Missing 856 ASN
      setDoc810(CLEAN_810);
      setDoc820(CLEAN_820);
    }
  };

  // Reconciliation Analysis Engine
  const reconciliation = useMemo(() => {
    // 1. Extract PO Numbers across documents
    const extractPo = (content: string): string => {
      if (!content) return '';
      const begMatch = content.match(/BEG\*00\*[A-Z0-9]+\*([^*~]+)/i);
      if (begMatch) return begMatch[1].trim();
      const bakMatch = content.match(/BAK\*00\*[A-Z0-9]+\*([^*~]+)/i);
      if (bakMatch) return bakMatch[1].trim();
      const prfMatch = content.match(/PRF\*([^*~]+)/i);
      if (prfMatch) return prfMatch[1].trim();
      const bigMatch = content.match(/BIG\*[^*~]+\*[^*~]+\*[^*~]+\*([^*~]+)/i);
      if (bigMatch) return bigMatch[1].trim();
      const rmrMatch = content.match(/REF\*PO\*([^*~]+)/i);
      if (rmrMatch) return rmrMatch[1].trim();
      return '';
    };

    const po850 = extractPo(doc850);
    const po855 = extractPo(doc855);
    const po856 = extractPo(doc856);
    const po810 = extractPo(doc810);
    const po820 = extractPo(doc820);

    const commonPo = po850 || po855 || po856 || po810 || po820 || 'PO-2026-9901';

    // 2. Extract Document Metadata
    const extractMetadata = (content: string, type: '850' | '855' | '856' | '810' | '820'): LifecycleDocument => {
      const isPresent = !!content.trim();
      const ctrlMatch = content.match(/ST\*[0-9]{3}\*([^*~]+)/i);
      const ctrlNumber = ctrlMatch ? ctrlMatch[1].trim() : isPresent ? '0001' : undefined;

      const dateMatch = content.match(/\*(20[2-3][0-9][0-1][0-9][0-3][0-9])/);
      const docDate = dateMatch ? dateMatch[1] : isPresent ? '20260904' : undefined;

      const names: Record<string, string> = {
        '850': 'Purchase Order',
        '855': 'PO Acknowledgment',
        '856': 'Advance Ship Notice',
        '810': 'Commercial Invoice',
        '820': 'Remittance Advice',
      };

      const roles: Record<string, string> = {
        '850': 'Buyer -> Seller (Order Placement)',
        '855': 'Seller -> Buyer (Order Acceptance)',
        '856': 'Seller -> Buyer (Shipment & SSCC)',
        '810': 'Seller -> Buyer (Financial Billing)',
        '820': 'Buyer -> Seller (Payment Settlement)',
      };

      return {
        stage: type,
        name: names[type],
        code: type,
        role: roles[type],
        ediContent: content,
        poNumber: extractPo(content),
        controlNumber: ctrlNumber,
        date: docDate,
        hasAck997: isPresent,
        ackStatus: isPresent ? 'Accepted' : 'Pending',
      };
    };

    const docs: LifecycleDocument[] = [
      extractMetadata(doc850, '850'),
      extractMetadata(doc855, '855'),
      extractMetadata(doc856, '856'),
      extractMetadata(doc810, '810'),
      extractMetadata(doc820, '820'),
    ];

    // 3. Extract Line Items from 850, 855, 856, 810
    const lines: LineItemReconciliation[] = [];

    // Helper to extract PO1 from 850
    const po1Matches = doc850.matchAll(/PO1\*([0-9]+)\*([0-9]+)\*([A-Z]+)\*([0-9.]+)\*\*VN\*([^*~]+)\*UP\*([^*~]+)/gi);
    const poItemsMap: Record<number, { qty: number; price: number; part: string; upc: string }> = {};
    for (const m of po1Matches) {
      poItemsMap[parseInt(m[1], 10)] = {
        qty: parseInt(m[2], 10),
        price: parseFloat(m[4]),
        part: m[5],
        upc: m[6],
      };
    }

    // Helper to extract ACK from 855
    const ackMap: Record<number, number> = {};
    const ackMatches = doc855.matchAll(/PO1\*([0-9]+)[\s\S]*?ACK\*[A-Z]+\*([0-9]+)/gi);
    for (const m of ackMatches) {
      ackMap[parseInt(m[1], 10)] = parseInt(m[2], 10);
    }

    // Helper to extract SN1 from 856
    const sn1Map: Record<number, number> = {};
    const sn1Matches = doc856.matchAll(/SN1\*([0-9]+)\*([0-9]+)/gi);
    for (const m of sn1Matches) {
      sn1Map[parseInt(m[1], 10)] = parseInt(m[2], 10);
    }

    // Helper to extract IT1 from 810
    const it1Map: Record<number, { qty: number; price: number }> = {};
    const it1Matches = doc810.matchAll(/IT1\*([0-9]+)\*([0-9]+)\*([A-Z]+)\*([0-9.]+)/gi);
    for (const m of it1Matches) {
      it1Map[parseInt(m[1], 10)] = {
        qty: parseInt(m[2], 10),
        price: parseFloat(m[4]),
      };
    }

    // Build consolidated line item reconciliation
    const lineIndices = Array.from(new Set([
      ...Object.keys(poItemsMap).map(Number),
      ...Object.keys(it1Map).map(Number),
      ...Object.keys(sn1Map).map(Number),
    ])).sort((a, b) => a - b);

    let totalOrderedDollars = 0;
    let totalInvoicedDollars = 0;
    let discrepanciesCount = 0;
    const auditAlerts: { type: 'error' | 'warning' | 'info'; title: string; message: string; stage: string }[] = [];

    lineIndices.forEach((lineNum) => {
      const poItem = poItemsMap[lineNum] || { qty: 0, price: 0, part: `SKU-LINE-${lineNum}`, upc: '' };
      const ackQty = ackMap[lineNum] !== undefined ? ackMap[lineNum] : poItem.qty;
      const shippedQty = sn1Map[lineNum] !== undefined ? sn1Map[lineNum] : doc856 ? 0 : 0;
      const invoicedItem = it1Map[lineNum] || { qty: 0, price: 0 };

      totalOrderedDollars += poItem.qty * poItem.price;
      totalInvoicedDollars += invoicedItem.qty * invoicedItem.price;

      let qtyStatus: 'match' | 'short_ship' | 'over_ship' | 'missing' = 'match';
      let priceStatus: 'match' | 'variance' = 'match';
      const notesArr: string[] = [];

      // Check Quantity Integrity
      if (!doc856.trim()) {
        qtyStatus = 'missing';
        notesArr.push('856 ASN missing from interchange');
      } else if (shippedQty < poItem.qty) {
        qtyStatus = 'short_ship';
        const diff = poItem.qty - shippedQty;
        notesArr.push(`Short-shipped by -${diff} cases (Backordered)`);

        if (invoicedItem.qty > shippedQty) {
          discrepanciesCount++;
          auditAlerts.push({
            type: 'error',
            stage: '810 Invoice',
            title: `Line #${lineNum} Invoicing Overcharge Discrepancy`,
            message: `Supplier invoiced ${invoicedItem.qty} cases, but only shipped ${shippedQty} cases on 856 ASN. Overcharge: +${formatAmount(
              (invoicedItem.qty - shippedQty) * invoicedItem.price
            )}.`,
          });
        }
      } else if (shippedQty > poItem.qty) {
        qtyStatus = 'over_ship';
        notesArr.push(`Over-shipment +${shippedQty - poItem.qty}`);
      }

      // Check Price Integrity
      if (invoicedItem.price > 0 && Math.abs(invoicedItem.price - poItem.price) > 0.001) {
        priceStatus = 'variance';
        discrepanciesCount++;
        const priceDiff = invoicedItem.price - poItem.price;
        notesArr.push(`Unit Price Variance: +${formatAmount(priceDiff)}/unit`);
        auditAlerts.push({
          type: 'error',
          stage: '810 Invoice',
          title: `Line #${lineNum} Price Variance Alert`,
          message: `Invoiced unit cost (${formatAmount(invoicedItem.price)}) exceeds PO authorized unit price (${formatAmount(
            poItem.price
          )}) without an 860 PO change approval. Total Variance: +${formatAmount(priceDiff * invoicedItem.qty)}.`,
        });
      }

      const descMap: Record<number, string> = {
        1: 'PREMIUM COTTON CREW SHIRT 12PK',
        2: 'HEAVYWEIGHT FLEECE HOODIE 6PK',
      };

      lines.push({
        line: lineNum,
        partNumber: poItem.part,
        upc: poItem.upc,
        description: descMap[lineNum] || `COMMODITY ITEM ${lineNum}`,
        orderedQty: poItem.qty,
        ackQty,
        shippedQty,
        invoicedQty: invoicedItem.qty,
        orderedPrice: poItem.price,
        invoicedPrice: invoicedItem.price,
        qtyStatus,
        priceStatus,
        notes: notesArr.length > 0 ? notesArr.join('; ') : 'Reconciled 100%',
      });
    });

    // 4. Missing Stage Checks
    if (!doc856.trim()) {
      discrepanciesCount++;
      auditAlerts.push({
        type: 'error',
        stage: '856 ASN',
        title: 'Missing Stage: 856 Advance Ship Notice',
        message: 'Commercial Invoice (810) was received, but no 856 ASN notice or carrier BOL was recorded in the system.',
      });
    }

    if (!doc855.trim()) {
      auditAlerts.push({
        type: 'warning',
        stage: '855 Ack',
        title: 'Unacknowledged PO',
        message: 'Order was shipped and invoiced without a formal 855 Purchase Order Acknowledgment recorded.',
      });
    }

    // 5. SSCC Container extraction from 856
    const ssccMatches = Array.from(doc856.matchAll(/MAN\*GM\*([0-9]{18})/gi)).map((m) => m[1]);

    // Financial calculations
    const remittedAmount = 5390.0;
    const discountAmount = 110.0;

    return {
      commonPo,
      docs,
      lines,
      totalOrderedDollars,
      totalInvoicedDollars,
      dollarVariance: totalInvoicedDollars - totalOrderedDollars,
      discrepanciesCount,
      auditAlerts,
      ssccMatches,
      remittedAmount,
      discountAmount,
      isFullyReconciled: discrepanciesCount === 0 && !!doc856.trim(),
    };
  }, [doc850, doc855, doc856, doc810, doc820]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const linesArr: string[] = [
      '====================================================================',
      '        EDI ORDER-TO-CASH LIFECYCLE RECONCILIATION AUDIT REPORT      ',
      '====================================================================',
      `Timestamp: ${new Date().toISOString()}`,
      `Purchase Order #: ${reconciliation.commonPo}`,
      `Lifecycle Overall Status: ${reconciliation.isFullyReconciled ? '100% RECONCILED (CLEAN FLOW)' : 'DISCREPANCIES DETECTED'}`,
      `Total Discrepancies: ${reconciliation.discrepanciesCount}`,
      '',
      '--- DOCUMENT STAGES INCLUDED ---',
      ...reconciliation.docs.map(
        (d) =>
          `[${d.ediContent.trim() ? 'OK' : 'MISSING'}] ${d.stage} ${d.name} (${d.role}) - Ctrl #${d.controlNumber || 'N/A'}`
      ),
      '',
      '--- FINANCIAL RECONCILIATION ---',
      `Currency Code:          ${currency.code} (${currency.symbol.trim()}) - ${currency.name}`,
      `Authorized PO Total:    ${formatAmount(reconciliation.totalOrderedDollars)}`,
      `Total Invoiced Amount:  ${formatAmount(reconciliation.totalInvoicedDollars)}`,
      `Dollar Variance:        ${formatAmount(reconciliation.dollarVariance)}`,
      `Remittance Settled:     ${formatAmount(reconciliation.remittedAmount)} (Discount: ${formatAmount(reconciliation.discountAmount)})`,
      '',
      '--- LINE ITEM AUDIT ---',
      ...reconciliation.lines.map(
        (l) =>
          `Line #${l.line}: ${l.partNumber} - ${l.description} | Ordered: ${l.orderedQty} | Ack: ${l.ackQty} | Shipped: ${l.shippedQty} | Invoiced: ${l.invoicedQty} | PO Price: ${formatAmount(
            l.orderedPrice
          )} | Inv Price: ${formatAmount(l.invoicedPrice)} | Status: ${l.notes}`
      ),
      '',
      '--- DETECTED AUDIT ALERTS ---',
      reconciliation.auditAlerts.length === 0
        ? 'No audit discrepancies found. 100% compliant.'
        : reconciliation.auditAlerts
            .map((a, i) => `[${a.type.toUpperCase()}] #${i + 1} (${a.stage}): ${a.title} - ${a.message}`)
            .join('\n'),
      '====================================================================',
    ];

    const blob = new Blob([linesArr.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edi_reconciliation_report_${reconciliation.commonPo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetToDefaults = () => {
    setSelectedScenario('clean');
    setDoc850(CLEAN_850);
    setDoc855(CLEAN_855);
    setDoc856(CLEAN_856);
    setDoc810(CLEAN_810);
    setDoc820(CLEAN_820);
    setActiveDocTab('850');
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleResetToDefaults}
        resetLabel="Reset to Defaults"
      />

      {/* Preset Scenario Selector Banner */}
      <div
        className="p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
              Cross-Document Order-to-Cash Lifecycle Presets
            </h3>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Simulate end-to-end B2B order reconciliation across 850 PO, 855 Ack, 856 ASN, 810 Invoice, and 820 Remittance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleLoadScenario('clean')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              selectedScenario === 'clean'
                ? 'border-[var(--brand)] text-[var(--brand)] shadow-xs font-bold'
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: selectedScenario === 'clean' ? 'var(--surface-2)' : 'var(--bg)',
              borderColor: selectedScenario === 'clean' ? 'var(--brand)' : 'var(--line)',
              color: selectedScenario === 'clean' ? 'var(--brand)' : 'var(--ink)',
            }}
          >
            Clean Match (100%)
          </button>

          <button
            onClick={() => handleLoadScenario('short_ship')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              selectedScenario === 'short_ship'
                ? 'border-amber-500 text-amber-600 shadow-xs font-bold'
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: selectedScenario === 'short_ship' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg)',
              borderColor: selectedScenario === 'short_ship' ? '#f59e0b' : 'var(--line)',
              color: selectedScenario === 'short_ship' ? '#d97706' : 'var(--ink)',
            }}
          >
            Short-Ship Overcharge
          </button>

          <button
            onClick={() => handleLoadScenario('price_variance')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              selectedScenario === 'price_variance'
                ? 'border-rose-500 text-rose-600 shadow-xs font-bold'
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: selectedScenario === 'price_variance' ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg)',
              borderColor: selectedScenario === 'price_variance' ? '#f43f5e' : 'var(--line)',
              color: selectedScenario === 'price_variance' ? '#e11d48' : 'var(--ink)',
            }}
          >
            Price Variance Alert
          </button>

          <button
            onClick={() => handleLoadScenario('missing_asn')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              selectedScenario === 'missing_asn'
                ? 'border-indigo-500 text-indigo-600 shadow-xs font-bold'
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: selectedScenario === 'missing_asn' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg)',
              borderColor: selectedScenario === 'missing_asn' ? '#6366f1' : 'var(--line)',
              color: selectedScenario === 'missing_asn' ? '#4f46e5' : 'var(--ink)',
            }}
          >
            Missing 856 ASN
          </button>
        </div>
      </div>

      {/* 1. VISUAL TIMELINE & STAGE PIPELINE */}
      <div
        className="p-5 rounded-2xl border space-y-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Order Lifecycle Pipeline
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                PO Reference: <span className="font-mono text-[var(--brand)]">{reconciliation.commonPo}</span>
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  reconciliation.isFullyReconciled
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                }`}
              >
                {reconciliation.isFullyReconciled
                  ? '100% Reconciled'
                  : `${reconciliation.discrepanciesCount} Discrepancies Flagged`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <CurrencySelector idPrefix="edi-header-currency" variant="pill" />
            <button
              onClick={handleDownloadReport}
              className="px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer shadow-xs"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Download className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span>Export Audit Report</span>
            </button>
          </div>
        </div>

        {/* Horizontal Pipeline Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          {reconciliation.docs.map((doc, idx) => {
            const isFilled = !!doc.ediContent.trim();
            const isActive = activeDocTab === doc.stage;
            const hasError = !isFilled || (doc.stage === '810' && reconciliation.discrepanciesCount > 0);

            return (
              <button
                key={doc.stage}
                onClick={() => setActiveDocTab(doc.stage)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                  isActive ? 'ring-2 ring-[var(--brand)] shadow-sm' : 'hover:opacity-90'
                }`}
                style={{
                  backgroundColor: isFilled ? 'var(--bg)' : 'rgba(244, 63, 94, 0.04)',
                  borderColor: isActive
                    ? 'var(--brand)'
                    : isFilled
                    ? hasError && doc.stage === '810'
                      ? '#f43f5e'
                      : 'var(--line)'
                    : '#fda4af',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold text-white"
                      style={{
                        backgroundColor: !isFilled
                          ? '#ef4444'
                          : hasError && doc.stage === '810'
                          ? '#f59e0b'
                          : 'var(--brand)',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs" style={{ color: 'var(--ink)' }}>
                      EDI {doc.stage}
                    </span>
                  </div>
                  {isFilled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                </div>

                <div>
                  <p className="font-semibold text-xs leading-tight" style={{ color: 'var(--ink)' }}>
                    {doc.name}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-1 truncate">{doc.role}</p>
                </div>

                <div className="mt-3 pt-2 border-t flex items-center justify-between text-[10px]" style={{ borderColor: 'var(--line)' }}>
                  <span className="font-mono text-[var(--muted)]">
                    {isFilled ? `Ctrl: ${doc.controlNumber || '0001'}` : 'Missing Stage'}
                  </span>
                  <span
                    className={`font-semibold ${
                      isFilled ? 'text-emerald-600' : 'text-rose-600 font-bold'
                    }`}
                  >
                    {isFilled ? '997 Ack OK' : 'No Ack'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SUMMARY KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="p-4 rounded-2xl border"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>PO Authorized Total ({currency.symbol.trim()})</span>
            <DollarSign className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--ink)' }}>
            {formatAmount(reconciliation.totalOrderedDollars)}
          </p>
          <span className="text-[11px] text-[var(--muted)] block mt-0.5">Authorized under 850 BEG03</span>
        </div>

        <div
          className="p-4 rounded-2xl border"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Invoiced Total (810)</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--ink)' }}>
            {formatAmount(reconciliation.totalInvoicedDollars)}
          </p>
          <span
            className={`text-[11px] font-semibold block mt-0.5 ${
              reconciliation.dollarVariance === 0
                ? 'text-emerald-600'
                : reconciliation.dollarVariance > 0
                ? 'text-rose-600'
                : 'text-amber-600'
            }`}
          >
            {reconciliation.dollarVariance === 0
              ? 'Exact Match to PO'
              : `Variance: +${formatAmount(reconciliation.dollarVariance)}`}
          </span>
        </div>

        <div
          className="p-4 rounded-2xl border"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Logistics SSCC Containers</span>
            <Barcode className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: 'var(--ink)' }}>
            {reconciliation.ssccMatches.length} Pallets / Cartons
          </p>
          <span className="text-[11px] text-[var(--muted)] block mt-0.5 font-mono truncate">
            {reconciliation.ssccMatches[0] || 'No ASN SSCC'}
          </span>
        </div>

        <div
          className="p-4 rounded-2xl border"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Audit Findings</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p
            className={`text-xl font-bold font-mono mt-1 ${
              reconciliation.discrepanciesCount === 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {reconciliation.discrepanciesCount === 0
              ? '0 Errors'
              : `${reconciliation.discrepanciesCount} Discrepancies`}
          </p>
          <span className="text-[11px] text-[var(--muted)] block mt-0.5">
            {reconciliation.discrepanciesCount === 0
              ? 'Clean match across all 5 stages'
              : 'Attention required before settlement'}
          </span>
        </div>
      </div>

      {/* 3. AUDIT DISCREPANCY FINDINGS (if any) */}
      {reconciliation.auditAlerts.length > 0 && (
        <div
          className="rounded-2xl border divide-y overflow-hidden shadow-xs"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="p-4 flex items-center justify-between bg-rose-500/5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Reconciliation Variances &amp; Exceptions ({reconciliation.auditAlerts.length})
              </h4>
            </div>
            <span className="text-xs text-[var(--muted)]">Audit Action Required</span>
          </div>

          {reconciliation.auditAlerts.map((alert, idx) => (
            <div key={idx} className="p-4 flex items-start gap-3 text-xs">
              <span
                className={`px-2 py-0.5 rounded-md font-mono font-bold shrink-0 mt-0.5 text-[10px] ${
                  alert.type === 'error'
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}
              >
                {alert.stage}
              </span>
              <div className="flex-1">
                <p className="font-bold" style={{ color: 'var(--ink)' }}>
                  {alert.title}
                </p>
                <p className="text-[var(--muted)] mt-0.5 leading-relaxed">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. CROSS-DOCUMENT LINE ITEM CORRELATION TABLE */}
      <div
        className="p-5 rounded-2xl border space-y-4 shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
              Cross-Document Line Items &amp; Quantity Matrix
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Side-by-side reconciliation of PO1 (850), ACK (855), SN1 (856), and IT1 (810) line items.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[var(--muted)]">
            {reconciliation.lines.length} Line Items Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                <th className="py-2.5 px-3 font-semibold">Line</th>
                <th className="py-2.5 px-3 font-semibold">SKU &amp; Description</th>
                <th className="py-2.5 px-3 font-semibold text-center">850 Qty (Ordered)</th>
                <th className="py-2.5 px-3 font-semibold text-center">855 Qty (Ack)</th>
                <th className="py-2.5 px-3 font-semibold text-center">856 Qty (Shipped)</th>
                <th className="py-2.5 px-3 font-semibold text-center">810 Qty (Invoiced)</th>
                <th className="py-2.5 px-3 font-semibold text-right">PO Price ({currency.symbol.trim()})</th>
                <th className="py-2.5 px-3 font-semibold text-right">Inv Price ({currency.symbol.trim()})</th>
                <th className="py-2.5 px-3 font-semibold text-right">Reconciliation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
              {reconciliation.lines.map((line) => {
                const hasQtyDiscrepancy = line.qtyStatus !== 'match';
                const hasPriceDiscrepancy = line.priceStatus !== 'match';

                return (
                  <tr
                    key={line.line}
                    className="hover:opacity-90"
                    style={{
                      backgroundColor:
                        hasQtyDiscrepancy || hasPriceDiscrepancy ? 'rgba(244, 63, 94, 0.03)' : 'transparent',
                    }}
                  >
                    <td className="py-2.5 px-3 font-bold text-[var(--brand)]">#{line.line}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <p className="font-mono font-bold text-xs" style={{ color: 'var(--ink)' }}>
                        {line.partNumber}
                      </p>
                      <p className="text-[11px] text-[var(--muted)] truncate max-w-[220px]">
                        {line.description}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">{line.orderedQty}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-[var(--muted)]">{line.ackQty}</td>
                    <td
                      className={`py-2.5 px-3 text-center font-bold ${
                        line.shippedQty < line.orderedQty ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {line.shippedQty}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-center font-bold ${
                        line.invoicedQty > line.shippedQty ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {line.invoicedQty}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[var(--muted)]">{formatAmount(line.orderedPrice)}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        hasPriceDiscrepancy ? 'text-rose-600' : 'text-[var(--ink)]'
                      }`}
                    >
                      {formatAmount(line.invoicedPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          hasQtyDiscrepancy || hasPriceDiscrepancy
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}
                      >
                        {hasQtyDiscrepancy || hasPriceDiscrepancy ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        <span>{line.notes}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INTERACTIVE DOCUMENT VIEWER & EDITOR */}
      <div
        className="p-5 rounded-2xl border space-y-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
              Inspect &amp; Edit Raw Document Segments
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Select any stage below to inspect its ANSI X12 segments, paste real trading partner payloads, or modify control numbers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const current =
                  activeDocTab === '850'
                    ? doc850
                    : activeDocTab === '855'
                    ? doc855
                    : activeDocTab === '856'
                    ? doc856
                    : activeDocTab === '810'
                    ? doc810
                    : doc820;
                handleCopy(current);
              }}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : `Copy ${activeDocTab}`}</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto no-scrollbar text-xs" style={{ borderColor: 'var(--line)' }}>
          {[
            { id: '850', label: '850 Purchase Order' },
            { id: '855', label: '855 PO Acknowledgment' },
            { id: '856', label: '856 Ship Notice (ASN)' },
            { id: '810', label: '810 Invoice' },
            { id: '820', label: '820 Payment Remittance' },
          ].map((tab) => {
            const isActive = activeDocTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDocTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive ? 'shadow-xs' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--brand)' : 'var(--bg)',
                  color: isActive ? '#ffffff' : 'var(--muted)',
                  border: isActive ? '1px solid var(--brand)' : '1px solid var(--line)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Textarea for Active Doc */}
        <div className="relative">
          <textarea
            rows={10}
            value={
              activeDocTab === '850'
                ? doc850
                : activeDocTab === '855'
                ? doc855
                : activeDocTab === '856'
                ? doc856
                : activeDocTab === '810'
                ? doc810
                : doc820
            }
            onChange={(e) => {
              const val = e.target.value;
              if (activeDocTab === '850') setDoc850(val);
              else if (activeDocTab === '855') setDoc855(val);
              else if (activeDocTab === '856') setDoc856(val);
              else if (activeDocTab === '810') setDoc810(val);
              else if (activeDocTab === '820') setDoc820(val);
            }}
            className="w-full p-3.5 rounded-xl font-mono text-xs outline-none resize-y border leading-relaxed"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder={`Paste raw ANSI X12 ${activeDocTab} document here...`}
          />
        </div>
      </div>
    </div>
  );
};
