const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SQLITE = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function executeSql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_apply_v43.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${SQLITE}" "${DB}" < "${tmp}"`, { stdio: 'inherit' });
    console.log('SQL executed successfully.');
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

const sql = `
BEGIN TRANSACTION;

-- 1. Acts 1:8 pos 2 (سَتَنَالُونَ): Exact MorphGNT SBLGNT literal tag V- 2FMI-P--
UPDATE word_mappings
SET orig_morphology = 'V- 2FMI-P--',
    morph_source = 'morphgnt_sblgnt',
    verified_source = 'SBLGNT',
    verified_locator = 'SBLGNT:B44.C1.V8.w2'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position=2;

-- 2. Acts 1:8 pos 5 (حَلَّ): Exact MorphGNT SBLGNT literal tag V- -AAPGSN-
UPDATE word_mappings
SET orig_morphology = 'V- -AAPGSN-',
    morph_source = 'morphgnt_sblgnt',
    verified_source = 'SBLGNT',
    verified_locator = 'SBLGNT:B44.C1.V8.w4'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position=5;

-- 3. Acts 1:8 pos 10 (لِي): Exact MorphGNT SBLGNT literal tag RP ----GS--
UPDATE word_mappings
SET orig_morphology = 'RP ----GS--',
    morph_source = 'morphgnt_sblgnt',
    verified_source = 'SBLGNT',
    verified_locator = 'SBLGNT:B44.C1.V8.w12'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=44 AND chapter_num=1 AND verse_num=8)
  AND ar_word_position=10;

-- 4. Heb 11:1 pos 3 (فَهُوَ): Exact MorphGNT SBLGNT literal tag V- 3PAI-S--
UPDATE word_mappings
SET orig_morphology = 'V- 3PAI-S--',
    morph_source = 'morphgnt_sblgnt',
    verified_source = 'SBLGNT',
    verified_locator = 'SBLGNT:B58.C11.V1.w1'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=58 AND chapter_num=11 AND verse_num=1)
  AND ar_word_position=3;

-- 5. Heb 11:1 pos 6 (يُرْجَى): Exact MorphGNT SBLGNT literal tag V- -PPPGPN-
UPDATE word_mappings
SET orig_morphology = 'V- -PPPGPN-',
    morph_source = 'morphgnt_sblgnt',
    verified_source = 'SBLGNT',
    verified_locator = 'SBLGNT:B58.C11.V1.w4'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=58 AND chapter_num=11 AND verse_num=1)
  AND ar_word_position=6;

-- 6. John 3:16 pos 2 (هكَذَا): Exact MorphGNT SBLGNT literal tag D- --------
UPDATE word_mappings
SET orig_morphology = 'D- --------',
    morph_source = 'morphgnt_sblgnt',
    verified_source = 'SBLGNT',
    verified_locator = 'SBLGNT:B43.C3.V16.w1'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=3 AND verse_num=16)
  AND ar_word_position=2;

-- 7. John 3:16 pos 16 (بِهِ): Exact MorphGNT SBLGNT literal tag RP ----ASM-
UPDATE word_mappings
SET orig_morphology = 'RP ----ASM-',
    morph_source = 'morphgnt_sblgnt',
    verified_source = 'SBLGNT',
    verified_locator = 'SBLGNT:B43.C3.V16.w19'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=43 AND chapter_num=3 AND verse_num=16)
  AND ar_word_position=16;

-- 8. Rev 21:4 pos 19 (وَجَعٌ): Exact MorphGNT SBLGNT literal tag N- ----NSM-
UPDATE word_mappings
SET orig_morphology = 'N- ----NSM-',
    morph_source = 'morphgnt_sblgnt',
    verified_source = 'SBLGNT',
    verified_locator = 'SBLGNT:B66.C21.V4.w20'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=66 AND chapter_num=21 AND verse_num=4)
  AND ar_word_position=19;

-- 9. Rev 21:4 pos 27 (مَضَتْ): Exact MorphGNT SBLGNT literal tag V- 3AAI-P--
UPDATE word_mappings
SET orig_morphology = 'V- 3AAI-P--',
    morph_source = 'morphgnt_sblgnt',
    verified_source = 'SBLGNT',
    verified_locator = 'SBLGNT:B66.C21.V4.w26'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=66 AND chapter_num=21 AND verse_num=4)
  AND ar_word_position=27;

-- 10. 1 Sam 25:43 pos 7 (فَكَانَتَا): Populate orig_word_position = 6
UPDATE word_mappings
SET orig_word_position = 6,
    orig_morphology = 'HC/Vqw3fp',
    morph_source = 'oshb_wlc',
    verified_source = 'OSHB',
    verified_locator = 'OSHB:B9.C25.V43.w6'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=9 AND chapter_num=25 AND verse_num=43)
  AND ar_word_position=7;

-- 11. Isa 53:5 pos 12 (شُفِينَا): Separate raw morphology:
-- Set word_mappings.orig_morphology to the primary verb raw tag HVNp3ms (נִרְפָּא w10)
UPDATE word_mappings
SET orig_morphology = 'HVNp3ms',
    orig_word_position = 10,
    verified_locator = 'OSHB:B23.C53.V5.w10-w11'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id=23 AND chapter_num=53 AND verse_num=5)
  AND ar_word_position=12;

-- Update word_mapping_strongs components for Isa 53:5 pos 12
UPDATE word_mapping_strongs
SET orig_component = 'נִרְפָּא'
WHERE mapping_id = '87a9eea0-9462-4680-bbff-a9734bde0462' AND strongs_id = 'H7495';

UPDATE word_mapping_strongs
SET orig_component = 'לָנוּ'
WHERE mapping_id = '87a9eea0-9462-4680-bbff-a9734bde0462' AND strongs_id = 'H3807a';

-- 12. H3807a in strongs_entries: Transparent scholarly declaration as internal project identifier
DELETE FROM strongs_entries WHERE strongs_id = 'H3807a';
INSERT INTO strongs_entries (strongs_id, language, original_word, transliteration, definition_en, kjv_usage)
VALUES (
  'H3807a',
  'hebrew',
  'לָנוּ',
  'lâ-nû',
  'Preposition with 1st person plural pronoun suffix: to us, for us [Internal Project Syntactic Identifier / معرّف نحوي داخلي للمشروع; maps prepositional phrase לָנוּ (OSHB: HR/Sp1cp, WLC w11) in compound verbal phrases such as Isa 53:5 נִרְפָּא־לָנוּ, disambiguated with suffix a to strictly avoid numeric collision with primitive verbal root H3807 כָּתַת].',
  'to us, for us, unto us'
);

COMMIT;
`;

executeSql(sql);
