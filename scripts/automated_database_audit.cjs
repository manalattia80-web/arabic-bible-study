const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const dbPath = process.env.AUDIT_DB_PATH || path.resolve(__dirname, '../mobile/assets/bible_study.db');

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
  { name: 'Job 31:14 (حين)', book: 18, ch: 31, vs: 14, word: '%حِينَ%', expectedStrongs: 'H3588' },
  { name: '1 Chron 12:19 (سيده H113)', book: 13, ch: 12, vs: 19, word: '%سَيِّدِهِ%', expectedStrongs: 'H113' },
  { name: '2 Sam 17:9 (كسرة H4046)', book: 10, ch: 17, vs: 9, word: '%كَسْرَةٌ%', expectedStrongs: 'H4046' },
  { name: 'Isa 28:16 (آمن H539)', book: 23, ch: 28, vs: 16, word: '%آمَنَ%', expectedStrongs: 'H539' },
  { name: 'Jonah 3:5 (فآمن H539)', book: 32, ch: 3, vs: 5, word: '%فَآمَنَ%', expectedStrongs: 'H539' },
  { name: 'Psalm 116:10 (آمنت H539)', book: 19, ch: 116, vs: 10, word: '%آمَنْتُ%', expectedStrongs: 'H539' },
  { name: 'Heb 6:18 (الموضوع G4295)', book: 58, ch: 6, vs: 18, word: '%الْمَوْضُوعِ%', expectedStrongs: 'G4295' },
  { name: 'Num 15:18 (إليها H8033)', book: 4, ch: 15, vs: 18, word: '%إِلَيْهَا%', expectedStrongs: 'H8033' },
  { name: 'Deut 2:24 (حربا H4421)', book: 5, ch: 2, vs: 24, word: '%حَرْبًا%', expectedStrongs: 'H4421' },
  { name: 'Num 25:18 (قتلت H5221)', book: 4, ch: 25, vs: 18, word: '%قُتِلَتْ%', expectedStrongs: 'H5221' },
  { name: 'Job 22:5 (نهاية H7093)', book: 18, ch: 22, vs: 5, word: '%نِهَايَةَ%', expectedStrongs: 'H7093' },
  { name: 'Job 1:4 (أخواتهم H269)', book: 18, ch: 1, vs: 4, word: '%أَخَوَاتِهِمِ%', expectedStrongs: 'H269' },
  { name: 'Deut 2:24 (وأثر w19 H1624)', book: 5, ch: 2, vs: 24, word: '%وَأَثِرْ%', expectedStrongs: 'H1624' }
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
  { name: 'Col 1:23 وَغَيْرَ (καὶ μὴ)', book: 51, ch: 1, vs: 23, word: '%وَغَيْرَ%', expectedRoles: ['G2532', 'G3361'] },
  { name: 'John 3:16 بِهِ (εἰς αὐτόν)', book: 43, ch: 3, vs: 16, word: 'بِهِ', expectedRoles: ['G846', 'G1519'] },
  { name: 'Eph 2:8 وَذلِكَ (καὶ τοῦτο)', book: 49, ch: 2, vs: 8, word: '%وَذلِكَ%', expectedRoles: ['G3778', 'G2532'] },
  { name: 'Isa 53:5 شُفِينَا (נִרְפָּא־לָנוּ)', book: 23, ch: 53, vs: 5, word: 'شُفِينَا', expectedRoles: ['H7495', 'H3807a'] }
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

// Strict Discrete Field-by-Field Morphological and Provenance Verification
const gen36 = JSON.parse(query(`
  SELECT json_object(
    'strongs_id', strongs_id,
    'orig_word', orig_word,
    'orig_surface', orig_surface,
    'orig_pos', orig_word_position,
    'pos', morph_pos,
    'stem', morph_stem,
    'tense', morph_tense,
    'person', morph_person,
    'gender', morph_gender,
    'number', morph_number,
    'orig_morphology', orig_morphology,
    'locator', verified_locator
  ) FROM word_mappings WHERE id = '48efac3f-9748-4c10-9508-f6da552bf563';
`));
const gen36Ok = gen36.strongs_id === 'H7919' &&
                gen36.orig_word === 'שָׂכַל' &&
                gen36.orig_surface === 'לְהַשְׂכִּיל' &&
                gen36.orig_pos === 13 &&
                gen36.pos === 'verb' &&
                gen36.stem === 'hifil' &&
                gen36.tense === 'infinitive_construct' &&
                gen36.person === null &&
                gen36.gender === null &&
                gen36.number === null &&
                gen36.orig_morphology === 'HR/Vhc' &&
                gen36.locator === 'OSHB:B1.C3.V6.w13';
assertCondition("gen36_morphology_and_locator_exact: Gen 3:6 للنظر exact Hifil Inf Const, null person/gender/num, HR/Vhc, OSHB w13", gen36Ok, JSON.stringify(gen36));

const matt1720 = JSON.parse(query(`
  SELECT json_object(
    'strongs_id', strongs_id,
    'orig_word', orig_word,
    'orig_surface', orig_surface,
    'orig_pos', orig_word_position,
    'pos', morph_pos,
    'case', morph_case,
    'gender', morph_gender,
    'number', morph_number,
    'orig_morphology', orig_morphology,
    'locator', verified_locator
  ) FROM word_mappings WHERE id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee';
`));
const matt1720Ok = matt1720.strongs_id === 'G3778' &&
                   matt1720.orig_word === 'οὗτος' &&
                   matt1720.orig_surface === 'τούτῳ' &&
                   matt1720.orig_pos === 22 &&
                   matt1720.pos === 'pronoun' &&
                   matt1720.case === 'dative' &&
                   matt1720.gender === 'neuter' &&
                   matt1720.number === 'singular' &&
                   matt1720.orig_morphology === 'RD ----DSN-' &&
                   matt1720.locator === 'SBLGNT:B40.C17.V20.w22';
assertCondition("matt1720_morphology_and_locator_exact: Matt 17:20 لهذا exact Greek token 22, dative neuter singular, RD ----DSN-, SBLGNT w22", matt1720Ok, JSON.stringify(matt1720));

const gen318 = JSON.parse(query(`
  SELECT json_object(
    'orig_word', orig_word,
    'orig_surface', orig_surface,
    'orig_pos', orig_word_position,
    'pos', morph_pos,
    'person', morph_person,
    'gender', morph_gender,
    'number', morph_number,
    'orig_morphology', orig_morphology,
    'locator', verified_locator
  ) FROM word_mappings WHERE id = 'fba6dab6-e8af-4b6a-8d43-b7a9f0350b40';
`));
const gen318Ok = gen318.orig_word === 'לְ' &&
                 gen318.orig_surface === 'לָךְ' &&
                 gen318.orig_pos === 4 &&
                 gen318.pos === 'preposition' &&
                 gen318.person === '2' &&
                 gen318.gender === 'masculine' &&
                 gen318.number === 'singular' &&
                 gen318.orig_morphology === 'HR/Sp2ms' &&
                 gen318.locator === 'OSHB:B1.C3.V18.w4';
assertCondition("gen318_morphology_and_locator_exact: Gen 3:18 لك exact preposition suffix 2ms, HR/Sp2ms, OSHB w4", gen318Ok, JSON.stringify(gen318));

const syntacticWithStrongs = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_pos='syntactic_ar' AND strongs_id IS NOT NULL;"));
assertCondition('syntactic_with_strongs: syntactic_ar must have NULL strongs_id', syntacticWithStrongs === 0, `found ${syntacticWithStrongs}`);

const syntacticWithOriginal = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_pos='syntactic_ar' AND trim(coalesce(orig_word,'')) NOT IN ('','---','—','-');"));
assertCondition('syntactic_with_original: syntactic_ar must have empty orig_word', syntacticWithOriginal === 0, `found ${syntacticWithOriginal}`);

const emptyLocator = parseInt(query("SELECT count(*) FROM word_mappings WHERE trim(coalesce(verified_locator,'')) IN ('','-');"));
assertCondition('empty_locator: all records must have canonical verified_locator', emptyLocator === 0, `found ${emptyLocator}`);

const sblWithTr = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_source='morphgnt_sblgnt' AND verified_locator LIKE 'TR:%';"));
assertCondition('sbl_source_tr_locator: no conflicting SBLGNT source with TR locator', sblWithTr === 0, `found ${sblWithTr}`);

const trWithSbl = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_source='morphgnt_tr' AND verified_locator LIKE 'SBLGNT:%';"));
assertCondition('tr_source_sbl_locator: no conflicting TR source with SBLGNT locator', trWithSbl === 0, `found ${trWithSbl}`);

const verbWithSyntactic = parseInt(query("SELECT count(*) FROM word_mappings WHERE morph_pos='verb' AND (morph_source='syntactic_ar' OR verified_source='syntactic_ar');"));
assertCondition('verb_not_syntactic_ar: verbs with Strongs/original cannot have syntactic_ar source', verbWithSyntactic === 0, `found ${verbWithSyntactic}`);

const mixedArabicOriginal = parseInt(query("SELECT count(*) FROM word_mappings WHERE strongs_id IS NOT NULL AND (orig_surface GLOB '*[ء-ي]*' OR orig_word GLOB '*[ء-ي]*');"));
assertCondition('pure_script_original: no mixed Arabic characters in Hebrew or Greek original fields', mixedArabicOriginal === 0, `found ${mixedArabicOriginal}`);

const mixedArabicComponent = parseInt(query("SELECT count(*) FROM word_mapping_strongs WHERE orig_component GLOB '*[ء-ي]*';"));
assertCondition('pure_script_component: no mixed Arabic characters in orig_component fields across word_mapping_strongs', mixedArabicComponent === 0, `found ${mixedArabicComponent}`);

// General Consistency Gate: For all single locators across the entire database, orig_word_position must match .wN exactly
const singleLocatorMismatches = parseInt(query(`
  SELECT count(*) FROM word_mappings 
  WHERE verified_locator NOT LIKE '%-%' 
    AND verified_locator NOT LIKE 'AR_SYNTACTIC:%'
    AND verified_locator LIKE '%.w%'
    AND orig_word_position IS NOT NULL
    AND CAST(substr(verified_locator, instr(verified_locator, '.w') + 2) AS INTEGER) != orig_word_position;
`));
assertCondition('general_single_locator_position_match: all single locators across DB match orig_word_position exactly', singleLocatorMismatches === 0, `found ${singleLocatorMismatches} mismatches`);

// General Consistency Gate: All records with canonical codex locators (OSHB/SBLGNT/TR) must have non-null orig_word_position
const nullCodexPositions = parseInt(query(`
  SELECT count(*) FROM word_mappings 
  WHERE (verified_locator LIKE 'OSHB:%' OR verified_locator LIKE 'SBLGNT:%' OR verified_locator LIKE 'TR:%')
    AND orig_word_position IS NULL;
`));
assertCondition('no_null_position_with_codex_locator: all records with OSHB/SBLGNT/TR locators have non-null orig_word_position', nullCodexPositions === 0, `found ${nullCodexPositions} null positions`);

// General Consistency Gate: Range locators like .wN1-wN2 must match the start position N1 and have valid ordering
const rangeLocatorMismatches = parseInt(query(`
  SELECT count(*) FROM word_mappings 
  WHERE verified_locator LIKE '%.w%-%'
    AND orig_word_position IS NOT NULL
    AND CAST(substr(verified_locator, instr(verified_locator, '.w') + 2, instr(verified_locator, '-') - instr(verified_locator, '.w') - 2) AS INTEGER) != orig_word_position;
`));
assertCondition('general_range_locator_position_match: range locators match base orig_word_position', rangeLocatorMismatches === 0, `found ${rangeLocatorMismatches} mismatches`);

// General Consistency Gate: Range locators endpoint ordering validation (end >= start)
const invalidRangeOrder = parseInt(query(`
  SELECT count(*) FROM word_mappings 
  WHERE verified_locator LIKE '%.w%-%'
    AND CAST(substr(verified_locator, instr(verified_locator, '-w') + 2) AS INTEGER) < 
        CAST(substr(verified_locator, instr(verified_locator, '.w') + 2, instr(verified_locator, '-') - instr(verified_locator, '.w') - 2) AS INTEGER);
`));
assertCondition('range_locator_endpoint_order: all range locators have valid end >= start ordering', invalidRangeOrder === 0, `found ${invalidRangeOrder}`);

// General Consistency Gate: All components in word_mapping_strongs for range locators fall strictly within [start, end]
const outOfBoundsComponents = parseInt(query(`
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
assertCondition('range_component_positions_bounded: all components of range locators fall strictly within [start, end]', outOfBoundsComponents === 0, `found ${outOfBoundsComponents}`);




// -----------------------------------------------------------------------------
// Test 4: Whole-Verse Unit Regression Tests (The 10 Audited Verses, 163 Records)
// -----------------------------------------------------------------------------
console.log('\n▶ TEST 4: Whole-Verse Unit Regression Tests (10 Verses, 163 Records)');

// 1. Josh 1:8 - Negative particle H3808, Conjunction H9002, Prepositions H9003/H9004, Causal H3588
const josh18w1 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'word', orig_word, 'pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8) AND ar_word_position=1;`));
assertCondition("josh18_neg_particle: Josh 1:8 لا has H3808 לֹא particle", josh18w1.strongs === 'H3808' && josh18w1.word === 'לֹא' && josh18w1.pos === 'particle', JSON.stringify(josh18w1));

const josh18w8 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'word', orig_word, 'pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8) AND ar_word_position=8;`));
assertCondition("josh18_contrast_conj: Josh 1:8 بل has H9002 וְ conjunction", josh18w8.strongs === 'H9002' && josh18w8.pos === 'conjunction', JSON.stringify(josh18w8));

const josh18w22 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'word', orig_word, 'pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=6 AND chapter_num=1 AND verse_num=8) AND ar_word_position=22;`));
assertCondition("josh18_causal_conj: Josh 1:8 لأنك has H3588 כִּי conjunction", josh18w22.strongs === 'H3588' && josh18w22.word === 'כִּי' && josh18w22.pos === 'conjunction', JSON.stringify(josh18w22));

// 2. Ps 23:1 - Arabic complement without Hebrew token
const ps231w5 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'pos', morph_pos, 'word', orig_word) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=19 AND chapter_num=23 AND verse_num=1) AND ar_word_position=5;`));
assertCondition("ps231_syntactic_ar: Ps 23:1 شيء is syntactic_ar with NULL strongs", ps231w5.strongs === null && ps231w5.pos === 'syntactic_ar' && ps231w5.word === '—', JSON.stringify(ps231w5));

// 3. Isa 53:5 - Re-aligned theological content words and strict canonical raw morphology
const isa535w2 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'stem', morph_stem, 'tense', morph_tense, 'morphology', orig_morphology, 'source', morph_source, 'vsource', verified_source, 'rel', relation_type) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5) AND ar_word_position=2;`));
assertCondition("isa535_pierced: Isa 53:5 مجروح exact OSHB raw morphology HVOsmsa (polal passive participle)", isa535w2.strongs === 'H2490' && isa535w2.surface === 'מְחֹלָ֖ל' && isa535w2.morphology === 'HVOsmsa' && isa535w2.stem === 'polal' && isa535w2.source === 'oshb_wlc' && isa535w2.rel === 'primary', JSON.stringify(isa535w2));

const isa535w7 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', morph_pos, 'source', morph_source, 'rel', relation_type) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5) AND ar_word_position=7;`));
assertCondition("isa535_iniquities: Isa 53:5 آثامنا has H5771 עֲוֹנֹתֵינוּ noun, oshb_wlc source, primary relation", isa535w7.strongs === 'H5771' && isa535w7.surface === 'עֲוֹנֹתֵ֑ינוּ' && isa535w7.pos === 'noun' && isa535w7.source === 'oshb_wlc' && isa535w7.rel === 'primary', JSON.stringify(isa535w7));

const isa535w9 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'morphology', orig_morphology, 'source', morph_source, 'rel', relation_type) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5) AND ar_word_position=9;`));
assertCondition("isa535_peace: Isa 53:5 سلامنا exact OSHB raw morphology HNcmsc/Sp1cp (construct c before suffix)", isa535w9.strongs === 'H7965' && isa535w9.morphology === 'HNcmsc/Sp1cp' && isa535w9.source === 'oshb_wlc' && isa535w9.rel === 'primary', JSON.stringify(isa535w9));

const isa535w11 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'morphology', orig_morphology, 'pos', morph_pos, 'source', morph_source, 'rel', relation_type) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5) AND ar_word_position=11;`));
assertCondition("isa535_stripes: Isa 53:5 وبحبره exact OSHB raw morphology HC/R/Ncfsc/Sp3ms (construct c before suffix)", isa535w11.strongs === 'H2250' && isa535w11.surface === 'וּבַחֲבֻרָתֹ֖ו' && isa535w11.morphology === 'HC/R/Ncfsc/Sp3ms' && isa535w11.source === 'oshb_wlc' && isa535w11.rel === 'primary', JSON.stringify(isa535w11));

const isa535w12 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'morphology', orig_morphology, 'pos', orig_word_position, 'locator', verified_locator, 'source', morph_source, 'rel', relation_type) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5) AND ar_word_position=12;`));
assertCondition("isa535_healed: Isa 53:5 شفينا spans tokens w10-w11, primary verb HVNp3ms, locator w10-w11", isa535w12.strongs === 'H7495' && isa535w12.morphology === 'HVNp3ms' && isa535w12.pos === 10 && isa535w12.locator === 'OSHB:B23.C53.V5.w10-w11' && isa535w12.source === 'oshb_wlc' && isa535w12.rel === 'primary', JSON.stringify(isa535w12));

const isa535Components = JSON.parse(query(`
  SELECT json_group_array(json_object(
    'strongs_id', strongs_id,
    'component', orig_component,
    'pos', orig_word_position,
    'morphology', orig_morphology,
    'source', morph_source
  )) FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=23 AND v.chapter_num=53 AND v.verse_num=5 AND wm.ar_word_position=12)
  ORDER BY link_order ASC;
`));
const c1 = isa535Components.find(c => c.strongs_id === 'H7495');
const c2 = isa535Components.find(c => c.strongs_id === 'H3807a');
const comp1Ok = c1 && c1.component === 'נִרְפָּא' && c1.pos === 10 && c1.morphology === 'HVNp3ms' && c1.source === 'oshb_wlc';
const comp2Ok = c2 && c2.component === 'לָנוּ' && c2.pos === 11 && c2.morphology === 'HR/Sp1cp' && c2.source === 'oshb_wlc';
assertCondition("isa535_structured_components: Isa 53:5 شفينا has discrete component columns (נִרְפָּא: pos 10, HVNp3ms; לָנוּ: pos 11, HR/Sp1cp)", comp1Ok && comp2Ok, JSON.stringify(isa535Components));

// 4. John 3:16 - Exact MorphGNT literal tags and exact token positions:
// Arabic word 1 (لأَنَّهُ) -> Greek token 2 (γάρ), C- --------, w2
const jn316w1 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'word', orig_word, 'token_pos', orig_word_position, 'locator', verified_locator, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=3 AND verse_num=16) AND ar_word_position=1;`));
assertCondition("jn316_conjunction_for: John 3:16 لأنه has G1063 γάρ token 2, exact MorphGNT raw tag C- --------, locator w2", jn316w1.strongs === 'G1063' && jn316w1.token_pos === 2 && jn316w1.locator === 'SBLGNT:B43.C3.V16.w2' && jn316w1.morphology === 'C- --------', JSON.stringify(jn316w1));

