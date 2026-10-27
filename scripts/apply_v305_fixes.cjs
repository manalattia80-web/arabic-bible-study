const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function executeSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_v305.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('Applying v305 philological fixes...');

// Pure Hebrew וַיִּבְנוּ:
// \u05D5 (vav) \u05B7 (patach) \u05D9 (yod) \u05B4 (chiriq) \u05BC (dagesh) \u05D1 (bet) \u05B0 (sheva) \u05E0 (nun) \u05D5\u05BC (shuruq)
const pureHebrewVayivnu = '\u05D5\u05B7\u05D9\u05B4\u05BC\u05D1\u05B0\u05E0\u05D5\u05BC';

const sql = `
BEGIN TRANSACTION;

-- 1. Gen 3:6: 'بَهِجَةٌ' -> H8378 (תַּאֲוָה / desire, delight) instead of H8350 (שָׁשַׁר)
UPDATE word_mappings 
SET strongs_id = 'H8378', orig_word = 'תַּאֲוָה', orig_surface = 'תַאֲוָה', morph_pos = 'noun', morph_source = 'oshb_wlc'
WHERE id = 'bde78eef-c107-42a5-8e9e-180716b6d82b';

DELETE FROM word_mapping_strongs WHERE mapping_id = 'bde78eef-c107-42a5-8e9e-180716b6d82b';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
VALUES ('bde78eef-c107-42a5-8e9e-180716b6d82b', 'H8378', 1, 'primary', 'תַאֲוָה');

-- 2. Col 1:23: 'عَلَى' -> syntactic_ar (no independent Greek preposition ἐν in ἐπιμένετε τῇ πίστει)
UPDATE word_mappings
SET strongs_id = NULL, orig_word = '—', orig_surface = '—', morph_pos = 'syntactic_ar', morph_source = 'syntactic_ar'
WHERE id = '2cfa8d18-0354-452f-bf48-ae2545b156a9';

DELETE FROM word_mapping_strongs WHERE mapping_id = '2cfa8d18-0354-452f-bf48-ae2545b156a9';

-- 3. Jer 52:4: 'وَبَنَوْا' -> replace mixed Arabic letters with pure Hebrew letters
UPDATE word_mappings
SET orig_word = 'בָּנָה', orig_surface = '${pureHebrewVayivnu}'
WHERE id = '2cdb381b-d0e6-4f13-bb1d-918ecf9e5934';

UPDATE word_mapping_strongs
SET orig_component = '${pureHebrewVayivnu}'
WHERE mapping_id = '2cdb381b-d0e6-4f13-bb1d-918ecf9e5934' AND strongs_id = 'H1129';

COMMIT;
`;

executeSql(sql);
console.log('SQL transaction applied successfully!');

// Verification queries
console.log('\n--- Verification 1: Gen 3:6 ---');
console.log(executeSql("SELECT ar_word_position, ar_word, strongs_id, orig_word, orig_surface FROM word_mappings WHERE id = 'bde78eef-c107-42a5-8e9e-180716b6d82b';"));

console.log('\n--- Verification 2: Col 1:23 ---');
console.log(executeSql("SELECT ar_word_position, ar_word, strongs_id, orig_word, orig_surface, morph_pos FROM word_mappings WHERE id = '2cfa8d18-0354-452f-bf48-ae2545b156a9';"));

console.log('\n--- Verification 3: Jer 52:4 character codes ---');
const jerSurface = executeSql("SELECT orig_surface FROM word_mappings WHERE id = '2cdb381b-d0e6-4f13-bb1d-918ecf9e5934';");
console.log('Surface text:', jerSurface);
const codePoints = Array.from(jerSurface).map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'));
console.log('Code points:', codePoints.join(' '));
const hasArabic = codePoints.some(cp => cp >= 'U+0600' && cp <= 'U+06FF');
console.log('Contains any Arabic chars:', hasArabic);
