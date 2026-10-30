const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_sync_loc.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

let sql = `
BEGIN TRANSACTION;

-- 1. Fix sbl_source_tr_locator: where locator is TR:%, set morph_source to 'morphgnt_tr'
UPDATE word_mappings
SET morph_source = 'morphgnt_tr'
WHERE morph_source = 'morphgnt_sblgnt' AND verified_locator LIKE 'TR:%';

UPDATE word_mapping_strongs
SET morph_source = 'morphgnt_tr'
WHERE morph_source = 'morphgnt_sblgnt' AND mapping_id IN (
  SELECT id FROM word_mappings WHERE verified_locator LIKE 'TR:%'
);

-- 2. Synchronize single verified_locator with orig_word_position
-- Format of verified_locator: <PREFIX>.w<OLD_POS>
-- We replace .w<OLD_POS> with .w<orig_word_position>
UPDATE word_mappings
SET verified_locator = substr(verified_locator, 1, instr(verified_locator, '.w') + 1) || orig_word_position
WHERE verified_locator NOT LIKE '%-%'
  AND verified_locator NOT LIKE 'AR_SYNTACTIC:%'
  AND verified_locator LIKE '%.w%'
  AND orig_word_position IS NOT NULL
  AND CAST(substr(verified_locator, instr(verified_locator, '.w') + 2) AS INTEGER) != orig_word_position;

-- 3. Fix Genesis 22:16 w7 orig_word_position to match range base (pos 6)
UPDATE word_mappings
SET orig_word_position = 6
WHERE id = '51bec6a7-99c7-4f22-b658-fbe588246b40';

COMMIT;
`;

runSql(sql);
console.log('Successfully synchronized locators and sources!');
