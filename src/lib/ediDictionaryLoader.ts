/**
 * EDI Static Dictionary Lazy Loader (Section 3.A of EDI UX Modernization Guide)
 * Loads segment/element dictionaries dynamically on demand to keep bundle size light.
 */

export interface EdiElementDef {
  pos: string;
  name: string;
  type: string;
  min: number;
  max: number;
  req: string;
}

export interface EdiSegmentDef {
  tag: string;
  name: string;
  purpose: string;
  elements: EdiElementDef[];
}

export interface EdiDictionaryPackage {
  standard: 'X12' | 'EDIFACT';
  version: string;
  description: string;
  segments: Record<string, EdiSegmentDef>;
}

export type EdiDictionaryKey = 'x12-4010' | 'x12-5010' | 'edifact-d96a' | 'edifact-d01b';

const dictionaryCache: Partial<Record<EdiDictionaryKey, EdiDictionaryPackage>> = {};

/**
 * Lazy loads a specific standard dictionary chunk via dynamic import
 */
export async function loadEdiDictionary(key: EdiDictionaryKey): Promise<EdiDictionaryPackage> {
  if (dictionaryCache[key]) {
    return dictionaryCache[key]!;
  }

  let pkg: EdiDictionaryPackage;
  switch (key) {
    case 'x12-4010':
      pkg = (await import('../data/edi/dictionaries/x12-4010.json')).default as unknown as EdiDictionaryPackage;
      break;
    case 'x12-5010':
      pkg = (await import('../data/edi/dictionaries/x12-5010.json')).default as unknown as EdiDictionaryPackage;
      break;
    case 'edifact-d96a':
      pkg = (await import('../data/edi/dictionaries/edifact-d96a.json')).default as unknown as EdiDictionaryPackage;
      break;
    case 'edifact-d01b':
      pkg = (await import('../data/edi/dictionaries/edifact-d01b.json')).default as unknown as EdiDictionaryPackage;
      break;
    default:
      pkg = (await import('../data/edi/dictionaries/x12-4010.json')).default as unknown as EdiDictionaryPackage;
  }

  dictionaryCache[key] = pkg;
  return pkg;
}

/**
 * Auto-detects the dictionary key from raw EDI content
 */
export function detectDictionaryKey(input: string): EdiDictionaryKey {
  const trimmed = input.trim();
  if (trimmed.startsWith('UNA') || trimmed.startsWith('UNB') || trimmed.includes('UNH+')) {
    if (trimmed.includes('01B') || trimmed.includes('D01B')) return 'edifact-d01b';
    return 'edifact-d96a';
  }
  if (trimmed.includes('00501') || trimmed.includes('005010') || trimmed.includes('837') || trimmed.includes('835')) {
    return 'x12-5010';
  }
  return 'x12-4010';
}

/**
 * Synchronous fallback lookup from cache or general defaults
 */
export function getCachedSegmentDef(tag: string, dictKey: EdiDictionaryKey = 'x12-4010'): EdiSegmentDef | undefined {
  return dictionaryCache[dictKey]?.segments?.[tag.toUpperCase()];
}
