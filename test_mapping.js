const fs = require('fs');
const initSqlJs = require('sql.js');

const normalizeArabic = (str) => {
    return str
        .replace(/[\u0617-\u061A\u064B-\u0652\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '') // Remove tashkeel
        .replace(/[أإآٱ]/g, 'ا') // Normalize Alef
        .replace(/ة/g, 'ه') // Normalize Ta Marbuta
        .replace(/ى/g, 'ي'); // Normalize Alef Maksura
};

initSqlJs().then(function(SQL) {
  const filebuffer = fs.readFileSync('dictionary_extracted/assets/databases/strongs.db');
  const db = new SQL.Database(filebuffer);
  
  const text = 'وَبَنُو مِدْيَانَ: عَيْفَةُ وَعِفْرٌ وَحَنُوكُ وَأَبِيدَاعُ وَأَلْدَعَةُ. جَمِيعُ هَؤُلَاءِ بَنُو قَطُورَةَ.';
  const legacyVerseId = 'GEN.25.4';
  
  const strongsRows = db.exec(`SELECT strongId FROM avd_verse_strongs WHERE verseId = '${legacyVerseId}'`);
  if(strongsRows.length === 0) {
      console.log("No strongs for verse in DB!");
      return;
  }
  const verseStrongs = strongsRows[0].values.map(v => v[0]);
  console.log("Verse strongs:", verseStrongs);
  
  const cleanText = text.replace(/[.,:;«»!؟?]/g, '');
  const words = cleanText.split(/\s+/).filter(w => w.trim().length > 0);
  
  console.log("Words:");
  for (let pos = 0; pos < words.length; pos++) {
      const arWord = words[pos];
      const normWord = normalizeArabic(arWord);
      
      const indexRows = db.exec(`SELECT strongId FROM arabic_strong_index WHERE surface = '${normWord.replace(/'/g, "''")}'`);
      
      let matchedStrong = null;
      let allFound = [];
      if (indexRows.length > 0) {
          allFound = indexRows[0].values.map(v => v[0]);
          for (const val of indexRows[0].values) {
              if (verseStrongs.includes(val[0])) {
                  matchedStrong = val[0];
                  break;
              }
          }
      }
      console.log(`Word: ${arWord} | Norm: ${normWord} | All Found in Index: ${allFound} | Matched: ${matchedStrong}`);
  }
});
