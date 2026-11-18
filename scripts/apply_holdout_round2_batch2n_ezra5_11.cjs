/**
 * scripts/apply_holdout_round2_batch2n_ezra5_11.cjs
 *
 * Full verse calibration for Ezra 5:11 (Batch 2N) across all 25 Arabic records
 * and all 25 Aramaic OSHB tokens (w1..w25).
 *
 * Resolves:
 *   1. Historical alignment displacement caused by initial false mapping of «هذَا» (pos 2) to H1836.
 *   2. Accurately links pos 1 «وَبِمِثْلِ» and pos 2 «هذَا» as a documented compound unit
 *      translating Aramaic וּכְנֵמָא (w1, H3660 + secondary H9002 וּ).
 *   3. Restores exact 1:1 and compound alignments across the verse:
 *      - pos 3 «الْجَوَابِ» -> w2 פִתְגָמָ֖א (H6600, noun determined)
 *      - pos 4 «جَاوَبُوا» -> w3 הֲתִיב֣וּנָא (H8421, haphel qatal 3mp + Sp1cp)
 *      - pos 5 «قَائِلِينَ:» -> w4 לְמֵמַ֑ר (H560, peal infinitive construct + secondary H9005 לְ)
 *      - pos 6 «نَحْنُ» -> w5 אֲנַ֣חְנָא (H586, personal pronoun 1cp) + secondary w6 הִמֹּ֡ו (H1994, particle)
 *      - pos 7 «عَبِيدُ» -> w7 עַבְדוֹהִי֩ (H5649, noun construct + Sp3ms)
 *      - pos 8 «إِلهِ» -> w9 אֱלָ֨הּ (H426, noun construct) + secondary w8 דִֽי (H1768, particle)
 *      - pos 9 «السَّمَاءِ» -> w10 שְׁמַיָּ֜א (H8065, noun determined)
 *      - pos 10 «وَالأَرْضِ،» -> w11 וְאַרְעָ֗א (H772, noun determined + secondary H9002 וְ)
 *      - pos 11 «وَنَبْنِي» -> w12 וּבָנַ֤יִן (H1124, peal active participle absolute + secondary H9002 וּ)
 *      - pos 12 «هذَا» -> AR_SYNTACTIC:B15.C5.V11.w12 (syntactic demonstrative pointing to determined בַּיְתָא)
 *      - pos 13 «الْبَيْتَ» -> w13 בַּיְתָא֙ (H1005, noun determined)
 *      - pos 14 «الَّذِي» -> w14 דִּֽי (H1768, relative particle)
 *      - pos 15 «بُنِيَ» -> w16 בְנֵ֜ה (H1124, peil passive participle absolute) + secondary auxiliary w15 הֲוָ֨א (H1934, peal qatal 3ms)
 *      - pos 16 «قَبْلَ» -> w17 מִקַּדְמַ֤ת (H6928, noun construct + secondary H4481 מִ)
 *      - pos 17 «هذِهِ» -> w18 דְּנָה֙ (H1836, demonstrative pronoun)
 *      - pos 18 «السِّنِينَ» -> w19 שְׁנִ֣ין (H8140, noun absolute)
 *      - pos 19 «الْكَثِيرَةِ،» -> w20 שַׂגִּיאָ֔ן (H7690, adjective absolute)
 *      - pos 20 «وَقَدْ» -> AR_SYNTACTIC:B15.C5.V11.w20 (syntactic aspect marker)
 *      - pos 21 «بَنَاهُ» -> w24 בְּנָ֖הִי (H1124, peal qatal 3ms + Sp3ms)
 *      - pos 22 «مَلِكٌ» -> w21 וּמֶ֤לֶךְ (H4430, noun absolute + secondary H9002 וּ)
 *      - pos 23 «عَظِيمٌ» -> w23 רַ֔ב (H7229, adjective absolute)
 *      - pos 24 «لإِسْرَائِيلَ» -> w22 לְיִשְׂרָאֵל֙ (H3479, proper noun + secondary H9005 לְ)
 *      - pos 25 «وَأَكْمَلَهُ.» -> w25 וְשַׁכְלְלֵֽהּ (H3635, shaphel qatal 3ms + Sp3ms + secondary H9002 וְ)
 *   4. Populates exact construct/absolute/determined nominal states for all 13 nominal/participial positions.
 *   5. Populates complete derived verbal tense/mood/voice/person/gender/number fields.
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

console.log('--- APPLYING EZRA 5:11 CALIBRATION (BATCH 2N) ---');

const vId = q(`SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 5 AND verse_num = 11;`);
if (!vId) throw new Error('Verse Ezra 5:11 not found in database!');
console.log('Verse ID:', vId);

// 1. pos 1: «وَبِمِثْلِ» -> w1 וּכְנֵ֥מָא (H3660, AC/D) + secondary H9002 וּ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3660',
    orig_surface = 'וּכְנֵ֥מָא',
    orig_word = 'כְּנֵמָא',
    orig_word_position = 1,
    orig_morphology = 'AC/D',
    morph_pos = 'adverb',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = NULL,
    morph_case = NULL,
    relation_type = 'compound_phrase',
    grammar_notes = 'مكوّن تركيبي مشترك مع «هذَا» (الموضع 2) لمقابلة اللفظ الآرامي المركب וּכְנֵמָא (w1).',
    verified_locator = 'OSHB:B15.C5.V11.w1',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 1;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 1);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 1), 'H3660', 1, 'primary', 'וּכְנֵ֥מָא', 1, 'AC/D', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 1), 'H9002', 2, 'secondary', 'וּ', 1, 'AC', 'oshb_wlc');
`);

// 2. pos 2: «هذَا» -> w1 וּכְנֵ֥מָא (H3660, AC/D) + secondary H9002 וּ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3660',
    orig_surface = 'וּכְנֵ֥מָא',
    orig_word = 'כְּנֵמָא',
    orig_word_position = 1,
    orig_morphology = 'AC/D',
    morph_pos = 'adverb',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = NULL,
    morph_case = NULL,
    relation_type = 'compound_phrase',
    grammar_notes = 'مكوّن تركيبي مشترك مع «وَبِمِثْلِ» (الموضع 1) لمقابلة اللفظ الآرامي المركب וּכְנֵמָא (w1).',
    verified_locator = 'OSHB:B15.C5.V11.w1',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 2;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 2);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 2), 'H3660', 1, 'primary', 'וּכְנֵ֥מָא', 1, 'AC/D', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 2), 'H9002', 2, 'secondary', 'וּ', 1, 'AC', 'oshb_wlc');
`);

// 3. pos 3: «الْجَوَابِ» -> w2 פִתְגָמָ֖א (H6600, ANcmsd/Td)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H6600',
    orig_surface = 'פִתְגָמָ֖א',
    orig_word = 'פִּתְגָּם',
    orig_word_position = 2,
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
    grammar_notes = 'المدخل المعجمي H6600 في معجم التطبيق: פִּתְגָּם (مع شدّة)؛ والبديل الموثق دون شدّة: פִּתְגָם.',
    verified_locator = 'OSHB:B15.C5.V11.w2',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 3;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 3);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 3), 'H6600', 1, 'primary', 'פִתְגָמָ֖א', 2, 'ANcmsd/Td', 'oshb_wlc');
`);

// 4. pos 4: «جَاوَبُوا» -> w3 הֲתִיב֣וּנָא (H8421, AVhp3mp/Sp1cp)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H8421',
    orig_surface = 'הֲתִיב֣וּנָא',
    orig_word = 'תּוּב',
    orig_word_position = 3,
    orig_morphology = 'AVhp3mp/Sp1cp',
    morph_pos = 'verb',
    morph_stem = 'haphel',
    morph_tense = 'qatal',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w3',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 4;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 4);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 4), 'H8421', 1, 'primary', 'הֲתִיב֣וּנָא', 3, 'AVhp3mp/Sp1cp', 'oshb_wlc');
`);

// 5. pos 5: «قَائِلِينَ:» -> w4 לְמֵמַ֑ר (H560, AR/Vqc) + secondary H9005 לְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H560',
    orig_surface = 'לְמֵמַ֑ר',
    orig_word = 'אֲמַר',
    orig_word_position = 4,
    orig_morphology = 'AR/Vqc',
    morph_pos = 'verb',
    morph_stem = 'peal',
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = 'infinitive_construct',
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = NULL,
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w4',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 5;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 5);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 5), 'H560', 1, 'primary', 'לְמֵמַ֑ר', 4, 'AR/Vqc', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 5), 'H9005', 2, 'secondary', 'לְ', 4, 'AR', 'oshb_wlc');
`);

// 6. pos 6: «نَحْنُ» -> w5 אֲנַ֣חְנָא (H586, APp1cp) + secondary w6 הִמֹּ֡ו (H1994, ATa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H586',
    orig_surface = 'אֲנַ֣חְנָא',
    orig_word = 'אֲנַחְנָא',
    orig_word_position = 5,
    orig_morphology = 'APp1cp',
    morph_pos = 'pronoun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = '1',
    morph_gender = 'common',
    morph_number = 'plural',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = 'يتضمن اللفظ التأكيدي الآرامي הִמּוֹ (الموضع 6) كمكوّن ثانوي غير مترجم استقلالاً.',
    verified_locator = 'OSHB:B15.C5.V11.w5',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 6;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 6);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 6), 'H586', 1, 'primary', 'אֲנַ֣חְנָא', 5, 'APp1cp', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 6), 'H1994', 2, 'secondary', 'הִמּ֡וֹ', 6, 'ATa', 'oshb_wlc');
`);

// 7. pos 7: «عَبِيدُ» -> w7 עַבְדוֹהִי֩ (H5649, ANcmpc/Sp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5649',
    orig_surface = 'עַבְדוֹהִי֩',
    orig_word = 'עֲבַד',
    orig_word_position = 7,
    orig_morphology = 'ANcmpc/Sp3ms',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = 'construct',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w7',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 7;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7), 'H5649', 1, 'primary', 'עַבְדוֹהִי֩', 7, 'ANcmpc/Sp3ms', 'oshb_wlc');
`);

// 8. pos 8: «إِلهِ» -> w9 אֱלָ֨הּ (H426, ANcmsc) + secondary w8 דִֽי (H1768, ATr)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H426',
    orig_surface = 'אֱלָ֨הּ',
    orig_word = 'אֱלָהּ',
    orig_word_position = 9,
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
    grammar_notes = 'يتضمن أداة الإضافة والصلة الآرامية דִּי (الموضع 8) كمكوّن ثانوي سياقي رابط للإضافة.',
    verified_locator = 'OSHB:B15.C5.V11.w9',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 8;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8), 'H426', 1, 'primary', 'אֱלָ֨הּ', 9, 'ANcmsc', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8), 'H1768', 2, 'secondary', 'דִֽי', 8, 'ATr', 'oshb_wlc');
`);

// 9. pos 9: «السَّمَاءِ» -> w10 שְׁמַיָּ֜א (H8065, ANcmpd/Td)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H8065',
    orig_surface = 'שְׁמַיָּ֜א',
    orig_word = 'שָׁמַיִן',
    orig_word_position = 10,
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
    grammar_notes = 'المدخل المعجمي H8065 في معجم التطبيق: שָׁמַיִן (مع قماص)؛ والبديل الموثق بنقطة الشوا: שְׁמַיִן.',
    verified_locator = 'OSHB:B15.C5.V11.w10',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 9;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9), 'H8065', 1, 'primary', 'שְׁמַיָּ֜א', 10, 'ANcmpd/Td', 'oshb_wlc');
`);

// 10. pos 10: «وَالأَرْضِ،» -> w11 וְאַרְעָ֗א (H772, AC/Ncfsd/Td) + secondary H9002 וְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H772',
    orig_surface = 'וְאַרְעָ֗א',
    orig_word = 'אֲרַע',
    orig_word_position = 11,
    orig_morphology = 'AC/Ncfsd/Td',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'feminine',
    morph_number = 'singular',
    morph_case = 'determined',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w11',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 10;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10), 'H772', 1, 'primary', 'וְאַרְעָ֗א', 11, 'AC/Ncfsd/Td', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10), 'H9002', 2, 'secondary', 'וְ', 11, 'AC', 'oshb_wlc');
`);

// 11. pos 11: «وَنَبْنِي» -> w12 וּבָנַ֤יִן (H1124, AC/Vqrmpa) + secondary H9002 וּ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H1124',
    orig_surface = 'וּבָנַ֤יִן',
    orig_word = 'בְּנָא',
    orig_word_position = 12,
    orig_morphology = 'AC/Vqrmpa',
    morph_pos = 'verb',
    morph_stem = 'peal',
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = 'participle',
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w12',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 11;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11), 'H1124', 1, 'primary', 'וּבָנַ֤יִן', 12, 'AC/Vqrmpa', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11), 'H9002', 2, 'secondary', 'וּ', 12, 'AC', 'oshb_wlc');
`);

// 12. pos 12: «هذَا» -> AR_SYNTACTIC:B15.C5.V11.w12 (syntactic demonstrative pointing to determined בַּיְתָא)
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
    relation_type = 'syntactic_demonstrative',
    grammar_notes = 'اسم إشارة عربي عائد على البيت المعرّف بحالة التحديد الآرامية בַּיְתָא (الموضع 13).',
    verified_locator = 'AR_SYNTACTIC:B15.C5.V11.w12',
    verified_source = 'syntactic_ar',
    morph_source = 'syntactic_ar',
    is_verified = 0
  WHERE verse_id = '${vId}' AND ar_word_position = 12;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 12);
`);

// 13. pos 13: «الْبَيْتَ» -> w13 בַּיְתָא֙ (H1005, ANcmsd/Td)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H1005',
    orig_surface = 'בַּיְתָא֙',
    orig_word = 'בַּיִת',
    orig_word_position = 13,
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
    verified_locator = 'OSHB:B15.C5.V11.w13',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 13;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13), 'H1005', 1, 'primary', 'בַּיְתָא֙', 13, 'ANcmsd/Td', 'oshb_wlc');
`);

// 14. pos 14: «الَّذِي» -> w14 דִּֽי (H1768, ATr)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H1768',
    orig_surface = 'דִּֽי',
    orig_word = 'דִּי',
    orig_word_position = 14,
    orig_morphology = 'ATr',
    morph_pos = 'relative_pronoun',
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
    verified_locator = 'OSHB:B15.C5.V11.w14',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 14;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 14);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 14), 'H1768', 1, 'primary', 'דִּֽי', 14, 'ATr', 'oshb_wlc');
`);

// 15. pos 15: «بُنِيَ» -> w16 בְנֵ֜ה (H1124, AVqsmsa) + secondary auxiliary w15 הֲוָ֨א (H1934, AVqp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H1124',
    orig_surface = 'בְנֵ֜ה',
    orig_word = 'בְּנָא',
    orig_word_position = 16,
    orig_morphology = 'AVqsmsa',
    morph_pos = 'verb',
    morph_stem = 'peal',
    morph_tense = NULL,
    morph_voice = 'passive',
    morph_mood = 'passive_participle',
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = 'مبني للمجهول بصيغة اسم المفعول، ومسبوق بالفعل المساعد הֲוָא (الموضع 15) في تركيب ماضٍ مركب (دִּי הֲוָא בְנֵה = الذي كان قد بُني).',
    verified_locator = 'OSHB:B15.C5.V11.w16',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 15;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15), 'H1124', 1, 'primary', 'בְנֵ֜ה', 16, 'AVqsmsa', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15), 'H1934', 2, 'secondary', 'הֲוָ֨א', 15, 'AVqp3ms', 'oshb_wlc');
`);

// 16. pos 16: «قَبْلَ» -> w17 מִקַּדְמַ֤ת (H6928, AR/Ncfsc) + secondary H4481 מִ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H6928',
    orig_surface = 'מִקַּדְמַ֤ת',
    orig_word = 'קַדְמָה',
    orig_word_position = 17,
    orig_morphology = 'AR/Ncfsc',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'feminine',
    morph_number = 'singular',
    morph_case = 'construct',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w17',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 16;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 16);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 16), 'H6928', 1, 'primary', 'מִקַּדְמַ֤ת', 17, 'AR/Ncfsc', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 16), 'H4481', 2, 'secondary', 'מִ', 17, 'AR', 'oshb_wlc');
`);

// 17. pos 17: «هذِهِ» -> w18 דְּנָה֙ (H1836, APdxms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H1836',
    orig_surface = 'דְּנָה֙',
    orig_word = 'דֵּן',
    orig_word_position = 18,
    orig_morphology = 'APdxms',
    morph_pos = 'demonstrative',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w18',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 17;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 17);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 17), 'H1836', 1, 'primary', 'דְּנָה֙', 18, 'APdxms', 'oshb_wlc');
`);

// 18. pos 18: «السِّنِينَ» -> w19 שְׁנִ֣ין (H8140, ANcfpa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H8140',
    orig_surface = 'שְׁנִ֣ין',
    orig_word = 'שְׁנָה',
    orig_word_position = 19,
    orig_morphology = 'ANcfpa',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'feminine',
    morph_number = 'plural',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w19',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 18;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 18);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 18), 'H8140', 1, 'primary', 'שְׁנִ֣ין', 19, 'ANcfpa', 'oshb_wlc');
`);

// 19. pos 19: «الْكَثِيرَةِ،» -> w20 שַׂגִּיאָ֔ן (H7690, AAafpa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H7690',
    orig_surface = 'שַׂגִּיאָ֔ן',
    orig_word = 'שַׂגִּיא',
    orig_word_position = 20,
    orig_morphology = 'AAafpa',
    morph_pos = 'adjective',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'feminine',
    morph_number = 'plural',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w20',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 19;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 19);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 19), 'H7690', 1, 'primary', 'שַׂגִּיאָ֔ן', 20, 'AAafpa', 'oshb_wlc');
`);

// 20. pos 20: «وَقَدْ» -> AR_SYNTACTIC:B15.C5.V11.w20 (syntactic aspect marker)
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
    relation_type = 'syntactic_particle',
    grammar_notes = 'أداة تحقيق وتأكيد عربية مصاحبة للفعل בְּנָהִי (الموضع 24).',
    verified_locator = 'AR_SYNTACTIC:B15.C5.V11.w20',
    verified_source = 'syntactic_ar',
    morph_source = 'syntactic_ar',
    is_verified = 0
  WHERE verse_id = '${vId}' AND ar_word_position = 20;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 20);
`);

// 21. pos 21: «بَنَاهُ» -> w24 בְּנָ֖הִי (H1124, AVqp3ms/Sp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H1124',
    orig_surface = 'בְּנָ֖הִי',
    orig_word = 'בְּנָא',
    orig_word_position = 24,
    orig_morphology = 'AVqp3ms/Sp3ms',
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
    grammar_notes = 'فعل ماضٍ مسند إلى الغائب المفرد المذكر مع ضمير متصل مفعول به (3ms).',
    verified_locator = 'OSHB:B15.C5.V11.w24',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 21;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 21);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 21), 'H1124', 1, 'primary', 'בְּנָ֖הִי', 24, 'AVqp3ms/Sp3ms', 'oshb_wlc');
`);

// 22. pos 22: «مَلِكٌ» -> w21 וּמֶ֤לֶךְ (H4430, AC/Ncmsa) + secondary H9002 וּ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H4430',
    orig_surface = 'וּמֶ֤לֶךְ',
    orig_word = 'מֶלֶךְ',
    orig_word_position = 21,
    orig_morphology = 'AC/Ncmsa',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w21',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 22;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 22);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 22), 'H4430', 1, 'primary', 'וּמֶ֤לֶךְ', 21, 'AC/Ncmsa', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 22), 'H9002', 2, 'secondary', 'וּ', 21, 'AC', 'oshb_wlc');
`);

// 23. pos 23: «عَظِيمٌ» -> w23 רַ֔ב (H7229, AAamsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H7229',
    orig_surface = 'רַ֔ב',
    orig_word = 'רַב',
    orig_word_position = 23,
    orig_morphology = 'AAamsa',
    morph_pos = 'adjective',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w23',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 23;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 23);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 23), 'H7229', 1, 'primary', 'רַ֔ב', 23, 'AAamsa', 'oshb_wlc');
`);

// 24. pos 24: «لإِسْرَائِيلَ» -> w22 לְיִשְׂרָאֵל֙ (H3479, AR/Np) + secondary H9005 לְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3479',
    orig_surface = 'לְיִשְׂרָאֵל֙',
    orig_word = 'יִשְׂרָאֵל',
    orig_word_position = 22,
    orig_morphology = 'AR/Np',
    morph_pos = 'proper_noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B15.C5.V11.w22',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 24;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 24);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 24), 'H3479', 1, 'primary', 'לְיִשְׂרָאֵל֙', 22, 'AR/Np', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 24), 'H9005', 2, 'secondary', 'לְ', 22, 'AR', 'oshb_wlc');
`);

// 25. pos 25: «وَأَكْمَلَهُ.» -> w25 וְשַׁכְלְלֵֽהּ (H3635, AC/Vep3ms/Sp3ms) + secondary H9002 וְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3635',
    orig_surface = 'וְשַׁכְלְלֵֽהּ',
    orig_word = 'כְּלַל',
    orig_word_position = 25,
    orig_morphology = 'AC/Vep3ms/Sp3ms',
    morph_pos = 'verb',
    morph_stem = 'shaphel',
    morph_tense = 'qatal',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = 'المدخل المعجمي H3635 في معجم التطبيق هو כְּלַל (kᵉlal)؛ واللفظ وارد هنا في صيغة الشفعل (שַׁכְלֵל / shaphel qatal 3ms) الآرامية مع واو العطف وضمير متصل مفعول به (3ms).',
    verified_locator = 'OSHB:B15.C5.V11.w25',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 25;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 25);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 25), 'H3635', 1, 'primary', 'וְשַׁכְלְלֵֽהּ', 25, 'AC/Vep3ms/Sp3ms', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 25), 'H9002', 2, 'secondary', 'וְ', 25, 'AC', 'oshb_wlc');
`);

console.log('Successfully calibrated all 25 Arabic records for Ezra 5:11 (Batch 2N).');
