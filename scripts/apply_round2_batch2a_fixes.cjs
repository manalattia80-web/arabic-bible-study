/**
 * apply_round2_batch2a_fixes.cjs
 * Applies the 4 zero-collision manually adjudicated Batch 2A repairs:
 *   1. Mic 7:18 #2 ("هُوَ") -> AR_SYNTACTIC:B33.C7.V18.w2
 *   2. 1Thess 5:18 #7 ("هِيَ") -> AR_SYNTACTIC:B52.C5.V18.w7
 *   3. Dan 6:22 #3 ("مَلاَكَهُ") -> H4398 @ OSHB:B27.C6.V23.w3 (Dan.6.23 versification)
 *   4. Rom 5:8 #11 ("الْمَسِيحُ") -> G5547 @ SBLGNT:B45.C5.V8.w15
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
console.log(`DB SHA-256 before Batch 2A repair: ${beforeSha}`);

const sql = `
BEGIN TRANSACTION;

-- 1. Mic 7:18 #2 ("هُوَ") -> AR_SYNTACTIC
UPDATE word_mappings
SET strongs_id = NULL,
    orig_word_position = NULL,
    orig_word = '—',
    orig_surface = '—',
    orig_morphology = NULL,
    morph_pos = 'syntactic_ar',
    morph_gender = NULL,
    morph_number = NULL,
    morph_person = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_case = NULL,
    morph_stem = NULL,
    morph_source = 'syntactic_ar',
    verified_locator = 'AR_SYNTACTIC:B33.C7.V18.w2'
WHERE id = '3c23060b-d45b-4621-a72f-57859eaad186';

DELETE FROM word_mapping_strongs
WHERE mapping_id = '3c23060b-d45b-4621-a72f-57859eaad186';

-- 2. 1Thess 5:18 #7 ("هِيَ") -> AR_SYNTACTIC
UPDATE word_mappings
SET strongs_id = NULL,
    orig_word_position = NULL,
    orig_word = '—',
    orig_surface = '—',
    orig_morphology = NULL,
    morph_pos = 'syntactic_ar',
    morph_gender = NULL,
    morph_number = NULL,
    morph_person = NULL,
    morph_tense = NULL,
    morph_voice = NULL,
    morph_mood = NULL,
    morph_case = NULL,
    morph_stem = NULL,
    morph_source = 'syntactic_ar',
    verified_locator = 'AR_SYNTACTIC:B52.C5.V18.w7'
WHERE id = 'bbbd4fb0-6d57-4936-ab48-c9569e591a94';

DELETE FROM word_mapping_strongs
WHERE mapping_id = 'bbbd4fb0-6d57-4936-ab48-c9569e591a94';

-- 3. Dan 6:22 #3 ("مَلاَكَهُ") -> H4398 @ OSHB:B27.C6.V23.w3
UPDATE word_mappings
SET strongs_id = 'H4398',
    orig_word_position = 3,
    orig_word = 'מַלְאַךְ',
    orig_surface = 'מַלְאֲכֵ֗הּ',
    orig_morphology = 'ANcmsc/Sp3ms',
    morph_pos = 'noun',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'construct',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B27.C6.V23.w3'
WHERE id = '577077bd-a7dc-4d40-90ee-b06bb509df43';

UPDATE word_mapping_strongs
SET strongs_id = 'H4398',
    orig_word_position = 3,
    orig_component = 'מַלְאֲכֵ֗הּ',
    orig_morphology = 'ANcmsc/Sp3ms',
    morph_source = 'oshb_wlc'
WHERE mapping_id = '577077bd-a7dc-4d40-90ee-b06bb509df43' AND link_order = 1;

-- 4. Rom 5:8 #11 ("الْمَسِيحُ") -> G5547 @ SBLGNT:B45.C5.V8.w15
UPDATE word_mappings
SET strongs_id = 'G5547',
    orig_word_position = 15,
    orig_word = 'Χριστός',
    orig_surface = 'Χριστὸς',
    orig_morphology = 'N- ----NSM-',
    morph_pos = 'noun',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_case = 'nominative',
    morph_source = 'morphgnt_sblgnt',
    verified_locator = 'SBLGNT:B45.C5.V8.w15'
WHERE id = 'd6a222c5-3fa4-408f-bdac-04d2ceea6b42';

UPDATE word_mapping_strongs
SET strongs_id = 'G5547',
    orig_word_position = 15,
    orig_component = 'Χριστὸς',
    orig_morphology = 'N- ----NSM-',
    morph_source = 'morphgnt_sblgnt'
WHERE mapping_id = 'd6a222c5-3fa4-408f-bdac-04d2ceea6b42' AND link_order = 1;

COMMIT;
`;

execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' });
const afterSha = sha256File(dbPath);
console.log(`DB SHA-256 after  Batch 2A repair: ${afterSha}`);
console.log('Applied 4 zero-collision Batch 2A repairs (Mic 7:18 #2, 1Thess 5:18 #7, Dan 6:22 #3, Rom 5:8 #11).');
