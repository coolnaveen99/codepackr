/**
 * CodePackr Financial Planning & Retirement Engine
 * ------------------------------------------------
 * Pure, framework-free calculation engine. No UI, no rounding during
 * computation (round only for display in the component layer). Every export
 * document and chart must originate from a single `calculateFinancialPlan`
 * result to keep web + exports consistent.
 *
 * Model version is exported so reports can be stamped.
 */

export const FINANCIAL_MODEL_VERSION = '1.0';

export interface FinancialInputs {
  // Personal profile
  clientName?: string;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;

  // Income
  annualIncome: number; // take-home / after-deduction income used for cash flow
  incomeGrowth: number; // % per year (e.g. 7 = 7%)

  // Expenses
  annualExpenses: number;
  inflation: number; // % general inflation

  // Investments
  currentCorpus: number; // existing investable corpus
  monthlySip: number;
  sipStepUp: number; // % annual step-up
  annualLumpSum: number; // optional additional lump sum invested each year

  // Returns
  preReturn: number; // % assumed pre-retirement return
  postReturn: number; // % assumed post-retirement return

  // Advanced / optional (0 = not used)
  emergencyFund: number;
  emergencyMonths: number;
  totalDebt: number;
  annualDebtPayment: number;
  annualRetirementIncome: number; // pension / rental etc. (today's money)
}

export interface AccumulationRow {
  year: number;
  age: number;
  income: number;
  expenses: number;
  annualContribution: number;
  openingCorpus: number;
  investmentGrowth: number;
  closingCorpus: number;
  savingsRate: number;
}

export interface RetirementRow {
  year: number;
  age: number;
  expenses: number;
  retirementIncome: number;
  withdrawal: number;
  openingCorpus: number;
  growth: number;
  closingCorpus: number;
}

export interface ScenarioResult {
  key: 'conservative' | 'base' | 'optimistic';
  label: string;
  preReturn: number;
  postReturn: number;
  projectedCorpus: number;
  requiredCorpus: number;
  fundingRatio: number;
  depletionAge: number | null;
}

export interface SensitivityRow {
  label: string;
  delta: number;
  retirementExpense?: number;
  requiredCorpus?: number;
  projectedCorpus?: number;
  fundingRatio: number;
  depletionAge: number | null;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  impact: string; // human-readable estimated impact
  fundingRatioAfter: number;
  priority: number; // lower = higher impact
}

export interface FinancialScores {
  financialHealth: number; // 0-100
  retirementReadiness: number; // 0-100
  savingsRate: number; // fraction
  investmentRate: number; // fraction
  expenseRatio: number; // fraction
  emergencyCoverage: number; // fraction
  debtToIncome: number; // fraction
  healthBreakdown: { label: string; score: number; weight: number }[];
}

export interface FinancialPlan {
  version: string;
  clientName: string;
  inputs: FinancialInputs;
  yearsToRetirement: number;
  retirementYears: number;

  // Cash flow
  annualSavings: number;
  savingsRate: number;
  investmentRate: number;
  expenseRatio: number;
  cashFlowDeficit: boolean;

  // Emergency
  requiredEmergencyFund: number;
  emergencyCoverage: number;
  emergencyStatus: string;

  // Debt
  debtToAnnualIncome: number;

  // Accumulation
  accumulation: AccumulationRow[];
  projectedCorpus: number;
  totalContributions: number;
  totalGrowth: number;

  // Retirement
  firstYearRetirementExpense: number;
  requiredCorpus: number;
  retirement: RetirementRow[];
  depletionAge: number | null;
  surplusOrShortfall: number;
  fundingRatio: number; // projected / required
  sustainabilityStatus: string;

  // Required SIP to close the gap
  requiredMonthlySip: number;
  monthlySipGap: number;

  // Financial independence
  financialIndependenceAge: number | null;

  // Scenario + sensitivity
  scenarios: ScenarioResult[];
  inflationSensitivity: SensitivityRow[];
  returnSensitivity: SensitivityRow[];

  scores: FinancialScores;
  recommendations: Recommendation[];
}

const pct = (v: number) => v / 100;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Simulate the accumulation (pre-retirement) phase with a monthly engine so
 * that monthly SIP + annual step-up compound accurately.
 */
