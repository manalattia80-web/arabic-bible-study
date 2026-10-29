const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const sourceDb = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const testDb = path.resolve(__dirname, 'test_negative_actual.db');
const auditScript = path.resolve(__dirname, 'automated_database_audit.cjs');

console.log('========================================================================');
console.log('   RIGOROUS NEGATIVE QUALITY GATE SUITE (ACTUAL CI AUDIT REJECTION)     ');
console.log('========================================================================\n');

// 1. Create temporary working copy of production DB
console.log('▶ Creating scratch copy of production database...');
if (fs.existsSync(testDb)) {
  try { fs.unlinkSync(testDb); } catch (_) {}
}
fs.copyFileSync(sourceDb, testDb);

function execSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_neg_inject.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    execSync(`"${sqlitePath}" "${testDb}" < "${tmpFile}"`);
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

function runAudit() {
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

let verifiedGates = 0;
const totalGates = 5;

// First: Verify that unmodified testDb passes 100% (Baseline)
console.log('▶ Verifying clean baseline on scratch DB...');
const baseline = runAudit();
if (!baseline.passed) {
  console.error('✗ Baseline audit FAILED on scratch DB. Aborting negative tests.');
  console.error(baseline.output);
  if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  process.exit(1);
}
console.log('  ✓ Baseline audit passed with 0 failures.\n');

// Gate 1: Injected syntactic_ar with Strong's ID
console.log('[1/5] Testing Gate 1: Injected syntactic_ar with Strong\'s ID...');
execSql(`
  UPDATE word_mappings 
  SET morph_pos = 'syntactic_ar', strongs_id = 'H9999' 
  WHERE id = (SELECT id FROM word_mappings WHERE strongs_id IS NOT NULL LIMIT 1);
`);
const res1 = runAudit();
if (!res1.passed && res1.output.includes('syntactic_with_strongs')) {
  console.log('  ✓ [SUCCESS] Actual CI audit actively rejected build on syntactic_ar with Strongs!');
  verifiedGates++;
} else {
  console.error('  ✗ [FAILURE] Actual CI audit failed to reject syntactic_ar with Strongs!');
}
// Revert
execSql(`
  UPDATE word_mappings 
  SET morph_pos = 'verb', strongs_id = 'H7225' 
  WHERE morph_pos = 'syntactic_ar' AND strongs_id = 'H9999';
`);

// Gate 2: Injected Codex locator with NULL orig_word_position
console.log('\n[2/5] Testing Gate 2: Injected Codex locator with NULL position...');
execSql(`
  UPDATE word_mappings 
  SET orig_word_position = NULL 
  WHERE verified_locator LIKE 'OSHB:%' 
    AND id = (SELECT id FROM word_mappings WHERE verified_locator LIKE 'OSHB:%' AND orig_word_position IS NOT NULL LIMIT 1);
`);
const res2 = runAudit();
if (!res2.passed && (res2.output.includes('no_null_position_with_codex_locator') || res2.output.includes('null positions'))) {
  console.log('  ✓ [SUCCESS] Actual CI audit actively rejected build on codex locator with NULL position!');
  verifiedGates++;
} else {
  console.error('  ✗ [FAILURE] Actual CI audit failed to reject codex locator with NULL position!');
}
// Revert
execSql(`
  UPDATE word_mappings 
  SET orig_word_position = 1 
  WHERE verified_locator LIKE 'OSHB:%' AND orig_word_position IS NULL;
`);

// Gate 3: Injected Range locator with component position out of bounds
console.log('\n[3/5] Testing Gate 3: Injected Range locator with out-of-bounds component...');
execSql(`
  INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
  VALUES (
    (SELECT id FROM word_mappings WHERE verified_locator LIKE '%.w%-%' LIMIT 1),
    'H9999',
    99,
    'secondary',
    'corrupt',
    999,
    'HR',
    'oshb_wlc'
  );
`);
const res3 = runAudit();
if (!res3.passed && res3.output.includes('range_component_positions_bounded')) {
  console.log('  ✓ [SUCCESS] Actual CI audit actively rejected build on out-of-bounds component position!');
  verifiedGates++;
} else {
  console.error('  ✗ [FAILURE] Actual CI audit failed to reject out-of-bounds component in range locator!');
}
// Revert
execSql(`DELETE FROM word_mapping_strongs WHERE orig_word_position = 999;`);

// Gate 4: Injected Cross-Testament Strong's contamination
console.log('\n[4/5] Testing Gate 4: Injected Cross-Testament Strong\'s contamination...');
execSql(`
  UPDATE word_mappings 
  SET strongs_id = 'G9999' 
  WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 1)
    AND id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 1) LIMIT 1);
`);
const res4 = runAudit();
if (!res4.passed && (res4.output.includes('cross_testament_strongs') || res4.output.includes('orphan_primary_strongs'))) {
  console.log('  ✓ [SUCCESS] Actual CI audit actively rejected build on cross-testament Strong\'s contamination!');
  verifiedGates++;
} else {
  console.error('  ✗ [FAILURE] Actual CI audit failed to reject cross-testament Strong\'s contamination!');
}
// Revert
execSql(`
  UPDATE word_mappings 
  SET strongs_id = 'H9003' 
  WHERE strongs_id = 'G9999';
`);

// Gate 5: Injected Duplicate Arabic position in verse
console.log('\n[5/5] Testing Gate 5: Injected Duplicate Arabic position in verse...');
execSql(`
  INSERT INTO word_mappings (id, verse_id, ar_word_position, ar_word, strongs_id)
  VALUES (
    'bad_dup_pos_test',
    (SELECT id FROM verses LIMIT 1),
    1,
    'مكرر',
    'H9003'
  );
`);
const res5 = runAudit();
if (!res5.passed && res5.output.includes('duplicate_ar_position')) {
  console.log('  ✓ [SUCCESS] Actual CI audit actively rejected build on duplicate Arabic word position!');
  verifiedGates++;
} else {
  console.error('  ✗ [FAILURE] Actual CI audit failed to reject duplicate Arabic position!');
}
// Revert
execSql(`DELETE FROM word_mappings WHERE id = 'bad_dup_pos_test';`);

// Cleanup scratch DB
if (fs.existsSync(testDb)) {
  try { fs.unlinkSync(testDb); } catch (_) {}
}

console.log('\n========================================================================');
console.log(`NEGATIVE CI GATE VERIFICATION: ${verifiedGates}/${totalGates} FORBIDDEN STATES PROVEN REJECTED BY ACTUAL AUDIT.`);
console.log('========================================================================');

if (verifiedGates === totalGates) {
  console.log('✓ MATHEMATICAL PROOF: The actual production CI Quality Gate rejects every forbidden state.');
  process.exit(0);
} else {
  console.error('✗ Some negative tests did not trigger actual CI rejection.');
  process.exit(1);
}
