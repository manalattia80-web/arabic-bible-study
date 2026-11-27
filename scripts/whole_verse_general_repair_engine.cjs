/**
 * scripts/whole_verse_general_repair_engine.cjs
 *
 * Whole-Verse General Alignment & Morphology Suggestion/Repair Engine (v1.2)
 *
 * Rules derived STRICTLY from the 65 already-adjudicated verses (B20 + R1 + R2 + R3 = 1,053 records).
 * Zero rules or exceptions tailored to Round 4B or any unseen holdout sample.
 *
 * Architectural Guarantees (v1.2):
 *   1. Complete Denominator (434,351 exact): NEVER drops missing-source verses; classifies every record as
 *      PENDING_EDITION_TR_ONLY_NOT_IN_SBLGNT / PENDING_VERSIFICATION_MISMATCH / PENDING_NO_SOURCE_DATA.
 *   2. Explicit Adjudicated Registry + Structural Protection:
 *        - Protects all verses in the explicit Protected Adjudicated Registry (B20 + R1–R3 + audit-guarded verses)
 *          with cryptographic SHA-256 fingerprint verification.
 *        - Across all 66 books, preserves range locators (wA-wB), non-empty grammar_notes, compound_phrase,
 *          syntactic_ar, verified morphgnt_tr, and existing Sp* pronominal suffix fields.
 *   3. Independent Strong's & Lexicon Verification BEFORE granting AUTO_PROPOSED_HIGH_CONFIDENCE.
 *   4. Atomic Component Reorganization: NEVER deletes distinct primary components (demotes to PENDING_REVIEW if
 *      multiple distinct primaries exist); rewrites single primary at link_order=1 and preserves all secondary components.
 *   5. Whole-Verse Fixed-Point Anti-Collision Guard (including untouched PENDING_REVIEW neighbors!):
 *        - Accounts for ALL old & new claims across the verse (preserved, secondary, peer auto-proposed, AND
 *          untouched PENDING_REVIEW neighbors still sitting on their existing orig_word_position).
 *        - Iterates to a fixed point so ZERO new sourceLocator collisions can ever be introduced!
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const {
  loadAllSources,
  deriveCanonicalMorphFields,
  getBhsChapterVerse,
  greekStrongsMatchesLemma,
  OT_BOOK_MAP,
  TR_BOOK_OSIS_MAP
} = require('./full_66_books_audit_helpers.cjs');
const { loadProtectedAdjudicatedVerses } = require('./protected_adjudicated_registry.cjs');

const repoRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sqlVal = v => (v === null || v === undefined || v === '') ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;

function canonArabicWord(s) {
  if (!s) return '';
  return String(s)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[.,،؛:«»"'\-!?؟()\[\]]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .trim();
}

const AR_VOCATIVE_WORDS = new Set(['يا', 'ايها', 'ايتها', 'ايا', 'ياايها']);
const AR_COPULA_VERBS = new Set([
  'كان', 'كانت', 'كانوا', 'كانتا', 'كنت', 'كنتم', 'كنا', 'يكون', 'تكون', 'يكونوا', 'اكون', 'نكون',
  'وكان', 'وكانت', 'وكانوا', 'فكان', 'فكانت', 'فكانوا', 'فكانتا', 'ويكون', 'وتكون', 'فيكون', 'فتكون',
  'ليكون', 'لتكون', 'يكونون', 'تكونون', 'تكونوا'
]);
const AR_COMPLEMENTIZERS = new Set([
  'ان', 'انك', 'انه', 'انها', 'انهم', 'انكم', 'اننا', 'اني', 'انني', 'انهما',
  'بان', 'لان', 'لانه', 'لانك', 'لانهم', 'لانكم', 'لاننا', 'لاني', 'لانها',
  'فان', 'وان', 'فانه', 'وانه', 'فانك', 'وانك', 'فانهم', 'وانهم', 'فانكم', 'وانكم', 'فاني', 'واني'
]);
const AR_PURE_PREPS = new Set(['في', 'من', 'علي', 'الي', 'عن', 'مع', 'عند', 'بين', 'حتي', 'منذ']);
const AR_PREP_WITH_PRONOUN = new Set([
  'به', 'بها', 'بهم', 'بهن', 'بهما', 'بك', 'بكم', 'بكن', 'بكما', 'بي', 'بنا',
  'له', 'لها', 'لهم', 'لهن', 'لهما', 'لك', 'لكم', 'لكن', 'لكما', 'لي', 'لنا',
  'فيه', 'فيها', 'فيهم', 'فيهن', 'فيهما', 'فيك', 'فيكم', 'فيكن', 'فيكما', 'فيي', 'فينا',
  'منه', 'منها', 'منهم', 'منهن', 'منهما', 'منك', 'منكم', 'منكن', 'منكما', 'مني', 'منا',
  'عليه', 'عليها', 'عليهم', 'عليهن', 'عليهما', 'عليك', 'عليكم', 'عليكن', 'عليكما', 'علي', 'علينا',
  'اليه', 'اليها', 'اليهم', 'اليهن', 'اليهما', 'اليك', 'اليكم', 'اليكن', 'اليكما', 'الي', 'الينا',
  'عنه', 'عنها', 'عنهم', 'عنهن', 'عنهما', 'عنك', 'عنكم', 'عنكن', 'عنكما', 'عني', 'عنا',
  'معه', 'معها', 'معهم', 'معهن', 'معهما', 'معك', 'معكم', 'معكن', 'معكما', 'معي', 'معنا',
  'وبها', 'وبه', 'وبهم', 'وبك', 'وبي', 'وبنا', 'وله', 'ولها', 'ولهم', 'ولك', 'ولي', 'ولنا',
  'فبه', 'فبها', 'فله', 'فلها', 'فلكم', 'فلي', 'فلنا', 'وكله', 'لكي', 'لكيلا', 'لئلا'
]);
const AR_PURE_DEMONSTRATIVES = new Set(['هذا', 'هذه', 'هؤلاء', 'ذلك', 'تلك', 'اولئك']);
const AR_PURE_CONJUNCTIONS = new Set(['او', 'ام', 'بل', 'لكن', 'ثم', 'لكي', 'كي', 'اذ', 'اذا', 'بينما', 'لما']);

/**
 * Verified compound-preposition decomposition guard (v1.5):
 * Prevents reducing a compound Arabic word (preposition prefix + lexical head, e.g. «بِاسْمِ» = ἐν ὀνόματι)
 * to a bare source preposition alone (P- / HR / AR).
 * Requires BOTH:
 *   (a) Arabic morphological decomposition (optional conj و/ف + prep prefix ب/ل/ك + non-pronominal stem), AND
 *   (b) Source-side witness: immediately following source token (w+1, or w+2 skipping Greek article RA)
 *       is a lexical content head NOT claimed by the next Arabic word (arPos + 1).
 * Simple words starting with ب/ل (e.g. بيت، ليل) are NEVER affected because their source token is a noun, not a bare prep.
 */
function checkCompoundPrepMissingLexicalHead(arWord, arPos, chosen, isGreek, tokens, dbRows) {
  const isBarePrep = isGreek
    ? (chosen.morph && chosen.morph.startsWith('P-'))
    : (chosen.morph && /^(H|A)R$/.test(chosen.morph));
  if (!isBarePrep) return null;

  const arClean = canonArabicWord(arWord);
  if (!arClean || AR_PURE_PREPS.has(arClean) || AR_PREP_WITH_PRONOUN.has(arClean)) return null;

  // Strip optional leading conjunction و / ف only if followed by ب / ل / ك
  let core = arClean;
  if ((core.startsWith('وب') || core.startsWith('ول') || core.startsWith('وك') ||
       core.startsWith('فب') || core.startsWith('فل') || core.startsWith('فك')) && core.length >= 5) {
    core = core.slice(1);
  }
  if (!/^[بلك]/.test(core)) return null;
  const stem = core.slice(1);
  // Require verified non-pronominal stem (either definite ال/ل or length >= 3 not a pronoun suffix)
  const PRON_SUFFIXES = new Set(['ه', 'ها', 'هم', 'هن', 'هما', 'ك', 'كم', 'كن', 'كما', 'ي', 'نا', 'همو']);
  if (PRON_SUFFIXES.has(stem)) return null;
  const hasDefinite = stem.startsWith('ال') || (core.startsWith('لل') && stem.length >= 3);
  if (!hasDefinite && stem.length < 3) return null;

  // Source-side witness: look for immediately following lexical content head (skipping Greek article RA)
  const tokByIndex = new Map(tokens.map(t => [t.index, t]));
  let headTok = tokByIndex.get(chosen.index + 1) || null;
  if (isGreek && headTok && headTok.morph && headTok.morph.startsWith('RA')) {
    headTok = tokByIndex.get(chosen.index + 2) || null;
  }
  if (!headTok || !headTok.morph) return null;

  const isLexicalHead = isGreek
    ? /^(N-|A-|V-)/.test(headTok.morph)
    : /^[HA](N|A|V)/.test(headTok.morph);
  if (!isLexicalHead) return null;

  // Check whether the next Arabic word (arPos + 1) already claims this lexical head
  const nextRow = dbRows.find(x => x.arPos === arPos + 1);
  if (nextRow) {
    const nextSurfCanon = isGreek ? canonGreek(nextRow.origSurface || nextRow.origWord) : canonSemiticConsonants(nextRow.origSurface || nextRow.origWord);
    const nextLexCanon = isGreek ? canonGreek(nextRow.origWord) : (nextRow.strongsId || '');
    const nextClaimsHead =
      (nextRow.origPos === headTok.index) ||
      (nextSurfCanon && nextSurfCanon === headTok.surfaceCanon) ||
      (nextLexCanon && nextLexCanon === headTok.lemmaCanon);
    if (nextClaimsHead) return null;
  }

  return `REJECT_COMPOUND_PREP_MISSING_LEXICAL_HEAD(ar=${arClean},prep=w${chosen.index},unclaimedHead=w${headTok.index}:${headTok.lemma})`;
}

const G4_PRONOUN_POS = new Set(['pronoun', 'personal_pronoun', 'demonstrative', 'relative_pronoun', 'interrogative_pronoun']);
const GREEK_BARE_COORD_CONJ_STRONGS = new Set(['G2532', 'G1161', 'G5037']);
const AR_PURE_COORD_CONJ_WORDS = new Set([
  'و', 'ف', 'ايضا', 'وايضا', 'فايضا', 'اما', 'واما', 'فاما',
  'لكن', 'ولكن', 'فلكن', 'ثم', 'وثم', 'فثم', 'بل', 'وبل',
  'وقد', 'فقد', 'وكذلك', 'فكذلك', 'ولا', 'فلا', 'ولم', 'فلم', 'ولن', 'فلن',
  'واذ', 'فاذ', 'واذا', 'فاذا', 'وان', 'فان', 'ولما', 'فلما', 'وحتي', 'فحتي'
].map(canonArabicWord));

