import { FormatDetection, EdiFormatFamily } from '../models/detection';

export function detectDelimitersAndMime(rawText: string): FormatDetection {
  let isAs2Mime = false;
  let mic: string | undefined;
  let as2Headers: Record<string, string> = {};
  let cleanText = (rawText || '').trim();

  // Check for AS2 MIME envelope
  if (
    cleanText.includes('AS2-To:') ||
    cleanText.includes('Content-Type: multipart/') ||
    cleanText.includes('AS2-Version:') ||
    cleanText.includes('Disposition-Notification-To:')
  ) {
    isAs2Mime = true;
    mic = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0=, sha-256';

    // Parse header lines
    const lines = cleanText.split(/\r?\n/);
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && !line.startsWith('---') && !line.startsWith('ISA') && !line.startsWith('UNB')) {
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        as2Headers[key] = val;
      }
    }

    const boundaryMatch = cleanText.match(/boundary="?([^"\r\n]+)"?/i);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = cleanText.split(`--${boundary}`);
      for (const p of parts) {
        if (
          p.includes('application/edi-x12') ||
          p.includes('application/edifact') ||
          p.includes('ISA*') ||
          p.includes('UNB+') ||
          p.includes('UNA')
        ) {
          const bodyIdx =
            p.indexOf('\n\n') !== -1
              ? p.indexOf('\n\n') + 2
              : p.indexOf('\r\n\r\n') !== -1
              ? p.indexOf('\r\n\r\n') + 4
              : -1;
          if (bodyIdx > 0) {
            cleanText = p.slice(bodyIdx).trim();
            break;
          }
        }
      }
    }
  }

  let format: EdiFormatFamily = 'x12';
  let elemDelim = '*';
  let segTerm = '~';
  let compDelim = '>';
  let releaseChar: string | undefined;
  let confidence: 'high' | 'medium' | 'low' = 'high';
  let reason = 'Standard EDI format detected';

  if (cleanText.startsWith('UNA') && cleanText.length >= 9) {
    format = 'edifact';
    compDelim = cleanText[3] || ':';
    elemDelim = cleanText[4] || '+';
    releaseChar = cleanText[6] || '?';
    segTerm = cleanText[8] || "'";
    reason = 'EDIFACT UNA Service String Advice detected';
  } else if (cleanText.startsWith('UNB') || cleanText.includes('UNH+')) {
    format = 'edifact';
    elemDelim = '+';
    segTerm = "'";
    compDelim = ':';
    releaseChar = '?';
    reason = 'EDIFACT UNB Interchange Header detected';
  } else if (cleanText.startsWith('ISA') && cleanText.length >= 100) {
    format = 'x12';
    elemDelim = cleanText[3] || '*';
    const tildeIdx = cleanText.indexOf('~');
    if (tildeIdx >= 100 && tildeIdx <= 120) {
      segTerm = '~';
      compDelim = cleanText[tildeIdx - 1] || '>';
    } else if (cleanText[105]) {
      compDelim = cleanText[104] || '>';
      segTerm = cleanText[105] || '~';
    }
    reason = 'X12 ISA Interchange Control Header detected';
  } else if (cleanText.startsWith('{') || cleanText.startsWith('[')) {
    format = 'json';
    elemDelim = '';
    segTerm = '';
    compDelim = '';
    reason = 'JSON payload detected';
  } else if (cleanText.startsWith('<')) {
    format = 'xml';
    elemDelim = '';
    segTerm = '';
    compDelim = '';
    reason = 'XML document detected';
  } else if (cleanText.includes('~') || cleanText.includes('*')) {
    format = 'x12';
    elemDelim = '*';
    segTerm = '~';
    confidence = 'medium';
    reason = 'X12 delimiters identified in body';
  } else if (cleanText.includes("'") && cleanText.includes('+')) {
    format = 'edifact';
    elemDelim = '+';
    segTerm = "'";
    compDelim = ':';
    confidence = 'medium';
    reason = 'EDIFACT delimiters identified in body';
  } else {
    format = 'unknown';
    elemDelim = '*';
    segTerm = '\n';
    compDelim = ':';
    confidence = 'low';
    reason = 'No recognized EDI or structured standard header';
  }

  return {
    format,
    confidence,
    adapterId: format === 'x12' ? 'x12-adapter' : format === 'edifact' ? 'edifact-adapter' : undefined,
    elementDelimiter: elemDelim,
    segmentTerminator: segTerm,
    componentDelimiter: compDelim,
    subElementDelimiter: compDelim,
    releaseCharacter: releaseChar,
    reason,
    capability: format === 'x12' || format === 'edifact' ? 'full' : format === 'json' || format === 'xml' ? 'parse' : 'raw',
    isAs2Mime,
    as2Headers,
    mic,
    extractedBody: cleanText,
    cleanEdi: cleanText,
  };
}

export const detectFormatAndDelimiters = detectDelimitersAndMime;
