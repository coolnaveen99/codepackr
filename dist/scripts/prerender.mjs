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
const toolContent = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'tool-content.json'), 'utf-8'))

const categories = [
  {
    name: 'Formatters',
    tools: [
      { id: 'json-formatter', name: 'JSON Formatter', description: 'Beautify, minify, and validate JSON' },
      { id: 'json-minifier', name: 'JSON Minifier', description: 'Minify JSON and validate its syntax' },
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
      { id: 'crc32-checksum-generator', name: 'CRC32 Checksum Generator', description: 'Calculate a CRC32 checksum for text or a file' },
      { id: 'hmac-generator', name: 'HMAC Generator', description: 'Create keyed HMAC signatures locally' },
      { id: 'jwt-decoder', name: 'JWT Decoder', description: 'Decode and inspect JWT tokens' },
      { id: 'jwt-encoder', name: 'JWT Encoder', description: 'Build and sign HS256 JSON Web Tokens' },
      { id: 'base64-image', name: 'Base64 Image', description: 'Encode images as Base64 or decode data URLs' },
    ],
  },
  {
    name: 'Calculators',
    tools: [
      { id: 'calculator', name: 'Calculator', description: 'Scientific calculator for quick math' },
      { id: 'percentage-calculator', name: 'Percentage Calculator', description: 'Calculate percentages, increases, and decreases' },
      { id: 'tip-calculator', name: 'Tip Calculator', description: 'Calculate tips and split a bill' },
      { id: 'sip-calculator', name: 'SIP Calculator', description: 'Estimate returns from monthly investments' },
      { id: 'loan-calculator', name: 'Loan Calculator', description: 'Calculate loan EMI, interest, and repayment' },
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
      { id: 'json-structural-diff', name: 'Structural JSON Diff', description: 'Compare JSON by keys and values' },
      { id: 'dotenv-formatter', name: 'dotenv Formatter', description: 'Format and validate .env files' },
    ],
  },
  {
    name: 'Converters',
    tools: [
      { id: 'json-xml-converter', name: 'JSON to XML / XML to JSON', description: 'Convert JSON to XML or XML to JSON' },
      { id: 'json-csv-converter', name: 'JSON to CSV / CSV to JSON', description: 'Convert JSON to CSV or CSV to JSON' },
      { id: 'csv-xml-converter', name: 'CSV to XML / XML to CSV', description: 'Convert CSV to XML or XML to CSV' },
      { id: 'case-converter', name: 'Case Converter', description: 'Convert text between common naming conventions' },
      { id: 'yaml-json-converter', name: 'YAML to JSON Converter', description: 'Convert YAML and JSON in either direction' },
      { id: 'number-base-converter', name: 'Number Base Converter', description: 'Convert binary, octal, decimal, and hexadecimal' },
      { id: 'markdown-html-converter', name: 'Markdown to HTML', description: 'Convert Markdown into raw HTML' },
      { id: 'html-markdown-converter', name: 'HTML to Markdown', description: 'Convert HTML markup into Markdown' },
      { id: 'curl-code-converter', name: 'cURL to Code', description: 'Convert cURL commands to fetch, Axios, or Python' },
      { id: 'image-resizer', name: 'Image Resizer', description: 'Resize and compress images in your browser' },
      { id: 'favicon-generator', name: 'Favicon Generator', description: 'Generate ICO and common PNG favicon sizes' },
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
      { id: 'what-is-my-screen-resolution', name: 'What Is My Screen Resolution', description: 'See your current screen resolution' },
      { id: 'what-is-my-user-agent', name: 'What Is My User Agent', description: 'See your browser user agent string' },
      { id: 'markdown', name: 'Markdown Preview', description: 'Live markdown editor and preview' },
      { id: 'color-converter', name: 'Color Converter', description: 'Convert HEX, RGB, and HSL colors' },
      { id: 'timestamp', name: 'Timestamp Converter', description: 'Convert Unix timestamps and dates' },
      { id: 'cron-expression', name: 'Cron Expression', description: 'Build and explain cron schedules' },
      { id: 'slugify', name: 'Slugify Tool', description: 'Turn text into a clean URL-safe slug' },
      { id: 'http-status-codes', name: 'HTTP Status Code Lookup', description: 'Search HTTP codes, names, and descriptions' },
      { id: 'mock-json-generator', name: 'Mock JSON Generator', description: 'Generate fake records from a simple schema' },
    ],
  },
  {
    name: 'Contact',
    tools: [{ id: 'contact', name: 'Contact', description: 'Contact form and project details' }],
  },
]

