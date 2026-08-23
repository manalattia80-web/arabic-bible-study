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
    console.log("Fetching all books...");
    const booksRes = await fetchJson('https://arabic-bible-study-production.up.railway.app/api/v1/books');
    if (!booksRes.data) return;
    
    let nullCount = 0;
    for (const book of booksRes.data) {
        const chaptersRes = await fetchJson(`https://arabic-bible-study-production.up.railway.app/api/v1/chapters?book_id=${book.id}`);
        for (const chapter of chaptersRes.data) {
            const versesRes = await fetchJson(`https://arabic-bible-study-production.up.railway.app/api/v1/verses?book_id=${book.id}&chapter_num=${chapter.number}`);
            for (const verse of versesRes.data) {
                if (verse.text_original_lang === null) {
                    nullCount++;
                }
            }
        }
    }
    console.log(`Found ${nullCount} verses with null text_original_lang`);
}

check();
