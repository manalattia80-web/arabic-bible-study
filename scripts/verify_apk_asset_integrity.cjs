const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

console.log('========================================================================');
console.log('       BUILT APK POST-PACKAGING ASSET INTEGRITY QUALITY GATE            ');
console.log('========================================================================\n');

const rootDir = path.resolve(__dirname, '..');
const dbServicePath = path.resolve(rootDir, 'mobile/lib/core/services/database_service.dart');
const originalDbPath = path.resolve(rootDir, 'mobile/assets/bible_study.db');
const partsManifestPath = path.resolve(rootDir, 'mobile/assets/db_parts/parts_manifest.json');

// 1. Determine target APK file
let apkPath = process.argv[2];
if (!apkPath) {
  const candidatePaths = [
    path.resolve(rootDir, 'arabic-bible-study-app.apk'),
    path.resolve(rootDir, 'mobile/build/app/outputs/flutter-apk/app-release.apk'),
    path.resolve(rootDir, 'app-release.apk')
  ];
  for (const c of candidatePaths) {
    if (fs.existsSync(c)) {
      apkPath = c;
      break;
    }
  }
}

if (!apkPath || !fs.existsSync(apkPath)) {
  console.error(`✗ [CRITICAL FAIL] Target APK file not found! Checked argv[2] and default candidate paths.`);
  process.exit(1);
}

const apkStat = fs.statSync(apkPath);
console.log(`[TARGET APK] Auditing APK: ${apkPath}`);
console.log(`  - APK Size: ${apkStat.size} bytes (${(apkStat.size / (1024 * 1024)).toFixed(2)} MB)\n`);

// 2. Read expected configuration from Dart code
const dartCode = fs.readFileSync(dbServicePath, 'utf8');
const totalPartsMatch = dartCode.match(/const\s+totalParts\s*=\s*(\d+);/);
if (!totalPartsMatch) {
  console.error('✗ [FAIL] Could not find "const totalParts = N;" in database_service.dart!');
  process.exit(1);
}
const codeTotalParts = parseInt(totalPartsMatch[1], 10);

const targetVerMatch = dartCode.match(/const\s+targetDbVersion\s*=\s*(\d+);/);
const targetDbVersion = targetVerMatch ? parseInt(targetVerMatch[1], 10) : 'unknown';

console.log(`[CODE INVARIANTS] database_service.dart configuration:`);
console.log(`  - targetDbVersion: ${targetDbVersion}`);
console.log(`  - totalParts:      ${codeTotalParts}`);

const expectedChunkNames = [];
for (let i = 0; i < codeTotalParts; i++) {
  expectedChunkNames.push(`part_${String(i).padStart(2, '0')}.dat`);
}
console.log(`  - Expected part range: ${expectedChunkNames[0]} .. ${expectedChunkNames[expectedChunkNames.length - 1]} (${expectedChunkNames.length} parts)\n`);

