import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_TOOLS_DIR = path.join(ROOT_DIR, 'docs', 'tools');

// Target directory can be passed as argument or default to wiki/
const targetDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT_DIR, 'wiki');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log(`[CodePackr Wiki Sync] Target directory: ${targetDir}`);

// Map of source relative path to destination wiki filename
// e.g. 'formatters/json-formatter.md' -> 'json-formatter.md'
const urlMap = new Map();

// Special pages
urlMap.set('edi/00-edi-basics.md', 'edi-basics.md');
urlMap.set('xml/00-xml-basics.md', 'xml-basics.md');
urlMap.set('GLOSSARY.md', 'glossary.md');
urlMap.set('README.md', 'Home.md');

// Scan all tool markdown files
const categories = fs.readdirSync(DOCS_TOOLS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const categoryTools = {};

for (const cat of categories) {
  const catDir = path.join(DOCS_TOOLS_DIR, cat);
  const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
  categoryTools[cat] = [];

  for (const file of files) {
    const relSource = `${cat}/${file}`;
    if (file === '00-edi-basics.md') {
      urlMap.set(relSource, 'edi-basics.md');
      continue;
    }
    if (file === '00-xml-basics.md') {
      urlMap.set(relSource, 'xml-basics.md');
      continue;
    }

    const wikiFilename = file; // flat name: json-formatter.md
    urlMap.set(relSource, wikiFilename);
    categoryTools[cat].push({
      file,
      wikiName: wikiFilename.replace(/\.md$/, ''),
      fullPath: path.join(catDir, file),
    });
  }
}

// Helper to rewrite internal links
function rewriteLinks(content) {
  let updated = content;

  // Replace relative markdown links like [Text](formatters/json-formatter.md) or (../formatters/json-formatter.md)
  // or (edi/00-edi-basics.md), (GLOSSARY.md), etc.
  for (const [sourceRel, targetWiki] of urlMap.entries()) {
    const wikiSlug = targetWiki.replace(/\.md$/, '');
    const sourceBase = path.basename(sourceRel);

    // Matches (sourceRel) or (./sourceRel) or (../sourceRel)
    const patterns = [
      new RegExp(`\\((?:\\.\\/|\\.\\.\\/)?${sourceRel.replace(/\./g, '\\.')}\\)`, 'g'),
      new RegExp(`\\((?:\\.\\/|\\.\\.\\/)?${sourceBase.replace(/\./g, '\\.')}\\)`, 'g'),
    ];

    for (const pat of patterns) {
      updated = updated.replace(pat, `(${wikiSlug})`);
    }
  }

  // Also replace template link
  updated = updated.replace(/\(_TEMPLATE\.md\)/g, '(https://github.com/coolnaveen99/codepackr/blob/main/docs/tools/_TEMPLATE.md)');
  updated = updated.replace(/\(\.\.\/\.\.\/\.github\/skills\/update-tool-docs\.md\)/g, '(https://github.com/coolnaveen99/codepackr/blob/main/.github/skills/update-tool-docs.md)');

  return updated;
}

// 1. Process Home.md from docs/tools/README.md
const readmePath = path.join(DOCS_TOOLS_DIR, 'README.md');
if (fs.existsSync(readmePath)) {
  let homeContent = fs.readFileSync(readmePath, 'utf8');

  // Add top banner for wiki
  const header = `> **Welcome to the official CodePackr Knowledge Base & Documentation Wiki.**  
> 🌐 **Live Web Application:** [www.codepackr.com](https://www.codepackr.com) | 💰 **Finance Suite:** [finance.codepackr.com](https://finance.codepackr.com) | 💻 **Source Code:** [coolnaveen99/codepackr](https://github.com/coolnaveen99/codepackr)

---

`;

  homeContent = header + rewriteLinks(homeContent);
  fs.writeFileSync(path.join(targetDir, 'Home.md'), homeContent, 'utf8');
  console.log(`✓ Synced Home.md`);
}

// 2. Process Primers & Glossary
const specialCopies = [
  { src: path.join(DOCS_TOOLS_DIR, 'edi', '00-edi-basics.md'), dest: 'edi-basics.md' },
  { src: path.join(DOCS_TOOLS_DIR, 'xml', '00-xml-basics.md'), dest: 'xml-basics.md' },
  { src: path.join(DOCS_TOOLS_DIR, 'GLOSSARY.md'), dest: 'glossary.md' },
];

for (const { src, dest } of specialCopies) {
  if (fs.existsSync(src)) {
    const content = rewriteLinks(fs.readFileSync(src, 'utf8'));
    fs.writeFileSync(path.join(targetDir, dest), content, 'utf8');
    console.log(`✓ Synced ${dest}`);
  }
}

// 3. Process all tool docs
let totalTools = 0;
for (const [cat, tools] of Object.entries(categoryTools)) {
  for (const t of tools) {
    const raw = fs.readFileSync(t.fullPath, 'utf8');
    const processed = rewriteLinks(raw);
    fs.writeFileSync(path.join(targetDir, `${t.wikiName}.md`), processed, 'utf8');
    totalTools++;
  }
}
console.log(`✓ Synced ${totalTools} tool documentation pages`);

// 4. Generate GitHub Wiki _Sidebar.md
const categoryOrder = [
  'formatters',
  'encoders',
  'validators',
  'converters',
  'image',
  'edi',
  'xml',
  'utilities',
  'text',
];

const categoryTitles = {
  formatters: '🧹 Formatters',
  encoders: '🔐 Encoders',
  validators: '✅ Validators',
  converters: '🔁 Converters',
  image: '🖼️ Image Tools',
  edi: '📦 EDI Integration Hub',
  xml: '📐 XML & XSD Tools',
  utilities: '🧰 Utilities',
  text: '✍️ Text Tools',
};

// Helper to extract clean H1 title from file
function extractTitle(filePath, fallback) {
  try {
    const firstLine = fs.readFileSync(filePath, 'utf8').split('\n')[0];
    if (firstLine.startsWith('#')) {
      // Remove leading # and emojis
      return firstLine.replace(/^#\s*/, '').replace(/^[^\w\s\(\)&/-]+\s*/, '').trim();
    }
  } catch (e) {}
  return fallback;
}

let sidebarContent = `### [📖 CodePackr Wiki](Home)

**🌐 [Open CodePackr](https://www.codepackr.com)**  
**💰 [Finance Suite](https://finance.codepackr.com)**  

---

### 📚 Primers & Guides
* **[EDI Basics](edi-basics)**
* **[XML & XSD Basics](xml-basics)**
* **[Glossary](glossary)**

---

### 🛠️ Tools Directory
`;

for (const cat of categoryOrder) {
  const tools = categoryTools[cat] || [];
  if (tools.length === 0) continue;
  const catTitle = categoryTitles[cat] || cat.toUpperCase();
  sidebarContent += `\n<details open>\n<summary><b>${catTitle} (${tools.length})</b></summary>\n\n`;
  for (const t of tools) {
    const cleanTitle = extractTitle(t.fullPath, t.wikiName);
    sidebarContent += `* [${cleanTitle}](${t.wikiName})\n`;
  }
  sidebarContent += `\n</details>\n`;
}

sidebarContent += `\n---\n* [Source Repository](https://github.com/coolnaveen99/codepackr)\n`;

fs.writeFileSync(path.join(targetDir, '_Sidebar.md'), sidebarContent, 'utf8');
console.log(`✓ Generated _Sidebar.md`);

// 5. Generate GitHub Wiki _Footer.md
const footerContent = `---
<p align="center">
  <b><a href="https://www.codepackr.com">CodePackr</a></b> — 100% Client-Side Developer Utilities & EDI Suite.<br>
  <a href="Home">Wiki Home</a> | <a href="edi-basics">EDI Basics</a> | <a href="xml-basics">XML Basics</a> | <a href="glossary">Glossary</a> | <a href="https://github.com/coolnaveen99/codepackr">GitHub</a>
</p>
`;

fs.writeFileSync(path.join(targetDir, '_Footer.md'), footerContent, 'utf8');
console.log(`✓ Generated _Footer.md`);

console.log(`\n🎉 Wiki sync complete! All documentation pages generated successfully in: ${targetDir}`);
