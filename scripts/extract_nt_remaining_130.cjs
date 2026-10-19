const fs = require('fs');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

const gnt = JSON.parse(fs.readFileSync('scripts/data/gnt_scrivener.json', 'utf8'));

const unmapped = q(`
  SELECT v.id, v.book_id, b.name_en, v.chapter_num, v.verse_num, v.text_avd_ar 
  FROM verses v 
  JOIN books b ON v.book_id = b.id 
  WHERE v.book_id >= 40 AND v.id NOT IN (SELECT DISTINCT verse_id FROM word_mappings) 
  ORDER BY v.book_id, v.chapter_num, v.verse_num;
`);

console.log(`Found ${unmapped.length} unmapped verses in NT.`);

// Map book names between DB and gnt_scrivener
const bookNameMap = {
  'Matthew': 'Matthew',
  'Luke': 'Luke',
  'Acts': 'Acts',
  'Romans': 'Romans',
  '1 Timothy': '1 Timothy',
  'Hebrews': 'Hebrews',
  'Revelation': 'Revelation'
};

const data = unmapped.map(v => {
  const gName = bookNameMap[v.name_en] || v.name_en;
  const gv = gnt.find(x => x.book_name.toLowerCase().includes(gName.toLowerCase()) && x.chapter === v.chapter_num && x.verse === v.verse_num);
  
  return {
    verse_id: v.id,
    book_id: v.book_id,
    chapter_num: v.chapter_num,
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

fs.writeFileSync('scripts/nt_remaining_130_data.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Saved to scripts/nt_remaining_130_data.json');
