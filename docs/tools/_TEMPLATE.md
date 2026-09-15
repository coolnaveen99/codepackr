<!--
  TEMPLATE — do not link to this file from the README.
  Copy this structure when writing or regenerating a tool doc.
  An AI agent updating docs (see .github/skills/update-tool-docs.md) should
  follow this exact section order and tone.

  Voice & rules:
  - Write for a layman: no unexplained jargon. If you must use a technical term
    (JWT, XSD, ISA segment...), explain it in one clause the first time, or link
    to /docs/tools/GLOSSARY.md.
  - Use a real, concrete, worked example with actual input -> actual output.
    Never say "e.g. some JSON" — write the literal JSON.
  - Keep opinions out of "What it can do" (pull from src/data/toolMetadata.json
    `features`/`howToUse`/`faqs` where they exist) but keep "What is this" and
    "Common mistakes" in your own plain words.
  - One tool = one file. File path: docs/tools/<category>/<tool-id>.md
    (must match the `category` and `id` fields in src/data/tools.ts exactly).
-->

# {emoji} {Tool Name}

> {One-sentence description — reuse `description` from src/data/tools.ts}

**Category:** [{Category Label}](README.md#{category}) · **Tool page:** `{canonicalPath}` · **Runs 100% in your browser:** Yes · **Data ever sent to a server:** No

---

## 🧠 What is this, in plain English?

{2-5 sentences. Use an analogy if it helps. Assume the reader has never heard of this
concept before. Explain *why* someone would need this, not just what button does what.}

## 🙋 Who is this for, and when do I need it?

- {A concrete situation someone finds themselves in}
- {Another concrete situation}
- {A third, if useful}

## ✨ What it can do

- {feature from toolMetadata.json, reworded to be readable if needed}
- {feature}
- {feature}

## 📝 Step-by-step: how to use the {Tool Name}

1. {Step — imperative, concrete}
2. {Step}
3. {Step}
4. {Step}

### 💡 Worked example

**Scenario:** {one line setting up a realistic situation}

**You paste in:**
```
{literal example input}
```

**You get back:**
```
{literal example output}
```

## ⚠️ Common mistakes & troubleshooting

- {A real mistake a beginner makes, and how to avoid/fix it}
- {Another}

## 🔒 Privacy note

Everything above happens locally in your browser. Whatever you paste into this tool
is never uploaded, logged, or stored on a remote server — closing the tab clears it.

## ❓ Frequently asked questions

**{Question}**

{Answer}

## 🔗 Also searchable as

{comma-separated `keywords` from src/data/tools.ts, each in backticks}

---

_Part of the [CodePackr tool documentation](README.md). Last generated: {date}.
See `.github/skills/update-tool-docs.md` for how to keep this page in sync when the
tool changes._
