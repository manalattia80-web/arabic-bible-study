/**
 * apply_holdout_batch3_aramaic.cjs
 * Batch 3 (Aramaic): Applies canonical OSHB + AR_SYNTACTIC repairs for the 4 Aramaic holdout verses
 * (Ezra 4:12, Ezra 6:14, Ezra 7:12, Dan 2:44), eliminating all strongs_lexicon leaks, Hebrew/Aramaic mix-ups,
 * and positional shifts, with explicit Ketiv/Qere documentation.
 * Keeps Exod 20:13 strictly untouched and saves comparison artifact to scripts/batch3_aramaic_comparison.json.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const q = sql => execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
const esc = s => (s === null || s === undefined) ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;

function loadOshbVerse(bookName, osisRef) {
  const xml = fs.readFileSync(path.join(__dirname, 'data/oshb', `${bookName}.xml`), 'utf8');
  const m = xml.match(new RegExp(`<verse\\s+osisID="${osisRef}"[^>]*>([\\s\\S]*?)</verse>`));
  if (!m) throw new Error(`OSHB verse not found: ${osisRef}`);
  const out = [];
  const re = /<w\s+([^>]+)>([\s\S]*?)<\/w>/g;
  let w, idx = 1;
  while ((w = re.exec(m[1])) !== null) {
    const attrs = w[1];
    out.push({
      w: idx++,
      lemma: (attrs.match(/lemma="([^"]+)"/) || [])[1] || '',
      morph: (attrs.match(/morph="([^"]+)"/) || [])[1] || '',
      surface: w[2].replace(/<[^>]+>/g, '').trim().replace(/\//g, '')
    });
  }
  return out;
}

function deriveFromAramaicOshb(morph) {
  const tag = (morph || '').trim();
  const empty = { morphPos: 'particle', morphStem: null, morphTense: null, morphVoice: null, morphMood: null, morphPerson: null, morphNumber: null, morphGender: null, morphCase: null };
  const segs = tag.split('/');
  const lastSeg = segs[segs.length - 1];
  if (segs.length === 1 && /^(HR|AR|R)$/.test(lastSeg)) return { ...empty, morphPos: 'preposition' };
  if (segs.length === 2 && /^(HR|AR|R)$/.test(segs[0]) && /^Sp/.test(segs[1])) return { ...empty, morphPos: 'preposition' };
  if (/^(HC|AC|C)$/.test(lastSeg)) return { ...empty, morphPos: 'conjunction' };
  if (/^[HA]?D$/.test(lastSeg)) return { ...empty, morphPos: 'adverb' };
  if (/^[HA]?T/.test(lastSeg)) {
    const t = lastSeg.replace(/^[HA]/, '');
    if (t === 'Tr') return { ...empty, morphPos: 'relative_pronoun' };
    return { ...empty, morphPos: 'particle' };
  }
  if (/^[HA]?P/.test(lastSeg)) return { ...empty, morphPos: 'pronoun' };

  const coreSeg = (segs.length >= 2 && /^Sp/.test(lastSeg)) ? segs[segs.length - 2] : lastSeg;
  const core = coreSeg.replace(/^[HA]/, '');
  const gMap = { m:'masculine', f:'feminine', b:'common', c:'common' };
  const nMap = { s:'singular', p:'plural', d:'dual' };
  const cMap = { c:'construct', a:'absolute' };

  if (core[0] === 'V') {
    const stemMap = { q:'peal', Q:'peil', p:'pael', P:'pael_passive', a:'aphel', A:'haphel_passive', h:'haphel', u:'hithpeel', t:'hithpaal', M:'hithpaal', o:'polel', O:'polal', e:'shaphel', i:'ithpaal' };
    const conj = core[2];
    const tenseMap = { p:'qatal', q:'weqatal', i:'yiqtol', w:'wayyiqtol', j:'yiqtol', h:'yiqtol' };
    const moodMap = { p:'indicative', q:'indicative', i:'indicative', w:'indicative', v:'imperative', j:'jussive', h:'cohortative', r:'participle', s:'passive_participle', c:'infinitive_construct', a:'infinitive_absolute' };
    const voice = (core[1] === 'Q' || core[1] === 'u' || core[1] === 'P' || core[1] === 'A' || core[1] === 'i' || conj === 's') ? 'passive' : null;
    const out = { ...empty, morphPos: 'verb', morphStem: stemMap[core[1]] || null, morphTense: tenseMap[conj] || null, morphVoice: voice, morphMood: moodMap[conj] || null };
    if ('pqiwjhv'.includes(conj)) {
      out.morphPerson = ['1','2','3'].includes(core[3]) ? core[3] : null;
      out.morphGender = gMap[core[4]] || null;
      out.morphNumber = nMap[core[5]] || null;
    } else if (conj === 'r' || conj === 's') {
      out.morphGender = gMap[core[3]] || null;
      out.morphNumber = nMap[core[4]] || null;
      out.morphCase = cMap[core[5]] || null;
    }
    return out;
  }

  if ((core[0] === 'N' || core[0] === 'A') && core[1] === 'p') return { ...empty, morphPos: 'proper_noun' };
  if (core[0] === 'N' || core[0] === 'A') {
    return {
      ...empty,
      morphPos: core[0] === 'A' ? 'adjective' : 'noun',
      morphGender: gMap[core[2]] || null,
      morphNumber: nMap[core[3]] || null,
      morphCase: cMap[core[4]] || null
    };
  }
  return empty;
}

const strongsRootMap = new Map();
for (const l of q("SELECT strongs_id||'|'||COALESCE(original_word,'') FROM strongs_entries WHERE strongs_id LIKE 'H%';").split('\n')) {
  if (!l) continue;
  const [id, orig] = l.split('|');
  strongsRootMap.set(id, orig);
}

const batchPlan = [
  {
    name: 'Ezra 4:12', book: 15, ch: 4, vs: 12, oshbBook: 'Ezra', oshbOsis: 'Ezra.4.12',
    ops: [
      { pos: 1,  mode: 'OSHB', w: 1,  s: 'H3046', sec: [{ w: 2, s: 'H1934' }], note: 'يدمج التركيب العربي «لِيُعْلَمِ» الوصفَ المجهول יְדִיעַ (H3046 @ w1, AVQsmsa Peil passive participle) مع فعل الكينونة לֶהֱוֵא (H1934 @ w2).' },
      { pos: 2,  mode: 'OSHB', w: 3,  s: 'H4430' },
      { pos: 3,  mode: 'OSHB', w: 4,  s: 'H1768' },
      { pos: 4,  mode: 'OSHB', w: 5,  s: 'H3062' },
      { pos: 5,  mode: 'OSHB', w: 6,  s: 'H1768' },
      { pos: 6,  mode: 'OSHB', w: 7,  s: 'H5559' },
      { pos: 7,  mode: 'OSHB', w: 8,  s: 'H4481' },
      { pos: 8,  mode: 'OSHB', w: 9,  s: 'H3890' },
      { pos: 9,  mode: 'OSHB', w: 10, s: 'H5922' },
      { pos: 13, mode: 'OSHB', w: 12, s: 'H3390' },
      { pos: 14, mode: 'OSHB', w: 17, s: 'H1124' },
      { pos: 15, mode: 'OSHB', w: 13, s: 'H7149' },
      { pos: 16, mode: 'OSHB', w: 14, s: 'H4779' },
      { pos: 17, mode: 'OSHB', w: 16, s: 'H873',  note: 'القراءة المقروءة (Qere @ w16): וּבִישְׁתָּא؛ والمكتوبة (Ketiv @ w15): ובאישתא.' },
      { pos: 19, mode: 'OSHB', w: 21, s: 'H3635', note: 'القراءة المقروءة (Qere @ w21): שַׁכְלִילוּ (AVep3mp)؛ والمكتوبة (Ketiv @ w20): אשכללו.' },
      { pos: 20, mode: 'OSHB', w: 19, s: 'H7792', note: 'القراءة المقروءة (Qere @ w19): וְשׁוּרַיָּא؛ والمكتوبة (Ketiv @ w18): ושורי.' },
      { pos: 21, mode: 'OSHB', w: 23, s: 'H2338' }
    ]
  },
  {
    name: 'Ezra 6:14', book: 15, ch: 6, vs: 14, oshbBook: 'Ezra', oshbOsis: 'Ezra.6.14',
    ops: [
      { pos: 1,  mode: 'AR_SYNTACTIC', rel: 'syntactic_construction', note: 'فعل كون سردي في افتتاح الآية العربية لمقابلة الجملة الاسمية الآرامية וְשָׂבֵי יְהוּדָיֵא בָּנַיִן (w1–w3)، ولا يقابله فعل הָוָא (H1934) في الآية.' },
      { pos: 2,  mode: 'OSHB', w: 1,  s: 'H7868' },
      { pos: 3,  mode: 'OSHB', w: 2,  s: 'H3062' },
      { pos: 4,  mode: 'OSHB', w: 3,  s: 'H1124' },
      { pos: 5,  mode: 'OSHB', w: 4,  s: 'H6744' },
      { pos: 6,  mode: 'AR_SYNTACTIC', rel: 'preposition_particle', note: 'تعبير عربي مقابل لباء الجر المتصلة في בִּנְבוּאַת (w5)، ولا يقابله H2942 (טְעֵם) الموضع w18.' },
      { pos: 7,  mode: 'OSHB', w: 5,  s: 'H5017' },
      { pos: 8,  mode: 'OSHB', w: 6,  s: 'H2292' },
      { pos: 9,  mode: 'OSHB', w: 8,  s: 'H5029', note: 'القراءة المقروءة (Qere @ w8): נְבִיָּא؛ والمكتوبة (Ketiv @ w7): נביאה.' },
      { pos: 10, mode: 'OSHB', w: 9,  s: 'H2148' },
      { pos: 11, mode: 'OSHB', w: 10, s: 'H1247' },
      { pos: 12, mode: 'OSHB', w: 11, s: 'H5714' },
      { pos: 13, mode: 'OSHB', w: 12, s: 'H1124' },
      { pos: 14, mode: 'OSHB', w: 13, s: 'H3635' },
      { pos: 15, mode: 'OSHB', w: 14, s: 'H4481' },
      { pos: 16, mode: 'OSHB', w: 15, s: 'H2941' },
      { pos: 17, mode: 'OSHB', w: 16, s: 'H426' },
      { pos: 18, mode: 'OSHB', w: 17, s: 'H3479' },
      { pos: 19, mode: 'OSHB', w: 18, s: 'H2942' },
      { pos: 20, mode: 'OSHB', w: 19, s: 'H3567' },
      { pos: 21, mode: 'OSHB', w: 20, s: 'H1868' },
      { pos: 22, mode: 'OSHB', w: 21, s: 'H783' },
      { pos: 23, mode: 'OSHB', w: 22, s: 'H4430' },
      { pos: 24, mode: 'OSHB', w: 23, s: 'H6540' }
    ]
  },
  {
    name: 'Ezra 7:12', book: 15, ch: 7, vs: 12, oshbBook: 'Ezra', oshbOsis: 'Ezra.7.12',
    ops: [
      { pos: 1,  mode: 'AR_SYNTACTIC', rel: 'preposition_particle', note: 'حرف ابتداء رسائلي في الصياغة العربية قبل اسم الملك אַרְתַּחְשַׁסְתְּא (w1)، ولا يقابله H4481 (מִן) في الأصل الآرامي.' },
      { pos: 2,  mode: 'OSHB', w: 1,  s: 'H783' },
      { pos: 3,  mode: 'OSHB', w: 2,  s: 'H4430' },
      { pos: 4,  mode: 'OSHB', w: 3,  s: 'H4430' },
      { pos: 6,  mode: 'OSHB', w: 4,  s: 'H5831' },
      { pos: 7,  mode: 'OSHB', w: 5,  s: 'H3549' },
      { pos: 8,  mode: 'OSHB', w: 6,  s: 'H5613' },
      { pos: 9,  mode: 'OSHB', w: 7,  s: 'H1882', sec: [{ w: 8, s: 'H1768' }] },
      { pos: 10, mode: 'OSHB', w: 9,  s: 'H426' },
      { pos: 11, mode: 'OSHB', w: 10, s: 'H8065' },
      { pos: 12, mode: 'OSHB', w: 11, s: 'H1585' },
      { pos: 14, mode: 'OSHB', w: 12, s: 'H3706' }
    ]
  },
  {
    name: 'Dan 2:44', book: 27, ch: 2, vs: 44, oshbBook: 'Dan', oshbOsis: 'Dan.2.44',
    ops: [
      { pos: 2,  mode: 'OSHB', w: 1,  s: 'H3118', sec: [{ w: 2, s: 'H1768' }] },
      { pos: 3,  mode: 'OSHB', w: 4,  s: 'H581' },
      { pos: 4,  mode: 'OSHB', w: 3,  s: 'H4430' },
      { pos: 9,  mode: 'OSHB', w: 11, s: 'H3809', sec: [{ w: 9, s: 'H1768' }] },
      { pos: 10, mode: 'OSHB', w: 12, s: 'H2255' },
      { pos: 11, mode: 'OSHB', w: 10, s: 'H5957' },
      { pos: 12, mode: 'OSHB', w: 13, s: 'H4437' },
      { pos: 13, mode: 'OSHB', w: 16, s: 'H3809' },
      { pos: 14, mode: 'OSHB', w: 17, s: 'H7662' },
      { pos: 15, mode: 'OSHB', w: 14, s: 'H5972' },
      { pos: 16, mode: 'OSHB', w: 15, s: 'H321' },
      { pos: 17, mode: 'OSHB', w: 18, s: 'H1855' },
      { pos: 18, mode: 'OSHB', w: 19, s: 'H5487' },
      { pos: 19, mode: 'OSHB', w: 20, s: 'H3606' },
      { pos: 20, mode: 'OSHB', w: 21, s: 'H459' },
      { pos: 21, mode: 'OSHB', w: 22, s: 'H4437' },
      { pos: 22, mode: 'OSHB', w: 23, s: 'H1932' },
      { pos: 23, mode: 'OSHB', w: 24, s: 'H6966' },
      { pos: 24, mode: 'AR_SYNTACTIC', rel: 'preposition_particle', note: 'حرف جر عربي مستقل لترجمة لام الجر المتصلة في לְעָלְמַיָּא (w25)، وليس الحرف العبري H413 (אֵל).' }
    ]
  }
];

function snapshotRow(book, ch, vs, pos) {
  const line = q(`SELECT wm.id||'|'||wm.ar_word||'|'||COALESCE(wm.strongs_id,'')||'|'||COALESCE(wm.orig_word_position,'')||'|'||COALESCE(wm.orig_word,'')||'|'||COALESCE(wm.orig_surface,'')||'|'||COALESCE(wm.orig_morphology,'')||'|'||COALESCE(wm.morph_pos,'')||'|'||COALESCE(wm.morph_stem,'')||'|'||COALESCE(wm.morph_tense,'')||'|'||COALESCE(wm.morph_voice,'')||'|'||COALESCE(wm.morph_mood,'')||'|'||COALESCE(wm.morph_person,'')||'|'||COALESCE(wm.morph_number,'')||'|'||COALESCE(wm.morph_gender,'')||'|'||COALESCE(wm.morph_case,'')||'|'||COALESCE(wm.morph_source,'')||'|'||COALESCE(wm.verified_locator,'')||'|'||COALESCE((SELECT GROUP_CONCAT(strongs_id||':'||link_role||'@w'||COALESCE(orig_word_position,'')||'['||COALESCE(orig_component,'')||']', ';') FROM (SELECT strongs_id, link_role, orig_word_position, orig_component FROM word_mapping_strongs WHERE mapping_id=wm.id ORDER BY link_order)),'') FROM word_mappings wm JOIN verses vr ON wm.verse_id=vr.id WHERE vr.book_id=${book} AND vr.chapter_num=${ch} AND vr.verse_num=${vs} AND wm.ar_word_position=${pos};`);
  const p = line.split('|');
  return {
    id: p[0], arWord: p[1], strongsId: p[2] || null, origWordPos: p[3] ? Number(p[3]) : null,
    origWord: p[4] || null, origSurface: p[5] || null, origMorph: p[6] || null,
    morphPos: p[7] || null, morphStem: p[8] || null, morphTense: p[9] || null, morphVoice: p[10] || null,
    morphMood: p[11] || null, morphPerson: p[12] || null, morphNumber: p[13] || null, morphGender: p[14] || null,
    morphCase: p[15] || null, morphSource: p[16] || null, verifiedLocator: p[17] || null, wms: p[18] || ''
  };
}

const exodControlBefore = q(`SELECT wm.ar_word_position||'|'||wm.ar_word||'|'||COALESCE(wm.strongs_id,'')||'|'||wm.orig_word_position||'|'||COALESCE(wm.orig_surface,'')||'|'||COALESCE(wm.orig_morphology,'')||'|'||COALESCE(wm.verified_locator,'')||'|'||COALESCE(wm.morph_source,'') FROM word_mappings wm JOIN verses vr ON wm.verse_id=vr.id WHERE vr.book_id=2 AND vr.chapter_num=20 AND vr.verse_num=13 ORDER BY wm.ar_word_position;`);

const comparisonRecords = [];
const sqlStmts = ['BEGIN TRANSACTION;'];

for (const vp of batchPlan) {
  const oshbTokens = loadOshbVerse(vp.oshbBook, vp.oshbOsis);
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
      sourceDesc = 'Arabic Syntactic Structure (Van Dyck Aramaic alignment)';
      changeType = 'Reclassified to AR_SYNTACTIC & removed fabricated Aramaic/Hebrew link';
      sqlStmts.push(
        `UPDATE word_mappings SET strongs_id=NULL, orig_word_position=0, orig_word='—', orig_surface='—', orig_morphology=NULL, ` +
        `morph_pos='syntactic_ar', morph_stem=NULL, morph_tense=NULL, morph_voice=NULL, morph_mood=NULL, morph_person=NULL, morph_number=NULL, morph_gender=NULL, morph_case=NULL, ` +
        `morph_source='syntactic_ar', verified_locator=${esc(expected.verifiedLocator)}, relation_type=${esc(op.rel)}, grammar_notes=${esc(op.note)} WHERE id=${esc(before.id)};`
      );
      sqlStmts.push(`DELETE FROM word_mapping_strongs WHERE mapping_id=${esc(before.id)};`);
    } else {
      const tok = oshbTokens.find(t => t.w === op.w);
      if (!tok) throw new Error(`Missing OSHB ${vp.name} w${op.w}`);
      const d = deriveFromAramaicOshb(tok.morph);
      const origW = strongsRootMap.get(op.s) || tok.surface;
      const secList = (op.sec || []).map(sc => {
        const st = oshbTokens.find(t => t.w === sc.w);
        if (!st) throw new Error(`Missing secondary OSHB ${vp.name} w${sc.w}`);
        return { strongsId: sc.s, w: sc.w, surface: st.surface, morph: st.morph };
      });
      expected = {
        strongsId: op.s, origWordPos: op.w, origWord: origW, origSurface: tok.surface, origMorph: tok.morph,
        ...d, morphSource: 'oshb_wlc', verifiedLocator: `OSHB:B${vp.book}.C${vp.ch}.V${vp.vs}.w${op.w}`,
        wms: [`${op.s}:primary@w${op.w}[${tok.surface}]`, ...secList.map(x => `${x.strongsId}:secondary@w${x.w}[${x.surface}]`)].join(';')
      };
      sourceDesc = `OSHB WLC w${op.w} (${tok.surface} | lemma=${tok.lemma} | ${tok.morph})` + (secList.length ? ` + secondary w${secList.map(x=>x.w).join(',')}` : '');
      changeType = `Aligned to Aramaic OSHB w${op.w} (${op.s}, ${tok.morph}, provenance oshb_wlc)`;
      sqlStmts.push(
        `UPDATE word_mappings SET strongs_id=${esc(op.s)}, orig_word_position=${op.w}, orig_word=${esc(origW)}, orig_surface=${esc(tok.surface)}, orig_morphology=${esc(tok.morph)}, ` +
        `morph_pos=${esc(d.morphPos)}, morph_stem=${esc(d.morphStem)}, morph_tense=${esc(d.morphTense)}, morph_voice=${esc(d.morphVoice)}, morph_mood=${esc(d.morphMood)}, ` +
        `morph_person=${esc(d.morphPerson)}, morph_number=${esc(d.morphNumber)}, morph_gender=${esc(d.morphGender)}, morph_case=${esc(d.morphCase)}, ` +
        `morph_source='oshb_wlc', verified_locator=${esc(expected.verifiedLocator)}, is_verified=1, relation_type=NULL, grammar_notes=${esc(op.note || null)} WHERE id=${esc(before.id)};`
      );
      sqlStmts.push(`DELETE FROM word_mapping_strongs WHERE mapping_id=${esc(before.id)};`);
      sqlStmts.push(
        `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source) ` +
        `VALUES (${esc(before.id)}, ${esc(op.s)}, 1, 'primary', ${esc(tok.surface)}, ${op.w}, ${esc(tok.morph)}, 'oshb_wlc');`
      );
      secList.forEach((sc, idx) => {
        sqlStmts.push(
          `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source) ` +
          `VALUES (${esc(before.id)}, ${esc(sc.strongsId)}, ${idx + 2}, 'secondary', ${esc(sc.surface)}, ${sc.w}, ${esc(sc.morph)}, 'oshb_wlc');`
        );
      });
    }
    comparisonRecords.push({ verse: vp.name, arPos: op.pos, arWord: before.arWord, existing: before, expected, source: sourceDesc, change: changeType });
  }
}

sqlStmts.push('COMMIT;');
execFileSync(sqlitePath, [dbPath], { input: sqlStmts.join('\n') + '\n', encoding: 'utf8' });

const exodControlAfter = q(`SELECT wm.ar_word_position||'|'||wm.ar_word||'|'||COALESCE(wm.strongs_id,'')||'|'||wm.orig_word_position||'|'||COALESCE(wm.orig_surface,'')||'|'||COALESCE(wm.orig_morphology,'')||'|'||COALESCE(wm.verified_locator,'')||'|'||COALESCE(wm.morph_source,'') FROM word_mappings wm JOIN verses vr ON wm.verse_id=vr.id WHERE vr.book_id=2 AND vr.chapter_num=20 AND vr.verse_num=13 ORDER BY wm.ar_word_position;`);
if (exodControlBefore !== exodControlAfter) throw new Error('CONTROL VIOLATION: Exod 20:13 was modified!');

const postOutPath = path.join(repoRoot, 'scratch/unseen_holdout_4axis_after_batch3_aramaic.json');
execFileSync(process.execPath, [path.join(__dirname, 'audit_unseen_holdout_sample.cjs'), '--out', postOutPath], { encoding: 'utf8' });
const postAudit = JSON.parse(fs.readFileSync(postOutPath, 'utf8'));
const alertLookup = new Set(postAudit.alerts.map(a => `${a.verse}#${a.pos}`));
for (const rec of comparisonRecords) rec.testResult = alertLookup.has(`${rec.verse}#${rec.arPos}`) ? 'FAIL' : 'PASS';

const aramVerses = postAudit.perVerse.filter(v => v.lang === 'aramaic');
const aramClean = aramVerses.reduce((s, v) => s + v.clean, 0);
const aramTotal = aramVerses.reduce((s, v) => s + v.total, 0);

const batchReport = {
  batch: 3,
  language: 'aramaic',
  controlVerse: 'Exod 20:13 (verified bitwise identical before/after)',
  order: ['Ezra 4:12', 'Ezra 6:14', 'Ezra 7:12', 'Dan 2:44'],
  preservedBaselineReference: 'scripts/unseen_holdout_4axis_v376.json',
  beforeCounts: { automatedClean: 14, manualClean: 14, totalUnits: 85 },
  afterCounts: { clean: aramClean, totalUnits: aramTotal, cleanPct: Number(((aramClean / aramTotal) * 100).toFixed(2)) },
  perVerseAfter: aramVerses,
  all15VersesAfterSummary: postAudit.summary,
  all15VersesByLanguageAfter: postAudit.byLanguage,
  dbSha256AfterBatch: crypto.createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex'),
  records: comparisonRecords
};
fs.writeFileSync(path.join(__dirname, 'batch3_aramaic_comparison.json'), JSON.stringify(batchReport, null, 2) + '\n', 'utf8');
console.log(`Batch 3 Aramaic applied: ${aramClean}/${aramTotal} (${batchReport.afterCounts.cleanPct}%) clean.`);
console.log('Per-verse after:', aramVerses.map(v => `${v.verse}:${v.clean}/${v.total}`).join(', '));
console.log('All 15 holdout verses summary after Batch 3:', JSON.stringify(postAudit.summary));
if (aramClean !== aramTotal || postAudit.summary.cleanUnits !== postAudit.summary.totalUnits) {
  console.error('Remaining alerts:', postAudit.alerts);
  process.exit(1);
}
