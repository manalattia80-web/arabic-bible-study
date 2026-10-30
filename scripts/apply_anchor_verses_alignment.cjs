const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDb = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const tmpSql = path.resolve(__dirname, 'tmp_apply_anchors.sql');

console.log('=== Applying Verified Philological Alignment to Matthew 14:27 and Genesis 22:16 ===');

const subqueryMappingId = (book, ch, vs, wordPos) => 
  `(SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=${book} AND chapter_num=${ch} AND verse_num=${vs}) AND ar_word_position=${wordPos})`;

let sql = ['BEGIN TRANSACTION;'];

// =========================================================================
// 1. MATTHEW 14:27 (Book 40, Chapter 14, Verse 27)
// =========================================================================
sql.push(`
DELETE FROM word_mapping_strongs 
WHERE mapping_id IN (
  SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=40 AND chapter_num=14 AND verse_num=27)
);
`);

// ar1: فَلِلْوَقْتِ -> εὐθέως (pos 1, G2112) + δὲ (pos 2, G1161)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G2112', orig_word = 'εὐθέως', orig_surface = 'εὐθέως', orig_word_position = 1,
  orig_morphology = 'ADV', morph_pos = 'adverb',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B40.C14.V27.w1',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(40, 14, 27, 1)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 1)}, 'G2112', 1, 'primary', 'εὐθὺς', 1, 'ADV', 'morphgnt_sblgnt');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 1)}, 'G1161', 2, 'conjunction', 'δὲ', 2, 'C- --------', 'morphgnt_sblgnt');
`);

// ar2: كَلَّمَهُمْ -> ἐλάλησεν (pos 3, G2980) + αὐτοῖς (pos 4, G846)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G2980', orig_word = 'λαλέω', orig_surface = 'ἐλάλησεν', orig_word_position = 3,
  orig_morphology = 'V- 3AAI-S--', morph_pos = 'verb',
  morph_stem = NULL, morph_tense = 'aorist', morph_voice = 'active', morph_mood = 'indicative',
  morph_person = '3', morph_number = 'singular',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B40.C14.V27.w3',
  relation_type = 'compound'
WHERE id = ${subqueryMappingId(40, 14, 27, 2)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 2)}, 'G2980', 1, 'verb', 'ἐλάλησεν', 3, 'V- 3AAI-S--', 'morphgnt_sblgnt');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 2)}, 'G846', 2, 'pronoun_object', 'αὐτοῖς', 4, 'RP 3DPM', 'morphgnt_sblgnt');
`);

// ar3: يَسُوعُ -> ὁ (pos 5, G3588) + Ἰησοῦς (pos 6, G2424)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G2424', orig_word = 'Ἰησοῦς', orig_surface = 'Ἰησοῦς', orig_word_position = 6,
  orig_morphology = 'N- -NSM', morph_pos = 'proper_noun',
  morph_gender = 'masculine', morph_number = 'singular', morph_case = 'nominative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B40.C14.V27.w6',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(40, 14, 27, 3)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 3)}, 'G2424', 1, 'primary', 'Ἰησοῦς', 6, 'N- -NSM', 'morphgnt_sblgnt');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 3)}, 'G3588', 2, 'article', 'ὁ', 5, 'RA -NSM', 'morphgnt_sblgnt');
`);

// ar4: قِائِلاً -> λέγων (pos 7, G3004)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3004', orig_word = 'λέγω', orig_surface = 'λέγων', orig_word_position = 7,
  orig_morphology = 'V- -PAPNSM', morph_pos = 'verb',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B40.C14.V27.w7',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(40, 14, 27, 4)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 4)}, 'G3004', 1, 'primary', 'λέγων', 7, 'V- -PAPNSM', 'morphgnt_sblgnt');
`);

