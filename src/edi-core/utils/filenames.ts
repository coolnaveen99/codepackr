export function sanitizeFilename(raw: string, fallback = 'document'): string {
  if (!raw || typeof raw !== 'string') return fallback;
  // Remove slashes, path traversal, control chars, quotes, spaces replaced with underscores
  const cleaned = raw
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 80);
  return cleaned || fallback;
}

export function generateInboundFilename(
  prefix: string,
  partner: string,
  businessId: string,
  ext: 'json' | 'xml' | 'txt' | 'csv'
): string {
  const safePrefix = sanitizeFilename(prefix, 'ORD');
  const safePartner = sanitizeFilename(partner, 'PARTNER');
  const safeBusinessId = sanitizeFilename(businessId, 'DOC');
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return `${safePrefix}_${safePartner}_${safeBusinessId}_${timestamp}.${ext}`;
}

export function generateOutboundFilename(
  standard: string,
  transactionType: string,
  partner: string,
  businessId: string,
  ext: 'edi' | 'as2' | 'eml'
): string {
  const safeStandard = sanitizeFilename(standard, 'X12');
  const safeTx = sanitizeFilename(transactionType, '850');
  const safePartner = sanitizeFilename(partner, 'PARTNER');
  const safeId = sanitizeFilename(businessId, 'DOC');
  return `${safeStandard}_${safeTx}_${safePartner}_${safeId}.${ext}`;
}
