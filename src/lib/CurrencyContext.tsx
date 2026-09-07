import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CurrencyDefinition,
  CURRENCIES,
  POPULAR_CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  getCurrency,
  formatCurrencyAmount,
} from './currency';
import { safeLocalStorage } from './storage';

export type ConversionMode = 'face-value' | 'fx-convert';

interface CurrencyContextType {
  currency: CurrencyDefinition;
  currencyCode: string;
  setCurrencyCode: (code: string) => void;
  conversionMode: ConversionMode;
  setConversionMode: (mode: ConversionMode) => void;
  formatAmount: (amount: number, customDecimals?: number, includeCode?: boolean) => string;
  symbol: string;
  popularCurrencies: CurrencyDefinition[];
  allCurrencies: CurrencyDefinition[];
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const STORAGE_KEY_CODE = 'codepackr_currency_code';
const STORAGE_KEY_MODE = 'codepackr_currency_mode';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencyCode, setCurrencyCodeState] = useState<string>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEY_CODE);
    if (saved) return saved.toUpperCase();
    return DEFAULT_CURRENCY_CODE;
  });

  const [conversionMode, setConversionModeState] = useState<ConversionMode>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEY_MODE);
    if (saved === 'face-value' || saved === 'fx-convert') return saved;
    return 'face-value';
  });

  const currency = getCurrency(currencyCode);

  const setCurrencyCode = (code: string) => {
    const valid = getCurrency(code);
    setCurrencyCodeState(valid.code);
    safeLocalStorage.setItem(STORAGE_KEY_CODE, valid.code);
    if (typeof window !== 'undefined') {
      // Dispatch a custom storage event so all components react instantly if needed
      window.dispatchEvent(new CustomEvent('codepackr-currency-change', { detail: valid.code }));
    }
  };

  const setConversionMode = (mode: ConversionMode) => {
    setConversionModeState(mode);
    safeLocalStorage.setItem(STORAGE_KEY_MODE, mode);
  };

  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail !== currencyCode) {
        setCurrencyCodeState(detail);
      }
    };
    window.addEventListener('codepackr-currency-change', handleCustomChange);
    return () => window.removeEventListener('codepackr-currency-change', handleCustomChange);
  }, [currencyCode]);

  const formatAmount = (amount: number, customDecimals?: number, includeCode?: boolean): string => {
    return formatCurrencyAmount(amount, currency, {
      decimals: customDecimals,
      convertFromUsd: conversionMode === 'fx-convert',
      includeCode,
    });
  };

  const popularList = POPULAR_CURRENCIES.map((code) => getCurrency(code));

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyCode: currency.code,
        setCurrencyCode,
        conversionMode,
        setConversionMode,
        formatAmount,
        symbol: currency.symbol,
        popularCurrencies: popularList,
        allCurrencies: CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    const defaultCurr = getCurrency(DEFAULT_CURRENCY_CODE);
    return {
      currency: defaultCurr,
      currencyCode: defaultCurr.code,
      setCurrencyCode: () => {},
      conversionMode: 'face-value',
      setConversionMode: () => {},
      formatAmount: (amt, dec) =>
        formatCurrencyAmount(amt, defaultCurr, { decimals: dec, convertFromUsd: false }),
      symbol: defaultCurr.symbol,
      popularCurrencies: POPULAR_CURRENCIES.map(getCurrency),
      allCurrencies: CURRENCIES,
    };
  }
  return context;
};
