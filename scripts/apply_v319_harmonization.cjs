const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDb = process.argv[2] 
  ? path.resolve(process.argv[2]) 
  : path.resolve(__dirname, '../mobile/assets/bible_study.db');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const tmpSql = path.resolve(__dirname, 'apply_v319_robust.sql');

if (!fs.existsSync(targetDb)) {
  console.error(`Target database not found: ${targetDb}`);
  process.exit(1);
}

console.log(`=== Applying v319 Harmonization & Codex Component Alignment to: ${path.basename(targetDb)} ===`);

// Helper to query sqlite synchronously
function querySql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_subquery.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    const res = execSync(`"${sqlite}" "${targetDb}" < "${tmp}"`, { encoding: 'utf8', windowsHide: true });
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    return res.trim();
  } catch (e) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw e;
  }
}

// Strict unambiguous mapping ID resolver with single-row assertion
function getVerifiedMappingId(bookId, ch, vs, wordPos) {
  const sql = `
    SELECT wm.id
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    WHERE v.book_id = ${bookId} AND v.chapter_num = ${ch} AND v.verse_num = ${vs} AND wm.ar_word_position = ${wordPos};
  `;
  const result = querySql(sql);
  const rows = result.split('\n').map(s => s.trim()).filter(Boolean);
  if (rows.length !== 1) {
    throw new Error(`Assertion failed: expected exactly 1 mapping for Book ${bookId} ${ch}:${vs} pos ${wordPos}, found ${rows.length} rows (${result})`);
  }
  return `'${rows[0]}'`;
}

// Subquery string helper for batch statements
const subqueryMappingId = (book, ch, vs, wordPos) => 
  `(SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id=${book} AND chapter_num=${ch} AND verse_num=${vs}) AND ar_word_position=${wordPos})`;

// Verify critical targets resolve to exactly 1 record before generating SQL
console.log('Verifying dynamic single-row uniqueness across all targets...');
const targetsToVerify = [
  { book: 27, ch: 3, vs: 30, pos: 6, label: 'Dan 3:30 عبدَنغو' },
  { book: 27, ch: 3, vs: 30, pos: 4, label: 'Dan 3:30 شدرخ' },
  { book: 30, ch: 1, vs: 4,  pos: 8, label: 'Amos 1:4 بنهدد' },
  { book: 9,  ch: 19, vs: 15, pos: 14, label: '1 Sam 19:15 أقتله' },
  { book: 43, ch: 14, vs: 19, pos: 4, label: 'John 14:19 يراني' },
  { book: 43, ch: 14, vs: 19, pos: 9, label: 'John 14:19 فترونني' },
  { book: 45, ch: 9,  vs: 23, pos: 1, label: 'Rom 9:23 ولكي' },
  { book: 45, ch: 9,  vs: 23, pos: 4, label: 'Rom 9:23 مجده' },
  { book: 45, ch: 9,  vs: 23, pos: 11, label: 'Rom 9:23 للمجد' },
  { book: 44, ch: 6,  vs: 8,  pos: 7, label: 'Acts 6:8 وقوة' },
  { book: 44, ch: 6,  vs: 8,  pos: 11, label: 'Acts 6:8 وآيات' },
  { book: 5,  ch: 23, vs: 2,  pos: 2,  label: 'Deut 23:2 يدخل' },
];

for (const t of targetsToVerify) {
  const id = getVerifiedMappingId(t.book, t.ch, t.vs, t.pos);
  console.log(`  ✓ ${t.label} strictly resolved to unique ID: ${id}`);
}

let sqlStatements = [];

sqlStatements.push('BEGIN TRANSACTION;');

// 0. Ensure schema allows multiple components with same Strongs ID via PRIMARY KEY (mapping_id, link_order)
sqlStatements.push(`
CREATE TABLE IF NOT EXISTS word_mapping_strongs_v2 (
  mapping_id         TEXT    NOT NULL,
  strongs_id         TEXT    NOT NULL,
  link_order         INTEGER NOT NULL DEFAULT 1,
  link_role          TEXT    NOT NULL DEFAULT 'primary',
  orig_component     TEXT,
  orig_word_position INTEGER,
  orig_morphology    TEXT,
  morph_source       TEXT,
  PRIMARY KEY (mapping_id, link_order)
);

INSERT OR IGNORE INTO word_mapping_strongs_v2 
SELECT mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source 
FROM word_mapping_strongs;

DROP TABLE IF EXISTS word_mapping_strongs;

ALTER TABLE word_mapping_strongs_v2 RENAME TO word_mapping_strongs;

CREATE INDEX IF NOT EXISTS idx_wms_strongs_id ON word_mapping_strongs(strongs_id);
CREATE INDEX IF NOT EXISTS idx_wms_mapping_id ON word_mapping_strongs(mapping_id, link_order);
CREATE INDEX IF NOT EXISTS idx_wms_mapping_strongs ON word_mapping_strongs(mapping_id, strongs_id);
`);

