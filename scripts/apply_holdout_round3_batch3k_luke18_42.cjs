/**
 * apply_holdout_round3_batch3k_luke18_42.cjs
 *
 * Applies Batch 3K of Unseen Holdout Round 3: Luke 18:42 (ALL 7 Arabic records, NT Greek)
 * mapped 100% bijectively onto ALL 11 SBLGNT MorphGNT tokens (Luke 18:42 w1..w11):
 *   - Eliminates the false-negative at #1 «فَقَالَ»: restores main verb G3004@w4 (εἶπεν V- 3AAI-S--)
 *     with secondary conjunction G2532@w1 (καὶ),
 *   - Fixes #2 «لَهُ» (w2 -> w5 αὐτῷ), #3 «يَسُوعُ» (morph_pos=noun + secondary G3588@w2 ὁ),
 *     #4 «أَبْصِرْ» (w4 -> w6 Ἀνάβλεψον), #5 «إِيمَانُكَ» (w5 -> w8 πίστις + G3588@w7 + G4771@w9),
 *   - Reviews and normalizes #6 «قَدْ» as AR_SYNTACTIC:B42.C18.V42.w6 (orig_word_position=NULL, 0 components),
 *   - Fixes #7 «شَفَاكَ» from lexical TR:w7 (NULL morph) to G4982@w10 (σέσωκέν V- 3XAI-S--) + secondary G4771@w11 (σε).
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
const lk1842 = sblByBook[42].get('18:42');
if (!lk1842 || lk1842.byIndex.size !== 11) {
  throw new Error(`Expected 11 SBLGNT tokens for Luke 18:42, got ${lk1842 ? lk1842.byIndex.size : 0}`);
}

const LEMMA_BY_STRONGS = {
  G3004: 'λέγω',
  G846: 'αὐτός',
  G2424: 'Ἰησοῦς',
  G308: 'ἀναβλέπω',
  G4102: 'πίστις',
  G4982: 'σῴζω'
};

const SPEC = [
  {
    arPos: 1, arWord: 'فَقَالَ', strongs: 'G3004', w: 4,
    secondary: [{ strongs: 'G2532', w: 1, comp: 'καὶ', morph: 'C- --------' }]
  },
  { arPos: 2, arWord: 'لَهُ', strongs: 'G846', w: 5 },
  {
    arPos: 3, arWord: 'يَسُوعُ', strongs: 'G2424', w: 3,
    secondary: [{ strongs: 'G3588', w: 2, comp: 'ὁ', morph: 'RA ----NSM-' }]
  },
  { arPos: 4, arWord: 'أَبْصِرْ', strongs: 'G308', w: 6 },
  {
    arPos: 5, arWord: 'إِيمَانُكَ', strongs: 'G4102', w: 8,
    secondary: [
      { strongs: 'G3588', w: 7, comp: 'ἡ', morph: 'RA ----NSF-' },
      { strongs: 'G4771', w: 9, comp: 'σου', morph: 'RP ----GS--' }
    ]
  },
  {
    arPos: 6, arWord: 'قَدْ', syntactic: true,
    locator: 'AR_SYNTACTIC:B42.C18.V42.w6',
    relationType: 'syntactic_ar',
    grammarNotes: 'حرف تحقيق عربي يؤازر صيغة الماضي التام اليوناني σέσωκέν (G4982 عند w10).'
  },
  {
    arPos: 7, arWord: 'شَفَاكَ', strongs: 'G4982', w: 10,
    secondary: [{ strongs: 'G4771', w: 11, comp: 'σε', morph: 'RP ----AS--' }]
  }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  if (!item.syntactic) coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 11) {
  throw new Error(`Expected 11 covered SBLGNT tokens, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 42 AND vr.chapter_num = 18 AND vr.verse_num = 42
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 7) {
  throw new Error(`Expected 7 DB rows for Luke 18:42, found ${existingRows.length}`);
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

  if (item.syntactic) {
    sql.push(`
      UPDATE word_mappings
      SET strongs_id = NULL,
          orig_word = '—',
          orig_surface = '—',
          orig_word_position = NULL,
          orig_morphology = NULL,
          morph_pos = 'syntactic_ar',
          morph_stem = NULL,
          morph_tense = NULL,
          morph_voice = NULL,
          morph_mood = NULL,
          morph_person = NULL,
          morph_number = NULL,
          morph_gender = NULL,
          morph_case = NULL,
          verified_locator = ${sqlVal(item.locator)},
          verified_source = 'syntactic_ar',
          morph_source = 'syntactic_ar',
          relation_type = ${sqlVal(item.relationType)},
          grammar_notes = ${sqlVal(item.grammarNotes)}
      WHERE id = ${sqlVal(dbRow.id)};
    `.trim());
    sql.push(`DELETE FROM word_mapping_strongs WHERE mapping_id = ${sqlVal(dbRow.id)};`);
    continue;
  }

  const tok = lk1842.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing SBLGNT token w${item.w}`);

  const d = deriveCanonicalMorphFields('greek', tok.morph, false, {});
  const locator = `SBLGNT:B42.C18.V42.w${item.w}`;
  const lemma = LEMMA_BY_STRONGS[item.strongs];
  if (!lemma) throw new Error(`Missing lemma for ${item.strongs}`);

  sql.push(`
    UPDATE word_mappings
    SET strongs_id = ${sqlVal(item.strongs)},
        orig_word = ${sqlVal(lemma)},
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
    sql.push(`
      INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
      VALUES (${sqlVal(dbRow.id)}, ${sqlVal(sec.strongs)}, ${order}, 'secondary', ${sqlVal(sec.comp)}, ${sec.w}, ${sqlVal(sec.morph)}, 'morphgnt_sblgnt');
    `.trim());
    order++;
  }
}

sql.push('COMMIT;');

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3k_luke18_42.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3K (Luke 18:42 — 7 records, 11 components, 11/11 unique Greek SBLGNT tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
