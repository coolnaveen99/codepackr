export type PipelineDirection = 'inbound' | 'outbound';

export type PipelineStatus =
  | 'idle'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'dead-lettered';

export type PipelineMode = 'guided' | 'full' | 'expert';

export type PipelineEventStatus = 'started' | 'succeeded' | 'warning' | 'failed' | 'retried';

export interface PipelineEvent {
  id: string;
  stageId: string;
  status: PipelineEventStatus;
  timestamp: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PipelineError {
  code: string;
  stageId: string;
  message: string;
  recoverable: boolean;
  source?: string;
  suggestedAction?: string;
}

export interface StageDefinition {
  id: string;
  label: string;
  shortDesc: string;
  direction: PipelineDirection;
  order: number;
}

export interface PipelineContext {
  runId: string;
  direction: PipelineDirection;
  mode: PipelineMode;
  status: PipelineStatus;
  currentStage: string;
  completedStages: string[];
  input: string;
  rawInputSanitized?: string;

  // Detection & Envelope
  formatFamily?: import('./detection').EdiFormatFamily;
  detection?: import('./detection').FormatDetection;
  parserId?: string;
  rendererId?: string;
  envelope?: import('./envelope').InboundEnvelope;

  // Segments & Transactions
  segments: import('./segments').ParsedSegment[];
  transactions: import('./segments').ParsedTransaction[];

  // Transformation
  route?: {
    routeName: string;
    subscriptionLabel: string;
    targetDocType: string;
    transformerId: string;
  };
  canonical?: import('./canonical').CanonicalDocument;
  targetOutput?: import('./envelope').TargetOutput;

  // Outbound artifacts
  ediOutput?: string;
  x12Output?: string;
  synthesizedEdi?: string;
  as2Output?: import('./envelope').As2Package;
  as2Package?: import('./envelope').As2Package;
  outboundOptions?: {
    standard?: 'X12' | 'EDIFACT';
    transactionType?: string;
    senderId?: string;
    receiverId?: string;
  };

  // Virtual files & audit
  stages: { id: string; label: string; shortDesc: string }[];
  virtualFiles: import('./envelope').MockFile[];
  events: PipelineEvent[];
  warnings: string[];
  errors: PipelineError[];

  // Diagnostics & lineage
  diagnostics: import('./canonical').DiagnosticMessage[];
  lineage: import('./canonical').FieldMapping[];

  // Expert overrides
  partnerId?: string;
  outputFormat?: 'json' | 'xml' | 'txt' | 'csv' | 'ack997';
  controlNumberOverrides?: {
    interchange?: string;
    group?: string;
    transaction?: string;
  };
  delimiterOverrides?: {
    element?: string;
    segment?: string;
    subElement?: string;
    component?: string;
  };

  // Privacy
  isPhiMaskEnabled?: boolean;
}

export interface StageResult<T = unknown> {
  success: boolean;
  data?: T;
  events?: Omit<PipelineEvent, 'id' | 'timestamp'>[];
  warnings?: string[];
  error?: PipelineError;
}
