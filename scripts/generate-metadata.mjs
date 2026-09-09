import fs from 'node:fs';
import path from 'node:path';

// Read tools from src/data/tools.ts
const toolsSource = fs.readFileSync(path.resolve('src/data/tools.ts'), 'utf8');
const toolsSection = toolsSource.slice(toolsSource.indexOf('export const TOOLS: ToolDef[] = ['));
const regex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',\s*description:\s*'([^']+)'/g;

const baseTools = new Map();
let m;
while ((m = regex.exec(toolsSection)) !== null) {
  baseTools.set(m[1], {
    id: m[1],
    name: m[2],
    category: m[3],
    description: m[4]
  });
}

// Sub-feature & alias definitions
const aliasDefinitions = {
  'json-minifier': {
    name: 'JSON Minifier & Compressor',
    category: 'formatters',
    description: 'Compress, minify, and remove whitespace from JSON data online to minimize payload size and optimize API requests.'
  },
  'crc32-checksum-generator': {
    name: 'CRC32 Checksum Generator',
    category: 'encoders',
    description: 'Compute 32-bit cyclic redundancy check (CRC32) checksums for text, binary strings, and code files locally.'
  },
  'hmac-generator': {
    name: 'HMAC Generator & Authenticator',
    category: 'encoders',
    description: 'Generate keyed-hash message authentication codes (HMAC) using SHA-256, SHA-512, and MD5 algorithms.'
  },
  'retirement-calculator': {
    name: 'Retirement & Financial Planning Calculator',
    category: 'financial-calculators',
    description: 'Calculate your retirement corpus, projected vs required savings, inflation impact, and get actionable financial independence strategies.'
  },
  'financial-planner': {
    name: 'Retirement & Financial Planning Calculator',
    category: 'financial-calculators',
    description: 'Calculate your retirement corpus, projected vs required savings, inflation impact, and get actionable financial independence strategies.'
  },
  'sip-calculator': {
    name: 'SIP Calculator',
    category: 'financial-calculators',
    description: 'Calculate future wealth and expected maturity values for Systematic Investment Plans (SIP) and mutual fund investments with compounding graphs.'
  },
  'investment-calculator': {
    name: 'Investment Calculator',
    category: 'calculators',
    description: 'Calculate long-term investment growth, future portfolio values, and compound interest earnings with customizable deposit schedules and interactive graphs.'
  },
  'compound-investment-calculator': {
    name: 'Compound Investment Calculator',
    category: 'calculators',
    description: 'Calculate long-term compound growth, future investment values, and interest earnings with customizable deposit schedules and interactive graphs.'
  },
  'compound-interest-calculator': {
    name: 'Compound Interest Calculator',
    category: 'calculators',
    description: 'Calculate future compound interest, effective annual rate, and portfolio appreciation over time with visual growth breakdown.'
  },
  'json-definition-generator': {
    name: 'JSON Definition & Type Generator',
    category: 'converters',
    description: 'Convert JSON payloads into TypeScript interfaces, JSON Schema, Python Pydantic models, C# POCO, Java POJO, Go structs, and Rust Serde types.'
  },
  'json-to-definition': {
    name: 'JSON to Type Definition Converter',
    category: 'converters',
    description: 'Generate strongly-typed schemas and interfaces from raw JSON data across 7+ popular programming languages.'
  },
  'edi-tools': {
    name: 'EDI Tools & Business Transaction Suite',
    category: 'edi',
    description: 'All-in-one developer toolkit for ANSI ASC X12, UN/EDIFACT, 997 & CONTRL acknowledgments, AS2 messaging, JSON converters, and syntax validation.'
  },
  'edi-formatter': {
    name: 'EDI X12 Formatter & Beautifier',
    category: 'edi',
    description: 'Format, beautify, and indent raw ANSI ASC X12 and EDIFACT EDI transactions with automatic segment terminator and element delimiter detection.'
  },
  'edi-to-json': {
    name: 'EDI to JSON Converter',
    category: 'edi',
    description: 'Convert ANSI ASC X12 and UN/EDIFACT EDI documents into structured JSON objects and arrays for fast software integration.'
  },
  'edi-x12-formatter': {
    name: 'EDI X12 Formatter & Beautifier',
    category: 'edi',
    description: 'Format, beautify, and indent raw ANSI ASC X12 EDI transactions with automatic segment terminator and element delimiter detection.'
  },
  'edi-json-converter': {
    name: 'EDI to JSON Converter',
    category: 'edi',
    description: 'Convert ANSI ASC X12 EDI documents into structured JSON objects and arrays for fast software integration.'
  },
  'edi-lifecycle-reconciliation': {
    name: 'EDI Order Lifecycle Reconciliation Viewer',
    category: 'edi',
    description: 'Cross-reference 850, 855, 856, 810, and 997 documents by PO and control number to visualize the full order lifecycle and flag missing or mismatched stages.'
  },
  'edi-order-reconciliation': {
    name: 'EDI Order Lifecycle Reconciliation Viewer',
    category: 'edi',
    description: 'Cross-reference 850, 855, 856, 810, and 997 documents by PO and control number to visualize the full order lifecycle and flag missing or mismatched stages.'
  },
  'markdown-preview': {
    name: 'Markdown Editor & Live Preview',
    category: 'utilities',
    description: 'Write, edit, and preview GitHub-flavored Markdown text with live HTML rendering and syntax formatting.'
  },
  'markdown': {
    name: 'Markdown Editor & Live Preview',
    category: 'utilities',
    description: 'Write, edit, and preview GitHub-flavored Markdown text with live HTML rendering and syntax formatting.'
  },
  'what-is-my-screen-resolution': {
    name: 'Screen Resolution & Viewport Checker',
    category: 'utilities',
    description: 'Check your current device screen resolution, browser viewport size, display scaling ratio, and pixel density.'
  },
  'what-is-my-user-agent': {
    name: 'User Agent String & Client Inspector',
    category: 'utilities',
    description: 'Inspect your browser User-Agent header, operating system, rendering engine, and device client hints.'
  },
  'word-counter': {
    name: 'Word Counter & Text Statistics',
    category: 'text',
    description: 'Count words, characters, sentences, paragraphs, and estimated reading time in real time with instant metrics.'
  },
  'character-counter': {
    name: 'Character & Byte Counter',
    category: 'text',
    description: 'Accurately count characters with and without whitespace, UTF-8 bytes, glyphs, and character lengths.'
  },
  'line-counter': {
    name: 'Line Counter & Code Metrics',
    category: 'text',
    description: 'Count total lines, non-blank lines, blank lines, and average line lengths in source code or plain text.'
  },
  'sentence-counter': {
    name: 'Sentence Counter & Readability',
    category: 'text',
    description: 'Count sentences, clauses, and calculate readability grade scores for essays, articles, and documentation.'
  },
  'remove-duplicate-lines': {
    name: 'Remove Duplicate Lines',
    category: 'text',
    description: 'Instantly remove duplicate lines from lists, text logs, and files with case sensitivity options.'
  },
  'remove-empty-lines': {
    name: 'Remove Empty & Blank Lines',
    category: 'text',
    description: 'Strip empty lines, whitespace-only rows, and redundant line breaks from documents and source code.'
  },
  'remove-extra-spaces': {
    name: 'Remove Extra Spaces & Normalize',
    category: 'text',
    description: 'Trim leading and trailing whitespace, normalize multiple spaces into single spaces, and clean text.'
  },
  'sort-lines-alphabetically': {
    name: 'Sort Lines Alphabetically',
    category: 'text',
    description: 'Sort lists and text files alphabetically (A-Z or Z-A), with case-sensitive, numeric, or natural sorting.'
  },
  'reverse-line-order': {
    name: 'Reverse Line Order',
    category: 'text',
    description: 'Flip lines of text upside down, reversing the sequence from bottom to top for logs, timestamps, and lists.'
  },
  'contact': {
    name: 'Contact & Feedback',
    category: 'general',
    description: 'Get in touch with the Codepackr development team for bug reports, tool requests, and developer feedback.'
  },
  'privacy': {
    name: 'Privacy Policy',
    category: 'general',
    description: 'Learn how Codepackr protects developer privacy with 100% client-side code execution and zero server payload storage.'
  },
  'terms': {
    name: 'Terms and Conditions',
    category: 'general',
    description: 'Terms of service, user guidelines, and disclaimer for using Codepackr free online developer and business utility tools.'
  },
  'formatters': {
    name: 'Code & Data Formatters Suite',
    category: 'formatters',
    description: 'All-in-one developer suite of code beautifiers and minifiers for JSON, SQL, HTML, CSS, XML, and YAML data.'
  },
  'image-tools': {
    name: 'Image Processing & Optimization Tools Suite',
    category: 'image',
    description: '100% private, client-side image utilities to merge, resize, compress, strip EXIF metadata, compare diffs, convert Base64, and generate favicons.'
  },
  'image': {
    name: 'Image Processing & Optimization Tools Suite',
    category: 'image',
    description: '100% private, client-side image utilities to merge, resize, compress, strip EXIF metadata, compare diffs, convert Base64, and generate favicons.'
  },
  'encoders': {
    name: 'Encoders, Decoders & Cryptography Tools',
    category: 'encoders',
    description: 'Comprehensive suite of Base64, URL, HTML entity encoders, JWT decoders, and SHA/MD5/CRC32 cryptographic hashing tools.'
  },
  'validators': {
    name: 'Syntax, Schema & Diff Validators',
    category: 'validators',
    description: 'Validate JSON syntax, XSD schemas, regex patterns, text diffs, and structured documents locally in your browser.'
  },
  'converters': {
    name: 'Data & File Format Converters',
    category: 'converters',
    description: 'Convert between JSON, XML, CSV, YAML, Markdown, cURL code commands, and image formats effortlessly.'
  },
  'calculators': {
    name: 'Financial & Math Calculators Suite',
    category: 'financial-calculators',
    description: 'Calculate loans, monthly EMIs, amortization schedules, SIP returns, percentages, and gratuity tips with multi-currency support.'
  },
  'financial-calculators': {
    name: 'Financial & Retirement Calculators Suite',
    category: 'financial-calculators',
    description: 'Calculate retirement corpus, loan EMIs, SIP compounding, investments, and inflation-adjusted financial independence strategies.'
  },
  'xsd-validator': {
    name: 'XSD & XML Schema Validator',
    category: 'xml',
    description: 'Validate XML structures against W3C XSD schema definitions, element constraints, and data types locally in your browser.'
  },
  'utilities': {
    name: 'Developer Utilities & Generators',
    category: 'utilities',
    description: 'Essential developer tools including UUID generators, QR codes, strong password generators, cron expressions, and mock data.'
  },
  'text-tools': {
    name: 'Text Processing & Analysis Tools',
    category: 'text',
    description: 'Real-time word and character counters, duplicate line removers, whitespace cleaners, and text sorters.'
  },
  'xml-tools': {
    name: 'XML, XSD, XSLT & XPath Suite',
    category: 'xml',
    description: 'Transform XML using XSLT, evaluate XPath expressions, validate schemas, and generate XSD structures.'
  },
  'as2-encoder-decoder': {
    name: 'AS2 S/MIME Encoder & Decoder',
    category: 'edi',
    description: 'Encode, sign, encrypt, and inspect AS2 S/MIME payloads for secure B2B electronic data interchange.'
  },
  'as2-mdn-generator': {
    name: 'AS2 Message Disposition Notification (MDN) Generator',
    category: 'edi',
    description: 'Generate and parse synchronous or asynchronous AS2 Message Disposition Notifications (MDN) with MIC hashes.'
  },
  'gs1-128-generator': {
    name: 'GS1-128 Shipping Barcode Generator',
    category: 'edi',
    description: 'Generate high-resolution GS1-128 shipping container barcodes with Application Identifiers (AI) and human-readable text.'
  },
  'sscc-18-generator': {
    name: 'Serial Shipping Container Code (SSCC-18) Generator',
    category: 'edi',
    description: 'Calculate Mod-10 check digits and generate standard 18-digit Serial Shipping Container Code (SSCC-18) labels.'
  }
};

// Sitemap slugs
const sitemap = fs.readFileSync(path.resolve('public/sitemap.xml'), 'utf8');
const sitemapSlugs = [...sitemap.matchAll(/<loc>https:\/\/www\.codepackr\.com\/([^<]+)<\/loc>/g)]
  .map(m => m[1].replace(/^\/+|\/+$/g, '').replace(/\.html$/, ''))
  .filter(Boolean);

// Specific custom content helpers by category and tool
function getCategoryFeatures(category, toolName) {
  switch (category) {
    case 'image':
      return [
        `High-performance, 100% browser-based HTML5 canvas image processing for ${toolName}.`,
        'Zero file uploads: your photos, screenshots, and graphics never leave your local device.',
        'Precision layout, dimensions, compression quality, and format controls (PNG, JPEG, WebP).',
        'Built-in privacy safeguards: strip sensitive GPS and camera EXIF metadata in seconds.',
        'Instant live preview with fast one-click download in full resolution.'
      ];
    case 'formatters':
      return [
        `Customizable indentation options (2 spaces, 4 spaces, or tabs) for ${toolName}.`,
        'Instant error detection with precise line and column indicators for syntax issues.',
        'Minification mode to compress code and remove unnecessary whitespace.',
        '100% in-browser processing ensuring source code never leaves your computer.',
        'One-click copy to clipboard and downloadable formatted output.'
      ];
    case 'encoders':
      return [
        `High-speed encoding and decoding for ${toolName} with zero latency.`,
        'Support for UTF-8 character sets, binary buffers, and multi-line strings.',
        'Cryptographically secure local processing using modern Web Crypto APIs.',
        'Instant validation and format error diagnostics.',
        'One-click copy to clipboard and local file export.'
      ];
    case 'validators':
      return [
        `Comprehensive syntax and schema validation for ${toolName}.`,
        'Detailed line-by-line error reporting with actionable diagnostic messages.',
        'Support for complex schemas, recursive structures, and edge cases.',
        'Zero network transfer: all validation occurs inside your browser runtime.',
        'Export clean data or copy validation results with one click.'
      ];
    case 'converters':
      return [
        `Bidirectional conversion and schema mapping for ${toolName}.`,
        'Preserves data integrity, data types, and structural hierarchies.',
        'Live side-by-side input and converted output preview.',
        'Fully client-side execution protecting sensitive files and payloads.',
        'Quick copy, file download, and clearing tools.'
      ];
    case 'edi':
      return [
        `Specialized parsing for ANSI ASC X12 and EDIFACT standard transactions.`,
        'Automatic detection of segment terminators (~, newline) and element separators (*).',
        'Structured segment tree viewer for loops, headers, and trailers (ISA, GS, ST, SE, GE, IEA).',
        'Zero server transmission — EDI payloads with sensitive PII/PHI remain strictly local.',
        'Standard compliance checks and export options for integration workflows.'
      ];
    case 'xml':
      return [
        `Standards-compliant XML parsing and schema processing for ${toolName}.`,
        'Support for namespaces, attributes, self-closing tags, and CDATA blocks.',
        'Real-time XPath evaluation and XSD schema validation.',
        'Safe local execution with protection against external entity attacks (XXE).',
        'Formatted syntax highlighting with expandable code nodes.'
      ];
    case 'calculators':
    case 'financial-calculators':
      return [
        `Accurate mathematical calculations with instant reactive updates for ${toolName}.`,
        'Detailed breakdown tables with visual graphs and itemized summaries.',
        'Customizable interest rates, compounding frequencies, and terms.',
        'Completely private: financial figures and inputs remain on your device.',
        'Export calculation reports and shareable configurations.'
      ];
    case 'text':
      return [
        `Real-time processing for text operations with instant character and line counts.`,
        'Configurable options for case sensitivity, whitespace trimming, and sorting order.',
        'High-performance processing capable of handling large multiline text files.',
        'Zero server logging: text data is transformed exclusively in browser memory.',
        'One-click copy to clipboard and text file download.'
      ];
    case 'utilities':
    default:
      return [
        `Fast, responsive browser utility for ${toolName} with intuitive controls.`,
        'Modern developer-first UI optimized for dark and light themes.',
        'Runs offline and locally without sending telemetry on your inputs.',
        'Instant output generation with convenient one-click copying.',
        'Keyboard shortcuts and clean ergonomics for high-productivity development.'
      ];
  }
}

function getCategoryHowToUse(category, toolName) {
  switch (category) {
    case 'image':
      return [
        `Upload or drag-and-drop your image files directly into the browser tool workspace.`,
        `Adjust desired dimensions, layout orientation, alignment, padding, or quality settings.`,
        `Inspect the real-time canvas preview or review diagnostic metadata details.`,
        `Download the processed image or copy generated assets with a single click.`
      ];
    case 'formatters':
      return [
        `Paste your raw code or unformatted text into the editor.`,
        `Select your preferred formatting preferences (such as 2 spaces, 4 spaces, or minify).`,
        `Click Format to beautify and validate your syntax.`,
        `Review the formatted output, copy it to your clipboard, or download it as a file.`
      ];
    case 'encoders':
      return [
        `Input your plain text, string, or secret key into the input field.`,
        `Choose your desired encoding/decoding mode or hashing algorithm.`,
        `View the generated output immediately as you type.`,
        `Copy the resulting hash, token, or encoded string with a single click.`
      ];
    case 'validators':
      return [
        `Paste your code, schema, or document into the validation window.`,
        `Click Validate to inspect syntax, schema compliance, and format rules.`,
        `Review any highlighted errors, line numbers, and warnings in the results pane.`,
        `Fix issues directly in the editor or copy the validated content.`
      ];
    case 'converters':
      return [
        `Paste or upload the source data into the left input pane.`,
        `Configure conversion settings such as formatting style, delimiters, or indentations.`,
        `The converted output appears automatically in the right output pane.`,
        `Copy the converted code or download the resulting document.`
      ];
    case 'edi':
      return [
        `Paste your raw EDI transaction (e.g. 834, 837, 850, 855) into the EDI workspace.`,
        `The tool auto-detects segment delimiters (like ~ or newline) and element separators (*).`,
        `Inspect formatted segments, loop hierarchies, or generated JSON/997 outputs.`,
        `Copy or save your clean EDI output for testing and trading partner integration.`
      ];
    default:
      return [
        `Enter or adjust the input parameters in the tool control panel.`,
        `View real-time updates and calculation or generation results instantly.`,
        `Copy the result to your clipboard or customize settings as needed.`
      ];
  }
}

function getCategoryFAQs(category, toolName) {
  return [
    {
      question: `Is my data or code sent to an external server when using ${toolName}?`,
      answer: `No. All operations in ${toolName} execute 100% client-side in your web browser. Your source code, tokens, queries, and files never leave your computer or get transmitted to any remote server.`
    },
    {
      question: `Can I use ${toolName} offline without an internet connection?`,
      answer: `Yes. Codepackr is engineered as a Progressive Web App (PWA) with service-worker caching. Once loaded in your browser, you can continue using ${toolName} offline.`
    },
    {
      question: `Are there any usage limits, fees, or account registrations required?`,
      answer: `No. All developer tools on Codepackr are 100% free to use. There are no daily quotas, paywalls, or account sign-up requirements.`
    },
    {
      question: `How does ${toolName} handle large files or sensitive data?`,
      answer: `Because execution happens locally in your browser using modern Web APIs and V8 JavaScript engine optimizations, you get maximum privacy and low latency without network transfer limits.`
    }
  ];
}

const metadataMap = {};

// 1. Process all sitemap slugs
for (const slug of sitemapSlugs) {
  let info = aliasDefinitions[slug];
  if (!info) {
    info = baseTools.get(slug);
  }
  if (!info) {
    info = {
      name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      category: 'utilities',
      description: `Free online ${slug.split('-').join(' ')} tool for developers. Fast, client-side, and private.`
    };
  }

  const title = `${info.name} - Codepackr`;
  const canonicalUrl = `https://www.codepackr.com/${slug}`;

  metadataMap[slug] = {
    name: info.name,
    title,
    description: info.description,
    canonicalPath: `/${slug}`,
    canonicalUrl,
    category: info.category,
    features: getCategoryFeatures(info.category, info.name),
    howToUse: getCategoryHowToUse(info.category, info.name),
    faqs: getCategoryFAQs(info.category, info.name)
  };
}

// 2. Also map base tools that might have aliases
for (const [toolId, tool] of baseTools) {
  if (!metadataMap[toolId]) {
    const title = `${tool.name} - Codepackr`;
    const canonicalSlug = toolId;
    const canonicalUrl = `https://www.codepackr.com/${canonicalSlug}`;

    metadataMap[toolId] = {
      name: tool.name,
      title,
      description: tool.description,
      canonicalPath: `/${canonicalSlug}`,
      canonicalUrl,
      category: tool.category,
      features: getCategoryFeatures(tool.category, tool.name),
      howToUse: getCategoryHowToUse(tool.category, tool.name),
      faqs: getCategoryFAQs(tool.category, tool.name)
    };
  }
}

// 3. Add home page metadata
metadataMap['home'] = {
  name: 'Codepackr',
  title: 'Codepackr - Free Online Developer Tools',
  description: 'Free online developer tools for formatting, validating, encoding, converting, and inspecting data locally in your browser with 100% privacy.',
  canonicalPath: '/',
  canonicalUrl: 'https://www.codepackr.com/',
  category: 'general',
  features: [
    'Over 60+ developer utilities for JSON, XML, EDI, YAML, SQL, regex, and encoding.',
    '100% client-side execution ensuring zero code payloads leave your browser.',
    'PWA offline caching for reliable on-the-go development without internet.',
    'Clean, responsive design with full dark mode and light mode support.',
    'No registration, no accounts, and no usage limitations.'
  ],
  howToUse: [
    'Browse tools by category or press Ctrl+K / Cmd+K to search instantly.',
    'Select any formatter, validator, converter, or calculator.',
    'Paste your input data to view real-time processed results.',
    'Bookmark your most frequently used tools for one-click access.'
  ],
  faqs: [
    {
      question: 'What is Codepackr?',
      answer: 'Codepackr is a collection of high-performance developer tools designed to run entirely client-side in your web browser with maximum speed and complete privacy.'
    },
    {
      question: 'Are my code and data private on Codepackr?',
      answer: 'Yes. All data processing occurs locally on your machine using JavaScript. We never upload or save your code, secrets, or inputs to any external server.'
    },
    {
      question: 'Is Codepackr free to use?',
      answer: 'Yes, Codepackr is completely free with no usage limits or account registration required.'
    }
  ]
};

// Write out JSON
fs.writeFileSync(
  path.resolve('src/data/toolMetadata.json'),
  JSON.stringify(metadataMap, null, 2),
  'utf8'
);

console.log(`Generated metadata for ${Object.keys(metadataMap).length} routes into src/data/toolMetadata.json`);
