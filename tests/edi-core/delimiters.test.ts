import { describe, it, expect } from 'vitest';
import { detectFormatAndDelimiters } from '../../src/edi-core/parsing/delimiters';
import { splitSegments } from '../../src/edi-core/parsing/split';
import { FIXTURE_X12_850, FIXTURE_EDIFACT_ORDERS, FIXTURE_AS2_MESSAGE } from '../../src/edi-core/samples';

describe('EDI Delimiter & Format Detection', () => {
  it('correctly detects standard ANSI X12 with asterisk and tilde', () => {
    const detection = detectFormatAndDelimiters(FIXTURE_X12_850);
    expect(detection.format).toBe('x12');
    expect(detection.elementDelimiter).toBe('*');
    expect(detection.segmentTerminator).toBe('~');
    expect(detection.subElementDelimiter).toBe('>');
    expect(detection.isAs2Mime).toBe(false);
  });

  it('correctly detects UN/EDIFACT with plus and apostrophe', () => {
    const detection = detectFormatAndDelimiters(FIXTURE_EDIFACT_ORDERS);
    expect(detection.format).toBe('edifact');
    expect(detection.elementDelimiter).toBe('+');
    expect(detection.segmentTerminator).toBe("'");
    expect(detection.subElementDelimiter).toBe(':');
    expect(detection.isAs2Mime).toBe(false);
  });

  it('correctly detects and unwraps AS2 MIME packaging', () => {
    const detection = detectFormatAndDelimiters(FIXTURE_AS2_MESSAGE);
    expect(detection.isAs2Mime).toBe(true);
    expect(detection.format).toBe('x12');
    expect(detection.cleanEdi).toContain('ISA*00*');
    expect(detection.cleanEdi).toContain('BEG*00*NE*PO-DEMO-10042');
  });

  it('splits segments accurately preserving raw strings and line numbers', () => {
    const segments = splitSegments(FIXTURE_X12_850, '~', '*');
    expect(segments.length).toBeGreaterThan(5);
    expect(segments[0].tag).toBe('ISA');
    expect(segments[0].elements.length).toBe(16);
    expect(segments[0].lineNumber).toBe(1);

    const stSeg = segments.find((s) => s.tag === 'ST');
    expect(stSeg).toBeDefined();
    expect(stSeg?.elements[0]).toBe('850');
  });
});
