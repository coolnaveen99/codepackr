import { describe, it, expect } from 'vitest';
import { adapterRegistry } from '../../src/edi-core/adapters/registry';
import {
  FIXTURE_X12_850,
  FIXTURE_X12_860,
  FIXTURE_X12_944,
  FIXTURE_X12_837_CLAIM,
  FIXTURE_X12_214_LOGISTICS,
  FIXTURE_EDIFACT_ORDERS,
  FIXTURE_OUTBOUND_JSON_PO,
} from '../../src/edi-core/samples';

describe('Adapter Registry & Format Parsers', () => {
  it('resolves X12 adapter for ANSI ASC X12 payloads', () => {
    const adapter = adapterRegistry.resolve('x12');
    expect(adapter).toBeDefined();
    expect(adapter?.formatFamily).toBe('x12');

    const result = adapter?.parse(FIXTURE_X12_850);
    expect(result).toBeDefined();
    expect(result?.transactions.length).toBe(1);
    expect(result?.transactions[0].type).toBe('850');
    expect(result?.canonical.header.orderNumber).toBe('PO-DEMO-10042');
    expect(result?.canonical.lineItems.length).toBe(2);
  });

  it('parses X12 860 Purchase Order Change successfully', () => {
    const adapter = adapterRegistry.resolve('x12');
    const result = adapter?.parse(FIXTURE_X12_860);
    expect(result?.transactions[0].type).toBe('860');
    expect(result?.canonical.header.orderNumber).toBe('PO-DEMO-10042');
    expect(result?.canonical.lineItems.length).toBe(1);
  });

  it('parses X12 944 Warehouse Stock Transfer successfully', () => {
    const adapter = adapterRegistry.resolve('x12');
    const result = adapter?.parse(FIXTURE_X12_944);
    expect(result?.transactions[0].type).toBe('944');
    expect(result?.canonical.header.orderNumber).toBe('WR-DEMO-5544');
    expect(result?.canonical.lineItems.length).toBe(2);
  });

  it('parses X12 837 Healthcare Claim successfully', () => {
    const adapter = adapterRegistry.resolve('x12');
    const result = adapter?.parse(FIXTURE_X12_837_CLAIM);
    expect(result?.transactions[0].type).toBe('837');
    expect(result?.canonical.documentType).toBe('HealthcareClaim');
    expect(result?.canonical.summary.totalAmount).toBe(285);
  });

  it('parses X12 214 Shipment Status successfully', () => {
    const adapter = adapterRegistry.resolve('x12');
    const result = adapter?.parse(FIXTURE_X12_214_LOGISTICS);
    expect(result?.transactions[0].type).toBe('214');
    expect(result?.canonical.documentType).toBe('ShipmentStatus');
  });

  it('resolves EDIFACT adapter and parses ORDERS D96A', () => {
    const adapter = adapterRegistry.resolve('edifact');
    expect(adapter).toBeDefined();
    expect(adapter?.formatFamily).toBe('edifact');

    const result = adapter?.parse(FIXTURE_EDIFACT_ORDERS);
    expect(result).toBeDefined();
    expect(result?.transactions[0].type).toBe('ORDERS');
    expect(result?.canonical.header.orderNumber).toBe('PO-DEMO-99120');
    expect(result?.canonical.lineItems.length).toBe(2);
  });

  it('synthesizes compliant X12 from canonical document', () => {
    const adapter = adapterRegistry.resolve('x12');
    const canonical = JSON.parse(FIXTURE_OUTBOUND_JSON_PO);
    const synthesized = adapter?.synthesize(canonical, {
      standard: 'X12',
      transactionType: '850',
      senderId: 'SENDER01',
      receiverId: 'RECEIVER01',
    });

    expect(synthesized).toContain('ISA*00*');
    expect(synthesized).toContain('GS*PO*');
    expect(synthesized).toContain('ST*850*');
    expect(synthesized).toContain('SE*');
    expect(synthesized).toContain('GE*');
    expect(synthesized).toContain('IEA*');
  });
});
