import React, { useState, useEffect } from 'react';
import { FileCode, CheckCircle, AlertTriangle, Layers, Server, Globe, Tag } from 'lucide-react';
import yaml from 'js-yaml';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface OpenApiValidatorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const SAMPLE_OPENAPI = `openapi: 3.0.3
info:
  title: CodePackr Enterprise API
  description: High-performance client-side developer utilities and transaction APIs.
  version: 1.0.0
servers:
  - url: https://api.codepackr.com/v1
    description: Production API Gateway
paths:
  /health:
    get:
      summary: Health check endpoint
      responses:
        '200':
          description: Service is operational
  /tools/validate:
    post:
      summary: Structural schema validation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '200':
          description: Validation result payload
  /tokens/inspect:
    post:
      summary: Inspect and parse cryptographic token
      responses:
        '200':
          description: Token inspection details
`;

export const OpenApiValidatorView: React.FC<OpenApiValidatorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [specInput, setSpecInput] = useState(initialInput.trim() || SAMPLE_OPENAPI);
  const [parseResult, setParseResult] = useState<{
    valid: boolean;
    info?: any;
    error?: string;
    endpoints?: { path: string; methods: string[]; summary?: string }[];
  }>({ valid: true });

  const validateSpec = (val: string) => {
    try {
      const trimmed = val.trim();
      if (!trimmed) {
        setParseResult({ valid: false, error: 'Specification is empty. Paste an OpenAPI or Swagger document.' });
        return;
      }

      let parsed: any;
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        parsed = JSON.parse(val);
      } else {
        parsed = yaml.load(val);
      }

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Specification must be a valid JSON or YAML object.');
      }

      if (!parsed.openapi && !parsed.swagger) {
        throw new Error('Missing root "openapi" (e.g. "3.0.3") or "swagger" (e.g. "2.0") version declaration.');
      }

      const endpoints: { path: string; methods: string[]; summary?: string }[] = [];
      if (parsed.paths && typeof parsed.paths === 'object') {
        for (const [pathStr, pathObj] of Object.entries(parsed.paths)) {
          if (pathObj && typeof pathObj === 'object') {
            const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].filter(
              (m) => m in (pathObj as any)
            );
            const firstMethod = httpMethods[0];
            const summary = firstMethod ? (pathObj as any)[firstMethod]?.summary : undefined;
            endpoints.push({
              path: pathStr,
              methods: httpMethods.map((m) => m.toUpperCase()),
              summary,
            });
          }
        }
      }

      setParseResult({ valid: true, info: parsed, endpoints });
    } catch (e: any) {
      setParseResult({ valid: false, error: e.message || 'Malformed specification syntax.' });
    }
  };

  useEffect(() => {
    validateSpec(specInput);
  }, []);

  const handleReset = () => {
    setSpecInput(SAMPLE_OPENAPI);
    validateSpec(SAMPLE_OPENAPI);
  };

  const handleClear = () => {
    setSpecInput('');
    setParseResult({ valid: false, error: 'Specification is empty.' });
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'POST':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div id="openapi-validator-view" className="space-y-6 animate-fade-in">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleReset}
        resetLabel="Reset to Sample Spec"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Pane */}
        <div
          className="p-5 rounded-2xl border space-y-3 shadow-xs"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              OpenAPI 3.0 / Swagger YAML or JSON Spec
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                Sample
              </button>
              <span className="text-[var(--line)]">|</span>
              <button
                onClick={handleClear}
                className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={specInput}
            onChange={(e) => {
              setSpecInput(e.target.value);
              validateSpec(e.target.value);
            }}
            rows={18}
            className="w-full p-3.5 rounded-xl border font-mono text-xs outline-none focus:border-[var(--brand)] transition-colors leading-relaxed"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="openapi: 3.0.3..."
          />
        </div>

        {/* Validation & Structural Inspection Pane */}
        <div
          className="p-5 rounded-2xl border space-y-4 shadow-xs"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)]">
            Structural Validation &amp; Endpoint Overview
          </h3>

          {parseResult.valid ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-between font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Valid OpenAPI / Swagger Specification</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20">
                  {parseResult.info?.openapi ? `OpenAPI ${parseResult.info.openapi}` : `Swagger ${parseResult.info?.swagger}`}
                </span>
              </div>

              <div
                className="p-4 rounded-xl border space-y-2.5 font-mono"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[var(--muted)]">API Title</span>
                  <span className="font-bold" style={{ color: 'var(--ink)' }}>
                    {parseResult.info?.info?.title || 'Untitled API'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[var(--muted)]">Version</span>
                  <span style={{ color: 'var(--ink)' }}>{parseResult.info?.info?.version || '1.0.0'}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[var(--muted)]">Total Endpoints</span>
                  <span className="font-bold text-[var(--brand)]">
                    {parseResult.endpoints ? parseResult.endpoints.length : 0} paths
                  </span>
                </div>
                {parseResult.info?.servers && parseResult.info.servers.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[var(--muted)] block mb-1">Servers</span>
                    {parseResult.info.servers.map((s: any, idx: number) => (
                      <div key={idx} className="text-[11px] text-[var(--muted)] truncate">
                        • {s.url} {s.description ? `(${s.description})` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Endpoint Explorer */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)]">
                  Discovered API Routes ({parseResult.endpoints?.length || 0})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {parseResult.endpoints && parseResult.endpoints.length > 0 ? (
                    parseResult.endpoints.map((ep, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs"
                        style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex gap-1">
                            {ep.methods.map((m) => (
                              <span
                                key={m}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border font-mono ${getMethodBadgeColor(
                                  m
                                )}`}
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                          <span className="font-mono font-medium truncate" style={{ color: 'var(--ink)' }}>
                            {ep.path}
                          </span>
                        </div>
                        {ep.summary && (
                          <span className="text-[11px] text-[var(--muted)] truncate max-w-[150px] hidden sm:inline">
                            {ep.summary}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--muted)] italic">No paths defined in specification.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-mono flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Validation Error:</span>
                <span className="break-all">{parseResult.error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
