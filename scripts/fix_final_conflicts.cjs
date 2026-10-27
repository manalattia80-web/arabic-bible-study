const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

const sql = `
BEGIN TRANSACTION;
-- 1. Fix John 6:44 multi strongs primary
UPDATE word_mapping_strongs SET link_role = 'compound_part' WHERE mapping_id = 'fe13d4f9-5ced-4d6d-b220-639a5e7e2d0d' AND strongs_id = 'G1473';
UPDATE word_mapping_strongs SET link_role = 'primary' WHERE mapping_id = 'fe13d4f9-5ced-4d6d-b220-639a5e7e2d0d' AND strongs_id = 'G2504';

-- 2. Align morph_source to morphgnt_tr where verified_locator starts with TR:
UPDATE word_mappings 
SET morph_source = 'morphgnt_tr'
WHERE morph_source = 'morphgnt_sblgnt' AND verified_locator LIKE 'TR:%';
COMMIT;
`;

const tmpFile = path.resolve(__dirname, 'temp_fix2.sql');
fs.writeFileSync(tmpFile, sql, 'utf8');
try {
  execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`);
} finally {
  try { fs.unlinkSync(tmpFile); } catch (_) {}
}
console.log('Fixed John 6:44 and aligned SBLGNT/TR locators!');
