import fs from 'fs';

async function checkImages() {
  const content = fs.readFileSync('src/data/mockData.ts', 'utf8');
  const regex = /https:\/\/images\.unsplash\.com\/photo-[^"'\`\s]+/g;
  const urls = [...new Set([...content.matchAll(regex)].map(m => m[0]))];
  console.log(`Found ${urls.length} unique Unsplash URLs.`);

  const badUrls = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) {
        console.log(`❌ [${res.status}] ${url}`);
        badUrls.push({ url, status: res.status });
      } else {
        // console.log(`✓ ${url}`);
      }
    } catch (err) {
      console.log(`❌ [ERROR] ${url}: ${err.message}`);
      badUrls.push({ url, error: err.message });
    }
  }

  console.log(`\nDone! Found ${badUrls.length} broken URLs out of ${urls.length}.`);
}

checkImages();
