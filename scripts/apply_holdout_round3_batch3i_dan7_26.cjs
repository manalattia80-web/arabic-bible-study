/**
 * apply_holdout_round3_batch3i_dan7_26.cjs
 *
 * Applies Batch 3I of Unseen Holdout Round 3: Daniel 7:26 (ALL 9 Arabic records, Biblical Aramaic)
 * mapped 100% bijectively onto ALL 8 OSHB WLC tokens (Dan.7.26 w1..w8), completing ALL 4 Aramaic verses (54/54):
 *   - #1 «فَيَجْلِسُ» -> w2 יִתִּ֑ב (H3488 AVqi3ms, replacing H3428 يشبآب!) + secondary H9002@w1,
 *   - #2 «الدِّينُ» -> w1 וְדִינָ֖א (H1780 AC/Ncmsd/Td, determined, replacing H1782) + secondary H9002@w1,
 *   - #3 «وَيَنْزِعُونَ» -> w4 יְהַעְדּ֔וֹן (H5709 AVhi3mp, replacing H5758) + secondary H9002@w3,
 *   - #4 «عَنْهُ» -> AR_SYNTACTIC:B27.C7.V26.w4 (syntactic_ar, 0 components, replacing wrong H4481),
 *   - #5 «سُلْطَانَهُ» -> w3 וְשָׁלְטָנֵ֣הּ (H7985 AC/Ncmsc/Sp3ms, replacing H7986) + secondary H9002@w3,
 *   - #6 «لِيَفْنَوْا» -> w5 לְהַשְׁמָדָ֥ה (H8046 AR/Vhc, replacing H5487) + secondary H9005@w5,
 *   - #7 «وَيَبِيدُوا» -> w6 וּלְהוֹבָדָ֖ה (H7 AC/R/Vhc, replacing H6566) + secondary H9002@w6 + H9005@w6,
 *   - #8 «إِلَى» -> w7 עַד (H5705 AR),
 *   - #9 «الْمُنْتَهَى» -> w8 סוֹפָֽא (H5491 ANcmsd/Td, determined, fixing out-of-bounds w9 & wrong H5482).
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

const { oshbByBook } = loadAllSources();
const dan726 = oshbByBook[27].get('Dan.7.26');
if (!dan726 || dan726.byIndex.size !== 8) {
  throw new Error(`Expected 8 OSHB tokens for Dan.7.26, got ${dan726 ? dan726.byIndex.size : 0}`);
}

const LEMMA_BY_STRONGS = {
  H3488: 'יְתִב',
  H1780: 'דִּין',
  H5709: 'עֲדָא',
  H7985: 'שׇׁלְטָן',
  H8046: 'שְׁמַד',
  H7: 'אֲבַד',
  H5705: 'עַד',
  H5491: 'סוֹף'
};

const SPEC = [
  {
    arPos: 1, arWord: 'فَيَجْلِسُ', strongs: 'H3488', w: 2,
    secondary: [{ strongs: 'H9002', w: 1, comp: 'וְ', morph: 'AC' }]
  },
  {
    arPos: 2, arWord: 'الدِّينُ', strongs: 'H1780', w: 1,
    secondary: [{ strongs: 'H9002', w: 1, comp: 'וְ', morph: 'AC' }]
  },
  {
    arPos: 3, arWord: 'وَيَنْزِعُونَ', strongs: 'H5709', w: 4,
    secondary: [{ strongs: 'H9002', w: 3, comp: 'וְ', morph: 'AC' }]
  },
  {
    arPos: 4, arWord: 'عَنْهُ', syntactic: true,
    locator: 'AR_SYNTACTIC:B27.C7.V26.w4',
    relationType: 'syntactic_ar',
    grammarNotes: 'جار ومجرور عربي مكمل لتعدية «يَنْزِعُونَ عَنْهُ سُلْطَانَهُ» بينما الآرامية וְשָׁלְטָנֵ֣הּ יְהַעְדּ֔וֹן تعدّي الفعل مباشرة.'
  },
  {
    arPos: 5, arWord: 'سُلْطَانَهُ', strongs: 'H7985', w: 3,
    secondary: [{ strongs: 'H9002', w: 3, comp: 'וְ', morph: 'AC' }]
  },
  {
    arPos: 6, arWord: 'لِيَفْنَوْا', strongs: 'H8046', w: 5,
    secondary: [{ strongs: 'H9005', w: 5, comp: 'לְ', morph: 'AR' }]
  },
  {
    arPos: 7, arWord: 'وَيَبِيدُوا', strongs: 'H7', w: 6,
    secondary: [
      { strongs: 'H9002', w: 6, comp: 'וּ', morph: 'AC' },
      { strongs: 'H9005', w: 6, comp: 'לְ', morph: 'R' }
    ]
  },
  { arPos: 8, arWord: 'إِلَى', strongs: 'H5705', w: 7 },
  { arPos: 9, arWord: 'الْمُنْتَهَى', strongs: 'H5491', w: 8 }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  if (!item.syntactic) coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 8) {
  throw new Error(`Expected 8 covered OSHB tokens, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 27 AND vr.chapter_num = 7 AND vr.verse_num = 26
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 9) {
  throw new Error(`Expected 9 DB rows for Dan 7:26, found ${existingRows.length}`);
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

  const tok = dan726.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing OSHB token w${item.w}`);

  const d = deriveCanonicalMorphFields('aramaic', tok.morph, false, {});
  const locator = `OSHB:B27.C7.V26.w${item.w}`;
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

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3i_dan7_26.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3I (Daniel 7:26 — 9 records, 15 components, 8/8 unique Aramaic OSHB tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