// 1. Synchronize primary wms fields from word_mappings across all 10 audit verses dynamically
sqlStatements.push(`
UPDATE word_mapping_strongs 
SET orig_word_position = (SELECT wm.orig_word_position FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
    orig_morphology = (SELECT wm.orig_morphology FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
    morph_source = (SELECT wm.morph_source FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id)
WHERE link_role = 'primary'
  AND mapping_id IN (
    SELECT id FROM word_mappings 
    WHERE verse_id IN (
      SELECT id FROM verses WHERE 
        (book_id=1 AND chapter_num=7 AND verse_num=3) OR
        (book_id=9 AND chapter_num=19 AND verse_num=15) OR
        (book_id=20 AND chapter_num=15 AND verse_num=6) OR
        (book_id=24 AND chapter_num=51 AND verse_num=22) OR
        (book_id=24 AND chapter_num=51 AND verse_num=64) OR
        (book_id=30 AND chapter_num=1 AND verse_num=4) OR
        (book_id=27 AND chapter_num=3 AND verse_num=30) OR
        (book_id=43 AND chapter_num=14 AND verse_num=19) OR
        (book_id=44 AND chapter_num=6 AND verse_num=8) OR
        (book_id=45 AND chapter_num=9 AND verse_num=23) OR
        (book_id=58 AND chapter_num=10 AND verse_num=18)
    )
  );
`);

// 2. Fix the 5 sources in word_mappings that remained 'syntactic_ar' instead of 'oshb_wlc':
sqlStatements.push(`
UPDATE word_mappings SET morph_source = 'oshb_wlc' 
WHERE verse_id LIKE '%-0009-%019015' AND ar_word IN ('ثُمَّ', 'عَلَى', 'لِكَيْ');

UPDATE word_mappings SET morph_source = 'oshb_wlc' 
WHERE verse_id LIKE '%-0020-%015006' AND ar_word = 'وَفِي';

UPDATE word_mappings SET morph_source = 'oshb_wlc' 
WHERE verse_id LIKE '%-0027-%003030' AND ar_word = 'فِي';
`);

// 3. Fix Acts 6:8 فَإِذْ and كَانَ (pos 3 and pos 4)
sqlStatements.push(`
UPDATE word_mappings 
SET morph_source = 'syntactic_ar', orig_word_lang = NULL, verified_source = NULL
WHERE verse_id LIKE '%-0044-%006008' AND ar_word_position IN (3, 4);
`);

// 4. Dan 3:30 عبدَنغو (ar_word_position = 6): expand into w6 and w7 under single lexicon entry H5665
sqlStatements.push(`
DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(27, 3, 30, 6)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(27, 3, 30, 6)}, 'H5665', 1, 'primary', 'וַעֲבֵ֥ד', 6, 'AC/Np', 'oshb_wlc');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(27, 3, 30, 6)}, 'H5665', 2, 'compound', 'נְגֹ֖ו', 7, 'ANp', 'oshb_wlc');

UPDATE word_mappings 
SET strongs_id = 'H5665', orig_word_position = 6, verified_locator = 'OSHB:B27.C3.V30.w6-w7', orig_morphology = 'AC/Np'
WHERE id = ${subqueryMappingId(27, 3, 30, 6)};
`);

// 5. Amos 1:4 بنهدد (ar_word_position = 8): expand into w7 and w8 under single lexicon entry H1130
sqlStatements.push(`
DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(30, 1, 4, 8)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(30, 1, 4, 8)}, 'H1130', 1, 'primary', 'בֶּן־', 7, 'HNp', 'oshb_wlc');

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(30, 1, 4, 8)}, 'H1130', 2, 'compound', 'הֲדָֽד׃', 8, 'HNp', 'oshb_wlc');

UPDATE word_mappings 
SET strongs_id = 'H1130', orig_word_position = 7, verified_locator = 'OSHB:B30.C1.V4.w7-w8', orig_morphology = 'HNp'
WHERE id = ${subqueryMappingId(30, 1, 4, 8)};
`);

// 6. Dan 3:30 شدرخ (ar_word_position = 4): update to Aramaic H7715, AR/Np
sqlStatements.push(`
UPDATE word_mappings 
SET strongs_id = 'H7715', orig_morphology = 'AR/Np', morph_pos = 'proper_noun', morph_stem = NULL, morph_tense = NULL
WHERE id = ${subqueryMappingId(27, 3, 30, 4)};

DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(27, 3, 30, 4)};

INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(27, 3, 30, 4)}, 'H7715', 1, 'primary', 'לְשַׁדְרַךְ', 4, 'AR/Np', 'oshb_wlc');
`);

// 7. 1 Sam 19:15 أَقْتُلَهُ: clear verbal person/gender/number (Infinitive Construct)
sqlStatements.push(`
UPDATE word_mappings 
SET morph_pos = 'verb', morph_stem = 'hifil', morph_tense = 'infinitive_construct',
    morph_person = NULL, morph_gender = NULL, morph_number = NULL
WHERE id = ${subqueryMappingId(9, 19, 15, 14)};
`);

