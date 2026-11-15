/**
 * scripts/apply_round2_batch2f_phil2_5.cjs
 *
 * Full verse calibration for Philippians 2:5 (Phil 2:5) in mobile/assets/bible_study.db:
 *
 * 1. #1 «فَلْيَكُنْ»:
 *    - Auxiliary Arabic copular verb (كان) with jussive lam rendering the Greek imperative mood.
 *    - Reclassified as pure syntactic_ar (AR_SYNTACTIC:B50.C2.V5.w1) with zero Strongs and zero components.
 *    - Grammar note documents that SBLGNT has 2nd plural imperative φρονεῖτε (w2 / G5426), while Scrivener TR has
 *      3rd singular passive imperative φρονείσθω (w3 / G5426) with conjunction γὰρ (w2 / G1063), and eliminates the fake G1510.
 *
 * 2. #2 «فِيكُمْ»:
 *    - Primary: G1722 (ἐν @ SBLGNT w3, preposition)
 *    - Secondary: G4771 (ὑμῖν @ SBLGNT w4, pronoun, RP ----DP--)
 *    - Locator: SBLGNT:B50.C2.V5.w3
 *
 * 3. #3 «هذَا»:
 *    - G3778 (τοῦτο @ SBLGNT w1, demonstrative, RD ----ASN-, accusative neuter singular)
 *    - Locator: SBLGNT:B50.C2.V5.w1
 *
 * 4. #4 «الْفِكْرُ»:
 *    - G5426 (φρονεῖτε @ SBLGNT w2, verb, V- 2PAD-P--, present active imperative 2nd plural)
 *    - Locator: SBLGNT:B50.C2.V5.w2
 *
 * 5. #5 «الَّذِي»:
 *    - G3739 (ὃ @ SBLGNT w5, relative pronoun, RR ----NSN-, nominative neuter singular)
 *    - Locator: SBLGNT:B50.C2.V5.w5
 *
 * 6. #6 «فِي»:
 *    - G1722 (ἐν @ SBLGNT w7, preposition, P- --------)
 *    - Locator: SBLGNT:B50.C2.V5.w7
 *
 * 7. #7 «الْمَسِيحِ»:
 *    - G5547 (Χριστῷ @ SBLGNT w8, noun, N- ----DSM-, dative masculine singular)
 *    - morph_pos set to 'noun' per SBLGNT N- category
 *    - Locator: SBLGNT:B50.C2.V5.w8
 *
 * 8. #8 «يَسُوعَ»:
 *    - G2424 (Ἰησοῦ @ SBLGNT w9, noun, N- ----DSM-, dative masculine singular)
 *    - morph_pos set to 'noun' per SBLGNT N- category
 *    - Locator: SBLGNT:B50.C2.V5.w9
 *
 * 9. #9 «أَيْضًا»:
 *    - G2532 (καὶ @ SBLGNT w6, adverb, D- --------)
 *    - Locator: SBLGNT:B50.C2.V5.w6
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const sqlitePath = path.join(repoRoot, 'sqlite_dist/sqlite3.exe');

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function q(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

console.log('========================================================================');
console.log('  PHILIPPIANS 2:5 (PHIL 2:5) FULL VERSE CALIBRATION (BATCH 2F)           ');
console.log('========================================================================\n');

const hashBefore = sha256(dbPath);
console.log(`DB SHA-256 before: ${hashBefore}`);

const sqlScript = `
BEGIN TRANSACTION;

-- 1. #1 فَلْيَكُنْ -> syntactic_ar
UPDATE word_mappings
SET strongs_id = NULL, orig_word_position = 0, orig_word = '—', orig_surface = '—', orig_morphology = NULL,
    morph_pos = 'syntactic_ar', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'syntactic_ar', verified_locator = 'AR_SYNTACTIC:B50.C2.V5.w1', relation_type = NULL,
    grammar_notes = 'فعل أمر ناقص (ناسخ) عربي مقترن بلام الأمر لإقامة المعنى المقابل للفعل اليوناني (φρονεῖτε / φρονείσθω). في نص SBLGNT جاء الفعل بصيغة الأمر للمخاطب الجمع (φρονεῖτε / G5426 @ w2)، بينما في Scrivener TR جاء بصيغة الأمر للغائب المفرد المبني للمجهول (φρονείσθω @ w3) مع حرف العطف γὰρ (@ w2). ولا يوجد أصل منفصل من εἰμί (G1510) في النص اليوناني.'
WHERE id = '01358317-4af5-490f-94ee-d1630cc52e4e';
DELETE FROM word_mapping_strongs WHERE mapping_id = '01358317-4af5-490f-94ee-d1630cc52e4e';

-- 2. #2 فِيكُمْ -> primary G1722 @ w3 + secondary G4771 @ w4
UPDATE word_mappings
SET strongs_id = 'G1722', orig_word_position = 3, orig_word = 'ἐν', orig_surface = 'ἐν', orig_morphology = 'P- --------',
    morph_pos = 'preposition', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B50.C2.V5.w3', relation_type = 'direct',
    grammar_notes = NULL
WHERE id = '26e7f5f7-52db-4ae4-8a86-3f14d573e46d';
DELETE FROM word_mapping_strongs WHERE mapping_id = '26e7f5f7-52db-4ae4-8a86-3f14d573e46d';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('26e7f5f7-52db-4ae4-8a86-3f14d573e46d', 'G1722', 1, 'primary', 3, 'ἐν', 'P- --------', 'morphgnt_sblgnt'),
       ('26e7f5f7-52db-4ae4-8a86-3f14d573e46d', 'G4771', 2, 'secondary', 4, 'ὑμῖν', 'RP ----DP--', 'morphgnt_sblgnt');

-- 3. #3 هذَا -> G3778 @ w1 (τοῦτο)
UPDATE word_mappings
SET strongs_id = 'G3778', orig_word_position = 1, orig_word = 'οὗτος', orig_surface = 'τοῦτο', orig_morphology = 'RD ----ASN-',
    morph_pos = 'demonstrative', morph_person = NULL, morph_number = 'singular', morph_gender = 'neuter', morph_case = 'accusative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B50.C2.V5.w1', relation_type = 'direct',
    grammar_notes = NULL
WHERE id = 'a832f63e-b6ed-4436-af64-26813b26d102';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'a832f63e-b6ed-4436-af64-26813b26d102';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('a832f63e-b6ed-4436-af64-26813b26d102', 'G3778', 1, 'primary', 1, 'τοῦτο', 'RD ----ASN-', 'morphgnt_sblgnt');

-- 4. #4 الْفِكْرُ -> G5426 @ w2 (φρονεῖτε)
UPDATE word_mappings
SET strongs_id = 'G5426', orig_word_position = 2, orig_word = 'φρονέω', orig_surface = 'φρονεῖτε', orig_morphology = 'V- 2PAD-P--',
    morph_pos = 'verb', morph_person = '2', morph_number = 'plural', morph_gender = NULL, morph_case = NULL,
    morph_tense = 'present', morph_voice = 'active', morph_mood = 'imperative', morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B50.C2.V5.w2', relation_type = 'direct',
    grammar_notes = 'الفعل اليوناني φρονεῖτε (φρονέω / G5426) بصيغة الأمر الحاضر للمخاطب الجمع (V- 2PAD-P--) في SBLGNT. في Scrivener TR يقابله φρονείσθω بصيغة الأمر المبني للمجهول للغائب المفرد (V-PPM-3S).'
WHERE id = '69f167d2-0357-49d9-9a9c-4fcc2d758c39';
DELETE FROM word_mapping_strongs WHERE mapping_id = '69f167d2-0357-49d9-9a9c-4fcc2d758c39';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('69f167d2-0357-49d9-9a9c-4fcc2d758c39', 'G5426', 1, 'primary', 2, 'φρονεῖτε', 'V- 2PAD-P--', 'morphgnt_sblgnt');

-- 5. #5 الَّذِي -> G3739 @ w5 (ὃ)
UPDATE word_mappings
SET strongs_id = 'G3739', orig_word_position = 5, orig_word = 'ὅς', orig_surface = 'ὃ', orig_morphology = 'RR ----NSN-',
    morph_pos = 'relative_pronoun', morph_person = NULL, morph_number = 'singular', morph_gender = 'neuter', morph_case = 'nominative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B50.C2.V5.w5', relation_type = 'direct',
    grammar_notes = NULL
WHERE id = '3387c97b-a6f8-46c9-b5ca-4c93a1f216d0';
DELETE FROM word_mapping_strongs WHERE mapping_id = '3387c97b-a6f8-46c9-b5ca-4c93a1f216d0';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('3387c97b-a6f8-46c9-b5ca-4c93a1f216d0', 'G3739', 1, 'primary', 5, 'ὃ', 'RR ----NSN-', 'morphgnt_sblgnt');

-- 6. #6 فِي -> G1722 @ w7 (ἐν)
UPDATE word_mappings
SET strongs_id = 'G1722', orig_word_position = 7, orig_word = 'ἐν', orig_surface = 'ἐν', orig_morphology = 'P- --------',
    morph_pos = 'preposition', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B50.C2.V5.w7', relation_type = 'direct',
    grammar_notes = NULL
WHERE id = 'c71a9f56-e2b6-4cf8-9eb6-6b3861bc6897';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'c71a9f56-e2b6-4cf8-9eb6-6b3861bc6897';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('c71a9f56-e2b6-4cf8-9eb6-6b3861bc6897', 'G1722', 1, 'primary', 7, 'ἐν', 'P- --------', 'morphgnt_sblgnt');

-- 7. #7 الْمَسِيحِ -> G5547 @ w8 (Χριστῷ)
UPDATE word_mappings
SET strongs_id = 'G5547', orig_word_position = 8, orig_word = 'Χριστός', orig_surface = 'Χριστῷ', orig_morphology = 'N- ----DSM-',
    morph_pos = 'noun', morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'dative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B50.C2.V5.w8', relation_type = 'direct',
    grammar_notes = NULL
WHERE id = 'cb1822ed-ea7f-4655-9b9a-7eaf73e09445';
DELETE FROM word_mapping_strongs WHERE mapping_id = 'cb1822ed-ea7f-4655-9b9a-7eaf73e09445';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('cb1822ed-ea7f-4655-9b9a-7eaf73e09445', 'G5547', 1, 'primary', 8, 'Χριστῷ', 'N- ----DSM-', 'morphgnt_sblgnt');

-- 8. #8 يَسُوعَ -> G2424 @ w9 (Ἰησοῦ)
UPDATE word_mappings
SET strongs_id = 'G2424', orig_word_position = 9, orig_word = 'Ἰησοῦς', orig_surface = 'Ἰησοῦ', orig_morphology = 'N- ----DSM-',
    morph_pos = 'noun', morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'dative',
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B50.C2.V5.w9', relation_type = 'direct',
    grammar_notes = NULL
WHERE id = '2d86ba46-1aa0-45f1-9226-cc9f2b7404dc';
DELETE FROM word_mapping_strongs WHERE mapping_id = '2d86ba46-1aa0-45f1-9226-cc9f2b7404dc';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('2d86ba46-1aa0-45f1-9226-cc9f2b7404dc', 'G2424', 1, 'primary', 9, 'Ἰησοῦ', 'N- ----DSM-', 'morphgnt_sblgnt');

-- 9. #9 أَيْضًا -> G2532 @ w6 (καὶ)
UPDATE word_mappings
SET strongs_id = 'G2532', orig_word_position = 6, orig_word = 'καί', orig_surface = 'καὶ', orig_morphology = 'D- --------',
    morph_pos = 'adverb', morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL,
    morph_tense = NULL, morph_voice = NULL, morph_mood = NULL, morph_stem = NULL,
    morph_source = 'morphgnt_sblgnt', verified_locator = 'SBLGNT:B50.C2.V5.w6', relation_type = 'direct',
    grammar_notes = NULL
WHERE id = '8362a06e-e930-41a1-9ee9-a031278fbea8';
DELETE FROM word_mapping_strongs WHERE mapping_id = '8362a06e-e930-41a1-9ee9-a031278fbea8';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('8362a06e-e930-41a1-9ee9-a031278fbea8', 'G2532', 1, 'primary', 6, 'καὶ', 'D- --------', 'morphgnt_sblgnt');

COMMIT;
`;

q(sqlScript);

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity check failed: ${integrity}`);
}

const hashAfter = sha256(dbPath);
console.log(`DB SHA-256 after:  ${hashAfter}`);
console.log('Integrity check: ok');
console.log('Philippians 2:5 full-verse calibration completed successfully.');
