const { execFileSync } = require('child_process');
const path = require('path');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  return execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
}

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('=== Applying Precision Updates (v1.0.259 / Database v22) ===\n');

// Reformulated G907 & G908 definitions honoring the distinction
const g907_revised = `١. المعنى المعجمي الأصلي للجذر: مشتق من الفعل اليوناني (βάπτω - بابطو) الذي يعني الغمس، الصبغ، أو التغطيس الكامل في سائل. ويأتي الفعل بصيغته هذه ليدل على التغطيس المتكرر أو الغمر والتغميس التام حتى الإحاطة الكاملة.
٢. الاستعمالات والسياقات في العهد الجديد:
- المعمودية الطقسية والرمزية بالماء:
  أ) معمودية يوحنا: معمودية ماء للتوبة كانت موجهة لشعب إسرائيل إعداداً لظهور المسيا ومجيئه (مرقس ١: ٤، أعمال ١٩: ٤).
  ب) معمودية الماء المسيحية: فريضة العهد الجديد للمؤمنين باسم الآب والابن والروح القدس (متى ٢٨: ١٩)، كإعلان علني وشهادة طاعة ترمز إلى اتحاد المؤمن بموت المسيح ودفنه وقيامته (رومية ٦: ٣-٤، كولوسي ٢: ١٢).
- المعمودية في الروح القدس:
  يُبرز الفكر الكتابي التمييز الهام بين الانضمام إلى جسد المسيح ونوال الخلاص بالولادة الجديدة من الروح القدس عند الإيمان القلبي، وبين «المعمودية في الروح القدس» بوصفها عطية واختباراً تالياً لنوال الامتلاء والقوة الفائقة للشهادة الفعالة والخدمة وممارسة المواهب الروحية (أعمال ١: ٥ و٨، ٨: ١٥-١٧، ١٩: ١-٦).
- الاستعمال المجازي لمعمودية الآلام:
  استخدمها الرب يسوع مجازياً للإشارة إلى آلام الصليب والموت الكفاري الذي كان مزمعاً أن يجتازه (مرقس ١٠: ٣٨، لوقا ١٢: ٥٠).
٣. المنهج التفسيري الرصين:
يحرص الفكر الكتابي على الفصل المنهجي بين المعنى اللغوي للأصل اليوناني وبين التطبيقات اللاهوتية المتنوعة، مع التأكيد على أن معمودية الماء فريضة طاعة روحية تعبر عن الخلاص، بينما الفداء والتبرير يتمان بنعمة الله من خلال الإيمان القلبي بالمسيح المصلوب والقائم.`;

const g908_revised = `١. المعنى المعجمي الأصلي للجذر: اسم مشتق من الفعل (βαπτίζω - بابتيزو)، ويعبر عن نتيجة فعل التغطيس أو الغمر الكامل، ويعني: المعمودية، الاصطباغ، أو الاغتسال بالغمر التام.
٢. المعنى حسب السياق الكتابي:
وردت الكلمة في أسفار العهد الجديد لتشمل أربعة أبعاد كتابية متمايزة:
- معمودية يوحنا المعمدان: معمودية التوبة لمغفرة الخطايا الخاصة بشعب العهد في إسرائيل إعداداً لملكوت الله وإعلان المسيح (مرقس ١: ٤، لوقا ٣: ٣).
- معمودية الماء للمؤمنين: الفريضة الخارجية التعبيرية التي يمارسها من قبلوا الإنجيل، علامة على دفن الإنسان العتيق والقيامة في جدة الحياة (رومية ٦: ٤، أفسس ٤: ٥، ١ بطرس ٣: ٢١).
- معمودية الروح القدس: يُميّز الفكر الكتابي الرصين بين اتحاد المؤمن بجسد المسيح بالولادة الجديدة عند لحظة الخلاص، وبين المعمودية في الروح القدس كاختبار تمكين وتأييد بالقوة الروحية للخدمة والشهادة (أعمال ١: ٥ و٨، لوقا ٢٤: ٤٩).
- معمودية الآلام الكفارية: تشبيه الآلام الرهيبة التي غمرت الفادي على الصليب بالمعمودية (لوقا ١٢: ٥٠).
٣. التمييز اللاهوتي والكتابي:
يُبرز الفكر الكتابي التمييز الدقيق بين مختلف المعموديات المذكورة في الوحي المقدس؛ مؤكداً على أن معمودية الماء هي شهادة خارجية للمؤمن المتبرر بالإيمان، وتعبير عن اتحاده القائم برب المجد يسوع المسيح.`;

