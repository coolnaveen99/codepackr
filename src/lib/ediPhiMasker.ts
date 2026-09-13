/**
 * Local HIPAA Safe Harbor PHI/PII Redactor & Masker
 * Purely client-side utility per 45 CFR § 164.514(b)
 * Replaces names, SSNs/member IDs, birth dates, and addresses with synthetic test tokens.
 */

export interface PhiMaskResult {
  maskedEdi: string;
  maskedCount: number;
  replacedCategories: {
    names: number;
    memberIds: number;
    birthDates: number;
    addresses: number;
    contacts: number;
  };
}

const SYNTHETIC_LAST_NAMES = ['DOE', 'SMITH', 'JOHNSON', 'BROWN', 'DAVIS', 'WILSON', 'TAYLOR', 'ANDERSON'];
const SYNTHETIC_FIRST_NAMES = ['JOHN', 'JANE', 'MICHAEL', 'EMILY', 'DAVID', 'SARAH', 'JAMES', 'EMMA'];

export function maskEdiPhi(ediPayload: string): PhiMaskResult {
  if (!ediPayload || !ediPayload.trim()) {
    return {
      maskedEdi: '',
      maskedCount: 0,
      replacedCategories: { names: 0, memberIds: 0, birthDates: 0, addresses: 0, contacts: 0 },
    };
  }

  const trimmed = ediPayload.trim();
  const term = trimmed.includes('~') ? '~' : trimmed.includes("'") ? "'" : '\n';
  const sep = trimmed.includes('*') ? '*' : '+';

  const rawLines = term === '\n' ? trimmed.split(/\r?\n/) : trimmed.split(term);
  const segments = rawLines.map((s) => s.trim()).filter(Boolean);

  let nameCounter = 0;
  let namesCount = 0;
  let memberIdsCount = 0;
  let birthDatesCount = 0;
  let addressesCount = 0;
  let contactsCount = 0;

  const maskedSegments = segments.map((seg, segIdx) => {
    const parts = seg.split(sep);
    const tag = (parts[0] || '').trim().toUpperCase();

    // 1. Patient / Member Names (NM1*IL, NM1*QC, NM1*74, NM1*85, NM1*41)
    if (tag === 'NM1' && (parts[1] === 'IL' || parts[1] === 'QC' || parts[1] === '74' || parts[1] === '82' || parts[1] === '41')) {
      const isPerson = parts[2] === '1'; // 1 = Person, 2 = Non-Person Entity
      if (isPerson) {
        if (parts[3]) {
          parts[3] = SYNTHETIC_LAST_NAMES[nameCounter % SYNTHETIC_LAST_NAMES.length];
          namesCount++;
        }
        if (parts[4]) {
          parts[4] = SYNTHETIC_FIRST_NAMES[nameCounter % SYNTHETIC_FIRST_NAMES.length];
          namesCount++;
        }
        if (parts[5]) {
          parts[5] = 'X';
        }
        nameCounter++;
      }

      // Member ID / SSN in NM109 (Qualifier in NM108 is MI, 24, 34, SY)
      if (parts[9] && (parts[8] === 'MI' || parts[8] === '24' || parts[8] === '34' || parts[8] === 'SY' || parts[8] === 'ZZ')) {
        parts[9] = `MBR${String(10000000 + ((segIdx + 1) * 83) % 90000000)}`;
        memberIdsCount++;
      }
    }

    // 2. Reference Identification (REF*SY = SSN, REF*0F = Subscriber, REF*23 = Client ID, REF*EJ = Patient)
    if (tag === 'REF' && (parts[1] === 'SY' || parts[1] === '0F' || parts[1] === '23' || parts[1] === 'EJ' || parts[1] === '4A')) {
      if (parts[2]) {
        parts[2] = parts[1] === 'SY' ? '999-00-1234' : `SYNREF${1000 + ((segIdx + 1) * 17) % 8999}`;
        memberIdsCount++;
      }
    }

    // 3. Demographic Date of Birth (DMG*D8*YYYYMMDD)
    if (tag === 'DMG' && parts[2]) {
      parts[2] = '19850101'; // Safe static synthetic DOB
      birthDatesCount++;
    }

    // 4. Physical Street Address (N3)
    if (tag === 'N3' && parts[1]) {
      parts[1] = '100 CONFIDENTIAL HEALTHCARE WAY';
      if (parts[2]) parts[2] = 'SUITE 100';
      addressesCount++;
    }

    // 5. Geographic Location (N4)
    if (tag === 'N4' && (parts[1] || parts[3])) {
      parts[1] = 'AUSTIN';
      parts[2] = 'TX';
      parts[3] = '78701';
      addressesCount++;
    }

    // 6. Contact Information (PER*IC, PER*IP, PER*EC)
    if (tag === 'PER' && (parts[1] === 'IC' || parts[1] === 'IP' || parts[1] === 'EC')) {
      if (parts[2]) {
        parts[2] = 'AUTHORIZED REPRESENTATIVE';
        contactsCount++;
      }
      for (let i = 3; i < parts.length; i += 2) {
        const commQual = parts[i];
        if (commQual === 'TE' || commQual === 'FX' || commQual === 'CP') {
          parts[i + 1] = '555-0100';
          contactsCount++;
        } else if (commQual === 'EM') {
          parts[i + 1] = 'support@confidential-edi.org';
          contactsCount++;
        }
      }
    }

    return parts.join(sep);
  });

  const totalMasked = namesCount + memberIdsCount + birthDatesCount + addressesCount + contactsCount;
  const delimiterSuffix = term === '\n' ? '\n' : `${term}\n`;
  const maskedEdi = maskedSegments.join(delimiterSuffix) + (term !== '\n' ? term : '');

  return {
    maskedEdi,
    maskedCount: totalMasked,
    replacedCategories: {
      names: namesCount,
      memberIds: memberIdsCount,
      birthDates: birthDatesCount,
      addresses: addressesCount,
      contacts: contactsCount,
    },
  };
}
