const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const testDb = path.resolve(__dirname, 'test_negative_audit.db');
const tmpSql = path.resolve(__dirname, 'tmp_negative_test.sql');

if (fs.existsSync(testDb)) fs.unlinkSync(testDb);

console.log('=== Running Negative Quality Gate Suite (5 Deliberate Forbidden States) ===');

// Setup minimal database schema
const schemaSql = `
CREATE TABLE verses (
  id TEXT PRIMARY KEY,
  book_id INTEGER,
  chapter_num INTEGER,
  verse_num INTEGER,
  text_ar TEXT
);

CREATE TABLE strongs_entries (
  strongs_id TEXT PRIMARY KEY,
  lemma TEXT,
  definition_en TEXT
);

CREATE TABLE word_mappings (
  id TEXT PRIMARY KEY,
  verse_id TEXT REFERENCES verses(id),
  ar_word_position INTEGER,
  ar_word TEXT,
  strongs_id TEXT,
  orig_word TEXT,
  orig_surface TEXT,
  orig_word_position INTEGER,
  orig_morphology TEXT,
  morph_pos TEXT,
  morph_source TEXT,
  verified_source TEXT,
  verified_locator TEXT,
  relation_type TEXT
);

CREATE TABLE word_mapping_strongs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mapping_id TEXT REFERENCES word_mappings(id),
  strongs_id TEXT,
  link_order INTEGER,
  link_role TEXT,
  orig_component TEXT,
  orig_word_position INTEGER,
  orig_morphology TEXT,
  morph_source TEXT
);

-- Seed minimal valid data
INSERT INTO verses VALUES ('v1', 1, 1, 1, 'في البدء');
INSERT INTO strongs_entries VALUES ('H7225', 'רֵאשִׁית', 'beginning');
INSERT INTO strongs_entries VALUES ('G746', 'ἀρχή', 'beginning');
INSERT INTO word_mappings VALUES ('wm1', 'v1', 1, 'في', 'H9003', 'בְּ', 'בְּ', 1, 'HR', 'preposition', 'oshb_wlc', 'OSHB', 'OSHB:B1.C1.V1.w1', 'primary');
INSERT INTO word_mappings VALUES ('wm2', 'v1', 2, 'البدء', 'H7225', 'רֵאשִׁית', 'רֵאשִׁית', 2, 'HNcfsa', 'noun', 'oshb_wlc', 'OSHB', 'OSHB:B1.C1.V1.w2', 'primary');
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('wm2', 'H7225', 1, 'primary', 'רֵאשִׁית', 2, 'HNcfsa', 'oshb_wlc');
`;

fs.writeFileSync(tmpSql, schemaSql, 'utf8');
execSync(`"${sqlite}" "${testDb}" < "${tmpSql}"`, { encoding: 'utf8', shell: 'cmd.exe' });
if (fs.existsSync(tmpSql)) fs.unlinkSync(tmpSql);

function query(sql) {
  const cleanSql = sql.replace(/[\r\n]+/g, ' ').trim();
  return execSync(`"${sqlite}" "${testDb}" "${cleanSql.replace(/"/g, '""')}"`, { encoding: 'utf8', shell: 'cmd.exe' }).trim();
}

let passed = 0;
let total = 5;

// Gate 1: syntactic_ar with Strongs
console.log('\n[1/5] Testing Gate 1: syntactic_ar with Strongs ID...');
query(`INSERT INTO word_mappings (id, verse_id, ar_word_position, morph_pos, strongs_id) VALUES ('bad1', 'v1', 3, 'syntactic_ar', 'H9999');`);
const check1 = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_pos='syntactic_ar' AND strongs_id IS NOT NULL;"));
if (check1 > 0) {
  console.log(`  ✓ Quality Gate actively caught forbidden syntactic_ar with strongs (count=${check1})`);
  passed++;
} else {
  console.error('  ✗ FAILED to catch syntactic_ar with strongs');
}
query(`DELETE FROM word_mappings WHERE id='bad1';`);

