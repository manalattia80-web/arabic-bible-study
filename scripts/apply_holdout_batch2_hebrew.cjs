/**
 * apply_holdout_batch2_hebrew.cjs
 * Batch 2 (Hebrew): Applies canonical OSHB + AR_SYNTACTIC repairs for the 4 defective Hebrew holdout verses
 * (Lev 19:18, Deut 8:3, Josh 24:15, Prov 16:9) while keeping Exod 20:13 strictly untouched as control.
 * Saves complete comparison artifact to scripts/batch2_hebrew_comparison.json.
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

function deriveFromOshb(morph, origPosHint) {
  const tag = (morph || '').trim();
  const empty = { morphPos: 'particle', morphStem: null, morphTense: null, morphVoice: null, morphMood: null, morphPerson: null, morphNumber: null, morphGender: null, morphCase: null };
  const segs = tag.split('/');
  if (segs.length === 1 && /^(HR|AR|R)$/.test(segs[0])) return { ...empty, morphPos: 'preposition' };
  if (segs.length === 2 && /^(HR|AR|R)$/.test(segs[0]) && /^Sp/.test(segs[1])) return { ...empty, morphPos: 'preposition' };
  if (/^(HC|AC|C)$/.test(segs[segs.length - 1])) return { ...empty, morphPos: 'conjunction' };
  if (/^H?T/.test(segs[segs.length - 1])) {
    const t = segs[segs.length - 1].replace(/^[HA]/, '');
    if (t === 'Tr') return { ...empty, morphPos: 'relative_pronoun' };
    return { ...empty, morphPos: 'particle' };
  }
  if (/^H?P/.test(segs[segs.length - 1])) return { ...empty, morphPos: 'pronoun' };

  const coreSeg = (segs.length >= 2 && /^Sp/.test(segs[segs.length - 1])) ? segs[segs.length - 2] : segs[segs.length - 1];
  const core = coreSeg.replace(/^[HA]/, '');
  const gMap = { m:'masculine', f:'feminine', b:'common', c:'common' };
  const nMap = { s:'singular', p:'plural', d:'dual' };
  const cMap = { c:'construct', a:'absolute' };

  if (core[0] === 'V') {
    const stemMap = { q:'qal', Q:'qal_passive', N:'niphal', p:'piel', P:'pual', h:'hiphil', H:'hophal', t:'hithpael', o:'polel', O:'polal', c:'pilpel', C:'polpal' };
    const conj = core[2];
    const tenseMap = { p:'qatal', q:'weqatal', i:'yiqtol', w:'wayyiqtol', j:'yiqtol', h:'yiqtol' };
    const moodMap = { p:'indicative', q:'indicative', i:'indicative', w:'indicative', v:'imperative', j:'jussive', h:'cohortative', r:'participle', s:'passive_participle', c:'infinitive_construct', a:'infinitive_absolute' };
    const voice = ('NQP H'.includes(core[1]) || conj === 's') ? 'passive' : null;
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

  if ((core[0] === 'N' || core[0] === 'A') && core[1] === 'p') {
    return { ...empty, morphPos: 'proper_noun' };
  }
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
    name: 'Lev 19:18', book: 3, ch: 19, vs: 18, oshbBook: 'Lev', oshbOsis: 'Lev.19.18',
    ops: [
      { pos: 5,  mode: 'AR_SYNTACTIC', rel: 'preposition_particle', note: 'حرف جر عربي لتعدية الفعل «لَا تَحْقِدْ عَلَى» (לֹא־תִטֹּר אֶת w4–w5)، ولا يقابله حرف الجر العبري H5921 (עַל).' },
      { pos: 8,  mode: 'AR_SYNTACTIC', rel: 'syntactic_construction', note: 'حرف إضراب/عطف عربي لمقابلة واو العطف الاستئنافية في וְאָהַבְתָּ (w8)، ولا يقابله وسم المفعولية H853 (אֶת).' },
      { pos: 9,  mode: 'OSHB', w: 8,  s: 'H157' },
      { pos: 10, mode: 'OSHB', w: 9,  s: 'H7453' },
      { pos: 11, mode: 'OSHB', w: 10, s: 'H3644' },
      { pos: 12, mode: 'OSHB', w: 11, s: 'H589' },
      { pos: 13, mode: 'OSHB', w: 12, s: 'H3068' }
    ]
  },
  {
    name: 'Deut 8:3', book: 5, ch: 8, vs: 3, oshbBook: 'Deut', oshbOsis: 'Deut.8.3',
    ops: [
      { pos: 4,  mode: 'OSHB', w: 5,  s: 'H4478', sec: [{ w: 4, s: 'H853' }] },
      { pos: 5,  mode: 'OSHB', w: 6,  s: 'H834' },
      { pos: 6,  mode: 'OSHB', w: 7,  s: 'H3808' },
      { pos: 7,  mode: 'AR_SYNTACTIC', rel: 'syntactic_construction', note: 'فعل ناقص في التركيب العربي «لَمْ تَكُنْ تَعْرِفُهُ» لترجمة الماضي التام יָדַעְתָּ (w8)، وليس H1961 (הָיָה) في النص العبري.' },
      { pos: 16, mode: 'OSHB', w: 17, s: 'H3899', sec: [{ w: 16, s: 'H5921' }] },
      { pos: 17, mode: 'OSHB', w: 18, s: 'H905' },
      { pos: 18, mode: 'OSHB', w: 19, s: 'H2421' },
      { pos: 19, mode: 'OSHB', w: 20, s: 'H120' },
      { pos: 20, mode: 'OSHB', w: 21, s: 'H3588' },
      { pos: 21, mode: 'OSHB', w: 23, s: 'H3605', sec: [{ w: 22, s: 'H5921' }] },
      { pos: 22, mode: 'AR_SYNTACTIC', rel: 'syntactic_construction', note: 'اسم موصول في الصياغة العربية «بِكُلِّ مَا يَخْرُجُ» لشرح الاسم المضاف מוֹצָא (w24)، وليس H834 (אֲשֶׁר).' },
      { pos: 23, mode: 'OSHB', w: 24, s: 'H4161' },
      { pos: 24, mode: 'AR_SYNTACTIC', rel: 'preposition_particle', note: 'حرف جر عربي لربط التركيب الإضافي מוֹצָא פִי־יְהוָה («يَخْرُجُ مِنْ فَمِ» w24–w25)، وليس H4480 (מִן).' }
    ]
  },
  {
    name: 'Josh 24:15', book: 6, ch: 24, vs: 15, oshbBook: 'Josh', oshbOsis: 'Josh.24.15',
    ops: [
      { pos: 4,  mode: 'OSHB', w: 3,  s: 'H5869' },
      { pos: 5,  mode: 'AR_SYNTACTIC', rel: 'syntactic_construction', note: 'حرف مصدري عربي لترجمة المصدر المضاف לַעֲבֹד (w4)، وليس H834 (אֲשֶׁר).' },
      { pos: 6,  mode: 'OSHB', w: 4,  s: 'H5647' },
      { pos: 7,  mode: 'OSHB', w: 6,  s: 'H3068', sec: [{ w: 5, s: 'H853' }] },
      { pos: 8,  mode: 'OSHB', w: 7,  s: 'H977' },
      { pos: 9,  mode: 'OSHB', w: 8,  s: 'H9005' },
      { pos: 10, mode: 'OSHB', w: 9,  s: 'H3117' },
      { pos: 13, mode: 'OSHB', w: 13, s: 'H518' },
      { pos: 14, mode: 'AR_SYNTACTIC', rel: 'syntactic_construction', note: 'فعل كون مساعد في التركيب العربي «إِنْ كَانَ» المقابل لأداة الشرط אִם (w13) وحدها.' },
      { pos: 24, mode: 'AR_SYNTACTIC', rel: 'syntactic_construction', note: 'فعل كون مساعد في التركيب العربي «وَإِنْ كَانَ» المقابل لأداة الشرط וְאִם (w23) وحدها.' },
      { pos: 31, mode: 'OSHB', w: 30, s: 'H776' },
      { pos: 32, mode: 'AR_SYNTACTIC', rel: 'syntactic_construction', note: 'أداة استئناف وحصر عربية لمقابلة واو المقابلة في וְאָנֹכִי (w31)، وليس H517 (אֵם).' },
      { pos: 33, mode: 'OSHB', w: 31, s: 'H595' },
      { pos: 34, mode: 'OSHB', w: 32, s: 'H1004' },
      { pos: 35, mode: 'OSHB', w: 33, s: 'H5647' },
      { pos: 36, mode: 'OSHB', w: 35, s: 'H3068', sec: [{ w: 34, s: 'H853' }] }
    ]
  },
  {
    name: 'Prov 16:9', book: 20, ch: 16, vs: 9, oshbBook: 'Prov', oshbOsis: 'Prov.16.9',
    ops: [
      { pos: 5, mode: 'OSHB', w: 4, s: 'H1870' },
      { pos: 6, mode: 'OSHB', w: 5, s: 'H3068' },
      { pos: 7, mode: 'OSHB', w: 6, s: 'H3559' },
      { pos: 8, mode: 'OSHB', w: 7, s: 'H6806' }
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

// Strict Exod 20:13 control hash before batch
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
      sourceDesc = 'Arabic Syntactic Structure (Van Dyck translation alignment)';
      changeType = 'Reclassified to AR_SYNTACTIC & removed fabricated Hebrew link';
      sqlStmts.push(
        `UPDATE word_mappings SET strongs_id=NULL, orig_word_position=0, orig_word='—', orig_surface='—', orig_morphology=NULL, ` +
        `morph_pos='syntactic_ar', morph_stem=NULL, morph_tense=NULL, morph_voice=NULL, morph_mood=NULL, morph_person=NULL, morph_number=NULL, morph_gender=NULL, morph_case=NULL, ` +
        `morph_source='syntactic_ar', verified_locator=${esc(expected.verifiedLocator)}, relation_type=${esc(op.rel)}, grammar_notes=${esc(op.note)} WHERE id=${esc(before.id)};`
      );
      sqlStmts.push(`DELETE FROM word_mapping_strongs WHERE mapping_id=${esc(before.id)};`);
    } else {
      const tok = oshbTokens.find(t => t.w === op.w);
      if (!tok) throw new Error(`Missing OSHB ${vp.name} w${op.w}`);
      const d = deriveFromOshb(tok.morph, op.w);
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
      changeType = `Aligned to OSHB w${op.w} (${op.s}, ${tok.morph})`;
      sqlStmts.push(
        `UPDATE word_mappings SET strongs_id=${esc(op.s)}, orig_word_position=${op.w}, orig_word=${esc(origW)}, orig_surface=${esc(tok.surface)}, orig_morphology=${esc(tok.morph)}, ` +
        `morph_pos=${esc(d.morphPos)}, morph_stem=${esc(d.morphStem)}, morph_tense=${esc(d.morphTense)}, morph_voice=${esc(d.morphVoice)}, morph_mood=${esc(d.morphMood)}, ` +
        `morph_person=${esc(d.morphPerson)}, morph_number=${esc(d.morphNumber)}, morph_gender=${esc(d.morphGender)}, morph_case=${esc(d.morphCase)}, ` +
        `morph_source='oshb_wlc', verified_locator=${esc(expected.verifiedLocator)}, is_verified=1, relation_type=NULL, grammar_notes=NULL WHERE id=${esc(before.id)};`
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

// Verify Exod 20:13 control strictly untouched
const exodControlAfter = q(`SELECT wm.ar_word_position||'|'||wm.ar_word||'|'||COALESCE(wm.strongs_id,'')||'|'||wm.orig_word_position||'|'||COALESCE(wm.orig_surface,'')||'|'||COALESCE(wm.orig_morphology,'')||'|'||COALESCE(wm.verified_locator,'')||'|'||COALESCE(wm.morph_source,'') FROM word_mappings wm JOIN verses vr ON wm.verse_id=vr.id WHERE vr.book_id=2 AND vr.chapter_num=20 AND vr.verse_num=13 ORDER BY wm.ar_word_position;`);
if (exodControlBefore !== exodControlAfter) throw new Error('CONTROL VIOLATION: Exod 20:13 was modified!');

const postOutPath = path.join(repoRoot, 'scratch/unseen_holdout_4axis_after_batch2_hebrew.json');
execFileSync(process.execPath, [path.join(__dirname, 'audit_unseen_holdout_sample.cjs'), '--out', postOutPath], { encoding: 'utf8' });
const postAudit = JSON.parse(fs.readFileSync(postOutPath, 'utf8'));
const alertLookup = new Set(postAudit.alerts.map(a => `${a.verse}#${a.pos}`));
for (const rec of comparisonRecords) rec.testResult = alertLookup.has(`${rec.verse}#${rec.arPos}`) ? 'FAIL' : 'PASS';

const hebVerses = postAudit.perVerse.filter(v => v.lang === 'hebrew');
const hebClean = hebVerses.reduce((s, v) => s + v.clean, 0);
const hebTotal = hebVerses.reduce((s, v) => s + v.total, 0);

const batchReport = {
  batch: 2,
  language: 'hebrew',
  controlVerse: 'Exod 20:13 (verified bitwise identical before/after)',
  order: ['Lev 19:18', 'Deut 8:3', 'Josh 24:15', 'Prov 16:9'],
  preservedBaselineReference: 'scripts/unseen_holdout_4axis_v376.json',
  beforeCounts: { automatedClean: 47, manualClean: 47, totalUnits: 87 },
  afterCounts: { clean: hebClean, totalUnits: hebTotal, cleanPct: Number(((hebClean / hebTotal) * 100).toFixed(2)) },
  perVerseAfter: hebVerses,
  dbSha256AfterBatch: crypto.createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex'),
  records: comparisonRecords
};
fs.writeFileSync(path.join(__dirname, 'batch2_hebrew_comparison.json'), JSON.stringify(batchReport, null, 2) + '\n', 'utf8');
console.log(`Batch 2 Hebrew applied: ${hebClean}/${hebTotal} (${batchReport.afterCounts.cleanPct}%) clean. Exod 20:13 control unchanged.`);
console.log('Per-verse after:', hebVerses.map(v => `${v.verse}:${v.clean}/${v.total}`).join(', '));
if (hebClean !== hebTotal) {
  console.error('Remaining Hebrew alerts:', postAudit.alerts.filter(a => a.lang === 'hebrew'));
  process.exit(1);
}
