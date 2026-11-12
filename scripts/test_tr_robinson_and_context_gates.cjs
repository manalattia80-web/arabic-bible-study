/**
 * test_tr_robinson_and_context_gates.cjs
 * Pre-repair gate verification (Rules 3 & 4):
 *   A. Scrivener TR Robinson morphology verifier: positive controls + negative field mutations
 *      (wrong pos, tense, voice, mood, person, gender, number, case, spurious extra fields, literal mismatch)
 *      even when Strong's ID, surface, and locator are 100% valid.
 *   B. Repeated-clause anti-collision & monotonic context anchor gate for Mark 12:30:
 *      rejects moving a repeated phrase component (#7,#8,#13,#14) back to an earlier identical-word/morph clause.
 */
const { verifyTrDerivedMorphology } = require('./robinson_tr_helper.cjs');

function validateRepeatedClauseContext(rows) {
  const errors = [];
  const primarySeen = new Map();
  let lastClausePos = 0;
  for (const r of rows) {
    if (r.isSyntactic) continue;
    if (primarySeen.has(r.origPos)) {
      const prev = primarySeen.get(r.origPos);
      const isDocumentedSharedUnit =
        r.relationType === 'compound_phrase' &&
        prev.relationType === 'compound_phrase' &&
        prev.strongsId && r.strongsId === prev.strongsId &&
        r.arPos === prev.arPos + 1 &&
        Boolean(r.grammarNotes && r.grammarNotes.trim().length > 0) &&
        Boolean(prev.grammarNotes && prev.grammarNotes.trim().length > 0);
      if (!isDocumentedSharedUnit) {
        errors.push(`Duplicate primary token collision: arPos #${r.arPos} ('${r.arWord}') reuses w${r.origPos} already claimed by #${prev.arPos}`);
      } else {
        primarySeen.set(r.origPos, r);
      }
    } else {
      primarySeen.set(r.origPos, r);
    }
    if (r.enforceMonotonic !== false && r.origPos <= lastClausePos) {
      errors.push(`Monotonic repeated-clause violation: arPos #${r.arPos} ('${r.arWord}') points backward to w${r.origPos} <= prior anchor w${lastClausePos}`);
    }
    lastClausePos = r.origPos;
  }
  return errors;
}

console.log('========================================================================');
console.log('  TR ROBINSON MORPHOLOGY & REPEATED-CLAUSE CONTEXT NEGATIVE GATE SUITE  ');
console.log('========================================================================\n');

let passed = 0, total = 0;
function check(name, expectedNull, err) {
  total++;
  const ok = expectedNull ? (err === null) : (err !== null);
  if (ok) {
    passed++;
    console.log(`  ✓ [PASS] ${name}${err ? ' -> rejected: ' + err : ''}`);
  } else {
    console.error(`  ✗ [FAIL] ${name} -> got: ${err}`);
  }
}

// --- A. Scrivener TR Robinson Morphology Controls & Negative Mutations ---
console.log('▶ PART A: Scrivener TR Robinson Literal + 8-Field Strict Validation');
const validMark30 = { morphPos: 'demonstrative', morphStem: null, morphTense: null, morphVoice: null, morphMood: null, morphPerson: null, morphNumber: 'singular', morphGender: 'feminine', morphCase: 'nominative' };
const validMark31 = { morphPos: 'adjective', morphStem: null, morphTense: null, morphVoice: null, morphMood: null, morphPerson: null, morphNumber: 'singular', morphGender: 'feminine', morphCase: 'nominative' };
const validMark32 = { morphPos: 'noun', morphStem: null, morphTense: null, morphVoice: null, morphMood: null, morphPerson: null, morphNumber: 'singular', morphGender: 'feminine', morphCase: 'nominative' };
const validVerb   = { morphPos: 'verb', morphStem: null, morphTense: 'future', morphVoice: 'active', morphMood: 'indicative', morphPerson: '2', morphNumber: 'singular', morphGender: null, morphCase: null };
const validPart   = { morphPos: 'verb', morphStem: null, morphTense: 'present', morphVoice: 'active', morphMood: 'participle', morphPerson: null, morphNumber: 'singular', morphGender: 'feminine', morphCase: 'accusative' };

