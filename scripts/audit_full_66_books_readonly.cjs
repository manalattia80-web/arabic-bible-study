/**
 * audit_full_66_books_readonly.cjs
 * Executes a full read-only scan across all 66 books (31,102 verses, 434,351 word_mappings)
 * and produces a comprehensive preview report categorizing:
 *   - Category A (Verified Source Link + Deterministically Repairable):
 *       1. Derived morphology fields (morph_pos, morph_stem, morph_tense, morph_voice,
 *          morph_mood, morph_person, morph_number, morph_gender, morph_case state)
 *          on records whose primary source link at wN is lexically verified.
 *       2. Mandatory morph_case ('determined', 'construct', 'absolute') on Hebrew/Aramaic
 *          nouns, adjectives, and participles with verified link.
 *       3. Pronominal suffix person/gender/number on prepositions (HR/Sp..., AR/Sp...).
 *       4. Language badge normalization (orig_word_lang = 'aramaic' on the 269 Biblical
 *          Aramaic verses andverses.text_original_lang = 'aramaic').
 *       5. Inseparable prefix components (H9002, H9003, H9004, H9005, H9009) and
 *          word_mapping_strongs mandatory component fields (orig_component, orig_morphology,
 *          morph_source, link_role, link_order, orig_word_position) on verified primary tokens.
 *       6. orig_word / orig_surface diacritic & script normalization where the source link
 *          and Strong's ID are verified against the source token.
 *       7. AR_SYNTACTIC metadata consistency (morph_pos='syntactic_ar',
 *          verified_source='syntactic_ar', morph_source='syntactic_ar', canonical locator)
 *          ONLY in verses where no source tokens are masked.
 *   - Category B (Unverified / Displaced Link or Ambiguous Alignment — Requires Contextual Proposal):
 *       1. Lexical mismatch at wN (Strong's ID disagrees with source token at wN — e.g.
 *          sequential offset drift, wrong Strong's number, or word-order inversion).
 *       2. Out-of-bounds locator (wN > source token count) or malformed/missing locator.
 *       3. Duplicate primary locator collision (two Arabic records claiming the same wN
 *          without a documented compound_phrase shared link).
 *       4. False AR_SYNTACTIC masking unconsumed source tokens in the verse.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { verifyTrDerivedMorphology } = require('./robinson_tr_helper.cjs');
const { validateCanonicalLocator } = require('./locator_validator_helper.cjs');
const {
  OT_BOOK_MAP,
  SBLGNT_BOOK_MAP,
  TR_BOOK_OSIS_MAP,
  OSHB_HEBREW_VERB_STEMS,
  OSHB_ARAMAIC_VERB_STEMS,
  OSHB_HEBREW_PASSIVE_STEMS,
  OSHB_ARAMAIC_PASSIVE_STEMS,
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
const dbPath = process.env.AUDIT_DB_PATH || path.join(repoRoot, 'mobile/assets/bible_study.db');

function query(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8', maxBuffer: 350 * 1024 * 1024 }).replace(/\r/g, '').trim();
}

function queryToFile(sql, tmpFilePath) {
  const cmd = `.output ${tmpFilePath.replace(/\\/g, '/')}\n${sql}\n.quit\n`;
  execFileSync(sqlitePath, [dbPath], { input: cmd, encoding: 'utf8' });
  return fs.readFileSync(tmpFilePath, 'utf8').replace(/\r/g, '').trim();
}

function verifyDerived(lang, dbMorph, srcMorph, d, isTr = false) {
  const normPerson = p => ({ first: '1', second: '2', third: '3' }[p] || p || null);
  if (lang === 'greek') {
    if (isTr) {
      return verifyTrDerivedMorphology(dbMorph, srcMorph, d);
    }
    const m = (srcMorph || '').trim();
    if (m.length < 11) return null;
    const tag = m.slice(3, 11);
    const posCode = m.slice(0, 2).trim();
    const [pCh, tCh, vCh, mCh, cCh, nCh, gCh] = tag.split('');
    const pMap = { '1':'1', '2':'2', '3':'3', '-':null };
    const tMap = { P:'present', I:'imperfect', F:'future', A:'aorist', X:'perfect', Y:'pluperfect', '-':null };
    const vMap = { A:'active', M:'middle', P:'passive', '-':null };
    const mMap = { I:'indicative', D:'imperative', S:'subjunctive', O:'optative', N:'infinitive', P:'participle', '-':null };
    const cMap = { N:'nominative', G:'genitive', D:'dative', A:'accusative', V:'vocative', '-':null };
    const nMap = { S:'singular', P:'plural', '-':null };
    const gMap = { M:'masculine', F:'feminine', N:'neuter', '-':null };
    const posMap = { 'V-':['verb'],'N-':['noun'],'A-':['adjective'],'C-':['conjunction'],'D-':['adverb'],'P-':['preposition'],'X-':['particle'],'I-':['interjection'],'RA':['article','pronoun'],'RD':['demonstrative','pronoun'],'RI':['interrogative_pronoun','pronoun'],'RP':['personal_pronoun','pronoun'],'RR':['relative_pronoun','pronoun'] };
    if (posMap[posCode] && !posMap[posCode].includes(d.morphPos)) return `pos '${d.morphPos}' vs '${posCode}'`;
    if (normPerson(d.morphPerson) !== pMap[pCh]) return `person '${d.morphPerson}' vs '${pMap[pCh]}'`;
    if ((d.morphTense || null) !== tMap[tCh]) return `tense '${d.morphTense}' vs '${tMap[tCh]}'`;
    if ((d.morphVoice || null) !== vMap[vCh]) return `voice '${d.morphVoice}' vs '${vMap[vCh]}'`;
    if ((d.morphMood || null) !== mMap[mCh]) return `mood '${d.morphMood}' vs '${mMap[mCh]}'`;
    if ((d.morphCase || null) !== cMap[cCh]) return `case '${d.morphCase}' vs '${cMap[cCh]}'`;
    if ((d.morphNumber || null) !== nMap[nCh]) return `number '${d.morphNumber}' vs '${nMap[nCh]}'`;
    if ((d.morphGender || null) !== gMap[gCh]) return `gender '${d.morphGender}' vs '${gMap[gCh]}'`;
    return null;
  }
  const tag = (dbMorph || srcMorph || '').trim();
  if (!tag || /^(HR|AR|HC|AC|HT|AT|R|C)$/.test(tag)) return null;
  const segs = tag.split('/');
  const isAr = tag.startsWith('A') || lang === 'aramaic';
  const gMap = { m:'masculine', f:'feminine', b:'common', c:'common' };
  const nMap = { s:'singular', p:'plural', d:'dual' };
  const pMap = { '1':'1', '2':'2', '3':'3' };
  const sMap = { c:'construct', a:'absolute', d:'determined' };

  if (segs.length >= 2 && /^(HR|AR|R)$/.test(segs[segs.length - 2]) && /^Sp/.test(segs[segs.length - 1]) && (segs.length === 2 || /^(HC|AC|C)$/.test(segs[0]))) {
    const spTag = segs[segs.length - 1];
    const expPerson = pMap[spTag[2]] || null;
    const expGender = gMap[spTag[3]] || null;
    const expNumber = nMap[spTag[4]] || null;
    if (d.morphPos && d.morphPos !== 'preposition' && d.morphPos !== 'prep') return `pos '${d.morphPos}' vs preposition`;
    if (expPerson && normPerson(d.morphPerson) !== expPerson) return `person '${d.morphPerson}' vs '${expPerson}'`;
    if (expGender && (d.morphGender || null) !== expGender) return `gender '${d.morphGender}' vs '${expGender}'`;
    if (expNumber && (d.morphNumber || null) !== expNumber) return `number '${d.morphNumber}' vs '${expNumber}'`;
    return null;
  }
  const coreSeg = (segs.length >= 2 && /^Sp/.test(segs[segs.length - 1])) ? segs[segs.length - 2] : segs[segs.length - 1];
  const core = coreSeg.replace(/^[HA](?=[A-Z])/, '');
  if (core[0] === 'V') {
    if (d.morphPos !== 'verb') return `pos '${d.morphPos}' vs verb '${tag}'`;
    const stemMap = isAr ? OSHB_ARAMAIC_VERB_STEMS : OSHB_HEBREW_VERB_STEMS;
    if (stemMap[core[1]] && (d.morphStem || null) !== stemMap[core[1]]) return `stem '${d.morphStem}' vs '${stemMap[core[1]]}'`;
    const conj = core[2];
    const isPassive = ((isAr ? OSHB_ARAMAIC_PASSIVE_STEMS : OSHB_HEBREW_PASSIVE_STEMS).has(core[1]) || conj === 's');
    if (isPassive && (d.morphVoice || null) !== 'passive') return `voice '${d.morphVoice}' vs 'passive'`;
    if (!isPassive && d.morphVoice === 'passive') return `voice 'passive' unexpected on active stem '${tag}'`;
    const tenseMap = { p:'qatal', q:'weqatal', i:'yiqtol', w:'wayyiqtol', j:'yiqtol', h:'yiqtol' };
    if ((d.morphTense || null) !== (tenseMap[conj] || null)) return `tense '${d.morphTense}' vs '${tenseMap[conj] || null}'`;
    const moodMap = { p:'indicative', q:'indicative', i:'indicative', w:'indicative', v:'imperative', j:'jussive', h:'cohortative', r:'participle', s:'passive_participle', c:'infinitive_construct', a:'infinitive_absolute' };
    if (moodMap[conj] && (d.morphMood || null) !== moodMap[conj]) return `mood '${d.morphMood}' vs '${moodMap[conj]}'`;
    if ('pqiwjhv'.includes(conj)) {
      if (normPerson(d.morphPerson) !== (['1','2','3'].includes(core[3]) ? core[3] : null)) return `person '${d.morphPerson}' vs '${core[3]}'`;
      if ((d.morphGender || null) !== (gMap[core[4]] || null)) return `gender '${d.morphGender}' vs '${core[4]}'`;
      if ((d.morphNumber || null) !== (nMap[core[5]] || null)) return `number '${d.morphNumber}' vs '${core[5]}'`;
    } else if (conj === 'r' || conj === 's') {
      if ((d.morphGender || null) !== (gMap[core[3]] || null)) return `gender '${d.morphGender}' vs '${core[3]}'`;
      if ((d.morphNumber || null) !== (nMap[core[4]] || null)) return `number '${d.morphNumber}' vs '${core[4]}'`;
      const expState = sMap[core[5]] || null;
      if (expState && (d.morphCase || null) !== expState) return `case '${d.morphCase || ''}' vs '${expState}'`;
    }
  } else if ((core[0] === 'N' || core[0] === 'A') && core[1] !== 'p' && core !== 'Td') {
    if ((d.morphGender || null) !== (gMap[core[2]] || null)) return `gender '${d.morphGender}' vs '${core[2]}'`;
    if ((d.morphNumber || null) !== (nMap[core[3]] || null)) return `number '${d.morphNumber}' vs '${core[3]}'`;
    const expState = sMap[core[4]] || null;
    if (expState && (d.morphCase || null) !== expState) return `case '${d.morphCase || ''}' vs '${expState}'`;
  }
  return null;
}

console.log('Loading all 66 books (39 OSHB WLC XML + 27 SBLGNT MorphGNT + 27 Scrivener TR)...');
const t0 = Date.now();
const { oshbByBook, sblByBook, trByOsis } = loadAllSources();
const dbSha256 = sha256File(dbPath);
console.log(`Loaded 66-book sources in ${((Date.now() - t0)/1000).toFixed(2)}s. DB SHA-256: ${dbSha256}`);

// Preload word_mapping_strongs grouped by mapping_id
console.log('Loading word_mapping_strongs table...');
const wmsByMappingId = new Map();
const tmpWmsFile = path.join(repoRoot, 'scratch/tmp_wms_dump.txt');
fs.mkdirSync(path.dirname(tmpWmsFile), { recursive: true });
const wmsRaw = queryToFile(`
  SELECT mapping_id, strongs_id, COALESCE(link_role,''), COALESCE(link_order,''),
         COALESCE(orig_word_position,''), COALESCE(orig_component,''),
         COALESCE(orig_morphology,''), COALESCE(morph_source,'')
  FROM word_mapping_strongs
  ORDER BY mapping_id, link_order ASC;
`, tmpWmsFile);
try { fs.unlinkSync(tmpWmsFile); } catch (_) {}
for (const line of wmsRaw.split('\n')) {
  if (!line) continue;
  const [mId, sId, role, orderStr, posStr, surf, morph, src] = line.split('|');
  if (!wmsByMappingId.has(mId)) wmsByMappingId.set(mId, []);
  wmsByMappingId.get(mId).push({
    strongsId: sId,
    role,
    order: orderStr ? parseInt(orderStr, 10) : null,
    pos: posStr ? parseInt(posStr, 10) : null,
    surface: surf || '',
    morph: morph || '',
    source: src || ''
  });
}
console.log(`Loaded word_mapping_strongs for ${wmsByMappingId.size} mappings.`);

const globalStats = {
  totalVerses: 0,
  fullyCleanVerses: 0,
  totalRecords: 0,
  cleanRecords: 0,
  alertedRecords: 0,
  axes: {
    lexical:       { pass: 0, fail: 0, undecided: 0 },
    lemmaSurface:  { pass: 0, fail: 0, undecided: 0 },
    morphology:    { pass: 0, fail: 0, undecided: 0 },
    sourceLocator: { pass: 0, fail: 0, undecided: 0 }
  },
  byLanguage: {
    hebrew:  { verses: 0, cleanVerses: 0, total: 0, clean: 0, alerts: 0, catA: 0, catB: 0, axes: { lexical:0, lemmaSurface:0, morphology:0, sourceLocator:0 } },
    aramaic: { verses: 0, cleanVerses: 0, total: 0, clean: 0, alerts: 0, catA: 0, catB: 0, axes: { lexical:0, lemmaSurface:0, morphology:0, sourceLocator:0 } },
    greek:   { verses: 0, cleanVerses: 0, total: 0, clean: 0, alerts: 0, catA: 0, catB: 0, axes: { lexical:0, lemmaSurface:0, morphology:0, sourceLocator:0 } }
  },
  categories: {
    alreadyClean: 0,
    categoryA_deterministicRepairable: 0,
    categoryB_contextualAlignmentRequired: 0
  },
  defectTaxonomy: {
    // Category A (Link verified at wN, deterministically repairable)
    catA_derivedMorphMismatch: 0,
    catA_missingOrWrongMorphCaseState: 0,
    catA_rawMorphPrefixVariant: 0,
    catA_surfaceOrLemmaNormalization: 0,
    catA_wmsMandatoryFieldsOrSync: 0,
    catA_locatorCanonicalFormatOrVersification: 0,
    catA_syntacticMetadataConsistency: 0,
    catA_aramaicLanguageBadgeMismatch: 0,
    // Category B (Link unverified/displaced/ambiguous — must NOT re-derive morphology before fixing link)
    catB_lexicalMismatchAtLocator: 0,
    catB_locatorOutOfBoundsOrMissing: 0,
    catB_duplicatePrimaryTokenCollision: 0,
    catB_falseSyntacticMaskingSourceTokens: 0,
    catB_secondaryComponentDisplacedOrInvalid: 0
  },
  samples: {
    catA_derivedMorphMismatch: [],
    catA_missingOrWrongMorphCaseState: [],
    catA_surfaceOrLemmaNormalization: [],
    catA_wmsMandatoryFieldsOrSync: [],
    catA_locatorCanonicalFormatOrVersification: [],
    catA_aramaicLanguageBadgeMismatch: [],
    catB_lexicalMismatchAtLocator: [],
    catB_locatorOutOfBoundsOrMissing: [],
    catB_duplicatePrimaryTokenCollision: [],
    catB_falseSyntacticMaskingSourceTokens: []
  },
  byBook: []
};

function addSample(bucket, item) {
  if (globalStats.samples[bucket] && globalStats.samples[bucket].length < 15) {
    globalStats.samples[bucket].push(item);
  }
}

// Process all 66 books via a single bulk SQLite query written to a temp file
console.log('Querying all 434,351 word_mappings across all 66 books...');
const tmpWmFile = path.join(repoRoot, 'scratch/tmp_wm_dump.txt');
const allRowsRaw = queryToFile(`
  SELECT vr.book_id, vr.chapter_num, vr.verse_num, wm.id, wm.ar_word_position, wm.ar_word,
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
`, tmpWmFile);
try { fs.unlinkSync(tmpWmFile); } catch (_) {}
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
console.log('Grouped all 434,351 rows by book and verse. Running 4-axis audit...');

for (let b = 1; b <= 66; b++) {
  const bkName = b <= 39 ? OT_BOOK_MAP[b] : TR_BOOK_OSIS_MAP[b];
  const versesMap = rowsByBook[b];

  let bkVerses = 0, bkCleanVerses = 0, bkTotal = 0, bkClean = 0, bkAlerts = 0, bkCatA = 0, bkCatB = 0;

  for (const [cvKey, vRows] of versesMap.entries()) {
    const [ch, vs] = cvKey.split(':').map(Number);
    const lang = b >= 40 ? 'greek' : (isBiblicalAramaicVerse(b, ch, vs) ? 'aramaic' : 'hebrew');
    globalStats.totalVerses++;
    globalStats.byLanguage[lang].verses++;
    bkVerses++;

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

    // First pass over verse rows: identify which source tokens are consumed by lexically valid links
    const consumedSourcePositions = new Set();
    for (const parts of vRows) {
      const mId = parts[2];
      const strongsId = parts[5];
      const origMorph = parts[10];
      const origPos = parts[16] ? parseInt(parts[16], 10) : null;
      const locator = parts[17];
      const morphSource = parts[21];
      const isTr = lang === 'greek' && ((locator && locator.startsWith('TR:')) || morphSource === 'morphgnt_tr' || !sblTokens);
      if (origPos && origPos > 0) {
        consumedSourcePositions.add(origPos);
      }
      const wmsList = wmsByMappingId.get(mId) || [];
      for (const c of wmsList) {
        if (c.pos && c.pos > 0) consumedSourcePositions.add(c.pos);
      }
    }

    const defaultSrcTokens = lang === 'greek' ? (sblTokens || trTokens || []) : (oshbTokens || []);
    const unconsumedSourceCount = defaultSrcTokens.filter(t => !consumedSourcePositions.has(t.index)).length;

    const seenPrimaryLocators = new Map();
    let vAlertCount = 0;

    for (const parts of vRows) {
      const [
        , , mId, posStr, arWord, strongsId, origWord, origSurface, origWordLang,
        morphPos, origMorph, morphGender, morphNumber, morphPerson, morphStem, morphMood,
        origPosStr, locator, morphTense, morphVoice, morphCase, morphSource, relationType,
        grammarNotes, verifiedSource
      ] = parts;

      const arPos = parseInt(posStr, 10);
      const origPos = origPosStr ? parseInt(origPosStr, 10) : null;
      const isSyntactic = morphPos === 'syntactic_ar' || (locator && locator.startsWith('AR_SYNTACTIC'));
      const isTr = lang === 'greek' && ((locator && locator.startsWith('TR:')) || morphSource === 'morphgnt_tr' || !sblTokens);

      const ax = {
        lexical:       { status: 'pass', notes: [] },
        lemmaSurface:  { status: 'pass', notes: [] },
        morphology:    { status: 'pass', notes: [] },
        sourceLocator: { status: 'pass', notes: [] }
      };
      const failAxis = (k, msg) => { ax[k].status = 'fail'; ax[k].notes.push(msg); };
      const undecidedAxis = (k, msg) => {
        if (ax[k].status === 'pass') ax[k].status = 'undecided';
        ax[k].notes.push(msg);
      };

      const tokCount = lang === 'greek'
        ? ((isTr ? trTokens : sblTokens) ? (isTr ? trTokens : sblTokens).length : 0)
        : (oshbTokens ? oshbTokens.length : 0);

      const locRes = validateCanonicalLocator({
        locator,
        isSyntactic,
        lang,
        book: b,
        ch,
        vs,
        oshbOsis,
        arPos,
        origPos,
        morphSource,
        tokenCount: tokCount
      });

      const actualComponents = wmsByMappingId.get(mId) || [];

      // Flags to distinguish Category A (deterministic repairable) vs Category B (displaced/ambiguous link)
      let primaryLinkVerified = false;
      let hasCategoryBBlocker = false;
      const recordDefects = new Set();

      if (lang === 'aramaic' && origWordLang !== 'aramaic') {
        recordDefects.add('catA_aramaicLanguageBadgeMismatch');
      }

      if (isSyntactic) {
        if (!locRes.ok) {
          failAxis('sourceLocator', locRes.error);
          recordDefects.add('catA_syntacticMetadataConsistency');
        }
        if (strongsId) {
          failAxis('lexical', `syntactic row has strongs_id='${strongsId}'`);
          hasCategoryBBlocker = true;
        }
        if (actualComponents.length > 0) {
          failAxis('lexical', `syntactic row has word_mapping_strongs`);
          hasCategoryBBlocker = true;
        }
        if (origWord && origWord !== '—') {
          failAxis('lemmaSurface', `syntactic row has orig_word='${origWord}'`);
          recordDefects.add('catA_syntacticMetadataConsistency');
        }
        if (origSurface && origSurface !== '—') {
          failAxis('lemmaSurface', `syntactic row has orig_surface='${origSurface}'`);
          recordDefects.add('catA_syntacticMetadataConsistency');
        }
        if (relationType === 'syntactic_copula' && (!grammarNotes || grammarNotes.trim().length === 0)) {
          failAxis('morphology', 'syntactic_copula row requires explanatory grammar_notes');
          recordDefects.add('catA_syntacticMetadataConsistency');
        }
        if (morphPos && morphPos !== 'syntactic_ar') {
          failAxis('morphology', `AR_SYNTACTIC carries morph_pos='${morphPos}'`);
          recordDefects.add('catA_syntacticMetadataConsistency');
        }
        if (verifiedSource && verifiedSource !== 'syntactic_ar') {
          failAxis('sourceLocator', `AR_SYNTACTIC carries verified_source='${verifiedSource}'`);
          recordDefects.add('catA_syntacticMetadataConsistency');
        }
        if (morphSource && morphSource !== 'syntactic_ar') {
          failAxis('sourceLocator', `AR_SYNTACTIC carries morph_source='${morphSource}'`);
          recordDefects.add('catA_syntacticMetadataConsistency');
        }
        // Check if this verse has unconsumed source tokens that might be masked by AR_SYNTACTIC
        if (unconsumedSourceCount > 0) {
          hasCategoryBBlocker = true;
          recordDefects.add('catB_falseSyntacticMaskingSourceTokens');
          addSample('catB_falseSyntacticMaskingSourceTokens', {
            ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, unconsumedSourceCount
          });
        } else {
          primaryLinkVerified = true;
        }
      } else {
        if (!strongsId) {
          failAxis('lexical', 'missing strongs_id');
          hasCategoryBBlocker = true;
          recordDefects.add('catB_lexicalMismatchAtLocator');
        }
        if (actualComponents.length === 0) {
          failAxis('lexical', 'empty word_mapping_strongs');
          recordDefects.add('catA_wmsMandatoryFieldsOrSync');
        }

        const locIdx = (origPos && origPos > 0) ? origPos : (locRes.locW || null);
        if (!locRes.ok) {
          failAxis('sourceLocator', locRes.error);
          if (!locIdx || (tokCount && locIdx > tokCount)) {
            hasCategoryBBlocker = true;
            recordDefects.add('catB_locatorOutOfBoundsOrMissing');
            addSample('catB_locatorOutOfBoundsOrMissing', {
              ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, locator, origPos, tokCount
            });
          } else {
            recordDefects.add('catA_locatorCanonicalFormatOrVersification');
          }
        }

        // Duplicate primary locator collision check
        if (locIdx && (!tokCount || locIdx <= tokCount)) {
          const edKey = `${lang === 'greek' ? (isTr ? 'TR' : 'SBLGNT') : 'OSHB'}:w${locIdx}`;
          if (seenPrimaryLocators.has(edKey)) {
            const prev = seenPrimaryLocators.get(edKey);
            const oshbTok = (lang !== 'greek' && oshbTokens) ? oshbTokens.find(t => t.index === locIdx) : null;
            const isDocumentedSharedUnit =
              relationType === 'compound_phrase' &&
              prev.relationType === 'compound_phrase' &&
              arPos > prev.arPos && arPos <= prev.arPos + 2 &&
              Boolean(grammarNotes && grammarNotes.trim().length > 0) &&
              Boolean(prev.grammarNotes && prev.grammarNotes.trim().length > 0) &&
              (
                (prev.strongsId && strongsId === prev.strongsId) ||
                (oshbTok && verifyHebrewStrongsAgainstLemma(prev.strongsId, oshbTok.lemma, prev.origMorph) && verifyHebrewStrongsAgainstLemma(strongsId, oshbTok.lemma, origMorph))
              );
            if (!isDocumentedSharedUnit) {
              failAxis('sourceLocator', `duplicate primary token collision: ${edKey} already claimed by arPos #${prev.arPos}`);
              hasCategoryBBlocker = true;
              recordDefects.add('catB_duplicatePrimaryTokenCollision');
              addSample('catB_duplicatePrimaryTokenCollision', {
                ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, edKey, prevArPos: prev.arPos
              });
            } else {
              seenPrimaryLocators.set(edKey, { arPos, strongsId, origMorph, relationType, grammarNotes });
            }
          } else {
            seenPrimaryLocators.set(edKey, { arPos, strongsId, origMorph, relationType, grammarNotes });
          }
        }

        if (lang === 'greek') {
          const tokens = isTr ? trTokens : sblTokens;
          const edition = isTr ? 'Scrivener TR' : 'SBLGNT';
          if (isTr && morphSource && morphSource !== 'morphgnt_tr') {
            failAxis('sourceLocator', `TR locator carries morph_source='${morphSource}'`);
            recordDefects.add('catA_locatorCanonicalFormatOrVersification');
          }
          if (!isTr && morphSource && morphSource !== 'morphgnt_sblgnt') {
            failAxis('sourceLocator', `SBLGNT locator carries morph_source='${morphSource}'`);
            recordDefects.add('catA_locatorCanonicalFormatOrVersification');
          }
          const tok = (locIdx && tokens && tokens.byIndex) ? tokens.byIndex.get(locIdx) : null;
          if (!tok) {
            if (locIdx && tokens) failAxis('sourceLocator', `${edition} w${locIdx} exceeds token count (${tokens.length})`);
            undecidedAxis('lexical', `undecided: source token w${locIdx || '?'} unavailable in ${edition}`);
            undecidedAxis('lemmaSurface', `undecided: source token w${locIdx || '?'} unavailable in ${edition}`);
            undecidedAxis('morphology', `undecided: source token w${locIdx || '?'} unavailable in ${edition}`);
            hasCategoryBBlocker = true;
            recordDefects.add('catB_locatorOutOfBoundsOrMissing');
          } else if (isTr) {
            const lexOk = Boolean(strongsId && tok.strongsId && strongsId === tok.strongsId);
            if (!lexOk) {
              failAxis('lexical', `TR Strong's '${strongsId}' != '${tok.strongsId}' @ w${locIdx}`);
              hasCategoryBBlocker = true;
              recordDefects.add('catB_lexicalMismatchAtLocator');
              addSample('catB_lexicalMismatchAtLocator', {
                ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, dbStrongs: strongsId, srcToken: tok.surface, srcStrongs: tok.strongsId, locIdx
              });
            } else {
              primaryLinkVerified = true;
            }
            if (!origSurface || normGreekWord(origSurface) !== normGreekWord(tok.surface)) {
              failAxis('lemmaSurface', `TR surface '${origSurface}' != '${tok.surface}' @ w${locIdx}`);
              if (primaryLinkVerified) recordDefects.add('catA_surfaceOrLemmaNormalization');
            }
            if (origWord && tok.lemma && normGreekPolytonicFold(origWord) !== normGreekPolytonicFold(tok.lemma)) {
              failAxis('lemmaSurface', `TR lemma '${origWord}' != '${tok.lemma}' @ w${locIdx}`);
              if (primaryLinkVerified) recordDefects.add('catA_surfaceOrLemmaNormalization');
            }
            const dErr = verifyDerived('greek', origMorph, tok.grammar, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase }, true);
            if (dErr) {
              failAxis('morphology', dErr);
              if (primaryLinkVerified) {
                recordDefects.add('catA_derivedMorphMismatch');
                addSample('catA_derivedMorphMismatch', { ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, origMorph, srcMorph: tok.grammar, dErr });
              }
            }
          } else {
            const lexOk = Boolean(strongsId && tok.lemma && greekStrongsMatchesLemma(strongsId, tok.lemma));
            if (!lexOk) {
              failAxis('lexical', `Strongs '${strongsId}' (${strongsGreekMap.get(strongsId) || '?'}) != SBLGNT lemma '${tok.lemma}' @ w${locIdx}`);
              hasCategoryBBlocker = true;
              recordDefects.add('catB_lexicalMismatchAtLocator');
              addSample('catB_lexicalMismatchAtLocator', {
                ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, dbStrongs: strongsId, srcLemma: tok.lemma, srcSurface: tok.surfaceClean, locIdx
              });
            } else {
              primaryLinkVerified = true;
            }
            const dbGr = normGreekWord(origSurface);
            if (!origSurface || ![tok.surfacePunct, tok.surfaceClean, tok.surfaceNorm].map(normGreekWord).includes(dbGr)) {
              failAxis('lemmaSurface', `SBLGNT surface '${origSurface}' != '${tok.surfaceClean}' @ w${locIdx}`);
              if (primaryLinkVerified) {
                recordDefects.add('catA_surfaceOrLemmaNormalization');
                addSample('catA_surfaceOrLemmaNormalization', { ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, origSurface, expected: tok.surfaceClean });
              }
            }
            if (origWord && tok.lemma && origWord !== tok.lemma) {
              failAxis('lemmaSurface', `SBLGNT lemma '${origWord}' != '${tok.lemma}' @ w${locIdx}`);
              if (primaryLinkVerified) {
                recordDefects.add('catA_surfaceOrLemmaNormalization');
                addSample('catA_surfaceOrLemmaNormalization', { ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, origWord, expected: tok.lemma });
              }
            }
            if (origMorph && tok.morph && origMorph !== tok.morph) {
              failAxis('morphology', `morph '${origMorph}' != SBLGNT '${tok.morph}'`);
              if (primaryLinkVerified) recordDefects.add('catA_rawMorphPrefixVariant');
            }
            const dErr = verifyDerived('greek', origMorph, tok.morph, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase }, false);
            if (dErr) {
              failAxis('morphology', `derived(${dErr})`);
              if (primaryLinkVerified) {
                recordDefects.add('catA_derivedMorphMismatch');
                addSample('catA_derivedMorphMismatch', { ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, origMorph, srcMorph: tok.morph, dErr });
              }
            }
          }

          // Check word_mapping_strongs for Greek
          if (actualComponents.length > 0 && tokens) {
            for (const comp of actualComponents) {
              const { strongsId: cS, role: cRole, order: cOrder, pos: cP, surface: cSurf, morph: cMorph, source: cSrc } = comp;
              if (!cSurf) { failAxis('lemmaSurface', `wms ${cS}@w${cP || '?'} missing mandatory orig_component`); recordDefects.add('catA_wmsMandatoryFieldsOrSync'); }
              if (!cMorph) { failAxis('morphology', `wms ${cS}@w${cP || '?'} missing mandatory orig_morphology`); recordDefects.add('catA_wmsMandatoryFieldsOrSync'); }
              if (!cSrc) { failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory morph_source`); recordDefects.add('catA_wmsMandatoryFieldsOrSync'); }
              if (!cRole) { failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_role`); recordDefects.add('catA_wmsMandatoryFieldsOrSync'); }
              if (!cOrder || isNaN(cOrder)) { failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_order`); recordDefects.add('catA_wmsMandatoryFieldsOrSync'); }
              if (!cP || isNaN(cP)) {
                failAxis('sourceLocator', `wms ${cS} missing mandatory orig_word_position`);
                if (cRole === 'primary' && primaryLinkVerified) recordDefects.add('catA_wmsMandatoryFieldsOrSync');
                else { hasCategoryBBlocker = true; recordDefects.add('catB_secondaryComponentDisplacedOrInvalid'); }
                continue;
              }
              if (cRole === 'primary' && locIdx && cP && cP !== locIdx) {
                failAxis('sourceLocator', `primary component pos ${cP} != mapping locator w${locIdx}`);
                recordDefects.add('catA_wmsMandatoryFieldsOrSync');
              }
              const cTok = (tokens && tokens.byIndex) ? tokens.byIndex.get(cP) : null;
              if (!cTok) {
                failAxis('sourceLocator', `wms component ${cS}@w${cP} exceeds ${edition} token count`);
                hasCategoryBBlocker = true;
                recordDefects.add('catB_secondaryComponentDisplacedOrInvalid');
              } else {
                if (!isTr && cTok.lemma && !greekStrongsMatchesLemma(cS, cTok.lemma)) {
                  failAxis('lexical', `wms ${cS}@w${cP} != SBLGNT '${cTok.lemma}'`);
                  hasCategoryBBlocker = true;
                  recordDefects.add('catB_secondaryComponentDisplacedOrInvalid');
                }
                if (isTr && cTok.strongsId && cS !== cTok.strongsId) {
                  failAxis('lexical', `wms ${cS}@w${cP} != TR '${cTok.strongsId}'`);
                  hasCategoryBBlocker = true;
                  recordDefects.add('catB_secondaryComponentDisplacedOrInvalid');
                }
                if (cSurf) {
                  const cNorm = normGreekWord(cSurf);
                  const tNorms = isTr ? [normGreekWord(cTok.surface)] : [cTok.surfacePunct, cTok.surfaceClean, cTok.surfaceNorm].map(normGreekWord);
                  if (!tNorms.includes(cNorm)) {
                    failAxis('lemmaSurface', `wms ${cS}@w${cP} surface '${cSurf}' != '${cTok.surfaceClean || cTok.surface}'`);
                    recordDefects.add('catA_wmsMandatoryFieldsOrSync');
                  }
                }
                if (cMorph) {
                  const expM = isTr ? cTok.grammar : cTok.morph;
                  if (expM && cMorph !== expM) {
                    failAxis('morphology', `wms ${cS}@w${cP} morph '${cMorph}' != '${expM}'`);
                    recordDefects.add('catA_wmsMandatoryFieldsOrSync');
                  }
                }
                if (cSrc) {
                  const expS = isTr ? 'morphgnt_tr' : 'morphgnt_sblgnt';
                  if (cSrc !== expS) {
                    failAxis('sourceLocator', `wms ${cS}@w${cP} morph_source '${cSrc}' != '${expS}'`);
                    recordDefects.add('catA_wmsMandatoryFieldsOrSync');
                  }
                }
              }
            }
          }
        } else {
          // Hebrew / Aramaic OSHB
          if (morphSource && morphSource !== 'oshb_wlc') {
            failAxis('sourceLocator', `OSHB locator carries morph_source='${morphSource}'`);
            recordDefects.add('catA_locatorCanonicalFormatOrVersification');
          }
          const tok = (locIdx && oshbTokens && oshbTokens.byIndex) ? oshbTokens.byIndex.get(locIdx) : null;
          if (!tok) {
            if (locIdx && oshbTokens) failAxis('sourceLocator', `OSHB w${locIdx} exceeds token count (${oshbTokens.length})`);
            undecidedAxis('lexical', `undecided: OSHB token w${locIdx || '?'} unavailable`);
            undecidedAxis('lemmaSurface', `undecided: OSHB token w${locIdx || '?'} unavailable`);
            undecidedAxis('morphology', `undecided: OSHB token w${locIdx || '?'} unavailable`);
            hasCategoryBBlocker = true;
            recordDefects.add('catB_locatorOutOfBoundsOrMissing');
          } else {
            const lexOk = Boolean(strongsId && tok.lemma && verifyHebrewStrongsAgainstLemma(strongsId, tok.lemma, origMorph || tok.morph));
            if (!lexOk) {
              failAxis('lexical', `Strongs '${strongsId}' != OSHB lemma '${tok.lemma}' @ w${locIdx}`);
              hasCategoryBBlocker = true;
              recordDefects.add('catB_lexicalMismatchAtLocator');
              addSample('catB_lexicalMismatchAtLocator', {
                ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, dbStrongs: strongsId, oshbLemma: tok.lemma, oshbText: tok.text, locIdx
              });
            } else {
              primaryLinkVerified = true;
            }

            const dbC = canonHebSurface(origSurface);
            const rawParts = tok.rawParts || [tok.text];
            const surfOk = origSurface && (
              dbC === canonHebSurface(tok.text) ||
              rawParts.map(canonHebSurface).includes(dbC) ||
              canonHebSurface(rawParts.slice(1).join('')) === dbC
            );
            if (!surfOk) {
              failAxis('lemmaSurface', `surface '${origSurface}' != OSHB '${tok.text}' @ w${locIdx}`);
              if (primaryLinkVerified) {
                recordDefects.add('catA_surfaceOrLemmaNormalization');
                addSample('catA_surfaceOrLemmaNormalization', { ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, origSurface, expected: tok.text });
              }
            }
            if (origWord) {
              if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(origWord) || /[\u0600-\u06FF]/.test(origWord) || /[a-zA-Z]/.test(origWord)) {
                failAxis('lemmaSurface', `Hebrew/Aramaic orig_word '${origWord}' contains non-Hebrew script @ w${locIdx}`);
                if (primaryLinkVerified) recordDefects.add('catA_surfaceOrLemmaNormalization');
              } else if (strongsId && strongsId.startsWith('H') && !['H9002','H9003','H9004','H9005','H9009'].includes(strongsId)) {
                const lex = strongsHebrewMap.get(strongsId);
                if (lex) {
                  const wCons = stripHebrewDiacritics(origWord);
                  const lCons = stripHebrewDiacritics(lex);
                  const auth = AUTHORIZED_HEBREW_LEMMA_VARIANTS[strongsId];
                  const isAuth = auth && (auth.includes(origWord) || auth.some(v => stripHebrewDiacritics(v) === wCons));
                  if (origWord !== lex && wCons !== lCons && !isAuth) {
                    failAxis('lemmaSurface', `orig_word '${origWord}' != Strong's lexicon '${lex}' for ${strongsId} @ w${locIdx}`);
                    if (primaryLinkVerified) {
                      recordDefects.add('catA_surfaceOrLemmaNormalization');
                      addSample('catA_surfaceOrLemmaNormalization', { ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, origWord, expectedLex: lex });
                    }
                  }
                }
              }
            }
            if (origMorph && tok.morph && !morphMatches(origMorph, tok.morph)) {
              failAxis('morphology', `morph '${origMorph}' != OSHB '${tok.morph}'`);
              if (primaryLinkVerified) recordDefects.add('catA_rawMorphPrefixVariant');
            }
            const dErr = verifyDerived(lang, origMorph || tok.morph, tok.morph, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase });
            if (dErr) {
              failAxis('morphology', `derived(${dErr})`);
              if (primaryLinkVerified) {
                if (dErr.startsWith('case ')) {
                  recordDefects.add('catA_missingOrWrongMorphCaseState');
                  addSample('catA_missingOrWrongMorphCaseState', { ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, origMorph: origMorph || tok.morph, morphCase, dErr });
                } else {
                  recordDefects.add('catA_derivedMorphMismatch');
                  addSample('catA_derivedMorphMismatch', { ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, origMorph: origMorph || tok.morph, dErr });
                }
              }
            }

            // Universal check for missing mandatory morph_case state ('construct', 'absolute', 'determined') across all 39 OT books
            const segs = (origMorph || tok.morph || '').split('/');
            let expState = null;
            const sMap = { c:'construct', a:'absolute', d:'determined' };
            for (const s of segs) {
              const core = s.replace(/^[HA](?=[A-Z])/, '');
              if (core[0] === 'V' && (core[2] === 'r' || core[2] === 's')) { expState = sMap[core[5]] || null; break; }
              if ((core[0] === 'N' || core[0] === 'A') && core[1] !== 'p' && core !== 'Td') { expState = sMap[core[4]] || null; break; }
            }
            if (expState && (!morphCase || morphCase !== expState)) {
              if (!dErr || !dErr.startsWith('case ')) {
                failAxis('morphology', `missing or incorrect mandatory morph_case='${expState}' (got '${morphCase || ''}') for '${origMorph || tok.morph}'`);
              }
              if (primaryLinkVerified) {
                recordDefects.add('catA_missingOrWrongMorphCaseState');
                addSample('catA_missingOrWrongMorphCaseState', { ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, strongsId, origMorph: origMorph || tok.morph, morphCase: morphCase || null, expectedCase: expState });
              }
            }
          }

          // Check word_mapping_strongs for Hebrew/Aramaic
          if (actualComponents.length > 0 && oshbTokens) {
            for (const comp of actualComponents) {
              const { strongsId: cS, role: cRole, order: cOrder, pos: cP, surface: cSurf, morph: cMorph, source: cSrc } = comp;
              if (!cSurf) { failAxis('lemmaSurface', `wms ${cS}@w${cP || '?'} missing mandatory orig_component`); recordDefects.add('catA_wmsMandatoryFieldsOrSync'); }
              if (!cMorph) { failAxis('morphology', `wms ${cS}@w${cP || '?'} missing mandatory orig_morphology`); recordDefects.add('catA_wmsMandatoryFieldsOrSync'); }
              if (!cSrc) { failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory morph_source`); recordDefects.add('catA_wmsMandatoryFieldsOrSync'); }
              if (!cRole) { failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_role`); recordDefects.add('catA_wmsMandatoryFieldsOrSync'); }
              if (!cOrder || isNaN(cOrder)) { failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_order`); recordDefects.add('catA_wmsMandatoryFieldsOrSync'); }
              if (!cP || isNaN(cP)) {
                failAxis('sourceLocator', `wms ${cS} missing mandatory orig_word_position`);
                if (cRole === 'primary' && primaryLinkVerified) {
                  recordDefects.add('catA_wmsMandatoryFieldsOrSync');
                  addSample('catA_wmsMandatoryFieldsOrSync', { ref: `${bkName} ${ch}:${vs} #${arPos}`, arWord, cS, issue: 'missing orig_word_position on primary wms' });
                } else {
                  hasCategoryBBlocker = true;
                  recordDefects.add('catB_secondaryComponentDisplacedOrInvalid');
                }
                continue;
              }
              if (cRole === 'primary' && locIdx && cP && cP !== locIdx) {
                failAxis('sourceLocator', `primary component pos ${cP} != mapping locator w${locIdx}`);
                recordDefects.add('catA_wmsMandatoryFieldsOrSync');
              }
              const cTok = (oshbTokens && oshbTokens.byIndex) ? oshbTokens.byIndex.get(cP) : null;
              if (!cTok) {
                failAxis('sourceLocator', `wms component ${cS}@w${cP} missing in OSHB`);
                hasCategoryBBlocker = true;
                recordDefects.add('catB_secondaryComponentDisplacedOrInvalid');
              } else {
                if (!verifyHebrewStrongsAgainstLemma(cS, cTok.lemma, cMorph || origMorph || cTok.morph)) {
                  failAxis('lexical', `wms ${cS}@w${cP} fails OSHB lemma '${cTok.lemma}'`);
                  hasCategoryBBlocker = true;
                  recordDefects.add('catB_secondaryComponentDisplacedOrInvalid');
                }
                if (cSurf) {
                  const cC = canonHebSurface(cSurf);
                  const cParts = (cTok.rawParts || [cTok.text]).map(canonHebSurface);
                  if (cC !== canonHebSurface(cTok.text) && !cParts.includes(cC)) {
                    failAxis('lemmaSurface', `wms ${cS}@w${cP} surface '${cSurf}' != OSHB '${cTok.text}'`);
                    recordDefects.add('catA_wmsMandatoryFieldsOrSync');
                  }
                }
                if (cMorph && cTok.morph && !morphMatches(cMorph, cTok.morph)) {
                  failAxis('morphology', `wms ${cS}@w${cP} morph '${cMorph}' != OSHB '${cTok.morph}'`);
                  recordDefects.add('catA_wmsMandatoryFieldsOrSync');
                }
                if (cSrc && cSrc !== 'oshb_wlc') {
                  failAxis('sourceLocator', `wms ${cS}@w${cP} morph_source='${cSrc}' != oshb_wlc`);
                  recordDefects.add('catA_wmsMandatoryFieldsOrSync');
                }
              }
            }
          }
        }
      }

      let unitHasAlert = false;
      for (const k of ['lexical', 'lemmaSurface', 'morphology', 'sourceLocator']) {
        if (ax[k].status === 'fail') {
          globalStats.axes[k].fail++;
          globalStats.byLanguage[lang].axes[k]++;
          unitHasAlert = true;
        } else if (ax[k].status === 'undecided') {
          globalStats.axes[k].undecided++;
          unitHasAlert = true;
        } else {
          globalStats.axes[k].pass++;
        }
      }

      globalStats.totalRecords++;
      globalStats.byLanguage[lang].total++;
      bkTotal++;

      for (const dKey of recordDefects) {
        if (globalStats.defectTaxonomy[dKey] !== undefined) {
          globalStats.defectTaxonomy[dKey]++;
        }
      }

      if (!unitHasAlert && recordDefects.size === 0) {
        globalStats.cleanRecords++;
        globalStats.byLanguage[lang].clean++;
        globalStats.categories.alreadyClean++;
        bkClean++;
      } else {
        if (unitHasAlert) {
          globalStats.alertedRecords++;
          globalStats.byLanguage[lang].alerts++;
          bkAlerts++;
          vAlertCount++;
        } else {
          // Clean on 4 axes but has Aramaic language badge mismatch
          globalStats.cleanRecords++;
          globalStats.byLanguage[lang].clean++;
          bkClean++;
        }

        if (!hasCategoryBBlocker && primaryLinkVerified) {
          globalStats.categories.categoryA_deterministicRepairable++;
          globalStats.byLanguage[lang].catA++;
          bkCatA++;
        } else {
          globalStats.categories.categoryB_contextualAlignmentRequired++;
          globalStats.byLanguage[lang].catB++;
          bkCatB++;
        }
      }
    }

    if (vAlertCount === 0) {
      globalStats.fullyCleanVerses++;
      globalStats.byLanguage[lang].cleanVerses++;
      bkCleanVerses++;
    }
  }

  globalStats.byBook.push({
    bookId: b,
    bookName: bkName,
    verses: bkVerses,
    cleanVerses: bkCleanVerses,
    totalRecords: bkTotal,
    cleanRecords: bkClean,
    alertedRecords: bkAlerts,
    cleanPct: bkTotal ? Number(((bkClean / bkTotal) * 100).toFixed(2)) : 0,
    catA_deterministic: bkCatA,
    catB_contextual: bkCatB
  });
}

globalStats.dbSha256 = dbSha256;
globalStats.cleanPct = Number(((globalStats.cleanRecords / globalStats.totalRecords) * 100).toFixed(2));

const outArgIdx = process.argv.indexOf('--out');
const outJsonPath = (outArgIdx !== -1 && process.argv[outArgIdx + 1])
  ? path.resolve(process.cwd(), process.argv[outArgIdx + 1])
  : path.join(__dirname, 'full_db_434351_audit_preview_v379.json');
fs.writeFileSync(outJsonPath, JSON.stringify(globalStats, null, 2) + '\n', 'utf8');

console.log('\n================================================================================');
console.log('  FULL 66-BOOK READ-ONLY AUDIT SUMMARY (31,102 VERSES / 434,351 RECORDS)       ');
console.log('================================================================================');
console.log(`  DB SHA-256         : ${dbSha256}`);
console.log(`  Total Verses       : ${globalStats.totalVerses} (Fully Clean: ${globalStats.fullyCleanVerses} = ${((globalStats.fullyCleanVerses/globalStats.totalVerses)*100).toFixed(2)}%)`);
console.log(`  Total Records      : ${globalStats.totalRecords}`);
console.log(`  4-Axis Clean       : ${globalStats.cleanRecords}/${globalStats.totalRecords} (${globalStats.cleanPct}%)`);
console.log(`  4-Axis Alerted     : ${globalStats.alertedRecords}/${globalStats.totalRecords}`);
console.log('--------------------------------------------------------------------------------');
console.log('  4-AXIS BREAKDOWN:');
for (const k of ['lexical', 'lemmaSurface', 'morphology', 'sourceLocator']) {
  const s = globalStats.axes[k];
  const tot = s.pass + s.fail + s.undecided;
  console.log(`    ${k.padEnd(15)}: pass ${s.pass}/${tot} (${((s.pass/tot)*100).toFixed(2)}%) | fail=${s.fail} | undecided=${s.undecided}`);
}
console.log('--------------------------------------------------------------------------------');
console.log('  BY LANGUAGE:');
for (const l of ['hebrew', 'aramaic', 'greek']) {
  const s = globalStats.byLanguage[l];
  console.log(`    ${l.padEnd(8)}: clean ${s.clean}/${s.total} (${((s.clean/s.total)*100).toFixed(2)}%) | verses=${s.cleanVerses}/${s.verses} | catA(deterministic)=${s.catA} | catB(contextual)=${s.catB}`);
}
console.log('--------------------------------------------------------------------------------');
console.log('  REPAIRABILITY CLASSIFICATION:');
console.log(`    Already 100% Clean (0 defects)               : ${globalStats.categories.alreadyClean}`);
console.log(`    Category A (Verified Link + Deterministic)   : ${globalStats.categories.categoryA_deterministicRepairable}`);
console.log(`    Category B (Unverified Link / Contextual)    : ${globalStats.categories.categoryB_contextualAlignmentRequired}`);
console.log('--------------------------------------------------------------------------------');
console.log('  DEFECT TAXONOMY (EXACT RECORD COUNTS):');
for (const [k, v] of Object.entries(globalStats.defectTaxonomy)) {
  console.log(`    ${k.padEnd(46)}: ${v}`);
}
console.log('================================================================================');
console.log(`Saved full JSON preview report to: ${outJsonPath}`);
