import React, { useState } from 'react';
import {
  Calculator as CalcIcon,
  Percent,
  Receipt,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  PieChart,
  Download,
  TrendingUp,
  PiggyBank,
  ArrowUpRight,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { useCurrency } from '../../lib/CurrencyContext';
import { CurrencySelector } from '../CurrencySelector';

interface CalculatorsViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const CalculatorsView: React.FC<CalculatorsViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  // Scientific Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcFormula, setCalcFormula] = useState('');

  // Percentage Calculator State (stored as strings to prevent sticky zero)
  const [percXStr, setPercXStr] = useState('15');
  const [percYStr, setPercYStr] = useState('200');
  const [incFromStr, setIncFromStr] = useState('50');
  const [incToStr, setIncToStr] = useState('75');

  // Tip Calculator State (stored as strings to prevent sticky zero)
  const [billAmountStr, setBillAmountStr] = useState('85.50');
  const [tipPercentStr, setTipPercentStr] = useState('18');
  const [splitCountStr, setSplitCountStr] = useState('2');

  // Loan EMI Calculator State (stored as strings to prevent sticky zero, e.g. 09665775)
  const [loanPrincipalStr, setLoanPrincipalStr] = useState('50000');
  const [loanRateStr, setLoanRateStr] = useState('6.5');
  const [loanTenureStr, setLoanTenureStr] = useState('5');
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years');
  const [showAmortization, setShowAmortization] = useState(false);
  const [amortizationMode, setAmortizationMode] = useState<'annual' | 'monthly'>('annual');

  // SIP Calculator State
  const [sipMonthlyStr, setSipMonthlyStr] = useState('10000');
  const [sipRateStr, setSipRateStr] = useState('12');
  const [sipTenureStr, setSipTenureStr] = useState('10');
  const [sipTenureUnit, setSipTenureUnit] = useState<'years' | 'months'>('years');
  const [sipStepUpStr, setSipStepUpStr] = useState('0');
  const [sipStepUpType, setSipStepUpType] = useState<'percent' | 'amount'>('percent');
  const [sipInflationStr, setSipInflationStr] = useState('0');
  const [showSipSchedule, setShowSipSchedule] = useState(false);
  const [sipScheduleMode, setSipScheduleMode] = useState<'annual' | 'monthly'>('annual');

  // Compound Investment Calculator State
  const [compPrincipalStr, setCompPrincipalStr] = useState('10000');
  const [compDepositStr, setCompDepositStr] = useState('500');
  const [compDepositFreq, setCompDepositFreq] = useState<'monthly' | 'annually'>('monthly');
  const [compStepUpStr, setCompStepUpStr] = useState('0');
  const [compStepUpType, setCompStepUpType] = useState<'percent' | 'amount'>('percent');
  const [compFreq, setCompFreq] = useState<'1' | '2' | '4' | '12' | '365'>('12');
  const [compRateStr, setCompRateStr] = useState('8.5');
  const [compTenureStr, setCompTenureStr] = useState('10');
  const [compTenureUnit, setCompTenureUnit] = useState<'years' | 'months'>('years');
  const [showCompSchedule, setShowCompSchedule] = useState(false);
  const [compScheduleMode, setCompScheduleMode] = useState<'annual' | 'monthly'>('annual');

  // Global Currency Hook
  const { currency, formatAmount } = useCurrency();

  // Clean numeric input helper that strips unwanted leading zeros (e.g., prevents "09665775")
  const handleCleanInput = (rawVal: string, setter: (val: string) => void) => {
    if (rawVal === '') {
      setter('');
      return;
    }
    // Allow numbers and at most one decimal point
    let cleaned = rawVal.replace(/[^0-9.]/g, '');
    // Strip leading zero before any other digit (e.g. "09" -> "9", "050" -> "50")
    if (/^0\d/.test(cleaned)) {
      cleaned = cleaned.replace(/^0+(?=\d)/, '');
    }
    // Limit to single decimal
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    setter(cleaned);
  };

  // Calc buttons helper
  const handleCalcButton = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
      setCalcFormula('');
    } else if (val === '=') {
      try {
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

  // Percentage Math
  const percX = parseFloat(percXStr) || 0;
  const percY = parseFloat(percYStr) || 0;
  const incFrom = parseFloat(incFromStr) || 0;
  const incTo = parseFloat(incToStr) || 0;

  // Tip Math
  const billAmount = parseFloat(billAmountStr) || 0;
  const tipPercent = parseFloat(tipPercentStr) || 0;
  const splitCount = Math.max(1, parseInt(splitCountStr, 10) || 1);
  const tipAmount = (billAmount * tipPercent) / 100;
  const totalBill = billAmount + tipAmount;
  const perPerson = splitCount > 0 ? totalBill / splitCount : totalBill;

  // Loan Math
  const loanPrincipal = parseFloat(loanPrincipalStr) || 0;
  const loanRate = parseFloat(loanRateStr) || 0;
  const rawTenure = parseFloat(loanTenureStr) || 0;
  const totalMonths = Math.max(1, tenureUnit === 'years' ? Math.round(rawTenure * 12) : Math.round(rawTenure));
  const totalYears = tenureUnit === 'years' ? rawTenure : rawTenure / 12;

  const monthlyRate = loanRate > 0 ? loanRate / 12 / 100 : 0;
  const emi =
    monthlyRate > 0 && totalMonths > 0
      ? (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : totalMonths > 0
      ? loanPrincipal / totalMonths
      : 0;
  const totalPayment = emi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - loanPrincipal);

  // Switching Tenure Unit (Years <-> Months)
  const handleTenureUnitChange = (newUnit: 'years' | 'months') => {
    if (newUnit === tenureUnit) return;
    const currentVal = parseFloat(loanTenureStr) || 0;
    if (newUnit === 'months') {
      // Years to Months
      setLoanTenureStr(String(Math.round(currentVal * 12)));
    } else {
      // Months to Years
      const yrs = +(currentVal / 12).toFixed(1);
      setLoanTenureStr(String(yrs % 1 === 0 ? Math.round(yrs) : yrs));
    }
    setTenureUnit(newUnit);
  };

  // CSV Export for Amortization Schedule
  const downloadAmortizationCSV = () => {
    let csv = '';
    if (amortizationMode === 'annual') {
      csv = 'Year,Opening Balance,Principal Paid,Interest Paid,Closing Balance\n';
      let balance = loanPrincipal;
      const roundedYears = Math.ceil(totalMonths / 12);
      for (let y = 1; y <= roundedYears; y++) {
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
        csv += `Year ${y},${opening.toFixed(2)},${principalYear.toFixed(2)},${interestYear.toFixed(2)},${closing.toFixed(2)}\n`;
        if (balance <= 0) break;
      }
    } else {
      csv = 'Month,Year,Opening Balance,Principal Paid,Interest Paid,Closing Balance\n';
      let balance = loanPrincipal;
      for (let m = 1; m <= totalMonths; m++) {
        const opening = balance;
        const monthlyInt = balance * monthlyRate;
        const monthlyPrin = Math.min(balance, emi - monthlyInt);
        const closing = Math.max(0, balance - monthlyPrin);
        const yearNum = Math.ceil(m / 12);
        csv += `Month ${m},Year ${yearNum},${opening.toFixed(2)},${monthlyPrin.toFixed(2)},${monthlyInt.toFixed(2)},${closing.toFixed(2)}\n`;
        balance = closing;
        if (balance <= 0) break;
      }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amortization-schedule-${amortizationMode}-${currency.code}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Circular Chart Geometry
  const chartRadius = 65;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * chartRadius; // ~408.4
  const principalPercent = totalPayment > 0 ? (loanPrincipal / totalPayment) * 100 : 100;
  const interestPercent = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;
  const principalDash = (principalPercent / 100) * circumference;
  const interestDash = (interestPercent / 100) * circumference;

  // -------------------------------------------------------------
  // SIP Calculator Calculations
  // -------------------------------------------------------------
  const sipMonthly = parseFloat(sipMonthlyStr) || 0;
  const sipRate = parseFloat(sipRateStr) || 0;
  const rawSipTenure = parseFloat(sipTenureStr) || 0;
  const sipStepUp = parseFloat(sipStepUpStr) || 0;
  const sipInflation = parseFloat(sipInflationStr) || 0;
  const totalSipMonths = Math.max(1, sipTenureUnit === 'years' ? Math.round(rawSipTenure * 12) : Math.round(rawSipTenure));
  const totalSipYears = sipTenureUnit === 'years' ? rawSipTenure : rawSipTenure / 12;
  const sipMonthlyRate = sipRate > 0 ? sipRate / 12 / 100 : 0;

  let sipInvested = 0;
  const sipMonthlyBreakdown: { month: number; year: number; opening: number; deposit: number; interestEarned: number; closing: number }[] = [];
  const sipYearlyBreakdown: { year: number; opening: number; deposit: number; interestEarned: number; closing: number }[] = [];

  let currentSipBal = 0;
  let currentYearDeposit = 0;
  let currentYearInterest = 0;
  let yearOpenBal = 0;

  for (let m = 1; m <= totalSipMonths; m++) {
    const yearIdx = Math.floor((m - 1) / 12);
    let monthlyDeposit = sipMonthly;
    if (yearIdx > 0 && sipStepUp > 0) {
      if (sipStepUpType === 'percent') {
        monthlyDeposit = sipMonthly * Math.pow(1 + sipStepUp / 100, yearIdx);
      } else {
        monthlyDeposit = Math.max(0, sipMonthly + (sipStepUp * yearIdx));
      }
    }
    sipInvested += monthlyDeposit;

    if ((m - 1) % 12 === 0) {
      yearOpenBal = currentSipBal;
      currentYearDeposit = 0;
      currentYearInterest = 0;
    }

    currentYearDeposit += monthlyDeposit;
    const prevBal = currentSipBal;
    const interestThisMonth = (prevBal + monthlyDeposit) * sipMonthlyRate;
    currentSipBal = prevBal + monthlyDeposit + interestThisMonth;
    currentYearInterest += interestThisMonth;

    sipMonthlyBreakdown.push({
      month: m,
      year: yearIdx + 1,
      opening: prevBal,
      deposit: monthlyDeposit,
      interestEarned: interestThisMonth,
      closing: currentSipBal,
    });

    if (m % 12 === 0 || m === totalSipMonths) {
      sipYearlyBreakdown.push({
        year: yearIdx + 1,
        opening: yearOpenBal,
        deposit: currentYearDeposit,
        interestEarned: currentYearInterest,
        closing: currentSipBal,
      });
    }
  }

  const sipMaturity = currentSipBal;
  const sipWealthGain = Math.max(0, sipMaturity - sipInvested);
  const sipInflationAdjValue = sipInflation > 0 && totalSipYears > 0
    ? sipMaturity / Math.pow(1 + sipInflation / 100, totalSipYears)
    : sipMaturity;

  const sipInvestedPercent = sipMaturity > 0 ? (sipInvested / sipMaturity) * 100 : 100;
  const sipGainPercent = sipMaturity > 0 ? (sipWealthGain / sipMaturity) * 100 : 0;
  const sipInvestedDash = (sipInvestedPercent / 100) * circumference;
  const sipGainDash = (sipGainPercent / 100) * circumference;

  const downloadSipCSV = () => {
    let csv = '';
    if (sipScheduleMode === 'annual') {
      csv = 'Year,Opening Balance,Total Invested,Estimated Returns,Closing Maturity Value\n';
      sipYearlyBreakdown.forEach((row) => {
        csv += `Year ${row.year},${row.opening.toFixed(2)},${row.deposit.toFixed(2)},${row.interestEarned.toFixed(2)},${row.closing.toFixed(2)}\n`;
      });
    } else {
      csv = 'Month,Year,Opening Balance,Monthly Deposit,Interest Earned,Closing Balance\n';
      sipMonthlyBreakdown.forEach((row) => {
        csv += `Month ${row.month},Year ${row.year},${row.opening.toFixed(2)},${row.deposit.toFixed(2)},${row.interestEarned.toFixed(2)},${row.closing.toFixed(2)}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sip-investment-schedule-${sipScheduleMode}-${currency.code}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // Compound Investment Calculations
  // -------------------------------------------------------------
  const compPrincipal = parseFloat(compPrincipalStr) || 0;
  const compDeposit = parseFloat(compDepositStr) || 0;
  const compStepUp = parseFloat(compStepUpStr) || 0;
  const compRate = parseFloat(compRateStr) || 0;
  const rawCompTenure = parseFloat(compTenureStr) || 0;
  const compTenureMonths = Math.max(1, compTenureUnit === 'years' ? Math.round(rawCompTenure * 12) : Math.round(rawCompTenure));
  const compYears = compTenureMonths / 12;
  const compN = parseInt(compFreq, 10) || 12;
  const r = compRate / 100;
  const compAPY = compN > 0 ? Math.pow(1 + r / compN, compN) - 1 : r;

  let compBal = compPrincipal;
  let totalCompDeposits = 0;
  const compMonthlyBreakdown: { month: number; year: number; opening: number; deposit: number; interestEarned: number; closing: number }[] = [];
  const compYearlyBreakdown: { year: number; opening: number; deposit: number; interestEarned: number; closing: number }[] = [];

  let compYearOpen = compPrincipal;
  let compYearDep = 0;
  let compYearInt = 0;

  for (let m = 1; m <= compTenureMonths; m++) {
    const yearIdx = Math.floor((m - 1) / 12);
    if ((m - 1) % 12 === 0) {
      compYearOpen = compBal;
      compYearDep = 0;
      compYearInt = 0;
    }

    const mOpening = compBal;
    let mDeposit = 0;
    let effectiveDeposit = compDeposit;
    if (compDeposit > 0 && yearIdx > 0 && compStepUp > 0) {
      if (compStepUpType === 'percent') {
        effectiveDeposit = compDeposit * Math.pow(1 + compStepUp / 100, yearIdx);
      } else {
        effectiveDeposit = Math.max(0, compDeposit + (compStepUp * yearIdx));
      }
    }

    if (compDepositFreq === 'monthly') {
      mDeposit = effectiveDeposit;
    } else if (compDepositFreq === 'annually' && ((m - 1) % 12 === 0)) {
      mDeposit = effectiveDeposit;
    }
    totalCompDeposits += mDeposit;
    compYearDep += mDeposit;

    const monthlyEffectiveRate = Math.pow(1 + compAPY, 1 / 12) - 1;
    const mInterest = (mOpening + mDeposit) * monthlyEffectiveRate;
    compBal = mOpening + mDeposit + mInterest;
    compYearInt += mInterest;

    compMonthlyBreakdown.push({
      month: m,
      year: yearIdx + 1,
      opening: mOpening,
      deposit: mDeposit,
      interestEarned: mInterest,
      closing: compBal,
    });

    if (m % 12 === 0 || m === compTenureMonths) {
      compYearlyBreakdown.push({
        year: yearIdx + 1,
        opening: compYearOpen,
        deposit: compYearDep,
        interestEarned: compYearInt,
        closing: compBal,
      });
    }
  }

  const compFutureValue = compBal;
  const compTotalContributed = compPrincipal + totalCompDeposits;
  const compTotalInterest = Math.max(0, compFutureValue - compTotalContributed);

  const compPrincipalPercent = compFutureValue > 0 ? (compPrincipal / compFutureValue) * 100 : 100;
  const compDepositsPercent = compFutureValue > 0 ? (totalCompDeposits / compFutureValue) * 100 : 0;
  const compInterestPercent = compFutureValue > 0 ? (compTotalInterest / compFutureValue) * 100 : 0;

  const compPrincipalDash = (compPrincipalPercent / 100) * circumference;
  const compDepositsDash = (compDepositsPercent / 100) * circumference;
  const compInterestDash = (compInterestPercent / 100) * circumference;

  const downloadCompCSV = () => {
    let csv = '';
    if (compScheduleMode === 'annual') {
      csv = 'Year,Opening Balance,Deposits,Compound Interest,Ending Balance\n';
      compYearlyBreakdown.forEach((row) => {
        csv += `Year ${row.year},${row.opening.toFixed(2)},${row.deposit.toFixed(2)},${row.interestEarned.toFixed(2)},${row.closing.toFixed(2)}\n`;
      });
    } else {
      csv = 'Month,Year,Opening Balance,Deposit,Interest Earned,Closing Balance\n';
      compMonthlyBreakdown.forEach((row) => {
        csv += `Month ${row.month},Year ${row.year},${row.opening.toFixed(2)},${row.deposit.toFixed(2)},${row.interestEarned.toFixed(2)},${row.closing.toFixed(2)}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `investment-schedule-${compScheduleMode}-${currency.code}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
                type="text"
                inputMode="decimal"
                value={percXStr}
                onChange={(e) => handleCleanInput(e.target.value, setPercXStr)}
                placeholder="15"
                className="w-24 p-2 rounded-xl border text-center font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-sm">% of</span>
              <input
                type="text"
                inputMode="decimal"
                value={percYStr}
                onChange={(e) => handleCleanInput(e.target.value, setPercYStr)}
                placeholder="200"
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
                type="text"
                inputMode="decimal"
                value={incFromStr}
                onChange={(e) => handleCleanInput(e.target.value, setIncFromStr)}
                placeholder="50"
                className="w-28 p-2 rounded-xl border text-center font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-sm">to</span>
              <input
                type="text"
                inputMode="decimal"
                value={incToStr}
                onChange={(e) => handleCleanInput(e.target.value, setIncToStr)}
                placeholder="75"
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
                type="text"
                inputMode="decimal"
                value={billAmountStr}
                onChange={(e) => handleCleanInput(e.target.value, setBillAmountStr)}
                placeholder="e.g. 85.50"
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                TIP PERCENTAGE ({tipPercent}%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={tipPercentStr}
                onChange={(e) => handleCleanInput(e.target.value, setTipPercentStr)}
                placeholder="e.g. 18"
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                SPLIT (PEOPLE)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={splitCountStr}
                onChange={(e) => handleCleanInput(e.target.value, setSplitCountStr)}
                placeholder="1"
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
        <div className="max-w-3xl mx-auto p-6 rounded-2xl border shadow-md space-y-6"
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

          {/* Inputs Row with Clean Sanitized Numbers & Tenure Unit Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="h-7 flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  PRINCIPAL AMOUNT ({currency.symbol.trim()})
                </label>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={loanPrincipalStr}
                onChange={(e) => handleCleanInput(e.target.value, setLoanPrincipalStr)}
                placeholder="e.g. 50000"
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none font-bold"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                {loanPrincipal > 0 ? formatAmount(loanPrincipal) : 'Enter principal amount'}
              </span>
            </div>
            <div>
              <div className="h-7 flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  ANNUAL INTEREST RATE (%)
                </label>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={loanRateStr}
                onChange={(e) => handleCleanInput(e.target.value, setLoanRateStr)}
                placeholder="e.g. 6.5"
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                {loanRate}% per annum
              </span>
            </div>
            <div>
              <div className="h-7 flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  TENURE ({tenureUnit.toUpperCase()})
                </label>
                <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
                  <button
                    type="button"
                    onClick={() => handleTenureUnitChange('years')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      tenureUnit === 'years'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Yr
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTenureUnitChange('months')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      tenureUnit === 'months'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Mo
                  </button>
                </div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={loanTenureStr}
                onChange={(e) => handleCleanInput(e.target.value, setLoanTenureStr)}
                placeholder={tenureUnit === 'years' ? 'e.g. 5' : 'e.g. 60'}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                {tenureUnit === 'years'
                  ? `${totalMonths} months total`
                  : `${(totalMonths / 12).toFixed(1)} years total`}
              </span>
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

          {/* Circular Graph Chart (Donut Chart) & Visual Breakdown */}
          <div className="p-5 rounded-2xl border space-y-4"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--ink)]">
                <PieChart className="w-4 h-4 text-[var(--brand)]" />
                <span>Loan Breakdown (Circular Chart)</span>
              </h3>
              <span className="text-xs font-mono text-[var(--muted)]">
                {currency.code}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-around gap-6 pt-2">
              {/* SVG Circular Donut Chart */}
              <div className="relative flex items-center justify-center">
                <svg
                  width="190"
                  height="190"
                  viewBox="0 0 190 190"
                  className="transform -rotate-90"
                >
                  {/* Background Track */}
                  <circle
                    cx="95"
                    cy="95"
                    r={chartRadius}
                    fill="transparent"
                    stroke="var(--line)"
                    strokeWidth={strokeWidth}
                  />

                  {/* Principal Arc */}
                  <circle
                    cx="95"
                    cy="95"
                    r={chartRadius}
                    fill="transparent"
                    stroke="var(--brand)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${principalDash} ${circumference}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />

                  {/* Interest Arc */}
                  {totalInterest > 0 && (
                    <circle
                      cx="95"
                      cy="95"
                      r={chartRadius}
                      fill="transparent"
                      stroke="#f43f5e"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${interestDash} ${circumference}`}
                      strokeDashoffset={-principalDash}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  )}
                </svg>

                {/* Center Content Inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Total Payable
                  </span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-[var(--ink)] leading-tight">
                    {formatAmount(totalPayment)}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-[var(--brand)] mt-0.5">
                    EMI: {formatAmount(emi)}
                  </span>
                </div>
              </div>

              {/* Legend & Details Column */}
              <div className="flex-1 w-full max-w-sm space-y-3">
                {/* Principal Indicator */}
                <div className="p-3 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[var(--brand)] flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold block text-[var(--ink)]">Principal Loan Amount</span>
                      <span className="text-[11px] text-[var(--muted)]">
                        {principalPercent.toFixed(1)}% of total repayment
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-[var(--brand)]">
                    {formatAmount(loanPrincipal)}
                  </span>
                </div>

                {/* Interest Indicator */}
                <div className="p-3 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold block text-[var(--ink)]">Total Interest Payable</span>
                      <span className="text-[11px] text-[var(--muted)]">
                        {interestPercent.toFixed(1)}% of total repayment
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-rose-500">
                    {formatAmount(totalInterest)}
                  </span>
                </div>

                {/* Quick Ratio Bar */}
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full bg-[var(--brand)] transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, principalPercent))}%` }}
                    title={`Principal: ${formatAmount(loanPrincipal)}`}
                  />
                  <div
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, interestPercent))}%` }}
                    title={`Interest: ${formatAmount(totalInterest)}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Amortization Schedule (Annual & Monthly) */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2 py-2">
              <button
                onClick={() => setShowAmortization(!showAmortization)}
                className="flex items-center gap-2 text-xs font-semibold text-[var(--brand)] hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  Amortization Schedule ({currency.code} {currency.symbol.trim()})
                </span>
                {showAmortization ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAmortization && (
                <div className="flex items-center gap-2">
                  {/* Mode Switcher: Annual vs Monthly */}
                  <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
                    <button
                      type="button"
                      onClick={() => setAmortizationMode('annual')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        amortizationMode === 'annual'
                          ? 'bg-[var(--brand)] text-white shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Annual Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmortizationMode('monthly')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        amortizationMode === 'monthly'
                          ? 'bg-[var(--brand)] text-white shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Monthly Schedule
                    </button>
                  </div>

                  {/* CSV Export Button */}
                  <button
                    onClick={downloadAmortizationCSV}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-[var(--ink)]"
                    style={{ borderColor: 'var(--line)' }}
                    title="Export Schedule as CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--brand)]" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                </div>
              )}
            </div>

            {showAmortization && (
              <div className="mt-3">
                {/* Annual Schedule Table */}
                {amortizationMode === 'annual' && (
                  <div className="overflow-x-auto border rounded-xl max-h-96" style={{ borderColor: 'var(--line)' }}>
                    <table className="w-full text-xs text-left">
                      <thead className="sticky top-0 bg-[var(--surface-2)] border-b z-10" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                        <tr>
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
                          const roundedYears = Math.ceil(totalMonths / 12);

                          for (let y = 1; y <= roundedYears; y++) {
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
                              <tr key={y} className="hover:bg-[var(--surface-2)] transition-colors">
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

                {/* Monthly Schedule Table */}
                {amortizationMode === 'monthly' && (
                  <div className="overflow-x-auto border rounded-xl max-h-96" style={{ borderColor: 'var(--line)' }}>
                    <table className="w-full text-xs text-left">
                      <thead className="sticky top-0 bg-[var(--surface-2)] border-b z-10" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Month</th>
                          <th className="py-2.5 px-3 font-semibold">Period</th>
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

                          for (let m = 1; m <= totalMonths; m++) {
                            const opening = balance;
                            const monthlyInt = balance * monthlyRate;
                            const monthlyPrin = Math.min(balance, emi - monthlyInt);
                            const closing = Math.max(0, balance - monthlyPrin);
                            const yearNum = Math.ceil(m / 12);
                            const monthInYear = ((m - 1) % 12) + 1;

                            rows.push(
                              <tr key={m} className="hover:bg-[var(--surface-2)] transition-colors">
                                <td className="py-2 px-3 font-bold text-[var(--brand)]">M{m}</td>
                                <td className="py-2 px-3 text-[var(--muted)]">
                                  Yr {yearNum} &bull; M{monthInYear}
                                </td>
                                <td className="py-2 px-3 text-right">{formatAmount(opening)}</td>
                                <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {formatAmount(monthlyPrin)}
                                </td>
                                <td className="py-2 px-3 text-right text-rose-500 font-semibold">
                                  {formatAmount(monthlyInt)}
                                </td>
                                <td className="py-2 px-3 text-right font-bold">
                                  {formatAmount(closing)}
                                </td>
                              </tr>
                            );
                            balance = closing;
                            if (balance <= 0) break;
                          }
                          return rows;
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SIP (SYSTEMATIC INVESTMENT PLAN) CALCULATOR                     */}
      {/* ============================================================== */}
      {tool.id === 'sip-calculator' && (
        <div
          className="max-w-3xl mx-auto p-6 rounded-2xl border shadow-md space-y-6"
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
            <CurrencySelector idPrefix="sip-currency" variant="pill" />
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="h-7 flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  MONTHLY INVESTMENT ({currency.symbol.trim()})
                </label>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={sipMonthlyStr}
                onChange={(e) => handleCleanInput(e.target.value, setSipMonthlyStr)}
                placeholder="e.g. 10000"
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none font-bold"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                {sipMonthly > 0 ? formatAmount(sipMonthly) : 'Enter monthly SIP'}
              </span>
            </div>
            <div>
              <div className="h-7 flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  EXPECTED RETURN RATE (%)
                </label>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={sipRateStr}
                onChange={(e) => handleCleanInput(e.target.value, setSipRateStr)}
                placeholder="e.g. 12"
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                {sipRate}% per annum
              </span>
            </div>
            <div>
              <div className="h-7 flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  TENURE ({sipTenureUnit.toUpperCase()})
                </label>
                <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
                  <button
                    type="button"
                    onClick={() => setSipTenureUnit('years')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      sipTenureUnit === 'years'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Yr
                  </button>
                  <button
                    type="button"
                    onClick={() => setSipTenureUnit('months')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      sipTenureUnit === 'months'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Mo
                  </button>
                </div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={sipTenureStr}
                onChange={(e) => handleCleanInput(e.target.value, setSipTenureStr)}
                placeholder={sipTenureUnit === 'years' ? 'e.g. 10' : 'e.g. 120'}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                {sipTenureUnit === 'years' ? `${totalSipMonths} months total` : `${(totalSipMonths / 12).toFixed(1)} years total`}
              </span>
            </div>
          </div>

          {/* Advanced Controls: Step-Up SIP & Inflation Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl border text-xs" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label className="font-semibold text-xs" style={{ color: 'var(--muted)' }}>
                  ANNUAL STEP-UP (YEAR 2 ONWARDS)
                </label>
                <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
                  <button
                    type="button"
                    onClick={() => setSipStepUpType('percent')}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                      sipStepUpType === 'percent'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    % Percent
                  </button>
                  <button
                    type="button"
                    onClick={() => setSipStepUpType('amount')}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                      sipStepUpType === 'amount'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {currency.symbol.trim()} Amount
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={sipStepUpStr}
                  onChange={(e) => handleCleanInput(e.target.value, setSipStepUpStr)}
                  placeholder={sipStepUpType === 'percent' ? 'e.g. 10 (10% per year)' : 'e.g. 1000'}
                  className="w-full p-2 rounded-lg border font-mono text-xs outline-none"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                />
                <span className="font-mono font-bold text-[var(--brand)] text-xs min-w-[20px] text-center">
                  {sipStepUpType === 'percent' ? '%' : currency.symbol.trim()}
                </span>
              </div>
              <span className="text-[10px] text-[var(--muted)] mt-1 block">
                {sipStepUp > 0
                  ? sipStepUpType === 'percent'
                    ? `Increases monthly investment by ${sipStepUp}% each year from Year 2`
                    : `Increases monthly investment by ${formatAmount(sipStepUp)} each year from Year 2`
                  : 'Fixed monthly contribution (no annual increase)'}
              </span>
            </div>
            <div>
              <div className="h-6 flex items-center mb-1.5">
                <label className="font-semibold text-xs" style={{ color: 'var(--muted)' }}>
                  INFLATION RATE ADJUSTMENT (%)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={sipInflationStr}
                  onChange={(e) => handleCleanInput(e.target.value, setSipInflationStr)}
                  placeholder="0 (nominal returns)"
                  className="w-full p-2 rounded-lg border font-mono text-xs outline-none"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                />
                <span className="font-mono font-bold text-[var(--brand)] text-xs min-w-[20px] text-center">%</span>
              </div>
              <span className="text-[10px] text-[var(--muted)] mt-1 block">
                {sipInflation > 0 ? `Real purchasing power discounted at ${sipInflation}%/yr` : 'Displays nominal maturity value'}
              </span>
            </div>
          </div>

          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl border"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="text-center p-2">
              <span className="text-xs font-medium text-gray-500 block mb-1">Total Invested</span>
              <span className="text-2xl font-extrabold font-mono text-[var(--brand)]">
                {formatAmount(sipInvested)}
              </span>
            </div>
            <div className="text-center p-2 border-t sm:border-t-0 sm:border-x border-gray-200 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-500 block mb-1">Est. Wealth Gain</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                +{formatAmount(sipWealthGain)}
              </span>
            </div>
            <div className="text-center p-2">
              <span className="text-xs font-medium text-gray-500 block mb-1">Expected Maturity</span>
              <span className="text-2xl font-extrabold font-mono text-[var(--ink)]">
                {formatAmount(sipMaturity)}
              </span>
              {sipInflation > 0 && (
                <span className="text-[10px] text-[var(--muted)] block mt-0.5">
                  Real: {formatAmount(sipInflationAdjValue)}
                </span>
              )}
            </div>
          </div>

          {/* Circular Donut Graph & Visual Breakdown */}
          <div className="p-5 rounded-2xl border space-y-4"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--ink)]">
                <PieChart className="w-4 h-4 text-[var(--brand)]" />
                <span>SIP Wealth Breakdown (Circular Chart)</span>
              </h3>
              <span className="text-xs font-mono text-[var(--muted)]">
                {currency.code}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-around gap-6 pt-2">
              {/* SVG Circular Donut Chart */}
              <div className="relative flex items-center justify-center">
                <svg
                  width="190"
                  height="190"
                  viewBox="0 0 190 190"
                  className="transform -rotate-90"
                >
                  {/* Background Track */}
                  <circle
                    cx="95"
                    cy="95"
                    r={chartRadius}
                    fill="transparent"
                    stroke="var(--line)"
                    strokeWidth={strokeWidth}
                  />

                  {/* Invested Arc */}
                  <circle
                    cx="95"
                    cy="95"
                    r={chartRadius}
                    fill="transparent"
                    stroke="var(--brand)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${sipInvestedDash} ${circumference}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />

                  {/* Wealth Gain Arc */}
                  {sipWealthGain > 0 && (
                    <circle
                      cx="95"
                      cy="95"
                      r={chartRadius}
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${sipGainDash} ${circumference}`}
                      strokeDashoffset={-sipInvestedDash}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  )}
                </svg>

                {/* Center Content Inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Total Value
                  </span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-[var(--ink)] leading-tight">
                    {formatAmount(sipMaturity)}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                    +{sipGainPercent.toFixed(1)}% Gain
                  </span>
                </div>
              </div>

              {/* Legend & Details Column */}
              <div className="flex-1 w-full max-w-sm space-y-3">
                {/* Invested Indicator */}
                <div className="p-3 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[var(--brand)] flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold block text-[var(--ink)]">Total Principal Invested</span>
                      <span className="text-[11px] text-[var(--muted)]">
                        {sipInvestedPercent.toFixed(1)}% of maturity corpus
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-[var(--brand)]">
                    {formatAmount(sipInvested)}
                  </span>
                </div>

                {/* Wealth Gain Indicator */}
                <div className="p-3 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-semibold block text-[var(--ink)]">Estimated Wealth Gain</span>
                      <span className="text-[11px] text-[var(--muted)]">
                        {sipGainPercent.toFixed(1)}% of maturity corpus
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    +{formatAmount(sipWealthGain)}
                  </span>
                </div>

                {/* Ratio Bar */}
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full bg-[var(--brand)] transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, sipInvestedPercent))}%` }}
                    title={`Invested: ${formatAmount(sipInvested)}`}
                  />
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, sipGainPercent))}%` }}
                    title={`Wealth Gain: ${formatAmount(sipWealthGain)}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Growth Timeline Visualizer (Bar Progression) */}
          <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--ink)]">
                <BarChart3 className="w-4 h-4 text-[var(--brand)]" />
                <span>Annual Growth Timeline</span>
              </h4>
              <span className="text-[11px] text-[var(--muted)] font-mono">
                {sipYearlyBreakdown.length} Years Horizon
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {sipYearlyBreakdown.slice(0, 10).map((yr) => {
                const maxVal = sipYearlyBreakdown[sipYearlyBreakdown.length - 1]?.closing || 1;
                const depWidth = (yr.deposit / maxVal) * 100;
                const totalWidth = (yr.closing / maxVal) * 100;

                return (
                  <div key={yr.year} className="flex items-center gap-2 text-xs font-mono">
                    <span className="w-12 text-[var(--muted)] font-bold">Yr {yr.year}</span>
                    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden flex relative">
                      <div
                        className="h-full bg-[var(--brand)] opacity-90 transition-all"
                        style={{ width: `${Math.min(100, depWidth)}%` }}
                        title={`Cumulative Deposits: ${formatAmount(yr.deposit)}`}
                      />
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, totalWidth - depWidth))}%` }}
                        title={`Maturity Value: ${formatAmount(yr.closing)}`}
                      />
                    </div>
                    <span className="w-24 text-right font-bold text-[var(--ink)] truncate">
                      {formatAmount(yr.closing)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Toggle SIP Schedule (Annual & Monthly) */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2 py-2">
              <button
                onClick={() => setShowSipSchedule(!showSipSchedule)}
                className="flex items-center gap-2 text-xs font-semibold text-[var(--brand)] hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  SIP Growth Schedule ({currency.code} {currency.symbol.trim()})
                </span>
                {showSipSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSipSchedule && (
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
                    <button
                      type="button"
                      onClick={() => setSipScheduleMode('annual')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        sipScheduleMode === 'annual'
                          ? 'bg-[var(--brand)] text-white shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Annual
                    </button>
                    <button
                      type="button"
                      onClick={() => setSipScheduleMode('monthly')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        sipScheduleMode === 'monthly'
                          ? 'bg-[var(--brand)] text-white shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>

                  <button
                    onClick={downloadSipCSV}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-[var(--ink)]"
                    style={{ borderColor: 'var(--line)' }}
                    title="Export SIP Schedule as CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--brand)]" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                </div>
              )}
            </div>

            {showSipSchedule && (
              <div className="mt-3">
                {sipScheduleMode === 'annual' ? (
                  <div className="overflow-x-auto border rounded-xl max-h-96" style={{ borderColor: 'var(--line)' }}>
                    <table className="w-full text-xs text-left">
                      <thead className="sticky top-0 bg-[var(--surface-2)] border-b z-10" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Year</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Opening Balance</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Deposited This Year</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Returns Earned</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Closing Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                        {sipYearlyBreakdown.map((row) => (
                          <tr key={row.year} className="hover:bg-[var(--surface-2)] transition-colors">
                            <td className="py-2 px-3 font-bold text-[var(--brand)]">Year {row.year}</td>
                            <td className="py-2 px-3 text-right">{formatAmount(row.opening)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-[var(--brand)]">
                              {formatAmount(row.deposit)}
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                              +{formatAmount(row.interestEarned)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold">
                              {formatAmount(row.closing)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-xl max-h-96" style={{ borderColor: 'var(--line)' }}>
                    <table className="w-full text-xs text-left">
                      <thead className="sticky top-0 bg-[var(--surface-2)] border-b z-10" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Month</th>
                          <th className="py-2.5 px-3 font-semibold">Period</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Opening Balance</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Monthly Deposit</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Interest Earned</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Closing Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                        {sipMonthlyBreakdown.map((row) => (
                          <tr key={row.month} className="hover:bg-[var(--surface-2)] transition-colors">
                            <td className="py-2 px-3 font-bold text-[var(--brand)]">M{row.month}</td>
                            <td className="py-2 px-3 text-[var(--muted)]">
                              Yr {row.year} &bull; M{((row.month - 1) % 12) + 1}
                            </td>
                            <td className="py-2 px-3 text-right">{formatAmount(row.opening)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-[var(--brand)]">
                              {formatAmount(row.deposit)}
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                              +{formatAmount(row.interestEarned)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold">
                              {formatAmount(row.closing)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* INVESTMENT CALCULATOR                                          */}
      {/* ============================================================== */}
      {(tool.id === 'investment-calculator' || tool.id === 'compound-investment-calculator') && (
        <div
          className="max-w-3xl mx-auto p-6 rounded-2xl border shadow-md space-y-6"
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
            <CurrencySelector idPrefix="comp-currency" variant="pill" />
          </div>

          {/* Inputs Row 1: Initial Deposit, Regular Addition & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="h-7 flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  INITIAL PRINCIPAL ({currency.symbol.trim()})
                </label>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={compPrincipalStr}
                onChange={(e) => handleCleanInput(e.target.value, setCompPrincipalStr)}
                placeholder="e.g. 10000"
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none font-bold"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                {compPrincipal > 0 ? formatAmount(compPrincipal) : 'Starting investment'}
              </span>
            </div>
            <div>
              <div className="h-7 flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  REGULAR DEPOSIT
                </label>
                <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
                  <button
                    type="button"
                    onClick={() => setCompDepositFreq('monthly')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      compDepositFreq === 'monthly'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Mo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompDepositFreq('annually')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      compDepositFreq === 'annually'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Yr
                  </button>
                </div>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={compDepositStr}
                onChange={(e) => handleCleanInput(e.target.value, setCompDepositStr)}
                placeholder="e.g. 500"
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                {compDeposit > 0 ? `${formatAmount(compDeposit)} / ${compDepositFreq === 'monthly' ? 'month' : 'year'}` : 'Optional recurring contribution'}
              </span>
            </div>
            <div>
              <div className="h-7 flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  HORIZON ({compTenureUnit.toUpperCase()})
                </label>
                <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
                  <button
                    type="button"
                    onClick={() => setCompTenureUnit('years')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      compTenureUnit === 'years'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Yr
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompTenureUnit('months')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      compTenureUnit === 'months'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Mo
                  </button>
                </div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={compTenureStr}
                onChange={(e) => handleCleanInput(e.target.value, setCompTenureStr)}
                placeholder={compTenureUnit === 'years' ? 'e.g. 10' : 'e.g. 120'}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                {compTenureUnit === 'years' ? `${compTenureMonths} months total` : `${(compTenureMonths / 12).toFixed(1)} years total`}
              </span>
            </div>
          </div>

          {/* Inputs Row 2: Annual Interest Rate & Compounding Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                ANNUAL INTEREST RATE (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={compRateStr}
                onChange={(e) => handleCleanInput(e.target.value, setCompRateStr)}
                placeholder="e.g. 8.5"
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                Effective APY: {(compAPY * 100).toFixed(2)}%
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                COMPOUNDING FREQUENCY
              </label>
              <select
                value={compFreq}
                onChange={(e) => setCompFreq(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border font-mono text-sm outline-none cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <option value="12">Monthly (12/year - Recommended)</option>
                <option value="4">Quarterly (4/year)</option>
                <option value="2">Semi-Annually (2/year)</option>
                <option value="1">Annually (1/year)</option>
                <option value="365">Daily (365/year)</option>
              </select>
              <span className="text-[11px] text-[var(--muted)] mt-1 block">
                Compounds {compFreq} times per calendar year
              </span>
            </div>
          </div>

          {/* Annual Step-Up / Regular Deposit Increment */}
          <div className="p-3.5 rounded-xl border text-xs space-y-2" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-semibold text-xs" style={{ color: 'var(--muted)' }}>
                  ANNUAL STEP-UP (YEAR 2 ONWARDS)
                </span>
                <span className="text-[10px] text-[var(--muted)] block">
                  Gradually increase regular deposits each year
                </span>
              </div>
              <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
                <button
                  type="button"
                  onClick={() => setCompStepUpType('percent')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                    compStepUpType === 'percent'
                      ? 'bg-[var(--brand)] text-white shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  % Percent
                </button>
                <button
                  type="button"
                  onClick={() => setCompStepUpType('amount')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                    compStepUpType === 'amount'
                      ? 'bg-[var(--brand)] text-white shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {currency.symbol.trim()} Amount
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={compStepUpStr}
                onChange={(e) => handleCleanInput(e.target.value, setCompStepUpStr)}
                placeholder={compStepUpType === 'percent' ? 'e.g. 10 (10% increase/yr)' : `e.g. ${compDepositFreq === 'monthly' ? '50' : '500'}`}
                className="w-full p-2 rounded-lg border font-mono text-xs outline-none"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              />
              <span className="font-mono font-bold text-[var(--brand)] text-xs min-w-[20px] text-center">
                {compStepUpType === 'percent' ? '%' : currency.symbol.trim()}
              </span>
            </div>
            <span className="text-[10px] text-[var(--muted)] block">
              {compStepUp > 0
                ? compStepUpType === 'percent'
                  ? `Regular deposit increases by ${compStepUp}% each year from Year 2`
                  : `Regular deposit increases by ${formatAmount(compStepUp)} (${compDepositFreq === 'monthly' ? '/month' : '/year'}) each year from Year 2`
                : 'Fixed regular deposit throughout investment horizon (no annual increase)'}
            </span>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl border"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="text-center p-2">
              <span className="text-xs font-medium text-gray-500 block mb-1">Total Principal & Deposits</span>
              <span className="text-2xl font-extrabold font-mono text-[var(--brand)]">
                {formatAmount(compTotalContributed)}
              </span>
            </div>
            <div className="text-center p-2 border-t sm:border-t-0 sm:border-x border-gray-200 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-500 block mb-1">Compound Interest Earned</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                +{formatAmount(compTotalInterest)}
              </span>
            </div>
            <div className="text-center p-2">
              <span className="text-xs font-medium text-gray-500 block mb-1">Future Investment Value</span>
              <span className="text-2xl font-extrabold font-mono text-[var(--ink)]">
                {formatAmount(compFutureValue)}
              </span>
              <span className="text-[10px] text-[var(--muted)] block mt-0.5">
                APY: {(compAPY * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Circular Donut Graph & Visual Breakdown (3 Segments) */}
          <div className="p-5 rounded-2xl border space-y-4"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--ink)]">
                <PieChart className="w-4 h-4 text-[var(--brand)]" />
                <span>Portfolio Growth Breakdown (Circular Chart)</span>
              </h3>
              <span className="text-xs font-mono text-[var(--muted)]">
                {currency.code}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-around gap-6 pt-2">
              {/* SVG Circular Donut Chart */}
              <div className="relative flex items-center justify-center">
                <svg
                  width="190"
                  height="190"
                  viewBox="0 0 190 190"
                  className="transform -rotate-90"
                >
                  {/* Background Track */}
                  <circle
                    cx="95"
                    cy="95"
                    r={chartRadius}
                    fill="transparent"
                    stroke="var(--line)"
                    strokeWidth={strokeWidth}
                  />

                  {/* Segment 1: Initial Principal (Brand) */}
                  <circle
                    cx="95"
                    cy="95"
                    r={chartRadius}
                    fill="transparent"
                    stroke="var(--brand)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${compPrincipalDash} ${circumference}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />

                  {/* Segment 2: Additional Deposits (Cyan) */}
                  {totalCompDeposits > 0 && (
                    <circle
                      cx="95"
                      cy="95"
                      r={chartRadius}
                      fill="transparent"
                      stroke="#06b6d4"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${compDepositsDash} ${circumference}`}
                      strokeDashoffset={-compPrincipalDash}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  )}

                  {/* Segment 3: Compound Interest (Emerald) */}
                  {compTotalInterest > 0 && (
                    <circle
                      cx="95"
                      cy="95"
                      r={chartRadius}
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${compInterestDash} ${circumference}`}
                      strokeDashoffset={-(compPrincipalDash + compDepositsDash)}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  )}
                </svg>

                {/* Center Content Inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Maturity Balance
                  </span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-[var(--ink)] leading-tight">
                    {formatAmount(compFutureValue)}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                    +{compInterestPercent.toFixed(1)}% Interest
                  </span>
                </div>
              </div>

              {/* Legend & Details Column */}
              <div className="flex-1 w-full max-w-sm space-y-2.5">
                {/* Initial Principal */}
                <div className="p-2.5 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[var(--brand)] flex-shrink-0" />
                    <span className="text-xs font-semibold text-[var(--ink)]">Starting Principal</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-[var(--brand)]">
                    {formatAmount(compPrincipal)} ({compPrincipalPercent.toFixed(1)}%)
                  </span>
                </div>

                {/* Additional Deposits */}
                <div className="p-2.5 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-[var(--ink)]">Additional Deposits</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    {formatAmount(totalCompDeposits)} ({compDepositsPercent.toFixed(1)}%)
                  </span>
                </div>

                {/* Compound Interest */}
                <div className="p-2.5 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-[var(--ink)]">Compound Interest</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    +{formatAmount(compTotalInterest)} ({compInterestPercent.toFixed(1)}%)
                  </span>
                </div>

                {/* Ratio Bar */}
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full bg-[var(--brand)] transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, compPrincipalPercent))}%` }}
                    title={`Principal: ${formatAmount(compPrincipal)}`}
                  />
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, compDepositsPercent))}%` }}
                    title={`Deposits: ${formatAmount(totalCompDeposits)}`}
                  />
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, compInterestPercent))}%` }}
                    title={`Interest: ${formatAmount(compTotalInterest)}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Investment Growth Timeline Progression */}
          <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--ink)]">
                <BarChart3 className="w-4 h-4 text-[var(--brand)]" />
                <span>Investment Growth Timeline</span>
              </h4>
              <span className="text-[11px] text-[var(--muted)] font-mono">
                {compYearlyBreakdown.length} Years Horizon
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {compYearlyBreakdown.slice(0, 10).map((yr) => {
                const maxVal = compYearlyBreakdown[compYearlyBreakdown.length - 1]?.closing || 1;
                const prinWidth = (compPrincipal / maxVal) * 100;
                const totalWidth = (yr.closing / maxVal) * 100;

                return (
                  <div key={yr.year} className="flex items-center gap-2 text-xs font-mono">
                    <span className="w-12 text-[var(--muted)] font-bold">Yr {yr.year}</span>
                    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden flex relative">
                      <div
                        className="h-full bg-[var(--brand)] opacity-80"
                        style={{ width: `${Math.min(100, prinWidth)}%` }}
                        title={`Initial Principal: ${formatAmount(compPrincipal)}`}
                      />
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min(100, Math.max(0, totalWidth - prinWidth))}%` }}
                        title={`Closing Balance: ${formatAmount(yr.closing)}`}
                      />
                    </div>
                    <span className="w-24 text-right font-bold text-[var(--ink)] truncate">
                      {formatAmount(yr.closing)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Toggle Investment Schedule */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2 py-2">
              <button
                onClick={() => setShowCompSchedule(!showCompSchedule)}
                className="flex items-center gap-2 text-xs font-semibold text-[var(--brand)] hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  Investment Schedule ({currency.code} {currency.symbol.trim()})
                </span>
                {showCompSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showCompSchedule && (
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
                    <button
                      type="button"
                      onClick={() => setCompScheduleMode('annual')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        compScheduleMode === 'annual'
                          ? 'bg-[var(--brand)] text-white shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Annual
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompScheduleMode('monthly')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        compScheduleMode === 'monthly'
                          ? 'bg-[var(--brand)] text-white shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>

                  <button
                    onClick={downloadCompCSV}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-[var(--ink)]"
                    style={{ borderColor: 'var(--line)' }}
                    title="Export Investment Schedule as CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--brand)]" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                </div>
              )}
            </div>

            {showCompSchedule && (
              <div className="mt-3">
                {compScheduleMode === 'annual' ? (
                  <div className="overflow-x-auto border rounded-xl max-h-96" style={{ borderColor: 'var(--line)' }}>
                    <table className="w-full text-xs text-left">
                      <thead className="sticky top-0 bg-[var(--surface-2)] border-b z-10" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Year</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Opening Balance</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Deposits</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Interest Accrued</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Ending Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                        {compYearlyBreakdown.map((row) => (
                          <tr key={row.year} className="hover:bg-[var(--surface-2)] transition-colors">
                            <td className="py-2 px-3 font-bold text-[var(--brand)]">Year {row.year}</td>
                            <td className="py-2 px-3 text-right">{formatAmount(row.opening)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-cyan-600 dark:text-cyan-400">
                              {formatAmount(row.deposit)}
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                              +{formatAmount(row.interestEarned)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold">
                              {formatAmount(row.closing)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-xl max-h-96" style={{ borderColor: 'var(--line)' }}>
                    <table className="w-full text-xs text-left">
                      <thead className="sticky top-0 bg-[var(--surface-2)] border-b z-10" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Month</th>
                          <th className="py-2.5 px-3 font-semibold">Period</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Opening Balance</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Deposit</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Interest Accrued</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Ending Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono" style={{ borderColor: 'var(--line)' }}>
                        {compMonthlyBreakdown.map((row) => (
                          <tr key={row.month} className="hover:bg-[var(--surface-2)] transition-colors">
                            <td className="py-2 px-3 font-bold text-[var(--brand)]">M{row.month}</td>
                            <td className="py-2 px-3 text-[var(--muted)]">
                              Yr {row.year} &bull; M{((row.month - 1) % 12) + 1}
                            </td>
                            <td className="py-2 px-3 text-right">{formatAmount(row.opening)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-cyan-600 dark:text-cyan-400">
                              {formatAmount(row.deposit)}
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                              +{formatAmount(row.interestEarned)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold">
                              {formatAmount(row.closing)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
