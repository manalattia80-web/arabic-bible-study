/**
 * apply_round2_batch2j_isa41_10.cjs
 * Calibrate Isaiah 41:10 full verse (14 Arabic word records against 17 Hebrew OSHB tokens).
 *
 * Alignments:
 *   w1: אַל (lemma 408, HTn) -> #1 لاَ (H408, HTn, w1)
 *   w2: תִּירָא֙ (lemma 3372, HVqj2ms) -> #2 تَخَفْ (H3372, HVqj2ms, w2)
 *   w3: כִּ֣י (lemma 3588 a, HC) + w5 אָ֔נִי (lemma 589, HPp1cs) ->
 *       #3 لأَنِّي: primary H3588 כִּ֣י@w3 + secondary H589 אָ֔נִי@w5
 *   w4: עִמְּ/ךָ (lemma 5973 a, HR/Sp2ms) -> #4 مَعَكَ (H5973, HR/Sp2ms, w4)
 *   w6: אַל (lemma 408, HTn) -> #5 لاَ (H408, HTn, w6) [Corrected from displaced w5]
 *   w7: תִּשְׁתָּ֖ע (lemma 8159, HVqj2ms) -> #6 تَتَلَفَّتْ (H8159, HVqj2ms, w7) [Corrected from displaced w6]
 *   w8: כִּֽי (lemma 3588 a, HC) + w9 אֲנִ֣י (lemma 589, HPp1cs) ->
 *       #7 لأَنِّي: primary H3588 כִּֽי@w8 + secondary H589 אֲנִ֣י@w9 [Corrected from displaced w7]
 *   w10: אֱלֹהֶ֑י/ךָ (lemma 430, HNcmpc/Sp2ms) -> #8 إِلهُكَ (H430, HNcmpc/Sp2ms, construct, w10) [Corrected from displaced w8]
 *   --: [aspect/affirmation particle] -> #9 قَدْ (syntactic_ar, aspect_particle, AR_SYNTACTIC:B23.C41.V10.w9)
 *   w11: אִמַּצְתִּ֨י/ךָ֙ (lemma 553, HVpp1cs/Sp2ms) -> #10 أَيَّدْتُكَ (H553, HVpp1cs/Sp2ms, w11) [Corrected from displaced w10]
 *   w12: אַף (lemma 637, HTa) + w13 עֲזַרְתִּ֔י/ךָ (lemma 5826, HVqp1cs/Sp2ms) ->
 *       #11 وَأَعَنْتُكَ: primary H5826 עֲזַרְתִּ֔יךָ@w13 + secondary H637 אַף@w12 [Corrected from displaced w11]
 *   w14: אַף (lemma 637, HTa) + w15 תְּמַכְתִּ֖י/ךָ (lemma 8551, HVqp1cs/Sp2ms) ->
 *       #12 وَعَضَدْتُكَ: primary H8551 תְּמַכְתִּ֖יךָ@w15 + secondary H637 אַף@w14 [Corrected from displaced w12]
 *   w16: בִּ/ימִ֥ין (lemma b/3225, HR/Ncfsc) ->
 *       #13 بِيَمِينِ: primary H3225 בִּימִ֥ין@w16 (construct) + secondary H9003 בִּ@w16 [Corrected from displaced w13]
 *   w17: צִדְקִֽ/י (lemma 6664, HNcmsc/Sp1cs) -> #14 بِرِّي (H6664, HNcmsc/Sp1cs, construct, w17) [Corrected from displaced w14]
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = process.env.AUDIT_DB_PATH || path.join(repoRoot, 'mobile/assets/bible_study.db');

function runSql(sql) {
  execFileSync(sqlitePath, [dbPath], { input: sql, stdio: ['pipe', 'inherit', 'inherit'] });
}

function queryJson(sql) {
  const out = execFileSync(sqlitePath, [dbPath, '-json'], { input: sql, encoding: 'utf8' }).trim();
  return out ? JSON.parse(out) : [];
}

console.log(`Applying Round 2 Batch 2J calibration to Isaiah 41:10 in: ${dbPath}`);

const verseRows = queryJson("SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 41 AND verse_num = 10");
if (!verseRows.length) throw new Error("Isaiah 41:10 verse not found in database!");
const verseId = verseRows[0].id;
console.log(`Isaiah 41:10 verse_id = ${verseId}`);

const mappingRows = queryJson(`SELECT id, ar_word_position, ar_word FROM word_mappings WHERE verse_id = '${verseId}' ORDER BY ar_word_position`);
if (mappingRows.length !== 14) {
  throw new Error(`Expected 14 word mappings for Isaiah 41:10, found ${mappingRows.length}`);
}

const mapByPos = {};
mappingRows.forEach(m => { mapByPos[m.ar_word_position] = m; });

const updateSql = `
BEGIN TRANSACTION;

-- #1 لاَ (w1: אַל - H408 - HTn)
UPDATE word_mappings SET
  orig_word_position = 1,
  strongs_id = 'H408',
  orig_word = 'אַל',
  orig_surface = 'אַל',
  verified_locator = 'OSHB:B23.C41.V10.w1',
  orig_morphology = 'HTn',
  morph_pos = 'particle',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = NULL,
  morph_gender = NULL,
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = NULL
WHERE verse_id = '${verseId}' AND ar_word_position = 1;

-- #2 تَخَفْ (w2: תִּירָא֙ - H3372 - HVqj2ms)
UPDATE word_mappings SET
  orig_word_position = 2,
  strongs_id = 'H3372',
  orig_word = 'יָרֵא',
  orig_surface = 'תִּירָא֙',
  verified_locator = 'OSHB:B23.C41.V10.w2',
  orig_morphology = 'HVqj2ms',
  morph_pos = 'verb',
  morph_stem = 'qal',
  morph_tense = 'yiqtol',
  morph_mood = 'jussive',
  morph_voice = 'active',
  morph_person = '2',
  morph_number = 'singular',
  morph_gender = 'masculine',
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = NULL
WHERE verse_id = '${verseId}' AND ar_word_position = 2;

-- #3 لأَنِّي (w3 כִּ֣י [H3588, HC] + w5 אָ֔נִי [H589, HPp1cs])
UPDATE word_mappings SET
  orig_word_position = 3,
  strongs_id = 'H3588',
  orig_word = 'כִּי',
  orig_surface = 'כִּ֣י',
  verified_locator = 'OSHB:B23.C41.V10.w3',
  orig_morphology = 'HC',
  morph_pos = 'conjunction',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_mood = NULL,
  morph_voice = NULL,
  morph_person = NULL,
  morph_number = NULL,
  morph_gender = NULL,
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = 'compound_phrase',
  grammar_notes = 'حرف التعليل כִּ֣י (H3588) بالموضع w3 مع ضمير المتكلم المستقل אָ֔נִי (H589) بالموضع w5 يقابلان معاً التركيب العربي «لأَنِّي».'
WHERE verse_id = '${verseId}' AND ar_word_position = 3;

-- #4 مَعَكَ (w4: עִמְּ/ךָ - H5973 - HR/Sp2ms)
UPDATE word_mappings SET
  orig_word_position = 4,
  strongs_id = 'H5973',
  orig_word = 'עִם',
  orig_surface = 'עִמְּךָ',
  verified_locator = 'OSHB:B23.C41.V10.w4',
  orig_morphology = 'HR/Sp2ms',
  morph_pos = 'preposition',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_mood = NULL,
  morph_voice = NULL,
  morph_person = NULL,
  morph_number = NULL,
  morph_gender = NULL,
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = NULL
WHERE verse_id = '${verseId}' AND ar_word_position = 4;

-- #5 لاَ (w6: אַל - H408 - HTn)
UPDATE word_mappings SET
  orig_word_position = 6,
  strongs_id = 'H408',
  orig_word = 'אַל',
  orig_surface = 'אַל',
  verified_locator = 'OSHB:B23.C41.V10.w6',
  orig_morphology = 'HTn',
  morph_pos = 'particle',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_mood = NULL,
  morph_voice = NULL,
  morph_person = NULL,
  morph_number = NULL,
  morph_gender = NULL,
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'أداة النهي אַל (H408) في الموضع w6، صححت من الإزاحة الخاطئة إلى w5 (אָנִי).'
WHERE verse_id = '${verseId}' AND ar_word_position = 5;

-- #6 تَتَلَفَّتْ (w7: תִּשְׁתָּ֖ע - H8159 - HVqj2ms)
UPDATE word_mappings SET
  orig_word_position = 7,
  strongs_id = 'H8159',
  orig_word = 'שָׁעָה',
  orig_surface = 'תִּשְׁתָּ֖ע',
  verified_locator = 'OSHB:B23.C41.V10.w7',
  orig_morphology = 'HVqj2ms',
  morph_pos = 'verb',
  morph_stem = 'qal',
  morph_tense = 'yiqtol',
  morph_mood = 'jussive',
  morph_voice = 'active',
  morph_person = '2',
  morph_number = 'singular',
  morph_gender = 'masculine',
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'فعل مجزوم תִּשְׁתָּ֖ע من الجذر שָׁעָה (H8159) في الموضع w7، صحح من الإزاحة الخاطئة إلى w6.'
WHERE verse_id = '${verseId}' AND ar_word_position = 6;

-- #7 لأَنِّي (w8 כִּֽי [H3588, HC] + w9 אֲנִ֣י [H589, HPp1cs])
UPDATE word_mappings SET
  orig_word_position = 8,
  strongs_id = 'H3588',
  orig_word = 'כִּי',
  orig_surface = 'כִּֽי',
  verified_locator = 'OSHB:B23.C41.V10.w8',
  orig_morphology = 'HC',
  morph_pos = 'conjunction',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_mood = NULL,
  morph_voice = NULL,
  morph_person = NULL,
  morph_number = NULL,
  morph_gender = NULL,
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = 'compound_phrase',
  grammar_notes = 'حرف التعليل כִּֽי (H3588) بالموضع w8 مع ضمير المتكلم المستقل אֲנִ֣י (H589) بالموضع w9 يقابلان معاً التركيب العربي «لأَنِّي».'
WHERE verse_id = '${verseId}' AND ar_word_position = 7;

-- #8 إِلهُكَ (w10: אֱלֹהֶ֑י/ךָ - H430 - HNcmpc/Sp2ms)
UPDATE word_mappings SET
  orig_word_position = 10,
  strongs_id = 'H430',
  orig_word = 'אֱלֹהִים',
  orig_surface = 'אֱלֹהֶ֑יךָ',
  verified_locator = 'OSHB:B23.C41.V10.w10',
  orig_morphology = 'HNcmpc/Sp2ms',
  morph_pos = 'noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_mood = NULL,
  morph_voice = NULL,
  morph_person = NULL,
  morph_number = 'plural',
  morph_gender = 'masculine',
  morph_case = 'construct',
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'اسم الجمع אֱלֹהִים (H430) في حالة الإضافة مع ضمير المخاطب في الموضع w10، صحح من الإزاحة الخاطئة إلى w8.'
WHERE verse_id = '${verseId}' AND ar_word_position = 8;

-- #9 قَدْ (syntactic_ar)
UPDATE word_mappings SET
  orig_word_position = 0,
  strongs_id = NULL,
  orig_word = '—',
  orig_surface = '—',
  verified_locator = 'AR_SYNTACTIC:B23.C41.V10.w9',
  orig_morphology = NULL,
  morph_pos = 'syntactic_ar',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_mood = NULL,
  morph_voice = NULL,
  morph_person = NULL,
  morph_number = NULL,
  morph_gender = NULL,
  morph_case = NULL,
  morph_source = 'syntactic_ar',
  relation_type = 'aspect_particle',
  grammar_notes = 'حرف تحقيق وتأكيد مصاحب للماضي في الترجمة العربية.'
WHERE verse_id = '${verseId}' AND ar_word_position = 9;

-- #10 أَيَّدْتُكَ (w11: אִמַּצְתִּ֨י/ךָ֙ - H553 - HVpp1cs/Sp2ms)
UPDATE word_mappings SET
  orig_word_position = 11,
  strongs_id = 'H553',
  orig_word = 'אָמַץ',
  orig_surface = 'אִמַּצְתִּ֨יךָ֙',
  verified_locator = 'OSHB:B23.C41.V10.w11',
  orig_morphology = 'HVpp1cs/Sp2ms',
  morph_pos = 'verb',
  morph_stem = 'piel',
  morph_tense = 'qatal',
  morph_mood = 'indicative',
  morph_voice = 'active',
  morph_person = '1',
  morph_number = 'singular',
  morph_gender = 'common',
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'فعل بيعل אִמַּצְתִּ֨יךָ من الجذر אָמַץ (H553) مع ضمير المخاطب في الموضع w11، صحح من الإزاحة الخاطئة إلى w10.'
WHERE verse_id = '${verseId}' AND ar_word_position = 10;

-- #11 وَأَعَنْتُكَ (w13: עֲזַרְתִּ֔י/ךָ [H5826, HVqp1cs/Sp2ms] + w12: אַף [H637, HTa])
UPDATE word_mappings SET
  orig_word_position = 13,
  strongs_id = 'H5826',
  orig_word = 'עָזַר',
  orig_surface = 'עֲזַרְתִּ֔יךָ',
  verified_locator = 'OSHB:B23.C41.V10.w13',
  orig_morphology = 'HVqp1cs/Sp2ms',
  morph_pos = 'verb',
  morph_stem = 'qal',
  morph_tense = 'qatal',
  morph_mood = 'indicative',
  morph_voice = 'active',
  morph_person = '1',
  morph_number = 'singular',
  morph_gender = 'common',
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = 'compound_phrase',
  grammar_notes = 'الفعل العبري עֲזַרְתִּ֔יךָ (H5826) مسبوق بأداة التأكيد والعطف אַף (H637) في الموضع w12 التي تقابل واو العطف في «وَأَعَنْتُكَ».'
WHERE verse_id = '${verseId}' AND ar_word_position = 11;

-- #12 وَعَضَدْتُكَ (w15: תְּמַכְתִּ֖י/ךָ [H8551, HVqp1cs/Sp2ms] + w14: אַף [H637, HTa])
UPDATE word_mappings SET
  orig_word_position = 15,
  strongs_id = 'H8551',
  orig_word = 'תָּמַךְ',
  orig_surface = 'תְּמַכְתִּ֖יךָ',
  verified_locator = 'OSHB:B23.C41.V10.w15',
  orig_morphology = 'HVqp1cs/Sp2ms',
  morph_pos = 'verb',
  morph_stem = 'qal',
  morph_tense = 'qatal',
  morph_mood = 'indicative',
  morph_voice = 'active',
  morph_person = '1',
  morph_number = 'singular',
  morph_gender = 'common',
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = 'compound_phrase',
  grammar_notes = 'الفعل العبري תְּמַכְתִּ֖יךָ (H8551) مسبوق بأداة التأكيد والعطف אַף (H637) في الموضع w14 التي تقابل واو العطف في «وَعَضَدْتُكَ».'
WHERE verse_id = '${verseId}' AND ar_word_position = 12;

-- #13 بِيَمِينِ (w16: בִּ/ימִ֥ין - H3225 + H9003 - HR/Ncfsc)
UPDATE word_mappings SET
  orig_word_position = 16,
  strongs_id = 'H3225',
  orig_word = 'יָמִין',
  orig_surface = 'בִּימִ֥ין',
  verified_locator = 'OSHB:B23.C41.V10.w16',
  orig_morphology = 'HR/Ncfsc',
  morph_pos = 'noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_mood = NULL,
  morph_voice = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'feminine',
  morph_case = 'construct',
  morph_source = 'oshb_wlc',
  relation_type = 'compound_phrase',
  grammar_notes = 'الاسم العبري יָמִין (H3225) في حالة الإضافة مسبوق بحرف الجر בְּ (H9003) في בִּימִ֥ין بالموضع w16، صحح من الإزاحة الخاطئة إلى w13.'
WHERE verse_id = '${verseId}' AND ar_word_position = 13;

-- #14 بِرِّي (w17: צִדְקִֽ/י - H6664 - HNcmsc/Sp1cs)
UPDATE word_mappings SET
  orig_word_position = 17,
  strongs_id = 'H6664',
  orig_word = 'צֶדֶק',
  orig_surface = 'צִדְקִֽי',
  verified_locator = 'OSHB:B23.C41.V10.w17',
  orig_morphology = 'HNcmsc/Sp1cs',
  morph_pos = 'noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_mood = NULL,
  morph_voice = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'masculine',
  morph_case = 'construct',
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'الاسم العبري צֶדֶק (H6664) مع ضمير المتكلم في الموضع w17، صحح من الإزاحة الخاطئة إلى w14.'
WHERE verse_id = '${verseId}' AND ar_word_position = 14;

COMMIT;
`;

runSql(updateSql);

const wmsSql = `
BEGIN TRANSACTION;

DELETE FROM word_mapping_strongs WHERE mapping_id IN (
  SELECT id FROM word_mappings WHERE verse_id = '${verseId}'
);

-- #1 لاَ
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[1].id}', 'H408', 1, 'primary', 'אַל', 1, 'HTn', 'oshb_wlc');

-- #2 تَخَفْ
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[2].id}', 'H3372', 1, 'primary', 'תִּירָא֙', 2, 'HVqj2ms', 'oshb_wlc');

-- #3 لأَنِّي (primary H3588@w3 + secondary H589@w5)
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[3].id}', 'H3588', 1, 'primary', 'כִּ֣י', 3, 'HC', 'oshb_wlc');
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[3].id}', 'H589', 2, 'secondary', 'אָ֔נִי', 5, 'HPp1cs', 'oshb_wlc');

-- #4 مَعَكَ
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[4].id}', 'H5973', 1, 'primary', 'עִמְּךָ', 4, 'HR/Sp2ms', 'oshb_wlc');

-- #5 لاَ
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[5].id}', 'H408', 1, 'primary', 'אַל', 6, 'HTn', 'oshb_wlc');

-- #6 تَتَلَفَّتْ
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[6].id}', 'H8159', 1, 'primary', 'תִּשְׁתָּ֖ע', 7, 'HVqj2ms', 'oshb_wlc');

-- #7 لأَنِّي (primary H3588@w8 + secondary H589@w9)
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[7].id}', 'H3588', 1, 'primary', 'כִּֽי', 8, 'HC', 'oshb_wlc');
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[7].id}', 'H589', 2, 'secondary', 'אֲנִ֣י', 9, 'HPp1cs', 'oshb_wlc');

-- #8 إِلهُكَ
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[8].id}', 'H430', 1, 'primary', 'אֱלֹהֶ֑יךָ', 10, 'HNcmpc/Sp2ms', 'oshb_wlc');

-- #9 قَدْ (syntactic_ar - no row in word_mapping_strongs)

-- #10 أَيَّدْتُكَ
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[10].id}', 'H553', 1, 'primary', 'אִמַּצְתִּ֨יךָ֙', 11, 'HVpp1cs/Sp2ms', 'oshb_wlc');

-- #11 وَأَعَنْتُكَ (primary H5826@w13 + secondary H637@w12)
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[11].id}', 'H5826', 1, 'primary', 'עֲזַרְתִּ֔יךָ', 13, 'HVqp1cs/Sp2ms', 'oshb_wlc');
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[11].id}', 'H637', 2, 'secondary', 'אַף', 12, 'HTa', 'oshb_wlc');

-- #12 وَعَضَدْتُكَ (primary H8551@w15 + secondary H637@w14)
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[12].id}', 'H8551', 1, 'primary', 'תְּמַכְתִּ֖יךָ', 15, 'HVqp1cs/Sp2ms', 'oshb_wlc');
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[12].id}', 'H637', 2, 'secondary', 'אַף', 14, 'HTa', 'oshb_wlc');

-- #13 بِيَمِينِ (primary H3225@w16 + secondary H9003@w16)
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[13].id}', 'H3225', 1, 'primary', 'בִּימִ֥ין', 16, 'HR/Ncfsc', 'oshb_wlc');
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[13].id}', 'H9003', 2, 'secondary', 'בִּ', 16, 'HR', 'oshb_wlc');

-- #14 بِرِّي
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[14].id}', 'H6664', 1, 'primary', 'צִדְקִֽי', 17, 'HNcmsc/Sp1cs', 'oshb_wlc');

COMMIT;
`;

runSql(wmsSql);

console.log("Successfully calibrated Isaiah 41:10 across all 14 Arabic words and 17 OSHB tokens.");
