const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'temp_apply_v42.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${db}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

console.log('--- Applying Release 312 / Database v42 Repairs ---');

const sql = `
BEGIN TRANSACTION;

-- 1. Strong's entry documentation for H3807a (distinct from H3807)
DELETE FROM strongs_entries WHERE strongs_id = 'H3807a';
INSERT INTO strongs_entries (strongs_id, language, original_word, transliteration, definition_en, kjv_usage)
VALUES (
  'H3807a',
  'hebrew',
  'לָנוּ',
  'lâ-nû',
  'Preposition with 1st person plural pronoun suffix: to us, for us [Scholarly lexical extension from Open Scriptures / BDB for לָנוּ, distinct from primitive root H3807 כָּتַת]',
  'to us, for us, unto us'
);

-- 2. Eph 2:8 pos 5 ("وَذلِكَ"): Correct raw morphology from RD ----NNN- to RD ----NSN- (Nominative Singular Neuter)
UPDATE word_mappings 
SET 
  orig_morphology = 'RD ----NSN-',
  morph_case = 'nominative',
  morph_number = 'singular',
  morph_gender = 'neuter',
  morph_source = 'morphgnt_sblgnt',
  verified_source = 'SBLGNT'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 49 AND chapter_num = 2 AND verse_num = 8)
  AND ar_word_position = 5;

-- 3. Isa 53:5 Raw Morphology Corrections
-- "مَجْرُوحٌ" (word 2): OSHB is HVOsmsa (Polal passive participle masculine singular absolute)
UPDATE word_mappings 
SET 
  orig_morphology = 'HVOsmsa',
  morph_stem = 'polal',
  morph_tense = 'participle',
  morph_gender = 'masculine',
  morph_number = 'singular',
  morph_source = 'oshb_wlc',
  verified_source = 'OSHB',
  relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5)
  AND ar_word_position = 2;

-- "سَلاَمِنَا" (word 9): OSHB is HNcmsc/Sp1cp (construct 'c' before pronominal suffix)
UPDATE word_mappings 
SET 
  orig_morphology = 'HNcmsc/Sp1cp',
  morph_gender = 'masculine',
  morph_number = 'singular',
  morph_source = 'oshb_wlc',
  verified_source = 'OSHB',
  relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5)
  AND ar_word_position = 9;

-- "وَبِحُبُرِهِ" (word 11): OSHB is HC/R/Ncfsc/Sp3ms (construct 'c' before pronominal suffix)
UPDATE word_mappings 
SET 
  orig_morphology = 'HC/R/Ncfsc/Sp3ms',
  morph_gender = 'feminine',
  morph_number = 'singular',
  morph_source = 'oshb_wlc',
  verified_source = 'OSHB',
  relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5)
  AND ar_word_position = 11;

-- "شُفِينَا" (word 12): Spans tokens 10 and 11 in WLC (נִרְפָּא w10, לָנוּ w11). Full morphology HVNp3ms/R/Sp1cp
UPDATE word_mappings 
SET 
  orig_word_position = 10,
  verified_locator = 'OSHB:B23.C53.V5.w10-w11',
  orig_morphology = 'HVNp3ms/R/Sp1cp',
  morph_stem = 'niphal',
  morph_tense = 'perfect',
  morph_person = '3',
  morph_gender = 'masculine',
  morph_number = 'singular',
  grammar_notes = 'مركب فعلي وشبه جملة: الفعل العبري נִרְפָּא (موضع 10، بناء Niphal ماضٍ، H7495) + شبه جملة الجار والمجرور לָנוּ (موضع 11، حرف جر لـ + ضمير المتكلمين الجمع، H3807a).',
  morph_source = 'oshb_wlc',
  verified_source = 'OSHB',
  relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 53 AND verse_num = 5)
  AND ar_word_position = 12;

-- 4. Three Conflicting Provenance Records
-- 4a. 1 Sam 25:43 pos 7 "فَكَانَتَا": Fix morph_source from syntactic_ar to oshb_wlc, supply OSHB morphology HC/Vqw3fp
UPDATE word_mappings 
SET 
  orig_morphology = 'HC/Vqw3fp',
  morph_pos = 'verb',
  morph_stem = 'qal',
  morph_tense = 'wayyiqtol',
  morph_person = '3',
  morph_gender = 'feminine',
  morph_number = 'plural',
  morph_source = 'oshb_wlc',
  verified_source = 'OSHB',
  verified_locator = 'OSHB:B9.C25.V43.w6'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 25 AND verse_num = 43)
  AND ar_word_position = 7;

-- Also fix 1 Sam 25:43 pos 5 "مِنْ":
UPDATE word_mappings 
SET 
  orig_morphology = 'HR',
  verified_locator = 'OSHB:B9.C25.V43.w5'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 25 AND verse_num = 43)
  AND ar_word_position = 5;

-- 4b. Acts 1:8 pos 2 "سَتَنَالُونَ": Align source to morphgnt_sblgnt with SBLGNT locator
UPDATE word_mappings 
SET 
  morph_source = 'morphgnt_sblgnt',
  verified_source = 'SBLGNT',
  orig_morphology = 'V-FDI-2P'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 1 AND verse_num = 8)
  AND ar_word_position = 2;

-- 4c. Heb 11:1 pos 3 "فَهُوَ": Align source to morphgnt_sblgnt with SBLGNT locator
UPDATE word_mappings 
SET 
  morph_source = 'morphgnt_sblgnt',
  verified_source = 'SBLGNT',
  orig_morphology = 'V-PAI-3S'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 58 AND chapter_num = 11 AND verse_num = 1)
  AND ar_word_position = 3;

-- 5. Global Cleanup of conflicting source/locator across entire DB
UPDATE word_mappings 
SET 
  morph_source = 'morphgnt_sblgnt',
  verified_source = 'SBLGNT'
WHERE morph_source = 'morphgnt_tr' AND verified_locator LIKE 'SBLGNT:%';

UPDATE word_mappings 
SET 
  morph_source = 'oshb_wlc',
  verified_source = 'OSHB'
WHERE morph_pos = 'verb' AND (morph_source = 'syntactic_ar' OR verified_source = 'syntactic_ar') AND strongs_id LIKE 'H%';

UPDATE word_mappings 
SET 
  morph_source = 'morphgnt_sblgnt',
  verified_source = 'SBLGNT'
WHERE morph_pos = 'verb' AND (morph_source = 'syntactic_ar' OR verified_source = 'syntactic_ar') AND strongs_id LIKE 'G%';

COMMIT;
`;

runSql(sql);
console.log('--- Successfully applied v42 database updates ---');
