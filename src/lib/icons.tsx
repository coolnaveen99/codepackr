import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

// -----------------------------------------------------------------------------
// Base HD Icon Wrapper with Semantic Gradients
// -----------------------------------------------------------------------------
const HdIcon: React.FC<IconProps & { gradientId: string; children: React.ReactNode }> = ({
  size = 24,
  className = '',
  gradientId,
  children,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    {...props}
  >
    <defs>
      {/* Formatters (Blue -> Sky) */}
      <linearGradient id="grad-formatters" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>
      
      {/* Encoders & Crypto (Purple -> Fuchsia) */}
      <linearGradient id="grad-encoders" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#d946ef" />
      </linearGradient>
      
      {/* Validators (Emerald -> Teal) */}
      <linearGradient id="grad-validators" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#14b8a6" />
      </linearGradient>
      
      {/* Converters (Cyan -> Blue) */}
      <linearGradient id="grad-converters" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>

      {/* EDI Tools (Orange -> Amber) */}
      <linearGradient id="grad-edi" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>

      {/* XML/XSD/XSLT (Rose -> Orange) */}
      <linearGradient id="grad-xml" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e11d48" />
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>

      {/* Calculators (Emerald -> Lime) */}
      <linearGradient id="grad-calculators" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#84cc16" />
      </linearGradient>

      {/* Utilities (Slate -> Indigo) */}
      <linearGradient id="grad-utilities" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>

      {/* Text Tools (Violet -> Pink) */}
      <linearGradient id="grad-text" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    {children}
  </svg>
);

// -----------------------------------------------------------------------------
// FORMATTERS (grad-formatters)
// -----------------------------------------------------------------------------
export const JsonIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-formatters" {...props}>
    <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const HtmlIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-formatters" {...props}>
    <polyline points="6 9 2 12 6 15" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="18 9 22 12 18 15" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="14" y1="4" x2="10" y2="20" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const CodeIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-formatters" {...props}>
    <polyline points="16 18 22 12 16 6" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="8 6 2 12 8 18" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const DatabaseIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-formatters" {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const TerminalIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-formatters" {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="7 10 10 13 7 16" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="13" y1="16" x2="17" y2="16" stroke="url(#grad-formatters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

// -----------------------------------------------------------------------------
// ENCODERS & CRYPTO (grad-encoders)
// -----------------------------------------------------------------------------
export const BinaryIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-encoders" {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="7" y1="8" x2="13" y2="8" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="7" y1="12" x2="11" y2="12" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="7" y1="16" x2="13" y2="16" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const HashIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-encoders" {...props}>
    <line x1="4" y1="9" x2="20" y2="9" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="4" y1="15" x2="20" y2="15" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="10" y1="3" x2="8" y2="21" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="3" x2="14" y2="21" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const KeyIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-encoders" {...props}>
    <circle cx="7.5" cy="15.5" r="5.5" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m21 2-9.6 9.6" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const LinkIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-encoders" {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const SecurityIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-encoders" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#grad-encoders)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

// -----------------------------------------------------------------------------
// VALIDATORS (grad-validators)
// -----------------------------------------------------------------------------
export const CheckCircleIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-validators" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="url(#grad-validators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="22 4 12 14.01 9 11.01" stroke="url(#grad-validators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const RegexIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-validators" {...props}>
    <line x1="6" y1="3" x2="6" y2="21" stroke="url(#grad-validators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="18" y1="3" x2="18" y2="21" stroke="url(#grad-validators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 8c1.5 1 2.5 2.5 2.5 4s-1 3-2.5 4" stroke="url(#grad-validators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const SplitIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-validators" {...props}>
    <path d="M16 3h5v5" stroke="url(#grad-validators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 3H3v5" stroke="url(#grad-validators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 22v-8.3a4 4 0 0 0-1.17-2.83L3 3" stroke="url(#grad-validators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m15 9 6-6" stroke="url(#grad-validators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

// -----------------------------------------------------------------------------
// CONVERTERS (grad-converters)
// -----------------------------------------------------------------------------
export const TransformIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-converters" {...props}>
    <path d="M7 10h14l-4-4" stroke="url(#grad-converters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 14H3l4 4" stroke="url(#grad-converters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const CaseIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-converters" {...props}>
    <path d="m3 15 4-8 4 8" stroke="url(#grad-converters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 13h6" stroke="url(#grad-converters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18" cy="12" r="3" stroke="url(#grad-converters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 9v6" stroke="url(#grad-converters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const ImageIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-converters" {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" stroke="url(#grad-converters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="9" r="2" stroke="url(#grad-converters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="url(#grad-converters)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

// -----------------------------------------------------------------------------
// EDI TOOLS (grad-edi)
// -----------------------------------------------------------------------------
export const EdiFlowIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-edi" {...props}>
    <rect x="3" y="3" width="6" height="6" rx="1" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="15" y="3" width="6" height="6" rx="1" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="9" y="15" width="6" height="6" rx="1" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 9v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="13" x2="12" y2="15" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const SendIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-edi" {...props}>
    <path d="m22 2-7 20-4-9-9-4Z" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2 11 13" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const BarcodeIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-edi" {...props}>
    <path
      d="M3 5v14 M8 5v14 M12 5v14 M17 5v14 M21 5v14"
      stroke="url(#grad-edi)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </HdIcon>
);

export const CompareIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-edi" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m9 15 2 2-2 2" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m15 13-2-2 2-2" stroke="url(#grad-edi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

// -----------------------------------------------------------------------------
// XML/XSD/XSLT (grad-xml)
// -----------------------------------------------------------------------------
export const FileCodeIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-xml" {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" stroke="url(#grad-xml)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" stroke="url(#grad-xml)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m10 13-2 2 2 2" stroke="url(#grad-xml)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m14 17 2-2-2-2" stroke="url(#grad-xml)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-xml" {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" stroke="url(#grad-xml)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 3v4" stroke="url(#grad-xml)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 17v4" stroke="url(#grad-xml)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 5h4" stroke="url(#grad-xml)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 19h4" stroke="url(#grad-xml)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

// -----------------------------------------------------------------------------
// CALCULATORS (grad-calculators)
// -----------------------------------------------------------------------------
export const DollarIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-calculators" {...props}>
    <line x1="12" y1="2" x2="12" y2="22" stroke="url(#grad-calculators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="url(#grad-calculators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const ChartUpIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-calculators" {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="url(#grad-calculators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="17 6 23 6 23 12" stroke="url(#grad-calculators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const TargetIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-calculators" {...props}>
    <circle cx="12" cy="12" r="10" stroke="url(#grad-calculators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="6" stroke="url(#grad-calculators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2" stroke="url(#grad-calculators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const PercentIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-calculators" {...props}>
    <line x1="19" y1="5" x2="5" y2="19" stroke="url(#grad-calculators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6.5" cy="6.5" r="2.5" stroke="url(#grad-calculators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17.5" cy="17.5" r="2.5" stroke="url(#grad-calculators)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

// -----------------------------------------------------------------------------
// UTILITIES (grad-utilities)
// -----------------------------------------------------------------------------
export const FingerprintIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-utilities" {...props}>
    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 19.5C5.5 18 6 15 6 12c0-3.3 2.7-6 6-6s6 2.7 6 6c0 1.4-.4 2.8-1 4" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 19.5c0-4 1.5-7.5 5.5-7.5" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 18v3" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 15v6" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const QrIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-utilities" {...props}>
    <rect width="5" height="5" x="3" y="3" rx="1" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect width="5" height="5" x="16" y="3" rx="1" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect width="5" height="5" x="3" y="16" rx="1" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 16h-3a2 2 0 0 0-2 2v3" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 21v.01" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7v3a2 2 0 0 1-2 2H7" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 12h.01" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 3h.01" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 16v.01" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 12h1" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12v.01" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 21v-1" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-utilities" {...props}>
    <circle cx="12" cy="12" r="10" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="12 6 12 12 16 14" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const SettingsIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-utilities" {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

export const PaletteIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-utilities" {...props}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" stroke="url(#grad-utilities)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

// -----------------------------------------------------------------------------
// TEXT TOOLS (grad-text)
// -----------------------------------------------------------------------------
export const FileTextIcon: React.FC<IconProps> = (props) => (
  <HdIcon gradientId="grad-text" {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" stroke="url(#grad-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="14 2 14 8 20 8" stroke="url(#grad-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="13" x2="8" y2="13" stroke="url(#grad-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="17" x2="8" y2="17" stroke="url(#grad-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="10" y1="9" x2="8" y2="9" stroke="url(#grad-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </HdIcon>
);

// -----------------------------------------------------------------------------
// MAIN ICON RESOLVER
// -----------------------------------------------------------------------------
export const getIcon = (iconName: string, size = 18, className = ''): React.ReactNode => {
  const props = { size, className };

  switch (iconName.toLowerCase()) {
    // Formatters
    case 'json':
    case 'braces':
      return <JsonIcon {...props} />;
    case 'code':
      return <HtmlIcon {...props} />;
    case 'palette':
      return <TerminalIcon {...props} />; // Using terminal as palette for CSS
    case 'database':
      return <DatabaseIcon {...props} />;
    case 'filecode':
    case 'filetext':
      return <TerminalIcon {...props} />; // Using terminal for YAML/XML
    case 'terminal':
      return <TerminalIcon {...props} />;

    // Encoders & Crypto
    case 'binary':
      return <BinaryIcon {...props} />;
    case 'link':
      return <LinkIcon {...props} />;
    case 'filecode2':
      return <CodeIcon {...props} />; // HTML Entity
    case 'shield':
      return <HashIcon {...props} />; // Hash
    case 'keyround':
    case 'key':
      return <KeyIcon {...props} />;
    case 'image':
      return <ImageIcon {...props} />;

    // Validators
    case 'gitcompare':
    case 'split':
      return <SplitIcon {...props} />;
    case 'searchcode':
      return <RegexIcon {...props} />;
    case 'checkcircle2':
    case 'filecheck2':
      return <CheckCircleIcon {...props} />;
    case 'search':
    case 'table':
    case 'slidershorizontal':
      return <CheckCircleIcon {...props} />;

    // Converters
    case 'repeat':
    case 'arrowleftright':
      return <TransformIcon {...props} />;
    case 'filespreadsheet':
      return <TransformIcon {...props} />;
    case 'casesensitive':
      return <CaseIcon {...props} />;
    case 'hash':
      return <HashIcon {...props} />;
    case 'send':
      return <TransformIcon {...props} />;
    case 'maximize2':
      return <ImageIcon {...props} />;
    case 'sparkles':
      return <SparklesIcon {...props} />;

    // EDI
    case 'workflow':
      return <EdiFlowIcon {...props} />;
    case 'shieldcheck':
      return <SecurityIcon {...props} />;
    case 'barcode':
    case 'barcodeicon':
    case 'scan':
    case 'gs1':
      return <BarcodeIcon {...props} />;
    case 'gitcomparearrows':
      return <CompareIcon {...props} />;

    // Calculators
    case 'target':
    case 'trendingup':
    case 'piggybank':
      return <ChartUpIcon {...props} />;
    case 'dollarsign':
    case 'calculator':
    case 'receipt':
      return <DollarIcon {...props} />;
    case 'percent':
      return <PercentIcon {...props} />;

    // Utilities
    case 'fingerprint':
      return <FingerprintIcon {...props} />;
    case 'qrcode':
      return <QrIcon {...props} />;
    case 'lock':
      return <SecurityIcon {...props} />;
    case 'alignleft':
      return <FileTextIcon {...props} />;
    case 'pipette':
      return <PaletteIcon {...props} />;
    case 'clock':
    case 'calendarclock':
      return <ClockIcon {...props} />;
    case 'tag':
      return <SettingsIcon {...props} />;
    case 'globe':
      return <SettingsIcon {...props} />;
    case 'layers':
      return <SettingsIcon {...props} />;
    case 'eye':
      return <SettingsIcon {...props} />;

    default:
      return <TerminalIcon {...props} />;
  }
};
