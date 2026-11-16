/**
 * scripts/test_round1_holdout_gate.cjs
 *
 * Dedicated CI Regression Quality Gate for Round 1 Holdout Sample (253 units across 15 unseen verses):
 *
 * 1. Zero-Alert Gate: The entire Round 1 holdout sample (15 verses, 253 units) MUST be 253/253 clean with 0 alerts.
 * 2. Strict Pronoun Verification for 4 Calibrated Records:
 *    - Lev 19:18 #11 ("كَنَفْسِكَ"):  HR/Sp2ms -> person: 2, gender: masculine, number: singular
 *    - Josh 24:15 #9 ("لأَنْفُسِكُمُ"): HR/Sp2mp -> person: 2, gender: masculine, number: plural
 *    - Ezra 4:12 #8  ("عِنْدِكَ"):    AR/Sp2ms -> person: 2, gender: masculine, number: singular
 *    - Ezra 4:12 #9  ("إِلَيْنَا"):    AR/Sp1cp -> person: 1, gender: common,    number: plural
 * 3. Negative Regressions (isolated DB copies):
 *    - Blanking or corrupting any of the 4 pronoun records MUST trigger a morphology alert and be rejected.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const auditScript = path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs');
const r1ManifestPath = path.join(repoRoot, 'scripts/unseen_holdout_15_verses_manifest.json');
const scratchDb = path.join(repoRoot, 'scratch/round1_gate_scratch.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/round1_gate_audit.json');

function q(sql, targetDb = dbPath) {
  return execFileSync(sqlitePath, [targetDb], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

let passCount = 0;
let failCount = 0;

function check(desc, condition, details = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${desc}`);
    passCount++;
  } else {
    console.error(`  ✗ [FAIL] ${desc}${details ? ` -> ${details}` : ''}`);
    failCount++;
  }
}

function runAudit(targetDb) {
  execFileSync(process.execPath, [
    auditScript,
    '--manifest', r1ManifestPath,
    '--out', scratchAuditOut
  ], {
    env: { ...process.env, AUDIT_DB_PATH: targetDb },
    stdio: 'ignore'
  });
  if (!fs.existsSync(scratchAuditOut)) {
    throw new Error(`Audit report not generated at: ${scratchAuditOut}`);
  }
  return JSON.parse(fs.readFileSync(scratchAuditOut, 'utf8'));
}

console.log('\n========================================================================');
console.log('  RUNNING ROUND 1 HOLDOUT 253-UNIT STRICT ZERO-ALERT GATE');
console.log('========================================================================\n');

// 1. Positive Gate: Round 1 Holdout MUST have 253/253 clean units with ZERO alerts
const r1Report = runAudit(dbPath);
const totalUnits = r1Report.summary ? r1Report.summary.totalUnits : 0;
const cleanUnits = r1Report.summary ? r1Report.summary.cleanUnits : 0;
const alertedUnits = r1Report.summary ? r1Report.summary.alertedUnits : -1;
const alertsCount = (r1Report.alerts || []).length;

check(
  'Positive: Round 1 Holdout sample has 253/253 clean units (100.0%)',
  totalUnits === 253 && cleanUnits === 253,
  `total=${totalUnits}, clean=${cleanUnits}`
);

check(
  'Positive: Round 1 Holdout sample has exactly ZERO alerts across all 4 axes',
  alertedUnits === 0 && alertsCount === 0,
  `alertedUnits=${alertedUnits}, alertsCount=${alertsCount}, alerts=${JSON.stringify(r1Report.alerts)}`
);

// 2. Direct Positive Assertions for 4 Calibrated Pronoun Records
const levRow = q(`
  SELECT wm.strongs_id, wm.orig_surface, wm.orig_morphology, wm.morph_pos, wm.morph_person, wm.morph_gender, wm.morph_number
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 3 AND v.chapter_num = 19 AND v.verse_num = 18 AND wm.ar_word_position = 11;
`);
check(
  'Positive: Lev 19:18 #11 "كَنَفْسِكَ" has derived Sp2ms (person=2, gender=masculine, number=singular)',
  levRow === 'H3644|כָּמ֑וֹךָ|HR/Sp2ms|preposition|2|masculine|singular',
  `row=${levRow}`
);

const joshRow = q(`
  SELECT wm.strongs_id, wm.orig_surface, wm.orig_morphology, wm.morph_pos, wm.morph_person, wm.morph_gender, wm.morph_number
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 6 AND v.chapter_num = 24 AND v.verse_num = 15 AND wm.ar_word_position = 9;
`);
check(
  'Positive: Josh 24:15 #9 "لأَنْفُسِكُمُ" has derived Sp2mp (person=2, gender=masculine, number=plural)',
  joshRow === 'H9005|לָכֶ֣ם|HR/Sp2mp|preposition|2|masculine|plural',
  `row=${joshRow}`
);

const ezra8Row = q(`
  SELECT wm.strongs_id, wm.orig_surface, wm.orig_morphology, wm.morph_pos, wm.morph_person, wm.morph_gender, wm.morph_number
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 15 AND v.chapter_num = 4 AND v.verse_num = 12 AND wm.ar_word_position = 8;
`);
check(
  'Positive: Ezra 4:12 #8 "عِنْدِكَ" has derived Sp2ms (person=2, gender=masculine, number=singular)',
  ezra8Row === 'H3890|לְוָתָ֔ךְ|AR/Sp2ms|preposition|2|masculine|singular',
  `row=${ezra8Row}`
);

const ezra9Row = q(`
  SELECT wm.strongs_id, wm.orig_surface, wm.orig_morphology, wm.morph_pos, wm.morph_person, wm.morph_gender, wm.morph_number
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 15 AND v.chapter_num = 4 AND v.verse_num = 12 AND wm.ar_word_position = 9;
`);
check(
  'Positive: Ezra 4:12 #9 "إِلَيْنَا" has derived Sp1cp (person=1, gender=common, number=plural)',
  ezra9Row === 'H5922|עֲלֶ֥ינָא|AR/Sp1cp|preposition|1|common|plural',
  `row=${ezra9Row}`
);

// 3. Negative Regressions (each runs on fresh scratch DB copy)
const regressions = [
  {
    name: 'Negative: Blanking morph_person on Lev 19:18 #11 ("كَنَفْسِكَ") is rejected',
    verse: 'Lev 19:18', pos: 11,
    sql: "UPDATE word_mappings SET morph_person = NULL WHERE verse_id = (SELECT id FROM verses WHERE book_id = 3 AND chapter_num = 19 AND verse_num = 18) AND ar_word_position = 11;"
  },
  {
    name: 'Negative: Setting conflicting gender feminine on Lev 19:18 #11 ("كَنَفْسِكَ") is rejected',
    verse: 'Lev 19:18', pos: 11,
    sql: "UPDATE word_mappings SET morph_gender = 'feminine' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 3 AND chapter_num = 19 AND verse_num = 18) AND ar_word_position = 11;"
  },
  {
    name: 'Negative: Blanking morph_number on Josh 24:15 #9 ("لأَنْفُسِكُمُ") is rejected',
    verse: 'Josh 24:15', pos: 9,
    sql: "UPDATE word_mappings SET morph_number = NULL WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 24 AND verse_num = 15) AND ar_word_position = 9;"
  },
  {
    name: 'Negative: Setting conflicting number singular on Josh 24:15 #9 ("لأَنْفُسِكُمُ") is rejected',
    verse: 'Josh 24:15', pos: 9,
    sql: "UPDATE word_mappings SET morph_number = 'singular' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 24 AND verse_num = 15) AND ar_word_position = 9;"
  },
  {
    name: 'Negative: Blanking morph_gender on Ezra 4:12 #8 ("عِنْدِكَ") is rejected',
    verse: 'Ezra 4:12', pos: 8,
    sql: "UPDATE word_mappings SET morph_gender = NULL WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 12) AND ar_word_position = 8;"
  },
  {
    name: 'Negative: Setting conflicting person 1 on Ezra 4:12 #8 ("عِنْدِكَ") is rejected',
    verse: 'Ezra 4:12', pos: 8,
    sql: "UPDATE word_mappings SET morph_person = '1' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 12) AND ar_word_position = 8;"
  },
  {
    name: 'Negative: Blanking morph_person on Ezra 4:12 #9 ("إِلَيْنَا") is rejected',
    verse: 'Ezra 4:12', pos: 9,
    sql: "UPDATE word_mappings SET morph_person = NULL WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 12) AND ar_word_position = 9;"
  },
  {
    name: 'Negative: Setting conflicting person 2 on Ezra 4:12 #9 ("إِلَيْنَا") is rejected',
    verse: 'Ezra 4:12', pos: 9,
    sql: "UPDATE word_mappings SET morph_person = '2' WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 12) AND ar_word_position = 9;"
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    try {
      fs.copyFileSync(dbPath, scratchDb);
      execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
      const rep = runAudit(scratchDb);
      const al = (rep.alerts || []).find(a => a.verse === reg.verse && a.pos === reg.pos);
      check(reg.name, Boolean(al), `Expected alert on ${reg.verse} pos ${reg.pos}, but none was generated`);
    } catch (err) {
      check(reg.name, false, `Runner/tool failure: ${err.message}`);
    }
  }
} finally {
  if (fs.existsSync(scratchDb)) fs.unlinkSync(scratchDb);
  if (fs.existsSync(scratchAuditOut)) fs.unlinkSync(scratchAuditOut);
}

console.log('\n========================================================================');
console.log(`  ROUND 1 HOLDOUT GATES SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL ${passCount + failCount})`);
console.log('========================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
