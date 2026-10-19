const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

let sql = 'BEGIN TRANSACTION;\n\n';

// 1. Luke 23:39 word 9: كنت -> G1510 (εἰμί)
console.log('Fixing Luke 23:39: كنت -> G1510...');
sql += `
UPDATE word_mappings 
SET orig_word = 'εἰμί', strongs_id = 'G1510' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 23 AND verse_num = 39) 
  AND ar_word_position = 9;
`;

// 2. Luke 24:20 word 6: لقضاء -> G2917 (κρίμα)
console.log('Fixing Luke 24:20: لقضاء -> G2917...');
sql += `
UPDATE word_mappings 
SET orig_word = 'κρίμα', strongs_id = 'G2917' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 20) 
  AND ar_word_position = 6;
`;

// 3. Luke 24:21 word 1: ونحن -> G2249 (ἡμεῖς)
console.log('Fixing Luke 24:21: ونحن -> G2249...');
sql += `
UPDATE word_mappings 
SET orig_word = 'ἡμεῖς', strongs_id = 'G2249' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 21) 
  AND ar_word_position = 1;
`;

// 4. Luke 24:32 word 9: كان -> G1510 (εἰμί)
console.log('Fixing Luke 24:32: كان -> G1510...');
sql += `
UPDATE word_mappings 
SET orig_word = 'εἰμί', strongs_id = 'G1510' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 32) 
  AND ar_word_position = 9;
`;

// 5. Luke 24:32 word 13: ويوضح -> G1272 (διανοίγω)
console.log('Fixing Luke 24:32: ويوضح -> G1272...');
sql += `
UPDATE word_mappings 
SET orig_word = 'διανοίγω', strongs_id = 'G1272' 
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 32) 
  AND ar_word_position = 13;
`;

