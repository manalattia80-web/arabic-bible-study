/**
 * preview_and_apply_deterministic_rules_trial.cjs
 *
 * Disciplined Category A (Derived Morphology Columns ONLY) Trial Repair & Complete Diff Logger.
 *
 * Strict Eligibility Gate (Every condition MUST hold before deriving any column):
 *   1. Non-syntactic record with non-empty strongs_id, orig_word_position > 0, orig_surface, and orig_morphology.
 *   2. No unshared duplicate primary locator collision in the same verse.
 *   3. Source token exists at orig_word_position in the recorded edition (OSHB WLC / SBLGNT / Scrivener TR).
 *   4. Lexical match: strongs_id matches the source token's lemma/Strong's ID at orig_word_position.
 *   5. Surface match: orig_surface matches the source token's surface text at orig_word_position.
 *   6. Raw morphology match: orig_morphology ALREADY matches the source token's raw morphology tag at orig_word_position.
 *   7. Occurrence uniqueness guard (rejects duplicate-word occurrence ambiguity such as Zech 12:12 לְבָד or Eph 1:21 ἐν):
 *      The source lemma/Strong's ID MUST appear ONLY ONCE in the source verse (sameLemmaCount === 1).
 *      If a word repeats in the verse (e.g. 5x לְבָד in Zech 12:12 or 2x ἐν in Eph 1:21), it is strictly REJECTED
 *      from automated Category A and deferred to contextual alignment review!
 *
 * Strict Mutation Scope (Derived Fields ONLY):
 *   - NEVER modifies orig_surface, orig_word, orig_morphology, verified_locator, morph_source,
 *     verified_source, relation_type, syntactic_ar classification, or word_mapping_strongs.
 *   - ONLY updates the 9 derived morphology columns (morph_pos, morph_stem, morph_tense,
 *     morph_voice, morph_mood, morph_person, morph_number, morph_gender, morph_case)
 *     when they disagree with deriveCanonicalMorphFields(lang, orig_morphology, isTr, cur).
 *   - Logs EVERY SINGLE modified record (100% complete JSONL diff log, zero truncation) with its
 *     exact eligibility rule ID and field-by-field before/after values.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const {
  OT_BOOK_MAP,
  TR_BOOK_OSIS_MAP,
  getBhsChapterVerse,
  isBiblicalAramaicVerse,
  canonHebSurface,
  normGreekWord,
  loadAllSources,
  morphMatches,
  verifyHebrewStrongsAgainstLemma,
  greekStrongsMatchesLemma,
  deriveCanonicalMorphFields
} = require('./full_66_books_audit_helpers.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const prodDbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const trialDbPath = path.join(repoRoot, 'scratch/bible_study_trial_rule_repaired.db');

const EXPECTED_PROD_DB_SHA256 = '44ef2d39a84e43b8f638f76348954ca553016c7420e6d04a6cd93cd1b37dd17f';

function sqlVal(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function queryToFile(targetDb, sql, tmpFilePath) {
  const cmd = `.output ${tmpFilePath.replace(/\\/g, '/')}\n${sql}\n.quit\n`;
  execFileSync(sqlitePath, [targetDb], { input: cmd, encoding: 'utf8' });
  return fs.readFileSync(tmpFilePath, 'utf8').replace(/\r/g, '').trim();
}

/**
 * Evaluates a single record against the strict Category A (Derived Morphology Only) eligibility gate.
 * Exported so unit & CI tests can directly verify acceptance/rejection on Zech 12:12, Eph 1:21,
 * Dan 2:45, Ezra 4:13, and all 819 calibrated reference records.
 */
