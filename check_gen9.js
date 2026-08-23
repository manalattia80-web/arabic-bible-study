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
  const url = 'https://arabic-bible-study-production.up.railway.app/api/v1/verses?book_id=1&chapter_num=9';
  const data = await fetchJson(url);
  let dbWords = [];
  data.data.forEach(v => {
      const clean = v.text_avd_ar.replace(/[.,:;«»!؟?]/g, '');
      dbWords.push(...clean.split(/\s+/).filter(w => w.trim().length > 0));
  });

  const jsonText = `تكوين 9 وبارك الله نوحا وبنيه وقال لهم اثمروا واكثروا واملاوا الارض ولتكن خشيتكم ورهبتكم على كل حيوانات الارض وكل طيور السماء مع كل ما يدب على الارض وكل سمك البحر الى ايديكم دفعت كل دابة حية تكون لكم طعاما كعشب البقل اعطيتكم الجميع غير ان لحما بحياته دمه لا تاكلوه واطلب انا دمكم لانفسكم فقط من يد كل حيوان اطلبه ومن يد الانسان من يد الانسان اخيه اطلب نفس الانسان سافك دم الانسان بالانسان يسفك دمه لان الله على صورته عمل الانسان فاثمروا انتم واكثروا وتوالدوا في الارض وتكاثروا فيها وكلم الله نوحا وبنيه معه قائلا وها انا مقيم ميثاقي معكم ومع نسلكم من بعدكم ومع كل ذوات الانفس الحية التي معكم الطيور والبهائم وكل وحوش الارض التي معكم من جميع الخارجين من الفلك حتى كل حيوان الارض اقيم ميثاقي معكم فلا ينقرض كل ذي جسد ايضا بمياه الطوفان ولا يكون ايضا طوفان ليخرب الارض وقال الله هذه علامة الميثاق الذي انا واضعه بيني وبينكم وبين كل ذوات الانفس الحية التي معكم الى اجيال الدهر وضعت قوسي في السحاب فتكون علامة ميثاق بيني وبين الارض فيكون متى انشر سحابا على الارض وتظهر القوس في السحاب اني اذكر ميثاقي الذي بيني وبينكم وبين كل نفس حية في كل جسد فلا تكون ايضا المياه طوفانا لتهلك كل ذي جسد فمتى كانت القوس في السحاب ابصرها لاذكر ميثاقا ابديا بين الله وبين كل نفس حية في كل جسد على الارض وقال الله لنوح هذه علامة الميثاق الذي اقمته بيني وبين كل ذي جسد على الارض وكان بنو نوح الذين خرجوا من الفلك ساما وحاما ويافث وحام هو ابو كنعان هؤلاء الثلاثة هم بنو نوح ومن هؤلاء تشعبت كل الارض وابتدا نوح يكون فلاحا وغرس كرما وشرب من الخمر فسكر وتعرى داخل خبائه فابصر حام ابو كنعان عورة ابيه واخبر اخويه خارجا فاخذ سام ويافث الرداء ووضعاه على اكتافهما ومشيا الى الوراء وسترا عورة ابيهما ووجههما الى الوراء فلم يبصرا عورة ابيهما فلما استيقظ نوح من خمره علم ما فعل به ابنه الصغير فقال ملعون كنعان عبد العبيد يكون لاخوته وقال مبارك الرب اله سام وليكن كنعان عبدا لهم ليفتح الله ليافث فيسكن في خيام سام وليكن كنعان عبدا لهم وعاش نوح بعد الطوفان ثلاث مئة وخمسين سنة فكانت كل ايام نوح تسع مئة وخمسين سنة ومات`;
  const jsonWords = jsonText.split(/\s+/);

  console.log("DB Length:", dbWords.length, "JSON Length:", jsonWords.length);

  let d = 0, j = 0;
  while (d < dbWords.length && j < jsonWords.length) {
      const wD = dbWords[d].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي').replace(/ّ/g,'');
      const wJ = jsonWords[j].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي');
      
      if (wD !== wJ && wD.replace(/ي/g,'ى') !== wJ.replace(/ي/g,'ى')) {
          console.log("Mismatch at DB pos", d, ": DB =", dbWords[d], "| JSON =", jsonWords[j]);
          // Check if JSON missed a word
          if (dbWords[d+1] && dbWords[d+1].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى') === wJ.replace(/ي/g,'ى')) {
             console.log("-> JSON MISSED word:", dbWords[d]);
             d++;
          }
          // Check if JSON missed TWO words
          else if (dbWords[d+2] && dbWords[d+2].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى') === wJ.replace(/ي/g,'ى')) {
             console.log("-> JSON MISSED 2 words:", dbWords[d], dbWords[d+1]);
             d += 2;
          }
          // Check if JSON inserted a word
          else if (wD.replace(/ي/g,'ى') === (jsonWords[j+1] && jsonWords[j+1].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي'))) {
             console.log("-> JSON INSERTED word:", jsonWords[j]);
             j++;
          }
          // Check if JSON inserted TWO words
          else if (wD.replace(/ي/g,'ى') === (jsonWords[j+2] && jsonWords[j+2].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').replace(/ي/g, 'ي'))) {
             console.log("-> JSON INSERTED 2 words:", jsonWords[j], jsonWords[j+1]);
             j += 2;
          }
          else {
             d++; j++;
          }
      } else {
          d++;
          j++;
      }
  }
}
test();
