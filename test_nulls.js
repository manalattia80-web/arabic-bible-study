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

async function test() {
  const versesUrl = 'https://arabic-bible-study-production.up.railway.app/api/v1/verses?book_id=1&chapter_num=1';
  const versesData = await fetchJson(versesUrl);
  
  let foundNull = false;
  
  for (const verse of versesData.data) {
      const mappingsUrl = `https://arabic-bible-study-production.up.railway.app/api/v1/word-mappings?verse_id=${verse.id}`;
      const mappingsData = await fetchJson(mappingsUrl);
      
      if (!mappingsData.data) continue;
      
      for (const mapping of mappingsData.data) {
          for (const key in mapping) {
              if (mapping[key] === null) {
                  console.log(`FOUND NULL in verse ${verse.verse_num}, word ${mapping.ar_word}, field: ${key}`);
                  foundNull = true;
              }
          }
      }
  }
  
  if (!foundNull) {
      console.log('No nulls found in Genesis 1 mappings.');
  }
}
test();
