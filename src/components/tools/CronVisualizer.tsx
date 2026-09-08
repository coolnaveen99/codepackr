import React, { useState, useMemo, useEffect } from 'react';
import { Clock, Calendar, Play, Copy, Check, Info, Sparkles, RefreshCw } from 'lucide-react';

interface CronVisualizerProps {
  initialExpression?: string;
}

interface CronPreset {
  label: string;
  expression: string;
  description: string;
}

const PRESETS: CronPreset[] = [
  { label: 'Every minute', expression: '* * * * *', description: 'Executes every single minute' },
  { label: 'Every 5 minutes', expression: '*/5 * * * *', description: 'At every 5th minute' },
  { label: 'Every 15 minutes', expression: '*/15 * * * *', description: 'At :00, :15, :30, :45 past the hour' },
  { label: 'Every hour', expression: '0 * * * *', description: 'At minute 0 of every hour' },
  { label: 'Daily at midnight', expression: '0 0 * * *', description: 'At 00:00 every day' },
  { label: 'Daily at 9:00 AM', expression: '0 9 * * *', description: 'At 09:00 every morning' },
  { label: 'Weekdays at 9 AM', expression: '0 9 * * 1-5', description: 'Mon through Fri at 09:00' },
  { label: 'Every Sunday midnight', expression: '0 0 * * 0', description: 'Weekly on Sunday at 00:00' },
  { label: '1st of every month', expression: '0 0 1 * *', description: 'At 00:00 on day 1 of every month' },
];

// Evaluator for single cron field (e.g., "*/5", "1-5", "0,15,30", "*", "9")
function matchCronField(val: number, expr: string, min: number, max: number): boolean {
  if (expr === '*' || expr === '?') return true;

  // Handle list: "1,2,5"
  const parts = expr.split(',');
  if (parts.length > 1) {
    return parts.some((p) => matchCronField(val, p.trim(), min, max));
  }

  // Handle step: "*/5" or "10-30/5"
  if (expr.includes('/')) {
    const [rangePart, stepStr] = expr.split('/');
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step <= 0) return false;

    let start = min;
    let end = max;
    if (rangePart && rangePart !== '*') {
      if (rangePart.includes('-')) {
        const [rStart, rEnd] = rangePart.split('-').map((s) => parseInt(s, 10));
        start = isNaN(rStart) ? min : rStart;
        end = isNaN(rEnd) ? max : rEnd;
      } else {
        start = parseInt(rangePart, 10);
      }
    }

    if (val < start || val > end) return false;
    return (val - start) % step === 0;
  }

  // Handle range: "1-5"
  if (expr.includes('-')) {
    const [startStr, endStr] = expr.split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (isNaN(start) || isNaN(end)) return false;
    return val >= start && val <= end;
  }

  // Exact number
  const num = parseInt(expr, 10);
  return !isNaN(num) && val === num;
}

