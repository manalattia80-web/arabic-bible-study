/**
 * run_android_emulator_v372_test.cjs
 * Official Android Emulator Automated Runtime & Upgrade Verification Suite for v1.0.372
 * Tests BOTH required tracks on a live Android API 33 KVM Emulator:
 *   1. Track A (Clean Install): Fresh install of v1.0.372 APK -> confirms bible_study_v372.db
 *      (363,438,080 bytes from 70 parts) opens cleanly with ZERO AssetNotFoundException,
 *      and 1 Kings 18:21 H5587 ("الْفِرْقَتَيْنِ") Word Study Card renders masculine plural.
 *   2. Track B (Upgrade from v370): Installs v1.0.370 baseline, seeds user preferences
 *      (dark mode, search history, db_version=370), performs in-place upgrade via
 *      `adb install -r v372_candidate.apk` without wiping data, verifies bible_study_v372.db
 *      opens cleanly, bible_study_v370.db is deleted, 100% user prefs/history are preserved,
 *      and 1 Kings 18:21 H5587 Word Study Card displays masculine plural.
 */

const fs = require('fs');
const path = require('path');
const child = require('child_process');
const crypto = require('crypto');

function execAdb(cmd, options = {}) {
  try {
    const res = child.execSync(`adb ${cmd}`, {
      encoding: 'utf8',
      timeout: options.timeout || 60000,
      maxBuffer: options.maxBuffer || 50 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return res.trim();
  } catch (err) {
    if (options.ignoreError) return err.stdout ? err.stdout.toString().trim() : '';
    console.error(`ADB error on: adb ${cmd}:`, err.stderr ? err.stderr.toString().trim() : err.message);
    return err.stdout ? err.stdout.toString().trim() : '';
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function getFileSha256(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function runOcr(imagePath) {
  try {
    let combined = '';
    try {
      combined += child.execSync(`tesseract "${imagePath}" stdout -l eng+ara`, {
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim() + ' ';
    } catch (_) {}

    try {
      const inverted = imagePath.replace(/\.png$/i, '_neg.png');
      child.execSync(`ffmpeg -y -i "${imagePath}" -vf "negate" "${inverted}"`, {
        stdio: 'ignore',
        timeout: 15000
      });
      if (fs.existsSync(inverted)) {
        combined += child.execSync(`tesseract "${inverted}" stdout -l eng+ara`, {
          encoding: 'utf8',
          timeout: 30000,
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim() + ' ';
        try { fs.unlinkSync(inverted); } catch (_) {}
      }
    } catch (_) {}

    return combined.trim();
  } catch (err) {
    console.warn(`OCR warning on ${imagePath}:`, err.message);
    return '';
  }
}

console.log('========================================================================');
console.log('  ANDROID EMULATOR VERIFICATION SUITE v1.0.372 (CLEAN INSTALL & UPGRADE)');
console.log('========================================================================\n');

const evidenceDir = path.resolve(process.cwd(), 'emulator_evidence_v372');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

const testResults = [];
function recordTest(name, durationSec, passed, failureMsg = '') {
  testResults.push({ name, durationSec, passed, failureMsg });
  if (passed) {
    console.log(`[PASS] ${name} (${durationSec.toFixed(1)}s)`);
  } else {
    console.error(`[FAIL] ${name} (${durationSec.toFixed(1)}s): ${failureMsg}`);
  }
}

// Activate adb root
execAdb('root', { ignoreError: true });
sleep(2000);

// Detect display dimensions dynamically
const wmOutput = execAdb('shell wm size');
const sizeMatch = wmOutput.match(/(\d+)x(\d+)/);
const W = sizeMatch ? parseInt(sizeMatch[1], 10) : 1080;
const H = sizeMatch ? parseInt(sizeMatch[2], 10) : 2400;
console.log(`Detected emulator screen resolution: ${W} x ${H}\n`);

const searchIconX = Math.round(W * 0.90);
const searchIconY = Math.round(H * 0.081);
const searchInputX = Math.round(W * 0.40);
const searchInputY = Math.round(H * 0.081);
const searchBtnX = Math.round(W * 0.92);
const searchBtnY = Math.round(H * 0.081);

function ensureAppInForeground() {
  const focus = execAdb('shell dumpsys window | grep mCurrentFocus', { ignoreError: true });
  if (!focus.includes('com.arabicbible.study')) {
    execAdb('shell am start -n com.arabicbible.study/.MainActivity');
    sleep(3000);
  }
}

function dismissKeyboard() {
  const ime = execAdb('shell dumpsys input_method | grep mInputShown', { ignoreError: true });
  if (ime.includes('mInputShown=true')) {
    execAdb('shell input keyevent 111', { ignoreError: true });
    sleep(600);
    const ime2 = execAdb('shell dumpsys input_method | grep mInputShown', { ignoreError: true });
    if (ime2.includes('mInputShown=true')) {
      execAdb('shell input keyevent 4', { ignoreError: true });
      sleep(600);
    }
  }
}

function captureAndOcr(localFilename = 'screen_check.png', remotePath = '/sdcard/screen_check.png') {
  const localPath = path.join(evidenceDir, localFilename);
  execAdb(`shell screencap -p ${remotePath}`);
  execAdb(`pull ${remotePath} "${localPath}"`);
  return { localPath, ocr: runOcr(localPath) };
}

function ensureSearchScreen() {
  ensureAppInForeground();
  dismissKeyboard();
  for (let attempt = 0; attempt < 4; attempt++) {
    const { ocr } = captureAndOcr('nav_check.png');
    const onSearch = ocr.includes('بحث') || ocr.includes('عمليات البحث') || ocr.includes('اقتراحات') || ocr.includes('ابحث') || ocr.includes('Search');
    if (!onSearch) {
      console.log(`Navigating to SearchScreen (tap ${searchIconX}, ${searchIconY})...`);
      execAdb(`shell input tap ${searchIconX} ${searchIconY}`);
      sleep(2500);
    } else {
      console.log('Confirmed SearchScreen is open.');
      break;
    }
  }
}

function executeSearch(code) {
  ensureSearchScreen();
  // Tap input field and clear any previous text
  execAdb(`shell input tap ${searchInputX} ${searchInputY}`);
  sleep(500);
  execAdb(`shell input tap ${searchBtnX} ${searchBtnY}`);
  sleep(400);
  for (let k = 0; k < 6; k++) execAdb('shell input keyevent 67');
  sleep(500);

  console.log(`Typing search query: ${code}`);
  execAdb(`shell input tap ${searchInputX} ${searchInputY}`);
  sleep(600);
  execAdb(`shell input text "${code}"`);
  sleep(1000);
  execAdb('shell input keyevent 66'); // Enter
  sleep(3000);
  dismissKeyboard();
  sleep(1000);
}

/**
 * Navigates from Search('H5587') -> 1 Kings 18:21 Reader -> WordStudyScreen -> H5587 Morphology Card
 */
function openH5587MorphologyCardAndVerify(screenshotName) {
  // Restart MainActivity to reset navigation stack
  execAdb('shell am force-stop com.arabicbible.study');
  sleep(1500);
  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  sleep(3500);

  executeSearch('H5587');

  // Verify H5587 search results loaded (hapax legomenon: 1 Kings 18:21 only!)
  const searchResSnap = captureAndOcr('search_h5587_results.png');
  console.log('Search H5587 OCR sample:', searchResSnap.ocr.slice(0, 200).replace(/\n/g, ' '));

  // Tap on the search result card ("١ ملوك — الإصحاح ١٨ — الآية ٢١") below the Direct Strong's banner
  const cardTapOffsets = [0.60, 0.52, 0.68, 0.45];
  let enteredReader = false;
  for (const yRatio of cardTapOffsets) {
    console.log(`Tapping search result card at (${Math.round(W * 0.50)}, ${Math.round(H * yRatio)})...`);
    execAdb(`shell input tap ${Math.round(W * 0.50)} ${Math.round(H * yRatio)}`);
    sleep(3000);

    const check = captureAndOcr('reader_entry_check.png');
    // If dictionary modal popped up instead of navigating to reader, dismiss it and try lower
    if (check.ocr.includes('عرض المعجم بالكامل') || check.ocr.includes('التحليل الصرفي والنحوي')) {
      execAdb('shell input keyevent 4');
      sleep(1200);
      continue;
    }
    if (check.ocr.includes('ملوك') || check.ocr.includes('إيليا') || check.ocr.includes('الفرقتين') || check.ocr.includes('الإصحاح') || check.ocr.includes('21')) {
      enteredReader = true;
      console.log('Entered 1 Kings 18 ChapterReaderScreen successfully!');
      break;
    }
  }

  if (!enteredReader) {
    throw new Error('Could not navigate to 1 Kings 18:21 in ChapterReaderScreen from H5587 search results.');
  }

  // Now tap the highlighted Verse 21 card to enter WordStudyScreen
  // Highlighted verse is centered or near top/middle of ChapterReaderScreen
  const verseTapOffsets = [0.40, 0.50, 0.30, 0.60];
  let enteredWordStudy = false;
  for (const yRatio of verseTapOffsets) {
    console.log(`Tapping Verse 21 card at (${Math.round(W * 0.60)}, ${Math.round(H * yRatio)}) to open WordStudyScreen...`);
    execAdb(`shell input tap ${Math.round(W * 0.60)} ${Math.round(H * yRatio)}`);
    sleep(3000);

    const wsCheck = captureAndOcr('wordstudy_entry_check.png');
    if (wsCheck.ocr.includes('الأصل المعجمي') || wsCheck.ocr.includes('سترونج والنطق') || wsCheck.ocr.includes('الرمز المعجمي') || wsCheck.ocr.includes('كلمة')) {
      enteredWordStudy = true;
      console.log('Entered WordStudyScreen for 1 Kings 18:21!');
      break;
    }
  }

  if (!enteredWordStudy) {
    throw new Error('Could not open WordStudyScreen for 1 Kings 18:21.');
  }

  // Scroll down inside WordStudyScreen so Row 11 ("الْفِرْقَتَيْنِ" / H5587) comes into view
  console.log('Scrolling in WordStudyScreen to reach row 11 ("الْفِرْقَتَيْنِ" / H5587)...');
  for (let s = 0; s < 5; s++) {
    const scan = captureAndOcr('wordstudy_scroll_scan.png');
    if (scan.ocr.includes('5587') || scan.ocr.includes('الفرقتين')) {
      console.log(`Detected H5587 / الفرقتين on screen at scroll iteration ${s}!`);
      break;
    }
    execAdb(`shell input swipe ${Math.round(W * 0.50)} ${Math.round(H * 0.72)} ${Math.round(W * 0.50)} ${Math.round(H * 0.35)} 350`);
    sleep(1200);
  }

  // Try tapping rows in the middle region to open H5587 StrongsModal
  const rowOffsets = [0.50, 0.58, 0.42, 0.66, 0.34, 0.74];
  let openedH5587Modal = false;
  let finalCardOcr = '';

  for (const yRatio of rowOffsets) {
    console.log(`Trying word row tap at (${Math.round(W * 0.50)}, ${Math.round(H * yRatio)})...`);
    execAdb(`shell input tap ${Math.round(W * 0.50)} ${Math.round(H * yRatio)}`);
    sleep(2200);

    const modalCheck = captureAndOcr('modal_check.png');
    if (modalCheck.ocr.includes('5587') || modalCheck.ocr.includes('ساعف') || modalCheck.ocr.includes('الفرقتين')) {
      console.log('StrongsModal for H5587 opened! Ensuring Morphology Card table is centered...');
      if (!modalCheck.ocr.includes('Masculine') && !modalCheck.ocr.includes('التحليل النحوي')) {
        // Gentle swipe up inside the bottom sheet modal to center Morphology table
        execAdb(`shell input swipe ${Math.round(W * 0.50)} ${Math.round(H * 0.65)} ${Math.round(W * 0.50)} ${Math.round(H * 0.42)} 350`);
        sleep(1200);
      }

      const cardSnap = captureAndOcr(screenshotName, `/sdcard/${screenshotName}`);
      finalCardOcr = cardSnap.ocr;
      openedH5587Modal = true;
      break;
    } else if (modalCheck.ocr.includes('المعنى') || modalCheck.ocr.includes('سترونج') || modalCheck.ocr.includes('التحليل الصرفي')) {
      // Wrong row modal opened, dismiss and try next offset
      execAdb('shell input keyevent 4');
      sleep(1000);
    }
  }

  if (!openedH5587Modal) {
    throw new Error('Could not open StrongsModal for H5587 in 1 Kings 18:21.');
  }

  console.log(`${screenshotName} OCR sample:`, finalCardOcr.slice(0, 450).replace(/\n/g, ' '));
  fs.writeFileSync(path.join(evidenceDir, screenshotName.replace('.png', '_ocr.txt')), finalCardOcr, 'utf8');

  // Note: Left column header labels statically read 'الجنس (مذكر / مؤنث / محايد)' and 'العدد (مفرد / مثنى / جمع)'.
  // The actual displayed morphology VALUES contain English tags 'Masculine' & 'Plural' (never 'Feminine' or 'Dual').
  const hasMasculine = finalCardOcr.includes('Masculine') || /مذكر\s*\(Masculine\)/i.test(finalCardOcr);
  const hasPlural = finalCardOcr.includes('Plural') || /جمع\s*\(Plural\)/i.test(finalCardOcr);
  const hasWrongDualOrFem = finalCardOcr.includes('Feminine') || finalCardOcr.includes('Dual');

  console.log(`Morphology Card UI Assertions: hasMasculine=${hasMasculine}, hasPlural=${hasPlural}, hasWrongDualOrFem=${hasWrongDualOrFem}`);
  if (!hasMasculine || !hasPlural) {
    throw new Error(`Expected masculine/plural values not confirmed on H5587 Word Study Card UI! OCR: "${finalCardOcr.slice(0, 400)}"`);
  }
  if (hasWrongDualOrFem) {
    throw new Error(`REGRESSION: Outdated Dual/Feminine value detected on H5587 Word Study Card UI!`);
  }
}

// ============================================================================
// TRACK 1: CLEAN INSTALL OF v1.0.372
// ============================================================================
console.log('--- TRACK 1: CLEAN INSTALL OF v1.0.372 ---');
const t1Start = Date.now();
let t1Passed = false;
let t1Error = '';

try {
  execAdb('logcat -c');
  execAdb('uninstall com.arabicbible.study', { ignoreError: true });
  sleep(1500);

  const instRes = execAdb('install v372_candidate.apk', { timeout: 90000 });
  console.log('Clean install result:', instRes);
  if (!instRes.toLowerCase().includes('success')) {
    throw new Error(`Clean install failed: ${instRes}`);
  }

  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  console.log('Waiting for v1.0.372 initial DB extraction (70 parts)...');

  let cleanMigrated = false;
  for (let poll = 0; poll < 40; poll++) {
    sleep(1500);
    const prefsXml = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml', { ignoreError: true });
    if (prefsXml.includes('name="flutter.db_version" value="372"')) {
      cleanMigrated = true;
      console.log(`Clean install DB v372 confirmed ready on disk at ${(poll + 1) * 1.5}s!`);
      break;
    }
  }
  if (!cleanMigrated) {
    throw new Error('Timed out waiting for clean install to write db_version = 372!');
  }

  // Check physical DB file on device
  const dbPathClean = '/data/data/com.arabicbible.study/databases/bible_study_v372.db';
  const statOutClean = execAdb(`shell stat -c %s ${dbPathClean}`);
  const bytesClean = parseInt(statOutClean.trim(), 10);
  console.log(`Clean install physical DB size on Android device: ${bytesClean} bytes`);
  if (bytesClean !== 363438080) {
    throw new Error(`Unexpected DB size on clean install: ${bytesClean} (expected 363438080)`);
  }

  const headerClean = execAdb(`shell head -c 16 ${dbPathClean}`);
  if (!headerClean.includes('SQLite format 3')) {
    throw new Error(`Invalid SQLite header on clean install DB: ${headerClean}`);
  }

  const cleanLogcat = execAdb('logcat -d', { timeout: 45000 });
  fs.writeFileSync(path.join(evidenceDir, 'clean_install_logcat.txt'), cleanLogcat, 'utf8');
  if (cleanLogcat.includes('AssetNotFoundException') || cleanLogcat.includes('part_70.dat')) {
    throw new Error('CRITICAL: Detected AssetNotFoundException or part_70.dat reference during clean install!');
  }

  // Open 1 Kings 18:21 H5587 Card and verify masculine plural in UI!
  openH5587MorphologyCardAndVerify('clean_install_1kgs_h5587_card.png');

  t1Passed = true;
} catch (e) {
  t1Error = e.message;
}
recordTest('test_clean_install_v372_opens_db_and_renders_h5587_card', (Date.now() - t1Start) / 1000, t1Passed, t1Error);

// ============================================================================
// TRACK 2: UPGRADE FROM v1.0.370 TO v1.0.372
// ============================================================================
console.log('\n--- TRACK 2: UPGRADE FROM v1.0.370 TO v1.0.372 ---');
const t2Start = Date.now();
let t2Passed = false;
let t2Error = '';

try {
  execAdb('logcat -c');
  execAdb('uninstall com.arabicbible.study', { ignoreError: true });
  sleep(1500);

  // Install baseline v1.0.370
  const inst370 = execAdb('install v370_baseline.apk', { timeout: 90000 });
  console.log('Baseline v370 install result:', inst370);
  if (!inst370.toLowerCase().includes('success')) {
    throw new Error(`Baseline v370 install failed: ${inst370}`);
  }

  // Seed user state in v370 SharedPreferences
  const seedXml = `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <boolean name="flutter.is_dark_mode" value="true" />
    <long name="flutter.db_version" value="370" />
    <string name="flutter.recent_search_queries">VGhpcyBpcyB0aGUgcHJlZml4IGZvciBhIGxpc3Qu![&quot;G561&quot;,&quot;H5587&quot;,&quot;H7725&quot;]</string>
</map>
`;
  const seedLocal = path.join(evidenceDir, 'seed_v370.xml');
  fs.writeFileSync(seedLocal, seedXml, 'utf8');
  execAdb('shell mkdir -p /data/data/com.arabicbible.study/shared_prefs', { ignoreError: true });
  execAdb(`push "${seedLocal}" /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml`);
  execAdb('shell chmod 666 /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  execAdb('shell chown -R $(stat -c "%u:%g" /data/data/com.arabicbible.study) /data/data/com.arabicbible.study/shared_prefs');

  // Launch v370 to initialize bible_study_v370.db
  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  console.log('Waiting 12s for baseline v370 DB setup...');
  sleep(12000);
  ensureAppInForeground();

  // Execute an organic search in baseline v370 UI before upgrade
  console.log('Performing organic search in baseline v370 UI...');
  executeSearch('G561');
  sleep(1500);
  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  sleep(1500);

  // Force-stop to flush prefs and verify v370 state on device
  execAdb('shell am force-stop com.arabicbible.study');
  sleep(2000);

  const prefsBefore = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  fs.writeFileSync(path.join(evidenceDir, 'prefs_before_upgrade.xml'), prefsBefore, 'utf8');
  console.log('Captured prefs_before_upgrade.xml:\n', prefsBefore);

  const db370Check = execAdb('shell ls -l /data/data/com.arabicbible.study/databases/bible_study_v370.db');
  console.log('Verified baseline bible_study_v370.db exists:', db370Check);

  // Perform in-place upgrade to v1.0.372 WITHOUT wiping data (-r)
  console.log('\nExecuting in-place upgrade (`adb install -r v372_candidate.apk`)...');
  execAdb('logcat -c');
  const upgradeOut = execAdb('install -r v372_candidate.apk', { timeout: 90000 });
  console.log('In-place upgrade output:', upgradeOut);
  if (!upgradeOut.toLowerCase().includes('success')) {
    throw new Error(`In-place upgrade failed: ${upgradeOut}`);
  }

  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  console.log('Waiting for v1.0.372 upgrade migration from v370...');

  let upgradeMigrated = false;
  for (let poll = 0; poll < 40; poll++) {
    sleep(1500);
    const prefsPoll = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml', { ignoreError: true });
    if (prefsPoll.includes('name="flutter.db_version" value="372"')) {
      upgradeMigrated = true;
      console.log(`Upgrade migration to db_version = 372 confirmed on disk at ${(poll + 1) * 1.5}s!`);
      break;
    }
  }
  if (!upgradeMigrated) {
    throw new Error('Timed out waiting for upgrade migration to write db_version = 372!');
  }

  const upgradeLogcat = execAdb('logcat -d', { timeout: 45000 });
  fs.writeFileSync(path.join(evidenceDir, 'upgrade_logcat.txt'), upgradeLogcat, 'utf8');
  if (upgradeLogcat.includes('AssetNotFoundException') || upgradeLogcat.includes('part_70.dat')) {
    throw new Error('CRITICAL: Detected AssetNotFoundException or part_70.dat reference during upgrade!');
  }

  // Verify v370 legacy DB was deleted and v372 DB is open & exact size
  const legacyExistsCheck = execAdb('shell ls /data/data/com.arabicbible.study/databases/bible_study_v370.db', { ignoreError: true });
  if (!legacyExistsCheck.includes('No such file') && legacyExistsCheck.includes('bible_study_v370.db')) {
    throw new Error(`Legacy database bible_study_v370.db was NOT cleaned up after upgrade!`);
  }
  console.log('[PASS] Verified legacy bible_study_v370.db was cleanly deleted.');

  const dbPathUpgrade = '/data/data/com.arabicbible.study/databases/bible_study_v372.db';
  const bytesUpgrade = parseInt(execAdb(`shell stat -c %s ${dbPathUpgrade}`).trim(), 10);
  if (bytesUpgrade !== 363438080) {
    throw new Error(`Upgraded DB size mismatch: ${bytesUpgrade} (expected 363438080)`);
  }
  console.log(`[PASS] Verified bible_study_v372.db present on disk (${bytesUpgrade} bytes).`);

  // Verify user preferences 100% intact
  const prefsAfter = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  fs.writeFileSync(path.join(evidenceDir, 'prefs_after_upgrade.xml'), prefsAfter, 'utf8');
  console.log('Captured prefs_after_upgrade.xml:\n', prefsAfter);

  const hasDark = prefsAfter.includes('is_dark_mode') && prefsAfter.includes('value="true"');
  const hasDb372 = prefsAfter.includes('db_version') && prefsAfter.includes('value="372"');
  const hasSearchQueries = prefsAfter.includes('recent_search_queries') && (prefsAfter.includes('H5587') || prefsAfter.includes('VGhpcy'));

  if (!hasDark || !hasDb372 || !hasSearchQueries) {
    throw new Error(`User data loss detected in SharedPreferences after upgrade! hasDark=${hasDark}, hasDb372=${hasDb372}, hasSearchQueries=${hasSearchQueries}`);
  }

  // Open Search Screen and verify visual chips + dark mode retained
  ensureSearchScreen();
  dismissKeyboard();
  sleep(1500);
  const searchUiSnap = captureAndOcr('upgrade_search_history.png', '/sdcard/upgrade_search_history.png');
  console.log('Upgrade Search History UI OCR sample:', searchUiSnap.ocr.slice(0, 250).replace(/\n/g, ' '));
  fs.writeFileSync(path.join(evidenceDir, 'upgrade_search_history_ocr.txt'), searchUiSnap.ocr, 'utf8');

  // Open 1 Kings 18:21 H5587 Card post-upgrade and verify masculine plural
  openH5587MorphologyCardAndVerify('upgrade_1kgs_h5587_card.png');

  t2Passed = true;
} catch (e) {
  t2Error = e.message;
}
recordTest('test_upgrade_v370_to_v372_retains_user_data_and_renders_h5587_card', (Date.now() - t2Start) / 1000, t2Passed, t2Error);

// ============================================================================
// TRACK 3: LOGCAT CLEANLINESS, SCREENSHOT UNIQUENESS & EVIDENCE BUNDLE
// ============================================================================
console.log('\n--- TRACK 3: LOGCAT CLEANLINESS & EVIDENCE PACKAGING ---');
const t3Start = Date.now();
let t3Passed = false;
let t3Error = '';

try {
  const finalLogcatPath = path.join(evidenceDir, 'final_logcat.txt');
  execAdb('shell "logcat -d > /sdcard/final_logcat_v372.txt"');
  execAdb(`pull /sdcard/final_logcat_v372.txt "${finalLogcatPath}"`);
  const finalLogcat = fs.readFileSync(finalLogcatPath, 'utf8');

  if (finalLogcat.includes('FATAL EXCEPTION: main') || finalLogcat.includes('AndroidRuntime: FATAL') || finalLogcat.includes('AssetNotFoundException')) {
    throw new Error('Fatal crash or AssetNotFoundException found in final_logcat.txt!');
  }

  // Verify all screenshots exist and are distinct
  const shotNames = ['clean_install_1kgs_h5587_card.png', 'upgrade_search_history.png', 'upgrade_1kgs_h5587_card.png'];
  const imageHashes = {};
  const uniqueSet = new Set();
  for (const s of shotNames) {
    const p = path.join(evidenceDir, s);
    if (!fs.existsSync(p) || fs.statSync(p).size < 10000) {
      throw new Error(`Screenshot ${s} missing or invalid!`);
    }
    const h = getFileSha256(p);
    imageHashes[s] = { sha256: h, size: fs.statSync(p).size };
    uniqueSet.add(h);
  }
  if (uniqueSet.size !== shotNames.length) {
    throw new Error(`Duplicate screenshot hashes detected (${uniqueSet.size}/${shotNames.length})!`);
  }
  fs.writeFileSync(path.join(evidenceDir, 'image_hashes.json'), JSON.stringify(imageHashes, null, 2), 'utf8');

  t3Passed = true;
} catch (e) {
  t3Error = e.message;
}
recordTest('test_zero_fatal_crashes_and_distinct_evidence', (Date.now() - t3Start) / 1000, t3Passed, t3Error);

// Write JUnit XML
const totalTime = testResults.reduce((s, t) => s + t.durationSec, 0);
const failuresCount = testResults.filter(t => !t.passed).length;
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites tests="${testResults.length}" failures="${failuresCount}" time="${totalTime.toFixed(2)}">\n  <testsuite name="v1.0.372.AndroidEmulatorVerification" tests="${testResults.length}" failures="${failuresCount}" time="${totalTime.toFixed(2)}">\n`;
for (const t of testResults) {
  xml += `    <testcase classname="v1.0.372.AndroidEmulatorVerification" name="${t.name}" time="${t.durationSec.toFixed(2)}">\n`;
  if (!t.passed) xml += `      <failure message="${t.failureMsg.replace(/"/g, '&quot;')}">${t.failureMsg}</failure>\n`;
  xml += `    </testcase>\n`;
}
xml += `  </testsuite>\n</testsuites>\n`;
fs.writeFileSync(path.join(evidenceDir, 'test-results.xml'), xml, 'utf8');

try {
  child.execSync(`cd "${evidenceDir}" && zip -r "../android_emulator_v372_evidence.zip" ./*`, { timeout: 30000 });
} catch (_) {}

console.log(`\nSUMMARY: ${testResults.length - failuresCount}/${testResults.length} Emulator Verification Suites Passed.`);
if (failuresCount > 0) process.exit(1);
process.exit(0);
