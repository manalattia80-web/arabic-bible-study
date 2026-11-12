/**
 * test_round2_batch2a_gates.cjs
 * Positive & Negative Regression Gates for Round 2 Batch 2A (4 zero-collision repairs):
 *   1. Positive: Mic 7:18 #2, 1Thess 5:18 #7, Dan 6:22 #3, Rom 5:8 #11 have 0 alerts in calibrated 4-axis audit.
 *   2. Negative: Reverting any of the 4 rows to its pre-repair broken state
 *      MUST be rejected by audit_unseen_holdout_sample.cjs.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const prodDb = path.join(repoRoot, 'mobile/assets/bible_study.db');
const scratchDb = path.join(repoRoot, 'scratch/batch2a_neg_test.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/batch2a_gate_audit.json');
const auditScript = path.join(__dirname, 'audit_unseen_holdout_sample.cjs');
const manifestPath = path.join(__dirname, 'unseen_holdout_round2_15_verses_manifest.json');

function runHoldoutAudit(dbFile) {
  execFileSync(process.execPath, [
    auditScript,
    '--manifest', manifestPath,
    '--out', scratchAuditOut
  ], {
    env: { ...process.env, AUDIT_DB_PATH: dbFile },
    stdio: 'ignore'
  });
  return JSON.parse(fs.readFileSync(scratchAuditOut, 'utf8'));
}

let passed = 0, total = 0;
function check(name, cond, detail) {
  total++;
  if (cond) {
    passed++;
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    console.error(`  ✗ [FAIL] ${name} -> ${detail}`);
  }
}

console.log('========================================================================');
console.log('  ROUND 2 BATCH 2A (4 REPAIRS) POSITIVE & NEGATIVE REGRESSION GATES     ');
console.log('========================================================================\n');

const prodReport = runHoldoutAudit(prodDb);
const findAlert = (rep, verse, pos) => (rep.alerts || []).find(a => a.verse === verse && a.pos === pos);

check('Positive: Mic 7:18 #2 ("هُوَ" AR_SYNTACTIC) has 0 alerts', !findAlert(prodReport, 'Mic 7:18', 2), JSON.stringify(findAlert(prodReport, 'Mic 7:18', 2)));
check('Positive: 1Thess 5:18 #7 ("هِيَ" AR_SYNTACTIC) has 0 alerts', !findAlert(prodReport, '1Thess 5:18', 7), JSON.stringify(findAlert(prodReport, '1Thess 5:18', 7)));
check('Positive: Dan 6:22 #3 ("مَلاَكَهُ" H4398@Dan.6.23.w3) has 0 alerts', !findAlert(prodReport, 'Dan 6:22', 3), JSON.stringify(findAlert(prodReport, 'Dan 6:22', 3)));
check('Positive: Rom 5:8 #11 ("الْمَسِيحُ" G5547@w15) has 0 alerts', !findAlert(prodReport, 'Rom 5:8', 11), JSON.stringify(findAlert(prodReport, 'Rom 5:8', 11)));

const regressions = [
  {
    name: 'Negative: reverting Mic 7:18 #2 to H1931 @ w2 is rejected',
    verse: 'Mic 7:18',
    pos: 2,
    sql: `UPDATE word_mappings SET strongs_id = 'H1931', orig_word_position = 2, orig_word = 'הוּא', orig_surface = 'הֽוּא', orig_morphology = 'HPp3ms', morph_pos = 'pronoun', morph_source = 'oshb_wlc', verified_locator = 'OSHB:B33.C7.V18.w2' WHERE id = '3c23060b-d45b-4621-a72f-57859eaad186';`
  },
  {
    name: 'Negative: reverting 1Thess 5:18 #7 to G3778 @ w7 is rejected',
    verse: '1Thess 5:18',
    pos: 7,
    sql: `UPDATE word_mappings SET strongs_id = 'G3778', orig_word_position = 7, orig_word = 'οὗτος', orig_surface = 'τοῦτο', orig_morphology = 'RD ----NSN-', morph_pos = 'demonstrative', morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B52.C5.V18.w7' WHERE id = 'bbbd4fb0-6d57-4936-ab48-c9569e591a94';`
  },
  {
    name: 'Negative: reverting Dan 6:22 #3 to H4305 @ Dan.6.22.w3 is rejected',
    verse: 'Dan 6:22',
    pos: 3,
    sql: `UPDATE word_mappings SET strongs_id = 'H4305', orig_word = 'מָטַר', orig_surface = 'מָטַר', orig_morphology = NULL, morph_pos = 'verb', verified_locator = 'OSHB:B27.C6.V22.w3' WHERE id = '577077bd-a7dc-4d40-90ee-b06bb509df43';`
  },
  {
    name: 'Negative: reverting Rom 5:8 #11 to G5547 @ w11 is rejected',
    verse: 'Rom 5:8',
    pos: 11,
    sql: `UPDATE word_mappings SET orig_word_position = 11, verified_locator = 'SBLGNT:B45.C5.V8.w11' WHERE id = 'd6a222c5-3fa4-408f-bdac-04d2ceea6b42';`
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    fs.copyFileSync(prodDb, scratchDb);
    execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
    const rep = runHoldoutAudit(scratchDb);
    const al = findAlert(rep, reg.verse, reg.pos);
    check(reg.name, Boolean(al && (al.axes.lexical.length > 0 || al.axes.lemmaSurface.length > 0 || al.axes.sourceLocator.length > 0)), al ? JSON.stringify(al.axes) : 'no alert');
  }
} finally {
  if (fs.existsSync(scratchDb)) fs.unlinkSync(scratchDb);
  if (fs.existsSync(scratchAuditOut)) fs.unlinkSync(scratchAuditOut);
}

console.log(`\nSUMMARY: ${passed}/${total} Round 2 Batch 2A positive & negative gates passed.`);
if (passed !== total) process.exit(1);
