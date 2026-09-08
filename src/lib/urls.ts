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
  'base64-converter': 'base64',
  'base64-decoder': 'base64',
  'base64-encoder': 'base64',
  'url-encode': 'url-encode',
  'url-encoder': 'url-encode',
  'url-decoder': 'url-encode',
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
  'financial-planner': 'financial-planner',
  'retirement-calculator': 'financial-planner',
  'financial-planning-calculator': 'financial-planner',
  'financial-independence-calculator': 'financial-planner',
  'sip-calculator': 'sip-calculator',
  'investment-calculator': 'investment-calculator',
  'compound-investment-calculator': 'investment-calculator',
  'compound-interest-calculator': 'investment-calculator',
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
  'json-definition-generator': 'json-definition-generator',
  'json-to-definition': 'json-definition-generator',
  'json-schema-generator': 'json-definition-generator',
  'json-to-typescript': 'json-definition-generator',

  // EDI Tools
  'edi-tools': 'edi-formatter',
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
  'as2-tools': 'as2-tools',
  'as2-encoder-decoder': 'as2-tools',
  'as2-mdn-generator': 'as2-tools',
  'gs1-sscc-label-generator': 'gs1-sscc-label-generator',
  'gs1-128-generator': 'gs1-sscc-label-generator',
  'sscc-18-generator': 'gs1-sscc-label-generator',
  'edi-lifecycle-reconciliation': 'edi-lifecycle-reconciliation',
  'edi-order-reconciliation': 'edi-lifecycle-reconciliation',

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
  'mock-data-generator': 'mock-json-generator',
  'advanced-mock-data-generator': 'mock-json-generator',

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
  'edi-formatter': 'edi-formatter',
  'edi-to-json': 'edi-to-json',
  'markdown-preview': 'markdown-preview',
  'financial-planner': 'financial-planner',
  'sip-calculator': 'sip-calculator',
  'investment-calculator': 'investment-calculator',
  'compound-investment-calculator': 'investment-calculator',
  'json-definition-generator': 'json-definition-generator',
};

/**
 * Returns the clean direct path for a tool: e.g. "/json-formatter"
 */
export function getToolPath(tool: ToolDef | string): string {
  const toolId = typeof tool === 'string' ? tool : tool.id;
  const slug = TOOL_ID_TO_CANONICAL_SLUG[toolId] || toolId;
  return `/${slug}`;
}

/**
 * Returns the full direct canonical URL: e.g. "https://www.codepackr.com/json-formatter"
 */
export function getToolDirectUrl(tool: ToolDef | string): string {
  return `https://www.codepackr.com${getToolPath(tool)}`;
}

/**
 * Mapping of direct category URL slugs to category filter keys
 */
export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'formatters': 'formatters',
  'encoders': 'encoders',
  'validators': 'validators',
  'converters': 'converters',
  'edi': 'edi',
  'edi-tools': 'edi',
  'xml': 'xml',
  'xml-tools': 'xml',
  'calculators': 'calculators',
  'utilities': 'utilities',
  'text': 'text',
  'text-tools': 'text',
};

/**
 * Resolves the active route based on the current window location (pathname + search)
 */
export function resolveCurrentRoute(): {
  page: 'home' | 'contact' | 'privacy' | 'admin';
  tool: ToolDef | null;
  category?: string;
} {
  if (typeof window === 'undefined') {
    return { page: 'home', tool: null };
  }

  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const searchParams = new URLSearchParams(window.location.search);

  // 0. Check admin console page
  if (pathname === 'admin.html' || pathname === 'admin' || searchParams.get('page') === 'admin') {
    return { page: 'admin', tool: null };
  }

  // 1. Check contact page
  if (pathname === 'contact.html' || pathname === 'contact' || searchParams.get('page') === 'contact') {
    return { page: 'contact', tool: null };
  }

  // 2. Check privacy and terms pages
  if (pathname === 'privacy.html' || pathname === 'privacy' || searchParams.get('page') === 'privacy') {
    return { page: 'privacy', tool: null };
  }

  if (pathname === 'terms.html' || pathname === 'terms' || searchParams.get('page') === 'terms') {
    return { page: 'privacy', tool: null, category: 'terms' };
  }

  // 3. Check direct path slug (e.g. "json-formatter.html", "json-formatter", or "formatters")
  if (pathname && pathname !== 'index.html') {
    const rawSlug = pathname.replace(/\.html$/, '');

    // Check category hubs first
    if (CATEGORY_SLUG_MAP[rawSlug]) {
      return { page: 'home', tool: null, category: CATEGORY_SLUG_MAP[rawSlug] };
    }

    const mappedToolId = SLUG_TO_TOOL_ID[rawSlug] || rawSlug;
    const foundTool = TOOLS.find((t) => t.id === mappedToolId || t.id === rawSlug);
    if (foundTool) {
      return { page: 'home', tool: foundTool };
    }
  }

  // 4. Check query param: ?tool=...
  const toolParam = searchParams.get('tool');
  if (toolParam) {
    const mappedToolId = SLUG_TO_TOOL_ID[toolParam] || toolParam;
    const foundTool = TOOLS.find((t) => t.id === mappedToolId);
    if (foundTool) {
      return { page: 'home', tool: foundTool };
    }
  }

  // 5. Category filter param: ?cat=... or ?category=...
  const catParam = searchParams.get('cat') || searchParams.get('category');

  return { page: 'home', tool: null, category: catParam || undefined };
}
