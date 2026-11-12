/**
 * apply_holdout_batch1_greek.cjs
 * Batch 1 (Greek): Applies canonical SBLGNT + Scrivener TR + AR_SYNTACTIC repairs
 * for the 6 unseen Greek verses, starting with 1Thess 5:16 & Mark 12:30, then
 * Luke 19:10, Rom 12:1, Eph 6:11, 1Pet 2:9.
 * Saves complete before/after comparison + verification artifact to:
 *   scripts/batch1_greek_comparison.json
 * Does NOT overwrite scripts/unseen_holdout_4axis_v376.json.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { parseRobinsonGrammar, verifyTrDerivedMorphology } = require('./robinson_tr_helper.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const q = sql => execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
const esc = s => (s === null || s === undefined) ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;

// Load SBLGNT & Scrivener TR
const sblMapFiles = {
  41: '62-Mk-morphgnt.txt', 42: '63-Lk-morphgnt.txt', 45: '66-Ro-morphgnt.txt',
  49: '70-Eph-morphgnt.txt', 52: '73-1Th-morphgnt.txt', 60: '81-1Pe-morphgnt.txt'
};
function loadSblgntVerse(book, ch, vs) {
  const lines = fs.readFileSync(path.join(__dirname, 'data/sblgnt', sblMapFiles[book]), 'utf8').split('\n');
  const out = [];
  let idx = 1;
  for (const l of lines) {
    if (!l.trim()) continue;
    const p = l.trim().split(/\s+/);
    if (p.length < 7) continue;
    if (parseInt(p[0].slice(2, 4), 10) === ch && parseInt(p[0].slice(4, 6), 10) === vs) {
      out.push({ w: idx++, posCode: p[1], tag: p[2], morph: `${p[1]} ${p[2]}`, surface: p[4], lemma: p[6] });
    }
  }
  return out;
}

const trFullPath = path.join(__dirname, 'data/gnt_scrivener.json');
const trSlicePath = path.join(__dirname, 'unseen_holdout_tr_scrivener_slice.json');
const scrData = fs.existsSync(trFullPath)
  ? JSON.parse(fs.readFileSync(trFullPath, 'utf8'))
  : JSON.parse(fs.readFileSync(trSlicePath, 'utf8')).verses;
const trOsisMap = { 41: 'Mark', 42: 'Luke', 45: 'Rom', 49: 'Eph', 52: '1Thess', 60: '1Pet' };
function loadTrVerse(book, ch, vs) {
  const row = scrData.find(x => x.book_name_osis === trOsisMap[book] && x.chapter === ch && x.verse === vs);
  return row ? row.words.map((w, i) => ({
    w: i + 1, surface: w.greek, grammar: w.grammar,
    strongsId: w.strong ? `G${w.strong}` : null, lemma: w.dictionary_form || ''
  })) : [];
}

function deriveFromSblgnt(tok) {
  const posMap = {
    'V-':'verb', 'N-':'noun', 'A-':'adjective', 'C-':'conjunction', 'D-':'adverb', 'P-':'preposition',
    'X-':'particle', 'I-':'interjection', 'RA':'article', 'RD':'demonstrative', 'RI':'interrogative_pronoun',
    'RP':'personal_pronoun', 'RR':'relative_pronoun'
  };
  const [pCh, tCh, vCh, mCh, cCh, nCh, gCh] = tok.tag.split('');
  return {
    morphPos: posMap[tok.posCode] || 'noun',
    morphStem: null,
    morphTense: { P:'present', I:'imperfect', F:'future', A:'aorist', X:'perfect', Y:'pluperfect', '-':null }[tCh] || null,
    morphVoice: { A:'active', M:'middle', P:'passive', '-':null }[vCh] || null,
    morphMood: { I:'indicative', D:'imperative', S:'subjunctive', O:'optative', N:'infinitive', P:'participle', '-':null }[mCh] || null,
    morphPerson: { '1':'1', '2':'2', '3':'3', '-':null }[pCh] || null,
    morphNumber: { S:'singular', P:'plural', '-':null }[nCh] || null,
    morphGender: { M:'masculine', F:'feminine', N:'neuter', '-':null }[gCh] || null,
    morphCase: { N:'nominative', G:'genitive', D:'dative', A:'accusative', V:'vocative', '-':null }[cCh] || null
  };
}

function deriveFromTr(tok) {
  const spec = parseRobinsonGrammar(tok.grammar);
  if (!spec) throw new Error(`Failed Robinson parse for ${tok.grammar}`);
  return {
    morphPos: spec.allowedPos[0],
    morphStem: null,
    morphTense: spec.tense,
    morphVoice: spec.allowedVoice ? spec.allowedVoice[0] : null,
    morphMood: spec.mood,
    morphPerson: spec.person,
    morphNumber: spec.number,
    morphGender: spec.gender,
    morphCase: spec.case
  };
}

// Strict ordered repair specs: 1Thess 5:16 & Mark 12:30 FIRST, then Luke 19:10, Rom 12:1, Eph 6:11, 1Pet 2:9
const batchPlan = [
  {
    name: '1Thess 5:16', book: 52, ch: 5, vs: 16,
    ops: [
      { pos: 1, mode: 'SBLGNT', w: 2, s: 'G5463' },
      { pos: 2, mode: 'SBLGNT', w: 1, s: 'G3842' },
      { pos: 3, mode: 'AR_SYNTACTIC', note: 'مكمّل تركيبي في العربية لعبارة «كُلَّ حِينٍ» المقابلة للظرف اليوناني المفرد πάντοτε (G3842 @ w1)، ولا يُسند إليه مدخل G2540 مستقل.' }
    ]
  },
  {
    name: 'Mark 12:30', book: 41, ch: 12, vs: 30,
    ops: [
      { pos: 1,  mode: 'SBLGNT', w: 2,  s: 'G25',   sec: [{ w: 1, s: 'G2532' }] },
      { pos: 2,  mode: 'SBLGNT', w: 3,  s: 'G2962' },
      { pos: 3,  mode: 'SBLGNT', w: 5,  s: 'G2316', sec: [{ w: 6, s: 'G4771' }] },
      { pos: 4,  mode: 'SBLGNT', w: 7,  s: 'G1537' },
      { pos: 5,  mode: 'SBLGNT', w: 8,  s: 'G3650' },
      { pos: 6,  mode: 'SBLGNT', w: 10, s: 'G2588', sec: [{ w: 11, s: 'G4771' }] },
      { pos: 7,  mode: 'SBLGNT', w: 13, s: 'G1537' },
      { pos: 8,  mode: 'SBLGNT', w: 14, s: 'G3650' },
      { pos: 9,  mode: 'SBLGNT', w: 16, s: 'G5590', sec: [{ w: 17, s: 'G4771' }] },
      { pos: 10, mode: 'SBLGNT', w: 19, s: 'G1537' },
      { pos: 11, mode: 'SBLGNT', w: 20, s: 'G3650' },
      { pos: 12, mode: 'SBLGNT', w: 22, s: 'G1271', sec: [{ w: 23, s: 'G4771' }] },
      { pos: 13, mode: 'SBLGNT', w: 25, s: 'G1537' },
      { pos: 14, mode: 'SBLGNT', w: 26, s: 'G3650' },
      { pos: 15, mode: 'SBLGNT', w: 28, s: 'G2479', sec: [{ w: 29, s: 'G4771' }] },
      { pos: 16, mode: 'TR',     w: 30, s: 'G3778' },
      { pos: 17, mode: 'AR_SYNTACTIC', note: 'ضمير فصل عربي لإقامة الجملة الاسمية المقابلة لنهاية القراءة المقبولة (αὕτη πρώτη ἐντολή)، ولا تقابله أداة التعريف ὁ (G3588).' },
      { pos: 18, mode: 'TR',     w: 32, s: 'G1785' },
      { pos: 19, mode: 'TR',     w: 31, s: 'G4413' }
    ]
  },
  {
    name: 'Luke 19:10', book: 42, ch: 19, vs: 10,
    ops: [
      { pos: 1, mode: 'SBLGNT', w: 2,  s: 'G1063' },
      { pos: 2, mode: 'SBLGNT', w: 4,  s: 'G5207' },
      { pos: 3, mode: 'SBLGNT', w: 6,  s: 'G444' },
      { pos: 5, mode: 'SBLGNT', w: 1,  s: 'G2064' },
      { pos: 6, mode: 'AR_SYNTACTIC', note: 'حرف تعليل وربط في الصياغة العربية قبل الفعل المضارع المنصوب لترجمة المصدر اليوناني (ζητῆσαι @ w7)، ولا تقابله أداة التعريف ὁ (G3588).' },
      { pos: 8, mode: 'SBLGNT', w: 9,  s: 'G4982' },
      { pos: 9, mode: 'SBLGNT', w: 10, s: 'G3588' }
    ]
  },
  {
    name: 'Rom 12:1', book: 45, ch: 12, vs: 1,
    ops: [
      { pos: 2,  mode: 'SBLGNT', w: 3,  s: 'G4771' },
      { pos: 3,  mode: 'AR_SYNTACTIC', note: 'أداة نداء عربية تمهد للمنادى ἀδελφοί (w4)، ولا تقابلها أداة التعريف ὁ (G3588).' },
      { pos: 5,  mode: 'SBLGNT', w: 7,  s: 'G3628', sec: [{ w: 5, s: 'G1223' }] },
      { pos: 6,  mode: 'SBLGNT', w: 9,  s: 'G2316' },
      { pos: 8,  mode: 'SBLGNT', w: 10, s: 'G3936' },
      { pos: 9,  mode: 'SBLGNT', w: 12, s: 'G4983', sec: [{ w: 13, s: 'G4771' }] },
      { pos: 10, mode: 'SBLGNT', w: 14, s: 'G2378' },
      { pos: 11, mode: 'SBLGNT', w: 15, s: 'G2198' },
      { pos: 12, mode: 'SBLGNT', w: 16, s: 'G40' },
      { pos: 13, mode: 'SBLGNT', w: 17, s: 'G2101' },
      { pos: 14, mode: 'AR_SYNTACTIC', note: 'ظرف عربي لأداء دلالة حالة القابل (Dative) في τῷ θεῷ (w18–w19)، ولا تقابله أداة التعريف ὁ (G3588) وحدها.' },
      { pos: 15, mode: 'SBLGNT', w: 19, s: 'G2316', keepRelation: true },
      { pos: 16, mode: 'SBLGNT', w: 22, s: 'G2999', sec: [{ w: 23, s: 'G4771' }] },
      { pos: 17, mode: 'SBLGNT', w: 21, s: 'G3050' }
    ]
  },
  {
    name: 'Eph 6:11', book: 49, ch: 6, vs: 11,
    ops: [
      { pos: 2,  mode: 'SBLGNT', w: 3,  s: 'G3833' },
      { pos: 3,  mode: 'SBLGNT', w: 5,  s: 'G2316' },
      { pos: 4,  mode: 'AR_SYNTACTIC', note: 'نعت عربي توضيحي لدلالة الشمول في πανοπλίαν («سلاح كامل»، G3833 @ w3)، وليس الفعل اليوناني G3822 (παλαιόω).' },
      { pos: 5,  mode: 'SBLGNT', w: 6,  s: 'G4314' },
      { pos: 6,  mode: 'SBLGNT', w: 8,  s: 'G1410' },
      { pos: 8,  mode: 'SBLGNT', w: 10, s: 'G2476' },
      { pos: 9,  mode: 'SBLGNT', w: 11, s: 'G4314' },
      { pos: 10, mode: 'SBLGNT', w: 13, s: 'G3180' },
      { pos: 11, mode: 'SBLGNT', w: 15, s: 'G1228' }
    ]
  },
  {
    name: '1Pet 2:9', book: 60, ch: 2, vs: 9,
    ops: [
      { pos: 1,  mode: 'SBLGNT', w: 2,  s: 'G1161' },
      { pos: 2,  mode: 'SBLGNT', w: 1,  s: 'G4771' },
      { pos: 5,  mode: 'SBLGNT', w: 6,  s: 'G2406' },
      { pos: 6,  mode: 'SBLGNT', w: 5,  s: 'G934' },
      { pos: 10, mode: 'SBLGNT', w: 11, s: 'G4047' },
      { pos: 11, mode: 'SBLGNT', w: 12, s: 'G3704' },
      { pos: 12, mode: 'SBLGNT', w: 15, s: 'G1804' },
      { pos: 13, mode: 'SBLGNT', w: 14, s: 'G703' },
      { pos: 14, mode: 'SBLGNT', w: 16, s: 'G3588' },
      { pos: 15, mode: 'SBLGNT', w: 20, s: 'G2564', sec: [{ w: 19, s: 'G4771' }] },
      { pos: 16, mode: 'SBLGNT', w: 17, s: 'G1537' },
      { pos: 17, mode: 'SBLGNT', w: 18, s: 'G4655' },
      { pos: 18, mode: 'SBLGNT', w: 21, s: 'G1519' },
      { pos: 19, mode: 'SBLGNT', w: 25, s: 'G5457', sec: [{ w: 24, s: 'G846' }] },
      { pos: 20, mode: 'SBLGNT', w: 23, s: 'G2298' }
    ]
  }
];

function snapshotRow(book, ch, vs, pos) {
  const line = q(`SELECT wm.id||'|'||wm.ar_word||'|'||COALESCE(wm.strongs_id,'')||'|'||COALESCE(wm.orig_word_position,'')||'|'||COALESCE(wm.orig_word,'')||'|'||COALESCE(wm.orig_surface,'')||'|'||COALESCE(wm.orig_morphology,'')||'|'||COALESCE(wm.morph_pos,'')||'|'||COALESCE(wm.morph_tense,'')||'|'||COALESCE(wm.morph_voice,'')||'|'||COALESCE(wm.morph_mood,'')||'|'||COALESCE(wm.morph_person,'')||'|'||COALESCE(wm.morph_number,'')||'|'||COALESCE(wm.morph_gender,'')||'|'||COALESCE(wm.morph_case,'')||'|'||COALESCE(wm.morph_source,'')||'|'||COALESCE(wm.verified_locator,'')||'|'||COALESCE((SELECT GROUP_CONCAT(strongs_id||':'||link_role||'@w'||COALESCE(orig_word_position,'')||'['||COALESCE(orig_component,'')||']', ';') FROM (SELECT strongs_id, link_role, orig_word_position, orig_component FROM word_mapping_strongs WHERE mapping_id=wm.id ORDER BY link_order)),'') FROM word_mappings wm JOIN verses vr ON wm.verse_id=vr.id WHERE vr.book_id=${book} AND vr.chapter_num=${ch} AND vr.verse_num=${vs} AND wm.ar_word_position=${pos};`);
  const p = line.split('|');
  return {
    id: p[0], arWord: p[1], strongsId: p[2] || null, origWordPos: p[3] ? Number(p[3]) : null,
    origWord: p[4] || null, origSurface: p[5] || null, origMorph: p[6] || null,
    morphPos: p[7] || null, morphTense: p[8] || null, morphVoice: p[9] || null, morphMood: p[10] || null,
    morphPerson: p[11] || null, morphNumber: p[12] || null, morphGender: p[13] || null, morphCase: p[14] || null,
    morphSource: p[15] || null, verifiedLocator: p[16] || null, wms: p[17] || ''
  };
}

const comparisonRecords = [];
const sqlStmts = ['BEGIN TRANSACTION;'];

for (const vp of batchPlan) {
  const sblTokens = loadSblgntVerse(vp.book, vp.ch, vp.vs);
  const trTokens = loadTrVerse(vp.book, vp.ch, vp.vs);
  const verseId = q(`SELECT id FROM verses WHERE book_id=${vp.book} AND chapter_num=${vp.ch} AND verse_num=${vp.vs};`);

  for (const op of vp.ops) {
    const before = snapshotRow(vp.book, vp.ch, vp.vs, op.pos);
    let expected, sourceDesc, changeType;

    if (op.mode === 'AR_SYNTACTIC') {
      expected = {
        strongsId: null, origWordPos: 0, origWord: '—', origSurface: '—', origMorph: null,
        morphPos: 'syntactic_ar', morphStem: null, morphTense: null, morphVoice: null, morphMood: null,
        morphPerson: null, morphNumber: null, morphGender: null, morphCase: null,
        morphSource: 'syntactic_ar', verifiedLocator: `AR_SYNTACTIC:B${vp.book}.C${vp.ch}.V${vp.vs}.w${op.pos}`,
        wms: ''
      };
      sourceDesc = 'Arabic Syntactic Structure (Van Dyck translation alignment)';
      changeType = 'Reclassified to AR_SYNTACTIC & removed fabricated Greek link';
      sqlStmts.push(
        `UPDATE word_mappings SET strongs_id=NULL, orig_word_position=0, orig_word='—', orig_surface='—', orig_morphology=NULL, ` +
        `morph_pos='syntactic_ar', morph_stem=NULL, morph_tense=NULL, morph_voice=NULL, morph_mood=NULL, morph_person=NULL, morph_number=NULL, morph_gender=NULL, morph_case=NULL, ` +
        `morph_source='syntactic_ar', verified_locator=${esc(expected.verifiedLocator)}, relation_type='syntactic_construction', grammar_notes=${esc(op.note)} ` +
        `WHERE id=${esc(before.id)};`
      );
      sqlStmts.push(`DELETE FROM word_mapping_strongs WHERE mapping_id=${esc(before.id)};`);
    } else if (op.mode === 'SBLGNT') {
      const tok = sblTokens.find(t => t.w === op.w);
      if (!tok) throw new Error(`Missing SBLGNT ${vp.name} w${op.w}`);
      const d = deriveFromSblgnt(tok);
      const secList = (op.sec || []).map(sc => {
        const st = sblTokens.find(t => t.w === sc.w);
        if (!st) throw new Error(`Missing secondary SBLGNT ${vp.name} w${sc.w}`);
        return { strongsId: sc.s, w: sc.w, surface: st.surface, morph: st.morph, source: 'morphgnt_sblgnt' };
      });
      expected = {
        strongsId: op.s, origWordPos: op.w, origWord: tok.lemma, origSurface: tok.surface, origMorph: tok.morph,
        ...d, morphSource: 'morphgnt_sblgnt', verifiedLocator: `SBLGNT:B${vp.book}.C${vp.ch}.V${vp.vs}.w${op.w}`,
        wms: [`${op.s}:primary@w${op.w}[${tok.surface}]`, ...secList.map(x => `${x.strongsId}:secondary@w${x.w}[${x.surface}]`)].join(';')
      };
      sourceDesc = `SBLGNT MorphGNT w${op.w} (${tok.surface} | ${tok.lemma} | ${tok.morph})` + (secList.length ? ` + secondary w${secList.map(x=>x.w).join(',')}` : '');
      changeType = before.origWordPos !== op.w || before.strongsId !== op.s || before.morphSource !== 'morphgnt_sblgnt'
        ? `Aligned to SBLGNT w${op.w} (${op.s})`
        : `Completed secondary component / surface metadata at w${op.w}`;

      const relClause = op.keepRelation ? '' : `, relation_type=NULL, grammar_notes=NULL`;
      sqlStmts.push(
        `UPDATE word_mappings SET strongs_id=${esc(op.s)}, orig_word_position=${op.w}, orig_word=${esc(tok.lemma)}, orig_surface=${esc(tok.surface)}, orig_morphology=${esc(tok.morph)}, ` +
        `morph_pos=${esc(d.morphPos)}, morph_stem=NULL, morph_tense=${esc(d.morphTense)}, morph_voice=${esc(d.morphVoice)}, morph_mood=${esc(d.morphMood)}, morph_person=${esc(d.morphPerson)}, morph_number=${esc(d.morphNumber)}, morph_gender=${esc(d.morphGender)}, morph_case=${esc(d.morphCase)}, ` +
        `morph_source='morphgnt_sblgnt', verified_locator=${esc(expected.verifiedLocator)}, is_verified=1${relClause} WHERE id=${esc(before.id)};`
      );
      sqlStmts.push(`DELETE FROM word_mapping_strongs WHERE mapping_id=${esc(before.id)};`);
      sqlStmts.push(
        `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source) ` +
        `VALUES (${esc(before.id)}, ${esc(op.s)}, 1, 'primary', ${esc(tok.surface)}, ${op.w}, ${esc(tok.morph)}, 'morphgnt_sblgnt');`
      );
      secList.forEach((sc, idx) => {
        sqlStmts.push(
          `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source) ` +
          `VALUES (${esc(before.id)}, ${esc(sc.strongsId)}, ${idx + 2}, 'secondary', ${esc(sc.surface)}, ${sc.w}, ${esc(sc.morph)}, 'morphgnt_sblgnt');`
        );
      });
    } else if (op.mode === 'TR') {
      const tok = trTokens.find(t => t.w === op.w);
      if (!tok) throw new Error(`Missing TR ${vp.name} w${op.w}`);
      const d = deriveFromTr(tok);
      const trErr = verifyTrDerivedMorphology(tok.grammar, tok.grammar, d);
      if (trErr) throw new Error(`Pre-write TR validation failed on ${vp.name} #${op.pos}: ${trErr}`);
      expected = {
        strongsId: op.s, origWordPos: op.w, origWord: tok.lemma, origSurface: tok.surface, origMorph: tok.grammar,
        ...d, morphSource: 'morphgnt_tr', verifiedLocator: `TR:B${vp.book}.C${vp.ch}.V${vp.vs}.w${op.w}`,
        wms: `${op.s}:primary@w${op.w}[${tok.surface}]`
      };
      sourceDesc = `Scrivener TR w${op.w} (${tok.surface} | ${tok.lemma} | ${tok.strongsId} | Robinson ${tok.grammar})`;
      changeType = `Aligned to TR w${op.w} with literal Robinson code '${tok.grammar}' and derived fields`;
      sqlStmts.push(
        `UPDATE word_mappings SET strongs_id=${esc(op.s)}, orig_word_position=${op.w}, orig_word=${esc(tok.lemma)}, orig_surface=${esc(tok.surface)}, orig_morphology=${esc(tok.grammar)}, ` +
        `morph_pos=${esc(d.morphPos)}, morph_stem=NULL, morph_tense=${esc(d.morphTense)}, morph_voice=${esc(d.morphVoice)}, morph_mood=${esc(d.morphMood)}, morph_person=${esc(d.morphPerson)}, morph_number=${esc(d.morphNumber)}, morph_gender=${esc(d.morphGender)}, morph_case=${esc(d.morphCase)}, ` +
        `morph_source='morphgnt_tr', verified_locator=${esc(expected.verifiedLocator)}, is_verified=1, relation_type=NULL, grammar_notes=NULL WHERE id=${esc(before.id)};`
      );
      sqlStmts.push(`DELETE FROM word_mapping_strongs WHERE mapping_id=${esc(before.id)};`);
      sqlStmts.push(
        `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source) ` +
        `VALUES (${esc(before.id)}, ${esc(op.s)}, 1, 'primary', ${esc(tok.surface)}, ${op.w}, ${esc(tok.grammar)}, 'morphgnt_tr');`
      );
    }

    comparisonRecords.push({
      verse: vp.name,
      arPos: op.pos,
      arWord: before.arWord,
      existing: before,
      expected,
      source: sourceDesc,
      change: changeType
    });
  }
}

sqlStmts.push('COMMIT;');
const sqlText = sqlStmts.join('\n') + '\n';
execFileSync(sqlitePath, [dbPath], { input: sqlText, encoding: 'utf8' });

// Run holdout auditor after Batch 1 Greek into dedicated scratch report
const postOutPath = path.join(repoRoot, 'scratch/unseen_holdout_4axis_after_batch1_greek.json');
execFileSync(process.execPath, [path.join(__dirname, 'audit_unseen_holdout_sample.cjs'), '--out', postOutPath], { encoding: 'utf8' });
const postAudit = JSON.parse(fs.readFileSync(postOutPath, 'utf8'));

// Annotate each comparison record with post-repair test result
const alertLookup = new Set(postAudit.alerts.map(a => `${a.verse}#${a.pos}`));
for (const rec of comparisonRecords) {
  rec.testResult = alertLookup.has(`${rec.verse}#${rec.arPos}`) ? 'FAIL' : 'PASS';
}

const greekVersesAudit = postAudit.perVerse.filter(v => v.lang === 'greek');
const greekTotalClean = greekVersesAudit.reduce((s, v) => s + v.clean, 0);
const greekTotalUnits = greekVersesAudit.reduce((s, v) => s + v.total, 0);

const batchReport = {
  batch: 1,
  language: 'greek',
  order: batchPlan.map(v => v.name),
  preservedBaselineReference: 'scripts/unseen_holdout_4axis_v376.json',
  beforeCounts: {
    automatedClean: 18,
    manualClean: 14,
    totalUnits: 81
  },
  afterCounts: {
    clean: greekTotalClean,
    totalUnits: greekTotalUnits,
    cleanPct: Number(((greekTotalClean / greekTotalUnits) * 100).toFixed(2))
  },
  perVerseAfter: greekVersesAudit,
  exod2013ControlAfter: postAudit.perVerse.find(v => v.verse === 'Exod 20:13'),
  dbSha256AfterBatch: crypto.createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex'),
  records: comparisonRecords
};

const outCompPath = path.join(__dirname, 'batch1_greek_comparison.json');
fs.writeFileSync(outCompPath, JSON.stringify(batchReport, null, 2) + '\n', 'utf8');
console.log(`Batch 1 Greek applied: ${greekTotalClean}/${greekTotalUnits} (${batchReport.afterCounts.cleanPct}%) clean.`);
console.log('Per-verse after:', greekVersesAudit.map(v => `${v.verse}:${v.clean}/${v.total}`).join(', '));
console.log('Exod 20:13 control:', JSON.stringify(batchReport.exod2013ControlAfter));
console.log('Written comparison artifact:', outCompPath);
if (greekTotalClean !== greekTotalUnits) {
  console.error('Remaining Greek alerts:', postAudit.alerts.filter(a => a.lang === 'greek'));
  process.exit(1);
}
