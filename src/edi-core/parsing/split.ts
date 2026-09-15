import { ParsedSegment, ParsedTransaction } from '../models/segments';

export function splitIntoSegments(
  text: string,
  segTerminator: string,
  elemDelimiter: string,
  releaseChar?: string
): ParsedSegment[] {
  if (!text) return [];

  // Handle release char escaping if present (e.g. ? in EDIFACT)
  const rawSegments: string[] = [];
  if (releaseChar && text.includes(releaseChar)) {
    let current = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === releaseChar && i + 1 < text.length) {
        current += text[i + 1];
        i++; // skip escaped char
      } else if (char === segTerminator) {
        if (current.trim()) rawSegments.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) rawSegments.push(current.trim());
  } else {
    const rawList = text.split(segTerminator);
    for (const r of rawList) {
      const trimmed = r.trim();
      if (trimmed.length > 0) {
        rawSegments.push(trimmed);
      }
    }
  }

  return rawSegments.map((raw, idx) => {
    // Split elements
    let elements: string[] = [];
    if (releaseChar && raw.includes(releaseChar)) {
      let current = '';
      for (let i = 0; i < raw.length; i++) {
        const char = raw[i];
        if (char === releaseChar && i + 1 < raw.length) {
          current += raw[i + 1];
          i++;
        } else if (char === elemDelimiter) {
          elements.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      elements.push(current);
    } else {
      elements = raw.split(elemDelimiter);
    }

    const tag = (elements[0] || '').trim();
    const elemValues = elements.slice(1);

    return {
      tag,
      elements: elemValues,
      raw,
      lineNumber: idx + 1,
      position: idx,
    };
  });
}

export const splitSegments = splitIntoSegments;

export function splitTransactions(
  segments: ParsedSegment[],
  format: 'x12' | 'edifact' | string
): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  if (format === 'x12') {
    let currentTx: {
      txType: string;
      controlNumber: string;
      segments: ParsedSegment[];
      startIndex: number;
    } | null = null;

    segments.forEach((seg, idx) => {
      if (seg.tag === 'ST') {
        currentTx = {
          txType: seg.elements[0] || '850',
          controlNumber: seg.elements[1] || '0001',
          segments: [seg],
          startIndex: idx,
        };
      } else if (seg.tag === 'SE') {
        if (currentTx) {
          currentTx.segments.push(seg);
          transactions.push({
            transactionType: currentTx.txType,
            type: currentTx.txType,
            controlNumber: currentTx.controlNumber,
            implementationGuide: currentTx.segments[0]?.elements[2],
            segments: currentTx.segments,
            rawText: currentTx.segments.map((s) => s.raw).join('~') + '~',
            startIndex: currentTx.startIndex,
            endIndex: idx,
          });
          currentTx = null;
        }
      } else if (currentTx) {
        currentTx.segments.push(seg);
      }
    });
  } else if (format === 'edifact') {
    let currentTx: {
      txType: string;
      controlNumber: string;
      segments: ParsedSegment[];
      startIndex: number;
    } | null = null;

    segments.forEach((seg, idx) => {
      if (seg.tag === 'UNH') {
        const msgTypeParts = (seg.elements[1] || '').split(':');
        currentTx = {
          txType: msgTypeParts[0] || 'ORDERS',
          controlNumber: seg.elements[0] || '0001',
          segments: [seg],
          startIndex: idx,
        };
      } else if (seg.tag === 'UNT') {
        if (currentTx) {
          currentTx.segments.push(seg);
          transactions.push({
            transactionType: currentTx.txType,
            type: currentTx.txType,
            controlNumber: currentTx.controlNumber,
            segments: currentTx.segments,
            rawText: currentTx.segments.map((s) => s.raw).join("'") + "'",
            startIndex: currentTx.startIndex,
            endIndex: idx,
          });
          currentTx = null;
        }
      } else if (currentTx) {
        currentTx.segments.push(seg);
      }
    });
  }

  // Fallback if no explicit ST/SE or UNH/UNT delimiters were found (e.g. naked transaction)
  if (transactions.length === 0 && segments.length > 0) {
    const isStPresent = segments.some((s) => s.tag === 'ST' || s.tag === 'UNH');
    if (!isStPresent) {
      transactions.push({
        transactionType: 'UNKNOWN',
        controlNumber: '0001',
        segments,
        rawText: segments.map((s) => s.raw).join('\n'),
        startIndex: 0,
        endIndex: segments.length - 1,
      });
    }
  }

  return transactions;
}