/**
 * General Greek conjunction guard (v1.8.4):
 *  1. Rejects compound Arabic words (e.g. «وَأَنْفَقَتْ», «وَأَرْسَلْتُ», «فَقَالَ», «فَهِيَ»)
 *     or non-conjunction words on bare Greek coordinating conjunctions (καί/δέ/τέ) as
 *     REJECT_COMPOUND_CONJ_MISSING_LEXICAL_HEAD.
 *  2. Defers all remaining Greek C- conjunction proposals across ALL repair rules (G1/G2/G2B/G3/G1C/G4)
 *     so this batch remains focused on content words and prevents clause-crossing conjunction links
 *     (e.g. Gal 2:10 #9 «أَنْ» -> ἵνα@w4 from clause 1).
 */
function checkCompoundConjMissingLexicalHead(arWord, isGreek, targetStrongs, chosen) {
  if (!isGreek || !chosen || !chosen.morph || !chosen.morph.startsWith('C-')) return null;
  const arClean = canonArabicWord(arWord);
  if (targetStrongs && GREEK_BARE_COORD_CONJ_STRONGS.has(targetStrongs) && arClean && !AR_PURE_COORD_CONJ_WORDS.has(arClean)) {
    return `REJECT_COMPOUND_CONJ_MISSING_LEXICAL_HEAD(ar=${arClean},conj=${targetStrongs}:w${chosen.index}:${chosen.lemma})`;
  }
  return `REJECT_GREEK_CONJ_DEFERRED_FOR_CONTEXTUAL_REVIEW(w${chosen.index}:${chosen.lemma})`;
}

function checkG4PosEligibility(isGreek, chosen, finalMorphPos) {
  if (isGreek && chosen.morph && chosen.morph.startsWith('P-')) {
    return `REJECT_G4_GREEK_PREP_EXCLUDED(w${chosen.index}:${chosen.lemma})`;
  }
  if (isGreek && chosen.morph && chosen.morph.startsWith('C-')) {
    return `REJECT_G4_GREEK_CONJ_EXCLUDED(w${chosen.index}:${chosen.lemma})`;
  }
  if ((isGreek && chosen.morph && chosen.morph.startsWith('RA')) || finalMorphPos === 'article') {
    return `REJECT_G4_ARTICLE_EXCLUDED(w${chosen.index}:${chosen.lemma})`;
  }
  const isGreekPron = isGreek && chosen.morph && /^(RP|RD|RR|RI)/.test(chosen.morph);
  const isSemiticPron = !isGreek && chosen.morph && /^[HA]P/.test(chosen.morph);
  if (isGreekPron || isSemiticPron || G4_PRONOUN_POS.has(finalMorphPos)) {
    return `REJECT_G4_PRONOUN_EXCLUDED(w${chosen.index}:${chosen.lemma},pos=${finalMorphPos})`;
  }
  return null;
}

const GREEK_COPULA_STRONGS = new Set(['G1510', 'G1096', 'G5225', 'G3918', 'G4295']);
const AR_SUBJ_PRONOUN_AGREEMENT = {
  'انا': { person: '1', number: 'singular' }, 'وانا': { person: '1', number: 'singular' }, 'فانا': { person: '1', number: 'singular' },
  'نحن': { person: '1', number: 'plural' }, 'ونحن': { person: '1', number: 'plural' }, 'فنحن': { person: '1', number: 'plural' },
  'انت': { person: '2', number: 'singular' }, 'وانت': { person: '2', number: 'singular' }, 'فانت': { person: '2', number: 'singular' },
  'انتم': { person: '2', number: 'plural' }, 'وانتم': { person: '2', number: 'plural' }, 'فانتم': { person: '2', number: 'plural' },
  'هو': { person: '3', number: 'singular' }, 'وهو': { person: '3', number: 'singular' }, 'فهو': { person: '3', number: 'singular' },
  'هي': { person: '3', number: 'singular' }, 'وهي': { person: '3', number: 'singular' }, 'فهي': { person: '3', number: 'singular' },
  'هم': { person: '3', number: 'plural' }, 'وهم': { person: '3', number: 'plural' }, 'فهم': { person: '3', number: 'plural' }
};
const AR_STANDALONE_PREPS = new Set([
  'عن', 'من', 'في', 'الى', 'على', 'مع', 'بين', 'عند', 'قدام', 'امام',
  'تحت', 'فوق', 'نحو', 'دون', 'وراء', 'خلف', 'حول', 'بغير', 'لاجل',
  'وعن', 'ومن', 'وفي', 'والى', 'وعلى', 'ومع', 'فعن', 'فمن', 'ففي', 'فالى', 'فعلى'
].map(canonArabicWord));

function hasPrecedingGreekPrep(tokens, tokIndex) {
  for (let p = tokIndex - 1; p >= Math.max(1, tokIndex - 3); p--) {
    const tok = tokens.find(x => x.index === p);
    if (!tok) break;
    if (tok.morph && tok.morph.startsWith('P-')) return true;
    if (tok.morph && (tok.morph.startsWith('RA') || tok.morph.startsWith('C-') || tok.morph.startsWith('A-'))) continue;
    break;
  }
  return false;
}

/**
 * General Arabic-to-Source contextual compatibility guard (zero verse-specific exceptions).
 * Rejects structurally incompatible Arabic-to-Source pairings even when source fields are internally consistent.
 */
function checkArabicSourceContextualCompatibility(arWord, proposedMorphPos, ruleId, beforeMorphPos, isGreek = false, targetStrongs = null, targetDerived = null) {
  const arClean = canonArabicWord(arWord);
  if (!arClean) return null;

  if (AR_VOCATIVE_WORDS.has(arClean) && proposedMorphPos !== 'interjection') {
    return `REJECT_ARABIC_VOCATIVE_SOURCE_MISMATCH(ar=${arClean},pos=${proposedMorphPos})`;
  }
  if (AR_COPULA_VERBS.has(arClean) && proposedMorphPos !== 'verb') {
    return `REJECT_ARABIC_COPULA_NON_VERB_SOURCE(ar=${arClean},pos=${proposedMorphPos})`;
  }
  if (isGreek && AR_COPULA_VERBS.has(arClean) && targetStrongs && !GREEK_COPULA_STRONGS.has(targetStrongs)) {
    return `REJECT_ARABIC_COPULA_NON_COPULA_GREEK_VERB(ar=${arClean},strongs=${targetStrongs})`;
  }
  if (isGreek && proposedMorphPos === 'verb' && AR_SUBJ_PRONOUN_AGREEMENT[arClean] && targetDerived) {
    const exp = AR_SUBJ_PRONOUN_AGREEMENT[arClean];
    if ((targetDerived.morphPerson && targetDerived.morphPerson !== exp.person) ||
        (targetDerived.morphNumber && targetDerived.morphNumber !== exp.number)) {
      return `REJECT_ARABIC_PRONOUN_VERB_PERSON_NUMBER_MISMATCH(ar=${arClean},got=${targetDerived.morphPerson || '-'}/${targetDerived.morphNumber || '-'})`;
    }
  }
  if (AR_COMPLEMENTIZERS.has(arClean) && ['demonstrative', 'noun', 'proper_noun', 'adjective', 'article'].includes(proposedMorphPos)) {
    return `REJECT_ARABIC_COMPLEMENTIZER_SOURCE_MISMATCH(ar=${arClean},pos=${proposedMorphPos})`;
  }
  if (AR_PURE_PREPS.has(arClean) && ['verb', 'proper_noun', 'demonstrative', 'article'].includes(proposedMorphPos)) {
    return `REJECT_ARABIC_PREP_SOURCE_MISMATCH(ar=${arClean},pos=${proposedMorphPos})`;
  }
  if (AR_PURE_DEMONSTRATIVES.has(arClean) && ['verb', 'preposition'].includes(proposedMorphPos)) {
    return `REJECT_ARABIC_DEM_SOURCE_MISMATCH(ar=${arClean},pos=${proposedMorphPos})`;
  }
  if (AR_PURE_CONJUNCTIONS.has(arClean) && ['proper_noun', 'noun', 'demonstrative', 'article'].includes(proposedMorphPos)) {
    return `REJECT_ARABIC_CONJ_SOURCE_MISMATCH(ar=${arClean},pos=${proposedMorphPos})`;
  }
  if (ruleId === 'RULE_G2_UNIQUE_INFLECTED_SURFACE_LOCK' && beforeMorphPos && proposedMorphPos) {
    const isVerbBefore = beforeMorphPos === 'verb';
    const isVerbAfter = proposedMorphPos === 'verb';
    if (isVerbBefore !== isVerbAfter && ['pronoun', 'personal_pronoun', 'demonstrative', 'preposition'].includes(proposedMorphPos)) {
      return `REJECT_G2_CROSS_POS_FAMILY_SWITCH(before=${beforeMorphPos},after=${proposedMorphPos})`;
    }
  }
  return null;
}

function canonGreek(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,·;:'"«»\[\]()—\-]/g, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .trim();
}

/**
 * Engine v1.7.2: Strictly documented pure-orthographic Greek surface equivalence
 * (zero 3-char prefix heuristics; movable-ν strictly limited to -ε/-ι stems per Greek phonology,
 * NEVER -ω/-ων such as ἔργῳ/ἔργων or νουθετῶ/νουθετῶν).
 */
function isGreekPureOrthographicVariant(aCanon, bCanon, strongsId) {
  if (!aCanon || !bCanon) return false;
  if (aCanon === bCanon) return true;
  // 1. Movable-nu (ν ἐφελκυστικόν) ONLY after -ε or -ι (e.g. συνευδοκοῦσι <-> συνευδοκοῦσιν, ἔτεκε <-> ἔτεκεν)
  if ((aCanon.endsWith('ε') || aCanon.endsWith('ι')) && `${aCanon}ν` === bCanon) return true;
  if ((bCanon.endsWith('ε') || bCanon.endsWith('ι')) && `${bCanon}ν` === aCanon) return true;
  // 2. Movable-sigma (-ς -> -σ) ONLY on documented movable-sigma adverbs/prepositions
  if (['G3779', 'G3360', 'G891'].includes(strongsId) && (`${aCanon}σ` === bCanon || `${bCanon}σ` === aCanon)) return true;
  // 3. Byzantine/Alexandrian β <-> υ transliteration ONLY on Δαβίδ <-> Δαυίδ (G1138)
  if (strongsId === 'G1138' && aCanon.replace(/β/g, 'υ') === bCanon.replace(/β/g, 'υ')) return true;
  return false;
}

/**
 * Engine v1.7.2: Verifies that a Scrivener TR Robinson morphology code (e.g. V-PAI-3P, N-GPM)
 * is morphologically compatible with an SBLGNT MorphGNT code (e.g. V- 3PAI-P--, N- ----DSN-).
 * Prevents accepting any morphological/textual divergence (case, number, person, tense, or mood).
 */
