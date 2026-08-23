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
  const url = 'https://arabic-bible-study-production.up.railway.app/api/v1/verses?book_id=1&chapter_num=5';
  const data = await fetchJson(url);
  let dbWords = [];
  data.data.forEach(v => {
      const clean = v.text_avd_ar.replace(/[.,:;«»!؟?]/g, '');
      dbWords.push(...clean.split(/\s+/).filter(w => w.trim().length > 0));
  });

  const jsonText = `تكوين 5 هذا كتاب مواليد ادم يوم خلق الله الانسان على شبه الله عمله ذكرا وانثى خلقه وباركه ودعا اسمه ادم يوم خلق وعاش ادم مئة وثلاثين سنة وولد ولدا على شبهه كصورته ودعا اسمه شيثا وكانت ايام ادم بعد ما ولد شيثا ثماني مئة سنة وولد بنين وبنات فكانت كل ايام ادم التي عاشها تسع مئة وثلاثين سنة ومات وعاش شيث مئة وخمس سنين وولد انوش وعاش شيث بعد ما ولد انوش ثماني مئة وسبع سنين وولد بنين وبنات فكانت كل ايام شيث تسع مئة واثنتي عشرة سنة ومات وعاش انوش تسعين سنة وولد قينان وعاش انوش بعد ما ولد قينان ثماني مئة وخمس عشرة سنة وولد بنين وبنات فكانت كل ايام انوش تسع مئة وخمس سنين ومات وعاش قينان سبعين سنة وولد مهللئيل وعاش قينان بعد ما ولد مهللئيل ثماني مئة واربعين سنة وولد بنين وبنات فكانت كل ايام قينان تسع مئة وعشر سنين ومات وعاش مهللئيل خمسا وستين سنة وولد يارد وعاش مهللئيل بعد ما ولد يارد ثماني مئة وثلاثين سنة وولد بنين وبنات فكانت كل ايام مهللئيل ثماني مئة وخمسا وتسعين سنة ومات وعاش يارد مئة واثنتين وستين سنة وولد اخنوخ وعاش يارد بعد ما ولد اخنوخ ثماني مئة سنة وولد بنين وبنات فكانت كل ايام يارد تسع مئة واثنتين وستين سنة ومات وعاش اخنوخ خمسا وستين سنة وولد متوشالح وسار اخنوخ مع الله بعد ما ولد متوشالح ثلاث مئة سنة وولد بنين وبنات فكانت كل ايام اخنوخ ثلاث مئة وخمسا وستين سنة وسار اخنوخ مع الله ولم يوجد لان الله اخذه وعاش متوشالح مئة وسبعا وثمانين سنة وولد لامك وعاش متوشالح بعد ما ولد لامك سبع مئة واثنتين وثمانين سنة وولد بنين وبنات فكانت كل ايام متوشالح تسع مئة وتسعا وستين سنة ومات وعاش لامك مئة واثنتين وثمانين سنة وولد ابنا ودعا اسمه نوحا قائلا هذا يعزينا عن عملنا وتعب ايدينا من قبل الارض التي لعنها الرب وعاش لامك بعد ما ولد نوحا خمس مئة وخمسا وتسعين سنة وولد بنين وبنات فكانت كل ايام لامك سبع مئة وسبعا وسبعين سنة ومات وكان نوح ابن خمس مئة سنة وولد نوح ساما وحاما ويافث`;
  const jsonWords = jsonText.split(/\s+/);

  console.log("DB Length:", dbWords.length, "JSON Length:", jsonWords.length);

  let d = 0, j = 0;
  while (d < dbWords.length && j < jsonWords.length) {
      const wD = dbWords[d].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي').replace(/ّ/g,'');
      const wJ = jsonWords[j].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي');
      
      if (wD !== wJ && wD.replace(/ي/g,'ى') !== wJ.replace(/ي/g,'ى')) {
          console.log(d, "DB:", dbWords[d], "| JSON:", jsonWords[j]);
          // basic alignment check
          if (dbWords[d] === jsonWords[j+1]) {
             console.log("-> JSON has extra word:", jsonWords[j]);
             j++;
          } else if (dbWords[d+1] === jsonWords[j]) {
             console.log("-> DB has extra word:", dbWords[d]);
             d++;
          } else if (dbWords[d] === jsonWords[j+2]) {
             console.log("-> JSON has 2 extra words:", jsonWords[j], jsonWords[j+1]);
             j += 2;
          } else {
             d++; j++;
          }
      } else {
          d++;
          j++;
      }
  }
}
test();
