import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeftRight, Upload, Trash2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface EdiAckGeneratorProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

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
  const [ackType, setAckType] = useState<'x12_997' | 'edifact_contrl'>('x12_997');
  const [ackStatus, setAckStatus] = useState<'A' | 'E' | 'R'>('A'); // A = Accepted, E = Accepted with Errors, R = Rejected
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
  }>({});

  // Parse input EDI and generate 997 or CONTRL
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
    const transactions: { id: string; ctrl: string }[] = [];

    segments.forEach((seg) => {
      const parts = seg.split(elemSep);
      const tag = parts[0]?.toUpperCase();

      if (tag === 'ISA' && parts.length >= 16) {
        senderQual = parts[7]?.trim() || 'ZZ';
        sender = parts[8]?.trim() || 'RECEIVER';
        receiverQual = parts[5]?.trim() || 'ZZ';
        receiver = parts[6]?.trim() || 'SENDER';
        interchangeCtrl = parts[13]?.trim() || '000000001';
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

    setAutoDetectDetails({
      senderId: sender,
      receiverId: receiver,
      groupType,
      groupCtrl,
      transId: transactions[0]?.id,
      transCtrl: transactions[0]?.ctrl,
      interchangeCtrl,
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

    if (ackType === 'x12_997') {
      // ANSI X12 997 Functional Acknowledgment
      const paddedSender = sender.padEnd(15, ' ').slice(0, 15);
      const paddedReceiver = receiver.padEnd(15, ' ').slice(0, 15);
      const paddedSenderQual = senderQual.padEnd(2, ' ').slice(0, 2);
      const paddedReceiverQual = receiverQual.padEnd(2, ' ').slice(0, 2);

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
      // Count segments between ST and SE inclusive
      // ST, AK1, (AK2, AK5)*N, AK9, SE -> 3 + 2*N + 1 = 4 + 2*N
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
      transactions.forEach((tx, idx) => {
        outSegments.push(`UCM+${tx.ctrl}+${tx.id}:D:96A:UN+${ackStatus === 'A' ? '7' : '4'}'`);
      });
      outSegments.push(`UNT*${3 + transactions.length}*1'`);
      outSegments.push(`UNZ+1+${newAckCtrl}'`);

      setGeneratedAck(outSegments.join('\n'));
    }
  }, [inputEdi, ackType, ackStatus, delimiter, elementSep]);

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
    a.download = ackType === 'x12_997' ? 'Acknowledgment_997.edi' : 'CONTRL.edi';
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
              onClick={() => setAckStatus('A')}
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
              onClick={() => setAckStatus('R')}
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
            <span>{copied ? 'Copied 997!' : 'Copy 997'}</span>
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
              GENERATED {ackType === 'x12_997' ? 'EDI 997 ACKNOWLEDGMENT' : 'EDIFACT CONTRL'}
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
