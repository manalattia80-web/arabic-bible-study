/**
 * apply_round3_batch3a_lev17_5.cjs
 *
 * Applies Batch 3A of Unseen Holdout Round 3: Leviticus 17:5 (ALL 22 Arabic records)
 * mapped 100% bijectively onto ALL 26 OSHB WLC tokens (Lev.17.5 w1..w26),
 * including reviewing and completing the 1 auto-passing record (#1 لِكَيْ -> w1 + w2)
 * and clearing the 2 stale repeated_referent collisions (#17 -> w20, #22 -> w25).
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

function q(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).replace(/\r/g, '').trim();
}

const { oshbByBook } = loadAllSources();
const lev175 = oshbByBook[3].get('Lev.17.5');
if (!lev175 || lev175.byIndex.size !== 26) {
  throw new Error(`Expected 26 OSHB tokens for Lev.17.5, got ${lev175 ? lev175.byIndex.size : 0}`);
}

// Canonical Strong's lexical forms from strongs_entries
const LEMMA_BY_STRONGS = {
  H4616: 'מַעַן',
  H834: 'אֲשֶׁר',
  H935: 'בּוֹא',
  H1121: 'בֵּן',
  H3478: 'יִשְׂרָאֵל',
  H853: 'אֵת',
  H2077: 'זֶבַח',
  H1992: 'הֵם',
  H2076: 'זָבַח',
  H5921: 'עַל',
  H6440: 'פָּנִים',
  H7704: 'שָׂדֶה',
  H3068: 'יְהֹוָה',
  H413: 'אֵל',
  H6607: 'פֶּתַח',
  H168: 'אֹהֶל',
  H4150: 'מוֹעֵד',
  H3548: 'כֹּהֵן',
  H8002: 'שֶׁלֶם'
};

// Complete 22-record specification covering ALL 26 OSHB tokens (w1..w26)
const SPEC = [
  {
    arPos: 1, arWord: 'لِكَيْ', strongs: 'H4616', w: 1,
    secondary: [
      { strongs: 'H834', w: 2, comp: 'אֲשֶׁ֨ר', morph: 'HTr' }
    ]
  },
  { arPos: 2, arWord: 'يَأْتِيَ', strongs: 'H935', w: 3 },
  { arPos: 3, arWord: 'بَنُو', strongs: 'H1121', w: 4 },
  { arPos: 4, arWord: 'إِسْرَائِيلَ', strongs: 'H3478', w: 5, preserveSingular: true },
  {
    arPos: 5, arWord: 'بِذَبَائِحِهِمِ', strongs: 'H2077', w: 7,
    secondary: [
      { strongs: 'H853', w: 6, comp: 'אֶֽת', morph: 'HTo' }
    ]
  },
  { arPos: 6, arWord: 'الَّتِي', strongs: 'H834', w: 8 },
  {
    arPos: 7, arWord: 'يَذْبَحُونَهَا', strongs: 'H2076', w: 10,
    secondary: [
      { strongs: 'H1992', w: 9, comp: 'הֵ֣ם', morph: 'HPp3mp' }
    ]
  },
  { arPos: 8, arWord: 'عَلَى', strongs: 'H5921', w: 11 },
  { arPos: 9, arWord: 'وَجْهِ', strongs: 'H6440', w: 12 },
  {
    arPos: 10, arWord: 'الصَّحْرَاءِ', strongs: 'H7704', w: 13,
    secondary: [
      { strongs: 'H9009', w: 13, comp: 'הַ', morph: 'HTd' }
    ]
  },
  {
    arPos: 11, arWord: 'وَيُقَدِّمُوهَا', strongs: 'H935', w: 14,
    secondary: [
      { strongs: 'H9002', w: 14, comp: 'וֶֽ', morph: 'HC' }
    ]
  },
  {
    arPos: 12, arWord: 'لِلرَّبِّ', strongs: 'H3068', w: 15, preserveSingular: true,
    secondary: [
      { strongs: 'H9005', w: 15, comp: 'לַֽ', morph: 'HR' }
    ]
  },
  { arPos: 13, arWord: 'إِلَى', strongs: 'H413', w: 16 },
  { arPos: 14, arWord: 'بَابِ', strongs: 'H6607', w: 17 },
  { arPos: 15, arWord: 'خَيْمَةِ', strongs: 'H168', w: 18 },
  { arPos: 16, arWord: 'الاجْتِمَاعِ', strongs: 'H4150', w: 19 },
  { arPos: 17, arWord: 'إِلَى', strongs: 'H413', w: 20 },
  {
    arPos: 18, arWord: 'الْكَاهِنِ،', strongs: 'H3548', w: 21,
    secondary: [
      { strongs: 'H9009', w: 21, comp: 'הַ', morph: 'HTd' }
    ]
  },
  {
    arPos: 19, arWord: 'وَيَذْبَحُوهَا', strongs: 'H2076', w: 22,
    secondary: [
      { strongs: 'H9002', w: 22, comp: 'וְ', morph: 'HC' },
      { strongs: 'H853', w: 26, comp: 'אוֹתָֽם', morph: 'HTo/Sp3mp' }
    ]
  },
  { arPos: 20, arWord: 'ذَبَائِحَ', strongs: 'H2077', w: 23 },
  { arPos: 21, arWord: 'سَلاَمَةٍ', strongs: 'H8002', w: 24 },
  {
    arPos: 22, arWord: 'لِلرَّبِّ.', strongs: 'H3068', w: 25, preserveSingular: true,
    secondary: [
      { strongs: 'H9005', w: 25, comp: 'לַֽ', morph: 'HR' }
    ]
  }
];

// Verify 100% coverage of all 26 OSHB tokens (w1..w26)
const coveredTokens = new Set();
for (const item of SPEC) {
  coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 26) {
  throw new Error(`Expected 26 covered OSHB tokens, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 3 AND vr.chapter_num = 17 AND vr.verse_num = 5
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 22) {
  throw new Error(`Expected 22 DB rows for Lev 17:5, found ${existingRows.length}`);
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
  const tok = lev175.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing OSHB token w${item.w}`);

  const d = deriveCanonicalMorphFields(
    'hebrew',
    tok.morph,
    false,
    item.preserveSingular ? { morphPos: 'proper_noun', morphNumber: 'singular' } : {}
  );

  const locator = `OSHB:B3.C17.V5.w${item.w}`;
  const lemma = LEMMA_BY_STRONGS[item.strongs];
  if (!lemma) throw new Error(`Missing lemma for ${item.strongs}`);

  sql.push(`
    UPDATE word_mappings
    SET strongs_id = ${sqlVal(item.strongs)},
        orig_word = ${sqlVal(lemma)},
        orig_surface = ${sqlVal(tok.text)},
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
        verified_source = 'oshb_wlc',
        morph_source = 'oshb_wlc',
        relation_type = NULL,
        grammar_notes = NULL
    WHERE id = ${sqlVal(dbRow.id)};
  `.trim());

  sql.push(`DELETE FROM word_mapping_strongs WHERE mapping_id = ${sqlVal(dbRow.id)};`);
  sql.push(`
    INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
    VALUES (${sqlVal(dbRow.id)}, ${sqlVal(item.strongs)}, 1, 'primary', ${sqlVal(tok.text)}, ${item.w}, ${sqlVal(tok.morph)}, 'oshb_wlc');
  `.trim());

  let order = 2;
  for (const sec of (item.secondary || [])) {
    sql.push(`
      INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
      VALUES (${sqlVal(dbRow.id)}, ${sqlVal(sec.strongs)}, ${order}, 'secondary', ${sqlVal(sec.comp)}, ${sec.w}, ${sqlVal(sec.morph)}, 'oshb_wlc');
    `.trim());
    order++;
  }
}

sql.push('COMMIT;');

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_round3_batch3a_lev17_5.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3A (Leviticus 17:5 — 22 records, 32 components, 26/26 OSHB tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
