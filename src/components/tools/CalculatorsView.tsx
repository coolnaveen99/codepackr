import React, { useState } from 'react';
import { Calculator as CalcIcon, Percent, Receipt, DollarSign } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

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
        <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow-md space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                BILL AMOUNT ($)
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
                ${tipAmount.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Total Bill</span>
              <span className="text-lg font-bold font-mono" style={{ color: 'var(--ink)' }}>
                ${totalBill.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Per Person</span>
              <span className="text-lg font-bold font-mono text-[var(--brand)]">
                ${perPerson.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {tool.id === 'loan-calculator' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl border shadow-md space-y-5"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                PRINCIPAL AMOUNT ($)
              </label>
              <input
                type="number"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
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
                onChange={(e) => setLoanRate(Number(e.target.value))}
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
                value={loanYears}
                onChange={(e) => setLoanYears(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl border"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="text-center p-2">
              <span className="text-xs font-medium text-gray-500 block mb-1">Monthly EMI</span>
              <span className="text-2xl font-extrabold font-mono text-[var(--brand)]">
                ${emi.toFixed(2)}
              </span>
            </div>
            <div className="text-center p-2 border-t sm:border-t-0 sm:border-x border-gray-200 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-500 block mb-1">Total Interest</span>
              <span className="text-2xl font-extrabold font-mono text-rose-500">
                ${totalInterest.toFixed(2)}
              </span>
            </div>
            <div className="text-center p-2">
              <span className="text-xs font-medium text-gray-500 block mb-1">Total Payment</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                ${totalPayment.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
