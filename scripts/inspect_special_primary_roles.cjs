const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function query(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_inspect_roles.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('=== Checking roles like primary_% in word_mapping_strongs ===');
const rolesSql = `SELECT link_role, count(*) FROM word_mapping_strongs WHERE link_role LIKE 'primary_%' GROUP BY link_role;`;
console.log(query(rolesSql));

console.log('\n=== Checking mappings where link_role starts with primary_ and no literal primary exists ===');
const mappingsSql = `
SELECT wms.mapping_id, v.book_id, v.chapter_num, v.verse_num, wm.ar_word, wm.strongs_id, wms.strongs_id as multi_strongs, wms.link_role, wms.orig_component
FROM word_mapping_strongs wms
JOIN word_mappings wm ON wms.mapping_id = wm.id
JOIN verses v ON wm.verse_id = v.id
WHERE wms.link_role LIKE 'primary_%'
  AND NOT EXISTS (
    SELECT 1 FROM word_mapping_strongs x WHERE x.mapping_id = wms.mapping_id AND x.link_role = 'primary'
  );
`;
const rows = query(mappingsSql);
console.log(`Found ${rows ? rows.split('\n').length : 0} rows:\n`, rows);
