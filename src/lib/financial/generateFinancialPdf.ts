import { jsPDF } from 'jspdf';
import { FinancialPlan, FinancialInputs } from './engine';
import { CurrencyDefinition } from '../currency';

interface GeneratePdfOptions {
  plan: FinancialPlan;
  inputs: FinancialInputs;
  currency: CurrencyDefinition;
  formatAmount: (amount: number, decimals?: number) => string;
}

export function generateFinancialAdvisoryPdf({
  plan,
  inputs,
  currency,
  formatAmount,
}: GeneratePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

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
  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Safe currency symbol representation for standard PDF fonts (avoid broken unicode glyphs)
  const cleanCurrencyLabel =
    currency.code === 'INR'
      ? 'INR'
      : currency.symbol && /^[\x20-\x7E]$/.test(currency.symbol)
      ? `${currency.code} (${currency.symbol})`
      : currency.code;

  // Exact currency formatting
  const fmtExact = (num: number): string => {
    const val = Math.round(num);
    return `${currency.code} ${val.toLocaleString('en-US')}`;
  };

  // Compact currency formatting for charts & metric cards (Lakh / Cr for INR, K / M / B for others)
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

  // ---------------------------------------------------------------------------
  // Top High-Visibility Brand Banner (Rendered on EVERY Page)
  // ---------------------------------------------------------------------------
  const drawBrandHeader = () => {
    const barY = 10;
    const barHeight = 12.5;

    // Dark Navy Bar Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, barY, contentWidth, barHeight, 2, 2, 'F');

    // Left: Platform & Suite Identification
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('CODEPACKR', margin + 5, barY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('FINANCIAL PLANNING & ACTUARIAL ADVISORY SUITE', margin + 5, barY + 9.6);

    // Right: High-Visibility www.codepackr.com Brand Badge
    const pillW = 62;
    const pillH = 8.5;
    const pillX = margin + contentWidth - pillW - 2;
    const pillY = barY + 2;

    // Electric Brand Blue Pill
    doc.setFillColor(37, 99, 235); // #2563eb
    doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('www.codepackr.com', pillX + pillW / 2, pillY + 5.5, { align: 'center' });
  };

  // ===========================================================================
  // PAGE 1: Executive Summary, Key Metrics, Assumptions & Stress Testing
  // ===========================================================================
  drawBrandHeader();

  let y = 28;

  // Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.text('Strategic Wealth & Retirement Readiness Analysis', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Enterprise Actuarial Projections · Model v2.4 · 100% Client-Side Privacy', margin, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Institutional Wealth Architecture', margin + contentWidth, y + 4.5, { align: 'right' });

  y += 8;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  y += 4;

  // Engagement Metadata Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  const metaCols = [
    { label: 'PLAN HOLDER', val: clientName },
    { label: 'REPORT DATE', val: currentDate },
    { label: 'BASE CURRENCY', val: cleanCurrencyLabel },
    {
      label: 'PLANNING HORIZON',
      val: `Age ${inputs.currentAge} to ${inputs.lifeExpectancy} (${inputs.lifeExpectancy - inputs.currentAge} yrs)`,
    },
  ];

  const colW = contentWidth / 4;
  metaCols.forEach((col, idx) => {
    const cx = margin + idx * colW + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(col.label, cx, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(col.val, cx, y + 10);
  });

  y += 18;

  // Executive Summary Card
  const isHealthy = plan.fundingRatio >= 1.0;
  const statusColor = isHealthy ? [22, 163, 74] : [220, 38, 38]; // green or red
  const statusBg = isHealthy ? [240, 253, 244] : [254, 242, 242];

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  // Status Banner Header
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(margin + 4, y + 3, contentWidth - 8, 6.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const statusText = isHealthy
    ? `EXECUTIVE SUMMARY: ON TARGET (${(plan.fundingRatio * 100).toFixed(1)}% FUNDED) · ${plan.sustainabilityStatus.toUpperCase()}`
    : `EXECUTIVE SUMMARY: CAPITAL GAP DETECTED (${(plan.fundingRatio * 100).toFixed(1)}% FUNDED) · ACTION REQUIRED`;
  doc.text(statusText, margin + contentWidth / 2, y + 7.5, { align: 'center' });

  // 4 Key Metric Columns
  const cardY = y + 12;
  const metrics = [
    {
      title: 'FINANCIAL HEALTH',
      value: `${Math.round(plan.scores.financialHealth)} / 100`,
      note: 'Composite Readiness',
    },
    {
      title: 'PROJECTED CORPUS',
      value: fmtCompact(plan.projectedCorpus),
      note: `At Age ${inputs.retirementAge}`,
    },
    {
      title: 'REQUIRED TARGET',
      value: fmtCompact(plan.requiredCorpus),
      note: `Through Age ${inputs.lifeExpectancy}`,
    },
    {
      title: 'FUNDING RATIO',
      value: `${(plan.fundingRatio * 100).toFixed(1)}%`,
      note: isHealthy
        ? `Surplus: ${fmtCompact(plan.projectedCorpus - plan.requiredCorpus)}`
        : `Deficit: ${fmtCompact(plan.requiredCorpus - plan.projectedCorpus)}`,
    },
  ];

  metrics.forEach((m, idx) => {
    const mx = margin + 4 + idx * ((contentWidth - 8) / 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.title, mx + 2, cardY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, mx + 2, cardY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(m.note, mx + 2, cardY + 17);
  });

  // Bottom note of executive summary
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, cardY + 19, margin + contentWidth - 4, cardY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const bottomSummaryText = isHealthy
    ? `Runway Assessment: Current capital accumulation trajectory safely covers projected living expenses through age ${inputs.lifeExpectancy} with surplus resilience against market downturns.`
    : `Runway Assessment: Corpus depletion projected around age ${plan.depletionAge || inputs.lifeExpectancy}. An estimated additional SIP of ${fmtExact(plan.monthlySipGap)}/month closes the shortfall.`;
  doc.text(bottomSummaryText, margin + 6, cardY + 23.5);

  y += 43;

  // Modeling Assumptions & Cash Flow Inputs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Key Modeling Assumptions & Cash Flow Inputs', margin, y);

  y += 3;
  const assumptions = [
    ['Current Age', `${inputs.currentAge} years`, 'Annual Net Income', fmtExact(inputs.annualIncome)],
    ['Target Retirement Age', `${inputs.retirementAge} years`, 'Annual Living Expenses', fmtExact(inputs.annualExpenses)],
    ['Life Expectancy', `${inputs.lifeExpectancy} years`, 'Existing Invested Assets', fmtExact(inputs.currentCorpus)],
    ['Accumulation Horizon', `${inputs.retirementAge - inputs.currentAge} years`, 'Monthly SIP Contribution', `${fmtExact(inputs.monthlySip)} / mo`],
    ['Retirement Horizon', `${inputs.lifeExpectancy - inputs.retirementAge} years`, 'Annual SIP Step-Up', `${inputs.sipStepUp}% per year`],
    ['Pre-Retirement Return', `${inputs.preReturn}% p.a.`, 'General Inflation Rate', `${inputs.inflation}% p.a.`],
    ['Post-Retirement Return', `${inputs.postReturn}% p.a.`, 'First-Yr Retirement Spend', fmtExact(plan.firstYearRetirementExpense)],
  ];

  doc.setLineWidth(0.2);
  assumptions.forEach((row, rIdx) => {
    const rowY = y + rIdx * 5.8;
    if (rIdx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY, contentWidth, 5.8, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, rowY + 5.8, margin + contentWidth, rowY + 5.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(row[0], margin + 4, rowY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], margin + 48, rowY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(row[2], margin + contentWidth / 2 + 4, rowY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(row[3], margin + contentWidth - 4, rowY + 4, { align: 'right' });
  });

  y += assumptions.length * 5.8 + 6;

  // Market Scenario Sensitivity & Stress Testing (Carefully Spaced to Prevent ANY Overlap)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Market Scenario Sensitivity & Stress Testing', margin, y);

  y += 3;
  // Header row
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);

  // Column positions mathematically spaced across 186mm:
  const stColScenarioX = margin + 4;
  const stColReturnsX = margin + 42;
  const stColProjectedX = margin + 98;
  const stColRequiredX = margin + 146;
  const stColRatioX = margin + contentWidth - 4;

  doc.text('SCENARIO', stColScenarioX, y + 4.2);
  doc.text('PRE/POST RETURN', stColReturnsX, y + 4.2);
  doc.text('PROJECTED CORPUS', stColProjectedX, y + 4.2, { align: 'right' });
  doc.text('REQUIRED TARGET', stColRequiredX, y + 4.2, { align: 'right' });
  doc.text('FUNDING RATIO', stColRatioX, y + 4.2, { align: 'right' });

  y += 6;

  plan.scenarios.forEach((sc, sIdx) => {
    const rowY = y + sIdx * 6;
    if (sIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY, contentWidth, 6, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, rowY + 6, margin + contentWidth, rowY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(sc.label, stColScenarioX, rowY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${sc.preReturn}% / ${sc.postReturn}%`, stColReturnsX, rowY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(fmtExact(sc.projectedCorpus), stColProjectedX, rowY + 4.2, { align: 'right' });
    doc.text(fmtExact(sc.requiredCorpus), stColRequiredX, rowY + 4.2, { align: 'right' });

    const isScFunded = sc.fundingRatio >= 1.0;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isScFunded ? 22 : 220, isScFunded ? 163 : 38, isScFunded ? 74 : 38);
    doc.text(`${(sc.fundingRatio * 100).toFixed(1)}%`, stColRatioX, rowY + 4.2, {
      align: 'right',
    });
  });

  y += plan.scenarios.length * 6 + 6;

  // Bottom Portfolio Health Scorecard
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

  const scoreItems = [
    { label: 'SAVINGS RATE', val: `${(plan.scores.savingsRate * 100).toFixed(0)}%` },
    { label: 'INVESTMENT RATE', val: `${(plan.scores.investmentRate * 100).toFixed(0)}%` },
    { label: 'EXPENSE RATIO', val: `${(plan.scores.expenseRatio * 100).toFixed(0)}%` },
    { label: 'DEBT-TO-INCOME', val: `${(plan.scores.debtToIncome * 100).toFixed(0)}%` },
    { label: 'EMERGENCY COVERAGE', val: `${plan.emergencyCoverage.toFixed(1)} Mos` },
  ];

  const scoreColW = contentWidth / 5;
  scoreItems.forEach((si, idx) => {
    const sx = margin + idx * scoreColW + scoreColW / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(si.label, sx, y + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text(si.val, sx, y + 13, { align: 'center' });
  });

  // Navigation hint at bottom
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Continued on Page 2: Visual Portfolio Charts & Trajectory Modeling →', margin + contentWidth, pageHeight - 12, {
    align: 'right',
  });

  // ===========================================================================
  // PAGE 2: Visual Portfolio Analytics & 4 Vector Charts
  // ===========================================================================
  doc.addPage('a4', 'portrait');
  drawBrandHeader();

  y = 28;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.text('Visual Portfolio Analytics & Capital Trajectory', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Multi-decade simulation curves and wealth composition for ${clientName}`, margin, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Verified at www.codepackr.com', margin + contentWidth, y + 4.5, { align: 'right' });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  y += 5;

  // ---------------------------------------------------------------------------
  // 4 Vector Charts in a 2x2 Grid (Exact matches to Screenshot 3)
  // ---------------------------------------------------------------------------
  const chartW = 90;
  const chartH = 62;
  const chartCol1X = margin;
  const chartCol2X = margin + chartW + 6;
  const chartRow1Y = y;
  const chartRow2Y = y + chartH + 5;

  // Helper to draw clean vector line chart
  const drawLineChart = ({
    x,
    y,
    w,
    h,
    title,
    points,
    color,
    peakLabel,
    xMinLabel,
    xMaxLabel,
    fillColor,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    points: { xVal: number; yVal: number }[];
    color: [number, number, number];
    peakLabel: string;
    xMinLabel: string;
    xMaxLabel: string;
    fillColor: [number, number, number];
  }) => {
    // Card frame
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, x + 4, y + 6);

    // Plotting area
    const plotX = x + 6;
    const plotY = y + 11;
    const plotW = w - 12;
    const plotH = h - 22;

    // Grid baseline
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);

    if (points.length < 2) return;

    const minX = points[0].xVal;
    const maxX = points[points.length - 1].xVal;
    const maxY = Math.max(...points.map((p) => p.yVal), 1);
    const minY = 0;

    const scaleX = (val: number) => plotX + ((val - minX) / Math.max(1, maxX - minX)) * plotW;
    const scaleY = (val: number) => plotY + plotH - ((val - minY) / Math.max(1, maxY - minY)) * plotH;

    // Subtle area fill under the curve
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = scaleX(points[i].xVal);
      const y1 = scaleY(points[i].yVal);
      const x2 = scaleX(points[i + 1].xVal);
      const y2 = scaleY(points[i + 1].yVal);
      const bY = plotY + plotH;

      // Draw vertical polygon segment
      doc.triangle(x1, y1, x2, y2, x1, bY, 'F');
      doc.triangle(x2, y2, x2, bY, x1, bY, 'F');
    }

    // Polyline stroke
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.7);
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      doc.line(scaleX(p1.xVal), scaleY(p1.yVal), scaleX(p2.xVal), scaleY(p2.yVal));
    }

    // Bottom axis labels & Peak note
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(xMinLabel, plotX, plotY + plotH + 5);
    doc.text(peakLabel, plotX + plotW / 2, plotY + plotH + 5, { align: 'center' });
    doc.text(xMaxLabel, plotX + plotW, plotY + plotH + 5, { align: 'right' });
  };

  // --- Chart 1: Investment Corpus Growth (Accumulation Phase) ---
  const accumulationPoints = [
    { xVal: inputs.currentAge, yVal: inputs.currentCorpus },
    ...plan.accumulation.map((r) => ({ xVal: r.age, yVal: r.closingCorpus })),
  ];
  drawLineChart({
    x: chartCol1X,
    y: chartRow1Y,
    w: chartW,
    h: chartH,
    title: 'Investment Corpus Growth (Accumulation)',
    points: accumulationPoints,
    color: [37, 99, 235], // blue
    fillColor: [239, 246, 255], // blue-50
    xMinLabel: `Age ${inputs.currentAge}`,
    xMaxLabel: `Age ${inputs.retirementAge}`,
    peakLabel: `Peak ${fmtCompact(plan.projectedCorpus)}`,
  });

  // --- Chart 2: Retirement Corpus Sustainability (Distribution Phase) ---
  const retirementPoints = [
    { xVal: inputs.retirementAge, yVal: plan.projectedCorpus },
    ...plan.retirement.map((r) => ({ xVal: r.age, yVal: r.closingCorpus })),
  ];
  const maxRetirementCorpus = Math.max(...retirementPoints.map((p) => p.yVal), 1);
  const isRetirementSurplus = plan.fundingRatio >= 1.0;
  drawLineChart({
    x: chartCol2X,
    y: chartRow1Y,
    w: chartW,
    h: chartH,
    title: 'Retirement Corpus Sustainability',
    points: retirementPoints,
    color: isRetirementSurplus ? [22, 163, 74] : [220, 38, 38], // green or red
    fillColor: isRetirementSurplus ? [240, 253, 244] : [254, 242, 242],
    xMinLabel: `Age ${inputs.retirementAge}`,
    xMaxLabel: `Age ${inputs.lifeExpectancy}`,
    peakLabel: `Peak ${fmtCompact(maxRetirementCorpus)}`,
  });

  // --- Chart 3: Income vs Annual Living Expenses ---
  const incomePoints = plan.accumulation.map((r) => ({ xVal: r.age, yVal: r.income }));
  const expensePoints = plan.accumulation.map((r) => ({ xVal: r.age, yVal: r.expenses }));
  const maxCashFlow = Math.max(
    ...incomePoints.map((p) => p.yVal),
    ...expensePoints.map((p) => p.yVal),
    1
  );

  // Frame
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(chartCol1X, chartRow2Y, chartW, chartH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Income vs Annual Expenses', chartCol1X + 4, chartRow2Y + 6);

  // Legend
  doc.setFillColor(22, 163, 74); // green dot
  doc.circle(chartCol1X + chartW - 36, chartRow2Y + 5, 1.4, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text('Income', chartCol1X + chartW - 33, chartRow2Y + 6);

  doc.setFillColor(220, 38, 38); // red dot
  doc.circle(chartCol1X + chartW - 16, chartRow2Y + 5, 1.4, 'F');
  doc.text('Expenses', chartCol1X + chartW - 13, chartRow2Y + 6);

  // Plot lines
  const c3PlotX = chartCol1X + 6;
  const c3PlotY = chartRow2Y + 11;
  const c3PlotW = chartW - 12;
  const c3PlotH = chartH - 22;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(c3PlotX, c3PlotY + c3PlotH, c3PlotX + c3PlotW, c3PlotY + c3PlotH);

  if (incomePoints.length >= 2) {
    const minX = incomePoints[0].xVal;
    const maxX = incomePoints[incomePoints.length - 1].xVal;
    const scaleX = (val: number) => c3PlotX + ((val - minX) / Math.max(1, maxX - minX)) * c3PlotW;
    const scaleY = (val: number) => c3PlotY + c3PlotH - (val / maxCashFlow) * c3PlotH;

    // Income line (green)
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.7);
    for (let i = 0; i < incomePoints.length - 1; i++) {
      doc.line(
        scaleX(incomePoints[i].xVal),
        scaleY(incomePoints[i].yVal),
        scaleX(incomePoints[i + 1].xVal),
        scaleY(incomePoints[i + 1].yVal)
      );
    }

    // Expenses line (red)
    doc.setDrawColor(220, 38, 38);
    for (let i = 0; i < expensePoints.length - 1; i++) {
      doc.line(
        scaleX(expensePoints[i].xVal),
        scaleY(expensePoints[i].yVal),
        scaleX(expensePoints[i + 1].xVal),
        scaleY(expensePoints[i + 1].yVal)
      );
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Age ${inputs.currentAge}`, c3PlotX, c3PlotY + c3PlotH + 5);
    doc.text(`Peak Inc ${fmtCompact(maxCashFlow)}`, c3PlotX + c3PlotW / 2, c3PlotY + c3PlotH + 5, {
      align: 'center',
    });
    doc.text(`Age ${inputs.retirementAge}`, c3PlotX + c3PlotW, c3PlotY + c3PlotH + 5, {
      align: 'right',
    });
  }

  // --- Chart 4: Contributions vs Investment Growth (Composition) ---
  const totalCorp = plan.totalContributions + plan.totalGrowth || 1;
  const contribPct = Math.round((plan.totalContributions / totalCorp) * 100);
  const growthPct = 100 - contribPct;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(chartCol2X, chartRow2Y, chartW, chartH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Contributions vs Investment Growth', chartCol2X + 4, chartRow2Y + 6);

  // Donut/Segment Dual Progress Bar
  const barBoxX = chartCol2X + 6;
  const barBoxY = chartRow2Y + 14;
  const barBoxW = chartW - 12;
  const barBoxH = 10;

  const contribBarW = Math.max(4, (contribPct / 100) * barBoxW);
  const growthBarW = barBoxW - contribBarW;

  // Contributions portion (Indigo)
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(barBoxX, barBoxY, contribBarW, barBoxH, 1.5, 1.5, 'F');

  // Growth portion (Emerald)
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(barBoxX + contribBarW + 1, barBoxY, growthBarW - 1, barBoxH, 1.5, 1.5, 'F');

  // Value Callout Cards below the bar
  const statCard1Y = barBoxY + 15;

  // Contributions Stat
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(barBoxX, statCard1Y, (barBoxW - 4) / 2, 16, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(79, 70, 229);
  doc.text(`CONTRIBUTIONS (${contribPct}%)`, barBoxX + 3, statCard1Y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(fmtCompact(plan.totalContributions), barBoxX + 3, statCard1Y + 11.5);

  // Growth Stat
  const statCard2X = barBoxX + (barBoxW - 4) / 2 + 4;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(statCard2X, statCard1Y, (barBoxW - 4) / 2, 16, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`MARKET GROWTH (${growthPct}%)`, statCard2X + 3, statCard1Y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(fmtCompact(plan.totalGrowth), statCard2X + 3, statCard1Y + 11.5);

  // Strategic Insights Note under Chart 4
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Compounding Multiplier: Investment returns generate ${(plan.totalGrowth / Math.max(1, plan.totalContributions)).toFixed(1)}x your invested principal.`,
    barBoxX,
    statCard1Y + 20
  );

  y = chartRow2Y + chartH + 8;

  // ---------------------------------------------------------------------------
  // Prioritized Strategic Wealth Recommendations
  // ---------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Prioritized Strategic Wealth Recommendations for ${clientName}`, margin, y);

  y += 4;

  const recommendations =
    plan.recommendations && plan.recommendations.length > 0
      ? plan.recommendations
      : [
          {
            id: '1',
            title: 'Systematic Capital Accumulation Discipline',
            impact: 'High',
            detail: `Maintain monthly contributions of at least ${fmtExact(inputs.monthlySip)} with an annual step-up rate of ${inputs.sipStepUp}% to outpace inflation.`,
            fundingRatioAfter: 1,
            priority: 1,
          },
          {
            id: '2',
            title: 'Inflation-Hedging Equity Asset Allocation',
            impact: 'High',
            detail: `Target ${inputs.preReturn}% pre-retirement return via equity index funds and growth assets before gradually de-risking towards retirement.`,
            fundingRatioAfter: 1,
            priority: 2,
          },
          {
            id: '3',
            title: 'Emergency Liquidity & Reserve Buffer',
            impact: 'Medium',
            detail: `Maintain a liquid reserve of ${fmtExact(inputs.annualExpenses * 0.5)} (6 months expenses) insulated from market volatility.`,
            fundingRatioAfter: 1,
            priority: 3,
          },
          {
            id: '4',
            title: 'Post-Retirement Withdrawal Governance',
            impact: 'Medium',
            detail: `Maintain an initial safe withdrawal rate around 4.0%, dynamically adjusting for actual market performance to protect capital longevity.`,
            fundingRatioAfter: 1,
            priority: 4,
          },
        ];

  recommendations.slice(0, 3).forEach((rec, rIdx) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'FD');

    // Index circle
    doc.setFillColor(37, 99, 235);
    doc.circle(margin + 5, y + 5.5, 2.8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`${rIdx + 1}`, margin + 5, y + 6.5, { align: 'center' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(rec.title, margin + 11, y + 6);

    // Impact Badge
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(margin + contentWidth - 30, y + 3, 26, 4.5, 1, 1, 'F');
    doc.setTextColor(67, 56, 202);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(`IMPACT: ${rec.impact.toUpperCase()}`, margin + contentWidth - 17, y + 6.2, {
      align: 'center',
    });

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(rec.detail, contentWidth - 16);
    doc.text(splitDesc, margin + 11, y + 11);

    y += 18.5;
  });

  // Navigation hint to Page 3
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Continued on Page 3: Complete Year-by-Year Actuarial Schedule →', margin + contentWidth, pageHeight - 12, {
    align: 'right',
  });

  // ===========================================================================
  // PAGE 3+: Comprehensive Year-by-Year Actuarial Schedule (Auto-Paginated)
  // ===========================================================================
  const allRows = [
    ...plan.accumulation.map((r) => ({
      age: r.age,
      year: r.year,
      phase: 'Accumulation',
      income: r.income,
      expenses: r.expenses,
      netSip: r.annualContribution,
      growth: r.investmentGrowth,
      closingCorpus: r.closingCorpus,
    })),
    ...plan.retirement.map((r) => ({
      age: r.age,
      year: r.year,
      phase: 'Retirement',
      income: 0,
      expenses: r.expenses,
      netSip: -r.withdrawal,
      growth: r.growth,
      closingCorpus: r.closingCorpus,
    })),
  ];

  // Column X Coordinates for Year-by-Year Table (Carefully positioned to never overlap):
  const tblColAgeX = margin + 3;
  const tblColPhaseX = margin + 22;
  const tblColIncomeX = margin + 68;
  const tblColExpensesX = margin + 98;
  const tblColSipX = margin + 130;
  const tblColGrowthX = margin + 158;
  const tblColCorpusX = margin + contentWidth - 3;

  const drawScheduleTableHeader = (curY: number) => {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, curY, contentWidth, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);

    doc.text('AGE (YR)', tblColAgeX, curY + 4.2);
    doc.text('PHASE', tblColPhaseX, curY + 4.2);
    doc.text('INCOME', tblColIncomeX, curY + 4.2, { align: 'right' });
    doc.text('EXPENSES', tblColExpensesX, curY + 4.2, { align: 'right' });
    doc.text('NET SIP / DRAW', tblColSipX, curY + 4.2, { align: 'right' });
    doc.text('GROWTH', tblColGrowthX, curY + 4.2, { align: 'right' });
    doc.text('CLOSING CORPUS', tblColCorpusX, curY + 4.2, { align: 'right' });
  };

  doc.addPage('a4', 'portrait');
  drawBrandHeader();

  y = 28;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text('Comprehensive Year-by-Year Actuarial Schedule', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Annual tracking of income, inflation-adjusted living expenses, contributions, and year-end corpus balances`,
    margin,
    y + 4.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('www.codepackr.com', margin + contentWidth, y + 4.5, { align: 'right' });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  y += 4;
  drawScheduleTableHeader(y);
  y += 6;

  const rowH = 5.2;

  allRows.forEach((row, idx) => {
    // If approaching page footer, start a new page
    if (y + rowH > pageHeight - 24) {
      doc.addPage('a4', 'portrait');
      drawBrandHeader();
      y = 28;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text('Year-by-Year Actuarial Schedule (Continued)', margin, y);

      y += 6;
      drawScheduleTableHeader(y);
      y += 6;
    }

    // Alternating row background
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowH, 'F');
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowH, margin + contentWidth, y + rowH);

    // Age
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(`Age ${row.age} (${row.year})`, tblColAgeX, y + 3.8);

    // Phase badge
    const isAccum = row.phase === 'Accumulation';
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(isAccum ? 22 : 37, isAccum ? 163 : 99, isAccum ? 74 : 235);
    doc.text(row.phase, tblColPhaseX, y + 3.8);

    // Income
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(row.income > 0 ? fmtExact(row.income) : '—', tblColIncomeX, y + 3.8, {
      align: 'right',
    });

    // Expenses
    doc.text(fmtExact(row.expenses), tblColExpensesX, y + 3.8, { align: 'right' });

    // Net SIP / Draw
    const isPositive = row.netSip >= 0;
    doc.setTextColor(isPositive ? 22 : 220, isPositive ? 163 : 38, isPositive ? 74 : 38);
    const sipStr = isPositive ? `+${fmtExact(row.netSip)}` : `-${fmtExact(Math.abs(row.netSip))}`;
    doc.text(sipStr, tblColSipX, y + 3.8, { align: 'right' });

    // Growth
    doc.setTextColor(71, 85, 105);
    doc.text(fmtExact(row.growth), tblColGrowthX, y + 3.8, { align: 'right' });

    // Closing Corpus
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fmtExact(row.closingCorpus), tblColCorpusX, y + 3.8, { align: 'right' });

    y += rowH;
  });

  y += 5;

  // Compliance & Institutional Disclaimer Box (Ensure fits on current or new page)
  const noticeBoxH = 22;
  if (y + noticeBoxH > pageHeight - 16) {
    doc.addPage('a4', 'portrait');
    drawBrandHeader();
    y = 28;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, noticeBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('AUDIT ATTESTATION & FIDUCIARY NOTICE · WWW.CODEPACKR.COM', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  const disclaimerText =
    '100% Client-Side Privacy Guarantee: This report was computed exclusively in the user\'s local web browser at www.codepackr.com. No financial balances, income figures, personal identifiers, or portfolio models were transmitted or stored on remote servers.\n\nFiduciary Disclaimer: This document is prepared for informational, analytical, and strategic wealth modeling purposes only. It does not constitute formal licensed investment, legal, or tax advice. Projected compounding values reflect mathematical simulation and do not guarantee future market returns.';
  const splitDisc = doc.splitTextToSize(disclaimerText, contentWidth - 8);
  doc.text(splitDisc, margin + 4, y + 8.5);

  // ===========================================================================
  // FINAL PASS: Subtle Diagonal Watermark & Standardized Footers across ALL pages
  // ===========================================================================
  const totalPages = doc.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Subtle diagonal security watermark
    doc.saveGraphicsState();
    doc.setTextColor(242, 245, 250);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.text('codepackr.com', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 35,
    });
    doc.restoreGraphicsState();

    // Bottom Footer Bar (always exactly at pageHeight - 7mm)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400

    doc.text(
      `CodePackr Wealth Report · www.codepackr.com · ${clientName} · ${currentDate} ${timestamp}`,
      margin,
      pageHeight - 7
    );

    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${p} of ${totalPages}`, margin + contentWidth, pageHeight - 7, {
      align: 'right',
    });
  }

  return doc;
}
