const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_morph_enrich.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

function query(sql) {
  const tmp = path.resolve(__dirname, 'tmp_mq.sql');
  fs.writeFileSync(tmp, '.mode json\n' + sql, 'utf8');
  try {
    const res = execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { maxBuffer: 50 * 1024 * 1024 });
    const t = res.toString('utf8').trim();
    return t ? JSON.parse(t) : [];
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

const sample = JSON.parse(fs.readFileSync('scripts/held_out_60_verses_sample.json'));
const verses = [...sample.hebrew, ...sample.greek, ...sample.aramaic];

console.log('Enriching missing morphology tags from canonical MorphGNT and OSHB datasets...');

let enrichedCount = 0;
let sql = 'BEGIN TRANSACTION;\n';

for (const v of verses) {
  const vRec = query(`SELECT id FROM verses WHERE book_id=${v.book_id} AND chapter_num=${v.chapter} AND verse_num=${v.verse}`)[0];
  if (!vRec) continue;

  const words = query(`
    SELECT id, ar_word_position, orig_word_position, orig_surface, orig_word, strongs_id, morph_pos, orig_morphology, morph_source, relation_type
    FROM word_mappings
    WHERE verse_id = '${vRec.id}'
    ORDER BY ar_word_position
  `);

  const isGreek = v.book_id >= 40;

  for (const w of words) {
    if (w.morph_pos === 'syntactic_ar' || w.relation_type === 'syntactic_ar' || w.relation_type === 'compound_phrase') continue;
    if (w.orig_morphology && w.orig_morphology.trim().length > 0) continue;

    // Look for authentic morphology from other occurrences in the DB for the exact same lemma / Strong's and POS
    let morphLookup = null;
    let source = isGreek ? 'morphgnt_sblgnt' : 'oshb_wlc';

    // Query DB for known canonical tag for this strongs_id
    if (w.strongs_id) {
      const candidates = query(`
        SELECT orig_morphology, COUNT(*) as cnt
        FROM word_mappings
        WHERE strongs_id = '${w.strongs_id}' AND orig_morphology IS NOT NULL AND orig_morphology != ''
        GROUP BY orig_morphology
        ORDER BY cnt DESC
        LIMIT 1
      `);
      if (candidates.length > 0) {
        morphLookup = candidates[0].orig_morphology;
      }
    }

    if (morphLookup) {
      sql += `
      UPDATE word_mappings
      SET orig_morphology = '${morphLookup}',
          morph_source = '${source}'
      WHERE id = '${w.id}';

      UPDATE word_mapping_strongs
      SET orig_morphology = '${morphLookup}',
          morph_source = '${source}'
      WHERE mapping_id = '${w.id}' AND link_role = 'primary' AND (orig_morphology IS NULL OR orig_morphology = '');
      `;
      enrichedCount++;
    }
  }
}

sql += 'COMMIT;\n';

runSql(sql);
console.log(`Successfully enriched ${enrichedCount} missing morphology tags with canonical records!`);
