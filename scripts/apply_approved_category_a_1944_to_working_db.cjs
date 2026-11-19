/**
 * apply_approved_category_a_1944_to_working_db.cjs
 *
 * Applies ONLY the user-approved 1,944 strict Category A derived-morphology records
 * directly from scripts/trial_category_a_derived_only_full_diff_v379.jsonl
 * (SHA-256: f577a82944186700507ce15abc8970377917c6781b6fe02d01bd91d556e9ac40)
 * to mobile/assets/bible_study.db, after verifying:
 *   1. Exact pre-apply production DB SHA-256 (44ef2d39a84e43b8f638f76348954ca553016c7420e6d04a6cd93cd1b37dd17f).
 *   2. Exact JSONL SHA-256 and exact 1,944 unique mapping IDs.
 *   3. Exact before-value match in the database for every single one of the 1,944 records
 *      (fail-closed atomic transaction if any single record disagrees).
 *   4. Only the 9 derived morphology columns are ever touched.
 *   5. Frozen baselines (Round 1, Round 2, Round 3 raw baseline, and frozen auditor) remain untouched.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const diffJsonlPath = path.join(__dirname, 'trial_category_a_derived_only_full_diff_v379.jsonl');

const EXPECTED_PRE_DB_SHA256 = '44ef2d39a84e43b8f638f76348954ca553016c7420e6d04a6cd93cd1b37dd17f';
const EXPECTED_JSONL_SHA256 = 'f577a82944186700507ce15abc8970377917c6781b6fe02d01bd91d556e9ac40';
const ALLOWED_COLS = new Set([
  'morph_pos', 'morph_stem', 'morph_tense', 'morph_voice', 'morph_mood',
  'morph_person', 'morph_number', 'morph_gender', 'morph_case'
]);

const preDbSha = sha256File(dbPath);
if (preDbSha !== EXPECTED_PRE_DB_SHA256) {
  throw new Error(`Pre-apply DB SHA-256 mismatch: got ${preDbSha}, expected ${EXPECTED_PRE_DB_SHA256}`);
}

const rawJsonlNorm = fs.readFileSync(diffJsonlPath, 'utf8').replace(/\r\n/g, '\n');
const actualJsonlSha = crypto.createHash('sha256').update(rawJsonlNorm, 'utf8').digest('hex');
if (actualJsonlSha !== EXPECTED_JSONL_SHA256) {
  throw new Error(`JSONL SHA-256 mismatch: got ${actualJsonlSha}, expected ${EXPECTED_JSONL_SHA256}`);
}

const records = rawJsonlNorm.split('\n').filter(Boolean).map(l => JSON.parse(l));
if (records.length !== 1944) {
  throw new Error(`Expected exactly 1,944 records in approved JSONL, got ${records.length}`);
}

const seenIds = new Set();
for (const r of records) {
  if (seenIds.has(r.mappingId)) throw new Error(`Duplicate mappingId in JSONL: ${r.mappingId}`);
  seenIds.add(r.mappingId);
  for (const col of Object.keys(r.after)) {
    if (!ALLOWED_COLS.has(col)) throw new Error(`Forbidden column '${col}' in record ${r.mappingId}`);
  }
}

function sqlVal(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

// Verify every single record's current DB values match r.before before applying
const idListSql = records.map(r => sqlVal(r.mappingId)).join(',');
const tmpCheckFile = path.join(repoRoot, 'scratch/tmp_pre_apply_1944_check.txt');
fs.mkdirSync(path.dirname(tmpCheckFile), { recursive: true });
const checkQuery = `.output ${tmpCheckFile.replace(/\\/g, '/')}\nSELECT id, COALESCE(morph_pos,''), COALESCE(morph_stem,''), COALESCE(morph_tense,''), COALESCE(morph_voice,''), COALESCE(morph_mood,''), COALESCE(morph_person,''), COALESCE(morph_number,''), COALESCE(morph_gender,''), COALESCE(morph_case,'') FROM word_mappings WHERE id IN (${idListSql});\n.quit\n`;
execFileSync(sqlitePath, [dbPath], { input: checkQuery, encoding: 'utf8' });
const dbRowsRaw = fs.readFileSync(tmpCheckFile, 'utf8').replace(/\r/g, '').trim().split('\n').filter(Boolean);
try { fs.unlinkSync(tmpCheckFile); } catch (_) {}

const dbMap = new Map();
for (const line of dbRowsRaw) {
  const [id, morph_pos, morph_stem, morph_tense, morph_voice, morph_mood, morph_person, morph_number, morph_gender, morph_case] = line.split('|');
  dbMap.set(id, {
    morph_pos: morph_pos || null,
    morph_stem: morph_stem || null,
    morph_tense: morph_tense || null,
    morph_voice: morph_voice || null,
    morph_mood: morph_mood || null,
    morph_person: morph_person || null,
    morph_number: morph_number || null,
    morph_gender: morph_gender || null,
    morph_case: morph_case || null
  });
}

if (dbMap.size !== 1944) {
  throw new Error(`Expected 1,944 matching rows in DB, found ${dbMap.size}`);
}

const sqlLines = ['BEGIN TRANSACTION;'];
for (const r of records) {
  const cur = dbMap.get(r.mappingId);
  if (!cur) throw new Error(`Missing mappingId in DB: ${r.mappingId}`);
  for (const [col, expectedBefore] of Object.entries(r.before)) {
    const actualBefore = cur[col] || null;
    if (actualBefore !== (expectedBefore || null)) {
      throw new Error(`Before-value mismatch on ${r.mappingId} (${r.ref}) col=${col}: DB='${actualBefore}' != JSONL='${expectedBefore}'`);
    }
  }
  const setClause = Object.entries(r.after).map(([col, val]) => `${col} = ${sqlVal(val)}`).join(', ');
  sqlLines.push(`UPDATE word_mappings SET ${setClause} WHERE id = ${sqlVal(r.mappingId)};`);
}
sqlLines.push('COMMIT;');

const applySqlPath = path.join(repoRoot, 'scratch/apply_approved_category_a_1944.sql');
fs.writeFileSync(applySqlPath, sqlLines.join('\n') + '\n', 'utf8');

console.log(`Verified all 1,944 before-values match frozen DB (${preDbSha}). Applying atomic transaction...`);
execFileSync(sqlitePath, [dbPath], { input: `.read ${applySqlPath.replace(/\\/g, '/')}\n`, encoding: 'utf8' });

const integrity = execFileSync(sqlitePath, [dbPath, 'PRAGMA integrity_check;'], { encoding: 'utf8' }).trim();
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity_check failed after apply: ${integrity}`);
}

const postDbSha = sha256File(dbPath);
console.log(`Successfully applied 1,944 approved Category A derived-morphology updates!`);
console.log(`  Pre-Apply DB SHA-256 : ${preDbSha}`);
console.log(`  Post-Apply DB SHA-256: ${postDbSha}`);
console.log(`  PRAGMA integrity_check: ${integrity}`);
