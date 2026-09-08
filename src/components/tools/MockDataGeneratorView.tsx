import React, { useState, useTransition } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Database,
  FileSpreadsheet,
  FileCode2,
  Layers,
  Clock,
  ArrowDown,
  ArrowUp,
  Cpu,
  RefreshCw,
  Table2,
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { CodeEditor, SupportedLanguage } from '../CodeEditor';
import { executeAsyncTransform } from '../../lib/workerBridge';

export type MockFieldType =
  | 'uuid'
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'ipAddress'
  | 'date'
  | 'boolean'
  | 'integer'
  | 'float'
  | 'phone'
  | 'company'
  | 'country'
  | 'city'
  | 'randomString';

export interface MockField {
  id: string;
  name: string;
  type: MockFieldType;
}

export type ExportFormat = 'json' | 'csv' | 'sql';

interface MockDataGeneratorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const FIELD_TYPE_OPTIONS: { value: MockFieldType; label: string; category: string }[] = [
  { value: 'uuid', label: 'UUID v4', category: 'Identifiers' },
  { value: 'integer', label: 'Integer (e.g. 10 - 9999)', category: 'Identifiers' },
  { value: 'randomString', label: 'Random Hash / Alpha (8 chars)', category: 'Identifiers' },
  { value: 'firstName', label: 'First Name', category: 'Personal' },
  { value: 'lastName', label: 'Last Name', category: 'Personal' },
  { value: 'fullName', label: 'Full Name', category: 'Personal' },
  { value: 'email', label: 'Email Address', category: 'Personal' },
  { value: 'phone', label: 'Phone Number', category: 'Personal' },
  { value: 'company', label: 'Company Name', category: 'Commerce' },
  { value: 'country', label: 'Country', category: 'Location' },
  { value: 'city', label: 'City', category: 'Location' },
  { value: 'ipAddress', label: 'IPv4 Address', category: 'Network' },
  { value: 'date', label: 'ISO 8601 Date', category: 'Temporal' },
  { value: 'boolean', label: 'Boolean (true/false)', category: 'Primitives' },
  { value: 'float', label: 'Float / Price (e.g. 19.99)', category: 'Commerce' },
];

const PRESET_SCHEMAS: { name: string; description: string; fields: { name: string; type: MockFieldType }[] }[] = [
  {
    name: 'User Accounts',
    description: 'ID, full name, email, IP, and registration date',
    fields: [
      { name: 'id', type: 'uuid' },
      { name: 'firstName', type: 'firstName' },
      { name: 'lastName', type: 'lastName' },
      { name: 'email', type: 'email' },
      { name: 'ip_address', type: 'ipAddress' },
      { name: 'created_at', type: 'date' },
      { name: 'is_active', type: 'boolean' },
    ],
  },
  {
    name: 'E-Commerce Customers',
    description: 'Customer contact, location, and purchase orders',
    fields: [
      { name: 'customer_id', type: 'integer' },
      { name: 'name', type: 'fullName' },
      { name: 'company', type: 'company' },
      { name: 'email', type: 'email' },
      { name: 'phone', type: 'phone' },
      { name: 'country', type: 'country' },
      { name: 'city', type: 'city' },
      { name: 'total_spent', type: 'float' },
    ],
  },
  {
    name: 'API Security Logs',
    description: 'Server access logs with IP, session tokens, and dates',
    fields: [
      { name: 'session_id', type: 'randomString' },
      { name: 'user_id', type: 'uuid' },
      { name: 'ip_address', type: 'ipAddress' },
      { name: 'timestamp', type: 'date' },
      { name: 'status_code', type: 'integer' },
      { name: 'authenticated', type: 'boolean' },
    ],
  },
];

