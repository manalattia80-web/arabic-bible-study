/**
 * apply_round2_batch2e_lk6_31.cjs
 * Full-verse alignment and morphology calibration for Luke 6:31 (11 Arabic words -> 11 SBLGNT tokens, words 8 & 9 as syntactic_ar).
 *
 * Summary of adjustments:
 *   #1  وَكَمَا    -> G2531 @ w2 (καθὼς, C- --------) + G2532 @ w1 (καὶ, C- --------)
 *   #2  تُرِيدُونَ  -> G2309 @ w3 (θέλετε, V- 2PAI-P--)
 *   #3  أَنْ      -> G2443 @ w4 (ἵνα, C- --------)
 *   #4  يَفْعَلَ   -> G4160 @ w5 (ποιῶσιν, V- 3PAS-P--)
 *   #5  النَّاسُ   -> G444 @ w8 (ἄνθρωποι, N- ----NPM-) + G3588 @ w7 (οἱ, RA ----NPM-)
 *   #6  بِكُمُ     -> G4771 @ w6 (ὑμῖν, RP ----DP--)
 *   #7  افْعَلُوا  -> G4160 @ w9 (ποιεῖτε, V- 2PAD-P--)
 *   #8  أَنْتُمْ   -> syntactic_ar (TR variant addition ὑμεῖς, 0 components)
 *   #9  أَيْضًا    -> syntactic_ar (TR variant addition καὶ, 0 components)
 *   #10 بِهِمْ     -> G846 @ w10 (αὐτοῖς, RP ----DPM-)
 *   #11 هكَذَا    -> G3668 @ w11 (ὁμοίως, D- --------)
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
console.log(`DB SHA-256 before Luke 6:31 full-verse repair: ${beforeSha}`);

const sql = `
BEGIN TRANSACTION;

-- #1 وَكَمَا -> G2531 @ w2 (καθὼς) + G2532 @ w1 (καὶ)
UPDATE word_mappings
SET strongs_id = 'G2531', orig_word_position = 2, orig_word = 'καθώς', orig_surface = 'καθὼς', orig_morphology = 'C- --------',
    morph_pos = 'conjunction', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B42.C6.V31.w2'
WHERE id = '9fe17080-ecd7-4181-8c73-a66a228a52f6';
DELETE FROM word_mapping_strongs WHERE mapping_id = '9fe17080-ecd7-4181-8c73-a66a228a52f6';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('9fe17080-ecd7-4181-8c73-a66a228a52f6', 'G2531', 1, 'primary', 2, 'καθὼς', 'C- --------', 'morphgnt_sblgnt'),
       ('9fe17080-ecd7-4181-8c73-a66a228a52f6', 'G2532', 2, 'secondary', 1, 'καὶ', 'C- --------', 'morphgnt_sblgnt');

-- #2 تُرِيدُونَ -> G2309 @ w3 (θέλετε)
UPDATE word_mappings
SET strongs_id = 'G2309', orig_word_position = 3, orig_word = 'θέλω', orig_surface = 'θέλετε', orig_morphology = 'V- 2PAI-P--',
    morph_pos = 'verb', morph_person = '2', morph_number = 'plural', morph_gender = NULL, morph_case = NULL,
    morph_tense = 'present', morph_voice = 'active', morph_mood = 'indicative', morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B42.C6.V31.w3'
WHERE id = 'e79ec7c6-c1ee-4077-8bab-4b13015d816f';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'e79ec7c6-c1ee-4077-8bab-4b13015d816f';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('e79ec7c6-c1ee-4077-8bab-4b13015d816f', 'G2309', 1, 'primary', 3, 'θέλετε', 'V- 2PAI-P--', 'morphgnt_sblgnt');

-- #3 أَنْ -> G2443 @ w4 (ἵνα)
UPDATE word_mappings
SET strongs_id = 'G2443', orig_word_position = 4, orig_word = 'ἵνα', orig_surface = 'ἵνα', orig_morphology = 'C- --------',
    morph_pos = 'conjunction', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B42.C6.V31.w4'
WHERE id = '961b63fc-3a66-49f6-befc-95c1980cf1b5';
DELETE FROM word_mapping_strongs WHERE mapping_id = '961b63fc-3a66-49f6-befc-95c1980cf1b5';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('961b63fc-3a66-49f6-befc-95c1980cf1b5', 'G2443', 1, 'primary', 4, 'ἵνα', 'C- --------', 'morphgnt_sblgnt');

-- #4 يَفْعَلَ -> G4160 @ w5 (ποιῶσιν)
UPDATE word_mappings
SET strongs_id = 'G4160', orig_word_position = 5, orig_word = 'ποιέω', orig_surface = 'ποιῶσιν', orig_morphology = 'V- 3PAS-P--',
    morph_pos = 'verb', morph_person = '3', morph_number = 'plural', morph_gender = NULL, morph_case = NULL,
    morph_tense = 'present', morph_voice = 'active', morph_mood = 'subjunctive', morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B42.C6.V31.w5'
WHERE id = 'f73b735d-564d-4386-97e1-edbc68eba44c';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'f73b735d-564d-4386-97e1-edbc68eba44c';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('f73b735d-564d-4386-97e1-edbc68eba44c', 'G4160', 1, 'primary', 5, 'ποιῶσιν', 'V- 3PAS-P--', 'morphgnt_sblgnt');

-- #5 النَّاسُ -> G444 @ w8 (ἄνθρωποι) + G3588 @ w7 (οἱ)
UPDATE word_mappings
SET strongs_id = 'G444', orig_word_position = 8, orig_word = 'ἄνθρωπος', orig_surface = 'ἄνθρωποι', orig_morphology = 'N- ----NPM-',
    morph_pos = 'noun', morph_gender = 'masculine', morph_number = 'plural', morph_case = 'nominative',
    morph_person = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B42.C6.V31.w8'
WHERE id = '0d081881-37cc-4347-a150-ecc1a6a9d2c5';
DELETE FROM word_mapping_strongs WHERE mapping_id = '0d081881-37cc-4347-a150-ecc1a6a9d2c5';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('0d081881-37cc-4347-a150-ecc1a6a9d2c5', 'G444', 1, 'primary', 8, 'ἄνθρωποι', 'N- ----NPM-', 'morphgnt_sblgnt'),
       ('0d081881-37cc-4347-a150-ecc1a6a9d2c5', 'G3588', 2, 'secondary', 7, 'οἱ', 'RA ----NPM-', 'morphgnt_sblgnt');

-- #6 بِكُمُ -> G4771 @ w6 (ὑμῖν)
UPDATE word_mappings
SET strongs_id = 'G4771', orig_word_position = 6, orig_word = 'σύ', orig_surface = 'ὑμῖν', orig_morphology = 'RP ----DP--',
    morph_pos = 'pronoun', morph_number = 'plural', morph_case = 'dative',
    morph_person = NULL, morph_gender = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B42.C6.V31.w6'
WHERE id = '8a45d6c9-d9a0-403c-afce-698ea396ca1f';
DELETE FROM word_mapping_strongs WHERE mapping_id = '8a45d6c9-d9a0-403c-afce-698ea396ca1f';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('8a45d6c9-d9a0-403c-afce-698ea396ca1f', 'G4771', 1, 'primary', 6, 'ὑμῖν', 'RP ----DP--', 'morphgnt_sblgnt');

-- #7 افْعَلُوا -> G4160 @ w9 (ποιεῖτε)
UPDATE word_mappings
SET strongs_id = 'G4160', orig_word_position = 9, orig_word = 'ποιέω', orig_surface = 'ποιεῖτε', orig_morphology = 'V- 2PAD-P--',
    morph_pos = 'verb', morph_person = '2', morph_number = 'plural', morph_gender = NULL, morph_case = NULL,
    morph_tense = 'present', morph_voice = 'active', morph_mood = 'imperative', morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B42.C6.V31.w9'
WHERE id = '7c486f66-5f52-4f4a-b194-b54438169b0a';
DELETE FROM word_mapping_strongs WHERE mapping_id = '7c486f66-5f52-4f4a-b194-b54438169b0a';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('7c486f66-5f52-4f4a-b194-b54438169b0a', 'G4160', 1, 'primary', 9, 'ποιεῖτε', 'V- 2PAD-P--', 'morphgnt_sblgnt');

-- #8 أَنْتُمْ -> G4771 @ TR w10 (ὑμεῖς)
UPDATE word_mappings
SET strongs_id = 'G4771', orig_word_position = 10, orig_word = 'σύ', orig_surface = 'ὑμεῖς', orig_morphology = 'P-2NP',
    morph_pos = 'pronoun', morph_person = '2', morph_number = 'plural', morph_case = 'nominative',
    morph_gender = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B42.C6.V31.w10', relation_type = 'direct',
    grammar_notes = 'اختلاف نصي: الكلمة موجودة في نص ستيفانوس/سكرينفر (Scrivener TR w10: ὑμεῖς / G4771) وغير واردة في SBLGNT.'
WHERE id = 'cc9446e6-7ab1-4fbf-9001-3a797ad7ba5d';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'cc9446e6-7ab1-4fbf-9001-3a797ad7ba5d';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('cc9446e6-7ab1-4fbf-9001-3a797ad7ba5d', 'G4771', 1, 'primary', 10, 'ὑμεῖς', 'P-2NP', 'morphgnt_tr');

-- #9 أَيْضًا -> G2532 @ TR w9 (καὶ)
UPDATE word_mappings
SET strongs_id = 'G2532', orig_word_position = 9, orig_word = 'καί', orig_surface = 'καὶ', orig_morphology = 'CONJ',
    morph_pos = 'conjunction', morph_person = NULL, morph_number = NULL, morph_case = NULL,
    morph_gender = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_tr', verified_locator = 'TR:B42.C6.V31.w9', relation_type = 'direct',
    grammar_notes = 'اختلاف نصي: الكلمة موجودة في نص ستيفانوس/سكرينفر (Scrivener TR w9: καὶ / G2532) وغير واردة في SBLGNT.'
WHERE id = '12dcc33f-43f9-4742-b26a-8051b97ab63e';
DELETE FROM word_mapping_strongs WHERE mapping_id = '12dcc33f-43f9-4742-b26a-8051b97ab63e';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('12dcc33f-43f9-4742-b26a-8051b97ab63e', 'G2532', 1, 'primary', 9, 'καὶ', 'CONJ', 'morphgnt_tr');

-- #10 بِهِمْ -> G846 @ w10 (αὐτοῖς)
UPDATE word_mappings
SET strongs_id = 'G846', orig_word_position = 10, orig_word = 'αὐτός', orig_surface = 'αὐτοῖς', orig_morphology = 'RP ----DPM-',
    morph_pos = 'pronoun', morph_gender = 'masculine', morph_number = 'plural', morph_case = 'dative',
    morph_person = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B42.C6.V31.w10'
WHERE id = '7ce59117-07e1-4e56-ab6b-c38751255f72';
DELETE FROM word_mapping_strongs WHERE mapping_id = '7ce59117-07e1-4e56-ab6b-c38751255f72';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('7ce59117-07e1-4e56-ab6b-c38751255f72', 'G846', 1, 'primary', 10, 'αὐτοῖς', 'RP ----DPM-', 'morphgnt_sblgnt');

-- #11 هكَذَا -> G3668 @ w11 (ὁμοίως)
UPDATE word_mappings
SET strongs_id = 'G3668', orig_word_position = 11, orig_word = 'ὁμοίως', orig_surface = 'ὁμοίως', orig_morphology = 'D- --------',
    morph_pos = 'adverb', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B42.C6.V31.w11'
WHERE id = '0b38cad7-56fa-44dd-ac5a-23f6115fd0ce';
DELETE FROM word_mapping_strongs WHERE mapping_id = '0b38cad7-56fa-44dd-ac5a-23f6115fd0ce';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('0b38cad7-56fa-44dd-ac5a-23f6115fd0ce', 'G3668', 1, 'primary', 11, 'ὁμοίως', 'D- --------', 'morphgnt_sblgnt');

COMMIT;
`;

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_lk6_31.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql, 'utf8');

try {
  execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' });
  console.log('Successfully applied Luke 6:31 full-verse alignment transaction.');
} finally {
  if (fs.existsSync(tmpSqlPath)) fs.unlinkSync(tmpSqlPath);
}

const afterSha = sha256File(dbPath);
console.log(`DB SHA-256 after Luke 6:31 full-verse repair: ${afterSha}`);
