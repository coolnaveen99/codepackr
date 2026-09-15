import { describe, it, expect } from 'vitest';
import {
  createInitialContext,
  runFullPipeline,
  advanceStage,
  resetPipeline,
} from '../../src/gateway/pipeline/controller';
import { FIXTURE_X12_850, FIXTURE_OUTBOUND_JSON_PO } from '../../src/edi-core/samples';

describe('Pipeline Controller & State Machine', () => {
  it('creates clean initial context with default stages', () => {
    const ctx = createInitialContext('inbound', FIXTURE_X12_850, 'guided');
    expect(ctx.direction).toBe('inbound');
    expect(ctx.status).toBe('idle');
    expect(ctx.currentStage).toBe('receive');
    expect(ctx.stages.length).toBe(8);
  });

  it('runs full inbound pipeline end-to-end to succeeded state', () => {
    const initial = createInitialContext('inbound', FIXTURE_X12_850, 'full');
    const completed = runFullPipeline(initial);

    expect(completed.status).toBe('succeeded');
    expect(completed.completedStages.length).toBe(8);
    expect(completed.canonical).toBeDefined();
    expect(completed.canonical?.header.orderNumber).toBe('PO-DEMO-10042');
    expect(completed.virtualFiles.length).toBeGreaterThan(0);
    expect(completed.lineage.length).toBeGreaterThan(5);
  });

  it('advances stages sequentially in guided mode', () => {
    let ctx = createInitialContext('inbound', FIXTURE_X12_850, 'guided');
    expect(ctx.currentStage).toBe('receive');

    ctx = advanceStage(ctx);
    expect(ctx.completedStages).toContain('receive');
    expect(ctx.currentStage).toBe('detect');

    ctx = advanceStage(ctx);
    expect(ctx.completedStages).toContain('detect');
    expect(ctx.detection).toBeDefined();
    expect(ctx.detection?.elementDelimiter).toBe('*');
  });

  it('runs full outbound pipeline and packages AS2 and virtual files', () => {
    const initial = createInitialContext('outbound', FIXTURE_OUTBOUND_JSON_PO, 'full');
    const completed = runFullPipeline(initial);

    expect(completed.status).toBe('succeeded');
    expect(completed.synthesizedEdi).toBeDefined();
    expect(completed.synthesizedEdi).toContain('ISA*00*');
    expect(completed.as2Package).toBeDefined();
    expect(completed.as2Package?.rawEml).toContain('AS2-Version: 1.2');
    expect(completed.virtualFiles.some((f) => f.format === 'eml')).toBe(true);
  });

  it('resets pipeline back to initial state cleanly', () => {
    const initial = createInitialContext('inbound', FIXTURE_X12_850, 'full');
    const completed = runFullPipeline(initial);
    expect(completed.status).toBe('succeeded');

    const reset = resetPipeline(completed);
    expect(reset.status).toBe('idle');
    expect(reset.completedStages.length).toBe(0);
    expect(reset.canonical).toBeUndefined();
    expect(reset.virtualFiles.length).toBe(0);
  });
});