// 6. Complete Arabic translation entries in strongs_ar_translations for G1473, G1122, G1848
console.log('Inserting complete Arabic definitions for G1473, G1122, G1848 into strongs_ar_translations...');
sql += `
INSERT OR REPLACE INTO strongs_ar_translations (strongs_id, pronunciation_ar, definition_ar, notes_ar, is_verified)
VALUES
(
  'G1473',
  'إِيجُو',
  '1. المعنى الأصلي: ضمير المتكلم المفرد في اليونانية (أنا)، ولا يُذكر في الجملة اليونانية إلا عند إرادة التوكيد والتشديد؛ لأن الفعل اليوناني يحمل الضمير ضمناً في تصريفه. 2. السياق الكتابي: يرد كثيراً في تصريحات الرب يسوع المسيح الإعلانية الخلاصية، مثل أقوال "أنا هو" (ἐγώ εἰμι) في الأناجيل، مؤكداً هويته الإلهية وسلطانه الفريد. كما يرد على لسان الرسل والمؤمنين للتعبير عن المسؤولية والشهادة الشخصية. 3. البعد اللاهوتي: يحمل اللفظ عمقاً لاهوتياً استثنائياً حين يرد مقترناً بفعل الكينونة (أنا هو)، في إحالة مباشرة إلى الاسم الإلهي "أهيه الذي أهيه" المُعلن لموسى في العهد القديم، مشدداً على أزلية المسيح ولاهوته وثبات مواعيد الله في تدبير الفداء.',
  'ضمير المتكلم المفرد ''أنا''، ويُترجم بحسب موقعه الإعرابي، ويأتي مؤكداً لهوية المتكلم أو إعلانه.',
  1
),
(
  'G1122',
  'غْرَامَاتِيوس',
  '1. المعنى الأصلي: اسم مشتق من فعل ''يكتب'' (γράφω) وكلمة ''حرف/كتاب'' (γράμμα)، ويعني الكاتب أو الناسخ أو المدوّن، وتطور ليعني دارس الناموس ومعلّمه والمفتش في الشريعة. 2. السياق الكتابي: يشير في العهد الجديد إلى طبقة الكتبة من علماء الشريعة اليهودية الذين نذروا حياتهم لحفظ العهد القديم، نسخه، تفسيره وتطبيقه. وكانوا غالباً متحالفين مع الفريسيين ورؤساء الكهنة في المجمع (السنهدريم). 3. البعد اللاهوتي: يمثل الكتبة في الفكر الكتابي التمسك الحرفي الشكلي بالشريعة والتقاليد البشرية على حساب جوهر الحق الإلهي ومقاصد النعمة، مما قادهم إلى مقاومة المسيا الحقيقي رغم حفظهم لنصوص النبوات التي تشهد عنه، وهو ما يبرز عجز المعرفة العقلية المجردة عن إدراك الحق دون استنارة روحية.',
  'تُرجمت عادة بـ ''كَاتِب'' والجمع ''كَتَبَة''، وهم علماء التوراة ومعلمو الشريعة في المجتمع اليهودي.',
  1
),
(
  'G1848',
  'إِكْسُوثِينِيوو',
  '1. المعنى الأصلي: فعل مركب من حرف الجر (ἐκ) وكلمة (οὐδείς / οὐθέν - لا شيء)، ويعني حرفياً: أن يجعل شيئاً أو شخصاً كلاشيء، أو يحسبه معدوم القيمة، أي الاحتقار، الازدراء التام، الاستخفاف والاستهانة. 2. السياق الكتابي: يرد في العهد الجديد لوصف المعاملة القاسية والازدراء الذي لاقاه الرب يسوع المسيح من قادة العالم الديني والمدني (مثل احتقار هيرودس وجنوده له في لوقا 23: 11)، كما يصف استهانة الرافضين برسالة الإنجيل أو احتقار القوي للضعيف. 3. البعد اللاهوتي: يُبرز هذا الفعل عمق اتضاع المسيح وآلامه البدلية، حيث ''رُذل واحتُقر من الناس'' تتميماً لنبوة إشعياء 53، إذ احتمل عار الصليب والاستهزاء البشري طوعاً من أجل خلاص الخطاة، مع تحذير المؤمنين من ازدراء أي عضو في جسد المسيح أو الاستخفاف بنعمة الله.',
  'تُرجمت بـ ''احْتَقَرَ'' أو ''ازْدَرَى'' أو ''اسْتَخَفَّ''، وتدل على الاستهانة الكاملة بالشخص أو المبدأ.',
  1
);
`;

sql += '\nCOMMIT;\n';

console.log('Executing SQL against mobile/assets/bible_study.db...');
execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
console.log('Execution complete!');

// Verification queries
const checkWords = q(`
  SELECT 'Lk 23:39 w9', ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 23 AND verse_num = 39) AND ar_word_position = 9
  UNION ALL
  SELECT 'Lk 24:20 w6', ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 20) AND ar_word_position = 6
  UNION ALL
  SELECT 'Lk 24:21 w1', ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 21) AND ar_word_position = 1
  UNION ALL
  SELECT 'Lk 24:32 w9', ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 32) AND ar_word_position = 9
  UNION ALL
  SELECT 'Lk 24:32 w13', ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24 AND verse_num = 32) AND ar_word_position = 13;
`);
console.log('\nVerified updated words:');
checkWords.forEach(r => console.log(`  ${r['\'Lk 23:39 w9\'']}: ${r.ar_word} -> ${r.orig_word} (${r.strongs_id})`));

const checkArTranslations = q(`
  SELECT strongs_id, pronunciation_ar, substr(definition_ar, 1, 40) as def_sample, is_verified 
  FROM strongs_ar_translations 
  WHERE strongs_id IN ('G1473', 'G1122', 'G1848');
`);
console.log('\nVerified strongs_ar_translations entries:');
checkArTranslations.forEach(r => console.log(`  ${r.strongs_id}: ${r.pronunciation_ar} | ${r.def_sample}... (verified: ${r.is_verified})`));
