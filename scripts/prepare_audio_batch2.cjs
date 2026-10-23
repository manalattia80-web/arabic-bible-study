const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const repoDir = path.resolve(__dirname, '../audio_repository/strongs');
const indexFile = path.resolve(__dirname, '../audio_repository/strongs_audio_index.json');

const greekIds = [
  'G225', 'G2222', 'G5457', 'G2889', 'G4561', 'G4102', 'G1343', 'G1515', 
  'G1577', 'G40', 'G932', 'G2588', 'G3772', 'G1391', 'G2041', 'G4991', 
  'G386', 'G129', 'G1411'
];

const hebrewIds = [
  'H8451', 'H5315', 'H3824', 'H4428', 'H3548', 'H5030', 'H4196', 'H2077', 
  'H5769', 'H7307', 'H6664', 'H3478', 'H1732', 'H85', 'H4872', 'H120', 
  'H3117', 'H4325', 'H6086'
];

const aramaicIds = [
  'H6523', 'H2635', 'H7985', 'H5957', 'H3606'
];

const allIds = [...greekIds, ...hebrewIds, ...aramaicIds];

function queryDb() {
  const sql = `
    SELECT 
      e.strongs_id, 
      e.language, 
      e.original_word, 
      e.transliteration, 
      e.definition_en,
      a.pronunciation_ar,
      a.definition_ar
    FROM strongs_entries e
    LEFT JOIN strongs_ar_translations a ON e.strongs_id = a.strongs_id
    WHERE e.strongs_id IN ('${allIds.join("','")}');
  `;
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return JSON.parse(res);
}

const entries = queryDb();
console.log(`Fetched ${entries.length} entries from database.`);

// Group and prepare batch
const entriesMap = {};
for (const e of entries) {
  entriesMap[e.strongs_id] = e;
}

fs.writeFileSync('scripts/audio_batch2_meta.json', JSON.stringify(entriesMap, null, 2), 'utf8');
console.log('Saved scripts/audio_batch2_meta.json');
