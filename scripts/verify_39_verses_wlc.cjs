const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const wlc = JSON.parse(fs.readFileSync('scripts/data/hebrew_bible_with_nikkud.json', 'utf8'));

function cleanWlc(words) {
  return words.filter(w => w !== 'ס' && w !== 'פ').join(' ');
}

// 1Sam 20:42: MT 20:42 + MT 21:1
const mt20_42 = cleanWlc(wlc['1Sam'][19][41]);
const mt21_1  = cleanWlc(wlc['1Sam'][20][0]);
const expected20_42 = mt20_42.replace(/׃$/, '').trim() + ' ' + mt21_1;

console.log('--- 1Sam 20:42 ---');
const db20_42 = execSync('.\\sqlite_dist\\sqlite3.exe mobile/assets/bible_study.db "SELECT text_original FROM verses WHERE book_id = 9 AND chapter_num = 20 AND verse_num = 42;"', { encoding: 'utf8' }).trim();
console.log('DB:       ', db20_42);
console.log('Expected: ', expected20_42);
console.log('Match:    ', db20_42 === expected20_42);

// 1Sam 21:1..15 -> MT 21:2..16
let mismatches21 = 0;
for (let v = 1; v <= 15; v++) {
  const expected = cleanWlc(wlc['1Sam'][20][v]);
  const db = execSync(`.\\sqlite_dist\\sqlite3.exe mobile/assets/bible_study.db "SELECT text_original FROM verses WHERE book_id = 9 AND chapter_num = 21 AND verse_num = ${v};"`, { encoding: 'utf8' }).trim();
  // Strip cantillation accents for comparison if needed, or exact
  const cleanExp = expected.replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C4\u05C5]/g, '');
  const cleanDb = db.replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C4\u05C5]/g, '');
  if (cleanExp !== cleanDb) {
    console.log(`Mismatch in 1Sam 21:${v}:`);
    console.log('  DB:  ', cleanDb);
    console.log('  Exp: ', cleanExp);
    mismatches21++;
  }
}
console.log(`1Sam 21 mismatches: ${mismatches21} / 15`);

// 1Sam 23:29 -> MT 24:1
const expected23_29 = cleanWlc(wlc['1Sam'][23][0]);
const db23_29 = execSync('.\\sqlite_dist\\sqlite3.exe mobile/assets/bible_study.db "SELECT text_original FROM verses WHERE book_id = 9 AND chapter_num = 23 AND verse_num = 29;"', { encoding: 'utf8' }).trim();
console.log('--- 1Sam 23:29 ---');
console.log('DB:       ', db23_29);
console.log('Expected: ', expected23_29);

// 1Sam 24:1..22 -> MT 24:2..23
let mismatches24 = 0;
for (let v = 1; v <= 22; v++) {
  const expected = cleanWlc(wlc['1Sam'][23][v]);
  const db = execSync(`.\\sqlite_dist\\sqlite3.exe mobile/assets/bible_study.db "SELECT text_original FROM verses WHERE book_id = 9 AND chapter_num = 24 AND verse_num = ${v};"`, { encoding: 'utf8' }).trim();
  const cleanExp = expected.replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C4\u05C5]/g, '');
  const cleanDb = db.replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C4\u05C5]/g, '');
  if (cleanExp !== cleanDb) {
    console.log(`Mismatch in 1Sam 24:${v}:`);
    console.log('  DB:  ', cleanDb);
    console.log('  Exp: ', cleanExp);
    mismatches24++;
  }
}
console.log(`1Sam 24 mismatches: ${mismatches24} / 22`);
