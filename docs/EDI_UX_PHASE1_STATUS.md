# EDI UX Phase 1 — Status (pushed to main)

**Date:** 2026-09-12

## Shared components now on `main`

| File | Purpose |
|------|--------|
| `src/data/ediStoryFlows.ts` | Story Mode cycles (Retail Order-to-Cash, Logistics, EDIFACT Global Trade) |
| `src/components/edi/ToolShell.tsx` | Standardized dual-pane layout + toolbar + status bar |
| `src/components/edi/SampleSelector.tsx` | "Try Sample" dropdown + Story Mode step picker |
| `src/components/edi/EdiTreeView.tsx` | Hierarchical expandable segment/element tree with color coding |
| `src/components/edi/PhiMaskToggle.tsx` | Client-side HIPAA PHI redaction toggle |
| `src/components/edi/ValidationPanel.tsx` | Human-readable validation issues + fidelity badge |

All components follow Enterprise Design Tokens (`var(--surface)`, `var(--brand)`, etc.) and remain 100% client-side.

## Partially updated tools (in local workspace, not yet fully re-pushed)

- `EdiDelimiterCleaner.tsx` — already uses ToolShell + PHI mask
- `EdiTemplateGenerator.tsx` — already uses ToolShell + PHI mask

## Next steps (Phase 2)

1. Wire `ToolShell` + `SampleSelector` into remaining EDI tools (formatter, segment viewer, converters, validator, 997, schema viewer, CSV converter, etc.).
2. Upgrade `/edi-message-gateway` (`EdiMessageGatewayView.tsx`):
   - Progressive disclosure: **Simple Mode** (default) vs **Advanced Mode**
   - Wrap with ToolShell
   - Integrate Story Mode samples
   - Keep all existing pipeline, fixtures, and bi-directional swap logic
3. Add segment color coding and tree view to Segment Viewer / Schema Viewer.

## How to use the new components

```tsx
import { ToolShell } from './ToolShell';
import { SampleSelector } from './SampleSelector'; // already inside ToolShell
import { PhiMaskToggle } from './PhiMaskToggle';
import { ValidationPanel } from './ValidationPanel';
import { EdiTreeView } from './EdiTreeView';
import { STORY_MODE_FLOWS } from '../../data/ediStoryFlows';

// Inside a tool:
<ToolShell
  selectedSampleId={sampleId}
  onSelectSample={setSampleId}
  isPhiMasked={isPhiMasked}
  onTogglePhiMask={setIsPhiMasked}
  leftPaneContent={<CodeEditor ... />}
  rightPaneContent={<pre>...</pre>}
  bottomContent={<ValidationPanel issues={issues} />}
  statusBarMetrics={{ segmentCount, complianceStatus: 'valid' }}
/>
```

See also: [EDI_UX_Modernization_Guide.md](./EDI_UX_Modernization_Guide.md)
