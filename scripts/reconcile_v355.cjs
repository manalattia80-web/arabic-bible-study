const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseMorphology } = require('./morphology_engine.cjs');

const SQLITE = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_run.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE}" "${DB}" < "${tmpFile}"`).toString('utf8');
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('1. Correcting Galatians 5:22 locators & positions in DB...');
const galUpdates = `
BEGIN TRANSACTION;
-- Galatians 5:22 (Book 48, Chapter 5, Verse 22)
-- Verse ID subquery
UPDATE word_mappings SET orig_word_position = 2, verified_locator = 'SBLGNT:B48.C5.V22.w2'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 1;

UPDATE word_mappings SET orig_word_position = 3, verified_locator = 'SBLGNT:B48.C5.V22.w3'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 2;

UPDATE word_mappings SET orig_word_position = 5, verified_locator = 'SBLGNT:B48.C5.V22.w5'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 3;

UPDATE word_mappings SET orig_word_position = 6, verified_locator = 'SBLGNT:B48.C5.V22.w6'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 4;

UPDATE word_mappings SET orig_word_position = 7, verified_locator = 'SBLGNT:B48.C5.V22.w7'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 5;

UPDATE word_mappings SET orig_word_position = 8, verified_locator = 'SBLGNT:B48.C5.V22.w8'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 6;

UPDATE word_mappings SET orig_word_position = 9, verified_locator = 'SBLGNT:B48.C5.V22.w9'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 7;

UPDATE word_mappings SET orig_word_position = 10, verified_locator = 'SBLGNT:B48.C5.V22.w10'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 8;

UPDATE word_mappings SET orig_word_position = 10, verified_locator = 'SBLGNT:B48.C5.V22.w10'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 9;

UPDATE word_mappings SET orig_word_position = 11, verified_locator = 'SBLGNT:B48.C5.V22.w11'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 10;

UPDATE word_mappings SET orig_word_position = 12, verified_locator = 'SBLGNT:B48.C5.V22.w12'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 11;

UPDATE word_mappings SET orig_word_position = 13, verified_locator = 'SBLGNT:B48.C5.V22.w13'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 5 AND verse_num = 22) AND ar_word_position = 12;

COMMIT;
`;
runSql(galUpdates);
console.log('✓ Galatians 5:22 locators updated.');

console.log('2. Defining the 20 unified verses...');
const targetVerses = [
  // 10 Hebrew
  { book: 2, ch: 15, vs: 2, name: 'Exod 15:2' },
  { book: 3, ch: 26, vs: 12, name: 'Lev 26:12' },
  { book: 5, ch: 6, vs: 5, name: 'Deut 6:5' },
  { book: 6, ch: 1, vs: 9, name: 'Josh 1:9' },
  { book: 8, ch: 1, vs: 16, name: 'Ruth 1:16' },
  { book: 11, ch: 18, vs: 21, name: '1Kgs 18:21' },
  { book: 20, ch: 3, vs: 5, name: 'Prov 3:5' },
  { book: 23, ch: 40, vs: 8, name: 'Isa 40:8' },
  { book: 33, ch: 6, vs: 8, name: 'Mic 6:8' },
  { book: 38, ch: 4, vs: 6, name: 'Zech 4:6' },
  // 8 Greek
  { book: 41, ch: 10, vs: 45, name: 'Mark 10:45' },
  { book: 42, ch: 15, vs: 20, name: 'Luke 15:20' },
  { book: 45, ch: 8, vs: 28, name: 'Rom 8:28' },
  { book: 48, ch: 5, vs: 22, name: 'Gal 5:22' },
  { book: 49, ch: 2, vs: 8, name: 'Eph 2:8' },
  { book: 50, ch: 4, vs: 6, name: 'Phil 4:6' },
  { book: 52, ch: 5, vs: 23, name: '1Thess 5:23' },
  { book: 60, ch: 5, vs: 7, name: '1Pet 5:7' },
  // 2 Aramaic
  { book: 15, ch: 5, vs: 8, name: 'Ezra 5:8' },
  { book: 27, ch: 4, vs: 17, name: 'Dan 4:17' }
];

const whereClauses = targetVerses.map(v => `(v.book_id = ${v.book} AND v.chapter_num = ${v.ch} AND v.verse_num = ${v.vs})`).join(' OR ');
const selectAllSql = `
SELECT wm.id, wm.orig_morphology, wm.orig_word_position
FROM word_mappings wm
JOIN verses v ON wm.verse_id = v.id
WHERE ${whereClauses};
`;

const rows = runSql(selectAllSql).trim().split('\n');
console.log(`3. Re-deriving morphology for ${rows.length} words across the 20 unified verses...`);

let updateBatch = ['BEGIN TRANSACTION;'];
const escapeVal = (val) => val ? `'${val}'` : 'NULL';

for (const row of rows) {
  if (!row.trim()) continue;
  const [id, rawMorph, pos] = row.split('|');
  const parsed = parseMorphology(rawMorph);

  updateBatch.push(`
    UPDATE word_mappings
    SET morph_pos = ${escapeVal(parsed.pos)},
        morph_stem = ${escapeVal(parsed.stem)},
        morph_tense = ${escapeVal(parsed.tense)},
        morph_voice = ${escapeVal(parsed.voice)},
        morph_mood = ${escapeVal(parsed.mood)},
        morph_person = ${escapeVal(parsed.person)},
        morph_gender = ${escapeVal(parsed.gender)},
        morph_number = ${escapeVal(parsed.number)},
        morph_case = ${escapeVal(parsed.case)}
    WHERE id = '${id}';

    UPDATE word_mapping_strongs
    SET orig_morphology = ${escapeVal(rawMorph)},
        orig_word_position = COALESCE(${escapeVal(pos)}, orig_word_position)
    WHERE mapping_id = '${id}' AND link_role = 'primary';
  `);
}

updateBatch.push('COMMIT;');
runSql(updateBatch.join('\n'));
console.log('✓ Successfully re-derived all morphology and synchronized word_mapping_strongs for all 20 unified verses!');
