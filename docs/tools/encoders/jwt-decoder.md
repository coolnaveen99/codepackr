# 🔐 JWT Decoder

> Decode and inspect JSON Web Token header, payload, expiry, and claims.

**Category:** [Encoders](../README.md#encoders) &nbsp;·&nbsp; **Tool page:** `/jwt-decoder` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

A JWT (JSON Web Token) is a compact, three-part string (`header.payload.signature`) commonly used to represent a logged-in user or an API session. This tool splits a JWT apart and decodes the header and payload sections back into readable JSON, so you can see who the token says it belongs to, what permissions ('claims') it grants, and when it expires.

## 🙋 Who is this for, and when do I need it?

- You're debugging "why am I logged out" and want to check a token's expiry (`exp`) claim.
- You want to see what data (claims) an API's auth token actually contains.

## ✨ What it can do

- High-speed encoding and decoding for JWT Decoder with zero latency.
- Support for UTF-8 character sets, binary buffers, and multi-line strings.
- Cryptographically secure local processing using modern Web Crypto APIs.
- Instant validation and format error diagnostics.
- One-click copy to clipboard and local file export.

## 📝 Step-by-step: how to use the JWT Decoder

1. Input your plain text, string, or secret key into the input field.
2. Choose your desired encoding/decoding mode or hashing algorithm.
3. View the generated output immediately as you type.
4. Copy the resulting hash, token, or encoded string with a single click.

### 💡 Worked example

**Scenario:** Decoding a JWT's payload section:

**You paste in:**
```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6IkFzaGEifQ.signature-part
```

**You get back:**
```
{
  "sub": "1234",
  "name": "Asha"
}
```

## ⚠️ Common mistakes & troubleshooting

- Decoding a JWT does NOT verify it's genuine — anyone can read the contents of a JWT without knowing the secret key. Verifying the signature requires the correct secret/public key.
- Never paste a real production access token into any third-party tool if you're not sure how it's processed — this tool runs 100% locally in your browser, but always be cautious with live credentials in general.

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## ❓ Frequently asked questions

**Is my data or code sent to an external server when using JWT Decoder?**

No. All operations in JWT Decoder execute 100% client-side in your web browser. Your source code, tokens, queries, and files never leave your computer or get transmitted to any remote server.

**Can I use JWT Decoder offline without an internet connection?**

Yes. Codepackr is engineered as a Progressive Web App (PWA) with service-worker caching. Once loaded in your browser, you can continue using JWT Decoder offline.

**Are there any usage limits, fees, or account registrations required?**

No. All developer tools on Codepackr are 100% free to use. There are no daily quotas, paywalls, or account sign-up requirements.

**How does JWT Decoder handle large files or sensitive data?**

Because execution happens locally in your browser using modern Web APIs and V8 JavaScript engine optimizations, you get maximum privacy and low latency without network transfer limits.

## 🔗 Also searchable as

`jwt`, `token`, `decode`, `json web token`, `auth`, `bearer`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
