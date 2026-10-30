const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_quick_fixes.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

const sql = `
BEGIN TRANSACTION;

-- 1. Fix H5892b to standard H5892 in Judges 20:42
UPDATE word_mappings
SET strongs_id = 'H5892'
WHERE strongs_id = 'H5892b';

UPDATE word_mapping_strongs
SET strongs_id = 'H5892'
WHERE strongs_id = 'H5892b';

-- 2. Fix sbl_source_tr_locator (4 records)
UPDATE word_mappings
SET morph_source = 'morphgnt_tr'
WHERE morph_source = 'morphgnt_sblgnt' AND verified_locator LIKE 'TR:%';

UPDATE word_mapping_strongs
SET morph_source = 'morphgnt_tr'
WHERE morph_source = 'morphgnt_sblgnt' AND mapping_id IN (
  SELECT id FROM word_mappings WHERE verified_locator LIKE 'TR:%'
);

COMMIT;
`;

runSql(sql);
console.log('Fixed orphan strongs and TR locator sources!');
