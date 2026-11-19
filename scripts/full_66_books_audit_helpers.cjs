/**
 * audit_full_66_books_readonly.cjs
 * Read-only comprehensive 4-axis audit across all 66 books (31,102 verses, 434,351 word_mappings).
 *
 * Strictly preserves frozen files untouched:
 *   - mobile/assets/bible_study.db
 *   - scripts/audit_unseen_holdout_sample.cjs
 *   - Round 1, Round 2, and Round 3 manifests & raw baselines
 *
 * Classifies every record and defect into:
 *   - Category A: Source link is lexically & positionally verified at wN (or valid AR_SYNTACTIC
 *                 with no unconsumed source tokens masked), and remaining issues are 100%
 *                 deterministically repairable (derived morphology fields, morph_case state,
 *                 inseparable prefix components, wms mandatory fields, orig_word/orig_surface
 *                 diacritic normalization, orig_word_lang='aramaic').
 *   - Category B: Source link at wN is unverified, displaced, out-of-bounds, colliding on
 *                 duplicate occurrences, or a false AR_SYNTACTIC masking unconsumed source tokens.
 *                 Requires contextual alignment proposal & review BEFORE any morphology re-derivation.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { verifyTrDerivedMorphology, parseRobinsonGrammar } = require('./robinson_tr_helper.cjs');
const { validateCanonicalLocator } = require('./locator_validator_helper.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = process.env.AUDIT_DB_PATH || path.join(repoRoot, 'mobile/assets/bible_study.db');

function query(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8', maxBuffer: 250 * 1024 * 1024 }).replace(/\r/g, '').trim();
}

const OT_BOOK_MAP = {
  1: 'Gen', 2: 'Exod', 3: 'Lev', 4: 'Num', 5: 'Deut',
  6: 'Josh', 7: 'Judg', 8: 'Ruth', 9: '1Sam', 10: '2Sam',
  11: '1Kgs', 12: '2Kgs', 13: '1Chr', 14: '2Chr', 15: 'Ezra',
  16: 'Neh', 17: 'Esth', 18: 'Job', 19: 'Ps', 20: 'Prov',
  21: 'Eccl', 22: 'Song', 23: 'Isa', 24: 'Jer', 25: 'Lam',
  26: 'Ezek', 27: 'Dan', 28: 'Hos', 29: 'Joel', 30: 'Amos',
  31: 'Obad', 32: 'Jonah', 33: 'Mic', 34: 'Nah', 35: 'Hab',
  36: 'Zeph', 37: 'Hag', 38: 'Zech', 39: 'Mal'
};

const SBLGNT_BOOK_MAP = {
  40: '61-Mt-morphgnt.txt', 41: '62-Mk-morphgnt.txt', 42: '63-Lk-morphgnt.txt',
  43: '64-Jn-morphgnt.txt', 44: '65-Ac-morphgnt.txt', 45: '66-Ro-morphgnt.txt',
  46: '67-1Co-morphgnt.txt', 47: '68-2Co-morphgnt.txt', 48: '69-Ga-morphgnt.txt',
  49: '70-Eph-morphgnt.txt', 50: '71-Php-morphgnt.txt', 51: '72-Col-morphgnt.txt',
  52: '73-1Th-morphgnt.txt', 53: '74-2Th-morphgnt.txt', 54: '75-1Ti-morphgnt.txt',
  55: '76-2Ti-morphgnt.txt', 56: '77-Tit-morphgnt.txt', 57: '78-Phm-morphgnt.txt',
  58: '79-Heb-morphgnt.txt', 59: '80-Jas-morphgnt.txt', 60: '81-1Pe-morphgnt.txt',
  61: '82-2Pe-morphgnt.txt', 62: '83-1Jn-morphgnt.txt', 63: '84-2Jn-morphgnt.txt',
  64: '85-3Jn-morphgnt.txt', 65: '86-Jud-morphgnt.txt', 66: '87-Re-morphgnt.txt'
};

const TR_BOOK_OSIS_MAP = {
  40: 'Matt', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts', 45: 'Rom',
  46: '1Cor', 47: '2Cor', 48: 'Gal', 49: 'Eph', 50: 'Phil', 51: 'Col',
  52: '1Thess', 53: '2Thess', 54: '1Tim', 55: '2Tim', 56: 'Titus', 57: 'Phlm',
  58: 'Heb', 59: 'Jas', 60: '1Pet', 61: '2Pet', 62: '1John', 63: '2John',
  64: '3John', 65: 'Jude', 66: 'Rev'
};

// Canonical Protestant (KJV/SVD) -> BHS (OSHB) versification mapper
function getBhsChapterVerse(bookId, ch, vs) {
  if (bookId === 1) {
    if (ch === 31 && vs === 55) return [32, 1];
    if (ch === 32 && vs >= 1 && vs <= 32) return [32, vs + 1];
  }
  if (bookId === 2) {
    if (ch === 8 && vs >= 1 && vs <= 4) return [7, vs + 25];
    if (ch === 8 && vs >= 5 && vs <= 32) return [8, vs - 4];
    if (ch === 22 && vs === 1) return [21, 37];
    if (ch === 22 && vs >= 2 && vs <= 31) return [22, vs - 1];
  }
  if (bookId === 3) {
    if (ch === 6 && vs >= 1 && vs <= 7) return [5, vs + 19];
    if (ch === 6 && vs >= 8 && vs <= 30) return [6, vs - 7];
  }
  if (bookId === 4) {
    if (ch === 16 && vs >= 36 && vs <= 50) return [17, vs - 35];
    if (ch === 17 && vs >= 1 && vs <= 13) return [17, vs + 15];
    if (ch === 29 && vs === 40) return [30, 1];
    if (ch === 30 && vs >= 1 && vs <= 16) return [30, vs + 1];
  }
  if (bookId === 5) {
    if (ch === 12 && vs === 32) return [13, 1];
    if (ch === 13 && vs >= 1 && vs <= 18) return [13, vs + 1];
    if (ch === 22 && vs === 30) return [23, 1];
    if (ch === 23 && vs >= 1 && vs <= 25) return [23, vs + 1];
    if (ch === 29 && vs === 1) return [28, 69];
    if (ch === 29 && vs >= 2 && vs <= 29) return [29, vs - 1];
  }
  if (bookId === 9) {
    if (ch === 21 && vs >= 1 && vs <= 15) return [21, vs + 1];
    if (ch === 23 && vs === 29) return [24, 1];
    if (ch === 24 && vs >= 1 && vs <= 22) return [24, vs + 1];
  }
  if (bookId === 10) {
    if (ch === 18 && vs === 33) return [19, 1];
    if (ch === 19 && vs >= 1 && vs <= 43) return [19, vs + 1];
  }
  if (bookId === 11) {
    if (ch === 4 && vs >= 21 && vs <= 34) return [5, vs - 20];
    if (ch === 5 && vs >= 1 && vs <= 18) return [5, vs + 14];
    if (ch === 22 && vs >= 43 && vs <= 53) return [22, vs + 1];
  }
  if (bookId === 12) {
    if (ch === 11 && vs === 21) return [12, 1];
    if (ch === 12 && vs >= 1 && vs <= 21) return [12, vs + 1];
  }
  if (bookId === 13) {
    if (ch === 6 && vs >= 1 && vs <= 15) return [5, vs + 26];
    if (ch === 6 && vs >= 16 && vs <= 81) return [6, vs - 15];
    if (ch === 12 && vs >= 5 && vs <= 40) return [12, vs + 1];
  }
  if (bookId === 14) {
    if (ch === 2 && vs === 1) return [1, 18];
    if (ch === 2 && vs >= 2 && vs <= 18) return [2, vs - 1];
    if (ch === 14 && vs === 1) return [13, 23];
    if (ch === 14 && vs >= 2 && vs <= 15) return [14, vs - 1];
  }
  if (bookId === 16) {
    if (ch === 4 && vs >= 1 && vs <= 6) return [3, vs + 32];
    if (ch === 4 && vs >= 7 && vs <= 23) return [4, vs - 6];
    if (ch === 7 && vs >= 69 && vs <= 73) return [7, vs - 1];
    if (ch === 9 && vs === 38) return [10, 1];
    if (ch === 10 && vs >= 1 && vs <= 39) return [10, vs + 1];
  }
  if (bookId === 18) {
    if (ch === 41 && vs >= 1 && vs <= 8) return [40, vs + 24];
    if (ch === 41 && vs >= 9 && vs <= 34) return [41, vs - 8];
  }
  if (bookId === 19) {
    const ps2 = new Set([51, 52, 54, 60]);
    const ps1 = new Set([
      3, 4, 5, 6, 7, 8, 9, 12, 18, 19, 20, 21, 22, 30, 31, 34, 36, 38, 39, 40,
      41, 42, 44, 45, 46, 47, 48, 49, 53, 55, 56, 57, 58, 59, 61, 62, 63, 64,
      65, 67, 68, 69, 70, 75, 76, 77, 80, 81, 83, 84, 85, 88, 89, 92, 102, 108, 140, 142
    ]);
    if (ps2.has(ch)) return [ch, vs + 2];
    if (ps1.has(ch)) return [ch, vs + 1];
  }
  if (bookId === 21) {
    if (ch === 5 && vs === 1) return [4, 17];
    if (ch === 5 && vs >= 2 && vs <= 20) return [5, vs - 1];
  }
  if (bookId === 22) {
    if (ch === 6 && vs === 13) return [7, 1];
    if (ch === 7 && vs >= 1 && vs <= 13) return [7, vs + 1];
  }
  if (bookId === 23) {
    if (ch === 9 && vs === 1) return [8, 23];
    if (ch === 9 && vs >= 2 && vs <= 21) return [9, vs - 1];
    if (ch === 64 && vs === 1) return [63, 19];
    if (ch === 64 && vs >= 2 && vs <= 12) return [64, vs - 1];
  }
  if (bookId === 24) {
    if (ch === 9 && vs === 1) return [8, 23];
    if (ch === 9 && vs >= 2 && vs <= 26) return [9, vs - 1];
  }
  if (bookId === 26) {
    if (ch === 20 && vs >= 45 && vs <= 49) return [21, vs - 44];
    if (ch === 21 && vs >= 1 && vs <= 32) return [21, vs + 5];
  }
  if (bookId === 27) {
    if (ch === 4 && vs >= 1 && vs <= 3) return [3, vs + 30];
    if (ch === 4 && vs >= 4 && vs <= 37) return [4, vs - 3];
    if (ch === 5 && vs === 31) return [6, 1];
    if (ch === 6 && vs >= 1 && vs <= 28) return [6, vs + 1];
  }
  if (bookId === 28) {
    if (ch === 1 && vs >= 10 && vs <= 11) return [2, vs - 9];
    if (ch === 2 && vs >= 1 && vs <= 23) return [2, vs + 2];
    if (ch === 11 && vs === 12) return [12, 1];
    if (ch === 12 && vs >= 1 && vs <= 14) return [12, vs + 1];
    if (ch === 13 && vs === 16) return [14, 1];
    if (ch === 14 && vs >= 1 && vs <= 9) return [14, vs + 1];
  }
  if (bookId === 29) {
    if (ch === 2 && vs >= 28 && vs <= 32) return [3, vs - 27];
    if (ch === 3 && vs >= 1 && vs <= 21) return [4, vs];
  }
  if (bookId === 32) {
    if (ch === 1 && vs === 17) return [2, 1];
    if (ch === 2 && vs >= 1 && vs <= 10) return [2, vs + 1];
  }
  if (bookId === 33) {
    if (ch === 5 && vs === 1) return [4, 14];
    if (ch === 5 && vs >= 2 && vs <= 15) return [5, vs - 1];
  }
  if (bookId === 34) {
    if (ch === 1 && vs === 15) return [2, 1];
    if (ch === 2 && vs >= 1 && vs <= 13) return [2, vs + 1];
  }
  if (bookId === 38) {
    if (ch === 1 && vs >= 18 && vs <= 21) return [2, vs - 17];
    if (ch === 2 && vs >= 1 && vs <= 13) return [2, vs + 4];
  }
  if (bookId === 39) {
    if (ch === 4 && vs >= 1 && vs <= 6) return [3, vs + 18];
  }
  return [ch, vs];
}

function isBiblicalAramaicVerse(bookId, ch, vs) {
  if (bookId === 15) {
    if (ch === 4 && vs >= 8 && vs <= 24) return true;
    if (ch === 5 && vs >= 1 && vs <= 17) return true;
    if (ch === 6 && vs >= 1 && vs <= 18) return true;
    if (ch === 7 && vs >= 12 && vs <= 26) return true;
  }
  if (bookId === 24 && ch === 10 && vs === 11) return true;
  if (bookId === 27) {
    if (ch === 2 && vs >= 4 && vs <= 49) return true;
    if (ch >= 3 && ch <= 7) return true;
  }
  return false;
}

function canonHebSurface(s) {
  if (!s) return '';
  const cleaned = s.normalize('NFC').replace(/[\u0591-\u05AF\u05BD\u05BE׃\s/]/g, '');
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

function stripHebrewDiacritics(s) {
  if (!s) return '';
  return s.normalize('NFD').replace(/[\u0591-\u05C7\s\u05BE׃\/]/g, '');
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

// Preload all 39 OSHB books, 27 SBLGNT books, and 27 Scrivener TR books into memory for fast O(1) lookup
function loadAllSources() {
  const oshbDir = path.join(__dirname, 'data/oshb');
  const oshbByBook = {};
  for (let b = 1; b <= 39; b++) {
    const bk = OT_BOOK_MAP[b];
    const xml = fs.readFileSync(path.join(oshbDir, `${bk}.xml`), 'utf8');
    const vMap = new Map();
    const re = /<verse\s+osisID="([^"]+)"[^>]*>([\s\S]*?)<\/verse>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const osis = m[1];
      const words = [];
      const wMap = new Map();
      const wRe = /<w\s+([^>]+)>([\s\S]*?)<\/w>/g;
      let wm, idx = 1;
      while ((wm = wRe.exec(m[2])) !== null) {
        const attrs = wm[1];
        const rawText = wm[2].replace(/<[^>]+>/g, '').trim();
        const tokObj = {
          index: idx++,
          id: (attrs.match(/id="([^"]+)"/) || [])[1] || null,
          lemma: (attrs.match(/lemma="([^"]+)"/) || [])[1] || null,
          morph: (attrs.match(/morph="([^"]+)"/) || [])[1] || null,
          text: rawText.replace(/\//g, ''),
          rawParts: rawText.split('/')
        };
        words.push(tokObj);
        wMap.set(tokObj.index, tokObj);
      }
      words.byIndex = wMap;
      vMap.set(osis, words);
    }
    oshbByBook[b] = vMap;
  }

  const sblgntDir = path.join(__dirname, 'data/sblgnt');
  const sblByBook = {};
  for (let b = 40; b <= 66; b++) {
    const fn = SBLGNT_BOOK_MAP[b];
    const txt = fs.readFileSync(path.join(sblgntDir, fn), 'utf8');
    const vMap = new Map();
    for (const line of txt.split('\n')) {
      if (!line.trim()) continue;
      const parts = line.trim().split(/\s+/);
      if (parts.length < 7) continue;
      const tag = parts[0];
      const ch = parseInt(tag.substring(2, 4), 10);
      const vs = parseInt(tag.substring(4, 6), 10);
      const cv = `${ch}:${vs}`;
      if (!vMap.has(cv)) {
        const arr = [];
        arr.byIndex = new Map();
        vMap.set(cv, arr);
      }
      const arr = vMap.get(cv);
      const tokObj = {
        index: arr.length + 1,
        morph: `${parts[1]} ${parts[2]}`,
        surfacePunct: parts[3],
        surfaceClean: parts[4],
        surfaceNorm: parts[5],
        lemma: parts[6]
      };
      arr.push(tokObj);
      arr.byIndex.set(tokObj.index, tokObj);
    }
    sblByBook[b] = vMap;
  }

  const trFullPath = path.join(__dirname, 'data/gnt_scrivener.json');
  const trRaw = JSON.parse(fs.readFileSync(trFullPath, 'utf8'));
  const trByOsis = new Map();
  for (const row of trRaw) {
    const key = `${row.book_name_osis}:${row.chapter}:${row.verse}`;
    const arr = row.words.map((w, i) => ({
      index: i + 1,
      surface: w.greek,
      grammar: w.grammar,
      strongsId: w.strong ? `G${w.strong}` : null,
      lemma: w.dictionary_form || ''
    }));
    arr.byIndex = new Map(arr.map(t => [t.index, t]));
    trByOsis.set(key, arr);
  }

  return { oshbByBook, sblByBook, trByOsis };
}

// Strong's lexicon maps
const strongsGreekMap = new Map();
for (const line of query("SELECT strongs_id || '|' || COALESCE(original_word,'') FROM strongs_entries WHERE strongs_id LIKE 'G%';").split('\n')) {
  if (!line) continue;
  const [id, orig] = line.split('|');
  strongsGreekMap.set(id, orig);
}
const strongsHebrewMap = new Map();
for (const line of query("SELECT strongs_id || '|' || COALESCE(original_word,'') FROM strongs_entries WHERE strongs_id LIKE 'H%';").split('\n')) {
  if (!line) continue;
  const [id, orig] = line.split('|');
  strongsHebrewMap.set(id, orig);
}

const AUTHORIZED_HEBREW_LEMMA_VARIANTS = {
  'H3635': ['שַׁכְלֵל', 'שכלל', 'כְּלַל', 'כלל'],
  'H6600': ['פִּתְגָם', 'פִּתְגָּם', 'פתגם'],
  'H8065': ['שְׁמַיִן', 'שָׁמַיִן', 'שמין'],
  'H7451': ['רַע', 'רָעַע', 'רעע', 'רع'],
};

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
  const pairs = [
    ['εγω', 'μου'], ['εγω', 'με'], ['εγω', 'εμοι'], ['εγω', 'ημας'], ['εγω', 'ημων'], ['εγω', 'ημιν'], ['εγω', 'ημεις'],
    ['συ', 'σου'], ['συ', 'σε'], ['συ', 'υμας'], ['συ', 'υμων'], ['συ', 'υμιν'], ['συ', 'υμεις'],
    ['αυτος', 'αυτου'], ['ουτος', 'αυτη'], ['ος', 'ου'], ['τις', 'τι'],
    ['συνισταω', 'συνιστημι'], ['συνιστανω', 'συνιστημι']
  ];
  return pairs.some(([a, b]) => (eFold === a && tFold === b) || (eFold === b && tFold === a));
}

/**
 * Deterministic morphology converter:
 * Given lang ('hebrew' | 'aramaic' | 'greek'), sourceMorph, and isTr,
 * derives the exact canonical 9 columns:
 *   morph_pos, morph_stem, morph_tense, morph_voice, morph_mood, morph_person, morph_number, morph_gender, morph_case
 */
