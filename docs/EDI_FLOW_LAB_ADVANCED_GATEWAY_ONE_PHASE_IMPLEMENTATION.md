# EDI Flow Lab — Advanced Integration Gateway
## One-Phase Implementation Guide for AI Coding Agents
### Target Repository: coolnaveen99/codepackr
### Scope: Full bidirectional inbound/outbound pipeline + swap button + workbench UI
### Constraint: 100% browser-only, client-side, no Azure, no backend, no real message broker

---

## 0. Absolute Rules (Do Not Violate)

1. **Never** introduce network calls, Azure Logic Apps, Service Bus, databases, certificate stores, LN servers, file shares, or real partner endpoints.
2. **Never** send raw EDI, PHI, or user payloads to any server or analytics.
3. **Preserve** the existing public API of the gateway page (URL, tool registration, related-tool navigation).
4. **Extend** the current `EdiMessageGatewayView.tsx` — do not delete the working input experience, fixtures, PHI toggle, tree view, or download helpers.
5. All processing must remain in-memory via a single `PipelineContext` object.
6. Every simulated infrastructure object must be labelled **Mock**, **Virtual**, or **Simulated**.
7. Follow existing Codepackr conventions: React 18 + TypeScript + Vite + Tailwind + `var(--surface)`, `var(--brand)`, Lucide icons, `downloadFile` from `../../lib/smartDownload`.
8. Keep the file under reasonable size by extracting pure logic into `src/edi-core/` and UI pieces into `src/gateway/` (or `src/components/edi/gateway/`).
9. Add focused unit tests for pure functions. Do not write brittle snapshot tests of the entire page.
10. After implementation the tool must still work offline as a PWA.

---

## 1. Current State (Evidence-Based Map)

**Primary file (very large — ~110k+ chars):**
- `src/components/edi/EdiMessageGatewayView.tsx`

**Already present and must be reused:**
- `PipelineDirection = 'inbound' | 'outbound'`
- Direction selector UI (two big cards)
- `handleTransferToOutbound` / `handleTransferToInbound`
- Fixtures: `FIXTURE_X12_850`, `FIXTURE_X12_837_CLAIM`, `FIXTURE_X12_214_LOGISTICS`, `FIXTURE_AS2_MESSAGE`, `FIXTURE_EDIFACT_ORDERS`, `FIXTURE_OUTBOUND_JSON_PO`, `FIXTURE_OUTBOUND_JSON_INVOICE`
- `detectFormatAndDelimiters`, `parseEdiToCanonical`, `synthesizeEdiFromCanonical`, `packageAs2Mime`
- `CanonicalDocument`, `CanonicalLineItem`, `CanonicalParty`, `DiagnosticMessage`
- PHI mask toggle, tree view integration, download helpers, related tools

**Missing / incomplete relative to the target design:**
- Proper multi-stage pipeline with status, events, warnings, errors
- Guided / Full / Expert modes
- Stage rail with click-to-inspect
- Field-lineage (source segment → output field)
- Adapter registry (extensible beyond hard-coded X12/EDIFACT)
- Virtual file artifacts with safe names
- Prominent central **Swap** button
- Trace panel, Artifact tabs, Mapping inspector, Mock infrastructure drawer
- Shared pure domain modules under `src/edi-core/`

---

## 2. Target Folder Structure (Create Exactly)

