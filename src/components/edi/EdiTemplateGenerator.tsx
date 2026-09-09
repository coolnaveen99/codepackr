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
  Send,
  Layers,
  CheckCircle2,
  X,
  Trash2,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { EDI_TRANSACTIONS, EdiTransactionDefinition } from '../../data/ediDictionary';

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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('860');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [senderId, setSenderId] = useState<string>('BUYER_RETAIL');
  const [receiverId, setReceiverId] = useState<string>('ACME_SUPPLIER');
  const [senderQual, setSenderQual] = useState<string>('ZZ');
  const [receiverQual, setReceiverQual] = useState<string>('ZZ');
  const [docNumber, setDocNumber] = useState<string>('PO-2026-9901');
  const [itemCount, setItemCount] = useState<number>(2);
  const [elemSep, setElemSep] = useState<string>('*');
  const [segTerm, setSegTerm] = useState<string>('~');
  const [copied, setCopied] = useState<boolean>(false);

  // Categories list
  const categories = ['All', 'Supply Chain & Retail', 'Logistics & Warehousing', 'Manufacturing & Automotive', 'Finance & Healthcare', 'Administrative & Acknowledgment'];

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
    const hhmm = `${hh}${min}`;
    const ctrl = '000000001';

    const pSender = senderId.padEnd(15, ' ').slice(0, 15);
    const pReceiver = receiverId.padEnd(15, ' ').slice(0, 15);
    const pSQual = senderQual.padEnd(2, ' ').slice(0, 2);
    const pRQual = receiverQual.padEnd(2, ' ').slice(0, 2);
    const sep = elemSep || '*';
    const term = segTerm || '~';

    // If the template has sample payload, we customize sender, receiver, dates, docNumber, and separators
    const base = currentTransaction.samplePayload;

    if (currentTransaction.standard === 'EDIFACT') {
      let customized = base
        .replace(/BUYER_GLOBAL/g, receiverId.trim())
        .replace(/ACME_GLOBAL/g, senderId.trim())
        .replace(/ORD-2026-8801/g, docNumber)
        .replace(/INV-2026-7701/g, docNumber)
        .replace(/DES-2026-9901/g, docNumber)
        .replace(/260904/g, yymmdd)
        .replace(/20260904/g, ccyymmdd);
      return customized;
    }

    // X12 Customization
    const lines = base.split('\n').map((rawLine) => {
      let l = rawLine.trim().replace(/~$/, '');
      if (!l) return '';

      const parts = l.split('*');
      const tag = parts[0];

      if (tag === 'ISA') {
        parts[5] = pSQual;
        parts[6] = pSender;
        parts[7] = pRQual;
        parts[8] = pReceiver;
        parts[9] = yymmdd;
        parts[10] = hhmm;
        return parts.join(sep);
      }
      if (tag === 'GS') {
        parts[2] = senderId.trim();
        parts[3] = receiverId.trim();
        parts[4] = ccyymmdd;
        parts[5] = hhmm;
        return parts.join(sep);
      }
      if (tag === 'BEG' || tag === 'BIG' || tag === 'BCH' || tag === 'BCA' || tag === 'BAK' || tag === 'BSN' || tag === 'B2') {
        // Update document number if present
        if (parts[3]) parts[3] = docNumber;
        return parts.join(sep);
      }
      if (tag === 'N1' && (parts[1] === 'ST' || parts[1] === 'BY' || parts[1] === 'BT')) {
        parts[2] = `${receiverId.trim()} FACILITY`;
        return parts.join(sep);
      }
      if (tag === 'N1' && (parts[1] === 'SF' || parts[1] === 'SU' || parts[1] === 'VN' || parts[1] === 'RE')) {
        parts[2] = `${senderId.trim()} OPERATIONS`;
        return parts.join(sep);
      }

      // Default replacement of delimiter
      return parts.join(sep);
    }).filter(Boolean);

    return lines.map((l) => `${l}${term}`).join('\n');
  }, [currentTransaction, senderId, receiverId, senderQual, receiverQual, docNumber, elemSep, segTerm]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEdi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedEdi], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTransaction.code}_sample.edi`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetToDefaults = () => {
    setSelectedTemplate('850');
    setSenderId('SENDERQUAL');
    setReceiverId('RECEIVERQUAL');
    setSenderQual('ZZ');
    setReceiverQual('ZZ');
    setDocNumber('PO-2026-9901');
    setItemCount(2);
    setElemSep('*');
    setSegTerm('~');
    setSelectedCategory('All');
    setSearchFilter('');
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleResetToDefaults}
        resetLabel="Reset to Defaults"
      />

      {/* Category Tabs & Search Bar */}
      <div
        className="p-4 rounded-2xl border space-y-3"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--brand)]" />
            <span className="font-semibold text-xs" style={{ color: 'var(--ink)' }}>
              EDI Transaction Standards Catalog ({EDI_TRANSACTIONS.length} Total Standards)
            </span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search 860, 856, 850, ASN, 204..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border outline-none font-medium"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCatActive
                    ? 'bg-[var(--brand)] text-white shadow-xs'
                    : 'border hover:opacity-80'
                }`}
                style={{
                  borderColor: isCatActive ? 'var(--brand)' : 'var(--line)',
                  backgroundColor: isCatActive ? 'var(--brand)' : 'var(--surface-2)',
                  color: isCatActive ? '#ffffff' : 'var(--ink)',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Transaction Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
          {filteredTransactions.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplate(tmpl.id);
                  if (tmpl.code.startsWith('850')) setDocNumber('PO-2026-9901');
                  else if (tmpl.code.startsWith('855')) setDocNumber('PO-2026-9901');
                  else if (tmpl.code.startsWith('860')) setDocNumber('PO-2026-9901');
                  else if (tmpl.code.startsWith('856')) setDocNumber('ASN-2026-1102');
                  else if (tmpl.code.startsWith('810')) setDocNumber('INV-2026-4401');
                  else if (tmpl.code.startsWith('204')) setDocNumber('LOAD-99441');
                  else if (tmpl.code.startsWith('214')) setDocNumber('LOAD-99441');
                  else if (tmpl.code.startsWith('846')) setDocNumber('STK-2026-09');
                  else if (tmpl.code.startsWith('820')) setDocNumber('PAY-55019');
                  else if (tmpl.code.startsWith('940')) setDocNumber('SO-2026-88901');
                  else if (tmpl.code.startsWith('837')) setDocNumber('CLM-99120');
                  else setDocNumber(`DOC-${tmpl.code}-1001`);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-[var(--brand)] shadow-sm' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--surface-2)' : 'var(--bg)',
                  borderColor: isSelected ? 'var(--brand)' : 'var(--line)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold" style={{ color: isSelected ? 'var(--brand)' : 'var(--ink)' }}>
                    {tmpl.code}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-[var(--line)] text-[var(--muted)]">
                    {tmpl.standard}
                  </span>
                </div>
                <div className="text-[11px] font-medium truncate" style={{ color: 'var(--ink)' }}>
                  {tmpl.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Transaction Details & Guide Card */}
      <div
        className="p-4 rounded-2xl border space-y-3"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm px-2 py-0.5 rounded bg-[var(--brand)] text-white">
                {currentTransaction.code}
              </span>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                {currentTransaction.name}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium border text-[var(--muted)]" style={{ borderColor: 'var(--line)' }}>
                Group: {currentTransaction.functionalGroup}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              {currentTransaction.description}
            </p>
          </div>

          <div className="text-xs font-medium px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border self-start sm:self-auto" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[var(--muted)]">Category: </span>
            <span className="font-semibold text-[var(--brand)]">{currentTransaction.category}</span>
          </div>
        </div>

        {/* Purpose & Key Segments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="md:col-span-2 p-3 rounded-xl bg-[var(--surface-2)] border" style={{ borderColor: 'var(--line)' }}>
            <span className="font-semibold block mb-1 text-[var(--ink)]">Business Purpose &amp; Usage:</span>
            <p className="text-[var(--muted)] leading-relaxed">
              {currentTransaction.purpose}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-2)] border" style={{ borderColor: 'var(--line)' }}>
            <span className="font-semibold block mb-1 text-[var(--ink)]">Key Envelope &amp; Loop Segments:</span>
            <div className="flex flex-wrap gap-1">
              {currentTransaction.keySegments.map((seg) => (
                <span
                  key={seg}
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg)] border font-semibold text-[var(--ink)]"
                  style={{ borderColor: 'var(--line)' }}
                >
                  {seg}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Parameter Customizer Bar */}
      <div
        className="p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase mb-1">
            Sender ID &amp; Qual
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={senderQual}
              onChange={(e) => setSenderQual(e.target.value.toUpperCase())}
              maxLength={2}
              className="w-10 p-2 rounded-lg border font-mono text-xs text-center uppercase font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value.toUpperCase())}
              maxLength={15}
              className="flex-1 p-2 rounded-lg border font-mono text-xs uppercase"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase mb-1">
            Receiver ID &amp; Qual
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={receiverQual}
              onChange={(e) => setReceiverQual(e.target.value.toUpperCase())}
              maxLength={2}
              className="w-10 p-2 rounded-lg border font-mono text-xs text-center uppercase font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <input
              type="text"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value.toUpperCase())}
              maxLength={15}
              className="flex-1 p-2 rounded-lg border font-mono text-xs uppercase"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase mb-1">
            Document / Reference #
          </label>
          <input
            type="text"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            className="w-full p-2 rounded-lg border font-mono text-xs"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase mb-1">
            Line Items Count
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={itemCount}
            onChange={(e) => setItemCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full p-2 rounded-lg border font-mono text-xs text-center"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted)] uppercase mb-1">
            Separators (* / ~)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={elemSep}
              onChange={(e) => setElemSep(e.target.value || '*')}
              maxLength={1}
              className="w-9 p-1.5 rounded-lg border font-mono text-xs text-center font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <input
              type="text"
              value={segTerm}
              onChange={(e) => setSegTerm(e.target.value || '~')}
              maxLength={1}
              className="w-9 p-1.5 rounded-lg border font-mono text-xs text-center font-bold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <span className="text-[11px] text-[var(--muted)]">Elem &amp; Seg</span>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: copied ? 'var(--ok)' : 'var(--brand)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy EDI'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl border font-semibold hover:opacity-80 transition-opacity cursor-pointer"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            title="Download .edi file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generated Code Area */}
      <div
        className="p-4 rounded-2xl border shadow-sm flex flex-col"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between mb-3 text-xs flex-wrap gap-2">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            LIVE GENERATED {currentTransaction.code} ({currentTransaction.standard}) DOCUMENT
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--muted)] font-mono">
              {generatedEdi.split('\n').filter(Boolean).length} Segments
            </span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              title={`Download ${currentTransaction.code} template`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .edi</span>
            </button>
          </div>
        </div>
        <textarea
          readOnly
          value={generatedEdi}
          rows={16}
          className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/20"
          style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
        />
      </div>
    </div>
  );
};
