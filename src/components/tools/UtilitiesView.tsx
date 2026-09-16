import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, RefreshCw, Download, QrCode as QrIcon, Lock, Globe, Clock, Sliders } from 'lucide-react';
import QRCode from 'qrcode';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { CronVisualizer } from './CronVisualizer';
import { copyText } from '../../lib/clipboard';

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

  const [uuidCount, setUuidCount] = useState(5);
  const [uuidHyphens, setUuidHyphens] = useState(true);
  const [uuidUppercase, setUuidUppercase] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);

  const [qrText, setQrText] = useState('https://codepackr.com');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const [pwLength, setPwLength] = useState(16);
  const [pwUpper, setPwUpper] = useState(true);
  const [pwLower, setPwLower] = useState(true);
  const [pwNumbers, setPwNumbers] = useState(true);
  const [pwSymbols, setPwSymbols] = useState(true);
  const [passwords, setPasswords] = useState<string[]>([]);

  const [loremType, setLoremType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [loremCount, setLoremCount] = useState(3);
  const [loremOutput, setLoremOutput] = useState('');

  const [hexColor, setHexColor] = useState('#5B52E8');
  const [rgbColor, setRgbColor] = useState('rgb(91, 82, 232)');
  const [hslColor, setHslColor] = useState('hsl(244, 78%, 62%)');

  const [timestampSec, setTimestampSec] = useState(Math.floor(Date.now() / 1000));
  const [dateStrUtc, setDateStrUtc] = useState('');
  const [dateStrLocal, setDateStrLocal] = useState('');

  const [cronMin, setCronMin] = useState('0');
  const [cronHour, setCronHour] = useState('12');
  const [cronDom, setCronDom] = useState('*');
  const [cronMonth, setCronMonth] = useState('*');
  const [cronDow, setCronDow] = useState('?');

  const [slugInput, setSlugInput] = useState('Welcome to Codepackr: 2026 Developer Toolkit!');
  const [slugSep, setSlugSep] = useState<'-' | '_'>('-');
  const [slugOutput, setSlugOutput] = useState('');

  const [httpSearch, setHttpSearch] = useState('');

  const [mdContent, setMdContent] = useState(
    `# Codepackr Markdown Preview\n\nCodepackr is a fast, **100% client-side** developer tool suite.\n\n## Features\n- **EDI Tools**: Formatter, segment viewer, JSON converter, and validator.\n- **Syntax Checkers**: JSON, XML, XSD, YAML, .env.\n- **Cryptography**: Hashes, HMAC, UUID v4, and JWT signatures.\n\n### Code Block\n\`\`\`javascript\nconst suite = "Codepackr";\nconsole.log(\`Running \${suite} securely in your browser.\`);\n\`\`\`\n\n> "All data remains on your machine. Zero network latency."`
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
    if (tool.id === 'uuid-generator') generateUuids();
    else if (tool.id === 'qr-generator') generateQrCode(qrText);
    else if (tool.id === 'password-generator') generatePasswords();
    else if (tool.id === 'lorem-ipsum') generateLorem(loremCount, loremType);
    else if (tool.id === 'color-converter') updateFromHex(hexColor);
    else if (tool.id === 'timestamp') updateTimestamp(timestampSec);
    else if (tool.id === 'slugify') updateSlug(slugInput, slugSep);
  }, [tool.id]);

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

  const generateQrCode = (text: string) => {
    if (!qrCanvasRef.current || !text) return;
    QRCode.toCanvas(qrCanvasRef.current, text, {
      width: 256,
      margin: 2,
      color: { dark: '#162033', light: '#ffffff' },
    });
  };

  useEffect(() => {
    if (tool.id === 'qr-generator') generateQrCode(qrText);
  }, [qrText, tool.id]);

  const downloadQr = () => {
    if (!qrCanvasRef.current) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = 'codepackr-qrcode.png';
    a.href = url;
    a.click();
  };

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
      for (let i = 0; i < pwLength; i++) pw += chars[arr[i] % chars.length];
      res.push(pw);
    }
    setPasswords(res);
  };

  const LOREM_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation',
    'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis',
    'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum',
  ];

  const generateLorem = (count: number, type: 'paragraphs' | 'sentences' | 'words') => {
    if (type === 'words') {
      const words: string[] = [];
      for (let i = 0; i < count; i++) words.push(LOREM_WORDS[i % LOREM_WORDS.length]);
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

  const updateFromHex = (hex: string) => {
    setHexColor(hex);
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    if (c.length === 6) {
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      setRgbColor(`rgb(${r}, ${g}, ${b})`);
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

  const updateTimestamp = (sec: number) => {
    setTimestampSec(sec);
    const d = new Date(sec * 1000);
    setDateStrUtc(d.toUTCString());
    setDateStrLocal(d.toLocaleString());
  };

  const updateSlug = (str: string, sep: '-' | '_') => {
    const slug = str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, sep).replace(/^-+|-+$/g, '');
    setSlugOutput(slug);
  };

  const copyToClipboard = async (txt: string) => {
    if (!txt) return;
    const ok = await copyText(txt);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

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
      setUuidCount(5); setUuidHyphens(true); setUuidUppercase(false); generateUuids();
    } else if (tool.id === 'qr-generator') {
      setQrText('https://codepackr.com');
    } else if (tool.id === 'password-generator') {
      setPwLength(16); setPwUpper(true); setPwLower(true); setPwNumbers(true); setPwSymbols(true); generatePasswords();
    } else if (tool.id === 'lorem-ipsum') {
      setLoremCount(3); setLoremType('paragraphs'); generateLorem(3, 'paragraphs');
    } else if (tool.id === 'color-converter') {
      updateFromHex('#5B52E8');
    } else if (tool.id === 'timestamp') {
      updateTimestamp(Math.floor(Date.now() / 1000));
    } else if (tool.id === 'cron-expression') {
      setCronMin('0'); setCronHour('12'); setCronDom('*'); setCronMonth('*'); setCronDow('?');
    } else if (tool.id === 'slugify') {
      setSlugInput(''); setSlugSep('-'); setSlugOutput('');
    } else if (tool.id === 'http-status-codes') {
      setHttpSearch('');
    } else if (tool.id === 'markdown-preview') {
      setMdContent('# Codepackr Markdown Preview\n\nStart typing markdown here...');
    }
  };

  return (
    <div>
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} onResetOrClear={handleResetOrClear} resetLabel={tool.id === 'slugify' ? 'Clear Workspace' : 'Reset to Defaults'} />

      {tool.id === 'uuid-generator' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>COUNT (1-50)</label>
                <input type="number" min={1} max={50} value={uuidCount} onChange={(e) => setUuidCount(Math.min(50, Math.max(1, Number(e.target.value))))} className="w-20 p-2 rounded-xl border text-center font-mono text-sm outline-none" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }} />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"><input type="checkbox" checked={uuidHyphens} onChange={(e) => setUuidHyphens(e.target.checked)} className="rounded text-[var(--brand)]" /><span>Hyphens</span></label>
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"><input type="checkbox" checked={uuidUppercase} onChange={(e) => setUuidUppercase(e.target.checked)} className="rounded text-[var(--brand)]" /><span>Uppercase</span></label>
              </div>
            </div>
            <button type="button" onClick={generateUuids} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-90" style={{ backgroundColor: 'var(--brand)' }}><RefreshCw className="w-3.5 h-3.5" /><span>Regenerate</span></button>
          </div>
          <div className="space-y-2">
            {uuids.map((u, i) => (
              <div key={i} className="p-3 rounded-xl border flex items-center justify-between shadow-sm font-mono text-xs sm:text-sm" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
                <span style={{ color: 'var(--ink)' }}>{u}</span>
                <button type="button" onClick={() => copyToClipboard(u)} className="px-2.5 py-1 rounded-lg border text-xs hover:opacity-80 flex items-center gap-1" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}><Copy className="w-3 h-3" /><span>Copy</span></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tool.id === 'qr-generator' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow-md space-y-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>TEXT OR URL TO ENCODE</label>
            <input type="text" value={qrText} onChange={(e) => setQrText(e.target.value)} placeholder="https://example.com or any text..." className="w-full p-3 font-mono text-sm rounded-xl border outline-none" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }} />
          </div>
          <div className="flex flex-col items-center justify-center p-6 rounded-xl border bg-white shadow-inner"><canvas ref={qrCanvasRef} className="rounded-lg shadow-sm" /></div>
          <button type="button" onClick={downloadQr} className="w-full py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-sm hover:opacity-90" style={{ backgroundColor: 'var(--brand)' }}><Download className="w-4 h-4" /><span>Download High-Res QR Code PNG</span></button>
        </div>
      )}

      {tool.id === 'password-generator' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow-md space-y-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1"><span style={{ color: 'var(--muted)' }}>LENGTH: {pwLength} CHARACTERS</span><span className="text-emerald-500 font-bold">Strong Entropy</span></div>
            <input type="range" min={8} max={64} value={pwLength} onChange={(e) => setPwLength(Number(e.target.value))} className="w-full" />
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-medium">
            {([[pwUpper, setPwUpper, 'Uppercase'], [pwLower, setPwLower, 'Lowercase'], [pwNumbers, setPwNumbers, 'Numbers'], [pwSymbols, setPwSymbols, 'Symbols']] as const).map(([val, set, label], idx) => (
              <label key={idx} className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="rounded text-[var(--brand)]" /><span>{label}</span></label>
            ))}
          </div>
          <button type="button" onClick={generatePasswords} className="w-full py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--brand)' }}><RefreshCw className="w-3.5 h-3.5" /><span>Regenerate Passwords</span></button>
          <div className="space-y-2">
            {passwords.map((pw, i) => (
              <div key={i} className="p-3 rounded-xl border flex items-center justify-between font-mono text-xs" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                <span className="truncate">{pw}</span>
                <button type="button" onClick={() => copyToClipboard(pw)} className="px-2 py-1 rounded-lg border text-xs flex items-center gap-1" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}><Copy className="w-3 h-3" />Copy</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tool.id === 'lorem-ipsum' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex flex-wrap gap-3 items-end p-4 rounded-2xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>TYPE</label>
              <select value={loremType} onChange={(e) => setLoremType(e.target.value as any)} className="p-2 rounded-xl border text-sm" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                <option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>COUNT</label>
              <input type="number" min={1} max={50} value={loremCount} onChange={(e) => setLoremCount(Math.max(1, Number(e.target.value)))} className="w-20 p-2 rounded-xl border text-sm" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }} />
            </div>
            <button type="button" onClick={() => generateLorem(loremCount, loremType)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>Generate</button>
            <button type="button" onClick={() => copyToClipboard(loremOutput)} className="px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied!' : 'Copy'}</button>
          </div>
          <textarea readOnly value={loremOutput} className="w-full h-64 p-4 rounded-2xl border font-mono text-sm" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }} />
        </div>
      )}

      {tool.id === 'color-converter' && (
        <div className="max-w-lg mx-auto p-6 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-4">
            <input type="color" value={hexColor} onChange={(e) => updateFromHex(e.target.value)} className="w-16 h-16 rounded-xl cursor-pointer border-0" />
            <div className="flex-1 space-y-2">
              {[['HEX', hexColor], ['RGB', rgbColor], ['HSL', hslColor]].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold w-10" style={{ color: 'var(--muted)' }}>{label}</span>
                  <code className="flex-1 text-xs font-mono px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>{val}</code>
                  <button type="button" onClick={() => copyToClipboard(val)} className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: 'var(--line)' }}>Copy</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tool.id === 'timestamp' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>UNIX TIMESTAMP (seconds)</label>
            <input type="number" value={timestampSec} onChange={(e) => updateTimestamp(Number(e.target.value))} className="w-full p-3 rounded-xl border font-mono text-sm" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }} />
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>UTC: </span>{dateStrUtc}</div>
            <div><span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Local: </span>{dateStrLocal}</div>
          </div>
          <button type="button" onClick={() => updateTimestamp(Math.floor(Date.now() / 1000))} className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: 'var(--brand)' }}>Set to Now</button>
        </div>
      )}

      {tool.id === 'cron-expression' && (
        <CronVisualizer initialExpression={`${cronMin} ${cronHour} ${cronDom} ${cronMonth} ${cronDow}`} />
      )}

      {tool.id === 'slugify' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>INPUT TEXT</label>
            <input type="text" value={slugInput} onChange={(e) => { setSlugInput(e.target.value); updateSlug(e.target.value, slugSep); }} className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }} />
          </div>
          <div className="flex gap-3">
            <label className="text-xs font-medium flex items-center gap-1"><input type="radio" checked={slugSep === '-'} onChange={() => { setSlugSep('-'); updateSlug(slugInput, '-'); }} /> Hyphen</label>
            <label className="text-xs font-medium flex items-center gap-1"><input type="radio" checked={slugSep === '_'} onChange={() => { setSlugSep('_'); updateSlug(slugInput, '_'); }} /> Underscore</label>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border font-mono text-sm" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
            <span>{slugOutput || '—'}</span>
            <button type="button" onClick={() => copyToClipboard(slugOutput)} className="px-2 py-1 rounded-lg border text-xs flex items-center gap-1" style={{ borderColor: 'var(--line)' }}><Copy className="w-3 h-3" />Copy</button>
          </div>
        </div>
      )}

      {tool.id === 'http-status-codes' && (
        <div className="max-w-2xl mx-auto space-y-3">
          <input type="text" value={httpSearch} onChange={(e) => setHttpSearch(e.target.value)} placeholder="Search status codes..." className="w-full p-3 rounded-xl border text-sm" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }} />
          <div className="space-y-2">
            {HTTP_CODES.filter((h) => !httpSearch || `${h.code} ${h.name} ${h.desc}`.toLowerCase().includes(httpSearch.toLowerCase())).map((h) => (
              <div key={h.code} className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
                <div className="font-semibold text-sm">{h.code} — {h.name}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tool.id === 'markdown-preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border shadow-sm flex flex-col" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>MARKDOWN EDITOR</span>
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{mdContent.split(/\s+/).filter(Boolean).length} words · {mdContent.length} chars</span>
            </div>
            <textarea value={mdContent} onChange={(e) => setMdContent(e.target.value)} className="w-full flex-1 min-h-[420px] p-4 rounded-xl border font-mono text-xs sm:text-sm outline-none resize-y" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }} spellCheck={false} />
          </div>
          <div className="p-4 rounded-2xl border shadow-sm flex flex-col" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>LIVE RENDERED PREVIEW</span>
              <button type="button" onClick={() => copyToClipboard(mdContent)} className="px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 shadow-sm transition-colors" style={{ backgroundColor: copied ? 'var(--brand)' : 'var(--surface-2)', borderColor: copied ? 'var(--brand)' : 'var(--line)', color: copied ? '#fff' : undefined }} aria-label={copied ? 'Markdown copied' : 'Copy Markdown source'}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
              </button>
            </div>
            <div className="w-full flex-1 p-4 rounded-xl border overflow-y-auto max-h-[420px] text-xs sm:text-sm prose dark:prose-invert" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }} dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(mdContent) }} />
          </div>
        </div>
      )}
    </div>
  );
};
