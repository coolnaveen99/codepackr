import { CanonicalDocument } from '../models/canonical';

export interface OutboundSynthesisOptions {
  standard?: 'X12' | 'EDIFACT';
  transactionType?: string;
  senderId?: string;
  receiverId?: string;
  interchangeControlNumber?: string;
  groupControlNumber?: string;
  transactionControlNumber?: string;
  elementDelimiter?: string;
  segmentTerminator?: string;
  componentDelimiter?: string;
}

export function synthesizeOutboundEdi(
  canonical: CanonicalDocument,
  options: OutboundSynthesisOptions = {}
): string {
  const standard = (options.standard || (canonical.rawMeta?.originalFormat === 'EDIFACT' ? 'EDIFACT' : 'X12')).toUpperCase();
  const txType = options.transactionType || canonical.transactionType || '850';
  const senderId = (options.senderId || 'CODEPACKRHUB').padEnd(15, ' ');
  const receiverId = (options.receiverId || 'TRADINGPARTNER').padEnd(15, ' ');

  const icn = (options.interchangeControlNumber || canonical.controlNumbers?.interchange || '000000850').padStart(9, '0');
  const gcn = (options.groupControlNumber || canonical.controlNumbers?.group || '85001');
  const tcn = (options.transactionControlNumber || canonical.controlNumbers?.transaction || '0001').padStart(4, '0');

  const rawDate = (canonical.header?.orderDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const dateCompact = rawDate.slice(2, 8);
  const timeCompact = '0830';

  if (standard === 'X12') {
    const e = options.elementDelimiter || '*';
    const s = options.segmentTerminator || '~';
    const sub = options.componentDelimiter || '>';
    const lines: string[] = [];

    // ISA
    lines.push(
      `ISA${e}00${e}          ${e}00${e}          ${e}ZZ${e}${senderId}${e}ZZ${e}${receiverId}${e}${dateCompact}${e}${timeCompact}${e}U${e}00401${e}${icn}${e}0${e}P${e}${sub}`
    );

    // Functional Group Code by Transaction Type
    let fgCode = 'PO';
    if (txType === '810') fgCode = 'IN';
    else if (txType === '856') fgCode = 'SH';
    else if (txType === '888') fgCode = 'MP'; // Maintenance of Product
    else if (txType === '943') fgCode = 'AR'; // Warehouse Stock Advice
    else if (txType === '860') fgCode = 'PC';

    lines.push(`GS${e}${fgCode}${e}${senderId.trim()}${e}${receiverId.trim()}${e}${rawDate}${e}${timeCompact}${e}${gcn}${e}X${e}004010`);

    // ST
    lines.push(`ST${e}${txType}${e}${tcn}`);

    // Header Segments based on Transaction Type
    if (txType === '850') {
      lines.push(`BEG${e}00${e}NE${e}${canonical.header.orderNumber}${e}${e}${rawDate}`);
      lines.push(`CUR${e}SE${e}${canonical.header.currency || 'USD'}`);
    } else if (txType === '810') {
      lines.push(`BIG${e}${rawDate}${e}${canonical.header.orderNumber}${e}${rawDate}${e}${canonical.header.referenceNumber || 'PO-REF-101'}`);
      lines.push(`CUR${e}SE${e}${canonical.header.currency || 'USD'}`);
    } else if (txType === '856') {
      lines.push(`BSN${e}00${e}${canonical.header.orderNumber}${e}${rawDate}${e}${timeCompact}`);
    } else if (txType === '888') {
      // 888 Item Maintenance
      lines.push(`BAP${e}00${e}${rawDate}${e}${canonical.header.orderNumber}`);
    } else if (txType === '943') {
      // 943 Warehouse Stock Transfer Shipment Advice
      lines.push(`W06${e}N${e}${canonical.header.orderNumber}${e}${rawDate}`);
    } else {
      lines.push(`BGN${e}00${e}${canonical.header.orderNumber}${e}${rawDate}`);
    }

    if (canonical.header.referenceNumber) {
      lines.push(`REF${e}DP${e}${canonical.header.referenceNumber}`);
    }

    // Parties (N1/N3/N4)
    canonical.parties.forEach((p) => {
      let code = 'BT';
      if (p.role.includes('Ship') || p.role.includes('ST')) code = 'ST';
      else if (p.role.includes('Supplier') || p.role.includes('SU') || p.role.includes('VN')) code = 'VN';
      else if (p.role.includes('Warehouse') || p.role.includes('WH')) code = 'WH';

      lines.push(`N1${e}${code}${e}${p.name}${e}9${e}${p.duns || '0012345678900'}`);
      if (p.address) lines.push(`N3${e}${p.address}`);
      if (p.city || p.state || p.zip) {
        lines.push(`N4${e}${p.city || 'CHICAGO'}${e}${p.state || 'IL'}${e}${p.zip || '60601'}`);
      }
    });

    // Line Items
    if (txType === '850') {
      canonical.lineItems.forEach((item, idx) => {
        lines.push(
          `PO1${e}${item.lineNumber || idx + 1}${e}${item.quantity}${e}${item.uom || 'EA'}${e}${item.unitPrice.toFixed(2)}${e}${e}VN${e}${item.partNumber}${item.upc ? `${e}UP${e}${item.upc}` : ''}`
        );
        if (item.description) lines.push(`PID${e}F${e}${e}${e}${e}${item.description}`);
      });
      lines.push(`CTT${e}${canonical.lineItems.length}${e}${canonical.summary.totalQuantity}`);
    } else if (txType === '810') {
      canonical.lineItems.forEach((item, idx) => {
        lines.push(
          `IT1${e}${item.lineNumber || idx + 1}${e}${item.quantity}${e}${item.uom || 'EA'}${e}${item.unitPrice.toFixed(2)}${e}${e}VN${e}${item.partNumber}`
        );
        if (item.description) lines.push(`PID${e}F${e}${e}${e}${e}${item.description}`);
      });
      lines.push(`TDS${e}${Math.round(canonical.summary.totalAmount * 100)}`);
      lines.push(`CTT${e}${canonical.lineItems.length}`);
    } else if (txType === '888') {
      // 888 LIN & G53/PID item maintenance
      canonical.lineItems.forEach((item, idx) => {
        lines.push(`LIN${e}${item.lineNumber || idx + 1}${e}VP${e}${item.partNumber}`);
        lines.push(`PID${e}F${e}${e}${e}${e}${item.description}`);
      });
      lines.push(`CTT${e}${canonical.lineItems.length}`);
    } else if (txType === '943') {
      // 943 W04 item details
      canonical.lineItems.forEach((item) => {
        lines.push(`W04${e}${item.quantity}${e}${item.uom || 'EA'}${e}${e}${e}VN${e}${item.partNumber}`);
      });
      lines.push(`W03${e}${canonical.lineItems.length}${e}${canonical.summary.totalQuantity}`);
    } else {
      canonical.lineItems.forEach((item, idx) => {
        lines.push(
          `PO1${e}${item.lineNumber || idx + 1}${e}${item.quantity}${e}${item.uom || 'EA'}${e}${item.unitPrice.toFixed(2)}${e}${e}VN${e}${item.partNumber}`
        );
      });
      lines.push(`CTT${e}${canonical.lineItems.length}`);
    }

    // Trailer calculation: Count of segments from ST to SE inclusive
    // ST is at index 2 (0: ISA, 1: GS, 2: ST)
    const stIndex = 2;
    const countBeforeSE = lines.length - stIndex; // number of segments including ST up to before SE
    const seCount = countBeforeSE + 1; // including SE itself

    lines.push(`SE${e}${seCount}${e}${tcn}`);
    lines.push(`GE${e}1${e}${gcn}`);
    lines.push(`IEA${e}1${e}${icn}`);

    return lines.join(`${s}\n`) + s;
  } else {
    // EDIFACT Synthesis
    const lines: string[] = [];
    const snd = (options.senderId || 'CODEPACKRHUB').trim();
    const rcv = (options.receiverId || 'TRADINGPARTNER').trim();

    lines.push(`UNB+UNOA:2+${snd}:ZZ+${rcv}:ZZ+${dateCompact}:${timeCompact}+IREF${icn.slice(-4)}+++++1'`);

    let msgName = 'ORDERS';
    let bgmCode = '220';
    if (txType.includes('INVOI') || txType === '810') {
      msgName = 'INVOIC';
      bgmCode = '380';
    } else if (txType.includes('DESAD') || txType === '856') {
      msgName = 'DESADV';
      bgmCode = '351';
    }

    lines.push(`UNH+MEST${tcn}+${msgName}:D:96A:UN:EAN008'`);
    lines.push(`BGM+${bgmCode}+${canonical.header.orderNumber}+9'`);
    lines.push(`DTM+137:${rawDate}:102'`);

    canonical.parties.forEach((p) => {
      let code = 'BY';
      if (p.role.includes('Ship')) code = 'DP';
      else if (p.role.includes('Supplier') || p.role.includes('Vendor')) code = 'SU';
      lines.push(`NAD+${code}+${p.duns || '987654'}::9++${p.name}+${p.address || ''}+${p.city || ''}++${p.zip || ''}+GB'`);
    });

    canonical.lineItems.forEach((item, idx) => {
      lines.push(`LIN+${item.lineNumber || idx + 1}++${item.partNumber}:EN'`);
      if (item.description) lines.push(`IMD+F++:::${item.description}'`);
      lines.push(`QTY+21:${item.quantity}:${item.uom || 'PCE'}'`);
      lines.push(`MOA+203:${item.unitPrice.toFixed(2)}'`);
    });

    lines.push("UNS+S'");
    lines.push(`CNT+2:${canonical.lineItems.length}'`);

    const untCount = lines.length; // roughly UNH through UNT
    lines.push(`UNT+${untCount}+MEST${tcn}'`);
    lines.push(`UNZ+1+IREF${icn.slice(-4)}'`);

    return lines.join('\n');
  }
}
