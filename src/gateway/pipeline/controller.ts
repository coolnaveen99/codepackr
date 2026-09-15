import { PipelineContext, PipelineDirection, PipelineMode } from '../../edi-core/models/pipeline';
import { generateRunId } from '../../edi-core/utils/ids';
import {
  INBOUND_STAGES,
  executeReceiveStage,
  executeDetectStage,
  executeDecodeStage,
  executeSplitStage,
  executeRouteStage,
  executeCanonicalStage,
  executeTargetOutputStage,
  executeVirtualFileStage,
} from './stages/inbound';
import {
  OUTBOUND_STAGES,
  executeOutboundSourceStage,
  executeOutboundCanonicalStage,
  executeOutboundEdiStage,
  executeOutboundEncodeStage,
  executeOutboundAs2Stage,
  executeOutboundDownloadStage,
} from './stages/outbound';
import { FIXTURE_X12_850, FIXTURE_OUTBOUND_JSON_PO } from '../../edi-core/samples';

export function createInitialContext(
  direction: PipelineDirection = 'inbound',
  input?: string,
  mode: PipelineMode = 'guided'
): PipelineContext {
  const defaultInput = direction === 'inbound' ? FIXTURE_X12_850 : FIXTURE_OUTBOUND_JSON_PO;
  const initialInput = input !== undefined ? input : defaultInput;
  const stages = direction === 'inbound' ? INBOUND_STAGES : OUTBOUND_STAGES;

  return {
    runId: generateRunId(direction === 'inbound' ? 'INB' : 'OUT'),
    direction,
    mode,
    status: 'idle',
    stages,
    currentStage: stages[0].id,
    completedStages: [],
    events: [],
    errors: [],
    warnings: [],
    input: initialInput,
    outputFormat: 'json',
    isPhiMaskEnabled: false,
    virtualFiles: [],
    segments: [],
    transactions: [],
    diagnostics: [],
    lineage: [],
  };
}

export function advanceStage(ctx: PipelineContext): PipelineContext {
  if (ctx.status === 'failed') return ctx;

  let current = { ...ctx };
  if (current.status === 'idle') {
    current.status = 'running';
  }

  const stages = current.direction === 'inbound' ? INBOUND_STAGES : OUTBOUND_STAGES;
  const currentIndex = stages.findIndex((s) => s.id === current.currentStage);

  if (current.direction === 'inbound') {
    switch (current.currentStage) {
      case 'receive':
        current = executeReceiveStage(current);
        if (current.status !== 'failed') current.currentStage = 'detect';
        break;
      case 'detect':
        current = executeDetectStage(current);
        if (current.status !== 'failed') current.currentStage = 'decode';
        break;
      case 'decode':
        current = executeDecodeStage(current);
        if (current.status !== 'failed') current.currentStage = 'split';
        break;
      case 'split':
        current = executeSplitStage(current);
        if (current.status !== 'failed') current.currentStage = 'route';
        break;
      case 'route':
        current = executeRouteStage(current);
        if (current.status !== 'failed') current.currentStage = 'canonical';
        break;
      case 'canonical':
        current = executeCanonicalStage(current);
        if (current.status !== 'failed') current.currentStage = 'targetOutput';
        break;
      case 'targetOutput':
        current = executeTargetOutputStage(current);
        if (current.status !== 'failed') current.currentStage = 'virtualFile';
        break;
      case 'virtualFile':
        current = executeVirtualFileStage(current);
        current.status = 'succeeded';
        break;
      default:
        break;
    }
  } else {
    switch (current.currentStage) {
      case 'outboundSource':
        current = executeOutboundSourceStage(current);
        if (current.status !== 'failed') current.currentStage = 'outboundCanonical';
        break;
      case 'outboundCanonical':
        current = executeOutboundCanonicalStage(current);
        if (current.status !== 'failed') current.currentStage = 'outboundEdi';
        break;
      case 'outboundEdi':
        current = executeOutboundEdiStage(current);
        if (current.status !== 'failed') current.currentStage = 'outboundEncode';
        break;
      case 'outboundEncode':
        current = executeOutboundEncodeStage(current);
        if (current.status !== 'failed') current.currentStage = 'outboundAs2';
        break;
      case 'outboundAs2':
        current = executeOutboundAs2Stage(current);
        if (current.status !== 'failed') current.currentStage = 'outboundDownload';
        break;
      case 'outboundDownload':
        current = executeOutboundDownloadStage(current);
        current.status = 'succeeded';
        break;
      default:
        break;
    }
  }

  return current;
}

export function runFullPipeline(ctx: PipelineContext): PipelineContext {
  let current: PipelineContext = { ...ctx, status: 'running', completedStages: [] };
  const stages = current.direction === 'inbound' ? INBOUND_STAGES : OUTBOUND_STAGES;

  for (const stage of stages) {
    current.currentStage = stage.id;
    if (current.direction === 'inbound') {
      if (stage.id === 'receive') current = executeReceiveStage(current);
      else if (stage.id === 'detect') current = executeDetectStage(current);
      else if (stage.id === 'decode') current = executeDecodeStage(current);
      else if (stage.id === 'split') current = executeSplitStage(current);
      else if (stage.id === 'route') current = executeRouteStage(current);
      else if (stage.id === 'canonical') current = executeCanonicalStage(current);
      else if (stage.id === 'targetOutput') current = executeTargetOutputStage(current);
      else if (stage.id === 'virtualFile') current = executeVirtualFileStage(current);
    } else {
      if (stage.id === 'outboundSource') current = executeOutboundSourceStage(current);
      else if (stage.id === 'outboundCanonical') current = executeOutboundCanonicalStage(current);
      else if (stage.id === 'outboundEdi') current = executeOutboundEdiStage(current);
      else if (stage.id === 'outboundEncode') current = executeOutboundEncodeStage(current);
      else if (stage.id === 'outboundAs2') current = executeOutboundAs2Stage(current);
      else if (stage.id === 'outboundDownload') current = executeOutboundDownloadStage(current);
    }

    if (current.status === 'failed') {
      break;
    }
  }

  return current;
}

export function retryStage(ctx: PipelineContext, stageId?: string): PipelineContext {
  const targetStage = stageId || ctx.currentStage;
  const current: PipelineContext = {
    ...ctx,
    status: 'running',
    currentStage: targetStage,
    errors: ctx.errors.filter((e) => e.stageId !== targetStage),
  };
  return advanceStage(current);
}

export function replayFromStage(ctx: PipelineContext, stageId: string): PipelineContext {
  const stages = ctx.direction === 'inbound' ? INBOUND_STAGES : OUTBOUND_STAGES;
  const targetIndex = stages.findIndex((s) => s.id === stageId);
  if (targetIndex === -1) return ctx;

  const validCompleted = stages.slice(0, targetIndex).map((s) => s.id);
  const replayed: PipelineContext = {
    ...ctx,
    currentStage: stageId,
    completedStages: validCompleted,
    status: 'running',
    errors: ctx.errors.filter((e) => validCompleted.includes(e.stageId)),
  };

  return advanceStage(replayed);
}

export function resetPipeline(
  direction: PipelineDirection = 'inbound',
  input?: string,
  mode: PipelineMode = 'guided'
): PipelineContext {
  return createInitialContext(direction, input, mode);
}
