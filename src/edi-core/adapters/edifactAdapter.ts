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

export const edifactAdapter: EdiFormatAdapter = {
  id: 'edifact-adapter',
  family: 'edifact',
  formatFamily: 'edifact',
  label: 'UN/EDIFACT Standards Adapter',

  detect(input: string, hints?: DetectionHints): DetectionResult {
    const detection = detectDelimitersAndMime(input);
    const isEdifact =
      detection.format === 'edifact' ||
      hints?.partnerStandard === 'edifact' ||
      input.startsWith('UNA') ||
      input.startsWith('UNB') ||
      input.includes('UNH+');

    return {
      detected: isEdifact,
      detection: {
        ...detection,
        format: 'edifact',
        adapterId: 'edifact-adapter',
      },
    };
  },

  parse(input: string, options?: ParseOptions): ParseResult {
    const detection = detectDelimitersAndMime(input);
    const elemDelim = options?.forcedElementDelimiter || detection.elementDelimiter || '+';
    const segTerm = options?.forcedSegmentTerminator || detection.segmentTerminator || "'";
    const releaseChar = options?.releaseChar || detection.releaseCharacter || '?';
    const bodyText = detection.extractedBody || input;

    const segments = splitIntoSegments(bodyText, segTerm, elemDelim, releaseChar);
    const transactions = splitTransactions(segments, 'edifact');
    const diagnostics = [...validateEnvelope(segments, 'edifact')];

    // Envelope parsing
    const unb = segments.find((s) => s.tag === 'UNB');
    const senderParts = (unb?.elements[1] || 'SENDER').split(':');
    const receiverParts = (unb?.elements[2] || 'RECEIVER').split(':');
    const dateParts = (unb?.elements[3] || '').split(':');

    const envelope: InboundEnvelope = {
      standard: 'EDIFACT',
      version: unb?.elements[0] || 'UNOA:2',
      senderId: senderParts[0] || 'SENDER',
      receiverId: receiverParts[0] || 'RECEIVER',
      interchangeControlNumber: unb?.elements[4] || 'IREF0001',
      groupControlNumber: 'GREF0001',
      date: dateParts[0] || new Date().toISOString().slice(2, 8),
      time: dateParts[1] || '0830',
      isAs2: detection.isAs2Mime,
      as2Headers: detection.as2Headers,
      mic: detection.mic,
      rawHeaderSegment: unb?.raw,
      testIndicator: unb?.elements[10] === '1' ? 'T' : 'P',
    };

    transactions.forEach((tx) => {
      diagnostics.push(...validateTransaction(tx, 'edifact'));
    });

    const parsedDoc: ParsedEdiDocument = {
      format: 'edifact',
      version: envelope.version,
      envelope,
      segments,
      transactions,
      diagnostics,
      delimiters: {
        element: elemDelim,
        segment: segTerm,
        subElement: detection.componentDelimiter || ':',
        release: releaseChar,
      },
      isAs2Mime: detection.isAs2Mime,
      as2Headers: detection.as2Headers,
      mic: detection.mic,
    };

    const firstTx = parsedDoc.transactions[0] || {
      transactionType: 'ORDERS',
      controlNumber: '0001',
      segments: parsedDoc.segments,
      rawText: parsedDoc.segments.map((s) => s.raw).join("'"),
      startIndex: 0,
      endIndex: parsedDoc.segments.length - 1,
    };

    const { canonical } = mapInboundTransactionToCanonical(firstTx, {
      format: 'EDIFACT',
      version: parsedDoc.envelope.version,
      icn: parsedDoc.envelope.interchangeControlNumber,
      gcn: 'GREF0001',
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
      ...validateEnvelope(document.segments, 'edifact'),
      ...document.transactions.flatMap((tx) => validateTransaction(tx, 'edifact')),
    ];
    return {
      valid: !diagnostics.some((d) => d.level === 'ERROR'),
      diagnostics,
    };
  },

  toCanonical(document: ParsedEdiDocument): CanonicalDocument {
    const tx = document.transactions[0] || {
      transactionType: 'ORDERS',
      controlNumber: '0001',
      segments: document.segments,
      rawText: document.segments.map((s) => s.raw).join("'"),
      startIndex: 0,
      endIndex: document.segments.length - 1,
    };

    const { canonical } = mapInboundTransactionToCanonical(tx, {
      format: 'EDIFACT',
      version: document.envelope.version,
      icn: document.envelope.interchangeControlNumber,
      gcn: 'GREF0001',
      delimiters: document.delimiters,
      isAs2Mime: document.isAs2Mime,
      mic: document.mic,
    });

    return canonical;
  },

  fromCanonical(document: CanonicalDocument, options?: Record<string, unknown>): string {
    return synthesizeOutboundEdi(document, {
      standard: 'EDIFACT',
      ...options,
    });
  },

  synthesize(document: CanonicalDocument, options?: Record<string, unknown>): string {
    return synthesizeOutboundEdi(document, {
      standard: 'EDIFACT',
      ...options,
    });
  },
};
