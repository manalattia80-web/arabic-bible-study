const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDb = process.argv[2] 
  ? path.resolve(process.argv[2]) 
  : path.resolve(__dirname, '../mobile/assets/bible_study.db');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const tmpSql = path.resolve(__dirname, 'tmp_apply_deut_1cor.sql');

if (!fs.existsSync(targetDb)) {
  console.error(`Target database not found: ${targetDb}`);
  process.exit(1);
}

console.log(`=== Applying Philological Harmonization for Deut 23:2 and 1 Cor 7:7 ===`);

const subqueryMappingId = (book, ch, vs, wordPos) => 
  `(SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=${book} AND chapter_num=${ch} AND verse_num=${vs}) AND ar_word_position=${wordPos})`;

let sql = [];
sql.push('BEGIN TRANSACTION;');

// =============================================================================
// 1. DEUTERONOMY 23:2 (AVD v2 = Masoretic OSHB/WLC Deut 23:3, 13 original tokens)
// =============================================================================

// Clear existing multi-mappings for Deut 23:2
sql.push(`
DELETE FROM word_mapping_strongs 
WHERE mapping_id IN (
  SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=5 AND chapter_num=23 AND verse_num=2)
);
`);

// 1. لاَ (w1)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H3808', orig_word = 'לֹא', orig_surface = 'לֹא', orig_word_position = 1,
  orig_morphology = 'HTn', morph_pos = 'particle', morph_stem = NULL, morph_tense = NULL,
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w1',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 1)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 1)}, 'H3808', 1, 'primary', 'לֹא', 1, 'HTn', 'oshb_wlc');
`);

// 2. يَدْخُلِ (w2)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H935', orig_word = 'בּוֹא', orig_surface = 'יָבֹ֥א', orig_word_position = 2,
  orig_morphology = 'HVqi3ms', morph_pos = 'verb', morph_stem = 'qal', morph_tense = 'imperfect',
  morph_person = '3', morph_gender = 'masculine', morph_number = 'singular',
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w2',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 2)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 2)}, 'H935', 1, 'primary', 'יָבֹ֥א', 2, 'HVqi3ms', 'oshb_wlc');
`);

// 3. ابْنُ + 4. زِنًى -> מַמְזֵ֖ר (w3, H4464, HNcmsa)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H4464', orig_word = 'מַמְזֵר', orig_surface = 'מַמְזֵ֖ר', orig_word_position = 3,
  orig_morphology = 'HNcmsa', morph_pos = 'noun', morph_stem = NULL, morph_tense = NULL,
  morph_gender = 'masculine', morph_number = 'singular', morph_case = NULL,
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w3',
  relation_type = 'compound_phrase'
WHERE id = ${subqueryMappingId(5, 23, 2, 3)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 3)}, 'H4464', 1, 'primary', 'מַמְזֵ֖ר', 3, 'HNcmsa', 'oshb_wlc');

UPDATE word_mappings SET
  strongs_id = 'H4464', orig_word = 'מַמְזֵר', orig_surface = 'מַמְזֵ֖ר', orig_word_position = 3,
  orig_morphology = 'HNcmsa', morph_pos = 'noun', morph_stem = NULL, morph_tense = NULL,
  morph_gender = 'masculine', morph_number = 'singular', morph_case = NULL,
  orig_word_lang = 'hebrew',
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w3',
  relation_type = 'compound_phrase'
WHERE id = ${subqueryMappingId(5, 23, 2, 4)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 4)}, 'H4464', 1, 'primary', 'מַמְזֵ֖ר', 3, 'HNcmsa', 'oshb_wlc');
`);

// 5. فِي (preposition prefix בִּ of בִּקְهַ֣ל, w4)
sql.push(`
UPDATE word_mappings SET
  strongs_id = NULL, orig_word = 'בְּ', orig_surface = 'בִּ', orig_word_position = 4,
  orig_morphology = 'HR', morph_pos = 'preposition', morph_stem = NULL, morph_tense = NULL,
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w4',
  relation_type = 'preposition_prefix'
