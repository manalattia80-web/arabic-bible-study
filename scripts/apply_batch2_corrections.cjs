const { execFileSync } = require('child_process');
const path = require('path');
const sqlite = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');
const db = path.join(__dirname, '..', 'mobile', 'assets', 'bible_study.db');

function runSql(sql) {
  execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
}

console.log('=== APPLYING SURGICAL BATCH 2 CORRECTIONS (31 CASES ACROSS 8 VERSES) ===');

const sql = `
BEGIN TRANSACTION;

-- ============================================================================
-- 1. Ezekiel 37:16 (Book 26, Ch 37, V 16)
-- Fix jammed Ketiv/Qere in verses.text_original and align words 1-26
-- ============================================================================
UPDATE verses
SET text_original = 'וְאַתָּ֣ה בֶן־אָדָ֗ם קַח־לְךָ֙ עֵ֣ץ אֶחָ֔ד וּכְתֹ֤ב עָלָיו֙ לִֽיהוּדָ֔ה וְלִבְנֵ֥י יִשְׂרָאֵ֖ל [חֲבֵרָו כ] (חֲבֵרָ֑יו ק) וּלְקַח֙ עֵ֣ץ אֶחָ֔ד וּכְת֣וֹב עָלָ֗יו לְיוֹסֵף֙ עֵ֣ץ אֶפְרַ֔יִם וְכָל־בֵּ֥ית יִשְׂרָאֵ֖ל [חֲבֵרָו כ] (חֲבֵרָֽיו׃ ק)'
WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16;

-- ar:2 يَا -> syntactic vocative
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 2, verified_locator = 'AR_SYNTACTIC:B26.C37.V16.w2',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 2;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 2);

-- ar:6 لِنَفْسِكَ -> contextual / prepositional complement
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 5, verified_locator = 'AR_SYNTACTIC:B26.C37.V16.w5',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 6;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 6);

-- ar:7 عَصًا -> w6 עֵץ H6086
UPDATE word_mappings
SET orig_word = 'עֵץ', orig_surface = 'עֵ֣ץ', strongs_id = 'H6086', orig_word_position = 6,
    morph_pos = 'noun', orig_morphology = 'HNcmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w6', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 7;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 7),
        'H6086', 1, 'primary', 6, 'HNcmsa', 'oshb_wlc');

-- Case 40: ar:8 وَاحِدَةً -> w7 אֶחָד H259
UPDATE word_mappings
SET orig_word = 'אֶחָד', orig_surface = 'אֶחָ֔ד', strongs_id = 'H259', orig_word_position = 7,
    morph_pos = 'adj', orig_morphology = 'HAcmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w7', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 8;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 8),
        'H259', 1, 'primary', 7, 'HAcmsa', 'oshb_wlc');

-- ar:9 وَاكْتُבْ -> w8 וּכְתֹב H3789
UPDATE word_mappings
SET orig_word = 'כָּתַב', orig_surface = 'וּכְתֹ֤ב', strongs_id = 'H3789', orig_word_position = 8,
    morph_pos = 'verb', orig_morphology = 'HC/Vqv2ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w8', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 9;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 9),
        'H3789', 1, 'primary', 8, 'HC/Vqv2ms', 'oshb_wlc');

-- ar:10 عَلَيْهَا -> w9 עָלָיו H5921
UPDATE word_mappings
SET orig_word = 'עַל', orig_surface = 'עָלָיו֙', strongs_id = 'H5921', orig_word_position = 9,
    morph_pos = 'prep', orig_morphology = 'HR/Sp3ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w9', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 10;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 10),
        'H5921', 1, 'primary', 9, 'HR/Sp3ms', 'oshb_wlc');

-- ar:11 لِيَهُوذَا -> w10 לִיהוּדָה H3063
UPDATE word_mappings
SET orig_word = 'יְהוּדָה', orig_surface = 'לִֽיהוּדָ֔ה', strongs_id = 'H3063', orig_word_position = 10,
    morph_pos = 'noun', orig_morphology = 'HR/Np', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w10', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 11;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 11),
        'H3063', 1, 'primary', 10, 'HR/Np', 'oshb_wlc');

-- ar:12 وَلِبَنِي -> w11 וְלִבְנֵי H1121
UPDATE word_mappings
SET orig_word = 'בֵּן', orig_surface = 'וְלִבְנֵ֥י', strongs_id = 'H1121', orig_word_position = 11,
    morph_pos = 'noun', orig_morphology = 'HC/R/Ncmpc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w11', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 12;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 12),
        'H1121', 1, 'primary', 11, 'HC/R/Ncmpc', 'oshb_wlc');

-- ar:13 إِسْرَائِيلَ -> w12 יִשְׂרָאֵל H3478
UPDATE word_mappings
SET orig_word = 'יִשְׂרָאֵל', orig_surface = 'יִשְׂרָאֵ֖ל', strongs_id = 'H3478', orig_word_position = 12,
    morph_pos = 'noun', orig_morphology = 'HNp', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w12', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 13;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 13),
        'H3478', 1, 'primary', 12, 'HNp', 'oshb_wlc');

-- ar:14 رُفَقَائِهِ -> w13 חֲבֵרָיו H2270
UPDATE word_mappings
SET orig_word = 'חָבֵר', orig_surface = 'חֲבֵרָ֑יו', strongs_id = 'H2270', orig_word_position = 13,
    morph_pos = 'noun', orig_morphology = 'HNcmpc/Sp3ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w13', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 14;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 14),
        'H2270', 1, 'primary', 13, 'HNcmpc/Sp3ms', 'oshb_wlc');

-- ar:15 وَخُذْ -> w14 וּלְקַח H3947
UPDATE word_mappings
SET orig_word = 'לָקַח', orig_surface = 'וּלְקַח֙', strongs_id = 'H3947', orig_word_position = 14,
    morph_pos = 'verb', orig_morphology = 'HC/Vqv2ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w14', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 15;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 15),
        'H3947', 1, 'primary', 14, 'HC/Vqv2ms', 'oshb_wlc');

-- ar:16 عَصًا -> w15 עֵץ H6086
UPDATE word_mappings
SET orig_word = 'עֵץ', orig_surface = 'עֵ֣ץ', strongs_id = 'H6086', orig_word_position = 15,
    morph_pos = 'noun', orig_morphology = 'HNcmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w15', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 16;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 16),
        'H6086', 1, 'primary', 15, 'HNcmsa', 'oshb_wlc');

-- ar:17 أُخْرَى -> w16 אֶחָד H259
UPDATE word_mappings
SET orig_word = 'אֶחָד', orig_surface = 'אֶחָ֔ד', strongs_id = 'H259', orig_word_position = 16,
    morph_pos = 'adj', orig_morphology = 'HAcmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w16', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 17;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 17),
        'H259', 1, 'primary', 16, 'HAcmsa', 'oshb_wlc');

-- Case 41: ar:18 وَاكْتُבْ -> w17 וּכְתוֹב H3789
UPDATE word_mappings
SET orig_word = 'כָּתַב', orig_surface = 'וּכְת֣וֹב', strongs_id = 'H3789', orig_word_position = 17,
    morph_pos = 'verb', orig_morphology = 'HC/Vqv2ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w17', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 18;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 18),
        'H3789', 1, 'primary', 17, 'HC/Vqv2ms', 'oshb_wlc');

-- Case 42: ar:19 عَلَيْهَا -> w18 עָלָיו H5921
UPDATE word_mappings
SET orig_word = 'עַל', orig_surface = 'עָלָ֗יו', strongs_id = 'H5921', orig_word_position = 18,
    morph_pos = 'prep', orig_morphology = 'HR/Sp3ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w18', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 19;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 19),
        'H5921', 1, 'primary', 18, 'HR/Sp3ms', 'oshb_wlc');

-- Case 43: ar:20 لِيُوسُفَ -> w19 לְיוֹסֵף H3130
UPDATE word_mappings
SET orig_word = 'יוֹסֵף', orig_surface = 'לְיוֹסֵף֙', strongs_id = 'H3130', orig_word_position = 19,
    morph_pos = 'noun', orig_morphology = 'HR/Np', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w19', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 20;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 20),
        'H3130', 1, 'primary', 19, 'HR/Np', 'oshb_wlc');

-- Case 44: ar:21 عَصَا -> w20 עֵץ H6086
UPDATE word_mappings
SET orig_word = 'עֵץ', orig_surface = 'עֵ֣ץ', strongs_id = 'H6086', orig_word_position = 20,
    morph_pos = 'noun', orig_morphology = 'HNcmsc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w20', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 21;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 21),
        'H6086', 1, 'primary', 20, 'HNcmsc', 'oshb_wlc');

-- Case 45: ar:22 أَفْرَايِمَ -> w21 אֶפְרַיִם H669
UPDATE word_mappings
SET orig_word = 'אֶפְרַיִם', orig_surface = 'אֶפְרַ֔יִם', strongs_id = 'H669', orig_word_position = 21,
    morph_pos = 'noun', orig_morphology = 'HNp', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w21', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 22;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 22),
        'H669', 1, 'primary', 21, 'HNp', 'oshb_wlc');

-- ar:23 وَكُلِّ -> w22 וְכָל H3605
UPDATE word_mappings
SET orig_word = 'כֹּל', orig_surface = 'וְכָל־', strongs_id = 'H3605', orig_word_position = 22,
    morph_pos = 'noun', orig_morphology = 'HC/Ncmsc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w22', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 23;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 23),
        'H3605', 1, 'primary', 22, 'HC/Ncmsc', 'oshb_wlc');

-- ar:24 בֵּיתِ -> w23 בֵּית H1004
UPDATE word_mappings
SET orig_word = 'בַּיִת', orig_surface = 'בֵּ֥ית', strongs_id = 'H1004', orig_word_position = 23,
    morph_pos = 'noun', orig_morphology = 'HNcmsc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w23', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 24;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 24),
        'H1004', 1, 'primary', 23, 'HNcmsc', 'oshb_wlc');

-- ar:25 إِسْرَائِيلَ -> w24 יִשְׂרָאֵל H3478
UPDATE word_mappings
SET orig_word = 'יִשְׂרָאֵל', orig_surface = 'יִשְׂרָאֵ֖ל', strongs_id = 'H3478', orig_word_position = 24,
    morph_pos = 'noun', orig_morphology = 'HNp', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w24', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 25;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 25),
        'H3478', 1, 'primary', 24, 'HNp', 'oshb_wlc');

-- ar:26 رُفَقَائِهِ -> w25 חֲבֵרָיו H2270
UPDATE word_mappings
SET orig_word = 'חָבֵר', orig_surface = 'חֲבֵרָֽיו׃', strongs_id = 'H2270', orig_word_position = 25,
    morph_pos = 'noun', orig_morphology = 'HNcmpc/Sp3ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B26.C37.V16.w25', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16)
  AND ar_word_position = 26;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 26 AND chapter_num = 37 AND verse_num = 16) AND ar_word_position = 26),
        'H2270', 1, 'primary', 25, 'HNcmpc/Sp3ms', 'oshb_wlc');

-- ============================================================================
-- 2. 2 Samuel 14:2 (Book 10, Ch 14, V 2)
-- Cases 25, 26, 27, 77, 78, 79
-- ============================================================================
-- Case 25: ar:24 أَيَّامٌ -> w22 יָמִים H3117
UPDATE word_mappings
SET orig_word = 'יוֹם', orig_surface = 'יָמִ֣ים', strongs_id = 'H3117', orig_word_position = 22,
    morph_pos = 'noun', orig_morphology = 'HNcmpa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B10.C14.V2.w22', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2)
  AND ar_word_position = 24;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2) AND ar_word_position = 24),
        'H3117', 1, 'primary', 22, 'HNcmpa', 'oshb_wlc');

-- Case 26: ar:25 كَثِيرَةٌ -> w23 רַבִּים H7227
UPDATE word_mappings
SET orig_word = 'רַב', orig_surface = 'רַבִּ֔ים', strongs_id = 'H7227', orig_word_position = 23,
    morph_pos = 'adj', orig_morphology = 'HAampa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B10.C14.V2.w23', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2)
  AND ar_word_position = 25;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2) AND ar_word_position = 25),
        'H7227', 1, 'primary', 23, 'HAampa', 'oshb_wlc');

-- Case 27: ar:26 وَهِيَ -> syntactic circumstantial construction
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 24, verified_locator = 'AR_SYNTACTIC:B10.C14.V2.w24',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2)
  AND ar_word_position = 26;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2) AND ar_word_position = 26);

-- Case 77: ar:27 تَنُوحُ -> w24 מִתְאַבֶּלֶת H56
UPDATE word_mappings
SET orig_word = 'אָבַל', orig_surface = 'מִתְאַבֶּ֖לֶת', strongs_id = 'H56', orig_word_position = 24,
    morph_pos = 'verb', orig_morphology = 'HVtrmsf', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B10.C14.V2.w24', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2)
  AND ar_word_position = 27;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2) AND ar_word_position = 27),
        'H56', 1, 'primary', 24, 'HVtrmsf', 'oshb_wlc');

-- Case 78: ar:28 عَلَى -> w25 עַל־ H5921
UPDATE word_mappings
SET orig_word = 'עַל', orig_surface = 'עַל־', strongs_id = 'H5921', orig_word_position = 25,
    morph_pos = 'prep', orig_morphology = 'HR', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B10.C14.V2.w25', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2)
  AND ar_word_position = 28;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2) AND ar_word_position = 28),
        'H5921', 1, 'primary', 25, 'HR', 'oshb_wlc');

-- Case 79: ar:29 مَيْتٍ -> w26 מֵת H4191
UPDATE word_mappings
SET orig_word = 'מוּת', orig_surface = 'מֵֽת׃', strongs_id = 'H4191', orig_word_position = 26,
    morph_pos = 'verb', orig_morphology = 'HVqrmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B10.C14.V2.w26', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2)
  AND ar_word_position = 29;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num = 2) AND ar_word_position = 29),
        'H4191', 1, 'primary', 26, 'HVqrmsa', 'oshb_wlc');

-- ============================================================================
-- 3. 2 Chronicles 35:26 (Book 14, Ch 35, V 26)
-- Cases 17, 18, 61, 62, 63
-- ============================================================================
-- ar:5 حَسْبَمَا -> w5 כַּכָּתוּב H3789
UPDATE word_mappings
SET orig_word = 'כָּתַב', orig_surface = 'כַּכָּת֥וּב', strongs_id = 'H3789', orig_word_position = 5,
    morph_pos = 'verb', orig_morphology = 'HR/Vqsmsc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B14.C35.V26.w5', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26)
  AND ar_word_position = 5;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26) AND ar_word_position = 5),
        'H3789', 1, 'primary', 5, 'HR/Vqsmsc', 'oshb_wlc');

-- Case 17: ar:6 هُوَ (أو هِيَ) -> syntactic expletive pronoun
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 5, verified_locator = 'AR_SYNTACTIC:B14.C35.V26.w5',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26)
  AND ar_word_position = 6;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26) AND ar_word_position = 6);

-- Case 18: ar:7 مَكْتُوبٌ (أو مَكْتُوبَةٌ) -> w5 כַּכָּתוּב H3789
UPDATE word_mappings
SET orig_word = 'כָּתַב', orig_surface = 'כַּכָּת֥וּב', strongs_id = 'H3789', orig_word_position = 5,
    morph_pos = 'verb', orig_morphology = 'HR/Vqsmsc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B14.C35.V26.w5', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26)
  AND ar_word_position = 7;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26) AND ar_word_position = 7),
        'H3789', 1, 'primary', 5, 'HR/Vqsmsc', 'oshb_wlc');

-- Case 61: ar:8 فِي -> syntactic preposition
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 6, verified_locator = 'AR_SYNTACTIC:B14.C35.V26.w6',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26)
  AND ar_word_position = 8;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26) AND ar_word_position = 8);

-- Case 62: ar:9 نَامُوسِ -> w6 בְּתוֹרַת H8451
UPDATE word_mappings
SET orig_word = 'תּוֹרָה', orig_surface = 'בְּתוֹרַ֥ת', strongs_id = 'H8451', orig_word_position = 6,
    morph_pos = 'noun', orig_morphology = 'HR/Ncfsc', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B14.C35.V26.w6', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26)
  AND ar_word_position = 9;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26) AND ar_word_position = 9),
        'H8451', 1, 'primary', 6, 'HR/Ncfsc', 'oshb_wlc');

-- Case 63: ar:10 الرَّبِّ -> w7 יְהוָה H3068
UPDATE word_mappings
SET orig_word = 'יְהוָה', orig_surface = 'יְהוָֽה׃', strongs_id = 'H3068', orig_word_position = 7,
    morph_pos = 'noun', orig_morphology = 'HNp', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B14.C35.V26.w7', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26)
  AND ar_word_position = 10;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 35 AND verse_num = 26) AND ar_word_position = 10),
        'H3068', 1, 'primary', 7, 'HNp', 'oshb_wlc');

-- ============================================================================
-- 4. 2 Samuel 17:9 (Book 10, Ch 17, V 9)
-- Cases 68, 69, 70, 71, 72
-- ============================================================================
-- Case 68: ar:24 فِي -> syntactic preposition
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 19, verified_locator = 'AR_SYNTACTIC:B10.C17.V9.w19',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 17 AND verse_num = 9)
  AND ar_word_position = 24;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 17 AND verse_num = 9) AND ar_word_position = 24);

-- Case 69: ar:25 الشَّعْبِ -> w19 בָּעָם H5971
UPDATE word_mappings
SET orig_word = 'עַם', orig_surface = 'בָּעָ֕ם', strongs_id = 'H5971', orig_word_position = 19,
    morph_pos = 'noun', orig_morphology = 'HRd/Ncmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B10.C17.V9.w19', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 17 AND verse_num = 9)
  AND ar_word_position = 25;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 17 AND verse_num = 9) AND ar_word_position = 25),
        'H5971', 1, 'primary', 19, 'HRd/Ncmsa', 'oshb_wlc');

-- Case 70: ar:26 الَّذِي -> w20 אֲשֶׁר H834
UPDATE word_mappings
SET orig_word = 'אֲשֶׁר', orig_surface = 'אֲשֶׁ֖ר', strongs_id = 'H834', orig_word_position = 20,
    morph_pos = 'pron', orig_morphology = 'HTr', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B10.C17.V9.w20', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 17 AND verse_num = 9)
  AND ar_word_position = 26;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 17 AND verse_num = 9) AND ar_word_position = 26),
        'H834', 1, 'primary', 20, 'HTr', 'oshb_wlc');

-- Case 71: ar:27 وَرَاءَ -> w21 אַחֲרֵי H310
UPDATE word_mappings
SET orig_word = 'אַחַר', orig_surface = 'אַחֲרֵ֥י', strongs_id = 'H310', orig_word_position = 21,
    morph_pos = 'prep', orig_morphology = 'HR', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B10.C17.V9.w21', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 17 AND verse_num = 9)
  AND ar_word_position = 27;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 17 AND verse_num = 9) AND ar_word_position = 27),
        'H310', 1, 'primary', 21, 'HR', 'oshb_wlc');

-- Case 72: ar:28 أَبْشَالُومَ -> w22 אַבְשָׁלֹם H53
UPDATE word_mappings
SET orig_word = 'אַבְשָׁלוֹם', orig_surface = 'אַבְשָׁלֹֽם׃', strongs_id = 'H53', orig_word_position = 22,
    morph_pos = 'noun', orig_morphology = 'HNp', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B10.C17.V9.w22', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 17 AND verse_num = 9)
  AND ar_word_position = 28;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 10 AND chapter_num = 17 AND verse_num = 9) AND ar_word_position = 28),
        'H53', 1, 'primary', 22, 'HNp', 'oshb_wlc');

-- ============================================================================
-- 5. 1 Chronicles 12:19 (Book 13, Ch 12, V 19)
-- Case 73: ar:25 إِلَى -> w21 אֶל־ H413
-- ============================================================================
UPDATE word_mappings
SET orig_word = 'אֶל', orig_surface = 'אֶל־', strongs_id = 'H413', orig_word_position = 21,
    morph_pos = 'prep', orig_morphology = 'HR', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B13.C12.V19.w21', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 19)
  AND ar_word_position = 25;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 12 AND verse_num = 19) AND ar_word_position = 25),
        'H413', 1, 'primary', 21, 'HR', 'oshb_wlc');

-- ============================================================================
-- 6. Judges 14:16 (Book 7, Ch 14, V 16)
-- Cases 20, 21, 22
-- ============================================================================
-- Case 20: ar:10 قَدْ -> syntactic aspect particle
UPDATE word_mappings
SET orig_word = '—', orig_surface = '—', strongs_id = NULL, orig_word_lang = 'arabic',
    morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar', orig_morphology = NULL,
    orig_word_position = 11, verified_locator = 'AR_SYNTACTIC:B7.C14.V16.w11',
    relation_type = 'syntactic_construction', is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 14 AND verse_num = 16)
  AND ar_word_position = 10;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 14 AND verse_num = 16) AND ar_word_position = 10);

-- Case 21: ar:11 حَاجَيْتَ -> w11 חַדְתָּ H2330
UPDATE word_mappings
SET orig_word = 'חוּד', orig_surface = 'חַדְתָּ֮', strongs_id = 'H2330', orig_word_position = 11,
    morph_pos = 'verb', orig_morphology = 'HVqp2ms', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B7.C14.V16.w11', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 14 AND verse_num = 16)
  AND ar_word_position = 11;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 14 AND verse_num = 16) AND ar_word_position = 11),
        'H2330', 1, 'primary', 11, 'HVqp2ms', 'oshb_wlc');

-- Case 22: ar:14 أُحْجِيَّةً -> w10 הַחִידָה H2420
UPDATE word_mappings
SET orig_word = 'חִידָה', orig_surface = 'הַחִידָ֣ה', strongs_id = 'H2420', orig_word_position = 10,
    morph_pos = 'noun', orig_morphology = 'HTd/Ncfsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B7.C14.V16.w10', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 14 AND verse_num = 16)
  AND ar_word_position = 14;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 14 AND verse_num = 16) AND ar_word_position = 14),
        'H2420', 1, 'primary', 10, 'HTd/Ncfsa', 'oshb_wlc');

-- ============================================================================
-- 7. Joshua 22:10 (Book 6, Ch 22, V 10)
-- Cases 23, 76
-- ============================================================================
-- ar:21 مَذْبَحًا -> w20 מִזְבֵּחַ H4196
UPDATE word_mappings
SET orig_word = 'מִזְבֵּחַ', orig_surface = 'מִזְבֵּ֥חַ', strongs_id = 'H4196', orig_word_position = 20,
    morph_pos = 'noun', orig_morphology = 'HNcmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B6.C22.V10.w20', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 22 AND verse_num = 10)
  AND ar_word_position = 21;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 22 AND verse_num = 10) AND ar_word_position = 21),
        'H4196', 1, 'primary', 20, 'HNcmsa', 'oshb_wlc');

-- Case 23: ar:22 عَظِيمَ -> w21 גָּדֹול H1419
UPDATE word_mappings
SET orig_word = 'גָּדוֹל', orig_surface = 'גָּדֹ֖ול', strongs_id = 'H1419', orig_word_position = 21,
    morph_pos = 'adj', orig_morphology = 'HAamsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B6.C22.V10.w21', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 22 AND verse_num = 10)
  AND ar_word_position = 22;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 22 AND verse_num = 10) AND ar_word_position = 22),
        'H1419', 1, 'primary', 21, 'HAamsa', 'oshb_wlc');

-- Case 76: ar:23 الْمَنْظَرِ -> w22 לְמַרְאֶה H4758
UPDATE word_mappings
SET orig_word = 'מַרְאֶה', orig_surface = 'לְמַרְאֶֽה׃', strongs_id = 'H4758', orig_word_position = 22,
    morph_pos = 'noun', orig_morphology = 'HR/Ncmsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B6.C22.V10.w22', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 22 AND verse_num = 10)
  AND ar_word_position = 23;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 22 AND verse_num = 10) AND ar_word_position = 23),
        'H4758', 1, 'primary', 22, 'HR/Ncmsa', 'oshb_wlc');

-- ============================================================================
-- 8. Joshua 21:40 (Book 6, Ch 21, V 40)
-- Cases 64, 65, 66
-- ============================================================================
-- Case 64: ar:14 اثْنَتَا -> w12 שְׁתֵּים H8147
UPDATE word_mappings
SET orig_word = 'שְׁנַיִם', orig_surface = 'שְׁתֵּ֥ים', strongs_id = 'H8147', orig_word_position = 12,
    morph_pos = 'num', orig_morphology = 'HAcfda', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B6.C21.V40.w12', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 21 AND verse_num = 40)
  AND ar_word_position = 14;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 21 AND verse_num = 40) AND ar_word_position = 14),
        'H8147', 1, 'primary', 12, 'HAcfda', 'oshb_wlc');

-- Case 65: ar:15 عَشْرَةَ -> w13 עֶשְׂרֵה H6240
UPDATE word_mappings
SET orig_word = 'עֶשְׂרֵה', orig_surface = 'עֶשְׂרֵֽה׃', strongs_id = 'H6240', orig_word_position = 13,
    morph_pos = 'num', orig_morphology = 'HAcfsa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B6.C21.V40.w13', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 21 AND verse_num = 40)
  AND ar_word_position = 15;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 21 AND verse_num = 40) AND ar_word_position = 15),
        'H6240', 1, 'primary', 13, 'HAcfsa', 'oshb_wlc');

-- Case 66: ar:16 مَدِينَةً -> w11 עָרִים H5892
UPDATE word_mappings
SET orig_word = 'עִיר', orig_surface = 'עָרִ֖ים', strongs_id = 'H5892', orig_word_position = 11,
    morph_pos = 'noun', orig_morphology = 'HNcfpa', morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B6.C21.V40.w11', is_verified = 1, relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 21 AND verse_num = 40)
  AND ar_word_position = 16;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_morphology, morph_source)
VALUES ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 21 AND verse_num = 40) AND ar_word_position = 16),
        'H5892', 1, 'primary', 11, 'HNcfpa', 'oshb_wlc');

COMMIT;
`;

runSql(sql);
console.log('Successfully executed Batch 2 SQL transaction!');
