# 📦 EDI Segment Viewer

> Inspect EDI segments, drill down into element positions (ISA01-16), and search data.

**Category:** [EDI Integration Hub](../README.md#edi) &nbsp;·&nbsp; **Tool page:** `/edi-segment-viewer` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

A lighter, focused companion to the Schema Viewer: paste a real EDI message and it breaks the message down segment by segment, labeling each one (ISA, GS, ST, BEG, N1, PO1, SE, GE, IEA...) with a plain-English description of its purpose, right next to your actual data.

## 🙋 Who is this for, and when do I need it?

- You're new to EDI and want to understand what each line of a real message you're looking at actually means.
- You're debugging a specific message and want quick, inline labels rather than switching to a separate reference page.

## ✨ What it can do

- Paste a real EDI message and see every segment labeled in plain English inline.
- Highlights the envelope structure (ISA/GS/ST ... SE/GE/IEA) alongside business segments.
- No need to memorize segment codes — definitions appear next to your actual data.

## 📝 Step-by-step: how to use the EDI Segment Viewer

1. Paste your raw EDI message into the workspace.
2. The tool splits it into segments and labels each one with its name and purpose.
3. Click any segment to see element-by-element definitions for that specific line.
4. Use this to quickly orient yourself in an unfamiliar message.

### 💡 Worked example

**Scenario:** Viewing a segment from a real message:

**You paste in:**
```
N1*ST*Acme Corp*92*12345
```

**You get back:**
```
N1 = Name segment. N101 'ST' = Ship To entity code. N102 = Name ('Acme Corp'). N103 '92' = Identification Code Qualifier (Assigned by Buyer). N104 = the actual ID '12345'.
```

## ⚠️ Common mistakes & troubleshooting

- Qualifier codes (like the '92' above) can mean different things depending on which segment they appear in — always read the segment ID together with its position, not the qualifier value alone.

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## ❓ Frequently asked questions

**Is my data or code sent to an external server when using EDI Segment Viewer?**

No. All operations in EDI Segment Viewer execute 100% client-side in your web browser. Your source code, tokens, queries, and files never leave your computer or get transmitted to any remote server.

**Can I use EDI Segment Viewer offline without an internet connection?**

Yes. Codepackr is engineered as a Progressive Web App (PWA) with service-worker caching. Once loaded in your browser, you can continue using EDI Segment Viewer offline.

**Are there any usage limits, fees, or account registrations required?**

No. All developer tools on Codepackr are 100% free to use. There are no daily quotas, paywalls, or account sign-up requirements.

**How does EDI Segment Viewer handle large files or sensitive data?**

Because execution happens locally in your browser using modern Web APIs and V8 JavaScript engine optimizations, you get maximum privacy and low latency without network transfer limits.

## 🔗 Also searchable as

`edi`, `segment`, `viewer`, `inspector`, `isa`, `gs`, `st`, `x12`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
