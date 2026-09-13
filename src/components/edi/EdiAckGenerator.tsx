import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { ToolShell } from './ToolShell';
import { EDI_TRANSACTIONS } from '../../data/ediDictionary';
import { maskEdiPhi } from '../../lib/ediPhiMasker';
import { downloadFile } from '../../lib/smartDownload';

interface EdiAckGeneratorProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

type AckType = 'x12_997' | 'x12_ta1' | 'edifact_contrl';
type AckStatus = 'A' | 'E' | 'R';

const TA1_NOTE_CODES = [
  { code: '000', label: '000 – No Error Reported', desc: 'Interchange control structure accepted successfully.' },
  { code: '001', label: '001 – Control Number Mismatch (ISA13 != IEA02)', desc: 'Interchange Control Number in the Header and Trailer do not agree.' },
  { code: '002', label: '002 – Standard Not Supported', desc: 'The EDI standard noted in the control header is not supported.' },
  { code: '003', label: '003 – Control Version Not Supported', desc: 'The version/release of the controls (ISA12) is not supported.' },
  { code: '004', label: '004 – Segment Terminator Invalid', desc: 'Interchange segment terminator is invalid or missing.' },
  { code: '005', label: '005 – Invalid Interchange ID', desc: 'Sender or Receiver ID Qualifier (ISA05/ISA07) or ID value is unknown.' },
  { code: '006', label: '006 – Invalid Data Element Separator', desc: 'Data element separator (ISA byte 4) is invalid.' },
  { code: '010', label: '010 – Invalid Authorization Qualifier', desc: 'Authorization Information Qualifier value in ISA01 is invalid.' },
  { code: '012', label: '012 – Invalid Security Qualifier', desc: 'Security Information Qualifier value in ISA03 is invalid.' },
  { code: '024', label: '024 – Invalid Date or Time', desc: 'Interchange Date or Time value in ISA09 or ISA10 is invalid.' },
];

const SAMPLE_850_INPUT = `ISA*00*          *00*          *ZZ*ACMESUPPLY     *ZZ*GLOBALBUYER    *260903*1430*U*00401*000000123*0*P*>~
GS*PO*ACMESUPPLY*GLOBALBUYER*20260903*1430*5001*X*004010~
ST*850*0001~
BEG*00*NE*PO-987654**20260903~
N1*ST*EAST DISTRIBUTION CENTER*92*104~
PO1*1*50*EA*18.50**VN*PROD-A101~
CTT*1*50~
SE*7*0001~
GE*1*5001~
IEA*1*000000123~`;

