# 📦 AS2 Message Encoder, Decoder & MDN Generator

> Package, sign, encrypt, and inspect AS2 messages (RFC 4130) and generate or verify MDN receipts and MIC hashes.

**Category:** [EDI Integration Hub](../README.md#edi) &nbsp;·&nbsp; **Tool page:** `/as2-tools` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

AS2 is the standard secure protocol most EDI trading partners use to actually transmit files to each other over the internet (with encryption, digital signatures, and MDN receipts). This tool suite lets you build and inspect AS2 messages: encode a payload into an AS2 message (with simulated signing/encryption), decode a received AS2 message back to its original content, and generate a matching MDN (Message Disposition Notification) — the AS2 equivalent of a delivery receipt.

## 🙋 Who is this for, and when do I need it?

- You're setting up a new AS2 connection with a trading partner and want to understand the message format before configuring your real AS2 software (like Mendelson, IBM Sterling, or Cleo).
- You're troubleshooting why a partner says they never received your AS2 transmission, and want to inspect the MDN receipt you got back.

## ✨ What it can do

- Encodes a payload into a simulated AS2 message structure with headers and MIME packaging.
- Decodes a received AS2 message back into its original payload for inspection.
- Generates matching MDN (Message Disposition Notification) receipts.

## 📝 Step-by-step: how to use the AS2 Message Encoder, Decoder & MDN Generator

1. Choose Encode, Decode, or Generate MDN.
2. Paste your payload (for encoding) or your received AS2 message (for decoding).
3. Review the resulting AS2 message structure, headers, and/or MDN receipt.
4. Use the output to understand or troubleshoot your real AS2 connector's behavior.

### 💡 Worked example

**Scenario:** Generating an MDN acknowledging successful receipt of a message:

**You paste in:**
```
A received AS2 message with Message-ID <20260301120000@yourcompany.com>
```

**You get back:**
```
An MDN referencing that same Message-ID with a disposition of 'automatic-action/MDN-sent-automatically; processed', confirming successful receipt.
```

## ⚠️ Common mistakes & troubleshooting

- This tool simulates AS2 message structure for learning, testing, and troubleshooting — it does not replace a real, certified AS2 connector for actual production transmission (real AS2 requires exchanging live certificates with your trading partner).

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## ❓ Frequently asked questions

**Is my data or code sent to an external server when using AS2 Message Encoder, Decoder & MDN Generator?**

No. All operations in AS2 Message Encoder, Decoder & MDN Generator execute 100% client-side in your web browser. Your source code, tokens, queries, and files never leave your computer or get transmitted to any remote server.

**Can I use AS2 Message Encoder, Decoder & MDN Generator offline without an internet connection?**

Yes. Codepackr is engineered as a Progressive Web App (PWA) with service-worker caching. Once loaded in your browser, you can continue using AS2 Message Encoder, Decoder & MDN Generator offline.

**Are there any usage limits, fees, or account registrations required?**

No. All developer tools on Codepackr are 100% free to use. There are no daily quotas, paywalls, or account sign-up requirements.

**How does AS2 Message Encoder, Decoder & MDN Generator handle large files or sensitive data?**

Because execution happens locally in your browser using modern Web APIs and V8 JavaScript engine optimizations, you get maximum privacy and low latency without network transfer limits.

## 🔗 Also searchable as

`as2`, `mdn`, `encoder`, `decoder`, `edi`, `smime`, `rfc4130`, `mic`, `receipt`, `pkcs7`, `headers`, `walmart`, `b2b`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
