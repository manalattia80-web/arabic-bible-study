const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const CORRECTIONS_PATH = path.resolve(__dirname, '../alignment_audit_v299/contextual_corrections.json');

function executeSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_exec.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    const res = execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 });
    return res.toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

function esc(str) {
  return str ? "'" + String(str).replace(/'/g, "''") + "'" : "NULL";
}

console.log('Loading 105 contextual corrections from package...');
const items = JSON.parse(fs.readFileSync(CORRECTIONS_PATH, 'utf8'));

let sqlStatements = ['BEGIN TRANSACTION;'];

for (const item of items) {
  const { book_id, chapter, verse, ar_position, expected, note } = item;
  
  if (!expected) {
    // Pure Arabic connector / syntactic particle
    sqlStatements.push(`
      UPDATE word_mappings
      SET strongs_id = NULL,
          orig_word = '-',
          orig_surface = NULL,
          morph_pos = 'syntactic_ar',
          relation_type = 'syntactic_particle',
          grammar_notes = ${esc(note)},
          verified_source = 'audit_v299_review'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${book_id} AND chapter_num = ${chapter} AND verse_num = ${verse})
        AND ar_word_position = ${ar_position};
    `);
  } else if (expected.startsWith('@')) {
    // Structural / Phrasal / Prefix directive
    sqlStatements.push(`
      UPDATE word_mappings
      SET relation_type = 'phrase_group',
          grammar_notes = ${esc(note)},
          verified_source = 'audit_v299_review'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${book_id} AND chapter_num = ${chapter} AND verse_num = ${verse})
        AND ar_word_position = ${ar_position};
    `);
  } else if (expected.includes('+')) {
    // Compound Strong's (e.g. G4314+G846, H518+H3808)
    const strongsList = expected.split('+');
    const primaryStrongs = strongsList[0];
    sqlStatements.push(`
      UPDATE word_mappings
      SET strongs_id = '${primaryStrongs}',
          relation_type = 'compound_affix',
          grammar_notes = ${esc(note)},
          verified_source = 'audit_v299_review'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${book_id} AND chapter_num = ${chapter} AND verse_num = ${verse})
        AND ar_word_position = ${ar_position};
    `);
    
    // Add all components to word_mapping_strongs
    strongsList.forEach((sid, idx) => {
      sqlStatements.push(`
        INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
        SELECT id, '${sid}', ${idx + 1}, '${idx === 0 ? 'primary' : 'compound_part'}', orig_surface
        FROM word_mappings
        WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${book_id} AND chapter_num = ${chapter} AND verse_num = ${verse})
          AND ar_word_position = ${ar_position};
      `);
    });
  } else {
    // Concrete single Strong's ID
    sqlStatements.push(`
      UPDATE word_mappings
      SET strongs_id = '${expected}',
          relation_type = CASE WHEN '${expected}' LIKE 'H%' THEN 'hebrew_word' ELSE 'greek_word' END,
          grammar_notes = ${esc(note)},
          verified_source = 'audit_v299_review'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${book_id} AND chapter_num = ${chapter} AND verse_num = ${verse})
        AND ar_word_position = ${ar_position};

      INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
      SELECT id, '${expected}', 1, 'primary', orig_surface
      FROM word_mappings
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${book_id} AND chapter_num = ${chapter} AND verse_num = ${verse})
        AND ar_word_position = ${ar_position};
    `);
  }
}

sqlStatements.push('COMMIT;');

console.log(`Generated ${sqlStatements.length} SQL statements. Executing...`);
executeSql(sqlStatements.join('\n'));
console.log('Successfully applied all 105 contextual corrections!');