export function simulateAccumulation(
  inputs: FinancialInputs,
  overrides?: { preReturn?: number; inflation?: number; monthlySip?: number; sipStepUp?: number }
): { rows: AccumulationRow[]; finalCorpus: number; totalContributions: number; totalGrowth: number } {
  const years = Math.max(0, inputs.retirementAge - inputs.currentAge);
  const preReturn = overrides?.preReturn ?? inputs.preReturn;
  const inflation = overrides?.inflation ?? inputs.inflation;
  const baseSip = overrides?.monthlySip ?? inputs.monthlySip;
  const stepUp = overrides?.sipStepUp ?? inputs.sipStepUp;

  const monthlyRate = Math.pow(1 + pct(preReturn), 1 / 12) - 1;
  const rows: AccumulationRow[] = [];

  let corpus = inputs.currentCorpus;
  let income = inputs.annualIncome;
  let expenses = inputs.annualExpenses;
  let totalContributions = 0;
  let totalGrowth = 0;

  for (let y = 0; y < years; y++) {
    const openingCorpus = corpus;
    const monthlySip = baseSip * Math.pow(1 + pct(stepUp), y);
    let yearGrowth = 0;
    let yearContribution = 0;

    for (let m = 0; m < 12; m++) {
      corpus += monthlySip;
      yearContribution += monthlySip;
      const growth = corpus * monthlyRate;
      corpus += growth;
      yearGrowth += growth;
    }

    // Annual lump sum invested at year end (grows next years)
    if (inputs.annualLumpSum > 0) {
      corpus += inputs.annualLumpSum;
      yearContribution += inputs.annualLumpSum;
    }

    totalContributions += yearContribution;
    totalGrowth += yearGrowth;

    const annualSavings = income - expenses - inputs.annualDebtPayment;
    const savingsRate = income > 0 ? annualSavings / income : 0;

    rows.push({
      year: y + 1,
      age: inputs.currentAge + y + 1,
      income,
      expenses,
      annualContribution: yearContribution,
      openingCorpus,
      investmentGrowth: yearGrowth,
      closingCorpus: corpus,
      savingsRate,
    });

    income *= 1 + pct(inputs.incomeGrowth);
    expenses *= 1 + pct(inflation);
  }

  return { rows, finalCorpus: corpus, totalContributions, totalGrowth };
}

/**
 * Simulate the retirement (withdrawal) phase. Returns yearly rows and the age
 * at which the corpus is depleted (or null if it survives life expectancy).
 */
export function simulateRetirement(
  openingCorpus: number,
  firstYearExpense: number,
  inputs: FinancialInputs,
  overrides?: { postReturn?: number; inflation?: number }
): { rows: RetirementRow[]; depletionAge: number | null; endCorpus: number } {
  const postReturn = overrides?.postReturn ?? inputs.postReturn;
  const inflation = overrides?.inflation ?? inputs.inflation;
  const retirementYears = Math.max(0, inputs.lifeExpectancy - inputs.retirementAge);

  const rows: RetirementRow[] = [];
  let corpus = openingCorpus;
  let expense = firstYearExpense;
  let retirementIncome = inputs.annualRetirementIncome > 0
    ? inputs.annualRetirementIncome * Math.pow(1 + pct(inflation), inputs.retirementAge - inputs.currentAge)
    : 0;
  let depletionAge: number | null = null;

  for (let y = 0; y < retirementYears; y++) {
    const openingCorpusYear = corpus;
    const withdrawal = Math.max(0, expense - retirementIncome);
    const growth = corpus * pct(postReturn);
    corpus = corpus + growth - withdrawal;

    if (corpus < 0 && depletionAge === null) {
      depletionAge = inputs.retirementAge + y + 1;
      corpus = 0;
    }

    rows.push({
      year: y + 1,
      age: inputs.retirementAge + y + 1,
      expenses: expense,
      retirementIncome,
      withdrawal,
      openingCorpus: openingCorpusYear,
      growth,
      closingCorpus: corpus,
    });

    expense *= 1 + pct(inflation);
    retirementIncome *= 1 + pct(inflation);
  }

  return { rows, depletionAge, endCorpus: corpus };
}

/**
 * Required corpus at retirement so that the portfolio just survives through
 * life expectancy. Uses binary search over the retirement simulation.
 */
