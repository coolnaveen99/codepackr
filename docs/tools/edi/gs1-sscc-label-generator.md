# 📦 GS1-128 / SSCC-18 Label Generator

> Generate GS1-128 compliant SSCC-18 shipping labels with GTIN, quantity, batch, and expiration Application Identifiers, and sync them into your 856 ASN.

**Category:** [EDI Integration Hub](../README.md#edi) &nbsp;·&nbsp; **Tool page:** `/gs1-sscc-label-generator` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

GS1-128 and SSCC-18 are the barcode standards printed on shipping labels and pallets worldwide — the SSCC-18 (Serial Shipping Container Code) is an 18-digit number that uniquely identifies one specific physical shipment/pallet, encoded into a GS1-128 barcode alongside other data (like quantity, batch number, or ship date) using standardized "Application Identifiers" (AIs). This tool generates a valid SSCC-18 (including the correct check digit) and renders the corresponding scannable GS1-128 barcode label.

## 🙋 Who is this for, and when do I need it?

- You're preparing shipping/pallet labels for a warehouse or logistics partner that requires GS1-128 compliant barcodes.
- You need to generate a valid SSCC-18 number with a correctly calculated check digit for a shipment.

## ✨ What it can do

- Calculates a valid SSCC-18 (Serial Shipping Container Code) including the correct check digit.
- Encodes the SSCC-18, plus optional GTIN, quantity, batch, and expiration data, using standard GS1 Application Identifiers.
- Renders a scannable GS1-128 barcode label ready to print or export.

## 📝 Step-by-step: how to use the GS1-128 / SSCC-18 Label Generator

1. Enter your GS1 company prefix, extension digit, and serial reference.
2. Optionally add GTIN, quantity, batch/lot number, or expiration date.
3. Generate the SSCC-18 and its scannable GS1-128 barcode label.
4. Download or print the label, or copy the SSCC-18 into your 856 ASN.

### 💡 Worked example

**Scenario:** Generating an SSCC-18 for a pallet shipment:

**You paste in:**
```
Extension digit: 3, Company prefix: 0614141, Serial reference: 12345678
```

**You get back:**
```
SSCC-18: 300614141123456785 (last digit is the calculated check digit), rendered as a scannable GS1-128 barcode with AI (00).
```

## ⚠️ Common mistakes & troubleshooting

- The check digit is calculated, not chosen — if you're hand-typing an SSCC-18 elsewhere and it doesn't match what this tool generates, double check you copied every digit exactly, since a single wrong digit produces an invalid code.

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## ❓ Frequently asked questions

**Is my data or code sent to an external server when using GS1-128 / SSCC-18 Label Generator?**

No. All operations in GS1-128 / SSCC-18 Label Generator execute 100% client-side in your web browser. Your source code, tokens, queries, and files never leave your computer or get transmitted to any remote server.

**Can I use GS1-128 / SSCC-18 Label Generator offline without an internet connection?**

Yes. Codepackr is engineered as a Progressive Web App (PWA) with service-worker caching. Once loaded in your browser, you can continue using GS1-128 / SSCC-18 Label Generator offline.

**Are there any usage limits, fees, or account registrations required?**

No. All developer tools on Codepackr are 100% free to use. There are no daily quotas, paywalls, or account sign-up requirements.

**How does GS1-128 / SSCC-18 Label Generator handle large files or sensitive data?**

Because execution happens locally in your browser using modern Web APIs and V8 JavaScript engine optimizations, you get maximum privacy and low latency without network transfer limits.

## 🔗 Also searchable as

`gs1`, `gs1-128`, `sscc`, `sscc-18`, `barcode`, `shipping label`, `ucc-128`, `asn`, `856`, `gtin`, `application identifier`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
