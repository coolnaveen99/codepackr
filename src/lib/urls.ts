import { ToolDef } from '../types';
import { TOOLS } from '../data/tools';

/**
 * Mapping of legacy or direct HTML slugs to Tool IDs or special pages
 */
export const SLUG_TO_TOOL_ID: Record<string, string> = {
  // Formatters
  'json-formatter': 'json-formatter',
  'json-minifier': 'json-formatter',
  'html-formatter': 'html-formatter',
  'css-formatter': 'css-formatter',
  'sql-formatter': 'sql-formatter',
  'xml-formatter': 'xml-formatter',
  'yaml-formatter': 'yaml-formatter',
  'js-minifier': 'js-minifier',

  // Encoders & Security
  'base64': 'base64',
  'url-encode': 'url-encode',
  'html-entity': 'html-entity',
  'hash-generator': 'hash-generator',
  'crc32-checksum-generator': 'hash-generator',
  'hmac-generator': 'hash-generator',
  'jwt-decoder': 'jwt-decoder',
  'jwt-encoder': 'jwt-encoder',
  'base64-image': 'base64-image',

  // Calculators
  'calculator': 'calculator',
  'percentage-calculator': 'percentage-calculator',
  'tip-calculator': 'tip-calculator',
  'sip-calculator': 'loan-calculator',
  'loan-calculator': 'loan-calculator',

  // Validators
  'diff-checker': 'diff-checker',
  'regex-tester': 'regex-tester',
  'json-validator': 'json-validator',
  'json-path-tester': 'json-path-tester',
  'xsd-validator': 'xsd-validator',
  'csv-viewer': 'csv-viewer',
  'json-structural-diff': 'json-structural-diff',
  'dotenv-formatter': 'dotenv-formatter',

  // Converters
  'json-xml-converter': 'json-xml-converter',
  'json-csv-converter': 'json-csv-converter',
  'csv-xml-converter': 'csv-xml-converter',
  'case-converter': 'case-converter',
  'yaml-json-converter': 'yaml-json-converter',
  'number-base-converter': 'number-base-converter',
  'markdown-html-converter': 'markdown-html-converter',
  'html-markdown-converter': 'html-markdown-converter',
  'curl-code-converter': 'curl-code-converter',
  'image-resizer': 'image-resizer',
  'favicon-generator': 'favicon-generator',

  // EDI Tools
  'edi-x12-formatter': 'edi-formatter',
  'edi-formatter': 'edi-formatter',
  'edi-segment-viewer': 'edi-segment-viewer',
  'edi-json-converter': 'edi-to-json',
  'edi-to-json': 'edi-to-json',
  'edi-validator': 'edi-validator',
  'edi-997-generator': 'edi-997-generator',
  'json-to-edi': 'json-to-edi',
  'edi-sample-generator': 'edi-sample-generator',
  'edi-delimiter-converter': 'edi-delimiter-converter',

  // XML, XSD, XSLT Tools
  'xslt-transformer': 'xslt-transformer',
  'xml-to-xsd': 'xml-to-xsd',
  'xsd-to-xml': 'xsd-to-xml',
  'xpath-evaluator': 'xpath-evaluator',
  'xml-escape-tool': 'xml-escape-tool',

  // Utilities
  'uuid-generator': 'uuid-generator',
  'qr-generator': 'qr-generator',
  'password-generator': 'password-generator',
  'lorem-ipsum': 'lorem-ipsum',
  'what-is-my-screen-resolution': 'uuid-generator', // fallback to utility
  'what-is-my-user-agent': 'uuid-generator',
  'markdown': 'markdown-preview',
  'markdown-preview': 'markdown-preview',
  'color-converter': 'color-converter',
  'timestamp': 'timestamp',
  'cron-expression': 'cron-expression',
  'slugify': 'slugify',
  'http-status-codes': 'http-status-codes',
  'mock-json-generator': 'mock-json-generator',

  // Text tools & Text operations
  'text-tools': 'text-tools',
  'word-counter': 'text-tools',
  'character-counter': 'text-tools',
  'line-counter': 'text-tools',
  'sentence-counter': 'text-tools',
  'remove-duplicate-lines': 'text-tools',
  'remove-empty-lines': 'text-tools',
  'remove-extra-spaces': 'text-tools',
  'sort-lines-alphabetically': 'text-tools',
  'reverse-line-order': 'text-tools',
};

/**
 * Preferred direct canonical URL slug for each tool ID
 */
export const TOOL_ID_TO_CANONICAL_SLUG: Record<string, string> = {
  'edi-formatter': 'edi-x12-formatter',
  'edi-to-json': 'edi-json-converter',
  'markdown-preview': 'markdown',
};

/**
 * Returns the clean direct path for a tool: e.g. "/json-formatter.html"
 */
export function getToolPath(tool: ToolDef | string): string {
  const toolId = typeof tool === 'string' ? tool : tool.id;
  const slug = TOOL_ID_TO_CANONICAL_SLUG[toolId] || toolId;
  return `/${slug}.html`;
}

/**
 * Returns the full direct canonical URL: e.g. "https://www.codepackr.com/json-formatter.html"
 */
export function getToolDirectUrl(tool: ToolDef | string): string {
  return `https://www.codepackr.com${getToolPath(tool)}`;
}

/**
 * Resolves the active route based on the current window location (pathname + search)
 */
export function resolveCurrentRoute(): {
  page: 'home' | 'contact' | 'privacy';
  tool: ToolDef | null;
  category?: string;
} {
  if (typeof window === 'undefined') {
    return { page: 'home', tool: null };
  }

  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Check contact page
  if (pathname === 'contact.html' || pathname === 'contact' || searchParams.get('page') === 'contact') {
    return { page: 'contact', tool: null };
  }

  // 2. Check privacy page
  if (pathname === 'privacy.html' || pathname === 'privacy' || searchParams.get('page') === 'privacy') {
    return { page: 'privacy', tool: null };
  }

  // 2. Check path slug (e.g. "json-formatter.html" or "json-formatter")
  if (pathname && pathname !== 'index.html') {
    const rawSlug = pathname.replace(/\.html$/, '');
    const mappedToolId = SLUG_TO_TOOL_ID[rawSlug] || rawSlug;
    const foundTool = TOOLS.find((t) => t.id === mappedToolId || t.id === rawSlug);
    if (foundTool) {
      return { page: 'home', tool: foundTool };
    }
  }

  // 3. Check query param: ?tool=...
  const toolParam = searchParams.get('tool');
  if (toolParam) {
    const mappedToolId = SLUG_TO_TOOL_ID[toolParam] || toolParam;
    const foundTool = TOOLS.find((t) => t.id === mappedToolId);
    if (foundTool) {
      return { page: 'home', tool: foundTool };
    }
  }

  // 4. Category filter param: ?cat=...
  const catParam = searchParams.get('cat') || searchParams.get('category');

  return { page: 'home', tool: null, category: catParam || undefined };
}
