const { execFileSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  return execFileSync(sqlite, [db], { input: sql, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
}

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

console.log('=== Applying Comprehensive Fixes for v1.0.265 (Database v27) ===\n');

// --------------------------------------------------------------------------
// 1. SPECIFIC TARGETED CORRECTIONS
// --------------------------------------------------------------------------
console.log('1. Applying specific verse corrections...');

// A. Genesis 2:10 positions
console.log('  - Genesis 2:10 positions (نهر pos 1, يخرج pos 2)...');
const gen2_10 = q(`
  SELECT wm.id, wm.ar_word_position
  FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 1 AND v.chapter_num = 2 AND v.verse_num = 10;
`);
for (const r of gen2_10) {
  if (r.ar_word_position === 1) { // وَكَانَ
    runSql(`UPDATE word_mappings SET orig_word = '---', strongs_id = NULL, orig_word_position = NULL, relation_type = 'auxiliary_copula' WHERE id = '${r.id}';`);
  } else if (r.ar_word_position === 2) { // نَهْرٌ
    runSql(`UPDATE word_mappings SET orig_word_position = 1 WHERE id = '${r.id}';`);
  } else if (r.ar_word_position === 3) { // يَخْرُجُ
    runSql(`UPDATE word_mappings SET orig_word_position = 2, relation_type = 'participle_predicate' WHERE id = '${r.id}';`);
  }
}

// B. Exodus 1:14 (وفِي + positions of كل)
console.log('  - Exodus 1:14: "وفي" preposition fix & distinct positions of "كل"...');
const exo1_14 = q(`
  SELECT wm.id, wm.ar_word_position
  FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 2 AND v.chapter_num = 1 AND v.verse_num = 14;
`);
for (const r of exo1_14) {
  if (r.ar_word_position === 8) { // وَفِي
    runSql(`
      UPDATE word_mappings 
      SET orig_word = '---', strongs_id = NULL, orig_word_position = NULL,
          relation_type = 'preposition_particle',
          grammar_notes = 'واو العطف وباء الجر العبرية (וּבְ) ملحقة صدراً بالاسم'
      WHERE id = '${r.id}';
    `);
  } else if (r.ar_word_position === 9) { // كُلِّ الأولى
    runSql(`UPDATE word_mappings SET orig_word_position = 8, orig_word = 'כֹּל', strongs_id = 'H3605' WHERE id = '${r.id}';`);
  } else if (r.ar_word_position === 13) { // كُلِّ الثانية
    runSql(`UPDATE word_mappings SET orig_word_position = 12, orig_word = 'כֹּל', strongs_id = 'H3605', relation_type = 'repeated_referent' WHERE id = '${r.id}';`);
  }
}

// C. Exodus 18:5 (Jethro H3503, וامرأته, missing إلى موسى)
console.log('  - Exodus 18:5: Jethro H3503 and complete 16 words...');
const exo18_5_v = q("SELECT id FROM verses WHERE book_id = 2 AND chapter_num = 18 AND verse_num = 5;")[0];
const exo18_5_rows = [
  { pos: 1, ar: 'وَأَتَى', orig: 'בּוֹא', sid: 'H935', opos: 1, rel: null, notes: null },
  { pos: 2, ar: 'يَثْرُونُ', orig: 'יִתְרוֹ', sid: 'H3503', opos: 2, rel: null, notes: null },
  { pos: 3, ar: 'حَمُو', orig: 'חֹתֵן', sid: 'H2859', opos: 3, rel: null, notes: null },
  { pos: 4, ar: 'مُوسَى', orig: 'מֹשֶׁה', sid: 'H4872', opos: 4, rel: null, notes: null },
  { pos: 5, ar: 'وَابْنَاهُ', orig: 'בֵּן', sid: 'H1121', opos: 5, rel: null, notes: null },
  { pos: 6, ar: 'وَامْرَأَتُهُ', orig: 'אִשָּׁה', sid: 'H802', opos: 6, rel: null, notes: null },
  { pos: 7, ar: 'إِلَى', orig: 'אֶל', sid: 'H413', opos: 7, rel: null, notes: null },
  { pos: 8, ar: 'مُوسَى،', orig: 'מֹשֶׁה', sid: 'H4872', opos: 8, rel: 'repeated_referent', notes: 'ظهور ثانٍ لاسم العلم مطابق للأصل العبري' },
  { pos: 9, ar: 'إِلَى', orig: 'אֶל', sid: 'H413', opos: 9, rel: 'repeated_particle', notes: 'حرف جر متكرر' },
  { pos: 10, ar: 'الْبَرِّيَّةِ', orig: 'מִדְבָּר', sid: 'H4057', opos: 10, rel: null, notes: null },
  { pos: 11, ar: 'حَيْثُ', orig: 'אֲשֶׁר', sid: 'H834', opos: 11, rel: null, notes: null },
  { pos: 12, ar: 'كَانَ', orig: 'הָיָה', sid: 'H1961', opos: null, rel: 'auxiliary_copula', notes: 'فعل كينونة مقدر في الترجمة' },
  { pos: 13, ar: 'نَازِلاً', orig: 'חָנָה', sid: 'H2583', opos: 13, rel: 'participle_predicate', notes: null },
  { pos: 14, ar: 'عِنْدَ', orig: 'שָׁם', sid: 'H8033', opos: 14, rel: null, notes: null },
  { pos: 15, ar: 'جَبَلِ', orig: 'הַר', sid: 'H2022', opos: 15, rel: null, notes: null },
  { pos: 16, ar: 'اللهِ.', orig: 'אֱלֹהִים', sid: 'H430', opos: 16, rel: null, notes: null }
];
runSql(`DELETE FROM word_mappings WHERE verse_id = '${exo18_5_v.id}';`);
for (const r of exo18_5_rows) {
  runSql(`
    INSERT INTO word_mappings (id, verse_id, ar_word_position, ar_word, orig_word, orig_word_position, orig_word_lang, strongs_id, is_verified, relation_type, grammar_notes)
    VALUES ('${crypto.randomUUID()}', '${exo18_5_v.id}', ${r.pos}, '${r.ar}', '${r.orig}', ${r.opos === null ? 'NULL' : r.opos}, 'hebrew', ${r.sid ? `'${r.sid}'` : 'NULL'}, 1, ${r.rel ? `'${r.rel}'` : 'NULL'}, ${r.notes ? `'${r.notes}'` : 'NULL'});
  `);
}

// D. Numbers 4:5 (يأتي בוא H935, وينزلون ירד H3381, تابوت ארון H727)
console.log('  - Numbers 4:5: correct verbs & restored تابوت...');
const num4_5_v = q("SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 4 AND verse_num = 5;")[0];
const num4_5_rows = [
  { pos: 1, ar: 'يَأْتِي', orig: 'בּוֹא', sid: 'H935', opos: 1, rel: null, notes: null },
  { pos: 2, ar: 'هَارُونُ', orig: 'אַהֲרוֹן', sid: 'H175', opos: 2, rel: null, notes: null },
  { pos: 3, ar: 'وَبَنُوهُ', orig: 'בֵּן', sid: 'H1121', opos: 3, rel: null, notes: null },
  { pos: 4, ar: 'عِنْدَ', orig: '---', sid: null, opos: null, rel: 'preposition_particle', notes: 'أداة توقيت وظرفية' },
  { pos: 5, ar: 'ارْتِحَالِ', orig: 'נָסַע', sid: 'H5265', opos: 4, rel: null, notes: null },
  { pos: 6, ar: 'الْمَحَلَّةِ،', orig: 'מַחֲנֶה', sid: 'H4264', opos: 5, rel: null, notes: null },
  { pos: 7, ar: 'وَيُنَزِّلُونَ', orig: 'יָרַד', sid: 'H3381', opos: 6, rel: null, notes: 'فعل عبري بصيغة الحط والإنزال (الهفعيل من יָרַד)، يقابل وְהוֹרִדוּ' },
  { pos: 8, ar: 'حِجَابَ', orig: 'פָּרֹכֶת', sid: 'H6532', opos: 8, rel: null, notes: null },
  { pos: 9, ar: 'السَّجْفِ', orig: 'מָסָךְ', sid: 'H4541', opos: 9, rel: null, notes: null },
  { pos: 10, ar: 'وَيُغَطُّونَ', orig: 'כָּסָה', sid: 'H3680', opos: 10, rel: null, notes: null },
  { pos: 11, ar: 'بِهِ', orig: 'בָּהּ', sid: null, opos: 10, rel: 'pronominal_suffix', notes: 'ضمير متصل بحرف الجر (וְכִסּוּ־בָהּ)' },
  { pos: 12, ar: 'تَابُوتَ', orig: 'אֲרוֹן', sid: 'H727', opos: 12, rel: null, notes: null },
  { pos: 13, ar: 'الشَّهَادَةِ،', orig: 'עֵדוּת', sid: 'H5715', opos: 13, rel: null, notes: null }
];
runSql(`DELETE FROM word_mappings WHERE verse_id = '${num4_5_v.id}';`);
for (const r of num4_5_rows) {
  runSql(`
    INSERT INTO word_mappings (id, verse_id, ar_word_position, ar_word, orig_word, orig_word_position, orig_word_lang, strongs_id, is_verified, relation_type, grammar_notes)
    VALUES ('${crypto.randomUUID()}', '${num4_5_v.id}', ${r.pos}, '${r.ar}', '${r.orig}', ${r.opos === null ? 'NULL' : r.opos}, 'hebrew', ${r.sid ? `'${r.sid}'` : 'NULL'}, 1, ${r.rel ? `'${r.rel}'` : 'NULL'}, ${r.notes ? `'${r.notes}'` : 'NULL'});
  `);
}

// E. Numbers 1:46 (exact 8 words, removed initial interpolation)
console.log('  - Numbers 1:46: exact 8 words...');
const num1_46_v = q("SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 1 AND verse_num = 46;")[0];
const num1_46_rows = [
  { pos: 1, ar: 'سِتَّ', orig: 'שֵׁשׁ', sid: 'H8337', opos: 4 },
  { pos: 2, ar: 'مِئَةِ', orig: 'מֵאָה', sid: 'H3967', opos: 5 },
  { pos: 3, ar: 'أَلْفٍ', orig: 'אֶלֶף', sid: 'H505', opos: 6 },
  { pos: 4, ar: 'وَثَلاَثَةَ', orig: 'שָׁלוֹשׁ', sid: 'H7969', opos: 7 },
  { pos: 5, ar: 'آلاَفٍ', orig: 'אֶלֶף', sid: 'H505', opos: 8 },
  { pos: 6, ar: 'وَخَمْسَ', orig: 'חָמֵשׁ', sid: 'H2568', opos: 9 },
  { pos: 7, ar: 'مِئَةٍ', orig: 'מֵאָה', sid: 'H3967', opos: 10 },
  { pos: 8, ar: 'وَخَمْسِينَ.', orig: 'חֲמִשִּׁים', sid: 'H2572', opos: 11 }
];
runSql(`DELETE FROM word_mappings WHERE verse_id = '${num1_46_v.id}';`);
for (const r of num1_46_rows) {
  runSql(`
    INSERT INTO word_mappings (id, verse_id, ar_word_position, ar_word, orig_word, orig_word_position, orig_word_lang, strongs_id, is_verified, relation_type, grammar_notes)
    VALUES ('${crypto.randomUUID()}', '${num1_46_v.id}', ${r.pos}, '${r.ar}', '${r.orig}', ${r.opos}, 'hebrew', '${r.sid}', 1, NULL, NULL);
  `);
}

// F. Numbers 10:10 (remove extra 'يوم' before أعيادكم)
console.log('  - Numbers 10:10: exact 21 words matching text...');
const num10_10_v = q("SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 10 AND verse_num = 10;")[0];
const num10_10_raw = q(`SELECT * FROM word_mappings WHERE verse_id = '${num10_10_v.id}' ORDER BY ar_word_position;`);
// If 22 items, item at pos 5 was the extra 'يوم'
if (num10_10_raw.length === 22) {
  const filtered = num10_10_raw.filter((_, idx) => idx !== 4); // remove 5th item
  runSql(`DELETE FROM word_mappings WHERE verse_id = '${num10_10_v.id}';`);
  const vWords = "وَفِي يَوْمِ فَرَحِكُمْ، وَفِي أَعْيَادِكُمْ وَرُؤُوسِ شُهُورِكُمْ، تَضْرِبُونَ بِالأَبْوَاقِ عَلَى مُحْرَقَاتِكُمْ وَذَبَائِحِ سَلاَمَتِكُمْ، فَتَكُونُ لَكُمْ تَذْكَارًا أَمَامَ إِلهِكُمْ. أَنَا الرَّبُّ إِلهُكُمْ».".split(/\s+/);
  for (let i = 0; i < filtered.length; i++) {
    const item = filtered[i];
    const pos = i + 1;
    const arWord = vWords[i] || item.ar_word;
    runSql(`
      INSERT INTO word_mappings (id, verse_id, ar_word_position, ar_word, orig_word, orig_word_position, orig_word_lang, strongs_id, is_verified, relation_type, grammar_notes)
      VALUES ('${crypto.randomUUID()}', '${num10_10_v.id}', ${pos}, '${arWord}', '${item.orig_word}', ${item.orig_word_position || 'NULL'}, 'hebrew', ${item.strongs_id ? `'${item.strongs_id}'` : 'NULL'}, 1, ${item.relation_type ? `'${item.relation_type}'` : 'NULL'}, ${item.grammar_notes ? `'${item.grammar_notes}'` : 'NULL'});
    `);
  }
}

// G. Numbers 10:33 (restoring وتابوت)
console.log('  - Numbers 10:33: restored وتابوت (18 words total)...');
const num10_33_v = q("SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 10 AND verse_num = 33;")[0];
const num10_33_vWords = "فَارْتَحَلُوا مِنْ جَبَلِ الرَّبِّ مَسِيرَةَ ثَلاَثَةِ أَيَّامٍ، وَتَابُوتُ عَهْدِ الرَّبِّ رَاحِلٌ أَمَامَهُمْ مَسِيرَةَ ثَلاَثَةِ أَيَّامٍ لِيَلْتَمِسَ لَهُمْ مَنْزِلاً.".split(/\s+/);
const num10_33_rows = [
  { pos: 1, orig: 'נָסַע', sid: 'H5265', opos: 1 },
  { pos: 2, orig: 'מִן', sid: 'H4480', opos: 2 },
  { pos: 3, orig: 'הַר', sid: 'H2022', opos: 3 },
  { pos: 4, orig: 'יְהֹוָה', sid: 'H3068', opos: 4 },
  { pos: 5, orig: 'מַסָּע', sid: 'H4550', opos: 5 },
  { pos: 6, orig: 'שָׁלוֹשׁ', sid: 'H7969', opos: 6 },
  { pos: 7, orig: 'יוֹם', sid: 'H3117', opos: 7 },
  { pos: 8, orig: 'אֲרוֹן', sid: 'H727', opos: 8 }, // وَتَابُوتُ
  { pos: 9, orig: 'בְּרִית', sid: 'H1285', opos: 9 },
  { pos: 10, orig: 'יְהֹוָה', sid: 'H3068', opos: 10 },
  { pos: 11, orig: 'נָסַע', sid: 'H5265', opos: 11 },
  { pos: 12, orig: 'פָּנִים', sid: 'H6440', opos: 12 },
  { pos: 13, orig: 'דֶּרֶךְ', sid: 'H1870', opos: 13 },
  { pos: 14, orig: 'שָׁלוֹשׁ', sid: 'H7969', opos: 14 },
  { pos: 15, orig: 'יוֹם', sid: 'H3117', opos: 15 },
  { pos: 16, orig: 'תּוּר', sid: 'H8446', opos: 16 },
  { pos: 17, orig: 'הֵם', sid: 'H1992', opos: 17 },
  { pos: 18, orig: 'מְנוּחָה', sid: 'H4496', opos: 18 }
];
runSql(`DELETE FROM word_mappings WHERE verse_id = '${num10_33_v.id}';`);
for (let i = 0; i < num10_33_rows.length; i++) {
  const r = num10_33_rows[i];
  const ar = num10_33_vWords[i];
  runSql(`
    INSERT INTO word_mappings (id, verse_id, ar_word_position, ar_word, orig_word, orig_word_position, orig_word_lang, strongs_id, is_verified, relation_type, grammar_notes)
    VALUES ('${crypto.randomUUID()}', '${num10_33_v.id}', ${r.pos}, '${ar}', '${r.orig}', ${r.opos}, 'hebrew', '${r.sid}', 1, NULL, NULL);
  `);
}

// --------------------------------------------------------------------------
// 2. GENERAL ALIGNMENT FOR ALL REMAINING HIGH-MATCH VERSES (>= 75% LCS)
// --------------------------------------------------------------------------
console.log('\n2. Processing remaining alignable verses across all books...');

function alignTokens(verseTokens, mappingTokens) {
  const n = verseTokens.length;
  const m = mappingTokens.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

  for (let i = 1; i <= n; i++) {
    const vWord = stripTashkeel(verseTokens[i - 1]);
    for (let j = 1; j <= m; j++) {
      const mWord = stripTashkeel(mappingTokens[j - 1]);
      if (vWord === mWord) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = n, j = m;
  const vToM = new Array(n).fill(-1);

  while (i > 0 && j > 0) {
    const vWord = stripTashkeel(verseTokens[i - 1]);
    const mWord = stripTashkeel(mappingTokens[j - 1]);
    if (vWord === mWord && dp[i][j] === dp[i - 1][j - 1] + 1) {
      vToM[i - 1] = j - 1;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return { vToM, matchCount: dp[n][m] };
}

const verses = q("SELECT id, book_id, chapter_num, verse_num, text_avd_ar FROM verses ORDER BY book_id, chapter_num, verse_num;");
let autoAlignedCount = 0;

for (let b = 1; b <= 66; b++) {
  const bookVerses = verses.filter(v => v.book_id === b);
  if (bookVerses.length === 0) continue;

  const bMappings = q(`
    SELECT wm.*
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
    mapByVerse.get(m.verse_id).push(m);
  }

  const deletes = [];
  const inserts = [];

  for (const v of bookVerses) {
    // Skip targets already handled
    if (b === 1 && v.chapter_num === 2 && v.verse_num === 10) continue;
    if (b === 2 && v.chapter_num === 1 && v.verse_num === 14) continue;
    if (b === 2 && v.chapter_num === 18 && v.verse_num === 5) continue;
    if (b === 4 && v.chapter_num === 1 && v.verse_num === 46) continue;
    if (b === 4 && v.chapter_num === 4 && v.verse_num === 5) continue;
    if (b === 4 && v.chapter_num === 10 && v.verse_num === 10) continue;
    if (b === 4 && v.chapter_num === 10 && v.verse_num === 33) continue;

    const vRawWords = v.text_avd_ar.split(/\s+/).filter(w => cleanPunct(w).length > 0);
    const vCleanWords = vRawWords.map(w => cleanPunct(w));
    const mList = mapByVerse.get(v.id) || [];
    const mCleanWords = mList.map(m => cleanPunct(m.ar_word)).filter(w => w.length > 0);

    // If already exact match in length and content, skip
    if (vCleanWords.length === mCleanWords.length) {
      let diff = false;
      for (let k = 0; k < vCleanWords.length; k++) {
        if (stripTashkeel(vCleanWords[k]) !== stripTashkeel(mCleanWords[k])) {
          diff = true; break;
        }
      }
      if (!diff) continue;
    }

    if (mList.length === 0) continue;

    const { vToM, matchCount } = alignTokens(vCleanWords, mCleanWords);
    const ratio = matchCount / Math.max(vCleanWords.length, mCleanWords.length);

    // Only align if strong match
    if (ratio < 0.75) continue;

    autoAlignedCount++;
    deletes.push(v.id);

    for (let i = 0; i < vRawWords.length; i++) {
      const pos = i + 1;
      const arWord = vRawWords[i];
      const mIdx = vToM[i];

      if (mIdx !== -1) {
        const m = mList[mIdx];
        inserts.push({
          id: m.id,
          verse_id: v.id,
          ar_word_position: pos,
          orig_word_position: m.orig_word_position,
          ar_word: arWord,
          orig_word: m.orig_word,
          orig_word_lang: m.orig_word_lang || (b <= 39 ? 'hebrew' : 'greek'),
          strongs_id: m.strongs_id,
          is_verified: m.is_verified,
          relation_type: m.relation_type,
          grammar_notes: m.grammar_notes
        });
      } else {
        // Unaligned word: inherit if duplicate in same verse or set as particle
        const wStrip = stripTashkeel(vCleanWords[i]);
        const donor = mList.find(m => stripTashkeel(m.ar_word) === wStrip);

        let orig = '---';
        let origPos = null;
        let origLang = b <= 39 ? 'hebrew' : 'greek';
        let sid = null;
        let verified = 1;
        let rel = 'repeated_token';
        let notes = 'كلمة مكررة في سياق الآية تم استرجاعها لضبط المطابقة التامة مع نص الترجمة';

        if (donor && donor.strongs_id && donor.orig_word && donor.orig_word !== '---') {
          orig = donor.orig_word;
          origPos = donor.orig_word_position;
          origLang = donor.orig_word_lang || origLang;
          sid = donor.strongs_id;
          verified = donor.is_verified;
          rel = donor.relation_type || 'repeated_referent';
          notes = donor.grammar_notes || 'ظهور ثانٍ للفظ في سياق الآية مطابق للأصل اللغوي';
        } else if (wStrip === 'كان' || wStrip === 'وكانت' || wStrip === 'يكن') {
          rel = 'auxiliary_copula';
          notes = 'فعل كينونة مقدر في الترجمة لاستقامة التركيب';
        } else if (wStrip === 'في' || wStrip === 'من' || wStrip === 'الى' || wStrip === 'على') {
          rel = 'preposition_particle';
          notes = 'حرف جر رابط في الترجمة العربية';
        }

        inserts.push({
          id: crypto.randomUUID(),
          verse_id: v.id,
          ar_word_position: pos,
          orig_word_position: origPos,
          ar_word: arWord,
          orig_word: orig,
          orig_word_lang: origLang,
          strongs_id: sid,
          is_verified: verified,
          relation_type: rel,
          grammar_notes: notes
        });
      }
    }
  }

  if (deletes.length > 0) {
    console.log(`Book ${b}: realigned ${deletes.length} verses (${inserts.length} tokens)...`);
    const sql = ['BEGIN TRANSACTION;'];
    for (const vId of deletes) {
      sql.push(`DELETE FROM word_mappings WHERE verse_id = '${vId}';`);
    }
    const escape = s => s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;
    for (const ins of inserts) {
      sql.push(`
        INSERT INTO word_mappings (
          id, verse_id, ar_word_position, orig_word_position,
          ar_word, orig_word, orig_word_lang, strongs_id,
          is_verified, relation_type, grammar_notes
        ) VALUES (
          ${escape(ins.id)}, ${escape(ins.verse_id)}, ${ins.ar_word_position},
          ${ins.orig_word_position === null ? 'NULL' : ins.orig_word_position},
          ${escape(ins.ar_word)}, ${escape(ins.orig_word)}, ${escape(ins.orig_word_lang)},
          ${escape(ins.strongs_id)}, ${ins.is_verified}, ${escape(ins.relation_type)},
          ${escape(ins.grammar_notes)}
        );
      `);
    }
    sql.push('COMMIT;');
    runSql(sql.join('\n'));
  }
}

console.log(`\nAuto-alignment complete for ${autoAlignedCount} additional verses.`);

// --------------------------------------------------------------------------
// 3. INTEGRITY & VACUUM
// --------------------------------------------------------------------------
console.log('\n3. Integrity Check & VACUUM...');
const check = q('PRAGMA integrity_check;');
console.log('Integrity check:', check);

runSql('VACUUM;');
console.log('VACUUM complete.');

const stats = {
  total_mappings: q('SELECT count(*) as c FROM word_mappings;')[0].c,
  grammar_notes_count: q('SELECT count(*) as c FROM word_mappings WHERE grammar_notes IS NOT NULL;')[0].c,
  relation_type_count: q('SELECT count(*) as c FROM word_mappings WHERE relation_type IS NOT NULL;')[0].c,
  zero_orig_positions_with_strongs: q(`
    SELECT count(*) as c FROM word_mappings 
    WHERE (orig_word_position <= 0 OR orig_word_position IS NULL) 
      AND strongs_id IS NOT NULL AND strongs_id != '---' AND strongs_id != '';
  `)[0].c
};
console.log('Final Stats:', stats);
