import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  FileText,
  SlidersHorizontal,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  Layers,
  CheckCircle2,
  X,
  Trash2,
  Tag,
  Building2,
  Hash,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { ToolShell } from './ToolShell';
import { EDI_TRANSACTIONS, EdiTransactionDefinition } from '../../data/ediDictionary';
import { downloadFile } from '../../lib/smartDownload';

interface EdiTemplateGeneratorProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const EdiTemplateGenerator: React.FC<EdiTemplateGeneratorProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('850');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [senderId, setSenderId] = useState<string>('BUYER_RETAIL');
  const [receiverId, setReceiverId] = useState<string>('NORTHWIND_SUPPLY');
  const [senderQual, setSenderQual] = useState<string>('ZZ');
  const [receiverQual, setReceiverQual] = useState<string>('ZZ');
  const [docNumber, setDocNumber] = useState<string>('PO-2026-9901');
  const [elemSep, setElemSep] = useState<string>('*');
  const [segTerm, setSegTerm] = useState<string>('~');
  const [isPhiMasked, setIsPhiMasked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Categories list
  const categories = [
    'All',
    'Supply Chain & Retail',
    'Logistics & Warehousing',
    'Manufacturing & Automotive',
    'Finance & Healthcare',
    'Administrative & Acknowledgment',
  ];

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return EDI_TRANSACTIONS.filter((t) => {
      const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchSearch =
        !searchFilter.trim() ||
        t.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.functionalGroup.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchFilter]);

  // Current selected transaction definition
  const currentTransaction = useMemo<EdiTransactionDefinition>(() => {
    return EDI_TRANSACTIONS.find((t) => t.id === selectedTemplate) || EDI_TRANSACTIONS[0];
  }, [selectedTemplate]);

  // Dynamic EDI Generator adapting parameters to template
  const generatedEdi = useMemo(() => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const yymmdd = `${yy}${mm}${dd}`;
    const ccyymmdd = `${now.getFullYear()}${mm}${dd}`;

    const pSender = (isPhiMasked ? 'MASKED_SENDER' : senderId).padEnd(15, ' ').slice(0, 15);
    const pReceiver = (isPhiMasked ? 'MASKED_RCVR' : receiverId).padEnd(15, ' ').slice(0, 15);
    const pSQual = senderQual.padEnd(2, ' ').slice(0, 2);
    const pRQual = receiverQual.padEnd(2, ' ').slice(0, 2);

    const base = currentTransaction.samplePayload;

    if (currentTransaction.standard === 'EDIFACT') {
      let customized = base
        .replace(/BUYER_GLOBAL/g, receiverId.trim())
        .replace(/NORTHWIND_TRADING/g, senderId.trim())
        .replace(/ORD-2026-8801/g, docNumber)
        .replace(/INV-2026-7701/g, docNumber)
        .replace(/DES-2026-9901/g, docNumber)
        .replace(/260904/g, yymmdd)
        .replace(/20260904/g, ccyymmdd);
      return customized;
    }

    // ANSI X12 Customization
    const lines = base.split('~').map((l) => l.trim()).filter(Boolean);
    const customizedLines = lines.map((line) => {
      const parts = line.split('*');
      const tag = parts[0];

      if (tag === 'ISA') {
        parts[5] = pSQual;
        parts[6] = pSender;
        parts[7] = pRQual;
        parts[8] = pReceiver;
        parts[9] = yymmdd;
        parts[10] = `${hh}${min}`;
      } else if (tag === 'GS') {
        parts[2] = isPhiMasked ? 'MASKED_APP' : senderId.trim().slice(0, 15);
        parts[3] = isPhiMasked ? 'MASKED_APP' : receiverId.trim().slice(0, 15);
        parts[4] = ccyymmdd;
        parts[5] = `${hh}${min}`;
      } else if (['BEG', 'BIG', 'BHT', 'B4', 'B2', 'B3'].includes(tag)) {
        if (tag === 'BEG' && parts[3]) parts[3] = docNumber;
        if (tag === 'BIG' && parts[2]) parts[2] = docNumber;
        if (tag === 'BHT' && parts[3]) parts[3] = docNumber;
      }

      if (isPhiMasked && ['N1', 'NM1'].includes(tag)) {
        if (parts[2]) parts[2] = 'AUTHORIZED ENTITY LLC';
      }

      return parts.join(elemSep);
    });

    return customizedLines.join(`${segTerm}\n`) + segTerm;
  }, [
    currentTransaction,
    senderId,
    receiverId,
    senderQual,
    receiverQual,
    docNumber,
    elemSep,
    segTerm,
    isPhiMasked,
  ]);

  const handleSelectSamplePreset = (sampleId: string) => {
    setSelectedTemplate(sampleId);
    const tx = EDI_TRANSACTIONS.find((t) => t.id === sampleId);
    if (tx) {
      if (tx.standard === 'EDIFACT') {
        setElemSep('+');
        setSegTerm("'");
      } else {
        setElemSep('*');
        setSegTerm('~');
      }
    }
  };

  const handleCopy = () => {
    if (!generatedEdi) return;
    navigator.clipboard.writeText(generatedEdi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedEdi) return;
    downloadFile({
      file: generatedEdi,
      filename: `${currentTransaction.code}_template_${Date.now()}.edi`,
      mimeType: 'text/plain',
      expectedExtension: 'edi',
    });
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      <ToolShell
        selectedSampleId={selectedTemplate}
        onSelectSample={handleSelectSamplePreset}
        isPhiMasked={isPhiMasked}
        onTogglePhiMask={setIsPhiMasked}
        hasInput={true}
        segmentTerminator={segTerm}
        elementSeparator={elemSep}
        onSegmentTerminatorChange={setSegTerm}
        onElementSeparatorChange={setElemSep}
        leftPaneTitle="EDI TEMPLATE CONFIGURATOR"
        leftPaneBadge={
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--brand)] border border-[var(--line)]">
            {currentTransaction.code} ({currentTransaction.standard})
          </span>
        }
        leftPaneContent={
          <div className="space-y-4 text-xs">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === cat
                      ? 'border-[var(--brand)] text-[var(--brand)] bg-[var(--surface-2)]'
                      : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Template Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto p-1 rounded-xl border border-[var(--line)] bg-[var(--bg)]">
              {filteredTransactions.map((tx) => {
                const isSelected = selectedTemplate === tx.id;
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => handleSelectSamplePreset(tx.id)}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--brand)] bg-[var(--surface)] shadow-xs'
                        : 'border-[var(--line)] hover:border-[var(--brand)] bg-[var(--surface)] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-xs" style={{ color: isSelected ? 'var(--brand)' : 'var(--ink)' }}>
                        {tx.code}
                      </span>
                      <span className="text-[9px] font-mono text-[var(--muted)]">
                        {tx.standard}
                      </span>
                    </div>
                    <span className="text-[10px] truncate block text-[var(--muted)] mt-0.5">
                      {tx.name.replace(`${tx.code} `, '')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Parameter Fields */}
            <div className="space-y-3 pt-2 border-t border-[var(--line)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                    Sender ID (ISA06 / GS02)
                  </label>
                  <input
                    type="text"
                    value={senderId}
                    onChange={(e) => setSenderId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                    Receiver ID (ISA08 / GS03)
                  </label>
                  <input
                    type="text"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                    Sender Qual (ISA05)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={senderQual}
                    onChange={(e) => setSenderQual(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs text-center outline-none"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                    Receiver Qual (ISA07)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={receiverQual}
                    onChange={(e) => setReceiverQual(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs text-center outline-none"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">
                    Document Ref / Number
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        }
        rightPaneTitle="SYNTACTICALLY COMPLETE EDI TEMPLATE"
        rightPaneBadge={
          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {currentTransaction.functionalGroup} Loop
          </span>
        }
        rightPaneActions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 hover:opacity-80 cursor-pointer shadow-xs"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: copied ? 'var(--ok)' : 'var(--brand)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 hover:opacity-80 cursor-pointer shadow-xs"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              title="Download Template EDI"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        }
        rightPaneContent={
          <textarea
            readOnly
            value={generatedEdi}
            rows={16}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        }
        statusBarMetrics={{
          segmentCount: generatedEdi.split('\n').filter(Boolean).length,
          byteSize: new Blob([generatedEdi]).size,
          encodingStandard: currentTransaction.standard === 'EDIFACT' ? 'UN/EDIFACT' : 'ANSI ASC X12',
          functionalGroup: currentTransaction.functionalGroup,
          complianceStatus: 'valid',
          customMessage: `${currentTransaction.code} template generated`,
        }}
      />
    </div>
  );
};
