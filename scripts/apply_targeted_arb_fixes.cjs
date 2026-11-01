const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const sqlite = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');
const db = path.join(__dirname, '..', 'mobile', 'assets', 'bible_study.db');

function runSql(sql) {
  const tmp = path.join(__dirname, 'temp_fix4.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

console.log('Applying targeted corrections for the 4 issues...');

const sql = `
BEGIN TRANSACTION;

-- 1. Fix Strongs for Isa 47:15 ar:3 «لَكِ» from H9003 to H9005
UPDATE word_mappings
SET strongs_id = 'H9005',
    orig_word = 'לְ',
    orig_surface = 'הָיוּ־לָ֖ךְ',
    orig_morphology = 'HR/Sp2fs',
    verified_locator = 'OSHB:B23.C47.V15.w2',
    morph_source = 'oshb_wlc',
    relation_type = 'primary'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15)
  AND ar_word_position = 3;

UPDATE word_mapping_strongs
SET strongs_id = 'H9005',
    orig_morphology = 'HR/Sp2fs',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 15) AND ar_word_position = 3);

-- 2. Refine Psalm 44:19 ar:7 & ar:8 relation_type to composite_phrase
UPDATE word_mappings
SET relation_type = 'composite_phrase'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 19 AND chapter_num = 44 AND verse_num = 19)
  AND ar_word_position IN (7, 8);

UPDATE word_mapping_strongs
SET link_role = 'composite'
WHERE mapping_id IN (
  SELECT id FROM word_mappings
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 19 AND chapter_num = 44 AND verse_num = 19)
    AND ar_word_position IN (7, 8)
);

COMMIT;
`;

runSql(sql);
console.log('Successfully applied targeted fixes in SQLite!');
