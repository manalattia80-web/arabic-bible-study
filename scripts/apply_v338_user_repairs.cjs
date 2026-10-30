const child = require('child_process');

function runSql(sql) {
  return child.execFileSync('sqlite_dist\\sqlite3.exe', ['mobile/assets/bible_study.db', sql]).toString().trim();
}

console.log('=== Applying v338 Philological and Aramaic Repairs ===');

const sqlScript = `
BEGIN TRANSACTION;

-- 1. 2 Kings 5:1 w10 (سَيِّدِهِ): H136 -> H113
UPDATE word_mappings 
SET strongs_id = 'H113',
    orig_word = 'אָדוֹן',
    orig_surface = 'אֲדֹנָיו',
    orig_morphology = 'HNcmpc/Sp3ms',
    grammar_notes = 'اسم مذكر جمع مضاف مع ضمير الغائب المتصل (سيده)، والمقابل المعجمي الدقيق هو H113 (אָדוֹן) الدال على السيد البشري، وليس H136 (אֲדֹנָי) الدال على الاسم الإلهي.'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1)
  AND ar_word_position = 10;

UPDATE word_mapping_strongs
SET strongs_id = 'H113',
    orig_component = 'אֲדֹנָיו',
    orig_morphology = 'HNcmpc/Sp3ms'
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1) AND ar_word_position = 10);

-- 2. Ezra H5105 -> H5103 across all 7 occurrences in Ezra
UPDATE word_mappings
SET strongs_id = 'H5103',
    orig_word = 'נְהַר',
    grammar_notes = 'الاسم المذكر الآرامي נְהַר / נַהֲרָא برقم H5103 للدلالة على النهر، وليس H5105 العبري الدال على النور في أيوب 3: 4.'
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 15)
  AND strongs_id = 'H5105';

UPDATE word_mapping_strongs
SET strongs_id = 'H5103'
WHERE mapping_id IN (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 15)
  AND strongs_id = 'H5105';

-- 3. Matthew 22:30 SBLGNT Greek text and word positions
UPDATE verses
SET text_original = 'ἐν γὰρ τῇ ἀναστάσει οὔτε γαμοῦσιν οὔτε γαμίζονται, ἀλλ᾽ ὡς ἄγγελοι θεοῦ ἐν τῷ οὐρανῷ εἰσιν.'
WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30;

-- Update Matthew 22:30 word_mappings
-- اللهِ: orig_pos 13 -> 12
UPDATE word_mappings
SET orig_word_position = 12,
    orig_word = 'θεός',
    orig_surface = 'θεοῦ',
    verified_locator = 'SBLGNT:B40.C22.V30.w12'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
  AND ar_word_position = 11;

-- فِي: orig_pos 14 -> 13
UPDATE word_mappings
SET orig_word_position = 13,
    orig_word = 'ἐν',
    orig_surface = 'ἐν',
    verified_locator = 'SBLGNT:B40.C22.V30.w13'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
  AND ar_word_position = 12;

-- السَّمَاءِ: orig_pos 15 -> 15 (unchanged, matches οὐρανῷ w15)
UPDATE word_mappings
SET orig_word_position = 15,
    orig_word = 'οὐρανός',
    orig_surface = 'οὐρανῷ',
    verified_locator = 'SBLGNT:B40.C22.V30.w15'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
  AND ar_word_position = 13;

-- يَكُونُونَ: orig_pos 16 -> 16 (unchanged, matches εἰσίν w16)
UPDATE word_mappings
SET orig_word_position = 16,
    orig_word = 'εἰμί',
    orig_surface = 'εἰσίν',
    verified_locator = 'SBLGNT:B40.C22.V30.w16'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
  AND ar_word_position = 9;

-- Sync word_mapping_strongs for Matthew 22:30
UPDATE word_mapping_strongs
SET orig_word_position = 12
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30) AND ar_word_position = 11);

UPDATE word_mapping_strongs
SET orig_word_position = 13
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30) AND ar_word_position = 12);

UPDATE word_mapping_strongs
SET orig_word_position = 15
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30) AND ar_word_position = 13);

UPDATE word_mapping_strongs
SET orig_word_position = 16
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30) AND ar_word_position = 9);

-- Add secondary mapping for كَمَلاَئِكَةِ (w10) pointing to ἄγγελοι (pos 11, G32)
INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
SELECT wm.id, 'G32', 2, 'secondary', 'ἄγγελοι', 11, 'N- ----NPM-', 'morphgnt_sblgnt'
FROM word_mappings wm
JOIN verses v ON wm.verse_id = v.id
WHERE v.book_id = 40 AND v.chapter_num = 22 AND v.verse_num = 30 AND wm.ar_word_position = 10;

-- 4. Ezra 7:21 w7 (إِلَى), w11 (فِي), w12 (عَبْرِ)
-- w7: إِلَى
UPDATE word_mappings
SET orig_word_position = 7,
    orig_word = 'לְ',
    orig_surface = 'לְכֹל',
    strongs_id = '',
    morph_pos = 'preposition',
    relation_type = 'compound_phrase',
    grammar_notes = 'حرف الجر الآرامي المتصل (اللام) في لְכֹל، ولا علاقة له بهاء الاتجاه العبرية.'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 7 AND verse_num = 21)
  AND ar_word_position = 7;

-- Remove any empty strongs row from word_mapping_strongs for w7 to maintain multi-strongs integrity
DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 7 AND verse_num = 21) AND ar_word_position = 7);

-- w11: فِي
UPDATE word_mappings
SET orig_word_position = 10,
    orig_word = 'בְּ',
    orig_surface = 'בַּעֲבַר',
    strongs_id = '',
    morph_pos = 'preposition',
    relation_type = 'compound_phrase',
    grammar_notes = 'حرف الجر الآرامي المتصل (الباء) في בַּעֲבַר دال على الظرفية، بينما عَبْر تقابل الاسم الآرامي עֲבַר (H5675).'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 7 AND verse_num = 21)
  AND ar_word_position = 11;

DELETE FROM word_mapping_strongs
WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 7 AND verse_num = 21) AND ar_word_position = 11);

-- w12: عَبْرِ
UPDATE word_mappings
SET orig_word_position = 10,
    orig_word = 'עֲבַר',
    orig_surface = 'בַּעֲבַ֣ר',
    strongs_id = 'H5675',
    morph_pos = 'noun',
    relation_type = 'compound_phrase'
WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 7 AND verse_num = 21)
  AND ar_word_position = 12;

-- 4b. Clean directional_heh from all remaining Aramaic verses in Ezra and Daniel
UPDATE word_mappings
SET relation_type = 'syntactic_prep',
    grammar_notes = 'حرف جر أو صياغة تعدية في الترجمة العربية لمقابلة التركيب في النص الآرامي، وليس هاء اتجاه عبرية.'
WHERE relation_type = 'directional_heh'
  AND verse_id IN (
    SELECT id FROM verses 
    WHERE (book_id = 15 AND ((chapter_num = 4 AND verse_num >= 8) OR chapter_num = 5 OR (chapter_num = 6 AND verse_num <= 18) OR (chapter_num = 7 AND verse_num >= 12 AND verse_num <= 26)))
       OR (book_id = 27 AND ((chapter_num = 2 AND verse_num >= 4) OR (chapter_num >= 3 AND chapter_num <= 7)))
  );

COMMIT;
`;

const res = runSql(sqlScript);
console.log('Result:', res || 'SUCCESS');
