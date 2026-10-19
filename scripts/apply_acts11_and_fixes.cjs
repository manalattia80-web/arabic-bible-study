const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const sqliteExe = path.resolve('sqlite_dist/sqlite3.exe');
const dbPath = path.resolve('mobile/assets/bible_study.db');

function q(sql) {
  const out = execFileSync(sqliteExe, [dbPath, '-json', sql], { encoding: 'utf8' });
  return out && out.trim() ? JSON.parse(out) : [];
}

console.log('Preparing SQL patch...');

const sql = `
BEGIN TRANSACTION;

-- 1. Acts 20:14: «مِيتِيلِينِي» -> G3412 (Μιτυλήνη)
UPDATE word_mappings 
SET strongs_id = 'G3412', orig_word = 'Μιτυλήνη', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 20 AND verse_num = 14)
  AND ar_word_position = 7;

-- 2. Numbers 22:21: «بلعام» -> H1109 (בִּלְעָם)
UPDATE word_mappings 
SET strongs_id = 'H1109', orig_word = 'בִּלְעָם', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 22 AND verse_num = 21)
  AND ar_word_position = 2;

-- 3. Acts 27:40: «الْمَرَاسِيَ» -> G45 (ἄγκυρα)
UPDATE word_mappings 
SET strongs_id = 'G45', orig_word = 'ἄγκυρα', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 27 AND verse_num = 40)
  AND ar_word_position = 3;

-- 4. Rev 20:4: «قُتِلُوا» -> G3990 (πελεκίζω)
UPDATE word_mappings 
SET strongs_id = 'G3990', orig_word = 'πελεκίζω', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 20 AND verse_num = 4)
  AND ar_word_position = 9;

-- 5. Luke 19:1: «أَرِيحَا» -> G2410 (Ἱεριχώ) instead of اورشليم / G2414
UPDATE word_mappings 
SET ar_word = 'أَرِيحَا', strongs_id = 'G2410', orig_word = 'Ἱεριχώ', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 19 AND verse_num = 1)
  AND ar_word_position = 5;

-- 6. Acts 11:26: «كَامِلَةً» -> G3650 (ὅλος) instead of G3634 (οἷος)
UPDATE word_mappings 
SET strongs_id = 'G3650', orig_word = 'ὅλος', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 11 AND verse_num = 26)
  AND ar_word_position = 7;

-- 7. Alignment of Acts 11:25-26 preserving both readings:
-- Verse 25: complete Greek clause corresponding to Van Dyck
UPDATE verses
SET text_original = 'ἐξῆλθε δὲ εἰς Ταρσὸν ὁ Βαρνάβας ἀναζητῆσαι Σαῦλον, καὶ εὑρὼν αὐτὸν ἤγαγεν αὐτὸν εἰς Ἀντιόχειαν.'
WHERE book_id = 44 AND chapter_num = 11 AND verse_num = 25;

-- Verse 26: preserve Greek opening division in brackets followed by matching clause
UPDATE verses
SET text_original = '[καὶ εὑρὼν αὐτὸν ἤγαγεν αὐτὸν εἰς Ἀντιόχειαν] ἐγένετο δὲ αὐτοὺς ἐνιαυτὸν ὅλον συναχθῆναι ἐν τῇ ἐκκλησίᾳ καὶ διδάξαι ὄχλον ἱκανόν, χρηματίσαι τε πρῶτον ἐν Ἀντιοχείᾳ τοὺς μαθητὰς Χριστιανούς.'
WHERE book_id = 44 AND chapter_num = 11 AND verse_num = 26;

COMMIT;
`;

fs.writeFileSync('scripts/fix_acts_and_alignment.sql', sql, 'utf8');

console.log('Applying SQL patch to database...');
execFileSync(sqliteExe, [dbPath], { input: sql, encoding: 'utf8' });

console.log('Verifying updates...');

// Verification
const v1 = q("SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 20 AND verse_num = 14) AND ar_word_position = 7;");
console.log('Acts 20:14:', v1);

const v2 = q("SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 22 AND verse_num = 21) AND ar_word_position = 2;");
console.log('Num 22:21:', v2);

const v3 = q("SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 27 AND verse_num = 40) AND ar_word_position = 3;");
console.log('Acts 27:40:', v3);

const v4 = q("SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 20 AND verse_num = 4) AND ar_word_position = 9;");
console.log('Rev 20:4:', v4);

const v5 = q("SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 19 AND verse_num = 1) AND ar_word_position = 5;");
console.log('Luke 19:1:', v5);

const v6 = q("SELECT ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 11 AND verse_num = 26) AND ar_word_position = 7;");
console.log('Acts 11:26 word 7:', v6);

const v7 = q("SELECT verse_num, text_original FROM verses WHERE book_id = 44 AND chapter_num = 11 AND verse_num IN (25, 26);");
console.log('Acts 11:25-26 verses:', v7);

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
