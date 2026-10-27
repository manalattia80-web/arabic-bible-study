const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function query(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_scan.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

// Check for any Arabic characters (U+0600-U+06FF) in orig_surface or orig_word where strongs_id is not null
const sql = `
SELECT id, ar_word, strongs_id, orig_word, orig_surface
FROM word_mappings
WHERE strongs_id IS NOT NULL
  AND (orig_surface GLOB '*[ء-ي]*' OR orig_word GLOB '*[ء-ي]*');
`;

const res = query(sql);
console.log('Results of Arabic characters in orig_word/orig_surface:');
console.log(res ? res : 'NONE');