WHERE id = ${subqueryMappingId(5, 23, 2, 5)};
`);

// 6. جَمَاعَةِ (קְהַל of בִּקְهַ֣ל, w4, H6951)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H6951', orig_word = 'קָהָל', orig_surface = 'קְהַ֣ל', orig_word_position = 4,
  orig_morphology = 'HNcmsc', morph_pos = 'noun', morph_stem = NULL, morph_tense = NULL,
  morph_gender = 'masculine', morph_number = 'singular',
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w4',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 6)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 6)}, 'H6951', 1, 'primary', 'קְהַ֣ל', 4, 'HNcmsc', 'oshb_wlc');
`);

// 7. الرَّبِّ (יְהוָ֑ה, w5, H3068)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H3068', orig_word = 'יְהֹוָה', orig_surface = 'יְהוָ֑ה', orig_word_position = 5,
  orig_morphology = 'HNp', morph_pos = 'proper_noun', morph_stem = NULL, morph_tense = NULL,
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w5',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 7)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 7)}, 'H3068', 1, 'primary', 'יְהוָ֑ה', 5, 'HNp', 'oshb_wlc');
`);

// 8. حَتَّى (גַּ֚ם, w6, H1571)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H1571', orig_word = 'גַּם', orig_surface = 'גַּ֚ם', orig_word_position = 6,
  orig_morphology = 'HTa', morph_pos = 'particle', morph_stem = NULL, morph_tense = NULL,
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w6',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 8)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 8)}, 'H1571', 1, 'primary', 'גַּ֚ם', 6, 'HTa', 'oshb_wlc');
`);

// 9. الْجِيلِ (דּ֣וֹר, w7, H1755)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H1755', orig_word = 'דּוֹר', orig_surface = 'דּ֣וֹר', orig_word_position = 7,
  orig_morphology = 'HNcmsa', morph_pos = 'noun', morph_stem = NULL, morph_tense = NULL,
  morph_gender = 'masculine', morph_number = 'singular',
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w7',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 9)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 9)}, 'H1755', 1, 'primary', 'דּ֣וֹר', 7, 'HNcmsa', 'oshb_wlc');
`);

// 10. الْعَاشِرِ (עֲשִׂירִ֔י, w8, H6224)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H6224', orig_word = 'עֲשִׂירִי', orig_surface = 'עֲשִׂירִ֔י', orig_word_position = 8,
  orig_morphology = 'HAomsa', morph_pos = 'numeral', morph_stem = NULL, morph_tense = NULL,
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w8',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 10)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 10)}, 'H6224', 1, 'primary', 'עֲשִׂירִ֔י', 8, 'HAomsa', 'oshb_wlc');
`);

// 11. لاَ (לֹא, w9, H3808)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H3808', orig_word = 'לֹא', orig_surface = 'לֹא', orig_word_position = 9,
  orig_morphology = 'HTn', morph_pos = 'particle', morph_stem = NULL, morph_tense = NULL,
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w9',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 11)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 11)}, 'H3808', 1, 'primary', 'לֹא', 9, 'HTn', 'oshb_wlc');
`);

// 12. يَدْخُلْ (יָ֥בֹא, w10, H935)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H935', orig_word = 'בּוֹא', orig_surface = 'יָ֥בֹא', orig_word_position = 10,
  orig_morphology = 'HVqi3ms', morph_pos = 'verb', morph_stem = 'qal', morph_tense = 'imperfect',
  morph_person = '3', morph_gender = 'masculine', morph_number = 'singular',
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w10',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 12)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 12)}, 'H935', 1, 'primary', 'יָ֥בֹא', 10, 'HVqi3ms', 'oshb_wlc');
`);

