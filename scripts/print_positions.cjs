const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';
function q(sql) { return JSON.parse(execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' })); }

console.log('Acts 27:30:');
q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 27 AND verse_num = 30);").forEach(r => console.log(r.ar_word_position, r.ar_word, r.strongs_id, r.orig_word));

console.log('Jas 2:6:');
q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 59 AND chapter_num = 2 AND verse_num = 6);").forEach(r => console.log(r.ar_word_position, r.ar_word, r.strongs_id, r.orig_word));

console.log('Gal 3:15:');
q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 3 AND verse_num = 15);").forEach(r => console.log(r.ar_word_position, r.ar_word, r.strongs_id, r.orig_word));

console.log('Col 2:5:');
q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 51 AND chapter_num = 2 AND verse_num = 5);").forEach(r => console.log(r.ar_word_position, r.ar_word, r.strongs_id, r.orig_word));
