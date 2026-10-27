const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';

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
  { name: 'Hosea 7:3 (وبكذبهم)', book: 28, ch: 7, vs: 3, word: '%كَذِبِهِمِ%', expectedStrongs: 'H3585' },
  { name: 'Acts 4:18 (فدعوهما)', book: 44, ch: 4, vs: 18, word: '%دَعَوْهُمَا%', expectedStrongs: 'G2564' },
  { name: 'Acts 4:18 (البتة)', book: 44, ch: 4, vs: 18, word: '%الْبَتَّةَ%', expectedStrongs: 'G2527' },
  { name: 'Acts 4:18 (باسم)', book: 44, ch: 4, vs: 18, word: '%بِاسْمِ%', expectedStrongs: 'G3686' },
  { name: 'Rev 13:5 (وتجاديف)', book: 66, ch: 13, vs: 5, word: '%تَجَادِيفَ%', expectedStrongs: 'G988' },
  { name: 'Rev 13:5 (يفعل)', book: 66, ch: 13, vs: 5, word: '%يَفْعَلَ%', expectedStrongs: 'G4160' },
  { name: '1 Kings 8:32 (تحكم)', book: 11, ch: 8, vs: 32, word: '%تَحْكُمُ%', expectedStrongs: 'H7561' },
  { name: 'Rev 1:8 (الكائن)', book: 66, ch: 1, vs: 8, word: '%الْكَائِنُ%', expectedStrongs: 'G1510' },
  { name: 'Esther 8:3 (عادت)', book: 17, ch: 8, vs: 3, word: '%عَادَتْ%', expectedStrongs: 'H3254' },
  { name: 'Esther 8:3 (عند)', book: 17, ch: 8, vs: 3, word: '%عِنْدَ%', expectedStrongs: 'H6440' },
  { name: '1 Sam 25:43 (فكانتا)', book: 9, ch: 25, vs: 43, word: '%فَكَانَتَا%', expectedStrongs: 'H1961' },
  { name: '1 Sam 25:43 (من)', book: 9, ch: 25, vs: 43, word: 'مِنْ', expectedStrongs: 'H4480' },
  { name: 'Exod 8:10 (فقال 1)', book: 2, ch: 8, vs: 10, word: '%فَقَالَ:%', pos: 1, expectedStrongs: 'H559' },
  { name: 'Col 1:23 (إن)', book: 51, ch: 1, vs: 23, word: 'إِنْ', pos: 1, expectedStrongs: 'G1487' },
  { name: 'Col 1:23 (منتقلين)', book: 51, ch: 1, vs: 23, word: '%مُنْتَقِلِينَ%', expectedStrongs: 'G3334' },
  { name: 'Lev 12:4 (حتى)', book: 3, ch: 12, vs: 4, word: 'حَتَّى', expectedStrongs: 'H5704' },
  { name: 'Lev 12:4 (كل)', book: 3, ch: 12, vs: 4, word: 'كُلَّ', expectedStrongs: 'H3605' },
  { name: 'Lev 25:52 (بقي)', book: 3, ch: 25, vs: 52, word: 'بَقِيَ', expectedStrongs: 'H7604' },
  { name: 'Judg 14:5 (وأمه)', book: 7, ch: 14, vs: 5, word: '%أُمُّهُ%', expectedStrongs: 'H517' },
  { name: 'Job 31:14 (أجيبه)', book: 18, ch: 31, vs: 14, word: '%أُجِيبُهُ%', expectedStrongs: 'H7725' },
  { name: 'Isa 17:1 (رجمة)', book: 23, ch: 17, vs: 1, word: '%رُجْمَةَ%', expectedStrongs: 'H4596' },
  { name: 'Isa 17:1 (ردم)', book: 23, ch: 17, vs: 1, word: '%رَدْمٍ%', expectedStrongs: 'H4654' },
  { name: 'Jer 42:5 (وأمينا)', book: 24, ch: 42, vs: 5, word: '%أَمِينًا%', expectedStrongs: 'H539' },
  { name: 'Jer 51:64 (هكذا)', book: 24, ch: 51, vs: 64, word: 'هكَذَا', expectedStrongs: 'H3602' },
  { name: 'Jer 51:64 (تغرق)', book: 24, ch: 51, vs: 64, word: 'تَغْرَقُ', expectedStrongs: 'H8257' },
  { name: 'Jer 51:64 (جالبه)', book: 24, ch: 51, vs: 64, word: 'جَالِبُهُ', expectedStrongs: 'H935' },
  { name: 'Jer 51:64 (ويعيون)', book: 24, ch: 51, vs: 64, word: '%وَيَعْيَوْنَ%', expectedStrongs: 'H3286' },
  { name: 'Ezek 40:34 (هنا)', book: 26, ch: 40, vs: 34, word: '%هُنَا%', pos: 9, expectedStrongs: 'H6311' },
  { name: 'Luke 4:16 (عادته)', book: 42, ch: 4, vs: 16, word: 'عَادَتِهِ', expectedStrongs: 'G1486' },
  { name: 'John 1:36 (فقال)', book: 43, ch: 1, vs: 36, word: 'فَقَالَ:', expectedStrongs: 'G3004' },
  { name: 'Acts 7:44 (كان)', book: 44, ch: 7, vs: 44, word: 'كَانَ', expectedStrongs: 'G3708' },
  { name: 'Acts 22:30 (فأحضر)', book: 44, ch: 22, vs: 30, word: 'فَأَحْضَرَ', expectedStrongs: 'G2609' },
  { name: 'Matt 17:20 (تقولون)', book: 40, ch: 17, vs: 20, word: 'تَقُولُونَ', expectedStrongs: 'G3004' },
  { name: 'Gen 4:18 (عيراد)', book: 1, ch: 4, vs: 18, word: '%عِيرَادُ%', pos: 3, expectedStrongs: 'H5897' },
  { name: 'Gen 4:18 (متوشائيل)', book: 1, ch: 4, vs: 18, word: '%مَتُوشَائِيلَ%', pos: 9, expectedStrongs: 'H4967' },
  { name: '1 Cor 1:11 (خلوي)', book: 46, ch: 1, vs: 11, word: '%خُلُوِي%', expectedStrongs: 'G5514' },
  { name: '1 Cor 2:1 (بسمو)', book: 46, ch: 2, vs: 1, word: '%بِسُمُوِّ%', expectedStrongs: 'G5247' },
  { name: '2 Cor 1:10 (مثل)', book: 47, ch: 1, vs: 10, word: '%مِثْلِ%', expectedStrongs: 'G5082' },
  { name: '2 Cor 1:24 (موازرون)', book: 47, ch: 1, vs: 24, word: '%مُوازِرُونَ%', expectedStrongs: 'G4904' },
  { name: 'Gal 2:4 (الكذبة)', book: 48, ch: 2, vs: 4, word: '%الْكَذَبَةِ%', expectedStrongs: 'G5569' },
  { name: 'Gal 2:4 (ليتجسسوا)', book: 48, ch: 2, vs: 4, word: '%لِيَتَجَسَّسُوا%', expectedStrongs: 'G2684' },
  { name: 'Gen 3:6 (بهجة)', book: 1, ch: 3, vs: 6, word: '%بَهِجَةٌ%', expectedStrongs: 'H8378' },
  { name: 'Gen 3:6 (للعيون)', book: 1, ch: 3, vs: 6, word: '%لِلْعُيُونِ%', expectedStrongs: 'H5869' },
  { name: 'Gen 3:6 (للنظر)', book: 1, ch: 3, vs: 6, word: '%لِلنَّظَرِ%', expectedStrongs: 'H7919' },
  { name: 'Matt 17:20 (لهذا)', book: 40, ch: 17, vs: 20, word: '%لِهذَا%', expectedStrongs: 'G3778' },
  { name: 'Job 31:14 (حين)', book: 18, ch: 31, vs: 14, word: '%حِينَ%', expectedStrongs: 'H3588' }
];

