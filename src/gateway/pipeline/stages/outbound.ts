import { PipelineContext, PipelineEvent, PipelineError } from '../../../edi-core/models/pipeline';
import { CanonicalDocument } from '../../../edi-core/models/canonical';
import { synthesizeOutboundEdi } from '../../../edi-core/transformations/outboundMaps';
import { packageAs2Mime } from '../../../edi-core/as2/package';
import { generateOutboundFilename } from '../../../edi-core/utils/filenames';
import { MockFile } from '../../../edi-core/models/envelope';

export const OUTBOUND_STAGES = [
  { id: 'outboundSource', label: 'ERP Source', shortDesc: 'Internal ERP / Canonical JSON Payload' },
  { id: 'outboundCanonical', label: 'Canonical Normalize', shortDesc: 'Validate standard business object' },
  { id: 'outboundEdi', label: 'Synthesize EDI', shortDesc: 'Map canonical data into target transaction' },
  { id: 'outboundEncode', label: 'Envelope & Trailer', shortDesc: 'ISA/GS envelopes and SE segment counts' },
  { id: 'outboundAs2', label: 'AS2 Package', shortDesc: 'RFC 4130 MIME multipart/signed envelope' },
  { id: 'outboundDownload', label: 'Outbound Artifacts', shortDesc: 'Generate virtual files for partner dispatch' },
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

export function executeOutboundSourceStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'outboundSource' };
  const raw = (next.input || '').trim();

  if (!raw) {
    const error: PipelineError = {
      code: 'ERR_EMPTY_SOURCE',
      stageId: 'outboundSource',
      message: 'No outbound ERP payload supplied. Load an ERP preset or paste canonical JSON.',
      recoverable: true,
      suggestedAction: 'Click a preset (Item Master 888, Stock Advice 943, PO 850, Invoice 810).',
    };
    next.status = 'failed';
    next.errors = [...next.errors, error];
    next.events = [...next.events, createEvent('outboundSource', 'failed', 'Empty ERP source input', { error })];
    return next;
  }

  next.events = [
    ...next.events,
    createEvent('outboundSource', 'succeeded', `Loaded outbound ERP source (${raw.length} bytes)`, {
      preview: raw.slice(0, 100),
    }),
  ];

  if (!next.completedStages.includes('outboundSource')) {
    next.completedStages = [...next.completedStages, 'outboundSource'];
  }
  return next;
}

export function executeOutboundCanonicalStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'outboundCanonical' };
  let canonical: CanonicalDocument | null = null;

  try {
    const parsed = JSON.parse(next.input);
    if (parsed.header && parsed.lineItems) {
      canonical = parsed as CanonicalDocument;
    } else {
      // Create minimal canonical wrapper if raw object was provided
      canonical = {
        transactionType: parsed.transactionType || '850',
        documentType: parsed.documentType || 'PurchaseOrder',
        controlNumbers: parsed.controlNumbers || {
          interchange: '000000850',
          group: '85001',
          transaction: '0001',
        },
        header: parsed.header || {
          orderNumber: parsed.orderNumber || 'PO-2026-001',
          orderDate: parsed.orderDate || new Date().toISOString().slice(0, 10),
          currency: 'USD',
          statusOrType: 'Original',
        },
        parties: parsed.parties || [],
        lineItems: parsed.lineItems || [],
        summary: parsed.summary || {
          totalQuantity: 1,
          totalAmount: 100,
          lineCount: 1,
        },
        rawMeta: {
          originalFormat: 'JSON',
          version: '1.0',
          delimiters: { element: '*', segment: '~' },
          receivedAt: new Date().toISOString(),
        },
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    next.status = 'failed';
    next.errors = [
      ...next.errors,
      {
        code: 'ERR_INVALID_CANONICAL_JSON',
        stageId: 'outboundCanonical',
        message: `Failed to parse ERP JSON input: ${message}`,
        recoverable: true,
      },
    ];
    return next;
  }

  next.canonical = canonical;
  next.events = [
    ...next.events,
    createEvent(
      'outboundCanonical',
      'succeeded',
      `Validated canonical business object: Type ${canonical.documentType}, Order #${canonical.header.orderNumber}, ${canonical.lineItems.length} lines`,
      { header: canonical.header }
    ),
  ];

  if (!next.completedStages.includes('outboundCanonical')) {
    next.completedStages = [...next.completedStages, 'outboundCanonical'];
  }
  return next;
}

export function executeOutboundEdiStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'outboundEdi' };
  if (!next.canonical) return next;

  const targetStandard = next.outboundOptions?.standard || 'X12';
  const targetTx = next.outboundOptions?.transactionType || next.canonical.transactionType || '850';

  const synthesizedEdi = synthesizeOutboundEdi(next.canonical, {
    standard: targetStandard,
    transactionType: targetTx,
    senderId: next.outboundOptions?.senderId || 'CODEPACKRHUB',
    receiverId: next.outboundOptions?.receiverId || 'TRADINGPARTNER',
    elementDelimiter: next.delimiterOverrides?.element || '*',
    segmentTerminator: next.delimiterOverrides?.segment || '~',
    componentDelimiter: next.delimiterOverrides?.component || '>',
  });

  next.synthesizedEdi = synthesizedEdi;
  next.events = [
    ...next.events,
    createEvent(
      'outboundEdi',
      'succeeded',
      `Synthesized ${targetStandard} ${targetTx} transaction stream (${synthesizedEdi.split('\n').length} segments)`,
      { standard: targetStandard, transactionType: targetTx }
    ),
  ];

  if (!next.completedStages.includes('outboundEdi')) {
    next.completedStages = [...next.completedStages, 'outboundEdi'];
  }
  return next;
}

