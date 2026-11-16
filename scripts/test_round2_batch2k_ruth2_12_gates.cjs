/**
 * scripts/test_round2_batch2k_ruth2_12_gates.cjs
 *
 * Comprehensive Positive & Negative Regression Gates for Ruth 2:12 (Batch 2K):
 *
 * Positive Gates:
 * 1.  All 17/17 words in Ruth 2:12 pass with 0 alerts in strict 4-axis audit.
 * 2.  Full OSHB token coverage: w1..w15 covered (100% token coverage, no out-of-bounds locators).
 * 3.  #1 "لِيُكَافِئِ" is w1 יְשַׁלֵּ֥ם (H7999, HVpi3ms, piel).
 * 4.  #2 "الرَّبُّ" is w2 יְהוָ֖ה (H3068, HNp).
 * 5.  #3 "عَمَلَكِ" is w3 פָּעֳלֵ֑ךְ (H6467, HNcmsc/Sp2fs, construct).
 * 6.  #4 "وَلْيَكُنْ" is w4 וּתְהִ֨י (H1961, HC/Vqj3fs, jussive).
 * 7.  #5 "أَجْرُكِ" is w5 מַשְׂכֻּרְתֵּ֜ךְ (H4909, HNcfsc/Sp2fs, construct, feminine, person 2).
 * 8.  #6 "كَامِلاً" is w6 שְׁלֵמָ֗ה (H8003, HAafsa, absolute, feminine).
 * 9.  #7 & #8 "مِنْ عِنْدِ" form documented compound unit to w7 מֵעִ֤ם (H4480 @ w7 + H5973 @ w7).
 * 10. #9 "الرَّبِّ" is w8 יְהוָה֙ (H3068, HNp).
 * 11. #10 "إِلهِ" is w9 אֱלֹהֵ֣י (H430, HNcmpc, construct).
 * 12. #11 "إِسْرَائِيلَ" is w10 יִשְׂרָאֵ֔ل (H3478, HNp).
 * 13. #12 "الَّذِي" is w11 אֲשֶׁר (H834, HTr).
 * 14. #13 "جِئْتِ" is w12 בָּ֖את (H935, HVqp2fs).
 * 15. #14 & #15 "لِكَيْ تَحْتَمِي" form documented compound unit to w13 לַחֲס֥וֹת (H9005 @ w13 + H2620 @ w13 HR/Vqc).
 * 16. #16 "تَحْتَ" is w14 תַּֽחַת (H8478, HR).
 * 17. #17 "جَنَاحَيْهِ" is w15 כְּנָפָֽיו (H3671, HNcfpc/Sp3ms, construct, feminine, plural).
 *
 * Negative Gates (in isolated scratch DB copies):
 * 18. Displaced #8 "عِنْدِ" to w8 (the old buggy state pointing to יְהוָה) is rejected.
 * 19. Displaced #9 "الرَّبِّ" to w9 (pointing to אֱלֹהֵי) is rejected.
 * 20. Displaced #14 "لِكَيْ" to fake H413 @ w14 is rejected.
 * 21. Displaced #16 "تَحْتَ" to out-of-bounds w16 is rejected.
 * 22. Displaced #17 "جَنَاحَيْهِ" to out-of-bounds w17 is rejected.
 * 23. Reverting #5 "أَجْرُكِ" to erroneous H7939 (שָׂכָר) is rejected.
 * 24. Stripping geresh accent from #5 מַשְׂכֻּרְתֵּ֜ךְ is rejected.
 * 25. Dropping secondary H4480 from #8 "عِنْدِ" is rejected.
 * 26. Dropping secondary H9005 from #15 "تَحْتَمِي" is rejected.
 * 27. Blanking mandatory component fields on #8 is rejected.
 * 28. Blanking mandatory component fields on #15 is rejected.
 * 29. Mutating #5 "أَجْرُكِ" from construct to absolute is rejected.
 * 30. Blanking morph_case on #5 "أَجْرُكِ" is rejected.
 * 31. Mutating #6 "كَامِلاً" from absolute to construct is rejected.
 * 32. Mutating #10 "إِلهِ" from construct to absolute is rejected.
 * 33. Blanking morph_case on #10 "إِلهِ" is rejected.
 * 34. Mutating #17 "جَنَاحَيْهِ" from construct to absolute is rejected.
 * 35. Blanking morph_case on #17 "جَنَاحَيْهِ" is rejected.
 * 36. Removing compound_phrase from #7-#8 (token collision) is rejected.
 * 37. Removing compound_phrase from #14-#15 (token collision) is rejected.
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
const r2ManifestPath = path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json');
const scratchDb = path.join(repoRoot, 'scratch/ruth2_12_neg_scratch.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/ruth2_12_neg_audit.json');

const VERSE_ID = '11111111-0000-0000-0008-000000002012';

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
    '--manifest', r2ManifestPath,
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
console.log('  RUNNING RUTH 2:12 DEDICATED REGRESSION GATES (BATCH 2K)');
console.log('========================================================================\n');

// 1. Positive Gate: All 17 words pass in strict audit
const r2Report = runAudit(dbPath);
const ruthSummary = r2Report.perVerse.find(v => v.verse === 'Ruth 2:12');
const ruthAlerts = (r2Report.alerts || []).filter(a => a.verse === 'Ruth 2:12');

check('Positive: Ruth 2:12 has 17/17 clean words', ruthSummary && ruthSummary.clean === 17 && ruthSummary.total === 17, `clean=${ruthSummary ? ruthSummary.clean : 0}/17`);
check('Positive: Ruth 2:12 has 0 alerts across all 4 axes', ruthAlerts.length === 0, `alertsCount=${ruthAlerts.length}, alerts=${JSON.stringify(ruthAlerts)}`);

// 2. Positive Gate: Full OSHB token coverage (w1..w15)
const tokenRows = q(`
  SELECT DISTINCT orig_word_position
  FROM word_mappings
  WHERE verse_id = '${VERSE_ID}' AND orig_word_position IS NOT NULL
  ORDER BY orig_word_position;
`).split('\n').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
const expectedTokens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const tokensCovered = expectedTokens.every(t => tokenRows.includes(t)) && tokenRows.length === 15;
check('Positive: Ruth 2:12 covers all 15 OSHB Hebrew tokens w1..w15', tokensCovered, `covered=${JSON.stringify(tokenRows)}`);

// 3. Positive Gate: #1 "لِيُكَافِئِ" is w1 יְשַׁלֵּ֥ם (H7999, HVpi3ms, piel)
const w1Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;`);
check('Positive: Ruth 2:12 #1 "لِيُكَافِئِ" is w1 יְשַׁלֵּ֥ם (H7999, HVpi3ms)',
  w1Row === 'H7999|1|יְשַׁלֵּ֥ם|HVpi3ms|verb|piel|yiqtol|indicative|3|masculine|singular|OSHB:B8.C2.V12.w1',
  `row=${w1Row}`
);

// 4. Positive Gate: #2 "الرَّبُّ" is w2 יְהוָ֖ה (H3068, HNp)
const w2Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_number, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 2;`);
check('Positive: Ruth 2:12 #2 "الرَّبُّ" is w2 יְהוָ֖ה (H3068, HNp)',
  w2Row === 'H3068|2|יְהוָ֖ה|HNp|proper_noun|singular|OSHB:B8.C2.V12.w2',
  `row=${w2Row}`
);

// 5. Positive Gate: #3 "عَمَلَكِ" is w3 פָּעֳלֵ֑ךְ (H6467, HNcmsc/Sp2fs, construct)
const w3Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`);
check('Positive: Ruth 2:12 #3 "عَمَلَكِ" is w3 פָּעֳלֵ֑ךְ (H6467, HNcmsc/Sp2fs, construct)',
  w3Row === 'H6467|3|פָּעֳלֵ֑ךְ|HNcmsc/Sp2fs|noun|masculine|singular|construct|OSHB:B8.C2.V12.w3',
  `row=${w3Row}`
);

// 6. Positive Gate: #4 "وَلْيَكُنْ" is w4 וּתְהִ֨י (H1961, HC/Vqj3fs, jussive)
const w4Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 4;`);
check('Positive: Ruth 2:12 #4 "وَلْيَكُنْ" is w4 וּתְהִ֨י (H1961, HC/Vqj3fs, jussive)',
  w4Row === 'H1961|4|וּתְהִ֨י|HC/Vqj3fs|verb|qal|yiqtol|jussive|3|feminine|singular|OSHB:B8.C2.V12.w4',
  `row=${w4Row}`
);

// 7. Positive Gate: #5 "أَجْرُكِ" is w5 מַשְׂכֻּרְתֵּ֜ךְ (H4909, HNcfsc/Sp2fs, construct, feminine, person 2)
const w5Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, morph_person, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`);
check('Positive: Ruth 2:12 #5 "أَجْرُكِ" is w5 מַשְׂכֻּרְתֵּ֜ךְ (H4909, HNcfsc/Sp2fs, construct, feminine, person 2)',
  w5Row === 'H4909|5|מַשְׂכֻּרְתֵּ֜ךְ|HNcfsc/Sp2fs|noun|feminine|singular|construct|2|OSHB:B8.C2.V12.w5',
  `row=${w5Row}`
);

// 8. Positive Gate: #6 "كَامِلاً" is w6 שְׁלֵמָ֗ה (H8003, HAafsa, absolute, feminine)
const w6Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`);
check('Positive: Ruth 2:12 #6 "كَامِلاً" is w6 שְׁלֵמָ֗ה (H8003, HAafsa, absolute, feminine)',
  w6Row === 'H8003|6|שְׁלֵמָ֗ה|HAafsa|adjective|feminine|singular|absolute|OSHB:B8.C2.V12.w6',
  `row=${w6Row}`
);

// 9. Positive Gate: #7 & #8 "مِنْ عِنْدِ" form documented compound unit to w7 מֵעִ֤ם
const w7Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, relation_type, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7;`);
const w8Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, relation_type, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8;`);
const w8Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8) ORDER BY link_order;`);
check('Positive: Ruth 2:12 #7 & #8 "مِنْ عِنْدِ" form documented compound unit to w7 מֵעִ֤ם',
  w7Row === 'H4480|7|מֵעִ֤ם|HR|preposition|compound_phrase|OSHB:B8.C2.V12.w7' &&
  w8Row === 'H5973|7|מֵעִ֤ם|HR/R|preposition|compound_phrase|OSHB:B8.C2.V12.w7' &&
  w8Comps === 'H5973:primary#1@w7[מֵעִ֤ם:HR/R]\nH4480:secondary#2@w7[מֵ:HR]',
  `w7Row=${w7Row}, w8Row=${w8Row}, w8Comps=${w8Comps}`
);

// 10. Positive Gate: #9 "الرَّبِّ" is w8 יְהוָה֙ (H3068, HNp)
const w9Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_number, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`);
check('Positive: Ruth 2:12 #9 "الرَّبِّ" is w8 יְהוָה֙ (H3068, HNp)',
  w9Row === 'H3068|8|יְהוָה֙|HNp|proper_noun|singular|OSHB:B8.C2.V12.w8',
  `row=${w9Row}`
);

// 11. Positive Gate: #10 "إِلهِ" is w9 אֱלֹהֵ֣י (H430, HNcmpc, construct)
const w10Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`);
check('Positive: Ruth 2:12 #10 "إِلهِ" is w9 אֱלֹהֵ֣י (H430, HNcmpc, construct)',
  w10Row === 'H430|9|אֱלֹהֵ֣י|HNcmpc|noun|masculine|plural|construct|OSHB:B8.C2.V12.w9',
  `row=${w10Row}`
);

// 12. Positive Gate: #11 "إِسْرَائِيلَ" is w10 יִשְׂרָאֵ֔ל (H3478, HNp)
const w11Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_number, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`);
check('Positive: Ruth 2:12 #11 "إِسْرَائِيلَ" is w10 יִשְׂרָאֵ֔ל (H3478, HNp)',
  w11Row === 'H3478|10|יִשְׂרָאֵ֔ל|HNp|proper_noun|singular|OSHB:B8.C2.V12.w10',
  `row=${w11Row}`
);

// 13. Positive Gate: #12 "الَّذِي" is w11 אֲשֶׁר (H834, HTr)
const w12Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 12;`);
check('Positive: Ruth 2:12 #12 "الَّذِي" is w11 אֲשֶׁר (H834, HTr)',
  w12Row === 'H834|11|אֲשֶׁר|HTr|relative_pronoun|OSHB:B8.C2.V12.w11',
  `row=${w12Row}`
);

// 14. Positive Gate: #13 "جِئْتِ" is w12 בָּ֖את (H935, HVqp2fs)
const w13Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_voice, morph_mood, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13;`);
check('Positive: Ruth 2:12 #13 "جِئْتِ" is w12 בָּ֖את (H935, HVqp2fs)',
  w13Row === 'H935|12|בָּ֖את|HVqp2fs|verb|qal|qatal|active|indicative|2|feminine|singular|OSHB:B8.C2.V12.w12',
  `row=${w13Row}`
);

// 15. Positive Gate: #14 & #15 "لِكَيْ تَحْتَمِي" form documented compound unit to w13 לַחֲס֥וֹת
const w14Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, relation_type, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 14;`);
const w15Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_stem, morph_mood, relation_type, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;`);
const w15Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15) ORDER BY link_order;`);
check('Positive: Ruth 2:12 #14 & #15 "لِكَيْ تَحْتَمِي" form documented compound unit to w13 לַחֲס֥וֹת',
  w14Row === 'H9005|13|לַחֲס֥וֹת|HR|preposition|compound_phrase|OSHB:B8.C2.V12.w13' &&
  w15Row === 'H2620|13|לַחֲס֥וֹת|HR/Vqc|verb|qal|infinitive_construct|compound_phrase|OSHB:B8.C2.V12.w13' &&
  w15Comps === 'H2620:primary#1@w13[לַחֲס֥וֹת:HR/Vqc]\nH9005:secondary#2@w13[לַ:HR]',
  `w14Row=${w14Row}, w15Row=${w15Row}, w15Comps=${w15Comps}`
);

// 16. Positive Gate: #16 "تَحْتَ" is w14 תַּֽחַת (H8478, HR)
const w16Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`);
check('Positive: Ruth 2:12 #16 "تَحْتَ" is w14 תַּֽחַת (H8478, HR)',
  w16Row === 'H8478|14|תַּֽחַת|HR|preposition|OSHB:B8.C2.V12.w14',
  `row=${w16Row}`
);

// 17. Positive Gate: #17 "جَنَاحَيْهِ" is w15 כְּנָפָֽיו (H3671, HNcfpc/Sp3ms, construct, feminine, plural)
const w17Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, morph_person, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17;`);
check('Positive: Ruth 2:12 #17 "جَنَاحَيْهِ" is w15 כְּנָפָֽיו (H3671, HNcfpc/Sp3ms, construct, feminine, plural)',
  w17Row === 'H3671|15|כְּנָפָֽיו|HNcfpc/Sp3ms|noun|feminine|plural|construct|3|OSHB:B8.C2.V12.w15',
  `row=${w17Row}`
);

// Negative Regressions in isolated scratch DB
const regressions = [
  {
    name: 'Negative: Displaced #8 "عِنْدِ" to w8 (the old buggy state pointing to יְהוָה) is rejected',
    pos: 8,
    sql: `UPDATE word_mappings SET orig_word_position = 8, verified_locator = 'OSHB:B8.C2.V12.w8' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8;`
  },
  {
    name: 'Negative: Displaced #9 "الرَّبِّ" to w9 (pointing to אֱלֹהֵי) is rejected',
    pos: 9,
    sql: `UPDATE word_mappings SET orig_word_position = 9, verified_locator = 'OSHB:B8.C2.V12.w9' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`
  },
  {
    name: 'Negative: Displaced #14 "لِكَيْ" to fake H413 @ w14 is rejected',
    pos: 14,
    sql: `UPDATE word_mappings SET strongs_id = 'H413', orig_surface = 'אֵל', orig_word_position = 14, verified_locator = 'OSHB:B8.C2.V12.w14' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 14;`
  },
  {
    name: 'Negative: Displaced #16 "تَحْتَ" to out-of-bounds w16 is rejected',
    pos: 16,
    sql: `UPDATE word_mappings SET orig_word_position = 16, verified_locator = 'OSHB:B8.C2.V12.w16' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`
  },
  {
    name: 'Negative: Displaced #17 "جَنَاحَيْهِ" to out-of-bounds w17 is rejected',
    pos: 17,
    sql: `UPDATE word_mappings SET orig_word_position = 17, verified_locator = 'OSHB:B8.C2.V12.w17' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17;`
  },
  {
    name: 'Negative: Reverting #5 "أَجْرُكِ" to erroneous H7939 (שָׂכָר) is rejected',
    pos: 5,
    sql: `UPDATE word_mappings SET strongs_id = 'H7939', orig_word = 'שָׂכָר' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;
          UPDATE word_mapping_strongs SET strongs_id = 'H7939' WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5);`
  },
  {
    name: 'Negative: Stripping geresh accent from #5 מַשְׂכֻּרְתֵּ֜ךְ is rejected',
    pos: 5,
    sql: `UPDATE word_mappings SET orig_surface = 'מַשְׂכֻּרְתֵּךְ' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;
          UPDATE word_mapping_strongs SET orig_component = 'מַשְׂכֻּרְתֵּךְ' WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5);`
  },
  {
    name: 'Negative: Dropping secondary H4480 from #8 "عِنْدِ" is rejected',
    pos: 8,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8) AND link_role = 'secondary';`
  },
  {
    name: 'Negative: Dropping secondary H9005 from #15 "تَحْتَمِي" is rejected',
    pos: 15,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15) AND link_role = 'secondary';`
  },
  {
    name: 'Negative: Blanking mandatory component fields on #8 is rejected',
    pos: 8,
    sql: `UPDATE word_mapping_strongs SET orig_component = NULL WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8) AND link_role = 'primary';`
  },
  {
    name: 'Negative: Blanking mandatory component fields on #15 is rejected',
    pos: 15,
    sql: `UPDATE word_mapping_strongs SET orig_component = NULL WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15) AND link_role = 'primary';`
  },
  {
    name: 'Negative: Mutating #5 "أَجْرُكِ" from construct to absolute is rejected',
    pos: 5,
    sql: `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`
  },
  {
    name: 'Negative: Blanking morph_case on #5 "أَجْرُكِ" is rejected',
    pos: 5,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`
  },
  {
    name: 'Negative: Mutating #6 "كَامِلاً" from absolute to construct is rejected',
    pos: 6,
    sql: `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`
  },
  {
    name: 'Negative: Mutating #10 "إِلهِ" from construct to absolute is rejected',
    pos: 10,
    sql: `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`
  },
  {
    name: 'Negative: Blanking morph_case on #10 "إِلهِ" is rejected',
    pos: 10,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`
  },
  {
    name: 'Negative: Mutating #17 "جَنَاحَيْهِ" from construct to absolute is rejected',
    pos: 17,
    sql: `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17;`
  },
  {
    name: 'Negative: Blanking morph_case on #17 "جَنَاحَيْهِ" is rejected',
    pos: 17,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17;`
  },
  {
    name: 'Negative: Removing compound_phrase from #7-#8 (token collision) is rejected',
    pos: 8,
    sql: `UPDATE word_mappings SET relation_type = NULL, grammar_notes = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position IN (7, 8);`
  },
  {
    name: 'Negative: Removing compound_phrase from #14-#15 (token collision) is rejected',
    pos: 15,
    sql: `UPDATE word_mappings SET relation_type = NULL, grammar_notes = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position IN (14, 15);`
  }
];

for (const reg of regressions) {
  fs.copyFileSync(dbPath, scratchDb);
  q(reg.sql, scratchDb);
  const rep = runAudit(scratchDb);
  const alerts = (rep.alerts || []).filter(a => a.verse === 'Ruth 2:12' && (reg.pos ? a.pos === reg.pos : true));
  check(reg.name, alerts.length > 0, `alerts=${JSON.stringify(alerts)}`);
}

// Cleanup scratch files
try { fs.unlinkSync(scratchDb); } catch (_) {}
try { fs.unlinkSync(scratchAuditOut); } catch (_) {}

console.log('\n========================================================================');
console.log(`  RUTH 2:12 GATES SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL ${passCount + failCount})`);
console.log('========================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
