const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDb = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const tmpSql = path.resolve(__dirname, 'tmp_apply_1cor7_pure_sblgnt.sql');

console.log('=== Applying Pure SBLGNT Alignment for 1 Cor 7:7 ===');

const subqueryMappingId = (book, ch, vs, wordPos) => 
  `(SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=${book} AND chapter_num=${ch} AND verse_num=${vs}) AND ar_word_position=${wordPos})`;

let sql = [];
sql.push('BEGIN TRANSACTION;');

// Clear existing multi-mappings for 1 Cor 7:7
sql.push(`
DELETE FROM word_mapping_strongs 
WHERE mapping_id IN (
  SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=46 AND chapter_num=7 AND verse_num=7)
);
`);

// 1. لأَنِّي -> δὲ (token 2 in SBLGNT, G1161, C- --------)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G1161', orig_word = 'δέ', orig_surface = 'δὲ', orig_word_position = 2,
  orig_morphology = 'C- --------', morph_pos = 'conjunction',
  morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
  morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w2',
  relation_type = 'primary',
  grammar_notes = 'تنبيه لاختلاف القراءة المصدرية: النص العربي للترجمة البستانية-فاندايك يتبع قراءة النص المتلقى (Textus Receptus) التي تقرأ حرف التعليل γάρ («لأن»)، بينما طبعة SBLGNT النقدية المعتمدة هنا تسجل δὲ (حرف عطف/استدراك: «ولكن/وأما»). الربط الموضعي يطابق الكلمة في موضعها بطبعة SBLGNT.'
WHERE id = ${subqueryMappingId(46, 7, 7, 1)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 1)}, 'G1161', 1, 'primary', 'δὲ', 2, 'C- --------', 'morphgnt_sblgnt');
`);

// 2. أُرِيدُ -> θέλω (token 1 in SBLGNT, G2309, V- 1PAI-S--)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G2309', orig_word = 'θέλω', orig_surface = 'θέλω', orig_word_position = 1,
  orig_morphology = 'V- 1PAI-S--', morph_pos = 'verb',
  morph_stem = NULL, morph_tense = 'present', morph_voice = 'active', morph_mood = 'indicative',
  morph_person = '1', morph_number = 'singular', morph_gender = NULL, morph_case = NULL,
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w1',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 2)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 2)}, 'G2309', 1, 'primary', 'θέλω', 1, 'V- 1PAI-S--', 'morphgnt_sblgnt');
`);

// 3. أَنْ -> compound with εἶναι (token 5)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G1510', orig_word = 'εἰμί', orig_surface = 'εἶναι', orig_word_position = 5,
  orig_morphology = 'V- -PAN----', morph_pos = 'verb',
  morph_stem = NULL, morph_tense = 'present', morph_voice = 'active', morph_mood = 'infinitive',
  morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w5',
  relation_type = 'compound_translation'
WHERE id = ${subqueryMappingId(46, 7, 7, 3)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 3)}, 'G1510', 1, 'primary', 'εἶναι', 5, 'V- -PAN----', 'morphgnt_sblgnt');
`);

// 4. يَكُونَ -> εἶναι (token 5 in SBLGNT, G1510, V- -PAN----)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G1510', orig_word = 'εἰμί', orig_surface = 'εἶναι', orig_word_position = 5,
  orig_morphology = 'V- -PAN----', morph_pos = 'verb',
  morph_stem = NULL, morph_tense = 'present', morph_voice = 'active', morph_mood = 'infinitive',
  morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w5',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 4)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 4)}, 'G1510', 1, 'primary', 'εἶναι', 5, 'V- -PAN----', 'morphgnt_sblgnt');
`);

// 5. جَمِيعُ -> πάντας (token 3 in SBLGNT, G3956, A- ----APM-)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3956', orig_word = 'πᾶς', orig_surface = 'πάντας', orig_word_position = 3,
  orig_morphology = 'A- ----APM-', morph_pos = 'adjective',
  morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
  morph_person = NULL, morph_number = 'plural', morph_gender = 'masculine', morph_case = 'accusative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w3',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 5)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 5)}, 'G3956', 1, 'primary', 'πάντας', 3, 'A- ----APM-', 'morphgnt_sblgnt');
`);

// 6. النَّاسِ -> ἀνθρώπους (token 4 in SBLGNT, G444, N- ----APM-)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G444', orig_word = 'ἄνθρωπος', orig_surface = 'ἀνθρώπους', orig_word_position = 4,
  orig_morphology = 'N- ----APM-', morph_pos = 'noun',
  morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
  morph_person = NULL, morph_number = 'plural', morph_gender = 'masculine', morph_case = 'accusative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w4',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 6)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 6)}, 'G444', 1, 'primary', 'ἀνθρώπους', 4, 'N- ----APM-', 'morphgnt_sblgnt');
`);

