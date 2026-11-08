const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function executeSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_apply_batch1.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`);
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

// 1. ISAIAH 40:8 Updates
// OSHB tokens:
// w5: וּ/דְבַר (HC/Ncmsc, id 23xSy) -> كَلِمَةُ (ar pos 6)
// w6: אֱלֹהֵ֖י/נוּ (HNcmpc/Sp1cp, id 23z29) -> إِلهِنَا (ar pos 7)
// w7: יָק֥וּם (HVqi3ms, id 236ip) -> فَتَثْبُتُ (ar pos 8)
// w8: לְ/עוֹלָֽם (HR/Ncmsa, id 23Dv2) -> إِلَى (ar pos 9) & الأَبَدِ (ar pos 10)

const isaSql = `
-- Isa 40:8 w6 (كَلِمَةُ) -> w5
UPDATE word_mappings 
SET orig_word_position = 5, 
    verified_locator = 'OSHB:B23.C40.V8.w5',
    orig_morphology = 'HC/Ncmsc',
    orig_surface = 'וּדְבַר'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 40 AND verse_num = 8)
  AND ar_word_position = 6;

UPDATE word_mapping_strongs
SET orig_word_position = 5,
    orig_morphology = 'HC/Ncmsc'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 23 AND v.chapter_num = 40 AND v.verse_num = 8 AND wm.ar_word_position = 6
) AND link_role = 'primary';

-- Isa 40:8 w7 (إِلهِنَا) -> w6
UPDATE word_mappings 
SET orig_word_position = 6, 
    verified_locator = 'OSHB:B23.C40.V8.w6',
    orig_morphology = 'HNcmpc/Sp1cp',
    orig_surface = 'אֱלֹהֵ֖ינוּ'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 40 AND verse_num = 8)
  AND ar_word_position = 7;

UPDATE word_mapping_strongs
SET orig_word_position = 6,
    orig_morphology = 'HNcmpc/Sp1cp'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 23 AND v.chapter_num = 40 AND v.verse_num = 8 AND wm.ar_word_position = 7
) AND link_role = 'primary';

-- Isa 40:8 w8 (فَتَثْبُتُ) -> w7
UPDATE word_mappings 
SET orig_word_position = 7, 
    verified_locator = 'OSHB:B23.C40.V8.w7',
    orig_morphology = 'HVqi3ms',
    orig_surface = 'יָק֥וּם'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 40 AND verse_num = 8)
  AND ar_word_position = 8;

UPDATE word_mapping_strongs
SET orig_word_position = 7,
    orig_morphology = 'HVqi3ms'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 23 AND v.chapter_num = 40 AND v.verse_num = 8 AND wm.ar_word_position = 8
) AND link_role = 'primary';

-- Isa 40:8 w9 (إِلَى) -> w8
UPDATE word_mappings 
SET orig_word_position = 8, 
    verified_locator = 'OSHB:B23.C40.V8.w8',
    orig_morphology = 'HR/Ncmsa',
    orig_surface = 'לְעֹולָֽם'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 40 AND verse_num = 8)
  AND ar_word_position = 9;

UPDATE word_mapping_strongs
SET orig_word_position = 8,
    orig_morphology = 'HR/Ncmsa'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 23 AND v.chapter_num = 40 AND v.verse_num = 8 AND wm.ar_word_position = 9
) AND link_role = 'primary';

-- Isa 40:8 w10 (الأَبَدِ) -> w8
UPDATE word_mappings 
SET orig_word_position = 8, 
    verified_locator = 'OSHB:B23.C40.V8.w8',
    orig_morphology = 'HR/Ncmsa',
    orig_surface = 'לְעֹולָֽם'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 23 AND chapter_num = 40 AND verse_num = 8)
  AND ar_word_position = 10;

UPDATE word_mapping_strongs
SET orig_word_position = 8,
    orig_morphology = 'HR/Ncmsa'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 23 AND v.chapter_num = 40 AND v.verse_num = 8 AND wm.ar_word_position = 10
) AND link_role = 'primary';
`;

// 2. MICAH 6:8 Updates
const micSql = `
-- Mic 6:8 w2 (أَخْبَرَكَ) -> w1 (הִגִּ֥יד)
UPDATE word_mappings 
SET orig_word_position = 1, 
    verified_locator = 'OSHB:B33.C6.V8.w1',
    orig_morphology = 'HVhp3ms',
    orig_surface = 'הִגִּ֥יד'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 2;

