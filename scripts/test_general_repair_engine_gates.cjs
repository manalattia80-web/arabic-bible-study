/**
 * scripts/test_general_repair_engine_gates.cjs
 *
 * Mandatory CI Verification & Negative Gate Suite for Whole-Verse General Repair Engine (v1.1):
 *   1. Duplicate-occurrence trap: Zech 12:12 #11 (לְבָד x5) -> strictly PENDING_REVIEW.
 *   2. Duplicate-occurrence trap: Eph 1:21 #11 & #16 (ἐν x2) -> strictly PENDING_REVIEW.
 *   3. Peer competing claims on the same unique token -> BOTH demoted to PENDING_REVIEW.
 *   4. Adversarial Case 1: Wrong strongs_id 'G1' injected on Eph 1:21 #1 («فَوْقَ») -> strictly REJECTED (PENDING_REVIEW).
 *   5. Adversarial Case 2: Wrong orig_word 'בַּיִת' injected on Exod 15:2 («صار», H1961) -> strictly REJECTED (PENDING_REVIEW).
 *   6. Adversarial Case 3: Rom 16:16 #5 («بِقُبْلَةٍ») redirected to w2 (ἀλλήλους) -> strictly REJECTED (CONFLICT_RESERVED_PRIMARY_TOKEN).
 *   7. Secondary-component reservation: Redirecting a row onto w3 (ἐν, secondary of Rom 16:16 #5) -> strictly REJECTED (CONFLICT_RESERVED_SECONDARY_TOKEN).
 *   8-10. Zero-Regression Gates: Applying engine v1.1 blindly to R1 (253), R2 (255), and R3 (234) on an isolated copy keeps 0 regressions.
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

const repoRoot = path.resolve(__dirname, '..');
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

console.log('=== RUNNING WHOLE-VERSE GENERAL REPAIR ENGINE v1.1 GATES ===\n');

const sources = loadAllSources();
const strongsLexicon = loadStrongsLexicon(prodDb);

// 1. Negative Gate: Zech 12:12 duplicate occurrence (לְבָד occurs 5 times)
const zechRows = loadVerseRows(prodDb, 38, 12, 12).map(r => r.arPos === 11 ? { ...r, relationType: null } : r);
const zechRes = evaluateVerse({ book: 38, ch: 12, vs: 12, lang: 'hebrew', name: 'Zech 12:12' }, zechRows, sources, strongsLexicon);
const zech11 = zechRes.proposals.find(p => p.arPos === 11);
assert(
  Boolean(zech11 && zech11.status === 'PENDING_REVIEW' && zech11.alternatives.length === 5 && zech11.ruleId.includes('REJECT_MULTIPLE_BOTH_MATCHES(count=5)')),
  'Negative Gate 1: Zech 12:12 #11 («حِدَتِهَا», לְבָד) strictly demoted to PENDING_REVIEW with all 5 competing occurrences listed',
  JSON.stringify(zech11 && { status: zech11.status, ruleId: zech11.ruleId, alts: zech11.alternatives.length })
);

// 2. Negative Gate: Eph 1:21 duplicate occurrence (ἐν occurs 2 times: w16 & w22)
const ephRows = loadVerseRows(prodDb, 49, 1, 21);
const ephRes = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21' }, ephRows, sources, strongsLexicon);
const eph11 = ephRes.proposals.find(p => p.arPos === 11);
const eph16 = ephRes.proposals.find(p => p.arPos === 16);
assert(
  Boolean(eph11 && eph11.status === 'PENDING_REVIEW' && eph16 && eph16.status === 'PENDING_REVIEW' && eph16.alternatives.length === 2),
  'Negative Gate 2: Eph 1:21 #11 & #16 («فِي», ἐν @ w16/w22) strictly demoted to PENDING_REVIEW with 2 competing alternatives',
  JSON.stringify({ eph11: eph11 && eph11.ruleId, eph16: eph16 && eph16.ruleId })
);

// 3. Negative Gate: Peer competing claims on the same unique token
const syntheticRows = [
  { id: 'syn1', arPos: 1, arWord: 'أ', strongsId: 'G5231', origWord: 'ὑπεράνω', origSurface: 'ὑπεράνω', origPos: 9, origMorph: null, morphPos: null, verifiedLocator: 'SBLGNT:B49.C1.V21.w9', verifiedSource: 'morphgnt_sblgnt', morphSource: 'morphgnt_sblgnt', relationType: null, secondaryPositions: [], hasCleanPrimaryWms: false },
  { id: 'syn2', arPos: 2, arWord: 'ب', strongsId: 'G5231', origWord: 'ὑπεράνω', origSurface: 'ὑπεράνω', origPos: 10, origMorph: null, morphPos: null, verifiedLocator: 'SBLGNT:B49.C1.V21.w10', verifiedSource: 'morphgnt_sblgnt', morphSource: 'morphgnt_sblgnt', relationType: null, secondaryPositions: [], hasCleanPrimaryWms: false }
];
const synRes = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21 (synthetic)' }, syntheticRows, sources, strongsLexicon);
assert(
  synRes.proposals.every(p => p.status === 'PENDING_REVIEW' && p.ruleId.includes('CONFLICT_SHARED_TARGET_TOKEN')),
  'Negative Gate 3: Competing claims on the same unique token (w1 ὑπεράνω) demote BOTH rows to PENDING_REVIEW',
  JSON.stringify(synRes.proposals.map(p => ({ arPos: p.arPos, status: p.status, ruleId: p.ruleId })))
);

// 4. Negative Gate (Adversarial Case 1): Wrong strongs_id 'G1' injected on Eph 1:21 #1 «فَوْقَ»
const ephBadG1Rows = ephRows.map(r => r.arPos === 1 ? { ...r, strongsId: 'G1', hasCleanPrimaryWms: false } : r);
const ephBadG1Res = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21 (bad G1)' }, ephBadG1Rows, sources, strongsLexicon);
const eph1Bad = ephBadG1Res.proposals.find(p => p.arPos === 1);
assert(
  Boolean(eph1Bad && eph1Bad.status === 'PENDING_REVIEW' && eph1Bad.ruleId.includes('REJECT_STORED_STRONGS_LEXICON_MISMATCH') && eph1Bad.proposed === null),
  'Negative Gate 4: Injecting wrong strongs_id G1 on Eph 1:21 #1 («فَوْقَ») is strictly REJECTED (never granted high confidence)',
  JSON.stringify(eph1Bad && { status: eph1Bad.status, ruleId: eph1Bad.ruleId, proposed: eph1Bad.proposed })
);

// 5. Negative Gate (Adversarial Case 2): Wrong orig_word 'בַּיִת' injected on Exod 15:2 («صار» -> H1961)
const exod152Rows = loadVerseRows(prodDb, 2, 15, 2);
const saraRow = exod152Rows.find(r => r.strongsId === 'H1961' || (r.arWord && r.arWord.includes('صَارَ')) || (r.arWord && r.arWord.includes('صار')));
const exodBadLemmaRows = exod152Rows.map(r => (saraRow && r.arPos === saraRow.arPos) ? { ...r, strongsId: 'H1961', origWord: 'בַּיִת', hasCleanPrimaryWms: false } : r);
const exodBadRes = evaluateVerse({ book: 2, ch: 15, vs: 2, lang: 'hebrew', name: 'Exod 15:2 (bad lemma)' }, exodBadLemmaRows, sources, strongsLexicon);
const saraProp = saraRow ? exodBadRes.proposals.find(p => p.arPos === saraRow.arPos) : null;
assert(
  Boolean(saraProp && saraProp.status === 'PENDING_REVIEW' && saraProp.ruleId.includes('REJECT_STORED_LEMMA_CONFLICTS_WITH_LEXICON') && saraProp.proposed === null),
  'Negative Gate 5: Injecting wrong orig_word «בַּיִת» on Exod 15:2 («صار», H1961) is strictly REJECTED (never preserves wrong lemma)',
  JSON.stringify(saraProp && { arPos: saraProp.arPos, status: saraProp.status, ruleId: saraProp.ruleId, proposed: saraProp.proposed })
);

// 6. Negative Gate (Adversarial Case 3): Rom 16:16 #5 («بِقُبْلَةٍ») redirected to w2 (ἀλλήλους, reserved by compound_phrase #2 & #4)
const romRows = loadVerseRows(prodDb, 45, 16, 16);
const romBad5Rows = romRows.map(r => r.arPos === 5 ? {
  ...r,
  strongsId: 'G240',
  origWord: 'ἀλλήλων',
  origSurface: 'ἀλλήλους',
  origPos: 2,
  verifiedLocator: 'SBLGNT:B45.C16.V16.w2',
  secondaryPositions: [],
  hasCleanPrimaryWms: false
} : r);
const romBad5Res = evaluateVerse({ book: 45, ch: 16, vs: 16, lang: 'greek', name: 'Rom 16:16 (collision w2)' }, romBad5Rows, sources, strongsLexicon);
const rom5Prop = romBad5Res.proposals.find(p => p.arPos === 5);
assert(
  Boolean(rom5Prop && rom5Prop.status === 'PENDING_REVIEW' && rom5Prop.ruleId.includes('CONFLICT_RESERVED_PRIMARY_TOKEN(w2,reservedBy=2,4)') && rom5Prop.proposed === null),
  'Negative Gate 6: Redirecting Rom 16:16 #5 («بِقُبْلَةٍ») onto compound_phrase w2 (#2,#4) is strictly REJECTED as CONFLICT_RESERVED_PRIMARY_TOKEN',
  JSON.stringify(rom5Prop && { status: rom5Prop.status, ruleId: rom5Prop.ruleId, proposed: rom5Prop.proposed })
);

// 7. Negative Gate: Redirecting a row onto w3 (ἐν, reserved as secondary component of Rom 16:16 #5)
const romBadSecRows = romRows.map(r => r.arPos === 6 ? {
  ...r,
  strongsId: 'G1722',
  origWord: 'ἐν',
  origSurface: 'ἐν',
  origPos: 3,
  verifiedLocator: 'SBLGNT:B45.C16.V16.w3',
  hasCleanPrimaryWms: false
} : r);
const romBadSecRes = evaluateVerse({ book: 45, ch: 16, vs: 16, lang: 'greek', name: 'Rom 16:16 (collision sec w3)' }, romBadSecRows, sources, strongsLexicon);
const rom6Prop = romBadSecRes.proposals.find(p => p.arPos === 6);
assert(
  Boolean(rom6Prop && rom6Prop.status === 'PENDING_REVIEW' && rom6Prop.ruleId.includes('CONFLICT_RESERVED_SECONDARY_TOKEN(w3,reservedBy=5)') && rom6Prop.proposed === null),
  'Negative Gate 7: Redirecting Rom 16:16 #6 onto secondary token w3 (owned by #5) is strictly REJECTED as CONFLICT_RESERVED_SECONDARY_TOKEN',
  JSON.stringify(rom6Prop && { status: rom6Prop.status, ruleId: rom6Prop.ruleId, proposed: rom6Prop.proposed })
);

// 8-10. Zero-Regression Tests on Isolated Copy over R1 + R2 + R3 (742 records)
const r1M = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_15_verses_manifest.json'), 'utf8')).holdout_verses;
const r2M = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json'), 'utf8')).holdout_verses;
const r3M = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json'), 'utf8')).holdout_verses;

const calResults = [];
let autoModifiedCal = 0;
for (const v of [...r1M, ...r2M, ...r3M]) {
  const rows = loadVerseRows(prodDb, v.book, v.ch, v.vs);
  const res = evaluateVerse(v, rows, sources, strongsLexicon);
  calResults.push(res);
  autoModifiedCal += res.proposals.filter(p => p.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE').length;
}

const isoDb = path.join(repoRoot, 'scratch/test_general_engine_cal_nonreg.db');
const tmpR1 = path.join(repoRoot, 'scratch/tmp_ge_r1.json');
const tmpR2 = path.join(repoRoot, 'scratch/tmp_ge_r2.json');
const tmpR3 = path.join(repoRoot, 'scratch/tmp_ge_r3.json');
try {
  applyProposalsToIsolatedDb(prodDb, isoDb, calResults, null);
  execFileSync(process.execPath, [path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'), '--manifest', path.join(repoRoot, 'scripts/unseen_holdout_15_verses_manifest.json'), '--fail-on-alerts', '--out', tmpR1], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: isoDb }, stdio: 'pipe' });
  execFileSync(process.execPath, [path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'), '--manifest', path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json'), '--fail-on-alerts', '--out', tmpR2], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: isoDb }, stdio: 'pipe' });
  execFileSync(process.execPath, [path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'), '--manifest', path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json'), '--out', tmpR3], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: isoDb }, stdio: 'pipe' });

  const repR1 = JSON.parse(fs.readFileSync(tmpR1, 'utf8'));
  const repR2 = JSON.parse(fs.readFileSync(tmpR2, 'utf8'));
  const repR3 = JSON.parse(fs.readFileSync(tmpR3, 'utf8'));

  assert(repR1.summary.cleanUnits === 253 && repR1.summary.alertedUnits === 0, `Non-Regression Gate 8: R1 remains 253/253 (0 alerts) after engine v1.1 run (autoModifiedCal=${autoModifiedCal})`);
  assert(repR2.summary.cleanUnits === 255 && repR2.summary.alertedUnits === 0, `Non-Regression Gate 9: R2 remains 255/255 (0 alerts) after engine v1.1 run`);
  assert(repR3.summary.cleanUnits === 233 && repR3.summary.alertedUnits === 1, `Non-Regression Gate 10: R3 remains 233/234 (1 documented Dan 5:2 alert) after engine v1.1 run`);
} finally {
  for (const f of [isoDb, tmpR1, tmpR2, tmpR3]) { try { fs.unlinkSync(f); } catch (_) {} }
}

console.log('\n================================================================================');
console.log(`  GENERAL REPAIR ENGINE v1.1 GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');
if (failed > 0) process.exit(1);
