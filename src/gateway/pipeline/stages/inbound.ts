import { PipelineContext, PipelineEvent, PipelineError } from '../../../edi-core/models/pipeline';
import { detectWithRegistry } from '../../../edi-core/adapters/registry';
import { MOCK_ROUTES } from '../../../edi-core/samples';
import { renderCanonicalToJson } from '../../../edi-core/renderers/jsonRenderer';
import { renderCanonicalToXml } from '../../../edi-core/renderers/xmlRenderer';
import { renderCanonicalToTxt, renderCanonicalToCsv } from '../../../edi-core/renderers/txtRenderer';
import { render997Acknowledgment } from '../../../edi-core/renderers/ack997Renderer';
import { maskPhiInCanonical } from '../../../edi-core/privacy/phiMasker';
import { generateInboundFilename } from '../../../edi-core/utils/filenames';
import { MockFile } from '../../../edi-core/models/envelope';

export const INBOUND_STAGES = [
  { id: 'receive', label: 'Receive', shortDesc: 'Ingest payload from B2B partner' },
  { id: 'detect', label: 'Detect Format', shortDesc: 'Delimiters, standard & AS2 envelope' },
  { id: 'decode', label: 'Decode Envelope', shortDesc: 'ISA/GS or UNB headers & control numbers' },
  { id: 'split', label: 'Split Transactions', shortDesc: 'ST/SE or UNH/UNT transaction boundaries' },
  { id: 'route', label: 'Route', shortDesc: 'Subscription topic & business workflow' },
  { id: 'canonical', label: 'Canonical Transform', shortDesc: 'Normalize to Enterprise Canonical Model' },
  { id: 'targetOutput', label: 'Target Output', shortDesc: 'JSON, XML, CSV & 997 generation' },
  { id: 'virtualFile', label: 'Virtual Files', shortDesc: 'In-memory artifacts & safe download dispatch' },
];

function createEvent(
  stageId: string,
  status: 'started' | 'succeeded' | 'warning' | 'failed',
  message: string,
  details?: Record<string, unknown>
): PipelineEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    stageId,
    status,
    timestamp: new Date().toISOString(),
    message,
    details,
  };
}

export function executeReceiveStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'receive' };
  const rawInput = next.input || '';

  if (!rawInput.trim()) {
    const error: PipelineError = {
      code: 'ERR_EMPTY_PAYLOAD',
      stageId: 'receive',
      message: 'No payload provided. Paste raw EDI/AS2 text or load a story preset.',
      recoverable: true,
      suggestedAction: 'Click a preset button (850, 837, 214, AS2, EDIFACT) or upload an EDI file.',
    };
    next.status = 'failed';
    next.errors = [...next.errors, error];
    next.events = [...next.events, createEvent('receive', 'failed', 'Inbound payload is empty', { error })];
    return next;
  }

  next.events = [
    ...next.events,
    createEvent('receive', 'succeeded', `Ingested inbound payload (${rawInput.length} bytes)`, {
      preview: rawInput.slice(0, 100),
    }),
  ];
  if (!next.completedStages.includes('receive')) {
    next.completedStages = [...next.completedStages, 'receive'];
  }
  return next;
}

export function executeDetectStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'detect' };
  const { adapter, detection } = detectWithRegistry(next.input);

  next.detection = detection;
  next.formatFamily = detection.format;
  next.parserId = adapter?.id;

  if (detection.format === 'unknown') {
    next.warnings = [...next.warnings, 'Standard EDI headers (ISA/UNB) not detected. Operating in raw recovery mode.'];
    next.events = [
      ...next.events,
      createEvent('detect', 'warning', `Format detection uncertain: ${detection.reason}`, { detection }),
    ];
  } else {
    next.events = [
      ...next.events,
      createEvent(
        'detect',
        'succeeded',
        `Detected ${detection.format.toUpperCase()} standard (${detection.reason}) with element delimiter '${detection.elementDelimiter}' and segment terminator '${detection.segmentTerminator}'`,
        { detection }
      ),
    ];
  }

  if (detection.isAs2Mime) {
    next.events = [
      ...next.events,
      createEvent(
        'detect',
        'succeeded',
        `Unwrapped AS2 MIME multipart envelope: MIC verified (${detection.mic})`,
        { as2Headers: detection.as2Headers }
      ),
    ];
  }

  if (!next.completedStages.includes('detect')) {
    next.completedStages = [...next.completedStages, 'detect'];
  }
  return next;
}