// 13. مِنْهُ + 14. أَحَدٌ -> ל֖וֹ (w11, HR/Sp3ms)
sql.push(`
UPDATE word_mappings SET
  strongs_id = NULL, orig_word = 'לְ', orig_surface = 'ל֖וֹ', orig_word_position = 11,
  orig_morphology = 'HR/Sp3ms', morph_pos = 'preposition', morph_stem = NULL, morph_tense = NULL,
  morph_gender = 'masculine', morph_number = 'singular', morph_person = '3',
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w11',
  relation_type = 'compound_phrase'
WHERE id = ${subqueryMappingId(5, 23, 2, 13)};

UPDATE word_mappings SET
  strongs_id = NULL, orig_word = 'לְ', orig_surface = 'ל֖וֹ', orig_word_position = 11,
  orig_morphology = 'HR/Sp3ms', morph_pos = 'pronoun', morph_stem = NULL, morph_tense = NULL,
  orig_word_lang = 'hebrew',
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w11',
  relation_type = 'compound_phrase'
WHERE id = ${subqueryMappingId(5, 23, 2, 14)};
`);

// 15. فِي (preposition prefix בִּ of בִּקְהַ֥ל, w12)
sql.push(`
UPDATE word_mappings SET
  strongs_id = NULL, orig_word = 'בְּ', orig_surface = 'בִּ', orig_word_position = 12,
  orig_morphology = 'HR', morph_pos = 'preposition', morph_stem = NULL, morph_tense = NULL,
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w12',
  relation_type = 'preposition_prefix'
WHERE id = ${subqueryMappingId(5, 23, 2, 15)};
`);

// 16. جَمَاعَةِ (קְהַל of בִּקְהַ֥ל, w12, H6951)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H6951', orig_word = 'קָהָל', orig_surface = 'קְהַ֥ל', orig_word_position = 12,
  orig_morphology = 'HNcmsc', morph_pos = 'noun', morph_stem = NULL, morph_tense = NULL,
  morph_gender = 'masculine', morph_number = 'singular',
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w12',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 16)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 16)}, 'H6951', 1, 'primary', 'קְהַ֥ל', 12, 'HNcmsc', 'oshb_wlc');
`);

// 17. الرَّبِّ (יְהוָֽה׃, w13, H3068)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H3068', orig_word = 'יְהֹוָה', orig_surface = 'יְהוָֽה׃', orig_word_position = 13,
  orig_morphology = 'HNp', morph_pos = 'proper_noun', morph_stem = NULL, morph_tense = NULL,
  morph_source = 'oshb_wlc', verified_source = 'OSHB', verified_locator = 'OSHB:B5.C23.V3.w13',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 17)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 17)}, 'H3068', 1, 'primary', 'יְהוָֽה׃', 13, 'HNp', 'oshb_wlc');
`);

// =============================================================================
// 2. 1 CORINTHIANS 7:7 (21 original Greek tokens)
// =============================================================================

// Clear existing multi-mappings for 1 Cor 7:7
sql.push(`
DELETE FROM word_mapping_strongs 
WHERE mapping_id IN (
  SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7)
);
`);

// 1. لأَنِّي -> γάρ (token 2 in Greek, G1063)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G1063', orig_word = 'γάρ', orig_surface = 'γὰρ', orig_word_position = 2,
  orig_morphology = 'C- --------', morph_pos = 'conjunction',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w2',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 1)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 1)}, 'G1063', 1, 'primary', 'γὰρ', 2, 'C- --------', 'morphgnt_sblgnt');
`);

// 2. أُرِيدُ -> θέλω (token 1 in Greek, G2309)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G2309', orig_word = 'θέλω', orig_surface = 'θέλω', orig_word_position = 1,
  orig_morphology = 'V- 1PAI-S--', morph_pos = 'verb', morph_stem = NULL, morph_tense = 'present',
  morph_voice = 'active', morph_mood = 'indicative', morph_person = '1', morph_number = 'singular',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w1',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 2)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 2)}, 'G2309', 1, 'primary', 'θέλω', 1, 'V- 1PAI-S--', 'morphgnt_sblgnt');
`);

