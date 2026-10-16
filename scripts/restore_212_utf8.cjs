const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const wlcPath = path.resolve('scripts/data/hebrew_bible_with_nikkud.json');
const wlc = JSON.parse(fs.readFileSync(wlcPath, 'utf8'));

function cleanWords(words) {
  if (!words || !Array.isArray(words)) return '';
  const filtered = words.filter(w => w !== 'ס' && w !== 'פ');
  return filtered.join(' ').replace(/'/g, "''");
}

const lines = ['BEGIN TRANSACTION;'];
let count = 0;

// 1. 2 Samuel (book_id = 10)
// English 18:33 is MT 19:1
lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['2Sam'][18][0])}', text_original_lang = 'hebrew' WHERE book_id = 10 AND chapter_num = 18 AND verse_num = 33;`);
count++;

// English 19:1..43 is MT 19:2..44
for (let v = 1; v <= 43; v++) {
  lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['2Sam'][18][v])}', text_original_lang = 'hebrew' WHERE book_id = 10 AND chapter_num = 19 AND verse_num = ${v};`);
  count++;
}

// 2. 1 Kings (book_id = 11)
// English 4:21..34 is MT 5:1..14
for (let v = 21; v <= 34; v++) {
  lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['1Kgs'][4][v - 21])}', text_original_lang = 'hebrew' WHERE book_id = 11 AND chapter_num = 4 AND verse_num = ${v};`);
  count++;
}

// English 5:1..18 is MT 5:15..32
for (let v = 1; v <= 18; v++) {
  lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['1Kgs'][4][14 + v - 1])}', text_original_lang = 'hebrew' WHERE book_id = 11 AND chapter_num = 5 AND verse_num = ${v};`);
  count++;
}

// 3. 2 Kings (book_id = 12)
// English 11:21 is MT 12:1
lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['2Kgs'][11][0])}', text_original_lang = 'hebrew' WHERE book_id = 12 AND chapter_num = 11 AND verse_num = 21;`);
count++;

// English 12:1..21 is MT 12:2..22
for (let v = 1; v <= 21; v++) {
  lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['2Kgs'][11][v])}', text_original_lang = 'hebrew' WHERE book_id = 12 AND chapter_num = 12 AND verse_num = ${v};`);
  count++;
}

// 4. 1 Chronicles (book_id = 13)
// English 6:1..15 is MT 5:27..41
for (let v = 1; v <= 15; v++) {
  lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['1Chr'][4][26 + v - 1])}', text_original_lang = 'hebrew' WHERE book_id = 13 AND chapter_num = 6 AND verse_num = ${v};`);
  count++;
}

// English 6:16..81 is MT 6:1..66
for (let v = 16; v <= 81; v++) {
  lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['1Chr'][5][v - 16])}', text_original_lang = 'hebrew' WHERE book_id = 13 AND chapter_num = 6 AND verse_num = ${v};`);
  count++;
}

// 5. 2 Chronicles (book_id = 14)
// English 2:1 is MT 1:18
lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['2Chr'][0][17])}', text_original_lang = 'hebrew' WHERE book_id = 14 AND chapter_num = 2 AND verse_num = 1;`);
count++;

// English 2:2..18 is MT 2:1..17
for (let v = 2; v <= 18; v++) {
  lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['2Chr'][1][v - 2])}', text_original_lang = 'hebrew' WHERE book_id = 14 AND chapter_num = 2 AND verse_num = ${v};`);
  count++;
}

// English 14:1 is MT 13:23
lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['2Chr'][12][22])}', text_original_lang = 'hebrew' WHERE book_id = 14 AND chapter_num = 14 AND verse_num = 1;`);
count++;

// English 14:2..15 is MT 14:1..14
for (let v = 2; v <= 15; v++) {
  lines.push(`UPDATE verses SET text_original = '${cleanWords(wlc['2Chr'][13][v - 2])}', text_original_lang = 'hebrew' WHERE book_id = 14 AND chapter_num = 14 AND verse_num = ${v};`);
  count++;
}

lines.push('COMMIT;');

const outSql = path.resolve('scripts/restore_212_utf8.sql');
fs.writeFileSync(outSql, lines.join('\n'), 'utf8');
console.log(`Generated SQL for ${count} verses at ${outSql} with UTF-8 encoding.`);

// Execute directly on mobile/assets/bible_study.db
const sqliteBin = path.resolve('sqlite_dist/sqlite3.exe');
const dbPath = path.resolve('mobile/assets/bible_study.db');
execSync(`"${sqliteBin}" "${dbPath}" ".read ${outSql.replace(/\\/g, '/')}"`);
console.log('Successfully updated SQLite database with pristine UTF-8 Hebrew text!');
