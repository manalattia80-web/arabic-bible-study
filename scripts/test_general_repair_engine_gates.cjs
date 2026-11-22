/**
 * scripts/test_general_repair_engine_gates.cjs
 *
 * Verification & Negative Gate Suite for Whole-Verse General Repair Engine (v1.0):
 *   1. Proves strict rejection (PENDING_REVIEW) of duplicate-occurrence traps (Zech 12:12 לְבָד x5 & Eph 1:21 ἐν x2)
 *      even when stored surface & morphology are 100% valid!
 *   2. Proves strict rejection (PENDING_REVIEW) of competing claims when two Arabic words map to the same unique token.
 *   3. Proves ZERO regressions when applying the engine blindly to already-calibrated R1 (253), R2 (255), and R3 (234)
 *      on an isolated DB copy, verified by the frozen auditor.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadAllSources } = require('./full_66_books_audit_helpers.cjs');
const { evaluateVerse, loadVerseRows, applyProposalsToIsolatedDb } = require('./whole_verse_general_repair_engine.cjs');

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

console.log('=== RUNNING WHOLE-VERSE GENERAL REPAIR ENGINE GATES ===\n');

const sources = loadAllSources();

// 1. Negative Gate: Zech 12:12 duplicate occurrence (לְבָד occurs 5 times) — simulate uncalibrated row (relationType=null)
const zechRows = loadVerseRows(prodDb, 38, 12, 12).map(r => r.arPos === 11 ? { ...r, relationType: null } : r);
const zechRes = evaluateVerse({ book: 38, ch: 12, vs: 12, lang: 'hebrew', name: 'Zech 12:12' }, zechRows, sources);
const zech11 = zechRes.proposals.find(p => p.arPos === 11);
assert(
  Boolean(zech11 && zech11.status === 'PENDING_REVIEW' && zech11.alternatives.length === 5 && zech11.ruleId.includes('REJECT_MULTIPLE_BOTH_MATCHES(count=5)')),
  'Negative Gate 1: Zech 12:12 #11 («حِدَتِهَا», לְבָד) strictly demoted to PENDING_REVIEW with all 5 competing occurrences listed',
  JSON.stringify(zech11 && { status: zech11.status, ruleId: zech11.ruleId, alts: zech11.alternatives.length })
);

// 2. Negative Gate: Eph 1:21 duplicate occurrence (ἐν occurs 2 times: w16 & w22)
const ephRows = loadVerseRows(prodDb, 49, 1, 21);
const ephRes = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21' }, ephRows, sources);
const eph11 = ephRes.proposals.find(p => p.arPos === 11);
const eph16 = ephRes.proposals.find(p => p.arPos === 16);
assert(
  Boolean(eph11 && eph11.status === 'PENDING_REVIEW' && eph16 && eph16.status === 'PENDING_REVIEW' && eph16.alternatives.length === 2),
  'Negative Gate 2: Eph 1:21 #11 & #16 («فِي», ἐν @ w16/w22) strictly demoted to PENDING_REVIEW with 2 competing alternatives',
  JSON.stringify({ eph11: eph11 && eph11.ruleId, eph16: eph16 && eph16.ruleId })
);

// 3. Negative Gate: Whole-verse bijectivity guard when two Arabic rows claim the same unique token
const syntheticRows = [
  { id: 'syn1', arPos: 1, arWord: 'أ', strongsId: 'G5231', origWord: 'ὑπεράνω', origSurface: 'ὑπεράνω', origPos: 9, origMorph: null, morphPos: null, verifiedLocator: 'SBLGNT:B49.C1.V21.w9', verifiedSource: 'morphgnt_sblgnt', morphSource: 'morphgnt_sblgnt', relationType: null, hasCleanPrimaryWms: false },
  { id: 'syn2', arPos: 2, arWord: 'ب', strongsId: 'G5231', origWord: 'ὑπεράνω', origSurface: 'ὑπεράνω', origPos: 10, origMorph: null, morphPos: null, verifiedLocator: 'SBLGNT:B49.C1.V21.w10', verifiedSource: 'morphgnt_sblgnt', morphSource: 'morphgnt_sblgnt', relationType: null, hasCleanPrimaryWms: false }
];
const synRes = evaluateVerse({ book: 49, ch: 1, vs: 21, lang: 'greek', name: 'Eph 1:21 (synthetic)' }, syntheticRows, sources);
assert(
  synRes.proposals.every(p => p.status === 'PENDING_REVIEW' && p.ruleId.includes('CONFLICT_SHARED_TARGET_TOKEN')),
  'Negative Gate 3: Competing claims on the same unique token (w1 ὑπεράνω) demote BOTH rows to PENDING_REVIEW',
  JSON.stringify(synRes.proposals.map(p => ({ arPos: p.arPos, status: p.status, ruleId: p.ruleId })))
);

// 4. Zero-Regression Test on Isolated Copy over R1 + R2 + R3 (742 records)
const r1M = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_15_verses_manifest.json'), 'utf8')).holdout_verses;
const r2M = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json'), 'utf8')).holdout_verses;
const r3M = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json'), 'utf8')).holdout_verses;

const calResults = [];
let autoModifiedCal = 0;
for (const v of [...r1M, ...r2M, ...r3M]) {
  const rows = loadVerseRows(prodDb, v.book, v.ch, v.vs);
  const res = evaluateVerse(v, rows, sources);
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

  assert(repR1.summary.cleanUnits === 253 && repR1.summary.alertedUnits === 0, `Non-Regression Gate 4: R1 remains 253/253 (0 alerts) after engine run (autoModifiedCal=${autoModifiedCal})`);
  assert(repR2.summary.cleanUnits === 255 && repR2.summary.alertedUnits === 0, `Non-Regression Gate 5: R2 remains 255/255 (0 alerts) after engine run`);
  assert(repR3.summary.cleanUnits === 233 && repR3.summary.alertedUnits === 1, `Non-Regression Gate 6: R3 remains 233/234 (1 documented Dan 5:2 alert) after engine run`);
} finally {
  for (const f of [isoDb, tmpR1, tmpR2, tmpR3]) { try { fs.unlinkSync(f); } catch (_) {} }
}

console.log('\n================================================================================');
console.log(`  GENERAL REPAIR ENGINE GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');
if (failed > 0) process.exit(1);
