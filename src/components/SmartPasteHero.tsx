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

  const [isFocused, setIsFocused] = useState(false);

  // Quick interactive samples for visitors to test instant detection
  const SAMPLE_PAYLOADS = [
    {
      label: 'JSON',
      payload: '{\n  "status": "ready",\n  "code": 200,\n  "clientSide": true\n}',
    },
    {
      label: 'EDI 850',
      payload: 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260401*1230*U*00401*000000001*0*P*>~\nGS*PO*SENDER*RECEIVER*20260401*1230*1*X*004010~\nST*850*0001~\nBEG*00*SA*PO-9921**20260401~\nPO1*1*20*EA*24.50**BP*SKU-4401~\nSE*5*0001~',
    },
    {
      label: 'JWT',
      payload: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRGV2Iiwicm9sZSI6ImVuZ2luZWVyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    },
    {
      label: 'cURL',
      payload: 'curl -X POST "https://api.example.com/v1/orders" \\\n  -H "Authorization: Bearer sec_tok_9912" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"item": "book", "qty": 2}\'',
    },
    {
      label: 'SQL',
      payload: 'SELECT u.id, u.username, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.status = \'active\' GROUP BY u.id, u.username ORDER BY order_count DESC;',
    },
  ];

  // Primary highlight chip detection for the visual magic moment
  const primaryChip = useMemo(() => {
    const raw = pasteInput.trim();
    if (!raw) return null;
    const lower = raw.toLowerCase();

    if (raw.startsWith('ISA*') || raw.startsWith('ISA~') || raw.startsWith('ST*') || raw.includes('GS*PO*')) {
      return {
        text: 'Looks like EDI X12 → Open EDI Formatter',
        toolId: 'edi-formatter',
        badge: 'EDI X12',
        color: 'border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20',
      };
    }
    if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
      return {
        text: 'JSON detected → Open JSON Formatter',
        toolId: 'json-formatter',
        badge: 'JSON Formatter',
        color: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20',
      };
    }
    if (/^ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/.test(raw)) {
      return {
        text: 'JWT token detected → Open JWT Decoder',
        toolId: 'jwt-decoder',
        badge: 'JWT Decoder',
        color: 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20',
      };
    }
    if (/^\s*curl\s+/i.test(raw)) {
      return {
        text: 'cURL command detected → Open cURL to Code',
        toolId: 'curl-code-converter',
        badge: 'cURL to Code',
        color: 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20',
      };
    }
    if (raw.startsWith('<?xml') || (raw.startsWith('<') && raw.endsWith('>'))) {
      return {
        text: 'XML payload detected → Open XML Formatter',
        toolId: 'xml-formatter',
        badge: 'XML Formatter',
        color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20',
      };
    }
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\s+/i.test(raw)) {
      return {
        text: 'SQL query detected → Open SQL Formatter',
        toolId: 'sql-formatter',
        badge: 'SQL Formatter',
        color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
      };
    }
    if (raw.length >= 16 && /^[A-Za-z0-9+/=]+$/.test(raw)) {
      return {
        text: 'Base64 detected → Decode Base64',
        toolId: 'base64',
        badge: 'Base64 Decoder',
        color: 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20',
      };
    }
    return null;
  }, [pasteInput]);

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
      <div
        className={`relative rounded-2xl border transition-all duration-300 bg-[color:var(--surface)] p-2.5 sm:p-3.5 shadow-lg ${
          isFocused || pasteInput.trim()
            ? 'border-[color:var(--brand)] ring-4 ring-[color:var(--brand)]/15 shadow-[0_10px_35px_-10px_rgba(37,99,235,0.2)]'
            : 'border-[color:var(--border)] hover:border-[color:var(--border-hover)]'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-[color:var(--border)]/60 text-xs font-semibold text-[color:var(--ink-muted)] flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-3.5 h-3.5 transition-colors ${isFocused ? 'text-[color:var(--brand)] animate-spin' : 'text-[color:var(--brand)]'}`} />
            <span className="text-[color:var(--ink)]">Omni-Input &amp; Smart Paste Discovery</span>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            {isFocused && !pasteInput.trim() && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-500 font-medium animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Listening for paste / input...
              </span>
            )}
            {primaryChip && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in">
                <Check className="w-3 h-3" /> {primaryChip.badge}
              </span>
            )}
            <span className="text-[10px] font-mono opacity-60">100% In-Browser</span>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Paste raw JSON, JWT, EDI X12, SQL, XML, XSLT, cURL, or keywords (e.g. 'diff', 'exif', 'loan')..."
            rows={pasteInput ? 4 : 2}
            className="w-full p-3 font-mono text-xs sm:text-sm bg-transparent border-none outline-none resize-none text-[color:var(--ink)] placeholder-[color:var(--ink-muted)] custom-scrollbar leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Quick Sample Presets (When empty) */}
        {!pasteInput.trim() && (
          <div className="px-3 pt-1 pb-2 border-t border-[color:var(--border)]/40 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-medium text-[color:var(--ink-muted)]">Try instant sample:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SAMPLE_PAYLOADS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setPasteInput(s.payload);
                    setIsFocused(true);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] hover:border-[color:var(--brand)] hover:text-[color:var(--brand)] text-[11px] font-mono text-[color:var(--ink-muted)] transition-all hover:scale-105 cursor-pointer shadow-xs"
                >
                  +{s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Floating Primary Suggestion Banner (Magic Moment) */}
        {primaryChip && (
          <div className="mx-2 mb-2 p-2 rounded-xl border animate-spring-pop flex items-center justify-between gap-3 bg-gradient-to-r from-blue-500/5 via-[color:var(--surface-elevated)] to-teal-500/5 border-[color:var(--brand)]/30">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
              <span className="text-xs font-bold text-[color:var(--ink)] truncate">
                {primaryChip.text}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleExecuteSuggestion(primaryChip.toolId)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[color:var(--brand)] hover:bg-[color:var(--brand-hover)] transition-all hover:scale-105 shadow-sm cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <span>Launch Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Additional Suggestion Actions Bar */}
        {suggestions.length > 0 && (
          <div className="mt-1 pt-2.5 border-t border-[color:var(--border)] flex flex-col gap-2 animate-fade-in">
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

