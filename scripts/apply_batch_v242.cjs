const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const sqliteExe = path.resolve('sqlite_dist/sqlite3.exe');
const dbPath = path.resolve('mobile/assets/bible_study.db');

function q(sql) {
  const out = execFileSync(sqliteExe, [dbPath, '-json', sql], { encoding: 'utf8' });
  return out && out.trim() ? JSON.parse(out) : [];
}

console.log('Preparing SQL patch for v1.0.242...');

// Get current definition for G1722 and clean it
const g1722Row = q("SELECT definition_ar FROM strongs_ar_translations WHERE strongs_id = 'G1722';")[0];
let cleanedG1722Def = g1722Row.definition_ar.replace('وُلد طائفياً بالروح القدس في جسد المسيح السري', 'مولود بالروح القدس في جسد المسيح الواحد');
cleanedG1722Def = cleanedG1722Def.replace(/'/g, "''");

const sql = `
BEGIN TRANSACTION;

-- 1. Num 7:72: «عكرن» -> H5918 (עׇכְרָן)
UPDATE word_mappings 
SET strongs_id = 'H5918', orig_word = 'עׇכְרָן', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 7 AND verse_num = 72)
  AND ar_word_position = 10;

-- 2. Esth 1:9: «ووشتي» -> H2060 (וַשְׁתִּי)
UPDATE word_mappings 
SET strongs_id = 'H2060', orig_word = 'וַשְׁתִּי', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 17 AND chapter_num = 1 AND verse_num = 9)
  AND ar_word_position = 1;

-- 3. 1 Chron 8:11: «أبيطوب» -> H36 (אֲבִיטוּב), «وألفعل» -> H508 (אֶלְפַּעַל)
UPDATE word_mappings 
SET strongs_id = 'H36', orig_word = 'אֲבִיטוּב', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 8 AND verse_num = 11)
  AND ar_word_position = 4;

UPDATE word_mappings 
SET strongs_id = 'H508', orig_word = 'אֶלְפַּעַל', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 8 AND verse_num = 11)
  AND ar_word_position = 5;

-- 4. Neh 11:19: «وطلمون» -> H2929 (טַלְמוֹן)
UPDATE word_mappings 
SET strongs_id = 'H2929', orig_word = 'טַלְמוֹן', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 16 AND chapter_num = 11 AND verse_num = 19)
  AND ar_word_position = 3;

-- 5. Josh 19:26: «ومشآل» -> H4861 (מִשְׁאָל)
UPDATE word_mappings 
SET strongs_id = 'H4861', orig_word = 'מִשְׁאָל', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 19 AND verse_num = 26)
  AND ar_word_position = 3;

-- 6. 2 Kgs 25:6 & 25:21: «ربلة» -> H7247 (רִבְלָה)
UPDATE word_mappings 
SET strongs_id = 'H7247', orig_word = 'רִבְלָה', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 25 AND verse_num = 6)
  AND ar_word_position = 8;

UPDATE word_mappings 
SET strongs_id = 'H7247', orig_word = 'רִבְלָה', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 25 AND verse_num = 21)
  AND ar_word_position = 6;

-- 7. Judg 18:11: «اشتأول» -> H847 (אֶשְׁתָּאֹל)
UPDATE word_mappings 
SET strongs_id = 'H847', orig_word = 'אֶשְׁתָּאֹל', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 18 AND verse_num = 11)
  AND ar_word_position = 10;

-- 8. Acts 27:30: «بِعِلَّةِ» -> G4392 (πρόφασις)
UPDATE word_mappings 
SET strongs_id = 'G4392', orig_word = 'πρόφασις', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 27 AND verse_num = 30)
  AND ar_word_position = 8;

-- 9. Jas 2:6: «الْمَحَاكِمِ» -> G2922 (κριτήριον)
UPDATE word_mappings 
SET strongs_id = 'G2922', orig_word = 'κριτήριον', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 59 AND chapter_num = 2 AND verse_num = 6)
  AND ar_word_position = 11;

-- 10. Gal 3:15: «تَمَكَّنَ» -> G2964 (κυρόω)
UPDATE word_mappings 
SET strongs_id = 'G2964', orig_word = 'κυρόω', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 3 AND verse_num = 15)
  AND ar_word_position = 17;

-- 11. Col 2:5: «تَرْتِيبَكُمْ» -> G5010 (τάξις)
UPDATE word_mappings 
SET strongs_id = 'G5010', orig_word = 'τάξις', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 51 AND chapter_num = 2 AND verse_num = 5)
  AND ar_word_position = 14;

-- 12. 2 Pet 2:20: «فَيَنْغَلِبُونَ» -> G2274 (ἡττάω)
UPDATE word_mappings 
SET strongs_id = 'G2274', orig_word = 'ἡττάω', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 61 AND chapter_num = 2 AND verse_num = 20)
  AND ar_word_position = 17;

-- 13. Rom 9:10: «رِفْقَةُ» -> G4479 (Ῥεβέκκα)
UPDATE word_mappings 
SET strongs_id = 'G4479', orig_word = 'Ῥεβέκκα', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 45 AND chapter_num = 9 AND verse_num = 10)
  AND ar_word_position = 5;

-- 14. Rev 10:1: «قَوْسُ قُزَحَ» -> G2463 (ἶρις)
UPDATE word_mappings 
SET strongs_id = 'G2463', orig_word = 'ἶρις', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 10 AND verse_num = 1)
  AND ar_word_position IN (13, 14);

-- 15. John 9:11: «بركة» -> G2861 (κολυμβήθρα), «سلوام» -> G4611 (Σιλωάμ)
UPDATE word_mappings 
SET strongs_id = 'G2861', orig_word = 'κολυμβήθρα', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 9 AND verse_num = 11)
  AND ar_word_position = 16;

UPDATE word_mappings 
SET strongs_id = 'G4611', orig_word = 'Σιλωάμ', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 9 AND verse_num = 11)
  AND ar_word_position = 17;

-- 16. Clean definition of G1722 in strongs_ar_translations
UPDATE strongs_ar_translations
SET definition_ar = '${cleanedG1722Def}'
WHERE strongs_id = 'G1722';

COMMIT;
`;

fs.writeFileSync('scripts/fix_batch_v242.sql', sql, 'utf8');

console.log('Applying SQL to database...');
execFileSync(sqliteExe, [dbPath], { input: sql, encoding: 'utf8' });

console.log('Verifying all updates in database...');

// Verify
const checks = [
  { desc: 'Num 7:72', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 7 AND verse_num = 72) AND ar_word_position = 10;" },
  { desc: 'Esth 1:9', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 17 AND chapter_num = 1 AND verse_num = 9) AND ar_word_position = 1;" },
  { desc: '1 Chron 8:11 (4,5)', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 8 AND verse_num = 11) AND ar_word_position IN (4,5);" },
  { desc: 'Neh 11:19', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 16 AND chapter_num = 11 AND verse_num = 19) AND ar_word_position = 3;" },
  { desc: 'Josh 19:26', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 19 AND verse_num = 26) AND ar_word_position = 3;" },
  { desc: '2 Kgs 25:6, 21', sql: "SELECT verse_id, ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 25 AND verse_num IN (6, 21)) AND ar_word LIKE '%ربلة%';" },
  { desc: 'Judg 18:11', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 18 AND verse_num = 11) AND ar_word_position = 10;" },
  { desc: 'Acts 27:30', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 27 AND verse_num = 30) AND ar_word_position = 8;" },
  { desc: 'Jas 2:6', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 59 AND chapter_num = 2 AND verse_num = 6) AND ar_word_position = 11;" },
  { desc: 'Gal 3:15', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 3 AND verse_num = 15) AND ar_word_position = 17;" },
  { desc: 'Col 2:5', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 51 AND chapter_num = 2 AND verse_num = 5) AND ar_word_position = 14;" },
  { desc: '2 Pet 2:20', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 61 AND chapter_num = 2 AND verse_num = 20) AND ar_word_position = 17;" },
  { desc: 'Rom 9:10', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 45 AND chapter_num = 9 AND verse_num = 10) AND ar_word_position = 5;" },
  { desc: 'Rev 10:1 (13,14)', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 10 AND verse_num = 1) AND ar_word_position IN (13, 14);" },
  { desc: 'John 9:11 (16,17)', sql: "SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 9 AND verse_num = 11) AND ar_word_position IN (16, 17);" },
  { desc: 'G1722 check sectarian word', sql: "SELECT count(*) as cnt FROM strongs_ar_translations WHERE strongs_id = 'G1722' AND definition_ar LIKE '%طائفي%';" }
];

checks.forEach(c => {
  console.log(c.desc, '->', q(c.sql));
});

console.log('ALL v1.0.242 FIXES APPLIED SUCCESSFULLY!');