check('TR positive D-NSF (αὕτη)', true, verifyTrDerivedMorphology('D-NSF', 'D-NSF', validMark30));
check('TR positive A-NSF-S (πρώτη)', true, verifyTrDerivedMorphology('A-NSF-S', 'A-NSF-S', validMark31));
check('TR positive N-NSF (ἐντολή)', true, verifyTrDerivedMorphology('N-NSF', 'N-NSF', validMark32));
check('TR positive V-FAI-2S (ἀγαπήσεις)', true, verifyTrDerivedMorphology('V-FAI-2S', 'V-FAI-2S', validVerb));
check('TR positive V-PAP-ASF', true, verifyTrDerivedMorphology('V-PAP-ASF', 'V-PAP-ASF', validPart));

// Negative mutations (valid Strong's/locator/surface, corrupted Robinson code or derived fields)
check('TR negative: missing orig_morphology', false, verifyTrDerivedMorphology('', 'D-NSF', validMark30));
check('TR negative: literal Robinson mismatch (D-GSF != D-NSF)', false, verifyTrDerivedMorphology('D-GSF', 'D-NSF', validMark30));
check('TR negative: wrong morph_pos (noun on D-NSF)', false, verifyTrDerivedMorphology('D-NSF', 'D-NSF', { ...validMark30, morphPos: 'noun' }));
check('TR negative: wrong morph_case (accusative on D-NSF)', false, verifyTrDerivedMorphology('D-NSF', 'D-NSF', { ...validMark30, morphCase: 'accusative' }));
check('TR negative: wrong morph_number (plural on N-NSF)', false, verifyTrDerivedMorphology('N-NSF', 'N-NSF', { ...validMark32, morphNumber: 'plural' }));
check('TR negative: wrong morph_gender (masculine on A-NSF-S)', false, verifyTrDerivedMorphology('A-NSF-S', 'A-NSF-S', { ...validMark31, morphGender: 'masculine' }));
check('TR negative: wrong morph_tense (present on V-FAI-2S)', false, verifyTrDerivedMorphology('V-FAI-2S', 'V-FAI-2S', { ...validVerb, morphTense: 'present' }));
check('TR negative: wrong morph_voice (passive on V-FAI-2S)', false, verifyTrDerivedMorphology('V-FAI-2S', 'V-FAI-2S', { ...validVerb, morphVoice: 'passive' }));
check('TR negative: wrong morph_mood (subjunctive on V-FAI-2S)', false, verifyTrDerivedMorphology('V-FAI-2S', 'V-FAI-2S', { ...validVerb, morphMood: 'subjunctive' }));
check('TR negative: wrong morph_person (3 on V-FAI-2S)', false, verifyTrDerivedMorphology('V-FAI-2S', 'V-FAI-2S', { ...validVerb, morphPerson: '3' }));
check('TR negative: spurious morph_tense on N-NSF', false, verifyTrDerivedMorphology('N-NSF', 'N-NSF', { ...validMark32, morphTense: 'present' }));
check('TR negative: spurious morph_person on V-PAP-ASF', false, verifyTrDerivedMorphology('V-PAP-ASF', 'V-PAP-ASF', { ...validPart, morphPerson: '3' }));
check('TR negative: spurious morph_case on finite V-FAI-2S', false, verifyTrDerivedMorphology('V-FAI-2S', 'V-FAI-2S', { ...validVerb, morphCase: 'nominative' }));
check('TR negative: spurious Semitic morph_stem on Greek TR', false, verifyTrDerivedMorphology('N-NSF', 'N-NSF', { ...validMark32, morphStem: 'qal' }));

