const { execFileSync } = require('child_process');
const path = require('path');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

const topGreekSql = `
  SELECT strongs_id, orig_word, COUNT(*) as freq 
  FROM word_mappings 
  WHERE strongs_id LIKE 'G%' AND orig_word_lang = 'greek'
    AND orig_word IS NOT NULL AND orig_word != '' AND orig_word != '—'
  GROUP BY strongs_id 
  ORDER BY freq DESC 
  LIMIT 40;
`;

const topHebrewSql = `
  SELECT strongs_id, orig_word, COUNT(*) as freq 
  FROM word_mappings 
  WHERE strongs_id LIKE 'H%' AND orig_word_lang = 'hebrew'
    AND orig_word IS NOT NULL AND orig_word != '' AND orig_word != '—'
  GROUP BY strongs_id 
  ORDER BY freq DESC 
  LIMIT 40;
`;

const topG = JSON.parse(execFileSync(sqlite, [db, '-json', topGreekSql], { encoding: 'utf8' }));
const topH = JSON.parse(execFileSync(sqlite, [db, '-json', topHebrewSql], { encoding: 'utf8' }));

console.log('Top Greek Strongs:');
topG.forEach(r => console.log(`${r.strongs_id}\t${r.orig_word}\t${r.freq}`));

console.log('\nTop Hebrew Strongs:');
topH.forEach(r => console.log(`${r.strongs_id}\t${r.orig_word}\t${r.freq}`));