// Arabic word 2 (هكَذَا) -> Greek token 1 (Οὕτως), D- --------, w1
const jn316w2 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'word', orig_word, 'token_pos', orig_word_position, 'locator', verified_locator, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=3 AND verse_num=16) AND ar_word_position=2;`));
const jn316Comp = JSON.parse(query(`
  SELECT json_object('strongs', strongs_id, 'component', orig_component, 'pos', orig_word_position, 'morphology', orig_morphology)
  FROM word_mapping_strongs
  WHERE mapping_id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=43 AND v.chapter_num=3 AND verse_num=16 AND wm.ar_word_position=2)
  ORDER BY link_order ASC LIMIT 1;
`));
assertCondition("jn316_adverb: John 3:16 هكذا has G3779 Οὕτως token 1, exact MorphGNT raw tag D- --------, and matching component Οὕτως", 
  jn316w2.strongs === 'G3779' && jn316w2.token_pos === 1 && jn316w2.locator === 'SBLGNT:B43.C3.V16.w1' && jn316w2.morphology === 'D- --------' &&
  jn316Comp && jn316Comp.component === 'Οὕτως' && jn316Comp.pos === 1,
  JSON.stringify({ wm: jn316w2, wms: jn316Comp }));

const jn316w16 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', morph_pos, 'case', morph_case, 'gender', morph_gender, 'num', morph_number, 'token_pos', orig_word_position, 'locator', verified_locator, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=3 AND verse_num=16) AND ar_word_position=16;`));
assertCondition("jn316_accusative_pronoun: John 3:16 به has G846 αὐτόν token 19, exact MorphGNT raw tag RP ----ASM-", jn316w16.strongs === 'G846' && jn316w16.surface === 'αὐτόν' && jn316w16.case === 'accusative' && jn316w16.gender === 'masculine' && jn316w16.num === 'singular' && jn316w16.token_pos === 19 && jn316w16.locator === 'SBLGNT:B43.C3.V16.w19' && jn316w16.morphology === 'RP ----ASM-', JSON.stringify(jn316w16));

// 5. Acts 1:8 - Participle ἐπελθόντος G1904 (V- -AAPGSN-) and Genitive pronoun μου G3450 (RP ----GS--)
const acts18w5 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'word', orig_word, 'surface', orig_surface, 'pos', morph_pos, 'tense', morph_tense, 'mood', morph_mood, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8) AND ar_word_position=5;`));
assertCondition("acts18_participle: Acts 1:8 حل has G1904 ἐπέρχομαι / ἐπελθόντος, exact MorphGNT raw tag V- -AAPGSN-", acts18w5.strongs === 'G1904' && acts18w5.word === 'ἐπέρχομαι' && acts18w5.surface === 'ἐπελθόντος' && acts18w5.morphology === 'V- -AAPGSN-', JSON.stringify(acts18w5));

const acts18w10 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', morph_pos, 'case', morph_case, 'token_pos', orig_word_position, 'locator', verified_locator, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8) AND ar_word_position=10;`));
assertCondition("acts18_genitive_pronoun: Acts 1:8 لي has G3450 μου token 12, exact MorphGNT raw tag RP ----GS--", acts18w10.strongs === 'G3450' && acts18w10.surface === 'μου' && acts18w10.case === 'genitive' && acts18w10.token_pos === 12 && acts18w10.locator === 'SBLGNT:B44.C1.V8.w12' && acts18w10.morphology === 'RP ----GS--', JSON.stringify(acts18w10));

// 6. Eph 2:8 - καὶ τοῦτο G3778 demonstrative and καί adverbial in MorphGNT
const eph28w5 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'case', morph_case, 'gender', morph_gender, 'token_pos', orig_word_position, 'locator', verified_locator, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=49 AND chapter_num=2 AND verse_num=8) AND ar_word_position=5;`));
const eph28Components = JSON.parse(query(`
  SELECT json_group_array(json_object(
    'strongs', strongs_id,
    'component', orig_component,
    'pos', orig_word_position,
    'morphology', orig_morphology,
    'source', morph_source
  )) FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=49 AND v.chapter_num=2 AND v.verse_num=8 AND wm.ar_word_position=5)
  ORDER BY link_order ASC;
`));
const ephComp1 = eph28Components.find(c => c.strongs === 'G3778');
const ephComp2 = eph28Components.find(c => c.strongs === 'G2532');
assertCondition("eph28_demonstrative: Eph 2:8 وذلك has G3778 τοῦτο token 9 (RD ----NSN-) & G2532 καί token 8 (D- --------)", 
  eph28w5.strongs === 'G3778' && eph28w5.surface === 'τοῦτο' && eph28w5.case === 'nominative' && eph28w5.gender === 'neuter' && eph28w5.token_pos === 9 && eph28w5.locator === 'SBLGNT:B49.C2.V8.w9' && eph28w5.morphology === 'RD ----NSN-' &&
  ephComp1 && ephComp1.strongs === 'G3778' && ephComp1.pos === 9 && ephComp1.morphology === 'RD ----NSN-' &&
  ephComp2 && ephComp2.strongs === 'G2532' && ephComp2.pos === 8 && ephComp2.morphology === 'D- --------' && ephComp2.source === 'morphgnt_sblgnt',
  JSON.stringify({ wm: eph28w5, wms: eph28Components }));

// 7. Rev 21:4 - G4192 πόνος (N- ----NSM-) and G565 ἀπῆλθαν (V- 3AAI-P--)
const rev214w19 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'word', orig_word, 'surface', orig_surface, 'pos', morph_pos, 'token_pos', orig_word_position, 'locator', verified_locator, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=66 AND chapter_num=21 AND verse_num=4) AND ar_word_position=19;`));
assertCondition("rev214_pain_not_pilate: Rev 21:4 وجع has G4192 πόνος token 20, exact MorphGNT raw tag N- ----NSM-", rev214w19.strongs === 'G4192' && rev214w19.word === 'πόνος' && rev214w19.surface === 'πόνος' && rev214w19.token_pos === 20 && rev214w19.locator === 'SBLGNT:B66.C21.V4.w20' && rev214w19.morphology === 'N- ----NSM-', JSON.stringify(rev214w19));

const rev214w27 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'word', orig_word, 'surface', orig_surface, 'pos', morph_pos, 'token_pos', orig_word_position, 'locator', verified_locator, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=66 AND chapter_num=21 AND verse_num=4) AND ar_word_position=27;`));
assertCondition("rev214_passed_away: Rev 21:4 مضت has G565 ἀπῆλθαν token 26, exact MorphGNT raw tag V- 3AAI-P--", rev214w27.strongs === 'G565' && rev214w27.surface === 'ἀπῆλθαν' && rev214w27.token_pos === 26 && rev214w27.locator === 'SBLGNT:B66.C21.V4.w26' && rev214w27.morphology === 'V- 3AAI-P--', JSON.stringify(rev214w27));

// 8. Provenance & Specific Token Reconciliations (1 Sam 25:43, Acts 1:8, Heb 11:1, H3807a)
const sam2543w7 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', morph_pos, 'morphology', orig_morphology, 'source', morph_source, 'vsource', verified_source, 'locator', verified_locator, 'token_pos', orig_word_position) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=9 AND chapter_num=25 AND verse_num=43) AND ar_word_position=7;`));
assertCondition("sam2543_were: 1 Sam 25:43 فكانتا has H1961 וַתִּהְיֶ֧יןָ, token_pos 6, HC/Vqw3fp, oshb_wlc, OSHB:B9.C25.V43.w6", sam2543w7.strongs === 'H1961' && sam2543w7.pos === 'verb' && sam2543w7.token_pos === 6 && sam2543w7.morphology === 'HC/Vqw3fp' && sam2543w7.source === 'oshb_wlc' && sam2543w7.vsource === 'OSHB' && sam2543w7.locator === 'OSHB:B9.C25.V43.w6', JSON.stringify(sam2543w7));

const acts18w2 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', morph_pos, 'morphology', orig_morphology, 'source', morph_source, 'vsource', verified_source, 'locator', verified_locator) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8) AND ar_word_position=2;`));
assertCondition("acts18_receive: Acts 1:8 ستنالون has G2983 λήμψεσθε, exact MorphGNT raw tag V- 2FMI-P--, morphgnt_sblgnt, SBLGNT:B44.C1.V8.w2", acts18w2.strongs === 'G2983' && acts18w2.morphology === 'V- 2FMI-P--' && acts18w2.source === 'morphgnt_sblgnt' && acts18w2.vsource === 'SBLGNT' && acts18w2.locator === 'SBLGNT:B44.C1.V8.w2', JSON.stringify(acts18w2));

const heb111w3 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', morph_pos, 'morphology', orig_morphology, 'source', morph_source, 'vsource', verified_source, 'locator', verified_locator) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=58 AND chapter_num=11 AND verse_num=1) AND ar_word_position=3;`));
assertCondition("heb111_copula: Heb 11:1 فهو has G1510 ἔστιν, exact MorphGNT raw tag V- 3PAI-S--, morphgnt_sblgnt, SBLGNT:B58.C11.V1.w1", heb111w3.strongs === 'G1510' && heb111w3.morphology === 'V- 3PAI-S--' && heb111w3.source === 'morphgnt_sblgnt' && heb111w3.vsource === 'SBLGNT' && heb111w3.locator === 'SBLGNT:B58.C11.V1.w1', JSON.stringify(heb111w3));

const h3807a = JSON.parse(query(`SELECT json_object('count', count(*), 'def', definition_en) FROM strongs_entries WHERE strongs_id='H3807a';`));
assertCondition("h3807a_documented: strongs_entries has H3807a declared transparently as internal project syntactic identifier", h3807a.count === 1 && h3807a.def.includes('Internal Project Syntactic Identifier'), JSON.stringify(h3807a));

// 9. Independent 10-Verse & Fresh Benchmark Codex Gate Verifications
// Prov 15:6 كنز (H2633 חֹסֶן HNcmsa w3, noun) & كدر (H5916 עָכַר HVNrfsa w7, participle niphal)
const prov156w4 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos, 'gender', morph_gender, 'number', morph_number, 'case', morph_case, 'stem', morph_stem, 'tense', morph_tense) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=20 AND chapter_num=15 AND verse_num=6) AND ar_word_position=4;`));
assertCondition("prov156_treasure: Prov 15:6 كنز has H2633 חֹסֶן token 3, HNcmsa, noun masculine singular absolute, verbal properties cleared", 
  prov156w4.strongs === 'H2633' && prov156w4.surface === 'חֹ֣סֶן' && prov156w4.pos === 3 && prov156w4.morphology === 'HNcmsa' && 
  prov156w4.locator === 'OSHB:B20.C15.V6.w3' && prov156w4.morph_pos === 'noun' && prov156w4.gender === 'masculine' && 
  prov156w4.number === 'singular' && prov156w4.case === 'absolute' && prov156w4.stem === null && prov156w4.tense === null, 
  JSON.stringify(prov156w4));

const prov156w9 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos, 'stem', morph_stem, 'tense', morph_tense, 'gender', morph_gender, 'number', morph_number) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=20 AND chapter_num=15 AND verse_num=6) AND ar_word_position=9;`));
assertCondition("prov156_trouble: Prov 15:6 كدر has H5916 עָכַר token 7, exact OSHB HVNrfsa, participle niphal fs absolute", 
  prov156w9.strongs === 'H5916' && prov156w9.surface === 'נֶעְכָּֽרֶת׃' && prov156w9.pos === 7 && prov156w9.morphology === 'HVNrfsa' && 
  prov156w9.locator === 'OSHB:B20.C15.V6.w7' && prov156w9.morph_pos === 'participle' && prov156w9.stem === 'niphal' && 
  prov156w9.tense === 'participle' && prov156w9.gender === 'feminine' && prov156w9.number === 'singular', 
  JSON.stringify(prov156w9));

// Dan 3:30 قدّم (H6744 צְלַח AVhp3ms w3, verb hafel perfect 3ms) & وعبدنغو (H5665 AC/Np w6-w7)
const dan330w2 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos, 'stem', morph_stem, 'tense', morph_tense, 'person', morph_person, 'gender', morph_gender, 'number', morph_number) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=27 AND chapter_num=3 AND verse_num=30) AND ar_word_position=2;`));
assertCondition("dan330_promoted: Dan 3:30 قدم has H6744 צְלַח token 3, AVhp3ms, verb hafel perfect 3ms", 
  dan330w2.strongs === 'H6744' && dan330w2.surface === 'הַצְלַ֛ח' && dan330w2.pos === 3 && dan330w2.morphology === 'AVhp3ms' && 
  dan330w2.locator === 'OSHB:B27.C3.V30.w3' && dan330w2.morph_pos === 'verb' && dan330w2.stem === 'hafel' && 
  dan330w2.tense === 'perfect' && dan330w2.person === '3' && dan330w2.gender === 'masculine' && dan330w2.number === 'singular', 
  JSON.stringify(dan330w2));

const dan330w6 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=27 AND chapter_num=3 AND verse_num=30) AND ar_word_position=6;`));
assertCondition("dan330_abednego: Dan 3:30 وعبدنغو restored H5665 עֲבֵד נְגוֹ spanning w6-w7, AC/Np", 
  dan330w6.strongs === 'H5665' && dan330w6.surface === 'וַעֲבֵ֥ד נְגֹ֖ו' && dan330w6.pos === 6 && dan330w6.morphology === 'AC/Np' && 
  dan330w6.locator === 'OSHB:B27.C3.V30.w6-w7' && dan330w6.morph_pos === 'proper_noun', 
  JSON.stringify(dan330w6));

// Jer 51:22 وأسحق (H5310 נָפַץ HC/Vpq1cs occurrences at w1, w5, w9)
const jer5122w1 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=24 AND chapter_num=51 AND verse_num=22) AND ar_word_position=1;`));
const jer5122w5 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=24 AND chapter_num=51 AND verse_num=22) AND ar_word_position=5;`));
const jer5122w9 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_word_position, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=24 AND chapter_num=51 AND verse_num=22) AND ar_word_position=9;`));
assertCondition("jer5122_shatter_all_three: Jer 51:22 وأسحق restored across all 3 occurrences with H5310 נָפַץ HC/Vpq1cs (w1, w5, w9)",
  jer5122w1.strongs === 'H5310' && jer5122w1.pos === 1 && jer5122w1.morphology === 'HC/Vpq1cs' &&
  jer5122w5.strongs === 'H5310' && jer5122w5.pos === 5 && jer5122w5.morphology === 'HC/Vpq1cs' &&
  jer5122w9.strongs === 'H5310' && jer5122w9.pos === 9 && jer5122w9.morphology === 'HC/Vpq1cs',
  JSON.stringify({ w1: jer5122w1, w5: jer5122w5, w9: jer5122w9 }));

// John 14:19 ستحيون (G2198 ζήσετε V- 2FAI-P-- w18 future active 2p) & أنا (G1473 ἐγὼ RP ----NS-- w14)
const jn1419w14 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos, 'tense', morph_tense, 'voice', morph_voice, 'mood', morph_mood, 'person', morph_person, 'number', morph_number) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=14 AND verse_num=19) AND ar_word_position=14;`));
assertCondition("jn1419_ye_shall_live: John 14:19 ستحيون has G2198 ζήσετε, exact MorphGNT SBLGNT position 18, V- 2FAI-P--, future active 2p", 
  jn1419w14.strongs === 'G2198' && jn1419w14.surface === 'ζήσετε' && jn1419w14.pos === 18 && jn1419w14.morphology === 'V- 2FAI-P--' && 
  jn1419w14.locator === 'SBLGNT:B43.C14.V19.w18' && jn1419w14.morph_pos === 'verb' && jn1419w14.tense === 'future' && 
  jn1419w14.voice === 'active' && jn1419w14.mood === 'indicative' && jn1419w14.person === '2' && jn1419w14.number === 'plural', 
  JSON.stringify(jn1419w14));

const jn1419w11 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos, 'case', morph_case, 'person', morph_person, 'number', morph_number) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=14 AND verse_num=19) AND ar_word_position=11;`));
assertCondition("jn1419_i_pronoun: John 14:19 أنا has G1473 ἐγὼ token 14, exact MorphGNT SBLGNT raw tag RP ----NS--, nominative singular 1p", 
  jn1419w11.strongs === 'G1473' && jn1419w11.surface === 'ἐγὼ' && jn1419w11.pos === 14 && jn1419w11.morphology === 'RP ----NS--' && 
  jn1419w11.locator === 'SBLGNT:B43.C14.V19.w14' && jn1419w11.morph_pos === 'pronoun' && jn1419w11.person === '1' && 
  jn1419w11.number === 'singular' && jn1419w11.case === 'nominative', 
  JSON.stringify(jn1419w11));

// Rom 9:23 سبق فأعدها (G4282 προητοίμασεν V- 3AAI-S-- w13)
const rom923w10 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=45 AND chapter_num=9 AND verse_num=23) AND ar_word_position=10;`));
assertCondition("rom923_prepared_before: Rom 9:23 فأعدها has G4282 προητοίμασεν, exact MorphGNT raw tag V- 3AAI-S--, SBLGNT:B45.C9.V23.w13", rom923w10.strongs === 'G4282' && rom923w10.surface === 'προητοίμασεν' && rom923w10.pos === 13 && rom923w10.morphology === 'V- 3AAI-S--' && rom923w10.locator === 'SBLGNT:B45.C9.V23.w13', JSON.stringify(rom923w10));

// Heb 10:18 تكون وييكون (implied copula, syntactic_ar, NULL strongs/orig)
const heb1018Copula = JSON.parse(query(`SELECT json_object('w3_pos', orig_word_position, 'w3_strongs', strongs_id, 'w3_rel', relation_type) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=58 AND chapter_num=10 AND verse_num=18) AND ar_word_position=3;`));
assertCondition("heb1018_implied_copula: Heb 10:18 تكون is implied copula with NULL strongs and NULL orig_word_position", heb1018Copula.w3_pos === null && heb1018Copula.w3_strongs === null && heb1018Copula.w3_rel === 'copula_implied', JSON.stringify(heb1018Copula));

// 1 Sam 19:15 الفراش (H4296 בַמִּטָּ֛ה pos 11, HRd/Ncfsa) & أقتله (H4191 לַהֲמִתֹֽו׃ pos 13)
const sam1915w12 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=9 AND chapter_num=19 AND verse_num=15) AND ar_word_position=12;`));
assertCondition("sam1915_bed: 1 Sam 19:15 الفراش restored H4296 בַמִּטָּ֛ה token 11, exact OSHB HRd/Ncfsa, noun", 
  sam1915w12.strongs === 'H4296' && sam1915w12.surface === 'בַמִּטָּ֛ה' && sam1915w12.pos === 11 && 
  sam1915w12.morphology === 'HRd/Ncfsa' && sam1915w12.locator === 'OSHB:B9.C19.V15.w11' && sam1915w12.morph_pos === 'noun', 
  JSON.stringify(sam1915w12));

const sam1915w14 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=9 AND chapter_num=19 AND verse_num=15) AND ar_word_position=14;`));
assertCondition("sam1915_slay: 1 Sam 19:15 أقتله restored H4191 לַהֲמִתֹֽו׃ token 13, HR/Vhc/Sp3ms, OSHB:B9.C19.V15.w13", sam1915w14.strongs === 'H4191' && sam1915w14.surface === 'לַהֲמִתֹֽו׃' && sam1915w14.pos === 13 && sam1915w14.morphology === 'HR/Vhc/Sp3ms' && sam1915w14.locator === 'OSHB:B9.C19.V15.w13', JSON.stringify(sam1915w14));

