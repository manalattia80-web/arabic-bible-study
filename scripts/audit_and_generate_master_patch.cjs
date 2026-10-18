const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const sqliteExe = path.resolve('sqlite_dist/sqlite3.exe');
const dbPath = path.resolve('mobile/assets/bible_study.db');

function queryDb(sql) {
  const res = execFileSync(sqliteExe, [dbPath, '-json', sql], { encoding: 'utf8' });
  if (!res || !res.trim()) return [];
  return JSON.parse(res);
}

// 1. Group 1: 6 Hebrew Cases
// Ex 28:17: صفوف / صف / الصف -> H2905
// Lev 11:14: الباشق -> H344
// Josh 15:53: وينوم -> H3241
// 2 Kgs 9:31: لزمري -> H2174
const group1 = [
  { book: 2, ch: 28, v: 17, arWord: 'صفوف', current: 'H8503', target: 'H2905', lang: 'hebrew' },
  { book: 2, ch: 28, v: 17, arWord: 'صف', current: 'H8503', target: 'H2905', lang: 'hebrew' },
  { book: 2, ch: 28, v: 17, arWord: 'الصف', current: 'H8503', target: 'H2905', lang: 'hebrew' },
  { book: 3, ch: 11, v: 14, arWord: 'الباشق', current: 'H3422', target: 'H344', lang: 'hebrew', matchAlts: ['والباشق', 'وَالْبَاشِقُ', 'الباشق'] },
  { book: 6, ch: 15, v: 53, arWord: 'وينوم', current: 'H3290', target: 'H3241', lang: 'hebrew' },
  { book: 12, ch: 9, v: 31, arWord: 'لزمري', current: 'H2190', target: 'H2174', lang: 'hebrew' }
];

// 2. Group 2: 33 Genesis Hebrew Cases
const group2 = [
  { book: 1, ch: 2, v: 11, arWord: 'فيشون', current: 'H1576', target: 'H6376', lang: 'hebrew' },
  { book: 1, ch: 3, v: 19, arWord: 'بعرق', current: 'H1862', target: 'H2188', lang: 'hebrew' },
  { book: 1, ch: 8, v: 22, arWord: 'وبرد', current: 'H7158', target: 'H7120', lang: 'hebrew' },
  { book: 1, ch: 10, v: 17, arWord: 'والعرقي', current: 'H6162', target: 'H6208', lang: 'hebrew' },
  { book: 1, ch: 10, v: 26, arWord: 'ويقطان', current: 'H3349', target: 'H3355', lang: 'hebrew' },
  { book: 1, ch: 13, v: 1, arWord: 'ولوط', current: 'H3838', target: 'H3876', lang: 'hebrew' },
  { book: 1, ch: 13, v: 5, arWord: 'ولوط', current: 'H3838', target: 'H3876', lang: 'hebrew' },
  { book: 1, ch: 13, v: 11, arWord: 'لوط', current: 'H3838', target: 'H3876', lang: 'hebrew' },
  { book: 1, ch: 13, v: 18, arWord: 'ممرا', current: 'H4467', target: 'H4471', lang: 'hebrew' },
  { book: 1, ch: 14, v: 1, arWord: 'وتدعال', current: 'H8403', target: 'H8413', lang: 'hebrew' },
  { book: 1, ch: 14, v: 2, arWord: 'وشنآب', current: 'H8148', target: 'H8134', lang: 'hebrew' },
  { book: 1, ch: 14, v: 5, arWord: 'والزوزيين', current: 'H2153', target: 'H2104', lang: 'hebrew' },
  { book: 1, ch: 14, v: 5, arWord: 'هام', current: 'H1996', target: 'H1990', lang: 'hebrew' },
  { book: 1, ch: 14, v: 9, arWord: 'وتدعال', current: 'H8403', target: 'H8413', lang: 'hebrew' },
  { book: 1, ch: 14, v: 16, arWord: 'لوطاً', current: 'H3838', target: 'H3876', lang: 'hebrew', matchAlts: ['لوطا', 'لوطاً'] },
  { book: 1, ch: 19, v: 6, arWord: 'لوط', current: 'H3810', target: 'H3876', lang: 'hebrew' },
  { book: 1, ch: 19, v: 10, arWord: 'لوطاً', current: 'H3810', target: 'H3876', lang: 'hebrew', matchAlts: ['لوطا', 'لوطاً'] },
  { book: 1, ch: 19, v: 12, arWord: 'للوط', current: 'H3838', target: 'H3876', lang: 'hebrew' },
  { book: 1, ch: 19, v: 14, arWord: 'لوط', current: 'H3838', target: 'H3876', lang: 'hebrew' },
  { book: 1, ch: 24, v: 64, arWord: 'رفقة', current: 'H7348', target: 'H7259', lang: 'hebrew' },
  { book: 1, ch: 25, v: 4, arWord: 'عيفة', current: 'H5802', target: 'H5891', lang: 'hebrew' },
  { book: 1, ch: 25, v: 4, arWord: 'وألدعة', current: 'H415', target: 'H420', lang: 'hebrew', matchAlts: ['والدعة', 'وألدعة'] },
  { book: 1, ch: 25, v: 34, arWord: 'عدس', current: 'H150', target: 'H5742', lang: 'hebrew' },
  { book: 1, ch: 26, v: 7, arWord: 'رفقة', current: 'H7348', target: 'H7259', lang: 'hebrew' },
  { book: 1, ch: 27, v: 6, arWord: 'رفقة', current: 'H7348', target: 'H7259', lang: 'hebrew' },
  { book: 1, ch: 27, v: 11, arWord: 'لرفقة', current: 'H7348', target: 'H7259', lang: 'hebrew' },
  { book: 1, ch: 27, v: 15, arWord: 'رفقة', current: 'H7348', target: 'H7259', lang: 'hebrew' },
  { book: 1, ch: 27, v: 42, arWord: 'رفقة', current: 'H7348', target: 'H7259', lang: 'hebrew' },
  { book: 1, ch: 30, v: 12, arWord: 'زلفة', current: 'H2192', target: 'H2153', lang: 'hebrew' },
  { book: 1, ch: 33, v: 2, arWord: 'وليئة', current: 'H381', target: 'H3812', lang: 'hebrew' },
  { book: 1, ch: 33, v: 7, arWord: 'ليئة', current: 'H384', target: 'H3812', lang: 'hebrew' },
  { book: 1, ch: 33, v: 19, arWord: 'قسيطة', current: 'H7105', target: 'H7192', lang: 'hebrew' },
  { book: 1, ch: 34, v: 1, arWord: 'ليئة', current: 'H384', target: 'H3812', lang: 'hebrew' }
];

