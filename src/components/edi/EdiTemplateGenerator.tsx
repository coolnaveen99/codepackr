import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, RefreshCw, FileText, Settings, SlidersHorizontal, Sparkles } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface EdiTemplateGeneratorProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

interface TemplateOption {
  id: string;
  name: string;
  standard: 'X12' | 'EDIFACT';
  code: string;
  description: string;
}

const TEMPLATES: TemplateOption[] = [
  { id: '850', name: '850 Purchase Order', standard: 'X12', code: '850', description: 'Retail and B2B ordering document with line items, prices, and ship-to addresses.' },
  { id: '810', name: '810 Commercial Invoice', standard: 'X12', code: '810', description: 'Billing document detailing goods delivered, payment terms, and total amounts.' },
  { id: '856', name: '856 Ship Notice / Manifest (ASN)', standard: 'X12', code: '856', description: 'Advance Shipping Notice with SOPI (Shipment-Order-Pack-Item) hierarchical packaging levels.' },
  { id: '846', name: '846 Inventory Inquiry / Advice', standard: 'X12', code: '846', description: 'Inventory stock availability, warehouse quantities, and SKU status.' },
  { id: '204', name: '204 Motor Carrier Load Tender', standard: 'X12', code: '204', description: 'Transportation tender offering freight pickup and delivery specifications to carriers.' },
  { id: '214', name: '214 Carrier Shipment Status', standard: 'X12', code: '214', description: 'Tracking checkpoints, pickup/delivery status events, and carrier coordinates.' },
  { id: '820', name: '820 Payment Order / Remittance', standard: 'X12', code: '820', description: 'Electronic payment advice referencing paid invoice numbers and settlement amounts.' },
  { id: '997', name: '997 Functional Acknowledgment', standard: 'X12', code: '997', description: 'Standard receipt confirmation acknowledging EDI envelope and transaction set syntax.' },
  { id: 'ORDERS', name: 'EDIFACT ORDERS', standard: 'EDIFACT', code: 'ORDERS', description: 'International purchase order message with UNB, UNH, BGM, and LIN structures.' },
  { id: 'INVOIC', name: 'EDIFACT INVOIC', standard: 'EDIFACT', code: 'INVOIC', description: 'International invoice message with UNB, UNH, BGM, and MOA currency segments.' },
  { id: 'DESADV', name: 'EDIFACT DESADV', standard: 'EDIFACT', code: 'DESADV', description: 'International despatch advice (shipping notice) detailing physical consignments.' },
];

