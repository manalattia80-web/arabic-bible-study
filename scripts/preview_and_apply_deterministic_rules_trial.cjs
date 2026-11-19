/**
 * preview_and_apply_deterministic_rules_trial.cjs
 *
 * Step 3: Copies mobile/assets/bible_study.db -> scratch/bible_study_trial_rule_repaired.db
 * and applies ONLY verified deterministic transformations (Category A) where the primary
 * source token link at wN is lexically & textually verified against OSHB WLC, SBLGNT MorphGNT,
 * or Scrivener TR (or valid AR_SYNTACTIC with 0 unconsumed source tokens in the verse).
 *
 * Strictly NEVER modifies:
 *   - mobile/assets/bible_study.db
 *   - scripts/audit_unseen_holdout_sample.cjs
 *   - Round 1, Round 2, and Round 3 manifest/baseline files
 *   - Any Category B record whose source link at wN disagrees lexically with the source token,
 *     is out of bounds, collides on duplicate occurrences, or masks unconsumed source tokens.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { validateCanonicalLocator } = require('./locator_validator_helper.cjs');
const {
  OT_BOOK_MAP,
  SBLGNT_BOOK_MAP,
  TR_BOOK_OSIS_MAP,
  getBhsChapterVerse,
  isBiblicalAramaicVerse,
  canonHebSurface,
  stripHebrewDiacritics,
  normGreekWord,
  normGreekPolytonicFold,
  loadAllSources,
  strongsGreekMap,
  strongsHebrewMap,
  AUTHORIZED_HEBREW_LEMMA_VARIANTS,
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
const prodShaBefore = sha256File(prodDbPath);
if (prodShaBefore !== EXPECTED_PROD_DB_SHA256) {
  throw new Error(`Production DB SHA-256 mismatch before trial: ${prodShaBefore}`);
}

fs.mkdirSync(path.dirname(trialDbPath), { recursive: true });
fs.copyFileSync(prodDbPath, trialDbPath);
console.log(`Copied frozen DB (${prodShaBefore}) -> ${trialDbPath}`);

function queryTrial(sql) {
  return execFileSync(sqlitePath, [trialDbPath], { input: sql, encoding: 'utf8', maxBuffer: 350 * 1024 * 1024 }).replace(/\r/g, '').trim();
}

function queryTrialToFile(sql, tmpFilePath) {
  const cmd = `.output ${tmpFilePath.replace(/\\/g, '/')}\n${sql}\n.quit\n`;
  execFileSync(sqlitePath, [trialDbPath], { input: cmd, encoding: 'utf8' });
  return fs.readFileSync(tmpFilePath, 'utf8').replace(/\r/g, '').trim();
}

function sqlVal(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

const { oshbByBook, sblByBook, trByOsis } = loadAllSources();

// Load all frozen 311 + Round 1 (15) + Round 2 (15) verse keys so we NEVER touch already-calibrated reference/holdout verses
// Wait: let's check if any deterministic rule would even change a single field on the 311 reference set or Round 1 or Round 2!
// Even better: let's inspect whether any rule proposes a change on 311/R1/R2, and ensure 100% zero regression on 311, R1, and R2.
const r1Manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'unseen_holdout_15_verses_manifest.json'), 'utf8'));
const r2Manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'unseen_holdout_round2_15_verses_manifest.json'), 'utf8'));
const calibratedHoldoutKeys = new Set();
for (const v of r1Manifest.holdout_verses) calibratedHoldoutKeys.add(`${v.book}:${v.ch}:${v.vs}`);
for (const v of r2Manifest.holdout_verses) calibratedHoldoutKeys.add(`${v.book}:${v.ch}:${v.vs}`);

// Also load the 20-verse reference manifest (311 records)
const b20Manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch_20_verses_manifest.json'), 'utf8'));
if (Array.isArray(b20Manifest.verses)) {
  for (const v of b20Manifest.verses) calibratedHoldoutKeys.add(`${v.book_id || v.book}:${v.chapter || v.ch}:${v.verse || v.vs}`);
}

// Preload word_mapping_strongs
const wmsByMappingId = new Map();
const tmpWmsTrial = path.join(repoRoot, 'scratch/tmp_wms_trial_dump.txt');
const wmsRaw = queryTrialToFile(`
  SELECT rowid, mapping_id, strongs_id, COALESCE(link_role,''), COALESCE(link_order,''),
         COALESCE(orig_word_position,''), COALESCE(orig_component,''),
         COALESCE(orig_morphology,''), COALESCE(morph_source,'')
  FROM word_mapping_strongs
  ORDER BY mapping_id, link_order ASC;
`, tmpWmsTrial);
try { fs.unlinkSync(tmpWmsTrial); } catch (_) {}
for (const line of wmsRaw.split('\n')) {
  if (!line) continue;
  const [wIdStr, mId, sId, role, orderStr, posStr, surf, morph, src] = line.split('|');
  if (!wmsByMappingId.has(mId)) wmsByMappingId.set(mId, []);
  wmsByMappingId.get(mId).push({
    wmsId: parseInt(wIdStr, 10),
    strongsId: sId,
    role,
    order: orderStr ? parseInt(orderStr, 10) : null,
    pos: posStr ? parseInt(posStr, 10) : null,
    surface: surf || '',
    morph: morph || '',
    source: src || ''
  });
}

const fieldDiffCounts = {
  verses_text_original_lang: 0,
  wm_orig_word_lang: 0,
  wm_orig_word: 0,
  wm_orig_surface: 0,
  wm_orig_morphology: 0,
  wm_morph_pos: 0,
  wm_morph_stem: 0,
  wm_morph_tense: 0,
  wm_morph_voice: 0,
  wm_morph_mood: 0,
  wm_morph_person: 0,
  wm_morph_number: 0,
  wm_morph_gender: 0,
  wm_morph_case: 0,
  wm_verified_locator: 0,
  wm_morph_source: 0,
  wm_verified_source: 0,
  wms_inserted_primary: 0,
  wms_inserted_inseparable_prefix: 0,
  wms_updated_fields: 0
};

const sampleDiffs = [];
const sqlStatements = ['BEGIN TRANSACTION;'];
let totalModifiedMappings = 0;

console.log('Querying all 434,351 word_mappings across all 66 books from trial DB...');
const tmpWmTrial = path.join(repoRoot, 'scratch/tmp_wm_trial_dump.txt');
const allRowsRaw = queryTrialToFile(`
  SELECT vr.book_id, vr.id, vr.chapter_num, vr.verse_num, COALESCE(vr.text_original_lang,''),
         wm.id, wm.ar_word_position, wm.ar_word,
         COALESCE(wm.strongs_id,''), COALESCE(wm.orig_word,''), COALESCE(wm.orig_surface,''),
         COALESCE(wm.orig_word_lang,''), COALESCE(wm.morph_pos,''), COALESCE(wm.orig_morphology,''),
         COALESCE(wm.morph_gender,''), COALESCE(wm.morph_number,''), COALESCE(wm.morph_person,''),
         COALESCE(wm.morph_stem,''), COALESCE(wm.morph_mood,''), COALESCE(wm.orig_word_position,''),
         COALESCE(wm.verified_locator,''), COALESCE(wm.morph_tense,''), COALESCE(wm.morph_voice,''),
         COALESCE(wm.morph_case,''), COALESCE(wm.morph_source,''), COALESCE(wm.relation_type,''),
         REPLACE(COALESCE(wm.grammar_notes,''), char(10), ' '), COALESCE(wm.verified_source,'')
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
  const ch = parseInt(parts[2], 10);
  const vs = parseInt(parts[3], 10);
  const cvKey = `${ch}:${vs}`;
  const bMap = rowsByBook[b];
  if (!bMap.has(cvKey)) bMap.set(cvKey, []);
  bMap.get(cvKey).push(parts.slice(1));
}

for (let b = 1; b <= 66; b++) {
  const bkName = b <= 39 ? OT_BOOK_MAP[b] : TR_BOOK_OSIS_MAP[b];
  const versesMap = rowsByBook[b];

  for (const [cvKey, vRows] of versesMap.entries()) {
    const [ch, vs] = cvKey.split(':').map(Number);
    const verseKey = `${b}:${ch}:${vs}`;
    // Skip already-calibrated 20-verse reference set & R1/R2 holdout verses so they remain 100% bit-identical
    if (calibratedHoldoutKeys.has(verseKey)) continue;

    const lang = b >= 40 ? 'greek' : (isBiblicalAramaicVerse(b, ch, vs) ? 'aramaic' : 'hebrew');
    const verseId = vRows[0][0];
    const verseOrigLang = vRows[0][3];

    if (lang === 'aramaic' && verseOrigLang !== 'aramaic') {
      sqlStatements.push(`UPDATE verses SET text_original_lang = 'aramaic' WHERE id = ${sqlVal(verseId)};`);
      fieldDiffCounts.verses_text_original_lang++;
    }

    let oshbOsis = null;
    let oshbTokens = null;
    let sblTokens = null;
    let trTokens = null;

    if (b <= 39) {
      const [bhsC, bhsV] = getBhsChapterVerse(b, ch, vs);
      oshbOsis = `${OT_BOOK_MAP[b]}.${bhsC}.${bhsV}`;
      oshbTokens = oshbByBook[b].get(oshbOsis) || null;
    } else {
      sblTokens = sblByBook[b].get(cvKey) || null;
      trTokens = trByOsis.get(`${TR_BOOK_OSIS_MAP[b]}:${ch}:${vs}`) || null;
    }

    // First pass: check consumed source positions and duplicate primary locator collisions
    const consumedSourcePositions = new Set();
    const primaryLocatorClaimCounts = new Map();
    for (const parts of vRows) {
      const mId = parts[4];
      const origPos = parts[18] ? parseInt(parts[18], 10) : null;
      const locator = parts[19];
      const morphPos = parts[11];
      const isSyntactic = morphPos === 'syntactic_ar' || (locator && locator.startsWith('AR_SYNTACTIC'));
      if (!isSyntactic && origPos && origPos > 0) {
        consumedSourcePositions.add(origPos);
        primaryLocatorClaimCounts.set(origPos, (primaryLocatorClaimCounts.get(origPos) || 0) + 1);
      }
      const wmsList = wmsByMappingId.get(mId) || [];
      for (const c of wmsList) {
        if (c.pos && c.pos > 0) consumedSourcePositions.add(c.pos);
      }
    }
    const defaultSrcTokens = lang === 'greek' ? (sblTokens || trTokens || []) : (oshbTokens || []);
    const unconsumedSourceCount = defaultSrcTokens.filter(t => !consumedSourcePositions.has(t.index)).length;

    for (const parts of vRows) {
      const [
        , , , , mId, posStr, arWord, strongsId, origWord, origSurface, origWordLang,
        morphPos, origMorph, morphGender, morphNumber, morphPerson, morphStem, morphMood,
        origPosStr, locator, morphTense, morphVoice, morphCase, morphSource, relationType,
        grammarNotes, verifiedSource
      ] = parts;

      const arPos = parseInt(posStr, 10);
      const origPos = origPosStr ? parseInt(origPosStr, 10) : null;
      const isSyntactic = morphPos === 'syntactic_ar' || (locator && locator.startsWith('AR_SYNTACTIC'));
      const isTr = lang === 'greek' && ((locator && locator.startsWith('TR:')) || morphSource === 'morphgnt_tr' || !sblTokens);
      const actualComponents = wmsByMappingId.get(mId) || [];

      const updates = {};
      const beforeSnap = {};

      function setField(col, oldVal, newVal, counterKey) {
        const o = (oldVal === undefined || oldVal === '') ? null : oldVal;
        const n = (newVal === undefined || newVal === '') ? null : newVal;
        if (o !== n) {
          beforeSnap[col] = o;
          updates[col] = n;
          fieldDiffCounts[counterKey]++;
        }
      }

      if (lang === 'aramaic' && origWordLang !== 'aramaic') {
        setField('orig_word_lang', origWordLang, 'aramaic', 'wm_orig_word_lang');
      }

      if (isSyntactic) {
        // Only normalize syntactic metadata if it has no strongsId, no components, and no unconsumed source tokens are masked
        if (!strongsId && actualComponents.length === 0 && unconsumedSourceCount === 0) {
          const expLoc = `AR_SYNTACTIC:B${b}.C${ch}.V${vs}.w${arPos}`;
          setField('morph_pos', morphPos, 'syntactic_ar', 'wm_morph_pos');
          setField('verified_locator', locator, expLoc, 'wm_verified_locator');
          setField('morph_source', morphSource, 'syntactic_ar', 'wm_morph_source');
          setField('verified_source', verifiedSource, 'syntactic_ar', 'wm_verified_source');
          if (origWord && origWord !== '—') setField('orig_word', origWord, '—', 'wm_orig_word');
          if (origSurface && origSurface !== '—') setField('orig_surface', origSurface, '—', 'wm_orig_surface');
        }
      } else {
        // Non-syntactic record: verify primary link at origPos FIRST!
        if (!strongsId || !origPos || origPos <= 0) continue;

        // If another record in the same verse claims the same origPos without documented compound_phrase, skip (Category B collision)
        if ((primaryLocatorClaimCounts.get(origPos) || 0) > 1 && relationType !== 'compound_phrase') {
          continue;
        }

        if (lang === 'greek') {
          const tokens = isTr ? trTokens : sblTokens;
          if (!tokens) continue;
          const tok = tokens.find(t => t.index === origPos);
          if (!tok) continue; // Out of bounds -> Category B

          const lexVerified = isTr
            ? (tok.strongsId && strongsId === tok.strongsId)
            : (tok.lemma && greekStrongsMatchesLemma(strongsId, tok.lemma));

          if (!lexVerified) continue; // Displaced/wrong link -> Category B (DO NOT touch morphology!)

          // Link at origPos is 100% lexically verified against Greek source token!
          const expLoc = `${isTr ? 'TR' : 'SBLGNT'}:B${b}.C${ch}.V${vs}.w${origPos}`;
          const expSrc = isTr ? 'morphgnt_tr' : 'morphgnt_sblgnt';
          if (!locator || !locator.includes('-w')) {
            setField('verified_locator', locator, expLoc, 'wm_verified_locator');
          }
          setField('morph_source', morphSource, expSrc, 'wm_morph_source');

          if (isTr) {
            if (!origSurface || normGreekWord(origSurface) !== normGreekWord(tok.surface)) {
              setField('orig_surface', origSurface, tok.surface, 'wm_orig_surface');
            }
            if (tok.lemma && (!origWord || normGreekPolytonicFold(origWord) !== normGreekPolytonicFold(tok.lemma))) {
              setField('orig_word', origWord, tok.lemma, 'wm_orig_word');
            }
            if (tok.grammar && origMorph !== tok.grammar) {
              setField('orig_morphology', origMorph, tok.grammar, 'wm_orig_morphology');
            }
            const derived = deriveCanonicalMorphFields('greek', tok.grammar || origMorph, true, morphPos);
            if (derived) {
              setField('morph_pos', morphPos, derived.morphPos, 'wm_morph_pos');
              setField('morph_stem', morphStem, derived.morphStem, 'wm_morph_stem');
              setField('morph_tense', morphTense, derived.morphTense, 'wm_morph_tense');
              setField('morph_voice', morphVoice, derived.morphVoice, 'wm_morph_voice');
              setField('morph_mood', morphMood, derived.morphMood, 'wm_morph_mood');
              setField('morph_person', morphPerson, derived.morphPerson, 'wm_morph_person');
              setField('morph_number', morphNumber, derived.morphNumber, 'wm_morph_number');
              setField('morph_gender', morphGender, derived.morphGender, 'wm_morph_gender');
              setField('morph_case', morphCase, derived.morphCase, 'wm_morph_case');
            }
          } else {
            const dbGr = normGreekWord(origSurface);
            if (!origSurface || ![tok.surfacePunct, tok.surfaceClean, tok.surfaceNorm].map(normGreekWord).includes(dbGr)) {
              setField('orig_surface', origSurface, tok.surfaceClean, 'wm_orig_surface');
            }
            if (tok.lemma && origWord !== tok.lemma) {
              setField('orig_word', origWord, tok.lemma, 'wm_orig_word');
            }
            if (tok.morph && origMorph !== tok.morph) {
              setField('orig_morphology', origMorph, tok.morph, 'wm_orig_morphology');
            }
            const derived = deriveCanonicalMorphFields('greek', tok.morph || origMorph, false, morphPos);
            if (derived) {
              setField('morph_pos', morphPos, derived.morphPos, 'wm_morph_pos');
              setField('morph_stem', morphStem, derived.morphStem, 'wm_morph_stem');
              setField('morph_tense', morphTense, derived.morphTense, 'wm_morph_tense');
              setField('morph_voice', morphVoice, derived.morphVoice, 'wm_morph_voice');
              setField('morph_mood', morphMood, derived.morphMood, 'wm_morph_mood');
              setField('morph_person', morphPerson, derived.morphPerson, 'wm_morph_person');
              setField('morph_number', morphNumber, derived.morphNumber, 'wm_morph_number');
              setField('morph_gender', morphGender, derived.morphGender, 'wm_morph_gender');
              setField('morph_case', morphCase, derived.morphCase, 'wm_morph_case');
            }
          }

          // Synchronize primary word_mapping_strongs row for verified Greek token
          const expSurf = isTr ? tok.surface : tok.surfaceClean;
          const expMorph = isTr ? tok.grammar : tok.morph;
          if (actualComponents.length === 0) {
            sqlStatements.push(`INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source) VALUES (${sqlVal(mId)}, ${sqlVal(strongsId)}, 'primary', 1, ${origPos}, ${sqlVal(expSurf)}, ${sqlVal(expMorph)}, ${sqlVal(expSrc)});`);
            fieldDiffCounts.wms_inserted_primary++;
          } else {
            for (const comp of actualComponents) {
              if (comp.role === 'primary' && comp.strongsId === strongsId) {
                if (comp.pos !== origPos || comp.surface !== expSurf || comp.morph !== expMorph || comp.source !== expSrc) {
                  sqlStatements.push(`UPDATE word_mapping_strongs SET orig_word_position = ${origPos}, orig_component = ${sqlVal(expSurf)}, orig_morphology = ${sqlVal(expMorph)}, morph_source = ${sqlVal(expSrc)} WHERE rowid = ${comp.wmsId};`);
                  fieldDiffCounts.wms_updated_fields++;
                }
              }
            }
          }
        } else {
          // Hebrew / Aramaic OSHB
          if (!oshbTokens) continue;
          const tok = oshbTokens.byIndex ? oshbTokens.byIndex.get(origPos) : oshbTokens.find(t => t.index === origPos);
          if (!tok) continue; // Out of bounds -> Category B

          const effMorph = (origMorph && morphMatches(origMorph, tok.morph)) ? origMorph : tok.morph;
          const lexVerified = Boolean(tok.lemma && verifyHebrewStrongsAgainstLemma(strongsId, tok.lemma, effMorph));
          if (!lexVerified) continue; // Displaced/wrong link -> Category B (DO NOT touch morphology!)

          // Link at origPos is 100% lexically verified against OSHB token!
          const [bhsC, bhsV] = getBhsChapterVerse(b, ch, vs);
          const expLoc = `OSHB:B${b}.C${bhsC}.V${bhsV}.w${origPos}`;
          if (!locator || !locator.includes('-w')) {
            setField('verified_locator', locator, expLoc, 'wm_verified_locator');
          }
          setField('morph_source', morphSource, 'oshb_wlc', 'wm_morph_source');

          // Surface check
          const dbC = canonHebSurface(origSurface);
          const rawParts = tok.rawParts || [tok.text];
          const surfOk = origSurface && (
            dbC === canonHebSurface(tok.text) ||
            rawParts.map(canonHebSurface).includes(dbC) ||
            canonHebSurface(rawParts.slice(1).join('')) === dbC
          );
          if (!surfOk) {
            setField('orig_surface', origSurface, tok.text, 'wm_orig_surface');
          }

          // Lexicon lemma check on orig_word
          if (!['H9002','H9003','H9004','H9005','H9009'].includes(strongsId)) {
            const lex = strongsHebrewMap.get(strongsId);
            if (lex) {
              const wCons = stripHebrewDiacritics(origWord);
              const lCons = stripHebrewDiacritics(lex);
              const auth = AUTHORIZED_HEBREW_LEMMA_VARIANTS[strongsId];
              const isAuth = auth && (auth.includes(origWord) || auth.some(v => stripHebrewDiacritics(v) === wCons));
              if (!origWord || (origWord !== lex && wCons !== lCons && !isAuth)) {
                setField('orig_word', origWord, lex, 'wm_orig_word');
              }
            }
          }

          // Preserve valid prefix sub-morph if already matching (e.g. HR for H9003 prefix row), else sync to tok.morph
          const isPrefixOnlyRow = ['H9002','H9003','H9004','H9005','H9009'].includes(strongsId);
          let targetMorph = origMorph;
          if (!origMorph || !morphMatches(origMorph, tok.morph)) {
            if (isPrefixOnlyRow) {
              const pfx = lang === 'aramaic' ? 'A' : 'H';
              if (strongsId === 'H9002') targetMorph = `${pfx}C`;
              else if (strongsId === 'H9009') targetMorph = `${pfx}Td`;
              else targetMorph = `${pfx}R`;
            } else {
              targetMorph = tok.morph;
            }
            setField('orig_morphology', origMorph, targetMorph, 'wm_orig_morphology');
          }

          const derived = deriveCanonicalMorphFields(lang, targetMorph, false, morphPos);
          if (derived) {
            setField('morph_pos', morphPos, derived.morphPos, 'wm_morph_pos');
            setField('morph_stem', morphStem, derived.morphStem, 'wm_morph_stem');
            setField('morph_tense', morphTense, derived.morphTense, 'wm_morph_tense');
            setField('morph_voice', morphVoice, derived.morphVoice, 'wm_morph_voice');
            setField('morph_mood', morphMood, derived.morphMood, 'wm_morph_mood');
            setField('morph_person', morphPerson, derived.morphPerson, 'wm_morph_person');
            setField('morph_number', morphNumber, derived.morphNumber, 'wm_morph_number');
            setField('morph_gender', morphGender, derived.morphGender, 'wm_morph_gender');
            setField('morph_case', morphCase, derived.morphCase, 'wm_morph_case');
          }

          // Synchronize primary word_mapping_strongs row for verified OSHB token
          const expSurf = (updates.orig_surface !== undefined ? updates.orig_surface : origSurface) || tok.text;
          if (actualComponents.length === 0) {
            sqlStatements.push(`INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source) VALUES (${sqlVal(mId)}, ${sqlVal(strongsId)}, 'primary', 1, ${origPos}, ${sqlVal(tok.text)}, ${sqlVal(targetMorph)}, 'oshb_wlc');`);
            fieldDiffCounts.wms_inserted_primary++;
          } else {
            for (const comp of actualComponents) {
              if (comp.role === 'primary' && comp.strongsId === strongsId) {
                const cC = canonHebSurface(comp.surface);
                const cParts = (tok.rawParts || [tok.text]).map(canonHebSurface);
                const compSurfOk = comp.surface && (cC === canonHebSurface(tok.text) || cParts.includes(cC));
                const newCompSurf = compSurfOk ? comp.surface : tok.text;
                const compMorphOk = comp.morph && morphMatches(comp.morph, tok.morph);
                const newCompMorph = compMorphOk ? comp.morph : targetMorph;
                if (comp.pos !== origPos || comp.surface !== newCompSurf || comp.morph !== newCompMorph || comp.source !== 'oshb_wlc') {
                  sqlStatements.push(`UPDATE word_mapping_strongs SET orig_word_position = ${origPos}, orig_component = ${sqlVal(newCompSurf)}, orig_morphology = ${sqlVal(newCompMorph)}, morph_source = 'oshb_wlc' WHERE rowid = ${comp.wmsId};`);
                  fieldDiffCounts.wms_updated_fields++;
                }
              } else if (comp.role === 'secondary' && ['H9002','H9003','H9004','H9005','H9009','H4480','H4481'].includes(comp.strongsId) && (!comp.pos || comp.pos === origPos)) {
                // Inseparable prefix component attached to this same OSHB token
                const pfx = lang === 'aramaic' ? 'A' : 'H';
                const expPfxMorph = comp.strongsId === 'H9002' ? `${pfx}C` : (comp.strongsId === 'H9009' ? `${pfx}Td` : `${pfx}R`);
                const rawP = tok.rawParts || [tok.text];
                const expPfxSurf = rawP.length > 1 ? rawP[0] : tok.text;
                const cC = canonHebSurface(comp.surface);
                const cParts = rawP.map(canonHebSurface);
                const compSurfOk = comp.surface && (cC === canonHebSurface(tok.text) || cParts.includes(cC));
                const newCompSurf = compSurfOk ? comp.surface : expPfxSurf;
                const compMorphOk = comp.morph && morphMatches(comp.morph, tok.morph);
                const newCompMorph = compMorphOk ? comp.morph : expPfxMorph;
                if (comp.pos !== origPos || comp.surface !== newCompSurf || comp.morph !== newCompMorph || comp.source !== 'oshb_wlc') {
                  sqlStatements.push(`UPDATE word_mapping_strongs SET orig_word_position = ${origPos}, orig_component = ${sqlVal(newCompSurf)}, orig_morphology = ${sqlVal(newCompMorph)}, morph_source = 'oshb_wlc' WHERE rowid = ${comp.wmsId};`);
                  fieldDiffCounts.wms_updated_fields++;
                }
              }
            }
          }
        }
      }

      const updateCols = Object.keys(updates);
      if (updateCols.length > 0) {
        totalModifiedMappings++;
        const setClause = updateCols.map(c => `${c} = ${sqlVal(updates[c])}`).join(', ');
        sqlStatements.push(`UPDATE word_mappings SET ${setClause} WHERE id = ${sqlVal(mId)};`);
        if (sampleDiffs.length < 40) {
          sampleDiffs.push({
            ref: `${bkName} ${ch}:${vs} #${arPos}`,
            mappingId: mId,
            arWord,
            strongsId,
            before: beforeSnap,
            after: updates
          });
        }
      }
    }
  }
}

sqlStatements.push('COMMIT;');
const sqlFilePath = path.join(repoRoot, 'scratch/apply_trial_deterministic_repairs.sql');
fs.writeFileSync(sqlFilePath, sqlStatements.join('\n') + '\n', 'utf8');
console.log(`Generated ${sqlStatements.length - 2} SQL statements across ${totalModifiedMappings} word_mappings. Executing on trial DB...`);

execFileSync(sqlitePath, [trialDbPath], { input: `.read ${sqlFilePath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const prodShaAfter = sha256File(prodDbPath);
const trialShaAfter = sha256File(trialDbPath);
if (prodShaAfter !== EXPECTED_PROD_DB_SHA256) {
  throw new Error(`CRITICAL: Production DB hash changed! ${prodShaAfter}`);
}

console.log(`Trial DB updated cleanly. Trial DB SHA-256: ${trialShaAfter}`);
console.log(`Production DB SHA-256 verified untouched  : ${prodShaAfter}`);
console.log('Field-by-field modification counts:', JSON.stringify(fieldDiffCounts, null, 2));

const diffReport = {
  productionDbSha256_before: prodShaBefore,
  productionDbSha256_after: prodShaAfter,
  productionDbUntouched: prodShaBefore === prodShaAfter,
  trialDbPath: 'scratch/bible_study_trial_rule_repaired.db',
  trialDbSha256: trialShaAfter,
  totalModifiedWordMappings: totalModifiedMappings,
  totalSqlStatementsExecuted: sqlStatements.length - 2,
  fieldDiffCounts,
  sampleFieldByFieldDiffs: sampleDiffs
};

const diffJsonPath = path.join(__dirname, 'trial_deterministic_repairs_diff_report_v379.json');
fs.writeFileSync(diffJsonPath, JSON.stringify(diffReport, null, 2) + '\n', 'utf8');
console.log(`Saved trial diff report to: ${diffJsonPath}`);
