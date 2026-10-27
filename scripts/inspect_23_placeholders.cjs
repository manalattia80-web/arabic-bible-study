const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function query(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_23.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

const sql = `
SELECT wm.id, v.book_id, b.name_ar, v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface, wm.morph_pos, wm.morph_source
FROM word_mappings wm
JOIN verses v ON wm.verse_id = v.id
JOIN books b ON v.book_id = b.id
WHERE wm.strongs_id IS NOT NULL 
  AND trim(coalesce(wm.orig_word, '')) IN ('', '-', '---', '—')
ORDER BY v.book_id, v.chapter_num, v.verse_num, wm.ar_word_position;
`;

const lines = query(sql).split('\n');
console.log(`Found ${lines.length} records:`);
for (const line of lines) {
  const parts = line.split('|');
  const [id, bookId, bookName, ch, vs, pos, arWord, strongs, origWord, origSurface, posTag, source] = parts;
  console.log(`${bookName} (${bookId}) ${ch}:${vs} (pos ${pos}) '${arWord}' -> Strongs: ${strongs}, orig_word: '${origWord}', morph_pos: ${posTag}`);
  
  // Also lookup the Strongs definition from strongs_entries
  const lexSql = `SELECT original_word, transliteration, kjv_usage FROM strongs_entries WHERE strongs_id='${strongs}' LIMIT 1;`;
  const lex = query(lexSql);
  console.log(`   Strongs Entry: ${lex}`);
}
