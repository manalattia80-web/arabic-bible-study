/**
 * test_round2_batch2e_lk6_31_gates.cjs
 * Positive & Negative Regression Gates for Luke 6:31 full-verse calibration (11 Arabic words -> 11 SBLGNT tokens):
 *   1. Positive: ALL 11 words of Luke 6:31 have 0 alerts across all 4 axes.
 *   2. Positive: Source Token Coverage: Exactly 11 unique SBLGNT tokens covered (w1..w11) with zero collisions.
 *   3. Positive: Word #1 ("وَكَمَا") has primary G2531 @ w2 (καθὼς) + secondary G2532 @ w1 (καὶ).
 *   4. Positive: Word #5 ("النَّاسُ") has primary G444 @ w8 (ἄνθρωποι) + secondary G3588 @ w7 (οἱ).
 *   5. Positive: Words #8 ("أَنْتُمْ") & #9 ("أَيْضًا") verified as syntactic_ar with Strong's NULL, pos 0, locator AR_SYNTACTIC.
 *   6. Positive: Word #11 ("هكَذَا") correctly classified as adverb G3668 @ w11 (ὁμοίως) with cleared verb flags.
 *   7. Negative: Deleting secondary components from #1 or #5, adding artificial Strong's to #8 or #9, token collisions, or NULL mandatory fields MUST be rejected.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const prodDb = path.join(repoRoot, 'mobile/assets/bible_study.db');
const scratchDb = path.join(repoRoot, 'scratch/lk631_neg_test.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/lk631_gate_audit.json');
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
console.log('  ROUND 2 BATCH 2E (LUKE 6:31 FULL VERSE) POSITIVE & NEGATIVE GATES     ');
console.log('========================================================================\n');

const prodReport = runHoldoutAudit(prodDb);
const lkAlerts = (prodReport.alerts || []).filter(a => a.verse === 'Luke 6:31');
const lkSummary = (prodReport.perVerse || []).find(v => v.verse === 'Luke 6:31');

// 1. Positive Gate: All 11/11 words pass with 0 alerts across all 4 axes
check('Positive: Luke 6:31 all 11/11 words pass with 0 alerts', Boolean(lkSummary && lkSummary.clean === 11 && lkSummary.alerts === 0 && lkAlerts.length === 0), JSON.stringify({ lkSummary, lkAlerts }));

// 2. Source Token Coverage Gate: Exactly 11 unique SBLGNT tokens covered (w1..w11)
const lkWordMappings = q(`
  SELECT wm.ar_word_position,
         (SELECT GROUP_CONCAT(COALESCE(wms.orig_word_position, '')) FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id)
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 42 AND vr.chapter_num = 6 AND vr.verse_num = 31;
`).replace(/\r/g, '').split('\n').filter(Boolean);

const coveredTokenPositions = new Set();
for (const row of lkWordMappings) {
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
const all11Present = Array.from({ length: 11 }, (_, i) => i + 1).every(w => coveredTokenPositions.has(w));
check('Positive: Luke 6:31 covers all 11 unique SBLGNT tokens (w1..w11)', all11Present && coveredTokenPositions.size === 11, `covered=${coveredTokenPositions.size}`);

// 3. Positive Gate: Word #1 ("وَكَمَا") has primary G2531 @ w2 + secondary G2532 @ w1
const w1Comps = q(`
  SELECT wms.strongs_id, wms.link_role, wms.link_order, wms.orig_word_position, wms.orig_component, wms.orig_morphology, wms.morph_source
  FROM word_mapping_strongs wms
  WHERE wms.mapping_id = '9fe17080-ecd7-4181-8c73-a66a228a52f6'
  ORDER BY wms.link_order;
`).replace(/\r/g, '').split('\n').filter(Boolean);
check('Positive: Luke 6:31 #1 "وَكَمَا" has exact primary G2531@w2 and secondary G2532@w1',
  w1Comps.length === 2 &&
  w1Comps[0] === 'G2531|primary|1|2|καθὼς|C- --------|morphgnt_sblgnt' &&
  w1Comps[1] === 'G2532|secondary|2|1|καὶ|C- --------|morphgnt_sblgnt',
  JSON.stringify(w1Comps)
);

// 4. Positive Gate: Word #5 ("النَّاسُ") has primary G444 @ w8 + secondary G3588 @ w7
const w5Comps = q(`
  SELECT wms.strongs_id, wms.link_role, wms.link_order, wms.orig_word_position, wms.orig_component, wms.orig_morphology, wms.morph_source
  FROM word_mapping_strongs wms
  WHERE wms.mapping_id = '0d081881-37cc-4347-a150-ecc1a6a9d2c5'
  ORDER BY wms.link_order;
`).replace(/\r/g, '').split('\n').filter(Boolean);
check('Positive: Luke 6:31 #5 "النَّاسُ" has exact primary G444@w8 and secondary G3588@w7',
  w5Comps.length === 2 &&
  w5Comps[0] === 'G444|primary|1|8|ἄνθρωποι|N- ----NPM-|morphgnt_sblgnt' &&
  w5Comps[1] === 'G3588|secondary|2|7|οἱ|RA ----NPM-|morphgnt_sblgnt',
  JSON.stringify(w5Comps)
);

// 5. Positive Gate: Words #8 ("أَنْتُمْ") & #9 ("أَيْضًا") verified as syntactic_ar
const w8Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, morph_pos, morph_source, verified_locator FROM word_mappings WHERE id = 'cc9446e6-7ab1-4fbf-9001-3a797ad7ba5d';`).replace(/\r/g, '').trim();
const w9Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, morph_pos, morph_source, verified_locator FROM word_mappings WHERE id = '12dcc33f-43f9-4742-b26a-8051b97ab63e';`).replace(/\r/g, '').trim();
check('Positive: Luke 6:31 #8 "أَنْتُمْ" is pure syntactic_ar', w8Row === '|0|—|—|syntactic_ar|syntactic_ar|AR_SYNTACTIC:B42.C6.V31.w8', w8Row);
check('Positive: Luke 6:31 #9 "أَيْضًا" is pure syntactic_ar', w9Row === '|0|—|—|syntactic_ar|syntactic_ar|AR_SYNTACTIC:B42.C6.V31.w9', w9Row);

// 6. Positive Gate: Word #11 ("هكَذَا") verified as adverb G3668 @ w11 (ὁμοίως) with verb fields cleared
const w11Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_tense, verified_locator FROM word_mappings WHERE id = '0b38cad7-56fa-44dd-ac5a-23f6115fd0ce';`).replace(/\r/g, '').trim();
check('Positive: Luke 6:31 #11 "هكَذَا" is adverb G3668 @ w11 (ὁμοίως) with morph_tense NULL', w11Row === 'G3668|11|ὁμοίως|ὁμοίως|D- --------|adverb||SBLGNT:B42.C6.V31.w11', w11Row);

// Negative Regressions
const regressions = [
  {
    name: 'Negative: deleting secondary component G2532 (καὶ @ w1) from #1 ("وَكَمَا") is rejected',
    pos: 1,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id='9fe17080-ecd7-4181-8c73-a66a228a52f6' AND strongs_id='G2532';`
  },
  {
    name: 'Negative: deleting secondary component G3588 (οἱ @ w7) from #5 ("النَّاسُ") is rejected',
    pos: 5,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id='0d081881-37cc-4347-a150-ecc1a6a9d2c5' AND strongs_id='G3588';`
  },
  {
    name: 'Negative: artificially attaching Strongs G5210 to syntactic #8 ("أَنْتُمْ") is rejected',
    pos: 8,
    sql: `UPDATE word_mappings SET strongs_id='G5210', orig_word_position=10, orig_word='ὑμεῖς', orig_surface='ὑμεῖς', orig_morphology='RP ----NP--', morph_pos='pronoun', morph_source='morphgnt_tr', verified_locator='TR_SCRIVENER:B42.C6.V31.w10' WHERE id='cc9446e6-7ab1-4fbf-9001-3a797ad7ba5d';`
  },
  {
    name: 'Negative: artificially attaching Strongs G2532 to syntactic #9 ("أَيْضًا") is rejected',
    pos: 9,
    sql: `UPDATE word_mappings SET strongs_id='G2532', orig_word_position=9, orig_word='καί', orig_surface='καὶ', orig_morphology='C- --------', morph_pos='conjunction', morph_source='morphgnt_tr', verified_locator='TR_SCRIVENER:B42.C6.V31.w9' WHERE id='12dcc33f-43f9-4742-b26a-8051b97ab63e';`
  },
  {
    name: 'Negative: token collision by mapping #2 to w2 (already claimed by #1) is rejected',
    pos: 2,
    sql: `UPDATE word_mappings SET orig_word_position=2, verified_locator='SBLGNT:B42.C6.V31.w2' WHERE id='e79ec7c6-c1ee-4077-8bab-4b13015d816f';`
  },
  {
    name: 'Negative: blanking mandatory component fields on #1 ("وَكَمَا") is rejected',
    pos: 1,
    sql: `UPDATE word_mapping_strongs SET orig_component=NULL, orig_morphology=NULL WHERE mapping_id='9fe17080-ecd7-4181-8c73-a66a228a52f6' AND strongs_id='G2531';`
  },
  {
    name: 'Negative: blanking mandatory component fields on #5 ("النَّاسُ") is rejected',
    pos: 5,
    sql: `UPDATE word_mapping_strongs SET orig_component=NULL, orig_morphology=NULL WHERE mapping_id='0d081881-37cc-4347-a150-ecc1a6a9d2c5' AND strongs_id='G444';`
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    fs.copyFileSync(prodDb, scratchDb);
    execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
    const rep = runHoldoutAudit(scratchDb);
    const al = (rep.alerts || []).find(a => a.verse === 'Luke 6:31' && a.pos === reg.pos);
    check(reg.name, Boolean(al), 'no alert generated');
  }
} finally {
  if (fs.existsSync(scratchDb)) fs.unlinkSync(scratchDb);
  if (fs.existsSync(scratchAuditOut)) fs.unlinkSync(scratchAuditOut);
}

console.log(`\nSUMMARY: ${passed}/${total} Luke 6:31 full-verse positive & negative gates passed.`);
if (passed !== total) process.exit(1);