function trGrammarMatchesSblMorph(trGrammar, sblMorph) {
  if (!trGrammar || !sblMorph) return false;
  const tr = String(trGrammar).trim().toUpperCase();
  const sblParts = String(sblMorph).trim().split(/\s+/);
  if (sblParts.length < 2 || sblParts[1].length < 8) return false;
  const sblPos = sblParts[0];
  const code = sblParts[1]; // [person, tense, voice, mood, case, number, gender, degree]

  if (sblPos === 'D-') {
    return tr === 'ADV' || tr.startsWith('ADV-') || tr.startsWith('D-');
  }
  if (sblPos === 'N-' || sblPos === 'A-') {
    if (!tr.startsWith(sblPos)) return false;
    const segs = tr.split('-');
    const cng = segs[1] || '';
    if (cng === 'PRI' || cng === 'LI' || cng === 'OI') return true; // indeclinable proper/letter/other noun
    if (cng.length < 2) return false;
    const trCase = cng[0];
    const trNum = cng[1];
    return trCase === code[4] && trNum === code[5];
  }
  if (sblPos === 'V-') {
    if (!tr.startsWith('V-')) return false;
    const segs = tr.split('-');
    if (segs.length < 2) return false;
    const tvm = segs[1].replace(/^2/, ''); // strip '2' from 2nd aorist/future/perfect (e.g. 2AAI -> AAI)
    if (tvm.length < 3) return false;
    const trTenseRaw = tvm[0];
    const trMood = tvm[2];
    const trTenseMap = { P: 'P', I: 'I', F: 'F', A: 'A', R: 'X', L: 'Y' };
    const trTense = trTenseMap[trTenseRaw] || trTenseRaw;
    const sblPerson = code[0], sblTense = code[1], sblMood = code[3], sblCase = code[4], sblNum = code[5];
    if (trMood !== sblMood || trTense !== sblTense) return false;
    if (trMood === 'N') return true; // infinitive
    const pnOrCng = segs[2] || '';
    if (trMood === 'P') {
      if (pnOrCng.length < 2) return false;
      return pnOrCng[0] === sblCase && pnOrCng[1] === sblNum;
    }
    // Finite verb (I/S/O/M): require exact person + number
    if (pnOrCng.length < 2) return false;
    return pnOrCng[0] === sblPerson && pnOrCng[1] === sblNum;
  }
  return false;
}

/**
 * Engine v1.6: Greek Strong's <-> MorphGNT/SBLGNT Citation-Form Equivalence.
 * Resolves systematic dictionary headword differences between Strong's 1890
 * (`strongs_entries.original_word`) and MorphGNT/BDAG (`chosen.lemma`)
 * strictly with POS guards and zero cross-POS conflation (e.g., G3666 verb != ὅμοιος adj).
 */
const VERIFIED_GREEK_STRONGS_LEMMA_EQUIV = {
  // Suppletive / irregular Greek verbs (strictly V-)
  G1492: { lemmas: ['οιδα', 'οραω'], morphPrefixes: ['V-'] },      // εἴδω -> οἶδα / ὁράω
  G1163: { lemmas: ['δεω'], morphPrefixes: ['V-'] },               // δεῖ -> δέω
  G2036: { lemmas: ['λεγω'], morphPrefixes: ['V-'] },              // ἔπω -> λέγω
  G5315: { lemmas: ['εσθιω'], morphPrefixes: ['V-'] },             // φάγω -> ἐσθίω
  G1127: { lemmas: ['γρηγορεω'], morphPrefixes: ['V-'] },          // γρηγορεύω -> γρηγορέω
  // Verified strongs_entries data bug (Latin transliteration in original_word, strictly N-)
  G2920: { lemmas: ['κρισισ'], morphPrefixes: ['N-'] },            // krisis -> κρίσις
  // Standard orthographic / adverbial / neuter-to-masculine citation variants (ALL with explicit POS)
  G1752: { lemmas: ['ενεκεν', 'ενεκα', 'εινεκεν'], morphPrefixes: ['P-'] }, // ἕνεκα <-> ἕνεκεν
  G3440: { lemmas: ['μονοσ'], morphPrefixes: ['A-', 'D-'] },       // μόνον -> μόνος
  G4412: { lemmas: ['πρωτοσ'], morphPrefixes: ['A-', 'D-'] },      // πρῶτον -> πρῶτος
  G3062: { lemmas: ['λοιποσ'], morphPrefixes: ['A-'] },            // λοιποί -> λοιπός
  G5305: { lemmas: ['υστεροσ'], morphPrefixes: ['A-', 'D-'] },     // ὕστερον -> ὕστερος
  G5035: { lemmas: ['ταχυσ'], morphPrefixes: ['A-', 'D-'] },       // ταχύ -> ταχύς
  G2411: { lemmas: ['ιεροσ'], morphPrefixes: ['A-', 'N-'] },       // ἱερόν -> ἱερός
  G1199: { lemmas: ['δεσμοσ'], morphPrefixes: ['N-'] },            // δεσμόν -> δεσμός
  G3112: { lemmas: ['μακροσ'], morphPrefixes: ['A-', 'D-'] },      // μακράν -> μακρός
  G4119: { lemmas: ['πολυσ'], morphPrefixes: ['A-'] },             // πλείων -> πολύς
  G4053: { lemmas: ['περισσοτεροσ'], morphPrefixes: ['A-', 'D-'] },// περισσός -> περισσότερος
  // Oblique/plural personal pronoun Strong's IDs: STRICTLY gated by person (lemma), case+number (morphRegex), AND surface!
  G2249: { lemmas: ['εγω'], morphRegex: /^RP\s+----NP--$/, surfaces: ['ημεισ'] },
  G2257: { lemmas: ['εγω'], morphRegex: /^RP\s+----GP--$/, surfaces: ['ημων'] },
  G2254: { lemmas: ['εγω'], morphRegex: /^RP\s+----DP--$/, surfaces: ['ημιν'] },
  G2248: { lemmas: ['εγω'], morphRegex: /^RP\s+----AP--$/, surfaces: ['ημασ'] },
  G3450: { lemmas: ['εγω'], morphRegex: /^RP\s+----GS--$/, surfaces: ['μου', 'εμου'] },
  G1700: { lemmas: ['εγω'], morphRegex: /^RP\s+----GS--$/, surfaces: ['εμου', 'μου'] },
  G3427: { lemmas: ['εγω'], morphRegex: /^RP\s+----DS--$/, surfaces: ['μοι', 'εμοι'] },
  G1698: { lemmas: ['εγω'], morphRegex: /^RP\s+----DS--$/, surfaces: ['εμοι', 'μοι'] },
  G3165: { lemmas: ['εγω'], morphRegex: /^RP\s+----AS--$/, surfaces: ['με', 'εμε'] },
  G1691: { lemmas: ['εγω'], morphRegex: /^RP\s+----AS--$/, surfaces: ['εμε', 'με'] },
  G5210: { lemmas: ['συ'],  morphRegex: /^RP\s+----NP--$/, surfaces: ['υμεισ'] },
  G5216: { lemmas: ['συ'],  morphRegex: /^RP\s+----GP--$/, surfaces: ['υμων'] },
  G5213: { lemmas: ['συ'],  morphRegex: /^RP\s+----DP--$/, surfaces: ['υμιν'] },
  G5209: { lemmas: ['συ'],  morphRegex: /^RP\s+----AP--$/, surfaces: ['υμασ'] },
  G4675: { lemmas: ['συ'],  morphRegex: /^RP\s+----GS--$/, surfaces: ['σου'] },
  G4671: { lemmas: ['συ'],  morphRegex: /^RP\s+----DS--$/, surfaces: ['σοι'] },
  G4571: { lemmas: ['συ'],  morphRegex: /^RP\s+----AS--$/, surfaces: ['σε'] }
};

function isGreekStrongsLemmaEquivalent(strongsId, lexWord, morphGntLemma, morphCode, surfaceWord = null) {
  if (!lexWord || !morphGntLemma) return false;
  const lexCanon = canonGreek(lexWord);
  const tokCanon = canonGreek(morphGntLemma);
  if (!lexCanon || !tokCanon) return false;

  // 1. Exact canonical match (v1.5 baseline)
  if (lexCanon === tokCanon) return true;

  // 2. MorphGNT optional-letter notation: e.g. οὕτω(ς) -> matches οὕτω or οὕτως
  if (String(morphGntLemma).includes('(')) {
    const strippedOpt = canonGreek(String(morphGntLemma).replace(/\([^)]*\)/g, ''));
    if (strippedOpt && lexCanon === strippedOpt) return true;
  }

  // 3. Verb citation-form equivalence (strictly gated on morph V-)
  const morphStr = String(morphCode || '').trim();
  const isVerb = morphStr.startsWith('V-');
  if (isVerb) {
    // Active -ω <-> Middle/Deponent -ομαι (e.g. φοβέω <-> φοβέομαι, μνηστεύω <-> μνηστεύομαι)
    if (lexCanon.endsWith('ω') && tokCanon === `${lexCanon.slice(0, -1)}ομαι`) return true;
    if (tokCanon.endsWith('ω') && lexCanon === `${tokCanon.slice(0, -1)}ομαι`) return true;
    // Athematic -νύω <-> -νυμι (e.g. δεικνύω <-> δείκνυμι)
    if (lexCanon.endsWith('νυω') && tokCanon === `${lexCanon.slice(0, -3)}νυμι`) return true;
    if (tokCanon.endsWith('νυω') && lexCanon === `${tokCanon.slice(0, -3)}νυμι`) return true;
  }

  // 4. Closed verified Strong's <-> MorphGNT suppletive/inflected citation table
  const entry = strongsId ? VERIFIED_GREEK_STRONGS_LEMMA_EQUIV[strongsId] : null;
  if (entry) {
    if (!entry.lemmas.includes(tokCanon)) return false;
    if (entry.morphPrefixes && !entry.morphPrefixes.some(p => morphStr.startsWith(p))) {
      return false;
    }
    if (entry.morphRegex && !entry.morphRegex.test(morphStr)) {
      return false;
    }
    if (entry.surfaces) {
      const surfCanon = canonGreek(surfaceWord);
      if (!surfCanon || !entry.surfaces.includes(surfCanon)) return false;
    }
    return true;
  }

  return false;
}

function canonSemiticConsonants(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[^\u05D0-\u05EA]/g, '')
    .trim();
}

function cleanTrSurface(s) {
  return String(s || '').replace(/[.,·;]+$/g, '').trim();
}

function extractOshbRootStrongs(tok) {
  if (!tok) return null;
  if (tok.strongsId) return tok.strongsId;
  const raw = String(tok.lemmaRaw || tok.lemma || '');
  const nums = raw.match(/\d{1,4}/g);
  if (!nums || nums.length === 0) return null;
  return `H${parseInt(nums[nums.length - 1], 10)}`;
}

