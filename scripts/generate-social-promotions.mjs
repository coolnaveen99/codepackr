import fs from 'node:fs';
import path from 'node:path';

// Load tool metadata and sitemap data if available
let metadata = {};
try {
  metadata = JSON.parse(fs.readFileSync('src/data/toolMetadata.json', 'utf8'));
} catch (e) {
  // fallback if not generated yet
}

let sitemapUrls = [];
try {
  const sitemapData = JSON.parse(fs.readFileSync('src/data/sitemapUrls.json', 'utf8'));
  sitemapUrls = sitemapData.urls || [];
} catch (e) {
  // fallback
}

// Curated live tools list with specific action descriptions and hashtags
const toolsData = [
  // 1. EDI & B2B Suite
  {
    slug: 'edi-tools',
    name: 'EDI Tools & Business Transaction Suite',
    desc: 'Format, validate, convert, and inspect ANSI ASC X12 and EDIFACT EDI documents',
    tags: ['#EDI', '#B2B', '#SupplyChain', '#EDITools', '#Enterprise']
  },
  {
    slug: 'edi-order-reconciliation',
    name: 'EDI Order Lifecycle Reconciliation',
    desc: 'Audit POs (850), Acks (855), ASNs (856), and Invoices (810) with automated 3-way matching',
    tags: ['#EDI', '#SupplyChain', '#OrderToCash', '#Invoicing', '#B2BIntegration']
  },
  {
    slug: 'edi-lifecycle-reconciliation',
    name: 'EDI Order Lifecycle Reconciliation',
    desc: 'Audit POs (850), Acks (855), ASNs (856), and Invoices (810) with automated 3-way matching',
    tags: ['#EDI', '#SupplyChain', '#OrderToCash', '#Invoicing', '#B2BIntegration']
  },
  {
    slug: 'gs1-sscc-label-generator',
    name: 'GS1 SSCC-18 Logistics Label Generator',
    desc: 'Generate GS1-128 compliant pallet and carton shipping labels with SSCC-18 barcodes and Mod-10 check digits',
    tags: ['#GS1', '#SSCC18', '#SupplyChain', '#Logistics', '#BarcodeGenerator']
  },
  {
    slug: 'as2-tools',
    name: 'AS2 Message Suite & MDN Generator',
    desc: 'Encode, decode, parse MIME headers, calculate MICs, and generate AS2 MDN receipts',
    tags: ['#AS2', '#EDI', '#CyberSecurity', '#MDN', '#B2BIntegration']
  },
  {
    slug: 'as2-encoder-decoder',
    name: 'AS2 S/MIME Encoder & Decoder',
    desc: 'Sign, encrypt, and inspect AS2 S/MIME payloads for secure B2B electronic data interchange',
    tags: ['#AS2', '#SMIME', '#CyberSecurity', '#Cryptography', '#B2B']
  },
  {
    slug: 'as2-mdn-generator',
    name: 'AS2 Message Disposition Notification Generator',
    desc: 'Generate and parse synchronous or asynchronous AS2 Message Disposition Notifications (MDN)',
    tags: ['#AS2', '#MDN', '#EDI', '#Receipts', '#B2BIntegration']
  },
  {
    slug: 'gs1-128-generator',
    name: 'GS1-128 Shipping Barcode Generator',
    desc: 'Generate high-resolution GS1-128 shipping container barcodes with Application Identifiers',
    tags: ['#GS1', '#Barcode', '#Packaging', '#Warehousing', '#Logistics']
  },
  {
    slug: 'sscc-18-generator',
    name: 'Serial Shipping Container Code (SSCC-18) Generator',
    desc: 'Calculate Mod-10 check digits and generate standard 18-digit Serial Shipping Container Codes',
    tags: ['#SSCC', '#GS1', '#Logistics', '#Shipping', '#SupplyChain']
  },
  {
    slug: 'edi-formatter',
    name: 'EDI X12 Formatter & Beautifier',
    desc: 'Format and inspect raw ANSI ASC X12 and EDIFACT EDI transactions',
    tags: ['#EDI', '#X12', '#EDIX12FormatterBeautifier', '#Formatter', '#Beautifier']
  },
  {
    slug: 'edi-x12-formatter',
    name: 'EDI X12 Formatter & Beautifier',
    desc: 'Format and inspect raw ANSI ASC X12 and EDIFACT EDI transactions',
    tags: ['#EDI', '#X12', '#EDIX12FormatterBeautifier', '#Formatter', '#Beautifier']
  },
  {
    slug: 'edi-segment-viewer',
    name: 'EDI Segment Viewer',
    desc: 'Inspect EDI transactions by segment for easier troubleshooting',
    tags: ['#EDI', '#X12', '#EDISegmentViewer', '#Segment', '#Viewer']
  },
  {
    slug: 'edi-to-json',
    name: 'EDI to JSON Converter',
    desc: 'Convert EDI transaction data to clean structured JSON representations',
    tags: ['#EDI', '#JSON', '#EDIJSONConverter', '#Converter']
  },
  {
    slug: 'edi-json-converter',
    name: 'EDI to JSON Converter',
    desc: 'Convert EDI transaction data to clean structured JSON representations',
    tags: ['#EDI', '#JSON', '#EDIJSONConverter', '#Converter']
  },
  {
    slug: 'edi-validator',
    name: 'EDI Validator',
    desc: 'Validate EDI transaction structure, envelope segments, and syntax',
    tags: ['#EDI', '#Validation', '#EDIValidator', '#Validator']
  },
  {
    slug: 'edi-997-generator',
    name: 'EDI 997 & CONTRL Ack Generator',
    desc: 'Generate EDI 997 and EDIFACT CONTRL functional acknowledgments',
    tags: ['#EDI', '#X12', '#EDI997Generator', '#997', '#Generator']
  },
  {
    slug: 'json-to-edi',
    name: 'JSON to EDI Converter',
    desc: 'Transform JSON data into standard EDI-compliant transaction segments',
    tags: ['#EDI', '#JSON', '#JSONtoEDI', '#Converter']
  },
  {
    slug: 'edi-sample-generator',
    name: 'EDI Sample Generator',
    desc: 'Generate sample EDI data (850, 810, 856, ORDERS) for development and testing',
    tags: ['#EDI', '#Testing', '#EDISampleGenerator', '#Sample', '#Generator']
  },
  {
    slug: 'edi-delimiter-converter',
    name: 'EDI Delimiter Converter',
    desc: 'Convert EDI delimiters to match required transaction partner formats',
    tags: ['#EDI', '#X12', '#EDIDelimiterConverter', '#Delimiter', '#Converter']
  },

  // 2. Formatters
  {
    slug: 'formatters',
    name: 'Code & Data Formatters Suite',
    desc: 'Beautify, indent, and format JSON, SQL, HTML, CSS, XML, and YAML data',
    tags: ['#Formatters', '#CodeBeautifier', '#CleanCode', '#WebDev', '#DevTools']
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    desc: 'Format, validate, beautify, and indent JSON',
    tags: ['#JSON', '#WebDevelopment', '#JSONFormatter', '#Formatter']
  },
  {
    slug: 'json-minifier',
    name: 'JSON Minifier & Compressor',
    desc: 'Minify JSON by removing unnecessary whitespace to reduce payload size',
    tags: ['#JSON', '#APIs', '#JSONMinifierCompressor', '#Minifier', '#Compressor']
  },
  {
    slug: 'html-formatter',
    name: 'HTML Formatter',
    desc: 'Beautify and indent HTML markup for easier reading',
    tags: ['#HTML', '#WebDevelopment', '#HTMLFormatter', '#Formatter']
  },
  {
    slug: 'css-formatter',
    name: 'CSS Formatter',
    desc: 'Beautify or minify CSS code for cleaner stylesheets',
    tags: ['#CSS', '#Frontend', '#CSSFormatter', '#Formatter']
  },
  {
    slug: 'sql-formatter',
    name: 'SQL Formatter',
    desc: 'Format SQL queries with consistent indentation and readable keywords',
    tags: ['#SQL', '#Database', '#SQLFormatter', '#Formatter']
  },
  {
    slug: 'xml-formatter',
    name: 'XML Formatter',
    desc: 'Format, indent, and validate XML documents',
    tags: ['#XML', '#APIs', '#XMLFormatter', '#Formatter']
  },
  {
    slug: 'yaml-formatter',
    name: 'YAML Formatter',
    desc: 'Format, parse, and validate YAML configuration files',
    tags: ['#YAML', '#DevOps', '#YAMLFormatter', '#Formatter']
  },

  // 3. XML Suite
  {
    slug: 'xml-tools',
    name: 'XML, XSD, XSLT & XPath Suite',
    desc: 'Transform XML using XSLT, evaluate XPath expressions, validate schemas, and generate XSD structures',
    tags: ['#XML', '#XSLT', '#XPath', '#XSD', '#DataArchitecture']
  },
  {
    slug: 'xml-xslt-transform',
    name: 'XML XSLT 1.0/2.0 Transformer',
    desc: 'Transform XML documents into HTML, text, or XML using XSLT stylesheets in your browser',
    tags: ['#XML', '#XSLT', '#WebDevelopment', '#DataTransformation', '#Developer']
  },
  {
    slug: 'xml-xpath-evaluator',
    name: 'XML XPath Query Evaluator',
    desc: 'Evaluate and test XPath 1.0 and 2.0 expressions against XML documents with instant nodeset highlighting',
    tags: ['#XPath', '#XML', '#DataExtraction', '#Testing', '#APIs']
  },
  {
    slug: 'xml-xsd-validator',
    name: 'XML XSD Schema Validator',
    desc: 'Validate XML data against W3C XSD schemas with detailed error line and column diagnostics',
    tags: ['#XML', '#XSD', '#SchemaValidation', '#DataIntegrity', '#Developer']
  },
  {
    slug: 'xslt-transformer',
    name: 'XSLT Transformer & Tester',
    desc: 'Transform XML documents with XSLT stylesheets, test templates, parameters, and preview HTML/XML/Text client-side',
    tags: ['#XSLT', '#XML', '#Transform', '#DataIntegration', '#EDI']
  },
  {
    slug: 'xsd-validator',
    name: 'XSD & XML Schema Validator',
    desc: 'Validate XML structures against W3C XSD schema definitions, element constraints, and data types locally in browser',
    tags: ['#XML', '#XSD', '#SchemaValidator', '#W3C', '#DataIntegrity']
  },
  {
    slug: 'xml-xsd-generator',
    name: 'XML to XSD Schema Generator',
    desc: 'Automatically infer and generate W3C XSD schemas from sample XML data',
    tags: ['#XML', '#XSD', '#SchemaGenerator', '#Architecture', '#DevTools']
  },
  {
    slug: 'connection-string-parser',
    name: 'Database Connection String Builder',
    desc: 'Construct, format, and parse database connection URIs for PostgreSQL, MySQL, MongoDB Atlas, and Redis',
    tags: ['#Database', '#PostgreSQL', '#MySQL', '#MongoDB', '#Redis', '#DevOps']
  },

  // 4. Encoders & Cryptography
  {
    slug: 'encoders',
    name: 'Encoders, Decoders & Cryptography Suite',
    desc: 'Encode, decode, and hash data using Base64, URL, HTML, JWT, SHA, and HMAC algorithms',
    tags: ['#Cryptography', '#Base64', '#Hashing', '#Security', '#WebDev']
  },
  {
    slug: 'base64-encode-decode',
    name: 'Base64 Encoder & Decoder',
    desc: 'Encode and decode Base64 strings and files quickly in your browser',
    tags: ['#Base64', '#Encoding', '#Base64EncoderDecoder', '#Encoder', '#Decoder']
  },
  {
    slug: 'url-encode-decode',
    name: 'URL Encoder & Decoder',
    desc: 'Encode and decode URL parameters and query strings safely',
    tags: ['#URLs', '#WebDevelopment', '#URLEncoderDecoder', '#Encoder', '#Decoder']
  },
  {
    slug: 'html-entity-encoder',
    name: 'HTML Entity Encoder & Decoder',
    desc: 'Convert special characters to HTML entities and back',
    tags: ['#HTML', '#Frontend', '#HTMLEntityEncoderDecoder', '#Encoder', '#Decoder']
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    desc: 'Decode JSON Web Tokens without transmitting your secret keys',
    tags: ['#JWT', '#Authentication', '#JWTDecoder', '#Decoder']
  },
  {
    slug: 'hash-generator',
    name: 'Hash Generator (MD5, SHA-1, SHA-256)',
    desc: 'Generate secure cryptographic hashes for text and data',
    tags: ['#Security', '#Cryptography', '#HashGenerator', '#Generator']
  },
  {
    slug: 'hmac-generator',
    name: 'HMAC Generator & Authenticator',
    desc: 'Generate keyed-hash message authentication codes (HMAC) using SHA-256 and SHA-512',
    tags: ['#HMAC', '#Cryptography', '#HMACGenerator', '#Generator', '#Security']
  },
  {
    slug: 'crc32-checksum-generator',
    name: 'CRC32 Checksum Generator',
    desc: 'Compute 32-bit cyclic redundancy check (CRC32) checksums for text and data files',
    tags: ['#CRC32', '#Checksum', '#Integrity', '#Programming', '#DevTools']
  },
  {
    slug: 'jwt-inspector',
    name: 'JWT Inspector & Validator',
    desc: 'Inspect, decode, and validate JSON Web Token (JWT) headers, payloads, signatures, and expiration in browser memory',
    tags: ['#JWT', '#OAuth2', '#WebSecurity', '#Authentication', '#DevTools']
  },
  {
    slug: 'pkce-generator',
    name: 'OAuth 2.0 PKCE Generator',
    desc: 'Generate cryptographically secure OAuth 2.0 PKCE code verifiers and SHA-256 code challenges locally in browser',
    tags: ['#OAuth2', '#PKCE', '#Security', '#Auth', '#WebSecurity']
  },

  // 5. Validators
  {
    slug: 'validators',
    name: 'Syntax, Schema & Diff Validators Suite',
    desc: 'Validate JSON syntax, XSD schemas, regex patterns, text diffs, and structured documents',
    tags: ['#Validation', '#DataIntegrity', '#DiffChecker', '#Regex', '#CodeQuality']
  },
  {
    slug: 'openapi-validator',
    name: 'OpenAPI / Swagger Spec Viewer',
    desc: 'Validate, parse, and inspect structural syntax and endpoint paths for OpenAPI 3.0 and Swagger API specifications',
    tags: ['#OpenAPI', '#Swagger', '#API', '#RestAPI', '#APIDesign']
  },
  {
    slug: 'docker-k8s-validator',
    name: 'Docker & Kubernetes YAML Linter',
    desc: 'Lint, validate, and verify structural syntax for Docker Compose and Kubernetes YAML resource manifests',
    tags: ['#Docker', '#Kubernetes', '#K8s', '#DevOps', '#YAML', '#CloudNative']
  },
  {
    slug: 'json-validator',
    name: 'JSON Validator',
    desc: 'Validate JSON syntax with detailed error messages and line pointers',
    tags: ['#JSON', '#Debugging', '#JSONValidator', '#Validator']
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester & Debugger',
    desc: 'Test and debug regular expressions with live syntax highlighting and match groups',
    tags: ['#Regex', '#Programming', '#RegexTesterDebugger', '#Tester', '#Debugger']
  },
  {
    slug: 'diff-checker',
    name: 'Diff Checker',
    desc: 'Compare two text files or code snippets side by side with color-coded diffs',
    tags: ['#Diff', '#CodeReview', '#DiffChecker', '#Checker']
  },

  // 6. Converters
  {
    slug: 'converters',
    name: 'Data & File Format Converters Suite',
    desc: 'Convert between JSON, XML, CSV, YAML, Markdown, cURL commands, and images effortlessly',
    tags: ['#DataConversion', '#JSON', '#XML', '#CSV', '#YAML', '#Productivity']
  },
  {
    slug: 'json-to-xml',
    name: 'JSON to XML Converter',
    desc: 'Convert JSON structures to valid, formatted XML documents',
    tags: ['#JSON', '#XML', '#JSONtoXMLConverter', '#Converter']
  },
  {
    slug: 'xml-to-json',
    name: 'XML to JSON Converter',
    desc: 'Convert XML documents into readable JSON objects and arrays',
    tags: ['#XML', '#JSON', '#XMLtoJSONConverter', '#Converter']
  },
  {
    slug: 'json-to-csv',
    name: 'JSON to CSV Converter',
    desc: 'Export JSON data to CSV spreadsheets and tables',
    tags: ['#JSON', '#CSV', '#JSONtoCSVConverter', '#Converter']
  },
  {
    slug: 'csv-to-json',
    name: 'CSV to JSON Converter',
    desc: 'Convert CSV spreadsheets to structured JSON data',
    tags: ['#CSV', '#JSON', '#CSVtoJSONConverter', '#Converter']
  },
  {
    slug: 'yaml-to-json',
    name: 'YAML to JSON Converter',
    desc: 'Convert YAML configuration files to JSON format',
    tags: ['#YAML', '#JSON', '#YAMLtoJSONConverter', '#Converter']
  },
  {
    slug: 'json-to-yaml',
    name: 'JSON to YAML Converter',
    desc: 'Convert JSON data into clean, indented YAML syntax',
    tags: ['#JSON', '#YAML', '#JSONtoYAMLConverter', '#Converter']
  },
  {
    slug: 'markdown-to-html',
    name: 'Markdown to HTML Converter',
    desc: 'Convert Markdown content to clean, semantic HTML markup',
    tags: ['#Markdown', '#HTML', '#MarkdowntoHTMLConverter', '#Converter']
  },
  {
    slug: 'curl-to-code',
    name: 'cURL to Code Converter',
    desc: 'Convert cURL commands to JavaScript fetch, Python requests, PHP, and Go code',
    tags: ['#cURL', '#APIs', '#cURLtoCodeConverter', '#Converter']
  },
  {
    slug: 'image-resizer',
    name: 'Image Resizer & Optimizer',
    desc: 'Resize and optimize images directly in your browser without uploading files to a server',
    tags: ['#Images', '#Optimization', '#ImageResizerOptimizer', '#Resizer', '#Optimizer']
  },
  {
    slug: 'image-format-converter',
    name: 'Image Format Converter',
    desc: 'Convert images between PNG, JPEG, and WebP formats instantly with client-side privacy',
    tags: ['#Images', '#WebP', '#ImageFormatConverter', '#Format', '#Converter']
  },

  // Image Tools Suite
  {
    slug: 'image-tools',
    name: 'Image Processing & Optimization Tools Suite',
    desc: 'Merge, resize, compress, strip EXIF metadata, compare image diffs, and generate favicons 100% locally in your browser',
    tags: ['#ImageTools', '#Design', '#WebPerf', '#Privacy', '#HTML5Canvas', '#FrontEnd']
  },
  {
    slug: 'image-merger',
    name: 'Image Merger & Combiner',
    desc: 'Stitch two images side-by-side or stacked vertically with custom padding, gap spacing, and alignment',
    tags: ['#ImageMerger', '#ImageStitching', '#Design', '#GraphicDesign', '#Canvas']
  },
  {
    slug: 'image-exif-inspector',
    name: 'EXIF Metadata Inspector & Stripper',
    desc: 'Inspect camera metadata and GPS coordinates, then sanitize images by stripping all EXIF data client-side',
    tags: ['#EXIF', '#Privacy', '#CyberSecurity', '#Metadata', '#Photography']
  },
  {
    slug: 'image-diff-checker',
    name: 'Side-by-Side Image Comparator',
    desc: 'Compare two images with interactive curtain slider, pixel diff heatmap, and onion-skin blending',
    tags: ['#ImageDiff', '#VisualTesting', '#QA', '#UIUX', '#DesignReview']
  },
  {
    slug: 'image-resizer',
    name: 'Image Resizer & Compressor',
    desc: 'Resize, crop, and compress images with custom dimensions and quality settings directly in the browser',
    tags: ['#ImageResizer', '#ImageCompression', '#WebPerf', '#Optimization']
  },
  {
    slug: 'favicon-generator',
    name: 'Favicon Generator',
    desc: 'Generate crisp multi-resolution PNG and ICO web favicons (16x16, 32x32, 48x48, 180x180) from any image',
    tags: ['#Favicon', '#WebDesign', '#IconGenerator', '#WebDevelopment']
  },

  // 7. Calculators
  {
    slug: 'calculators',
    name: 'Financial & Math Calculators Suite',
    desc: 'Calculate loans, monthly EMIs, amortization schedules, SIP returns, percentages, and tips with multi-currency support',
    tags: ['#Finance', '#Calculators', '#LoanCalculator', '#EMI', '#Investing']
  },
  {
    slug: 'loan-calculator',
    name: 'Loan & EMI Calculator',
    desc: 'Calculate monthly loan EMI payments, total interest, and full amortization schedules in your preferred currency',
    tags: ['#Finance', '#Mortgage', '#LoanCalculator', '#EMI', '#Interest']
  },
  {
    slug: 'sip-calculator',
    name: 'SIP Calculator',
    desc: 'Calculate future wealth and expected returns for Systematic Investment Plans and mutual funds in any currency with interactive compounding graphs',
    tags: ['#Finance', '#Investing', '#SIPCalculator', '#MutualFunds', '#Wealth']
  },
  {
    slug: 'investment-calculator',
    name: 'Investment Calculator',
    desc: 'Calculate exponential investment growth, custom deposit frequencies, compound returns, and visual balance timelines',
    tags: ['#Finance', '#Investing', '#InvestmentCalculator', '#WealthBuilding', '#Calculators']
  },
  {
    slug: 'json-definition-generator',
    name: 'JSON Definition & Type Generator',
    desc: 'Convert any JSON structure into TypeScript types, JSON Schema, Python Pydantic, C# POCO, Java POJO, Go structs, and Rust Serde types',
    tags: ['#JSON', '#TypeScript', '#Python', '#Pydantic', '#SoftwareEngineering', '#CodeGeneration']
  },
  {
    slug: 'percentage-calculator',
    name: 'Percentage & Ratio Calculator',
    desc: 'Calculate percentage increases, discounts, fractional ratios, and differences instantly',
    tags: ['#Math', '#Percentages', '#Calculator', '#Discounts', '#Ratios']
  },
  {
    slug: 'financial-calculators',
    name: 'Financial & Retirement Calculators Suite',
    desc: 'Calculate retirement corpus, loan EMIs, SIP compounding, investments, and inflation-adjusted financial independence strategies',
    tags: ['#Finance', '#Retirement', '#FinancialPlanning', '#FIRE', '#WealthBuilding']
  },
  {
    slug: 'retirement-calculator',
    name: 'Retirement & Financial Planning Calculator',
    desc: 'Calculate your retirement corpus, projected vs required savings, inflation impact, and financial independence roadmap',
    tags: ['#RetirementCalculator', '#CorpusCalculator', '#FinancialIndependence', '#FIRE', '#PersonalFinance']
  },
  {
    slug: 'financial-planner',
    name: 'Retirement & Financial Planning Calculator',
    desc: 'Calculate your retirement corpus, projected vs required savings, inflation impact, and financial independence roadmap',
    tags: ['#FinancialPlanning', '#RetirementPlanning', '#CorpusCalculator', '#Wealth', '#Investing']
  },
  {
    slug: 'gratuity-calculator',
    name: 'Gratuity & Retirement Calculator',
    desc: 'Calculate statutory end-of-service gratuity and retirement severance benefits in multiple currencies',
    tags: ['#Retirement', '#HR', '#Gratuity', '#Benefits', '#Salary']
  },

  // 8. Utilities
  {
    slug: 'utilities',
    name: 'Developer Utilities & Generators Suite',
    desc: 'Generate UUIDs, QR codes, strong passwords, cron expressions, and inspect headers and screen dimensions',
    tags: ['#DevTools', '#Productivity', '#Generators', '#Utilities', '#WebDevelopment']
  },
  {
    slug: 'uuid-generator',
    name: 'UUID / GUID Generator',
    desc: 'Generate cryptographically random UUID v4 and unique identifiers',
    tags: ['#UUID', '#Development', '#UUIDGUIDGenerator', '#Generator']
  },
  {
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    desc: 'Generate customizable, high-resolution QR codes for links, text, and Wi-Fi networks',
    tags: ['#QRCode', '#Mobile', '#QRCodeGenerator', '#Generator']
  },
  {
    slug: 'password-generator',
    name: 'Strong Password Generator',
    desc: 'Generate secure, cryptographically random passwords with custom character rules',
    tags: ['#Security', '#Privacy', '#StrongPasswordGenerator', '#Generator']
  },
  {
    slug: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    desc: 'Generate custom placeholder text by paragraphs, sentences, or words',
    tags: ['#Design', '#Typography', '#LoremIpsumGenerator', '#Generator']
  },
  {
    slug: 'timestamp-converter',
    name: 'Unix Timestamp Converter',
    desc: 'Convert Unix epoch timestamps to human-readable dates across timezones',
    tags: ['#Time', '#Development', '#UnixTimestampConverter', '#Timestamp', '#Converter']
  },
  {
    slug: 'cron-expression-generator',
    name: 'Cron Expression Generator & Explainer',
    desc: 'Build and explain cron schedule expressions with human-readable descriptions',
    tags: ['#Cron', '#DevOps', '#CronExpressionGeneratorExplainer', '#Generator', '#Explainer']
  },
  {
    slug: 'slug-generator',
    name: 'URL Slug Generator',
    desc: 'Convert titles and phrases into clean, SEO-friendly URL slugs',
    tags: ['#SEO', '#URLs', '#URLSlugGenerator', '#Slug', '#Generator']
  },
  {
    slug: 'markdown-preview',
    name: 'Markdown Live Editor & Preview',
    desc: 'Write Markdown with real-time preview, word counts, and HTML export',
    tags: ['#Markdown', '#Documentation', '#Editor', '#Blogging', '#Writing']
  },
  {
    slug: 'markdown',
    name: 'Markdown Live Editor & Preview',
    desc: 'Write Markdown with real-time preview, word counts, and HTML export',
    tags: ['#Markdown', '#Documentation', '#Editor', '#Blogging', '#Writing']
  },
  {
    slug: 'what-is-my-screen-resolution',
    name: 'Screen Resolution & Viewport Checker',
    desc: 'Inspect screen resolution, DPR, color depth, and responsive CSS viewport dimensions',
    tags: ['#ResponsiveDesign', '#ScreenResolution', '#CSS', '#Frontend', '#WebDesign']
  },
  {
    slug: 'what-is-my-user-agent',
    name: 'User Agent Inspector',
    desc: 'Inspect browser user agent strings, engine versions, and operating system details',
    tags: ['#UserAgent', '#Browsers', '#DevTools', '#Debugging', '#WebDev']
  },
  {
    slug: 'http-status-codes',
    name: 'HTTP Status Code Reference',
    desc: 'Quick reference guide for standard HTTP status codes and response headers',
    tags: ['#HTTP', '#APIs', '#HTTPStatusCodeReference', '#Status', '#Reference']
  },

  // 9. Text Tools
  {
    slug: 'text-tools',
    name: 'Text Processing & Analysis Suite',
    desc: 'Count words, characters, remove duplicates, trim whitespace, and sort text in your browser',
    tags: ['#TextTools', '#Copywriting', '#DataCleaning', '#Editing', '#Productivity']
  },
  {
    slug: 'text-case-converter',
    name: 'Text Case Converter',
    desc: 'Convert text to UPPERCASE, lowercase, camelCase, kebab-case, and snake_case',
    tags: ['#TextTools', '#Formatting', '#TextCaseConverter', '#Case', '#Converter']
  },
  {
    slug: 'word-counter',
    name: 'Word Counter & Statistics',
    desc: 'Count words, characters, sentences, reading time, and speaking time in real time',
    tags: ['#Writing', '#Productivity', '#WordCounterStatistics', '#Word', '#Counter', '#Statistics']
  },
  {
    slug: 'character-counter',
    name: 'Character Counter',
    desc: 'Count characters with or without spaces, bytes, and words in real time',
    tags: ['#TextTools', '#SocialMedia', '#CharacterCounter', '#Character', '#Counter']
  },
  {
    slug: 'line-counter',
    name: 'Line Counter',
    desc: 'Count total lines, non-empty lines, and blank rows in code or text documents',
    tags: ['#TextTools', '#Programming', '#LineCounter', '#Line', '#Counter']
  },
  {
    slug: 'sentence-counter',
    name: 'Sentence Counter',
    desc: 'Count sentences and calculate readability statistics in text documents',
    tags: ['#TextTools', '#Writing', '#SentenceCounter', '#Sentence', '#Counter']
  },
  {
    slug: 'remove-duplicate-lines',
    name: 'Remove Duplicate Lines',
    desc: 'Instantly remove duplicate lines from lists, text logs, and files',
    tags: ['#TextTools', '#DataCleaning', '#RemoveDuplicateLines', '#Remove', '#Duplicate', '#Lines']
  },
  {
    slug: 'remove-empty-lines',
    name: 'Remove Empty Lines',
    desc: 'Remove blank and empty lines from text or code snippets',
    tags: ['#TextTools', '#Programming', '#RemoveEmptyLines', '#Remove', '#Empty', '#Lines']
  },
  {
    slug: 'remove-extra-spaces',
    name: 'Remove Extra Spaces',
    desc: 'Clean unnecessary whitespace and multiple consecutive spaces from text',
    tags: ['#TextTools', '#DataCleaning', '#RemoveExtraSpaces', '#Remove', '#Extra', '#Spaces']
  },
  {
    slug: 'sort-lines-alphabetically',
    name: 'Sort Lines Alphabetically',
    desc: 'Sort lines of text alphabetically (A-Z or Z-A) for cleaner data and lists',
    tags: ['#TextTools', '#DataCleaning', '#SortLinesAlphabetically', '#Sort', '#Lines', '#Alphabetically']
  },
  {
    slug: 'reverse-line-order',
    name: 'Reverse Line Order',
    desc: 'Reverse the order of lines in text, logs, or lists',
    tags: ['#TextTools', '#Programming', '#ReverseLineOrder', '#Reverse', '#Line', '#Order']
  }
];

