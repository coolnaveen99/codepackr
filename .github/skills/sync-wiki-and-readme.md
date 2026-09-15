# Skill: Sync GitHub Wiki & README Documentation

This skill defines the standard operating procedure (SOP) for maintaining the repository's `README.md`, transforming docs into GitHub Wiki pages, and keeping both synchronized across `coolnaveen99/codepackr` and `coolnaveen99/codepackr-finance`.

---

## 1. Architecture & Synchronization Pipeline

Documentation is maintained in a three-tier system:

```text
[ docs/tools/** ]
       │
       ├──► 1. Local Generator (scripts/generate-tool-docs.py)
       │       Produces docs/tools/<category>/<tool-id>.md and docs/tools/README.md
       │
       ├──► 2. Wiki Sync Transformer (scripts/sync-wiki.mjs)
       │       Flattened pages, _Sidebar.md, _Footer.md, Home.md
       │       Pushed to coolnaveen99/<repo>.wiki.git via .github/workflows/sync-wiki.yml
       │
       └──► 3. Root README.md
               Badges, Live Links, Wiki Links, Emoji-Coded Directory, Copyright
```

---

## 2. GitHub Wiki Structure & Conventions

GitHub Wikis are distinct Git repositories (`https://github.com/<owner>/<repo>.wiki.git`).
The web UI displays a flat page hierarchy with custom sidebar navigation:

1. **`Home.md`**: The wiki home page (transformed from `docs/tools/README.md` with live site headers).
2. **`_Sidebar.md`**: Custom navigation menu displayed in the GitHub Wiki right sidebar.
   - Must group tools by category with `<details open><summary>` accordions.
   - Links to primers: `[EDI Basics](edi-basics)`, `[XML Basics](xml-basics)`, `[Glossary](glossary)`.
   - Links to individual tool pages using clean titles extracted from file headers.
3. **`_Footer.md`**: Persistent footer across all wiki pages linking to the live app and GitHub.
4. **Tool Pages**: Flattened filenames (`json-formatter.md`, `edi-validator.md`, etc.).
5. **Internal Links**: All markdown links between documents must be rewritten to flat wiki slugs:
   - `[JSON Formatter](formatters/json-formatter.md)` ➔ `[JSON Formatter](json-formatter)`
   - `[EDI Basics](edi/00-edi-basics.md)` ➔ `[EDI Basics](edi-basics)`
   - `[Glossary](GLOSSARY.md)` ➔ `[Glossary](glossary)`

---

## 3. Automated GitHub Actions Workflow (`.github/workflows/sync-wiki.yml`)

The wiki is automatically updated without manual terminal commands:

- **Trigger 1**: Push to `main` branch affecting `docs/**` or `scripts/sync-wiki.mjs`.
- **Trigger 2**: Manual dispatch (`workflow_dispatch`) from the GitHub Actions tab.
- **Action Steps**:
  1. Checks out main repository code.
  2. Checks out wiki repository (`${{ github.repository }}.wiki`) using `secrets.GITHUB_TOKEN`.
  3. Runs `node scripts/sync-wiki.mjs wiki`.
  4. Commits and pushes changes to `origin master`.

*Note: Requires `permissions: contents: write` and GitHub repository setting **Actions → General → Workflow permissions: "Read and write permissions"**.*

---

## 4. Root `README.md` Conventions

The root `README.md` must adhere to these standard guidelines:

1. **Top Badges**:
   - Live Application (`codepackr.com` / `finance.codepackr.com`)
   - Wiki Documentation (`github.com/<owner>/<repo>/wiki`)
   - Copyright (`© 2026 | All Rights Reserved`)
2. **Documentation & Wiki Hub**:
   - Direct links to the GitHub Wiki Knowledge Base, primers, glossary, and team guide.
3. **Categorized Emoji Directory**:
   - Grouped by functional category with clear emojis (🧹 Formatters, 🔐 Encoders, ✅ Validators, 🔁 Converters, 🖼️ Image Utilities, 📦 EDI Integration Hub, 📐 XML & XSD, 🧰 Utilities, ✍️ Text Tools).
   - Every tool links directly to its production URL on the live website.
4. **Build & CI/CD Documentation**:
   - Visual flowchart of PR checks, preview deployments, wiki sync, and IndexNow notifications.
5. **Copyright & Terms**:
   - Explicit proprietary copyright notice: `© 2026 CodePackr. All rights reserved.`
   - 100% privacy notice: No data logging or remote transmission.

---

## 5. Build Optimization & CI Ignore Policy

To prevent documentation updates from wasting Vercel and GitHub Actions build minutes:

1. **`vercel.json`**:
   Use the 99-character inline ignoreCommand to bypass builds when only docs or markdown change:
   ```json
   "ignoreCommand": "git diff --quiet HEAD^ HEAD -- . ':!docs' ':!.github' ':!*.md' ':!*.csv' ':!LICENSE' ':!.git*' ':!.n*'"
   ```
2. **`.github/workflows/ci.yml`**:
   Ensure `paths-ignore` includes:
   ```yaml
   paths-ignore:
     - '**.md'
     - 'docs/**'
     - 'public/*.csv'
     - 'public/*.png'
   ```
