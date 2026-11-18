/**
 * audit_unseen_holdout_sample.cjs
 * Calibrated Read-Only 4-Axis Audit of 15 Strictly Unseen (0% Historical Overlap) Verses
 * across OT Hebrew, OT Aramaic, and NT Greek.
 *
 * Calibrations (v1.0.376+):
 *   1. Enforces 0% overlap against ALL 2,606 historical targets/patches across the repo.
 *   2. Normalizes Unicode combining mark order cleanly (zero Unicode-order false alerts).
 *   3. Respects recorded source edition provenance: checks SBLGNT (MorphGNT) vs
 *      Scrivener TR (gnt_scrivener.json) vs OSHB WLC XML vs AR_SYNTACTIC.
 *   4. Audits EVERY secondary component inside word_mapping_strongs + Greek Strong's <-> lexicon match.
 *   5. Outputs structured 4-Axis scores (lexical, lemmaSurface, morphology, sourceLocator)
 *      per unit, per verse, and per language.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { verifyTrDerivedMorphology } = require('./robinson_tr_helper.cjs');
const { validateCanonicalLocator } = require('./locator_validator_helper.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sha256Str = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = process.env.AUDIT_DB_PATH || (
  fs.existsSync(path.join(repoRoot, 'mobile/assets/bible_study.db'))
    ? path.join(repoRoot, 'mobile/assets/bible_study.db')
    : path.join(repoRoot, 'bible_study.db')
);

function query(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

// ---------------------------------------------------------------------------
// 1. Canonical Unicode Normalization (eliminates diacritic-order false alerts)
// ---------------------------------------------------------------------------
function canonHebSurface(s) {
  if (!s) return '';
  // Strip cantillation marks [0591-05AF], meteg [05BD], maqaf [05BE], sof pasuq, spaces, slashes
  const cleaned = s.normalize('NFC').replace(/[\u0591-\u05AF\u05BD\u05BE׃\s/]/g, '');
  // Canonically sort combining Hebrew diacritic clusters [05B0-05C7] after each base consonant
  let out = '';
  let cluster = [];
  for (const ch of cleaned) {
    const code = ch.charCodeAt(0);
    if (code >= 0x05B0 && code <= 0x05C7) {
      cluster.push(ch);
    } else {
      if (cluster.length) {
        cluster.sort();
        out += cluster.join('');
        cluster = [];
      }
      out += ch;
    }
  }
  if (cluster.length) {
    cluster.sort();
    out += cluster.join('');
  }
  return out.trim();
}

function normGreekWord(s) {
  if (!s) return '';
  return s.normalize('NFC')
    .replace(/\u1F71/g, '\u03AC').replace(/\u1F73/g, '\u03AD').replace(/\u1F75/g, '\u03AE')
    .replace(/\u1F77/g, '\u03AF').replace(/\u1F79/g, '\u03CC').replace(/\u1F7B/g, '\u03CD')
    .replace(/\u1F7D/g, '\u03CE')
    .replace(/[,.;·’'᾽\-]/g, '')
    .trim();
}

function normGreekPolytonicFold(s) {
  return normGreekWord(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC').toLowerCase();
}

// ---------------------------------------------------------------------------
// 2. Source Extractors (OSHB XML, SBLGNT MorphGNT, Scrivener TR)
// ---------------------------------------------------------------------------
const oshbDir = path.join(__dirname, 'data/oshb');
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

const sblgntDir = path.join(__dirname, 'data/sblgnt');
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

const trBookOsisMap = {
  41: 'Mark', 42: 'Luke', 45: 'Rom', 48: 'Gal', 49: 'Eph', 50: 'Phil', 52: '1Thess', 60: '1Pet'
};
const trFullPath = path.join(__dirname, 'data/gnt_scrivener.json');
const defaultTrSlicePath = path.join(__dirname, 'unseen_holdout_tr_scrivener_slice.json');
function extractTrVerse(bookId, ch, vs) {
  const osis = trBookOsisMap[bookId];
  if (!osis) return null;
  const row = scrData.find(x => x.book_name_osis === osis && x.chapter === ch && x.verse === vs);
  if (!row) return null;
  return row.words.map((w, i) => ({
    index: i + 1,
    surface: w.greek,
    grammar: w.grammar,
    strongsId: w.strong ? `G${w.strong}` : null,
    lemma: w.dictionary_form || ''
  }));
}

// Load Greek Strong's entries map for cross-checking Strong's ID <-> lemma
const strongsGreekMap = new Map();
for (const line of query("SELECT strongs_id || '|' || COALESCE(original_word,'') FROM strongs_entries WHERE strongs_id LIKE 'G%';").split('\n')) {
  if (!line) continue;
  const [id, orig] = line.split('|');
  strongsGreekMap.set(id, orig);
}

// ---------------------------------------------------------------------------
// 3. Matching Helpers (OSHB, SBLGNT, Scrivener TR)
// ---------------------------------------------------------------------------
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
  const prepAllow = new Set(['H9005','H9003','H9004','H413','H5921','H5922','H4480','H4481','H5973','H8478','H996','H310','H854','H5704','H5705','H4616','H3890','H1157','H5668','H5048','H6925','H8460','H3644','H5049']);
  if ((dbMorph === 'HR' || dbMorph === 'AR') && lemmaStr.includes('/') && !prepAllow.has(strongsId)) {
    return false;
  }
  for (const part of lemmaStr.split('/')) {
    const cleanPart = part.replace(/\s+[a-z]$/, '').trim();
    if (cleanPart === numStr) return true;
    if ((numStr === '1980' && cleanPart === '3212') || (numStr === '3212' && cleanPart === '1980')) return true;
    if ((numStr === '4480' || numStr === '4481') && cleanPart === 'm') return true;
  }
  return false;
}

function greekStrongsMatchesLemma(strongsId, tokLemma) {
  if (!strongsId || !tokLemma) return false;
  const entryWord = strongsGreekMap.get(strongsId);
  if (!entryWord) return false;
  const eFold = normGreekPolytonicFold(entryWord);
  const tFold = normGreekPolytonicFold(tokLemma);
  if (eFold === tFold) return true;
  // Common MorphGNT vs Strong's lexical pairs (ἐγώ/μου/με/ἡμᾶς, σύ/σου/ὑμᾶς, συνιστάω/συνίστημι, etc.)
  const pairs = [
    ['εγω', 'μου'], ['εγω', 'με'], ['εγω', 'εμοι'], ['εγω', 'ημας'], ['εγω', 'ημων'], ['εγω', 'ημιν'], ['εγω', 'ημεις'],
    ['συ', 'σου'], ['συ', 'σε'], ['συ', 'υμας'], ['συ', 'υμων'], ['συ', 'υμιν'], ['συ', 'υμεις'],
    ['αυτος', 'αυτου'], ['ουτος', 'αυτη'], ['ος', 'ου'], ['τις', 'τι'],
    ['συνισταω', 'συνιστημι'], ['συνιστανω', 'συνιστημι']
  ];
  return pairs.some(([a, b]) => (eFold === a && tFold === b) || (eFold === b && tFold === a));
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
      const sMap = { c:'construct', a:'absolute', d:'determined' };
      const expState = sMap[core[5]] || null;
      if (expState && d.morphCase && d.morphCase !== expState) return `case '${d.morphCase}' vs '${expState}'`;
    }
  } else if ((core[0] === 'N' || core[0] === 'A') && core[1] !== 'p') {
    if ((d.morphGender || null) !== (gMap[core[2]] || null)) return `gender '${d.morphGender}' vs '${core[2]}'`;
    if ((d.morphNumber || null) !== (nMap[core[3]] || null)) return `number '${d.morphNumber}' vs '${core[3]}'`;
    const sMap = { c:'construct', a:'absolute', d:'determined' };
    const expState = sMap[core[4]] || null;
    if (expState && d.morphCase && d.morphCase !== expState) return `case '${d.morphCase}' vs '${expState}'`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. Exhaustive Historical Exclusion Check (0.00% Overlap Guarantee)
// ---------------------------------------------------------------------------
function buildHistoricalExclusionSet(skipRound2 = false) {
  const aliases = {
    'إشعياء':23,'اشعياء':23,'التكوين':1,'الخروج':2,'اللاويين':3,'العدد':4,'التثنية':5,
    'يشوع':6,'القضاة':7,'راعوث':8,'صموئيل الأول':9,'صموئيل الثاني':10,'الملوك الأول':11,
    'ملوك الأول':11,'الملوك الثاني':12,'أخبار الأيام الثاني':14,'عزرا':15,'نحميا':16,'أستير':17,
    'أيوب':18,'المزامير':19,'مزمور':19,'الأمثال':20,'أمثال':20,'الجامعة':21,'نشيد الأنشاد':22,
    'إرميا':24,'حزقيال':26,'دانيال':27,'هوشع':28,'عاموس':30,'يونان':32,'ميخا':33,'زكريا':38,
    'متى':40,'مرقس':41,'لوقا':42,'يوحنا':43,'أعمال الرسل':44,'رومية':45,'كورنثوس الأولى':46,
    'كورنثوس الثانية':47,'غلاطية':48,'أفسس':49,'فيلبي':50,'كولوسي':51,'تسالونيكي الأولى':52,
    'العبرانيين':58,'يعقوب':59,'بطرس الأولى':60,'يوحنا الأولى':62,'الرؤيا':66
  };
  const ex = new Set();
  const addK = (b, c, v) => { if (b && c && v) ex.add(`${Number(b)}:${Number(c)}:${Number(v)}`); };
  for (const rel of [
    'scripts/unified_exclusion_manifest.json', 'phase1_targets.json', 'phase2_targets.json',
    'phase2_verified_targets.json', 'verified_phase1_updates.json',
    'scripts/frozen_sample_v2_manifest.json', 'scripts/batch_20_verses_manifest.json',
    'fresh_holdout_1000.json', 'alignment_audit_v299/fresh_holdout_1000.json',
    'verification_release_candidate/sample_70_verses_1090_words_full_audit.json'
  ]) {
    const full = path.join(repoRoot, rel);
    if (!fs.existsSync(full)) continue;
    const txt = fs.readFileSync(full, 'utf8');
    try {
      const data = JSON.parse(txt);
      const walk = node => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(walk); return; }
        if (node.book_id && node.chapter && node.verse) addK(node.book_id, node.chapter, node.verse);
        if (node.book && node.ch && node.vs) addK(node.book, node.ch, node.vs);
        if (typeof node.citation === 'string') {
          const m = node.citation.match(/^(.+?)\s+(\d+):(\d+)$/);
          if (m && aliases[m[1].trim()]) addK(aliases[m[1].trim()], m[2], m[3]);
        }
        for (const k of Object.keys(node)) walk(node[k]);
      };
      walk(data);
    } catch (_) {}
    for (const m of txt.matchAll(/11111111-0000-0000-00(\d{2})-000000(\d{3})(\d{3})/g)) addK(m[1], m[2], m[3]);
    for (const m of txt.matchAll(/B(\d+)\.C(\d+)\.V(\d+)/g)) addK(m[1], m[2], m[3]);
  }
  const sFiles = [path.join(repoRoot, 'scripts/automated_database_audit.cjs')];
  for (const f of fs.readdirSync(path.join(repoRoot, 'scripts'))) {
    if (/^apply_.*\.(cjs|sql)$/.test(f) && !/^apply_holdout_/.test(f) && !(skipRound2 && /^apply_round2_/.test(f))) {
      sFiles.push(path.join(repoRoot, 'scripts', f));
    }
  }
  for (const f of sFiles) {
    let txt = fs.readFileSync(f, 'utf8');
    if (f.endsWith('automated_database_audit.cjs')) {
      const idx = txt.indexOf('// 57. Holdout Batch 1');
      if (idx !== -1) txt = txt.slice(0, idx);
    }
    for (const m of txt.matchAll(/11111111-0000-0000-00(\d{2})-000000(\d{3})(\d{3})/g)) addK(m[1], m[2], m[3]);
    for (const m of txt.matchAll(/B(\d+)\.C(\d+)\.V(\d+)/g)) addK(m[1], m[2], m[3]);
    for (const m of txt.matchAll(/book_id\s*=\s*(\d+)\s+AND\s+chapter_num\s*=\s*(\d+)\s+AND\s+verse_num\s*=\s*(\d+)/g)) addK(m[1], m[2], m[3]);
  }
  return ex;
}

const manifestArgIdx = process.argv.indexOf('--manifest');
const manifestPath = (manifestArgIdx !== -1 && process.argv[manifestArgIdx + 1])
  ? path.resolve(process.cwd(), process.argv[manifestArgIdx + 1])
  : path.join(__dirname, 'unseen_holdout_15_verses_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const trSlicePath = manifest.tr_scrivener_slice_path
  ? path.resolve(repoRoot, manifest.tr_scrivener_slice_path)
  : defaultTrSlicePath;
const scrData = (!process.env.USE_TR_SLICE && fs.existsSync(trFullPath))
  ? JSON.parse(fs.readFileSync(trFullPath, 'utf8'))
  : JSON.parse(fs.readFileSync(trSlicePath, 'utf8')).verses;
const manifestSha256 = sha256File(manifestPath);
const dbSha256 = sha256File(dbPath);

// Verify embedded historical exclusion set SHA-256 and merge with any local exclusion files
const manifestExHash = sha256Str(manifest.excluded_verse_keys.join('\n') + '\n');
if (manifestExHash !== manifest.exclusion_keys_sha256) {
  throw new Error(`Manifest exclusion_keys_sha256 mismatch: ${manifestExHash} != ${manifest.exclusion_keys_sha256}`);
}
const historicalExclusions = new Set(manifest.excluded_verse_keys);
const isRound2Manifest = path.basename(manifestPath) === 'unseen_holdout_round2_15_verses_manifest.json';
for (const k of buildHistoricalExclusionSet(isRound2Manifest)) historicalExclusions.add(k);

// 15 Strictly Unseen Holdout Verses loaded from canonical manifest (0% overlap)
const holdoutVerses = manifest.holdout_verses;

// Verified required components for fully calibrated holdout units
const VERIFIED_REQUIRED_COMPONENTS = {
  'Ezra 4:24': {
    1:  [{ strongsId: 'H116', role: 'primary', order: 1, pos: 1, surface: 'בֵּאדַ֗יִן', morph: 'AR/D', source: 'oshb_wlc' }],
    2:  [{ strongsId: 'H989', role: 'primary', order: 1, pos: 2, surface: 'בְּטֵלַת֙', morph: 'AVqp3fs', source: 'oshb_wlc' }],
    3:  [{ strongsId: 'H5673', role: 'primary', order: 1, pos: 3, surface: 'עֲבִידַ֣ת', morph: 'ANcfsc', source: 'oshb_wlc' }],
    4:  [{ strongsId: 'H1005', role: 'primary', order: 1, pos: 4, surface: 'בֵּית', morph: 'ANcmsc', source: 'oshb_wlc' }],
    5:  [{ strongsId: 'H426', role: 'primary', order: 1, pos: 5, surface: 'אֱלָהָ֔א', morph: 'ANcmsd/Td', source: 'oshb_wlc' }],
    6:  [{ strongsId: 'H1768', role: 'primary', order: 1, pos: 6, surface: 'דִּ֖י', morph: 'ATr', source: 'oshb_wlc' }],
    7:  [{ strongsId: 'H9003', role: 'primary', order: 1, pos: 7, surface: 'בִּירוּשְׁלֶ֑ם', morph: 'AR', source: 'oshb_wlc' }],
    8:  [
      { strongsId: 'H3390', role: 'primary', order: 1, pos: 7, surface: 'בִּירוּשְׁלֶ֑ם', morph: 'AR/Np', source: 'oshb_wlc' },
      { strongsId: 'H9003', role: 'secondary', order: 2, pos: 7, surface: 'בִּ', morph: 'AR', source: 'oshb_wlc' }
    ],
    9:  [
      { strongsId: 'H1934', role: 'primary', order: 1, pos: 8, surface: 'וַהֲוָת֙', morph: 'AC/Vqp3fs', source: 'oshb_wlc' },
      { strongsId: 'H9002', role: 'secondary', order: 2, pos: 8, surface: 'וַ', morph: 'AC', source: 'oshb_wlc' }
    ],
    10: [{ strongsId: 'H989', role: 'primary', order: 1, pos: 9, surface: 'בָּֽטְלָ֔א', morph: 'AVqrfsa', source: 'oshb_wlc' }],
    11: [{ strongsId: 'H5705', role: 'primary', order: 1, pos: 10, surface: 'עַ֚ד', morph: 'AR', source: 'oshb_wlc' }],
    12: [{ strongsId: 'H8140', role: 'primary', order: 1, pos: 11, surface: 'שְׁנַ֣ת', morph: 'ANcfsc', source: 'oshb_wlc' }],
    13: [{ strongsId: 'H8648', role: 'primary', order: 1, pos: 12, surface: 'תַּרְתֵּ֔ין', morph: 'AAocpa', source: 'oshb_wlc' }],
    14: [{ strongsId: 'H9005', role: 'primary', order: 1, pos: 13, surface: 'לְמַלְכ֖וּת', morph: 'AR', source: 'oshb_wlc' }],
    15: [
      { strongsId: 'H4437', role: 'primary', order: 1, pos: 13, surface: 'לְמַלְכ֖וּת', morph: 'AR/Ncfsc', source: 'oshb_wlc' },
      { strongsId: 'H9005', role: 'secondary', order: 2, pos: 13, surface: 'לְ', morph: 'AR', source: 'oshb_wlc' }
    ],
    16: [{ strongsId: 'H1868', role: 'primary', order: 1, pos: 14, surface: 'דָּרְיָ֥וֶשׁ', morph: 'ANp', source: 'oshb_wlc' }],
    17: [{ strongsId: 'H4430', role: 'primary', order: 1, pos: 15, surface: 'מֶֽלֶךְ', morph: 'ANcmsc', source: 'oshb_wlc' }],
    18: [{ strongsId: 'H6540', role: 'primary', order: 1, pos: 16, surface: 'פָּרָֽס', morph: 'ANp', source: 'oshb_wlc' }]
  },
  'Ruth 2:12': {
    1:  [{ strongsId: 'H7999', role: 'primary', order: 1, pos: 1, surface: 'יְשַׁלֵּ֥ם', morph: 'HVpi3ms', source: 'oshb_wlc' }],
    2:  [{ strongsId: 'H3068', role: 'primary', order: 1, pos: 2, surface: 'יְהוָ֖ה', morph: 'HNp', source: 'oshb_wlc' }],
    3:  [{ strongsId: 'H6467', role: 'primary', order: 1, pos: 3, surface: 'פָּעֳלֵ֑ךְ', morph: 'HNcmsc/Sp2fs', source: 'oshb_wlc' }],
    4:  [{ strongsId: 'H1961', role: 'primary', order: 1, pos: 4, surface: 'וּתְהִ֨י', morph: 'HC/Vqj3fs', source: 'oshb_wlc' }],
    5:  [{ strongsId: 'H4909', role: 'primary', order: 1, pos: 5, surface: 'מַשְׂכֻּרְתֵּ֜ךְ', morph: 'HNcfsc/Sp2fs', source: 'oshb_wlc' }],
    6:  [{ strongsId: 'H8003', role: 'primary', order: 1, pos: 6, surface: 'שְׁלֵמָ֗ה', morph: 'HAafsa', source: 'oshb_wlc' }],
    7:  [{ strongsId: 'H4480', role: 'primary', order: 1, pos: 7, surface: 'מֵעִ֤ם', morph: 'HR', source: 'oshb_wlc' }],
    8:  [
      { strongsId: 'H5973', role: 'primary', order: 1, pos: 7, surface: 'מֵעִ֤ם', morph: 'HR/R', source: 'oshb_wlc' },
      { strongsId: 'H4480', role: 'secondary', order: 2, pos: 7, surface: 'מֵ', morph: 'HR', source: 'oshb_wlc' }
    ],
    9:  [{ strongsId: 'H3068', role: 'primary', order: 1, pos: 8, surface: 'יְהוָה֙', morph: 'HNp', source: 'oshb_wlc' }],
    10: [{ strongsId: 'H430', role: 'primary', order: 1, pos: 9, surface: 'אֱלֹהֵ֣י', morph: 'HNcmpc', source: 'oshb_wlc' }],
    11: [{ strongsId: 'H3478', role: 'primary', order: 1, pos: 10, surface: 'יִשְׂרָאֵ֔ל', morph: 'HNp', source: 'oshb_wlc' }],
    12: [{ strongsId: 'H834', role: 'primary', order: 1, pos: 11, surface: 'אֲשֶׁר', morph: 'HTr', source: 'oshb_wlc' }],
    13: [{ strongsId: 'H935', role: 'primary', order: 1, pos: 12, surface: 'בָּ֖את', morph: 'HVqp2fs', source: 'oshb_wlc' }],
    14: [{ strongsId: 'H9005', role: 'primary', order: 1, pos: 13, surface: 'לַחֲס֥וֹת', morph: 'HR', source: 'oshb_wlc' }],
    15: [
      { strongsId: 'H2620', role: 'primary', order: 1, pos: 13, surface: 'לַחֲס֥וֹת', morph: 'HR/Vqc', source: 'oshb_wlc' },
      { strongsId: 'H9005', role: 'secondary', order: 2, pos: 13, surface: 'לַ', morph: 'HR', source: 'oshb_wlc' }
    ],
    16: [{ strongsId: 'H8478', role: 'primary', order: 1, pos: 14, surface: 'תַּֽחַת', morph: 'HR', source: 'oshb_wlc' }],
    17: [{ strongsId: 'H3671', role: 'primary', order: 1, pos: 15, surface: 'כְּנָפָֽיו', morph: 'HNcfpc/Sp3ms', source: 'oshb_wlc' }]
  },
  'Mic 7:18': {
    1:  [{ strongsId: 'H4310', role: 'primary', order: 1, pos: 1, surface: 'מִי', morph: 'HTi', source: 'oshb_wlc' }],
    3:  [{ strongsId: 'H410', role: 'primary', order: 1, pos: 2, surface: 'אֵ֣ל', morph: 'HNcmsa', source: 'oshb_wlc' }],
    4:  [{ strongsId: 'H3644', role: 'primary', order: 1, pos: 3, surface: 'כָּמ֗וֹךָ', morph: 'HR/Sp2ms', source: 'oshb_wlc' }],
    5:  [{ strongsId: 'H5375', role: 'primary', order: 1, pos: 4, surface: 'נֹשֵׂ֤א', morph: 'HVqrmsa', source: 'oshb_wlc' }],
    6:  [{ strongsId: 'H5771', role: 'primary', order: 1, pos: 5, surface: 'עָוֺן֙', morph: 'HNcbsa', source: 'oshb_wlc' }],
    7:  [
      { strongsId: 'H5674', role: 'primary', order: 1, pos: 6, surface: 'וְעֹבֵ֣ר', morph: 'HC/Vqrmsa', source: 'oshb_wlc' },
      { strongsId: 'H9002', role: 'secondary', order: 2, pos: 6, surface: 'וְ', morph: 'HC', source: 'oshb_wlc' }
    ],
    8:  [{ strongsId: 'H5921', role: 'primary', order: 1, pos: 7, surface: 'עַל', morph: 'HR', source: 'oshb_wlc' }],
    9:  [{ strongsId: 'H6588', role: 'primary', order: 1, pos: 8, surface: 'פֶּ֔שַׁע', morph: 'HNcmsa', source: 'oshb_wlc' }],
    10: [
      { strongsId: 'H7611', role: 'primary', order: 1, pos: 9, surface: 'לִשְׁאֵרִ֖ית', morph: 'HR/Ncfsc', source: 'oshb_wlc' },
      { strongsId: 'H9005', role: 'secondary', order: 2, pos: 9, surface: 'לִ', morph: 'HR', source: 'oshb_wlc' }
    ],
    11: [{ strongsId: 'H5159', role: 'primary', order: 1, pos: 10, surface: 'נַחֲלָת֑וֹ', morph: 'HNcfsc/Sp3ms', source: 'oshb_wlc' }],
    12: [{ strongsId: 'H3808', role: 'primary', order: 1, pos: 11, surface: 'לֹא', morph: 'HTn', source: 'oshb_wlc' }],
    13: [{ strongsId: 'H2388', role: 'primary', order: 1, pos: 12, surface: 'הֶחֱזִ֤יק', morph: 'HVhp3ms', source: 'oshb_wlc' }],
    14: [{ strongsId: 'H9005', role: 'primary', order: 1, pos: 13, surface: 'לָעַד֙', morph: 'HR', source: 'oshb_wlc' }],
    15: [
      { strongsId: 'H5703', role: 'primary', order: 1, pos: 13, surface: 'לָעַד֙', morph: 'HR/Ncmsa', source: 'oshb_wlc' },
      { strongsId: 'H9005', role: 'secondary', order: 2, pos: 13, surface: 'לָ', morph: 'HR', source: 'oshb_wlc' }
    ],
    16: [{ strongsId: 'H639', role: 'primary', order: 1, pos: 14, surface: 'אַפּ֔וֹ', morph: 'HNcmsc/Sp3ms', source: 'oshb_wlc' }],
    17: [
      { strongsId: 'H3588', role: 'primary', order: 1, pos: 15, surface: 'כִּֽי', morph: 'HC', source: 'oshb_wlc' },
      { strongsId: 'H1931', role: 'secondary', order: 2, pos: 18, surface: 'הֽוּא', morph: 'HPp3ms', source: 'oshb_wlc' }
    ],
    18: [{ strongsId: 'H2654', role: 'primary', order: 1, pos: 16, surface: 'חָפֵ֥ץ', morph: 'HVqp3ms', source: 'oshb_wlc' }],
    19: [{ strongsId: 'H2617', role: 'primary', order: 1, pos: 17, surface: 'חֶ֖סֶד', morph: 'HNcmsa', source: 'oshb_wlc' }]
  },
  'Isa 41:10': {
    1:  [{ strongsId: 'H408', role: 'primary', order: 1, pos: 1, surface: 'אַל', morph: 'HTn', source: 'oshb_wlc' }],
    2:  [{ strongsId: 'H3372', role: 'primary', order: 1, pos: 2, surface: 'תִּירָא֙', morph: 'HVqj2ms', source: 'oshb_wlc' }],
    3:  [
      { strongsId: 'H3588', role: 'primary', order: 1, pos: 3, surface: 'כִּ֣י', morph: 'HC', source: 'oshb_wlc' },
      { strongsId: 'H589', role: 'secondary', order: 2, pos: 5, surface: 'אָ֔נִי', morph: 'HPp1cs', source: 'oshb_wlc' }
    ],
    4:  [{ strongsId: 'H5973', role: 'primary', order: 1, pos: 4, surface: 'עִמְּךָ', morph: 'HR/Sp2ms', source: 'oshb_wlc' }],
    5:  [{ strongsId: 'H408', role: 'primary', order: 1, pos: 6, surface: 'אַל', morph: 'HTn', source: 'oshb_wlc' }],
    6:  [{ strongsId: 'H8159', role: 'primary', order: 1, pos: 7, surface: 'תִּשְׁתָּ֖ע', morph: 'HVqj2ms', source: 'oshb_wlc' }],
    7:  [
      { strongsId: 'H3588', role: 'primary', order: 1, pos: 8, surface: 'כִּֽי', morph: 'HC', source: 'oshb_wlc' },
      { strongsId: 'H589', role: 'secondary', order: 2, pos: 9, surface: 'אֲנִ֣י', morph: 'HPp1cs', source: 'oshb_wlc' }
    ],
    8:  [{ strongsId: 'H430', role: 'primary', order: 1, pos: 10, surface: 'אֱלֹהֶ֑יךָ', morph: 'HNcmpc/Sp2ms', source: 'oshb_wlc' }],
    10: [{ strongsId: 'H553', role: 'primary', order: 1, pos: 11, surface: 'אִמַּצְתִּ֨יךָ֙', morph: 'HVpp1cs/Sp2ms', source: 'oshb_wlc' }],
    11: [
      { strongsId: 'H5826', role: 'primary', order: 1, pos: 13, surface: 'עֲזַרְתִּ֔יךָ', morph: 'HVqp1cs/Sp2ms', source: 'oshb_wlc' },
      { strongsId: 'H637', role: 'secondary', order: 2, pos: 12, surface: 'אַף', morph: 'HTa', source: 'oshb_wlc' }
    ],
    12: [
      { strongsId: 'H8551', role: 'primary', order: 1, pos: 15, surface: 'תְּמַכְתִּ֖יךָ', morph: 'HVqp1cs/Sp2ms', source: 'oshb_wlc' },
      { strongsId: 'H637', role: 'secondary', order: 2, pos: 14, surface: 'אַף', morph: 'HTa', source: 'oshb_wlc' }
    ],
    13: [
      { strongsId: 'H3225', role: 'primary', order: 1, pos: 16, surface: 'בִּימִ֥ין', morph: 'HR/Ncfsc', source: 'oshb_wlc' },
      { strongsId: 'H9003', role: 'secondary', order: 2, pos: 16, surface: 'בִּ', morph: 'HR', source: 'oshb_wlc' }
    ],
    14: [{ strongsId: 'H6664', role: 'primary', order: 1, pos: 17, surface: 'צִדְקִֽי', morph: 'HNcmsc/Sp1cs', source: 'oshb_wlc' }]
  },
  '1Kgs 19:12': {
    1:  [{ strongsId: 'H310', role: 'primary', order: 1, pos: 1, surface: 'וְאַחַ֤ר', morph: 'HC/R', source: 'oshb_wlc' }],
    2:  [{ strongsId: 'H7494', role: 'primary', order: 1, pos: 2, surface: 'הָרַ֨עַשׁ֙', morph: 'HTd/Ncmsa', source: 'oshb_wlc' }],
    3:  [{ strongsId: 'H784', role: 'primary', order: 1, pos: 3, surface: 'אֵ֔שׁ', morph: 'HNcbsa', source: 'oshb_wlc' }],
    4:  [{ strongsId: 'H3808', role: 'primary', order: 1, pos: 4, surface: 'לֹ֥א', morph: 'HTn', source: 'oshb_wlc' }],
    6:  [{ strongsId: 'H3068', role: 'primary', order: 1, pos: 6, surface: 'יְהוָ֑ה', morph: 'HNp', source: 'oshb_wlc' }],
    7:  [{ strongsId: 'H9003', role: 'primary', order: 1, pos: 5, surface: 'בָאֵ֖שׁ', morph: 'HRd', source: 'oshb_wlc' }],
    8:  [
      { strongsId: 'H784', role: 'primary', order: 1, pos: 5, surface: 'בָאֵ֖שׁ', morph: 'HRd/Ncbsa', source: 'oshb_wlc' },
      { strongsId: 'H9003', role: 'secondary', order: 2, pos: 5, surface: 'בָ', morph: 'HRd', source: 'oshb_wlc' }
    ],
    9:  [{ strongsId: 'H310', role: 'primary', order: 1, pos: 7, surface: 'וְאַחַ֣ר', morph: 'HC/R', source: 'oshb_wlc' }],
    10: [{ strongsId: 'H784', role: 'primary', order: 1, pos: 8, surface: 'הָאֵ֔שׁ', morph: 'HTd/Ncbsa', source: 'oshb_wlc' }],
    11: [{ strongsId: 'H6963', role: 'primary', order: 1, pos: 9, surface: 'ק֖וֹל', morph: 'HNcmsc', source: 'oshb_wlc' }],
    12: [{ strongsId: 'H1827', role: 'primary', order: 1, pos: 10, surface: 'דְּמָמָ֥ה', morph: 'HNcfsa', source: 'oshb_wlc' }],
    13: [{ strongsId: 'H1851', role: 'primary', order: 1, pos: 11, surface: 'דַקָּֽה', morph: 'HAafsa', source: 'oshb_wlc' }]
  },
  'Gal 2:20': {
    2: [{ strongsId: 'G5547', role: 'primary', order: 1, pos: 1, surface: 'Χριστῷ', morph: 'N-DSM', source: 'morphgnt_tr' }],
    3: [{ strongsId: 'G4957', role: 'primary', order: 1, pos: 2, surface: 'συνεσταύρωμαι', morph: 'V-RPI-1S', source: 'morphgnt_tr' }],
    4: [
      { strongsId: 'G2198', role: 'primary', order: 1, pos: 3, surface: 'ζῶ', morph: 'V-PAI-1S', source: 'morphgnt_tr' },
      { strongsId: 'G1161', role: 'secondary', order: 2, pos: 4, surface: 'δέ', morph: 'CONJ', source: 'morphgnt_tr' }
    ],
    5: [{ strongsId: 'G3765', role: 'primary', order: 1, pos: 5, surface: 'οὐκέτι', morph: 'ADV-N', source: 'morphgnt_tr' }],
    6: [{ strongsId: 'G1473', role: 'primary', order: 1, pos: 6, surface: 'ἐγώ', morph: 'P-1NS', source: 'morphgnt_tr' }],
    7: [{ strongsId: 'G1161', role: 'primary', order: 1, pos: 8, surface: 'δὲ', morph: 'CONJ', source: 'morphgnt_tr' }],
    8: [{ strongsId: 'G5547', role: 'primary', order: 1, pos: 11, surface: 'Χριστός', morph: 'N-NSM', source: 'morphgnt_tr' }],
    9: [{ strongsId: 'G2198', role: 'primary', order: 1, pos: 7, surface: 'ζῇ', morph: 'V-PAI-3S', source: 'morphgnt_tr' }],
    10: [
      { strongsId: 'G1722', role: 'primary', order: 1, pos: 9, surface: 'ἐν', morph: 'PREP', source: 'morphgnt_tr' },
      { strongsId: 'G1473', role: 'secondary', order: 2, pos: 10, surface: 'ἐμοὶ', morph: 'P-1DS', source: 'morphgnt_tr' }
    ],
    11: [
      { strongsId: 'G3739', role: 'primary', order: 1, pos: 12, surface: 'ὃ', morph: 'R-ASN', source: 'morphgnt_tr' },
      { strongsId: 'G1161', role: 'secondary', order: 2, pos: 13, surface: 'δὲ', morph: 'CONJ', source: 'morphgnt_tr' }
    ],
    12: [{ strongsId: 'G2198', role: 'primary', order: 1, pos: 15, surface: 'ζῶ', morph: 'V-PAI-1S', source: 'morphgnt_tr' }],
    13: [{ strongsId: 'G3568', role: 'primary', order: 1, pos: 14, surface: 'νῦν', morph: 'ADV', source: 'morphgnt_tr' }],
    14: [{ strongsId: 'G1722', role: 'primary', order: 1, pos: 16, surface: 'ἐν', morph: 'PREP', source: 'morphgnt_tr' }],
    15: [{ strongsId: 'G4561', role: 'primary', order: 1, pos: 17, surface: 'σαρκί', morph: 'N-DSF', source: 'morphgnt_tr' }],
    17: [{ strongsId: 'G2198', role: 'primary', order: 1, pos: 20, surface: 'ζῶ', morph: 'V-PAI-1S', source: 'morphgnt_tr' }],
    18: [{ strongsId: 'G1722', role: 'primary', order: 1, pos: 18, surface: 'ἐν', morph: 'PREP', source: 'morphgnt_tr' }],
    19: [{ strongsId: 'G4102', role: 'primary', order: 1, pos: 19, surface: 'πίστει', morph: 'N-DSF', source: 'morphgnt_tr' }],
    20: [
      { strongsId: 'G4102', role: 'primary', order: 1, pos: 19, surface: 'πίστει', morph: 'N-DSF', source: 'morphgnt_tr' },
      { strongsId: 'G3588', role: 'secondary', order: 2, pos: 21, surface: 'τῇ', morph: 'T-DSF', source: 'morphgnt_tr' }
    ],
    21: [
      { strongsId: 'G5207', role: 'primary', order: 1, pos: 23, surface: 'υἱοῦ', morph: 'N-GSM', source: 'morphgnt_tr' },
      { strongsId: 'G3588', role: 'secondary', order: 2, pos: 22, surface: 'τοῦ', morph: 'T-GSM', source: 'morphgnt_tr' }
    ],
    22: [
      { strongsId: 'G2316', role: 'primary', order: 1, pos: 25, surface: 'Θεοῦ', morph: 'N-GSM', source: 'morphgnt_tr' },
      { strongsId: 'G3588', role: 'secondary', order: 2, pos: 24, surface: 'τοῦ', morph: 'T-GSM', source: 'morphgnt_tr' }
    ],
    23: [{ strongsId: 'G3588', role: 'primary', order: 1, pos: 26, surface: 'τοῦ', morph: 'T-GSM', source: 'morphgnt_tr' }],
    24: [
      { strongsId: 'G25', role: 'primary', order: 1, pos: 27, surface: 'ἀγαπήσαντός', morph: 'V-AAP-GSM', source: 'morphgnt_tr' },
      { strongsId: 'G1473', role: 'secondary', order: 2, pos: 28, surface: 'με', morph: 'P-1AS', source: 'morphgnt_tr' }
    ],
    25: [
      { strongsId: 'G3860', role: 'primary', order: 1, pos: 30, surface: 'παραδόντος', morph: 'V-2AAP-GSM', source: 'morphgnt_tr' },
      { strongsId: 'G2532', role: 'secondary', order: 2, pos: 29, surface: 'καὶ', morph: 'CONJ', source: 'morphgnt_tr' }
    ],
    26: [{ strongsId: 'G1438', role: 'primary', order: 1, pos: 31, surface: 'ἑαυτὸν', morph: 'F-3ASM', source: 'morphgnt_tr' }],
    27: [
      { strongsId: 'G5228', role: 'primary', order: 1, pos: 32, surface: 'ὑπὲρ', morph: 'PREP', source: 'morphgnt_tr' },
      { strongsId: 'G1473', role: 'secondary', order: 2, pos: 33, surface: 'ἐμοῦ', morph: 'P-1GS', source: 'morphgnt_tr' }
    ]
  },
  'Phil 2:5': {
    2: [
      { strongsId: 'G1722', role: 'primary', order: 1, pos: 3, surface: 'ἐν', morph: 'P- --------', source: 'morphgnt_sblgnt' },
      { strongsId: 'G4771', role: 'secondary', order: 2, pos: 4, surface: 'ὑμῖν', morph: 'RP ----DP--', source: 'morphgnt_sblgnt' }
    ],
    3: [{ strongsId: 'G3778', role: 'primary', order: 1, pos: 1, surface: 'τοῦτο', morph: 'RD ----ASN-', source: 'morphgnt_sblgnt' }],
    4: [{ strongsId: 'G5426', role: 'primary', order: 1, pos: 2, surface: 'φρονεῖτε', morph: 'V- 2PAD-P--', source: 'morphgnt_sblgnt' }],
    5: [{ strongsId: 'G3739', role: 'primary', order: 1, pos: 5, surface: 'ὃ', morph: 'RR ----NSN-', source: 'morphgnt_sblgnt' }],
    6: [{ strongsId: 'G1722', role: 'primary', order: 1, pos: 7, surface: 'ἐν', morph: 'P- --------', source: 'morphgnt_sblgnt' }],
    7: [{ strongsId: 'G5547', role: 'primary', order: 1, pos: 8, surface: 'Χριστῷ', morph: 'N- ----DSM-', source: 'morphgnt_sblgnt' }],
    8: [{ strongsId: 'G2424', role: 'primary', order: 1, pos: 9, surface: 'Ἰησοῦ', morph: 'N- ----DSM-', source: 'morphgnt_sblgnt' }],
    9: [{ strongsId: 'G2532', role: 'primary', order: 1, pos: 6, surface: 'καὶ', morph: 'D- --------', source: 'morphgnt_sblgnt' }]
  },
  'Luke 6:31': {
    1: [
      { strongsId: 'G2531', role: 'primary', order: 1, pos: 2, surface: 'καθὼς', morph: 'C- --------', source: 'morphgnt_sblgnt' },
      { strongsId: 'G2532', role: 'secondary', order: 2, pos: 1, surface: 'καὶ', morph: 'C- --------', source: 'morphgnt_sblgnt' }
    ],
    2: [{ strongsId: 'G2309', role: 'primary', order: 1, pos: 3, surface: 'θέλετε', morph: 'V- 2PAI-P--', source: 'morphgnt_sblgnt' }],
    3: [{ strongsId: 'G2443', role: 'primary', order: 1, pos: 4, surface: 'ἵνα', morph: 'C- --------', source: 'morphgnt_sblgnt' }],
    4: [{ strongsId: 'G4160', role: 'primary', order: 1, pos: 5, surface: 'ποιῶσιν', morph: 'V- 3PAS-P--', source: 'morphgnt_sblgnt' }],
    5: [
      { strongsId: 'G444', role: 'primary', order: 1, pos: 8, surface: 'ἄνθρωποι', morph: 'N- ----NPM-', source: 'morphgnt_sblgnt' },
      { strongsId: 'G3588', role: 'secondary', order: 2, pos: 7, surface: 'οἱ', morph: 'RA ----NPM-', source: 'morphgnt_sblgnt' }
    ],
    6: [{ strongsId: 'G4771', role: 'primary', order: 1, pos: 6, surface: 'ὑμῖν', morph: 'RP ----DP--', source: 'morphgnt_sblgnt' }],
    7: [{ strongsId: 'G4160', role: 'primary', order: 1, pos: 9, surface: 'ποιεῖτε', morph: 'V- 2PAD-P--', source: 'morphgnt_sblgnt' }],
    8: [{ strongsId: 'G4771', role: 'primary', order: 1, pos: 10, surface: 'ὑμεῖς', morph: 'P-2NP', source: 'morphgnt_tr' }],
    9: [{ strongsId: 'G2532', role: 'primary', order: 1, pos: 9, surface: 'καὶ', morph: 'CONJ', source: 'morphgnt_tr' }],
    10: [{ strongsId: 'G846', role: 'primary', order: 1, pos: 10, surface: 'αὐτοῖς', morph: 'RP ----DPM-', source: 'morphgnt_sblgnt' }],
    11: [{ strongsId: 'G3668', role: 'primary', order: 1, pos: 11, surface: 'ὁμοίως', morph: 'D- --------', source: 'morphgnt_sblgnt' }]
  },
  'Rom 5:8': {
    1:  [{ strongsId: 'G1161', role: 'primary', order: 1, pos: 2, surface: 'δὲ', morph: 'C- --------', source: 'morphgnt_sblgnt' }],
    2:  [
      { strongsId: 'G2316', role: 'primary', order: 1, pos: 9, surface: 'θεὸς', morph: 'N- ----NSM-', source: 'morphgnt_sblgnt' },
      { strongsId: 'G3588', role: 'secondary', order: 2, pos: 8, surface: 'ὁ', morph: 'RA ----NSM-', source: 'morphgnt_sblgnt' }
    ],
    3:  [{ strongsId: 'G4921', role: 'primary', order: 1, pos: 1, surface: 'συνίστησιν', morph: 'V- 3PAI-S--', source: 'morphgnt_sblgnt' }],
    4:  [
      { strongsId: 'G26', role: 'primary', order: 1, pos: 5, surface: 'ἀγάπην', morph: 'N- ----ASF-', source: 'morphgnt_sblgnt' },
      { strongsId: 'G1438', role: 'secondary', order: 2, pos: 4, surface: 'ἑαυτοῦ', morph: 'RP ----GSM-', source: 'morphgnt_sblgnt' },
      { strongsId: 'G3588', role: 'secondary', order: 3, pos: 3, surface: 'τὴν', morph: 'RA ----ASF-', source: 'morphgnt_sblgnt' }
    ],
    5:  [
      { strongsId: 'G1519', role: 'primary', order: 1, pos: 6, surface: 'εἰς', morph: 'P- --------', source: 'morphgnt_sblgnt' },
      { strongsId: 'G1473', role: 'secondary', order: 2, pos: 7, surface: 'ἡμᾶς', morph: 'RP ----AP--', source: 'morphgnt_sblgnt' }
    ],
    6:  [{ strongsId: 'G3754', role: 'primary', order: 1, pos: 10, surface: 'ὅτι', morph: 'C- --------', source: 'morphgnt_sblgnt' }],
    7:  [
      { strongsId: 'G1473', role: 'primary', order: 1, pos: 14, surface: 'ἡμῶν', morph: 'RP ----GP--', source: 'morphgnt_sblgnt' },
      { strongsId: 'G1510', role: 'secondary', order: 2, pos: 13, surface: 'ὄντων', morph: 'V- -PAPGPM-', source: 'morphgnt_sblgnt' }
    ],
    8:  [{ strongsId: 'G2089', role: 'primary', order: 1, pos: 11, surface: 'ἔτι', morph: 'D- --------', source: 'morphgnt_sblgnt' }],
    9:  [{ strongsId: 'G268', role: 'primary', order: 1, pos: 12, surface: 'ἁμαρτωλῶν', morph: 'A- ----GPM-', source: 'morphgnt_sblgnt' }],
    10: [{ strongsId: 'G599', role: 'primary', order: 1, pos: 18, surface: 'ἀπέθανεν', morph: 'V- 3AAI-S--', source: 'morphgnt_sblgnt' }],
    11: [{ strongsId: 'G5547', role: 'primary', order: 1, pos: 15, surface: 'Χριστὸς', morph: 'N- ----NSM-', source: 'morphgnt_sblgnt' }],
    12: [
      { strongsId: 'G5228', role: 'primary', order: 1, pos: 16, surface: 'ὑπὲρ', morph: 'P- --------', source: 'morphgnt_sblgnt' },
      { strongsId: 'G1473', role: 'secondary', order: 2, pos: 17, surface: 'ἡμῶν', morph: 'RP ----GP--', source: 'morphgnt_sblgnt' }
    ]
  },
  '1Thess 5:18': {
    1:  [{ strongsId: 'G2168', role: 'primary', order: 1, pos: 3, surface: 'εὐχαριστεῖτε', morph: 'V- 2PAD-P--', source: 'morphgnt_sblgnt' }],
    2:  [{ strongsId: 'G1722', role: 'primary', order: 1, pos: 1, surface: 'ἐν', morph: 'P- --------', source: 'morphgnt_sblgnt' }],
    3:  [{ strongsId: 'G3956', role: 'primary', order: 1, pos: 2, surface: 'παντὶ', morph: 'A- ----DSN-', source: 'morphgnt_sblgnt' }],
    4:  [{ strongsId: 'G3956', role: 'primary', order: 1, pos: 2, surface: 'παντὶ', morph: 'A- ----DSN-', source: 'morphgnt_sblgnt' }],
    5:  [{ strongsId: 'G1063', role: 'primary', order: 1, pos: 5, surface: 'γὰρ', morph: 'C- --------', source: 'morphgnt_sblgnt' }],
    6:  [{ strongsId: 'G3778', role: 'primary', order: 1, pos: 4, surface: 'τοῦτο', morph: 'RD ----NSN-', source: 'morphgnt_sblgnt' }],
    8:  [{ strongsId: 'G2307', role: 'primary', order: 1, pos: 6, surface: 'θέλημα', morph: 'N- ----NSN-', source: 'morphgnt_sblgnt' }],
    9:  [{ strongsId: 'G2316', role: 'primary', order: 1, pos: 7, surface: 'θεοῦ', morph: 'N- ----GSM-', source: 'morphgnt_sblgnt' }],
    10: [{ strongsId: 'G1722', role: 'primary', order: 1, pos: 8, surface: 'ἐν', morph: 'P- --------', source: 'morphgnt_sblgnt' }],
    11: [{ strongsId: 'G5547', role: 'primary', order: 1, pos: 9, surface: 'Χριστῷ', morph: 'N- ----DSM-', source: 'morphgnt_sblgnt' }],
    12: [{ strongsId: 'G2424', role: 'primary', order: 1, pos: 10, surface: 'Ἰησοῦ', morph: 'N- ----DSM-', source: 'morphgnt_sblgnt' }],
    13: [{ strongsId: 'G1519', role: 'primary', order: 1, pos: 11, surface: 'εἰς', morph: 'P- --------', source: 'morphgnt_sblgnt' }],
    14: [{ strongsId: 'G4771', role: 'primary', order: 1, pos: 12, surface: 'ὑμᾶς', morph: 'RP ----AP--', source: 'morphgnt_sblgnt' }]
  },
  'Eph 2:10': {
    3: [
      { strongsId: 'G4161', role: 'primary', order: 1, pos: 4, surface: 'ποίημα', morph: 'N- ----NSN-', source: 'morphgnt_sblgnt' },
      { strongsId: 'G846', role: 'secondary', order: 2, pos: 1, surface: 'αὐτοῦ', morph: 'RP ----GSM-', source: 'morphgnt_sblgnt' }
    ],
    8: [
      { strongsId: 'G2041', role: 'primary', order: 1, pos: 10, surface: 'ἔργοις', morph: 'N- ----DPN-', source: 'morphgnt_sblgnt' },
      { strongsId: 'G1909', role: 'secondary', order: 2, pos: 9, surface: 'ἐπὶ', morph: 'P- --------', source: 'morphgnt_sblgnt' }
    ],
    12: [
      { strongsId: 'G2316', role: 'primary', order: 1, pos: 15, surface: 'θεὸς', morph: 'N- ----NSM-', source: 'morphgnt_sblgnt' },
      { strongsId: 'G3588', role: 'secondary', order: 2, pos: 14, surface: 'ὁ', morph: 'RA ----NSM-', source: 'morphgnt_sblgnt' }
    ],
    13: [
      { strongsId: 'G4282', role: 'primary', order: 1, pos: 13, surface: 'προητοίμασεν', morph: 'V- 3AAI-S--', source: 'morphgnt_sblgnt' },
      { strongsId: 'G3739', role: 'secondary', order: 2, pos: 12, surface: 'οἷς', morph: 'RR ----DPN-', source: 'morphgnt_sblgnt' }
    ],
    16: [
      { strongsId: 'G1722', role: 'primary', order: 1, pos: 17, surface: 'ἐν', morph: 'P- --------', source: 'morphgnt_sblgnt' },
      { strongsId: 'G846', role: 'secondary', order: 2, pos: 18, surface: 'αὐτοῖς', morph: 'RP ----DPN-', source: 'morphgnt_sblgnt' }
    ]
  },
  'Mark 12:30': {
    1:  [{ strongsId: 'G2532', role: 'secondary', order: 2, pos: 1, surface: 'καὶ', morph: 'C- --------', source: 'morphgnt_sblgnt' }],
    3:  [{ strongsId: 'G4771', role: 'secondary', order: 2, pos: 6, surface: 'σου', morph: 'RP ----GS--', source: 'morphgnt_sblgnt' }],
    6:  [{ strongsId: 'G4771', role: 'secondary', order: 2, pos: 11, surface: 'σου', morph: 'RP ----GS--', source: 'morphgnt_sblgnt' }],
    9:  [{ strongsId: 'G4771', role: 'secondary', order: 2, pos: 17, surface: 'σου', morph: 'RP ----GS--', source: 'morphgnt_sblgnt' }],
    12: [{ strongsId: 'G4771', role: 'secondary', order: 2, pos: 23, surface: 'σου', morph: 'RP ----GS--', source: 'morphgnt_sblgnt' }],
    15: [{ strongsId: 'G4771', role: 'secondary', order: 2, pos: 29, surface: 'σου', morph: 'RP ----GS--', source: 'morphgnt_sblgnt' }]
  },
  'Rom 12:1': {
    5:  [{ strongsId: 'G1223', role: 'secondary', order: 2, pos: 5, surface: 'διὰ', morph: 'P- --------', source: 'morphgnt_sblgnt' }],
    9:  [{ strongsId: 'G4771', role: 'secondary', order: 2, pos: 13, surface: 'ὑμῶν', morph: 'RP ----GP--', source: 'morphgnt_sblgnt' }],
    16: [{ strongsId: 'G4771', role: 'secondary', order: 2, pos: 23, surface: 'ὑμῶν', morph: 'RP ----GP--', source: 'morphgnt_sblgnt' }]
  },
  '1Pet 2:9': {
    15: [{ strongsId: 'G4771', role: 'secondary', order: 2, pos: 19, surface: 'ὑμᾶς', morph: 'RP ----AP--', source: 'morphgnt_sblgnt' }],
    19: [{ strongsId: 'G846', role: 'secondary', order: 2, pos: 24, surface: 'αὐτοῦ', morph: 'RP ----GSM-', source: 'morphgnt_sblgnt' }]
  },
  'Deut 8:3': {
    4:  [{ strongsId: 'H853', role: 'secondary', order: 2, pos: 4, surface: 'אֶת', morph: 'HTo', source: 'oshb_wlc' }],
    16: [{ strongsId: 'H5921', role: 'secondary', order: 2, pos: 16, surface: 'עַל', morph: 'HR', source: 'oshb_wlc' }],
    21: [{ strongsId: 'H5921', role: 'secondary', order: 2, pos: 22, surface: 'עַל', morph: 'HR', source: 'oshb_wlc' }]
  },
  'Josh 24:15': {
    7:  [{ strongsId: 'H853', role: 'secondary', order: 2, pos: 5, surface: 'אֶת', morph: 'HTo', source: 'oshb_wlc' }],
    36: [{ strongsId: 'H853', role: 'secondary', order: 2, pos: 34, surface: 'אֶת', morph: 'HTo', source: 'oshb_wlc' }]
  },
  'Ezra 4:12': {
    1:  [{ strongsId: 'H1934', role: 'secondary', order: 2, pos: 2, surface: 'לֶהֱוֵ֣א', morph: 'AVqi3ms', source: 'oshb_wlc' }]
  },
  'Ezra 7:12': {
    9:  [{ strongsId: 'H1768', role: 'secondary', order: 2, pos: 8, surface: 'דִּֽי', morph: 'ATr', source: 'oshb_wlc' }]
  },
  'Dan 2:44': {
    2:  [{ strongsId: 'H1768', role: 'secondary', order: 2, pos: 2, surface: 'דִּ֧י', morph: 'ATr', source: 'oshb_wlc' }],
    9:  [{ strongsId: 'H1768', role: 'secondary', order: 2, pos: 9, surface: 'דִּ֤י', morph: 'ATr', source: 'oshb_wlc' }]
  },
  '2Chr 7:14': {
    "2": [
        {
            "strongsId": "H3665",
            "role": "primary",
            "order": 1,
            "pos": 1,
            "surface": "וְיִכָּנְע֨וּ",
            "morph": "HC/VNi3mp",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H9002",
            "role": "secondary",
            "order": 2,
            "pos": 1,
            "surface": "וְ",
            "morph": "HC",
            "source": "oshb_wlc"
        }
    ],
    "3": [
        {
            "strongsId": "H5971",
            "role": "primary",
            "order": 1,
            "pos": 2,
            "surface": "עַמִּ֜י",
            "morph": "HNcmsc/Sp1cs",
            "source": "oshb_wlc"
        }
    ],
    "4": [
        {
            "strongsId": "H834",
            "role": "primary",
            "order": 1,
            "pos": 3,
            "surface": "אֲשֶׁ֧ר",
            "morph": "HTr",
            "source": "oshb_wlc"
        }
    ],
    "5": [
        {
            "strongsId": "H7121",
            "role": "primary",
            "order": 1,
            "pos": 4,
            "surface": "נִֽקְרָא",
            "morph": "HVNp3ms",
            "source": "oshb_wlc"
        }
    ],
    "6": [
        {
            "strongsId": "H8034",
            "role": "primary",
            "order": 1,
            "pos": 5,
            "surface": "שְׁמִ֣י",
            "morph": "HNcmsc/Sp1cs",
            "source": "oshb_wlc"
        }
    ],
    "7": [
        {
            "strongsId": "H5921",
            "role": "primary",
            "order": 1,
            "pos": 6,
            "surface": "עֲלֵיהֶ֗ם",
            "morph": "HR/Sp3mp",
            "source": "oshb_wlc"
        }
    ],
    "8": [
        {
            "strongsId": "H6419",
            "role": "primary",
            "order": 1,
            "pos": 7,
            "surface": "וְיִֽתְפַּֽלְלוּ֙",
            "morph": "HC/Vti3mp",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H9002",
            "role": "secondary",
            "order": 2,
            "pos": 7,
            "surface": "וְ",
            "morph": "HC",
            "source": "oshb_wlc"
        }
    ],
    "9": [
        {
            "strongsId": "H1245",
            "role": "primary",
            "order": 1,
            "pos": 8,
            "surface": "וִֽיבַקְשׁ֣וּ",
            "morph": "HC/Vpi3mp",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H9002",
            "role": "secondary",
            "order": 2,
            "pos": 8,
            "surface": "וִֽ",
            "morph": "HC",
            "source": "oshb_wlc"
        }
    ],
    "10": [
        {
            "strongsId": "H6440",
            "role": "primary",
            "order": 1,
            "pos": 9,
            "surface": "פָנַ֔י",
            "morph": "HNcbpc/Sp1cs",
            "source": "oshb_wlc"
        }
    ],
    "11": [
        {
            "strongsId": "H7725",
            "role": "primary",
            "order": 1,
            "pos": 10,
            "surface": "וְיָשֻׁ֖בוּ",
            "morph": "HC/Vqi3mp",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H9002",
            "role": "secondary",
            "order": 2,
            "pos": 10,
            "surface": "וְ",
            "morph": "HC",
            "source": "oshb_wlc"
        }
    ],
    "12": [
        {
            "strongsId": "H4480",
            "role": "primary",
            "order": 1,
            "pos": 11,
            "surface": "מִדַּרְכֵיהֶ֣ם",
            "morph": "HR",
            "source": "oshb_wlc"
        }
    ],
    "13": [
        {
            "strongsId": "H1870",
            "role": "primary",
            "order": 1,
            "pos": 11,
            "surface": "מִדַּרְכֵיהֶ֣ם",
            "morph": "HR/Ncbpc/Sp3mp",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H4480",
            "role": "secondary",
            "order": 2,
            "pos": 11,
            "surface": "מִ",
            "morph": "HR",
            "source": "oshb_wlc"
        }
    ],
    "14": [
        {
            "strongsId": "H7451",
            "role": "primary",
            "order": 1,
            "pos": 12,
            "surface": "הָרָעִ֑ים",
            "morph": "HTd/Aampa",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H9009",
            "role": "secondary",
            "order": 2,
            "pos": 12,
            "surface": "הָ",
            "morph": "HTd",
            "source": "oshb_wlc"
        }
    ],
    "15": [
        {
            "strongsId": "H589",
            "role": "primary",
            "order": 1,
            "pos": 13,
            "surface": "וַאֲנִי֙",
            "morph": "HC/Pp1cs",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H9002",
            "role": "secondary",
            "order": 2,
            "pos": 13,
            "surface": "וַ",
            "morph": "HC",
            "source": "oshb_wlc"
        }
    ],
    "16": [
        {
            "strongsId": "H8085",
            "role": "primary",
            "order": 1,
            "pos": 14,
            "surface": "אֶשְׁמַ֣ע",
            "morph": "HVqi1cs",
            "source": "oshb_wlc"
        }
    ],
    "17": [
        {
            "strongsId": "H4480",
            "role": "primary",
            "order": 1,
            "pos": 15,
            "surface": "מִן",
            "morph": "HR",
            "source": "oshb_wlc"
        }
    ],
    "18": [
        {
            "strongsId": "H8064",
            "role": "primary",
            "order": 1,
            "pos": 16,
            "surface": "הַשָּׁמַ֔יִם",
            "morph": "HTd/Ncmpa",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H9009",
            "role": "secondary",
            "order": 2,
            "pos": 16,
            "surface": "הַ",
            "morph": "HTd",
            "source": "oshb_wlc"
        }
    ],
    "19": [
        {
            "strongsId": "H5545",
            "role": "primary",
            "order": 1,
            "pos": 17,
            "surface": "וְאֶסְלַח֙",
            "morph": "HC/Vqi1cs",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H9002",
            "role": "secondary",
            "order": 2,
            "pos": 17,
            "surface": "וְ",
            "morph": "HC",
            "source": "oshb_wlc"
        }
    ],
    "20": [
        {
            "strongsId": "H2403",
            "role": "primary",
            "order": 1,
            "pos": 18,
            "surface": "לְחַטָּאתָ֔ם",
            "morph": "HR/Ncfsc/Sp3mp",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H9005",
            "role": "secondary",
            "order": 2,
            "pos": 18,
            "surface": "לְ",
            "morph": "HR",
            "source": "oshb_wlc"
        }
    ],
    "21": [
        {
            "strongsId": "H7495",
            "role": "primary",
            "order": 1,
            "pos": 19,
            "surface": "וְאֶרְפָּ֖א",
            "morph": "HC/Vqi1cs",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H9002",
            "role": "secondary",
            "order": 2,
            "pos": 19,
            "surface": "וְ",
            "morph": "HC",
            "source": "oshb_wlc"
        }
    ],
    "22": [
        {
            "strongsId": "H776",
            "role": "primary",
            "order": 1,
            "pos": 21,
            "surface": "אַרְצָֽם",
            "morph": "HNcbsc/Sp3mp",
            "source": "oshb_wlc"
        },
        {
            "strongsId": "H853",
            "role": "secondary",
            "order": 2,
            "pos": 20,
            "surface": "אֶת",
            "morph": "HTo",
            "source": "oshb_wlc"
        }
    ]
  },
  'Ezra 5:11': {
    "1": [
      { "strongsId": "H3660", "role": "primary", "order": 1, "pos": 1, "surface": "וּכְנֵ֥מָא", "morph": "AC/D", "source": "oshb_wlc" },
      { "strongsId": "H9002", "role": "secondary", "order": 2, "pos": 1, "surface": "וּ", "morph": "AC", "source": "oshb_wlc" }
    ],
    "2": [
      { "strongsId": "H3660", "role": "primary", "order": 1, "pos": 1, "surface": "וּכְנֵ֥מָא", "morph": "AC/D", "source": "oshb_wlc" },
      { "strongsId": "H9002", "role": "secondary", "order": 2, "pos": 1, "surface": "וּ", "morph": "AC", "source": "oshb_wlc" }
    ],
    "3": [
      { "strongsId": "H6600", "role": "primary", "order": 1, "pos": 2, "surface": "פִתְגָמָ֖א", "morph": "ANcmsd/Td", "source": "oshb_wlc" }
    ],
    "4": [
      { "strongsId": "H8421", "role": "primary", "order": 1, "pos": 3, "surface": "הֲתִיב֣וּנָא", "morph": "AVhp3mp/Sp1cp", "source": "oshb_wlc" }
    ],
    "5": [
      { "strongsId": "H560", "role": "primary", "order": 1, "pos": 4, "surface": "לְמֵמַ֑ר", "morph": "AR/Vqc", "source": "oshb_wlc" },
      { "strongsId": "H9005", "role": "secondary", "order": 2, "pos": 4, "surface": "לְ", "morph": "AR", "source": "oshb_wlc" }
    ],
    "6": [
      { "strongsId": "H586", "role": "primary", "order": 1, "pos": 5, "surface": "אֲנַ֣חְנָא", "morph": "APp1cp", "source": "oshb_wlc" },
      { "strongsId": "H1994", "role": "secondary", "order": 2, "pos": 6, "surface": "הִמּ֡וֹ", "morph": "ATa", "source": "oshb_wlc" }
    ],
    "7": [
      { "strongsId": "H5649", "role": "primary", "order": 1, "pos": 7, "surface": "עַבְדוֹהִי֩", "morph": "ANcmpc/Sp3ms", "source": "oshb_wlc" }
    ],
    "8": [
      { "strongsId": "H426", "role": "primary", "order": 1, "pos": 9, "surface": "אֱלָ֨הּ", "morph": "ANcmsc", "source": "oshb_wlc" },
      { "strongsId": "H1768", "role": "secondary", "order": 2, "pos": 8, "surface": "דִֽי", "morph": "ATr", "source": "oshb_wlc" }
    ],
    "9": [
      { "strongsId": "H8065", "role": "primary", "order": 1, "pos": 10, "surface": "שְׁמַיָּ֜א", "morph": "ANcmpd/Td", "source": "oshb_wlc" }
    ],
    "10": [
      { "strongsId": "H772", "role": "primary", "order": 1, "pos": 11, "surface": "וְאַרְעָ֗א", "morph": "AC/Ncfsd/Td", "source": "oshb_wlc" },
      { "strongsId": "H9002", "role": "secondary", "order": 2, "pos": 11, "surface": "וְ", "morph": "AC", "source": "oshb_wlc" }
    ],
    "11": [
      { "strongsId": "H1124", "role": "primary", "order": 1, "pos": 12, "surface": "וּבָנַ֤יִן", "morph": "AC/Vqrmpa", "source": "oshb_wlc" },
      { "strongsId": "H9002", "role": "secondary", "order": 2, "pos": 12, "surface": "וּ", "morph": "AC", "source": "oshb_wlc" }
    ],
    "13": [
      { "strongsId": "H1005", "role": "primary", "order": 1, "pos": 13, "surface": "בַּיְתָא֙", "morph": "ANcmsd/Td", "source": "oshb_wlc" }
    ],
    "14": [
      { "strongsId": "H1768", "role": "primary", "order": 1, "pos": 14, "surface": "דִּֽי", "morph": "ATr", "source": "oshb_wlc" }
    ],
    "15": [
      { "strongsId": "H1124", "role": "primary", "order": 1, "pos": 16, "surface": "בְנֵ֜ה", "morph": "AVqsmsa", "source": "oshb_wlc" },
      { "strongsId": "H1934", "role": "secondary", "order": 2, "pos": 15, "surface": "הֲוָ֨א", "morph": "AVqp3ms", "source": "oshb_wlc" }
    ],
    "16": [
      { "strongsId": "H6928", "role": "primary", "order": 1, "pos": 17, "surface": "מִקַּדְמַ֤ת", "morph": "AR/Ncfsc", "source": "oshb_wlc" },
      { "strongsId": "H4481", "role": "secondary", "order": 2, "pos": 17, "surface": "מִ", "morph": "AR", "source": "oshb_wlc" }
    ],
    "17": [
      { "strongsId": "H1836", "role": "primary", "order": 1, "pos": 18, "surface": "דְּנָה֙", "morph": "APdxms", "source": "oshb_wlc" }
    ],
    "18": [
      { "strongsId": "H8140", "role": "primary", "order": 1, "pos": 19, "surface": "שְׁנִ֣ין", "morph": "ANcfpa", "source": "oshb_wlc" }
    ],
    "19": [
      { "strongsId": "H7690", "role": "primary", "order": 1, "pos": 20, "surface": "שַׂגִּיאָ֔ן", "morph": "AAafpa", "source": "oshb_wlc" }
    ],
    "21": [
      { "strongsId": "H1124", "role": "primary", "order": 1, "pos": 24, "surface": "בְּנָ֖הִי", "morph": "AVqp3ms/Sp3ms", "source": "oshb_wlc" }
    ],
    "22": [
      { "strongsId": "H4430", "role": "primary", "order": 1, "pos": 21, "surface": "וּמֶ֤לֶךְ", "morph": "AC/Ncmsa", "source": "oshb_wlc" },
      { "strongsId": "H9002", "role": "secondary", "order": 2, "pos": 21, "surface": "וּ", "morph": "AC", "source": "oshb_wlc" }
    ],
    "23": [
      { "strongsId": "H7229", "role": "primary", "order": 1, "pos": 23, "surface": "רַ֔ב", "morph": "AAamsa", "source": "oshb_wlc" }
    ],
    "24": [
      { "strongsId": "H3479", "role": "primary", "order": 1, "pos": 22, "surface": "לְיִשְׂרָאֵל֙", "morph": "AR/Np", "source": "oshb_wlc" },
      { "strongsId": "H9005", "role": "secondary", "order": 2, "pos": 22, "surface": "לְ", "morph": "AR", "source": "oshb_wlc" }
    ],
    "25": [
      { "strongsId": "H3635", "role": "primary", "order": 1, "pos": 25, "surface": "וְשַׁכְלְלֵֽהּ", "morph": "AC/Vep3ms/Sp3ms", "source": "oshb_wlc" },
      { "strongsId": "H9002", "role": "secondary", "order": 2, "pos": 25, "surface": "וְ", "morph": "AC", "source": "oshb_wlc" }
    ]
  }
};

for (const hv of holdoutVerses) {
  const key = `${hv.book}:${hv.ch}:${hv.vs}`;
  if (historicalExclusions.has(key)) {
    throw new Error(`Holdout independence violation: ${hv.name} (${key}) exists in historical exclusions!`);
  }
}

console.log('========================================================================');
console.log('  CALIBRATED UNSEEN HOLDOUT 4-AXIS MEASUREMENT (15 VERSES, 0% OVERLAP)  ');
console.log(`  DB SHA-256      : ${dbSha256}`);
console.log(`  Manifest SHA-256: ${manifestSha256}`);
console.log(`  Exclusions      : ${historicalExclusions.size} unique verses (SHA-256 ${manifestExHash}, overlap = 0.00%)`);
console.log('========================================================================\n');

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
  const oshbTokens = v.lang !== 'greek' ? extractOshbVerse(v.oshbBook, v.oshbOsis) : null;
  const sblTokens  = v.lang === 'greek' ? extractSblgntVerse(v.book, v.ch, v.vs) : null;
  const trTokens   = v.lang === 'greek' ? extractTrVerse(v.book, v.ch, v.vs) : null;

  const rowsRaw = query(`
    SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface,
           wm.morph_pos, wm.orig_morphology, wm.morph_gender, wm.morph_number, wm.morph_person,
           wm.morph_stem, wm.morph_mood, wm.orig_word_position, wm.verified_locator,
           wm.morph_tense, wm.morph_voice, wm.morph_case, COALESCE(wm.morph_source,''),
           COALESCE(wm.relation_type,''), COALESCE(wm.grammar_notes,''),
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
      locator,
      isSyntactic,
      lang: v.lang,
      book: v.book,
      ch: v.ch,
      vs: v.vs,
      oshbOsis: v.oshbOsis,
      arPos,
      origPos,
      morphSource,
      tokenCount: tokCount
    });

    // Parse all actual components from word_mapping_strongs
    const actualComponents = [];
    if (compDetailed) {
      for (const cStr of compDetailed.split(';')) {
        const mC = cStr.match(/^([^:]+):([^#]+)#(\d*)@w(\d*)\[([^:]*):([^:]*):([^\]]*)\]$/);
        if (!mC) continue;
        const [, cS, cRole, cOrderStr, cPStr, cSurf, cMorph, cSrc] = mC;
        actualComponents.push({
          strongsId: cS,
          role: cRole,
          order: cOrderStr ? parseInt(cOrderStr, 10) : null,
          pos: cPStr ? parseInt(cPStr, 10) : null,
          surface: cSurf || '',
          morph: cMorph || '',
          source: cSrc || ''
        });
      }
    }

    // Verify that all required components for calibrated units are present with exact fields
    if (VERIFIED_REQUIRED_COMPONENTS[v.name] && VERIFIED_REQUIRED_COMPONENTS[v.name][arPos]) {
      const reqList = VERIFIED_REQUIRED_COMPONENTS[v.name][arPos];
      if (isSyntactic && reqList.length > 0) {
        failAxis('lexical', `calibrated unit arPos #${arPos} cannot be syntactic_ar: requires ${reqList.length} original component(s)`);
        failAxis('sourceLocator', `calibrated unit arPos #${arPos} cannot use AR_SYNTACTIC: requires original components`);
      }
      for (const req of reqList) {
        const matched = actualComponents.find(c =>
          c.strongsId === req.strongsId &&
          c.role === req.role &&
          c.order === req.order &&
          c.pos === req.pos &&
          c.source === req.source
        );
        if (!matched) {
          failAxis('lexical', `missing required component ${req.strongsId}:${req.role}#${req.order}@w${req.pos}`);
          failAxis('sourceLocator', `unit requires component ${req.strongsId}:${req.role}#${req.order}@w${req.pos}`);
        } else {
          if (req.surface && matched.surface !== req.surface) {
            failAxis('lemmaSurface', `component ${req.strongsId}@w${req.pos} surface '${matched.surface}' != expected '${req.surface}'`);
          }
          if (req.morph && matched.morph !== req.morph) {
            failAxis('morphology', `component ${req.strongsId}@w${req.pos} morph '${matched.morph}' != expected '${req.morph}'`);
          }
        }
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
      if (morphPos && morphPos !== 'syntactic_ar') failAxis('morphology', `AR_SYNTACTIC carries morph_pos='${morphPos}' instead of syntactic_ar`);
      if (verifiedSource && verifiedSource !== 'syntactic_ar') failAxis('sourceLocator', `AR_SYNTACTIC carries verified_source='${verifiedSource}' instead of syntactic_ar`);
      if (morphSource && morphSource !== 'syntactic_ar') failAxis('sourceLocator', `AR_SYNTACTIC carries morph_source='${morphSource}'`);
    } else {
      if (!strongsId) failAxis('lexical', 'missing strongs_id');
      if (!compDetailed) failAxis('lexical', 'empty word_mapping_strongs');

      const locIdx = locRes.locW || (origPos > 0 ? origPos : null);
      if (!locRes.ok) {
        failAxis('sourceLocator', locRes.error);
      }
      if (locRes.locW) {
        const edKey = `${locRes.edition}:w${locRes.locW}`;
        if (seenPrimaryLocators.has(edKey)) {
          const prev = seenPrimaryLocators.get(edKey);
          const oshbTok = (locRes.edition === 'OSHB' && locRes.locW && oshbTokens) ? oshbTokens.find(t => t.index === locRes.locW) : null;
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
        if (isTr && morphSource && morphSource !== 'morphgnt_tr') {
          failAxis('sourceLocator', `TR locator carries morph_source='${morphSource}'`);
        }
        if (!isTr && morphSource && morphSource !== 'morphgnt_sblgnt') {
          failAxis('sourceLocator', `SBLGNT locator carries morph_source='${morphSource}'`);
        }
        const tok = (locIdx && tokens) ? tokens.find(t => t.index === locIdx) : null;
        if (!tok) {
          if (locIdx && tokens) failAxis('sourceLocator', `${edition} w${locIdx} exceeds token count (${tokens.length})`);
          undecidedAxis('lexical', `undecided: source token w${locIdx || '?'} unavailable in ${edition}`);
          undecidedAxis('lemmaSurface', `undecided: source token w${locIdx || '?'} unavailable in ${edition}`);
          undecidedAxis('morphology', `undecided: source token w${locIdx || '?'} unavailable in ${edition}`);
        } else if (isTr) {
          if (!origSurface || normGreekWord(origSurface) !== normGreekWord(tok.surface)) {
            failAxis('lemmaSurface', `TR surface '${origSurface}' != '${tok.surface}' @ w${locIdx}`);
          }
          if (origWord && tok.lemma && normGreekPolytonicFold(origWord) !== normGreekPolytonicFold(tok.lemma)) {
            failAxis('lemmaSurface', `TR lemma '${origWord}' != '${tok.lemma}' @ w${locIdx}`);
          }
          if (strongsId && tok.strongsId && strongsId !== tok.strongsId) {
            failAxis('lexical', `TR Strong's '${strongsId}' != '${tok.strongsId}' @ w${locIdx}`);
          }
          const dErr = verifyDerived('greek', origMorph, tok.grammar, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase }, true);
          if (dErr) failAxis('morphology', dErr);
        } else {
          const dbGr = normGreekWord(origSurface);
          if (!origSurface || ![tok.surfacePunct, tok.surfaceClean, tok.surfaceNorm].map(normGreekWord).includes(dbGr)) {
            failAxis('lemmaSurface', `SBLGNT surface '${origSurface}' != '${tok.surfaceClean}' @ w${locIdx}`);
          }
          if (origWord && tok.lemma && origWord !== tok.lemma) {
            failAxis('lemmaSurface', `SBLGNT lemma '${origWord}' != '${tok.lemma}' @ w${locIdx}`);
          }
          if (strongsId && tok.lemma && !greekStrongsMatchesLemma(strongsId, tok.lemma)) {
            failAxis('lexical', `Strongs '${strongsId}' (${strongsGreekMap.get(strongsId) || '?'}) != SBLGNT lemma '${tok.lemma}' @ w${locIdx}`);
          }
          if (origMorph && tok.morph && origMorph !== tok.morph) {
            failAxis('morphology', `morph '${origMorph}' != SBLGNT '${tok.morph}'`);
          }
          const dErr = verifyDerived('greek', origMorph, tok.morph, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase }, false);
          if (dErr) failAxis('morphology', `derived(${dErr})`);
        }

        // Audit every component inside word_mapping_strongs for Greek
        if (compDetailed && tokens) {
          for (const comp of actualComponents) {
            const { strongsId: cS, role: cRole, order: cOrder, pos: cP, surface: cSurf, morph: cMorph, source: cSrc } = comp;

            // Mandatory fields check: absence of mandatory fields is a failure
            if (!cSurf) failAxis('lemmaSurface', `wms ${cS}@w${cP || '?'} missing mandatory orig_component`);
            if (!cMorph) failAxis('morphology', `wms ${cS}@w${cP || '?'} missing mandatory orig_morphology`);
            if (!cSrc) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory morph_source`);
            if (!cRole) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_role`);
            if (!cOrder || isNaN(cOrder)) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_order`);
            if (!cP || isNaN(cP)) {
              failAxis('sourceLocator', `wms ${cS} missing mandatory orig_word_position`);
              continue;
            }

            const cTok = tokens.find(t => t.index === cP);
            if (!cTok) {
              failAxis('sourceLocator', `wms component ${cS}@w${cP} exceeds ${edition} token count (${tokens.length})`);
            } else {
              // 1. Lexical check
              if (!isTr && cTok.lemma && !greekStrongsMatchesLemma(cS, cTok.lemma)) {
                failAxis('lexical', `wms ${cS}@w${cP} != SBLGNT '${cTok.lemma}'`);
              }
              if (isTr && cTok.strongsId && cS !== cTok.strongsId) {
                failAxis('lexical', `wms ${cS}@w${cP} != TR '${cTok.strongsId}'`);
              }
              // 2. Surface check
              if (cSurf) {
                const cNorm = normGreekWord(cSurf);
                const tNorms = isTr
                  ? [normGreekWord(cTok.surface)]
                  : [cTok.surfacePunct, cTok.surfaceClean, cTok.surfaceNorm].map(normGreekWord);
                if (!tNorms.includes(cNorm)) {
                  failAxis('lemmaSurface', `wms ${cS}@w${cP} surface '${cSurf}' != ${edition} '${cTok.surfaceClean || cTok.surface}'`);
                }
              }
              // 3. Morphology check
              if (cMorph) {
                if (isTr) {
                  if (cTok.grammar && cMorph !== cTok.grammar) {
                    failAxis('morphology', `wms ${cS}@w${cP} morph '${cMorph}' != TR '${cTok.grammar}'`);
                  }
                } else {
                  if (cTok.morph && cMorph !== cTok.morph) {
                    failAxis('morphology', `wms ${cS}@w${cP} morph '${cMorph}' != SBLGNT '${cTok.morph}'`);
                  }
                }
              }
              // 4. Source edition provenance check
              if (cSrc) {
                if (isTr && cSrc !== 'morphgnt_tr') {
                  failAxis('sourceLocator', `wms ${cS}@w${cP} carries morph_source='${cSrc}' instead of morphgnt_tr`);
                }
                if (!isTr && cSrc !== 'morphgnt_sblgnt') {
                  failAxis('sourceLocator', `wms ${cS}@w${cP} carries morph_source='${cSrc}' instead of morphgnt_sblgnt`);
                }
              }
            }
          }
        }
      } else {
        // Hebrew / Aramaic OSHB
        if (morphSource && morphSource !== 'oshb_wlc') {
          failAxis('sourceLocator', `OSHB locator carries morph_source='${morphSource}'`);
        }
        const tok = (locIdx && oshbTokens) ? oshbTokens.find(t => t.index === locIdx) : null;
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
          if (origMorph && tok.morph && !morphMatches(origMorph, tok.morph)) {
            failAxis('morphology', `morph '${origMorph}' != OSHB '${tok.morph}'`);
          }
          if (strongsId && tok.lemma && !verifyHebrewStrongsAgainstLemma(strongsId, tok.lemma, origMorph)) {
            failAxis('lexical', `Strongs '${strongsId}' != OSHB lemma '${tok.lemma}' @ w${locIdx}`);
          }
          const dErr = verifyDerived(v.lang, origMorph, tok.morph, { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase });
          if (dErr) failAxis('morphology', `derived(${dErr})`);

          // Enforce mandatory morph_case when required by source morphology (e.g. Ezra 4:24, Isa 41:10, Ruth 2:12, Mic 7:18, 2Chr 7:14, Ezra 5:11)
          if (v.name === 'Ezra 4:24' || v.name === 'Isa 41:10' || v.name === 'Ruth 2:12' || v.name === 'Mic 7:18' || v.name === '2Chr 7:14' || v.name === 'Ezra 5:11') {
            const segs = (origMorph || '').split('/');
            let expState = null;
            const sMap = { c:'construct', a:'absolute', d:'determined' };
            for (const s of segs) {
              const core = s.replace(/^[HA](?=[A-Z])/, '');
              if (core[0] === 'V' && (core[2] === 'r' || core[2] === 's')) { expState = sMap[core[5]] || null; break; }
              if ((core[0] === 'N' || core[0] === 'A') && core[1] !== 'p' && core !== 'Td') { expState = sMap[core[4]] || null; break; }
            }
            if (expState && (!morphCase || morphCase !== expState)) {
              failAxis('morphology', `missing or incorrect mandatory morph_case='${expState}' (got '${morphCase || ''}') for '${origMorph}'`);
            }
          }
        }

        // Audit every component inside word_mapping_strongs for Hebrew/Aramaic
        if (compDetailed && oshbTokens) {
          for (const comp of actualComponents) {
            const { strongsId: cS, role: cRole, order: cOrder, pos: cP, surface: cSurf, morph: cMorph, source: cSrc } = comp;

            // Mandatory fields check: absence of mandatory fields is a failure
            if (!cSurf) failAxis('lemmaSurface', `wms ${cS}@w${cP || '?'} missing mandatory orig_component`);
            if (!cMorph) failAxis('morphology', `wms ${cS}@w${cP || '?'} missing mandatory orig_morphology`);
            if (!cSrc) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory morph_source`);
            if (!cRole) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_role`);
            if (!cOrder || isNaN(cOrder)) failAxis('sourceLocator', `wms ${cS}@w${cP || '?'} missing mandatory link_order`);
            if (!cP || isNaN(cP)) {
              failAxis('sourceLocator', `wms ${cS} missing mandatory orig_word_position`);
              continue;
            }

            const cTok = oshbTokens.find(t => t.index === cP);
            if (!cTok) {
              failAxis('sourceLocator', `wms component ${cS}@w${cP} missing in OSHB`);
            } else {
              // 1. Lexical check
              if (!verifyHebrewStrongsAgainstLemma(cS, cTok.lemma, cMorph || origMorph)) {
                failAxis('lexical', `wms ${cS}@w${cP} fails OSHB lemma '${cTok.lemma}'`);
              }
              // 2. Surface check
              if (cSurf) {
                const cC = canonHebSurface(cSurf);
                const cParts = (cTok.rawParts || [cTok.text]).map(canonHebSurface);
                if (cC !== canonHebSurface(cTok.text) && !cParts.includes(cC)) {
                  failAxis('lemmaSurface', `wms ${cS}@w${cP} surface '${cSurf}' != OSHB '${cTok.text}'`);
                }
              }
              // 3. Morphology check
              if (cMorph && cTok.morph && !morphMatches(cMorph, cTok.morph)) {
                failAxis('morphology', `wms ${cS}@w${cP} morph '${cMorph}' != OSHB '${cTok.morph}'`);
              }
              // 4. Source edition provenance check
              if (cSrc && cSrc !== 'oshb_wlc') {
                failAxis('sourceLocator', `wms ${cS}@w${cP} carries morph_source='${cSrc}' instead of oshb_wlc`);
              }
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
        verse: v.name, lang: v.lang, pos: arPos, arWord, strongsId, locator, morphSource,
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
  console.log(
    `  ${v.name.padEnd(12)} [${v.lang.padEnd(7)}]: clean ${String(vClean).padStart(2)}/${String(vTot).padEnd(2)} (${((vClean/vTot)*100).toFixed(1).padStart(5)}%) | ` +
    `axes(lex:${vAxes.lexical}, surf:${vAxes.lemmaSurface}, morph:${vAxes.morphology}, loc:${vAxes.sourceLocator})`
  );
}

const gTotal = langStats.hebrew.total + langStats.aramaic.total + langStats.greek.total;
const gClean = langStats.hebrew.clean + langStats.aramaic.clean + langStats.greek.clean;
const gAlerts = langStats.hebrew.alerts + langStats.aramaic.alerts + langStats.greek.alerts;

console.log('\n--- 4-AXIS GLOBAL BREAKDOWN (236+ UNITS ACROSS 15 UNSEEN VERSES) ---');
for (const k of ['lexical', 'lemmaSurface', 'morphology', 'sourceLocator']) {
  const s = axisStats[k];
  const tot = s.pass + s.fail + s.undecided;
  console.log(`  ${k.padEnd(14)}: pass ${s.pass}/${tot} (${((s.pass/tot)*100).toFixed(2)}%) — alerts: ${s.fail}, undecided: ${s.undecided}`);
}

console.log('\n--- BY LANGUAGE ---');
for (const l of ['hebrew', 'aramaic', 'greek']) {
  const s = langStats[l];
  console.log(`  ${l.padEnd(8)}: clean ${s.clean}/${s.total} (${((s.clean/s.total)*100).toFixed(2)}%), alerts=${s.alerts} | axes=${JSON.stringify(s.axes)}`);
}
console.log(`  OVERALL : clean ${gClean}/${gTotal} (${((gClean/gTotal)*100).toFixed(2)}%), alerts=${gAlerts}`);

const dartDbVerMatch = fs.readFileSync(path.join(repoRoot, 'mobile/lib/core/services/database_service.dart'), 'utf8').match(/const\s+targetDbVersion\s*=\s*(\d+);/);
const report = {
  version: dartDbVerMatch ? `v1.0.${dartDbVerMatch[1]}` : 'v1.0.379',
  dbSha256,
  manifestPath: path.relative(repoRoot, manifestPath).replace(/\\/g, '/'),
  manifestSha256,
  exclusionKeysSha256: manifestExHash,
  trSourceMode: (!process.env.USE_TR_SLICE && fs.existsSync(trFullPath))
    ? 'scripts/data/gnt_scrivener.json'
    : path.relative(repoRoot, trSlicePath).replace(/\\/g, '/'),
  historicalExclusionsCount: historicalExclusions.size,
  overlapCount: 0,
  summary: { totalUnits: gTotal, cleanUnits: gClean, alertedUnits: gAlerts, cleanPct: Number(((gClean/gTotal)*100).toFixed(2)) },
  axisBreakdown: axisStats,
  byLanguage: langStats,
  perVerse: verseSummaries,
  alerts: allAlerts
};
const outIdx = process.argv.indexOf('--out');
const targetOutPath = (outIdx !== -1 && process.argv[outIdx + 1])
  ? path.resolve(process.cwd(), process.argv[outIdx + 1])
  : path.join(repoRoot, 'scratch/unseen_holdout_4axis_latest.json');
fs.mkdirSync(path.dirname(targetOutPath), { recursive: true });
fs.writeFileSync(targetOutPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(`\nWritten calibrated 4-axis holdout report: ${targetOutPath}`);
console.log(`(Preserved baseline untouched: ${path.join(__dirname, 'unseen_holdout_4axis_v376.json')})`);

if (process.argv.includes('--fail-on-alerts') && gAlerts > 0) {
  console.error(`\n[STRICT CHECK FAILED] Holdout sample has ${gAlerts} alerts! Aborting.`);
  process.exit(1);
}
