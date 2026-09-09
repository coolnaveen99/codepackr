import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  Trash2,
  Code2,
  FileCode,
  Sparkles,
  Layers,
  FileText,
  Shield,
  Eye,
  Settings2
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface JsonDefinitionViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

type TargetLanguage =
  | 'typescript'
  | 'json-schema'
  | 'python'
  | 'csharp'
  | 'java'
  | 'golang'
  | 'rust'
  | 'sql'
  | 'jsdoc';

const SAMPLES: Record<string, { label: string; json: string; defaultName: string }> = {
  ecommerce: {
    label: 'E-commerce Order',
    defaultName: 'OrderPayload',
    json: JSON.stringify(
      {
        orderId: 'ORD-98421',
        customer: {
          id: 4102,
          name: 'Sarah Connor',
          email: 'sarah.connor@example.com',
          isVerified: true,
          registeredAt: '2026-03-15T08:30:00Z',
        },
        items: [
          {
            sku: 'PROD-T100',
            title: 'Neural Core Processor',
            quantity: 2,
            unitPrice: 499.99,
            tags: ['hardware', 'cybernetics'],
          },
          {
            sku: 'ACC-PWR',
            title: 'Backup Power Cell',
            quantity: 1,
            unitPrice: 89.5,
            tags: ['accessory'],
          },
        ],
        shippingAddress: {
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'OR',
          zipCode: '97477',
          country: 'USA',
        },
        payment: {
          method: 'credit_card',
          lastFour: '4242',
          authorizedAmount: 1089.48,
          currency: 'USD',
          status: 'captured',
        },
        metadata: {
          source: 'web_checkout',
          discountCode: 'WELCOME10',
          notes: null,
        },
      },
      null,
      2
    ),
  },
  userProfile: {
    label: 'User Account',
    defaultName: 'UserProfile',
    json: JSON.stringify(
      {
        userId: 'usr_abc123',
        username: 'dev_alex',
        profile: {
          firstName: 'Alex',
          lastName: 'Morgan',
          bio: 'Full-stack developer and cloud architect.',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          age: 29,
        },
        roles: ['admin', 'developer'],
        settings: {
          darkMode: true,
          emailNotifications: false,
          twoFactorAuth: true,
        },
        lastLogin: '2026-09-06T19:45:00Z',
        activeSubscription: true,
      },
      null,
      2
    ),
  },
  apiResponse: {
    label: 'API Response',
    defaultName: 'ApiResponse',
    json: JSON.stringify(
      {
        status: 200,
        success: true,
        message: 'Records retrieved successfully',
        pagination: {
          currentPage: 1,
          pageSize: 25,
          totalItems: 1420,
          totalPages: 57,
          hasNext: true,
        },
        data: [
          { id: 1, metric: 'CPU Utilization', value: 42.8, status: 'healthy' },
          { id: 2, metric: 'Memory Usage', value: 78.4, status: 'warning' },
          { id: 3, metric: 'Disk I/O', value: 12.1, status: 'healthy' },
        ],
      },
      null,
      2
    ),
  },
  ediRecord: {
    label: 'EDI 850 PO (JSON)',
    defaultName: 'EdiPurchaseOrder',
    json: JSON.stringify(
      {
        transactionType: '850',
        standard: 'X12_004010',
        controlNumber: '000004921',
        senderId: 'ACME-SUPPLY',
        receiverId: 'MEGA-RETAIL',
        purchaseOrderNumber: 'PO-2026-8831',
        orderDate: '2026-09-05',
        currency: 'USD',
        parties: [
          { role: 'BY', name: 'Mega Retail Inc', address: '100 Commerce Way', city: 'Dallas', state: 'TX', zip: '75201' },
          { role: 'ST', name: 'Distribution Center 4', address: '500 Logistics Blvd', city: 'Fort Worth', state: 'TX', zip: '76102' }
        ],
        lineItems: [
          { line: 1, upc: '012345678905', quantity: 500, unitOfMeasure: 'EA', unitPrice: 14.25 },
          { line: 2, upc: '012345678912', quantity: 200, unitOfMeasure: 'CA', unitPrice: 48.00 }
        ],
        totalAmount: 16725.00
      },
      null,
      2
    ),
  },
};

