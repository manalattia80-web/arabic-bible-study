const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlitePath = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'temp_run.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    return execSync(`"${sqlitePath}" "${dbPath}" < "${tmp}"`).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

console.log('=== Step 1: Update Eph 2:8 pos 5 (token 8 καί) raw morphology to D- -------- ===');
runSql(`
UPDATE word_mapping_strongs
SET orig_morphology = 'D- --------'
WHERE mapping_id = (
  SELECT wm.id FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 49 AND v.chapter_num = 2 AND v.verse_num = 8 AND wm.ar_word_position = 5
) AND strongs_id = 'G2532';
`);

console.log('=== Step 2: Update John 3:16 pos 2 (Οὕτως) component to match canonical Οὕτως ===');
runSql(`
UPDATE word_mapping_strongs
SET orig_component = 'Οὕτως'
WHERE mapping_id = (
  SELECT wm.id FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 43 AND v.chapter_num = 3 AND v.verse_num = 16 AND wm.ar_word_position = 2
) AND strongs_id = 'G3779';
`);

console.log('=== Step 3: Update Acts 1:8 pos 2 (λήμψεσθε) component surface form ===');
runSql(`
UPDATE word_mapping_strongs
SET orig_component = 'λήμψεσθε'
WHERE mapping_id = (
  SELECT wm.id FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 44 AND v.chapter_num = 1 AND v.verse_num = 8 AND wm.ar_word_position = 2
) AND strongs_id = 'G2983';
`);

console.log('=== Verification ===');
console.log('Eph 2:8 pos 5 components:');
console.log(runSql(`
SELECT wms.strongs_id, wms.orig_component, wms.orig_word_position, wms.orig_morphology, wms.morph_source
FROM word_mapping_strongs wms
JOIN word_mappings wm ON wms.mapping_id = wm.id
JOIN verses v ON wm.verse_id = v.id 
WHERE v.book_id = 49 AND v.chapter_num = 2 AND v.verse_num = 8 AND wm.ar_word_position = 5;
`));

console.log('John 3:16 pos 2 components:');
console.log(runSql(`
SELECT wms.strongs_id, wms.orig_component, wms.orig_word_position, wms.orig_morphology, wms.morph_source
FROM word_mapping_strongs wms
JOIN word_mappings wm ON wms.mapping_id = wm.id
JOIN verses v ON wm.verse_id = v.id 
WHERE v.book_id = 43 AND v.chapter_num = 3 AND v.verse_num = 16 AND wm.ar_word_position = 2;
`));

console.log('Acts 1:8 pos 2 components:');
console.log(runSql(`
SELECT wms.strongs_id, wms.orig_component, wms.orig_word_position, wms.orig_morphology, wms.morph_source
FROM word_mapping_strongs wms
JOIN word_mappings wm ON wms.mapping_id = wm.id
JOIN verses v ON wm.verse_id = v.id 
WHERE v.book_id = 44 AND v.chapter_num = 1 AND v.verse_num = 8 AND wm.ar_word_position = 2;
`));
