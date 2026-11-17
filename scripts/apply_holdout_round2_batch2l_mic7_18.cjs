/**
 * scripts/apply_holdout_round2_batch2l_mic7_18.cjs
 *
 * Full verse calibration for Micah 7:18 (Batch 2L) across all 19 Arabic records
 * and all 18 Hebrew OSHB tokens (w1..w18).
 *
 * Resolves:
 *   1. Former alignment shift caused by early unverified mapping of copula «هُوَ» (pos 2).
 *   2. Restores 1:1 correspondence for «إِلهٌ» (pos 3 -> w2 אֵל) through «مِيرَاثِهِ» (pos 11 -> w10 נַחֲלָתוֹ).
 *   3. Corrects «الذَّنْبِ» (pos 9) from erroneous repeated H5771 to w8 פֶּשַׁע (H6588).
 *   4. Replaces fake H4480 on «لاَ» (pos 12) with true w11 לֹא (H3808).
 *   5. Replaces fake H5201 on «يَحْفَظُ» (pos 13) with true w12 הֶחֱזִיק (H2388, hiphil past).
 *   6. Maps compound phrase «إِلَى الأَبَدِ» (pos 14-15) cleanly to w13 לָעַד (H9005 + H5703).
 *   7. Maps «غَضَبَهُ» (pos 16) to w14 אַפּוֹ (H639).
 *   8. Maps «فَإِنَّهُ» (pos 17) to w15 כִּי (H3588) with secondary w18 הוּא (H1931).
 *   9. Maps «يُسَرُّ» (pos 18) to w16 חָפֵץ (H2654).
 *  10. Maps «بِالرَّأْفَةِ» (pos 19) to w17 חֶסֶד (H2617), eliminating out-of-bounds locator w19.
 *  11. Populates construct/absolute nominal states for all 10 nominal positions.
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

console.log('--- APPLYING MICAH 7:18 CALIBRATION (BATCH 2L) ---');

const vId = q(`SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 7 AND verse_num = 18;`);
if (!vId) throw new Error('Verse Micah 7:18 not found in database!');
console.log('Verse ID:', vId);

// 1. pos 1: «مَنْ» -> w1 מִי (H4310, HTi)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H4310',
    orig_surface = 'מִי',
    orig_word = 'מִי',
    orig_word_position = 1,
    orig_morphology = 'HTi',
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
    verified_locator = 'OSHB:B33.C7.V18.w1',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 1;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 1);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 1), 'H4310', 1, 'primary', 'מִי', 1, 'HTi', 'oshb_wlc');
`);

// 2. pos 2: «هُوَ» -> Arabic syntactic copula
q(`
  UPDATE word_mappings SET
    strongs_id = NULL,
    orig_surface = '—',
    orig_word = '—',
    orig_word_position = NULL,
    orig_morphology = NULL,
    morph_pos = 'pronoun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = NULL,
    morph_number = NULL,
    morph_case = NULL,
    relation_type = 'syntactic_copula',
    grammar_notes = NULL,
    verified_locator = 'AR_SYNTACTIC:B33.C7.V18.w2',
    verified_source = 'oshb_wlc',
    is_verified = 0
  WHERE verse_id = '${vId}' AND ar_word_position = 2;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 2);
`);

// 3. pos 3: «إِلهٌ» -> w2 אֵ֣ל (H410, HNcmsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H410',
    orig_surface = 'אֵ֣ל',
    orig_word = 'אֵל',
    orig_word_position = 2,
    orig_morphology = 'HNcmsa',
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
    verified_locator = 'OSHB:B33.C7.V18.w2',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 3;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 3);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 3), 'H410', 1, 'primary', 'אֵ֣ל', 2, 'HNcmsa', 'oshb_wlc');
`);

// 4. pos 4: «مِثْلُكَ» -> w3 כָּמ֗וֹךָ (H3644, HR/Sp2ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3644',
    orig_surface = 'כָּמ֗וֹךָ',
    orig_word = 'כְּמוֹ',
    orig_word_position = 3,
    orig_morphology = 'HR/Sp2ms',
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
    grammar_notes = NULL,
    verified_locator = 'OSHB:B33.C7.V18.w3',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 4;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 4);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 4), 'H3644', 1, 'primary', 'כָּמ֗וֹךָ', 3, 'HR/Sp2ms', 'oshb_wlc');
`);

// 5. pos 5: «غَافِرٌ» -> w4 נֹשֵׂ֤א (H5375, HVqrmsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5375',
    orig_surface = 'נֹשֵׂ֤א',
    orig_word = 'נָשָׂא',
    orig_word_position = 4,
    orig_morphology = 'HVqrmsa',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = NULL,
    morph_voice = 'active',
    morph_mood = 'participle',
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B33.C7.V18.w4',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 5;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 5);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 5), 'H5375', 1, 'primary', 'נֹשֵׂ֤א', 4, 'HVqrmsa', 'oshb_wlc');
`);

// 6. pos 6: «الإِثْمَ» -> w5 עָוֺן֙ (H5771, HNcbsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5771',
    orig_surface = 'עָוֺן֙',
    orig_word = 'עָוֺן',
    orig_word_position = 5,
    orig_morphology = 'HNcbsa',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'common',
    morph_number = 'singular',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B33.C7.V18.w5',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 6;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 6);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 6), 'H5771', 1, 'primary', 'עָוֺן֙', 5, 'HNcbsa', 'oshb_wlc');
`);

// 7. pos 7: «وَصَافِحٌ» -> w6 וְעֹבֵ֣ר (H5674, HC/Vqrmsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5674',
    orig_surface = 'וְעֹבֵ֣ר',
    orig_word = 'עָבַר',
    orig_word_position = 6,
    orig_morphology = 'HC/Vqrmsa',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = NULL,
    morph_voice = 'active',
    morph_mood = 'participle',
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'absolute',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B33.C7.V18.w6',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 7;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7), 'H5674', 1, 'primary', 'וְעֹבֵ֣ר', 6, 'HC/Vqrmsa', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 7), 'H9002', 2, 'secondary', 'וְ', 6, 'HC', 'oshb_wlc');
`);

// 8. pos 8: «عَنِ» -> w7 עַל (H5921, HR)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5921',
    orig_surface = 'עַל',
    orig_word = 'עַל',
    orig_word_position = 7,
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
    verified_locator = 'OSHB:B33.C7.V18.w7',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 8;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 8), 'H5921', 1, 'primary', 'עַל', 7, 'HR', 'oshb_wlc');
`);

// 9. pos 9: «الذَّنْبِ» -> w8 פֶּ֔שַׁע (H6588, HNcmsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H6588',
    orig_surface = 'פֶּ֔שַׁע',
    orig_word = 'פֶּשַׁע',
    orig_word_position = 8,
    orig_morphology = 'HNcmsa',
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
    verified_locator = 'OSHB:B33.C7.V18.w8',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 9;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 9), 'H6588', 1, 'primary', 'פֶּ֔שַׁע', 8, 'HNcmsa', 'oshb_wlc');
`);

// 10. pos 10: «لِبَقِيَّةِ» -> w9 לִשְׁאֵרִ֖ית (H7611, HR/Ncfsc)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H7611',
    orig_surface = 'לִשְׁאֵרִ֖ית',
    orig_word = 'שְׁאֵרִית',
    orig_word_position = 9,
    orig_morphology = 'HR/Ncfsc',
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
    verified_locator = 'OSHB:B33.C7.V18.w9',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 10;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10), 'H7611', 1, 'primary', 'לִשְׁאֵרִ֖ית', 9, 'HR/Ncfsc', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 10), 'H9005', 2, 'secondary', 'לִ', 9, 'HR', 'oshb_wlc');
`);

// 11. pos 11: «مِيرَاثِهِ» -> w10 נַחֲלָת֑וֹ (H5159, HNcfsc/Sp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5159',
    orig_surface = 'נַחֲלָת֑וֹ',
    orig_word = 'נַחֲלָה',
    orig_word_position = 10,
    orig_morphology = 'HNcfsc/Sp3ms',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = '3',
    morph_gender = 'feminine',
    morph_number = 'singular',
    morph_case = 'construct',
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B33.C7.V18.w10',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 11;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 11), 'H5159', 1, 'primary', 'נַחֲלָת֑וֹ', 10, 'HNcfsc/Sp3ms', 'oshb_wlc');
`);

// 12. pos 12: «لاَ» -> w11 לֹא (H3808, HTn)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3808',
    orig_surface = 'לֹא',
    orig_word = 'לֹא',
    orig_word_position = 11,
    orig_morphology = 'HTn',
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
    verified_locator = 'OSHB:B33.C7.V18.w11',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 12;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 12);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 12), 'H3808', 1, 'primary', 'לֹא', 11, 'HTn', 'oshb_wlc');
`);

// 13. pos 13: «يَحْفَظُ» -> w12 הֶחֱזִ֤יק (H2388, HVhp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H2388',
    orig_surface = 'הֶחֱזִ֤יק',
    orig_word = 'חָזַק',
    orig_word_position = 12,
    orig_morphology = 'HVhp3ms',
    morph_pos = 'verb',
    morph_stem = 'hiphil',
    morph_tense = 'qatal',
    morph_voice = 'active',
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B33.C7.V18.w12',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 13;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 13), 'H2388', 1, 'primary', 'הֶחֱזִ֤יק', 12, 'HVhp3ms', 'oshb_wlc');
`);

// 14. pos 14: «إِلَى» -> w13 לָעַד֙ (H9005, HR)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H9005',
    orig_surface = 'לָעַד֙',
    orig_word = 'לְ',
    orig_word_position = 13,
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
    grammar_notes = 'Preposition prefix לָ of prepositional phrase לָעַד (H9005 + H5703)',
    verified_locator = 'OSHB:B33.C7.V18.w13',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 14;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 14);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 14), 'H9005', 1, 'primary', 'לָעַד֙', 13, 'HR', 'oshb_wlc');
`);

// 15. pos 15: «الأَبَدِ» -> w13 לָעַד֙ (H5703, HR/Ncmsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H5703',
    orig_surface = 'לָעַד֙',
    orig_word = 'עַד',
    orig_word_position = 13,
    orig_morphology = 'HR/Ncmsa',
    morph_pos = 'noun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'absolute',
    relation_type = 'compound_phrase',
    grammar_notes = 'Temporal noun עַד with preposition prefix לָ in phrase לָעַד (H9005 + H5703)',
    verified_locator = 'OSHB:B33.C7.V18.w13',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 15;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15), 'H5703', 1, 'primary', 'לָעַד֙', 13, 'HR/Ncmsa', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 15), 'H9005', 2, 'secondary', 'לָ', 13, 'HR', 'oshb_wlc');
`);

// 16. pos 16: «غَضَبَهُ» -> w14 אַפּ֔וֹ (H639, HNcmsc/Sp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H639',
    orig_surface = 'אַפּ֔וֹ',
    orig_word = 'אַף',
    orig_word_position = 14,
    orig_morphology = 'HNcmsc/Sp3ms',
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
    verified_locator = 'OSHB:B33.C7.V18.w14',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 16;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 16);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 16), 'H639', 1, 'primary', 'אַפּ֔וֹ', 14, 'HNcmsc/Sp3ms', 'oshb_wlc');
`);

// 17. pos 17: «فَإِنَّهُ» -> w15 כִּֽי (H3588, HC) + w18 הֽוּא (H1931, HPp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H3588',
    orig_surface = 'כִּֽי',
    orig_word = 'כִּי',
    orig_word_position = 15,
    orig_morphology = 'HC',
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
    grammar_notes = NULL,
    verified_locator = 'OSHB:B33.C7.V18.w15',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 17;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 17);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 17), 'H3588', 1, 'primary', 'כִּֽי', 15, 'HC', 'oshb_wlc'),
    ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 17), 'H1931', 2, 'secondary', 'הֽוּא', 18, 'HPp3ms', 'oshb_wlc');
`);

// 18. pos 18: «يُسَرُّ» -> w16 חָפֵ֥ץ (H2654, HVqp3ms)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H2654',
    orig_surface = 'חָפֵ֥ץ',
    orig_word = 'חָפֵץ',
    orig_word_position = 16,
    orig_morphology = 'HVqp3ms',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = 'qatal',
    morph_voice = 'active',
    morph_mood = 'indicative',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = NULL,
    relation_type = 'primary',
    grammar_notes = NULL,
    verified_locator = 'OSHB:B33.C7.V18.w16',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 18;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 18);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 18), 'H2654', 1, 'primary', 'חָפֵ֥ץ', 16, 'HVqp3ms', 'oshb_wlc');
`);

// 19. pos 19: «بِالرَّأْفَةِ» -> w17 חֶ֖סֶד (H2617, HNcmsa)
q(`
  UPDATE word_mappings SET
    strongs_id = 'H2617',
    orig_surface = 'חֶ֖סֶד',
    orig_word = 'חֵסֵד',
    orig_word_position = 17,
    orig_morphology = 'HNcmsa',
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
    verified_locator = 'OSHB:B33.C7.V18.w17',
    verified_source = 'oshb_wlc',
    is_verified = 1
  WHERE verse_id = '${vId}' AND ar_word_position = 19;

  DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 19);
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES ((SELECT id FROM word_mappings WHERE verse_id = '${vId}' AND ar_word_position = 19), 'H2617', 1, 'primary', 'חֶ֖סֶד', 17, 'HNcmsa', 'oshb_wlc');
`);

console.log('Successfully applied Micah 7:18 full verse calibration across all 19 Arabic records and 18 Hebrew tokens.');
