/**
 * scripts/test_round2_batch2n_ezra5_11_gates.cjs
 *
 * Comprehensive Positive & Negative Regression Gates for Ezra 5:11 (Batch 2N):
 *
 * Positive Gates:
 *   1. All 25/25 words in Ezra 5:11 pass with 0 alerts in strict 4-axis audit.
 *   2. Full OSHB token coverage: w1..w25 covered (100% token coverage, no out-of-bounds locators).
 *   3. #1 "وَبِمِثْلِ" is w1 וּכְנֵ֥מָא (H3660, AC/D, compound_phrase; secondary H9002 וּ).
 *   4. #2 "هذَا" is w1 וּכְנֵ֥מָא (H3660, AC/D, compound_phrase; secondary H9002 וּ).
 *   5. #3 "الْجَوَابِ" is w2 פִתְגָמָ֖א (H6600, ANcmsd/Td, determined).
 *   6. #4 "جَاوَبُوا" is w3 הֲתִיב֣וּנָא (H8421, AVhp3mp/Sp1cp, haphel qatal 3mp).
 *   7. #5 "قَائِلِينَ:" is w4 לְמֵמַ֑ר (H560, AR/Vqc, peal infinitive_construct; secondary H9005 לְ).
 *   8. #6 "نَحْنُ" is w5 אֲנַ֣חְנָא (H586, APp1cp, 1cp) with secondary w6 הִמֹּ֡ו (H1994, ATa).
 *   9. #7 "عَبِيدُ" is w7 עַבְدوֹהִי֩ (H5649, ANcmpc/Sp3ms, construct).
 *  10. #8 "إِلهِ" is w9 אֱלָ֨הּ (H426, ANcmsc, construct) with secondary w8 דִֽי (H1768, ATr).
 *  11. #9 "السَّمَاءِ" is w10 שְׁמַיָּ֜א (H8065, ANcmpd/Td, determined).
 *  12. #10 "وَالأَرْضِ،" is w11 וְאַרְעָ֗א (H772, AC/Ncfsd/Td, determined; secondary H9002 וְ).
 *  13. #11 "وَنَبْنِي" is w12 וּבָנַ֤יִן (H1124, AC/Vqrmpa, peal participle, absolute; secondary H9002 וּ).
 *  14. #12 "هذَا" is AR_SYNTACTIC:B15.C5.V11.w12, morph_pos = syntactic_ar, strongs_id is NULL.
 *  15. #13 "الْبَيْتَ" is w13 בַּיְתָא֙ (H1005, ANcmsd/Td, determined).
 *  16. #14 "الَّذِي" is w14 דִּֽי (H1768, ATr).
 *  17. #15 "بُنِيَ" is w16 בְנֵ֜ה (H1124, AVqsmsa, peil passive_participle, passive, absolute) with secondary auxiliary w15 הֲוָ֨א (H1934, peal qatal 3ms).
 *  18. #16 "قَبْلَ" is w17 מִקַּדְמַ֤ת (H6928, AR/Ncfsc, construct; secondary H4481 מִ).
 *  19. #17 "هذِهِ" is w18 דְּנָה֙ (H1836, APdxms, demonstrative).
 *  20. #18 "السِّنِينَ" is w19 שְׁנִ֣ין (H8140, ANcfpa, absolute).
 *  21. #19 "الْكَثِيرَةِ،" is w20 שַׂגִּיאָ֔ן (H7690, AAafpa, absolute).
 *  22. #20 "وَقَدْ" is AR_SYNTACTIC:B15.C5.V11.w20, morph_pos = syntactic_ar, strongs_id is NULL.
 *  23. #21 "بَنَاهُ" is w24 בְּנָ֖הִי (H1124, AVqp3ms/Sp3ms, peal qatal 3ms + Sp3ms).
 *  24. #22 "مَلِكٌ" is w21 וּמֶ֤לֶךְ (H4430, AC/Ncmsa, absolute; secondary H9002 וּ).
 *  25. #23 "عَظِيمٌ" is w23 רַ֔ב (H7229, AAamsa, absolute).
 *  26. #24 "لإِسْرَائِيلَ" is w22 לְיִשְׂרָאֵל֙ (H3479, AR/Np, proper_noun; secondary H9005 לְ).
 *  27. #25 "وَأَكْمَلَهُ." is w25 וְשַׁכְלְלֵֽהּ (H3635, AC/Vep3ms/Sp3ms, shaphel qatal 3ms + Sp3ms; secondary H9002 וְ).
 *
 * Negative Regression Gates (in isolated scratch DB):
 *  28. Displaced #1 "وَبِمِثْلِ" to w2 is rejected.
 *  29. Mutating #1 to fake H1836 is rejected.
 *  30. Dropping secondary H9002 from #1 is rejected.
 *  31. Dropping secondary H9002 from #2 is rejected.
 *  32. Removing compound_phrase relation_type from #1-#2 (collision) is rejected.
 *  33. Removing grammar_notes from #1 or #2 is rejected.
 *  34. Displaced #3 "الْجَوَابِ" to w3 is rejected.
 *  35. Mutating #3 from determined to construct is rejected.
 *  36. Blanking morph_case on #3 is rejected.
 *  37. Displaced #4 "جَاوَبُوا" to w4 is rejected.
 *  38. Mutating #4 stem from haphel to peal is rejected.
 *  39. Displaced #5 "قَائِلِينَ:" to w5 is rejected.
 *  40. Dropping secondary H9005 from #5 is rejected.
 *  41. Displaced #6 "نَحْنُ" to w6 is rejected.
 *  42. Dropping secondary H1994 from #6 is rejected.
 *  43. Displaced #7 "عَبِيدُ" to w8 is rejected.
 *  44. Mutating #7 from construct to absolute is rejected.
 *  45. Blanking morph_case on #7 is rejected.
 *  46. Displaced #8 "إِلهِ" to w8 is rejected.
 *  47. Dropping secondary H1768 from #8 is rejected.
 *  48. Mutating #8 from construct to absolute is rejected.
 *  49. Blanking morph_case on #8 is rejected.
 *  50. Displaced #9 "السَّمَاءِ" to w9 is rejected.
 *  51. Mutating #9 from determined to construct is rejected.
 *  52. Blanking morph_case on #9 is rejected.
 *  53. Displaced #10 "وَالأَرْضِ،" to w10 is rejected.
 *  54. Dropping secondary H9002 from #10 is rejected.
 *  55. Mutating #10 from determined to construct is rejected.
 *  56. Blanking morph_case on #10 is rejected.
 *  57. Displaced #11 "وَنَبْنِي" to w11 is rejected.
 *  58. Dropping secondary H9002 from #11 is rejected.
 *  59. Mutating #11 from absolute to construct is rejected.
 *  60. Blanking morph_case on #11 is rejected.
 *  61. Mutating #12 "هذَا" to fake Strong's H1836 is rejected.
 *  62. Mutating #12 morph_pos to 'demonstrative' is rejected.
 *  63. Mutating #12 verified_source away from 'syntactic_ar' is rejected.
 *  64. Displaced #13 "الْبَيْتَ" to w12 is rejected.
 *  65. Mutating #13 from determined to construct is rejected.
 *  66. Blanking morph_case on #13 is rejected.
 *  67. Displaced #14 "الَّذِي" to w13 is rejected.
 *  68. Displaced #15 "بُنِيَ" to w15 is rejected.
 *  69. Dropping secondary H1934 from #15 is rejected.
 *  70. Mutating #15 from absolute to construct is rejected.
 *  71. Blanking morph_case on #15 is rejected.
 *  72. Displaced #16 "قَبْلَ" to w16 is rejected.
 *  73. Dropping secondary H4481 from #16 is rejected.
 *  74. Mutating #16 from construct to absolute is rejected.
 *  75. Blanking morph_case on #16 is rejected.
 *  76. Displaced #17 "هذِهِ" to w17 is rejected.
 *  77. Displaced #18 "السِّنِينَ" to w18 is rejected.
 *  78. Mutating #18 from absolute to construct is rejected.
 *  79. Blanking morph_case on #18 is rejected.
 *  80. Displaced #19 "الْكَثِيرَةِ،" to w19 is rejected.
 *  81. Mutating #19 from absolute to construct is rejected.
 *  82. Blanking morph_case on #19 is rejected.
 *  83. Mutating #20 "وَقَدْ" to verb is rejected.
 *  84. Mutating #20 verified_source away from 'syntactic_ar' is rejected.
 *  85. Displaced #21 "بَنَاهُ" to w21 is rejected.
 *  86. Displaced #22 "مَلِكٌ" to w22 is rejected.
 *  87. Dropping secondary H9002 from #22 is rejected.
 *  88. Mutating #22 from absolute to construct is rejected.
 *  89. Blanking morph_case on #22 is rejected.
 *  90. Displaced #23 "عَظِيمٌ" to w24 is rejected.
 *  91. Mutating #23 from absolute to construct is rejected.
 *  92. Blanking morph_case on #23 is rejected.
 *  93. Displaced #24 "لإِسْرَائِيلَ" to w24 is rejected.
 *  94. Dropping secondary H9005 from #24 is rejected.
 *  95. Displaced #25 "وَأَكْمَلَهُ." to out-of-bounds w26 is rejected.
 *  96. Dropping secondary H9002 from #25 is rejected.
 *  97. Mutating #25 "وَأَكْمَلَهُ." orig_word to Greek 'τελέω' is rejected.
 *  98. Mutating #25 "وَأَكْمَلَهُ." orig_word to mismatched Hebrew root 'קָדַשׁ' is rejected.
 *  99. Mutating #3 "الْجَوَابِ" orig_word to Greek 'ἀπόκρισις' is rejected.
 * 100. Mutating #9 "السَّمَاءِ" orig_word to Greek 'οὐρανός' is rejected.
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
const scratchDb = path.join(repoRoot, 'scratch/ezra5_11_neg_scratch.db');
const scratchAuditOut = path.join(repoRoot, 'scratch/ezra5_11_neg_audit.json');
if (!fs.existsSync(path.join(repoRoot, 'scratch'))) {
  fs.mkdirSync(path.join(repoRoot, 'scratch'), { recursive: true });
}

const VERSE_ID = '11111111-0000-0000-0015-000000005011';

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

function runAuditOnScratch(targetDb) {
  try {
    execFileSync(
      process.execPath,
      [auditScript, '--manifest', r2ManifestPath, '--out', scratchAuditOut],
      {
        env: { ...process.env, AUDIT_DB_PATH: targetDb },
        encoding: 'utf8'
      }
    );
    const rep = JSON.parse(fs.readFileSync(scratchAuditOut, 'utf8'));
    const ezraSummary = rep.perVerse.find(v => v.verse === 'Ezra 5:11');
    const ezraAlerts = rep.alerts.filter(a => a.verse === 'Ezra 5:11');
    return { clean: ezraSummary ? ezraSummary.clean : 0, alerts: ezraAlerts.length, ezraAlerts };
  } catch (err) {
    return { error: err.message };
  }
}

console.log('=== RUNNING BATCH 2N (EZRA 5:11) REGRESSION GATES ===\n');

// ---------------------------------------------------------
// SECTION 1: POSITIVE GATES (ON MAIN PRODUCTION DB)
// ---------------------------------------------------------
console.log('--- SECTION 1: POSITIVE GATES ---');

const baseAudit = runAuditOnScratch(dbPath);
check('Gate 1: Ezra 5:11 is 25/25 clean (100%) with 0 alerts', baseAudit.clean === 25 && baseAudit.alerts === 0, `alerts=${baseAudit.alerts}`);

// Query all 25 rows
const rowsRaw = q(`
  SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface,
         wm.orig_morphology, wm.morph_pos, wm.morph_gender, wm.morph_number, wm.morph_case,
         wm.morph_stem, wm.morph_tense, wm.morph_mood, wm.morph_voice, wm.orig_word_position,
         wm.verified_locator, wm.relation_type,
         (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '@w' || wms.orig_word_position, ';')
          FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id ORDER BY wms.link_order ASC) AS comps
  FROM word_mappings wm
  WHERE wm.verse_id = '${VERSE_ID}'
  ORDER BY wm.ar_word_position ASC;
`);

const rows = rowsRaw.split('\n').filter(Boolean).map(line => {
  const [
    pos, arWord, strongsId, origWord, origSurface, origMorph, morphPos,
    gender, number, morphCase, stem, tense, mood, voice, origPos, locator, relType, comps
  ] = line.split('|');
  return {
    pos: parseInt(pos, 10), arWord, strongsId, origWord, origSurface, origMorph, morphPos,
    gender, number, morphCase, stem, tense, mood, voice,
    origPos: origPos ? parseInt(origPos, 10) : null,
    locator, relType, comps: comps || ''
  };
});

check('Gate 2: Total 25 records present', rows.length === 25, `got ${rows.length}`);

// #1 «وَبِمِثْلِ»
const r1 = rows[0];
check('Gate 3: #1 وَبِمِثْلِ -> w1 H3660 compound_phrase',
  r1.strongsId === 'H3660' && r1.locator === 'OSHB:B15.C5.V11.w1' && r1.relType === 'compound_phrase' &&
  r1.comps.includes('H3660:primary@w1') && r1.comps.includes('H9002:secondary@w1')
);

// #2 «هذَا»
const r2 = rows[1];
check('Gate 4: #2 هذَا -> w1 H3660 compound_phrase',
  r2.strongsId === 'H3660' && r2.locator === 'OSHB:B15.C5.V11.w1' && r2.relType === 'compound_phrase' &&
  r2.comps.includes('H3660:primary@w1') && r2.comps.includes('H9002:secondary@w1')
);

// #3 «الْجَوَابِ»
const r3 = rows[2];
check('Gate 5: #3 الْجَوَابِ -> w2 H6600 determined & lexical parity',
  r3.strongsId === 'H6600' && r3.locator === 'OSHB:B15.C5.V11.w2' && r3.morphCase === 'determined' && r3.morphPos === 'noun' &&
  (r3.origWord === 'פִּתְגָּם' || r3.origWord === 'פִּתְגָם')
);

// #4 «جَاوَبُوا»
const r4 = rows[3];
check('Gate 6: #4 جَاوَبُوا -> w3 H8421 haphel qatal 3mp',
  r4.strongsId === 'H8421' && r4.locator === 'OSHB:B15.C5.V11.w3' && r4.stem === 'haphel' && r4.tense === 'qatal' && r4.number === 'plural'
);

// #5 «قَائِلِينَ:»
const r5 = rows[4];
check('Gate 7: #5 قَائِلِينَ -> w4 H560 peal infinitive_construct + secondary H9005',
  r5.strongsId === 'H560' && r5.locator === 'OSHB:B15.C5.V11.w4' && r5.stem === 'peal' && r5.mood === 'infinitive_construct' &&
  r5.comps.includes('H9005:secondary@w4')
);

// #6 «نَحْنُ»
const r6 = rows[5];
check('Gate 8: #6 نَحْنُ -> w5 H586 1cp + secondary w6 H1994',
  r6.strongsId === 'H586' && r6.locator === 'OSHB:B15.C5.V11.w5' && r6.number === 'plural' &&
  r6.comps.includes('H1994:secondary@w6')
);

// #7 «عَبِيدُ»
const r7 = rows[6];
check('Gate 9: #7 عَبِيدُ -> w7 H5649 construct',
  r7.strongsId === 'H5649' && r7.locator === 'OSHB:B15.C5.V11.w7' && r7.morphCase === 'construct' && r7.number === 'plural'
);

// #8 «إِلهِ»
const r8 = rows[7];
check('Gate 10: #8 إِلهِ -> w9 H426 construct + secondary w8 H1768',
  r8.strongsId === 'H426' && r8.locator === 'OSHB:B15.C5.V11.w9' && r8.morphCase === 'construct' &&
  r8.comps.includes('H1768:secondary@w8')
);

// #9 «السَّمَاءِ»
const r9 = rows[8];
check('Gate 11: #9 السَّمَاءِ -> w10 H8065 determined & lexical parity',
  r9.strongsId === 'H8065' && r9.locator === 'OSHB:B15.C5.V11.w10' && r9.morphCase === 'determined' && r9.number === 'plural' &&
  (r9.origWord === 'שָׁמַיִן' || r9.origWord === 'שְׁמַיִן')
);

// #10 «وَالأَرْضِ،»
const r10 = rows[9];
check('Gate 12: #10 وَالأَرْضِ -> w11 H772 determined + secondary H9002',
  r10.strongsId === 'H772' && r10.locator === 'OSHB:B15.C5.V11.w11' && r10.morphCase === 'determined' &&
  r10.comps.includes('H9002:secondary@w11')
);

// #11 «وَنَبْنِي»
const r11 = rows[10];
check('Gate 13: #11 وَنَبْنِي -> w12 H1124 peal participle absolute + secondary H9002',
  r11.strongsId === 'H1124' && r11.locator === 'OSHB:B15.C5.V11.w12' && r11.stem === 'peal' && r11.mood === 'participle' &&
  r11.morphCase === 'absolute' && r11.comps.includes('H9002:secondary@w12')
);

// #12 «هذَا»
const r12 = rows[11];
check('Gate 14: #12 هذَا -> AR_SYNTACTIC:B15.C5.V11.w12 syntactic_ar',
  r12.strongsId === '' && r12.locator === 'AR_SYNTACTIC:B15.C5.V11.w12' && r12.morphPos === 'syntactic_ar' && r12.comps === ''
);

// #13 «الْبَيْتَ»
const r13 = rows[12];
check('Gate 15: #13 الْبَيْتَ -> w13 H1005 determined',
  r13.strongsId === 'H1005' && r13.locator === 'OSHB:B15.C5.V11.w13' && r13.morphCase === 'determined'
);

// #14 «الَّذِي»
const r14 = rows[13];
check('Gate 16: #14 الَّذِي -> w14 H1768 ATr',
  r14.strongsId === 'H1768' && r14.locator === 'OSHB:B15.C5.V11.w14'
);

// #15 «بُنِيَ»
const r15 = rows[14];
check('Gate 17: #15 بُنِيَ -> w16 H1124 peil passive_participle absolute + secondary w15 H1934',
  r15.strongsId === 'H1124' && r15.locator === 'OSHB:B15.C5.V11.w16' && r15.voice === 'passive' && r15.mood === 'passive_participle' &&
  r15.morphCase === 'absolute' && r15.comps.includes('H1934:secondary@w15')
);

// #16 «قَبْلَ»
const r16 = rows[15];
check('Gate 18: #16 قَبْلَ -> w17 H6928 construct + secondary H4481',
  r16.strongsId === 'H6928' && r16.locator === 'OSHB:B15.C5.V11.w17' && r16.morphCase === 'construct' &&
  r16.comps.includes('H4481:secondary@w17')
);

// #17 «هذِهِ»
const r17 = rows[16];
check('Gate 19: #17 هذِهِ -> w18 H1836 demonstrative',
  r17.strongsId === 'H1836' && r17.locator === 'OSHB:B15.C5.V11.w18' && r17.morphPos === 'demonstrative'
);

// #18 «السِّنِينَ»
const r18 = rows[17];
check('Gate 20: #18 السِّنِينَ -> w19 H8140 absolute feminine plural',
  r18.strongsId === 'H8140' && r18.locator === 'OSHB:B15.C5.V11.w19' && r18.morphCase === 'absolute' && r18.gender === 'feminine' && r18.number === 'plural'
);

// #19 «الْكَثِيرَةِ،»
const r19 = rows[18];
check('Gate 21: #19 الْكَثِيرَةِ -> w20 H7690 absolute feminine plural',
  r19.strongsId === 'H7690' && r19.locator === 'OSHB:B15.C5.V11.w20' && r19.morphCase === 'absolute' && r19.gender === 'feminine' && r19.number === 'plural'
);

// #20 «وَقَدْ»
const r20 = rows[19];
check('Gate 22: #20 وَقَدْ -> AR_SYNTACTIC:B15.C5.V11.w20 syntactic_ar',
  r20.strongsId === '' && r20.locator === 'AR_SYNTACTIC:B15.C5.V11.w20' && r20.morphPos === 'syntactic_ar' && r20.comps === ''
);

// #21 «بَنَاهُ»
const r21 = rows[20];
check('Gate 23: #21 بَنَاهُ -> w24 H1124 peal qatal 3ms',
  r21.strongsId === 'H1124' && r21.locator === 'OSHB:B15.C5.V11.w24' && r21.stem === 'peal' && r21.tense === 'qatal' && r21.number === 'singular'
);

// #22 «مَلِكٌ»
const r22 = rows[21];
check('Gate 24: #22 مَلِكٌ -> w21 H4430 absolute + secondary H9002',
  r22.strongsId === 'H4430' && r22.locator === 'OSHB:B15.C5.V11.w21' && r22.morphCase === 'absolute' &&
  r22.comps.includes('H9002:secondary@w21')
);

// #23 «عَظِيمٌ»
const r23 = rows[22];
check('Gate 25: #23 عَظِيمٌ -> w23 H7229 absolute masculine singular',
  r23.strongsId === 'H7229' && r23.locator === 'OSHB:B15.C5.V11.w23' && r23.morphCase === 'absolute' && r23.gender === 'masculine' && r23.number === 'singular'
);

// #24 «لإِسْرَائِيلَ»
const r24 = rows[23];
check('Gate 26: #24 لإِسْرَائِيلَ -> w22 H3479 proper_noun + secondary H9005',
  r24.strongsId === 'H3479' && r24.locator === 'OSHB:B15.C5.V11.w22' && r24.morphPos === 'proper_noun' &&
  r24.comps.includes('H9005:secondary@w22')
);

// #25 «وَأَكْمَلَهُ.»
const r25 = rows[24];
check('Gate 27: #25 وَأَكْمَلَهُ -> w25 H3635 shaphel qatal 3ms + secondary H9002 & lexical parity',
  r25.strongsId === 'H3635' && r25.locator === 'OSHB:B15.C5.V11.w25' && r25.stem === 'shaphel' && r25.tense === 'qatal' &&
  r25.comps.includes('H9002:secondary@w25') &&
  (r25.origWord === 'כְּלַל' || r25.origWord === 'שַׁכְלֵל')
);

// ---------------------------------------------------------
// SECTION 2: NEGATIVE REGRESSION GATES (IN ISOLATED SCRATCH DB)
// ---------------------------------------------------------
console.log('\n--- SECTION 2: NEGATIVE REGRESSION GATES ---');

fs.copyFileSync(dbPath, scratchDb);
q(`
  DROP TABLE IF EXISTS backup_wm;
  DROP TABLE IF EXISTS backup_wms;
  CREATE TABLE backup_wm AS SELECT * FROM word_mappings WHERE verse_id = '${VERSE_ID}';
  CREATE TABLE backup_wms AS SELECT * FROM word_mapping_strongs WHERE mapping_id IN (SELECT id FROM backup_wm);
`, scratchDb);

function resetScratch() {
  q(`
    DELETE FROM word_mapping_strongs WHERE mapping_id IN (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}');
    DELETE FROM word_mappings WHERE verse_id = '${VERSE_ID}';
    INSERT INTO word_mappings SELECT * FROM backup_wm;
    INSERT INTO word_mapping_strongs SELECT * FROM backup_wms;
  `, scratchDb);
}

function testMutation(desc, mutateSql) {
  resetScratch();
  q(mutateSql, scratchDb);
  const res = runAuditOnScratch(scratchDb);
  const passed = res.alerts > 0;
  check(desc, passed, `alerts=${res.alerts}`);
}

// 28. Displaced #1 to w2
testMutation('Gate 28: Displaced #1 وَبِمِثْلِ to w2 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w2', orig_word_position = 2 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;`
);

// 29. Mutating #1 to fake H1836
testMutation('Gate 29: Mutating #1 to fake H1836 is rejected',
  `UPDATE word_mappings SET strongs_id = 'H1836' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;`
);

// 30. Dropping secondary H9002 from #1
testMutation('Gate 30: Dropping secondary H9002 from #1 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1) AND strongs_id = 'H9002';`
);

// 31. Dropping secondary H9002 from #2
testMutation('Gate 31: Dropping secondary H9002 from #2 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 2) AND strongs_id = 'H9002';`
);

// 32. Removing compound_phrase from #1-#2 (token collision)
testMutation('Gate 32: Removing compound_phrase relation_type from #1-#2 is rejected',
  `UPDATE word_mappings SET relation_type = 'primary' WHERE verse_id = '${VERSE_ID}' AND ar_word_position IN (1, 2);`
);

// 33. Removing grammar_notes from #1 or #2
testMutation('Gate 33: Removing grammar_notes from #1 is rejected',
  `UPDATE word_mappings SET grammar_notes = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 1;`
);

// 34. Displaced #3 to w3
testMutation('Gate 34: Displaced #3 الْجَوَابِ to w3 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w3', orig_word_position = 3 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`
);

// 35. Mutating #3 from determined to construct
testMutation('Gate 35: Mutating #3 from determined to construct is rejected',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`
);

// 36. Blanking morph_case on #3
testMutation('Gate 36: Blanking morph_case on #3 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`
);

// 37. Displaced #4 to w4
testMutation('Gate 37: Displaced #4 جَاوَبُوا to w4 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w4', orig_word_position = 4 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 4;`
);

// 38. Mutating #4 stem from haphel to peal
testMutation('Gate 38: Mutating #4 stem from haphel to peal is rejected',
  `UPDATE word_mappings SET morph_stem = 'peal' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 4;`
);

// 39. Displaced #5 to w5
testMutation('Gate 39: Displaced #5 قَائِلِينَ to w5 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w5', orig_word_position = 5 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5;`
);

// 40. Dropping secondary H9005 from #5
testMutation('Gate 40: Dropping secondary H9005 from #5 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 5) AND strongs_id = 'H9005';`
);

// 41. Displaced #6 to w6
testMutation('Gate 41: Displaced #6 نَحْنُ to w6 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w6', orig_word_position = 6 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6;`
);

// 42. Dropping secondary H1994 from #6
testMutation('Gate 42: Dropping secondary H1994 from #6 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 6) AND strongs_id = 'H1994';`
);

// 43. Displaced #7 to w8
testMutation('Gate 43: Displaced #7 عَبِيدُ to w8 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w8', orig_word_position = 8 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7;`
);

// 44. Mutating #7 from construct to absolute
testMutation('Gate 44: Mutating #7 from construct to absolute is rejected',
  `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7;`
);

// 45. Blanking morph_case on #7
testMutation('Gate 45: Blanking morph_case on #7 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 7;`
);

// 46. Displaced #8 to w8
testMutation('Gate 46: Displaced #8 إِلهِ to w8 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w8', orig_word_position = 8 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8;`
);

// 47. Dropping secondary H1768 from #8
testMutation('Gate 47: Dropping secondary H1768 from #8 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8) AND strongs_id = 'H1768';`
);

// 48. Mutating #8 from construct to absolute
testMutation('Gate 48: Mutating #8 from construct to absolute is rejected',
  `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8;`
);

// 49. Blanking morph_case on #8
testMutation('Gate 49: Blanking morph_case on #8 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 8;`
);

// 50. Displaced #9 to w9
testMutation('Gate 50: Displaced #9 السَّمَاءِ to w9 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w9', orig_word_position = 9 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`
);

// 51. Mutating #9 from determined to construct
testMutation('Gate 51: Mutating #9 from determined to construct is rejected',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`
);

// 52. Blanking morph_case on #9
testMutation('Gate 52: Blanking morph_case on #9 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`
);

// 53. Displaced #10 to w10
testMutation('Gate 53: Displaced #10 وَالأَرْضِ to w10 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w10', orig_word_position = 10 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`
);

// 54. Dropping secondary H9002 from #10
testMutation('Gate 54: Dropping secondary H9002 from #10 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10) AND strongs_id = 'H9002';`
);

// 55. Mutating #10 from determined to construct
testMutation('Gate 55: Mutating #10 from determined to construct is rejected',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`
);

// 56. Blanking morph_case on #10
testMutation('Gate 56: Blanking morph_case on #10 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 10;`
);

// 57. Displaced #11 to w11
testMutation('Gate 57: Displaced #11 وَنَبْنِي to w11 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w11', orig_word_position = 11 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`
);

// 58. Dropping secondary H9002 from #11
testMutation('Gate 58: Dropping secondary H9002 from #11 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11) AND strongs_id = 'H9002';`
);

// 59. Mutating #11 from absolute to construct
testMutation('Gate 59: Mutating #11 from absolute to construct is rejected',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`
);

// 60. Blanking morph_case on #11
testMutation('Gate 60: Blanking morph_case on #11 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 11;`
);

// 61. Mutating #12 to fake H1836
testMutation('Gate 61: Mutating #12 هذَا to fake Strongs H1836 is rejected',
  `UPDATE word_mappings SET strongs_id = 'H1836' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 12;`
);

// 62. Mutating #12 morph_pos to 'demonstrative'
testMutation('Gate 62: Mutating #12 morph_pos to demonstrative is rejected',
  `UPDATE word_mappings SET morph_pos = 'demonstrative' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 12;`
);

// 63. Mutating #12 verified_source away from 'syntactic_ar'
testMutation('Gate 63: Mutating #12 verified_source away from syntactic_ar is rejected',
  `UPDATE word_mappings SET verified_source = 'oshb_wlc' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 12;`
);

// 64. Displaced #13 to w12
testMutation('Gate 64: Displaced #13 الْبَيْتَ to w12 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w12', orig_word_position = 12 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13;`
);

// 65. Mutating #13 from determined to construct
testMutation('Gate 65: Mutating #13 from determined to construct is rejected',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13;`
);

// 66. Blanking morph_case on #13
testMutation('Gate 66: Blanking morph_case on #13 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 13;`
);

// 67. Displaced #14 to w13
testMutation('Gate 67: Displaced #14 الَّذِي to w13 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w13', orig_word_position = 13 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 14;`
);

// 68. Displaced #15 to w15
testMutation('Gate 68: Displaced #15 بُنِيَ to w15 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w15', orig_word_position = 15 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;`
);

// 69. Dropping secondary H1934 from #15
testMutation('Gate 69: Dropping secondary H1934 from #15 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15) AND strongs_id = 'H1934';`
);

// 70. Mutating #15 from absolute to construct
testMutation('Gate 70: Mutating #15 from absolute to construct is rejected',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;`
);

// 71. Blanking morph_case on #15
testMutation('Gate 71: Blanking morph_case on #15 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 15;`
);

// 72. Displaced #16 to w16
testMutation('Gate 72: Displaced #16 قَبْلَ to w16 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w16', orig_word_position = 16 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`
);

// 73. Dropping secondary H4481 from #16
testMutation('Gate 73: Dropping secondary H4481 from #16 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16) AND strongs_id = 'H4481';`
);

// 74. Mutating #16 from construct to absolute
testMutation('Gate 74: Mutating #16 from construct to absolute is rejected',
  `UPDATE word_mappings SET morph_case = 'absolute' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`
);

// 75. Blanking morph_case on #16
testMutation('Gate 75: Blanking morph_case on #16 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 16;`
);

// 76. Displaced #17 to w17
testMutation('Gate 76: Displaced #17 هذِهِ to w17 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w17', orig_word_position = 17 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 17;`
);

// 77. Displaced #18 to w18
testMutation('Gate 77: Displaced #18 السِّنِينَ to w18 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w18', orig_word_position = 18 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 18;`
);

// 78. Mutating #18 from absolute to construct
testMutation('Gate 78: Mutating #18 from absolute to construct is rejected',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 18;`
);

// 79. Blanking morph_case on #18
testMutation('Gate 79: Blanking morph_case on #18 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 18;`
);

// 80. Displaced #19 to w19
testMutation('Gate 80: Displaced #19 الْكَثِيرَةِ to w19 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w19', orig_word_position = 19 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`
);

// 81. Mutating #19 from absolute to construct
testMutation('Gate 81: Mutating #19 from absolute to construct is rejected',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`
);

// 82. Blanking morph_case on #19
testMutation('Gate 82: Blanking morph_case on #19 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 19;`
);

// 83. Mutating #20 to verb
testMutation('Gate 83: Mutating #20 وَقَدْ to verb is rejected',
  `UPDATE word_mappings SET morph_pos = 'verb' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 20;`
);

// 84. Mutating #20 verified_source away from 'syntactic_ar'
testMutation('Gate 84: Mutating #20 verified_source away from syntactic_ar is rejected',
  `UPDATE word_mappings SET verified_source = 'oshb_wlc' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 20;`
);

// 85. Displaced #21 to w21
testMutation('Gate 85: Displaced #21 بَنَاهُ to w21 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w21', orig_word_position = 21 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 21;`
);

// 86. Displaced #22 to w22
testMutation('Gate 86: Displaced #22 مَلِكٌ to w22 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w22', orig_word_position = 22 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 22;`
);

// 87. Dropping secondary H9002 from #22
testMutation('Gate 87: Dropping secondary H9002 from #22 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 22) AND strongs_id = 'H9002';`
);

// 88. Mutating #22 from absolute to construct
testMutation('Gate 88: Mutating #22 from absolute to construct is rejected',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 22;`
);

// 89. Blanking morph_case on #22
testMutation('Gate 89: Blanking morph_case on #22 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 22;`
);

// 90. Displaced #23 to w24
testMutation('Gate 90: Displaced #23 عَظِيمٌ to w24 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w24', orig_word_position = 24 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 23;`
);

// 91. Mutating #23 from absolute to construct
testMutation('Gate 91: Mutating #23 from absolute to construct is rejected',
  `UPDATE word_mappings SET morph_case = 'construct' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 23;`
);

// 92. Blanking morph_case on #23
testMutation('Gate 92: Blanking morph_case on #23 is rejected',
  `UPDATE word_mappings SET morph_case = NULL WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 23;`
);

// 93. Displaced #24 to w24
testMutation('Gate 93: Displaced #24 لإِسْرَائِيلَ to w24 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w24', orig_word_position = 24 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 24;`
);

// 94. Dropping secondary H9005 from #24
testMutation('Gate 94: Dropping secondary H9005 from #24 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 24) AND strongs_id = 'H9005';`
);

// 95. Displaced #25 to out-of-bounds w26
testMutation('Gate 95: Displaced #25 وَأَكْمَلَهُ to out-of-bounds w26 is rejected',
  `UPDATE word_mappings SET verified_locator = 'OSHB:B15.C5.V11.w26', orig_word_position = 26 WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 25;`
);

// 96. Dropping secondary H9002 from #25
testMutation('Gate 96: Dropping secondary H9002 from #25 is rejected',
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 25) AND strongs_id = 'H9002';`
);

// 97. Mutating #25 orig_word to Greek 'τελέω'
testMutation('Gate 97: Mutating #25 وَأَكْمَلَهُ orig_word to Greek τελέω is rejected',
  `UPDATE word_mappings SET orig_word = 'τελέω' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 25;`
);

// 98. Mutating #25 orig_word to unrelated Hebrew root 'קָדַשׁ'
testMutation('Gate 98: Mutating #25 وَأَكْمَلَهُ orig_word to mismatched Hebrew root קָדַשׁ is rejected',
  `UPDATE word_mappings SET orig_word = 'קָדַשׁ' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 25;`
);

// 99. Mutating #3 orig_word to Greek 'ἀπόκρισις'
testMutation('Gate 99: Mutating #3 الْجَوَابِ orig_word to Greek ἀπόκρισις is rejected',
  `UPDATE word_mappings SET orig_word = 'ἀπόκρισις' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 3;`
);

// 100. Mutating #9 orig_word to Greek 'οὐρανός'
testMutation('Gate 100: Mutating #9 السَّمَاءِ orig_word to Greek οὐρανός is rejected',
  `UPDATE word_mappings SET orig_word = 'οὐρανός' WHERE verse_id = '${VERSE_ID}' AND ar_word_position = 9;`
);

// Clean up scratch db
q(`
  DROP TABLE IF EXISTS backup_wm;
  DROP TABLE IF EXISTS backup_wms;
`, scratchDb);
if (fs.existsSync(scratchDb)) fs.unlinkSync(scratchDb);
if (fs.existsSync(scratchAuditOut)) fs.unlinkSync(scratchAuditOut);

console.log(`\n========================================================`);
console.log(`EZRA 5:11 (BATCH 2N) GATES RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`========================================================`);

if (failCount > 0) {
  process.exit(1);
}
