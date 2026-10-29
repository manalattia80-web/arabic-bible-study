const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function querySql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_anomaly_scan.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    const res = execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { encoding: 'utf8', windowsHide: true });
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    return res.trim();
  } catch (e) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw e;
  }
}

console.log('=== Running Comprehensive Whole-Database Anomaly & Discrepancy Scanner ===');

const report = {
  scan_date: new Date().toISOString(),
  total_records_scanned: 0,
  categories: {}
};

// 0. Total count
report.total_records_scanned = Number(querySql('SELECT COUNT(*) FROM word_mappings;'));
console.log(`Total word mappings in database: ${report.total_records_scanned.toLocaleString()}`);

// 1. Cross-testament Strong's mismatch (H in NT or G in OT)
console.log('\n[Check 1] Cross-Testament Strong\'s conflicts...');
const crossTestamentSql = `
  SELECT wm.id, b.name_en, v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.strongs_id
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  JOIN books b ON v.book_id = b.id
  WHERE (b.id BETWEEN 1 AND 39 AND wm.strongs_id LIKE 'G%')
     OR (b.id BETWEEN 40 AND 66 AND wm.strongs_id LIKE 'H%')
  LIMIT 50;
`;
const crossTestamentRows = querySql(crossTestamentSql).split('\n').filter(Boolean);
const crossCount = Number(querySql(`
  SELECT COUNT(*) FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  WHERE (v.book_id BETWEEN 1 AND 39 AND wm.strongs_id LIKE 'G%')
     OR (v.book_id BETWEEN 40 AND 66 AND wm.strongs_id LIKE 'H%');
`));
report.categories.cross_testament_strongs = {
  count: crossCount,
  description: "Strong's prefix contradicts Testament (Greek in OT or Hebrew in NT)",
  samples: crossTestamentRows
};
console.log(`  Found: ${crossCount}`);

// 2. Morphology POS vs Derived morph_pos Conflicts
console.log('\n[Check 2] Morphology Tag vs morph_pos conflicts (e.g. Noun vs Verb)...');
const morphConflictSql = `
  SELECT wm.id, b.name_en, v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_morphology, wm.morph_pos
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  JOIN books b ON v.book_id = b.id
  WHERE wm.orig_morphology IS NOT NULL AND wm.orig_morphology != ''
    AND (
      -- Raw tag is Noun (HN or N-) but morph_pos is 'verb'
      ((wm.orig_morphology LIKE 'HN%' OR wm.orig_morphology LIKE 'N-%' OR wm.orig_morphology LIKE 'N %') AND wm.morph_pos = 'verb')
      -- Raw tag is Verb (HV, AV, V-) but morph_pos is 'noun' or 'proper_noun'
      OR ((wm.orig_morphology LIKE 'HV%' OR wm.orig_morphology LIKE 'AV%' OR wm.orig_morphology LIKE 'V-%' OR wm.orig_morphology LIKE 'V %') AND wm.morph_pos IN ('noun', 'proper_noun'))
    )
  LIMIT 50;
`;
const morphConflictRows = querySql(morphConflictSql).split('\n').filter(Boolean);
const morphConflictCount = Number(querySql(`
  SELECT COUNT(*) FROM word_mappings wm
  WHERE wm.orig_morphology IS NOT NULL AND wm.orig_morphology != ''
    AND (
      ((wm.orig_morphology LIKE 'HN%' OR wm.orig_morphology LIKE 'N-%' OR wm.orig_morphology LIKE 'N %') AND wm.morph_pos = 'verb')
      OR ((wm.orig_morphology LIKE 'HV%' OR wm.orig_morphology LIKE 'AV%' OR wm.orig_morphology LIKE 'V-%' OR wm.orig_morphology LIKE 'V %') AND wm.morph_pos IN ('noun', 'proper_noun'))
    );
`));
report.categories.morphology_pos_conflicts = {
  count: morphConflictCount,
  description: "Raw morphology tag fundamentally contradicts displayed morph_pos (Noun tagged as Verb or Verb tagged as Noun)",
  samples: morphConflictRows
};
console.log(`  Found: ${morphConflictCount}`);

