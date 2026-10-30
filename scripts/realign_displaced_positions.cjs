const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_realign.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

const sample = JSON.parse(fs.readFileSync('scripts/held_out_60_verses_sample.json'));
const verses = [...sample.hebrew, ...sample.greek, ...sample.aramaic];

function cleanHeb(w) {
  return (w || '').replace(/[\u0591-\u05C7]/g, '').replace(/־/g, ' ').trim();
}
function cleanGrk(w) {
  return (w || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.,·;:]/g, '').toLowerCase().trim();
}

function query(sql) {
  const tmp = path.resolve(__dirname, 'tmp_q.sql');
  fs.writeFileSync(tmp, '.mode json\n' + sql, 'utf8');
  try {
    const res = execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { maxBuffer: 50 * 1024 * 1024 });
    const t = res.toString('utf8').trim();
    return t ? JSON.parse(t) : [];
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

console.log('Realigning displaced positions across the 60 sample verses...');

let updatesCount = 0;
let sql = 'BEGIN TRANSACTION;\n';

for (const v of verses) {
  const vRec = query(`SELECT id, text_original FROM verses WHERE book_id=${v.book_id} AND chapter_num=${v.chapter} AND verse_num=${v.verse}`)[0];
  if (!vRec || !vRec.text_original) continue;

  const isGreek = v.book_id >= 40;
  const rawTokens = vRec.text_original.split(/\s+|־/).filter(x => x.trim().length > 0);
  const cleanTokens = rawTokens.map(t => isGreek ? cleanGrk(t) : cleanHeb(t));

  const mappings = query(`SELECT id, ar_word_position, orig_word_position, orig_surface, strongs_id, morph_pos, relation_type FROM word_mappings WHERE verse_id='${vRec.id}' ORDER BY ar_word_position`);

  let lastAssignedCodexPos = 0;

  for (const m of mappings) {
    if (m.morph_pos === 'syntactic_ar' || m.relation_type === 'syntactic_ar' || m.relation_type === 'compound_phrase') continue;
    if (!m.orig_surface) continue;

    const cleanSurface = isGreek ? cleanGrk(m.orig_surface) : cleanHeb(m.orig_surface);
    if (!cleanSurface) continue;

    // Check if current orig_word_position already matches
    const curPos = m.orig_word_position;
    if (curPos >= 1 && curPos <= cleanTokens.length) {
      const tokAtCur = cleanTokens[curPos - 1];
      if (tokAtCur === cleanSurface || tokAtCur.includes(cleanSurface) || cleanSurface.includes(tokAtCur)) {
        lastAssignedCodexPos = curPos;
        continue; // Already correctly aligned!
      }
    }

    // Find all matching token positions in the verse
    const matches = [];
    cleanTokens.forEach((tok, idx) => {
      if (tok === cleanSurface || tok.includes(cleanSurface) || cleanSurface.includes(tok)) {
        matches.push(idx + 1);
      }
    });

    if (matches.length === 0) continue;

    // Pick the best match: closest to or monotonic with lastAssignedCodexPos
    let bestMatch = matches[0];
    if (matches.length > 1) {
      const forwardMatches = matches.filter(p => p >= lastAssignedCodexPos);
      if (forwardMatches.length > 0) {
        bestMatch = forwardMatches[0];
      } else {
        bestMatch = matches[matches.length - 1];
      }
    }

    if (bestMatch !== curPos) {
      sql += `
      UPDATE word_mappings 
      SET orig_word_position = ${bestMatch} 
      WHERE id = '${m.id}';
      
      UPDATE word_mapping_strongs
      SET orig_word_position = ${bestMatch}
      WHERE mapping_id = '${m.id}' AND link_role = 'primary';
      `;
      updatesCount++;
      lastAssignedCodexPos = bestMatch;
    }
  }
}

sql += 'COMMIT;\n';

runSql(sql);
console.log(`Successfully realigned ${updatesCount} displaced positions to authentic codex coordinates!`);
