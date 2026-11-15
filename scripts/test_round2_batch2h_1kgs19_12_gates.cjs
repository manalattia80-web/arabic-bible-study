/**
 * scripts/test_round2_batch2h_1kgs19_12_gates.cjs
 *
 * Comprehensive Positive & Negative Regression Gates for 1 Kings 19:12 (Batch 2H):
 *
 * Positive Gates:
 * 1.  All 13/13 words in 1Kgs 19:12 pass with 0 alerts in strict 4-axis audit.
 * 2.  Full OSHB token coverage: w1..w11 covered (100% token coverage).
 * 3.  #1 "وَبَعْدَ" is w1 וְאַחַ֤ר (H310, HC/R).
 * 4.  #2 "الزَّلْزَلَةِ" is w2 הָרַ֨עַשׁ֙ (H7494, HTd/Ncmsa).
 * 5.  #3 "نَارٌ" is w3 אֵ֔שׁ (H784, HNcbsa).
 * 6.  #4 "وَلَمْ" is w4 לֹ֥א (H3808, HTn).
 * 7.  #5 "يَكُنِ" is pure syntactic_ar (AR_SYNTACTIC:B11.C19.V12.w5) with zero Strongs and zero components.
 * 8.  #6 "الرَّبُّ" is w6 יְהוָ֑ה (H3068, HNp).
 * 9.  #7 "فِي" & #8 "النَّارِ" form a documented compound alignment unit to w5 בָאֵ֖שׁ (HRd/Ncbsa).
 * 10. #7 "فِي" has primary H9003@w5.
 * 11. #8 "النَّارِ" has primary H784@w5 and secondary H9003@w5.
 * 12. #9 "وَبَعْدَ" is w7 וְאַחַ֣ר (H310, HC/R).
 * 13. #10 "النَّارِ" is w8 הָאֵ֔שׁ (H784, HTd/Ncbsa).
 * 14. #11 "صَوْتٌ" is w9 ק֖וֹل (H6963, HNcmsc).
 * 15. #12 "مُنْخَفِضٌ" is w10 דְּמָמָ֥ה (H1827, HNcfsa).
 * 16. #13 "خَفِيفٌ" is w11 דַקָּֽה (H1851, HAafsa).
 *
 * Negative Gates:
 * 17. User requirement: Moving #8 "النَّارِ" to w8 (wrong contextual occurrence) is rejected.
 * 18. Converting required lexical #3 "نَارٌ" to syntactic_ar is rejected.
 * 19. Converting required lexical #12 "مُنْخَفِضٌ" to syntactic_ar is rejected.
 * 20. Converting required lexical #13 "خَفِيفٌ" to syntactic_ar is rejected.
 * 21. Reverting #5 "يَكُنِ" to fake H1961 is rejected.
 * 22. Dropping secondary H9003 from #8 "النَّارِ" is rejected.
 * 23. Blanking mandatory component fields on #7 "فِي" is rejected.
 * 24. Blanking mandatory component fields on #12 "مُنْخَفِضٌ" is rejected.
 * 25. Token collision by mapping #13 to w10 without compound_phrase is rejected.
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

console.log('========================================================================');
console.log('  ROUND 2 BATCH 2H (1KGS 19:12 FULL VERSE) POSITIVE & NEGATIVE GATES    ');
console.log('========================================================================\n');

// 1. Positive Gate: All 13/13 words pass with 0 alerts across all 4 axes
const scratchAuditOut = path.join(repoRoot, 'scratch/test_1kgs19_gates_audit.json');
function runHoldoutAudit(targetDb) {
  execFileSync(process.execPath, [
    auditScript,
    '--manifest', manifestPath,
    '--out', scratchAuditOut
  ], {
    env: { ...process.env, AUDIT_DB_PATH: targetDb },
    stdio: 'ignore'
  });
  return JSON.parse(fs.readFileSync(scratchAuditOut, 'utf8'));
}

const prodReport = runHoldoutAudit(dbPath);
const v12Alerts = (prodReport.alerts || []).filter(a => a.verse === '1Kgs 19:12');
const v12Summary = (prodReport.perVerse || []).find(v => v.verse === '1Kgs 19:12');
check(
  'Positive: 1Kgs 19:12 all 13/13 words pass with 0 alerts',
  Boolean(v12Summary && v12Summary.clean === 13 && v12Summary.alerts === 0 && v12Alerts.length === 0),
  `clean=${v12Summary ? v12Summary.clean : 0}/13, alerts=${v12Alerts.length}`
);

// 2. Positive Gate: Full OSHB token coverage w1..w11
const positions = q(`
  SELECT DISTINCT orig_word_position
  FROM (
    SELECT orig_word_position FROM word_mappings wm
    JOIN verses vr ON wm.verse_id = vr.id
    WHERE vr.book_id = 11 AND vr.chapter_num = 19 AND vr.verse_num = 12 AND wm.orig_word_position > 0
    UNION
    SELECT wms.orig_word_position FROM word_mapping_strongs wms
    JOIN word_mappings wm ON wms.mapping_id = wm.id
    JOIN verses vr ON wm.verse_id = vr.id
    WHERE vr.book_id = 11 AND vr.chapter_num = 19 AND vr.verse_num = 12 AND wms.orig_word_position > 0
  ) ORDER BY orig_word_position;
`).split('\n').map(x => parseInt(x.trim(), 10));

const allCovered = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].every(w => positions.includes(w));
check(
  'Positive: 1Kgs 19:12 covers all 11 unique OSHB tokens (w1..w11)',
  allCovered,
  `covered=${positions.join(',')}`
);

// 3. Positive Gate: #1 "وَبَعْدَ" is w1 וְאַחַ֤ר (H310, HC/R)
const w1Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = 'c7180dbe-d6ab-4b9e-b031-c0395ff8f8e0';`);
check('Positive: 1Kgs 19:12 #1 "وَبَعْدَ" is w1 וְאַחַ֤ר (H310, HC/R)',
  w1Row === 'H310|1|אַחַר|וְאַחַ֤ר|HC/R|preposition|OSHB:B11.C19.V12.w1',
  `row=${w1Row}`
);

// 4. Positive Gate: #2 "الزَّلْزَلَةِ" is w2 הָרַ֨عַשׁ֙ (H7494, HTd/Ncmsa)
const w2Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = 'f10da0ac-14ee-48c3-9395-32750011aa9b';`);
check('Positive: 1Kgs 19:12 #2 "الزَّلْزَلَةِ" is w2 הָרַ֨عַשׁ֙ (H7494, HTd/Ncmsa)',
  w2Row === 'H7494|2|רַעַשׁ|הָרַ֨עַשׁ֙|HTd/Ncmsa|noun|OSHB:B11.C19.V12.w2',
  `row=${w2Row}`
);

// 5. Positive Gate: #3 "نَارٌ" is w3 אֵ֔שׁ (H784, HNcbsa)
const w3Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = '5402230f-b238-419a-8314-b12e6107093a';`);
check('Positive: 1Kgs 19:12 #3 "نَارٌ" is w3 אֵ֔שׁ (H784, HNcbsa)',
  w3Row === 'H784|3|אֵשׁ|אֵ֔שׁ|HNcbsa|noun|OSHB:B11.C19.V12.w3',
  `row=${w3Row}`
);

// 6. Positive Gate: #4 "وَلَمْ" is w4 לֹ֥א (H3808, HTn)
const w4Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = '4d67a88b-05d9-437f-a4c8-076eee789298';`);
check('Positive: 1Kgs 19:12 #4 "وَلَمْ" is w4 לֹ֥א (H3808, HTn)',
  w4Row === 'H3808|4|לֹא|לֹ֥א|HTn|particle|OSHB:B11.C19.V12.w4',
  `row=${w4Row}`
);

// 7. Positive Gate: #5 "يَكُنِ" is pure syntactic_ar with zero Strongs and zero components
const w5Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_source, verified_locator, (SELECT COUNT(*) FROM word_mapping_strongs WHERE mapping_id = '1f98f050-ab80-44ab-bdd7-1a224447f0ee') FROM word_mappings WHERE id = '1f98f050-ab80-44ab-bdd7-1a224447f0ee';`);
check('Positive: 1Kgs 19:12 #5 "يَكُنِ" is pure syntactic_ar with zero Strongs and zero components',
  w5Row === '|0|—|—||syntactic_ar|syntactic_ar|AR_SYNTACTIC:B11.C19.V12.w5|0',
  `row=${w5Row}`
);

// 8. Positive Gate: #6 "الرَّبُّ" is w6 יְהוָ֑ה (H3068, HNp)
const w6Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = '07bc3dbb-4210-4e4e-95e2-f60e0a499afa';`);
check('Positive: 1Kgs 19:12 #6 "الرَّبُّ" is w6 יְהוָ֑ה (H3068, HNp)',
  w6Row === 'H3068|6|יְהֹוָה|יְהוָ֑ה|HNp|proper_noun|OSHB:B11.C19.V12.w6',
  `row=${w6Row}`
);

// 9. Positive Gate: #7 & #8 form a documented compound alignment unit to w5 בָאֵ֖שׁ (HRd/Ncbsa)
const w7_8Loc = q(`SELECT ar_word_position || ':' || verified_locator || ':' || relation_type FROM word_mappings WHERE id IN ('86b86fbe-c9b7-42f4-b959-e8a8636ff95a', 'e7d90c86-5a56-4648-9c31-fb73a381a990') ORDER BY ar_word_position;`);
check('Positive: 1Kgs 19:12 #7 & #8 form documented compound alignment unit to w5 בָאֵ֖שׁ',
  w7_8Loc === '7:OSHB:B11.C19.V12.w5:compound_phrase\n8:OSHB:B11.C19.V12.w5:compound_phrase',
  `loc=${w7_8Loc}`
);

// 10. Positive Gate: #7 "فِي" has primary H9003@w5
const w7Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = '86b86fbe-c9b7-42f4-b959-e8a8636ff95a' ORDER BY link_order;`);
check('Positive: 1Kgs 19:12 #7 "فِي" has primary H9003@w5',
  w7Comps === 'H9003:primary#1@w5[בָאֵ֖שׁ:HRd]',
  `comps=${w7Comps}`
);

// 11. Positive Gate: #8 "النَّارِ" has primary H784@w5 and secondary H9003@w5
const w8Comps = q(`SELECT strongs_id || ':' || link_role || '#' || link_order || '@w' || orig_word_position || '[' || orig_component || ':' || orig_morphology || ']' FROM word_mapping_strongs WHERE mapping_id = 'e7d90c86-5a56-4648-9c31-fb73a381a990' ORDER BY link_order;`);
check('Positive: 1Kgs 19:12 #8 "النَّارِ" has primary H784@w5 and secondary H9003@w5',
  w8Comps === 'H784:primary#1@w5[בָאֵ֖שׁ:HRd/Ncbsa]\nH9003:secondary#2@w5[בָ:HRd]',
  `comps=${w8Comps}`
);

// 12. Positive Gate: #9 "وَبَعْدَ" is w7 וְאַחַ֣ר (H310, HC/R)
const w9Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = '0c635355-cee0-4e5c-93d5-0fd03c79fd48';`);
check('Positive: 1Kgs 19:12 #9 "وَبَعْدَ" is w7 וְאַחַ֣ר (H310, HC/R)',
  w9Row === 'H310|7|אַחַר|וְאַחַ֣ר|HC/R|preposition|OSHB:B11.C19.V12.w7',
  `row=${w9Row}`
);

// 13. Positive Gate: #10 "النَّارِ" is w8 הָאֵ֔שׁ (H784, HTd/Ncbsa)
const w10Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, verified_locator FROM word_mappings WHERE id = '962ae65e-b2f8-405c-8344-ed45f7eb8830';`);
check('Positive: 1Kgs 19:12 #10 "النَّارِ" is w8 הָאֵ֔שׁ (H784, HTd/Ncbsa, common gender)',
  w10Row === 'H784|8|אֵשׁ|הָאֵ֔שׁ|HTd/Ncbsa|noun|common|OSHB:B11.C19.V12.w8',
  `row=${w10Row}`
);

// 14. Positive Gate: #11 "صَوْتٌ" is w9 ק֖וֹل (H6963, HNcmsc)
const w11Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, verified_locator FROM word_mappings WHERE id = '95ded0e9-07bf-4ebe-bbbf-6c17013532c7';`);
check('Positive: 1Kgs 19:12 #11 "صَوْتٌ" is w9 ק֖וֹل (H6963, HNcmsc)',
  w11Row === 'H6963|9|קוֹל|ק֖וֹל|HNcmsc|noun|OSHB:B11.C19.V12.w9',
  `row=${w11Row}`
);

// 15. Positive Gate: #12 "مُنْخَفِضٌ" is w10 דְּמָמָ֥ה (H1827, HNcfsa)
const w12Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, verified_locator FROM word_mappings WHERE id = '9ef3cc9a-70cf-4bcf-bebd-8d7a5e8bf531';`);
check('Positive: 1Kgs 19:12 #12 "مُنْخَفِضٌ" is w10 דְּמָמָ֥ה (H1827, HNcfsa)',
  w12Row === 'H1827|10|דְּמָמָה|דְּמָמָ֥ה|HNcfsa|noun|feminine|OSHB:B11.C19.V12.w10',
  `row=${w12Row}`
);

// 16. Positive Gate: #13 "خَفِيفٌ" is w11 דַקָּֽה (H1851, HAafsa)
const w13Row = q(`SELECT strongs_id, orig_word_position, orig_word, orig_surface, orig_morphology, morph_pos, morph_gender, verified_locator FROM word_mappings WHERE id = '2e684aaf-eebc-4acc-b707-232faee94ec3';`);
check('Positive: 1Kgs 19:12 #13 "خَفِيفٌ" is w11 דַקָּֽה (H1851, HAafsa)',
  w13Row === 'H1851|11|דַּק|דַקָּֽה|HAafsa|adjective|feminine|OSHB:B11.C19.V12.w11',
  `row=${w13Row}`
);

// Negative Regressions in isolated scratch DB
const scratchDb = path.join(repoRoot, 'scratch/1kgs19_neg_scratch.db');

const regressions = [
  {
    name: 'Negative: User requirement: Moving #8 "النَّارِ" to w8 (wrong contextual occurrence) is rejected',
    pos: 8,
    sql: "UPDATE word_mappings SET orig_word_position = 8, orig_surface = 'הָאֵ֔שׁ', orig_morphology = 'HTd/Ncbsa', verified_locator = 'OSHB:B11.C19.V12.w8', relation_type = 'primary' WHERE id = 'e7d90c86-5a56-4648-9c31-fb73a381a990'; DELETE FROM word_mapping_strongs WHERE mapping_id = 'e7d90c86-5a56-4648-9c31-fb73a381a990'; INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('e7d90c86-5a56-4648-9c31-fb73a381a990', 'H784', 'primary', 1, 8, 'הָאֵ֔שׁ', 'HTd/Ncbsa', 'oshb_wlc');"
  },
  {
    name: 'Negative: Converting required lexical #3 "نَارٌ" to syntactic_ar is rejected',
    pos: 3,
    sql: "UPDATE word_mappings SET strongs_id = NULL, orig_word_position = 0, orig_word = '—', orig_surface = '—', orig_morphology = NULL, morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', verified_locator = 'AR_SYNTACTIC:B11.C19.V12.w3', relation_type = 'syntactic_construction' WHERE id = '5402230f-b238-419a-8314-b12e6107093a'; DELETE FROM word_mapping_strongs WHERE mapping_id = '5402230f-b238-419a-8314-b12e6107093a';"
  },
  {
    name: 'Negative: Converting required lexical #12 "مُنْخَفِضٌ" to syntactic_ar is rejected',
    pos: 12,
    sql: "UPDATE word_mappings SET strongs_id = NULL, orig_word_position = 0, orig_word = '—', orig_surface = '—', orig_morphology = NULL, morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', verified_locator = 'AR_SYNTACTIC:B11.C19.V12.w12', relation_type = 'syntactic_construction' WHERE id = '9ef3cc9a-70cf-4bcf-bebd-8d7a5e8bf531'; DELETE FROM word_mapping_strongs WHERE mapping_id = '9ef3cc9a-70cf-4bcf-bebd-8d7a5e8bf531';"
  },
  {
    name: 'Negative: Converting required lexical #13 "خَفِيفٌ" to syntactic_ar is rejected',
    pos: 13,
    sql: "UPDATE word_mappings SET strongs_id = NULL, orig_word_position = 0, orig_word = '—', orig_surface = '—', orig_morphology = NULL, morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', verified_locator = 'AR_SYNTACTIC:B11.C19.V12.w13', relation_type = 'syntactic_construction' WHERE id = '2e684aaf-eebc-4acc-b707-232faee94ec3'; DELETE FROM word_mapping_strongs WHERE mapping_id = '2e684aaf-eebc-4acc-b707-232faee94ec3';"
  },
  {
    name: 'Negative: Reverting #5 "يَكُنِ" to fake H1961 is rejected',
    pos: 5,
    sql: "UPDATE word_mappings SET strongs_id = 'H1961', orig_word_position = 5, orig_word = 'הָיָה', orig_surface = 'הָיָה', orig_morphology = 'HVqp3ms', morph_pos = 'verb', morph_source = 'oshb_wlc', verified_locator = 'OSHB:B11.C19.V12.w5', relation_type = 'primary' WHERE id = '1f98f050-ab80-44ab-bdd7-1a224447f0ee'; INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('1f98f050-ab80-44ab-bdd7-1a224447f0ee', 'H1961', 'primary', 1, 5, 'הָיָה', 'HVqp3ms', 'oshb_wlc');"
  },
  {
    name: 'Negative: Dropping secondary H9003 from #8 "النَّارِ" is rejected',
    pos: 8,
    sql: "DELETE FROM word_mapping_strongs WHERE mapping_id = 'e7d90c86-5a56-4648-9c31-fb73a381a990' AND strongs_id = 'H9003';"
  },
  {
    name: 'Negative: Blanking mandatory component fields on #7 "فِي" is rejected',
    pos: 7,
    sql: "UPDATE word_mapping_strongs SET orig_component = NULL WHERE mapping_id = '86b86fbe-c9b7-42f4-b959-e8a8636ff95a' AND strongs_id = 'H9003';"
  },
  {
    name: 'Negative: Blanking mandatory component fields on #12 "مُنْخَفِضٌ" is rejected',
    pos: 12,
    sql: "UPDATE word_mapping_strongs SET orig_morphology = NULL WHERE mapping_id = '9ef3cc9a-70cf-4bcf-bebd-8d7a5e8bf531' AND strongs_id = 'H1827';"
  },
  {
    name: 'Negative: Token collision by mapping #13 to w10 without compound_phrase is rejected',
    pos: 13,
    sql: "UPDATE word_mappings SET orig_word_position = 10, verified_locator = 'OSHB:B11.C19.V12.w10' WHERE id = '2e684aaf-eebc-4acc-b707-232faee94ec3';"
  }
];

fs.mkdirSync(path.dirname(scratchDb), { recursive: true });
try {
  for (const reg of regressions) {
    try {
      fs.copyFileSync(dbPath, scratchDb);
      execFileSync(sqlitePath, [scratchDb], { input: reg.sql, encoding: 'utf8' });
      const rep = runHoldoutAudit(scratchDb);
      const al = (rep.alerts || []).find(a => a.verse === '1Kgs 19:12' && a.pos === reg.pos);
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
