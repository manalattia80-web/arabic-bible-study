/**
 * apply_holdout_round3_batch3b_prov28_9.cjs
 *
 * Applies Batch 3B of Unseen Holdout Round 3: Proverbs 28:9 (ALL 9 Arabic records)
 * mapped 100% bijectively onto ALL 7 OSHB WLC tokens (Prov.28.9 w1..w7),
 * documenting:
 *   - #1 «مَنْ» as AR_SYNTACTIC (Arabic relative pronoun rendering substantival participle מֵסִיר w1),
 *   - #4 «عَنْ» + #5 «سَمَاعِ» as a shared compound_phrase unit on w3 מִשְּׁמֹ֣עַ (H4480 מִ:HR + H8085 מִשְּׁמֹ֣עַ:HR/Vqc),
 *   - #7 «فَصَلاَتُهُ» (w6) and #8 «أَيْضًا» (w5) respecting Hebrew vs Arabic word order,
 *   - #8 and #9 brought inside the 7-token verse boundary (fixing w8/w9 out-of-bounds errors).
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
const prov289 = oshbByBook[20].get('Prov.28.9');
if (!prov289 || prov289.byIndex.size !== 7) {
  throw new Error(`Expected 7 OSHB tokens for Prov.28.9, got ${prov289 ? prov289.byIndex.size : 0}`);
}

const LEMMA_BY_STRONGS = {
  H5493: 'סוּר',
  H241: 'אֹזֶן',
  H4480: 'מִן',
  H8085: 'שָׁמַע',
  H8451: 'תּוֹרָה',
  H1571: 'גַּם',
  H8605: 'תְּפִלָּה',
  H8441: 'תּוֹעֵבַה'
};

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 20 AND vr.chapter_num = 28 AND vr.verse_num = 9
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 9) {
  throw new Error(`Expected 9 DB rows for Prov 28:9, found ${existingRows.length}`);
}

const rowByPos = new Map();
for (const r of existingRows) {
  const [posStr, id, arWord] = r.split('|');
  rowByPos.set(parseInt(posStr, 10), { id, arWord });
}

const SPEC = [
  {
    arPos: 1, arWord: 'مَنْ', syntactic: true,
    locator: 'AR_SYNTACTIC:B20.C28.V9.w1',
    relationType: 'syntactic_ar',
    grammarNotes: 'اسم موصول عربي يترجم الصيغة الاسمية لاسم الفاعل العبري מֵסִיר (w1).'
  },
  { arPos: 2, arWord: 'يُحَوِّلُ', strongs: 'H5493', w: 1 },
  { arPos: 3, arWord: 'أُذْنَهُ', strongs: 'H241', w: 2 },
  {
    arPos: 4, arWord: 'عَنْ', strongs: 'H4480', w: 3,
    overrideSurface: 'מִ',
    overrideMorph: 'HR',
    relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): البادئة الجارة מִ (H4480, HR) الملتصقة بالمصدر المضاف מִשְּׁמֹ֣עַ عند w3.'
  },
  {
    arPos: 5, arWord: 'سَمَاعِ', strongs: 'H8085', w: 3,
    relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): المصدر المضاف מִשְּׁמֹ֣עַ (H8085, HR/Vqc) المسبوق بالبادئة מִ (H4480) عند w3.',
    secondary: [
      { strongs: 'H4480', w: 3, comp: 'מִ', morph: 'HR' }
    ]
  },
  { arPos: 6, arWord: 'الشَّرِيعَةِ', strongs: 'H8451', w: 4 },
  { arPos: 7, arWord: 'فَصَلاَتُهُ', strongs: 'H8605', w: 6 },
  { arPos: 8, arWord: 'أَيْضًا', strongs: 'H1571', w: 5 },
  { arPos: 9, arWord: 'مَكْرَهَةٌ', strongs: 'H8441', w: 7 }
];

// Verify 100% coverage of all 7 OSHB tokens (w1..w7)
const coveredTokens = new Set();
for (const item of SPEC) {
  if (!item.syntactic) coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 7) {
  throw new Error(`Expected 7 covered OSHB tokens, got ${coveredTokens.size}`);
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

  const tok = prov289.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing OSHB token w${item.w}`);

  const surface = item.overrideSurface || tok.text;
  const morph = item.overrideMorph || tok.morph;
  const d = deriveCanonicalMorphFields('hebrew', morph, false, {});
  const locator = `OSHB:B20.C28.V9.w${item.w}`;
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

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3b_prov28_9.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3B (Proverbs 28:9 — 9 records, 9 components, 7/7 OSHB tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
