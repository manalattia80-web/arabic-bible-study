/**
 * scripts/apply_holdout_round2_batch2m_2chr7_14.cjs
 *
 * Full verse calibration for 2 Chronicles 7:14 (Batch 2M) across all 22 Arabic records
 * and all 21 Hebrew OSHB tokens (w1..w21).
 *
 * Resolves:
 *   1. Former alignment shift caused by initial false mapping of «فَإِذَا» (pos 1) to H834.
 *   2. Classifies «فَإِذَا» (pos 1) cleanly as Arabic syntactic conditional construction (AR_SYNTACTIC:B14.C7.V14.w1).
 *   3. Restores true 1:1 alignment:
 *      - pos 2 «تَوَاضَعَ» -> w1 וְיִכָּנְע֨וּ (H3665, niphal yiqtol) + secondary H9002 וְ
 *      - pos 3 «شَعْبِي» -> w2 עַמִּ֜י (H5971, noun construct)
 *      - pos 4 «الَّذِينَ» -> w3 אֲשֶׁ֧ר (H834, relative particle)
 *      - pos 5 «دُعِيَ» -> w4 נִֽקְרָא (H7121, niphal qatal)
 *      - pos 6 «اسْمِي» -> w5 שְׁמִ֣י (H8034, noun construct)
 *      - pos 7 «عَلَيْهِمْ» -> w6 עֲלֵיהֶ֗ם (H5921, preposition)
 *      - pos 8 «وَصَلَّوْا» -> w7 וְיִֽתְפַּֽלְלוּ֙ (H6419, hithpael yiqtol) + secondary H9002 וְ
 *      - pos 9 «وَطَلَبُوا» -> w8 וִֽיבַקְשׁ֣וּ (H1245, piel yiqtol) + secondary H9002 וִֽ
 *      - pos 10 «وَجْهِي» -> w9 פָנַ֔י (H6440, noun construct)
 *      - pos 11 «وَرَجَعُوا» -> w10 וְיָשֻׁ֖בוּ (H7725, qal yiqtol) + secondary H9002 וְ
 *      - pos 12 & 13 «عَنْ طُرُقِهِمِ» -> documented compound unit to w11 מִדַּרְכֵיהֶ֣ם (H4480 + H1870 construct)
 *      - pos 14 «الرَّدِيةِ» -> w12 הָרָעִ֑ים (H7451, adjective absolute) + secondary H9009 הָ
 *      - pos 15 «فَإِنَّنِي» -> w13 וַאֲנִי֙ (H589, personal pronoun) + secondary H9002 וַ
 *      - pos 16 «أَسْمَعُ» -> w14 אֶשְׁמַ֣ע (H8085, qal yiqtol)
 *      - pos 17 «مِنَ» -> w15 מִן (H4480, preposition)
 *      - pos 18 «السَّمَاءِ» -> w16 הַשָּׁמַ֔יִם (H8064, noun absolute) + secondary H9009 הַ
 *      - pos 19 «وَأَغْفِرُ» -> w17 וְאֶסְלַח֙ (H5545, qal yiqtol) + secondary H9002 וְ
 *      - pos 20 «خَطِيَّتَهُمْ» -> w18 לְחַטָּאתָ֔ם (H2403, noun construct) + secondary H9005 לְ
 *      - pos 21 «وَأُبْرِئُ» -> w19 וְאֶרְפָּ֖א (H7495, qal yiqtol) + secondary H9002 וְ
 *      - pos 22 «أَرْضَهُمْ» -> w21 אַרְצָֽם (H776, noun construct) with secondary w20 אֶת (H853, HTo)
 *   4. Populates construct/absolute nominal states for all 8 nominal positions.
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

console.log('--- APPLYING 2 CHRONICLES 7:14 CALIBRATION (BATCH 2M) ---');

const vId = q(`SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 7 AND verse_num = 14;`);
if (!vId) throw new Error('Verse 2 Chronicles 7:14 not found in database!');
console.log('Verse ID:', vId);

// 1. pos 1: «فَإِذَا» -> Arabic syntactic conditional construction
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
    relation_type = 'syntactic_construction',
    grammar_notes = 'أداة شرط وسياق لغوي في صياغة الترجمة العربية لمقابلة واو العطف في الفعل العبري וְיִכָּנְעוּ (w1).',
    verified_locator = 'AR_SYNTACTIC:B14.C7.V14.w1',
    verified_source = 'syntactic_ar',
    morph_source = 'syntactic_ar',
    is_verified = 0
  WHERE verse_id = '${vId}' AND ar_word_position = 1;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 1);
`);

// 2. pos 2: «تَوَاضَعَ» -> w1 וְיִכָּנְע֨וּ (H3665, HC/VNi3mp) + secondary H9002 וְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3665',
    orig_surface = 'וְיִכָּנְע֨וּ',
    orig_word = 'כָּנַע',
    orig_word_position = 1,
    orig_morphology = 'HC/VNi3mp',
    morph_pos = 'verb',
    morph_stem = 'niphal',
    morph_tense = 'yiqtol',
    morph_voice = 'passive',
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w1',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 2;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 2);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 2), 'H3665', 1, 'primary', 'וְיִכָּנְע֨וּ', 1, 'HC/VNi3mp', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 2), 'H9002', 2, 'secondary', 'וְ', 1, 'HC', 'oshb_wlc');
`);

// 3. pos 3: «شَعْبِي» -> w2 עַמִּ֜י (H5971, HNcmsc/Sp1cs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5971',
    orig_surface = 'עַמִּ֜י',
    orig_word = 'עַם',
    orig_word_position = 2,
    orig_morphology = 'HNcmsc/Sp1cs',
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
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w2',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 3;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 3);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 3), 'H5971', 1, 'primary', 'עַמִּ֜י', 2, 'HNcmsc/Sp1cs', 'oshb_wlc');
`);

// 4. pos 4: «الَّذِينَ» -> w3 אֲשֶׁ֧ר (H834, HTr)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H834',
    orig_surface = 'אֲשֶׁ֧ר',
    orig_word = 'אֲשֶׁר',
    orig_word_position = 3,
    orig_morphology = 'HTr',
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
    verified_locator = 'OSHB:B14.C7.V14.w3',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 4;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 4);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 4), 'H834', 1, 'primary', 'אֲשֶׁ֧ר', 3, 'HTr', 'oshb_wlc');
`);

// 5. pos 5: «دُعِيَ» -> w4 נִֽקְרָא (H7121, HVNp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H7121',
    orig_surface = 'נִֽקְרָא',
    orig_word = 'קָרָא',
    orig_word_position = 4,
    orig_morphology = 'HVNp3ms',
    morph_pos = 'verb',
    morph_stem = 'niphal',
    morph_tense = 'qatal',
    morph_voice = 'passive',
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w4',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 5;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 5);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 5), 'H7121', 1, 'primary', 'נִֽקְרָא', 4, 'HVNp3ms', 'oshb_wlc');
`);

// 6. pos 6: «اسْمِي» -> w5 שְׁמִ֣י (H8034, HNcmsc/Sp1cs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H8034',
    orig_surface = 'שְׁמִ֣י',
    orig_word = 'שֵׁם',
    orig_word_position = 5,
    orig_morphology = 'HNcmsc/Sp1cs',
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
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w5',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 6;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 6);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 6), 'H8034', 1, 'primary', 'שְׁמִ֣י', 5, 'HNcmsc/Sp1cs', 'oshb_wlc');
`);

// 7. pos 7: «عَلَيْهِمْ» -> w6 עֲלֵיהֶ֗ם (H5921, HR/Sp3mp)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5921',
    orig_surface = 'עֲלֵיהֶ֗ם',
    orig_word = 'עַל',
    orig_word_position = 6,
    orig_morphology = 'HR/Sp3mp',
    morph_pos = 'preposition',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w6',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 7;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7), 'H5921', 1, 'primary', 'עֲלֵיהֶ֗ם', 6, 'HR/Sp3mp', 'oshb_wlc');
`);

// 8. pos 8: «وَصَلَّوْا» -> w7 וְיִֽתְפַּֽלְלוּ֙ (H6419, HC/Vti3mp) + secondary H9002 וְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H6419',
    orig_surface = 'וְיִֽתְפַּֽלְלוּ֙',
    orig_word = 'פָּלַל',
    orig_word_position = 7,
    orig_morphology = 'HC/Vti3mp',
    morph_pos = 'verb',
    morph_stem = 'hithpael',
    morph_tense = 'yiqtol',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w7',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 8;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8), 'H6419', 1, 'primary', 'וְיִֽתְפַּֽלְلوּ֙', 7, 'HC/Vti3mp', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8), 'H9002', 2, 'secondary', 'וְ', 7, 'HC', 'oshb_wlc');
`);

// 9. pos 9: «وَطَلَبُوا» -> w8 וִֽיבַקְשׁ֣וּ (H1245, HC/Vpi3mp) + secondary H9002 וִֽ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H1245',
    orig_surface = 'וִֽיבַקְשׁ֣וּ',
    orig_word = 'בָּקַשׁ',
    orig_word_position = 8,
    orig_morphology = 'HC/Vpi3mp',
    morph_pos = 'verb',
    morph_stem = 'piel',
    morph_tense = 'yiqtol',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w8',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 9;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9), 'H1245', 1, 'primary', 'וִֽיבַקְשׁ֣וּ', 8, 'HC/Vpi3mp', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9), 'H9002', 2, 'secondary', 'וִֽ', 8, 'HC', 'oshb_wlc');
`);

// 10. pos 10: «وَجْهِي» -> w9 פָנַ֔י (H6440, HNcbpc/Sp1cs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H6440',
    orig_surface = 'פָנַ֔י',
    orig_word = 'פָּנִים',
    orig_word_position = 9,
    orig_morphology = 'HNcbpc/Sp1cs',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'common',
    morph_number = 'plural',
    morph_case = 'construct',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w9',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 10;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10), 'H6440', 1, 'primary', 'פָנַ֔י', 9, 'HNcbpc/Sp1cs', 'oshb_wlc');
`);

// 11. pos 11: «وَرَجَعُوا» -> w10 וְיָשֻׁ֖בוּ (H7725, HC/Vqi3mp) + secondary H9002 וְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H7725',
    orig_surface = 'וְיָשֻׁ֖בוּ',
    orig_word = 'שׁוּב',
    orig_word_position = 10,
    orig_morphology = 'HC/Vqi3mp',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = 'yiqtol',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w10',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 11;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11), 'H7725', 1, 'primary', 'וְיָשֻׁ֖בוּ', 10, 'HC/Vqi3mp', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11), 'H9002', 2, 'secondary', 'וְ', 10, 'HC', 'oshb_wlc');
`);

// 12. pos 12: «عَنْ» -> w11 מִדַּרְכֵיהֶ֣ם (H4480 + H1870, compound_phrase preposition)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H4480',
    orig_surface = 'מִדַּרְכֵיהֶ֣ם',
    orig_word = 'מִן',
    orig_word_position = 11,
    orig_morphology = 'HR',
    morph_pos = 'preposition',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = NULL,
    morph_case = NULL,
    relation_type = 'compound_phrase',
    grammar_notes = 'حرف الجر العبري المتصل (מִן) في מִדַּרְכֵיהֶם (الموضع 11)، والاسم דֶּרֶךְ يقابل الكلمة التالية «طُرُقِهِمِ».',
    verified_locator = 'OSHB:B14.C7.V14.w11',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 12;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 12);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 12), 'H4480', 1, 'primary', 'מִדַּרְכֵיהֶ֣ם', 11, 'HR', 'oshb_wlc');
`);

// 13. pos 13: «طُرُقِهِمِ» -> w11 מִדַּרְכֵיהֶ֣ם (H1870, compound_phrase noun + secondary H4480)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H1870',
    orig_surface = 'מִדַּרְכֵיהֶ֣ם',
    orig_word = 'דֶּרֶךְ',
    orig_word_position = 11,
    orig_morphology = 'HR/Ncbpc/Sp3mp',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'common',
    morph_number = 'plural',
    morph_case = 'construct',
    relation_type = 'compound_phrase',
    grammar_notes = 'الاسم العبري דֶּרֶךְ داخل الكلمة المركبة מִדַּרְכֵיהֶם (الموضع 11)، وحرف الجر المتصل מִן يقابل الكلمة السابقة «عَنْ».',
    verified_locator = 'OSHB:B14.C7.V14.w11',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 13;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13), 'H1870', 1, 'primary', 'מִדַּרְכֵיהֶ֣ם', 11, 'HR/Ncbpc/Sp3mp', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13), 'H4480', 2, 'secondary', 'מִ', 11, 'HR', 'oshb_wlc');
`);

// 14. pos 14: «الرَّدِيةِ» -> w12 הָרָעִ֑ים (H7451, HTd/Aampa) + secondary H9009 הָ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H7451',
    orig_surface = 'הָרָעִ֑ים',
    orig_word = 'רַע',
    orig_word_position = 12,
    orig_morphology = 'HTd/Aampa',
    morph_pos = 'adjective',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w12',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 14;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 14);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 14), 'H7451', 1, 'primary', 'הָרָעִ֑ים', 12, 'HTd/Aampa', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 14), 'H9009', 2, 'secondary', 'הָ', 12, 'HTd', 'oshb_wlc');
`);

// 15. pos 15: «فَإِنَّنِي» -> w13 וַאֲנִי֙ (H589, HC/Pp1cs) + secondary H9002 וַ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H589',
    orig_surface = 'וַאֲנִי֙',
    orig_word = 'אֲנִי',
    orig_word_position = 13,
    orig_morphology = 'HC/Pp1cs',
    morph_pos = 'personal_pronoun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = '1',
    morph_gender = 'common',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w13',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 15;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15), 'H589', 1, 'primary', 'וַאֲנִי֙', 13, 'HC/Pp1cs', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15), 'H9002', 2, 'secondary', 'וַ', 13, 'HC', 'oshb_wlc');
`);

// 16. pos 16: «أَسْمَعُ» -> w14 אֶשְׁמַ֣ע (H8085, HVqi1cs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H8085',
    orig_surface = 'אֶשְׁמַ֣ע',
    orig_word = 'שָׁמַע',
    orig_word_position = 14,
    orig_morphology = 'HVqi1cs',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = 'yiqtol',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '1',
    morph_gender = 'common',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w14',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 16;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 16);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 16), 'H8085', 1, 'primary', 'אֶשְׁמַ֣ע', 14, 'HVqi1cs', 'oshb_wlc');
`);

// 17. pos 17: «مِنَ» -> w15 מִן (H4480, HR)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H4480',
    orig_surface = 'מִן',
    orig_word = 'מִן',
    orig_word_position = 15,
    orig_morphology = 'HR',
    morph_pos = 'preposition',
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
    verified_locator = 'OSHB:B14.C7.V14.w15',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 17;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 17);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 17), 'H4480', 1, 'primary', 'מִן', 15, 'HR', 'oshb_wlc');
`);

// 18. pos 18: «السَّمَاءِ» -> w16 הַשָּׁמַ֔יִם (H8064, HTd/Ncmpa) + secondary H9009 הַ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H8064',
    orig_surface = 'הַשָּׁמַ֔יִם',
    orig_word = 'שָׁמַיִם',
    orig_word_position = 16,
    orig_morphology = 'HTd/Ncmpa',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w16',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 18;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 18);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 18), 'H8064', 1, 'primary', 'הַשָּׁמַ֔يִם', 16, 'HTd/Ncmpa', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 18), 'H9009', 2, 'secondary', 'הַ', 16, 'HTd', 'oshb_wlc');
`);

// 19. pos 19: «وَأَغْفِرُ» -> w17 וְאֶסְלַח֙ (H5545, HC/Vqi1cs) + secondary H9002 וְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5545',
    orig_surface = 'וְאֶסְלַח֙',
    orig_word = 'סָלַח',
    orig_word_position = 17,
    orig_morphology = 'HC/Vqi1cs',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = 'yiqtol',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '1',
    morph_gender = 'common',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w17',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 19;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 19);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 19), 'H5545', 1, 'primary', 'וְאֶסְלַח֙', 17, 'HC/Vqi1cs', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 19), 'H9002', 2, 'secondary', 'וְ', 17, 'HC', 'oshb_wlc');
`);

// 20. pos 20: «خَطِيَّتَهُمْ» -> w18 לְחַטָּאתָ֔ם (H2403, HR/Ncfsc/Sp3mp) + secondary H9005 לְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H2403',
    orig_surface = 'לְחַטָּאתָ֔ם',
    orig_word = 'חַטָּאָה',
    orig_word_position = 18,
    orig_morphology = 'HR/Ncfsc/Sp3mp',
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
    verified_locator = 'OSHB:B14.C7.V14.w18',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 20;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 20);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 20), 'H2403', 1, 'primary', 'לְחַטָּאתָ֔ם', 18, 'HR/Ncfsc/Sp3mp', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 20), 'H9005', 2, 'secondary', 'לְ', 18, 'HR', 'oshb_wlc');
`);

// 21. pos 21: «وَأُبْرِئُ» -> w19 וְאֶרְפָּ֖א (H7495, HC/Vqi1cs) + secondary H9002 וְ
q(`
  UPDATE word_mappings SET
    strongs_id = 'H7495',
    orig_surface = 'וְאֶרְפָּ֖א',
    orig_word = 'רָפָא',
    orig_word_position = 19,
    orig_morphology = 'HC/Vqi1cs',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = 'yiqtol',
    morph_voice = NULL,
    morph_mood = 'indicative',
    morph_person = '1',
    morph_gender = 'common',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w19',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 21;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 21);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 21), 'H7495', 1, 'primary', 'וְאֶרְפָּ֖א', 19, 'HC/Vqi1cs', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 21), 'H9002', 2, 'secondary', 'וְ', 19, 'HC', 'oshb_wlc');
`);

// 22. pos 22: «أَرْضَهُمْ» -> w21 אַרְצָֽם (H776, HNcbsc/Sp3mp) + secondary w20 אֶת (H853, HTo)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H776',
    orig_surface = 'אַרְצָֽם',
    orig_word = 'אֶרֶץ',
    orig_word_position = 21,
    orig_morphology = 'HNcbsc/Sp3mp',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'common',
    morph_number = 'singular',
    morph_case = 'construct',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B14.C7.V14.w21',
    verified_source = 'oshb_wlc',
    morph_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 22;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 22);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 22), 'H776', 1, 'primary', 'אַרְצָֽם', 21, 'HNcbsc/Sp3mp', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 22), 'H853', 2, 'secondary', 'אֶת', 20, 'HTo', 'oshb_wlc');
`);

console.log('Successfully applied 2 Chronicles 7:14 full verse calibration across all 22 Arabic records and 21 Hebrew tokens.');
