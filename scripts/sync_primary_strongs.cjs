const child = require('child_process');

function q(sql) {
  return child.execFileSync('sqlite_dist\\sqlite3.exe', ['mobile/assets/bible_study.db', sql]).toString().trim();
}

console.log('--- Synchronizing word_mapping_strongs with word_mappings.strongs_id ---');

// Find all wm where strongs_id is not null and does not have matching primary in wms
const mismatches = q(`
  SELECT wm.id, wm.strongs_id, wm.orig_surface, wm.orig_word_position, wm.orig_morphology, wm.morph_source
  FROM word_mappings wm
  LEFT JOIN word_mapping_strongs wms 
    ON wm.id = wms.mapping_id AND wm.strongs_id = wms.strongs_id AND wms.link_role = 'primary'
  WHERE wm.strongs_id IS NOT NULL AND wms.mapping_id IS NULL;
`).split('\n').filter(Boolean);

console.log(`Found ${mismatches.length} unsynchronized mappings`);

for (const line of mismatches) {
  const [id, strongsId, origSurface, pos, morph, source] = line.split('|');
  
  // Check if there is an existing primary wms for this mapping_id
  const existingPrimary = q(`SELECT strongs_id FROM word_mapping_strongs WHERE mapping_id = '${id}' AND link_role = 'primary'`);
  
  if (existingPrimary) {
    // Update existing primary strongs_id to match wm.strongs_id
    console.log(`Updating primary wms for ${id}: ${existingPrimary} -> ${strongsId}`);
    q(`
      UPDATE word_mapping_strongs 
      SET strongs_id = '${strongsId}',
          orig_component = '${(origSurface || '').replace(/'/g, "''")}',
          orig_word_position = ${pos ? pos : 'NULL'},
          orig_morphology = '${(morph || '').replace(/'/g, "''")}'
      WHERE mapping_id = '${id}' AND link_role = 'primary';
    `);
  } else {
    // Check if there's any record at all
    const maxOrder = q(`SELECT COALESCE(MAX(link_order), 0) FROM word_mapping_strongs WHERE mapping_id = '${id}'`);
    const newOrder = parseInt(maxOrder, 10) + 1;
    console.log(`Inserting primary wms for ${id}: ${strongsId} at order ${newOrder}`);
    q(`
      INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
      VALUES ('${id}', '${strongsId}', ${newOrder}, 'primary', '${(origSurface || '').replace(/'/g, "''")}', ${pos ? pos : 'NULL'}, '${(morph || '').replace(/'/g, "''")}', '${(source || '').replace(/'/g, "''")}');
    `);
  }
}

console.log('Synchronization complete!');
