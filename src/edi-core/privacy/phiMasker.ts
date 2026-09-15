import { CanonicalDocument, CanonicalParty } from '../models/canonical';

export function maskPhiInCanonical(doc: CanonicalDocument): CanonicalDocument {
  const cloned: CanonicalDocument = JSON.parse(JSON.stringify(doc));

  cloned.parties = cloned.parties.map((p: CanonicalParty) => {
    const isSensitive =
      p.role.includes('Buyer') ||
      p.role.includes('Patient') ||
      p.role.includes('IL') ||
      p.role.includes('Subscriber') ||
      p.role.includes('Insured');

    if (!isSensitive) return p;

    return {
      ...p,
      name: '[REDACTED PATIENT]',
      duns: p.duns ? '***-**-****' : undefined,
      address: p.address ? '*** REDACTED ADDRESS ***' : undefined,
      city: p.city ? '[REDACTED]' : undefined,
      zip: p.zip ? '*****' : undefined,
      contactName: p.contactName ? '[REDACTED]' : undefined,
      contactPhone: p.contactPhone ? '***-***-****' : undefined,
      contactEmail: p.contactEmail ? 'redacted@domain.local' : undefined,
    };
  });

  return cloned;
}

export function redactRawText(raw: string): string {
  // Replace DMG/NM1 patient patterns with safe placeholders
  return raw
    .replace(/(NM1\*IL\*1\*)[^*]+\*[^*]+/g, '$1PATIENT*REDACTED')
    .replace(/(DMG\*D8\*)\d{8}/g, '$119800101');
}
