const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlitePath = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function executeSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_apply_v47.sql');
  fs.writeFileSync(tmpFile, `BEGIN TRANSACTION;\n${sql}\nCOMMIT;\n`, 'utf8');
  try {
    const res = execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 });
    return res.toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('--- Applying Full Harmonization to 10 Target Verses (v47 Release) ---');

const sql = `
-- Document extended lexical identifiers in strongs_entries
UPDATE strongs_entries
SET definition_en = 'Inseparable conjunction: and, but, also, even, then [Extended Lexical Identifier (Open Scriptures/BDB / معرّف معجمي ممتد) for Hebrew conjunction prefix וְ (OSHB: HC)].'
WHERE strongs_id = 'H9002';

UPDATE strongs_entries
SET definition_en = 'Inseparable preposition: in, with, by, at, through [Extended Lexical Identifier (Open Scriptures/BDB / معرّف معجمي ممتد) for Hebrew inseparable preposition prefix בְּ (OSHB: HR), distinguished from root numbers to identify standalone prepositional particles].'
WHERE strongs_id = 'H9003';

UPDATE strongs_entries
SET definition_en = 'Inseparable preposition: to, for, toward, belonging to [Extended Lexical Identifier (Open Scriptures/BDB / معرّف معجمي ممتد) for Hebrew preposition prefix לְ (OSHB: HR)].'
WHERE strongs_id = 'H9005';

-- 1. 1 Sam 19:15 w1 «ثُمَّ»: conjunction prefix וַ in וישלح w1
UPDATE word_mappings 
SET orig_word_position = 1, strongs_id = 'H9002', orig_word = 'וְ', orig_surface = 'וַ/יִּשְׁלַ֤ח', orig_morphology = 'HC',
    verified_locator = 'OSHB:B9.C19.V15.w1', relation_type = 'compound_prefix', morph_pos = 'conjunction',
    morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 19 AND verse_num = 15) AND ar_word_position = 1;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES 
  ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 19 AND verse_num = 15) AND ar_word_position = 1),
   'H9002', 1, 'primary', 'וַ/יִּשְׁלַ֤ח', 1, 'HC', 'oshb_wlc');

-- 2. 1 Sam 19:15 w11 «عَلَى»: preposition prefix בַ in במטה w11
UPDATE word_mappings 
SET orig_word_position = 11, strongs_id = 'H9003', orig_word = 'בְּ', orig_surface = 'בַ/מִּטָּ֛ה', orig_morphology = 'HR',
    verified_locator = 'OSHB:B9.C19.V15.w11', relation_type = 'compound_prefix', morph_pos = 'preposition',
    morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 19 AND verse_num = 15) AND ar_word_position = 11;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES 
  ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 19 AND verse_num = 15) AND ar_word_position = 11),
   'H9003', 1, 'primary', 'בַ/מִּטָּ֛ה', 11, 'HR', 'oshb_wlc');

-- 3. 1 Sam 19:15 w13 «لِكَيْ»: preposition prefix לַ in להמיתو w13
UPDATE word_mappings 
SET orig_word_position = 13, strongs_id = 'H9005', orig_word = 'לְ', orig_surface = 'לַ/הֲמִתֽ/וֹ', orig_morphology = 'HR',
    verified_locator = 'OSHB:B9.C19.V15.w13', relation_type = 'compound_prefix', morph_pos = 'preposition',
    morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 19 AND verse_num = 15) AND ar_word_position = 13;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES 
  ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 19 AND verse_num = 15) AND ar_word_position = 13),
   'H9005', 1, 'primary', 'לַ/הֲמִתֽ/וֹ', 13, 'HR', 'oshb_wlc');

-- 4. Prov 15:6 w6 «وَفِي»: conjunction & preposition וּ/בִ in ובתבואت w5
UPDATE word_mappings 
SET orig_word_position = 5, strongs_id = 'H9003', orig_word = 'בְּ', orig_surface = 'וּ/בִ/תְבוּאַ֖ת', orig_morphology = 'HC/R',
    verified_locator = 'OSHB:B20.C15.V6.w5', relation_type = 'compound_prefix', morph_pos = 'preposition',
    morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 15 AND verse_num = 6) AND ar_word_position = 6;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES 
  ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 15 AND verse_num = 6) AND ar_word_position = 6),
   'H9003', 1, 'primary', 'וּ/בִ/תְבוּאַ֖ת', 5, 'HC/R', 'oshb_wlc');

-- 5. Dan 3:30 w3 «الْمَلِكُ»: w2 מַלְכָּ֗א, H4430, ANcmsd/Td, pos 2
UPDATE word_mappings 
SET strongs_id = 'H4430', orig_word = 'מֶלֶךְ', orig_surface = 'מַלְכָּ֗א', orig_word_position = 2,
    verified_locator = 'OSHB:B27.C3.V30.w2', orig_morphology = 'ANcmsd/Td', morph_source = 'oshb_wlc', verified_source = 'OSHB',
    morph_pos = 'noun', morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'determined', relation_type = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 3 AND verse_num = 30) AND ar_word_position = 3;

-- 6. Dan 3:30 w7 «فِي»: preposition prefix בִּ in במדיنت w8
UPDATE word_mappings 
SET orig_word_position = 8, strongs_id = 'H9003', orig_word = 'בְּ', orig_surface = 'בִּ/מְדִינַ֥ת', orig_morphology = 'AR',
    verified_locator = 'OSHB:B27.C3.V30.w8', relation_type = 'compound_prefix', morph_pos = 'preposition',
    morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 3 AND verse_num = 30) AND ar_word_position = 7;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES 
  ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 3 AND verse_num = 30) AND ar_word_position = 7),
   'H9003', 1, 'primary', 'בִּ/מְדִינַ֥ת', 8, 'AR', 'oshb_wlc');

-- 7. John 14:19 w4 «يَرَانِي»: w8 θεωρεῖ, G2334, V- 3PAI-S--, pos 8
UPDATE word_mappings 
SET strongs_id = 'G2334', orig_word = 'θεωρέω', orig_surface = 'θεωρεῖ', orig_word_position = 8,
    verified_locator = 'SBLGNT:B43.C14.V19.w8', orig_morphology = 'V- 3PAI-S--', morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT',
    morph_pos = 'verb', morph_stem = NULL, morph_tense = 'present', morph_voice = 'active', morph_mood = 'indicative',
    morph_person = '3', morph_number = 'singular', morph_gender = NULL, morph_case = NULL, relation_type = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 14 AND verse_num = 19) AND ar_word_position = 4;

-- 8. John 14:19 w5 «الْعَالَمُ»: w5 κόσμος, G2889, N- ----NSM-, pos 5
UPDATE word_mappings 
SET strongs_id = 'G2889', orig_word = 'κόσμος', orig_surface = 'κόσμος', orig_word_position = 5,
    verified_locator = 'SBLGNT:B43.C14.V19.w5', orig_morphology = 'N- ----NSM-', morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT',
    morph_pos = 'noun', morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_person = NULL, morph_number = 'singular', morph_gender = 'masculine', morph_case = 'nominative', relation_type = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 14 AND verse_num = 19) AND ar_word_position = 5;

-- 9. John 14:19 w7 «وَأَمَّا»: w10 δὲ, G1161, C- --------, pos 10
UPDATE word_mappings 
SET strongs_id = 'G1161', orig_word = 'δέ', orig_surface = 'δὲ', orig_word_position = 10,
    verified_locator = 'SBLGNT:B43.C14.V19.w10', orig_morphology = 'C- --------', morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT',
    morph_pos = 'conjunction', morph_stem = NULL, morph_tense = NULL, morph_voice = NULL, morph_mood = NULL,
    morph_person = NULL, morph_number = NULL, morph_gender = NULL, morph_case = NULL, relation_type = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 14 AND verse_num = 19) AND ar_word_position = 7;

-- 10. Acts 6:8 w8 «كَانَ»: auxiliary past imperfect marker for w7 ἐποίει, G4160, V- 3IAI-S--, pos 7
UPDATE word_mappings 
SET strongs_id = 'G4160', orig_word = 'ποιέω', orig_surface = 'ἐποίει', orig_word_position = 7,
    verified_locator = 'SBLGNT:B44.C6.V8.w7', orig_morphology = 'V- 3IAI-S--', morph_source = 'morphgnt_sblgnt', verified_source = 'SBLGNT',
    morph_pos = 'verb', morph_stem = NULL, morph_tense = 'imperfect', morph_voice = 'active', morph_mood = 'indicative',
    morph_person = '3', morph_number = 'singular', morph_gender = NULL, morph_case = NULL, relation_type = 'auxiliary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 6 AND verse_num = 8) AND ar_word_position = 8;

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES 
  ((SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 6 AND verse_num = 8) AND ar_word_position = 8),
   'G4160', 1, 'primary', 'ἐποίει', 7, 'V- 3IAI-S--', 'morphgnt_sblgnt');
`;

const res = executeSql(sql);
console.log('Supplemental SQL Execution complete:', res || 'OK');
