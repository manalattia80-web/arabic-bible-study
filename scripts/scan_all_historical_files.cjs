const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================================================');
console.log('   DEEP HISTORICAL SAMPLE INDEPENDENCE & EXCLUSION SCANNER             ');
console.log('========================================================================\n');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

// 1. Build authoritative lookups from SQLite database
console.log('▶ Building authoritative database lookup tables...');
function queryDb(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_scan_lookup.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 }).trim();
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

const verseMap = new Map();
const vRows = queryDb('SELECT id, book_id, chapter_num, verse_num FROM verses;').split('\n');
vRows.forEach(l => {
  const parts = l.trim().split('|');
  if (parts.length === 4) {
    verseMap.set(parts[0], { book_id: parseInt(parts[1], 10), chapter: parseInt(parts[2], 10), verse: parseInt(parts[3], 10) });
  }
});

const mappingMap = new Map();
const mRows = queryDb('SELECT wm.id, v.book_id, v.chapter_num, v.verse_num FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id;').split('\n');
mRows.forEach(l => {
  const parts = l.trim().split('|');
  if (parts.length === 4) {
    mappingMap.set(parts[0], { book_id: parseInt(parts[1], 10), chapter: parseInt(parts[2], 10), verse: parseInt(parts[3], 10) });
  }
});

const bookNameMap = new Map();
const bRows = queryDb('SELECT id, name_ar, name_en FROM books;').split('\n');
bRows.forEach(l => {
  const parts = l.trim().split('|');
  if (parts.length === 3) {
    const bId = parseInt(parts[0], 10);
    bookNameMap.set(parts[1].trim().toLowerCase(), bId);
    bookNameMap.set(parts[2].trim().toLowerCase(), bId);
  }
});

