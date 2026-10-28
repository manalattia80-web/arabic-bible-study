const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'temp_apply.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${db}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

console.log('--- Applying Release 311 / Database v41 Repairs ---');

const sql = `
BEGIN TRANSACTION;

-- 1. Ensure Strong's entries exist for H3807a and H9005
INSERT OR REPLACE INTO strongs_entries (strongs_id, language, original_word, transliteration, definition_en, kjv_usage)
VALUES 
  ('H3807a', 'hebrew', 'לָנוּ', 'lâ-nû', 'Preposition with 1st person plural pronoun suffix: to us, for us', 'to us, for us'),
  ('H9005', 'hebrew', 'לְ', 'lᵉ-', 'Inseparable preposition: to, for, toward, belonging to', 'to, for, at, into');

-- 2. John 3:16 pos 16 ("بِهِ"): Token 19 (αὐτόν), compound G846 (primary) + G1519 (prefix preposition εἰς)
UPDATE word_mappings 
SET 
  orig_word_position = 19,
  verified_locator = 'SBLGNT:B43.C3.V16.w19',
  morph_source = 'morphgnt_sblgnt',
  verified_source = 'SBLGNT',
  relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 3 AND verse_num = 16)
  AND ar_word_position = 16;

DELETE FROM word_mapping_strongs 
WHERE mapping_id = (
  SELECT id FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 3 AND verse_num = 16)
    AND ar_word_position = 16
);

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
SELECT id, 'G846', 1, 'primary', 'αὐτόν'
FROM word_mappings 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 3 AND verse_num = 16)
  AND ar_word_position = 16;

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
SELECT id, 'G1519', 2, 'prefix', 'εἰς'
FROM word_mappings 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 3 AND verse_num = 16)
  AND ar_word_position = 16;

-- 3. Acts 1:8 pos 10 ("لِي"): Token 12 (μου)
UPDATE word_mappings 
SET 
  orig_word_position = 12,
  verified_locator = 'SBLGNT:B44.C1.V8.w12',
  morph_source = 'morphgnt_sblgnt',
  verified_source = 'SBLGNT',
  relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 1 AND verse_num = 8)
  AND ar_word_position = 10;

-- 4. Eph 2:8 pos 5 ("وَذلِكَ"): Token 9 (τοῦτο), compound G3778 (primary) + G2532 (prefix conjunction καί)
UPDATE word_mappings 
SET 
  orig_word_position = 9,
  verified_locator = 'SBLGNT:B49.C2.V8.w9',
  morph_source = 'morphgnt_sblgnt',
  verified_source = 'SBLGNT',
  relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 49 AND chapter_num = 2 AND verse_num = 8)
  AND ar_word_position = 5;

DELETE FROM word_mapping_strongs 
WHERE mapping_id = (
  SELECT id FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 49 AND chapter_num = 2 AND verse_num = 8)
    AND ar_word_position = 5
);

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
SELECT id, 'G3778', 1, 'primary', 'τοῦτο'
FROM word_mappings 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 49 AND chapter_num = 2 AND verse_num = 8)
  AND ar_word_position = 5;

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
SELECT id, 'G2532', 2, 'prefix', 'καί'
FROM word_mappings 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 49 AND chapter_num = 2 AND verse_num = 8)
  AND ar_word_position = 5;

-- 5. Rev 21:4 pos 19 ("وَجَعٌ"): Token 20 (πόνος)
UPDATE word_mappings 
SET 
  orig_word_position = 20,
  verified_locator = 'SBLGNT:B66.C21.V4.w20',
  morph_source = 'morphgnt_sblgnt',
  verified_source = 'SBLGNT',
  relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 21 AND verse_num = 4)
  AND ar_word_position = 19;

-- Rev 21:4 pos 27 ("مَضَتْ"): Token 26 (ἀπῆλθαν)
UPDATE word_mappings 
SET 
  orig_surface = 'ἀπῆλθαν',
  orig_word_position = 26,
  verified_locator = 'SBLGNT:B66.C21.V4.w26',
  morph_source = 'morphgnt_sblgnt',
  verified_source = 'SBLGNT',
  relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 21 AND verse_num = 4)
  AND ar_word_position = 27;

-- 6. Isaiah 53:5 Metadata, UI Alignment, and WLC Positions
-- Word 1: وَهُوَ
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'primary', orig_word_position = 1, verified_locator = 'OSHB:B23.C53.V5.w1'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 1;

-- Word 2: مَجْرُوحٌ
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'primary', orig_word_position = 2, verified_locator = 'OSHB:B23.C53.V5.w2'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 2;

-- Word 3: لأَجْلِ
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'prefix', orig_word_position = 3, verified_locator = 'OSHB:B23.C53.V5.w3'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 3;

-- Word 4: مَعَاصِينَا
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'primary', orig_word_position = 3, verified_locator = 'OSHB:B23.C53.V5.w3'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 4;

-- Word 5: مَسْحُوقٌ
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'primary', orig_word_position = 4, verified_locator = 'OSHB:B23.C53.V5.w4'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 5;

-- Word 6: لأَجْلِ
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'prefix', orig_word_position = 5, verified_locator = 'OSHB:B23.C53.V5.w5'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 6;

-- Word 7: آثَامِنَا
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'primary', orig_word_position = 5, verified_locator = 'OSHB:B23.C53.V5.w5'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 7;

-- Word 8: تَأْدِيبُ
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'primary', orig_word_position = 6, verified_locator = 'OSHB:B23.C53.V5.w6'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 8;

-- Word 9: سَلاَمِنَا
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'primary', orig_word_position = 7, verified_locator = 'OSHB:B23.C53.V5.w7'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 9;

-- Word 10: عَلَيْهِ
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'primary', orig_word_position = 8, verified_locator = 'OSHB:B23.C53.V5.w8'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 10;

-- Word 11: وَبِحُبُرِهِ
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'primary', orig_word_position = 9, verified_locator = 'OSHB:B23.C53.V5.w9'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 11;

-- Word 12: شُفِينَا (Compound H7495 + H3807a)
UPDATE word_mappings 
SET morph_source = 'oshb_wlc', verified_source = 'OSHB', relation_type = 'primary', orig_word_position = 10, verified_locator = 'OSHB:B23.C53.V5.w10'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5) AND ar_word_position = 12;

DELETE FROM word_mapping_strongs 
WHERE mapping_id = (
  SELECT id FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5)
    AND ar_word_position = 12
);

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
SELECT id, 'H7495', 1, 'primary', 'נִרְפָּא'
FROM word_mappings 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5)
  AND ar_word_position = 12;

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
SELECT id, 'H3807a', 2, 'suffix', 'לָנוּ'
FROM word_mappings 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5)
  AND ar_word_position = 12;

COMMIT;
`;

runSql(sql);
console.log('--- Successfully applied database updates ---');
