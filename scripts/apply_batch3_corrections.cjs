const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const sqlite = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');
const db = path.join(__dirname, '..', 'mobile', 'assets', 'bible_study.db');

function runSql(sql) {
  const tmp = path.join(__dirname, 'temp_b3.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

console.log('Applying Batch 3 corrections (32 cases across 9 verses)...');

const sql = `
BEGIN TRANSACTION;

-- ============================================================================
-- 1. Proverbs 19:20 (Book 20, Ch 19, V 20)
-- Cases 29, 81, 82
-- Hebrew: שְׁמַ֣ע (w1) עֵ֭צָה (w2) וְקַבֵּ֣ל (w3) מוּסָ֑ר (w4) לְ֝מַ֗עַן (w5) תֶּחְכַּ֥ם (w6) בְּאַחֲרִיתֶֽךָ׃ (w7)
-- ============================================================================
-- ar:6 تَكُونَ -> auxiliary linked to w6
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 6, verified_locator = 'AR_SYNTACTIC:B20.C19.V20.w6',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 19 AND verse_num = 20)
  AND ar_word_position = 6;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 19 AND verse_num = 20) AND ar_word_position = 6);

-- Case 29: ar:7 حَكِيمًا -> w6 תֶּחְכַּ֥ם H2449
UPDATE word_mappings
SET orig_word = 'חָכַם', orig_surface = 'תֶּחְכַּ֥ם', strongs_id = 'H2449', orig_word_position = 6,
    morph_pos = 'verb', orig_morphology = 'HVqi2ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B20.C19.V20.w6', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 19 AND verse_num = 20)
  AND ar_word_position = 7;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 19 AND verse_num = 20) AND ar_word_position = 7),
        'H2449', 1, 'primary', 6, 'HVqi2ms', 'oshb_wlc');

-- Case 81: ar:8 فِي -> syntactic preposition for w7
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 7, verified_locator = 'AR_SYNTACTIC:B20.C19.V20.w7',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 19 AND verse_num = 20)
  AND ar_word_position = 8;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 19 AND verse_num = 20) AND ar_word_position = 8);

-- Case 82: ar:9 آخِرَتِكَ -> w7 בְּאַחֲרִיתֶֽךָ׃ H319
UPDATE word_mappings
SET orig_word = 'אַחֲרִית', orig_surface = 'בְּאַחֲרִיתֶֽךָ׃', strongs_id = 'H319', orig_word_position = 7,
    morph_pos = 'noun', orig_morphology = 'HR/Ncfsc/Sp2ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B20.C19.V20.w7', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 19 AND verse_num = 20)
  AND ar_word_position = 9;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 19 AND verse_num = 20) AND ar_word_position = 9),
        'H319', 1, 'primary', 7, 'HR/Ncfsc/Sp2ms', 'oshb_wlc');

-- ============================================================================
-- 2. Job 29:2 (Book 18, Ch 29, V 2)
-- Cases 32, 33
-- Hebrew: מִֽי־יִתְּנֵ֥נִי (w1) כְיַרְחֵי־קֶ֑דֶם (w2) כִּ֝ימֵ֗י (w3) אֱלֹ֣והַּ (w4) יִשְׁמְרֵֽנִי׃ (w5)
-- ============================================================================
-- ar:4 فِي -> syntactic preposition
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 2, verified_locator = 'AR_SYNTACTIC:B18.C29.V2.w2',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2)
  AND ar_word_position = 4;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2) AND ar_word_position = 4);

-- Case 32: ar:5 الشُّهُورِ -> w2 כְיַרְחֵי־קֶ֑דֶם (H3391)
UPDATE word_mappings
SET orig_word = 'יֶרַח', orig_surface = 'כְיַרְחֵי־קֶ֑דֶם', strongs_id = 'H3391', orig_word_position = 2,
    morph_pos = 'noun', orig_morphology = 'HR/Ncmpc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B18.C29.V2.w2', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2)
  AND ar_word_position = 5;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2) AND ar_word_position = 5),
        'H3391', 1, 'primary', 2, 'HR/Ncmpc', 'oshb_wlc');

-- Case 33: ar:6 السَّالِفَةِ -> w2 כְיַרְחֵי־קֶ֑דֶם (H6924)
UPDATE word_mappings
SET orig_word = 'קֶדֶם', orig_surface = 'כְיַרְחֵי־קֶ֑דֶם', strongs_id = 'H6924', orig_word_position = 2,
    morph_pos = 'noun', orig_morphology = 'HNcmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B18.C29.V2.w2', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2)
  AND ar_word_position = 6;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2) AND ar_word_position = 6),
        'H6924', 1, 'primary', 2, 'HNcmsa', 'oshb_wlc');

-- ar:8 الَّتِي -> syntactic relative
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 3, verified_locator = 'AR_SYNTACTIC:B18.C29.V2.w3',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2)
  AND ar_word_position = 8;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2) AND ar_word_position = 8);

-- ar:9 حَفِظَنِي -> w5 יִשְׁמְרֵֽנִי׃ H8104
UPDATE word_mappings
SET orig_word = 'שָׁמַר', orig_surface = 'יִשְׁמְרֵֽנִי׃', strongs_id = 'H8104', orig_word_position = 5,
    morph_pos = 'verb', orig_morphology = 'HVqi3ms/Sp1cs', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B18.C29.V2.w5', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2)
  AND ar_word_position = 9;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2) AND ar_word_position = 9),
        'H8104', 1, 'primary', 5, 'HVqi3ms/Sp1cs', 'oshb_wlc');

-- ar:10 اللهُ -> w4 אֱלֹ֣והַּ H433
UPDATE word_mappings
SET orig_word = 'אֱלוֹהַּ', orig_surface = 'אֱלֹ֣והַּ', strongs_id = 'H433', orig_word_position = 4,
    morph_pos = 'noun', orig_morphology = 'HNcmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B18.C29.V2.w4', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2)
  AND ar_word_position = 10;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2) AND ar_word_position = 10),
        'H433', 1, 'primary', 4, 'HNcmsa', 'oshb_wlc');

-- ar:11 فِيهَا -> syntactic complement
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 5, verified_locator = 'AR_SYNTACTIC:B18.C29.V2.w5',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2)
  AND ar_word_position = 11;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 29 AND verse_num = 2) AND ar_word_position = 11);

-- ============================================================================
-- 3. Proverbs 17:12 (Book 20, Ch 17, V 12)
-- Cases 34, 91
-- Hebrew: פָּגֹ֬ושׁ (w1) דֹּ֣ב (w2) שַׁכּ֣וּל (w3) בְּאִ֑ישׁ (w4) וְאַל־כְּ֝סִ֗יל (w5) בְּאִוַּلְתֹּֽו׃ (w6)
-- ============================================================================
-- Case 34: ar:7 فِي -> syntactic preposition
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 6, verified_locator = 'AR_SYNTACTIC:B20.C17.V12.w6',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 17 AND verse_num = 12)
  AND ar_word_position = 7;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 17 AND verse_num = 12) AND ar_word_position = 7);

-- Case 91: ar:8 حَمَاقَتِهِ -> w6 בְּאִוַּלְתֹּֽו׃ H200
UPDATE word_mappings
SET orig_word = 'אִוֶּלֶת', orig_surface = 'בְּאִוַּלְתֹּֽו׃', strongs_id = 'H200', orig_word_position = 6,
    morph_pos = 'noun', orig_morphology = 'HR/Ncfsc/Sp3ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B20.C17.V12.w6', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 17 AND verse_num = 12)
  AND ar_word_position = 8;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 17 AND verse_num = 12) AND ar_word_position = 8),
        'H200', 1, 'primary', 6, 'HR/Ncfsc/Sp3ms', 'oshb_wlc');

-- ============================================================================
-- 4. Ecclesiastes 2:7 (Book 21, Ch 2, V 7)
-- Cases 35, 36, 37, 92, 93, 94
-- Hebrew has 17 words: מִכֹּ֛ל (w14) שֶֽׁהָי֥וּ (w15) לְפָנַ֖י (w16) בִּירוּשָׁלִָֽם׃ (w17)
-- ============================================================================
-- Case 35: ar:16 جَمِيعِ -> w14 מִכֹּ֛ל H3605
UPDATE word_mappings
SET orig_word = 'כֹּל', orig_surface = 'מִכֹּ֛ל', strongs_id = 'H3605', orig_word_position = 14,
    morph_pos = 'noun', orig_morphology = 'HR/Ncmsc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B21.C2.V7.w14', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7)
  AND ar_word_position = 16;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7) AND ar_word_position = 16),
        'H3605', 1, 'primary', 14, 'HR/Ncmsc', 'oshb_wlc');

-- Case 36: ar:17 الَّذِينَ -> w15 שֶֽׁהָי֥וּ (relative prefix שֶׁ)
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 15, verified_locator = 'AR_SYNTACTIC:B21.C2.V7.w15',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7)
  AND ar_word_position = 17;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7) AND ar_word_position = 17);

-- Case 37: ar:18 كَانُوا -> w15 שֶֽׁהָי֥וּ H1961
UPDATE word_mappings
SET orig_word = 'הָיָה', orig_surface = 'שֶֽׁהָי֥וּ', strongs_id = 'H1961', orig_word_position = 15,
    morph_pos = 'verb', orig_morphology = 'HTr/Vqp3cp', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B21.C2.V7.w15', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7)
  AND ar_word_position = 18;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7) AND ar_word_position = 18),
        'H1961', 1, 'primary', 15, 'HTr/Vqp3cp', 'oshb_wlc');

-- Case 92: ar:19 فِي -> syntactic preposition
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 17, verified_locator = 'AR_SYNTACTIC:B21.C2.V7.w17',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7)
  AND ar_word_position = 19;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7) AND ar_word_position = 19);

-- Case 93: ar:20 أُورُشَلِيمَ -> w17 בִּירוּשָׁלִָֽם׃ H3390
UPDATE word_mappings
SET orig_word = 'יְרוּשָׁלֵם', orig_surface = 'בִּירוּשָׁלִָֽם׃', strongs_id = 'H3390', orig_word_position = 17,
    morph_pos = 'noun', orig_morphology = 'HR/Np', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B21.C2.V7.w17', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7)
  AND ar_word_position = 20;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7) AND ar_word_position = 20),
        'H3390', 1, 'primary', 17, 'HR/Np', 'oshb_wlc');

-- Case 94: ar:21 قَبْلِي -> w16 לְפָנַ֖י H6440
UPDATE word_mappings
SET orig_word = 'פָּנִים', orig_surface = 'לְפָנַ֖י', strongs_id = 'H6440', orig_word_position = 16,
    morph_pos = 'noun', orig_morphology = 'HR/Ncbpc/Sp1cs', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B21.C2.V7.w16', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7)
  AND ar_word_position = 21;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 21 AND chapter_num = 2 AND verse_num = 7) AND ar_word_position = 21),
        'H6440', 1, 'primary', 16, 'HR/Ncbpc/Sp1cs', 'oshb_wlc');

-- ============================================================================
-- 5. Isaiah 28:16 (Book 23, Ch 28, V 16)
-- Cases 38, 39, 96, 97
-- Hebrew has 18 words: הַֽמַּאֲמִ֖ין (w16) לֹ֥א (w17) יָחִֽישׁ׃ (w18)
-- ============================================================================
-- ar:18 مَنْ -> syntactic relative / conditional
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 16, verified_locator = 'AR_SYNTACTIC:B23.C28.V16.w16',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 28 AND verse_num = 16)
  AND ar_word_position = 18;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 28 AND verse_num = 16) AND ar_word_position = 18);

-- ar:19 آمَنَ -> w16 הַֽמַּאֲמִ֖ין H539
UPDATE word_mappings
SET orig_word = 'אָמַן', orig_surface = 'הַֽמַּאֲמִ֖ין', strongs_id = 'H539', orig_word_position = 16,
    morph_pos = 'verb', orig_morphology = 'HTd/Vhrmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C28.V16.w16', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 28 AND verse_num = 16)
  AND ar_word_position = 19;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 28 AND verse_num = 16) AND ar_word_position = 19),
        'H539', 1, 'primary', 16, 'HTd/Vhrmsa', 'oshb_wlc');

-- Cases 38, 96: ar:20 لاَ -> w17 לֹ֥א H3808
UPDATE word_mappings
SET orig_word = 'לֹא', orig_surface = 'לֹ֥א', strongs_id = 'H3808', orig_word_position = 17,
    morph_pos = 'adv', orig_morphology = 'HTn', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C28.V16.w17', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 28 AND verse_num = 16)
  AND ar_word_position = 20;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 28 AND verse_num = 16) AND ar_word_position = 20),
        'H3808', 1, 'primary', 17, 'HTn', 'oshb_wlc');

-- Cases 39, 97: ar:21 يَهْرُبُ -> w18 יָחִֽישׁ׃ H2331
UPDATE word_mappings
SET orig_word = 'חוּשׁ', orig_surface = 'יָחִֽישׁ׃', strongs_id = 'H2331', orig_word_position = 18,
    morph_pos = 'verb', orig_morphology = 'HVhi3ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C28.V16.w18', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 28 AND verse_num = 16)
  AND ar_word_position = 21;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 28 AND verse_num = 16) AND ar_word_position = 21),
        'H2331', 1, 'primary', 18, 'HVhi3ms', 'oshb_wlc');

-- ============================================================================
-- 6. Isaiah 47:15 (Book 23, Ch 47, V 15)
-- Cases 48, 100, 101, 102, 103, 104
-- Hebrew has 11 words: אִ֤ישׁ (w7) לְעֶבְרֹו֙ (w8) תָּע֔וּ (w9) אֵ֖ין (w10) מֹושִׁיעֵֽךְ׃ (w11)
-- ============================================================================
-- Case 48: ar:3 لَكِ -> w2 הָיוּ־לָ֖ךְ H9003
UPDATE word_mappings
SET orig_word = 'לְ', orig_surface = 'הָיוּ־לָ֖ךְ', strongs_id = 'H9003', orig_word_position = 2,
    morph_pos = 'prep', orig_morphology = 'HR/Sp2fs', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C47.V15.w2', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 3;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 3),
        'H9003', 1, 'primary', 2, 'HR/Sp2fs', 'oshb_wlc');

-- ar:10 قَدْ -> syntactic
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 9, verified_locator = 'AR_SYNTACTIC:B23.C47.V15.w9',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 10;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 10);

-- ar:11 شَرَدُوا -> w9 תָּע֔וּ H8582
UPDATE word_mappings
SET orig_word = 'תָּעָה', orig_surface = 'תָּע֔וּ', strongs_id = 'H8582', orig_word_position = 9,
    morph_pos = 'verb', orig_morphology = 'HVqp3cp', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C47.V15.w9', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 11;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 11),
        'H8582', 1, 'primary', 9, 'HVqp3cp', 'oshb_wlc');

-- ar:12 كُلُّ -> w7 אִ֤ישׁ H376
UPDATE word_mappings
SET orig_word = 'אִישׁ', orig_surface = 'אִ֤ישׁ', strongs_id = 'H376', orig_word_position = 7,
    morph_pos = 'noun', orig_morphology = 'HNcmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C47.V15.w7', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 12;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 12),
        'H376', 1, 'primary', 7, 'HNcmsa', 'oshb_wlc');

-- ar:13 وَاحِدٍ -> syntactic apposition / reinforcement for w7
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 7, verified_locator = 'AR_SYNTACTIC:B23.C47.V15.w7',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 13;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 13);

-- Case 100: ar:14 عَلَى -> syntactic preposition for w8
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 8, verified_locator = 'AR_SYNTACTIC:B23.C47.V15.w8',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 14;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 14);

-- Case 101: ar:15 وَجْهِهِ -> w8 לְעֶבְרֹו֙ H5676
UPDATE word_mappings
SET orig_word = 'עֵבֶר', orig_surface = 'לְעֶבְרֹו֙', strongs_id = 'H5676', orig_word_position = 8,
    morph_pos = 'noun', orig_morphology = 'HR/Ncmsc/Sp3ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C47.V15.w8', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 15;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 15),
        'H5676', 1, 'primary', 8, 'HR/Ncmsc/Sp3ms', 'oshb_wlc');

-- Case 102: ar:16 وَلَيْسَ -> w10 אֵ֖ין H369
UPDATE word_mappings
SET orig_word = 'אַיִן', orig_surface = 'אֵ֖ין', strongs_id = 'H369', orig_word_position = 10,
    morph_pos = 'part', orig_morphology = 'HTn', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C47.V15.w10', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 16;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 16),
        'H369', 1, 'primary', 10, 'HTn', 'oshb_wlc');

-- Case 103: ar:17 مَنْ -> syntactic relative / interrogative
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 11, verified_locator = 'AR_SYNTACTIC:B23.C47.V15.w11',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 17;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 17);

-- Case 104: ar:18 يُخَلِّصُكِ -> w11 מֹושִׁיעֵֽךְ׃ H3467
UPDATE word_mappings
SET orig_word = 'יָשַׁע', orig_surface = 'מֹושִׁיעֵֽךְ׃', strongs_id = 'H3467', orig_word_position = 11,
    morph_pos = 'verb', orig_morphology = 'HVhrmsc/Sp2fs', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B23.C47.V15.w11', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 18;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 18),
        'H3467', 1, 'primary', 11, 'HVhrmsc/Sp2fs', 'oshb_wlc');

-- ============================================================================
-- 7. Jeremiah 36:23 (Book 24, Ch 36, V 23)
-- Cases 50, 51, 105, 106, 107
-- Hebrew has 24 words: עַד (w16) תֹּם֙ (w17) כָּל (w18) הַמְּגִלָּ֔ה (w19) עַל (w20) הָאֵ֖שׁ (w21) אֲשֶׁ֥ר (w22) עַל (w23) הָאָֽח׃ (w24)
-- ============================================================================
-- Case 51: ar:19 حَتَّى -> w16 עַד H5704
UPDATE word_mappings
SET orig_word = 'עַד', orig_surface = 'עַד', strongs_id = 'H5704', orig_word_position = 16,
    morph_pos = 'prep', orig_morphology = 'HR', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C36.V23.w16', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23)
  AND ar_word_position = 19;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23) AND ar_word_position = 19),
        'H5704', 1, 'primary', 16, 'HR', 'oshb_wlc');

-- ar:20 فَنِيَ -> w17 תֹּם֙ H8552
UPDATE word_mappings
SET orig_word = 'תָּמַם', orig_surface = 'תֹּם֙', strongs_id = 'H8552', orig_word_position = 17,
    morph_pos = 'verb', orig_morphology = 'HVqc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C36.V23.w17', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23)
  AND ar_word_position = 20;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23) AND ar_word_position = 20),
        'H8552', 1, 'primary', 17, 'HVqc', 'oshb_wlc');

-- ar:21 كُلُّ -> w18 כָּל H3605
UPDATE word_mappings
SET orig_word = 'כֹּל', orig_surface = 'כָּל', strongs_id = 'H3605', orig_word_position = 18,
    morph_pos = 'noun', orig_morphology = 'HNcmsc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C36.V23.w18', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23)
  AND ar_word_position = 21;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23) AND ar_word_position = 21),
        'H3605', 1, 'primary', 18, 'HNcmsc', 'oshb_wlc');

-- ar:22 الدَّرْجِ -> w19 הַמְּגִלָּ֔ה H4039
UPDATE word_mappings
SET orig_word = 'מְגִלָּה', orig_surface = 'הַמְּגִלָּ֔ה', strongs_id = 'H4039', orig_word_position = 19,
    morph_pos = 'noun', orig_morphology = 'HTd/Ncfsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C36.V23.w19', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23)
  AND ar_word_position = 22;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23) AND ar_word_position = 22),
        'H4039', 1, 'primary', 19, 'HTd/Ncfsa', 'oshb_wlc');

-- ar:23 فِي -> w20 עַל (syntactic preposition)
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 20, verified_locator = 'AR_SYNTACTIC:B24.C36.V23.w20',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23)
  AND ar_word_position = 23;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23) AND ar_word_position = 23);

-- Case 50: ar:24 النَّارِ -> w21 הָאֵ֖שׁ H784
UPDATE word_mappings
SET orig_word = 'אֵשׁ', orig_surface = 'הָאֵ֖שׁ', strongs_id = 'H784', orig_word_position = 21,
    morph_pos = 'noun', orig_morphology = 'HTd/Ncbsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C36.V23.w21', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23)
  AND ar_word_position = 24;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23) AND ar_word_position = 24),
        'H784', 1, 'primary', 21, 'HTd/Ncbsa', 'oshb_wlc');

-- Case 105: ar:25 الَّتِي -> w22 אֲשֶׁ֥ר H834
UPDATE word_mappings
SET orig_word = 'אֲשֶׁר', orig_surface = 'אֲשֶׁ֥ר', strongs_id = 'H834', orig_word_position = 22,
    morph_pos = 'rel', orig_morphology = 'HTr', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C36.V23.w22', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23)
  AND ar_word_position = 25;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23) AND ar_word_position = 25),
        'H834', 1, 'primary', 22, 'HTr', 'oshb_wlc');

-- Case 106: ar:26 فِي -> w23 עַל (syntactic preposition)
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 23, verified_locator = 'AR_SYNTACTIC:B24.C36.V23.w23',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23)
  AND ar_word_position = 26;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23) AND ar_word_position = 26);

-- Case 107: ar:27 الْكَانُونِ -> w24 הָאָֽח׃ H254
UPDATE word_mappings
SET orig_word = 'אָח', orig_surface = 'הָאָֽח׃', strongs_id = 'H254', orig_word_position = 24,
    morph_pos = 'noun', orig_morphology = 'HTd/Ncmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C36.V23.w24', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23)
  AND ar_word_position = 27;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 36 AND verse_num = 23) AND ar_word_position = 27),
        'H254', 1, 'primary', 24, 'HTd/Ncmsa', 'oshb_wlc');

-- ============================================================================
-- 8. Daniel 12:12 (Book 27, Ch 12, V 12)
-- Cases 55, 98, 99
-- Hebrew has 9 words: לְיָמִ֕ים (w4) אֶ֕לֶף (w5) שְׁלֹ֥שׁ (w6) מֵאֹ֖ות (w7) שְׁלֹשִׁ֥ים (w8) וַחֲמִשָּֽׁה׃ (w9)
-- ============================================================================
-- Case 55: ar:2 لِمَنْ -> syntactic relative/prepositional prefix
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 2, verified_locator = 'AR_SYNTACTIC:B27.C12.V12.w2',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12)
  AND ar_word_position = 2;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12) AND ar_word_position = 2);

-- ar:5 إِلَى -> syntactic preposition
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 4, verified_locator = 'AR_SYNTACTIC:B27.C12.V12.w4',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12)
  AND ar_word_position = 5;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12) AND ar_word_position = 5);

-- ar:6 الأَلْفِ -> w5 אֶ֕לֶף H505
UPDATE word_mappings
SET orig_word = 'אֶלֶף', orig_surface = 'אֶ֕לֶף', strongs_id = 'H505', orig_word_position = 5,
    morph_pos = 'num', orig_morphology = 'HAcmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B27.C12.V12.w5', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12)
  AND ar_word_position = 6;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12) AND ar_word_position = 6),
        'H505', 1, 'primary', 5, 'HAcmsa', 'oshb_wlc');

-- ar:7 وَالثَّلاَثِ -> w6 שְׁלֹ֥שׁ H7969
UPDATE word_mappings
SET orig_word = 'שָׁלוֹשׁ', orig_surface = 'שְׁלֹ֥שׁ', strongs_id = 'H7969', orig_word_position = 6,
    morph_pos = 'num', orig_morphology = 'HAcfsc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B27.C12.V12.w6', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12)
  AND ar_word_position = 7;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12) AND ar_word_position = 7),
        'H7969', 1, 'primary', 6, 'HAcfsc', 'oshb_wlc');

-- ar:8 مِئَةٍ -> w7 מֵאֹ֖ות H3967
UPDATE word_mappings
SET orig_word = 'מֵאָה', orig_surface = 'מֵאֹ֖ות', strongs_id = 'H3967', orig_word_position = 7,
    morph_pos = 'num', orig_morphology = 'HNcfpa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B27.C12.V12.w7', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12)
  AND ar_word_position = 8;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12) AND ar_word_position = 8),
        'H3967', 1, 'primary', 7, 'HNcfpa', 'oshb_wlc');

-- ar:9 وَالْخَمْسَةِ -> w9 וַחֲמִשָּֽׁה׃ H2568
UPDATE word_mappings
SET orig_word = 'חָמֵשׁ', orig_surface = 'וַחֲמִשָּֽׁה׃', strongs_id = 'H2568', orig_word_position = 9,
    morph_pos = 'num', orig_morphology = 'HC/Acmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B27.C12.V12.w9', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12)
  AND ar_word_position = 9;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12) AND ar_word_position = 9),
        'H2568', 1, 'primary', 9, 'HC/Acmsa', 'oshb_wlc');

-- Case 98: ar:10 وَالثَّلاَثِينَ -> w8 שְׁלֹשִׁ֥ים H7970
UPDATE word_mappings
SET orig_word = 'שְׁלוֹשִׁים', orig_surface = 'שְׁלֹשִׁ֥ים', strongs_id = 'H7970', orig_word_position = 8,
    morph_pos = 'num', orig_morphology = 'HAcbpa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B27.C12.V12.w8', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12)
  AND ar_word_position = 10;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12) AND ar_word_position = 10),
        'H7970', 1, 'primary', 8, 'HAcbpa', 'oshb_wlc');

-- Case 99: ar:11 يَوْمًا -> w4 לְיָמִ֕ים H3117
UPDATE word_mappings
SET orig_word = 'יוֹם', orig_surface = 'לְיָמִ֕ים', strongs_id = 'H3117', orig_word_position = 4,
    morph_pos = 'noun', orig_morphology = 'HR/Ncmpa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B27.C12.V12.w4', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12)
  AND ar_word_position = 11;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 12 AND verse_num = 12) AND ar_word_position = 11),
        'H3117', 1, 'primary', 4, 'HR/Ncmpa', 'oshb_wlc');

-- ============================================================================
-- 9. Psalm 44:19 (Book 19, Ch 44, V 19)
-- Case 80
-- Hebrew has 7 words: בְצַלְמָֽוֶת׃ (w7)
-- ============================================================================
-- ar:7 بِظِلِّ -> w7 בְצַלְמָֽוֶת׃ H6757 (first part of compound)
UPDATE word_mappings
SET orig_word = 'צַלְמָוֶת', orig_surface = 'בְצַלְמָֽוֶת׃', strongs_id = 'H6757', orig_word_position = 7,
    morph_pos = 'noun', orig_morphology = 'HR/Ncfsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B19.C44.V19.w7', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 19 AND chapter_num = 44 AND verse_num = 19)
  AND ar_word_position = 7;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 19 AND chapter_num = 44 AND verse_num = 19) AND ar_word_position = 7),
        'H6757', 1, 'primary', 7, 'HR/Ncfsa', 'oshb_wlc');

-- Case 80: ar:8 الْمَوْتِ -> w7 בְצַלְמָֽוֶת׃ H6757 (composite genitive complement)
UPDATE word_mappings
SET orig_word = 'צַלְמָוֶת', orig_surface = 'בְצַלְמָֽוֶת׃', strongs_id = 'H6757', orig_word_position = 7,
    morph_pos = 'noun', orig_morphology = 'HR/Ncfsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B19.C44.V19.w7', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 19 AND chapter_num = 44 AND verse_num = 19)
  AND ar_word_position = 8;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 19 AND chapter_num = 44 AND verse_num = 19) AND ar_word_position = 8),
        'H6757', 1, 'primary', 7, 'HR/Ncfsa', 'oshb_wlc');

COMMIT;
`;

runSql(sql);
console.log('Successfully applied Batch 3 SQL transaction!');
