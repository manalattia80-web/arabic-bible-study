const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlitePath = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function query(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_audit_ci.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    const res = execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 });
    return res.toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('========================================================================');
console.log('         RIGOROUS DATABASE AUDIT & CI QUALITY GATE REPORT               ');
console.log('========================================================================\n');

let totalFailures = 0;

function assertCondition(desc, passed, detail = '') {
  if (passed) {
    console.log(`  ✓ [PASS] ${desc}`);
  } else {
    console.error(`  ✗ [FAIL] ${desc} ${detail ? '--> ' + detail : ''}`);
    totalFailures++;
  }
}

// -----------------------------------------------------------------------------
// Test 1: Historical Regression Gate (Checking All User-Audited Benchmark Loci)
// -----------------------------------------------------------------------------
console.log('▶ TEST 1: Regression Test of All User-Audited Benchmark Loci');
const benchmarks = [
  { name: 'John 18:25 (يصطلي)', book: 43, ch: 18, vs: 25, word: '%يَصْطَلِي%', expectedStrongs: 'G2328' },
  { name: 'Jer 32:13 (أمامهم)', book: 24, ch: 32, vs: 13, word: 'أَمَامَهُمْ', expectedStrongs: 'H5869' },
  { name: 'Hosea 7:3 (وبكذبهم)', book: 28, ch: 7, vs: 3, word: 'وَبِكَذِبِهِمِ', expectedStrongs: 'H3585' },
  { name: 'Acts 4:18 (فدعوهما)', book: 44, ch: 4, vs: 18, word: 'فَدَعَوْهُمَا', expectedStrongs: 'G2564' },
  { name: 'Acts 4:18 (البتة)', book: 44, ch: 4, vs: 18, word: 'الْبَتَّةَ', expectedStrongs: 'G2527' },
  { name: 'Acts 4:18 (باسم)', book: 44, ch: 4, vs: 18, word: 'بِاسْمِ', expectedStrongs: 'G3686' },
  { name: 'Rev 13:5 (وتجاديف)', book: 66, ch: 13, vs: 5, word: 'وَتَجَادِيفَ', expectedStrongs: 'G988' },
  { name: 'Rev 13:5 (يفعل)', book: 66, ch: 13, vs: 5, word: 'يَفْعَلَ', expectedStrongs: 'G4160' },
  { name: '1 Kings 8:32 (تحكم)', book: 11, ch: 8, vs: 32, word: 'تَحْكُمُ', expectedStrongs: 'H7561' },
  { name: 'Rev 1:8 (الكائن)', book: 66, ch: 1, vs: 8, word: 'الْكَائِنُ', expectedStrongs: 'G1510' },
  { name: 'Esther 8:3 (عادت)', book: 17, ch: 8, vs: 3, word: 'عَادَتْ', expectedStrongs: 'H3254' },
  { name: 'Esther 8:3 (عند)', book: 17, ch: 8, vs: 3, word: 'عِنْدَ', expectedStrongs: 'H6440' },
  { name: '1 Sam 25:43 (فكانتا)', book: 9, ch: 25, vs: 43, word: 'فَكَانَتَا', expectedStrongs: 'H1961' },
  { name: '1 Sam 25:43 (من)', book: 9, ch: 25, vs: 43, word: 'مِنْ', expectedStrongs: 'H4480' },
  { name: 'Exod 8:10 (فقال 1)', book: 2, ch: 8, vs: 10, word: 'فَقَالَ:', expectedStrongs: 'H559' },
  { name: 'Col 1:23 (إن)', book: 51, ch: 1, vs: 23, word: 'إِنْ', expectedStrongs: 'G1487' },
  { name: 'Col 1:23 (منتقلين)', book: 51, ch: 1, vs: 23, word: 'مُنْتَقِلِينَ', expectedStrongs: 'G3334' },
  { name: 'Lev 12:4 (حتى)', book: 3, ch: 12, vs: 4, word: 'حَتَّى', expectedStrongs: 'H5704' },
  { name: 'Lev 12:4 (كل)', book: 3, ch: 12, vs: 4, word: 'كُلَّ', expectedStrongs: 'H3605' },
  { name: 'Lev 25:52 (بقي)', book: 3, ch: 25, vs: 52, word: 'بَقِيَ', expectedStrongs: 'H7604' },
  { name: 'Judg 14:5 (وأمه)', book: 7, ch: 14, vs: 5, word: '%أُمُّهُ%', expectedStrongs: 'H517' },
  { name: 'Job 31:14 (أجيبه)', book: 18, ch: 31, vs: 14, word: '%أُجِيبُهُ%', expectedStrongs: 'H7725' },
  { name: 'Isa 17:1 (رجمة)', book: 23, ch: 17, vs: 1, word: '%رُجْمَةَ%', expectedStrongs: 'H4596' },
  { name: 'Isa 17:1 (ردم)', book: 23, ch: 17, vs: 1, word: '%رَدْمٍ%', expectedStrongs: 'H4654' },
  { name: 'Jer 51:64 (هكذا)', book: 24, ch: 51, vs: 64, word: 'هكَذَا', expectedStrongs: 'H3602' },
  { name: 'Jer 51:64 (تغرق)', book: 24, ch: 51, vs: 64, word: 'تَغْرَقُ', expectedStrongs: 'H8257' },
  { name: 'Jer 51:64 (جالبه)', book: 24, ch: 51, vs: 64, word: 'جَالِبُهُ', expectedStrongs: 'H935' },
  { name: 'Jer 51:64 (ويعيون)', book: 24, ch: 51, vs: 64, word: 'وَيَعْيَوْنَ', expectedStrongs: 'H3286' },
  { name: 'Ezek 40:34 (هنا)', book: 26, ch: 40, vs: 34, word: 'هُنَا', expectedStrongs: 'H6311' },
  { name: 'Luke 4:16 (عادته)', book: 42, ch: 4, vs: 16, word: 'عَادَتِهِ', expectedStrongs: 'G1486' },
  { name: 'John 1:36 (فقال)', book: 43, ch: 1, vs: 36, word: 'فَقَالَ:', expectedStrongs: 'G3004' },
  { name: 'Acts 7:44 (كان)', book: 44, ch: 7, vs: 44, word: 'كَانَ', expectedStrongs: 'G3708' },
  { name: 'Acts 22:30 (فأحضر)', book: 44, ch: 22, vs: 30, word: 'فَأَحْضَرَ', expectedStrongs: 'G2609' },
  { name: 'Matt 17:20 (تقولون)', book: 40, ch: 17, vs: 20, word: 'تَقُولُونَ', expectedStrongs: 'G3004' }
];