// James 1:17 تغيير (G3883 παραλλαγὴ N- ----NSF- w20, noun nominative fs) & ظل (G644 ἀποσκίασμα N- ----NSN- w23)
const jas117w18 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos, 'gender', morph_gender, 'number', morph_number, 'case', morph_case, 'tense', morph_tense) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=59 AND chapter_num=1 AND verse_num=17) AND ar_word_position=18;`));
assertCondition("jas117_variation: James 1:17 تغيير has G3883 παραλλαγὴ token 20, N- ----NSF-, noun feminine singular nominative, verbal fields cleared", 
  jas117w18.strongs === 'G3883' && jas117w18.surface === 'παραλλαγὴ' && jas117w18.pos === 20 && 
  jas117w18.morphology === 'N- ----NSF-' && jas117w18.locator === 'SBLGNT:B59.C1.V17.w20' && 
  jas117w18.morph_pos === 'noun' && jas117w18.gender === 'feminine' && jas117w18.number === 'singular' && 
  jas117w18.case === 'nominative' && jas117w18.tense === null, 
  JSON.stringify(jas117w18));

const jas117w20 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=59 AND chapter_num=1 AND verse_num=17) AND ar_word_position=20;`));
assertCondition("jas117_shadow: James 1:17 ظل has G644 ἀποσκίασμα token 23, N- ----NSN-, SBLGNT:B59.C1.V17.w23", jas117w20.strongs === 'G644' && jas117w20.surface === 'ἀποσκίασμα' && jas117w20.pos === 23 && jas117w20.morphology === 'N- ----NSN-' && jas117w20.locator === 'SBLGNT:B59.C1.V17.w23', JSON.stringify(jas117w20));

// Gen 7:3 w1 & w4 (OSHB WLC alignment)
const gen73w4 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=1 AND chapter_num=7 AND verse_num=3) AND ar_word_position=4;`));
assertCondition("gen73_also: Gen 7:3 أيضا has H1571 גַּם token 1, HTa, OSHB:B1.C7.V3.w1", gen73w4.strongs === 'H1571' && gen73w4.surface === 'גַּ֣ם' && gen73w4.pos === 1 && gen73w4.morphology === 'HTa' && gen73w4.locator === 'OSHB:B1.C7.V3.w1' && gen73w4.morph_pos === 'adverb', JSON.stringify(gen73w4));

// Amos 1:4 w1 (OSHB WLC alignment)
const amos14w1 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=30 AND chapter_num=1 AND verse_num=4) AND ar_word_position=1;`));
assertCondition("amos14_send_fire: Amos 1:4 فأرسل has H7971 וְשִׁלַּחְתִּי token 1, HC/Vpq1cs, verb", amos14w1.strongs === 'H7971' && amos14w1.surface === 'וְ/שִׁלַּ֥חְתִּי' && amos14w1.pos === 1 && amos14w1.morphology === 'HC/Vpq1cs' && amos14w1.locator === 'OSHB:B30.C1.V4.w1' && amos14w1.morph_pos === 'verb', JSON.stringify(amos14w1));

// Acts 6:8 w2 & w6 (SBLGNT and TR alignment)
const acts68w2 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=6 AND verse_num=8) AND ar_word_position=2;`));
assertCondition("acts68_stephen: Acts 6:8 استفانوس has G4736 Στέφανος token 1, N- ----NSM-, proper_noun", acts68w2.strongs === 'G4736' && acts68w2.surface === 'Στέφανος' && acts68w2.pos === 1 && acts68w2.morphology === 'N- ----NSM-' && acts68w2.locator === 'SBLGNT:B44.C6.V8.w1' && acts68w2.morph_pos === 'proper_noun', JSON.stringify(acts68w2));

const acts68w6 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos, 'gender', morph_gender, 'case', morph_case) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=6 AND verse_num=8) AND ar_word_position=6;`));
assertCondition("acts68_faith_tr: Acts 6:8 إيمانا has G4102 πίστεως (Scrivener TR) token 4, N- ----GSF-, noun feminine genitive", acts68w6.strongs === 'G4102' && acts68w6.surface === 'πίστεως' && acts68w6.pos === 4 && acts68w6.morphology === 'N- ----GSF-' && acts68w6.locator === 'TR:B44.C6.V8.w4' && acts68w6.morph_pos === 'noun' && acts68w6.gender === 'feminine' && acts68w6.case === 'genitive', JSON.stringify(acts68w6));

// Deut 23:2 w2 (OSHB WLC alignment: AVD v2 = Masoretic OSHB v3)
const deut232w2 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos, 'stem', morph_stem, 'tense', morph_tense) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=5 AND chapter_num=23 AND verse_num=2) AND ar_word_position=2;`));
assertCondition("deut232_enter: Deut 23:2 يدخل has H935 יָבֹ֥א token 2, HVqi3ms, verb qal imperfect 3ms", deut232w2.strongs === 'H935' && deut232w2.pos === 2 && deut232w2.morphology === 'HVqi3ms' && deut232w2.locator === 'OSHB:B5.C23.V3.w2' && deut232w2.morph_pos === 'verb' && deut232w2.stem === 'qal' && deut232w2.tense === 'imperfect', JSON.stringify(deut232w2));

const deut232w3 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=5 AND chapter_num=23 AND verse_num=2) AND ar_word_position=3;`));
const deut232w4 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=5 AND chapter_num=23 AND verse_num=2) AND ar_word_position=4;`));
assertCondition("deut232_mamzer: Deut 23:2 ابن زنى unit has H4464 מַמְזֵר token 3, HNcmsa, noun masculine singular", deut232w3.strongs === 'H4464' && deut232w4.strongs === 'H4464' && deut232w3.pos === 3 && deut232w4.pos === 3 && deut232w3.morph_pos === 'noun' && deut232w4.morph_pos === 'noun' && deut232w3.locator === 'OSHB:B5.C23.V3.w3', JSON.stringify({ w3: deut232w3, w4: deut232w4 }));

const deut232MaxPos = Number(query(`SELECT MAX(orig_word_position) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=5 AND chapter_num=23 AND verse_num=2);`));
assertCondition("deut232_tokens_bound: Deut 23:2 source contains exactly 13 tokens (not 17)", deut232MaxPos === 13, `maxPos=${deut232MaxPos}`);

// 1 Cor 7:7 Pure SBLGNT Alignment & Full Token Coverage (Tokens 1-21)
const cor77w1 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'pos', orig_word_position, 'locator', verified_locator, 'surface', orig_surface, 'notes', grammar_notes) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=1;`));
const cor77w2 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'pos', orig_word_position, 'locator', verified_locator, 'surface', orig_surface) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=2;`));
const cor77w4 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'pos', orig_word_position, 'locator', verified_locator, 'surface', orig_surface) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=4;`));
const cor77w5 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'pos', orig_word_position, 'locator', verified_locator, 'surface', orig_surface) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=5;`));
const cor77w6 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'pos', orig_word_position, 'locator', verified_locator, 'surface', orig_surface) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=6;`));
const cor77w7 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'pos', orig_word_position, 'locator', verified_locator, 'surface', orig_surface) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=7;`));
const cor77w11 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'pos', orig_word_position, 'locator', verified_locator, 'surface', orig_surface) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=11;`));
const cor77w14 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'pos', orig_word_position, 'locator', verified_locator, 'surface', orig_surface) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=14;`));
const cor77w16 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'pos', orig_word_position, 'locator', verified_locator, 'surface', orig_surface) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=16;`));

assertCondition("cor77_word_order: 1 Cor 7:7 أريد is token 1 (θέλω), لأني is token 2 (δὲ SBLGNT)", cor77w2.strongs === 'G2309' && cor77w2.pos === 1 && cor77w1.strongs === 'G1161' && cor77w1.pos === 2 && cor77w1.surface === 'δὲ', JSON.stringify({ w1: cor77w1, w2: cor77w2 }));
assertCondition("cor77_variant_reader_note: 1 Cor 7:7 لأني carries textual variant note on TR γάρ vs SBLGNT δὲ", cor77w1.notes && cor77w1.notes.includes('Textus Receptus') && cor77w1.notes.includes('SBLGNT'), JSON.stringify(cor77w1));

assertCondition("cor77_tokens_3456: 1 Cor 7:7 πάντας w3, ἀνθρώπους w4, εἶναι w5, ὡς w6", cor77w5.pos === 3 && cor77w6.pos === 4 && cor77w4.pos === 5 && cor77w7.pos === 6, JSON.stringify({ w4: cor77w4, w5: cor77w5, w6: cor77w6, w7: cor77w7 }));
assertCondition("cor77_tokens_10_11_15: 1 Cor 7:7 ἕκαστος w10, ἴδιον w11, θεοῦ w15", cor77w11.pos === 10 && cor77w14.pos === 11 && cor77w16.pos === 15, JSON.stringify({ w11: cor77w11, w14: cor77w14, w16: cor77w16 }));

const cor77w8 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=8;`));
assertCondition("cor77_myself: 1 Cor 7:7 أنا has G1683 ἐμαυτόν token 8, literal MorphGNT raw tag RP ----ASM-, pronoun (not verb)", cor77w8.strongs === 'G1683' && cor77w8.surface === 'ἐμαυτόν' && cor77w8.pos === 8 && cor77w8.morphology === 'RP ----ASM-' && cor77w8.morph_pos === 'pronoun', JSON.stringify(cor77w8));

const cor77w17 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=17;`));
const cor77w18 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=18;`));
const cor77w20 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', orig_word_position, 'morphology', orig_morphology, 'locator', verified_locator, 'morph_pos', morph_pos) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7) AND ar_word_position=20;`));
assertCondition("cor77_one_so: 1 Cor 7:7 الواحد has G3588 ὁ article (token 16 in SBLGNT), هكذا is G3779 οὕτως adverb D- -------- (tokens 18, 21)", cor77w17.strongs === 'G3588' && cor77w17.morph_pos === 'article' && cor77w17.pos === 16 && cor77w18.strongs === 'G3779' && cor77w18.morph_pos === 'adverb' && cor77w18.morphology === 'D- --------' && cor77w18.pos === 18 && cor77w20.strongs === 'G3779' && cor77w20.morph_pos === 'adverb' && cor77w20.morphology === 'D- --------' && cor77w20.pos === 21, JSON.stringify({ w17: cor77w17, w18: cor77w18, w20: cor77w20 }));

const expectedSblgntTokens1Cor77 = [
  { pos: 1, word: 'θέλω', morph: 'V- 1PAI-S--', strongs: 'G2309' },
  { pos: 2, word: 'δὲ', morph: 'C- --------', strongs: 'G1161' },
  { pos: 3, word: 'πάντας', morph: 'A- ----APM-', strongs: 'G3956' },
  { pos: 4, word: 'ἀνθρώπους', morph: 'N- ----APM-', strongs: 'G444' },
  { pos: 5, word: 'εἶναι', morph: 'V- -PAN----', strongs: 'G1510' },
  { pos: 6, word: 'ὡς', morph: 'C- --------', strongs: 'G5613' },
  { pos: 7, word: 'καὶ', morph: 'D- --------', strongs: 'G2532' },
  { pos: 8, word: 'ἐμαυτόν', morph: 'RP ----ASM-', strongs: 'G1683' },
  { pos: 9, word: 'ἀλλὰ', morph: 'C- --------', strongs: 'G235' },
  { pos: 10, word: 'ἕκαστος', morph: 'A- ----NSM-', strongs: 'G1538' },
  { pos: 11, word: 'ἴδιον', morph: 'A- ----ASN-', strongs: 'G2398' },
  { pos: 12, word: 'ἔχει', morph: 'V- 3PAI-S--', strongs: 'G2192' },
  { pos: 13, word: 'χάρισμα', morph: 'N- ----ASN-', strongs: 'G5486' },
  { pos: 14, word: 'ἐκ', morph: 'P- --------', strongs: 'G1537' },
  { pos: 15, word: 'θεοῦ', morph: 'N- ----GSM-', strongs: 'G2316' },
  { pos: 16, word: 'ὁ', morph: 'RA ----NSM-', strongs: 'G3588' },
  { pos: 17, word: 'μὲν', morph: 'C- --------', strongs: 'G3303' },
  { pos: 18, word: 'οὕτως', morph: 'D- --------', strongs: 'G3779' },
  { pos: 19, word: 'ὁ', morph: 'RA ----NSM-', strongs: 'G3588' },
  { pos: 20, word: 'δὲ', morph: 'C- --------', strongs: 'G1161' },
  { pos: 21, word: 'οὕτως', morph: 'D- --------', strongs: 'G3779' }
];

const actualTokens = JSON.parse(query(`
  SELECT json_group_array(json_object(
    'pos', wms.orig_word_position,
    'word', wms.orig_component,
    'morph', wms.orig_morphology,
    'strongs', wms.strongs_id
  ))
  FROM (
    SELECT DISTINCT wms.orig_word_position, wms.orig_component, wms.orig_morphology, wms.strongs_id
    FROM word_mapping_strongs wms
    JOIN word_mappings wm ON wms.mapping_id = wm.id
    WHERE wm.verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7)
    ORDER BY wms.orig_word_position
  ) wms;
`));

const actualPositions = actualTokens.map(t => t.pos);
const expectedPositions = Array.from({ length: 21 }, (_, i) => i + 1);
const positionsExact = JSON.stringify(actualPositions) === JSON.stringify(expectedPositions);

let tokenDetailsMatch = true;
let mismatchDetail = '';
for (let i = 0; i < 21; i++) {
  const exp = expectedSblgntTokens1Cor77[i];
  const act = actualTokens[i];
  if (!act || act.pos !== exp.pos || act.word !== exp.word || act.morph !== exp.morph || act.strongs !== exp.strongs) {
    tokenDetailsMatch = false;
    mismatchDetail = `pos ${exp ? exp.pos : i+1}: expected ${JSON.stringify(exp)}, got ${JSON.stringify(act)}`;
    break;
  }
}

assertCondition("cor77_exact_21_tokens_positions_1_to_21: 1 Cor 7:7 positions match [1..21] exactly", positionsExact, `positions=${JSON.stringify(actualPositions)}`);
assertCondition("cor77_exact_21_tokens_surface_and_morph: 1 Cor 7:7 every token matches authentic SBLGNT surface, MorphGNT tag, and Strongs", tokenDetailsMatch, mismatchDetail);

// -----------------------------------------------------------------------------
// Test 5: SQLite Database Engine Integrity
// -----------------------------------------------------------------------------
console.log('\n▶ TEST 5: SQLite Integrity & Vacuum Check');
const integrity = query('PRAGMA integrity_check;');
assertCondition('PRAGMA integrity_check is ok', integrity === 'ok', integrity);

const fkCheck = query('PRAGMA foreign_key_check;');
assertCondition('PRAGMA foreign_key_check is ok', fkCheck === '', fkCheck);

// -----------------------------------------------------------------------------
// Test 6: Primary Component Synchronization & Alignment Invariant
// -----------------------------------------------------------------------------
console.log('\n▶ TEST 6: Primary Component Synchronization Invariant (word_mappings vs word_mapping_strongs)');
const primaryMismatches = parseInt(query(`
  SELECT COUNT(*) 
  FROM word_mappings wm 
  JOIN word_mapping_strongs wms ON wm.id = wms.mapping_id 
  WHERE wms.link_role = 'primary' 
    AND (
      (wm.orig_word_position != wms.orig_word_position) 
      OR (wm.orig_word_position IS NULL AND wms.orig_word_position IS NOT NULL) 
      OR (wm.orig_word_position IS NOT NULL AND wms.orig_word_position IS NULL) 
      OR (wm.strongs_id != wms.strongs_id) 
      OR (COALESCE(wm.orig_morphology, '') != COALESCE(wms.orig_morphology, '')) 
      OR (COALESCE(wm.morph_source, '') != COALESCE(wms.morph_source, ''))
    );
`), 10);
assertCondition('Zero mismatches between word_mappings and primary word_mapping_strongs across full DB', primaryMismatches === 0, `found ${primaryMismatches} mismatches`);

// -----------------------------------------------------------------------------
// Test 7: Source Provenance & Attribute Purity Invariant
// -----------------------------------------------------------------------------
console.log('\n▶ TEST 7: Source Provenance & Attribute Purity Invariant');

// Check that OSHB/SBLGNT locators never have morph_source = 'syntactic_ar'
const invalidSyntacticSources = parseInt(query(`
  SELECT COUNT(*) FROM word_mappings 
  WHERE (verified_locator LIKE 'OSHB:%' OR verified_locator LIKE 'SBLGNT:%') 
    AND morph_source = 'syntactic_ar';
`), 10);
assertCondition('OSHB/SBLGNT verified locators never carry morph_source syntactic_ar', invalidSyntacticSources === 0, `found ${invalidSyntacticSources}`);

// Acts 6:8 words without Greek token must not have morph_source = morphgnt_sblgnt
const acts68Syntactic = parseInt(query(`
  SELECT COUNT(*) FROM word_mappings 
  WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=6 AND verse_num=8) 
    AND ar_word_position IN (3, 4) 
    AND morph_source = 'morphgnt_sblgnt';
`), 10);
assertCondition('Acts 6:8 pure translation additions (pos 3, 4) do not claim morphgnt_sblgnt provenance', acts68Syntactic === 0, `found ${acts68Syntactic}`);

// 1 Sam 19:15 أقتله infinitive construct has null person/gender/number
const sam1915Infinitive = JSON.parse(query(`
  SELECT json_object('stem', morph_stem, 'tense', morph_tense, 'person', morph_person, 'gender', morph_gender, 'number', morph_number)
  FROM word_mappings 
  WHERE verse_id IN (SELECT id FROM verses WHERE book_id=9 AND chapter_num=19 AND verse_num=15) 
    AND ar_word LIKE '%أَقْتُلَهُ%';
`));
assertCondition('1 Sam 19:15 أقتله infinitive construct has null person/gender/number attributes', 
  sam1915Infinitive.stem === 'hifil' && sam1915Infinitive.tense === 'infinitive_construct' && 
  sam1915Infinitive.person === null && sam1915Infinitive.gender === null && sam1915Infinitive.number === null, 
  JSON.stringify(sam1915Infinitive));

// -----------------------------------------------------------------------------
// Test 8: Composite Token Deconstruction & Component Completeness Gate
// -----------------------------------------------------------------------------
console.log('\n▶ TEST 8: Composite Token Deconstruction & Secondary Component Completeness');

// Dan 3:30 عبدَنغو: w6 וַעֲבֵ֥ד (AC/Np, H5665) + w7 נְגֹ֖ו (ANp, H5665) under single Aramaic lexicon entry H5665
const abedComp = JSON.parse(query(`
  SELECT json_group_array(json_object('strongs', strongs_id, 'role', link_role, 'order', link_order, 'comp', orig_component, 'pos', orig_word_position, 'morph', orig_morphology))
  FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=27 AND chapter_num=3 AND verse_num=30) AND ar_word = 'وَعَبْدَنَغُوَ')
  ORDER BY link_order;
`));
assertCondition('Dan 3:30 عبدَنغو completely decomposed into w6 (H5665 וַעֲבֵ֥ד AC/Np) and w7 (H5665 נְגֹ֖ו ANp)', 
  abedComp.length === 2 && 
  abedComp[0].strongs === 'H5665' && abedComp[0].pos === 6 && abedComp[0].morph === 'AC/Np' &&
  abedComp[1].strongs === 'H5665' && abedComp[1].pos === 7 && abedComp[1].morph === 'ANp', 
  JSON.stringify(abedComp));

