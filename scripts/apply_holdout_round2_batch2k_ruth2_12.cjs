/**
 * scripts/apply_holdout_round2_batch2k_ruth2_12.cjs
 *
 * Full verse calibration for Ruth 2:12 (Batch 2K) across all 17 Arabic records
 * and all 15 Hebrew OSHB tokens (w1..w15).
 *
 * Repairs former alignment displacement caused by compound prepositions (w7 מֵעִם)
 * and compound purpose infinitive (w13 לַחֲסוֹת), removes spurious H413 (אֵל),
 * corrects H7939 -> H4909 (מַשְׂכֹּרֶת), populates construct/absolute nominal states,
 * and eliminates out-of-bounds locators w16 and w17.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const isWin = process.platform === 'win32';
const sqlite = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

function q(sql, targetDb = dbPath) {
  return execFileSync(sqlite, [targetDb], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

console.log('--- APPLYING RUTH 2:12 CALIBRATION (BATCH 2K) ---');

const vId = q(`SELECT id FROM verses WHERE book_id = 8 AND chapter_num = 2 AND verse_num = 12;`);
if (!vId) throw new Error('Verse Ruth 2:12 not found in database!');
console.log('Verse ID:', vId);

// 1. pos 1: «لِيُكَافِئِ» -> w1 יְשַׁלֵּ֥ם (H7999, HVpi3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H7999',
    orig_surface = 'יְשַׁלֵּ֥ם',
    orig_word = 'שָׁלַם',
    orig_word_position = 1,
    orig_morphology = 'HVpi3ms',
    morph_pos = 'verb',
    morph_stem = 'piel',
    morph_tense = 'yiqtol',
    morph_voice = 'active',
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    verified_locator = 'OSHB:B8.C2.V12.w1',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 1;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H7999',
    orig_component = 'יְשַׁלֵּ֥ם',
    orig_morphology = 'HVpi3ms',
    orig_word_position = 1,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 1);
`);

// 2. pos 2: «الرَّبُّ» -> w2 יְהוָ֖ה (H3068, HNp)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3068',
    orig_surface = 'יְהוָ֖ה',
    orig_word = 'יְהֹוָה',
    orig_word_position = 2,
    orig_morphology = 'HNp',
    morph_pos = 'proper_noun',
    morph_number = 'singular',
    verified_locator = 'OSHB:B8.C2.V12.w2',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 2;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H3068',
    orig_component = 'יְהוָ֖ה',
    orig_morphology = 'HNp',
    orig_word_position = 2,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 2);
`);

// 3. pos 3: «عَمَلَكِ» -> w3 פָּעֳלֵ֑ךְ (H6467, HNcmsc/Sp2fs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H6467',
    orig_surface = 'פָּעֳלֵ֑ךְ',
    orig_word = 'פֹּעַל',
    orig_word_position = 3,
    orig_morphology = 'HNcmsc/Sp2fs',
    morph_pos = 'noun',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'construct',
    morph_person = '2',
    verified_locator = 'OSHB:B8.C2.V12.w3',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 3;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H6467',
    orig_component = 'פָּעֳלֵ֑ךְ',
    orig_morphology = 'HNcmsc/Sp2fs',
    orig_word_position = 3,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 3);
`);

// 4. pos 4: «وَلْيَكُنْ» -> w4 וּתְהִ֨י (H1961, HC/Vqj3fs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H1961',
    orig_surface = 'וּתְהִ֨י',
    orig_word = 'הָיָה',
    orig_word_position = 4,
    orig_morphology = 'HC/Vqj3fs',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = 'yiqtol',
    morph_voice = 'active',
    morph_mood = 'jussive',
    morph_person = '3',
    morph_gender = 'feminine',
    morph_number = 'singular',
    verified_locator = 'OSHB:B8.C2.V12.w4',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 4;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H1961',
    orig_component = 'וּתְהִ֨י',
    orig_morphology = 'HC/Vqj3fs',
    orig_word_position = 4,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 4);
`);

// 5. pos 5: «أَجْرُكِ» -> w5 מַשְׂכֻּרְתֵּ֜ךְ (H4909, HNcfsc/Sp2fs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H4909',
    orig_surface = 'מַשְׂכֻּרְתֵּ֜ךְ',
    orig_word = 'מַשְׂכֹּרֶת',
    orig_word_position = 5,
    orig_morphology = 'HNcfsc/Sp2fs',
    morph_pos = 'noun',
    morph_gender = 'feminine',
    morph_number = 'singular',
    morph_case = 'construct',
    morph_person = '2',
    verified_locator = 'OSHB:B8.C2.V12.w5',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 5;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H4909',
    orig_component = 'מַשְׂכֻּרְתֵּ֜ךְ',
    orig_morphology = 'HNcfsc/Sp2fs',
    orig_word_position = 5,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 5);
`);

// 6. pos 6: «كَامِلاً» -> w6 שְׁלֵמָ֗ה (H8003, HAafsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H8003',
    orig_surface = 'שְׁלֵמָ֗ה',
    orig_word = 'שָׁלֵם',
    orig_word_position = 6,
    orig_morphology = 'HAafsa',
    morph_pos = 'adjective',
    morph_gender = 'feminine',
    morph_number = 'singular',
    morph_case = 'absolute',
    verified_locator = 'OSHB:B8.C2.V12.w6',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 6;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H8003',
    orig_component = 'שְׁלֵמָ֗ה',
    orig_morphology = 'HAafsa',
    orig_word_position = 6,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 6);
`);

// 7. pos 7: «مِنْ» -> w7 מֵעִ֤ם (H4480, HR) & pos 8: «عِنْدِ» -> w7 מֵעִ֤ם (H5973, HR/R)
const pos8WmId = q(`SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8;`);
q(`
  UPDATE word_mappings SET
    strongs_id = 'H4480',
    orig_surface = 'מֵעִ֤ם',
    orig_word = 'מִן',
    orig_word_position = 7,
    orig_morphology = 'HR',
    morph_pos = 'preposition',
    relation_type = 'compound_phrase',
    grammar_notes = 'Compound preposition unit representing Hebrew composite preposition מֵעִם (H4480 + H5973)',
    verified_locator = 'OSHB:B8.C2.V12.w7',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 7;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H4480',
    orig_component = 'מֵעִ֤ם',
    orig_morphology = 'HR',
    orig_word_position = 7,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7);

  UPDATE word_mappings SET
    strongs_id = 'H5973',
    orig_surface = 'מֵעִ֤ם',
    orig_word = 'עִם',
    orig_word_position = 7,
    orig_morphology = 'HR/R',
    morph_pos = 'preposition',
    relation_type = 'compound_phrase',
    grammar_notes = 'Compound preposition unit representing Hebrew composite preposition מֵעִם (H4480 + H5973)',
    verified_locator = 'OSHB:B8.C2.V12.w7',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 8;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H5973',
    orig_component = 'מֵעִ֤ם',
    orig_morphology = 'HR/R',
    orig_word_position = 7,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = '${pos8WmId}' AND link_order = 1;

  INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ('${pos8WmId}', 'H4480', 2, 'secondary', 'מֵ', 7, 'HR', 'oshb_wlc');
`);

// 8. pos 9: «الرَّبِّ» -> w8 יְהוָה֙ (H3068, HNp)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3068',
    orig_surface = 'יְהוָה֙',
    orig_word = 'יְהֹוָה',
    orig_word_position = 8,
    orig_morphology = 'HNp',
    morph_pos = 'proper_noun',
    morph_number = 'singular',
    verified_locator = 'OSHB:B8.C2.V12.w8',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 9;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H3068',
    orig_component = 'יְהוָה֙',
    orig_morphology = 'HNp',
    orig_word_position = 8,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9);
`);

// 9. pos 10: «إِلهِ» -> w9 אֱלֹהֵ֣י (H430, HNcmpc)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H430',
    orig_surface = 'אֱלֹהֵ֣י',
    orig_word = 'אֱלֹהִים',
    orig_word_position = 9,
    orig_morphology = 'HNcmpc',
    morph_pos = 'noun',
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = 'construct',
    verified_locator = 'OSHB:B8.C2.V12.w9',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 10;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H430',
    orig_component = 'אֱלֹהֵ֣י',
    orig_morphology = 'HNcmpc',
    orig_word_position = 9,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10);
`);

// 10. pos 11: «إِسْرَائِيلَ» -> w10 יִשְׂרָאֵ֔ל (H3478, HNp)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3478',
    orig_surface = 'יִשְׂרָאֵ֔ל',
    orig_word = 'יִשְׂרָאֵל',
    orig_word_position = 10,
    orig_morphology = 'HNp',
    morph_pos = 'proper_noun',
    morph_number = 'singular',
    verified_locator = 'OSHB:B8.C2.V12.w10',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 11;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H3478',
    orig_component = 'יִשְׂרָאֵ֔ל',
    orig_morphology = 'HNp',
    orig_word_position = 10,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11);
`);

// 11. pos 12: «الَّذِي» -> w11 אֲשֶׁר (H834, HTr)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H834',
    orig_surface = 'אֲשֶׁר',
    orig_word = 'אֲשֶׁר',
    orig_word_position = 11,
    orig_morphology = 'HTr',
    morph_pos = 'relative_pronoun',
    verified_locator = 'OSHB:B8.C2.V12.w11',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 12;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H834',
    orig_component = 'אֲשֶׁר',
    orig_morphology = 'HTr',
    orig_word_position = 11,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 12);
`);

// 12. pos 13: «جِئْتِ» -> w12 בָּ֖את (H935, HVqp2fs)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H935',
    orig_surface = 'בָּ֖את',
    orig_word = 'בּוֹא',
    orig_word_position = 12,
    orig_morphology = 'HVqp2fs',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = 'qatal',
    morph_voice = 'active',
    morph_mood = 'indicative',
    morph_person = '2',
    morph_gender = 'feminine',
    morph_number = 'singular',
    verified_locator = 'OSHB:B8.C2.V12.w12',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 13;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H935',
    orig_component = 'בָּ֖את',
    orig_morphology = 'HVqp2fs',
    orig_word_position = 12,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13);
`);

// 13. pos 14: «لِكَيْ» -> w13 לַחֲס֥וֹת (H9005, HR) & pos 15: «تَحْتَمِي» -> w13 לַחֲס֥וֹת (H2620, HR/Vqc)
const pos15WmId = q(`SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15;`);
q(`
  UPDATE word_mappings SET
    strongs_id = 'H9005',
    orig_surface = 'לַחֲס֥וֹת',
    orig_word = 'לְ',
    orig_word_position = 13,
    orig_morphology = 'HR',
    morph_pos = 'preposition',
    relation_type = 'compound_phrase',
    grammar_notes = 'Purpose prefix preposition לַ of infinitive construct לַחֲס֥וֹת (H9005 + H2620)',
    verified_locator = 'OSHB:B8.C2.V12.w13',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 14;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H9005',
    orig_component = 'לַחֲס֥וֹת',
    orig_morphology = 'HR',
    orig_word_position = 13,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 14);

  UPDATE word_mappings SET
    strongs_id = 'H2620',
    orig_surface = 'לַחֲס֥וֹת',
    orig_word = 'חָסָה',
    orig_word_position = 13,
    orig_morphology = 'HR/Vqc',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_voice = 'active',
    morph_mood = 'infinitive_construct',
    relation_type = 'compound_phrase',
    grammar_notes = 'Infinitive construct לַחֲס֥וֹת with preposition prefix לַ (H9005 + H2620)',
    verified_locator = 'OSHB:B8.C2.V12.w13',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 15;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H2620',
    orig_component = 'לַחֲס֥וֹת',
    orig_morphology = 'HR/Vqc',
    orig_word_position = 13,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = '${pos15WmId}' AND link_order = 1;

  INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ('${pos15WmId}', 'H9005', 2, 'secondary', 'לַ', 13, 'HR', 'oshb_wlc');
`);

// 14. pos 16: «تَحْتَ» -> w14 תַּֽחַת (H8478, HR)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H8478',
    orig_surface = 'תַּֽחַת',
    orig_word = 'תַּחַת',
    orig_word_position = 14,
    orig_morphology = 'HR',
    morph_pos = 'preposition',
    verified_locator = 'OSHB:B8.C2.V12.w14',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 16;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H8478',
    orig_component = 'תַּֽחַת',
    orig_morphology = 'HR',
    orig_word_position = 14,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 16);
`);

// 15. pos 17: «جَنَاحَيْهِ» -> w15 כְּנָפָֽיו (H3671, HNcfpc/Sp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3671',
    orig_surface = 'כְּנָפָֽיו',
    orig_word = 'כָּנָף',
    orig_word_position = 15,
    orig_morphology = 'HNcfpc/Sp3ms',
    morph_pos = 'noun',
    morph_gender = 'feminine',
    morph_number = 'plural',
    morph_case = 'construct',
    morph_person = '3',
    verified_locator = 'OSHB:B8.C2.V12.w15',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 17;

  UPDATE word_mapping_strongs SET
    strongs_id = 'H3671',
    orig_component = 'כְּנָפָֽיו',
    orig_morphology = 'HNcfpc/Sp3ms',
    orig_word_position = 15,
    morph_source = 'oshb_wlc'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 17);
`);

console.log('Ruth 2:12 calibration successfully applied to database.');