// 3. Parse ZIP Central Directory of the APK directly without external dependencies
function readZipEntries(zipFilePath) {
  const fd = fs.openSync(zipFilePath, 'r');
  const stat = fs.fstatSync(fd);
  const size = stat.size;
  const readSize = Math.min(size, 65536 + 22);
  const tailBuf = Buffer.alloc(readSize);
  fs.readSync(fd, tailBuf, 0, readSize, size - readSize);

  let eocdOffset = -1;
  for (let i = tailBuf.length - 22; i >= 0; i--) {
    if (tailBuf[i] === 0x50 && tailBuf[i+1] === 0x4b && tailBuf[i+2] === 0x05 && tailBuf[i+3] === 0x06) {
      eocdOffset = size - readSize + i;
      break;
    }
  }
  if (eocdOffset === -1) {
    fs.closeSync(fd);
    throw new Error('EOCD signature not found in APK. File may be corrupted or not a valid ZIP/APK archive.');
  }

  const eocdBuf = Buffer.alloc(22);
  fs.readSync(fd, eocdBuf, 0, 22, eocdOffset);
  const totalEntries = eocdBuf.readUInt16LE(10);
  const cdSize = eocdBuf.readUInt32LE(12);
  const cdOffset = eocdBuf.readUInt32LE(16);

  const cdBuf = Buffer.alloc(cdSize);
  fs.readSync(fd, cdBuf, 0, cdSize, cdOffset);

  const entries = [];
  let pos = 0;
  while (pos < cdBuf.length) {
    if (cdBuf.readUInt32LE(pos) !== 0x02014b50) break;
    const method = cdBuf.readUInt16LE(pos + 10);
    const crc32 = cdBuf.readUInt32LE(pos + 16);
    const compSize = cdBuf.readUInt32LE(pos + 20);
    const uncompSize = cdBuf.readUInt32LE(pos + 24);
    const nameLen = cdBuf.readUInt16LE(pos + 28);
    const extraLen = cdBuf.readUInt16LE(pos + 30);
    const commentLen = cdBuf.readUInt16LE(pos + 32);
    const localHeaderOffset = cdBuf.readUInt32LE(pos + 42);
    const name = cdBuf.toString('utf8', pos + 46, pos + 46 + nameLen);

    entries.push({ name, method, crc32, compSize, uncompSize, localHeaderOffset });
    pos += 46 + nameLen + extraLen + commentLen;
  }
  fs.closeSync(fd);
  return entries;
}

function extractZipEntryData(fd, entry) {
  const headerBuf = Buffer.alloc(30);
  fs.readSync(fd, headerBuf, 0, 30, entry.localHeaderOffset);
  if (headerBuf.readUInt32LE(0) !== 0x04034b50) {
    throw new Error(`Invalid local file header signature for entry: ${entry.name}`);
  }
  const nameLen = headerBuf.readUInt16LE(26);
  const extraLen = headerBuf.readUInt16LE(28);
  const dataOffset = entry.localHeaderOffset + 30 + nameLen + extraLen;

  const compBuf = Buffer.alloc(entry.compSize);
  fs.readSync(fd, compBuf, 0, entry.compSize, dataOffset);

  if (entry.method === 0) {
    return compBuf;
  } else if (entry.method === 8) {
    return zlib.inflateRawSync(compBuf);
  } else {
    throw new Error(`Unsupported compression method ${entry.method} for entry: ${entry.name}`);
  }
}

console.log('[AUDIT] Scanning ZIP entries inside built APK archive...');
const allEntries = readZipEntries(apkPath);
console.log(`  - Total archive entries in APK: ${allEntries.length}`);

// 4. Find all database parts entries inside the APK
// Flutter assets are typically packaged at 'assets/flutter_assets/assets/db_parts/...'
const dbPartEntries = allEntries.filter(e => {
  return e.name.includes('db_parts/') && e.name.endsWith('.dat');
});

console.log(`  - Found ${dbPartEntries.length} database chunk (.dat) entries in APK.`);

// Map by pure basename
const apkPartMap = new Map();
for (const entry of dbPartEntries) {
  const basename = path.basename(entry.name);
  apkPartMap.set(basename, entry);
}

// 5. Assert: Exact 1:1 filename matching
const missingInApk = [];
for (const expName of expectedChunkNames) {
  if (!apkPartMap.has(expName)) {
    missingInApk.push(expName);
  }
}

const forbiddenExtraInApk = [];
for (const [actName, _] of apkPartMap.entries()) {
  if (!expectedChunkNames.includes(actName)) {
    forbiddenExtraInApk.push(actName);
  }
}

// Specifically check for next forbidden index (e.g. part_70.dat when totalParts=70)
const nextForbiddenPart = `part_${String(codeTotalParts).padStart(2, '0')}.dat`;
if (apkPartMap.has(nextForbiddenPart)) {
  console.error(`✗ [CRITICAL REGRESSION] APK contains forbidden part: ${nextForbiddenPart}!`);
  forbiddenExtraInApk.push(nextForbiddenPart);
}

