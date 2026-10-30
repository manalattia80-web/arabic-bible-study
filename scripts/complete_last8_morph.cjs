const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_last8_morph.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

const last8 = [
  { book_id: 40, chap: 21, verse: 44, ar_pos: 6, morph: 'V- 1FPI-S--', src: 'morphgnt_sblgnt' },
  { book_id: 41, chap: 5, verse: 5, ar_pos: 2, morph: 'D- --------', src: 'morphgnt_sblgnt' },
  { book_id: 41, chap: 11, verse: 31, ar_pos: 10, morph: 'D- --------', src: 'morphgnt_sblgnt' },
  { book_id: 43, chap: 6, verse: 22, ar_pos: 18, morph: 'C- --------', src: 'morphgnt_sblgnt' },
  { book_id: 15, chap: 7, verse: 21, ar_pos: 13, morph: 'TNcmsd', src: 'oshb_wlc' },
  { book_id: 15, chap: 7, verse: 24, ar_pos: 7, morph: 'TC/Ampd', src: 'oshb_wlc' },
  { book_id: 15, chap: 7, verse: 24, ar_pos: 22, morph: 'TNcmsa', src: 'oshb_wlc' },
  { book_id: 27, chap: 4, verse: 13, ar_pos: 9, morph: 'TNcmsa', src: 'oshb_wlc' }
];

let sql = 'BEGIN TRANSACTION;\n';
for (const x of last8) {
  sql += `
  UPDATE word_mappings
  SET orig_morphology = '${x.morph}',
      morph_source = '${x.src}'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${x.book_id} AND chapter_num = ${x.chap} AND verse_num = ${x.verse})
    AND ar_word_position = ${x.ar_pos};

  UPDATE word_mapping_strongs
  SET orig_morphology = '${x.morph}',
      morph_source = '${x.src}'
  WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${x.book_id} AND chapter_num = ${x.chap} AND verse_num = ${x.verse}) AND ar_word_position = ${x.ar_pos})
    AND link_role = 'primary';
  `;
}
sql += 'COMMIT;\n';

runSql(sql);
console.log('Successfully completed the last 8 morphology records!');
