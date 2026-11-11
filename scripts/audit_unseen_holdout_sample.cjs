/**
 * audit_unseen_holdout_sample.cjs
 * Read-only scientific measurement of NEW, untouched holdout verses across
 * Hebrew OT, Aramaic OT, and Greek NT (zero overlap with the 20-verse benchmark
 * or previously hand-audited test loci), evaluated directly against OSHB XML
 * and MorphGNT SBLGNT sources using the hardened 4-axis + derived-field rules.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = process.env.AUDIT_DB_PATH || (
  fs.existsSync(path.resolve(__dirname, '../mobile/assets/bible_study.db'))
    ? path.resolve(__dirname, '../mobile/assets/bible_study.db')
    : path.resolve(__dirname, '../bible_study.db')
);

function query(sql) {
  const tmpFile = path.resolve(__dirname, `temp_holdout_${Date.now()}_${Math.random().toString(36).slice(2)}.sql`);
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { encoding: 'utf8' }).replace(/\r/g, '').trim();
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

const oshbDir = path.resolve(__dirname, 'data/oshb');
function extractOshbVerse(bookName, osisRef) {
  const filePath = path.join(oshbDir, `${bookName}.xml`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const verseRegex = new RegExp(`<verse\\s+osisID="${osisRef}"[^>]*>([\\s\\S]*?)</verse>`);
  const match = content.match(verseRegex);
  if (!match) return null;
  const words = [];
  const wordRegex = /<w\s+([^>]+)>([\s\S]*?)<\/w>/g;
  let wMatch, idx = 1;
  while ((wMatch = wordRegex.exec(match[1])) !== null) {
    const attrs = wMatch[1];
    const rawText = wMatch[2].replace(/<[^>]+>/g, '').trim();
    words.push({
      index: idx++,
      id: (attrs.match(/id="([^"]+)"/) || [])[1] || null,
      lemma: (attrs.match(/lemma="([^"]+)"/) || [])[1] || null,
      morph: (attrs.match(/morph="([^"]+)"/) || [])[1] || null,
      text: rawText.replace(/\//g, ''),
      rawParts: rawText.split('/')
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

function extractSblgntVerse(bookId, ch, vs) {
  const fileName = sblgntBookMap[bookId];
  if (!fileName) return null;
  const content = fs.readFileSync(path.join(sblgntDir, fileName), 'utf8');
  const tokens = [];
  let idx = 1;
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 7) continue;
    const tag = parts[0];
    if (parseInt(tag.substring(2, 4), 10) === ch && parseInt(tag.substring(4, 6), 10) === vs) {
      tokens.push({
        index: idx++,
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

const normOshbSurface = s => (s || '').replace(/[\u0591-\u05AF\u05BD\u05BE׃\s/]/g, '').trim();
const normGreekSurface = s => (s || '').normalize('NFC').replace(/\u1F77/g, '\u03AF').replace(/[,.;·]/g, '').trim();

function morphMatches(dbMorph, sourceMorph) {
  if (!dbMorph || !sourceMorph) return false;
  if (dbMorph === sourceMorph) return true;
  const normDb = dbMorph.replace(/^H/, '');
  const normSrc = sourceMorph.replace(/^H/, '');
  if (normDb === normSrc) return true;
  if (sourceMorph.includes('/')) {
    return sourceMorph.split('/').map(p => p.replace(/^H/, '')).includes(normDb);
  }
  return false;
}

function verifyHebrewStrongsAgainstLemma(strongsId, lemmaStr, dbMorph) {
  if (!strongsId || !lemmaStr) return false;
  const numStr = strongsId.replace(/^[HG]/, '');
  if (strongsId === 'H9005') return (dbMorph === 'HR' || dbMorph === 'AR' || /^([HA]?R)/.test(dbMorph || '')) && lemmaStr.split('/').includes('l');
  if (strongsId === 'H9002') return (dbMorph === 'HC' || dbMorph === 'AC' || /^([HA]?C)/.test(dbMorph || '')) && lemmaStr.split('/').includes('c');
  if (strongsId === 'H9003') return (dbMorph === 'HR' || dbMorph === 'AR' || /^([HA]?R)/.test(dbMorph || '')) && lemmaStr.split('/').includes('b');
  if (strongsId === 'H9004') return (dbMorph === 'HR' || dbMorph === 'AR' || /^([HA]?R)/.test(dbMorph || '')) && lemmaStr.split('/').includes('k');
  if (strongsId === 'H9009') return (dbMorph === 'HTd' || /^HTd|Td/.test(dbMorph || '')) && lemmaStr.split('/').includes('d');
  if ((dbMorph === 'HR' || dbMorph === 'AR') && !['H9005','H9003','H9004','H413','H5921','H5922','H4480','H5973','H8478','H996','H310','H854','H5704','H5705'].includes(strongsId)) {
    return false;
  }
  for (const part of lemmaStr.split('/')) {
    const cleanPart = part.replace(/\s+[a-z]$/, '').trim();
    if (cleanPart === numStr) return true;
    if ((numStr === '1980' && cleanPart === '3212') || (numStr === '3212' && cleanPart === '1980')) return true;
    if (numStr === '4480' && cleanPart === 'm') return true;
  }
  return false;
}

function verifyDerived(lang, dbMorph, srcMorph, d) {
  const normPerson = p => ({ first: '1', second: '2', third: '3' }[p] || p || null);
  if (lang === 'greek') {
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
  if (segs.length === 2 && /^(HR|AR|R)$/.test(segs[0]) && /^Sp/.test(segs[1])) return null;
  const coreSeg = (segs.length >= 2 && /^Sp/.test(segs[segs.length - 1])) ? segs[segs.length - 2] : segs[segs.length - 1];
  const core = coreSeg.replace(/^[HA]/, '');
  const isAr = tag.startsWith('A') || lang === 'aramaic';
  const gMap = { m:'masculine', f:'feminine', b:'common', c:'common' };
  const nMap = { s:'singular', p:'plural', d:'dual' };
  if (core[0] === 'V') {
    if (d.morphPos !== 'verb') return `pos '${d.morphPos}' vs verb '${tag}'`;
    const stemMap = isAr
      ? { q:'peal', Q:'peil', p:'pael', P:'pael_passive', a:'aphel', A:'haphel_passive', h:'haphel', u:'hithpeel', t:'hithpaal', o:'polel', O:'polal', e:'ethpeel', i:'ithpaal' }
      : { q:'qal', Q:'qal_passive', N:'niphal', p:'piel', P:'pual', h:'hiphil', H:'hophal', t:'hithpael', o:'polel', O:'polal', c:'pilpel', C:'polpal' };
    if (stemMap[core[1]] && (d.morphStem || null) !== stemMap[core[1]]) return `stem '${d.morphStem}' vs '${stemMap[core[1]]}'`;
    const conj = core[2];
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
    }
  } else if ((core[0] === 'N' || core[0] === 'A') && core[1] !== 'p') {
    if ((d.morphGender || null) !== (gMap[core[2]] || null)) return `gender '${d.morphGender}' vs '${core[2]}'`;
    if ((d.morphNumber || null) !== (nMap[core[3]] || null)) return `number '${d.morphNumber}' vs '${core[3]}'`;
  }
  return null;
}

// Ensure NONE of these 15 holdout verses exist in batch_20_verses_manifest.json or automated_database_audit.cjs
const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'batch_20_verses_manifest.json'), 'utf8'));
const auditTxt = fs.readFileSync(path.resolve(__dirname, 'automated_database_audit.cjs'), 'utf8');

const holdoutVerses = [
  // OT Hebrew (5 untouched verses)
  { name: 'Exod 20:13', book: 2, ch: 20, vs: 13, lang: 'hebrew', oshbBook: 'Exod', oshbOsis: 'Exod.20.13' },
  { name: 'Deut 30:14', book: 5, ch: 30, vs: 14, lang: 'hebrew', oshbBook: 'Deut', oshbOsis: 'Deut.30.14' },
  { name: 'Josh 24:15', book: 6, ch: 24, vs: 15, lang: 'hebrew', oshbBook: 'Josh', oshbOsis: 'Josh.24.15' },
  { name: 'Prov 16:9',  book: 20, ch: 16, vs: 9, lang: 'hebrew', oshbBook: 'Prov', oshbOsis: 'Prov.16.9' },
  { name: 'Isa 55:8',   book: 23, ch: 55, vs: 8, lang: 'hebrew', oshbBook: 'Isa',  oshbOsis: 'Isa.55.8' },
  // OT Aramaic (4 untouched verses from Ezra & Daniel)
  { name: 'Ezra 4:12',  book: 15, ch: 4, vs: 12, lang: 'aramaic', oshbBook: 'Ezra', oshbOsis: 'Ezra.4.12' },
  { name: 'Ezra 6:14',  book: 15, ch: 6, vs: 14, lang: 'aramaic', oshbBook: 'Ezra', oshbOsis: 'Ezra.6.14' },
  { name: 'Dan 2:44',   book: 27, ch: 2, vs: 44, lang: 'aramaic', oshbBook: 'Dan',  oshbOsis: 'Dan.2.44' },
  { name: 'Dan 7:14',   book: 27, ch: 7, vs: 14, lang: 'aramaic', oshbBook: 'Dan',  oshbOsis: 'Dan.7.14' },
  // NT Greek (6 untouched verses across different NT books)
  { name: 'Mark 12:30', book: 41, ch: 12, vs: 30, lang: 'greek' },
  { name: 'Luke 19:10', book: 42, ch: 19, vs: 10, lang: 'greek' },
  { name: 'Rom 12:1',   book: 45, ch: 12, vs: 1,  lang: 'greek' },
  { name: 'Eph 6:11',   book: 49, ch: 6,  vs: 11, lang: 'greek' },
  { name: '1Thess 5:16',book: 52, ch: 5,  vs: 16, lang: 'greek' },
  { name: '1Pet 2:9',   book: 60, ch: 2,  vs: 9,  lang: 'greek' }
];

for (const hv of holdoutVerses) {
  if (manifest.verses.some(m => m.book === hv.book && m.ch === hv.ch && m.vs === hv.vs)) {
    throw new Error(`Holdout verse ${hv.name} overlaps batch_20_verses_manifest.json!`);
  }
  if (auditTxt.includes(hv.name) || auditTxt.includes(`book_id = ${hv.book} AND chapter_num = ${hv.ch} AND verse_num = ${hv.vs}`)) {
    throw new Error(`Holdout verse ${hv.name} overlaps automated_database_audit.cjs!`);
  }
}

console.log('========================================================================');
console.log('  UNSEEN HOLDOUT SAMPLE MEASUREMENT (15 UNTOUCHED VERSES, READ-ONLY)');
console.log('========================================================================\n');

const langStats = { hebrew: { total: 0, pass: 0, fail: 0 }, aramaic: { total: 0, pass: 0, fail: 0 }, greek: { total: 0, pass: 0, fail: 0 } };
const perVerseSummary = [];
const allFailures = [];

for (const v of holdoutVerses) {
  const tokens = v.lang === 'greek'
    ? extractSblgntVerse(v.book, v.ch, v.vs)
    : extractOshbVerse(v.oshbBook, v.oshbOsis);
  if (!tokens || tokens.length === 0) throw new Error(`Missing source tokens for ${v.name}`);

  const rowsRaw = query(`
    SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface,
           wm.morph_pos, wm.orig_morphology, wm.morph_gender, wm.morph_number, wm.morph_person,
           wm.morph_stem, wm.morph_mood, wm.orig_word_position, wm.verified_locator,
           wm.morph_tense, wm.morph_voice, wm.morph_case,
           (SELECT COUNT(*) FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id) as wms_cnt
    FROM word_mappings wm
    JOIN verses vr ON wm.verse_id = vr.id
    WHERE vr.book_id = ${v.book} AND vr.chapter_num = ${v.ch} AND vr.verse_num = ${v.vs}
    ORDER BY wm.ar_word_position ASC;
  `);

  const lines = rowsRaw.split('\n').filter(Boolean);
  let vPass = 0, vFail = 0;

  for (const line of lines) {
    const [posStr, arWord, strongsId, origWord, origSurface, morphPos, origMorph, morphGender, morphNumber, morphPerson, morphStem, morphMood, origPosStr, locator, morphTense, morphVoice, morphCase, wmsCntStr] = line.split('|');
    const arPos = parseInt(posStr, 10);
    const origPos = origPosStr ? parseInt(origPosStr, 10) : null;
    const wmsCnt = parseInt(wmsCntStr || '0', 10);
    const isSyntactic = morphPos === 'syntactic_ar' || (locator && locator.startsWith('AR_SYNTACTIC'));
    const reasons = [];

    if (isSyntactic) {
      if (strongsId) reasons.push(`syntactic has strongs '${strongsId}'`);
    } else {
      if (!strongsId) reasons.push('missing strongs_id');
      if (wmsCnt === 0) reasons.push('empty word_mapping_strongs');
      const mLoc = locator ? locator.match(/\.w(\d+)/) : null;
      const locIdx = mLoc ? parseInt(mLoc[1], 10) : null;
      if (!locator || !locIdx) reasons.push(`invalid locator '${locator}'`);
      else if (origPos !== locIdx) reasons.push(`origPos (${origPos}) != locator w${locIdx}`);
      const tok = locIdx ? tokens.find(t => t.index === locIdx) : null;
      if (!tok) {
        if (locIdx) reasons.push(`w${locIdx} exceeds token count (${tokens.length})`);
      } else if (v.lang === 'greek') {
        const dbGr = normGreekSurface(origSurface);
        if (!origSurface || ![tok.surfacePunct, tok.surfaceClean, tok.surfaceNorm].map(normGreekSurface).includes(dbGr)) {
          reasons.push(`surface '${origSurface}' != SBLGNT '${tok.surfaceClean}' @ w${locIdx}`);
        }
        if (origMorph && tok.morph && origMorph !== tok.morph) reasons.push(`morph '${origMorph}' != '${tok.morph}'`);
        if (origWord && tok.lemma && origWord !== tok.lemma) reasons.push(`lemma '${origWord}' != '${tok.lemma}'`);
        const dErr = verifyDerived('greek', origMorph, tok.morph, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase });
        if (dErr) reasons.push(`derived(${dErr})`);
      } else {
        const dbS = normOshbSurface(origSurface);
        const rawParts = tok.rawParts || [tok.text];
        const surfOk = origSurface && (dbS === normOshbSurface(tok.text) || rawParts.map(normOshbSurface).includes(dbS) || normOshbSurface(rawParts.slice(1).join('')) === dbS);
        if (!surfOk) reasons.push(`surface '${origSurface}' != OSHB '${tok.text}' @ w${locIdx}`);
        if (origMorph && tok.morph && !morphMatches(origMorph, tok.morph)) reasons.push(`morph '${origMorph}' != '${tok.morph}'`);
        if (strongsId && tok.lemma && !verifyHebrewStrongsAgainstLemma(strongsId, tok.lemma, origMorph)) {
          reasons.push(`strongs '${strongsId}' != lemma '${tok.lemma}'`);
        }
        const dErr = verifyDerived(v.lang, origMorph, tok.morph, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase });
        if (dErr) reasons.push(`derived(${dErr})`);
      }
    }

    langStats[v.lang].total++;
    if (reasons.length === 0) {
      langStats[v.lang].pass++;
      vPass++;
    } else {
      langStats[v.lang].fail++;
      vFail++;
      allFailures.push({ verse: v.name, lang: v.lang, pos: arPos, arWord, reasons });
    }
  }
  const vTot = vPass + vFail;
  const pct = vTot ? ((vPass / vTot) * 100).toFixed(1) : '0.0';
  perVerseSummary.push({ verse: v.name, lang: v.lang, total: vTot, pass: vPass, fail: vFail, pct });
  console.log(`  ${v.name.padEnd(12)} [${v.lang.padEnd(7)}]: ${String(vPass).padStart(2)}/${String(vTot).padEnd(2)} (${pct}%) | errors: ${vFail}`);
}

const grandTotal = langStats.hebrew.total + langStats.aramaic.total + langStats.greek.total;
const grandPass = langStats.hebrew.pass + langStats.aramaic.pass + langStats.greek.pass;
const grandFail = langStats.hebrew.fail + langStats.aramaic.fail + langStats.greek.fail;

console.log('\n--- LANGUAGE BREAKDOWN (UNSEEN HOLDOUT) ---');
for (const l of ['hebrew', 'aramaic', 'greek']) {
  const s = langStats[l];
  console.log(`  ${l.padEnd(8)}: ${s.pass}/${s.total} (${((s.pass / s.total) * 100).toFixed(2)}%) — ${s.fail} errors`);
}
console.log(`  OVERALL : ${grandPass}/${grandTotal} (${((grandPass / grandTotal) * 100).toFixed(2)}%) — ${grandFail} errors`);

console.log('\n--- SAMPLE ERROR DIAGNOSTICS (FIRST 25 FAILURES) ---');
for (const f of allFailures.slice(0, 25)) {
  console.log(`  [${f.verse} #${f.pos} ${f.arWord}]: ${f.reasons.join('; ')}`);
}

const reportOut = {
  dbSha256Hint: path.basename(dbPath),
  summary: { total: grandTotal, pass: grandPass, fail: grandFail, accuracyPct: Number(((grandPass / grandTotal) * 100).toFixed(2)) },
  byLanguage: langStats,
  perVerse: perVerseSummary,
  failures: allFailures
};
const outPath = path.resolve(__dirname, '../scratch/unseen_holdout_report_v376.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(reportOut, null, 2), 'utf8');
console.log(`\nWritten holdout report: ${outPath}`);
