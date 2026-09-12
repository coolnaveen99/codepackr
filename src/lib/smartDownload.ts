/**
 * CodePackr Global Smart File Name & Download Service
 * 
 * 100% Privacy-First, Client-Side Download & Filename Manager
 * Provides intelligent, context-aware filename suggestions, extension validation,
 * safe sanitization (traversal/illegal characters), and reliable browser downloads.
 */

export interface SuggestFilenameOptions {
  originalName?: string;
  operation?: string; // e.g. 'resize-compress', 'format', 'convert', 'validate', 'edi-850', 'export'
  outputFormat?: string; // e.g. 'jpeg', 'jpg', 'png', 'webp', 'json', 'edi', 'xml', 'csv', 'txt', 'pdf', 'zip'
  metadata?: {
    width?: number;
    height?: number;
    maxBytes?: number;
    actualBytes?: number;
    transactionType?: string; // e.g. '850', '810', '856', 'ORDERS'
    controlNumber?: string;
    docType?: string;
    [key: string]: any;
  };
  toolContext?: string;
}

export interface FilenameSuggestionResult {
  defaultName: string;
  suggestions: string[];
  extension: string;
  mimeType: string;
  baseName: string;
}

export interface DownloadFileOptions {
  file: Blob | File | string;
  filename: string;
  mimeType?: string;
  expectedExtension?: string;
}

/**
 * Standard MIME types map for common file extensions
 */
export const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  json: 'application/json',
  xml: 'application/xml',
  edi: 'application/edi-x12',
  x12: 'application/edi-x12',
  txt: 'text/plain',
  csv: 'text/csv',
  pdf: 'application/pdf',
  zip: 'application/zip',
  html: 'text/html',
  sql: 'text/plain',
  yaml: 'text/yaml',
  yml: 'text/yaml',
};

/**
 * Standard extensions by MIME type
 */
export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/edi-x12': 'edi',
  'application/edifact': 'edi',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'text/html': 'html',
};

/**
 * Normalizes an extension (lowercases, removes leading dot)
 */
export function normalizeExtension(ext: string): string {
  let cleaned = ext.trim().toLowerCase();
  if (cleaned.startsWith('.')) cleaned = cleaned.slice(1);
  if (cleaned === 'jpeg') return 'jpg';
  return cleaned;
}

/**
 * Splits a filename into baseName and extension
 */
export function splitFilename(name: string): { baseName: string; extension: string } {
  const trimmed = name.trim();
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot > 0 && lastDot < trimmed.length - 1) {
    return {
      baseName: trimmed.slice(0, lastDot),
      extension: normalizeExtension(trimmed.slice(lastDot + 1)),
    };
  }
  return {
    baseName: trimmed || 'file',
    extension: '',
  };
}

/**
 * Sanitizes a filename, strips path traversal, illegal characters, and Windows reserved names.
 * Ensures the output extension matches the actual generated file format.
 */
