const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';
function q(sql) { return JSON.parse(execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' })); }
console.log('Acts 4:6:');
q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 4 AND verse_num = 6);").forEach(r => console.log(r.ar_word_position, r.ar_word, r.strongs_id, r.orig_word));
