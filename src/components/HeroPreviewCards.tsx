import React from 'react';
import { Braces, Workflow, KeyRound, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { ToolDef } from '../types';
import { TOOLS } from '../data/tools';

interface HeroPreviewCardsProps {
  onSelectTool: (tool: ToolDef, initialPayload?: string) => void;
}

export const HeroPreviewCards: React.FC<HeroPreviewCardsProps> = ({ onSelectTool }) => {
  const handleLaunch = (toolId: string, initialPayload?: string) => {
    const target = TOOLS.find((t) => t.id === toolId);
    if (target) {
      onSelectTool(target, initialPayload);
    }
  };

  return (
    <div
      aria-label="Interactive tool previews"
      className="hidden lg:flex flex-col gap-3.5 relative w-[320px] xl:w-[360px] shrink-0 pointer-events-auto select-none"
    >
      {/* Decorative ambient backdrop glow behind floating cards */}
      <div
        className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-teal-500/10 blur-xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Card 1: Mini JSON Tree Preview */}
      <div
        onClick={() =>
          handleLaunch(
            'json-formatter',
            JSON.stringify(
              {
                status: 'success',
                execution: 'client-side',
                secure: true,
                latencyMs: 0.8,
              },
              null,
              2
            )
          )
        }
        className="animate-soft-float-1 group relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/90 backdrop-blur-md p-3.5 shadow-md hover:shadow-xl hover:border-[color:var(--brand)] transition-all duration-300 hover:scale-[1.03] cursor-pointer"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[color:var(--border)]/60 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-[color:var(--ink)]">
            <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Braces className="w-3.5 h-3.5" />
            </span>
            <span>JSON Inspector</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-2.5 h-2.5" /> valid
          </span>
        </div>

        <div className="font-mono text-[11px] leading-relaxed text-[color:var(--ink-muted)] bg-[color:var(--surface-elevated)] p-2 rounded-xl border border-[color:var(--border)]/50">
          <div>
            <span className="text-[color:var(--ink-muted)]">&#123;</span>
          </div>
          <div className="pl-3">
            <span className="text-blue-500 dark:text-blue-400 font-semibold">&quot;status&quot;</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;success&quot;</span>,
          </div>
          <div className="pl-3">
            <span className="text-blue-500 dark:text-blue-400 font-semibold">&quot;clientSide&quot;</span>: <span className="text-amber-500 font-bold">true</span>,
          </div>
          <div className="pl-3">
            <span className="text-blue-500 dark:text-blue-400 font-semibold">&quot;latency&quot;</span>: <span className="text-purple-500 font-bold">0ms</span>
          </div>
          <div>
            <span className="text-[color:var(--ink-muted)]">&#125;</span>
          </div>
        </div>

        {/* Hover Action Badge */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-[color:var(--brand)] opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="text-[color:var(--ink-muted)] text-[10px]">Zero server telemetry</span>
          <span className="inline-flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
            Try JSON Formatter <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Card 2: Tiny EDI Segment View */}
      <div
        onClick={() =>
          handleLaunch(
            'edi-segment-viewer',
            'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260401*1230*U*00401*000000001*0*P*>~\nGS*PO*SENDER*RECEIVER*20260401*1230*1*X*004010~\nST*850*0001~\nBEG*00*SA*PO-9842**20260401~\nN1*BY*ACME SUPPLY CORP*92*11029~\nPO1*1*50*EA*14.95**BP*SKU-9912~\nTDS*74750~\nSE*6*0001~\nGE*1*1~\nIEA*1*000000001~'
          )
        }
        className="animate-soft-float-2 group relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/90 backdrop-blur-md p-3.5 shadow-md hover:shadow-xl hover:border-teal-500/60 transition-all duration-300 hover:scale-[1.03] cursor-pointer"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[color:var(--border)]/60 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-[color:var(--ink)]">
            <span className="w-5 h-5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Workflow className="w-3.5 h-3.5" />
            </span>
            <span>EDI X12 Segment Stream</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold">
            ANSI 850
          </span>
        </div>

        <div className="font-mono text-[11px] space-y-1 bg-[color:var(--surface-elevated)] p-2 rounded-xl border border-[color:var(--border)]/50">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
              ST
            </span>
            <span className="text-[color:var(--ink)]">850</span>
            <span className="text-[color:var(--ink-muted)] opacity-60">*</span>
            <span className="text-[color:var(--ink-muted)]">0001</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">~</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400">
              BEG
            </span>
            <span className="text-[color:var(--ink)]">00</span>
            <span className="text-[color:var(--ink-muted)] opacity-60">*</span>
            <span className="text-[color:var(--ink)]">SA</span>
            <span className="text-[color:var(--ink-muted)] opacity-60">*</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">PO-9842</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">~</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">
              PO1
            </span>
            <span className="text-[color:var(--ink)]">1</span>
            <span className="text-[color:var(--ink-muted)] opacity-60">*</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">50 EA</span>
            <span className="text-[color:var(--ink-muted)] opacity-60">*</span>
            <span className="text-[color:var(--ink)]">14.95</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">~</span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-teal-600 dark:text-teal-400 opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="text-[color:var(--ink-muted)] text-[10px]">Parse &amp; validate loops</span>
          <span className="inline-flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
            Try EDI Tools <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Card 3: JWT / Security Decoder Preview */}
      <div
        onClick={() =>
          handleLaunch(
            'jwt-decoder',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMzQ1IiwibmFtZSI6IkFsZXggRGV2Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
          )
        }
        className="animate-soft-float-3 group relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/90 backdrop-blur-md p-3.5 shadow-md hover:shadow-xl hover:border-purple-500/60 transition-all duration-300 hover:scale-[1.03] cursor-pointer"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[color:var(--border)]/60 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-[color:var(--ink)]">
            <span className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <KeyRound className="w-3.5 h-3.5" />
            </span>
            <span>JWT Decoder &amp; Verify</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
            <Shield className="w-2.5 h-2.5" /> HS256
          </span>
        </div>

        <div className="font-mono text-[11px] space-y-1.5 bg-[color:var(--surface-elevated)] p-2 rounded-xl border border-[color:var(--border)]/50">
          <div className="text-[10px] truncate">
            <span className="text-rose-500 font-semibold">eyJhbGciOi...</span>
            <span className="text-purple-500 font-semibold">.eyJzdWIi...</span>
            <span className="text-cyan-500 font-semibold">.SflKxwRJ...</span>
          </div>
          <div className="text-[10px] text-[color:var(--ink-muted)] flex items-center justify-between border-t border-[color:var(--border)]/40 pt-1">
            <span>role: &quot;admin&quot;</span>
            <span className="text-emerald-500 font-semibold">signature verified</span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-purple-600 dark:text-purple-400 opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="text-[color:var(--ink-muted)] text-[10px]">Zero key exfiltration</span>
          <span className="inline-flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
            Decode JWT <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
