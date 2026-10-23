const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const indexFile = path.resolve(__dirname, '../audio_repository/strongs_audio_index.json');

const catalog = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
const catalogIds = catalog.map(c => c.strongs_id);

console.log('Cataloged unique IDs:', catalog.length);

// 1. Total Strongs entries in DB
const totalStrongsGreek = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM strongs_entries WHERE strongs_id LIKE 'G%';"], { encoding: 'utf8' }))[0].c;
const totalStrongsHebrew = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM strongs_entries WHERE strongs_id LIKE 'H%';"], { encoding: 'utf8' }))[0].c;
const totalStrongs = totalStrongsGreek + totalStrongsHebrew;

// Cataloged by language
const catalogGreek = catalog.filter(c => c.strongs_id.startsWith('G')).length;
const catalogHebrew = catalog.filter(c => c.strongs_id.startsWith('H') && c.standard !== 'biblical_aramaic').length;
const catalogAramaic = catalog.filter(c => c.standard === 'biblical_aramaic').length;

// 2. Text occurrences in word_mappings
const totalMappings = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM word_mappings WHERE orig_word IS NOT NULL AND orig_word != '' AND orig_word != '—';"], { encoding: 'utf8' }))[0].c;

const greenOccurrences = JSON.parse(execFileSync(sqlite, [db, '-json', `SELECT COUNT(*) as c FROM word_mappings WHERE strongs_id IN ('${catalogIds.join("','")}');`], { encoding: 'utf8' }))[0].c;

const aramaicOccurrences = JSON.parse(execFileSync(sqlite, [db, '-json', `SELECT COUNT(*) as c FROM word_mappings WHERE orig_word_lang = 'aramaic' AND strongs_id NOT IN ('${catalogIds.join("','")}');`], { encoding: 'utf8' }))[0].c;

const yellowOccurrences = totalMappings - greenOccurrences - aramaicOccurrences;

const results = {
  lexicon: {
    totalStrongs,
    totalStrongsGreek,
    totalStrongsHebrew,
    catalogTotal: catalog.length,
    catalogGreek,
    catalogHebrew,
    catalogAramaic,
    lexiconGreenPercent: ((catalog.length / totalStrongs) * 100).toFixed(2),
    lexiconGreekPercent: ((catalogGreek / totalStrongsGreek) * 100).toFixed(2),
    lexiconHebrewPercent: ((catalogHebrew / totalStrongsHebrew) * 100).toFixed(2),
  },
  textCoverage: {
    totalMappings,
    greenOccurrences,
    yellowOccurrences,
    aramaicOccurrences,
    greenPercent: ((greenOccurrences / totalMappings) * 100).toFixed(2),
    yellowPercent: ((yellowOccurrences / totalMappings) * 100).toFixed(2),
    aramaicPercent: ((aramaicOccurrences / totalMappings) * 100).toFixed(2),
  }
};

console.log(JSON.stringify(results, null, 2));
fs.writeFileSync('scripts/audio_stats.json', JSON.stringify(results, null, 2), 'utf8');
