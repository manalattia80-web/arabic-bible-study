/**
 * apply_holdout_round3_batch3l_rom16_16.cjs
 *
 * Applies Batch 3L of Unseen Holdout Round 3: Romans 16:16 (ALL 10 Arabic records, NT Greek)
 * mapped 100% bijectively onto SBLGNT w1..w5 (first clause) and Scrivener TR w6..w11 (second clause,
 * matching Arabic SVD which omits SBLGNT w10 πᾶσαι):
 *   - Eliminates false-negative at #3 «عَلَى» (was G1722 ἐν@w3 -> AR_SYNTACTIC:B45.C16.V16.w3, 0 components),
 *   - Links #2 «بَعْضُكُمْ» + #4 «بَعْضٍ» as a documented compound_phrase on SBLGNT w2 (ἀλλήλους, G240),
 *   - Attaches G1722 (ἐν @ w3) as secondary preposition to #5 «بِقُبْلَةٍ» (G5370 φιλήματι @ w4),
 *   - Fixes #6 «مُقَدَّسَةٍ» (w6 -> w5 ἁγίῳ),
 *   - Maps second clause #7..#10 onto TR:B45.C16.V16.w6..w11 (morphgnt_tr) with exact articles G3588@w8 and G3588@w10.
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
const cleanSurface = s => String(s || '').replace(/[.,·;]+$/g, '');

const { sblByBook, trByOsis } = loadAllSources();
const sbl = sblByBook[45].get('16:16');
const tr = trByOsis.get('Rom:16:16');
if (!sbl || sbl.byIndex.size !== 12) {
  throw new Error(`Expected 12 SBLGNT tokens for Rom 16:16, got ${sbl ? sbl.byIndex.size : 0}`);
}
if (!tr || tr.byIndex.size !== 11) {
  throw new Error(`Expected 11 TR tokens for Rom 16:16, got ${tr ? tr.byIndex.size : 0}`);
}

const SPEC = [
  { arPos: 1, arWord: 'سَلِّمُوا', strongs: 'G782', src: 'sbl', w: 1 },
  {
    arPos: 2, arWord: 'بَعْضُكُمْ', strongs: 'G240', src: 'sbl', w: 2,
    relationType: 'compound_phrase',
    grammarNotes: 'وحدة مشتركة مع «بَعْضٍ» (#4) لترجمة الضمير التبادلي اليوناني ἀλλήλους (G240 عند w2).'
  },
  {
    arPos: 3, arWord: 'عَلَى', syntactic: true,
    locator: 'AR_SYNTACTIC:B45.C16.V16.w3',
    relationType: 'syntactic_ar',
    grammarNotes: 'حرف جر عربي لتعدية الفعل «سَلِّمُوا» (سَلِّمُوا عَلَى)، ولا يقابل حرف الجر اليوناني ἐν (w3) المرتبط بـ«بِقُبْلَةٍ» (#5).'
  },
  {
    arPos: 4, arWord: 'بَعْضٍ', strongs: 'G240', src: 'sbl', w: 2,
    relationType: 'compound_phrase',
    grammarNotes: 'الطرف الثاني من الوحدة المشتركة مع «بَعْضُكُمْ» (#2) لترجمة الضمير التبادلي اليوناني ἀλλήλους (G240 عند w2).'
  },
  {
    arPos: 5, arWord: 'بِقُبْلَةٍ', strongs: 'G5370', src: 'sbl', w: 4,
    secondary: [{ strongs: 'G1722', src: 'sbl', w: 3 }]
  },
  { arPos: 6, arWord: 'مُقَدَّسَةٍ', strongs: 'G40', src: 'sbl', w: 5 },
  {
    arPos: 7, arWord: 'كَنَائِسُ', strongs: 'G1577', src: 'tr', w: 9,
    secondary: [{ strongs: 'G3588', src: 'tr', w: 8 }],
    grammarNotes: 'نص Textus Receptus المطابق لفاندايك (αἱ ἐκκλησίαι τοῦ Χριστοῦ، w8–w11) دون كلمة πᾶσαι الموجودة في SBLGNT عند w10.'
  },
  {
    arPos: 8, arWord: 'الْمَسِيحِ', strongs: 'G5547', src: 'tr', w: 11,
    secondary: [{ strongs: 'G3588', src: 'tr', w: 10 }],
    grammarNotes: 'نص Textus Receptus المطابق لفاندايك (τοῦ Χριστοῦ عند w10–w11 مقابل w11–w12 في SBLGNT).'
  },
  { arPos: 9, arWord: 'تُسَلِّمُ', strongs: 'G782', src: 'tr', w: 6 },
  { arPos: 10, arWord: 'عَلَيْكُمْ', strongs: 'G4771', src: 'tr', w: 7 }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  if (!item.syntactic) coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 11) {
  throw new Error(`Expected 11 covered unique tokens for Rom 16:16 (TR w1..w11), got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 45 AND vr.chapter_num = 16 AND vr.verse_num = 16
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 10) {
  throw new Error(`Expected 10 DB rows for Rom 16:16, found ${existingRows.length}`);
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

  const isTr = item.src === 'tr';
  const tok = isTr ? tr.byIndex.get(item.w) : sbl.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing ${item.src} token w${item.w}`);

  const morphCode = isTr ? tok.grammar : tok.morph;
  const surface = isTr ? cleanSurface(tok.surface) : tok.surfaceClean;
  const lemma = tok.lemma;
  const d = deriveCanonicalMorphFields('greek', morphCode, isTr, {});
  const locator = isTr ? `TR:B45.C16.V16.w${item.w}` : `SBLGNT:B45.C16.V16.w${item.w}`;
  const srcName = isTr ? 'morphgnt_tr' : 'morphgnt_sblgnt';

  sql.push(`
    UPDATE word_mappings
    SET strongs_id = ${sqlVal(item.strongs)},
        orig_word = ${sqlVal(lemma)},
        orig_surface = ${sqlVal(surface)},
        orig_word_position = ${item.w},
        orig_morphology = ${sqlVal(morphCode)},
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
        verified_source = ${sqlVal(srcName)},
        morph_source = ${sqlVal(srcName)},
        relation_type = ${sqlVal(item.relationType || null)},
        grammar_notes = ${sqlVal(item.grammarNotes || null)}
    WHERE id = ${sqlVal(dbRow.id)};
  `.trim());

  sql.push(`DELETE FROM word_mapping_strongs WHERE mapping_id = ${sqlVal(dbRow.id)};`);
  sql.push(`
    INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
    VALUES (${sqlVal(dbRow.id)}, ${sqlVal(item.strongs)}, 1, 'primary', ${sqlVal(surface)}, ${item.w}, ${sqlVal(morphCode)}, ${sqlVal(srcName)});
  `.trim());

  let order = 2;
  for (const sec of (item.secondary || [])) {
    const secTr = sec.src === 'tr';
    const sTok = secTr ? tr.byIndex.get(sec.w) : sbl.byIndex.get(sec.w);
    const sMorph = secTr ? sTok.grammar : sTok.morph;
    const sSurf = secTr ? cleanSurface(sTok.surface) : sTok.surfaceClean;
    const sSrc = secTr ? 'morphgnt_tr' : 'morphgnt_sblgnt';
    sql.push(`
      INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
      VALUES (${sqlVal(dbRow.id)}, ${sqlVal(sec.strongs)}, ${order}, 'secondary', ${sqlVal(sSurf)}, ${sec.w}, ${sqlVal(sMorph)}, ${sqlVal(sSrc)});
    `.trim());
    order++;
  }
}

sql.push('COMMIT;');

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3l_rom16_16.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3L (Romans 16:16 — 10 records, 12 components, 11/11 unique Greek tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
