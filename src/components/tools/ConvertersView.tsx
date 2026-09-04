import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, ArrowLeftRight, Download, Upload, Image as ImageIcon } from 'lucide-react';
import yaml from 'js-yaml';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface ConvertersViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const ConvertersView: React.FC<ConvertersViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'reverse'>('forward');
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // For Number base
  const [binVal, setBinVal] = useState('101010');
  const [octVal, setOctVal] = useState('52');
  const [decVal, setDecVal] = useState('42');
  const [hexVal, setHexVal] = useState('2a');

  // For Case converter
  const [caseSamples, setCaseSamples] = useState<{ [key: string]: string }>({});

  // For cURL to code
  const [targetLang, setTargetLang] = useState<'fetch' | 'axios' | 'python' | 'node'>('fetch');

  // For Image Resizer & Favicon
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgWidth, setImgWidth] = useState(300);
  const [imgHeight, setImgHeight] = useState(300);
  const [imgFormat, setImgFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [imgQuality, setImgQuality] = useState(90);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let sample = '';
    switch (tool.id) {
      case 'json-xml-converter':
        sample = '{\n  "company": "Codepackr",\n  "tools": 35,\n  "rating": 5.0\n}';
        break;
      case 'json-csv-converter':
        sample = '[\n  {"id": 1, "name": "Naveen", "role": "Engineer"},\n  {"id": 2, "name": "Sarah", "role": "Architect"}\n]';
        break;
      case 'case-converter':
        sample = 'User authentication token service';
        break;
      case 'yaml-json-converter':
        sample = 'version: "3.8"\nservices:\n  web:\n    image: node:22\n    ports:\n      - "3000:3000"';
        break;
      case 'markdown-html-converter':
        sample = '# Welcome to Codepackr\n\n- **Fast**: Runs locally\n- **Safe**: Zero data uploads\n- **Offline**: PWA enabled';
        break;
      case 'csv-xml-converter':
        sample = 'id,name,role,department\n1,Alex Rivera,Lead Architect,Cloud\n2,Taylor Chen,Security Engineer,SecOps';
        break;
      case 'html-markdown-converter':
        sample = '<h1>Developer Suite</h1>\n<p>Fast and <strong>private</strong> client-side tools.</p>\n<ul>\n  <li>Offline ready</li>\n  <li>Zero tracking</li>\n</ul>';
        break;
      case 'curl-code-converter':
        sample = `curl -X POST https://api.example.com/v1/auth \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token_xyz" \\
  -d '{"username": "admin", "role": "root"}'`;
        break;
    }
    setInput(sample);
    convert(sample, direction);
  }, [tool.id]);

  const convert = (val: string, dir: 'forward' | 'reverse') => {
    setError(null);
    if (!val.trim()) {
      setOutput('');
      return;
    }

    try {
      if (tool.id === 'json-xml-converter') {
        if (dir === 'forward') {
          // JSON to XML
          const obj = JSON.parse(val);
          const toXml = (item: any, rootName = 'root'): string => {
            if (typeof item !== 'object' || item === null) return `<${rootName}>${item}</${rootName}>`;
            let xml = `<${rootName}>`;
            for (const [k, v] of Object.entries(item)) {
              if (Array.isArray(v)) {
                v.forEach((el) => { xml += `\n  ${toXml(el, k)}`; });
              } else if (typeof v === 'object' && v !== null) {
                xml += `\n  ${toXml(v, k)}`;
              } else {
                xml += `\n  <${k}>${v}</${k}>`;
              }
            }
            xml += `\n</${rootName}>`;
            return xml;
          };
          setOutput(toXml(obj, 'root'));
        } else {
          // XML to JSON (basic tag extractor)
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(val, 'text/xml');
          const xmlToJson = (node: any): any => {
            if (node.nodeType === 3) return node.nodeValue?.trim();
            if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
              return node.childNodes[0].nodeValue?.trim();
            }
            const res: any = {};
            for (let i = 0; i < node.childNodes.length; i++) {
              const child = node.childNodes[i];
              if (child.nodeType === 1) {
                const name = child.nodeName;
                const value = xmlToJson(child);
                if (res[name]) {
                  if (!Array.isArray(res[name])) res[name] = [res[name]];
                  res[name].push(value);
                } else {
                  res[name] = value;
                }
              }
            }
            return res;
          };
          setOutput(JSON.stringify(xmlToJson(xmlDoc.documentElement), null, 2));
        }
      } else if (tool.id === 'json-csv-converter') {
        if (dir === 'forward') {
          // JSON to CSV
          const arr = JSON.parse(val);
          if (!Array.isArray(arr) || arr.length === 0) throw new Error('Expected a non-empty array of objects.');
          const headers = Object.keys(arr[0]);
          const csvLines = [
            headers.join(','),
            ...arr.map((row: any) =>
              headers.map((h) => (row[h] !== undefined ? JSON.stringify(row[h]) : '')).join(',')
            ),
          ];
          setOutput(csvLines.join('\n'));
        } else {
          // CSV to JSON
          const lines = val.trim().split('\n');
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const result = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((h, i) => {
              obj[h] = values[i] || '';
            });
            return obj;
          });
          setOutput(JSON.stringify(result, null, 2));
        }
      } else if (tool.id === 'yaml-json-converter') {
        if (dir === 'forward') {
          const parsed = yaml.load(val);
          setOutput(JSON.stringify(parsed, null, 2));
        } else {
          const parsed = JSON.parse(val);
          setOutput(yaml.dump(parsed));
        }
      } else if (tool.id === 'case-converter') {
        const words = val
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/[_\-]+/g, ' ')
          .trim()
          .split(/\s+/);

        const camel = words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        const pascal = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        const snake = words.map((w) => w.toLowerCase()).join('_');
        const kebab = words.map((w) => w.toLowerCase()).join('-');
        const constant = words.map((w) => w.toUpperCase()).join('_');
        const title = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        const dot = words.map((w) => w.toLowerCase()).join('.');

        setCaseSamples({
          'camelCase': camel,
          'PascalCase': pascal,
          'snake_case': snake,
          'kebab-case': kebab,
          'CONSTANT_CASE': constant,
          'Title Case': title,
          'dot.case': dot,
        });
      } else if (tool.id === 'markdown-html-converter') {
        if (dir === 'forward') {
          // Markdown to HTML
          let html = val
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/\n$/gim, '<br />');
          setOutput(html);
        } else {
          // HTML to Markdown
          let md = val
            .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
            .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
            .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
            .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i>(.*?)<\/i>/gi, '*$1*')
            .replace(/<code>(.*?)<\/code>/gi, '`$1`')
            .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<br\s*[\/]?>/gi, '\n');
          setOutput(md.trim());
        }
      } else if (tool.id === 'csv-xml-converter') {
        if (dir === 'forward') {
          const lines = val.trim().split(/\r?\n/).filter(Boolean);
          if (lines.length === 0) {
            setOutput('');
            return;
          }
          const headers = lines[0].split(',').map((h) => h.trim().replace(/[^a-zA-Z0-9_]/g, '_') || 'column');
          let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<records>\n';
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.trim());
            xml += '  <record>\n';
            headers.forEach((h, idx) => {
              const colVal = cols[idx] || '';
              xml += `    <${h}>${colVal}</${h}>\n`;
            });
            xml += '  </record>\n';
          }
          xml += '</records>';
          setOutput(xml);
        } else {
          const parser = new DOMParser();
          const doc = parser.parseFromString(val, 'text/xml');
          const records = doc.querySelectorAll('record');
          if (records.length === 0) {
            setOutput('No <record> elements found');
            return;
          }
          const headers = Array.from(records[0].children).map((c) => c.tagName);
          const rows: string[] = [headers.join(',')];
          records.forEach((rec) => {
            const row = headers.map((h) => rec.querySelector(h)?.textContent || '');
            rows.push(row.join(','));
          });
          setOutput(rows.join('\n'));
        }
      } else if (tool.id === 'html-markdown-converter') {
        if (dir === 'forward') {
          const md = val
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<ul[^>]*>/gi, '')
            .replace(/<\/ul>/gi, '\n')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<[^>]+>/g, '');
          setOutput(md.trim());
        } else {
          const html = val
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>');
          setOutput(html.trim());
        }
      } else if (tool.id === 'curl-code-converter') {
        generateCurlCode(val, targetLang);
      }
    } catch (e: any) {
      setError(e.message || 'Conversion error');
    }
  };

  const generateCurlCode = (curlStr: string, lang: 'fetch' | 'axios' | 'python' | 'node') => {
    // Parse url
    const urlMatch = curlStr.match(/curl\s+(?:-X\s+[A-Z]+\s+)?['"]?(https?:\/\/[^\s'"]+)/i) || curlStr.match(/['"](https?:\/\/[^\s'"]+)['"]/);
    const url = urlMatch ? urlMatch[1] : 'https://api.example.com/endpoint';

    const methodMatch = curlStr.match(/-X\s+([A-Z]+)/i);
    const method = methodMatch ? methodMatch[1] : curlStr.includes('-d ') || curlStr.includes('--data') ? 'POST' : 'GET';

    // Headers
    const headerMatches = Array.from(curlStr.matchAll(/-H\s+['"]([^'"]+)['"]/gi));
    const headers: { [k: string]: string } = {};
    headerMatches.forEach((m) => {
      const [k, ...rest] = m[1].split(':');
      if (k && rest.length) headers[k.trim()] = rest.join(':').trim();
    });

    // Body
    const dataMatch = curlStr.match(/(?:-d|--data(?:-raw)?)\s+['"]([\s\S]*?)['"](?:\s+-[A-Za-z]|\s*$)/);
    const data = dataMatch ? dataMatch[1] : '';

    if (lang === 'fetch') {
      setOutput(`// JavaScript Fetch API
fetch("${url}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 4)},
  ${data ? `body: JSON.stringify(${data})` : ''}
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));`);
    } else if (lang === 'axios') {
      setOutput(`// Axios
import axios from 'axios';

axios({
  method: '${method.toLowerCase()}',
  url: '${url}',
  headers: ${JSON.stringify(headers, null, 4)},
  ${data ? `data: ${data}` : ''}
})
  .then(response => console.log(response.data))
  .catch(error => console.error("Error:", error));`);
    } else if (lang === 'python') {
      setOutput(`# Python requests
import requests
import json

url = "${url}"
headers = ${JSON.stringify(headers, null, 4).replace(/true/g, 'True').replace(/false/g, 'False')}
${data ? `payload = json.loads('''${data}''')` : ''}

response = requests.request("${method}", url, headers=headers${data ? ', json=payload' : ''})
print(response.status_code)
print(response.json())`);
    } else if (lang === 'node') {
      setOutput(`// Node.js (native fetch)
async function makeRequest() {
  try {
    const res = await fetch("${url}", {
      method: "${method}",
      headers: ${JSON.stringify(headers, null, 4)},
      ${data ? `body: JSON.stringify(${data})` : ''}
    });
    const result = await res.json();
    console.log(result);
  } catch (err) {
    console.error(err);
  }
}
makeRequest();`);
    }
  };

  // Base Converter
  const updateBase = (val: string, radix: 2 | 8 | 10 | 16) => {
    const num = parseInt(val, radix);
    if (isNaN(num)) return;
    setBinVal(num.toString(2));
    setOctVal(num.toString(8));
    setDecVal(num.toString(10));
    setHexVal(num.toString(16));
  };

  // Image upload
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setImageSrc(src);
      const img = new Image();
      img.onload = () => {
        setImgWidth(img.width);
        setImgHeight(img.height);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const downloadProcessedImage = (w: number, h: number, filename: string) => {
    if (!imageSrc) return;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, w, h);
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL(`image/${imgFormat}`, imgQuality / 100);
      link.click();
    };
    img.src = imageSrc;
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Case Converter layout */}
      {tool.id === 'case-converter' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              INPUT PHRASE OR CODE IDENTIFIER
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                convert(e.target.value, direction);
              }}
              placeholder="Type any phrase or identifier..."
              className="w-full p-3 font-mono text-sm rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div className="space-y-2.5">
            {Object.entries(caseSamples).map(([styleName, transformed]) => (
              <div
                key={styleName}
                className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              >
                <span className="w-36 text-xs font-bold font-mono px-2.5 py-1 rounded"
                  style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand)' }}
                >
                  {styleName}
                </span>
                <span className="font-mono text-sm break-all flex-1 select-all" style={{ color: 'var(--ink)' }}>
                  {transformed}
                </span>
                <button
                  onClick={() => copyToClipboard(transformed)}
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
      ) : tool.id === 'number-base-converter' ? (
        /* Number base converter */
        <div className="p-4 rounded-2xl border shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div>
            <label className="block text-xs font-bold mb-1 uppercase" style={{ color: 'var(--muted)' }}>
              Decimal (Base 10)
            </label>
            <input
              type="text"
              value={decVal}
              onChange={(e) => { setDecVal(e.target.value); updateBase(e.target.value, 10); }}
              className="w-full p-3 font-mono text-sm rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase" style={{ color: 'var(--muted)' }}>
              Hexadecimal (Base 16)
            </label>
            <input
              type="text"
              value={hexVal}
              onChange={(e) => { setHexVal(e.target.value); updateBase(e.target.value, 16); }}
              className="w-full p-3 font-mono text-sm rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase" style={{ color: 'var(--muted)' }}>
              Binary (Base 2)
            </label>
            <input
              type="text"
              value={binVal}
              onChange={(e) => { setBinVal(e.target.value); updateBase(e.target.value, 2); }}
              className="w-full p-3 font-mono text-sm rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase" style={{ color: 'var(--muted)' }}>
              Octal (Base 8)
            </label>
            <input
              type="text"
              value={octVal}
              onChange={(e) => { setOctVal(e.target.value); updateBase(e.target.value, 8); }}
              className="w-full p-3 font-mono text-sm rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
        </div>
      ) : tool.id === 'curl-code-converter' ? (
        /* cURL to code converter */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
              INPUT CURL COMMAND
            </span>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                generateCurlCode(e.target.value, targetLang);
              }}
              rows={5}
              className="w-full p-3 font-mono text-xs rounded-xl border outline-none"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              Target Language:
            </span>
            {(['fetch', 'axios', 'python', 'node'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setTargetLang(lang);
                  generateCurlCode(input, lang);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  targetLang === lang ? 'bg-[var(--brand)] text-white' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: targetLang === lang ? 'var(--brand)' : 'var(--surface)',
                  borderColor: targetLang === lang ? 'var(--brand)' : 'var(--line)',
                }}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl border shadow-sm flex flex-col"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                GENERATED CLIENT CODE
              </span>
              <button
                onClick={() => copyToClipboard(output)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <Copy className="w-3 h-3" /> Copy Code
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              rows={12}
              className="w-full p-3 font-mono text-xs sm:text-sm rounded-xl border outline-none leading-relaxed"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>
        </div>
      ) : tool.id === 'image-resizer' || tool.id === 'favicon-generator' ? (
        /* Image tools */
        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-dashed text-center"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[var(--brand)]" />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
              Choose an image to {tool.id === 'favicon-generator' ? 'generate favicons' : 'resize & compress'}
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
              Processed client-side in your browser using HTML5 Canvas.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--brand)] file:text-white hover:file:opacity-90 cursor-pointer"
            />
          </div>

          {imageSrc && (
            <div className="p-4 rounded-2xl border shadow-sm space-y-4"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-center p-4 rounded-xl border bg-slate-900/5 max-h-60 overflow-hidden">
                <img src={imageSrc} alt="Source Preview" className="max-h-52 object-contain" />
              </div>

              {tool.id === 'favicon-generator' ? (
                <div>
                  <span className="block text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>
                    STANDARD FAVICON SIZES
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { size: 16, label: '16x16 Favicon' },
                      { size: 32, label: '32x32 Favicon' },
                      { size: 48, label: '48x48 Favicon' },
                      { size: 180, label: '180x180 Apple Touch' },
                    ].map(({ size, label }) => (
                      <div key={size} className="p-3 rounded-xl border text-center" style={{ borderColor: 'var(--line)' }}>
                        <span className="text-xs font-bold block mb-2">{label}</span>
                        <button
                          onClick={() => downloadProcessedImage(size, size, `favicon-${size}x${size}.png`)}
                          className="w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1"
                          style={{ backgroundColor: 'var(--brand)' }}
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                      WIDTH (PX)
                    </label>
                    <input
                      type="number"
                      value={imgWidth}
                      onChange={(e) => setImgWidth(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border font-mono text-xs outline-none"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                      HEIGHT (PX)
                    </label>
                    <input
                      type="number"
                      value={imgHeight}
                      onChange={(e) => setImgHeight(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border font-mono text-xs outline-none"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => downloadProcessedImage(imgWidth, imgHeight, `resized-${imgWidth}x${imgHeight}.${imgFormat}`)}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-sm"
                      style={{ backgroundColor: 'var(--brand)' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Resized Image</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Standard bi-directional converter (JSON/XML, JSON/CSV, YAML/JSON, Markdown/HTML) */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl border shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Conversion Mode:
              </span>
              <button
                onClick={() => {
                  const nextDir = direction === 'forward' ? 'reverse' : 'forward';
                  setDirection(nextDir);
                  // Swap input/output if output exists
                  if (output) {
                    setInput(output);
                    convert(output, nextDir);
                  } else {
                    convert(input, nextDir);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border hover:opacity-80 transition-colors"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>
                  {direction === 'forward'
                    ? tool.name.split('/')[0] || 'Forward'
                    : tool.name.split('/')[1] || 'Reverse'}
                </span>
              </button>
            </div>

            <button
              onClick={() => copyToClipboard(output)}
              disabled={!output}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border disabled:opacity-40"
              style={{
                backgroundColor: copied ? 'var(--ok)' : 'var(--surface)',
                color: copied ? '#ffffff' : 'var(--ink)',
                borderColor: copied ? 'var(--ok)' : 'var(--line)',
              }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Output'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl border text-xs font-mono bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border shadow-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                SOURCE INPUT
              </span>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  convert(e.target.value, direction);
                }}
                rows={12}
                className="w-full p-3 font-mono text-xs sm:text-sm rounded-xl border outline-none leading-relaxed"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
            <div className="p-4 rounded-2xl border shadow-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                CONVERTED RESULT
              </span>
              <textarea
                readOnly
                value={output}
                rows={12}
                className="w-full p-3 font-mono text-xs sm:text-sm rounded-xl border outline-none leading-relaxed"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