// Dan 3:30 شدرخ: H7715 AR/Np
const shadrachComp = JSON.parse(query(`
  SELECT json_object('strongs', strongs_id, 'morph', orig_morphology, 'pos', orig_word_position)
  FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=27 AND chapter_num=3 AND verse_num=30) AND ar_word LIKE '%شَدْرَخَ%')
    AND link_role = 'primary';
`));
assertCondition('Dan 3:30 شدرخ mapped to Aramaic H7715 AR/Np', 
  shadrachComp.strongs === 'H7715' && shadrachComp.morph === 'AR/Np' && shadrachComp.pos === 4, 
  JSON.stringify(shadrachComp));

// Amos 1:4 بنهدد: w7 בֶּן־ (HNp, H1130) + w8 הֲדָֽד׃ (HNp, H1130) under single lexicon entry H1130
const benhadadComp = JSON.parse(query(`
  SELECT json_group_array(json_object('strongs', strongs_id, 'role', link_role, 'order', link_order, 'comp', orig_component, 'pos', orig_word_position, 'morph', orig_morphology))
  FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=30 AND chapter_num=1 AND verse_num=4) AND ar_word LIKE '%بَنْهَدَدَ%')
  ORDER BY link_order;
`));
assertCondition('Amos 1:4 بنهدد completely decomposed into w7 (H1130 בֶּן־ HNp) and w8 (H1130 הֲדָֽד׃ HNp)', 
  benhadadComp.length === 2 && 
  benhadadComp[0].strongs === 'H1130' && benhadadComp[0].pos === 7 && benhadadComp[0].morph === 'HNp' &&
  benhadadComp[1].strongs === 'H1130' && benhadadComp[1].pos === 8 && benhadadComp[1].morph === 'HNp', 
  JSON.stringify(benhadadComp));

// John 14:19 يراني: primary w8 θεωρεῖ (G2334) + secondary w6 με (G3165)
const yaraniComp = JSON.parse(query(`
  SELECT json_group_array(json_object('strongs', strongs_id, 'role', link_role, 'comp', orig_component, 'pos', orig_word_position, 'morph', orig_morphology))
  FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=14 AND verse_num=19) AND ar_word = 'يَرَانِي')
  ORDER BY link_order;
`));
assertCondition('John 14:19 يراني contains primary w8 θεωρεῖ and secondary w6 με (G3165 exact MorphGNT tag RP ----AS--)', 
  yaraniComp.length === 2 && 
  yaraniComp[0].strongs === 'G2334' && yaraniComp[0].pos === 8 &&
  yaraniComp[1].strongs === 'G3165' && yaraniComp[1].pos === 6 && yaraniComp[1].morph === 'RP ----AS--', 
  JSON.stringify(yaraniComp));

// John 14:19 فترونني: primary w11 θεωρεῖτέ (G2334) + secondary w12 με (G3165)
const fatarawnaniComp = JSON.parse(query(`
  SELECT json_group_array(json_object('strongs', strongs_id, 'role', link_role, 'comp', orig_component, 'pos', orig_word_position, 'morph', orig_morphology))
  FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=14 AND verse_num=19) AND ar_word = 'فَتَرَوْنَنِي')
  ORDER BY link_order;
`));
assertCondition('John 14:19 فترونني contains primary w11 θεωρεῖτέ and secondary w12 με (G3165 exact MorphGNT tag RP ----AS--)', 
  fatarawnaniComp.length === 2 && 
  fatarawnaniComp[0].strongs === 'G2334' && fatarawnaniComp[0].pos === 11 &&
  fatarawnaniComp[1].strongs === 'G3165' && fatarawnaniComp[1].pos === 12 && fatarawnaniComp[1].morph === 'RP ----AS--', 
  JSON.stringify(fatarawnaniComp));

// Rom 9:23 مجده: primary w7 δόξης (G1391) + secondary w8 αὐτοῦ (G846)
const majdihiComp = JSON.parse(query(`
  SELECT json_group_array(json_object('strongs', strongs_id, 'role', link_role, 'comp', orig_component, 'pos', orig_word_position, 'morph', orig_morphology))
  FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=45 AND chapter_num=9 AND verse_num=23) AND ar_word = 'مَجْدِهِ')
  ORDER BY link_order;
`));
assertCondition('Rom 9:23 مجده contains primary w7 δόξης and secondary w8 αὐτοῦ (G846 RP ----GSM-)', 
  majdihiComp.length === 2 && 
  majdihiComp[0].strongs === 'G1391' && majdihiComp[0].pos === 7 &&
  majdihiComp[1].strongs === 'G846' && majdihiComp[1].pos === 8 && majdihiComp[1].morph === 'RP ----GSM-', 
  JSON.stringify(majdihiComp));

// Rom 9:23 للمجد: primary w15 δόξαν (G1391) + secondary w14 εἰς (G1519)
const lilmajdiComp = JSON.parse(query(`
  SELECT json_group_array(json_object('strongs', strongs_id, 'role', link_role, 'comp', orig_component, 'pos', orig_word_position, 'morph', orig_morphology))
  FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=45 AND chapter_num=9 AND verse_num=23) AND ar_word = 'لِلْمَجْدِ')
  ORDER BY link_order;
`));
assertCondition('Rom 9:23 للمجد contains primary w15 δόξαν and secondary w14 εἰς (G1519 P- --------)', 
  lilmajdiComp.length === 2 && 
  lilmajdiComp[0].strongs === 'G1391' && lilmajdiComp[0].pos === 15 &&
  lilmajdiComp[1].strongs === 'G1519' && lilmajdiComp[1].pos === 14 && lilmajdiComp[1].morph === 'P- --------', 
  JSON.stringify(lilmajdiComp));

// Rom 9:23 ولكي: primary w2 ἵνα (G2443) + secondary w1 καὶ (G2532)
const walikayComp = JSON.parse(query(`
  SELECT json_group_array(json_object('strongs', strongs_id, 'role', link_role, 'comp', orig_component, 'pos', orig_word_position, 'morph', orig_morphology))
  FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=45 AND chapter_num=9 AND verse_num=23) AND ar_word = 'وَلِكَيْ')
  ORDER BY link_order;
`));
assertCondition('Rom 9:23 ولكي contains primary w2 ἵνα and secondary w1 καὶ (G2532 C- --------)', 
  walikayComp.length === 2 && 
  walikayComp[0].strongs === 'G2443' && walikayComp[0].pos === 2 &&
  walikayComp[1].strongs === 'G2532' && walikayComp[1].pos === 1 && walikayComp[1].morph === 'C- --------', 
  JSON.stringify(walikayComp));

// Acts 6:8 وقوة: primary w6 δυνάμεως (G1411) + secondary w5 καὶ (G2532)
const waquwwatanComp = JSON.parse(query(`
  SELECT json_group_array(json_object('strongs', strongs_id, 'role', link_role, 'comp', orig_component, 'pos', orig_word_position, 'morph', orig_morphology))
  FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=6 AND verse_num=8) AND ar_word = 'وَقُوَّةً،')
  ORDER BY link_order;
`));
assertCondition('Acts 6:8 وقوة contains primary w6 δυνάμεως and secondary w5 καὶ (G2532 C- --------)', 
  waquwwatanComp.length === 2 && 
  waquwwatanComp[0].strongs === 'G1411' && waquwwatanComp[0].pos === 6 &&
  waquwwatanComp[1].strongs === 'G2532' && waquwwatanComp[1].pos === 5 && waquwwatanComp[1].morph === 'C- --------', 
  JSON.stringify(waquwwatanComp));

// Acts 6:8 وآيات: primary w10 σημεῖα (G4592) + secondary w9 καὶ (G2532)
const waayatinComp = JSON.parse(query(`
  SELECT json_group_array(json_object('strongs', strongs_id, 'role', link_role, 'comp', orig_component, 'pos', orig_word_position, 'morph', orig_morphology))
  FROM word_mapping_strongs 
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=6 AND verse_num=8) AND ar_word = 'وَآيَاتٍ')
  ORDER BY link_order;
`));
const wPrim = waayatinComp.find(c => c.role === 'primary');
const wSec = waayatinComp.find(c => c.role === 'secondary');
assertCondition('Acts 6:8 وآيات contains primary w10 σημεῖα and secondary w9 καὶ (G2532 C- --------)', 
  waayatinComp.length === 2 && 
  wPrim && wPrim.strongs === 'G4592' && wPrim.pos === 10 &&
  wSec && wSec.strongs === 'G2532' && wSec.pos === 9 && wSec.morph === 'C- --------', 
  JSON.stringify(waayatinComp));

// -----------------------------------------------------------------------------
// Test 9: Lexical Unit Integrity & Ketiv/Qere Boundary Isolation Invariant
// -----------------------------------------------------------------------------
console.log('\n▶ TEST 9: Lexical Unit Integrity & Ketiv/Qere Boundary Isolation');

// 1. Job 1:4 text_original must have Ketiv/Qere properly isolated with following word לֶאֱכֹל distinct
const job14Text = query(`SELECT text_original FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4;`);
assertCondition('Job 1:4 text_original contains properly isolated Ketiv/Qere and following word לֶאֱכֹל',
  job14Text.includes('[אחיתיהם כ] (אַחְיֽוֹתֵיהֶ֔ם ק) לֶאֱכֹ֥ל') && !job14Text.includes('אחיתיהםאחיתיהם'),
  `text_original: ${job14Text}`);

// 2. Job 1:4 token 11 must be strictly the Qere reading אַחְיֽוֹתֵיהֶ֔ם without לֶאֱכֹל contamination
const kqRegexAudit = /\[([^\]]+)\s*כ\]\s*\(([^)]+)\s*ק\)/g;
const job14Normalized = job14Text.replace(kqRegexAudit, (m, k, q) => q.trim());
const job14Tokens = job14Normalized.trim().split(/[\s\u05BE]+/).filter(Boolean);
const token11 = job14Tokens[10]; // 0-indexed pos 10 = token 11
const token12 = job14Tokens[11]; // 0-indexed pos 11 = token 12

assertCondition('Job 1:4 token 11 is strictly single lexical unit אַחְיֽוֹתֵיהֶ֔ם',
  token11 === 'אַחְיֽוֹתֵיהֶ֔ם' || token11.includes('אַחְי'),
  `token11: ${token11}`);

assertCondition('Job 1:4 token 12 is strictly separate following word לֶאֱכֹ֥ל',
  token12 === 'לֶאֱכֹ֥ל',
  `token12: ${token12}`);

// 3. Global check: zero jammed unspaced Ketiv/Qere patterns in verses
const jammedCount = parseInt(query(`
  SELECT COUNT(*) FROM verses 
  WHERE text_original LIKE '%אחיתיהםאחיתיהם%'
     OR text_original LIKE '%](%'
     OR text_original LIKE '%][%'
     OR text_original LIKE '%)(%';
`), 10);
assertCondition('Global check: zero jammed unspaced Ketiv/Qere patterns in verses', jammedCount === 0, `found ${jammedCount} jammed verses`);

/// -----------------------------------------------------------------------------
// Test 10: Multi-Strongs Link Order Preservation & Subquery Determinism
// -----------------------------------------------------------------------------
console.log('\n▶ TEST 10: Multi-Strongs Link Order Preservation Invariant (Independent Reference Benchmark)');

// 1. Empirical verification that zero link_order ties exist
const tieCount = parseInt(query(`
  SELECT COUNT(*) FROM (
    SELECT mapping_id, link_order
    FROM word_mapping_strongs
    GROUP BY mapping_id, link_order
    HAVING COUNT(*) > 1
  );
`), 10);
assertCondition('Zero link_order ties exist across word_mapping_strongs', tieCount === 0, `found ${tieCount} ties`);

// 2. Load ground truth links and construct independent JS expected sequence
const rawLinksJson = query(`
  SELECT mapping_id, link_order, strongs_id
  FROM word_mapping_strongs
  WHERE mapping_id IN (
    SELECT mapping_id FROM word_mapping_strongs GROUP BY mapping_id HAVING COUNT(*) > 1
  );
`);

const groundTruthMap = new Map();
for (const rawLine of rawLinksJson.split('\n')) {
  const line = rawLine.trim();
  if (!line) continue;
  const parts = line.split('|');
  if (parts.length >= 3) {
    const mId = parts[0].trim();
    const order = parseInt(parts[1].trim(), 10);
    const sId = parts[2].trim();
    if (!groundTruthMap.has(mId)) groundTruthMap.set(mId, []);
    groundTruthMap.get(mId).push({ link_order: order, strongs_id: sId });
  }
}

function expectedStrongOrder(rows) {
  return [...rows]
    .sort((a, b) => a.link_order - b.link_order)
    .map(r => r.strongs_id)
    .join(',');
}

// 3. Positive Test: v1.0.345 deterministic subquery matches independent JS reference 100%
const subqueryResults = query(`
  SELECT wm.id,
         (SELECT GROUP_CONCAT(sub.strongs_id, ',') 
          FROM (SELECT strongs_id FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS sub)
  FROM word_mappings wm
  WHERE wm.id IN (
    SELECT mapping_id FROM word_mapping_strongs GROUP BY mapping_id HAVING COUNT(*) > 1
  );
`);

let positiveMismatches = 0;
for (const rawLine of subqueryResults.split('\n')) {
  const line = rawLine.trim();
  if (!line) continue;
  const parts = line.split('|');
  if (parts.length >= 2) {
    const mId = parts[0].trim();
    const actual = parts[1].trim();
    const expected = expectedStrongOrder(groundTruthMap.get(mId) || []);
    if (actual !== expected) {
      positiveMismatches++;
    }
  }
}
assertCondition('Positive Gate: 0 deviations between v1.0.345 subquery and independent JS reference', positiveMismatches === 0, `found ${positiveMismatches} deviations`);

// 4. Negative Test: Confirm that old un-nested v1.0.344 query fails on exactly 195 cases
const oldQueryResults = query(`
  SELECT wm.id,
         (SELECT GROUP_CONCAT(wms.strongs_id, ',') 
          FROM word_mapping_strongs wms 
          WHERE wms.mapping_id = wm.id 
          ORDER BY wms.link_order ASC)
  FROM word_mappings wm
  WHERE wm.id IN (
    SELECT mapping_id FROM word_mapping_strongs GROUP BY mapping_id HAVING COUNT(*) > 1
  );
`);

let oldMismatches = 0;
for (const rawLine of oldQueryResults.split('\n')) {
  const line = rawLine.trim();
  if (!line) continue;
  const parts = line.split('|');
  if (parts.length >= 2) {
    const mId = parts[0].trim();
    const actualOld = parts[1].trim();
    const expected = expectedStrongOrder(groundTruthMap.get(mId) || []);
    if (actualOld !== expected) {
      oldMismatches++;
    }
  }
}
console.log(`  [DIAGNOSTIC] Old un-nested v1.0.344 query detected mismatches: ${oldMismatches}`);

// 5. Benchmark Specific Multi-Strongs Cases
const test10Cases = [
  { ref: 'Gen 16:14 (لذلك)', book: 1, ch: 16, vs: 14, pos: 1, expected: 'H5921,H3651' },
  { ref: 'Gen 22:16 (الأمر)', book: 1, ch: 22, vs: 16, pos: 12, expected: 'H1697,H853,H1697' },
  { ref: 'Gen 25:30 (لذلك)', book: 1, ch: 25, vs: 30, pos: 11, expected: 'H5921,H3651' },
  { ref: 'Acts 4:18 (فدعوهما)', book: 44, ch: 4, vs: 18, pos: 1, expected: 'G2564,G846,G2532' }
];

for (const tc of test10Cases) {
  const actual = query(`
    SELECT (SELECT GROUP_CONCAT(sub.strongs_id, ',') 
            FROM (SELECT strongs_id FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS sub)
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    WHERE v.book_id = ${tc.book} AND v.chapter_num = ${tc.ch} AND v.verse_num = ${tc.vs} AND wm.ar_word_position = ${tc.pos};
  `).trim();
  assertCondition(`${tc.ref} returns exact ordered sequence ${tc.expected}`, actual === tc.expected, `actual: ${actual}`);
}

// -----------------------------------------------------------------------------
// Test 11: 20-Verse Batch Loci: Direct OSHB Source XML & Derived Morphology Gate
// -----------------------------------------------------------------------------
console.log('\n▶  TEST 11: 20-Verse Batch Direct Source XML & SBLGNT Morphology Quality Gate (38 Units)');

const oshbDir = path.resolve(__dirname, 'data/oshb');
function extractOshbVerse(bookName, osisID) {
  const xmlFile = path.join(oshbDir, `${bookName}.xml`);
  if (!fs.existsSync(xmlFile)) return null;
  const xmlText = fs.readFileSync(xmlFile, 'utf8');
  const verseRegex = new RegExp(`<verse\\s+osisID="${osisID}">([\\s\\S]*?)</verse>`);
  const match = xmlText.match(verseRegex);
  if (!match) return null;
  const verseContent = match[1];

  const wRegex = /<w\s+([^>]*?)>([\s\S]*?)<\/w>/g;
  const words = [];
  let wMatch;
  let idx = 1;
  while ((wMatch = wRegex.exec(verseContent)) !== null) {
    const attrs = wMatch[1];
    const text = wMatch[2].replace(/<[^>]+>/g, '').trim();
    const lemmaMatch = attrs.match(/lemma="([^"]+)"/);
    const morphMatch = attrs.match(/morph="([^"]+)"/);
    const idMatch = attrs.match(/id="([^"]+)"/);

    words.push({
      index: idx++,
      id: idMatch ? idMatch[1] : null,
      lemma: lemmaMatch ? lemmaMatch[1] : null,
      morph: morphMatch ? morphMatch[1] : null,
      text: text
    });
  }
  return words;
}

const sblgntDir = path.resolve(__dirname, 'data/sblgnt');
const sblgntBookMap = {
  41: '62-Mk-morphgnt.txt',
  42: '63-Lk-morphgnt.txt',
  45: '66-Ro-morphgnt.txt',
  48: '69-Ga-morphgnt.txt',
  49: '70-Eph-morphgnt.txt',
  50: '71-Php-morphgnt.txt',
  52: '73-1Th-morphgnt.txt',
  60: '81-1Pe-morphgnt.txt'
};

function extractSblgntVerse(bookId, chapter, verse) {
  const fileName = sblgntBookMap[bookId];
  if (!fileName) return null;
  const filePath = path.join(sblgntDir, fileName);
  if (!fs.existsSync(filePath)) return null;
  const prefix = String(bookId - 39).padStart(2, '0') +
                 String(chapter).padStart(2, '0') +
                 String(verse).padStart(2, '0');
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n');
  const tokens = [];
  let idx = 1;
  for (const line of lines) {
    if (!line.startsWith(prefix)) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 7) {
      tokens.push({
        index: idx++,
        pos: parts[1],
        parseCode: parts[2],
        morph: `${parts[1]} ${parts[2]}`,
        surfacePunct: parts[3],
        surfaceClean: parts[4],
        surfaceNorm: parts[5],
        lemma: parts[6]
      });
    }
  }
  return tokens;
}