// Common English & Arabic book abbreviations
const extraAbbrevs = {
  'gen': 1, 'genesis': 1, 'التكوين': 1, 'تكوين': 1,
  'exo': 2, 'exod': 2, 'exodus': 2, 'الخروج': 2, 'خروج': 2,
  'lev': 3, 'leviticus': 3, 'اللاويين': 3, 'لاويين': 3,
  'num': 4, 'numbers': 4, 'العدد': 4, 'عدد': 4,
  'deut': 5, 'deuteronomy': 5, 'التثنية': 5, 'تثنية': 5,
  'josh': 6, 'joshua': 6, 'يشوع': 6,
  'judg': 7, 'judges': 7, 'القضاة': 7, 'قضاة': 7,
  'ruth': 8, 'راعوث': 8,
  '1 sam': 9, '1sam': 9, '1 samuel': 9, 'صموئيل الأول': 9, '١ صموئيل': 9,
  '2 sam': 10, '2sam': 10, '2 samuel': 10, 'صموئيل الثاني': 10, '٢ صموئيل': 10,
  '1 kings': 11, '1kings': 11, 'الملوك الأول': 11, '١ ملوك': 11,
  '2 kings': 12, '2kings': 12, 'الملوك الثاني': 12, '٢ ملوك': 12,
  '1 chr': 13, '1 chronicles': 13, 'أخبار الأيام الأول': 13, '١ أخبار': 13,
  '2 chr': 14, '2 chronicles': 14, 'أخبار الأيام الثاني': 14, '٢ أخبار': 14,
  'ezra': 15, 'عزرا': 15,
  'neh': 16, 'nehemiah': 16, 'نحميا': 16,
  'esth': 17, 'esther': 17, 'أستير': 17, 'استير': 17,
  'job': 18, 'أيوب': 18,
  'ps': 19, 'psa': 19, 'psalm': 19, 'psalms': 19, 'المزامير': 19, 'مزمور': 19,
  'prov': 20, 'proverbs': 20, 'الأمثال': 20, 'أمثال': 20,
  'eccl': 21, 'ecclesiastes': 21, 'الجامعة': 21, 'جامعة': 21,
  'song': 22, 'song of solomon': 22, 'نشيد الأنشاد': 22,
  'isa': 23, 'isaiah': 23, 'إشعياء': 23, 'اشعياء': 23,
  'jer': 24, 'jeremiah': 24, 'إرميا': 24, 'ارميا': 24,
  'lam': 25, 'lamentations': 25, 'مراثي إرميا': 25,
  'ezek': 26, 'ezekiel': 26, 'حزقيال': 26,
  'dan': 27, 'daniel': 27, 'دانيال': 27,
  'hos': 28, 'hosea': 28, 'هوشع': 28,
  'joel': 29, 'يوئيل': 29,
  'amos': 30, 'عاموس': 30,
  'obad': 31, 'obadiah': 31, 'عوبديا': 31,
  'jonah': 32, 'يونان': 32,
  'mic': 33, 'micah': 33, 'ميخا': 33,
  'nah': 34, 'nahum': 34, 'ناحوم': 34,
  'hab': 35, 'habakkuk': 35, 'حبقوق': 35,
  'zeph': 36, 'zephaniah': 36, 'صفنيا': 36,
  'hag': 37, 'haggai': 37, 'حجي': 37,
  'zech': 38, 'zechariah': 38, 'زكريا': 38,
  'mal': 39, 'malachi': 39, 'ملاخي': 39,
  'matt': 40, 'matthew': 40, 'متى': 40,
  'mark': 41, 'مرقس': 41,
  'luke': 42, 'لوقا': 42,
  'john': 43, 'يوحنا': 43,
  'acts': 44, 'أعمال الرسل': 44, 'أعمال': 44, 'اعمال': 44,
  'rom': 45, 'romans': 45, 'رومية': 45,
  '1 cor': 46, '1cor': 46, '1 corinthians': 46, 'كورنثوس الأولى': 46, '١ كورنثوس': 46,
  '2 cor': 47, '2cor': 47, '2 corinthians': 47, 'كورنثوس الثانية': 47, '٢ كورنثوس': 47,
  'gal': 48, 'galatians': 48, 'غلاطية': 48,
  'eph': 49, 'ephesians': 49, 'أفسس': 49,
  'phil': 50, 'philippians': 50, 'فيلبي': 50,
  'col': 51, 'colossians': 51, 'كولوسي': 51,
  '1 thess': 52, '1 thessalonians': 52, 'تسالونيكي الأولى': 52, '١ تسالونيكي': 52,
  '2 thess': 53, '2 thessalonians': 53, 'تسالونيكي الثانية': 53, '٢ تسالونيكي': 53,
  '1 tim': 54, '1 timothy': 54, 'تيموثاوس الأولى': 54, '١ تيموثاوس': 54,
  '2 tim': 55, '2 timothy': 55, 'تيموثاوس الثانية': 55, '٢ تيموثاوس': 55,
  'titus': 56, 'تيطس': 56,
  'philem': 57, 'philemon': 57, 'فليمون': 57,
  'heb': 58, 'hebrews': 58, 'العبرانيين': 58, 'عبرانيين': 58,
  'james': 59, 'يعقوب': 59,
  '1 pet': 60, '1 peter': 60, 'بطرس الأولى': 60, '١ بطرس': 60,
  '2 pet': 61, '2 peter': 61, 'بطرس الثانية': 61, '٢ بطرس': 61,
  '1 john': 62, '1john': 62, 'يوحنا الأولى': 62, '١ يوحنا': 62,
  '2 john': 63, '2john': 63, 'يوحنا الثانية': 63, '٢ يوحنا': 63,
  '3 john': 64, '3john': 64, 'يوحنا الثالثة': 64, '٣ يوحنا': 64,
  'jude': 65, 'يهوذا': 65,
  'rev': 66, 'revelation': 66, 'الرؤيا': 66, 'رؤيا': 66
};
for (const [k, v] of Object.entries(extraAbbrevs)) {
  bookNameMap.set(k.toLowerCase(), v);
}

console.log(`Lookup tables ready: ${verseMap.size} verses, ${mappingMap.size} mappings.\n`);

function parseCitationString(str) {
  if (!str || typeof str !== 'string') return null;
  const m = str.trim().match(/^(.+?)\s+(\d+)[:\.](\d+)/);
  if (m) {
    const name = m[1].trim().toLowerCase();
    const c = parseInt(m[2], 10);
    const v = parseInt(m[3], 10);
    if (bookNameMap.has(name)) {
      return { book_id: bookNameMap.get(name), chapter: c, verse: v };
    }
  }
  return null;
}

// 2. Load the held-out 60-verse sample
const sampleFile = path.resolve(__dirname, 'held_out_60_verses_sample.json');
const sampleData = JSON.parse(fs.readFileSync(sampleFile, 'utf8'));

