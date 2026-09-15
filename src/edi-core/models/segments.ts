export interface ParsedSegment {
  tag: string;
  elements: string[];
  raw: string;
  lineNumber: number;
  position?: number;
}

export interface ParsedTransaction {
  transactionType: string;
  type?: string;
  controlNumber: string;
  implementationGuide?: string;
  segments: ParsedSegment[];
  rawText: string;
  startIndex: number;
  endIndex: number;
  functionalGroupCode?: string;
}
