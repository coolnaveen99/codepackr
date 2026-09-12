# Codepackr Agent Guidelines & Instructions

Welcome to **Codepackr** (`www.codepackr.com`) — a comprehensive, 100% privacy-first, client-side developer utility suite and EDI (Electronic Data Interchange) transaction hub.

---

## 🚀 Core Directives (Zero-Friction Automation)

### 1. Automated SEO & Sitemap Indexing Directive
- **Auto-Generate Sitemap**: Always maintain and regenerate the sitemap (`scripts/build-sitemap.mjs`) whenever tools, routes, or pages are added or modified.
- **Auto-Submit to Search Engines**: **NEVER ask the user for confirmation** to submit or ping search engine indexes. Always run `node scripts/indexnow.mjs` automatically as part of the build pipeline (`npm run build`).
- **Zero-Friction Indexing**: Keep `public/sitemap.xml`, `dist/sitemap.xml`, and `src/data/sitemapUrls.json` synchronized across all live URLs without manual user prompts.

### 2. Automated Social Media Promotions Directive
- **Auto-Update Social Media CSV**: Whenever new tools, routes, features, or pages are added or modified, always regenerate the social media promotions dataset (`public/codepackr_social_media_promotions.csv`) by running `node scripts/generate-social-promotions.mjs`.
- **Zero-Friction Promotions Sync**: **NEVER ask the user for confirmation** to update social media copy or promotional files. Keep `public/codepackr_social_media_promotions.csv` synchronized with all live tools, including optimized copy for LinkedIn, X (Twitter), hashtags, character counts, and image prompts.

---

## ✅ DO's (Best Practices & Architecture)

### Architecture & Privacy
- **DO keep everything 100% client-side**: All formatting, validating, parsing, encoding, calculating, and barcode generation must execute directly in the user's browser using JavaScript / Web APIs. Zero user data leaves the client.
- **DO preserve backward-compatible routing**: When adding or updating tools, update `src/lib/urls.ts`:
  - Register canonical slugs in `TOOL_ID_TO_CANONICAL_SLUG` and `SLUG_TO_TOOL_ID`.
  - Maintain legacy aliases (e.g. `edi-x12-formatter`, `edi-json-converter`, `markdown`) so previously indexed search engine URLs never 404.
  - Register category hub routes in `CATEGORY_SLUG_MAP` (`/edi-tools`, `/formatters`, etc.).

### Global Currency System
- **DO use the centralized CurrencyContext (`useCurrency`)**:
  - Always use `const { formatAmount, currentCurrency } = useCurrency();` for rendering financial figures, loan calculations, gratuity calculations, and EDI financial summaries.
  - Respect the user's selected global currency (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`, `JPY`, etc.) everywhere financial data is displayed.
  - Provide a quick contextual currency selector or switch in financial views if applicable.

### UI, Design & Icons
- **DO adhere to the Codepackr theme palette**:
  - Use CSS theme variables: `var(--bg)`, `var(--surface)`, `var(--ink)`, `var(--muted)`, `var(--brand)`, `var(--line)`.
  - Ensure perfect contrast in both Light and Dark modes.
  - Use mathematical border radii: outer container `rounded-2xl` (16px), inner inputs/buttons `rounded-xl` (12px).
- **DO import all standard icons from `lucide-react`**:
  - For social and brand icons, use `src/components/BrandIcons.tsx` (e.g. `GithubIcon`, `XTwitterIcon`, `LinkedinIcon`, `YoutubeIcon`, `InstagramIcon`).
- **DO include user conveniences**:
  - Sample/Demo data load buttons for complex tools (e.g., EDI 850/855/856/810 samples, sample JSON, sample XML).
  - One-click "Copy to Clipboard" with temporary checkmark feedback.
  - Clear / Reset buttons.
  - Export / Download buttons for files, barcodes, and reports.

### SEO & Metadata
- **DO synchronize all 4 layers of metadata for every new tool**:
  1. `src/data/tools.ts`: Register tool metadata (`id`, `name`, `category`, `description`, `keywords`, `icon`).
  2. `src/lib/seo.ts`: Update client-side runtime document title, meta description, and canonical URL.
  3. `scripts/generate-metadata.mjs`: Provide rich feature bullet points, step-by-step how-to, and FAQ schema for prerendering.
  4. `scripts/build-sitemap.mjs`: Ensure the tool path is indexed in `sitemap.xml`.