export function executeDecodeStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'decode' };
  const { adapter } = detectWithRegistry(next.input);

  if (!adapter) {
    // Attempt X12 fallback
    const { adapter: x12 } = detectWithRegistry('ISA*00*');
    if (!x12) {
      next.status = 'failed';
      next.errors = [
        ...next.errors,
        {
          code: 'ERR_NO_ADAPTER',
          stageId: 'decode',
          message: 'No compatible EDI format adapter found for decoding.',
          recoverable: true,
        },
      ];
      return next;
    }
  }

  const activeAdapter = adapter || detectWithRegistry('ISA*00*').adapter!;
  const parseRes = activeAdapter.parse(next.input, {
    forcedElementDelimiter: next.delimiterOverrides?.element,
    forcedSegmentTerminator: next.delimiterOverrides?.segment,
  });

  if (!parseRes.success || !parseRes.document) {
    next.status = 'failed';
    next.errors = [
      ...next.errors,
      {
        code: 'ERR_DECODE_FAILED',
        stageId: 'decode',
        message: parseRes.error || 'Failed to decode EDI segments into structural envelope.',
        recoverable: true,
      },
    ];
    return next;
  }

  next.segments = parseRes.document.segments;
  next.envelope = parseRes.document.envelope;
  next.diagnostics = parseRes.document.diagnostics;

  const errDiags = next.diagnostics.filter((d) => d.level === 'ERROR');
  const warnDiags = next.diagnostics.filter((d) => d.level === 'WARNING');

  warnDiags.forEach((w) => next.warnings.push(`[${w.stage}] ${w.message}`));

  if (errDiags.length > 0) {
    next.warnings.push(`Envelope validation errors detected (${errDiags.length} issues)`);
    next.events = [
      ...next.events,
      createEvent(
        'decode',
        'warning',
        `Decoded ${next.segments.length} segments with ${errDiags.length} envelope validation notices`,
        { envelope: next.envelope, errors: errDiags }
      ),
    ];
  } else {
    next.events = [
      ...next.events,
      createEvent(
        'decode',
        'succeeded',
        `Successfully decoded ${next.segments.length} segments. Sender: ${next.envelope.senderId}, Receiver: ${next.envelope.receiverId}, ICN: ${next.envelope.interchangeControlNumber}`,
        { envelope: next.envelope }
      ),
    ];
  }

  if (!next.completedStages.includes('decode')) {
    next.completedStages = [...next.completedStages, 'decode'];
  }
  return next;
}

export function executeSplitStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'split' };
  const { adapter } = detectWithRegistry(next.input);
  const activeAdapter = adapter || detectWithRegistry('ISA*00*').adapter!;

  const parseRes = activeAdapter.parse(next.input);
  if (parseRes.document && parseRes.document.transactions.length > 0) {
    next.transactions = parseRes.document.transactions;
  } else {
    next.transactions = [
      {
        transactionType: '850',
        controlNumber: '0001',
        segments: next.segments,
        rawText: next.input,
        startIndex: 0,
        endIndex: Math.max(0, next.segments.length - 1),
      },
    ];
  }

  next.events = [
    ...next.events,
    createEvent(
      'split',
      'succeeded',
      `Split interchange into ${next.transactions.length} functional transaction(s): ${next.transactions
        .map((t) => `${t.transactionType} (TCN: ${t.controlNumber})`)
        .join(', ')}`,
      { transactionsCount: next.transactions.length }
    ),
  ];

  if (!next.completedStages.includes('split')) {
    next.completedStages = [...next.completedStages, 'split'];
  }
  return next;
}

export function executeRouteStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'route' };
  const primaryTx = next.transactions[0];
  const txCode = primaryTx?.transactionType || '850';

  const matchedRoute =
    MOCK_ROUTES.find((r) => r.txCode === txCode) ||
    MOCK_ROUTES.find((r) => txCode.includes(r.txCode)) || {
      txCode,
      name: `Generic ${txCode} Business Route`,
      subscriptionLabel: `Generic-${txCode}-Sub`,
      targetDocType: 'StandardDocument',
      transformerId: `generic-${txCode}-transformer`,
    };

  next.route = {
    routeName: matchedRoute.name,
    subscriptionLabel: matchedRoute.subscriptionLabel,
    targetDocType: matchedRoute.targetDocType,
    transformerId: matchedRoute.transformerId,
  };

  next.events = [
    ...next.events,
    createEvent(
      'route',
      'succeeded',
      `Matched route '${matchedRoute.name}' → dispatched to Azure/Virtual subscription '${matchedRoute.subscriptionLabel}'`,
      { route: next.route }
    ),
  ];

  if (!next.completedStages.includes('route')) {
    next.completedStages = [...next.completedStages, 'route'];
  }
  return next;
}

export function executeCanonicalStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'canonical' };
  const { adapter } = detectWithRegistry(next.input);
  const activeAdapter = adapter || detectWithRegistry('ISA*00*').adapter!;

  const parseRes = activeAdapter.parse(next.input);
  if (parseRes.document) {
    const canonical = activeAdapter.toCanonical ? activeAdapter.toCanonical(parseRes.document) : null;
    if (canonical) {
      next.canonical = next.isPhiMaskEnabled ? maskPhiInCanonical(canonical) : canonical;
      next.lineage = canonical.mappings || [];
    }
  }

  if (!next.canonical) {
    next.status = 'failed';
    next.errors = [
      ...next.errors,
      {
        code: 'ERR_CANONICAL_TRANSFORMATION',
        stageId: 'canonical',
        message: 'Unable to transform parsed transaction set into canonical document model.',
        recoverable: true,
      },
    ];
    return next;
  }

  next.events = [
    ...next.events,
    createEvent(
      'canonical',
      'succeeded',
      `Transformed ${next.canonical.documentType} into Enterprise Canonical Model: Order #${next.canonical.header.orderNumber}, ${next.canonical.lineItems.length} lines, total ${next.canonical.header.currency} ${next.canonical.summary.totalAmount}`,
      { summary: next.canonical.summary, parties: next.canonical.parties.length }
    ),
  ];

  if (!next.completedStages.includes('canonical')) {
    next.completedStages = [...next.completedStages, 'canonical'];
  }
  return next;
}

