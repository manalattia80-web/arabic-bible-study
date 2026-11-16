/**
 * scripts/apply_round1_holdout_pronoun_repairs.cjs
 *
 * Completes missing derived suffix pronoun morphology for 4 legacy records
 * in the Round 1 Holdout (15 unseen verses) sample:
 *   1. Lev 19:18 #11 "كَنَفْسِكَ"  (HR/Sp2ms -> person: 2, gender: masculine, number: singular)
 *   2. Josh 24:15 #9 "لأَنْفُسِكُمُ" (HR/Sp2mp -> person: 2, gender: masculine, number: plural)
 *   3. Ezra 4:12 #8  "عِنْدِكَ"    (AR/Sp2ms -> person: 2, gender: masculine, number: singular)
 *   4. Ezra 4:12 #9  "إِلَيْنَا"    (AR/Sp1cp -> person: 1, gender: common,    number: plural)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = process.env.AUDIT_DB_PATH || path.join(repoRoot, 'mobile/assets/bible_study.db');

console.log(`Applying Round 1 Holdout Pronoun Repairs in: ${dbPath}`);

const sql = `
BEGIN TRANSACTION;

-- 1. Lev 19:18 #11 كَنَفْسِكَ (Sp2ms: 2, masculine, singular)
UPDATE word_mappings SET
  morph_person = '2',
  morph_gender = 'masculine',
  morph_number = 'singular'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 3 AND chapter_num = 19 AND verse_num = 18)
  AND ar_word_position = 11;

-- 2. Josh 24:15 #9 لأَنْفُسِكُمُ (Sp2mp: 2, masculine, plural)
UPDATE word_mappings SET
  morph_person = '2',
  morph_gender = 'masculine',
  morph_number = 'plural'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 24 AND verse_num = 15)
  AND ar_word_position = 9;

-- 3. Ezra 4:12 #8 عِنْدِكَ (Sp2ms: 2, masculine, singular)
UPDATE word_mappings SET
  morph_person = '2',
  morph_gender = 'masculine',
  morph_number = 'singular'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 12)
  AND ar_word_position = 8;

-- 4. Ezra 4:12 #9 إِلَيْنَا (Sp1cp: 1, common, plural)
UPDATE word_mappings SET
  morph_person = '1',
  morph_gender = 'common',
  morph_number = 'plural'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 12)
  AND ar_word_position = 9;

COMMIT;
`;

execFileSync(sqlitePath, [dbPath], { input: sql, stdio: ['pipe', 'inherit', 'inherit'] });
console.log('Successfully completed suffix pronoun morphology for all 4 Round 1 holdout records.');
