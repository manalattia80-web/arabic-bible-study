const https = require('https');
const fs = require('fs');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
         try {
             resolve({status: res.statusCode, data: JSON.parse(data)});
         } catch(e) {
             resolve({status: res.statusCode, data});
         }
      });
    }).on('error', reject);
  });
}

async function run() {
    const json = JSON.parse(fs.readFileSync('gen8.json', 'utf8'));
    const uniqueStrongs = [...new Set(json.map(j => j.strongs).filter(s => s !== 'H0' && s !== null && s !== ''))];
    
    console.log("Checking", uniqueStrongs.length, "unique Strongs IDs...");
    for (let id of uniqueStrongs) {
        let res = await fetchJson(`https://arabic-bible-study-production.up.railway.app/api/v1/strongs/${id}`);
        if (res.status !== 200) {
             console.log(`❌ Invalid Strong's ID: ${id} (Status: ${res.status})`);
        }
    }
    console.log("Done checking!");
}
run();
