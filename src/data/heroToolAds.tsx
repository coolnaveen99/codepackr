import React from 'react';
import {
  Braces,
  Workflow,
  KeyRound,
  Network,
  Database,
  FileCode,
  FileText,
  SearchCode,
  ShieldCheck,
  Binary,
  GitCompare,
  Shield,
  Repeat,
  Fingerprint,
  CalendarClock,
  Clock,
  Link,
  CaseSensitive,
  FileSpreadsheet,
  QrCode,
  Hash,
  Table,
  ArrowLeftRight,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export type BadgeTone = 'emerald' | 'teal' | 'purple' | 'blue' | 'amber' | 'rose' | 'cyan' | 'orange' | 'indigo';
export type AccentFamily = 'blue' | 'teal' | 'purple' | 'orange' | 'cyan' | 'emerald' | 'amber' | 'indigo' | 'rose';

export interface HeroToolAd {
  id: string;
  toolId: string;
  title: string;
  badge: string;
  badgeTone: BadgeTone;
  icon: LucideIcon;
  body: React.ReactNode;
  footerLeft: string;
  cta: string;
  launchPayload?: string;
  accent: AccentFamily;
}

export const HERO_TOOL_ADS: HeroToolAd[] = [
  // 1. JSON Formatter
  {
    id: 'ad-json-formatter',
    toolId: 'json-formatter',
    title: 'JSON Inspector',
    badge: 'valid',
    badgeTone: 'emerald',
    icon: Braces,
    accent: 'blue',
    footerLeft: 'Zero server telemetry',
    cta: 'Try JSON Formatter',
    launchPayload: JSON.stringify(
      {
        status: 'success',
        partner: 'Northwind Traders',
        clientSide: true,
        latencyMs: 0.4,
      },
      null,
      2
    ),
    body: (
      <div>
        <div>
          <span className="text-[color:var(--ink-muted)]">&#123;</span>
        </div>
        <div className="pl-3">
          <span className="text-blue-500 dark:text-blue-400 font-semibold">&quot;partner&quot;</span>:{' '}
          <span className="text-emerald-600 dark:text-emerald-400">&quot;Northwind&quot;</span>,
        </div>
        <div className="pl-3">
          <span className="text-blue-500 dark:text-blue-400 font-semibold">&quot;status&quot;</span>:{' '}
          <span className="text-amber-500 font-bold">&quot;validated&quot;</span>
        </div>
        <div>
          <span className="text-[color:var(--ink-muted)]">&#125;</span>
        </div>
      </div>
    ),
  },

  // 2. EDI Segment Viewer
  {
    id: 'ad-edi-segment-viewer',
    toolId: 'edi-segment-viewer',
    title: 'EDI X12 Segment Stream',
    badge: 'ANSI 850',
    badgeTone: 'teal',
    icon: Workflow,
    accent: 'teal',
    footerLeft: 'Parse & inspect elements',
    cta: 'Try Segment Viewer',
    launchPayload:
      'ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*CONTOSO        *260401*1230*U*00401*000000001*0*P*>~\nGS*PO*NORTHWIND*CONTOSO*20260401*1230*1*X*004010~\nST*850*0001~\nBEG*00*SA*PO-9842**20260401~\nN1*BY*CONTOSO LOGISTICS*92*11029~\nPO1*1*50*EA*14.95**BP*SKU-9912~\nTDS*74750~\nSE*6*0001~\nGE*1*1~\nIEA*1*000000001~',
    body: (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
            ST
          </span>
          <span className="text-[color:var(--ink)]">850</span>
          <span className="text-[color:var(--ink-muted)] opacity-60">*</span>
          <span className="text-[color:var(--ink-muted)]">0001</span>
          <span className="text-teal-600 dark:text-teal-400 font-bold">~</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400">
            BEG
          </span>
          <span className="text-[color:var(--ink)]">00*SA</span>
          <span className="text-[color:var(--ink-muted)] opacity-60">*</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold">PO-9842</span>
          <span className="text-teal-600 dark:text-teal-400 font-bold">~</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">
            N1
          </span>
          <span className="text-[color:var(--ink)] truncate">BY*CONTOSO LOGISTICS</span>
          <span className="text-teal-600 dark:text-teal-400 font-bold">~</span>
        </div>
      </div>
    ),
  },

  // 3. JWT Decoder
  {
    id: 'ad-jwt-decoder',
    toolId: 'jwt-decoder',
    title: 'JWT Token Inspector',
    badge: 'HS256',
    badgeTone: 'purple',
    icon: KeyRound,
    accent: 'purple',
    footerLeft: 'Zero secret exfiltration',
    cta: 'Decode JWT',
    launchPayload:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfZmFiXzg4MiIsIm5hbWUiOiJNb3JnYW4gRGV2Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.2Vn1qN7H84LzD51u7Bq-oVzM4z3uV1N1rL9w2x5Y8',
    body: (
      <div className="space-y-1">
        <div className="text-[10px] truncate">
          <span className="text-rose-500 font-semibold">eyJhbGciOi...</span>
          <span className="text-purple-500 font-semibold">.eyJzdWIi...</span>
          <span className="text-cyan-500 font-semibold">.2Vn1qN7...</span>
        </div>
        <div className="text-[10px] text-[color:var(--ink-muted)] flex items-center justify-between border-t border-[color:var(--border)]/40 pt-1">
          <span>sub: &quot;usr_fab_882&quot;</span>
          <span className="text-emerald-500 font-semibold">signature valid</span>
        </div>
      </div>
    ),
  },

  // 4. EDI to JSON
  {
    id: 'ad-edi-to-json',
    toolId: 'edi-to-json',
    title: 'EDI to JSON Tree',
    badge: '850 → JSON',
    badgeTone: 'cyan',
    icon: ArrowLeftRight,
    accent: 'cyan',
    footerLeft: 'Hierarchical transformation',
    cta: 'Convert EDI to JSON',
    launchPayload:
      'ST*850*0001~\nBEG*00*SA*PO-9842**20260401~\nN1*BY*CONTOSO GLOBAL*92*11029~\nPO1*1*100*EA*24.50~\nSE*4*0001~',
    body: (
      <div className="space-y-1 text-[11px]">
        <div className="text-cyan-600 dark:text-cyan-400 font-semibold">ST*850 → JSON Mapping</div>
        <div className="text-[10px] text-[color:var(--ink-muted)] pl-2 border-l-2 border-cyan-500/30">
          &quot;poNumber&quot;: &quot;PO-9842&quot;,<br />
          &quot;buyer&quot;: &quot;Fabrikam Supply&quot;
        </div>
      </div>
    ),
  },

  // 5. SQL Formatter
  {
    id: 'ad-sql-formatter',
    toolId: 'sql-formatter',
    title: 'SQL Query Formatter',
    badge: 'PostgreSQL / ANSI',
    badgeTone: 'blue',
    icon: Database,
    accent: 'blue',
    footerLeft: 'Instant syntax highlight',
    cta: 'Format SQL Query',
    launchPayload:
      'SELECT o.id,o.total_amount,c.company_name FROM orders o JOIN customers c ON o.cust_id=c.id WHERE c.partner=\'Fabrikam\' AND o.status=\'CONFIRMED\' ORDER BY o.created_at DESC LIMIT 50;',
    body: (
      <div className="space-y-0.5 text-[11px]">
        <div>
          <span className="text-blue-500 font-bold">SELECT</span> id, total, partner
        </div>
        <div className="pl-2">
          <span className="text-blue-500 font-bold">FROM</span> purchase_orders
        </div>
        <div>
          <span className="text-blue-500 font-bold">WHERE</span> partner ={' '}
          <span className="text-emerald-600 dark:text-emerald-400">&apos;Fabrikam&apos;</span>;
        </div>
      </div>
    ),
  },

  // 6. EDI Message Gateway
  {
    id: 'ad-edi-message-gateway',
    toolId: 'edi-message-gateway',
    title: 'EDI Message Gateway',
    badge: 'B2B Pipeline',
    badgeTone: 'teal',
    icon: Network,
    accent: 'teal',
    footerLeft: 'Zero-cloud B2B engine',
    cta: 'Open EDI Gateway',
    launchPayload:
      'ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*FABRIKAM       *260401*0915*U*00401*000000102*0*P*>~\nGS*PO*NORTHWIND*FABRIKAM*20260401*0915*1*X*004010~\nST*850*0001~\nBEG*00*NE*ORD-7712**20260401~\nSE*3*0001~\nGE*1*1~\nIEA*1*000000102~',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="flex items-center justify-between">
          <span className="text-teal-600 dark:text-teal-400 font-bold">INBOUND AS2</span>
          <span className="text-emerald-600 font-semibold">ISA OK</span>
        </div>
        <div className="text-[color:var(--ink-muted)]">Northwind → Tailwind Gateway</div>
        <div className="text-blue-500 font-semibold">997 Ack Synced · Zero Latency</div>
      </div>
    ),
  },

  // 7. XML Formatter
  {
    id: 'ad-xml-formatter',
    toolId: 'xml-formatter',
    title: 'XML Formatter',
    badge: 'well-formed',
    badgeTone: 'emerald',
    icon: FileCode,
    accent: 'emerald',
    footerLeft: 'Tree indentation & check',
    cta: 'Format XML Document',
    launchPayload:
      '<Invoice id="INV-4029"><Supplier>Tailwind Labs</Supplier><Buyer>Contoso</Buyer><Currency code="USD">4800.00</Currency><Items><Item sku="TL-01" qty="4" unitPrice="1200.00"/></Items></Invoice>',
    body: (
      <div className="space-y-0.5 text-[10px]">
        <div>
          <span className="text-emerald-600">&lt;Invoice</span>{' '}
          <span className="text-amber-500">id</span>=
          <span className="text-blue-500">&quot;INV-402&quot;</span>
          <span className="text-emerald-600">&gt;</span>
        </div>
        <div className="pl-2">
          &lt;<span className="text-emerald-600">Supplier</span>&gt;Tailwind Labs&lt;/
          <span className="text-emerald-600">Supplier</span>&gt;
        </div>
        <div>
          <span className="text-emerald-600">&lt;/Invoice&gt;</span>
        </div>
      </div>
    ),
  },

  // 8. YAML Formatter
  {
    id: 'ad-yaml-formatter',
    toolId: 'yaml-formatter',
    title: 'YAML Formatter',
    badge: 'YAML 1.2',
    badgeTone: 'amber',
    icon: FileText,
    accent: 'amber',
    footerLeft: 'Strict syntax validation',
    cta: 'Format YAML Config',
    launchPayload:
      'version: "3.8"\nservices:\n  gateway:\n    image: northwind/edge:v2.4\n    ports:\n      - "8080:8080"\n    environment:\n      - NODE_ENV=production',
    body: (
      <div className="space-y-0.5 text-[10px]">
        <div>
          <span className="text-amber-500 font-bold">service</span>:{' '}
          <span className="text-emerald-600 dark:text-emerald-400">northwind-edge</span>
        </div>
        <div>
          <span className="text-amber-500 font-bold">replicas</span>:{' '}
          <span className="text-purple-500">3</span>
        </div>
        <div>
          <span className="text-amber-500 font-bold">environment</span>:{' '}
          <span className="text-emerald-600 dark:text-emerald-400">production</span>
        </div>
      </div>
    ),
  },

  // 9. Regex Tester
  {
    id: 'ad-regex-tester',
    toolId: 'regex-tester',
    title: 'Regex Match Inspector',
    badge: '4 matches',
    badgeTone: 'purple',
    icon: SearchCode,
    accent: 'purple',
    footerLeft: 'Real-time match highlights',
    cta: 'Test Regular Expression',
    launchPayload: 'PO-9842 and INV-2026 approved by Fabrikam Supply',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-purple-500 font-semibold font-mono">/[A-Z]&#123;2,4&#125;-\d&#123;4&#125;/g</div>
        <div className="text-[color:var(--ink)]">
          Match 1:{' '}
          <span className="bg-purple-500/20 px-1 rounded text-purple-600 dark:text-purple-400 font-bold font-mono">
            PO-9842
          </span>
        </div>
        <div className="text-[color:var(--ink-muted)]">Group 0 found at index 0</div>
      </div>
    ),
  },

  // 10. EDI 997 Generator
  {
    id: 'ad-edi-997-generator',
    toolId: 'edi-997-generator',
    title: 'EDI 997 Functional Ack',
    badge: 'AK5*A (Accepted)',
    badgeTone: 'emerald',
    icon: ShieldCheck,
    accent: 'emerald',
    footerLeft: 'Auto-reverse sender/receiver',
    cta: 'Generate 997 Ack',
    launchPayload:
      'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260401*1230*U*00401*000000001*0*P*>~\nGS*PO*SENDER*RECEIVER*20260401*1230*1*X*004010~\nST*850*0001~\nSE*4*0001~\nGE*1*1~\nIEA*1*000000001~',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
          <span className="bg-emerald-500/15 px-1 rounded">AK5*A</span>
          <span>Transaction Accepted</span>
        </div>
        <div className="text-[color:var(--ink-muted)]">ST*997*0001 · Reversed Envelopes</div>
        <div className="text-teal-600 dark:text-teal-400 font-semibold">Sender ⇄ Receiver Synced</div>
      </div>
    ),
  },

  // 11. Base64
  {
    id: 'ad-base64',
    toolId: 'base64',
    title: 'Base64 Encoder & Decoder',
    badge: 'UTF-8 & Binary',
    badgeTone: 'cyan',
    icon: Binary,
    accent: 'cyan',
    footerLeft: 'Client-side safe btoa/atob',
    cta: 'Encode / Decode Base64',
    launchPayload: 'Contoso_Auth_Token:2026_Secure_Key',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-[color:var(--ink-muted)] truncate">In: &quot;Contoso_Auth_Token:2026&quot;</div>
        <div className="text-cyan-600 dark:text-cyan-400 font-bold font-mono truncate">Q29udG9zb19BdXRoX1Rva2Vu...</div>
        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">100% local Web Crypto API</div>
      </div>
    ),
  },

  // 12. Diff Checker
  {
    id: 'ad-diff-checker',
    toolId: 'diff-checker',
    title: 'Side-by-Side Diff Checker',
    badge: '+2 / -1 lines',
    badgeTone: 'indigo',
    icon: GitCompare,
    accent: 'indigo',
    footerLeft: 'Word & line level differences',
    cta: 'Compare File Diff',
    launchPayload: 'partner: "Northwind Enterprise"\nconcurrency: 16',
    body: (
      <div className="space-y-0.5 text-[10px]">
        <div className="text-rose-500 bg-rose-500/10 px-1 rounded truncate">- vendor: &quot;Northwind Old&quot;</div>
        <div className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded truncate">
          + vendor: &quot;Northwind Global&quot;
        </div>
        <div className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded truncate">
          + concurrency: 16
        </div>
      </div>
    ),
  },

  // 13. Hash Generator
  {
    id: 'ad-hash-generator',
    toolId: 'hash-generator',
    title: 'Crypto Hash Generator',
    badge: 'SHA-256',
    badgeTone: 'rose',
    icon: Shield,
    accent: 'rose',
    footerLeft: 'Hardware accelerated digest',
    cta: 'Generate Hash',
    launchPayload: 'Fabrikam-Manifest-2026-v1.4',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-[color:var(--ink-muted)] truncate">SHA-256 Digest:</div>
        <div className="text-rose-500 font-mono font-bold truncate">8f3c4b1a7029c...e901a82</div>
        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Web Crypto API · SHA-256/512</div>
      </div>
    ),
  },

  // 14. JSON to XML Converter
  {
    id: 'ad-json-xml-converter',
    toolId: 'json-xml-converter',
    title: 'JSON ↔ XML Converter',
    badge: 'Bi-directional',
    badgeTone: 'teal',
    icon: Repeat,
    accent: 'teal',
    footerLeft: 'Preserves types & attributes',
    cta: 'Convert JSON & XML',
    launchPayload:
      '{\n  "purchaseOrder": {\n    "id": "PO-9842",\n    "vendor": "Tailwind Labs",\n    "total": 1495.00\n  }\n}',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-teal-600 dark:text-teal-400 font-semibold">
          &#123; &quot;sku&quot;: &quot;NW-401&quot;, &quot;qty&quot;: 50 &#125;
        </div>
        <div className="text-center text-teal-500 text-[9px]">▲ bi-directional ▼</div>
        <div className="text-[color:var(--ink-muted)] truncate font-mono">
          &lt;item&gt;&lt;sku&gt;NW-401&lt;/sku&gt;&lt;qty&gt;50&lt;/qty&gt;&lt;/item&gt;
        </div>
      </div>
    ),
  },

  // 15. EDI HIPAA Sanitizer
  {
    id: 'ad-edi-hipaa-sanitizer',
    toolId: 'edi-hipaa-sanitizer',
    title: 'HIPAA PHI Sanitizer',
    badge: 'Safe Harbor',
    badgeTone: 'emerald',
    icon: ShieldCheck,
    accent: 'emerald',
    footerLeft: '100% in-browser masking',
    cta: 'Sanitize Healthcare EDI',
    launchPayload:
      'ISA*00*          *00*          *ZZ*CLINIC         *ZZ*PAYER          *260401*0830*U*00501*000000001*0*P*>~\nGS*HC*CLINIC*PAYER*20260401*0830*1*X*005010X222A1~\nST*837*0001*005010X222A1~\nBHT*0019*00*CLAIM1001*20260401*0830*CH~\nNM1*IL*1*SMITH*JANE****MI*987654321~\nSE*4*0001~\nGE*1*1~\nIEA*1*000000001~',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-rose-500 truncate line-through opacity-70">
          NM1*IL*1*SMITH*JANE****MI*987654321~
        </div>
        <div className="text-emerald-600 dark:text-emerald-400 font-bold truncate">
          NM1*IL*1*[REDACTED]***MI*[MASKED]~
        </div>
        <div className="text-teal-600 dark:text-teal-400 font-semibold">45 CFR § 164.514(b) Safe Harbor</div>
      </div>
    ),
  },

  // 16. UUID Generator
  {
    id: 'ad-uuid-generator',
    toolId: 'uuid-generator',
    title: 'UUID v4 Generator',
    badge: 'Crypto Random',
    badgeTone: 'purple',
    icon: Fingerprint,
    accent: 'purple',
    footerLeft: 'crypto.getRandomValues()',
    cta: 'Generate Secure UUIDs',
    launchPayload: '',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-purple-600 dark:text-purple-400 font-bold truncate font-mono">
          f47ac10b-58cc-4372-a567-0e02b2c3d479
        </div>
        <div className="text-[color:var(--ink-muted)]">UUID Version 4 · RFC 4122</div>
        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero collision probability</div>
      </div>
    ),
  },

  // 17. Cron Expression Builder
  {
    id: 'ad-cron-expression',
    toolId: 'cron-expression',
    title: 'Cron Expression Builder',
    badge: '0 0 * * 1-5',
    badgeTone: 'amber',
    icon: CalendarClock,
    accent: 'amber',
    footerLeft: '5-part standard crontab',
    cta: 'Build Cron Schedule',
    launchPayload: '0 0 * * 1-5',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-amber-500 font-bold font-mono text-xs">0 0 * * 1-5</div>
        <div className="text-[color:var(--ink)] font-medium">&quot;At 00:00 on every day from Mon to Fri&quot;</div>
        <div className="text-[color:var(--ink-muted)]">Standard 5-part crontab syntax</div>
      </div>
    ),
  },

  // 18. JSON to EDI
  {
    id: 'ad-json-to-edi',
    toolId: 'json-to-edi',
    title: 'JSON to EDI Synthesizer',
    badge: 'JSON → X12 810',
    badgeTone: 'teal',
    icon: ArrowLeftRight,
    accent: 'teal',
    footerLeft: 'Envelopes & counts balanced',
    cta: 'Synthesize EDI Segments',
    launchPayload:
      '{\n  "transactionType": "810",\n  "invoiceNumber": "INV-7721",\n  "partner": "Northwind",\n  "totalAmount": 890.00\n}',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-teal-600 dark:text-teal-400 font-semibold truncate">
          &#123; &quot;po&quot;: &quot;PO-102&quot;, &quot;partner&quot;: &quot;Northwind&quot; &#125;
        </div>
        <div className="text-amber-600 dark:text-amber-400 font-mono truncate">BIG*20260401*PO-102~</div>
        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Auto segment count &amp; trailer</div>
      </div>
    ),
  },

  // 19. CSV Viewer
  {
    id: 'ad-csv-viewer',
    toolId: 'csv-viewer',
    title: 'CSV Viewer & Table Grid',
    badge: '3 cols · 120 rows',
    badgeTone: 'blue',
    icon: Table,
    accent: 'blue',
    footerLeft: 'Filter, sort & export',
    cta: 'Inspect CSV Table',
    launchPayload:
      'id,partner,revenue,status\n1,Northwind Traders,45200,Active\n2,Contoso Global,89100,Active\n3,Fabrikam Systems,32000,Pending',
    body: (
      <div className="space-y-0.5 text-[10px]">
        <div className="font-bold text-[color:var(--ink)] border-b border-[color:var(--border)] pb-0.5">
          id, partner, status
        </div>
        <div className="text-[color:var(--ink-muted)] truncate">1, Northwind Traders, Active</div>
        <div className="text-[color:var(--ink-muted)] truncate">2, Contoso Global, Verified</div>
      </div>
    ),
  },

  // 20. EDI Diff Compare
  {
    id: 'ad-edi-diff-compare',
    toolId: 'edi-diff-compare',
    title: 'EDI Semantic Diff',
    badge: 'Loop Alignment',
    badgeTone: 'indigo',
    icon: GitCompare,
    accent: 'indigo',
    footerLeft: 'Ignores volatile envelopes',
    cta: 'Compare EDI Documents',
    launchPayload: 'ST*850*0001~\nPO1*1*100*EA*13.50~\nSE*3*0001~',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-indigo-600 dark:text-indigo-400 font-semibold">PO1 Line Item Revision:</div>
        <div className="text-[color:var(--ink-muted)] truncate">
          PO1*1*50*EA*14.95 → <span className="text-emerald-500 font-bold">100*EA*13.50</span>
        </div>
        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Loop-aligned semantic comparison</div>
      </div>
    ),
  },

  // 21. Timestamp
  {
    id: 'ad-timestamp',
    toolId: 'timestamp',
    title: 'Unix Timestamp Converter',
    badge: 'Epoch UTC',
    badgeTone: 'orange',
    icon: Clock,
    accent: 'orange',
    footerLeft: 'Seconds & Milliseconds',
    cta: 'Convert Epoch Timestamp',
    launchPayload: '1775040000',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-orange-500 font-mono font-bold text-xs">1775040000</div>
        <div className="text-[color:var(--ink)]">2026-04-01 10:40:00 UTC</div>
        <div className="text-[color:var(--ink-muted)]">Relative &amp; ISO format output</div>
      </div>
    ),
  },

  // 22. URL Encode
  {
    id: 'ad-url-encode',
    toolId: 'url-encode',
    title: 'URL Percent-Encoder',
    badge: 'RFC 3986',
    badgeTone: 'cyan',
    icon: Link,
    accent: 'cyan',
    footerLeft: 'Safe percent escaping',
    cta: 'Encode / Decode URL',
    launchPayload: 'https://api.codepackr.com/v1/query?vendor=Northwind&filter=850+PO',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-[color:var(--ink-muted)] truncate">Query: /search?q=EDI 850 &amp; PO</div>
        <div className="text-cyan-600 dark:text-cyan-400 font-mono truncate">%2Fsearch%3Fq%3DEDI%20850%20%26%20PO</div>
        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">RFC 3986 percent compliance</div>
      </div>
    ),
  },

  // 23. Case Converter
  {
    id: 'ad-case-converter',
    toolId: 'case-converter',
    title: 'Identifier Case Converter',
    badge: 'camel ↔ snake',
    badgeTone: 'blue',
    icon: CaseSensitive,
    accent: 'blue',
    footerLeft: 'Preserves numbers & tags',
    cta: 'Convert Case Styles',
    launchPayload: 'contoso_purchase_order_reference',
    body: (
      <div className="space-y-0.5 text-[10px]">
        <div>
          <span className="text-blue-500 font-semibold">camel:</span> contosoPurchaseOrder
        </div>
        <div>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">snake:</span> contoso_purchase_order
        </div>
        <div>
          <span className="text-purple-500 font-semibold">kebab:</span> contoso-purchase-order
        </div>
      </div>
    ),
  },

  // 24. JSON to CSV Converter
  {
    id: 'ad-json-csv-converter',
    toolId: 'json-csv-converter',
    title: 'JSON ↔ CSV Converter',
    badge: 'Arrays & Objects',
    badgeTone: 'teal',
    icon: FileSpreadsheet,
    accent: 'teal',
    footerLeft: 'Handles nested structures',
    cta: 'Convert JSON & CSV',
    launchPayload:
      '[\n  {"sku": "NW-01", "name": "Standard Widget", "price": 19.99},\n  {"sku": "NW-02", "name": "Deluxe Widget", "price": 34.50}\n]',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-teal-600 dark:text-teal-400 font-semibold">
          [ &#123; &quot;sku&quot;: &quot;TL-01&quot;, &quot;qty&quot;: 20 &#125; ]
        </div>
        <div className="text-center text-teal-500 text-[9px]">▲ flattened tabular ▼</div>
        <div className="text-[color:var(--ink-muted)] font-mono">sku,qty \n TL-01,20</div>
      </div>
    ),
  },

  // 25. Markdown to HTML Converter
  {
    id: 'ad-markdown-html-converter',
    toolId: 'markdown-html-converter',
    title: 'Markdown to HTML',
    badge: 'GFM Compliant',
    badgeTone: 'purple',
    icon: FileCode,
    accent: 'purple',
    footerLeft: 'Syntax-highlighted HTML',
    cta: 'Convert Markdown & HTML',
    launchPayload:
      '### Northwind Supply Notice\n\n* **Partner**: Northwind Traders\n* **Compliance**: 100% Client-Side\n* **Status**: `Validated`',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-purple-500 font-bold">### Northwind Logistics</div>
        <div className="text-[color:var(--ink)] pl-2 border-l-2 border-purple-500/40">
          &lt;h3&gt;Northwind Logistics&lt;/h3&gt;
        </div>
        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">GFM spec &amp; clean syntax</div>
      </div>
    ),
  },

  // 26. QR Code Generator
  {
    id: 'ad-qr-generator',
    toolId: 'qr-generator',
    title: 'QR Code Generator',
    badge: 'SVG / PNG Export',
    badgeTone: 'emerald',
    icon: QrCode,
    accent: 'emerald',
    footerLeft: 'Downloadable crisp vectors',
    cta: 'Generate QR Code',
    launchPayload: 'https://www.codepackr.com',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
          Target: https://www.codepackr.com
        </div>
        <div className="text-[color:var(--ink-muted)]">Error Correction Level H (30%)</div>
        <div className="text-emerald-600 dark:text-emerald-400 font-bold">SVG Vector &amp; High-Res PNG</div>
      </div>
    ),
  },

  // 27. Number Base Converter
  {
    id: 'ad-number-base-converter',
    toolId: 'number-base-converter',
    title: 'Number Base Converter',
    badge: 'Bin / Hex / Dec',
    badgeTone: 'amber',
    icon: Hash,
    accent: 'amber',
    footerLeft: '64-bit integer precision',
    cta: 'Convert Number Radix',
    launchPayload: '65280',
    body: (
      <div className="space-y-0.5 text-[10px]">
        <div>
          <span className="text-amber-500 font-semibold">DEC:</span> 65280
        </div>
        <div>
          <span className="text-purple-500 font-semibold">HEX:</span> 0xFF00
        </div>
        <div>
          <span className="text-blue-500 font-semibold">BIN:</span> 1111 1111 0000 0000
        </div>
      </div>
    ),
  },

  // 28. HTML Formatter
  {
    id: 'ad-html-formatter',
    toolId: 'html-formatter',
    title: 'HTML Formatter',
    badge: 'HTML5 Clean',
    badgeTone: 'rose',
    icon: FileCode,
    accent: 'rose',
    footerLeft: 'Indent tags & attributes',
    cta: 'Beautify HTML Code',
    launchPayload:
      '<section class="partner-card"><h2>Contoso Logistics</h2><p>Dispatch ready</p><span class="badge">Active</span></section>',
    body: (
      <div className="space-y-0.5 text-[10px]">
        <div className="text-rose-500">&lt;div class=&quot;card&quot;&gt;</div>
        <div className="pl-2 text-[color:var(--ink)]">&lt;h2&gt;Contoso Services&lt;/h2&gt;</div>
        <div className="text-rose-500">&lt;/div&gt;</div>
      </div>
    ),
  },

  // 29. EDI Formatter
  {
    id: 'ad-edi-formatter',
    toolId: 'edi-formatter',
    title: 'EDI X12 Delimiter Formatter',
    badge: '~ * : \\',
    badgeTone: 'teal',
    icon: Workflow,
    accent: 'teal',
    footerLeft: 'Custom element separators',
    cta: 'Format EDI Delimiters',
    launchPayload:
      'ISA*00*          *00*          *ZZ*NORTHWIND      *ZZ*FABRIKAM       *260401*1200*U*00401*000000001*0*P*>~GS*PO*NORTHWIND*FABRIKAM*20260401*1200*1*X*004010~ST*850*0001~BEG*00*SA*PO-1100**20260401~SE*3*0001~GE*1*1~IEA*1*000000001~',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-teal-600 dark:text-teal-400 font-semibold">Custom Delimiters: ~ (seg) * (elem)</div>
        <div className="text-[color:var(--ink-muted)] truncate font-mono">ST*850*0001~BEG*00*SA*PO-9842~</div>
        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Wrap &amp; indent loop hierarchies</div>
      </div>
    ),
  },

  // 30. YAML to JSON Converter
  {
    id: 'ad-yaml-json-converter',
    toolId: 'yaml-json-converter',
    title: 'YAML ↔ JSON Converter',
    badge: 'Lossless',
    badgeTone: 'cyan',
    icon: Sparkles,
    accent: 'cyan',
    footerLeft: 'Bi-directional config mapping',
    cta: 'Convert YAML & JSON',
    launchPayload: 'partner: "Fabrikam Systems"\ntier: "Enterprise"\nactive: true',
    body: (
      <div className="space-y-1 text-[10px]">
        <div className="text-cyan-600 dark:text-cyan-400 font-semibold">partner: &quot;Fabrikam&quot;</div>
        <div className="text-center text-cyan-500 text-[9px]">▲ bi-directional ▼</div>
        <div className="text-[color:var(--ink-muted)] font-mono">&#123; &quot;partner&quot;: &quot;Fabrikam&quot; &#125;</div>
      </div>
    ),
  },
];
