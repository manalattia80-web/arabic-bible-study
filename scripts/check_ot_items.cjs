const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';
function q(sql) {
  const out = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return out && out.trim() ? JSON.parse(out) : [];
}

const list = [
  { ref: 'Num 7:72', b: 4, c: 7, v: 72, word: 'عكرن' },
  { ref: 'Esth 1:9', b: 17, c: 1, v: 9, word: 'وشتي' },
  { ref: '1 Chron 8:11', b: 13, c: 8, v: 11, word: 'الفعل' },
  { ref: 'Neh 11:19', b: 16, c: 11, v: 19, word: 'طلمون' },
  { ref: 'Josh 19:26', b: 6, c: 19, v: 26, word: 'مشآل' },
  { ref: '2 Kgs 25:6', b: 12, c: 25, v: 6, word: 'ربلة' },
  { ref: '2 Kgs 25:21', b: 12, c: 25, v: 21, word: 'ربلة' },
  { ref: 'Judg 18:11', b: 7, c: 18, v: 11, word: 'اشتأول' }
];

list.forEach(item => {
  const words = q(`SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${item.b} AND chapter_num = ${item.c} AND verse_num = ${item.v});`);
  const cleanTgt = item.word.replace(/[\u064B-\u065F\u0670]/g, '');
  const matched = words.filter(w => {
    const cleanAr = (w.ar_word || '').replace(/[\u064B-\u065F\u0670]/g, '');
    return cleanAr.includes(cleanTgt);
  });
  console.log(`${item.ref} (${item.word}):`, matched);
});