function loadStrongsLexicon(dbPath) {
  const raw = execFileSync(sqlitePath, [dbPath], {
    input: 'SELECT strongs_id, COALESCE(original_word, \'\') FROM strongs_entries;',
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  }).replace(/\r/g, '').trim();
  const map = new Map();
  for (const line of raw.split('\n')) {
    if (!line) continue;
    const idx = line.indexOf('|');
    if (idx < 0) continue;
    map.set(line.slice(0, idx), line.slice(idx + 1));
  }
  return map;
}

function buildCurrentSnapshot(r) {
  return {
    arPos: r.arPos,
    arWord: r.arWord,
    strongsId: r.strongsId || null,
    origWord: r.origWord || null,
    origSurface: r.origSurface || null,
    origPos: r.origPos,
    origMorph: r.origMorph || null,
    morphPos: r.morphPos || null,
    morphStem: r.morphStem || null,
    morphTense: r.morphTense || null,
    morphVoice: r.morphVoice || null,
    morphMood: r.morphMood || null,
    morphPerson: r.morphPerson || null,
    morphNumber: r.morphNumber || null,
    morphGender: r.morphGender || null,
    morphCase: r.morphCase || null,
    verifiedLocator: r.verifiedLocator || null,
    verifiedSource: r.verifiedSource || null,
    morphSource: r.morphSource || null,
    relationType: r.relationType || null,
    grammarNotes: r.grammarNotes || null
  };
}

