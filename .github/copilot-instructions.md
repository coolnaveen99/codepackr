# GitHub Copilot & Coding Agent Instructions for CodePackr

## 🚀 Core Directives

### 1. Mandatory Pre-Script Comment Directive
When adding or updating external scripts, tracking tags, tag managers, analytics, or advertising embeds (e.g. Google Tag Manager, Google AdSense, Microsoft Clarity, analytics pixels):
- **ALWAYS** add an informative comment line directly above the script describing **why it is used** and **details in plain English for layman understanding**.
- Include the identifier (Container ID, Publisher ID, or Project ID) and plain explanation of its function.
- Only after this comment line should the `<script>` or `<noscript>` tag be placed.
- Never paste bare, uncommented script tags into HTML or JSX templates.

### 2. 100% Client-Side Privacy Mandate
- All parsers, formatters, encoders, converters, and validators must run strictly in the user's browser memory via Web APIs / Web Workers.
- Zero user data may be transmitted over the network or saved to remote databases.

### 3. Four-Layer Metadata Synchronization
When adding or updating tools, keep `src/data/tools.ts`, `src/lib/seo.ts`, `scripts/generate-metadata.mjs`, and `scripts/build-sitemap.mjs` synchronized.

### 4. Backward-Compatible URL Routing
Never delete legacy slugs or aliases in `src/lib/urls.ts`.

### 5. Layman Documentation Sync
Whenever a tool is added, renamed, or its behavior changes, update `docs/tools/` by
following `.github/skills/update-tool-docs.md`. Edit the `TOOL_CONTENT` data in
`scripts/generate-tool-docs.py` and re-run `python3 scripts/generate-tool-docs.py` — never
hand-edit the generated files under `docs/tools/<category>/*.md` directly.
