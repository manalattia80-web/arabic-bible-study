const https = require('https');
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}
fetchJson('https://arabic-bible-study-production.up.railway.app/api/v1/strongs/H1').then(d => console.log('H1:', JSON.stringify(d, null, 2)));
