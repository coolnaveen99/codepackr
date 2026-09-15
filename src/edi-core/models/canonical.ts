export interface DiagnosticMessage {
  level: 'INFO' | 'WARNING' | 'ERROR';
  stage: string;
  code?: string;
  segment?: string;
  element?: string;
  message: string;
}

export interface CanonicalLineItem {
  lineNumber: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  partNumber: string;
  upc?: string;
  description: string;
  extendedAmount?: number;
  specifications?: Record<string, string>;
}

export interface CanonicalParty {
  role: string;
  name: string;
  duns?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface SourceTrace {
  segmentTag: string;
  segmentIndex: number;
  elementIndex?: number;
  rawElementValue?: string;
  compositeSubIndex?: number;
}

export interface FieldMapping {
  outputField: string;
  sourceSegment: string;
  sourceElement: string;
  sourceValue: string;
  mappingRule: string;
  confidence?: 'exact' | 'inferred' | 'default';
  loopPath?: string;
}

export interface CanonicalDocument {
  transactionType: string;
  documentType: string;
  controlNumbers: {
    interchange: string;
    group: string;
    transaction: string;
  };
  header: {
    orderNumber: string;
    orderDate: string;
    currency: string;
    statusOrType?: string;
    referenceNumber?: string;
    department?: string;
    [key: string]: unknown;
  };
  parties: CanonicalParty[];
  lineItems: CanonicalLineItem[];
  summary: {
    totalQuantity: number;
    totalAmount: number;
    lineCount: number;
  };
  rawMeta: {
    originalFormat: string;
    version: string;
    delimiters: {
      element: string;
      segment: string;
      subElement?: string;
    };
    receivedAt: string;
    isAs2Mime?: boolean;
    mic?: string;
  };
  mappings?: FieldMapping[];
  sourceTraces?: Record<string, SourceTrace>;
}
