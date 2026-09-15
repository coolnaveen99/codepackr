import { CanonicalDocument } from '../models/canonical';

export function renderCanonicalToCsv(canonical: CanonicalDocument): string {
  const headers = [
    'LineNumber',
    'PartNumber',
    'Description',
    'Quantity',
    'UOM',
    'UnitPrice',
    'ExtendedAmount',
    'OrderNumber',
    'OrderDate',
    'Currency',
  ];
  const rows = canonical.lineItems.map((item) => [
    item.lineNumber,
    `"${item.partNumber.replace(/"/g, '""')}"`,
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

export function renderCanonicalToTxt(canonical: CanonicalDocument): string {
  const lines: string[] = [];
  lines.push('================================================================================');
  lines.push(`ENTERPRISE B2B INTEGRATION GATEWAY — CANONICAL DISPATCH REPORT`);
  lines.push('================================================================================');
  lines.push(`DOCUMENT TYPE    : ${canonical.documentType} (${canonical.transactionType})`);
  lines.push(`ORDER / ID       : ${canonical.header.orderNumber}`);
  lines.push(`ORDER DATE       : ${canonical.header.orderDate}`);
  lines.push(`CURRENCY         : ${canonical.header.currency}`);
  lines.push(`ORIGINAL FORMAT  : ${canonical.rawMeta.originalFormat} (v${canonical.rawMeta.version})`);
  lines.push(`CONTROL NUMBERS  : ICN ${canonical.controlNumbers.interchange} / GCN ${canonical.controlNumbers.group} / TCN ${canonical.controlNumbers.transaction}`);
  lines.push('--------------------------------------------------------------------------------');
  lines.push('PARTIES INVOLVED:');
  canonical.parties.forEach((p) => {
    lines.push(`  - ${p.role.padEnd(20, ' ')} : ${p.name} [DUNS: ${p.duns || 'N/A'}]`);
    if (p.address) lines.push(`    ${p.address}, ${p.city || ''} ${p.state || ''} ${p.zip || ''}`);
  });
  lines.push('--------------------------------------------------------------------------------');
  lines.push('LINE ITEMS:');
  lines.push(
    `  ${'LN'.padEnd(4, ' ')} ${'PART NUMBER'.padEnd(16, ' ')} ${'QTY'.padStart(6, ' ')} ${'UOM'.padEnd(5, ' ')} ${'UNIT PRICE'.padStart(12, ' ')} ${'TOTAL'.padStart(12, ' ')}`
  );
  lines.push('  ' + '-'.repeat(74));
  canonical.lineItems.forEach((it) => {
    const ext = (it.extendedAmount || it.quantity * it.unitPrice).toFixed(2);
    lines.push(
      `  ${it.lineNumber.padEnd(4, ' ')} ${it.partNumber.slice(0, 15).padEnd(16, ' ')} ${String(it.quantity).padStart(6, ' ')} ${it.uom.padEnd(5, ' ')} ${it.unitPrice.toFixed(2).padStart(12, ' ')} ${ext.padStart(12, ' ')}`
    );
  });
  lines.push('--------------------------------------------------------------------------------');
  lines.push(`SUMMARY: ${canonical.summary.lineCount} Lines | Total Units: ${canonical.summary.totalQuantity} | Total Value: ${canonical.header.currency} ${canonical.summary.totalAmount.toFixed(2)}`);
  lines.push('================================================================================');
  return lines.join('\n');
}
