/**
 * apply_holdout_round3_batch3o_1pet4_11.cjs
 *
 * Applies Batch 3O of Unseen Holdout Round 3: 1 Peter 4:11 (ALL 31 Arabic records, NT Greek)
 * mapped 100% bijectively onto ALL 38 SBLGNT MorphGNT tokens (w1..w38):
 *   - Reclassifies #2 «كَانَ» and #8 «كَانَ» (erroneously pointing to w27 ἐστιν) as AR_SYNTACTIC (0 components),
 *   - Links #5 «فَكَأَقْوَالِ» to primary G3051 λόγια@w5 + secondary G5613 ὡς@w4,
 *   - Links #20 «كُلِّ» + #21 «شَيْءٍ» as a documented compound_phrase on SBLGNT w19 (πᾶσιν, G3956, A- ----DPN-),
 *   - Attaches all articles, prepositions, conjunctions, and relative pronoun (#14 G3739@w13, #15 G3588@w15,
 *     #18 G3588@w21, #22 G1223@w23, #26 G3588@w28, #27 G2532@w30 + G3588@w31, #29 G3588@w34, #30 G3588@w36),
 *   - Fixes #22 «بِيَسُوعَ» and #23 «الْمَسِيحِ» morph_pos to canonical 'noun' for MorphGNT N-,
 *   - Reviews all 6 previously auto-clean records (#1, #3, #6, #7, #9, #14).
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
const sbl = sblByBook[60].get('4:11');
if (!sbl || sbl.byIndex.size !== 38) {
  throw new Error(`Expected 38 SBLGNT tokens for 1Pet 4:11, got ${sbl ? sbl.byIndex.size : 0}`);
}

const SPEC = [
  { arPos: 1,  arWord: 'إِنْ',          strongs: 'G1487', w: 1 },
  {
    arPos: 2,  arWord: 'كَانَ', syntactic: true,
    locator: 'AR_SYNTACTIC:B60.C4.V11.w2',
    relationType: 'syntactic_ar',
    grammarNotes: 'فعل ناقص عربي لإسناد الشرط «إِنْ كَانَ يَتَكَلَّمُ» مقابل εἴ τις λαλεῖ (w1–w3) دون فعل εἰμί في المصدر هنا.'
  },
  { arPos: 3,  arWord: 'يَتَكَلَّمُ',     strongs: 'G2980', w: 3 },
  { arPos: 4,  arWord: 'أَحَدٌ',         strongs: 'G5100', w: 2, morphPosOverride: 'pronoun', grammarNotes: 'ضمير نكرة غير معيّن (indefinite τις، G5100 عند w2) في سياق الشرط «إِنْ كَانَ يَتَكَلَّمُ أَحَدٌ» مع حفظ الرمز المصدري RI ----NSM-.' },
  { arPos: 5,  arWord: 'فَكَأَقْوَالِ',  strongs: 'G3051', w: 5,  secondary: [{ strongs: 'G5613', w: 4 }] },
  { arPos: 6,  arWord: 'اللهِ',          strongs: 'G2316', w: 6 },
  { arPos: 7,  arWord: 'وَإِنْ',         strongs: 'G1487', w: 7 },
  {
    arPos: 8,  arWord: 'كَانَ', syntactic: true,
    locator: 'AR_SYNTACTIC:B60.C4.V11.w8',
    relationType: 'syntactic_ar',
    grammarNotes: 'فعل ناقص عربي لإسناد الشرط «وَإِنْ كَانَ يَخْدِمُ» مقابل εἴ τις διακονεῖ (w7–w9) دون فعل εἰμί في المصدر هنا.'
  },
  { arPos: 9,  arWord: 'يَخْدِمُ',       strongs: 'G1247', w: 9 },
  { arPos: 10, arWord: 'أَحَدٌ',         strongs: 'G5100', w: 8, morphPosOverride: 'pronoun', grammarNotes: 'ضمير نكرة غير معيّن (indefinite τις، G5100 عند w8) في سياق الشرط «وَإِنْ كَانَ يَخْدِمُ أَحَدٌ» مع حفظ الرمز المصدري RI ----NSM-.' },
  { arPos: 11, arWord: 'فَكَأَنَّهُ',     strongs: 'G5613', w: 10 },
  { arPos: 12, arWord: 'مِنْ',           strongs: 'G1537', w: 11 },
  { arPos: 13, arWord: 'قُوَّةٍ',        strongs: 'G2479', w: 12 },
  { arPos: 14, arWord: 'يَمْنَحُهَا',     strongs: 'G5524', w: 14, secondary: [{ strongs: 'G3739', w: 13 }] },
  { arPos: 15, arWord: 'اللهُ',          strongs: 'G2316', w: 16, secondary: [{ strongs: 'G3588', w: 15 }] },
  { arPos: 16, arWord: 'لِكَيْ',         strongs: 'G2443', w: 17 },
  { arPos: 17, arWord: 'يَتَمَجَّدَ',     strongs: 'G1392', w: 20 },
  { arPos: 18, arWord: 'اللهُ',          strongs: 'G2316', w: 22, secondary: [{ strongs: 'G3588', w: 21 }] },
  { arPos: 19, arWord: 'فِي',            strongs: 'G1722', w: 18 },
  {
    arPos: 20, arWord: 'كُلِّ',          strongs: 'G3956', w: 19,
    relationType: 'compound_phrase',
    grammarNotes: 'وحدة مشتركة مع «شَيْءٍ» (#21) لترجمة الصفة المحايدة الجامعة πᾶσιν (G3956 عند w19).'
  },
  {
    arPos: 21, arWord: 'شَيْءٍ',         strongs: 'G3956', w: 19,
    relationType: 'compound_phrase',
    grammarNotes: 'الطرف الثاني من الوحدة المشتركة مع «كُلِّ» (#20) لترجمة الصفة المحايدة الجامعة πᾶσιν (G3956 عند w19).'
  },
  { arPos: 22, arWord: 'بِيَسُوعَ',      strongs: 'G2424', w: 24, secondary: [{ strongs: 'G1223', w: 23 }] },
  { arPos: 23, arWord: 'الْمَسِيحِ',      strongs: 'G5547', w: 25 },
  { arPos: 24, arWord: 'الَّذِي',         strongs: 'G3739', w: 26 },
  {
    arPos: 25, arWord: 'لَهُ',           strongs: 'G1510', w: 27,
    secondary: [{ strongs: 'G3739', w: 26 }],
    grammarNotes: 'استكمال تمثيل وحدة «الَّذِي لَهُ»: الرابطة الفعلية ἐστιν (G1510 عند w27) مع المكوّن الثانوي ᾧ (G3739 عند w26) الحامل لدلالة الداتيف (لَهُ).'
  },
  { arPos: 26, arWord: 'الْمَجْدُ',       strongs: 'G1391', w: 29, secondary: [{ strongs: 'G3588', w: 28 }] },
  { arPos: 27, arWord: 'وَالسُّلْطَانُ',  strongs: 'G2904', w: 32, secondary: [{ strongs: 'G2532', w: 30 }, { strongs: 'G3588', w: 31 }] },
  { arPos: 28, arWord: 'إِلَى',          strongs: 'G1519', w: 33 },
  { arPos: 29, arWord: 'أَبَدِ',         strongs: 'G165',  w: 35, secondary: [{ strongs: 'G3588', w: 34 }] },
  { arPos: 30, arWord: 'الآبِدِينَ',      strongs: 'G165',  w: 37, secondary: [{ strongs: 'G3588', w: 36 }] },
  { arPos: 31, arWord: 'آمِينَ',         strongs: 'G281',  w: 38 }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  if (!item.syntactic) coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 38) {
  throw new Error(`Expected 38 covered unique SBLGNT tokens for 1Pet 4:11, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 60 AND vr.chapter_num = 4 AND vr.verse_num = 11
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 31) {
  throw new Error(`Expected 31 DB rows for 1Pet 4:11, found ${existingRows.length}`);
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

  const tok = sbl.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing SBLGNT token w${item.w}`);

  const d = deriveCanonicalMorphFields('greek', tok.morph, false, {});
  const morphPos = item.morphPosOverride || d.morphPos;
  const locator = `SBLGNT:B60.C4.V11.w${item.w}`;

  sql.push(`
    UPDATE word_mappings
    SET strongs_id = ${sqlVal(item.strongs)},
        orig_word = ${sqlVal(tok.lemma)},
        orig_surface = ${sqlVal(tok.surfaceClean)},
        orig_word_position = ${item.w},
        orig_morphology = ${sqlVal(tok.morph)},
        morph_pos = ${sqlVal(morphPos)},
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
        relation_type = ${sqlVal(item.relationType || null)},
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
    const sTok = sbl.byIndex.get(sec.w);
    sql.push(`
      INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
      VALUES (${sqlVal(dbRow.id)}, ${sqlVal(sec.strongs)}, ${order}, 'secondary', ${sqlVal(sTok.surfaceClean)}, ${sec.w}, ${sqlVal(sTok.morph)}, 'morphgnt_sblgnt');
    `.trim());
    order++;
  }
}

sql.push('COMMIT;');

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3o_1pet4_11.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3O (1 Peter 4:11 — 31 records, 40 components, 38/38 unique Greek SBLGNT tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
