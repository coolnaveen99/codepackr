# 📚 CodePackr Tool Documentation

Plain-English documentation and step-by-step tutorials for every tool on CodePackr. Each tool has its own page with: what it is, who it's for, a worked example, common mistakes, and FAQs — written for people who are **not** already EDI/XML/dev-tool experts.

**New to a specialized topic? Start with these primers first:**
- 📦 [EDI Basics](edi/00-edi-basics.md) — what EDI, X12, EDIFACT, segments, and envelopes actually are.
- 📐 [XML/XSD Basics](xml/00-xml-basics.md) — what XML, XSD, XPath, and XSLT actually are.
- 📖 [Glossary](GLOSSARY.md) — quick definitions of every term used across these docs.

Building or updating a tool? See [`_TEMPLATE.md`](_TEMPLATE.md) for the doc format, and [`.github/skills/update-tool-docs.md`](../../.github/skills/update-tool-docs.md) for how an AI coding agent should keep these pages in sync automatically.

---

## Table of contents

- [🧹 Formatters](#formatters) (8 tools)
- [🔐 Encoders](#encoders) (8 tools)
- [✅ Validators](#validators) (9 tools)
- [🔁 Converters](#converters) (10 tools)
- [🖼️ Image Tools](#image) (7 tools)
- [📦 EDI Integration Hub](#edi) (17 tools)
- [📐 XML & XSD Tools](#xml) (6 tools)
- [🧰 Utilities](#utilities) (11 tools)
- [✍️ Text Tools](#text) (1 tools)

---

## formatters

### 🧹 Formatters

*Think of a Formatter like an iron for a wrinkled shirt. The words on the shirt (your code or data) don't change — it just gets pressed into neat, readable lines so a human (or another program) can read it comfortably.*

| Tool | Description |
|------|-------------|
| [JSON Formatter](formatters/json-formatter.md) | Format, validate, beautify, and minify JSON data with customizable indentations. |
| [HTML Formatter](formatters/html-formatter.md) | Beautify and indent HTML markup for improved readability. |
| [CSS Formatter](formatters/css-formatter.md) | Beautify or minify cascading style sheets (CSS) code. |
| [SQL Formatter](formatters/sql-formatter.md) | Format SQL queries with standard indentation and uppercase keywords. |
| [XML Formatter](formatters/xml-formatter.md) | Format, indent, and validate XML documents. |
| [YAML Formatter](formatters/yaml-formatter.md) | Format, parse, and validate YAML configurations. |
| [JavaScript Minifier](formatters/js-minifier.md) | Compress and minify JavaScript code to reduce bundle size. |
| [Database Connection String Builder](formatters/connection-string-parser.md) | Construct, format, and parse database connection URIs for PostgreSQL, MySQL, MongoDB Atlas, and Redis. |

## encoders

### 🔐 Encoders

*Think of an Encoder like a translator that turns your message into a different alphabet so it can travel safely (Base64, URL-encoding) or be checked for authenticity (hashes, JWTs). It's not about hiding a secret from a determined reader — it's about making data safe to move through systems that don't understand every character, or proving a piece of data hasn't been tampered with.*

| Tool | Description |
|------|-------------|
| [Base64 Encoder & Decoder](encoders/base64.md) | Encode plain text to Base64 or decode Base64 strings back to text. |
| [URL Encoder & Decoder](encoders/url-encode.md) | Percent-encode or decode URL query strings and path segments. |
| [HTML Entity Encoder & Decoder](encoders/html-entity.md) | Escape or unescape special characters into HTML entities (&amp;, &lt;, &gt;). |
| [Hash Generator](encoders/hash-generator.md) | Compute SHA-1, SHA-256, SHA-384, SHA-512, and MD5 cryptographic hashes. |
| [JWT Decoder](encoders/jwt-decoder.md) | Decode and inspect JSON Web Token header, payload, expiry, and claims. |
| [JWT Encoder](encoders/jwt-encoder.md) | Create and sign HS256 JSON Web Tokens with custom payload and secret key. |
| [JWT Inspector & Validator](encoders/jwt-inspector.md) | Inspect, decode, and validate JSON Web Tokens (JWT) headers, payloads, signatures, and expiration status. |
| [OAuth 2.0 PKCE Generator](encoders/pkce-generator.md) | Generate high-entropy cryptographically secure OAuth 2.0 PKCE code verifiers and SHA-256 code challenges. |

## validators

### ✅ Validators

*Think of a Validator like a proofreader or a spell-checker, but for structured data instead of prose. It doesn't rewrite your document — it points at exactly which line broke the rules, so you can fix it before it breaks something downstream (a deployment, an API call, a contract).*

| Tool | Description |
|------|-------------|
| [Diff Checker](validators/diff-checker.md) | Compare two blocks of text or code side-by-side with line difference highlights. |
| [OpenAPI / Swagger Spec Viewer](validators/openapi-validator.md) | Validate, parse, and inspect structural syntax and endpoint paths for OpenAPI 3.0 and Swagger API specifications. |
| [Docker & Kubernetes YAML Linter](validators/docker-k8s-validator.md) | Lint, validate, and verify structural syntax for Docker Compose and Kubernetes YAML resource manifests. |
| [Regex Tester](validators/regex-tester.md) | Test and debug regular expressions with interactive match grouping and flags. |
| [JSON Validator](validators/json-validator.md) | Strictly validate JSON syntax and pinpoint exact error line and column. |
| [JSONPath Tester](validators/json-path-tester.md) | Evaluate JSONPath queries ($..key, store.book[*]) against JSON structures. |
| [CSV Viewer](validators/csv-viewer.md) | Parse CSV content into an interactive, sortable, and searchable table. |
| [Structural JSON Diff](validators/json-structural-diff.md) | Compare two JSON objects key-by-key to detect added, removed, and changed nodes. |
| [dotenv Formatter & Validator](validators/dotenv-formatter.md) | Format, sort, and validate environment variable (.env) files. |

## converters

### 🔁 Converters

*Think of a Converter like a universal travel power adapter. Your data (the appliance) doesn't change what it does — it just gets a different "plug shape" so it fits into a system that expects a different format.*

| Tool | Description |
|------|-------------|
| [JSON to XML / XML to JSON](converters/json-xml-converter.md) | Convert data bi-directionally between JSON objects and XML markup. |
| [JSON to CSV / CSV to JSON](converters/json-csv-converter.md) | Convert JSON arrays to tabular CSV or transform CSV rows into JSON objects. |
| [Case Converter](converters/case-converter.md) | Convert identifiers between camelCase, snake_case, kebab-case, PascalCase, and more. |
| [YAML to JSON Converter](converters/yaml-json-converter.md) | Convert back and forth between YAML syntax and formatted JSON. |
| [Number Base Converter](converters/number-base-converter.md) | Convert values simultaneously between Binary, Octal, Decimal, and Hexadecimal. |
| [Markdown to HTML / HTML to Markdown](converters/markdown-html-converter.md) | Convert Markdown into HTML markup or extract Markdown from HTML tags. |
| [cURL to Code Converter](converters/curl-code-converter.md) | Convert cURL command strings to JavaScript Fetch, Axios, Node.js, and Python requests. |
| [CSV to XML Converter](converters/csv-xml-converter.md) | Transform tabular CSV spreadsheets into structured XML records. |
| [HTML to Markdown Converter](converters/html-markdown-converter.md) | Convert HTML markup back into clean, readable Markdown syntax. |
| [JSON Definition Generator](converters/json-definition-generator.md) | Generate TypeScript interfaces, JSON Schema, Python Pydantic, C# POCO, Java POJO, Go, Rust, and SQL definitions from raw JSON. |

## image

### 🖼️ Image Tools

*Think of these like a private, in-browser photo-editing desk: resize, compress, compare, or strip hidden information from a picture — without ever uploading that picture to a stranger's server.*

| Tool | Description |
|------|-------------|
| [Image Resizer & Target Size Compressor](image/image-target-compressor.md) | Resize images to exact dimensions in pixels (px), centimeters (cm), millimeters (mm), or inches with DPI control and compress to a maximum target file size (KB/MB). |
| [Image Resizer & Compressor](image/image-resizer.md) | Resize, compress, and re-encode PNG, JPEG, and WebP images locally. |
| [Image Merger & Combiner](image/image-merger.md) | Combine two images side-by-side or top-to-bottom with custom spacing, padding, and background colors. |
| [EXIF Metadata Inspector & Stripper](image/image-exif-inspector.md) | Inspect image properties and strip EXIF metadata for complete online privacy. |
| [Side-by-Side Image Comparator](image/image-diff-checker.md) | Compare two images side-by-side or via diff overlay to detect visual discrepancies. |
| [Favicon Generator](image/favicon-generator.md) | Generate standard favicon sizes (16x16, 32x32, 48x48, 180x180) from an image. |
| [Base64 Image Converter](image/base64-image.md) | Convert images to base64 Data URLs or preview images from base64 strings. |

## edi

### 📦 EDI Integration Hub

*EDI (Electronic Data Interchange) is how big companies send each other business documents — purchase orders, invoices, shipping notices — as strict, computer-readable text files instead of PDFs or emails. Think of these tools as a translator's desk sitting between two companies' computer systems: one side speaks the ultra-compact "EDI" dialect, the other side speaks everyday formats like JSON or CSV, and these tools convert, check, and clean up messages moving in both directions.*

👉 **Start with the [EDI Basics primer](edi/00-edi-basics.md) first if you're new to EDI.**

| Tool | Description |
|------|-------------|
| [EDI to CSV & CSV to EDI Converter](edi/edi-csv-converter.md) | Convert ANSI X12 and EDIFACT messages into flattened CSV or Excel spreadsheets, or generate compliant EDI 850/810 documents directly from spreadsheet tables. |
| [EDI HIPAA De-Identifier & PHI Sanitizer](edi/edi-hipaa-sanitizer.md) | 100% client-side HIPAA Safe Harbor (45 CFR § 164.514(b)) de-identifier to mask patient names, SSNs, member IDs, DOBs, and addresses in 837/835/270 transactions with audit logging. |
| [EDI Batch Splitter & Joiner](edi/edi-batch-splitter.md) | Split multi-transaction EDI files by Functional Group (GS/GE), Transaction Set (ST/SE), or PO/Claim filters, or merge multiple files with auto-recalculated envelopes. |
| [EDI Semantic Diff & Compare](edi/edi-diff-compare.md) | Compare two ANSI X12 or EDIFACT documents side-by-side or unified with loop alignment, element-level mutation highlights, and volatile envelope ignoring. |
| [EDI Inbound & Outbound Integration Gateway](edi/edi-message-gateway.md) | Bi-directional enterprise B2B integration: Inbound ingestion, validation, and canonical mapping to JSON/XML, and outbound ERP-to-EDI synthesis with AS2 packaging. |
| [EDI X12 Formatter](edi/edi-formatter.md) | Format, wrap, and indent ANSI X12 and EDIFACT documents with custom delimiters. |
| [EDI Hierarchical Schema Viewer & Element Lookup](edi/edi-schema-viewer.md) | Explore ANSI X12 loop hierarchies (Header, PO1, HL, Summary), element positions (BEG01, PO102), and code-list definitions with synchronized raw text highlighting. |
| [EDI Segment Viewer](edi/edi-segment-viewer.md) | Inspect EDI segments, drill down into element positions (ISA01-16), and search data. |
| [EDI to JSON Converter](edi/edi-to-json.md) | Convert ANSI X12 and EDIFACT messages to structured, hierarchical JSON trees. |
| [EDI Syntax & Envelope Validator](edi/edi-validator.md) | Validate ISA/IEA, GS/GE, and ST/SE envelope pairing, control numbers, and segment counts. |
| [EDI 997 & CONTRL Ack Generator](edi/edi-997-generator.md) | Generate ANSI X12 997 and EDIFACT CONTRL functional acknowledgments with auto-reversed sender/receiver envelopes. |
| [JSON to EDI Converter](edi/json-to-edi.md) | Convert JSON payloads and REST transaction models into ANSI X12 or EDIFACT segments with exact counts. |
| [EDI Template & Sample Generator](edi/edi-sample-generator.md) | Generate customizable ANSI X12 (850, 810, 856, 204, 214, 820) and EDIFACT (ORDERS, INVOIC, DESADV) documents. |
| [EDI Delimiter Swapper & Normalizer](edi/edi-delimiter-converter.md) | Swap element/segment delimiters, enforce strict 106-character ISA envelope padding, and clean carriage returns. |
| [AS2 Message Encoder, Decoder & MDN Generator](edi/as2-tools.md) | Package, sign, encrypt, and inspect AS2 messages (RFC 4130) and generate or verify MDN receipts and MIC hashes. |
| [GS1-128 / SSCC-18 Label Generator](edi/gs1-sscc-label-generator.md) | Generate GS1-128 compliant SSCC-18 shipping labels with GTIN, quantity, batch, and expiration Application Identifiers, and sync them into your 856 ASN. |
| [EDI Order Lifecycle Reconciliation Viewer](edi/edi-lifecycle-reconciliation.md) | Cross-reference 850, 855, 856, 810, and 997 documents by PO and control number to visualize the full order lifecycle and flag missing or mismatched stages. |

## xml

### 📐 XML & XSD Tools

*XML is a way of writing structured documents using labeled tags (like HTML, but for data). An XSD is the "blueprint" or contract that says which tags are allowed, in what order, and what type of data they hold. These tools help you write, check, and transform XML against that blueprint.*

👉 **Start with the [XML/XSD Basics primer](xml/00-xml-basics.md) first if you're new to XML/XSD.**

| Tool | Description |
|------|-------------|
| [XSLT Transformer & Tester](xml/xslt-transformer.md) | Execute XSLT 1.0/2.0 transformations with source XML, stylesheets, live preview, and EDI XML presets. |
| [XML to XSD Schema Generator](xml/xml-to-xsd.md) | Infer W3C XML Schema (.xsd) definitions from XML instances with automatic data type detection and unbounded cardinality. |
| [XSD to XML Sample Generator](xml/xsd-to-xml.md) | Synthesize conforming, realistic XML sample documents from W3C XSD schemas with sample data. |
| [XPath Tester & Evaluator](xml/xpath-evaluator.md) | Evaluate XPath 1.0 expressions against XML documents with matched nodes inspector, counts, and cheat sheets. |
| [XML Entity & CDATA Escaper](xml/xml-escape-tool.md) | Escape/unescape special XML characters, wrap/unwrap CDATA blocks, and minify XML markup. |
| [XSD & XML Schema Validator](xml/xsd-validator.md) | Validate XML structures against W3C XSD schema definitions, data types, and element constraints. |

## utilities

### 🧰 Utilities

*This is the Swiss-army-knife drawer: small, focused tools that each solve one everyday annoyance in five seconds — generate an ID, build a QR code, decode a timestamp, or figure out what a cron schedule actually means.*

| Tool | Description |
|------|-------------|
| [UUID Generator](utilities/uuid-generator.md) | Generate cryptographically random UUID v4 identifiers in batch or single. |
| [QR Code Generator](utilities/qr-generator.md) | Generate high-resolution, downloadable QR code images for URLs and text. |
| [Password Generator](utilities/password-generator.md) | Generate secure, uncrackable passwords with custom character sets and entropy scores. |
| [Lorem Ipsum Generator](utilities/lorem-ipsum.md) | Generate paragraphs, sentences, or words of placeholder Lorem Ipsum text. |
| [Color Converter](utilities/color-converter.md) | Convert colors between HEX, RGB, RGBA, HSL, and preview contrast. |
| [Unix Timestamp Converter](utilities/timestamp.md) | Convert Unix epoch timestamps to human-readable dates and vice versa. |
| [Cron Expression Builder](utilities/cron-expression.md) | Build, validate, and understand standard 5-part cron schedules with human explanations. |
| [Slugify Tool](utilities/slugify.md) | Convert titles and phrases into clean, URL-friendly kebab-case slugs. |
| [HTTP Status Code Lookup](utilities/http-status-codes.md) | Searchable dictionary of HTTP status codes, names, meanings, and RFC references. |
| [Advanced Mock Data Generator](utilities/mock-json-generator.md) | Generate realistic mock data records with custom schema fields, exported as JSON, CSV, or SQL INSERT statements. |
| [Markdown Live Preview](utilities/markdown-preview.md) | Real-time Markdown editor with live rendered preview and document word counts. |

## text

### ✍️ Text Tools

*A digital text workbench: paste a block of text in and get counts, cleanups, and reordering done instantly, the way you'd use "Find & Replace" in a word processor — but built for developers.*

| Tool | Description |
|------|-------------|
| [Text Tools & Statistics](text/text-tools.md) | Count words/characters, remove duplicate lines, trim whitespace, and sort text. |

---

_77 tools documented · Last generated: 2026-09-15 · Auto-generated by `scripts/generate-tool-docs.py` from `src/data/tools.ts` + `src/data/toolMetadata.json`._
