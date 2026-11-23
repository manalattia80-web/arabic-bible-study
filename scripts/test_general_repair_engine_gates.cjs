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
  applyProposalsToIsolatedDb
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
const john1234Rows = loadVerseRows(prodDb, 43, 12, 34);
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
const ezek4510Rows = loadVerseRows(prodDb, 26, 45, 10);
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