```text
src/
  edi-core/
    models/
      index.ts                 # all shared types exported from here
      pipeline.ts              # PipelineContext, PipelineEvent, PipelineError, PipelineStatus
      canonical.ts             # CanonicalDocument, CanonicalLine, Party, ReferenceValue, SourceTrace, FieldMapping
      envelope.ts              # InboundEnvelope, As2Package, MockFile, MockPartner
      segments.ts              # ParsedSegment, ParsedTransaction
      detection.ts             # FormatDetection, EdiFormatFamily, DetectionResult
    adapters/
      types.ts                 # EdiFormatAdapter contract
      registry.ts              # registerAdapter, getAdapter, detectWithRegistry
      x12Adapter.ts
      edifactAdapter.ts
    parsing/
      delimiters.ts
      split.ts
    validation/
      envelope.ts
      transaction.ts
      canonical.ts
    transformations/
      inboundMaps.ts           # 850→Order, 860→OrderChange, 944→StockAdvRecpt, ORDERS→Order, etc.
      outboundMaps.ts          # ItemMaster→888, StockAdvice→943, Invoice→810, Shipment→856, etc.
      lineage.ts               # FieldMapping helpers
    renderers/
      jsonRenderer.ts
      xmlRenderer.ts
      txtRenderer.ts
      x12Renderer.ts
      edifactRenderer.ts
    as2/
      package.ts               # mock AS2 packaging (headers + body preview only)
    privacy/
      phiMasker.ts             # reuse / extract existing PHI logic
    samples/
      index.ts                 # re-export fixtures or move them here
    utils/
      ids.ts                   # runId, control numbers
      filenames.ts             # safe file name sanitization
      xmlEscape.ts

  gateway/                     # or src/components/edi/gateway/
    pipeline/
      controller.ts            # createInitialContext, advanceStage, runFullPipeline, retryStage, reset
      stages/
        receive.ts
        detect.ts
        decode.ts
        split.ts
        route.ts
        canonical.ts
        targetOutput.ts
        outboundSource.ts
        outboundCanonical.ts
        outboundEdi.ts
        outboundAs2.ts
    state/
      useGatewayPipeline.ts    # React hook wrapping controller
    components/
      DirectionSwapButton.tsx
      PipelineStageRail.tsx
      TracePanel.tsx
      ArtifactTabs.tsx
      MappingInspector.tsx
      MockInfraDrawer.tsx
      ModeSelector.tsx
      ErrorRetryPanel.tsx
      VirtualFileBrowser.tsx
    views/
      # Keep the main view at the original location for routing compatibility:
      # src/components/edi/EdiMessageGatewayView.tsx  (refactor in place)

  # Do NOT move the public entry point. The tool registration in tools.ts / App.tsx must continue to point to EdiMessageGatewayView.
```

---

## 3. Core Domain Types (Implement First)

Create `src/edi-core/models/` with these exact shapes (adjust only for TypeScript strictness already used in the repo):

```typescript
// pipeline.ts
export type PipelineDirection = 'inbound' | 'outbound';

export type PipelineStatus =
  | 'idle'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'dead-lettered';

export type PipelineContext = {
  runId: string;
  direction: PipelineDirection;
  status: PipelineStatus;
  currentStage: string;
  input: unknown;
  formatFamily?: EdiFormatFamily;
  parserId?: string;
  rendererId?: string;
  envelope?: Record<string, unknown>;
  transactions: ParsedTransaction[];
  canonical?: CanonicalDocument;
  targetOutput?: TargetOutput;
  x12Output?: string;          // or generic ediOutput
  ediOutput?: string;
  as2Output?: As2Package;
  virtualFiles: MockFile[];
  events: PipelineEvent[];
  warnings: string[];
  errors: PipelineError[];
  // expert overrides
  partnerId?: string;
  outputFormat?: 'json' | 'xml' | 'txt';
  controlNumberOverrides?: Record<string, string>;
};

export type PipelineEvent = {
  id: string;
  stageId: string;
  status: 'started' | 'succeeded' | 'warning' | 'failed' | 'retried';
  timestamp: string;
  message: string;
  details?: Record<string, unknown>;
};

export type PipelineError = {
  code: string;
  stageId: string;
  message: string;
  recoverable: boolean;
  source?: string;
};
```

```typescript
// detection.ts
export type EdiFormatFamily =
  | 'x12'
  | 'edifact'
  | 'eancom'
  | 'tradacoms'
  | 'vda'
  | 'odette'
  | 'ucs'
  | 'xml-edi'
  | 'delimited-edi'
  | 'unknown';

export type FormatDetection = {
  format: EdiFormatFamily;
  confidence: 'high' | 'medium' | 'low';
  adapterId?: string;
  documentType?: string;
  messageType?: string;
  elementDelimiter?: string;
  segmentTerminator?: string;
  componentDelimiter?: string;
  reason: string;
  capability: 'full' | 'parse' | 'envelope' | 'raw' | 'unsupported';
};
```

```typescript
// segments.ts + canonical.ts + envelope.ts
// Follow the shapes defined in the original product brief:
// ParsedSegment, ParsedTransaction, CanonicalDocument (with SourceTrace + FieldMapping),
// InboundEnvelope, TargetOutput, MockFile, MockPartner, As2Package
```

**Important:** Keep the *existing* `CanonicalDocument` shape used by the current UI as a compatible superset or provide a thin adapter so the current tree view and PHI mask continue to work without a big-bang rewrite.

---

## 4. Adapter Registry (Required)

