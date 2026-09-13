/**
 * Round-Trip Fidelity Diff & Checksum Engine
 * Computes structural parity, element preservation, and data integrity
 * between source and converted documents.
 */

export interface FidelityDifference {
  type: 'missing_segment' | 'extra_segment' | 'element_mismatch' | 'order_mismatch';
  segmentTag: string;
  position?: string;
  originalValue?: string;
  convertedValue?: string;
  description: string;
}

export interface FidelityReport {
  score: number; // 0 - 100
  isLossless: boolean;
  totalOriginalSegments: number;
  totalConvertedSegments: number;
  matchingSegments: number;
  totalOriginalElements: number;
  matchingElements: number;
  differences: FidelityDifference[];
  summaryNote: string;
}

function parseSegments(raw: string): { tag: string; elements: string[] }[] {
  if (!raw || !raw.trim()) return [];
  const text = raw.trim();
  const term = text.includes('~') ? '~' : text.includes("'") ? "'" : '\n';
  const sep = text.includes('*') ? '*' : '+';

  const lines = term === '\n' ? text.split(/\r?\n/) : text.split(term);
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = l.split(sep);
      const tag = (parts[0] || '').trim().toUpperCase();
      const elements = parts.slice(1).map((p) => p.trim());
      return { tag, elements };
    });
}

export function calculateEdiFidelity(originalEdi: string, roundTripEdi: string): FidelityReport {
  const origSegs = parseSegments(originalEdi);
  const roundSegs = parseSegments(roundTripEdi);

  if (origSegs.length === 0 && roundSegs.length === 0) {
    return {
      score: 100,
      isLossless: true,
      totalOriginalSegments: 0,
      totalConvertedSegments: 0,
      matchingSegments: 0,
      totalOriginalElements: 0,
      matchingElements: 0,
      differences: [],
      summaryNote: 'Empty payload (100% neutral)',
    };
  }

  if (origSegs.length === 0 || roundSegs.length === 0) {
    return {
      score: 0,
      isLossless: false,
      totalOriginalSegments: origSegs.length,
      totalConvertedSegments: roundSegs.length,
      matchingSegments: 0,
      totalOriginalElements: 0,
      matchingElements: 0,
      differences: [
        {
          type: 'missing_segment',
          segmentTag: origSegs[0]?.tag || 'N/A',
          description: 'Document was not generated or source is empty.',
        },
      ],
      summaryNote: '0% round-trip conversion parity.',
    };
  }

  const differences: FidelityDifference[] = [];
  let totalOrigElements = 0;
  let matchingElements = 0;
  let matchingSegs = 0;

  const maxLen = Math.max(origSegs.length, roundSegs.length);

  for (let i = 0; i < maxLen; i++) {
    const oSeg = origSegs[i];
    const rSeg = roundSegs[i];

    if (!oSeg && rSeg) {
      differences.push({
        type: 'extra_segment',
        segmentTag: rSeg.tag,
        description: `Extra segment ${rSeg.tag} introduced at position #${i + 1}.`,
      });
      continue;
    }

    if (oSeg && !rSeg) {
      differences.push({
        type: 'missing_segment',
        segmentTag: oSeg.tag,
        description: `Segment ${oSeg.tag} missing at position #${i + 1}.`,
      });
      continue;
    }

    if (oSeg && rSeg) {
      totalOrigElements += oSeg.elements.length;

      if (oSeg.tag !== rSeg.tag) {
        differences.push({
          type: 'order_mismatch',
          segmentTag: oSeg.tag,
          originalValue: oSeg.tag,
          convertedValue: rSeg.tag,
          description: `Segment tag mismatch at #${i + 1}: expected ${oSeg.tag}, found ${rSeg.tag}.`,
        });
        continue;
      }

      let segMatches = true;
      const elemMax = Math.max(oSeg.elements.length, rSeg.elements.length);

      for (let e = 0; e < elemMax; e++) {
        const oVal = oSeg.elements[e] || '';
        const rVal = rSeg.elements[e] || '';

        // Ignore trailing whitespace differences
        if (oVal.trim() === rVal.trim()) {
          if (e < oSeg.elements.length) matchingElements++;
        } else {
          segMatches = false;
          differences.push({
            type: 'element_mismatch',
            segmentTag: oSeg.tag,
            position: `${oSeg.tag}${String(e + 1).padStart(2, '0')}`,
            originalValue: oVal,
            convertedValue: rVal,
            description: `Value variance in ${oSeg.tag}${String(e + 1).padStart(2, '0')}: '${oVal}' vs '${rVal}'.`,
          });
        }
      }

      if (segMatches) {
        matchingSegs++;
      }
    }
  }

  // Weight: 40% segment presence + 60% element accuracy
  const segScore = origSegs.length > 0 ? (matchingSegs / origSegs.length) * 40 : 40;
  const elemScore = totalOrigElements > 0 ? (matchingElements / totalOrigElements) * 60 : 60;
  const rawScore = Math.round(segScore + elemScore);
  const score = Math.max(0, Math.min(100, rawScore));
  const isLossless = differences.length === 0;

  const summaryNote = isLossless
    ? '100% Fidelity (0 data loss)'
    : `${differences.length} variance${differences.length === 1 ? '' : 's'} detected (${score}% fidelity)`;

  return {
    score,
    isLossless,
    totalOriginalSegments: origSegs.length,
    totalConvertedSegments: roundSegs.length,
    matchingSegments: matchingSegs,
    totalOriginalElements: totalOrigElements,
    matchingElements,
    differences: differences.slice(0, 20), // Cap at 20 for performant rendering
    summaryNote,
  };
}
