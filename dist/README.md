# Codepackr

Codepackr is a free collection of browser-based developer tools for formatting, validating, encoding, converting, and inspecting technical data. It is available at [codepackr.com](https://www.codepackr.com/).

All tools run locally in the browser. Input is not uploaded by the formatting, validation, encoding, conversion, and utility tools.

## Tools

### Formatters

- JSON Formatter
- HTML Formatter
- CSS Formatter
- SQL Formatter
- XML Formatter
- YAML Formatter
- JavaScript Minifier

### Encoders and security utilities

- Base64 Encoder and Decoder
- URL Encoder and Decoder
- HTML Entity Encoder and Decoder
- Hash Generator
- JWT Decoder
- JWT Encoder
- Base64 Image Encoder and Decoder

### Validators and inspection tools

- Diff Checker
- Regex Tester
- JSON Validator
- JSONPath Tester
- XSD Validator
- CSV Viewer
- Structural JSON Diff
- dotenv Formatter and Validator

### Converters

- JSON to XML Converter
- JSON to CSV Converter
- CSV to XML Converter
- Case Converter
- YAML to JSON Converter
- Number Base Converter
- Markdown to HTML Converter
- HTML to Markdown Converter
- cURL to Code Converter
- Image Resizer and Compressor
- Favicon Generator
- EDI X12 Formatter
- EDI Segment Viewer
- EDI to JSON Converter

### General utilities

- UUID Generator
- QR Code Generator
- Password Generator
- Lorem Ipsum Generator
- Text Tools
- Markdown Preview
- Color Converter
- Unix Timestamp Converter
- Cron Expression Builder
- Slugify Tool
- HTTP Status Code Lookup
- Mock JSON Data Generator
- Calculator

## Features

- Search tools by name, category, or description.
- Persisted light and dark themes.
- Shareable short-input tool URLs using the `input` query parameter.
- Recently used and related tool navigation.
- Keyboard shortcuts: `Ctrl/Cmd+K` for search and `Ctrl/Cmd+Enter` to run a tool.
- Installable PWA with offline caching.
- Responsive layout for desktop and mobile browsers.
- Copyable output for tool results.
- Contact page for bug reports, feedback, and tool requests.

## Development

This project uses React, TypeScript, and Vite.

Run all commands from this repository directory:

```bash
npm install
npm run dev
```

The development server is normally available at `http://localhost:5173`. Use a browser to open the homepage or any tool URL, such as `http://localhost:5173/json-formatter.html`.

## Production build

```bash
npm run build
npm run preview
```

The build output is generated in `build/`. Do not edit `build/` manually; Vite and `scripts/prerender.mjs` regenerate it.

To test the production output locally, run `npm run preview` after `npm run build` and open the URL Vite prints in the terminal.

## Quality checks

```bash
npm run lint
npm run build
```

## SEO and search engines

- `index.html` contains the base title, description, canonical URL, social metadata, and Bing Webmaster verification tag.
- `src/App.tsx` updates titles, descriptions, canonicals, and JSON-LD structured data for each tool route.
- `public/robots.txt` permits crawling and points search engines to the sitemap.
- `scripts/prerender.mjs` is the source of truth for deployable routes. Every `npm run build` regenerates `build/sitemap.xml` from its tool registry.
- `public/sitemap.xml` mirrors the route inventory for source review. Add a new tool to `scripts/prerender.mjs`, then run `npm run build` to update the deployed sitemap.

When deploying, submit `https://www.codepackr.com/sitemap.xml` to Google Search Console and Bing Webmaster Tools. The Google Search Console verification tag must be added to `index.html` using the value supplied by Google; the Bing tag cannot be reused for Google verification.

## Deployment

The app is configured for Vercel. Set the Vercel project root directory to this repository directory, then use:

```bash
npm install
npm run build
```

`vercel.json` rewrites application routes to the Vite entry point while leaving static assets, `robots.txt`, and `sitemap.xml` available directly.

The contact form posts to a Google Apps Script endpoint. The production Content Security Policy in `vercel.json` permits both `script.google.com` and the `script.googleusercontent.com` redirect host required by Apps Script.