export function executeTargetOutputStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'targetOutput' };
  if (!next.canonical) {
    return next;
  }

  const format = next.outputFormat || 'json';
  let content = '';
  let mimeType = 'application/json';
  let ext: 'json' | 'xml' | 'txt' | 'csv' = 'json';

  if (format === 'xml') {
    content = renderCanonicalToXml(next.canonical);
    mimeType = 'application/xml';
    ext = 'xml';
  } else if (format === 'csv') {
    content = renderCanonicalToCsv(next.canonical);
    mimeType = 'text/csv';
    ext = 'csv';
  } else if (format === 'txt') {
    content = renderCanonicalToTxt(next.canonical);
    mimeType = 'text/plain';
    ext = 'txt';
  } else if (format === 'ack997') {
    content = render997Acknowledgment(next.canonical);
    mimeType = 'application/edi-x12';
    ext = 'txt';
  } else {
    content = renderCanonicalToJson(next.canonical);
    mimeType = 'application/json';
    ext = 'json';
  }

  const filename = generateInboundFilename(
    'ORD',
    next.envelope?.senderId || 'PARTNER',
    next.canonical.header.orderNumber || 'DOC',
    ext
  );

  next.targetOutput = {
    format: ext,
    content,
    filename,
    mimeType,
    status: 'ready',
  };

  next.events = [
    ...next.events,
    createEvent(
      'targetOutput',
      'succeeded',
      `Rendered target output in ${format.toUpperCase()} format (${content.length} chars)`,
      { filename, format }
    ),
  ];

  if (!next.completedStages.includes('targetOutput')) {
    next.completedStages = [...next.completedStages, 'targetOutput'];
  }
  return next;
}

export function executeVirtualFileStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'virtualFile' };
  if (!next.canonical) return next;

  const sender = next.envelope?.senderId || 'PARTNER';
  const orderId = next.canonical.header.orderNumber || 'DOC';
  const runId = next.runId;

  const files: MockFile[] = [];

  // 1. JSON Canonical
  const jsonName = generateInboundFilename('ORD', sender, orderId, 'json');
  files.push({
    path: `/virtual/inbound/${sender}/${jsonName}`,
    name: jsonName,
    content: renderCanonicalToJson(next.canonical),
    format: 'json',
    contentType: 'application/json',
    sourceRunId: runId,
    status: 'created',
    createdAt: new Date().toISOString(),
    stageSource: 'inbound-canonical-json',
  });

  // 2. XML Enterprise Document
  const xmlName = generateInboundFilename('ORD', sender, orderId, 'xml');
  files.push({
    path: `/virtual/inbound/${sender}/${xmlName}`,
    name: xmlName,
    content: renderCanonicalToXml(next.canonical),
    format: 'xml',
    contentType: 'application/xml',
    sourceRunId: runId,
    status: 'created',
    createdAt: new Date().toISOString(),
    stageSource: 'inbound-enterprise-xml',
  });

  // 3. Fixed-width text report
  const txtName = generateInboundFilename('RPT', sender, orderId, 'txt');
  files.push({
    path: `/virtual/inbound/${sender}/${txtName}`,
    name: txtName,
    content: renderCanonicalToTxt(next.canonical),
    format: 'txt',
    contentType: 'text/plain',
    sourceRunId: runId,
    status: 'created',
    createdAt: new Date().toISOString(),
    stageSource: 'inbound-dispatch-report',
  });

  // 4. ANSI 997 Functional Acknowledgment
  const ackName = `ACK_997_${sender}_${orderId}.edi`;
  files.push({
    path: `/virtual/outbound/ack/${ackName}`,
    name: ackName,
    content: render997Acknowledgment(next.canonical),
    format: 'edi',
    contentType: 'application/edi-x12',
    sourceRunId: runId,
    status: 'created',
    createdAt: new Date().toISOString(),
    stageSource: 'inbound-997-ack',
  });

  next.virtualFiles = files;
  next.status = 'succeeded';

  next.events = [
    ...next.events,
    createEvent(
      'virtualFile',
      'succeeded',
      `Prepared ${files.length} virtual file artifacts ready for download and ERP consumption`,
      { files: files.map((f) => f.name) }
    ),
  ];

  if (!next.completedStages.includes('virtualFile')) {
    next.completedStages = [...next.completedStages, 'virtualFile'];
  }
  return next;
}
