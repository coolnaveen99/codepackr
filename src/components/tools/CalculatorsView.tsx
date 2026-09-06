import React, { useState } from 'react';
import { Calculator as CalcIcon, Percent, Receipt, DollarSign, Calendar, ChevronDown, ChevronUp, PieChart } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { useCurrency } from '../../lib/CurrencyContext';
import { CurrencySelector } from '../CurrencySelector';

interface CalculatorsViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
}

export const CalculatorsView: React.FC<CalculatorsViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  // Scientific Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcFormula, setCalcFormula] = useState('');

  // Percentage Calculator State
  const [percX, setPercX] = useState(15);
  const [percY, setPercY] = useState(200);
  const [incFrom, setIncFrom] = useState(50);
  const [incTo, setIncTo] = useState(75);

  // Tip Calculator State
  const [billAmount, setBillAmount] = useState(85.50);
  const [tipPercent, setTipPercent] = useState(18);
  const [splitCount, setSplitCount] = useState(2);

  // Loan EMI Calculator State
  const [loanPrincipal, setLoanPrincipal] = useState(50000);
  const [loanRate, setLoanRate] = useState(6.5);
  const [loanYears, setLoanYears] = useState(5);
  const [showAmortization, setShowAmortization] = useState(false);

  // Global Currency Hook
  const { currency, formatAmount } = useCurrency();

  // Calc buttons helper
  const handleCalcButton = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
      setCalcFormula('');
    } else if (val === '=') {
      try {
        // Safe arithmetic eval
        const sanitized = (calcFormula + calcDisplay)
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/[^0-9+\-*/().]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(Number(res.toFixed(6))));
        setCalcFormula('');
      } catch {
        setCalcDisplay('Error');
      }
    } else if (['+', '-', '×', '÷'].includes(val)) {
      setCalcFormula((prev) => prev + calcDisplay + ' ' + val + ' ');
      setCalcDisplay('0');
    } else {
      setCalcDisplay((prev) => (prev === '0' ? val : prev + val));
    }
  };

  // Loan Math
  const monthlyRate = loanRate / 12 / 100;
  const totalMonths = loanYears * 12;
  const emi =
    monthlyRate > 0
      ? (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : loanPrincipal / totalMonths;
  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - loanPrincipal;

  // Tip Math
  const tipAmount = (billAmount * tipPercent) / 100;
  const totalBill = billAmount + tipAmount;
  const perPerson = splitCount > 0 ? totalBill / splitCount : totalBill;

  return (
    <div>
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {tool.id === 'calculator' && (
        <div className="max-w-md mx-auto p-6 rounded-2xl border shadow-lg"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          {/* Display */}
          <div className="p-4 rounded-xl mb-4 text-right overflow-hidden border"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="text-xs font-mono h-5 opacity-60 truncate">
              {calcFormula}
            </div>
            <div className="text-3xl font-mono font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
              {calcDisplay}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            {['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '%', '='].map(
              (btn) => (
                <button
                  key={btn}
                  onClick={() => handleCalcButton(btn)}
                  className={`py-3.5 rounded-xl font-mono text-base font-semibold transition-transform active:scale-95 border ${
                    btn === '='
                      ? 'bg-[var(--brand)] text-white col-span-1 shadow-md'
                      : ['+', '-', '×', '÷'].includes(btn)
                      ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                      : btn === 'C'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: btn === '=' ? 'var(--brand)' : undefined,
                    borderColor: 'var(--line)',
                  }}
                >
                  {btn}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {tool.id === 'percentage-calculator' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Form 1: What is X% of Y */}
          <div className="p-5 rounded-2xl border shadow-sm space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Percent className="w-4 h-4 text-[var(--brand)]" />
              <span>Calculate Percentage (What is X% of Y?)</span>
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm">What is</span>
              <input
                type="number"
                value={percX}
                onChange={(e) => setPercX(Number(e.target.value))}
                className="w-24 p-2 rounded-xl border text-center font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-sm">% of</span>
              <input
                type="number"
                value={percY}
                onChange={(e) => setPercY(Number(e.target.value))}
                className="w-28 p-2 rounded-xl border text-center font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-sm font-bold">=</span>
              <span className="text-xl font-bold font-mono px-3 py-1 rounded-xl"
                style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand)' }}
              >
                {((percX * percY) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Form 2: Increase / Decrease */}
          <div className="p-5 rounded-2xl border shadow-sm space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-500" />
              <span>Percentage Increase or Decrease</span>
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm">From</span>
              <input
                type="number"
                value={incFrom}
                onChange={(e) => setIncFrom(Number(e.target.value))}
                className="w-28 p-2 rounded-xl border text-center font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-sm">to</span>
              <input
                type="number"
                value={incTo}
                onChange={(e) => setIncTo(Number(e.target.value))}
                className="w-28 p-2 rounded-xl border text-center font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-sm font-bold">=</span>
              {incFrom !== 0 && (
                <span className={`text-xl font-bold font-mono px-3 py-1 rounded-xl ${
                  incTo >= incFrom ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {(((incTo - incFrom) / Math.abs(incFrom)) * 100).toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {tool.id === 'tip-calculator' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow-md space-y-5"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          {/* Quick Currency Selector Bar */}
          <div className="flex items-center justify-between pb-3 border-b flex-wrap gap-2" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Currency:
              </span>
              <span className="text-xs font-mono font-bold text-[var(--brand)] flex items-center gap-1">
                <span>{currency.flag}</span>
                <span>{currency.code} ({currency.symbol.trim()})</span>
              </span>
            </div>
            <CurrencySelector idPrefix="tip-currency" variant="pill" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                BILL AMOUNT ({currency.symbol.trim()})
              </label>
              <input
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                TIP PERCENTAGE ({tipPercent}%)
              </label>
              <input
                type="number"
                value={tipPercent}
                onChange={(e) => setTipPercent(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                SPLIT (PEOPLE)
              </label>
              <input
                type="number"
                value={splitCount}
                onChange={(e) => setSplitCount(Math.max(1, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div>
              <span className="text-xs text-gray-500 block">Total Tip</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatAmount(tipAmount)}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Total Bill</span>
              <span className="text-lg font-bold font-mono" style={{ color: 'var(--ink)' }}>
                {formatAmount(totalBill)}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Per Person</span>
              <span className="text-lg font-bold font-mono text-[var(--brand)]">
                {formatAmount(perPerson)}
              </span>
            </div>
          </div>
        </div>
      )}

      {tool.id === 'loan-calculator' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl border shadow-md space-y-5"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          {/* Quick Currency Selector Toolbar */}
          <div className="flex items-center justify-between pb-3 border-b flex-wrap gap-2" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Active Currency:
              </span>
              <span className="text-xs font-mono font-bold text-[var(--brand)] flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--brand)]/10">
                <span>{currency.flag}</span>
                <span>{currency.code} ({currency.symbol.trim()})</span>
                <span className="text-[10px] text-[var(--muted)] font-normal hidden sm:inline">— {currency.name}</span>
              </span>
            </div>
            <CurrencySelector idPrefix="loan-currency" variant="pill" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                PRINCIPAL AMOUNT ({currency.symbol.trim()})
              </label>
              <input
                type="number"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(Math.max(0, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none font-bold"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                ANNUAL INTEREST RATE (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={loanRate}
                onChange={(e) => setLoanRate(Math.max(0, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                TENURE (YEARS)
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={loanYears}
                onChange={(e) => setLoanYears(Math.max(1, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
            </div>
          </div>

          {/* KPI Cards with Currency Symbols */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl border"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="text-center p-2">
              <span className="text-xs font-medium text-gray-500 block mb-1">Monthly EMI</span>
              <span className="text-2xl font-extrabold font-mono text-[var(--brand)]">
                {formatAmount(emi)}
              </span>
            </div>
            <div className="text-center p-2 border-t sm:border-t-0 sm:border-x border-gray-200 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-500 block mb-1">Total Interest</span>
              <span className="text-2xl font-extrabold font-mono text-rose-500">
                {formatAmount(totalInterest)}
              </span>
            </div>
            <div className="text-center p-2">
              <span className="text-xs font-medium text-gray-500 block mb-1">Total Payment</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {formatAmount(totalPayment)}
              </span>
            </div>
          </div>

          {/* Breakdown Proportion Bar */}
          {totalPayment > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-[var(--muted)] font-medium">
                <span>Principal: {Math.round((loanPrincipal / totalPayment) * 100)}%</span>
                <span>Interest: {Math.round((totalInterest / totalPayment) * 100)}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[var(--surface-2)] overflow-hidden flex border" style={{ borderColor: 'var(--line)' }}>
                <div
                  className="h-full bg-[var(--brand)] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (loanPrincipal / totalPayment) * 100))}%` }}
                  title={`Principal: ${formatAmount(loanPrincipal)}`}
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (totalInterest / totalPayment) * 100))}%` }}
                  title={`Interest: ${formatAmount(totalInterest)}`}
                />
              </div>
            </div>
          )}

          {/* Toggle Amortization Schedule */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[var(--brand)] hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Annual Amortization Schedule ({currency.code} {currency.symbol.trim()})</span>
              </div>
              {showAmortization ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAmortization && (
              <div className="overflow-x-auto mt-3 border rounded-xl" style={{ borderColor: 'var(--line)' }}>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b bg-[var(--surface-2)]" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                      <th className="py-2.5 px-3 font-semibold">Year</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Opening Balance</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Principal Paid</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Interest Paid</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                    {(() => {
                      let balance = loanPrincipal;
                      const rows = [];
                      const annualEMI = emi * 12;

                      for (let y = 1; y <= loanYears; y++) {
                        const opening = balance;
                        let interestYear = 0;
                        let principalYear = 0;

                        for (let m = 0; m < 12; m++) {
                          if (balance <= 0) break;
                          const monthlyInt = balance * monthlyRate;
                          const monthlyPrin = Math.min(balance, emi - monthlyInt);
                          interestYear += monthlyInt;
                          principalYear += monthlyPrin;
                          balance -= monthlyPrin;
                        }

                        const closing = Math.max(0, balance);
                        rows.push(
                          <tr key={y} className="hover:bg-[var(--surface-2)]">
                            <td className="py-2 px-3 font-bold text-[var(--brand)]">Year {y}</td>
                            <td className="py-2 px-3 text-right">{formatAmount(opening)}</td>
                            <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatAmount(principalYear)}
                            </td>
                            <td className="py-2 px-3 text-right text-rose-500 font-semibold">
                              {formatAmount(interestYear)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold">
                              {formatAmount(closing)}
                            </td>
                          </tr>
                        );
                        if (balance <= 0) break;
                      }
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