// 7. كَمَا -> ὡς (token 6 in SBLGNT, G5613) + καὶ (token 7 in SBLGNT, G2532)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G5613', orig_word = 'ὡς', orig_surface = 'ὡς', orig_word_position = 6,
  orig_morphology = 'C- --------', morph_pos = 'conjunction',
  morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
  morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w6-w7',
  relation_type = 'compound_phrase',
  grammar_notes = 'العبارة اليونانية الأصلية هي ὡς καὶ (الموضعان 6 و7: كما أيضاً / كـ)، واكتفت الصياغة العربية بـ «كَمَا» مؤدية المعنى التركيبي.'
WHERE id = ${subqueryMappingId(46, 7, 7, 7)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 7)}, 'G5613', 1, 'primary', 'ὡς', 6, 'C- --------', 'morphgnt_sblgnt');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 7)}, 'G2532', 2, 'secondary', 'καὶ', 7, 'D- --------', 'morphgnt_sblgnt');
`);

// 8. أَنَا -> ἐμαυτόν (token 8 in SBLGNT, G1683, RP ----ASM-)
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

// 9. لكِنَّ -> ἀλλὰ (token 9 in SBLGNT, G235, C- --------)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G235', orig_word = 'ἀλλά', orig_surface = 'ἀλλὰ', orig_word_position = 9,
  orig_morphology = 'C- --------', morph_pos = 'conjunction',
  morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w9',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 9)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 9)}, 'G235', 1, 'primary', 'ἀλλὰ', 9, 'C- --------', 'morphgnt_sblgnt');
`);

// 10. كُلَّ + 11. وَاحِدٍ -> ἕκαστος (token 10 in SBLGNT, G1538, A- ----NSM-)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G1538', orig_word = 'ἕκαστος', orig_surface = 'ἕκαστος', orig_word_position = 10,
  orig_morphology = 'A- ----NSM-', morph_pos = 'adjective',
  morph_number = 'singular', morph_gender = 'masculine', morph_case = 'nominative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w10',
  relation_type = 'compound_phrase'
WHERE id = ${subqueryMappingId(46, 7, 7, 10)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 10)}, 'G1538', 1, 'primary', 'ἕκαστος', 10, 'A- ----NSM-', 'morphgnt_sblgnt');

UPDATE word_mappings SET
  strongs_id = 'G1538', orig_word = 'ἕκαστος', orig_surface = 'ἕκαστος', orig_word_position = 10,
  orig_morphology = 'A- ----NSM-', morph_pos = 'adjective',
  morph_number = 'singular', morph_gender = 'masculine', morph_case = 'nominative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w10',
  relation_type = 'compound_phrase'
WHERE id = ${subqueryMappingId(46, 7, 7, 11)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 11)}, 'G1538', 1, 'primary', 'ἕκαστος', 10, 'A- ----NSM-', 'morphgnt_sblgnt');
`);

// 12. لَهُ -> ἔχει (token 12 in SBLGNT, G2192, V- 3PAI-S--)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G2192', orig_word = 'ἔχω', orig_surface = 'ἔχει', orig_word_position = 12,
  orig_morphology = 'V- 3PAI-S--', morph_pos = 'verb',
  morph_tense = 'present', morph_voice = 'active', morph_mood = 'indicative',
  morph_person = '3', morph_number = 'singular',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w12',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 12)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 12)}, 'G2192', 1, 'primary', 'ἔχει', 12, 'V- 3PAI-S--', 'morphgnt_sblgnt');
`);

// 13. مَوْهِبَتُهُ -> χάρισμα (token 13 in SBLGNT, G5486, N- ----ASN-)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G5486', orig_word = 'χάρισμα', orig_surface = 'χάρισμα', orig_word_position = 13,
  orig_morphology = 'N- ----ASN-', morph_pos = 'noun',
  morph_number = 'singular', morph_gender = 'neuter', morph_case = 'accusative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w13',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 13)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 13)}, 'G5486', 1, 'primary', 'χάρισμα', 13, 'N- ----ASN-', 'morphgnt_sblgnt');
`);

// 14. الْخَاصَّةُ -> ἴδιον (token 11 in SBLGNT, G2398, A- ----ASN-)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G2398', orig_word = 'ἴδιος', orig_surface = 'ἴδιον', orig_word_position = 11,
  orig_morphology = 'A- ----ASN-', morph_pos = 'adjective',
  morph_number = 'singular', morph_gender = 'neuter', morph_case = 'accusative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w11',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 14)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 14)}, 'G2398', 1, 'primary', 'ἴδιον', 11, 'A- ----ASN-', 'morphgnt_sblgnt');
`);