export function computeRequiredCorpus(
  firstYearExpense: number,
  inputs: FinancialInputs,
  overrides?: { postReturn?: number; inflation?: number }
): number {
  let lo = 0;
  let hi = Math.max(firstYearExpense * 5, 1);

  // Grow the upper bound until the corpus survives.
  for (let i = 0; i < 60; i++) {
    const { endCorpus, depletionAge } = simulateRetirement(hi, firstYearExpense, inputs, overrides);
    if (depletionAge === null && endCorpus >= 0) break;
    hi *= 2;
  }

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const { endCorpus, depletionAge } = simulateRetirement(mid, firstYearExpense, inputs, overrides);
    if (depletionAge === null && endCorpus >= 0) {
      hi = mid;
    } else {
      lo = mid;
    }
    if (hi - lo < 1) break;
  }

  return hi;
}

/**
 * Solve for the monthly SIP required to reach the required corpus by
 * retirement, via binary search over the accumulation simulation.
 */
export function computeRequiredSip(requiredCorpus: number, inputs: FinancialInputs): number {
  const withSip = (sip: number) =>
    simulateAccumulation(inputs, { monthlySip: sip }).finalCorpus;

  // Already funded with current plan?
  if (withSip(inputs.monthlySip) >= requiredCorpus) return inputs.monthlySip;

  let lo = 0;
  let hi = Math.max(inputs.monthlySip * 2, 1000);
  for (let i = 0; i < 60; i++) {
    if (withSip(hi) >= requiredCorpus) break;
    hi *= 2;
  }
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (withSip(mid) >= requiredCorpus) hi = mid;
    else lo = mid;
    if (hi - lo < 1) break;
  }
  return hi;
}

/**
 * Earliest age at which the projected corpus meets the required corpus for
 * retiring at that age. Returns null if never reached by life expectancy.
 */
export function computeFinancialIndependenceAge(inputs: FinancialInputs): number | null {
  for (let age = inputs.currentAge + 1; age <= inputs.lifeExpectancy; age++) {
    const trial: FinancialInputs = { ...inputs, retirementAge: age };
    const projected = simulateAccumulation(trial).finalCorpus;
    const firstYearExpense =
      inputs.annualExpenses * Math.pow(1 + pct(inputs.inflation), age - inputs.currentAge);
    const required = computeRequiredCorpus(firstYearExpense, trial);
    if (projected >= required) return age;
  }
  return null;
}

function emergencyStatusOf(coverage: number): string {
  if (coverage >= 1) return 'Fully funded';
  if (coverage >= 0.75) return 'Almost funded';
  if (coverage >= 0.5) return 'Needs improvement';
  return 'Underfunded';
}

function sustainabilityStatusOf(fundingRatio: number): string {
  if (fundingRatio >= 1.1) return 'Excellent';
  if (fundingRatio >= 1) return 'On Track';
  if (fundingRatio >= 0.8) return 'Borderline';
  return 'Shortfall';
}

function computeScores(
  inputs: FinancialInputs,
  ctx: {
    savingsRate: number;
    investmentRate: number;
    expenseRatio: number;
    emergencyCoverage: number;
    debtToIncome: number;
    fundingRatio: number;
    cashFlowDeficit: boolean;
  }
): FinancialScores {
  const readiness = clamp(ctx.fundingRatio, 0, 1.2) / 1.2; // 0..1
  const savings = clamp(ctx.savingsRate / 0.3, 0, 1); // 30% savings => full
  const emergency = clamp(ctx.emergencyCoverage, 0, 1);
  const debt = 1 - clamp(ctx.debtToIncome / 0.4, 0, 1); // 40%+ DTI => 0
  const invest = clamp(ctx.investmentRate / 0.25, 0, 1); // 25% invest => full
  const cashFlow = ctx.cashFlowDeficit ? 0 : 1;

  const breakdown = [
    { label: 'Retirement readiness', score: readiness, weight: 0.35 },
    { label: 'Savings rate', score: savings, weight: 0.15 },
    { label: 'Emergency fund', score: emergency, weight: 0.1 },
    { label: 'Debt burden', score: debt, weight: 0.1 },
    { label: 'Investment rate', score: invest, weight: 0.1 },
    { label: 'Cash-flow stability', score: cashFlow, weight: 0.1 },
    // Diversification is approximated by investment rate presence for v1.
    { label: 'Diversification', score: invest, weight: 0.1 },
  ];

  const financialHealth = breakdown.reduce((s, b) => s + b.score * b.weight, 0) * 100;

  return {
    financialHealth,
    retirementReadiness: clamp(ctx.fundingRatio, 0, 1) * 100,
    savingsRate: ctx.savingsRate,
    investmentRate: ctx.investmentRate,
    expenseRatio: ctx.expenseRatio,
    emergencyCoverage: ctx.emergencyCoverage,
    debtToIncome: ctx.debtToIncome,
    healthBreakdown: breakdown.map((b) => ({ ...b, score: b.score * 100 })),
  };
}

