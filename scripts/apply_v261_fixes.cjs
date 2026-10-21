const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  return execFileSync(sqlite, [db], { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

function normalizeAr(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

const punctuationRegex = /[\u060C\u061B\u061F\u06D4«».,:;!؟\(\)\[\]"'\-—–]/gu;

console.log('=== Applying Comprehensive Fixes (v1.0.261 / Database v24) ===\n');

// 1. Genesis 2 complete realignment
console.log('1. Applying Genesis 2 complete realignment (25 verses)...');
const gen2Sql = fs.readFileSync(path.resolve(__dirname, 'realign_genesis2.sql'), 'utf8');
runSql(gen2Sql);
console.log('   Genesis 2 realignment applied successfully.');

// 2. Systematic recovery for Genesis 3-34
console.log('\n2. Systematically recovering dropped duplicate tokens in Genesis 3-34...');
const genVerses = q('SELECT id, chapter_num, verse_num, text_avd_ar FROM verses WHERE book_id = 1 AND chapter_num BETWEEN 3 AND 34 ORDER BY chapter_num, verse_num;');
const genMappings = q(`
  SELECT wm.verse_id, wm.ar_word_position, wm.ar_word, wm.orig_word, wm.orig_word_lang, wm.strongs_id, wm.is_verified 
  FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 1 AND v.chapter_num BETWEEN 3 AND 34 
  ORDER BY wm.verse_id, wm.ar_word_position;
`);

const vMap = new Map();
for (const m of genMappings) {
  if (!vMap.has(m.verse_id)) vMap.set(m.verse_id, []);
  vMap.get(m.verse_id).push(m);
}

let genRecoverySql = 'BEGIN TRANSACTION;\n';
let recoveredVersesCount = 0;
let recoveredTokensCount = 0;

for (const v of genVerses) {
  const tokens = v.text_avd_ar.replace(punctuationRegex, ' ').trim().split(/\s+/).filter(Boolean);
  const mappings = vMap.get(v.id) || [];
  if (tokens.length === mappings.length) continue;

  // Build dictionary of known mappings in this verse
  const tokenDict = new Map();
  for (const m of mappings) {
    const n = normalizeAr(m.ar_word);
    if (!tokenDict.has(n)) tokenDict.set(n, m);
  }

  genRecoverySql += `-- Gen ${v.chapter_num}:${v.verse_num}\n`;
  genRecoverySql += `DELETE FROM word_mappings WHERE verse_id = '${v.id}';\n`;

  let mIdx = 0;
  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    const n = normalizeAr(raw);
    let origWord = '---';
    let strongsId = 'NULL';
    let lang = 'hebrew';
    let isVer = 0;

    if (mIdx < mappings.length && normalizeAr(mappings[mIdx].ar_word) === n) {
      const cur = mappings[mIdx];
      origWord = cur.orig_word || '---';
      strongsId = cur.strongs_id ? `'${cur.strongs_id}'` : 'NULL';
      lang = cur.orig_word_lang || 'hebrew';
      isVer = cur.is_verified || 0;
      mIdx++;
    } else if (tokenDict.has(n)) {
      // Inherit mapping from the duplicate occurrence
      const prev = tokenDict.get(n);
      origWord = prev.orig_word || '---';
      strongsId = prev.strongs_id ? `'${prev.strongs_id}'` : 'NULL';
      lang = prev.orig_word_lang || 'hebrew';
      isVer = prev.is_verified || 0;
      recoveredTokensCount++;
    }

    const rowId = crypto.randomUUID();
    const pos = i + 1;
    const arVal = `'${raw.replace(/'/g, "''")}'`;
    const origVal = `'${origWord.replace(/'/g, "''")}'`;

    genRecoverySql += `INSERT INTO word_mappings (id, verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES ('${rowId}', '${v.id}', ${pos}, ${pos}, ${arVal}, ${origVal}, '${lang}', ${strongsId}, ${isVer});\n`;
  }
  recoveredVersesCount++;
}

genRecoverySql += 'COMMIT;\n';
runSql(genRecoverySql);
console.log(`   Recovered ${recoveredTokensCount} dropped tokens across ${recoveredVersesCount} verses in Genesis 3-34.`);

// 3. G908 gender fix
console.log('\n3. Correcting G908 grammatical gender to neuter noun...');
const g908_revised = `١. المعنى المعجمي الأصلي للجذر:
اسم محايد مشتق من الفعل (βαπτίζω - بابتيزو)، ويأتي بأداة المحايد اليونانية (τό)، ولاحقته (-μα) تدل على نتيجة الفعل أو الأثر الواقع منه. ويعني لغوياً: المعمودية، الاصطباغ، أو الاغتسال بالغمر التام.
وينبغي لغوياً التمييز بين ورود هذا الاسم المحايد بذاته (βάπτισμα) في النصوص الكتابية، وبين المفهوم الأعم في المواضع التي ورد فيها الفعل فقط (βαπτίζω).

٢. المعنى حسب السياق الكتابي للاسم:
ورد هذا الاسم تحديداً في العهد الجديد ليدل على:
- معمودية يوحنا المعمدان: معمودية التوبة لمغفرة الخطايا لشعب العهد إعداداً لإعلان المسيح (مرقس ١: ٤، أعمال ١٩: ٣-٤).
- معمودية العهد الجديد: فريضة الماء كشهادة ورمز خارجي للاتحاد بالمسيح في موته ودفنه وقيامته (رومية ٦: ٤، أفسس ٤: ٥، ١ بطرس ٣: ٢١).
- معمودية الآلام الكفارية: التعبير المجازي عن غمرة الآلام التي اجتازها الفادي على الصليب (لوقا ١٢: ٥٠).

٣. التمييز اللاهوتي والكتابي:
يُميز الفكر الكتابي الرصين بين الاسم كفريضة وعلامة خارجية، وبين الحقائق الروحية الباطنية التي لا تمنحها الطقوس الخارجية بل يمنحها الروح القدس بالإيمان القلبي الحي بالمسيح.`;

// 4. G26 separation of noun vs verb citations
console.log('\n4. Refining G26 definition (separating noun vs verb citations under linguistic family)...');
const g26_revised = `١. المعنى المعجمي الأصلي للاسم:
اسم مؤنث في اليونانية (ἡ ἀγάπη)، مشتق من الجذر اللغوي الذي ينتمي إليه الفعل (ἀγαπάω). يعني الاسم لغوياً في سياقاته التعبيرية: المحبة، الودّ، التقدير الفائق، أو الرابطة الإرادية الواعية.

٢. الاستعمال والسياق الكتابي للاسم في العهد الجديد:
ارتقى الوحي بالاسم المجرّد ليعبّر عن أسمى صور المحبة الفادية والعهدية:
- محبة الله الفادية المضحية: المحبة الإلهية الباذلة المتجلية في بذل الابن الوحيد والفداء على الصليب (رومية ٥: ٨، ١ يوحنا ٤: ٩-١٠).
- طبيعة الله وجوهره: إعلان الوحي الحاسم أن «الله محبة» في جوهره الأزلي (١ يوحنا ٤: ٨ و١٦).
- ثمر الروح وفضيلة الفضائل: المحبة الأخوية المتبادلة بين المفديين كأولى ثمار الروح القدس والرابطة الكاملة (غلاطية ٥: ٢٢، ١ كورنثوس ١٣، كولوسي ٣: ١٤).

٣. شواهد العائلة اللغوية (الفعل ἀγαπάω):
يُميز التدقيق المعجمي بين الاسم وشواهد الفعل المرتبط به اشتقاقياً؛ فالفعل في أصله اللغوي المجرد يعبر عن الميل والاختيار الإرادي المفضّل، وتتحدد طبيعته الأخلاقية بحسب موضوعه وسياقه:
- في الاستعمال الدنيوي أو المنحرف: ورد الفعل للدلالة على محبة الناس للظلمة بدلاً من النور (يوحنا ٣: ١٩)، أو محبة المتكآت والمناصب الرئاسية (لوقا ١١: ٤٣)، أو محبة العالم الحاضر الفاني (٢ تيموثاوس ٤: ١٠، ١ يوحنا ٢: ١٥).
- في الاستعمال الفادي: ورد الفعل في ذروة إعلان العهد الجديد لمبادرة الله بالخلاص: «هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ» (يوحنا ٣: ١٦).

٤. البعد اللاهوتي والمنهج التفسيري الرصين:
يحرص التفسير الكتابي المحافظ على التمييز بين الاسم بذاته بوصفه تعبيراً عن المحبة كفضيلة ورباط إلهي، وبين أفعال العائلة اللغوية، مؤكداً أن قداسة المحبة ومصدرها ينبعان من إعلان نعمة الله في المسيح يسوع.`;

let masterSql = `BEGIN TRANSACTION;\n\n`;

// G908 & G26 updates
masterSql += `UPDATE strongs_ar_translations SET definition_ar = '${g908_revised.replace(/'/g, "''")}' WHERE strongs_id = 'G908';\n`;
masterSql += `UPDATE strongs_ar_translations SET definition_ar = '${g26_revised.replace(/'/g, "''")}' WHERE strongs_id = 'G26';\n\n`;

// 5. Explanatory grammatical descriptions for auxiliary particles
masterSql += `-- Explanatory descriptions for auxiliary words\n`;
masterSql += `UPDATE word_mappings 
SET orig_word = 'دلالة نحوية تُفهم من صيغة الفعل', strongs_id = NULL
WHERE ar_word = 'قد' AND (orig_word = '---' OR orig_word = '-' OR orig_word LIKE '%ἔρχομαι%' OR orig_word LIKE '%νικάω%' OR orig_word LIKE '%γίνομαι%');\n\n`;

masterSql += `UPDATE word_mappings 
SET orig_word = 'جزء من تركيب عربي يقابل كلمة أصلية واحدة', strongs_id = NULL
WHERE ar_word = 'لم' AND (orig_word = '---' OR orig_word = '-' OR orig_word LIKE '%οὐδείς%');\n\n`;

masterSql += `COMMIT;\n`;

console.log('5. Executing master lexicon updates...');
runSql(masterSql);
console.log('   Lexicon updates executed successfully.');

// 6. Refine is_verified across database:
// Only fully complete verses (whose token count matches text_avd_ar exactly) can have is_verified = 1.
console.log('\n6. Updating is_verified across all verses...');
const allVerses = q('SELECT id, book_id, chapter_num, text_avd_ar FROM verses;');
const allWmCounts = q('SELECT verse_id, count(*) as cnt FROM word_mappings GROUP BY verse_id;');
const wmCountMap = new Map();
for (const r of allWmCounts) wmCountMap.set(r.verse_id, r.cnt);

const incompleteVerseIds = [];
const completeGenVerseIds = [];

for (const v of allVerses) {
  const words = v.text_avd_ar.replace(punctuationRegex, ' ').trim().split(/\s+/).filter(Boolean);
  const wmCnt = wmCountMap.get(v.id) || 0;
  if (words.length !== wmCnt) {
    incompleteVerseIds.push(v.id);
  } else if (v.book_id === 1 && (v.chapter_num === 1 || v.chapter_num === 2)) {
    completeGenVerseIds.push(v.id);
  }
}

console.log(`   Found ${incompleteVerseIds.length} verses with token count mismatch. Ensuring is_verified = 0...`);
let statusSql = 'BEGIN TRANSACTION;\n';
for (const id of incompleteVerseIds) {
  statusSql += `UPDATE word_mappings SET is_verified = 0 WHERE verse_id = '${id}';\n`;
}
for (const id of completeGenVerseIds) {
  statusSql += `UPDATE word_mappings SET is_verified = 1 WHERE verse_id = '${id}';\n`;
}
statusSql += 'COMMIT;\n';
runSql(statusSql);
console.log('   Verification audit complete.');

// Final Verification Checks
console.log('\n=== Final Verifications ===');
const gen1Cnt = q("SELECT count(*) as cnt FROM (SELECT v.id FROM verses v JOIN word_mappings wm ON v.id = wm.verse_id WHERE v.book_id = 1 AND v.chapter_num = 1 GROUP BY v.id HAVING wm.is_verified = 1);")[0].cnt;
const gen2Cnt = q("SELECT count(*) as cnt FROM (SELECT v.id FROM verses v JOIN word_mappings wm ON v.id = wm.verse_id WHERE v.book_id = 1 AND v.chapter_num = 2 GROUP BY v.id HAVING wm.is_verified = 1);")[0].cnt;
console.log(`Genesis 1 verified verses: ${gen1Cnt}/31`);
console.log(`Genesis 2 verified verses: ${gen2Cnt}/25`);

const g908_check = q("SELECT definition_ar FROM strongs_ar_translations WHERE strongs_id = 'G908';")[0].definition_ar;
console.log('G908 definition opening:', g908_check.split('\n')[1]);

const g26_check = q("SELECT definition_ar FROM strongs_ar_translations WHERE strongs_id = 'G26';")[0].definition_ar;
console.log('G26 definition opening:', g26_check.split('\n')[1]);

const gen2_5 = q(`
  SELECT ar_word_position, ar_word, orig_word, strongs_id 
  FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 1 AND chapter_num = 2 AND verse_num = 5) AND ar_word_position IN (2, 25);
`);
console.log('Genesis 2:5 target links (شجر -> H7880, كان -> H369):', gen2_5);

const john1_18 = q(`
  SELECT ar_word_position, ar_word, orig_word, strongs_id 
  FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 1 AND verse_num = 18) AND ar_word_position = 2;
`)[0];
console.log('John 1:18 "لم" explanatory note:', john1_18);

const john3_19 = q(`
  SELECT ar_word_position, ar_word, orig_word, strongs_id 
  FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 3 AND verse_num = 19) AND ar_word_position = 6;
`)[0];
console.log('John 3:19 "قد" explanatory note:', john3_19);

const remainingEmptyTranslit = q("SELECT count(*) as cnt FROM strongs_entries WHERE transliteration IS NULL OR trim(transliteration) = '';")[0].cnt;
console.log(`Remaining empty transliterations across Bible: ${remainingEmptyTranslit} (Expected: 0)`);

console.log('\n=== All Operations Executed Successfully! ===');