```typescript
// adapters/types.ts
export type EdiFormatAdapter = {
  id: string;
  family: EdiFormatFamily;
  label: string;
  detect(input: string, hints?: DetectionHints): DetectionResult;
  parse(input: string, options: ParseOptions): ParseResult;
  validate?(document: ParsedEdiDocument, options: ValidationOptions): ValidationResult;
  toCanonical?(document: ParsedEdiDocument, options: MappingOptions): CanonicalDocument;
  fromCanonical?(document: CanonicalDocument, options: RenderOptions): RenderResult;
};
```

- Register at least `x12` and `edifact` adapters on startup.
- Detection order must be deterministic.
- Unknown input → capability `'raw'` or `'unsupported'` with a clear message, never a silent failure.
- Extract the existing `detectFormatAndDelimiters` and `parseEdiToCanonical` logic into the X12/EDIFACT adapters; do not leave giant functions inside the view.

---

## 5. Pipeline Stages (Inbound)

Implement pure stage functions that accept context (or stage input) and return `StageResult<T>`:

| Stage ID       | Label                  | Responsibility |
|----------------|------------------------|----------------|
| receive        | Receive                | Create InboundEnvelope from paste/upload/preset |
| detect         | Detect Format          | Run adapter registry |
| decode         | Decode                 | Full parse into segments + envelope |
| split          | Split Transactions     | ST/SE or UNH/UNT boundaries |
| route          | Route                  | Local route table (850→Order, 860→OrderChange, 944→StockAdvRecpt …) |
| canonical      | Canonical Transform    | EDI → CanonicalDocument + FieldMapping lineage |
| targetOutput   | Target Output          | Canonical → JSON / XML / TXT via profile |
| virtualFile    | Virtual File           | Create MockFile, prepare download |

Route table must show both mock route name **and** reference subscription label (e.g. “SpareParts-Orders-Sub”).

---

## 6. Pipeline Stages (Outbound)

| Stage ID            | Label                | Responsibility |
|---------------------|----------------------|----------------|
| outboundSource      | Source Input         | Mock Baan / LN / custom JSON/XML presets |
| outboundCanonical   | Normalize → Canonical| Source → ItemMaster_Canonical, Invoice_Canonical, etc. |
| outboundEdi         | Generate EDI         | Canonical → X12 888/943/810/856 or EDIFACT ORDERS/INVOIC/DESADV |
| outboundEncode      | Envelope Encode      | Control numbers, delimiters, counts |
| outboundAs2         | AS2 Preview          | Mock headers + MIME structure + downloadable .eml/.as2 |
| outboundDownload    | Download Artifacts   | Virtual files |

---

## 7. Pipeline Controller & Modes

```typescript
// controller.ts
export function createInitialContext(direction: PipelineDirection, input: unknown): PipelineContext;
export function advanceStage(ctx: PipelineContext): PipelineContext;   // guided mode
export function runFullPipeline(ctx: PipelineContext): PipelineContext; // full mode
export function retryStage(ctx: PipelineContext, stageId: string): PipelineContext;
export function resetPipeline(direction: PipelineDirection): PipelineContext;
export function replayFromStage(ctx: PipelineContext, stageId: string): PipelineContext;
```

**Three modes (UI control):**

- **Guided** — user clicks “Next: …” buttons; one stage at a time.
- **Full** — single button “Run Full Inbound/Outbound Pipeline”; animates stages quickly and exposes all artifacts.
- **Expert** — all intermediate values editable (partner, maps, control numbers, delimiters, canonical JSON).

State must live in a single React hook `useGatewayPipeline` that the view consumes. Do not scatter stage state across dozens of `useState` calls in the view.

---

## 8. Swap Button (Mandatory UX)

Replace / enhance the existing direction cards with a clear three-part control:

```
[ Inbound Gateway (EDI → ERP) ]   [ ⇄ Swap ]   [ Outbound Gateway (ERP → EDI) ]
```

**Swap behavior:**

- From inbound → outbound:
  - If a valid `canonical` exists, stringify it (pretty) into the outbound source editor.
  - Set direction to `'outbound'`.
  - Emit a pipeline event: “Transferred canonical document to outbound pipeline”.
  - Show a short non-blocking toast.

- From outbound → inbound:
  - If a valid `ediOutput` exists, load it into the inbound raw input.
  - Set direction to `'inbound'`.
  - Emit corresponding event.

- If the source side has no usable artifact, disable the Swap button and show a tooltip explaining why.

