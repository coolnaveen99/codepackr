import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, ArrowLeftRight, Download, Upload, Image as ImageIcon, Trash2, FileText, Sparkles, X, FileCode } from 'lucide-react';
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

  // File upload state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const getSample = (toolId: string, dir: 'forward' | 'reverse') => {
    switch (toolId) {
      case 'json-xml-converter':
        return dir === 'forward'
          ? '{\n  "company": "Codepackr",\n  "tools": 35,\n  "rating": 5.0,\n  "services": ["API", "EDI", "Formatting"]\n}'
          : '<company>\n  <name>Codepackr</name>\n  <tools>35</tools>\n  <rating>5.0</rating>\n</company>';
      case 'json-csv-converter':
        return dir === 'forward'
          ? '[\n  {"id": 1, "name": "Naveen", "role": "Engineer", "department": "Core"},\n  {"id": 2, "name": "Sarah", "role": "Architect", "department": "Cloud"},\n  {"id": 3, "name": "Alex", "role": "Lead", "department": "Security"}\n]'
          : 'id,name,role,department\n1,Naveen,Engineer,Core\n2,Sarah,Architect,Cloud\n3,Alex,Lead,Security';
      case 'case-converter':
        return 'User authentication token service for cloud applications';
      case 'yaml-json-converter':
        return dir === 'forward'
          ? 'version: "3.8"\nservices:\n  web:\n    image: node:22\n    ports:\n      - "3000:3000"\n    environment:\n      NODE_ENV: production'
          : '{\n  "version": "3.8",\n  "services": {\n    "web": {\n      "image": "node:22",\n      "ports": ["3000:3000"],\n      "environment": {\n        "NODE_ENV": "production"\n      }\n    }\n  }\n}';
      case 'markdown-html-converter':
        return dir === 'forward'
          ? '# Welcome to Codepackr\n\nCodepackr is a fast, **100% client-side** developer tool suite.\n\n- **Fast**: Runs locally in your browser\n- **Safe**: Zero data uploads\n- **Offline**: PWA enabled'
          : '<h1>Welcome to Codepackr</h1>\n<p>Codepackr is a fast, <strong>100% client-side</strong> developer tool suite.</p>\n<ul>\n  <li>Fast: Runs locally in your browser</li>\n  <li>Safe: Zero data uploads</li>\n  <li>Offline: PWA enabled</li>\n</ul>';
      case 'csv-xml-converter':
        return dir === 'forward'
          ? 'id,name,role,department\n1,Alex Rivera,Lead Architect,Cloud\n2,Taylor Chen,Security Engineer,SecOps\n3,Jordan Lee,Data Analyst,Analytics'
          : '<?xml version="1.0" encoding="UTF-8"?>\n<records>\n  <record>\n    <id>1</id>\n    <name>Alex Rivera</name>\n    <role>Lead Architect</role>\n    <department>Cloud</department>\n  </record>\n  <record>\n    <id>2</id>\n    <name>Taylor Chen</name>\n    <role>Security Engineer</role>\n    <department>SecOps</department>\n  </record>\n</records>';
      case 'html-markdown-converter':
        return dir === 'forward'
          ? '<h1>Developer Suite</h1>\n<p>Fast and <strong>private</strong> client-side tools.</p>\n<ul>\n  <li>Offline ready</li>\n  <li>Zero tracking</li>\n</ul>'
          : '# Developer Suite\n\nFast and **private** client-side tools.\n\n- Offline ready\n- Zero tracking';
      case 'curl-code-converter':
        return `curl -X POST https://api.example.com/v1/auth \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token_xyz" \\
  -d '{"username": "admin", "role": "root"}'`;
      default:
        return '';
    }
  };

  useEffect(() => {
    setUploadedFileName(null);
    setUploadedFileSize(null);
    const sample = getSample(tool.id, direction);
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
          const parseErrors = xmlDoc.getElementsByTagName('parsererror');
          if (parseErrors.length > 0) {
            throw new Error(parseErrors[0].textContent || 'Invalid XML syntax');
          }
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
    const urlMatch = curlStr.match(/curl\s+(?:-X\s+[A-Z]+\s+)?['"]?(https?:\/\/[^\s'"]+)/i) || curlStr.match(/['"](https?:\/\/[^\s'"]+)['"]/);
    const url = urlMatch ? urlMatch[1] : 'https://api.example.com/endpoint';

    const methodMatch = curlStr.match(/-X\s+([A-Z]+)/i);
    const method = methodMatch ? methodMatch[1] : curlStr.includes('-d ') || curlStr.includes('--data') ? 'POST' : 'GET';

    const headerMatches = Array.from(curlStr.matchAll(/-H\s+['"]([^'"]+)['"]/gi));
    const headers: { [k: string]: string } = {};
    headerMatches.forEach((m) => {
      const [k, ...rest] = m[1].split(':');
      if (k && rest.length) headers[k.trim()] = rest.join(':').trim();
    });

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
  const handleImageFile = (file: File) => {
    if (!file) return;
    setImageFileName(file.name);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
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

  // File Upload Handlers (for Text/Data Converters)
  const getInputAccept = () => {
    switch (tool.id) {
      case 'json-xml-converter':
        return direction === 'forward' ? '.json,.txt,application/json' : '.xml,.txt,application/xml,text/xml';
      case 'json-csv-converter':
        return direction === 'forward' ? '.json,.txt,application/json' : '.csv,.tsv,.txt,text/csv';
      case 'csv-xml-converter':
        return direction === 'forward' ? '.csv,.tsv,.txt,text/csv' : '.xml,.txt,application/xml,text/xml';
      case 'yaml-json-converter':
        return direction === 'forward' ? '.yaml,.yml,.txt,text/yaml' : '.json,.txt,application/json';
      case 'markdown-html-converter':
        return direction === 'forward' ? '.md,.markdown,.txt,text/markdown' : '.html,.htm,.txt,text/html';
      case 'html-markdown-converter':
        return direction === 'forward' ? '.html,.htm,.txt,text/html' : '.md,.markdown,.txt,text/markdown';
      case 'curl-code-converter':
        return '.sh,.bash,.txt,.curl';
      case 'case-converter':
        return '.txt,.text,.json,.md';
      default:
        return '.txt,*/*';
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please select a file under 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setInput(content);
        setUploadedFileName(file.name);
        setUploadedFileSize(file.size);
        convert(content, direction);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the uploaded file.');
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // reset input so the same file can be re-uploaded if changed
    if (e.target) e.target.value = '';
  };

  const clearInput = () => {
    setInput('');
    setOutput('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setError(null);
  };

  const loadSampleData = () => {
    const sample = getSample(tool.id, direction);
    setInput(sample);
    setUploadedFileName(null);
    setUploadedFileSize(null);
    convert(sample, direction);
  };

  // Converted File Download Handlers
  const getOutputFilename = () => {
    let base = 'converted';
    if (uploadedFileName) {
      const dotIdx = uploadedFileName.lastIndexOf('.');
      base = dotIdx > 0 ? uploadedFileName.substring(0, dotIdx) : uploadedFileName;
    }

    if (tool.id === 'json-xml-converter') {
      return direction === 'forward' ? `${base}.xml` : `${base}.json`;
    }
    if (tool.id === 'json-csv-converter') {
      return direction === 'forward' ? `${base}.csv` : `${base}.json`;
    }
    if (tool.id === 'csv-xml-converter') {
      return direction === 'forward' ? `${base}.xml` : `${base}.csv`;
    }
    if (tool.id === 'yaml-json-converter') {
      return direction === 'forward' ? `${base}.json` : `${base}.yaml`;
    }
    if (tool.id === 'markdown-html-converter') {
      return direction === 'forward' ? `${base}.html` : `${base}.md`;
    }
    if (tool.id === 'html-markdown-converter') {
      return direction === 'forward' ? `${base}.md` : `${base}.html`;
    }
    if (tool.id === 'curl-code-converter') {
      switch (targetLang) {
        case 'fetch': return `${base}-fetch.js`;
        case 'axios': return `${base}-axios.js`;
        case 'python': return `${base}-requests.py`;
        case 'node': return `${base}-node.js`;
      }
    }
    if (tool.id === 'case-converter') {
      return `${base}-cases.txt`;
    }
    return `${base}.txt`;
  };

  const getOutputMimeType = () => {
    if (tool.id === 'json-xml-converter') return direction === 'forward' ? 'application/xml' : 'application/json';
    if (tool.id === 'json-csv-converter') return direction === 'forward' ? 'text/csv' : 'application/json';
    if (tool.id === 'csv-xml-converter') return direction === 'forward' ? 'application/xml' : 'text/csv';
    if (tool.id === 'yaml-json-converter') return direction === 'forward' ? 'application/json' : 'text/yaml';
    if (tool.id === 'markdown-html-converter') return direction === 'forward' ? 'text/html' : 'text/markdown';
    if (tool.id === 'html-markdown-converter') return direction === 'forward' ? 'text/markdown' : 'text/html';
    if (tool.id === 'curl-code-converter') return targetLang === 'python' ? 'text/x-python' : 'text/javascript';
    return 'text/plain';
  };

  const downloadOutputFile = () => {
    if (!output) return;
    const filename = getOutputFilename();
    const mimeType = getOutputMimeType();
    const blob = new Blob([output], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllCases = () => {
    if (Object.keys(caseSamples).length === 0) return;
    const textLines = Object.entries(caseSamples).map(([k, v]) => `${k}:\n${v}\n`).join('\n');
    const blob = new Blob([textLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'case-conversions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
          {/* Action Toolbar */}
          <div
            className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.text,.json,.md"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                title="Upload a text document to convert cases"
              >
                <Upload className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>Upload File</span>
              </button>

              <button
                onClick={loadSampleData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                title="Load sample identifier"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sample</span>
              </button>

              {input && (
                <button
                  onClick={clearInput}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--muted)' }}
                  title="Clear input"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <button
              onClick={downloadAllCases}
              disabled={Object.keys(caseSamples).length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white shadow-sm disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All Cases (.txt)</span>
            </button>
          </div>

          {/* Uploaded File Badge */}
          {uploadedFileName && (
            <div
              className="p-2.5 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--brand)]" />
                <span className="font-semibold text-[var(--ink)]">{uploadedFileName}</span>
                {uploadedFileSize && (
                  <span className="text-[var(--muted)]">({formatFileSize(uploadedFileSize)})</span>
                )}
              </div>
              <button
                onClick={() => { setUploadedFileName(null); setUploadedFileSize(null); }}
                className="text-[var(--muted)] hover:text-rose-500 p-0.5 rounded"
                title="Remove file attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div
            className={`p-4 rounded-2xl border shadow-sm transition-all ${
              isDragging ? 'ring-2 ring-[var(--brand)] border-transparent' : ''
            }`}
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                INPUT PHRASE OR CODE IDENTIFIER (DRAG & DROP OR TYPE)
              </label>
              <span className="text-[10px] text-[var(--muted)]">
                {input.length} chars
              </span>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                convert(e.target.value, direction);
              }}
              placeholder="Type any phrase or drag a file here..."
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
                  style={{ backgroundColor: 'var(--brand-light, rgba(91,82,232,0.1))', color: 'var(--brand)' }}
                >
                  {styleName}
                </span>
                <span className="font-mono text-sm break-all flex-1 select-all" style={{ color: 'var(--ink)' }}>
                  {transformed}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => copyToClipboard(transformed)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80 flex items-center gap-1 cursor-pointer"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([transformed], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${styleName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border hover:opacity-80 flex items-center gap-1 cursor-pointer"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                    title={`Download ${styleName}`}
                  >
                    <Download className="w-3 h-3 text-[var(--brand)]" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : tool.id === 'number-base-converter' ? (
        /* Number base converter */
        <div className="p-4 rounded-2xl border shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Bi-Directional Radix Calculation
            </span>
            <button
              onClick={() => {
                const report = `Codepackr Number Base Conversion:
Decimal (Base 10): ${decVal}
Hexadecimal (Base 16): 0x${hexVal.toUpperCase()}
Binary (Base 2): ${binVal}
Octal (Base 8): ${octVal}
Timestamp: ${new Date().toISOString()}
`;
                const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `number-base-${decVal}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl text-white shadow-sm cursor-pointer"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <Download className="w-3 h-3" />
              <span>Download Report (.txt)</span>
            </button>
          </div>

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
          {/* Action Toolbar */}
          <div
            className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".sh,.bash,.txt,.curl"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <Upload className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>Upload cURL (.sh)</span>
              </button>

              <button
                onClick={loadSampleData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sample</span>
              </button>

              {input && (
                <button
                  onClick={clearInput}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--muted)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <button
              onClick={downloadOutputFile}
              disabled={!output}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white shadow-sm disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {getOutputFilename()}</span>
            </button>
          </div>

          {/* Uploaded File Badge */}
          {uploadedFileName && (
            <div
              className="p-2.5 px-3.5 rounded-xl border flex items-center justify-between text-xs font-medium"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[var(--brand)]" />
                <span className="font-semibold text-[var(--ink)]">{uploadedFileName}</span>
                {uploadedFileSize && (
                  <span className="text-[var(--muted)]">({formatFileSize(uploadedFileSize)})</span>
                )}
              </div>
              <button
                onClick={() => { setUploadedFileName(null); setUploadedFileSize(null); }}
                className="text-[var(--muted)] hover:text-rose-500 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div
            className={`p-4 rounded-2xl border shadow-sm transition-all ${
              isDragging ? 'ring-2 ring-[var(--brand)] border-transparent' : ''
            }`}
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                INPUT CURL COMMAND (DRAG & DROP SCRIPT FILE HERE)
              </span>
              <span className="text-[10px] text-[var(--muted)]">
                {input.length} chars
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                generateCurlCode(e.target.value, targetLang);
              }}
              rows={5}
              placeholder="Paste curl command or drop a .sh / .curl file..."
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
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadOutputFile}
                  disabled={!output}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  <Download className="w-3.5 h-3.5 text-[var(--brand)]" />
                  <span>Download Code</span>
                </button>
                <button
                  onClick={() => copyToClipboard(output)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 cursor-pointer"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
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
          <div
            className={`p-8 rounded-2xl border border-dashed text-center transition-all cursor-pointer ${
              isImageDragging ? 'ring-2 ring-[var(--brand)] bg-[var(--surface-2)]' : ''
            }`}
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            onDragOver={(e) => { e.preventDefault(); setIsImageDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsImageDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsImageDragging(false);
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith('image/')) {
                handleImageFile(file);
              }
            }}
            onClick={() => imageInputRef.current?.click()}
          >
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <ImageIcon className="w-10 h-10 mx-auto mb-2 text-[var(--brand)]" />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
              Click to select or drag & drop image here
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
              Supports PNG, JPEG, WebP, SVG, and GIF. 100% processed client-side via HTML5 Canvas.
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-sm"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              Choose Image File
            </button>
          </div>

          {imageSrc && (
            <div className="p-4 rounded-2xl border shadow-sm space-y-4"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              {imageFileName && (
                <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                  <span>Source: {imageFileName} ({imgWidth} × {imgHeight} px)</span>
                  <button
                    onClick={() => { setImageSrc(null); setImageFileName(null); }}
                    className="text-rose-500 hover:opacity-80 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center p-4 rounded-xl border bg-slate-900/5 max-h-60 overflow-hidden">
                <img src={imageSrc} alt="Source Preview" className="max-h-52 object-contain" />
              </div>

              {tool.id === 'favicon-generator' ? (
                <div>
                  <span className="block text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>
                    STANDARD FAVICON SIZES (CLICK TO DOWNLOAD)
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
                          className="w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1 cursor-pointer shadow-sm"
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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                      FORMAT
                    </label>
                    <select
                      value={imgFormat}
                      onChange={(e) => setImgFormat(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border text-xs outline-none"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    >
                      <option value="png">PNG (Lossless)</option>
                      <option value="jpeg">JPEG (Compressed)</option>
                      <option value="webp">WebP (Modern)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => downloadProcessedImage(imgWidth, imgHeight, `resized-${imgWidth}x${imgHeight}.${imgFormat}`)}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      style={{ backgroundColor: 'var(--brand)' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Resized</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Standard bi-directional converter (JSON/XML, JSON/CSV, YAML/JSON, Markdown/HTML, CSV/XML, HTML/Markdown) */
        <div className="space-y-4">
          {/* Action Control Bar */}
          <div
            className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
          >
            {/* Left Action Group */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold mr-1" style={{ color: 'var(--muted)' }}>
                Mode:
              </span>
              <button
                onClick={() => {
                  const nextDir = direction === 'forward' ? 'reverse' : 'forward';
                  setDirection(nextDir);
                  // Swap input/output if output exists
                  if (output) {
                    setInput(output);
                    setUploadedFileName(null);
                    setUploadedFileSize(null);
                    convert(output, nextDir);
                  } else {
                    convert(input, nextDir);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
                title="Switch conversion direction"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>
                  {direction === 'forward'
                    ? tool.name.split('/')[0] || 'Forward'
                    : tool.name.split('/')[1] || 'Reverse'}
                </span>
              </button>

              <div className="h-4 w-px bg-[var(--line)] mx-1 hidden sm:block" />

              {/* Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                accept={getInputAccept()}
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                title="Upload file to convert"
              >
                <Upload className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>Upload File</span>
              </button>

              {/* Sample Data */}
              <button
                onClick={loadSampleData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                title="Load sample test data"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sample</span>
              </button>

              {/* Clear Input */}
              {input && (
                <button
                  onClick={clearInput}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--muted)' }}
                  title="Clear all data"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Right Action Group */}
            <div className="flex items-center gap-2">
              <button
                onClick={downloadOutputFile}
                disabled={!output}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white shadow-sm disabled:opacity-40 cursor-pointer"
                style={{ backgroundColor: 'var(--brand)' }}
                title={`Download converted ${getOutputFilename()}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {getOutputFilename()}</span>
              </button>

              <button
                onClick={() => copyToClipboard(output)}
                disabled={!output}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border disabled:opacity-40 cursor-pointer"
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

          {/* Uploaded File Notification Banner */}
          {uploadedFileName && (
            <div
              className="p-2.5 px-4 rounded-xl border flex items-center justify-between text-xs font-medium"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--brand)]" />
                <span className="font-semibold text-[var(--ink)]">{uploadedFileName}</span>
                {uploadedFileSize && (
                  <span className="text-[var(--muted)]">({formatFileSize(uploadedFileSize)})</span>
                )}
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                  Loaded & Converted
                </span>
              </div>
              <button
                onClick={() => { setUploadedFileName(null); setUploadedFileSize(null); }}
                className="text-[var(--muted)] hover:text-rose-500 p-0.5 rounded cursor-pointer"
                title="Remove file attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl border text-xs font-mono bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200">
              <span className="font-bold">Syntax/Conversion Warning:</span> {error}
            </div>
          )}

          {/* Bi-directional Editor Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Column with Drag & Drop Zone */}
            <div
              className={`p-4 rounded-2xl border shadow-sm flex flex-col transition-all relative ${
                isDragging ? 'ring-2 ring-[var(--brand)] border-transparent' : ''
              }`}
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    SOURCE INPUT
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                    {direction === 'forward' ? tool.name.split('/')[0] : tool.name.split('/')[1] || 'Input'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                    {input.length} chars • {input ? input.split('\n').length : 0} lines
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 rounded text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    title="Upload file into editor"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isDragging && (
                <div className="absolute inset-0 bg-[var(--surface)]/90 backdrop-blur-xs rounded-2xl border-2 border-dashed border-[var(--brand)] z-10 flex flex-col items-center justify-center pointer-events-none">
                  <Upload className="w-8 h-8 text-[var(--brand)] mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-[var(--ink)]">Drop your file to convert</p>
                  <p className="text-xs text-[var(--muted)]">{getInputAccept()}</p>
                </div>
              )}

              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  convert(e.target.value, direction);
                }}
                placeholder={`Paste content or drop a ${getInputAccept()} file here...`}
                rows={14}
                className="w-full p-3 font-mono text-xs sm:text-sm rounded-xl border outline-none leading-relaxed resize-y"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />

              <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: 'var(--muted)' }}>
                <span>Drag & drop files directly or click Upload</span>
                {uploadedFileName && <span>Source: {uploadedFileName}</span>}
              </div>
            </div>

            {/* Output Column */}
            <div
              className="p-4 rounded-2xl border shadow-sm flex flex-col"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    CONVERTED RESULT
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                    {direction === 'forward' ? tool.name.split('/')[1] || 'Output' : tool.name.split('/')[0]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                    {output.length} chars • {output ? output.split('\n').length : 0} lines
                  </span>
                  <button
                    onClick={downloadOutputFile}
                    disabled={!output}
                    className="p-1 rounded text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-30 cursor-pointer"
                    title={`Download ${getOutputFilename()}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(output)}
                    disabled={!output}
                    className="p-1 rounded text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-30 cursor-pointer"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={output}
                placeholder="Converted output will appear here automatically..."
                rows={14}
                className="w-full p-3 font-mono text-xs sm:text-sm rounded-xl border outline-none leading-relaxed resize-y"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />

              <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: 'var(--muted)' }}>
                <span>Ready to download or copy</span>
                <span className="font-mono font-medium text-[var(--brand)]">{getOutputFilename()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
