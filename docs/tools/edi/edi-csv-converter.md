# 📦 EDI to CSV & CSV to EDI Converter

> Convert ANSI X12 and EDIFACT messages into flattened CSV or Excel spreadsheets, or generate compliant EDI 850/810 documents directly from spreadsheet tables.

**Category:** [EDI Integration Hub](../README.md#edi) &nbsp;·&nbsp; **Tool page:** `/edi-csv-converter` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

Converts raw EDI messages into a flat, spreadsheet-friendly CSV table (one row per segment, or a smart summary table for common transaction types with recognized fields like PO number, line items, and quantities), and can also generate EDI from a correctly-shaped CSV going the other way.

## 🙋 Who is this for, and when do I need it?

- A business user (not a developer) needs to review EDI order data in Excel instead of raw text.
- You're bulk-loading many historical EDI messages into a spreadsheet for reporting or auditing.

## ✨ What it can do

- Converts raw EDI messages into a flat, spreadsheet-ready CSV table.
- Smart-summary mode recognizes common fields (PO number, line items, quantities) for common transaction sets.
- Raw segment matrix mode preserves every segment/element exactly, for lossless round-tripping.
- Converts a correctly-shaped CSV back into valid EDI.

## 📝 Step-by-step: how to use the EDI to CSV & CSV to EDI Converter

1. Paste your raw EDI message (EDI → CSV) or upload/paste a CSV table (CSV → EDI).
2. Choose Smart Summary (readable) or Raw Segment Matrix (lossless) output mode.
3. Review the generated table or EDI output.
4. Copy or download the result.

### 💡 Worked example

**Scenario:** Converting a purchase order's line items into a CSV table:

**You paste in:**
```
PO1*1*10*EA*25.00**VN*SKU-100~PO1*2*5*EA*12.50**VN*SKU-200~
```

**You get back:**
```
Line,Qty,Unit,Price,SKU\n1,10,EA,25.00,SKU-100\n2,5,EA,12.50,SKU-200
```

## ⚠️ Common mistakes & troubleshooting

- A single flat CSV row struggles to represent deeply nested EDI structures (like multiple loops within loops) — the 'raw segment matrix' export mode preserves everything exactly, while the 'smart summary' mode is easier to read but only recognizes common fields.

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## 🔗 Also searchable as

`edi to csv`, `csv to edi`, `edi excel`, `edi spreadsheet`, `convert edi to excel`, `export edi csv`, `x12 to csv`, `850 to csv`, `po to csv`, `edi table`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