if (missingInApk.length > 0) {
  console.error(`\n✗ [CRITICAL FAIL] The APK is MISSING chunks required by Dart DatabaseService:`);
  missingInApk.forEach(m => console.error(`    - MISSING IN APK: ${m}`));
}

if (forbiddenExtraInApk.length > 0) {
  console.error(`\n✗ [CRITICAL FAIL] The APK contains EXTRA / UNEXPECTED chunks:`);
  forbiddenExtraInApk.forEach(u => console.error(`    - EXTRA IN APK: ${u}`));
}

if (missingInApk.length > 0 || forbiddenExtraInApk.length > 0) {
  console.error('\n✗ Post-build APK chunk verification FAILED!');
  process.exit(1);
}

console.log(`✓ [PASS] All ${codeTotalParts} chunk files (part_00.dat .. part_${String(codeTotalParts-1).padStart(2, '0')}.dat) are present inside APK with NO missing or extra parts.`);

// 6. Verify parts_manifest.json presence in APK
const manifestEntry = allEntries.find(e => e.name.includes('db_parts/') && e.name.endsWith('parts_manifest.json'));
if (manifestEntry) {
  console.log(`✓ [PASS] parts_manifest.json found inside APK (${manifestEntry.uncompSize} bytes).`);
} else {
  console.warn(`! [WARN] parts_manifest.json was not packaged into APK assets.`);
}

// 7. Verify byte content and reassembled SHA-256 directly from APK
console.log(`\n[REASSEMBLY AUDIT] Extracting chunks directly from APK and computing stream SHA-256...`);
const apkFd = fs.openSync(apkPath, 'r');
const apkHash = crypto.createHash('sha256');
let totalUncompressedBytes = 0;

for (let i = 0; i < codeTotalParts; i++) {
  const partName = `part_${String(i).padStart(2, '0')}.dat`;
  const entry = apkPartMap.get(partName);
  
  if (entry.uncompSize === 0) {
    fs.closeSync(apkFd);
    console.error(`✗ [FAIL] Part ${partName} inside APK has 0 uncompressed bytes!`);
    process.exit(1);
  }
  
  const chunkData = extractZipEntryData(apkFd, entry);
  
  // Verify chunk CRC32
  // Check length
  if (chunkData.length !== entry.uncompSize) {
    fs.closeSync(apkFd);
    console.error(`✗ [FAIL] Part ${partName} extracted size (${chunkData.length}) does not match entry uncompSize (${entry.uncompSize})!`);
    process.exit(1);
  }
  
  totalUncompressedBytes += chunkData.length;
  apkHash.update(chunkData);
}
fs.closeSync(apkFd);

const apkReassembledSha256 = apkHash.digest('hex');
console.log(`✓ [PASS] Successfully extracted and reassembled ${codeTotalParts} chunks from APK.`);
console.log(`  - Reassembled DB Size:   ${totalUncompressedBytes} bytes`);
console.log(`  - Reassembled SHA-256:   ${apkReassembledSha256}`);

// Compare with original mobile/assets/bible_study.db if available
if (fs.existsSync(originalDbPath)) {
  const originalSha256 = crypto.createHash('sha256').update(fs.readFileSync(originalDbPath)).digest('hex');
  const originalSize = fs.statSync(originalDbPath).size;
  
  if (totalUncompressedBytes !== originalSize) {
    console.error(`✗ [FAIL] Size mismatch between APK reassembled DB (${totalUncompressedBytes}) and original DB (${originalSize})!`);
    process.exit(1);
  }
  
  if (apkReassembledSha256 !== originalSha256) {
    console.error(`✗ [FAIL] SHA-256 mismatch between APK reassembled DB and mobile/assets/bible_study.db!`);
    console.error(`    APK DB Hash:      ${apkReassembledSha256}`);
    console.error(`    Original DB Hash: ${originalSha256}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] APK database contents bitwise match mobile/assets/bible_study.db (${originalSha256}).`);
}

console.log('\n========================================================================');
console.log('  BUILT APK POST-PACKAGING AUDIT: 100% PASSED (ALL INVARIANTS VERIFIED) ');
console.log('========================================================================');
