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
  const url = 'https://arabic-bible-study-production.up.railway.app/api/v1/verses?book_id=1&chapter_num=7';
  const data = await fetchJson(url);
  let dbWords = [];
  data.data.forEach(v => {
      const clean = v.text_avd_ar.replace(/[.,:;«»!؟?]/g, '');
      dbWords.push(...clean.split(/\s+/).filter(w => w.trim().length > 0));
  });

  const jsonText = `وقال الرب لنوح ادخل انت وجميع بيتك الى الفلك لاني اياك رايت بارا لدي في هذا الجيل من جميع البهائم الطاهرة تاخذ معك سبعة سبعة ذكرا وانثى ومن البهائم التي ليست بطاهرة اثنين ذكرا وانثى ومن طيور السماء ايضا سبعة سبعة ذكرا وانثى لاستبقاء نسل على وجه كل الارض لاني بعد سبعة ايام ايضا امطر على الارض اربعين يوما واربعين ليلة وامحو عن وجه الارض كل قائم عملته ففعل نوح حسب كل ما امره به الرب ولما كان نوح ابن ست مئة سنة صار طوفان الماء على الارض فدخل نوح وبنوه وامراته ونساء بنيه معه الى الفلك من وجه مياه الطوفان ومن البهائم الطاهرة والبهائم التي ليست بطاهرة ومن الطيور وكل ما يدب على الارض دخل اثنان اثنان الى نوح الى الفلك ذكرا وانثى كما امر الله نوحا وحدث بعد السبعة الايام ان مياه الطوفان صارت على الارض في سنة ست مئة من حياة نوح في الشهر الثاني في اليوم السابع عشر من الشهر في ذلك اليوم انفجرت كل ينابيع الغمر العظيم وانفتحت طاقات السماء وكان المطر على الارض اربعين يوما واربعين ليلة في ذلك اليوم عينه دخل نوح وسام وحام ويافث بنو نوح وامراة نوح وثلاث نساء بنيه معهم الى الفلك هم وكل الوحوش كاجناسها وكل البهائم كاجناسها وكل الدبابات التي تدب على الارض كاجناسها وكل الطيور كاجناسها كل عصفور كل ذي جناح ودخلت الى نوح الى الفلك اثنين اثنين من كل جسد فيه روح حياة والداخلات دخلت ذكرا وانثى من كل ذي جسد كما امره الله واغلق الرب عليه وكان الطوفان اربعين يوما على الارض وتكاثرت المياه ورفعت الفلك فارتفع عن الارض وتعاظمت المياه وتكاثرت جدا على الارض فكان الفلك يسير على وجه المياه وتعاظمت المياه كثيرا جدا على الارض فتغطت جميع الجبال الشامخة التي تحت كل السماء خمس عشرة ذراعا في الارتفاع تعاظمت المياه فتغطت الجبال فمات كل ذي جسد كان يدب على الارض من الطيور والبهائم والوحوش وكل الزحافات التي كانت تزحف على الارض وجميع الناس كل ما في انفه نسمة روح حياة من كل ما في اليابسة مات فمحا كل قائم كان على وجه الارض الناس والبهائم والدبابات وطيور السماء فانمحت من الارض وتبقى نوح والذين معه في الفلك فقط وتعاظمت المياه على الارض مئة وخمسين يوما`;
  const jsonWords = jsonText.split(/\s+/);

  console.log("DB Length:", dbWords.length, "JSON Length:", jsonWords.length);

  let d = 0, j = 0;
  while (d < dbWords.length && j < jsonWords.length) {
      const wD = dbWords[d].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي').replace(/ّ/g,'');
      const wJ = jsonWords[j].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي');
      
      if (wD !== wJ && wD.replace(/ي/g,'ى') !== wJ.replace(/ي/g,'ى')) {
          console.log("Mismatch at DB pos", d, ": DB =", dbWords[d], "| JSON =", jsonWords[j]);
          // check if JSON missed a word
          if (dbWords[d+1].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى') === wJ) {
             console.log("-> JSON MISSED word:", dbWords[d]);
             d++;
          }
          // check if JSON missed TWO words
          else if (dbWords[d+2].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى') === wJ) {
             console.log("-> JSON MISSED 2 words:", dbWords[d], dbWords[d+1]);
             d += 2;
          }
          // check if JSON missed THREE words
          else if (dbWords[d+3] && dbWords[d+3].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى') === wJ) {
             console.log("-> JSON MISSED 3 words:", dbWords[d], dbWords[d+1], dbWords[d+2]);
             d += 3;
          }
          else {
             d++; j++;
          }
      } else {
          d++;
          j++;
      }
  }
  // Print any remaining DB words
  if (d < dbWords.length) {
     console.log("Remaining DB words missed by JSON:");
     for (let i = d; i < dbWords.length; i++) {
         console.log(i, dbWords[i]);
     }
  }
}
test();
