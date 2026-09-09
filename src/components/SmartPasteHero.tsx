import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  FileCode,
  Check,
  Braces,
  KeyRound,
  Shield,
  RefreshCw,
  Clock,
  Image,
  DollarSign,
  Calculator,
  Lock,
  Search,
  FileSpreadsheet,
  Layers,
  Terminal,
} from 'lucide-react';
import { ToolDef } from '../types';
import { TOOLS } from '../data/tools';
import { setSmartPastePayload } from '../lib/workspace';
import { SLUG_TO_TOOL_ID } from '../lib/urls';

interface SmartSuggestion {
  label: string;
  toolId: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
}

interface SmartPasteHeroProps {
  onSelectTool: (tool: ToolDef, initialPayload?: string) => void;
}

export const SmartPasteHero: React.FC<SmartPasteHeroProps> = ({ onSelectTool }) => {
  const [pasteInput, setPasteInput] = useState('');

  // Analyze pasted data heuristics
  const suggestions = useMemo<SmartSuggestion[]>(() => {
    const raw = pasteInput.trim();
    if (!raw) return [];
    const lower = raw.toLowerCase();

    const list: SmartSuggestion[] = [];

    // Helper to prevent duplicate tool recommendations
    const hasTool = (id: string) => list.some((s) => s.toolId === id);

    // 1. Data URL & Base64 Image detection
    if (raw.startsWith('data:image/')) {
      list.push(
        {
          label: 'Preview & Convert Base64 Image',
          toolId: 'base64-image',
          description: 'Convert base64 data URI to download and view image file',
          icon: <Image className="w-4 h-4 text-emerald-500" />,
          badge: 'Base64 Image',
        },
        {
          label: 'Inspect Image EXIF Metadata',
          toolId: 'image-exif-inspector',
          description: 'Analyze EXIF, camera, GPS, and color profiles',
          icon: <Layers className="w-4 h-4 text-indigo-500" />,
          badge: 'EXIF Inspector',
        }
      );
    }

    // 2. Image keywords routing
    if (
      lower.includes('diff image') ||
      lower.includes('image diff') ||
      lower.includes('compare image') ||
      lower.includes('pixel diff')
    ) {
      if (!hasTool('image-diff-checker')) {
        list.push({
          label: 'Compare Images & Pixel Diff',
          toolId: 'image-diff-checker',
          description: 'Visual side-by-side, swipe slider, and mismatch pixel heatmap',
          icon: <Image className="w-4 h-4 text-emerald-500" />,
          badge: 'Image Diff',
        });
      }
    }

    if (
      lower.includes('merge image') ||
      lower.includes('combine image') ||
      lower.includes('join image') ||
      lower.includes('stitch image')
    ) {
      if (!hasTool('image-merger')) {
        list.push({
          label: 'Combine & Stitch Images',
          toolId: 'image-merger',
          description: 'Side-by-side or stacked image merging with custom padding',
          icon: <Layers className="w-4 h-4 text-cyan-500" />,
          badge: 'Image Merger',
        });
      }
    }

    if (
      lower.includes('exif') ||
      lower.includes('strip exif') ||
      lower.includes('photo metadata') ||
      lower.includes('camera info')
    ) {
      if (!hasTool('image-exif-inspector')) {
        list.push({
          label: 'Inspect & Strip EXIF Data',
          toolId: 'image-exif-inspector',
          description: 'Audit metadata tags, GPS geolocation, and remove private EXIF',
          icon: <Layers className="w-4 h-4 text-purple-500" />,
          badge: 'EXIF Inspector',
        });
      }
    }

    if (
      lower.includes('resize image') ||
      lower.includes('favicon') ||
      lower.includes('image resolution') ||
      lower.includes('convert webp')
    ) {
      if (!hasTool('image-resizer')) {
        list.push({
          label: 'Resize Image & Generate Favicon',
          toolId: 'image-resizer',
          description: 'High-quality resampling, ICO favicon packages, and format conversion',
          icon: <Image className="w-4 h-4 text-blue-500" />,
          badge: 'Image Resizer',
        });
      }
    }

    // 3. Financial & Retirement keywords routing
    if (
      lower.includes('retirement') ||
      lower.includes('corpus') ||
      lower.includes('pension') ||
      lower.includes('401k') ||
      lower.includes('financial plan') ||
      lower.includes('fire movement')
    ) {
      if (!hasTool('financial-planner')) {
        list.push({
          label: 'Retirement & Financial Planner',
          toolId: 'financial-planner',
          description: 'Model inflation-adjusted corpus, withdrawal glidepaths, and milestones',
          icon: <DollarSign className="w-4 h-4 text-emerald-500" />,
          badge: 'Retirement Calculator',
        });
      }
    }

    if (
      lower.includes('loan') ||
      lower.includes('emi') ||
      lower.includes('mortgage') ||
      lower.includes('amortization')
    ) {
      if (!hasTool('loan-calculator')) {
        list.push({
          label: 'Loan & EMI Calculator',
          toolId: 'loan-calculator',
          description: 'Calculate monthly installment and full amortization schedule',
          icon: <Calculator className="w-4 h-4 text-teal-500" />,
          badge: 'Loan & EMI',
        });
      }
    }

    if (lower.includes('sip') || lower.includes('mutual fund') || lower.includes('systematic investment')) {
      if (!hasTool('sip-calculator')) {
        list.push({
          label: 'SIP Investment Calculator',
          toolId: 'sip-calculator',
          description: 'Project wealth creation from monthly mutual fund contributions',
          icon: <DollarSign className="w-4 h-4 text-sky-500" />,
          badge: 'SIP Calculator',
        });
      }
    }

    if (
      lower.includes('compound interest') ||
      lower.includes('interest calculator') ||
      lower.includes('compound return')
    ) {
      if (!hasTool('investment-calculator')) {
        list.push({
          label: 'Compound Interest Calculator',
          toolId: 'investment-calculator',
          description: 'Calculate exponential interest growth across custom intervals',
          icon: <Calculator className="w-4 h-4 text-amber-500" />,
          badge: 'Compound Interest',
        });
      }
    }

    // 4. Cryptographic Hash, UUID, Password & Security detection
    if (/^[a-fA-F0-9]{32}$/.test(raw) || /^[a-fA-F0-9]{40}$/.test(raw) || /^[a-fA-F0-9]{64}$/.test(raw) || lower.includes('sha256') || lower.includes('sha-256') || lower.includes('md5')) {
      if (!hasTool('hash-generator')) {
        list.push({
          label: 'Verify & Generate Hashes',
          toolId: 'hash-generator',
          description: 'Compute MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes locally',
          icon: <Lock className="w-4 h-4 text-violet-500" />,
          badge: 'Cryptographic Hash',
        });
      }
    }

    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw) ||
      lower.includes('uuid') ||
      lower.includes('guid')
    ) {
      if (!hasTool('uuid-generator')) {
        list.push({
          label: 'Generate UUID / GUID',
          toolId: 'uuid-generator',
          description: 'RFC 4122 compliant UUID v4 generator with custom casing',
          icon: <KeyRound className="w-4 h-4 text-blue-500" />,
          badge: 'UUID Detected',
        });
      }
    }

    if (lower.includes('password') || lower.includes('passphrase') || lower.includes('generate secret')) {
      if (!hasTool('password-generator')) {
        list.push({
          label: 'Generate Strong Password',
          toolId: 'password-generator',
          description: 'High-entropy cryptographic passwords with custom symbol sets',
          icon: <Shield className="w-4 h-4 text-emerald-500" />,
          badge: 'Password Generator',
        });
      }
    }

    // 5. JWT detection (typically starts with "ey" and contains 2 dots)
    if (/^ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/.test(raw) || (raw.startsWith('ey') && raw.includes('.'))) {
      list.push(
        {
          label: 'Decode JWT Token',
          toolId: 'jwt-decoder',
          description: 'Inspect decoded header, claims, issuer, and expiration',
          icon: <KeyRound className="w-4 h-4 text-purple-500" />,
          badge: 'JWT Detected',
        },
        {
          label: 'Sign & Encode JWT',
          toolId: 'jwt-encoder',
          description: 'Create signed JWT tokens with HS256 algorithm',
          icon: <Lock className="w-4 h-4 text-indigo-500" />,
          badge: 'JWT Signer',
        }
      );
    }

    // 6. cURL command detection
    if (/^\s*curl\s+/i.test(raw)) {
      list.push({
        label: 'Convert cURL to Code',
        toolId: 'curl-code-converter',
        description: 'Convert cURL command into JavaScript Fetch, Axios, Python, or Node.js',
        icon: <Terminal className="w-4 h-4 text-sky-500" />,
        badge: 'cURL Command',
      });
    }

    // 7. EDI X12 detection (starts with ISA*)
    if (raw.startsWith('ISA*') || raw.startsWith('ISA~') || raw.startsWith('ST*') || raw.includes('GS*') || raw.includes('BEG*')) {
      list.push(
        {
          label: 'Format EDI X12',
          toolId: 'edi-formatter',
          description: 'Beautify segments, loops, and delimiters',
          icon: <Shield className="w-4 h-4 text-orange-500" />,
          badge: 'ANSI X12 Detected',
        },
        {
          label: 'Convert EDI to JSON',
          toolId: 'edi-to-json',
          description: 'Transform X12 transaction to structured JSON object',
          icon: <RefreshCw className="w-4 h-4 text-amber-500" />,
          badge: 'EDI \u2192 JSON',
        },
        {
          label: 'Validate EDI Document',
          toolId: 'edi-validator',
          description: 'Validate envelope, segment count, control numbers, and mandatory fields',
          icon: <Check className="w-4 h-4 text-emerald-500" />,
          badge: 'EDI Validator',
        },
        {
          label: 'View Segments & Elements',
          toolId: 'edi-segment-viewer',
          description: 'Interactive tree and tabular inspector for segments and elements',
          icon: <FileCode className="w-4 h-4 text-blue-500" />,
          badge: 'Segment Viewer',
        }
      );
    }

    // 8. JSON detection
    if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
      try {
        JSON.parse(raw);
        list.push(
          {
            label: 'Format & Beautify JSON',
            toolId: 'json-formatter',
            description: 'Indentation, syntax validation, and minification',
            icon: <Braces className="w-4 h-4 text-blue-500" />,
            badge: 'Valid JSON',
          },
          {
            label: 'Generate Type Definitions',
            toolId: 'json-definition-generator',
            description: 'Generate TypeScript, C#, Go, Rust, Java, and Python interfaces',
            icon: <FileCode className="w-4 h-4 text-indigo-500" />,
            badge: 'JSON \u2192 Types',
          },
          {
            label: 'Convert JSON to YAML',
            toolId: 'yaml-json-converter',
            description: 'Export as clean YAML configuration',
            icon: <RefreshCw className="w-4 h-4 text-teal-500" />,
            badge: 'JSON \u2192 YAML',
          },
          {
            label: 'Convert JSON to CSV',
            toolId: 'json-csv-converter',
            description: 'Export tabular arrays as CSV spreadsheet',
            icon: <FileSpreadsheet className="w-4 h-4 text-emerald-500" />,
            badge: 'JSON \u2192 CSV',
          },
          {
            label: 'Validate JSON Structure',
            toolId: 'json-validator',
            description: 'Check schema, byte sizes, and keys',
            icon: <Check className="w-4 h-4 text-sky-500" />,
            badge: 'JSON Validator',
          }
        );
      } catch {
        list.push({
          label: 'Validate & Repair JSON',
          toolId: 'json-validator',
          description: 'Detect syntax errors, missing commas, or trailing quotes',
          icon: <Braces className="w-4 h-4 text-rose-500" />,
          badge: 'Malformed JSON',
        });
      }
    }

    // 9. SQL detection
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/i.test(raw)) {
      if (!hasTool('sql-formatter')) {
        list.push({
          label: 'Format SQL Query',
          toolId: 'sql-formatter',
          description: 'Standardize keywords, joins, indentations, and CTEs',
          icon: <FileCode className="w-4 h-4 text-indigo-500" />,
          badge: 'SQL Detected',
        });
      }
    }

    // 10. XML / XSD / XSLT detection
    if (raw.startsWith('<') && raw.endsWith('>')) {
      if (raw.includes('xsl:stylesheet') || raw.includes('xsl:template') || raw.includes('xmlns:xsl')) {
        list.push({
          label: 'XSLT Transformer & Tester',
          toolId: 'xslt-transformer',
          description: 'Transform XML documents using XSLT 1.0 templates and preview HTML/XML output',
          icon: <RefreshCw className="w-4 h-4 text-amber-500" />,
          badge: 'XSLT Stylesheet',
        });
      } else if (raw.includes('xs:schema') || raw.includes('xsd:schema') || raw.includes('xmlns:xs')) {
        list.push(
          {
            label: 'Validate XSD Schema & XML',
            toolId: 'xsd-validator',
            description: 'Validate XML payload against this W3C XSD schema definition',
            icon: <Check className="w-4 h-4 text-emerald-500" />,
            badge: 'XSD Schema',
          },
          {
            label: 'Generate XML from XSD',
            toolId: 'xsd-to-xml',
            description: 'Generate conforming sample XML instance from XSD schema',
            icon: <FileCode className="w-4 h-4 text-blue-500" />,
            badge: 'XSD \u2192 XML',
          }
        );
      } else if (/<!DOCTYPE\s+html|<html|<div|<body/i.test(raw)) {
        list.push({
          label: 'Format HTML Document',
          toolId: 'html-formatter',
          description: 'Clean indentation and nesting for HTML markup',
          icon: <FileCode className="w-4 h-4 text-orange-500" />,
          badge: 'HTML Detected',
        });
      } else {
        list.push(
          {
            label: 'Format XML Document',
            toolId: 'xml-formatter',
            description: 'Indent nodes, tags, and namespaces cleanly',
            icon: <FileCode className="w-4 h-4 text-rose-500" />,
            badge: 'XML Detected',
          },
          {
            label: 'Validate with XSD Schema',
            toolId: 'xsd-validator',
            description: 'Verify element hierarchy and datatypes against XSD schema',
            icon: <Check className="w-4 h-4 text-emerald-500" />,
            badge: 'XSD Validator',
          },
          {
            label: 'Generate XSD Schema from XML',
            toolId: 'xml-to-xsd',
            description: 'Auto-infer W3C XSD schema from this XML document',
            icon: <Layers className="w-4 h-4 text-purple-500" />,
            badge: 'XML \u2192 XSD',
          },
          {
            label: 'Convert XML to JSON',
            toolId: 'json-xml-converter',
            description: 'Map XML hierarchy into structured JSON object',
            icon: <RefreshCw className="w-4 h-4 text-cyan-500" />,
            badge: 'XML \u2192 JSON',
          }
        );
      }
    }

    // 11. XPath Query detection
    if ((raw.startsWith('//') || raw.startsWith('/')) && (raw.includes('[') || raw.includes('@') || raw.includes('text()'))) {
      list.push({
        label: 'Evaluate XPath Query',
        toolId: 'xpath-evaluator',
        description: 'Test XPath 1.0 expression against XML documents',
        icon: <Search className="w-4 h-4 text-purple-500" />,
        badge: 'XPath Expression',
      });
    }

    // 12. CSV detection
    if (!list.some((s) => s.toolId === 'json-formatter') && raw.includes('\n') && (raw.split('\n')[0].includes(',') || raw.split('\n')[0].includes('\t'))) {
      const lines = raw.split('\n');
      if (lines.length >= 2 && lines[0].split(',').length >= 2) {
        list.push({
          label: 'View & Edit CSV Data',
          toolId: 'csv-viewer',
          description: 'Interactive spreadsheet table with sort, search, and export',
          icon: <FileSpreadsheet className="w-4 h-4 text-emerald-500" />,
          badge: 'CSV Spreadsheet',
        });
      }
    }

    // 13. Markdown detection
    if (/^#+\s+/m.test(raw) || /^-\s+\[[ x]\]/m.test(raw) || raw.includes('```')) {
      list.push(
        {
          label: 'Markdown Live Preview',
          toolId: 'markdown-preview',
          description: 'Live interactive GitHub-flavored markdown renderer and word counter',
          icon: <FileCode className="w-4 h-4 text-sky-500" />,
          badge: 'Markdown Live',
        },
        {
          label: 'Convert Markdown to HTML',
          toolId: 'markdown-html-converter',
          description: 'Compile Markdown into clean HTML markup',
          icon: <RefreshCw className="w-4 h-4 text-indigo-500" />,
          badge: 'Markdown \u2192 HTML',
        }
      );
    }

    // 14. Base64 detection
    if (
      raw.length >= 16 &&
      /^[A-Za-z0-9+/=]+$/.test(raw) &&
      !list.some((s) => s.toolId === 'jwt-decoder' || s.toolId === 'base64-image')
    ) {
      list.push({
        label: 'Decode Base64 String',
        toolId: 'base64',
        description: 'Decode to UTF-8 text or examine payload',
        icon: <RefreshCw className="w-4 h-4 text-violet-500" />,
        badge: 'Base64 Detected',
      });
    }

    // 15. URL Encoded detection
    if (raw.includes('%20') || raw.includes('%2F') || raw.includes('%3A') || raw.startsWith('http://') || raw.startsWith('https://')) {
      if (!hasTool('url-encode')) {
        list.push({
          label: 'Decode URL / URI',
          toolId: 'url-encode',
          description: 'Parse query parameters and decode percent-encoded tokens',
          icon: <RefreshCw className="w-4 h-4 text-sky-500" />,
          badge: 'URL / URI',
        });
      }
    }

    // 16. CSS detection
    if (raw.includes('{') && raw.includes(';') && (raw.includes(':') || raw.includes('@media'))) {
      if (!list.some((s) => s.toolId === 'json-formatter')) {
        list.push({
          label: 'Format CSS Stylesheet',
          toolId: 'css-formatter',
          description: 'Format rules, declarations, and pseudo-classes',
          icon: <FileCode className="w-4 h-4 text-pink-500" />,
          badge: 'CSS Detected',
        });
      }
    }

    // 17. Cron Expression detection (5 parts separated by whitespace with cron characters)
    const cronParts = raw.split(/\s+/);
    if (
      cronParts.length === 5 &&
      cronParts.every((p) => /^(\*|\d+|\*\/\d+|\d+-\d+|\d+(,\d+)+|\?)$/.test(p))
    ) {
      list.push({
        label: 'Visualize Cron Schedule',
        toolId: 'cron-expression',
        description: 'Simulate next run times and inspect timeline',
        icon: <Clock className="w-4 h-4 text-emerald-500" />,
        badge: 'Cron Expression',
      });
    }

    return list;
  }, [pasteInput]);

  const handleExecuteSuggestion = (toolId: string) => {
    const canonicalId = SLUG_TO_TOOL_ID[toolId] || toolId;
    const targetTool = TOOLS.find((t) => t.id === canonicalId || t.id === toolId);
    if (!targetTool) {
      console.warn(`Tool definition not found for ID: ${toolId} (canonical: ${canonicalId})`);
      return;
    }
    const payload = pasteInput.trim();
    setSmartPastePayload(canonicalId, payload, targetTool.category);
    setSmartPastePayload(toolId, payload, targetTool.category);
    onSelectTool(targetTool, payload);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2 sm:p-3 shadow-lg transition-all focus-within:border-[color:var(--brand)] focus-within:ring-2 focus-within:ring-[color:var(--brand)]/20">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[color:var(--border)]/60 text-xs font-semibold text-[color:var(--ink-muted)]">
          <Sparkles className="w-3.5 h-3.5 text-[color:var(--brand)]" />
          <span>Omni-Input &amp; Smart Paste Discovery</span>
          <span className="ml-auto text-[11px] font-mono opacity-70">100% Client-Side Heuristics</span>
        </div>

        <div className="relative">
          <textarea
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            placeholder="Paste raw JSON, JWT, EDI X12, SQL, XML, XSLT, cURL, Image data, or keywords (e.g. 'retirement', 'loan', 'exif', 'diff')..."
            rows={pasteInput ? 4 : 2}
            className="w-full p-3 font-mono text-xs sm:text-sm bg-transparent border-none outline-none resize-none text-[color:var(--ink)] placeholder-[color:var(--ink-muted)] custom-scrollbar leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Suggestion Actions Bar */}
        {suggestions.length > 0 && (
          <div className="mt-2 pt-2.5 border-t border-[color:var(--border)] flex flex-col gap-2 animate-fade-in">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-muted)] px-2">
              Detected payload &bull; Recommended Quick Actions:
            </div>
            <div className="flex flex-wrap items-center gap-2 px-1">
              {suggestions.map((sugg) => (
                <button
                  key={sugg.toolId}
                  onClick={() => handleExecuteSuggestion(sugg.toolId)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[color:var(--surface-elevated)] border border-[color:var(--border)] hover:border-[color:var(--brand)] hover:bg-[color:var(--brand-light)] text-[color:var(--ink)] hover:text-[color:var(--brand)] transition-all shadow-xs cursor-pointer group"
                >
                  {sugg.icon}
                  <span>{sugg.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--surface-muted)] text-[color:var(--ink-muted)] group-hover:bg-[color:var(--brand)] group-hover:text-white font-medium">
                    {sugg.badge}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}

        {pasteInput && suggestions.length === 0 && (
          <div className="mt-2 pt-2 border-t border-[color:var(--border)] px-3 text-xs text-[color:var(--ink-muted)] flex items-center justify-between">
            <span>Payload captured ({pasteInput.length} characters). Select any tool below or refine payload.</span>
            <button
              onClick={() => setPasteInput('')}
              className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

