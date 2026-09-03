# Codepackr — Content & Polish Fix Prompt

Paste this into your AI coding assistant (Claude Code, etc.) against the codepackr repo.

---

## Context for the assistant

```
This is Codepackr (codepackr.com) — a static site of 40+ free, client-side
developer tools. Every tool page currently uses IDENTICAL templated
"How to use" and FAQ content, e.g.:

  How to use:
  1. Enter or paste the content you want to process.
  2. Choose the relevant action or options.
  3. Review and copy or download the result.

  FAQ:
  Is this tool free? Yes.
  Is my data uploaded? No.

This is templated boilerplate repeated near-identically across every page.
Search engines (and Google's helpful-content systems especially) detect
this kind of near-duplicate content across a site and it hurts rankings
rather than helping — generic content is worse than no content here.

Fix this on every tool page.
```

---

## 1. Rewrite "How to use" per tool (highest priority)

```
For EVERY tool page on the site, replace the generic 3-step "How to use"
section with genuine, tool-specific steps. Inspect each tool's actual
inputs/outputs/options and write 3-5 steps that describe that specific
tool's real workflow — not generic "enter content, choose options, copy
result" language.

Examples of the level of specificity required:

- Case Converter:
  1. Paste your variable name, string, or block of text.
  2. Choose a target case: camelCase, snake_case, kebab-case, PascalCase,
     or CONSTANT_CASE.
  3. Copy the converted result, or convert another string.

- JWT Encoder:
  1. Enter your JWT payload as JSON (claims like sub, exp, iat).
  2. Choose HS256 and enter your signing secret.
  3. Click generate to produce the signed token.
  4. Copy the token or decode it back to verify.

- Cron Expression:
  1. Enter a cron expression (e.g. 0 9 * * 1-5) or build one field by field.
  2. Read the plain-English explanation of the schedule.
  3. Review the next 5 scheduled run times.

Do this for all ~40 tool pages — go through the actual tool logic/UI for
each page to write accurate, specific steps rather than reusing language
across tools.
```

---

## 2. Rewrite FAQ per tool

```
For EVERY tool page, replace the generic 2-question FAQ ("Is this tool
free?" / "Is my data uploaded?") with 2-4 questions specific to that
tool's actual functionality, edge cases, or common user questions.

Examples:

- Case Converter FAQ:
  - Does this handle acronyms correctly (e.g. "APIResponse")?
  - Can I convert multiple lines or a whole file at once?
  - What's the difference between snake_case and kebab-case?

- JSON Diff FAQ:
  - Does key order matter in the comparison?
  - Can I compare deeply nested objects and arrays?
  - How are added vs. removed vs. changed values shown?

- EDI X12 Formatter FAQ:
  - Which X12 transaction sets are supported (850, 810, 856, etc.)?
  - Does this validate segment structure or just format it?
  - Can I paste a full EDI file or only individual segments?

Keep the "Is this tool free?" and "Is my data uploaded?" questions ONLY
if genuinely relevant to that tool (e.g. for image-processing or
larger-file tools where privacy is a bigger concern) — otherwise drop
them in favor of tool-specific questions. Do this for all ~40 tool pages.
```

---

## 3. Related tools block (verify/add)

```
Check whether a "Related tools" section already exists at the bottom of
tool pages (above the full site-wide category list). If missing, add one:
3-5 links to tools in the same category or commonly used together, e.g.:

- Case Converter -> Slugify, Text Tools, Snake/Kebab related converters
- JSON Formatter -> JSON Validator, JSON to XML, JSON Path Tester
- JWT Decoder -> JWT Encoder, Base64 Encoder, Hash Generator

Place it between the FAQ section and the full sitewide tool list that
already appears on every page.
```

---

## 4. Homepage search/filter bar (verify/add)

```
Check whether the homepage has a live search/filter bar for the tool
list. If missing, add one: a text input at the top of the homepage that
filters the visible tool list in real time as the user types, matching
against tool name and category. No page reload. With 40+ tools now
listed, this is now a priority — the current flat category list is long
to scan manually.
```

---

## 5. Structured data check (verify/add)

```
Check the page source of a few tool pages for JSON-LD structured data
using schema.org SoftwareApplication (or WebApplication) type. If
missing, add it to every tool page with: name, description,
applicationCategory, and offers (price: 0), matching that page's
specific tool name/description already used in its meta tags.
```

---

## Execution order

1. Content rewrite (How to use + FAQ) — do this first, it's the biggest current problem, tool by tool
2. Related tools block — verify or add
3. Homepage search/filter bar — verify or add
4. Structured data (JSON-LD) — verify or add

## Required for every change in this pass

```
After completing the work:

1. Run/build the site locally and verify no broken pages, links, or
   console errors before considering any page done.
2. Spot-check at least 5 tool pages across different categories
   (formatter, encoder, converter, EDI, utility) to confirm the new
   How to use/FAQ content is genuinely distinct per page, not just
   reworded boilerplate.
3. List every file changed or added, grouped by category (content
   updates vs. new sitewide features), so I can review the diff before
   pushing to the repo.
```
