const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlitePath = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_run.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    const res = execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 });
    return res.toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('=== Step 1: Add structured component columns to word_mapping_strongs if missing ===');
const tableInfo = runSql('PRAGMA table_info(word_mapping_strongs);');
if (!tableInfo.includes('orig_word_position')) {
  console.log('Adding column orig_word_position to word_mapping_strongs...');
  runSql('ALTER TABLE word_mapping_strongs ADD COLUMN orig_word_position INTEGER;');
}
if (!tableInfo.includes('orig_morphology')) {
  console.log('Adding column orig_morphology to word_mapping_strongs...');
  runSql('ALTER TABLE word_mapping_strongs ADD COLUMN orig_morphology TEXT;');
}
if (!tableInfo.includes('morph_source')) {
  console.log('Adding column morph_source to word_mapping_strongs...');
  runSql('ALTER TABLE word_mapping_strongs ADD COLUMN morph_source TEXT;');
}

console.log('=== Step 2: Fix John 3:16 pos 2 («هكَذَا») and pos 1 («لأَنَّهُ») ===');
runSql(`
-- Fix John 3:16 pos 2 («هكَذَا») -> Οὕτως (w1)
UPDATE word_mappings 
SET orig_word = 'οὕτως',
    orig_word_position = 1,
    verified_locator = 'SBLGNT:B43.C3.V16.w1',
    orig_morphology = 'D- --------',
    morph_source = 'morphgnt_sblgnt'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 3 AND verse_num = 16)
  AND ar_word_position = 2;

-- Fix John 3:16 pos 1 («لأَنَّهُ») -> γάρ (w2)
UPDATE word_mappings 
SET orig_word = 'γάρ',
    orig_word_position = 2,
    verified_locator = 'SBLGNT:B43.C3.V16.w2',
    orig_morphology = 'C- --------',
    morph_source = 'morphgnt_sblgnt'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 43 AND chapter_num = 3 AND verse_num = 16)
  AND ar_word_position = 1;
`);

console.log('=== Step 3: Populate structured component data in word_mapping_strongs ===');
runSql(`
-- Isa 53:5 pos 12 («شُفِينَا»)
UPDATE word_mapping_strongs
SET orig_component = 'נִרְפָּא',
    orig_word_position = 10,
    orig_morphology = 'HVNp3ms',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (
  SELECT wm.id FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 23 AND v.chapter_num = 53 AND v.verse_num = 5 AND wm.ar_word_position = 12
) AND strongs_id = 'H7495';

UPDATE word_mapping_strongs
SET orig_component = 'לָנוּ',
    orig_word_position = 11,
    orig_morphology = 'HR/Sp1cp',
    morph_source = 'oshb_wlc'
WHERE mapping_id = (
  SELECT wm.id FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 23 AND v.chapter_num = 53 AND v.verse_num = 5 AND wm.ar_word_position = 12
) AND strongs_id = 'H3807a';

-- John 3:16 pos 16 («بِهِ»)
UPDATE word_mapping_strongs
SET orig_component = 'αὐτόν',
    orig_word_position = 19,
    orig_morphology = 'RP ----ASM-',
    morph_source = 'morphgnt_sblgnt'
WHERE mapping_id = (
  SELECT wm.id FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 43 AND v.chapter_num = 3 AND v.verse_num = 16 AND wm.ar_word_position = 16
) AND strongs_id = 'G846';

UPDATE word_mapping_strongs
SET orig_component = 'εἰς',
    orig_word_position = 18,
    orig_morphology = 'P- --------',
    morph_source = 'morphgnt_sblgnt'
WHERE mapping_id = (
  SELECT wm.id FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 43 AND v.chapter_num = 3 AND v.verse_num = 16 AND wm.ar_word_position = 16
) AND strongs_id = 'G1519';

-- Eph 2:8 pos 5 («وَذلِكَ»)
UPDATE word_mapping_strongs
SET orig_component = 'τοῦτο',
    orig_word_position = 9,
    orig_morphology = 'RD ----NSN-',
    morph_source = 'morphgnt_sblgnt'
WHERE mapping_id = (
  SELECT wm.id FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 49 AND v.chapter_num = 2 AND v.verse_num = 8 AND wm.ar_word_position = 5
) AND strongs_id = 'G3778';

UPDATE word_mapping_strongs
SET orig_component = 'καί',
    orig_word_position = 8,
    orig_morphology = 'C- --------',
    morph_source = 'morphgnt_sblgnt'
WHERE mapping_id = (
  SELECT wm.id FROM word_mappings wm 
  JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 49 AND v.chapter_num = 2 AND v.verse_num = 8 AND wm.ar_word_position = 5
) AND strongs_id = 'G2532';

-- Backfill primary records from word_mappings
UPDATE word_mapping_strongs
SET orig_word_position = (SELECT wm.orig_word_position FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
    orig_morphology = (SELECT wm.orig_morphology FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
    morph_source = (SELECT wm.morph_source FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id)
WHERE link_role = 'primary' AND orig_word_position IS NULL;
`);

console.log('=== Step 4: Verification ===');
console.log('John 3:16 pos 1 & 2:');
console.log(runSql(`
SELECT wm.ar_word_position, wm.ar_word, wm.orig_word, wm.orig_word_position, wm.verified_locator, wm.orig_morphology, wm.strongs_id
FROM word_mappings wm 
JOIN verses v ON wm.verse_id = v.id 
WHERE v.book_id = 43 AND v.chapter_num = 3 AND v.verse_num = 16 AND wm.ar_word_position IN (1, 2)
ORDER BY wm.ar_word_position ASC;
`));

console.log('Isa 53:5 pos 12 components in word_mapping_strongs:');
console.log(runSql(`
SELECT wms.strongs_id, wms.orig_component, wms.orig_word_position, wms.orig_morphology, wms.morph_source
FROM word_mapping_strongs wms
JOIN word_mappings wm ON wms.mapping_id = wm.id 
JOIN verses v ON wm.verse_id = v.id 
WHERE v.book_id = 23 AND v.chapter_num = 53 AND v.verse_num = 5 AND wm.ar_word_position = 12
ORDER BY wms.link_order ASC;
`));

console.log('All updates applied successfully!');