// ar5: تَشَجَّعُوا -> Θαρσεῖτε (pos 8, G2293)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G2293', orig_word = 'θαρσέω', orig_surface = 'Θαρσεῖτε', orig_word_position = 8,
  orig_morphology = 'V- 2PAM-P--', morph_pos = 'verb',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B40.C14.V27.w8',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(40, 14, 27, 5)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 5)}, 'G2293', 1, 'primary', 'Θαρσεῖτε', 8, 'V- 2PAM-P--', 'morphgnt_sblgnt');
`);

// ar6: أَنَا -> ἐγώ (pos 9, G1473)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G1473', orig_word = 'ἐγώ', orig_surface = 'ἐγώ', orig_word_position = 9,
  orig_morphology = 'RP 1NS', morph_pos = 'pronoun',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B40.C14.V27.w9',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(40, 14, 27, 6)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 6)}, 'G1473', 1, 'primary', 'ἐγώ', 9, 'RP 1NS', 'morphgnt_sblgnt');
`);

// ar7: هُوَ -> εἰμι (pos 10, G1510)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G1510', orig_word = 'εἰμί', orig_surface = 'εἰμι', orig_word_position = 10,
  orig_morphology = 'V- 1PAI-S--', morph_pos = 'verb',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B40.C14.V27.w10',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(40, 14, 27, 7)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 7)}, 'G1510', 1, 'primary', 'εἰμι', 10, 'V- 1PAI-S--', 'morphgnt_sblgnt');
`);

// ar8: لاَ -> μὴ (pos 11, G3361)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3361', orig_word = 'μή', orig_surface = 'μὴ', orig_word_position = 11,
  orig_morphology = 'D- --------', morph_pos = 'adverb',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B40.C14.V27.w11',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(40, 14, 27, 8)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 8)}, 'G3361', 1, 'primary', 'μὴ', 11, 'D- --------', 'morphgnt_sblgnt');
`);

// ar9: تَخَافُوا -> φοβεῖσθε (pos 12, G5399)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G5399', orig_word = 'φοβέομαι', orig_surface = 'φοβεῖσθε', orig_word_position = 12,
  orig_morphology = 'V- 2PMM-P--', morph_pos = 'verb',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B40.C14.V27.w12',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(40, 14, 27, 9)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(40, 14, 27, 9)}, 'G5399', 1, 'primary', 'φοβεῖσθε', 12, 'V- 2PMM-P--', 'morphgnt_sblgnt');
`);


// =========================================================================
// 2. GENESIS 22:16 (Book 1, Chapter 22, Verse 16)
// =========================================================================
sql.push(`
DELETE FROM word_mapping_strongs 
WHERE mapping_id IN (
  SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=1 AND chapter_num=22 AND verse_num=16)
);
`);

// ar1: وَقَالَ -> וַיֹּ֕אמֶר (pos 1, H559)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H559', orig_word = 'אָמַר', orig_surface = 'וַיֹּ֕אמֶר', orig_word_position = 1,
  orig_morphology = 'HC/Vqw3ms', morph_pos = 'verb',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w1',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 1)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 1)}, 'H559', 1, 'primary', 'וַיֹּ֕אמֶר', 1, 'HC/Vqw3ms', 'oshb_wlc');
`);

// ar2: بِذَاتِي -> בִּ֥י (pos 2, preposition + 1cs suffix, translation note)
sql.push(`
UPDATE word_mappings SET
  strongs_id = NULL, orig_word = 'בְּ', orig_surface = 'בִּ֥י', orig_word_position = 2,
  orig_morphology = 'HR/Sp1cs', morph_pos = 'preposition',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w2',
  relation_type = 'idiomatic',
  grammar_notes = 'اللفظ العبري בִּי مركب من حرف الجر בְּـ وضمير المتكلم י (فيَّ/بي)، واستعماله في سياق القسم «בִּי נִשְׁבַּעְתִּי» معناه الحرفي: بي أقسمت، وتُرجم في العربية «بذاتي أقسمت» لتأكيد القسم الإلهي.'
WHERE id = ${subqueryMappingId(1, 22, 16, 2)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 2)}, '---', 1, 'preposition_suffix', 'בִּ֥י', 2, 'HR/Sp1cs', 'oshb_wlc');
`);

