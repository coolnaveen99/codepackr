# 📦 EDI Hierarchical Schema Viewer & Element Lookup

> Explore ANSI X12 loop hierarchies (Header, PO1, HL, Summary), element positions (BEG01, PO102), and code-list definitions with synchronized raw text highlighting.

**Category:** [EDI Integration Hub](../README.md#edi) &nbsp;·&nbsp; **Tool page:** `/edi-schema-viewer` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

EDI standards (X12, EDIFACT) define exactly which segments and elements are allowed inside each transaction type (like an 850 Purchase Order or an 856 Advance Ship Notice), and what each individual code means (e.g. element `BEG02` = 'Purchase Order Type Code', where value `NE` means 'New Order'). This tool is a searchable, hierarchical browser of that entire rulebook — pick a transaction set and drill down into its segments, loops, and element definitions.

## 🙋 Who is this for, and when do I need it?

- You're mapping a new transaction type and need to know what each segment/element actually represents.
- You're reading a raw EDI file and want to look up what an unfamiliar code (like a qualifier value) means.

## ✨ What it can do

- Searchable, hierarchical browser of X12 and EDIFACT transaction set definitions.
- Drill down from a transaction set (e.g. 850) into its segments, loops, and individual elements.
- Plain-English descriptions and common code/qualifier values for each element.
- Covers multiple standard versions (e.g. X12 4010/5010, EDIFACT D96A/D01B).

## 📝 Step-by-step: how to use the EDI Hierarchical Schema Viewer & Element Lookup

1. Pick a transaction set (e.g. 850, 810, 856) or EDIFACT message (e.g. ORDERS).
2. Browse or search its segment list.
3. Click a segment to expand its elements and see plain-English definitions and common codes.
4. Use this alongside a real message in the EDI Segment Viewer to look up unfamiliar codes.

### 💡 Worked example

**Scenario:** Looking up what the BEG segment means in an 850 Purchase Order:

**You paste in:**
```
Transaction: 850, Segment: BEG
```

**You get back:**
```
BEG — Beginning Segment for Purchase Order. BEG01: Transaction Set Purpose Code (00=Original). BEG02: Purchase Order Type Code (NE=New Order, CN=Change...). BEG03: Purchase Order Number.
```

## ⚠️ Common mistakes & troubleshooting

- Real trading partners often customize the 'standard' in their own implementation guide — always cross-check this general reference against your specific partner's implementation guide before finalizing a mapping.

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## ❓ Frequently asked questions

**Is my data or code sent to an external server when using EDI Hierarchical Schema Viewer & Element Lookup?**

No. All operations in EDI Hierarchical Schema Viewer & Element Lookup execute 100% client-side in your web browser. Your source code, tokens, queries, and files never leave your computer or get transmitted to any remote server.

**Can I use EDI Hierarchical Schema Viewer & Element Lookup offline without an internet connection?**

Yes. Codepackr is engineered as a Progressive Web App (PWA) with service-worker caching. Once loaded in your browser, you can continue using EDI Hierarchical Schema Viewer & Element Lookup offline.

**Are there any usage limits, fees, or account registrations required?**

No. All developer tools on Codepackr are 100% free to use. There are no daily quotas, paywalls, or account sign-up requirements.

**How does EDI Hierarchical Schema Viewer & Element Lookup handle large files or sensitive data?**

Because execution happens locally in your browser using modern Web APIs and V8 JavaScript engine optimizations, you get maximum privacy and low latency without network transfer limits.

## 🔗 Also searchable as

`edi schema`, `schema viewer`, `element lookup`, `edi tree`, `loop hierarchy`, `hl loop`, `code list`, `ansi x12 dictionary`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
