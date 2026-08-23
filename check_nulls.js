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

async function check() {
    console.log("Fetching book 1...");
    const versesRes = await fetchJson(`https://arabic-bible-study-production.up.railway.app/api/v1/verses?book_id=1&chapter_num=1`);
    if (!versesRes.data) return;
    
    let nullCount = 0;
    let checked = 0;
    
    for (const verse of versesRes.data) {
        const mapRes = await fetchJson(`https://arabic-bible-study-production.up.railway.app/api/v1/word-mappings?verse_id=${verse.id}`);
        if (!mapRes.data) continue;
        
        for (const word of mapRes.data) {
            checked++;
            for (const key in word) {
                if (word[key] === null) {
                    console.log(`FOUND NULL in verse ${verse.verse_num}, word ${word.ar_word}, field: ${key}`);
                    nullCount++;
                }
            }
        }
    }
    console.log(`Checked ${checked} words. Found ${nullCount} nulls.`);
}

check();