UPDATE word_mapping_strongs
SET orig_word_position = 1,
    orig_morphology = 'HVhp3ms'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 2
) AND link_role = 'primary';

-- Mic 6:8 w4 (الإِنْسَانُ) -> w3 (אָדָ֖ם)
UPDATE word_mappings 
SET orig_word_position = 3, 
    verified_locator = 'OSHB:B33.C6.V8.w3',
    orig_morphology = 'HNcmsa',
    orig_surface = 'אָדָ֖ם'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 4;

UPDATE word_mapping_strongs
SET orig_word_position = 3,
    orig_morphology = 'HNcmsa'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 4
) AND link_role = 'primary';

-- Mic 6:8 w5 (مَا) -> w4 (מַה)
UPDATE word_mappings 
SET orig_word_position = 4, 
    verified_locator = 'OSHB:B33.C6.V8.w4',
    orig_morphology = 'HTi',
    orig_surface = 'מַה'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 5;

UPDATE word_mapping_strongs
SET orig_word_position = 4,
    orig_morphology = 'HTi'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 5
) AND link_role = 'primary';

-- Mic 6:8 w7 (صَالِحٌ) -> w5 (טּ֑וֹב)
UPDATE word_mappings 
SET orig_word_position = 5, 
    verified_locator = 'OSHB:B33.C6.V8.w5',
    orig_morphology = 'HAamsa',
    orig_surface = 'טּ֑וֹב'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 7;

UPDATE word_mapping_strongs
SET orig_word_position = 5,
    orig_morphology = 'HAamsa'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 7
) AND link_role = 'primary';

-- Mic 6:8 w8 (وَمَاذَا) -> w6 (וּ/מָֽה)
UPDATE word_mappings 
SET orig_word_position = 6, 
    verified_locator = 'OSHB:B33.C6.V8.w6',
    orig_morphology = 'HC/Ti',
    orig_surface = 'וּמָֽה'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 8;

UPDATE word_mapping_strongs
SET orig_word_position = 6,
    orig_morphology = 'HC/Ti'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 8
) AND link_role = 'primary';

-- Mic 6:8 w9 (يَطْلُبُهُ) -> w8 (דּוֹרֵ֣שׁ)
UPDATE word_mappings 
SET orig_word_position = 8, 
    verified_locator = 'OSHB:B33.C6.V8.w8',
    orig_morphology = 'HVqrmsa',
    orig_surface = 'דּוֹרֵ֣שׁ'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 9;

UPDATE word_mapping_strongs
SET orig_word_position = 8,
    orig_morphology = 'HVqrmsa'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 9
) AND link_role = 'primary';

-- Mic 6:8 w10 (مِنْكَ) -> w9 (מִמְּ/ךָ֗)
UPDATE word_mappings 
SET orig_word_position = 9, 
    verified_locator = 'OSHB:B33.C6.V8.w9',
    orig_morphology = 'HR/Sp2ms',
    orig_surface = 'מִמְּךָ֗'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 10;

UPDATE word_mapping_strongs
SET orig_word_position = 9,
    orig_morphology = 'HR/Sp2ms'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 10
) AND link_role = 'primary';

-- Mic 6:8 w11 (الرَّبُّ) -> w7 (יְהוָ֞ה)
UPDATE word_mappings 
SET orig_word_position = 7, 
    verified_locator = 'OSHB:B33.C6.V8.w7',
    orig_morphology = 'HNp',
    orig_surface = 'יְהוָ֞ה'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 11;

UPDATE word_mapping_strongs
SET orig_word_position = 7,
    orig_morphology = 'HNp'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 11
) AND link_role = 'primary';

-- Mic 6:8 w12 (إِلاَّ) -> w10 (כִּ֣י)
UPDATE word_mappings 
SET orig_word_position = 10, 
    verified_locator = 'OSHB:B33.C6.V8.w10',
    orig_morphology = 'HC',
    orig_surface = 'כִּ֣י'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 12;

UPDATE word_mapping_strongs
SET orig_word_position = 10,
    orig_morphology = 'HC'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 12
) AND link_role = 'primary';

-- Mic 6:8 w13 (أَنْ) -> w11 (אִם)
UPDATE word_mappings 
SET orig_word_position = 11, 
    verified_locator = 'OSHB:B33.C6.V8.w11',
    orig_morphology = 'HC',
    orig_surface = 'אִם'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 13;

UPDATE word_mapping_strongs
SET orig_word_position = 11,
    orig_morphology = 'HC'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 13
) AND link_role = 'primary';