export function executeOutboundEncodeStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'outboundEncode' };
  if (!next.synthesizedEdi) return next;

  // Verify envelopes
  const lines = next.synthesizedEdi.split('\n');
  const isa = lines.find((l) => l.startsWith('ISA') || l.startsWith('UNB'));
  const iea = lines.find((l) => l.startsWith('IEA') || l.startsWith('UNZ'));
  const se = lines.find((l) => l.startsWith('SE') || l.startsWith('UNT'));

  next.events = [
    ...next.events,
    createEvent(
      'outboundEncode',
      'succeeded',
      `Validated envelope control matching: ${isa ? isa.slice(0, 30) + '...' : ''} and trailer count (${se || ''})`,
      { segmentCount: lines.length }
    ),
  ];

  if (!next.completedStages.includes('outboundEncode')) {
    next.completedStages = [...next.completedStages, 'outboundEncode'];
  }
  return next;
}

export function executeOutboundAs2Stage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'outboundAs2' };
  if (!next.synthesizedEdi) return next;

  const sender = next.outboundOptions?.senderId || 'CODEPACKR_HUB';
  const receiver = next.outboundOptions?.receiverId || 'PARTNER_CORP';
  const as2Package = packageAs2Mime(
    next.synthesizedEdi,
    sender,
    receiver,
    `Outbound EDI ${next.canonical?.transactionType || '850'} Transmission`
  );

  next.as2Package = as2Package;
  next.events = [
    ...next.events,
    createEvent(
      'outboundAs2',
      'succeeded',
      `Packaged S/MIME AS2 message with Message-ID ${as2Package.messageId}, boundary ${as2Package.mimeBoundary}`,
      { as2From: sender, as2To: receiver, headers: as2Package.headers }
    ),
  ];

  if (!next.completedStages.includes('outboundAs2')) {
    next.completedStages = [...next.completedStages, 'outboundAs2'];
  }
  return next;
}

export function executeOutboundDownloadStage(ctx: PipelineContext): PipelineContext {
  const next = { ...ctx, currentStage: 'outboundDownload' };
  if (!next.synthesizedEdi) return next;

  const standard = next.outboundOptions?.standard || 'X12';
  const txType = next.canonical?.transactionType || '850';
  const partner = next.outboundOptions?.receiverId || 'PARTNER';
  const docId = next.canonical?.header.orderNumber || 'DOC';
  const runId = next.runId;

  const files: MockFile[] = [];

  // 1. Raw EDI stream
  const ediFilename = generateOutboundFilename(standard, txType, partner, docId, 'edi');
  files.push({
    path: `/virtual/outbound/${partner}/${ediFilename}`,
    name: ediFilename,
    content: next.synthesizedEdi,
    format: 'edi',
    contentType: 'application/edi-x12',
    sourceRunId: runId,
    status: 'created',
    createdAt: new Date().toISOString(),
    stageSource: 'outbound-synthesized-edi',
  });

  // 2. AS2 EML file
  if (next.as2Package) {
    const emlFilename = generateOutboundFilename('AS2', txType, partner, docId, 'eml');
    files.push({
      path: `/virtual/outbound/as2/${emlFilename}`,
      name: emlFilename,
      content: next.as2Package.rawEml,
      format: 'eml',
      contentType: 'message/rfc822',
      sourceRunId: runId,
      status: 'created',
      createdAt: new Date().toISOString(),
      stageSource: 'outbound-as2-mime',
    });
  }

  // 3. Source canonical JSON snapshot
  if (next.canonical) {
    const jsonFilename = `SRC_CANONICAL_${partner}_${docId}.json`;
    files.push({
      path: `/virtual/outbound/source/${jsonFilename}`,
      name: jsonFilename,
      content: JSON.stringify(next.canonical, null, 2),
      format: 'json',
      contentType: 'application/json',
      sourceRunId: runId,
      status: 'created',
      createdAt: new Date().toISOString(),
      stageSource: 'outbound-canonical-snapshot',
    });
  }

  next.virtualFiles = files;
  next.status = 'succeeded';

  next.events = [
    ...next.events,
    createEvent(
      'outboundDownload',
      'succeeded',
      `Created ${files.length} outbound transmission artifacts ready for dispatch`,
      { files: files.map((f) => f.name) }
    ),
  ];

  if (!next.completedStages.includes('outboundDownload')) {
    next.completedStages = [...next.completedStages, 'outboundDownload'];
  }
  return next;
}