// 3. Group 3: 47 Greek Cases
// Note: Compounds:
// Luke 10:13: بيت صيدا -> G966 for both (or compound)
// Matt 18:21: كم مرة -> G4212, سبع مرات -> G2034
// Rev 21:20: زمرد سلقي -> G969
const group3 = [
  { book: 47, ch: 2, v: 2, arWord: 'أحزنته', current: 'G3079', target: 'G3076', lang: 'greek', matchAlts: ['أحزنته', 'احزنته'] },
  { book: 47, ch: 2, v: 2, arWord: 'أحزنكم', current: 'G3079', target: 'G3076', lang: 'greek', matchAlts: ['أحزنكم', 'احزنكم'] },
  { book: 42, ch: 1, v: 67, arWord: 'زكريا', current: 'G2196', target: 'G2197', lang: 'greek' },
  { book: 42, ch: 10, v: 13, arWord: 'بيت', current: 'G954', target: 'G966', lang: 'greek' },
  { book: 42, ch: 10, v: 13, arWord: 'صيدا', current: 'G954', target: 'G966', lang: 'greek' },
  { book: 42, ch: 10, v: 13, arWord: 'وصيدا', current: 'G4615', target: 'G4605', lang: 'greek' },
  { book: 40, ch: 18, v: 21, arWord: 'كم', current: 'G4214', target: 'G4212', lang: 'greek' },
  { book: 40, ch: 18, v: 21, arWord: 'مرة', current: 'G2451', target: 'G4212', lang: 'greek' },
  { book: 40, ch: 18, v: 21, arWord: 'سبع', current: 'G1447', target: 'G2034', lang: 'greek' },
  { book: 40, ch: 18, v: 21, arWord: 'مرات', current: 'G2451', target: 'G2034', lang: 'greek' },
  { book: 43, ch: 13, v: 4, arWord: 'منشفة', current: 'G3033', target: 'G3012', lang: 'greek' },
  { book: 43, ch: 13, v: 5, arWord: 'بالمنشفة', current: 'G3033', target: 'G3012', lang: 'greek' },
  { book: 43, ch: 19, v: 13, arWord: 'البلاط', current: 'G3033', target: 'G3038', lang: 'greek' },
  { book: 66, ch: 7, v: 5, arWord: 'جاد', current: 'G1425', target: 'G1045', lang: 'greek' },
  { book: 66, ch: 7, v: 6, arWord: 'ألف', current: 'G5507', target: 'G5505', lang: 'greek', matchAlts: ['ألف', 'الف'], occurrence: 1 },
  { book: 66, ch: 7, v: 6, arWord: 'ألف', current: 'G5507', target: 'G5505', lang: 'greek', matchAlts: ['ألف', 'الف'], occurrence: 2 },
  { book: 66, ch: 7, v: 6, arWord: 'ألف', current: 'G5507', target: 'G5505', lang: 'greek', matchAlts: ['ألف', 'الف'], occurrence: 3 },
  { book: 66, ch: 7, v: 7, arWord: 'ألف', current: 'G5507', target: 'G5505', lang: 'greek', matchAlts: ['ألف', 'الف'], occurrence: 1 },
  { book: 66, ch: 7, v: 7, arWord: 'ألف', current: 'G5507', target: 'G5505', lang: 'greek', matchAlts: ['ألف', 'الف'], occurrence: 2 },
  { book: 66, ch: 7, v: 7, arWord: 'ألف', current: 'G5507', target: 'G5505', lang: 'greek', matchAlts: ['ألف', 'الف'], occurrence: 3 },
  { book: 66, ch: 7, v: 8, arWord: 'ألف', current: 'G5507', target: 'G5505', lang: 'greek', matchAlts: ['ألف', 'الف'], occurrence: 1 },
  { book: 66, ch: 7, v: 8, arWord: 'ألف', current: 'G5507', target: 'G5505', lang: 'greek', matchAlts: ['ألف', 'الف'], occurrence: 2 },
  { book: 66, ch: 7, v: 8, arWord: 'ألف', current: 'G5507', target: 'G5505', lang: 'greek', matchAlts: ['ألف', 'الف'], occurrence: 3 },
  { book: 43, ch: 9, v: 7, arWord: 'بركة', current: 'G2881', target: 'G2861', lang: 'greek' },
  { book: 43, ch: 18, v: 29, arWord: 'بيلاطس', current: 'G4099', target: 'G4091', lang: 'greek' },
  { book: 49, ch: 4, v: 30, arWord: 'تحزنوا', current: 'G3079', target: 'G3076', lang: 'greek' },
  { book: 44, ch: 13, v: 7, arWord: 'سرجيوس', current: 'G4540', target: 'G4588', lang: 'greek' },
  { book: 41, ch: 15, v: 1, arWord: 'تشاور', current: 'G4196', target: 'G4824', lang: 'greek' },
  { book: 41, ch: 15, v: 23, arWord: 'ممزوجة', current: 'G4196', target: 'G4669', lang: 'greek' },
  { book: 42, ch: 8, v: 5, arWord: 'الزارع', current: 'G4622', target: 'G4687', lang: 'greek' },
  { book: 44, ch: 5, v: 16, arWord: 'حاملين', current: 'G5402', target: 'G5342', lang: 'greek' },
  { book: 44, ch: 24, v: 1, arWord: 'وخطيب', current: 'G4497', target: 'G4489', lang: 'greek' },
  { book: 53, ch: 3, v: 11, arWord: 'فضوليون', current: 'G4201', target: 'G4020', lang: 'greek' },
  { book: 66, ch: 15, v: 2, arWord: 'قيثارات', current: 'G5435', target: 'G2788', lang: 'greek' },
  { book: 47, ch: 1, v: 22, arWord: 'ختمنا', current: 'G4734', target: 'G4972', lang: 'greek' },
  { book: 47, ch: 5, v: 14, arWord: 'نحسب', current: 'G2803', target: 'G2919', lang: 'greek' },
  { book: 44, ch: 16, v: 2, arWord: 'وإيقونية', current: 'G2061', target: 'G2430', lang: 'greek', matchAlts: ['وإيقونية', 'وايقونية'] },
  { book: 44, ch: 13, v: 6, arWord: 'بار يشوع', current: 'G913', target: 'G919', lang: 'greek', matchAlts: ['بار يشوع', 'باريشوع', 'بار'] },
  { book: 48, ch: 5, v: 7, arWord: 'صدكم', current: 'G3531', target: 'G348', lang: 'greek' },
  { book: 66, ch: 4, v: 3, arWord: 'قزح', current: 'G5175', target: 'G2463', lang: 'greek' },
  { book: 61, ch: 2, v: 19, arWord: 'انغلب', current: 'G3527', target: 'G2274', lang: 'greek' },
  { book: 61, ch: 3, v: 1, arWord: 'بالتذكرة', current: 'G5403', target: 'G5280', lang: 'greek' },
  { book: 44, ch: 17, v: 9, arWord: 'كفالة', current: 'G3535', target: 'G2425', lang: 'greek' },
  { book: 45, ch: 16, v: 14, arWord: 'فليغون', current: 'G5376', target: 'G5393', lang: 'greek' },
  { book: 42, ch: 11, v: 32, arWord: 'نينوى', current: 'G3533', target: 'G3535', lang: 'greek' },
  { book: 66, ch: 21, v: 20, arWord: 'زمرد', current: 'G4658', target: 'G969', lang: 'greek' },
  { book: 66, ch: 21, v: 20, arWord: 'سلقي', current: 'G4658', target: 'G969', lang: 'greek' }
];

