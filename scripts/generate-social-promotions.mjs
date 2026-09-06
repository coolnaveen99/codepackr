import fs from 'node:fs';
import path from 'node:path';

// Load tool metadata
const metadata = JSON.parse(fs.readFileSync('src/data/toolMetadata.json', 'utf8'));

// Curated live tools list with specific action descriptions and hashtags
const toolsData = [
  {
    slug: 'edi-tools',
    name: 'EDI Tools Suite',
    desc: 'Format, validate, convert, and inspect ANSI X12 and EDIFACT EDI documents',
    tags: ['#EDI', '#B2B', '#SupplyChain', '#EDITools', '#Enterprise']
  },
  {
    slug: 'edi-formatter',
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
  {
    slug: 'as2-tools',
    name: 'AS2 Message Suite & MDN Generator',
    desc: 'Encode, decode, parse MIME headers, calculate MICs, and generate AS2 MDN receipts',
    tags: ['#AS2', '#EDI', '#CyberSecurity', '#MDN', '#B2BIntegration']
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
  {
    slug: 'js-minifier',
    name: 'JavaScript Minifier',
    desc: 'Minify JavaScript code to reduce unnecessary whitespace and bundle size',
    tags: ['#JavaScript', '#WebDevelopment', '#JavaScriptMinifier', '#Minifier']
  },
  {
    slug: 'base64',
    name: 'Base64 Encoder & Decoder',
    desc: 'Encode text to Base64 or decode Base64 strings back to text',
    tags: ['#Base64', '#Programming', '#Base64EncoderDecoder', '#Encoder', '#Decoder']
  },
  {
    slug: 'url-encode',
    name: 'URL Encoder & Decoder',
    desc: 'Encode or decode URL query strings and path segments',
    tags: ['#URL', '#WebDevelopment', '#URLEncoderDecoder', '#Encoder', '#Decoder']
  },
  {
    slug: 'html-entity',
    name: 'HTML Entity Encoder & Decoder',
    desc: 'Encode or decode special characters as HTML entities',
    tags: ['#HTML', '#WebDevelopment', '#HTMLEntityEncoderDecoder', '#Entity', '#Encoder', '#Decoder']
  },
  {
    slug: 'hash-generator',
    name: 'Hash Generator',
    desc: 'Generate hashes including MD5 and SHA family algorithms',
    tags: ['#Hashing', '#CyberSecurity', '#HashGenerator', '#Hash', '#Generator']
  },
  {
    slug: 'crc32-checksum-generator',
    name: 'CRC32 Checksum Generator',
    desc: 'Generate CRC32 checksums for data integrity checks',
    tags: ['#CRC32', '#Checksum', '#CRC32ChecksumGenerator', '#Generator']
  },
  {
    slug: 'hmac-generator',
    name: 'HMAC Generator & Authenticator',
    desc: 'Generate and verify HMAC values for message authentication',
    tags: ['#HMAC', '#Security', '#HMACGeneratorAuthenticator', '#Generator', '#Authenticator']
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    desc: 'Decode JWT tokens to inspect their header and payload',
    tags: ['#JWT', '#APIs', '#JWTDecoder', '#Decoder']
  },
  {
    slug: 'jwt-encoder',
    name: 'JWT Encoder',
    desc: 'Create JWT tokens from the required token components',
    tags: ['#JWT', '#Authentication', '#JWTEncoder', '#Encoder']
  },
  {
    slug: 'base64-image',
    name: 'Base64 Image Converter',
    desc: 'Convert images to Base64 data and work with Base64 image content',
    tags: ['#Base64', '#WebDevelopment', '#Base64ImageConverter', '#Image', '#Converter']
  },
  {
    slug: 'calculator',
    name: 'Scientific Calculator',
    desc: 'Perform scientific calculations directly in your browser',
    tags: ['#Calculator', '#Productivity', '#ScientificCalculator', '#Scientific']
  },
  {
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    desc: 'Quickly calculate percentages and percentage changes',
    tags: ['#Calculator', '#Productivity', '#PercentageCalculator', '#Percentage']
  },
  {
    slug: 'tip-calculator',
    name: 'Tip Calculator',
    desc: 'Calculate tips and split the bill quickly',
    tags: ['#Calculator', '#Productivity', '#TipCalculator', '#Tip']
  },
  {
    slug: 'sip-calculator',
    name: 'SIP Investment Calculator',
    desc: 'Estimate SIP investment outcomes using your inputs',
    tags: ['#SIP', '#Investing', '#SIPInvestmentCalculator', '#Investment', '#Calculator']
  },
  {
    slug: 'loan-calculator',
    name: 'Loan & EMI Calculator',
    desc: 'Calculate loan EMI and repayment figures from your inputs',
    tags: ['#LoanCalculator', '#Finance', '#LoanEMICalculator', '#Loan', '#EMI', '#Calculator']
  },
  {
    slug: 'diff-checker',
    name: 'Diff Checker',
    desc: 'Compare two blocks of text or code and highlight differences',
    tags: ['#Diff', '#DeveloperTools', '#DiffChecker', '#Checker']
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    desc: 'Test and debug regular expressions with interactive matches',
    tags: ['#Regex', '#Programming', '#RegexTester', '#Tester']
  },
  {
    slug: 'json-validator',
    name: 'JSON Validator',
    desc: 'Validate JSON syntax and identify errors in your JSON',
    tags: ['#JSON', '#APIs', '#JSONValidator', '#Validator']
  },
  {
    slug: 'json-path-tester',
    name: 'JSONPath Tester',
    desc: 'Evaluate JSONPath queries against JSON structures',
    tags: ['#JSONPath', '#JSON', '#JSONPathTester', '#Tester']
  },
  {
    slug: 'xsd-validator',
    name: 'XSD & XML Schema Validator',
    desc: 'Validate XML structures against XSD schema definitions',
    tags: ['#XSD', '#XML', '#XSDXMLSchemaValidator', '#Schema', '#Validator']
  },
  {
    slug: 'csv-viewer',
    name: 'CSV Viewer',
    desc: 'View CSV data as an interactive, sortable, searchable table',
    tags: ['#CSV', '#Data', '#CSVViewer', '#Viewer']
  },
  {
    slug: 'json-structural-diff',
    name: 'Structural JSON Diff',
    desc: 'Compare JSON objects key-by-key for added, removed, and changed nodes',
    tags: ['#JSON', '#Diff', '#StructuralJSONDiff', '#Structural']
  },
  {
    slug: 'dotenv-formatter',
    name: 'dotenv Formatter & Validator',
    desc: 'Format, sort, and validate .env environment-variable files',
    tags: ['#Dotenv', '#DevOps', '#dotenvFormatterValidator', '#Formatter', '#Validator']
  },
  {
    slug: 'json-xml-converter',
    name: 'JSON to XML / XML to JSON',
    desc: 'Convert data between JSON objects and XML markup',
    tags: ['#JSON', '#XML', '#JSONXML', '#XMLJSON']
  },
  {
    slug: 'json-csv-converter',
    name: 'JSON to CSV / CSV to JSON',
    desc: 'Convert JSON arrays to CSV and CSV rows to JSON objects',
    tags: ['#JSON', '#CSV', '#JSONCSV', '#CSVJSON']
  },
  {
    slug: 'csv-xml-converter',
    name: 'CSV to XML Converter',
    desc: 'Convert CSV data into XML and work between tabular and markup formats',
    tags: ['#CSV', '#XML', '#CSVXMLConverter', '#Converter']
  },
  {
    slug: 'case-converter',
    name: 'Case Converter',
    desc: 'Convert text between common letter-case formats',
    tags: ['#TextTools', '#Productivity', '#CaseConverter', '#Case', '#Converter']
  },
  {
    slug: 'yaml-json-converter',
    name: 'YAML to JSON Converter',
    desc: 'Convert YAML data to JSON for easier interoperability',
    tags: ['#YAML', '#JSON', '#YAMLJSONConverter', '#Converter']
  },
  {
    slug: 'number-base-converter',
    name: 'Number Base Converter',
    desc: 'Convert numbers between common bases such as binary, decimal, and hexadecimal',
    tags: ['#Programming', '#ComputerScience', '#NumberBaseConverter', '#Number', '#Base', '#Converter']
  },
  {
    slug: 'markdown-html-converter',
    name: 'Markdown to HTML / HTML to Markdown',
    desc: 'Convert content between Markdown and HTML',
    tags: ['#Markdown', '#HTML', '#MarkdownHTML', '#HTMLMarkdown']
  },
  {
    slug: 'html-markdown-converter',
    name: 'HTML to Markdown Converter',
    desc: 'Convert HTML markup into Markdown',
    tags: ['#HTML', '#Markdown', '#HTMLMarkdownConverter', '#Converter']
  },
  {
    slug: 'curl-code-converter',
    name: 'cURL to Code Converter',
    desc: 'Turn cURL requests into code you can use in development',
    tags: ['#cURL', '#APIs', '#cURLCodeConverter', '#Code', '#Converter']
  },
  {
    slug: 'image-resizer',
    name: 'Image Resizer & Compressor',
    desc: 'Resize and compress images for easier web use',
    tags: ['#Images', '#WebDevelopment', '#ImageResizerCompressor', '#Image', '#Resizer', '#Compressor']
  },
  {
    slug: 'favicon-generator',
    name: 'Favicon Generator',
    desc: 'Create favicon assets for websites',
    tags: ['#Favicon', '#WebDevelopment', '#FaviconGenerator', '#Generator']
  },
  {
    slug: 'xslt-transformer',
    name: 'XSLT Transformer',
    desc: 'Transform XML documents using XSLT stylesheets',
    tags: ['#XSLT', '#XML', '#XSLTTransformer', '#Transformer']
  },
  {
    slug: 'xml-to-xsd',
    name: 'XML to XSD',
    desc: 'Generate or derive XSD schema structures from XML',
    tags: ['#XML', '#XSD', '#XMLXSD']
  },
  {
    slug: 'xsd-to-xml',
    name: 'XSD to XML',
    desc: 'Generate XML examples from XSD schema definitions',
    tags: ['#XSD', '#XML', '#XSDXML']
  },
  {
    slug: 'xpath-evaluator',
    name: 'XPath Evaluator',
    desc: 'Evaluate XPath expressions against XML documents',
    tags: ['#XPath', '#XML', '#XPathEvaluator', '#Evaluator']
  },
  {
    slug: 'xml-escape-tool',
    name: 'XML Escape Tool',
    desc: 'Escape or unescape XML special characters',
    tags: ['#XML', '#WebDevelopment', '#XMLEscapeTool', '#Escape', '#Tool']
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    desc: 'Generate UUID values for development and testing',
    tags: ['#UUID', '#Programming', '#UUIDGenerator', '#Generator']
  },
  {
    slug: 'qr-generator',
    name: 'QR Code Generator',
    desc: 'Generate QR codes from text or data',
    tags: ['#QRCode', '#WebTools', '#QRCodeGenerator', '#QR', '#Code', '#Generator']
  },
  {
    slug: 'password-generator',
    name: 'Password Generator',
    desc: 'Generate random passwords for development and security use cases',
    tags: ['#PasswordSecurity', '#CyberSecurity', '#PasswordGenerator', '#Password', '#Generator']
  },
  {
    slug: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    desc: 'Generate placeholder text for designs and development',
    tags: ['#LoremIpsum', '#WebDesign', '#LoremIpsumGenerator', '#Lorem', '#Ipsum', '#Generator']
  },
  {
    slug: 'markdown-preview',
    name: 'Markdown Editor & Live Preview',
    desc: 'Write and preview Markdown content with live HTML rendering',
    tags: ['#Markdown', '#Documentation', '#MarkdownEditor', '#MarkdownPreview', '#Editor']
  },
  {
    slug: 'color-converter',
    name: 'Color Converter',
    desc: 'Convert colors between common color formats (HEX, RGB, HSL, CMYK)',
    tags: ['#CSS', '#WebDesign', '#ColorConverter', '#Color', '#Converter']
  },
  {
    slug: 'timestamp',
    name: 'Timestamp Converter',
    desc: 'Work with timestamps and convert time values for development tasks',
    tags: ['#Timestamp', '#Programming', '#TimestampConverter', '#Converter']
  },
  {
    slug: 'cron-expression',
    name: 'Cron Expression Tool',
    desc: 'Work with cron expressions and preview schedules for recurring jobs',
    tags: ['#Cron', '#DevOps', '#CronExpressionTool', '#Expression', '#Tool']
  },
  {
    slug: 'slugify',
    name: 'Slugify',
    desc: 'Convert text into clean, URL-friendly slugs',
    tags: ['#SEO', '#WebDevelopment', '#Slugify']
  },
  {
    slug: 'http-status-codes',
    name: 'HTTP Status Codes',
    desc: 'Look up HTTP status codes and understand common response meanings',
    tags: ['#HTTP', '#APIs', '#HTTPStatusCodes', '#Status', '#Codes']
  },
  {
    slug: 'mock-json-generator',
    name: 'Mock JSON Generator',
    desc: 'Generate realistic mock JSON records for development and testing',
    tags: ['#JSON', '#Testing', '#MockJSONGenerator', '#Mock', '#Generator']
  },
  {
    slug: 'text-tools',
    name: 'Text Tools',
    desc: 'Work with text using a comprehensive collection of practical text utilities',
    tags: ['#TextTools', '#Productivity', '#Text', '#Tools']
  },
  {
    slug: 'word-counter',
    name: 'Word Counter',
    desc: 'Count words and reading time in text quickly',
    tags: ['#WritingTools', '#Productivity', '#WordCounter', '#Word', '#Counter']
  },
  {
    slug: 'character-counter',
    name: 'Character Counter',
    desc: 'Count characters and bytes in text with a simple browser tool',
    tags: ['#TextTools', '#Productivity', '#CharacterCounter', '#Character', '#Counter']
  },
  {
    slug: 'line-counter',
    name: 'Line Counter',
    desc: 'Count lines and code metrics in text or source code quickly',
    tags: ['#TextTools', '#Programming', '#LineCounter', '#Line', '#Counter']
  },
  {
    slug: 'sentence-counter',
    name: 'Sentence Counter',
    desc: 'Count sentences and assess readability in a block of text',
    tags: ['#TextTools', '#Writing', '#SentenceCounter', '#Sentence', '#Counter']
  },
  {
    slug: 'remove-duplicate-lines',
    name: 'Remove Duplicate Lines',
    desc: 'Remove duplicate lines from text and lists quickly',
    tags: ['#TextTools', '#DataCleaning', '#RemoveDuplicateLines', '#Remove', '#Duplicate', '#Lines']
  },
  {
    slug: 'remove-empty-lines',
    name: 'Remove Empty Lines',
    desc: 'Remove blank and empty lines from text or code',
    tags: ['#TextTools', '#Programming', '#RemoveEmptyLines', '#Remove', '#Empty', '#Lines']
  },
  {
    slug: 'remove-extra-spaces',
    name: 'Remove Extra Spaces',
    desc: 'Clean unnecessary whitespace and spaces from text',
    tags: ['#TextTools', '#DataCleaning', '#RemoveExtraSpaces', '#Remove', '#Extra', '#Spaces']
  },
  {
    slug: 'sort-lines-alphabetically',
    name: 'Sort Lines Alphabetically',
    desc: 'Sort lines of text alphabetically for cleaner data and lists',
    tags: ['#TextTools', '#DataCleaning', '#SortLinesAlphabetically', '#Sort', '#Lines', '#Alphabetically']
  },
  {
    slug: 'reverse-line-order',
    name: 'Reverse Line Order',
    desc: 'Reverse the order of lines in text or lists',
    tags: ['#TextTools', '#Programming', '#ReverseLineOrder', '#Reverse', '#Line', '#Order']
  }
];

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
  const allTags = Array.from(new Set([...mandatoryTags, ...tool.tags]));
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
fs.writeFileSync('codepackr_social_media_promotions.csv', csvContent, 'utf8');
fs.writeFileSync('public/codepackr_social_media_promotions.csv', csvContent, 'utf8');
console.log(`Generated ${toolsData.length} entries in codepackr_social_media_promotions.csv`);