// 3. Locator Position vs orig_word_position Mismatches (Single-token locators)
console.log('\n[Check 3] Single-token locator position mismatches...');
const locatorMismatchCount = Number(querySql(`
  SELECT COUNT(*) FROM word_mappings
  WHERE verified_locator IS NOT NULL
    AND verified_locator NOT LIKE '%-%'
    AND verified_locator LIKE '%.w%'
    AND CAST(SUBSTR(verified_locator, INSTR(verified_locator, '.w') + 2) AS INTEGER) != orig_word_position;
`));
const locatorMismatchSamples = querySql(`
  SELECT wm.id, b.name_en, v.chapter_num, v.verse_num, wm.ar_word_position, wm.orig_word_position, wm.verified_locator
  FROM word_mappings wm
  JOIN verses v ON wm.verse_id = v.id
  JOIN books b ON v.book_id = b.id
  WHERE wm.verified_locator IS NOT NULL
    AND wm.verified_locator NOT LIKE '%-%'
    AND wm.verified_locator LIKE '%.w%'
    AND CAST(SUBSTR(verified_locator, INSTR(verified_locator, '.w') + 2) AS INTEGER) != wm.orig_word_position
  LIMIT 50;
`).split('\n').filter(Boolean);
report.categories.single_locator_position_mismatches = {
  count: locatorMismatchCount,
  description: "Single-token locator suffix (.wN) does not equal orig_word_position",
  samples: locatorMismatchSamples
};
console.log(`  Found: ${locatorMismatchCount}`);

// 4. Syntactic AR Classification with present Strong's ID
console.log('\n[Check 4] Syntactic AR records carrying Strong\'s ID...');
const syntacticWithStrongsCount = Number(querySql(`
  SELECT COUNT(*) FROM word_mappings
  WHERE morph_source = 'syntactic_ar' AND (strongs_id IS NOT NULL AND strongs_id != '');
`));
report.categories.syntactic_ar_with_strongs = {
  count: syntacticWithStrongsCount,
  description: "Words classified as syntactic_ar or translation additions that retain a Strong's ID",
  samples: querySql(`
    SELECT wm.id, b.name_en, v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.morph_source
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    JOIN books b ON v.book_id = b.id
    WHERE wm.morph_source = 'syntactic_ar' AND (wm.strongs_id IS NOT NULL AND wm.strongs_id != '')
    LIMIT 50;
  `).split('\n').filter(Boolean)
};
console.log(`  Found: ${syntacticWithStrongsCount}`);

// 5. Verbs with Strong's and Original surface that claim syntactic_ar provenance
console.log('\n[Check 5] Verbs carrying authentic Strong\'s but labeled syntactic_ar provenance...');
const verbSyntacticCount = Number(querySql(`
  SELECT COUNT(*) FROM word_mappings
  WHERE morph_pos = 'verb' 
    AND (strongs_id IS NOT NULL AND strongs_id != '')
    AND morph_source = 'syntactic_ar';
`));
report.categories.verb_with_syntactic_ar_source = {
  count: verbSyntacticCount,
  description: "Verbs with valid Strong's IDs that are labeled as syntactic_ar provenance",
  samples: querySql(`
    SELECT wm.id, b.name_en, v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.strongs_id
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    JOIN books b ON v.book_id = b.id
    WHERE wm.morph_pos = 'verb' 
      AND (wm.strongs_id IS NOT NULL AND wm.strongs_id != '')
      AND wm.morph_source = 'syntactic_ar'
    LIMIT 50;
  `).split('\n').filter(Boolean)
};
console.log(`  Found: ${verbSyntacticCount}`);

// 6. Primary Component Synchronization Discrepancies between word_mappings and word_mapping_strongs
console.log('\n[Check 6] Mismatches between word_mappings and primary word_mapping_strongs...');
const syncDiscrepancyCount = Number(querySql(`
  SELECT COUNT(*)
  FROM word_mappings wm
  JOIN word_mapping_strongs wms ON wm.id = wms.mapping_id AND wms.link_role = 'primary'
  WHERE wm.orig_word_position IS NOT wms.orig_word_position
     OR wm.strongs_id IS NOT wms.strongs_id
     OR wm.orig_morphology IS NOT wms.orig_morphology
     OR wm.morph_source IS NOT wms.morph_source;
`));
report.categories.primary_component_mismatches = {
  count: syncDiscrepancyCount,
  description: "Inconsistencies between word_mappings and its corresponding primary entry in word_mapping_strongs",
  samples: querySql(`
    SELECT wm.id, b.name_en, v.chapter_num, v.verse_num, wm.ar_word_position,
           wm.orig_word_position as wm_pos, wms.orig_word_position as wms_pos,
           wm.strongs_id as wm_strongs, wms.strongs_id as wms_strongs
    FROM word_mappings wm
    JOIN word_mapping_strongs wms ON wm.id = wms.mapping_id AND wms.link_role = 'primary'
    JOIN verses v ON wm.verse_id = v.id
    JOIN books b ON v.book_id = b.id
    WHERE wm.orig_word_position IS NOT wms.orig_word_position
       OR wm.strongs_id IS NOT wms.strongs_id
       OR wm.orig_morphology IS NOT wms.orig_morphology
       OR wm.morph_source IS NOT wms.morph_source
    LIMIT 50;
  `).split('\n').filter(Boolean)
};
console.log(`  Found: ${syncDiscrepancyCount}`);

// Write anomaly report to JSON
const outJson = path.resolve(__dirname, 'database_anomaly_scan_report.json');
fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8');
console.log(`\nSuccessfully wrote scan results to: ${outJson}`);
