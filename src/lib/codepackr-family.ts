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
  tagline: string;
  icon: "code" | "book" | "scales" | "chart" | "star";
  accentColor: string;
  gradient: string;
}

/** Order is strictly fixed: Tools → Study → Law → Finance → Astro */
export const CODEPACKR_FAMILY: FamilyLink[] = [
  {
    id: "tools",
    label: "Tools",
    labelTa: "கருவிகள்",
    href: "https://codepackr.com",
    description: "Dev Utilities & Formatters",
    tagline: "Format, convert, validate, and inspect code locally",
    icon: "code",
    accentColor: "#2563eb",
    gradient: "from-blue-600 to-indigo-600",
  },
  {
    id: "study",
    label: "Study",
    labelTa: "படிப்பு",
    href: "https://study.codepackr.com",
    description: "Student Suite & GPA Tools",
    tagline: "GPA/CGPA calculators, flashcards, citations, and timers",
    icon: "book",
    accentColor: "#4f46e5",
    gradient: "from-indigo-600 to-violet-600",
  },
  {
    id: "law",
    label: "Law",
    labelTa: "சட்டம்",
    href: "https://law.codepackr.com",
    description: "Bare Acts & Legal Prep",
    tagline: "Indian laws, AIBE exam prep, and case law search",
    icon: "scales",
    accentColor: "#d97706",
    gradient: "from-amber-600 to-orange-600",
  },
  {
    id: "finance",
    label: "Finance",
    labelTa: "நிதி",
    href: "https://finance.codepackr.com",
    description: "SIP, EMI & Wealth Models",
    tagline: "Retirement planning, loan amortization, and tax calculators",
    icon: "chart",
    accentColor: "#059669",
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    id: "astro",
    label: "Astro",
    labelTa: "ஜோதிடம்",
    href: "https://astro.codepackr.com",
    description: "Tamil Vedic Jathagam",
    tagline: "Thirukanitham & Vakya charts, Porutham, and biodata",
    icon: "star",
    accentColor: "#b45309",
    gradient: "from-amber-700 to-yellow-600",
  },
];

/** Which product is "this" site — set for this repository */
export const CURRENT_PRODUCT: FamilyProductId = "tools";