// 8. Add Greek secondary components using canonical MorphGNT literal raw tags (RP ----AS-- for clitic με):
// John 14:19 «يَرَانِي» (ar pos 4) -> add secondary με (G3165, pos 6, RP ----AS--, morphgnt_sblgnt)
sqlStatements.push(`
DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(43, 14, 19, 4)} AND link_role = 'secondary';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(43, 14, 19, 4)}, 'G3165', 2, 'secondary', 'με', 6, 'RP ----AS--', 'morphgnt_sblgnt');
`);

// John 14:19 «فَتَرَوْنَنِي» (ar pos 9) -> add secondary με (G3165, pos 12, RP ----AS--, morphgnt_sblgnt)
sqlStatements.push(`
DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(43, 14, 19, 9)} AND link_role = 'secondary';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(43, 14, 19, 9)}, 'G3165', 2, 'secondary', 'με', 12, 'RP ----AS--', 'morphgnt_sblgnt');
`);

// Rom 9:23 «مَجْدِهِ» (ar pos 4) -> add secondary αὐτοῦ (G846, pos 8, RP ----GSM-, morphgnt_sblgnt)
sqlStatements.push(`
DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(45, 9, 23, 4)} AND link_role = 'secondary';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(45, 9, 23, 4)}, 'G846', 2, 'secondary', 'αὐτοῦ', 8, 'RP ----GSM-', 'morphgnt_sblgnt');
`);

// Rom 9:23 «لِلْمَجْدِ» (ar pos 11) -> add secondary εἰς (G1519, pos 14, P- --------, morphgnt_sblgnt)
sqlStatements.push(`
DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(45, 9, 23, 11)} AND link_role = 'secondary';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(45, 9, 23, 11)}, 'G1519', 2, 'secondary', 'εἰς', 14, 'P- --------', 'morphgnt_sblgnt');
`);

// Rom 9:23 «وَلِكَيْ» (ar pos 1) -> add secondary καὶ (G2532, pos 1, C- --------, morphgnt_sblgnt)
sqlStatements.push(`
DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(45, 9, 23, 1)} AND link_role = 'secondary';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(45, 9, 23, 1)}, 'G2532', 2, 'secondary', 'καὶ', 1, 'C- --------', 'morphgnt_sblgnt');
`);

// Acts 6:8 «وَقُوَّةً،» (ar pos 7) -> add secondary καὶ (G2532, pos 5, C- --------, morphgnt_sblgnt)
sqlStatements.push(`
DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(44, 6, 8, 7)} AND link_role = 'secondary';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(44, 6, 8, 7)}, 'G2532', 2, 'secondary', 'καὶ', 5, 'C- --------', 'morphgnt_sblgnt');
`);

// Acts 6:8 «وَآيَاتٍ» (ar pos 11) -> add secondary καὶ (G2532, pos 9, C- --------, morphgnt_sblgnt)
sqlStatements.push(`
DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(44, 6, 8, 11)} AND link_role = 'secondary';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(44, 6, 8, 11)}, 'G2532', 2, 'secondary', 'καὶ', 9, 'C- --------', 'morphgnt_sblgnt');
`);

// Col 1:23 syntactic alignment
sqlStatements.push(`
UPDATE word_mappings SET verified_locator = 'AR_SYNTACTIC:B51.C1.V23.w3' 
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=51 AND chapter_num=1 AND verse_num=23) AND ar_word_position=3;
`);

// Deut 23:2 «يَدْخُلِ» (ar pos 2) -> restore H935 יָבֹ֥א token 2, HVqi3ms, verb qal imperfect 3ms
sqlStatements.push(`
UPDATE word_mappings 
SET strongs_id = 'H935',
    orig_word = 'בּוֹא',
    orig_surface = 'יָבֹ֥א',
    orig_word_position = 2,
    orig_morphology = 'HVqi3ms',
    morph_pos = 'verb',
    morph_stem = 'qal',
    morph_tense = 'imperfect',
    morph_person = '3',
    morph_gender = 'masculine',
    morph_number = 'singular',
    morph_source = 'oshb_wlc',
    verified_source = 'OSHB',
    verified_locator = 'OSHB:B5.C23.V2.w2',
    is_verified = 1,
    relation_type = 'primary'
WHERE id = ${subqueryMappingId(5, 23, 2, 2)};

DELETE FROM word_mapping_strongs WHERE mapping_id = ${subqueryMappingId(5, 23, 2, 2)};
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES (${subqueryMappingId(5, 23, 2, 2)}, 'H935', 1, 'primary', 'יָבֹ֥א', 2, 'HVqi3ms', 'oshb_wlc');
`);

sqlStatements.push('COMMIT;');

fs.writeFileSync(tmpSql, sqlStatements.join('\n'), 'utf8');

console.log(`Executing ${sqlStatements.length} robust dynamic SQL steps...`);
execSync(`"${sqlite}" "${targetDb}" < "${tmpSql}"`, { encoding: 'utf8', shell: 'cmd.exe' });
console.log('Successfully applied all harmonizations cleanly and idempotently!');
