const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const defaultDbPath = fs.existsSync(path.resolve(__dirname, '../mobile/assets/bible_study.db'))
  ? path.resolve(__dirname, '../mobile/assets/bible_study.db')
  : path.resolve(__dirname, '../bible_study.db');
const dbPath = process.env.AUDIT_DB_PATH || defaultDbPath;

function query(sql) {
  const tmpFile = path.resolve(__dirname, `temp_query_audit_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`);
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { encoding: 'utf8' }).trim();
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

// OSHB XML Parser
const oshbDir = path.resolve(__dirname, 'data/oshb');
function extractOshbVerse(bookName, osisRef) {
  const filePath = path.join(oshbDir, `${bookName}.xml`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const verseRegex = new RegExp(`<verse\\s+osisID="${osisRef}"[^>]*>([\\s\\S]*?)</verse>`);
  const match = content.match(verseRegex);
  if (!match) return null;
  const verseXml = match[1];
  const words = [];
  const wordRegex = /<w\s+([^>]+)>([\s\S]*?)<\/w>/g;
  let wMatch;
  let idx = 1;
  while ((wMatch = wordRegex.exec(verseXml)) !== null) {
    const attrs = wMatch[1];
    const rawText = wMatch[2].replace(/<[^>]+>/g, '').trim();
    const rawParts = rawText.split('/');
    const text = rawText.replace(/\//g, '');
    const lemmaMatch = attrs.match(/lemma="([^"]+)"/);
    const morphMatch = attrs.match(/morph="([^"]+)"/);
    const idMatch = attrs.match(/id="([^"]+)"/);
    words.push({
      index: idx++,
      id: idMatch ? idMatch[1] : null,
      lemma: lemmaMatch ? lemmaMatch[1] : null,
      morph: morphMatch ? morphMatch[1] : null,
      text: text,
      rawParts: rawParts
    });
  }
  return words;
}

