/**
 * test_round2_batch2c_1thess5_18_gates.cjs
 * Positive & Negative Regression Gates for 1Thess 5:18 full-verse calibration (all 14 Arabic words -> 12 SBLGNT tokens):
 *   1. Positive: ALL 14 words of 1Thess 5:18 have 0 alerts across all 4 axes.
 *   2. Positive: Source Word Coverage: Exactly 12 unique SBLGNT tokens covered (w1..w12, shared w2 counted once).
 *   3. Positive: Compound phrase documentation: #3 ("كُلِّ") and #4 ("شَيْءٍ") share SBLGNT w2 with verified notes.
 *   4. Positive: Arabic copula pronoun #7 ("هِيَ") is AR_SYNTACTIC with zero Strong's/components.
 *   5. Negative: Collisions, stripped documentation, morph mismatches, missing components, or null fields MUST be rejected.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const prodDb = path.join(repoRoot, 'mobile/assets/bible_study.db');
const scratchDb = path.join(repoRoot, 'scratch/1thess518_neg_test.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/1thess518_gate_audit.json');
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
console.log('  ROUND 2 BATCH 2C (1THESS 5:18 FULL VERSE) POSITIVE & NEGATIVE GATES   ');
console.log('========================================================================\n');

const prodReport = runHoldoutAudit(prodDb);
const v18Alerts = (prodReport.alerts || []).filter(a => a.verse === '1Thess 5:18');
const v18Summary = (prodReport.perVerse || []).find(v => v.verse === '1Thess 5:18');

// 1. Positive Gate: All 14/14 words pass with 0 alerts
check('Positive: 1Thess 5:18 all 14/14 words pass with 0 alerts', Boolean(v18Summary && v18Summary.clean === 14 && v18Summary.alerts === 0 && v18Alerts.length === 0), JSON.stringify({ v18Summary, v18Alerts }));

// 2. Source Word Coverage Gate: Exactly 12 unique SBLGNT tokens covered (w1..w12)
const v18WordMappings = q(`
  SELECT wm.ar_word_position,
         (SELECT GROUP_CONCAT(COALESCE(wms.orig_word_position, '')) FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id)
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 52 AND vr.chapter_num = 5 AND vr.verse_num = 18;
`).replace(/\r/g, '').split('\n').filter(Boolean);

const coveredTokenPositions = new Set();
let sharedW2Count = 0;
for (const row of v18WordMappings) {
  const [pos, wPosStr] = row.split('|');
  if (wPosStr) {
    for (const p of wPosStr.split(',')) {
      const pNum = parseInt(p, 10);
      if (pNum > 0) {
        if (pNum === 2) sharedW2Count++;
        coveredTokenPositions.add(pNum);
      }
    }
  }
}
const all12Present = Array.from({ length: 12 }, (_, i) => i + 1).every(w => coveredTokenPositions.has(w));
check('Positive: 1Thess 5:18 covers all 12 unique SBLGNT tokens (with shared w2 counted once)', all12Present && coveredTokenPositions.size === 12 && sharedW2Count === 2, `covered=${coveredTokenPositions.size}, sharedW2Count=${sharedW2Count}`);

// 3. Positive Gate: Compound phrase documentation for #3 and #4
const compDocs = q(`
  SELECT ar_word_position, relation_type, grammar_notes
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 52 AND vr.chapter_num = 5 AND vr.verse_num = 18 AND ar_word_position IN (3, 4);
`).replace(/\r/g, '').split('\n').filter(Boolean);
const compValid = compDocs.length === 2 && compDocs.every(r => r.includes('compound_phrase') && r.includes('Shared phrase'));
check('Positive: 1Thess 5:18 "كُلِّ شَيْءٍ" documented as compound_phrase shared unit', compValid, JSON.stringify(compDocs));

// 4. Positive Gate: Arabic copula pronoun #7 ("هِيَ")
const copulaRow = q(`
  SELECT wm.strongs_id, wm.orig_word_position, wm.morph_source, wm.verified_locator,
         (SELECT COUNT(*) FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id) as comp_count
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 52 AND vr.chapter_num = 5 AND vr.verse_num = 18 AND ar_word_position = 7;
`).replace(/\r/g, '').trim();
check('Positive: 1Thess 5:18 #7 "هِيَ" is AR_SYNTACTIC with zero Strongs and zero components', copulaRow === '||syntactic_ar|AR_SYNTACTIC:B52.C5.V18.w7|0', copulaRow);

// Negative Regressions
const regressions = [
  {
    name: 'Negative: reverting 1Thess 5:18 #1 ("اشْكُرُوا") to w1 collision with #2 is rejected',
    pos: 1,
    sql: `UPDATE word_mappings SET orig_word_position=1, verified_locator='SBLGNT:B52.C5.V18.w1' WHERE id='78a57302-5f20-4f9b-b910-36c3e284e464';`
  },
  {
    name: 'Negative: stripping compound_phrase documentation from #3 ("كُلِّ") triggers collision alert on #4 and is rejected',
    pos: 4,
    sql: `UPDATE word_mappings SET relation_type=NULL, grammar_notes=NULL WHERE id='391e5d2a-d4e9-4f6f-a918-6923f0f5f3a4';`
  },
  {
    name: 'Negative: stripping compound_phrase documentation from #4 ("شَيْءٍ") triggers collision alert and is rejected',
    pos: 4,
    sql: `UPDATE word_mappings SET relation_type=NULL, grammar_notes=NULL WHERE id='af596d93-745f-4d25-b171-4f3bec428177';`
  },
  {
    name: 'Negative: reverting #6 ("هذِهِ") to w6 collision with #8 is rejected',
    pos: 6,
    sql: `UPDATE word_mappings SET orig_word_position=6, verified_locator='SBLGNT:B52.C5.V18.w6' WHERE id='ae4053bb-610d-49a8-8db4-5349910f4490';`
  },
  {
    name: 'Negative: reverting #11 ("الْمَسِيحِ") morph_pos to proper_noun triggers morphology alert and is rejected',
    pos: 11,
    sql: `UPDATE word_mappings SET morph_pos='proper_noun' WHERE id='14f3f99b-d7b6-4c5b-ba5f-a32fa321997e';`
  },
  {
    name: 'Negative: reverting #12 ("يَسُوعَ") morph_pos to proper_noun triggers morphology alert and is rejected',
    pos: 12,
    sql: `UPDATE word_mappings SET morph_pos='proper_noun' WHERE id='b870736f-6a21-4e18-b12e-1385c4ff39c5';`
  },
  {
    name: 'Negative: deleting component #14 ("جِهَتِكُمْ") G4771 from word_mapping_strongs is rejected',
    pos: 14,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id='c91b0e79-ffaf-440f-b52f-1d0743037f69';`
  },
  {
    name: 'Negative: blanking mandatory fields on #3 ("كُلِّ") G3956 in word_mapping_strongs is rejected',
    pos: 3,
    sql: `UPDATE word_mapping_strongs SET orig_component=NULL, orig_morphology=NULL, morph_source=NULL WHERE mapping_id='391e5d2a-d4e9-4f6f-a918-6923f0f5f3a4';`
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    fs.copyFileSync(prodDb, scratchDb);
    execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
    const rep = runHoldoutAudit(scratchDb);
    const al = (rep.alerts || []).find(a => a.verse === '1Thess 5:18' && a.pos === reg.pos);
    check(reg.name, Boolean(al), 'no alert');
  }
} finally {
  if (fs.existsSync(scratchDb)) fs.unlinkSync(scratchDb);
  if (fs.existsSync(scratchAuditOut)) fs.unlinkSync(scratchAuditOut);
}

console.log(`\nSUMMARY: ${passed}/${total} 1Thess 5:18 full-verse positive & negative gates passed.`);
if (passed !== total) process.exit(1);
