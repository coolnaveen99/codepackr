import fs from 'node:fs';
import path from 'node:path';

// IndexNow configuration
const DEFAULT_KEY = 'bc8b27f46bbcd43f50a45f870843689d';
const KEY = process.env.INDEXNOW_KEY || DEFAULT_KEY;
const HOST = 'www.codepackr.com';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Read all URLs from sitemap.xml
const sitemapPath = path.resolve('public/sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  console.error('Error: public/sitemap.xml not found.');
  process.exit(1);
}

const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
const locRegex = /<loc>(https:\/\/www\.codepackr\.com\/[^<]*)<\/loc>/g;
const urlList = [];
let match;
while ((match = locRegex.exec(sitemapContent)) !== null) {
  urlList.push(match[1]);
}

// Also include legacy alias URLs for comprehensive web indexing
const legacyAliases = [
  `https://${HOST}/edi-x12-formatter`,
  `https://${HOST}/edi-json-converter`
];
for (const alias of legacyAliases) {
  if (!urlList.includes(alias)) {
    urlList.push(alias);
  }
}

console.log(`\n========================================`);
console.log(` IndexNow Web Index Submission`);
console.log(`========================================`);
console.log(`Host:         ${HOST}`);
console.log(`Key:          ${KEY}`);
console.log(`Key Location: ${KEY_LOCATION}`);
console.log(`Total URLs:   ${urlList.length}\n`);

// Filter and print EDI tools specifically
const ediUrls = urlList.filter(u => 
  u.includes('edi') || u.includes('as2')
);

console.log(`----------------------------------------`);
console.log(` EDI Tools Included for Web Indexing (${ediUrls.length}):`);
console.log(`----------------------------------------`);
ediUrls.forEach((u, idx) => {
  console.log(`  ${idx + 1}. [✓] ${u}`);
});
console.log(`----------------------------------------\n`);

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urlList,
};

async function submitToIndexNow() {
  const endpoints = [
    { name: 'IndexNow Master API', url: 'https://api.indexnow.org/indexnow' },
    { name: 'Bing Webmaster IndexNow', url: 'https://www.bing.com/indexnow' },
    { name: 'Yandex Webmaster IndexNow', url: 'https://yandex.com/indexnow' }
  ];

  const results = [];

  for (const { name, url } of endpoints) {
    try {
      console.log(`Submitting to ${name} (${url})...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'Codepackr-IndexNow/1.0 (+https://www.codepackr.com)',
        },
        body: JSON.stringify(payload),
      });

      console.log(`  -> Response: ${response.status} ${response.statusText}`);

      if (response.status === 200 || response.status === 202) {
        console.log(`  -> [SUCCESS] Submitted ${urlList.length} URLs (including ${ediUrls.length} EDI tools) via ${name}!\n`);
        results.push({ name, status: 'Success', code: response.status });
      } else {
        const text = await response.text();
        console.warn(`  -> [NOTICE] ${name} returned: ${text.slice(0, 160)}`);
        if (response.status === 403) {
          console.warn(`     [Action Required on Live Server]: Ensure ${KEY}.txt is reachable at ${KEY_LOCATION} once deployed to production, or verify domain ownership in Bing Webmaster Tools.`);
        }
        console.log('');
        results.push({ name, status: 'HTTP ' + response.status, code: response.status });
      }
    } catch (err) {
      console.error(`Failed to submit to ${name}:`, err.message);
      results.push({ name, status: 'Error', error: err.message });
    }
  }

  console.log(`========================================`);
  console.log(` Submission Summary:`);
  console.log(`========================================`);
  results.forEach(r => {
    console.log(`- ${r.name}: ${r.status}`);
  });
  console.log(`\nNote: IndexNow protocol automatically shares URLs across all participating search engines (Bing, Yandex, Seznam, Naver).\n`);
}

submitToIndexNow();