export const EdiTemplateGenerator: React.FC<EdiTemplateGeneratorProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('850');
  const [senderId, setSenderId] = useState<string>('SENDERCO');
  const [receiverId, setReceiverId] = useState<string>('RECEIVERCO');
  const [senderQual, setSenderQual] = useState<string>('ZZ');
  const [receiverQual, setReceiverQual] = useState<string>('ZZ');
  const [docNumber, setDocNumber] = useState<string>('PO-2026-9876');
  const [itemCount, setItemCount] = useState<number>(2);
  const [elemSep, setElemSep] = useState<string>('*');
  const [segTerm, setSegTerm] = useState<string>('~');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate EDI Document based on parameters
  const generatedEdi = useMemo(() => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const yymmdd = `${yy}${mm}${dd}`;
    const ccyymmdd = `${now.getFullYear()}${mm}${dd}`;
    const hhmm = `${hh}${min}`;
    const ctrl = '000000001';

    const pSender = senderId.padEnd(15, ' ').slice(0, 15);
    const pReceiver = receiverId.padEnd(15, ' ').slice(0, 15);
    const pSQual = senderQual.padEnd(2, ' ').slice(0, 2);
    const pRQual = receiverQual.padEnd(2, ' ').slice(0, 2);

    const term = segTerm || '~';
    const sep = elemSep || '*';

    const lines: string[] = [];

    if (selectedTemplate === '850') {
      lines.push(`ISA*00*          *00*          *${pSQual}*${pSender}*${pRQual}*${pReceiver}*${yymmdd}*${hhmm}*U*00401*${ctrl}*0*P*>`);
      lines.push(`GS*PO*${senderId.trim()}*${receiverId.trim()}*${ccyymmdd}*${hhmm}*1*X*004010`);
      lines.push(`ST*850*0001`);
      lines.push(`BEG*00*NE*${docNumber}**${ccyymmdd}`);
      lines.push(`CUR*BY*USD`);
      lines.push(`REF*DP*014`);
      lines.push(`PER*BD*JANE DOE*TE*555-0199*EM*orders@${receiverId.toLowerCase().trim() || 'example'}.com`);
      lines.push(`N1*ST*EAST DISTRIBUTION CENTER*92*104`);
      lines.push(`N3*450 INDUSTRIAL PARKWAY`);
      lines.push(`N4*NEW YORK*NY*10001*US`);
      lines.push(`N1*BT*${receiverId.trim()} HQ*91*HQ01`);
      lines.push(`N3*100 WALL STREET 22ND FL`);
      lines.push(`N4*NEW YORK*NY*10005*US`);

      let totalQty = 0;
      for (let i = 1; i <= itemCount; i++) {
        const qty = i * 25;
        totalQty += qty;
        const price = (15.5 + i * 4.25).toFixed(2);
        lines.push(`PO1*${i}*${qty}*EA*${price}**VN*SKU-A${100 + i}*UP*01234567890${i}`);
        lines.push(`PID*F****INDUSTRIAL COMPONENT SPECIFICATION MODEL #${i}`);
      }
      lines.push(`CTT*${itemCount}*${totalQty}`);
      lines.push(`SE*${lines.length - 2 + 1}*0001`);
      lines.push(`GE*1*1`);
      lines.push(`IEA*1*${ctrl}`);
    } else if (selectedTemplate === '810') {
      lines.push(`ISA*00*          *00*          *${pSQual}*${pSender}*${pRQual}*${pReceiver}*${yymmdd}*${hhmm}*U*00401*${ctrl}*0*P*>`);
      lines.push(`GS*IN*${senderId.trim()}*${receiverId.trim()}*${ccyymmdd}*${hhmm}*1*X*004010`);
      lines.push(`ST*810*0001`);
      lines.push(`BIG*${ccyymmdd}*${docNumber}*${ccyymmdd}*PO-987654`);
      lines.push(`CUR*SE*USD`);
      lines.push(`N1*RE*${senderId.trim()} REMIT TO*91*REMIT1`);
      lines.push(`N3*PO BOX 500`);
      lines.push(`N4*DALLAS*TX*75201*US`);
      lines.push(`N1*BT*${receiverId.trim()} CORPORATE*92*BUY01`);
      lines.push(`N3*100 WALL STREET`);
      lines.push(`N4*NEW YORK*NY*10005*US`);
      lines.push(`ITD*01*3*2**10*${ccyymmdd}*30`);

      let totalCents = 0;
      for (let i = 1; i <= itemCount; i++) {
        const qty = i * 20;
        const price = 25.0;
        totalCents += qty * price * 100;
        lines.push(`IT1*${i}*${qty}*EA*${price.toFixed(2)}**VN*ITEM-X${200 + i}`);
        lines.push(`PID*F****COMMERCIAL GRADE DELIVERABLE PRODUCT #${i}`);
      }
      lines.push(`TDS*${totalCents}`);
      lines.push(`CTT*${itemCount}`);
      lines.push(`SE*${lines.length - 2 + 1}*0001`);
      lines.push(`GE*1*1`);
      lines.push(`IEA*1*${ctrl}`);
    } else if (selectedTemplate === '856') {
      // Advance Shipping Notice (ASN) SOPI
      lines.push(`ISA*00*          *00*          *${pSQual}*${pSender}*${pRQual}*${pReceiver}*${yymmdd}*${hhmm}*U*00401*${ctrl}*0*P*>`);
      lines.push(`GS*SH*${senderId.trim()}*${receiverId.trim()}*${ccyymmdd}*${hhmm}*1*X*004010`);
      lines.push(`ST*856*0001`);
      lines.push(`BSN*00*${docNumber}*${ccyymmdd}*${hhmm}*0001`);
      lines.push(`DTM*011*${ccyymmdd}`);
      // HL 1: Shipment
      lines.push(`HL*1**S`);
      lines.push(`TD1*CTN25*${itemCount}`);
      lines.push(`TD5*B*2*FDEG*M*FEDEX FREIGHT`);
      lines.push(`REF*BM*BOL-${docNumber}`);
      lines.push(`N1*SF*SHIPPERS FACILITY*91*FAC01`);
      lines.push(`N3*12 LOGISTICS WAY`);
      lines.push(`N4*CHICAGO*IL*60601*US`);
      lines.push(`N1*ST*RECEIVER DOCK*92*DC02`);
      lines.push(`N3*800 CARRIER BLVD`);
      lines.push(`N4*ATLANTA*GA*30301*US`);
      // HL 2: Order
      lines.push(`HL*2*1*O`);
      lines.push(`PRF*PO-987654***${ccyymmdd}`);
      // HL 3+: Items
      for (let i = 1; i <= itemCount; i++) {
        const hlIndex = 2 + i;
        lines.push(`HL*${hlIndex}*2*I`);
        lines.push(`LIN*${i}*VN*PROD-${i * 100}*UP*01234567890${i}`);
        lines.push(`SN1*${i}*${i * 10}*EA`);
        lines.push(`PID*F****LOGISTICS PACKAGED SHIPMENT UNITS #${i}`);
      }
      lines.push(`CTT*${2 + itemCount}`);
      lines.push(`SE*${lines.length - 2 + 1}*0001`);
      lines.push(`GE*1*1`);
      lines.push(`IEA*1*${ctrl}`);
    } else if (selectedTemplate === '204') {
      lines.push(`ISA*00*          *00*          *${pSQual}*${pSender}*${pRQual}*${pReceiver}*${yymmdd}*${hhmm}*U*00401*${ctrl}*0*P*>`);
      lines.push(`GS*SM*${senderId.trim()}*${receiverId.trim()}*${ccyymmdd}*${hhmm}*1*X*004010`);
      lines.push(`ST*204*0001`);
      lines.push(`B2**FDEG*${docNumber}**PP`);
      lines.push(`B2A*00`);
      lines.push(`MS3*FDEG*B`);
      lines.push(`N1*SH*CONSIGNOR WAREHOUSE*91*WH01`);
      lines.push(`N3*500 FREIGHT RD`);
      lines.push(`N4*MEMPHIS*TN*38101*US`);
      lines.push(`N1*CN*CONSIGNEE TERMINAL*92*CN02`);
      lines.push(`N3*99 DISTRIBUTION PARK`);
      lines.push(`N4*DALLAS*TX*75201*US`);
      lines.push(`S5*1*CL*45000*G*1500*E`);
      lines.push(`L11*BOL-9901*BM`);
      lines.push(`SE*${lines.length - 2 + 1}*0001`);
      lines.push(`GE*1*1`);
      lines.push(`IEA*1*${ctrl}`);
    } else if (selectedTemplate === '214') {
      lines.push(`ISA*00*          *00*          *${pSQual}*${pSender}*${pRQual}*${pReceiver}*${yymmdd}*${hhmm}*U*00401*${ctrl}*0*P*>`);
      lines.push(`GS*QM*${senderId.trim()}*${receiverId.trim()}*${ccyymmdd}*${hhmm}*1*X*004010`);
      lines.push(`ST*214*0001`);
      lines.push(`B10*BOL-${docNumber}*${docNumber}*FDEG`);
      lines.push(`LX*1`);
      lines.push(`AT7*X6*NS***${ccyymmdd}*${hhmm}*LT`);
      lines.push(`MS1*MEMPHIS*TN*US`);
      lines.push(`MS2*FDEG*1044`);
      lines.push(`SE*${lines.length - 2 + 1}*0001`);
      lines.push(`GE*1*1`);
      lines.push(`IEA*1*${ctrl}`);
    } else if (selectedTemplate === '846') {
      lines.push(`ISA*00*          *00*          *${pSQual}*${pSender}*${pRQual}*${pReceiver}*${yymmdd}*${hhmm}*U*00401*${ctrl}*0*P*>`);
      lines.push(`GS*IB*${senderId.trim()}*${receiverId.trim()}*${ccyymmdd}*${hhmm}*1*X*004010`);
      lines.push(`ST*846*0001`);
      lines.push(`BIA*00*MB*${docNumber}*${ccyymmdd}`);
      lines.push(`N1*WH*CENTRAL STOCK LOCATION*91*STK01`);
      for (let i = 1; i <= itemCount; i++) {
        lines.push(`LIN*${i}*VN*SKU-PART${i}*UP*0123456789${i}0`);
        lines.push(`QTY*33*${i * 500}*EA`);
      }
      lines.push(`CTT*${itemCount}`);
      lines.push(`SE*${lines.length - 2 + 1}*0001`);
      lines.push(`GE*1*1`);
      lines.push(`IEA*1*${ctrl}`);
    } else if (selectedTemplate === '820') {
      lines.push(`ISA*00*          *00*          *${pSQual}*${pSender}*${pRQual}*${pReceiver}*${yymmdd}*${hhmm}*U*00401*${ctrl}*0*P*>`);
      lines.push(`GS*RA*${senderId.trim()}*${receiverId.trim()}*${ccyymmdd}*${hhmm}*1*X*004010`);
      lines.push(`ST*820*0001`);
      lines.push(`BPR*C*12500.00*C*ACH*CTX*01*123456789*DA*987654321***01*987654321*DA*123456789*${ccyymmdd}`);
      lines.push(`TRN*1*CHK-${docNumber}*1234567890`);
      lines.push(`N1*PR*PAYER CORP*91*PAY01`);
      lines.push(`N1*PE*PAYEE VENDOR*91*VEN01`);
      lines.push(`RMR*IV*INV-2026-001*PO*12500.00`);
      lines.push(`SE*${lines.length - 2 + 1}*0001`);
      lines.push(`GE*1*1`);
      lines.push(`IEA*1*${ctrl}`);
    } else if (selectedTemplate === '997') {
      lines.push(`ISA*00*          *00*          *${pSQual}*${pSender}*${pRQual}*${pReceiver}*${yymmdd}*${hhmm}*U*00401*${ctrl}*0*P*>`);
      lines.push(`GS*FA*${senderId.trim()}*${receiverId.trim()}*${ccyymmdd}*${hhmm}*1*X*004010`);
      lines.push(`ST*997*0001`);
      lines.push(`AK1*PO*1`);
      lines.push(`AK2*850*0001`);
      lines.push(`AK5*A`);
      lines.push(`AK9*A*1*1*1`);
      lines.push(`SE*6*0001`);
      lines.push(`GE*1*1`);
      lines.push(`IEA*1*${ctrl}`);
    } else if (selectedTemplate === 'ORDERS') {
      // EDIFACT ORDERS
      lines.push(`UNB+UNOA:2+${senderId.trim()}:ZZZ+${receiverId.trim()}:ZZZ+${yymmdd}:${hhmm}+${ctrl}'`);
      lines.push(`UNH+1+ORDERS:D:96A:UN'`);
      lines.push(`BGM+220+${docNumber}+9'`);
      lines.push(`DTM+137:${ccyymmdd}:102'`);
      lines.push(`NAD+BY+${receiverId.trim()}::92'`);
      lines.push(`NAD+SU+${senderId.trim()}::91'`);
      for (let i = 1; i <= itemCount; i++) {
        lines.push(`LIN+${i}++PROD-${100 + i}:VN'`);
        lines.push(`QTY+21:${i * 20}:EA'`);
        lines.push(`PRI+AAA:${(20 + i * 5).toFixed(2)}'`);
      }
      lines.push(`UNS+S'`);
      lines.push(`CNT+2:${itemCount}'`);
      lines.push(`UNT*${7 + itemCount * 3}*1'`);
      lines.push(`UNZ+1+${ctrl}'`);
      return lines.join('\n');
    } else if (selectedTemplate === 'INVOIC') {
      // EDIFACT INVOIC
      lines.push(`UNB+UNOA:2+${senderId.trim()}:ZZZ+${receiverId.trim()}:ZZZ+${yymmdd}:${hhmm}+${ctrl}'`);
      lines.push(`UNH+1+INVOIC:D:96A:UN'`);
      lines.push(`BGM+380+${docNumber}+9'`);
      lines.push(`DTM+137:${ccyymmdd}:102'`);
      lines.push(`NAD+BY+${receiverId.trim()}::92'`);
      lines.push(`NAD+SU+${senderId.trim()}::91'`);
      for (let i = 1; i <= itemCount; i++) {
        lines.push(`LIN+${i}++ITEM-${200 + i}:VN'`);
        lines.push(`QTY+47:${i * 15}:EA'`);
        lines.push(`MOA+203:${(i * 15 * 30).toFixed(2)}'`);
      }
      lines.push(`UNT*${6 + itemCount * 3}*1'`);
      lines.push(`UNZ+1+${ctrl}'`);
      return lines.join('\n');
    } else if (selectedTemplate === 'DESADV') {
      // EDIFACT DESADV
      lines.push(`UNB+UNOA:2+${senderId.trim()}:ZZZ+${receiverId.trim()}:ZZZ+${yymmdd}:${hhmm}+${ctrl}'`);
      lines.push(`UNH+1+DESADV:D:96A:UN'`);
      lines.push(`BGM+351+${docNumber}+9'`);
      lines.push(`DTM+137:${ccyymmdd}:102'`);
      lines.push(`NAD+CN+${receiverId.trim()}::92'`);
      lines.push(`NAD+CZ+${senderId.trim()}::91'`);
      for (let i = 1; i <= itemCount; i++) {
        lines.push(`LIN+${i}++PART-${i * 50}:VN'`);
        lines.push(`QTY+12:${i * 10}:EA'`);
      }
      lines.push(`UNT*${6 + itemCount * 2}*1'`);
      lines.push(`UNZ+1+${ctrl}'`);
      return lines.join('\n');
    }

    // Apply delimiters for X12
    const replaced = lines.map((l) => l.replace(/\*/g, sep));
    return replaced.map((l) => `${l}${term}`).join('\n');
  }, [selectedTemplate, senderId, receiverId, senderQual, receiverQual, docNumber, itemCount, elemSep, segTerm]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEdi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedEdi], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate}_sample.edi`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Template Selectors Grid */}
      <div
        className="p-4 rounded-2xl border space-y-3"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between text-xs font-semibold">
          <span style={{ color: 'var(--ink)' }}>Select EDI Transaction Specification:</span>
          <span className="text-[var(--muted)]">{TEMPLATES.length} Standard Templates</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplate(tmpl.id);
                  if (tmpl.id === '850') setDocNumber('PO-2026-9876');
                  else if (tmpl.id === '810') setDocNumber('INV-2026-4401');
                  else if (tmpl.id === '856') setDocNumber('ASN-2026-1102');
                  else if (tmpl.id === '204') setDocNumber('LOAD-99441');
                  else if (tmpl.id === '214') setDocNumber('STAT-88192');
                  else if (tmpl.id === '846') setDocNumber('STK-2026-09');
                  else if (tmpl.id === '820') setDocNumber('PAY-55019');
                  else setDocNumber(`DOC-${tmpl.id}-1001`);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-[var(--brand)] shadow-sm' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--surface-2)' : 'var(--bg)',
                  borderColor: isSelected ? 'var(--brand)' : 'var(--line)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold" style={{ color: isSelected ? 'var(--brand)' : 'var(--ink)' }}>
                    {tmpl.code}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-[var(--line)] text-[var(--muted)]">
                    {tmpl.standard}
                  </span>
                </div>
                <div className="text-[11px] font-medium truncate" style={{ color: 'var(--ink)' }}>
                  {tmpl.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameter Customizer Bar */}
      <div
        className="p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase mb-1">
            Sender ID &amp; Qual
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={senderQual}
              onChange={(e) => setSenderQual(e.target.value.toUpperCase())}
              maxLength={2}
              className="w-10 p-2 rounded-lg border font-mono text-xs text-center uppercase font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value.toUpperCase())}
              maxLength={15}
              className="flex-1 p-2 rounded-lg border font-mono text-xs uppercase"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase mb-1">
            Receiver ID &amp; Qual
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={receiverQual}
              onChange={(e) => setReceiverQual(e.target.value.toUpperCase())}
              maxLength={2}
              className="w-10 p-2 rounded-lg border font-mono text-xs text-center uppercase font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <input
              type="text"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value.toUpperCase())}
              maxLength={15}
              className="flex-1 p-2 rounded-lg border font-mono text-xs uppercase"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase mb-1">
            Document / Reference #
          </label>
          <input
            type="text"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            className="w-full p-2 rounded-lg border font-mono text-xs"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase mb-1">
            Line Items ({itemCount})
          </label>
          <input
            type="range"
            min={1}
            max={6}
            value={itemCount}
            onChange={(e) => setItemCount(Number(e.target.value))}
            className="w-full mt-2 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase mb-1">
            Separators (Elem / Term)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={elemSep}
              onChange={(e) => setElemSep(e.target.value || '*')}
              maxLength={1}
              className="w-9 p-1.5 rounded-lg border font-mono text-xs text-center font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <input
              type="text"
              value={segTerm}
              onChange={(e) => setSegTerm(e.target.value || '~')}
              maxLength={1}
              className="w-9 p-1.5 rounded-lg border font-mono text-xs text-center font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <span className="text-[11px] text-[var(--muted)]">e.g. * and ~</span>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: copied ? 'var(--ok)' : 'var(--brand)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy EDI'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl border font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            title="Download .edi file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generated Code Area */}
      <div
        className="p-4 rounded-2xl border shadow-sm flex flex-col"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            LIVE GENERATED {selectedTemplate} SPECIFICATION DOCUMENT
          </span>
          <span className="text-[var(--muted)] font-mono">
            {generatedEdi.split('\n').filter(Boolean).length} Segments
          </span>
        </div>
        <textarea
          readOnly
          value={generatedEdi}
          rows={16}
          className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/20"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
        />
      </div>
    </div>
  );
};
