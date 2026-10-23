const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sqlite = path.join(root, 'sqlite_dist/sqlite3.exe');
const db = path.join(root, 'mobile/assets/bible_study.db');
const indexFile = path.join(root, 'audio_repository/strongs_audio_index.json');

const currentIndex = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
const allCataloged = currentIndex.map(c => c.strongs_id);

const totalMappings = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM word_mappings WHERE orig_word IS NOT NULL AND orig_word != '' AND orig_word != '—';"], { encoding: 'utf8' }))[0].c;

// Query greenTotal in chunks of 400
let greenTotal = 0;
for (let i = 0; i < allCataloged.length; i += 400) {
  const sub = allCataloged.slice(i, i + 400);
  const count = JSON.parse(execFileSync(sqlite, [db, '-json', `SELECT COUNT(*) as c FROM word_mappings WHERE strongs_id IN ('${sub.join("','")}');`], { encoding: 'utf8' }))[0].c;
  greenTotal += count;
}
const greenPct = ((greenTotal / totalMappings) * 100).toFixed(2);

const totalStrongsGreek = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM strongs_entries WHERE strongs_id LIKE 'G%';"], { encoding: 'utf8' }))[0].c;
const totalStrongsHebrew = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM strongs_entries WHERE strongs_id LIKE 'H%';"], { encoding: 'utf8' }))[0].c;
const totalStrongs = totalStrongsGreek + totalStrongsHebrew;

const catGreek = currentIndex.filter(c => c.strongs_id.startsWith('G')).length;
const catHeb = currentIndex.filter(c => c.strongs_id.startsWith('H') && c.standard !== 'biblical_aramaic').length;
const catAr = currentIndex.filter(c => c.standard === 'biblical_aramaic').length;

// Total aramaic in word_mappings minus cataloged aramaic occurrences
const totalArOccurrences = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM word_mappings WHERE orig_word_lang = 'aramaic';"], { encoding: 'utf8' }))[0].c;
const catArIds = currentIndex.filter(c => c.standard === 'biblical_aramaic').map(c => c.strongs_id);
const catArOccurrences = catArIds.length > 0 ? JSON.parse(execFileSync(sqlite, [db, '-json', `SELECT COUNT(*) as c FROM word_mappings WHERE strongs_id IN ('${catArIds.join("','")}');`], { encoding: 'utf8' }))[0].c : 0;
const arOccurrences = totalArOccurrences - catArOccurrences;

const yellowTotal = totalMappings - greenTotal - arOccurrences;

const stats = {
  lexicon: {
    totalStrongs,
    totalStrongsGreek,
    totalStrongsHebrew,
    catalogTotal: currentIndex.length,
    catGreek,
    catHeb,
    catAr,
    lexiconGreenPercent: ((currentIndex.length / totalStrongs) * 100).toFixed(2),
    lexiconGreekPercent: ((catGreek / totalStrongsGreek) * 100).toFixed(2),
    lexiconHebrewPercent: ((catHeb / totalStrongsHebrew) * 100).toFixed(2)
  },
  textCoverage: {
    totalMappings,
    greenTotal,
    yellowTotal,
    arOccurrences,
    greenPct,
    yellowPct: ((yellowTotal / totalMappings) * 100).toFixed(2),
    arPct: ((arOccurrences / totalMappings) * 100).toFixed(2)
  }
};

fs.writeFileSync(path.join(root, 'scripts/audio_stats.json'), JSON.stringify(stats, null, 2), 'utf8');

console.log(`\n======================================================`);
console.log(`TOTAL BIBLE OCCURRENCES WITH GREEN VERIFIED BADGE 🟢:`);
console.log(`${greenTotal.toLocaleString()} words out of ${totalMappings.toLocaleString()} (${greenPct}%)!`);
console.log(`Yellow approximate: ${yellowTotal.toLocaleString()} (${stats.textCoverage.yellowPct}%)`);
console.log(`Aramaic suspended: ${arOccurrences.toLocaleString()} (${stats.textCoverage.arPct}%)`);
console.log(`Total cataloged Strong's IDs: ${currentIndex.length} (${stats.lexicon.lexiconGreenPercent}% of lexicon)`);
console.log(`======================================================\n`);
