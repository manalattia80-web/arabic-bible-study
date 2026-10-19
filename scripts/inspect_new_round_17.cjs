const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';
function q(sql) {
  const out = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return out && out.trim() ? JSON.parse(out) : [];
}

console.log('=== Checking Hebrew candidates ===');
console.log('1 Chron 7:19:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 7 AND verse_num = 19);"));
console.log('Ezra 10:24:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 10 AND verse_num = 24);"));
console.log('Josh 15:41:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 15 AND verse_num = 41);"));
console.log('2 Chron 31:12:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 31 AND verse_num = 12) AND ar_word LIKE '%كوننيا%';"));
console.log('2 Chron 31:13:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 14 AND chapter_num = 31 AND verse_num = 13) AND ar_word LIKE '%كوننيا%';"));
console.log('Isa 47:2:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 47 AND verse_num = 2) AND ar_word LIKE '%نقابك%';"));

console.log('\n=== Checking Greek candidates ===');
console.log('2 Cor 11:10:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 47 AND chapter_num = 11 AND verse_num = 10);"));
console.log('Eph 2:19:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 49 AND chapter_num = 2 AND verse_num = 19);"));
console.log('Col 4:2:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 51 AND chapter_num = 4 AND verse_num = 2);"));
console.log('2 Tim 3:10:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 55 AND chapter_num = 3 AND verse_num = 10);"));
console.log('Acts 14:6:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 14 AND verse_num = 6);"));
console.log('Heb 4:11:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 58 AND chapter_num = 4 AND verse_num = 11);"));
console.log('Acts 4:6:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 4 AND verse_num = 6);"));
console.log('Acts 12:6:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 12 AND verse_num = 6);"));
console.log('Acts 17:21:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 17 AND verse_num = 21);"));
console.log('Acts 28:20:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 28 AND verse_num = 20);"));
console.log('Gal 4:31:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 4 AND verse_num = 31);"));

console.log('\n=== Checking Aramaic Mappings ===');
const aramaicCounts = q(`
  SELECT count(*) as total_in_aramaic_sections
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE (
    (v.book_id = 27 AND v.chapter_num = 2 AND v.verse_num >= 4) OR
    (v.book_id = 27 AND v.chapter_num BETWEEN 3 AND 7) OR
    (v.book_id = 15 AND v.chapter_num = 4 AND v.verse_num >= 8) OR
    (v.book_id = 15 AND v.chapter_num IN (5, 6)) OR
    (v.book_id = 15 AND v.chapter_num = 7 AND v.verse_num BETWEEN 12 AND 26) OR
    (v.book_id = 24 AND v.chapter_num = 10 AND v.verse_num = 11)
  );
`);
console.log('Aramaic section count:', aramaicCounts);

const currentAramaicLangCount = q("SELECT orig_word_lang, count(*) FROM word_mappings WHERE orig_word_lang = 'aramaic' GROUP BY orig_word_lang;");
console.log('Current aramaic orig_word_lang in word_mappings:', currentAramaicLangCount);
