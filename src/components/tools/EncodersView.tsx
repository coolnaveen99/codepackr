import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, RotateCcw, ArrowDownUp, Shield, KeyRound, Image as ImageIcon, CheckCircle2, Loader2, Cpu, Upload, Download, Sparkles, Trash2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';
import { JwtDebugger } from './JwtDebugger';
import { popSmartPastePayload } from '../../lib/workspace';
import { computeHashesInWorker, simpleMd5 } from '../../lib/workerBridge';
import { downloadContentAsFile } from '../../lib/fileIO';
import { EditorPaneHeader } from '../common/EditorPaneHeader';

interface EncodersViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
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

  // For Hash generator (Web Worker backed)
  const [hashes, setHashes] = useState<{ [key: string]: string }>({});
  const [isHashing, setIsHashing] = useState(false);

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
    const pendingTransfer = popSmartPastePayload(tool.id) || popSmartPastePayload('encoders') || initialInput;
    if (pendingTransfer) {
      sample = pendingTransfer;
      if (tool.id === 'base64') {
        // If it looks like base64 string, set mode to decode
        if (/^[A-Za-z0-9+/=]+$/.test(pendingTransfer.trim())) {
          setMode('decode');
          setInput(sample);
          processInput(sample, 'decode');
          return;
        }
      } else if (tool.id === 'url-encode') {
        if (pendingTransfer.includes('%') || pendingTransfer.startsWith('http')) {
          setMode('decode');
          setInput(sample);
          processInput(sample, 'decode');
          return;
        }
      }
    } else {
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
    }
    setInput(sample);
    processInput(sample, mode);
  }, [tool.id, initialInput]);

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
        setIsHashing(true);
        try {
          const res = await computeHashesInWorker(val);
          if (res.success && res.data) {
            setHashes(res.data);
          } else {
            setError(res.error || 'Failed to compute cryptographic hashes');
          }
        } catch (err: any) {
          setError(err.message || 'Worker hashing execution failed');
        } finally {
          setIsHashing(false);
        }
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadSample = () => {
    const sample =
      tool.id === 'base64'
        ? mode === 'encode'
          ? 'Hello from CodePackr developer suite!'
          : 'SGVsbG8gZnJvbSBDb2RlUGFja3IgZGV2ZWxvcGVyIHN1aXRlIQ=='
        : tool.id === 'url-encode'
        ? mode === 'encode'
          ? 'https://www.codepackr.com/search?q=developer tools & privacy=100%'
          : 'https%3A%2F%2Fwww.codepackr.com%2Fsearch%3Fq%3Ddeveloper%20tools%20%26%20privacy%3D100%25'
        : tool.id === 'html-entity'
        ? mode === 'encode'
          ? '<div class="alert">"Warning" & \'Info\' © 2026</div>'
          : '&lt;div class=&quot;alert&quot;&gt;&quot;Warning&quot; &amp; &#39;Info&#39; &copy; 2026&lt;/div&gt;'
        : 'Sample text';
    setInput(sample);
    processInput(sample, mode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = (ev.target?.result as string) || '';
      setInput(content);
      processInput(content, mode);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleDownloadOutput = () => {
    if (!output) return;
    downloadContentAsFile(output, `${tool.id}-${mode}.txt`);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleClearWorkspace = () => {
    setInput('');
    setOutput('');
    setError(null);
    setHashes({});
    setJwtHeader('');
    setJwtPayload('');
    setJwtExpired(null);
    setImagePreview(null);
  };

  return (
    <div>
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleClearWorkspace}
        resetLabel="Clear Workspace"
        onUploadFile={(content) => {
          setInput(content);
          processInput(content, mode);
        }}
        downloadContent={output || input}
        inputContent={input}
        outputContent={output}
        hideFileActions={true}
      />

      {/* Mode & Action Toolbar for 2-column encoders */}
      {(tool.id === 'base64' || tool.id === 'url-encode' || tool.id === 'html-entity') && (
        <div
          className="p-3.5 rounded-2xl border space-y-3 shadow-xs mb-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          {/* Row 1: Mode Selection & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold mr-1" style={{ color: 'var(--muted)' }}>
                Mode:
              </span>
              <button
                onClick={() => {
                  setMode('encode');
                  processInput(input, 'encode');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'encode'
                    ? 'bg-[var(--brand)] text-white shadow-xs'
                    : 'border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] hover:opacity-80'
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => {
                  setMode('decode');
                  processInput(input, 'decode');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'decode'
                    ? 'bg-[var(--brand)] text-white shadow-xs'
                    : 'border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] hover:opacity-80'
                }`}
              >
                Decode
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <span style={{ color: 'var(--muted)' }}>Active Mode:</span>
              <strong className="capitalize font-semibold text-[var(--brand)]">{mode}</strong>
            </div>
          </div>

          {/* Row 2: File Import, Sample, Clear (Moved to Next Line) & Export / Copy */}
          <div
            className="pt-2.5 border-t flex flex-wrap items-center justify-between gap-3"
            style={{ borderColor: 'var(--line)' }}
          >
            {/* Left Action Group */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.json,.xml,.html,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                title="Import file to encode/decode"
              >
                <Upload className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>Import File</span>
              </button>

              <button
                onClick={handleLoadSample}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                title="Load sample test data"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sample</span>
              </button>

              {input && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--muted)' }}
                  title="Clear input and output"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Right Action Group */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadOutput}
                disabled={!output}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white shadow-xs disabled:opacity-40 cursor-pointer"
                style={{ backgroundColor: 'var(--brand)' }}
                title={`Export converted result as ${tool.id}-${mode}.txt`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export {tool.id}-{mode}.txt</span>
              </button>

              <button
                onClick={() => copyToClipboard(output)}
                disabled={!output}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border disabled:opacity-40 cursor-pointer"
                style={{
                  backgroundColor: copied ? 'var(--ok, #10b981)' : 'var(--surface-2)',
                  color: copied ? '#ffffff' : 'var(--ink)',
                  borderColor: copied ? 'var(--ok, #10b981)' : 'var(--line)',
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Output'}</span>
              </button>
            </div>
          </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                INPUT TEXT
              </label>
              <div className="flex items-center gap-2">
                {isHashing ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Worker computing...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted)]">
                    <Cpu className="w-3 h-3 text-[var(--brand)]" />
                    <span>Web Worker Thread</span>
                  </span>
                )}
              </div>
            </div>
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

          {isHashing && (
            <div className="p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium text-[var(--brand)] shadow-sm animate-pulse"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--brand)' }}
            >
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Computing MD5 &amp; SHA cryptographic hashes in background Web Worker thread...</span>
            </div>
          )}

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
      ) : tool.id === 'jwt-decoder' || tool.id === 'jwt-encoder' ? (
        <JwtDebugger
          initialMode={tool.id === 'jwt-encoder' ? 'encode' : 'decode'}
          initialToken={input}
        />
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
            <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
              <EditorPaneHeader
                idPrefix="encoder-input"
                title="INPUT"
                badge={mode === 'encode' ? 'PLAIN' : 'ENCODED'}
                charCount={input.length}
                lineCount={input ? input.split('\n').length : 0}
              />
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
            <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-2)' }}>
              <EditorPaneHeader
                idPrefix="encoder-output"
                title={`RESULT (${mode.toUpperCase()})`}
                badge={mode === 'encode' ? 'ENCODED' : 'DECODED'}
                charCount={output.length}
                lineCount={output ? output.split('\n').length : 0}
              />
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
