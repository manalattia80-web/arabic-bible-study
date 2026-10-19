const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

let sql = 'BEGIN TRANSACTION;\n\n';

// 1. Luke 23:10: الكهنة -> G749, والكتبة -> G1122
console.log('Fixing Luke 23:10...');
sql += `
UPDATE word_mappings 
SET orig_word = 'ἀρχιερεύς', strongs_id = 'G749' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 23 AND verse_num = 10) 
  AND ar_word_position = 3;

UPDATE word_mappings 
SET orig_word = 'γραμματεύς', strongs_id = 'G1122' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 23 AND verse_num = 10) 
  AND ar_word_position = 4;
`;

// 2. Luke 23:11: لباسا -> G2066 (ἐσθής)
console.log('Fixing Luke 23:11...');
sql += `
UPDATE word_mappings 
SET orig_word = 'ἐσθής', strongs_id = 'G2066' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 23 AND verse_num = 11) 
  AND ar_word_position = 8;
`;

// 3. Luke 23:18: لنا -> G2254 (ἡμῖν)
console.log('Fixing Luke 23:18...');
sql += `
UPDATE word_mappings 
SET orig_word = 'ἡμῖν', strongs_id = 'G2254' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 23 AND verse_num = 18) 
  AND ar_word_position = 6;
`;

// 4. Luke 23:39: وإيانا -> G2248 (ἡμᾶς)
console.log('Fixing Luke 23:39...');
sql += `
UPDATE word_mappings 
SET orig_word = 'ἡμᾶς', strongs_id = 'G2248' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 23 AND verse_num = 39) 
  AND ar_word_position = 14;
`;

// 5. Luke 24:20: الكهنة -> G749, وحكامنا -> G758
console.log('Fixing Luke 24:20...');
sql += `
UPDATE word_mappings 
SET orig_word = 'ἀρχιερεύς', strongs_id = 'G749' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 20) 
  AND ar_word_position = 4;

UPDATE word_mappings 
SET orig_word = 'ἄρχων', strongs_id = 'G758' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 20) 
  AND ar_word_position = 5;
`;

// 6. Luke 24:21: ثلاثة -> G5154 (τρίτος)
console.log('Fixing Luke 24:21...');
sql += `
UPDATE word_mappings 
SET orig_word = 'τρίτος', strongs_id = 'G5154' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 21) 
  AND ar_word_position = 16;
`;

// 7. Luke 24:22: حيرننا -> G1839 (ἐξίστημι), كن -> G1096, باكرا -> G3721
console.log('Fixing Luke 24:22...');
sql += `
UPDATE word_mappings 
SET orig_word = 'ἐξίστημι', strongs_id = 'G1839' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 22) 
  AND ar_word_position = 5;

UPDATE word_mappings 
SET orig_word = 'γίνομαι', strongs_id = 'G1096' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 22) 
  AND ar_word_position = 7;

UPDATE word_mappings 
SET orig_word = 'ὄρθριος', strongs_id = 'G3721' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 22) 
  AND ar_word_position = 8;
`;

// 8. Luke 24:32: لنا -> G2254 (ἡμῖν)
console.log('Fixing Luke 24:32...');
sql += `
UPDATE word_mappings 
SET orig_word = 'ἡμῖν', strongs_id = 'G2254' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 32) 
  AND ar_word_position = 14;
`;

// 9. 2 Samuel 12:22: يرحمني -> H2603 (חָנַן)
console.log('Fixing 2 Samuel 12:22...');
sql += `
UPDATE word_mappings 
SET orig_word = 'חָנַן', strongs_id = 'H2603' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 12 AND verse_num = 22) 
  AND ar_word_position = 13;
`;

// 10. 2 Samuel 12:24: وعزى -> H5162 (נָחַם)
console.log('Fixing 2 Samuel 12:24...');
sql += `
UPDATE word_mappings 
SET orig_word = 'נָחַם', strongs_id = 'H5162' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 12 AND verse_num = 24) 
  AND ar_word_position = 1;
`;

// 11. 2 Samuel 12:25: يديديا -> H3041 (יְדִידְיָה)
console.log('Fixing 2 Samuel 12:25...');
sql += `
UPDATE word_mappings 
SET orig_word = 'יְדִידְיָה', strongs_id = 'H3041' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 12 AND verse_num = 25) 
  AND ar_word_position = 7;
`;

// 12. Add verified missing entries to strongs_entries for G1473, G1122, G1848
console.log('Adding verified dictionary entries for G1473, G1122, G1848...');
sql += `
INSERT OR REPLACE INTO strongs_entries (strongs_id, language, original_word, transliteration, definition_en, kjv_usage)
VALUES 
('G1473', 'greek', 'ἐγώ', 'egō', 'I, the first-person singular personal pronoun (expressed for emphasis)', 'I, me'),
('G1122', 'greek', 'γραμματεύς', 'grammateus', 'a writer, scribe, clerk, teacher of the law; among the Jews, one learned in the Mosaic law', 'scribe, townclerk'),
('G1848', 'greek', 'ἐξουθενέω', 'exoutheneō', 'to make of no account, despise utterly, treat with contempt, disdain', 'contemptible, despise, least esteemed, set at nought');
`;

sql += '\nCOMMIT;\n';

console.log('Executing SQL against mobile/assets/bible_study.db...');
execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
console.log('Execution complete!');

// Verification: Check all strongs_id in word_mappings that are missing from strongs_entries
const missingRemaining = q(`
  SELECT DISTINCT wm.strongs_id, count(*) as usage_count
  FROM word_mappings wm
  LEFT JOIN strongs_entries se ON wm.strongs_id = se.strongs_id
  WHERE wm.strongs_id IS NOT NULL AND wm.strongs_id != '' AND se.strongs_id IS NULL
  GROUP BY wm.strongs_id;
`);

console.log('\n>>> REMAINING MISSING STRONGS_IDS IN ENTIRE DATABASE:', missingRemaining);
