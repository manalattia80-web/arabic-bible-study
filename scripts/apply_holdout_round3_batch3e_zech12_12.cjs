/**
 * apply_holdout_round3_batch3e_zech12_12.cjs
 *
 * Applies Batch 3E of Unseen Holdout Round 3: Zechariah 12:12 (ALL 22 Arabic records)
 * mapped 100% bijectively onto ALL 17 OSHB WLC tokens (Zech.12.12 w1..w17):
 *   - Contextually disambiguates all 5 occurrences of לְבָד (H905 + H9005) as documented compound_phrase pairs:
 *       1) #5+#6   (عَلَى حِدَتِهَا — عشائر عشائر)   -> w5  לְבָ֑ד
 *       2) #10+#11 (عَلَى حِدَتِهَا — بيت داود)      -> w9  לְבָד֙  (fixes famous false-negative collision on w11!)
 *       3) #13+#14 (عَلَى حِدَتِهِنَّ — ونساؤهم ١)    -> w11 לְבָ֔ד
 *       4) #18+#19 (عَلَى حِدَتِهَا — بيت ناثان)     -> w15 לְבָ֔ד  (fixes out-of-bounds w18/w19)
 *       5) #21+#22 (عَلَى حِدَتِهِنَّ — ونساؤهم ٢)    -> w17 לְבָֽד  (fixes out-of-bounds w21/w22)
 *   - Completes secondary prefix components for all 4 auto-clean records (#1+H9002, #2+H9009, #3, #4)
 *     and all shifted records (#7..#9, #12+H9002, #15..#17, #20+H9002).
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
const zech1212 = oshbByBook[38].get('Zech.12.12');
if (!zech1212 || zech1212.byIndex.size !== 17) {
  throw new Error(`Expected 17 OSHB tokens for Zech.12.12, got ${zech1212 ? zech1212.byIndex.size : 0}`);
}

const LEMMA_BY_STRONGS = {
  H5594: 'סָפַד',
  H776: 'אֶרֶץ',
  H4940: 'מִשְׁפָּחָה',
  H905: 'בַּד',
  H1004: 'בַּיִת',
  H1732: 'דָּוִד',
  H802: 'אִשָּׁה',
  H5416: 'נָתָן',
  H9005: 'לְ'
};

const SPEC = [
  {
    arPos: 1, arWord: 'وَتَنُوحُ', strongs: 'H5594', w: 1,
    secondary: [{ strongs: 'H9002', w: 1, comp: 'וְ', morph: 'HC' }]
  },
  {
    arPos: 2, arWord: 'الأَرْضُ', strongs: 'H776', w: 2,
    secondary: [{ strongs: 'H9009', w: 2, comp: 'הָ', morph: 'HTd' }]
  },
  { arPos: 3, arWord: 'عَشَائِرَ', strongs: 'H4940', w: 3 },
  { arPos: 4, arWord: 'عَشَائِرَ', strongs: 'H4940', w: 4 },
  {
    arPos: 5, arWord: 'عَلَى', strongs: 'H9005', w: 5,
    overrideSurface: 'לְ', overrideMorph: 'HR', relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): اللام الجارة לְ (H9005, HR) في الورود الأول لـ לְבָ֑ד (w5 — تابع لـ«عشائر عشائر»).'
  },
  {
    arPos: 6, arWord: 'حِدَتِهَا', strongs: 'H905', w: 5, relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): الورود الأول لـ לְבָ֑ד (H905 + H9005) عند w5 (تابع لـ«عشائر عشائر»).',
    secondary: [{ strongs: 'H9005', w: 5, comp: 'לְ', morph: 'HR' }]
  },
  { arPos: 7, arWord: 'عَشِيرَةُ', strongs: 'H4940', w: 6 },
  { arPos: 8, arWord: 'بَيْتِ', strongs: 'H1004', w: 7 },
  { arPos: 9, arWord: 'دَاوُدَ', strongs: 'H1732', w: 8, preserveSingular: true },
  {
    arPos: 10, arWord: 'عَلَى', strongs: 'H9005', w: 9,
    overrideSurface: 'לְ', overrideMorph: 'HR', relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): اللام الجارة לְ (H9005, HR) في الورود الثاني لـ לְבָד֙ (w9 — تابع لـ«عشيرة بيت داود»).'
  },
  {
    arPos: 11, arWord: 'حِدَتِهَا', strongs: 'H905', w: 9, relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): الورود الثاني لـ לְבָד֙ (H905 + H9005) عند w9 (تابع لـ«عشيرة بيت داود»؛ وليس w11).',
    secondary: [{ strongs: 'H9005', w: 9, comp: 'לְ', morph: 'HR' }]
  },
  {
    arPos: 12, arWord: 'وَنِسَاؤُهُمْ', strongs: 'H802', w: 10,
    secondary: [{ strongs: 'H9002', w: 10, comp: 'וּ', morph: 'HC' }]
  },
  {
    arPos: 13, arWord: 'عَلَى', strongs: 'H9005', w: 11,
    overrideSurface: 'לְ', overrideMorph: 'HR', relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): اللام الجارة לְ (H9005, HR) في الورود الثالث لـ לְבָ֔ד (w11 — تابع لـ«ونساؤهم» بعد بيت داود).'
  },
  {
    arPos: 14, arWord: 'حِدَتِهِنَّ', strongs: 'H905', w: 11, relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): الورود الثالث لـ לְבָ֔ד (H905 + H9005) عند w11 (تابع لـ«ونساؤهم» بعد بيت داود).',
    secondary: [{ strongs: 'H9005', w: 11, comp: 'לְ', morph: 'HR' }]
  },
  { arPos: 15, arWord: 'عَشِيرَةُ', strongs: 'H4940', w: 12 },
  { arPos: 16, arWord: 'بَيْتِ', strongs: 'H1004', w: 13 },
  { arPos: 17, arWord: 'نَاثَانَ', strongs: 'H5416', w: 14, preserveSingular: true },
  {
    arPos: 18, arWord: 'عَلَى', strongs: 'H9005', w: 15,
    overrideSurface: 'לְ', overrideMorph: 'HR', relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): اللام الجارة לְ (H9005, HR) في الورود الرابع لـ לְבָ֔ד (w15 — تابع لـ«عشيرة بيت ناثان»).'
  },
  {
    arPos: 19, arWord: 'حِدَتِهَا', strongs: 'H905', w: 15, relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): الورود الرابع لـ לְבָ֔ד (H905 + H9005) عند w15 (تابع لـ«عشيرة بيت ناثان»).',
    secondary: [{ strongs: 'H9005', w: 15, comp: 'לְ', morph: 'HR' }]
  },
  {
    arPos: 20, arWord: 'وَنِسَاؤُهُمْ', strongs: 'H802', w: 16,
    secondary: [{ strongs: 'H9002', w: 16, comp: 'וּ', morph: 'HC' }]
  },
  {
    arPos: 21, arWord: 'عَلَى', strongs: 'H9005', w: 17,
    overrideSurface: 'לְ', overrideMorph: 'HR', relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): اللام الجارة לְ (H9005, HR) في الورود الخامس لـ לְבָֽד (w17 — تابع لـ«ونساؤهم» بعد بيت ناثان).'
  },
  {
    arPos: 22, arWord: 'حِدَتِهِنَّ', strongs: 'H905', w: 17, relationType: 'compound_phrase',
    grammarNotes: 'وحدة ربط مشتركة (compound_phrase): الورود الخامس لـ לְבָֽד (H905 + H9005) عند w17 (تابع لـ«ونساؤهم» بعد بيت ناثان).',
    secondary: [{ strongs: 'H9005', w: 17, comp: 'לְ', morph: 'HR' }]
  }
];

const coveredTokens = new Set();
for (const item of SPEC) {
  coveredTokens.add(item.w);
  for (const s of (item.secondary || [])) coveredTokens.add(s.w);
}
if (coveredTokens.size !== 17) {
  throw new Error(`Expected 17 covered OSHB tokens, got ${coveredTokens.size}`);
}

const existingRows = q(`
  SELECT wm.ar_word_position, wm.id, wm.ar_word
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 38 AND vr.chapter_num = 12 AND vr.verse_num = 12
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean);

if (existingRows.length !== 22) {
  throw new Error(`Expected 22 DB rows for Zech 12:12, found ${existingRows.length}`);
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
  const tok = zech1212.byIndex.get(item.w);
  if (!tok) throw new Error(`Missing OSHB token w${item.w}`);

  const surface = item.overrideSurface || tok.text;
  const morph = item.overrideMorph || tok.morph;
  const d = deriveCanonicalMorphFields(
    'hebrew',
    morph,
    false,
    item.preserveSingular ? { morphPos: 'proper_noun', morphNumber: 'singular' } : {}
  );
  const locator = `OSHB:B38.C12.V12.w${item.w}`;
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

const tmpSqlPath = path.join(repoRoot, 'scratch/apply_holdout_round3_batch3e_zech12_12.sql');
fs.mkdirSync(path.dirname(tmpSqlPath), { recursive: true });
fs.writeFileSync(tmpSqlPath, sql.join('\n') + '\n', 'utf8');

execFileSync(sqlitePath, [dbPath], { input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = q('PRAGMA integrity_check;');
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed: ${integrity}`);
}

const postSha = sha256File(dbPath);
console.log('Successfully applied Round 3 Batch 3E (Zechariah 12:12 — 22 records, 31 components, 17/17 unique OSHB tokens):');
console.log(`  Pre-Apply DB SHA-256 : ${preSha}`);
console.log(`  Post-Apply DB SHA-256: ${postSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
