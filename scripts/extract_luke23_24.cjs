const fs = require('fs');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

const gnt = JSON.parse(fs.readFileSync('scripts/data/gnt_scrivener.json', 'utf8'));

for (const ch of [23, 24]) {
  const verses = q(`SELECT id, verse_num, text_avd_ar FROM verses WHERE book_id = 42 AND chapter_num = ${ch} ORDER BY verse_num;`);
  console.log(`Luke ${ch}: ${verses.length} verses.`);
  
  const data = verses.map(v => {
    const gv = gnt.find(x => x.book_name === 'Luke' && x.chapter === ch && x.verse === v.verse_num);
    return {
      verse_id: v.id,
      verse_num: v.verse_num,
      ar_text: v.text_avd_ar,
      ar_tokens: v.text_avd_ar.split(/\s+/).filter(Boolean),
      greek_words: gv ? gv.words.map((w, idx) => ({
        idx: idx + 1,
        greek: w.greek,
        lemma: w.dictionary_form,
        strong: 'G' + w.strong,
        gloss: w.definition
      })) : []
    };
  });
  
  fs.writeFileSync(`scripts/luke${ch}_data.json`, JSON.stringify(data, null, 2), 'utf8');
}

console.log('Saved Luke 23 and 24 data.');
