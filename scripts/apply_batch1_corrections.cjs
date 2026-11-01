const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const sqlite = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');
const db = path.join(__dirname, '..', 'mobile', 'assets', 'bible_study.db');

function runSql(sql) {
  const tmp = path.join(__dirname, 'temp_batch1.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

console.log('=== APPLYING BATCH 1 CORRECTIONS (21 CASES ACROSS 9 VERSES) ===');

const sql = `
BEGIN TRANSACTION;

-- 1. Numbers 18:15
-- Case #10: «الإِنْسَانِ» (ar_pos: 20) -> w19 הָֽאָדָ֔ם (H120 HTd/Ncmsa)
UPDATE word_mappings
SET orig_word = 'אָדָם',
    orig_surface = 'הָֽאָדָ֔ם',
    strongs_id = 'H120',
    orig_word_position = 19,
    morph_pos = 'noun',
    orig_morphology = 'HTd/Ncmsa',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B4.C18.V15.w19',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 18 AND verse_num = 15)
  AND ar_word_position = 20;

UPDATE word_mapping_strongs
SET strongs_id = 'H120',
    orig_word_position = 19,
    orig_morphology = 'HTd/Ncmsa',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 18 AND verse_num = 15) AND ar_word_position = 20)
  AND link_order = 1;

-- Case #56: «فِدَاءَهُ» (ar_pos: 25) -> syntactic_ar (analytical expansion of תִּפְדֶּה)
UPDATE word_mappings
SET orig_word = '',
    orig_surface = '—',
    strongs_id = NULL,
    orig_word_position = NULL,
    morph_pos = 'syntactic_ar',
    orig_morphology = NULL,
    morph_source = 'syntactic_ar',
    verified_locator = 'ARABIC:SYNTACTIC.B4.C18.V15.w25',
    is_verified = 1,
    grammar_notes = 'مفعول به متمم دلالي تحليلي لتعدية الفعل تִּפְדֶּה (تَقْبَلُ فِدَاءَهُ) في الصياغة العربية دون كلمة عبرية مستقلة.'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 18 AND verse_num = 15)
  AND ar_word_position = 25;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 18 AND verse_num = 15) AND ar_word_position = 25);


-- 2. Numbers 31:35
-- Case #15: «وَثَلاَثِينَ» (ar_pos: 14) -> w13 וּשְׁלֹשִׁ֖ים (H7970 HC/Acbpa)
UPDATE word_mappings
SET orig_word = 'שְׁלֹשִׁים',
    orig_surface = 'וּשְׁלֹשִׁ֖ים',
    strongs_id = 'H7970',
    orig_word_position = 13,
    morph_pos = 'adjective',
    orig_morphology = 'HC/Acbpa',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B4.C31.V35.w13',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 31 AND verse_num = 35)
  AND ar_word_position = 14;

UPDATE word_mapping_strongs
SET strongs_id = 'H7970',
    orig_word_position = 13,
    orig_morphology = 'HC/Acbpa',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 31 AND verse_num = 35) AND ar_word_position = 14)
  AND link_order = 1;

-- Case #58: «أَلْفًا» (ar_pos: 15) -> w14 אָֽלֶף׃ (H505 HAcbsa)
UPDATE word_mappings
SET orig_word = 'אֶלֶף',
    orig_surface = 'אָֽלֶף׃',
    strongs_id = 'H505',
    orig_word_position = 14,
    morph_pos = 'noun',
    orig_morphology = 'HAcbsa',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B4.C31.V35.w14',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 31 AND verse_num = 35)
  AND ar_word_position = 15;

UPDATE word_mapping_strongs
SET strongs_id = 'H505',
    orig_word_position = 14,
    orig_morphology = 'HAcbsa',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 31 AND verse_num = 35) AND ar_word_position = 15)
  AND link_order = 1;


-- 3. Numbers 22:23
-- Case #16: «لِيَرُدَّهَا» (ar_pos: 22) -> w21 לְהַטֹּתָ֖הּ (H5186 HR/Vhc/Sp3fs)
UPDATE word_mappings
SET orig_word = 'נָטָה',
    orig_surface = 'לְהַטֹּתָ֖הּ',
    strongs_id = 'H5186',
    orig_word_position = 21,
    morph_pos = 'verb',
    orig_morphology = 'HR/Vhc/Sp3fs',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B4.C22.V23.w21',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 22 AND verse_num = 23)
  AND ar_word_position = 22;

UPDATE word_mapping_strongs
SET strongs_id = 'H5186',
    orig_word_position = 21,
    orig_morphology = 'HR/Vhc/Sp3fs',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 22 AND verse_num = 23) AND ar_word_position = 22)
  AND link_order = 1;

-- Case #59: «إِلَى» (ar_pos: 23) -> syntactic_ar (directional preposition in Arabic)
UPDATE word_mappings
SET orig_word = '',
    orig_surface = '—',
    strongs_id = NULL,
    orig_word_position = NULL,
    morph_pos = 'syntactic_ar',
    orig_morphology = NULL,
    morph_source = 'syntactic_ar',
    verified_locator = 'ARABIC:SYNTACTIC.B4.C22.V23.w23',
    is_verified = 1,
    grammar_notes = 'حرف جر اتجاهي باللغة العربية (إلى الطريق) يقابله في العبرية نصب الاسم على الظرفية المكانية הַדָּרֶךְ دون حرف جر مستقل.'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 22 AND verse_num = 23)
  AND ar_word_position = 23;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 22 AND verse_num = 23) AND ar_word_position = 23);

-- Case #60: «الطَّرِيقِ» (ar_pos: 24) -> w22 הַדָּֽרֶךְ׃ (H1870 HTd/Ncbsa)
UPDATE word_mappings
SET orig_word = 'דֶּרֶךְ',
    orig_surface = 'הַדָּֽרֶךְ׃',
    strongs_id = 'H1870',
    orig_word_position = 22,
    morph_pos = 'noun',
    orig_morphology = 'HTd/Ncbsa',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B4.C22.V23.w22',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 22 AND verse_num = 23)
  AND ar_word_position = 24;

UPDATE word_mapping_strongs
SET strongs_id = 'H1870',
    orig_word_position = 22,
    orig_morphology = 'HTd/Ncbsa',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 22 AND verse_num = 23) AND ar_word_position = 24)
  AND link_order = 1;


-- 4. 1 Kings 6:14
-- Case #24: «الْبَيْتَ» (ar_pos: 3) -> w4 הַבַּ֖יִת (H1004 HTd/Ncmsa)
UPDATE word_mappings
SET orig_word = 'בַּיִת',
    orig_surface = 'הַבַּ֖יִת',
    strongs_id = 'H1004',
    orig_word_position = 4,
    morph_pos = 'noun',
    orig_morphology = 'HTd/Ncmsa',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B11.C6.V14.w4',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 11 AND chapter_num = 6 AND verse_num = 14)
  AND ar_word_position = 3;

UPDATE word_mapping_strongs
SET strongs_id = 'H1004',
    orig_word_position = 4,
    orig_morphology = 'HTd/Ncmsa',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 11 AND chapter_num = 6 AND verse_num = 14) AND ar_word_position = 3)
  AND link_order = 1;

-- Also update ar:4 «وَأَكْمَلَهُ» -> w5 וַיְכַלֵּֽהוּ׃
UPDATE word_mappings
SET orig_word_position = 5,
    verified_locator = 'OSHB:B11.C6.V14.w5'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 11 AND chapter_num = 6 AND verse_num = 14)
  AND ar_word_position = 4;

UPDATE word_mapping_strongs
SET orig_word_position = 5
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 11 AND chapter_num = 6 AND verse_num = 14) AND ar_word_position = 4)
  AND link_order = 1;


-- 5. Exodus 8:31
-- Case #57: «وَاحِدَةٌ» (ar_pos: 13) -> w12 אֶחָֽד׃ (H259 HAcmsa)
UPDATE word_mappings
SET orig_word = 'אֶחָד',
    orig_surface = 'אֶחָֽד׃',
    strongs_id = 'H259',
    orig_word_position = 12,
    morph_pos = 'adjective',
    orig_morphology = 'HAcmsa',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B2.C8.V31.w12',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 2 AND chapter_num = 8 AND verse_num = 31)
  AND ar_word_position = 13;

UPDATE word_mapping_strongs
SET strongs_id = 'H259',
    orig_word_position = 12,
    orig_morphology = 'HAcmsa',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 2 AND chapter_num = 8 AND verse_num = 31) AND ar_word_position = 13)
  AND link_order = 1;


-- 6. Job 1:4
-- Case #84: «وَيَسْتَدْعُونَ» (ar_pos: 14) -> w9 וְקָרְאוּ֙ (H7121 HC/Vqp3cp)
UPDATE word_mappings
SET orig_word = 'קָרָא',
    orig_surface = 'וְקָרְאוּ֙',
    strongs_id = 'H7121',
    orig_word_position = 9,
    morph_pos = 'verb',
    orig_morphology = 'HC/Vqp3cp',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B18.C1.V4.w9',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4)
  AND ar_word_position = 14;

UPDATE word_mapping_strongs
SET strongs_id = 'H7121',
    orig_word_position = 9,
    orig_morphology = 'HC/Vqp3cp',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4) AND ar_word_position = 14)
  AND link_order = 1;

-- Case #86: «الثَّلاَثَ» (ar_pos: 16) -> w10 לִשְׁלֹ֣שֶׁת (H7969 HR/Acmsc)
UPDATE word_mappings
SET orig_word = 'שָׁלוֹשׁ',
    orig_surface = 'לִשְׁלֹ֣שֶׁת',
    strongs_id = 'H7969',
    orig_word_position = 10,
    morph_pos = 'adjective',
    orig_morphology = 'HR/Acmsc',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B18.C1.V4.w10',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4)
  AND ar_word_position = 16;

UPDATE word_mapping_strongs
SET strongs_id = 'H7969',
    orig_word_position = 10,
    orig_morphology = 'HR/Acmsc',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4) AND ar_word_position = 16)
  AND link_order = 1;

-- Case #87: «لِيَأْكُلْنَ» (ar_pos: 17) -> w12 לֶאֱכֹ֥ל (H398 HR/Vqc)
UPDATE word_mappings
SET orig_word = 'אָכַל',
    orig_surface = 'לֶאֱכֹ֥ל',
    strongs_id = 'H398',
    orig_word_position = 12,
    morph_pos = 'verb',
    orig_morphology = 'HR/Vqc',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B18.C1.V4.w12',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4)
  AND ar_word_position = 17;

UPDATE word_mapping_strongs
SET strongs_id = 'H398',
    orig_word_position = 12,
    orig_morphology = 'HR/Vqc',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4) AND ar_word_position = 17)
  AND link_order = 1;

-- Case #88: «وَيَشْرَبْنَ» (ar_pos: 18) -> w13 וְלִשְׁתּ֖וֹת (H8354 HC/R/Vqc)
UPDATE word_mappings
SET orig_word = 'שָׁתָה',
    orig_surface = 'וְלִשְׁתּ֖וֹת',
    strongs_id = 'H8354',
    orig_word_position = 13,
    morph_pos = 'verb',
    orig_morphology = 'HC/R/Vqc',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B18.C1.V4.w13',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4)
  AND ar_word_position = 18;

UPDATE word_mapping_strongs
SET strongs_id = 'H8354',
    orig_word_position = 13,
    orig_morphology = 'HC/R/Vqc',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4) AND ar_word_position = 18)
  AND link_order = 1;

-- Case #89: «مَعَهُمْ» (ar_pos: 19) -> w14 עִמָּהֶֽם׃ (H5973 HR/Sp3mp)
UPDATE word_mappings
SET orig_word = 'עִם',
    orig_surface = 'עִמָּהֶֽם׃',
    strongs_id = 'H5973',
    orig_word_position = 14,
    morph_pos = 'preposition',
    orig_morphology = 'HR/Sp3mp',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B18.C1.V4.w14',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4)
  AND ar_word_position = 19;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_morphology, morph_source)
VALUES (
  (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4) AND ar_word_position = 19),
  'H5973',
  'primary',
  1,
  14,
  'HR/Sp3mp',
  'oshb_wlc'
);


-- 7. Psalm 147:5
-- Case #90: «إِحْصَاءَ» (ar_pos: 8) -> w7 מִסְפָּֽר׃ (H4557 HNcmsa)
UPDATE word_mappings
SET orig_word = 'מִסְפָּר',
    orig_surface = 'מִסְפָּֽר׃',
    strongs_id = 'H4557',
    orig_word_position = 7,
    morph_pos = 'noun',
    orig_morphology = 'HNcmsa',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B19.C147.V5.w7',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 19 AND chapter_num = 147 AND verse_num = 5)
  AND ar_word_position = 8;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_morphology, morph_source)
VALUES (
  (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 19 AND chapter_num = 147 AND verse_num = 5) AND ar_word_position = 8),
  'H4557',
  'primary',
  1,
  7,
  'HNcmsa',
  'oshb_wlc'
);


-- 8. Isaiah 1:6
-- Case #108: «تُلَيَّنْ» (ar_pos: 19) -> w17 רֻכְּכָ֖ה (H7401 HVPp3fs)
UPDATE word_mappings
SET orig_word = 'רָכַךְ',
    orig_surface = 'רֻכְּכָ֖ה',
    strongs_id = 'H7401',
    orig_word_position = 17,
    morph_pos = 'verb',
    orig_morphology = 'HVPp3fs',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C1.V6.w17',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 1 AND verse_num = 6)
  AND ar_word_position = 19;

UPDATE word_mapping_strongs
SET strongs_id = 'H7401',
    orig_word_position = 17,
    orig_morphology = 'HVPp3fs',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 1 AND verse_num = 6) AND ar_word_position = 19)
  AND link_order = 1;

-- Case #109: «بِالزَّيْتِ» (ar_pos: 20) -> w18 בַּשָּֽׁמֶן׃ (H8081 HRd/Ncmsa)
UPDATE word_mappings
SET orig_word = 'שֶׁמֶן',
    orig_surface = 'בַּשָּֽׁמֶן׃',
    strongs_id = 'H8081',
    orig_word_position = 18,
    morph_pos = 'noun',
    orig_morphology = 'HRd/Ncmsa',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C1.V6.w18',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 1 AND verse_num = 6)
  AND ar_word_position = 20;

UPDATE word_mapping_strongs
SET strongs_id = 'H8081',
    orig_word_position = 18,
    orig_morphology = 'HRd/Ncmsa',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 1 AND verse_num = 6) AND ar_word_position = 20)
  AND link_order = 1;


-- 9. Jeremiah 2:31
-- Case #110: «لاَ» (ar_pos: 20) -> w16 לֹֽוא (H3808 HTn)
UPDATE word_mappings
SET orig_word = 'לוֹא',
    orig_surface = 'לֹֽוא',
    strongs_id = 'H3808',
    orig_word_position = 16,
    morph_pos = 'particle',
    orig_morphology = 'HTn',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C2.V31.w16',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 2 AND verse_num = 31)
  AND ar_word_position = 20;

UPDATE word_mapping_strongs
SET strongs_id = 'H3808',
    orig_word_position = 16,
    orig_morphology = 'HTn',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 2 AND verse_num = 31) AND ar_word_position = 20)
  AND link_order = 1;

-- Case #111: «نَجِيءُ» (ar_pos: 21) -> w17 נָבֹ֥וא (H935 HVqi1cp)
UPDATE word_mappings
SET orig_word = 'בּוֹא',
    orig_surface = 'נָבֹ֥וא',
    strongs_id = 'H935',
    orig_word_position = 17,
    morph_pos = 'verb',
    orig_morphology = 'HVqi1cp',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C2.V31.w17',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 2 AND verse_num = 31)
  AND ar_word_position = 21;

UPDATE word_mapping_strongs
SET strongs_id = 'H935',
    orig_word_position = 17,
    orig_morphology = 'HVqi1cp',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 2 AND verse_num = 31) AND ar_word_position = 21)
  AND link_order = 1;

-- Case #112: «إِلَيْكَ» (ar_pos: 22) -> w19 אֵלֶֽיךָ׃ (H413 HR/Sp2ms)
UPDATE word_mappings
SET orig_word = 'אֶל',
    orig_surface = 'אֵלֶֽיךָ׃',
    strongs_id = 'H413',
    orig_word_position = 19,
    morph_pos = 'preposition',
    orig_morphology = 'HR/Sp2ms',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C2.V31.w19',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 2 AND verse_num = 31)
  AND ar_word_position = 22;

UPDATE word_mapping_strongs
SET strongs_id = 'H413',
    orig_word_position = 19,
    orig_morphology = 'HR/Sp2ms',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 2 AND verse_num = 31) AND ar_word_position = 22)
  AND link_order = 1;

-- Case #113: «بَعْدُ» (ar_pos: 23) -> w18 עֹ֖וד (H5750 HD)
UPDATE word_mappings
SET orig_word = 'עוֹד',
    orig_surface = 'עֹ֖וד',
    strongs_id = 'H5750',
    orig_word_position = 18,
    morph_pos = 'adverb',
    orig_morphology = 'HD',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C2.V31.w18',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 2 AND verse_num = 31)
  AND ar_word_position = 23;

UPDATE word_mapping_strongs
SET strongs_id = 'H5750',
    orig_word_position = 18,
    orig_morphology = 'HD',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 2 AND verse_num = 31) AND ar_word_position = 23)
  AND link_order = 1;

COMMIT;
`;

runSql(sql);
console.log('Successfully applied Batch 1 corrections (21 cases)!');
