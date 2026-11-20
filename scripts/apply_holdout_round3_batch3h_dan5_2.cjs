/**
 * apply_holdout_round3_batch3h_dan5_2.cjs
 *
 * Applies Batch 3H of Unseen Holdout Round 3: Daniel 5:2 (ALL 25 Arabic records, Biblical Aramaic)
 * mapped 100% bijectively onto ALL 22 OSHB WLC tokens (Dan.5.2 w1..w22):
 *   - Eliminates the false-negative AR_SYNTACTIC at #18 «فِي» -> H9003 (בִ:AR @ w16) paired with #19 «أُورُشَلِيمَ» (H3390 @ w16),
 *   - Documents #1 «وَإِذْ» (H9003 בִּ:AR @ w3) + #4 «يَذُوقُ» (H2939 בִּטְעֵ֣ם @ w3) as compound_phrase and #2 «كَانَ» as AR_SYNTACTIC,
 *   - Fixes all catastrophic lexical errors (#7 H8582->H858, #8 H560->H3984, #9 H1961->H1722, #14 H288->H2,
 *     #21 H1768->H9003@w18, #23 H7263->H7261@w20, #24 H3907->H7695@w21, #25 H3903->H3904@w22),
 *   - Eliminates all 3 out-of-bounds positions (w23..w25) and fills all morph_case=determined fields.
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
const dan52 = oshbByBook[27].get('Dan.5.2');
if (!dan52 || dan52.byIndex.size !== 22) {
  throw new Error(`Expected 22 OSHB tokens for Dan.5.2, got ${dan52 ? dan52.byIndex.size : 0}`);
}

const LEMMA_BY_STRONGS = {
  H1113: 'בֵּלְשַׁאצַּר',
  H560: 'אֲמַר',
  H2939: 'טְעַם',
  H2562: 'חֲמַר',
  H858: 'אָתָה',
  H3984: 'מָאן',
  H1722: 'דְּהַב',
  H3702: 'כְּסַף',
  H1768: 'דִּי',
  H5312: 'נְפַק',
  H5020: 'נְבוּכַדְנֶצַּר',
  H2: 'אַב',
  H4481: 'מִן',
  H1965: 'הֵיכַל',
  H3390: 'יְרוּשָׁלֵם',
  H8355: 'שְׁתָה',
  H9003: 'בְּ',
  H4430: 'מֶלֶךְ',
  H7261: 'רַבְרְבָן',
  H7695: 'שֵׁגָל',
  H3904: 'לְחֵנָה'
};

const SPEC = [
  {
    arPos: 1, arWord: 'وَإِذْ', syntactic: true,
    locator: 'AR_SYNTACTIC:B27.C5.V2.w1',
    relationType: 'syntactic_ar',
    grammarNotes: 'أداة ظرفية عربية لافتتاح الجملة الحالية «وإذ كان بيلشاصر يذوق الخمر»؛ وتُثبَت الباء الظرفية الآرامية בִּ (H9003, AR) كمكوّن ثانوي داخل #4 «يَذُوقُ» (בִּטְעֵ֣ם عند w3).'
  },
  {
    arPos: 2, arWord: 'كَانَ', syntactic: true,
    locator: 'AR_SYNTACTIC:B27.C5.V2.w2',
    relationType: 'syntactic_ar',
    grammarNotes: 'فعل مساعد عربي لبناء الجملة الحالية «وإذ كان بيلشاصر يذوق الخمر» (בִּטְעֵם חַמְרָא).'
  },
  { arPos: 3, arWord: 'بَيْلْشَاصَّرُ', strongs: 'H1113', w: 1, preserveSingular: true },
  {
    arPos: 4, arWord: 'يَذُوقُ', strongs: 'H2939', w: 3,
    grammarNotes: 'الاسم المضاف בִּטְעֵ֣ם (H2939, AR/Ncmsc) المسبوق بالباء الظرفية בִּ (H9003, AR) عند w3؛ ويؤدي مع «وَإِذْ كَانَ» الجملة الظرفية العربية.',
    secondary: [{ strongs: 'H9003', w: 3, comp: 'בִּ', morph: 'AR' }]
  },
  { arPos: 5, arWord: 'الْخَمْرَ', strongs: 'H2562', w: 4 },
  { arPos: 6, arWord: 'أَمَرَ', strongs: 'H560', w: 2 },
  {
    arPos: 7, arWord: 'بِإِحْضَارِ', strongs: 'H858', w: 5,
    secondary: [{ strongs: 'H9005', w: 5, comp: 'לְ', morph: 'AR' }]
  },
  { arPos: 8, arWord: 'آنِيَةِ', strongs: 'H3984', w: 6 },
  { arPos: 9, arWord: 'الذَّهَبِ', strongs: 'H1722', w: 7 },
  {
    arPos: 10, arWord: 'وَالْفِضَّةِ', strongs: 'H3702', w: 8,
    secondary: [{ strongs: 'H9002', w: 8, comp: 'וְ', morph: 'AC' }]
  },
  { arPos: 11, arWord: 'الَّتِي', strongs: 'H1768', w: 9 },
  { arPos: 12, arWord: 'أَخْرَجَهَا', strongs: 'H5312', w: 10 },
  { arPos: 13, arWord: 'نَبُوخَذْنَصَّرُ', strongs: 'H5020', w: 11, preserveSingular: true },
  { arPos: 14, arWord: 'أَبُوهُ', strongs: 'H2', w: 12 },
  { arPos: 15, arWord: 'مِنَ', strongs: 'H4481', w: 13 },
  { arPos: 16, arWord: 'الْهَيْكَلِ', strongs: 'H1965', w: 14 },
  { arPos: 17, arWord: 'الَّذِي', strongs: 'H1768', w: 15 },
  {
    arPos: 18, arWord: 'فِي', strongs: 'H9003', w: 16,
    overrideSurface: 'בִ', overrideMorph: 'AR', relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): الباء الجارة בִ (H9003, AR) الملتصقة باسم العلم בִירוּשְׁלֶ֑ם عند w16.'
  },
  {
    arPos: 19, arWord: 'أُورُشَلِيمَ', strongs: 'H3390', w: 16, preserveSingular: true,
    relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): اسم العلم בִירוּשְׁלֶ֑ם (H3390, AR/Np) المسبوق بالباء الجارة בִ (H9003) عند w16.',
    secondary: [{ strongs: 'H9003', w: 16, comp: 'בִ', morph: 'AR' }]
  },
  {
    arPos: 20, arWord: 'لِيَشْرَبَ', strongs: 'H8355', w: 17,
    secondary: [{ strongs: 'H9002', w: 17, comp: 'וְ', morph: 'AC' }]
  },
  { arPos: 21, arWord: 'بِهَا', strongs: 'H9003', w: 18 },
  { arPos: 22, arWord: 'الْمَلِكُ', strongs: 'H4430', w: 19 },
  {
    arPos: 23, arWord: 'وَعُظَمَاؤُهُ', strongs: 'H7261', w: 20,
    secondary: [{ strongs: 'H9002', w: 20, comp: 'וְ', morph: 'AC' }]
  },
  { arPos: 24, arWord: 'وَزَوْجَاتُهُ', strongs: 'H7695', w: 21 },
  {
    arPos: 25, arWord: 'وَسَرَارِيهِ', strongs: 'H3904', w: 22,
    secondary: [{ strongs: 'H9002', w: 22, comp: 'וּ', morph: 'AC' }]
  }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  if (!item.syntactic) coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 22) {
  throw new Error(`Expected 22 covered OSHB tokens, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 27 AND vr.chapter_num = 5 AND vr.verse_num = 2
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 25) {
  throw new Error(`Expected 25 DB rows for Dan 5:2, found ${existingRows.length}`);
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

  const tok = dan52.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing OSHB token w${item.w}`);

  const surface = item.overrideSurface || tok.text;
  const morph = item.overrideMorph || tok.morph;
  const d = deriveCanonicalMorphFields(
    'aramaic',
    morph,
    false,
    item.preserveSingular ? { morphPos: 'proper_noun', morphNumber: 'singular' } : {}
  );
  const locator = `OSHB:B27.C5.V2.w${item.w}`;
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

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3h_dan5_2.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3H (Daniel 5:2 — 25 records, 30 components, 22/22 unique Aramaic OSHB tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
