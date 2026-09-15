export function generateRunId(prefix = 'RUN'): string {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(2, 14);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

export function padControlNumber(num: string | number, length: number): string {
  const cleaned = String(num).replace(/\D/g, '');
  return cleaned.padStart(length, '0').slice(-length);
}
