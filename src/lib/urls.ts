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
  'connection-string-parser': 'connection-string-parser',
  'connection-string-builder': 'connection-string-parser',
  'db-connection-builder': 'connection-string-parser',

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
  'jwt-inspector': 'jwt-inspector',
  'jwt-validator': 'jwt-inspector',
  'jwt-debugger': 'jwt-inspector',
  'pkce-generator': 'pkce-generator',
  'pkce': 'pkce-generator',
  'oauth-pkce': 'pkce-generator',
  'base64-image': 'base64-image',

  // Validators
  'diff-checker': 'diff-checker',
  'image-diff-checker': 'image-diff-checker',
  'image-diff': 'image-diff-checker',
  'image-comparator': 'image-diff-checker',
  'image-compare': 'image-diff-checker',
  'openapi-validator': 'openapi-validator',
  'swagger-validator': 'openapi-validator',
  'swagger-viewer': 'openapi-validator',
  'docker-k8s-validator': 'docker-k8s-validator',
  'k8s-validator': 'docker-k8s-validator',
  'docker-linter': 'docker-k8s-validator',
  'k8s-linter': 'docker-k8s-validator',
  'regex-tester': 'regex-tester',
  'json-validator': 'json-validator',
  'json-path-tester': 'json-path-tester',
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
  'image-target-compressor': 'image-target-compressor',
  'image-resizer-target-size': 'image-target-compressor',
  'resize-image-target-size': 'image-target-compressor',
  'image-resizer-kb': 'image-target-compressor',
  'photo-size-reducer': 'image-target-compressor',
  'image-resizer': 'image-resizer',
  'image-merger': 'image-merger',
  'image-combiner': 'image-merger',
  'combine-images': 'image-merger',
  'image-joiner': 'image-merger',
  'image-exif-inspector': 'image-exif-inspector',
  'exif-inspector': 'image-exif-inspector',
  'strip-exif': 'image-exif-inspector',
  'exif-stripper': 'image-exif-inspector',
  'remove-exif': 'image-exif-inspector',
  'favicon-generator': 'favicon-generator',
  'json-definition-generator': 'json-definition-generator',
  'json-to-definition': 'json-definition-generator',
  'json-schema-generator': 'json-definition-generator',
  'json-to-typescript': 'json-definition-generator',

  // EDI Tools
  'edi-csv-converter': 'edi-csv-converter',
  'edi-to-csv': 'edi-csv-converter',
  'csv-to-edi': 'edi-csv-converter',
  'edi-csv': 'edi-csv-converter',
  'edi-excel': 'edi-csv-converter',
  'edi-hipaa-sanitizer': 'edi-hipaa-sanitizer',
  'hipaa-sanitizer': 'edi-hipaa-sanitizer',
  'edi-de-identifier': 'edi-hipaa-sanitizer',
  'edi-phi-sanitizer': 'edi-hipaa-sanitizer',
  'edi-batch-splitter': 'edi-batch-splitter',
  'edi-splitter': 'edi-batch-splitter',
  'edi-joiner': 'edi-batch-splitter',
  'edi-batch': 'edi-batch-splitter',
  'edi-diff-compare': 'edi-diff-compare',
  'edi-diff': 'edi-diff-compare',
  'edi-compare': 'edi-diff-compare',
  'edi-semantic-diff': 'edi-diff-compare',
  'edi-message-gateway': 'edi-message-gateway',
  'edi-inbound-outbound-gateway': 'edi-message-gateway',
  'edi-integration-gateway': 'edi-message-gateway',
  'inbound-outbound-gateway': 'edi-message-gateway',
  'edi-gateway-analyzer': 'edi-message-gateway',
  'edi-gateway': 'edi-message-gateway',
  'edi-pipeline': 'edi-message-gateway',
  'as2-edi-gateway': 'edi-message-gateway',
  'edi-tools': 'edi-formatter',
  'edi-x12-formatter': 'edi-formatter',
  'edi-formatter': 'edi-formatter',
  'edi-schema-viewer': 'edi-schema-viewer',
  'edi-hierarchy-viewer': 'edi-schema-viewer',
  'edi-element-lookup': 'edi-schema-viewer',
  'edi-tree-viewer': 'edi-schema-viewer',
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
  'xsd-validator': 'xsd-validator',
  'xml-validator': 'xsd-validator',
  'xml-schema-validator': 'xsd-validator',

  // Utilities
  'uuid-generator': 'uuid-generator',
  'qr-generator': 'qr-generator',
  'password-generator': 'password-generator',
  'lorem-ipsum': 'lorem-ipsum',
  'what-is-my-screen-resolution': 'uuid-generator',
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