const all60SampleVerses = [
  ...sampleData.hebrew.map(v => ({ ...v, lang: 'hebrew', key: `${v.book_id}:${v.chapter}:${v.verse}` })),
  ...sampleData.greek.map(v => ({ ...v, lang: 'greek', key: `${v.book_id}:${v.chapter}:${v.verse}` })),
  ...sampleData.aramaic.map(v => ({ ...v, lang: 'aramaic', key: `${v.book_id}:${v.chapter}:${v.verse}` }))
];
const sampleKeyMap = new Map();
all60SampleVerses.forEach(v => sampleKeyMap.set(v.key, v));

// 3. Scan all candidate historical files
const baseDir = path.resolve(__dirname, '..');
const historicalFileCandidates = [
  'gold_benchmark_300_verses.json',
  'alignment_audit_v299/gold_benchmark_300_verses.json',
  'alignment_audit_v299/measurement_sample_1000_tokens.json',
  'measurement_sample_1000_tokens.json',
  'phase1_targets.json',
  'phase2_targets.json',
  'phase2_verified_targets.json',
  'review.json',
  'scripts/whole_verses_audit_sample.json',
  'scripts/fresh_sample_audit.json',
  'scripts/independent_40word_sample_raw.json',
  'scripts/sample_data.json',
  'scratch/review_v317_evidence/review.json',
  'scratch/review_v317_evidence/baseline/review.json',
  'baselines/benchmark_300_verses_eval.json',
  'scripts/user_10_verses_dump.json'
];

const filesFound = [];
const filesMissing = [];
const historicalVerses = new Map();

console.log('▶ Scanning Historical Candidate Files:');

