const https = require('https');
const fs = require('fs');

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
  const url = 'https://arabic-bible-study-production.up.railway.app/api/v1/verses?book_id=1&chapter_num=8';
  const data = await fetchJson(url);
  let dbWords = [];
  data.data.forEach(v => {
      const clean = v.text_avd_ar.replace(/[.,:;«»!؟?]/g, '');
      dbWords.push(...clean.split(/\s+/).filter(w => w.trim().length > 0));
  });

  const jsonText = `ثم ذكر الله نوحا وكل الوحوش وكل البهائم التي معه في الفلك واجاز الله ريحا على الارض فهدات المياه وانسدت ينابيع الغمر وطاقات السماء فامتنع المطر من السماء ورجعت المياه عن الارض رجوعا متواليا وبعد مئة وخمسين يوما نقصت المياه واستقر الفلك في الشهر السابع في اليوم السابع عشر من الشهر على جبال اراراط وكانت المياه تنقص نقصا متواليا الى الشهر العاشر وفي العاشر في اول الشهر ظهرت رؤوس الجبال وحدث من بعد اربعين يوما ان نوحا فتح طاقة الفلك التي كان قد عملها وارسل الغراب فخرج مترددا حتى نشفت المياه عن الارض ثم ارسل الحمامة من عنده ليرى هل قلت المياه عن وجه الارض فلم تجد الحمامة مقرا لبطن قدمها فرجعت اليه الى الفلك لان مياها كانت على وجه كل الارض فمد يده واخذها وادخلها عنده الى الفلك فلبث ايضا سبعة ايام اخر وعاد فارسل الحمامة من الفلك فاتت اليه الحمامة عند المساء وفي فمها ورقة زيتون خضراء فعلم نوح ان المياه قد قلت عن الارض فلبث ايضا سبعة ايام اخر وارسل الحمامة فلم تعد ترجع اليه ايضا وكان في السنة الواحدة والست مئة في الشهر الاول في اول الشهر ان المياه نشفت عن الارض فرفع نوح غطاء الفلك ونظر فاذا وجه الارض قد نشف وفي الشهر الثاني في اليوم السابع والعشرين من الشهر جفت الارض وكلم الله نوحا قائلا اخرج من الفلك انت وامراتك وبنوك ونساء بنيك معك كل الحيوانات التي معك من كل ذي جسد الطيور والبهائم وكل الدبابات التي تدب على الارض اخرجها معك ولتتوالد في الارض وتثمر وتكثر على الارض فخرج نوح وبنوه وامراته ونساء بنيه معه وكل الحيوانات كل الدبابات وكل الطيور كل ما يدب على الارض كاجناسها خرجت من الفلك وبنى نوح مذبحا للرب واخذ من كل البهائم الطاهرة ومن كل الطيور الطاهرة واصعد محرقات على المذبح فتنسم الرب رائحة الرضا وقال الرب في قلبه لا اعود العن الارض ايضا من اجل الانسان لان تصور قلب الانسان شرير منذ حداثته ولا اعود ايضا اميت كل حي كما فعلت مدة كل ايام الارض زرع وحصاد وبرد وحر وصيف وشتاء ونهار وليل لا تزال`;
  const jsonWords = jsonText.split(/\s+/);

  console.log("DB Length:", dbWords.length, "JSON Length:", jsonWords.length);

  let d = 0, j = 0;
  while (d < dbWords.length && j < jsonWords.length) {
      const wD = dbWords[d].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي').replace(/ّ/g,'');
      const wJ = jsonWords[j].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي');
      
      if (wD !== wJ && wD.replace(/ي/g,'ى') !== wJ.replace(/ي/g,'ى')) {
          console.log("Mismatch at DB pos", d, ": DB =", dbWords[d], "| JSON =", jsonWords[j]);
          if (dbWords[d+1] && dbWords[d+1].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى') === wJ.replace(/ي/g,'ى')) {
             console.log("-> JSON MISSED word:", dbWords[d]);
             d++;
          }
          else if (dbWords[d+2] && dbWords[d+2].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى') === wJ.replace(/ي/g,'ى')) {
             console.log("-> JSON MISSED 2 words:", dbWords[d], dbWords[d+1]);
             d += 2;
          }
          else {
             d++; j++;
          }
      } else {
          d++;
          j++;
      }
  }
  if (d < dbWords.length) {
     console.log("Remaining DB words missed by JSON:");
     for (let i = d; i < dbWords.length; i++) {
         console.log(i, dbWords[i]);
     }
  }
}
test();
