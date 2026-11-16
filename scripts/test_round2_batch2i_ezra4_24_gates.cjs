/**
 * scripts/test_round2_batch2i_ezra4_24_gates.cjs
 *
 * Comprehensive Positive & Negative Regression Gates for Ezra 4:24 (Batch 2I):
 *
 * Positive Gates:
 * 1.  All 18/18 words in Ezra 4:24 pass with 0 alerts in strict 4-axis audit.
 * 2.  Full OSHB token coverage: w1..w16 covered (100% token coverage).
 * 3.  #1 "حِينَئِذٍ" is w1 בֵּאדַ֗יִן (H116, AR/D).
 * 4.  #2 "تَوَقَّفَ" is w2 בְּטֵלַת֙ (H989, AVqp3fs).
 * 5.  #3 "عَمَلُ" is w3 עֲבִידַ֣ת (H5673, ANcfsc).
 * 6.  #4 "بَيْتِ" is w4 בֵּית (H1005, ANcmsc).
 * 7.  #5 "اللهِ" is w5 אֱלָהָ֔א (H426, ANcmsd/Td).
 * 8.  #6 "الَّذِي" is w6 דִּ֖י (H1768, ATr).
 * 9.  #7 "فِي" & #8 "أُورُشَلِيمَ" form a documented compound alignment unit to w7 בִּירֽוּשְׁלֶ֑ם (AR/Np).
 * 10. #7 "فِي" has primary H9003@w7.
 * 11. #8 "أُورُشَلِيمَ" has primary H3390@w7 and secondary H9003@w7.
 * 12. #9 "وَكَانَ" is w8 וַהֲوָת֙ (H1934, AC/Vqp3fs) with primary H1934 and secondary H9002.
 * 13. #10 "مُتَوَقِّفًا" is w9 בָּֽטְלָ֔א (H989, AVqrfsa).
 * 14. #11 "إِلَى" is w10 עַ֚ד (H5705, AR).
 * 15. #12 "السَّنَةِ" is w11 שְׁנַ֣ת (H8140, ANcfsc).
 * 16. #13 "الثَّانِيَةِ" is w12 תַּרְתֵּ֔ין (H8648, AAocpa).
 * 17. #14 "مِنْ" & #15 "مُلْكِ" form a documented compound alignment unit to w13 לְמַלְכ֖וּת (AR/Ncfsc).
 * 18. #14 "مِنْ" has primary H9005@w13.
 * 19. #15 "مُلْكِ" has primary H4437@w13 and secondary H9005@w13.
 * 20. #16 "دَارِيُوسَ" is w14 דָּרְיָ֥וֶשׁ (H1868, ANp).
 * 21. #17 "مَلِكِ" is w15 מֶֽלֶךְ (H4430, ANcmsc).
 * 22. #18 "فَارِسَ" is w16 פָּרָֽס (H6540, ANp).
 *
 * Negative Gates:
 * 23. Displaced #17 "مَلِكِ" to w17 (exceeding 16 tokens) is rejected.
 * 24. Displaced #18 "فَارِسَ" to w18 / wrong H6543 is rejected.
 * 25. Reverting #3 "عَمَلُ" to wrong verb H5648 is rejected.
 * 26. Reverting #12 "السَّنَةِ" to Hebrew H8139 is rejected.
 * 27. Reverting #13 "الثَّانِيَةِ" to fake H8524 (תָּלַל) is rejected.
 * 28. Converting required lexical #13 "الثَّانِيَةِ" to syntactic_ar is rejected.
 * 29. Dropping secondary H9003 from #8 "أُورُشَلِيمَ" is rejected.
 * 30. Dropping secondary H9005 from #15 "مُلْكِ" is rejected.
 * 31. Blanking mandatory component fields on #7 "فِي" is rejected.
 * 32. Blanking mandatory component fields on #14 "مِنْ" is rejected.
 * 33. Token collision by mapping #18 to w15 without compound_phrase is rejected.
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

const scratchAuditOut = path.join(repoRoot, 'scratch/ezra4_24_gates_audit.json');

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
console.log('  RUNNING EZRA 4:24 DEDICATED REGRESSION GATES (BATCH 2I)');
console.log('========================================================================\n');

// 1. Positive Gate: Ezra 4:24 has 18/18 clean words and 0 alerts in current DB
const auditRep = runHoldoutAudit(dbPath);
const ezraVerseRep = (auditRep.perVerse || []).find(v => v.verse === 'Ezra 4:24');
const ezraAlerts = (auditRep.alerts || []).filter(a => a.verse === 'Ezra 4:24');

check('Positive: Ezra 4:24 has 18/18 clean words', ezraVerseRep && ezraVerseRep.clean === 18 && ezraVerseRep.total === 18, `clean=${ezraVerseRep ? ezraVerseRep.clean : 'null'}/18`);
check('Positive: Ezra 4:24 has 0 alerts across all 4 axes', ezraAlerts.length === 0, `alertsCount=${ezraAlerts.length}`);

// 2. Positive Gate: w1..w16 full OSHB token coverage
const coveredTokens = new Set();
for (let p = 1; p <= 18; p++) {
  const loc = q(`SELECT verified_locator FROM word_mappings WHERE verse_id = '11111111-0000-0000-0015-000000004024' AND ar_word_position = ${p};`);
  const m = loc.match(/\.w(\d+)$/);
  if (m) coveredTokens.add(Number(m[1]));
}
const allCovered = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].every(w => coveredTokens.has(w));
check('Positive: Ezra 4:24 covers all 16 OSHB Aramaic tokens w1..w16', allCovered, `covered=${Array.from(coveredTokens).sort((a,b)=>a-b).join(',')}`);

// 3. Positive Gate: #1 "حِينَئِذٍ" is w1 בֵּאדַ֗יִן (H116, AR/D)
const w1Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = 'f08a986f-c3b0-45b4-9fdb-b0ddfe079e5b';`);
check('Positive: Ezra 4:24 #1 "حِينَئِذٍ" is w1 בֵּאדַ֗יִן (H116, AR/D)',
  w1Row === 'H116|1|אֱדַיִן|בֵּאדַ֗יִן|AR/D|adverb|OSHB:B15.C4.V24.w1',
  `row=${w1Row}`
);

// 4. Positive Gate: #2 "تَوَقَّفَ" is w2 בְּטֵלַת֙ (H989, AVqp3fs)
const w2Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = 'e49c2349-7fa9-4e84-b3ea-b3b26e17cf41';`);
check('Positive: Ezra 4:24 #2 "تَوَقَّفَ" is w2 בְּטֵלַת֙ (H989, AVqp3fs)',
  w2Row === 'H989|2|בְּטֵל|בְּטֵלַת֙|AVqp3fs|verb|peal|qatal|indicative|3|feminine|singular|OSHB:B15.C4.V24.w2',
  `row=${w2Row}`
);

// 5. Positive Gate: #3 "عَمَلُ" is w3 עֲבִידַ֣ת (H5673, ANcfsc)
const w3Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = '87ff9be5-306a-4640-9ea5-ccee6d2ffad7';`);
check('Positive: Ezra 4:24 #3 "عَمَلُ" is w3 עֲבִידַ֣ת (H5673, ANcfsc)',
  w3Row === 'H5673|3|עֲבִידָה|עֲבִידַ֣ת|ANcfsc|noun|feminine|singular|OSHB:B15.C4.V24.w3',
  `row=${w3Row}`
);

// 6. Positive Gate: #4 "بَيْتِ" is w4 בֵּית (H1005, ANcmsc)
const w4Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = 'ffd798e9-e0c5-4545-ad9c-8d50e6ea2787';`);
check('Positive: Ezra 4:24 #4 "بَيْتِ" is w4 בֵּית (H1005, ANcmsc)',
  w4Row === 'H1005|4|בַּיִת|בֵּית|ANcmsc|noun|masculine|singular|OSHB:B15.C4.V24.w4',
  `row=${w4Row}`
);

// 7. Positive Gate: #5 "اللهِ" is w5 אֱלָהָ֔א (H426, ANcmsd/Td)
const w5Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = '60f8695e-d5c0-4422-9b4e-66ce2bb9f991';`);
check('Positive: Ezra 4:24 #5 "اللهِ" is w5 אֱלָהָ֔א (H426, ANcmsd/Td)',
  w5Row === 'H426|5|אֱלָהּ|אֱלָהָ֔א|ANcmsd/Td|noun|masculine|singular|OSHB:B15.C4.V24.w5',
  `row=${w5Row}`
);

// 8. Positive Gate: #6 "الَّذِي" is w6 דִּ֖י (H1768, ATr)
const w6Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = 'fd87f45a-87b3-46fa-9f21-eedbb16415f0';`);
check('Positive: Ezra 4:24 #6 "الَّذِي" is w6 דִּ֖י (H1768, ATr)',
  w6Row === 'H1768|6|דִּי|דִּ֖י|ATr|relative_pronoun|OSHB:B15.C4.V24.w6',
  `row=${w6Row}`
);

// 9. Positive Gate: #7 "فِي" & #8 "أُورُشَلِيمَ" form a documented compound alignment unit to w7 בִּירֽוּשְׁלֶ֑ם
const w7Rel = q(`SELECT relation_type, verified_locator FROM word_mappings WHERE id = '96ef5ff9-810b-40e8-b1e1-612db23542a7';`);
const w8Rel = q(`SELECT relation_type, verified_locator FROM word_mappings WHERE id = '61ae44e3-95c0-4acc-9739-099e8a539ca1';`);
check('Positive: Ezra 4:24 #7 & #8 form documented compound unit to w7',
  w7Rel === 'compound_phrase|OSHB:B15.C4.V24.w7' && w8Rel === 'compound_phrase|OSHB:B15.C4.V24.w7',
  `w7Rel=${w7Rel}, w8Rel=${w8Rel}`
);

// 10. Positive Gate: #7 "فِي" has primary H9003@w7
const w7Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '96ef5ff9-810b-40e8-b1e1-612db23542a7' ORDER BY link_order;`);
check('Positive: Ezra 4:24 #7 "فِي" has primary H9003@w7',
  w7Comps === 'H9003:primary#1@w7[בִּירֽוּשְׁלֶ֑ם:AR]',
  `comps=${w7Comps}`
);

// 11. Positive Gate: #8 "أُورُشَلِيمَ" has primary H3390@w7 and secondary H9003@w7
const w8Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '61ae44e3-95c0-4acc-9739-099e8a539ca1' ORDER BY link_order;`);
check('Positive: Ezra 4:24 #8 "أُورُشَلِيمَ" has primary H3390@w7 and secondary H9003@w7',
  w8Comps === 'H3390:primary#1@w7[בִּירֽוּשְׁלֶ֑ם:AR/Np]\nH9003:secondary#2@w7[בִּ:AR]',
  `comps=${w8Comps}`
);

// 12. Positive Gate: #9 "وَكَانَ" is w8 וַהֲוָת֙ (H1934, AC/Vqp3fs) with primary H1934 and secondary H9002
const w9Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_stem, morph_tense, morph_mood, morph_person, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = '58c5b8e4-c0ae-4b94-b62c-d27885ac30f6';`);
const w9Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position FROM word_mapping_strongs WHERE mapping_id = '58c5b8e4-c0ae-4b94-b62c-d27885ac30f6' ORDER BY link_order;`);
check('Positive: Ezra 4:24 #9 "وَكَانَ" is w8 וַהֲוָת֙ with primary H1934 and secondary H9002',
  w9Row === 'H1934|8|הָוָא|וַהֲוָת֙|AC/Vqp3fs|verb|peal|qatal|indicative|3|feminine|singular|OSHB:B15.C4.V24.w8' &&
  w9Comps === 'H1934:primary#1@w8\nH9002:secondary#2@w8',
  `row=${w9Row}, comps=${w9Comps}`
);

// 13. Positive Gate: #10 "مُتَوَقِّفًا" is w9 בָּֽטְלָ֔א (H989, AVqrfsa)
const w10Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_stem, morph_mood, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = '0e4fc869-c3e1-48f7-b8d7-2909060cd0a9';`);
check('Positive: Ezra 4:24 #10 "مُتَوَقِّفًا" is w9 בָּֽטְלָ֔א (H989, AVqrfsa, feminine participle)',
  w10Row === 'H989|9|בְּטֵל|בָּֽטְלָ֔א|AVqrfsa|verb|peal|participle|feminine|singular|OSHB:B15.C4.V24.w9',
  `row=${w10Row}`
);

// 14. Positive Gate: #11 "إِلَى" is w10 עַ֚ד (H5705, AR)
const w11Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = '0cc6e556-38aa-4e26-84d8-3dcf0d1d3afe';`);
check('Positive: Ezra 4:24 #11 "إِلَى" is w10 עַ֚ד (H5705, AR)',
  w11Row === 'H5705|10|עַד|עַ֚ד|AR|preposition|OSHB:B15.C4.V24.w10',
  `row=${w11Row}`
);

// 15. Positive Gate: #12 "السَّنَةِ" is w11 שְׁנַ֣ת (H8140, ANcfsc)
const w12Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = '6353d57a-bbfd-4867-ba7f-50c339e42cce';`);
check('Positive: Ezra 4:24 #12 "السَّنَةِ" is w11 שְׁנַ֣ת (H8140, ANcfsc)',
  w12Row === 'H8140|11|שְׁנָה|שְׁנַ֣ת|ANcfsc|noun|feminine|singular|OSHB:B15.C4.V24.w11',
  `row=${w12Row}`
);

// 16. Positive Gate: #13 "الثَّانِيَةِ" is w12 תַּרְתֵּ֔ין (H8648, AAocpa)
const w13Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = '15cdd9cb-79bd-48ca-b074-35cdd3c529d6';`);
check('Positive: Ezra 4:24 #13 "الثَّانِيَةِ" is w12 תַּרְתֵּ֔ין (H8648, AAocpa)',
  w13Row === 'H8648|12|תְּרֵין|תַּרְתֵּ֔ין|AAocpa|numeral|common|plural|OSHB:B15.C4.V24.w12',
  `row=${w13Row}`
);

// 17. Positive Gate: #14 "مِنْ" & #15 "مُلْكِ" form a documented compound alignment unit to w13 לְמַלְכ֖וּת
const w14Rel = q(`SELECT relation_type, verified_locator FROM word_mappings WHERE id = '1e50946d-42a0-49be-b9c1-f052c31448c1';`);
const w15Rel = q(`SELECT relation_type, verified_locator FROM word_mappings WHERE id = '9eb33f1c-3123-4d13-a109-f93b758521f8';`);
check('Positive: Ezra 4:24 #14 & #15 form documented compound unit to w13',
  w14Rel === 'compound_phrase|OSHB:B15.C4.V24.w13' && w15Rel === 'compound_phrase|OSHB:B15.C4.V24.w13',
  `w14Rel=${w14Rel}, w15Rel=${w15Rel}`
);

// 18. Positive Gate: #14 "مِنْ" has primary H9005@w13
const w14Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '1e50946d-42a0-49be-b9c1-f052c31448c1' ORDER BY link_order;`);
check('Positive: Ezra 4:24 #14 "مِنْ" has primary H9005@w13',
  w14Comps === 'H9005:primary#1@w13[לְמַלְכ֖וּת:AR]',
  `comps=${w14Comps}`
);

// 19. Positive Gate: #15 "مُلْكِ" has primary H4437@w13 and secondary H9005@w13
const w15Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '9eb33f1c-3123-4d13-a109-f93b758521f8' ORDER BY link_order;`);
check('Positive: Ezra 4:24 #15 "مُلْكِ" has primary H4437@w13 and secondary H9005@w13',
  w15Comps === 'H4437:primary#1@w13[לְמַלְכ֖וּת:AR/Ncfsc]\nH9005:secondary#2@w13[לְ:AR]',
  `comps=${w15Comps}`
);

// 20. Positive Gate: #16 "دَارِيُوسَ" is w14 דָּרְיָ֥וֶשׁ (H1868, ANp)
const w16Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = '3317040f-c91c-4fff-8d12-e947fd69e624';`);
check('Positive: Ezra 4:24 #16 "دَارِيُوسَ" is w14 דָּרְיָ֥וֶשׁ (H1868, ANp)',
  w16Row === 'H1868|14|דָּֽרְיָוֵשׁ|דָּרְיָ֥וֶשׁ|ANp|proper_noun|masculine|singular|OSHB:B15.C4.V24.w14',
  `row=${w16Row}`
);

// 21. Positive Gate: #17 "مَلِكِ" is w15 מֶֽלֶךְ (H4430, ANcmsc)
const w17Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = 'cf20cd75-f155-45e0-a1d6-4637a75b2e11';`);
check('Positive: Ezra 4:24 #17 "مَلِكِ" is w15 מֶֽלֶךְ (H4430, ANcmsc)',
  w17Row === 'H4430|15|מֶלֶךְ|מֶֽלֶךְ|ANcmsc|noun|masculine|singular|OSHB:B15.C4.V24.w15',
  `row=${w17Row}`
);

// 22. Positive Gate: #18 "فَارِسَ" is w16 פָּרָֽס (H6540, ANp)
const w18Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, morph_number, verified_locator FROM word_mappings WHERE id = '34807510-6342-4c61-ba5e-42bdcc40ce5a';`);
check('Positive: Ezra 4:24 #18 "فَارِسَ" is w16 פָּרָֽס (H6540, ANp)',
  w18Row === 'H6540|16|פָּרַס|פָּרָֽס|ANp|proper_noun|masculine|singular|OSHB:B15.C4.V24.w16',
  `row=${w18Row}`
);

// Negative Regressions in isolated scratch DB
const scratchDb = path.join(repoRoot, 'scratch/ezra4_24_neg_scratch.db');

const regressions = [
  {
    name: 'Negative: Displaced #17 "مَلِكِ" to w17 (exceeding 16 tokens) is rejected',
    pos: 17,
    sql: "UPDATE word_mappings SET orig_word_position = 17, verified_locator = 'OSHB:B15.C4.V24.w17' WHERE id = 'cf20cd75-f155-45e0-a1d6-4637a75b2e11';"
  },
  {
    name: 'Negative: Displaced #18 "فَارِسَ" to w18 / wrong H6543 is rejected',
    pos: 18,
    sql: "UPDATE word_mappings SET strongs_id = 'H6543', orig_word_position = 18, verified_locator = 'OSHB:B15.C4.V24.w18' WHERE id = '34807510-6342-4c61-ba5e-42bdcc40ce5a';"
  },
  {
    name: 'Negative: Reverting #3 "عَمَلُ" to wrong verb H5648 is rejected',
    pos: 3,
    sql: "UPDATE word_mappings SET strongs_id = 'H5648', orig_word = 'עֲבַד' WHERE id = '87ff9be5-306a-4640-9ea5-ccee6d2ffad7'; UPDATE word_mapping_strongs SET strongs_id = 'H5648' WHERE mapping_id = '87ff9be5-306a-4640-9ea5-ccee6d2ffad7';"
  },
  {
    name: 'Negative: Reverting #12 "السَّنَةِ" to Hebrew H8139 is rejected',
    pos: 12,
    sql: "UPDATE word_mappings SET strongs_id = 'H8139' WHERE id = '6353d57a-bbfd-4867-ba7f-50c339e42cce'; UPDATE word_mapping_strongs SET strongs_id = 'H8139' WHERE mapping_id = '6353d57a-bbfd-4867-ba7f-50c339e42cce';"
  },
  {
    name: 'Negative: Reverting #13 "الثَّانِيَةِ" to fake H8524 (תָּלַל) is rejected',
    pos: 13,
    sql: "UPDATE word_mappings SET strongs_id = 'H8524', orig_word = 'תָּלַל' WHERE id = '15cdd9cb-79bd-48ca-b074-35cdd3c529d6'; UPDATE word_mapping_strongs SET strongs_id = 'H8524' WHERE mapping_id = '15cdd9cb-79bd-48ca-b074-35cdd3c529d6';"
  },
  {
    name: 'Negative: Converting required lexical #13 "الثَّانِيَةِ" to syntactic_ar is rejected',
    pos: 13,
    sql: "UPDATE word_mappings SET strongs_id = NULL, orig_word_position = 0, orig_word = '—', orig_surface = '—', orig_morphology = NULL, morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', verified_locator = 'AR_SYNTACTIC:B15.C4.V24.w13', relation_type = 'syntactic_construction' WHERE id = '15cdd9cb-79bd-48ca-b074-35cdd3c529d6'; DELETE FROM word_mapping_strongs WHERE mapping_id = '15cdd9cb-79bd-48ca-b074-35cdd3c529d6';"
  },
  {
    name: 'Negative: Dropping secondary H9003 from #8 "أُورُشَلِيمَ" is rejected',
    pos: 8,
    sql: "DELETE FROM word_mapping_strongs WHERE mapping_id = '61ae44e3-95c0-4acc-9739-099e8a539ca1' AND strongs_id = 'H9003';"
  },
  {
    name: 'Negative: Dropping secondary H9005 from #15 "مُلْكِ" is rejected',
    pos: 15,
    sql: "DELETE FROM word_mapping_strongs WHERE mapping_id = '9eb33f1c-3123-4d13-a109-f93b758521f8' AND strongs_id = 'H9005';"
  },
  {
    name: 'Negative: Blanking mandatory component fields on #7 "فِي" is rejected',
    pos: 7,
    sql: "UPDATE word_mapping_strongs SET orig_component = NULL WHERE mapping_id = '96ef5ff9-810b-40e8-b1e1-612db23542a7' AND strongs_id = 'H9003';"
  },
  {
    name: 'Negative: Blanking mandatory component fields on #14 "مِنْ" is rejected',
    pos: 14,
    sql: "UPDATE word_mapping_strongs SET orig_morphology = NULL WHERE mapping_id = '1e50946d-42a0-49be-b9c1-f052c31448c1' AND strongs_id = 'H9005';"
  },
  {
    name: 'Negative: Token collision by mapping #18 to w15 without compound_phrase is rejected',
    pos: 18,
    sql: "UPDATE word_mappings SET orig_word_position = 15, verified_locator = 'OSHB:B15.C4.V24.w15' WHERE id = '34807510-6342-4c61-ba5e-42bdcc40ce5a';"
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    try {
      fs.copyFileSync(dbPath, scratchDb);
      execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
      const rep = runHoldoutAudit(scratchDb);
      const al = (rep.alerts || []).find(a => a.verse === 'Ezra 4:24' && a.pos === reg.pos);
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
