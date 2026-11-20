/**
 * apply_holdout_round3_batch3f_ezra5_10.cjs
 *
 * Applies Batch 3F of Unseen Holdout Round 3: Ezra 5:10 (ALL 9 Arabic records, Biblical Aramaic)
 * mapped 100% bijectively onto ALL 11 OSHB WLC tokens (Ezra.5.10 w1..w11):
 *   - #1 «وَسَأَلْنَاهُمْ» -> w3 שְׁאֵ֥לְנָא (H7593 AVqp1cp) + secondary H9002@w1 (וְ:AC) + H9005@w4 (לְּהֹ֖ם:AR/Sp3mp),
 *   - #2 «أَيْضًا» -> w1 וְאַ֧ף (Aramaic H638 AC/Ta, replacing Hebrew H637) + secondary H9002@w1,
 *   - #3 «عَنْ» -> AR_SYNTACTIC:B15.C5.V10.w3 (syntactic_ar, orig_word_position=NULL, 0 components),
 *   - #4 «أَسْمَائِهِمْ» -> w2 שְׁמָהָתְהֹ֛ם (H8036 ANcmpc/Sp3mp),
 *   - #5 «لِنُعْلِمَكَ» -> w5 לְהוֹדָעוּתָ֑ךְ (H3046 AR/Vhc/Sp2ms, unified voice=active) + secondary H9005@w5,
 *   - #6 «وَكَتَبْنَا» -> w7 נִכְתֻּ֥ב (Aramaic verb H3790 AVqi1cp, replacing noun H3792) + secondary H1768@w6 (דִּ֛י:ATr),
 *   - #7 «أَسْمَاءَ» -> w8 שֻׁם (H8036 ANcmsc),
 *   - #8 «الرِّجَالِ» -> w9 גֻּבְרַיָּ֖א (H1400 ANcmpd/Td, morph_case=determined),
 *   - #9 «رُؤُوسِهِمْ» -> w11 בְרָאשֵׁיהֹֽם (H7217 AR/Ncmpc/Sp3mp) + secondary H9003@w11 (בְ:AR) + H1768@w10 (דִּ֥י:ATr).
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
const ezra510 = oshbByBook[15].get('Ezra.5.10');
if (!ezra510 || ezra510.byIndex.size !== 11) {
  throw new Error(`Expected 11 OSHB tokens for Ezra.5.10, got ${ezra510 ? ezra510.byIndex.size : 0}`);
}

const LEMMA_BY_STRONGS = {
  H7593: 'שְׁאֵל',
  H638: 'אַף',
  H8036: 'שֻׁם',
  H3046: 'יְדַע',
  H3790: 'כְּתַב',
  H1400: 'גְּבַר',
  H7217: 'רֵאשׁ'
};

const SPEC = [
  {
    arPos: 1, arWord: 'وَسَأَلْنَاهُمْ', strongs: 'H7593', w: 3,
    secondary: [
      { strongs: 'H9002', w: 1, comp: 'וְ', morph: 'AC' },
      { strongs: 'H9005', w: 4, comp: 'לְּהֹ֖ם', morph: 'AR/Sp3mp' }
    ]
  },
  {
    arPos: 2, arWord: 'أَيْضًا', strongs: 'H638', w: 1,
    secondary: [
      { strongs: 'H9002', w: 1, comp: 'וְ', morph: 'AC' }
    ]
  },
  {
    arPos: 3, arWord: 'عَنْ', syntactic: true,
    locator: 'AR_SYNTACTIC:B15.C5.V10.w3',
    relationType: 'preposition_particle',
    grammarNotes: 'حرف جر عربي لتعدية الفعل «سألناهم عن أسمائهم» (إذ لְּהֹם في w4 هو ضمير المفعول الأول «ـهم»).'
  },
  { arPos: 4, arWord: 'أَسْمَائِهِمْ', strongs: 'H8036', w: 2 },
  {
    arPos: 5, arWord: 'لِنُعْلِمَكَ', strongs: 'H3046', w: 5,
    secondary: [
      { strongs: 'H9005', w: 5, comp: 'לְ', morph: 'AR' }
    ]
  },
  {
    arPos: 6, arWord: 'وَكَتَبْنَا', strongs: 'H3790', w: 7,
    secondary: [
      { strongs: 'H1768', w: 6, comp: 'דִּ֛י', morph: 'ATr' }
    ]
  },
  { arPos: 7, arWord: 'أَسْمَاءَ', strongs: 'H8036', w: 8 },
  { arPos: 8, arWord: 'الرِّجَالِ', strongs: 'H1400', w: 9 },
  {
    arPos: 9, arWord: 'رُؤُوسِهِمْ', strongs: 'H7217', w: 11,
    secondary: [
      { strongs: 'H9003', w: 11, comp: 'בְ', morph: 'AR' },
      { strongs: 'H1768', w: 10, comp: 'דִּ֥י', morph: 'ATr' }
    ]
  }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  if (!item.syntactic) coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 11) {
  throw new Error(`Expected 11 covered OSHB tokens, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 15 AND vr.chapter_num = 5 AND vr.verse_num = 10
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 9) {
  throw new Error(`Expected 9 DB rows for Ezra 5:10, found ${existingRows.length}`);
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

  const tok = ezra510.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing OSHB token w${item.w}`);

  const d = deriveCanonicalMorphFields('aramaic', tok.morph, false, {});
  const locator = `OSHB:B15.C5.V10.w${item.w}`;
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

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3f_ezra5_10.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3F (Ezra 5:10 — 9 records, 15 components, 11/11 unique Aramaic OSHB tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