let bmPass = 0;
for (const b of benchmarks) {
  const posClause = b.pos ? `AND wm.ar_word_position = ${b.pos}` : '';
  const actual = query(`
    SELECT DISTINCT wm.strongs_id FROM word_mappings wm 
    JOIN verses v ON wm.verse_id = v.id 
    WHERE v.book_id = ${b.book} AND v.chapter_num = ${b.ch} AND v.verse_num = ${b.vs} AND wm.ar_word LIKE '${b.word}' ${posClause};
  `);
  if (actual === b.expectedStrongs) {
    bmPass++;
    console.log(`  ✓ ${b.name}: ${actual}`);
  } else {
    console.error(`  ✗ ${b.name}: expected ${b.expectedStrongs}, got "${actual}"`);
    totalFailures++;
  }
}
console.log(`Regression Test Summary: ${bmPass}/${benchmarks.length} benchmark loci verified.\n`);

// -----------------------------------------------------------------------------
// Test 2: Multi-Component Affix and Compound Verification
// -----------------------------------------------------------------------------
console.log('▶ TEST 2: Multi-Component Affix & Compound Coverage Audit');
const compounds = [
  { name: 'Acts 4:18 فَدَعَوْهُمَا', book: 44, ch: 4, vs: 18, word: '%دَعَوْهُمَا%', expectedRoles: ['G2532', 'G2564', 'G846'] },
  { name: 'Rev 13:5 وَتَجَادِيفَ', book: 66, ch: 13, vs: 5, word: '%تَجَادِيفَ%', expectedRoles: ['G2532', 'G988'] },
  { name: 'Matt 25:37 فَيُجِيبُهُ', book: 40, ch: 25, vs: 37, word: '%يُجِيبُهُ%', expectedRoles: ['G611', 'G846'] },
  { name: 'Luke 5:22 بِأَفْكَارِهِمْ', book: 42, ch: 5, vs: 22, word: '%بِأَفْكَارِهِمْ%', expectedRoles: ['G1261', 'G846'] },
  { name: 'John 6:44 وَأَنَا', book: 43, ch: 6, vs: 44, word: '%وَأَنَا%', expectedRoles: ['G2532', 'G1473'] },
  { name: 'John 13:8 رِجْلَيَّ', book: 43, ch: 13, vs: 8, word: '%رِجْلَيَّ%', expectedRoles: ['G4228', 'G1473'] },
  { name: 'Col 1:23 إِنْ (εἴ γε)', book: 51, ch: 1, vs: 23, word: 'إِنْ', expectedRoles: ['G1487', 'G1065'] },
  { name: 'Col 1:23 وَغَيْرَ (καὶ μὴ)', book: 51, ch: 1, vs: 23, word: '%وَغَيْرَ%', expectedRoles: ['G2532', 'G3361'] }
];

