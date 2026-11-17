/**
 * scripts/test_round2_batch2l_mic7_18_gates.cjs
 *
 * Comprehensive Positive & Negative Regression Gates for Micah 7:18 (Batch 2L):
 *
 * Positive Gates:
 *  1. All 19/19 words in Micah 7:18 pass with 0 alerts in strict 4-axis audit.
 *  2. Full OSHB token coverage: w1..w18 covered (100% token coverage, no out-of-bounds locators).
 *  3. #1 "مَنْ" is w1 מִי (H4310, HTi).
 *  4. #2 "هُوَ" is AR_SYNTACTIC:B33.C7.V18.w2.
 *  5. #3 "إِلهٌ" is w2 אֵ֣ל (H410, HNcmsa, absolute).
 *  6. #4 "مِثْلُكَ" is w3 כָּמ֗וֹךָ (H3644, HR/Sp2ms, person 2, masculine, singular).
 *  7. #5 "غَافِرٌ" is w4 נֹשֵׂ֤א (H5375, HVqrmsa, participle, absolute, masculine, singular).
 *  8. #6 "الإِثْمَ" is w5 עָוֺן֙ (H5771, HNcbsa, absolute, common, singular).
 *  9. #7 "وَصَافِحٌ" is w6 וְעֹבֵ֣ר (H5674, HC/Vqrmsa, participle, absolute; secondary H9002 וְ).
 * 10. #8 "عَنِ" is w7 עַל (H5921, HR, preposition).
 * 11. #9 "الذَّنْبِ" is w8 פֶּ֔שַׁע (H6588, HNcmsa, absolute, masculine, singular).
 * 12. #10 "لِبَقِيَّةِ" is w9 לִשְׁאֵרִ֖ית (H7611, HR/Ncfsc, construct, feminine; secondary H9005 לִ).
 * 13. #11 "مِيرَاثِهِ" is w10 נַחֲלָת֑וֹ (H5159, HNcfsc/Sp3ms, construct, person 3).
 * 14. #12 "لاَ" is w11 לֹא (H3808, HTn).
 * 15. #13 "يَحْفَظُ" is w12 הֶחֱזִ֤יק (H2388, HVhp3ms, hiphil, qatal).
 * 16. #14 & #15 "إِلَى الأَبَدِ" form documented compound unit to w13 לָעַד (H9005 + H5703, absolute).
 * 17. #16 "غَضَبَهُ" is w14 אַפּ֔וֹ (H639, HNcmsc/Sp3ms, construct, person 3).
 * 18. #17 "فَإِنَّهُ" is w15 כִּֽי (H3588, HC) with secondary w18 הֽוּא (H1931, HPp3ms).
 * 19. #18 "يُسَرُّ" is w16 חָפֵ֥ץ (H2654, HVqp3ms, qal, qatal, person 3).
 * 20. #19 "بِالرَّأْفَةِ" is w17 חֶ֖סֶד (H2617, HNcmsa, absolute, eliminating w19).
 *
 * Negative Gates (in isolated scratch DB copies):
 * 21. Displaced #3 "إِلهٌ" to w3 (pointing to כָּמוֹךָ) is rejected.
 * 22. Displaced #4 "مِثْلُكَ" to w4 (pointing to נֹשֵׂא) is rejected.
 * 23. Displaced #5 "غَافِرٌ" to w5 (pointing to עָוֹן) is rejected.
 * 24. Displaced #6 "الإِثْمَ" to w6 (pointing to וְעֹבֵר) is rejected.
 * 25. Displaced #7 "وَصَافِحٌ" to w7 (pointing to עַל) is rejected.
 * 26. Displaced #8 "عَنِ" to w8 (pointing to פֶּשַׁע) is rejected.
 * 27. Displaced #9 "الذَّنْبِ" to repeated fake H5771 @ w9 is rejected.
 * 28. Displaced #10 "لِبَقِيَّةِ" to w10 is rejected.
 * 29. Displaced #11 "مِيرَاثِهِ" to w11 is rejected.
 * 30. Displaced #12 "لاَ" to fake H4480 @ w12 is rejected.
 * 31. Displaced #13 "يَحْفَظُ" to fake H5201 @ w13 is rejected.
 * 32. Displaced #16 "غَضَبَهُ" to w16 is rejected.
 * 33. Displaced #18 "يُسَرُّ" to w18 is rejected.
 * 34. Displaced #19 "بِالرَّأْفَةِ" to out-of-bounds w19 is rejected.
 * 35. Spurious secondary H9003 on #19 is rejected.
 * 36. Dropping secondary H9002 from #7 is rejected.
 * 37. Dropping secondary H9005 from #10 is rejected.
 * 38. Dropping secondary H9005 from #15 is rejected.
 * 39. Dropping secondary H1931 from #17 is rejected.
 * 40. Blanking mandatory component fields on #7 is rejected.
 * 41. Blanking mandatory component fields on #10 is rejected.
 * 42. Blanking mandatory component fields on #15 is rejected.
 * 43. Blanking mandatory component fields on #17 is rejected.
 * 44. Mutating #3 "إِلهٌ" from absolute to construct is rejected.
 * 45. Blanking morph_case on #3 is rejected.
 * 46. Mutating #5 "غَافِرٌ" from absolute to construct is rejected.
 * 47. Blanking morph_case on #5 is rejected.
 * 48. Mutating #6 "الإِثْمَ" from absolute to construct is rejected.
 * 49. Blanking morph_case on #6 is rejected.
 * 50. Mutating #7 "وَصَافِحٌ" from absolute to construct is rejected.
 * 51. Blanking morph_case on #7 is rejected.
 * 52. Mutating #9 "الذَّنْبِ" from absolute to construct is rejected.
 * 53. Blanking morph_case on #9 is rejected.
 * 54. Mutating #10 "لِبَقِيَّةِ" from construct to absolute is rejected.
 * 55. Blanking morph_case on #10 is rejected.
 * 56. Mutating #11 "مِيرَاثِهِ" from construct to absolute is rejected.
 * 57. Blanking morph_case on #11 is rejected.
 * 58. Mutating #15 "الأَبَدِ" from absolute to construct is rejected.
 * 59. Blanking morph_case on #15 is rejected.
 * 60. Mutating #16 "غَضَبَهُ" from construct to absolute is rejected.
 * 61. Blanking morph_case on #16 is rejected.
 * 62. Mutating #19 "بِالرَّأْفَةِ" from absolute to construct is rejected.
 * 63. Blanking morph_case on #19 is rejected.
 * 64. Removing compound_phrase from #14-#15 (token collision) is rejected.
 * 65. Removing grammar_notes from #14 or #15 is rejected.
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
const scratchDb = path.join(repoRoot, 'scratch/mic7_18_neg_scratch.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/mic7_18_neg_audit.json');

const VERSE_ID = '11111111-0000-0000-0033-000000007018';

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
console.log('  RUNNING MICAH 7:18 DEDICATED REGRESSION GATES (BATCH 2L)');
console.log('========================================================================\n');

// 1. Positive Gate: All 19 words pass in strict audit
const r2Report = runAudit(dbPath);
const micSummary = r2Report.perVerse.find(v => v.verse === 'Mic 7:18');
const micAlerts = (r2Report.alerts || []).filter(a => a.verse === 'Mic 7:18');

check('Positive: Micah 7:18 has 19/19 clean words', micSummary && micSummary.clean === 19 && micSummary.total === 19, `clean=${micSummary ? micSummary.clean : 0}/19`);
check('Positive: Micah 7:18 has 0 alerts across all 4 axes', micAlerts.length === 0, `alertsCount=${micAlerts.length}, alerts=${JSON.stringify(micAlerts)}`);

// 2. Positive Gate: Full OSHB token coverage (w1..w18)
const tokenRows = q(`
  SELECT DISTINCT orig_word_position
  FROM word_mappings
  WHERE verse_id = '${VERSE_ID}' AND orig_word_position IS NOT NULL
  ORDER BY orig_word_position;
`).split('\n').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
const wmsRows = q(`
  SELECT DISTINCT orig_word_position
  FROM word_mapping_strongs
  WHERE mapping_id IN (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}') AND orig_word_position IS NOT NULL
  ORDER BY orig_word_position;
`).split('\n').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
const allCoveredTokens = Array.from(new Set([...tokenRows, ...wmsRows])).sort((a, b) => a - b);
const expectedTokens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const tokensCovered = expectedTokens.every(t => allCoveredTokens.includes(t)) && allCoveredTokens.length === 18;
check('Positive: Micah 7:18 covers all 18 OSHB Hebrew tokens w1..w18', tokensCovered, `covered=${JSON.stringify(allCoveredTokens)}`);

// 3. Positive Gate: #1 "مَنْ" is w1 מִי (H4310, HTi)
const w1Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;`);
check('Positive: Micah 7:18 #1 "مَنْ" is w1 מִי (H4310, HTi)',
  w1Row === 'H4310|1|מִי|HTi|particle|OSHB:B33.C7.V18.w1',
  `row=${w1Row}`
);

// 4. Positive Gate: #2 "هُوَ" is AR_SYNTACTIC:B33.C7.V18.w2
const w2Row = q(`SELECT strongs_id, orig_surface, morph_pos, relation_type, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 2;`);
check('Positive: Micah 7:18 #2 "هُوَ" is Arabic syntactic copula',
  w2Row === '|—|pronoun|syntactic_copula|AR_SYNTACTIC:B33.C7.V18.w2',
  `row=${w2Row}`
);

// 5. Positive Gate: #3 "إِلهٌ" is w2 אֵ֣ל (H410, HNcmsa, absolute)
const w3Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`);
check('Positive: Micah 7:18 #3 "إِلهٌ" is w2 אֵ֣ל (H410, HNcmsa, absolute)',
  w3Row === 'H410|2|אֵ֣ל|HNcmsa|noun|masculine|singular|absolute|OSHB:B33.C7.V18.w2',
  `row=${w3Row}`
);

// 6. Positive Gate: #4 "مِثْلُكَ" is w3 כָּמ֗וֹךָ (H3644, HR/Sp2ms, person 2, masculine, singular)
const w4Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 4;`);
check('Positive: Micah 7:18 #4 "مِثْلُكَ" is w3 כָּמ֗וֹךָ (H3644, HR/Sp2ms)',
  w4Row === 'H3644|3|כָּמ֗וֹךָ|HR/Sp2ms|preposition|2|masculine|singular|OSHB:B33.C7.V18.w3',
  `row=${w4Row}`
);

// 7. Positive Gate: #5 "غَافِرٌ" is w4 נֹשֵׂ֤א (H5375, HVqrmsa, participle, absolute)
const w5Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_stem, morph_mood, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`);
check('Positive: Micah 7:18 #5 "غَافِرٌ" is w4 נֹשֵׂ֤א (H5375, HVqrmsa, participle, absolute)',
  w5Row === 'H5375|4|נֹשֵׂ֤א|HVqrmsa|verb|qal|participle|masculine|singular|absolute|OSHB:B33.C7.V18.w4',
  `row=${w5Row}`
);

// 8. Positive Gate: #6 "الإِثْمَ" is w5 עָוֺן֙ (H5771, HNcbsa, absolute)
const w6Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`);
check('Positive: Micah 7:18 #6 "الإِثْمَ" is w5 עָוֺן֙ (H5771, HNcbsa, absolute)',
  w6Row === 'H5771|5|עָוֺן֙|HNcbsa|noun|common|singular|absolute|OSHB:B33.C7.V18.w5',
  `row=${w6Row}`
);

// 9. Positive Gate: #7 "وَصَافِحٌ" is w6 וְעֹבֵ֣ר (H5674, HC/Vqrmsa; secondary H9002 וְ)
const w7Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_stem, morph_mood, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7;`);
const w7Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7) ORDER BY link_order;`);
check('Positive: Micah 7:18 #7 "وَصَافِحٌ" is w6 וְעֹבֵ֣ר with secondary H9002',
  w7Row === 'H5674|6|וְעֹבֵ֣ר|HC/Vqrmsa|verb|qal|participle|masculine|singular|absolute|OSHB:B33.C7.V18.w6' &&
  w7Comps === 'H5674:primary#1@w6[וְעֹבֵ֣ר:HC/Vqrmsa]\nH9002:secondary#2@w6[וְ:HC]',
  `w7Row=${w7Row}, w7Comps=${w7Comps}`
);

// 10. Positive Gate: #8 "عَنِ" is w7 עַל (H5921, HR)
const w8Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8;`);
check('Positive: Micah 7:18 #8 "عَنِ" is w7 עַל (H5921, HR)',
  w8Row === 'H5921|7|עַל|HR|preposition|OSHB:B33.C7.V18.w7',
  `row=${w8Row}`
);

// 11. Positive Gate: #9 "الذَّنْبِ" is w8 פֶּ֔שַׁע (H6588, HNcmsa, absolute)
const w9Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`);
check('Positive: Micah 7:18 #9 "الذَّنْبِ" is w8 פֶּ֔שַׁע (H6588, HNcmsa, absolute)',
  w9Row === 'H6588|8|פֶּ֔שַׁע|HNcmsa|noun|masculine|singular|absolute|OSHB:B33.C7.V18.w8',
  `row=${w9Row}`
);

// 12. Positive Gate: #10 "لِبَقِيَّةِ" is w9 לִשְׁאֵרִ֖ית (H7611, HR/Ncfsc, construct; secondary H9005 לִ)
const w10Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`);
const w10Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10) ORDER BY link_order;`);
check('Positive: Micah 7:18 #10 "لِبَقِيَّةِ" is w9 לִשְׁאֵרִ֖ית with secondary H9005',
  w10Row === 'H7611|9|לִשְׁאֵרִ֖ית|HR/Ncfsc|noun|feminine|singular|construct|OSHB:B33.C7.V18.w9' &&
  w10Comps === 'H7611:primary#1@w9[לִשְׁאֵרִ֖ית:HR/Ncfsc]\nH9005:secondary#2@w9[לִ:HR]',
  `w10Row=${w10Row}, w10Comps=${w10Comps}`
);

// 13. Positive Gate: #11 "مِيرَاثِهِ" is w10 נַחֲלָת֑וֹ (H5159, HNcfsc/Sp3ms, construct, person 3)
const w11Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, morph_person, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`);
check('Positive: Micah 7:18 #11 "مِيرَاثِهِ" is w10 נַחֲלָת֑וֹ (H5159, HNcfsc/Sp3ms, construct)',
  w11Row === 'H5159|10|נַחֲלָת֑וֹ|HNcfsc/Sp3ms|noun|feminine|singular|construct|3|OSHB:B33.C7.V18.w10',
  `row=${w11Row}`
);

// 14. Positive Gate: #12 "لاَ" is w11 לֹא (H3808, HTn)
const w12Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 12;`);
check('Positive: Micah 7:18 #12 "لاَ" is w11 לֹא (H3808, HTn)',
  w12Row === 'H3808|11|לֹא|HTn|particle|OSHB:B33.C7.V18.w11',
  `row=${w12Row}`
);

// 15. Positive Gate: #13 "يَحْفَظُ" is w12 הֶחֱזִ֤יק (H2388, HVhp3ms, hiphil)
const w13Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13;`);
check('Positive: Micah 7:18 #13 "يَحْفَظُ" is w12 הֶחֱזִ֤יק (H2388, HVhp3ms)',
  w13Row === 'H2388|12|הֶחֱזִ֤יק|HVhp3ms|verb|hiphil|qatal|indicative|3|masculine|singular|OSHB:B33.C7.V18.w12',
  `row=${w13Row}`
);

// 16. Positive Gate: #14 & #15 "إِلَى الأَبَدِ" form documented compound unit to w13 לָעַד
const w14Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, relation_type, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 14;`);
const w15Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, relation_type, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;`);
const w15Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15) ORDER BY link_order;`);
check('Positive: Micah 7:18 #14 & #15 "إِلَى الأَبَدِ" form documented compound unit to w13 לָעַד',
  w14Row === 'H9005|13|לָעַד֙|HR|preposition|compound_phrase|OSHB:B33.C7.V18.w13' &&
  w15Row === 'H5703|13|לָעַד֙|HR/Ncmsa|noun|masculine|singular|absolute|compound_phrase|OSHB:B33.C7.V18.w13' &&
  w15Comps === 'H5703:primary#1@w13[לָעַד֙:HR/Ncmsa]\nH9005:secondary#2@w13[לָ:HR]',
  `w14Row=${w14Row}, w15Row=${w15Row}, w15Comps=${w15Comps}`
);

// 17. Positive Gate: #16 "غَضَبَهُ" is w14 אַפּ֔וֹ (H639, HNcmsc/Sp3ms, construct, person 3)
const w16Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, morph_person, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`);
check('Positive: Micah 7:18 #16 "غَضَبَهُ" is w14 אַפּ֔וֹ (H639, HNcmsc/Sp3ms)',
  w16Row === 'H639|14|אַפּ֔וֹ|HNcmsc/Sp3ms|noun|masculine|singular|construct|3|OSHB:B33.C7.V18.w14',
  `row=${w16Row}`
);

// 18. Positive Gate: #17 "فَإِنَّهُ" is w15 כִּֽי (H3588, HC) with secondary w18 הֽוּא (H1931, HPp3ms)
const w17Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17;`);
const w17Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17) ORDER BY link_order;`);
check('Positive: Micah 7:18 #17 "فَإِنَّهُ" is w15 כִּֽי with secondary w18 הֽוּא',
  w17Row === 'H3588|15|כִּֽי|HC|conjunction|OSHB:B33.C7.V18.w15' &&
  w17Comps === 'H3588:primary#1@w15[כִּֽי:HC]\nH1931:secondary#2@w18[הֽוּא:HPp3ms]',
  `w17Row=${w17Row}, w17Comps=${w17Comps}`
);

// 19. Positive Gate: #18 "يُسَرُّ" is w16 חָפֵ֥ץ (H2654, HVqp3ms, qal)
const w18Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 18;`);
check('Positive: Micah 7:18 #18 "يُسَرُّ" is w16 חָפֵ֥ץ (H2654, HVqp3ms)',
  w18Row === 'H2654|16|חָפֵ֥ץ|HVqp3ms|verb|qal|qatal|indicative|3|masculine|singular|OSHB:B33.C7.V18.w16',
  `row=${w18Row}`
);

// 20. Positive Gate: #19 "بِالرَّأْفَةِ" is w17 חֶ֖סֶד (H2617, HNcmsa, absolute)
const w19Row = q(`SELECT strongs_id, orig_word_position, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, morph_case, verified_locator FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`);
check('Positive: Micah 7:18 #19 "بِالرَّأْفَةِ" is w17 חֶ֖סֶד (H2617, HNcmsa, absolute)',
  w19Row === 'H2617|17|חֶ֖סֶד|HNcmsa|noun|masculine|singular|absolute|OSHB:B33.C7.V18.w17',
  `row=${w19Row}`
);

// Negative Regressions in isolated scratch DB
const regressions = [
  {
    name: 'Negative: Displaced #3 "إِلهٌ" to w3 is rejected',
    pos: 3,
    sql: `UPDATE word_mappings SET orig_word_position = 3, verified_locator = 'OSHB:B33.C7.V18.w3' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`
  },
  {
    name: 'Negative: Displaced #4 "مِثْلُكَ" to w4 is rejected',
    pos: 4,
    sql: `UPDATE word_mappings SET orig_word_position = 4, verified_locator = 'OSHB:B33.C7.V18.w4' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 4;`
  },
  {
    name: 'Negative: Displaced #5 "غَافِرٌ" to w5 is rejected',
    pos: 5,
    sql: `UPDATE word_mappings SET orig_word_position = 5, verified_locator = 'OSHB:B33.C7.V18.w5' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`
  },
  {
    name: 'Negative: Displaced #6 "الإِثْمَ" to w6 is rejected',
    pos: 6,
    sql: `UPDATE word_mappings SET orig_word_position = 6, verified_locator = 'OSHB:B33.C7.V18.w6' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`
  },
  {
    name: 'Negative: Displaced #7 "وَصَافِحٌ" to w7 is rejected',
    pos: 7,
    sql: `UPDATE word_mappings SET orig_word_position = 7, verified_locator = 'OSHB:B33.C7.V18.w7' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7;`
  },
  {
    name: 'Negative: Displaced #8 "عَنِ" to w8 is rejected',
    pos: 8,
    sql: `UPDATE word_mappings SET orig_word_position = 8, verified_locator = 'OSHB:B33.C7.V18.w8' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8;`
  },
  {
    name: 'Negative: Displaced #9 "الذَّنْبِ" to repeated fake H5771 @ w9 is rejected',
    pos: 9,
    sql: `UPDATE word_mappings SET strongs_id = 'H5771', orig_surface = 'עָוֹן', orig_word_position = 9, verified_locator = 'OSHB:B33.C7.V18.w9' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`
  },
  {
    name: 'Negative: Displaced #10 "لِبَقِيَّةِ" to w10 is rejected',
    pos: 10,
    sql: `UPDATE word_mappings SET orig_word_position = 10, verified_locator = 'OSHB:B33.C7.V18.w10' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`
  },
  {
    name: 'Negative: Displaced #11 "مِيرَاثِهِ" to w11 is rejected',
    pos: 11,
    sql: `UPDATE word_mappings SET orig_word_position = 11, verified_locator = 'OSHB:B33.C7.V18.w11' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`
  },
  {
    name: 'Negative: Displaced #12 "لاَ" to fake H4480 @ w12 is rejected',
    pos: 12,
    sql: `UPDATE word_mappings SET strongs_id = 'H4480', orig_surface = 'מִן', orig_word_position = 12, verified_locator = 'OSHB:B33.C7.V18.w12' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 12;`
  },
  {
    name: 'Negative: Displaced #13 "يَحْفَظُ" to fake H5201 @ w13 is rejected',
    pos: 13,
    sql: `UPDATE word_mappings SET strongs_id = 'H5201', orig_surface = 'נָטַר', orig_word_position = 13, verified_locator = 'OSHB:B33.C7.V18.w13' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13;`
  },
  {
    name: 'Negative: Displaced #16 "غَضَبَهُ" to w16 is rejected',
    pos: 16,
    sql: `UPDATE word_mappings SET orig_word_position = 16, verified_locator = 'OSHB:B33.C7.V18.w16' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`
  },
  {
    name: 'Negative: Displaced #18 "يُسَرُّ" to w18 is rejected',
    pos: 18,
    sql: `UPDATE word_mappings SET orig_word_position = 18, verified_locator = 'OSHB:B33.C7.V18.w18' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 18;`
  },
  {
    name: 'Negative: Displaced #19 "بِالرَّأْفَةِ" to out-of-bounds w19 is rejected',
    pos: 19,
    sql: `UPDATE word_mappings SET orig_word_position = 19, verified_locator = 'OSHB:B33.C7.V18.w19' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`
  },
  {
    name: 'Negative: Spurious secondary H9003 on #19 is rejected',
    pos: 19,
    sql: `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
          VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19), 'H9003', 2, 'secondary', 'בִּ', 17, 'HR', 'oshb_wlc');`
  },
  {
    name: 'Negative: Dropping secondary H9002 from #7 is rejected',
    pos: 7,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7) AND strongs_id = 'H9002';`
  },
  {
    name: 'Negative: Dropping secondary H9005 from #10 is rejected',
    pos: 10,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10) AND strongs_id = 'H9005';`
  },
  {
    name: 'Negative: Dropping secondary H9005 from #15 is rejected',
    pos: 15,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15) AND strongs_id = 'H9005';`
  },
  {
    name: 'Negative: Dropping secondary H1931 from #17 is rejected',
    pos: 17,
    sql: `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17) AND strongs_id = 'H1931';`
  },
  {
    name: 'Negative: Blanking mandatory component fields on #7 is rejected',
    pos: 7,
    sql: `UPDATE word_mapping_strongs SET orig_component = NULL WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7) AND link_role = 'primary';`
  },
  {
    name: 'Negative: Blanking mandatory component fields on #10 is rejected',
    pos: 10,
    sql: `UPDATE word_mapping_strongs SET orig_morphology = NULL WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10) AND link_role = 'primary';`
  },
  {
    name: 'Negative: Blanking mandatory component fields on #15 is rejected',
    pos: 15,
    sql: `UPDATE word_mapping_strongs SET orig_component = NULL WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15) AND link_role = 'primary';`
  },
  {
    name: 'Negative: Blanking mandatory component fields on #17 is rejected',
    pos: 17,
    sql: `UPDATE word_mapping_strongs SET orig_morphology = NULL WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17) AND link_role = 'secondary';`
  },
  {
    name: 'Negative: Mutating #3 "إِلهٌ" from absolute to construct is rejected',
    pos: 3,
    sql: `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`
  },
  {
    name: 'Negative: Blanking morph_case on #3 "إِلهٌ" is rejected',
    pos: 3,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`
  },
  {
    name: 'Negative: Mutating #5 "غَافِرٌ" from absolute to construct is rejected',
    pos: 5,
    sql: `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`
  },
  {
    name: 'Negative: Blanking morph_case on #5 "غَافِرٌ" is rejected',
    pos: 5,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`
  },
  {
    name: 'Negative: Mutating #6 "الإِثْمَ" from absolute to construct is rejected',
    pos: 6,
    sql: `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`
  },
  {
    name: 'Negative: Blanking morph_case on #6 "الإِثْمَ" is rejected',
    pos: 6,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`
  },
  {
    name: 'Negative: Mutating #7 "وَصَافِحٌ" from absolute to construct is rejected',
    pos: 7,
    sql: `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7;`
  },
  {
    name: 'Negative: Blanking morph_case on #7 "وَصَافِحٌ" is rejected',
    pos: 7,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7;`
  },
  {
    name: 'Negative: Mutating #9 "الذَّنْبِ" from absolute to construct is rejected',
    pos: 9,
    sql: `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`
  },
  {
    name: 'Negative: Blanking morph_case on #9 "الذَّنْبِ" is rejected',
    pos: 9,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`
  },
  {
    name: 'Negative: Mutating #10 "لِبَقِيَّةِ" from construct to absolute is rejected',
    pos: 10,
    sql: `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`
  },
  {
    name: 'Negative: Blanking morph_case on #10 "لِبَقِيَّةِ" is rejected',
    pos: 10,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`
  },
  {
    name: 'Negative: Mutating #11 "مِيرَاثِهِ" from construct to absolute is rejected',
    pos: 11,
    sql: `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`
  },
  {
    name: 'Negative: Blanking morph_case on #11 "مِيرَاثِهِ" is rejected',
    pos: 11,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`
  },
  {
    name: 'Negative: Mutating #15 "الأَبَدِ" from absolute to construct is rejected',
    pos: 15,
    sql: `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;`
  },
  {
    name: 'Negative: Blanking morph_case on #15 "الأَبَدِ" is rejected',
    pos: 15,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;`
  },
  {
    name: 'Negative: Mutating #16 "غَضَبَهُ" from construct to absolute is rejected',
    pos: 16,
    sql: `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`
  },
  {
    name: 'Negative: Blanking morph_case on #16 "غَضَبَهُ" is rejected',
    pos: 16,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`
  },
  {
    name: 'Negative: Mutating #19 "بِالرَّأْفَةِ" from absolute to construct is rejected',
    pos: 19,
    sql: `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`
  },
  {
    name: 'Negative: Blanking morph_case on #19 "بِالرَّأْفَةِ" is rejected',
    pos: 19,
    sql: `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`
  },
  {
    name: 'Negative: Removing compound_phrase from #14-#15 (token collision) is rejected',
    pos: 15,
    sql: `UPDATE word_mappings SET relation_type = NULL, grammar_notes = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position IN (14, 15);`
  },
  {
    name: 'Negative: Removing grammar_notes from #14 or #15 is rejected',
    pos: 15,
    sql: `UPDATE word_mappings SET grammar_notes = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position IN (14, 15);`
  }
];

for (const reg of regressions) {
  fs.copyFileSync(dbPath, scratchDb);
  q(reg.sql, scratchDb);
  const rep = runAudit(scratchDb);
  const alerts = (rep.alerts || []).filter(a => a.verse === 'Mic 7:18' && (reg.pos ? a.pos === reg.pos : true));
  check(reg.name, alerts.length > 0, `alerts=${JSON.stringify(alerts)}`);
}

// Cleanup scratch files
try { fs.unlinkSync(scratchDb); } catch (_) {}
try { fs.unlinkSync(scratchAuditOut); } catch (_) {}

console.log('\n========================================================================');
console.log(`  MICAH 7:18 GATES SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL ${passCount + failCount})`);
console.log('========================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
