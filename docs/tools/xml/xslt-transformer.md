# 📐 XSLT Transformer & Tester

> Execute XSLT 1.0/2.0 transformations with source XML, stylesheets, live preview, and EDI XML presets.

**Category:** [XML & XSD Tools](../README.md#xml) &nbsp;·&nbsp; **Tool page:** `/xslt-transformer` &nbsp;·&nbsp; **Runs 100% in your browser:** Yes &nbsp;·&nbsp; **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

XSLT is a language for transforming one XML document into a different XML (or HTML, or text) document, using a separate "stylesheet" of rules. This tool runs a real XSLT transformation (1.0/2.0) against your source XML and stylesheet, showing you the transformed output live, without needing to install any XML tooling — including ready-made presets for converting EDI-flavored XML.

## 🙋 Who is this for, and when do I need it?

- You're building or debugging a data mapping between two XML formats (e.g. converting a partner's XML invoice into your internal format).
- You want to render an XML document as human-readable HTML using an XSLT stylesheet.

## ✨ What it can do

- Runs real XSLT 1.0 and 2.0 transformations directly in the browser.
- Live preview of the transformed output as you edit the stylesheet.
- Includes ready-made presets for common EDI-to-XML transformation patterns.
- Supports XML, HTML, or plain-text output depending on your stylesheet.

## 📝 Step-by-step: how to use the XSLT Transformer & Tester

1. Paste your source XML document.
2. Paste or write your XSLT stylesheet (or start from an EDI XML preset).
3. Run the transformation and review the live output.
4. Copy or download the transformed result.

### 💡 Worked example

**Scenario:** Transforming an order into a simple HTML summary:

**You paste in:**
```
XML: <order><id>1001</id></order>  +  an XSLT template that outputs <p>Order #<value-of select="id"/></p>
```

**You get back:**
```
<p>Order #1001</p>
```

## ⚠️ Common mistakes & troubleshooting

- XSLT 1.0 and 2.0 support different functions — a stylesheet written for 2.0 (like string manipulation functions) will fail or behave differently under a 1.0-only processor. Confirm which version your production pipeline actually uses.

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## 🔗 Also searchable as

`xslt`, `xml`, `transform`, `stylesheet`, `xpath`, `canonical`, `edi-to-xml`, `edi`, `html`

---

_Part of the [CodePackr tool documentation](../README.md). Last generated: 2026-09-15. See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the tool changes._
