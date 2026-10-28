const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

const beforeRecords = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'before_163_records.json'), 'utf8'));

function queryJson(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_query_after.sql');
  fs.writeFileSync(tmpFile, '.mode json\n' + sql, 'utf8');
  try {
    const res = execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 });
    const text = res.toString('utf8').trim();
    return text ? JSON.parse(text) : [];
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

const comparison = [];

for (const b of beforeRecords) {
  const after = queryJson(`
    SELECT wm.*
    FROM word_mappings wm
    WHERE wm.id = '${b.id}';
  `)[0];

  const changes = [];
  if (b.strongs_id !== after.strongs_id) changes.push(`strongs: ${b.strongs_id} -> ${after.strongs_id}`);
  if (b.orig_word !== after.orig_word) changes.push(`orig_word: ${b.orig_word} -> ${after.orig_word}`);
  if (b.orig_surface !== after.orig_surface) changes.push(`orig_surface: ${b.orig_surface} -> ${after.orig_surface}`);
  if (b.orig_word_position !== after.orig_word_position) changes.push(`orig_pos: ${b.orig_word_position} -> ${after.orig_word_position}`);
  if (b.morph_pos !== after.morph_pos) changes.push(`morph_pos: ${b.morph_pos} -> ${after.morph_pos}`);
  if (b.morph_stem !== after.morph_stem) changes.push(`morph_stem: ${b.morph_stem} -> ${after.morph_stem}`);
  if (b.morph_tense !== after.morph_tense) changes.push(`morph_tense: ${b.morph_tense} -> ${after.morph_tense}`);
  if (b.morph_person !== after.morph_person) changes.push(`morph_person: ${b.morph_person} -> ${after.morph_person}`);
  if (b.morph_gender !== after.morph_gender) changes.push(`morph_gender: ${b.morph_gender} -> ${after.morph_gender}`);
  if (b.morph_number !== after.morph_number) changes.push(`morph_number: ${b.morph_number} -> ${after.morph_number}`);
  if (b.morph_case !== after.morph_case) changes.push(`morph_case: ${b.morph_case} -> ${after.morph_case}`);
  if (b.orig_morphology !== after.orig_morphology) changes.push(`orig_morphology: ${b.orig_morphology} -> ${after.orig_morphology}`);
  if (b.verified_locator !== after.verified_locator) changes.push(`locator: ${b.verified_locator} -> ${after.verified_locator}`);

  comparison.push({
    ref: b.ref,
    id: b.id,
    ar_pos: b.ar_word_position,
    ar_word: b.ar_word,
    is_modified: changes.length > 0,
    changes,
    before: {
      strongs_id: b.strongs_id,
      orig_word: b.orig_word,
      orig_surface: b.orig_surface,
      orig_pos: b.orig_word_position,
      morph_pos: b.morph_pos,
      morph_stem: b.morph_stem,
      morph_tense: b.morph_tense,
      morph_person: b.morph_person,
      morph_gender: b.morph_gender,
      morph_number: b.morph_number,
      morph_case: b.morph_case,
      orig_morphology: b.orig_morphology,
      locator: b.verified_locator
    },
    after: {
      strongs_id: after.strongs_id,
      orig_word: after.orig_word,
      orig_surface: after.orig_surface,
      orig_pos: after.orig_word_position,
      morph_pos: after.morph_pos,
      morph_stem: after.morph_stem,
      morph_tense: after.morph_tense,
      morph_person: after.morph_person,
      morph_gender: after.morph_gender,
      morph_number: after.morph_number,
      morph_case: after.morph_case,
      orig_morphology: after.orig_morphology,
      locator: after.verified_locator,
      notes: after.grammar_notes
    }
  });
}

fs.writeFileSync(path.resolve(__dirname, 'before_after_163_records.json'), JSON.stringify(comparison, null, 2), 'utf8');

const modifiedCount = comparison.filter(c => c.is_modified).length;
const confirmedCount = comparison.filter(c => !c.is_modified).length;
console.log(`Comparison generated: ${comparison.length} total records.`);
console.log(`- Modified / Corrected: ${modifiedCount}`);
console.log(`- Confirmed unchanged:  ${confirmedCount}`);