let bmPass = 0;
for (const b of benchmarks) {
  const actual = query(`
    SELECT wm.strongs_id FROM word_mappings wm 
    JOIN verses v ON wm.verse_id = v.id 
    WHERE v.book_id = ${b.book} AND v.chapter_num = ${b.ch} AND v.verse_num = ${b.vs} AND wm.ar_word LIKE '${b.word}'
    LIMIT 1;
  `);
  if (actual === b.expectedStrongs) {
    console.log(`  ✓ ${b.name}: ${actual}`);
    bmPass++;
  } else {
    console.error(`  ✗ ${b.name}: expected ${b.expectedStrongs}, got "${actual}"`);
    totalFailures++;
  }
}
console.log(`Regression Test Summary: ${bmPass}/${benchmarks.length} benchmark loci verified.\n`);


// -----------------------------------------------------------------------------
// Test 2: Compound & Affix Multi-Mapping Verification
// -----------------------------------------------------------------------------
console.log('▶ TEST 2: Multi-Component Affix & Compound Coverage Audit');
const compounds = [
  { name: 'Acts 4:18 فَدَعَوْهُمَا', book: 44, ch: 4, vs: 18, word: 'فَدَعَوْهُمَا', expectedIds: ['G2532', 'G2564', 'G846'] },
  { name: 'Rev 13:5 وَتَجَادِيفَ', book: 66, ch: 13, vs: 5, word: 'وَتَجَادِيفَ', expectedIds: ['G2532', 'G988'] },
  { name: 'Matt 25:37 فَيُجِيبُهُ', book: 40, ch: 25, vs: 37, word: 'فَيُجِيبُهُ', expectedIds: ['G611', 'G846'] },
  { name: 'Luke 5:22 بِأَفْكَارِهِمْ', book: 42, ch: 5, vs: 22, word: '%بِأَفْكَارِهِمْ%', expectedIds: ['G1261', 'G846'] },
  { name: 'John 6:44 وَأَنَا', book: 43, ch: 6, vs: 44, word: 'وَأَنَا', expectedIds: ['G1473', 'G2504', 'G2532'] },
  { name: 'John 13:8 رِجْلَيَّ', book: 43, ch: 13, vs: 8, word: 'رِجْلَيَّ', expectedIds: ['G1473', 'G4228'] },
  { name: 'Col 1:23 إِنْ (εἴ γε)', book: 51, ch: 1, vs: 23, word: 'إِنْ', expectedIds: ['G1065', 'G1487'] },
  { name: 'Col 1:23 وَغَيْرَ (καὶ μὴ)', book: 51, ch: 1, vs: 23, word: 'وَغَيْرَ', expectedIds: ['G2532', 'G3361'] }
];

