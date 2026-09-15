import { EdiFormatFamily, FormatDetection, DetectionHints, DetectionResult } from '../models/detection';
import { ParsedSegment, ParsedTransaction } from '../models/segments';
import { InboundEnvelope } from '../models/envelope';
import { CanonicalDocument, DiagnosticMessage } from '../models/canonical';

export interface ParseOptions {
  forcedSegmentTerminator?: string;
  forcedElementDelimiter?: string;
  forcedComponentDelimiter?: string;
  releaseChar?: string;
}

export interface ParsedEdiDocument {
  format: EdiFormatFamily;
  version: string;
  envelope: InboundEnvelope;
  segments: ParsedSegment[];
  transactions: ParsedTransaction[];
  diagnostics: DiagnosticMessage[];
  delimiters: {
    element: string;
    segment: string;
    subElement?: string;
    release?: string;
  };
  isAs2Mime?: boolean;
  as2Headers?: Record<string, string>;
  mic?: string;
}

export interface ParseResult {
  success: boolean;
  document?: ParsedEdiDocument;
  canonical?: CanonicalDocument;
  transactions?: ParsedTransaction[];
  error?: string;
  diagnostics: DiagnosticMessage[];
}

export interface ValidationResult {
  valid: boolean;
  diagnostics: DiagnosticMessage[];
}

export interface EdiFormatAdapter {
  id: string;
  family: EdiFormatFamily;
  formatFamily?: EdiFormatFamily;
  label: string;
  detect(input: string, hints?: DetectionHints): DetectionResult;
  parse(input: string, options?: ParseOptions): ParseResult;
  validate?(document: ParsedEdiDocument): ValidationResult;
  toCanonical?(document: ParsedEdiDocument): CanonicalDocument;
  fromCanonical?(document: CanonicalDocument, options?: Record<string, unknown>): string;
  synthesize?(document: CanonicalDocument, options?: Record<string, unknown>): string;
}
