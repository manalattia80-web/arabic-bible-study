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
  }
];

let verifiedGates = 0;

for (const tc of testCases) {
  console.log(`[${tc.gateNum}/5] Testing Gate ${tc.gateNum}: ${tc.description}...`);
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
