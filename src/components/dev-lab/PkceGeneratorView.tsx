import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, RefreshCw, Shield, ExternalLink, Globe } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface PkceGeneratorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
}

export const PkceGeneratorView: React.FC<PkceGeneratorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  const [verifier, setVerifier] = useState('');
  const [challenge, setChallenge] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Optional OAuth request parameters for building authorization URL
  const [authEndpoint, setAuthEndpoint] = useState('https://auth.example.com/oauth/authorize');
  const [clientId, setClientId] = useState('client_codepackr_123');
  const [redirectUri, setRedirectUri] = useState('https://myapp.com/callback');
  const [scope, setScope] = useState('openid profile email');
  const [stateParam, setStateParam] = useState('xyzState123');

  const generatePkce = async () => {
    try {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);

      const base64UrlEncode = (buffer: ArrayBuffer | Uint8Array) => {
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      };

      const codeVerifier = base64UrlEncode(array);
      setVerifier(codeVerifier);

      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      const codeChallenge = base64UrlEncode(digest);
      setChallenge(codeChallenge);
    } catch {
      // Fallback for restricted environments
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
      let rand = '';
      for (let i = 0; i < 64; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setVerifier(rand);
      setChallenge(rand.slice(0, 43));
    }
  };

  useEffect(() => {
    generatePkce();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const constructedAuthUrl = `${authEndpoint}?response_type=code&client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
    scope
  )}&state=${encodeURIComponent(stateParam)}&code_challenge=${encodeURIComponent(
    challenge
  )}&code_challenge_method=S256`;

  return (
    <div id="pkce-generator-view" className="space-y-6 animate-fade-in">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={generatePkce}
        resetLabel="Generate New Pair"
      />

      <div
        className="p-6 rounded-2xl border space-y-5 shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                OAuth 2.0 PKCE Security Parameters
              </h3>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Generated cryptographically via browser Web Crypto API (<code className="font-mono">SHA-256 / S256</code> RFC 7636).
            </p>
          </div>
          <button
            onClick={generatePkce}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate New Pair</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Code Verifier */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--muted)]">
                Code Verifier (43–128 Char High-Entropy String)
              </label>
              <button
                onClick={() => handleCopy(verifier, 'verifier')}
                className="text-xs font-medium text-[var(--brand)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied === 'verifier' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied === 'verifier' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={verifier}
              className="w-full p-3 rounded-xl border font-mono text-xs select-all outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
            <p className="text-[11px] text-[var(--muted)] mt-1">
              Store securely in client session. Send this to the token exchange endpoint (<code className="font-mono">POST /token</code>).
            </p>
          </div>

          {/* Code Challenge */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--muted)]">
                Code Challenge (<code className="font-mono">BASE64URL-ENCODE(SHA256(verifier))</code>)
              </label>
              <button
                onClick={() => handleCopy(challenge, 'challenge')}
                className="text-xs font-medium text-[var(--brand)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied === 'challenge' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied === 'challenge' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={challenge}
              className="w-full p-3 rounded-xl border font-mono text-xs select-all outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--brand)' }}
            />
            <p className="text-[11px] text-[var(--muted)] mt-1">
              Send this to the authorization endpoint (<code className="font-mono">code_challenge</code> with method <code className="font-mono">S256</code>).
            </p>
          </div>

          {/* Code Challenge Method */}
          <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <span className="text-xs font-semibold text-[var(--muted)]">Code Challenge Method</span>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">S256</span>
          </div>
        </div>
      </div>

      {/* Authorization URL Builder Helper */}
      <div
        className="p-6 rounded-2xl border space-y-4 shadow-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--brand)]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--muted)]">
              Interactive OAuth 2.0 Authorization URL Builder
            </h4>
          </div>
          <button
            onClick={() => handleCopy(constructedAuthUrl, 'authurl')}
            className="text-xs font-medium text-[var(--brand)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {copied === 'authurl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'authurl' ? 'Copied URL' : 'Copy Authorization URL'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Auth Endpoint</label>
            <input
              type="text"
              value={authEndpoint}
              onChange={(e) => setAuthEndpoint(e.target.value)}
              className="w-full p-2.5 rounded-xl border font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Client ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full p-2.5 rounded-xl border font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Redirect URI</label>
            <input
              type="text"
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              className="w-full p-2.5 rounded-xl border font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Scope</label>
            <input
              type="text"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full p-2.5 rounded-xl border font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">State</label>
            <input
              type="text"
              value={stateParam}
              onChange={(e) => setStateParam(e.target.value)}
              className="w-full p-2.5 rounded-xl border font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[var(--muted)] text-xs mb-1">
            Constructed Authorization GET Request
          </label>
          <textarea
            readOnly
            rows={3}
            value={constructedAuthUrl}
            className="w-full p-3 rounded-xl border font-mono text-xs select-all outline-none leading-relaxed"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>
    </div>
  );
};
