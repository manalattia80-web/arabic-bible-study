const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');
const sqlite = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');
const db = path.join(__dirname, '..', 'mobile', 'assets', 'bible_study.db');

function queryJson(sql) {
  const tmp = path.join(__dirname, 'temp_m.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    const raw = execFileSync(sqlite, [db, '-json'], { input: sql, encoding: 'utf8' });
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

const mdSource = fs.readFileSync('C:/Users/manal/.gemini/antigravity/brain/6d627a05-53e4-4c46-8d77-9c11b867e94a/comprehensive_115_cases_and_66_verses_audit.md', 'utf8');
const lines = mdSource.split('\n').filter(l => l.startsWith('| **') || l.startsWith('|**'));

const bookMap = {
  'العدد': 4, 'التثنية': 5, 'صموئيل الثاني': 10, 'الملوك الأول': 11, 'الملوك الثاني': 12,
  'أخبار الأيام الأول': 13, 'أخبار الأيام الثاني': 14, 'إشعياء': 23, 'إرميا': 24, 'حزقيال': 26,
  'دانيال': 27, 'هوشع': 28, 'يوئيل': 29, 'عاموس': 30, 'عوبديا': 31, 'ميخا': 33, 'ناحوم': 34,
  'حبقوق': 35, 'صفنيا': 36, 'حجي': 37, 'زكريا': 38, 'ملاخي': 39, 'العبرانيين': 58, 'عزرا': 15,
  'نحميا': 16, 'أستير': 17, 'أيوب': 18, 'المزامير': 19, 'الأمثال': 20, 'الجامعة': 21,
  'نشيد الأنشاد': 22, 'القضاة': 7, 'يشوع': 6, 'الخروج': 2, 'اللاويين': 3
};

function stripTashkeel(s) {
  return s.replace(/[\u064B-\u065F\u0670\s\.\,\;\:\!\؟\»\«]/g, '').trim();
}

let matchedCount = 0;
let missedCount = 0;

const matchedRecords = [];

lines.forEach((l, idx) => {
  const parts = l.split('|').map(s => s.trim());
  const num = parseInt(parts[1].replace(/\*\*/g, '').trim());
  const ref = parts[2].trim();
  const arWord = parts[3].trim();
  const arPos = parseInt(parts[4].trim());

  const m = ref.match(/^(.+?)\s+(\d+)\s*:\s*(\d+)$/);
  const bookId = bookMap[m[1].trim()];
  const chap = parseInt(m[2]);
  const verse = parseInt(m[3]);

  const v = queryJson(`SELECT id, text_avd_ar, text_original, text_original_lang FROM verses WHERE book_id = ${bookId} AND chapter_num = ${chap} AND verse_num = ${verse};`)[0];
  const allMappings = queryJson(`SELECT id, ar_word_position, ar_word, orig_word, orig_surface, strongs_id, orig_word_position, orig_morphology FROM word_mappings WHERE verse_id = '${v.id}' ORDER BY ar_word_position;`);

  // Specific canonical manual variants
  const manualOverrides = {
    17: 6, // 2 Chron 35:26 هو
    18: 7, // 2 Chron 35:26 مكتوب
    21: 11, // Judges 14:16 حاجيت
    25: 24, // 2 Sam 14:2 أيام
    27: 26, // 2 Sam 14:2 وهي
    29: 6, // Prov 19:20 تكون
    30: 2, // Job 22:5 شرك
    35: 16 // Eccl 2:7 جميع
  };

  let match = null;
  if (manualOverrides[num]) {
    match = allMappings.find(wm => wm.ar_word_position === manualOverrides[num]);
  }

  // First try exact ar_pos match if words align
  if (!match) {
    match = allMappings.find(wm => wm.ar_word_position === arPos && stripTashkeel(wm.ar_word) === stripTashkeel(arWord));
  }
  if (!match) {
    // Try matching by word text near arPos
    match = allMappings.find(wm => stripTashkeel(wm.ar_word) === stripTashkeel(arWord) && Math.abs(wm.ar_word_position - arPos) <= 2);
  }
  if (!match) {
    // Try any match by word text in verse
    match = allMappings.find(wm => stripTashkeel(wm.ar_word) === stripTashkeel(arWord));
  }

  const lang = v.text_original_lang || (bookId >= 40 ? 'greek' : 'hebrew');
  const tokens = lang === 'greek' 
    ? v.text_original.trim().split(/\s+/).filter(Boolean)
    : v.text_original.trim().split(/[\s\u05BE]+/).filter(Boolean);

  if (match) {
    matchedCount++;
    let tokenAtOrig = '—';
    if (match.orig_word_position !== null && match.orig_word_position >= 1 && match.orig_word_position <= tokens.length) {
      tokenAtOrig = tokens[match.orig_word_position - 1];
    } else if (match.orig_word_position > tokens.length) {
      tokenAtOrig = `— (خارج الحدود: ${match.orig_word_position} > ${tokens.length})`;
    }

    matchedRecords.push({
      num,
      ref,
      canonical_word: arWord,
      canonical_pos: arPos,
      db_word: match.ar_word,
      db_pos: match.ar_word_position,
      orig_pos: match.orig_word_position,
      orig_surface: match.orig_surface,
      orig_word: match.orig_word,
      strongs_id: match.strongs_id,
      morphology: match.orig_morphology,
      token_in_codex_at_pos: tokenAtOrig,
      max_tokens: tokens.length
    });
  } else {
    missedCount++;
    console.log(`MISSED: Case #${num} ${ref} [${arWord}]`);
  }
});

console.log(`Matched: ${matchedCount}/115, Missed: ${missedCount}`);

fs.writeFileSync(path.join(__dirname, 'perfect_115_db_extraction.json'), JSON.stringify(matchedRecords, null, 2), 'utf8');
console.log('Saved perfect_115_db_extraction.json successfully!');