// Dynamically integrate any additional URLs from sitemapUrls.json that might not be in toolsData
const existingSlugs = new Set(toolsData.map((t) => t.slug));

if (Array.isArray(sitemapUrls)) {
  for (const item of sitemapUrls) {
    const slug = (item.path || '').replace(/^\/+|\/+$/g, '');
    if (!slug || slug === 'privacy' || slug === 'terms' || slug === 'contact') continue;
    if (!existingSlugs.has(slug)) {
      existingSlugs.add(slug);
      const meta = metadata[slug] || {};
      const cat = item.category || meta.category || 'utilities';
      const name = item.name || meta.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const desc = meta.description || `Fast, browser-based online developer utility for ${name}`;
      
      const tag = '#' + name.replace(/[^a-zA-Z0-9]/g, '');
      const catTag = '#' + cat.charAt(0).toUpperCase() + cat.slice(1);
      
      toolsData.push({
        slug,
        name,
        desc,
        tags: [tag, catTag, '#Developer', '#DevTools']
      });
    }
  }
}

function escapeCsvField(val) {
  if (typeof val !== 'string') val = String(val);
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

const headers = [
  'No.',
  'Tool',
  'Exact Sitemap URL',
  'LinkedIn Post',
  'X.com Post',
  'X Character Count',
  'Mandatory + Relevant Hashtags',
  'Image Text',
  'Image Generation Prompt'
];

const rows = [headers.join(',')];

toolsData.forEach((tool, idx) => {
  const no = idx + 1;
  const name = tool.name;
  const url = `https://www.codepackr.com/${tool.slug}`;
  const action = tool.desc;

  // Mandatory base tags
  const mandatoryTags = ['#Codepackr', '#Developer', '#DevTools'];
  // Combine unique tags
  const allTags = Array.from(new Set([...mandatoryTags, ...(tool.tags || [])]));
  const tagString = allTags.join(' ');

  // LinkedIn Post
  const linkedInPost = `${name}: one less developer task to handle manually.\n\n${action}. Codepackr gives you a simple browser-based way to get the job done quickly, without adding another tool to your local setup.\n\nTry it here: ${url}\n\n${tagString}`;

  // X.com Post
  const xPost = `${name}: ${action}. Try it free: ${url} ${tagString}`;
  const xCount = xPost.length;

  // Image Text
  const imageText = `CODEPACKR.COM\n${name}\n${action}\nFREE TOOL\nRuns in your browser`;

  // Image Prompt
  const imagePrompt = `Create a square 1:1 social-media promotional graphic for Codepackr.com featuring ${name}. Use the attached Codepackr reference images only as branding inspiration, not as a copy. Dark modern developer-tool aesthetic, deep navy/black background, orange/yellow Codepackr accent, white clean typography, subtle visual elements related to ${name}, strong mobile readability, generous spacing, professional SaaS/developer-tool style. Include exactly these main text elements: CODEPACKR.COM, ${name}, ${action}, FREE TOOL, Runs in your browser. Do not add hashtags, long paragraphs, fake statistics, fake UI, or unsupported claims. No spelling errors.`;

  const row = [
    no,
    escapeCsvField(name),
    escapeCsvField(url),
    escapeCsvField(linkedInPost),
    escapeCsvField(xPost),
    xCount,
    escapeCsvField(tagString),
    escapeCsvField(imageText),
    escapeCsvField(imagePrompt)
  ];

  rows.push(row.join(','));
});

const csvContent = rows.join('\n');

// Write to public/codepackr_social_media_promotions.csv
fs.writeFileSync('public/codepackr_social_media_promotions.csv', csvContent, 'utf8');

// Write to root
fs.writeFileSync('codepackr_social_media_promotions.csv', csvContent, 'utf8');

// Write to dist/ if it exists
if (fs.existsSync('dist')) {
  fs.writeFileSync('dist/codepackr_social_media_promotions.csv', csvContent, 'utf8');
}

console.log(`\n======================================================`);
console.log(` Codepackr Social Media Promotions Generator`);
console.log(`======================================================`);
console.log(`[✓] Successfully generated ${toolsData.length} promotional entries.`);
console.log(`[✓] Updated: public/codepackr_social_media_promotions.csv`);
console.log(`[✓] Updated: codepackr_social_media_promotions.csv`);
if (fs.existsSync('dist')) {
  console.log(`[✓] Updated: dist/codepackr_social_media_promotions.csv`);
}
console.log(`======================================================\n`);
