const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const out = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return out && out.trim() ? JSON.parse(out) : [];
}

console.log('=== 1. Acts 20:14 (Mitylene) ===');
const acts20_14 = q("SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.orig_word, wm.strongs_id, se.original_word, se.transliteration FROM word_mappings wm LEFT JOIN strongs_entries se ON wm.strongs_id = se.strongs_id WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 20 AND verse_num = 14);");
console.log(acts20_14);

console.log('\n=== 2. Numbers 22:21 (Balaam) ===');
const num22_21 = q("SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.orig_word, wm.strongs_id, se.original_word, se.transliteration FROM word_mappings wm LEFT JOIN strongs_entries se ON wm.strongs_id = se.strongs_id WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 22 AND verse_num = 21);");
console.log(num22_21);

console.log('\n=== 3. Acts 27:40 (Anchors) ===');
const acts27_40 = q("SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.orig_word, wm.strongs_id, se.original_word, se.transliteration FROM word_mappings wm LEFT JOIN strongs_entries se ON wm.strongs_id = se.strongs_id WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 27 AND verse_num = 40);");
console.log(acts27_40);

console.log('\n=== 4. Rev 20:4 (Beheaded) ===');
const rev20_4 = q("SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.orig_word, wm.strongs_id, se.original_word, se.transliteration FROM word_mappings wm LEFT JOIN strongs_entries se ON wm.strongs_id = se.strongs_id WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 20 AND verse_num = 4);");
console.log(rev20_4);

console.log('\n=== 5. Luke 19:1 (Jericho) ===');
const luke19_1 = q("SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.orig_word, wm.strongs_id, se.original_word, se.transliteration FROM word_mappings wm LEFT JOIN strongs_entries se ON wm.strongs_id = se.strongs_id WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 19 AND verse_num = 1);");
console.log(luke19_1);

console.log('\n=== 6. Acts 11:25-26 (Verses & Mappings) ===');
const acts11 = q("SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 44 AND chapter_num = 11 AND verse_num IN (25, 26);");
console.log(acts11);

const acts11_wm = q("SELECT verse_id, ar_word_position, orig_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 11 AND verse_num IN (25, 26)) ORDER BY verse_id, ar_word_position;");
console.log(acts11_wm);