// Compute human description
function describeCron(fields: string[]): string {
  if (fields.length !== 5) return 'Invalid expression structure (expected 5 fields)';
  const [min, hour, dom, month, dow] = fields;

  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  let timeDesc = '';
  if (min === '*' && hour === '*') {
    timeDesc = 'Every minute';
  } else if (min.startsWith('*/') && hour === '*') {
    timeDesc = `Every ${min.replace('*/', '')} minutes`;
  } else if (min === '0' && hour === '*') {
    timeDesc = 'Every hour, on the hour';
  } else if (min === '0' && hour.startsWith('*/')) {
    timeDesc = `Every ${hour.replace('*/', '')} hours, on the hour`;
  } else if (!hour.includes('*') && !min.includes('*')) {
    const h = parseInt(hour, 10);
    const m = parseInt(min, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : `${m}`;
    timeDesc = `At ${displayH}:${displayM} ${ampm}`;
  } else {
    timeDesc = `At minute ${min} of hour ${hour}`;
  }

  let dayDesc = '';
  if (dom === '*' && dow === '*') {
    dayDesc = 'every day';
  } else if (dow === '1-5') {
    dayDesc = 'Monday through Friday';
  } else if (dow === '0,6' || dow === '6,0') {
    dayDesc = 'on Saturday and Sunday';
  } else if (dow !== '*') {
    const dList = dow.split(',').map((d) => dayNames[parseInt(d, 10)] || d).join(', ');
    dayDesc = `on ${dList}`;
  } else if (dom !== '*') {
    dayDesc = `on day ${dom} of the month`;
  }

  let monthDesc = '';
  if (month !== '*') {
    const mList = month.split(',').map((m) => monthNames[parseInt(m, 10)] || m).join(', ');
    monthDesc = `in ${mList}`;
  }

  return [timeDesc, dayDesc, monthDesc].filter(Boolean).join(', ');
}

// Compute next N occurrences
function calculateNextRuns(cronString: string, count = 8): Date[] {
  const parts = cronString.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minExpr, hourExpr, domExpr, monthExpr, dowExpr] = parts;
  const results: Date[] = [];
  const current = new Date();
  
  // Advance to next minute start (seconds = 0, ms = 0)
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1);

  let iterations = 0;
  const maxIterations = 525600; // max 1 year search in minutes

  while (results.length < count && iterations < maxIterations) {
    iterations++;
    const minute = current.getMinutes();
    const hour = current.getHours();
    const dom = current.getDate();
    const month = current.getMonth() + 1; // 1-12
    const dow = current.getDay(); // 0-6 (0 = Sun)

    const matchMonth = matchCronField(month, monthExpr, 1, 12);
    if (!matchMonth) {
      // Advance to start of next month
      current.setMonth(current.getMonth() + 1, 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const matchDom = matchCronField(dom, domExpr, 1, 31);
    const matchDow = matchCronField(dow, dowExpr, 0, 6) || (dow === 0 && matchCronField(7, dowExpr, 1, 7));

    // In standard cron, if both DOM and DOW are specified (neither is *), match if EITHER matches
    let matchDay = false;
    if (domExpr === '*' && dowExpr === '*') {
      matchDay = true;
    } else if (domExpr !== '*' && dowExpr === '*') {
      matchDay = matchDom;
    } else if (domExpr === '*' && dowExpr !== '*') {
      matchDay = matchDow;
    } else {
      matchDay = matchDom || matchDow;
    }

    if (!matchDay) {
      // Advance to start of next day
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const matchHour = matchCronField(hour, hourExpr, 0, 23);
    if (!matchHour) {
      // Advance to start of next hour
      current.setHours(current.getHours() + 1, 0, 0, 0);
      continue;
    }

    const matchMin = matchCronField(minute, minExpr, 0, 59);
    if (matchMin) {
      results.push(new Date(current));
    }

    // Step 1 minute forward
    current.setMinutes(current.getMinutes() + 1);
  }

  return results;
}

// Relative time formatter
function formatRelativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'due now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    const remHours = diffHour % 24;
    return `in ${diffDay}d ${remHours}h`;
  }
  if (diffHour > 0) {
    const remMins = diffMin % 60;
    return `in ${diffHour}h ${remMins}m`;
  }
  if (diffMin > 0) {
    const remSecs = diffSec % 60;
    return `in ${diffMin}m ${remSecs}s`;
  }
  return `in ${diffSec}s`;
}