function evaluateStrictCategoryAEligibility({
  lang,
  isSyntactic,
  strongsId,
  origPos,
  origSurface,
  origMorph,
  locator,
  morphSource,
  relationType,
  primaryLocatorClaimCount,
  oshbTokens,
  sblTokens,
  trTokens,
  curDerived
}) {
  if (isSyntactic) return { eligible: false, reason: 'REJECT_SYNTACTIC_ROW' };
  if (!strongsId || !origPos || origPos <= 0 || !origMorph) {
    return { eligible: false, reason: 'REJECT_MISSING_MANDATORY_SOURCE_LINK_FIELDS' };
  }
  if (primaryLocatorClaimCount > 1 && relationType !== 'compound_phrase') {
    return { eligible: false, reason: 'REJECT_DUPLICATE_PRIMARY_LOCATOR_COLLISION' };
  }

  const isTr = lang === 'greek' && ((locator && locator.startsWith('TR:')) || morphSource === 'morphgnt_tr' || !sblTokens);
  let tok = null;

  if (lang === 'greek') {
    const tokens = isTr ? trTokens : sblTokens;
    if (!tokens || !tokens.byIndex) return { eligible: false, reason: 'REJECT_SOURCE_VERSE_UNAVAILABLE' };
    tok = tokens.byIndex.get(origPos);
    if (!tok) return { eligible: false, reason: 'REJECT_OUT_OF_BOUNDS_LOCATOR' };

    const lexOk = isTr
      ? Boolean(tok.strongsId && strongsId === tok.strongsId)
      : Boolean(tok.lemma && greekStrongsMatchesLemma(strongsId, tok.lemma));
    if (!lexOk) return { eligible: false, reason: 'REJECT_LEXICAL_MISMATCH_AT_WN' };

    const dbGr = normGreekWord(origSurface);
    const surfOk = isTr
      ? Boolean(origSurface && dbGr === normGreekWord(tok.surface))
      : Boolean(origSurface && [tok.surfacePunct, tok.surfaceClean, tok.surfaceNorm].map(normGreekWord).includes(dbGr));
    if (!surfOk) return { eligible: false, reason: 'REJECT_SURFACE_MISMATCH_AT_WN' };

    const rawMorphOk = isTr
      ? Boolean(tok.grammar && origMorph === tok.grammar)
      : Boolean(tok.morph && origMorph === tok.morph);
    if (!rawMorphOk) return { eligible: false, reason: 'REJECT_RAW_MORPH_MISMATCH_AT_WN' };

    // Occurrence uniqueness guard (rejects duplicate-word occurrence ambiguity like Eph 1:21 ἐν)
    const sameLemmaCount = tokens.filter(t => isTr ? (t.strongsId === strongsId) : greekStrongsMatchesLemma(strongsId, t.lemma)).length;
    if (sameLemmaCount > 1) {
      return { eligible: false, reason: 'REJECT_DUPLICATE_OCCURRENCE_IN_VERSE' };
    }
  } else {
    if (!oshbTokens || !oshbTokens.byIndex) return { eligible: false, reason: 'REJECT_SOURCE_VERSE_UNAVAILABLE' };
    tok = oshbTokens.byIndex.get(origPos);
    if (!tok) return { eligible: false, reason: 'REJECT_OUT_OF_BOUNDS_LOCATOR' };

    const lexOk = Boolean(tok.lemma && verifyHebrewStrongsAgainstLemma(strongsId, tok.lemma, origMorph));
    if (!lexOk) return { eligible: false, reason: 'REJECT_LEXICAL_MISMATCH_AT_WN' };

    const dbC = canonHebSurface(origSurface);
    const rawParts = tok.rawParts || [tok.text];
    const surfOk = Boolean(origSurface && (
      dbC === canonHebSurface(tok.text) ||
      rawParts.map(canonHebSurface).includes(dbC) ||
      canonHebSurface(rawParts.slice(1).join('')) === dbC
    ));
    if (!surfOk) return { eligible: false, reason: 'REJECT_SURFACE_MISMATCH_AT_WN' };

    const rawMorphOk = Boolean(tok.morph && morphMatches(origMorph, tok.morph));
    if (!rawMorphOk) return { eligible: false, reason: 'REJECT_RAW_MORPH_MISMATCH_AT_WN' };

    // Occurrence uniqueness guard (rejects duplicate-word occurrence ambiguity like Zech 12:12 לְבָד)
    const sameLemmaCount = oshbTokens.filter(t => verifyHebrewStrongsAgainstLemma(strongsId, t.lemma, origMorph)).length;
    if (sameLemmaCount > 1) {
      return { eligible: false, reason: 'REJECT_DUPLICATE_OCCURRENCE_IN_VERSE' };
    }
  }

  const derived = deriveCanonicalMorphFields(lang, origMorph, isTr, curDerived);
  if (!derived) return { eligible: false, reason: 'REJECT_UNSUPPORTED_RAW_MORPH_CODE' };

  const updates = {};
  const before = {};
  const colMap = {
    morphPos: 'morph_pos',
    morphStem: 'morph_stem',
    morphTense: 'morph_tense',
    morphVoice: 'morph_voice',
    morphMood: 'morph_mood',
    morphPerson: 'morph_person',
    morphNumber: 'morph_number',
    morphGender: 'morph_gender',
    morphCase: 'morph_case'
  };

  for (const [jsKey, dbCol] of Object.entries(colMap)) {
    const oldVal = curDerived[jsKey] || null;
    const newVal = derived[jsKey] || null;
    if (oldVal !== newVal) {
      before[dbCol] = oldVal;
      updates[dbCol] = newVal;
    }
  }

  // Classify specific eligibility rule for every modified record
  let ruleId = 'NO_CHANGE_ALREADY_CANONICAL';
  const changedCols = Object.keys(updates);
  if (changedCols.length > 0) {
    if (changedCols.length === 1 && changedCols[0] === 'morph_case') {
      ruleId = 'RULE_A2_DERIVE_MORPH_CASE_STATE_ONLY';
    } else if (changedCols.every(c => ['morph_person', 'morph_gender', 'morph_number'].includes(c)) && derived.morphPos === 'preposition') {
      ruleId = 'RULE_A3_DERIVE_PREP_PRONOMINAL_SUFFIX';
    } else if (changedCols.includes('morph_pos') && updates.morph_pos === 'proper_noun') {
      ruleId = 'RULE_A4_RESTORE_PROPER_NOUN_POS';
    } else {
      ruleId = 'RULE_A1_DERIVE_CANONICAL_MORPH_COLUMNS';
    }
  }

  return {
    eligible: true,
    reason: 'ELIGIBLE_VERIFIED_UNIQUE_LINK_AND_RAW_MORPH',
    ruleId,
    isTr,
    before,
    after: updates,
    changed: changedCols.length > 0
  };
}

