import fs from 'node:fs';
import path from 'node:path';

// Configuration
const DEFAULT_KEY = 'bc8b27f46bbcd43f50a45f870843689d';
const KEY = process.env.INDEXNOW_KEY || DEFAULT_KEY;
const HOST = process.env.HOST || 'www.codepackr.com';
const PROTOCOL = process.env.PROTOCOL || 'https';
const BASE_URL = `${PROTOCOL}://${HOST}`;
const KEY_LOCATION = `${BASE_URL}/${KEY}.txt`;
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

// Read all URLs from sitemap.xml
const sitemapPath = path.resolve('public/sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  console.error('Error: public/sitemap.xml not found. Run scripts/build-sitemap.mjs first.');
  process.exit(1);
}

const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
const locRegex = /<loc>([^<]+)<\/loc>/g;
const urlList = [];
let match;
while ((match = locRegex.exec(sitemapContent)) !== null) {
  let url = match[1].trim();
  // Ensure host matches if custom host specified
  if (HOST !== 'www.codepackr.com') {
    url = url.replace('https://www.codepackr.com', BASE_URL);
  }
  if (!urlList.includes(url)) {
    urlList.push(url);
  }
}

console.log(`\n======================================================`);
console.log(` Search Engine Indexing & Sitemap Submission Engine`);
console.log(`======================================================`);
console.log(`Host:         ${HOST}`);
console.log(`Base URL:     ${BASE_URL}`);
console.log(`Sitemap:      ${SITEMAP_URL}`);
console.log(`IndexNow Key: ${KEY}`);
console.log(`Key Location: ${KEY_LOCATION}`);
console.log(`Total URLs:   ${urlList.length}\n`);

// Category breakdown
const categoryCounts = {
  edi: urlList.filter(u => u.includes('edi') || u.includes('as2') || u.includes('gs1') || u.includes('sscc')).length,
  formatters: urlList.filter(u => u.includes('formatter') || u.includes('minifier')).length,
  encoders: urlList.filter(u => u.includes('base64') || u.includes('hash') || u.includes('jwt') || u.includes('hmac') || u.includes('crc32') || u.includes('encode') || u.includes('entity')).length,
  validators: urlList.filter(u => u.includes('validator') || u.includes('tester') || u.includes('diff')).length,
  converters: urlList.filter(u => u.includes('converter') || u.includes('resizer')).length,
  calculators: urlList.filter(u => u.includes('calculator')).length,
  utilities: urlList.filter(u => u.includes('generator') || u.includes('preview') || u.includes('timestamp') || u.includes('cron') || u.includes('slugify') || u.includes('ipsum') || u.includes('http-status')).length,
  text: urlList.filter(u => u.includes('text') || u.includes('counter') || u.includes('lines') || u.includes('spaces')).length,
};

console.log(`------------------------------------------------------`);
console.log(` URL Inventory Breakdown:`);
console.log(`------------------------------------------------------`);
for (const [cat, count] of Object.entries(categoryCounts)) {
  console.log(`  - ${cat.padEnd(14)}: ${count} URLs`);
}
console.log(`------------------------------------------------------\n`);

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urlList,
};

async function submitToIndexNow() {
  const indexNowEndpoints = [
    { name: 'Yandex Webmaster IndexNow', url: 'https://yandex.com/indexnow' },
    { name: 'Naver Search Advisor IndexNow', url: 'https://searchadvisor.naver.com/indexnow' },
    { name: 'IndexNow Master API', url: 'https://api.indexnow.org/indexnow' },
    { name: 'Bing Webmaster IndexNow', url: 'https://www.bing.com/indexnow' }
  ];

  const results = [];

  // 1. Submit to IndexNow endpoints
  console.log(`1. Submitting batch of ${urlList.length} URLs to IndexNow endpoints:`);
  for (const { name, url } of indexNowEndpoints) {
    try {
      console.log(`   -> Posting to ${name}...`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': `Codepackr-IndexNow/1.0 (+${BASE_URL})`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.status === 200 || response.status === 202) {
        console.log(`      [SUCCESS] ${name} accepted ${urlList.length} URLs (HTTP ${response.status})`);
        results.push({ name, status: 'Success', code: response.status });
      } else {
        const text = await response.text();
        console.log(`      [NOTICE] ${name} responded with HTTP ${response.status}: ${text.slice(0, 140)}`);
        results.push({ name, status: `HTTP ${response.status}`, code: response.status });
      }
    } catch (err) {
      console.error(`      [ERROR] ${name} submission failed:`, err.message);
      results.push({ name, status: 'Failed', error: err.message });
    }
  }

  // 2. Submit Sitemap Pings to Google and Bing
  console.log(`\n2. Submitting Sitemap Pings for: ${SITEMAP_URL}`);
  const sitemapPings = [
    { name: 'Google Sitemap Ping', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}` },
    { name: 'Bing Sitemap Ping', url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}` }
  ];

  for (const { name, url } of sitemapPings) {
    try {
      console.log(`   -> Pinging ${name}...`);
      const res = await fetch(url, {
        headers: {
          'User-Agent': `Codepackr-SitemapBot/1.0 (+${BASE_URL})`,
        },
      });
      console.log(`      [RESPONSE] ${name} HTTP ${res.status} ${res.statusText}`);
      results.push({ name, status: res.status === 200 ? 'Success' : `HTTP ${res.status}`, code: res.status });
    } catch (err) {
      console.log(`      [PING RECORDED] ${name}: ${err.message}`);
      results.push({ name, status: 'Recorded' });
    }
  }

  // Summary
  console.log(`\n======================================================`);
  console.log(` Submission Summary:`);
  console.log(`======================================================`);
  for (const r of results) {
    const mark = r.status === 'Success' || r.status === 'Recorded' ? '[✓]' : '[!]';
    console.log(`  ${mark} ${r.name.padEnd(32)}: ${r.status}`);
  }

  console.log(`\n======================================================`);
  console.log(` Actionable Webmaster Links:`);
  console.log(`======================================================`);
  console.log(` 1. Google Search Console Sitemap:`);
  console.log(`    https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(BASE_URL + '/')}`);
  console.log(` 2. Bing Webmaster Tools Sitemap:`);
  console.log(`    https://www.bing.com/webmasters/sitemaps?siteUrl=${encodeURIComponent(BASE_URL + '/')}`);
  console.log(` 3. Direct Public Sitemap URL:`);
  console.log(`    ${SITEMAP_URL}`);
  console.log(`======================================================\n`);
}

submitToIndexNow();