const allTools = categories.flatMap((c) => c.tools.map((t) => ({ ...t, category: c.name })))
const textOperationLandingPages = [
  { id: 'word-counter', name: 'Word Counter', description: 'Count words, characters, and sentences online free' },
  { id: 'character-counter', name: 'Character Counter', description: 'Count characters in text online free' },
  { id: 'line-counter', name: 'Line Counter', description: 'Count lines in text online free' },
  { id: 'sentence-counter', name: 'Sentence Counter', description: 'Count sentences in text online free' },
  { id: 'remove-duplicate-lines', name: 'Remove Duplicate Lines', description: 'Remove duplicate lines from text online free' },
  { id: 'remove-empty-lines', name: 'Remove Empty Lines', description: 'Remove empty lines from text online free' },
  { id: 'remove-extra-spaces', name: 'Remove Extra Spaces', description: 'Collapse extra spaces and tabs in text online free' },
  { id: 'sort-lines-alphabetically', name: 'Sort Lines Alphabetically', description: 'Sort text lines alphabetically online free' },
  { id: 'reverse-line-order', name: 'Reverse Line Order', description: 'Reverse the order of text lines online free' },
].map((tool) => ({ ...tool, category: 'Text Tools' }))
const prerenderTools = [...allTools, ...textOperationLandingPages]

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHead(tool) {
  const title = tool ? `Free ${tool.name} Online | Codepackr` : 'Codepackr - Free Online Developer Tools'
  const description = tool
    ? `${tool.description}. Free online ${tool.name.toLowerCase()} from Codepackr. Runs locally in your browser.`
    : 'Free online developer tools for formatting, validating, encoding, converting, and inspecting data locally in your browser. No upload, no sign-up.'
  const canonical = tool ? `${siteUrl}/${tool.id}.html` : `${siteUrl}/`
  const keywords = tool
    ? `${tool.name.toLowerCase()}, ${tool.category.toLowerCase()}, codepackr, developer tools, online tools`
    : 'developer tools, json formatter, sql formatter, yaml formatter, diff checker, base64 encoder, qr code generator, password generator, edi tools'
  const jsonLd = JSON.stringify(
    tool
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          url: canonical,
          description,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Codepackr',
          url: canonical,
          description,
        },
  )

  return { title: escapeHtml(title), description: escapeHtml(description), canonical, keywords: escapeHtml(keywords), jsonLd }
}

// Static markup written into #root so crawlers get real text and crawlable
// <a href> links without executing JavaScript. React replaces it on mount.
function buildToolIndexHtml(activeId) {
  return categories
    .map((category) => {
      const links = category.tools
        .map((t) => {
          const current = t.id === activeId ? ' aria-current="page"' : ''
          return `<li><a href="/${t.id}.html"${current}><strong>${escapeHtml(t.name)}</strong> &ndash; ${escapeHtml(t.description)}</a></li>`
        })
        .join('')
      return `<section><h2>${escapeHtml(category.name)}</h2><ul>${links}</ul></section>`
    })
    .join('')
}

function buildBody(tool) {
  const heading = tool ? tool.name : 'Codepackr &ndash; Free Online Developer Tools'
  const intro = tool
    ? `${escapeHtml(tool.description)}. All processing runs locally in your browser &mdash; your data is never uploaded to a server.`
    : 'Codepackr is a free collection of browser-based developer tools for formatting, validating, encoding, converting, and inspecting data. Every tool runs entirely in your browser &mdash; nothing is uploaded to a server.'
  const breadcrumb = tool
    ? `<nav aria-label="Breadcrumb"><a href="/">Home</a> / ${escapeHtml(tool.category)} / ${escapeHtml(tool.name)}</nav>`
    : ''
  const content = tool ? toolContent[tool.id] ?? { steps: [`Enter or select the data for ${tool.name}.`, 'Adjust the available options if needed.', 'Review the result and copy it for use in your project.'], faq: [['Does this tool upload my data?', 'No. All processing runs locally in your browser, and Codepackr does not upload your input.'], ['Can I use this tool for free?', 'Yes. This tool is free to use without an account or installation.']] } : null
  const related = tool ? allTools.filter((candidate) => candidate.id !== tool.id && candidate.category === tool.category).slice(0, 4) : []
  const textToolsLink = tool && textOperationLandingPages.some((candidate) => candidate.id === tool.id) ? '<p><a href="/text-tools.html">Open all Text Tools</a></p>' : ''
  const toolGuide = tool && content
    ? `<section><h2>How to use ${escapeHtml(tool.name)}</h2><ol>${content.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol><h2>${escapeHtml(tool.name)} FAQ</h2>${content.faq.map(([question, answer]) => `<h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p>`).join('')}${textToolsLink}<h2>Related tools</h2><ul>${related.map((candidate) => `<li><a href="/${candidate.id}.html">${escapeHtml(candidate.name)}</a></li>`).join('')}</ul></section>`
    : ''

  return [
    '<div id="root" data-codepackr-prerendered>',
    '<header><a href="/">Codepackr</a></header>',
    breadcrumb,
    `<main><h1>${tool ? escapeHtml(heading) : heading}</h1><p>${intro}</p>`,
    toolGuide,
    `<nav aria-label="All tools">${buildToolIndexHtml(tool?.id)}</nav>`,
    '</main>',
    '<footer><a href="/sitemap.xml">Sitemap</a><span>Copyright 2026 Codepackr</span></footer>',
    '</div>',
  ].join('')
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

  out = out.replace(/<div id="root">[\s\S]*?<\/div>/, buildBody(tool))

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

  for (const tool of prerenderTools) {
    const outPath = join(distDir, `${tool.id}.html`)
    writeFileSync(outPath, injectIntoHtml(template, tool), 'utf-8')
    count++
  }

  writeFileSync(indexPath, injectIntoHtml(template, null), 'utf-8')

  const today = new Date().toISOString().slice(0, 10)
  const urls = [
    `  <url><loc>${siteUrl}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...prerenderTools.map(
      (t) => `  <url><loc>${siteUrl}/${t.id}.html</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
    ),
  ].join('\n')
  writeFileSync(
    join(distDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf-8',
  )

  console.log(`Prerendered ${count} tool pages + homepage with unique metadata, static content, and crawlable links.`)
}

run()
