/**
 * apply_holdout_round3_batch3j_mark3_11.cjs
 *
 * Applies Batch 3J of Unseen Holdout Round 3: Mark 3:11 (ALL 12 Arabic records, NT Greek)
 * mapped 100% bijectively onto ALL 20 SBLGNT MorphGNT tokens (Mark 3:11 w1..w20):
 *   - Eliminates BOTH false-negative AR_SYNTACTIC records: #8 «قَائِلَةً:» -> G3004@w13 (λέγοντα V- -PAPNPN-)
 *     and #9 ««إِنَّكَ» -> G3754@w14 (ὅτι C- --------),
 *   - Fixes #4 «نَظَرَتْهُ» from wrong G2300@TR:w4 to G2334@w8 (ἐθεώρουν V- 3IAI-P--) + secondary G846@w7,
 *   - Fixes #5 «خَرَّتْ» (G4363@w9 προσέπιπτον) & #7 «وَصَرَخَتْ» (G2896@w12 ἔκραζον + G2532@w11), noting TR 3S variants,
 *   - Fixes #6 «لَهُ» from wrong G1510@w6 to G846@w10 (αὐτῷ RP ----DSM-),
 *   - Completes all article/conjunction/copula secondary components (#1,+w1,+w2; #2,+w4; #10,+w16; #11,+w17; #12,+w19).
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
const mk311 = sblByBook[41].get('3:11');
if (!mk311 || mk311.byIndex.size !== 20) {
  throw new Error(`Expected 20 SBLGNT tokens for Mark 3:11, got ${mk311 ? mk311.byIndex.size : 0}`);
}

const LEMMA_BY_STRONGS = {
  G4151: 'πνεῦμα',
  G169: 'ἀκάθαρτος',
  G3752: 'ὅταν',
  G2334: 'θεωρέω',
  G4363: 'προσπίπτω',
  G846: 'αὐτός',
  G2896: 'κράζω',
  G3004: 'λέγω',
  G3754: 'ὅτι',
  G4771: 'σύ',
  G5207: 'υἱός',
  G2316: 'θεός'
};

const SPEC = [
  {
    arPos: 1, arWord: 'وَالأَرْوَاحُ', strongs: 'G4151', w: 3,
    secondary: [
      { strongs: 'G2532', w: 1, comp: 'καὶ', morph: 'C- --------' },
      { strongs: 'G3588', w: 2, comp: 'τὰ', morph: 'RA ----NPN-' }
    ]
  },
  {
    arPos: 2, arWord: 'النَّجِسَةُ', strongs: 'G169', w: 5,
    secondary: [
      { strongs: 'G3588', w: 4, comp: 'τὰ', morph: 'RA ----NPN-' }
    ]
  },
  { arPos: 3, arWord: 'حِينَمَا', strongs: 'G3752', w: 6 },
  {
    arPos: 4, arWord: 'نَظَرَتْهُ', strongs: 'G2334', w: 8,
    grammarNotes: 'في SBLGNT: ἐθεώρουν (جمع 3P) وفي Scrivener TR: ἐθεώρει (مفرد 3S لمطابقة الفاعل المحايد الجمع τὰ πνεύματα).',
    secondary: [
      { strongs: 'G846', w: 7, comp: 'αὐτὸν', morph: 'RP ----ASM-' }
    ]
  },
  {
    arPos: 5, arWord: 'خَرَّتْ', strongs: 'G4363', w: 9,
    grammarNotes: 'في SBLGNT: προσέπιπτον (جمع 3P) وفي Scrivener TR: προσέπιπτεν (مفرد 3S).'
  },
  { arPos: 6, arWord: 'لَهُ', strongs: 'G846', w: 10 },
  {
    arPos: 7, arWord: 'وَصَرَخَتْ', strongs: 'G2896', w: 12,
    grammarNotes: 'في SBLGNT: ἔκραζον (جمع 3P) وفي Scrivener TR: ἔκραζε (مفرد 3S).',
    secondary: [
      { strongs: 'G2532', w: 11, comp: 'καὶ', morph: 'C- --------' }
    ]
  },
  { arPos: 8, arWord: 'قَائِلَةً:', strongs: 'G3004', w: 13 },
  { arPos: 9, arWord: '«إِنَّكَ', strongs: 'G3754', w: 14 },
  {
    arPos: 10, arWord: 'أَنْتَ', strongs: 'G4771', w: 15,
    secondary: [
      { strongs: 'G1510', w: 16, comp: 'εἶ', morph: 'V- 2PAI-S--' }
    ]
  },
  {
    arPos: 11, arWord: 'ابْنُ', strongs: 'G5207', w: 18,
    secondary: [
      { strongs: 'G3588', w: 17, comp: 'ὁ', morph: 'RA ----NSM-' }
    ]
  },
  {
    arPos: 12, arWord: 'اللهِ!».', strongs: 'G2316', w: 20,
    secondary: [
      { strongs: 'G3588', w: 19, comp: 'τοῦ', morph: 'RA ----GSM-' }
    ]
  }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 20) {
  throw new Error(`Expected 20 covered SBLGNT tokens, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 41 AND vr.chapter_num = 3 AND vr.verse_num = 11
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 12) {
  throw new Error(`Expected 12 DB rows for Mark 3:11, found ${existingRows.length}`);
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
  const tok = mk311.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing SBLGNT token w${item.w}`);

  const d = deriveCanonicalMorphFields('greek', tok.morph, false, {});
  const locator = `SBLGNT:B41.C3.V11.w${item.w}`;
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
        grammar_notes = ${sqlVal(item.grammarNotes || null)}
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

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3j_mark3_11.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3J (Mark 3:11 — 12 records, 20 components, 20/20 unique Greek SBLGNT tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
