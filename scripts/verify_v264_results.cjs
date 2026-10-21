const { execFileSync } = require('child_process');
const path = require('path');
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

console.log('=== VERIFYING V1.0.264 FIXES ===\n');

// 1. Genesis 2:10
console.log('--- 1. Genesis 2:10 ---');
const gen2_10 = q(`
  SELECT ar_word_position, ar_word, orig_word, orig_word_position, strongs_id, relation_type, grammar_notes
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 1 AND v.chapter_num = 2 AND v.verse_num = 10
  ORDER BY ar_word_position;
`);
gen2_10.forEach(r => console.log(`  pos ${r.ar_word_position}: ${r.ar_word} -> ${r.orig_word} (${r.strongs_id}) orig_pos: ${r.orig_word_position} [${r.relation_type || ''}] notes: ${r.grammar_notes || ''}`));

// 2. 1 Samuel 17:2 and 17:3
console.log('\n--- 2. 1 Samuel 17:2 & 17:3 ---');
const sam17 = q(`
  SELECT v.verse_num, ar_word_position, ar_word, orig_word, orig_word_position, strongs_id, relation_type
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 9 AND v.chapter_num = 17 AND v.verse_num IN (2, 3)
  ORDER BY v.verse_num, ar_word_position;
`);
sam17.forEach(r => console.log(`  v${r.verse_num} pos ${r.ar_word_position}: ${r.ar_word} -> ${r.orig_word} (${r.strongs_id}) orig_pos: ${r.orig_word_position} [${r.relation_type || ''}]`));

// Check remaining orig_word_position <= 0 with strongs
const remZero = q(`
  SELECT count(*) as c 
  FROM word_mappings 
  WHERE (orig_word_position <= 0 OR orig_word_position IS NULL) 
    AND strongs_id IS NOT NULL AND strongs_id != '---' AND strongs_id != '';
`);
console.log('\nRemaining orig_pos <= 0 with valid Strongs:', remZero[0].c);

// 3. User Exodus test verses
console.log('\n--- 3. User Exodus Test Verses ---');
const exoRefs = [
  { c: 1, v: 14 },
  { c: 1, v: 16 },
  { c: 2, v: 1 },
  { c: 2, v: 5 },
  { c: 2, v: 7 },
  { c: 2, v: 15 },
  { c: 2, v: 21 },
];

for (const ref of exoRefs) {
  const v = q(`SELECT text_avd_ar FROM verses WHERE book_id = 2 AND chapter_num = ${ref.c} AND verse_num = ${ref.v};`)[0];
  const maps = q(`
    SELECT ar_word_position, ar_word, orig_word, strongs_id, relation_type
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    WHERE v.book_id = 2 AND v.chapter_num = ${ref.c} AND v.verse_num = ${ref.v}
    ORDER BY ar_word_position;
  `);
  const verseWords = v.text_avd_ar.split(/\s+/).filter(w => cleanPunct(w).length > 0);
  console.log(`\nExo ${ref.c}:${ref.v}: Verse words = ${verseWords.length}, Mappings = ${maps.length} (Match: ${verseWords.length === maps.length})`);
  maps.forEach(m => console.log(`  pos ${m.ar_word_position}: ${m.ar_word} -> ${m.orig_word} (${m.strongs_id}) [${m.relation_type || ''}]`));
}

// 4. Overall Bible match statistics
console.log('\n--- 4. Overall Bible Match Statistics ---');
const mappingCounts = q(`SELECT verse_id, count(*) as map_count FROM word_mappings GROUP BY verse_id;`);
const mapCountByVerse = new Map(mappingCounts.map(r => [r.verse_id, r.map_count]));
const verses = q("SELECT id, text_avd_ar FROM verses;");

let lengthMismatch = 0;
let exactMatch = 0;

for (const v of verses) {
  const words = v.text_avd_ar.split(/\s+/).filter(w => cleanPunct(w).length > 0);
  const mCount = mapCountByVerse.get(v.id) || 0;
  if (words.length === mCount) {
    exactMatch++;
  } else {
    lengthMismatch++;
  }
}

console.log(`Total verses: ${verses.length}`);
console.log(`Verses with exact word counts: ${exactMatch} (${(exactMatch / verses.length * 100).toFixed(2)}%)`);
console.log(`Remaining length discrepancies: ${lengthMismatch}`);
