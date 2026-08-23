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
  const url = 'https://arabic-bible-study-production.up.railway.app/api/v1/verses?book_id=1&chapter_num=31';
  const data = await fetchJson(url);
  let dbWords = [];
  data.data.forEach(v => {
      const clean = v.text_avd_ar.replace(/[.,:;«»!؟?]/g, '');
      dbWords.push(...clean.split(/\s+/).filter(w => w.trim().length > 0));
  });

  const userJsonText = fs.readFileSync('gen31.json', 'utf8');
  const userJson = JSON.parse(userJsonText);

  let result = [];
  let j = 0;
  
  if (userJson[0].word === 'تكوين' && userJson[1].word === '31') {
      j = 2;
  }
  
  for (let i = 0; i < dbWords.length; i++) {
      let wD = dbWords[i].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي').replace(/ّ/g,'');
      
      let foundIndex = -1;
      for (let look = j; look < Math.min(j+5, userJson.length); look++) {
          let wJ = userJson[look].word.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي');
          if (wD === wJ || wD.replace(/ي/g,'ى') === wJ.replace(/ي/g,'ى')) {
              foundIndex = look;
              break;
          }
      }
      
      if (foundIndex !== -1) {
          result.push({ word: dbWords[i], strongs: userJson[foundIndex].strongs });
          j = foundIndex + 1;
      } else {
          result.push({ word: dbWords[i], strongs: "H0" });
      }
  }

  const validStrongs = result.map(r => {
      if (r.strongs === "H0" || !/^H[1-9]\d{0,3}$/.test(r.strongs)) {
          return { ...r, strongs: "H0" };
      }
      return r;
  });

  fs.writeFileSync('Gen31_fixed.json', JSON.stringify(validStrongs, null, 2));
  console.log("Successfully created Gen31_fixed.json with exactly", validStrongs.length, "words.");
}
run();