// 15. مِنَ -> ἐκ (token 14 in SBLGNT, G1537, P- --------)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G1537', orig_word = 'ἐκ', orig_surface = 'ἐκ', orig_word_position = 14,
  orig_morphology = 'P- --------', morph_pos = 'preposition',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w14',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 15)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 15)}, 'G1537', 1, 'primary', 'ἐκ', 14, 'P- --------', 'morphgnt_sblgnt');
`);

// 16. اللهِ -> θεοῦ (token 15 in SBLGNT, G2316, N- ----GSM-)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G2316', orig_word = 'θεός', orig_surface = 'θεοῦ', orig_word_position = 15,
  orig_morphology = 'N- ----GSM-', morph_pos = 'noun',
  morph_number = 'singular', morph_gender = 'masculine', morph_case = 'genitive',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w15',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 16)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 16)}, 'G2316', 1, 'primary', 'θεοῦ', 15, 'N- ----GSM-', 'morphgnt_sblgnt');
`);

// 17. الْوَاحِدُ -> ὁ (token 16 in SBLGNT, G3588) + μὲν (token 17 in SBLGNT, G3303)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3588', orig_word = 'ὁ', orig_surface = 'ὁ', orig_word_position = 16,
  orig_morphology = 'RA ----NSM-', morph_pos = 'article',
  morph_number = 'singular', morph_gender = 'masculine', morph_case = 'nominative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w16-w17',
  relation_type = 'compound_phrase',
  grammar_notes = 'التركيب اليوناني هو ὁ μὲν (الموضعان 16 و17)، حيث μὲν أداة مقابلة تقابلها δὲ اللاحقة في ὁ δὲ. ترجمت البستانية-فاندايك قراءة النص المتلقى ὃς μὲν بـ «الْوَاحِدُ».'
WHERE id = ${subqueryMappingId(46, 7, 7, 17)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 17)}, 'G3588', 1, 'primary', 'ὁ', 16, 'RA ----NSM-', 'morphgnt_sblgnt');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 17)}, 'G3303', 2, 'secondary', 'μὲν', 17, 'C- --------', 'morphgnt_sblgnt');
`);

// 18. هكَذَا -> οὕτως (token 18 in SBLGNT, G3779, D- --------)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3779', orig_word = 'οὕτως', orig_surface = 'οὕτως', orig_word_position = 18,
  orig_morphology = 'D- --------', morph_pos = 'adverb',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w18',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 18)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 18)}, 'G3779', 1, 'primary', 'οὕτως', 18, 'D- --------', 'morphgnt_sblgnt');
`);

// 19. وَالآخَرُ -> ὁ (token 19 in SBLGNT, G3588, RA ----NSM-) with secondary δὲ (token 20)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3588', orig_word = 'ὁ', orig_surface = 'ὁ', orig_word_position = 19,
  orig_morphology = 'RA ----NSM-', morph_pos = 'article',
  morph_number = 'singular', morph_gender = 'masculine', morph_case = 'nominative',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w19-w20',
  relation_type = 'compound_phrase',
  grammar_notes = 'التركيب اليوناني هو ὁ δὲ (الموضعان 19 و20)، حيث تقابل أداة العطف/المقابلة δὲ أداة μὲν السابقة. ترجمت البستانية-فاندايك قراءة النص المتلقى ὃς δὲ بـ «وَالآخَرُ».'
WHERE id = ${subqueryMappingId(46, 7, 7, 19)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 19)}, 'G3588', 1, 'primary', 'ὁ', 19, 'RA ----NSM-', 'morphgnt_sblgnt');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 19)}, 'G1161', 2, 'secondary', 'δὲ', 20, 'C- --------', 'morphgnt_sblgnt');
`);

// 20. هكَذَا -> οὕτως (token 21 in SBLGNT, G3779, D- --------)
sql.push(`
UPDATE word_mappings SET
  strongs_id = 'G3779', orig_word = 'οὕτως', orig_surface = 'οὕτως', orig_word_position = 21,
  orig_morphology = 'D- --------', morph_pos = 'adverb',
  morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT', verified_locator = 'SBLGNT:B46.C7.V7.w21',
  relation_type = 'primary'
WHERE id = ${subqueryMappingId(46, 7, 7, 20)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(46, 7, 7, 20)}, 'G3779', 1, 'primary', 'οὕτως', 21, 'D- --------', 'morphgnt_sblgnt');
`);

sql.push('COMMIT;');

fs.writeFileSync(tmpSql, sql.join('\n'), 'utf8');
execSync(`"${sqlite}" "${targetDb}" < "${tmpSql}"`, { encoding: 'utf8', shell: 'cmd.exe' });
if (fs.existsSync(tmpSql)) fs.unlinkSync(tmpSql);

console.log('Successfully applied pure SBLGNT alignment for 1 Cor 7:7!');
