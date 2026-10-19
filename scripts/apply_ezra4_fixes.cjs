const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function runSql(sql) {
  return execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
}

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('=== Applying Ezra 4:9-10 Aramaic Lexicon Corrections ===');

const updateSql = `
BEGIN TRANSACTION;

-- Ezra 4:9
UPDATE word_mappings SET strongs_id = 'H3790', orig_word = 'כְּתַב' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 1;
UPDATE word_mappings SET strongs_id = 'H7348', orig_word = 'רְחוּם' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 3;
UPDATE word_mappings SET strongs_id = 'H1169', orig_word = 'בְּעֵל' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 4;
UPDATE word_mappings SET strongs_id = 'H5613', orig_word = 'סָפֵר' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 7;
UPDATE word_mappings SET strongs_id = 'H7606', orig_word = 'שְׁאָר' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 8;
UPDATE word_mappings SET strongs_id = 'H3675', orig_word = 'כְּנָת' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 9;
UPDATE word_mappings SET strongs_id = 'H1784', orig_word = 'דִּינָי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 10;
UPDATE word_mappings SET strongs_id = 'H2967', orig_word = 'טַרְפְּלָי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 12;
UPDATE word_mappings SET strongs_id = 'H670', orig_word = 'אֲפָרְסַי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 13;
UPDATE word_mappings SET strongs_id = 'H756', orig_word = 'אַרְכְּוַי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 14;
UPDATE word_mappings SET strongs_id = 'H896', orig_word = 'בַּבְלִי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 15;
UPDATE word_mappings SET strongs_id = 'H7801', orig_word = 'שׁוּשַׁנְכִי' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 16;
UPDATE word_mappings SET strongs_id = 'H1723', orig_word = 'דַּהֲוָא' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) AND ar_word_position = 17;

-- Ezra 4:10
UPDATE word_mappings SET strongs_id = 'H7606', orig_word = 'שְׁאָר' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 1;
UPDATE word_mappings SET strongs_id = 'H524', orig_word = 'אֻמָּה' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 2;
UPDATE word_mappings SET strongs_id = 'H1541', orig_word = 'גְּלָא' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 4;
UPDATE word_mappings SET strongs_id = 'H620', orig_word = 'אָסְנַפַּר' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 5;
UPDATE word_mappings SET strongs_id = 'H7229', orig_word = 'רַב' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 6;
UPDATE word_mappings SET strongs_id = 'H3358', orig_word = 'יַקִּיר' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 7;
UPDATE word_mappings SET strongs_id = 'H3488', orig_word = 'יְתִב' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 8;
UPDATE word_mappings SET strongs_id = 'H7149', orig_word = 'קִרְיָה' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 9;
UPDATE word_mappings SET strongs_id = 'H8115', orig_word = 'שָׁמְרָיִן' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 10;
UPDATE word_mappings SET strongs_id = 'H7606', orig_word = 'שְׁאָר' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 11;
UPDATE word_mappings SET strongs_id = 'H5675', orig_word = 'עֲבַר' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 14;
UPDATE word_mappings SET strongs_id = 'H5103', orig_word = 'נְהַר' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 15;
UPDATE word_mappings SET strongs_id = 'H3706', orig_word = 'כְּעֶנֶת' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) AND ar_word_position = 17;

COMMIT;
`;

console.log('Executing updates...');
runSql(updateSql);
console.log('Updates complete. Verifying:');

console.log('Ezra 4:9:');
console.log(q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 9) ORDER BY ar_word_position;"));

console.log('\nEzra 4:10:');
console.log(q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 10) ORDER BY ar_word_position;"));
