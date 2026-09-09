import React, { useState, useEffect } from 'react';
import { Link, Copy, Check, Eye, EyeOff, Database, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface ConnectionStringParserViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const ConnectionStringParserView: React.FC<ConnectionStringParserViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [dbType, setDbType] = useState<'postgres' | 'mysql' | 'mongodb' | 'redis'>('postgres');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [user, setUser] = useState('postgres');
  const [password, setPassword] = useState('secret');
  const [database, setDatabase] = useState('app_db');
  const [sslMode, setSslMode] = useState('prefer');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pasteUriInput, setPasteUriInput] = useState('');
  const [parseMsg, setParseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // If initialInput was provided, try parsing it
  useEffect(() => {
    if (initialInput.trim()) {
      handleParseUri(initialInput.trim());
    }
  }, [initialInput]);

  const buildUri = () => {
    const encodedUser = encodeURIComponent(user);
    const encodedPwd = encodeURIComponent(password);

    switch (dbType) {
      case 'postgres':
        return `postgresql://${encodedUser}:${encodedPwd}@${host}:${port}/${database}${sslMode ? `?sslmode=${sslMode}` : ''}`;
      case 'mysql':
        return `mysql://${encodedUser}:${encodedPwd}@${host}:${port}/${database}`;
      case 'mongodb':
        if (host.includes('.mongodb.net')) {
          return `mongodb+srv://${encodedUser}:${encodedPwd}@${host}/${database}?retryWrites=true&w=majority`;
        }
        return `mongodb://${encodedUser}:${encodedPwd}@${host}:${port}/${database}`;
      case 'redis':
        return password
          ? `redis://:${encodedPwd}@${host}:${port}/${database || '0'}`
          : `redis://${host}:${port}/${database || '0'}`;
      default:
        return '';
    }
  };

  const uri = buildUri();

  const handleCopy = () => {
    navigator.clipboard.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetDefaults = () => {
    setDbType('postgres');
    setHost('localhost');
    setPort('5432');
    setUser('postgres');
    setPassword('secret');
    setDatabase('app_db');
    setSslMode('prefer');
    setParseMsg(null);
  };

  const handleClear = () => {
    setHost('');
    setPort('');
    setUser('');
    setPassword('');
    setDatabase('');
    setPasteUriInput('');
    setParseMsg(null);
  };

  const handleParseUri = (rawUri: string) => {
    const trimmed = rawUri.trim();
    if (!trimmed) return;

    try {
      // Normalize mongodb+srv to parse with URL API
      let normalized = trimmed;
      let isMongoSrv = false;
      if (normalized.startsWith('mongodb+srv://')) {
        normalized = normalized.replace('mongodb+srv://', 'http://');
        isMongoSrv = true;
      } else if (normalized.includes('://')) {
        normalized = normalized.replace(/^[a-zA-Z0-9_+.-]+:\/\//, 'http://');
      }

      const urlObj = new URL(normalized);

      if (trimmed.startsWith('postgres') || trimmed.startsWith('psql')) {
        setDbType('postgres');
      } else if (trimmed.startsWith('mysql')) {
        setDbType('mysql');
      } else if (trimmed.startsWith('mongodb')) {
        setDbType('mongodb');
      } else if (trimmed.startsWith('redis')) {
        setDbType('redis');
      }

      setHost(urlObj.hostname || 'localhost');
      setPort(urlObj.port || (isMongoSrv ? '27017' : ''));
      setUser(decodeURIComponent(urlObj.username || ''));
      setPassword(decodeURIComponent(urlObj.password || ''));
      const pathDb = urlObj.pathname.replace(/^\//, '');
      setDatabase(pathDb);

      const ssl = urlObj.searchParams.get('sslmode');
      if (ssl) setSslMode(ssl);

      setParseMsg({ type: 'success', text: 'Successfully parsed URI parameters into builder fields.' });
      setTimeout(() => setParseMsg(null), 3000);
    } catch {
      setParseMsg({ type: 'error', text: 'Could not parse connection string format. Please verify URI syntax.' });
    }
  };

  return (
    <div id="connection-string-parser-view" className="space-y-6 animate-fade-in">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleResetDefaults}
        resetLabel="Reset to Defaults"
      />

      {/* Reverse URI Parser Card */}
      <div
        className="p-5 rounded-2xl border space-y-3 shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--brand)]" />
            <span>Paste Existing Connection String to Parse</span>
          </label>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={pasteUriInput}
            onChange={(e) => setPasteUriInput(e.target.value)}
            placeholder="postgresql://user:pass@ep-hostname.region.aws.neon.tech/neondb..."
            className="flex-1 p-2.5 rounded-xl border font-mono text-xs outline-none focus:border-[var(--brand)]"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
          <button
            onClick={() => handleParseUri(pasteUriInput)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer hover:opacity-90 shrink-0"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            Parse URI
          </button>
        </div>
        {parseMsg && (
          <p
            className={`text-xs font-semibold ${
              parseMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
            }`}
          >
            {parseMsg.text}
          </p>
        )}
      </div>

      {/* Builder Form */}
      <div
        className="p-6 rounded-2xl border space-y-5 shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[var(--brand)]" />
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Target Database Engine:
            </label>
            <select
              value={dbType}
              onChange={(e: any) => {
                const t = e.target.value;
                setDbType(t);
                if (t === 'postgres') {
                  setPort('5432');
                  setUser('postgres');
                  setDatabase('app_db');
                }
                if (t === 'mysql') {
                  setPort('3306');
                  setUser('root');
                  setDatabase('app_db');
                }
                if (t === 'mongodb') {
                  setPort('27017');
                  setUser('admin');
                  setDatabase('cluster0');
                }
                if (t === 'redis') {
                  setPort('6379');
                  setUser('');
                  setDatabase('0');
                }
              }}
              className="p-2 rounded-xl border text-xs font-bold outline-none cursor-pointer"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB / Atlas</option>
              <option value="redis">Redis</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              Reset
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Host / Domain</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="localhost or db.host.com"
              className="w-full p-2.5 rounded-xl border font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Port</label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="5432"
              className="w-full p-2.5 rounded-xl border font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">
              {dbType === 'redis' ? 'DB Index' : 'Database Name'}
            </label>
            <input
              type="text"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              placeholder={dbType === 'redis' ? '0' : 'production_db'}
              className="w-full p-2.5 rounded-xl border font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Username</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="postgres, root, or user"
              className="w-full p-2.5 rounded-xl border font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-[var(--muted)]">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-2.5 rounded-xl border font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          {dbType === 'postgres' && (
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">SSL Mode</label>
              <select
                value={sslMode}
                onChange={(e) => setSslMode(e.target.value)}
                className="w-full p-2.5 rounded-xl border font-mono cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <option value="prefer">prefer</option>
                <option value="require">require</option>
                <option value="verify-full">verify-full</option>
                <option value="disable">disable</option>
              </select>
            </div>
          )}
        </div>

        {/* Output Connection String */}
        <div className="pt-4 border-t space-y-2.5" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Constructed Connection URI
            </span>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs hover:border-[var(--brand)] transition-colors"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Connection URI'}</span>
            </button>
          </div>
          <input
            type="text"
            readOnly
            value={uri}
            className="w-full p-3.5 rounded-xl border font-mono text-xs select-all outline-none font-medium"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--brand)' }}
          />
        </div>
      </div>
    </div>
  );
};