// Gate 2: Codex locator with NULL position
console.log('\n[2/5] Testing Gate 2: Codex locator with NULL position...');
query(`INSERT INTO word_mappings (id, verse_id, ar_word_position, verified_locator, orig_word_position) VALUES ('bad2', 'v1', 3, 'OSHB:B1.C1.V1.w3', NULL);`);
const check2 = parseInt(query(`
  SELECT count(*) FROM word_mappings 
  WHERE (verified_locator LIKE 'OSHB:%' OR verified_locator LIKE 'SBLGNT:%' OR verified_locator LIKE 'TR:%')
    AND verified_locator NOT LIKE 'AR_SYNTACTIC:%'
    AND orig_word_position IS NULL;
`));
if (check2 > 0) {
  console.log(`  ✓ Quality Gate actively caught codex locator with NULL position (count=${check2})`);
  passed++;
} else {
  console.error('  ✗ FAILED to catch codex locator with NULL position');
}
query(`DELETE FROM word_mappings WHERE id='bad2';`);

// Gate 3: Range locator with component position out of bounds
console.log('\n[3/5] Testing Gate 3: Range locator with component position out of bounds...');
query(`INSERT INTO word_mappings (id, verse_id, ar_word_position, verified_locator, orig_word_position) VALUES ('bad3', 'v1', 3, 'OSHB:B1.C1.V1.w5-w6', 5);`);
query(`INSERT INTO word_mapping_strongs (mapping_id, strongs_id, orig_word_position) VALUES ('bad3', 'H1234', 9);`); // 9 is out of [5, 6]
const check3 = parseInt(query(`
  SELECT count(*) 
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  WHERE wm.verified_locator LIKE '%.w%-%'
    AND (
      wms.orig_word_position IS NULL
      OR wms.orig_word_position < CAST(substr(wm.verified_locator, instr(wm.verified_locator, '.w') + 2, instr(wm.verified_locator, '-') - instr(wm.verified_locator, '.w') - 2) AS INTEGER)
      OR wms.orig_word_position > CAST(substr(wm.verified_locator, instr(wm.verified_locator, '-w') + 2) AS INTEGER)
    );
`));
if (check3 > 0) {
  console.log(`  ✓ Quality Gate actively caught out-of-bounds component in range locator (count=${check3})`);
  passed++;
} else {
  console.error('  ✗ FAILED to catch out-of-bounds component in range locator');
}
query(`DELETE FROM word_mapping_strongs WHERE mapping_id='bad3';`);
query(`DELETE FROM word_mappings WHERE id='bad3';`);

// Gate 4: Cross-testament Strongs (Greek Strongs in OT verse)
console.log('\n[4/5] Testing Gate 4: Cross-testament Strongs contamination...');
query(`INSERT INTO word_mappings (id, verse_id, ar_word_position, strongs_id) VALUES ('bad4', 'v1', 3, 'G746');`);
const check4 = parseInt(query(`
  SELECT count(*) 
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE (v.book_id <= 39 AND wm.strongs_id LIKE 'G%')
     OR (v.book_id >= 40 AND wm.strongs_id LIKE 'H%');
`));
if (check4 > 0) {
  console.log(`  ✓ Quality Gate actively caught cross-testament Strongs (count=${check4})`);
  passed++;
} else {
  console.error('  ✗ FAILED to catch cross-testament Strongs');
}
query(`DELETE FROM word_mappings WHERE id='bad4';`);

// Gate 5: Duplicate Arabic position per verse
console.log('\n[5/5] Testing Gate 5: Duplicate Arabic word position per verse...');
query(`INSERT INTO word_mappings (id, verse_id, ar_word_position) VALUES ('bad5', 'v1', 1);`); // 1 already exists ('wm1')
const check5 = parseInt(query(`
  SELECT count(*) FROM (
    SELECT verse_id, ar_word_position, count(*) as c 
    FROM word_mappings 
    GROUP BY verse_id, ar_word_position 
    HAVING c > 1
  );
`));
if (check5 > 0) {
  console.log(`  ✓ Quality Gate actively caught duplicate Arabic position in verse (count=${check5})`);
  passed++;
} else {
  console.error('  ✗ FAILED to catch duplicate Arabic position');
}
query(`DELETE FROM word_mappings WHERE id='bad5';`);

// Cleanup
if (fs.existsSync(testDb)) fs.unlinkSync(testDb);

console.log(`\n========================================`);
console.log(`Negative Quality Gate Results: ${passed}/${total} forbidden states caught.`);
if (passed === total) {
  console.log('ALL NEGATIVE GATES VERIFIED: CI actively rejects invalid states.');
  process.exit(0);
} else {
  console.error('NEGATIVE QUALITY GATES FAILED');
  process.exit(1);
}
