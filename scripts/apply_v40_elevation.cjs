const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function executeSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_v40.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('Applying v40 elevation...');

const sql = `
BEGIN TRANSACTION;

-- Matt 17:20 pos 18: 'لِهذَا' -> align with exact MorphGNT word 22 (τούτῳ) and raw MorphGNT tag RD ----DSN-
UPDATE word_mappings 
SET orig_word_position = 22,
    verified_locator = 'SBLGNT:B40.C17.V20.w22',
    orig_morphology = 'RD ----DSN-',
    grammar_notes = 'Raw MorphGNT: RD ----DSN- (Demonstrative pronoun, dative singular neuter) mapped to unified format D-DSN; modifies τῷ ὄρει.'
WHERE id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee';

COMMIT;
`;

executeSql(sql);
console.log('SQL transaction applied successfully!');

// Verification
console.log('\n--- Verification: Matt 17:20 لهذا ---');
console.log(executeSql(`
SELECT ar_word_position, orig_word_position, ar_word, strongs_id, orig_word, orig_surface, orig_morphology, verified_locator, grammar_notes
FROM word_mappings WHERE id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee';
`));
