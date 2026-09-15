import { EdiFormatAdapter, ParseOptions, ParseResult, ValidationResult, ParsedEdiDocument } from './types';
import { DetectionHints, DetectionResult } from '../models/detection';
import { detectDelimitersAndMime } from '../parsing/delimiters';
import { splitIntoSegments, splitTransactions } from '../parsing/split';
import { validateEnvelope } from '../validation/envelope';
import { validateTransaction } from '../validation/transaction';
import { mapInboundTransactionToCanonical } from '../transformations/inboundMaps';
import { synthesizeOutboundEdi } from '../transformations/outboundMaps';
import { InboundEnvelope } from '../models/envelope';
import { CanonicalDocument } from '../models/canonical';

export const x12Adapter: EdiFormatAdapter = {
  id: 'x12-adapter',
  family: 'x12',
  formatFamily: 'x12',
  label: 'ANSI ASC X12 Standards Adapter',

  detect(input: string, hints?: DetectionHints): DetectionResult {
    const detection = detectDelimitersAndMime(input);
    const isX12 =
      detection.format === 'x12' ||
      hints?.partnerStandard === 'x12' ||
      input.includes('ISA*') ||
      input.includes('ST*');

    return {
      detected: isX12,
      detection: {
        ...detection,
        format: 'x12',
        adapterId: 'x12-adapter',
      },
    };
  },

  parse(input: string, options?: ParseOptions): ParseResult {
    const detection = detectDelimitersAndMime(input);
    const elemDelim = options?.forcedElementDelimiter || detection.elementDelimiter || '*';
    const segTerm = options?.forcedSegmentTerminator || detection.segmentTerminator || '~';
    const bodyText = detection.extractedBody || input;

    const segments = splitIntoSegments(bodyText, segTerm, elemDelim);
    const transactions = splitTransactions(segments, 'x12');
    const diagnostics = [...validateEnvelope(segments, 'x12')];

    // Envelope parsing
    const isa = segments.find((s) => s.tag === 'ISA');
    const gs = segments.find((s) => s.tag === 'GS');

    const envelope: InboundEnvelope = {
      standard: 'X12',
      version: isa?.elements[11]?.trim() || '004010',
      senderId: (isa?.elements[5] || 'SENDER').trim(),
      receiverId: (isa?.elements[7] || 'RECEIVER').trim(),
      interchangeControlNumber: (isa?.elements[12] || '000000850').trim(),
      groupControlNumber: gs?.elements[5]?.trim() || '85001',
      date: isa?.elements[8]?.trim() || new Date().toISOString().slice(2, 8),
      time: isa?.elements[9]?.trim() || '0830',
      isAs2: detection.isAs2Mime,
      as2Headers: detection.as2Headers,
      mic: detection.mic,
      rawHeaderSegment: isa?.raw,
      testIndicator: (isa?.elements[14]?.trim() as 'P' | 'T') || 'P',
    };

    transactions.forEach((tx) => {
      diagnostics.push(...validateTransaction(tx, 'x12'));
    });

    const parsedDoc: ParsedEdiDocument = {
      format: 'x12',
      version: envelope.version,
      envelope,
      segments,
      transactions,
      diagnostics,
      delimiters: {
        element: elemDelim,
        segment: segTerm,
        subElement: detection.componentDelimiter || '>',
      },
      isAs2Mime: detection.isAs2Mime,
      as2Headers: detection.as2Headers,
      mic: detection.mic,
    };

    const firstTx = parsedDoc.transactions[0] || {
      transactionType: '850',
      controlNumber: '0001',
      segments: parsedDoc.segments,
      rawText: parsedDoc.segments.map((s) => s.raw).join('~'),
      startIndex: 0,
      endIndex: parsedDoc.segments.length - 1,
    };

    const { canonical } = mapInboundTransactionToCanonical(firstTx, {
      format: 'X12',
      version: parsedDoc.envelope.version,
      icn: parsedDoc.envelope.interchangeControlNumber,
      gcn: parsedDoc.envelope.groupControlNumber || '85001',
      delimiters: parsedDoc.delimiters,
      isAs2Mime: parsedDoc.isAs2Mime,
      mic: parsedDoc.mic,
    });

    return {
      success: segments.length > 0,
      document: parsedDoc,
      canonical,
      transactions: parsedDoc.transactions,
      diagnostics,
    };
  },

  validate(document: ParsedEdiDocument): ValidationResult {
    const diagnostics = [
      ...validateEnvelope(document.segments, 'x12'),
      ...document.transactions.flatMap((tx) => validateTransaction(tx, 'x12')),
    ];
    return {
      valid: !diagnostics.some((d) => d.level === 'ERROR'),
      diagnostics,
    };
  },

  toCanonical(document: ParsedEdiDocument): CanonicalDocument {
    const tx = document.transactions[0] || {
      transactionType: '850',
      controlNumber: '0001',
      segments: document.segments,
      rawText: document.segments.map((s) => s.raw).join('~'),
      startIndex: 0,
      endIndex: document.segments.length - 1,
    };

    const { canonical } = mapInboundTransactionToCanonical(tx, {
      format: 'X12',
      version: document.envelope.version,
      icn: document.envelope.interchangeControlNumber,
      gcn: document.envelope.groupControlNumber || '85001',
      delimiters: document.delimiters,
      isAs2Mime: document.isAs2Mime,
      mic: document.mic,
    });

    return canonical;
  },

  fromCanonical(document: CanonicalDocument, options?: Record<string, unknown>): string {
    return synthesizeOutboundEdi(document, {
      standard: 'X12',
      ...options,
    });
  },

  synthesize(document: CanonicalDocument, options?: Record<string, unknown>): string {
    return synthesizeOutboundEdi(document, {
      standard: 'X12',
      ...options,
    });
  },
};
