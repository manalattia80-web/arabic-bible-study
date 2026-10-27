const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function executeSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_morph_fix.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('Applying morphological and documentation corrections...');

const sql = `
BEGIN TRANSACTION;

-- 1. Gen 3:6 pos 13: 'لِلنَّظَرِ' -> לְהַשְׂכִּיל (Hifil Infinitive Construct with preposition Lamed)
UPDATE word_mappings 
SET morph_pos = 'verb',
    morph_stem = 'hifil',
    morph_tense = 'infinitive_construct',
    morph_voice = 'active',
    morph_mood = NULL,
    morph_person = NULL,
    morph_number = NULL,
    morph_gender = NULL,
    orig_morphology = 'HR/Vhc',
    verified_source = 'oshb_wlc',
    verified_locator = 'OSHB:B1.C3.V6.w13',
    verified_at = '2026-10-27',
    grammar_notes = 'Preposition Lamed prefixed to Hifil Infinitive Construct of שָׂכַל (to make wise, give understanding, contemplate).'
WHERE id = '48efac3f-9748-4c10-9508-f6da552bf563';

-- 2. Matt 17:20 pos 18: 'لِهذَا' -> τούτῳ (Demonstrative Pronoun, Dative Singular Neuter)
UPDATE word_mappings 
SET morph_pos = 'pronoun',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = NULL,
    morph_number = 'singular',
    morph_gender = 'neuter',
    morph_case = 'dative',
    orig_morphology = 'D-DSN',
    verified_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B40.C17.V20.w18',
    verified_at = '2026-10-27',
    grammar_notes = 'Demonstrative pronoun dative singular neuter modifying τῷ ὄρει (this mountain).'
WHERE id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee';

-- 3. Gen 3:18 pos 4: 'لَكَ' -> לָךְ (Preposition Lamed with 2ms suffix)
UPDATE word_mappings 
SET morph_pos = 'preposition',
    morph_stem = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_person = '2',
    morph_number = 'singular',
    morph_gender = 'masculine',
    morph_case = NULL,
    orig_morphology = 'HR/Sp2ms',
    verified_source = 'oshb_wlc',
    verified_locator = 'OSHB:B1.C3.V18.w4',
    verified_at = '2026-10-27',
    grammar_notes = 'Preposition Lamed with 2nd person masculine singular pronominal suffix.'
WHERE id = 'fba6dab6-e8af-4b6a-8d43-b7a9f0350b40';

COMMIT;
`;

executeSql(sql);
console.log('SQL transaction applied successfully!');

// Verification queries
console.log('\n--- Verification: Gen 3:6 للنظر ---');
console.log(executeSql(`
SELECT ar_word, orig_word, orig_surface, morph_pos, morph_stem, morph_tense, morph_person, morph_gender, orig_morphology, verified_locator
FROM word_mappings WHERE id = '48efac3f-9748-4c10-9508-f6da552bf563';
`));

console.log('\n--- Verification: Matt 17:20 لهذا ---');
console.log(executeSql(`
SELECT ar_word, orig_word, orig_surface, morph_pos, morph_case, morph_number, morph_gender, orig_morphology, verified_locator
FROM word_mappings WHERE id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee';
`));

console.log('\n--- Verification: Gen 3:18 لك ---');
console.log(executeSql(`
SELECT ar_word, orig_word, orig_surface, morph_pos, morph_person, morph_gender, orig_morphology, verified_locator
FROM word_mappings WHERE id = 'fba6dab6-e8af-4b6a-8d43-b7a9f0350b40';
`));
