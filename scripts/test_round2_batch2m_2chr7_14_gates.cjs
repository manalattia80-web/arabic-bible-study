/**
 * scripts/test_round2_batch2m_2chr7_14_gates.cjs
 *
 * Comprehensive Positive & Negative Regression Gates for 2 Chronicles 7:14 (Batch 2M):
 *
 * Positive Gates:
 *  1. All 22/22 words in 2 Chronicles 7:14 pass with 0 alerts in strict 4-axis audit.
 *  2. Full OSHB token coverage: w1..w21 covered (100% token coverage, no out-of-bounds locators).
 *  3. #1 "فَإِذَا" is AR_SYNTACTIC:B14.C7.V14.w1, morph_pos = syntactic_ar, strongs_id is NULL.
 *  4. #2 "تَوَاضَعَ" is w1 וְיִכָּנְע֨וּ (H3665, niphal, yiqtol, passive, indicative; secondary H9002 וְ).
 *  5. #3 "شَعْبِي" is w2 עַמִּ֜י (H5971, construct, masculine, singular).
 *  6. #4 "الَّذِينَ" is w3 אֲשֶׁ֧ר (H834, relative particle).
 *  7. #5 "دُعِيَ" is w4 נִֽקְרָא (H7121, niphal, qatal, passive, indicative).
 *  8. #6 "اسْمِي" is w5 שְׁמִ֣י (H8034, construct, masculine, singular).
 *  9. #7 "عَلَيْهِمْ" is w6 עֲלֵיהֶ֗ם (H5921, preposition, 3mp).
 * 10. #8 "وَصَلَّوْا" is w7 וְיִֽتְפַּֽלְלוּ֙ (H6419, hithpael, yiqtol, indicative; secondary H9002 וְ).
 * 11. #9 "وَطَلَبُوا" is w8 וִֽיבַקְשׁ֣וּ (H1245, piel, yiqtol, indicative; secondary H9002 וִֽ).
 * 12. #10 "وَجْهِي" is w9 פָנַ֔י (H6440, construct, plural).
 * 13. #11 "وَرَجَعُوا" is w10 וְיָשֻׁ֖בוּ (H7725, qal, yiqtol, indicative; secondary H9002 וְ).
 * 14. #12 & #13 "عَنْ طُرُقِهِمِ" form documented compound unit to w11 מִדַּרְכֵיהֶ֣ם (H4480 + H1870, construct; secondary H4480 מִ).
 * 15. #14 "الرَّدِيةِ" is w12 הָרָעִ֑ים (H7451, adjective, absolute, masculine, plural; secondary H9009 הָ).
 * 16. #15 "فَإِنَّنِي" is w13 וַאֲנִי֙ (H589, personal pronoun, 1cs; secondary H9002 וַ).
 * 17. #16 "أَسْمَعُ" is w14 אֶשְׁמַ֣ע (H8085, qal, yiqtol, 1cs, indicative).
 * 18. #17 "مِنَ" is w15 מִן (H4480, preposition).
 * 19. #18 "السَّمَاءِ" is w16 הַשָּׁמַ֔יִם (H8064, noun, absolute, masculine, plural; secondary H9009 הַ).
 * 20. #19 "وَأَغْفِرُ" is w17 וְאֶסְלַח֙ (H5545, qal, yiqtol, 1cs, indicative; secondary H9002 וְ).
 * 21. #20 "خَطِيَّتَهُمْ" is w18 לְחַטָּאתָ֔ם (H2403, noun, construct, feminine, singular; secondary H9005 לְ).
 * 22. #21 "وَأُبْرِئُ" is w19 וְאֶרְפָּ֖א (H7495, qal, yiqtol, 1cs, indicative; secondary H9002 וְ).
 * 23. #22 "أَرْضَهُمْ" is w21 אַרְצָֽם (H776, noun, construct, common, singular) with secondary w20 אֶת (H853, HTo).
 *
 * Negative Regression Gates (in isolated scratch DB copies):
 * 24. Reverting #1 "فَإِذَا" to fake H834 @ w1 is rejected.
 * 25. Mutating #1 "فَإِذَا" morph_pos to 'verb' is rejected.
 * 26. Mutating #1 "فَإِذَا" verified_source away from 'syntactic_ar' is rejected.
 * 27. Displaced #2 "تَوَاضَعَ" to w2 is rejected.
 * 28. Displaced #3 "شَعْبِي" to w3 is rejected.
 * 29. Displaced #4 "الَّذِينَ" to w4 is rejected.
 * 30. Displaced #5 "دُعِيَ" to w5 is rejected.
 * 31. Displaced #6 "اسْمِي" to w6 is rejected.
 * 32. Displaced #7 "عَلَيْهِمْ" to w7 is rejected.
 * 33. Displaced #8 "وَصَلَّوْا" to w8 is rejected.
 * 34. Displaced #9 "وَطَلَبُوا" to w9 is rejected.
 * 35. Displaced #10 "وَجْهِي" to w10 is rejected.
 * 36. Displaced #11 "وَرَجَعُوا" to w11 is rejected.
 * 37. Displaced #12 "عَنْ" to w12 is rejected.
 * 38. Displaced #13 "طُرُقِهِمِ" to w12 is rejected.
 * 39. Displaced #14 "الرَّدِيةِ" to w13 is rejected.
 * 40. Displaced #15 "فَإِنَّنِي" to w14 is rejected.
 * 41. Displaced #16 "أَسْمَعُ" to w15 is rejected.
 * 42. Displaced #17 "مِنَ" to w16 is rejected.
 * 43. Displaced #18 "السَّمَاءِ" to w17 is rejected.
 * 44. Displaced #19 "وَأَغْفِرُ" to w18 is rejected.
 * 45. Displaced #20 "خَطِيَّتَهُمْ" to w19 is rejected.
 * 46. Displaced #21 "وَأُبْرِئُ" to w20 is rejected.
 * 47. Displaced #22 "أَرْضَهُمْ" to out-of-bounds w22 is rejected.
 * 48. Dropping secondary H9002 from #2 is rejected.
 * 49. Dropping secondary H9002 from #8 is rejected.
 * 50. Dropping secondary H9002 from #9 is rejected.
 * 51. Dropping secondary H9002 from #11 is rejected.
 * 52. Dropping secondary H4480 from #13 is rejected.
 * 53. Dropping secondary H9009 from #14 is rejected.
 * 54. Dropping secondary H9002 from #15 is rejected.
 * 55. Dropping secondary H9009 from #18 is rejected.
 * 56. Dropping secondary H9002 from #19 is rejected.
 * 57. Dropping secondary H9005 from #20 is rejected.
 * 58. Dropping secondary H9002 from #21 is rejected.
 * 59. Dropping secondary H853 from #22 is rejected.
 * 60. Mutating #3 "شَعْبِي" from construct to absolute is rejected.
 * 61. Blanking morph_case on #3 is rejected.
 * 62. Mutating #6 "اسْمِي" from construct to absolute is rejected.
 * 63. Blanking morph_case on #6 is rejected.
 * 64. Mutating #10 "وَجْهِي" from construct to absolute is rejected.
 * 65. Blanking morph_case on #10 is rejected.
 * 66. Mutating #13 "طُرُقِهِمِ" from construct to absolute is rejected.
 * 67. Blanking morph_case on #13 is rejected.
 * 68. Mutating #14 "الرَّدِيةِ" from absolute to construct is rejected.
 * 69. Blanking morph_case on #14 is rejected.
 * 70. Mutating #18 "السَّمَاءِ" from absolute to construct is rejected.
 * 71. Blanking morph_case on #18 is rejected.
 * 72. Mutating #20 "خَطِيَّتَهُمْ" from construct to absolute is rejected.
 * 73. Blanking morph_case on #20 is rejected.
 * 74. Mutating #22 "أَرْضَهُمْ" from construct to absolute is rejected.
 * 75. Blanking morph_case on #22 is rejected.
 * 76. Removing compound_phrase relation_type from #12-#13 (token collision) is rejected.
 * 77. Removing grammar_notes from #12 or #13 is rejected.
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
const scratchDb = path.join(repoRoot, 'scratch/chr7_14_neg_scratch.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/chr7_14_neg_audit.json');
if (!fs.existsSync(path.join(repoRoot, 'scratch'))) {
  fs.mkdirSync(path.join(repoRoot, 'scratch'), { recursive: true });
}

const VERSE_ID = '11111111-0000-0000-0014-000000007014';

function q(sql, targetDb = dbPath) {
  return execFileSync(sqlitePath, [targetDb], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

let passCount = 0;
let failCount = 0;

function check(desc, condition, details = '') {
  if (condition) {
    console.log(`  PASS: ${desc}`);
    passCount++;
  } else {
    console.error(`  FAIL: ${desc}${details ? ' -> ' + details : ''}`);
    failCount++;
  }
}

console.log('========================================================================');
console.log('  RUNNING BATCH 2M GATES: 2 CHRONICLES 7:14 VERSE CALIBRATION');
console.log('========================================================================');

// -----------------------------------------------------------------------------
// POSITIVE GATES: In-database assertions & 4-axis audit cleanliness
// -----------------------------------------------------------------------------
console.log('\n--- Section 1: Positive Production DB Gates ---');

const verseCount = parseInt(q(`SELECT COUNT(*) FROM word_mappings WHERE verse_id = '${VERSE_ID}';`), 10);
check('2 Chronicles 7:14 has exactly 22 Arabic records', verseCount === 22, `count=${verseCount}`);

// 1. Audit cleanliness
const auditRaw = execFileSync(process.execPath, [
  auditScript,
  '--manifest', r2ManifestPath,
  '--out', scratchAuditOut
], { encoding: 'utf8' });

const auditReport = JSON.parse(fs.readFileSync(scratchAuditOut, 'utf8'));
const verseReport = auditReport.perVerse.find(v => v.verse === '2Chr 7:14');
const verseAlerts = auditReport.alerts.filter(a => a.verse === '2Chr 7:14');

check('2 Chronicles 7:14 passes 4-axis audit with 22/22 clean (100.0%)',
  verseReport && verseReport.clean === 22 && verseReport.total === 22 && verseReport.alerts === 0,
  `clean=${verseReport?.clean}/${verseReport?.total}, alerts=${verseReport?.alerts}`);

check('2 Chronicles 7:14 has exactly 0 alerts in report alerts array',
  verseAlerts.length === 0,
  `alertsCount=${verseAlerts.length}`);

// 2. Token coverage
const coveredTokens = q(`
  SELECT DISTINCT orig_word_position
  FROM (
    SELECT orig_word_position FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND orig_word_position IS NOT NULL
    UNION
    SELECT orig_word_position FROM word_mapping_strongs WHERE mapping_id IN (
      SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}'
    ) AND orig_word_position IS NOT NULL
  ) ORDER BY orig_word_position;
`).split('\n').map(x => parseInt(x.trim(), 10)).filter(Boolean);

const expectedTokens = Array.from({ length: 21 }, (_, i) => i + 1);
const allTokensCovered = expectedTokens.every(t => coveredTokens.includes(t));
check('All 21 OSHB tokens (w1..w21) are covered by primary or secondary links',
  allTokensCovered && coveredTokens.length === 21,
  `covered=[${coveredTokens.join(', ')}]`);

// 3. pos 1: «فَإِذَا»
const p1 = JSON.parse(q(`
  SELECT json_object(
    'strongs_id', strongs_id,
    'morph_pos', morph_pos,
    'relation_type', relation_type,
    'verified_locator', verified_locator,
    'verified_source', verified_source,
    'morph_source', morph_source,
    'orig_word_position', orig_word_position
  ) FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;
`));
check('#1 "فَإِذَا" is classified as Arabic syntactic conditional with NULL strongs_id',
  p1.strongs_id === null &&
  p1.morph_pos === 'syntactic_ar' &&
  p1.relation_type === 'syntactic_construction' &&
  p1.verified_locator === 'AR_SYNTACTIC:B14.C7.V14.w1' &&
  p1.verified_source === 'syntactic_ar' &&
  p1.morph_source === 'syntactic_ar' &&
  p1.orig_word_position === null,
  JSON.stringify(p1));

// 4. pos 2: «تَوَاضَعَ» -> w1 וְיִכָּנְע֨וּ (H3665) + secondary H9002 וְ
const p2 = JSON.parse(q(`
  SELECT json_object(
    'strongs_id', strongs_id,
    'orig_surface', orig_surface,
    'orig_word_position', orig_word_position,
    'morph_pos', morph_pos,
    'morph_stem', morph_stem,
    'morph_tense', morph_tense,
    'morph_voice', morph_voice,
    'morph_mood', morph_mood
  ) FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 2;
`));
const p2Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 2)
    AND link_role = 'secondary';
`);
check('#2 "تَوَاضَعَ" is w1 וְיִכָּנְע֨וּ (H3665, niphal, yiqtol, passive, indicative) with secondary H9002 וְ',
  p2.strongs_id === 'H3665' && p2.orig_word_position === 1 &&
  p2.morph_stem === 'niphal' && p2.morph_tense === 'yiqtol' && p2.morph_voice === 'passive' && p2.morph_mood === 'indicative' &&
  p2Secondary === 'H9002',
  `p2=${JSON.stringify(p2)}, secondary=${p2Secondary}`);

// 5. pos 3: «شَعْبِي» -> w2 עַמִּ֜י (H5971, construct)
const p3 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos, 'morph_case', morph_case)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;
`));
check('#3 "شَعْبِي" is w2 עַמִּ֜י (H5971, noun construct)',
  p3.strongs_id === 'H5971' && p3.orig_word_position === 2 && p3.morph_case === 'construct',
  JSON.stringify(p3));

// 6. pos 4: «الَّذِينَ» -> w3 אֲשֶׁ֧ר (H834)
const p4 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 4;
`));
check('#4 "الَّذِينَ" is w3 אֲשֶׁ֧ר (H834, relative particle)',
  p4.strongs_id === 'H834' && p4.orig_word_position === 3 && p4.morph_pos === 'particle',
  JSON.stringify(p4));

// 7. pos 5: «دُعِيَ» -> w4 נִֽקְרָא (H7121, niphal qatal passive)
const p5 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos, 'morph_stem', morph_stem, 'morph_tense', morph_tense, 'morph_voice', morph_voice)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;
`));
check('#5 "دُعِيَ" is w4 נִֽקְרָא (H7121, niphal qatal passive)',
  p5.strongs_id === 'H7121' && p5.orig_word_position === 4 && p5.morph_stem === 'niphal' && p5.morph_tense === 'qatal' && p5.morph_voice === 'passive',
  JSON.stringify(p5));

// 8. pos 6: «اسْمِي» -> w5 שְׁמִ֣י (H8034, construct)
const p6 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos, 'morph_case', morph_case)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;
`));
check('#6 "اسْمِي" is w5 שְׁמִ֣י (H8034, noun construct)',
  p6.strongs_id === 'H8034' && p6.orig_word_position === 5 && p6.morph_case === 'construct',
  JSON.stringify(p6));

// 9. pos 7: «عَلَيْهِمْ» -> w6 עֲלֵיהֶ֗ם (H5921)
const p7 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7;
`));
check('#7 "عَلَيْهِمْ" is w6 עֲלֵיהֶ֗ם (H5921, preposition)',
  p7.strongs_id === 'H5921' && p7.orig_word_position === 6 && p7.morph_pos === 'preposition',
  JSON.stringify(p7));

// 10. pos 8: «وَصَلَّوْا» -> w7 וְיִֽתְפַּֽלְלוּ֙ (H6419, hithpael yiqtol) + secondary H9002 וְ
const p8 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_stem', morph_stem, 'morph_tense', morph_tense)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8;
`));
const p8Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8)
    AND link_role = 'secondary';
`);
check('#8 "وَصَلَّوْا" is w7 וְיִֽתְפַּֽלְלוּ֙ (H6419, hithpael yiqtol) with secondary H9002 וְ',
  p8.strongs_id === 'H6419' && p8.orig_word_position === 7 && p8.morph_stem === 'hithpael' && p8.morph_tense === 'yiqtol' && p8Secondary === 'H9002',
  `p8=${JSON.stringify(p8)}, secondary=${p8Secondary}`);

// 11. pos 9: «وَطَلَبُوا» -> w8 וִֽיבַקְשׁ֣וּ (H1245, piel yiqtol) + secondary H9002 וִֽ
const p9 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_stem', morph_stem, 'morph_tense', morph_tense)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;
`));
const p9Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9)
    AND link_role = 'secondary';
`);
check('#9 "وَطَلَبُوا" is w8 וִֽיבַקְשׁ֣וּ (H1245, piel yiqtol) with secondary H9002 וִֽ',
  p9.strongs_id === 'H1245' && p9.orig_word_position === 8 && p9.morph_stem === 'piel' && p9.morph_tense === 'yiqtol' && p9Secondary === 'H9002',
  `p9=${JSON.stringify(p9)}, secondary=${p9Secondary}`);

// 12. pos 10: «وَجْهِي» -> w9 פָנַ֔י (H6440, construct)
const p10 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos, 'morph_case', morph_case)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;
`));
check('#10 "وَجْهِي" is w9 פָנַ֔י (H6440, noun construct)',
  p10.strongs_id === 'H6440' && p10.orig_word_position === 9 && p10.morph_case === 'construct',
  JSON.stringify(p10));

// 13. pos 11: «وَرَجَعُوا» -> w10 וְיָשֻׁ֖בוּ (H7725, qal yiqtol) + secondary H9002 וְ
const p11 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_stem', morph_stem, 'morph_tense', morph_tense)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;
`));
const p11Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11)
    AND link_role = 'secondary';
`);
check('#11 "وَرَجَعُوا" is w10 וְיָשֻׁ֖בוּ (H7725, qal yiqtol) with secondary H9002 וְ',
  p11.strongs_id === 'H7725' && p11.orig_word_position === 10 && p11.morph_stem === 'qal' && p11.morph_tense === 'yiqtol' && p11Secondary === 'H9002',
  `p11=${JSON.stringify(p11)}, secondary=${p11Secondary}`);

// 14. pos 12 & 13: «عَنْ طُرُقِهِمِ» -> documented compound unit to w11 מִדַּרְכֵיהֶ֣ם (H4480 + H1870, construct)
const p12 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'relation_type', relation_type, 'grammar_notes', grammar_notes)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 12;
`));
const p13 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_case', morph_case, 'relation_type', relation_type, 'grammar_notes', grammar_notes)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13;
`));
const p13Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13)
    AND link_role = 'secondary';
`);
check('#12 & #13 "عَنْ طُرُقِهِمِ" form documented compound unit to w11 מִדַּרְכֵיהֶ֣ם (H4480 + H1870 construct; secondary H4480)',
  p12.strongs_id === 'H4480' && p12.orig_word_position === 11 && p12.relation_type === 'compound_phrase' &&
  p13.strongs_id === 'H1870' && p13.orig_word_position === 11 && p13.morph_case === 'construct' && p13.relation_type === 'compound_phrase' &&
  p13Secondary === 'H4480',
  `p12=${JSON.stringify(p12)}, p13=${JSON.stringify(p13)}, secondary=${p13Secondary}`);

// 15. pos 14: «الرَّدِيةِ» -> w12 הָרָעִ֑ים (H7451, adjective absolute) + secondary H9009 הָ
const p14 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos, 'morph_case', morph_case)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 14;
`));
const p14Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 14)
    AND link_role = 'secondary';
`);
check('#14 "الرَّدِيةِ" is w12 הָרָעִ֑ים (H7451, adjective absolute) with secondary H9009 הָ',
  p14.strongs_id === 'H7451' && p14.orig_word_position === 12 && p14.morph_case === 'absolute' && p14Secondary === 'H9009',
  `p14=${JSON.stringify(p14)}, secondary=${p14Secondary}`);

// 16. pos 15: «فَإِنَّنِي» -> w13 וַאֲנִי֙ (H589, personal pronoun 1cs) + secondary H9002 וַ
const p15 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos, 'morph_person', morph_person)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;
`));
const p15Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15)
    AND link_role = 'secondary';
`);
check('#15 "فَإِنَّنِي" is w13 וַאֲנִי֙ (H589, personal pronoun 1cs) with secondary H9002 וַ',
  p15.strongs_id === 'H589' && p15.orig_word_position === 13 && p15.morph_pos === 'personal_pronoun' && p15.morph_person === '1' && p15Secondary === 'H9002',
  `p15=${JSON.stringify(p15)}, secondary=${p15Secondary}`);

// 17. pos 16: «أَسْمَعُ» -> w14 אֶשְׁמַ֣ע (H8085, qal yiqtol 1cs indicative)
const p16 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_stem', morph_stem, 'morph_tense', morph_tense, 'morph_person', morph_person)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;
`));
check('#16 "أَسْمَعُ" is w14 אֶשְׁמַ֣ע (H8085, qal yiqtol 1cs indicative)',
  p16.strongs_id === 'H8085' && p16.orig_word_position === 14 && p16.morph_stem === 'qal' && p16.morph_tense === 'yiqtol' && p16.morph_person === '1',
  JSON.stringify(p16));

// 18. pos 17: «مِنَ» -> w15 מִן (H4480, preposition)
const p17 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17;
`));
check('#17 "مِنَ" is w15 מִן (H4480, preposition)',
  p17.strongs_id === 'H4480' && p17.orig_word_position === 15 && p17.morph_pos === 'preposition',
  JSON.stringify(p17));

// 19. pos 18: «السَّمَاءِ» -> w16 הַשָּׁמַ֔יִם (H8064, noun absolute) + secondary H9009 הַ
const p18 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos, 'morph_case', morph_case)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 18;
`));
const p18Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 18)
    AND link_role = 'secondary';
`);
check('#18 "السَّمَاءِ" is w16 הַשָּׁמַ֔יִם (H8064, noun absolute) with secondary H9009 הַ',
  p18.strongs_id === 'H8064' && p18.orig_word_position === 16 && p18.morph_case === 'absolute' && p18Secondary === 'H9009',
  `p18=${JSON.stringify(p18)}, secondary=${p18Secondary}`);

// 20. pos 19: «وَأَغْفِرُ» -> w17 וְאֶסְלַח֙ (H5545, qal yiqtol 1cs) + secondary H9002 וְ
const p19 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_stem', morph_stem, 'morph_tense', morph_tense)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;
`));
const p19Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19)
    AND link_role = 'secondary';
`);
check('#19 "وَأَغْفِرُ" is w17 וְאֶסְלַח֙ (H5545, qal yiqtol 1cs) with secondary H9002 וְ',
  p19.strongs_id === 'H5545' && p19.orig_word_position === 17 && p19.morph_stem === 'qal' && p19.morph_tense === 'yiqtol' && p19Secondary === 'H9002',
  `p19=${JSON.stringify(p19)}, secondary=${p19Secondary}`);

// 21. pos 20: «خَطِيَّتَهُمْ» -> w18 לְחַטָּאתָ֔ם (H2403, noun construct) + secondary H9005 לְ
const p20 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos, 'morph_case', morph_case)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 20;
`));
const p20Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 20)
    AND link_role = 'secondary';
`);
check('#20 "خَطِيَّتَهُمْ" is w18 לְחַטָּאתָ֔ם (H2403, noun construct) with secondary H9005 לְ',
  p20.strongs_id === 'H2403' && p20.orig_word_position === 18 && p20.morph_case === 'construct' && p20Secondary === 'H9005',
  `p20=${JSON.stringify(p20)}, secondary=${p20Secondary}`);

// 22. pos 21: «وَأُبْرِئُ» -> w19 וְאֶרְפָּ֖א (H7495, qal yiqtol 1cs) + secondary H9002 וְ
const p21 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_stem', morph_stem, 'morph_tense', morph_tense)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 21;
`));
const p21Secondary = q(`
  SELECT strongs_id FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 21)
    AND link_role = 'secondary';
`);
check('#21 "وَأُبْرِئُ" is w19 וְאֶרְפָּ֖א (H7495, qal yiqtol 1cs) with secondary H9002 וְ',
  p21.strongs_id === 'H7495' && p21.orig_word_position === 19 && p21.morph_stem === 'qal' && p21.morph_tense === 'yiqtol' && p21Secondary === 'H9002',
  `p21=${JSON.stringify(p21)}, secondary=${p21Secondary}`);

// 23. pos 22: «أَرْضَهُمْ» -> w21 אַרְצָֽם (H776, noun construct) with secondary w20 אֶת (H853, HTo)
const p22 = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'morph_pos', morph_pos, 'morph_case', morph_case)
  FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 22;
`));
const p22Secondary = JSON.parse(q(`
  SELECT json_object('strongs_id', strongs_id, 'orig_word_position', orig_word_position, 'orig_morphology', orig_morphology)
  FROM word_mapping_strongs
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 22)
    AND link_role = 'secondary';
`));
check('#22 "أَرْضَهُمْ" is w21 אַרְצָֽם (H776, noun construct) with secondary w20 אֶת (H853, HTo)',
  p22.strongs_id === 'H776' && p22.orig_word_position === 21 && p22.morph_case === 'construct' &&
  p22Secondary.strongs_id === 'H853' && p22Secondary.orig_word_position === 20 && p22Secondary.orig_morphology === 'HTo',
  `p22=${JSON.stringify(p22)}, secondary=${JSON.stringify(p22Secondary)}`);

// -----------------------------------------------------------------------------
// NEGATIVE REGRESSION GATES: Mutate isolated scratch DB copies and verify rejection
// -----------------------------------------------------------------------------
console.log('\n--- Section 2: Negative Regression Scratch Gates ---');

function setupScratch() {
  fs.copyFileSync(dbPath, scratchDb);
}

function runScratchAudit(targetDb = scratchDb) {
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
  const rep = JSON.parse(fs.readFileSync(scratchAuditOut, 'utf8'));
  return (rep.alerts || []).filter(a => a.verse === '2Chr 7:14');
}

// 24. Reverting #1 "فَإِذَا" to fake H834 @ w1 triggers alert
setupScratch();
q(`
  UPDATE word_mappings SET
    strongs_id = 'H834',
    orig_surface = 'וְיִכָּנְע֨וּ',
    orig_word = 'כָּנַע',
    orig_word_position = 1,
    orig_morphology = 'HC/VNi3mp',
    morph_pos = 'particle',
    relation_type = 'primary',
    verified_locator = 'OSHB:B14.C7.V14.w1',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;
`, scratchDb);
let alerts = runScratchAudit();
check('Negative Gate 24: Reverting #1 "فَإِذَا" to fake H834 @ w1 triggers audit alerts',
  alerts.some(a => a.pos === 1),
  `alerts=${JSON.stringify(alerts.filter(a => a.pos === 1))}`);

// 25. Mutating #1 "فَإِذَا" morph_pos to 'verb' triggers alert
setupScratch();
q(`
  UPDATE word_mappings SET morph_pos = 'verb'
  WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;
`, scratchDb);
alerts = runScratchAudit();
check('Negative Gate 25: Mutating #1 "فَإِذَا" morph_pos to "verb" triggers audit alert',
  alerts.some(a => a.pos === 1),
  `alerts=${JSON.stringify(alerts.filter(a => a.pos === 1))}`);

// 26. Mutating #1 "فَإِذَا" verified_source away from 'syntactic_ar' triggers alert
setupScratch();
q(`
  UPDATE word_mappings SET verified_source = 'oshb_wlc'
  WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;
`, scratchDb);
alerts = runScratchAudit();
check('Negative Gate 26: Mutating #1 "فَإِذَا" verified_source to "oshb_wlc" triggers audit alert',
  alerts.some(a => a.pos === 1),
  `alerts=${JSON.stringify(alerts.filter(a => a.pos === 1))}`);

// 27-47. Displacements across verse positions
const displacementCases = [
  { pos: 2, badW: 2, label: '#2 تَوَاضَعَ to w2' },
  { pos: 3, badW: 3, label: '#3 شَعْبِي to w3' },
  { pos: 4, badW: 4, label: '#4 الَّذِينَ to w4' },
  { pos: 5, badW: 5, label: '#5 دُعِيَ to w5' },
  { pos: 6, badW: 6, label: '#6 اسْمِي to w6' },
  { pos: 7, badW: 7, label: '#7 عَلَيْهِمْ to w7' },
  { pos: 8, badW: 8, label: '#8 وَصَلَّوْا to w8' },
  { pos: 9, badW: 9, label: '#9 وَطَلَبُوا to w9' },
  { pos: 10, badW: 10, label: '#10 وَجْهِي to w10' },
  { pos: 11, badW: 11, label: '#11 وَرَجَعُوا to w11' },
  { pos: 12, badW: 12, label: '#12 عَنْ to w12' },
  { pos: 13, badW: 12, label: '#13 طُرُقِهِمِ to w12' },
  { pos: 14, badW: 13, label: '#14 الرَّدِيةِ to w13' },
  { pos: 15, badW: 14, label: '#15 فَإِنَّنِي to w14' },
  { pos: 16, badW: 15, label: '#16 أَسْمَعُ to w15' },
  { pos: 17, badW: 16, label: '#17 مِنَ to w16' },
  { pos: 18, badW: 17, label: '#18 السَّمَاءِ to w17' },
  { pos: 19, badW: 18, label: '#19 وَأَغْفِرُ to w18' },
  { pos: 20, badW: 19, label: '#20 خَطِيَّتَهُمْ to w19' },
  { pos: 21, badW: 20, label: '#21 وَأُبْرِئُ to w20' },
  { pos: 22, badW: 22, label: '#22 أَرْضَهُمْ to out-of-bounds w22' }
];

let gateNum = 27;
for (const tc of displacementCases) {
  setupScratch();
  q(`
    UPDATE word_mappings SET
      orig_word_position = ${tc.badW},
      verified_locator = 'OSHB:B14.C7.V14.w${tc.badW}'
    WHERE verse_id = '${VERSE_ID}' AND ar_word_position = ${tc.pos};
  `, scratchDb);
  alerts = runScratchAudit();
  check(`Negative Gate ${gateNum}: Displacing ${tc.label} triggers audit alert`,
    alerts.some(a => a.pos === tc.pos),
    `alerts=${JSON.stringify(alerts.filter(a => a.pos === tc.pos))}`);
  gateNum++;
}

// 48-59. Component drops
const secondaryDropCases = [
  { pos: 2, strongs: 'H9002', label: '#2 secondary H9002' },
  { pos: 8, strongs: 'H9002', label: '#8 secondary H9002' },
  { pos: 9, strongs: 'H9002', label: '#9 secondary H9002' },
  { pos: 11, strongs: 'H9002', label: '#11 secondary H9002' },
  { pos: 13, strongs: 'H4480', label: '#13 secondary H4480' },
  { pos: 14, strongs: 'H9009', label: '#14 secondary H9009' },
  { pos: 15, strongs: 'H9002', label: '#15 secondary H9002' },
  { pos: 18, strongs: 'H9009', label: '#18 secondary H9009' },
  { pos: 19, strongs: 'H9002', label: '#19 secondary H9002' },
  { pos: 20, strongs: 'H9005', label: '#20 secondary H9005' },
  { pos: 21, strongs: 'H9002', label: '#21 secondary H9002' },
  { pos: 22, strongs: 'H853', label: '#22 secondary H853' }
];

for (const sc of secondaryDropCases) {
  setupScratch();
  q(`
    DELETE FROM word_mapping_strongs
    WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = ${sc.pos})
      AND link_role = 'secondary' AND strongs_id = '${sc.strongs}';
  `, scratchDb);
  alerts = runScratchAudit();
  check(`Negative Gate ${gateNum}: Dropping ${sc.label} triggers audit alert`,
    alerts.some(a => a.pos === sc.pos),
    `alerts=${JSON.stringify(alerts.filter(a => a.pos === sc.pos))}`);
  gateNum++;
}

// 60-75. Nominal case mutations & blanking
const nominalCases = [
  { pos: 3, from: 'construct', to: 'absolute', label: '#3 شَعْبِي' },
  { pos: 6, from: 'construct', to: 'absolute', label: '#6 اسْمِي' },
  { pos: 10, from: 'construct', to: 'absolute', label: '#10 وَجْهِي' },
  { pos: 13, from: 'construct', to: 'absolute', label: '#13 طُرُقِهِمِ' },
  { pos: 14, from: 'absolute', to: 'construct', label: '#14 الرَّدِيةِ' },
  { pos: 18, from: 'absolute', to: 'construct', label: '#18 السَّمَاءِ' },
  { pos: 20, from: 'construct', to: 'absolute', label: '#20 خَطِيَّتَهُمْ' },
  { pos: 22, from: 'construct', to: 'absolute', label: '#22 أَرْضَهُمْ' }
];

for (const nc of nominalCases) {
  // Mutation to opposite state
  setupScratch();
  q(`
    UPDATE word_mappings SET morph_case = '${nc.to}'
    WHERE verse_id = '${VERSE_ID}' AND ar_word_position = ${nc.pos};
  `, scratchDb);
  alerts = runScratchAudit();
  check(`Negative Gate ${gateNum}: Mutating ${nc.label} from ${nc.from} to ${nc.to} triggers morphology alert`,
    alerts.some(a => a.pos === nc.pos && a.axes.morphology.length > 0),
    `alerts=${JSON.stringify(alerts.filter(a => a.pos === nc.pos))}`);
  gateNum++;

  // Blanking morph_case
  setupScratch();
  q(`
    UPDATE word_mappings SET morph_case = NULL
    WHERE verse_id = '${VERSE_ID}' AND ar_word_position = ${nc.pos};
  `, scratchDb);
  alerts = runScratchAudit();
  check(`Negative Gate ${gateNum}: Blanking morph_case on ${nc.label} triggers morphology alert`,
    alerts.some(a => a.pos === nc.pos && a.axes.morphology.length > 0),
    `alerts=${JSON.stringify(alerts.filter(a => a.pos === nc.pos))}`);
  gateNum++;
}

// 76. Removing compound_phrase relation_type from pos 12-13
setupScratch();
q(`
  UPDATE word_mappings SET relation_type = 'primary'
  WHERE verse_id = '${VERSE_ID}' AND ar_word_position IN (12, 13);
`, scratchDb);
alerts = runScratchAudit();
check(`Negative Gate 76: Removing compound_phrase relation_type from #12-#13 triggers locator/collision alert`,
  alerts.some(a => a.pos === 12 || a.pos === 13),
  `alerts=${JSON.stringify(alerts.filter(a => a.pos === 12 || a.pos === 13))}`);

// 77. Removing grammar_notes from pos 12 or 13
setupScratch();
q(`
  UPDATE word_mappings SET grammar_notes = NULL
  WHERE verse_id = '${VERSE_ID}' AND ar_word_position IN (12, 13);
`, scratchDb);
alerts = runScratchAudit();
check(`Negative Gate 77: Removing grammar_notes from #12-#13 triggers compound unit alert`,
  alerts.some(a => a.pos === 12 || a.pos === 13),
  `alerts=${JSON.stringify(alerts.filter(a => a.pos === 12 || a.pos === 13))}`);

// Cleanup scratch DB & audit output
try { fs.unlinkSync(scratchDb); } catch (_) {}
try { fs.unlinkSync(scratchAuditOut); } catch (_) {}

console.log('\n========================================================================');
console.log(`  BATCH 2M GATES SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL ${passCount + failCount})`);
console.log('========================================================================');

if (failCount > 0) {
  process.exit(1);
}
