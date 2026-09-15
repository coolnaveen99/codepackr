import { CanonicalDocument, DiagnosticMessage } from '../models/canonical';

export function validateCanonical(doc: CanonicalDocument): DiagnosticMessage[] {
  const diagnostics: DiagnosticMessage[] = [];

  if (!doc.header.orderNumber) {
    diagnostics.push({
      level: 'WARNING',
      stage: 'CANONICAL',
      code: 'WARN_NO_ORDER_NUMBER',
      message: 'Canonical document has empty or missing business identifier (orderNumber/reference)',
    });
  }

  if (!doc.lineItems || doc.lineItems.length === 0) {
    diagnostics.push({
      level: 'WARNING',
      stage: 'CANONICAL',
      code: 'WARN_NO_LINE_ITEMS',
      message: 'Canonical document contains 0 line items',
    });
  } else {
    // Check line quantities and prices
    doc.lineItems.forEach((item, idx) => {
      if (item.quantity <= 0) {
        diagnostics.push({
          level: 'WARNING',
          stage: 'CANONICAL',
          code: 'WARN_ZERO_QTY',
          element: `Line[${idx}].quantity`,
          message: `Line item ${item.lineNumber || idx + 1} has zero or negative quantity: ${item.quantity}`,
        });
      }
    });
  }

  if (doc.parties.length === 0) {
    diagnostics.push({
      level: 'INFO',
      stage: 'CANONICAL',
      code: 'INFO_NO_PARTIES',
      message: 'No buyer/supplier/ship-to parties extracted into canonical model',
    });
  }

  return diagnostics;
}
