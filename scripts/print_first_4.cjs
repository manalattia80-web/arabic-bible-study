const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';
function q(sql) { return JSON.parse(execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' })); }

console.log('Acts 20:14:');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 20 AND verse_num = 14);"));

console.log('Numbers 22:21:');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 22 AND verse_num = 21);"));

console.log('Acts 27:40:');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 27 AND verse_num = 40);"));

console.log('Rev 20:4:');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 20 AND verse_num = 4);"));