export function sanitizeFilename(
  rawName: string,
  defaultExt: string = 'txt',
  expectedExt?: string
): { sanitizedName: string; baseName: string; extension: string; warning?: string } {
  let warning: string | undefined;
  let targetExt = normalizeExtension(expectedExt || defaultExt || 'txt');

  // Remove path traversal & illegal path separators
  let cleaned = rawName
    .replace(/\.\.+[/\\]/g, '') // strip ../ and ..\
    .replace(/[/\\]+/g, '_')   // replace slashes with underscore
    .replace(/[<>:"|?*\x00-\x1F]/g, '') // illegal filesystem chars
    .trim();

  // If empty after stripping, use default
  if (!cleaned) {
    cleaned = 'file';
  }

  const { baseName: parsedBase, extension: parsedExt } = splitFilename(cleaned);
  let baseName = parsedBase.trim().replace(/^\.+/, '').replace(/\.+$/, ''); // strip leading/trailing dots

  // Reserved Windows device names
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  if (reservedNames.test(baseName)) {
    baseName = `${baseName}_file`;
  }

  if (!baseName) {
    baseName = 'file';
  }

  // Check extension conflict
  if (parsedExt && targetExt && parsedExt !== targetExt) {
    // If user typed .png but target is webp or jpg, warn and correct
    if (parsedExt === 'jpeg' && targetExt === 'jpg') {
      // safe alias
    } else {
      warning = `The output format is .${targetExt}. Extension changed from .${parsedExt} to .${targetExt}.`;
    }
  }

  const finalExt = targetExt || parsedExt || 'txt';
  const sanitizedName = `${baseName}.${finalExt}`;

  return {
    sanitizedName,
    baseName,
    extension: finalExt,
    warning,
  };
}

/**
 * Generates context-aware smart filename suggestions based on operation, input, and metadata.
 */
export function suggestFilename(options: SuggestFilenameOptions): FilenameSuggestionResult {
  const { originalName, operation, outputFormat, metadata, toolContext } = options;

  let ext = 'txt';
  if (outputFormat) {
    ext = normalizeExtension(outputFormat);
  } else if (originalName) {
    ext = splitFilename(originalName).extension || 'txt';
  }

  // Derive source baseName
  let rawBase = 'output';
  if (originalName) {
    const parsed = splitFilename(originalName).baseName;
    if (parsed && parsed !== 'image' && parsed !== 'file') {
      rawBase = parsed;
    }
  }

  // Normalize baseName
  const cleanBase = rawBase
    .replace(/[_\-\s]+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 40) || 'file';

  const suggestionsSet = new Set<string>();

  // 1. EDI Contextual Suggestions
  if (toolContext === 'edi' || metadata?.transactionType || operation?.includes('edi')) {
    const tx = metadata?.transactionType || '850';
    const ctrl = metadata?.controlNumber ? metadata.controlNumber.replace(/[^a-zA-Z0-9]/g, '') : '';

    if (ext === 'json') {
      if (ctrl) suggestionsSet.add(`purchase_order_${ctrl}.json`);
      suggestionsSet.add(`${tx}_transaction.json`);
      suggestionsSet.add(`edi_${tx}.json`);
      if (cleanBase !== 'output') suggestionsSet.add(`${cleanBase}.json`);
    } else if (ext === 'xml') {
      if (ctrl) suggestionsSet.add(`${tx}_${ctrl}.xml`);
      suggestionsSet.add(`edi_${tx}.xml`);
    } else {
      // standard .edi
      if (ctrl) {
        suggestionsSet.add(`${tx}_${ctrl}.edi`);
        suggestionsSet.add(`purchase_order_${ctrl}.edi`);
      }
      suggestionsSet.add(`${tx}_order.edi`);
      suggestionsSet.add(`purchase_order_${tx}.edi`);
      if (cleanBase !== 'output') suggestionsSet.add(`${cleanBase}.edi`);
      suggestionsSet.add(`${tx}.edi`);
    }
  }
  // 2. Image Resizer & Target Size Compressor Context
  else if (toolContext === 'image' || operation === 'resize-compress' || ['jpg', 'png', 'webp', 'avif'].includes(ext)) {
    const width = metadata?.width;
    const height = metadata?.height;
    const maxBytes = metadata?.maxBytes;
    const maxKb = maxBytes ? Math.round(maxBytes / 1024) : undefined;

    // Common upload portal friendly names
    suggestionsSet.add(`${cleanBase}.${ext}`);
    suggestionsSet.add(`passport_photo.${ext}`);
    suggestionsSet.add(`photo.${ext}`);

    if (width && height) {
      suggestionsSet.add(`${cleanBase}_${width}x${height}.${ext}`);
      suggestionsSet.add(`photo_${width}x${height}.${ext}`);
    }
    if (maxKb) {
      suggestionsSet.add(`${cleanBase}_${maxKb}kb.${ext}`);
    }
    suggestionsSet.add(`${cleanBase}_resized.${ext}`);
  }
  // 3. Formatters & Converters Context
  else if (operation?.includes('format') || operation?.includes('convert')) {
    suggestionsSet.add(`${cleanBase}_formatted.${ext}`);
    suggestionsSet.add(`${cleanBase}.${ext}`);
    suggestionsSet.add(`${cleanBase}_pretty.${ext}`);
  }
  // 4. General Default
  else {
    suggestionsSet.add(`${cleanBase}.${ext}`);
    suggestionsSet.add(`${cleanBase}_export.${ext}`);
    suggestionsSet.add(`document.${ext}`);
  }

  const suggestions = Array.from(suggestionsSet).slice(0, 5);
  const defaultName = suggestions[0] || `${cleanBase}.${ext}`;
  const mimeType = EXTENSION_TO_MIME[ext] || 'application/octet-stream';

  return {
    defaultName,
    suggestions,
    extension: ext,
    mimeType,
    baseName: cleanBase,
  };
}

/**
 * Triggers a 100% browser-local file download with sanitized filename and proper cleanup.
 */
export function downloadFile(options: DownloadFileOptions): string {
  const { file, filename, mimeType, expectedExtension } = options;

  const targetExt = expectedExtension || splitFilename(filename).extension || 'txt';
  const { sanitizedName } = sanitizeFilename(filename, targetExt, expectedExtension);

  let blob: Blob;
  if (file instanceof Blob) {
    blob = file;
  } else {
    // string content
    const resolvedMime = mimeType || EXTENSION_TO_MIME[targetExt] || 'text/plain;charset=utf-8';
    blob = new Blob([file], { type: resolvedMime });
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sanitizedName;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup object URL
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1000);

  return sanitizedName;
}
