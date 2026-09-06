import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { TOOLS } from '../data/tools';
import { ToolDef } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolDef) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectTool }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredTools = TOOLS.filter((tool) => {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b gap-3" style={{ borderColor: 'var(--line)' }}>
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search all 70+ developer tools (e.g. json, edi, xml, jwt, uuid)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-base"
            style={{ color: 'var(--ink)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-xs px-2 py-0.5 rounded border text-gray-400" style={{ borderColor: 'var(--line)' }}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
              No tools matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tool.id}
                  id={`search-item-${tool.id}`}
                  onClick={() => {
                    onSelectTool(tool);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'shadow-sm' : ''
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--brand-light)' : 'transparent',
                    border: isSelected ? '1px solid var(--brand)' : '1px solid transparent',
                  }}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: isSelected ? 'var(--brand)' : 'var(--ink)' }}>
                        {tool.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--surface-3)', color: 'var(--muted)' }}
                      >
                        {tool.category}
                      </span>
                    </div>
                    <span className="text-xs line-clamp-1" style={{ color: 'var(--muted)' }}>
                      {tool.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: isSelected ? 'var(--brand)' : 'var(--muted)' }}>
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5" />}
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t text-[11px] flex items-center justify-between"
          style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)', color: 'var(--muted)' }}
        >
          <span>Navigate with &uarr; &darr;</span>
          <span>Press Enter to select</span>
          <span>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};
