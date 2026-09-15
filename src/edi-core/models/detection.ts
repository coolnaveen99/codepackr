export type EdiFormatFamily =
  | 'x12'
  | 'edifact'
  | 'eancom'
  | 'tradacoms'
  | 'vda'
  | 'odette'
  | 'ucs'
  | 'xml-edi'
  | 'delimited-edi'
  | 'json'
  | 'xml'
  | 'unknown';

export type DetectionCapability = 'full' | 'parse' | 'envelope' | 'raw' | 'unsupported';

export interface FormatDetection {
  format: EdiFormatFamily;
  confidence: 'high' | 'medium' | 'low';
  adapterId?: string;
  documentType?: string;
  messageType?: string;
  standardVersion?: string;
  elementDelimiter: string;
  segmentTerminator: string;
  componentDelimiter: string;
  subElementDelimiter?: string;
  releaseCharacter?: string;
  reason: string;
  capability: DetectionCapability;
  isAs2Mime?: boolean;
  as2Headers?: Record<string, string>;
  mic?: string;
  extractedBody?: string;
  cleanEdi?: string;
}

export interface DetectionHints {
  filename?: string;
  partnerStandard?: 'x12' | 'edifact';
  forcedDelimiter?: string;
}

export interface DetectionResult {
  detected: boolean;
  detection: FormatDetection;
}
