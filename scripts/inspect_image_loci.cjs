const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function query(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_check_img.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('=== Checking 23 records with Strongs but placeholder orig_word ===');
const sql23 = `
SELECT wm.id, v.book_id, v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface, wm.morph_pos
FROM word_mappings wm
JOIN verses v ON wm.verse_id = v.id
WHERE wm.strongs_id IS NOT NULL 
  AND trim(coalesce(wm.orig_word, '')) IN ('', '-', '---', '—')
ORDER BY v.book_id, v.chapter_num, v.verse_num;
`;
const rows23 = query(sql23);
console.log(`Count: ${rows23 ? rows23.split('\n').length : 0}`);
console.log(rows23);

console.log('\n=== Checking Image Loci in our DB ===');
const loci = [
  { book: 45, ch: 1, vs: 20, word: '%الْمَنْظُورَةِ%', label: 'Rom 1:20 المنظورة' },
  { book: 46, ch: 1, vs: 2, word: '%يُدْعَوْنَ%', label: '1Cor 1:2 يدعون' },
  { book: 46, ch: 1, vs: 11, word: '%خُلُوِي%', label: '1Cor 1:11 خلوي' },
  { book: 46, ch: 2, vs: 1, word: '%بِسُمُوِّ%', label: '1Cor 2:1 بسمو' },
  { book: 46, ch: 2, vs: 10, word: '%نَحْنُ%', label: '1Cor 2:10 نحن' },
  { book: 47, ch: 1, vs: 10, word: '%مِثْلِ%', label: '2Cor 1:10 مثل' },
  { book: 47, ch: 1, vs: 10, word: '%هذَا%', label: '2Cor 1:10 هذا' },
  { book: 47, ch: 1, vs: 11, word: '%لَنَا%', label: '2Cor 1:11 لنا' },
  { book: 47, ch: 1, vs: 24, word: '%مُوَازِرُونَ%', label: '2Cor 1:24 موازِرون' },
  { book: 48, ch: 2, vs: 4, word: '%الْكَذَبَةِ%', label: 'Gal 2:4 الكذبة' }
];

for (const l of loci) {
  const q = `
    SELECT wm.id, v.book_id, v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface, wm.morph_pos, wm.morph_source
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    WHERE v.book_id = ${l.book} AND v.chapter_num = ${l.ch} AND v.verse_num = ${l.vs} AND wm.ar_word LIKE '${l.word}';
  `;
  console.log(`\n${l.label}:`);
  console.log(query(q));
}
