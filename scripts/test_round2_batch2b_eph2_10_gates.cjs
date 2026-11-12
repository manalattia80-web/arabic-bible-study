/**
 * test_round2_batch2b_eph2_10_gates.cjs
 * Positive & Negative Regression Gates for Eph 2:10 full-verse repair (all 16 Arabic words):
 *   1. Positive: ALL 16 words of Eph 2:10 have 0 alerts across all 4 axes.
 *   2. Negative: Reverting #11 ("سَبَقَ") to G4300 @ TR w11, reverting #6 ("الْمَسِيحِ") to w6 collision,
 *      or stripping compound_phrase notes from #13 ("فَأَعَدَّهَا") MUST be rejected.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const prodDb = path.join(repoRoot, 'mobile/assets/bible_study.db');
const scratchDb = path.join(repoRoot, 'scratch/eph210_neg_test.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/eph210_gate_audit.json');
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
console.log('  ROUND 2 BATCH 2B (EPH 2:10 FULL VERSE) POSITIVE & NEGATIVE GATES      ');
console.log('========================================================================\n');

const prodReport = runHoldoutAudit(prodDb);
const ephAlerts = (prodReport.alerts || []).filter(a => a.verse === 'Eph 2:10');
const ephSummary = (prodReport.perVerse || []).find(v => v.verse === 'Eph 2:10');

check('Positive: Eph 2:10 all 16/16 words pass with 0 alerts', Boolean(ephSummary && ephSummary.clean === 16 && ephSummary.alerts === 0 && ephAlerts.length === 0), JSON.stringify({ ephSummary, ephAlerts }));

const regressions = [
  {
    name: 'Negative: reverting Eph 2:10 #11 ("سَبَقَ") to G4300 @ TR w11 is rejected',
    pos: 11,
    sql: `UPDATE word_mappings SET strongs_id='G4300', orig_word_position=11, orig_word='προκυρόω', orig_surface='προκυρόω', orig_morphology=NULL, morph_source='morphgnt_tr', verified_locator='TR:B49.C2.V10.w11' WHERE id='5a3d134f-f79a-449f-8267-b54dec4486ea';`
  },
  {
    name: 'Negative: reverting Eph 2:10 #6 ("الْمَسِيحِ") to w6 collision is rejected',
    pos: 6,
    sql: `UPDATE word_mappings SET orig_word_position=6, verified_locator='SBLGNT:B49.C2.V10.w6' WHERE id='4b5700af-89f2-4475-a33b-1dd20f3b7deb';`
  },
  {
    name: 'Negative: stripping compound_phrase documentation from Eph 2:10 #13 ("فَأَعَدَّهَا") is rejected',
    pos: 13,
    sql: `UPDATE word_mappings SET relation_type=NULL, grammar_notes=NULL WHERE id='9d7ed063-cfcc-43b7-9baa-bbea733081f4';`
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    fs.copyFileSync(prodDb, scratchDb);
    execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
    const rep = runHoldoutAudit(scratchDb);
    const al = (rep.alerts || []).find(a => a.verse === 'Eph 2:10' && a.pos === reg.pos);
    check(reg.name, Boolean(al), 'no alert');
  }
} finally {
  if (fs.existsSync(scratchDb)) fs.unlinkSync(scratchDb);
  if (fs.existsSync(scratchAuditOut)) fs.unlinkSync(scratchAuditOut);
}

console.log(`\nSUMMARY: ${passed}/${total} Eph 2:10 full-verse positive & negative gates passed.`);
if (passed !== total) process.exit(1);
