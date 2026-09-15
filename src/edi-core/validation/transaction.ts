import { DiagnosticMessage } from '../models/canonical';
import { ParsedTransaction } from '../models/segments';

export function validateTransaction(
  tx: ParsedTransaction,
  standard: 'x12' | 'edifact' | string
): DiagnosticMessage[] {
  const diagnostics: DiagnosticMessage[] = [];

  if (standard === 'x12') {
    const st = tx.segments.find((s) => s.tag === 'ST');
    const se = tx.segments.find((s) => s.tag === 'SE');

    if (st && se) {
      const st02 = (st.elements[1] || '').trim();
      const se02 = (se.elements[1] || '').trim();
      if (st02 !== se02) {
        diagnostics.push({
          level: 'ERROR',
          stage: 'TRANSACTION',
          code: 'ERR_ST_SE_MISMATCH',
          segment: 'SE',
          element: 'SE02',
          message: `Transaction Set Control Number mismatch: ST02 (${st02}) != SE02 (${se02})`,
        });
      }

      const reportedCount = parseInt(se.elements[0] || '0', 10);
      const actualCount = tx.segments.length;
      if (reportedCount > 0 && reportedCount !== actualCount) {
        diagnostics.push({
          level: 'WARNING',
          stage: 'TRANSACTION',
          code: 'WARN_SE_COUNT_MISMATCH',
          segment: 'SE',
          element: 'SE01',
          message: `Segment count reported in SE01 (${reportedCount}) differs from actual segment count (${actualCount})`,
        });
      }
    }
  } else if (standard === 'edifact') {
    const unh = tx.segments.find((s) => s.tag === 'UNH');
    const unt = tx.segments.find((s) => s.tag === 'UNT');

    if (unh && unt) {
      const unh01 = (unh.elements[0] || '').trim();
      const unt02 = (unt.elements[1] || '').trim();
      if (unh01 && unt02 && unh01 !== unt02) {
        diagnostics.push({
          level: 'ERROR',
          stage: 'TRANSACTION',
          code: 'ERR_UNH_UNT_MISMATCH',
          segment: 'UNT',
          element: 'UNT02',
          message: `Message Reference Number mismatch: UNH01 (${unh01}) != UNT02 (${unt02})`,
        });
      }

      const reportedCount = parseInt(unt.elements[0] || '0', 10);
      const actualCount = tx.segments.length;
      if (reportedCount > 0 && reportedCount !== actualCount) {
        diagnostics.push({
          level: 'WARNING',
          stage: 'TRANSACTION',
          code: 'WARN_UNT_COUNT_MISMATCH',
          segment: 'UNT',
          element: 'UNT01',
          message: `Message segment count reported in UNT01 (${reportedCount}) differs from actual count (${actualCount})`,
        });
      }
    }
  }

  return diagnostics;
}
