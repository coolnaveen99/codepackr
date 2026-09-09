import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, Copy, Check, Clock, Key, ArrowRight, RotateCcw } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface JwtInspectorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const DEFAULT_SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkNvZGVQYWNrciBFbnRlcnByaXNlIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4eBvRrqz0tVp0b9h5z2C8Q-Pz6a6-Nq7d1g6Z5w8E3c';

export const JwtInspectorView: React.FC<JwtInspectorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [token, setToken] = useState<string>(initialInput.trim() || DEFAULT_SAMPLE);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const parseJwt = (jwt: string) => {
    try {
      const trimmed = jwt.trim();
      if (!trimmed) {
        return { error: 'Please enter or paste a JSON Web Token to inspect.' };
      }
      const parts = trimmed.split('.');
      if (parts.length !== 3) {
        return { error: 'Invalid JWT format. A valid token must contain 3 dot-separated segments (Header.Payload.Signature).' };
      }

      const decodeBase64Url = (base64Url: string) => {
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      };

      const header = decodeBase64Url(parts[0]);
      const payload = decodeBase64Url(parts[1]);
      const signature = parts[2];

      const now = Date.now();
      const hasExp = typeof payload.exp === 'number';
      const expDate = hasExp ? new Date(payload.exp * 1000) : null;
      const isExpired = hasExp ? payload.exp * 1000 < now : false;

      const hasIat = typeof payload.iat === 'number';
      const iatDate = hasIat ? new Date(payload.iat * 1000) : null;

      return {
        header,
        payload,
        signature,
        isExpired,
        expDate,
        iatDate,
        rawHeader: parts[0],
        rawPayload: parts[1],
      };
    } catch {
      return { error: 'Failed to decode token segments. Ensure the token has valid Base64Url encoding.' };
    }
  };

  const parsed = parseJwt(token);

  const handleReset = () => {
    setToken(DEFAULT_SAMPLE);
  };

  const handleClear = () => {
    setToken('');
  };

  return (
    <div id="jwt-inspector-view" className="space-y-6 animate-fade-in">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleReset}
        resetLabel="Reset to Default Token"
      />

      <div
        className="p-5 rounded-2xl border space-y-3 shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Paste JSON Web Token (JWT)
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              Load Sample
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
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={3}
          className="w-full p-3.5 rounded-xl border font-mono text-xs outline-none focus:border-[var(--brand)] transition-colors leading-relaxed"
          style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        />
      </div>

      {'error' in parsed ? (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-mono flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{parsed.error}</span>
        </div>
      ) : (
        <div className="space-y-5">
          {parsed.isExpired ? (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between font-semibold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  Expired Token: Expired on {parsed.expDate?.toUTCString()} (exp: {parsed.payload.exp})
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[11px]">
                Expired
              </span>
            </div>
          ) : parsed.expDate ? (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>
                  Active Token: Valid until {parsed.expDate?.toUTCString()} (exp: {parsed.payload.exp})
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[11px]">
                Active
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2 font-semibold">
              <Clock className="w-4 h-4 shrink-0 text-blue-500" />
              <span>Token has no 'exp' (expiration) claim specified.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Header */}
            <div
              className="p-5 rounded-2xl border space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)]">
                    Header (Algorithm &amp; Token Type)
                  </h3>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(parsed.header, null, 2), 'header')}
                  className="text-xs font-medium text-[var(--brand)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'header' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'header' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre
                className="p-4 rounded-xl font-mono text-xs overflow-auto max-h-60 leading-relaxed"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--ink)' }}
              >
                {JSON.stringify(parsed.header, null, 2)}
              </pre>
            </div>

            {/* Payload */}
            <div
              className="p-5 rounded-2xl border space-y-3"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)]">
                    Payload (Data Claims)
                  </h3>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(parsed.payload, null, 2), 'payload')}
                  className="text-xs font-medium text-[var(--brand)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'payload' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'payload' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre
                className="p-4 rounded-xl font-mono text-xs overflow-auto max-h-60 leading-relaxed"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--ink)' }}
              >
                {JSON.stringify(parsed.payload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Signature Segment */}
          <div
            className="p-5 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)]">
                  Signature Segment (Base64Url)
                </h3>
              </div>
              <button
                onClick={() => handleCopy(parsed.signature, 'signature')}
                className="text-xs font-medium text-[var(--brand)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'signature' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'signature' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div
              className="p-3.5 rounded-xl font-mono text-xs break-all select-all"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--ink)' }}
            >
              {parsed.signature}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
