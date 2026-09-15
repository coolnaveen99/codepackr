# Skill: Add New Tool to CodePackr

This skill specifies the standard operating procedure (SOP) and mandatory file sequence required to introduce a new developer utility or EDI tool into CodePackr (`www.codepackr.com`).

---

## 1. Overview & Architectural Principles

1. **100% Client-Side Execution**: All processing must run locally in the browser via JavaScript/Web Workers. Zero user payloads leave the client.
2. **Ephemeral & Stateless**: No automatic saving of user inputs to remote databases or local storage without explicit user request.
3. **Four-Layer Metadata Synchronization**: Whenever a tool is created or updated, its metadata must be updated in `tools.ts`, `seo.ts`, `generate-metadata.mjs`, and `sitemap.xml`.
4. **URL Backward Compatibility**: All tools receive a clean canonical slug and retain legacy aliases to prevent 404 errors on search engine indexes.

---

## 2. Sequential Step-by-Step Implementation Flow

### Step 1: Define the Tool Definition
**Target File**: `src/data/tools.ts`
- Add a new entry to the `TOOLS` array:
  ```typescript
  {
    id: 'my-new-tool',
    name: 'My New Tool',
    category: 'formatters', // 'formatters' | 'converters' | 'validators' | 'generators' | 'crypto' | 'edi' | 'utilities'
    description: 'Concise, high-impact description of the tool utility.',
    keywords: ['keyword1', 'keyword2', 'developer tool'],
    icon: 'Terminal', // Must be a valid Lucide icon name matching IconMap in CategoryView
    badge: 'New', // Optional: 'New' | 'Popular' | 'Updated'
  }
  ```

### Step 2: Implement the Tool Component
**Target File**: `src/components/tools/MyNewTool.tsx` (or inside the appropriate category view)
- Ensure clean layout using the Enterprise Design System:
  - Container padding: `p-4 sm:p-6 rounded-2xl border bg-[color:var(--surface)] border-[color:var(--border)]`
  - Text: `text-[color:var(--ink)]` and `text-[color:var(--ink-muted)]`
  - Interactive inputs/buttons: `rounded-xl`
  - For code editing: use `<CodeEditor value={val} onChange={setVal} language="json" />`
  - For currency formatting: use `const { formatAmount } = useCurrency();`
  - Sample/Demo button, Reset/Clear button, and Copy-to-Clipboard with visual feedback.

### Step 3: Wire into Category View & Routing
**Target Files**:
- `src/components/tools/<Category>View.tsx`: Add the tool tab and render the new component.
- `src/App.tsx`: Ensure route state matches when `activeTool` is selected or rendered directly.

### Step 4: Register URL Slugs & Aliases
**Target File**: `src/lib/urls.ts`
- Map tool ID to canonical slug:
  ```typescript
  TOOL_ID_TO_CANONICAL_SLUG: {
    'my-new-tool': 'my-new-tool-online',
  }
  ```
- Map slug to tool ID (including any historical or alternate aliases):
  ```typescript
  SLUG_TO_TOOL_ID: {
    'my-new-tool-online': 'my-new-tool',
    'my-new-tool': 'my-new-tool',
  }
  ```

### Step 5: Update Prerender Metadata & SEO Schemas
**Target File**: `scripts/generate-metadata.mjs`
- Add an entry in the tool metadata generator map:
  ```javascript
  'my-new-tool': {
    title: 'Free Online My New Tool | Fast & Private | CodePackr',
    description: 'Instant, client-side My New Tool for developers. 100% private in-browser processing with zero server uploads.',
    features: [
      '100% in-browser client-side execution with zero data storage',
      'Real-time syntax diagnostics and formatting',
      'One-click clipboard export and sample payload loader',
    ],
    faqs: [
      {
        q: 'Is my data private when using this tool?',
        a: 'Yes. All data processing occurs entirely within your local browser memory. No data is ever transmitted to a server.',
      },
    ],
  }
  ```

### Step 5b: Synchronize Tutorial Reference (Tutorial Sync Rule)
**Target File**: `src/components/edi/EdiTutorialPanel.tsx` (for EDI tools) or contextual tutorial drawers
- **Tutorial Sync Rule**: Every tool or major tool feature update must keep its embedded tutorial, quick-reference guide, and scenario definitions accurate and up-to-date.
- Stale tutorials that contradict current UI controls, features, or naming conventions are considered product defects.
- For all EDI tools, verify that trading partner names in `EDI_TUTORIALS` adhere to the mandatory fictional naming policy (`Northwind Trading`, `Contoso Retail`, `Fabrikam Logistics`, `Tailwind Carrier`, `Horizon Clinic`, `Summit Health Plan`) and never reference real brand entities.


### Step 6: Execute Build & Automatic Synchronization
Run the full production pipeline:
```bash
npm run build
```
This automatically:
1. Regenerates `public/sitemap.xml` and `dist/sitemap.xml` with the new route.
2. Updates `src/data/sitemapUrls.json` and `src/data/toolMetadata.json`.
3. Prerenders static HTML at `dist/<slug>.html`.
4. Regenerates `public/codepackr_social_media_promotions.csv` with customized marketing copy.
5. Dispatches IndexNow notification pings to search engines (Bing, Yandex, etc.).

### Step 7: Verify Code Quality & Type Safety
```bash
npm run lint
```
Verify 0 TypeScript errors and clean build output.
