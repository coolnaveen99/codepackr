import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeftRight, Upload, Trash2, Info } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface EdiAckGeneratorProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

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
  const [inputEdi, setInputEdi] = useState(initialInput || SAMPLE_850_INPUT);
  const [generatedAck, setGeneratedAck] = useState('');
  const [ackType, setAckType] = useState<'x12_997' | 'x12_ta1' | 'edifact_contrl'>('x12_997');
  const [ackStatus, setAckStatus] = useState<'A' | 'E' | 'R'>('A'); // A = Accepted, E = Accepted with Errors, R = Rejected
  const [ta1NoteCode, setTa1NoteCode] = useState<string>('000');
  const [copied, setCopied] = useState(false);
  const [delimiter, setDelimiter] = useState('~');
  const [elementSep, setElementSep] = useState('*');
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

  // Parse input EDI and generate 997, TA1, or CONTRL
  useEffect(() => {
    if (!inputEdi.trim()) {
      setGeneratedAck('');
      return;
    }

    const trimmed = inputEdi.trim();
    // Auto-detect separators
    let elemSep = elementSep;
    let segTerm = delimiter;

    if (trimmed.startsWith('ISA') && trimmed.length >= 106) {
      elemSep = trimmed[3];
      const charAt105 = trimmed[105];
      if (charAt105 && !/\s/.test(charAt105)) {
        segTerm = charAt105;
      }
    } else if (trimmed.startsWith('UNB')) {
      elemSep = '+';
      segTerm = "'";
    }

    // Split segments
    const rawLines = segTerm === '\n' ? trimmed.split(/\r?\n/) : trimmed.split(segTerm);
    const segments = rawLines.map((s) => s.trim()).filter(Boolean);

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
      // ANSI X12 TA1 Interchange Acknowledgment
      const outSegments: string[] = [];
      outSegments.push(
        `ISA*00*          *00*          *${paddedSenderQual}*${paddedSender}*${paddedReceiverQual}*${paddedReceiver}*${yymmdd}*${hhmm}*U*00401*${newAckCtrl.padStart(9, '0')}*0*P*>`
      );
      outSegments.push(
        `TA1*${interchangeCtrl.padStart(9, '0')}*${interchangeDate}*${interchangeTime}*${ackStatus}*${ta1NoteCode}`
      );
      // Standalone TA1 contains 0 functional groups
      outSegments.push(`IEA*0*${newAckCtrl.padStart(9, '0')}`);

      setGeneratedAck(outSegments.join(segTerm === '\n' ? '\n' : `${segTerm}\n`));
    } else if (ackType === 'x12_997') {
      // ANSI X12 997 Functional Acknowledgment
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

      setGeneratedAck(outSegments.join(segTerm === '\n' ? '\n' : `${segTerm}\n`));
    } else {
      // EDIFACT CONTRL message
      const outSegments: string[] = [];
      outSegments.push(`UNB+UNOA:2+${sender.trim()}:ZZZ+${receiver.trim()}:ZZZ+${yymmdd}:${hhmm}+${newAckCtrl}'`);
      outSegments.push(`UNH+1+CONTRL:D:4:UN'`);
      outSegments.push(`UCI+${interchangeCtrl}+${receiver.trim()}:ZZZ+${sender.trim()}:ZZZ+${ackStatus === 'A' ? '7' : '4'}'`);
      transactions.forEach((tx) => {
        outSegments.push(`UCM+${tx.ctrl}+${tx.id}:D:96A:UN+${ackStatus === 'A' ? '7' : '4'}'`);
      });
      outSegments.push(`UNT*${3 + transactions.length}*1'`);
      outSegments.push(`UNZ+1+${newAckCtrl}'`);

      setGeneratedAck(outSegments.join('\n'));
    }
  }, [inputEdi, ackType, ackStatus, ta1NoteCode, delimiter, elementSep]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedAck);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedAck], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      ackType === 'x12_ta1'
        ? 'TA1_Interchange_Ack.edi'
        : ackType === 'x12_997'
        ? 'Acknowledgment_997.edi'
        : 'CONTRL.edi';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Control Banner */}
      <div
        className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold" style={{ color: 'var(--ink)' }}>
            Acknowledgment Type:
          </span>
          <div className="flex rounded-xl border p-0.5" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <button
              onClick={() => setAckType('x12_997')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                ackType === 'x12_997' ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--brand)]' : 'text-[var(--muted)]'
              }`}
            >
              ANSI X12 (997)
            </button>
            <button
              onClick={() => {
                setAckType('x12_ta1');
                if (autoDetectDetails.hasIsaMismatch) {
                  setTa1NoteCode('001');
                  setAckStatus('R');
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                ackType === 'x12_ta1' ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--brand)]' : 'text-[var(--muted)]'
              }`}
            >
              <span>TA1 Interchange Ack</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 font-bold">ISA</span>
            </button>
            <button
              onClick={() => setAckType('edifact_contrl')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                ackType === 'edifact_contrl' ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--brand)]' : 'text-[var(--muted)]'
              }`}
            >
              EDIFACT (CONTRL)
            </button>
          </div>

          <span className="font-semibold ml-2" style={{ color: 'var(--ink)' }}>
            Status:
          </span>
          <div className="flex rounded-xl border p-0.5" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <button
              onClick={() => {
                setAckStatus('A');
                if (ackType === 'x12_ta1' && ta1NoteCode !== '000') setTa1NoteCode('000');
              }}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                ackStatus === 'A' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--muted)]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Accepted (A)</span>
            </button>
            <button
              onClick={() => setAckStatus('E')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                ackStatus === 'E' ? 'bg-amber-500 text-white shadow-sm' : 'text-[var(--muted)]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>With Errors (E)</span>
            </button>
            <button
              onClick={() => {
                setAckStatus('R');
                if (ackType === 'x12_ta1' && ta1NoteCode === '000') setTa1NoteCode('001');
              }}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                ackStatus === 'R' ? 'bg-rose-500 text-white shadow-sm' : 'text-[var(--muted)]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Rejected (R)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputEdi(SAMPLE_850_INPUT)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Sample</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: copied ? 'var(--ok)' : 'var(--brand)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Ack!' : ackType === 'x12_ta1' ? 'Copy TA1' : ackType === 'x12_997' ? 'Copy 997' : 'Copy CONTRL'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* TA1 Specific Controls Banner */}
      {ackType === 'x12_ta1' && (
        <div
          className="p-4 rounded-2xl border space-y-3 text-xs"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                <span>TA105 Interchange Note Code</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  Level 1 (Envelope)
                </span>
              </span>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                TA1 acknowledges the outer ISA/IEA interchange envelope before functional group translation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[var(--muted)] font-medium">Quick Sim:</span>
              <button
                onClick={() => {
                  setTa1NoteCode('000');
                  setAckStatus('A');
                }}
                className="px-2.5 py-1 rounded-lg border font-medium hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                Clean Accept (000)
              </button>
              <button
                onClick={() => {
                  setTa1NoteCode('001');
                  setAckStatus('R');
                }}
                className="px-2.5 py-1 rounded-lg border font-medium text-rose-500 border-rose-500/30 hover:bg-rose-500/10 transition-colors"
              >
                Control Mismatch (001)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                Select Standard Interchange Note Code (TA105):
              </label>
              <select
                value={ta1NoteCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setTa1NoteCode(code);
                  if (code === '000') setAckStatus('A');
                  else setAckStatus('R');
                }}
                className="w-full p-2.5 rounded-xl border font-mono outline-none text-xs"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                {TA1_NOTE_CODES.map((n) => (
                  <option key={n.code} value={n.code}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="p-3 rounded-xl border flex items-start gap-2.5 text-xs"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <Info className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
              <div>
                <span className="font-semibold block" style={{ color: 'var(--ink)' }}>
                  Selected Error Description:
                </span>
                <p className="text-[var(--muted)] text-[11px] mt-0.5 leading-relaxed">
                  {TA1_NOTE_CODES.find((c) => c.code === ta1NoteCode)?.desc}
                </p>
              </div>
            </div>
          </div>

          {autoDetectDetails.hasIsaMismatch && (
            <div className="p-3 rounded-xl border flex items-center gap-2 text-xs bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Envelope Alert:</strong> Interchange Control Number mismatch detected between ISA13 and IEA02 trailer. Auto-flagged with Note Code 001 (Rejected).
              </span>
            </div>
          )}
        </div>
      )}

      {/* Detected Envelope Info */}
      <div
        className="p-3.5 rounded-xl border text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
      >
        <div>
          <span className="text-[var(--muted)] block text-[10px] uppercase">Ack Sender (Flipped)</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{autoDetectDetails.senderId || 'N/A'}</span>
        </div>
        <div>
          <span className="text-[var(--muted)] block text-[10px] uppercase">Ack Receiver (Flipped)</span>
          <span className="font-semibold text-sky-600 dark:text-sky-400">{autoDetectDetails.receiverId || 'N/A'}</span>
        </div>
        <div>
          <span className="text-[var(--muted)] block text-[10px] uppercase">Functional Group</span>
          <span className="font-semibold">{autoDetectDetails.groupType} (Ctrl: {autoDetectDetails.groupCtrl})</span>
        </div>
        <div>
          <span className="text-[var(--muted)] block text-[10px] uppercase">Transaction Set</span>
          <span className="font-semibold">{autoDetectDetails.transId} (Ctrl: {autoDetectDetails.transCtrl})</span>
        </div>
      </div>

      {/* Editor & Generator Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source EDI Document */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              INPUT EDI INTERCHANGE (PASTE 850, 810, 856...)
            </span>
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
                title="Clear EDI input"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
          <textarea
            value={inputEdi}
            onChange={(e) => setInputEdi(e.target.value)}
            rows={14}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Paste raw EDI here..."
          />
        </div>

        {/* Generated 997 Functional Acknowledgment */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              GENERATED{' '}
              {ackType === 'x12_ta1'
                ? 'TA1 INTERCHANGE ACKNOWLEDGMENT'
                : ackType === 'x12_997'
                ? 'EDI 997 ACKNOWLEDGMENT'
                : 'EDIFACT CONTRL'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!generatedAck}
                className="text-xs flex items-center gap-1 hover:opacity-80 text-[var(--brand)] font-medium disabled:opacity-40 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!generatedAck}
                className="text-xs flex items-center gap-1 hover:opacity-80 text-[var(--muted)] font-medium disabled:opacity-40 cursor-pointer"
                title="Download acknowledgment"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={generatedAck}
            rows={14}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/20"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>
    </div>
  );
};
