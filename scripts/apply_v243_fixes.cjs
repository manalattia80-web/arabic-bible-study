const { execFileSync } = require('child_process');
const fs = require('fs');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function runSql(sql) {
  return execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
}

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('=== Applying v1.0.243 fixes ===');

const updateScript = `
BEGIN TRANSACTION;

-- 1. 1 Chron 7:19 (وأنيعام H5623 -> H593)
UPDATE word_mappings SET strongs_id = 'H593', orig_word = 'אֲנִיעָם'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 7 AND verse_num = 19) AND ar_word_position = 7;

-- 2. Ezra 10:24 (وطالم H2978 -> H2928)
UPDATE word_mappings SET strongs_id = 'H2928', orig_word = 'טֶלֶם'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 10 AND verse_num = 24) AND ar_word_position = 7;

-- 3. Josh 15:41 (ومقيدة H4757 -> H4719)
UPDATE word_mappings SET strongs_id = 'H4719', orig_word = 'מַקֵּדָה'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 15 AND verse_num = 41) AND ar_word_position = 5;

-- 4. 2 Chron 31:12 (كوننيا H3540 -> H3562)
UPDATE word_mappings SET strongs_id = 'H3562', orig_word = 'כּוֹנַנְיָהוּ'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 31 AND verse_num = 12) AND ar_word_position = 9;

-- 5. 2 Chron 31:13 (كوننيا H3540 -> H3562)
UPDATE word_mappings SET strongs_id = 'H3562', orig_word = 'כּוֹנַנְיָהוּ'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 31 AND verse_num = 13) AND ar_word_position = 14;

-- 6. Isa 47:2 (نقابك H6854 -> H6777)
UPDATE word_mappings SET strongs_id = 'H6777', orig_word = 'צַמָּה'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 2) AND ar_word_position = 6;

-- 7. 2 Cor 11:10 (يسد G5410 -> G5420)
UPDATE word_mappings SET strongs_id = 'G5420', orig_word = 'φράσσω'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 47 AND chapter_num = 11 AND verse_num = 10) AND ar_word_position = 8;

UPDATE word_mappings SET strongs_id = 'G1722', orig_word = 'ἐν'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 47 AND chapter_num = 11 AND verse_num = 10) AND ar_word_position = 10;

-- 8. Eph 2:19 (رعية G4826 -> G4847)
UPDATE word_mappings SET strongs_id = 'G4847', orig_word = 'συμπολίτης'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 49 AND chapter_num = 2 AND verse_num = 19) AND ar_word_position = 7;

UPDATE word_mappings SET strongs_id = 'G4862', orig_word = 'σύν'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 49 AND chapter_num = 2 AND verse_num = 19) AND ar_word_position = 8;

-- 9. Col 4:2 (ساهرين G697 -> G1127)
UPDATE word_mappings SET strongs_id = 'G1127', orig_word = 'γρηγορεύω'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 51 AND chapter_num = 4 AND verse_num = 2) AND ar_word_position = 4;

UPDATE word_mappings SET strongs_id = 'G1722', orig_word = 'ἐν'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 51 AND chapter_num = 4 AND verse_num = 2) AND ar_word_position = 5;

-- 10. 2 Tim 3:10 (سيرتي G745 -> G72)
UPDATE word_mappings SET strongs_id = 'G72', orig_word = 'ἀγωγή'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 55 AND chapter_num = 3 AND verse_num = 10) AND ar_word_position = 6;

-- 11. Acts 14:6 (ليكأونية G3032 -> G3071)
UPDATE word_mappings SET strongs_id = 'G3071', orig_word = 'Λυκαονία'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 14 AND verse_num = 6) AND ar_word_position = 6;

-- 12. Heb 4:11 (العصيان G5435 -> G543)
UPDATE word_mappings SET strongs_id = 'G543', orig_word = 'ἀπείθεια'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 58 AND chapter_num = 4 AND verse_num = 11) AND ar_word_position = 11;

-- 13. Acts 4:6 (والإسكندر G742 -> G223)
UPDATE word_mappings SET strongs_id = 'G223', orig_word = 'Ἀλέξανδρος'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 4 AND verse_num = 6) AND ar_word_position = 7;

-- 14. Acts 12:6 (بين G3323 -> G3342 μεταξύ; بسلسلتين G4511 -> G254)
UPDATE word_mappings SET strongs_id = 'G3342', orig_word = 'μεταξύ'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 12 AND verse_num = 6) AND ar_word_position = 13;

UPDATE word_mappings SET strongs_id = 'G254', orig_word = 'ἅλυσις'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 12 AND verse_num = 6) AND ar_word_position = 16;

-- 15. Acts 17:21 (الأثينويون G115 -> G117; يتفرغون G2187 -> G2119)
UPDATE word_mappings SET strongs_id = 'G117', orig_word = 'Ἀθηναῖος'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 17 AND verse_num = 21) AND ar_word_position = 2;

UPDATE word_mappings SET strongs_id = 'G2119', orig_word = 'εὐκαιρέω'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 17 AND verse_num = 21) AND ar_word_position = 7;

-- 16. Acts 28:20 (موثق G4195 -> G4029)
UPDATE word_mappings SET strongs_id = 'G4029', orig_word = 'περίκειμαι'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 28 AND verse_num = 20) AND ar_word_position = 11;

-- 17. Gal 4:31 (إذاً G5183 -> G686)
UPDATE word_mappings SET strongs_id = 'G686', orig_word = 'ἄρα'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 4 AND verse_num = 31) AND ar_word_position = 1;

-- 18. Ezra 4:8 (10 Aramaic false friends corrections)
UPDATE word_mappings SET strongs_id = 'H7348', orig_word = 'רְחוּם' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) AND ar_word_position = 1;
UPDATE word_mappings SET strongs_id = 'H1169', orig_word = 'בְּעֵל' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) AND ar_word_position = 2;
UPDATE word_mappings SET strongs_id = 'H5613', orig_word = 'סָפֵר' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) AND ar_word_position = 5;
UPDATE word_mappings SET strongs_id = 'H3790', orig_word = 'כְּתַב' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) AND ar_word_position = 6;
UPDATE word_mappings SET strongs_id = 'H104', orig_word = 'אִגְּרָא' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) AND ar_word_position = 7;
UPDATE word_mappings SET strongs_id = 'H5922', orig_word = 'עַל' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) AND ar_word_position = 8;
UPDATE word_mappings SET strongs_id = 'H3390', orig_word = 'יְרוּשָׁלֵם' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) AND ar_word_position = 9;
UPDATE word_mappings SET strongs_id = 'H783', orig_word = 'אַרְתַּחְשַׁשְׂתָּא' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) AND ar_word_position = 11;
UPDATE word_mappings SET strongs_id = 'H4430', orig_word = 'מֶלֶךְ' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) AND ar_word_position = 12;
UPDATE word_mappings SET strongs_id = 'H3660', orig_word = 'כְּנֵمָא' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) AND ar_word_position = 13;

-- 18. Classify Biblical Aramaic sections in word_mappings (Dan 2:4b-7:28, Ezra 4:8-6:18, 7:12-26, Jer 10:11)
UPDATE word_mappings 
SET orig_word_lang = 'aramaic'
WHERE id IN (
  SELECT wm.id 
  FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE (
    (v.book_id = 27 AND v.chapter_num = 2 AND v.verse_num = 4 AND wm.ar_word_position >= 5) OR
    (v.book_id = 27 AND v.chapter_num = 2 AND v.verse_num > 4) OR
    (v.book_id = 27 AND v.chapter_num BETWEEN 3 AND 7) OR
    (v.book_id = 15 AND v.chapter_num = 4 AND v.verse_num >= 8) OR
    (v.book_id = 15 AND v.chapter_num = 5) OR
    (v.book_id = 15 AND v.chapter_num = 6 AND v.verse_num <= 18) OR
    (v.book_id = 15 AND v.chapter_num = 7 AND v.verse_num BETWEEN 12 AND 26) OR
    (v.book_id = 24 AND v.chapter_num = 10 AND v.verse_num = 11)
  )
);

COMMIT;
`;

