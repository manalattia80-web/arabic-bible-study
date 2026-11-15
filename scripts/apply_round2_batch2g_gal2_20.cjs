/**
 * scripts/apply_round2_batch2g_gal2_20.cjs
 *
 * Full verse calibration for Galatians 2:20 (Gal 2:20) in mobile/assets/bible_study.db:
 *
 * Scrivener TR Textus Receptus (33 tokens, 100% token coverage):
 *   w1:  Χριστῷ (G5547, N-DSM)
 *   w2:  συνεσταύρωμαι (G4957, V-RPI-1S)
 *   w3:  ζῶ (G2198, V-PAI-1S)
 *   w4:  δέ (G1161, CONJ)
 *   w5:  οὐκέτι (G3765, ADV-N)
 *   w6:  ἐγώ (G1473, P-1NS)
 *   w7:  ζῇ (G2198, V-PAI-3S)
 *   w8:  δὲ (G1161, CONJ)
 *   w9:  ἐν (G1722, PREP)
 *   w10: ἐμοὶ (G1473, P-1DS)
 *   w11: Χριστός (G5547, N-NSM)
 *   w12: ὃ (G3739, R-ASN)
 *   w13: δὲ (G1161, CONJ)
 *   w14: νῦν (G3568, ADV)
 *   w15: ζῶ (G2198, V-PAI-1S)
 *   w16: ἐν (G1722, PREP)
 *   w17: σαρκί (G4561, N-DSF)
 *   w18: ἐν (G1722, PREP)
 *   w19: πίστει (G4102, N-DSF)
 *   w20: ζῶ (G2198, V-PAI-1S)
 *   w21: τῇ (G3588, T-DSF)
 *   w22: τοῦ (G3588, T-GSM)
 *   w23: υἱοῦ (G5207, N-GSM)
 *   w24: τοῦ (G3588, T-GSM)
 *   w25: Θεοῦ (G2316, N-GSM)
 *   w26: τοῦ (G3588, T-GSM)
 *   w27: ἀγαπήσαντός (G25, V-AAP-GSM)
 *   w28: με (G1473, P-1AS)
 *   w29: καὶ (G2532, CONJ)
 *   w30: παραδόντος (G3860, V-2AAP-GSM)
 *   w31: ἑαυτὸν (G1438, F-3ASM)
 *   w32: ὑπὲρ (G5228, PREP)
 *   w33: ἐμοῦ (G1473, P-1GS)
 *
 * Arabic AVD Translation (27 words):
 *   #1  «مَعَ»      -> syntactic_ar (AR_SYNTACTIC:B48.C2.V20.w1)
 *   #2  «الْمَسِيحِ» -> TR w1 Χριστῷ (G5547, N-DSM)
 *   #3  «صُلِبْتُ»  -> TR w2 συνεσταύρωμαι (G4957, V-RPI-1S)
 *   #4  «فَأَحْيَا»  -> primary TR w3 ζῶ (G2198, V-PAI-1S) + secondary TR w4 δέ (G1161, CONJ)
 *   #5  «لاَ»       -> TR w5 οὐκέτι (G3765, ADV-N)
 *   #6  «أَنَا»     -> TR w6 ἐγώ (G1473, P-1NS)
 *   #7  «بَلِ»      -> TR w8 δὲ (G1161, CONJ)
 *   #8  «الْمَسِيحُ» -> TR w11 Χριστός (G5547, N-NSM)
 *   #9  «يَحْيَا»    -> TR w7 ζῇ (G2198, V-PAI-3S)
 *   #10 «فِيَّ»     -> primary TR w9 ἐν (G1722, PREP) + secondary TR w10 ἐμοὶ (G1473, P-1DS)
 *   #11 «فَمَا»     -> primary TR w12 ὃ (G3739, R-ASN) + secondary TR w13 δὲ (G1161, CONJ)
 *   #12 «أَحْيَاهُ»  -> TR w15 ζῶ (G2198, V-PAI-1S)
 *   #13 «الآنَ»     -> TR w14 νῦν (G3568, ADV)
 *   #14 «فِي»      -> TR w16 ἐν (G1722, PREP)
 *   #15 «الْجَسَدِ» -> TR w17 σαρκί (G4561, N-DSF)
 *   #16 «فَإِنَّمَا»  -> syntactic_ar (AR_SYNTACTIC:B48.C2.V20.w16)
 *   #17 «أَحْيَاهُ»  -> TR w20 ζῶ (G2198, V-PAI-1S)
 *   #18 «فِي»      -> TR w18 ἐν (G1722, PREP)
 *   #19 «الإِيمَانِ» -> TR w19 πίστει (G4102, N-DSF, compound_phrase)
 *   #20 «إِيمَانِ»   -> TR w19 πίστει (G4102, N-DSF, compound_phrase) + secondary TR w21 τῇ (G3588, T-DSF)
 *   #21 «ابْنِ»     -> primary TR w23 υἱοῦ (G5207, N-GSM) + secondary TR w22 τοῦ (G3588, T-GSM)
 *   #22 «اللهِ»     -> primary TR w25 Θεοῦ (G2316, N-GSM) + secondary TR w24 τοῦ (G3588, T-GSM)
 *   #23 «الَّذِي»    -> TR w26 τοῦ (G3588, T-GSM)
 *   #24 «أَحَبَّنِي» -> primary TR w27 ἀγαπήσαντός (G25, V-AAP-GSM) + secondary TR w28 με (G1473, P-1AS)
 *   #25 «وَأَسْلَمَ» -> primary TR w30 παραδόنτος (G3860, V-2AAP-GSM) + secondary TR w29 καὶ (G2532, CONJ)
 *   #26 «نَفْسَهُ»   -> TR w31 ἑαυτὸν (G1438, F-3ASM)
 *   #27 «لأَجْلِي»  -> primary TR w32 ὑπὲρ (G5228, PREP) + secondary TR w33 ἐμοῦ (G1473, P-1GS)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function q(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

console.log('========================================================================');
console.log('  GALATIANS 2:20 (GAL 2:20) FULL VERSE CALIBRATION (BATCH 2G)            ');
console.log('========================================================================\n');

const hashBefore = sha256(dbPath);
console.log(`DB SHA-256 before: ${hashBefore}`);

const sqlScript = `
BEGIN TRANSACTION;

-- 1. #1 مَعَ -> syntactic_ar (AR_SYNTACTIC:B48.C2.V20.w1)
UPDATE word_mappings
SET strongs_id = NULL, orig_word_position = 0, orig_word = '—', orig_surface = '—', orig_morphology = NULL,
    morph_pos = 'syntactic_ar', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'syntactic_ar', verified_locator = 'AR_SYNTACTIC:B48.C2.V20.w1', relation_type = 'syntactic_construction',
    grammar_notes = 'حرف جر في الصياغة العربية لأداء المعنى التركيبي للسابقة اليونانية συν- في الفعل المركب συνεσταύρωμαι (G4957 @ TR w2) مع المفعول به في حالة القابل Χριστῷ (G5547 @ TR w1)، ولا يقابله حرف جر مستقل في النص اليوناني.'
WHERE id = '42a00c6f-7d23-40fd-9755-35c1e5dbee2c';
DELETE FROM word_mapping_strongs WHERE mapping_id = '42a00c6f-7d23-40fd-9755-35c1e5dbee2c';

-- 2. #2 الْمَسِيحِ -> TR w1 Χριστῷ (G5547, N-DSM)
UPDATE word_mappings
SET strongs_id = 'G5547', orig_word_position = 1, orig_word = 'Χριστός', orig_surface = 'Χριστῷ', orig_morphology = 'N-DSM',
    morph_pos = 'noun', morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'dative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w1', relation_type = 'direct', grammar_notes = NULL
WHERE id = '2df92135-b721-4d58-b00e-8409e6b77ca6';
DELETE FROM word_mapping_strongs WHERE mapping_id = '2df92135-b721-4d58-b00e-8409e6b77ca6';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('2df92135-b721-4d58-b00e-8409e6b77ca6', 'G5547', 1, 'primary', 1, 'Χριστῷ', 'N-DSM', 'morphgnt_tr');

-- 3. #3 صُلِبْتُ -> TR w2 συνεσταύρωμαι (G4957, V-RPI-1S)
UPDATE word_mappings
SET strongs_id = 'G4957', orig_word_position = 2, orig_word = 'συσταυρόω', orig_surface = 'συνεσταύρωμαι', orig_morphology = 'V-RPI-1S',
    morph_pos = 'verb', morph_person = '1', morph_number = 'singular', morph_gender = NULL, morph_case = NULL,
    morph_tense = 'perfect', morph_voice = 'passive', morph_mood = 'indicative', morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w2', relation_type = 'direct', grammar_notes = NULL
WHERE id = '2617c9fb-56fc-4e3e-a516-ddbafc4db79e';
DELETE FROM word_mapping_strongs WHERE mapping_id = '2617c9fb-56fc-4e3e-a516-ddbafc4db79e';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('2617c9fb-56fc-4e3e-a516-ddbafc4db79e', 'G4957', 1, 'primary', 2, 'συνεσταύρωμαι', 'V-RPI-1S', 'morphgnt_tr');

-- 4. #4 فَأَحْيَا -> primary TR w3 ζῶ (G2198, V-PAI-1S) + secondary TR w4 δέ (G1161, CONJ)
UPDATE word_mappings
SET strongs_id = 'G2198', orig_word_position = 3, orig_word = 'ζάω', orig_surface = 'ζῶ', orig_morphology = 'V-PAI-1S',
    morph_pos = 'verb', morph_person = '1', morph_number = 'singular', morph_gender = NULL, morph_case = NULL,
    morph_tense = 'present', morph_voice = 'active', morph_mood = 'indicative', morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w3', relation_type = 'direct', grammar_notes = NULL
WHERE id = '779b9793-d3d8-41b3-a9ff-b41ddf9b396b';
DELETE FROM word_mapping_strongs WHERE mapping_id = '779b9793-d3d8-41b3-a9ff-b41ddf9b396b';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('779b9793-d3d8-41b3-a9ff-b41ddf9b396b', 'G2198', 1, 'primary', 3, 'ζῶ', 'V-PAI-1S', 'morphgnt_tr'),
       ('779b9793-d3d8-41b3-a9ff-b41ddf9b396b', 'G1161', 2, 'secondary', 4, 'δέ', 'CONJ', 'morphgnt_tr');

-- 5. #5 لاَ -> TR w5 οὐκέτι (G3765, ADV-N)
UPDATE word_mappings
SET strongs_id = 'G3765', orig_word_position = 5, orig_word = 'οὐκέτι', orig_surface = 'οὐκέτι', orig_morphology = 'ADV-N',
    morph_pos = 'adverb', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w5', relation_type = 'direct', grammar_notes = NULL
WHERE id = '4e09264a-0fa1-4077-93d8-325f123bc7fa';
DELETE FROM word_mapping_strongs WHERE mapping_id = '4e09264a-0fa1-4077-93d8-325f123bc7fa';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('4e09264a-0fa1-4077-93d8-325f123bc7fa', 'G3765', 1, 'primary', 5, 'οὐκέτι', 'ADV-N', 'morphgnt_tr');

-- 6. #6 أَنَا -> TR w6 ἐγώ (G1473, P-1NS)
UPDATE word_mappings
SET strongs_id = 'G1473', orig_word_position = 6, orig_word = 'ἐγώ', orig_surface = 'ἐγώ', orig_morphology = 'P-1NS',
    morph_pos = 'personal_pronoun', morph_person = '1', morph_number = 'singular', morph_gender = NULL, morph_case = 'nominative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w6', relation_type = 'direct', grammar_notes = NULL
WHERE id = 'a5772ca4-c165-4224-8c83-e83ec9930d5f';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'a5772ca4-c165-4224-8c83-e83ec9930d5f';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('a5772ca4-c165-4224-8c83-e83ec9930d5f', 'G1473', 1, 'primary', 6, 'ἐγώ', 'P-1NS', 'morphgnt_tr');

-- 7. #7 بَلِ -> TR w8 δὲ (G1161, CONJ)
UPDATE word_mappings
SET strongs_id = 'G1161', orig_word_position = 8, orig_word = 'δέ', orig_surface = 'δὲ', orig_morphology = 'CONJ',
    morph_pos = 'conjunction', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w8', relation_type = 'direct', grammar_notes = NULL
WHERE id = 'c65c6929-66e5-4ca0-b3d6-06a425d13946';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'c65c6929-66e5-4ca0-b3d6-06a425d13946';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('c65c6929-66e5-4ca0-b3d6-06a425d13946', 'G1161', 1, 'primary', 8, 'δὲ', 'CONJ', 'morphgnt_tr');

-- 8. #8 الْمَسِيحُ -> TR w11 Χριστός (G5547, N-NSM)
UPDATE word_mappings
SET strongs_id = 'G5547', orig_word_position = 11, orig_word = 'Χριστός', orig_surface = 'Χριστός', orig_morphology = 'N-NSM',
    morph_pos = 'noun', morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'nominative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w11', relation_type = 'direct', grammar_notes = NULL
WHERE id = 'ee8e5a15-4003-456a-a7f2-ace146dad01b';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'ee8e5a15-4003-456a-a7f2-ace146dad01b';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('ee8e5a15-4003-456a-a7f2-ace146dad01b', 'G5547', 1, 'primary', 11, 'Χριστός', 'N-NSM', 'morphgnt_tr');

-- 9. #9 يَحْيَا -> TR w7 ζῇ (G2198, V-PAI-3S)
UPDATE word_mappings
SET strongs_id = 'G2198', orig_word_position = 7, orig_word = 'ζάω', orig_surface = 'ζῇ', orig_morphology = 'V-PAI-3S',
    morph_pos = 'verb', morph_person = '3', morph_number = 'singular', morph_gender = NULL, morph_case = NULL,
    morph_tense = 'present', morph_voice = 'active', morph_mood = 'indicative', morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w7', relation_type = 'direct', grammar_notes = NULL
WHERE id = 'e53e0c53-edf9-436d-a76a-bfea011e3715';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'e53e0c53-edf9-436d-a76a-bfea011e3715';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('e53e0c53-edf9-436d-a76a-bfea011e3715', 'G2198', 1, 'primary', 7, 'ζῇ', 'V-PAI-3S', 'morphgnt_tr');

-- 10. #10 فِيَّ -> primary TR w9 ἐν (G1722, PREP) + secondary TR w10 ἐμοὶ (G1473, P-1DS)
UPDATE word_mappings
SET strongs_id = 'G1722', orig_word_position = 9, orig_word = 'ἐν', orig_surface = 'ἐν', orig_morphology = 'PREP',
    morph_pos = 'preposition', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w9', relation_type = 'direct', grammar_notes = NULL
WHERE id = 'fef36d59-fd79-4920-9531-c887d27c95e5';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'fef36d59-fd79-4920-9531-c887d27c95e5';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('fef36d59-fd79-4920-9531-c887d27c95e5', 'G1722', 1, 'primary', 9, 'ἐν', 'PREP', 'morphgnt_tr'),
       ('fef36d59-fd79-4920-9531-c887d27c95e5', 'G1473', 2, 'secondary', 10, 'ἐμοὶ', 'P-1DS', 'morphgnt_tr');

-- 11. #11 فَمَا -> primary TR w12 ὃ (G3739, R-ASN) + secondary TR w13 δὲ (G1161, CONJ)
UPDATE word_mappings
SET strongs_id = 'G3739', orig_word_position = 12, orig_word = 'ὅς', orig_surface = 'ὃ', orig_morphology = 'R-ASN',
    morph_pos = 'relative_pronoun', morph_person = NULL, morph_number = 'singular', morph_gender = 'neuter', morph_case = 'accusative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w12', relation_type = 'direct', grammar_notes = NULL
WHERE id = '2f9ba84d-f66d-48ee-9ba5-16fb014e4a7b';
DELETE FROM word_mapping_strongs WHERE mapping_id = '2f9ba84d-f66d-48ee-9ba5-16fb014e4a7b';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('2f9ba84d-f66d-48ee-9ba5-16fb014e4a7b', 'G3739', 1, 'primary', 12, 'ὃ', 'R-ASN', 'morphgnt_tr'),
       ('2f9ba84d-f66d-48ee-9ba5-16fb014e4a7b', 'G1161', 2, 'secondary', 13, 'δὲ', 'CONJ', 'morphgnt_tr');

-- 12. #12 أَحْيَاهُ -> TR w15 ζῶ (G2198, V-PAI-1S)
UPDATE word_mappings
SET strongs_id = 'G2198', orig_word_position = 15, orig_word = 'ζάω', orig_surface = 'ζῶ', orig_morphology = 'V-PAI-1S',
    morph_pos = 'verb', morph_person = '1', morph_number = 'singular', morph_gender = NULL, morph_case = NULL,
    morph_tense = 'present', morph_voice = 'active', morph_mood = 'indicative', morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w15', relation_type = 'direct', grammar_notes = NULL
WHERE id = 'e1cc239a-f50d-40c8-8f75-b21ef14cfd2a';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'e1cc239a-f50d-40c8-8f75-b21ef14cfd2a';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('e1cc239a-f50d-40c8-8f75-b21ef14cfd2a', 'G2198', 1, 'primary', 15, 'ζῶ', 'V-PAI-1S', 'morphgnt_tr');

-- 13. #13 الآنَ -> TR w14 νῦν (G3568, ADV)
UPDATE word_mappings
SET strongs_id = 'G3568', orig_word_position = 14, orig_word = 'νῦν', orig_surface = 'νῦν', orig_morphology = 'ADV',
    morph_pos = 'adverb', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w14', relation_type = 'direct', grammar_notes = NULL
WHERE id = '6c614821-a036-4350-9893-096c7e154739';
DELETE FROM word_mapping_strongs WHERE mapping_id = '6c614821-a036-4350-9893-096c7e154739';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('6c614821-a036-4350-9893-096c7e154739', 'G3568', 1, 'primary', 14, 'νῦν', 'ADV', 'morphgnt_tr');

-- 14. #14 فِي -> TR w16 ἐν (G1722, PREP)
UPDATE word_mappings
SET strongs_id = 'G1722', orig_word_position = 16, orig_word = 'ἐν', orig_surface = 'ἐν', orig_morphology = 'PREP',
    morph_pos = 'preposition', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w16', relation_type = 'direct', grammar_notes = NULL
WHERE id = 'eff8830a-4848-4dae-bfe2-880619212d67';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'eff8830a-4848-4dae-bfe2-880619212d67';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('eff8830a-4848-4dae-bfe2-880619212d67', 'G1722', 1, 'primary', 16, 'ἐν', 'PREP', 'morphgnt_tr');

-- 15. #15 الْجَسَدِ -> TR w17 σαρκί (G4561, N-DSF)
UPDATE word_mappings
SET strongs_id = 'G4561', orig_word_position = 17, orig_word = 'σάρξ', orig_surface = 'σαρκί', orig_morphology = 'N-DSF',
    morph_pos = 'noun', morph_person = NULL, morph_number = 'singular', morph_gender = 'feminine', morph_case = 'dative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w17', relation_type = 'direct', grammar_notes = NULL
WHERE id = '402e9bbf-0846-4a2e-b8e5-9d1e00fb51fa';
DELETE FROM word_mapping_strongs WHERE mapping_id = '402e9bbf-0846-4a2e-b8e5-9d1e00fb51fa';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('402e9bbf-0846-4a2e-b8e5-9d1e00fb51fa', 'G4561', 1, 'primary', 17, 'σαρκί', 'N-DSF', 'morphgnt_tr');

-- 16. #16 فَإِنَّمَا -> syntactic_ar (AR_SYNTACTIC:B48.C2.V20.w16)
UPDATE word_mappings
SET strongs_id = NULL, orig_word_position = 0, orig_word = '—', orig_surface = '—', orig_morphology = NULL,
    morph_pos = 'syntactic_ar', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'syntactic_ar', verified_locator = 'AR_SYNTACTIC:B48.C2.V20.w16', relation_type = 'syntactic_construction',
    grammar_notes = 'أداة حصر وقصر مع فاء الربط في الصياغة العربية («فَإِنَّمَا») لمقابلة التوازن التركيبي مع الجملة السابقة («فَمَا أَحْيَاهُ... فَإِنَّمَا أَحْيَاهُ»)، ولا تقابلها لفظة مستقلة في النص اليوناني.'
WHERE id = 'a7ecd0ca-3f06-4d42-a54e-9a2a50225e02';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'a7ecd0ca-3f06-4d42-a54e-9a2a50225e02';

-- 17. #17 أَحْيَاهُ -> TR w20 ζῶ (G2198, V-PAI-1S)
UPDATE word_mappings
SET strongs_id = 'G2198', orig_word_position = 20, orig_word = 'ζάω', orig_surface = 'ζῶ', orig_morphology = 'V-PAI-1S',
    morph_pos = 'verb', morph_person = '1', morph_number = 'singular', morph_gender = NULL, morph_case = NULL,
    morph_tense = 'present', morph_voice = 'active', morph_mood = 'indicative', morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w20', relation_type = 'direct', grammar_notes = NULL
WHERE id = '440128da-4b2a-4a4c-ad49-9c3840f244f4';
DELETE FROM word_mapping_strongs WHERE mapping_id = '440128da-4b2a-4a4c-ad49-9c3840f244f4';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('440128da-4b2a-4a4c-ad49-9c3840f244f4', 'G2198', 1, 'primary', 20, 'ζῶ', 'V-PAI-1S', 'morphgnt_tr');

-- 18. #18 فِي -> TR w18 ἐν (G1722, PREP)
UPDATE word_mappings
SET strongs_id = 'G1722', orig_word_position = 18, orig_word = 'ἐν', orig_surface = 'ἐν', orig_morphology = 'PREP',
    morph_pos = 'preposition', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w18', relation_type = 'direct', grammar_notes = NULL
WHERE id = '97da7f4b-561d-4760-8424-8481f43794de';
DELETE FROM word_mapping_strongs WHERE mapping_id = '97da7f4b-561d-4760-8424-8481f43794de';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('97da7f4b-561d-4760-8424-8481f43794de', 'G1722', 1, 'primary', 18, 'ἐν', 'PREP', 'morphgnt_tr');

-- 19. #19 الإِيمَانِ -> TR w19 πίστει (G4102, N-DSF)
UPDATE word_mappings
SET strongs_id = 'G4102', orig_word_position = 19, orig_word = 'πίστις', orig_surface = 'πίστει', orig_morphology = 'N-DSF',
    morph_pos = 'noun', morph_person = NULL, morph_number = 'singular', morph_gender = 'feminine', morph_case = 'dative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w19', relation_type = 'compound_phrase',
    grammar_notes = 'وحدة ربط مشتركة (Shared phrase): تكرار لفظ «إيمان» في الصياغة العربية («فِي الإِيمَانِ، إِيمَانِ ابْنِ اللهِ») يقابل التركيب اليوناني ἐν πίστει ζῶ τῇ τοῦ υἱοῦ τοῦ Θεοῦ حيث تكرر أداة التعريف τῇ (@ w21) المعطوفة اسم πίστει (@ w19).'
WHERE id = '27035deb-7aac-431f-b6b9-a0bb9b373609';
DELETE FROM word_mapping_strongs WHERE mapping_id = '27035deb-7aac-431f-b6b9-a0bb9b373609';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('27035deb-7aac-431f-b6b9-a0bb9b373609', 'G4102', 1, 'primary', 19, 'πίστει', 'N-DSF', 'morphgnt_tr');

-- 20. #20 إِيمَانِ -> TR w19 πίστει (G4102, N-DSF) with secondary TR w21 τῇ (G3588, T-DSF)
UPDATE word_mappings
SET strongs_id = 'G4102', orig_word_position = 19, orig_word = 'πίστις', orig_surface = 'πίστει', orig_morphology = 'N-DSF',
    morph_pos = 'noun', morph_person = NULL, morph_number = 'singular', morph_gender = 'feminine', morph_case = 'dative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w19', relation_type = 'compound_phrase',
    grammar_notes = 'وحدة ربط مشتركة (Shared phrase): تكرار لفظ «إيمان» في الصياغة العربية («فِي الإِيمَانِ، إِيمَانِ ابْنِ اللهِ») يقابل التركيب اليوناني ἐν πίστει ζῶ τῇ τοῦ υἱοῦ τοῦ Θεοῦ حيث تكرر أداة التعريف τῇ (@ w21) المعطوفة اسم πίστει (@ w19).'
WHERE id = '49002695-4ac3-4fa1-b591-305819090536';
DELETE FROM word_mapping_strongs WHERE mapping_id = '49002695-4ac3-4fa1-b591-305819090536';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('49002695-4ac3-4fa1-b591-305819090536', 'G4102', 1, 'primary', 19, 'πίστει', 'N-DSF', 'morphgnt_tr'),
       ('49002695-4ac3-4fa1-b591-305819090536', 'G3588', 2, 'secondary', 21, 'τῇ', 'T-DSF', 'morphgnt_tr');

-- 21. #21 ابْنِ -> primary TR w23 υἱοῦ (G5207, N-GSM) + secondary TR w22 τοῦ (G3588, T-GSM)
UPDATE word_mappings
SET strongs_id = 'G5207', orig_word_position = 23, orig_word = 'υἱός', orig_surface = 'υἱοῦ', orig_morphology = 'N-GSM',
    morph_pos = 'noun', morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'genitive',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w23', relation_type = 'direct', grammar_notes = NULL
WHERE id = '456d28b4-fb55-4c99-a766-4d493d291c43';
DELETE FROM word_mapping_strongs WHERE mapping_id = '456d28b4-fb55-4c99-a766-4d493d291c43';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('456d28b4-fb55-4c99-a766-4d493d291c43', 'G5207', 1, 'primary', 23, 'υἱοῦ', 'N-GSM', 'morphgnt_tr'),
       ('456d28b4-fb55-4c99-a766-4d493d291c43', 'G3588', 2, 'secondary', 22, 'τοῦ', 'T-GSM', 'morphgnt_tr');

-- 22. #22 اللهِ -> primary TR w25 Θεοῦ (G2316, N-GSM) + secondary TR w24 τοῦ (G3588, T-GSM)
UPDATE word_mappings
SET strongs_id = 'G2316', orig_word_position = 25, orig_word = 'θεός', orig_surface = 'Θεοῦ', orig_morphology = 'N-GSM',
    morph_pos = 'noun', morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'genitive',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w25', relation_type = 'direct', grammar_notes = NULL
WHERE id = '330e4394-331b-49ae-a695-b4a175966228';
DELETE FROM word_mapping_strongs WHERE mapping_id = '330e4394-331b-49ae-a695-b4a175966228';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('330e4394-331b-49ae-a695-b4a175966228', 'G2316', 1, 'primary', 25, 'Θεοῦ', 'N-GSM', 'morphgnt_tr'),
       ('330e4394-331b-49ae-a695-b4a175966228', 'G3588', 2, 'secondary', 24, 'τοῦ', 'T-GSM', 'morphgnt_tr');

-- 23. #23 الَّذِي -> TR w26 τοῦ (G3588, T-GSM)
UPDATE word_mappings
SET strongs_id = 'G3588', orig_word_position = 26, orig_word = 'ὁ', orig_surface = 'τοῦ', orig_morphology = 'T-GSM',
    morph_pos = 'pronoun', morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'genitive',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w26', relation_type = 'direct', grammar_notes = NULL
WHERE id = 'fd53953b-3c98-47b7-b1e9-e5f28f8e0ca1';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'fd53953b-3c98-47b7-b1e9-e5f28f8e0ca1';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('fd53953b-3c98-47b7-b1e9-e5f28f8e0ca1', 'G3588', 1, 'primary', 26, 'τοῦ', 'T-GSM', 'morphgnt_tr');

-- 24. #24 أَحَبَّنِي -> primary TR w27 ἀγαπήσαντός (G25, V-AAP-GSM) + secondary TR w28 με (G1473, P-1AS)
UPDATE word_mappings
SET strongs_id = 'G25', orig_word_position = 27, orig_word = 'ἀγαπάω', orig_surface = 'ἀγαπήσαντός', orig_morphology = 'V-AAP-GSM',
    morph_pos = 'verb', morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'genitive',
    morph_tense = 'aorist', morph_voice = 'active', morph_mood = 'participle', morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w27', relation_type = 'direct', grammar_notes = NULL
WHERE id = '53289b16-db2f-4aff-9612-900eaa08e39e';
DELETE FROM word_mapping_strongs WHERE mapping_id = '53289b16-db2f-4aff-9612-900eaa08e39e';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('53289b16-db2f-4aff-9612-900eaa08e39e', 'G25', 1, 'primary', 27, 'ἀγαπήσαντός', 'V-AAP-GSM', 'morphgnt_tr'),
       ('53289b16-db2f-4aff-9612-900eaa08e39e', 'G1473', 2, 'secondary', 28, 'με', 'P-1AS', 'morphgnt_tr');

-- 25. #25 وَأَسْلَمَ -> primary TR w30 παραδόنτος (G3860, V-2AAP-GSM) + secondary TR w29 καὶ (G2532, CONJ)
UPDATE word_mappings
SET strongs_id = 'G3860', orig_word_position = 30, orig_word = 'παραδίδωμι', orig_surface = 'παραδόντος', orig_morphology = 'V-2AAP-GSM',
    morph_pos = 'verb', morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'genitive',
    morph_tense = 'aorist', morph_voice = 'active', morph_mood = 'participle', morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w30', relation_type = 'direct', grammar_notes = NULL
WHERE id = '12ea750d-8d47-41cd-82d0-7f72bf83afb3';
DELETE FROM word_mapping_strongs WHERE mapping_id = '12ea750d-8d47-41cd-82d0-7f72bf83afb3';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('12ea750d-8d47-41cd-82d0-7f72bf83afb3', 'G3860', 1, 'primary', 30, 'παραδόντος', 'V-2AAP-GSM', 'morphgnt_tr'),
       ('12ea750d-8d47-41cd-82d0-7f72bf83afb3', 'G2532', 2, 'secondary', 29, 'καὶ', 'CONJ', 'morphgnt_tr');

-- 26. #26 نَفْسَهُ -> TR w31 ἑαυτὸن (G1438, F-3ASM)
UPDATE word_mappings
SET strongs_id = 'G1438', orig_word_position = 31, orig_word = 'ἑαυτοῦ', orig_surface = 'ἑαυτὸν', orig_morphology = 'F-3ASM',
    morph_pos = 'pronoun', morph_person = '3', morph_number = 'singular', morph_gender = 'masculine', morph_case = 'accusative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w31', relation_type = 'direct', grammar_notes = NULL
WHERE id = '4930b2f4-3f46-4a79-a500-0fb5e0228f29';
DELETE FROM word_mapping_strongs WHERE mapping_id = '4930b2f4-3f46-4a79-a500-0fb5e0228f29';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('4930b2f4-3f46-4a79-a500-0fb5e0228f29', 'G1438', 1, 'primary', 31, 'ἑαυτὸν', 'F-3ASM', 'morphgnt_tr');

-- 27. #27 لأَجْلِي -> primary TR w32 ὑπὲρ (G5228, PREP) + secondary TR w33 ἐμοῦ (G1473, P-1GS)
UPDATE word_mappings
SET strongs_id = 'G5228', orig_word_position = 32, orig_word = 'ὑπέρ', orig_surface = 'ὑπὲρ', orig_morphology = 'PREP',
    morph_pos = 'preposition', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B48.C2.V20.w32', relation_type = 'direct', grammar_notes = NULL
WHERE id = '151b3f82-6b92-4cad-beaf-6e8cdfb72d07';
DELETE FROM word_mapping_strongs WHERE mapping_id = '151b3f82-6b92-4cad-beaf-6e8cdfb72d07';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('151b3f82-6b92-4cad-beaf-6e8cdfb72d07', 'G5228', 1, 'primary', 32, 'ὑπὲρ', 'PREP', 'morphgnt_tr'),
       ('151b3f82-6b92-4cad-beaf-6e8cdfb72d07', 'G1473', 2, 'secondary', 33, 'ἐμοῦ', 'P-1GS', 'morphgnt_tr');

COMMIT;
`;

q(sqlScript);

const integrityCheck = q('PRAGMA integrity_check;');
console.log(`PRAGMA integrity_check: ${integrityCheck}`);
if (integrityCheck !== 'ok') {
  throw new Error(`Integrity check failed: ${integrityCheck}`);
}

const hashAfter = sha256(dbPath);
console.log(`DB SHA-256 after:  ${hashAfter}`);
console.log('\nGalatians 2:20 calibration applied successfully.');