console.log(`Checking Total Cases: Group 1 (${group1.length}), Group 2 (${group2.length}), Group 3 (${group3.length}) = ${group1.length + group2.length + group3.length}`);

// Let's inspect each item against SQLite
const allCases = [...group1, ...group2, ...group3];
let missingStrongsInEntries = 0;
let notFoundInDb = [];
let foundMatches = [];

for (const c of allCases) {
  // Check target in strongs_entries
  const strongEntry = queryDb(`SELECT strongs_id, original_word, transliteration FROM strongs_entries WHERE strongs_id = '${c.target}';`);
  if (!strongEntry || strongEntry.length === 0) {
    console.error(`ERROR: Target ${c.target} not found in strongs_entries!`);
    missingStrongsInEntries++;
  }
  const targetLemma = strongEntry[0]?.original_word || '';

  // Get verse
  const verse = queryDb(`SELECT id, text_avd_ar, text_original FROM verses WHERE book_id = ${c.book} AND chapter_num = ${c.ch} AND verse_num = ${c.v};`);
  if (!verse || verse.length === 0) {
    console.error(`Verse not found: ${c.book} ${c.ch}:${c.v}`);
    notFoundInDb.push(c);
    continue;
  }
  const verseId = verse[0].id;

  // Get mappings for this verse
  const mappings = queryDb(`SELECT id, ar_word_position, orig_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = '${verseId}' ORDER BY ar_word_position;`);
  
  // Find matching word
  let matched = [];
  for (const m of mappings) {
    const cleanAr = (m.ar_word || '').replace(/[\u064B-\u065F\u0670]/g, ''); // strip diacritics
    const targetClean = c.arWord.replace(/[\u064B-\u065F\u0670]/g, '');
    let isMatch = cleanAr === targetClean;
    if (!isMatch && c.matchAlts) {
      isMatch = c.matchAlts.some(alt => alt.replace(/[\u064B-\u065F\u0670]/g, '') === cleanAr);
    }
    if (isMatch) {
      matched.push(m);
    }
  }

  if (matched.length === 0) {
    console.warn(`WARNING: No word match for "${c.arWord}" in ${c.book} ${c.ch}:${c.v}`);
    console.log('Available mappings:', mappings.map(m => `${m.ar_word_position}:${m.ar_word}(${m.strongs_id})`).join(', '));
    notFoundInDb.push(c);
  } else {
    // If multiple matches (like ألف 1, 2, 3)
    let selected = matched[0];
    if (c.occurrence && matched.length >= c.occurrence) {
      selected = matched[c.occurrence - 1];
    } else if (matched.length > 1) {
      // Find the one that has c.current strongs_id
      const byCurrent = matched.find(m => m.strongs_id === c.current);
      if (byCurrent) selected = byCurrent;
    }
    foundMatches.push({
      caseInfo: c,
      verseId,
      mapping: selected,
      targetLemma
    });
  }
}

console.log(`\nResults:`);
console.log(`Matches found: ${foundMatches.length} / ${allCases.length}`);
console.log(`Not found: ${notFoundInDb.length}`);
console.log(`Missing target strongs: ${missingStrongsInEntries}`);

fs.writeFileSync('scripts/matched_cases.json', JSON.stringify(foundMatches, null, 2), 'utf8');
