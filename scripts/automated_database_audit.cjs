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

// 4. John 3:16 - Exact MorphGNT literal tags: Adverb D- -------- and Greek Accusative αὐτόν RP ----ASM-
const jn316w2 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', morph_pos, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=3 AND verse_num=16) AND ar_word_position=2;`));
assertCondition("jn316_adverb: John 3:16 هكذا has G3779 Οὕτως, exact MorphGNT raw tag D- --------", jn316w2.strongs === 'G3779' && jn316w2.morphology === 'D- --------', JSON.stringify(jn316w2));

const jn316w16 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', morph_pos, 'case', morph_case, 'gender', morph_gender, 'num', morph_number, 'token_pos', orig_word_position, 'locator', verified_locator, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=3 AND verse_num=16) AND ar_word_position=16;`));
assertCondition("jn316_accusative_pronoun: John 3:16 به has G846 αὐτόν token 19, exact MorphGNT raw tag RP ----ASM-", jn316w16.strongs === 'G846' && jn316w16.surface === 'αὐτόν' && jn316w16.case === 'accusative' && jn316w16.gender === 'masculine' && jn316w16.num === 'singular' && jn316w16.token_pos === 19 && jn316w16.locator === 'SBLGNT:B43.C3.V16.w19' && jn316w16.morphology === 'RP ----ASM-', JSON.stringify(jn316w16));

// 5. Acts 1:8 - Participle ἐπελθόντος G1904 (V- -AAPGSN-) and Genitive pronoun μου G3450 (RP ----GS--)
const acts18w5 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'word', orig_word, 'surface', orig_surface, 'pos', morph_pos, 'tense', morph_tense, 'mood', morph_mood, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8) AND ar_word_position=5;`));
assertCondition("acts18_participle: Acts 1:8 حل has G1904 ἐπέρχομαι / ἐπελθόντος, exact MorphGNT raw tag V- -AAPGSN-", acts18w5.strongs === 'G1904' && acts18w5.word === 'ἐπέρχομαι' && acts18w5.surface === 'ἐπελθόντος' && acts18w5.morphology === 'V- -AAPGSN-', JSON.stringify(acts18w5));

const acts18w10 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'pos', morph_pos, 'case', morph_case, 'token_pos', orig_word_position, 'locator', verified_locator, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8) AND ar_word_position=10;`));
assertCondition("acts18_genitive_pronoun: Acts 1:8 لي has G3450 μου token 12, exact MorphGNT raw tag RP ----GS--", acts18w10.strongs === 'G3450' && acts18w10.surface === 'μου' && acts18w10.case === 'genitive' && acts18w10.token_pos === 12 && acts18w10.locator === 'SBLGNT:B44.C1.V8.w12' && acts18w10.morphology === 'RP ----GS--', JSON.stringify(acts18w10));

// 6. Eph 2:8 - καὶ τοῦτο G3778 demonstrative and Arabic copula
const eph28w5 = JSON.parse(query(`SELECT json_object('strongs', strongs_id, 'surface', orig_surface, 'case', morph_case, 'gender', morph_gender, 'token_pos', orig_word_position, 'locator', verified_locator, 'morphology', orig_morphology) FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=49 AND chapter_num=2 AND verse_num=8) AND ar_word_position=5;`));
assertCondition("eph28_demonstrative: Eph 2:8 وذلك has G3778 τοῦτο token 9, SBLGNT w9, nominative neuter, exact raw morphology RD ----NSN-", eph28w5.strongs === 'G3778' && eph28w5.surface === 'τοῦτο' && eph28w5.case === 'nominative' && eph28w5.gender === 'neuter' && eph28w5.token_pos === 9 && eph28w5.locator === 'SBLGNT:B49.C2.V8.w9' && eph28w5.morphology === 'RD ----NSN-', JSON.stringify(eph28w5));

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

// -----------------------------------------------------------------------------
// Test 5: SQLite Database Engine Integrity
// -----------------------------------------------------------------------------
console.log('\n▶ TEST 5: SQLite Integrity & Vacuum Check');
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
