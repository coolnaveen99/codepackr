import fs from 'node:fs';
import path from 'node:path';

const today = new Date().toISOString().split('T')[0];

const urls = [
  { loc: 'https://www.codepackr.com/', priority: '1.0', changefreq: 'weekly' },
  { loc: 'https://www.codepackr.com/edi-tools', priority: '0.9', changefreq: 'monthly' },
  
  // EDI Tools
  { loc: 'https://www.codepackr.com/edi-formatter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/edi-segment-viewer', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/edi-to-json', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/edi-validator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/edi-997-generator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/json-to-edi', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/edi-sample-generator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/edi-delimiter-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/as2-tools', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/gs1-sscc-label-generator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/edi-lifecycle-reconciliation', priority: '0.8', changefreq: 'monthly' },

  // Formatters & Beautifiers
  { loc: 'https://www.codepackr.com/json-formatter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/json-minifier', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/html-formatter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/css-formatter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/sql-formatter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/xml-formatter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/yaml-formatter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/js-minifier', priority: '0.8', changefreq: 'monthly' },

  // Encoders & Decoders
  { loc: 'https://www.codepackr.com/base64', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/url-encode', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/html-entity', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/hash-generator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/crc32-checksum-generator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/hmac-generator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/jwt-decoder', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/jwt-encoder', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/base64-image', priority: '0.8', changefreq: 'monthly' },

  // Calculators
  { loc: 'https://www.codepackr.com/calculator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/percentage-calculator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/tip-calculator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/sip-calculator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/loan-calculator', priority: '0.8', changefreq: 'monthly' },

  // Validators & Testing
  { loc: 'https://www.codepackr.com/diff-checker', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/regex-tester', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/json-validator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/json-path-tester', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/xsd-validator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/csv-viewer', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/json-structural-diff', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/dotenv-formatter', priority: '0.8', changefreq: 'monthly' },

  // Converters
  { loc: 'https://www.codepackr.com/json-xml-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/json-csv-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/csv-xml-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/case-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/yaml-json-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/number-base-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/markdown-html-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/html-markdown-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/curl-code-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/image-resizer', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/favicon-generator', priority: '0.8', changefreq: 'monthly' },

  // XML, XSD & XSLT
  { loc: 'https://www.codepackr.com/xslt-transformer', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/xml-to-xsd', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/xsd-to-xml', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/xpath-evaluator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/xml-escape-tool', priority: '0.8', changefreq: 'monthly' },

  // Utilities
  { loc: 'https://www.codepackr.com/uuid-generator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/qr-generator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/password-generator', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/lorem-ipsum', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/markdown-preview', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/color-converter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/timestamp', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/cron-expression', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/slugify', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/http-status-codes', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/mock-json-generator', priority: '0.8', changefreq: 'monthly' },

  // Text tools & Text operations
  { loc: 'https://www.codepackr.com/text-tools', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/word-counter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/character-counter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/line-counter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/sentence-counter', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/remove-duplicate-lines', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/remove-empty-lines', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/remove-extra-spaces', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/sort-lines-alphabetically', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/reverse-line-order', priority: '0.8', changefreq: 'monthly' },

  // Legal & Meta
  { loc: 'https://www.codepackr.com/contact', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/privacy', priority: '0.7', changefreq: 'monthly' },
  { loc: 'https://www.codepackr.com/terms', priority: '0.7', changefreq: 'monthly' },
];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

for (const u of urls) {
  xml += '<url>\n';
  xml += `  <loc>${u.loc}</loc>\n`;
  xml += `  <lastmod>${today}</lastmod>\n`;
  xml += `  <changefreq>${u.changefreq}</changefreq>\n`;
  xml += `  <priority>${u.priority}</priority>\n`;
  xml += '</url>\n';
}

xml += '</urlset>\n';

const sitemapPath = path.resolve('public/sitemap.xml');
fs.writeFileSync(sitemapPath, xml, 'utf8');
console.log(`Successfully generated public/sitemap.xml with ${urls.length} URLs (today: ${today})`);
