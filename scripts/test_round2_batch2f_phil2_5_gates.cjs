/**
 * scripts/test_round2_batch2f_phil2_5_gates.cjs
 *
 * Comprehensive Positive & Negative Regression Gates for Philippians 2:5 (Batch 2F):
 *
 * Positive:
 * 1. All 9/9 words in Phil 2:5 pass with 0 alerts in strict 4-axis audit.
 * 2. Full SBLGNT token coverage: w1..w9 covered (100% token coverage).
 * 3. #1 "فَلْيَكُنْ" is pure syntactic_ar with zero Strongs, zero components, and explanatory note.
 * 4. #2 "فِيكُمْ" has exact primary G1722@w3 and secondary G4771@w4.
 * 5. #3 "هذَا" is G3778 @ w1 (τοῦτο).
 * 6. #4 "الْفِكْرُ" is G5426 @ w2 (φρονεῖτε).
 * 7. #7 "الْمَسِيحِ" & #8 "يَسُوعَ" are nouns per SBLGNT N- category.
 * 8. #9 "أَيْضًا" is G2532 @ w6 (καὶ).
 *
 * Negative:
 * 9.  Reverting #1 to fake G1510@w1 is rejected with lexical/surface alerts.
 * 10. Reverting #2 to w2 collision with #4 is rejected.
 * 11. Deleting secondary G4771 from #2 is rejected.
 * 12. Converting required #4 "الْفِكْرُ" to syntactic_ar is rejected (auditor gap test).
 * 13. Converting required #3 "هذَا" to syntactic_ar is rejected.
 * 14. Token collision by mapping #3 to w2 is rejected.
 * 15. Reverting #7 "الْمَسِيحِ" morph_pos to proper_noun is rejected.
 * 16. Blanking mandatory component fields on #2 "فِيكُمْ" is rejected.
 * 17. Blanking mandatory component fields on #4 "الْفِكْرُ" is rejected.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const sqlitePath = path.join(repoRoot, 'sqlite_dist/sqlite3.exe');
const auditScript = path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs');
const manifestPath = path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json');

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

console.log('========================================================================');
console.log('  ROUND 2 BATCH 2F (PHIL 2:5 FULL VERSE) POSITIVE & NEGATIVE GATES      ');
console.log('========================================================================\n');

// 1. Positive Gate: Phil 2:5 9/9 clean in strict 4-axis audit
const nodePath = process.execPath;
const auditOut = execSync(
  `"${nodePath}" ${auditScript} --manifest ${manifestPath}`,
  { cwd: repoRoot, encoding: 'utf8', env: process.env }
);
const philMatch = auditOut.match(/Phil 2:5\s+\[greek\s*\]:\s*clean\s*(\d+)\/(\d+)\s*\(([\d\.]+)%\)\s*\|\s*axes\(([^)]+)\)/);
const cleanCount = philMatch ? parseInt(philMatch[1], 10) : 0;
const totalCount = philMatch ? parseInt(philMatch[2], 10) : 0;
check('Positive: Phil 2:5 all 9/9 words pass with 0 alerts', cleanCount === 9 && totalCount === 9, `clean=${cleanCount}/${totalCount}`);

// 2. Positive Gate: SBLGNT token coverage w1..w9
const philWordMappings = q(`
  SELECT wm.ar_word_position || '|' || wm.verified_locator || '|' ||
         COALESCE((SELECT GROUP_CONCAT(wms.orig_word_position) FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id), '')
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 50 AND vr.chapter_num = 2 AND vr.verse_num = 5
  ORDER BY wm.ar_word_position;
`).split('\n').filter(Boolean);

const coveredSblgnt = new Set();
for (const row of philWordMappings) {
  const [pos, loc, wPosStr] = row.split('|');
  if (loc && loc.startsWith('SBLGNT:') && wPosStr) {
    for (const p of wPosStr.split(',')) {
      const pNum = parseInt(p, 10);
      if (pNum > 0) coveredSblgnt.add(pNum);
    }
  }
}
const all9Present = Array.from({ length: 9 }, (_, i) => i + 1).every(w => coveredSblgnt.has(w));
check('Positive: Phil 2:5 covers all 9 unique SBLGNT tokens (w1..w9)', all9Present && coveredSblgnt.size === 9, `covered=${coveredSblgnt.size}`);

// 3. Positive Gate: #1 "فَلْيَكُنْ" is pure syntactic_ar
const w1Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, morph_pos, morph_source, verified_locator FROM word_mappings WHERE id = '01358317-4af5-490f-94ee-d1630cc52e4e';`);
const w1Comps = q(`SELECT COUNT(*) FROM word_mapping_strongs WHERE mapping_id = '01358317-4af5-490f-94ee-d1630cc52e4e';`);
check('Positive: Phil 2:5 #1 "فَلْيَكُنْ" is pure syntactic_ar with zero Strongs and zero components',
  w1Row === '|0|—|—|syntactic_ar|syntactic_ar|AR_SYNTACTIC:B50.C2.V5.w1' && w1Comps === '0',
  `row=${w1Row}, comps=${w1Comps}`
);

// 4. Positive Gate: #2 "فِيكُمْ" has primary G1722@w3 and secondary G4771@w4
const w2Comps = q(`
  SELECT link_order || '|' || strongs_id || '|' || link_role || '|' || orig_word_position || '|' || orig_component || '|' || orig_morphology || '|' || morph_source
  FROM word_mapping_strongs
  WHERE mapping_id = '26e7f5f7-52db-4ae4-8a86-3f14d573e46d'
  ORDER BY link_order;
`).split('\n').filter(Boolean);
check('Positive: Phil 2:5 #2 "فِيكُمْ" has exact primary G1722@w3 and secondary G4771@w4',
  w2Comps.length === 2 &&
  w2Comps[0] === '1|G1722|primary|3|ἐν|P- --------|morphgnt_sblgnt' &&
  w2Comps[1] === '2|G4771|secondary|4|ὑμῖν|RP ----DP--|morphgnt_sblgnt',
  JSON.stringify(w2Comps)
);

// 5. Positive Gate: #3 "هذَا" is G3778 @ w1 (τοῦτο)
const w3Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_case, verified_locator FROM word_mappings WHERE id = 'a832f63e-b6ed-4436-af64-26813b26d102';`);
check('Positive: Phil 2:5 #3 "هذَا" is G3778 @ w1 (τοῦτο, RD ----ASN-)',
  w3Row === 'G3778|1|οὗτος|τοῦτο|RD ----ASN-|demonstrative|accusative|SBLGNT:B50.C2.V5.w1',
  w3Row
);

// 6. Positive Gate: #4 "الْفِكْرُ" is G5426 @ w2 (φρονεῖτε)
const w4Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_mood, morph_tense, morph_voice, verified_locator FROM word_mappings WHERE id = '69f167d2-0357-49d9-9a9c-4fcc2d758c39';`);
check('Positive: Phil 2:5 #4 "الْفِكْرُ" is G5426 @ w2 (φρονεῖτε, V- 2PAD-P--)',
  w4Row === 'G5426|2|φρονέω|φρονεῖτε|V- 2PAD-P--|verb|imperative|present|active|SBLGNT:B50.C2.V5.w2',
  w4Row
);

// 7. Positive Gate: #7 "الْمَسِيحِ" & #8 "يَسُوعَ" are nouns per SBLGNT N- category
const w7Pos = q(`SELECT morph_pos FROM word_mappings WHERE id = 'cb1822ed-ea7f-4655-9b9a-7eaf73e09445';`);
const w8Pos = q(`SELECT morph_pos FROM word_mappings WHERE id = '2d86ba46-1aa0-45f1-9226-cc9f2b7404dc';`);
check('Positive: Phil 2:5 #7 "الْمَسِيحِ" and #8 "يَسُوعَ" morph_pos are noun',
  w7Pos === 'noun' && w8Pos === 'noun',
  `w7Pos=${w7Pos}, w8Pos=${w8Pos}`
);

// 8. Positive Gate: #9 "أَيْضًا" is G2532 @ w6 (καὶ)
const w9Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = '8362a06e-e930-41a1-9ee9-a031278fbea8';`);
check('Positive: Phil 2:5 #9 "أَيْضًا" is G2532 @ w6 (καὶ, D- --------)',
  w9Row === 'G2532|6|καί|καὶ|D- --------|adverb|SBLGNT:B50.C2.V5.w6',
  w9Row
);

// --- NEGATIVE REGRESSION GATES ---
const tmpDb = path.join(repoRoot, 'scratch/test_batch2f_phil2_5_tmp.db');
fs.copyFileSync(dbPath, tmpDb);

const regressions = [
  {
    name: 'Negative: reverting #1 ("فَلْيَكُنْ") to fake G1510 @ w1 is rejected',
    pos: 1,
    sql: `UPDATE word_mappings SET strongs_id='G1510', orig_word_position=1, orig_word='εἰμί', orig_surface='εἰμί', orig_morphology='V- --------', morph_pos='verb', morph_source='morphgnt_tr', verified_locator='TR:B50.C2.V5.w1' WHERE id='01358317-4af5-490f-94ee-d1630cc52e4e'; INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('01358317-4af5-490f-94ee-d1630cc52e4e', 'G1510', 1, 'primary', 1, 'εἰμί', 'V- --------', 'morphgnt_tr');`
  },
  {
    name: 'Negative: reverting #2 ("فِيكُمْ") to w2 collision with #4 is rejected',
    pos: 2,
    sql: `UPDATE word_mappings SET orig_word_position=2, verified_locator='SBLGNT:B50.C2.V5.w2' WHERE id='26e7f5f7-52db-4ae4-8a86-3f14d573e46d'; UPDATE word_mapping_strongs SET orig_word_position=2 WHERE mapping_id='26e7f5f7-52db-4ae4-8a86-3f14d573e46d' AND strongs_id='G1722';`
  },
  {
    name: 'Negative: deleting secondary G4771 from #2 ("فِيكُمْ") is rejected',
    pos: 2,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id='26e7f5f7-52db-4ae4-8a86-3f14d573e46d' AND strongs_id='G4771';`
  },
  {
    name: 'Negative: converting required #4 ("الْفِكْرُ") to syntactic_ar is rejected (auditor gap test)',
    pos: 4,
    sql: `UPDATE word_mappings SET strongs_id=NULL, orig_word_position=0, orig_word='—', orig_surface='—', orig_morphology=NULL, morph_pos='syntactic_ar', morph_source='syntactic_ar', verified_locator='AR_SYNTACTIC:B50.C2.V5.w4' WHERE id='69f167d2-0357-49d9-9a9c-4fcc2d758c39'; DELETE FROM word_mapping_strongs WHERE mapping_id='69f167d2-0357-49d9-9a9c-4fcc2d758c39';`
  },
  {
    name: 'Negative: converting required #3 ("هذَا") to syntactic_ar is rejected',
    pos: 3,
    sql: `UPDATE word_mappings SET strongs_id=NULL, orig_word_position=0, orig_word='—', orig_surface='—', orig_morphology=NULL, morph_pos='syntactic_ar', morph_source='syntactic_ar', verified_locator='AR_SYNTACTIC:B50.C2.V5.w3' WHERE id='a832f63e-b6ed-4436-af64-26813b26d102'; DELETE FROM word_mapping_strongs WHERE mapping_id='a832f63e-b6ed-4436-af64-26813b26d102';`
  },
  {
    name: 'Negative: token collision by mapping #3 to w2 is rejected',
    pos: 3,
    sql: `UPDATE word_mappings SET orig_word_position=2, verified_locator='SBLGNT:B50.C2.V5.w2' WHERE id='a832f63e-b6ed-4436-af64-26813b26d102';`
  },
  {
    name: 'Negative: reverting #7 ("الْمَسِيحِ") morph_pos to proper_noun triggers morphology alert and is rejected',
    pos: 7,
    sql: `UPDATE word_mappings SET morph_pos='proper_noun' WHERE id='cb1822ed-ea7f-4655-9b9a-7eaf73e09445';`
  },
  {
    name: 'Negative: blanking mandatory component fields on #2 ("فِيكُمْ") is rejected',
    pos: 2,
    sql: `UPDATE word_mapping_strongs SET orig_component=NULL, orig_morphology=NULL WHERE mapping_id='26e7f5f7-52db-4ae4-8a86-3f14d573e46d' AND strongs_id='G1722';`
  },
  {
    name: 'Negative: blanking mandatory component fields on #4 ("الْفِكْرُ") is rejected',
    pos: 4,
    sql: `UPDATE word_mapping_strongs SET orig_component=NULL, orig_morphology=NULL WHERE mapping_id='69f167d2-0357-49d9-9a9c-4fcc2d758c39' AND strongs_id='G5426';`
  }
];

try {
  for (const reg of regressions) {
    fs.copyFileSync(dbPath, tmpDb);
    q(reg.sql, tmpDb);
    const env = { ...process.env, AUDIT_DB_PATH: tmpDb };
    const repFile = path.join(repoRoot, 'scratch/tmp_rep.json');
    execSync(
      `"${nodePath}" ${auditScript} --manifest ${manifestPath} --out ${repFile}`,
      { cwd: repoRoot, encoding: 'utf8', env }
    );
    const rep = JSON.parse(fs.readFileSync(repFile, 'utf8'));
    const alert = rep.alerts.find(a => a.verse === 'Phil 2:5' && a.pos === reg.pos);
    const hasAlert = Boolean(alert && Object.values(alert.axes).some(arr => arr.length > 0));
    check(reg.name, hasAlert, hasAlert ? `detected: ${JSON.stringify(alert.axes)}` : 'accepted corrupt state (FAILED)');
  }
} finally {
  if (fs.existsSync(tmpDb)) fs.unlinkSync(tmpDb);
  const repFile = path.join(repoRoot, 'scratch/tmp_rep.json');
  if (fs.existsSync(repFile)) fs.unlinkSync(repFile);
}

console.log(`\nSUMMARY: ${passCount}/${passCount + failCount} Phil 2:5 full-verse positive & negative gates passed.`);
if (failCount > 0) {
  process.exit(1);
}