function buildScenarios(inputs: FinancialInputs): ScenarioResult[] {
  const defs: { key: ScenarioResult['key']; label: string; pre: number; post: number }[] = [
    { key: 'conservative', label: 'Conservative', pre: Math.max(1, inputs.preReturn - 3), post: Math.max(1, inputs.postReturn - 2) },
    { key: 'base', label: 'Base', pre: inputs.preReturn, post: inputs.postReturn },
    { key: 'optimistic', label: 'Optimistic', pre: inputs.preReturn + 3, post: inputs.postReturn + 2 },
  ];

  return defs.map((d) => {
    const projected = simulateAccumulation(inputs, { preReturn: d.pre }).finalCorpus;
    const firstYearExpense =
      inputs.annualExpenses * Math.pow(1 + pct(inputs.inflation), inputs.retirementAge - inputs.currentAge);
    const required = computeRequiredCorpus(firstYearExpense, inputs, { postReturn: d.post });
    const { depletionAge } = simulateRetirement(projected, firstYearExpense, inputs, { postReturn: d.post });
    return {
      key: d.key,
      label: d.label,
      preReturn: d.pre,
      postReturn: d.post,
      projectedCorpus: projected,
      requiredCorpus: required,
      fundingRatio: required > 0 ? projected / required : 0,
      depletionAge,
    };
  });
}

function buildInflationSensitivity(inputs: FinancialInputs): SensitivityRow[] {
  const deltas = [-2, -1, 0, 1, 2];
  return deltas.map((delta) => {
    const inflation = Math.max(0, inputs.inflation + delta);
    const years = inputs.retirementAge - inputs.currentAge;
    const firstYearExpense = inputs.annualExpenses * Math.pow(1 + pct(inflation), years);
    const projected = simulateAccumulation(inputs, { inflation }).finalCorpus;
    const required = computeRequiredCorpus(firstYearExpense, inputs, { inflation });
    return {
      label: delta === 0 ? 'Base inflation' : `${delta > 0 ? '+' : ''}${delta}%`,
      delta,
      retirementExpense: firstYearExpense,
      requiredCorpus: required,
      fundingRatio: required > 0 ? projected / required : 0,
      depletionAge: simulateRetirement(projected, firstYearExpense, inputs, { inflation }).depletionAge,
    };
  });
}

function buildReturnSensitivity(inputs: FinancialInputs): SensitivityRow[] {
  const deltas = [-2, -1, 0, 1, 2];
  const years = inputs.retirementAge - inputs.currentAge;
  const firstYearExpense = inputs.annualExpenses * Math.pow(1 + pct(inputs.inflation), years);
  return deltas.map((delta) => {
    const preReturn = Math.max(0, inputs.preReturn + delta);
    const postReturn = Math.max(0, inputs.postReturn + delta);
    const projected = simulateAccumulation(inputs, { preReturn }).finalCorpus;
    const required = computeRequiredCorpus(firstYearExpense, inputs, { postReturn });
    return {
      label: delta === 0 ? 'Base return' : `${delta > 0 ? '+' : ''}${delta}%`,
      delta,
      projectedCorpus: projected,
      requiredCorpus: required,
      fundingRatio: required > 0 ? projected / required : 0,
      depletionAge: simulateRetirement(projected, firstYearExpense, inputs, { postReturn }).depletionAge,
    };
  });
}

