export interface InboundEnvelope {
  standard: 'X12' | 'EDIFACT' | 'AS2' | 'OTHER';
  version: string;
  senderId: string;
  receiverId: string;
  interchangeControlNumber: string;
  groupControlNumber?: string;
  date: string;
  time?: string;
  isAs2?: boolean;
  as2Headers?: Record<string, string>;
  mic?: string;
  rawHeaderSegment?: string;
  rawTrailerSegment?: string;
  testIndicator?: 'P' | 'T';
}

export interface As2Package {
  messageId: string;
  headers: Record<string, string>;
  mimeBoundary: string;
  payload: string;
  signaturePreview: string;
  rawEml: string;
  as2From: string;
  as2To: string;
  createdAt: string;
}

export interface MockFile {
  path: string;
  name: string;
  content: string;
  format: 'json' | 'xml' | 'txt' | 'csv' | 'edi' | 'as2' | 'eml';
  contentType: string;
  sourceRunId: string;
  status: 'created' | 'downloaded';
  sizeBytes?: number;
  createdAt: string;
  stageSource: string;
}

export interface MockPartner {
  id: string;
  name: string;
  standard: 'X12' | 'EDIFACT';
  isaSenderId: string;
  isaReceiverId: string;
  as2Id: string;
  defaultAck: boolean;
  notes?: string;
}

export interface TargetOutput {
  format: 'json' | 'xml' | 'txt' | 'csv';
  content: string;
  filename: string;
  mimeType: string;
  status: 'ready' | 'error';
}
