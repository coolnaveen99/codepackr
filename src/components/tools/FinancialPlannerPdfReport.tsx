import React from 'react';
import { FinancialPlan, FinancialInputs } from '../../lib/financial/engine';
import { CurrencyDefinition } from '../../lib/currency';
import {
  ShieldCheck,
  Target,
  TrendingUp,
  Award,
  Calendar,
  User,
  CheckCircle2,
  Lock,
  Wallet,
  BarChart3,
  TableProperties,
} from 'lucide-react';

interface FinancialPlannerPdfReportProps {
  plan: FinancialPlan;
  inputs: FinancialInputs;
  currency: CurrencyDefinition;
  formatAmount: (amount: number, decimals?: number) => string;
  isPreview?: boolean;
}

export const FinancialPlannerPdfReport: React.FC<FinancialPlannerPdfReportProps> = ({
  plan,
  inputs,
  currency,
  formatAmount,
  isPreview = false,
}) => {
  const clientName =
    inputs.clientName && inputs.clientName.trim()
      ? inputs.clientName.trim()
      : plan.clientName && plan.clientName.trim()
      ? plan.clientName.trim()
      : 'Valued Client';

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const generationTimestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const readiness = plan.fundingRatio;
  const isFunded = readiness >= 1.0;
  const statusColor = isFunded
    ? '#16a34a'
    : readiness >= 0.8
    ? '#d97706'
    : '#dc2626';

  const statusLabel = readiness >= 1.1
    ? 'Fully Funded · Surplus Runway'
    : readiness >= 1.0
    ? 'Fully Funded · On Target'
    : readiness >= 0.8
    ? 'Moderate Gap · Minor Adjustments Needed'
    : 'Significant Shortfall · Restructuring Advised';

  const exactFmt = (val: number) => formatAmount(Math.round(val), 0);

  const fmtCompact = (num: number): string => {
    const abs = Math.abs(num);
    if (currency.code === 'INR') {
      if (abs >= 1e7) return `INR ${(num / 1e7).toFixed(2)} Cr`;
      if (abs >= 1e5) return `INR ${(num / 1e5).toFixed(2)} Lakh`;
      return `INR ${Math.round(num).toLocaleString('en-US')}`;
    }
    if (abs >= 1e9) return `${currency.code} ${(num / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${currency.code} ${(num / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${currency.code} ${(num / 1e3).toFixed(1)}K`;
    return `${currency.code} ${Math.round(num).toLocaleString('en-US')}`;
  };

  // Pre-calculate chart series
  const accumulationSeries = [
    { age: inputs.currentAge, value: inputs.currentCorpus },
    ...plan.accumulation.map((r) => ({ age: r.age, value: r.closingCorpus })),
  ];
  const maxAccum = Math.max(...accumulationSeries.map((s) => s.value), 1);

  const retirementSeries = [
    { age: inputs.retirementAge, value: plan.projectedCorpus },
    ...plan.retirement.map((r) => ({ age: r.age, value: r.closingCorpus })),
  ];
  const maxRetirement = Math.max(...retirementSeries.map((s) => s.value), 1);

  const maxCashFlow = Math.max(
    ...plan.accumulation.map((r) => Math.max(r.income, r.expenses)),
    1
  );

  const totalCorp = plan.totalContributions + plan.totalGrowth || 1;
  const contribPct = Math.round((plan.totalContributions / totalCorp) * 100);
  const growthPct = 100 - contribPct;

  const buildSvgPath = (
    pts: { age: number; value: number }[],
    minAge: number,
    maxAge: number,
    maxVal: number,
    w = 260,
    h = 90
  ) => {
    if (pts.length < 2) return '';
    return pts
      .map((p, idx) => {
        const x = ((p.age - minAge) / Math.max(1, maxAge - minAge)) * w;
        const y = h - (p.value / maxVal) * (h - 10) - 5;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div
      id={isPreview ? 'financial-planner-pdf-preview' : 'financial-planner-pdf-report'}
      className={
        isPreview
          ? 'relative w-full bg-white text-slate-900 font-sans p-6 sm:p-10 shadow-2xl rounded-2xl border border-slate-200 overflow-hidden'
          : 'hidden print:block relative w-full bg-white text-slate-900 font-sans p-0 m-0 print-page-container'
      }
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Subtle Security Watermark */}
      <div
        className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden z-0 select-none"
        aria-hidden="true"
      >
        <span
          className="text-slate-900 font-black tracking-widest uppercase opacity-[0.03] text-7xl md:text-8xl select-none"
          style={{
            transform: 'rotate(-35deg)',
            letterSpacing: '0.15em',
          }}
        >
          codepackr.com
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        {/* ========================================================================= */}
        {/* 1. HIGH-VISIBILITY CODEPACKR ENTERPRISE BRAND BANNER                       */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 rounded-xl p-3 sm:p-4 text-white flex items-center justify-between shadow-sm">
          <div>
            <div className="text-base font-black tracking-wider flex items-center gap-2">
              <span className="text-blue-400">CODEPACKR</span> ENTERPRISE
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              FINANCIAL PLANNING &amp; ACTUARIAL ADVISORY SUITE
            </div>
          </div>
          <div className="bg-blue-600 hover:bg-blue-500 transition-colors px-3.5 py-1.5 rounded-lg text-xs font-black tracking-wide text-white border border-blue-400 shadow-xs flex items-center gap-1.5">
            <span>www.codepackr.com</span>
          </div>
        </div>

        {/* Title and Metadata */}
        <header className="border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold tracking-wider uppercase mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Strategic Wealth &amp; Retirement Readiness Analysis
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Institutional Financial Plan for {clientName}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Enterprise Actuarial Projections · Model v{plan.version} · 100% Client-Side Privacy
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-500 font-medium">
              Verified at <span className="font-bold text-blue-600">www.codepackr.com</span>
            </div>
          </div>

          {/* Client & Metadata Bar */}
          <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Client / Plan Holder
              </span>
              <p className="text-sm font-bold text-slate-900 truncate">
                {clientName}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Generation Date
              </span>
              <p className="font-semibold text-slate-800">
                {currentDate} <span className="text-[10px] text-slate-500">({generationTimestamp})</span>
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3 h-3 text-slate-400" /> Currency Base
              </span>
              <p className="font-bold text-slate-800">
                {currency.code}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3 text-slate-400" /> Planning Horizon
              </span>
              <p className="font-semibold text-slate-800">
                Age {inputs.currentAge} to {inputs.lifeExpectancy} ({inputs.lifeExpectancy - inputs.currentAge} Yrs)
              </p>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. EXECUTIVE CAPITAL SUMMARY                                              */}
        {/* ========================================================================= */}
        <section className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Executive Capital Summary
              </h2>
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                borderColor: `${statusColor}40`,
                backgroundColor: `${statusColor}15`,
                color: statusColor,
              }}
            >
              {statusLabel}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Projected Corpus */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Projected Corpus (Age {inputs.retirementAge})
              </span>
              <p className="text-lg font-black text-slate-900 mt-1">
                {fmtCompact(plan.projectedCorpus)}
              </p>
              <span className="text-[10px] text-slate-500">
                Exact: {exactFmt(plan.projectedCorpus)}
              </span>
            </div>

            {/* Required Target */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Required Target Corpus
              </span>
              <p className="text-lg font-black text-slate-900 mt-1">
                {fmtCompact(plan.requiredCorpus)}
              </p>
              <span className="text-[10px] text-slate-500">
                Through age {inputs.lifeExpectancy}
              </span>
            </div>

            {/* Funding Ratio */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Retirement Funding Ratio
              </span>
              <p className="text-lg font-black mt-1" style={{ color: statusColor }}>
                {(readiness * 100).toFixed(1)}%
              </p>
              <span className="text-[10px] text-slate-500">
                {plan.surplusOrShortfall >= 0
                  ? `Surplus: ${fmtCompact(plan.surplusOrShortfall)}`
                  : `Gap: ${fmtCompact(Math.abs(plan.surplusOrShortfall))}`}
              </span>
            </div>

            {/* Financial Health Score */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Financial Health Score
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-lg font-black text-blue-700">
                  {plan.scores.financialHealth.toFixed(0)}
                </p>
                <span className="text-xs font-semibold text-slate-400">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Readiness composite
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. VISUAL PORTFOLIO CHARTS (4 Clean Vector Charts)                         */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Visual Wealth Projections &amp; Trajectory Modeling
            </h2>
            <span className="text-[11px] font-bold text-blue-600">
              Generated via www.codepackr.com
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Chart 1: Investment Corpus Growth */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  Investment Corpus Growth (Accumulation)
                </span>
                <span className="text-[10px] font-bold text-blue-600">
                  Peak: {fmtCompact(plan.projectedCorpus)}
                </span>
              </div>
              <div className="h-28 flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 260 90" preserveAspectRatio="none">
                  <path
                    d={buildSvgPath(accumulationSeries, inputs.currentAge, inputs.retirementAge, maxAccum)}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 mt-1">
                <span>Age {inputs.currentAge}</span>
                <span>Peak {fmtCompact(plan.projectedCorpus)}</span>
                <span>Age {inputs.retirementAge}</span>
              </div>
            </div>

            {/* Chart 2: Retirement Corpus Sustainability */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  Retirement Corpus Sustainability
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  Peak: {fmtCompact(maxRetirement)}
                </span>
              </div>
              <div className="h-28 flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 260 90" preserveAspectRatio="none">
                  <path
                    d={buildSvgPath(retirementSeries, inputs.retirementAge, inputs.lifeExpectancy, maxRetirement)}
                    fill="none"
                    stroke={isFunded ? '#16a34a' : '#dc2626'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 mt-1">
                <span>Age {inputs.retirementAge}</span>
                <span>{plan.sustainabilityStatus}</span>
                <span>Age {inputs.lifeExpectancy}</span>
              </div>
            </div>

            {/* Chart 3: Income vs Expenses */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  Income vs Annual Living Expenses
                </span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Income
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Expenses
                  </span>
                </div>
              </div>
              <div className="h-28 flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 260 90" preserveAspectRatio="none">
                  {/* Income Path */}
                  <path
                    d={buildSvgPath(
                      plan.accumulation.map((r) => ({ age: r.age, value: r.income })),
                      inputs.currentAge,
                      inputs.retirementAge,
                      maxCashFlow
                    )}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Expense Path */}
                  <path
                    d={buildSvgPath(
                      plan.accumulation.map((r) => ({ age: r.age, value: r.expenses })),
                      inputs.currentAge,
                      inputs.retirementAge,
                      maxCashFlow
                    )}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 mt-1">
                <span>Age {inputs.currentAge}</span>
                <span>Max Cashflow: {fmtCompact(maxCashFlow)}</span>
                <span>Age {inputs.retirementAge}</span>
              </div>
            </div>

            {/* Chart 4: Contributions vs Compounded Growth */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  Contributions vs Investment Growth
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Total: {fmtCompact(totalCorp)}
                </span>
              </div>

              {/* Progress Dual Bar */}
              <div className="h-5 w-full rounded-full overflow-hidden flex bg-slate-100 mt-2 mb-3">
                <div
                  className="bg-indigo-500 h-full transition-all"
                  style={{ width: `${contribPct}%` }}
                  title={`Contributions: ${contribPct}%`}
                />
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${growthPct}%` }}
                  title={`Growth: ${growthPct}%`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                  <span className="text-[10px] font-bold text-indigo-700 block">
                    CONTRIBUTIONS ({contribPct}%)
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {fmtCompact(plan.totalContributions)}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                  <span className="text-[10px] font-bold text-emerald-700 block">
                    MARKET GROWTH ({growthPct}%)
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {fmtCompact(plan.totalGrowth)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. CORE MODELING ASSUMPTIONS & STRESS TESTING                             */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-slate-700" />
              Core Planning Assumptions &amp; Cash Flow Parameters
            </h2>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-600 w-1/4">Current Age</td>
                    <td className="py-2 px-3 font-bold text-slate-900 w-1/4">{inputs.currentAge} years</td>
                    <td className="py-2 px-3 font-semibold text-slate-600 w-1/4">Annual Living Expenses</td>
                    <td className="py-2 px-3 font-bold text-slate-900 w-1/4">{exactFmt(inputs.annualExpenses)}/yr</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-600">Target Retirement Age</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{inputs.retirementAge} years</td>
                    <td className="py-2 px-3 font-semibold text-slate-600">General Inflation Rate</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{inputs.inflation}% per year</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-600">Life Expectancy Assumption</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{inputs.lifeExpectancy} years</td>
                    <td className="py-2 px-3 font-semibold text-slate-600">Pre-Retirement Return</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{inputs.preReturn}% nominal</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-3 font-semibold text-slate-600">Current Investable Corpus</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{exactFmt(inputs.currentCorpus)}</td>
                    <td className="py-2 px-3 font-semibold text-slate-600">Post-Retirement Return</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{inputs.postReturn}% nominal</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-600">Ongoing Monthly SIP</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{exactFmt(inputs.monthlySip)}/mo</td>
                    <td className="py-2 px-3 font-semibold text-slate-600">Annual SIP Step-Up</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{inputs.sipStepUp}% annually</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Scenarios Stress Testing */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              Market Scenario Stress Testing
            </h2>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-white">
                  <tr className="text-left font-bold">
                    <th className="py-2.5 px-3">Scenario</th>
                    <th className="py-2.5 px-3">Pre/Post Return</th>
                    <th className="py-2.5 px-3 text-right">Projected Corpus</th>
                    <th className="py-2.5 px-3 text-right">Required Target</th>
                    <th className="py-2.5 px-3 text-right">Funding Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {plan.scenarios.map((s) => (
                    <tr
                      key={s.key}
                      className={s.key === 'base' ? 'bg-blue-50/50 font-semibold' : ''}
                    >
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {s.label} {s.key === 'base' && '(Base Model)'}
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        {s.preReturn}% / {s.postReturn}%
                      </td>
                      <td className="py-2 px-3 text-right text-slate-900 font-medium">
                        {exactFmt(s.projectedCorpus)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-900 font-medium">
                        {exactFmt(s.requiredCorpus)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        <span
                          style={{
                            color: s.fundingRatio >= 1 ? '#16a34a' : s.fundingRatio >= 0.8 ? '#d97706' : '#dc2626',
                          }}
                        >
                          {(s.fundingRatio * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. YEAR-BY-YEAR PROJECTION SCHEDULE                                       */}
        {/* ========================================================================= */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TableProperties className="w-4 h-4 text-blue-600" />
              Comprehensive Year-by-Year Actuarial Schedule
            </h2>
            <span className="text-[11px] text-slate-500">
              Age {inputs.currentAge} to {inputs.lifeExpectancy}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-white sticky top-0 z-10">
                <tr className="text-left font-bold">
                  <th className="py-2 px-3">Age (Yr)</th>
                  <th className="py-2 px-3">Phase</th>
                  <th className="py-2 px-3 text-right">Income</th>
                  <th className="py-2 px-3 text-right">Expenses</th>
                  <th className="py-2 px-3 text-right">Net SIP / Draw</th>
                  <th className="py-2 px-3 text-right">Growth</th>
                  <th className="py-2 px-3 text-right">Closing Corpus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plan.accumulation.map((r) => (
                  <tr key={`acc-${r.age}`} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-bold text-slate-900">Age {r.age} ({r.year})</td>
                    <td className="py-1.5 px-3 font-semibold text-blue-600">Accumulation</td>
                    <td className="py-1.5 px-3 text-right text-slate-700">{exactFmt(r.income)}</td>
                    <td className="py-1.5 px-3 text-right text-slate-700">{exactFmt(r.expenses)}</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-emerald-600">+{exactFmt(r.annualContribution)}</td>
                    <td className="py-1.5 px-3 text-right text-slate-700">{exactFmt(r.investmentGrowth)}</td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">{exactFmt(r.closingCorpus)}</td>
                  </tr>
                ))}
                {plan.retirement.map((r) => (
                  <tr key={`ret-${r.age}`} className="bg-amber-50/30 hover:bg-amber-50/60">
                    <td className="py-1.5 px-3 font-bold text-slate-900">Age {r.age} ({r.year})</td>
                    <td className="py-1.5 px-3 font-semibold text-emerald-600">Retirement</td>
                    <td className="py-1.5 px-3 text-right text-slate-400">—</td>
                    <td className="py-1.5 px-3 text-right text-slate-700">{exactFmt(r.expenses)}</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-rose-600">-{exactFmt(r.withdrawal)}</td>
                    <td className="py-1.5 px-3 text-right text-slate-700">{exactFmt(r.growth)}</td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">{exactFmt(r.closingCorpus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. STRATEGIC RECOMMENDATIONS                                              */}
        {/* ========================================================================= */}
        <section>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Prioritized Strategic Recommendations for {clientName}
          </h2>

          <div className="space-y-2">
            {plan.recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="border border-slate-200 rounded-lg p-3 bg-white flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {rec.priority}
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      {rec.title}
                    </h3>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                      {rec.impact}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {rec.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FORMAL AUDIT & PRIVACY FOOTER                                          */}
        {/* ========================================================================= */}
        <footer className="border-t-2 border-slate-900 pt-3 mt-4 text-[10px] text-slate-500 space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>100% Client-Side Privacy: No financial data was transmitted to remote servers.</span>
            </div>
            <span className="text-blue-700 font-bold">www.codepackr.com</span>
          </div>

          <p className="leading-normal text-slate-400">
            <strong>Disclaimer:</strong> This report is generated strictly for informational and educational modeling purposes based on user-provided inputs and theoretical compounded return projections. It does not constitute formal financial, tax, or legal advice.
          </p>

          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-200">
            <span>Client: {clientName}</span>
            <span>Document Ref: CPK-FP-{Math.abs(Math.round(plan.requiredCorpus)).toString(36).toUpperCase()}-{Date.now().toString(36).toUpperCase()}</span>
            <span>Generated via CodePackr Client Engine (www.codepackr.com)</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
