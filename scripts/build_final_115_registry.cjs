const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const sqlite = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');
const dbFile = path.join(__dirname, '..', 'mobile', 'assets', 'bible_study.db');

const dbBuf = fs.readFileSync(dbFile);
const dbSha256 = crypto.createHash('sha256').update(dbBuf).digest('hex');

// Read the 115 baseline audit cases
const baselineMd = fs.readFileSync('C:/Users/manal/.gemini/antigravity/brain/6d627a05-53e4-4c46-8d77-9c11b867e94a/comprehensive_115_cases_and_66_verses_audit.md', 'utf8');
const baselineLines = baselineMd.split('\n').filter(l => l.match(/^\|\s*\*?\*?\d+/));

console.log(`Found ${baselineLines.length} baseline records.`);

const bookMap = {
  'التكوين': 1, 'الخروج': 2, 'اللاويين': 3, 'العدد': 4, 'التثنية': 5,
  'يشوع': 6, 'القضاة': 7, 'راعوث': 8, 'صموئيل الأول': 9, 'صموئيل الثاني': 10,
  'الملوك الأول': 11, 'الملوك الثاني': 12, 'أخبار الأيام الأول': 13, 'أخبار الأيام الثاني': 14,
  'عزرا': 15, 'نحميا': 16, 'أستير': 17, 'أيوب': 18, 'المزامير': 19,
  'الأمثال': 20, 'الجامعة': 21, 'نشيد الأنشاد': 22, 'إشعياء': 23, 'إرميا': 24,
  'مراثي إرميا': 25, 'حزقيال': 26, 'دانيال': 27, 'هوشع': 28, 'يوئيل': 29,
  'عاموس': 30, 'عوبديا': 31, 'يونان': 32, 'ميخا': 33, 'ناحوم': 34,
  'حبقوق': 35, 'صفنيا': 36, 'حجي': 37, 'زكريا': 38, 'ملاخي': 39,
  'متى': 40, 'مرقس': 41, 'لوقا': 42, 'يوحنا': 43, 'أعمال الرسل': 44,
  'رومية': 45, 'كورنثوس الأولى': 46, 'كورنثوس الثانية': 47, 'غلاطية': 48,
  'أفسس': 49, 'فيلبي': 50, 'كولوسي': 51, 'تسالونيكي الأولى': 52,
  'تسالونيكي الثانية': 53, 'تيموثاوس الأولى': 54, 'تيموثاوس الثانية': 55,
  'تيطس': 56, 'فليمون': 57, 'العبرانيين': 58, 'يعقوب': 59,
  'بطرس الأولى': 60, 'بطرس الثانية': 61, 'يوحنا الأولى': 62, 'يوحنا الثانية': 63,
  'يوحنا الثالثة': 64, 'يهوذا': 65, 'رؤيا يوحنا': 66
};

function parseRef(refStr) {
  // e.g. "التثنية 2: 24" or "صموئيل الثاني 14: 2"
  const m = refStr.match(/^(.+?)\s+(\d+)\s*:\s*(\d+)$/);
  if (!m) return null;
  const bookName = m[1].trim();
  const ch = parseInt(m[2], 10);
  const v = parseInt(m[3], 10);
  const bookId = bookMap[bookName];
  return { bookName, ch, v, bookId };
}

// Generate the 115 registry with exact live database queries
const finalCases = [];

baselineLines.forEach(line => {
  const parts = line.split('|').map(s => s.trim()).filter(s => s.length > 0);
  // parts[0]: num, parts[1]: ref, parts[2]: hist_word, parts[3]: hist_pos, parts[4]: max_tokens, parts[5]: codex_at_pos, parts[6]: strongs
  const num = parseInt(parts[0].replace(/\*/g, ''), 10);
  const ref = parts[1];
  const histWord = parts[2];
  const histPos = parseInt(parts[3], 10);
  const parsed = parseRef(ref);

  if (!parsed) {
    console.error(`Failed to parse ref: ${ref}`);
    return;
  }

  // Query live DB
  const verseRaw = execFileSync(sqlite, [dbFile, '-json'], {
    input: `SELECT id, text_avd_ar, text_original FROM verses WHERE book_id = ${parsed.bookId} AND chapter_num = ${parsed.ch} AND verse_num = ${parsed.v};`,
    encoding: 'utf8'
  });
  const verse = JSON.parse(verseRaw)[0];

  const wmRaw = execFileSync(sqlite, [dbFile, '-json'], {
    input: `SELECT ar_word_position, orig_word_position, ar_word, orig_word, orig_surface, strongs_id, orig_morphology, relation_type, verified_locator FROM word_mappings WHERE verse_id = '${verse.id}' ORDER BY ar_word_position;`,
    encoding: 'utf8'
  });
  const mappings = JSON.parse(wmRaw);

  // Match actual word in DB
  let actualMapping = null;
  // Try matching by exact Arabic word
  const cleanHist = histWord.replace(/[\u064B-\u065F\u0670]/g, '');
  const wordMatches = mappings.filter(m => m.ar_word.replace(/[\u064B-\u065F\u0670]/g, '') === cleanHist);

  if (wordMatches.length === 1) {
    actualMapping = wordMatches[0];
  } else if (wordMatches.length > 1) {
    // choose closest to histPos
    wordMatches.sort((a, b) => Math.abs(a.ar_word_position - histPos) - Math.abs(b.ar_word_position - histPos));
    actualMapping = wordMatches[0];
  } else {
    // Word not found by text: try matching by position or known historical discrepancy
    if (mappings.find(m => m.ar_word_position === histPos)) {
      actualMapping = mappings.find(m => m.ar_word_position === histPos);
    } else {
      // fallback
      actualMapping = mappings[mappings.length - 1];
    }
  }

  finalCases.push({
    num,
    ref,
    histWord,
    histPos,
    actualMapping,
    parsed
  });
});

console.log(`Processed ${finalCases.length} cases.`);
fs.writeFileSync('scripts/evaluated_115_cases.json', JSON.stringify(finalCases, null, 2), 'utf8');
