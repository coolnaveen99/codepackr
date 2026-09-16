import { ToolDef } from '../types';

/**
 * Reads a user-selected File as text using FileReader with UTF-8 decoding.
 * Handles size checks, error handling, and basic metadata extraction.
 */
export async function readUploadedFile(file: File): Promise<{
  content: string;
  name: string;
  size: number;
  type: string;
  lineCount: number;
}> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided.'));
      return;
    }

    // Guard against massive binary files (warn/block over 15MB for client browser stability)
    const MAX_BYTES = 15 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      reject(
        new Error(
          `File "${file.name}" is too large (${formatFileSize(file.size)}). Please select a file under 15MB for in-browser processing.`
        )
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const lineCount = result.split('\n').length;
        resolve({
          content: result,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          lineCount,
        });
      } else {
        reject(new Error('Failed to read file as text.'));
      }
    };

    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file.'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Triggers a browser file download using a Blob and temporary object URL.
 */
export function downloadContentAsFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error('Failed to trigger download:', err);
    return false;
  }
}

/**
 * Human-readable byte size formatter.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Infers an appropriate filename and MIME type for a given tool.
 */
export function inferToolFilename(
  tool?: ToolDef | null,
  isOutput: boolean = true
): { filename: string; mimeType: string; extension: string } {
  const dateStr = new Date().toISOString().slice(0, 10);
  const toolId = tool?.id || 'codepackr';
  const category = tool?.category || 'data';

  // 1. Tool ID specific mappings
  switch (toolId) {
    case 'json-formatter':
    case 'json-validator':
    case 'json-minify':
    case 'mock-json-generator':
    case 'json-definition-generator':
      return {
        filename: `codepackr-${toolId}-${dateStr}.json`,
        mimeType: 'application/json',
        extension: '.json',
      };

    case 'xml-formatter':
    case 'xml-validator':
    case 'xsd-validator':
    case 'xml-path':
      return {
        filename: `codepackr-${toolId}-${dateStr}.xml`,
        mimeType: 'application/xml',
        extension: '.xml',
      };

    case 'edi-x12-formatter':
    case 'edi-validator':
    case 'edi-segment-viewer':
      return {
        filename: `codepackr-${toolId}-${dateStr}.edi`,
        mimeType: 'text/plain',
        extension: '.edi',
      };

    case 'edi-to-json':
      return {
        filename: `codepackr-edi-converted-${dateStr}.${isOutput ? 'json' : 'edi'}`,
        mimeType: isOutput ? 'application/json' : 'text/plain',
        extension: isOutput ? '.json' : '.edi',
      };

    case 'sql-formatter':
      return {
        filename: `codepackr-query-${dateStr}.sql`,
        mimeType: 'application/sql',
        extension: '.sql',
      };

    case 'yaml-formatter':
    case 'yaml-validator':
      return {
        filename: `codepackr-${toolId}-${dateStr}.yaml`,
        mimeType: 'text/yaml',
        extension: '.yaml',
      };

    case 'html-formatter':
      return {
        filename: `codepackr-markup-${dateStr}.html`,
        mimeType: 'text/html',
        extension: '.html',
      };

    case 'css-formatter':
      return {
        filename: `codepackr-stylesheet-${dateStr}.css`,
        mimeType: 'text/css',
        extension: '.css',
      };

    case 'js-minifier':
      return {
        filename: `codepackr-script-${dateStr}.js`,
        mimeType: 'application/javascript',
        extension: '.js',
      };

    case 'markdown-preview':
      return {
        filename: `codepackr-document-${dateStr}.md`,
        mimeType: 'text/markdown',
        extension: '.md',
      };

    case 'cron-expression':
      return {
        filename: `codepackr-crontab-${dateStr}.txt`,
        mimeType: 'text/plain',
        extension: '.txt',
      };

    case 'base64-encoder':
    case 'base64-decoder':
    case 'url-encode':
    case 'url-decode':
    case 'hash-generator':
    case 'hmac-generator':
      return {
        filename: `codepackr-${toolId}-${dateStr}.txt`,
        mimeType: 'text/plain',
        extension: '.txt',
      };

    default:
      break;
  }

  // 2. Category level fallbacks
  switch (category) {
    case 'edi':
      return {
        filename: `codepackr-${toolId}-${dateStr}.edi`,
        mimeType: 'text/plain',
        extension: '.edi',
      };
    case 'xml':
      return {
        filename: `codepackr-${toolId}-${dateStr}.xml`,
        mimeType: 'application/xml',
        extension: '.xml',
      };
    case 'formatters':
      return {
        filename: `codepackr-${toolId}-${dateStr}.txt`,
        mimeType: 'text/plain',
        extension: '.txt',
      };
    default:
      return {
        filename: `codepackr-${toolId}-${dateStr}.txt`,
        mimeType: 'text/plain',
        extension: '.txt',
      };
  }
}