function buildRecommendations(
  inputs: FinancialInputs,
  requiredCorpus: number,
  projectedCorpus: number,
  requiredMonthlySip: number
): Recommendation[] {
  const recs: Recommendation[] = [];
  const firstYearExpense =
    inputs.annualExpenses * Math.pow(1 + pct(inputs.inflation), inputs.retirementAge - inputs.currentAge);
  const ratioOf = (corpus: number) => (requiredCorpus > 0 ? corpus / requiredCorpus : 0);

  if (projectedCorpus >= requiredCorpus) {
    recs.push({
      id: 'on-track',
      title: 'You are on track under these assumptions',
      detail: 'Your projected corpus meets or exceeds the required corpus. Continue investing and re-check yearly.',
      impact: 'Maintains current trajectory',
      fundingRatioAfter: ratioOf(projectedCorpus),
      priority: 1,
    });
    return recs;
  }

  // A. Increase monthly SIP to the solved required SIP
  const sipGap = Math.max(0, requiredMonthlySip - inputs.monthlySip);
  if (sipGap > 0) {
    const projWithSip = simulateAccumulation(inputs, { monthlySip: requiredMonthlySip }).finalCorpus;
    recs.push({
      id: 'increase-sip',
      title: `Increase monthly SIP by ${Math.round(sipGap).toLocaleString('en-IN')}`,
      detail: `Raising your SIP from ${Math.round(inputs.monthlySip).toLocaleString('en-IN')} to ${Math.round(requiredMonthlySip).toLocaleString('en-IN')} closes the projected funding gap.`,
      impact: `Funding ratio → ${(ratioOf(projWithSip) * 100).toFixed(0)}%`,
      fundingRatioAfter: ratioOf(projWithSip),
      priority: 1,
    });
  }

  // B. Increase annual step-up
  const higherStepUp = Math.min(50, inputs.sipStepUp + 5);
  const projStepUp = simulateAccumulation(inputs, { sipStepUp: higherStepUp }).finalCorpus;
  recs.push({
    id: 'increase-stepup',
    title: `Raise annual SIP step-up to ${higherStepUp}%`,
    detail: `Increasing your yearly SIP step-up from ${inputs.sipStepUp}% to ${higherStepUp}% grows contributions faster over time.`,
    impact: `Funding ratio → ${(ratioOf(projStepUp) * 100).toFixed(0)}%`,
    fundingRatioAfter: ratioOf(projStepUp),
    priority: 2,
  });

  // C. Retire later (by 2 years)
  const laterAge = Math.min(90, inputs.retirementAge + 2);
  if (laterAge > inputs.retirementAge) {
    const laterInputs: FinancialInputs = { ...inputs, retirementAge: laterAge };
    const projLater = simulateAccumulation(laterInputs).finalCorpus;
    const laterExpense = inputs.annualExpenses * Math.pow(1 + pct(inputs.inflation), laterAge - inputs.currentAge);
    const reqLater = computeRequiredCorpus(laterExpense, laterInputs);
    recs.push({
      id: 'retire-later',
      title: `Delay retirement to age ${laterAge}`,
      detail: 'Two additional accumulation years add contributions and growth while shortening the withdrawal phase.',
      impact: `Funding ratio → ${(reqLater > 0 ? (projLater / reqLater) * 100 : 0).toFixed(0)}%`,
      fundingRatioAfter: reqLater > 0 ? projLater / reqLater : 0,
      priority: 3,
    });
  }

  // D. Reduce retirement spending by 10%
  const reducedExpense = firstYearExpense * 0.9;
  const reqReduced = computeRequiredCorpus(reducedExpense, inputs);
  recs.push({
    id: 'reduce-spending',
    title: 'Reduce retirement spending by 10%',
    detail: 'Lower planned retirement expenses reduce the required corpus proportionally.',
    impact: `Funding ratio → ${(reqReduced > 0 ? (projectedCorpus / reqReduced) * 100 : 0).toFixed(0)}%`,
    fundingRatioAfter: reqReduced > 0 ? projectedCorpus / reqReduced : 0,
    priority: 4,
  });

  // Rank by resulting funding ratio (highest impact first).
  return recs
    .sort((a, b) => b.fundingRatioAfter - a.fundingRatioAfter)
    .map((r, i) => ({ ...r, priority: i + 1 }));
}

/**
 * Main entry point. Produces the normalized plan consumed by the dashboard,
 * charts, and every export.
 */
