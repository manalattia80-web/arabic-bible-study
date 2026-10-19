const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';
function q(sql) { return JSON.parse(execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' })); }

const sql = `
BEGIN TRANSACTION;

-- Acts 27:30
UPDATE word_mappings SET strongs_id = 'G4143', orig_word = 'πλοῖον', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 27 AND verse_num = 30) AND ar_word_position = 8;

UPDATE word_mappings SET strongs_id = 'G4392', orig_word = 'πρόφασις', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 27 AND verse_num = 30) AND ar_word_position = 13;

-- Jas 2:6
UPDATE word_mappings SET strongs_id = 'G1519', orig_word = 'εἰς', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 59 AND chapter_num = 2 AND verse_num = 6) AND ar_word_position = 11;

UPDATE word_mappings SET strongs_id = 'G2922', orig_word = 'κριτήριον', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 59 AND chapter_num = 2 AND verse_num = 6) AND ar_word_position = 12;

-- Gal 3:15
UPDATE word_mappings SET strongs_id = 'G2964', orig_word = 'κυρόω', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 3 AND verse_num = 15) AND ar_word_position = 11;

UPDATE word_mappings SET strongs_id = NULL, orig_word = '---', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 3 AND verse_num = 15) AND ar_word_position = 17;

-- Col 2:5
UPDATE word_mappings SET strongs_id = 'G5010', orig_word = 'τάξις', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 51 AND chapter_num = 2 AND verse_num = 5) AND ar_word_position = 13;

UPDATE word_mappings SET strongs_id = 'G4733', orig_word = 'στερέωμα', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 51 AND chapter_num = 2 AND verse_num = 5) AND ar_word_position = 14;

COMMIT;
`;

execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
console.log('Position fixes applied successfully!');