let compPass = 0;
for (const c of compounds) {
  const ids = query(`
    SELECT group_concat(wms.strongs_id) 
    FROM word_mapping_strongs wms 
    JOIN word_mappings wm ON wms.mapping_id = wm.id 
    JOIN verses v ON wm.verse_id = v.id 
    WHERE v.book_id = ${c.book} AND v.chapter_num = ${c.ch} AND v.verse_num = ${c.vs} AND wm.ar_word LIKE '${c.word}';
  `);
  const actualSet = (ids || '').split(',');
  const allFound = c.expectedRoles.every(r => actualSet.includes(r));
  if (allFound) {
    compPass++;
    console.log(`  ✓ ${c.name}: [${c.expectedRoles.join(', ')}] satisfies required components`);
  } else {
    console.error(`  ✗ ${c.name}: expected [${c.expectedRoles.join(', ')}], found [${actualSet.join(', ')}]`);
    totalFailures++;
  }
}
console.log(`Compound Affix Summary: ${compPass}/${compounds.length} loci verified.\n`);

// -----------------------------------------------------------------------------
// Test 3: Structural Database Rules & Hard Invariants
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

const multiPrimary = parseInt(query("SELECT count(*) FROM (SELECT mapping_id FROM word_mapping_strongs WHERE link_role='primary' GROUP BY 1 HAVING count(*)>1);"));
assertCondition("multiple_primary_components: at most 1 primary strongs per word mapping", multiPrimary === 0, `found ${multiPrimary}`);

