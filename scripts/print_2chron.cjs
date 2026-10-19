const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';
function q(sql) { return JSON.parse(execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' })); }

console.log('2 Chron 31:12:');
q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 31 AND verse_num = 12);").forEach(r => console.log(r.ar_word_position, r.ar_word, r.strongs_id, r.orig_word));

console.log('2 Chron 31:13:');
q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 31 AND verse_num = 13);").forEach(r => console.log(r.ar_word_position, r.ar_word, r.strongs_id, r.orig_word));

console.log('Isa 47:2:');
q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 2);").forEach(r => console.log(r.ar_word_position, r.ar_word, r.strongs_id, r.orig_word));
