import fs from 'node:fs';
import path from 'node:path';

const KEY = 'bc8b27f46bbcd43f50a45f870843689d';
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

console.log(`Found ${urlList.length} URLs in sitemap.xml to submit to IndexNow.`);

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urlList,
};

async function submitToIndexNow() {
  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Submitting to ${endpoint}...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      console.log(`Response status: ${response.status} ${response.statusText}`);
      if (response.status === 200 || response.status === 202) {
        console.log(`✓ Successfully submitted ${urlList.length} URLs to IndexNow (${endpoint})!`);
        break; // Successfully submitted to master endpoint
      } else {
        const text = await response.text();
        console.warn(`Endpoint returned non-success: ${text}`);
      }
    } catch (err) {
      console.error(`Failed to submit to ${endpoint}:`, err.message);
    }
  }
}

submitToIndexNow();
