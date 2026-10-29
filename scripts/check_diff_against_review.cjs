const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlitePath = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function queryJson(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_query.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    const res = execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 });
    const text = res.toString('utf8').trim();
    if (!text) return null;
    return JSON.parse(text);
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

const revPath = path.resolve(__dirname, '../scratch/review_v317_evidence/baseline/review.json');
const rev = JSON.parse(fs.readFileSync(revPath, 'utf8'));

let diffCount = 0;
const results = [];

for (const r of rev.rows) {
  const parts = r.reference.split(' ');
  const chVs = parts[parts.length - 1];
  const [ch, vs] = chVs.split(':').map(Number);
  
  const row = queryJson(`
    SELECT json_object(
      'pos', wm.orig_word_position,
      'strongs', wm.strongs_id,
      'surface', wm.orig_surface,
      'morphology', wm.orig_morphology,
      'morph_pos', wm.morph_pos,
      'morph_tense', wm.morph_tense,
      'morph_person', wm.morph_person,
      'morph_number', wm.morph_number,
      'morph_gender', wm.morph_gender,
      'morph_case', wm.morph_case,
      'morph_stem', wm.morph_stem,
      'locator', wm.verified_locator,
      'relation_type', wm.relation_type
    )
    FROM word_mappings wm 
    JOIN verses v ON wm.verse_id = v.id 
    WHERE v.book_id = ${r.book_id} AND v.chapter_num = ${ch} AND v.verse_num = ${vs} AND wm.ar_word_position = ${r.arabic_position};
  `);
  
  const expectedPos = r.expected_source_positions;
  const currentPos = row ? row.pos : undefined;
  
  const expToken = r.expected_source_tokens && r.expected_source_tokens[0];
  const expMorph = expToken ? expToken.morph : null;
  const currentMorph = row ? row.morphology : null;
  
  const posMismatch = Array.isArray(expectedPos) ? !expectedPos.includes(currentPos) : expectedPos !== currentPos;
  
  // also check critical user points
  const badProvTreasure = (r.arabic === 'كَنْزٌ' && row.morph_pos !== 'noun');
  const badProvTrouble = (r.arabic === 'كَدَرٌ' && (row.morph_pos !== 'participle' || row.morphology !== 'HVNrfsa'));
  const badDanPromoted = (r.arabic === 'قَدَّمَ' && row.morph_pos !== 'verb');
  const badDanAbednego = (r.arabic === 'وَعَبْدَنَغُوَ' && row.locator !== 'OSHB:B27.C3.V30.w6-w7');
  const badJohnLive = (r.arabic === 'سَتَحْيَوْنَ' && (row.pos !== 18 || row.morph_tense !== 'future' || row.morph_person !== '2' || row.morph_number !== 'plural'));
  const badJohnI = (r.arabic === 'أَنَا' && (row.pos !== 14 || row.morphology !== 'RP ----NS--'));
  
  if (posMismatch || badProvTreasure || badProvTrouble || badDanPromoted || badDanAbednego || badJohnLive || badJohnI) {
    diffCount++;
    results.push({
      ref: r.reference,
      pos: r.arabic_position,
      word: r.arabic,
      current: row,
      expected: {
        pos: expectedPos,
        morph: expMorph,
        tokens: r.expected_source_tokens
      },
      note: r.note_ar
    });
  }
}

console.log('Total critical diff count against expected across all 116 records:', diffCount);
for (const res of results) {
  console.log(`[${res.ref} w${res.pos} «${res.word}»] currentPos: ${res.current.pos}, expPos: ${JSON.stringify(res.expected.pos)} | currentMorph: ${res.current.morphology}, expMorph: ${res.expected.morph} | morph_pos: ${res.current.morph_pos}`);
}
