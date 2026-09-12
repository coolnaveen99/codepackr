# EDI Tools Bugfixes & Hardening (2026-09-12)

## Context

Tediware publicly compared Codepackr's EDI to JSON output against their own converter and labeled Codepackr's result as **incorrect, incomplete**.

Their example used a complex real-world ANSI X12 850 Purchase Order containing:
- Multiple REF segments
- PER contact
- FOB terms
- ITD payment terms
- DTM required-by date
- N9 + MSG free-text notes
- Multi-line N3 address (Suite 1400)
- Multiple product IDs on PO1 (SK / VN / UP)
- PO4 physical details (pack, weight, dimensions)

Codepackr's **Semantic** mode produces a clean business-object model (intentionally not a 1:1 segment dump). Comparing it side-by-side with a fully annotated segment dump made the Semantic output look incomplete.

## Root Cause

1. Semantic mode was missing or weakly representing several common 850 constructs.
2. UI did not clearly communicate that **Semantic is not a lossless segment dump**.
3. Fidelity test suite did not cover a complex real-world 850 of this shape.

## Changes Made

### 1. Semantic Converter Improvements (`src/components/tools/EdiToolsView.tsx`)

#### Multi-line address support (N3)
- Previously: address lines were joined into a single string.
- Now: preserved as `addressLines: string[]` and kept as a legacy `address` string for backward compatibility.
- Result: Suite / Building / Floor information is no longer lost.

#### N9 + MSG message loops
- Previously: standalone MSG / NTE were collected as plain strings; N9 was largely ignored.
- Now: N9 starts a structured entry containing qualifier, reference, freeFormDescription, and messages array (all following consecutive MSG segments).
- Standalone MSG/NTE still collected when not under an N9.

#### PO4 physical details on line items
- New physicalDetails object on each line item: pack, size, uomPack, packagingCode, weightQualifier, grossWeightPerPack, weightUom, length, width, height, dimensionUom.
- Critical for many retail / wholesale 850s that carry pack and dimensional data.

#### Existing strengths retained
- Multiple product IDs on PO1 already supported via productIds[] + productIdMap.
- Header-level REF, PER, DTM, ITD, FOB, SAC already captured.
- Currency kept as object { code, entityIdentifier } (no hardcoded USD).
- No fabricated defaults (no forced 004010, EA, etc.).

### 2. UI Clarity - JSON Schema Mode Labels

Updated the three mode descriptions:

| Mode | New Label | New Description |
|------|-----------|-----------------|
| semantic | Semantic Business Model | Clean business objects (PO, parties, items, terms). Ideal for apps. Not a 1:1 segment dump. |
| segmentArray | Segment Array (Lossless) | Every segment and element preserved in order. Use this for full fidelity / audit / comparison. |
| loops | Hierarchical Loop Schema | Header to Detail loops (PO1/HL) to Summary. Structural view of X12 loops. |

Added an explicit tip under the mode selector directing users to Segment Array for complete segment-level fidelity.

### 3. Fidelity Test Suite (`scripts/test-edi-fidelity.mjs`)

Added TEST 5 - Complex real-world style 850 covering REF x4, PER, FOB, ITD, DTM, N9+MSG, multi-line N3, multi-product-ID PO1, and PO4. Assertions verify zero data loss.

## Files Modified

- src/components/tools/EdiToolsView.tsx
- scripts/test-edi-fidelity.mjs
- bugfixes.md (this document)

## Outcome

Semantic mode is richer. Segment Array remains the authoritative lossless representation. UI makes design intent unmistakable. Automated tests lock the behavior in place.

---

*Document created 2026-09-12 as part of the response to the public EDI to JSON comparison.*
