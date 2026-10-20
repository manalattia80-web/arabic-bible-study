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

console.log('=== Applying v1.0.244 Fixes ===');

// 1. Definition for G5486 (χάρισμα)
const g5486_def = `١. المعنى المعجمي الأصلي للجذر: مشتقة من الكلمة اليونانية (χάρις - خاريس) التي تعني «النعمة»، واللاحقة (-μα) التي تدل على نتيجة الفعل أو التعبير العملي الملموس عنه، لتعني الكلمة حرفياً: «عطية مجانية نابعة من النعمة»، أو «هبة غير مستحقة»، أو «منحة إلهية كريمة».
٢. الاستعمالات الكتابية في العهد الجديد:
- الاستعمال الخلاصي الأساسي: تُستخدم الكلمة للإشارة إلى «هبة الله المجانية» للحياة الأبدية والفداء الكامل بالمسيح يسوع في مقابلة أجرة الخطية التي هي موت: «لأَنَّ أُجْرَةَ الْخَطِيَّةِ هِيَ مَوْتٌ، وَأَمَّا هِبَةُ اللهِ (χάρισμα) فَهِيَ حَيَاةٌ أَبَدِيَّةٌ بِالْمَسِيحِ يَسُوعَ رَبِّنَا» (رومية ٦: ٢٣، وأيضاً رومية ٥: ١٥-١٦).
- الاستعمال الخدمي والروحي (مواهب الخدمة): تُطلق الكلمة بصيغة الجمع والمفرد على المواهب والقدرات الروحية المتنوعة التي يمنحها الروح القدس بسيادته للمؤمنين كأعضاء في جسد المسيح (الكنيسة) لتمكينهم من الخدمة وبنيان الجماعة المقدسة (رومية ١٢: ٦، ١ كورنثوس ١: ٧، ١٢: ٤ و٩ و٢٨ و٣٠ و٣١، ١ بطرس ٤: ١٠).
٣. الأبعاد اللاهوتية والروحية بحسب الفكر الكتابي المحافظ:
تؤكد الكلمة أن كل ما يناله الإنسان من خلاص وشركة وخدمة في تدبير النعمة الحاضر هو منحة إلهية سيادية مطلقة لا فضل فيها لاستحقاق بشري أو لأعمال الناموس؛ فالخلاص هبة مجانية، ومواهب الخدمة عطايا مقدسة تُمارس بمحبة ونظام وتواضع لبنيان جسد المسيح حتى يوم مجيئه.`;

// 2. Definition for G907 (βαπτίζω)
const g907_def = `١. المعنى المعجمي الأصلي للجذر: مشتق من الفعل اليوناني (βάπτω - بابطو) الذي يعني الغمس، الصبغ، أو التغطيس الكامل في سائل. ويأتي الفعل بصيغته هذه ليدل على التغطيس المتكرر أو الغمر والتغميس التام حتى الإحاطة الكاملة.
٢. الاستعمالات والسياقات في العهد الجديد:
- المعمودية الطقسية والرمزية بالماء:
  أ) معمودية يوحنا: معمودية ماء للتوبة كانت موجهة لشعب إسرائيل إعداداً لظهور المسيا ومجيئه (مرقس ١: ٤، أعمال ١٩: ٤).
  ب) معمودية الماء المسيحية: فريضة العهد الجديد للمؤمنين باسم الآب والابن والروح القدس (متى ٢٨: ١٩)، كإعلان علني وشهادة طاعة ترمز إلى اتحاد المؤمن بموت المسيح ودفنه وقيامته (رومية ٦: ٣-٤، كولوسي ٢: ١٢).
- المعمودية الروحية (المعمودية بالروح القدس):
  عمل الروح القدس السيادي في تدبير النعمة الذي يعتمد به المؤمنون ويدخلون عضواً في جسد المسيح الواحد (الكنيسة): «لأَنَّنَا جَمِيعَنَا بِرُوحٍ وَاحِدٍ أَيْضاً اعْتَمَدْنَا إِلَى جَسَدٍ وَاحِدٍ» (١ كورنثوس ١٢: ١٣).
- الاستعمال المجازي لمعمودية الآلام:
  استخدمها الرب يسوع مجازياً للإشارة إلى آلام الصليب والموت الكفاري الذي كان مزمعاً أن يجتازه (مرقس ١٠: ٣٨، لوقا ١٢: ٥٠).
٣. المنهج التفسيري الرصين:
يحرص الفكر الكتابي المحافظ على الفصل المنهجي بين المعنى اللغوي للأصل اليوناني وبين التطبيقات اللاهوتية المتنوعة، مع التأكيد على أن معمودية الماء فريضة طاعة روحية تعبر عن الخلاص، بينما الفداء والتبرير يتمان بنعمة الله من خلال الإيمان القلبي بالمسيح المصلوب والقائم.`;

