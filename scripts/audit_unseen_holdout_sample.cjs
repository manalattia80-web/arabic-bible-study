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
  const prepAllow = new Set(['H9005','H9003','H9004','H413','H5921','H5922','H4480','H5973','H8478','H996','H310','H854','H5704','H5705','H4616','H3890','H1157','H5668','H5048','H6925','H8460','H3644','H5049']);
  if ((dbMorph === 'HR' || dbMorph === 'AR') && lemmaStr.includes('/') && !prepAllow.has(strongsId)) {
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

function greekStrongsMatchesLemma(strongsId, tokLemma) {
  if (!strongsId || !tokLemma) return false;
  const entryWord = strongsGreekMap.get(strongsId);
  if (!entryWord) return false;
  const eFold = normGreekPolytonicFold(entryWord);
  const tFold = normGreekPolytonicFold(tokLemma);
  if (eFold === tFold) return true;
  // Common MorphGNT vs Strong's lexical pairs (ἐγώ/μου/με, σύ/σου, τις/τι, ὁ/τοῦ, etc.)
  const pairs = [
    ['εγω', 'μου'], ['εγω', 'με'], ['εγω', 'εμοι'], ['συ', 'σου'], ['συ', 'σε'],
    ['αυτος', 'αυτου'], ['ουτος', 'αυτη'], ['ος', 'ου'], ['τις', 'τι']
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
  if (segs.length === 2 && /^(HR|AR|R)$/.test(segs[0]) && /^Sp/.test(segs[1])) return null;
  const coreSeg = (segs.length >= 2 && /^Sp/.test(segs[segs.length - 1])) ? segs[segs.length - 2] : segs[segs.length - 1];
  const core = coreSeg.replace(/^[HA]/, '');
  const isAr = tag.startsWith('A') || lang === 'aramaic';
  const gMap = { m:'masculine', f:'feminine', b:'common', c:'common' };
  const nMap = { s:'singular', p:'plural', d:'dual' };
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
    }
  } else if ((core[0] === 'N' || core[0] === 'A') && core[1] !== 'p') {
    if ((d.morphGender || null) !== (gMap[core[2]] || null)) return `gender '${d.morphGender}' vs '${core[2]}'`;
    if ((d.morphNumber || null) !== (nMap[core[3]] || null)) return `number '${d.morphNumber}' vs '${core[3]}'`;
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
           (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '@w' || COALESCE(wms.orig_word_position,'') || '[' || COALESCE(wms.orig_component,'') || ':' || COALESCE(wms.orig_morphology,'') || ']', ';')
            FROM (SELECT strongs_id, link_role, orig_word_position, orig_component, orig_morphology FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms)
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
      locator, morphTense, morphVoice, morphCase, morphSource, relationType, grammarNotes, compDetailed
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

    if (isSyntactic) {
      if (!locRes.ok) failAxis('sourceLocator', locRes.error);
      if (strongsId) failAxis('lexical', `syntactic row has strongs_id='${strongsId}'`);
      if (compDetailed) failAxis('lexical', `syntactic row has word_mapping_strongs '${compDetailed}'`);
      if (origWord && origWord !== '—') failAxis('lemmaSurface', `syntactic row has orig_word='${origWord}'`);
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
          const isDocumentedSharedUnit =
            relationType === 'compound_phrase' &&
            prev.relationType === 'compound_phrase' &&
            prev.strongsId && strongsId === prev.strongsId &&
            arPos > prev.arPos && arPos <= prev.arPos + 2 &&
            Boolean(grammarNotes && grammarNotes.trim().length > 0) &&
            Boolean(prev.grammarNotes && prev.grammarNotes.trim().length > 0);
          if (!isDocumentedSharedUnit) {
            failAxis('sourceLocator', `duplicate primary token collision: ${edKey} already claimed by arPos #${prev.arPos}`);
          } else {
            seenPrimaryLocators.set(edKey, { arPos, strongsId, relationType, grammarNotes });
          }
        } else {
          seenPrimaryLocators.set(edKey, { arPos, strongsId, relationType, grammarNotes });
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
          for (const cStr of compDetailed.split(';')) {
            const mC = cStr.match(/^([^:]+):[^@]+@w(\d+)\[(.*):([^\]]*)\]$/);
            if (!mC) continue;
            const [, cS, cP, cSurf] = mC;
            const cTok = tokens.find(t => t.index === parseInt(cP, 10));
            if (!cTok) {
              failAxis('sourceLocator', `wms component ${cS}@w${cP} exceeds ${edition} token count (${tokens.length})`);
            } else {
              if (!isTr && cTok.lemma && !greekStrongsMatchesLemma(cS, cTok.lemma)) {
                failAxis('lexical', `wms ${cS}@w${cP} != SBLGNT '${cTok.lemma}'`);
              }
              if (isTr && cTok.strongsId && cS !== cTok.strongsId) {
                failAxis('lexical', `wms ${cS}@w${cP} != TR '${cTok.strongsId}'`);
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
        }

        // Audit every component inside word_mapping_strongs for Hebrew/Aramaic
        if (compDetailed && oshbTokens) {
          for (const cStr of compDetailed.split(';')) {
            const mC = cStr.match(/^([^:]+):[^@]+@w(\d+)\[(.*):([^\]]*)\]$/);
            if (!mC) continue;
            const [, cS, cP, cSurf, cMorph] = mC;
            const cTok = oshbTokens.find(t => t.index === parseInt(cP, 10));
            if (!cTok) {
              failAxis('sourceLocator', `wms component ${cS}@w${cP} missing in OSHB`);
            } else {
              if (!verifyHebrewStrongsAgainstLemma(cS, cTok.lemma, cMorph || origMorph)) {
                failAxis('lexical', `wms ${cS}@w${cP} fails OSHB lemma '${cTok.lemma}'`);
              }
              if (cSurf) {
                const cC = canonHebSurface(cSurf);
                const cParts = (cTok.rawParts || [cTok.text]).map(canonHebSurface);
                if (cC !== canonHebSurface(cTok.text) && !cParts.includes(cC) && canonHebSurface((cTok.rawParts || []).slice(1).join('')) !== cC) {
                  failAxis('lemmaSurface', `wms ${cS}@w${cP} surface '${cSurf}' != OSHB '${cTok.text}'`);
                }
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
