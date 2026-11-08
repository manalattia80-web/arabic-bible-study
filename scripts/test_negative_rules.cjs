const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const sourceDb = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const testDb = path.resolve(__dirname, 'test_negative_scratch.db');
const auditScript = path.resolve(__dirname, 'automated_database_audit.cjs');

console.log('========================================================================');
console.log('   RIGOROUS NEGATIVE QUALITY GATE SUITE (FRESH-COPY PER TEST)           ');
console.log('========================================================================\n');

function cleanScratchDb() {
  if (fs.existsSync(testDb)) {
    try { fs.unlinkSync(testDb); } catch (_) {}
  }
}

function createFreshScratchDb() {
  cleanScratchDb();
  fs.copyFileSync(sourceDb, testDb);
}

function execSqlOnScratch(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_neg_inject.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    execSync(`"${sqlitePath}" "${testDb}" < "${tmpFile}"`);
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

function runAuditOnScratch() {
  const nodeBin = process.execPath;
  try {
    const output = execSync(`"${nodeBin}" "${auditScript}"`, {
      env: { ...process.env, AUDIT_DB_PATH: testDb },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { passed: true, output };
  } catch (err) {
    return { passed: false, output: (err.stdout || '') + '\n' + (err.stderr || '') };
  }
}

// Baseline check: Production DB must pass 100%
console.log('▶ Verifying clean baseline on production DB copy...');
createFreshScratchDb();
const baseline = runAuditOnScratch();
cleanScratchDb();
if (!baseline.passed) {
  console.error('✗ Baseline audit FAILED. Production DB must pass before running negative tests.');
  console.error(baseline.output);
  process.exit(1);
}
console.log('  ✓ Baseline audit passed with 0 failures.\n');

const testCases = [
  {
    gateNum: 1,
    name: 'syntactic_with_strongs',
    expectedFailTag: '[FAIL] syntactic_with_strongs:',
    description: 'Injected syntactic_ar with Strong\'s ID',
    mutationSql: `
      UPDATE word_mappings 
      SET morph_pos = 'syntactic_ar', strongs_id = 'H9999' 
      WHERE id = (SELECT id FROM word_mappings WHERE strongs_id IS NOT NULL LIMIT 1);
    `
  },
  {
    gateNum: 2,
    name: 'no_null_position_with_codex_locator',
    expectedFailTag: '[FAIL] no_null_position_with_codex_locator:',
    description: 'Injected Codex locator with NULL orig_word_position',
    mutationSql: `
      UPDATE word_mappings 
      SET orig_word_position = NULL 
      WHERE verified_locator LIKE 'OSHB:%' 
        AND id = (SELECT id FROM word_mappings WHERE verified_locator LIKE 'OSHB:%' AND orig_word_position IS NOT NULL LIMIT 1);
    `
  },
  {
    gateNum: 3,
    name: 'range_component_positions_bounded',
    expectedFailTag: '[FAIL] range_component_positions_bounded:',
    description: 'Injected Range locator with out-of-bounds component position',
    mutationSql: `
      INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
      VALUES (
        (SELECT id FROM word_mappings WHERE verified_locator LIKE '%.w%-%' LIMIT 1),
        'H9999',
        99,
        'secondary',
        'out_of_bounds',
        999,
        'HR',
        'oshb_wlc'
      );
    `
  },
  {
    gateNum: 4,
    name: 'cross_testament_strongs',
    expectedFailTag: '[FAIL] cross_testament_strongs:',
    description: 'Injected Cross-Testament Strong\'s contamination (Greek Strong\'s in OT)',
    mutationSql: `
      UPDATE word_mappings 
      SET strongs_id = 'G9999' 
      WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 1)
        AND id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 1) LIMIT 1);
    `
  },
  {
    gateNum: 5,
    name: 'duplicate_ar_position',
    expectedFailTag: '[FAIL] duplicate_ar_position:',
    description: 'Injected Duplicate Arabic position in verse',
    mutationSql: `
      INSERT INTO word_mappings (id, verse_id, ar_word_position, ar_word, strongs_id)
      VALUES (
        'bad_dup_pos_test',
        (SELECT id FROM verses LIMIT 1),
        1,
        'مكرر',
        'H9003'
      );
    `
  },
  {
    gateNum: 6,
    name: 'source_locator_index_mismatch',
    expectedFailTag: '[FAIL] 1 Kings 18:21 w9 (تعرجون)',
    description: 'Injected incorrect source locator index (OSHB:B11.C18.V21.w9 instead of w10)',
    mutationSql: `
      UPDATE word_mappings 
      SET verified_locator = 'OSHB:B11.C18.V21.w9' 
      WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 11 AND chapter_num = 18 AND verse_num = 21) 
        AND ar_word_position = 9;
    `
  },
  {
    gateNum: 7,
    name: 'incorrect_lexical_strongs_with_correct_loc_and_morph',
    expectedFailTag: '[FAIL] 1 Kings 18:21 w7 (حتى)',
    description: 'Injected incorrect Strong\'s ID (H9999 instead of H5704) with authentic locator and morphology',
    mutationSql: `
      UPDATE word_mappings 
      SET strongs_id = 'H9999' 
      WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 11 AND chapter_num = 18 AND verse_num = 21) 
        AND ar_word_position = 7;

      UPDATE word_mapping_strongs
      SET strongs_id = 'H9999'
      WHERE mapping_id = (
        SELECT id FROM word_mappings 
        WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 11 AND chapter_num = 18 AND verse_num = 21) 
          AND ar_word_position = 7
      );
    `
  },
  {
    gateNum: 8,
    name: 'isa_40_8_noun_with_preposition_strongs',
    expectedFailTag: '[FAIL] Isaiah 40:8 w10 (الأَبَدِ) Lexical Isolation',
    description: 'Injected preposition Strong ID H9005 into noun الأَبَدِ in Isaiah 40:8',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H9005'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 40 AND verse_num = 8 AND book_id = 23)
        AND ar_word_position = 10;
    `
  },
  {
    gateNum: 9,
    name: 'gal_5_22_joy_with_love_strongs',
    expectedFailTag: '[FAIL] Galatians 5:22 w6 (فَرَحٌ) Greek Lexical Joy Isolation',
    description: 'Injected love Strong ID G26 into joy فَرَحٌ in Galatians 5:22',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'G26'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 22 AND book_id = 48)
        AND ar_word_position = 6;
    `
  },
  {
    gateNum: 10,
    name: 'mic_6_8_missing_pronominal_dative_component',
    expectedFailTag: '[FAIL] Micah 6:8 w2 (أَخْبَرَكَ) Multi-Component Completeness',
    description: 'Deleted kaf al-mukhatab pronominal dative component (H9005) from أَخْبَرَكَ in Micah 6:8',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (
        SELECT id FROM word_mappings
        WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 6 AND verse_num = 8 AND book_id = 33)
          AND ar_word_position = 2
      ) AND link_role = 'pronominal_dative';
    `
  }
];

let verifiedGates = 0;

for (const tc of testCases) {
  console.log(`[${tc.gateNum}/${testCases.length}] Testing Gate ${tc.gateNum}: ${tc.description}...`);
  createFreshScratchDb();
  execSqlOnScratch(tc.mutationSql);
  const res = runAuditOnScratch();
  cleanScratchDb();

  const failedSpecifically = !res.passed && res.output.includes(tc.expectedFailTag);
  if (failedSpecifically) {
    console.log(`  ✓ [SUCCESS] Actual CI audit specifically triggered ${tc.expectedFailTag}`);
    verifiedGates++;
  } else {
    console.error(`  ✗ [FAILURE] Actual CI audit did NOT specifically trigger ${tc.expectedFailTag}`);
    console.error(`  Output snippet:\n${res.output.split('\n').filter(l => l.includes('[FAIL]') || l.includes('FAILURES')).join('\n')}`);
  }
}

cleanScratchDb();

console.log('\n========================================================================');
console.log(`NEGATIVE CI GATE VERIFICATION: ${verifiedGates}/${testCases.length} FORBIDDEN STATES SPECIFICALLY REJECTED.`);
console.log('========================================================================');

if (verifiedGates === testCases.length) {
  console.log('✓ MATHEMATICAL PROOF: Each forbidden state specifically triggers its dedicated [FAIL] gate in production audit.');
  process.exit(0);
} else {
  console.error('✗ Some negative tests failed to trigger their specific failure tag.');
  process.exit(1);
}
