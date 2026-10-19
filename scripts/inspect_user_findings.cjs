const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';
function q(sql) { return JSON.parse(execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' })); }

console.log('=== NT Issues ===');
// Luke 3:23
console.log('Luke 3:23:', q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 3 AND verse_num = 23);"));
// Luke 3:25
console.log('Luke 3:25:', q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 3 AND verse_num = 25);"));
// Acts 14:26
console.log('Acts 14:26:', q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 14 AND verse_num = 26);"));
// Acts 16:2
console.log('Acts 16:2:', q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 16 AND verse_num = 2);"));

console.log('\n=== OT Issues ===');
// Exod 18:22
console.log('Exod 18:22:', q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 2 AND chapter_num = 18 AND verse_num = 22);"));
// Exod 25:12
console.log('Exod 25:12:', q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 2 AND chapter_num = 25 AND verse_num = 12);"));
// Lev 11:12
console.log('Lev 11:12:', q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 3 AND chapter_num = 11 AND verse_num = 12);"));

console.log('\n=== 2 entries without Arabic definition ===');
console.log(q("SELECT se.strongs_id, se.original_word, se.language, se.definition_en FROM strongs_entries se LEFT JOIN strongs_ar_translations sat ON se.strongs_id = sat.strongs_id WHERE sat.definition_ar IS NULL OR trim(sat.definition_ar) = '';"));

console.log('\n=== Ezra 5:7 Text & Mappings ===');
const ezra5_7 = q("SELECT id, text_avd_ar, text_original FROM verses WHERE book_id = 15 AND chapter_num = 5 AND verse_num = 7;");
console.log('Ezra 5:7:', ezra5_7);
console.log('Ezra 5:7 Mappings:', q("SELECT ar_word_position, orig_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 5 AND verse_num = 7);"));

// Also check Ezra 5:6 and 5:8 to understand context
console.log('Ezra 5:6:', q("SELECT text_avd_ar, text_original FROM verses WHERE book_id = 15 AND chapter_num = 5 AND verse_num = 6;"));
console.log('Ezra 5:8:', q("SELECT text_avd_ar, text_original FROM verses WHERE book_id = 15 AND chapter_num = 5 AND verse_num = 8;"));