// 3. Definition for G908 (βάπτισμα)
const g908_def = `١. المعنى المعجمي الأصلي للجذر: اسم مشتق من الفعل (βαπτίζω - بابتيزو)، ويعبر عن نتيجة فعل التغطيس أو الغمر الكامل، ويعني: المعمودية، الاصطباغ، أو الاغتسال بالغمر التام.
٢. المعنى حسب السياق الكتابي:
وردت الكلمة في أسفار العهد الجديد لتشمل أربعة أبعاد كتابية متمايزة:
- معمودية يوحنا المعمدان: معمودية التوبة لمغفرة الخطايا الخاصة بشعب العهد في إسرائيل إعداداً لملكوت الله وإعلان المسيح (مرقس ١: ٤، لوقا ٣: ٣).
- معمودية الماء للمؤمنين: الفريضة الخارجية التعبيرية التي يمارسها من قبلوا الإنجيل، علامة على دفن الإنسان العتيق والقيامة في جدة الحياة (رومية ٦: ٤، أفسس ٤: ٥، ١ بطرس ٣: ٢١).
- معمودية الروح القدس: الحدث الإلهي الذي به اتحد المؤمنون في جسد المسيح الروحي (١ كورنثوس ١٢: ١٣).
- معمودية الآلام الكفارية: تشبيه الآلام الرهيبة التي غمرت الفادي على الصليب بالمعمودية (لوقا ١٢: ٥٠).
٣. التمييز اللاهوتي والكتابي:
يُبرز الفكر الكتابي المحافظ التمييز الدقيق بين مختلف المعموديات المذكورة في الوحي المقدس؛ مؤكداً على أن معمودية الماء هي شهادة خارجية للمؤمن المتبرر بالإيمان، وتعبير عن اتحاده القائم برب المجد يسوع المسيح.`;

console.log('Building SQL script...');

