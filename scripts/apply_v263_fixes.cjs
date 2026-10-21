const { execFileSync } = require('child_process');
const path = require('path');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  return execFileSync(sqlite, [db], { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

const punctuationRegex = /[\u060C\u061B\u061F\u06D4«».,:;!؟\(\)\[\]"'\-—–]/gu;

console.log('=== Applying Precision Fixes (v1.0.263 / Database v25) ===\n');

// 1. Add columns grammar_notes and relation_type if not present
console.log('1. Checking and updating word_mappings schema...');
const cols = q('PRAGMA table_info(word_mappings);');
const colNames = cols.map(c => c.name);

if (!colNames.includes('grammar_notes')) {
  runSql('ALTER TABLE word_mappings ADD COLUMN grammar_notes TEXT;');
  console.log('   Added column grammar_notes.');
}
if (!colNames.includes('relation_type')) {
  runSql('ALTER TABLE word_mappings ADD COLUMN relation_type TEXT;');
  console.log('   Added column relation_type.');
}

// 2. Transfer Arabic explanations out of orig_word into grammar_notes & relation_type
console.log('\n2. Cleansing orig_word and migrating notes to grammar_notes...');
let sqlCleanse = `
BEGIN TRANSACTION;

-- Migrate notes
UPDATE word_mappings
SET 
  relation_type = 'aspect_particle',
  grammar_notes = orig_word,
  orig_word = '---'
WHERE orig_word LIKE '%دلالة نحوية%' OR orig_word LIKE '%صيغة الفعل%';

UPDATE word_mappings
SET 
  relation_type = 'compound_phrase',
  grammar_notes = orig_word,
  orig_word = '---'
WHERE orig_word LIKE '%تركيب عربي%' OR orig_word LIKE '%تركيب نفي%';

-- Clean up any other Arabic text in orig_word
UPDATE word_mappings
SET 
  relation_type = 'structural_note',
  grammar_notes = orig_word,
  orig_word = '---'
WHERE orig_word GLOB '*[ء-ي]*' AND NOT (orig_word GLOB '*[א-ת]*' OR orig_word GLOB '*[α-ωΑ-Ω]*');

COMMIT;
`;
runSql(sqlCleanse);
console.log('   orig_word cleansed.');

// 3. Fix mixed script characters (Arabic letters in Hebrew words)
console.log('\n3. Fixing mixed script characters in Hebrew words...');
let sqlMixed = `
BEGIN TRANSACTION;

-- Fix רָקִיעַ (replace Arabic Ain with Hebrew Ayin U+05E2)
UPDATE word_mappings
SET orig_word = 'רָקִיעַ'
WHERE strongs_id = 'H7549' AND (orig_word LIKE '%ع%' OR orig_word GLOB '*[ء-ي]*');

-- Fix צָמַח (replace Arabic Meem with Hebrew Mem U+05DE)
UPDATE word_mappings
SET orig_word = 'צָמַח'
WHERE strongs_id = 'H6779' AND (orig_word LIKE '%م%' OR orig_word GLOB '*[ء-ي]*');

COMMIT;
`;
runSql(sqlMixed);

// Verify mixed script count is 0
const remainingMixed = q("SELECT count(*) as cnt FROM word_mappings WHERE orig_word GLOB '*[ء-ي]*' AND (orig_word GLOB '*[א-ת]*' OR orig_word GLOB '*[α-ωΑ-Ω]*');")[0].cnt;
console.log(`   Remaining mixed script rows: ${remainingMixed} (Expected: 0)`);
if (remainingMixed > 0) {
  throw new Error('Mixed script characters still present!');
}

// 4. Genesis 2:5 compound existential negation
console.log('\n4. Refining Genesis 2:5 existential negation construct...');
const gen2_5_id = q("SELECT id FROM verses WHERE book_id = 1 AND chapter_num = 2 AND verse_num = 5;")[0].id;
let sqlGen2_5 = `
BEGIN TRANSACTION;

-- "ولا" (pos 24)
UPDATE word_mappings
SET 
  orig_word = '---',
  strongs_id = NULL,
  relation_type = 'existential_negation',
  grammar_notes = 'أداة عطف ونفي في سياق تركيب النفي الوجودي في الماضي (وَلاَ كَانَ إِنْسَانٌ = וְאָדָם אַיִן)'
WHERE verse_id = '${gen2_5_id}' AND ar_word_position = 24;

-- "كان" (pos 25)
UPDATE word_mappings
SET 
  orig_word = '---',
  strongs_id = NULL,
  relation_type = 'existential_copula',
  grammar_notes = 'فعل كينونة ماضٍ في سياق نفي وجودي، يُترجم مع الاسم العبارة العبرية (וְאָדָם אַיִן: لا يوجد إنسان / ما كان إنسان)'
WHERE verse_id = '${gen2_5_id}' AND ar_word_position = 25;

-- "إنسان" (pos 26)
UPDATE word_mappings
SET 
  orig_word = 'אָדָם',
  strongs_id = 'H120',
  relation_type = 'compound_subject',
  grammar_notes = 'الاسم المسند في التركيب الوجودي المنفي (וְאָדָם אַיִן)'
WHERE verse_id = '${gen2_5_id}' AND ar_word_position = 26;

COMMIT;
`;
runSql(sqlGen2_5);
console.log('   Genesis 2:5 construct refined.');

// 5. G26 Lexical Definition with Neutral Rigor
console.log('\n5. Updating G26 with neutral lexical definition...');
const g26_neutral = `١. المعنى المعجمي الأصلي للاسم:
اسم مؤنث في اليونانية (ἡ ἀγάπη)، مشتق من الجذر اللغوي المشترك مع الفعل (ἀγαπάω). يفيد الاسم لغوياً في المعاجم القياسية (مثل Liddell-Scott وBDAG): المحبة، الودّ، التفضيل الإرادي، أو التعلق الواعي بشخص أو بشيء. ولا يحمل اللفظ في بنيته الصرفية بذاته دلالة لاهوتية ثابتة أو حتمية، بل تتحدد طبيعته وقيمته الأخلاقية بحسب الفاعل وموضوع المحبة والسياق التركيبي.

٢. الاستعمال والتنوع السياقي للاسم في نصوص العهد الجديد:
تتنوع دلالات الاسم بحسب سياقات وروده في أسفار العهد الجديد:
- محبة الله نحو البشر: التعبير عن المبادرة الإلهية غير المستحقة في خلاص الإنسان بالصليب (رومية ٥: ٨، ١ يوحنا ٤: ٩-١٠).
- إعلان طبيعة الله: الدلالة على أن المحبة من صفات الله الجوهرية (١ يوحنا ٤: ٨، ١٦).
- محبة المؤمنين المتبادلة: رابطة الشركة الأخوية والسلوك المسيحي العملي (١ كورنثوس ١٣، كولوسي ٣: ١٤).
- ولائم المحبة الأخوية: ورد اللفظ بصيغة الجمع (ἀγάπαι) للدلالة على الموائد المشتركة في الكنيسة الأولى (يهوذا ١٢).

٣. شواهد العائلة اللغوية (الفعل ἀγαπάω):
يُميز التدقيق المعجمي بين الاسم وشواهد الفعل المرتبط به اشتقاقياً؛ فالفعل يدل لغوياً على التفضيل والاختيار، ويأتي في نصوص العهد الجديد بحسب موضوعه:
- في سياق محبة الشر أو العالم: مثل محبة الناس للظلمة أكثر من النور (يوحنا ٣: ١٩)، أو محبة المتكآت والمناصب (لوقا ١١: ٤٣)، أو محبة العالم الحاضر الفاني (٢ تيموثاوس ٤: ١٠، ١ يوحنا ٢: ١٥).
- في سياق محبة الفداء: مثل محبة الله للعالم في بذل ابنه الوحيد (يوحنا ٣: ١٦).

٤. الضبط التفسيري والمنهجي:
يقتضي المنهج المعجمي الرصين إبقاء التعريف اللغوي محايداً ومجرداً عن أي حمولة تفسيرية مسبقة، مع استقاء المعاني اللاهوتية والفدائية من سياقات النصوص الكتابية المحددة وليس بافتراض قداسة ذاتية في البنية اللفظية للكلمة.`;

runSql(`UPDATE strongs_ar_translations SET definition_ar = '${g26_neutral.replace(/'/g, "''")}' WHERE strongs_id = 'G26';`);
console.log('   G26 definition updated.');

// 6. Synchronize ar_word in word_mappings with text_avd_ar
console.log('\n6. Synchronizing word_mappings.ar_word directly with text_avd_ar...');
const verses = q('SELECT id, text_avd_ar FROM verses;');
const countRows = q('SELECT verse_id, count(*) as cnt FROM word_mappings GROUP BY verse_id;');
const wmCountMap = new Map();
for (const r of countRows) wmCountMap.set(r.verse_id, r.cnt);

let syncSql = 'BEGIN TRANSACTION;\n';
let syncedVerses = 0;
let syncedWords = 0;

for (const v of verses) {
  const tokens = v.text_avd_ar.replace(punctuationRegex, ' ').trim().split(/\s+/).filter(Boolean);
  const wmCnt = wmCountMap.get(v.id) || 0;
  if (tokens.length !== wmCnt) continue;

  syncedVerses++;
  for (let i = 0; i < tokens.length; i++) {
    const rawToken = tokens[i];
    const pos = i + 1;
    syncSql += `UPDATE word_mappings SET ar_word = '${rawToken.replace(/'/g, "''")}' WHERE verse_id = '${v.id}' AND ar_word_position = ${pos};\n`;
    syncedWords++;
  }
}

syncSql += 'COMMIT;\n';
console.log(`   Executing synchronization for ${syncedWords} words across ${syncedVerses} verses...`);
runSql(syncSql);
console.log('   Synchronization complete.');

// Verification of Genesis 2:10, 2:21, 2:25
console.log('\n=== Verification of Target Verses ===');
const gen2_10 = q(`SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 1 AND chapter_num = 2 AND verse_num = 10) AND ar_word_position = 10;`)[0];
console.log('Gen 2:10 pos 10 (Expected: يَنْقَسِمُ):', gen2_10);

const gen2_21 = q(`SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 1 AND chapter_num = 2 AND verse_num = 21) AND ar_word_position IN (12, 13, 14);`);
console.log('Gen 2:21 pos 12-14 (Expected: وَمَلأَ, مَكَانَهَا, لَحْمًا):', gen2_21);

const gen2_25 = q(`SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 1 AND chapter_num = 2 AND verse_num = 25) AND ar_word_position = 8;`)[0];
console.log('Gen 2:25 pos 8 (Expected: يَخْجَلاَنِ):', gen2_25);

const gen2_5_check = q(`SELECT ar_word_position, ar_word, orig_word, strongs_id, relation_type, grammar_notes FROM word_mappings WHERE verse_id = '${gen2_5_id}' AND ar_word_position IN (24, 25, 26);`);
console.log('Gen 2:5 existential negation check:', gen2_5_check);

const origWordArabicCount = q("SELECT count(*) as cnt FROM word_mappings WHERE orig_word GLOB '*[ء-ي]*';")[0].cnt;
console.log(`Count of orig_word containing Arabic characters: ${origWordArabicCount} (Expected: 0)`);

console.log('\n=== All Operations Executed Flawlessly! ===');
