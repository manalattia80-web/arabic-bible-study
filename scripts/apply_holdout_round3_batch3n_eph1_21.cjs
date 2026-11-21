/**
 * apply_holdout_round3_batch3n_eph1_21.cjs
 *
 * Applies Batch 3N of Unseen Holdout Round 3: Ephesians 1:21 (ALL 18 Arabic records, NT Greek)
 * mapped 100% bijectively onto ALL 24 SBLGNT MorphGNT tokens (w1..w24):
 *   - Fixes #1 «فَوْقَ» (was G3588 ὁ -> G5231 ὑπεράνω @ w1),
 *   - Attaches all 4 conjunctions G2532 (καὶ @ w4, w6, w8, w10) to #4..#7,
 *   - Disambiguates the two occurrences of ἐν (G1722):
 *       * #11 «فِي» (هذَا الدَّهْرِ) -> w16 (first ἐν),
 *       * #16 «فِي» (الْمُسْتَقْبَلِ) -> w22 (second ἐν — eliminating false-negative duplicate-occurrence collision at w16!),
 *   - Fixes #14 «فَقَطْ» from lexical TR:w14 (NULL morph) to SBLGNT w15 (μόνον, G3441, A- ----ASN-),
 *   - Fixes #18 «أَيْضًا» from lexical TR:w18 (NULL morph) to SBLGNT w21 (καὶ, G2532, D- --------),
 *   - Attaches articles G3588@w17 to #13 «الدَّهْرِ» and G3588@w23 to #17 «الْمُسْتَقْبَلِ».
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { loadAllSources, deriveCanonicalMorphFields } = require('./full_66_books_audit_helpers.cjs');

const repoRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = process.env.AUDIT_DB_PATH || path.join(repoRoot, 'mobile/assets/bible_study.db');

const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sqlVal = v => (v === null || v === undefined || v === '') ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const q = sql => execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).replace(/\r/g, '').trim();

const { sblByBook } = loadAllSources();
const sbl = sblByBook[49].get('1:21');
if (!sbl || sbl.byIndex.size !== 24) {
  throw new Error(`Expected 24 SBLGNT tokens for Eph 1:21, got ${sbl ? sbl.byIndex.size : 0}`);
}

const SPEC = [
  { arPos: 1,  arWord: 'فَوْقَ',         strongs: 'G5231', w: 1 },
  { arPos: 2,  arWord: 'كُلِّ',          strongs: 'G3956', w: 2 },
  { arPos: 3,  arWord: 'رِيَاسَةٍ',       strongs: 'G746',  w: 3 },
  { arPos: 4,  arWord: 'وَسُلْطَانٍ',     strongs: 'G1849', w: 5,  secondary: [{ strongs: 'G2532', w: 4 }] },
  { arPos: 5,  arWord: 'وَقُوَّةٍ',       strongs: 'G1411', w: 7,  secondary: [{ strongs: 'G2532', w: 6 }] },
  { arPos: 6,  arWord: 'وَسِيَادَةٍ',     strongs: 'G2963', w: 9,  secondary: [{ strongs: 'G2532', w: 8 }] },
  { arPos: 7,  arWord: 'وَكُلِّ',         strongs: 'G3956', w: 11, secondary: [{ strongs: 'G2532', w: 10 }] },
  { arPos: 8,  arWord: 'اسْمٍ',          strongs: 'G3686', w: 12 },
  { arPos: 9,  arWord: 'يُسَمَّى',        strongs: 'G3687', w: 13 },
  { arPos: 10, arWord: 'لَيْسَ',          strongs: 'G3756', w: 14 },
  { arPos: 11, arWord: 'فِي',            strongs: 'G1722', w: 16 },
  { arPos: 12, arWord: 'هذَا',           strongs: 'G3778', w: 19 },
  { arPos: 13, arWord: 'الدَّهْرِ',       strongs: 'G165',  w: 18, secondary: [{ strongs: 'G3588', w: 17 }] },
  { arPos: 14, arWord: 'فَقَطْ',          strongs: 'G3441', w: 15 },
  { arPos: 15, arWord: 'بَلْ',           strongs: 'G235',  w: 20 },
  { arPos: 16, arWord: 'فِي',            strongs: 'G1722', w: 22 },
  { arPos: 17, arWord: 'الْمُسْتَقْبَلِ', strongs: 'G3195', w: 24, secondary: [{ strongs: 'G3588', w: 23 }] },
  { arPos: 18, arWord: 'أَيْضًا',         strongs: 'G2532', w: 21 }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 24) {
  throw new Error(`Expected 24 covered unique SBLGNT tokens for Eph 1:21, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 49 AND vr.chapter_num = 1 AND vr.verse_num = 21
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 18) {
  throw new Error(`Expected 18 DB rows for Eph 1:21, found ${existingRows.length}`);
}

const rowByPos = new Map();
for (const r of existingRows) {
  const [posStr, id, arWord] = r.split('|');
  rowByPos.set(parseInt(posStr, 10), { id, arWord });
}

const preSha = sha256File(dbPath);
const sql = ['BEGIN TRANSACTION;'];

for (const item of SPEC) {
  const dbRow = rowByPos.get(item.arPos);
  if (!dbRow || dbRow.arWord !== item.arWord) {
    throw new Error(`Row mismatch at pos #${item.arPos}: expected '${item.arWord}', got '${dbRow ? dbRow.arWord : 'MISSING'}'`);
  }

  const tok = sbl.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing SBLGNT token w${item.w}`);

  const d = deriveCanonicalMorphFields('greek', tok.morph, false, {});
  const locator = `SBLGNT:B49.C1.V21.w${item.w}`;

  sql.push(`
    UPDATE word_mappings
    SET strongs_id = ${sqlVal(item.strongs)},
        orig_word = ${sqlVal(tok.lemma)},
        orig_surface = ${sqlVal(tok.surfaceClean)},
        orig_word_position = ${item.w},
        orig_morphology = ${sqlVal(tok.morph)},
        morph_pos = ${sqlVal(d.morphPos)},
        morph_stem = ${sqlVal(d.morphStem)},
        morph_tense = ${sqlVal(d.morphTense)},
        morph_voice = ${sqlVal(d.morphVoice)},
        morph_mood = ${sqlVal(d.morphMood)},
        morph_person = ${sqlVal(d.morphPerson)},
        morph_number = ${sqlVal(d.morphNumber)},
        morph_gender = ${sqlVal(d.morphGender)},
        morph_case = ${sqlVal(d.morphCase)},
        verified_locator = ${sqlVal(locator)},
        verified_source = 'morphgnt_sblgnt',
        morph_source = 'morphgnt_sblgnt',
        relation_type = NULL,
        grammar_notes = NULL
    WHERE id = ${sqlVal(dbRow.id)};
  `.trim());

  sql.push(`DELETE FROM word_mapping_strongs WHERE mapping_id = ${sqlVal(dbRow.id)};`);
  sql.push(`
    INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
    VALUES (${sqlVal(dbRow.id)}, ${sqlVal(item.strongs)}, 1, 'primary', ${sqlVal(tok.surfaceClean)}, ${item.w}, ${sqlVal(tok.morph)}, 'morphgnt_sblgnt');
  `.trim());

  let order = 2;
  for (const sec of (item.secondary || [])) {
    const sTok = sbl.byIndex.get(sec.w);
    sql.push(`
      INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
      VALUES (${sqlVal(dbRow.id)}, ${sqlVal(sec.strongs)}, ${order}, 'secondary', ${sqlVal(sTok.surfaceClean)}, ${sec.w}, ${sqlVal(sTok.morph)}, 'morphgnt_sblgnt');
    `.trim());
    order++;
  }
}

sql.push('COMMIT;');

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3n_eph1_21.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3N (Ephesians 1:21 — 18 records, 24 components, 24/24 unique Greek SBLGNT tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
