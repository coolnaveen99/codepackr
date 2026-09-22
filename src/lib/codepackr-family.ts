// src/lib/codepackr-family.ts
// Official shared family navigation specification for all 5 Codepackr websites.
// Rule: Share data, not styles. Host sites render using their local tokens.

export type FamilyProductId =
  | "tools"
  | "study"
  | "law"
  | "finance"
  | "astro";

export interface FamilyLink {
  id: FamilyProductId;
  label: string;
  labelTa?: string;
  href: string;
  description: string;
  icon: "code" | "book" | "scales" | "chart" | "star";
}

/** Order is strictly fixed: Tools → Study → Law → Finance → Astro */
export const CODEPACKR_FAMILY: FamilyLink[] = [
  {
    id: "tools",
    label: "Tools",
    labelTa: "கருவிகள்",
    href: "https://codepackr.com",
    description: "Dev utilities & tools",
    icon: "code",
  },
  {
    id: "study",
    label: "Study",
    labelTa: "படிப்பு",
    href: "https://study.codepackr.com",
    description: "Student tools & flashcards",
    icon: "book",
  },
  {
    id: "law",
    label: "Law",
    labelTa: "சட்டம்",
    href: "https://law.codepackr.com",
    description: "Legal acts & section finder",
    icon: "scales",
  },
  {
    id: "finance",
    label: "Finance",
    labelTa: "நிதி",
    href: "https://finance.codepackr.com",
    description: "SIP & finance calculators",
    icon: "chart",
  },
  {
    id: "astro",
    label: "Astro",
    labelTa: "ஜோதிடம்",
    href: "https://astro.codepackr.com",
    description: "Tamil Vedic jathagam",
    icon: "star",
  },
];

/** Which product is "this" site — set for this repository */
export const CURRENT_PRODUCT: FamilyProductId = "tools";
