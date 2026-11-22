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

// 2. Negative Gate: Eph 1:21 duplicate occurrence (ἐν x2: w16 & w22)
const ephRows = loadVerseRows(prodDb, 49, 1, 21).map(r => ({ ...r, grammarNotes: null }));
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