-- Mic 6:8 w14 (تَصْنَعَ) -> w12 (עֲשׂ֤וֹת)
UPDATE word_mappings 
SET orig_word_position = 12, 
    verified_locator = 'OSHB:B33.C6.V8.w12',
    orig_morphology = 'HVqc',
    orig_surface = 'עֲשׂ֤וֹת'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 14;

UPDATE word_mapping_strongs
SET orig_word_position = 12,
    orig_morphology = 'HVqc'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 14
) AND link_role = 'primary';

-- Mic 6:8 w15 (الْحَقَّ) -> w13 (מִשְׁפָּט֙)
UPDATE word_mappings 
SET orig_word_position = 13, 
    verified_locator = 'OSHB:B33.C6.V8.w13',
    orig_morphology = 'HNcmsa',
    orig_surface = 'מִשְׁפָּט֙'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 15;

UPDATE word_mapping_strongs
SET orig_word_position = 13,
    orig_morphology = 'HNcmsa'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 15
) AND link_role = 'primary';

-- Mic 6:8 w16 (وَتُحِبَّ) -> w14 (וְ/אַ֣הֲבַת)
UPDATE word_mappings 
SET orig_word_position = 14, 
    verified_locator = 'OSHB:B33.C6.V8.w14',
    orig_morphology = 'HC/Ncfsc',
    orig_surface = 'וְאַהֲבַת'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 16;

UPDATE word_mapping_strongs
SET orig_word_position = 14,
    orig_morphology = 'HC/Ncfsc'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 16
) AND link_role = 'primary';

-- Mic 6:8 w17 (الرَّحْمَةَ) -> w15 (חֶ֔סֶד)
UPDATE word_mappings 
SET orig_word_position = 15, 
    verified_locator = 'OSHB:B33.C6.V8.w15',
    orig_morphology = 'HNcmsa',
    orig_surface = 'חֶ֔סֶד'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 17;

UPDATE word_mapping_strongs
SET orig_word_position = 15,
    orig_morphology = 'HNcmsa'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 17
) AND link_role = 'primary';

-- Mic 6:8 w18 (وَتَسْلُكَ) -> w17 (לֶ֖כֶת)
UPDATE word_mappings 
SET orig_word_position = 17, 
    verified_locator = 'OSHB:B33.C6.V8.w17',
    orig_morphology = 'HVqc',
    orig_surface = 'לֶ֖כֶת'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 18;

UPDATE word_mapping_strongs
SET orig_word_position = 17,
    orig_morphology = 'HVqc'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 18
) AND link_role = 'primary';

-- Mic 6:8 w19 (مُتَوَاضِعًا) -> w16 (וְ/הַצְנֵ֥עַ)
UPDATE word_mappings 
SET orig_word_position = 16, 
    verified_locator = 'OSHB:B33.C6.V8.w16',
    orig_morphology = 'HC/Vha',
    orig_surface = 'וְהַצְנֵ֥עַ'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 19;

UPDATE word_mapping_strongs
SET orig_word_position = 16,
    orig_morphology = 'HC/Vha'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 19
) AND link_role = 'primary';

-- Mic 6:8 w20 (مَعَ) -> w18 (עִם)
UPDATE word_mappings 
SET orig_word_position = 18, 
    verified_locator = 'OSHB:B33.C6.V8.w18',
    orig_morphology = 'HR',
    orig_surface = 'עִם'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 20;

UPDATE word_mapping_strongs
SET orig_word_position = 18,
    orig_morphology = 'HR'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 20
) AND link_role = 'primary';

-- Mic 6:8 w21 (إِلهِكَ) -> w19 (אֱלֹהֶֽי/ךָ)
UPDATE word_mappings 
SET orig_word_position = 19, 
    verified_locator = 'OSHB:B33.C6.V8.w19',
    orig_morphology = 'HNcmpc/Sp2ms',
    orig_surface = 'אֱלֹהֶֽיךָ'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 33 AND chapter_num = 6 AND verse_num = 8)
  AND ar_word_position = 21;

UPDATE word_mapping_strongs
SET orig_word_position = 19,
    orig_morphology = 'HNcmpc/Sp2ms'
WHERE mapping_id IN (
  SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id 
  WHERE v.book_id = 33 AND v.chapter_num = 6 AND verse_num = 8 AND wm.ar_word_position = 21
) AND link_role = 'primary';
`;

console.log('Applying Isaiah 40:8 updates...');
executeSql(isaSql);
console.log('Applying Micah 6:8 updates...');
executeSql(micSql);

console.log('Updates applied successfully!');
