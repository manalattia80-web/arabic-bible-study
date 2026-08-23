const fs = require('fs');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  const url = 'https://arabic-bible-study-production.up.railway.app/api/v1/verses?book_id=1&chapter_num=24';
  const data = await fetchJson(url);
  let dbWords = [];
  data.data.forEach(v => {
      const clean = v.text_avd_ar.replace(/[.,:;«»!؟?]/g, '');
      dbWords.push(...clean.split(/\s+/).filter(w => w.trim().length > 0));
  });

  const userJsonText = fs.readFileSync('gen24_part.json', 'utf8');
  const userJson = JSON.parse(userJsonText);

  console.log(`DB Words: ${dbWords.length}, User Words: ${userJson.length}`);
}
run();
