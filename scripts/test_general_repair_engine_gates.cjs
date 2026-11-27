/**
 * scripts/test_general_repair_engine_gates.cjs
 *
 * Mandatory CI Verification & Negative Gate Suite for Whole-Verse General Repair Engine (v1.2):
 *   1. Duplicate-occurrence trap: Zech 12:12 #11 (לְבָד x5) -> strictly PENDING_REVIEW.
 *   2. Duplicate-occurrence trap: Eph 1:21 #11 & #16 (ἐν x2) -> strictly PENDING_REVIEW.
 *   3. Peer competing claims on the same unique token -> BOTH demoted to PENDING_REVIEW.
 *   4. Adversarial Case 1: Wrong strongs_id 'G1' injected on Eph 1:21 #1 («فَوْقَ») -> strictly REJECTED.
 *   5. Adversarial Case 2: Wrong orig_word 'בַּיִת' injected on Exod 15:2 («صار», H1961) -> strictly REJECTED.
 *   6. Adversarial Case 3: Rom 16:16 #5 («بِقُبْلَةٍ») redirected to w2 (compound_phrase #2,#4) -> strictly REJECTED.
 *   7. Secondary-component reservation: Redirecting Rom 16:16 #6 onto w3 (secondary of #5) -> strictly REJECTED.
 *   8. Untouched PENDING_REVIEW neighbor collision guard: Relocating a row onto a token occupied by an untouched
 *      PENDING_REVIEW neighbor -> strictly REJECTED (CONFLICT_OCCUPIED_BY_PENDING_NEIGHBOR).
 *   9. Multiple distinct existing primaries guard: Row with 2 distinct primary components -> strictly PENDING_REVIEW (never deleted).
 *  10-14. Applied-Output CI Verification on Isolated DB Copy:
 *      - Protected Adjudicated Registry SHA-256 fingerprint bitwise identical before & after.
 *      - multiple_primary_components = 0.
 *      - B20 (audit_20_verses_311_units.cjs) = 311/311.
 *      - automated_database_audit.cjs = 0 failures.
 *      - R1 = 253/253, R2 = 255/255, R3 = 233/234.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadAllSources } = require('./full_66_books_audit_helpers.cjs');
const {
  evaluateVerse,
  loadVerseRows,
  loadStrongsLexicon,
  applyProposalsToIsolatedDb,
  isGreekStrongsLemmaEquivalent,
  isGreekPureOrthographicVariant,
  trGrammarMatchesSblMorph
} = require('./whole_verse_general_repair_engine.cjs');
const {
  loadProtectedAdjudicatedVerses,
  computeProtectedRegistryFingerprint
} = require('./protected_adjudicated_registry.cjs');

const repoRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const prodDb = path.join(repoRoot, 'mobile/assets/bible_study.db');

let passed = 0;
let failed = 0;
function assert(cond, msg, detail = '') {
  if (cond) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}${detail ? ' -> ' + detail : ''}`);
    failed++;
  }
}

console.log('=== RUNNING WHOLE-VERSE GENERAL REPAIR ENGINE v1.2 GATES ===\n');

const sources = loadAllSources();
const strongsLexicon = loadStrongsLexicon(prodDb);
const protectedVerseKeys = loadProtectedAdjudicatedVerses();

// 1. Negative Gate: Zech 12:12 duplicate occurrence (לְבָד x5)
const zechRows = loadVerseRows(prodDb, 38, 12, 12).map(r => r.arPos === 11 ? { ...r, relationType: null, grammarNotes: null } : r);
const zechRes = evaluateVerse({ book: 38, ch: 12, vs: 12, lang: 'hebrew', name: 'Zech 12:12' }, zechRows, sources, strongsLexicon);
const zech11 = zechRes.proposals.find(p => p.arPos === 11);
assert(
  Boolean(zech11 && zech11.status === 'PENDING_REVIEW' && zech11.alternatives.length === 5 && zech11.ruleId.includes('REJECT_MULTIPLE_BOTH_MATCHES(count=5)')),
  'Negative Gate 1: Zech 12:12 #11 («حِدَتِهَا», לְבָד) strictly demoted to PENDING_REVIEW with all 5 competing occurrences listed',
  JSON.stringify(zech11 && { status: zech11.status, ruleId: zech11.ruleId, alts: zech11.alternatives.length })
);

// 2A. Negative Gate: Unbracketed Eph 1:21 duplicate occurrence (ἐν x2: w16 & w22 with NO separating anchors) -> strictly PENDING_REVIEW
const ephRows = loadVerseRows(prodDb, 49, 1, 21).map(r => ({ ...r, grammarNotes: null }));
const ephUnbracketedRows = ephRows.filter(r => r.arPos === 11 || r.arPos === 16);
const ephUnbRes = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21 (unbracketed)' }, ephUnbracketedRows, sources, strongsLexicon);
const eph11Unb = ephUnbRes.proposals.find(p => p.arPos === 11);
const eph16Unb = ephUnbRes.proposals.find(p => p.arPos === 16);
assert(
  Boolean(eph11Unb && eph11Unb.status === 'PENDING_REVIEW' && eph16Unb && eph16Unb.status === 'PENDING_REVIEW' && eph16Unb.alternatives.length === 2),
  'Negative Gate 2A: Unbracketed Eph 1:21 #11 & #16 («فِي», ἐν @ w16/w22 without separating anchors) strictly demoted to PENDING_REVIEW',
  JSON.stringify({ eph11Unb: eph11Unb && eph11Unb.ruleId, eph16Unb: eph16Unb && eph16Unb.ruleId })
);

// 2B. Negative Gate (v1.5 Greek Prep Excluded from G4): Even when bracketed, Eph 1:21 #11/#16 (G1722 ἐν, P-) is excluded from G4
const ephDisplaced16 = ephRows.map(r => r.arPos === 16 ? { ...r, origPos: 16, verifiedLocator: 'SBLGNT:B49.C1.V21.w16', hasCleanPrimaryWms: false } : r);
const ephBrackRes = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21 (bracketed G4 Greek prep)' }, ephDisplaced16, sources, strongsLexicon);
const eph11Br = ephBrackRes.proposals.find(p => p.arPos === 11);
const eph16Br = ephBrackRes.proposals.find(p => p.arPos === 16);
assert(
  Boolean(
    eph11Br && eph11Br.status === 'PENDING_REVIEW' && eph11Br.ruleId.includes('REJECT_G4_GREEK_PREP_EXCLUDED') &&
    eph16Br && eph16Br.status === 'PENDING_REVIEW' && eph16Br.ruleId.includes('REJECT_G4_GREEK_PREP_EXCLUDED')
  ),
  'Negative Gate 2B (v1.5): Standalone Greek preposition Eph 1:21 #11/#16 (G1722 ἐν) is strictly excluded from RULE_G4',
  JSON.stringify({ eph11Br: eph11Br && { status: eph11Br.status, ruleId: eph11Br.ruleId }, eph16Br: eph16Br && { status: eph16Br.status, ruleId: eph16Br.ruleId } })
);

// 2C. Positive Gate (v1.5 Content-Word G4): Bracketed John 12:34 #20/#25 («الإِنْسَانِ», G444 ἀνθρώπου @ w28/w35) IS ACCEPTED!
const john1234Rows = loadVerseRows(prodDb, 43, 12, 34).map(r =>
  (r.arPos === 20 || r.arPos === 25)
    ? { ...r, origPos: r.arPos, verifiedLocator: `SBLGNT:B43.C12.V34.w${r.arPos}`, verifiedSource: 'manual_review', hasCleanPrimaryWms: false }
    : r
);
const john1234Res = evaluateVerse({ book: 43, ch: 12, vs: 34, lang: 'greek', name: 'John 12:34' }, john1234Rows, sources, strongsLexicon);
const j20 = john1234Res.proposals.find(p => p.arPos === 20);
const j25 = john1234Res.proposals.find(p => p.arPos === 25);
assert(
  Boolean(
    j20 && j20.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' && j20.ruleId === 'RULE_G4_BRACKETED_DUPLICATE_BIJECTION' && j20.proposed && j20.proposed.origPos === 28 &&
    j25 && j25.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' && j25.ruleId === 'RULE_G4_BRACKETED_DUPLICATE_BIJECTION' && j25.proposed && j25.proposed.origPos === 35
  ),
  'Positive Gate 2C (v1.5 G4): Bracketed content-word John 12:34 #20/#25 («الإِنْسَانِ» -> G444@w28,w35) is ACCEPTED',
  JSON.stringify({ j20: j20 && { status: j20.status, ruleId: j20.ruleId, pos: j20.proposed && j20.proposed.origPos }, j25: j25 && { status: j25.status, ruleId: j25.ruleId, pos: j25.proposed && j25.proposed.origPos } })
);

// 3. Negative Gate: Peer competing claims on the same unique token
const syntheticRows = [
  { id: 'syn1', arPos: 1, arWord: 'أ', strongsId: 'G5231', origWord: 'ὑπεράνω', origSurface: 'ὑπεράνω', origPos: 9, origMorph: null, morphPos: null, verifiedLocator: 'SBLGNT:B49.C1.V21.w9', verifiedSource: 'morphgnt_sblgnt', morphSource: 'morphgnt_sblgnt', relationType: null, grammarNotes: null, existingWms: [], secondaryPositions: [], hasCleanPrimaryWms: false },
  { id: 'syn2', arPos: 2, arWord: 'ب', strongsId: 'G5231', origWord: 'ὑπεράνω', origSurface: 'ὑπεράνω', origPos: 10, origMorph: null, morphPos: null, verifiedLocator: 'SBLGNT:B49.C1.V21.w10', verifiedSource: 'morphgnt_sblgnt', morphSource: 'morphgnt_sblgnt', relationType: null, grammarNotes: null, existingWms: [], secondaryPositions: [], hasCleanPrimaryWms: false }
];
const synRes = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21 (synthetic)' }, syntheticRows, sources, strongsLexicon);
assert(
  synRes.proposals.every(p => p.status === 'PENDING_REVIEW' && p.ruleId.includes('CONFLICT_SHARED_TARGET_TOKEN')),
  'Negative Gate 3: Competing claims on the same unique token (w1 ὑπεράνω) demote BOTH rows to PENDING_REVIEW',
  JSON.stringify(synRes.proposals.map(p => ({ arPos: p.arPos, status: p.status, ruleId: p.ruleId })))
);

// 4. Negative Gate (Adversarial Case 1): Wrong strongs_id 'G1' on Eph 1:21 #1 «فَوْقَ»
const ephBadG1Rows = ephRows.map(r => r.arPos === 1 ? { ...r, strongsId: 'G1', hasCleanPrimaryWms: false } : r);
const ephBadG1Res = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21 (bad G1)' }, ephBadG1Rows, sources, strongsLexicon);
const eph1Bad = ephBadG1Res.proposals.find(p => p.arPos === 1);
assert(
  Boolean(eph1Bad && eph1Bad.status === 'PENDING_REVIEW' && eph1Bad.ruleId.includes('REJECT_STORED_STRONGS_LEXICON_MISMATCH') && eph1Bad.proposed === null),
  'Negative Gate 4: Injecting wrong strongs_id G1 on Eph 1:21 #1 («فَوْقَ») is strictly REJECTED',
  JSON.stringify(eph1Bad && { status: eph1Bad.status, ruleId: eph1Bad.ruleId })
);

// 5. Negative Gate (Adversarial Case 2): Wrong orig_word 'בַּיִת' on Exod 15:2 («صار», H1961)
const exod152Rows = loadVerseRows(prodDb, 2, 15, 2).map(r => ({ ...r, grammarNotes: null }));
const saraRow = exod152Rows.find(r => r.strongsId === 'H1961' || (r.arWord && (r.arWord.includes('صَارَ') || r.arWord.includes('صار'))));
const exodBadLemmaRows = exod152Rows.map(r => (saraRow && r.arPos === saraRow.arPos) ? { ...r, strongsId: 'H1961', origWord: 'בַּיִת', hasCleanPrimaryWms: false } : r);
const exodBadRes = evaluateVerse({ book: 2, ch: 15, vs: 2, lang: 'hebrew', name: 'Exod 15:2 (bad lemma)' }, exodBadLemmaRows, sources, strongsLexicon);
const saraProp = saraRow ? exodBadRes.proposals.find(p => p.arPos === saraRow.arPos) : null;
assert(
  Boolean(saraProp && saraProp.status === 'PENDING_REVIEW' && saraProp.ruleId.includes('REJECT_STORED_LEMMA_CONFLICTS_WITH_LEXICON') && saraProp.proposed === null),
  'Negative Gate 5: Injecting wrong orig_word «בַּיִת» on Exod 15:2 («صار», H1961) is strictly REJECTED',
  JSON.stringify(saraProp && { status: saraProp.status, ruleId: saraProp.ruleId })
);

// 6. Negative Gate (Adversarial Case 3): Rom 16:16 #5 redirected to w2 (reserved by compound_phrase #2 & #4)
const romRows = loadVerseRows(prodDb, 45, 16, 16).map(r => r.arPos === 5 || r.arPos === 6 ? { ...r, grammarNotes: null } : r);
const romBad5Rows = romRows.map(r => r.arPos === 5 ? {
  ...r, strongsId: 'G240', origWord: 'ἀλλήλων', origSurface: 'ἀλλήλους', origPos: 2,
  verifiedLocator: 'SBLGNT:B45.C16.V16.w2', existingWms: [], secondaryPositions: [], hasCleanPrimaryWms: false
} : r);
const romBad5Res = evaluateVerse({ book: 45, ch: 16, vs: 16, lang: 'greek', name: 'Rom 16:16 (collision w2)' }, romBad5Rows, sources, strongsLexicon);
const rom5Prop = romBad5Res.proposals.find(p => p.arPos === 5);
assert(
  Boolean(rom5Prop && rom5Prop.status === 'PENDING_REVIEW' && rom5Prop.ruleId.includes('CONFLICT_RESERVED_PRIMARY_TOKEN(w2,reservedBy=2,4)') && rom5Prop.proposed === null),
  'Negative Gate 6: Redirecting Rom 16:16 #5 («بِقُبْلَةٍ») onto compound_phrase w2 (#2,#4) is strictly REJECTED',
  JSON.stringify(rom5Prop && { status: rom5Prop.status, ruleId: rom5Prop.ruleId })
);

// 7. Negative Gate: Redirecting Rom 16:16 #6 onto w3 (secondary of #5)
const romBadSecRows = romRows.map(r => r.arPos === 6 ? {
  ...r, strongsId: 'G1722', origWord: 'ἐν', origSurface: 'ἐν', origPos: 3,
  verifiedLocator: 'SBLGNT:B45.C16.V16.w3', hasCleanPrimaryWms: false
} : r);
const romBadSecRes = evaluateVerse({ book: 45, ch: 16, vs: 16, lang: 'greek', name: 'Rom 16:16 (collision sec w3)' }, romBadSecRows, sources, strongsLexicon);
const rom6Prop = romBadSecRes.proposals.find(p => p.arPos === 6);
assert(
  Boolean(rom6Prop && rom6Prop.status === 'PENDING_REVIEW' && rom6Prop.ruleId.includes('CONFLICT_RESERVED_SECONDARY_TOKEN(w3,reservedBy=5)') && rom6Prop.proposed === null),
  'Negative Gate 7: Redirecting Rom 16:16 #6 onto secondary token w3 (owned by #5) is strictly REJECTED',
  JSON.stringify(rom6Prop && { status: rom6Prop.status, ruleId: rom6Prop.ruleId })
);

// 8. Negative Gate: Relocating onto a token occupied by an untouched PENDING_REVIEW neighbor -> MUST demote!
const pendingNeighborRows = [
  { id: 'pn1', arPos: 1, arWord: 'أ', strongsId: 'G5231', origWord: 'ὑπεράνω', origSurface: 'ὑπεράνω', origPos: 9, origMorph: null, morphPos: null, verifiedLocator: 'SBLGNT:B49.C1.V21.w9', verifiedSource: 'morphgnt_sblgnt', morphSource: 'morphgnt_sblgnt', relationType: null, grammarNotes: null, existingWms: [], secondaryPositions: [], hasCleanPrimaryWms: false },
  { id: 'pn2', arPos: 2, arWord: 'جار', strongsId: 'G9999', origWord: 'unknown', origSurface: 'unknown', origPos: 1, origMorph: null, morphPos: null, verifiedLocator: 'SBLGNT:B49.C1.V21.w1', verifiedSource: 'morphgnt_sblgnt', morphSource: 'morphgnt_sblgnt', relationType: null, grammarNotes: null, existingWms: [], secondaryPositions: [], hasCleanPrimaryWms: false }
];
const pnRes = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21 (pending neighbor)' }, pendingNeighborRows, sources, strongsLexicon);
const pn1 = pnRes.proposals.find(p => p.arPos === 1);
assert(
  Boolean(pn1 && pn1.status === 'PENDING_REVIEW' && pn1.ruleId.includes('CONFLICT_OCCUPIED_BY_PENDING_NEIGHBOR(w1,occupiedBy=2)') && pn1.proposed === null),
  'Negative Gate 8: Relocating onto w1 occupied by untouched PENDING_REVIEW neighbor #2 is strictly REJECTED (0 sourceLocator regressions)',
  JSON.stringify(pn1 && { status: pn1.status, ruleId: pn1.ruleId })
);

// 9. Negative Gate: Row with 2 distinct existing primary components -> strictly PENDING_REVIEW (never deletes distinct link)
const multiPrimRows = [
  {
    id: 'mp1', arPos: 1, arWord: 'فَوْقَ', strongsId: 'G5231', origWord: 'ὑπεράνω', origSurface: 'ὑπεράνω', origPos: 1,
    origMorph: null, morphPos: null, verifiedLocator: 'SBLGNT:B49.C1.V21.w1', verifiedSource: 'morphgnt_sblgnt', morphSource: 'morphgnt_sblgnt',
    relationType: null, grammarNotes: null, secondaryPositions: [], hasCleanPrimaryWms: false,
    existingWms: [
      { order: 1, role: 'primary', sid: 'G5231', comp: 'ὑπεράνω', pos: 1, morph: 'P- --------', msrc: 'morphgnt_sblgnt' },
      { order: 2, role: 'primary', sid: 'G3956', comp: 'πάσης', pos: 2, morph: 'A- ----GSF-', msrc: 'morphgnt_sblgnt' }
    ]
  }
];
const mpRes = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21 (multi-primary)' }, multiPrimRows, sources, strongsLexicon);
const mp1 = mpRes.proposals.find(p => p.arPos === 1);
assert(
  Boolean(mp1 && mp1.status === 'PENDING_REVIEW' && mp1.ruleId.includes('CONFLICT_MULTIPLE_EXISTING_PRIMARIES')),
  'Negative Gate 9: Row with 2 distinct primary components is strictly demoted to PENDING_REVIEW without deleting links',
  JSON.stringify(mp1 && { status: mp1.status, ruleId: mp1.ruleId })
);

// 10. Negative Gate (Contextual Guard — Gen 24:15 #2 «كَانَ» -> H1931 הוּא HPp3ms pronoun): MUST REJECT!
const gen2415Rows = loadVerseRows(prodDb, 1, 24, 15);
const gen2415Res = evaluateVerse({ book: 1, ch: 24, vs: 15, lang: 'hebrew', name: 'Gen 24:15' }, gen2415Rows, sources, strongsLexicon);
const gen2415_2 = gen2415Res.proposals.find(p => p.arPos === 2);
assert(
  Boolean(gen2415_2 && gen2415_2.status === 'PENDING_REVIEW' && gen2415_2.ruleId.includes('REJECT_ARABIC_COPULA_NON_VERB_SOURCE') && gen2415_2.proposed === null),
  'Negative Gate 10: Gen 24:15 #2 («كَانَ» -> H1931 הוּא HPp3ms pronoun) is strictly REJECTED despite valid source surface & morph',
  JSON.stringify(gen2415_2 && { status: gen2415_2.status, ruleId: gen2415_2.ruleId })
);

// 11. Negative Gate (Contextual Guard — Dan 6:6 #11 «أَيُّهَا» -> H5922 עַל AR preposition): MUST REJECT!
const dan66Rows = loadVerseRows(prodDb, 27, 6, 6);
const dan66Res = evaluateVerse({ book: 27, ch: 6, vs: 6, lang: 'aramaic', name: 'Dan 6:6' }, dan66Rows, sources, strongsLexicon);
const dan66_11 = dan66Res.proposals.find(p => p.arPos === 11);
assert(
  Boolean(dan66_11 && dan66_11.status === 'PENDING_REVIEW' && dan66_11.ruleId.includes('REJECT_ARABIC_VOCATIVE_SOURCE_MISMATCH') && dan66_11.proposed === null),
  'Negative Gate 11: Dan 6:6 #11 («أَيُّهَا» -> H5922 עַל AR preposition) is strictly REJECTED despite valid source surface & morph',
  JSON.stringify(dan66_11 && { status: dan66_11.status, ruleId: dan66_11.ruleId })
);

// 12. Negative Gate (Contextual Guard — Dan 5:22 #9 «أَنَّكَ» -> H1836 דְּנָ֖ה APdxms demonstrative): MUST REJECT!
const dan522Rows = loadVerseRows(prodDb, 27, 5, 22);
const dan522Res = evaluateVerse({ book: 27, ch: 5, vs: 22, lang: 'aramaic', name: 'Dan 5:22' }, dan522Rows, sources, strongsLexicon);
const dan522_9 = dan522Res.proposals.find(p => p.arPos === 9);
assert(
  Boolean(dan522_9 && dan522_9.status === 'PENDING_REVIEW' && dan522_9.ruleId.includes('REJECT_ARABIC_COMPLEMENTIZER_SOURCE_MISMATCH') && dan522_9.proposed === null),
  'Negative Gate 12: Dan 5:22 #9 («أَنَّكَ» -> H1836 דְּנָ֖ה APdxms demonstrative) is strictly REJECTED despite valid source surface & morph',
  JSON.stringify(dan522_9 && { status: dan522_9.status, ruleId: dan522_9.ruleId })
);

// 13. Positive Gate: Valid Arabic copula verb («فَكَانَتَا» -> H1961 וַתִּהְיֶ֛יןָ HC/Vqw3fp verb in 1Sam 25:43) is ACCEPTED!
const sam2543Rows = loadVerseRows(prodDb, 9, 25, 43).map(r => ({ ...r, grammarNotes: null }));
const sam2543Res = evaluateVerse({ book: 9, ch: 25, vs: 43, lang: 'hebrew', name: '1Sam 25:43' }, sam2543Rows, sources, strongsLexicon);
const samWere = sam2543Res.proposals.find(p => p.arWord && p.arWord.includes('فَكَانَتَا'));
assert(
  Boolean(samWere && (samWere.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' || samWere.status === 'ALREADY_CANONICAL') && samWere.proposed && samWere.proposed.strongsId === 'H1961' && samWere.proposed.morphPos === 'verb'),
  'Positive Gate 13: Valid Arabic copula verb 1Sam 25:43 («فَكَانَتَا» -> H1961 verb) is ACCEPTED',
  JSON.stringify(samWere && { status: samWere.status, ruleId: samWere.ruleId, sid: samWere.proposed && samWere.proposed.strongsId })
);

// 14. Positive Gate: Valid RULE_G1 relocation (Judg 19:4 #12 «هُنَاكَ» -> H8033 שָֽׁם @ w13 adverb) is ACCEPTED!
const judg194Rows = loadVerseRows(prodDb, 7, 19, 4);
const judg194Res = evaluateVerse({ book: 7, ch: 19, vs: 4, lang: 'hebrew', name: 'Judg 19:4' }, judg194Rows, sources, strongsLexicon);
const judg12 = judg194Res.proposals.find(p => p.arPos === 12);
assert(
  Boolean(judg12 && (judg12.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' || judg12.status === 'ALREADY_CANONICAL') && judg12.proposed && judg12.proposed.strongsId === 'H8033' && judg12.proposed.origPos === 13),
  'Positive Gate 14: Valid RULE_G1 relocation Judg 19:4 #12 («هُنَاكَ» -> H8033@w13 adverb) is ACCEPTED',
  JSON.stringify(judg12 && { status: judg12.status, ruleId: judg12.ruleId, pos: judg12.proposed && judg12.proposed.origPos })
);

// 15. Positive Gate: Valid RULE_G2 same-POS lexical repair (1Tim 6:18 #9 «صَالِحَةٍ» -> G2570 καλός @ w5 adjective) is ACCEPTED!
const tim618Rows = loadVerseRows(prodDb, 54, 6, 18);
const tim618Res = evaluateVerse({ book: 54, ch: 6, vs: 18, lang: 'greek', name: '1Tim 6:18' }, tim618Rows, sources, strongsLexicon);
const tim9 = tim618Res.proposals.find(p => p.arPos === 9);
assert(
  Boolean(tim9 && (tim9.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' || tim9.status === 'ALREADY_CANONICAL') && tim9.proposed && tim9.proposed.strongsId === 'G2570' && tim9.proposed.origWord === 'καλός' && tim9.proposed.origPos === 5),
  'Positive Gate 15: Valid RULE_G2 same-POS repair 1Tim 6:18 #9 («صَالِحَةٍ» -> G2570 καλός@w5 adjective) is ACCEPTED',
  JSON.stringify(tim9 && { status: tim9.status, ruleId: tim9.ruleId, orig: tim9.proposed && tim9.proposed.origWord })
);

// 16. Negative Gate (v1.5 Compound Prep): Matt 21:9 #14 («بِاسْمِ» -> G1722 ἐν alone, missing G3686 ὀνόματι) is REJECTED!
const matt219Rows = loadVerseRows(prodDb, 40, 21, 9);
const matt219Res = evaluateVerse({ book: 40, ch: 21, vs: 9, lang: 'greek', name: 'Matt 21:9' }, matt219Rows, sources, strongsLexicon);
const matt14 = matt219Res.proposals.find(p => p.arPos === 14);
assert(
  Boolean(matt14 && matt14.status === 'PENDING_REVIEW' && matt14.ruleId.includes('REJECT_COMPOUND_PREP_MISSING_LEXICAL_HEAD') && matt14.proposed === null),
  'Negative Gate 16 (v1.5): Compound word Matt 21:9 #14 («بِاسْمِ» -> G1722 ἐν without G3686 ὀνόματι) is strictly REJECTED',
  JSON.stringify(matt14 && { status: matt14.status, ruleId: matt14.ruleId })
);

// 17. Negative Gate (v1.5 Greek Prep in G4): Gal 2:8 #4 («فِي» -> G1519 εἰς) is REJECTED!
const gal28Rows = loadVerseRows(prodDb, 48, 2, 8);
const gal28Res = evaluateVerse({ book: 48, ch: 2, vs: 8, lang: 'greek', name: 'Gal 2:8' }, gal28Rows, sources, strongsLexicon);
const gal4 = gal28Res.proposals.find(p => p.arPos === 4);
assert(
  Boolean(gal4 && gal4.status === 'PENDING_REVIEW' && gal4.ruleId.includes('REJECT_G4_GREEK_PREP_EXCLUDED') && gal4.proposed === null),
  'Negative Gate 17 (v1.5): Standalone Greek prep Gal 2:8 #4 («فِي» -> G1519 εἰς) is strictly REJECTED from RULE_G4',
  JSON.stringify(gal4 && { status: gal4.status, ruleId: gal4.ruleId })
);

// 18. Negative Gate (v1.5 Partial Group Acceptance): Reserving w35 by secondary component demotes BOTH #25 AND #20 in John 12:34!
const johnPartialRows = john1234Rows.map(r => r.arPos === 1 ? { ...r, secondaryPositions: [...(r.secondaryPositions || []), 35] } : r);
const johnPartialRes = evaluateVerse({ book: 43, ch: 12, vs: 34, lang: 'greek', name: 'John 12:34 (partial G4)' }, johnPartialRows, sources, strongsLexicon);
const jp20 = johnPartialRes.proposals.find(p => p.arPos === 20);
const jp25 = johnPartialRes.proposals.find(p => p.arPos === 25);
assert(
  Boolean(
    jp25 && jp25.status === 'PENDING_REVIEW' && jp25.ruleId.includes('CONFLICT_RESERVED_SECONDARY_TOKEN(w35') && jp25.proposed === null &&
    jp20 && jp20.status === 'PENDING_REVIEW' && jp20.ruleId === 'REJECT_G4_PARTIAL_GROUP_INVALIDATED' && jp20.proposed === null
  ),
  'Negative Gate 18 (v1.5): Partial G4 group acceptance prevented — reserving w35 demotes BOTH #25 and peer #20',
  JSON.stringify({ jp20: jp20 && { status: jp20.status, ruleId: jp20.ruleId }, jp25: jp25 && { status: jp25.status, ruleId: jp25.ruleId } })
);

// 19. Negative Gate (v1.5 Anchor Demotion): When sole separating anchor #21 (->w29) falls to neighbor conflict, BOTH #20 and #25 demote!
const johnAnchorRows = [
  ...john1234Rows.filter(r => r.arPos === 20 || r.arPos === 21 || r.arPos === 25).map(r =>
    r.arPos === 21 ? { ...r, origPos: 99, verifiedLocator: 'SBLGNT:B43.C12.V34.w99', hasCleanPrimaryWms: false } : r
  ),
  {
    id: 'syn_blocker_w29', arPos: 99, arWord: 'جار', strongsId: 'G9999', origWord: 'unknown', origSurface: 'unknown',
    origPos: 29, origMorph: null, morphPos: null, verifiedLocator: 'SBLGNT:B43.C12.V34.w29',
    verifiedSource: 'morphgnt_sblgnt', morphSource: 'morphgnt_sblgnt', relationType: null, grammarNotes: null,
    existingWms: [], secondaryPositions: [], hasCleanPrimaryWms: false
  }
];
const johnAnchorRes = evaluateVerse({ book: 43, ch: 12, vs: 34, lang: 'greek', name: 'John 12:34 (anchor demoted)' }, johnAnchorRows, sources, strongsLexicon);
const ja20 = johnAnchorRes.proposals.find(p => p.arPos === 20);
const ja21 = johnAnchorRes.proposals.find(p => p.arPos === 21);
const ja25 = johnAnchorRes.proposals.find(p => p.arPos === 25);
assert(
  Boolean(
    ja21 && ja21.status === 'PENDING_REVIEW' && ja21.ruleId.includes('CONFLICT_OCCUPIED_BY_PENDING_NEIGHBOR(w29') &&
    ja20 && ja20.status === 'PENDING_REVIEW' && ja20.ruleId === 'REJECT_G4_ANCHOR_INVALIDATED' && ja20.proposed === null &&
    ja25 && ja25.status === 'PENDING_REVIEW' && ja25.ruleId === 'REJECT_G4_ANCHOR_INVALIDATED' && ja25.proposed === null
  ),
  'Negative Gate 19 (v1.5): Demoted anchor #21 (w29) invalidates entire dependent G4 group (#20 & #25)',
  JSON.stringify({ ja21: ja21 && ja21.ruleId, ja20: ja20 && ja20.ruleId, ja25: ja25 && ja25.ruleId })
);

// 20. Positive Gate (v1.5 Non-compound words starting with ب/ل NOT falsely blocked): 1Sam 25:28 #9 «بَيْتًا» & Luke 1:35 #4 «لَها»
const sam2528Rows = loadVerseRows(prodDb, 9, 25, 28);
const sam2528Res = evaluateVerse({ book: 9, ch: 25, vs: 28, lang: 'hebrew', name: '1Sam 25:28' }, sam2528Rows, sources, strongsLexicon);
const samBayt = sam2528Res.proposals.find(p => p.arPos === 9);
const luke135Rows = loadVerseRows(prodDb, 42, 1, 35);
const luke135Res = evaluateVerse({ book: 42, ch: 1, vs: 35, lang: 'greek', name: 'Luke 1:35' }, luke135Rows, sources, strongsLexicon);
const lukeLaha = luke135Res.proposals.find(p => p.arPos === 4);
assert(
  Boolean(
    samBayt && (samBayt.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' || samBayt.status === 'ALREADY_CANONICAL') && samBayt.proposed && samBayt.proposed.strongsId === 'H1004' &&
    lukeLaha && (lukeLaha.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' || lukeLaha.status === 'ALREADY_CANONICAL') && lukeLaha.proposed && lukeLaha.proposed.strongsId === 'G846'
  ),
  'Positive Gate 20 (v1.5): Non-compound words starting with ب/ل (1Sam 25:28 #9 «بَيْتًا» H1004 & Luke 1:35 #4 «لَها» G846) are ACCEPTED',
  JSON.stringify({ samBayt: samBayt && { status: samBayt.status, ruleId: samBayt.ruleId }, lukeLaha: lukeLaha && { status: lukeLaha.status, ruleId: lukeLaha.ruleId } })
);

// 21. Positive Gate (v1.5 Content-Word Hebrew G4): Ezek 45:10 #2/#4/#6 («حَقّ» -> H6664 צֶדֶק @ w2/w4/w6) ALL ACCEPTED!
const ezek4510Rows = loadVerseRows(prodDb, 26, 45, 10).map(r =>
  (r.arPos === 2 || r.arPos === 4 || r.arPos === 6)
    ? { ...r, verifiedSource: 'manual_review', hasCleanPrimaryWms: false }
    : r
);
const ezek4510Res = evaluateVerse({ book: 26, ch: 45, vs: 10, lang: 'hebrew', name: 'Ezek 45:10' }, ezek4510Rows, sources, strongsLexicon);
const ez2 = ezek4510Res.proposals.find(p => p.arPos === 2);
const ez4 = ezek4510Res.proposals.find(p => p.arPos === 4);
const ez6 = ezek4510Res.proposals.find(p => p.arPos === 6);
assert(
  Boolean(
    ez2 && ez2.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' && ez2.ruleId === 'RULE_G4_BRACKETED_DUPLICATE_BIJECTION' && ez2.proposed.origPos === 2 &&
    ez4 && ez4.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' && ez4.ruleId === 'RULE_G4_BRACKETED_DUPLICATE_BIJECTION' && ez4.proposed.origPos === 4 &&
    ez6 && ez6.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' && ez6.ruleId === 'RULE_G4_BRACKETED_DUPLICATE_BIJECTION' && ez6.proposed.origPos === 6
  ),
  'Positive Gate 21 (v1.5 G4): Intact content-word Hebrew group Ezek 45:10 #2/#4/#6 («حَقّ» -> H6664@w2,w4,w6) is ACCEPTED',
  JSON.stringify({ ez2: ez2 && ez2.ruleId, ez4: ez4 && ez4.ruleId, ez6: ez6 && ez6.ruleId })
);

// 22. Negative Gate (v1.5 Greek Article Excluded from G4): Heb 12:14 #10 («أَحَدٌ» -> G3588 τὸν RA) is REJECTED!
const heb1214Rows = loadVerseRows(prodDb, 58, 12, 14);
const heb1214Res = evaluateVerse({ book: 58, ch: 12, vs: 14, lang: 'greek', name: 'Heb 12:14' }, heb1214Rows, sources, strongsLexicon);
const heb10 = heb1214Res.proposals.find(p => p.arPos === 10);
assert(
  Boolean(heb10 && heb10.status === 'PENDING_REVIEW' && heb10.ruleId.includes('REJECT_G4_ARTICLE_EXCLUDED') && heb10.proposed === null),
  'Negative Gate 22 (v1.5): Greek definite article Heb 12:14 #10 («أَحَدٌ» -> G3588 τὸν RA) is strictly REJECTED from RULE_G4',
  JSON.stringify(heb10 && { status: heb10.status, ruleId: heb10.ruleId })
);

// 23. Positive Gate (v1.6 Greek Optional-Letter Notation): G3779 οὕτω <-> οὕτω(ς) on Matt 1:18 #6 is ACCEPTED!
const matt118Rows = loadVerseRows(prodDb, 40, 1, 18);
const matt118Res = evaluateVerse({ book: 40, ch: 1, vs: 18, lang: 'greek', name: 'Matt 1:18' }, matt118Rows, sources, strongsLexicon);
const m118_6 = matt118Res.proposals.find(p => p.arPos === 6);
assert(
  Boolean(isGreekStrongsLemmaEquivalent('G3779', 'οὕτω', 'οὕτω(ς)', 'D-') && m118_6 && !String(m118_6.ruleId).startsWith('REJECT_STORED_STRONGS_LEXICON_MISMATCH')),
  'Positive Gate 23 (v1.6): MorphGNT optional-sigma notation G3779 (οὕτω <-> οὕτω(ς)) passes lexicon verification',
  JSON.stringify(m118_6 && { status: m118_6.status, ruleId: m118_6.ruleId })
);

// 24. Positive Gate (v1.6 Active/Deponent & Athematic Verbs): G5399 φοβέω<->φοβέομαι & G1166 δεικνύω<->δείκνυμι ACCEPTED!
const matt222Rows = loadVerseRows(prodDb, 40, 2, 22).map(r =>
  r.arPos === 13 ? { ...r, verifiedLocator: null, hasCleanPrimaryWms: false } : r
);
const matt222Res = evaluateVerse({ book: 40, ch: 2, vs: 22, lang: 'greek', name: 'Matt 2:22' }, matt222Rows, sources, strongsLexicon);
const m222_13 = matt222Res.proposals.find(p => p.arPos === 13);
assert(
  Boolean(
    isGreekStrongsLemmaEquivalent('G5399', 'φοβέω', 'φοβέομαι', 'V- 3AOI-S--', 'ἐφοβήθη') &&
    isGreekStrongsLemmaEquivalent('G1166', 'δεικνύω', 'δείκνυμι', 'V- 3PAI-S--', 'δείκνυσιν') &&
    m222_13 && m222_13.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' && m222_13.proposed.strongsId === 'G5399'
  ),
  'Positive Gate 24 (v1.6): Deponent/athematic verb citation forms (G5399 φοβέω<->φοβέομαι, G1166 δεικνύω<->δείκνυμι) are ACCEPTED',
  JSON.stringify(m222_13 && { status: m222_13.status, ruleId: m222_13.ruleId })
);

// 25. Positive Gate (v1.6 Verified Suppletive/Data-Bug Table): G1492 εἴδω<->οἶδα, G2920 krisis<->κρίσις, G2254 ἡμῖν<->ἐγώ (DP + surface)
assert(
  Boolean(
    isGreekStrongsLemmaEquivalent('G1492', 'εἴδω', 'οἶδα', 'V- 1XAI-S--', 'οἶδα') &&
    isGreekStrongsLemmaEquivalent('G2920', 'krisis', 'κρίσις', 'N- ----DSF-', 'κρίσει') &&
    isGreekStrongsLemmaEquivalent('G2254', 'ἡμῖν', 'ἐγώ', 'RP ----DP--', 'ἡμῖν') &&
    isGreekStrongsLemmaEquivalent('G1163', 'δεῖ', 'δέω', 'V- 3PAI-S--', 'δεῖ') &&
    isGreekStrongsLemmaEquivalent('G2036', 'ἔπω', 'λέγω', 'V- 3AAI-S--', 'εἶπεν')
  ),
  'Positive Gate 25 (v1.6): Verified Greek Strongs-to-MorphGNT suppletive/inflected citation equivalents are ACCEPTED'
);

// 26. Negative Gate (v1.6 Cross-POS / Unrelated Rejection): G3666 verb != ὅμοιος adj, wrong POS for G1492/G2249, unrelated G1
assert(
  Boolean(
    !isGreekStrongsLemmaEquivalent('G3666', 'ὁμοιόω', 'ὅμοιος', 'A- ----NSM-', 'ὅμοιος') &&
    !isGreekStrongsLemmaEquivalent('G5399', 'φοβέω', 'φοβέομαι', 'N- ----NSM-', 'φοβούμενος') &&
    !isGreekStrongsLemmaEquivalent('G1492', 'εἴδω', 'οἶδα', 'N- ----NSM-', 'οἶδα') &&
    !isGreekStrongsLemmaEquivalent('G2249', 'ἡμεῖς', 'ἐγώ', 'N- ----NPM-', 'ἡμεῖς') &&
    !isGreekStrongsLemmaEquivalent('G1', 'ἄλφα', 'κρίσις', 'N- ----DSF-', 'κρίσει') &&
    !isGreekStrongsLemmaEquivalent('G1752', 'ἕνεκα', 'ἕνεκεν', 'N- ----NSM-', 'ἕνεκεν')
  ),
  'Negative Gate 26 (v1.6): Cross-POS pairs (G3666 verb vs ὅμοιος adj, wrong POS) and unrelated Greek lemmas are strictly REJECTED'
);

// 27. Negative Gate (v1.6.2 Pronoun Case/Number/Surface Mismatch): Explicit Phil 1:21 #2 (unique ἐμοὶ / RP ----DS--) with injected G2254 (ἡμῖν) MUST reach lexicon check & be REJECTED!
const matt2545RowsForPron = loadVerseRows(prodDb, 40, 25, 45);
const phil121Rows = loadVerseRows(prodDb, 50, 1, 21);
const targetPronRow = phil121Rows.find(r => r.arPos === 2);
assert(Boolean(targetPronRow && targetPronRow.strongsId === 'G3427'), 'Gate 27 setup: Phil 1:21 #2 exists with G3427 (unique ἐμοὶ)');
const syntheticPronRows = phil121Rows.map(r =>
  r.arPos === 2
    ? { ...r, strongsId: 'G2254', hasCleanPrimaryWms: false }
    : r
);
const syntheticPronRes = evaluateVerse({ book: 50, ch: 1, vs: 21, lang: 'greek', name: 'Phil 1:21' }, syntheticPronRows, sources, strongsLexicon);
const badPronProp = syntheticPronRes.proposals.find(p => p.arPos === 2);
assert(
  Boolean(
    !isGreekStrongsLemmaEquivalent('G2254', 'ἡμῖν', 'ἐγώ', 'RP ----GS--', 'μου') &&
    !isGreekStrongsLemmaEquivalent('G2254', 'ἡμῖν', 'ἐγώ', 'RP ----DS--', 'ἐμοὶ') &&
    !isGreekStrongsLemmaEquivalent('G2254', 'ἡμῖν', 'ἐγώ', 'RP ----DP--', 'μου') &&
    !isGreekStrongsLemmaEquivalent('G5213', 'ὑμῖν', 'ἐγώ', 'RP ----DP--', 'ἡμῖν') &&
    badPronProp &&
    badPronProp.status === 'PENDING_REVIEW' &&
    badPronProp.proposed === null &&
    String(badPronProp.ruleId).includes('REJECT_STORED_STRONGS_LEXICON_MISMATCH')
  ),
  'Negative Gate 27 (v1.6.2): Pronoun equivalence strictly rejects explicit Phil 1:21 #2 G2254 (ἡμῖν) against ἐμοὶ / RP ----DS-- (and μου / RP ----GS--)',
  JSON.stringify(badPronProp && { status: badPronProp.status, ruleId: badPronProp.ruleId })
);

// 28. Negative Gate (v1.6.1 Arabic Complementizer -> Bare Greek Article): Matt 25:45 #7 («أَنَّكُمْ» -> w14 τῶν RA) MUST stay PENDING_REVIEW!
const matt2545Res = evaluateVerse({ book: 40, ch: 25, vs: 45, lang: 'greek', name: 'Matt 25:45' }, matt2545RowsForPron, sources, strongsLexicon);
const m2545_7 = matt2545Res.proposals.find(p => p.arPos === 7);
assert(
  Boolean(m2545_7 && m2545_7.status === 'PENDING_REVIEW' && m2545_7.ruleId.includes('REJECT_ARABIC_COMPLEMENTIZER_SOURCE_MISMATCH') && m2545_7.proposed === null),
  'Negative Gate 28 (v1.6.1): Matt 25:45 #7 («أَنَّكُمْ» -> w14 τῶν RA article) is strictly REJECTED and kept PENDING_REVIEW',
  JSON.stringify(m2545_7 && { status: m2545_7.status, ruleId: m2545_7.ruleId })
);

// 29. Negative Gate (v1.6.2 Edition-Switch Anti-Collision): John 6:42 #9 (TR:w11 -> SBLGNT:w11) MUST NOT collide with pending neighbor #11 at w11!
// Pin #11 as an unmovable pending neighbor at SBLGNT:w11 so this negative gate remains invariant even as v1.8 resolves other rows in John 6:42.
const john642Rows = loadVerseRows(prodDb, 43, 6, 42).map(r =>
  r.arPos === 11 ? { ...r, origWord: null, origSurface: null, origPos: 11, verifiedLocator: 'SBLGNT:B43.C6.V42.w11' } : r
);
const john642Res = evaluateVerse({ book: 43, ch: 6, vs: 42, lang: 'greek', name: 'John 6:42' }, john642Rows, sources, strongsLexicon);
const j642_9 = john642Res.proposals.find(p => p.arPos === 9);
assert(
  Boolean(j642_9 && j642_9.status === 'PENDING_REVIEW' && String(j642_9.ruleId).includes('CONFLICT_OCCUPIED_BY_PENDING_NEIGHBOR') && j642_9.proposed === null),
  'Negative Gate 29 (v1.6.2): John 6:42 #9 (TR:w11 -> SBLGNT:w11) is strictly blocked from colliding with pending neighbor #11',
  JSON.stringify(j642_9 && { status: j642_9.status, ruleId: j642_9.ruleId })
);

// 30. Positive Gate (v1.7 RULE_G1C_UNIQUE_GREEK_LEMMA_LOCK): Matt 1:25 #4 («وَلَدَتِ», G5088, origSurface=τίκτω uninflected -> unique ἔτεκεν@w7) ACCEPTED!
// Pin raw pre-repair input fields so the gate remains invariant after v1.7.2 promotion to v388.
const matt125Rows = loadVerseRows(prodDb, 40, 1, 25).map(r =>
  r.arPos === 4
    ? {
        ...r,
        origWord: 'τίκτω',
        origSurface: 'τίκτω',
        origPos: 4,
        origMorph: null,
        morphPos: 'verb',
        morphStem: null,
        morphTense: null,
        morphVoice: null,
        morphMood: null,
        morphPerson: null,
        morphNumber: null,
        morphGender: null,
        morphCase: null,
        verifiedLocator: 'TR:B40.C1.V25.w4',
        verifiedSource: null,
        morphSource: 'morphgnt_tr',
        hasCleanPrimaryWms: true
      }
    : r
);
const matt125Res = evaluateVerse({ book: 40, ch: 1, vs: 25, lang: 'greek', name: 'Matt 1:25' }, matt125Rows, sources, strongsLexicon);
const m125_4 = matt125Res.proposals.find(p => p.arPos === 4);
assert(
  Boolean(
    m125_4 &&
    m125_4.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' &&
    m125_4.ruleId === 'RULE_G1C_UNIQUE_GREEK_LEMMA_LOCK' &&
    m125_4.proposed.origPos === 7 &&
    m125_4.proposed.origSurface === 'ἔτεκεν' &&
    m125_4.proposed.origMorph === 'V- 3AAI-S--'
  ),
  'Positive Gate 30 (v1.7 RULE_G1C): Matt 1:25 #4 («وَلَدَتِ», G5088 uninflected τίκτω -> unique ἔτεκεν@w7) is ACCEPTED',
  JSON.stringify(m125_4 && { status: m125_4.status, ruleId: m125_4.ruleId, proposed: m125_4.proposed && { pos: m125_4.proposed.origPos, surf: m125_4.proposed.origSurface } })
);

// 31. Negative Gate (v1.7 RULE_G1C Surface-Incompatibility Guard): Corrupt unrelated origSurface on Matt 1:25 #4 MUST NOT fire RULE_G1C!
const corruptG1CRows = matt125Rows.map(r =>
  r.arPos === 4 ? { ...r, origSurface: 'ξένος', hasCleanPrimaryWms: false } : r
);
const corruptG1CRes = evaluateVerse({ book: 40, ch: 1, vs: 25, lang: 'greek', name: 'Matt 1:25' }, corruptG1CRows, sources, strongsLexicon);
const m125_4_bad = corruptG1CRes.proposals.find(p => p.arPos === 4);
assert(
  Boolean(m125_4_bad && m125_4_bad.status === 'PENDING_REVIEW' && m125_4_bad.proposed === null),
  'Negative Gate 31 (v1.7 RULE_G1C): Corrupt unrelated origSurface («ξένος») on Matt 1:25 #4 is strictly REJECTED',
  JSON.stringify(m125_4_bad && { status: m125_4_bad.status, ruleId: m125_4_bad.ruleId })
);

// 32. Negative Gate (v1.7.1 TR-vs-SBLGNT Edition Guard): 2Cor 13:7 #1 («وَأُصَلِّي», TR εὔχομαι 1sg vs SBLGNT εὐχόμεθα 1pl) MUST stay PENDING_REVIEW!
const cor2_13_7_rows = loadVerseRows(prodDb, 47, 13, 7);
const cor2_13_7_res = evaluateVerse({ book: 47, ch: 13, vs: 7, lang: 'greek', name: '2Cor 13:7' }, cor2_13_7_rows, sources, strongsLexicon);
const c2_13_7_1 = cor2_13_7_res.proposals.find(p => p.arPos === 1);
assert(
  Boolean(c2_13_7_1 && c2_13_7_1.status === 'PENDING_REVIEW' && String(c2_13_7_1.ruleId).includes('REJECT_G1C_TR_SBLGNT_VARIANT') && c2_13_7_1.proposed === null),
  'Negative Gate 32 (v1.7.1 TR Guard): 2Cor 13:7 #1 («وَأُصَلِّي», TR εὔχομαι vs SBLGNT εὐχόμεθα) is strictly REJECTED',
  JSON.stringify(c2_13_7_1 && { status: c2_13_7_1.status, ruleId: c2_13_7_1.ruleId })
);

// 33. Negative Gate (v1.7.1 TR-vs-SBLGNT + No 3-Char Prefix): Acts 7:34 #15 («أُرْسِلُكَ», TR ἀποστελῶ fut ind vs SBLGNT ἀποστείλω aor subj) MUST stay PENDING_REVIEW!
const acts734Rows = loadVerseRows(prodDb, 44, 7, 34);
const acts734Res = evaluateVerse({ book: 44, ch: 7, vs: 34, lang: 'greek', name: 'Acts 7:34' }, acts734Rows, sources, strongsLexicon);
const a734_15 = acts734Res.proposals.find(p => p.arPos === 15);
assert(
  Boolean(a734_15 && a734_15.status === 'PENDING_REVIEW' && a734_15.proposed === null),
  'Negative Gate 33 (v1.7.1 TR Guard): Acts 7:34 #15 («أُرْسِلُكَ», TR ἀποστελῶ vs SBLGNT ἀποστείλω) is strictly REJECTED',
  JSON.stringify(a734_15 && { status: a734_15.status, ruleId: a734_15.ruleId })
);

// 34. Negative Gate (v1.7.1 TR-vs-SBLGNT Edition Guard): Rev 9:6 #12 («فَيَهْرُبُ», TR φεύξεται fut vs SBLGNT φεύγει pres) MUST stay PENDING_REVIEW!
const rev96Rows = loadVerseRows(prodDb, 66, 9, 6);
const rev96Res = evaluateVerse({ book: 66, ch: 9, vs: 6, lang: 'greek', name: 'Rev 9:6' }, rev96Rows, sources, strongsLexicon);
const r96_12 = rev96Res.proposals.find(p => p.arPos === 12);
assert(
  Boolean(r96_12 && r96_12.status === 'PENDING_REVIEW' && String(r96_12.ruleId).includes('REJECT_G1C_TR_SBLGNT_VARIANT') && r96_12.proposed === null),
  'Negative Gate 34 (v1.7.1 TR Guard): Rev 9:6 #12 («فَيَهْرُبُ», TR φεύξεται vs SBLGNT φεύγει) is strictly REJECTED',
  JSON.stringify(r96_12 && { status: r96_12.status, ruleId: r96_12.ruleId })
);

// 35. Negative Gate (v1.7.2 Movable-Nu & TR Morph Guard): Rom 13:3 #5 («لِلأَعْمَالِ», TR ἔργων N-GPM vs SBLGNT ἔργῳ N- ----DSN-) MUST stay PENDING_REVIEW!
const rom133Rows = loadVerseRows(prodDb, 45, 13, 3);
const rom133Res = evaluateVerse({ book: 45, ch: 13, vs: 3, lang: 'greek', name: 'Rom 13:3' }, rom133Rows, sources, strongsLexicon);
const rom133_5 = rom133Res.proposals.find(p => p.arPos === 5);
assert(
  Boolean(
    !isGreekPureOrthographicVariant('εργω', 'εργων', 'G2041') &&
    !trGrammarMatchesSblMorph('N-GPM', 'N- ----DSN-') &&
    rom133_5 && rom133_5.status === 'PENDING_REVIEW' && rom133_5.proposed === null
  ),
  'Negative Gate 35 (v1.7.2 Movable-Nu Morph Guard): Rom 13:3 #5 («لِلأَعْمَالِ», TR ἔργων N-GPM vs SBLGNT ἔργῳ N- ----DSN-) is strictly REJECTED',
  JSON.stringify(rom133_5 && { status: rom133_5.status, ruleId: rom133_5.ruleId })
);

// 36. Negative Gate (v1.7.2 Movable-Nu & TR Morph Guard): 1Cor 4:14 #9 («أُنْذِرُكُمْ», TR νουθετῶ V-PAI-1S vs SBLGNT νουθετῶν V- -PAPNSM-) MUST stay PENDING_REVIEW!
const cor1_414_rows = loadVerseRows(prodDb, 46, 4, 14);
const cor1_414_res = evaluateVerse({ book: 46, ch: 4, vs: 14, lang: 'greek', name: '1Cor 4:14' }, cor1_414_rows, sources, strongsLexicon);
const c1_414_9 = cor1_414_res.proposals.find(p => p.arPos === 9);
assert(
  Boolean(
    !isGreekPureOrthographicVariant('νουθετω', 'νουθετων', 'G3560') &&
    !trGrammarMatchesSblMorph('V-PAI-1S', 'V- -PAPNSM-') &&
    c1_414_9 && c1_414_9.status === 'PENDING_REVIEW' && c1_414_9.proposed === null
  ),
  'Negative Gate 36 (v1.7.2 Movable-Nu Morph Guard): 1Cor 4:14 #9 («أُنْذِرُكُمْ», TR νουθετῶ V-PAI-1S vs SBLGNT νουθετῶν V- -PAPNSM-) is strictly REJECTED',
  JSON.stringify(c1_414_9 && { status: c1_414_9.status, ruleId: c1_414_9.ruleId })
);

// 37. Positive Gate (v1.7.2 True Movable-Nu): Rom 1:32 #18 («يُسَرُّونَ», TR συνευδοκοῦσι V-PAI-3P <-> SBLGNT συνευδοκοῦσιν V- 3PAI-P--) ACCEPTED!
// Pin raw pre-repair input fields so the gate remains invariant after v1.7.2 promotion to v388.
const rom132Rows = loadVerseRows(prodDb, 45, 1, 32).map(r =>
  r.arPos === 18
    ? {
        ...r,
        origWord: 'συνευδοκέω',
        origSurface: 'συνευδοκοῦσι',
        origPos: 17,
        origMorph: null,
        morphPos: 'verb',
        morphStem: null,
        morphTense: null,
        morphVoice: null,
        morphMood: null,
        morphPerson: null,
        morphNumber: null,
        morphGender: null,
        morphCase: null,
        verifiedLocator: 'TR:B45.C1.V32.w17',
        verifiedSource: null,
        morphSource: 'morphgnt_tr',
        hasCleanPrimaryWms: true
      }
    : r
);
const rom132Res = evaluateVerse({ book: 45, ch: 1, vs: 32, lang: 'greek', name: 'Rom 1:32' }, rom132Rows, sources, strongsLexicon);
const rom132_18 = rom132Res.proposals.find(p => p.arPos === 18);
assert(
  Boolean(
    isGreekPureOrthographicVariant('συνευδοκουσι', 'συνευδοκουσιν', 'G4909') &&
    trGrammarMatchesSblMorph('V-PAI-3P', 'V- 3PAI-P--') &&
    rom132_18 &&
    rom132_18.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' &&
    rom132_18.ruleId === 'RULE_G1C_UNIQUE_GREEK_LEMMA_LOCK' &&
    rom132_18.proposed &&
    rom132_18.proposed.origSurface === 'συνευδοκοῦσιν'
  ),
  'Positive Gate 37 (v1.7.2 True Movable-Nu): Rom 1:32 #18 («يُسَرُّونَ», TR συνευδοκοῦσι V-PAI-3P <-> SBLGNT συνευδοκοῦσιν V- 3PAI-P--) is ACCEPTED',
  JSON.stringify(rom132_18 && { status: rom132_18.status, ruleId: rom132_18.ruleId, proposed: rom132_18.proposed && rom132_18.proposed.origSurface })
);

// 38. Positive Gate (v1.8 RULE_G2B_UNIQUE_SURFACE_REPEATED_LEMMA): 1Cor 16:4 #8 («فَسَيَذْهَبُونَ», unique πορεύσονται@w10 while πορεύομαι recurs at w7) ACCEPTED, while #5 («أَذْهَبَ» -> w7 occupied by pending #7) stays BLOCKED!
const cor1_16_4_rows = loadVerseRows(prodDb, 46, 16, 4).map(r =>
  r.arPos === 8
    ? {
        ...r,
        origWord: 'πορεύομαι',
        origSurface: 'πορεύσονται',
        origPos: 8,
        origMorph: 'V- 3FMI-P--',
        verifiedLocator: 'SBLGNT:B46.C16.V4.w8',
        verifiedSource: null,
        morphSource: 'morphgnt_sblgnt',
        hasCleanPrimaryWms: true
      }
    : r
);
const cor1_16_4_res = evaluateVerse({ book: 46, ch: 16, vs: 4, lang: 'greek', name: '1Cor 16:4' }, cor1_16_4_rows, sources, strongsLexicon);
const c1_16_4_8 = cor1_16_4_res.proposals.find(p => p.arPos === 8);
const c1_16_4_5 = cor1_16_4_res.proposals.find(p => p.arPos === 5);
assert(
  Boolean(
    c1_16_4_8 &&
    c1_16_4_8.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' &&
    c1_16_4_8.ruleId === 'RULE_G2B_UNIQUE_SURFACE_REPEATED_LEMMA' &&
    c1_16_4_8.proposed &&
    c1_16_4_8.proposed.origPos === 10 &&
    c1_16_4_8.proposed.origSurface === 'πορεύσονται' &&
    c1_16_4_5 &&
    c1_16_4_5.status === 'PENDING_REVIEW' &&
    String(c1_16_4_5.ruleId).includes('CONFLICT_OCCUPIED_BY_PENDING_NEIGHBOR')
  ),
  'Positive Gate 38 (v1.8 RULE_G2B): 1Cor 16:4 #8 («فَسَيَذْهَبُونَ», unique πορεύσονται -> w10) is ACCEPTED while #5 -> w7 stays blocked by pending neighbor #7',
  JSON.stringify({ p8: c1_16_4_8 && { status: c1_16_4_8.status, ruleId: c1_16_4_8.ruleId, pos: c1_16_4_8.proposed && c1_16_4_8.proposed.origPos }, p5: c1_16_4_5 && { status: c1_16_4_5.status, ruleId: c1_16_4_5.ruleId } })
);

// 39. Negative Gate (v1.8.1 Anti-Lemma-Copy Guard): 1Cor 1:13 #5 («بُولُسَ», unique Παῦλος@w5 with repeated Παῦλος/Παύλου) with origMorph=null MUST be REJECTED specifically by REJECT_G2B_AMBIGUOUS_UNINFLECTED_CITATION_FORM!
const cor1_1_13_rows = loadVerseRows(prodDb, 46, 1, 13).map(r =>
  r.arPos === 5
    ? { ...r, origWord: 'Παῦλος', origSurface: 'Παῦλος', origPos: 5, origMorph: null, verifiedLocator: 'TR:B46.C1.V13.w5', verifiedSource: null, hasCleanPrimaryWms: false }
    : r
);
const cor1_1_13_res = evaluateVerse({ book: 46, ch: 1, vs: 13, lang: 'greek', name: '1Cor 1:13' }, cor1_1_13_rows, sources, strongsLexicon);
const c1_1_13_5 = cor1_1_13_res.proposals.find(p => p.arPos === 5);
assert(
  Boolean(c1_1_13_5 && c1_1_13_5.status === 'PENDING_REVIEW' && String(c1_1_13_5.ruleId).includes('REJECT_G2B_AMBIGUOUS_UNINFLECTED_CITATION_FORM') && c1_1_13_5.proposed === null),
  'Negative Gate 39 (v1.8.1 Anti-Lemma-Copy): 1Cor 1:13 #5 («بُولُسَ», Παῦλος==Παῦλος, origMorph=null) is strictly REJECTED by REJECT_G2B_AMBIGUOUS_UNINFLECTED_CITATION_FORM',
  JSON.stringify(c1_1_13_5 && { status: c1_1_13_5.status, ruleId: c1_1_13_5.ruleId })
);

// 40. Negative Gate (v1.8 Stored Morph Contradiction Guard): 1Cor 16:4 #8 with conflicting stored MorphGNT (V- 3PAI-S-- != V- 3FMI-P--) MUST be REJECTED!
const badMorph164Rows = cor1_16_4_rows.map(r =>
  r.arPos === 8 ? { ...r, origMorph: 'V- 3PAI-S--' } : r
);
const badMorph164Res = evaluateVerse({ book: 46, ch: 16, vs: 4, lang: 'greek', name: '1Cor 16:4' }, badMorph164Rows, sources, strongsLexicon);
const badMorph164_8 = badMorph164Res.proposals.find(p => p.arPos === 8);
assert(
  Boolean(badMorph164_8 && badMorph164_8.status === 'PENDING_REVIEW' && String(badMorph164_8.ruleId).includes('REJECT_G2B_STORED_MORPH_MISMATCH') && badMorph164_8.proposed === null),
  'Negative Gate 40 (v1.8 Morph Guard): 1Cor 16:4 #8 with conflicting stored MorphGNT (V- 3PAI-S-- != V- 3FMI-P--) is strictly REJECTED',
  JSON.stringify(badMorph164_8 && { status: badMorph164_8.status, ruleId: badMorph164_8.ruleId })
);

// 41. Negative Gate (v1.8 Lexical Audit Compatibility Guard): Luke 24:7 #3 («يَنْبَغِي», G1163 δεῖ -> δέω) MUST be REJECTED to preserve pa=0 on lexical axis!
const luke24_7_rows = loadVerseRows(prodDb, 42, 24, 7);
const luke24_7_res = evaluateVerse({ book: 42, ch: 24, vs: 7, lang: 'greek', name: 'Luke 24:7' }, luke24_7_rows, sources, strongsLexicon);
const l24_7_3 = luke24_7_res.proposals.find(p => p.arPos === 3);
assert(
  Boolean(l24_7_3 && l24_7_3.status === 'PENDING_REVIEW' && String(l24_7_3.ruleId).includes('REJECT_GREEK_LEXICAL_AUDIT_COMPAT') && l24_7_3.proposed === null),
  'Negative Gate 41 (v1.8 Lexical Audit Guard): Luke 24:7 #3 («يَنْبَغِي», G1163 δεῖ -> δέω) is strictly REJECTED (preserves lexical pa=0)',
  JSON.stringify(l24_7_3 && { status: l24_7_3.status, ruleId: l24_7_3.ruleId })
);

// 42. Negative Gate (v1.8.1 Greek Copula-Lemma Contextual Guard): 2Cor 8:12 #3 («كَانَ» -> G2192 ἔχω/ἔχῃ @ w8) MUST be REJECTED!
const cor2_8_12_rows = loadVerseRows(prodDb, 47, 8, 12);
const cor2_8_12_res = evaluateVerse({ book: 47, ch: 8, vs: 12, lang: 'greek', name: '2Cor 8:12' }, cor2_8_12_rows, sources, strongsLexicon);
const c2_8_12_3 = cor2_8_12_res.proposals.find(p => p.arPos === 3);
assert(
  Boolean(c2_8_12_3 && c2_8_12_3.status === 'PENDING_REVIEW' && String(c2_8_12_3.ruleId).includes('REJECT_ARABIC_COPULA_NON_COPULA_GREEK_VERB') && c2_8_12_3.proposed === null),
  'Negative Gate 42 (v1.8.1 Greek Copula Guard): 2Cor 8:12 #3 («كَانَ» -> G2192 ἔχω/ἔχῃ @ w8) is strictly REJECTED',
  JSON.stringify(c2_8_12_3 && { status: c2_8_12_3.status, ruleId: c2_8_12_3.ruleId })
);

// 43. Negative Gate (v1.8.1 Preposition-Case Context Guard): Rom 12:17 #5 («عَنْ شَرّ» -> bare κακὸν @ w2 while κακοῦ @ w4 follows ἀντὶ) MUST be REJECTED!
const rom12_17_rows = loadVerseRows(prodDb, 45, 12, 17);
const rom12_17_res = evaluateVerse({ book: 45, ch: 12, vs: 17, lang: 'greek', name: 'Rom 12:17' }, rom12_17_rows, sources, strongsLexicon);
const r12_17_5 = rom12_17_res.proposals.find(p => p.arPos === 5);
assert(
  Boolean(r12_17_5 && r12_17_5.status === 'PENDING_REVIEW' && String(r12_17_5.ruleId).includes('REJECT_G2B_PREP_CASE_CONTEXT_MISMATCH') && r12_17_5.proposed === null),
  'Negative Gate 43 (v1.8.1 Prep-Case Context Guard): Rom 12:17 #5 («عَنْ شَرّ» -> bare κακὸν @ w2) is strictly REJECTED',
  JSON.stringify(r12_17_5 && { status: r12_17_5.status, ruleId: r12_17_5.ruleId })
);

// 44. Negative Gate (v1.8.1 Arabic Subject Pronoun vs Greek Finite Verb Person/Number Guard): John 13:10 #15 («هُوَ» 3sg -> ἐστε V- 2PAI-P-- 2pl) MUST be REJECTED!
const john13_10_rows = loadVerseRows(prodDb, 43, 13, 10);
const john13_10_res = evaluateVerse({ book: 43, ch: 13, vs: 10, lang: 'greek', name: 'John 13:10' }, john13_10_rows, sources, strongsLexicon);
const j13_10_15 = john13_10_res.proposals.find(p => p.arPos === 15);
assert(
  Boolean(j13_10_15 && j13_10_15.status === 'PENDING_REVIEW' && String(j13_10_15.ruleId).includes('REJECT_ARABIC_PRONOUN_VERB_PERSON_NUMBER_MISMATCH') && j13_10_15.proposed === null),
  'Negative Gate 44 (v1.8.1 Pronoun-Verb Guard): John 13:10 #15 («هُوَ» 3sg -> ἐστε V- 2PAI-P-- 2pl) is strictly REJECTED',
  JSON.stringify(j13_10_15 && { status: j13_10_15.status, ruleId: j13_10_15.ruleId })
);

// 45. Negative Gate (v1.8.2 Alif-Maqsura Prep Normalization): Rom 12:17 #5 with preceding «عَلَى», «إِلَى», «وَعَلَى», «وَإِلَى» MUST ALL be REJECTED by REJECT_G2B_PREP_CASE_CONTEXT_MISMATCH!
const prepVariantsToTest = ['عَلَى', 'إِلَى', 'وَعَلَى', 'وَإِلَى'];
const prepVariantResults = prepVariantsToTest.map(prepWord => {
  const modRows = rom12_17_rows.map(r => (r.arPos === 4 ? { ...r, arWord: prepWord } : r));
  const res = evaluateVerse({ book: 45, ch: 12, vs: 17, lang: 'greek', name: `Rom 12:17 (${prepWord})` }, modRows, sources, strongsLexicon);
  const p5 = res.proposals.find(p => p.arPos === 5);
  return { prepWord, ok: Boolean(p5 && p5.status === 'PENDING_REVIEW' && String(p5.ruleId).includes('REJECT_G2B_PREP_CASE_CONTEXT_MISMATCH') && p5.proposed === null), ruleId: p5 && p5.ruleId };
});
assert(
  prepVariantResults.every(x => x.ok),
  'Negative Gate 45 (v1.8.2 Prep Normalization): Rom 12:17 #5 preceded by «عَلَى», «إِلَى», «وَعَلَى», or «وَإِلَى» is strictly REJECTED by REJECT_G2B_PREP_CASE_CONTEXT_MISMATCH',
  JSON.stringify(prepVariantResults)
);

// 46. Negative Gate (v1.8.3 Compound Conjunction / G4 Conjunction Exclusion): Mark 5:26 #7 («وَأَنْفَقَتْ» -> bare G2532 καὶ @ w7 without δαπανήσασα) MUST be REJECTED!
const mark5_26_rows = loadVerseRows(prodDb, 41, 5, 26);
const mark5_26_res = evaluateVerse({ book: 41, ch: 5, vs: 26, lang: 'greek', name: 'Mark 5:26' }, mark5_26_rows, sources, strongsLexicon);
const m5_26_7 = mark5_26_res.proposals.find(p => p.arPos === 7);
assert(
  Boolean(m5_26_7 && m5_26_7.status === 'PENDING_REVIEW' && m5_26_7.proposed === null && (String(m5_26_7.ruleId).includes('REJECT_G4_GREEK_CONJ_EXCLUDED') || String(m5_26_7.ruleId).includes('REJECT_COMPOUND_CONJ_MISSING_LEXICAL_HEAD'))),
  'Negative Gate 46 (v1.8.3 Conjunction Guard): Mark 5:26 #7 («وَأَنْفَقَتْ» -> bare G2532 καὶ without verb) is strictly REJECTED',
  JSON.stringify(m5_26_7 && { status: m5_26_7.status, ruleId: m5_26_7.ruleId })
);

// 47. Negative Gate (v1.8.3 G4 Conjunction Exclusion): 1Cor 15:56 #4 («فَهِيَ» -> G1161 δὲ @ w9 from clause 2) MUST be REJECTED!
const cor1_15_56_rows = loadVerseRows(prodDb, 46, 15, 56);
const cor1_15_56_res = evaluateVerse({ book: 46, ch: 15, vs: 56, lang: 'greek', name: '1Cor 15:56' }, cor1_15_56_rows, sources, strongsLexicon);
const c1_15_56_4 = cor1_15_56_res.proposals.find(p => p.arPos === 4);
assert(
  Boolean(c1_15_56_4 && c1_15_56_4.status === 'PENDING_REVIEW' && c1_15_56_4.proposed === null && String(c1_15_56_4.ruleId).includes('REJECT_G4_GREEK_CONJ_EXCLUDED')),
  'Negative Gate 47 (v1.8.3 G4 Conjunction Guard): 1Cor 15:56 #4 («فَهِيَ» -> G1161 δὲ @ w9) is strictly REJECTED by REJECT_G4_GREEK_CONJ_EXCLUDED',
  JSON.stringify(c1_15_56_4 && { status: c1_15_56_4.status, ruleId: c1_15_56_4.ruleId })
);

// 48. Negative Gate (v1.8.3 Non-G4 Compound Conjunction Guard): 2Cor 12:18 #4 («وَأَرْسَلْتُ» -> bare G2532 καὶ @ w3 via RULE_G1) MUST be REJECTED!
const cor2_12_18_rows = loadVerseRows(prodDb, 47, 12, 18);
const cor2_12_18_res = evaluateVerse({ book: 47, ch: 12, vs: 18, lang: 'greek', name: '2Cor 12:18' }, cor2_12_18_rows, sources, strongsLexicon);
const c2_12_18_4 = cor2_12_18_res.proposals.find(p => p.arPos === 4);
assert(
  Boolean(c2_12_18_4 && c2_12_18_4.status === 'PENDING_REVIEW' && c2_12_18_4.proposed === null && String(c2_12_18_4.ruleId).includes('REJECT_COMPOUND_CONJ_MISSING_LEXICAL_HEAD')),
  'Negative Gate 48 (v1.8.3 Non-G4 Compound Conj Guard): 2Cor 12:18 #4 («وَأَرْسَلْتُ» -> bare G2532 καὶ @ w3) is strictly REJECTED by REJECT_COMPOUND_CONJ_MISSING_LEXICAL_HEAD',
  JSON.stringify(c2_12_18_4 && { status: c2_12_18_4.status, ruleId: c2_12_18_4.ruleId })
);

// 49. Negative Gate (v1.8.4 Greek C- Conjunction Deferral): Gal 2:10 #9 («أَنْ» in «أَنْ أَفْعَلَهُ» -> ἵνα @ w4 from clause 1) MUST be REJECTED!
const gal2_10_rows = loadVerseRows(prodDb, 48, 2, 10);
const gal2_10_res = evaluateVerse({ book: 48, ch: 2, vs: 10, lang: 'greek', name: 'Gal 2:10' }, gal2_10_rows, sources, strongsLexicon);
const g2_10_9 = gal2_10_res.proposals.find(p => p.arPos === 9);
assert(
  Boolean(g2_10_9 && g2_10_9.status === 'PENDING_REVIEW' && g2_10_9.proposed === null && String(g2_10_9.ruleId).includes('REJECT_GREEK_CONJ_DEFERRED_FOR_CONTEXTUAL_REVIEW')),
  'Negative Gate 49 (v1.8.4 Greek C- Deferral): Gal 2:10 #9 («أَنْ» -> ἵνα @ w4 from clause 1) is strictly REJECTED by REJECT_GREEK_CONJ_DEFERRED_FOR_CONTEXTUAL_REVIEW',
  JSON.stringify(g2_10_9 && { status: g2_10_9.status, ruleId: g2_10_9.ruleId })
);

// 10-14. Applied-Output CI Verification on Isolated DB Copy (B20 + R1 + R2 + R3 + audit-guarded + unseen sample)
const preProtFp = computeProtectedRegistryFingerprint(prodDb, protectedVerseKeys);
const testVerses = [];
for (const k of protectedVerseKeys) {
  const [b, c, v] = k.split(':').map(Number);
  const lang = b >= 40 ? 'greek' : (b === 15 || b === 27 ? 'aramaic' : 'hebrew');
  testVerses.push({ book: b, ch: c, vs: v, lang, name: `${b}:${c}:${v}` });
}
// Also include an unseen non-protected verse (Matt 5:3) to verify real writes + 0 multiple_primary_components
testVerses.push({ book: 40, ch: 5, vs: 3, lang: 'greek', name: 'Matt 5:3' });

const appliedResults = testVerses.map(v => evaluateVerse(v, loadVerseRows(prodDb, v.book, v.ch, v.vs), sources, strongsLexicon, { protectedVerseKeys }));

const isoDb = path.join(repoRoot, 'scratch/test_general_engine_v12_ci.db');
const tmpR1 = path.join(repoRoot, 'scratch/tmp_ge12_r1.json');
const tmpR2 = path.join(repoRoot, 'scratch/tmp_ge12_r2.json');
const tmpR3 = path.join(repoRoot, 'scratch/tmp_ge12_r3.json');
try {
  applyProposalsToIsolatedDb(prodDb, isoDb, appliedResults, null);

  const postProtFp = computeProtectedRegistryFingerprint(isoDb, protectedVerseKeys);
  assert(
    postProtFp.wordMappingsSha256 === preProtFp.wordMappingsSha256 &&
    postProtFp.wordMappingStrongsSha256 === preProtFp.wordMappingStrongsSha256,
    `Applied-Output Gate 10: Protected Adjudicated Registry (${postProtFp.protectedVerseCount} verses, ${postProtFp.protectedRowCount} rows) bitwise identical before & after`
  );

  const multiPrimCnt = parseInt(execFileSync(sqlitePath, [isoDb], {
    input: "SELECT COUNT(*) FROM (SELECT mapping_id FROM word_mapping_strongs WHERE link_role='primary' GROUP BY mapping_id HAVING COUNT(*) > 1);",
    encoding: 'utf8'
  }).trim(), 10);
  assert(multiPrimCnt === 0, `Applied-Output Gate 11: Zero multiple_primary_components on applied isolated DB (got ${multiPrimCnt})`);

  let b20Ok = false;
  try {
    execFileSync(process.execPath, [path.join(repoRoot, 'scripts/audit_20_verses_311_units.cjs')], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: isoDb }, stdio: 'pipe' });
    b20Ok = true;
  } catch (_) {}
  assert(b20Ok, 'Applied-Output Gate 12: B20 (audit_20_verses_311_units.cjs) = 311/311 on applied isolated DB');

  let autoAuditOk = false;
  try {
    execFileSync(process.execPath, [path.join(repoRoot, 'scripts/automated_database_audit.cjs')], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: isoDb }, stdio: 'pipe' });
    autoAuditOk = true;
  } catch (_) {}
  assert(autoAuditOk, 'Applied-Output Gate 13: automated_database_audit.cjs = 0 failures on applied isolated DB');

  execFileSync(process.execPath, [path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'), '--manifest', path.join(repoRoot, 'scripts/unseen_holdout_15_verses_manifest.json'), '--fail-on-alerts', '--out', tmpR1], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: isoDb }, stdio: 'pipe' });
  execFileSync(process.execPath, [path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'), '--manifest', path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json'), '--fail-on-alerts', '--out', tmpR2], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: isoDb }, stdio: 'pipe' });
  execFileSync(process.execPath, [path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'), '--manifest', path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json'), '--out', tmpR3], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: isoDb }, stdio: 'pipe' });

  const repR1 = JSON.parse(fs.readFileSync(tmpR1, 'utf8'));
  const repR2 = JSON.parse(fs.readFileSync(tmpR2, 'utf8'));
  const repR3 = JSON.parse(fs.readFileSync(tmpR3, 'utf8'));
  assert(
    repR1.summary.cleanUnits === 253 && repR1.summary.alertedUnits === 0 &&
    repR2.summary.cleanUnits === 255 && repR2.summary.alertedUnits === 0 &&
    repR3.summary.cleanUnits === 233 && repR3.summary.alertedUnits === 1,
    'Applied-Output Gate 14: R1 (253/253), R2 (255/255), and R3 (233/234) preserved with 0 regressions on applied isolated DB'
  );
} finally {
  for (const f of [isoDb, tmpR1, tmpR2, tmpR3]) { try { fs.unlinkSync(f); } catch (_) {} }
}

console.log('\n================================================================================');
console.log(`  GENERAL REPAIR ENGINE v1.2 GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');
if (failed > 0) process.exit(1);
