/**
 * apply_round2_batch2c_1thess5_18.cjs
 * Full-verse alignment and morphology calibration for 1Thess 5:18 (all 14 Arabic words -> 12 SBLGNT tokens).
 *
 * Summary of adjustments:
 *   #1  اشْكُرُوا -> G2168 @ w3 (εὐχαριστεῖτε, V- 2PAD-P--)
 *   #2  فِي      -> G1722 @ w1 (ἐν, P- --------)
 *   #3  كُلِّ     -> G3956 @ w2 (παντὶ, A- ----DSN-, compound_phrase)
 *   #4  شَيْءٍ    -> G3956 @ w2 (παντὶ, A- ----DSN-, compound_phrase)
 *   #5  لأَنَّ     -> G1063 @ w5 (γὰρ, C- --------)
 *   #6  هذِهِ     -> G3778 @ w4 (τοῦτο, RD ----NSN-)
 *   #7  هِيَ     -> AR_SYNTACTIC:B52.C5.V18.w7 (preserved from Batch 2A)
 *   #8  مَشِيئَةُ  -> G2307 @ w6 (θέλημα, N- ----NSN-)
 *   #9  اللهِ     -> G2316 @ w7 (θεοῦ, N- ----GSM-)
 *   #10 فِي      -> G1722 @ w8 (ἐν, P- --------)
 *   #11 الْمَسِيحِ  -> G5547 @ w9 (Χριστῷ, N- ----DSM-, morph_pos='noun')
 *   #12 يَسُوعَ  -> G2424 @ w10 (Ἰησοῦ, N- ----DSM-, morph_pos='noun')
 *   #13 مِنْ     -> G1519 @ w11 (εἰς, P- --------)
 *   #14 جِهَتِكُمْ -> G4771 @ w12 (ὑμᾶς, RP ----AP--)
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
console.log(`DB SHA-256 before 1Thess 5:18 full-verse repair: ${beforeSha}`);

const sql = `
BEGIN TRANSACTION;

-- #1 اشْكُرُوا -> G2168 @ w3 (εὐχαριστεῖτε)
UPDATE word_mappings
SET orig_word_position = 3,
    verified_locator = 'SBLGNT:B52.C5.V18.w3'
WHERE id = '78a57302-5f20-4f9b-b910-36c3e284e464';

UPDATE word_mapping_strongs
SET orig_word_position = 3
WHERE mapping_id = '78a57302-5f20-4f9b-b910-36c3e284e464';

-- #2 فِي -> G1722 @ w1 (ἐν)
UPDATE word_mappings
SET orig_word_position = 1,
    verified_locator = 'SBLGNT:B52.C5.V18.w1'
WHERE id = '360bef71-fb36-408c-9773-62847d10e12b';

UPDATE word_mapping_strongs
SET orig_word_position = 1
WHERE mapping_id = '360bef71-fb36-408c-9773-62847d10e12b';

-- #3 كُلِّ -> G3956 @ w2 (παντὶ) [compound_phrase unit 1]
UPDATE word_mappings
SET orig_word_position = 2,
    verified_locator = 'SBLGNT:B52.C5.V18.w2',
    relation_type = 'compound_phrase',
    grammar_notes = 'وحدة ربط مشتركة (Shared phrase): «كُلِّ شَيْءٍ» تقابل معًا παντὶ (G3956 @ w2)'
WHERE id = '391e5d2a-d4e9-4f6f-a918-6923f0f5f3a4';

UPDATE word_mapping_strongs
SET orig_word_position = 2
WHERE mapping_id = '391e5d2a-d4e9-4f6f-a918-6923f0f5f3a4';

-- #4 شَيْءٍ -> G3956 @ w2 (παντὶ) [compound_phrase unit 2]
UPDATE word_mappings
SET orig_word_position = 2,
    verified_locator = 'SBLGNT:B52.C5.V18.w2',
    relation_type = 'compound_phrase',
    grammar_notes = 'وحدة ربط مشتركة (Shared phrase): «كُلِّ شَيْءٍ» تقابل معًا παντὶ (G3956 @ w2)'
WHERE id = 'af596d93-745f-4d25-b171-4f3bec428177';

UPDATE word_mapping_strongs
SET orig_word_position = 2
WHERE mapping_id = 'af596d93-745f-4d25-b171-4f3bec428177';

-- #6 هذِهِ -> G3778 @ w4 (τοῦτο)
UPDATE word_mappings
SET orig_word_position = 4,
    verified_locator = 'SBLGNT:B52.C5.V18.w4'
WHERE id = 'ae4053bb-610d-49a8-8db4-5349910f4490';

UPDATE word_mapping_strongs
SET orig_word_position = 4
WHERE mapping_id = 'ae4053bb-610d-49a8-8db4-5349910f4490';

-- #8 مَشِيئَةُ -> G2307 @ w6 (θέλημα)
UPDATE word_mappings
SET orig_word_position = 6,
    verified_locator = 'SBLGNT:B52.C5.V18.w6'
WHERE id = '98f73b0c-922a-4086-b3d1-cc6ad50d51ed';

UPDATE word_mapping_strongs
SET orig_word_position = 6
WHERE mapping_id = '98f73b0c-922a-4086-b3d1-cc6ad50d51ed';

-- #9 اللهِ -> G2316 @ w7 (θεοῦ)
UPDATE word_mappings
SET orig_word_position = 7,
    verified_locator = 'SBLGNT:B52.C5.V18.w7'
WHERE id = '772aace0-5f01-4524-b8c3-166e12018938';

UPDATE word_mapping_strongs
SET orig_word_position = 7
WHERE mapping_id = '772aace0-5f01-4524-b8c3-166e12018938';

-- #10 فِي -> G1722 @ w8 (ἐν)
UPDATE word_mappings
SET orig_word_position = 8,
    verified_locator = 'SBLGNT:B52.C5.V18.w8'
WHERE id = '90237ff0-e344-4f30-98c2-9423c4347c27';

UPDATE word_mapping_strongs
SET orig_word_position = 8
WHERE mapping_id = '90237ff0-e344-4f30-98c2-9423c4347c27';

-- #11 الْمَسِيحِ -> G5547 @ w9 (Χριστῷ) + morph_pos='noun'
UPDATE word_mappings
SET orig_word_position = 9,
    morph_pos = 'noun',
    verified_locator = 'SBLGNT:B52.C5.V18.w9'
WHERE id = '14f3f99b-d7b6-4c5b-ba5f-a32fa321997e';

UPDATE word_mapping_strongs
SET orig_word_position = 9
WHERE mapping_id = '14f3f99b-d7b6-4c5b-ba5f-a32fa321997e';

-- #12 يَسُوعَ -> G2424 @ w10 (Ἰησοῦ) + morph_pos='noun'
UPDATE word_mappings
SET orig_word_position = 10,
    morph_pos = 'noun',
    verified_locator = 'SBLGNT:B52.C5.V18.w10'
WHERE id = 'b870736f-6a21-4e18-b12e-1385c4ff39c5';

UPDATE word_mapping_strongs
SET orig_word_position = 10
WHERE mapping_id = 'b870736f-6a21-4e18-b12e-1385c4ff39c5';

-- #13 مِنْ -> G1519 @ w11 (εἰς)
UPDATE word_mappings
SET orig_word_position = 11,
    verified_locator = 'SBLGNT:B52.C5.V18.w11'
WHERE id = '7f115694-8f98-44e6-9aa3-d7298b76fc94';

UPDATE word_mapping_strongs
SET orig_word_position = 11
WHERE mapping_id = '7f115694-8f98-44e6-9aa3-d7298b76fc94';

-- #14 جِهَتِكُمْ -> G4771 @ w12 (ὑμᾶς)
UPDATE word_mappings
SET orig_word_position = 12,
    verified_locator = 'SBLGNT:B52.C5.V18.w12'
WHERE id = 'c91b0e79-ffaf-440f-b52f-1d0743037f69';

UPDATE word_mapping_strongs
SET orig_word_position = 12
WHERE mapping_id = 'c91b0e79-ffaf-440f-b52f-1d0743037f69';

COMMIT;
`;

execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' });
const afterSha = sha256File(dbPath);
console.log(`DB SHA-256 after  1Thess 5:18 full-verse repair: ${afterSha}`);
console.log('Applied full-verse 1Thess 5:18 alignment & compound phrase calibration (all 14 Arabic words).');
