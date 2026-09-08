import React, { useState, useMemo } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, FileCode, Check, Braces, KeyRound, Shield, RefreshCw, Clock } from 'lucide-react';
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

    const list: SmartSuggestion[] = [];

    // 1. JWT detection (typically starts with "ey" and contains 2 dots)
    if (/^ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/.test(raw) || (raw.startsWith('ey') && raw.includes('.'))) {
      list.push({
        label: 'Decode JWT Token',
        toolId: 'jwt-decoder',
        description: 'Inspect decoded header, claims, issuer, and expiration',
        icon: <KeyRound className="w-4 h-4 text-purple-500" />,
        badge: 'JWT Detected',
      });
    }

    // 2. EDI X12 detection (starts with ISA*)
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
          badge: 'EDI &rarr; JSON',
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

    // 3. JSON detection
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
            label: 'Convert JSON to YAML',
            toolId: 'yaml-json-converter',
            description: 'Export as clean YAML configuration',
            icon: <RefreshCw className="w-4 h-4 text-teal-500" />,
            badge: 'JSON &rarr; YAML',
          },
          {
            label: 'Convert JSON to CSV',
            toolId: 'json-csv-converter',
            description: 'Export tabular arrays as CSV spreadsheet',
            icon: <FileCode className="w-4 h-4 text-emerald-500" />,
            badge: 'JSON &rarr; CSV',
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

    // 4. SQL detection
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/i.test(raw)) {
      list.push({
        label: 'Format SQL Query',
        toolId: 'sql-formatter',
        description: 'Standardize keywords, joins, indentations, and CTEs',
        icon: <FileCode className="w-4 h-4 text-indigo-500" />,
        badge: 'SQL Detected',
      });
    }

    // 5. XML / HTML detection
    if (raw.startsWith('<') && raw.endsWith('>')) {
      if (/<!DOCTYPE\s+html|<html|<div|<body/i.test(raw)) {
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
            label: 'Convert XML to JSON',
            toolId: 'json-xml-converter',
            description: 'Map XML hierarchy into structured JSON object',
            icon: <RefreshCw className="w-4 h-4 text-cyan-500" />,
            badge: 'XML &rarr; JSON',
          }
        );
      }
    }

    // 6. Base64 detection
    if (
      raw.length >= 16 &&
      /^[A-Za-z0-9+/=]+$/.test(raw) &&
      !list.some((s) => s.toolId === 'jwt-decoder')
    ) {
      list.push({
        label: 'Decode Base64 String',
        toolId: 'base64',
        description: 'Decode to UTF-8 text or examine payload',
        icon: <RefreshCw className="w-4 h-4 text-violet-500" />,
        badge: 'Base64 Detected',
      });
    }

    // 7. URL Encoded detection
    if (raw.includes('%20') || raw.includes('%2F') || raw.includes('%3A') || raw.startsWith('http://') || raw.startsWith('https://')) {
      list.push({
        label: 'Decode URL / URI',
        toolId: 'url-encode',
        description: 'Parse query parameters and decode percent-encoded tokens',
        icon: <RefreshCw className="w-4 h-4 text-sky-500" />,
        badge: 'URL / URI',
      });
    }

    // 8. CSS detection
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

    // 9. Cron Expression detection (5 parts separated by whitespace with cron characters)
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
            placeholder="Paste raw JSON, JWT token, EDI X12, SQL query, XML, or Base64 here for instant smart routing..."
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
