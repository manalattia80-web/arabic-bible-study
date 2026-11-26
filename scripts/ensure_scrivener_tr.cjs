/**
 * scripts/ensure_scrivener_tr.cjs
 *
 * Ensures the full Scrivener TR reference (scripts/data/gnt_scrivener.json) is
 * present and cryptographically verified from the tracked compressed archive
 * scripts/data/gnt_scrivener.json.gz before running tests or engine audits.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const EXPECTED_GZ_SHA256 = 'b83db3d0e2cee61b2129cb786fc04b5678606b99afb5929a867bfd4afc17912e';
const EXPECTED_RAW_SHA256 = 'e61655e16e3c2d4078d4d0ae2fe063c3b9f90b109ede894a08d5f825b67f0b0b';

const dataDir = path.join(__dirname, 'data');
const gzPath = path.join(dataDir, 'gnt_scrivener.json.gz');
const rawPath = path.join(dataDir, 'gnt_scrivener.json');

const sha256Buf = buf => crypto.createHash('sha256').update(buf).digest('hex');

if (!fs.existsSync(gzPath)) {
  console.error(`FATAL: Missing tracked Scrivener TR archive: ${gzPath}`);
  process.exit(1);
}

const gzBuf = fs.readFileSync(gzPath);
const gzSha = sha256Buf(gzBuf);
if (gzSha !== EXPECTED_GZ_SHA256) {
  console.error(`FATAL: gnt_scrivener.json.gz SHA-256 mismatch!\n  Expected: ${EXPECTED_GZ_SHA256}\n  Actual  : ${gzSha}`);
  process.exit(1);
}

let needExtract = !fs.existsSync(rawPath);
if (!needExtract) {
  const curSha = sha256Buf(fs.readFileSync(rawPath));
  if (curSha !== EXPECTED_RAW_SHA256) needExtract = true;
}

if (needExtract) {
  const rawBuf = zlib.gunzipSync(gzBuf);
  const rawSha = sha256Buf(rawBuf);
  if (rawSha !== EXPECTED_RAW_SHA256) {
    console.error(`FATAL: Decompressed gnt_scrivener.json SHA-256 mismatch!\n  Expected: ${EXPECTED_RAW_SHA256}\n  Actual  : ${rawSha}`);
    process.exit(1);
  }
  fs.writeFileSync(rawPath, rawBuf);
  console.log(`Extracted & verified scripts/data/gnt_scrivener.json (${rawBuf.length} bytes, SHA-256=${rawSha})`);
} else {
  console.log(`Verified existing scripts/data/gnt_scrivener.json (SHA-256=${EXPECTED_RAW_SHA256})`);
}