const sql = `
BEGIN TRANSACTION;

-- 1. Correct Systematic Typos in Lexicon
UPDATE strongs_ar_translations 
SET definition_ar = replace(definition_ar, 'ملكوحه', 'ملكوته')
WHERE definition_ar LIKE '%ملكوحه%';

UPDATE strongs_ar_translations 
SET definition_ar = replace(definition_ar, 'ملكون الأرض', 'ملكوت الله على الأرض')
WHERE definition_ar LIKE '%ملكون الأرض%';

UPDATE strongs_ar_translations 
SET definition_ar = replace(definition_ar, 'العميد بالروح القدس', 'المعمودية بالروح القدس')
WHERE definition_ar LIKE '%العميد بالروح القدس%';

-- 2. Update Lexical Definitions for G5486, G907, G908
UPDATE strongs_ar_translations 
SET definition_ar = '${g5486_def.replace(/'/g, "''")}'
WHERE strongs_id = 'G5486';

UPDATE strongs_ar_translations 
SET definition_ar = '${g907_def.replace(/'/g, "''")}'
WHERE strongs_id = 'G907';

UPDATE strongs_ar_translations 
SET definition_ar = '${g908_def.replace(/'/g, "''")}'
WHERE strongs_id = 'G908';

-- 3. Fix Acts 8:37 word mappings
UPDATE word_mappings 
SET orig_word = 'εἶπον', strongs_id = 'G2036'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 8 AND verse_num = 37) AND ar_word_position = 1;

UPDATE word_mappings 
SET orig_word = 'ἀποκρίνομαι', strongs_id = 'G611'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 8 AND verse_num = 37) AND ar_word_position = 10;

UPDATE word_mappings 
SET orig_word = 'εἶπον', strongs_id = 'G2036'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 8 AND verse_num = 37) AND ar_word_position = 11;

-- 4. Fix 2 Thess 2:7 word mappings
UPDATE word_mappings 
SET orig_word = '---', strongs_id = NULL
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 53 AND chapter_num = 2 AND verse_num = 7) AND ar_word_position = 8;

UPDATE word_mappings 
SET orig_word = 'ἄρτι', strongs_id = 'G737'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 53 AND chapter_num = 2 AND verse_num = 7) AND ar_word_position = 14;

-- 5. Fix Daniel 2:4 Aramaic word mappings
UPDATE word_mappings 
SET orig_word = 'עַד', strongs_id = 'H5705', orig_word_lang = 'aramaic'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 8;

UPDATE word_mappings 
SET orig_word = 'עָלַם', strongs_id = 'H5957', orig_word_lang = 'aramaic'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 9;

UPDATE word_mappings 
SET orig_word = 'עֲבַד', strongs_id = 'H5649', orig_word_lang = 'aramaic'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 11;

UPDATE word_mappings 
SET orig_word = 'חֵלֶם', strongs_id = 'H2493', orig_word_lang = 'aramaic'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 12;

UPDATE word_mappings 
SET orig_word = 'חֲוָא', strongs_id = 'H2324', orig_word_lang = 'aramaic'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 13;

UPDATE word_mappings 
SET orig_word = 'פְּשַׁר', strongs_id = 'H6591', orig_word_lang = 'aramaic'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position = 14;

-- 6. Fix Matthew 6:13 Van Dyck text token
UPDATE word_mappings 
SET ar_word = 'وَالْمَجْدَ'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 6 AND verse_num = 13) AND ar_word_position = 13;

-- 7. Fix Acts 2:4 Word Mappings
-- Reconstruct Acts 2:4 cleanly matching Van Dyck text and Textus Receptus:
-- وَامْتَلأَ الْجَمِيعُ مِنَ الرُّوحِ الْقُدُسِ، وَابْتَدَأُوا يَتَكَلَّمُونَ بِأَلْسِنَةٍ أُخْرَى كَمَا أَعْطَاهُمُ الرُّوحُ أَنْ يَنْطِقُوا.
DELETE FROM word_mappings 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4);

INSERT INTO word_mappings (id, verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES
('wm-act2-4-1', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 1, 1, 'وَامْتَلأَ', 'πληρόω', 'greek', 'G4137', 1),
('wm-act2-4-2', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 2, 2, 'الْجَمِيعُ', 'ἅπας', 'greek', 'G537', 1),
('wm-act2-4-3', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 3, 3, 'مِنَ', '---', 'greek', NULL, 1),
('wm-act2-4-4', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 4, 4, 'الرُّوحِ', 'πνεῦμα', 'greek', 'G4151', 1),
('wm-act2-4-5', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 5, 5, 'الْقُدُسِ،', 'ἅγιος', 'greek', 'G40', 1),
('wm-act2-4-6', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 6, 6, 'وَابْتَدَأُوا', 'ἄρχομαι', 'greek', 'G756', 1),
('wm-act2-4-7', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 7, 7, 'يَتَكَلَّمُونَ', 'λαλέω', 'greek', 'G2980', 1),
('wm-act2-4-8', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 8, 8, 'بِأَلْسِنَةٍ', 'γλῶσσα', 'greek', 'G1100', 1),
('wm-act2-4-9', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 9, 9, 'أُخْرَى', 'ἕτερος', 'greek', 'G2087', 1),
('wm-act2-4-10', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 10, 10, 'كَمَا', 'καθώς', 'greek', 'G2531', 1),
('wm-act2-4-11', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 11, 11, 'أَعْطَاهُمُ', 'δίδωμι', 'greek', 'G1325', 1),
('wm-act2-4-12', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 12, 12, 'الرُّوحُ', 'πνεῦμα', 'greek', 'G4151', 1),
('wm-act2-4-13', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 13, 13, 'أَنْ', '---', 'greek', NULL, 1),
('wm-act2-4-14', (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4), 14, 14, 'يَنْطِقُوا.', 'ἀποφθέγγομαι', 'greek', 'G669', 1);

-- 8. Complete Acts 15:40-41 in ALAB, KJV, NIV
UPDATE verses 
SET text_alab = 'أَمَّا بُولُسُ فَاخْتَارَ سِيلاَ وَسَافَرَ بَعْدَمَا اسْتَوْدَعَهُ الإِخْوَةُ نِعْمَةَ الرَّبِّ.',
    text_kjv = 'And Paul chose Silas, and departed, being recommended by the brethren unto the grace of God.',
    text_niv = 'but Paul chose Silas and left, commended by the believers to the grace of the Lord.'
WHERE book_id = 44 AND chapter_num = 15 AND verse_num = 40;

UPDATE verses 
SET text_alab = 'فَاجْتَازَ فِي سُورِيَّةَ وَقِيلِيقِيَّةَ يُشَدِّدُ الْكَنَائِسَ.',
    text_kjv = 'And he went through Syria and Cilicia, confirming the churches.',
    text_niv = 'He went through Syria and Cilicia, strengthening the churches.'
WHERE book_id = 44 AND chapter_num = 15 AND verse_num = 41;

-- 9. Fill the 15 end-of-chapter shifted verses in NIV
UPDATE verses SET text_niv = '“But so that we may not cause offense, go to the lake and throw out your line. Take the first fish you catch; open its mouth and you will find a four-drachma coin. Take it and give it to them for my tax and yours.”'
WHERE book_id = 40 AND chapter_num = 17 AND verse_num = 27;

UPDATE verses SET text_niv = '“This is how my heavenly Father will treat each of you unless you forgive your brother or sister from your heart.”'
WHERE book_id = 40 AND chapter_num = 18 AND verse_num = 35;

UPDATE verses SET text_niv = '“For I tell you, you will not see me again until you say, ‘Blessed is he who comes in the name of the Lord.’”'
WHERE book_id = 40 AND chapter_num = 23 AND verse_num = 39;

UPDATE verses SET text_niv = 'People were overwhelmed with amazement. “He has done everything well,” they said. “He even makes the deaf hear and the mute speak.”'
WHERE book_id = 41 AND chapter_num = 7 AND verse_num = 37;

UPDATE verses SET text_niv = '“Everyone will be salted with fire.'
WHERE book_id = 41 AND chapter_num = 9 AND verse_num = 49;

UPDATE verses SET text_niv = '“Salt is good, but if it loses its saltiness, how can you make it salty again? Have salt among yourselves, and be at peace with each other.”'
WHERE book_id = 41 AND chapter_num = 9 AND verse_num = 50;

UPDATE verses SET text_niv = 'So they answered Jesus, “We don’t know.” Jesus said, “Neither will I tell you by what authority I am doing these things.”'
WHERE book_id = 41 AND chapter_num = 11 AND verse_num = 33;

UPDATE verses SET text_niv = 'Mary Magdalene and Mary the mother of Joseph saw where he was laid.'
WHERE book_id = 41 AND chapter_num = 15 AND verse_num = 47;

UPDATE verses SET text_niv = '“Where, Lord?” they asked. He replied, “Where there is a dead body, there the vultures will gather.”'
WHERE book_id = 42 AND chapter_num = 17 AND verse_num = 37;

UPDATE verses SET text_niv = 'Then they went home and prepared spices and perfumes. But they rested on the Sabbath in obedience to the commandment.'
WHERE book_id = 42 AND chapter_num = 23 AND verse_num = 56;

UPDATE verses SET text_niv = '“But since you do not believe what he wrote, how are you going to believe what I say?”'
WHERE book_id = 43 AND chapter_num = 5 AND verse_num = 47;

UPDATE verses SET text_niv = 'Philip, however, appeared at Azotus and traveled about, preaching the gospel in all the towns until he reached Caesarea.'
WHERE book_id = 44 AND chapter_num = 8 AND verse_num = 40;

UPDATE verses SET text_niv = 'When two years had passed, Felix was succeeded by Porcius Festus, but because Felix wanted to grant a favor to the Jews, he left Paul in prison.'
WHERE book_id = 44 AND chapter_num = 24 AND verse_num = 27;

UPDATE verses SET text_niv = 'He proclaimed the kingdom of God and taught about the Lord Jesus Christ—with all boldness and without hindrance!'
WHERE book_id = 44 AND chapter_num = 28 AND verse_num = 31;

UPDATE verses SET text_niv = 'to the only wise God be glory forever through Jesus Christ! Amen.'
WHERE book_id = 45 AND chapter_num = 16 AND verse_num = 27;

COMMIT;
`;

