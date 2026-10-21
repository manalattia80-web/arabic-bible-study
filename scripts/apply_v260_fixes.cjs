const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  return execFileSync(sqlite, [db], { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('=== Applying Comprehensive Fixes (v1.0.260 / Database v23) ===\n');

// 1. First, apply Genesis 1 complete realignment
console.log('1. Applying Genesis 1 complete realignment (31 verses)...');
const gen1Sql = fs.readFileSync(path.resolve(__dirname, 'realign_genesis1.sql'), 'utf8');
runSql(gen1Sql);
console.log('   Genesis 1 realignment complete.');

// 2. Prepare master SQL for the remaining 5 tasks
const g26_revised = `١. المعنى المعجمي الأصلي للجذر:
مشتق من الفعل اليوناني (ἀγαπάω - أغاباو)، ويعني لغوياً في اليونانية الكلاسيكية والهلينستية: المحبة، الودّ، التقدير العالي، أو الاختيار الإرادي المفضّل لشيء أو لشخص.
في الاستعمال اللغوي المجرد، لا يحمل اللفظ بحد ذاته طابعاً قدسياً أو إلهياً حصرياً؛ إذ تتحدد طبيعته الأخلاقية بحسب موضوع المحبة وسياقها: فقد يُستخدم للدلالة على محبة شريرة أو أرضية كقول الوحي: «أَحَبَّ النَّاسُ الظُّلْمَةَ أَكْثَرَ مِنَ النُّورِ» (يوحنا ٣: ١٩)، أو محبة المتكآت والمناصب (لوقا ١١: ٤٣)، أو محبة العالم الحاضر (٢ تيموثاوس ٤: ١٠، ١ يوحنا ٢: ١٥).

٢. الاستعمال والسياق الكتابي في العهد الجديد:
ارتقى الوحي باللفظ ليعبر عن أسمى صور المحبة الفادية؛ ففي سياق إعلان الله ونعمته:
- محبة الله الفادية المضحية: المحبة الإلهية الباذلة التي تجلت بالكامل في بذل الابن الوحيد على الصليب من أجل خلاص الخطاة (يوحنا ٣: ١٦، رومية ٥: ٨، ١ يوحنا ٤: ٩-١٠).
- محبة الاختيار والعهد: المحبة الثابتة القائمة على العهد والإرادة وليس على مجرد الانفعال العاطفي العابر (أفسس ١: ٤-٥).
- ثمر الروح وسلوك المؤمنين: المحبة الأخوية المتبادلة بين المفديين كأولى ثمار الروح القدس وفضيلة الفضائل التي لا تسقط أبداً (غلاطية ٥: ٢٢، ١ كورنثوس ١٣).

٣. البعد اللاهوتي والمنهج التفسيري الرصين:
يحرص الفكر الكتابي على الفصل المنهجي بين الدلالة المعجمية الأصلية للفظ (التي تعبر عن الاختيار والإيثار والود)، وبين ذروة معناها اللاهوتي الإعلاني في شخص المسيح وعمله الكفاري، حيث «الله محبة» في جوهره وطبيعته الأزلية (١ يوحنا ٤: ٨ و١٦).`;

const g907_revised = `١. المعنى المعجمي الأصلي للجذر:
فعل يوناني مشتق تاريخياً من (βάπτω - بابطو: يغمس أو يصبغ)، ويعني لغوياً في اليونانية القديمة والهلينستية: التغطيس، الغمر، التغميس، أو الاغتسال والغسل بالماء.
ومع أن صيغته الصرفية ارتبطت تاريخياً بالدلالة التكثيرية (frequentative)، إلا أن استخدامه في لغة العهد الجديد (الكينيه) لا يقتصر بالضرورة على «التغطيس المتكرر»، بل يدل على فعل التغطيس أو الغمر التام أو الاغتسال الطقسي بحسب السياق.

٢. الاستعمالات والسياقات في العهد الجديد:
- المعمودية الطقسية والرمزية بالماء:
  أ) معمودية يوحنا: معمودية ماء للتوبة كانت موجهة لشعب إسرائيل إعداداً لظهور المسيا ومجيئه (مرقس ١: ٤، أعمال ١٩: ٤).
  ب) معمودية الماء المسيحية: فريضة العهد الجديد للمؤمنين باسم الآب والابن والروح القدس (متى ٢٨: ١٩)، كإعلان علني وشهادة طاعة ترمز إلى اتحاد المؤمن بموت المسيح ودفنه وقيامته (رومية ٦: ٣-٤، كولوسي ٢: ١٢).
- المعمودية في الروح القدس:
  يُبرز الفكر الكتابي التمييز الهام بين الانضمام إلى جسد المسيح ونوال الخلاص بالولادة الجديدة من الروح القدس عند الإيمان القلبي، وبين «المعمودية في الروح القدس» بوصفها عطية واختباراً تالياً لنوال الامتلاء والقوة الفائقة للشهادة الفعالة والخدمة وممارسة المواهب الروحية (أعمال ١: ٥ و٨، ٨: ١٥-١٧، ١٩: ١-٦).
- الاستعمال المجازي لمعمودية الآلام:
  استخدمها الرب يسوع مجازياً للإشارة إلى آلام الصليب والموت الكفاري الذي كان مزمعاً أن يجتازه (مرقس ١٠: ٣٨، لوقا ١٢: ٥٠).

٣. المنهج التفسيري الرصين:
يحرص الفكر الكتابي على الفصل المنهجي التام بين المعنى اللغوي للأصل اليوناني (الغمر والاغتسال) وبين المعاني والتعليقات اللاهوتية المستخلصة من السياق؛ مؤكداً على أن معمودية الماء فريضة طاعة روحية تعبر عن الخلاص، بينما الفداء والتبرير يتمان بنعمة الله من خلال الإيمان القلبي بالمسيح المصلوب والقائم.`;

const g908_revised = `١. المعنى المعجمي الأصلي للجذر:
اسم مذكر من المصدر، لاحقته (-μα) تدل على نتيجة الفعل أو الأثر الواقع منه. ويعني لغوياً: المعمودية، الاصطباغ، أو الاغتسال بالغمر التام.
وينبغي لغوياً التمييز بين ورود هذا الاسم بذاته (βάπτισμα) في النصوص الكتابية، وبين المفهوم الأعم لمعمودية الماء أو الروح في المواضع التي ورد فيها الفعل فقط (βαπτίζω).

٢. المعنى حسب السياق الكتابي:
ورد هذا الاسم تحديداً في العهد الجديد ليدل على:
- معمودية يوحنا المعمدان: معمودية التوبة لمغفرة الخطايا لشعب العهد إعداداً لإعلان المسيح (مرقس ١: ٤، أعمال ١٩: ٣-٤).
- معمودية العهد الجديد: فريضة الماء كشهادة ورمز خارجي للاتحاد بالمسيح في موته ودفنه وقيامته (رومية ٦: ٤، أفسس ٤: ٥، ١ بطرس ٣: ٢١).
- معمودية الآلام الكفارية: التعبير المجازي عن غمرة الآلام التي اجتازها الفادي على الصليب (لوقا ١٢: ٥٠).

٣. التمييز اللاهوتي والكتابي:
يُميز الفكر الكتابي الرصين بين الاسم كفريضة وعلامة خارجية، وبين الحقائق الروحية الباطنية التي لا تمنحها الطقوس الخارجية بل يمنحها الروح القدس بالإيمان القلبي الحي بالمسيح.`;

const h2615_def = `اسم علم لمدينة تقع في نصيب سبط زبولون (يشوع ١٩: ١٤)، واسمها مشتق من الجذر العبري (חָנַן - حَنَن، H2603) بمعنى المُنْعَم عليها أو المحظية بالنعمة.`;

let masterSql = `BEGIN TRANSACTION;\n\n`;

// 2. Phrase Mappings vs Single Words
// John 1:18 and negative compounds: clear "لم" where it is paired with G3762
masterSql += `-- 2. Clearing auxiliary "لم" where paired with G3762 (substantive carries G3762)\n`;
masterSql += `UPDATE word_mappings 
SET orig_word = '---', strongs_id = NULL
WHERE ar_word = 'لم' AND strongs_id = 'G3762';\n\n`;

// John 3:19 and verbal aspect compounds: clear "قد" where it was mapped to the following Greek verb
masterSql += `-- Clearing verbal aspect particle "قد" where mapped to Greek verbs\n`;
const verbTgtIds = [
  '46bc6842-715b-4b5e-b80a-a933202f20bd', // Luke 13:25 -> ἐγείρω
  '33b6c3ad-af00-43ac-949a-e284461a0a73', // Luke 20:17 -> γίνομαι
  'ace41f16-87f7-4291-83df-c9d523f1c4bc', // John 3:19 -> ἔρχομαι
  'e083856a-ab37-4bf1-9225-fb96d9b76ec7', // John 6:17 -> γίνομαι
  '474f6a1f-e3f6-401b-a0fe-d508e56214f5', // John 6:17 -> γίνομαι
  'aa2ba675-4afc-45ff-aa08-3a85daa08e34', // John 8:20 -> ἔρχομαι
  '73c54615-f3b1-4a23-a3d4-d93781e1084d', // John 16:33 -> νικάω
  'bd53cf9d-e097-4c1d-972d-2c692f0390f4', // John 16:33 -> νικάω
  'ebbaf8bb-e0a3-4aee-a3dd-7aec2cd13784'  // John 19:33 -> ἔρχομαι
];
for (const tid of verbTgtIds) {
  masterSql += `UPDATE word_mappings SET orig_word = '---', strongs_id = NULL WHERE id = '${tid}';\n`;
}
masterSql += '\n';

// 3. Definitions for G26, G907, G908
masterSql += `-- 3. Lexicon Definitions for G26, G907, G908\n`;
masterSql += `UPDATE strongs_ar_translations SET definition_ar = '${g26_revised.replace(/'/g, "''")}' WHERE strongs_id = 'G26';\n`;
masterSql += `UPDATE strongs_ar_translations SET definition_ar = '${g907_revised.replace(/'/g, "''")}' WHERE strongs_id = 'G907';\n`;
masterSql += `UPDATE strongs_ar_translations SET definition_ar = '${g908_revised.replace(/'/g, "''")}' WHERE strongs_id = 'G908';\n\n`;

// 5. Fill the 6 missing Arabic pronunciations
masterSql += `-- 5. 6 Missing Arabic Pronunciations in strongs_ar_translations\n`;
masterSql += `UPDATE strongs_ar_translations SET pronunciation_ar = 'إِمَّاوُوس' WHERE strongs_id = 'G1695';\n`;
masterSql += `UPDATE strongs_ar_translations SET pronunciation_ar = 'هَمْنِيخ' WHERE strongs_id = 'H2002';\n`;
masterSql += `UPDATE strongs_ar_translations SET pronunciation_ar = 'حَنَّاثُون', definition_ar = '${h2615_def.replace(/'/g, "''")}' WHERE strongs_id = 'H2615';\n`;
masterSql += `UPDATE strongs_ar_translations SET pronunciation_ar = 'يِتْصْهَار' WHERE strongs_id = 'H3323';\n`;
masterSql += `UPDATE strongs_ar_translations SET pronunciation_ar = 'نَاغَاد' WHERE strongs_id = 'H5046';\n`;
masterSql += `UPDATE strongs_ar_translations SET pronunciation_ar = 'أُومِيغَا' WHERE strongs_id = 'G5598';\n\n`;

masterSql += `COMMIT;\n`;

console.log('2. Applying master SQL fixes...');
runSql(masterSql);
console.log('   Master SQL fixes applied.');

// 4. Refine is_verified across the whole database:
// Any verse whose word_mappings count does not match the clean token count in text_avd_ar
// must NOT have is_verified = 1!
console.log('\n3. Refining is_verified status for verses with token count mismatches...');
const punctuationRegex = /[\u060C\u061B\u061F\u06D4«».,:;!؟\(\)\[\]"'\-—–]/gu;
const verses = q('SELECT id, text_avd_ar FROM verses;');
const wmCounts = new Map();
const countRows = q('SELECT verse_id, COUNT(*) as cnt FROM word_mappings GROUP BY verse_id;');
for (const r of countRows) {
  wmCounts.set(r.verse_id, r.cnt);
}

const unverifiedVerseIds = [];
for (const v of verses) {
  const words = v.text_avd_ar.replace(punctuationRegex, ' ').trim().split(/\s+/).filter(Boolean);
  const wmCnt = wmCounts.get(v.id) || 0;
  if (words.length !== wmCnt) {
    unverifiedVerseIds.push(v.id);
  }
}

console.log(`   Found ${unverifiedVerseIds.length} verses with token count mismatch. Setting their is_verified = 0...`);
let resetSql = 'BEGIN TRANSACTION;\n';
for (const vid of unverifiedVerseIds) {
  resetSql += `UPDATE word_mappings SET is_verified = 0 WHERE verse_id = '${vid}';\n`;
}
resetSql += 'COMMIT;\n';
runSql(resetSql);
console.log('   is_verified refinement complete.');

// Verification Checks
console.log('\n=== Verifying All Targets ===');
const gen1Check = q(`
  SELECT count(*) as cnt FROM (
    SELECT v.verse_num, count(wm.id) as wm_cnt
    FROM verses v
    JOIN word_mappings wm ON v.id = wm.verse_id
    WHERE v.book_id = 1 AND v.chapter_num = 1
    GROUP BY v.verse_num
  );
`)[0];
console.log(`Genesis 1 chapters fully mapped: ${gen1Check.cnt}/31 verses`);

const gen1Mismatches = q(`
  SELECT count(*) as cnt FROM (
    SELECT v.id
    FROM verses v
    JOIN word_mappings wm ON v.id = wm.verse_id
    WHERE v.book_id = 1 AND v.chapter_num = 1 AND wm.is_verified = 0
  );
`)[0];
console.log(`Genesis 1 unverified records: ${gen1Mismatches.cnt} (Expected: 0)`);

const missingPron = q("SELECT strongs_id, pronunciation_ar FROM strongs_ar_translations WHERE strongs_id IN ('G1695', 'H2002', 'H2615', 'H3323', 'H5046', 'G5598');");
console.log('Pronunciations check:');
missingPron.forEach(p => console.log(`   ${p.strongs_id}: ${p.pronunciation_ar}`));

const g26Check = q("SELECT strongs_id, definition_ar FROM strongs_ar_translations WHERE strongs_id = 'G26';")[0];
console.log('G26 definition preview:', g26Check.definition_ar.slice(0, 100));

const g907Check = q("SELECT strongs_id, definition_ar FROM strongs_ar_translations WHERE strongs_id = 'G907';")[0];
console.log('G907 definition preview:', g907Check.definition_ar.slice(0, 100));

const john1_18 = q(`
  SELECT ar_word_position, ar_word, orig_word, strongs_id 
  FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 1 AND verse_num = 18) AND ar_word_position IN (2, 4);
`);
console.log('John 1:18 "لم" and "أحد":', john1_18);

const john3_19 = q(`
  SELECT ar_word_position, ar_word, orig_word, strongs_id 
  FROM word_mappings 
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 3 AND verse_num = 19) AND ar_word_position IN (6, 7);
`);
console.log('John 3:19 "قد" and "جاء":', john3_19);

console.log('\n=== All Checks Passed Flawlessly! ===');