Use the existing `ArrowLeftRight` icon. Make the Swap button visually distinct (brand color, larger hit target) so it is the primary loopback action.

---

## 9. UI Components to Add / Extend

### 9.1 Pipeline Stage Rail
Horizontal (desktop) / vertical (mobile) rail showing every stage for the current direction.
Each stage card: stable width, status icon, label, error state, click-to-inspect.
Active stage highlighted. Keyboard accessible.

### 9.2 Trace Panel
Chronological list of `PipelineEvent`s with timestamp, stage, status, message.
Filterable by status. Copyable.

### 9.3 Artifact Tabs
Tabs (only show those that have content):
- Raw Input
- Envelope
- Segments
- Transactions
- Canonical JSON
- Canonical XML
- Target JSON / XML / TXT
- Generated EDI
- AS2 Preview
- Run Report

### 9.4 Mapping Inspector
Click any canonical or target field → show:
```
Output field: businessId
Source segment: BEG
Source element: BEG03
Source value: PO-987654
Mapping rule: Purchase order number
```

### 9.5 Mock Infrastructure Drawer
Collapsible drawer listing:
- Mock route table
- Mock partner registry
- Mock transformation maps
- Virtual output files
- Mock outbound partner endpoint

All labelled “Simulated — browser only”.

### 9.6 Mode Selector + Error/Retry Panel
Segmented control for Guided / Full / Expert.
Error panel with recoverable vs fatal, retry button, and stable error codes.

---

## 10. Virtual Files & Downloads

```typescript
export type MockFile = {
  path: string;
  name: string;
  content: string;
  format: 'json' | 'xml' | 'txt' | 'edi' | 'as2';
  contentType: string;
  sourceRunId: string;
  status: 'created' | 'downloaded';
};
```

- Generate Blob **only** on user download action.
- Sanitize every file name (no path separators, limited length, safe characters).
- Naming conventions:
  - Inbound: `ORD_<partner>_<businessId>_<timestamp>.{json|xml|txt}`
  - Outbound: `X12_888_<partner>_<businessId>.edi`, `AS2_<partner>_<businessId>.eml`
- Reuse `downloadFile` from `../../lib/smartDownload`.

---

## 11. Privacy & Sharing Safeguards

- Keep the existing “Client-side processing” badge.
- PHI/PII redaction toggle must continue to work on canonical data.
- Share action must warn before putting raw payload into a URL.
- Offer a “Share redacted run” that replaces business values with synthetic tokens.
- Never log raw EDI.

---

## 12. Integration with Existing EDI Tools

Do **not** duplicate parsers. Import from `edi-core`.
When the user navigates to a related tool (Formatter, Segment Viewer, EDI↔JSON, AS2, Ack Generator, PHI Sanitizer, etc.), pass the selected artifact via the repository’s existing navigation/state mechanism (in-memory or query param only when the user explicitly shares).

---

## 13. Testing Requirements (Must Ship With Code)

**Unit tests (pure functions):**
- Delimiter detection
- X12 and EDIFACT envelope extraction
- Transaction splitting (single + multiple)
- 850 / 860 / 944 / ORDERS / INVOIC mapping
- 888 / 943 / 810 / 856 generation
- Control-number consistency
- XML escaping
- Safe file-name generation
- AS2 header generation (no network)

**Round-trip:**
```
Canonical → EDI generation → parse with same adapter → business fields preserved
```

**Controller tests:**
- Guided advance
- Full pipeline success
- Failure at each stage + retry
- Swap transfer both directions

Place tests next to the modules or under the existing test layout of the repo. Prefer Vitest if already configured; otherwise follow whatever the repository already uses.

---

## 14. Implementation Order (Single Phase — Strict Sequence)

Execute in this exact order so the agent never breaks the live tool:

1. **Create folder skeleton** `src/edi-core/` and `src/gateway/` (or equivalent under components/edi).
2. **Define all TypeScript models** and export them from `edi-core/models/index.ts`.
3. **Extract** existing detection, parsing, synthesis, and AS2 helpers into adapters + pure modules. Keep the view compiling at every step by re-exporting temporary facades if needed.
4. **Implement adapter registry** + X12 + EDIFACT adapters.
5. **Implement stage functions** (inbound first, then outbound).
6. **Implement pipeline controller** + `useGatewayPipeline` hook.
7. **Add ModeSelector + PipelineStageRail + TracePanel**.
8. **Implement the prominent Swap button** and wire both transfer directions.
9. **Add ArtifactTabs, MappingInspector, MockInfraDrawer, VirtualFileBrowser**.
10. **Wire Full / Guided / Expert modes** and error/retry simulation.
11. **Refactor EdiMessageGatewayView.tsx** to consume the hook and new components while preserving:
    - Existing input textarea + upload
    - Story presets
    - PHI mask
    - Tree view
    - Related tools links
    - Client-side privacy messaging
