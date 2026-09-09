import fs from 'node:fs';
import path from 'node:path';

const today = new Date().toISOString().split('T')[0];
const HOST = process.env.HOST || 'www.codepackr.com';
const BASE_URL = `https://${HOST}`;

console.log(`\n========================================`);
console.log(` Building Codepackr XML Sitemap`);
console.log(` Host: ${BASE_URL} | Lastmod: ${today}`);
console.log(`========================================`);

// 1. Read Tools from src/data/tools.ts
const toolsSource = fs.readFileSync(path.resolve('src/data/tools.ts'), 'utf8');
const toolsSection = toolsSource.slice(toolsSource.indexOf('export const TOOLS: ToolDef[] = ['));
const regex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',\s*description:\s*'([^']+)'/g;

const toolsMap = new Map();
let m;
while ((m = regex.exec(toolsSection)) !== null) {
  toolsMap.set(m[1], {
    id: m[1],
    name: m[2],
    category: m[3],
    description: m[4],
  });
}

// 2. High-priority Category Hubs
const categoryHubs = [
  { slug: 'image-tools', name: 'Image Processing & Optimization Tools Suite', priority: '0.9', changefreq: 'weekly', category: 'image' },
  { slug: 'edi-tools', name: 'EDI Tools & Business Transaction Suite', priority: '0.9', changefreq: 'weekly', category: 'edi' },
  { slug: 'formatters', name: 'Code & Data Formatters', priority: '0.9', changefreq: 'weekly', category: 'formatters' },
  { slug: 'encoders', name: 'Encoders, Decoders & Cryptography', priority: '0.9', changefreq: 'weekly', category: 'encoders' },
  { slug: 'validators', name: 'Syntax, Schema & Diff Validators', priority: '0.9', changefreq: 'weekly', category: 'validators' },
  { slug: 'converters', name: 'File & Data Format Converters', priority: '0.9', changefreq: 'weekly', category: 'converters' },
  { slug: 'financial-calculators', name: 'Financial & Retirement Calculators Suite', priority: '0.9', changefreq: 'weekly', category: 'financial-calculators' },
  { slug: 'calculators', name: 'Financial, Loan & Math Calculators', priority: '0.9', changefreq: 'weekly', category: 'calculators' },
  { slug: 'utilities', name: 'Developer Utilities & Generators', priority: '0.9', changefreq: 'weekly', category: 'utilities' },
  { slug: 'text-tools', name: 'Text Processing & Analysis Tools', priority: '0.9', changefreq: 'weekly', category: 'text' },
  { slug: 'xml-tools', name: 'XML, XSD, XSLT & XPath Suite', priority: '0.9', changefreq: 'weekly', category: 'xml' },
];

// 3. Direct Sub-features and Specialized Aliases
const specializedAliases = [
  // EDI Sub-tools
  { slug: 'edi-x12-formatter', name: 'EDI ANSI ASC X12 Formatter', priority: '0.8', changefreq: 'monthly', category: 'edi' },
  { slug: 'edi-json-converter', name: 'EDI to JSON Document Converter', priority: '0.8', changefreq: 'monthly', category: 'edi' },
  { slug: 'edi-order-reconciliation', name: 'EDI Order Lifecycle Reconciliation', priority: '0.8', changefreq: 'monthly', category: 'edi' },
  { slug: 'as2-encoder-decoder', name: 'AS2 S/MIME Encoder & Decoder', priority: '0.8', changefreq: 'monthly', category: 'edi' },
  { slug: 'as2-mdn-generator', name: 'AS2 Message Disposition Notification (MDN)', priority: '0.8', changefreq: 'monthly', category: 'edi' },
  { slug: 'gs1-128-generator', name: 'GS1-128 Shipping Barcode Generator', priority: '0.8', changefreq: 'monthly', category: 'edi' },
  { slug: 'sscc-18-generator', name: 'Serial Shipping Container Code (SSCC-18)', priority: '0.8', changefreq: 'monthly', category: 'edi' },
  
  // Formatters & Encoders Sub-features
  { slug: 'json-minifier', name: 'JSON Minifier & Compressor', priority: '0.8', changefreq: 'monthly', category: 'formatters' },
  { slug: 'crc32-checksum-generator', name: 'CRC32 Checksum Generator', priority: '0.8', changefreq: 'monthly', category: 'encoders' },
  { slug: 'hmac-generator', name: 'HMAC Keyed-Hash Generator', priority: '0.8', changefreq: 'monthly', category: 'encoders' },
  { slug: 'retirement-calculator', name: 'Retirement & Financial Planning Calculator', priority: '0.9', changefreq: 'weekly', category: 'financial-calculators' },
  { slug: 'financial-planner', name: 'Retirement & Financial Planning Calculator', priority: '0.85', changefreq: 'weekly', category: 'financial-calculators' },
  { slug: 'sip-calculator', name: 'SIP Calculator', priority: '0.85', changefreq: 'monthly', category: 'financial-calculators' },
  { slug: 'investment-calculator', name: 'Investment Calculator', priority: '0.85', changefreq: 'monthly', category: 'financial-calculators' },
  { slug: 'compound-investment-calculator', name: 'Compound Investment Calculator', priority: '0.8', changefreq: 'monthly', category: 'financial-calculators' },
  { slug: 'compound-interest-calculator', name: 'Compound Interest Calculator', priority: '0.8', changefreq: 'monthly', category: 'financial-calculators' },
  { slug: 'xsd-validator', name: 'XSD & XML Schema Validator', priority: '0.85', changefreq: 'weekly', category: 'xml' },
  { slug: 'json-definition-generator', name: 'JSON Definition & Type Generator', priority: '0.85', changefreq: 'monthly', category: 'converters' },
  { slug: 'json-to-definition', name: 'JSON to Type Definition Converter', priority: '0.8', changefreq: 'monthly', category: 'converters' },
  { slug: 'markdown', name: 'Markdown Live Editor', priority: '0.8', changefreq: 'monthly', category: 'utilities' },
  { slug: 'what-is-my-screen-resolution', name: 'Screen Resolution & Viewport Checker', priority: '0.8', changefreq: 'monthly', category: 'utilities' },
  { slug: 'what-is-my-user-agent', name: 'User Agent Inspector', priority: '0.8', changefreq: 'monthly', category: 'utilities' },

  // Text tools
  { slug: 'word-counter', name: 'Word Counter & Statistics', priority: '0.8', changefreq: 'monthly', category: 'text' },
  { slug: 'character-counter', name: 'Character & Byte Counter', priority: '0.8', changefreq: 'monthly', category: 'text' },
  { slug: 'line-counter', name: 'Line Counter & Code Metrics', priority: '0.8', changefreq: 'monthly', category: 'text' },
  { slug: 'sentence-counter', name: 'Sentence Counter & Readability', priority: '0.8', changefreq: 'monthly', category: 'text' },
  { slug: 'remove-duplicate-lines', name: 'Remove Duplicate Lines', priority: '0.8', changefreq: 'monthly', category: 'text' },
  { slug: 'remove-empty-lines', name: 'Remove Empty Lines', priority: '0.8', changefreq: 'monthly', category: 'text' },
  { slug: 'remove-extra-spaces', name: 'Remove Extra Whitespace', priority: '0.8', changefreq: 'monthly', category: 'text' },
  { slug: 'sort-lines-alphabetically', name: 'Sort Lines Alphabetically', priority: '0.8', changefreq: 'monthly', category: 'text' },
  { slug: 'reverse-line-order', name: 'Reverse Line Order', priority: '0.8', changefreq: 'monthly', category: 'text' },
];

// 4. Legal & Company Pages
const legalPages = [
  { slug: 'contact', name: 'Contact & Support', priority: '0.7', changefreq: 'monthly', category: 'legal' },
  { slug: 'privacy', name: 'Privacy Policy', priority: '0.6', changefreq: 'monthly', category: 'legal' },
  { slug: 'terms', name: 'Terms and Conditions', priority: '0.6', changefreq: 'monthly', category: 'legal' },
];

// Assemble complete URL list with strict deduplication
const allEntries = [];
const existingSlugs = new Set();

const addEntry = (entry) => {
  const cleanSlug = entry.path.replace(/^\//, '') || '__root__';
  if (!existingSlugs.has(cleanSlug)) {
    existingSlugs.add(cleanSlug);
    allEntries.push(entry);
  }
};

// Homepage
addEntry({
  loc: `${BASE_URL}/`,
  path: '/',
  name: 'Codepackr - Free Online Developer & EDI Tools',
  priority: '1.0',
  changefreq: 'weekly',
  category: 'home',
});

// Category Hubs
for (const hub of categoryHubs) {
  addEntry({
    loc: `${BASE_URL}/${hub.slug}`,
    path: `/${hub.slug}`,
    name: hub.name,
    priority: hub.priority,
    changefreq: hub.changefreq,
    category: hub.category,
  });
}

// Tool Pages
for (const [id, tool] of toolsMap.entries()) {
  addEntry({
    loc: `${BASE_URL}/${id}`,
    path: `/${id}`,
    name: tool.name,
    priority: tool.popular ? '0.85' : '0.8',
    changefreq: 'monthly',
    category: tool.category,
  });
}

// Specialized Aliases (if not already added)
for (const alias of specializedAliases) {
  addEntry({
    loc: `${BASE_URL}/${alias.slug}`,
    path: `/${alias.slug}`,
    name: alias.name,
    priority: alias.priority,
    changefreq: alias.changefreq,
    category: alias.category,
  });
}

// Legal Pages
for (const legal of legalPages) {
  addEntry({
    loc: `${BASE_URL}/${legal.slug}`,
    path: `/${legal.slug}`,
    name: legal.name,
    priority: legal.priority,
    changefreq: legal.changefreq,
    category: legal.category,
  });
}

// Build XML String
let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

for (const entry of allEntries) {
  xml += '<url>\n';
  xml += `  <loc>${entry.loc}</loc>\n`;
  xml += `  <lastmod>${today}</lastmod>\n`;
  xml += `  <changefreq>${entry.changefreq}</changefreq>\n`;
  xml += `  <priority>${entry.priority}</priority>\n`;
  xml += '</url>\n';
}

xml += '</urlset>\n';

// Write to public/sitemap.xml
const publicSitemap = path.resolve('public/sitemap.xml');
fs.writeFileSync(publicSitemap, xml, 'utf8');
console.log(`[✓] Written: ${publicSitemap} (${allEntries.length} URLs)`);

// If dist/ directory exists, also write to dist/sitemap.xml
const distDir = path.resolve('dist');
if (fs.existsSync(distDir)) {
  const distSitemap = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(distSitemap, xml, 'utf8');
  console.log(`[✓] Written: ${distSitemap} (${allEntries.length} URLs)`);
}

// Write to src/data/sitemapUrls.json for UI inspection
const sitemapJsonPath = path.resolve('src/data/sitemapUrls.json');
fs.writeFileSync(
  sitemapJsonPath,
  JSON.stringify(
    {
      updatedAt: today,
      host: HOST,
      baseUrl: BASE_URL,
      totalUrls: allEntries.length,
      urls: allEntries,
    },
    null,
    2
  ),
  'utf8'
);
console.log(`[✓] Written: ${sitemapJsonPath}`);
console.log(`========================================\n`);