// 8. أَنَا -> ἐμαυτόν (token 8 in Greek, G1683, reflexive pronoun, NOT verb!)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G1683', orig_word = 'ἐμαυτοῦ', orig_surface = 'ἐμαυτόν', orig_word_position = 8,
  orig_morphology = 'RP ----ASM-', morph_pos = 'pronoun',
  morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
  morph_person = '1', morph_number = 'singular', morph_gender = 'masculine', morph_case = 'accusative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w8',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 8)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 8)}, 'G1683', 1, 'primary', 'ἐμαυτόν', 8, 'RP ----ASM-', 'morphgnt_sblgnt');
`);

// 17. الْوَاحِدُ -> ὃς (token 16 in Greek, G3739, relative/demonstrative pronoun, NOT οὕτως verb!)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3739', orig_word = 'ὅς', orig_surface = 'ὃς', orig_word_position = 16,
  orig_morphology = 'R- ----NSM-', morph_pos = 'pronoun',
  morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
  morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'nominative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w16',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 17)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 17)}, 'G3739', 1, 'primary', 'ὃς', 16, 'R- ----NSM-', 'morphgnt_sblgnt');
`);

// 18. هكَذَا -> οὕτως (token 18 in Greek, G3779, adverb D- --------, NOT verb!)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3779', orig_word = 'οὕτως', orig_surface = 'οὕτως', orig_word_position = 18,
  orig_morphology = 'D- --------', morph_pos = 'adverb',
  morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
  morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w18',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 18)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 18)}, 'G3779', 1, 'primary', 'οὕτως', 18, 'D- --------', 'morphgnt_sblgnt');
`);

// 19. وَالآخَرُ -> ὃς (token 19) + δέ (token 20)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3739', orig_word = 'ὅς', orig_surface = 'ὃς', orig_word_position = 19,
  orig_morphology = 'R- ----NSM-', morph_pos = 'pronoun',
  morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
  morph_number = 'singular', morph_gender = 'masculine', morph_case = 'nominative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w19',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 19)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 19)}, 'G3739', 1, 'primary', 'ὃς', 19, 'R- ----NSM-', 'morphgnt_sblgnt');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 19)}, 'G1161', 2, 'secondary', 'δέ', 20, 'C- --------', 'morphgnt_sblgnt');
`);

// 20. هكَذَا -> οὕτως (token 21 in Greek, G3779, adverb D- --------, NOT verb!)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3779', orig_word = 'οὕτως', orig_surface = 'οὕτως', orig_word_position = 21,
  orig_morphology = 'D- --------', morph_pos = 'adverb',
  morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
  morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w21',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 20)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 20)}, 'G3779', 1, 'primary', 'οὕτως', 21, 'D- --------', 'morphgnt_sblgnt');
`);

// Re-populate any remaining word_mapping_strongs for other positions in 1 Cor 7:7
sql.push(`
INSERT OR IGNORE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
SELECT wm.id, wm.strongs_id, 1, 'primary', wm.orig_surface, wm.orig_word_position, wm.orig_morphology, wm.morph_source
FROM word_mappings wm
WHERE wm.verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7)
  AND wm.id NOT IN (SELECT mapping_id FROM word_mapping_strongs)
  AND wm.strongs_id IS NOT NULL AND wm.strongs_id != '';
`);

sql.push('COMMIT;');

fs.writeFileSync(tmpSql, sql.join('\n'), 'utf8');
console.log(`Executing ${sql.length} SQL repair statements...`);
execSync(`"${sqlite}" "${targetDb}" < "${tmpSql}"`, { encoding: 'utf8', shell: 'cmd.exe' });
if (fs.existsSync(tmpSql)) fs.unlinkSync(tmpSql);

console.log('Successfully applied all Deut 23:2 and 1 Cor 7:7 philological repairs!');
