const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

const dictLines = fs.readFileSync('scripts/temp_hebrew_dict.tsv', 'utf8').split('\n');

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\p{P}\u060C\u061B\u061F«»"'\-—–]/gu, '')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .trim();
}

function cleanWord(text) {
  if (!text) return '';
  return text.replace(/[\.,;:!?«»\(\)\[\]\u060C\u061B\u061F"'\-—–]/gu, '').trim();
}

function stripHebrew(text) {
  if (!text) return '';
  return text
    .replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '')
    .replace(/[\u05BE׃׀]/g, ' ')
    .replace(/[\(\)\[\]]/g, '')
    .trim();
}

const exactDict = new Map();
const normDict = new Map();

for (const line of dictLines) {
  if (!line || !line.trim()) continue;
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const w = cleanWord(parts[0]);
  const s = parts[1].trim();
  const cnt = parseInt(parts[2].trim(), 10) || 1;
  
  if (!exactDict.has(w)) exactDict.set(w, []);
  exactDict.get(w).push({ sid: s, cnt });
  
  const n = normalizeArabic(w);
  if (!normDict.has(n)) normDict.set(n, []);
  normDict.get(n).push({ sid: s, cnt });
}

const strongsMap = new Map();
const sRows = q("SELECT strongs_id, original_word FROM strongs_entries WHERE strongs_id LIKE 'H%';");
for (const r of sRows) {
  strongsMap.set(r.strongs_id, r.original_word);
}

const PREFIXES = ['وال', 'فال', 'بال', 'كال', 'لل', 'و', 'ف', 'ب', 'ل', 'ك', 'س', 'ال'];
const SUFFIXES = ['هما', 'هم', 'هن', 'كما', 'كم', 'كن', 'نا', 'ني', 'ها', 'ه', 'ي', 'ك', 'ات', 'ان', 'ين', 'ون', 'وا', 'تم', 'تن', 'ت', 'ة'];

function getStems(raw) {
  const parts = raw.split(/[:«»\(\)\[\]"'\-—–]/).filter(Boolean);
  const set = new Set();
  
  for (const part of (parts.length ? parts : [raw])) {
    const cl = cleanWord(part);
    if (!cl) continue;
    const nm = normalizeArabic(cl);
    set.add(cl);
    set.add(nm);
    
    for (const suf of SUFFIXES) {
      if (nm.endsWith(suf) && nm.length > suf.length + 2) {
        const s = nm.slice(0, -suf.length);
        set.add(s);
        for (const pref of PREFIXES) {
          if (s.startsWith(pref) && s.length > pref.length + 2) {
            set.add(s.slice(pref.length));
          }
        }
      }
    }
    
    for (const pref of PREFIXES) {
      if (nm.startsWith(pref) && nm.length > pref.length + 2) {
        const s = nm.slice(pref.length);
        set.add(s);
        for (const suf of SUFFIXES) {
          if (s.endsWith(suf) && s.length > suf.length + 2) {
            set.add(s.slice(0, -suf.length));
          }
        }
      }
    }
  }
  
  return Array.from(set);
}

// Extra semantic dictionary for specific Hebrew words in target verses
const EXTRA_HEBREW_BRIDGE = {
  'صمت': 'H6684',
  'وبكيت': 'H1058',
  'بكيت': 'H1058',
  'قمت': 'H6965',
  'واكلت': 'H398',
  'تشاء': 'H14',
  'تتبعني': 'H1980',
  'بابنك': 'H1121',
  'ابنك': 'H1121',
  'نمريم': 'H5249',
  'خربة': 'H4923',
  'العشب': 'H2682',
  'يبس': 'H3001',
  'الكلا': 'H1877',
  'فني': 'H3615',
  'الخضرة': 'H3418',
  'الثروة': 'H3504',
  'اكتسبوها': 'H6213',
  'وذخائرهم': 'H6486',
  'ذخائرهم': 'H6486',
  'يحملونها': 'H5375',
  'عبر': 'H5676',
  'وادي': 'H5158',
  'الصفصاف': 'H6155',
  'الصراخ': 'H2201',
  'احاط': 'H5362',
  'بتخوم': 'H1366',
  'موآب': 'H4124',
  'اجلايم': 'H97',
  'ولولتها': 'H3214',
  'ديمون': 'H1775',
  'تمتلي': 'H4390',
  'دم': 'H1818',
  'زوائد': 'H3254',
  'الناجين': 'H6413',
  'اسد': 'H738',
  'بيد': 'H3027',
  'لمستني': 'H5060',
  'واقامتني': 'H5128',
  'مرتجفا': 'H5128',
  'ركبتي': 'H1290',
  'كفي': 'H3709',
  'يدي': 'H3027',
  'فتعظم': 'H7235',
  'عظمتي': 'H1420',
  'وترجع': 'H7725',
  'فتعزيني': 'H5162',
  'تعزيني': 'H5162',
  'تجارك': 'H7402',
  'نجوم': 'H3556',
  'السماء': 'H8064',
  'الجنادب': 'H3218',
  'شمس': 'H8121',
  'مكانها': 'H4725',
  'نعس': 'H5123',
  'رعاتك': 'H7462',
  'ملك': 'H4428',
  'اشور': 'H804',
  'سكن': 'H7931',
  'عظماؤك': 'H117',
  'تبدد': 'H6335',
  'شعبك': 'H5971',
  'الجبال': 'H2022',
  'جامع': 'H6908',
  'انكسارك': 'H7667',
  'جرحك': 'H2470',
  'شامتك': 'H8088',
  'صفقوا': 'H8628',
  'بايديهم': 'H3709',
  'شرك': 'H7451',
  'دائما': 'H8548'
};

let sql = 'BEGIN TRANSACTION;\n\n';

// 1. Fix Psalm 119:1
console.log('Fixing Psalm 119:1...');
const psa119_1_id = q("SELECT id FROM verses WHERE book_id = 19 AND chapter_num = 119 AND verse_num = 1;")[0].id;
sql += `DELETE FROM word_mappings WHERE verse_id = '${psa119_1_id}';\n`;
const p119_words = [
  { pos: 1, ar: 'طُوبَى', orig: 'אַשְׁרֵי', sid: 'H835' },
  { pos: 2, ar: 'لِلْكَامِلِينَ', orig: 'תָּמִים', sid: 'H8549' },
  { pos: 3, ar: 'طَرِيقًا،', orig: 'דֶּרֶךְ', sid: 'H1870' },
  { pos: 4, ar: 'السَّالِكِينَ', orig: 'הָלַךְ', sid: 'H1980' },
  { pos: 5, ar: 'فِي', orig: '---', sid: null },
  { pos: 6, ar: 'شَرِيعَةِ', orig: 'תּוֹרָה', sid: 'H8451' },
  { pos: 7, ar: 'الرَّبِّ.', orig: 'יְהֹוָה', sid: 'H3068' }
];
for (const w of p119_words) {
  const rowId = crypto.randomUUID();
  const arVal = `'${w.ar.replace(/'/g, "''")}'`;
  const origVal = `'${w.orig.replace(/'/g, "''")}'`;
  const strongVal = w.sid ? `'${w.sid}'` : 'NULL';
  sql += `INSERT INTO word_mappings (id, verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES ('${rowId}', '${psa119_1_id}', ${w.pos}, ${w.pos}, ${arVal}, ${origVal}, 'hebrew', ${strongVal}, 1);\n`;
}

// 2. Fix Genesis 35:1 (لك -> H413 instead of H5921)
console.log('Fixing Genesis 35:1 word 18...');
sql += `
UPDATE word_mappings 
SET orig_word = 'אֶל', strongs_id = 'H413' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 1 AND chapter_num = 35 AND verse_num = 1) 
  AND ar_word_position = 18;
\n`;

// 3. The 6 truncated verses + 20 empty OT verses = 26 target verses
const targetVerseQueries = [
  // 6 Truncated
  "SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 1 AND chapter_num = 24 AND verse_num = 5;",
  "SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 23 AND chapter_num = 15 AND verse_num IN (6,7,8,9);",
  "SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 27 AND chapter_num = 10 AND verse_num = 10;",
  // 20 Empty
  "SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 10 AND chapter_num = 12 AND verse_num BETWEEN 21 AND 25;",
  "SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 10 AND chapter_num = 14 AND verse_num BETWEEN 6 AND 10;",
  "SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 12 AND chapter_num = 6 AND verse_num BETWEEN 16 AND 20;",
  "SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 19 AND chapter_num = 71 AND verse_num = 21;",
  "SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 34 AND chapter_num = 3 AND verse_num BETWEEN 16 AND 19;"
];

const targetVerses = targetVerseQueries.flatMap(query => q(query));
console.log(`Processing ${targetVerses.length} target verses (6 truncated + 20 previously empty)...`);

let totalTargetWords = 0;
let linkedTargetWords = 0;

for (const v of targetVerses) {
  sql += `DELETE FROM word_mappings WHERE verse_id = '${v.id}';\n`;
  
  const arTokens = v.text_avd_ar.split(/\s+/).filter(Boolean);
  const rawHebrewWords = stripHebrew(v.text_original).split(/\s+/).filter(Boolean);
  
  for (let i = 0; i < arTokens.length; i++) {
    totalTargetWords++;
    const raw = arTokens[i];
    const cl = cleanWord(raw);
    const nm = normalizeArabic(cl);
    const stems = getStems(raw);
    
    let candidates = [];
    
    // Check EXTRA_HEBREW_BRIDGE
    for (const stem of stems) {
      if (EXTRA_HEBREW_BRIDGE[stem]) {
        const sid = EXTRA_HEBREW_BRIDGE[stem];
        candidates.push({ sid, cnt: 50, score: 5000 });
      }
    }
    
    if (candidates.length === 0 && exactDict.has(cl)) {
      for (const item of exactDict.get(cl)) {
        candidates.push({ sid: item.sid, cnt: item.cnt, score: 2000 + item.cnt * 10 });
      }
    }
    if (candidates.length === 0 && normDict.has(nm)) {
      for (const item of normDict.get(nm)) {
        candidates.push({ sid: item.sid, cnt: item.cnt, score: 1200 + item.cnt * 5 });
      }
    }
    if (candidates.length === 0) {
      for (const stem of stems) {
        if (normDict.has(stem)) {
          for (const item of normDict.get(stem)) {
            candidates.push({ sid: item.sid, cnt: item.cnt, score: 800 + item.cnt * 3 });
          }
          if (candidates.length > 0) break;
        }
      }
    }
    
    let best = null;
    let bestScore = -999999;
    
    for (const cand of candidates) {
      let s = cand.score;
      const lemma = strongsMap.get(cand.sid) || '';
      const strippedLemma = stripHebrew(lemma);
      
      let foundInHebrew = false;
      for (let j = 0; j < rawHebrewWords.length; j++) {
        const hw = rawHebrewWords[j];
        if (hw === strippedLemma || hw.includes(strippedLemma) || (strippedLemma.length >= 3 && hw.slice(-3) === strippedLemma.slice(-3))) {
          foundInHebrew = true;
          const posDiff = Math.abs((i / arTokens.length) - (j / rawHebrewWords.length));
          s += (1500 - posDiff * 800);
          break;
        }
      }
      
      if (foundInHebrew && s > bestScore) {
        bestScore = s;
        best = { sid: cand.sid, lemma };
      } else if (!foundInHebrew && s > bestScore && s > 1500) {
        bestScore = s;
        best = { sid: cand.sid, lemma };
      }
    }
    
    const rowId = crypto.randomUUID();
    const pos = i + 1;
    let strongVal = 'NULL';
    let origVal = "'---'";
    
    if (best) {
      linkedTargetWords++;
      strongVal = `'${best.sid}'`;
      const origText = best.lemma || '---';
      origVal = `'${origText.replace(/'/g, "''")}'`;
    }
    
    const arVal = `'${raw.replace(/'/g, "''")}'`;
    sql += `INSERT INTO word_mappings (id, verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES ('${rowId}', '${v.id}', ${pos}, ${pos}, ${arVal}, ${origVal}, 'hebrew', ${strongVal}, 1);\n`;
  }
}

sql += '\nCOMMIT;\n';

fs.writeFileSync('scripts/apply_ot_critical_fixes.sql', sql, 'utf8');
console.log(`Generated SQL for ${totalTargetWords} words (${linkedTargetWords} linked) across ${targetVerses.length} verses.`);

console.log('Executing SQL against mobile/assets/bible_study.db...');
execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
console.log('Execution complete!');

// Verification of empty verses remaining in the entire database
const remainingZeroStrongs = q(`
  SELECT count(*) as cnt FROM (
    SELECT v.id
    FROM verses v
    JOIN word_mappings wm ON v.id = wm.verse_id
    GROUP BY v.id
    HAVING sum(CASE WHEN wm.strongs_id IS NOT NULL AND wm.strongs_id != '' THEN 1 ELSE 0 END) = 0
  );
`)[0].cnt;
console.log('>>> Verses in whole Bible with 0 Strongs IDs remaining:', remainingZeroStrongs);

// Verification of truncated verses (mapped words count in Gen 24:5, Isa 15:6-9, Dan 10:10)
const truncCheck = q(`
  SELECT v.book_id, v.chapter_num, v.verse_num, count(wm.id) as cnt
  FROM verses v
  JOIN word_mappings wm ON v.id = wm.verse_id
  WHERE (v.book_id = 1 AND v.chapter_num = 24 AND v.verse_num = 5)
     OR (v.book_id = 23 AND v.chapter_num = 15 AND v.verse_num IN (6,7,8,9))
     OR (v.book_id = 27 AND v.chapter_num = 10 AND v.verse_num = 10)
  GROUP BY v.id;
`);
console.log('Truncated verses now have words:', truncCheck);

// Verification of Psalm 119:1
const p119Check = q(`
  SELECT ar_word_position, ar_word, orig_word, strongs_id 
  FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 19 AND chapter_num = 119 AND verse_num = 1)
  ORDER BY ar_word_position;
`);
console.log('Psalm 119:1:');
p119Check.forEach(r => console.log(`  ${r.ar_word_position}. ${r.ar_word} -> ${r.orig_word} (${r.strongs_id || 'NULL'})`));

// Verification of Gen 35:1 word 18
const gen35Check = q(`
  SELECT ar_word_position, ar_word, orig_word, strongs_id 
  FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 1 AND chapter_num = 35 AND verse_num = 1) AND ar_word_position = 18;
`);
console.log('Gen 35:1 word 18:', gen35Check[0]);
