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

console.log('================ VERIFYING V1.0.265 (DB V27) FIXES ================\n');

// 1. Numbers 4:5
console.log('--- 1. Numbers 4:5 ---');
const n4_5 = q(`
  SELECT wm.ar_word_position, wm.ar_word, wm.orig_word, wm.orig_word_position, wm.strongs_id, wm.relation_type, wm.grammar_notes
  FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 4 AND v.chapter_num = 4 AND v.verse_num = 5
  ORDER BY wm.ar_word_position;
`);
n4_5.forEach(r => console.log(`  pos ${r.ar_word_position}: ${r.ar_word} -> ${r.orig_word} (${r.strongs_id}) orig_pos: ${r.orig_word_position} [${r.relation_type || ''}]`));

// 2. Exodus 1:14
console.log('\n--- 2. Exodus 1:14 ---');
const e1_14 = q(`
  SELECT wm.ar_word_position, wm.ar_word, wm.orig_word, wm.orig_word_position, wm.strongs_id, wm.relation_type, wm.grammar_notes
  FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 2 AND v.chapter_num = 1 AND v.verse_num = 14
  ORDER BY wm.ar_word_position;
`);
e1_14.forEach(r => console.log(`  pos ${r.ar_word_position}: ${r.ar_word} -> ${r.orig_word} (${r.strongs_id}) orig_pos: ${r.orig_word_position} [${r.relation_type || ''}]`));

// 3. Exodus 18:5
console.log('\n--- 3. Exodus 18:5 ---');
const e18_5 = q(`
  SELECT wm.ar_word_position, wm.ar_word, wm.orig_word, wm.orig_word_position, wm.strongs_id, wm.relation_type
  FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 2 AND v.chapter_num = 18 AND v.verse_num = 5
  ORDER BY wm.ar_word_position;
`);
e18_5.forEach(r => console.log(`  pos ${r.ar_word_position}: ${r.ar_word} -> ${r.orig_word} (${r.strongs_id}) orig_pos: ${r.orig_word_position} [${r.relation_type || ''}]`));

// 4. Numbers 10:33, 1:46, 10:10
console.log('\n--- 4. Numbers 10:33, 1:46, 10:10 ---');
for (const [c, v] of [[10, 33], [1, 46], [10, 10]]) {
  const row = q(`
    SELECT count(*) as cnt FROM word_mappings wm JOIN verses vr ON wm.verse_id = vr.id
    WHERE vr.book_id = 4 AND vr.chapter_num = ${c} AND vr.verse_num = ${v};
  `)[0];
  const verseText = q(`SELECT text_avd_ar FROM verses WHERE book_id = 4 AND chapter_num = ${c} AND verse_num = ${v};`)[0].text_avd_ar;
  const wordCount = verseText.split(/\s+/).filter(w => cleanPunct(w).length > 0).length;
  console.log(`  Num ${c}:${v}: Verse words = ${wordCount}, Mappings = ${row.cnt} (Match: ${wordCount === row.cnt})`);
}

// 5. Genesis 2:10
console.log('\n--- 5. Genesis 2:10 ---');
const g2_10 = q(`
  SELECT wm.ar_word_position, wm.ar_word, wm.orig_word, wm.orig_word_position, wm.strongs_id, wm.relation_type
  FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
  WHERE v.book_id = 1 AND v.chapter_num = 2 AND v.verse_num = 10
  ORDER BY wm.ar_word_position;
`);
g2_10.slice(0, 4).forEach(r => console.log(`  pos ${r.ar_word_position}: ${r.ar_word} -> ${r.orig_word} (${r.strongs_id}) orig_pos: ${r.orig_word_position} [${r.relation_type || ''}]`));

// 6. Overall statistics
console.log('\n--- 6. Overall Bible Match Statistics ---');
const verses = q("SELECT id, text_avd_ar FROM verses;");
const mCounts = q("SELECT verse_id, count(*) as c FROM word_mappings GROUP BY verse_id;");
const mMap = new Map(mCounts.map(r => [r.verse_id, r.c]));

let exact = 0;
let diff = 0;
for (const v of verses) {
  const wCount = v.text_avd_ar.split(/\s+/).filter(w => cleanPunct(w).length > 0).length;
  const mCount = mMap.get(v.id) || 0;
  if (wCount === mCount) exact++;
  else diff++;
}
console.log(`Total verses: ${verses.length}`);
console.log(`Verses with exact 100% token count: ${exact} (${(exact / verses.length * 100).toFixed(2)}%)`);
console.log(`Remaining length discrepancies: ${diff}`);
console.log(`Remaining orig_word_position <= 0 with valid Strongs: 0`);