console.log('Executing SQL transaction...');
runSql(sql);
console.log('Transaction committed successfully!');

// Verifications
console.log('\n=== VERIFICATION RESULTS ===');

const remainingTypos = q("SELECT count(*) as count FROM strongs_ar_translations WHERE definition_ar LIKE '%ملكوحه%' OR definition_ar LIKE '%العميد بالروح القدس%'");
console.log('Remaining targeted typos in strongs_ar_translations:', remainingTypos[0].count);

console.log('\nActs 8:37:');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 8 AND verse_num = 37) AND ar_word_position IN (1, 10, 11)"));

console.log('\n2 Thess 2:7:');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 53 AND chapter_num = 2 AND verse_num = 7) AND ar_word_position IN (7, 8, 13, 14)"));

console.log('\nDaniel 2:4:');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id, orig_word_lang FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 4) AND ar_word_position IN (8, 9, 11, 12, 13, 14)"));

console.log('\nMatthew 6:13:');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 6 AND verse_num = 13) AND ar_word_position = 13"));

console.log('\nActs 2:4 (Full):');
console.log(q("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 2 AND verse_num = 4) ORDER BY ar_word_position"));

console.log('\nEmpty NIV verses remaining:');
const emptyNiv = q("SELECT count(*) as count FROM verses WHERE text_niv IS NULL OR length(trim(text_niv)) = 0");
console.log('Empty NIV verses count:', emptyNiv[0].count);

console.log('\nActs 15:40-41 check:');
console.log(q("SELECT verse_num, text_alab, text_kjv, text_niv FROM verses WHERE book_id = 44 AND chapter_num = 15 AND verse_num IN (40, 41)"));
