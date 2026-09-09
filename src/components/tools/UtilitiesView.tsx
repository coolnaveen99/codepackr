import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, RefreshCw, Download, QrCode as QrIcon, Lock, Globe, Clock, Sliders } from 'lucide-react';
import QRCode from 'qrcode';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { CronVisualizer } from './CronVisualizer';

interface UtilitiesViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const UtilitiesView: React.FC<UtilitiesViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [copied, setCopied] = useState(false);

  // UUID Generator
  const [uuidCount, setUuidCount] = useState(5);
  const [uuidHyphens, setUuidHyphens] = useState(true);
  const [uuidUppercase, setUuidUppercase] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);

  // QR Code Generator
  const [qrText, setQrText] = useState('https://codepackr.com');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Password Generator
  const [pwLength, setPwLength] = useState(16);
  const [pwUpper, setPwUpper] = useState(true);
  const [pwLower, setPwLower] = useState(true);
  const [pwNumbers, setPwNumbers] = useState(true);
  const [pwSymbols, setPwSymbols] = useState(true);
  const [passwords, setPasswords] = useState<string[]>([]);

  // Lorem Ipsum
  const [loremType, setLoremType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [loremCount, setLoremCount] = useState(3);
  const [loremOutput, setLoremOutput] = useState('');

  // Color Converter
  const [hexColor, setHexColor] = useState('#5B52E8');
  const [rgbColor, setRgbColor] = useState('rgb(91, 82, 232)');
  const [hslColor, setHslColor] = useState('hsl(244, 78%, 62%)');

  // Unix Timestamp
  const [timestampSec, setTimestampSec] = useState(Math.floor(Date.now() / 1000));
  const [dateStrUtc, setDateStrUtc] = useState('');
  const [dateStrLocal, setDateStrLocal] = useState('');

  // Cron Expression
  const [cronMin, setCronMin] = useState('0');
  const [cronHour, setCronHour] = useState('12');
  const [cronDom, setCronDom] = useState('*');
  const [cronMonth, setCronMonth] = useState('*');
  const [cronDow, setCronDow] = useState('?');

  // Slugify
  const [slugInput, setSlugInput] = useState('Welcome to Codepackr: 2026 Developer Toolkit!');
  const [slugSep, setSlugSep] = useState<'-' | '_'>('-');
  const [slugOutput, setSlugOutput] = useState('');

  // HTTP Codes
  const [httpSearch, setHttpSearch] = useState('');

  // Markdown Preview
  const [mdContent, setMdContent] = useState(
    `# Codepackr Markdown Preview

Codepackr is a fast, **100% client-side** developer tool suite.

## Features
- **EDI Tools**: Formatter, segment viewer, JSON converter, and validator.
- **Syntax Checkers**: JSON, XML, XSD, YAML, .env.
- **Cryptography**: Hashes, HMAC, UUID v4, and JWT signatures.

### Code Block
\`\`\`javascript
const suite = "Codepackr";
console.log(\`Running \${suite} securely in your browser.\`);
\`\`\`

> "All data remains on your machine. Zero network latency."`
  );

  const renderMarkdownHtml = (md: string) => {
    return md
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mt-4 mb-1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-5 mb-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold mt-2 mb-3">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code class="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">$1</code>')
      .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-500 pl-3 italic my-2 text-zinc-600 dark:text-zinc-400">$1</blockquote>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n\n/g, '<p class="my-2 leading-relaxed"></p>');
  };

  useEffect(() => {
    if (tool.id === 'uuid-generator') {
      generateUuids();
    } else if (tool.id === 'qr-generator') {
      generateQrCode(qrText);
    } else if (tool.id === 'password-generator') {
      generatePasswords();
    } else if (tool.id === 'lorem-ipsum') {
      generateLorem(loremCount, loremType);
    } else if (tool.id === 'color-converter') {
      updateFromHex(hexColor);
    } else if (tool.id === 'timestamp') {
      updateTimestamp(timestampSec);
    } else if (tool.id === 'slugify') {
      updateSlug(slugInput, slugSep);
    }
  }, [tool.id]);

  // UUID generator logic
  const generateUuids = () => {
    const list: string[] = [];
    for (let i = 0; i < uuidCount; i++) {
      let u: string = crypto.randomUUID();
      if (!uuidHyphens) u = u.replace(/-/g, '');
      if (uuidUppercase) u = u.toUpperCase();
      list.push(u);
    }
    setUuids(list);
  };

  // QR Code generator logic
  const generateQrCode = (text: string) => {
    if (!qrCanvasRef.current || !text) return;
    QRCode.toCanvas(qrCanvasRef.current, text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#162033',
        light: '#ffffff',
      },
    });
  };

  useEffect(() => {
    if (tool.id === 'qr-generator') {
      generateQrCode(qrText);
    }
  }, [qrText, tool.id]);

  const downloadQr = () => {
    if (!qrCanvasRef.current) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = 'codepackr-qrcode.png';
    a.href = url;
    a.click();
  };

  // Password generator logic
  const generatePasswords = () => {
    let chars = '';
    if (pwUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (pwLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (pwNumbers) chars += '0123456789';
    if (pwSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

    const res: string[] = [];
    for (let j = 0; j < 5; j++) {
      const arr = new Uint32Array(pwLength);
      crypto.getRandomValues(arr);
      let pw = '';
      for (let i = 0; i < pwLength; i++) {
        pw += chars[arr[i] % chars.length];
      }
      res.push(pw);
    }
    setPasswords(res);
  };

  // Lorem Ipsum logic
  const LOREM_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation',
    'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis',
    'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum'
  ];

  const generateLorem = (count: number, type: 'paragraphs' | 'sentences' | 'words') => {
    if (type === 'words') {
      const words: string[] = [];
      for (let i = 0; i < count; i++) {
        words.push(LOREM_WORDS[i % LOREM_WORDS.length]);
      }
      setLoremOutput(words.join(' '));
    } else if (type === 'sentences') {
      const sents: string[] = [];
      for (let i = 0; i < count; i++) {
        const len = 8 + (i % 7);
        const chunk = [];
        for (let j = 0; j < len; j++) chunk.push(LOREM_WORDS[(i * len + j) % LOREM_WORDS.length]);
        const s = chunk.join(' ');
        sents.push(s.charAt(0).toUpperCase() + s.slice(1) + '.');
      }
      setLoremOutput(sents.join(' '));
    } else {
      const paras: string[] = [];
      for (let p = 0; p < count; p++) {
        const sents = [];
        for (let s = 0; s < 4; s++) {
          const len = 7 + ((p + s) % 6);
          const chunk = [];
          for (let j = 0; j < len; j++) chunk.push(LOREM_WORDS[(p * 4 + s + j) % LOREM_WORDS.length]);
          const sentence = chunk.join(' ');
          sents.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.');
        }
        paras.push(sents.join(' '));
      }
      setLoremOutput(paras.join('\n\n'));
    }
  };

  // Color logic
  const updateFromHex = (hex: string) => {
    setHexColor(hex);
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    if (c.length === 6) {
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      setRgbColor(`rgb(${r}, ${g}, ${b})`);

      // HSL calculation
      const rP = r / 255, gP = g / 255, bP = b / 255;
      const max = Math.max(rP, gP, bP), min = Math.min(rP, gP, bP);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rP: h = (gP - bP) / d + (gP < bP ? 6 : 0); break;
          case gP: h = (bP - rP) / d + 2; break;
          case bP: h = (rP - gP) / d + 4; break;
        }
        h /= 6;
      }
      setHslColor(`hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`);
    }
  };

  // Timestamp logic
  const updateTimestamp = (sec: number) => {
    setTimestampSec(sec);
    const d = new Date(sec * 1000);
    setDateStrUtc(d.toUTCString());
    setDateStrLocal(d.toLocaleString());
  };

  // Slugify logic
  const updateSlug = (str: string, sep: '-' | '_') => {
    const slug = str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, sep)
      .replace(/^-+|-+$/g, '');
    setSlugOutput(slug);
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // HTTP Codes Dictionary
  const HTTP_CODES = [
    { code: 200, name: 'OK', desc: 'The standard response for successful HTTP requests.' },
    { code: 201, name: 'Created', desc: 'The request succeeded and a new resource was created.' },
    { code: 204, name: 'No Content', desc: 'The server successfully processed the request, but is not returning any content.' },
    { code: 301, name: 'Moved Permanently', desc: 'This and all future requests should be directed to the given URI.' },
    { code: 304, name: 'Not Modified', desc: 'Resource has not been modified since the version specified in If-Modified-Since headers.' },
    { code: 400, name: 'Bad Request', desc: 'The server cannot process the request due to client syntax error or invalid framing.' },
    { code: 401, name: 'Unauthorized', desc: 'Authentication is required and has failed or has not yet been provided.' },
    { code: 403, name: 'Forbidden', desc: 'The request contained valid data and was understood by the server, but server refuses action.' },
    { code: 404, name: 'Not Found', desc: 'The requested resource could not be found but may be available in the future.' },
    { code: 405, name: 'Method Not Allowed', desc: 'A request method is not supported for the requested resource.' },
    { code: 429, name: 'Too Many Requests', desc: 'The user has sent too many requests in a given amount of time (rate limiting).' },
    { code: 500, name: 'Internal Server Error', desc: 'A generic error message, given when an unexpected condition was encountered.' },
    { code: 502, name: 'Bad Gateway', desc: 'The server, while acting as a gateway or proxy, received an invalid response from upstream.' },
    { code: 503, name: 'Service Unavailable', desc: 'The server cannot handle the request (overloaded or down for maintenance).' },
    { code: 504, name: 'Gateway Timeout', desc: 'The server, while acting as a gateway or proxy, did not receive a timely response.' },
  ];

  const handleResetOrClear = () => {
    if (tool.id === 'uuid-generator') {
      setUuidCount(5);
      setUuidHyphens(true);
      setUuidUppercase(false);
      generateUuids();
    } else if (tool.id === 'qr-generator') {
      setQrText('https://codepackr.com');
    } else if (tool.id === 'password-generator') {
      setPwLength(16);
      setPwUpper(true);
      setPwLower(true);
      setPwNumbers(true);
      setPwSymbols(true);
      generatePasswords();
    } else if (tool.id === 'lorem-ipsum') {
      setLoremCount(3);
      setLoremType('paragraphs');
      generateLorem(3, 'paragraphs');
    } else if (tool.id === 'color-converter') {
      updateFromHex('#5B52E8');
    } else if (tool.id === 'timestamp') {
      const now = Math.floor(Date.now() / 1000);
      updateTimestamp(now);
    } else if (tool.id === 'cron-expression') {
      setCronMin('0');
      setCronHour('12');
      setCronDom('*');
      setCronMonth('*');
      setCronDow('?');
    } else if (tool.id === 'slugify') {
      setSlugInput('');
      setSlugSep('-');
      setSlugOutput('');
    } else if (tool.id === 'http-status-codes') {
      setHttpSearch('');
    } else if (tool.id === 'markdown-preview') {
      setMdContent('# Codepackr Markdown Preview\n\nStart typing markdown here...');
    }
  };

  return (
    <div>
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleResetOrClear}
        resetLabel={tool.id === 'slugify' ? 'Clear Workspace' : 'Reset to Defaults'}
      />

      {/* UUID Generator */}
      {tool.id === 'uuid-generator' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                  COUNT (1-50)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={uuidCount}
                  onChange={(e) => setUuidCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                  className="w-20 p-2 rounded-xl border text-center font-mono text-sm outline-none"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uuidHyphens}
                    onChange={(e) => setUuidHyphens(e.target.checked)}
                    className="rounded text-[var(--brand)]"
                  />
                  <span>Hyphens</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uuidUppercase}
                    onChange={(e) => setUuidUppercase(e.target.checked)}
                    className="rounded text-[var(--brand)]"
                  />
                  <span>Uppercase</span>
                </label>
              </div>
            </div>

            <button
              onClick={generateUuids}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          </div>

          <div className="space-y-2">
            {uuids.map((u, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border flex items-center justify-between shadow-sm font-mono text-xs sm:text-sm"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <span style={{ color: 'var(--ink)' }}>{u}</span>
                <button
                  onClick={() => copyToClipboard(u)}
                  className="px-2.5 py-1 rounded-lg border text-xs hover:opacity-80 flex items-center gap-1"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Generator */}
      {tool.id === 'qr-generator' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow-md space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              TEXT OR URL TO ENCODE
            </label>
            <input
              type="text"
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder="https://example.com or any text..."
              className="w-full p-3 font-mono text-sm rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            />
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-xl border bg-white shadow-inner">
            <canvas ref={qrCanvasRef} className="rounded-lg shadow-sm" />
          </div>

          <button
            onClick={downloadQr}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-sm hover:opacity-90"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res QR Code PNG</span>
          </button>
        </div>
      )}

      {/* Password Generator */}
      {tool.id === 'password-generator' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow-md space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span style={{ color: 'var(--muted)' }}>LENGTH: {pwLength} CHARACTERS</span>
              <span className="text-emerald-500 font-bold">Strong Entropy</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={pwLength}
              onChange={(e) => setPwLength(Number(e.target.value))}
              className="w-full cursor-pointer accent-[var(--brand)]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {[
              { label: 'Uppercase', state: pwUpper, set: setPwUpper },
              { label: 'Lowercase', state: pwLower, set: setPwLower },
              { label: 'Numbers', state: pwNumbers, set: setPwNumbers },
              { label: 'Symbols', state: pwSymbols, set: setPwSymbols },
            ].map(({ label, state, set }) => (
              <label
                key={label}
                className="flex items-center gap-1.5 p-2 rounded-lg border text-xs font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <input
                  type="checkbox"
                  checked={state}
                  onChange={(e) => set(e.target.checked)}
                  className="rounded text-[var(--brand)]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={generatePasswords}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate Passwords</span>
          </button>

          <div className="space-y-2 pt-2">
            {passwords.map((pw, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border flex items-center justify-between shadow-sm font-mono text-xs sm:text-sm"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <span className="truncate mr-2 font-semibold" style={{ color: 'var(--ink)' }}>{pw}</span>
                <button
                  onClick={() => copyToClipboard(pw)}
                  className="px-2.5 py-1 rounded-lg border text-xs hover:opacity-80 flex items-center gap-1 shrink-0"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lorem Ipsum */}
      {tool.id === 'lorem-ipsum' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={20}
                value={loremCount}
                onChange={(e) => setLoremCount(Number(e.target.value))}
                className="w-16 p-2 rounded-xl border text-center font-mono text-sm outline-none"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              />
              <div className="flex rounded-lg border overflow-hidden p-0.5" style={{ borderColor: 'var(--line)' }}>
                {(['paragraphs', 'sentences', 'words'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setLoremType(t);
                      generateLorem(loremCount, t);
                    }}
                    className={`px-3 py-1 text-xs capitalize font-medium ${
                      loremType === t ? 'bg-[var(--brand)] text-white' : 'hover:opacity-80'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => generateLorem(loremCount, loremType)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Generate
            </button>
          </div>

          <div className="p-4 rounded-2xl border shadow-sm relative"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <button
              onClick={() => copyToClipboard(loremOutput)}
              className="absolute top-4 right-4 px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1 shadow-sm"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Text</span>
            </button>
            <div className="prose text-xs sm:text-sm leading-relaxed whitespace-pre-line pt-8 pr-4"
              style={{ color: 'var(--ink)' }}
            >
              {loremOutput}
            </div>
          </div>
        </div>
      )}

      {/* Color Converter */}
      {tool.id === 'color-converter' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow-md space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={hexColor}
              onChange={(e) => updateFromHex(e.target.value)}
              className="w-16 h-16 rounded-xl cursor-pointer border-0"
            />
            <div className="flex-1">
              <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                COLOR PREVIEW & PICKER
              </span>
              <div
                className="h-8 rounded-lg shadow-inner flex items-center px-3 font-mono text-xs text-white font-bold"
                style={{ backgroundColor: hexColor }}
              >
                {hexColor}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {[
              { label: 'HEX', val: hexColor },
              { label: 'RGB', val: rgbColor },
              { label: 'HSL', val: hslColor },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="p-3 rounded-xl border flex items-center justify-between shadow-sm"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <span className="w-16 text-xs font-bold font-mono" style={{ color: 'var(--muted)' }}>
                  {label}
                </span>
                <span className="font-mono text-sm flex-1" style={{ color: 'var(--ink)' }}>
                  {val}
                </span>
                <button
                  onClick={() => copyToClipboard(val)}
                  className="px-2.5 py-1 text-xs rounded-lg border hover:opacity-80 flex items-center gap-1"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unix Timestamp */}
      {tool.id === 'timestamp' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow-md space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              UNIX EPOCH TIMESTAMP (SECONDS)
            </span>
            <button
              onClick={() => updateTimestamp(Math.floor(Date.now() / 1000))}
              className="text-xs text-[var(--brand)] font-bold hover:underline"
            >
              Set to Current Time
            </button>
          </div>

          <input
            type="number"
            value={timestampSec}
            onChange={(e) => updateTimestamp(Number(e.target.value))}
            className="w-full p-3 font-mono text-base font-bold rounded-xl border outline-none"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          />

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <span className="text-xs text-gray-500 block mb-1">UTC Time</span>
              <span className="font-mono text-sm font-semibold">{dateStrUtc}</span>
            </div>
            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <span className="text-xs text-gray-500 block mb-1">Local Time</span>
              <span className="font-mono text-sm font-semibold">{dateStrLocal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cron Expression Visualizer & Simulator */}
      {tool.id === 'cron-expression' && (
        <div className="max-w-4xl mx-auto">
          <CronVisualizer initialExpression={`${cronMin} ${cronHour} ${cronDom} ${cronMonth} ${cronDow}`} />
        </div>
      )}

      {/* Slugify Tool */}
      {tool.id === 'slugify' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow-md space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              INPUT TEXT
            </label>
            <input
              type="text"
              value={slugInput}
              onChange={(e) => {
                setSlugInput(e.target.value);
                updateSlug(e.target.value, slugSep);
              }}
              placeholder="Type any title or sentence..."
              className="w-full p-3 font-mono text-sm rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span style={{ color: 'var(--muted)' }}>Separator:</span>
            <button
              onClick={() => { setSlugSep('-'); updateSlug(slugInput, '-'); }}
              className={`px-3 py-1 rounded-lg border font-mono ${slugSep === '-' ? 'bg-[var(--brand)] text-white' : ''}`}
            >
              Hyphen (-)
            </button>
            <button
              onClick={() => { setSlugSep('_'); updateSlug(slugInput, '_'); }}
              className={`px-3 py-1 rounded-lg border font-mono ${slugSep === '_' ? 'bg-[var(--brand)] text-white' : ''}`}
            >
              Underscore (_)
            </button>
          </div>

          <div className="p-4 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            <span className="font-mono text-sm font-semibold break-all text-emerald-600 dark:text-emerald-400">
              {slugOutput}
            </span>
            <button
              onClick={() => copyToClipboard(slugOutput)}
              className="px-3 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 shrink-0 ml-2"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      )}

      {/* HTTP Status Code Lookup */}
      {tool.id === 'http-status-codes' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <input
            type="text"
            placeholder="Search code or description (e.g. 404, Unauthorized, Gateway)..."
            value={httpSearch}
            onChange={(e) => setHttpSearch(e.target.value)}
            className="w-full p-3 rounded-xl border text-sm outline-none shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {HTTP_CODES.filter(
              (c) =>
                !httpSearch ||
                String(c.code).includes(httpSearch) ||
                c.name.toLowerCase().includes(httpSearch.toLowerCase()) ||
                c.desc.toLowerCase().includes(httpSearch.toLowerCase())
            ).map((c) => (
              <div
                key={c.code}
                className="p-4 rounded-xl border shadow-sm space-y-1"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                    c.code >= 500
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : c.code >= 400
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : c.code >= 300
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}>
                    {c.code}
                  </span>
                  <span className="font-bold text-sm">{c.name}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Markdown Live Preview */}
      {tool.id === 'markdown-preview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor Panel */}
            <div
              className="p-4 rounded-2xl border shadow-sm flex flex-col"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  MARKDOWN EDITOR
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  {mdContent.trim().split(/\s+/).filter(Boolean).length} words · {mdContent.length} chars
                </span>
              </div>
              <textarea
                value={mdContent}
                onChange={(e) => setMdContent(e.target.value)}
                rows={16}
                className="w-full p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>

            {/* Live Rendered Preview Panel */}
            <div
              className="p-4 rounded-2xl border shadow-sm flex flex-col"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  LIVE RENDERED PREVIEW
                </span>
                <button
                  onClick={() => copyToClipboard(mdContent)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 shadow-sm"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </button>
              </div>
              <div
                className="w-full flex-1 p-4 rounded-xl border overflow-y-auto max-h-[420px] text-xs sm:text-sm prose dark:prose-invert"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                }}
                dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(mdContent) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
