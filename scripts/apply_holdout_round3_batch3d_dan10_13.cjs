/**
 * apply_holdout_round3_batch3d_dan10_13.cjs
 *
 * Applies Batch 3D of Unseen Holdout Round 3: Daniel 10:13 (ALL 22 Arabic records, Hebrew text)
 * mapped 100% bijectively onto ALL 21 OSHB WLC tokens (Dan.10.13 w1..w21):
 *   - Reviews and completes all 7 auto-clean records (#1,+H9002; #3; #4; #5,+H9005; #8; #9,+H9002; #10),
 *   - Fixes #2 «مَمْلَكَةِ» from Aramaic H4437 to Hebrew H4438 (מַלְכ֣וּת HNcfsc),
 *   - Fixes swapped compound numeral order #6 «وَاحِدًا» -> w7 (וְאֶחָ֣ד + H9002) & #7 «وَعِشْرِينَ» -> w6 (עֶשְׂרִ֣ים),
 *   - Fixes #11 «وَاحِدٌ» surface/morph to exact w11 אַחַ֛ד (HAcmsa, without waw),
 *   - Marks #12 «مِنَ» as AR_SYNTACTIC:B27.C10.V13.w12 (Arabic partitive preposition, removing wrong H4480),
 *   - Fixes #14 «الأَوَّلِينَ» from wrong H259 to H7223 (הָרִאשֹׁנִ֖ים HTd/Aampa + H9009 @ w13),
 *   - Fixes all +1 slips (#13..#22) including out-of-bounds #22 «فَارِسَ» (w22 -> w21 פָרָֽס).
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
const dan1013 = oshbByBook[27].get('Dan.10.13');
if (!dan1013 || dan1013.byIndex.size !== 21) {
  throw new Error(`Expected 21 OSHB tokens for Dan.10.13, got ${dan1013 ? dan1013.byIndex.size : 0}`);
}

const LEMMA_BY_STRONGS = {
  H8269: 'שַׂר',
  H4438: 'מַלְכוּת',
  H6539: 'פָּרַס',
  H5975: 'עָמַד',
  H5048: 'נֶגֶד',
  H6242: 'עֶשְׂרִים',
  H259: 'אֶחָד',
  H3117: 'יוֹם',
  H2009: 'הִנֵּה',
  H4317: 'מִיכָאֵל',
  H7223: 'רִאשׁוֹן',
  H935: 'בּוֹא',
  H5826: 'עָזַר',
  H589: 'אֲנִי',
  H3498: 'יָתַר',
  H8033: 'שָׁם',
  H681: 'אֵצֶל',
  H4428: 'מֶלֶךְ'
};

const SPEC = [
  {
    arPos: 1, arWord: 'وَرَئِيسُ', strongs: 'H8269', w: 1,
    secondary: [{ strongs: 'H9002', w: 1, comp: 'וְ', morph: 'HC' }]
  },
  { arPos: 2, arWord: 'مَمْلَكَةِ', strongs: 'H4438', w: 2 },
  { arPos: 3, arWord: 'فَارِسَ', strongs: 'H6539', w: 3, preserveSingular: true },
  { arPos: 4, arWord: 'وَقَفَ', strongs: 'H5975', w: 4 },
  {
    arPos: 5, arWord: 'مُقَابِلِي', strongs: 'H5048', w: 5,
    secondary: [{ strongs: 'H9005', w: 5, comp: 'לְ', morph: 'HR' }]
  },
  {
    arPos: 6, arWord: 'وَاحِدًا', strongs: 'H259', w: 7,
    secondary: [{ strongs: 'H9002', w: 7, comp: 'וְ', morph: 'HC' }]
  },
  { arPos: 7, arWord: 'وَعِشْرِينَ', strongs: 'H6242', w: 6 },
  { arPos: 8, arWord: 'يَوْمًا', strongs: 'H3117', w: 8 },
  {
    arPos: 9, arWord: 'وَهُوَذَا', strongs: 'H2009', w: 9,
    secondary: [{ strongs: 'H9002', w: 9, comp: 'וְ', morph: 'HC' }]
  },
  { arPos: 10, arWord: 'مِيخَائِيلُ', strongs: 'H4317', w: 10, preserveSingular: true },
  { arPos: 11, arWord: 'وَاحِدٌ', strongs: 'H259', w: 11 },
  {
    arPos: 12, arWord: 'مِنَ', syntactic: true,
    locator: 'AR_SYNTACTIC:B27.C10.V13.w12',
    relationType: 'syntactic_ar',
    grammarNotes: 'حرف جر بياني عربي يعبّر عن علاقة الإضافة التبعيضية بين אַחַ֛ד (w11) وהַשָּׂרִ֥ים (w12) دون وجود حرف מִן في النص العبري.'
  },
  {
    arPos: 13, arWord: 'الرُّؤَسَاءِ', strongs: 'H8269', w: 12,
    secondary: [{ strongs: 'H9009', w: 12, comp: 'הַ', morph: 'HTd' }]
  },
  {
    arPos: 14, arWord: 'الأَوَّلِينَ', strongs: 'H7223', w: 13,
    secondary: [{ strongs: 'H9009', w: 13, comp: 'הָ', morph: 'HTd' }]
  },
  { arPos: 15, arWord: 'جَاءَ', strongs: 'H935', w: 14 },
  {
    arPos: 16, arWord: 'لإِعَانَتِي', strongs: 'H5826', w: 15,
    secondary: [{ strongs: 'H9005', w: 15, comp: 'לְ', morph: 'HR' }]
  },
  {
    arPos: 17, arWord: 'وَأَنَا', strongs: 'H589', w: 16,
    secondary: [{ strongs: 'H9002', w: 16, comp: 'וַ', morph: 'HC' }]
  },
  { arPos: 18, arWord: 'أُبْقِيتُ', strongs: 'H3498', w: 17 },
  { arPos: 19, arWord: 'هُنَاكَ', strongs: 'H8033', w: 18 },
  { arPos: 20, arWord: 'عِنْدَ', strongs: 'H681', w: 19 },
  { arPos: 21, arWord: 'مُلُوكِ', strongs: 'H4428', w: 20 },
  { arPos: 22, arWord: 'فَارِسَ', strongs: 'H6539', w: 21, preserveSingular: true }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  if (!item.syntactic) coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 21) {
  throw new Error(`Expected 21 covered OSHB tokens, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 27 AND vr.chapter_num = 10 AND vr.verse_num = 13
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 22) {
  throw new Error(`Expected 22 DB rows for Dan 10:13, found ${existingRows.length}`);
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

  const tok = dan1013.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing OSHB token w${item.w}`);

  const d = deriveCanonicalMorphFields(
    'hebrew',
    tok.morph,
    false,
    item.preserveSingular ? { morphPos: 'proper_noun', morphNumber: 'singular' } : {}
  );
  const locator = `OSHB:B27.C10.V13.w${item.w}`;
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

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3d_dan10_13.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3D (Daniel 10:13 — 22 records, 29 components, 21/21 unique OSHB tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
