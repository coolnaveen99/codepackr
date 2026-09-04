import React, { useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, ArrowDownUp, Shield, KeyRound, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface EncodersViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

// Simple MD5 implementation for client-side hashing
function simpleMd5(string: string): string {
  function md5cycle(x: any, k: any) {
    var a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }
  function cmn(q: any, a: any, b: any, x: any, s: any, t: any) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function md51(s: string) {
    var txt = '';
    var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
    for (i = 0; i < s.length; i++)
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function md5blk(s: string) {
    var md5blks: any = [], i;
    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  var hex_chr = '0123456789abcdef'.split('');
  function rhex(n: any) {
    var s = '', j = 0;
    for (; j < 4; j++)
      s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
    return s;
  }
  function hex(x: any) {
    for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]);
    return x.join('');
  }
  function add32(a: any, b: any) {
    return (a + b) & 0xFFFFFFFF;
  }
  return hex(md51(string));
}

export const EncodersView: React.FC<EncodersViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // For Hash generator
  const [hashes, setHashes] = useState<{ [key: string]: string }>({});

  // For JWT decoder
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');
  const [jwtExpired, setJwtExpired] = useState<boolean | null>(null);

  // For JWT encoder
  const [jwtSecret, setJwtSecret] = useState('secret-key-123');
  const [jwtSubject, setJwtSubject] = useState('user_101');

  // For Base64 Image
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    let sample = '';
    switch (tool.id) {
      case 'base64':
        sample = 'Hello, Codepackr! Secure local browser utilities.';
        break;
      case 'url-encode':
        sample = 'https://codepackr.com/search?query=json formatter&category=developer tools&filter=local#top';
        break;
      case 'html-entity':
        sample = '<div class="alert font-bold">Codepackr & "Online Tools"\'s rating > 99%</div>';
        break;
      case 'hash-generator':
        sample = 'The quick brown fox jumps over the lazy dog';
        break;
      case 'jwt-decoder':
        sample = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        break;
      case 'jwt-encoder':
        sample = '{"sub":"user_123","name":"Developer","role":"engineer","exp":1893456000}';
        break;
    }
    setInput(sample);
    processInput(sample, mode);
  }, [tool.id]);

  const processInput = async (val: string, currentMode: 'encode' | 'decode') => {
    setError(null);
    if (!val.trim()) {
      setOutput('');
      setHashes({});
      return;
    }

    try {
      if (tool.id === 'base64') {
        if (currentMode === 'encode') {
          setOutput(btoa(unescape(encodeURIComponent(val))));
        } else {
          setOutput(decodeURIComponent(escape(atob(val.trim()))));
        }
      } else if (tool.id === 'url-encode') {
        if (currentMode === 'encode') {
          setOutput(encodeURIComponent(val));
        } else {
          setOutput(decodeURIComponent(val));
        }
      } else if (tool.id === 'html-entity') {
        if (currentMode === 'encode') {
          const div = document.createElement('div');
          div.appendChild(document.createTextNode(val));
          setOutput(div.innerHTML);
        } else {
          const div = document.createElement('div');
          div.innerHTML = val;
          setOutput(div.innerText || div.textContent || '');
        }
      } else if (tool.id === 'hash-generator') {
        const encoder = new TextEncoder();
        const data = encoder.encode(val);

        const sha1Buf = await crypto.subtle.digest('SHA-1', data);
        const sha256Buf = await crypto.subtle.digest('SHA-256', data);
        const sha384Buf = await crypto.subtle.digest('SHA-384', data);
        const sha512Buf = await crypto.subtle.digest('SHA-512', data);

        const bufToHex = (buffer: ArrayBuffer) =>
          Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');

        const md5Hash = simpleMd5(val);

        setHashes({
          MD5: md5Hash,
          'SHA-1': bufToHex(sha1Buf),
          'SHA-256': bufToHex(sha256Buf),
          'SHA-384': bufToHex(sha384Buf),
          'SHA-512': bufToHex(sha512Buf),
        });
      } else if (tool.id === 'jwt-decoder') {
        const parts = val.trim().split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT: Expected exactly 3 dot-separated segments.');
        }
        const decodeSegment = (seg: string) => {
          let base64 = seg.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) base64 += '=';
          return JSON.parse(decodeURIComponent(escape(atob(base64))));
        };

        const headerObj = decodeSegment(parts[0]);
        const payloadObj = decodeSegment(parts[1]);

        setJwtHeader(JSON.stringify(headerObj, null, 2));
        setJwtPayload(JSON.stringify(payloadObj, null, 2));

        if (payloadObj.exp) {
          const nowSeconds = Math.floor(Date.now() / 1000);
          setJwtExpired(payloadObj.exp < nowSeconds);
        } else {
          setJwtExpired(null);
        }
      } else if (tool.id === 'jwt-encoder') {
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = JSON.parse(val);

        const b64url = (obj: any) =>
          btoa(JSON.stringify(obj))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const unsigned = `${b64url(header)}.${b64url(payload)}`;
        // Compute pseudo signature for browser preview
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(jwtSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signatureBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(unsigned));
        const sigArray = Array.from(new Uint8Array(signatureBuf));
        const sigB64 = btoa(String.fromCharCode(...sigArray))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        setOutput(`${unsigned}.${sigB64}`);
      } else if (tool.id === 'base64-image') {
        if (val.startsWith('data:image')) {
          setImagePreview(val);
          setOutput('Image loaded from Base64 Data URL');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Processing failed. Check input formatting.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      setInput(res);
      setImagePreview(res);
      setOutput(res);
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Mode Bar */}
      {(tool.id === 'base64' || tool.id === 'url-encode' || tool.id === 'html-entity') && (
        <div className="flex items-center gap-2 p-2 rounded-xl border mb-4 shadow-sm"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <button
            onClick={() => {
              setMode('encode');
              processInput(input, 'encode');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'encode' ? 'bg-[var(--brand)] text-white shadow-sm' : 'hover:opacity-80'
            }`}
          >
            Encode
          </button>
          <button
            onClick={() => {
              setMode('decode');
              processInput(input, 'decode');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'decode' ? 'bg-[var(--brand)] text-white shadow-sm' : 'hover:opacity-80'
            }`}
          >
            Decode
          </button>
          <span className="text-xs ml-auto pr-2" style={{ color: 'var(--muted)' }}>
            Mode: <strong className="capitalize">{mode}</strong>
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl border text-xs font-mono"
          style={{ backgroundColor: 'rgba(240, 62, 62, 0.1)', borderColor: 'var(--warn)', color: 'var(--warn)' }}
        >
          {error}
        </div>
      )}

      {/* Hash Generator Layout */}
      {tool.id === 'hash-generator' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              INPUT TEXT
            </label>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                processInput(e.target.value, 'encode');
              }}
              rows={3}
              placeholder="Type or paste text to generate cryptographic hashes..."
              className="w-full p-3 font-mono text-xs sm:text-sm rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div className="space-y-2">
            {Object.entries(hashes).map(([algo, hashVal]) => (
              <div
                key={algo}
                className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <span className="w-24 text-xs font-bold font-mono px-2 py-1 rounded text-center shrink-0"
                  style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand)' }}
                >
                  {algo}
                </span>
                <span className="font-mono text-xs sm:text-sm break-all flex-1" style={{ color: 'var(--ink)' }}>
                  {hashVal}
                </span>
                <button
                  onClick={() => copyToClipboard(hashVal)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80 flex items-center gap-1 shrink-0"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : tool.id === 'jwt-decoder' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              ENCODED JWT TOKEN
            </label>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                processInput(e.target.value, 'decode');
              }}
              rows={3}
              placeholder="Paste JWT (eyJhbGciOi...)..."
              className="w-full p-3 font-mono text-xs sm:text-sm rounded-xl border outline-none break-all"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border shadow-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-500 uppercase">HEADER: ALGORITHM & TOKEN TYPE</span>
                <button
                  onClick={() => copyToClipboard(jwtHeader)}
                  className="text-xs flex items-center gap-1 hover:underline text-gray-500"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <pre className="p-3 rounded-xl font-mono text-xs overflow-x-auto"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--ink)' }}
              >
                {jwtHeader || '// Header will appear here'}
              </pre>
            </div>

            <div className="p-4 rounded-2xl border shadow-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">PAYLOAD: DATA & CLAIMS</span>
                  {jwtExpired !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      jwtExpired ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {jwtExpired ? 'EXPIRED' : 'ACTIVE'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(jwtPayload)}
                  className="text-xs flex items-center gap-1 hover:underline text-gray-500"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <pre className="p-3 rounded-xl font-mono text-xs overflow-x-auto"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--ink)' }}
              >
                {jwtPayload || '// Payload will appear here'}
              </pre>
            </div>
          </div>
        </div>
      ) : tool.id === 'base64-image' ? (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-dashed text-center"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[var(--brand)]" />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
              Upload Image to Convert to Base64
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              Supports PNG, JPG, GIF, WebP, SVG. Processed completely in browser.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--brand)] file:text-white hover:file:opacity-90 cursor-pointer"
            />
          </div>

          {imagePreview && (
            <div className="p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div>
                <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                  IMAGE PREVIEW
                </span>
                <div className="p-4 rounded-xl border flex items-center justify-center min-h-48 bg-slate-900/5 dark:bg-slate-900/40">
                  <img src={imagePreview} alt="Base64 Preview" className="max-h-60 max-w-full rounded object-contain" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    BASE64 DATA URL ({output.length} characters)
                  </span>
                  <button
                    onClick={() => copyToClipboard(output)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={output}
                  rows={8}
                  className="w-full flex-1 p-3 font-mono text-xs rounded-xl border outline-none resize-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standard 2-Column Encode/Decode layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b text-xs font-semibold"
              style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)', color: 'var(--muted)' }}
            >
              <span>INPUT</span>
              <button
                onClick={() => { setInput(''); setOutput(''); }}
                className="text-[11px] hover:underline"
              >
                Clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                processInput(e.target.value, mode);
              }}
              rows={12}
              placeholder="Paste or type content here..."
              className="w-full p-4 font-mono text-xs sm:text-sm bg-transparent border-none outline-none resize-y leading-relaxed"
              style={{ color: 'var(--ink)' }}
            />
          </div>

          <div className="flex flex-col rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b text-xs font-semibold"
              style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)', color: 'var(--muted)' }}
            >
              <span>RESULT ({mode.toUpperCase()})</span>
              <button
                onClick={() => copyToClipboard(output)}
                disabled={!output}
                className="flex items-center gap-1 text-[11px] font-semibold hover:underline disabled:opacity-40"
                style={{ color: 'var(--brand)' }}
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              rows={12}
              placeholder="Result will appear here..."
              className="w-full p-4 font-mono text-xs sm:text-sm bg-transparent border-none outline-none resize-y leading-relaxed"
              style={{ color: 'var(--ink)', backgroundColor: 'var(--surface-2)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
