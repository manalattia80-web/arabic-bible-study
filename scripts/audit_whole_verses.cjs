const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

const testVerses = [
  { book: 1, ch: 12, vs: 1, ref: 'Genesis 12:1' },
  { book: 6, ch: 1, vs: 8, ref: 'Joshua 1:8' },
  { book: 19, ch: 23, vs: 1, ref: 'Psalm 23:1' },
  { book: 23, ch: 53, vs: 5, ref: 'Isaiah 53:5' },
  { book: 43, ch: 3, vs: 16, ref: 'John 3:16' },
  { book: 44, ch: 1, vs: 8, ref: 'Acts 1:8' },
  { book: 45, ch: 8, vs: 28, ref: 'Romans 8:28' },
  { book: 49, ch: 2, vs: 8, ref: 'Ephesians 2:8' },
  { book: 58, ch: 11, vs: 1, ref: 'Hebrews 11:1' },
  { book: 66, ch: 21, vs: 4, ref: 'Revelation 21:4' }
];

function queryJson(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_audit_query.sql');
  fs.writeFileSync(tmpFile, '.mode json\n' + sql, 'utf8');
  try {
    const res = execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 });
    const text = res.toString('utf8').trim();
    return text ? JSON.parse(text) : [];
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

const auditResults = [];

for (const v of testVerses) {
  const verseInfo = queryJson(`SELECT id, text_avd_ar, text_original, text_original_lang FROM verses WHERE book_id = ${v.book} AND chapter_num = ${v.ch} AND verse_num = ${v.vs};`)[0];
  const words = queryJson(`
    SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface,
           wm.orig_word_position, wm.morph_pos, wm.morph_stem, wm.morph_tense, wm.morph_voice,
           wm.morph_mood, wm.morph_person, wm.morph_gender, wm.morph_number, wm.morph_case,
           wm.orig_morphology, wm.verified_locator, wm.grammar_notes, wm.relation_type
    FROM word_mappings wm
    WHERE wm.verse_id = '${verseInfo.id}'
    ORDER BY wm.ar_word_position ASC;
  `);

  const multiMappings = queryJson(`
    SELECT mapping_id, strongs_id, link_role
    FROM word_mapping_strongs
    WHERE mapping_id IN (SELECT id FROM word_mappings WHERE verse_id = '${verseInfo.id}');
  `);

  const multiMap = {};
  for (const mm of multiMappings) {
    if (!multiMap[mm.mapping_id]) multiMap[mm.mapping_id] = [];
    multiMap[mm.mapping_id].push(`${mm.link_role}:${mm.strongs_id}`);
  }

  for (const w of words) {
    w.multi = multiMap[w.id] || [];
  }

  auditResults.push({
    ref: v.ref,
    verseInfo,
    wordCount: words.length,
    words
  });
}

fs.writeFileSync(path.resolve(__dirname, 'whole_verses_audit_sample.json'), JSON.stringify(auditResults, null, 2), 'utf8');
console.log(`Audited ${auditResults.length} whole verses with a total of ${auditResults.reduce((a, b) => a + b.wordCount, 0)} words.`);