### External Scripts & Tracking Tags Documentation Directive
- **DO document every script in plain English before inserting**:
  - Whenever adding, updating, or inserting external scripts, tracking tags, analytics snippets, or third-party embeds (e.g. Google Tag Manager, Google Analytics, AdSense, Clarity, Pixel tags) into `index.html` or any page template:
  - **MANDATORY**: First add a clear comment line explaining **why the script is used** and **details in simple layman-friendly terms** (e.g. what it does, why it exists, container/publisher IDs, and fallback behavior if JavaScript is disabled).
  - Only after this explanatory comment line, paste the script code.
  - Never insert bare or unexplained `<script>` or `<noscript>` tags.

### Verification
- **DO test builds thoroughly**:
  - Run `lint_applet` (`npm run lint`) to guarantee 0 TypeScript errors.
  - Run `compile_applet` (`npm run build`) to ensure Vite bundling, static prerendering, sitemap generation, and IndexNow submission all execute flawlessly.

---

## ❌ DONT's (Anti-Patterns & Restrictions)

### Privacy & Data Handling
- **DON'T transmit user input to external servers**: NEVER send EDI documents, JSON payloads, passwords, or personal files to remote backends. Codepackr guarantees 100% local privacy.
- **DON'T store user input in persistent remote databases**: No remote logging, no Google Analytics tracking of input payloads, and no third-party telemetry on sensitive developer text.

### Currency & Hardcoding
- **DON'T hardcode `$` or any currency symbol**:
  - ❌ Incorrect: `<span>${monthlyPayment.toFixed(2)}</span>`
  - ✅ Correct: `<span>{formatAmount(monthlyPayment)}</span>`
- **DON'T assume USD is the only currency**: Developers and EDI analysts use Codepackr worldwide; always support dynamic currency conversion/formatting via `CurrencyContext`.

### Routing & URLs
- **DON'T break existing URL paths or remove legacy slugs**: Existing Google and Bing index entries must continue to resolve seamlessly to their respective tools.
- **DON'T create deep nested route redirects that fail static hosting**: Keep all URLs clean top-level slugs matching `dist/<slug>.html` generated by `scripts/prerender.mjs`.

### UI & Styling Anti-Patterns
- **DON'T use arbitrary inline CSS or arbitrary color hexes**: Use Tailwind utility classes and CSS variables (`var(--brand)`, `var(--ink)`, `var(--line)`).
- **DON'T use custom inline SVGs for standard icons**: Import icons directly from `lucide-react`.
- **DON'T add unsolicited promotional clutter, heavy hero banners, or unneeded third-party widgets**: Users come to Codepackr for fast, distraction-free utility execution. Show the working tool immediately.
- **DON'T truncate or wrap button labels awkwardly**: Buttons and interactive pills must have clear, legible single-line labels.

### Automation & Prompts
- **DON'T ask the user for permission to update SEO, sitemaps, or indexing**: Sitemaps, social promotion files, and IndexNow submissions must happen automatically on every relevant change.
- **DON'T forget to run `node scripts/generate-social-promotions.mjs`** when new tools or features are introduced.

---

## 📋 New Tool Integration Checklist

When adding a new tool to Codepackr, complete this sequential checklist:

1. [ ] **Define Tool in `src/data/tools.ts`**: Add unique `id`, `name`, `category`, `description`, `keywords`, and `icon`.
2. [ ] **Implement Component**: Create the tool component in the appropriate directory (e.g. `src/components/tools/` or `src/components/edi/`).
3. [ ] **Wire into Category View & Dashboard**: Update `src/components/HomeDashboard.tsx` or category views to render the component when active.
4. [ ] **Register Routing in `src/lib/urls.ts`**: Add slug to `SLUG_TO_TOOL_ID` and `TOOL_ID_TO_CANONICAL_SLUG`.
5. [ ] **Add Metadata in `scripts/generate-metadata.mjs`**: Include tool name, description, category, and features for prerendering.
6. [ ] **Run Full Build & Sync**: Run `npm run build` (which automatically regenerates `sitemap.xml`, `toolMetadata.json`, `codepackr_social_media_promotions.csv`, prerenders HTML, and dispatches IndexNow pings).
7. [ ] **Verify with `lint_applet` and `compile_applet`**: Ensure zero type errors and a clean build.

---

## EDI UX Modernization Guide

When working on any EDI tool or the EDI category, **always follow** the enterprise roadmap and principles defined in:

**[docs/EDI_UX_Modernization_Guide.md](docs/EDI_UX_Modernization_Guide.md)**

Key requirements from the guide:
- Use progressive disclosure and one-click samples / Story Mode presets.
- Prefer visual trees and color-coded segments.
- Keep all processing 100% client-side (Web Workers + lazy dictionary loading).
- Implement PHI redaction toggle for healthcare transactions.
- Follow the phased matrix (Phase 1 Foundation → Phase 4 Visual Studio).
