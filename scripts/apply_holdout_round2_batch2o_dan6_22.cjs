/**
 * scripts/apply_holdout_round2_batch2o_dan6_22.cjs
 *
 * Full verse calibration for Daniel 6:22 (Batch 2O) across all 19 Arabic records
 * and all 22 Aramaic OSHB tokens in Dan.6.23 (w1..w22).
 *
 * Note on Versification:
 *   Hebrew/Aramaic Masoretic Text / OSHB / WLC has this verse at Dan.6.23 (offset +1 vs Arabic/KJV Dan 6:22).
 *   Locators strictly reference OSHB:B27.C6.V23.w{index} and AR_SYNTACTIC:B27.C6.V22.w15.
 *
 * Resolves:
 *   1. Corrects wrong Strong's IDs in legacy database:
 *      - pos 5 «أَفْوَاهَ»: H6413 -> H6433 (פֻּם, ANcmsc, construct)
 *      - pos 16 «الْمَلِكُ»: H4399 -> H4430 (מַלְכָּא / מֶלֶךְ, ANcmsd/Td, determined)
 *      - pos 19 «ذَنْبًا»: H2269 -> H2248 (חֲבוּلָה, ANcfsa, absolute)
 *   2. Resolves and documents the Ketiv/Qere variation at w17/w18 for pos 13 «وَقُدَّامَكَ»:
 *      - Qere reading: w18 קָֽדָמָךְ֙ (H6925, AR/Sp2ms)
 *      - Ketiv written: w17 קדמיך (H6925, AR/Sp2ms)
 *      - Conjunction: w16 וְ (H9002, AC)
 *   3. Calibrates compound causal conjunction at pos 9 «لأَنِّي»:
 *      - Primary: w10 קֳבֵ֗ל (H6903, AC)
 *      - Secondary: w9 כָּל (H3606, AC/C)
 *      - Secondary: w11 דִּ֤י (H1768, AC)
 *   4. Calibrates passive verbal clause at pos 10 «وُجِدْتُ»:
 *      - Primary: w14 הִשְׁתְּכַ֣חַת (H7912, AVup3fs, hithpeel qatal 3fs passive)
 *      - Secondary: w15 לִ֔י (H9005, AR/Sp1cs)
 *   5. Restores exact 1:1 and compound alignments across the verse:
 *      - pos 1 «إِلهِي» -> w1 אֱלָהִ֞י (H426, ANcmsc/Sp1cs)
 *      - pos 2 «أَرْسَلَ» -> w2 שְׁלַ֣ח (H7972, AVqp3ms)
 *      - pos 3 «مَلاَكَهُ» -> w3 מַלְאֲכֵ֗הּ (H4398, ANcmsc/Sp3ms)
 *      - pos 4 «وَسَدَّ» -> w4 וּֽסֲגַ֛ר (H5463, AC/Vqp3ms; secondary H9002 וּֽ)
 *      - pos 5 «أَفْوَاهَ» -> w5 פֻּ֥ם (H6433, ANcmsc)
 *      - pos 6 «الأُسُودِ» -> w6 אַרְיָوָתָ֖א (H744, ANcmpd/Td)
 *      - pos 7 «فَلَمْ» -> w7 וְלָ֣ا (H3809, AC/Tn; secondary H9002 וְ)
 *      - pos 8 «تَضُرَّنِي،» -> w8 חַבְּל֑וּנִי (H2255, AVpp3mp/Sp1cs)
 *      - pos 9 «لأَنِّي» -> w10 קֳבֵ֗ל (H6903; secondary w9 H3606 + w11 H1768)
 *      - pos 10 «وُجِدْتُ» -> w14 הִשְׁתְּכַ֣חַת (H7912; secondary w15 H9005)
 *      - pos 11 «بَرِيئًا» -> w13 זָכוּ֙ (H2136, ANcfsa)
 *      - pos 12 «قُدَّامَهُ،» -> w12 קָֽדָמ֨וֹהִי֙ (H6925, AR/Sp3ms)
 *      - pos 13 «وَقُدَّامَكَ» -> w18 קָֽדָמָךְ֙ (H6925; secondary w16 H9002)
 *      - pos 14 «أَيْضًا» -> w16 וְאַ֤ף (H638, AC/Ta)
 *      - pos 15 «أَيُّهَا» -> AR_SYNTACTIC:B27.C6.V22.w15 (syntactic vocative particle)
 *      - pos 16 «الْمَلِكُ،» -> w19 מַלְכָּ֔א (H4430, ANcmsd/Td)
 *      - pos 17 «لَمْ» -> w21 לָ֥א (H3809, ATn)
 *      - pos 18 «أَفْعَلْ» -> w22 עַבְדֵֽת (H5648, AVqp1cs)
 *      - pos 19 «ذَنْبًا» -> w20 חֲבוּלָ֖ה (H2248, ANcfsa)
 *   6. Populates exact nominal states (construct/absolute/determined) and verbal/pronominal derivations.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const dbPath = process.env.AUDIT_DB_PATH || path.join(repoRoot, 'mobile/assets/bible_study.db');
const isWin = process.platform === 'win32';
const sqlite = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

function q(sql, targetDb = dbPath) {
  return execFileSync(sqlite, [targetDb], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

console.log('--- APPLYING DANIEL 6:22 CALIBRATION (BATCH 2O) ---');

const vId = q(`SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 6 AND verse_num = 22;`);
if (!vId) throw new Error('Verse Daniel 6:22 not found in database!');
console.log('Verse ID:', vId);

// 1. pos 1: «إِلهِي» -> w1 אֱלָהִ֞י (H426, ANcmsc/Sp1cs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H426',
    orig_surface = 'אֱלָהִ֞י',
    orig_word = 'אֱלָהּ',
    orig_word_position = 1,
    orig_morphology = 'ANcmsc/Sp1cs',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = '1',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'construct',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w1',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 1;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 1);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 1), 'H426', 1, 'primary', 'אֱלָהִ֞י', 1, 'ANcmsc/Sp1cs', 'oshb_wlc');
`);

// 2. pos 2: «أَرْسَلَ» -> w2 שְׁלַ֣ח (H7972, AVqp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H7972',
    orig_surface = 'שְׁלַ֣ח',
    orig_word = 'שְׁלַח',
    orig_word_position = 2,
    orig_morphology = 'AVqp3ms',
    morph_pos = 'verb',
    morph_stem = 'peal',
    morph_tense = 'qatal',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w2',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 2;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 2);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 2), 'H7972', 1, 'primary', 'שְׁלַ֣ח', 2, 'AVqp3ms', 'oshb_wlc');
`);

// 3. pos 3: «مَلاَكَهُ» -> w3 מַלְאֲכֵ֗הּ (H4398, ANcmsc/Sp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H4398',
    orig_surface = 'מַלְאֲכֵ֗הּ',
    orig_word = 'מַלְאַךְ',
    orig_word_position = 3,
    orig_morphology = 'ANcmsc/Sp3ms',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'construct',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w3',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 3;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 3);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 3), 'H4398', 1, 'primary', 'מַלְאֲכֵ֗הּ', 3, 'ANcmsc/Sp3ms', 'oshb_wlc');
`);

// 4. pos 4: «وَسَدَّ» -> w4 וּֽסֲגַ֛ר (H5463, AC/Vqp3ms) + secondary H9002 וּֽ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5463',
    orig_surface = 'וּֽסֲגַ֛ר',
    orig_word = 'סְגַר',
    orig_word_position = 4,
    orig_morphology = 'AC/Vqp3ms',
    morph_pos = 'verb',
    morph_stem = 'peal',
    morph_tense = 'qatal',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w4',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 4;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 4);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 4), 'H5463', 1, 'primary', 'וּֽסֲגַ֛ר', 4, 'AC/Vqp3ms', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 4), 'H9002', 2, 'secondary', 'וּֽ', 4, 'AC', 'oshb_wlc');
`);

// 5. pos 5: «أَفْوَاهَ» -> w5 פֻּ֥ם (H6433, ANcmsc)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H6433',
    orig_surface = 'פֻּ֥ם',
    orig_word = 'פֻּם',
    orig_word_position = 5,
    orig_morphology = 'ANcmsc',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'construct',
    relation_type = 'primary',
    grammar_notes = 'اللفظ الآرامي פֻּם مفرد مضاف في الأصل، وتُرجم بالعربية جمعًا «أَفْوَاهَ» لمناسبة المضاف إليه الجمع «الأُسُودِ».',
    verified_locator = 'OSHB:B27.C6.V23.w5',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 5;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 5);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 5), 'H6433', 1, 'primary', 'פֻּ֥ם', 5, 'ANcmsc', 'oshb_wlc');
`);

// 6. pos 6: «الأُسُودِ» -> w6 אַרְיָוָתָ֖א (H744, ANcmpd/Td)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H744',
    orig_surface = 'אַרְיָוָתָ֖א',
    orig_word = 'אַרְיֵה',
    orig_word_position = 6,
    orig_morphology = 'ANcmpd/Td',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = 'determined',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w6',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 6;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 6);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 6), 'H744', 1, 'primary', 'אַרְיָוָתָ֖א', 6, 'ANcmpd/Td', 'oshb_wlc');
`);

// 7. pos 7: «فَلَمْ» -> w7 וְלָ֣א (H3809, AC/Tn) + secondary H9002 וְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3809',
    orig_surface = 'וְלָ֣א',
    orig_word = 'לָא',
    orig_word_position = 7,
    orig_morphology = 'AC/Tn',
    morph_pos = 'particle',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = NULL,
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w7',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 7;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7), 'H3809', 1, 'primary', 'וְלָ֣א', 7, 'AC/Tn', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7), 'H9002', 2, 'secondary', 'וְ', 7, 'AC', 'oshb_wlc');
`);

// 8. pos 8: «تَضُرَّنِي،» -> w8 חַבְּל֑וּנִי (H2255, AVpp3mp/Sp1cs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H2255',
    orig_surface = 'חַבְּל֑וּנִי',
    orig_word = 'חֲבַל',
    orig_word_position = 8,
    orig_morphology = 'AVpp3mp/Sp1cs',
    morph_pos = 'verb',
    morph_stem = 'pael',
    morph_tense = 'qatal',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = 'فعل ماضٍ في وزن البعل (pael qatal 3mp) الآرامي مع ضمير متصل مفعول به للمتكلم (1cs).',
    verified_locator = 'OSHB:B27.C6.V23.w8',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 8;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8), 'H2255', 1, 'primary', 'חַבְּל֑וּנִי', 8, 'AVpp3mp/Sp1cs', 'oshb_wlc');
`);

// 9. pos 9: «لأَنِّي» -> w10 קֳבֵ֗ל (H6903, AC) + secondary w9 כָּל (H3606, AC/C) + secondary w11 דִּ֤י (H1768, AC)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H6903',
    orig_surface = 'קֳבֵ֗ל',
    orig_word = 'קְבֵל',
    orig_word_position = 10,
    orig_morphology = 'AC',
    morph_pos = 'conjunction',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = NULL,
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = 'مركب حرفي آرامي כָּל־קֳבֵל דִּי (w9-w11) يفيد التعليل («لأَنَّ»)، وتضمن ضمير المتكلم في «لأَنِّي» إشارة للمستفيد الآرامي לִי (w15).',
    verified_locator = 'OSHB:B27.C6.V23.w10',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 9;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9), 'H6903', 1, 'primary', 'קֳבֵ֗ל', 10, 'AC', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9), 'H3606', 2, 'secondary', 'כָּל', 9, 'AC/C', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9), 'H1768', 3, 'secondary', 'דִּ֤י', 11, 'AC', 'oshb_wlc');
`);

// 10. pos 10: «وُجِدْتُ» -> w14 הִשְׁתְּכַ֣חַת (H7912, AVup3fs) + secondary w15 לִ֔י (H9005, AR/Sp1cs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H7912',
    orig_surface = 'הִשְׁתְּכַ֣חַת',
    orig_word = 'שְׁכַח',
    orig_word_position = 14,
    orig_morphology = 'AVup3fs',
    morph_pos = 'verb',
    morph_stem = 'hithpeel',
    morph_tense = 'qatal',
    morph_voice = 'passive',
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'feminine',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = 'فعل ماضٍ مبني للمجهول في صيغة الإثفعل/الهثفعل (hithpeel qatal 3fs) الآرامية مسند تأنيثًا إلى «זָכוּ» (البراءة)، ومقترن بـ «לִי» (w15) ليُترجم في العربية بضمير المتكلم «وُجِدْتُ».',
    verified_locator = 'OSHB:B27.C6.V23.w14',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 10;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10), 'H7912', 1, 'primary', 'הִשְׁתְּכַ֣חַת', 14, 'AVup3fs', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10), 'H9005', 2, 'secondary', 'לִ֔י', 15, 'AR/Sp1cs', 'oshb_wlc');
`);

// 11. pos 11: «بَرِيئًا» -> w13 זָכוּ֙ (H2136, ANcfsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H2136',
    orig_surface = 'זָכוּ֙',
    orig_word = 'זָכוּ',
    orig_word_position = 13,
    orig_morphology = 'ANcfsa',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'feminine',
    morph_number = 'singular',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = 'اسم آرامي مؤنث مفرد مطلق يفيد البراءة والنقاء، ورد موقعيًا كفاعل لـ «הִשְׁתְּכַחַת» وتُرجم بالعربية حالاً منصوبة «بَرِيئًا».',
    verified_locator = 'OSHB:B27.C6.V23.w13',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 11;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11), 'H2136', 1, 'primary', 'זָכוּ֙', 13, 'ANcfsa', 'oshb_wlc');
`);

// 12. pos 12: «قُدَّامَهُ،» -> w12 קָֽדָמ֨וֹהִי֙ (H6925, AR/Sp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H6925',
    orig_surface = 'קָֽדָמ֨וֹהִי֙',
    orig_word = 'קֳדָם',
    orig_word_position = 12,
    orig_morphology = 'AR/Sp3ms',
    morph_pos = 'preposition',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w12',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 12;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 12);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 12), 'H6925', 1, 'primary', 'קָֽדָמ֨וֹהִי֙', 12, 'AR/Sp3ms', 'oshb_wlc');
`);

// 13. pos 13: «وَقُدَّامَكَ» -> w18 קָֽדָמָךְ֙ (H6925, AR/Sp2ms) + secondary w16 וְ (H9002, AC)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H6925',
    orig_surface = 'קָֽדָמָךְ֙',
    orig_word = 'קֳדָם',
    orig_word_position = 18,
    orig_morphology = 'AR/Sp2ms',
    morph_pos = 'preposition',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = '2',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = 'موضع قراءة (قري Qere: «קָֽדָמָךְ֙» عند w18) مقابل المكتوب (كتيب Ketiv: «קדמיך» عند w17) للفظ H6925 مع واو العطف (w16) وكاف المخاطب (Sp2ms).',
    verified_locator = 'OSHB:B27.C6.V23.w18',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 13;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13), 'H6925', 1, 'primary', 'קָֽדָמָךְ֙', 18, 'AR/Sp2ms', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13), 'H9002', 2, 'secondary', 'וְ', 16, 'AC', 'oshb_wlc');
`);

// 14. pos 14: «أَيْضًا» -> w16 וְאַ֤ף (H638, AC/Ta)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H638',
    orig_surface = 'וְאַ֤ף',
    orig_word = 'אַף',
    orig_word_position = 16,
    orig_morphology = 'AC/Ta',
    morph_pos = 'particle',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = NULL,
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w16',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 14;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 14);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 14), 'H638', 1, 'primary', 'וְאַ֤ף', 16, 'AC/Ta', 'oshb_wlc');
`);

// 15. pos 15: «أَيُّهَا» -> AR_SYNTACTIC:B27.C6.V22.w15
q(`
  UPDATE word_mappings SET
    strongs_id = NULL,
    orig_surface = '—',
    orig_word = '—',
    orig_word_position = NULL,
    orig_morphology = NULL,
    morph_pos = 'syntactic_ar',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = NULL,
    morph_case = NULL,
    relation_type = 'vocative_particle',
    grammar_notes = 'أداة نداء وتنبيه في التركيب العربي للنداء المعرف بالألف واللام («أَيُّهَا الْمَلِكُ»).',
    verified_locator = 'AR_SYNTACTIC:B27.C6.V22.w15',
    verified_source = 'syntactic_ar',
    morph_source = 'syntactic_ar',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 15;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15);
`);

// 16. pos 16: «الْمَلِكُ،» -> w19 מַלְכָּ֔א (H4430, ANcmsd/Td)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H4430',
    orig_surface = 'מַלְכָּ֔א',
    orig_word = 'מֶלֶךְ',
    orig_word_position = 19,
    orig_morphology = 'ANcmsd/Td',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'determined',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w19',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 16;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 16);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 16), 'H4430', 1, 'primary', 'מַלְכָּ֔א', 19, 'ANcmsd/Td', 'oshb_wlc');
`);

// 17. pos 17: «لَمْ» -> w21 לָ֥א (H3809, ATn)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3809',
    orig_surface = 'לָ֥א',
    orig_word = 'לָא',
    orig_word_position = 21,
    orig_morphology = 'ATn',
    morph_pos = 'particle',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = NULL,
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w21',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 17;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 17);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 17), 'H3809', 1, 'primary', 'לָ֥א', 21, 'ATn', 'oshb_wlc');
`);

// 18. pos 18: «أَفْعَلْ» -> w22 עַבְדֵֽת (H5648, AVqp1cs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5648',
    orig_surface = 'עַבְדֵֽת',
    orig_word = 'עֲבַד',
    orig_word_position = 22,
    orig_morphology = 'AVqp1cs',
    morph_pos = 'verb',
    morph_stem = 'peal',
    morph_tense = 'qatal',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '1',
    morph_gender = 'common',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w22',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 18;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 18);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 18), 'H5648', 1, 'primary', 'עַבְדֵֽת', 22, 'AVqp1cs', 'oshb_wlc');
`);

// 19. pos 19: «ذَنْبًا» -> w20 חֲבוּלָ֖ה (H2248, ANcfsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H2248',
    orig_surface = 'חֲבוּלָ֖ה',
    orig_word = 'חֲבוּלָה',
    orig_word_position = 20,
    orig_morphology = 'ANcfsa',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'feminine',
    morph_number = 'singular',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B27.C6.V23.w20',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 19;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 19);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 19), 'H2248', 1, 'primary', 'חֲבוּלָ֖ה', 20, 'ANcfsa', 'oshb_wlc');
`);

console.log('Successfully calibrated all 19 Arabic records for Daniel 6:22 (Batch 2O).');
