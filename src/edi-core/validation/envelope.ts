import { DiagnosticMessage } from '../models/canonical';
import { ParsedSegment } from '../models/segments';

export function validateEnvelope(
  segments: ParsedSegment[],
  standard: 'x12' | 'edifact' | string
): DiagnosticMessage[] {
  const diagnostics: DiagnosticMessage[] = [];

  if (standard === 'x12') {
    const isa = segments.find((s) => s.tag === 'ISA');
    const iea = segments.find((s) => s.tag === 'IEA');
    const gs = segments.find((s) => s.tag === 'GS');
    const ge = segments.find((s) => s.tag === 'GE');

    if (isa && iea) {
      const isa13 = (isa.elements[12] || '').trim();
      const iea02 = (iea.elements[1] || '').trim();
      if (isa13 !== iea02) {
        diagnostics.push({
          level: 'ERROR',
          stage: 'ENVELOPE',
          code: 'ERR_ISA_IEA_MISMATCH',
          segment: 'IEA',
          element: 'IEA02',
          message: `Interchange Control Number mismatch: ISA13 (${isa13}) != IEA02 (${iea02})`,
        });
      }
    }

    if (gs && ge) {
      const gs06 = (gs.elements[5] || '').trim();
      const ge02 = (ge.elements[1] || '').trim();
      if (gs06 !== ge02) {
        diagnostics.push({
          level: 'ERROR',
          stage: 'ENVELOPE',
          code: 'ERR_GS_GE_MISMATCH',
          segment: 'GE',
          element: 'GE02',
          message: `Group Control Number mismatch: GS06 (${gs06}) != GE02 (${ge02})`,
        });
      }
    }
  } else if (standard === 'edifact') {
    const unb = segments.find((s) => s.tag === 'UNB');
    const unz = segments.find((s) => s.tag === 'UNZ');

    if (unb && unz) {
      const unb05 = (unb.elements[4] || '').trim();
      const unz02 = (unz.elements[1] || '').trim();
      if (unb05 && unz02 && unb05 !== unz02) {
        diagnostics.push({
          level: 'ERROR',
          stage: 'ENVELOPE',
          code: 'ERR_UNB_UNZ_MISMATCH',
          segment: 'UNZ',
          element: 'UNZ02',
          message: `Interchange Reference mismatch: UNB05 (${unb05}) != UNZ02 (${unz02})`,
        });
      }
    }
  }

  return diagnostics;
}
