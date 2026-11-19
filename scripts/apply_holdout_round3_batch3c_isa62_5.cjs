/**
 * apply_holdout_round3_batch3c_isa62_5.cjs
 *
 * Applies Batch 3C of Unseen Holdout Round 3: Isaiah 62:5 (ALL 13 Arabic records)
 * mapped 100% bijectively onto ALL 13 OSHB WLC tokens (Isa.62.5 w1..w13):
 *   - #1 «لأَنَّهُ» + #2 «كَمَا» linked as a documented compound_phrase unit to w1 כִּֽי (H3588, HC),
 *   - Eliminates all 4 false-negative AR_SYNTACTIC records (#3 يَتَزَوَّجُ -> w2, #6 يَتَزَوَّجُكِ -> w5,
 *     #7 بَنُوكِ -> w6, #8 وَكَفَرَحِ -> w7 + H9002),
 *   - Fixes +1 alignment slips (#4, #5, #9), wrong H2860 on #10 بِالْعَرُوسِ (-> H3618@w10 + secondary H5921@w9),
 *     wrong H413 on #12 بِكِ (-> H5921@w12 HR/Sp2fs), and wrong Aramaic H426 on #13 إِلهُكِ (-> H430@w13 HNcmpc/Sp2fs),
 *   - Reviews and verifies the 1 auto-clean record (#11 يَفْرَحُ -> H7797@w11 HVqi3ms).
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
const isa625 = oshbByBook[23].get('Isa.62.5');
if (!isa625 || isa625.byIndex.size !== 13) {
  throw new Error(`Expected 13 OSHB tokens for Isa.62.5, got ${isa625 ? isa625.byIndex.size : 0}`);
}

const LEMMA_BY_STRONGS = {
  H3588: 'כִּי',
  H1166: 'בָּעַל',
  H970: 'בָּחוּר',
  H1330: 'בְּתוּלָה',
  H1121: 'בֵּן',
  H4885: 'מָשׂוֹשׂ',
  H2860: 'חָתָן',
  H5921: 'עַל',
  H3618: 'כַּלָּה',
  H7797: 'שׂוּשׂ',
  H430: 'אֱלֹהִים'
};

const SPEC = [
  {
    arPos: 1, arWord: 'لأَنَّهُ', strongs: 'H3588', w: 1,
    relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): «لأَنَّهُ كَمَا» تترجم أداة التعليل والتشبيه العبرية כִּֽי (H3588, HC) عند w1.'
  },
  {
    arPos: 2, arWord: 'كَمَا', strongs: 'H3588', w: 1,
    relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): العنصر التشبيهي في «لأَنَّهُ كَمَا» المقابل لأداة التعليل والتشبيه العبرية כִּֽי (H3588, HC) عند w1.'
  },
  { arPos: 3, arWord: 'يَتَزَوَّجُ', strongs: 'H1166', w: 2 },
  { arPos: 4, arWord: 'الشَّابُّ', strongs: 'H970', w: 3 },
  { arPos: 5, arWord: 'عَذْرَاءَ', strongs: 'H1330', w: 4 },
  { arPos: 6, arWord: 'يَتَزَوَّجُكِ', strongs: 'H1166', w: 5 },
  { arPos: 7, arWord: 'بَنُوكِ', strongs: 'H1121', w: 6 },
  {
    arPos: 8, arWord: 'وَكَفَرَحِ', strongs: 'H4885', w: 7,
    grammarNotes: 'الكاف التشبيهية في «وَكَفَرَحِ» تؤدي التركيب التشبيهي الضمني في العبرية (וּמְשׂוֹשׂ ... יָשִׂישׂ)، والأصل المباشر هو וּמְשׂ֤וֹשׂ (H4885 + H9002) عند w7.',
    secondary: [
      { strongs: 'H9002', w: 7, comp: 'וּ', morph: 'HC' }
    ]
  },
  { arPos: 9, arWord: 'الْعَرِيسِ', strongs: 'H2860', w: 8 },
  {
    arPos: 10, arWord: 'بِالْعَرُوسِ', strongs: 'H3618', w: 10,
    secondary: [
      { strongs: 'H5921', w: 9, comp: 'עַל', morph: 'HR' }
    ]
  },
  { arPos: 11, arWord: 'يَفْرَحُ', strongs: 'H7797', w: 11 },
  { arPos: 12, arWord: 'بِكِ', strongs: 'H5921', w: 12 },
  { arPos: 13, arWord: 'إِلهُكِ', strongs: 'H430', w: 13 }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 13) {
  throw new Error(`Expected 13 covered OSHB tokens, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 23 AND vr.chapter_num = 62 AND vr.verse_num = 5
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 13) {
  throw new Error(`Expected 13 DB rows for Isa 62:5, found ${existingRows.length}`);
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
  const tok = isa625.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing OSHB token w${item.w}`);

  const d = deriveCanonicalMorphFields('hebrew', tok.morph, false, {});
  const locator = `OSHB:B23.C62.V5.w${item.w}`;
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
        relation_type = ${sqlVal(item.relationType || null)},
        grammar_notes = ${sqlVal(item.grammarNotes || null)}
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

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3c_isa62_5.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3C (Isaiah 62:5 — 13 records, 15 components, 13/13 unique OSHB tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
