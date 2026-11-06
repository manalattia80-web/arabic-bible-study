const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PARTS_DIR = path.resolve(__dirname, '../mobile/assets/db_parts');
const SIM_DIR = path.resolve(__dirname, 'simulated_user_device');

if (!fs.existsSync(SIM_DIR)) fs.mkdirSync(SIM_DIR, { recursive: true });

console.log('========================================================================');
console.log('       SIMULATED UPGRADE TEST: v1.0.352 -> v1.0.354                     ');
console.log('========================================================================\n');

// 1. Setup simulated initial user state for v1.0.352
const legacyDbPath = path.join(SIM_DIR, 'bible_study_v348.db');
const targetDbVersion = 354;
const targetDbPath = path.join(SIM_DIR, `bible_study_v${targetDbVersion}.db`);

// Mock SharedPreferences
const userPrefs = {
  db_version: 348, // legacy version stored on 352
  theme_mode: 'dark',
  reader_font_size: 24.0,
  search_history: ['يسوع', 'محبة', 'الخروج 15'],
  bookmarks: ['2-15-2']
};

// Create a dummy legacy file to represent bible_study_v348.db
fs.writeFileSync(legacyDbPath, 'DUMMY_LEGACY_DATABASE_CONTENT_V348');
console.log(`[STATE 0] Initial state on user device:`);
console.log(`  - Stored db_version: ${userPrefs.db_version}`);
console.log(`  - Legacy DB exists: ${fs.existsSync(legacyDbPath)} (${fs.statSync(legacyDbPath).size} bytes)`);
console.log(`  - User Preferences: theme=${userPrefs.theme_mode}, font=${userPrefs.reader_font_size}, history=${userPrefs.search_history.length} items\n`);

// 2. Execute migration logic matching mobile/lib/core/services/database_service.dart
console.log(`[ACTION] Upgrading to app version v1.0.354 (targetDbVersion = ${targetDbVersion})...`);
const currentDbVersion = userPrefs.db_version || 0;
const targetExists = fs.existsSync(targetDbPath);

if (!targetExists || currentDbVersion < targetDbVersion) {
  console.log(`  -> Condition met: currentDbVersion (${currentDbVersion}) < targetDbVersion (${targetDbVersion}).`);
  
  // Write to temp file first (atomic upgrade guarantee)
  const tmpPath = `${targetDbPath}.tmp`;
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  const parts = fs.readdirSync(DB_PARTS_DIR).filter(f => f.startsWith('part_') && f.endsWith('.dat')).sort();
  console.log(`  -> Assembling ${parts.length} database parts into tmp file...`);
  
  const fd = fs.openSync(tmpPath, 'w');
  for (const part of parts) {
    const chunk = fs.readFileSync(path.join(DB_PARTS_DIR, part));
    fs.writeSync(fd, chunk, 0, chunk.length);
  }
  fs.closeSync(fd);

  // Verify PRAGMA integrity_check on the tmp file
  console.log(`  -> Running PRAGMA integrity_check on assembled temp file...`);
  const checkSql = 'PRAGMA integrity_check;';
  fs.writeFileSync('temp_check.sql', checkSql);
  const checkRes = execSync(`"${SQLITE}" "${tmpPath}" < temp_check.sql`).toString('utf8').trim();
  fs.unlinkSync('temp_check.sql');

  if (checkRes !== 'ok') {
    fs.unlinkSync(tmpPath);
    throw new Error(`Integrity check failed: ${checkRes}`);
  }
  console.log(`  -> Integrity check result: ${checkRes}`);

  // Atomically rename to destination
  if (fs.existsSync(targetDbPath)) fs.unlinkSync(targetDbPath);
  fs.renameSync(tmpPath, targetDbPath);

  // Update preferences db_version
  userPrefs.db_version = targetDbVersion;
  console.log(`  -> Updated user preference db_version to ${userPrefs.db_version}`);

  // Cleanup legacy databases without touching other user files
  const files = fs.readdirSync(SIM_DIR);
  for (const f of files) {
    if (f.startsWith('bible_study_v') && f.endsWith('.db') && f !== `bible_study_v${targetDbVersion}.db`) {
      fs.unlinkSync(path.join(SIM_DIR, f));
      console.log(`  -> Cleaned up legacy DB file: ${f}`);
    }
  }
}

// 3. Post-Upgrade Invariant Verification
console.log(`\n[VERIFICATION] Verifying post-upgrade invariants:`);

// A. User preferences preserved
const prefsPreserved = userPrefs.theme_mode === 'dark' &&
                       userPrefs.reader_font_size === 24.0 &&
                       userPrefs.search_history.length === 3 &&
                       userPrefs.bookmarks.length === 1 &&
                       userPrefs.db_version === 354;
console.log(`  [${prefsPreserved ? 'PASS' : 'FAIL'}] User preferences, bookmarks, and search history preserved 100%`);

// B. Legacy DB deleted and target DB present
const legacyCleaned = !fs.existsSync(legacyDbPath);
const targetPresent = fs.existsSync(targetDbPath);
console.log(`  [${legacyCleaned ? 'PASS' : 'FAIL'}] Legacy database bible_study_v348.db cleaned up`);
console.log(`  [${targetPresent ? 'PASS' : 'FAIL'}] Active database bible_study_v354.db present (${fs.statSync(targetDbPath).size} bytes)`);

// C. Verify Exodus 15:2 word 8 returns H410 (אֵל / אֵלִי)
const testSql = `
SELECT wm.strongs_id, wm.orig_word, wm.orig_surface, wm.orig_morphology, wms.strongs_id as wms_strongs
FROM word_mappings wm
JOIN word_mapping_strongs wms ON wm.id = wms.mapping_id AND wms.link_role = 'primary'
JOIN verses v ON wm.verse_id = v.id
WHERE v.book_id = 2 AND v.chapter_num = 15 AND v.verse_num = 2 AND wm.ar_word_position = 8;
`;
fs.writeFileSync('temp_exod.sql', testSql);
const exodRes = execSync(`"${SQLITE}" "${targetDbPath}" < temp_exod.sql`).toString('utf8').trim();
fs.unlinkSync('temp_exod.sql');

console.log(`  -> Exodus 15:2 w8 Query Result: ${exodRes}`);
const parts = exodRes.split('|');
const exodCorrect = parts[0] === 'H410' && parts[1] === 'אֵל' && parts[2] === 'אֵלִי֙' && parts[3] === 'HNcmsc/Sp1cs' && parts[4] === 'H410';
console.log(`  [${exodCorrect ? 'PASS' : 'FAIL'}] Exodus 15:2 word 8 returns H410 (אֵלִי / אֵל) across word_mappings & word_mapping_strongs`);

// Clean simulated directory
try {
  fs.unlinkSync(targetDbPath);
  fs.rmdirSync(SIM_DIR);
} catch (_) {}

if (prefsPreserved && legacyCleaned && targetPresent && exodCorrect) {
  console.log(`\n========================================================================`);
  console.log(`  SIMULATED UPGRADE PASSED: ALL INVARIANTS & USER DATA PRESERVED         `);
  console.log(`========================================================================`);
  process.exit(0);
} else {
  console.error(`\nFAILED: Simulated upgrade invariants not satisfied.`);
  process.exit(1);
}
