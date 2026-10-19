// scripts/compare_v17_v18.cjs
const { execFileSync } = require('child_process');
const path = require('path');

const sqlite = 'sqlite_dist/sqlite3.exe';
const v17 = path.resolve('mobile/assets/bible_study_v17_backup.db');
const v18 = path.resolve('mobile/assets/bible_study_v18_clean.db');

const diffQuery = `
ATTACH '${v17.replace(/\\/g, '/')}' as old_db;
SELECT 
  sum(CASE WHEN (wm.strongs_id IS NOT NULL AND o.strongs_id IS NULL) OR (wm.strongs_id IS NULL AND o.strongs_id IS NOT NULL) OR wm.strongs_id != o.strongs_id THEN 1 ELSE 0 END) as diff_strongs,
  sum(CASE WHEN wm.orig_word != o.orig_word THEN 1 ELSE 0 END) as diff_orig_word,
  sum(CASE WHEN wm.orig_word_lang != o.orig_word_lang THEN 1 ELSE 0 END) as diff_lang,
  sum(CASE WHEN (wm.strongs_id IS NOT NULL AND o.strongs_id IS NULL) OR (wm.strongs_id IS NULL AND o.strongs_id IS NOT NULL) OR wm.strongs_id != o.strongs_id OR wm.orig_word != o.orig_word OR wm.orig_word_lang != o.orig_word_lang THEN 1 ELSE 0 END) as total_modified_records
FROM word_mappings wm
JOIN old_db.word_mappings o ON wm.id = o.id;
`;

const res = execFileSync(sqlite, [v18, '-json', diffQuery], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
console.log('Diff results:', JSON.parse(res)[0]);