// Lightweight, deterministic, zero-dependency mock generation engine
export function generateMockDataset(
  fields: { name: string; type: MockFieldType }[],
  rowCount: number,
  format: ExportFormat,
  tableName: string = 'mock_records'
): string {
  const FIRST_NAMES = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia', 'Jackson', 'Ava', 'Aiden', 'Isabella', 'Lucas',
    'Mia', 'Ethan', 'Harper', 'Oliver', 'Evelyn', 'Mason', 'Abigail', 'Elijah', 'Emily', 'Logan',
    'Charlotte', 'James', 'Amelia', 'Benjamin', 'Ella', 'Alexander', 'Chloe', 'Henry', 'Grace', 'Jacob',
    'Scarlett', 'Sebastian', 'Victoria', 'Jack', 'Aria', 'Daniel', 'Lily', 'Matthew', 'Zoey', 'Samuel'
  ];

  const LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
  ];

  const DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'company.io', 'enterprise.net', 'cloudcorp.org', 'techmail.dev'];

  const COMPANIES = [
    'Apex Technologies', 'Nexus Logic Corp', 'Acme Global', 'Vanguard Systems', 'Stratosphere AI',
    'Cyberdyne Solutions', 'Pinnacle Analytics', 'Horizon Logistics', 'Quantum Dynamics', 'OmniCorp Global'
  ];

  const COUNTRIES = [
    'United States', 'United Kingdom', 'Germany', 'Canada', 'Australia',
    'France', 'Japan', 'Singapore', 'Netherlands', 'Sweden', 'India', 'Brazil'
  ];

  const CITIES = [
    'New York', 'London', 'San Francisco', 'Berlin', 'Toronto', 'Tokyo',
    'Sydney', 'Amsterdam', 'Paris', 'Singapore', 'Austin', 'Stockholm'
  ];

  const sanitizeStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const rows: Record<string, any>[] = [];
  const startTimestamp = Date.now() - 365 * 24 * 3600 * 1000; // 1 year ago

  for (let i = 0; i < rowCount; i++) {
    const record: Record<string, any> = {};
    const fName = FIRST_NAMES[(i * 7 + 13) % FIRST_NAMES.length];
    const lName = LAST_NAMES[(i * 11 + 29) % LAST_NAMES.length];

    for (let f = 0; f < fields.length; f++) {
      const field = fields[f];
      const colName = field.name.trim() || `field_${f + 1}`;

      switch (field.type) {
        case 'uuid': {
          // Fast RFC4122 v4 UUID without regex overhead
          const hex = '0123456789abcdef';
          let u = '';
          for (let k = 0; k < 36; k++) {
            if (k === 8 || k === 13 || k === 18 || k === 23) {
              u += '-';
            } else if (k === 14) {
              u += '4';
            } else if (k === 19) {
              u += hex[(Math.floor(Math.random() * 4) + 8)];
            } else {
              u += hex[Math.floor(Math.random() * 16)];
            }
          }
          record[colName] = u;
          break;
        }
        case 'firstName':
          record[colName] = fName;
          break;
        case 'lastName':
          record[colName] = lName;
          break;
        case 'fullName':
          record[colName] = `${fName} ${lName}`;
          break;
        case 'email': {
          const domain = DOMAINS[(i * 3 + f) % DOMAINS.length];
          record[colName] = `${sanitizeStr(fName)}.${sanitizeStr(lName)}${i > 0 ? (i % 99) + 1 : ''}@${domain}`;
          break;
        }
        case 'ipAddress': {
          const o1 = 10 + (i % 200);
          const o2 = (i * 17) % 254 + 1;
          const o3 = (i * 31) % 254 + 1;
          const o4 = (i * 47) % 254 + 1;
          record[colName] = `${o1}.${o2}.${o3}.${o4}`;
          break;
        }
        case 'date': {
          const delta = (i * 86400000 * 3.7) % (365 * 86400000);
          record[colName] = new Date(startTimestamp + delta).toISOString();
          break;
        }
        case 'boolean':
          record[colName] = (i + f) % 2 === 0;
          break;
        case 'integer':
          record[colName] = 1000 + ((i * 37 + f * 101) % 9000);
          break;
        case 'float': {
          const val = 10 + ((i * 19.33 + f * 4.7) % 990);
          record[colName] = parseFloat(val.toFixed(2));
          break;
        }
        case 'phone': {
          const area = 200 + (i % 799);
          const mid = 100 + ((i * 7) % 899);
          const last = 1000 + ((i * 13) % 8999);
          record[colName] = `+1 (${area}) ${mid}-${last}`;
          break;
        }
        case 'company':
          record[colName] = COMPANIES[(i + f) % COMPANIES.length];
          break;
        case 'country':
          record[colName] = COUNTRIES[(i * 2 + f) % COUNTRIES.length];
          break;
        case 'city':
          record[colName] = CITIES[(i * 3 + f) % CITIES.length];
          break;
        case 'randomString': {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let str = '';
          for (let c = 0; c < 8; c++) {
            str += chars[(i * 11 + c * 7 + f) % chars.length];
          }
          record[colName] = str;
          break;
        }
        default:
          record[colName] = `Value_${i + 1}`;
          break;
      }
    }
    rows.push(record);
  }

  // Format conversion
  if (format === 'json') {
    return JSON.stringify(rows, null, 2);
  }

  if (format === 'csv') {
    const headers = fields.map((f, idx) => f.name.trim() || `field_${idx + 1}`);
    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCsv).join(',');
    const bodyLines = rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(','));
    return [headerLine, ...bodyLines].join('\n');
  }

  if (format === 'sql') {
    const validTable = tableName.trim().replace(/[^a-zA-Z0-9_]/g, '') || 'mock_records';
    const columns = fields.map((f, idx) => (f.name.trim() || `field_${idx + 1}`).replace(/[^a-zA-Z0-9_]/g, ''));
    const colList = columns.map((c) => `\`${c}\``).join(', ');

    const escapeSql = (val: any): string => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      return `'${String(val).replace(/'/g, "''")}'`;
    };

    const statements: string[] = [];
    statements.push(`-- Generated ${rows.length} rows for table: ${validTable}`);
    statements.push(`-- Codepackr Advanced Mock Data Generator\n`);

    // Group inserts into chunks of 100 for optimal SQL performance
    const chunkSize = 100;
    for (let c = 0; c < rows.length; c += chunkSize) {
      const chunk = rows.slice(c, c + chunkSize);
      const valuesList = chunk.map((r) => `  (${columns.map((col, idx) => escapeSql(r[fields[idx].name.trim() || `field_${idx + 1}`])).join(', ')})`);
      statements.push(`INSERT INTO \`${validTable}\` (${colList})\nVALUES\n${valuesList.join(',\n')};`);
    }

    return statements.join('\n\n');
  }

  return '';
}

