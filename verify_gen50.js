const https = require('https');
const fs = require('fs');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({status: res.statusCode, data: JSON.parse(data)}));
    }).on('error', reject);
  });
}

async function run() {
    const json = JSON.parse(fs.readFileSync('Gen50_fixed.json', 'utf8'));
    const uniqueStrongs = [...new Set(json.map(j => j.strongs).filter(s => s !== 'H0'))];
    
    console.log("Checking", uniqueStrongs.length, "unique Strongs IDs...");
    let invalidCount = 0;
    for (let id of uniqueStrongs) {
        let res = await fetchJson(`https://arabic-bible-study-production.up.railway.app/api/v1/strongs/${id}`);
        if (res.status !== 200) {
             console.log(`❌ Invalid Strong's ID: ${id}`);
             invalidCount++;
             // Fix it in the json
             json.forEach(item => {
                 if(item.strongs === id) item.strongs = 'H0';
             });
        }
    }
    if (invalidCount > 0) {
        fs.writeFileSync('Gen50_fixed.json', JSON.stringify(json, null, 2));
        console.log("Fixed invalid IDs and saved!");
    } else {
        console.log("All IDs are valid.");
    }
}
run();
