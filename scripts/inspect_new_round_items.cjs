const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  try {
    const out = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
    return out && out.trim() ? JSON.parse(out) : [];
  } catch (e) {
    return [];
  }
}

console.log('=== Checking OT Items ===');
// Num 7:72
console.log('Num 7:72:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 7 AND verse_num = 72);"));

// Esth 1:9
console.log('Esth 1:9:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 17 AND chapter_num = 1 AND verse_num = 9);"));

// 1 Chron 8:11
console.log('1 Chron 8:11:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 13 AND chapter_num = 8 AND verse_num = 11);"));

// Neh 11:19
console.log('Neh 11:19:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 16 AND chapter_num = 11 AND verse_num = 19);"));

// Josh 19:26
console.log('Josh 19:26:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 19 AND verse_num = 26);"));

// 2 Kings 25:6 and 25:21
console.log('2 Kgs 25:6:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 25 AND verse_num = 6);"));
console.log('2 Kgs 25:21:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 25 AND verse_num = 21);"));

// Judg 18:11
console.log('Judg 18:11:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 18 AND verse_num = 11);"));

console.log('\n=== Checking NT Items ===');
// Acts 27:30
console.log('Acts 27:30:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 27 AND verse_num = 30);"));

// Jas 2:6
console.log('Jas 2:6:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 59 AND chapter_num = 2 AND verse_num = 6);"));

// Gal 3:15
console.log('Gal 3:15:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 3 AND verse_num = 15);"));

// Col 2:5
console.log('Col 2:5:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 51 AND chapter_num = 2 AND verse_num = 5);"));

// 2 Pet 2:20
console.log('2 Pet 2:20:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 61 AND chapter_num = 2 AND verse_num = 20);"));

// Rom 9:10
console.log('Rom 9:10:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 45 AND chapter_num = 9 AND verse_num = 10);"));

// Rev 10:1
console.log('Rev 10:1:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 10 AND verse_num = 1);"));

// John 9:11
console.log('John 9:11:', q("SELECT ar_word_position, ar_word, strongs_id, orig_word FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 9 AND verse_num = 11);"));
