const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../bible_study.db');
const sqlitePath = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function runSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_patch.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { encoding: 'utf8' }).trim();
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('--- Applying Component & Lexical Refinements to Isaiah 40:8 and Micah 6:8 ---');

const sql = `
BEGIN TRANSACTION;

-- 1. Isaiah 40:8 Word 9 ("إِلَى")
-- Point to preposition prefix לְ (H9005, HR, w8)
UPDATE word_mappings
SET orig_word = 'לְ',
    orig_surface = 'לְ',
    strongs_id = 'H9005',
    orig_morphology = 'HR',
    morph_pos = 'preposition',
    verified_locator = 'OSHB:B23.C40.V8.w8',
    orig_word_position = 8
WHERE id = 'c168c85c-9997-4a89-a748-471ac0d38f5e';

UPDATE word_mapping_strongs
SET strongs_id = 'H9005',
    orig_component = 'לְ',
    orig_morphology = 'HR',
    orig_word_position = 8,
    morph_source = 'oshb_wlc'
WHERE mapping_id = 'c168c85c-9997-4a89-a748-471ac0d38f5e' AND link_order = 1;

-- 2. Isaiah 40:8 Word 10 ("الأَبَدِ")
-- Point to noun עוֹלָם (H5769, HNcmsa, w8)
UPDATE word_mappings
SET orig_word = 'עוֹלָם',
    orig_surface = 'עוֹלָם',
    strongs_id = 'H5769',
    orig_morphology = 'HNcmsa',
    morph_pos = 'noun',
    verified_locator = 'OSHB:B23.C40.V8.w8',
    orig_word_position = 8
WHERE id = '6952af05-85ff-4953-affb-0ee54aecec31';

UPDATE word_mapping_strongs
SET strongs_id = 'H5769',
    orig_component = 'עוֹלָם',
    orig_morphology = 'HNcmsa',
    orig_word_position = 8,
    morph_source = 'oshb_wlc'
WHERE mapping_id = '6952af05-85ff-4953-affb-0ee54aecec31' AND link_order = 1;

-- 3. Micah 6:8 Word 2 ("أَخْبَرَكَ")
-- Link order 1 remains primary H5046 (הִגִּיד, w1, HVhp3ms)
-- Add Link order 2 for pronominal dative לְךָ (w2, H9005, HR/Sp2ms)
DELETE FROM word_mapping_strongs
WHERE mapping_id = '7a1026d2-9e3a-4010-afcc-7908f4501bc2' AND link_order = 2;

INSERT INTO word_mapping_strongs (
  mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source
) VALUES (
  '7a1026d2-9e3a-4010-afcc-7908f4501bc2',
  'H9005',
  2,
  'pronominal_dative',
  'לְךָ֛',
  2,
  'HR/Sp2ms',
  'oshb_wlc'
);

COMMIT;
`;

runSql(sql);
console.log('Database updates applied successfully!');
