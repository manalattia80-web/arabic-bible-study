const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function executeSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_v39.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('Applying comprehensive database v39 elevation...');

const sql = `
BEGIN TRANSACTION;

-- 1. Gen 3:6 pos 9: 'لِلْعُيُونِ' -> H5869 (עַיִן / eye) instead of H5879 (עֵינַיִם / Enam place name)
UPDATE word_mappings 
SET strongs_id = 'H5869', orig_word = 'עַיִן', orig_surface = 'לָעֵינַיִם', morph_pos = 'noun', morph_source = 'oshb_wlc'
WHERE id = '0a5e49f7-ab06-40fe-8f06-5eac96ea4167';

UPDATE word_mapping_strongs 
SET strongs_id = 'H5869', orig_component = 'לָעֵינַיִם'
WHERE mapping_id = '0a5e49f7-ab06-40fe-8f06-5eac96ea4167';

-- 2. Gen 3:6 pos 13: 'لِلنَّظَرِ' -> H7919 (שָׂכַל / לְהַשְׂכִּיל / to make wise, contemplate) instead of H7200 (רָאָה)
UPDATE word_mappings 
SET strongs_id = 'H7919', orig_word = 'שָׂכַל', orig_surface = 'לְהַשְׂכִּיל', morph_pos = 'verb', morph_source = 'oshb_wlc'
WHERE id = '48efac3f-9748-4c10-9508-f6da552bf563';

UPDATE word_mapping_strongs 
SET strongs_id = 'H7919', orig_component = 'לְהַשְׂכִּיל'
WHERE mapping_id = '48efac3f-9748-4c10-9508-f6da552bf563';

-- 3. Job 31:14 pos 4: 'حِينَ' -> כִּי instead of מִן
UPDATE word_mappings
SET orig_word = 'כִּי', orig_surface = 'כִּי', morph_pos = 'conjunction', morph_source = 'oshb_wlc'
WHERE id = '53967738-9d10-4fbb-8026-459c820c6a56';

UPDATE word_mapping_strongs
SET orig_component = 'כִּי'
WHERE mapping_id = '53967738-9d10-4fbb-8026-459c820c6a56' AND strongs_id = 'H3588';

-- 4. Matt 17:20 pos 18: 'لِهذَا' -> G3778 (οὗτος / τούτῳ) and remove orphan G1223
UPDATE word_mappings
SET strongs_id = 'G3778', orig_word = 'οὗτος', orig_surface = 'τούτῳ', morph_pos = 'pronoun', morph_source = 'morphgnt_sblgnt'
WHERE id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee';

DELETE FROM word_mapping_strongs WHERE mapping_id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee' AND strongs_id = 'G1223';
UPDATE word_mapping_strongs SET orig_component = 'τούτῳ' WHERE mapping_id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee' AND strongs_id = 'G3778';

-- 5. Gen 3:18 pos 4: 'لَكَ' -> restore orig_word 'לְ' and orig_surface 'לָךְ'
UPDATE word_mappings
SET orig_word = 'לְ', orig_surface = 'לָךְ', morph_pos = 'preposition', morph_source = 'oshb_wlc'
WHERE id = 'fba6dab6-e8af-4b6a-8d43-b7a9f0350b40';

-- 6. Judg 7:9 pos 5: 'أَنَّ' -> remove obsolete orphan multi mapping
DELETE FROM word_mapping_strongs WHERE mapping_id = '85d15835-9458-4420-a121-7498ee807f04';

-- 7. Gen 41:46 pos 6: 'لَمَّا' -> remove obsolete orphan multi mapping
DELETE FROM word_mapping_strongs WHERE mapping_id = '00631fcc-120b-4db8-942f-d3882cf8e319';

COMMIT;
`;

executeSql(sql);
console.log('SQL transaction applied successfully!');

// Verification queries
console.log('\n--- Verification 1: Gen 3:6 pos 9 and 13 ---');
console.log(executeSql(`
SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface, wms.strongs_id as wms_strongs
FROM word_mappings wm JOIN word_mapping_strongs wms ON wm.id = wms.mapping_id
WHERE wm.id IN ('0a5e49f7-ab06-40fe-8f06-5eac96ea4167', '48efac3f-9748-4c10-9508-f6da552bf563');
`));

console.log('\n--- Verification 2: Job 31:14 pos 4 ---');
console.log(executeSql(`
SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface, wms.orig_component
FROM word_mappings wm JOIN word_mapping_strongs wms ON wm.id = wms.mapping_id
WHERE wm.id = '53967738-9d10-4fbb-8026-459c820c6a56';
`));

console.log('\n--- Verification 3: Matt 17:20 pos 18 ---');
console.log(executeSql(`
SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface, wms.strongs_id as wms_strongs, wms.orig_component
FROM word_mappings wm JOIN word_mapping_strongs wms ON wm.id = wms.mapping_id
WHERE wm.id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee';
`));

console.log('\n--- Verification 4: Gen 3:18 pos 4 ---');
console.log(executeSql(`
SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface, wm.morph_pos
FROM word_mappings wm WHERE id = 'fba6dab6-e8af-4b6a-8d43-b7a9f0350b40';
`));

console.log('\n--- Verification 5: Judg 7:9 pos 5 and Gen 41:46 pos 6 orphan multi mappings ---');
const orphanCount = executeSql(`
SELECT count(*) FROM word_mapping_strongs WHERE mapping_id IN ('85d15835-9458-4420-a121-7498ee807f04', '00631fcc-120b-4db8-942f-d3882cf8e319');
`);
console.log('Remaining orphan rows:', orphanCount);