export const JsonDefinitionView: React.FC<JsonDefinitionViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [inputJson, setInputJson] = useState<string>(initialInput || SAMPLES.ecommerce.json);
  const [rootName, setRootName] = useState<string>(SAMPLES.ecommerce.defaultName);
  const [targetLang, setTargetLang] = useState<TargetLanguage>('typescript');
  const [activeTab, setActiveTab] = useState<'code' | 'schemaTree'>('code');
  const [outputCode, setOutputCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [makeOptional, setMakeOptional] = useState<boolean>(false);
  const [parsedObject, setParsedObject] = useState<any>(null);

  // Helper: capitalize string for type names
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const sanitizeIdentifier = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '_');

  // Generator engine
  useEffect(() => {
    if (!inputJson.trim()) {
      setOutputCode('');
      setError(null);
      setParsedObject(null);
      return;
    }

    try {
      const parsed = JSON.parse(inputJson);
      setParsedObject(parsed);
      setError(null);

      const generated = generateDefinition(parsed, rootName || 'Root', targetLang, makeOptional);
      setOutputCode(generated);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON syntax');
      setOutputCode('');
      setParsedObject(null);
    }
  }, [inputJson, rootName, targetLang, makeOptional]);

  const loadSample = (key: keyof typeof SAMPLES) => {
    const sample = SAMPLES[key];
    setInputJson(sample.json);
    setRootName(sample.defaultName);
  };

  const handlePrettify = () => {
    try {
      const obj = JSON.parse(inputJson);
      setInputJson(JSON.stringify(obj, null, 2));
      setError(null);
    } catch (e: any) {
      setError('Cannot prettify invalid JSON: ' + e.message);
    }
  };

  const handleMinify = () => {
    try {
      const obj = JSON.parse(inputJson);
      setInputJson(JSON.stringify(obj));
      setError(null);
    } catch (e: any) {
      setError('Cannot minify invalid JSON: ' + e.message);
    }
  };

  const handleCopy = () => {
    if (!outputCode) return;
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputCode) return;
    const extensions: Record<TargetLanguage, string> = {
      typescript: 'ts',
      'json-schema': 'json',
      python: 'py',
      csharp: 'cs',
      java: 'java',
      golang: 'go',
      rust: 'rs',
      sql: 'sql',
      jsdoc: 'js',
    };
    const ext = extensions[targetLang] || 'txt';
    const filename = `${(rootName || 'schema').toLowerCase()}.${ext}`;
    const blob = new Blob([outputCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearWorkspace = () => {
    setInputJson('');
    setRootName('Root');
    setOutputCode('');
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleClearWorkspace}
        resetLabel="Clear Workspace"
      />

      {/* Main Grid: Input JSON on Left, Generated Definition on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: JSON Input Panel */}
        <div
          className="p-5 rounded-2xl border flex flex-col space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          {/* Header & Sample Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[var(--brand)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                Input JSON Data
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[var(--muted)] mr-1 hidden sm:inline">Samples:</span>
              {Object.entries(SAMPLES).map(([key, sample]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => loadSample(key)}
                  className="text-[11px] px-2 py-0.5 rounded-md border hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-[var(--ink)]"
                  style={{ borderColor: 'var(--line)' }}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Root Identifier and Formatting Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                ROOT TYPE / CLASS NAME
              </label>
              <input
                type="text"
                value={rootName}
                onChange={(e) => setRootName(e.target.value)}
                placeholder="e.g. OrderPayload"
                className="w-full px-3 py-1.5 rounded-xl border text-xs font-mono font-bold outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
            </div>
            <div className="flex items-end justify-start sm:justify-end gap-1.5 pt-4 sm:pt-0">
              <button
                type="button"
                onClick={handlePrettify}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-[var(--ink)] flex items-center gap-1"
                style={{ borderColor: 'var(--line)' }}
                title="Format & Prettify JSON"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>Prettify</span>
              </button>
              <button
                type="button"
                onClick={handleMinify}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-[var(--ink)]"
                style={{ borderColor: 'var(--line)' }}
                title="Minify JSON"
              >
                Minify
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputJson('');
                  setOutputCode('');
                }}
                className="p-1.5 rounded-lg border text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
                title="Clear Input"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* JSON Textarea */}
          <div className="relative flex-1 min-h-[360px]">
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder="Paste raw JSON object or array here..."
              className="w-full h-full min-h-[360px] p-3.5 rounded-xl border font-mono text-xs outline-none resize-y"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: error ? '#f43f5e' : 'var(--line)',
                color: 'var(--ink)',
              }}
              spellCheck={false}
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
              <strong>Parse Error:</strong> {error}
            </div>
          )}

          {/* Privacy badge */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] pt-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Client-Side Generator. Your data never leaves your browser.</span>
          </div>
        </div>

        {/* Right Column: Output Definition Panel */}
        <div
          className="p-5 rounded-2xl border flex flex-col space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          {/* Target Language Selector Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'typescript', label: 'TypeScript' },
                { id: 'json-schema', label: 'JSON Schema' },
                { id: 'python', label: 'Python (Pydantic)' },
                { id: 'csharp', label: 'C# POCO' },
                { id: 'java', label: 'Java POJO' },
                { id: 'golang', label: 'Go Struct' },
                { id: 'rust', label: 'Rust Serde' },
                { id: 'sql', label: 'SQL Table' },
                { id: 'jsdoc', label: 'JSDoc' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setTargetLang(lang.id as TargetLanguage)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    targetLang === lang.id
                      ? 'bg-[var(--brand)] text-white shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'code' ? 'schemaTree' : 'code')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-[var(--ink)]"
                style={{ borderColor: 'var(--line)' }}
                title="Switch between Code definition and Visual Tree View"
              >
                {activeTab === 'code' ? <Eye className="w-3.5 h-3.5 text-[var(--brand)]" /> : <FileCode className="w-3.5 h-3.5 text-[var(--brand)]" />}
                <span>{activeTab === 'code' ? 'Visual Tree' : 'View Code'}</span>
              </button>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-2.5 rounded-xl bg-[var(--surface-2)] border" style={{ borderColor: 'var(--line)' }}>
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={makeOptional}
                onChange={(e) => setMakeOptional(e.target.checked)}
                className="w-3.5 h-3.5 accent-[var(--brand)] rounded"
              />
              <span className="text-[var(--ink)] font-medium">Mark all fields optional (?)</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputCode}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputCode}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg border hover:bg-[var(--surface)] transition-colors cursor-pointer text-[var(--ink)] disabled:opacity-50"
                style={{ borderColor: 'var(--line)' }}
              >
                <Download className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Display Output Code or Visual Tree */}
          <div className="relative flex-1 min-h-[360px]">
            {activeTab === 'code' ? (
              <pre
                className="w-full h-full min-h-[360px] p-4 rounded-xl border font-mono text-xs overflow-auto whitespace-pre selection:bg-[var(--brand)] selection:text-white"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                }}
              >
                {outputCode || '// Generated definition will appear here'}
              </pre>
            ) : (
              <div
                className="w-full h-full min-h-[360px] p-4 rounded-xl border overflow-auto"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-[var(--brand)] flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Interactive Schema Visualizer</span>
                </h4>
                {parsedObject ? (
                  <SchemaTreeVisualizer data={parsedObject} name={rootName || 'Root'} isOptional={makeOptional} />
                ) : (
                  <p className="text-xs text-[var(--muted)]">Please provide valid JSON to inspect schema hierarchy.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   Visual Tree Component
   ========================================================================= */
const SchemaTreeVisualizer: React.FC<{ data: any; name: string; isOptional: boolean; depth?: number }> = ({
  data,
  name,
  isOptional,
  depth = 0,
}) => {
  const getTypeBadge = (val: any) => {
    if (val === null) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-500 font-mono">null</span>;
    if (Array.isArray(val)) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-mono">array[{val.length}]</span>;
    if (typeof val === 'object') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono">object</span>;
    if (typeof val === 'number') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">number</span>;
    if (typeof val === 'boolean') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono">boolean</span>;
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono">string</span>;
  };

  if (typeof data !== 'object' || data === null) {
    return (
      <div className="flex items-center gap-2 py-1 text-xs">
        <span className="font-mono font-bold text-[var(--ink)]">{name}:</span>
        {getTypeBadge(data)}
        <span className="text-[11px] font-mono text-[var(--muted)] truncate">"{String(data)}"</span>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${depth > 0 ? 'pl-4 border-l border-[var(--line)] my-1' : ''}`}>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono font-bold text-[var(--brand)]">{name}</span>
        {getTypeBadge(data)}
      </div>
      {Array.isArray(data) ? (
        data.length > 0 ? (
          <SchemaTreeVisualizer data={data[0]} name="[0]" isOptional={isOptional} depth={depth + 1} />
        ) : (
          <div className="text-[11px] text-[var(--muted)] italic pl-4">empty array</div>
        )
      ) : (
        Object.entries(data).map(([key, val]) => (
          <div key={key} className="py-0.5">
            {typeof val === 'object' && val !== null ? (
              <SchemaTreeVisualizer data={val} name={key} isOptional={isOptional} depth={depth + 1} />
            ) : (
              <div className="flex items-center gap-2 text-xs pl-4 border-l border-[var(--line)]">
                <span className="font-mono text-[var(--ink)] font-semibold">{key}{isOptional ? '?' : ''}:</span>
                {getTypeBadge(val)}
                <span className="text-[11px] font-mono text-[var(--muted)] truncate max-w-[200px]">
                  {val === null ? 'null' : String(val)}
                </span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

/* =========================================================================
   Comprehensive Generator Functions for All Target Languages
   ========================================================================= */

function generateDefinition(
  data: any,
  rootName: string,
  targetLang: TargetLanguage,
  isOptional: boolean
): string {
  switch (targetLang) {
    case 'typescript':
      return generateTypeScript(data, rootName, isOptional);
    case 'json-schema':
      return generateJsonSchema(data, rootName);
    case 'python':
      return generatePythonPydantic(data, rootName, isOptional);
    case 'csharp':
      return generateCSharp(data, rootName, isOptional);
    case 'java':
      return generateJava(data, rootName);
    case 'golang':
      return generateGolang(data, rootName);
    case 'rust':
      return generateRust(data, rootName);
    case 'sql':
      return generateSQL(data, rootName);
    case 'jsdoc':
      return generateJSDoc(data, rootName);
    default:
      return '';
  }
}

/* 1. TypeScript Generator (Interfaces & Types with Nested Detection) */
function generateTypeScript(data: any, rootName: string, isOptional: boolean): string {
  const interfaces: { name: string; body: string }[] = [];
  const optSuffix = isOptional ? '?' : '';

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function getType(val: any, propName: string): string {
    if (val === null) return 'any | null';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'any[]';
      const first = val[0];
      if (typeof first === 'object' && first !== null) {
        const nestedName = capitalize(propName.endsWith('s') ? propName.slice(0, -1) : propName + 'Item');
        buildInterface(first, nestedName);
        return `${nestedName}[]`;
      }
      return `${typeof first}[]`;
    }
    if (typeof val === 'object') {
      const nestedName = capitalize(propName);
      buildInterface(val, nestedName);
      return nestedName;
    }
    return typeof val;
  }

  function buildInterface(obj: any, name: string) {
    if (interfaces.some((i) => i.name === name)) return;
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return;

    const lines: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const t = getType(v, k);
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
      lines.push(`  ${safeKey}${optSuffix}: ${t};`);
    }
    interfaces.push({
      name,
      body: `export interface ${name} {\n${lines.join('\n')}\n}`,
    });
  }

  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      buildInterface(data[0], rootName);
      return `${interfaces.map((i) => i.body).reverse().join('\n\n')}\n\nexport type ${rootName}List = ${rootName}[];`;
    }
    return `export type ${rootName} = any[];`;
  }

  buildInterface(data, rootName);
  return interfaces.map((i) => i.body).reverse().join('\n\n');
}

/* 2. JSON Schema (Draft 2020-12) */
function generateJsonSchema(data: any, rootName: string): string {
  function buildNode(val: any): any {
    if (val === null) return { type: 'null' };
    if (Array.isArray(val)) {
      return {
        type: 'array',
        items: val.length > 0 ? buildNode(val[0]) : {},
      };
    }
    if (typeof val === 'object') {
      const properties: Record<string, any> = {};
      const required: string[] = [];
      for (const [k, v] of Object.entries(val)) {
        properties[k] = buildNode(v);
        required.push(k);
      }
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }
    if (typeof val === 'number') {
      return { type: Number.isInteger(val) ? 'integer' : 'number' };
    }
    if (typeof val === 'boolean') return { type: 'boolean' };
    return { type: 'string' };
  }

  const rootSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: rootName,
    ...buildNode(data),
  };

  return JSON.stringify(rootSchema, null, 2);
}

/* 3. Python Pydantic Models */
function generatePythonPydantic(data: any, rootName: string, isOptional: boolean): string {
  const classes: { name: string; body: string }[] = [];

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function getType(val: any, propName: string): string {
    if (val === null) return 'Optional[Any] = None';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'List[Any]';
      const first = val[0];
      if (typeof first === 'object' && first !== null) {
        const nestedName = capitalize(propName.endsWith('s') ? propName.slice(0, -1) : propName + 'Item');
        buildClass(first, nestedName);
        return `List[${nestedName}]`;
      }
      const pyPrimitives: Record<string, string> = {
        string: 'str',
        number: Number.isInteger(first) ? 'int' : 'float',
        boolean: 'bool',
      };
      return `List[${pyPrimitives[typeof first] || 'Any'}]`;
    }
    if (typeof val === 'object') {
      const nestedName = capitalize(propName);
      buildClass(val, nestedName);
      return nestedName;
    }
    if (typeof val === 'string') return 'str';
    if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float';
    if (typeof val === 'boolean') return 'bool';
    return 'Any';
  }

  function buildClass(obj: any, name: string) {
    if (classes.some((c) => c.name === name)) return;
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return;

    const fields: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const t = getType(v, k);
      const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : `_${k}`;
      if (isOptional && !t.includes('=')) {
        fields.push(`    ${safeKey}: Optional[${t}] = None`);
      } else {
        fields.push(`    ${safeKey}: ${t}`);
      }
    }

    classes.push({
      name,
      body: `class ${name}(BaseModel):\n${fields.length > 0 ? fields.join('\n') : '    pass'}`,
    });
  }

  buildClass(Array.isArray(data) ? data[0] || {} : data, rootName);

  return `from typing import List, Optional, Any\nfrom pydantic import BaseModel\n\n` +
    classes.map((c) => c.body).reverse().join('\n\n');
}

/* 4. C# POCO Classes */
function generateCSharp(data: any, rootName: string, isOptional: boolean): string {
  const classes: { name: string; body: string }[] = [];

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function getType(val: any, propName: string): string {
    if (val === null) return 'object?';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'List<object>';
      const first = val[0];
      if (typeof first === 'object' && first !== null) {
        const nestedName = capitalize(propName.endsWith('s') ? propName.slice(0, -1) : propName + 'Item');
        buildClass(first, nestedName);
        return `List<${nestedName}>`;
      }
      if (typeof first === 'number') return Number.isInteger(first) ? 'List<int>' : 'List<double>';
      if (typeof first === 'boolean') return 'List<bool>';
      return 'List<string>';
    }
    if (typeof val === 'object') {
      const nestedName = capitalize(propName);
      buildClass(val, nestedName);
      return nestedName;
    }
    if (typeof val === 'string') return isOptional ? 'string?' : 'string';
    if (typeof val === 'number') return Number.isInteger(val) ? (isOptional ? 'int?' : 'int') : (isOptional ? 'double?' : 'double');
    if (typeof val === 'boolean') return isOptional ? 'bool?' : 'bool';
    return 'object?';
  }

  function buildClass(obj: any, name: string) {
    if (classes.some((c) => c.name === name)) return;
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return;

    const props: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const propType = getType(v, k);
      const pascalName = capitalize(k);
      props.push(`    [JsonPropertyName("${k}")]\n    public ${propType} ${pascalName} { get; set; }`);
    }

    classes.push({
      name,
      body: `public class ${name}\n{\n${props.join('\n\n')}\n}`,
    });
  }

  buildClass(Array.isArray(data) ? data[0] || {} : data, rootName);

  return `using System;\nusing System.Collections.Generic;\nusing System.Text.Json.Serialization;\n\nnamespace Codepackr.Models\n{\n` +
    classes.map((c) => c.body).reverse().join('\n\n') +
    `\n}`;
}

/* 5. Java POJO with Jackson Annotations */
function generateJava(data: any, rootName: string): string {
  const classes: { name: string; body: string }[] = [];

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function getType(val: any, propName: string): string {
    if (val === null) return 'Object';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'List<Object>';
      const first = val[0];
      if (typeof first === 'object' && first !== null) {
        const nestedName = capitalize(propName.endsWith('s') ? propName.slice(0, -1) : propName + 'Item');
        buildClass(first, nestedName);
        return `List<${nestedName}>`;
      }
      if (typeof first === 'number') return Number.isInteger(first) ? 'List<Integer>' : 'List<Double>';
      if (typeof first === 'boolean') return 'List<Boolean>';
      return 'List<String>';
    }
    if (typeof val === 'object') {
      const nestedName = capitalize(propName);
      buildClass(val, nestedName);
      return nestedName;
    }
    if (typeof val === 'string') return 'String';
    if (typeof val === 'number') return Number.isInteger(val) ? 'Integer' : 'Double';
    if (typeof val === 'boolean') return 'Boolean';
    return 'Object';
  }

  function buildClass(obj: any, name: string) {
    if (classes.some((c) => c.name === name)) return;
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return;

    const fields: string[] = [];
    const methods: string[] = [];

    for (const [k, v] of Object.entries(obj)) {
      const t = getType(v, k);
      const cap = capitalize(k);
      fields.push(`    @JsonProperty("${k}")\n    private ${t} ${k};`);
      methods.push(
        `    public ${t} get${cap}() { return ${k}; }\n    public void set${cap}(${t} ${k}) { this.${k} = ${k}; }`
      );
    }

    classes.push({
      name,
      body: `public class ${name} {\n${fields.join('\n\n')}\n\n${methods.join('\n\n')}\n}`,
    });
  }

  buildClass(Array.isArray(data) ? data[0] || {} : data, rootName);

  return `import com.fasterxml.jackson.annotation.JsonProperty;\nimport java.util.List;\n\n` +
    classes.map((c) => c.body).reverse().join('\n\n');
}

/* 6. Golang Struct Generator */
function generateGolang(data: any, rootName: string): string {
  const structs: { name: string; body: string }[] = [];

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function getType(val: any, propName: string): string {
    if (val === null) return 'interface{}';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]interface{}';
      const first = val[0];
      if (typeof first === 'object' && first !== null) {
        const nestedName = capitalize(propName.endsWith('s') ? propName.slice(0, -1) : propName + 'Item');
        buildStruct(first, nestedName);
        return `[]${nestedName}`;
      }
      if (typeof first === 'number') return Number.isInteger(first) ? '[]int' : '[]float64';
      if (typeof first === 'boolean') return '[]bool';
      return '[]string';
    }
    if (typeof val === 'object') {
      const nestedName = capitalize(propName);
      buildStruct(val, nestedName);
      return nestedName;
    }
    if (typeof val === 'string') return 'string';
    if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float64';
    if (typeof val === 'boolean') return 'bool';
    return 'interface{}';
  }

  function buildStruct(obj: any, name: string) {
    if (structs.some((s) => s.name === name)) return;
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return;

    const fields: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const t = getType(v, k);
      const pascal = capitalize(k);
      fields.push(`\t${pascal} ${t} \`json:"${k}"\``);
    }

    structs.push({
      name,
      body: `type ${name} struct {\n${fields.join('\n')}\n}`,
    });
  }

  buildStruct(Array.isArray(data) ? data[0] || {} : data, rootName);

  return `package models\n\n` + structs.map((s) => s.body).reverse().join('\n\n');
}

/* 7. Rust Serde Structs */
function generateRust(data: any, rootName: string): string {
  const structs: { name: string; body: string }[] = [];

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function getType(val: any, propName: string): string {
    if (val === null) return 'Option<serde_json::Value>';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'Vec<serde_json::Value>';
      const first = val[0];
      if (typeof first === 'object' && first !== null) {
        const nestedName = capitalize(propName.endsWith('s') ? propName.slice(0, -1) : propName + 'Item');
        buildStruct(first, nestedName);
        return `Vec<${nestedName}>`;
      }
      if (typeof first === 'number') return Number.isInteger(first) ? 'Vec<i64>' : 'Vec<f64>';
      if (typeof first === 'boolean') return 'Vec<bool>';
      return 'Vec<String>';
    }
    if (typeof val === 'object') {
      const nestedName = capitalize(propName);
      buildStruct(val, nestedName);
      return nestedName;
    }
    if (typeof val === 'string') return 'String';
    if (typeof val === 'number') return Number.isInteger(val) ? 'i64' : 'f64';
    if (typeof val === 'boolean') return 'bool';
    return 'serde_json::Value';
  }

  function buildStruct(obj: any, name: string) {
    if (structs.some((s) => s.name === name)) return;
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return;

    const fields: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const t = getType(v, k);
      const snake = k.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
      fields.push(`    #[serde(rename = "${k}")]\n    pub ${snake}: ${t},`);
    }

    structs.push({
      name,
      body: `#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]\npub struct ${name} {\n${fields.join('\n')}\n}`,
    });
  }

  buildStruct(Array.isArray(data) ? data[0] || {} : data, rootName);

  return `use serde::{Serialize, Deserialize};\n\n` + structs.map((s) => s.body).reverse().join('\n\n');
}

