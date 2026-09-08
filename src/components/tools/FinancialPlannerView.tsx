import React, { useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  Target,
  AlertTriangle,
  Download,
  FileJson,
  FileSpreadsheet,
  Printer,
  Info,
  Gauge,
  PiggyBank,
  Activity,
  Settings2,
  RefreshCw,
  Eye,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { useCurrency } from '../../lib/CurrencyContext';
import { CurrencySelector } from '../CurrencySelector';
import {
  calculateFinancialPlan,
  DEFAULT_FINANCIAL_INPUTS,
  FinancialInputs,
  FINANCIAL_MODEL_VERSION,
} from '../../lib/financial/engine';
import { FinancialPlannerPdfReport } from './FinancialPlannerPdfReport';
import { generateFinancialAdvisoryPdf } from '../../lib/financial/generateFinancialPdf';

interface FinancialPlannerViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
}

type Mode = 'basic' | 'advanced';

const DISCLAIMER =
  'This calculator provides estimates based on assumptions entered by the user. Actual investment returns, inflation, taxes, expenses and longevity may differ materially. This tool is for educational and planning purposes and is not financial, investment, tax or legal advice.';

export const FinancialPlannerView: React.FC<FinancialPlannerViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  const { formatAmount, currency } = useCurrency();
  const [mode, setMode] = useState<Mode>('basic');
  const [inputs, setInputs] = useState<FinancialInputs>({ ...DEFAULT_FINANCIAL_INPUTS });
  const [realValues, setRealValues] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSavedSuccess, setPdfSavedSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const plan = useMemo(() => calculateFinancialPlan(inputs), [inputs]);

  const update = (key: keyof FinancialInputs, value: number) =>
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : 0 }));

  // Compact currency formatting (lakh / crore for INR, else compact fallback).
  const fmt = (value: number, years = 0): string => {
    let v = value;
    if (realValues && years > 0) v = value / Math.pow(1 + inputs.inflation / 100, years);
    if (currency.code === 'INR') {
      const abs = Math.abs(v);
      if (abs >= 1e7) return `${currency.symbol}${(v / 1e7).toFixed(2)} cr`;
      if (abs >= 1e5) return `${currency.symbol}${(v / 1e5).toFixed(2)} lakh`;
      return formatAmount(v, 0);
    }
    const abs = Math.abs(v);
    if (abs >= 1e9) return `${currency.symbol}${(v / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${currency.symbol}${(v / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${currency.symbol}${(v / 1e3).toFixed(1)}K`;
    return formatAmount(v, 0);
  };

  const exactFmt = (value: number) => formatAmount(value, 0);

  // ---- Validation ----
  const errors: string[] = [];
  if (inputs.currentAge < 18 || inputs.currentAge > 80) errors.push('Current age must be between 18 and 80.');
  if (inputs.retirementAge <= inputs.currentAge) errors.push('Retirement age must be greater than current age.');
  if (inputs.lifeExpectancy <= inputs.retirementAge) errors.push('Life expectancy must be greater than retirement age.');
  if (inputs.monthlySip < 0) errors.push('Monthly SIP cannot be negative.');
  if (inputs.currentCorpus < 0) errors.push('Current corpus cannot be negative.');

  const readiness = plan.fundingRatio;
  const statusColor =
    readiness >= 1 ? '#16a34a' : readiness >= 0.8 ? '#f59e0b' : readiness >= 0.6 ? '#f97316' : '#dc2626';
  const statusLabel =
    readiness >= 1.1
      ? '🟢 Strongly on track'
      : readiness >= 1
      ? '🟢 On track'
      : readiness >= 0.8
      ? '🟡 Needs attention'
      : readiness >= 0.6
      ? '🟠 Significant gap'
      : '🔴 Shortfall';

  // ---- Exports & PDF Report ----
  const buildReportData = () => ({
    version: FINANCIAL_MODEL_VERSION,
    clientName: plan.clientName,
    currency: currency.code,
    generated: new Date().toISOString(),
    inputs: {
      ...inputs,
      clientName: plan.clientName,
    },
    summary: {
      financialHealth: plan.scores.financialHealth,
      retirementReadiness: plan.scores.retirementReadiness,
      projectedCorpus: plan.projectedCorpus,
      requiredCorpus: plan.requiredCorpus,
      surplusOrShortfall: plan.surplusOrShortfall,
      requiredMonthlySip: plan.requiredMonthlySip,
      financialIndependenceAge: plan.financialIndependenceAge,
      depletionAge: plan.depletionAge,
    },
    accumulation: plan.accumulation,
    retirement: plan.retirement,
    scenarios: plan.scenarios,
    inflationSensitivity: plan.inflationSensitivity,
    returnSensitivity: plan.returnSensitivity,
    scores: plan.scores,
    recommendations: plan.recommendations,
  });

  const download = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSlug = (name?: string) =>
    (name && name.trim() ? name.trim() : 'client')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'client';

  const exportJson = () => {
    const slug = getSlug(inputs.clientName);
    download(`financial-plan-${slug}.json`, JSON.stringify(buildReportData(), null, 2), 'application/json');
  };

  const exportCsv = () => {
    const client = (inputs.clientName && inputs.clientName.trim()) ? inputs.clientName.trim() : 'Valued Client';
    const metadata = [
      ['# CodePackr Enterprise Financial Plan', ''],
      ['# Client / Plan Holder', client],
      ['# Currency', currency.code],
      ['# Generated', new Date().toISOString()],
      ['# Financial Health Score', `${plan.scores.financialHealth.toFixed(0)}/100`],
      ['# Projected Corpus', Math.round(plan.projectedCorpus)],
      ['# Required Corpus', Math.round(plan.requiredCorpus)],
      ['# Funding Ratio', `${(plan.fundingRatio * 100).toFixed(1)}%`],
      ['# Sustainability Status', plan.sustainabilityStatus],
      [''],
    ];
    const header = [
      'Phase',
      'Year',
      'Age',
      'Income',
      'Expenses',
      'Contribution/Withdrawal',
      'OpeningCorpus',
      'Growth',
      'ClosingCorpus',
    ];
    const rows: (string | number)[][] = [...metadata, header];
    plan.accumulation.forEach((r) =>
      rows.push([
        'Accumulation',
        r.year,
        r.age,
        Math.round(r.income),
        Math.round(r.expenses),
        Math.round(r.annualContribution),
        Math.round(r.openingCorpus),
        Math.round(r.investmentGrowth),
        Math.round(r.closingCorpus),
      ])
    );
    plan.retirement.forEach((r) =>
      rows.push([
        'Retirement',
        r.year,
        r.age,
        0,
        Math.round(r.expenses),
        -Math.round(r.withdrawal),
        Math.round(r.openingCorpus),
        Math.round(r.growth),
        Math.round(r.closingCorpus),
      ])
    );
    const csv = rows.map((r) => r.join(',')).join('\n');
    const slug = getSlug(inputs.clientName);
    download(`financial-plan-${slug}.csv`, csv, 'text/csv');
  };

  const handleSavePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const client = (inputs.clientName && inputs.clientName.trim()) ? inputs.clientName.trim() : 'Valued_Client';
      const safeClient = client.replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `CodePackr_Financial_Advisory_Report_${safeClient}_${dateStr}.pdf`;

      // Allow UI spinner to mount before generating PDF
      await new Promise((resolve) => setTimeout(resolve, 80));

      const doc = generateFinancialAdvisoryPdf({
        plan,
        inputs,
        currency,
        formatAmount,
      });

      doc.save(filename);
      setPdfSavedSuccess(true);
      setTimeout(() => setPdfSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to generate PDF via jsPDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleBrowserPrint = () => {
    const originalTitle = document.title;
    const client = (inputs.clientName && inputs.clientName.trim()) ? inputs.clientName.trim() : 'Valued_Client';
    const safeClient = client.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    document.title = `CodePackr_Financial_Advisory_Report_${safeClient}_${dateStr}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  // ---- Small SVG chart helpers ----
  const corpusSeries = [
    { age: inputs.currentAge, value: inputs.currentCorpus },
    ...plan.accumulation.map((r) => ({ age: r.age, value: r.closingCorpus })),
  ];
  const retirementSeries = [
    { age: inputs.retirementAge, value: plan.projectedCorpus },
    ...plan.retirement.map((r) => ({ age: r.age, value: r.closingCorpus })),
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Dedicated Executive PDF Report (Print-only) */}
      <FinancialPlannerPdfReport
        plan={plan}
        inputs={inputs}
        currency={currency}
        formatAmount={formatAmount}
      />

      {/* Interactive Web Workspace (Hidden during print) */}
      <div className="space-y-6 print:hidden">
        <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

        {/* Controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
              {(['basic', 'advanced'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="px-4 py-2 text-xs font-semibold capitalize cursor-pointer transition-colors"
                  style={{
                    backgroundColor: mode === m ? 'var(--brand)' : 'var(--surface)',
                    color: mode === m ? '#fff' : 'var(--muted)',
                  }}
                >
                  {m} mode
                </button>
              ))}
            </div>
            <button
              onClick={() => setRealValues((v) => !v)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border cursor-pointer flex items-center gap-1.5"
              style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)', color: 'var(--muted)' }}
              title="Toggle between future nominal values and today's money"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {realValues ? "Today's money" : 'Nominal values'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border cursor-pointer flex items-center gap-1.5 transition-colors"
              style={{
                borderColor: 'var(--line)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
              }}
              title="Preview formal client advisory PDF report"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Report
            </button>
            <button
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-75"
              style={{
                borderColor: pdfSavedSuccess ? '#16a34a' : 'var(--brand)',
                backgroundColor: pdfSavedSuccess ? '#16a34a' : 'var(--brand)',
                color: '#ffffff',
              }}
              title="Save high-resolution executive PDF advisory report"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating PDF...
                </>
              ) : pdfSavedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  PDF Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Save PDF Report
                </>
              )}
            </button>
            <CurrencySelector />
            <button onClick={() => setInputs({ ...DEFAULT_FINANCIAL_INPUTS })} className="px-3 py-2 text-xs font-semibold rounded-xl border cursor-pointer" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)', color: 'var(--muted)' }}>
              Reset
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="p-3 rounded-xl border flex items-start gap-2 text-xs" style={{ borderColor: '#f59e0b55', backgroundColor: '#f59e0b15', color: '#b45309' }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <ul className="space-y-0.5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---------- INPUTS ---------- */}
          <div className="lg:col-span-1 space-y-4">
            <Section title="Personal Profile" icon={<Settings2 className="w-4 h-4" />}>
              <div className="block">
                <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Client / Plan Holder Name</span>
                <input
                  type="text"
                  value={inputs.clientName ?? ''}
                  placeholder="e.g. Valued Client / John Doe"
                  onChange={(e) => setInputs((prev) => ({ ...prev, clientName: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-[var(--brand)] transition-colors"
                  style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
                />
              </div>
              <NumField label="Current age" value={inputs.currentAge} min={18} max={80} onChange={(v) => update('currentAge', v)} />
              <NumField label="Retirement age" value={inputs.retirementAge} min={inputs.currentAge + 1} max={90} onChange={(v) => update('retirementAge', v)} />
              <NumField label="Life expectancy" value={inputs.lifeExpectancy} min={inputs.retirementAge + 1} max={110} onChange={(v) => update('lifeExpectancy', v)} />
            </Section>

          <Section title="Income & Expenses" icon={<Wallet className="w-4 h-4" />}>
            <NumField label="Annual income (after deductions)" value={inputs.annualIncome} onChange={(v) => update('annualIncome', v)} />
            <NumField label="Income growth %" value={inputs.incomeGrowth} step={0.5} onChange={(v) => update('incomeGrowth', v)} />
            <NumField label="Annual living expenses" value={inputs.annualExpenses} onChange={(v) => update('annualExpenses', v)} />
            <NumField label="General inflation %" value={inputs.inflation} step={0.5} onChange={(v) => update('inflation', v)} />
          </Section>

          <Section title="Investments" icon={<PiggyBank className="w-4 h-4" />}>
            <NumField label="Current investable corpus" value={inputs.currentCorpus} onChange={(v) => update('currentCorpus', v)} />
            <NumField label="Monthly SIP" value={inputs.monthlySip} onChange={(v) => update('monthlySip', v)} />
            <NumField label="Annual SIP step-up %" value={inputs.sipStepUp} min={0} max={50} step={1} onChange={(v) => update('sipStepUp', v)} />
            <NumField label="Assumed pre-retirement return %" value={inputs.preReturn} step={0.5} onChange={(v) => update('preReturn', v)} />
            <NumField label="Assumed post-retirement return %" value={inputs.postReturn} step={0.5} onChange={(v) => update('postReturn', v)} />
          </Section>

          {mode === 'advanced' && (
            <Section title="Advanced Options" icon={<Activity className="w-4 h-4" />}>
              <NumField label="Annual lump-sum investment" value={inputs.annualLumpSum} onChange={(v) => update('annualLumpSum', v)} />
              <NumField label="Emergency fund" value={inputs.emergencyFund} onChange={(v) => update('emergencyFund', v)} />
              <NumField label="Target emergency months" value={inputs.emergencyMonths} min={0} max={24} step={1} onChange={(v) => update('emergencyMonths', v)} />
              <NumField label="Total outstanding debt" value={inputs.totalDebt} onChange={(v) => update('totalDebt', v)} />
              <NumField label="Annual debt repayment" value={inputs.annualDebtPayment} onChange={(v) => update('annualDebtPayment', v)} />
              <NumField label="Annual retirement income (pension/rental)" value={inputs.annualRetirementIncome} onChange={(v) => update('annualRetirementIncome', v)} />
            </Section>
          )}
        </div>

        {/* ---------- RESULTS ---------- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key result cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard icon={<Gauge className="w-4 h-4" />} label="Financial Health" value={`${plan.scores.financialHealth.toFixed(0)}/100`} />
            <StatCard icon={<Target className="w-4 h-4" />} label="Retirement Readiness" value={`${(readiness * 100).toFixed(0)}%`} accent={statusColor} />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Projected Corpus" value={fmt(plan.projectedCorpus, plan.yearsToRetirement)} title={exactFmt(plan.projectedCorpus)} />
            <StatCard icon={<Target className="w-4 h-4" />} label="Required Corpus" value={fmt(plan.requiredCorpus, plan.yearsToRetirement)} title={exactFmt(plan.requiredCorpus)} />
            <StatCard
              icon={plan.surplusOrShortfall >= 0 ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              label={plan.surplusOrShortfall >= 0 ? 'Surplus' : 'Shortfall'}
              value={fmt(Math.abs(plan.surplusOrShortfall), plan.yearsToRetirement)}
              accent={plan.surplusOrShortfall >= 0 ? '#16a34a' : '#dc2626'}
              title={exactFmt(Math.abs(plan.surplusOrShortfall))}
            />
            <StatCard icon={<Wallet className="w-4 h-4" />} label="Required Monthly SIP" value={fmt(plan.requiredMonthlySip)} title={exactFmt(plan.requiredMonthlySip)} />
          </div>

          {/* Readiness gauge + status */}
          <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Retirement Readiness</h3>
              <span className="text-xs font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--line)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, readiness * 100)}%`, backgroundColor: statusColor }} />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs" style={{ color: 'var(--muted)' }}>
              <span>Projected: <strong style={{ color: 'var(--ink)' }}>{fmt(plan.projectedCorpus, plan.yearsToRetirement)}</strong></span>
              <span>Required: <strong style={{ color: 'var(--ink)' }}>{fmt(plan.requiredCorpus, plan.yearsToRetirement)}</strong></span>
              <span>Sustainability: <strong style={{ color: 'var(--ink)' }}>{plan.sustainabilityStatus}</strong></span>
              <span>Depletion age: <strong style={{ color: 'var(--ink)' }}>{plan.depletionAge ?? 'Survives'}</strong></span>
              <span>FI age: <strong style={{ color: 'var(--ink)' }}>{plan.financialIndependenceAge ?? 'Not reached'}</strong></span>
            </div>
            {plan.cashFlowDeficit && (
              <div className="mt-2 text-xs font-semibold" style={{ color: '#dc2626' }}>Current cash-flow deficit — expenses and debt exceed income.</div>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title="Investment Corpus Growth">
              <LineChart series={[{ points: corpusSeries, color: 'var(--brand)' }]} formatY={(v) => fmt(v)} xLabel="Age" />
            </ChartCard>
            <ChartCard title="Retirement Corpus Sustainability">
              <LineChart series={[{ points: retirementSeries, color: statusColor }]} formatY={(v) => fmt(v)} xLabel="Age" />
            </ChartCard>
            <ChartCard title="Income vs Expenses">
              <LineChart
                series={[
                  { points: plan.accumulation.map((r) => ({ age: r.age, value: r.income })), color: '#16a34a' },
                  { points: plan.accumulation.map((r) => ({ age: r.age, value: r.expenses })), color: '#dc2626' },
                ]}
                formatY={(v) => fmt(v)}
                xLabel="Age"
                legend={['Income', 'Expenses']}
              />
            </ChartCard>
            <ChartCard title="Contributions vs Investment Growth">
              <DonutChart
                segments={[
                  { label: 'Contributions', value: plan.totalContributions + inputs.currentCorpus, color: '#6366f1' },
                  { label: 'Growth', value: plan.totalGrowth, color: '#22c55e' },
                ]}
                formatValue={(v) => fmt(v)}
              />
            </ChartCard>
          </div>

          {/* Scenarios */}
          <TableCard title="Scenario Analysis (Conservative / Base / Optimistic)">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left" style={{ color: 'var(--muted)' }}>
                  <Th>Scenario</Th><Th>Pre %</Th><Th>Post %</Th><Th>Projected</Th><Th>Required</Th><Th>Funding</Th><Th>Depletion</Th>
                </tr>
              </thead>
              <tbody>
                {plan.scenarios.map((s) => (
                  <tr key={s.key} className="border-t" style={{ borderColor: 'var(--line)' }}>
                    <Td strong>{s.label}</Td>
                    <Td>{s.preReturn}</Td>
                    <Td>{s.postReturn}</Td>
                    <Td>{fmt(s.projectedCorpus, plan.yearsToRetirement)}</Td>
                    <Td>{fmt(s.requiredCorpus, plan.yearsToRetirement)}</Td>
                    <Td>{(s.fundingRatio * 100).toFixed(0)}%</Td>
                    <Td>{s.depletionAge ?? 'Survives'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          {/* Sensitivity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TableCard title="Inflation Sensitivity">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left" style={{ color: 'var(--muted)' }}>
                    <Th>Inflation</Th><Th>Retire Expense</Th><Th>Required</Th><Th>Funding</Th>
                  </tr>
                </thead>
                <tbody>
                  {plan.inflationSensitivity.map((r) => (
                    <tr key={r.label} className="border-t" style={{ borderColor: 'var(--line)' }}>
                      <Td strong>{r.label}</Td>
                      <Td>{fmt(r.retirementExpense || 0)}</Td>
                      <Td>{fmt(r.requiredCorpus || 0)}</Td>
                      <Td>{(r.fundingRatio * 100).toFixed(0)}%</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>
            <TableCard title="Return Sensitivity">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left" style={{ color: 'var(--muted)' }}>
                    <Th>Return</Th><Th>Projected</Th><Th>Funding</Th><Th>Depletion</Th>
                  </tr>
                </thead>
                <tbody>
                  {plan.returnSensitivity.map((r) => (
                    <tr key={r.label} className="border-t" style={{ borderColor: 'var(--line)' }}>
                      <Td strong>{r.label}</Td>
                      <Td>{fmt(r.projectedCorpus || 0)}</Td>
                      <Td>{(r.fundingRatio * 100).toFixed(0)}%</Td>
                      <Td>{r.depletionAge ?? 'Survives'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>
          </div>

          {/* Recommendations */}
          <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
              <Target className="w-4 h-4" /> What should you change?
            </h3>
            <div className="space-y-2">
              {plan.recommendations.map((r) => (
                <div key={r.id} className="p-3 rounded-xl border flex items-start gap-3" style={{ borderColor: 'var(--line)' }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand)' }}>{r.priority}</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{r.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.detail}</div>
                    <div className="text-xs mt-1 font-semibold" style={{ color: 'var(--brand)' }}>{r.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health breakdown */}
          <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>Why is my score {plan.scores.financialHealth.toFixed(0)}?</h3>
            <div className="space-y-2">
              {plan.scores.healthBreakdown.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-0.5" style={{ color: 'var(--muted)' }}>
                    <span>{b.label} <span className="opacity-60">({(b.weight * 100).toFixed(0)}%)</span></span>
                    <span style={{ color: 'var(--ink)' }}>{b.score.toFixed(0)}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--line)' }}>
                    <div className="h-full rounded-full" style={{ width: `${b.score}%`, backgroundColor: 'var(--brand)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Year-by-year projection */}
          <TableCard title="Year-by-Year Projection">
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0" style={{ backgroundColor: 'var(--surface)' }}>
                  <tr className="text-left" style={{ color: 'var(--muted)' }}>
                    <Th>Age</Th><Th>Income</Th><Th>Expenses</Th><Th>Contribution</Th><Th>Growth</Th><Th>Closing Corpus</Th>
                  </tr>
                </thead>
                <tbody>
                  {plan.accumulation.map((r) => (
                    <tr key={r.age} className="border-t" style={{ borderColor: 'var(--line)' }}>
                      <Td strong>{r.age}</Td>
                      <Td>{fmt(r.income)}</Td>
                      <Td>{fmt(r.expenses)}</Td>
                      <Td>{fmt(r.annualContribution)}</Td>
                      <Td>{fmt(r.investmentGrowth)}</Td>
                      <Td>{fmt(r.closingCorpus)}</Td>
                    </tr>
                  ))}
                  {plan.retirement.map((r) => (
                    <tr key={`ret-${r.age}`} className="border-t" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--brand-light)' }}>
                      <Td strong>{r.age}</Td>
                      <Td>—</Td>
                      <Td>{fmt(r.expenses)}</Td>
                      <Td>-{fmt(r.withdrawal)}</Td>
                      <Td>{fmt(r.growth)}</Td>
                      <Td>{fmt(r.closingCorpus)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>

          {/* Export center */}
          <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
              <Download className="w-4 h-4" /> Download &amp; Export Advisory Report
            </h3>
            <div className="flex flex-wrap gap-2">
              <ExportBtn
                onClick={handleSavePdf}
                icon={
                  isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : pdfSavedSuccess ? (
                    <Check className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )
                }
                label={isGeneratingPdf ? 'Generating PDF...' : pdfSavedSuccess ? 'PDF Downloaded!' : 'Save PDF Report'}
                primary
              />
              <ExportBtn onClick={() => setIsPreviewOpen(true)} icon={<Eye className="w-4 h-4" />} label="Preview Report" />
              <ExportBtn onClick={handleBrowserPrint} icon={<Printer className="w-4 h-4" />} label="Print (Browser)" />
              <ExportBtn onClick={exportCsv} icon={<FileSpreadsheet className="w-4 h-4" />} label="Export CSV" />
              <ExportBtn onClick={exportJson} icon={<FileJson className="w-4 h-4" />} label="Export JSON" />
            </div>
          </div>

          {/* Assumptions + Disclaimer */}
          <div className="p-4 rounded-2xl border text-xs" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)', color: 'var(--muted)' }}>
            <div className="font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--ink)' }}><Info className="w-4 h-4" /> Assumptions</div>
            <p>Model v{FINANCIAL_MODEL_VERSION} · Age {inputs.currentAge}→{inputs.retirementAge}, life {inputs.lifeExpectancy} · Inflation {inputs.inflation}% · Pre-return {inputs.preReturn}% · Post-return {inputs.postReturn}% · SIP {exactFmt(inputs.monthlySip)}/mo, step-up {inputs.sipStepUp}%.</p>
            <p className="mt-2 italic">{DISCLAIMER}</p>
          </div>
        </div>
      </div>
      </div>

      {/* Report Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)' }}
          >
            {/* Modal Header */}
            <div
              className="p-4 border-b flex items-center justify-between gap-3 shrink-0"
              style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                    Executive Advisory Report Preview
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Formal Actuarial Plan for {inputs.clientName || 'Valued Client'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSavePdf}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-75"
                  style={{
                    borderColor: pdfSavedSuccess ? '#16a34a' : 'var(--brand)',
                    backgroundColor: pdfSavedSuccess ? '#16a34a' : 'var(--brand)',
                    color: '#ffffff',
                  }}
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : pdfSavedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      PDF Downloaded!
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </>
                  )}
                </button>
                <button
                  onClick={handleBrowserPrint}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border cursor-pointer flex items-center gap-1.5"
                  style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)', color: 'var(--ink)' }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-xl border cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)', color: 'var(--muted)' }}
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Preview of Report */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950">
              <div className="max-w-3xl mx-auto">
                <FinancialPlannerPdfReport
                  plan={plan}
                  inputs={inputs}
                  currency={currency}
                  formatAmount={formatAmount}
                  isPreview={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Presentational helpers ----------

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
    <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--ink)' }}>{icon}{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const NumField: React.FC<{ label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void }> = ({ label, value, min, max, step = 1, onChange }) => (
  <label className="block">
    <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
    <input
      type="number"
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      step={step}
      inputMode="decimal"
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="mt-1 w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-[var(--brand)] transition-colors"
      style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
    />
  </label>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; accent?: string; title?: string }> = ({ icon, label, value, accent, title }) => (
  <div className="p-3 rounded-2xl border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }} title={title}>
    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>{icon}{label}</div>
    <div className="text-lg font-extrabold mt-1" style={{ color: accent || 'var(--ink)' }}>{value}</div>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
    <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--ink)' }}>{title}</h3>
    {children}
  </div>
);

const TableCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-4 rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
    <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>{title}</h3>
    {children}
  </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="py-1.5 pr-3 font-semibold whitespace-nowrap">{children}</th>
);
const Td: React.FC<{ children: React.ReactNode; strong?: boolean }> = ({ children, strong }) => (
  <td className="py-1.5 pr-3 whitespace-nowrap" style={{ color: strong ? 'var(--ink)' : 'var(--muted)', fontWeight: strong ? 600 : 400 }}>{children}</td>
);

const ExportBtn: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string; primary?: boolean }> = ({ onClick, icon, label, primary }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-xs font-semibold rounded-xl border cursor-pointer flex items-center gap-2 transition-colors"
    style={{
      borderColor: primary ? 'var(--brand)' : 'var(--line)',
      backgroundColor: primary ? 'var(--brand)' : 'var(--surface)',
      color: primary ? '#fff' : 'var(--muted)',
    }}
  >
    {icon}{label}
  </button>
);

// ---------- SVG charts ----------

interface Point { age: number; value: number; }

const LineChart: React.FC<{
  series: { points: Point[]; color: string }[];
  formatY: (v: number) => string;
  xLabel?: string;
  legend?: string[];
}> = ({ series, formatY, legend }) => {
  const W = 320, H = 160, pad = 8;
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) return <div className="text-xs" style={{ color: 'var(--muted)' }}>No data</div>;
  const minAge = Math.min(...allPoints.map((p) => p.age));
  const maxAge = Math.max(...allPoints.map((p) => p.age));
  const maxVal = Math.max(...allPoints.map((p) => p.value), 1);
  const x = (age: number) => pad + ((age - minAge) / Math.max(1, maxAge - minAge)) * (W - 2 * pad);
  const y = (val: number) => H - pad - (val / maxVal) * (H - 2 * pad);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 160 }} role="img" aria-label="line chart">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--line)" strokeWidth={1} />
        {series.map((s, i) => (
          <polyline
            key={i}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            points={s.points.map((p) => `${x(p.age)},${y(p.value)}`).join(' ')}
          />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
        <span>{minAge}</span>
        <span>Peak {formatY(maxVal)}</span>
        <span>{maxAge}</span>
      </div>
      {legend && (
        <div className="flex gap-3 mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>
          {legend.map((l, i) => (
            <span key={l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: series[i]?.color }} />{l}</span>
          ))}
        </div>
      )}
    </div>
  );
};

const DonutChart: React.FC<{ segments: { label: string; value: number; color: string }[]; formatValue: (v: number) => string }> = ({ segments, formatValue }) => {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  const R = 60, C = 80, stroke = 24;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" className="w-32 h-32" role="img" aria-label="donut chart">
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {segments.map((s) => {
          const frac = Math.max(0, s.value) / total;
          const dash = frac * circ;
          const el = (
            <circle
              key={s.label}
              cx={C}
              cy={C}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${C} ${C})`}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="space-y-1 text-xs">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}: <strong style={{ color: 'var(--ink)' }}>{formatValue(s.value)}</strong> ({((Math.max(0, s.value) / total) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
