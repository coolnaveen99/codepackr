import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Network,
  Upload,
  FileText,
  Send,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Copy,
  Check,
  Download,
  Code2,
  FileCode,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  CloudUpload,
  Eye,
  Settings2,
  Database,
  BookOpen,
  Search,
  X,
  FileCheck,
  Layers,
  Play,
  PlayCircle,
  SkipForward,
  RotateCcw,
  Mail,
  Lock,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { downloadFile } from '../../lib/smartDownload';
import { EdiTutorialPanel } from './EdiTutorialPanel';
import { EdiTreeView, EdiTreeSegment } from './EdiTreeView';
import { COMPREHENSIVE_SEGMENT_DICTIONARY } from '../../data/ediDictionary';

// Re-export core domain types and fixtures for backward compatibility
export * from '../../edi-core/models';
export * from '../../edi-core/samples';
export type { EdiFormatAdapter } from '../../edi-core/adapters/types';

import {
  PipelineDirection,
  DiagnosticMessage,
  CanonicalLineItem,
  CanonicalParty,
  CanonicalDocument,
  FieldMapping,
  ParsedSegment,
  ParsedTransaction,
  MockFile,
  As2Package,
  FormatDetection,
} from '../../edi-core/models';

import {
  FIXTURE_X12_850,
  FIXTURE_X12_860,
  FIXTURE_X12_944,
  FIXTURE_X12_837_CLAIM,
  FIXTURE_X12_214_LOGISTICS,
  FIXTURE_AS2_MESSAGE,
  FIXTURE_EDIFACT_ORDERS,
  FIXTURE_OUTBOUND_JSON_PO,
  FIXTURE_OUTBOUND_JSON_INVOICE,
  FIXTURE_OUTBOUND_ERP_ITEM_MASTER,
  FIXTURE_OUTBOUND_ERP_STOCK_ADVICE,
  MOCK_ROUTES,
} from '../../edi-core/samples';

import {
  INBOUND_PRESETS,
  OUTBOUND_PRESETS,
  ALL_PRESETS,
  randomizeControlNumbers,
  PresetGroup,
  EdiPreset,
} from '../../edi-core/samples/presets';

import {
  createInitialContext,
  advanceStage,
  runFullPipeline,
  resetPipeline,
  replayFromStage,
} from '../../gateway/pipeline/controller';

import { PipelineStepper } from '../../gateway/components/PipelineStepper';
import { DiagnosticsPanel } from '../../gateway/components/DiagnosticsPanel';
import { LineageInspector } from '../../gateway/components/LineageInspector';
import { VirtualFilesList } from '../../gateway/components/VirtualFilesList';
import { As2Viewer } from '../../gateway/components/As2Viewer';
import { EdiSegmentTree } from '../../gateway/components/EdiSegmentTree';

export interface EdiMessageGatewayViewProps {
  tool?: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
  initialDirection?: PipelineDirection;
}

