import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Globe, RefreshCw } from 'lucide-react';
import { useCurrency } from '../lib/CurrencyContext';

interface CurrencySelectorProps {
  idPrefix?: string;
  variant?: 'nav' | 'compact' | 'pill' | 'toolbar';
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  idPrefix = 'currency-picker',
  variant = 'nav',
  className = '',
}) => {
  const {
    currency,
    currencyCode,
    setCurrencyCode,
    conversionMode,
    setConversionMode,
    allCurrencies,
    popularCurrencies,
  } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredCurrencies = allCurrencies.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'nav' && (
        <button
          id={`${idPrefix}-nav-btn`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-[var(--brand)]"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: isOpen ? 'var(--brand)' : 'var(--line)',
            color: 'var(--ink)',
          }}
          title={`Global Currency: ${currency.name} (${currency.code})`}
        >
          <span className="text-sm leading-none" role="img" aria-label={currency.name}>
            {currency.flag}
          </span>
          <span className="font-mono font-bold text-[var(--brand)]">{currency.symbol.trim()}</span>
          <span className="font-semibold text-[11px] hidden sm:inline">{currency.code}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {variant === 'toolbar' && (
        <button
          id={`${idPrefix}-toolbar-btn`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 cursor-pointer hover:border-[var(--brand)] shadow-sm"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: isOpen ? 'var(--brand)' : 'var(--line)',
            color: 'var(--ink)',
          }}
          title="Change Global Currency"
        >
          <span className="text-sm leading-none">{currency.flag}</span>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-[var(--brand)] font-bold">{currency.symbol.trim()}</span>
            <span className="font-bold">{currency.code}</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {variant === 'compact' && (
        <button
          id={`${idPrefix}-compact-btn`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="px-2 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 cursor-pointer hover:border-[var(--brand)]"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: isOpen ? 'var(--brand)' : 'var(--line)',
            color: 'var(--ink)',
          }}
        >
          <span className="text-xs">{currency.flag}</span>
          <span className="font-mono font-bold text-[var(--brand)]">{currency.symbol.trim()}</span>
          <span className="text-[10px] text-[var(--muted)]">{currency.code}</span>
          <ChevronDown className="w-3 h-3 text-[var(--muted)]" />
        </button>
      )}

      {variant === 'pill' && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl border bg-[var(--surface-2)]" style={{ borderColor: 'var(--line)' }}>
            {popularCurrencies.slice(0, 5).map((pop) => (
              <button
                key={pop.code}
                id={`${idPrefix}-quick-${pop.code.toLowerCase()}`}
                onClick={() => setCurrencyCode(pop.code)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  currencyCode === pop.code
                    ? 'bg-[var(--brand)] text-white shadow-sm'
                    : 'text-[var(--ink)] hover:bg-[var(--surface)]'
                }`}
              >
                <span>{pop.flag}</span>
                <span className="font-mono font-bold">{pop.symbol.trim()}</span>
                <span className="text-[10px] opacity-80">{pop.code}</span>
              </button>
            ))}
            <button
              id={`${idPrefix}-more-btn`}
              onClick={() => setIsOpen(!isOpen)}
              className="px-2 py-1 rounded-lg text-xs font-medium border text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer flex items-center gap-1"
              style={{ borderColor: 'var(--line)' }}
              title="More Currencies"
            >
              <span>More...</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
            color: 'var(--ink)',
          }}
        >
          {/* Header */}
          <div className="p-3 border-b space-y-2.5" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--brand)]" />
                <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
                  Select Currency (All Calculators &amp; Tools)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
                {allCurrencies.length} Currencies
              </span>
            </div>

            {/* Conversion Mode Switcher */}
            <div
              className="p-1.5 rounded-xl border flex items-center justify-between text-[11px]"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <span className="text-[var(--muted)] font-medium pl-1 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Mode:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setConversionMode('face-value')}
                  className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    conversionMode === 'face-value'
                      ? 'bg-[var(--surface)] text-[var(--brand)] shadow-sm font-bold'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                  title="Keep number face value (e.g., $5,500 becomes €5,500)"
                >
                  Symbol Only
                </button>
                <button
                  onClick={() => setConversionMode('fx-convert')}
                  className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    conversionMode === 'fx-convert'
                      ? 'bg-[var(--brand)] text-white shadow-sm font-bold'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                  title="Convert via live baseline exchange rate (e.g., $5,500 becomes €5,060)"
                >
                  Live FX Convert
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search currency, code or symbol (e.g., EUR, €, Rupee)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none font-medium"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            {/* Quick Popular Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">
                Popular:
              </span>
              {popularCurrencies.map((pop) => (
                <button
                  key={pop.code}
                  onClick={() => {
                    setCurrencyCode(pop.code);
                    setIsOpen(false);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                    currencyCode === pop.code
                      ? 'bg-[var(--brand)] text-white border-transparent'
                      : 'hover:border-[var(--brand)] text-[var(--ink)]'
                  }`}
                  style={currencyCode === pop.code ? {} : { borderColor: 'var(--line)', backgroundColor: 'var(--bg)' }}
                >
                  {pop.flag} {pop.code} ({pop.symbol.trim()})
                </button>
              ))}
            </div>
          </div>

          {/* Currencies List */}
          <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-[var(--line)]">
            {filteredCurrencies.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--muted)]">
                No matching currencies found.
              </div>
            ) : (
              filteredCurrencies.map((c) => {
                const isSelected = c.code === currencyCode;
                return (
                  <button
                    key={c.code}
                    id={`${idPrefix}-item-${c.code.toLowerCase()}`}
                    onClick={() => {
                      setCurrencyCode(c.code);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-[var(--brand)]/10' : 'hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none" role="img" aria-label={c.name}>
                        {c.flag}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs" style={{ color: 'var(--ink)' }}>
                            {c.code}
                          </span>
                          <span className="font-mono font-bold text-xs text-[var(--brand)]">
                            ({c.symbol.trim()})
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--muted)] block leading-tight">
                          {c.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {conversionMode === 'fx-convert' && (
                        <span className="text-[10px] font-mono text-[var(--muted)]">
                          1 USD = {c.rateVsUsd} {c.code}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-[var(--brand)]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div
            className="p-2 text-center text-[10px] text-[var(--muted)] border-t"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            Changes currency symbol and formatting globally across all calculators and EDI reports.
          </div>
        </div>
      )}
    </div>
  );
};