export const EdiAckGenerator: React.FC<EdiAckGeneratorProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [inputEdi, setInputEdi] = useState<string>(initialInput || SAMPLE_850_INPUT);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('850');
  const [ackType, setAckType] = useState<AckType>('x12_997');
  const [ackStatus, setAckStatus] = useState<AckStatus>('A');
  const [ta1NoteCode, setTa1NoteCode] = useState<string>('000');
  const [delimiter, setDelimiter] = useState<string>('~');
  const [elementSep, setElementSep] = useState<string>('*');
  const [isPhiMasked, setIsPhiMasked] = useState<boolean>(false);
  const [generatedAck, setGeneratedAck] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const [autoDetectDetails, setAutoDetectDetails] = useState<{
    senderId?: string;
    receiverId?: string;
    groupType?: string;
    groupCtrl?: string;
    transId?: string;
    transCtrl?: string;
    interchangeCtrl?: string;
    interchangeDate?: string;
    interchangeTime?: string;
    hasIsaMismatch?: boolean;
  }>({});

  // Mask PHI dynamically if enabled
  const phiInfo = useMemo(() => maskEdiPhi(inputEdi), [inputEdi]);
  const activeInput = isPhiMasked ? phiInfo.maskedEdi : inputEdi;

  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    const txn = EDI_TRANSACTIONS.find((t) => t.id === sampleId);
    if (txn && txn.samplePayload) {
      setInputEdi(txn.samplePayload);
    }
  };

  // Generate Acknowledgment on input change
  useEffect(() => {
    const raw = activeInput.trim();
    if (!raw) {
      setGeneratedAck('');
      setAutoDetectDetails({});
      return;
    }

    let segTerm = delimiter;
    let elemSep = elementSep;

    if (raw.startsWith('ISA') && raw.length >= 106) {
      elemSep = raw[3];
      const termChar = raw[105];
      if (termChar && !/\s/.test(termChar)) {
        segTerm = termChar;
      }
    } else if (raw.includes('~')) {
      segTerm = '~';
      elemSep = '*';
    } else if (raw.includes("'")) {
      segTerm = "'";
      elemSep = '+';
    }

    const segments = (segTerm === '\n' ? raw.split(/\r?\n/) : raw.split(segTerm))
      .map((s) => s.trim())
      .filter(Boolean);

    let sender = 'RECEIVERID     ';
    let receiver = 'SENDERID       ';
    let senderQual = 'ZZ';
    let receiverQual = 'ZZ';
    let groupType = 'PO';
    let groupCtrl = '1';
    let interchangeCtrl = '000000001';
    let interchangeDate = '260903';
    let interchangeTime = '1430';
    let ieaCtrl = '';
    const transactions: { id: string; ctrl: string }[] = [];

    segments.forEach((seg) => {
      const parts = seg.split(elemSep);
      const tag = parts[0]?.toUpperCase();

      if (tag === 'ISA' && parts.length >= 16) {
        senderQual = parts[7]?.trim() || 'ZZ';
        sender = parts[8]?.trim() || 'RECEIVER';
        receiverQual = parts[5]?.trim() || 'ZZ';
        receiver = parts[6]?.trim() || 'SENDER';
        interchangeDate = parts[9]?.trim() || '260903';
        interchangeTime = parts[10]?.trim() || '1430';
        interchangeCtrl = parts[13]?.trim() || '000000001';
      } else if (tag === 'IEA' && parts.length >= 3) {
        ieaCtrl = parts[2]?.trim() || '';
      } else if (tag === 'GS' && parts.length >= 7) {
        groupType = parts[1] || 'PO';
        groupCtrl = parts[6] || '1';
      } else if (tag === 'ST' && parts.length >= 3) {
        transactions.push({
          id: parts[1] || '850',
          ctrl: parts[2] || '0001',
        });
      }
    });

    if (transactions.length === 0) {
      transactions.push({ id: '850', ctrl: '0001' });
    }

    const hasMismatch = Boolean(ieaCtrl && interchangeCtrl && ieaCtrl !== interchangeCtrl);

    setAutoDetectDetails({
      senderId: sender,
      receiverId: receiver,
      groupType,
      groupCtrl,
      transId: transactions[0]?.id,
      transCtrl: transactions[0]?.ctrl,
      interchangeCtrl,
      interchangeDate,
      interchangeTime,
      hasIsaMismatch: hasMismatch,
    });

    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ccyymmdd = `${now.getFullYear()}${mm}${dd}`;
    const yymmdd = `${yy}${mm}${dd}`;
    const hhmm = `${hh}${min}`;
    const newAckCtrl = String(Math.floor(100000 + Math.random() * 900000));

    const paddedSender = sender.padEnd(15, ' ').slice(0, 15);
    const paddedReceiver = receiver.padEnd(15, ' ').slice(0, 15);
    const paddedSenderQual = senderQual.padEnd(2, ' ').slice(0, 2);
    const paddedReceiverQual = receiverQual.padEnd(2, ' ').slice(0, 2);

    if (ackType === 'x12_ta1') {
      const outSegments: string[] = [];
      outSegments.push(
        `ISA*00*          *00*          *${paddedSenderQual}*${paddedSender}*${paddedReceiverQual}*${paddedReceiver}*${yymmdd}*${hhmm}*U*00401*${newAckCtrl.padStart(9, '0')}*0*P*>`
      );
      outSegments.push(
        `TA1*${interchangeCtrl.padStart(9, '0')}*${interchangeDate}*${interchangeTime}*${ackStatus}*${ta1NoteCode}`
      );
      outSegments.push(`IEA*0*${newAckCtrl.padStart(9, '0')}`);
      setGeneratedAck(outSegments.join(segTerm === '\n' ? '\n' : `${segTerm}\n`) + (segTerm !== '\n' ? segTerm : ''));
    } else if (ackType === 'x12_997') {
      const outSegments: string[] = [];
      outSegments.push(
        `ISA*00*          *00*          *${paddedSenderQual}*${paddedSender}*${paddedReceiverQual}*${paddedReceiver}*${yymmdd}*${hhmm}*U*00401*${newAckCtrl.padStart(9, '0')}*0*P*>`
      );
      outSegments.push(`GS*FA*${sender.trim()}*${receiver.trim()}*${ccyymmdd}*${hhmm}*${newAckCtrl}*X*004010`);
      outSegments.push(`ST*997*0001`);
      outSegments.push(`AK1*${groupType}*${groupCtrl}`);

      transactions.forEach((tx) => {
        outSegments.push(`AK2*${tx.id}*${tx.ctrl}`);
        outSegments.push(`AK5*${ackStatus}`);
      });

      const includedSets = transactions.length;
      const receivedSets = transactions.length;
      const acceptedSets = ackStatus === 'A' ? transactions.length : ackStatus === 'E' ? transactions.length : 0;

      outSegments.push(`AK9*${ackStatus}*${includedSets}*${receivedSets}*${acceptedSets}`);
      const seCount = 4 + transactions.length * 2;
      outSegments.push(`SE*${seCount}*0001`);
      outSegments.push(`GE*1*${newAckCtrl}`);
      outSegments.push(`IEA*1*${newAckCtrl.padStart(9, '0')}`);

      setGeneratedAck(outSegments.join(segTerm === '\n' ? '\n' : `${segTerm}\n`) + (segTerm !== '\n' ? segTerm : ''));
    } else {
      const outSegments: string[] = [];
      outSegments.push(`UNB+UNOA:2+${sender.trim()}:ZZZ+${receiver.trim()}:ZZZ+${yymmdd}:${hhmm}+${newAckCtrl}'`);
      outSegments.push(`UNH+1+CONTRL:D:4:UN'`);
      outSegments.push(`UCI+${interchangeCtrl}+${receiver.trim()}:ZZZ+${sender.trim()}:ZZZ+${ackStatus === 'A' ? '7' : '4'}'`);
      transactions.forEach((tx) => {
        outSegments.push(`UCM+${tx.ctrl}+${tx.id}:D:96A:UN+${ackStatus === 'A' ? '7' : '4'}'`);
      });
      outSegments.push(`UNT+${3 + transactions.length}+1'`);
      outSegments.push(`UNZ+1+${newAckCtrl}'`);

      setGeneratedAck(outSegments.join('\n'));
    }
  }, [activeInput, ackType, ackStatus, ta1NoteCode, delimiter, elementSep]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedAck);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${ackType}_acknowledgment_${ackStatus}.edi`;
    downloadFile({ file: generatedAck, filename, mimeType: 'text/plain;charset=utf-8' });
  };

  const generatedSegmentsCount = generatedAck ? generatedAck.split('\n').filter(Boolean).length : 0;

  return (
    <div className="space-y-6">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={() => {
          setInputEdi(SAMPLE_850_INPUT);
          setAckType('x12_997');
          setAckStatus('A');
          setTa1NoteCode('000');
        }}
        resetLabel="Reset Defaults"
      />

      <ToolShell
        title="EDI 997 & TA1 Acknowledgment Generator"
        description="Instant reversal and generation of ANSI X12 997 Functional Acknowledgments, TA1 Interchange Envelope Acknowledgments, and EDIFACT CONTRL messages."
        badge="Zero-Data-Loss"
        selectedSampleId={selectedSampleId}
        onSelectSample={handleSelectSample}
        isPhiMasked={isPhiMasked}
        onTogglePhiMask={setIsPhiMasked}
        maskedPhiCount={phiInfo.maskedCount}
        segmentTerminator={delimiter}
        elementSeparator={elementSep}
        onClear={() => setInputEdi('')}
        onResetSample={() => setInputEdi(SAMPLE_850_INPUT)}
        hasInput={Boolean(inputEdi.trim())}
        secondaryActions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border p-0.5" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <button
                onClick={() => setAckType('x12_997')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  ackType === 'x12_997' ? 'bg-white dark:bg-slate-700 shadow-xs text-[var(--brand)] font-bold' : 'text-[var(--muted)]'
                }`}
              >
                997 (FA)
              </button>
              <button
                onClick={() => {
                  setAckType('x12_ta1');
                  if (autoDetectDetails.hasIsaMismatch) {
                    setTa1NoteCode('001');
                    setAckStatus('R');
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  ackType === 'x12_ta1' ? 'bg-white dark:bg-slate-700 shadow-xs text-[var(--brand)] font-bold' : 'text-[var(--muted)]'
                }`}
              >
                <span>TA1 (Interchange)</span>
              </button>
              <button
                onClick={() => setAckType('edifact_contrl')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  ackType === 'edifact_contrl' ? 'bg-white dark:bg-slate-700 shadow-xs text-[var(--brand)] font-bold' : 'text-[var(--muted)]'
                }`}
              >
                CONTRL
              </button>
            </div>

            <div className="flex rounded-xl border p-0.5" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <button
                onClick={() => {
                  setAckStatus('A');
                  if (ackType === 'x12_ta1' && ta1NoteCode !== '000') setTa1NoteCode('000');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  ackStatus === 'A' ? 'bg-emerald-500 text-white shadow-xs' : 'text-[var(--muted)]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accepted (A)</span>
              </button>
              <button
                onClick={() => setAckStatus('E')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  ackStatus === 'E' ? 'bg-amber-500 text-white shadow-xs' : 'text-[var(--muted)]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Errors (E)</span>
              </button>
              <button
                onClick={() => {
                  setAckStatus('R');
                  if (ackType === 'x12_ta1' && ta1NoteCode === '000') setTa1NoteCode('001');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  ackStatus === 'R' ? 'bg-rose-500 text-white shadow-xs' : 'text-[var(--muted)]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Rejected (R)</span>
              </button>
            </div>
          </div>
        }
        leftPaneTitle="Inbound Source EDI"
        leftPaneBadge={
          autoDetectDetails.transId ? (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--brand)] border border-[var(--line)]">
              {autoDetectDetails.groupType} / {autoDetectDetails.transId}
            </span>
          ) : undefined
        }
        leftPaneActions={
          <div className="flex items-center gap-2">
            <label className="cursor-pointer hover:opacity-80 flex items-center gap-1 text-[var(--muted)] text-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
              <input
                type="file"
                accept=".edi,.txt,.x12"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      if (typeof evt.target?.result === 'string') {
                        setInputEdi(evt.target.result);
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setInputEdi('')}
              disabled={!inputEdi}
              className="hover:opacity-80 text-rose-500 disabled:opacity-40 flex items-center gap-1 text-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        }
        leftPaneContent={
          <div className="flex flex-col h-full space-y-3">
            {/* Auto-detected Envelope summary */}
            <div
              className="p-3 rounded-xl border text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <div>
                <span className="text-[var(--muted)] block text-[10px] uppercase">Ack Sender</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate block">
                  {autoDetectDetails.senderId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[var(--muted)] block text-[10px] uppercase">Ack Receiver</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400 truncate block">
                  {autoDetectDetails.receiverId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[var(--muted)] block text-[10px] uppercase">Group (GS01)</span>
                <span className="font-semibold">
                  {autoDetectDetails.groupType || 'N/A'} #{autoDetectDetails.groupCtrl || '1'}
                </span>
              </div>
              <div>
                <span className="text-[var(--muted)] block text-[10px] uppercase">Transaction (ST)</span>
                <span className="font-semibold">
                  {autoDetectDetails.transId || 'N/A'} #{autoDetectDetails.transCtrl || '0001'}
                </span>
              </div>
            </div>

            <textarea
              value={activeInput}
              onChange={(e) => setInputEdi(e.target.value)}
              rows={16}
              className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              placeholder="Paste raw inbound EDI message here (e.g. 850, 810, 856, ORDERS)..."
            />
          </div>
        }
        rightPaneTitle={
          ackType === 'x12_ta1'
            ? 'TA1 Interchange Acknowledgment'
            : ackType === 'x12_997'
            ? '997 Functional Acknowledgment'
            : 'EDIFACT CONTRL Message'
        }
        rightPaneBadge={
          <span
            className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
              ackStatus === 'A'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : ackStatus === 'E'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            Status: {ackStatus === 'A' ? 'ACCEPTED' : ackStatus === 'E' ? 'ERRORS' : 'REJECTED'}
          </span>
        }
        rightPaneActions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!generatedAck}
              className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-all disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!generatedAck}
              className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-all disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        }
        rightPaneContent={
          <div className="flex flex-col h-full space-y-3">
            {ackType === 'x12_ta1' && (
              <div
                className="p-3 rounded-xl border text-xs space-y-2"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                    TA105 Interchange Note Code:
                  </span>
                  <select
                    value={ta1NoteCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setTa1NoteCode(code);
                      if (code === '000') setAckStatus('A');
                      else setAckStatus('R');
                    }}
                    className="p-1 rounded-lg border text-xs font-mono outline-none"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  >
                    {TA1_NOTE_CODES.map((n) => (
                      <option key={n.code} value={n.code}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-[var(--muted)]">
                  {TA1_NOTE_CODES.find((c) => c.code === ta1NoteCode)?.desc}
                </p>
              </div>
            )}

            <textarea
              readOnly
              value={generatedAck}
              rows={16}
              className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y bg-emerald-50/10 dark:bg-emerald-950/10"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              placeholder="Generated acknowledgment segments will appear here..."
            />
          </div>
        }
        statusBarMetrics={{
          segmentCount: generatedSegmentsCount,
          encodingStandard: ackType === 'edifact_contrl' ? 'UN/EDIFACT' : 'ANSI ASC X12',
          functionalGroup: ackType === 'x12_ta1' ? 'Interchange (TA1)' : ackType === 'x12_997' ? 'FA (997)' : 'CONTRL',
          complianceStatus: ackStatus === 'A' ? 'valid' : ackStatus === 'E' ? 'warning' : 'error',
          customMessage: `${ackStatus === 'A' ? 'Accepted' : ackStatus === 'E' ? 'Errors Reported' : 'Rejected'} (${generatedSegmentsCount} segments generated)`,
        }}
      />
    </div>
  );
};