for (const relPath of historicalFileCandidates) {
  const fullPath = path.resolve(baseDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [MISSING] File not found on disk: ${relPath}`);
    filesMissing.push(relPath);
    continue;
  }

  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(raw);

    let extractedCount = 0;
    const inspect = (item, parentKey = '') => {
      if (!item) return;

      // Check citation in object key (e.g. user_10_verses_dump: "Gen 7:3")
      if (typeof parentKey === 'string' && parentKey.includes(' ')) {
        const fromKey = parseCitationString(parentKey);
        if (fromKey) {
          const k = `${fromKey.book_id}:${fromKey.chapter}:${fromKey.verse}`;
          historicalVerses.set(k, { file: relPath, book_id: fromKey.book_id, chapter: fromKey.chapter, verse: fromKey.verse });
          extractedCount++;
        }
      }

      if (typeof item === 'string') {
        const parsed = parseCitationString(item);
        if (parsed) {
          const k = `${parsed.book_id}:${parsed.chapter}:${parsed.verse}`;
          historicalVerses.set(k, { file: relPath, book_id: parsed.book_id, chapter: parsed.chapter, verse: parsed.verse });
          extractedCount++;
        }
        return;
      }

      if (typeof item !== 'object') return;

      // 1. Direct book/chapter/verse properties
      if (item.book_id && item.chapter_num && item.verse_num) {
        const k = `${item.book_id}:${item.chapter_num}:${item.verse_num}`;
        historicalVerses.set(k, { file: relPath, book_id: item.book_id, chapter: item.chapter_num, verse: item.verse_num });
        extractedCount++;
      } else if (item.book_id && item.chapter && item.verse) {
        const k = `${item.book_id}:${item.chapter}:${item.verse}`;
        historicalVerses.set(k, { file: relPath, book_id: item.book_id, chapter: item.chapter, verse: item.verse });
        extractedCount++;
      } else if (item.book && item.chapter && item.verse) {
        const k = `${item.book}:${item.chapter}:${item.verse}`;
        historicalVerses.set(k, { file: relPath, book_id: item.book, chapter: item.chapter, verse: item.verse });
        extractedCount++;
      }

      // 2. String citations (citation, reference, ref, verse)
      const citationCandidate = item.citation || item.reference || item.ref || item.verse;
      if (typeof citationCandidate === 'string') {
        const fromCitation = parseCitationString(citationCandidate);
        if (fromCitation) {
          const k = `${fromCitation.book_id}:${fromCitation.chapter}:${fromCitation.verse}`;
          historicalVerses.set(k, { file: relPath, book_id: fromCitation.book_id, chapter: fromCitation.chapter, verse: fromCitation.verse });
          extractedCount++;
        }
      }

      // 3. Database UUID lookup (verse_id or mapping_id or id)
      if (item.verse_id && verseMap.has(item.verse_id)) {
        const v = verseMap.get(item.verse_id);
        const k = `${v.book_id}:${v.chapter}:${v.verse}`;
        historicalVerses.set(k, { file: relPath, book_id: v.book_id, chapter: v.chapter, verse: v.verse });
        extractedCount++;
      }
      if (item.mapping_id && mappingMap.has(item.mapping_id)) {
        const m = mappingMap.get(item.mapping_id);
        const k = `${m.book_id}:${m.chapter}:${m.verse}`;
        historicalVerses.set(k, { file: relPath, book_id: m.book_id, chapter: m.chapter, verse: m.verse });
        extractedCount++;
      }
      if (item.id && mappingMap.has(item.id)) {
        const m = mappingMap.get(item.id);
        const k = `${m.book_id}:${m.chapter}:${m.verse}`;
        historicalVerses.set(k, { file: relPath, book_id: m.book_id, chapter: m.chapter, verse: m.verse });
        extractedCount++;
      }

      // Traverse children
      if (Array.isArray(item)) {
        item.forEach((sub, idx) => inspect(sub, String(idx)));
      } else {
        for (const [key, val] of Object.entries(item)) {
          inspect(val, key);
        }
      }
    };

    inspect(data);

    const fileDescriptions = {
      'scripts/sample_data.json': 'مفردات معجمية لأرقام سترونغ (قائمة كلمات وليس سجل آيات)',
      'baselines/benchmark_300_verses_eval.json': 'ملخص إحصائي ونسب دقة تقييمية (بيانات ملخصة وليس قائمة شواهد آيات)'
    };

    filesFound.push({
      path: relPath,
      size_bytes: raw.length,
      extracted_verses: extractedCount,
      nature: fileDescriptions[relPath] || 'سجل آيات وشواهد تاريخية'
    });
    console.log(`  [SCANNED] ${relPath} (extracted ${extractedCount} verse references)${fileDescriptions[relPath] ? ' - ' + fileDescriptions[relPath] : ''}`);
  } catch (e) {
    console.error(`  [ERROR] Parsing failed for ${relPath}: ${e.message}`);
    filesMissing.push(relPath);
  }
}

console.log(`\nScan Summary:`);
console.log(`- Files configured to search: ${historicalFileCandidates.length}`);
console.log(`- Files actually found and parsed: ${filesFound.length}`);
console.log(`- Files missing on current filesystem: ${filesMissing.length}`);
console.log(`- Total unique historical verses extracted across all files: ${historicalVerses.size}`);

// 4. Overlap analysis
const overlaps = [];
for (const [key, sv] of sampleKeyMap.entries()) {
  if (historicalVerses.has(key)) {
    overlaps.push({
      sample_verse: sv,
      historical_source: historicalVerses.get(key)
    });
  }
}

console.log(`\nOverlaps between held-out 60-verse sample and historical benchmark files: ${overlaps.length}`);
if (overlaps.length > 0) {
  console.log('Overlapping verses detected:');
  overlaps.forEach(o => {
    console.log(`  - ${o.sample_verse.name_en} ${o.sample_verse.chapter}:${o.sample_verse.verse} (found in ${o.historical_source.file})`);
  });
} else {
  console.log('✓ Zero overlaps detected.');
}

// 5. Write comprehensive report
const report = {
  scan_timestamp: new Date().toISOString(),
  files_configured_to_search: historicalFileCandidates.length,
  files_found_count: filesFound.length,
  files_missing_count: filesMissing.length,
  files_found: filesFound,
  files_missing: filesMissing,
  total_historical_unique_verses: historicalVerses.size,
  sample_verses_count: 60,
  overlap_count: overlaps.length,
  overlaps: overlaps.map(o => ({
    book_id: o.sample_verse.book_id,
    chapter: o.sample_verse.chapter,
    verse: o.sample_verse.verse,
    name_en: o.sample_verse.name_en,
    matched_historical_file: o.historical_source.file
  }))
};

const reportPath = path.resolve(__dirname, 'historical_overlap_report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`\nReport successfully written to ${reportPath}`);