function deriveCanonicalMorphFields(lang, rawMorph, isTr = false, currentMorphPos = null) {
  if (lang === 'greek') {
    if (isTr) {
      const spec = parseRobinsonGrammar(rawMorph);
      if (!spec) return null;
      const pos = (currentMorphPos && spec.allowedPos.includes(currentMorphPos))
        ? currentMorphPos
        : (spec.allowedPos[0] || null);
      return {
        morphPos: pos,
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
    const m = (rawMorph || '').trim();
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
    const posMap = {
      'V-': ['verb'],
      'N-': ['noun'],
      'A-': ['adjective'],
      'C-': ['conjunction'],
      'D-': ['adverb'],
      'P-': ['preposition'],
      'X-': ['particle'],
      'I-': ['interjection'],
      'RA': ['article', 'pronoun'],
      'RD': ['demonstrative', 'pronoun'],
      'RI': ['interrogative_pronoun', 'pronoun'],
      'RP': ['personal_pronoun', 'pronoun'],
      'RR': ['relative_pronoun', 'pronoun']
    };
    const allowedPos = posMap[posCode] || ['particle'];
    const pos = (currentMorphPos && allowedPos.includes(currentMorphPos)) ? currentMorphPos : allowedPos[0];
    return {
      morphPos: pos,
      morphStem: null,
      morphTense: tMap[tCh] || null,
      morphVoice: vMap[vCh] || null,
      morphMood: mMap[mCh] || null,
      morphPerson: pMap[pCh] || null,
      morphNumber: nMap[nCh] || null,
      morphGender: gMap[gCh] || null,
      morphCase: cMap[cCh] || null
    };
  }

  // Hebrew / Aramaic OSHB WLC
  const tag = (rawMorph || '').trim();
  if (!tag) return null;
  const segs = tag.split('/');
  const isAr = tag.startsWith('A') || lang === 'aramaic';
  const gMap = { m:'masculine', f:'feminine', b:'common', c:'common' };
  const nMap = { s:'singular', p:'plural', d:'dual' };
  const pMap = { '1':'1', '2':'2', '3':'3' };
  const sMap = { c:'construct', a:'absolute', d:'determined' };

  // Preposition with pronominal suffix: e.g. HR/Sp2ms, AR/Sp3mp, HC/R/Sp1cs
  if (segs.length >= 2 && /^(HR|AR|R)$/.test(segs[segs.length - 2]) && /^Sp/.test(segs[segs.length - 1]) && (segs.length === 2 || /^(HC|AC|C)$/.test(segs[0]))) {
    const spTag = segs[segs.length - 1];
    return {
      morphPos: 'preposition',
      morphStem: null,
      morphTense: null,
      morphVoice: null,
      morphMood: null,
      morphPerson: pMap[spTag[2]] || null,
      morphGender: gMap[spTag[3]] || null,
      morphNumber: nMap[spTag[4]] || null,
      morphCase: null
    };
  }

  // Choose core lexical segment (skipping trailing Sp / Sd / Td or leading prefixes)
  let coreSeg = segs[segs.length - 1];
  for (let i = segs.length - 1; i >= 0; i--) {
    if (!/^(Sp|Sd|Td|Sh|Sn)/.test(segs[i])) {
      coreSeg = segs[i];
      break;
    }
  }
  const core = coreSeg.replace(/^[HA](?=[A-Z])/, '');

  if (core[0] === 'V') {
    const stemMap = isAr
      ? { q:'peal', Q:'peil', p:'pael', P:'pael_passive', a:'aphel', A:'haphel_passive', h:'haphel', u:'hithpeel', t:'hithpaal', o:'polel', O:'polal', e:'shaphel', i:'ithpaal' }
      : { q:'qal', Q:'qal_passive', N:'niphal', p:'piel', P:'pual', h:'hiphil', H:'hophal', t:'hithpael', o:'polel', O:'polal', c:'pilpel', C:'polpal' };
    const conj = core[2];
    const isPassive = ((isAr ? 'QPAui' : 'NQPH').includes(core[1]) || conj === 's');
    const tenseMap = { p:'qatal', q:'weqatal', i:'yiqtol', w:'wayyiqtol', j:'yiqtol', h:'yiqtol' };
    const moodMap = { p:'indicative', q:'indicative', i:'indicative', w:'indicative', v:'imperative', j:'jussive', h:'cohortative', r:'participle', s:'passive_participle', c:'infinitive_construct', a:'infinitive_absolute' };
    let person = null, gender = null, number = null, state = null;
    if ('pqiwjhv'.includes(conj)) {
      person = ['1','2','3'].includes(core[3]) ? core[3] : null;
      gender = gMap[core[4]] || null;
      number = nMap[core[5]] || null;
    } else if (conj === 'r' || conj === 's') {
      gender = gMap[core[3]] || null;
      number = nMap[core[4]] || null;
      state = sMap[core[5]] || null;
    }
    return {
      morphPos: 'verb',
      morphStem: stemMap[core[1]] || null,
      morphTense: tenseMap[conj] || null,
      morphVoice: isPassive ? 'passive' : 'active',
      morphMood: moodMap[conj] || null,
      morphPerson: person,
      morphGender: gender,
      morphNumber: number,
      morphCase: state
    };
  }

  if (core[0] === 'N') {
    if (core[1] === 'p') {
      return {
        morphPos: currentMorphPos === 'noun' ? 'noun' : 'proper_noun',
        morphStem: null, morphTense: null, morphVoice: null, morphMood: null,
        morphPerson: null, morphGender: null, morphNumber: null, morphCase: null
      };
    }
    return {
      morphPos: 'noun',
      morphStem: null, morphTense: null, morphVoice: null, morphMood: null,
      morphPerson: null,
      morphGender: gMap[core[2]] || null,
      morphNumber: nMap[core[3]] || null,
      morphCase: sMap[core[4]] || null
    };
  }

  if (core[0] === 'A') {
    return {
      morphPos: 'adjective',
      morphStem: null, morphTense: null, morphVoice: null, morphMood: null,
      morphPerson: null,
      morphGender: gMap[core[2]] || null,
      morphNumber: nMap[core[3]] || null,
      morphCase: sMap[core[4]] || null
    };
  }

  if (core[0] === 'P') {
    // Pronoun: Pp1cs, Pdxms, Pf
    let person = null, gender = null, number = null;
    if (core[1] === 'p') {
      person = ['1','2','3'].includes(core[2]) ? core[2] : null;
      gender = gMap[core[3]] || null;
      number = nMap[core[4]] || null;
    } else if (core[1] === 'd') {
      gender = gMap[core[3]] || null;
      number = nMap[core[4]] || null;
    }
    return {
      morphPos: 'pronoun',
      morphStem: null, morphTense: null, morphVoice: null, morphMood: null,
      morphPerson: person, morphGender: gender, morphNumber: number, morphCase: null
    };
  }

  if (core[0] === 'R') {
    return {
      morphPos: 'preposition',
      morphStem: null, morphTense: null, morphVoice: null, morphMood: null,
      morphPerson: null, morphGender: null, morphNumber: null, morphCase: null
    };
  }
  if (core[0] === 'C') {
    return {
      morphPos: 'conjunction',
      morphStem: null, morphTense: null, morphVoice: null, morphMood: null,
      morphPerson: null, morphGender: null, morphNumber: null, morphCase: null
    };
  }
  if (core[0] === 'D') {
    return {
      morphPos: 'adverb',
      morphStem: null, morphTense: null, morphVoice: null, morphMood: null,
      morphPerson: null, morphGender: null, morphNumber: null, morphCase: null
    };
  }
  if (core[0] === 'T') {
    let pos = 'particle';
    if (core[1] === 'r') pos = (currentMorphPos === 'particle' ? 'particle' : 'relative_pronoun');
    else if (core[1] === 'd') pos = (currentMorphPos === 'particle' ? 'particle' : 'article');
    return {
      morphPos: pos,
      morphStem: null, morphTense: null, morphVoice: null, morphMood: null,
      morphPerson: null, morphGender: null, morphNumber: null, morphCase: null
    };
  }

  return null;
}

module.exports = {
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
};