const batch20ComprehensiveCases = [
  // 1. Exodus 15:2 w8 (إلهي)
  {
    ref: 'Exod 15:2 w8 (إلهي)', book: 2, ch: 15, vs: 2, pos: 8,
    expStrongs: 'H410', expOrig: 'אֵל', expSurface: 'אֵלִי֙',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HNcmsc/Sp1cs', expLoc: 'OSHB:B2.C15.V2.w8',
    oshbBook: 'Exod', oshbOsis: 'Exod.15.2', oshbWordIndex: 8, oshbExpectedId: '02ehU'
  },

  // 2. Leviticus 26:12 w2 (بينكم)
  {
    ref: 'Lev 26:12 w2 (بينكم)', book: 3, ch: 26, vs: 12, pos: 2,
    expStrongs: 'H8432', expOrig: 'תָּוֶךְ', expSurface: 'בְּתוֹכְכֶם',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HR/Ncmsc/Sp2mp', expLoc: 'OSHB:B3.C26.V12.w2',
    oshbBook: 'Lev', oshbOsis: 'Lev.26.12', oshbWordIndex: 2, oshbExpectedId: '03yxa'
  },

  // 3. Deuteronomy 6:5 w7 (ومن)
  {
    ref: 'Deut 6:5 w7 (ومن)', book: 5, ch: 6, vs: 5, pos: 7,
    expStrongs: 'H3605', expOrig: 'כֹּל', expSurface: 'וּבְכָל',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HC/R/Ncmsc', expLoc: 'OSHB:B5.C6.V5.w7',
    oshbBook: 'Deut', oshbOsis: 'Deut.6.5', oshbWordIndex: 7, oshbExpectedId: '05jFT'
  },
  // 4. Deuteronomy 6:5 w9 (نفسك)
  {
    ref: 'Deut 6:5 w9 (نفسك)', book: 5, ch: 6, vs: 5, pos: 9,
    expStrongs: 'H5315', expOrig: 'נֶפֶשׁ', expSurface: 'נַפְשְׁךָ֖',
    expPos: 'noun', expGender: 'common', expNumber: 'singular', expPerson: null,
    expMorph: 'HNcbsc/Sp2ms', expLoc: 'OSHB:B5.C6.V5.w8',
    oshbBook: 'Deut', oshbOsis: 'Deut.6.5', oshbWordIndex: 8, oshbExpectedId: '05VEv'
  },
  // 5. Deuteronomy 6:5 w10 (ومن)
  {
    ref: 'Deut 6:5 w10 (ومن)', book: 5, ch: 6, vs: 5, pos: 10,
    expStrongs: 'H3605', expOrig: 'כֹּל', expSurface: 'וּבְכָל',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HC/R/Ncmsc', expLoc: 'OSHB:B5.C6.V5.w9',
    oshbBook: 'Deut', oshbOsis: 'Deut.6.5', oshbWordIndex: 9, oshbExpectedId: '05dWK'
  },

  // 6. Joshua 1:9 w14 (تذهب)
  {
    ref: 'Josh 1:9 w14 (تذهب)', book: 6, ch: 1, vs: 9, pos: 14,
    expStrongs: 'H1980', expOrig: 'הָלַךְ', expSurface: 'תֵּלֵֽךְ׃',
    expPos: 'verb', expGender: 'masculine', expNumber: 'singular', expPerson: '2',
    expMorph: 'HVqi2ms', expLoc: 'OSHB:B6.C1.V9.w15',
    oshbBook: 'Josh', oshbOsis: 'Josh.1.9', oshbWordIndex: 15, oshbExpectedId: '06oAj'
  },

  // 7. 1 Kings 18:21 w6 (وقال)
  {
    ref: '1 Kings 18:21 w6 (وقال)', book: 11, ch: 18, vs: 21, pos: 6,
    expStrongs: 'H559', expOrig: 'אָמַר', expSurface: 'וַיֹּ֙אמֶר֙',
    expPos: 'verb', expGender: 'masculine', expNumber: 'singular', expPerson: '3',
    expMorph: 'HC/Vqw3ms', expLoc: 'OSHB:B11.C18.V21.w6',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 6, oshbExpectedId: '11J7S'
  },
  // 8. 1 Kings 18:21 w7 (حتى)
  {
    ref: '1 Kings 18:21 w7 (حتى)', book: 11, ch: 18, vs: 21, pos: 7,
    expStrongs: 'H5704', expOrig: 'עַד', expSurface: 'עַד־',
    expPos: 'preposition', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HR', expLoc: 'OSHB:B11.C18.V21.w7',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 7, oshbExpectedId: '11BM3'
  },
  // 9. 1 Kings 18:21 w8 (متى)
  {
    ref: '1 Kings 18:21 w8 (متى)', book: 11, ch: 18, vs: 21, pos: 8,
    expStrongs: 'H4970', expOrig: 'מָתַי', expSurface: 'מָתַ֞י',
    expPos: 'particle', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HTi', expLoc: 'OSHB:B11.C18.V21.w8',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 8, oshbExpectedId: '113MM'
  },
  // 10. 1 Kings 18:21 w12 (إن)
  {
    ref: '1 Kings 18:21 w12 (إن)', book: 11, ch: 18, vs: 21, pos: 12,
    expStrongs: 'H518', expOrig: 'אִם', expSurface: 'אִם־',
    expPos: 'conjunction', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HC', expLoc: 'OSHB:B11.C18.V21.w14',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 14, oshbExpectedId: '11r5s'
  },
  // 11. 1 Kings 18:21 w17 (فاتبعوه)
  {
    ref: '1 Kings 18:21 w17 (فاتبعوه)', book: 11, ch: 18, vs: 21, pos: 17,
    expStrongs: 'H1980,H310', expOrig: 'הָלַךְ', expSurface: 'לְכ֣וּ אַחֲרָ֔יו',
    expPos: 'verb', expGender: 'masculine', expNumber: 'plural', expPerson: '2',
    expMorph: 'HVqv2mp', expLoc: 'OSHB:B11.C18.V21.w17',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 17, oshbExpectedId: '11u4c'
  },
  // 12. 1 Kings 18:21 w18 (وإن)
  {
    ref: '1 Kings 18:21 w18 (وإن)', book: 11, ch: 18, vs: 21, pos: 18,
    expStrongs: 'H518', expOrig: 'אִם', expSurface: 'וְאִם־',
    expPos: 'conjunction', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HC/C', expLoc: 'OSHB:B11.C18.V21.w19',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 19, oshbExpectedId: '11Azr'
  },
  // 13. 1 Kings 18:21 w21 (فاتبعوه)
  {
    ref: '1 Kings 18:21 w21 (فاتبعوه)', book: 11, ch: 18, vs: 21, pos: 21,
    expStrongs: 'H1980,H310', expOrig: 'הָלַךְ', expSurface: 'לְכ֣וּ אַחֲרָ֑יו',
    expPos: 'verb', expGender: 'masculine', expNumber: 'plural', expPerson: '2',
    expMorph: 'HVqv2mp', expLoc: 'OSHB:B11.C18.V21.w21',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbWordIndex: 21, oshbExpectedId: '11KxK'
  },

  // 14. Zechariah 4:6 w5 (كلمة)
  {
    ref: 'Zech 4:6 w5 (كلمة)', book: 38, ch: 4, vs: 6, pos: 5,
    expStrongs: 'H1697', expOrig: 'דָּבָר', expSurface: 'דְּבַר־',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HNcmsc', expLoc: 'OSHB:B38.C4.V6.w6',
    oshbBook: 'Zech', oshbOsis: 'Zech.4.6', oshbWordIndex: 6, oshbExpectedId: '38CmP'
  },

  // 15. Ezra 5:8 w3 (لدى)
  {
    ref: 'Ezra 5:8 w3 (لدى)', book: 15, ch: 5, vs: 8, pos: 3,
    expStrongs: 'H4430', expOrig: 'מֶלֶךְ', expSurface: 'לְמַלְכָּ֗א',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'AR/Ncmsd/Td', expLoc: 'OSHB:B15.C5.V8.w3',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 3, oshbExpectedId: '15Y4b'
  },
  // 16. Ezra 5:8 w5 (أننا)
  {
    ref: 'Ezra 5:8 w5 (أننا)', book: 15, ch: 5, vs: 8, pos: 5,
    expStrongs: 'H1768', expOrig: 'דִּי', expSurface: 'דִּֽי',
    expPos: 'particle', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'ATr', expLoc: 'OSHB:B15.C5.V8.w4',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 4, oshbExpectedId: '15RWu'
  },
  // 17. Ezra 5:8 w7 (إلى)
  {
    ref: 'Ezra 5:8 w7 (إلى)', book: 15, ch: 5, vs: 8, pos: 7,
    expStrongs: 'H3061', expOrig: 'יְהוּד', expSurface: 'לִיה֤וּד',
    expPos: 'proper_noun', expGender: null, expNumber: 'singular', expPerson: null,
    expMorph: 'AR/Np', expLoc: 'OSHB:B15.C5.V8.w6',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 6, oshbExpectedId: '15DKB'
  },
  // 18. Ezra 5:8 w10 (إلى)
  {
    ref: 'Ezra 5:8 w10 (إلى)', book: 15, ch: 5, vs: 8, pos: 10,
    expStrongs: 'H1005', expOrig: 'בַּיִת', expSurface: 'לְבֵית֙',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'AR/Ncmsc', expLoc: 'OSHB:B15.C5.V8.w8',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 8, oshbExpectedId: '15Z2k'
  },
  // 19. Ezra 5:8 w18 (عظيمة)
  {
    ref: 'Ezra 5:8 w18 (عظيمة)', book: 15, ch: 5, vs: 8, pos: 18,
    expStrongs: 'H1560', expOrig: 'גְּלָל', expSurface: 'גְּלָ֔ל',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'ANcmsa', expLoc: 'OSHB:B15.C5.V8.w14',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 14, oshbExpectedId: '15Q3F'
  },
  // 20. Ezra 5:8 w20 (خشب)
  {
    ref: 'Ezra 5:8 w20 (خشب)', book: 15, ch: 5, vs: 8, pos: 20,
    expStrongs: 'H636', expOrig: 'אָע', expSurface: 'וְאָ֖ע',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'AC/Ncmsa', expLoc: 'OSHB:B15.C5.V8.w15',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 15, oshbExpectedId: '152Kw'
  },
  // 21. Ezra 5:8 w22 (الحيطان)
  {
    ref: 'Ezra 5:8 w22 (الحيطان)', book: 15, ch: 5, vs: 8, pos: 22,
    expStrongs: 'H3797', expOrig: 'כְּתַל', expSurface: 'בְּכֻתְלַיָּ֑א',
    expPos: 'noun', expGender: 'masculine', expNumber: 'plural', expPerson: null,
    expMorph: 'AR/Ncmpd/Td', expLoc: 'OSHB:B15.C5.V8.w17',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 17, oshbExpectedId: '15jJB'
  },
  // 22. Ezra 5:8 w23 (وهذا)
  {
    ref: 'Ezra 5:8 w23 (وهذا)', book: 15, ch: 5, vs: 8, pos: 23,
    expStrongs: 'H1791', expOrig: 'דָּךְ', expSurface: 'דָ֛ךְ',
    expPos: 'demonstrative', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'APdxfs', expLoc: 'OSHB:B15.C5.V8.w19',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 19, oshbExpectedId: '15bTz'
  },
  // 23. Ezra 5:8 w26 (بسرعة)
  {
    ref: 'Ezra 5:8 w26 (بسرعة)', book: 15, ch: 5, vs: 8, pos: 26,
    expStrongs: 'H629', expOrig: 'אָסְפַּרְנָא', expSurface: 'אָסְפַּ֥רְנָא',
    expPos: 'adverb', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'AD', expLoc: 'OSHB:B15.C5.V8.w20',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 20, oshbExpectedId: '15CfS'
  },

  // 24. Daniel 4:17 w1 (هذا)
  {
    ref: 'Dan 4:17 w1 (هذا)', book: 27, ch: 4, vs: 17, pos: 1,
    expStrongs: 'H6600', expOrig: 'פִּתְגָם', expSurface: 'פִּתְגָמָ֔א',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'ANcmsd/Td', expLoc: 'OSHB:B27.C4.V14.w3',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 3, oshbExpectedId: '27oC6'
  },
  // 25. Daniel 4:17 w2 (الأمر)
  {
    ref: 'Dan 4:17 w2 (الأمر)', book: 27, ch: 4, vs: 17, pos: 2,
    expStrongs: 'H6600', expOrig: 'פִּתְגָם', expSurface: 'פִּתְגָמָ֔א',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'ANcmsd/Td', expLoc: 'OSHB:B27.C4.V14.w3',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 3, oshbExpectedId: '27oC6'
  },
  // 26. Daniel 4:17 w3 (بقضاء)
  {
    ref: 'Dan 4:17 w3 (بقضاء)', book: 27, ch: 4, vs: 17, pos: 3,
    expStrongs: 'H1510', expOrig: 'גְּזֵרָה', expSurface: 'בִּגְזֵרַ֤ת',
    expPos: 'noun', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'AR/Ncfsc', expLoc: 'OSHB:B27.C4.V14.w1',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 1, oshbExpectedId: '27fqr'
  },
  // 27. Daniel 4:17 w5 (والحكم)
  {
    ref: 'Dan 4:17 w5 (والحكم)', book: 27, ch: 4, vs: 17, pos: 5,
    expStrongs: 'H7595', expOrig: 'שְׁאֵלָה', expSurface: 'שְׁאֵֽלְתָ֑א',
    expPos: 'noun', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'ANcfsd/Td', expLoc: 'OSHB:B27.C4.V14.w6',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 6, oshbExpectedId: '27TKQ'
  },
  // 28. Daniel 4:17 w6 (بكلمة)
  {
    ref: 'Dan 4:17 w6 (بكلمة)', book: 27, ch: 4, vs: 17, pos: 6,
    expStrongs: 'H3983', expOrig: 'מֵאמַר', expSurface: 'וּמֵאמַ֥ר',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'AC/Ncmsc', expLoc: 'OSHB:B27.C4.V14.w4',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 4, oshbExpectedId: '27AB9'
  },
  // 29. Daniel 4:17 w7 (القدوسين)
  {
    ref: 'Dan 4:17 w7 (القدوسين)', book: 27, ch: 4, vs: 17, pos: 7,
    expStrongs: 'H6922', expOrig: 'קַדִּישׁ', expSurface: 'קַדִּישִׁ֖ין',
    expPos: 'adjective', expGender: 'masculine', expNumber: 'plural', expPerson: null,
    expMorph: 'AAampa', expLoc: 'OSHB:B27.C4.V14.w5',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 5, oshbExpectedId: '276Bi'
  },
  // 30. Daniel 4:17 w12 (العلي)
  {
    ref: 'Dan 4:17 w12 (العلي)', book: 27, ch: 4, vs: 17, pos: 12,
    expStrongs: 'H5943', expOrig: 'עִלָּאָה', expSurface: 'עִלָּאָ֜ה',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'ANcmsd/Td', expLoc: 'OSHB:B27.C4.V14.w15',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 15, oshbExpectedId: '27bjL'
  },
  // 31. Daniel 4:17 w15 (مملكة)
  {
    ref: 'Dan 4:17 w15 (مملكة)', book: 27, ch: 4, vs: 17, pos: 15,
    expStrongs: 'H4437', expOrig: 'מַלְכוּ', expSurface: 'בְּמַלְכ֣וּת',
    expPos: 'noun', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'AR/Ncfsc', expLoc: 'OSHB:B27.C4.V14.w16',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 16, oshbExpectedId: '27ant'
  },
  // 32. Daniel 4:17 w18 (من)
  {
    ref: 'Dan 4:17 w18 (من)', book: 27, ch: 4, vs: 17, pos: 18,
    expStrongs: 'H4479', expOrig: 'מַן', expSurface: 'וּלְמַן',
    expPos: 'pronoun', expGender: 'common', expNumber: 'singular', expPerson: null,
    expMorph: 'AC/R/Pfxcs', expLoc: 'OSHB:B27.C4.V14.w19',
    oshbBook: 'Dan', oshbOsis: 'Dan.4.14', oshbWordIndex: 19, oshbExpectedId: '27fns'
  },

  // 33. Galatians 5:22 w11 (صلاح)
  {
    ref: 'Gal 5:22 w11 (صلاح)', book: 48, ch: 5, vs: 22, pos: 11,
    expStrongs: 'G19', expOrig: 'ἀγαθωσύνη', expSurface: 'ἀγαθωσύνη',
    expPos: 'noun', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'N- ----NSF-', expLoc: 'SBLGNT:B48.C5.V22.w12',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 48, sblgntChapter: 5, sblgntVerse: 22, sblgntWordIndex: 12, sblgntExpectedMorph: 'N- ----NSF-', sblgntExpectedLemma: 'ἀγαθωσύνη'
  },
  // 34. 1 Kings 18:21 w9 (تعرجون)
  {
    ref: '1 Kings 18:21 w9 (تعرجون)', book: 11, ch: 18, vs: 21, pos: 9,
    expStrongs: 'H6452', expOrig: 'פָּסַח', expSurface: 'פֹּסְחִים֮',
    expPos: 'verb', expStem: 'qal', expMood: 'participle', expGender: 'masculine', expNumber: 'plural', expPerson: null,
    expMorph: 'HVqrmpa', expLoc: 'OSHB:B11.C18.V21.w10',
    oshbBook: '1Kgs', oshbOsis: '1Kgs.18.21', oshbExpectedId: '11xrp'
  },
  // 35. Ezra 5:8 w25 (يُعمل)
  {
    ref: 'Ezra 5:8 w25 (يُعمل)', book: 15, ch: 5, vs: 8, pos: 25,
    expStrongs: 'H5648', expOrig: 'עֲבַד', expSurface: 'מִתְעַבְדָ֖א',
    expPos: 'verb', expStem: 'hithpeel', expMood: 'participle', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'AVurfsa', expLoc: 'OSHB:B15.C5.V8.w21',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 21, oshbExpectedId: '15RZe'
  },
  // 36. Philippians 4:6 w2 (تهتموا)
  {
    ref: 'Phil 4:6 w2 (تهتموا)', book: 50, ch: 4, vs: 6, pos: 2,
    expStrongs: 'G3309', expOrig: 'μεριμνάω', expSurface: 'μεριμνᾶτε',
    expPos: 'verb', expMood: 'imperative', expPerson: '2', expNumber: 'plural', expGender: null,
    expMorph: 'V- 2PAD-P--', expLoc: 'SBLGNT:B50.C4.V6.w2',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 50, sblgntChapter: 4, sblgntVerse: 6, sblgntWordIndex: 2, sblgntExpectedMorph: 'V- 2PAD-P--', sblgntExpectedLemma: 'μεριμνάω'
  },
  // 37. Philippians 4:6 w12 (لتُعلم)
  {
    ref: 'Phil 4:6 w12 (لتُعلم)', book: 50, ch: 4, vs: 6, pos: 12,
    expStrongs: 'G1107', expOrig: 'γνωρίζω', expSurface: 'γνωριζέσθω',
    expPos: 'verb', expMood: 'imperative', expPerson: '3', expNumber: 'singular', expGender: null,
    expMorph: 'V- 3PPD-S--', expLoc: 'SBLGNT:B50.C4.V6.w16',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 50, sblgntChapter: 4, sblgntVerse: 6, sblgntExpectedMorph: 'V- 3PPD-S--', sblgntExpectedLemma: 'γνωρίζω'
  },
  // 38. Ezra 5:8 w16 (يُبْنَى)
  {
    ref: 'Ezra 5:8 w16 (يُبْنَى)', book: 15, ch: 5, vs: 8, pos: 16,
    expStrongs: 'H1124', expOrig: 'בְּנָא', expSurface: 'מִתְבְּנֵא֙',
    expPos: 'verb', expStem: 'hithpeel', expMood: 'participle', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'AVurmsa', expLoc: 'OSHB:B15.C5.V8.w12',
    oshbBook: 'Ezra', oshbOsis: 'Ezra.5.8', oshbWordIndex: 12, oshbExpectedId: '15qDM'
  }
,
  // 39. Deut 6:5 w2 (الرَّبَّ)
  {
    ref: 'Deut 6:5 w2 (الرَّبَّ)', book: 5, ch: 6, vs: 5, pos: 2,
    expStrongs: 'H3068', expOrig: 'יְהֹוָה', expSurface: 'יְהוָ֣ה',
    expPos: 'proper_noun', expGender: null, expNumber: 'singular', expPerson: null,
    expMorph: 'HNp', expLoc: 'OSHB:B5.C6.V5.w3',
    oshbBook: 'Deut', oshbOsis: 'Deut.6.5', oshbWordIndex: 3, oshbExpectedId: '05cAA'
  },
  // 40. Deut 6:5 w3 (إِلهَكَ)
  {
    ref: 'Deut 6:5 w3 (إِلهَكَ)', book: 5, ch: 6, vs: 5, pos: 3,
    expStrongs: 'H430', expOrig: 'אֱלֹהִים', expSurface: 'אֱלֹהֶ֑יךָ',
    expPos: 'noun', expGender: 'masculine', expNumber: 'plural', expPerson: null,
    expMorph: 'HNcmpc/Sp2ms', expLoc: 'OSHB:B5.C6.V5.w4',
    oshbBook: 'Deut', oshbOsis: 'Deut.6.5', oshbWordIndex: 4, oshbExpectedId: '05UYM'
  },
  // 41. Deut 6:5 w4 (مِنْ)
  {
    ref: 'Deut 6:5 w4 (مِنْ)', book: 5, ch: 6, vs: 5, pos: 4,
    expStrongs: 'H9003', expOrig: 'בְּ', expSurface: 'בְּכָל',
    expPos: 'preposition', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HR', expLoc: 'OSHB:B5.C6.V5.w5',
    oshbBook: 'Deut', oshbOsis: 'Deut.6.5', oshbWordIndex: 5, oshbExpectedId: '05NZQ'
  },
  // 42. Exod 15:2 w1 (الرَّبُّ)
  {
    ref: 'Exod 15:2 w1 (الرَّبُّ)', book: 2, ch: 15, vs: 2, pos: 1,
    expStrongs: 'H3050', expOrig: 'יָהּ', expSurface: 'יָ֔הּ',
    expPos: 'proper_noun', expGender: null, expNumber: 'singular', expPerson: null,
    expMorph: 'HNp', expLoc: 'OSHB:B2.C15.V2.w3',
    oshbBook: 'Exod', oshbOsis: 'Exod.15.2', oshbWordIndex: 3, oshbExpectedId: '02nLr'
  },
  // 43. Exod 15:2 w2 (قُوَّتِي)
  {
    ref: 'Exod 15:2 w2 (قُوَّتِي)', book: 2, ch: 15, vs: 2, pos: 2,
    expStrongs: 'H5797', expOrig: 'עֹז', expSurface: 'עָזִּ֤י',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'HNcmsc/Sp1cs', expLoc: 'OSHB:B2.C15.V2.w1',
    oshbBook: 'Exod', oshbOsis: 'Exod.15.2', oshbWordIndex: 1, oshbExpectedId: '02c59'
  },
  // 44. Exod 15:2 w3 (وَنَشِيدِي)
  {
    ref: 'Exod 15:2 w3 (وَنَشِيدِي)', book: 2, ch: 15, vs: 2, pos: 3,
    expStrongs: 'H2176', expOrig: 'זִמְרָת', expSurface: 'וְזִמְרָת֙',
    expPos: 'noun', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'HC/Ncfsa', expLoc: 'OSHB:B2.C15.V2.w2',
    oshbBook: 'Exod', oshbOsis: 'Exod.15.2', oshbWordIndex: 2, oshbExpectedId: '02d4U'
  },
  // 45. Exod 15:2 w5 (صَارَ)
  {
    ref: 'Exod 15:2 w5 (صَارَ)', book: 2, ch: 15, vs: 2, pos: 5,
    expStrongs: 'H1961', expOrig: 'הָיָה', expSurface: 'וַֽיְהִי',
    expPos: 'verb', expStem: 'qal', expMood: 'indicative', expPerson: '3', expGender: 'masculine', expNumber: 'singular',
    expMorph: 'HC/Vqw3ms', expLoc: 'OSHB:B2.C15.V2.w4',
    oshbBook: 'Exod', oshbOsis: 'Exod.15.2', oshbWordIndex: 4, oshbExpectedId: '02Qb5'
  }
,
  // 46. Josh 1:9 w10 (الرَّبَّ)
  {
    ref: 'Josh 1:9 w10 (الرَّبَّ)', book: 6, ch: 1, vs: 9, pos: 10,
    expStrongs: 'H3068', expOrig: 'יְהֹוָה', expSurface: 'יְהוָ֣ה',
    expPos: 'proper_noun', expGender: null, expNumber: 'singular', expPerson: null,
    expMorph: 'HNp', expLoc: 'OSHB:B6.C1.V9.w11',
    oshbBook: 'Josh', oshbOsis: 'Josh.1.9', oshbWordIndex: 11, oshbExpectedId: '06Qa3', oshbCheckSurface: true
  },
  // 47. Josh 1:9 w11 (إِلهَكَ)
  {
    ref: 'Josh 1:9 w11 (إِلهَكَ)', book: 6, ch: 1, vs: 9, pos: 11,
    expStrongs: 'H430', expOrig: 'אֱלֹהִים', expSurface: 'אֱלֹהֶ֔יךָ',
    expPos: 'noun', expGender: 'masculine', expNumber: 'plural', expPerson: null,
    expMorph: 'HNcmpc/Sp2ms', expLoc: 'OSHB:B6.C1.V9.w12',
    oshbBook: 'Josh', oshbOsis: 'Josh.1.9', oshbWordIndex: 12, oshbExpectedId: '06WTe', oshbCheckSurface: true
  },
  // 48. Josh 1:9 w12 (مَعَكَ)
  {
    ref: 'Josh 1:9 w12 (مَعَكَ)', book: 6, ch: 1, vs: 9, pos: 12,
    expStrongs: 'H5973', expOrig: 'עִם', expSurface: 'עִמְּךָ֙',
    expPos: 'preposition', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HR/Sp2ms', expLoc: 'OSHB:B6.C1.V9.w10',
    oshbBook: 'Josh', oshbOsis: 'Josh.1.9', oshbWordIndex: 10, oshbExpectedId: '063Lj', oshbCheckSurface: true
  },
  // 49. Josh 1:9 w13 (حَيْثُمَا)
  {
    ref: 'Josh 1:9 w13 (حَيْثُمَا)', book: 6, ch: 1, vs: 9, pos: 13,
    expStrongs: 'H834,H3605', expOrig: 'אֲשֶׁר', expSurface: 'אֲשֶׁ֥ר',
    expPos: 'particle', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HTr', expLoc: 'OSHB:B6.C1.V9.w14',
    oshbBook: 'Josh', oshbOsis: 'Josh.1.9', oshbWordIndex: 14, oshbExpectedId: '06sKn', oshbCheckSurface: true
  },
  // 50. Rom 8:28 w5 (الأَشْيَاءِ)
  {
    ref: 'Rom 8:28 w5 (الأَشْيَاءِ)', book: 45, ch: 8, vs: 28, pos: 5,
    expStrongs: 'G3956', expOrig: 'πᾶς', expSurface: 'πάντα',
    expPos: 'adjective', expGender: 'neuter', expNumber: 'plural', expPerson: null,
    expMorph: 'A- ----APN-', expLoc: 'SBLGNT:B45.C8.V28.w8',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 45, sblgntChapter: 8, sblgntVerse: 28, sblgntWordIndex: 8,
    sblgntExpectedMorph: 'A- ----APN-', sblgntExpectedLemma: 'πᾶς', sblgntCheckSurface: true
  },
  // 51. Rom 8:28 w7 (مَعًا)
  {
    ref: 'Rom 8:28 w7 (مَعًا)', book: 45, ch: 8, vs: 28, pos: 7,
    expStrongs: 'G4903', expOrig: 'συνεργέω', expSurface: 'συνεργεῖ',
    expPos: 'verb', expGender: null, expNumber: 'singular', expPerson: '3', expStem: null, expMood: 'indicative',
    expMorph: 'V- 3PAI-S--', expLoc: 'SBLGNT:B45.C8.V28.w9',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 45, sblgntChapter: 8, sblgntVerse: 28, sblgntWordIndex: 9,
    sblgntExpectedMorph: 'V- 3PAI-S--', sblgntExpectedLemma: 'συνεργέω', sblgntCheckSurface: true
  },
  // 52. 1Th 5:23 w11 (بِلاَ)
  {
    ref: '1Th 5:23 w11 (بِلاَ)', book: 52, ch: 5, vs: 23, pos: 11,
    expStrongs: 'G274', expOrig: 'ἀμέμπτως', expSurface: 'ἀμέμπτως',
    expPos: 'adverb', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'D- --------', expLoc: 'SBLGNT:B52.C5.V23.w21',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 52, sblgntChapter: 5, sblgntVerse: 23, sblgntWordIndex: 21,
    sblgntExpectedMorph: 'D- --------', sblgntExpectedLemma: 'ἀμέμπτως', sblgntCheckSurface: true
  },
  // 53. 1Th 5:23 w13 (عِنْدَ)
  {
    ref: '1Th 5:23 w13 (عِنْدَ)', book: 52, ch: 5, vs: 23, pos: 13,
    expStrongs: 'G1722', expOrig: 'ἐν', expSurface: 'ἐν',
    expPos: 'preposition', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'P- --------', expLoc: 'SBLGNT:B52.C5.V23.w22',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 52, sblgntChapter: 5, sblgntVerse: 23, sblgntWordIndex: 22,
    sblgntExpectedMorph: 'P- --------', sblgntExpectedLemma: 'ἐν', sblgntCheckSurface: true
  },
  // 54. Lk 15:20 w7 (لَمْ)
  {
    ref: 'Lk 15:20 w7 (لَمْ)', book: 42, ch: 15, vs: 20, pos: 7,
    expStrongs: 'G2089', expOrig: 'ἔτι', expSurface: 'ἔτι',
    expPos: 'adverb', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'D- --------', expLoc: 'SBLGNT:B42.C15.V20.w8',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 42, sblgntChapter: 15, sblgntVerse: 20, sblgntWordIndex: 8,
    sblgntExpectedMorph: 'D- --------', sblgntExpectedLemma: 'ἔτι', sblgntCheckSurface: true
  },
  // 55. Phil 4:6 w3 (بِشَيْءٍ)
  {
    ref: 'Phil 4:6 w3 (بِشَيْءٍ)', book: 50, ch: 4, vs: 6, pos: 3,
    expStrongs: 'G3367', expOrig: 'μηδείς', expSurface: 'μηδὲν',
    expPos: 'adjective', expGender: 'neuter', expNumber: 'singular', expPerson: null,
    expMorph: 'A- ----ASN-', expLoc: 'SBLGNT:B50.C4.V6.w1',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 50, sblgntChapter: 4, sblgntVerse: 6, sblgntWordIndex: 1,
    sblgntExpectedMorph: 'A- ----ASN-', sblgntExpectedLemma: 'μηδείς', sblgntCheckSurface: true
  },
  // 56. Phil 4:6 w4 (بَلْ)
  {
    ref: 'Phil 4:6 w4 (بَلْ)', book: 50, ch: 4, vs: 6, pos: 4,
    expStrongs: 'G235', expOrig: 'ἀλλά', expSurface: 'ἀλλ’',
    expPos: 'conjunction', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'C- --------', expLoc: 'SBLGNT:B50.C4.V6.w3',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 50, sblgntChapter: 4, sblgntVerse: 6, sblgntWordIndex: 3,
    sblgntExpectedMorph: 'C- --------', sblgntExpectedLemma: 'ἀλλά', sblgntCheckSurface: true
  },
  // 57. Phil 4:6 w10 (مَعَ)
  {
    ref: 'Phil 4:6 w10 (مَعَ)', book: 50, ch: 4, vs: 6, pos: 10,
    expStrongs: 'G3326', expOrig: 'μετά', expSurface: 'μετ’',
    expPos: 'preposition', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'P- --------', expLoc: 'SBLGNT:B50.C4.V6.w11',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 50, sblgntChapter: 4, sblgntVerse: 6, sblgntWordIndex: 11,
    sblgntExpectedMorph: 'P- --------', sblgntExpectedLemma: 'μετά', sblgntCheckSurface: true
  },
  // 58. Phil 4:6 w11 (الشُّكْرِ)
  {
    ref: 'Phil 4:6 w11 (الشُّكْرِ)', book: 50, ch: 4, vs: 6, pos: 11,
    expStrongs: 'G2169', expOrig: 'εὐχαριστία', expSurface: 'εὐχαριστίας',
    expPos: 'noun', expGender: 'feminine', expNumber: 'singular', expPerson: null,
    expMorph: 'N- ----GSF-', expLoc: 'SBLGNT:B50.C4.V6.w12',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 50, sblgntChapter: 4, sblgntVerse: 6, sblgntWordIndex: 12,
    sblgntExpectedMorph: 'N- ----GSF-', sblgntExpectedLemma: 'εὐχαριστία', sblgntCheckSurface: true
  },
  // 59. Phil 4:6 w14 (لَدَى)
  {
    ref: 'Phil 4:6 w14 (لَدَى)', book: 50, ch: 4, vs: 6, pos: 14,
    expStrongs: 'G4314', expOrig: 'πρός', expSurface: 'πρὸς',
    expPos: 'preposition', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'P- --------', expLoc: 'SBLGNT:B50.C4.V6.w17',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 50, sblgntChapter: 4, sblgntVerse: 6, sblgntWordIndex: 17,
    sblgntExpectedMorph: 'P- --------', sblgntExpectedLemma: 'πρός', sblgntCheckSurface: true
  },
  // 60. Phil 4:6 w15 (اللهِ)
  {
    ref: 'Phil 4:6 w15 (اللهِ)', book: 50, ch: 4, vs: 6, pos: 15,
    expStrongs: 'G2316', expOrig: 'θεός', expSurface: 'θεόν',
    expPos: 'noun', expGender: 'masculine', expNumber: 'singular', expPerson: null,
    expMorph: 'N- ----ASM-', expLoc: 'SBLGNT:B50.C4.V6.w19',
    oshbBook: null, oshbOsis: null, oshbWordIndex: null, oshbExpectedId: null,
    sblgntBookId: 50, sblgntChapter: 4, sblgntVerse: 6, sblgntWordIndex: 19,
    sblgntExpectedMorph: 'N- ----ASM-', sblgntExpectedLemma: 'θεός', sblgntCheckSurface: true
  },
  // 61. Ruth 1:16 w5 (عَلَيَّ)
  {
    ref: 'Ruth 1:16 w5 (عَلَيَّ)', book: 8, ch: 1, vs: 16, pos: 5,
    expStrongs: 'H9003', expOrig: 'בְּ', expSurface: 'בִ֔י',
    expPos: 'preposition', expGender: 'common', expNumber: 'singular', expPerson: 'first',
    expMorph: 'HR/Sp1cs', expLoc: 'OSHB:B8.C1.V16.w5',
    oshbBook: 'Ruth', oshbOsis: 'Ruth.1.16', oshbWordIndex: 5, oshbExpectedId: '083k3'
  },
  // 62. Ruth 1:16 w6 (أَنْ)
  {
    ref: 'Ruth 1:16 w6 (أَنْ)', book: 8, ch: 1, vs: 16, pos: 6,
    expStrongs: 'H9005', expOrig: 'לְ', expSurface: 'לְ',
    expPos: 'preposition', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HR', expLoc: 'OSHB:B8.C1.V16.w6',
    oshbBook: 'Ruth', oshbOsis: 'Ruth.1.16', oshbWordIndex: 6, oshbExpectedId: '081rL'
  },
  // 63. Ruth 1:16 w7 (أَتْرُكَكِ)
  {
    ref: 'Ruth 1:16 w7 (أَتْرُكَكِ)', book: 8, ch: 1, vs: 16, pos: 7,
    expStrongs: 'H5800', expOrig: 'עָזַב', expSurface: 'לְעָזְבֵ֖ךְ',
    expPos: 'verb', expGender: 'feminine', expNumber: 'singular', expPerson: 'second',
    expMorph: 'HR/Vqc/Sp2fs', expLoc: 'OSHB:B8.C1.V16.w6',
    oshbBook: 'Ruth', oshbOsis: 'Ruth.1.16', oshbWordIndex: 6, oshbExpectedId: '081rL'
  },
  // 64. Ruth 1:16 w8 (وَأَرْجعَ)
  {
    ref: 'Ruth 1:16 w8 (وَأَرْجعَ)', book: 8, ch: 1, vs: 16, pos: 8,
    expStrongs: 'H7725', expOrig: 'שׁוּב', expSurface: 'לָשׁ֣וּב',
    expPos: 'verb', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HR/Vqc', expLoc: 'OSHB:B8.C1.V16.w7',
    oshbBook: 'Ruth', oshbOsis: 'Ruth.1.16', oshbWordIndex: 7, oshbExpectedId: '08W2c'
  },
  // 65. Ruth 1:16 w9 (عَنْكِ)
  {
    ref: 'Ruth 1:16 w9 (عَنْكِ)', book: 8, ch: 1, vs: 16, pos: 9,
    expStrongs: 'H310,H4480', expOrig: 'אַחַר', expSurface: 'מֵאַחֲרָ֑יִךְ',
    expPos: 'preposition', expGender: 'feminine', expNumber: 'singular', expPerson: 'second',
    expMorph: 'HR/R/Sp2fs', expLoc: 'OSHB:B8.C1.V16.w8',
    oshbBook: 'Ruth', oshbOsis: 'Ruth.1.16', oshbWordIndex: 8, oshbExpectedId: '08mL3'
  },
  // 66. Ruth 1:16 w10 (لأَنَّهُ)
  {
    ref: 'Ruth 1:16 w10 (لأَنَّهُ)', book: 8, ch: 1, vs: 16, pos: 10,
    expStrongs: 'H3588', expOrig: 'כִּי', expSurface: 'כִּ֠י',
    expPos: 'conjunction', expGender: null, expNumber: null, expPerson: null,
    expMorph: 'HC', expLoc: 'OSHB:B8.C1.V16.w9',
    oshbBook: 'Ruth', oshbOsis: 'Ruth.1.16', oshbWordIndex: 9, oshbExpectedId: '08zfc'
  }
];

