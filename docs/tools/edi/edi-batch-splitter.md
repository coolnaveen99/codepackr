# 📦 EDI Batch Splitter & Joiner

> Split multi-transaction EDI files by Functional Group (GS/GE), Transaction Set (ST/SE), or PO/Claim filters, or merge multiple files with auto-recalculated envelopes.

**Category:** [EDI Integration Hub](../README.md#edi) &nbsp;·&nbsp; **Tool page:** `/edi-batch-splitter` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

A single EDI file transmission can contain many individual transactions bundled together (multiple ST...SE transaction sets inside one interchange). This tool splits a large batch file into separate, individually valid files — one per transaction, or grouped/chunked in configurable batches — and can also do the reverse: join many individual transaction files back into one combined batch for transmission.

## 🙋 Who is this for, and when do I need it?

- You received one giant EDI file containing hundreds of individual orders and need to process them one at a time.
- You have many small EDI files ready to send and need to combine them into fewer, larger transmissions for efficiency.

## ✨ What it can do

- Splits a multi-transaction EDI batch into individually valid, independently enveloped files.
- Supports splitting by transaction, by a filter query, or by grouping/chunking N transactions per file.
- Join mode combines many individual transaction files back into one batch transmission.
- Recognizes common reference identifiers (PO number, invoice number, ASN number) to help name split files.

## 📝 Step-by-step: how to use the EDI Batch Splitter & Joiner

1. Choose Split (one big file → many) or Join (many files → one batch).
2. For Split: paste the batch file, optionally filter or group by functional code, and set a chunk size.
3. For Join: paste each individual transaction to combine.
4. Review and download the resulting file(s).

### 💡 Worked example

**Scenario:** Splitting a batch of 3 purchase orders into individual files:

**You paste in:**
```
One interchange containing three ST*850...SE blocks (PO123, PO124, PO125)
```

**You get back:**
```
Three separate, individually enveloped files: PO123.edi, PO124.edi, PO125.edi — each independently valid and identifiable by its PO number.
```

## ⚠️ Common mistakes & troubleshooting

- When splitting, remember each individual output file still needs a valid envelope (ISA/GS...GE/IEA) of its own to be usable standalone — this tool handles that automatically, but double-check if you're scripting around it.

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## 🔗 Also searchable as

`edi splitter`, `edi batch`, `edi joiner`, `split x12`, `merge edi`, `split 850`, `claim extractor`, `edi multi transaction`, `reenveloping`, `gs ge split`, `st se split`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