// --- B. Mark 12:30 Repeated-Clause Anti-Collision & Context Order ---
console.log('\n▶ PART B: Mark 12:30 Repeated-Clause Context & Position Gate');
const cleanMark1230 = [
  { arPos: 4,  arWord: 'مِنْ',    origPos: 7 },
  { arPos: 5,  arWord: 'كُلِّ',   origPos: 8 },
  { arPos: 6,  arWord: 'قَلْبِكَ', origPos: 10 },
  { arPos: 7,  arWord: 'وَمِنْ',  origPos: 13 },
  { arPos: 8,  arWord: 'كُلِّ',   origPos: 14 },
  { arPos: 9,  arWord: 'نَفْسِكَ', origPos: 16 },
  { arPos: 10, arWord: 'وَمِنْ',  origPos: 19 },
  { arPos: 11, arWord: 'كُلِّ',   origPos: 20 },
  { arPos: 12, arWord: 'فِكْرِكَ', origPos: 22 },
  { arPos: 13, arWord: 'وَمِنْ',  origPos: 25 },
  { arPos: 14, arWord: 'كُلِّ',   origPos: 26 },
  { arPos: 15, arWord: 'قُدْرَتِكَ', origPos: 28 }
];
check('Mark 12:30 clean monotonic repeated clauses (w7..w28)', true, validateRepeatedClauseContext(cleanMark1230).join('; ') || null);

for (const [label, arPos, badOrig] of [
  ['#7 (وَمِنْ) reverted to Clause 1 w7 (same word & morph)', 7, 7],
  ['#8 (كُلِّ) reverted to Clause 1 w8 (same word & morph)', 8, 8],
  ['#13 (وَمِنْ) reverted to Clause 2 w13 (same word & morph)', 13, 13],
  ['#14 (كُلِّ) reverted to Clause 2 w14 (same word & morph)', 14, 14]
]) {
  const mutated = cleanMark1230.map(r => (r.arPos === arPos ? { ...r, origPos: badOrig } : r));
  check(`Mark 12:30 negative: ${label}`, false, validateRepeatedClauseContext(mutated).join('; ') || null);
}

// --- C. Documented Shared-Link Unit Positive Acceptance & Undocumented Rejection (1Thess 5:16) ---
console.log('\n▶ PART C: Shared-Link Unit Acceptance (1Thess 5:16 كُلَّ حِينٍ -> G3842 @ w1)');
const sharedNote = 'وحدة ربط مشتركة (Shared phrase): «كُلَّ حِينٍ» تقابل معًا πάντοτε (G3842 @ w1)';
const clean1Thess516Shared = [
  { arPos: 1, arWord: 'افْرَحُوا', origPos: 2, strongsId: 'G5463', relationType: null, grammarNotes: '', enforceMonotonic: false },
  { arPos: 2, arWord: 'كُلَّ',    origPos: 1, strongsId: 'G3842', relationType: 'compound_phrase', grammarNotes: sharedNote, enforceMonotonic: false },
  { arPos: 3, arWord: 'حِينٍ',   origPos: 1, strongsId: 'G3842', relationType: 'compound_phrase', grammarNotes: sharedNote, enforceMonotonic: false }
];
check('1Thess 5:16 positive: documented shared-link unit كُلَّ حِينٍ -> G3842 @ w1', true, validateRepeatedClauseContext(clean1Thess516Shared).join('; ') || null);

const undocumentedShared = clean1Thess516Shared.map(r => (r.arPos === 3 ? { ...r, relationType: null, grammarNotes: '' } : r));
check('1Thess 5:16 negative: undocumented duplicate primary w1 rejected', false, validateRepeatedClauseContext(undocumentedShared).join('; ') || null);

console.log(`\nSUMMARY: ${passed}/${total} Robinson TR & Repeated-Clause Context Gate assertions passed.`);
if (passed !== total) process.exit(1);
