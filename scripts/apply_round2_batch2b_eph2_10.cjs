/**
 * apply_round2_batch2b_eph2_10.cjs
 * Full-verse alignment and morphology repair for Eph 2:10 (all 16 Arabic words -> 19 SBLGNT tokens).
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
console.log(`DB SHA-256 before Eph 2:10 full-verse repair: ${beforeSha}`);

const sql = `
BEGIN TRANSACTION;

-- #1 لأَنَّنَا -> G1063 @ w2 (γάρ)
UPDATE word_mappings SET strongs_id='G1063', orig_word_position=2, orig_word='γάρ', orig_surface='γάρ', orig_morphology='C- --------', morph_pos='conjunction', morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w2' WHERE id='4b5dba9e-4782-4ee4-b4f1-49babc2d5045';
DELETE FROM word_mapping_strongs WHERE mapping_id='4b5dba9e-4782-4ee4-b4f1-49babc2d5045';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('4b5dba9e-4782-4ee4-b4f1-49babc2d5045', 'G1063', 1, 'primary', 2, 'γάρ', 'C- --------', 'morphgnt_sblgnt');

-- #2 نَحْنُ -> G1510 @ w3 (ἐσμεν)
UPDATE word_mappings SET strongs_id='G1510', orig_word_position=3, orig_word='εἰμί', orig_surface='ἐσμεν', orig_morphology='V- 1PAI-P--', morph_pos='verb', morph_person='1', morph_tense='present', morph_voice='active', morph_mood='indicative', morph_number='plural', morph_gender=NULL, morph_case=NULL, morph_stem=NULL, morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w3' WHERE id='fff726b9-39fc-4656-8d7c-5ffd87aa4726';
DELETE FROM word_mapping_strongs WHERE mapping_id='fff726b9-39fc-4656-8d7c-5ffd87aa4726';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('fff726b9-39fc-4656-8d7c-5ffd87aa4726', 'G1510', 1, 'primary', 3, 'ἐσμεν', 'V- 1PAI-P--', 'morphgnt_sblgnt');

-- #3 عَمَلُهُ -> G4161 @ w4 (ποίημα) + G846 @ w1 (αὐτοῦ)
UPDATE word_mappings SET strongs_id='G4161', orig_word_position=4, orig_word='ποίημα', orig_surface='ποίημα', orig_morphology='N- ----NSN-', morph_pos='noun', morph_number='singular', morph_gender='neuter', morph_case='nominative', morph_person=NULL, morph_tense=NULL, morph_voice=NULL, morph_mood=NULL, morph_stem=NULL, morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w4' WHERE id='6b6ebba2-32b1-487f-9208-9a324466d7ee';
DELETE FROM word_mapping_strongs WHERE mapping_id='6b6ebba2-32b1-487f-9208-9a324466d7ee';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES
  ('6b6ebba2-32b1-487f-9208-9a324466d7ee', 'G4161', 1, 'primary', 4, 'ποίημα', 'N- ----NSN-', 'morphgnt_sblgnt'),
  ('6b6ebba2-32b1-487f-9208-9a324466d7ee', 'G846', 2, 'secondary', 1, 'αὐτοῦ', 'RP ----GSM-', 'morphgnt_sblgnt');

-- #4 مَخْلُوقِينَ -> G2936 @ w5 (κτισθέντες)
UPDATE word_mappings SET strongs_id='G2936', orig_word_position=5, orig_word='κτίζω', orig_surface='κτισθέντες', orig_morphology='V- -APPNPM-', morph_pos='verb', morph_tense='aorist', morph_voice='passive', morph_mood='participle', morph_case='nominative', morph_number='plural', morph_gender='masculine', morph_person=NULL, morph_stem=NULL, morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w5' WHERE id='f9070be4-3fb0-44df-97f1-49c36d07f0fb';
DELETE FROM word_mapping_strongs WHERE mapping_id='f9070be4-3fb0-44df-97f1-49c36d07f0fb';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('f9070be4-3fb0-44df-97f1-49c36d07f0fb', 'G2936', 1, 'primary', 5, 'κτισθέντες', 'V- -APPNPM-', 'morphgnt_sblgnt');

-- #5 فِي -> G1722 @ w6 (ἐν)
UPDATE word_mappings SET strongs_id='G1722', orig_word_position=6, orig_word='ἐν', orig_surface='ἐν', orig_morphology='P- --------', morph_pos='preposition', morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w6' WHERE id='4de29862-43d3-4c03-ad60-60a32a7f798f';
DELETE FROM word_mapping_strongs WHERE mapping_id='4de29862-43d3-4c03-ad60-60a32a7f798f';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('4de29862-43d3-4c03-ad60-60a32a7f798f', 'G1722', 1, 'primary', 6, 'ἐν', 'P- --------', 'morphgnt_sblgnt');

-- #6 الْمَسِيحِ -> G5547 @ w7 (Χριστῷ)
UPDATE word_mappings SET strongs_id='G5547', orig_word_position=7, orig_word='Χριστός', orig_surface='Χριστῷ', orig_morphology='N- ----DSM-', morph_pos='noun', morph_gender='masculine', morph_number='singular', morph_case='dative', morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w7' WHERE id='4b5700af-89f2-4475-a33b-1dd20f3b7deb';
DELETE FROM word_mapping_strongs WHERE mapping_id='4b5700af-89f2-4475-a33b-1dd20f3b7deb';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('4b5700af-89f2-4475-a33b-1dd20f3b7deb', 'G5547', 1, 'primary', 7, 'Χριστῷ', 'N- ----DSM-', 'morphgnt_sblgnt');

-- #7 يَسُوعَ -> G2424 @ w8 (Ἰησοῦ)
UPDATE word_mappings SET strongs_id='G2424', orig_word_position=8, orig_word='Ἰησοῦς', orig_surface='Ἰησοῦ', orig_morphology='N- ----DSM-', morph_pos='noun', morph_gender='masculine', morph_number='singular', morph_case='dative', morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w8' WHERE id='5b08a4c0-0ac9-4543-8b46-057eb337580c';
DELETE FROM word_mapping_strongs WHERE mapping_id='5b08a4c0-0ac9-4543-8b46-057eb337580c';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('5b08a4c0-0ac9-4543-8b46-057eb337580c', 'G2424', 1, 'primary', 8, 'Ἰησοῦ', 'N- ----DSM-', 'morphgnt_sblgnt');

-- #8 لأَعْمَال -> G2041 @ w10 (ἔργοις) + G1909 @ w9 (ἐπὶ)
UPDATE word_mappings SET strongs_id='G2041', orig_word_position=10, orig_word='ἔργον', orig_surface='ἔργοις', orig_morphology='N- ----DPN-', morph_pos='noun', morph_gender='neuter', morph_number='plural', morph_case='dative', morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w10' WHERE id='b7b7811b-f289-4c88-90a8-1f01c7e1ea3c';
DELETE FROM word_mapping_strongs WHERE mapping_id='b7b7811b-f289-4c88-90a8-1f01c7e1ea3c';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES
  ('b7b7811b-f289-4c88-90a8-1f01c7e1ea3c', 'G2041', 1, 'primary', 10, 'ἔργοις', 'N- ----DPN-', 'morphgnt_sblgnt'),
  ('b7b7811b-f289-4c88-90a8-1f01c7e1ea3c', 'G1909', 2, 'secondary', 9, 'ἐπὶ', 'P- --------', 'morphgnt_sblgnt');

-- #9 صَالِحَةٍ -> G18 @ w11 (ἀγαθοῖς)
UPDATE word_mappings SET strongs_id='G18', orig_word_position=11, orig_word='ἀγαθός', orig_surface='ἀγαθοῖς', orig_morphology='A- ----DPN-', morph_pos='adjective', morph_gender='neuter', morph_number='plural', morph_case='dative', morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w11' WHERE id='d09359e0-178c-4207-b194-331d81328a5d';
DELETE FROM word_mapping_strongs WHERE mapping_id='d09359e0-178c-4207-b194-331d81328a5d';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('d09359e0-178c-4207-b194-331d81328a5d', 'G18', 1, 'primary', 11, 'ἀγαθοῖς', 'A- ----DPN-', 'morphgnt_sblgnt');

-- #11 سَبَقَ -> G4282 @ w13 (προητοίμασεν, shared compound_phrase with #13 فَأَعَدَّهَا)
UPDATE word_mappings SET strongs_id='G4282', orig_word_position=13, orig_word='προετοιμάζω', orig_surface='προητοίμασεν', orig_morphology='V- 3AAI-S--', morph_pos='verb', morph_person='3', morph_tense='aorist', morph_voice='active', morph_mood='indicative', morph_number='singular', morph_gender=NULL, morph_case=NULL, morph_stem=NULL, morph_source='morphgnt_sblgnt', relation_type='compound_phrase', grammar_notes='Shared discontinuous compound verb (سَبَقَ ... فَأَعَدَّهَا) translating Greek προητοίμασεν (G4282) split around subject اللهُ (ὁ θεός).', verified_locator='SBLGNT:B49.C2.V10.w13' WHERE id='5a3d134f-f79a-449f-8267-b54dec4486ea';
DELETE FROM word_mapping_strongs WHERE mapping_id='5a3d134f-f79a-449f-8267-b54dec4486ea';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('5a3d134f-f79a-449f-8267-b54dec4486ea', 'G4282', 1, 'primary', 13, 'προητοίμασεν', 'V- 3AAI-S--', 'morphgnt_sblgnt');

-- #12 اللهُ -> G2316 @ w15 (θεὸς) + G3588 @ w14 (ὁ)
UPDATE word_mappings SET strongs_id='G2316', orig_word_position=15, orig_word='θεός', orig_surface='θεὸς', orig_morphology='N- ----NSM-', morph_pos='noun', morph_gender='masculine', morph_number='singular', morph_case='nominative', morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w15' WHERE id='abda7170-1ea0-40c2-8bc5-06b947dc7909';
DELETE FROM word_mapping_strongs WHERE mapping_id='abda7170-1ea0-40c2-8bc5-06b947dc7909';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES
  ('abda7170-1ea0-40c2-8bc5-06b947dc7909', 'G2316', 1, 'primary', 15, 'θεὸς', 'N- ----NSM-', 'morphgnt_sblgnt'),
  ('abda7170-1ea0-40c2-8bc5-06b947dc7909', 'G3588', 2, 'secondary', 14, 'ὁ', 'RA ----NSM-', 'morphgnt_sblgnt');

-- #13 فَأَعَدَّهَا -> G4282 @ w13 (προητοίμασεν) + G3739 @ w12 (οἷς)
UPDATE word_mappings SET strongs_id='G4282', orig_word_position=13, orig_word='προετοιμάζω', orig_surface='προητοίμασεν', orig_morphology='V- 3AAI-S--', morph_pos='verb', morph_person='3', morph_tense='aorist', morph_voice='active', morph_mood='indicative', morph_number='singular', morph_gender=NULL, morph_case=NULL, morph_stem=NULL, morph_source='morphgnt_sblgnt', relation_type='compound_phrase', grammar_notes='Shared discontinuous compound verb (سَبَقَ ... فَأَعَدَّهَا) translating Greek προητοίμασεν (G4282) + relative pronoun οἷς (G3739 @ w12).', verified_locator='SBLGNT:B49.C2.V10.w13' WHERE id='9d7ed063-cfcc-43b7-9baa-bbea733081f4';
DELETE FROM word_mapping_strongs WHERE mapping_id='9d7ed063-cfcc-43b7-9baa-bbea733081f4';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES
  ('9d7ed063-cfcc-43b7-9baa-bbea733081f4', 'G4282', 1, 'primary', 13, 'προητοίμασεν', 'V- 3AAI-S--', 'morphgnt_sblgnt'),
  ('9d7ed063-cfcc-43b7-9baa-bbea733081f4', 'G3739', 2, 'secondary', 12, 'οἷς', 'RR ----DPN-', 'morphgnt_sblgnt');

-- #14 لِكَيْ -> G2443 @ w16 (ἵνα)
UPDATE word_mappings SET strongs_id='G2443', orig_word_position=16, orig_word='ἵνα', orig_surface='ἵνα', orig_morphology='C- --------', morph_pos='conjunction', morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w16' WHERE id='8ed37ee7-5360-41c7-8802-c182adafdc35';
DELETE FROM word_mapping_strongs WHERE mapping_id='8ed37ee7-5360-41c7-8802-c182adafdc35';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('8ed37ee7-5360-41c7-8802-c182adafdc35', 'G2443', 1, 'primary', 16, 'ἵνα', 'C- --------', 'morphgnt_sblgnt');

-- #15 نَسْلُكَ -> G4043 @ w19 (περιπατήσωμεν)
UPDATE word_mappings SET strongs_id='G4043', orig_word_position=19, orig_word='περιπατέω', orig_surface='περιπατήσωμεν', orig_morphology='V- 1AAS-P--', morph_pos='verb', morph_person='1', morph_tense='aorist', morph_voice='active', morph_mood='subjunctive', morph_number='plural', morph_gender=NULL, morph_case=NULL, morph_stem=NULL, morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w19' WHERE id='4114625d-88a8-42d9-b888-4de28dca4236';
DELETE FROM word_mapping_strongs WHERE mapping_id='4114625d-88a8-42d9-b888-4de28dca4236';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES ('4114625d-88a8-42d9-b888-4de28dca4236', 'G4043', 1, 'primary', 19, 'περιπατήσωμεν', 'V- 1AAS-P--', 'morphgnt_sblgnt');

-- #16 فِيهَا -> G1722 @ w17 (ἐν) + G846 @ w18 (αὐτοῖς)
UPDATE word_mappings SET strongs_id='G1722', orig_word_position=17, orig_word='ἐν', orig_surface='ἐν', orig_morphology='P- --------', morph_pos='preposition', morph_source='morphgnt_sblgnt', verified_locator='SBLGNT:B49.C2.V10.w17' WHERE id='3ffa88b1-482f-4361-a476-da3eb656bf24';
DELETE FROM word_mapping_strongs WHERE mapping_id='3ffa88b1-482f-4361-a476-da3eb656bf24';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_word_position, orig_component, orig_morphology, morph_source) VALUES
  ('3ffa88b1-482f-4361-a476-da3eb656bf24', 'G1722', 1, 'primary', 17, 'ἐν', 'P- --------', 'morphgnt_sblgnt'),
  ('3ffa88b1-482f-4361-a476-da3eb656bf24', 'G846', 2, 'secondary', 18, 'αὐτοῖς', 'RP ----DPN-', 'morphgnt_sblgnt');

COMMIT;
`;

execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' });
const afterSha = sha256File(dbPath);
console.log(`DB SHA-256 after  Eph 2:10 full-verse repair: ${afterSha}`);
console.log('Applied full-verse Eph 2:10 alignment & morphology repair (all 16 Arabic words).');
