# 📦 EDI Syntax & Envelope Validator

> Validate ISA/IEA, GS/GE, and ST/SE envelope pairing, control numbers, and segment counts.

**Category:** [EDI Integration Hub](../README.md#edi) &nbsp;·&nbsp; **Tool page:** `/edi-validator` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

Checks a raw EDI message's structural integrity: does the envelope open and close correctly (ISA...IEA, GS...GE, ST...SE), do the control numbers match between the opening and closing segments, are segment terminators and element separators used consistently, and are required segments present. It reports every rule violation with a clear description.

## 🙋 Who is this for, and when do I need it?

- You're about to send an EDI file to a trading partner and want to catch envelope errors before they reject the transmission.
- A partner rejected your file and you need to quickly pinpoint exactly which control number or segment is wrong.

## ✨ What it can do

- Checks envelope integrity: matching ISA/IEA, GS/GE, and ST/SE control numbers.
- Flags missing required segments and out-of-sequence segments.
- Reports every issue with a plain-English explanation and the exact segment location.

## 📝 Step-by-step: how to use the EDI Syntax & Envelope Validator

1. Paste the raw EDI message you want to check.
2. Run validation and review the list of errors/warnings, each pointing to a specific segment.
3. Fix the issues in your source system and re-paste to confirm they're resolved.

### 💡 Worked example

**Scenario:** Validating a message with mismatched control numbers:

**You paste in:**
```
ISA...*000000001~ ... IEA*1*000000002~ (ISA control number 000000001 doesn't match IEA's 000000002)
```

**You get back:**
```
❌ Error: ISA13 control number '000000001' does not match IEA02 '000000002' — envelope control numbers must match exactly.
```

## ⚠️ Common mistakes & troubleshooting

- This validates general X12/EDIFACT structural rules — it does not know your specific trading partner's custom implementation guide requirements (like which fields they made mandatory beyond the standard).

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## ❓ Frequently asked questions

**Is my data or code sent to an external server when using EDI Syntax & Envelope Validator?**

No. All operations in EDI Syntax & Envelope Validator execute 100% client-side in your web browser. Your source code, tokens, queries, and files never leave your computer or get transmitted to any remote server.

**Can I use EDI Syntax & Envelope Validator offline without an internet connection?**

Yes. Codepackr is engineered as a Progressive Web App (PWA) with service-worker caching. Once loaded in your browser, you can continue using EDI Syntax & Envelope Validator offline.

**Are there any usage limits, fees, or account registrations required?**

No. All developer tools on Codepackr are 100% free to use. There are no daily quotas, paywalls, or account sign-up requirements.

**How does EDI Syntax & Envelope Validator handle large files or sensitive data?**

Because execution happens locally in your browser using modern Web APIs and V8 JavaScript engine optimizations, you get maximum privacy and low latency without network transfer limits.

## 🔗 Also searchable as

`edi`, `validator`, `compliance`, `x12`, `envelope`, `audit`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
