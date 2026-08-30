// scripts/prerender.mjs
//
// Runs after `vite build`. Reads the built dist/index.html (which already has
// the correct <script src="/assets/...compiled main.js"> tags injected by Vite)
// and, for every tool route, writes a copy of that file with tool-specific
// <title>, <meta description>, <link rel="canonical">, Open Graph, Twitter,
// and JSON-LD tags already present in the raw HTML — so search engine
// crawlers see unique, correct metadata WITHOUT needing to execute JavaScript.
//
// The React app still boots normally inside each file and will re-apply the
// same values client-side (harmless no-op), so nothing changes for real users.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const siteUrl = 'https://www.codepackr.com'

const categories = [
  {
    name: 'Formatters',
    tools: [
      { id: 'json-formatter', name: 'JSON Formatter', description: 'Beautify, minify, and validate JSON' },
      { id: 'html-formatter', name: 'HTML Formatter', description: 'Beautify and minify HTML markup' },
      { id: 'css-formatter', name: 'CSS Formatter', description: 'Prettify and compress stylesheets' },
      { id: 'sql-formatter', name: 'SQL Formatter', description: 'Format SQL queries for readability' },
      { id: 'xml-formatter', name: 'XML Formatter', description: 'Indent and prettify XML documents' },
      { id: 'yaml-formatter', name: 'YAML Formatter', description: 'Format and validate YAML-style documents' },
      { id: 'js-minifier', name: 'JS Minifier', description: 'Compress JavaScript for production' },
    ],
  },
  {
    name: 'Encoders',
    tools: [
      { id: 'base64', name: 'Base64 Encoder', description: 'Encode and decode Base64 strings' },
      { id: 'url-encode', name: 'URL Encoder', description: 'Encode and decode URL components' },
      { id: 'html-entity', name: 'HTML Entity Encoder', description: 'Encode and decode HTML entities' },
      { id: 'hash-generator', name: 'Hash Generator', description: 'Generate SHA hashes in the browser' },
      { id: 'jwt-decoder', name: 'JWT Decoder', description: 'Decode and inspect JWT tokens' },
    ],
  },
  {
    name: 'Validators',
    tools: [
      { id: 'diff-checker', name: 'Diff Checker', description: 'Compare text and code side by side' },
      { id: 'regex-tester', name: 'Regex Tester', description: 'Test and debug regular expressions' },
      { id: 'json-validator', name: 'JSON Validator', description: 'Validate JSON and show parse errors' },
      { id: 'json-path-tester', name: 'JSON Path Tester', description: 'Query JSON with simple JSONPath expressions' },
      { id: 'xsd-validator', name: 'XSD Validator', description: 'Check XML syntax and schema root hints' },
      { id: 'csv-viewer', name: 'CSV Viewer', description: 'View and format CSV as a table' },
    ],
  },
  {
    name: 'Converters',
    tools: [
      { id: 'json-xml-converter', name: 'JSON to XML Converter', description: 'Convert JSON and XML both ways' },
      { id: 'json-csv-converter', name: 'JSON to CSV Converter', description: 'Convert JSON arrays and CSV both ways' },
      { id: 'csv-xml-converter', name: 'CSV to XML Converter', description: 'Convert CSV records and XML both ways' },
    ],
  },
  {
    name: 'EDI Tools',
    tools: [
      { id: 'edi-x12-formatter', name: 'EDI X12 Formatter', description: 'Format X12 EDI into readable segments' },
      { id: 'edi-segment-viewer', name: 'EDI Segment Viewer', description: 'Inspect EDI segments and elements in a table' },
      { id: 'edi-json-converter', name: 'EDI to JSON Converter', description: 'Convert EDI X12 segments into JSON' },
    ],
  },
  {
    name: 'Utilities',
    tools: [
      { id: 'uuid-generator', name: 'UUID Generator', description: 'Generate one or many UUIDs' },
      { id: 'qr-generator', name: 'QR Code Generator', description: 'Generate downloadable QR codes' },
      { id: 'password-generator', name: 'Password Generator', description: 'Create strong random passwords' },
      { id: 'lorem-ipsum', name: 'Lorem Ipsum', description: 'Generate placeholder text' },
      { id: 'text-tools', name: 'Text Tools', description: 'Count, transform, sort, and clean text' },
      { id: 'markdown', name: 'Markdown Preview', description: 'Live markdown editor and preview' },
      { id: 'color-converter', name: 'Color Converter', description: 'Convert HEX, RGB, and HSL colors' },
      { id: 'timestamp', name: 'Timestamp Converter', description: 'Convert Unix timestamps and dates' },
      { id: 'cron-expression', name: 'Cron Expression', description: 'Build and explain cron schedules' },
      { id: 'calculator', name: 'Calculator', description: 'Scientific calculator for quick math' },
    ],
  },
  {
    name: 'Contact',
    tools: [{ id: 'contact', name: 'Contact', description: 'Contact form and project details' }],
  },
]

const allTools = categories.flatMap((c) => c.tools.map((t) => ({ ...t, category: c.name })))

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHead(tool) {
  const title = `${tool.name} - Codepackr`
  const description = `${tool.description}. Free online ${tool.name.toLowerCase()} from Codepackr. Runs locally in your browser.`
  const canonical = `${siteUrl}/${tool.id}.html`
  const keywords = `${tool.name.toLowerCase()}, ${tool.category.toLowerCase()}, codepackr, developer tools, online tools`
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    url: canonical,
    description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
  })

  return { title: escapeHtml(title), description: escapeHtml(description), canonical, keywords: escapeHtml(keywords), jsonLd }
}

function injectIntoHtml(html, tool) {
  const { title, description, canonical, keywords, jsonLd } = buildHead(tool)

  let out = html

  // <title>
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)

  // meta description / keywords / robots (assumes tags already exist from index.html template)
  out = out.replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${description}" />`)
  out = out.replace(/<meta name="keywords" content="[^"]*"\s*\/?>/, `<meta name="keywords" content="${keywords}" />`)

  // canonical
  out = out.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`)

  // Open Graph
  out = out.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${title}" />`)
  out = out.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${description}" />`)
  out = out.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonical}" />`)

  // Twitter
  out = out.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${title}" />`)
  out = out.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${description}" />`)

  // Inject JSON-LD structured data right before </head> (only if not already present)
  if (!out.includes('data-codepackr-seo="jsonld-prerendered"')) {
    out = out.replace(
      '</head>',
      `  <script type="application/ld+json" data-codepackr-seo="jsonld-prerendered">${jsonLd}</script>\n  </head>`,
    )
  }

  return out
}

function run() {
  const indexPath = join(distDir, 'index.html')
  if (!existsSync(indexPath)) {
    console.error('dist/index.html not found. Run `vite build` first.')
    process.exit(1)
  }

  const template = readFileSync(indexPath, 'utf-8')
  let count = 0

  for (const tool of allTools) {
    const outPath = join(distDir, `${tool.id}.html`)
    const html = injectIntoHtml(template, tool)
    writeFileSync(outPath, html, 'utf-8')
    count++
  }

  console.log(`Prerendered ${count} tool pages with unique title/description/canonical/JSON-LD.`)
}

run()
