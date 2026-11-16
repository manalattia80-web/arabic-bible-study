/**
 * scripts/test_round2_batch2j_isa41_10_gates.cjs
 *
 * Comprehensive Positive & Negative Regression Gates for Isaiah 41:10 (Batch 2J):
 *
 * Positive Gates:
 * 1.  All 14/14 words in Isa 41:10 pass with 0 alerts in strict 4-axis audit.
 * 2.  Full OSHB token coverage: w1..w17 covered (100% token coverage).
 * 3.  #1 "لاَ" is w1 אַל (H408, HTn).
 * 4.  #2 "تَخَفْ" is w2 תִּירָא֙ (H3372, HVqj2ms).
 * 5.  #3 "لأَنِّي" has primary H3588@w3 כִּ֣י and secondary H589@w5 אָ֔נִי.
 * 6.  #4 "مَعَكَ" is w4 עִמְּךָ (H5973, HR/Sp2ms).
 * 7.  #5 "لاَ" is w6 אַל (H408, HTn).
 * 8.  #6 "تَتَلَفَّتْ" is w7 תִּשְׁתָּ֖ע (H8159, HVqj2ms).
 * 9.  #7 "لأَنِّي" has primary H3588@w8 כִּֽי and secondary H589@w9 אֲנִ֣י.
 * 10. #8 "إِلهُكَ" is w10 אֱלֹהֶ֑יךָ (H430, HNcmpc/Sp2ms, construct).
 * 11. #9 "قَدْ" is AR_SYNTACTIC:B23.C41.V10.w9 (syntactic_ar, aspect_particle).
 * 12. #10 "أَيَّدْتُكَ" is w11 אִמַּצְתִּ֨יךָ֙ (H553, HVpp1cs/Sp2ms).
 * 13. #11 "وَأَعَنْتُكَ" has primary H5826@w13 עֲזַרְתִּ֔יךָ and secondary H637@w12 אַף.
 * 14. #12 "وَعَضَدْتُكَ" has primary H8551@w15 תְּמַכְתִּ֖יךָ and secondary H637@w14 אַף.
 * 15. #13 "بِيَمِينِ" has primary H3225@w16 בִּימִ֥ין (construct) and secondary H9003@w16 בִּ.
 * 16. #14 "بِرِّي" is w17 צִדְקִֽי (H6664, HNcmsc/Sp1cs, construct).
 *
 * Negative Gates (in isolated scratch DB copies):
 * 17. Displaced #5 "لاَ" to w5 (the old buggy state pointing to אָנִי) is rejected.
 * 18. Displaced #6 "تَتَلَفَّتْ" to w6 (pointing to אַל) is rejected.
 * 19. Displaced #7 "لأَنِّي" to w7 is rejected.
 * 20. Displaced #8 "إِلهُكَ" to w8 (pointing to כִּי) is rejected.
 * 21. Displaced #10 "أَيَّدْتُكَ" to w10 is rejected.
 * 22. Displaced #14 "بِرِّي" to w14 is rejected.
 * 23. Dropping secondary H589 from #3 "لأَنِّي" is rejected.
 * 24. Dropping secondary H589 from #7 "لأَنِّي" is rejected.
 * 25. Dropping secondary H637 from #11 "وَأَعَنْتُكَ" is rejected.
 * 26. Dropping secondary H637 from #12 "وَعَضَدْتُكَ" is rejected.
 * 27. Dropping secondary H9003 from #13 "بِيَمِينِ" is rejected.
 * 28. Converting required lexical #10 "أَيَّدْتُكَ" to syntactic_ar is rejected.
 * 29. Blanking mandatory component fields on #11 "وَأَعَنْتُكَ" is rejected.
 * 30. Mutating #8 "إِلهُكَ" from construct to absolute is rejected.
 * 31. Blanking morph_case on #8 "إِلهُكَ" is rejected.
 * 32. Mutating #13 "بِيَمِينِ" from construct to absolute is rejected.
 * 33. Blanking morph_case on #13 "بِيَمِينِ" is rejected.
 * 34. Mutating #14 "بِرِّي" from construct to absolute is rejected.
 * 35. Blanking morph_case on #14 "بِرِّي" is rejected.
 * 36. Token collision by mapping #14 to w16 without compound_phrase is rejected.
 * 37. Mutating #4 "مَعَكَ" to 1st person, feminine, plural is rejected.
 * 38. Blanking morph_person on #4 "مَعَكَ" is rejected.
 * 39. Blanking morph_gender on #4 "مَعَكَ" is rejected.
 * 40. Blanking morph_number on #4 "مَعَكَ" is rejected.
 * 41. Setting conflicting gender feminine on #4 "مَعَكَ" is rejected.
 * 42. Setting conflicting person 3 on #4 "مَعَكَ" is rejected.
 * 43. Setting conflicting number plural on #4 "مَعَكَ" is rejected.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

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

const scratchAuditOut = path.join(repoRoot, 'scratch/isa41_10_gates_audit.json');

function runHoldoutAudit(targetDb) {
  execFileSync(process.execPath, [
    auditScript,
    '--manifest', manifestPath,
    '--out', scratchAuditOut
  ], {
    env: { ...process.env, AUDIT_DB_PATH: targetDb },
    stdio: 'ignore'
  });
  if (!fs.existsSync(scratchAuditOut)) {
    throw new Error(`Audit output JSON not created at ${scratchAuditOut}`);
  }
  return JSON.parse(fs.readFileSync(scratchAuditOut, 'utf8'));
}

console.log('\n========================================================================');
console.log('  RUNNING ISAIAH 41:10 DEDICATED REGRESSION GATES (BATCH 2J)');
console.log('========================================================================\n');

// 1. Positive Gate: Isa 41:10 has 14/14 clean words and 0 alerts in current DB
const auditRep = runHoldoutAudit(dbPath);
const isaVerseRep = (auditRep.perVerse || []).find(v => v.verse === 'Isa 41:10' || v.verse === 'Isaiah 41:10');
const isaAlerts = (auditRep.alerts || []).filter(a => a.verse === 'Isa 41:10' || a.verse === 'Isaiah 41:10');

check('Positive: Isa 41:10 has 14/14 clean words', isaVerseRep && isaVerseRep.clean === 14 && isaVerseRep.total === 14, `clean=${isaVerseRep ? isaVerseRep.clean : 'null'}/14`);
check('Positive: Isa 41:10 has 0 alerts across all 4 axes', isaAlerts.length === 0, `alertsCount=${isaAlerts.length}`);

// 2. Positive Gate: w1..w17 full OSHB token coverage
const coveredTokens = new Set();
const allComps = q(`SELECT orig_word_position FROM word_mapping_strongs WHERE mapping_id IN (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010');`).split('\n');
allComps.forEach(line => {
  const p = Number(line.trim());
  if (!isNaN(p) && p > 0) coveredTokens.add(p);
});
const all17 = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].every(w => coveredTokens.has(w));
check('Positive: Isa 41:10 covers all 17 OSHB Hebrew tokens w1..w17', all17, `covered=${Array.from(coveredTokens).sort((a,b)=>a-b).join(',')}`);

// 3. Positive Gate: #1 "لاَ" is w1 אַל (H408, HTn)
const w1Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 1;`);
check('Positive: Isa 41:10 #1 "لاَ" is w1 אַל (H408, HTn)',
  w1Row === 'H408|1|אַל|אַל|HTn|particle|OSHB:B23.C41.V10.w1',
  `row=${w1Row}`
);

// 4. Positive Gate: #2 "تَخَفْ" is w2 תִּירָא֙ (H3372, HVqj2ms)
const w2Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 2;`);
check('Positive: Isa 41:10 #2 "تَخَفْ" is w2 תִּירָא֙ (H3372, HVqj2ms)',
  w2Row === 'H3372|2|יָרֵא|תִּירָא֙|HVqj2ms|verb|qal|yiqtol|jussive|2|masculine|singular|OSHB:B23.C41.V10.w2',
  `row=${w2Row}`
);

// 5. Positive Gate: #3 "لأَنِّي" has primary H3588@w3 and secondary H589@w5
const w3Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, relation_type, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 3;`);
const w3Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 3) ORDER BY link_order;`);
check('Positive: Isa 41:10 #3 "لأَنِّي" has primary H3588@w3 and secondary H589@w5',
  w3Row === 'H3588|3|כִּי|כִּ֣י|HC|conjunction|compound_phrase|OSHB:B23.C41.V10.w3' &&
  w3Comps === 'H3588:primary#1@w3[כִּ֣י:HC]\nH589:secondary#2@w5[אָ֔נִי:HPp1cs]',
  `row=${w3Row}, comps=${w3Comps}`
);

// 6. Positive Gate: #4 "مَعَكَ" is w4 עִמְּךָ (H5973, HR/Sp2ms, 2/masculine/singular)
const w4Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 4;`);
check('Positive: Isa 41:10 #4 "مَعَكَ" is w4 עִמְּךָ (H5973, HR/Sp2ms, 2/masculine/singular)',
  w4Row === 'H5973|4|עִם|עִמְּךָ|HR/Sp2ms|preposition|2|masculine|singular|OSHB:B23.C41.V10.w4',
  `row=${w4Row}`
);

// 7. Positive Gate: #5 "لاَ" is w6 אַל (H408, HTn)
const w5Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 5;`);
check('Positive: Isa 41:10 #5 "لاَ" is w6 אַל (H408, HTn)',
  w5Row === 'H408|6|אַל|אַל|HTn|particle|OSHB:B23.C41.V10.w6',
  `row=${w5Row}`
);

// 8. Positive Gate: #6 "تَتَلَفَّتْ" is w7 תִּשְׁתָּ֖ע (H8159, HVqj2ms)
const w6Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 6;`);
check('Positive: Isa 41:10 #6 "تَتَلَفَّتْ" is w7 תִּשְׁתָּ֖ע (H8159, HVqj2ms)',
  w6Row === 'H8159|7|שָׁעָה|תִּשְׁתָּ֖ע|HVqj2ms|verb|qal|yiqtol|jussive|2|masculine|singular|OSHB:B23.C41.V10.w7',
  `row=${w6Row}`
);

// 9. Positive Gate: #7 "لأَنِّي" has primary H3588@w8 and secondary H589@w9
const w7Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, relation_type, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 7;`);
const w7Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 7) ORDER BY link_order;`);
check('Positive: Isa 41:10 #7 "لأَنِّي" has primary H3588@w8 and secondary H589@w9',
  w7Row === 'H3588|8|כִּי|כִּֽי|HC|conjunction|compound_phrase|OSHB:B23.C41.V10.w8' &&
  w7Comps === 'H3588:primary#1@w8[כִּֽי:HC]\nH589:secondary#2@w9[אֲנִ֣י:HPp1cs]',
  `row=${w7Row}, comps=${w7Comps}`
);

// 10. Positive Gate: #8 "إِلهُكَ" is w10 אֱלֹהֶ֑יךָ (H430, HNcmpc/Sp2ms, construct)
const w8Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 8;`);
check('Positive: Isa 41:10 #8 "إِلهُكَ" is w10 אֱלֹהֶ֑יךָ (H430, HNcmpc/Sp2ms, construct)',
  w8Row === 'H430|10|אֱלֹהִים|אֱלֹהֶ֑יךָ|HNcmpc/Sp2ms|noun|masculine|plural|construct|OSHB:B23.C41.V10.w10',
  `row=${w8Row}`
);

// 11. Positive Gate: #9 "قَدْ" is AR_SYNTACTIC:B23.C41.V10.w9 (syntactic_ar, aspect_particle)
const w9Row = q(`SELECT morph_pos, relation_type, morph_source, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 9;`);
check('Positive: Isa 41:10 #9 "قَدْ" is AR_SYNTACTIC:B23.C41.V10.w9 (syntactic_ar, aspect_particle)',
  w9Row === 'syntactic_ar|aspect_particle|syntactic_ar|AR_SYNTACTIC:B23.C41.V10.w9',
  `row=${w9Row}`
);

// 12. Positive Gate: #10 "أَيَّدْتُكَ" is w11 אִמַּצְתִּ֨יךָ֙ (H553, HVpp1cs/Sp2ms)
const w10Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 10;`);
check('Positive: Isa 41:10 #10 "أَيَّدْتُكَ" is w11 אִמַּצְתִּ֨יךָ֙ (H553, HVpp1cs/Sp2ms)',
  w10Row === 'H553|11|אָמַץ|אִמַּצְתִּ֨יךָ֙|HVpp1cs/Sp2ms|verb|piel|qatal|indicative|1|common|singular|OSHB:B23.C41.V10.w11',
  `row=${w10Row}`
);

// 13. Positive Gate: #11 "وَأَعَنْتُكَ" has primary H5826@w13 and secondary H637@w12
const w11Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, relation_type, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 11;`);
const w11Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 11) ORDER BY link_order;`);
check('Positive: Isa 41:10 #11 "وَأَعَنْتُكَ" has primary H5826@w13 and secondary H637@w12',
  w11Row === 'H5826|13|עָזַר|עֲזַרְתִּ֔יךָ|HVqp1cs/Sp2ms|verb|qal|qatal|indicative|1|common|singular|compound_phrase|OSHB:B23.C41.V10.w13' &&
  w11Comps === 'H5826:primary#1@w13[עֲזַרְתִּ֔יךָ:HVqp1cs/Sp2ms]\nH637:secondary#2@w12[אַף:HTa]',
  `row=${w11Row}, comps=${w11Comps}`
);

// 14. Positive Gate: #12 "وَعَضَدْتُكَ" has primary H8551@w15 and secondary H637@w14
const w12Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, relation_type, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 12;`);
const w12Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 12) ORDER BY link_order;`);
check('Positive: Isa 41:10 #12 "وَعَضَدْتُكَ" has primary H8551@w15 and secondary H637@w14',
  w12Row === 'H8551|15|תָּמַךְ|תְּמַכְתִּ֖יךָ|HVqp1cs/Sp2ms|verb|qal|qatal|indicative|1|common|singular|compound_phrase|OSHB:B23.C41.V10.w15' &&
  w12Comps === 'H8551:primary#1@w15[תְּמַכְתִּ֖יךָ:HVqp1cs/Sp2ms]\nH637:secondary#2@w14[אַף:HTa]',
  `row=${w12Row}, comps=${w12Comps}`
);

// 15. Positive Gate: #13 "بِيَمِينِ" has primary H3225@w16 (construct) and secondary H9003@w16
const w13Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, relation_type, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 13;`);
const w13Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 13) ORDER BY link_order;`);
check('Positive: Isa 41:10 #13 "بِيَمِينِ" has primary H3225@w16 (construct) and secondary H9003@w16',
  w13Row === 'H3225|16|יָמִין|בִּימִ֥ין|HR/Ncfsc|noun|feminine|singular|construct|compound_phrase|OSHB:B23.C41.V10.w16' &&
  w13Comps === 'H3225:primary#1@w16[בִּימִ֥ין:HR/Ncfsc]\nH9003:secondary#2@w16[בִּ:HR]',
  `row=${w13Row}, comps=${w13Comps}`
);

// 16. Positive Gate: #14 "بِرِّي" is w17 צִדְקִֽי (H6664, HNcmsc/Sp1cs, construct)
const w14Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 14;`);
check('Positive: Isa 41:10 #14 "بِرِّي" is w17 צִדְקִֽי (H6664, HNcmsc/Sp1cs, construct)',
  w14Row === 'H6664|17|צֶדֶק|צִדְקִֽי|HNcmsc/Sp1cs|noun|masculine|singular|construct|OSHB:B23.C41.V10.w17',
  `row=${w14Row}`
);

// Negative Regressions in isolated scratch DB
const scratchDb = path.join(repoRoot, 'scratch/isa41_10_neg_scratch.db');

const regressions = [
  {
    name: 'Negative: Displaced #5 "لاَ" to w5 (the old buggy state pointing to אָנִי) is rejected',
    pos: 5,
    sql: "UPDATE word_mappings SET orig_word_position = 5, verified_locator = 'OSHB:B23.C41.V10.w5' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 5;"
  },
  {
    name: 'Negative: Displaced #6 "تَتَلَفَّتْ" to w6 (pointing to אַל) is rejected',
    pos: 6,
    sql: "UPDATE word_mappings SET orig_word_position = 6, verified_locator = 'OSHB:B23.C41.V10.w6' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 6;"
  },
  {
    name: 'Negative: Displaced #7 "لأَنِّي" to w7 is rejected',
    pos: 7,
    sql: "UPDATE word_mappings SET orig_word_position = 7, verified_locator = 'OSHB:B23.C41.V10.w7' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 7;"
  },
  {
    name: 'Negative: Displaced #8 "إِلهُكَ" to w8 (pointing to כִּי) is rejected',
    pos: 8,
    sql: "UPDATE word_mappings SET orig_word_position = 8, verified_locator = 'OSHB:B23.C41.V10.w8' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 8;"
  },
  {
    name: 'Negative: Displaced #10 "أَيَّدْتُكَ" to w10 is rejected',
    pos: 10,
    sql: "UPDATE word_mappings SET orig_word_position = 10, verified_locator = 'OSHB:B23.C41.V10.w10' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 10;"
  },
  {
    name: 'Negative: Displaced #14 "بِرِّي" to w14 is rejected',
    pos: 14,
    sql: "UPDATE word_mappings SET orig_word_position = 14, verified_locator = 'OSHB:B23.C41.V10.w14' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 14;"
  },
  {
    name: 'Negative: Dropping secondary H589 from #3 "لأَنِّي" is rejected',
    pos: 3,
    sql: "DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 3) AND strongs_id = 'H589';"
  },
  {
    name: 'Negative: Dropping secondary H589 from #7 "لأَنِّي" is rejected',
    pos: 7,
    sql: "DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 7) AND strongs_id = 'H589';"
  },
  {
    name: 'Negative: Dropping secondary H637 from #11 "وَأَعَنْتُكَ" is rejected',
    pos: 11,
    sql: "DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 11) AND strongs_id = 'H637';"
  },
  {
    name: 'Negative: Dropping secondary H637 from #12 "وَعَضَدْتُكَ" is rejected',
    pos: 12,
    sql: "DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 12) AND strongs_id = 'H637';"
  },
  {
    name: 'Negative: Dropping secondary H9003 from #13 "بِيَمِينِ" is rejected',
    pos: 13,
    sql: "DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 13) AND strongs_id = 'H9003';"
  },
  {
    name: 'Negative: Converting required lexical #10 "أَيَّدْتُكَ" to syntactic_ar is rejected',
    pos: 10,
    sql: "UPDATE word_mappings SET strongs_id = NULL, orig_word_position = 0, orig_word = '—', orig_surface = '—', orig_morphology = NULL, morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', verified_locator = 'AR_SYNTACTIC:B23.C41.V10.w10', relation_type = 'syntactic_construction' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 10; DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 10);"
  },
  {
    name: 'Negative: Blanking mandatory component fields on #11 "وَأَعَنْتُكَ" is rejected',
    pos: 11,
    sql: "UPDATE word_mapping_strongs SET orig_component = NULL WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 11) AND strongs_id = 'H5826';"
  },
  {
    name: 'Negative: Mutating #8 "إِلهُكَ" from construct to absolute is rejected',
    pos: 8,
    sql: "UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 8;"
  },
  {
    name: 'Negative: Blanking morph_case on #8 "إِلهُكَ" is rejected',
    pos: 8,
    sql: "UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 8;"
  },
  {
    name: 'Negative: Mutating #13 "بِيَمِينِ" from construct to absolute is rejected',
    pos: 13,
    sql: "UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 13;"
  },
  {
    name: 'Negative: Blanking morph_case on #13 "بِيَمِينِ" is rejected',
    pos: 13,
    sql: "UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 13;"
  },
  {
    name: 'Negative: Mutating #14 "بِرِّي" from construct to absolute is rejected',
    pos: 14,
    sql: "UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 14;"
  },
  {
    name: 'Negative: Blanking morph_case on #14 "بِرِّي" is rejected',
    pos: 14,
    sql: "UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 14;"
  },
  {
    name: 'Negative: Token collision by mapping #14 to w16 without compound_phrase is rejected',
    pos: 14,
    sql: "UPDATE word_mappings SET orig_word_position = 16, verified_locator = 'OSHB:B23.C41.V10.w16' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 14;"
  },
  {
    name: 'Negative: Mutating #4 "مَعَكَ" to 1st person, feminine, plural is rejected',
    pos: 4,
    sql: "UPDATE word_mappings SET morph_person = '1', morph_gender = 'feminine', morph_number = 'plural' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 4;"
  },
  {
    name: 'Negative: Blanking morph_person on #4 "مَعَكَ" is rejected',
    pos: 4,
    sql: "UPDATE word_mappings SET morph_person = NULL WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 4;"
  },
  {
    name: 'Negative: Blanking morph_gender on #4 "مَعَكَ" is rejected',
    pos: 4,
    sql: "UPDATE word_mappings SET morph_gender = NULL WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 4;"
  },
  {
    name: 'Negative: Blanking morph_number on #4 "مَعَكَ" is rejected',
    pos: 4,
    sql: "UPDATE word_mappings SET morph_number = NULL WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 4;"
  },
  {
    name: 'Negative: Setting conflicting gender feminine on #4 "مَعَكَ" is rejected',
    pos: 4,
    sql: "UPDATE word_mappings SET morph_gender = 'feminine' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 4;"
  },
  {
    name: 'Negative: Setting conflicting person 3 on #4 "مَعَكَ" is rejected',
    pos: 4,
    sql: "UPDATE word_mappings SET morph_person = '3' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 4;"
  },
  {
    name: 'Negative: Setting conflicting number plural on #4 "مَعَكَ" is rejected',
    pos: 4,
    sql: "UPDATE word_mappings SET morph_number = 'plural' WHERE verse_id = '11111111-0000-0000-0023-000000041010' AND ar_word_position = 4;"
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    try {
      fs.copyFileSync(dbPath, scratchDb);
      execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
      const rep = runHoldoutAudit(scratchDb);
      const al = (rep.alerts || []).find(a => (a.verse === 'Isa 41:10' || a.verse === 'Isaiah 41:10') && a.pos === reg.pos);
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
