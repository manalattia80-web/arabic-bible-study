/**
 * apply_round2_batch1_metadata_fixes.cjs
 * Applies the 3 manually adjudicated KEEP_LINK_REPAIR_METADATA fixes
 * (Ruth 2:12 #7, 1Kgs 19:12 #8, Ezra 5:11 #14) verified against OSHB WLC XML.
 * Links (strongs_id, orig_word_position, verified_locator) are preserved.
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
console.log(`DB SHA-256 before Batch 1 metadata repair: ${beforeSha}`);

const sql = `
BEGIN TRANSACTION;

-- 1. Ruth 2:12 #7 (مِنْ) -> OSHB w7: lemma="m/5973 b", morph="HR/R", text="מֵ/עִ֤ם"
UPDATE word_mappings
SET orig_surface = 'מֵעִ֤ם',
    orig_morphology = 'HR/R'
WHERE id = 'f71adeb5-fd54-41be-926f-49bc65cedfa1';

UPDATE word_mapping_strongs
SET orig_component = 'מֵעִ֤ם',
    orig_morphology = 'HR/R'
WHERE mapping_id = 'f71adeb5-fd54-41be-926f-49bc65cedfa1' AND link_order = 1;

-- 2. 1Kgs 19:12 #8 (النَّارِ) -> OSHB w8: lemma="d/784", morph="HTd/Ncbsa", text="הָ/אֵ֔שׁ"
UPDATE word_mappings
SET orig_surface = 'הָאֵ֔שׁ',
    orig_morphology = 'HTd/Ncbsa'
WHERE id = 'e7d90c86-5a56-4648-9c31-fb73a381a990';

UPDATE word_mapping_strongs
SET orig_component = 'הָאֵ֔שׁ',
    orig_morphology = 'HTd/Ncbsa'
WHERE mapping_id = 'e7d90c86-5a56-4648-9c31-fb73a381a990' AND link_order = 1;

-- 3. Ezra 5:11 #14 (الَّذِي) -> OSHB w14: lemma="1768", morph="ATr", text="דִּֽי"
UPDATE word_mappings
SET orig_surface = 'דִּֽי',
    orig_morphology = 'ATr'
WHERE id = '31fef1f3-6675-4590-83ad-df4c3eb15d5f';

UPDATE word_mapping_strongs
SET orig_component = 'דִּֽי',
    orig_morphology = 'ATr'
WHERE mapping_id = '31fef1f3-6675-4590-83ad-df4c3eb15d5f' AND link_order = 1;

COMMIT;
`;

execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' });
const afterSha = sha256File(dbPath);
console.log(`DB SHA-256 after  Batch 1 metadata repair: ${afterSha}`);
console.log('Applied 3 OSHB metadata fixes (Ruth 2:12 #7, 1Kgs 19:12 #8, Ezra 5:11 #14).');
