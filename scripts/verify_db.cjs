const { execFileSync } = require('child_process');
const path = require('path');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  return execFileSync(sqlite, [db], { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('Running PRAGMA integrity_check...');
const check = q('PRAGMA integrity_check;');
console.log('Integrity check result:', check);

console.log('Running VACUUM...');
runSql('VACUUM;');
console.log('Vacuum completed.');

const total_mappings = q('SELECT count(*) as c FROM word_mappings;')[0].c;
const grammar_notes_count = q('SELECT count(*) as c FROM word_mappings WHERE grammar_notes IS NOT NULL;')[0].c;
const relation_type_count = q('SELECT count(*) as c FROM word_mappings WHERE relation_type IS NOT NULL;')[0].c;
const orig_word_arabic = q("SELECT count(*) as c FROM word_mappings WHERE orig_word GLOB '*[ء-ي]*';")[0].c;
const mixed_scripts = q("SELECT count(*) as c FROM word_mappings WHERE orig_word GLOB '*[ء-ي]*' AND (orig_word GLOB '*[א-ת]*' OR orig_word GLOB '*[α-ωΑ-Ω]*');")[0].c;

console.log('Counts:', {
  total_mappings,
  grammar_notes_count,
  relation_type_count,
  orig_word_arabic,
  mixed_scripts
});

// Gen 2:5
const gen2_5 = q(`
  SELECT wm.ar_word_position, wm.ar_word, wm.orig_word, wm.strongs_id, wm.relation_type, wm.grammar_notes
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 1 AND v.chapter_num = 2 AND v.verse_num = 5
  ORDER BY wm.ar_word_position;
`);
console.log('Gen 2:5 mappings:', gen2_5);

// G26
const g26 = q(`
  SELECT se.strongs_id, se.original_word, sat.definition_ar, sat.notes_ar
  FROM strongs_entries se
  JOIN strongs_ar_translations sat ON se.strongs_id = sat.strongs_id
  WHERE se.strongs_id = 'G26';
`)[0];
console.log('G26 definition preview:', g26.original_word, g26.definition_ar ? g26.definition_ar.substring(0, 150) + '...' : null);