export const EdiMessageGatewayView: React.FC<EdiMessageGatewayViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
  initialDirection = 'inbound',
}) => {
  // 1. Direction: Inbound vs Outbound
  const [direction, setDirection] = useState<PipelineDirection>(initialDirection);

  // 2. Execution Mode: 'guided' (step by step) vs 'full' (instant end-to-end) vs 'expert' (advanced parameters & diagnostics)
  const [execMode, setExecMode] = useState<'guided' | 'full' | 'expert'>('guided');

  // 3. Step index (1 to 4) for high-level wizard navigation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // 4. Raw inputs
  const [inboundRawInput, setInboundRawInput] = useState<string>(initialInput || FIXTURE_X12_850);
  const [outboundRawInput, setOutboundRawInput] = useState<string>(FIXTURE_OUTBOUND_JSON_PO);

  // Preset selection state
  const [selectedPresetGroup, setSelectedPresetGroup] = useState<PresetGroup | 'All'>('All');
  const [activePresetId, setActivePresetId] = useState<string>('retail-po-850');
  const [swapNotification, setSwapNotification] = useState<string | null>(null);

  // Partner routing configuration (fictional names)
  const [senderId, setSenderId] = useState<string>('NORTHWIND');
  const [receiverId, setReceiverId] = useState<string>('CONTOSO');

  // 5. Options
  const [isPhiMaskEnabled, setIsPhiMaskEnabled] = useState<boolean>(false);
  const [outboundTargetStandard, setOutboundTargetStandard] = useState<'X12' | 'EDIFACT'>('X12');
  const [outboundTargetTransaction, setOutboundTargetTransaction] = useState<string>('850');
  const [inboundOutputTab, setInboundOutputTab] = useState<'canonical' | 'xml' | 'csv' | 'ack997' | 'lineage' | 'tree' | 'files'>('canonical');

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delimiter overrides
  const [overrideElemDelim, setOverrideElemDelim] = useState<string>('');
  const [overrideSegTerm, setOverrideSegTerm] = useState<string>('');

  // 6. Centralized Pipeline Context
  const [pipelineCtx, setPipelineCtx] = useState(() => {
    const init = createInitialContext(initialDirection, initialInput || FIXTURE_X12_850, 'guided');
    return runFullPipeline(init);
  });

  // Re-run pipeline when inputs or options change
  useEffect(() => {
    const activeInput = direction === 'inbound' ? inboundRawInput : outboundRawInput;
    const internalMode = execMode === 'expert' ? 'full' : execMode;
    let ctx = createInitialContext(direction, activeInput, internalMode);
    ctx.isPhiMaskEnabled = isPhiMaskEnabled;
    if (overrideElemDelim || overrideSegTerm) {
      ctx.delimiterOverrides = {
        element: overrideElemDelim || undefined,
        segment: overrideSegTerm || undefined,
      };
    }
    if (direction === 'outbound') {
      ctx.outboundOptions = {
        standard: outboundTargetStandard,
        transactionType: outboundTargetTransaction,
        senderId: senderId || 'NORTHWIND',
        receiverId: receiverId || 'CONTOSO',
      };
    }

    ctx = runFullPipeline(ctx);
    setPipelineCtx(ctx);
  }, [
    direction,
    inboundRawInput,
    outboundRawInput,
    isPhiMaskEnabled,
    outboundTargetStandard,
    outboundTargetTransaction,
    senderId,
    receiverId,
    overrideElemDelim,
    overrideSegTerm,
    execMode,
  ]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Preset Selection Handlers
  const handleSelectPreset = (preset: EdiPreset) => {
    setActivePresetId(preset.id);
    if (preset.direction === 'inbound') {
      setInboundRawInput(preset.payload);
      setUploadedFileName(null);
    } else {
      setOutboundRawInput(preset.payload);
      setOutboundTargetStandard(preset.family === 'EDIFACT' ? 'EDIFACT' : 'X12');
      setOutboundTargetTransaction(preset.transactionType);
      setUploadedFileName(null);
    }
  };

  const handleRandomizeControlNumbers = () => {
    if (direction === 'inbound') {
      const randomized = randomizeControlNumbers(inboundRawInput);
      setInboundRawInput(randomized);
      setSwapNotification('Control numbers randomized (ISA13, GS06, ST02, timestamps)!');
      setTimeout(() => setSwapNotification(null), 3000);
    }
  };

  // Swap Pipelines: Transfer in-memory canonical data or synthesized EDI between directions
  const handleSwapPipelines = () => {
    if (direction === 'inbound') {
      if (pipelineCtx.canonical) {
        const canonicalJson = JSON.stringify(pipelineCtx.canonical, null, 2);
        setOutboundRawInput(canonicalJson);
        const targetStd = pipelineCtx.detection?.format === 'edifact' ? 'EDIFACT' : 'X12';
        setOutboundTargetStandard(targetStd);
        setOutboundTargetTransaction(pipelineCtx.canonical.transactionType || '850');
        setDirection('outbound');
        setCurrentStep(1);
        setSwapNotification('Swapped to Outbound: Inbound canonical data loaded for EDI synthesis!');
        setTimeout(() => setSwapNotification(null), 3500);
      } else {
        setDirection('outbound');
        setCurrentStep(1);
        setSwapNotification('Swapped pipeline direction to Outbound Dispatch.');
        setTimeout(() => setSwapNotification(null), 2500);
      }
    } else {
      if (pipelineCtx.synthesizedEdi) {
        setInboundRawInput(pipelineCtx.synthesizedEdi);
        setDirection('inbound');
        setCurrentStep(1);
        setSwapNotification('Swapped to Inbound: Outbound synthesized EDI loaded for validation & parsing!');
        setTimeout(() => setSwapNotification(null), 3500);
      } else {
        setDirection('inbound');
        setCurrentStep(1);
        setSwapNotification('Swapped pipeline direction to Inbound Gateway.');
        setTimeout(() => setSwapNotification(null), 2500);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = (ev.target?.result as string) || '';
      if (direction === 'inbound') {
        setInboundRawInput(content);
      } else {
        setOutboundRawInput(content);
      }
    };
    reader.readAsText(file);
  };

  // Transfer outbound synthesized EDI to Inbound Gateway (Loopback test)
  const handleTransferToInbound = () => {
    if (pipelineCtx.synthesizedEdi) {
      setInboundRawInput(pipelineCtx.synthesizedEdi);
      setDirection('inbound');
      setCurrentStep(1);
      setSwapNotification('Transferred synthesized EDI stream to Inbound Gateway for loopback verification!');
      setTimeout(() => setSwapNotification(null), 3500);
    }
  };

  // Prepare Tree View segments format
  const treeSegments: EdiTreeSegment[] = useMemo(() => {
    return pipelineCtx.segments.map((seg, idx) => ({
      id: `seg-${idx}-${seg.tag}`,
      tag: seg.tag,
      elements: seg.elements.map((val, eIdx) => ({
        position: `${seg.tag}${String(eIdx + 1).padStart(2, '0')}`,
        index: eIdx + 1,
        value: val,
        name: `Element ${eIdx + 1}`,
      })),
      raw: seg.raw,
      lineNumber: seg.lineNumber || idx + 1,
      name: COMPREHENSIVE_SEGMENT_DICTIONARY[seg.tag] || `${seg.tag} Segment`,
    }));
  }, [pipelineCtx.segments]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16">
      {/* 1. Header Toolbar & High-Visibility Direction Switcher */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Top bar: Title and secondary badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)]">
              <Network className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                Enterprise EDI Integration Gateway
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Airgapped
                </span>
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Bi-directional B2B hub: Inbound Ingestion (EDI ➔ Canonical ERP) & Outbound Dispatch (ERP ➔ EDI)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Execution Mode Selector */}
            <div className="flex items-center p-1 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
              <button
                type="button"
                onClick={() => setExecMode('guided')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  execMode === 'guided'
                    ? 'bg-[var(--surface)] text-[var(--brand)] font-bold shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
                title="Step-by-step 4-stage guided walkthrough"
              >
                Guided
              </button>
              <button
                type="button"
                onClick={() => setExecMode('full')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  execMode === 'full'
                    ? 'bg-[var(--surface)] text-[var(--brand)] font-bold shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
                title="Instant end-to-end execution of all 8 pipeline stages"
              >
                Instant
              </button>
              <button
                type="button"
                onClick={() => setExecMode('expert')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  execMode === 'expert'
                    ? 'bg-[var(--surface)] text-[var(--brand)] font-bold shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
                title="Expert Mode: Exposes delimiter overrides, custom partner routing, and deep diagnostics"
              >
                Expert
              </button>
            </div>

            {/* PHI Redaction Toggle */}
            <button
              type="button"
              onClick={() => setIsPhiMaskEnabled(!isPhiMaskEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium transition-all ${
                isPhiMaskEnabled
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
              }`}
              title="Redact Protected Health Information (PHI) & patient DUNS numbers"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PHI Mask {isPhiMaskEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Tutorial Cheat Sheet Button */}
            <button
              type="button"
              onClick={() => setShowTutorial(!showTutorial)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reference</span>
            </button>
          </div>
        </div>

        {/* HIGH-VISIBILITY DIRECTION & SWAP PIPELINE SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-2 items-center">
          {/* Inbound Button */}
          <button
            type="button"
            onClick={() => {
              setDirection('inbound');
              setCurrentStep(1);
            }}
            className={`md:col-span-5 p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
              direction === 'inbound'
                ? 'bg-emerald-500/10 border-emerald-500 text-[var(--ink)] shadow-sm'
                : 'bg-[var(--bg)] border-[var(--line)] text-[var(--muted)] hover:border-emerald-500/40 hover:text-[var(--ink)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`p-2 rounded-lg ${direction === 'inbound' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-[var(--surface)] text-[var(--muted)]'}`}>
                <ArrowRight className="w-4 h-4" />
              </span>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>📥 Inbound Gateway</span>
                  {direction === 'inbound' && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-emerald-500 text-white">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Partner EDI / AS2 ➔ Canonical ERP JSON</div>
              </div>
            </div>
            {direction === 'inbound' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          </button>

          {/* Central SWAP Button */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwapPipelines}
              title="Swap Pipeline Direction: Transfer canonical JSON to Outbound or synthesized EDI to Inbound"
              className="w-full py-2.5 px-3 rounded-xl border-2 border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
              <span className="uppercase tracking-wider font-mono text-[11px]">⇄ Swap</span>
            </button>
          </div>

          {/* Outbound Button */}
          <button
            type="button"
            onClick={() => {
              setDirection('outbound');
              setCurrentStep(1);
            }}
            className={`md:col-span-5 p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
              direction === 'outbound'
                ? 'bg-indigo-500/10 border-indigo-500 text-[var(--ink)] shadow-sm'
                : 'bg-[var(--bg)] border-[var(--line)] text-[var(--muted)] hover:border-indigo-500/40 hover:text-[var(--ink)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`p-2 rounded-lg ${direction === 'outbound' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-[var(--surface)] text-[var(--muted)]'}`}>
                <Send className="w-4 h-4" />
              </span>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>📤 Outbound Dispatch</span>
                  {direction === 'outbound' && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-indigo-600 text-white">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Canonical ERP JSON ➔ Synthesized EDI / AS2</div>
              </div>
            </div>
            {direction === 'outbound' && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
          </button>
        </div>

        {/* Swap & Action Notification Toast */}
        {swapNotification && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{swapNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setSwapNotification(null)}
              className="text-xs hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tutorial Panel Drawer */}
        {showTutorial && (
          <div className="mt-4 pt-4 border-t border-[var(--line)]">
            <EdiTutorialPanel
              toolId="edi-message-gateway"
              isOpen={showTutorial}
              onToggle={() => setShowTutorial(false)}
            />
          </div>
        )}
      </div>

      {/* 2. Pipeline Execution Stepper */}
      <PipelineStepper
        context={pipelineCtx}
        onSelectStage={(stageId) => {
          // Map stageId to step 1-4
          if (direction === 'inbound') {
            if (stageId === 'receive' || stageId === 'detect') setCurrentStep(1);
            else if (stageId === 'decode' || stageId === 'split' || stageId === 'route') setCurrentStep(2);
            else if (stageId === 'canonical') setCurrentStep(3);
            else setCurrentStep(4);
          } else {
            if (stageId === 'outboundSource') setCurrentStep(1);
            else if (stageId === 'outboundCanonical') setCurrentStep(2);
            else if (stageId === 'outboundEdi' || stageId === 'outboundEncode') setCurrentStep(3);
            else setCurrentStep(4);
          }
        }}
      />

      {/* 3. Step 1-4 Tab Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          {
            step: 1,
            label: direction === 'inbound' ? '1. Ingestion & Format' : '1. ERP Source & Preset',
            desc: direction === 'inbound' ? 'Payload & Delimiters' : 'JSON Canonical Input',
          },
          {
            step: 2,
            label: direction === 'inbound' ? '2. Route & Diagnostics' : '2. Canonical Normalize',
            desc: direction === 'inbound' ? 'Queues & Validation' : 'Business Validation',
          },
          {
            step: 3,
            label: direction === 'inbound' ? '3. Canonical & Lineage' : '3. EDI Synthesis',
            desc: direction === 'inbound' ? 'Enterprise Mapping' : 'X12 / EDIFACT Stream',
          },
          {
            step: 4,
            label: direction === 'inbound' ? '4. Virtual Dispatch' : '4. AS2 & Artifacts',
            desc: direction === 'inbound' ? 'JSON, XML, CSV, 997' : 'MIME S/MIME & EML',
          },
        ].map((s) => {
          const isActive = currentStep === s.step;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(s.step)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-[var(--surface)] border-[var(--brand)] shadow-sm'
                  : 'bg-[var(--bg)] border-[var(--line)] hover:border-[var(--muted)] opacity-70'
              }`}
            >
              <div className="font-semibold text-xs text-[var(--ink)]">{s.label}</div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">{s.desc}</div>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* INBOUND FLOW */}
      {/* ========================================================================= */}
      {direction === 'inbound' && (
        <div className="space-y-6">
          {/* STEP 1: Ingestion & Delimiter Detection */}
          {currentStep === 1 && (
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              {/* Direction context banner */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 flex-wrap text-xs">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Flow: <strong>📥 Inbound Gateway</strong> (Receiving Partner EDI & Normalizing to Canonical ERP JSON)</span>
                </div>
                <button
                  type="button"
                  onClick={handleSwapPipelines}
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Switch directly to Outbound Dispatch flow"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>⇄ Switch to Outbound Dispatch</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[var(--ink)]">
                    Step 1: Inbound Payload Ingestion & Envelope Detection
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Paste raw EDI or AS2 text, or click an enterprise scenario preset to test real-world message structures.
                  </p>
                </div>

                {/* Upload Action */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".edi,.txt,.dat,.x12,.eml,.as2,.xml,.json"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--ink)] hover:border-[var(--brand)] transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[var(--brand)]" />
                    <span>Upload File</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mr-1">
                  Category:
                </span>
                {(
                  [
                    'All',
                    'Retail Order-to-Cash',
                    'Warehouse & Inventory',
                    'Transportation',
                    'Healthcare (Synthetic)',
                    'International (EDIFACT)',
                    'AS2 Transport',
                  ] as (PresetGroup | 'All')[]
                ).map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedPresetGroup(grp)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                      selectedPresetGroup === grp
                        ? 'bg-[var(--brand)] text-white font-bold shadow-xs'
                        : 'bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>

              {/* Scenario Presets & Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                  Presets:
                </span>
                {INBOUND_PRESETS.filter(
                  (p) => selectedPresetGroup === 'All' || p.group === selectedPresetGroup
                ).map((preset) => {
                  const isSelected = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      title={`${preset.description} (Partner: ${preset.defaultPartnerId})`}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] font-bold shadow-xs'
                          : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--brand)]'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-[10px] opacity-70 px-1 rounded bg-[var(--surface)]">
                        {preset.transactionType}
                      </span>
                    </button>
                  );
                })}

                {/* Randomize Control Numbers Button */}
                <button
                  type="button"
                  onClick={handleRandomizeControlNumbers}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--ink)] hover:border-[var(--brand)] transition-colors ml-auto shadow-xs"
                  title="Generate unique randomized ISA13, GS06, ST02 control numbers and timestamps"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-medium">Randomize Numbers</span>
                </button>
              </div>

              {/* Expert Mode Delimiter Overrides */}
              {execMode === 'expert' && (
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                      Custom Element Delimiter Override (e.g. * or |)
                    </label>
                    <input
                      type="text"
                      maxLength={1}
                      value={overrideElemDelim}
                      onChange={(e) => setOverrideElemDelim(e.target.value)}
                      placeholder="Auto-detect (e.g. *)"
                      className="w-full px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] font-mono text-xs focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                      Custom Segment Terminator Override (e.g. ~ or \n)
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={overrideSegTerm}
                      onChange={(e) => setOverrideSegTerm(e.target.value)}
                      placeholder="Auto-detect (e.g. ~)"
                      className="w-full px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] font-mono text-xs focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                </div>
              )}

              {/* Text Input Area */}
              <div className="relative">
                <textarea
                  value={inboundRawInput}
                  onChange={(e) => setInboundRawInput(e.target.value)}
                  rows={9}
                  className="w-full p-3 font-mono text-xs rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)] transition-colors leading-relaxed"
                  placeholder="Paste ISA*00* or UNB+ or MIME AS2 payload here..."
                />
              </div>

              {/* Delimiter & Detection Banner */}
              {pipelineCtx.detection && (
                <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-[var(--ink)]">
                      Standard: <span className="font-mono text-[var(--brand)] font-bold">{pipelineCtx.detection.format.toUpperCase()}</span>
                    </span>
                    <span className="text-[var(--muted)]">·</span>
                    <span>
                      Element: <code className="px-1.5 py-0.5 rounded bg-[var(--surface)] font-mono">{pipelineCtx.detection.elementDelimiter || '*'}</code>
                    </span>
                    <span className="text-[var(--muted)]">·</span>
                    <span>
                      Segment: <code className="px-1.5 py-0.5 rounded bg-[var(--surface)] font-mono">{pipelineCtx.detection.segmentTerminator || '~'}</code>
                    </span>
                    {pipelineCtx.detection.isAs2Mime && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-semibold text-[11px] flex items-center gap-1">
                        <Mail className="w-3 h-3" /> AS2 MIME Unwrapped
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold hover:bg-[var(--brand)]/90 transition-colors shadow-sm"
                    >
                      <span>Proceed to Step 2: Route & Diagnostics</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Routing & Diagnostics */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Route Summary Card */}
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Enterprise Router Dispatch
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono">
                        Mock Azure Service Bus Topic
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--ink)] mt-1">
                      {pipelineCtx.route?.routeName || 'Standard Inbound Route'}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Target subscription: <code className="font-mono text-[var(--brand)]">{pipelineCtx.route?.subscriptionLabel || 'Default-Orders-Sub'}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-center">
                      <div className="text-[10px] uppercase text-[var(--muted)] font-semibold">Segments</div>
                      <div className="text-lg font-bold font-mono text-[var(--ink)]">{pipelineCtx.segments.length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-center">
                      <div className="text-[10px] uppercase text-[var(--muted)] font-semibold">Transactions</div>
                      <div className="text-lg font-bold font-mono text-[var(--brand)]">{pipelineCtx.transactions.length}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-center">
                      <div className="text-[10px] uppercase text-[var(--muted)] font-semibold">Validation Notices</div>
                      <div className="text-lg font-bold font-mono text-emerald-500">{pipelineCtx.diagnostics.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnostics & Segment Tree Grid */}
              <div className="grid grid-cols-1 gap-4">
                <DiagnosticsPanel diagnostics={pipelineCtx.diagnostics} />
                <EdiSegmentTree segments={pipelineCtx.segments} />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Ingestion</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Proceed to Step 3: Canonical & Lineage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Canonical Transformation & Lineage */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {pipelineCtx.canonical && (
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4 mb-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Canonical Normalization (Domain Business Object)
                      </div>
                      <h3 className="text-lg font-bold text-[var(--ink)]">
                        {pipelineCtx.canonical.documentType} #{pipelineCtx.canonical.header.orderNumber}
                      </h3>
                      <div className="text-xs text-[var(--muted)]">
                        Date: {pipelineCtx.canonical.header.orderDate} · Currency: {pipelineCtx.canonical.header.currency} · Total:{' '}
                        <span className="font-semibold text-emerald-500">
                          {pipelineCtx.canonical.header.currency} {pipelineCtx.canonical.summary.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(JSON.stringify(pipelineCtx.canonical, null, 2), 'canonical-json')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors"
                      >
                        {copiedId === 'canonical-json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Canonical JSON</span>
                      </button>
                    </div>
                  </div>

                  {/* Parties & Line items overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Trading Entities ({pipelineCtx.canonical.parties.length})</div>
                      {pipelineCtx.canonical.parties.map((p, pIdx) => (
                        <div key={pIdx} className="flex items-start justify-between gap-2 p-1.5 rounded bg-[var(--surface)] font-mono">
                          <span className="text-[var(--brand)] font-semibold">{p.role}</span>
                          <span className="text-[var(--ink)] font-medium truncate max-w-xs text-right">
                            {p.name} {p.duns ? `(${p.duns})` : ''}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Item Manifest ({pipelineCtx.canonical.lineItems.length} lines)</div>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {pipelineCtx.canonical.lineItems.map((it, itIdx) => (
                          <div key={itIdx} className="flex items-center justify-between p-1.5 rounded bg-[var(--surface)] font-mono text-[11px]">
                            <span className="font-semibold text-[var(--ink)]">{it.partNumber}</span>
                            <span className="text-[var(--muted)]">
                              {it.quantity} {it.uom} @ {it.unitPrice.toFixed(2)} = ${(it.extendedAmount || it.quantity * it.unitPrice).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Field Lineage Inspector */}
                  <LineageInspector mappings={pipelineCtx.lineage} />

                  {/* In-Step Swap to Outbound Action */}
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3 flex-wrap text-xs">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Swap to Outbound Process: Transfer this parsed canonical data directly into Outbound Dispatch</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSwapPipelines}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <span>Swap to Outbound Process ➔</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Diagnostics</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Proceed to Step 4: Virtual Dispatch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Virtual Artifacts & Multi-Format Outputs */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--ink)]">
                    Step 4: Virtual File Artifacts & Multi-Format Dispatch
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Enterprise files ready for ERP consumption, message queues, and trading partner acknowledgments. Download individually or copy content directly.
                  </p>
                </div>

                <VirtualFilesList files={pipelineCtx.virtualFiles} />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Lineage</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--brand)] hover:border-[var(--brand)] transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ingest Another Document</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* OUTBOUND FLOW */}
      {/* ========================================================================= */}
      {direction === 'outbound' && (
        <div className="space-y-6">
          {/* STEP 1: Source ERP Canonical Input */}
          {currentStep === 1 && (
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              {/* Direction context banner */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3 flex-wrap text-xs">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Flow: <strong>📤 Outbound Dispatch</strong> (Synthesizing Partner EDI / AS2 from ERP Canonical JSON)</span>
                </div>
                <button
                  type="button"
                  onClick={handleSwapPipelines}
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Switch directly to Inbound Gateway flow"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>⇄ Switch to Inbound Gateway</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[var(--ink)]">
                    Step 1: Outbound ERP Business Object Ingestion
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Paste ERP canonical JSON or select an enterprise dispatch scenario.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--muted)] font-medium">Standard:</span>
                    <select
                      value={outboundTargetStandard}
                      onChange={(e) => setOutboundTargetStandard(e.target.value as 'X12' | 'EDIFACT')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
                    >
                      <option value="X12">ANSI ASC X12</option>
                      <option value="EDIFACT">UN/EDIFACT</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--muted)] font-medium">Tx Type:</span>
                    <input
                      type="text"
                      value={outboundTargetTransaction}
                      onChange={(e) => setOutboundTargetTransaction(e.target.value)}
                      placeholder="850 / 810"
                      className="w-20 px-2 py-1 text-xs font-mono rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                </div>
              </div>

              {/* Partner Routing Configuration */}
              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                    Sender Interchange ID (ISA06 / UNB02)
                  </label>
                  <input
                    type="text"
                    value={senderId}
                    onChange={(e) => setSenderId(e.target.value)}
                    placeholder="NORTHWIND"
                    className="w-full px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] font-mono text-xs focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">
                    Receiver Interchange ID (ISA08 / UNB03)
                  </label>
                  <input
                    type="text"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    placeholder="CONTOSO"
                    className="w-full px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] font-mono text-xs focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>

              {/* Outbound Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                  ERP Scenarios:
                </span>
                {OUTBOUND_PRESETS.map((preset) => {
                  const isSelected = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      title={`${preset.description} (Partner: ${preset.defaultPartnerId})`}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] font-bold shadow-xs'
                          : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--brand)]'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-[10px] opacity-70 px-1 rounded bg-[var(--surface)]">
                        {preset.transactionType}
                      </span>
                    </button>
                  );
                })}
              </div>

              <textarea
                value={outboundRawInput}
                onChange={(e) => setOutboundRawInput(e.target.value)}
                rows={9}
                className="w-full p-3 font-mono text-xs rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)] leading-relaxed"
                placeholder="Paste ERP canonical JSON payload here..."
              />

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)]">
                    Payload size: {(outboundRawInput.length / 1024).toFixed(1)} KB
                  </span>
                  <button
                    type="button"
                    onClick={handleSwapPipelines}
                    className="text-xs text-[var(--brand)] hover:underline flex items-center gap-1 font-semibold"
                    title="Swap to Inbound Gateway"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Swap to Inbound</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold hover:bg-[var(--brand)]/90 transition-colors shadow-sm"
                >
                  <span>Proceed to Step 2: Canonical Normalization</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Canonical Normalization */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {pipelineCtx.canonical && (
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Canonical Business Model Validated
                      </div>
                      <h3 className="text-lg font-bold text-[var(--ink)]">
                        {pipelineCtx.canonical.documentType} ({pipelineCtx.canonical.header.orderNumber})
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                        Schema Valid
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                      <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Transaction Code</div>
                      <div className="text-base font-bold font-mono text-[var(--brand)] mt-1">
                        {pipelineCtx.canonical.transactionType}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                      <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Total Line Items</div>
                      <div className="text-base font-bold font-mono text-[var(--ink)] mt-1">
                        {pipelineCtx.canonical.lineItems.length} lines ({pipelineCtx.canonical.summary.totalQuantity} units)
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
                      <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Total Value</div>
                      <div className="text-base font-bold font-mono text-emerald-500 mt-1">
                        {pipelineCtx.canonical.header.currency} {pipelineCtx.canonical.summary.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Source</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Proceed to Step 3: EDI Synthesis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Synthesized EDI Stream & Envelopes */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[var(--ink)]">
                      Step 3: Synthesized {outboundTargetStandard} EDI Stream
                    </h2>
                    <p className="text-xs text-[var(--muted)]">
                      Full standard compliance with ISA/GS envelope matching, segment element counting, and CTT trailers.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(pipelineCtx.synthesizedEdi || '', 'outbound-edi')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors"
                    >
                      {copiedId === 'outbound-edi' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy EDI Text</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[var(--bg)] rounded-xl border border-[var(--line)] font-mono text-xs max-h-72 overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-all text-[var(--ink)] leading-relaxed">
                    {pipelineCtx.synthesizedEdi}
                  </pre>
                </div>

                {/* Loopback transfer button */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 flex-wrap text-xs">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>Loopback Test: Send this synthesized EDI directly into Inbound Gateway</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTransferToInbound}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    Transfer to Inbound Gateway ➔
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Normalization</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Proceed to Step 4: AS2 & Virtual Artifacts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: AS2 Packaging & Download Artifacts */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {pipelineCtx.as2Package && <As2Viewer as2Package={pipelineCtx.as2Package} />}

              <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--ink)]">
                    Outbound Transmission Artifacts
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Download transmission-ready EDI, RFC 4130 S/MIME EML packages, or canonical JSON snapshots.
                  </p>
                </div>

                <VirtualFilesList files={pipelineCtx.virtualFiles} />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to EDI Stream</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--brand)] hover:border-[var(--brand)] transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Synthesize Another Document</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
