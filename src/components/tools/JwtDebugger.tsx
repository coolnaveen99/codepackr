import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { KeyRound, Shield, ShieldCheck, ShieldAlert, Clock, Copy, Check, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { CodeEditor } from '../CodeEditor';

interface JwtDebuggerProps {
  initialToken?: string;
  initialMode?: 'decode' | 'encode';
}

const SAMPLE_TOKENS = {
  activeHs256: () => {
    // Dynamically generate a token that expires in 2 hours
    const exp = Math.floor(Date.now() / 1000) + 7200;
    const iat = Math.floor(Date.now() / 1000) - 300;
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: 'usr_enterprise_99182',
      name: 'Alex Rivera',
      email: 'alex@company.internal',
      role: 'staff_engineer',
      iat,
      exp,
      iss: 'https://auth.company.internal',
    };
    const b64 = (obj: any) =>
      btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return `${b64(header)}.${b64(payload)}.u5aB6_XW-1mPzI-W8nKj7Mh4F9c2E0qY6rL3sT1vNxA`;
  },
  expired:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.4pcPyVOydHMMBVxdSCWopRe2ZGsPSC8gevRBU0_U57U',
};

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return decodeURIComponent(escape(atob(base64)));
}

function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const JwtDebugger: React.FC<JwtDebuggerProps> = ({
  initialToken,
  initialMode = 'decode',
}) => {
  const [activeTab, setActiveTab] = useState<'decode' | 'encode'>(initialMode);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedBearer, setCopiedBearer] = useState(false);

  // Decode State
  const [encodedInput, setEncodedInput] = useState(initialToken || SAMPLE_TOKENS.activeHs256());
  const [verifySecret, setVerifySecret] = useState('your-256-bit-secret');
  const [sigStatus, setSigStatus] = useState<'verified' | 'mismatch' | 'unsupported' | 'checking'>('checking');
  const [parseError, setParseError] = useState<string | null>(null);

  // Encode State
  const [encodeAlg, setEncodeAlg] = useState<'HS256' | 'HS384' | 'HS512'>('HS256');
  const [encodeHeader, setEncodeHeader] = useState(JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2));
  const [encodePayload, setEncodePayload] = useState(
    JSON.stringify(
      {
        sub: 'user_dev_42',
        name: 'Jane Smith',
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
        iss: 'https://codepackr.com',
      },
      null,
      2
    )
  );
  const [encodeSecret, setEncodeSecret] = useState('super-secret-key-change-me');
  const [generatedToken, setGeneratedToken] = useState('');

  // Parsed Decoded Components
  const parsedJwt = useMemo(() => {
    setParseError(null);
    if (!encodedInput.trim()) return null;

    const parts = encodedInput.trim().split('.');
    if (parts.length !== 3) {
      setParseError('Invalid JWT: Expected 3 dot-separated parts (Header.Payload.Signature)');
      return null;
    }

    try {
      const headerStr = base64UrlDecode(parts[0]);
      const payloadStr = base64UrlDecode(parts[1]);
      const headerObj = JSON.parse(headerStr);
      const payloadObj = JSON.parse(payloadStr);

      return {
        header: headerObj,
        headerRaw: JSON.stringify(headerObj, null, 2),
        payload: payloadObj,
        payloadRaw: JSON.stringify(payloadObj, null, 2),
        signature: parts[2],
        unsignedPart: `${parts[0]}.${parts[1]}`,
      };
    } catch (err: any) {
      setParseError(`Failed to decode JWT segments: ${err.message}`);
      return null;
    }
  }, [encodedInput]);

  // Check signature for HS256
  const verifySignature = useCallback(async () => {
    if (!parsedJwt) {
      setSigStatus('unsupported');
      return;
    }

    const alg = parsedJwt.header?.alg;
    if (alg !== 'HS256' && alg !== 'HS384' && alg !== 'HS512') {
      setSigStatus('unsupported');
      return;
    }

    if (!verifySecret) {
      setSigStatus('mismatch');
      return;
    }

    try {
      const hashName = alg === 'HS384' ? 'SHA-384' : alg === 'HS512' ? 'SHA-512' : 'SHA-256';
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(verifySecret),
        { name: 'HMAC', hash: hashName },
        false,
        ['sign']
      );

      const computedSigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(parsedJwt.unsignedPart));
      const computedArray = Array.from(new Uint8Array(computedSigBuf));
      const computedB64 = btoa(String.fromCharCode(...computedArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      if (computedB64 === parsedJwt.signature) {
        setSigStatus('verified');
      } else {
        setSigStatus('mismatch');
      }
    } catch {
      setSigStatus('mismatch');
    }
  }, [parsedJwt, verifySecret]);

  useEffect(() => {
    verifySignature();
  }, [verifySignature]);

  // Generate Token in Encode Mode
  const generateEncodedToken = useCallback(async () => {
    try {
      const headerObj = JSON.parse(encodeHeader);
      headerObj.alg = encodeAlg;
      const payloadObj = JSON.parse(encodePayload);

      const pHeader = base64UrlEncode(JSON.stringify(headerObj));
      const pPayload = base64UrlEncode(JSON.stringify(payloadObj));
      const unsigned = `${pHeader}.${pPayload}`;

      const hashName = encodeAlg === 'HS384' ? 'SHA-384' : encodeAlg === 'HS512' ? 'SHA-512' : 'SHA-256';
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(encodeSecret),
        { name: 'HMAC', hash: hashName },
        false,
        ['sign']
      );

      const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(unsigned));
      const sigArray = Array.from(new Uint8Array(sigBuf));
      const sigB64 = btoa(String.fromCharCode(...sigArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      setGeneratedToken(`${unsigned}.${sigB64}`);
    } catch {
      setGeneratedToken('');
    }
  }, [encodeHeader, encodePayload, encodeAlg, encodeSecret]);

  useEffect(() => {
    if (activeTab === 'encode') {
      generateEncodedToken();
    }
  }, [activeTab, generateEncodedToken]);

  // Expiration info
  const expStatus = useMemo(() => {
    if (!parsedJwt?.payload?.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    const exp = parsedJwt.payload.exp;
    const diff = exp - now;
    const isExpired = diff <= 0;

    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / 86400);
    const hours = Math.floor((absDiff % 86400) / 3600);
    const mins = Math.floor((absDiff % 3600) / 60);

    let relativeStr = '';
    if (days > 0) relativeStr = `${days}d ${hours}h`;
    else if (hours > 0) relativeStr = `${hours}h ${mins}m`;
    else relativeStr = `${mins}m`;

    return {
      isExpired,
      date: new Date(exp * 1000).toLocaleString(),
      text: isExpired ? `Expired ${relativeStr} ago` : `Expires in ${relativeStr}`,
    };
  }, [parsedJwt]);

  const copyText = (text: string, isBearer = false) => {
    navigator.clipboard.writeText(text);
    if (isBearer) {
      setCopiedBearer(true);
      setTimeout(() => setCopiedBearer(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-[var(--surface-2)]" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={() => setActiveTab('decode')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'decode'
                ? 'bg-[var(--surface)] text-[var(--brand)] shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Decode & Verify
          </button>
          <button
            onClick={() => setActiveTab('encode')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'encode'
                ? 'bg-[var(--surface)] text-[var(--brand)] shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Token Generator (Sign)
          </button>
        </div>

        {activeTab === 'decode' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Quick Sample:</span>
            <button
              onClick={() => setEncodedInput(SAMPLE_TOKENS.activeHs256())}
              className="px-2.5 py-1 text-xs rounded-lg border font-semibold hover:border-[var(--brand)] transition-colors"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              Active HS256
            </button>
            <button
              onClick={() => setEncodedInput(SAMPLE_TOKENS.expired)}
              className="px-2.5 py-1 text-xs rounded-lg border font-semibold hover:border-[var(--brand)] transition-colors"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              Expired Token
            </button>
          </div>
        )}
      </div>

      {/* DECODE TAB */}
      {activeTab === 'decode' && (
        <div className="space-y-5">
          {/* Encoded Input Box */}
          <div
            className="p-5 rounded-2xl border shadow-sm space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                ENCODED TOKEN STRING
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyText(encodedInput)}
                  className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {copiedToken ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => copyText(`Bearer ${encodedInput}`, true)}
                  className="px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {copiedBearer ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBearer ? 'Copied Bearer' : 'Bearer Format'}</span>
                </button>
              </div>
            </div>

            <textarea
              id="jwt-encoded-input"
              value={encodedInput}
              onChange={(e) => setEncodedInput(e.target.value)}
              rows={3}
              placeholder="Paste raw JWT (eyJhbGciOi...)..."
              className="w-full p-3 font-mono text-xs sm:text-sm rounded-xl border outline-none break-all leading-relaxed"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />

            {parseError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs font-mono text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* Decoded Header, Payload & Signature Inspection */}
          {parsedJwt && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Header & Signature Verification */}
              <div className="space-y-5">
                {/* Header Panel */}
                <div
                  className="p-5 rounded-2xl border shadow-sm space-y-3"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      HEADER: ALGORITHM & TOKEN TYPE
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                      {parsedJwt.header?.alg || 'None'}
                    </span>
                  </div>

                  <CodeEditor
                    id="jwt-header-editor"
                    readOnly
                    value={parsedJwt.headerRaw}
                    height="180px"
                    language="json"
                  />
                </div>

                {/* Signature Verification */}
                <div
                  className="p-5 rounded-2xl border shadow-sm space-y-4"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      VERIFY SIGNATURE
                    </span>

                    {sigStatus === 'verified' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" /> Signature Verified
                      </span>
                    )}
                    {sigStatus === 'mismatch' && (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-100/60 dark:bg-rose-950/40 px-2.5 py-1 rounded-full">
                        <ShieldAlert className="w-3.5 h-3.5" /> Invalid Signature
                      </span>
                    )}
                    {sigStatus === 'unsupported' && (
                      <span className="text-xs text-[var(--muted)] font-mono">
                        Algorithm {parsedJwt.header?.alg || 'Unknown'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                      HMAC SHA-256 SECRET KEY
                    </label>
                    <input
                      type="text"
                      value={verifySecret}
                      onChange={(e) => setVerifySecret(e.target.value)}
                      placeholder="Enter secret to verify signature..."
                      className="w-full px-3 py-2 rounded-xl border font-mono text-xs outline-none"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    />
                  </div>

                  <div className="p-3 rounded-xl font-mono text-xs break-all bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/50 dark:border-cyan-900/50 text-cyan-950 dark:text-cyan-200">
                    <span className="opacity-60 block text-[10px] mb-1">SIGNATURE SEGMENT (BASE64URL):</span>
                    {parsedJwt.signature}
                  </div>
                </div>
              </div>

              {/* Right Column: Payload & Claims */}
              <div
                className="p-5 rounded-2xl border shadow-sm space-y-4"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    PAYLOAD: DATA & CLAIMS
                  </span>

                  {expStatus && (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        expStatus.isExpired
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {expStatus.text}
                    </span>
                  )}
                </div>

                <CodeEditor
                  id="jwt-payload-editor"
                  readOnly
                  value={parsedJwt.payloadRaw}
                  height="340px"
                  language="json"
                />

                {/* Claims Summary Details */}
                <div className="pt-2 border-t text-xs space-y-1.5 font-mono" style={{ borderColor: 'var(--line)' }}>
                  {parsedJwt.payload?.exp && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Expiration (exp):</span>
                      <span className="font-bold" style={{ color: 'var(--ink)' }}>
                        {new Date(parsedJwt.payload.exp * 1000).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {parsedJwt.payload?.iat && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Issued At (iat):</span>
                      <span style={{ color: 'var(--ink)' }}>
                        {new Date(parsedJwt.payload.iat * 1000).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {parsedJwt.payload?.iss && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Issuer (iss):</span>
                      <span style={{ color: 'var(--ink)' }}>{parsedJwt.payload.iss}</span>
                    </div>
                  )}
                  {parsedJwt.payload?.sub && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Subject (sub):</span>
                      <span style={{ color: 'var(--ink)' }}>{parsedJwt.payload.sub}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ENCODE TAB (TOKEN GENERATOR) */}
      {activeTab === 'encode' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Header & Secret Config */}
            <div
              className="p-5 rounded-2xl border shadow-sm space-y-4"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                  TOKEN HEADER & SIGNING KEY
                </span>
                <select
                  value={encodeAlg}
                  onChange={(e) => setEncodeAlg(e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg border text-xs font-mono font-bold outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <option value="HS256">HS256 (HMAC-SHA256)</option>
                  <option value="HS384">HS384 (HMAC-SHA384)</option>
                  <option value="HS512">HS512 (HMAC-SHA512)</option>
                </select>
              </div>

              <CodeEditor
                id="jwt-encode-header"
                value={encodeHeader}
                onChange={setEncodeHeader}
                height="140px"
                language="json"
              />

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                  SIGNING SECRET KEY
                </label>
                <input
                  type="text"
                  value={encodeSecret}
                  onChange={(e) => setEncodeSecret(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border font-mono text-xs outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>

            {/* Payload Config */}
            <div
              className="p-5 rounded-2xl border shadow-sm space-y-4"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  PAYLOAD CLAIMS (JSON)
                </span>
                <button
                  onClick={() => {
                    try {
                      const p = JSON.parse(encodePayload);
                      p.exp = Math.floor(Date.now() / 1000) + 86400; // 24h
                      p.iat = Math.floor(Date.now() / 1000);
                      setEncodePayload(JSON.stringify(p, null, 2));
                    } catch {
                      // ignore
                    }
                  }}
                  className="text-xs flex items-center gap-1 text-[var(--brand)] hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Expiry (+24h)</span>
                </button>
              </div>

              <CodeEditor
                id="jwt-encode-payload"
                value={encodePayload}
                onChange={setEncodePayload}
                height="220px"
                language="json"
              />
            </div>
          </div>

          {/* Output Generated JWT */}
          <div
            className="p-5 rounded-2xl border shadow-sm space-y-3"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                GENERATED SIGNED JWT
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyText(generatedToken)}
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Copied Token' : 'Copy JWT'}</span>
                </button>
                <button
                  onClick={() => copyText(`Bearer ${generatedToken}`, true)}
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {copiedBearer ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBearer ? 'Copied Bearer' : 'Copy Bearer'}</span>
                </button>
              </div>
            </div>

            <pre
              className="p-4 rounded-xl font-mono text-xs sm:text-sm break-all leading-relaxed overflow-x-auto"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--ink)' }}
            >
              {generatedToken || '// Generated token will appear here'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