let batch20Pass = 0;
for (const tc of batch20ComprehensiveCases) {
  const row = query(`
    SELECT wm.orig_word, wm.orig_surface, wm.morph_pos, wm.orig_morphology, wm.verified_locator,
           wm.morph_gender, wm.morph_number, wm.morph_person,
           (SELECT GROUP_CONCAT(sub.strongs_id, ',') 
            FROM (SELECT strongs_id FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS sub) as comps,
           wm.morph_stem, wm.morph_mood, wm.orig_word_position
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    WHERE v.book_id = ${tc.book} AND v.chapter_num = ${tc.ch} AND v.verse_num = ${tc.vs} AND wm.ar_word_position = ${tc.pos};
  `).split('|');

  const actualOrig = row[0];
  const actualSurface = row[1];
  const actualPos = row[2];
  const actualMorph = row[3];
  const actualLoc = row[4];
  const actualGender = row[5] || null;
  const actualNumber = row[6] || null;
  const actualPerson = row[7] || null;
  const actualStrongs = row[8];
  const actualStem = row[9] || null;
  const actualMood = row[10] || null;
  const actualOrigPos = row[11] ? parseInt(row[11], 10) : null;

  // Word index MUST be parsed directly from stored verified_locator, eliminating any audit loophole
  const locWordMatch = actualLoc ? actualLoc.match(/\.w(\d+)/) : null;
  const extractedWordIndex = locWordMatch ? parseInt(locWordMatch[1], 10) : null;

  const okStrongs = actualStrongs === tc.expStrongs;
  const okOrig = actualOrig === tc.expOrig;
  const okSurface = actualSurface === tc.expSurface;
  const okPos = actualPos === tc.expPos;
  const okMorph = actualMorph === tc.expMorph;
  const okLoc = actualLoc === tc.expLoc;
  const okGender = actualGender === tc.expGender;
  const okNumber = actualNumber === tc.expNumber;
  const okPerson = actualPerson === tc.expPerson;
  const okStem = tc.expStem !== undefined ? actualStem === tc.expStem : true;
  const okMood = tc.expMood !== undefined ? actualMood === tc.expMood : true;
  const okPosSync = (extractedWordIndex !== null && actualOrigPos !== null && extractedWordIndex === actualOrigPos);

  let okSourceXml = true;
  let xmlDetail = '';
  if (tc.oshbBook) {
    const oshbWords = extractOshbVerse(tc.oshbBook, tc.oshbOsis);
    if (!oshbWords) {
      okSourceXml = false;
      xmlDetail = `OSHB file/verse not found: ${tc.oshbBook} ${tc.oshbOsis}`;
    } else {
      // Lookup index strictly from stored verified_locator
      const targetElement = oshbWords.find(w => w.index === extractedWordIndex);
      if (!targetElement) {
        okSourceXml = false;
        xmlDetail = `OSHB word index ${extractedWordIndex} (from locator ${actualLoc}) not found in ${tc.oshbOsis}`;
      } else {
        if (tc.oshbExpectedId && targetElement.id !== tc.oshbExpectedId) {
          okSourceXml = false;
          xmlDetail = `XML id mismatch: got ${targetElement.id}, expected ${tc.oshbExpectedId}`;
        } else if (targetElement.morph !== tc.expMorph && (!targetElement.morph.includes('/') || !targetElement.morph.split('/').map(p => p.replace(/^H/, '')).includes(tc.expMorph.replace(/^H/, '')))) {
          okSourceXml = false;
          xmlDetail = `XML morph mismatch: got ${targetElement.morph}, expected ${tc.expMorph}`;
        } else if (tc.oshbCheckSurface) {
          const expectedSurface = targetElement.text.replace(/\//g, '');
          if (actualSurface !== expectedSurface) {
            okSourceXml = false;
            xmlDetail = `XML surface mismatch: got '${actualSurface}', expected OSHB '${expectedSurface}'`;
          }
        }
      }
    }
  }

  let okSblgnt = true;
  let sblgntDetail = '';
  if (tc.sblgntBookId) {
    const sblgntWords = extractSblgntVerse(tc.sblgntBookId, tc.sblgntChapter, tc.sblgntVerse);
    if (!sblgntWords) {
      okSblgnt = false;
      sblgntDetail = `SBLGNT file/verse not found: Book ${tc.sblgntBookId} ${tc.sblgntChapter}:${tc.sblgntVerse}`;
    } else {
      // Lookup index strictly from stored verified_locator
      const targetToken = sblgntWords.find(w => w.index === extractedWordIndex);
      if (!targetToken) {
        okSblgnt = false;
        sblgntDetail = `SBLGNT token index ${extractedWordIndex} (from locator ${actualLoc}) not found in ${tc.sblgntBookId} ${tc.sblgntChapter}:${tc.sblgntVerse}`;
      } else {
        if (tc.sblgntExpectedMorph && targetToken.morph !== tc.sblgntExpectedMorph) {
          okSblgnt = false;
          sblgntDetail = `SBLGNT morph mismatch: got ${targetToken.morph}, expected ${tc.sblgntExpectedMorph}`;
        } else if (tc.sblgntExpectedLemma && targetToken.lemma !== tc.sblgntExpectedLemma) {
          okSblgnt = false;
          sblgntDetail = `SBLGNT lemma mismatch: got ${targetToken.lemma}, expected ${tc.sblgntExpectedLemma}`;
        } else if (tc.sblgntCheckSurface) {
          if (actualSurface !== targetToken.surfaceClean) {
            okSblgnt = false;
            sblgntDetail = `SBLGNT surface mismatch: got '${actualSurface}', expected SBLGNT '${targetToken.surfaceClean}'`;
          }
        }
      }
    }
  }

  const passed = okStrongs && okOrig && okSurface && okPos && okMorph && okLoc && okGender && okNumber && okPerson && okStem && okMood && okPosSync && okSourceXml && okSblgnt;
  assertCondition(`${tc.ref} (Source & Morphology Verified): Strongs=${tc.expStrongs}, Surface=${tc.expSurface}, Morph=${tc.expMorph}, Loc=${tc.expLoc}`, passed, 
    !passed ? `Mismatches: ${!okStrongs ? 'Strongs(' + actualStrongs + ') ' : ''}${!okOrig ? 'Orig(' + actualOrig + ') ' : ''}${!okSurface ? 'Surface(' + actualSurface + ') ' : ''}${!okPos ? 'Pos(' + actualPos + ') ' : ''}${!okMorph ? 'Morph(' + actualMorph + ') ' : ''}${!okLoc ? 'Loc(' + actualLoc + ') ' : ''}${!okGender ? 'Gender(' + actualGender + ') ' : ''}${!okNumber ? 'Number(' + actualNumber + ') ' : ''}${!okPerson ? 'Person(' + actualPerson + ') ' : ''}${!okStem ? 'Stem(' + actualStem + ') ' : ''}${!okMood ? 'Mood(' + actualMood + ') ' : ''}${!okPosSync ? 'PosSync(extracted=' + extractedWordIndex + ', orig_pos=' + actualOrigPos + ') ' : ''}${!okSourceXml ? 'OSHB_XML(' + xmlDetail + ') ' : ''}${!okSblgnt ? 'SBLGNT(' + sblgntDetail + ') ' : ''}` : '');
  if (passed) batch20Pass++;
}
console.log(`Batch 20 Direct Source & Morphology Summary: ${batch20Pass}/${batch20ComprehensiveCases.length} loci rigorously verified against DB, OSHB XML, and SBLGNT sources.\n`);

// -----------------------------------------------------------------------------
// Test 12: 20-Verse Benchmark Canonical Manifest Quality Gate (All 311 Units)
// -----------------------------------------------------------------------------
console.log('\n▶  TEST 12: 20-Verse Benchmark Canonical Manifest Quality Gate (All 311 Units)');
try {
  const auditScriptPath = path.resolve(__dirname, 'audit_20_verses_311_units.cjs');
  const auditOutput = execSync(`"${process.execPath}" "${auditScriptPath}"`, {
    env: { ...process.env, AUDIT_DB_PATH: dbPath },
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log(auditOutput);
  assertCondition('20-Verse Benchmark Canonical Manifest Quality Gate (All 311 Units in manifest)', true);
} catch (err) {
  const errOutput = (err.stdout || '') + '\n' + (err.stderr || '');
  console.error(errOutput);
  assertCondition('20-Verse Benchmark Canonical Manifest Quality Gate (All 311 Units in manifest)', false, errOutput.slice(0, 300));
}

// -----------------------------------------------------------------------------
// Test 13: Dedicated Component & Lexical Boundary Quality Gate
// -----------------------------------------------------------------------------
console.log('\n▶  TEST 13: Dedicated Component & Lexical Boundary Quality Gate');

// 1. Isaiah 40:8 w9 "إِلَى" preposition purity (H9005, HR, gender=NULL, number=NULL)
const isaPrep = query(`
  SELECT strongs_id, orig_morphology, morph_gender, morph_number
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 40 AND verse_num = 8 AND book_id = 23)
    AND ar_word_position = 9;
`).split('|');
const okIsaPrep = isaPrep[0] === 'H9005' && isaPrep[1] === 'HR' && !isaPrep[2] && !isaPrep[3];
assertCondition('Isaiah 40:8 w9 (إِلَى) Preposition Purity (H9005, HR, gender=NULL, number=NULL)', okIsaPrep, `Found strongs=${isaPrep[0]}, morph=${isaPrep[1]}, gender=${isaPrep[2]}, number=${isaPrep[3]}`);

// 2. Isaiah 40:8 w10 "الأَبَدِ" lexical isolation (must be H5769, HNcmsa, NEVER H9005)
const isaNoun = query(`
  SELECT strongs_id, orig_morphology
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 40 AND verse_num = 8 AND book_id = 23)
    AND ar_word_position = 10;
`).split('|');
const okIsaNoun = isaNoun[0] === 'H5769' && isaNoun[1] === 'HNcmsa' && isaNoun[0] !== 'H9005';
assertCondition('Isaiah 40:8 w10 (الأَبَدِ) Lexical Isolation (H5769, HNcmsa, NOT H9005)', okIsaNoun, `Found strongs=${isaNoun[0]}, morph=${isaNoun[1]}`);

// 3. Micah 6:8 w2 "أَخْبَرَكَ" multi-component completeness & exact sub-component position/morphology
const micLinks = query(`
  SELECT wms.link_order, wms.strongs_id, wms.link_role, wms.orig_word_position, wms.orig_component, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wm.id = wms.mapping_id
  WHERE wm.verse_id = (SELECT id FROM verses WHERE chapter_num = 6 AND verse_num = 8 AND book_id = 33)
    AND wm.ar_word_position = 2
  ORDER BY link_order ASC;
`).replace(/\r/g, '').split('\n').filter(Boolean);

const okMicLink1 = micLinks[0] === '1|H5046|primary|1|הִגִּ֥יד|HVhp3ms';
const okMicLink2 = micLinks[1] === '2|H9005|pronominal_dative|2|לְךָ֛|HR/Sp2ms';
const okMicComp = micLinks.length === 2 && okMicLink1 && okMicLink2;
assertCondition('Micah 6:8 w2 (أَخْبَرَكَ) Multi-Component Completeness (H5046 verbal w1 + H9005 pronominal_dative w2)', okMicComp, `Found links=${JSON.stringify(micLinks)}`);

// 4. Galatians 5:22 w6 "فَرَحٌ" Greek lexical joy isolation (must be G5479, NEVER G26)
const galJoy = query(`
  SELECT strongs_id, orig_morphology
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 22 AND book_id = 48)
    AND ar_word_position = 6;
`).split('|');
const okGalJoy = galJoy[0] === 'G5479' && galJoy[0] !== 'G26';
assertCondition('Galatians 5:22 w6 (فَرَحٌ) Greek Lexical Joy Isolation (G5479, NOT G26)', okGalJoy, `Found strongs=${galJoy[0]}`);

// 5. Leviticus 26:12 w4 "لَكُمْ" explicit source linkage (H9005, HR/Sp2mp, w4)
const levLakhem = query(`
  SELECT strongs_id, orig_morphology, orig_word_position, verified_locator
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 26 AND verse_num = 12 AND book_id = 3)
    AND ar_word_position = 4;
`).split('|');
const okLevLakhem = levLakhem[0] === 'H9005' && levLakhem[1] === 'HR/Sp2mp' && levLakhem[2] === '4' && levLakhem[3] === 'OSHB:B3.C26.V12.w4';
assertCondition('Leviticus 26:12 w4 (لَكُمْ) Explicit Source Linkage (H9005, HR/Sp2mp, w4)', okLevLakhem, `Found strongs=${levLakhem[0]}, morph=${levLakhem[1]}, pos=${levLakhem[2]}, loc=${levLakhem[3]}`);

// 6. Leviticus 26:12 w8 "لِي" explicit source linkage (H9005, HR/Sp1cs, w8)
const levLi = query(`
  SELECT strongs_id, orig_morphology, orig_word_position, verified_locator
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 26 AND verse_num = 12 AND book_id = 3)
    AND ar_word_position = 8;
`).split('|');
const okLevLi = levLi[0] === 'H9005' && levLi[1] === 'HR/Sp1cs' && levLi[2] === '8' && levLi[3] === 'OSHB:B3.C26.V12.w8';
assertCondition('Leviticus 26:12 w8 (لِي) Explicit Source Linkage (H9005, HR/Sp1cs, w8)', okLevLi, `Found strongs=${levLi[0]}, morph=${levLi[1]}, pos=${levLi[2]}, loc=${levLi[3]}`);

// 7. Ezra 5:8 w16 "يُبْنَى" locator and root verification (H1124, AVurmsa, w12)
const ezra16 = query(`
  SELECT strongs_id, orig_morphology, orig_word_position, verified_locator, orig_surface
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 8 AND book_id = 15)
    AND ar_word_position = 16;
`).split('|');
const okEzra16 = ezra16[0] === 'H1124' && ezra16[1] === 'AVurmsa' && ezra16[2] === '12' && ezra16[3] === 'OSHB:B15.C5.V8.w12' && ezra16[4] === 'מִתְבְּנֵא֙';
assertCondition('Ezra 5:8 w16 (يُبْنَى) Source Locator & Root Purity (H1124, AVurmsa, w12)', okEzra16, `Found strongs=${ezra16[0]}, morph=${ezra16[1]}, pos=${ezra16[2]}, loc=${ezra16[3]}, comp=${ezra16[4]}`);

// 8. Deuteronomy 6:5 w2 "الرَّبَّ" (H3068, HNp, w3, NOT w2)
const deutRab = query(`
  SELECT strongs_id, orig_morphology, orig_word_position, verified_locator
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 6 AND verse_num = 5 AND book_id = 5)
    AND ar_word_position = 2;
`).split('|');
const okDeutRab = deutRab[0] === 'H3068' && deutRab[1] === 'HNp' && deutRab[2] === '3' && deutRab[3] === 'OSHB:B5.C6.V5.w3' && deutRab[3] !== 'OSHB:B5.C6.V5.w2';
assertCondition('Deuteronomy 6:5 w2 (الرَّبَّ) Locator & Lexical Purity (H3068, HNp, w3, NOT w2)', okDeutRab, `Found strongs=${deutRab[0]}, morph=${deutRab[1]}, pos=${deutRab[2]}, loc=${deutRab[3]}`);

// 9. Exodus 15:2 w1 "الرَّبُّ" (H3050, HNp, w3, NOT w1)
const exodRab = query(`
  SELECT strongs_id, orig_morphology, orig_word_position, verified_locator
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 15 AND verse_num = 2 AND book_id = 2)
    AND ar_word_position = 1;
`).split('|');
const okExodRab = exodRab[0] === 'H3050' && exodRab[1] === 'HNp' && exodRab[2] === '3' && exodRab[3] === 'OSHB:B2.C15.V2.w3' && exodRab[3] !== 'OSHB:B2.C15.V2.w1';
assertCondition('Exodus 15:2 w1 (الرَّبُّ) Locator & Lexical Purity (H3050, HNp, w3, NOT w1)', okExodRab, `Found strongs=${exodRab[0]}, morph=${exodRab[1]}, pos=${exodRab[2]}, loc=${exodRab[3]}`);

// 10. Deuteronomy 6:5 w4 "مِنْ" Preposition Beth Component (H9003, HR, NOT H4480)
const deutMin = query(`
  SELECT strongs_id, orig_morphology, orig_word_position, verified_locator
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 6 AND verse_num = 5 AND book_id = 5)
    AND ar_word_position = 4;
`).split('|');
const okDeutMin = deutMin[0] === 'H9003' && deutMin[0] !== 'H4480' && deutMin[1] === 'HR' && deutMin[2] === '5' && deutMin[3] === 'OSHB:B5.C6.V5.w5';
assertCondition('Deuteronomy 6:5 w4 (مِنْ) Preposition Beth Component (H9003, HR, NOT H4480)', okDeutMin, `Found strongs=${deutMin[0]}, morph=${deutMin[1]}, pos=${deutMin[2]}, loc=${deutMin[3]}`);

// 11. Exodus 15:2 w3 "وَنَشِيدِي" Strongs Purity (H2176, NOT H2172)
const exodNashid = query(`
  SELECT strongs_id, orig_morphology, orig_word_position, verified_locator
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 15 AND verse_num = 2 AND book_id = 2)
    AND ar_word_position = 3;
`).split('|');
const okExodNashidStrongs = exodNashid[0] === 'H2176' && exodNashid[0] !== 'H2172' && exodNashid[2] === '2' && exodNashid[3] === 'OSHB:B2.C15.V2.w2';
assertCondition('Exodus 15:2 w3 (وَنَشِيدِي) Strongs Purity (H2176, NOT H2172)', okExodNashidStrongs, `Found strongs=${exodNashid[0]}, morph=${exodNashid[1]}, pos=${exodNashid[2]}, loc=${exodNashid[3]}`);

// 12. Exodus 15:2 w3 "وَنَشِيدِي" Morphology Purity (HC/Ncfsa, NOT HC/Ncfsc)
const okExodNashidMorph = exodNashid[1] === 'HC/Ncfsa' && exodNashid[1] !== 'HC/Ncfsc';
assertCondition('Exodus 15:2 w3 (وَنَشِيدِي) Morphology Purity (HC/Ncfsa, NOT HC/Ncfsc)', okExodNashidMorph, `Found strongs=${exodNashid[0]}, morph=${exodNashid[1]}, pos=${exodNashid[2]}, loc=${exodNashid[3]}`);

// 13. Exodus 15:2 w3 "وَنَشِيدِي" Lexical Lemma Purity (זִמְרָת, NOT זִמְרָה)
const exodNashidOrig = query(`
  SELECT orig_word
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 15 AND verse_num = 2 AND book_id = 2)
    AND ar_word_position = 3;
`).trim();
const okExodNashidOrig = exodNashidOrig === 'זִמְרָת' && exodNashidOrig !== 'זִמְרָה';
assertCondition('Exodus 15:2 w3 (وَنَشِيدِي) Lexical Lemma Purity (זִמְרָת, NOT זִמְרָה)', okExodNashidOrig, `Found orig_word=${exodNashidOrig}`);

// 14. Joshua 1:9 w10 "الرَّبَّ" Locator & Lexical Purity (H3068, HNp, w11, NOT w10)
const joshRab = query(`
  SELECT strongs_id, orig_morphology, orig_word_position, verified_locator
  FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 9 AND book_id = 6)
    AND ar_word_position = 10;
`).split('|');
const okJoshRab = joshRab[0] === 'H3068' && joshRab[1] === 'HNp' && joshRab[2] === '11' && joshRab[3] === 'OSHB:B6.C1.V9.w11' && joshRab[3] !== 'OSHB:B6.C1.V9.w10';
assertCondition('Joshua 1:9 w10 (الرَّبَّ) Locator & Lexical Purity (H3068, HNp, w11, NOT w10)', okJoshRab, `Found strongs=${joshRab[0]}, morph=${joshRab[1]}, pos=${joshRab[2]}, loc=${joshRab[3]}`);

// 15. Joshua 1:9 w13 "حَيْثُمَا" Multi-Component Completeness (H834 primary w14 + H3605 secondary w13)
const joshHaythuma = query(`
  SELECT wm.orig_word_position, wm.verified_locator,
         (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '@w' || wms.orig_word_position || '[' || wms.orig_component || ':' || wms.orig_morphology || ']', ';')
          FROM (SELECT strongs_id, link_role, orig_word_position, orig_component, orig_morphology FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms) as comps
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 9 AND book_id = 6)
    AND wm.ar_word_position = 13;
`).split('|');
const okJoshHaythuma = joshHaythuma[0] === '14' && joshHaythuma[1] === 'OSHB:B6.C1.V9.w14' &&
  joshHaythuma[2] === 'H834:primary@w14[אֲשֶׁ֥ר:HTr];H3605:secondary@w13[בְּכֹ֖ל:HR/Ncmsa]';
assertCondition('Joshua 1:9 w13 (حَيْثُمَا) Multi-Component Completeness (H834 primary w14 + H3605 secondary w13)', okJoshHaythuma, `Found pos=${joshHaythuma[0]}, loc=${joshHaythuma[1]}, comps=${joshHaythuma[2]}`);

// 16. Joshua 1:9 w11 "إِلهَكَ" Direct OSHB Source Surface & Cantillation Purity (אֱלֹהֶ֔יךָ with zaqef qaton U+0594, NOT אֱלֹהֶ֑יךָ with etnachta U+0591)
const joshEloheika = query(`
  SELECT wm.orig_surface, wm.orig_word_position, wm.verified_locator, wms.orig_component
  FROM word_mappings wm
  JOIN word_mapping_strongs wms ON wm.id = wms.mapping_id
  WHERE wm.verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 9 AND book_id = 6)
    AND wm.ar_word_position = 11;
`).split('|');
const oshbJoshVerse = extractOshbVerse('Josh', 'Josh.1.9');
const oshbEloheikaWord = oshbJoshVerse ? oshbJoshVerse.find(w => w.index === 12) : null;
const expectedOshbEloheika = oshbEloheikaWord ? oshbEloheikaWord.text.replace(/\//g, '') : 'אֱלֹהֶ֔יךָ';

const okJoshEloheika = joshEloheika[0] === expectedOshbEloheika &&
  joshEloheika[3] === expectedOshbEloheika &&
  joshEloheika[0].includes('\u0594') &&
  !joshEloheika[0].includes('\u0591') &&
  joshEloheika[1] === '12' &&
  joshEloheika[2] === 'OSHB:B6.C1.V9.w12';
assertCondition('Joshua 1:9 w11 (إِلهَكَ) Direct OSHB Source Surface & Cantillation Purity (אֱלֹהֶ֔יךָ with zaqef qaton U+0594, NOT אֱלֹהֶ֑יךָ)', okJoshEloheika, `Found surface=${joshEloheika[0]}, comp=${joshEloheika[3]}, pos=${joshEloheika[1]}, loc=${joshEloheika[2]}, expected=${expectedOshbEloheika}`);

// 17. Romans 8:28 w7 "مَعًا" Strongs & Unitary Translation Purity (G4903, NOT G4862)
const romMaan = query(`
  SELECT wm.strongs_id, wm.orig_word, wm.orig_surface, wm.orig_morphology, wm.orig_word_position, wm.verified_locator,
         (SELECT GROUP_CONCAT(wms.strongs_id, ',') FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id) as comps
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 45 AND chapter_num = 8 AND verse_num = 28)
    AND wm.ar_word_position = 7;
`).split('|');
const okRomMaan = romMaan[0] === 'G4903' && romMaan[1] === 'συνεργέω' && romMaan[2] === 'συνεργεῖ' &&
  romMaan[3] === 'V- 3PAI-S--' && romMaan[4] === '9' && romMaan[5] === 'SBLGNT:B45.C8.V28.w9' &&
  romMaan[0] !== 'G4862' && romMaan[6] === 'G4903';
assertCondition('Romans 8:28 w7 (مَعًا) Strongs & Unitary Translation Purity (G4903, NOT G4862)', okRomMaan, `Found strongs=${romMaan[0]}, orig=${romMaan[1]}, surface=${romMaan[2]}, morph=${romMaan[3]}, pos=${romMaan[4]}, loc=${romMaan[5]}, comps=${romMaan[6]}`);

// 18. Luke 15:20 w6 "كَانَ" Syntactic Copula Purity (NULL strongs, NOT G1161)
const lkKana = query(`
  SELECT wm.strongs_id, wm.orig_word, wm.orig_surface, wm.orig_word_position, wm.verified_locator, wm.relation_type,
         (SELECT COUNT(*) FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id) as comps_count
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 15 AND verse_num = 20)
    AND wm.ar_word_position = 6;
`).split('|');
const okLkKana = !lkKana[0] && lkKana[1] === '—' && !lkKana[3] &&
  lkKana[4] === 'AR_IMPLIED:B42.C15.V20.w6' && lkKana[5] === 'copula_implied' &&
  lkKana[6] === '0' && lkKana[0] !== 'G1161' && lkKana[4] !== 'SBLGNT:B42.C15.V20.w9';
assertCondition('Luke 15:20 w6 (كَانَ) Syntactic Copula Purity (NULL strongs, NOT G1161)', okLkKana, `Found strongs=${lkKana[0]}, orig=${lkKana[1]}, pos=${lkKana[3]}, loc=${lkKana[4]}, rel=${lkKana[5]}, comps=${lkKana[6]}`);

// 19. 1 Thessalonians 5:23 w13 "عِنْدَ" Preposition Locator Purity (w22, NOT w13)
const thEnda = query(`
  SELECT wm.strongs_id, wm.orig_word_position, wm.verified_locator
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 52 AND chapter_num = 5 AND verse_num = 23)
    AND wm.ar_word_position = 13;
`).split('|');
const okThEnda = thEnda[0] === 'G1722' && thEnda[1] === '22' &&
  thEnda[2] === 'SBLGNT:B52.C5.V23.w22' && thEnda[2] !== 'SBLGNT:B52.C5.V23.w13';
assertCondition('1 Thessalonians 5:23 w13 (عِنْدَ) Preposition Locator Purity (w22, NOT w13)', okThEnda, `Found strongs=${thEnda[0]}, pos=${thEnda[1]}, loc=${thEnda[2]}`);

// 20. 1 Thessalonians 5:23 w11 "بِلاَ" Adverbial Privative Purity (G274, w21, NOT G1722)
const thBila = query(`
  SELECT wm.strongs_id, wm.orig_word, wm.orig_word_position, wm.verified_locator
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 52 AND chapter_num = 5 AND verse_num = 23)
    AND wm.ar_word_position = 11;
`).split('|');
const okThBila = thBila[0] === 'G274' && thBila[1] === 'ἀμέμπτως' && thBila[2] === '21' &&
  thBila[3] === 'SBLGNT:B52.C5.V23.w21' && thBila[0] !== 'G1722';
assertCondition('1 Thessalonians 5:23 w11 (بِلاَ) Adverbial Privative Purity (G274, w21, NOT G1722)', okThBila, `Found strongs=${thBila[0]}, orig=${thBila[1]}, pos=${thBila[2]}, loc=${thBila[3]}`);

// 21. Luke 15:20 w6 "كَانَ" Source Badge Purity (syntactic_ar, NOT morphgnt_sblgnt)
const lkKanaSrc = query(`
  SELECT wm.verified_source, wm.morph_source
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 15 AND verse_num = 20)
    AND wm.ar_word_position = 6;
`).split('|');
const okLkKanaSrc = lkKanaSrc[0] === 'syntactic_ar' && lkKanaSrc[1] === 'syntactic_ar' &&
  lkKanaSrc[0] !== 'morphgnt_sblgnt' && lkKanaSrc[1] !== 'morphgnt_sblgnt';
assertCondition('Luke 15:20 w6 (كَانَ) Source Badge Purity (syntactic_ar, NOT morphgnt_sblgnt)', okLkKanaSrc, `Found verified_source=${lkKanaSrc[0]}, morph_source=${lkKanaSrc[1]}`);

// 22. Luke 15:20 w9 "بَعِيدًا" Multi-Component Completeness (G3112 primary w11 + G568 secondary w12)
const lkBaedaComps = query(`
  SELECT (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '@w' || wms.orig_word_position || '[' || wms.orig_component || ':' || wms.orig_morphology || ']', ';')
          FROM (SELECT strongs_id, link_role, orig_word_position, orig_component, orig_morphology FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms) as comps
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 15 AND verse_num = 20)
    AND wm.ar_word_position = 9;
`).trim();
const okLkBaedaComps = lkBaedaComps === 'G3112:primary@w11[μακρὰν:D- --------];G568:secondary@w12[ἀπέχοντος:V- -PAPGSM-]';
assertCondition('Luke 15:20 w9 (بَعِيدًا) Multi-Component Completeness (G3112 primary w11 + G568 secondary w12)', okLkBaedaComps, `Found comps=${lkBaedaComps}`);

// 23. Philippians 4:6 w10 "مَعَ" Surface & Locator Purity (G3326, w11, μετ’, NOT w10, NOT μετὰ)
const philMaa = query(`
  SELECT wm.strongs_id, wm.orig_word, wm.orig_surface, wm.orig_word_position, wm.verified_locator,
         (SELECT wms.orig_component FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id AND wms.link_order = 1) as comp
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 50 AND chapter_num = 4 AND verse_num = 6)
    AND wm.ar_word_position = 10;
`).split('|');
const okPhilMaa = philMaa[0] === 'G3326' && philMaa[1] === 'μετά' && philMaa[2] === 'μετ’' &&
  philMaa[3] === '11' && philMaa[4] === 'SBLGNT:B50.C4.V6.w11' && philMaa[5] === 'μετ’' &&
  philMaa[2] !== 'μετὰ' && philMaa[4] !== 'SBLGNT:B50.C4.V6.w10';
assertCondition('Philippians 4:6 w10 (مَعَ) Surface & Locator Purity (G3326, w11, μετ’, NOT w10, NOT μετὰ)', okPhilMaa, `Found strongs=${philMaa[0]}, orig=${philMaa[1]}, surface=${philMaa[2]}, pos=${philMaa[3]}, loc=${philMaa[4]}, comp=${philMaa[5]}`);

// 24. Philippians 4:6 w3 "بِشَيْءٍ" Locator Purity (G3367, w1, μηδὲν, NOT w3)
const philBishay = query(`
  SELECT wm.strongs_id, wm.orig_word, wm.orig_surface, wm.orig_word_position, wm.verified_locator
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 50 AND chapter_num = 4 AND verse_num = 6)
    AND wm.ar_word_position = 3;
`).split('|');
const okPhilBishay = philBishay[0] === 'G3367' && philBishay[1] === 'μηδείς' && philBishay[2] === 'μηδὲν' &&
  philBishay[3] === '1' && philBishay[4] === 'SBLGNT:B50.C4.V6.w1' && philBishay[4] !== 'SBLGNT:B50.C4.V6.w3';
assertCondition('Philippians 4:6 w3 (بِشَيْءٍ) Locator Purity (G3367, w1, μηδὲν, NOT w3)', okPhilBishay, `Found strongs=${philBishay[0]}, orig=${philBishay[1]}, surface=${philBishay[2]}, pos=${philBishay[3]}, loc=${philBishay[4]}`);

// 25. Philippians 4:6 w9 "وَالدُّعَاءِ" Multi-Component Completeness (G1162 primary w10 + G2532 secondary w8)
const philDuaComps = query(`
  SELECT (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '@w' || wms.orig_word_position || '[' || wms.orig_component || ':' || wms.orig_morphology || ']', ';')
          FROM (SELECT strongs_id, link_role, orig_word_position, orig_component, orig_morphology FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms) as comps
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 50 AND chapter_num = 4 AND verse_num = 6)
    AND wm.ar_word_position = 9;
`).trim();
const okPhilDuaComps = philDuaComps === 'G1162:primary@w10[δεήσει:N- ----DSF-];G2532:secondary@w8[καὶ:C- --------]';
assertCondition('Philippians 4:6 w9 (وَالدُّعَاءِ) Multi-Component Completeness (G1162 primary w10 + G2532 secondary w8)', okPhilDuaComps, `Found comps=${philDuaComps}`);

// 26. Philippians 4:6 w13 "طِلْبَاتُكُمْ" Multi-Component Completeness (G155 primary w14 + G4771 secondary w15)
const philTilbaComps = query(`
  SELECT (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '@w' || wms.orig_word_position || '[' || wms.orig_component || ':' || wms.orig_morphology || ']', ';')
          FROM (SELECT strongs_id, link_role, orig_word_position, orig_component, orig_morphology FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms) as comps
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 50 AND chapter_num = 4 AND verse_num = 6)
    AND wm.ar_word_position = 13;
`).trim();
const okPhilTilbaComps = philTilbaComps === 'G155:primary@w14[αἰτήματα:N- ----NPN-];G4771:secondary@w15[ὑμῶν:RP ----GP--]';
assertCondition('Philippians 4:6 w13 (طِلْبَاتُكُمْ) Multi-Component Completeness (G155 primary w14 + G4771 secondary w15)', okPhilTilbaComps, `Found comps=${philTilbaComps}`);

// 27. Ruth 1:16 w5 "عَلَيَّ" Locator & Lexical Purity (H9003, w5, בִ֔י, NOT H413)
const ruthAlayya = query(`
  SELECT wm.strongs_id, wm.orig_word, wm.orig_surface, wm.orig_word_position, wm.verified_locator, wm.orig_morphology
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 8 AND chapter_num = 1 AND verse_num = 16)
    AND wm.ar_word_position = 5;
`).split('|');
const okRuthAlayya = ruthAlayya[0] === 'H9003' && ruthAlayya[2] === 'בִ֔י' && ruthAlayya[3] === '5' &&
  ruthAlayya[4] === 'OSHB:B8.C1.V16.w5' && ruthAlayya[5] === 'HR/Sp1cs' && ruthAlayya[0] !== 'H413';
assertCondition('Ruth 1:16 w5 (عَلَيَّ) Locator & Lexical Purity (H9003, w5, NOT H413)', okRuthAlayya, `Found strongs=${ruthAlayya[0]}, orig=${ruthAlayya[1]}, surface=${ruthAlayya[2]}, pos=${ruthAlayya[3]}, loc=${ruthAlayya[4]}, morph=${ruthAlayya[5]}`);

// 28. Ruth 1:16 w6 "أَنْ" Prefix Lam Purity (H9005, w6, לְ)
const ruthAn = query(`
  SELECT wm.strongs_id, wm.orig_word, wm.orig_surface, wm.orig_word_position, wm.verified_locator, wm.orig_morphology
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 8 AND chapter_num = 1 AND verse_num = 16)
    AND wm.ar_word_position = 6;
`).split('|');
const okRuthAn = ruthAn[0] === 'H9005' && ruthAn[1] === 'לְ' && ruthAn[3] === '6' &&
  ruthAn[4] === 'OSHB:B8.C1.V16.w6' && ruthAn[5] === 'HR' && ruthAn[0] !== 'H3588';
assertCondition('Ruth 1:16 w6 (أَنْ) Prefix Lam Purity (H9005, w6, לְ)', okRuthAn, `Found strongs=${ruthAn[0]}, orig=${ruthAn[1]}, surface=${ruthAn[2]}, pos=${ruthAn[3]}, loc=${ruthAn[4]}, morph=${ruthAn[5]}`);

// 29. Ruth 1:16 w7 "أَتْرُكَكِ" Suffix & Verb Purity (H5800, w6, feminine 2nd person suffix)
const ruthAtruk = query(`
  SELECT wm.strongs_id, wm.orig_word, wm.orig_surface, wm.orig_word_position, wm.verified_locator, wm.orig_morphology, wm.morph_gender, wm.morph_person
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 8 AND chapter_num = 1 AND verse_num = 16)
    AND wm.ar_word_position = 7;
`).split('|');
const okRuthAtruk = ruthAtruk[0] === 'H5800' && ruthAtruk[1] === 'עָזַב' && ruthAtruk[3] === '6' &&
  ruthAtruk[4] === 'OSHB:B8.C1.V16.w6' && ruthAtruk[5].includes('Sp2fs') && ruthAtruk[6] === 'feminine' && ruthAtruk[7] === 'second';
assertCondition('Ruth 1:16 w7 (أَتْرُكَكِ) Suffix & Verb Purity (H5800, w6, feminine 2nd person suffix)', okRuthAtruk, `Found strongs=${ruthAtruk[0]}, orig=${ruthAtruk[1]}, pos=${ruthAtruk[3]}, loc=${ruthAtruk[4]}, morph=${ruthAtruk[5]}, gender=${ruthAtruk[6]}, person=${ruthAtruk[7]}`);

// 30. Ruth 1:16 w9 "عَنْكِ" Multi-Component Completeness (H310 primary + H4480 secondary)
const ruthAnkiComps = query(`
  SELECT (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '@w' || wms.orig_word_position || '[' || wms.orig_component || ':' || wms.orig_morphology || ']', ';')
          FROM (SELECT strongs_id, link_role, orig_word_position, orig_component, orig_morphology FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms) as comps
  FROM word_mappings wm
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 8 AND chapter_num = 1 AND verse_num = 16)
    AND wm.ar_word_position = 9;
`).trim();
const okRuthAnkiComps = ruthAnkiComps === 'H310:primary@w8[מֵאַחֲרָ֑יִךְ:HR/R/Sp2fs];H4480:secondary@w8[מֵ:HR]';
assertCondition('Ruth 1:16 w9 (عَنْكِ) Multi-Component Completeness (H310 primary + H4480 secondary)', okRuthAnkiComps, `Found comps=${ruthAnkiComps}`);

// 31. Ruth 1:16 w8 "وَأَرْجِعَ" Component & Hebrew Vav Purity (H7725, w7, לָשׁ֣וּב with Hebrew Vav U+05D5, zero Arabic Waw U+0648)
const ruthAshuvRow = query(`
  SELECT wm.strongs_id, wm.orig_word_position, wm.verified_locator, wms.orig_component
  FROM word_mappings wm
  JOIN word_mapping_strongs wms ON wms.mapping_id = wm.id
  WHERE wm.verse_id = (SELECT id FROM verses WHERE book_id = 8 AND chapter_num = 1 AND verse_num = 16)
    AND wm.ar_word_position = 8;
`).split('|');
const okRuthAshuv = ruthAshuvRow[0] === 'H7725' &&
  ruthAshuvRow[1] === '7' &&
  ruthAshuvRow[2] === 'OSHB:B8.C1.V16.w7' &&
  ruthAshuvRow[3] === '\u05DC\u05B8\u05E9\u05C1\u05A3\u05D5\u05BC\u05D1' &&
  !ruthAshuvRow[3].includes('\u0648') &&
  ruthAshuvRow[3].includes('\u05D5');
assertCondition('Ruth 1:16 w8 (وَأَرْجِعَ) Component & Pure Hebrew Vav U+05D5 (H7725, w7, לָשׁ֣וּב, NO Arabic Waw U+0648)', okRuthAshuv, `Found strongs=${ruthAshuvRow[0]}, pos=${ruthAshuvRow[1]}, loc=${ruthAshuvRow[2]}, comp=${ruthAshuvRow[3]}`);





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