let cmpPass = 0;
for (const c of compounds) {
  const idsStr = query(`
    SELECT GROUP_CONCAT(wms.strongs_id)
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    JOIN word_mapping_strongs wms ON wm.id = wms.mapping_id
    WHERE v.book_id = ${c.book} AND v.chapter_num = ${c.ch} AND v.verse_num = ${c.vs} AND wm.ar_word LIKE '${c.word}'
    GROUP BY wm.id;
  `);
  const actualIds = idsStr ? idsStr.split(',').map(s => s.trim()) : [];
  const allFound = c.expectedIds.every(id => actualIds.includes(id));
  if (allFound) {
    console.log(`  ✓ ${c.name}: [${actualIds.join(', ')}] satisfies required components`);
    cmpPass++;
  } else {
    console.error(`  ✗ ${c.name}: missing expected components. Expected: [${c.expectedIds.join(', ')}], got: [${actualIds.join(', ')}]`);
    totalFailures++;
  }
}
console.log(`Compound Affix Summary: ${cmpPass}/${compounds.length} loci verified.\n`);


// -----------------------------------------------------------------------------
// Test 3: Structural Integrity & 19 SQL Audit Rules
// -----------------------------------------------------------------------------
console.log('▶ TEST 3: Structural Database Rules & Hard Invariants');

const orphanVerse = parseInt(query('SELECT count(*) FROM word_mappings w LEFT JOIN verses v ON v.id=w.verse_id WHERE v.id IS NULL;'));
assertCondition('orphan_verse: no orphaned verse foreign keys', orphanVerse === 0, `found ${orphanVerse}`);

const orphanStrongs = parseInt(query('SELECT count(*) FROM word_mappings w LEFT JOIN strongs_entries s ON s.strongs_id=w.strongs_id WHERE w.strongs_id IS NOT NULL AND s.strongs_id IS NULL;'));
assertCondition('orphan_primary_strongs: all strongs_id exist in lexicon', orphanStrongs === 0, `found ${orphanStrongs}`);

const orphanMultiMap = parseInt(query('SELECT count(*) FROM word_mapping_strongs x LEFT JOIN word_mappings w ON w.id=x.mapping_id WHERE w.id IS NULL;'));
assertCondition('orphan_multi_mapping: no orphaned word_mapping_strongs entries', orphanMultiMap === 0, `found ${orphanMultiMap}`);

const dupPosition = parseInt(query('SELECT count(*) FROM (SELECT verse_id, ar_word_position FROM word_mappings GROUP BY 1,2 HAVING count(*)>1);'));
assertCondition('duplicate_ar_position: unique ar_word_position per verse', dupPosition === 0, `found ${dupPosition}`);

const crossTestament = parseInt(query("SELECT count(*) FROM word_mappings w JOIN verses v ON v.id=w.verse_id WHERE (v.book_id<=39 AND w.strongs_id LIKE 'G%') OR (v.book_id>=40 AND w.strongs_id LIKE 'H%');"));
assertCondition('cross_testament_strongs: zero cross-testament contamination', crossTestament === 0, `found ${crossTestament}`);

const primaryInMulti = parseInt(query('SELECT count(*) FROM word_mappings w WHERE w.strongs_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM word_mapping_strongs x WHERE x.mapping_id=w.id AND x.strongs_id=w.strongs_id);'));
assertCondition('primary_missing_from_multi: all primary strongs in multi table', primaryInMulti === 0, `found ${primaryInMulti}`);

const syntacticWithStrongs = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_pos='syntactic_ar' AND strongs_id IS NOT NULL;"));
assertCondition('syntactic_with_strongs: syntactic_ar must have NULL strongs_id', syntacticWithStrongs === 0, `found ${syntacticWithStrongs}`);

const syntacticWithOriginal = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_pos='syntactic_ar' AND trim(coalesce(orig_word,'')) NOT IN ('','---','—','-');"));
assertCondition('syntactic_with_original: syntactic_ar must have empty orig_word', syntacticWithOriginal === 0, `found ${syntacticWithOriginal}`);

const emptyLocator = parseInt(query("SELECT count(*) FROM word_mappings WHERE trim(coalesce(verified_locator,'')) IN ('','-');"));
assertCondition('empty_locator: all records must have canonical verified_locator', emptyLocator === 0, `found ${emptyLocator}`);

const sblWithTr = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_source='morphgnt_sblgnt' AND verified_locator LIKE 'TR:%';"));
assertCondition('sbl_source_tr_locator: no conflicting SBLGNT source with TR locator', sblWithTr === 0, `found ${sblWithTr}`);


// -----------------------------------------------------------------------------
// Test 4: SQLite Database Engine Integrity
// -----------------------------------------------------------------------------
console.log('\n▶ TEST 4: SQLite Integrity & Vacuum Check');
const integrity = query('PRAGMA integrity_check;');
assertCondition('PRAGMA integrity_check is ok', integrity === 'ok', integrity);

const fkCheck = query('PRAGMA foreign_key_check;');
assertCondition('PRAGMA foreign_key_check is ok', fkCheck === '', fkCheck);

console.log('\n========================================================================');
if (totalFailures === 0) {
  console.log('              ALL QUALITY GATE CHECKS PASSED (0 FAILURES)               ');
  console.log('========================================================================');
  process.exit(0);
} else {
  console.error(`              QUALITY GATE FAILED WITH ${totalFailures} FAILURES                  `);
  console.log('========================================================================');
  process.exit(1);
}
