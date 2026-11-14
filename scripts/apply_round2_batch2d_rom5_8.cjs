/**
 * apply_round2_batch2d_rom5_8.cjs
 * Full-verse alignment and morphology calibration for Rom 5:8 (all 12 Arabic words -> 18 SBLGNT tokens).
 *
 * Summary of adjustments:
 *   #1  وَلكِنَّ   -> G1161 @ w2 (δὲ, C- --------)
 *   #2  اللهَ     -> G2316 @ w9 (θεὸς, N- ----NSM-) + G3588 @ w8 (ὁ, RA ----NSM-)
 *   #3  بَيَّنَ     -> G4921 @ w1 (συνίστησιν, V- 3PAI-S--) [Verb Form II, NOT preposition بَيْنَ]
 *   #4  مَحَبَّتَهُ  -> G26 @ w5 (ἀγάπην, N- ----ASF-) + G1438 @ w4 (ἑαυτοῦ, RP ----GSM-) + G3588 @ w3 (τὴν, RA ----ASF-)
 *   #5  لَنَا     -> G1519 @ w6 (εἰς, P- --------) + G1473 @ w7 (ἡμᾶς, RP ----AP--)
 *   #6  لأَنَّهُ    -> G3754 @ w10 (ὅτι, C- --------)
 *   #7  وَنَحْنُ   -> G1473 @ w14 (ἡμῶν, RP ----GP--) + G1510 @ w13 (ὄντων, V- -PAPGPM-)
 *   #8  بَعْدُ    -> G2089 @ w11 (ἔτι, D- --------)
 *   #9  خُطَاةٌ   -> G268 @ w12 (ἁμαρτωλῶν, A- ----GPM-)
 *   #10 مَاتَ    -> G599 @ w18 (ἀπέθανεν, V- 3AAI-S--)
 *   #11 الْمَسِيحُ -> G5547 @ w15 (Χριστὸς, N- ----NSM-) [Clean in Batch 2A]
 *   #12 لأَجْلِنَا -> G5228 @ w16 (ὑπὲρ, P- --------) + G1473 @ w17 (ἡμῶν, RP ----GP--)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const beforeSha = sha256File(dbPath);
console.log(`DB SHA-256 before Rom 5:8 full-verse repair: ${beforeSha}`);

const sql = `
BEGIN TRANSACTION;

-- #1 وَلكِنَّ -> G1161 @ w2 (δὲ)
UPDATE word_mappings
SET orig_word_position = 2,
    orig_word = 'δέ',
    orig_surface = 'δὲ',
    orig_morphology = 'C- --------',
    morph_pos = 'conjunction',
    morph_person = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_number = NULL, morph_gender = NULL, morph_case = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w2'
WHERE id = '6334da99-9b41-4806-873f-578a1a099b8c';

DELETE FROM word_mapping_strongs WHERE mapping_id = '6334da99-9b41-4806-873f-578a1a099b8c';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('6334da99-9b41-4806-873f-578a1a099b8c', 'G1161', 1, 'primary', 2, 'δὲ', 'C- --------', 'morphgnt_sblgnt');

-- #2 اللهَ -> G2316 @ w9 (θεὸς) + G3588 @ w8 (ὁ)
UPDATE word_mappings
SET orig_word_position = 9,
    orig_word = 'θεός',
    orig_surface = 'θεὸς',
    orig_morphology = 'N- ----NSM-',
    morph_pos = 'noun',
    morph_number = 'singular',
    morph_gender = 'masculine',
    morph_case = 'nominative',
    morph_person = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w9'
WHERE id = 'bcfe1317-f14f-4002-86cc-3767c86674ee';

DELETE FROM word_mapping_strongs WHERE mapping_id = 'bcfe1317-f14f-4002-86cc-3767c86674ee';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('bcfe1317-f14f-4002-86cc-3767c86674ee', 'G2316', 1, 'primary', 9, 'θεὸς', 'N- ----NSM-', 'morphgnt_sblgnt'),
       ('bcfe1317-f14f-4002-86cc-3767c86674ee', 'G3588', 2, 'secondary', 8, 'ὁ', 'RA ----NSM-', 'morphgnt_sblgnt');

-- #3 بَيَّنَ -> G4921 @ w1 (συνίστησιν)
UPDATE word_mappings
SET strongs_id = 'G4921',
    orig_word_position = 1,
    orig_word = 'συνίστημι',
    orig_surface = 'συνίστησιν',
    orig_morphology = 'V- 3PAI-S--',
    morph_pos = 'verb',
    morph_person = '3',
    morph_tense = 'present',
    morph_voice = 'active',
    morph_mood = 'indicative',
    morph_number = 'singular',
    morph_gender = NULL,
    morph_case = NULL,
    morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w1'
WHERE id = 'b5d4c671-8bd2-43fb-8bdf-ae00b8fea393';

DELETE FROM word_mapping_strongs WHERE mapping_id = 'b5d4c671-8bd2-43fb-8bdf-ae00b8fea393';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('b5d4c671-8bd2-43fb-8bdf-ae00b8fea393', 'G4921', 1, 'primary', 1, 'συνίστησιν', 'V- 3PAI-S--', 'morphgnt_sblgnt');

-- #4 مَحَبَّتَهُ -> G26 @ w5 (ἀγάπην) + G1438 @ w4 (ἑαυτοῦ) + G3588 @ w3 (τὴν)
UPDATE word_mappings
SET strongs_id = 'G26',
    orig_word_position = 5,
    orig_word = 'ἀγάπη',
    orig_surface = 'ἀγάπην',
    orig_morphology = 'N- ----ASF-',
    morph_pos = 'noun',
    morph_gender = 'feminine',
    morph_number = 'singular',
    morph_case = 'accusative',
    morph_person = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w5'
WHERE id = '97c395fc-03c9-41e2-b76f-1d0091177ceb';

DELETE FROM word_mapping_strongs WHERE mapping_id = '97c395fc-03c9-41e2-b76f-1d0091177ceb';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('97c395fc-03c9-41e2-b76f-1d0091177ceb', 'G26', 1, 'primary', 5, 'ἀγάπην', 'N- ----ASF-', 'morphgnt_sblgnt'),
       ('97c395fc-03c9-41e2-b76f-1d0091177ceb', 'G1438', 2, 'secondary', 4, 'ἑαυτοῦ', 'RP ----GSM-', 'morphgnt_sblgnt'),
       ('97c395fc-03c9-41e2-b76f-1d0091177ceb', 'G3588', 3, 'secondary', 3, 'τὴν', 'RA ----ASF-', 'morphgnt_sblgnt');

-- #5 لَنَا -> G1519 @ w6 (εἰς) + G1473 @ w7 (ἡμᾶς)
UPDATE word_mappings
SET strongs_id = 'G1519',
    orig_word_position = 6,
    orig_word = 'εἰς',
    orig_surface = 'εἰς',
    orig_morphology = 'P- --------',
    morph_pos = 'preposition',
    morph_person = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_number = NULL, morph_gender = NULL, morph_case = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w6'
WHERE id = '0c5a3b67-19a1-46b9-b1ad-b04f2daf16ad';

DELETE FROM word_mapping_strongs WHERE mapping_id = '0c5a3b67-19a1-46b9-b1ad-b04f2daf16ad';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('0c5a3b67-19a1-46b9-b1ad-b04f2daf16ad', 'G1519', 1, 'primary', 6, 'εἰς', 'P- --------', 'morphgnt_sblgnt'),
       ('0c5a3b67-19a1-46b9-b1ad-b04f2daf16ad', 'G1473', 2, 'secondary', 7, 'ἡμᾶς', 'RP ----AP--', 'morphgnt_sblgnt');

-- #6 لأَنَّهُ -> G3754 @ w10 (ὅτι)
UPDATE word_mappings
SET strongs_id = 'G3754',
    orig_word_position = 10,
    orig_word = 'ὅτι',
    orig_surface = 'ὅτι',
    orig_morphology = 'C- --------',
    morph_pos = 'conjunction',
    morph_person = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_number = NULL, morph_gender = NULL, morph_case = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w10'
WHERE id = '9131025b-922b-45e9-8cf3-911e27c38784';

DELETE FROM word_mapping_strongs WHERE mapping_id = '9131025b-922b-45e9-8cf3-911e27c38784';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('9131025b-922b-45e9-8cf3-911e27c38784', 'G3754', 1, 'primary', 10, 'ὅτι', 'C- --------', 'morphgnt_sblgnt');

-- #7 وَنَحْنُ -> G1473 @ w14 (ἡμῶν) + G1510 @ w13 (ὄντων)
UPDATE word_mappings
SET strongs_id = 'G1473',
    orig_word_position = 14,
    orig_word = 'ἐγώ',
    orig_surface = 'ἡμῶν',
    orig_morphology = 'RP ----GP--',
    morph_pos = 'pronoun',
    morph_person = NULL,
    morph_number = 'plural',
    morph_case = 'genitive',
    morph_gender = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w14'
WHERE id = '043834e2-ad10-4966-9d0a-9591deccc2da';

DELETE FROM word_mapping_strongs WHERE mapping_id = '043834e2-ad10-4966-9d0a-9591deccc2da';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('043834e2-ad10-4966-9d0a-9591deccc2da', 'G1473', 1, 'primary', 14, 'ἡμῶν', 'RP ----GP--', 'morphgnt_sblgnt'),
       ('043834e2-ad10-4966-9d0a-9591deccc2da', 'G1510', 2, 'secondary', 13, 'ὄντων', 'V- -PAPGPM-', 'morphgnt_sblgnt');

-- #8 بَعْدُ -> G2089 @ w11 (ἔτι)
UPDATE word_mappings
SET strongs_id = 'G2089',
    orig_word_position = 11,
    orig_word = 'ἔτι',
    orig_surface = 'ἔτι',
    orig_morphology = 'D- --------',
    morph_pos = 'adverb',
    morph_person = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_number = NULL, morph_gender = NULL, morph_case = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w11'
WHERE id = '75d0f845-dd38-4f2d-8924-2c56f6aa5df9';

DELETE FROM word_mapping_strongs WHERE mapping_id = '75d0f845-dd38-4f2d-8924-2c56f6aa5df9';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('75d0f845-dd38-4f2d-8924-2c56f6aa5df9', 'G2089', 1, 'primary', 11, 'ἔτι', 'D- --------', 'morphgnt_sblgnt');

-- #9 خُطَاةٌ -> G268 @ w12 (ἁμαρτωλῶν)
UPDATE word_mappings
SET strongs_id = 'G268',
    orig_word_position = 12,
    orig_word = 'ἁμαρτωλός',
    orig_surface = 'ἁμαρτωλῶν',
    orig_morphology = 'A- ----GPM-',
    morph_pos = 'adjective',
    morph_gender = 'masculine',
    morph_number = 'plural',
    morph_case = 'genitive',
    morph_person = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w12'
WHERE id = '4a63093b-670a-4614-9bc8-b3373a4e1ab1';

DELETE FROM word_mapping_strongs WHERE mapping_id = '4a63093b-670a-4614-9bc8-b3373a4e1ab1';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('4a63093b-670a-4614-9bc8-b3373a4e1ab1', 'G268', 1, 'primary', 12, 'ἁμαρτωλῶν', 'A- ----GPM-', 'morphgnt_sblgnt');

-- #10 مَاتَ -> G599 @ w18 (ἀπέθανεν)
UPDATE word_mappings
SET strongs_id = 'G599',
    orig_word_position = 18,
    orig_word = 'ἀποθνῄσκω',
    orig_surface = 'ἀπέθανεν',
    orig_morphology = 'V- 3AAI-S--',
    morph_pos = 'verb',
    morph_person = '3',
    morph_tense = 'aorist',
    morph_voice = 'active',
    morph_mood = 'indicative',
    morph_number = 'singular',
    morph_gender = NULL,
    morph_case = NULL,
    morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w18'
WHERE id = '547bc004-8aad-4473-8900-1ee76ebf9555';

DELETE FROM word_mapping_strongs WHERE mapping_id = '547bc004-8aad-4473-8900-1ee76ebf9555';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('547bc004-8aad-4473-8900-1ee76ebf9555', 'G599', 1, 'primary', 18, 'ἀπέθανεν', 'V- 3AAI-S--', 'morphgnt_sblgnt');

-- #12 لأَجْلِنَا -> G5228 @ w16 (ὑπὲρ) + G1473 @ w17 (ἡμῶν)
UPDATE word_mappings
SET strongs_id = 'G5228',
    orig_word_position = 16,
    orig_word = 'ὑπέρ',
    orig_surface = 'ὑπὲρ',
    orig_morphology = 'P- --------',
    morph_pos = 'preposition',
    morph_person = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_number = NULL, morph_gender = NULL, morph_case = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w16'
WHERE id = 'fbf998de-fd82-4981-98a0-3c01a11e3a21';

DELETE FROM word_mapping_strongs WHERE mapping_id = 'fbf998de-fd82-4981-98a0-3c01a11e3a21';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('fbf998de-fd82-4981-98a0-3c01a11e3a21', 'G5228', 1, 'primary', 16, 'ὑπὲρ', 'P- --------', 'morphgnt_sblgnt'),
       ('fbf998de-fd82-4981-98a0-3c01a11e3a21', 'G1473', 2, 'secondary', 17, 'ἡμῶν', 'RP ----GP--', 'morphgnt_sblgnt');

COMMIT;
`;

execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' });
const afterSha = sha256File(dbPath);
console.log(`DB SHA-256 after  Rom 5:8 full-verse repair: ${afterSha}`);
console.log('Applied full-verse Rom 5:8 alignment & multi-component calibration (all 12 Arabic words).');
