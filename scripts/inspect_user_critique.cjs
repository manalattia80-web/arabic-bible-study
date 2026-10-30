const child = require('child_process');

function q(sql) {
  return child.execFileSync('sqlite_dist\\sqlite3.exe', ['mobile/assets/bible_study.db', sql]).toString().trim();
}

function inspect(b, c, v, label) {
  console.log(`========================================================================`);
  console.log(`=== ${label} (Book ${b}, Ch ${c}, Vs ${v}) ===`);
  const verse = q(`SELECT id, text_avd_ar, text_original FROM verses WHERE book_id = ${b} AND chapter_num = ${c} AND verse_num = ${v}`).split('|');
  console.log('AR:', verse[1]);
  console.log('ORIG:', verse[2]);
  console.log('--- Word Mappings ---');
  const rows = q(`SELECT ar_word_position, orig_word_position, ar_word, orig_word, orig_surface, strongs_id, morph_pos, orig_morphology, verified_locator FROM word_mappings WHERE verse_id = '${verse[0]}' ORDER BY ar_word_position`).split('\n');
  rows.forEach(r => console.log('  ', r));
}

inspect(12, 5, 1, '2 Kings 5:1');
inspect(15, 7, 21, 'Ezra 7:21');
inspect(40, 22, 30, 'Matthew 22:30');