export const MockDataGeneratorView: React.FC<MockDataGeneratorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  const [fields, setFields] = useState<MockField[]>([
    { id: '1', name: 'id', type: 'uuid' },
    { id: '2', name: 'first_name', type: 'firstName' },
    { id: '3', name: 'last_name', type: 'lastName' },
    { id: '4', name: 'email', type: 'email' },
    { id: '5', name: 'ip_address', type: 'ipAddress' },
    { id: '6', name: 'created_at', type: 'date' },
    { id: '7', name: 'is_active', type: 'boolean' },
  ]);

  const [rowCount, setRowCount] = useState<number>(25);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [tableName, setTableName] = useState<string>('users');
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [execDurationMs, setExecDurationMs] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // Initial trigger
  React.useEffect(() => {
    handleGenerate(fields, rowCount, exportFormat, tableName);
  }, []);

  const handleAddField = () => {
    const nextNum = fields.length + 1;
    const newField: MockField = {
      id: Math.random().toString(36).substring(2, 9),
      name: `field_${nextNum}`,
      type: 'randomString',
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleUpdateField = (id: string, updates: Partial<MockField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;
    const newFields = [...fields];
    const [moved] = newFields.splice(index, 1);
    newFields.splice(targetIdx, 0, moved);
    setFields(newFields);
  };

  const handleApplyPreset = (preset: typeof PRESET_SCHEMAS[0]) => {
    const newFields: MockField[] = preset.fields.map((f, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: f.name,
      type: f.type,
    }));
    setFields(newFields);
    handleGenerate(newFields, rowCount, exportFormat, tableName);
  };

  const handleGenerate = async (
    activeFields = fields,
    count = rowCount,
    format = exportFormat,
    tbl = tableName
  ) => {
    setIsGenerating(true);

    const safeFields = activeFields.map((f) => ({ name: f.name, type: f.type }));
    const safeCount = Math.max(1, Math.min(10000, Number(count) || 10));

    const res = await executeAsyncTransform(
      generateMockDataset,
      {
        args: [safeFields, safeCount, format, tbl],
        timeoutMs: 30000,
      }
    );

    setIsGenerating(false);
    setExecDurationMs(res.durationMs);

    if (res.success && res.data) {
      startTransition(() => {
        setGeneratedOutput(res.data!);
      });
    }
  };

  const handleCopy = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedOutput) return;
    const ext = exportFormat === 'json' ? 'json' : exportFormat === 'csv' ? 'csv' : 'sql';
    const mime =
      exportFormat === 'json'
        ? 'application/json'
        : exportFormat === 'csv'
        ? 'text/csv'
        : 'application/sql';

    const blob = new Blob([generatedOutput], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableName || 'mock_data'}_${rowCount}_rows.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const editorLanguage: SupportedLanguage =
    exportFormat === 'json' ? 'json' : exportFormat === 'sql' ? 'sql' : 'text';

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Preset Quick Selectors */}
      <div
        className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-[color:var(--brand)] shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-muted)]">
              Enterprise Schema Presets
            </div>
            <div className="text-xs text-[color:var(--ink-muted)]">
              Instantly bootstrap realistic schemas for APIs, databases, and analytics
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_SCHEMAS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Schema Builder & Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className="p-5 rounded-2xl border shadow-sm space-y-5"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-[color:var(--brand)]" />
                <h2 className="text-sm font-bold text-[color:var(--ink)]">Schema Fields ({fields.length})</h2>
              </div>
              <button
                onClick={handleAddField}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[color:var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            </div>

            {/* Field Rows */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 p-2.5 rounded-xl border group transition-colors"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <div className="flex flex-col items-center gap-0.5 text-[color:var(--ink-muted)]">
                    <button
                      onClick={() => handleMoveField(idx, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 hover:text-[color:var(--ink)] disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveField(idx, 'down')}
                      disabled={idx === fields.length - 1}
                      className="p-0.5 hover:text-[color:var(--ink)] disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                      placeholder="field_name"
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border outline-none font-medium text-[color:var(--ink)]"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                    />
                  </div>

                  <div className="w-40 shrink-0">
                    <select
                      value={field.type}
                      onChange={(e) => handleUpdateField(field.id, { type: e.target.value as MockFieldType })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none font-medium text-[color:var(--ink)] cursor-pointer"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                    >
                      {FIELD_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleRemoveField(field.id)}
                    disabled={fields.length <= 1}
                    className="p-1.5 rounded-lg text-[color:var(--ink-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-20 cursor-pointer shrink-0"
                    title="Remove Field"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Generation Parameters */}
            <div className="pt-3 border-t space-y-4" style={{ borderColor: 'var(--line)' }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                    ROW COUNT (MAX 10,000)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={rowCount}
                    onChange={(e) => setRowCount(Math.max(1, Math.min(10000, Number(e.target.value))))}
                    className="w-full p-2.5 rounded-xl border text-sm font-mono font-medium outline-none"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                    EXPORT FORMAT
                  </label>
                  <div
                    className="flex rounded-xl border p-1"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                  >
                    {(['json', 'csv', 'sql'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
                          exportFormat === fmt
                            ? 'bg-[color:var(--brand)] text-white shadow-xs'
                            : 'text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {exportFormat === 'sql' && (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                    SQL TABLE NAME
                  </label>
                  <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="mock_records"
                    className="w-full p-2.5 rounded-xl border text-sm font-mono font-medium outline-none"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                  />
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="w-full py-3 rounded-xl font-bold text-sm bg-[color:var(--brand)] text-white hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating {rowCount.toLocaleString()} Rows...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Generate {rowCount.toLocaleString()} Rows</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Code Output & Download (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="p-4 rounded-2xl border shadow-sm space-y-3 flex flex-col"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-muted)]">
                  Generated {exportFormat.toUpperCase()} Payload
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[color:var(--surface-2)] border text-[color:var(--ink-muted)]" style={{ borderColor: 'var(--line)' }}>
                  {rowCount.toLocaleString()} records · {Math.round(generatedOutput.length / 1024)} KB
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer hover:border-[color:var(--brand)]"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[color:var(--brand)] text-white flex items-center gap-1.5 shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .{exportFormat === 'json' ? 'json' : exportFormat === 'csv' ? 'csv' : 'sql'}</span>
                </button>
              </div>
            </div>

            {/* Code Mirror Viewer */}
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
              <CodeEditor
                value={generatedOutput}
                language={editorLanguage}
                readOnly
                height="540px"
                lineNumbers
                placeholder="Click 'Generate Rows' to preview data..."
              />
            </div>

            {/* Performance Stats */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-[color:var(--ink-muted)]">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-[color:var(--brand)]" />
                <span>100% Client-Side Engine (Zero Remote Telemetry)</span>
              </div>
              {execDurationMs !== null && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>Rendered in {execDurationMs} ms</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