export const CronVisualizer: React.FC<CronVisualizerProps> = ({
  initialExpression = '*/15 * * * *',
}) => {
  const [expression, setExpression] = useState(initialExpression);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fields = useMemo(() => {
    const parts = expression.trim().split(/\s+/);
    return parts.length === 5 ? parts : ['*', '*', '*', '*', '*'];
  }, [expression]);

  const explanation = useMemo(() => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return 'Please provide a valid 5-field cron expression (Minute Hour Day-of-Month Month Day-of-Week)';
    return describeCron(parts);
  }, [expression]);

  const nextRuns = useMemo(() => {
    return calculateNextRuns(expression, 8);
  }, [expression]);

  const handleFieldChange = (index: number, val: string) => {
    const nextFields = [...fields];
    nextFields[index] = val.trim() || '*';
    setExpression(nextFields.join(' '));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fieldLabels = [
    { label: 'Minute', hint: '0-59, */5, 1-30', range: '0-59' },
    { label: 'Hour', hint: '0-23, */2, 9-17', range: '0-23' },
    { label: 'Day of Month', hint: '1-31, 1,15', range: '1-31' },
    { label: 'Month', hint: '1-12 or *', range: '1-12' },
    { label: 'Day of Week', hint: '0-6 (0=Sun), 1-5', range: '0-6' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Expression Card */}
      <div
        className="p-6 rounded-2xl border shadow-sm space-y-5"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
              <Clock className="w-5 h-5 text-[var(--brand)]" />
              Cron Expression Engine
            </h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Standard 5-part crontab syntax with human interpretation and schedule simulation
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(expression)}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Cron</span>
              </>
            )}
          </button>
        </div>

        {/* Big Cron Display / Input */}
        <div
          className="p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
        >
          <div className="w-full md:w-auto flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
              RAW EXPRESSION
            </span>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="* * * * *"
              className="w-full bg-transparent font-mono text-xl sm:text-2xl font-black outline-none tracking-widest text-[var(--brand)]"
            />
          </div>

          {/* Quick Explanation Badge */}
          <div className="w-full md:w-auto text-left md:text-right">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
              <Sparkles className="w-3.5 h-3.5" />
              {explanation}
            </span>
          </div>
        </div>

        {/* 5-Field Breakdown Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {fieldLabels.map((f, idx) => (
            <div
              key={f.label}
              className="p-3 rounded-xl border flex flex-col items-center text-center space-y-1"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                {f.label}
              </span>
              <input
                type="text"
                value={fields[idx] || '*'}
                onChange={(e) => handleFieldChange(idx, e.target.value)}
                className="w-full py-1.5 text-center font-mono font-bold text-base rounded-lg border outline-none bg-white dark:bg-black/20"
                style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                {f.range}
              </span>
            </div>
          ))}
        </div>

        {/* Presets */}
        <div>
          <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
            POPULAR SCHEDULE PRESETS
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setExpression(p.expression)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  expression === p.expression
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-xs'
                    : 'hover:border-[var(--brand)] text-[var(--ink)]'
                }`}
                style={{
                  backgroundColor: expression === p.expression ? undefined : 'var(--surface-2)',
                  borderColor: expression === p.expression ? undefined : 'var(--line)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Next Run Simulator & Timeline */}
      <div
        className="p-6 rounded-2xl border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--ink)' }}>
              <Calendar className="w-4 h-4 text-emerald-500" />
              Next Scheduled Executions (Simulation)
            </h4>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              Current reference time: {currentTime.toLocaleTimeString()} (local timezone)
            </span>
          </div>

          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-neutral-500/10 text-neutral-500">
            {nextRuns.length} occurrences previewed
          </span>
        </div>

        {nextRuns.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
            No upcoming executions found within the next 12 months for this expression.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nextRuns.map((runDate, i) => {
              const isFirst = i === 0;
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isFirst
                      ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'hover:border-[var(--brand)]/40'
                  }`}
                  style={{
                    backgroundColor: isFirst ? undefined : 'var(--surface-2)',
                    borderColor: isFirst ? undefined : 'var(--line)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isFirst ? 'bg-emerald-500 text-white' : 'bg-neutral-500/20 text-[var(--muted)]'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <span className="block text-xs font-bold font-mono" style={{ color: 'var(--ink)' }}>
                        {runDate.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' '}
                        <span className="text-[var(--brand)]">
                          {runDate.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </span>
                      <span className="text-[11px] font-mono text-[var(--muted)]">
                        UTC: {runDate.toISOString().replace('T', ' ').substring(0, 19)}Z
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                        isFirst
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'text-neutral-500 bg-neutral-500/10'
                      }`}
                    >
                      {formatRelativeTime(runDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
