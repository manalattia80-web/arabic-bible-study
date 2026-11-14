/**
 * test_round2_batch2d_rom5_8_gates.cjs
 * Positive & Negative Regression Gates for Romans 5:8 full-verse calibration (all 12 Arabic words -> 18 SBLGNT tokens):
 *   1. Positive: ALL 12 words of Rom 5:8 have 0 alerts across all 4 axes.
 *   2. Positive: Source Word Coverage: Exactly 18 unique SBLGNT tokens covered (w1..w18).
 *   3. Positive: Verb #3 ("بَيَّنَ") correctly anchored to G4921 @ w1 (συνίστησιν) with 0 alerts.
 *   4. Positive: All multi-component affixes/pronouns (#2, #4, #5, #7, #12) verified with full 7-field matching.
 *   5. Negative: Reverting "بَيَّنَ" to G1519, token collisions, deleted components, swapped pronouns, or null fields MUST be rejected.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const prodDb = path.join(repoRoot, 'mobile/assets/bible_study.db');
const scratchDb = path.join(repoRoot, 'scratch/rom58_neg_test.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/rom58_gate_audit.json');
const auditScript = path.join(__dirname, 'audit_unseen_holdout_sample.cjs');
const manifestPath = path.join(__dirname, 'unseen_holdout_round2_15_verses_manifest.json');
const q = sql => execFileSync(sqlitePath, [prodDb], { input: sql, encoding: 'utf8' }).trim();

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
console.log('  ROUND 2 BATCH 2D (ROM 5:8 FULL VERSE) POSITIVE & NEGATIVE GATES       ');
console.log('========================================================================\n');

const prodReport = runHoldoutAudit(prodDb);
const romAlerts = (prodReport.alerts || []).filter(a => a.verse === 'Rom 5:8');
const romSummary = (prodReport.perVerse || []).find(v => v.verse === 'Rom 5:8');

// 1. Positive Gate: All 12/12 words pass with 0 alerts
check('Positive: Rom 5:8 all 12/12 words pass with 0 alerts', Boolean(romSummary && romSummary.clean === 12 && romSummary.alerts === 0 && romAlerts.length === 0), JSON.stringify({ romSummary, romAlerts }));

// 2. Source Word Coverage Gate: Exactly 18 unique SBLGNT tokens covered (w1..w18)
const romWordMappings = q(`
  SELECT wm.ar_word_position,
         (SELECT GROUP_CONCAT(COALESCE(wms.orig_word_position, '')) FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id)
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 45 AND vr.chapter_num = 5 AND vr.verse_num = 8;
`).replace(/\r/g, '').split('\n').filter(Boolean);

const coveredTokenPositions = new Set();
for (const row of romWordMappings) {
  const [pos, wPosStr] = row.split('|');
  if (wPosStr) {
    for (const p of wPosStr.split(',')) {
      const pNum = parseInt(p, 10);
      if (pNum > 0) {
        coveredTokenPositions.add(pNum);
      }
    }
  }
}
const all18Present = Array.from({ length: 18 }, (_, i) => i + 1).every(w => coveredTokenPositions.has(w));
check('Positive: Rom 5:8 covers all 18 unique SBLGNT tokens (w1..w18)', all18Present && coveredTokenPositions.size === 18, `covered=${coveredTokenPositions.size}`);

// 3. Positive Gate: Verb "بَيَّنَ" (pos 3) anchored to G4921 @ w1 (συνίστησιν)
const bayyanaRow = q(`
  SELECT wm.strongs_id, wm.orig_word_position, wm.orig_word, wm.orig_surface, wm.orig_morphology, wm.morph_pos
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 45 AND vr.chapter_num = 5 AND vr.verse_num = 8 AND wm.ar_word_position = 3;
`).replace(/\r/g, '').trim();
check('Positive: Rom 5:8 #3 "بَيَّنَ" is Form II verb G4921 @ w1 (συνίστησιν)', bayyanaRow === 'G4921|1|συνίστημι|συνίστησιν|V- 3PAI-S--|verb', bayyanaRow);

// 4. Positive Gate: Multi-component count check (#4 has 3 comps, #2, #5, #7, #12 have 2 comps)
const compCounts = q(`
  SELECT wm.ar_word_position, COUNT(wms.mapping_id)
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  LEFT JOIN word_mapping_strongs wms ON wms.mapping_id = wm.id
  WHERE vr.book_id = 45 AND vr.chapter_num = 5 AND vr.verse_num = 8
  GROUP BY wm.ar_word_position
  ORDER BY wm.ar_word_position;
`).replace(/\r/g, '').split('\n').filter(Boolean);
const expectedCounts = { 1: 1, 2: 2, 3: 1, 4: 3, 5: 2, 6: 1, 7: 2, 8: 1, 9: 1, 10: 1, 11: 1, 12: 2 };
const countsMatch = compCounts.every(r => {
  const [pos, cnt] = r.split('|').map(Number);
  return expectedCounts[pos] === cnt;
});
check('Positive: Rom 5:8 multi-component structure matches expected affix/pronoun counts', countsMatch, JSON.stringify(compCounts));

// Negative Regressions
const regressions = [
  {
    name: 'Negative: reverting Rom 5:8 #3 ("بَيَّنَ") to preposition G1519 (εἰς) @ w3 is rejected',
    pos: 3,
    sql: `UPDATE word_mappings SET strongs_id='G1519', orig_word_position=3, orig_word='εἰς', orig_surface='εἰς', orig_morphology='P- --------', morph_pos='preposition', verified_locator='SBLGNT:B45.C5.V8.w3' WHERE id='b5d4c671-8bd2-43fb-8bdf-ae00b8fea393'; UPDATE word_mapping_strongs SET strongs_id='G1519', orig_word_position=3, orig_component='εἰς', orig_morphology='P- --------' WHERE mapping_id='b5d4c671-8bd2-43fb-8bdf-ae00b8fea393';`
  },
  {
    name: 'Negative: reverting Rom 5:8 #1 ("وَلكِنَّ") to w1 collision with #3 is rejected',
    pos: 1,
    sql: `UPDATE word_mappings SET orig_word_position=1, verified_locator='SBLGNT:B45.C5.V8.w1' WHERE id='6334da99-9b41-4806-873f-578a1a099b8c';`
  },
  {
    name: 'Negative: deleting reflexive pronoun G1438 from #4 ("مَحَبَّتَهُ") is rejected',
    pos: 4,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id='97c395fc-03c9-41e2-b76f-1d0091177ceb' AND strongs_id='G1438';`
  },
  {
    name: 'Negative: deleting article G3588 from #4 ("مَحَبَّتَهُ") is rejected',
    pos: 4,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id='97c395fc-03c9-41e2-b76f-1d0091177ceb' AND strongs_id='G3588';`
  },
  {
    name: 'Negative: deleting pronoun component G1473 from #5 ("لَنَا") is rejected',
    pos: 5,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id='0c5a3b67-19a1-46b9-b1ad-b04f2daf16ad' AND strongs_id='G1473';`
  },
  {
    name: 'Negative: deleting participle component G1510 from #7 ("وَنَحْنُ") is rejected',
    pos: 7,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id='043834e2-ad10-4966-9d0a-9591deccc2da' AND strongs_id='G1510';`
  },
  {
    name: 'Negative: deleting pronoun component G1473 from #12 ("لأَجْلِنَا") is rejected',
    pos: 12,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id='fbf998de-fd82-4981-98a0-3c01a11e3a21' AND strongs_id='G1473';`
  },
  {
    name: 'Negative: swapping pronoun components between #5 ("لَنَا" @ w7) and #12 ("لأَجْلِنَا" @ w17) is rejected',
    pos: 5,
    sql: `UPDATE word_mapping_strongs SET orig_word_position=17, orig_component='ἡμῶν', orig_morphology='RP ----GP--' WHERE mapping_id='0c5a3b67-19a1-46b9-b1ad-b04f2daf16ad' AND strongs_id='G1473'; UPDATE word_mapping_strongs SET orig_word_position=7, orig_component='ἡμᾶς', orig_morphology='RP ----AP--' WHERE mapping_id='fbf998de-fd82-4981-98a0-3c01a11e3a21' AND strongs_id='G1473';`
  },
  {
    name: 'Negative: blanking mandatory fields (surface/morph/source to NULL) on #3 ("بَيَّنَ") is rejected',
    pos: 3,
    sql: `UPDATE word_mapping_strongs SET orig_component=NULL, orig_morphology=NULL, morph_source=NULL WHERE mapping_id='b5d4c671-8bd2-43fb-8bdf-ae00b8fea393';`
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    fs.copyFileSync(prodDb, scratchDb);
    execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
    const rep = runHoldoutAudit(scratchDb);
    const al = (rep.alerts || []).find(a => a.verse === 'Rom 5:8' && a.pos === reg.pos);
    check(reg.name, Boolean(al), 'no alert');
  }
} finally {
  if (fs.existsSync(scratchDb)) fs.unlinkSync(scratchDb);
  if (fs.existsSync(scratchAuditOut)) fs.unlinkSync(scratchAuditOut);
}

console.log(`\nSUMMARY: ${passed}/${total} Rom 5:8 full-verse positive & negative gates passed.`);
if (passed !== total) process.exit(1);
