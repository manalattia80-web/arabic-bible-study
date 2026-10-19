const fs = require('fs');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

const gnt = JSON.parse(fs.readFileSync('scripts/data/gnt_scrivener.json', 'utf8'));

const verses = q("SELECT id, verse_num, text_avd_ar FROM verses WHERE book_id = 40 AND chapter_num = 28 ORDER BY verse_num;");

console.log(`Found ${verses.length} verses in Matthew 28.`);

const dataForAlignment = [];

for (const v of verses) {
  const gv = gnt.find(x => x.book_name === 'Matthew' && x.chapter === 28 && x.verse === v.verse_num);
  dataForAlignment.push({
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
  });
}

fs.writeFileSync('scripts/matthew28_data.json', JSON.stringify(dataForAlignment, null, 2), 'utf8');
console.log('Saved to scripts/matthew28_data.json');
