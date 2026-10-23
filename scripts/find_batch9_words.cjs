const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const indexFile = path.resolve(__dirname, '../audio_repository/strongs_audio_index.json');

const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
const currentIds = new Set(index.map(i => i.strongs_id));

const sql = `
  SELECT strongs_id, orig_word, orig_word_lang, COUNT(*) as freq 
  FROM word_mappings 
  WHERE orig_word IS NOT NULL AND orig_word != '' AND orig_word != '—' AND orig_word != '---'
  GROUP BY strongs_id 
  ORDER BY freq DESC;
`;

const allWords = JSON.parse(execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 }));

const unindexedGreek = allWords.filter(w => w.strongs_id && w.strongs_id.startsWith('G') && w.orig_word_lang === 'greek' && !currentIds.has(w.strongs_id));
const unindexedHebrew = allWords.filter(w => w.strongs_id && w.strongs_id.startsWith('H') && w.orig_word_lang === 'hebrew' && !currentIds.has(w.strongs_id));

console.log('Unindexed Greek count:', unindexedGreek.length);
console.log('Unindexed Hebrew count:', unindexedHebrew.length);

const gTotal = unindexedGreek.reduce((a, b) => a + b.freq, 0);
const hTotal = unindexedHebrew.reduce((a, b) => a + b.freq, 0);
console.log(`Additional text occurrences covered by Batch 9 (${unindexedGreek.length + unindexedHebrew.length} words): ${(gTotal + hTotal).toLocaleString()}`);
console.log(`New total occurrences: ${(393829 + gTotal + hTotal).toLocaleString()} / 434,350 = ${((393829 + gTotal + hTotal) / 434350 * 100).toFixed(2)}%`);
console.log(`Coverage of real original text: ${(393829 + gTotal + hTotal).toLocaleString()} / 409,348 = ${((393829 + gTotal + hTotal) / 409348 * 100).toFixed(2)}%`);

fs.writeFileSync('scripts/batch9_words.json', JSON.stringify({ greek: unindexedGreek, hebrew: unindexedHebrew }, null, 2), 'utf8');
console.log('Saved scripts/batch9_words.json');