console.log('Running SQL update...');
runSql(updateScript);
console.log('SQL update complete.');

// Verification
console.log('\n--- Verifying Updates ---');
const checks = [
  { name: '1 Chron 7:19', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 7 AND verse_num = 19) AND ar_word_position = 7;" },
  { name: 'Ezra 10:24', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 10 AND verse_num = 24) AND ar_word_position = 7;" },
  { name: 'Josh 15:41', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 15 AND verse_num = 41) AND ar_word_position = 5;" },
  { name: '2 Chron 31:12', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 31 AND verse_num = 12) AND ar_word_position = 9;" },
  { name: '2 Chron 31:13', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 31 AND verse_num = 13) AND ar_word_position = 14;" },
  { name: 'Isa 47:2', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 2) AND ar_word_position = 6;" },
  { name: '2 Cor 11:10', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 47 AND chapter_num = 11 AND verse_num = 10) AND ar_word_position = 8;" },
  { name: 'Eph 2:19', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 49 AND chapter_num = 2 AND verse_num = 19) AND ar_word_position = 7;" },
  { name: 'Col 4:2', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 51 AND chapter_num = 4 AND verse_num = 2) AND ar_word_position = 4;" },
  { name: '2 Tim 3:10', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 55 AND chapter_num = 3 AND verse_num = 10) AND ar_word_position = 6;" },
  { name: 'Acts 14:6', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 14 AND verse_num = 6) AND ar_word_position = 6;" },
  { name: 'Heb 4:11', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 58 AND chapter_num = 4 AND verse_num = 11) AND ar_word_position = 11;" },
  { name: 'Acts 4:6', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 4 AND verse_num = 6) AND ar_word_position = 7;" },
  { name: 'Acts 12:6 (بين)', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 12 AND verse_num = 6) AND ar_word_position = 13;" },
  { name: 'Acts 12:6 (بسلسلتين)', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 12 AND verse_num = 6) AND ar_word_position = 16;" },
  { name: 'Acts 17:21 (الأثينويون)', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 17 AND verse_num = 21) AND ar_word_position = 2;" },
  { name: 'Acts 17:21 (يتفرغون)', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 17 AND verse_num = 21) AND ar_word_position = 7;" },
  { name: 'Acts 28:20', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 28 AND verse_num = 20) AND ar_word_position = 11;" },
  { name: 'Gal 4:31', sql: "SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 4 AND verse_num = 31) AND ar_word_position = 1;" },
  { name: 'Ezra 4:8 (all)', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 8) ORDER BY ar_word_position;" },
];

for (const c of checks) {
  console.log(`${c.name}:`, q(c.sql));
}

const aramaicUpdated = q("SELECT count(*) as aramaic_words FROM word_mappings WHERE orig_word_lang = 'aramaic';");
console.log('\nTotal Aramaic word mappings now:', aramaicUpdated[0].aramaic_words);