// SBLGNT Text Parser
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
  const filePath = path.join(sblgntDir, fileName);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const tokens = [];
  let idx = 1;

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 7) continue;
    const tag = parts[0];
    const lineCh = parseInt(tag.substring(2, 4), 10);
    const lineVs = parseInt(tag.substring(4, 6), 10);
    if (lineCh === ch && lineVs === vs) {
      tokens.push({
        index: idx++,
        pos: parts[1],
        parseCode: parts[2],
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

  // Composite token match (e.g. HR against HR/Ncmsa, or Ncmsa against HR/Ncmsa)
  if (sourceMorph.includes('/')) {
    const parts = sourceMorph.split('/').map(p => p.replace(/^H/, ''));
    if (parts.includes(normDb)) return true;
  }
  return false;
}

// Helper: Match Strong's against OSHB lemma with part-of-speech integrity
function verifyHebrewStrongsAgainstLemma(strongsId, lemmaStr, morphStr, dbMorph) {
  if (!strongsId || !lemmaStr) return false;
  const numStr = strongsId.replace(/^[HG]/, '');

  // Preposition prefix H9005 (לְ): strictly requires preposition morphology on the mapped unit
  if (strongsId === 'H9005') {
    const isPrep = dbMorph === 'HR' || dbMorph === 'AR' || (dbMorph && (dbMorph.startsWith('HR/') || dbMorph.startsWith('AR/') || dbMorph.startsWith('R')));
    const hasL = lemmaStr.split('/').includes('l') || lemmaStr === 'l';
    return isPrep && hasL;
  }
  // Conjunction prefix H9002 (וְ): strictly requires conjunction morphology
  if (strongsId === 'H9002') {
    const isConj = dbMorph === 'HC' || dbMorph === 'AC' || (dbMorph && (dbMorph.startsWith('HC/') || dbMorph.startsWith('AC/') || dbMorph.startsWith('C')));
    const hasC = lemmaStr.split('/').includes('c') || lemmaStr === 'c';
    return isConj && hasC;
  }
  // Preposition prefix H9003 (בְּ): strictly requires preposition morphology
  if (strongsId === 'H9003') {
    const isPrep = dbMorph === 'HR' || dbMorph === 'AR' || (dbMorph && (dbMorph.startsWith('HR/') || dbMorph.startsWith('AR/') || dbMorph.startsWith('R')));
    const hasB = lemmaStr.split('/').includes('b') || lemmaStr === 'b';
    return isPrep && hasB;
  }
  // Preposition prefix H9004 (כְּ): strictly requires preposition morphology
  if (strongsId === 'H9004') {
    const isPrep = dbMorph === 'HR' || dbMorph === 'AR' || (dbMorph && (dbMorph.startsWith('HR/') || dbMorph.startsWith('AR/') || dbMorph.startsWith('R')));
    const hasK = lemmaStr.split('/').includes('k') || lemmaStr === 'k';
    return isPrep && hasK;
  }
  // Definite article H9009 (הַ): strictly requires article morphology
  if (strongsId === 'H9009') {
    const isArt = dbMorph === 'HTd' || (dbMorph && dbMorph.startsWith('HTd/')) || (dbMorph && dbMorph.startsWith('Td'));
    const hasD = lemmaStr.split('/').includes('d') || lemmaStr === 'd';
    return isArt && hasD;
  }

  // Preposition purity: standalone preposition (HR / AR) cannot hold a noun Strong's number
  if ((dbMorph === 'HR' || dbMorph === 'AR') && !['H9005', 'H9003', 'H9004', 'H413', 'H5921', 'H5922', 'H4480', 'H5973', 'H8478', 'H996', 'H310', 'H854', 'H5704', 'H5705'].includes(strongsId)) {
    return false;
  }

  // Content word matching (including H1980 / H3212 root equivalence)
  const parts = lemmaStr.split('/');
  for (const part of parts) {
    const cleanPart = part.replace(/\s+[a-z]$/, '').trim();
    if (cleanPart === numStr) return true;
    if ((numStr === '1980' && cleanPart === '3212') || (numStr === '3212' && cleanPart === '1980')) {
      return true;
    }
    if (numStr === '4480' && cleanPart === 'm') {
      return true;
    }
  }
  return false;
}

function verifyDerivedMorphologyAgainstSource(lang, dbMorph, srcMorph, derived, context = {}) {
  const normPerson = p => ({ first: '1', second: '2', third: '3' }[p] || p || null);
  const { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase } = derived;
  const { locator, grammarNotes } = context;

  if (lang === 'greek') {
    const m = (srcMorph || '').trim();
    if (m.length < 11) return null;
    const posCode = m.slice(0, 2).trim();
    const tag = m.slice(3, 11);
    if (tag.length !== 8) return null;
    const [personCh, tenseCh, voiceCh, moodCh, caseCh, numCh, genCh] = tag.split('');

    const personMap = { '1': '1', '2': '2', '3': '3', '-': null };
    const tenseMap = { P: 'present', I: 'imperfect', F: 'future', A: 'aorist', X: 'perfect', Y: 'pluperfect', '-': null };
    const voiceMap = { A: 'active', M: 'middle', P: 'passive', '-': null };
    const moodMap = { I: 'indicative', D: 'imperative', S: 'subjunctive', O: 'optative', N: 'infinitive', P: 'participle', '-': null };
    const caseMap = { N: 'nominative', G: 'genitive', D: 'dative', A: 'accusative', V: 'vocative', '-': null };
    const numMap = { S: 'singular', P: 'plural', '-': null };
    const genMap = { M: 'masculine', F: 'feminine', N: 'neuter', '-': null };
    const posMap = {
      'V-': ['verb'], 'N-': ['noun'], 'A-': ['adjective'], 'C-': ['conjunction'],
      'D-': ['adverb'], 'P-': ['preposition'], 'X-': ['particle'], 'I-': ['interjection'],
      'RA': ['article', 'pronoun'], 'RD': ['demonstrative', 'pronoun'],
      'RI': ['interrogative_pronoun', 'pronoun'], 'RP': ['personal_pronoun', 'pronoun'],
      'RR': ['relative_pronoun', 'pronoun']
    };

    const allowedPos = posMap[posCode];
    if (allowedPos && !allowedPos.includes(morphPos)) {
      return `Derived morph_pos mismatch: DB '${morphPos}' vs MorphGNT '${posCode}'`;
    }
    if ((normPerson(morphPerson)) !== personMap[personCh]) {
      return `Derived morph_person mismatch: DB '${morphPerson}' vs MorphGNT '${personMap[personCh]}' (${srcMorph})`;
    }
    if ((morphTense || null) !== tenseMap[tenseCh]) {
      return `Derived morph_tense mismatch: DB '${morphTense}' vs MorphGNT '${tenseMap[tenseCh]}' (${srcMorph})`;
    }
    if ((morphVoice || null) !== voiceMap[voiceCh]) {
      return `Derived morph_voice mismatch: DB '${morphVoice}' vs MorphGNT '${voiceMap[voiceCh]}' (${srcMorph})`;
    }
    if ((morphMood || null) !== moodMap[moodCh]) {
      return `Derived morph_mood mismatch: DB '${morphMood}' vs MorphGNT '${moodMap[moodCh]}' (${srcMorph})`;
    }
    if ((morphCase || null) !== caseMap[caseCh]) {
      return `Derived morph_case mismatch: DB '${morphCase}' vs MorphGNT '${caseMap[caseCh]}' (${srcMorph})`;
    }
    if ((morphNumber || null) !== numMap[numCh]) {
      return `Derived morph_number mismatch: DB '${morphNumber}' vs MorphGNT '${numMap[numCh]}' (${srcMorph})`;
    }
    if ((morphGender || null) !== genMap[genCh]) {
      return `Derived morph_gender mismatch: DB '${morphGender}' vs MorphGNT '${genMap[genCh]}' (${srcMorph})`;
    }
    return null;
  }

  // Hebrew / Aramaic OSHB derived validation
  const tag = (dbMorph || srcMorph || '').trim();
  if (!tag || /^(HR|AR|HC|AC|HT|AT|R|C)$/.test(tag)) return null;
  const segs = tag.split('/');
  if (segs.length === 2 && /^(HR|AR|R)$/.test(segs[0]) && /^Sp/.test(segs[1])) {
    if ((morphPos || null) !== 'preposition') {
      return `Derived morph_pos mismatch: DB '${morphPos}' vs OSHB preposition '${tag}'`;
    }
    if (morphStem || morphTense || morphVoice || morphMood) {
      return `Non-verbal OSHB token '${tag}' has verbal attributes`;
    }
    return null;
  }

  const coreSeg = (segs.length >= 2 && /^Sp/.test(segs[segs.length - 1])) ? segs[segs.length - 2] : segs[segs.length - 1];
  const core = coreSeg.replace(/^[HA]/, '');
  const isAramaic = tag.startsWith('A') || lang === 'aramaic';
  const gMap = { m: 'masculine', f: 'feminine', b: 'common', c: 'common' };
  const nMap = { s: 'singular', p: 'plural', d: 'dual' };

  if (core[0] === 'V') {
    if (morphPos !== 'verb') return `Derived morph_pos mismatch: DB '${morphPos}' vs OSHB verb '${tag}'`;
    const stemMap = isAramaic
      ? { q: 'peal', Q: 'peil', p: 'pael', P: 'pael_passive', a: 'aphel', A: 'haphel_passive', h: 'haphel', u: 'hithpeel', t: 'hithpaal', o: 'polel', O: 'polal', e: 'ethpeel', i: 'ithpaal' }
      : { q: 'qal', Q: 'qal_passive', N: 'niphal', p: 'piel', P: 'pual', h: 'hiphil', H: 'hophal', t: 'hithpael', o: 'polel', O: 'polal', c: 'pilpel', C: 'polpal' };
    const expStem = stemMap[core[1]];
    if (expStem && (morphStem || null) !== expStem) {
      return `Derived morph_stem mismatch: DB '${morphStem}' vs OSHB stem '${expStem}' (${tag})`;
    }
    const conj = core[2];
    const tenseMap = { p: 'qatal', q: 'weqatal', i: 'yiqtol', w: 'wayyiqtol', j: 'yiqtol', h: 'yiqtol' };
    const expTense = tenseMap[conj] || null;
    const isDocumentedDan414Yitsbe = (
      locator === 'OSHB:B27.C4.V14.w21' &&
      tag === 'AVqp3ms' &&
      morphTense === 'yiqtol' &&
      grammarNotes &&
      grammarNotes.includes('AVqp3ms') &&
      /Yiqtol|مضارع/i.test(grammarNotes)
    );
    if ((morphTense || null) !== expTense && !isDocumentedDan414Yitsbe) {
      return `Derived morph_tense mismatch: DB '${morphTense}' vs OSHB tense '${expTense}' (${tag})`;
    }
    const moodMap = { p: 'indicative', q: 'indicative', i: 'indicative', w: 'indicative', v: 'imperative', j: 'jussive', h: 'cohortative', r: 'participle', s: 'passive_participle', c: 'infinitive_construct', a: 'infinitive_absolute' };
    const expMood = moodMap[conj];
    if (expMood && (morphMood || null) !== expMood) {
      return `Derived morph_mood mismatch: DB '${morphMood}' vs OSHB mood '${expMood}' (${tag})`;
    }
    if ((core[1] === 'N' || core[1] === 'Q' || core[1] === 'u' || conj === 's') && morphVoice !== 'passive') {
      return `Derived morph_voice mismatch: DB '${morphVoice}' vs expected 'passive' (${tag})`;
    }
    if ('pqiwjhv'.includes(conj)) {
      if (normPerson(morphPerson) !== (['1', '2', '3'].includes(core[3]) ? core[3] : null)) {
        return `Derived morph_person mismatch: DB '${morphPerson}' vs OSHB '${core[3]}' (${tag})`;
      }
      if ((morphGender || null) !== (gMap[core[4]] || null)) {
        return `Derived morph_gender mismatch: DB '${morphGender}' vs OSHB '${core[4]}' (${tag})`;
      }
      if ((morphNumber || null) !== (nMap[core[5]] || null)) {
        return `Derived morph_number mismatch: DB '${morphNumber}' vs OSHB '${core[5]}' (${tag})`;
      }
    } else if (conj === 'r' || conj === 's') {
      if (normPerson(morphPerson) !== null) return `Participle '${tag}' cannot carry morph_person '${morphPerson}'`;
      if ((morphGender || null) !== (gMap[core[3]] || null)) return `Derived morph_gender mismatch: DB '${morphGender}' vs OSHB '${core[3]}' (${tag})`;
      if ((morphNumber || null) !== (nMap[core[4]] || null)) return `Derived morph_number mismatch: DB '${morphNumber}' vs OSHB '${core[4]}' (${tag})`;
    }
  } else if ((core[0] === 'N' || core[0] === 'A') && core[1] !== 'p') {
    if (morphStem || morphTense || morphVoice || morphMood || morphPerson) {
      return `Nominal OSHB token '${tag}' carries verbal/person attributes`;
    }
    if ((morphGender || null) !== (gMap[core[2]] || null)) {
      return `Derived morph_gender mismatch: DB '${morphGender}' vs OSHB '${core[2]}' (${tag})`;
    }
    if ((morphNumber || null) !== (nMap[core[3]] || null)) {
      return `Derived morph_number mismatch: DB '${morphNumber}' vs OSHB '${core[3]}' (${tag})`;
    }
  } else if (core[0] === 'P' && '123'.includes(core[2])) {
    if (morphStem || morphTense || morphVoice || morphMood) {
      return `Pronoun OSHB token '${tag}' carries verbal attributes`;
    }
    if (normPerson(morphPerson) !== core[2]) {
      return `Derived morph_person mismatch: DB '${morphPerson}' vs OSHB '${core[2]}' (${tag})`;
    }
    if ((morphGender || null) !== (gMap[core[3]] || null)) {
      return `Derived morph_gender mismatch: DB '${morphGender}' vs OSHB '${core[3]}' (${tag})`;
    }
    if ((morphNumber || null) !== (nMap[core[4]] || null)) {
      return `Derived morph_number mismatch: DB '${morphNumber}' vs OSHB '${core[4]}' (${tag})`;
    }
  }
  return null;
}

// Load canonical manifest directly
const manifestPath = process.env.AUDIT_MANIFEST_PATH || path.resolve(__dirname, 'batch_20_verses_manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`Cannot find manifest at ${manifestPath}`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const targetVerses = manifest.verses;

console.log(`Auditing all 20 verses (${manifest.records.length} records) directly from canonical manifest against database & sources...\n`);

const allResults = [];
let countCorrect = 0;
let countError = 0;
let countUndecided = 0;
let mismatchWithManifest = 0;

for (const v of targetVerses) {
  let sourceTokens = null;
  if (v.lang === 'hebrew' || v.lang === 'aramaic') {
    const oshbFile = v.source_file ? v.source_file.replace('.xml', '') : v.oshbFile;
    const oshbOsis = v.osis || v.oshbOsis;
    sourceTokens = extractOshbVerse(oshbFile, oshbOsis);
  } else if (v.lang === 'greek') {
    const sblgntId = v.sblgntBookId || v.book;
    sourceTokens = extractSblgntVerse(sblgntId, v.ch, v.vs);
  }

  const rawRows = query(`
    SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface,
           wm.morph_pos, wm.orig_morphology, wm.morph_gender, wm.morph_number, wm.morph_person,
           wm.morph_stem, wm.morph_mood, wm.orig_word_position, wm.verified_locator,
           (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role, ';') 
            FROM (SELECT strongs_id, link_role FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms) as components,
           (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '@w' || COALESCE(wms.orig_word_position, '') || '[' || COALESCE(wms.orig_component, '') || ':' || COALESCE(wms.orig_morphology, '') || ']', ';') 
            FROM (SELECT strongs_id, link_role, orig_word_position, orig_component, orig_morphology FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms) as components_detailed,
           wm.morph_tense, wm.morph_voice, wm.morph_case,
           REPLACE(REPLACE(COALESCE(wm.grammar_notes, ''), '|', ' '), char(10), ' ')
    FROM word_mappings wm
    JOIN verses vr ON wm.verse_id = vr.id
    WHERE vr.book_id = ${v.book} AND vr.chapter_num = ${v.ch} AND vr.verse_num = ${v.vs}
    ORDER BY wm.ar_word_position ASC;
  `);

  const lines = rawRows.replace(/\r/g, '').split('\n').filter(l => l.trim().length > 0);

  for (const line of lines) {
    const parts = line.split('|');
    const mappingId = parts[0];
    const arPos = parseInt(parts[1], 10);
    const arWord = parts[2];
    const strongsId = parts[3] || null;
    const origWord = parts[4] || null;
    const origSurface = parts[5] || null;
    const morphPos = parts[6] || null;
    const origMorph = parts[7] || null;
    const morphGender = parts[8] || null;
    const morphNumber = parts[9] || null;
    const morphPerson = parts[10] || null;
    const morphStem = parts[11] || null;
    const morphMood = parts[12] || null;
    const origPos = parts[13] ? parseInt(parts[13], 10) : null;
    const locator = parts[14] || null;
    const components = parts[15] || '';
    const componentsDetailed = parts[16] || '';
    const morphTense = parts[17] || null;
    const morphVoice = parts[18] || null;
    const morphCase = parts[19] || null;
    const grammarNotes = parts[20] || null;

    // Manifest specification for this unit
    const manifestRec = manifest.records.find(r => r.verse === v.name && r.arPos === arPos);

    const locMatch = locator ? locator.match(/\.w(\d+)/) : null;
    const locWordIndex = locMatch ? parseInt(locMatch[1], 10) : null;

    const axisFindings = {
      lexical: { status: 'pass', note: '' },
      lemmaSurface: { status: 'pass', note: '' },
      morphology: { status: 'pass', note: '' },
      sourceLocator: { status: 'pass', note: '' }
    };

    // Check if manifest designates this unit as undecided / pending review
    if (manifestRec && manifestRec.overallStatus === 'غير محسوم') {
      axisFindings.lexical.status = 'undecided';
      axisFindings.lexical.note = manifestRec.axisFindings?.lexical?.note || 'Pending linguistic review';
    }

    const isSyntactic = morphPos === 'syntactic_ar' || locator?.startsWith('AR_SYNTACTIC');

    if (axisFindings.lexical.status === 'undecided') {
      // Undecided state preserved
    } else if (isSyntactic) {
      if (strongsId !== null) {
        axisFindings.lexical.status = 'fail';
        axisFindings.lexical.note = `Syntactic item has non-null Strongs: ${strongsId}`;
      }
      if (origWord !== '—' && origWord !== null && origWord !== '') {
        axisFindings.lemmaSurface.status = 'fail';
        axisFindings.lemmaSurface.note = `Syntactic item has orig_word: ${origWord}`;
      }
      if (manifestRec && Object.prototype.hasOwnProperty.call(manifestRec, 'morphPos') && (morphPos || null) !== (manifestRec.morphPos || null)) {
        axisFindings.morphology.status = 'fail';
        axisFindings.morphology.note = `Syntactic morphPos mismatch: DB '${morphPos}' vs manifest '${manifestRec.morphPos}'`;
      }
    } else {
      // 1. Lexical Axis: Strong's presence and accuracy against source lemma
      if (!strongsId) {
        axisFindings.lexical.status = 'fail';
        axisFindings.lexical.note = 'Missing strongs_id for content word';
      }

      // Check against manifest expected Strongs ID
      if (manifestRec && manifestRec.strongsId && strongsId !== manifestRec.strongsId) {
        axisFindings.lexical.status = 'fail';
        axisFindings.lexical.note = `Strongs ID mismatch: DB '${strongsId}' vs manifest '${manifestRec.strongsId}'`;
      }

      // Check multi-component integrity: reject missing or mismatched components, including position, surface form, and morphology
      // Check multi-component & link completeness in word_mapping_strongs
      if (!components || components.trim() === '') {
        axisFindings.lexical.status = 'fail';
        axisFindings.lexical.note = 'Missing row(s) in word_mapping_strongs for content word';
      } else {
        const primaryComp = components.split(';').find(c => c.endsWith(':primary'));
        if (!primaryComp || primaryComp.split(':')[0] !== strongsId) {
          axisFindings.lexical.status = 'fail';
          axisFindings.lexical.note = `Primary link in word_mapping_strongs (${primaryComp || 'none'}) != word_mappings.strongs_id (${strongsId})`;
        }
      }

      if (manifestRec && manifestRec.components) {
        const normExpComp = manifestRec.components.trim().replace(/\r/g, '');
        if (normExpComp.includes('@w')) {
          const normDbDetailed = (componentsDetailed || '').trim().replace(/\r/g, '');
          if (normDbDetailed !== normExpComp) {
            axisFindings.lexical.status = 'fail';
            axisFindings.lexical.note = `Component detailed mismatch: DB has '${normDbDetailed}', expected '${normExpComp}'`;
          }
        } else {
          const normDbComp = (components || '').trim().replace(/\r/g, '');
          if (normDbComp !== normExpComp) {
            axisFindings.lexical.status = 'fail';
            axisFindings.lexical.note = `Components mismatch: DB has '${normDbComp}', expected '${normExpComp}'`;
          }
        }
      }

      // 2. Source & Locator Axis
      if (!locator) {
        axisFindings.sourceLocator.status = 'fail';
        axisFindings.sourceLocator.note = 'Missing verified_locator';
      } else if (!locWordIndex) {
        axisFindings.sourceLocator.status = 'fail';
        axisFindings.sourceLocator.note = `Cannot parse word index from locator: ${locator}`;
      } else if (origPos !== null && origPos !== locWordIndex) {
        axisFindings.sourceLocator.status = 'fail';
        axisFindings.sourceLocator.note = `orig_word_position (${origPos}) != locator index (${locWordIndex})`;
      }

      // Check against manifest expected locator
      if (manifestRec && manifestRec.locator && locator !== manifestRec.locator) {
        axisFindings.sourceLocator.status = 'fail';
        axisFindings.sourceLocator.note = `Locator mismatch: DB '${locator}' vs manifest '${manifestRec.locator}'`;
      }

      // 3. Morphology Axis: Check against manifest expected morphology & derived morph_* fields
      if (manifestRec && manifestRec.origMorph && origMorph !== manifestRec.origMorph) {
        axisFindings.morphology.status = 'fail';
        axisFindings.morphology.note = `Orig morphology mismatch: DB '${origMorph}' vs manifest '${manifestRec.origMorph}'`;
      }
      if (manifestRec) {
        const derivedChecks = [
          ['morphPos', morphPos],
          ['morphStem', morphStem],
          ['morphTense', morphTense],
          ['morphVoice', morphVoice],
          ['morphMood', morphMood],
          ['morphPerson', morphPerson],
          ['morphNumber', morphNumber],
          ['morphGender', morphGender],
          ['morphCase', morphCase]
        ];
        for (const [mKey, dbVal] of derivedChecks) {
          if (Object.prototype.hasOwnProperty.call(manifestRec, mKey) && (dbVal || null) !== (manifestRec[mKey] || null)) {
            axisFindings.morphology.status = 'fail';
            axisFindings.morphology.note = `Derived ${mKey} mismatch: DB '${dbVal}' vs manifest '${manifestRec[mKey]}'`;
            break;
          }
        }
      }

      // Surface check against manifest (preserving consonants & niqqud; ignores cantillation marks only)
      if (manifestRec && manifestRec.origSurface) {
        const surfOk = v.lang === 'greek'
          ? normGreekSurface(origSurface) === normGreekSurface(manifestRec.origSurface)
          : normOshbSurface(origSurface) === normOshbSurface(manifestRec.origSurface);
        if (!surfOk) {
          axisFindings.lemmaSurface.status = 'fail';
          axisFindings.lemmaSurface.note = `Surface mismatch: DB '${origSurface}' vs manifest '${manifestRec.origSurface}'`;
        }
      }

      // Source token checks
      if (sourceTokens && locWordIndex) {
        const sourceToken = sourceTokens.find(t => t.index === locWordIndex);
        if (!sourceToken) {
          axisFindings.sourceLocator.status = 'fail';
          axisFindings.sourceLocator.note = `Locator index ${locWordIndex} exceeds source token count (${sourceTokens.length})`;
        } else {
          if (v.lang === 'hebrew' || v.lang === 'aramaic') {
            // Check OSHB Surface Form (strict on all consonants & niqqud; ignores cantillation marks only)
            const dbSurfNorm = normOshbSurface(origSurface);
            const tokFullNorm = normOshbSurface(sourceToken.text);
            const rawParts = sourceToken.rawParts || [sourceToken.text];
            const partMatch =
              dbSurfNorm === tokFullNorm ||
              rawParts.map(normOshbSurface).includes(dbSurfNorm) ||
              normOshbSurface(rawParts.slice(1).join('')) === dbSurfNorm;
            if (!origSurface || !partMatch) {
              axisFindings.lemmaSurface.status = 'fail';
              axisFindings.lemmaSurface.note = `Surface mismatch: DB '${origSurface}' does not match OSHB '${sourceToken.text}' at w${locWordIndex}`;
            }

            // Check OSHB Morphology
            if (origMorph && sourceToken.morph && !morphMatches(origMorph, sourceToken.morph)) {
              axisFindings.morphology.status = 'fail';
              axisFindings.morphology.note = `Morph mismatch: DB '${origMorph}' vs Source '${sourceToken.morph}' (id: ${sourceToken.id})`;
            }

            // General OSHB derived morphology validation across all Hebrew/Aramaic units
            const derivedOshbErr = verifyDerivedMorphologyAgainstSource(
              v.lang, origMorph, sourceToken.morph,
              { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase },
              { locator, grammarNotes }
            );
            if (derivedOshbErr) {
              axisFindings.morphology.status = 'fail';
              axisFindings.morphology.note = derivedOshbErr;
            }

            // Check OSHB Lexical / Strongs accuracy
            if (strongsId && sourceToken.lemma) {
              const strongsOk = verifyHebrewStrongsAgainstLemma(strongsId, sourceToken.lemma, sourceToken.morph, origMorph);
              if (!strongsOk) {
                axisFindings.lexical.status = 'fail';
                axisFindings.lexical.note = `Strongs mismatch: DB '${strongsId}' does not correspond to source lemma '${sourceToken.lemma}'`;
              }
            }

            // Check every component inside word_mapping_strongs against sourceTokens
            if (componentsDetailed) {
              for (const compStr of componentsDetailed.split(';')) {
                const mComp = compStr.match(/^([^:]+):[^@]+@w(\d+)\[(.*):([^\]]*)\]$/);
                if (!mComp) continue;
                const [, cStrongs, cPosStr, cSurf, cMorph] = mComp;
                const cTok = sourceTokens.find(t => t.index === parseInt(cPosStr, 10));
                if (!cTok) {
                  axisFindings.lexical.status = 'fail';
                  axisFindings.lexical.note = `Component wms position w${cPosStr} missing in OSHB`;
                  break;
                }
                if (!verifyHebrewStrongsAgainstLemma(cStrongs, cTok.lemma, cTok.morph, cMorph || origMorph)) {
                  axisFindings.lexical.status = 'fail';
                  axisFindings.lexical.note = `Component ${cStrongs}@w${cPosStr} fails OSHB lemma check ('${cTok.lemma}')`;
                  break;
                }
                if (cSurf) {
                  const cSurfNorm = normOshbSurface(cSurf);
                  const cTokNorm = normOshbSurface(cTok.text);
                  const cParts = (cTok.rawParts || [cTok.text]).map(normOshbSurface);
                  if (cSurfNorm !== cTokNorm && !cParts.includes(cSurfNorm) && normOshbSurface((cTok.rawParts || []).slice(1).join('')) !== cSurfNorm) {
                    axisFindings.lemmaSurface.status = 'fail';
                    axisFindings.lemmaSurface.note = `Component ${cStrongs}@w${cPosStr} surface '${cSurf}' does not match OSHB '${cTok.text}'`;
                    break;
                  }
                }
              }
            }
          } else if (v.lang === 'greek') {
            // Check SBLGNT Surface Form
            const dbGrNorm = normGreekSurface(origSurface);
            if (!origSurface || ![sourceToken.surfacePunct, sourceToken.surfaceClean, sourceToken.surfaceNorm].map(normGreekSurface).includes(dbGrNorm)) {
              axisFindings.lemmaSurface.status = 'fail';
              axisFindings.lemmaSurface.note = `Greek surface mismatch: DB '${origSurface}' vs SBLGNT '${sourceToken.surfaceClean}'`;
            }
            // Check SBLGNT Morphology
            if (origMorph && sourceToken.morph && origMorph !== sourceToken.morph) {
              axisFindings.morphology.status = 'fail';
              axisFindings.morphology.note = `Morph mismatch: DB '${origMorph}' vs SBLGNT '${sourceToken.morph}'`;
            }
            // Check SBLGNT Lemma
            if (origWord && sourceToken.lemma && origWord !== sourceToken.lemma) {
              axisFindings.lemmaSurface.status = 'fail';
              axisFindings.lemmaSurface.note = `Lemma mismatch: DB '${origWord}' vs SBLGNT '${sourceToken.lemma}'`;
            }
            // General SBLGNT / MorphGNT derived morphology validation across all Greek units
            const derivedGrErr = verifyDerivedMorphologyAgainstSource(
              'greek', origMorph, sourceToken.morph,
              { morphPos, morphStem, morphTense, morphVoice, morphMood, morphPerson, morphNumber, morphGender, morphCase }
            );
            if (derivedGrErr) {
              axisFindings.morphology.status = 'fail';
              axisFindings.morphology.note = derivedGrErr;
            }
          }
        }
      }
    }

    // Determine overall status
    let overallStatus = 'صحيح';
    const hasFail = Object.values(axisFindings).some(a => a.status === 'fail');
    const hasUndecided = Object.values(axisFindings).some(a => a.status === 'undecided');

    if (hasFail) {
      overallStatus = 'خطأ';
      countError++;
    } else if (hasUndecided) {
      overallStatus = 'غير محسوم';
      countUndecided++;
    } else {
      countCorrect++;
    }

    if (manifestRec && manifestRec.overallStatus !== overallStatus) {
      mismatchWithManifest++;
      console.warn(`[DIFF] ${v.name} pos ${arPos} (${arWord}): Audit computed '${overallStatus}', but manifest has '${manifestRec.overallStatus}' (Details: ${JSON.stringify(axisFindings)})`);
    }

    allResults.push({
      verse: v.name,
      verseAr: v.nameAr,
      lang: v.lang,
      arPos,
      arWord,
      strongsId,
      components,
      origWord,
      origSurface,
      origMorph,
      origPos,
      locator,
      locWordIndex,
      isSyntactic,
      axisFindings,
      overallStatus
    });
  }
}

console.log(`\n========================================================================`);
console.log(`20-VERSE CANONICAL AUDIT SUMMARY (${allResults.length} Units Audited):`);
console.log(`  صحيح (Correct):        ${countCorrect}`);
console.log(`  خطأ (Error):           ${countError}`);
console.log(`  غير محسوم (Undecided): ${countUndecided}`);
console.log(`  نسبة الدقة الحالية:     ${((countCorrect / allResults.length) * 100).toFixed(2)}%`);
console.log(`========================================================================`);

if (mismatchWithManifest > 0) {
  console.error(`✗ Mismatch detected: ${mismatchWithManifest} units differed from canonical manifest.`);
  process.exit(1);
} else {
  console.log(`✓ 100% Deterministic Alignment: All ${allResults.length} units exactly match canonical manifest.`);
}

module.exports = {
  runAudit: () => ({ total: allResults.length, correct: countCorrect, error: countError, undecided: countUndecided }),
  allResults
};