const sql = `
BEGIN TRANSACTION;

-- 1. Acts 8:37 Refinements
-- "أنا" (pos 12) -> fused in verb πιστεύω
UPDATE word_mappings 
SET orig_word = '---', strongs_id = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 8 AND verse_num = 37) AND ar_word_position = 12;

-- "أنّ" (pos 14) -> syntactic complementizer
UPDATE word_mappings 
SET orig_word = '---', strongs_id = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 8 AND verse_num = 37) AND ar_word_position = 14;

-- "هو" (pos 17) -> Greek infinitive copula εἶναι (G1511)
UPDATE word_mappings 
SET orig_word = 'εἶναι', strongs_id = 'G1511'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 8 AND verse_num = 37) AND ar_word_position = 17;

-- 2. Daniel 2:4 Hebrew Beginning & Vocative Particle
-- "فكلّم" (pos 1) -> Hebrew root דָבַר (H1696)
UPDATE word_mappings 
SET orig_word = 'דָבַר', strongs_id = 'H1696', orig_word_lang = 'hebrew'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 1;

-- "الكلدانيون" (pos 2) -> Hebrew כַּשְׂדִּי (H3778)
UPDATE word_mappings 
SET orig_word = 'כַּשְׂדִּי', strongs_id = 'H3778', orig_word_lang = 'hebrew'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 2;

-- "الملك" (pos 3) -> Hebrew מֶלֶךְ (H4428)
UPDATE word_mappings 
SET orig_word = 'מֶלֶךְ', strongs_id = 'H4428', orig_word_lang = 'hebrew'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 3;

-- "بالارامية" (pos 4) -> Hebrew אֲרָמִית (H762)
UPDATE word_mappings 
SET orig_word = 'אֲרָמִית', strongs_id = 'H762', orig_word_lang = 'hebrew'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 4;

-- "ايها" (pos 6) -> Vocative particle, part of the addressed noun
UPDATE word_mappings 
SET orig_word = '---', strongs_id = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 6;

-- "الملك" (pos 7) -> Aramaic מֶלֶךְ / מַלְכָּא (H4430)
UPDATE word_mappings 
SET orig_word = 'מֶלֶךְ', strongs_id = 'H4430', orig_word_lang = 'aramaic'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 7;

-- 3. G907 and G908 Revised Definitions
UPDATE strongs_ar_translations 
SET definition_ar = '${g907_revised.replace(/'/g, "''")}'
WHERE strongs_id = 'G907';

UPDATE strongs_ar_translations 
SET definition_ar = '${g908_revised.replace(/'/g, "''")}'
WHERE strongs_id = 'G908';

COMMIT;
`;

console.log('Executing SQL...');
runSql(sql);
console.log('SQL executed successfully!');

// Verification
console.log('\n=== VERIFICATION ===');
console.log('Acts 8:37 words 12-19:');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 8 AND verse_num = 37) AND ar_word_position >= 12 ORDER BY ar_word_position"));

console.log('\nDaniel 2:4 words 1-7:');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id, orig_word_lang FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position <= 7 ORDER BY ar_word_position"));

console.log('\nG907 definition check for baptism in Holy Spirit:');
const g907Snippet = q("SELECT substr(definition_ar, instr(definition_ar, 'المعمودية في الروح القدس') - 5, 120) as snippet FROM strongs_ar_translations WHERE strongs_id = 'G907'");
console.log(g907Snippet[0].snippet);
