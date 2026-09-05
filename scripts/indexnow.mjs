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

console.log(`\n========================================`);
console.log(` IndexNow Submission`);
console.log(`========================================`);
console.log(`Host:        ${HOST}`);
console.log(`Key:         ${KEY}`);
console.log(`Key Location: ${KEY_LOCATION}`);
console.log(`Total URLs:  ${urlList.length}\n`);

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urlList,
};

async function submitToIndexNow() {
  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow'
  ];

  let success = false;

  for (const endpoint of endpoints) {
    try {
      console.log(`Submitting to ${endpoint}...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'Codepackr-IndexNow/1.0 (+https://www.codepackr.com)',
        },
        body: JSON.stringify(payload),
      });

      console.log(`Response: ${response.status} ${response.statusText}`);

      if (response.status === 200 || response.status === 202) {
        console.log(`\n✓ Successfully submitted ${urlList.length} URLs to IndexNow via ${endpoint}!\n`);
        success = true;
        break; // Master IndexNow endpoint will propagate to Bing, Yandex, etc.
      } else {
        const text = await response.text();
        console.warn(`Endpoint returned notice: ${text}`);

        if (response.status === 403) {
          console.warn(`\n[Note]: If status is 403 "User is unauthorized":`);
          console.warn(`1. Ensure ${KEY}.txt is accessible at ${KEY_LOCATION}`);
          console.warn(`2. Confirm domain verification in Bing Webmaster Tools under "IndexNow".\n`);
        }
      }
    } catch (err) {
      console.error(`Failed to submit to ${endpoint}:`, err.message);
    }
  }

  if (!success) {
    console.log(`\nSubmission finished. If this was a first-time run, Bing/IndexNow may take a short time to verify the key file.`);
  }
}

submitToIndexNow();