/* 8. SQL DDL CREATE TABLE */
function generateSQL(data: any, rootName: string): string {
  const targetObj = Array.isArray(data) ? data[0] || {} : data;
  if (typeof targetObj !== 'object' || targetObj === null) {
    return `-- Cannot generate SQL table for non-object JSON`;
  }

  const tableName = rootName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const columns: string[] = ['  id SERIAL PRIMARY KEY'];

  for (const [k, v] of Object.entries(targetObj)) {
    const colName = k.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    let sqlType = 'VARCHAR(255)';

    if (typeof v === 'number') {
      sqlType = Number.isInteger(v) ? 'INTEGER' : 'NUMERIC(12, 2)';
    } else if (typeof v === 'boolean') {
      sqlType = 'BOOLEAN';
    } else if (typeof v === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
        sqlType = 'TIMESTAMP WITH TIME ZONE';
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        sqlType = 'DATE';
      } else if (v.length > 255) {
        sqlType = 'TEXT';
      }
    } else if (typeof v === 'object' && v !== null) {
      sqlType = 'JSONB';
    }

    columns.push(`  ${colName} ${sqlType}`);
  }

  return `-- PostgreSQL / Standard SQL DDL\nCREATE TABLE ${tableName} (\n${columns.join(',\n')}\n);`;
}

/* 9. JSDoc Type Definition */
function generateJSDoc(data: any, rootName: string): string {
  const targetObj = Array.isArray(data) ? data[0] || {} : data;
  if (typeof targetObj !== 'object' || targetObj === null) return '/** @typedef {*} */';

  const props: string[] = [];
  for (const [k, v] of Object.entries(targetObj)) {
    let t: string = typeof v;
    if (v === null) t = '*';
    else if (Array.isArray(v)) t = 'Array<*>';
    else if (t === 'object') t = 'Object';
    props.push(` * @property {${t}} [${k}]`);
  }

  return `/**\n * @typedef {Object} ${rootName}\n${props.join('\n')}\n */`;
}
