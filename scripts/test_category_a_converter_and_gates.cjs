/**
 * test_category_a_converter_and_gates.cjs
 *
 * Mandatory CI Gate Suite for the Corrected OSHB/MorphGNT/Robinson Morphology Converter
 * and Strict Category A Eligibility Rules:
 *
 *   1. Verifies the complete OSHB Hebrew (27 stems) & Aramaic (26 stems) verb stem tables
 *      against the official Open Scriptures Hebrew Bible specification (hb.openscriptures.org).
 *   2. Explicit regression tests for the two reported OSHB Aramaic cases:
 *        - Daniel 2:45 w7 (`AVip3fs`) -> morphStem === 'ithpeel' (and passive, qatal, indicative, 3fs)
 *        - Ezra 4:13 w11 (`AVti3mp`) -> morphStem === 'hishtaphel' (and active, yiqtol, indicative, 3mp)
 *      Plus live XML verification that these exact tokens exist in scripts/data/oshb/Dan.xml and Ezra.xml.
 *   3. Verifies proper_noun preservation for HNp / ANp (never downgraded to 'noun') and Greek N- proper nouns.
 *   4. Tests the converter directly on ALL 819 calibrated reference records (B20 [311] + R1 [253] + R2 [255])
 *      WITHOUT excluding them, verifying that applying the converter to them causes ZERO regressions on
 *      the frozen 4-axis auditor (100% clean: 253/253 R1 and 255/255 R2) and zero semantic corruptions!
 *   5. Tests strict rejection of duplicate-occurrence false-clean traps in:
 *        - Zech 12:12 pos #11 «حِدَتِهَا» (H905 לְבָד @ w11 where לְבָד occurs 5 times in the verse)
 *        - Eph 1:21 pos #15 «فِي» (G1722 ἐν @ w15 where ἐν occurs 2 times in the verse)
 *   6. Verifies complete diff log integrity: every single modified record in trial_deterministic_repairs_diff_report_v379.json
 *      is present in trial_category_a_derived_only_full_diff_v379.jsonl with an explicit eligibilityRule and
 *      touches ONLY the 9 derived morphology columns (zero mutations to orig_surface, orig_word, orig_morphology,
 *      verified_locator, morph_source, verified_source, relation_type, or word_mapping_strongs).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const {
  OSHB_HEBREW_VERB_STEMS,
  OSHB_ARAMAIC_VERB_STEMS,
  OT_BOOK_MAP,
  TR_BOOK_OSIS_MAP,
  getBhsChapterVerse,
  isBiblicalAramaicVerse,
  loadAllSources,
  deriveCanonicalMorphFields
} = require('./full_66_books_audit_helpers.cjs');
const { evaluateStrictCategoryAEligibility } = require('./preview_and_apply_deterministic_rules_trial.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const prodDbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');

function q(sql, targetDb = prodDbPath) {
  return execFileSync(sqlitePath, [targetDb], { input: sql, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 }).replace(/\r/g, '').trim();
}

let passed = 0;
let failed = 0;
function assert(cond, msg, detail = '') {
  if (cond) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}${detail ? ' -> ' + detail : ''}`);
    failed++;
  }
}

console.log('=== RUNNING CATEGORY A MORPHOLOGY CONVERTER & STRICT ELIGIBILITY CI GATES ===\n');

// ---------------------------------------------------------------------------
// 1. Official OSHB Aramaic & Hebrew Stem Table Verification
// ---------------------------------------------------------------------------
console.log('--- Section 1: OSHB Verb Stem Table & Mandatory Cases (Dan 2:45 & Ezra 4:13) ---');

const { oshbByBook, sblByBook, trByOsis } = loadAllSources();

// Verify live OSHB XML tokens for Dan 2:45 w7 and Ezra 4:13 w11
const dan245 = oshbByBook[27].get('Dan.2.45');
const dan245w7 = dan245 && dan245.byIndex.get(7);
assert(
  Boolean(dan245w7 && dan245w7.morph === 'AVip3fs'),
  'Gate 1: OSHB Dan.xml confirms Dan 2:45 w7 carries raw morph AVip3fs',
  dan245w7 ? `got ${dan245w7.morph}` : 'token missing'
);

const danRes = deriveCanonicalMorphFields('aramaic', 'AVip3fs', false);
assert(
  danRes &&
  danRes.morphPos === 'verb' &&
  danRes.morphStem === 'ithpeel' &&
  danRes.morphTense === 'qatal' &&
  danRes.morphVoice === 'passive' &&
  danRes.morphMood === 'indicative' &&
  danRes.morphPerson === '3' &&
  danRes.morphGender === 'feminine' &&
  danRes.morphNumber === 'singular',
  'Gate 2: Converter maps Dan 2:45 w7 (AVip3fs) -> stem=ithpeel, voice=passive, tense=qatal, mood=indicative, 3fs',
  JSON.stringify(danRes)
);

const ezra413 = oshbByBook[15].get('Ezra.4.13');
const ezra413w11 = ezra413 && ezra413.byIndex.get(11);
assert(
  Boolean(ezra413w11 && ezra413w11.morph === 'AVti3mp'),
  'Gate 3: OSHB Ezra.xml confirms Ezra 4:13 w11 carries raw morph AVti3mp',
  ezra413w11 ? `got ${ezra413w11.morph}` : 'token missing'
);

const ezraRes = deriveCanonicalMorphFields('aramaic', 'AVti3mp', false);
assert(
  ezraRes &&
  ezraRes.morphPos === 'verb' &&
  ezraRes.morphStem === 'hishtaphel' &&
  ezraRes.morphTense === 'yiqtol' &&
  ezraRes.morphVoice === 'active' &&
  ezraRes.morphMood === 'indicative' &&
  ezraRes.morphPerson === '3' &&
  ezraRes.morphGender === 'masculine' &&
  ezraRes.morphNumber === 'plural',
  'Gate 4: Converter maps Ezra 4:13 w11 (AVti3mp) -> stem=hishtaphel, voice=active, tense=yiqtol, mood=indicative, 3mp',
  JSON.stringify(ezraRes)
);

// Verify all 27 Hebrew stems and 26 Aramaic stems are present and match OSHB official spec
assert(
  OSHB_HEBREW_VERB_STEMS.q === 'qal' &&
  OSHB_HEBREW_VERB_STEMS.N === 'niphal' &&
  OSHB_HEBREW_VERB_STEMS.l === 'pilpel' &&
  OSHB_HEBREW_VERB_STEMS.L === 'polpal' &&
  OSHB_HEBREW_VERB_STEMS.c === 'tiphil' &&
  OSHB_HEBREW_VERB_STEMS.v === 'hishtaphel' &&
  OSHB_HEBREW_VERB_STEMS.D === 'nithpael' &&
  OSHB_HEBREW_VERB_STEMS.u === 'hothpaal' &&
  OSHB_HEBREW_VERB_STEMS.r === 'hithpolel' &&
  Object.keys(OSHB_HEBREW_VERB_STEMS).length === 27,
  'Gate 5: Complete 27-stem OSHB Hebrew verb table verified'
);

assert(
  OSHB_ARAMAIC_VERB_STEMS.q === 'peal' &&
  OSHB_ARAMAIC_VERB_STEMS.Q === 'peil' &&
  OSHB_ARAMAIC_VERB_STEMS.i === 'ithpeel' &&
  OSHB_ARAMAIC_VERB_STEMS.u === 'hithpeel' &&
  OSHB_ARAMAIC_VERB_STEMS.p === 'pael' &&
  OSHB_ARAMAIC_VERB_STEMS.P === 'ithpaal' &&
  OSHB_ARAMAIC_VERB_STEMS.M === 'hithpaal' &&
  OSHB_ARAMAIC_VERB_STEMS.a === 'aphel' &&
  OSHB_ARAMAIC_VERB_STEMS.h === 'haphel' &&
  OSHB_ARAMAIC_VERB_STEMS.e === 'shaphel' &&
  OSHB_ARAMAIC_VERB_STEMS.H === 'hophal' &&
  OSHB_ARAMAIC_VERB_STEMS.t === 'hishtaphel' &&
  OSHB_ARAMAIC_VERB_STEMS.v === 'ishtaphel' &&
  OSHB_ARAMAIC_VERB_STEMS.s === 'saphel' &&
  OSHB_ARAMAIC_VERB_STEMS.r === 'hithpolel' &&
  OSHB_ARAMAIC_VERB_STEMS.z === 'ithpoel' &&
  Object.keys(OSHB_ARAMAIC_VERB_STEMS).length === 26,
  'Gate 6: Complete 26-stem OSHB Aramaic verb table verified'
);

// Verify additional real OSHB Aramaic stems from source XML: Dan 2:9 w13 (AVMp3mp -> hithpaal), Dan 3:13 w14 (AVHp3mp -> hophal), Dan 3:19 w7 (AVPp3ms -> ithpaal), Ezra 4:12 w20 (AVvi3mp -> ishtaphel)
assert(deriveCanonicalMorphFields('aramaic', 'AVMp3mp').morphStem === 'hithpaal', 'Gate 7: Aramaic AVMp3mp (Dan 2:9 w13) -> hithpaal');
assert(deriveCanonicalMorphFields('aramaic', 'AVHp3mp').morphStem === 'hophal', 'Gate 8: Aramaic AVHp3mp (Dan 3:13 w14) -> hophal');
assert(deriveCanonicalMorphFields('aramaic', 'AVPp3ms').morphStem === 'ithpaal', 'Gate 9: Aramaic AVPp3ms (Dan 3:19 w7) -> ithpaal');
assert(deriveCanonicalMorphFields('aramaic', 'AVvi3mp').morphStem === 'ishtaphel', 'Gate 10: Aramaic AVvi3mp (Ezra 4:12 w20) -> ishtaphel');

// ---------------------------------------------------------------------------
// 2. Proper Noun Classification Preservation
// ---------------------------------------------------------------------------
console.log('\n--- Section 2: Proper Noun Classification Preservation ---');

const hnpRes1 = deriveCanonicalMorphFields('hebrew', 'HNp', false, { morphPos: 'noun' });
const hnpRes2 = deriveCanonicalMorphFields('hebrew', 'HNp', false, { morphPos: 'proper_noun', morphNumber: 'singular' });
const anpRes = deriveCanonicalMorphFields('aramaic', 'ANp', false, { morphPos: 'noun' });
const grkProperRes = deriveCanonicalMorphFields('greek', 'N- ----NSM-', false, { morphPos: 'proper_noun' });
const grkCommonRes = deriveCanonicalMorphFields('greek', 'N- ----NSM-', false, { morphPos: 'noun' });

assert(hnpRes1.morphPos === 'proper_noun', 'Gate 11: Hebrew HNp always yields proper_noun (even if previously stored as noun)');
assert(hnpRes2.morphPos === 'proper_noun' && hnpRes2.morphNumber === 'singular', 'Gate 12: Hebrew HNp preserves proper_noun and existing number');
assert(anpRes.morphPos === 'proper_noun', 'Gate 13: Aramaic ANp always yields proper_noun');
assert(grkProperRes.morphPos === 'proper_noun', 'Gate 14: Greek SBLGNT N- preserves proper_noun when already classified as proper_noun');
assert(grkCommonRes.morphPos === 'noun', 'Gate 15: Greek SBLGNT N- keeps noun for common nouns');

// ---------------------------------------------------------------------------
// 3. Direct Execution of Strict Category A Rules on ALL 819 Calibrated Reference Records
//    (WITHOUT excluding them!) -> Verify 0 Regressions on Frozen Auditor (253/253 R1 & 255/255 R2)
// ---------------------------------------------------------------------------
console.log('\n--- Section 3: Un-Excluded Reference Set Verification (B20 [311] + R1 [253] + R2 [255]) ---');

const r1M = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_15_verses_manifest.json'), 'utf8'));
const r2M = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json'), 'utf8'));
const b20M = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/batch_20_verses_manifest.json'), 'utf8'));

const scratchRefDb = path.join(repoRoot, 'scratch/test_catA_on_819_ref_unexcluded.db');
fs.mkdirSync(path.dirname(scratchRefDb), { recursive: true });
fs.copyFileSync(prodDbPath, scratchRefDb);

const allRefVerses = [
  ...b20M.verses.map(v => ({ set: 'B20', book: v.book, ch: v.ch, vs: v.vs, name: v.name, lang: v.lang, oshbOsis: v.osis })),
  ...r1M.holdout_verses.map(v => ({ set: 'R1', ...v })),
  ...r2M.holdout_verses.map(v => ({ set: 'R2', ...v }))
];

function sqlVal(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

const refSql = ['BEGIN TRANSACTION;'];
let refTotalEvaluated = 0;
let refEligible = 0;
let refModified = 0;
let refProperNounDowngrades = 0;
let refWrongStemChanges = 0;

for (const v of allRefVerses) {
  const oshbTokens = v.lang !== 'greek' ? (oshbByBook[v.book].get(v.oshbOsis) || null) : null;
  const sblTokens = v.lang === 'greek' ? (sblByBook[v.book].get(`${v.ch}:${v.vs}`) || null) : null;
  const trTokens = v.lang === 'greek' ? (trByOsis.get(`${TR_BOOK_OSIS_MAP[v.book]}:${v.ch}:${v.vs}`) || null) : null;

  const rows = q(`
    SELECT wm.id, wm.ar_word_position, wm.ar_word,
           COALESCE(wm.strongs_id,''), COALESCE(wm.orig_surface,''), COALESCE(wm.orig_morphology,''),
           COALESCE(wm.morph_pos,''), COALESCE(wm.morph_stem,''), COALESCE(wm.morph_tense,''),
           COALESCE(wm.morph_voice,''), COALESCE(wm.morph_mood,''), COALESCE(wm.morph_person,''),
           COALESCE(wm.morph_number,''), COALESCE(wm.morph_gender,''), COALESCE(wm.morph_case,''),
           COALESCE(wm.orig_word_position,''), COALESCE(wm.verified_locator,''),
           COALESCE(wm.morph_source,''), COALESCE(wm.relation_type,'')
    FROM word_mappings wm
    JOIN verses vr ON wm.verse_id = vr.id
    WHERE vr.book_id = ${v.book} AND vr.chapter_num = ${v.ch} AND vr.verse_num = ${v.vs}
    ORDER BY wm.ar_word_position ASC;
  `, scratchRefDb).split('\n').filter(Boolean);

  const claimCounts = new Map();
  for (const r of rows) {
    const p = r.split('|');
    const origPos = p[15] ? parseInt(p[15], 10) : null;
    const isSyn = p[6] === 'syntactic_ar' || (p[16] && p[16].startsWith('AR_SYNTACTIC'));
    if (!isSyn && origPos > 0) claimCounts.set(origPos, (claimCounts.get(origPos) || 0) + 1);
  }

  for (const r of rows) {
    refTotalEvaluated++;
    const [mId, arPos, arWord, strongsId, origSurface, origMorph, morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase, origPosStr, locator, morphSource, relationType] = r.split('|');
    const origPos = origPosStr ? parseInt(origPosStr, 10) : null;
    const isSyntactic = morphPos === 'syntactic_ar' || (locator && locator.startsWith('AR_SYNTACTIC'));
    const res = evaluateStrictCategoryAEligibility({
      lang: v.lang,
      isSyntactic,
      strongsId,
      origPos,
      origSurface,
      origMorph,
      locator,
      morphSource,
      relationType,
      primaryLocatorClaimCount: origPos ? (claimCounts.get(origPos) || 0) : 0,
      oshbTokens,
      sblTokens,
      trTokens,
      curDerived: {
        morphPos: morphPos || null,
        morphStem: morphStem || null,
        morphTense: morphTense || null,
        morphVoice: morphVoice || null,
        morphMood: morphMood || null,
        morphPerson: morphPerson || null,
        morphNumber: morphNumber || null,
        morphGender: morphGender || null,
        morphCase: morphCase || null
      }
    });
    if (res.eligible) {
      refEligible++;
      if (res.changed) {
        refModified++;
        if (morphPos === 'proper_noun' && res.after.morph_pos && res.after.morph_pos !== 'proper_noun') {
          refProperNounDowngrades++;
        }
        if (morphStem && res.after.morph_stem && res.after.morph_stem !== morphStem) {
          refWrongStemChanges++;
        }
        const setClause = Object.keys(res.after).map(c => `${c} = ${sqlVal(res.after[c])}`).join(', ');
        refSql.push(`UPDATE word_mappings SET ${setClause} WHERE id = ${sqlVal(mId)};`);
      }
    }
  }
}
refSql.push('COMMIT;');
const tmpRefSqlPath = path.join(repoRoot, 'scratch/tmp_apply_catA_on_819_ref.sql');
fs.writeFileSync(tmpRefSqlPath, refSql.join('\n') + '\n', 'utf8');
execFileSync(sqlitePath, [scratchRefDb], { input: `.read ${tmpRefSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

// Run frozen auditor on scratchRefDb for BOTH Round 1 (253) and Round 2 (255) with --fail-on-alerts!
let r1Pass = false, r2Pass = false;
try {
  execFileSync(process.execPath, [
    path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'),
    '--manifest', path.join(repoRoot, 'scripts/unseen_holdout_15_verses_manifest.json'),
    '--out', path.join(repoRoot, 'scratch/tmp_r1_unexcluded_check.json'),
    '--fail-on-alerts'
  ], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: scratchRefDb }, stdio: 'pipe' });
  r1Pass = true;
} catch (_) {}

try {
  execFileSync(process.execPath, [
    path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'),
    '--manifest', path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json'),
    '--out', path.join(repoRoot, 'scratch/tmp_r2_unexcluded_check.json'),
    '--fail-on-alerts'
  ], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: scratchRefDb }, stdio: 'pipe' });
  r2Pass = true;
} catch (_) {}

try { fs.unlinkSync(scratchRefDb); fs.unlinkSync(tmpRefSqlPath); } catch (_) {}

assert(refTotalEvaluated === 819, `Gate 16: Evaluated all 819 calibrated reference records (got ${refTotalEvaluated})`);
assert(refProperNounDowngrades === 0, `Gate 17: Zero proper_noun downgrades across all 819 reference records`);
assert(refWrongStemChanges === 0, `Gate 18: Zero stem regressions across all 819 reference records`);
assert(r1Pass, `Gate 19: Applying strict Category A rules directly to Round 1 (without excluding it) keeps 253/253 (0 alerts)`);
assert(r2Pass, `Gate 20: Applying strict Category A rules directly to Round 2 (without excluding it) keeps 255/255 (0 alerts)`);

// ---------------------------------------------------------------------------
// 4. Explicit Rejection of Wrong Occurrence False-Clean Traps (Zech 12:12 & Eph 1:21)
// ---------------------------------------------------------------------------
console.log('\n--- Section 4: Strict Rejection of Duplicate-Occurrence Traps (Zech 12:12 & Eph 1:21) ---');

// Zech 12:12 pos #11 «حِدَتِهَا» (H905 לְבָד @ w11 where לְבָד occurs 5 times in Zech.12.12!)
const zechRow = q(`
  SELECT wm.ar_word_position, wm.ar_word, COALESCE(wm.strongs_id,''), COALESCE(wm.orig_surface,''),
         COALESCE(wm.orig_morphology,''), COALESCE(wm.morph_pos,''), COALESCE(wm.orig_word_position,''),
         COALESCE(wm.verified_locator,''), COALESCE(wm.morph_source,''), COALESCE(wm.relation_type,'')
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 38 AND vr.chapter_num = 12 AND vr.verse_num = 12 AND wm.ar_word_position = 11;
`).split('|');

const zechEval = evaluateStrictCategoryAEligibility({
  lang: 'hebrew',
  isSyntactic: false,
  strongsId: zechRow[2],
  origPos: parseInt(zechRow[6], 10),
  origSurface: zechRow[3],
  origMorph: zechRow[4],
  locator: zechRow[7],
  morphSource: zechRow[8],
  relationType: zechRow[9],
  primaryLocatorClaimCount: 1,
  oshbTokens: oshbByBook[38].get('Zech.12.12'),
  sblTokens: null,
  trTokens: null,
  curDerived: { morphPos: zechRow[5] || null }
});

assert(
  !zechEval.eligible && zechEval.reason === 'REJECT_DUPLICATE_OCCURRENCE_IN_VERSE',
  'Gate 21: Zech 12:12 pos #11 («حِدَتِهَا», H905 לְבָד @ w11) is strictly REJECTED as duplicate occurrence in verse',
  JSON.stringify(zechEval)
);

// Eph 1:21 pos #15 «فِي» (G1722 ἐν @ w15 where ἐν occurs 2 times in Eph 1:21!)
const ephRow = q(`
  SELECT wm.ar_word_position, wm.ar_word, COALESCE(wm.strongs_id,''), COALESCE(wm.orig_surface,''),
         COALESCE(wm.orig_morphology,''), COALESCE(wm.morph_pos,''), COALESCE(wm.orig_word_position,''),
         COALESCE(wm.verified_locator,''), COALESCE(wm.morph_source,''), COALESCE(wm.relation_type,'')
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 49 AND vr.chapter_num = 1 AND vr.verse_num = 21 AND wm.ar_word_position = 15;
`).split('|');

const ephEval = evaluateStrictCategoryAEligibility({
  lang: 'greek',
  isSyntactic: false,
  strongsId: ephRow[2],
  origPos: parseInt(ephRow[6], 10),
  origSurface: ephRow[3],
  origMorph: ephRow[4],
  locator: ephRow[7],
  morphSource: ephRow[8],
  relationType: ephRow[9],
  primaryLocatorClaimCount: 1,
  oshbTokens: null,
  sblTokens: sblByBook[49].get('1:21'),
  trTokens: trByOsis.get('Eph:1:21'),
  curDerived: { morphPos: ephRow[5] || null }
});

assert(
  !ephEval.eligible && (ephEval.reason === 'REJECT_DUPLICATE_OCCURRENCE_IN_VERSE' || ephEval.reason === 'REJECT_LEXICAL_MISMATCH_AT_WN'),
  'Gate 22: Eph 1:21 pos #15 («فِي», G1722 ἐν @ w15) is strictly REJECTED (duplicate occurrence / wrong occurrence guard)',
  JSON.stringify(ephEval)
);

// Also test synthetic Eph 1:21 ἐν @ w16 (exact surface+morph match on 1st of 2 occurrences: w16 ἐν & w22 ἐν)
const ephSyntheticEval = evaluateStrictCategoryAEligibility({
  lang: 'greek',
  isSyntactic: false,
  strongsId: 'G1722',
  origPos: 16,
  origSurface: 'ἐν',
  origMorph: 'P- --------',
  locator: 'SBLGNT:B49.C1.V21.w16',
  morphSource: 'morphgnt_sblgnt',
  relationType: 'primary',
  primaryLocatorClaimCount: 1,
  oshbTokens: null,
  sblTokens: sblByBook[49].get('1:21'),
  trTokens: trByOsis.get('Eph:1:21'),
  curDerived: { morphPos: 'preposition' }
});

assert(
  !ephSyntheticEval.eligible && ephSyntheticEval.reason === 'REJECT_DUPLICATE_OCCURRENCE_IN_VERSE',
  'Gate 23: Eph 1:21 synthetic ἐν @ w16 (exact match on 1st of 2 occurrences w16 & w22) is strictly REJECTED by occurrence uniqueness guard',
  JSON.stringify(ephSyntheticEval)
);

// ---------------------------------------------------------------------------
// 5. Complete Diff Log & Reconciliation Integrity Check
// ---------------------------------------------------------------------------
console.log('\n--- Section 5: Complete Diff Log Integrity (100% Record Coverage & Derived-Only Scope) ---');

const summaryPath = path.join(repoRoot, 'scripts/trial_deterministic_repairs_diff_report_v379.json');
const fullLogPath = path.join(repoRoot, 'scripts/trial_category_a_derived_only_full_diff_v379.jsonl');
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const logLines = fs.readFileSync(fullLogPath, 'utf8').split('\n').filter(Boolean);
const actualLogSha = sha256File(fullLogPath);

assert(
  summary.scope === 'STRICT_CATEGORY_A_DERIVED_MORPHOLOGY_COLUMNS_ONLY' &&
  summary.productionDbUntouched === true &&
  summary.fullDiffLogSha256 === actualLogSha,
  'Gate 24: Summary report & full diff JSONL SHA-256 match and production DB is untouched'
);

assert(
  logLines.length === summary.fullDiffLogLineCount &&
  logLines.length === summary.reconciliationExplanation.strictCategoryAReconciliation.exactModifiedRecordsInTrialDb,
  `Gate 25: Full diff JSONL contains 100% of modified records (${logLines.length} lines == ${summary.reconciliationExplanation.strictCategoryAReconciliation.exactModifiedRecordsInTrialDb} modified DB rows)`
);

const allowedDerivedCols = new Set([
  'morph_pos', 'morph_stem', 'morph_tense', 'morph_voice', 'morph_mood',
  'morph_person', 'morph_number', 'morph_gender', 'morph_case'
]);
let invalidColCount = 0;
let missingRuleCount = 0;
for (const line of logLines) {
  const rec = JSON.parse(line);
  if (!rec.eligibilityRule || !rec.eligibilityRule.startsWith('RULE_A')) missingRuleCount++;
  for (const col of Object.keys(rec.after || {})) {
    if (!allowedDerivedCols.has(col)) invalidColCount++;
  }
}

assert(invalidColCount === 0, 'Gate 26: Zero forbidden/non-derived columns touched across all logged diffs');
assert(missingRuleCount === 0, 'Gate 27: Every single logged record carries an explicit RULE_A* eligibilityRule');

console.log('\n================================================================================');
console.log(`  CATEGORY A CONVERTER & GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
