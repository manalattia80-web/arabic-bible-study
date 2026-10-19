const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const out = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return out && out.trim() ? JSON.parse(out) : [];
}

const list = [
  { ref: 'John 7:50', b: 43, c: 7, v: 50, word: 'نيقوديموس', expectedTgt: 'G3530' },
  { ref: 'Mark 14:56', b: 41, c: 14, v: 56, word: 'تتفق', expectedTgt: 'G2470' },
  { ref: '2 Cor 11:32', b: 47, c: 11, v: 32, word: 'الوالي', expectedTgt: 'G1481' },
  { ref: 'Mark 2:22', b: 41, c: 2, v: 22, word: 'الزقاق', expectedTgt: 'G779' },
  { ref: 'Mark 11:2', b: 41, c: 11, v: 2, word: 'جحش', expectedTgt: 'G4454' },
  { ref: 'Mark 14:38', b: 41, c: 14, v: 38, word: 'اسهروا', expectedTgt: 'G1127' },
  { ref: 'Mark 14:68', b: 41, c: 14, v: 68, word: 'الدهليز', expectedTgt: 'G4259' },
  { ref: 'Mark 15:40', b: 41, c: 15, v: 40, word: 'سالومة', expectedTgt: 'G4539' },
  { ref: 'Mark 16:1', b: 41, c: 16, v: 1, word: 'سالومة', expectedTgt: 'G4539' },
  { ref: 'Luke 1:15', b: 42, c: 1, v: 15, word: 'مسكرا', expectedTgt: 'G4608' },
  { ref: 'Luke 3:16', b: 42, c: 3, v: 16, word: 'سيور', expectedTgt: 'G2438' },
  { ref: 'Luke 8:3', b: 42, c: 8, v: 3, word: 'يونا', expectedTgt: 'G2489' },
  { ref: 'Luke 13:4', b: 42, c: 13, v: 4, word: 'سلوام', expectedTgt: 'G4610' }
];

list.forEach(item => {
  const verse = q(`SELECT id, text_avd_ar FROM verses WHERE book_id = ${item.b} AND chapter_num = ${item.c} AND verse_num = ${item.v};`);
  if (!verse.length) {
    console.log(`${item.ref}: verse not found`);
    return;
  }
  const mappings = q(`SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = '${verse[0].id}';`);
  const cleanWord = item.word.replace(/[\u064B-\u065F\u0670]/g, '');
  const found = mappings.filter(m => {
    const cleanAr = (m.ar_word || '').replace(/[\u064B-\u065F\u0670]/g, '');
    return cleanAr.includes(cleanWord) || cleanWord.includes(cleanAr);
  });
  console.log(`${item.ref} (${item.word}) -> found ${found.length} mappings:`, found.map(f => `pos ${f.ar_word_position}: "${f.ar_word}" -> ${f.strongs_id} (${f.orig_word})`).join('; '));
});
