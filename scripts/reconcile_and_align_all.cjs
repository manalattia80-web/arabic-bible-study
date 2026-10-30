const child = require('child_process');

function q(sql) {
  return child.execFileSync('sqlite_dist\\sqlite3.exe', ['mobile/assets/bible_study.db', sql]).toString().trim();
}

console.log('--- Aligning verified_locator and primary word_mapping_strongs ---');

// 1. Fix verified_locators for the changed positions:
q(`
  UPDATE word_mappings
  SET verified_locator = 'OSHB:B7.C20.V42.w10'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 20 AND verse_num = 42)
    AND ar_word_position = 12;
`);

q(`
  UPDATE word_mappings
  SET verified_locator = 'OSHB:B12.C5.V1.w8'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1)
    AND ar_word_position IN (14, 15);
`);

q(`
  UPDATE word_mappings
  SET verified_locator = 'OSHB:B15.C7.V21.w15'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 7 AND verse_num = 21)
    AND ar_word_position = 18;
`);

q(`
  UPDATE word_mappings
  SET verified_locator = 'OSHB:B27.C2.V38.w21'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 38)
    AND ar_word_position = 17;
`);

// 2. Synchronize primary word_mapping_strongs with word_mappings exactly
q(`
  UPDATE word_mapping_strongs
  SET orig_word_position = (SELECT wm.orig_word_position FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      strongs_id = (SELECT wm.strongs_id FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      orig_morphology = (SELECT wm.orig_morphology FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      morph_source = (SELECT wm.morph_source FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      orig_component = (SELECT wm.orig_surface FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id)
  WHERE link_role = 'primary'
    AND EXISTS (SELECT 1 FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id);
`);

// 3. For any word_mappings where strongs_id is not null but has NO primary in word_mapping_strongs:
const missingPrimaries = q(`
  SELECT wm.id, wm.strongs_id, wm.orig_surface, wm.orig_word_position, wm.orig_morphology, wm.morph_source
  FROM word_mappings wm
  LEFT JOIN word_mapping_strongs wms ON wm.id = wms.mapping_id AND wms.link_role = 'primary'
  WHERE wm.strongs_id IS NOT NULL AND wms.mapping_id IS NULL;
`).split('\n').filter(Boolean);

console.log(`Missing primary count: ${missingPrimaries.length}`);
for (const line of missingPrimaries) {
  const [id, strongsId, origSurface, pos, morph, source] = line.split('|');
  const maxOrder = q(`SELECT COALESCE(MAX(link_order), 0) FROM word_mapping_strongs WHERE mapping_id = '${id}'`);
  const newOrder = parseInt(maxOrder, 10) + 1;
  q(`
    INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
    VALUES ('${id}', '${strongsId}', ${newOrder}, 'primary', '${(origSurface || '').replace(/'/g, "''")}', ${pos ? pos : 'NULL'}, '${(morph || '').replace(/'/g, "''")}', '${(source || '').replace(/'/g, "''")}');
  `);
}

console.log('Reconciliation complete!');