export function calculateFinancialPlan(inputs: FinancialInputs): FinancialPlan {
  const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);
  const retirementYears = Math.max(0, inputs.lifeExpectancy - inputs.retirementAge);

  // Cash flow
  const annualInvestment = inputs.monthlySip * 12 + inputs.annualLumpSum;
  const annualSavings = inputs.annualIncome - inputs.annualExpenses - inputs.annualDebtPayment;
  const savingsRate = inputs.annualIncome > 0 ? annualSavings / inputs.annualIncome : 0;
  const investmentRate = inputs.annualIncome > 0 ? annualInvestment / inputs.annualIncome : 0;
  const expenseRatio = inputs.annualIncome > 0 ? inputs.annualExpenses / inputs.annualIncome : 0;
  const cashFlowDeficit = annualSavings < 0;

  // Emergency fund
  const monthlyEssential = inputs.annualExpenses / 12;
  const emergencyMonths = inputs.emergencyMonths > 0 ? inputs.emergencyMonths : 6;
  const requiredEmergencyFund = monthlyEssential * emergencyMonths;
  const emergencyCoverage = requiredEmergencyFund > 0 ? inputs.emergencyFund / requiredEmergencyFund : 0;

  // Debt
  const debtToAnnualIncome = inputs.annualIncome > 0 ? inputs.totalDebt / inputs.annualIncome : 0;

  // Accumulation
  const acc = simulateAccumulation(inputs);
  const projectedCorpus = acc.finalCorpus;

  // Retirement
  const firstYearRetirementExpense =
    inputs.annualExpenses * Math.pow(1 + pct(inputs.inflation), yearsToRetirement);
  const requiredCorpus = computeRequiredCorpus(firstYearRetirementExpense, inputs);
  const ret = simulateRetirement(projectedCorpus, firstYearRetirementExpense, inputs);

  const surplusOrShortfall = projectedCorpus - requiredCorpus;
  const fundingRatio = requiredCorpus > 0 ? projectedCorpus / requiredCorpus : 0;

  const requiredMonthlySip = computeRequiredSip(requiredCorpus, inputs);
  const monthlySipGap = Math.max(0, requiredMonthlySip - inputs.monthlySip);

  const financialIndependenceAge = computeFinancialIndependenceAge(inputs);

  const scenarios = buildScenarios(inputs);
  const inflationSensitivity = buildInflationSensitivity(inputs);
  const returnSensitivity = buildReturnSensitivity(inputs);

  const scores = computeScores(inputs, {
    savingsRate,
    investmentRate,
    expenseRatio,
    emergencyCoverage,
    debtToIncome: debtToAnnualIncome,
    fundingRatio,
    cashFlowDeficit,
  });

  const recommendations = buildRecommendations(
    inputs,
    requiredCorpus,
    projectedCorpus,
    requiredMonthlySip
  );

  const clientName = (inputs.clientName && inputs.clientName.trim()) ? inputs.clientName.trim() : 'Valued Client';

  return {
    version: FINANCIAL_MODEL_VERSION,
    clientName,
    inputs: {
      ...inputs,
      clientName,
    },
    yearsToRetirement,
    retirementYears,
    annualSavings,
    savingsRate,
    investmentRate,
    expenseRatio,
    cashFlowDeficit,
    requiredEmergencyFund,
    emergencyCoverage,
    emergencyStatus: emergencyStatusOf(emergencyCoverage),
    debtToAnnualIncome,
    accumulation: acc.rows,
    projectedCorpus,
    totalContributions: acc.totalContributions,
    totalGrowth: acc.totalGrowth,
    firstYearRetirementExpense,
    requiredCorpus,
    retirement: ret.rows,
    depletionAge: ret.depletionAge,
    surplusOrShortfall,
    fundingRatio,
    sustainabilityStatus: sustainabilityStatusOf(fundingRatio),
    requiredMonthlySip,
    monthlySipGap,
    financialIndependenceAge,
    scenarios,
    inflationSensitivity,
    returnSensitivity,
    scores,
    recommendations,
  };
}

export const DEFAULT_FINANCIAL_INPUTS: FinancialInputs = {
  clientName: 'Valued Client',
  currentAge: 30,
  retirementAge: 60,
  lifeExpectancy: 85,
  annualIncome: 2040000,
  incomeGrowth: 7,
  annualExpenses: 600000,
  inflation: 7,
  currentCorpus: 500000,
  monthlySip: 40000,
  sipStepUp: 10,
  annualLumpSum: 0,
  preReturn: 9,
  postReturn: 7,
  emergencyFund: 300000,
  emergencyMonths: 6,
  totalDebt: 0,
  annualDebtPayment: 0,
  annualRetirementIncome: 0,
};
