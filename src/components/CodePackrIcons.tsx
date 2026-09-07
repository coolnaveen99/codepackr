import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const SvgIcon: React.FC<{ size?: number; className?: string; children: React.ReactNode }> = ({
  size = 20,
  className = '',
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 ${className}`}
  >
    {children}
  </svg>
);

export const JsonIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
    <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
  </SvgIcon>
);

export const XmlIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <polyline points="7 8 3 12 7 16" />
    <polyline points="17 8 21 12 17 16" />
    <line x1="14" y1="4" x2="10" y2="20" />
  </SvgIcon>
);

export const CodeIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </SvgIcon>
);

export const SqlIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </SvgIcon>
);

export const DatabaseIcon: React.FC<IconProps> = SqlIcon;

export const Base64Icon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="7" y1="8" x2="13" y2="8" />
    <line x1="7" y1="12" x2="11" y2="12" />
    <line x1="7" y1="16" x2="13" y2="16" />
  </SvgIcon>
);

export const JwtIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 8h4v8" />
    <path d="M13 8l2 8 2-8" />
  </SvgIcon>
);

export const HashIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </SvgIcon>
);

export const SecurityIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </SvgIcon>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </SvgIcon>
);

export const ConvertIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <path d="M7 10h14l-4-4" />
    <path d="M17 14H3l4 4" />
  </SvgIcon>
);

export const TerminalIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <polyline points="7 10 10 13 7 16" />
    <line x1="13" y1="16" x2="17" y2="16" />
  </SvgIcon>
);

export const RegexIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <line x1="6" y1="3" x2="6" y2="21" />
    <line x1="18" y1="3" x2="18" y2="21" />
    <path d="M10 8c1.5 1 2.5 2.5 2.5 4s-1 3-2.5 4" />
  </SvgIcon>
);

export const UrlIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </SvgIcon>
);

export const UuidIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="7" r="1" />
    <circle cx="12" cy="17" r="1" />
    <circle cx="7" cy="12" r="1" />
    <circle cx="17" cy="12" r="1" />
    <circle cx="8.5" cy="8.5" r="1" />
    <circle cx="15.5" cy="15.5" r="1" />
  </SvgIcon>
);

export const TimestampIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </SvgIcon>
);

export const ColorIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
    <path d="m5 2 5 5" />
    <path d="M2 13h15" />
  </SvgIcon>
);

export const HtmlIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <polyline points="6 9 2 12 6 15" />
    <polyline points="18 9 22 12 18 15" />
    <line x1="14" y1="4" x2="10" y2="20" />
  </SvgIcon>
);

export const CssIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 8h8" />
    <path d="M8 12h8" />
    <path d="M8 16h5" />
  </SvgIcon>
);

export const JavascriptIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 16c0 1-1 1-1.5 1s-1.5 0-1.5-1" />
    <path d="M13 17c1.5 0 2-.8 2-1.5s-.8-1.2-1.8-1.5c-1.2-.4-1.7-.8-1.7-1.5s.6-1.5 2-1.5 1.5.5 1.5 1" />
  </SvgIcon>
);

export const TypescriptIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 8h6" />
    <path d="M10 8v8" />
    <path d="M15 12c1 0 1.5.5 1.5 1.2 0 1-.8 1.8-2 1.8" />
  </SvgIcon>
);

export const ApiIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </SvgIcon>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </SvgIcon>
);

// Dedicated EDI & Financial Icons
export const EdiWorkflowIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="15" y="3" width="6" height="6" rx="1" />
    <rect x="9" y="15" width="6" height="6" rx="1" />
    <path d="M6 9v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" />
    <line x1="12" y1="13" x2="12" y2="15" />
  </SvgIcon>
);

export const EdiTransactionIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </SvgIcon>
);

export const EdiAckIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <polyline points="9 14 11 16 15 11" />
  </SvgIcon>
);

export const EdiInspectorIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <path d="M8 11h6" />
    <path d="M11 8v6" />
  </SvgIcon>
);

export const CalculatorIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="16" y1="14" x2="16" y2="18" />
    <path d="M16 10h.01" />
    <path d="M12 10h.01" />
    <path d="M8 10h.01" />
    <path d="M12 14h.01" />
    <path d="M8 14h.01" />
    <path d="M12 18h.01" />
    <path d="M8 18h.01" />
  </SvgIcon>
);

export const TrendingUpIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </SvgIcon>
);

export const CurrencyIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <SvgIcon size={size} className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="6" x2="12" y2="18" />
    <path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 1.5 1.5 2.5 3 3s2.5 1.5 2.5 3a2.5 2.5 0 0 1-5 0" />
  </SvgIcon>
);