// ar3: أَقْسَمْتُ -> נִשְׁבַּ֖עְתִּי (pos 3, H7650)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H7650', orig_word = 'שָׁבַע', orig_surface = 'נִשְׁבַּ֖עְתִּי', orig_word_position = 3,
  orig_morphology = 'HVNp1cs', morph_pos = 'verb',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w3',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 3)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 3)}, 'H7650', 1, 'primary', 'נִשְׁבַּ֖עְתִּי', 3, 'HVNp1cs', 'oshb_wlc');
`);

// ar4: يَقُولُ -> נְאֻם (pos 4, H5002)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H5002', orig_word = 'נְאֻם', orig_surface = 'נְאֻם', orig_word_position = 4,
  orig_morphology = 'HNcmsc', morph_pos = 'noun',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w4',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 4)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 4)}, 'H5002', 1, 'primary', 'נְאֻם', 4, 'HNcmsc', 'oshb_wlc');
`);

// ar5: الرَّبُّ -> יְהוָ֑ה (pos 5, H3068)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H3068', orig_word = 'יְהֹוָה', orig_surface = 'יְהוָ֑ה', orig_word_position = 5,
  orig_morphology = 'HNp', morph_pos = 'proper_noun',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w5',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 5)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 5)}, 'H3068', 1, 'primary', 'יְהוָ֑ה', 5, 'HNp', 'oshb_wlc');
`);

// ar6: أَنِّي -> כִּ֗י (pos 6, H3588, conjunction)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H3588', orig_word = 'כִּי', orig_surface = 'כִּ֗י', orig_word_position = 6,
  orig_morphology = 'HC', morph_pos = 'conjunction',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w6',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 6)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 6)}, 'H3588', 1, 'primary', 'כִּ֗י', 6, 'HC', 'oshb_wlc');
`);

// ar7: مِنْ -> syntactic addition part of compound phrase 'مِنْ أَجْلِ'
sql.push(`
UPDATE word_mappings SET
  strongs_id = NULL, orig_word = '—', orig_surface = '—', orig_word_position = NULL,
  orig_morphology = NULL, morph_pos = 'syntactic_ar',
  morph_source = 'translation_syntax', verified_source = 'AVD', verified_locator = 'AR_SYNTACTIC:B1.C22.V16.w7',
  relation_type = 'syntactic_ar',
  grammar_notes = 'حرف جر عربي مكمل لتركيب «من أجل» السببي المقابل للأداة العبرية יַעַן.'
WHERE id = ${subqueryMappingId(1, 22, 16, 7)};
`);

// ar8: أَجْلِ -> יַ֚עַן (pos 7, H3282)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H3282', orig_word = 'יַעַן', orig_surface = 'יַ֚עַן', orig_word_position = 7,
  orig_morphology = 'HC', morph_pos = 'conjunction',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w7',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 8)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 8)}, 'H3282', 1, 'primary', 'יַ֚עַן', 7, 'HC', 'oshb_wlc');
`);

// ar9: أَنَّكَ -> אֲשֶׁ֤ר (pos 8, H834)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H834', orig_word = 'אֲשֶׁר', orig_surface = 'אֲשֶׁ֤ר', orig_word_position = 8,
  orig_morphology = 'HTr', morph_pos = 'relative_pronoun',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w8',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 9)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 9)}, 'H834', 1, 'primary', 'אֲשֶׁ֤ר', 8, 'HTr', 'oshb_wlc');
`);

// ar10: فَعَلْتَ -> עָשִׂ֨יתָ֙ (pos 9, H6213)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H6213', orig_word = 'עָשָׂה', orig_surface = 'עָשִׂ֨יתָ֙', orig_word_position = 9,
  orig_morphology = 'HVqp2ms', morph_pos = 'verb',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w9',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 10)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 10)}, 'H6213', 1, 'primary', 'עָשִׂ֨יתָ֙', 9, 'HVqp2ms', 'oshb_wlc');