function evaluateVerse(verseInfo, dbRows, sources, strongsLexicon = null, options = {}) {
  const { book, ch, vs, lang, name } = verseInfo;
  const isGreek = lang === 'greek';
  const protectedVerseKeys = options.protectedVerseKeys || null;
  const verseKey = `${book}:${ch}:${vs}`;

  // 0. Explicit Protected Adjudicated Registry check (zero mutation on adjudicated verses!)
  if (protectedVerseKeys && protectedVerseKeys.has(verseKey)) {
    return {
      verse: name, book, ch, vs, lang,
      edition: isGreek ? 'SBLGNT/TR' : 'OSHB',
      tokenCount: 0,
      proposals: dbRows.map(r => ({
        id: r.id,
        arPos: r.arPos,
        arWord: r.arWord,
        status: 'PRESERVED_ADJUDICATED_REGISTRY',
        ruleId: 'SKIP_PROTECTED_ADJUDICATED_VERSE',
        current: buildCurrentSnapshot(r),
        proposed: null,
        evidence: { note: 'Verse protected by explicit adjudicated registry & SHA-256 fingerprint.' },
        alternatives: []
      }))
    };
  }

  let tokens = [];
  let edition = '';
  let morphSource = '';
  let locPrefix = '';
  let trTokens = null;

  if (isGreek) {
    const sbl = sources.sblByBook[book] ? sources.sblByBook[book].get(`${ch}:${vs}`) : null;
    const trOsis = TR_BOOK_OSIS_MAP[book];
    const tr = trOsis && sources.trByOsis ? sources.trByOsis.get(`${trOsis}:${ch}:${vs}`) : null;
    if (!sbl || !sbl.length) {
      const adjSbl = Boolean(sources.sblByBook[book] && (sources.sblByBook[book].get(`${ch}:${vs - 1}`) || sources.sblByBook[book].get(`${ch}:${vs + 1}`)));
      const missReason = (tr && tr.length)
        ? 'PENDING_EDITION_TR_ONLY_NOT_IN_SBLGNT'
        : (adjSbl ? 'PENDING_VERSIFICATION_MISMATCH' : 'PENDING_NO_SOURCE_DATA');
      return {
        verse: name, book, ch, vs, lang,
        edition: (tr && tr.length) ? 'TR_ONLY' : 'MISSING',
        tokenCount: 0,
        proposals: dbRows.map(r => ({
          id: r.id,
          arPos: r.arPos,
          arWord: r.arWord,
          status: 'PENDING_REVIEW',
          ruleId: missReason,
          current: buildCurrentSnapshot(r),
          proposed: null,
          evidence: { reason: missReason, inTr: Boolean(tr && tr.length), adjacentSbl: adjSbl },
          alternatives: []
        }))
      };
    }
    tokens = sbl.map(t => ({
      index: t.index,
      surface: t.surfaceClean,
      surfaceCanon: canonGreek(t.surfaceClean),
      lemma: t.lemma,
      lemmaCanon: canonGreek(t.lemma),
      morph: t.morph,
      strongsId: null,
      isTr: false
    }));
    if (tr && tr.length) {
      trTokens = [];
      const trBySurf = new Map();
      for (const tt of tr) {
        const sc = canonGreek(cleanTrSurface(tt.surface));
        if (sc) {
          trTokens.push({
            index: tt.index,
            surface: tt.surface,
            surfaceCanon: sc,
            grammar: tt.grammar || null,
            strongsId: tt.strongsId || null,
            lemma: tt.lemma || null
          });
        }
        if (!trBySurf.has(sc)) trBySurf.set(sc, []);
        trBySurf.get(sc).push(tt);
      }
      for (const t of tokens) {
        const hits = trBySurf.get(t.surfaceCanon) || [];
        if (hits.length === 1 && hits[0].strongsId && canonGreek(hits[0].lemma) === t.lemmaCanon) {
          t.trCrossStrongsId = hits[0].strongsId;
        }
      }
    }
    edition = 'SBLGNT';
    morphSource = 'morphgnt_sblgnt';
    locPrefix = `SBLGNT:B${book}.C${ch}.V${vs}`;
  } else {
    const bName = OT_BOOK_MAP[book];
    const [bhsCh, bhsVs] = getBhsChapterVerse(book, ch, vs);
    const osis = `${bName}.${bhsCh}.${bhsVs}`;
    const oshb = sources.oshbByBook[book] ? sources.oshbByBook[book].get(osis) : null;
    if (!oshb || !oshb.length) {
      const missReason = 'PENDING_NO_SOURCE_DATA';
      return {
        verse: name, book, ch, vs, lang,
        edition: 'MISSING',
        tokenCount: 0,
        proposals: dbRows.map(r => ({
          id: r.id,
          arPos: r.arPos,
          arWord: r.arWord,
          status: 'PENDING_REVIEW',
          ruleId: missReason,
          current: buildCurrentSnapshot(r),
          proposed: null,
          evidence: { reason: missReason, osis },
          alternatives: []
        }))
      };
    }
    tokens = oshb.map(t => {
      const rootSid = extractOshbRootStrongs(t);
      const surf = t.text || t.surface || '';
      return {
        index: t.index,
        surface: surf,
        surfaceCanon: canonSemiticConsonants(surf),
        lemma: t.lemma || '',
        lemmaCanon: rootSid || '',
        morph: t.morph,
        strongsId: rootSid,
        isTr: false
      };
    });
    edition = 'OSHB';
    morphSource = 'oshb_wlc';
    locPrefix = `OSHB:B${book}.C${bhsCh}.V${bhsVs}`;
  }

  // Occurrence frequency tables across the ENTIRE verse
  const surfFreq = new Map();
  const lexFreq = new Map();
  for (const t of tokens) {
    surfFreq.set(t.surfaceCanon, (surfFreq.get(t.surfaceCanon) || 0) + 1);
    if (t.lemmaCanon) lexFreq.set(t.lemmaCanon, (lexFreq.get(t.lemmaCanon) || 0) + 1);
  }

  // Pre-register secondary components (link_order > 1) and split-prefix tokens across the verse
  const reservedSecondaryByToken = new Map();
  const splitPrefixTokens = new Set();
  for (const r of dbRows) {
    for (const secPos of (r.secondaryPositions || [])) {
      if (secPos !== null && secPos !== undefined) {
        if (!reservedSecondaryByToken.has(secPos)) reservedSecondaryByToken.set(secPos, []);
        reservedSecondaryByToken.get(secPos).push(r.arPos);
      }
    }
    if (r.strongsId && /^H900\d$/.test(r.strongsId) && r.origPos !== null && r.origPos !== undefined) {
      splitPrefixTokens.add(r.origPos);
    }
  }

  const rawProposals = [];

  for (const r of dbRows) {
    const current = buildCurrentSnapshot(r);

    // Structural protections (range locators, special relations, verified TR, explicit scholarly grammar_notes)
    if (r.verifiedSource === 'syntactic_ar' || r.relationType === 'syntactic_ar' || r.relationType === 'compound_phrase') {
      rawProposals.push({
        id: r.id, arPos: r.arPos, arWord: r.arWord,
        status: 'PRESERVED_SPECIAL_RELATION',
        ruleId: r.relationType === 'compound_phrase' ? 'SKIP_COMPOUND_PHRASE' : 'SKIP_SYNTACTIC_AR',
        current, proposed: null,
        evidence: { note: 'Preserved special relation_type / syntactic_ar; token reserved in whole-verse map.' },
        alternatives: [],
        existingWms: r.existingWms || []
      });
      continue;
    }

    if (r.morphSource === 'morphgnt_tr' && r.verifiedLocator && r.verifiedLocator.startsWith('TR:') && r.origMorph) {
      rawProposals.push({
        id: r.id, arPos: r.arPos, arWord: r.arWord,
        status: 'PRESERVED_VERIFIED_TR',
        ruleId: 'SKIP_VERIFIED_TR',
        current, proposed: null,
        evidence: { note: 'Preserved verified morphgnt_tr row; token reserved in whole-verse map.' },
        alternatives: [],
        existingWms: r.existingWms || []
      });
      continue;
    }

    if (r.verifiedLocator && /w\d+-w\d+$/.test(r.verifiedLocator)) {
      rawProposals.push({
        id: r.id, arPos: r.arPos, arWord: r.arWord,
        status: 'PRESERVED_RANGE_LOCATOR',
        ruleId: 'SKIP_MULTI_TOKEN_RANGE',
        current, proposed: null,
        evidence: { note: 'Preserved multi-token span locator (wA-wB) untouched.' },
        alternatives: [],
        existingWms: r.existingWms || []
      });
      continue;
    }

    if (r.grammarNotes && String(r.grammarNotes).trim().length > 0) {
      rawProposals.push({
        id: r.id, arPos: r.arPos, arWord: r.arWord,
        status: 'PRESERVED_GRAMMAR_NOTES',
        ruleId: 'SKIP_EXPLICIT_GRAMMAR_NOTES',
        current, proposed: null,
        evidence: { note: 'Preserved row carrying explicit scholarly grammar_notes.' },
        alternatives: [],
        existingWms: r.existingWms || []
      });
      continue;
    }

    // Multiple distinct existing primary components guard: NEVER auto-delete distinct primary links!
    const existingPrimaries = (r.existingWms || []).filter(w => w.role === 'primary');
    const distinctPrimaryKeys = new Set(existingPrimaries.map(w => `${w.sid}@${w.pos}`));
    if (distinctPrimaryKeys.size > 1) {
      rawProposals.push({
        id: r.id, arPos: r.arPos, arWord: r.arWord,
        status: 'PENDING_REVIEW',
        ruleId: `CONFLICT_MULTIPLE_EXISTING_PRIMARIES(count=${distinctPrimaryKeys.size})`,
        current, proposed: null,
        evidence: { note: 'Multiple distinct primary components exist in word_mapping_strongs; refused auto-deletion.', primaries: existingPrimaries },
        alternatives: [],
        existingWms: r.existingWms || []
      });
      continue;
    }

    const rSurfCanon = isGreek ? canonGreek(r.origSurface) : canonSemiticConsonants(r.origSurface);
    const rLexCanon = isGreek ? canonGreek(r.origWord) : (r.strongsId || '');

    const surfMatches = rSurfCanon ? tokens.filter(t => t.surfaceCanon === rSurfCanon) : [];
    const lexMatches = rLexCanon ? tokens.filter(t => t.lemmaCanon === rLexCanon) : [];
    const bothMatches = surfMatches.filter(t => t.lemmaCanon === rLexCanon);

    const alternatives = Array.from(new Set([...bothMatches, ...surfMatches, ...lexMatches])).map(t => ({
      w: t.index,
      surface: t.surface,
      lemma: t.lemma,
      strongsId: t.strongsId || t.trCrossStrongsId || null,
      morph: t.morph,
      surfOccurrencesInVerse: surfFreq.get(t.surfaceCanon) || 0,
      lexOccurrencesInVerse: lexFreq.get(t.lemmaCanon) || 0
    }));

    let chosen = null;
    let ruleId = null;
    let rejectReason = null;

    const checkG2BUniqueSurfaceRepeatedLemma = (t) => {
      if (!isGreek || !r.strongsId || !r.strongsId.startsWith('G')) return null;
      const isContentGreek = Boolean(t.morph && /^(N-|V-|A-|D-)/.test(t.morph));
      if (!isContentGreek) return 'REJECT_G2B_NON_CONTENT_POS';
      // Guard 1: Stored MorphGNT code (if present) must NOT contradict target token morphology
      const hasStoredMorphGnt = Boolean(r.origMorph && /^(N-|V-|A-|D-)\s+\S{8}/.test(String(r.origMorph).trim()));
      if (hasStoredMorphGnt && String(r.origMorph).trim() !== String(t.morph).trim()) {
        return `REJECT_G2B_STORED_MORPH_MISMATCH(stored=${r.origMorph},sbl=${t.morph})`;
      }
      // Guard 2: Anti-lemma-copy guard — if stored surface equals dictionary citation form (rSurfCanon === rLexCanon),
      // require explicit matching MorphGNT code so legacy lemma-copied rows cannot lock onto an accidental nominative/1sg token.
      if (rSurfCanon === rLexCanon && !hasStoredMorphGnt) {
        return 'REJECT_G2B_AMBIGUOUS_UNINFLECTED_CITATION_FORM';
      }
      // Guard 3: Scrivener TR witness must be present AND uniquely confirm both surface & Robinson morphology
      if (!trTokens || trTokens.length === 0) {
        return `REJECT_G2B_TR_WITNESS_UNAVAILABLE(w${t.index}:${t.surface})`;
      }
      const trHits = trTokens.filter(tt =>
        isGreekPureOrthographicVariant(tt.surfaceCanon, t.surfaceCanon, r.strongsId) &&
        trGrammarMatchesSblMorph(tt.grammar, t.morph)
      );
      if (trHits.length !== 1) {
        return `REJECT_G2B_TR_WITNESS_MISMATCH(trHits=${trHits.length},sbl=${t.surface})`;
      }
      // Guard 4: Lexical audit compatibility (matches full 4-axis auditor)
      if (!greekStrongsMatchesLemma(r.strongsId, t.lemma)) {
        return `REJECT_G2B_LEXICAL_AUDIT_COMPAT(${r.strongsId}!=${t.lemma})`;
      }
      // Guard 5 (v1.8.1): Preposition-case context guard for repeated-lemma Greek nominals (N-/A-).
      // If the Arabic nominal is immediately preceded by a standalone Arabic preposition (e.g. «عَنْ شَرّ»),
      // and the target Greek token is NOT governed by a Greek preposition while ANOTHER occurrence of the
      // SAME lemma in the verse IS governed by a Greek preposition (e.g. κακὸν vs ἀντὶ κακοῦ), reject.
      if (t.morph && /^(N-|A-)/.test(t.morph)) {
        const prevArRow = dbRows.find(x => x.arPos === r.arPos - 1);
        const prevArClean = prevArRow ? canonArabicWord(prevArRow.arWord) : '';
        if (prevArClean && AR_STANDALONE_PREPS.has(prevArClean)) {
          const targetHasPrep = hasPrecedingGreekPrep(tokens, t.index);
          const otherSameLemmaHasPrep = tokens.some(
            ot => ot.index !== t.index && ot.lemmaCanon === t.lemmaCanon && hasPrecedingGreekPrep(tokens, ot.index)
          );
          if (!targetHasPrep && otherSameLemmaHasPrep) {
            return `REJECT_G2B_PREP_CASE_CONTEXT_MISMATCH(arPrev=${prevArClean},w${t.index}:${t.surface})`;
          }
        }
      }
      return 'OK';
    };

    if (bothMatches.length === 1) {
      const t = bothMatches[0];
      const sCount = surfFreq.get(t.surfaceCanon) || 0;
      const lCount = lexFreq.get(t.lemmaCanon) || 0;
      if (sCount === 1 && lCount === 1) {
        chosen = t;
        ruleId = (r.origPos === t.index) ? 'RULE_G3_UNIQUE_LOCKED_DERIVED_MORPH' : 'RULE_G1_UNIQUE_BIJECTIVE_RELOC';
      } else if (sCount === 1 && lCount > 1 && isGreek) {
        const g2bCheck = checkG2BUniqueSurfaceRepeatedLemma(t);
        if (g2bCheck === 'OK') {
          chosen = t;
          ruleId = 'RULE_G2B_UNIQUE_SURFACE_REPEATED_LEMMA';
        } else {
          rejectReason = g2bCheck || `REJECT_DUPLICATE_OCCURRENCE_IN_VERSE(surfCount=${sCount},lexCount=${lCount})`;
        }
      } else {
        rejectReason = `REJECT_DUPLICATE_OCCURRENCE_IN_VERSE(surfCount=${sCount},lexCount=${lCount})`;
      }
    } else if (bothMatches.length > 1) {
      rejectReason = `REJECT_MULTIPLE_BOTH_MATCHES(count=${bothMatches.length})`;
    } else if (surfMatches.length === 1 && rSurfCanon.length >= 3) {
      const t = surfMatches[0];
      const sCount = surfFreq.get(t.surfaceCanon) || 0;
      const lCount = lexFreq.get(t.lemmaCanon) || 0;
      if (sCount === 1 && lCount === 1) {
        chosen = t;
        ruleId = 'RULE_G2_UNIQUE_INFLECTED_SURFACE_LOCK';
      } else if (sCount === 1 && lCount > 1 && isGreek) {
        const g2bCheck = checkG2BUniqueSurfaceRepeatedLemma(t);
        if (g2bCheck === 'OK') {
          chosen = t;
          ruleId = 'RULE_G2B_UNIQUE_SURFACE_REPEATED_LEMMA';
        } else {
          rejectReason = g2bCheck || `REJECT_DUPLICATE_OCCURRENCE_IN_VERSE(surfCount=${sCount},lexCount=${lCount})`;
        }
      } else {
        rejectReason = `REJECT_DUPLICATE_OCCURRENCE_IN_VERSE(surfCount=${sCount},lexCount=${lCount})`;
      }
    } else if (lexMatches.length === 1 && !isGreek && r.strongsId && r.strongsId.startsWith('H')) {
      const t = lexMatches[0];
      const lCount = lexFreq.get(t.lemmaCanon) || 0;
      const sCount = surfFreq.get(t.surfaceCanon) || 0;
      if (lCount === 1 && sCount === 1) {
        chosen = t;
        ruleId = (r.origPos === t.index) ? 'RULE_G3_UNIQUE_LOCKED_DERIVED_MORPH' : 'RULE_G1B_UNIQUE_OSHB_ROOT_RELOC';
      } else {
        rejectReason = `REJECT_DUPLICATE_OCCURRENCE_IN_VERSE(surfCount=${sCount},lexCount=${lCount})`;
      }
    } else if (lexMatches.length === 1 && isGreek && r.strongsId && r.strongsId.startsWith('G') && rLexCanon.length >= 3) {
      const t = lexMatches[0];
      const lCount = lexFreq.get(t.lemmaCanon) || 0;
      const sCount = surfFreq.get(t.surfaceCanon) || 0;
      const isContentGreek = Boolean(t.morph && /^(N-|V-|A-|D-)/.test(t.morph));
      const surfCompatible =
        !rSurfCanon ||
        rSurfCanon === rLexCanon ||
        isGreekPureOrthographicVariant(rSurfCanon, t.surfaceCanon, r.strongsId);
      if (!isContentGreek || !surfCompatible) {
        rejectReason = `PENDING_NO_UNAMBIGUOUS_MATCH(both=${bothMatches.length},surf=${surfMatches.length},lex=${lexMatches.length})`;
      } else if (!trTokens || trTokens.length === 0) {
        rejectReason = `REJECT_G1C_TR_WITNESS_UNAVAILABLE(w${t.index}:${t.surface})`;
      } else {
        const trAgreesWithSbl = trTokens.some(tt =>
          isGreekPureOrthographicVariant(tt.surfaceCanon, t.surfaceCanon, r.strongsId) &&
          trGrammarMatchesSblMorph(tt.grammar, t.morph)
        );
        if (!trAgreesWithSbl) {
          rejectReason = `REJECT_G1C_TR_SBLGNT_VARIANT(sbl=${t.surface},stored=${r.origSurface || 'NULL'})`;
        } else if (!greekStrongsMatchesLemma(r.strongsId, t.lemma)) {
          rejectReason = `REJECT_G1C_LEXICAL_AUDIT_COMPAT(${r.strongsId}!=${t.lemma})`;
        } else if (lCount === 1 && sCount === 1) {
          chosen = t;
          ruleId = 'RULE_G1C_UNIQUE_GREEK_LEMMA_LOCK';
        } else {
          rejectReason = `REJECT_DUPLICATE_OCCURRENCE_IN_VERSE(surfCount=${sCount},lexCount=${lCount})`;
        }
      }
    } else {
      rejectReason = `PENDING_NO_UNAMBIGUOUS_MATCH(both=${bothMatches.length},surf=${surfMatches.length},lex=${lexMatches.length})`;
    }

    if (!chosen) {
      rawProposals.push({
        id: r.id, arPos: r.arPos, arWord: r.arWord,
        status: 'PENDING_REVIEW',
        ruleId: rejectReason,
        current, proposed: null,
        evidence: { edition, tokenCount: tokens.length, reason: rejectReason },
        alternatives,
        existingWms: r.existingWms || [],
        _dupCandidates: (bothMatches.length > 1) ? bothMatches : null,
        _dupKey: (bothMatches.length > 1) ? `${rSurfCanon}|${rLexCanon}` : null,
        _rawRow: r
      });
      continue;
    }

    // Protect split-prefix isolation (if another row holds H900x on this same token wN)
    if (!isGreek && splitPrefixTokens.has(chosen.index)) {
      rawProposals.push({
        id: r.id, arPos: r.arPos, arWord: r.arWord,
        status: 'PENDING_REVIEW',
        ruleId: `CONFLICT_SPLIT_PREFIX_ISOLATION(w${chosen.index})`,
        current, proposed: null,
        evidence: { edition, tokenIndex: chosen.index, reason: 'Token has split H900x prefix row in verse.' },
        alternatives,
        existingWms: r.existingWms || []
      });
      continue;
    }

    // Independent Strong's & Lexicon Verification BEFORE high-confidence!
    let targetStrongs = null;
    let targetOrigWord = null;
    let lexReject = null;

    if (isGreek) {
      targetOrigWord = chosen.lemma;
      const candidateSid = (ruleId === 'RULE_G2_UNIQUE_INFLECTED_SURFACE_LOCK')
        ? (chosen.trCrossStrongsId || r.strongsId)
        : (r.strongsId || chosen.trCrossStrongsId);

      if (!candidateSid) {
        lexReject = 'REJECT_MISSING_GREEK_STRONGS';
      } else if (!strongsLexicon) {
        lexReject = 'REJECT_NO_STRONGS_LEXICON_LOADED';
      } else {
        const lexWord = strongsLexicon.get(candidateSid);
        if (!lexWord) {
          lexReject = `REJECT_UNKNOWN_STRONGS_ID(${candidateSid})`;
        } else if (!isGreekStrongsLemmaEquivalent(candidateSid, lexWord, chosen.lemma, chosen.morph, chosen.surface)) {
          lexReject = `REJECT_STORED_STRONGS_LEXICON_MISMATCH(${candidateSid}:${lexWord}!=${chosen.lemma})`;
        } else if (r.strongsId && r.origWord && greekStrongsMatchesLemma(r.strongsId, r.origWord) && !greekStrongsMatchesLemma(candidateSid, chosen.lemma)) {
          lexReject = `REJECT_GREEK_LEXICAL_AUDIT_COMPAT(${candidateSid}!=${chosen.lemma})`;
        } else {
          targetStrongs = candidateSid;
        }
      }
    } else {
      targetStrongs = chosen.strongsId;
      if (!targetStrongs) {
        lexReject = 'REJECT_MISSING_OSHB_STRONGS';
      } else if (!strongsLexicon || !strongsLexicon.get(targetStrongs)) {
        lexReject = `REJECT_MISSING_LEXICON_LEMMA(${targetStrongs})`;
      } else {
        const lexLemma = strongsLexicon.get(targetStrongs);
        const storedCons = canonSemiticConsonants(r.origWord);
        const lexCons = canonSemiticConsonants(lexLemma);
        if (storedCons.length >= 2 && lexCons.length >= 2 && storedCons !== lexCons) {
          lexReject = `REJECT_STORED_LEMMA_CONFLICTS_WITH_LEXICON(stored=${r.origWord},lexicon=${lexLemma},strongs=${targetStrongs})`;
        } else {
          targetOrigWord = lexLemma;
        }
      }
    }

    if (lexReject) {
      rawProposals.push({
        id: r.id, arPos: r.arPos, arWord: r.arWord,
        status: 'PENDING_REVIEW',
        ruleId: lexReject,
        current, proposed: null,
        evidence: { edition, tokenIndex: chosen.index, tokenSurface: chosen.surface, tokenLemma: chosen.lemma, reason: lexReject },
        alternatives,
        existingWms: r.existingWms || []
      });
      continue;
    }

    const d = deriveCanonicalMorphFields(lang, chosen.morph, false, {
      morphPos: r.morphPos,
      morphNumber: r.morphNumber
    });
    let finalMorphPos = (isGreek && chosen.morph.startsWith('N-')) ? 'noun' : d.morphPos;
    if (isGreek && chosen.morph.startsWith('RI') && (r.morphPos === 'pronoun' || targetStrongs === 'G5100')) {
      finalMorphPos = 'pronoun';
    }

    // General Arabic-to-Source contextual compatibility guard across ALL rules (G1, G1B, G2, G2B, G3)
    const arCtxReject = checkArabicSourceContextualCompatibility(r.arWord, finalMorphPos, ruleId, r.morphPos, isGreek, targetStrongs, d)
      || checkCompoundPrepMissingLexicalHead(r.arWord, r.arPos, chosen, isGreek, tokens, dbRows)
      || checkCompoundConjMissingLexicalHead(r.arWord, isGreek, targetStrongs, chosen);
    if (arCtxReject) {
      rawProposals.push({
        id: r.id, arPos: r.arPos, arWord: r.arWord,
        status: 'PENDING_REVIEW',
        ruleId: arCtxReject,
        current, proposed: null,
        evidence: {
          edition,
          tokenIndex: chosen.index,
          tokenSurface: chosen.surface,
          tokenLemma: chosen.lemma,
          tokenMorph: chosen.morph,
          proposedMorphPos: finalMorphPos,
          reason: arCtxReject
        },
        alternatives,
        existingWms: r.existingWms || []
      });
      continue;
    }

    // Preserve pronominal suffix person/gender/number when OSHB morph has /Sp* and fields were already set
    const hasSpSuffix = !isGreek && /\/Sp\d/.test(chosen.morph);
    const finalPerson = (hasSpSuffix && !d.morphPerson && r.morphPerson) ? r.morphPerson : d.morphPerson;
    const finalGender = (hasSpSuffix && !d.morphGender && r.morphGender) ? r.morphGender : d.morphGender;
    const finalNumber = (hasSpSuffix && !d.morphNumber && r.morphNumber) ? r.morphNumber : d.morphNumber;

    // Preserve literal maqaf if already present on exact matching OSHB surface
    const finalSurface = (!isGreek && r.origSurface && r.origSurface.endsWith('־') && canonSemiticConsonants(r.origSurface) === chosen.surfaceCanon)
      ? r.origSurface
      : chosen.surface;

    const targetLocator = `${locPrefix}.w${chosen.index}`;

    const proposed = {
      strongsId: targetStrongs,
      origWord: targetOrigWord,
      origSurface: finalSurface,
      origPos: chosen.index,
      origMorph: chosen.morph,
      morphPos: finalMorphPos,
      morphStem: d.morphStem,
      morphTense: d.morphTense,
      morphVoice: d.morphVoice,
      morphMood: d.morphMood,
      morphPerson: finalPerson,
      morphNumber: finalNumber,
      morphGender: finalGender,
      morphCase: d.morphCase,
      verifiedLocator: targetLocator,
      verifiedSource: morphSource,
      morphSource: morphSource
    };

    const isAlreadyCanonical =
      current.strongsId === proposed.strongsId &&
      current.origWord === proposed.origWord &&
      current.origSurface === proposed.origSurface &&
      current.origPos === proposed.origPos &&
      current.origMorph === proposed.origMorph &&
      current.morphPos === proposed.morphPos &&
      current.morphStem === proposed.morphStem &&
      current.morphTense === proposed.morphTense &&
      current.morphVoice === proposed.morphVoice &&
      current.morphMood === proposed.morphMood &&
      current.morphPerson === proposed.morphPerson &&
      current.morphNumber === proposed.morphNumber &&
      current.morphGender === proposed.morphGender &&
      current.morphCase === proposed.morphCase &&
      current.verifiedLocator === proposed.verifiedLocator &&
      current.verifiedSource === proposed.verifiedSource &&
      current.morphSource === proposed.morphSource &&
      r.hasCleanPrimaryWms;

    rawProposals.push({
      id: r.id, arPos: r.arPos, arWord: r.arWord,
      status: isAlreadyCanonical ? 'ALREADY_CANONICAL' : 'AUTO_PROPOSED_HIGH_CONFIDENCE',
      ruleId: isAlreadyCanonical ? 'NO_CHANGE_ALREADY_CANONICAL' : ruleId,
      targetTokenIndex: chosen.index,
      current, proposed,
      evidence: {
        edition,
        tokenIndex: chosen.index,
        tokenSurface: finalSurface,
        tokenLemma: chosen.lemma,
        tokenMorph: chosen.morph,
        verifiedLexiconLemma: strongsLexicon.get(targetStrongs),
        surfOccurrencesInVerse: surfFreq.get(chosen.surfaceCanon) || 0,
        lexOccurrencesInVerse: lexFreq.get(chosen.lemmaCanon) || 0
      },
      alternatives,
      existingWms: r.existingWms || []
    });
  }

  // v1.5 PASS: RULE_G4_BRACKETED_DUPLICATE_BIJECTION
  // Resolves duplicate-occurrence groups (M >= 2) ONLY when:
  //   (1) Exact cardinality: M Arabic rows match the exact same M source tokens by BOTH surface & lemma/Strong's,
  //   (2) Strict bracket separation: EVERY adjacent pair (i, i+1) is strictly separated in BOTH Arabic and Source
  //       order by at least one locked unique non-G4 anchor (ar_i < anchorAr < ar_{i+1} AND w_i < anchorW < w_{i+1}),
  //   (3) POS & Compound Safety (v1.5):
  //       - Excludes standalone Greek prepositions (P-) from G4 auto-acceptance temporarily,
  //       - Excludes bare pronouns (RP/RD/RR/RI/HP*/AP*) from G4 auto-acceptance,
  //       - Rejects compound Arabic words (e.g. «بِاسْمِ») reduced to a bare preposition alone via verified decomposition,
  //   (4) Independent strongs_entries lexicon verification & Arabic-to-Source contextual compatibility,
  //   (5) End-to-End Fixed-Point Soundness (v1.5): inside the fixed-point anti-collision loop below,
  //       if ANY member of a G4 group is demoted OR any required separating anchor is demoted,
  //       the ENTIRE G4 group is invalidated to PENDING_REVIEW (zero partial acceptance, zero dead anchors).
  const lockedUniqueAnchors = rawProposals
    .filter(p => (p.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' || p.status === 'ALREADY_CANONICAL') && p.targetTokenIndex)
    .map(p => ({ arPos: p.arPos, w: p.targetTokenIndex }));

  const dupGroups = new Map(); // dupKey -> array of rawProposal refs
  for (const p of rawProposals) {
    if (p.status === 'PENDING_REVIEW' && p._dupCandidates && p._dupKey) {
      if (!dupGroups.has(p._dupKey)) dupGroups.set(p._dupKey, []);
      dupGroups.get(p._dupKey).push(p);
    }
  }

  const g4Groups = [];

  for (const [dupKey, grp] of dupGroups.entries()) {
    const cands = grp[0]._dupCandidates;
    const M = cands.length;
    if (M < 2 || grp.length !== M) continue;

    // Sort Arabic rows ascending by arPos, and candidate tokens ascending by index
    const sortedGrp = [...grp].sort((a, b) => a.arPos - b.arPos);
    const sortedToks = [...cands].sort((a, b) => a.index - b.index);

    // Verify all rows in group share the exact same candidate token set
    const tokSetKey = sortedToks.map(t => t.index).join(',');
    if (!sortedGrp.every(p => p._dupCandidates.map(t => t.index).sort((a, b) => a - b).join(',') === tokSetKey)) continue;

    // Condition 2: Every adjacent pair (i, i+1) must be strictly bracketed by at least one locked unique anchor!
    let allBracketed = true;
    const bracketWitnesses = [];
    for (let i = 0; i < M - 1; i++) {
      const arLo = sortedGrp[i].arPos, arHi = sortedGrp[i + 1].arPos;
      const wLo = sortedToks[i].index, wHi = sortedToks[i + 1].index;
      const sep = lockedUniqueAnchors.find(a => a.arPos > arLo && a.arPos < arHi && a.w > wLo && a.w < wHi);
      if (!sep) {
        allBracketed = false;
        break;
      }
      bracketWitnesses.push({ betweenAr: [arLo, arHi], betweenW: [wLo, wHi], anchor: sep });
    }
    if (!allBracketed) continue;

    // Validate EVERY row in the group independently before accepting the collective bijection
    const builtProps = [];
    let groupValid = true;
    let groupRejectTag = null;
    for (let i = 0; i < M; i++) {
      const p = sortedGrp[i];
      const r = p._rawRow;
      const chosen = sortedToks[i];
      if (!isGreek && splitPrefixTokens.has(chosen.index)) { groupValid = false; break; }

      let targetStrongs = null, targetOrigWord = null;
      if (isGreek) {
        targetOrigWord = chosen.lemma;
        const candidateSid = r.strongsId || chosen.trCrossStrongsId;
        const lexWord = candidateSid && strongsLexicon ? strongsLexicon.get(candidateSid) : null;
        if (!lexWord || !isGreekStrongsLemmaEquivalent(candidateSid, lexWord, chosen.lemma, chosen.morph, chosen.surface)) { groupValid = false; break; }
        targetStrongs = candidateSid;
      } else {
        targetStrongs = chosen.strongsId;
        const lexLemma = targetStrongs && strongsLexicon ? strongsLexicon.get(targetStrongs) : null;
        if (!lexLemma) { groupValid = false; break; }
        const storedCons = canonSemiticConsonants(r.origWord);
        const lexCons = canonSemiticConsonants(lexLemma);
        if (storedCons.length >= 2 && lexCons.length >= 2 && storedCons !== lexCons) { groupValid = false; break; }
        targetOrigWord = lexLemma;
      }

      const d = deriveCanonicalMorphFields(lang, chosen.morph, false, { morphPos: r.morphPos, morphNumber: r.morphNumber });
      let finalMorphPos = (isGreek && chosen.morph.startsWith('N-')) ? 'noun' : d.morphPos;
      if (isGreek && chosen.morph.startsWith('RI') && (r.morphPos === 'pronoun' || targetStrongs === 'G5100')) finalMorphPos = 'pronoun';

      // v1.5 Compound-prep decomposition guard FIRST (explicit diagnostic for «بِاسْمِ» etc.)
      const compReject = checkCompoundPrepMissingLexicalHead(r.arWord, r.arPos, chosen, isGreek, tokens, dbRows);
      if (compReject) {
        groupValid = false;
        groupRejectTag = compReject;
        break;
      }

      // v1.5 G4 POS eligibility guard (excludes standalone Greek prepositions P- and bare pronouns)
      const g4PosReject = checkG4PosEligibility(isGreek, chosen, finalMorphPos);
      if (g4PosReject) {
        groupValid = false;
        groupRejectTag = g4PosReject;
        break;
      }

      const ctxReject = checkArabicSourceContextualCompatibility(r.arWord, finalMorphPos, 'RULE_G4_BRACKETED_DUPLICATE_BIJECTION', r.morphPos);
      if (ctxReject) {
        groupValid = false;
        groupRejectTag = ctxReject;
        break;
      }

      const hasSpSuffix = !isGreek && /\/Sp\d/.test(chosen.morph);
      const finalPerson = (hasSpSuffix && !d.morphPerson && r.morphPerson) ? r.morphPerson : d.morphPerson;
      const finalGender = (hasSpSuffix && !d.morphGender && r.morphGender) ? r.morphGender : d.morphGender;
      const finalNumber = (hasSpSuffix && !d.morphNumber && r.morphNumber) ? r.morphNumber : d.morphNumber;
      const finalSurface = (!isGreek && r.origSurface && r.origSurface.endsWith('־') && canonSemiticConsonants(r.origSurface) === chosen.surfaceCanon)
        ? r.origSurface : chosen.surface;

      const proposed = {
        strongsId: targetStrongs, origWord: targetOrigWord, origSurface: finalSurface,
        origPos: chosen.index, origMorph: chosen.morph, morphPos: finalMorphPos,
        morphStem: d.morphStem, morphTense: d.morphTense, morphVoice: d.morphVoice, morphMood: d.morphMood,
        morphPerson: finalPerson, morphNumber: finalNumber, morphGender: finalGender, morphCase: d.morphCase,
        verifiedLocator: `${locPrefix}.w${chosen.index}`, verifiedSource: morphSource, morphSource
      };

      const isAlreadyCanonical =
        p.current.strongsId === proposed.strongsId && p.current.origWord === proposed.origWord &&
        p.current.origSurface === proposed.origSurface && p.current.origPos === proposed.origPos &&
        p.current.origMorph === proposed.origMorph && p.current.morphPos === proposed.morphPos &&
        p.current.morphStem === proposed.morphStem && p.current.morphTense === proposed.morphTense &&
        p.current.morphVoice === proposed.morphVoice && p.current.morphMood === proposed.morphMood &&
        p.current.morphPerson === proposed.morphPerson && p.current.morphNumber === proposed.morphNumber &&
        p.current.morphGender === proposed.morphGender && p.current.morphCase === proposed.morphCase &&
        p.current.verifiedLocator === proposed.verifiedLocator && p.current.verifiedSource === proposed.verifiedSource &&
        p.current.morphSource === proposed.morphSource && r.hasCleanPrimaryWms;

      builtProps.push({ p, chosen, proposed, isAlreadyCanonical });
    }

    if (!groupValid && groupRejectTag) {
      for (const p of sortedGrp) {
        p.ruleId = groupRejectTag;
        if (p.evidence) p.evidence.reason = groupRejectTag;
      }
      continue;
    }

    if (groupValid && builtProps.length === M) {
      for (const { p, chosen, proposed, isAlreadyCanonical } of builtProps) {
        p.status = isAlreadyCanonical ? 'ALREADY_CANONICAL' : 'AUTO_PROPOSED_HIGH_CONFIDENCE';
        p.ruleId = isAlreadyCanonical ? 'NO_CHANGE_ALREADY_CANONICAL' : 'RULE_G4_BRACKETED_DUPLICATE_BIJECTION';
        p.targetTokenIndex = chosen.index;
        p.proposed = proposed;
        p._isG4 = true;
        p.evidence = {
          edition, tokenIndex: chosen.index, tokenSurface: proposed.origSurface,
          tokenLemma: chosen.lemma, tokenMorph: chosen.morph,
          verifiedLexiconLemma: strongsLexicon.get(proposed.strongsId),
          duplicateGroupSize: M,
          bracketWitnesses
        };
      }
      g4Groups.push({
        dupKey,
        members: builtProps.map(x => x.p),
        targetTokens: builtProps.map(x => x.chosen.index),
        active: true
      });
    }
  }

  for (const p of rawProposals) {
    delete p._dupCandidates;
    delete p._dupKey;
    delete p._rawRow;
  }

  // WHOLE-VERSE FIXED-POINT ANTI-COLLISION & G4 GROUP/ANCHOR SOUNDNESS PASS (v1.5):
  // Accounts for ALL old & new claims: preserved special/TR/range/notes rows, secondary components,
  // peer auto-proposed rows, ALREADY_CANONICAL rows, untouched PENDING_REVIEW neighbors,
  // AND enforces atomic G4 group integrity + anchor survival all the way to the final fixed point!
  let changed = true;
  while (changed) {
    changed = false;

    const postClaimsByToken = new Map(); // tokenIndex -> array of { arPos, kind }
    const addClaim = (tokIdx, arPos, kind) => {
      if (tokIdx === null || tokIdx === undefined) return;
      if (!postClaimsByToken.has(tokIdx)) postClaimsByToken.set(tokIdx, []);
      postClaimsByToken.get(tokIdx).push({ arPos, kind });
    };

    for (const p of rawProposals) {
      if (p.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' && p.proposed) {
        addClaim(p.targetTokenIndex, p.arPos, 'AUTO_PROPOSED');
      } else if (p.status === 'ALREADY_CANONICAL') {
        addClaim(p.current.origPos, p.arPos, 'ALREADY_CANONICAL');
      } else if (p.status.startsWith('PRESERVED_')) {
        addClaim(p.current.origPos, p.arPos, p.status);
      } else {
        // PENDING_REVIEW stays at its existing origPos!
        addClaim(p.current.origPos, p.arPos, 'PENDING_NEIGHBOR');
      }
    }

    for (const p of rawProposals) {
      if (p.status !== 'AUTO_PROPOSED_HIGH_CONFIDENCE') continue;
      const wTarget = p.targetTokenIndex;

      // 1. Secondary component reservation check
      const reservedSec = (reservedSecondaryByToken.get(wTarget) || []).filter(ap => ap !== p.arPos);
      if (reservedSec.length > 0) {
        p.status = 'PENDING_REVIEW';
        p.ruleId = `CONFLICT_RESERVED_SECONDARY_TOKEN(w${wTarget},reservedBy=${reservedSec.join(',')})`;
        p.proposed = null;
        p.evidence.reservedBySecondary = reservedSec;
        changed = true;
        continue;
      }

      // 2. Post-state primary collision check against ALL other rows (preserved, peer auto-proposed, OR untouched pending neighbors!)
      const otherClaims = (postClaimsByToken.get(wTarget) || []).filter(c => c.arPos !== p.arPos);
      if (otherClaims.length > 0) {
        const hasReserved = otherClaims.some(c => c.kind.startsWith('PRESERVED_'));
        const hasPendingNeighbor = otherClaims.some(c => c.kind === 'PENDING_NEIGHBOR');
        // Allow in-place metadata refresh ONLY if BOTH origPos AND verifiedLocator identity are unchanged.
        // Converting TR:wN -> SBLGNT:wN (or NULL -> SBLGNT:wN) changes locator identity and MUST NOT collide with a pending neighbor!
        const sameLocatorIdentity = wTarget === p.current.origPos && p.current.verifiedLocator === p.proposed.verifiedLocator;
        if (sameLocatorIdentity && !hasReserved && otherClaims.every(c => c.kind === 'PENDING_NEIGHBOR')) {
          continue;
        }
        const conflictTag = hasReserved
          ? `CONFLICT_RESERVED_PRIMARY_TOKEN(w${wTarget},reservedBy=${otherClaims.map(c => c.arPos).join(',')})`
          : (hasPendingNeighbor
              ? `CONFLICT_OCCUPIED_BY_PENDING_NEIGHBOR(w${wTarget},occupiedBy=${otherClaims.map(c => c.arPos).join(',')})`
              : `CONFLICT_SHARED_TARGET_TOKEN(w${wTarget},claimers=${[p.arPos, ...otherClaims.map(c => c.arPos)].sort((a, b) => a - b).join(',')})`);
        p.status = 'PENDING_REVIEW';
        p.ruleId = conflictTag;
        p.proposed = null;
        p.evidence.postStateConflict = otherClaims;
        changed = true;
      }
    }

    // 3. v1.5 G4 Atomic Group Integrity Check: ZERO partial group acceptance!
    for (const g of g4Groups) {
      if (!g.active) continue;
      const allAlive = g.members.every(m => m.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' || m.status === 'ALREADY_CANONICAL');
      if (!allAlive) {
        g.active = false;
        for (const m of g.members) {
          if (m.status !== 'PENDING_REVIEW') {
            m.status = 'PENDING_REVIEW';
            m.ruleId = 'REJECT_G4_PARTIAL_GROUP_INVALIDATED';
            m.proposed = null;
            m.targetTokenIndex = null;
            changed = true;
          }
        }
      }
    }

    // 4. v1.5 G4 Anchor Survival Check: Every adjacent pair must STILL be separated by a surviving non-G4 anchor!
    const survivingAnchors = rawProposals
      .filter(p => !p._isG4 && (p.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' || p.status === 'ALREADY_CANONICAL') && (p.targetTokenIndex || p.current.origPos))
      .map(p => ({ arPos: p.arPos, w: p.targetTokenIndex || p.current.origPos }));

    for (const g of g4Groups) {
      if (!g.active) continue;
      const M = g.members.length;
      const freshWitnesses = [];
      let anchorsIntact = true;
      for (let i = 0; i < M - 1; i++) {
        const arLo = g.members[i].arPos, arHi = g.members[i + 1].arPos;
        const wLo = g.targetTokens[i], wHi = g.targetTokens[i + 1];
        const sep = survivingAnchors.find(a => a.arPos > arLo && a.arPos < arHi && a.w > wLo && a.w < wHi);
        if (!sep) {
          anchorsIntact = false;
          break;
        }
        freshWitnesses.push({ betweenAr: [arLo, arHi], betweenW: [wLo, wHi], anchor: sep });
      }
      if (!anchorsIntact) {
        g.active = false;
        for (const m of g.members) {
          if (m.status !== 'PENDING_REVIEW') {
            m.status = 'PENDING_REVIEW';
            m.ruleId = 'REJECT_G4_ANCHOR_INVALIDATED';
            m.proposed = null;
            m.targetTokenIndex = null;
            changed = true;
          }
        }
      } else {
        for (const m of g.members) {
          if (m.evidence) m.evidence.bracketWitnesses = freshWitnesses;
        }
      }
    }
  }

  for (const p of rawProposals) {
    delete p._isG4;
  }

  return { verse: name, book, ch, vs, lang, edition, tokenCount: tokens.length, proposals: rawProposals };
}

function loadVerseRows(dbPath, book, ch, vs) {
  const raw = execFileSync(sqlitePath, [dbPath], {
    input: `
      SELECT json_object(
        'id', wm.id,
        'arPos', wm.ar_word_position,
        'arWord', wm.ar_word,
        'strongsId', wm.strongs_id,
        'origWord', wm.orig_word,
        'origSurface', wm.orig_surface,
        'origPos', wm.orig_word_position,
        'origMorph', wm.orig_morphology,
        'morphPos', wm.morph_pos,
        'morphStem', wm.morph_stem,
        'morphTense', wm.morph_tense,
        'morphVoice', wm.morph_voice,
        'morphMood', wm.morph_mood,
        'morphPerson', wm.morph_person,
        'morphNumber', wm.morph_number,
        'morphGender', wm.morph_gender,
        'morphCase', wm.morph_case,
        'verifiedLocator', wm.verified_locator,
        'verifiedSource', wm.verified_source,
        'morphSource', wm.morph_source,
        'relationType', wm.relation_type,
        'grammarNotes', wm.grammar_notes,
        'existingWms', COALESCE((
          SELECT json_group_array(json_object(
            'order', wms.link_order,
            'role', wms.link_role,
            'sid', wms.strongs_id,
            'comp', wms.orig_component,
            'pos', wms.orig_word_position,
            'morph', wms.orig_morphology,
            'msrc', wms.morph_source
          ))
          FROM word_mapping_strongs wms
          WHERE wms.mapping_id = wm.id
          ORDER BY wms.link_order ASC
        ), '[]')
      )
      FROM word_mappings wm
      JOIN verses vr ON wm.verse_id = vr.id
      WHERE vr.book_id = ${book} AND vr.chapter_num = ${ch} AND vr.verse_num = ${vs}
      ORDER BY wm.ar_word_position ASC;
    `,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  }).replace(/\r/g, '').trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(l => {
    const obj = JSON.parse(l);
    const wms = typeof obj.existingWms === 'string' ? JSON.parse(obj.existingWms) : (obj.existingWms || []);
    wms.sort((a, b) => (a.order || 0) - (b.order || 0));
    obj.existingWms = wms;
    obj.secondaryPositions = wms.filter(w => w.order > 1 && w.pos !== null && w.pos !== undefined).map(w => w.pos);
    const prims = wms.filter(w => w.role === 'primary');
    obj.hasCleanPrimaryWms = prims.length === 1 && prims[0].order === 1 &&
      prims[0].sid === obj.strongsId && prims[0].pos === obj.origPos &&
      prims[0].morph === obj.origMorph && prims[0].msrc === obj.morphSource;
    return obj;
  });
}

function buildAtomicWmsSql(mappingId, pr, existingWms) {
  const stmts = [`DELETE FROM word_mapping_strongs WHERE mapping_id = ${sqlVal(mappingId)};`];
  stmts.push(
    `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source) VALUES (${sqlVal(mappingId)}, ${sqlVal(pr.strongsId)}, 1, 'primary', ${sqlVal(pr.origSurface)}, ${pr.origPos}, ${sqlVal(pr.origMorph)}, ${sqlVal(pr.morphSource)});`
  );
  // Preserve ALL non-primary (secondary) components atomically, renumbered sequentially 2..N
  const secondaries = (existingWms || []).filter(w => w.role !== 'primary');
  let order = 2;
  for (const sec of secondaries) {
    stmts.push(
      `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source) VALUES (${sqlVal(mappingId)}, ${sqlVal(sec.sid)}, ${order}, ${sqlVal(sec.role || 'secondary')}, ${sqlVal(sec.comp)}, ${sec.pos === null || sec.pos === undefined ? 'NULL' : sec.pos}, ${sqlVal(sec.morph)}, ${sqlVal(sec.msrc)});`
    );
    order++;
  }
  return stmts;
}

function applyProposalsToIsolatedDb(srcDbPath, outDbPath, verseResults, diffOutPath) {
  if (path.resolve(srcDbPath) === path.resolve(outDbPath)) {
    throw new Error('SAFETY ABORT: --out-db must be an isolated copy, NEVER the source/production DB!');
  }
  fs.mkdirSync(path.dirname(outDbPath), { recursive: true });
  fs.copyFileSync(srcDbPath, outDbPath);

  const sql = ['BEGIN TRANSACTION;'];
  const diffLines = [];

  for (const vr of verseResults) {
    for (const p of vr.proposals) {
      if (p.status !== 'AUTO_PROPOSED_HIGH_CONFIDENCE' || !p.proposed) continue;
      const pr = p.proposed;
      sql.push(`
        UPDATE word_mappings
        SET strongs_id = ${sqlVal(pr.strongsId)},
            orig_word = ${sqlVal(pr.origWord)},
            orig_surface = ${sqlVal(pr.origSurface)},
            orig_word_position = ${pr.origPos},
            orig_morphology = ${sqlVal(pr.origMorph)},
            morph_pos = ${sqlVal(pr.morphPos)},
            morph_stem = ${sqlVal(pr.morphStem)},
            morph_tense = ${sqlVal(pr.morphTense)},
            morph_voice = ${sqlVal(pr.morphVoice)},
            morph_mood = ${sqlVal(pr.morphMood)},
            morph_person = ${sqlVal(pr.morphPerson)},
            morph_number = ${sqlVal(pr.morphNumber)},
            morph_gender = ${sqlVal(pr.morphGender)},
            morph_case = ${sqlVal(pr.morphCase)},
            verified_locator = ${sqlVal(pr.verifiedLocator)},
            verified_source = ${sqlVal(pr.verifiedSource)},
            morph_source = ${sqlVal(pr.morphSource)}
        WHERE id = ${sqlVal(p.id)};
      `.trim());

      sql.push(...buildAtomicWmsSql(p.id, pr, p.existingWms));

      diffLines.push(JSON.stringify({
        verse: vr.verse,
        lang: vr.lang,
        mappingId: p.id,
        arPos: p.arPos,
        arWord: p.arWord,
        ruleId: p.ruleId,
        before: p.current,
        after: pr,
        evidence: p.evidence
      }));
    }
  }

  sql.push('COMMIT;');
  const tmpSql = path.join(repoRoot, 'scratch/tmp_general_engine_apply.sql');
  fs.mkdirSync(path.dirname(tmpSql), { recursive: true });
  fs.writeFileSync(tmpSql, sql.join('\n') + '\n', 'utf8');

  execFileSync(sqlitePath, [outDbPath], { input: `.read ${tmpSql.replace(/\\/g, '/')}\n`, encoding: 'utf8' });
  const integrity = execFileSync(sqlitePath, [outDbPath], { input: 'PRAGMA integrity_check;', encoding: 'utf8' }).trim();
  if (integrity !== 'ok') throw new Error(`Isolated DB integrity_check failed: ${integrity}`);

  if (diffOutPath) {
    fs.mkdirSync(path.dirname(diffOutPath), { recursive: true });
    fs.writeFileSync(diffOutPath, diffLines.join('\n') + (diffLines.length ? '\n' : ''), 'utf8');
  }
  return { modifiedCount: diffLines.length, outDbSha256: sha256File(outDbPath) };
}

module.exports = {
  evaluateVerse,
  loadVerseRows,
  loadStrongsLexicon,
  buildAtomicWmsSql,
  applyProposalsToIsolatedDb,
  loadProtectedAdjudicatedVerses,
  isGreekStrongsLemmaEquivalent,
  isGreekPureOrthographicVariant,
  trGrammarMatchesSblMorph
};
