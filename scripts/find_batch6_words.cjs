const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const indexFile = path.resolve(__dirname, '../audio_repository/strongs_audio_index.json');

const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
const currentIds = index.map(i => i.strongs_id);

// We need ~42,000 occurrences. Let's inspect top 250 Greek and 400 Hebrew words
const sqlG = `
  SELECT strongs_id, orig_word, COUNT(*) as freq 
  FROM word_mappings 
  WHERE strongs_id LIKE 'G%' AND orig_word_lang = 'greek'
    AND orig_word IS NOT NULL AND orig_word != '' AND orig_word != '—'
    AND strongs_id NOT IN ('${currentIds.join("','")}')
  GROUP BY strongs_id 
  ORDER BY freq DESC 
  LIMIT 300;
`;

const sqlH = `
  SELECT strongs_id, orig_word, COUNT(*) as freq 
  FROM word_mappings 
  WHERE strongs_id LIKE 'H%' AND orig_word_lang = 'hebrew'
    AND orig_word IS NOT NULL AND orig_word != '' AND orig_word != '—'
    AND strongs_id NOT IN ('${currentIds.join("','")}')
  GROUP BY strongs_id 
  ORDER BY freq DESC 
  LIMIT 500;
`;

const topG = JSON.parse(execFileSync(sqlite, [db, '-json', sqlG], { encoding: 'utf8' }));
const topH = JSON.parse(execFileSync(sqlite, [db, '-json', sqlH], { encoding: 'utf8' }));

console.log('Top Unindexed Greek count:', topG.length);
console.log('Top Unindexed Hebrew count:', topH.length);

const gTotal = topG.reduce((a, b) => a + b.freq, 0);
const hTotal = topH.reduce((a, b) => a + b.freq, 0);
console.log(`Additional text occurrences covered by Batch 6 (${topG.length + topH.length} words): ${(gTotal + hTotal).toLocaleString()}`);

fs.writeFileSync('scripts/batch6_words.json', JSON.stringify({ greek: topG, hebrew: topH }, null, 2), 'utf8');
console.log('Saved scripts/batch6_words.json');