`);

// ar11: هذَا -> הַזֶּ֔ה (pos 12, H2088)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H2088', orig_word = 'זֶה', orig_surface = 'הַזֶּ֔ה', orig_word_position = 12,
  orig_morphology = 'HTd/Pdxms', morph_pos = 'demonstrative',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w12',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 11)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 11)}, 'H2088', 1, 'primary', 'הַזֶּ֔ה', 12, 'HTd/Pdxms', 'oshb_wlc');
`);

// ar12: الأَمْرَ -> הַדָּבָ֣ר (pos 11, H1697) + אֶת־ (pos 10, H853)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H1697', orig_word = 'דָּבָר', orig_surface = 'הַדָּבָ֣ר', orig_word_position = 11,
  orig_morphology = 'HTd/Ncmsa', morph_pos = 'noun',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w11',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 12)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 12)}, 'H1697', 1, 'noun', 'הַדָּבָ֣ר', 11, 'HTd/Ncmsa', 'oshb_wlc');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 12)}, 'H853', 2, 'direct_object_marker', 'אֶת־', 10, 'HTo', 'oshb_wlc');
`);

// ar13: وَلَمْ -> וְלֹ֥א (pos 13, H3808)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H3808', orig_word = 'לֹא', orig_surface = 'וְלֹ֥א', orig_word_position = 13,
  orig_morphology = 'HC/Tn', morph_pos = 'particle',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w13',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 13)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 13)}, 'H3808', 1, 'primary', 'וְלֹ֥א', 13, 'HC/Tn', 'oshb_wlc');
`);

// ar14: تُمْسِكِ -> חָשַׂ֖כְתָּ (pos 14, H2820)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H2820', orig_word = 'חָשַׂךְ', orig_surface = 'חָשַׂ֖כְתָּ', orig_word_position = 14,
  orig_morphology = 'HVqp2ms', morph_pos = 'verb',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w14',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 14)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 14)}, 'H2820', 1, 'primary', 'חָשַׂ֖כְתָּ', 14, 'HVqp2ms', 'oshb_wlc');
`);

// ar15: ابْنَكَ -> בִּנְךָ֥ (pos 16, H1121) + אֶת־ (pos 15, H853)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H1121', orig_word = 'בֵּן', orig_surface = 'בִּנְךָ֥', orig_word_position = 16,
  orig_morphology = 'HNcmsc/Sp2ms', morph_pos = 'noun',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w16',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 15)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 15)}, 'H1121', 1, 'noun', 'בִּנְךָ֥', 16, 'HNcmsc/Sp2ms', 'oshb_wlc');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 15)}, 'H853', 2, 'direct_object_marker', 'אֶת־', 15, 'HTo', 'oshb_wlc');
`);

// ar16: وَحِيدَكَ -> יְחִידֶֽךָ (pos 18, H3173) + אֶת־ (pos 17, H853)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'H3173', orig_word = 'יָחִיד', orig_surface = 'יְחִידֶֽךָ', orig_word_position = 18,
  orig_morphology = 'HAamsc/Sp2ms', morph_pos = 'adjective',
  morph_source = 'oshb_wlc', verified_source = 'WLC', verified_locator = 'OSHB:B1.C22.V16.w18',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(1, 22, 16, 16)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 16)}, 'H3173', 1, 'adjective', 'יְחִידֶֽךָ', 18, 'HAamsc/Sp2ms', 'oshb_wlc');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(1, 22, 16, 16)}, 'H853', 2, 'direct_object_marker', 'אֶת־', 17, 'HTo', 'oshb_wlc');
`);

sql.push('COMMIT;');

fs.writeFileSync(tmpSql, sql.join('\n'), 'utf8');
console.log('Executing SQL transaction...');
execSync(`"${sqlite}" "${targetDb}" < "${tmpSql}"`, { maxBuffer: 50 * 1024 * 1024 });
fs.unlinkSync(tmpSql);
console.log('Successfully applied verified alignment to Matthew 14:27 and Genesis 22:16!');
