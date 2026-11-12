/**
 * test_round2_batch1_gates.cjs
 * Positive & Negative Regression Gates for Round 2 Batch 1 (3 metadata-repair rows):
 *   1. Positive: Ruth 2:12 #7, 1Kgs 19:12 #8, Ezra 5:11 #14 have 0 alerts in calibrated 4-axis audit.
 *   2. Negative: Reverting any of the 3 rows to its pre-repair broken surface/morphology
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
const scratchDb = path.join(repoRoot, 'scratch/batch1_neg_test.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/batch1_gate_audit.json');
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
console.log('  ROUND 2 BATCH 1 (3 OSHB METADATA REPAIRS) POSITIVE & NEGATIVE GATES   ');
console.log('========================================================================\n');

// 1. Positive gate on production DB
const prodReport = runHoldoutAudit(prodDb);
const findAlert = (rep, verse, pos) => (rep.alerts || []).find(a => a.verse === verse && a.pos === pos);

check('Positive: Ruth 2:12 #7 has 0 alerts after OSHB metadata sync', !findAlert(prodReport, 'Ruth 2:12', 7), JSON.stringify(findAlert(prodReport, 'Ruth 2:12', 7)));
check('Positive: 1Kgs 19:12 #8 has 0 alerts after OSHB metadata sync', !findAlert(prodReport, '1Kgs 19:12', 8), JSON.stringify(findAlert(prodReport, '1Kgs 19:12', 8)));
check('Positive: Ezra 5:11 #14 has 0 alerts after OSHB metadata sync', !findAlert(prodReport, 'Ezra 5:11', 14), JSON.stringify(findAlert(prodReport, 'Ezra 5:11', 14)));

// 2. Negative regression gates on scratch DB copies
const regressions = [
  {
    name: 'Negative: reverting Ruth 2:12 #7 to מִן / NULL is rejected',
    verse: 'Ruth 2:12',
    pos: 7,
    sql: `UPDATE word_mappings SET orig_surface = 'מִן', orig_morphology = NULL WHERE id = 'f71adeb5-fd54-41be-926f-49bc65cedfa1';
          UPDATE word_mapping_strongs SET orig_component = 'מִן', orig_morphology = NULL WHERE mapping_id = 'f71adeb5-fd54-41be-926f-49bc65cedfa1' AND link_order = 1;`
  },
  {
    name: 'Negative: reverting 1Kgs 19:12 #8 to בָאֵ֖שׁ / HRd/Ncbsa is rejected',
    verse: '1Kgs 19:12',
    pos: 8,
    sql: `UPDATE word_mappings SET orig_surface = 'בָאֵ֖שׁ', orig_morphology = 'HRd/Ncbsa' WHERE id = 'e7d90c86-5a56-4648-9c31-fb73a381a990';
          UPDATE word_mapping_strongs SET orig_component = 'בָאֵ֖שׁ', orig_morphology = 'HRd/Ncbsa' WHERE mapping_id = 'e7d90c86-5a56-4648-9c31-fb73a381a990' AND link_order = 1;`
  },
  {
    name: 'Negative: reverting Ezra 5:11 #14 to אֲשֶׁר / NULL is rejected',
    verse: 'Ezra 5:11',
    pos: 14,
    sql: `UPDATE word_mappings SET orig_surface = 'אֲשֶׁר', orig_morphology = NULL WHERE id = '31fef1f3-6675-4590-83ad-df4c3eb15d5f';
          UPDATE word_mapping_strongs SET orig_component = 'אֲשֶׁר', orig_morphology = NULL WHERE mapping_id = '31fef1f3-6675-4590-83ad-df4c3eb15d5f' AND link_order = 1;`
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    fs.copyFileSync(prodDb, scratchDb);
    execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
    const rep = runHoldoutAudit(scratchDb);
    const al = findAlert(rep, reg.verse, reg.pos);
    check(reg.name, Boolean(al && (al.axes.lemmaSurface.length > 0 || al.axes.morphology.length > 0)), al ? JSON.stringify(al.axes) : 'no alert');
  }
} finally {
  if (fs.existsSync(scratchDb)) fs.unlinkSync(scratchDb);
  if (fs.existsSync(scratchAuditOut)) fs.unlinkSync(scratchAuditOut);
}

console.log(`\nSUMMARY: ${passed}/${total} Round 2 Batch 1 positive & negative gates passed.`);
if (passed !== total) process.exit(1);
