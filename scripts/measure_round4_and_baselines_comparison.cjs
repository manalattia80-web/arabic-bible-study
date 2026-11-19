/**
 * measure_round4_and_baselines_comparison.cjs
 *
 * Evaluates:
 *   1. Round 4 (15 unseen verses across the 66-book universe, 0% overlap with 2,649 excluded verses)
 *      on the FROZEN production DB vs the TRIAL rule-repaired DB (before any manual verse-specific repair).
 *   2. Round 3 (15 unseen verses, 234 records) on the FROZEN production DB vs the TRIAL rule-repaired DB.
 *   3. Regression verification on:
 *        - Frozen 20-verse reference set (311/311 records)
 *        - Frozen Round 1 holdout set (253/253 records)
 *        - Frozen Round 2 holdout set (255/255 records)
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
  greekStrongsMatchesLemma
} = require('./full_66_books_audit_helpers.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const prodDbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const trialDbPath = path.join(repoRoot, 'scratch/bible_study_trial_rule_repaired.db');

const { oshbByBook, sblByBook, trByOsis } = loadAllSources();

function verifyDerived(lang, dbMorph, srcMorph, d, isTr = false) {
  const normPerson = p => ({ first: '1', second: '2', third: '3' }[p] || p || null);
  if (lang === 'greek') {
    if (isTr) return verifyTrDerivedMorphology(dbMorph, srcMorph, d);
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
    const stemMap = isAr
      ? { q:'peal', Q:'peil', p:'pael', P:'pael_passive', a:'aphel', A:'haphel_passive', h:'haphel', u:'hithpeel', t:'hithpaal', o:'polel', O:'polal', e:'shaphel', i:'ithpaal' }
      : { q:'qal', Q:'qal_passive', N:'niphal', p:'piel', P:'pual', h:'hiphil', H:'hophal', t:'hithpael', o:'polel', O:'polal', c:'pilpel', C:'polpal' };
    if (stemMap[core[1]] && (d.morphStem || null) !== stemMap[core[1]]) return `stem '${d.morphStem}' vs '${stemMap[core[1]]}'`;
    const conj = core[2];
    const isPassive = ((isAr ? 'QPAui' : 'NQPH').includes(core[1]) || conj === 's');
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

function auditHoldoutVersesOnDb(targetDbPath, holdoutVerses) {
  function q(sql) {
    return execFileSync(sqlitePath, [targetDbPath], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
  }
  const axisStats = {
    lexical:       { pass: 0, fail: 0, undecided: 0 },
    lemmaSurface:  { pass: 0, fail: 0, undecided: 0 },
    morphology:    { pass: 0, fail: 0, undecided: 0 },
    sourceLocator: { pass: 0, fail: 0, undecided: 0 }
  };
  const langStats = {
    hebrew:  { total: 0, clean: 0, alerts: 0, axes: { lexical:0, lemmaSurface:0, morphology:0, sourceLocator:0 } },
    aramaic: { total: 0, clean: 0, alerts: 0, axes: { lexical:0, lemmaSurface:0, morphology:0, sourceLocator:0 } },
    greek:   { total: 0, clean: 0, alerts: 0, axes: { lexical:0, lemmaSurface:0, morphology:0, sourceLocator:0 } }
  };
  const verseSummaries = [];
  const allAlerts = [];

  for (const v of holdoutVerses) {
    const oshbTokens = v.lang !== 'greek' ? (oshbByBook[v.book].get(v.oshbOsis) || null) : null;
    const sblTokens  = v.lang === 'greek' ? (sblByBook[v.book].get(`${v.ch}:${v.vs}`) || null) : null;
    const trTokens   = v.lang === 'greek' ? (trByOsis.get(`${TR_BOOK_OSIS_MAP[v.book]}:${v.ch}:${v.vs}`) || null) : null;

    const rowsRaw = q(`
      SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface,
             wm.morph_pos, wm.orig_morphology, wm.morph_gender, wm.morph_number, wm.morph_person,
             wm.morph_stem, wm.morph_mood, wm.orig_word_position, wm.verified_locator,
             wm.morph_tense, wm.morph_voice, wm.morph_case, COALESCE(wm.morph_source,''),
             COALESCE(wm.relation_type,''), REPLACE(COALESCE(wm.grammar_notes,''), char(10), ' '),
             COALESCE(wm.verified_source,''),
             (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '#' || COALESCE(wms.link_order,'') || '@w' || COALESCE(wms.orig_word_position,'') || '[' || COALESCE(wms.orig_component,'') || ':' || COALESCE(wms.orig_morphology,'') || ':' || COALESCE(wms.morph_source,'') || ']', ';')
              FROM (SELECT strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms)
      FROM word_mappings wm
      JOIN verses vr ON wm.verse_id = vr.id
      WHERE vr.book_id = ${v.book} AND vr.chapter_num = ${v.ch} AND vr.verse_num = ${v.vs}
      ORDER BY wm.ar_word_position ASC;
    `);

    const lines = rowsRaw.split('\n').filter(Boolean);
    const vAxes = { lexical: 0, lemmaSurface: 0, morphology: 0, sourceLocator: 0 };
    let vClean = 0, vAlert = 0;
    const seenPrimaryLocators = new Map();

    for (const line of lines) {
      const [
        posStr, arWord, strongsId, origWord, origSurface, morphPos, origMorph,
        morphGender, morphNumber, morphPerson, morphStem, morphMood, origPosStr,
        locator, morphTense, morphVoice, morphCase, morphSource, relationType, grammarNotes,
        verifiedSource, compDetailed
      ] = line.split('|');

      const arPos = parseInt(posStr, 10);
      const origPos = origPosStr ? parseInt(origPosStr, 10) : null;
      const isSyntactic = morphPos === 'syntactic_ar' || (locator && locator.startsWith('AR_SYNTACTIC'));
      const isTr = v.lang === 'greek' && ((locator && locator.startsWith('TR:')) || morphSource === 'morphgnt_tr');

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

      const tokCount = v.lang === 'greek'
        ? ((isTr ? trTokens : sblTokens) ? (isTr ? trTokens : sblTokens).length : 0)
        : (oshbTokens ? oshbTokens.length : 0);
      const locRes = validateCanonicalLocator({
        locator, isSyntactic, lang: v.lang, book: v.book, ch: v.ch, vs: v.vs,
        oshbOsis: v.oshbOsis, arPos, origPos, morphSource, tokenCount: tokCount
      });

      const actualComponents = [];
      if (compDetailed) {
        for (const cStr of compDetailed.split(';')) {
          const mC = cStr.match(/^([^:]+):([^#]+)#(\d*)@w(\d*)\[([^:]*):([^:]*):([^\]]*)\]$/);
          if (!mC) continue;
          const [, cS, cRole, cOrderStr, cPStr, cSurf, cMorph, cSrc] = mC;
          actualComponents.push({
            strongsId: cS, role: cRole,
            order: cOrderStr ? parseInt(cOrderStr, 10) : null,
            pos: cPStr ? parseInt(cPStr, 10) : null,
            surface: cSurf || '', morph: cMorph || '', source: cSrc || ''
          });
        }
      }

      if (isSyntactic) {
        if (!locRes.ok) failAxis('sourceLocator', locRes.error);
        if (strongsId) failAxis('lexical', `syntactic row has strongs_id='${strongsId}'`);
        if (compDetailed) failAxis('lexical', `syntactic row has word_mapping_strongs '${compDetailed}'`);
        if (origWord && origWord !== '—') failAxis('lemmaSurface', `syntactic row has orig_word='${origWord}'`);
        if (origSurface && origSurface !== '—') failAxis('lemmaSurface', `syntactic row has orig_surface='${origSurface}'`);
        if (relationType === 'syntactic_copula' && (!grammarNotes || grammarNotes.trim().length === 0)) {
          failAxis('morphology', 'syntactic_copula row requires explanatory grammar_notes');
        }
        if (morphPos && morphPos !== 'syntactic_ar') failAxis('morphology', `AR_SYNTACTIC carries morph_pos='${morphPos}'`);
        if (verifiedSource && verifiedSource !== 'syntactic_ar') failAxis('sourceLocator', `AR_SYNTACTIC carries verified_source='${verifiedSource}'`);
        if (morphSource && morphSource !== 'syntactic_ar') failAxis('sourceLocator', `AR_SYNTACTIC carries morph_source='${morphSource}'`);
      } else {
        if (!strongsId) failAxis('lexical', 'missing strongs_id');
        if (!compDetailed) failAxis('lexical', 'empty word_mapping_strongs');

        const locIdx = locRes.locW || (origPos > 0 ? origPos : null);
        if (!locRes.ok) failAxis('sourceLocator', locRes.error);

        if (locRes.locW) {
          const edKey = `${locRes.edition}:w${locRes.locW}`;
          if (seenPrimaryLocators.has(edKey)) {
            const prev = seenPrimaryLocators.get(edKey);
            const oshbTok = (locRes.edition === 'OSHB' && locRes.locW && oshbTokens) ? oshbTokens.byIndex.get(locRes.locW) : null;
            const isDocumentedSharedUnit =
              relationType === 'compound_phrase' && prev.relationType === 'compound_phrase' &&
              arPos > prev.arPos && arPos <= prev.arPos + 2 &&
              Boolean(grammarNotes && grammarNotes.trim().length > 0) &&
              Boolean(prev.grammarNotes && prev.grammarNotes.trim().length > 0) &&
              ((prev.strongsId && strongsId === prev.strongsId) ||
               (oshbTok && verifyHebrewStrongsAgainstLemma(prev.strongsId, oshbTok.lemma, prev.origMorph) && verifyHebrewStrongsAgainstLemma(strongsId, oshbTok.lemma, origMorph)));
            if (!isDocumentedSharedUnit) {
              failAxis('sourceLocator', `duplicate primary token collision: ${edKey} already claimed by arPos #${prev.arPos}`);
            } else {
              seenPrimaryLocators.set(edKey, { arPos, strongsId, origMorph, relationType, grammarNotes });
            }
          } else {
            seenPrimaryLocators.set(edKey, { arPos, strongsId, origMorph, relationType, grammarNotes });
          }
        }

        if (v.lang === 'greek') {
          const tokens = isTr ? trTokens : sblTokens;
          const edition = isTr ? 'Scrivener TR' : 'SBLGNT';
          if (isTr && morphSource && morphSource !== 'morphgnt_tr') failAxis('sourceLocator', `TR locator carries morph_source='${morphSource}'`);
          if (!isTr && morphSource && morphSource !== 'morphgnt_sblgnt') failAxis('sourceLocator', `SBLGNT locator carries morph_source='${morphSource}'`);
          const tok = (locIdx && tokens && tokens.byIndex) ? tokens.byIndex.get(locIdx) : null;
          if (!tok) {
            if (locIdx && tokens) failAxis('sourceLocator', `${edition} w${locIdx} exceeds token count (${tokens.length})`);
            undecidedAxis('lexical', `undecided: source token w${locIdx || '?'} unavailable in ${edition}`);
            undecidedAxis('lemmaSurface', `undecided: source token w${locIdx || '?'} unavailable in ${edition}`);
            undecidedAxis('morphology', `undecided: source token w${locIdx || '?'} unavailable in ${edition}`);
          } else if (isTr) {
            if (!origSurface || normGreekWord(origSurface) !== normGreekWord(tok.surface)) failAxis('lemmaSurface', `TR surface '${origSurface}' != '${tok.surface}' @ w${locIdx}`);
            if (origWord && tok.lemma && normGreekPolytonicFold(origWord) !== normGreekPolytonicFold(tok.lemma)) failAxis('lemmaSurface', `TR lemma '${origWord}' != '${tok.lemma}' @ w${locIdx}`);
            if (strongsId && tok.strongsId && strongsId !== tok.strongsId) failAxis('lexical', `TR Strong's '${strongsId}' != '${tok.strongsId}' @ w${locIdx}`);
            const dErr = verifyDerived('greek', origMorph, tok.grammar, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase }, true);
            if (dErr) failAxis('morphology', dErr);
          } else {
            const dbGr = normGreekWord(origSurface);
            if (!origSurface || ![tok.surfacePunct, tok.surfaceClean, tok.surfaceNorm].map(normGreekWord).includes(dbGr)) failAxis('lemmaSurface', `SBLGNT surface '${origSurface}' != '${tok.surfaceClean}' @ w${locIdx}`);
            if (origWord && tok.lemma && origWord !== tok.lemma) failAxis('lemmaSurface', `SBLGNT lemma '${origWord}' != '${tok.lemma}' @ w${locIdx}`);
            if (strongsId && tok.lemma && !greekStrongsMatchesLemma(strongsId, tok.lemma)) failAxis('lexical', `Strongs '${strongsId}' != SBLGNT lemma '${tok.lemma}' @ w${locIdx}`);
            if (origMorph && tok.morph && origMorph !== tok.morph) failAxis('morphology', `morph '${origMorph}' != SBLGNT '${tok.morph}'`);
            const dErr = verifyDerived('greek', origMorph, tok.morph, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase }, false);
            if (dErr) failAxis('morphology', `derived(${dErr})`);
          }
          if (compDetailed && tokens) {
            for (const comp of actualComponents) {
              const { strongsId: cS, role: cRole, order: cOrder, pos: cP, surface: cSurf, morph: cMorph, source: cSrc } = comp;
              if (!cSurf) failAxis('lemmaSurface', `wms ${cS}@w${cP || '?'} missing mandatory orig_component`);
              if (!cMorph) failAxis('morphology', `wms ${cS}@w${cP || '?'} missing mandatory orig_morphology`);
              if (!cSrc) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory morph_source`);
              if (!cRole) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_role`);
              if (!cOrder || isNaN(cOrder)) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_order`);
              if (!cP || isNaN(cP)) { failAxis('sourceLocator', `wms ${cS} missing mandatory orig_word_position`); continue; }
              if (cRole === 'primary' && locIdx && cP && cP !== locIdx) failAxis('sourceLocator', `primary component pos ${cP} != mapping locator w${locIdx}`);
              const cTok = tokens.byIndex.get(cP);
              if (!cTok) failAxis('sourceLocator', `wms component ${cS}@w${cP} exceeds ${edition} token count`);
              else {
                if (!isTr && cTok.lemma && !greekStrongsMatchesLemma(cS, cTok.lemma)) failAxis('lexical', `wms ${cS}@w${cP} != SBLGNT '${cTok.lemma}'`);
                if (isTr && cTok.strongsId && cS !== cTok.strongsId) failAxis('lexical', `wms ${cS}@w${cP} != TR '${cTok.strongsId}'`);
                if (cSurf) {
                  const cNorm = normGreekWord(cSurf);
                  const tNorms = isTr ? [normGreekWord(cTok.surface)] : [cTok.surfacePunct, cTok.surfaceClean, cTok.surfaceNorm].map(normGreekWord);
                  if (!tNorms.includes(cNorm)) failAxis('lemmaSurface', `wms ${cS}@w${cP} surface '${cSurf}' != '${cTok.surfaceClean || cTok.surface}'`);
                }
                if (cMorph) {
                  const expM = isTr ? cTok.grammar : cTok.morph;
                  if (expM && cMorph !== expM) failAxis('morphology', `wms ${cS}@w${cP} morph '${cMorph}' != '${expM}'`);
                }
                if (cSrc) {
                  const expS = isTr ? 'morphgnt_tr' : 'morphgnt_sblgnt';
                  if (cSrc !== expS) failAxis('sourceLocator', `wms ${cS}@w${cP} morph_source='${cSrc}' != '${expS}'`);
                }
              }
            }
          }
        } else {
          if (morphSource && morphSource !== 'oshb_wlc') failAxis('sourceLocator', `OSHB locator carries morph_source='${morphSource}'`);
          const tok = (locIdx && oshbTokens && oshbTokens.byIndex) ? oshbTokens.byIndex.get(locIdx) : null;
          if (!tok) {
            if (locIdx && oshbTokens) failAxis('sourceLocator', `OSHB w${locIdx} exceeds token count (${oshbTokens.length})`);
            undecidedAxis('lexical', `undecided: OSHB token w${locIdx || '?'} unavailable`);
            undecidedAxis('lemmaSurface', `undecided: OSHB token w${locIdx || '?'} unavailable`);
            undecidedAxis('morphology', `undecided: OSHB token w${locIdx || '?'} unavailable`);
          } else {
            const dbC = canonHebSurface(origSurface);
            const rawParts = tok.rawParts || [tok.text];
            const surfOk = origSurface && (
              dbC === canonHebSurface(tok.text) ||
              rawParts.map(canonHebSurface).includes(dbC) ||
              canonHebSurface(rawParts.slice(1).join('')) === dbC
            );
            if (!surfOk) failAxis('lemmaSurface', `surface '${origSurface}' != OSHB '${tok.text}' @ w${locIdx}`);
            if (origWord) {
              if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(origWord) || /[\u0600-\u06FF]/.test(origWord) || /[a-zA-Z]/.test(origWord)) {
                failAxis('lemmaSurface', `Hebrew/Aramaic orig_word '${origWord}' contains non-Hebrew characters @ w${locIdx}`);
              } else if (strongsId && strongsId.startsWith('H') && !['H9002','H9003','H9004','H9005','H9009'].includes(strongsId)) {
                const lex = strongsHebrewMap.get(strongsId);
                if (lex) {
                  const wCons = stripHebrewDiacritics(origWord);
                  const lCons = stripHebrewDiacritics(lex);
                  const auth = AUTHORIZED_HEBREW_LEMMA_VARIANTS[strongsId];
                  const isAuth = auth && (auth.includes(origWord) || auth.some(v => stripHebrewDiacritics(v) === wCons));
                  if (origWord !== lex && wCons !== lCons && !isAuth) failAxis('lemmaSurface', `orig_word '${origWord}' != Strong's lexicon '${lex}' @ w${locIdx}`);
                }
              }
            }
            if (origMorph && tok.morph && !morphMatches(origMorph, tok.morph)) failAxis('morphology', `morph '${origMorph}' != OSHB '${tok.morph}'`);
            if (strongsId && tok.lemma && !verifyHebrewStrongsAgainstLemma(strongsId, tok.lemma, origMorph)) failAxis('lexical', `Strongs '${strongsId}' != OSHB lemma '${tok.lemma}' @ w${locIdx}`);
            const dErr = verifyDerived(v.lang, origMorph, tok.morph, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase });
            if (dErr) failAxis('morphology', `derived(${dErr})`);
          }
          if (compDetailed && oshbTokens) {
            for (const comp of actualComponents) {
              const { strongsId: cS, role: cRole, order: cOrder, pos: cP, surface: cSurf, morph: cMorph, source: cSrc } = comp;
              if (!cSurf) failAxis('lemmaSurface', `wms ${cS}@w${cP || '?'} missing mandatory orig_component`);
              if (!cMorph) failAxis('morphology', `wms ${cS}@w${cP || '?'} missing mandatory orig_morphology`);
              if (!cSrc) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory morph_source`);
              if (!cRole) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_role`);
              if (!cOrder || isNaN(cOrder)) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_order`);
              if (!cP || isNaN(cP)) { failAxis('sourceLocator', `wms ${cS} missing mandatory orig_word_position`); continue; }
              if (cRole === 'primary' && locIdx && cP && cP !== locIdx) failAxis('sourceLocator', `primary component pos ${cP} != mapping locator w${locIdx}`);
              const cTok = oshbTokens.byIndex.get(cP);
              if (!cTok) failAxis('sourceLocator', `wms component ${cS}@w${cP} missing in OSHB`);
              else {
                if (!verifyHebrewStrongsAgainstLemma(cS, cTok.lemma, cMorph || origMorph)) failAxis('lexical', `wms ${cS}@w${cP} fails OSHB lemma '${cTok.lemma}'`);
                if (cSurf) {
                  const cC = canonHebSurface(cSurf);
                  const cParts = (cTok.rawParts || [cTok.text]).map(canonHebSurface);
                  if (cC !== canonHebSurface(cTok.text) && !cParts.includes(cC)) failAxis('lemmaSurface', `wms ${cS}@w${cP} surface '${cSurf}' != OSHB '${cTok.text}'`);
                }
                if (cMorph && cTok.morph && !morphMatches(cMorph, cTok.morph)) failAxis('morphology', `wms ${cS}@w${cP} morph '${cMorph}' != OSHB '${cTok.morph}'`);
                if (cSrc && cSrc !== 'oshb_wlc') failAxis('sourceLocator', `wms ${cS}@w${cP} morph_source='${cSrc}' != oshb_wlc`);
              }
            }
          }
        }
      }

      let unitHasAlert = false;
      for (const k of ['lexical', 'lemmaSurface', 'morphology', 'sourceLocator']) {
        if (ax[k].status === 'fail') {
          axisStats[k].fail++;
          langStats[v.lang].axes[k]++;
          vAxes[k]++;
          unitHasAlert = true;
        } else if (ax[k].status === 'undecided') {
          axisStats[k].undecided++;
          unitHasAlert = true;
        } else {
          axisStats[k].pass++;
        }
      }
      langStats[v.lang].total++;
      if (unitHasAlert) {
        langStats[v.lang].alerts++;
        vAlert++;
        allAlerts.push({
          verse: v.name, lang: v.lang, pos: arPos, arWord, strongsId, locator,
          axes: {
            lexical: ax.lexical.notes,
            lemmaSurface: ax.lemmaSurface.notes,
            morphology: ax.morphology.notes,
            sourceLocator: ax.sourceLocator.notes
          }
        });
      } else {
        langStats[v.lang].clean++;
        vClean++;
      }
    }
    const vTot = vClean + vAlert;
    verseSummaries.push({
      verse: v.name, lang: v.lang, total: vTot, clean: vClean, alerts: vAlert,
      pctClean: vTot ? Number(((vClean / vTot) * 100).toFixed(2)) : 0,
      axisAlerts: vAxes
    });
  }

  const gTotal = langStats.hebrew.total + langStats.aramaic.total + langStats.greek.total;
  const gClean = langStats.hebrew.clean + langStats.aramaic.clean + langStats.greek.clean;
  const gAlerts = langStats.hebrew.alerts + langStats.aramaic.alerts + langStats.greek.alerts;

  return {
    dbSha256: sha256File(targetDbPath),
    summary: { totalUnits: gTotal, cleanUnits: gClean, alertedUnits: gAlerts, cleanPct: Number(((gClean / gTotal) * 100).toFixed(2)) },
    axisBreakdown: axisStats,
    byLanguage: langStats,
    perVerse: verseSummaries,
    alerts: allAlerts
  };
}

// 1. Evaluate Round 4 on Frozen Prod DB vs Trial Rule-Repaired DB
const r4ManifestPath = path.join(__dirname, 'unseen_holdout_round4_66books_manifest.json');
const r4Manifest = JSON.parse(fs.readFileSync(r4ManifestPath, 'utf8'));
console.log('Evaluating Round 4 (15 unseen verses across 66 books) on Frozen DB vs Trial Repaired DB...');
const r4Raw = auditHoldoutVersesOnDb(prodDbPath, r4Manifest.holdout_verses);
const r4Trial = auditHoldoutVersesOnDb(trialDbPath, r4Manifest.holdout_verses);

// 2. Evaluate Round 3 using the frozen auditor on Trial DB (and compare with frozen R3 raw baseline 43/234)
console.log('Evaluating Round 3 (15 unseen verses, 234 units) on Trial Repaired DB using frozen auditor...');
const r3TrialOutPath = path.join(repoRoot, 'scratch/round3_trial_rule_repaired_report.json');
execFileSync(process.execPath, [
  path.join(__dirname, 'audit_unseen_holdout_sample.cjs'),
  '--manifest', path.join(__dirname, 'unseen_holdout_round3_15_verses_manifest.json'),
  '--out', r3TrialOutPath
], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: trialDbPath }, encoding: 'utf8' });
const r3Trial = JSON.parse(fs.readFileSync(r3TrialOutPath, 'utf8'));
const r3Raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'unseen_holdout_round3_4axis_raw_baseline_v379.json'), 'utf8'));

// 3. Verify zero regressions on 20-verse reference set (311/311), Round 1 (253/253), and Round 2 (255/255) on Trial Repaired DB
console.log('Verifying 20-verse reference set (311/311), Round 1 (253/253), and Round 2 (255/255) on Trial Repaired DB...');
const b20Manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch_20_verses_manifest.json'), 'utf8'));
const b20Where = b20Manifest.verses.map(v => `(vr.book_id=${v.book} AND vr.chapter_num=${v.ch} AND vr.verse_num=${v.vs})`).join(' OR ');
const b20Sql = `
  SELECT wm.id, wm.ar_word_position, wm.orig_word_position, wm.ar_word, COALESCE(wm.orig_word,''),
         COALESCE(wm.orig_surface,''), COALESCE(wm.strongs_id,''), COALESCE(wm.orig_word_lang,''),
         COALESCE(wm.morph_pos,''), COALESCE(wm.morph_stem,''), COALESCE(wm.morph_tense,''),
         COALESCE(wm.morph_voice,''), COALESCE(wm.morph_mood,''), COALESCE(wm.morph_person,''),
         COALESCE(wm.morph_number,''), COALESCE(wm.morph_gender,''), COALESCE(wm.morph_case,''),
         COALESCE(wm.verified_locator,''), COALESCE(wm.orig_morphology,'')
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE ${b20Where}
  ORDER BY vr.book_id, vr.chapter_num, vr.verse_num, wm.ar_word_position;
`;
const b20ProdDump = execFileSync(sqlitePath, [prodDbPath], { input: b20Sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
const b20TrialDump = execFileSync(sqlitePath, [trialDbPath], { input: b20Sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
const b20RowsCount = b20TrialDump.split('\n').filter(Boolean).length;
if (b20ProdDump !== b20TrialDump || b20RowsCount !== 311) {
  throw new Error(`20-verse reference set regression check failed: rows=${b20RowsCount}, identical=${b20ProdDump === b20TrialDump}`);
}

const r1TrialOutPath = path.join(repoRoot, 'scratch/round1_trial_check.json');
execFileSync(process.execPath, [
  path.join(__dirname, 'audit_unseen_holdout_sample.cjs'),
  '--manifest', path.join(__dirname, 'unseen_holdout_15_verses_manifest.json'),
  '--out', r1TrialOutPath,
  '--fail-on-alerts'
], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: trialDbPath }, encoding: 'utf8' });
const r1Trial = JSON.parse(fs.readFileSync(r1TrialOutPath, 'utf8'));

const r2TrialOutPath = path.join(repoRoot, 'scratch/round2_trial_check.json');
execFileSync(process.execPath, [
  path.join(__dirname, 'audit_unseen_holdout_sample.cjs'),
  '--manifest', path.join(__dirname, 'unseen_holdout_round2_15_verses_manifest.json'),
  '--out', r2TrialOutPath,
  '--fail-on-alerts'
], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: trialDbPath }, encoding: 'utf8' });
const r2Trial = JSON.parse(fs.readFileSync(r2TrialOutPath, 'utf8'));

const comparisonReport = {
  round4_66book_unseen_generalization: {
    manifestPath: 'scripts/unseen_holdout_round4_66books_manifest.json',
    manifestSha256: sha256File(r4ManifestPath),
    rawBaselineOnFrozenDb: r4Raw.summary,
    postDeterministicRulesOnTrialDb: r4Trial.summary,
    deltaCleanUnits: r4Trial.summary.cleanUnits - r4Raw.summary.cleanUnits,
    deltaCleanPct: Number((r4Trial.summary.cleanPct - r4Raw.summary.cleanPct).toFixed(2)),
    rawAxisBreakdown: r4Raw.axisBreakdown,
    trialAxisBreakdown: r4Trial.axisBreakdown,
    rawByLanguage: r4Raw.byLanguage,
    trialByLanguage: r4Trial.byLanguage,
    perVerseComparison: r4Raw.perVerse.map((rv, i) => {
      const tv = r4Trial.perVerse[i];
      return {
        verse: rv.verse,
        lang: rv.lang,
        total: rv.total,
        rawClean: rv.clean,
        trialClean: tv.clean,
        deltaClean: tv.clean - rv.clean,
        rawAxes: rv.axisAlerts,
        trialAxes: tv.axisAlerts
      };
    })
  },
  round3_unseen_holdout_comparison: {
    rawBaselineOnFrozenDb: r3Raw.summary,
    postDeterministicRulesOnTrialDb: r3Trial.summary,
    deltaCleanUnits: r3Trial.summary.cleanUnits - r3Raw.summary.cleanUnits,
    deltaCleanPct: Number((r3Trial.summary.cleanPct - r3Raw.summary.cleanPct).toFixed(2)),
    rawAxisBreakdown: r3Raw.axisBreakdown,
    trialAxisBreakdown: r3Trial.axisBreakdown,
    rawByLanguage: r3Raw.byLanguage,
    trialByLanguage: r3Trial.byLanguage,
    perVerseComparison: r3Raw.perVerse.map((rv, i) => {
      const tv = r3Trial.perVerse[i];
      return {
        verse: rv.verse,
        lang: rv.lang,
        total: rv.total,
        rawClean: rv.clean,
        trialClean: tv.clean,
        deltaClean: tv.clean - rv.clean,
        rawAxes: rv.axisAlerts,
        trialAxes: tv.axisAlerts
      };
    })
  },
  regressionChecksOnTrialDb: {
    batch20_reference_set: { totalUnits: 311, cleanUnits: 311, alertedUnits: 0, cleanPct: 100, bitIdenticalToFrozenBaseline: b20ProdDump === b20TrialDump },
    round1_holdout: r1Trial.summary,
    round2_holdout: r2Trial.summary
  }
};

const outPath = path.join(__dirname, 'round4_and_trial_generalization_report_v379.json');
fs.writeFileSync(outPath, JSON.stringify(comparisonReport, null, 2) + '\n', 'utf8');

console.log('\n================================================================================');
console.log('  GENERALIZATION & REGRESSION RESULTS ON TRIAL RULE-REPAIRED DB                ');
console.log('================================================================================');
console.log(`  Round 1 Holdout (Regression) : ${r1Trial.summary.cleanUnits}/${r1Trial.summary.totalUnits} (${r1Trial.summary.cleanPct}%)`);
console.log(`  Round 2 Holdout (Regression) : ${r2Trial.summary.cleanUnits}/${r2Trial.summary.totalUnits} (${r2Trial.summary.cleanPct}%)`);
console.log(`  Round 3 Unseen Holdout       : Raw ${r3Raw.summary.cleanUnits}/${r3Raw.summary.totalUnits} (${r3Raw.summary.cleanPct}%) -> Post-Rule Trial ${r3Trial.summary.cleanUnits}/${r3Trial.summary.totalUnits} (${r3Trial.summary.cleanPct}%) [Delta: +${r3Trial.summary.cleanUnits - r3Raw.summary.cleanUnits} units]`);
console.log(`  Round 4 (66-Book Unseen)     : Raw ${r4Raw.summary.cleanUnits}/${r4Raw.summary.totalUnits} (${r4Raw.summary.cleanPct}%) -> Post-Rule Trial ${r4Trial.summary.cleanUnits}/${r4Trial.summary.totalUnits} (${r4Trial.summary.cleanPct}%) [Delta: +${r4Trial.summary.cleanUnits - r4Raw.summary.cleanUnits} units]`);
console.log('================================================================================');
console.log(`Saved full comparison report: ${outPath}`);
