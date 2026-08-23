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

fetchJson('https://arabic-bible-study-production.up.railway.app/api/v1/testaments').then(d => console.log('testaments:', JSON.stringify(d, null, 2)));
fetchJson('https://arabic-bible-study-production.up.railway.app/api/v1/books?testament_id=1').then(d => console.log('books:', JSON.stringify(d, null, 2)));
fetchJson('https://arabic-bible-study-production.up.railway.app/api/v1/chapters?book_id=1').then(d => console.log('chapters:', JSON.stringify(d, null, 2)));
