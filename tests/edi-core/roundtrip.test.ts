import { describe, it, expect } from 'vitest';
import { x12Adapter } from '../../src/edi-core/adapters/x12Adapter';
import { FIXTURE_X12_850 } from '../../src/edi-core/samples';

describe('EDI Roundtrip Fidelity', () => {
  it('parses X12 850, synthesizes back to X12, and re-parses with preserved business data', () => {
    // 1. Inbound parse
    const parseResult1 = x12Adapter.parse(FIXTURE_X12_850);
    expect(parseResult1.canonical.header.orderNumber).toBe('PO-DEMO-10042');
    expect(parseResult1.canonical.summary.totalAmount).toBe(15750);

    // 2. Outbound synthesize
    const synthesizedEdi = x12Adapter.synthesize(parseResult1.canonical, {
      standard: 'X12',
      transactionType: '850',
      senderId: 'NORTHWIND_SUPPLY',
      receiverId: 'CONTOSO_BUYER',
    });

    expect(synthesizedEdi).toContain('ST*850*');
    expect(synthesizedEdi).toContain('PO-DEMO-10042');

    // 3. Re-parse synthesized EDI
    const parseResult2 = x12Adapter.parse(synthesizedEdi);
    expect(parseResult2.canonical.header.orderNumber).toBe('PO-DEMO-10042');
    expect(parseResult2.canonical.summary.totalAmount).toBe(15750);
    expect(parseResult2.canonical.lineItems.length).toBe(parseResult1.canonical.lineItems.length);
    expect(parseResult2.canonical.parties.length).toBeGreaterThan(0);
  });
});
