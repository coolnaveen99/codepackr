import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, CornerDownLeft, EyeOff } from 'lucide-react';
import { TOOLS } from '../data/tools';
import { ToolDef } from '../types';
import { useToolGovernance } from '../lib/useToolGovernance';
import { useAdminAuth } from '../lib/useAdminAuth';
import { getIcon } from '../lib/icons';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolDef) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectTool }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isToolVisible, getToolStatus } = useToolGovernance();
  const { isAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredTools = TOOLS.filter((tool) => {
    if (!isToolVisible(tool.id, isAuthenticated)) return false;
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }).slice(0, 10);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredTools.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && filteredTools[selectedIndex]) {
      e.preventDefault();
      onSelectTool(filteredTools[selectedIndex]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div id="search-modal-backdrop" className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        id="search-modal-container"
        className="w-full max-w-2xl rounded-2xl border border-[color:var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[70vh] bg-[color:var(--surface)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-4 border-b border-[color:var(--border)] gap-3 bg-[color:var(--surface-elevated)]">
          <Search className="w-5 h-5 text-[color:var(--ink-muted)]" />
          <input
            id="search-modal-input"
            ref={inputRef}
            type="text"
            placeholder="Search tools, converters, or keywords..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-lg text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
          <kbd className="hidden sm:block text-xs font-mono px-2 py-1 rounded border border-[color:var(--border)] text-[color:var(--ink-muted)] bg-[color:var(--surface)]">
            ESC
          </kbd>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {filteredTools.length === 0 ? (
            <div className="p-8 text-center text-sm text-[color:var(--ink-muted)]">
              No tools matching "{query}"
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tool.id}
                  onClick={() => { onSelectTool(tool); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-[color:var(--brand-light)] border border-[color:var(--brand)]' : 'border border-transparent hover:bg-[color:var(--surface-elevated)]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)] flex items-center justify-center shrink-0 shadow-xs">
                      {getIcon(tool.icon, 20)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold text-base ${isSelected ? 'text-[color:var(--brand)]' : 'text-[color:var(--ink)]'}`}>
                          {tool.name}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[color:var(--surface-muted)] text-[color:var(--ink-muted)]">
                          {tool.category}
                        </span>
                        {getToolStatus(tool.id).status === 'hidden' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[color:var(--warning)]/10 text-[color:var(--warning)] border border-[color:var(--warning)]/30 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-[color:var(--ink-muted)] line-clamp-1">
                        {tool.description}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${isSelected ? 'text-[color:var(--brand)]' : 'text-[color:var(--ink-muted)]'}`}>
                    {isSelected && <CornerDownLeft className="w-4 h-4" />}
                    <ArrowRight className="w-5 h-5 opacity-50" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