export const TOOL_ID_TO_CANONICAL_SLUG: Record<string, string> = {
  'edi-csv-converter': 'edi-csv-converter',
  'edi-hipaa-sanitizer': 'edi-hipaa-sanitizer',
  'edi-batch-splitter': 'edi-batch-splitter',
  'edi-diff-compare': 'edi-diff-compare',
  'edi-message-gateway': 'edi-message-gateway',
  'image-target-compressor': 'image-target-compressor',
  'edi-schema-viewer': 'edi-schema-viewer',
  'edi-formatter': 'edi-formatter',
  'edi-to-json': 'edi-to-json',
  'markdown-preview': 'markdown-preview',
  'json-definition-generator': 'json-definition-generator',
  'image-merger': 'image-merger',
  'image-exif-inspector': 'image-exif-inspector',
  'image-diff-checker': 'image-diff-checker',
  'jwt-inspector': 'jwt-inspector',
  'pkce-generator': 'pkce-generator',
  'openapi-validator': 'openapi-validator',
  'docker-k8s-validator': 'docker-k8s-validator',
  'connection-string-parser': 'connection-string-parser',
};

export function getToolPath(tool: ToolDef | string): string {
  const toolId = typeof tool === 'string' ? tool : tool.id;
  const slug = TOOL_ID_TO_CANONICAL_SLUG[toolId] || toolId;
  return `/${slug}`;
}

export function getToolDirectUrl(tool: ToolDef | string): string {
  return `https://www.codepackr.com${getToolPath(tool)}`;
}

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'image': 'image',
  'image-tools': 'image',
  'images': 'image',
  'formatters': 'formatters',
  'encoders': 'encoders',
  'validators': 'validators',
  'converters': 'converters',
  'edi': 'edi',
  'edi-tools': 'edi',
  'edi-integration-hub': 'edi',
  'edi-integration': 'edi',
  'xml': 'xml',
  'xml-tools': 'xml',
  'financial-calculators': 'financial-calculators',
  'financial-calculator': 'financial-calculators',
  'calculators': 'financial-calculators',
  'utilities': 'utilities',
  'text': 'text',
  'text-tools': 'text',
};

export const FINANCIAL_REDIRECT_SLUGS = new Set([
  'financial-calculators',
  'financial-calculator',
  'calculators',
  'retirement-calculator',
  'financial-planner',
  'financial-planning-calculator',
  'financial-independence-calculator',
  'sip-calculator',
  'investment-calculator',
  'compound-investment-calculator',
  'compound-interest-calculator',
  'loan-calculator',
]);

export type AppPage = 'home' | 'contact' | 'privacy' | 'admin' | 'notFound';

/**
 * Resolves the active route based on the current window location (pathname + search)
 */
export function resolveCurrentRoute(): {
  page: AppPage;
  tool: ToolDef | null;
  category?: string;
  externalRedirect?: string;
} {
  if (typeof window === 'undefined') {
    return { page: 'home', tool: null };
  }

  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const searchParams = new URLSearchParams(window.location.search);

  const rawSlug = pathname.replace(/\.html$/, '');
  const toolParam = searchParams.get('tool');
  const catParam = searchParams.get('cat') || searchParams.get('category');

  if (
    FINANCIAL_REDIRECT_SLUGS.has(rawSlug) ||
    (toolParam && FINANCIAL_REDIRECT_SLUGS.has(toolParam)) ||
    (catParam && FINANCIAL_REDIRECT_SLUGS.has(catParam))
  ) {
    return {
      page: 'home',
      tool: null,
      externalRedirect: 'https://finance.codepackr.com/',
    };
  }

  if (pathname === 'admin.html' || pathname === 'admin' || searchParams.get('page') === 'admin') {
    return { page: 'admin', tool: null };
  }

  if (pathname === 'contact.html' || pathname === 'contact' || searchParams.get('page') === 'contact') {
    return { page: 'contact', tool: null };
  }

  if (pathname === 'privacy.html' || pathname === 'privacy' || searchParams.get('page') === 'privacy') {
    return { page: 'privacy', tool: null };
  }

  if (pathname === 'terms.html' || pathname === 'terms' || searchParams.get('page') === 'terms') {
    return { page: 'privacy', tool: null, category: 'terms' };
  }

  // Empty path or index → home
  if (!pathname || pathname === 'index.html' || pathname === 'index') {
    return { page: 'home', tool: null, category: catParam || undefined };
  }

  // Category hubs
  if (CATEGORY_SLUG_MAP[rawSlug]) {
    return { page: 'home', tool: null, category: CATEGORY_SLUG_MAP[rawSlug] };
  }

  // Known tool slug
  const mappedToolId = SLUG_TO_TOOL_ID[rawSlug] || rawSlug;
  const foundTool = TOOLS.find((t) => t.id === mappedToolId || t.id === rawSlug);
  if (foundTool) {
    return { page: 'home', tool: foundTool };
  }

  // Query ?tool=
  if (toolParam) {
    const mapped = SLUG_TO_TOOL_ID[toolParam] || toolParam;
    const found = TOOLS.find((t) => t.id === mapped);
    if (found) {
      return { page: 'home', tool: found };
    }
  }

  // Unknown path with only ?cat= → still home with category
  if (catParam && !rawSlug) {
    return { page: 'home', tool: null, category: catParam };
  }

  // Unknown non-empty path → 404 (do not silently show homepage)
  if (rawSlug) {
    return { page: 'notFound', tool: null };
  }

  return { page: 'home', tool: null, category: catParam || undefined };
}
