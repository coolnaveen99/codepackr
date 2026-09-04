import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('Error: dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(indexHtmlPath, 'utf8');

// Load tool metadata JSON (generated from scripts/generate-metadata.mjs)
const metadataPath = path.resolve('src/data/toolMetadata.json');
let metadata = {};
if (fs.existsSync(metadataPath)) {
  metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
} else {
  console.warn('Warning: src/data/toolMetadata.json not found. Run scripts/generate-metadata.mjs first.');
}

// Special alias slugs for canonical URLs & sitemap entries
const SLUG_MAPPINGS = {
  'edi-x12-formatter': 'edi-formatter',
  'edi-json-converter': 'edi-to-json',
  'markdown': 'markdown-preview'
};

// Parse all loc URLs from public/sitemap.xml
const sitemap = fs.readFileSync(path.resolve('public/sitemap.xml'), 'utf8');
const locRegex = /<loc>https:\/\/www\.codepackr\.com\/([^<]+)<\/loc>/g;
const pages = [];
let match;

while ((match = locRegex.exec(sitemap)) !== null) {
  const file = match[1];
  if (file.endsWith('.html')) {
    pages.push(file);
  }
}

console.log(`Prerendering ${pages.length} pages from sitemap.xml...`);

let generatedCount = 0;

for (const file of pages) {
  const slug = file.replace(/\.html$/, '');
  const metaKey = metadata[slug] ? slug : (SLUG_MAPPINGS[slug] && metadata[SLUG_MAPPINGS[slug]] ? SLUG_MAPPINGS[slug] : slug);
  const meta = metadata[metaKey] || {
    name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    title: `${slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - Codepackr`,
    description: 'Free online developer tools for formatting, validating, encoding, converting, and inspecting data locally in your browser with 100% privacy.',
    category: 'utilities',
    features: ['Fast, client-side developer utility.', '100% browser-based execution with complete privacy.'],
    howToUse: ['Paste or enter your input data.', 'Review the processed result.', 'Copy or export the output.'],
    faqs: [
      {
        question: 'Is my data private?',
        answer: 'Yes, all processing is performed 100% client-side in your web browser. No data is sent to external servers.'
      }
    ]
  };

  const title = meta.title || `${meta.name} - Codepackr`;
  const desc = meta.description;
  const canonicalUrl = `https://www.codepackr.com/${file}`;

  let html = template;

  // Replace Title
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);

  // Replace Description
  html = html.replace(
    /<meta name="description" content="[^"]*"/i,
    `<meta name="description" content="${desc}"`
  );

  // Replace Canonical Link
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/i,
    `<link rel="canonical" href="${canonicalUrl}"`
  );

  // Replace Open Graph Tags
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/i,
    `<meta property="og:title" content="${title}"`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/i,
    `<meta property="og:description" content="${desc}"`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/i,
    `<meta property="og:url" content="${canonicalUrl}"`
  );

  // Replace Twitter Card Tags
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/i,
    `<meta name="twitter:title" content="${title}"`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/i,
    `<meta name="twitter:description" content="${desc}"`
  );

  // Inject per-tool SoftwareApplication JSON-LD into static HTML
  if (slug !== 'privacy' && slug !== 'contact') {
    const softwareAppJsonLd = `
    <!-- Per-tool SoftwareApplication Schema for Rich Snippets -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": ${JSON.stringify(meta.name)},
      "description": ${JSON.stringify(meta.description)},
      "url": ${JSON.stringify(canonicalUrl)},
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "browserRequirements": "Requires JavaScript. Requires HTML5."
    }
    </script>
    `;
    html = html.replace('</head>', `${softwareAppJsonLd}\n</head>`);
  }

  // Inject prerendered semantic crawler content into root
  let crawlerContent;

  if (slug === 'privacy') {
    crawlerContent = `
    <div id="root" data-codepackr-prerendered="true">
      <main style="max-width: 900px; margin: 40px auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 24px;">
          <a href="/" style="font-weight: 700; color: #5B52E8; text-decoration: none; font-size: 1.1rem;">Codepackr</a>
          <h1 style="font-size: 2rem; margin: 12px 0 8px 0; color: #111827;">Privacy Policy</h1>
          <p style="font-size: 1rem; color: #4B5563; line-height: 1.5;">Last updated: September 4, 2026. Codepackr is committed to protecting developer privacy with client-side execution and transparent data handling.</p>
        </header>

        <section style="background: #F9FAFB; padding: 20px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 20px;">
          <h2 style="font-size: 1.25rem; color: #111827; margin: 0 0 8px 0;">1. 100% Client-Side Processing Architecture</h2>
          <p style="color: #374151; margin: 0 0 8px 0; line-height: 1.6;">All code, JSON, XML, EDI files, SQL queries, tokens, and data formatted or converted using Codepackr are processed locally in your browser using JavaScript and standard Web APIs. No code payloads are ever uploaded, transmitted, stored, or inspected on our servers.</p>
        </section>

        <section style="background: #F9FAFB; padding: 20px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 20px;">
          <h2 style="font-size: 1.25rem; color: #111827; margin: 0 0 8px 0;">2. Google AdSense &amp; Third-Party Cookies</h2>
          <p style="color: #374151; margin: 0 0 8px 0; line-height: 1.6;">We use Google AdSense (Publisher ID: pub-7526363571565796) to display advertising. Third-party vendors, including Google, use cookies to serve ads based on prior visits to this or other websites. Users may opt out of personalized advertising by visiting <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" style="color: #5B52E8;">Google Ads Settings</a> or <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style="color: #5B52E8;">www.aboutads.info</a>.</p>
        </section>

        <section style="background: #F9FAFB; padding: 20px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 20px;">
          <h2 style="font-size: 1.25rem; color: #111827; margin: 0 0 8px 0;">3. Analytics Telemetry</h2>
          <p style="color: #374151; margin: 0 0 8px 0; line-height: 1.6;">We use Google Analytics (Tag ID: G-1WPJJP0CHB) and Microsoft Clarity (Project ID: ya1n0vs9s5) to track aggregate site usage, performance, and UX diagnostics. All tool input areas are masked.</p>
        </section>

        <section style="background: #F9FAFB; padding: 20px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 20px;">
          <h2 style="font-size: 1.25rem; color: #111827; margin: 0 0 8px 0;">4. GDPR &amp; CCPA Rights</h2>
          <p style="color: #374151; margin: 0 0 8px 0; line-height: 1.6;">Because Codepackr operates without user accounts and does not store personal developer payloads, we do not profile or sell personal information.</p>
        </section>

        <footer style="margin-top: 32px; font-size: 0.875rem; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 16px;">
          <a href="/" style="color: #5B52E8; margin-right: 16px;">All Tools</a>
          <a href="/contact.html" style="color: #5B52E8; margin-right: 16px;">Contact &amp; Feedback</a>
          <a href="/privacy.html" style="color: #5B52E8;">Privacy Policy</a>
        </footer>
      </main>
    </div>
    `.trim();
  } else if (slug === 'contact') {
    crawlerContent = `
    <div id="root" data-codepackr-prerendered="true">
      <main style="max-width: 900px; margin: 40px auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 24px;">
          <a href="/" style="font-weight: 700; color: #5B52E8; text-decoration: none; font-size: 1.1rem;">Codepackr</a>
          <h1 style="font-size: 2rem; margin: 12px 0 8px 0; color: #111827;">Contact &amp; Feedback</h1>
          <p style="font-size: 1rem; color: #4B5563; line-height: 1.5;">Have a feature request, bug report, or feedback? We would love to hear from you.</p>
        </header>

        <section style="background: #F9FAFB; padding: 20px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 20px;">
          <h2 style="font-size: 1.25rem; color: #111827; margin: 0 0 8px 0;">Developer Support &amp; Contributions</h2>
          <p style="color: #374151; margin: 0 0 8px 0; line-height: 1.6;">Codepackr is maintained for developers worldwide. Feel free to reach out with any tool requests or inquiries.</p>
        </section>

        <footer style="margin-top: 32px; font-size: 0.875rem; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 16px;">
          <a href="/" style="color: #5B52E8; margin-right: 16px;">All Tools</a>
          <a href="/contact.html" style="color: #5B52E8; margin-right: 16px;">Contact &amp; Feedback</a>
          <a href="/privacy.html" style="color: #5B52E8;">Privacy Policy</a>
        </footer>
      </main>
    </div>
    `.trim();
  } else {
    // Rich substantive content for developer tools (features, how-to, FAQs)
    const featuresList = (meta.features || [])
      .map(f => `<li style="margin-bottom: 8px; color: #374151;">${f}</li>`)
      .join('\n');

    const stepsList = (meta.howToUse || [])
      .map(s => `<li style="margin-bottom: 8px; color: #374151;">${s}</li>`)
      .join('\n');

    const faqsList = (meta.faqs || [])
      .map(faq => `
        <div style="margin-bottom: 16px; padding: 16px; background: #FFFFFF; border-radius: 6px; border: 1px solid #E5E7EB;">
          <h3 style="font-size: 1.05rem; font-weight: 600; color: #111827; margin: 0 0 6px 0;">${faq.question}</h3>
          <p style="margin: 0; color: #4B5563; line-height: 1.6; font-size: 0.95rem;">${faq.answer}</p>
        </div>
      `).join('\n');

    crawlerContent = `
    <div id="root" data-codepackr-prerendered="true">
      <main style="max-width: 900px; margin: 40px auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <header style="margin-bottom: 28px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.875rem; margin-bottom: 12px;">
            <a href="/" style="font-weight: 700; color: #5B52E8; text-decoration: none;">Codepackr</a>
            <span style="color: #9CA3AF;">/</span>
            <span style="color: #6B7280; text-transform: capitalize;">${meta.category || 'Utilities'}</span>
            <span style="color: #9CA3AF;">/</span>
            <span style="color: #111827; font-weight: 500;">${meta.name}</span>
          </div>
          <h1 style="font-size: 2.25rem; font-weight: 700; margin: 0 0 10px 0; color: #111827; line-height: 1.2;">${meta.name}</h1>
          <p style="font-size: 1.15rem; color: #4B5563; line-height: 1.6; margin: 0;">${meta.description}</p>
        </header>

        <section style="background: #EEF2FF; border-left: 4px solid #5B52E8; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
          <h2 style="font-size: 1.1rem; font-weight: 600; color: #1E1B4B; margin: 0 0 6px 0;">Client-Side Execution &amp; Privacy Guarantee</h2>
          <p style="color: #3730A3; margin: 0; line-height: 1.5; font-size: 0.95rem;">This utility executes 100% locally in your web browser. Your inputs, tokens, queries, and data payloads are never transmitted to any external server or backend.</p>
        </section>

        <section style="background: #F9FAFB; padding: 24px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 24px;">
          <h2 style="font-size: 1.35rem; font-weight: 600; color: #111827; margin: 0 0 14px 0;">Key Features &amp; Capabilities</h2>
          <ul style="padding-left: 20px; margin: 0; line-height: 1.6;">
            ${featuresList}
          </ul>
        </section>

        <section style="background: #F9FAFB; padding: 24px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 24px;">
          <h2 style="font-size: 1.35rem; font-weight: 600; color: #111827; margin: 0 0 14px 0;">How to Use ${meta.name}</h2>
          <ol style="padding-left: 20px; margin: 0; line-height: 1.6;">
            ${stepsList}
          </ol>
        </section>

        <section style="background: #F9FAFB; padding: 24px; border-radius: 8px; border: 1px solid #E5E7EB; margin-bottom: 24px;">
          <h2 style="font-size: 1.35rem; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Frequently Asked Questions</h2>
          <div>
            ${faqsList}
          </div>
        </section>

        <footer style="margin-top: 36px; font-size: 0.875rem; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 20px; display: flex; gap: 20px; flex-wrap: wrap;">
          <a href="/" style="color: #5B52E8; text-decoration: none; font-weight: 500;">&larr; Explore All Developer Tools</a>
          <a href="/contact.html" style="color: #5B52E8; text-decoration: none;">Contact &amp; Feedback</a>
          <a href="/privacy.html" style="color: #5B52E8; text-decoration: none;">Privacy Policy</a>
        </footer>
      </main>
    </div>
    `.trim();
  }

  html = html.replace(/<div id="root"[\s\S]*?<\/div>/i, crawlerContent);

  fs.writeFileSync(path.join(distDir, file), html);
  generatedCount++;
}

// Automate sitemap.xml <lastmod> synchronization to current build date
const today = new Date().toISOString().split('T')[0];
const updatedSitemap = sitemap.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
fs.writeFileSync(path.resolve('public/sitemap.xml'), updatedSitemap, 'utf8');
if (fs.existsSync(path.join(distDir, 'sitemap.xml'))) {
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), updatedSitemap, 'utf8');
}
console.log(`Updated sitemap.xml with current build date <lastmod>${today}</lastmod>`);

console.log(`Successfully prerendered ${generatedCount} static HTML pages into dist/`);
