import React, { useState } from 'react';
import { FieldMapping } from '../../edi-core/models/canonical';
import { ArrowRight, Search, Copy, Check } from 'lucide-react';

interface LineageInspectorProps {
  mappings: FieldMapping[];
}

export const LineageInspector: React.FC<LineageInspectorProps> = ({ mappings }) => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const filtered = mappings.filter((m) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      m.outputField.toLowerCase().includes(term) ||
      m.sourceSegment.toLowerCase().includes(term) ||
      m.sourceElement.toLowerCase().includes(term) ||
      m.sourceValue.toLowerCase().includes(term) ||
      m.mappingRule.toLowerCase().includes(term)
    );
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(mappings, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 bg-[var(--bg)] border-b border-[var(--line)] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Field Mapping Lineage
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--line)] text-[var(--ink)] font-mono">
            {mappings.length} mappings
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--brand)] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />}
          <span>{copied ? 'Copied' : 'Export Lineage JSON'}</span>
        </button>
      </div>

      <div className="p-2 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mapped canonical fields or source elements..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
          />
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[var(--bg)]/80 text-[var(--muted)] sticky top-0 border-b border-[var(--line)]">
            <tr>
              <th className="p-2.5 font-medium">Canonical Field</th>
              <th className="p-2.5 font-medium">Source Segment</th>
              <th className="p-2.5 font-medium">Element</th>
              <th className="p-2.5 font-medium">Extracted Value</th>
              <th className="p-2.5 font-medium">Rule</th>
              <th className="p-2.5 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-xs text-[var(--muted)]">
                  No field mapping entries match the search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((m, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg)]/40 transition-colors">
                  <td className="p-2.5 font-mono text-[var(--brand)] font-medium whitespace-nowrap">
                    {m.outputField}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-[var(--ink)]">{m.sourceSegment}</td>
                  <td className="p-2.5 font-mono text-[var(--muted)]">{m.sourceElement}</td>
                  <td className="p-2.5 font-mono text-[var(--ink)] max-w-xs truncate" title={m.sourceValue}>
                    {m.sourceValue || '<empty>'}
                  </td>
                  <td className="p-2.5 text-[var(--muted)] max-w-xs truncate" title={m.mappingRule}>
                    {m.mappingRule}
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                        m.confidence === 'exact'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : m.confidence === 'inferred'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-zinc-500/10 text-zinc-500'
                      }`}
                    >
                      {m.confidence}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
