const { execFileSync } = require('child_process');
const path = require('path');
const sqlite = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');
const db = path.join(__dirname, '..', 'mobile', 'assets', 'bible_study.db');

function runSql(sql) {
  const tmp = path.join(__dirname, 'temp_arb_fix.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

const fs = require('fs');

console.log('=== APPLYING LINGUISTIC ARBITRATION FIXES ===');

const sql = `
BEGIN TRANSACTION;

-- 1. Deuteronomy 2:24 (verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24))
-- ar:16 «ابْتَدِئْ» -> w17 הָחֵ֣ל (H2490)
UPDATE word_mappings
SET orig_word = 'חָלַל',
    orig_surface = 'הָחֵ֣ל',
    strongs_id = 'H2490',
    orig_word_position = 17,
    morph_pos = 'verb',
    orig_morphology = 'HVhv2ms',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B5.C2.V24.w17',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24)
  AND ar_word_position = 16;

UPDATE word_mapping_strongs
SET strongs_id = 'H2490',
    orig_word_position = 17,
    orig_morphology = 'HVhv2ms',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24) AND ar_word_position = 16)
  AND link_order = 1;

-- ar:17 «تَمَلَّكْ» -> w18 רָ֑שׁ (H3423)
UPDATE word_mappings
SET orig_word = 'יָרַשׁ',
    orig_surface = 'רָ֑שׁ',
    strongs_id = 'H3423',
    orig_word_position = 18,
    morph_pos = 'verb',
    orig_morphology = 'HVqv2ms',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B5.C2.V24.w18',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24)
  AND ar_word_position = 17;

UPDATE word_mapping_strongs
SET strongs_id = 'H3423',
    orig_word_position = 18,
    orig_morphology = 'HVqv2ms',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24) AND ar_word_position = 17)
  AND link_order = 1;

-- ar:18 «وَأَثِرْ» -> w19 וְהִתְגָּ֥ר (H1624)
UPDATE word_mappings
SET orig_word = 'גָּרָה',
    orig_surface = 'וְהִתְגָּ֥ר',
    strongs_id = 'H1624',
    orig_word_position = 19,
    morph_pos = 'verb',
    orig_morphology = 'HC/Vtv2ms',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B5.C2.V24.w19',
    is_verified = 1,
    grammar_notes = 'فعل أمر هيتباعل مع واو العطف וְהִתְגָּר في موضعه العبري الدقيق w19'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24)
  AND ar_word_position = 18;

UPDATE word_mapping_strongs
SET strongs_id = 'H1624',
    orig_word_position = 19,
    orig_morphology = 'HC/Vtv2ms',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24) AND ar_word_position = 18)
  AND link_order = 1;

-- ar:19 «عَلَيْهِ» -> w20 בֹּ֖ו (H9003)
UPDATE word_mappings
SET orig_word = 'בּוֹ',
    orig_surface = 'בֹּ֖ו',
    strongs_id = 'H9003',
    orig_word_position = 20,
    morph_pos = 'preposition',
    orig_morphology = 'HR/Sp3ms',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B5.C2.V24.w20',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24)
  AND ar_word_position = 19;

UPDATE word_mapping_strongs
SET strongs_id = 'H9003',
    orig_word_position = 20,
    orig_morphology = 'HR/Sp3ms',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24) AND ar_word_position = 19)
  AND link_order = 1;

-- ar:20 «حَرْبًا» -> w21 מִלְחָמָֽה׃ (H4421)
UPDATE word_mappings
SET orig_word = 'מִלְחָמָה',
    orig_surface = 'מִלְחָמָֽה׃',
    strongs_id = 'H4421',
    orig_word_position = 21,
    morph_pos = 'noun',
    orig_morphology = 'HNcfsa',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B5.C2.V24.w21',
    is_verified = 1
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24)
  AND ar_word_position = 20;

UPDATE word_mapping_strongs
SET strongs_id = 'H4421',
    orig_word_position = 21,
    orig_morphology = 'HNcfsa',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 2 AND verse_num = 24) AND ar_word_position = 20)
  AND link_order = 1;


-- 2. Job 1:4 (verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4))
-- ar:15 «أَخَوَاتِهِمِ» -> w11 אַחְיוֹתֵיהֶ֔ם (H269) replacing false H26 (Abigail!)
UPDATE word_mappings
SET orig_word = 'אָחוֹת',
    orig_surface = 'אַחְיוֹתֵיהֶ֔ם',
    strongs_id = 'H269',
    orig_word_position = 11,
    morph_pos = 'noun',
    orig_morphology = 'HNcfpc/Sp3mp',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B18.C1.V4.w11',
    is_verified = 1,
    grammar_notes = 'اسم مؤنث جمع مضاف مع ضمير الغائبين الجمع אַחְיוֹתֵיהֶם من אָחוֹת (H269) وليس اسم العلم أَبِيجَايِل (H26)'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4)
  AND ar_word_position = 15;

UPDATE word_mapping_strongs
SET strongs_id = 'H269',
    orig_word_position = 11,
    orig_morphology = 'HNcfpc/Sp3mp',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 1 AND verse_num = 4) AND ar_word_position = 15)
  AND link_order = 1;


-- 3. Job 22:5 (verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 22 AND verse_num = 5))
-- ar:7 «لَهَا» -> syntactic complement (not linked as translation of לַעֲוֹנֹתֶיךָ)
UPDATE word_mappings
SET orig_word = '',
    orig_surface = '—',
    strongs_id = NULL,
    orig_word_position = NULL,
    morph_pos = 'syntactic_ar',
    orig_morphology = NULL,
    morph_source = 'syntactic_ar',
    verified_locator = 'ARABIC:SYNTACTIC.B18.C22.V5.w7',
    is_verified = 1,
    grammar_notes = 'ضمير عائد متمم دلالي تحليلي في الصياغة العربية للجملة الاسمية المنفية (لا نهاية لها)، ولا يقابله لفظ عبري مستقل.'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 22 AND verse_num = 5)
  AND ar_word_position = 7;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 18 AND chapter_num = 22 AND verse_num = 5) AND ar_word_position = 7);


-- 4. Numbers 18:15 (verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 18 AND verse_num = 15))
-- Separate lemma (פָּדָה) from inflected surface (תִּפְדֶּ֗ה / תִּפְדֶּֽה׃)
UPDATE word_mappings
SET orig_word = 'פָּדָה',
    orig_surface = 'תִּפְדֶּ֗ה',
    strongs_id = 'H6299',
    orig_word_position = 18,
    morph_pos = 'verb',
    orig_morphology = 'HVqi2ms',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B4.C18.V15.w18',
    is_verified = 1,
    grammar_notes = 'صيغة الفعل المصرف تִּפְדֶּה (الموضع w18) من الأصل المعجمي פָּדָה (H6299)، وترجمه فانديك «تَقْبَلُ [فِدَاءَ]» بتعبير بياني لتعدية الفعل.'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 18 AND verse_num = 15)
  AND ar_word_position = 17;

UPDATE word_mapping_strongs
SET strongs_id = 'H6299',
    orig_word_position = 18,
    orig_morphology = 'HVqi2ms',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 18 AND verse_num = 15) AND ar_word_position = 17)
  AND link_order = 1;

UPDATE word_mappings
SET orig_word = 'פָּדָה',
    orig_surface = 'תִּפְדֶּֽה׃',
    strongs_id = 'H6299',
    orig_word_position = 24,
    morph_pos = 'verb',
    orig_morphology = 'HVqi2ms',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B4.C18.V15.w24',
    is_verified = 1,
    grammar_notes = 'صيغة الفعل المصرف تִּפְדֶּה (الموضع w24) من الأصل المعجمي פָּדָה (H6299)، وترجمه فانديك «تَقْبَلُ [فِدَاءَهُ]».'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 18 AND verse_num = 15)
  AND ar_word_position = 24;

UPDATE word_mapping_strongs
SET strongs_id = 'H6299',
    orig_word_position = 24,
    orig_morphology = 'HVqi2ms',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 18 AND verse_num = 15) AND ar_word_position = 24)
  AND link_order = 1;


-- 5. Ezra 4:14 (verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 14))
-- Separate lemma (מֶלֶךְ) from inflected Aramaic surface (לְמַلְכָּֽא׃)
UPDATE word_mappings
SET orig_word = 'מֶלֶךְ',
    orig_surface = 'לְמַלְכָּֽא׃',
    strongs_id = 'H4430',
    orig_word_position = 18,
    morph_pos = 'noun',
    orig_morphology = 'AR/HR/Ncmpa',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B15.C4.V14.w18',
    is_verified = 1,
    grammar_notes = 'صيغة الاسم الآرامي المعرف بحالة التوكيد مع لام الجر לְמַלְכָּא (الموضع w18) من الأصل المعجمي מֶלֶךְ (H4430).'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 14)
  AND ar_word_position = 18;

UPDATE word_mapping_strongs
SET strongs_id = 'H4430',
    orig_word_position = 18,
    orig_morphology = 'AR/HR/Ncmpa',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 14) AND ar_word_position = 18)
  AND link_order = 1;

COMMIT;
`;

runSql(sql);
console.log('Successfully applied linguistic arbitration fixes!');
