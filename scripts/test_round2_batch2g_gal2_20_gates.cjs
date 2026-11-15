/**
 * scripts/test_round2_batch2g_gal2_20_gates.cjs
 *
 * Comprehensive Positive & Negative Regression Gates for Galatians 2:20 (Batch 2G):
 *
 * Positive Gates:
 * 1.  All 27/27 words in Gal 2:20 pass with 0 alerts in strict 4-axis audit.
 * 2.  Full Scrivener TR token coverage: w1..w33 covered (100% token coverage).
 * 3.  #1 "مَعَ" is pure syntactic_ar (AR_SYNTACTIC:B48.C2.V20.w1) with zero Strongs and zero components.
 * 4.  #2 "الْمَسِيحِ" is TR w1 Χριστῷ (G5547, N-DSM, morph_pos='noun').
 * 5.  #3 "صُلِبْتُ" is TR w2 συνεσταύρωμαι (G4957, V-RPI-1S, morph_pos='verb', perfect passive indicative 1S).
 * 6.  #4 "فَأَحْيَا" has primary G2198@w3 and secondary G1161@w4.
 * 7.  #5 "لاَ" is TR w5 οὐκέτι (G3765, ADV-N).
 * 8.  #10 "فِيَّ" has primary G1722@w9 and secondary G1473@w10 (ἐμοὶ, P-1DS).
 * 9.  #11 "فَمَا" has primary G3739@w12 (ὃ) and secondary G1161@w13 (δὲ).
 * 10. #16 "فَإِنَّمَا" is pure syntactic_ar (AR_SYNTACTIC:B48.C2.V20.w16) with zero Strongs.
 * 11. #19 "الإِيمَانِ" & #20 "إِيمَانِ" are compound_phrase on G4102@w19 with secondary G3588@w21 on #20.
 * 12. #21 "ابْنِ" has primary G5207@w23 and secondary G3588@w22 (τοῦ).
 * 13. #22 "اللهِ" has primary G2316@w25 and secondary G3588@w24 (τοῦ).
 * 14. #24 "أَحَبَّنِي" has primary G25@w27 and secondary G1473@w28 (με, P-1AS).
 * 15. #25 "وَأَسْلَمَ" has primary G3860@w30 and secondary G2532@w29 (καὶ).
 * 16. #27 "لأَجْلِي" has primary G5228@w32 and secondary G1473@w33 (ἐμοῦ, P-1GS).
 *
 * Negative Gates:
 * 17. Dropping secondary G1161 from #4 is rejected with lexical/sourceLocator alert.
 * 18. Converting required lexical #3 "صُلِبْتُ" to syntactic_ar is rejected.
 * 19. Converting required lexical #4 "فَأَحْيَا" to syntactic_ar is rejected.
 * 20. Dropping secondary G1473 from #10 "فِيَّ" is rejected.
 * 21. Blanking mandatory component fields on #10 is rejected.
 * 22. Blanking mandatory component fields on #20 is rejected.
 * 23. Corrupting pronoun on #10 (swapping with #27) is rejected.
 * 24. Token collision by mapping #5 to w3 without compound_phrase is rejected.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
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
console.log('  ROUND 2 BATCH 2G (GAL 2:20 FULL VERSE) POSITIVE & NEGATIVE GATES      ');
console.log('========================================================================\n');

const nodePath = process.execPath;

// 1. Positive Gate: Gal 2:20 27/27 clean in strict 4-axis audit
const auditOut = execSync(
  `"${nodePath}" "${auditScript}" --manifest "${manifestPath}"`,
  { cwd: repoRoot, encoding: 'utf8', env: process.env }
);
const galMatch = auditOut.match(/Gal 2:20\s+\[greek\s*\]:\s*clean\s*(\d+)\/(\d+)\s*\(([\d\.]+)%\)\s*\|\s*axes\(([^)]+)\)/);
const cleanCount = galMatch ? parseInt(galMatch[1], 10) : 0;
const totalCount = galMatch ? parseInt(galMatch[2], 10) : 0;
check('Positive: Gal 2:20 all 27/27 words pass with 0 alerts', cleanCount === 27 && totalCount === 27, `clean=${cleanCount}/${totalCount}`);

// 2. Positive Gate: Scrivener TR token coverage w1..w33 (100%)
const galWordMappings = q(`
  SELECT wm.ar_word_position || '|' || wm.verified_locator || '|' ||
         COALESCE((SELECT GROUP_CONCAT(wms.orig_word_position) FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id), '')
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 48 AND vr.chapter_num = 2 AND vr.verse_num = 20
  ORDER BY wm.ar_word_position;
`).split('\n').filter(Boolean);

const coveredTr = new Set();
for (const row of galWordMappings) {
  const [, loc, wPosStr] = row.split('|');
  if (loc && loc.startsWith('TR:') && wPosStr) {
    for (const p of wPosStr.split(',')) {
      const pNum = parseInt(p, 10);
      if (pNum > 0) coveredTr.add(pNum);
    }
  }
}
const all33Present = Array.from({ length: 33 }, (_, i) => i + 1).every(w => coveredTr.has(w));
check('Positive: Gal 2:20 covers all 33 unique Scrivener TR tokens (w1..w33)', all33Present && coveredTr.size === 33, `covered=${coveredTr.size}/33`);

// 3. Positive Gate: #1 "مَعَ" is pure syntactic_ar
const w1Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, morph_pos, morph_source, verified_locator FROM word_mappings WHERE id = '42a00c6f-7d23-40fd-9755-35c1e5dbee2c';`);
const w1Comps = q(`SELECT COUNT(*) FROM word_mapping_strongs WHERE mapping_id = '42a00c6f-7d23-40fd-9755-35c1e5dbee2c';`);
check('Positive: Gal 2:20 #1 "مَعَ" is pure syntactic_ar with zero Strongs and zero components',
  w1Row === '|0|—|—|syntactic_ar|syntactic_ar|AR_SYNTACTIC:B48.C2.V20.w1' && w1Comps === '0',
  `row=${w1Row}, comps=${w1Comps}`
);

// 4. Positive Gate: #2 "الْمَسِيحِ" is TR w1 Χριστῷ (G5547, N-DSM, noun)
const w2Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_source, verified_locator FROM word_mappings WHERE id = '2df92135-b721-4d58-b00e-8409e6b77ca6';`);
check('Positive: Gal 2:20 #2 "الْمَسِيحِ" is TR w1 Χριστῷ (G5547, N-DSM, morph_pos=noun)',
  w2Row === 'G5547|1|Χριστῷ|N-DSM|noun|morphgnt_tr|TR:B48.C2.V20.w1',
  `row=${w2Row}`
);

// 5. Positive Gate: #3 "صُلِبْتُ" is TR w2 συνεσταύρωμαι (G4957, V-RPI-1S, verb, perfect passive indicative 1S)
const w3Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_tense, morph_voice, morph_mood, morph_person, morph_number FROM word_mappings WHERE id = '2617c9fb-56fc-4e3e-a516-ddbafc4db79e';`);
check('Positive: Gal 2:20 #3 "صُلِبْتُ" is TR w2 συνεσταύρωμαι (G4957, V-RPI-1S, verb, perfect passive indicative 1S)',
  w3Row === 'G4957|2|συνεσταύρωμαι|V-RPI-1S|verb|perfect|passive|indicative|1|singular',
  `row=${w3Row}`
);

// 6. Positive Gate: #4 "فَأَحْيَا" has primary G2198@w3 and secondary G1161@w4
const w4Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '779b9793-d3d8-41b3-a9ff-b41ddf9b396b' ORDER BY link_order;`);
check('Positive: Gal 2:20 #4 "فَأَحْيَا" has primary G2198@w3 and secondary G1161@w4',
  w4Comps === 'G2198:primary#1@w3[ζῶ:V-PAI-1S]\nG1161:secondary#2@w4[δέ:CONJ]',
  `comps=${w4Comps}`
);

// 7. Positive Gate: #5 "لاَ" is TR w5 οὐκέτι (G3765, ADV-N)
const w5Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = '4e09264a-0fa1-4077-93d8-325f123bc7fa';`);
check('Positive: Gal 2:20 #5 "لاَ" is TR w5 οὐκέτι (G3765, ADV-N, morph_pos=adverb)',
  w5Row === 'G3765|5|οὐκέτι|ADV-N|adverb|TR:B48.C2.V20.w5',
  `row=${w5Row}`
);

// 8. Positive Gate: #10 "فِيَّ" has primary G1722@w9 and secondary G1473@w10 (ἐμοὶ, P-1DS)
const w10Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = 'fef36d59-fd79-4920-9531-c887d27c95e5' ORDER BY link_order;`);
check('Positive: Gal 2:20 #10 "فِيَّ" has primary G1722@w9 and secondary G1473@w10',
  w10Comps === 'G1722:primary#1@w9[ἐν:PREP]\nG1473:secondary#2@w10[ἐμοὶ:P-1DS]',
  `comps=${w10Comps}`
);

// 9. Positive Gate: #11 "فَمَا" has primary G3739@w12 (ὃ) and secondary G1161@w13 (δὲ)
const w11Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '2f9ba84d-f66d-48ee-9ba5-16fb014e4a7b' ORDER BY link_order;`);
check('Positive: Gal 2:20 #11 "فَمَا" has primary G3739@w12 and secondary G1161@w13',
  w11Comps === 'G3739:primary#1@w12[ὃ:R-ASN]\nG1161:secondary#2@w13[δὲ:CONJ]',
  `comps=${w11Comps}`
);

// 10. Positive Gate: #16 "فَإِنَّمَا" is pure syntactic_ar
const w16Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, morph_pos, morph_source, verified_locator FROM word_mappings WHERE id = 'a7ecd0ca-3f06-4d42-a54e-9a2a50225e02';`);
const w16Comps = q(`SELECT COUNT(*) FROM word_mapping_strongs WHERE mapping_id = 'a7ecd0ca-3f06-4d42-a54e-9a2a50225e02';`);
check('Positive: Gal 2:20 #16 "فَإِنَّمَا" is pure syntactic_ar with zero Strongs and zero components',
  w16Row === '|0|—|—|syntactic_ar|syntactic_ar|AR_SYNTACTIC:B48.C2.V20.w16' && w16Comps === '0',
  `row=${w16Row}, comps=${w16Comps}`
);

// 11. Positive Gate: #19 & #20 are compound_phrase on G4102@w19 with secondary G3588@w21 on #20
const w19Rel = q(`SELECT relation_type FROM word_mappings WHERE id = '27035deb-7aac-431f-b6b9-a0bb9b373609';`);
const w20Rel = q(`SELECT relation_type FROM word_mappings WHERE id = '49002695-4ac3-4fa1-b591-305819090536';`);
const w20Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '49002695-4ac3-4fa1-b591-305819090536' ORDER BY link_order;`);
check('Positive: Gal 2:20 #19 & #20 are documented compound_phrase with secondary G3588@w21 on #20',
  w19Rel === 'compound_phrase' && w20Rel === 'compound_phrase' &&
  w20Comps === 'G4102:primary#1@w19[πίστει:N-DSF]\nG3588:secondary#2@w21[τῇ:T-DSF]',
  `w19Rel=${w19Rel}, w20Rel=${w20Rel}, w20Comps=${w20Comps}`
);

// 12. Positive Gate: #21 "ابْنِ" has primary G5207@w23 and secondary G3588@w22 (τοῦ)
const w21Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '456d28b4-fb55-4c99-a766-4d493d291c43' ORDER BY link_order;`);
check('Positive: Gal 2:20 #21 "ابْنِ" has primary G5207@w23 and secondary G3588@w22',
  w21Comps === 'G5207:primary#1@w23[υἱοῦ:N-GSM]\nG3588:secondary#2@w22[τοῦ:T-GSM]',
  `comps=${w21Comps}`
);

// 13. Positive Gate: #22 "اللهِ" has primary G2316@w25 and secondary G3588@w24 (τοῦ)
const w22Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '330e4394-331b-49ae-a695-b4a175966228' ORDER BY link_order;`);
check('Positive: Gal 2:20 #22 "اللهِ" has primary G2316@w25 and secondary G3588@w24',
  w22Comps === 'G2316:primary#1@w25[Θεοῦ:N-GSM]\nG3588:secondary#2@w24[τοῦ:T-GSM]',
  `comps=${w22Comps}`
);

// 14. Positive Gate: #24 "أَحَبَّنِي" has primary G25@w27 and secondary G1473@w28 (με)
const w24Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '53289b16-db2f-4aff-9612-900eaa08e39e' ORDER BY link_order;`);
check('Positive: Gal 2:20 #24 "أَحَبَّنِي" has primary G25@w27 and secondary G1473@w28',
  w24Comps === 'G25:primary#1@w27[ἀγαπήσαντός:V-AAP-GSM]\nG1473:secondary#2@w28[με:P-1AS]',
  `comps=${w24Comps}`
);

// 15. Positive Gate: #25 "وَأَسْلَمَ" has primary G3860@w30 and secondary G2532@w29 (καὶ)
const w25Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '12ea750d-8d47-41cd-82d0-7f72bf83afb3' ORDER BY link_order;`);
check('Positive: Gal 2:20 #25 "وَأَسْلَمَ" has primary G3860@w30 and secondary G2532@w29',
  w25Comps === 'G3860:primary#1@w30[παραδόντος:V-2AAP-GSM]\nG2532:secondary#2@w29[καὶ:CONJ]',
  `comps=${w25Comps}`
);

// 16. Positive Gate: #27 "لأَجْلِي" has primary G5228@w32 and secondary G1473@w33 (ἐμοῦ)
const w27Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '151b3f82-6b92-4cad-beaf-6e8cdfb72d07' ORDER BY link_order;`);
check('Positive: Gal 2:20 #27 "لأَجْلِي" has primary G5228@w32 and secondary G1473@w33',
  w27Comps === 'G5228:primary#1@w32[ὑπὲρ:PREP]\nG1473:secondary#2@w33[ἐμοῦ:P-1GS]',
  `comps=${w27Comps}`
);

// Helper for negative testing in isolated scratch DB
const scratchDb = path.join(repoRoot, 'scratch/gal220_test_scratch.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/gal220_test_audit_out.json');

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

const regressions = [
  {
    name: 'Negative: Dropping secondary G1161 from #4 "فَأَحْيَا" is rejected',
    pos: 4,
    sql: "DELETE FROM word_mapping_strongs WHERE mapping_id = '779b9793-d3d8-41b3-a9ff-b41ddf9b396b' AND strongs_id = 'G1161';"
  },
  {
    name: 'Negative: Converting required lexical #3 "صُلِبْتُ" to syntactic_ar is rejected',
    pos: 3,
    sql: "UPDATE word_mappings SET strongs_id = NULL, orig_word_position = 0, orig_word = '—', orig_surface = '—', orig_morphology = NULL, morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', verified_locator = 'AR_SYNTACTIC:B48.C2.V20.w3', relation_type = 'syntactic_construction' WHERE id = '2617c9fb-56fc-4e3e-a516-ddbafc4db79e'; DELETE FROM word_mapping_strongs WHERE mapping_id = '2617c9fb-56fc-4e3e-a516-ddbafc4db79e';"
  },
  {
    name: 'Negative: Converting required lexical #4 "فَأَحْيَا" to syntactic_ar is rejected',
    pos: 4,
    sql: "UPDATE word_mappings SET strongs_id = NULL, orig_word_position = 0, orig_word = '—', orig_surface = '—', orig_morphology = NULL, morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', verified_locator = 'AR_SYNTACTIC:B48.C2.V20.w4', relation_type = 'syntactic_construction' WHERE id = '779b9793-d3d8-41b3-a9ff-b41ddf9b396b'; DELETE FROM word_mapping_strongs WHERE mapping_id = '779b9793-d3d8-41b3-a9ff-b41ddf9b396b';"
  },
  {
    name: 'Negative: Dropping secondary G1473 from #10 "فِيَّ" is rejected',
    pos: 10,
    sql: "DELETE FROM word_mapping_strongs WHERE mapping_id = 'fef36d59-fd79-4920-9531-c887d27c95e5' AND strongs_id = 'G1473';"
  },
  {
    name: 'Negative: Blanking mandatory component fields on #10 "فِيَّ" is rejected',
    pos: 10,
    sql: "UPDATE word_mapping_strongs SET orig_component = NULL WHERE mapping_id = 'fef36d59-fd79-4920-9531-c887d27c95e5' AND strongs_id = 'G1473';"
  },
  {
    name: 'Negative: Blanking mandatory component fields on #20 "إِيمَانِ" is rejected',
    pos: 20,
    sql: "UPDATE word_mapping_strongs SET orig_morphology = NULL WHERE mapping_id = '49002695-4ac3-4fa1-b591-305819090536' AND strongs_id = 'G3588';"
  },
  {
    name: 'Negative: Corrupting pronoun on #10 (swapping with #27) is rejected',
    pos: 10,
    sql: "UPDATE word_mapping_strongs SET orig_component = 'ἐμοῦ', orig_morphology = 'P-1GS', orig_word_position = 33 WHERE mapping_id = 'fef36d59-fd79-4920-9531-c887d27c95e5' AND strongs_id = 'G1473';"
  },
  {
    name: 'Negative: Token collision by mapping #5 to w3 without compound_phrase is rejected',
    pos: 5,
    sql: "UPDATE word_mappings SET orig_word_position = 3, verified_locator = 'TR:B48.C2.V20.w3' WHERE id = '4e09264a-0fa1-4077-93d8-325f123bc7fa';"
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    try {
      fs.copyFileSync(dbPath, scratchDb);
      execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
      const rep = runHoldoutAudit(scratchDb);
      const al = (rep.alerts || []).find(a => a.verse === 'Gal 2:20' && a.pos === reg.pos);
      check(reg.name, Boolean(al), `no alert generated for target record pos ${reg.pos} in audit JSON report`);
    } catch (err) {
      check(reg.name, false, `Runner/tool failure: ${err.message}`);
    }
  }
} finally {
  if (fs.existsSync(scratchDb)) fs.unlinkSync(scratchDb);
  if (fs.existsSync(scratchAuditOut)) fs.unlinkSync(scratchAuditOut);
}

console.log('\n========================================================================');
console.log(`  GATES SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL ${passCount + failCount})`);
console.log('========================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
