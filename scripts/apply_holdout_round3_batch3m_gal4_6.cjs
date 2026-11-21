/**
 * apply_holdout_round3_batch3m_gal4_6.cjs
 *
 * Applies Batch 3M of Unseen Holdout Round 3: Galatians 4:6 (ALL 14 Arabic records, NT Greek)
 * mapped 100% bijectively onto ALL 20 Greek tokens (w1..w20):
 *   - Eliminates false-negative at #11 «صَارِخًا:» (was AR_SYNTACTIC -> G2896 κρᾶζον @ w17),
 *   - Maps #10 «قُلُوبِكُمْ» to TR:B48.C4.V6.w15 (καρδίας) + G3588@w14 (τὰς) + G4771@w16 (ὑμῶν,
 *     matching Arabic SVD «قلوبكم» vs SBLGNT ἡμῶν «قلوبنا»),
 *   - Fixes #13 «أَبَا» (was G3962 πατήρ -> G5 αββα @ w18 Αββα),
 *   - Fixes #3 «أَنَّكُمْ» (was G3588 ὁ -> G1510 ἐστε @ w3),
 *   - Normalizes #12 «يَا» as AR_SYNTACTIC:B48.C4.V6.w12 (0 components),
 *   - Attaches all articles and possessives cleanly (#6 G3588@w6, #7 G3588@w8, #8 G3588@w10 + G846@w12, #14 G3588@w19).
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
const sbl = sblByBook[48].get('4:6');
const tr = trByOsis.get('Gal:4:6');
if (!sbl || sbl.byIndex.size !== 20) {
  throw new Error(`Expected 20 SBLGNT tokens for Gal 4:6, got ${sbl ? sbl.byIndex.size : 0}`);
}
if (!tr || tr.byIndex.size !== 20) {
  throw new Error(`Expected 20 TR tokens for Gal 4:6, got ${tr ? tr.byIndex.size : 0}`);
}

const SPEC = [
  { arPos: 1, arWord: 'ثُمَّ', strongs: 'G1161', src: 'sbl', w: 2 },
  { arPos: 2, arWord: 'بِمَا', strongs: 'G3754', src: 'sbl', w: 1 },
  { arPos: 3, arWord: 'أَنَّكُمْ', strongs: 'G1510', src: 'sbl', w: 3 },
  { arPos: 4, arWord: 'أَبْنَاءٌ،', strongs: 'G5207', src: 'sbl', w: 4 },
  { arPos: 5, arWord: 'أَرْسَلَ', strongs: 'G1821', src: 'sbl', w: 5 },
  {
    arPos: 6, arWord: 'اللهُ', strongs: 'G2316', src: 'sbl', w: 7,
    secondary: [{ strongs: 'G3588', src: 'sbl', w: 6 }]
  },
  {
    arPos: 7, arWord: 'رُوحَ', strongs: 'G4151', src: 'sbl', w: 9,
    secondary: [{ strongs: 'G3588', src: 'sbl', w: 8 }]
  },
  {
    arPos: 8, arWord: 'ابْنِهِ', strongs: 'G5207', src: 'sbl', w: 11,
    secondary: [
      { strongs: 'G3588', src: 'sbl', w: 10 },
      { strongs: 'G846', src: 'sbl', w: 12 }
    ]
  },
  { arPos: 9, arWord: 'إِلَى', strongs: 'G1519', src: 'sbl', w: 13 },
  {
    arPos: 10, arWord: 'قُلُوبِكُمْ', strongs: 'G2588', src: 'tr', w: 15,
    secondary: [
      { strongs: 'G3588', src: 'tr', w: 14 },
      { strongs: 'G4771', src: 'tr', w: 16 }
    ],
    grammarNotes: 'قراءة Textus Receptus المطابقة لفاندايك: τὰς καρδίας ὑμῶν (قلوبكم، G4771 عند w16) مقابل قراءة SBLGNT ἡμῶν (قلوبنا).'
  },
  { arPos: 11, arWord: 'صَارِخًا:', strongs: 'G2896', src: 'sbl', w: 17 },
  {
    arPos: 12, arWord: '«يَا', syntactic: true,
    locator: 'AR_SYNTACTIC:B48.C4.V6.w12',
    relationType: 'syntactic_ar',
    grammarNotes: 'أداة نداء عربية تقابل صيغة النداء اليونانية Αββα ὁ πατήρ (w18–w20).'
  },
  { arPos: 13, arWord: 'أَبَا', strongs: 'G5', src: 'sbl', w: 18 },
  {
    arPos: 14, arWord: 'الآبُ».', strongs: 'G3962', src: 'sbl', w: 20,
    secondary: [{ strongs: 'G3588', src: 'sbl', w: 19 }]
  }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  if (!item.syntactic) coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 20) {
  throw new Error(`Expected 20 covered unique tokens for Gal 4:6, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 48 AND vr.chapter_num = 4 AND vr.verse_num = 6
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 14) {
  throw new Error(`Expected 14 DB rows for Gal 4:6, found ${existingRows.length}`);
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
  const locator = isTr ? `TR:B48.C4.V6.w${item.w}` : `SBLGNT:B48.C4.V6.w${item.w}`;
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

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3m_gal4_6.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3M (Galatians 4:6 — 14 records, 20 components, 20/20 unique Greek tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
