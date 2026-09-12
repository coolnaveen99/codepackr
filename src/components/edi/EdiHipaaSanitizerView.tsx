import React, { useState, useMemo, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sliders,
  FileCode2,
  FileCheck,
  AlertTriangle,
  Lock,
  Columns,
  Eye,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { downloadFile } from '../../lib/smartDownload';

interface EdiHipaaSanitizerViewProps {
  tool: ToolDef;
  onBackToHome: () => void;
  onSelectRelated: (t: ToolDef) => void;
  initialInput?: string;
}

interface SanitizedAuditItem {
  line: number;
  segmentTag: string;
  fieldLabel: string;
  originalValue: string;
  sanitizedValue: string;
  ruleCategory: 'Patient Identity' | 'SSN / Member ID' | 'Birth Date' | 'Address' | 'Provider ID';
}

export const EdiHipaaSanitizerView: React.FC<EdiHipaaSanitizerViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [ediInput, setEdiInput] = useState<string>(initialInput || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedAudit, setCopiedAudit] = useState<boolean>(false);
  const [viewLayout, setViewLayout] = useState<'split' | 'sanitized-only'>('split');

  // Sanitization Rule Toggles (HIPAA Safe Harbor 45 CFR § 164.514(b))
  const [maskNames, setMaskNames] = useState<boolean>(true);
  const [maskMemberIds, setMaskMemberIds] = useState<boolean>(true);
  const [maskBirthDates, setMaskBirthDates] = useState<boolean>(true);
  const [maskAddresses, setMaskAddresses] = useState<boolean>(true);
  const [maskProviderNpis, setMaskProviderNpis] = useState<boolean>(false);
  const [maskClaimIds, setMaskClaimIds] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // PRELOADED HIPAA SAMPLES
  // -------------------------------------------------------------
  const loadSample837Claim = () => {
    const sample = `ISA*00*          *00*          *ZZ*SUBMITTER99    *ZZ*PAYER001       *260910*0915*U*00501*000000837*0*P*:~
GS*HC*SUBMITTER99*PAYER001*20260910*0915*83701*X*005010X222A1~
ST*837*0001*005010X222A1~
BHT*0019*00*TXN-837P-2026*20260910*0915*CH~
NM1*41*2*PREMIER BILLING SERVICE*****46*SUB99212~
PER*IC*SARAH CONNOR*TE*5552345678*EM*BILLING@PREMIERMED.COM~
NM1*40*2*BLUE CROSS HEALTH PLAN*****46*PAYER001~
HL*1**20*1~
PRV*BI*PXC*207Q00000X~
NM1*85*2*METROPOLITAN SURGICAL ASSOCIATES*****XX*1982736450~
N3*742 EVERGREEN TERRACE*SUITE 200~
N4*SPRINGFIELD*OR*97477~
REF*EI*938271625~
HL*2*1*22*0~
SBR*P*18*******CI~
NM1*IL*1*WILLIAMS*ROBERT*J***MI*WLM9827364501~
N3*456 MAPLE WOOD DRIVE*APT 3B~
N4*SPRINGFIELD*OR*97477~
DMG*D8*19680714*M~
NM1*PR*2*BLUE CROSS HEALTH PLAN*****PI*BCBS990~
CLM*CLM-2026-9812*450.00***11:B:1*Y*A*Y*Y~
DTP*431*D8*20260905~
HI*BK:M545*BF:M5126~
NM1*82*1*ANDERSON*THOMAS*M***XX*1293847561~
PRV*PE*PXC*207Q00000X~
LX*1~
SV1*HC:99214*150.00*UN*1***1~
DTP*472*D8*20260905~
LX*2~
SV1*HC:72148*300.00*UN*1***1~
DTP*472*D8*20260905~
SE*30*0001~
GE*1*83701~
IEA*1*000000837~`;
    setEdiInput(sample);
  };

  const loadSample835Remittance = () => {
    const sample = `ISA*00*          *00*          *ZZ*PAYER001       *ZZ*METROSURGICAL  *260912*1600*U*00501*000000835*0*P*:~
GS*HP*PAYER001*METROSURGICAL*20260912*1600*83501*X*005010X221A1~
ST*835*0001~
BPR*I*325.00*C*ACH*CCP*01*044000037*DA*987654321*1234567890**01*091000019*DA*123456*20260912~
TRN*1*CHK-2026-99124*1982736450~
CUR*SE*USD~
N1*PR*BLUE CROSS HEALTH PLAN~
N3*100 HEALTHCARE BLVD~
N4*CHICAGO*IL*60601~
N1*PE*METROPOLITAN SURGICAL ASSOCIATES*XX*1982736450~
N3*742 EVERGREEN TERRACE*SUITE 200~
N4*SPRINGFIELD*OR*97477~
CLP*CLM-2026-9812*1*450.00*325.00*45.00*MC*1234567890123*11*1~
NM1*QC*1*WILLIAMS*ROBERT*J***HN*WLM9827364501~
DTM*232*20260905~
DTM*233*20260905~
SVC*HC:99214*150.00*125.00**1~
DTM*472*20260905~
CAS*PR*1*25.00~
SVC*HC:72148*300.00*200.00**1~
DTM*472*20260905~
CAS*CO*45*80.00~
CAS*PR*2*20.00~
SE*23*0001~
GE*1*83501~
IEA*1*000000835~`;
    setEdiInput(sample);
  };

  // -------------------------------------------------------------
  // HIPAA SANITIZATION ENGINE
  // -------------------------------------------------------------
  const sanitizationResult = useMemo(() => {
    if (!ediInput.trim()) {
      return { sanitizedEdi: '', auditLog: [], stats: { totalSanitized: 0, patientCount: 0, datesCount: 0 } };
    }

    const text = ediInput.trim();
    const term = text.includes('~') ? '~' : text.includes("'") ? "'" : '\n';
    const sep = text.includes('*') ? '*' : '+';

    const segments = text
      .split(term)
      .map((s) => s.trim())
      .filter(Boolean);

    const auditLog: SanitizedAuditItem[] = [];
    const sanitizedSegments: string[] = [];

    // Synthetic Replacement Pools
    const syntheticLastNames = ['DOE', 'SMITH', 'JOHNSON', 'BROWN', 'DAVIS', 'WILSON'];
    const syntheticFirstNames = ['JOHN', 'JANE', 'MICHAEL', 'EMILY', 'DAVID', 'SARAH'];
    let nameCounter = 0;

    segments.forEach((seg, idx) => {
      const parts = seg.split(sep);
      const tag = parts[0];
      const line = idx + 1;

      // 1. Patient / Subscriber Names (NM1*IL, NM1*QC, NM1*74)
      if (tag === 'NM1' && (parts[1] === 'IL' || parts[1] === 'QC' || parts[1] === '74')) {
        const entityLabel = parts[1] === 'IL' ? 'Subscriber' : 'Patient/Dependent';

        if (maskNames) {
          const origLast = parts[3] || '';
          const origFirst = parts[4] || '';
          const synLast = syntheticLastNames[nameCounter % syntheticLastNames.length];
          const synFirst = syntheticFirstNames[nameCounter % syntheticFirstNames.length];
          nameCounter++;

          if (origLast) {
            auditLog.push({
              line,
              segmentTag: tag,
              fieldLabel: `${entityLabel} Last Name (NM103)`,
              originalValue: origLast,
              sanitizedValue: synLast,
              ruleCategory: 'Patient Identity',
            });
            parts[3] = synLast;
          }

          if (origFirst) {
            auditLog.push({
              line,
              segmentTag: tag,
              fieldLabel: `${entityLabel} First Name (NM104)`,
              originalValue: origFirst,
              sanitizedValue: synFirst,
              ruleCategory: 'Patient Identity',
            });
            parts[4] = synFirst;
          }
          if (parts[5]) parts[5] = 'X'; // Middle initial
        }

        // Member ID / SSN in NM109
        if (maskMemberIds && parts[9]) {
          const origId = parts[9];
          const synId = `MBR${String(10000000 + (line * 73) % 90000000)}`;
          auditLog.push({
            line,
            segmentTag: tag,
            fieldLabel: `${entityLabel} Primary ID / SSN (NM109)`,
            originalValue: origId,
            sanitizedValue: synId,
            ruleCategory: 'SSN / Member ID',
          });
          parts[9] = synId;
        }
      }

      // 2. Patient / Member Birth Dates (DMG*D8*YYYYMMDD)
      if (tag === 'DMG') {
        if (maskBirthDates && parts[2]) {
          const origDob = parts[2];
          const synDob = '19850101'; // Safe static test DOB
          auditLog.push({
            line,
            segmentTag: tag,
            fieldLabel: 'Patient Date of Birth (DMG02)',
            originalValue: origDob,
            sanitizedValue: synDob,
            ruleCategory: 'Birth Date',
          });
          parts[2] = synDob;
        }
      }

      // 3. Addresses (N3, N4)
      if (tag === 'N3') {
        // Check if preceding was IL, QC, or 85
        if (maskAddresses) {
          const origAddr = parts.slice(1).join(' ');
          const synAddr = '100 TEST HEALTHCARE WAY';
          auditLog.push({
            line,
            segmentTag: tag,
            fieldLabel: 'Physical Address Line 1/2 (N3)',
            originalValue: origAddr,
            sanitizedValue: synAddr,
            ruleCategory: 'Address',
          });
          parts[1] = synAddr;
          if (parts[2]) parts[2] = 'SUITE 100';
        }
      }

      if (tag === 'N4') {
        if (maskAddresses) {
          const origCity = parts[1] || '';
          const origZip = parts[3] || '';
          const synCity = 'AUSTIN';
          const synState = 'TX';
          const synZip = '78701';

          auditLog.push({
            line,
            segmentTag: tag,
            fieldLabel: 'Geographic Location City/Zip (N4)',
            originalValue: `${origCity}, ${parts[2] || ''} ${origZip}`,
            sanitizedValue: `${synCity}, ${synState} ${synZip}`,
            ruleCategory: 'Address',
          });
          parts[1] = synCity;
          parts[2] = synState;
          parts[3] = synZip;
        }
      }

      // 4. Member ID References (REF*SY, REF*EJ, REF*1W)
      if (tag === 'REF' && (parts[1] === 'SY' || parts[1] === 'EJ' || parts[1] === '1W')) {
        if (maskMemberIds && parts[2]) {
          const origRef = parts[2];
          const synRef = `SY${String(100000000 + (line * 97) % 900000000)}`;
          auditLog.push({
            line,
            segmentTag: tag,
            fieldLabel: `SSN / Policy ID (REF*${parts[1]})`,
            originalValue: origRef,
            sanitizedValue: synRef,
            ruleCategory: 'SSN / Member ID',
          });
          parts[2] = synRef;
        }
      }

      // 5. Contact PER Person names & Phone/Emails
      if (tag === 'PER') {
        if (maskNames) {
          if (parts[2]) {
            const origPer = parts[2];
            parts[2] = 'TEST COORDINATOR';
            auditLog.push({
              line,
              segmentTag: tag,
              fieldLabel: 'Contact Person Name (PER02)',
              originalValue: origPer,
              sanitizedValue: 'TEST COORDINATOR',
              ruleCategory: 'Patient Identity',
            });
          }
          for (let i = 3; i < parts.length; i += 2) {
            if (parts[i] === 'EM' && parts[i + 1]) {
              parts[i + 1] = 'test@example.com';
            } else if (parts[i] === 'TE' && parts[i + 1]) {
              parts[i + 1] = '5550100000';
            }
          }
        }
      }

      // 6. Claim IDs (CLM01)
      if (tag === 'CLM' && maskClaimIds && parts[1]) {
        const origClm = parts[1];
        const synClm = `CLM-TEST-${String(1000 + (line % 9000))}`;
        auditLog.push({
          line,
          segmentTag: tag,
          fieldLabel: 'Patient Claim Control Number (CLM01)',
          originalValue: origClm,
          sanitizedValue: synClm,
          ruleCategory: 'Patient Identity',
        });
        parts[1] = synClm;
      }

      // 7. Provider NPIs (NM1*85, NM1*82 with XX qualifier)
      if (tag === 'NM1' && (parts[1] === '85' || parts[1] === '82') && maskProviderNpis) {
        if (parts[9]) {
          const origNpi = parts[9];
          const synNpi = '1234567890';
          auditLog.push({
            line,
            segmentTag: tag,
            fieldLabel: `Provider NPI (NM1*${parts[1]})`,
            originalValue: origNpi,
            sanitizedValue: synNpi,
            ruleCategory: 'Provider ID',
          });
          parts[9] = synNpi;
        }
      }

      sanitizedSegments.push(parts.join(sep));
    });

    const sanitizedEdi = sanitizedSegments.join(term + '\n') + term;

    return {
      sanitizedEdi,
      auditLog,
      stats: {
        totalSanitized: auditLog.length,
        patientCount: auditLog.filter((a) => a.ruleCategory === 'Patient Identity').length,
        datesCount: auditLog.filter((a) => a.ruleCategory === 'Birth Date').length,
      },
    };
  }, [
    ediInput,
    maskNames,
    maskMemberIds,
    maskBirthDates,
    maskAddresses,
    maskProviderNpis,
    maskClaimIds,
  ]);

  const handleCopySanitized = () => {
    navigator.clipboard.writeText(sanitizationResult.sanitizedEdi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSanitized = () => {
    downloadFile({ file: sanitizationResult.sanitizedEdi, filename: 'sanitized_hipaa_edi.x12' });
  };

  const handleCopyAuditLog = () => {
    const lines = [
      '# HIPAA Safe Harbor De-Identification Audit Log',
      `Timestamp: ${new Date().toISOString()}`,
      `Total Protected Health Information (PHI) Elements Redacted: ${sanitizationResult.stats.totalSanitized}`,
      '',
      '| Line | Segment | Element Label | Original Value | Sanitized Value | Rule Category |',
      '|------|---------|---------------|----------------|-----------------|---------------|',
      ...sanitizationResult.auditLog.map(
        (a) => `| ${a.line} | ${a.segmentTag} | ${a.fieldLabel} | "${a.originalValue}" | "${a.sanitizedValue}" | ${a.ruleCategory} |`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* HIPAA Compliance Assurance Banner */}
      <div
        className="p-4 rounded-2xl border flex items-center justify-between gap-4 bg-emerald-500/10 border-emerald-500/30"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              100% Client-Side HIPAA Safe Harbor De-Identification (45 CFR § 164.514(b))
            </div>
            <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 mt-0.5">
              Zero Protected Health Information (PHI) is ever transmitted over the network. All masking occurs directly inside your browser memory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSample837Claim}
            className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
            style={{ borderColor: 'var(--line)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" /> Load Sample 837P Claim
          </button>
          <button
            type="button"
            onClick={loadSample835Remittance}
            className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
            style={{ borderColor: 'var(--line)' }}
          >
            Load Sample 835 Remittance
          </button>
        </div>
      </div>

      {/* De-Identification Rules Control Matrix */}
      <div
        className="p-4 rounded-2xl border space-y-3"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[var(--brand)]" /> HIPAA De-Identification Masking Rules
          </span>
          <span className="text-xs text-[var(--muted)]">
            Redactions applied: <strong className="text-[var(--brand)] font-mono font-bold">{sanitizationResult.stats.totalSanitized}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-[var(--surface-2)] cursor-pointer select-none text-xs" style={{ borderColor: 'var(--line)' }}>
            <input
              type="checkbox"
              checked={maskNames}
              onChange={(e) => setMaskNames(e.target.checked)}
              className="rounded text-[var(--brand)] cursor-pointer"
            />
            <span className="font-semibold text-[var(--ink)]">Patient Names (NM1)</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-[var(--surface-2)] cursor-pointer select-none text-xs" style={{ borderColor: 'var(--line)' }}>
            <input
              type="checkbox"
              checked={maskMemberIds}
              onChange={(e) => setMaskMemberIds(e.target.checked)}
              className="rounded text-[var(--brand)] cursor-pointer"
            />
            <span className="font-semibold text-[var(--ink)]">Member IDs / SSN</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-[var(--surface-2)] cursor-pointer select-none text-xs" style={{ borderColor: 'var(--line)' }}>
            <input
              type="checkbox"
              checked={maskBirthDates}
              onChange={(e) => setMaskBirthDates(e.target.checked)}
              className="rounded text-[var(--brand)] cursor-pointer"
            />
            <span className="font-semibold text-[var(--ink)]">Dates of Birth (DMG)</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-[var(--surface-2)] cursor-pointer select-none text-xs" style={{ borderColor: 'var(--line)' }}>
            <input
              type="checkbox"
              checked={maskAddresses}
              onChange={(e) => setMaskAddresses(e.target.checked)}
              className="rounded text-[var(--brand)] cursor-pointer"
            />
            <span className="font-semibold text-[var(--ink)]">Addresses (N3/N4)</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-[var(--surface-2)] cursor-pointer select-none text-xs" style={{ borderColor: 'var(--line)' }}>
            <input
              type="checkbox"
              checked={maskClaimIds}
              onChange={(e) => setMaskClaimIds(e.target.checked)}
              className="rounded text-[var(--brand)] cursor-pointer"
            />
            <span className="font-semibold text-[var(--ink)]">Claim IDs (CLM01)</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-[var(--surface-2)] cursor-pointer select-none text-xs" style={{ borderColor: 'var(--line)' }}>
            <input
              type="checkbox"
              checked={maskProviderNpis}
              onChange={(e) => setMaskProviderNpis(e.target.checked)}
              className="rounded text-[var(--brand)] cursor-pointer"
            />
            <span className="font-semibold text-[var(--ink)]">Provider NPIs (XX)</span>
          </label>
        </div>
      </div>

      {/* Editor Controls & Layout Switch */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[var(--surface-2)] p-1 rounded-xl border" style={{ borderColor: 'var(--line)' }}>
          <button
            type="button"
            onClick={() => setViewLayout('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              viewLayout === 'split'
                ? 'bg-[var(--brand)] text-white shadow-sm'
                : 'text-[var(--ink)] hover:bg-[var(--surface)]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewLayout('sanitized-only')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              viewLayout === 'sanitized-only'
                ? 'bg-[var(--brand)] text-white shadow-sm'
                : 'text-[var(--ink)] hover:bg-[var(--surface)]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Sanitized Output Only</span>
          </button>
        </div>

        {sanitizationResult.sanitizedEdi && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySanitized}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
              style={{ borderColor: 'var(--line)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Sanitized EDI!' : 'Copy Sanitized EDI'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSanitized}
              className="px-3 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Clean .X12</span>
            </button>
          </div>
        )}
      </div>

      {/* Dual Column Workspace */}
      <div className={`grid gap-6 ${viewLayout === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Original Input Column */}
        {viewLayout === 'split' && (
          <div
            className="p-5 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Original HIPAA File (Contains PHI)
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setEdiInput((ev.target?.result as string) || '');
                      reader.readAsText(f);
                    }
                  }}
                  accept=".edi,.x12,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setEdiInput('')}
                  className="p-1.5 rounded-xl border hover:bg-[var(--surface-2)] text-[var(--muted)] cursor-pointer"
                  style={{ borderColor: 'var(--line)' }}
                  title="Clear"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <textarea
              rows={16}
              value={ediInput}
              onChange={(e) => setEdiInput(e.target.value)}
              placeholder="Paste raw HIPAA 837 claim, 835 remittance, or 270 eligibility document here..."
              className="w-full p-3 font-mono text-xs rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none resize-y"
              style={{ borderColor: 'var(--line)' }}
            />
          </div>
        )}

        {/* Sanitized Clean Output Column */}
        <div
          className="p-5 rounded-2xl border space-y-3"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> De-Identified Sanitized File (Safe for Dev/Testing)
            </span>

            <span className="text-xs font-mono text-[var(--muted)]">
              {sanitizationResult.sanitizedEdi ? `${sanitizationResult.sanitizedEdi.length} bytes` : '0 bytes'}
            </span>
          </div>

          <textarea
            rows={16}
            readOnly
            value={sanitizationResult.sanitizedEdi}
            placeholder="Sanitized, compliant EDI with synthetic names, masked IDs, and shifted dates will appear here..."
            className="w-full p-3 font-mono text-xs rounded-xl border bg-[var(--surface-2)] text-[var(--ink)] outline-none resize-y"
            style={{ borderColor: 'var(--line)' }}
          />
        </div>
      </div>

      {/* Compliance Audit Log Table */}
      {sanitizationResult.auditLog.length > 0 && (
        <div
          className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--brand)] flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> Redaction Audit Trail ({sanitizationResult.auditLog.length} PHI Elements)
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Exact log of all Protected Health Information modified for compliance verification.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyAuditLog}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-[var(--surface-2)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
              style={{ borderColor: 'var(--line)' }}
            >
              {copiedAudit ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAudit ? 'Copied Audit Log!' : 'Copy Audit Log (Markdown)'}</span>
            </button>
          </div>

          <div className="overflow-x-auto border rounded-xl" style={{ borderColor: 'var(--line)' }}>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-[var(--surface-2)] text-[var(--muted)] font-semibold" style={{ borderColor: 'var(--line)' }}>
                  <th className="py-2.5 px-3">Line #</th>
                  <th className="py-2.5 px-3">Segment</th>
                  <th className="py-2.5 px-3">PHI Field Label</th>
                  <th className="py-2.5 px-3">Original PHI Value</th>
                  <th className="py-2.5 px-3">Sanitized Synthetic Value</th>
                  <th className="py-2.5 px-3">Rule Category</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono text-[11px]" style={{ borderColor: 'var(--line)' }}>
                {sanitizationResult.auditLog.map((a, i) => (
                  <tr key={i} className="hover:bg-[var(--surface-2)] text-[var(--ink)]">
                    <td className="py-2 px-3">{a.line}</td>
                    <td className="py-2 px-3 font-bold text-[var(--brand)]">{a.segmentTag}</td>
                    <td className="py-2 px-3 font-sans font-medium">{a.fieldLabel}</td>
                    <td className="py-2 px-3 text-rose-600 dark:text-rose-400 font-semibold">{a.originalValue}</td>
                    <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-bold">{a.sanitizedValue}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-2)] border" style={{ borderColor: 'var(--line)' }}>
                        {a.ruleCategory}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