function runTrial() {
  const prodShaBefore = sha256File(prodDbPath);
  if (prodShaBefore !== EXPECTED_PROD_DB_SHA256) {
    throw new Error(`Production DB SHA-256 mismatch before trial: ${prodShaBefore}`);
  }

  fs.mkdirSync(path.dirname(trialDbPath), { recursive: true });
  fs.copyFileSync(prodDbPath, trialDbPath);
  console.log(`Copied frozen DB (${prodShaBefore}) -> ${trialDbPath}`);

  const { oshbByBook, sblByBook, trByOsis } = loadAllSources();

  // Note: We track which verses belong to B20 (311) / R1 (253) / R2 (255) for reporting,
  // and we test the converter on them explicitly in test_category_a_converter_and_gates.cjs.
  // In the trial DB, we keep B20 / R1 / R2 untouched ONLY IF --preserve-calibrated is set,
  // or by default we preserve frozen calibrated baselines and report exact counts separately.
  const r1Manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'unseen_holdout_15_verses_manifest.json'), 'utf8'));
  const r2Manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'unseen_holdout_round2_15_verses_manifest.json'), 'utf8'));
  const b20Manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch_20_verses_manifest.json'), 'utf8'));
  const calibratedKeys = new Set();
  for (const v of r1Manifest.holdout_verses) calibratedKeys.add(`${v.book}:${v.ch}:${v.vs}`);
  for (const v of r2Manifest.holdout_verses) calibratedKeys.add(`${v.book}:${v.ch}:${v.vs}`);
  for (const v of b20Manifest.verses) calibratedKeys.add(`${v.book}:${v.ch}:${v.vs}`);

  console.log('Querying all 434,351 word_mappings across all 66 books...');
  const tmpWmTrial = path.join(repoRoot, 'scratch/tmp_wm_strict_catA.txt');
  const allRowsRaw = queryToFile(trialDbPath, `
    SELECT vr.book_id, vr.chapter_num, vr.verse_num, wm.id, wm.ar_word_position, wm.ar_word,
           COALESCE(wm.strongs_id,''), COALESCE(wm.orig_word,''), COALESCE(wm.orig_surface,''),
           COALESCE(wm.orig_word_lang,''), COALESCE(wm.morph_pos,''), COALESCE(wm.orig_morphology,''),
           COALESCE(wm.morph_gender,''), COALESCE(wm.morph_number,''), COALESCE(wm.morph_person,''),
           COALESCE(wm.morph_stem,''), COALESCE(wm.morph_mood,''), COALESCE(wm.orig_word_position,''),
           COALESCE(wm.verified_locator,''), COALESCE(wm.morph_tense,''), COALESCE(wm.morph_voice,''),
           COALESCE(wm.morph_case,''), COALESCE(wm.morph_source,''), COALESCE(wm.relation_type,'')
    FROM verses vr
    JOIN word_mappings wm ON wm.verse_id = vr.id
    ORDER BY vr.book_id ASC, vr.chapter_num ASC, vr.verse_num ASC, wm.ar_word_position ASC;
  `, tmpWmTrial);
  try { fs.unlinkSync(tmpWmTrial); } catch (_) {}

  const rowsByBook = Array.from({ length: 67 }, () => new Map());
  for (const line of allRowsRaw.split('\n')) {
    if (!line) continue;
    const parts = line.split('|');
    const b = parseInt(parts[0], 10);
    const ch = parseInt(parts[1], 10);
    const vs = parseInt(parts[2], 10);
    const cvKey = `${ch}:${vs}`;
    const bMap = rowsByBook[b];
    if (!bMap.has(cvKey)) bMap.set(cvKey, []);
    bMap.get(cvKey).push(parts.slice(1));
  }

  const rejectionCounts = {};
  const ruleCounts = {
    RULE_A1_DERIVE_CANONICAL_MORPH_COLUMNS: 0,
    RULE_A2_DERIVE_MORPH_CASE_STATE_ONLY: 0,
    RULE_A3_DERIVE_PREP_PRONOMINAL_SUFFIX: 0,
    RULE_A4_RESTORE_PROPER_NOUN_POS: 0
  };
  const fieldDiffCounts = {
    morph_pos: 0,
    morph_stem: 0,
    morph_tense: 0,
    morph_voice: 0,
    morph_mood: 0,
    morph_person: 0,
    morph_number: 0,
    morph_gender: 0,
    morph_case: 0
  };

  let totalScanned = 0;
  let totalEligible = 0;
  let totalEligibleAlreadyCanonical = 0;
  let totalEligibleNeedingDerivedChange = 0;
  let skippedInCalibratedBaseline = 0;
  let totalModifiedInTrialDb = 0;

  const sqlStatements = ['BEGIN TRANSACTION;'];
  const fullDiffLines = [];

  for (let b = 1; b <= 66; b++) {
    const bkName = b <= 39 ? OT_BOOK_MAP[b] : TR_BOOK_OSIS_MAP[b];
    const versesMap = rowsByBook[b];

    for (const [cvKey, vRows] of versesMap.entries()) {
      const [ch, vs] = cvKey.split(':').map(Number);
      const verseKey = `${b}:${ch}:${vs}`;
      const isCalibratedBaseline = calibratedKeys.has(verseKey);
      const lang = b >= 40 ? 'greek' : (isBiblicalAramaicVerse(b, ch, vs) ? 'aramaic' : 'hebrew');

      let oshbTokens = null, sblTokens = null, trTokens = null;
      if (b <= 39) {
        const [bhsC, bhsV] = getBhsChapterVerse(b, ch, vs);
        oshbTokens = oshbByBook[b].get(`${OT_BOOK_MAP[b]}.${bhsC}.${bhsV}`) || null;
      } else {
        sblTokens = sblByBook[b].get(cvKey) || null;
        trTokens = trByOsis.get(`${TR_BOOK_OSIS_MAP[b]}:${ch}:${vs}`) || null;
      }

      const primaryLocatorClaimCounts = new Map();
      for (const parts of vRows) {
        const origPos = parts[16] ? parseInt(parts[16], 10) : null;
        const morphPos = parts[9];
        const locator = parts[17];
        const isSyntactic = morphPos === 'syntactic_ar' || (locator && locator.startsWith('AR_SYNTACTIC'));
        if (!isSyntactic && origPos && origPos > 0) {
          primaryLocatorClaimCounts.set(origPos, (primaryLocatorClaimCounts.get(origPos) || 0) + 1);
        }
      }

      for (const parts of vRows) {
        totalScanned++;
        const [
          , , mId, posStr, arWord, strongsId, origWord, origSurface, origWordLang,
          morphPos, origMorph, morphGender, morphNumber, morphPerson, morphStem, morphMood,
          origPosStr, locator, morphTense, morphVoice, morphCase, morphSource, relationType
        ] = parts;

        const arPos = parseInt(posStr, 10);
        const origPos = origPosStr ? parseInt(origPosStr, 10) : null;
        const isSyntactic = morphPos === 'syntactic_ar' || (locator && locator.startsWith('AR_SYNTACTIC'));

        const res = evaluateStrictCategoryAEligibility({
          lang,
          isSyntactic,
          strongsId,
          origPos,
          origSurface,
          origMorph,
          locator,
          morphSource,
          relationType,
          primaryLocatorClaimCount: origPos ? (primaryLocatorClaimCounts.get(origPos) || 0) : 0,
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

        if (!res.eligible) {
          rejectionCounts[res.reason] = (rejectionCounts[res.reason] || 0) + 1;
          continue;
        }

        totalEligible++;
        if (!res.changed) {
          totalEligibleAlreadyCanonical++;
          continue;
        }

        totalEligibleNeedingDerivedChange++;
        if (isCalibratedBaseline) {
          skippedInCalibratedBaseline++;
          continue;
        }

        totalModifiedInTrialDb++;
        ruleCounts[res.ruleId] = (ruleCounts[res.ruleId] || 0) + 1;

        const updateCols = Object.keys(res.after);
        for (const col of updateCols) {
          fieldDiffCounts[col]++;
        }
        const setClause = updateCols.map(c => `${c} = ${sqlVal(res.after[c])}`).join(', ');
        sqlStatements.push(`UPDATE word_mappings SET ${setClause} WHERE id = ${sqlVal(mId)};`);

        // Write EVERY SINGLE modified record to the complete JSONL diff log (zero truncation!)
        fullDiffLines.push(JSON.stringify({
          ref: `${bkName} ${ch}:${vs} #${arPos}`,
          bookId: b,
          chapter: ch,
          verse: vs,
          arPos,
          origPos,
          mappingId: mId,
          lang,
          arWord,
          strongsId,
          origSurface,
          origMorph,
          locator,
          eligibilityRule: res.ruleId,
          before: res.before,
          after: res.after
        }));
      }
    }
  }

  sqlStatements.push('COMMIT;');
  const sqlFilePath = path.join(repoRoot, 'scratch/apply_trial_strict_category_a_derived_only.sql');
  fs.writeFileSync(sqlFilePath, sqlStatements.join('\n') + '\n', 'utf8');
  execFileSync(sqlitePath, [trialDbPath], { input: `.read ${sqlFilePath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

  const prodShaAfter = sha256File(prodDbPath);
  const trialShaAfter = sha256File(trialDbPath);
  if (prodShaAfter !== EXPECTED_PROD_DB_SHA256) {
    throw new Error(`CRITICAL: Production DB hash changed! ${prodShaAfter}`);
  }

  // Write COMPLETE diff log (100% of modified records, JSONL format)
  const fullDiffLogPath = path.join(__dirname, 'trial_category_a_derived_only_full_diff_v379.jsonl');
  fs.writeFileSync(fullDiffLogPath, fullDiffLines.join('\n') + (fullDiffLines.length ? '\n' : ''), 'utf8');
  const fullDiffLogSha256 = sha256File(fullDiffLogPath);

  const summaryReport = {
    scope: 'STRICT_CATEGORY_A_DERIVED_MORPHOLOGY_COLUMNS_ONLY',
    productionDbSha256_before: prodShaBefore,
    productionDbSha256_after: prodShaAfter,
    productionDbUntouched: prodShaBefore === prodShaAfter,
    trialDbPath: 'scratch/bible_study_trial_rule_repaired.db',
    trialDbSha256: trialShaAfter,
    fullDiffLogPath: 'scripts/trial_category_a_derived_only_full_diff_v379.jsonl',
    fullDiffLogSha256,
    fullDiffLogLineCount: fullDiffLines.length,
    reconciliationExplanation: {
      previousPrototypeNote: 'In commit b1bb915, the prototype reported 19,158 alerted Category A records while modifying 34,188 records because it also modified 15,030 non-alerted/secondary-field records (surface/lemma/locator/morph_source/wms/empty morph_case) without requiring raw orig_morphology match or unique occurrence in verse.',
      strictCategoryAReconciliation: {
        totalScannedRecords: totalScanned,
        totalRejectedByStrictGate: totalScanned - totalEligible,
        totalEligibleUniqueVerifiedRawMorph: totalEligible,
        eligibleAlreadyCanonicalZeroChange: totalEligibleAlreadyCanonical,
        eligibleNeedingDerivedColumnRepair: totalEligibleNeedingDerivedChange,
        preservedCalibratedBaselineRecords: skippedInCalibratedBaseline,
        exactModifiedRecordsInTrialDb: totalModifiedInTrialDb,
        exactMatchWithFullDiffLog: totalModifiedInTrialDb === fullDiffLines.length
      }
    },
    rejectionBreakdown: rejectionCounts,
    eligibilityRuleBreakdown: ruleCounts,
    fieldDiffCounts,
    forbiddenFieldsUntouched: [
      'orig_surface', 'orig_word', 'orig_morphology', 'verified_locator',
      'morph_source', 'verified_source', 'relation_type', 'orig_word_lang', 'word_mapping_strongs'
    ]
  };

  const summaryPath = path.join(__dirname, 'trial_deterministic_repairs_diff_report_v379.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2) + '\n', 'utf8');

  console.log('\n================================================================================');
  console.log('  STRICT CATEGORY A (DERIVED MORPHOLOGY ONLY) TRIAL SUMMARY                     ');
  console.log('================================================================================');
  console.log(`  Total Scanned Records                    : ${totalScanned}`);
  console.log(`  Eligible (Unique Link + Surface + RawM)  : ${totalEligible}`);
  console.log(`    - Already Canonical (0 change)         : ${totalEligibleAlreadyCanonical}`);
  console.log(`    - Needing Derived Column Repair        : ${totalEligibleNeedingDerivedChange}`);
  console.log(`    - Preserved Calibrated Baseline Rows   : ${skippedInCalibratedBaseline}`);
  console.log(`    - EXACT Modified Records in Trial DB   : ${totalModifiedInTrialDb}`);
  console.log(`  Full Diff JSONL Line Count               : ${fullDiffLines.length} (100% complete, SHA-256: ${fullDiffLogSha256})`);
  console.log('  Eligibility Rule Breakdown:', JSON.stringify(ruleCounts, null, 2));
  console.log('  Field Diff Counts:', JSON.stringify(fieldDiffCounts, null, 2));
  console.log('  Rejection Breakdown:', JSON.stringify(rejectionCounts, null, 2));
  console.log('================================================================================');
}

if (require.main === module) {
  runTrial();
}

module.exports = { evaluateStrictCategoryAEligibility };
