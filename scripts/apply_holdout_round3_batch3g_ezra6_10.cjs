/**
 * apply_holdout_round3_batch3g_ezra6_10.cjs
 *
 * Applies Batch 3G of Unseen Holdout Round 3: Ezra 6:10 (ALL 11 Arabic records, Biblical Aramaic)
 * mapped 100% bijectively onto ALL 10 OSHB WLC tokens (Ezra.6.10 w1..w10):
 *   - #1 «عَنْ» -> w1 דִּֽי (H1768 AC, replacing wrong H4481),
 *   - #2 «تَقْرِيبِ» -> w3 מְהַקְרְבִ֛ין (H7127 AVhrmpa, unified voice=active) + secondary H1934@w2 (לֶהֱוֺ֧ן:AVqi3mp),
 *   - #3 «رَوَائِحِ» + #4 «سُرُورٍ» -> shared compound_phrase on w4 נִיחוֹחִ֖ין (H5208 ANcmpa, fixing surface נִיחֹוחִין -> נִיחוֹחִ֖ין),
 *   - #5 «لإِلهِ» (auto-clean reviewed) -> w5 לֶאֱלָ֣הּ (H426 AR/Ncmsc) + secondary H9005@w5,
 *   - #6 «السَّمَاءِ» (auto-clean reviewed) -> w6 שְׁמַיָּ֑א (H8065 ANcmpd/Td, determined),
 *   - #7 «وَالصَّلاَةِ» -> w7 וּמְצַלַּ֕יִן (H6739 AC/Vprmpa, replacing wrong H1934) + secondary H9002@w7,
 *   - #8 «لأَجْلِ» + #9 «حَيَاةِ» -> shared compound_phrase on w8 לְחַיֵּ֥י (H9005 לְ:AR + H2417 לְחַיֵּ֥י:AR/Ncmpc + secondary H9005),
 *   - #10 «الْمَلِكِ» -> w9 מַלְכָּ֖א (H4430 ANcmsd/Td, filling missing morph_case=determined),
 *   - #11 «وَبَنِيهِ» -> w10 וּבְנֽוֹהִי (H1123 AC/Ncmpc/Sp3ms, fixing out-of-bounds w11) + secondary H9002@w10.
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
const ezra610 = oshbByBook[15].get('Ezra.6.10');
if (!ezra610 || ezra610.byIndex.size !== 10) {
  throw new Error(`Expected 10 OSHB tokens for Ezra.6.10, got ${ezra610 ? ezra610.byIndex.size : 0}`);
}

const LEMMA_BY_STRONGS = {
  H1768: 'דִּי',
  H7127: 'קְרֵב',
  H5208: 'נִיחוֹחַ',
  H426: 'אֱלָהּ',
  H8065: 'שָׁמַיִן',
  H6739: 'צְלָא',
  H9005: 'לְ',
  H2417: 'חַי',
  H4430: 'מֶלֶךְ',
  H1123: 'בֵּן'
};

const SPEC = [
  { arPos: 1, arWord: 'عَنْ', strongs: 'H1768', w: 1 },
  {
    arPos: 2, arWord: 'تَقْرِيبِ', strongs: 'H7127', w: 3,
    secondary: [{ strongs: 'H1934', w: 2, comp: 'לֶהֱוֺ֧ן', morph: 'AVqi3mp' }]
  },
  {
    arPos: 3, arWord: 'رَوَائِحِ', strongs: 'H5208', w: 4,
    relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): «رَوَائِحِ سُرُورٍ» تترجم معًا الاسم الآرامي الواحد נִיחוֹחִ֖ין (H5208, ANcmpa) عند w4.'
  },
  {
    arPos: 4, arWord: 'سُرُورٍ', strongs: 'H5208', w: 4,
    relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): «رَوَائِحِ سُرُورٍ» تترجم معًا الاسم الآرامي الواحد נִיחוֹחִ֖ין (H5208, ANcmpa) عند w4.'
  },
  {
    arPos: 5, arWord: 'لإِلهِ', strongs: 'H426', w: 5,
    secondary: [{ strongs: 'H9005', w: 5, comp: 'לֶ', morph: 'AR' }]
  },
  { arPos: 6, arWord: 'السَّمَاءِ', strongs: 'H8065', w: 6 },
  {
    arPos: 7, arWord: 'وَالصَّلاَةِ', strongs: 'H6739', w: 7,
    secondary: [{ strongs: 'H9002', w: 7, comp: 'וּ', morph: 'AC' }]
  },
  {
    arPos: 8, arWord: 'لأَجْلِ', strongs: 'H9005', w: 8,
    overrideSurface: 'לְ', overrideMorph: 'AR', relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): اللام الجارة לְ (H9005, AR) الملتصقة بـ לְחַיֵּ֥י عند w8.'
  },
  {
    arPos: 9, arWord: 'حَيَاةِ', strongs: 'H2417', w: 8,
    relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): الاسم المضاف לְחַיֵּ֥י (H2417, AR/Ncmpc) المسبوق باللام לְ (H9005) عند w8.',
    secondary: [{ strongs: 'H9005', w: 8, comp: 'לְ', morph: 'AR' }]
  },
  { arPos: 10, arWord: 'الْمَلِكِ', strongs: 'H4430', w: 9 },
  {
    arPos: 11, arWord: 'وَبَنِيهِ', strongs: 'H1123', w: 10,
    secondary: [{ strongs: 'H9002', w: 10, comp: 'וּ', morph: 'AC' }]
  }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 10) {
  throw new Error(`Expected 10 covered OSHB tokens, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 15 AND vr.chapter_num = 6 AND vr.verse_num = 10
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 11) {
  throw new Error(`Expected 11 DB rows for Ezra 6:10, found ${existingRows.length}`);
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
  const tok = ezra610.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing OSHB token w${item.w}`);

  const surface = item.overrideSurface || tok.text;
  const morph = item.overrideMorph || tok.morph;
  const d = deriveCanonicalMorphFields('aramaic', morph, false, {});
  const locator = `OSHB:B15.C6.V10.w${item.w}`;
  const lemma = LEMMA_BY_STRONGS[item.strongs];
  if (!lemma) throw new Error(`Missing lemma for ${item.strongs}`);

  sql.push(`
    UPDATE word_mappings
    SET strongs_id = ${sqlVal(item.strongs)},
        orig_word = ${sqlVal(lemma)},
        orig_surface = ${sqlVal(surface)},
        orig_word_position = ${item.w},
        orig_morphology = ${sqlVal(morph)},
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
    VALUES (${sqlVal(dbRow.id)}, ${sqlVal(item.strongs)}, 1, 'primary', ${sqlVal(surface)}, ${item.w}, ${sqlVal(morph)}, 'oshb_wlc');
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

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3g_ezra6_10.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3G (Ezra 6:10 — 11 records, 16 components, 10/10 unique Aramaic OSHB tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
