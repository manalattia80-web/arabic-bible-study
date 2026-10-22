const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

const punctuationRegex = /[\u060C\u061B\u061F\u06D4«».,:;!؟\(\)\[\]"'\-—–]/gu;
function cleanPunct(s) {
  return (s || '').replace(punctuationRegex, '').trim();
}
function stripTashkeel(s) {
  return cleanPunct(s).replace(/[\u064B-\u065F\u0670]/g, '');
}

console.log('Loading verses and mappings...');
const verses = q("SELECT id, book_id, chapter_num, verse_num, text_avd_ar FROM verses ORDER BY book_id, chapter_num, verse_num;");

const booksMeta = [
  "", "التكوين", "الخروج", "اللاويين", "العدد", "التثنية", "يشوع", "القضاة", "راعوث",
  "صموئيل الأول", "صموئيل الثاني", "الملوك الأول", "الملوك الثاني", "أخبار الأيام الأول", "أخبار الأيام الثاني",
  "عزرا", "نحميا", "أستير", "أيوب", "المزامير", "الأمثال", "الجامعة", "نشيد الأنشاد",
  "إشعياء", "إرميا", "مراثي إرميا", "حزقيال", "دانيال", "هوشع", "يوئيل", "عاموس", "عوبديا",
  "يونان", "ميخا", "ناحوم", "حبقوق", "صفنيا", "حجي", "زكريا", "ملاخي",
  "متى", "مرقس", "لوقا", "يوحنا", "أعمال الرسل", "رومية", "كورنثوس الأولى", "كورنثوس الثانية",
  "غلاطية", "أفسس", "فيلبي", "كولوسي", "تسالونيكي الأولى", "تسالونيكي الثانية", "تيموثاوس الأولى",
  "تيموثاوس الثانية", "تيطس", "فليمون", "العبرانيين", "يعقوب", "بطرس الأولى", "بطرس الثانية",
  "يوحنا الأولى", "يوحنا الثانية", "يوحنا الثالثة", "يهوذا", "رؤيا يوحنا"
];

const classified = {
  omission: [],       // حذف (نقص في قوائم الربط)
  addition: [],       // زيادة (إقحام أو تكرار زائد في قوائم الربط)
  splitting: [],      // اختلاف تقسيم كلمات وإملاء (تقسيم/دمج أو كتابة إملائية)
  lexical: []         // اختلاف لفظي أو تشويش نصي
};

for (let b = 1; b <= 66; b++) {
  const bookVerses = verses.filter(v => v.book_id === b);
  if (bookVerses.length === 0) continue;

  const bMappings = q(`
    SELECT wm.verse_id, wm.ar_word
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    WHERE v.book_id = ${b}
    ORDER BY v.chapter_num, v.verse_num, wm.ar_word_position;
  `);

  const mapByVerse = new Map();
  for (const m of bMappings) {
    if (!mapByVerse.has(m.verse_id)) {
      mapByVerse.set(m.verse_id, []);
    }
    mapByVerse.get(m.verse_id).push(m.ar_word);
  }

  for (const v of bookVerses) {
    const vRawWords = v.text_avd_ar.split(/\s+/).filter(w => cleanPunct(w).length > 0);
    const vCleanWords = vRawWords.map(w => cleanPunct(w));
    const mRawWords = mapByVerse.get(v.id) || [];
    const mCleanWords = mRawWords.map(w => cleanPunct(w)).filter(w => w.length > 0);

    const vStr = vCleanWords.map(stripTashkeel).join(' ');
    const mStr = mCleanWords.map(stripTashkeel).join(' ');

    if (vStr === mStr) {
      continue; // Exact match
    }

    const refStr = `${booksMeta[v.book_id]} ${v.chapter_num}:${v.verse_num}`;

    // Test if it's pure splitting / tokenization difference:
    // e.g. text without spaces matches!
    const vNoSpace = vCleanWords.map(stripTashkeel).join('');
    const mNoSpace = mCleanWords.map(stripTashkeel).join('');

    if (vNoSpace === mNoSpace) {
      classified.splitting.push({
        ref: refStr,
        book_id: v.book_id,
        chap: v.chapter_num,
        verse: v.verse_num,
        vLen: vCleanWords.length,
        mLen: mCleanWords.length,
        vText: vCleanWords.join(' '),
        mText: mCleanWords.join(' '),
        detail: 'تطابق حرفي تام عند إزالة المسافات؛ الاختلاف فقط في تقسيم الكلمات أو دمجها'
      });
      continue;
    }

    // Check lengths
    if (vCleanWords.length > mCleanWords.length) {
      classified.omission.push({
        ref: refStr,
        book_id: v.book_id,
        chap: v.chapter_num,
        verse: v.verse_num,
        vLen: vCleanWords.length,
        mLen: mCleanWords.length,
        diff: vCleanWords.length - mCleanWords.length,
        vText: vCleanWords.join(' '),
        mText: mCleanWords.join(' ')
      });
    } else if (vCleanWords.length < mCleanWords.length) {
      // Could be splitting with slight variance, or addition
      classified.addition.push({
        ref: refStr,
        book_id: v.book_id,
        chap: v.chapter_num,
        verse: v.verse_num,
        vLen: vCleanWords.length,
        mLen: mCleanWords.length,
        diff: mCleanWords.length - vCleanWords.length,
        vText: vCleanWords.join(' '),
        mText: mCleanWords.join(' ')
      });
    } else {
      // Same length but different tokens
      classified.lexical.push({
        ref: refStr,
        book_id: v.book_id,
        chap: v.chapter_num,
        verse: v.verse_num,
        vLen: vCleanWords.length,
        mLen: mCleanWords.length,
        vText: vCleanWords.join(' '),
        mText: mCleanWords.join(' ')
      });
    }
  }
}

console.log('--- Classification Summary ---');
console.log(`1. حذف (نقص كلمات في قوائم الربط): ${classified.omission.length}`);
console.log(`2. زيادة (كلمات زائدة في قوائم الربط): ${classified.addition.length}`);
console.log(`3. تقسيم وإملاء (تطابق تام للحروف واختلاف تقطيع المسافات): ${classified.splitting.length}`);
console.log(`4. اختلاف لفظي أو تشويش نصي: ${classified.lexical.length}`);
console.log(`Total: ${classified.omission.length + classified.addition.length + classified.splitting.length + classified.lexical.length}`);

fs.writeFileSync(path.resolve(__dirname, 'classified_discrepancies.json'), JSON.stringify(classified, null, 2), 'utf8');
console.log('Saved to classified_discrepancies.json');
