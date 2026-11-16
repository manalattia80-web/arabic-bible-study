/**
 * apply_round2_batch2i_ezra4_24.cjs
 * Calibrate Ezra 4:24 full verse (18 Arabic word records against 16 Aramaic OSHB tokens).
 *
 * Alignments:
 *   w1: בֵּאדַ֗יִן (lemma b/116, AR/D) -> #1 حِينَئِذٍ (H116, AR/D, w1)
 *   w2: בְּטֵلַת֙ (lemma 989, AVqp3fs) -> #2 تَوَقَّفَ (H989, AVqp3fs, w2)
 *   w3: עֲבִידַ֣ת (lemma 5673, ANcfsc) -> #3 عَمَلُ (H5673, ANcfsc, w3) [Corrected from H5648 to H5673 עֲבִידָה]
 *   w4: בֵּית (lemma 1005, ANcmsc) -> #4 بَيْتِ (H1005, ANcmsc, w4)
 *   w5: אֱלָהָ֔א (lemma 426, ANcmsd/Td) -> #5 اللهِ (H426, ANcmsd/Td, w5)
 *   w6: דִּ֖י (lemma 1768, ATr) -> #6 الَّذِي (H1768, ATr, w6)
 *   w7: בִּ/ירוּשְׁלֶ֑ם (lemma b/3390, AR/Np) ->
 *       #7 فِي: H9003 prefix בְּ / AR (compound_phrase to w7)
 *       #8 أُورُشَلِيمَ: H3390 יְרוּשָׁלֵם / AR/Np (compound_phrase to w7, primary H3390 + secondary H9003)
 *   w8: וַ/הֲוָת֙ (lemma c/1934, AC/Vqp3fs) -> #9 وَكَانَ (H1934, AC/Vqp3fs, w8, primary H1934 + secondary H9002)
 *   w9: בָּֽטְלָ֔א (lemma 989, AVqrfsa) -> #10 مُتَوَقِّفًا (H989, AVqrfsa, w9)
 *   w10: עַ֚ד (lemma 5705, AR) -> #11 إِلَى (H5705, AR, w10)
 *   w11: שְׁנַ֣ת (lemma 8140, ANcfsc) -> #12 السَّنَةِ (H8140, ANcfsc, w11) [Corrected from H8139 to Aramaic H8140 שְׁנָה]
 *   w12: תַּרְתֵּ֔ין (lemma 8648, AAocpa) -> #13 الثَّانِيَةِ (H8648, AAocpa, w12) [Corrected from H8524 to Aramaic numeral H8648 תְּרֵין]
 *   w13: לְ/מַלְכ֖וּת (lemma l/4437, AR/Ncfsc) ->
 *       #14 مِنْ: H9005 prefix לְ / AR (compound_phrase to w13)
 *       #15 مُلْكِ: H4437 מַלְכוּ / AR/Ncfsc (compound_phrase to w13, primary H4437 + secondary H9005)
 *   w14: דָּרְיָ֥וֶשׁ (lemma 1868, ANp) -> #16 دَارِيُوسَ (H1868, ANp, w14)
 *   w15: מֶֽלֶךְ (lemma 4430, ANcmsc) -> #17 مَلِكِ (H4430, ANcmsc, w15) [Corrected from w17 to w15]
 *   w16: פָּרָֽס (lemma 6540, ANp) -> #18 فَارِسَ (H6540, ANp, w16) [Corrected from w18/H6543 to w16/H6540 פָּרַס]
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

console.log(`Applying Round 2 Batch 2I calibration to Ezra 4:24 in: ${dbPath}`);

const verseRows = queryJson("SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 24");
if (!verseRows.length) throw new Error("Ezra 4:24 verse not found in database!");
const verseId = verseRows[0].id;
console.log(`Ezra 4:24 verse_id = ${verseId}`);

const sql = `
BEGIN TRANSACTION;

-- Clean existing word_mapping_strongs for Ezra 4:24
DELETE FROM word_mapping_strongs WHERE mapping_id IN (
  SELECT id FROM word_mappings WHERE verse_id = '${verseId}'
);

-- #1 حِينَئِذٍ (w1: בֵּאדַ֗יִن - H116 - AR/D)
UPDATE word_mappings SET
  orig_word_position = 1,
  strongs_id = 'H116',
  orig_word = 'אֱדַיִן',
  orig_surface = 'בֵּאדַ֗יִן',
  verified_locator = 'OSHB:B15.C4.V24.w1',
  orig_morphology = 'AR/D',
  morph_pos = 'adverb',
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

-- #2 تَوَقَّفَ (w2: בְּטֵלַת֙ - H989 - AVqp3fs)
UPDATE word_mappings SET
  orig_word_position = 2,
  strongs_id = 'H989',
  orig_word = 'בְּטֵל',
  orig_surface = 'בְּטֵלַת֙',
  verified_locator = 'OSHB:B15.C4.V24.w2',
  orig_morphology = 'AVqp3fs',
  morph_pos = 'verb',
  morph_stem = 'peal',
  morph_tense = 'qatal',
  morph_voice = 'active',
  morph_mood = 'indicative',
  morph_person = '3',
  morph_number = 'singular',
  morph_gender = 'feminine',
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = NULL
WHERE verse_id = '${verseId}' AND ar_word_position = 2;

-- #3 عَمَلُ (w3: עֲבִידַ֣ת - H5673 - ANcfsc)
UPDATE word_mappings SET
  orig_word_position = 3,
  strongs_id = 'H5673',
  orig_word = 'עֲבִידָה',
  orig_surface = 'עֲבִידַ֣ת',
  verified_locator = 'OSHB:B15.C4.V24.w3',
  orig_morphology = 'ANcfsc',
  morph_pos = 'noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'feminine',
  morph_case = 'construct',
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'اسم مؤنث آرامي עֲבִידָה (H5673) في حالة الإضافة (construct)، صحح من الإسناد السابق للفعل H5648.'
WHERE verse_id = '${verseId}' AND ar_word_position = 3;

-- #4 بَيْتِ (w4: בֵּית - H1005 - ANcmsc)
UPDATE word_mappings SET
  orig_word_position = 4,
  strongs_id = 'H1005',
  orig_word = 'בַּיִת',
  orig_surface = 'בֵּית',
  verified_locator = 'OSHB:B15.C4.V24.w4',
  orig_morphology = 'ANcmsc',
  morph_pos = 'noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'masculine',
  morph_case = 'construct',
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = NULL
WHERE verse_id = '${verseId}' AND ar_word_position = 4;

-- #5 اللهِ (w5: אֱלָהָ֔א - H426 - ANcmsd/Td)
UPDATE word_mappings SET
  orig_word_position = 5,
  strongs_id = 'H426',
  orig_word = 'אֱלָהּ',
  orig_surface = 'אֱלָהָ֔א',
  verified_locator = 'OSHB:B15.C4.V24.w5',
  orig_morphology = 'ANcmsd/Td',
  morph_pos = 'noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'masculine',
  morph_case = 'determined',
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = NULL
WHERE verse_id = '${verseId}' AND ar_word_position = 5;

-- #6 الَّذِي (w6: דִּ֖י - H1768 - ATr)
UPDATE word_mappings SET
  orig_word_position = 6,
  strongs_id = 'H1768',
  orig_word = 'דִּי',
  orig_surface = 'דִּ֖י',
  verified_locator = 'OSHB:B15.C4.V24.w6',
  orig_morphology = 'ATr',
  morph_pos = 'relative_pronoun',
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
WHERE verse_id = '${verseId}' AND ar_word_position = 6;

-- #7 فِي (w7: בִּ/ירוּשְׁלֶ֑ם - compound_phrase prefix בְּ - H9003 - AR)
UPDATE word_mappings SET
  orig_word_position = 7,
  strongs_id = 'H9003',
  orig_word = 'בְּ',
  orig_surface = 'בִּירוּשְׁלֶ֑ם',
  verified_locator = 'OSHB:B15.C4.V24.w7',
  orig_morphology = 'AR',
  morph_pos = 'preposition',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = NULL,
  morph_gender = NULL,
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = 'compound_phrase',
  grammar_notes = 'حرف الجر الآرامي المتصل (الباء) في בִּירוּשְׁלֶ֑ם (الموضع 7) دال على الظرفية المكانية، بينما الاسم العَلَم יְרוּשָׁלֵם يقابل الكلمة التالية «أُورُشَلِيمَ».'
WHERE verse_id = '${verseId}' AND ar_word_position = 7;

-- #8 أُورُشَلِيمَ (w7: בִּ/ירוּשְׁלֶ֑ם - compound_phrase noun H3390 + H9003 - AR/Np)
UPDATE word_mappings SET
  orig_word_position = 7,
  strongs_id = 'H3390',
  orig_word = 'יְרוּשָׁלֵם',
  orig_surface = 'בִּירוּשְׁלֶ֑ם',
  verified_locator = 'OSHB:B15.C4.V24.w7',
  orig_morphology = 'AR/Np',
  morph_pos = 'proper_noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = NULL,
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = 'compound_phrase',
  grammar_notes = 'اسم علم آرامي יְרוּשָׁלֵם (H3390) مسبوق بحرف الجر بـ (H9003) في בִּירוּשְׁלֶ֑ם (الموضع 7)، يشكل وحدة محاذاة مركبة مع كلمة «فِي» السابقة.'
WHERE verse_id = '${verseId}' AND ar_word_position = 8;

-- #9 وَكَانَ (w8: וַ/הֲוָת֙ - H1934 + H9002 - AC/Vqp3fs)
UPDATE word_mappings SET
  orig_word_position = 8,
  strongs_id = 'H1934',
  orig_word = 'הָוָא',
  orig_surface = 'וַהֲוָת֙',
  verified_locator = 'OSHB:B15.C4.V24.w8',
  orig_morphology = 'AC/Vqp3fs',
  morph_pos = 'verb',
  morph_stem = 'peal',
  morph_tense = 'qatal',
  morph_voice = 'active',
  morph_mood = 'indicative',
  morph_person = '3',
  morph_number = 'singular',
  morph_gender = 'feminine',
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'فعل آرامي הֲוָת מן הֲוָא (H1934) في صيغة الماضي المؤنث الغائب مع واو العطف المتصلة וְ (H9002).'
WHERE verse_id = '${verseId}' AND ar_word_position = 9;

-- #10 مُتَوَقِّفًا (w9: בָּֽטְלָ֔א - H989 - AVqrfsa)
UPDATE word_mappings SET
  orig_word_position = 9,
  strongs_id = 'H989',
  orig_word = 'בְּטֵל',
  orig_surface = 'בָּֽטְלָ֔א',
  verified_locator = 'OSHB:B15.C4.V24.w9',
  orig_morphology = 'AVqrfsa',
  morph_pos = 'verb',
  morph_stem = 'peal',
  morph_tense = NULL,
  morph_voice = 'active',
  morph_mood = 'participle',
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'feminine',
  morph_case = 'absolute',
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'اسم فاعل آرامي בָּטְלָא من الجذر בְּטֵל (H989) مؤنث مفرد مطلق.'
WHERE verse_id = '${verseId}' AND ar_word_position = 10;

-- #11 إِلَى (w10: עַ֚ד - H5705 - AR)
UPDATE word_mappings SET
  orig_word_position = 10,
  strongs_id = 'H5705',
  orig_word = 'עַד',
  orig_surface = 'עַ֚ד',
  verified_locator = 'OSHB:B15.C4.V24.w10',
  orig_morphology = 'AR',
  morph_pos = 'preposition',
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
WHERE verse_id = '${verseId}' AND ar_word_position = 11;

-- #12 السَّنَةِ (w11: שְׁנַ֣ת - H8140 - ANcfsc)
UPDATE word_mappings SET
  orig_word_position = 11,
  strongs_id = 'H8140',
  orig_word = 'שְׁנָה',
  orig_surface = 'שְׁנַ֣ת',
  verified_locator = 'OSHB:B15.C4.V24.w11',
  orig_morphology = 'ANcfsc',
  morph_pos = 'noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'feminine',
  morph_case = 'construct',
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'اسم مؤنث آرامي שְׁנָה (H8140) في حالة الإضافة (construct)، صحح من الإسناد العبري H8139.'
WHERE verse_id = '${verseId}' AND ar_word_position = 12;

-- #13 الثَّانِيَةِ (w12: תַּרְתֵּ֔ין - H8648 - AAocpa)
UPDATE word_mappings SET
  orig_word_position = 12,
  strongs_id = 'H8648',
  orig_word = 'תְּרֵין',
  orig_surface = 'תַּרְתֵּ֔ין',
  verified_locator = 'OSHB:B15.C4.V24.w12',
  orig_morphology = 'AAocpa',
  morph_pos = 'numeral',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = 'plural',
  morph_gender = 'common',
  morph_case = 'absolute',
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'عدد ترتيبي / وصفي آرامي תַּרְתֵּין من תְּרֵין (H8648)، صحح من الإسناد الخاطئ H8524 (תָּלַל).'
WHERE verse_id = '${verseId}' AND ar_word_position = 13;

-- #14 مِنْ (w13: לְ/מַלְכ֖וּת - compound_phrase prefix לְ - H9005 - AR)
UPDATE word_mappings SET
  orig_word_position = 13,
  strongs_id = 'H9005',
  orig_word = 'לְ',
  orig_surface = 'לְמַלְכ֖וּת',
  verified_locator = 'OSHB:B15.C4.V24.w13',
  orig_morphology = 'AR',
  morph_pos = 'preposition',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = NULL,
  morph_gender = NULL,
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = 'compound_phrase',
  grammar_notes = 'حرف الجر الآرامي المتصل (اللام) في לְמַלְכ֖וּת (الموضع 13) يفيد ابتداء الغاية / الإضافة في الصياغة العربية المقابلة «مِنْ»، بينما الاسم مַלְכוּ يقابل «مُلْكِ».'
WHERE verse_id = '${verseId}' AND ar_word_position = 14;

-- #15 مُلْكِ (w13: לְ/מַלְכ֖וּת - compound_phrase noun H4437 + H9005 - AR/Ncfsc)
UPDATE word_mappings SET
  orig_word_position = 13,
  strongs_id = 'H4437',
  orig_word = 'מַלְכוּ',
  orig_surface = 'לְמַלְכ֖וּת',
  verified_locator = 'OSHB:B15.C4.V24.w13',
  orig_morphology = 'AR/Ncfsc',
  morph_pos = 'noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'feminine',
  morph_case = 'construct',
  morph_source = 'oshb_wlc',
  relation_type = 'compound_phrase',
  grammar_notes = 'اسم مؤنث آرامي مַלְכוּ (H4437) في حالة الإضافة مسبوق بحرف الجر לְ (H9005) في לְמַלְכ֖וּת (الموضع 13)، يشكل وحدة محاذاة مركبة مع كلمة «مِنْ» السابقة.'
WHERE verse_id = '${verseId}' AND ar_word_position = 15;

-- #16 دَارِيُوسَ (w14: דָּרְיָ֥וֶשׁ - H1868 - ANp)
UPDATE word_mappings SET
  orig_word_position = 14,
  strongs_id = 'H1868',
  orig_word = 'דָּֽרְיָוֵשׁ',
  orig_surface = 'דָּרְיָ֥וֶשׁ',
  verified_locator = 'OSHB:B15.C4.V24.w14',
  orig_morphology = 'ANp',
  morph_pos = 'proper_noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'masculine',
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = NULL
WHERE verse_id = '${verseId}' AND ar_word_position = 16;

-- #17 مَلِكِ (w15: מֶֽלֶךְ - H4430 - ANcmsc)
UPDATE word_mappings SET
  orig_word_position = 15,
  strongs_id = 'H4430',
  orig_word = 'מֶלֶךְ',
  orig_surface = 'מֶֽלֶךְ',
  verified_locator = 'OSHB:B15.C4.V24.w15',
  orig_morphology = 'ANcmsc',
  morph_pos = 'noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'masculine',
  morph_case = 'construct',
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'اسم مذكر آرامي מֶלֶךְ (H4430) في حالة الإضافة بالموضع 15 من النص الأصلي، صحح من الإزاحة الخاطئة إلى w17 خارج نطاق الآية.'
WHERE verse_id = '${verseId}' AND ar_word_position = 17;

-- #18 فَارِسَ (w16: פָּרָֽס - H6540 - ANp)
UPDATE word_mappings SET
  orig_word_position = 16,
  strongs_id = 'H6540',
  orig_word = 'פָּרַס',
  orig_surface = 'פָּרָֽס',
  verified_locator = 'OSHB:B15.C4.V24.w16',
  orig_morphology = 'ANp',
  morph_pos = 'proper_noun',
  morph_stem = NULL,
  morph_tense = NULL,
  morph_voice = NULL,
  morph_mood = NULL,
  morph_person = NULL,
  morph_number = 'singular',
  morph_gender = 'masculine',
  morph_case = NULL,
  morph_source = 'oshb_wlc',
  relation_type = NULL,
  grammar_notes = 'اسم علم آرامي פָּרָס (H6540) بالموضع 16 الختامي للآية، صحح من الإزاحة الخاطئة إلى w18 وسترونج H6543 غير المطابق للأصل.'
WHERE verse_id = '${verseId}' AND ar_word_position = 18;

COMMIT;
`;

runSql(sql);

// Query mapping IDs for each word position
const mappings = queryJson(`
  SELECT id, ar_word_position, strongs_id, orig_word_position, orig_surface, orig_morphology, morph_source
  FROM word_mappings
  WHERE verse_id = '${verseId}'
  ORDER BY ar_word_position
`);

const mapByPos = {};
mappings.forEach(m => { mapByPos[m.ar_word_position] = m; });

const wmsSql = `
BEGIN TRANSACTION;

-- #1
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[1].id}', 'H116', 1, 'primary', 'בֵּאדַ֗יִן', 1, 'AR/D', 'oshb_wlc');

-- #2
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[2].id}', 'H989', 1, 'primary', 'בְּטֵלַת֙', 2, 'AVqp3fs', 'oshb_wlc');

-- #3
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[3].id}', 'H5673', 1, 'primary', 'עֲבִידַ֣ת', 3, 'ANcfsc', 'oshb_wlc');

-- #4
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[4].id}', 'H1005', 1, 'primary', 'בֵּית', 4, 'ANcmsc', 'oshb_wlc');

-- #5
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[5].id}', 'H426', 1, 'primary', 'אֱלָהָ֔א', 5, 'ANcmsd/Td', 'oshb_wlc');

-- #6
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[6].id}', 'H1768', 1, 'primary', 'דִּ֖י', 6, 'ATr', 'oshb_wlc');

-- #7
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[7].id}', 'H9003', 1, 'primary', 'בִּירוּשְׁלֶ֑ם', 7, 'AR', 'oshb_wlc');

-- #8 (primary H3390 + secondary H9003)
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[8].id}', 'H3390', 1, 'primary', 'בִּירוּשְׁלֶ֑ם', 7, 'AR/Np', 'oshb_wlc');
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[8].id}', 'H9003', 2, 'secondary', 'בִּ', 7, 'AR', 'oshb_wlc');

-- #9 (primary H1934 + secondary H9002)
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[9].id}', 'H1934', 1, 'primary', 'וַהֲוָת֙', 8, 'AC/Vqp3fs', 'oshb_wlc');
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[9].id}', 'H9002', 2, 'secondary', 'וַ', 8, 'AC', 'oshb_wlc');

-- #10
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[10].id}', 'H989', 1, 'primary', 'בָּֽטְלָ֔א', 9, 'AVqrfsa', 'oshb_wlc');

-- #11
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[11].id}', 'H5705', 1, 'primary', 'עַ֚ד', 10, 'AR', 'oshb_wlc');

-- #12
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[12].id}', 'H8140', 1, 'primary', 'שְׁנַ֣ת', 11, 'ANcfsc', 'oshb_wlc');

-- #13
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[13].id}', 'H8648', 1, 'primary', 'תַּרְתֵּ֔ין', 12, 'AAocpa', 'oshb_wlc');

-- #14
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[14].id}', 'H9005', 1, 'primary', 'לְמַלְכ֖וּת', 13, 'AR', 'oshb_wlc');

-- #15 (primary H4437 + secondary H9005)
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[15].id}', 'H4437', 1, 'primary', 'לְמַלְכ֖וּת', 13, 'AR/Ncfsc', 'oshb_wlc');
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[15].id}', 'H9005', 2, 'secondary', 'לְ', 13, 'AR', 'oshb_wlc');

-- #16
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[16].id}', 'H1868', 1, 'primary', 'דָּרְיָ֥וֶשׁ', 14, 'ANp', 'oshb_wlc');

-- #17
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[17].id}', 'H4430', 1, 'primary', 'מֶֽלֶךְ', 15, 'ANcmsc', 'oshb_wlc');

-- #18
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${mapByPos[18].id}', 'H6540', 1, 'primary', 'פָּרָֽס', 16, 'ANp', 'oshb_wlc');

COMMIT;
`;

runSql(wmsSql);

console.log("Successfully calibrated Ezra 4:24 across all 18 Arabic words.");
