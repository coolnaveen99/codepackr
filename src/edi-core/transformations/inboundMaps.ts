import { CanonicalDocument, CanonicalParty, CanonicalLineItem, FieldMapping } from '../models/canonical';
import { ParsedSegment, ParsedTransaction } from '../models/segments';
import { createFieldMapping } from './lineage';

export interface InboundMappingResult {
  canonical: CanonicalDocument;
  lineage: FieldMapping[];
}

export function mapInboundTransactionToCanonical(
  tx: ParsedTransaction,
  envelopeMeta: {
    format: string;
    version: string;
    icn: string;
    gcn: string;
    delimiters: { element: string; segment: string; subElement?: string };
    isAs2Mime?: boolean;
    mic?: string;
  }
): InboundMappingResult {
  const segments = tx.segments;
  const lineage: FieldMapping[] = [];

  const txType = tx.transactionType.toUpperCase();
  let docType = 'StandardDocument';
  let orderNumber = 'DOC-' + Date.now().toString().slice(-6);
  let orderDate = new Date().toISOString().slice(0, 10);
  let currency = 'USD';
  let statusOrType = 'Original';
  let referenceNumber: string | undefined;
  let department: string | undefined;

  const parties: CanonicalParty[] = [];
  const lineItems: CanonicalLineItem[] = [];

  // 1. Determine Document Type and Core Header Info based on standard & transaction
  if (envelopeMeta.format.toLowerCase() === 'x12') {
    const isa = segments.find((s) => s.tag === 'ISA');
    const cur = segments.find((s) => s.tag === 'CUR');
    const ref = segments.find((s) => s.tag === 'REF');

    if (cur && cur.elements[1]) {
      currency = cur.elements[1].trim();
      lineage.push(createFieldMapping('header.currency', 'CUR', 'CUR02', currency, 'Currency identifier code'));
    }

    if (ref) {
      referenceNumber = ref.elements[1] || '';
      lineage.push(createFieldMapping('header.referenceNumber', 'REF', 'REF02', referenceNumber, `Reference qualifier: ${ref.elements[0] || 'REF'}`));
      if (ref.elements[0] === 'DP') {
        department = ref.elements[1];
        lineage.push(createFieldMapping('header.department', 'REF', 'REF02', department, 'Department code'));
      }
    }

    if (txType === '850') {
      docType = 'PurchaseOrder';
      const beg = segments.find((s) => s.tag === 'BEG');
      if (beg) {
        statusOrType = beg.elements[0] === '00' ? 'Original' : 'Updated';
        lineage.push(createFieldMapping('header.statusOrType', 'BEG', 'BEG01', statusOrType, 'Transaction set purpose code'));

        if (beg.elements[2]) {
          orderNumber = beg.elements[2].trim();
          lineage.push(createFieldMapping('header.orderNumber', 'BEG', 'BEG03', orderNumber, 'Purchase order number'));
        }

        if (beg.elements[4] && beg.elements[4].length >= 8) {
          const rawDate = beg.elements[4].trim();
          orderDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          lineage.push(createFieldMapping('header.orderDate', 'BEG', 'BEG05', orderDate, 'Purchase order release date (YYYY-MM-DD)'));
        }
      }
    } else if (txType === '860') {
      docType = 'PurchaseOrderChange';
      const bch = segments.find((s) => s.tag === 'BCH');
      if (bch) {
        statusOrType = 'OrderChange';
        lineage.push(createFieldMapping('header.statusOrType', 'BCH', 'BCH01', statusOrType, 'PO change request purpose'));
        if (bch.elements[2]) {
          orderNumber = bch.elements[2].trim();
          lineage.push(createFieldMapping('header.orderNumber', 'BCH', 'BCH03', orderNumber, 'Target PO number for change'));
        }
        if (bch.elements[5] && bch.elements[5].length >= 8) {
          const rawDate = bch.elements[5].trim();
          orderDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          lineage.push(createFieldMapping('header.orderDate', 'BCH', 'BCH06', orderDate, 'Change request issue date'));
        }
      }
    } else if (txType === '944') {
      docType = 'WarehouseStockTransferReceipt';
      const w17 = segments.find((s) => s.tag === 'W17');
      if (w17) {
        statusOrType = 'StockReceipt';
        if (w17.elements[1]) {
          orderNumber = w17.elements[1].trim();
          lineage.push(createFieldMapping('header.orderNumber', 'W17', 'W1702', orderNumber, 'Warehouse receipt identification number'));
        }
        if (w17.elements[2] && w17.elements[2].length >= 8) {
          const rawDate = w17.elements[2].trim();
          orderDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          lineage.push(createFieldMapping('header.orderDate', 'W17', 'W1703', orderDate, 'Warehouse stock receipt date'));
        }
      }
    } else if (txType === '837') {
      docType = 'HealthcareClaim';
      const bht = segments.find((s) => s.tag === 'BHT');
      if (bht) {
        orderNumber = bht.elements[2] || 'CLAIM-837-01';
        lineage.push(createFieldMapping('header.orderNumber', 'BHT', 'BHT03', orderNumber, 'Healthcare claim transaction reference'));
        if (bht.elements[3] && bht.elements[3].length >= 8) {
          const rawDate = bht.elements[3].trim();
          orderDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          lineage.push(createFieldMapping('header.orderDate', 'BHT', 'BHT04', orderDate, 'Claim creation date'));
        }
      }
    } else if (txType === '214') {
      docType = 'ShipmentStatus';
      const b10 = segments.find((s) => s.tag === 'B10');
      if (b10) {
        orderNumber = b10.elements[1] || 'BOL-214-01';
        lineage.push(createFieldMapping('header.orderNumber', 'B10', 'B1002', orderNumber, 'Shipper bill of lading or purchase order'));
      }
    } else if (txType === '810') {
      docType = 'Invoice';
      const big = segments.find((s) => s.tag === 'BIG');
      if (big) {
        orderNumber = big.elements[1] || 'INV-810-01';
        lineage.push(createFieldMapping('header.orderNumber', 'BIG', 'BIG02', orderNumber, 'Commercial invoice identifier'));
        if (big.elements[0] && big.elements[0].length >= 8) {
          const rawDate = big.elements[0].trim();
          orderDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          lineage.push(createFieldMapping('header.orderDate', 'BIG', 'BIG01', orderDate, 'Invoice date'));
        }
      }
    } else if (txType === '856') {
      docType = 'ShipmentNotice';
      const bsn = segments.find((s) => s.tag === 'BSN');
      if (bsn) {
        orderNumber = bsn.elements[1] || 'ASN-856-01';
        lineage.push(createFieldMapping('header.orderNumber', 'BSN', 'BSN02', orderNumber, 'Shipment identification number (ASN)'));
        if (bsn.elements[2] && bsn.elements[2].length >= 8) {
          const rawDate = bsn.elements[2].trim();
          orderDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          lineage.push(createFieldMapping('header.orderDate', 'BSN', 'BSN03', orderDate, 'ASN generation date'));
        }
      }
    }

    // Extract X12 Parties (N1/N3/N4, NM1)
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
          WH: 'Warehouse (WH)',
          DE: 'Depositor (DE)',
        };

        const role = roleMap[code] || `Party (${code})`;
        parties.push({ role, name, duns, address, city, state, zip, country: 'USA' });
        lineage.push(createFieldMapping(`parties[${parties.length - 1}].name`, 'N1', 'N102', name, `Party identifier name (${role})`));
      } else if (seg.tag === 'NM1') {
        // NM1 healthcare party
        const code = seg.elements[0] || '';
        const type = seg.elements[1] || '';
        const lastName = seg.elements[2] || '';
        const firstName = seg.elements[3] || '';
        const name = firstName ? `${firstName} ${lastName}` : lastName;
        const id = seg.elements[8] || '';

        const nm1Roles: Record<string, string> = {
          '41': 'Submitter (41)',
          '40': 'Receiver (40)',
          '85': 'Billing Provider (85)',
          'IL': 'Insured / Subscriber (IL)',
          'PR': 'Payer (PR)',
        };

        parties.push({
          role: nm1Roles[code] || `Healthcare Entity (${code})`,
          name: name || `Provider/Patient ${id}`,
          duns: id,
          country: 'USA',
        });
      }
    }

    // Extract X12 Line Items (PO1 / SV1 / W07 / LIN)
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
          if (q === 'VN' || q === 'BP' || q === 'MG' || q === 'IN') partNo = v;
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

        lineage.push(createFieldMapping(`lineItems[${lineItems.length - 1}].partNumber`, 'PO1', 'PO107', partNo || `SKU-${lineNo}`, 'Vendor Item Number'));
      } else if (seg.tag === 'SV1') {
        // Healthcare Service Line
        const lineNo = String(lineItems.length + 1);
        const procCode = (seg.elements[0] || '').replace('HC:', '') || 'PROC';
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
      } else if (seg.tag === 'W07') {
        // Warehouse stock receipt line (944)
        const lineNo = String(lineItems.length + 1);
        const qty = parseFloat(seg.elements[0] || '1');
        const uom = seg.elements[1] || 'EA';
        const partNo = seg.elements[4] || `STOCK-SKU-${lineNo}`;

        lineItems.push({
          lineNumber: lineNo,
          quantity: qty,
          uom,
          unitPrice: 0.0,
          partNumber: partNo,
          description: `Warehouse Stored Asset ${partNo}`,
          extendedAmount: 0.0,
        });
      }
    }
  } else if (envelopeMeta.format.toLowerCase() === 'edifact') {
    // EDIFACT Mapping (ORDERS, INVOIC, DESADV)
    const bgm = segments.find((s) => s.tag === 'BGM');
    const dtm = segments.find((s) => s.tag === 'DTM');

    if (txType.includes('ORDER')) {
      docType = 'EDIFACT_ORDERS';
    } else if (txType.includes('INVOI')) {
      docType = 'EDIFACT_INVOIC';
    } else if (txType.includes('DESAD')) {
      docType = 'EDIFACT_DESADV';
    } else {
      docType = `EDIFACT_${txType}`;
    }

    if (bgm) {
      orderNumber = bgm.elements[1] || orderNumber;
      lineage.push(createFieldMapping('header.orderNumber', 'BGM', 'BGM02', orderNumber, 'EDIFACT document message number'));
    }

    if (dtm) {
      const dtmParts = (dtm.elements[0] || '').split(':');
      if (dtmParts[1]) {
        const rawDate = dtmParts[1];
        if (rawDate.length >= 8) {
          orderDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
          lineage.push(createFieldMapping('header.orderDate', 'DTM', 'DTM01:2', orderDate, 'EDIFACT document date'));
        }
      }
    }

    // Parties from NAD
    segments.forEach((seg) => {
      if (seg.tag === 'NAD') {
        const roleCode = seg.elements[0] || '';
        const id = seg.elements[1]?.split(':')[0] || '';
        const name = seg.elements[3] || seg.elements[2] || `Party ${roleCode}`;
        const address = seg.elements[4] || '';
        const city = seg.elements[5] || '';
        const zip = seg.elements[7] || '';
        const country = seg.elements[8] || 'GB';

        const roleMap: Record<string, string> = {
          BY: 'Buyer (BY)',
          SU: 'Supplier (SU)',
          DP: 'Delivery Party (DP)',
          IV: 'Invoicee (IV)',
        };

        parties.push({
          role: roleMap[roleCode] || `Party (${roleCode})`,
          name,
          duns: id,
          address,
          city,
          zip,
          country,
        });
      }
    });

    // Line items from LIN / IMD / QTY / MOA
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.tag === 'LIN') {
        const lineNo = seg.elements[0] || String(lineItems.length + 1);
        const partNo = seg.elements[2]?.split(':')[0] || `ITEM-${lineNo}`;
        let desc = 'Goods Item';
        let qty = 1;
        let price = 0;

        for (let j = i + 1; j < Math.min(i + 6, segments.length); j++) {
          if (segments[j].tag === 'IMD') {
            desc = segments[j].elements[2]?.split(':::')[1] || segments[j].elements[2] || desc;
          }
          if (segments[j].tag === 'QTY') {
            qty = parseFloat(segments[j].elements[0]?.split(':')[1] || '1');
          }
          if (segments[j].tag === 'MOA') {
            price = parseFloat(segments[j].elements[0]?.split(':')[1] || '0');
          }
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

        lineage.push(createFieldMapping(`lineItems[${lineItems.length - 1}].partNumber`, 'LIN', 'LIN03:1', partNo, 'EDIFACT line item number'));
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
      interchange: envelopeMeta.icn,
      group: envelopeMeta.gcn,
      transaction: tx.controlNumber,
    },
    header: {
      orderNumber,
      orderDate,
      currency,
      statusOrType,
      referenceNumber,
      department,
    },
    parties,
    lineItems,
    summary: {
      totalQuantity: totalQty,
      totalAmount: Math.round(totalAmt * 100) / 100,
      lineCount: lineItems.length,
    },
    rawMeta: {
      originalFormat: envelopeMeta.format,
      version: envelopeMeta.version,
      delimiters: envelopeMeta.delimiters,
      receivedAt: new Date().toISOString(),
      isAs2Mime: envelopeMeta.isAs2Mime,
      mic: envelopeMeta.mic,
    },
    mappings: lineage,
  };

  return { canonical, lineage };
}