12. **Add unit + round-trip tests**.
13. **Run lint + build**. Fix any TypeScript or accessibility issues.
14. **Manual verification checklist** (see §16).

---

## 15. Coding Style Rules Specific to This Repo

- Prefer pure functions for all parsing, mapping, and rendering.
- Use existing design tokens: `var(--surface)`, `var(--brand)`, `var(--muted)`, `var(--bg)`.
- Icons: Lucide React only (already imported in the view).
- No new heavy dependencies.
- Keep Tailwind class names consistent with the rest of the EDI suite.
- Avoid `any`. Prefer the existing strict TypeScript style.
- Comments only where the business rule is non-obvious (mapping rules, control-number generation).

---

## 16. Definition of Done (One-Phase Acceptance)

The feature is complete only when **all** of the following are true:

- [ ] User can paste or upload X12 / EDIFACT / AS2-wrapped content.
- [ ] Inbound pipeline visibly progresses through every stage (Receive → … → Virtual File).
- [ ] 850 produces Order_Canonical and then JSON / XML / TXT virtual files.
- [ ] 860 and 944 branches work.
- [ ] Outbound presets (ItemMaster→888, StockAdvice→943, Invoice→810, Shipment→856) work.
- [ ] Generated EDI is parseable by the inbound adapter (round-trip).
- [ ] AS2 preview is generated and downloadable but never transmitted.
- [ ] Prominent **Swap** button transfers canonical ↔ EDI and switches direction.
- [ ] Guided, Full, and Expert modes all function.
- [ ] Every intermediate artifact is inspectable in tabs.
- [ ] Field lineage is visible for mapped fields.
- [ ] Mock infrastructure drawer is present and correctly labelled.
- [ ] Failures are actionable and retryable.
- [ ] PHI mask still works.
- [ ] No network requests are made for core processing.
- [ ] No raw payload is sent to analytics or a server.
- [ ] Unit and round-trip tests pass.
- [ ] `npm run lint` and `npm run build` succeed.
- [ ] Mobile layout remains usable (stage rail does not overflow or hide controls).
- [ ] Existing story presets and related-tool links continue to work.

---

## 17. Copy-Paste System Prompt for the Coding Agent

```text
You are implementing the full Advanced EDI Integration Gateway for the Codepackr repository (coolnaveen99/codepackr) in a single phase.

Follow the file EDI_FLOW_LAB_ADVANCED_GATEWAY_ONE_PHASE_IMPLEMENTATION.md exactly.

Absolute constraints:
- 100% browser-only, client-side, no Azure, no backend, no real message broker, no network transmission of EDI.
- Extend the existing EdiMessageGatewayView; do not destroy the current input experience, fixtures, PHI toggle, or tree view.
- Extract pure logic into src/edi-core/ and UI pieces into src/gateway/ (or src/components/edi/gateway/).
- Implement the prominent central Swap button (Inbound ↔ Outbound) using the existing transfer semantics.
- Deliver Guided / Full / Expert modes, stage rail, trace, artifact tabs, mapping inspector, mock infra drawer, and virtual files.
- All simulated objects must be labelled Mock / Virtual / Simulated.
- Add unit + round-trip tests for the pure modules.
- Keep the tool offline-capable and privacy-preserving.

Work in the strict sequence defined in section 14. After each major step ensure the project still compiles. At the end run lint + build and satisfy the Definition of Done checklist in section 16.

Begin by creating the folder skeleton and the shared domain models.
```

---

## 18. Final Notes for the Human Maintainer

- This single markdown file is intentionally self-contained so any coding agent (Copilot, Cursor, Claude, Grok, etc.) can execute the entire upgrade without needing the original long product brief.
- The existing large `EdiMessageGatewayView.tsx` should shrink significantly once pure logic is extracted; that is intentional and desirable.
- Prefer small, focused commits or PR steps even though the overall delivery is one phase.
- After merge, update `docs/EDI_UX_Modernization_Guide.md` and the README “EDI UX Modernization” section to point to the new advanced gateway capabilities.

**End of One-Phase Implementation Guide**