const conflictPrimary = parseInt(query("SELECT count(*) FROM word_mappings w JOIN word_mapping_strongs x ON w.id=x.mapping_id WHERE x.link_role='primary' AND w.strongs_id IS NOT x.strongs_id;"));
assertCondition("conflict_primary_strongs: primary strongs in multi table must match word_mappings.strongs_id (null-safe IS NOT)", conflictPrimary === 0, `found ${conflictPrimary}`);

// Morphological consistency and documentation integrity gate
const gen36Morph = query("SELECT morph_stem, morph_tense, morph_person, morph_gender, orig_morphology FROM word_mappings WHERE id = '48efac3f-9748-4c10-9508-f6da552bf563';");
const gen36Ok = gen36Morph.includes('hifil') && gen36Morph.includes('infinitive_construct') && gen36Morph.includes('HR/Vhc');
assertCondition("gen36_morphology_consistency: Gen 3:6 للنظر has Hifil Infinitive Construct and HR/Vhc", gen36Ok, `actual: ${gen36Morph}`);

const matt1720Morph = query("SELECT morph_pos, morph_case, orig_morphology FROM word_mappings WHERE id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee';");
const matt1720Ok = matt1720Morph.includes('pronoun') && matt1720Morph.includes('dative') && matt1720Morph.includes('D-DSN');
assertCondition("matt1720_morphology_consistency: Matt 17:20 لهذا has pronoun dative D-DSN", matt1720Ok, `actual: ${matt1720Morph}`);

const gen318Locator = query("SELECT verified_locator FROM word_mappings WHERE id = 'fba6dab6-e8af-4b6a-8d43-b7a9f0350b40';");
const gen318Ok = gen318Locator.startsWith('OSHB:');
assertCondition("gen318_locator_accuracy: Gen 3:18 لك has authentic OSHB locator", gen318Ok, `actual: ${gen318Locator}`);

const syntacticWithStrongs = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_pos='syntactic_ar' AND strongs_id IS NOT NULL;"));
assertCondition('syntactic_with_strongs: syntactic_ar must have NULL strongs_id', syntacticWithStrongs === 0, `found ${syntacticWithStrongs}`);

const syntacticWithOriginal = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_pos='syntactic_ar' AND trim(coalesce(orig_word,'')) NOT IN ('','---','—','-');"));
assertCondition('syntactic_with_original: syntactic_ar must have empty orig_word', syntacticWithOriginal === 0, `found ${syntacticWithOriginal}`);

const emptyLocator = parseInt(query("SELECT count(*) FROM word_mappings WHERE trim(coalesce(verified_locator,'')) IN ('','-');"));
assertCondition('empty_locator: all records must have canonical verified_locator', emptyLocator === 0, `found ${emptyLocator}`);

const sblWithTr = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_source='morphgnt_sblgnt' AND verified_locator LIKE 'TR:%';"));
assertCondition('sbl_source_tr_locator: no conflicting SBLGNT source with TR locator', sblWithTr === 0, `found ${sblWithTr}`);

const mixedArabicOriginal = parseInt(query("SELECT count(*) FROM word_mappings WHERE strongs_id IS NOT NULL AND (orig_surface GLOB '*[ء-ي]*' OR orig_word GLOB '*[ء-ي]*');"));
assertCondition('pure_script_original: no mixed Arabic characters in Hebrew or Greek original fields', mixedArabicOriginal === 0, `found ${mixedArabicOriginal}`);


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
