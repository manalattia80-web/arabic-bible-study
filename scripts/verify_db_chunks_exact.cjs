const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('========================================================================');
console.log('    MANDATORY DATABASE ASSET CHUNKS & CODE ALIGNMENT AUDIT              ');
console.log('========================================================================\n');

const rootDir = path.resolve(__dirname, '..');
const dbServicePath = path.resolve(rootDir, 'mobile/lib/core/services/database_service.dart');
const partsDir = path.resolve(rootDir, 'mobile/assets/db_parts');
const dbPath = path.resolve(rootDir, 'mobile/assets/bible_study.db');

// 1. Extract totalParts and targetDbVersion from Dart code
const dartCode = fs.readFileSync(dbServicePath, 'utf8');
const totalPartsMatch = dartCode.match(/const\s+totalParts\s*=\s*(\d+);/);
if (!totalPartsMatch) {
  console.error('✗ [FAIL] Could not find "const totalParts = N;" in database_service.dart!');
  process.exit(1);
}
const codeTotalParts = parseInt(totalPartsMatch[1], 10);

const targetVerMatch = dartCode.match(/const\s+targetDbVersion\s*=\s*(\d+);/);
const targetDbVersion = targetVerMatch ? parseInt(targetVerMatch[1], 10) : 'unknown';
console.log(`[CODE] database_service.dart expects:`);
console.log(`  - targetDbVersion: ${targetDbVersion}`);
console.log(`  - totalParts:      ${codeTotalParts}`);

// 2. Generate expected full list of chunk filenames
const expectedParts = [];
for (let i = 0; i < codeTotalParts; i++) {
  expectedParts.push(`part_${String(i).padStart(2, '0')}.dat`);
}
console.log(`\n[EXPECTATION] Expected exact range: ${expectedParts[0]} .. ${expectedParts[expectedParts.length - 1]} (${expectedParts.length} parts)`);

// 3. Inspect actual disk directory
const actualFiles = fs.readdirSync(partsDir);
const actualDatFiles = actualFiles.filter(f => f.endsWith('.dat')).sort();
console.log(`[ACTUAL] Found ${actualDatFiles.length} .dat files in ${partsDir}`);

// 4. Match filenames one by one
const missingParts = [];
for (const exp of expectedParts) {
  if (!actualDatFiles.includes(exp)) {
    missingParts.push(exp);
  }
}

const unexpectedParts = [];
for (const act of actualDatFiles) {
  if (!expectedParts.includes(act)) {
    unexpectedParts.push(act);
  }
}

if (missingParts.length > 0) {
  console.error(`\n✗ [CRITICAL FAIL] Missing expected part files required by Dart app:`);
  missingParts.forEach(p => console.error(`    - MISSING: ${p}`));
}

if (unexpectedParts.length > 0) {
  console.error(`\n✗ [CRITICAL FAIL] Unexpected part files found in assets that Dart app will NOT read:`);
  unexpectedParts.forEach(p => console.error(`    - EXTRA: ${p}`));
}

if (missingParts.length > 0 || unexpectedParts.length > 0) {
  console.error('\n✗ Full asset name matching FAILED!');
  process.exit(1);
}

console.log(`✓ [PASS] All ${expectedParts.length} parts (from ${expectedParts[0]} to ${expectedParts[expectedParts.length - 1]}) match 1:1 with Dart code.`);

// 5. Verify byte non-emptiness and reassembled SHA-256
let totalBytes = 0;
const hash = crypto.createHash('sha256');
for (const file of expectedParts) {
  const filePath = path.join(partsDir, file);
  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    console.error(`✗ [FAIL] Part file ${file} is empty (0 bytes)!`);
    process.exit(1);
  }
  totalBytes += stat.size;
  hash.update(fs.readFileSync(filePath));
}
const reassembledDigest = hash.digest('hex');
console.log(`✓ [PASS] Reassembled ${codeTotalParts} chunks totaling ${totalBytes} bytes.`);
console.log(`  - Reassembled SHA-256: ${reassembledDigest}`);

if (fs.existsSync(dbPath)) {
  const originalDigest = crypto.createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex');
  if (reassembledDigest !== originalDigest) {
    console.error(`✗ [FAIL] Reassembled digest does not match original bible_study.db!`);
    console.error(`    Reassembled: ${reassembledDigest}`);
    console.error(`    Original:    ${originalDigest}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] Reassembled hash bitwise matches original mobile/assets/bible_study.db (${originalDigest}).`);
}

console.log('\n========================================================================');
console.log('  ALL DATABASE CHUNK VERIFICATION CHECKS PASSED (100% CANONICAL MATCH)  ');
console.log('========================================================================');
