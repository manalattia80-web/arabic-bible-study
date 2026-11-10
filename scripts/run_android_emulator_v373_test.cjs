/**
 * run_android_emulator_v373_test.cjs
 * Official Android Emulator Verification Suite for Release v1.0.373
 * Separated into clean, independent suites on live Android API 33 KVM Emulator:
 *   Suite 1 (Clean Install): Fresh install of v1.0.373 APK -> verifies bible_study_v373.db
 *     (363,438,080 bytes from 70 parts), zero AssetNotFoundException, opens Zechariah 4:6.
 *   Suite 2 (Upgrade v372 -> v373): Installs v1.0.372 baseline, seeds user prefs/history,
 *     upgrades in-place (`adb install -r v373_candidate.apk`), verifies bible_study_v372.db
 *     cleanup, bible_study_v373.db integrity, 100% user prefs preservation, opens Zechariah 4:6.
 *   Suite 3 (Direct Zechariah 4:6 Cards Verification on v1.0.373):
 *     Opens each of the 4 cards by name/Strong's/transliteration directly in Zechariah 4:6 WordStudyScreen:
 *       - H1697 ("كَلِمَةُ"): Construct state ("Construct" / "الإضافة العبرية")
 *       - H2428 ("بِالْقُدْرَةِ"): Bet prefix VALUE ("باء الجر" / "الظرفية" — NEVER just row label)
 *       - H3581 ("بِالْقُوَّةِ"): Bet prefix VALUE ("باء الجر" / "الظرفية" — NEVER just row label)
 *       - H7307 ("بِرُوحِي"): BOTH Bet prefix VALUE ("باء الجر" / "الظرفية") AND Construct state
 *   Suite 4 (Logcat Cleanliness & Distinct Screenshot Evidence Packaging).
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

function runFastEngOcr(imagePath, isDark = false) {
  try {
    let targetImg = imagePath;
    const inverted = imagePath.replace(/\.png$/i, '_fastneg.png');
    if (isDark) {
      try {
        child.execSync(`ffmpeg -y -i "${imagePath}" -vf "negate" "${inverted}"`, {
          stdio: 'ignore',
          timeout: 15000
        });
        if (fs.existsSync(inverted)) targetImg = inverted;
      } catch (_) {}
    }
    const out = child.execSync(`tesseract "${targetImg}" stdout -l eng`, {
      encoding: 'utf8',
      timeout: 20000,
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    if (isDark) {
      try { if (fs.existsSync(inverted)) fs.unlinkSync(inverted); } catch (_) {}
    }
    return out;
  } catch (_) {
    return '';
  }
}

function runOcr(imagePath, fastSinglePass = false) {
  try {
    let combined = '';
    for (const lang of ['eng+ara', 'eng']) {
      try {
        combined += child.execSync(`tesseract "${imagePath}" stdout -l ${lang}`, {
          encoding: 'utf8',
          timeout: 30000,
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim() + ' ';
      } catch (_) {}
    }

    if (!fastSinglePass) {
      try {
        const inverted = imagePath.replace(/\.png$/i, '_neg.png');
        child.execSync(`ffmpeg -y -i "${imagePath}" -vf "negate" "${inverted}"`, {
          stdio: 'ignore',
          timeout: 15000
        });
        if (fs.existsSync(inverted)) {
          for (const lang of ['eng+ara', 'eng']) {
            try {
              combined += child.execSync(`tesseract "${inverted}" stdout -l ${lang}`, {
                encoding: 'utf8',
                timeout: 30000,
                stdio: ['pipe', 'pipe', 'ignore']
              }).trim() + ' ';
            } catch (_) {}
          }
          try { fs.unlinkSync(inverted); } catch (_) {}
        }
      } catch (_) {}
    }

    return combined.trim();
  } catch (err) {
    console.warn(`OCR warning on ${imagePath}:`, err.message);
    return '';
  }
}

/**
 * Finds Y pixel coordinates of target Strong's/transliteration words using Tesseract TSV.
 */
function findTargetRowYsFromTsv(imagePath, targetCodes, H) {
  const found = {};
  const imagesToScan = [imagePath];
  const inverted = imagePath.replace(/\.png$/i, '_tsv_neg.png');
  try {
    child.execSync(`ffmpeg -y -i "${imagePath}" -vf "negate" "${inverted}"`, {
      stdio: 'ignore',
      timeout: 15000
    });
    if (fs.existsSync(inverted)) imagesToScan.push(inverted);
  } catch (_) {}

  const tsvAliases = {
    H1697: ['1697', 'dabar', 'dbar'],
    H2428: ['2428', 'chayil', 'chayll'],
    H3581: ['3581', 'koach', 'kdach'],
    H7307: ['7307', 'ruwach', 'ruach'],
  };

  for (const img of imagesToScan) {
    for (const psm of ['6', '11']) {
      try {
        const tsv = child.execSync(`tesseract "${img}" stdout -l eng --psm ${psm} tsv`, {
          encoding: 'utf8',
          timeout: 20000,
          stdio: ['pipe', 'pipe', 'ignore']
        });
        for (const line of tsv.split(/\r?\n/)) {
          const cols = line.split('\t');
          if (cols.length < 12) continue;
          const top = parseInt(cols[7], 10);
          const height = parseInt(cols[9], 10);
          const rawText = (cols[11] || '').trim().replace(/[^0-9A-Za-z]/g, '');
          if (!rawText || isNaN(top) || isNaN(height) || height <= 0) continue;
          const tapY = Math.round(top + height / 2);
          if (tapY < H * 0.14 || tapY > H * 0.90) continue;

          const lower = rawText.toLowerCase();
          for (const code of targetCodes) {
            if ((tsvAliases[code] || [code.replace(/^H/, '')]).some(a => lower.includes(a))) {
              if (!found[code]) found[code] = [];
              if (!found[code].some(existingY => Math.abs(existingY - tapY) < 40)) {
                found[code].push(tapY);
              }
            }
          }
        }
      } catch (_) {}
    }
  }
  try { if (fs.existsSync(inverted)) fs.unlinkSync(inverted); } catch (_) {}
  return found;
}

console.log('========================================================================');
console.log('  ANDROID EMULATOR VERIFICATION SUITE v1.0.373 (SEPARATED TRACKS)');
console.log('========================================================================\n');

const evidenceDir = path.resolve(process.cwd(), 'emulator_evidence_v373');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

const testResults = [];
function recordTest(name, durationSec, passed, failureMsg = '', infoMsg = '') {
  const cleanMsg = String(failureMsg || '').replace(/\r?\n/g, ' | ');
  testResults.push({ name, durationSec, passed, failureMsg: cleanMsg });
  if (passed) {
    console.log(`[PASS] ${name} (${durationSec.toFixed(1)}s) ${infoMsg}`);
    console.log(`::notice::PASS ${name} (${durationSec.toFixed(1)}s) ${infoMsg}`.slice(0, 600));
  } else {
    console.error(`[FAIL] ${name} (${durationSec.toFixed(1)}s): ${cleanMsg}`);
    console.log(`::error::FAIL ${name}: ${cleanMsg.slice(0, 1200)}`);
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

function captureAndOcr(localFilename = 'screen_check.png', remotePath = '/sdcard/screen_check.png', fastSinglePass = false) {
  const localPath = path.join(evidenceDir, localFilename);
  execAdb(`shell screencap -p ${remotePath}`);
  execAdb(`pull ${remotePath} "${localPath}"`);
  return { localPath, ocr: runOcr(localPath, fastSinglePass) };
}

function ensureSearchScreen() {
  ensureAppInForeground();
  dismissKeyboard();
  for (let attempt = 0; attempt < 4; attempt++) {
    const { ocr } = captureAndOcr('nav_check.png', '/sdcard/nav_check.png', false);
    const onHome = ocr.includes('إرشادات') || ocr.includes('أوفلاين') || ocr.includes('فاندايك') || ocr.includes('تصفح الأسفار');
    const onSearch = !onHome && (
      ocr.includes('المجموعة السفرية') ||
      ocr.includes('تحديد سفر') ||
      ocr.includes('عمليات البحث') ||
      ocr.includes('اقتراحات للدراسة') ||
      ocr.includes('ابحث في') ||
      ocr.includes('وجدنا') ||
      ocr.includes('38 4 6')
    );
    if (!onSearch) {
      console.log(`Not yet on SearchScreen (attempt ${attempt}, tapping Search icon at ${searchIconX}, ${searchIconY})...`);
      execAdb(`shell input tap ${searchIconX} ${searchIconY}`);
      sleep(2500);
    } else {
      console.log('Confirmed SearchScreen is open.');
      break;
    }
  }
}

function executeSearch(queryText) {
  ensureSearchScreen();
  execAdb(`shell input tap ${searchInputX} ${searchInputY}`);
  sleep(500);
  for (let k = 0; k < 15; k++) execAdb('shell input keyevent 67');
  sleep(400);

  console.log(`Typing search query: ${queryText}`);
  execAdb(`shell input tap ${searchInputX} ${searchInputY}`);
  sleep(500);
  if (queryText.includes(' ')) {
    const parts = queryText.split(' ');
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) execAdb('shell input keyevent 62'); // KEYCODE_SPACE
      if (parts[i].length > 0) execAdb(`shell input text "${parts[i]}"`);
    }
  } else {
    execAdb(`shell input text "${queryText}"`);
  }
  sleep(800);
  execAdb('shell input keyevent 66'); // Enter
  sleep(3000);
  dismissKeyboard();
  sleep(1000);
}

function isModalOpenOcr(ocr) {
  if (ocr.includes('اضغط على الرمز') || ocr.includes('سترونج والنطق') || ocr.includes('الأصل المعجمي')) {
    return false;
  }
  return (
    ocr.includes('المدخل المعجمي') ||
    ocr.includes('الرمز القياسي') ||
    ocr.includes('نطق آلي') ||
    ocr.includes('عرض المعجم') ||
    ocr.includes('المعنى المعجمي') ||
    ocr.includes('التحليل النحوي') ||
    /\b(Noun|Verb|Preposition|Conjunction|Pronoun|Particle|Adjective|Masculine|Feminine|Singular|Plural|Construct|Absolute|Hebrew|Aramaic|Wayyiqtol|dabar|chayil|koach|ruwach)\b/i.test(ocr)
  );
}

/**
 * STRICT Bet prefix assertion: requires actual Bet prefix VALUE ("باء الجر" / "الظرفية"),
 * NEVER just the generic row label ("الحروف والزوائد المتصلة").
 */
function hasBetPrefixValueOcr(ocr) {
  return (
    ocr.includes('باء الجر') ||
    ocr.includes('والظرفية') ||
    ocr.includes('الظرفية') ||
    /باء\s*الجر/.test(ocr)
  );
}

/**
 * STRICT Construct state assertion: requires "Construct" or "الإضافة العبرية" / "حالة الإضافة".
 */
function hasConstructValueOcr(ocr) {
  return (
    /\bConstruct\b/i.test(ocr) ||
    ocr.includes('الإضافة العبرية') ||
    ocr.includes('حالة الإضافة')
  );
}

/**
 * Navigates Search('38 4 6') -> Zechariah 4:6 Reader -> WordStudyScreen (confirmed Verse 6).
 */
function navigateToZech46WordStudyScreen(prefixLabel) {
  execAdb('shell am force-stop com.arabicbible.study');
  sleep(1500);
  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  sleep(3500);

  executeSearch('38 4 6');

  const searchResSnap = captureAndOcr(`${prefixLabel}_search_zech46_results.png`, `/sdcard/${prefixLabel}_search_zech46_results.png`);
  console.log('Search 38 4 6 OCR sample:', searchResSnap.ocr.slice(0, 300).replace(/\n/g, ' | '));
  const hasSearchResult = (o) =>
    o.includes('38 4 6') ||
    o.includes('وجدنا 1') ||
    o.includes('الإصحاح 4') ||
    o.includes('الآية 6') ||
    o.includes('في القارئ') ||
    o.includes('زربابل') ||
    o.includes('زكريا');
  if (!hasSearchResult(searchResSnap.ocr)) {
    console.log('Retrying Search submit button tap at', searchBtnX, searchBtnY);
    execAdb(`shell input tap ${searchBtnX} ${searchBtnY}`);
    sleep(2500);
    const retrySnap = captureAndOcr(`${prefixLabel}_search_zech46_results.png`, `/sdcard/${prefixLabel}_search_zech46_results.png`);
    if (!hasSearchResult(retrySnap.ocr)) {
      throw new Error(`Search '38 4 6' did not return Zechariah 4:6 result card! OCR: "${retrySnap.ocr.replace(/\r?\n/g, ' | ').slice(0, 320)}"`);
    }
  }

  const cardTapOffsets = [0.34, 0.38, 0.42, 0.30, 0.46, 0.52];
  let enteredReader = false;
  let lastReaderCheckOcr = '';
  for (const yRatio of cardTapOffsets) {
    console.log(`Tapping Zechariah 4:6 result card at (${Math.round(W * 0.50)}, ${Math.round(H * yRatio)})...`);
    execAdb(`shell input tap ${Math.round(W * 0.50)} ${Math.round(H * yRatio)}`);
    sleep(4000);

    const check = captureAndOcr('reader_entry_check.png', '/sdcard/reader_entry_check.png');
    lastReaderCheckOcr = check.ocr;
    if (isModalOpenOcr(check.ocr)) {
      execAdb('shell input keyevent 4');
      sleep(1200);
      continue;
    }
    if (check.ocr.includes('الأصل المعجمي') || check.ocr.includes('سترونج والنطق')) {
      execAdb('shell input keyevent 4');
      sleep(1200);
      enteredReader = true;
      console.log('Returned from WordStudyScreen to Zechariah 4 ChapterReaderScreen!');
      break;
    }
    const isReaderScreen =
      (check.ocr.includes('التالي') || check.ocr.includes('السابق') || check.ocr.includes('من 14')) &&
      !check.ocr.includes('نتائج') &&
      !check.ocr.includes('وجدنا') &&
      !check.ocr.includes('اقتراحات') &&
      !check.ocr.includes('الأصل المعجمي') &&
      !check.ocr.includes('سترونج والنطق');
    if (isReaderScreen) {
      enteredReader = true;
      console.log('Entered Zechariah 4 ChapterReaderScreen successfully!');
      break;
    }
  }

  if (!enteredReader) {
    throw new Error(`Could not navigate to Zechariah 4:6 in ChapterReaderScreen from 38 4 6 search. Last OCR: "${lastReaderCheckOcr.replace(/\r?\n/g, ' | ').slice(0, 280)}"`);
  }

  // ChapterReaderScreen aligns target verse with alignment: 0.15
  const verseTapOffsets = [0.24, 0.28, 0.32, 0.20, 0.36, 0.42, 0.48];
  let enteredWordStudy = false;
  let lastWsCheckOcr = '';
  const wsShotName = `${prefixLabel}_zech46_wordstudy.png`;
  for (const yRatio of verseTapOffsets) {
    console.log(`Tapping Verse 6 card at (${Math.round(W * 0.60)}, ${Math.round(H * yRatio)}) to open WordStudyScreen...`);
    execAdb(`shell input tap ${Math.round(W * 0.60)} ${Math.round(H * yRatio)}`);
    sleep(3500);

    const wsCheck = captureAndOcr(wsShotName, `/sdcard/${wsShotName}`);
    lastWsCheckOcr = wsCheck.ocr;
    const isWordStudy = wsCheck.ocr.includes('الأصل المعجمي') || wsCheck.ocr.includes('سترونج والنطق') || wsCheck.ocr.includes('الرمز المعجمي') || wsCheck.ocr.includes('دراسة');
    if (isWordStudy) {
      const isZech46 =
        wsCheck.ocr.includes('الآية 6') ||
        wsCheck.ocr.includes('الآية ٦') ||
        (/زكريا.*الإصحاح\s*4/.test(wsCheck.ocr) && /\b6\b/.test(wsCheck.ocr)) ||
        (/الإصحاح\s*4.*الآية/.test(wsCheck.ocr) && /\b6\b/.test(wsCheck.ocr)) ||
        wsCheck.ocr.includes('18 كلمة') ||
        wsCheck.ocr.includes('1697') ||
        wsCheck.ocr.includes('2428') ||
        wsCheck.ocr.includes('7307');
      if (isZech46) {
        enteredWordStudy = true;
        console.log('Confirmed WordStudyScreen for Zechariah 4:6 is open!');
        break;
      }
      console.log(`Opened WordStudyScreen for wrong verse, pressing Back...`);
      execAdb('shell input keyevent 4');
      sleep(1200);
    }
  }

  if (!enteredWordStudy) {
    throw new Error(`Could not open WordStudyScreen for Zechariah 4:6 (Verse 6). Last OCR: "${lastWsCheckOcr.replace(/\r?\n/g, ' | ').slice(0, 280)}"`);
  }
  return wsShotName;
}

const capturedEvidenceFiles = [];

// ============================================================================
// SUITE 1: CLEAN INSTALL OF v1.0.373
// ============================================================================
console.log('--- SUITE 1: CLEAN INSTALL OF v1.0.373 ---');
const t1Start = Date.now();
let t1Passed = false;
let t1Error = '';

try {
  execAdb('logcat -c');
  execAdb('uninstall com.arabicbible.study', { ignoreError: true });
  sleep(1500);

  const instRes = execAdb('install v373_candidate.apk', { timeout: 90000 });
  console.log('Clean install result:', instRes);
  if (!instRes.toLowerCase().includes('success')) {
    throw new Error(`Clean install failed: ${instRes}`);
  }

  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  console.log('Waiting for v1.0.373 initial DB extraction (70 parts)...');

  let cleanMigrated = false;
  for (let poll = 0; poll < 45; poll++) {
    sleep(1500);
    const prefsXml = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml', { ignoreError: true });
    if (prefsXml.includes('name="flutter.db_version" value="373"')) {
      cleanMigrated = true;
      console.log(`Clean install DB v373 confirmed ready on disk at ${(poll + 1) * 1.5}s!`);
      break;
    }
  }
  if (!cleanMigrated) {
    throw new Error('Timed out waiting for clean install to write db_version = 373!');
  }

  const dbPathClean = '/data/data/com.arabicbible.study/databases/bible_study_v373.db';
  const statOutClean = execAdb(`shell stat -c %s ${dbPathClean}`);
  const bytesClean = parseInt(statOutClean.trim(), 10);
  console.log(`Clean install physical DB size: ${bytesClean} bytes`);
  if (isNaN(bytesClean) || bytesClean < 363438080 || bytesClean > 363500000) {
    throw new Error(`Unexpected DB size on clean install: ${bytesClean} (expected ~363438080 - 363446272)`);
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

  const wsShot = navigateToZech46WordStudyScreen('clean_install');
  capturedEvidenceFiles.push(wsShot);
  t1Passed = true;
} catch (e) {
  t1Error = e.message;
}
recordTest('test_clean_install_v373_opens_db_and_reaches_zech46', (Date.now() - t1Start) / 1000, t1Passed, t1Error);

// ============================================================================
// SUITE 2: ACTUAL UPGRADE FROM v1.0.372 TO v1.0.373
// ============================================================================
console.log('\n--- SUITE 2: UPGRADE FROM v1.0.372 TO v1.0.373 ---');
const t2Start = Date.now();
let t2Passed = false;
let t2Error = '';

try {
  execAdb('logcat -c');
  execAdb('uninstall com.arabicbible.study', { ignoreError: true });
  sleep(1500);

  const inst372 = execAdb('install v372_baseline.apk', { timeout: 90000 });
  console.log('Baseline v372 install result:', inst372);
  if (!inst372.toLowerCase().includes('success')) {
    throw new Error(`Baseline v372 install failed: ${inst372}`);
  }

  const seedXml = `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <boolean name="flutter.is_dark_mode" value="true" />
    <long name="flutter.db_version" value="372" />
    <string name="flutter.recent_search_queries">VGhpcyBpcyB0aGUgcHJlZml4IGZvciBhIGxpc3Qu![&quot;G561&quot;,&quot;H5587&quot;,&quot;H7307&quot;]</string>
</map>
`;
  const seedLocal = path.join(evidenceDir, 'seed_v372.xml');
  fs.writeFileSync(seedLocal, seedXml, 'utf8');
  execAdb('shell mkdir -p /data/data/com.arabicbible.study/shared_prefs', { ignoreError: true });
  execAdb(`push "${seedLocal}" /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml`);
  execAdb('shell chmod 666 /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  execAdb('shell "if [ -d /data/data/com.arabicbible.study ]; then chown -R $(stat -c \'%u:%g\' /data/data/com.arabicbible.study) /data/data/com.arabicbible.study/shared_prefs; fi"', { ignoreError: true });

  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  console.log('Waiting for baseline v372 DB initialization on device...');
  let v372Ready = false;
  for (let poll = 0; poll < 45; poll++) {
    sleep(1500);
    const sz = parseInt(execAdb('shell stat -c %s /data/data/com.arabicbible.study/databases/bible_study_v372.db', { ignoreError: true }).trim(), 10);
    if (!isNaN(sz) && sz >= 363438080) {
      v372Ready = true;
      console.log(`Baseline bible_study_v372.db ready (${sz} bytes) at ${(poll + 1) * 1.5}s!`);
      break;
    }
  }
  if (!v372Ready) {
    throw new Error('Timed out waiting for baseline v372 database bible_study_v372.db to initialize!');
  }
  sleep(3500);
  ensureAppInForeground();

  console.log('Performing organic search in baseline v372 UI...');
  executeSearch('G561');
  sleep(1500);
  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  sleep(1500);

  execAdb('shell am force-stop com.arabicbible.study');
  sleep(2000);

  const prefsBefore = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  fs.writeFileSync(path.join(evidenceDir, 'prefs_before_upgrade.xml'), prefsBefore, 'utf8');

  // Perform in-place upgrade to v1.0.373 WITHOUT wiping data (-r)
  console.log('\nExecuting in-place upgrade (`adb install -r v373_candidate.apk`)...');
  execAdb('logcat -c');
  const upgradeOut = execAdb('install -r v373_candidate.apk', { timeout: 90000 });
  console.log('In-place upgrade output:', upgradeOut);
  if (!upgradeOut.toLowerCase().includes('success')) {
    throw new Error(`In-place upgrade failed: ${upgradeOut}`);
  }

  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  console.log('Waiting for v1.0.373 upgrade migration from v372...');

  let upgradeMigrated = false;
  for (let poll = 0; poll < 45; poll++) {
    sleep(1500);
    const prefsPoll = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml', { ignoreError: true });
    if (prefsPoll.includes('name="flutter.db_version" value="373"')) {
      upgradeMigrated = true;
      console.log(`Upgrade migration to db_version = 373 confirmed on disk at ${(poll + 1) * 1.5}s!`);
      break;
    }
  }
  if (!upgradeMigrated) {
    throw new Error('Timed out waiting for upgrade migration to write db_version = 373!');
  }

  const upgradeLogcat = execAdb('logcat -d', { timeout: 45000 });
  fs.writeFileSync(path.join(evidenceDir, 'upgrade_logcat.txt'), upgradeLogcat, 'utf8');
  if (upgradeLogcat.includes('AssetNotFoundException') || upgradeLogcat.includes('part_70.dat')) {
    throw new Error('CRITICAL: Detected AssetNotFoundException or part_70.dat reference during upgrade!');
  }

  const legacyExistsCheck = execAdb('shell ls /data/data/com.arabicbible.study/databases/bible_study_v372.db', { ignoreError: true });
  if (!legacyExistsCheck.includes('No such file') && legacyExistsCheck.includes('bible_study_v372.db')) {
    throw new Error('Legacy database bible_study_v372.db was NOT cleaned up after upgrade!');
  }
  console.log('[PASS] Verified legacy bible_study_v372.db was cleanly deleted.');

  const dbPathUpgrade = '/data/data/com.arabicbible.study/databases/bible_study_v373.db';
  const bytesUpgrade = parseInt(execAdb(`shell stat -c %s ${dbPathUpgrade}`).trim(), 10);
  if (isNaN(bytesUpgrade) || bytesUpgrade < 363438080 || bytesUpgrade > 363500000) {
    throw new Error(`Upgraded DB size mismatch: ${bytesUpgrade} (expected ~363438080 - 363446272)`);
  }
  console.log(`[PASS] Verified bible_study_v373.db present & opened on disk (${bytesUpgrade} bytes).`);
  const headerUpgrade = execAdb(`shell head -c 16 ${dbPathUpgrade}`);
  if (!headerUpgrade.includes('SQLite format 3')) {
    throw new Error(`Invalid SQLite header on upgraded DB: ${headerUpgrade}`);
  }

  const prefsAfter = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  fs.writeFileSync(path.join(evidenceDir, 'prefs_after_upgrade.xml'), prefsAfter, 'utf8');

  const hasDark = prefsAfter.includes('is_dark_mode') && prefsAfter.includes('value="true"');
  const hasDb373 = prefsAfter.includes('db_version') && prefsAfter.includes('value="373"');
  const hasSearchQueries = prefsAfter.includes('recent_search_queries') && (prefsAfter.includes('H7307') || prefsAfter.includes('VGhpcy'));

  if (!hasDark || !hasDb373 || !hasSearchQueries) {
    throw new Error(`User data loss detected in SharedPreferences after upgrade! hasDark=${hasDark}, hasDb373=${hasDb373}, hasSearchQueries=${hasSearchQueries}`);
  }

  ensureSearchScreen();
  dismissKeyboard();
  sleep(1500);
  const searchUiSnap = captureAndOcr('upgrade_search_history.png', '/sdcard/upgrade_search_history.png');
  fs.writeFileSync(path.join(evidenceDir, 'upgrade_search_history_ocr.txt'), searchUiSnap.ocr, 'utf8');
  capturedEvidenceFiles.push('upgrade_search_history.png');

  const wsUpgradeShot = navigateToZech46WordStudyScreen('upgrade');
  capturedEvidenceFiles.push(wsUpgradeShot);
  t2Passed = true;
} catch (e) {
  t2Error = e.message;
}
recordTest('test_upgrade_v372_to_v373_retains_user_data_and_opens_db', (Date.now() - t2Start) / 1000, t2Passed, t2Error);

// ============================================================================
// SUITE 3: DIRECT ZECHARIAH 4:6 CARDS VERIFICATION ON v1.0.373 PACKAGE
// Open all 4 target cards by name & Strong's/transliteration directly on v1.0.373
// ============================================================================
console.log('\n--- SUITE 3: DIRECT ZECHARIAH 4:6 BET & CONSTRUCT CARDS ON v1.0.373 ---');

const cardTargets = {
  H1697: { testName: 'test_zech46_card_H1697_construct', shotName: 'zech46_h1697_construct_card.png', expectBet: false, expectConstruct: true },
  H2428: { testName: 'test_zech46_card_H2428_bet', shotName: 'zech46_h2428_bet_card.png', expectBet: true, expectConstruct: false },
  H3581: { testName: 'test_zech46_card_H3581_bet', shotName: 'zech46_h3581_bet_card.png', expectBet: true, expectConstruct: false },
  H7307: { testName: 'test_zech46_card_H7307_bet_and_construct', shotName: 'zech46_h7307_bet_construct_card.png', expectBet: true, expectConstruct: true },
};

const cardResults = {}; // key -> { passed, err, info }
const suite3Start = Date.now();

try {
  // Already on upgraded v1.0.373 with Zechariah 4:6 WordStudyScreen open (or navigate fresh if Track 2 failed)
  if (!t2Passed) {
    execAdb('uninstall com.arabicbible.study', { ignoreError: true });
    sleep(1000);
    execAdb('install v373_candidate.apk', { timeout: 90000 });
    execAdb('shell am start -n com.arabicbible.study/.MainActivity');
    for (let poll = 0; poll < 45; poll++) {
      sleep(1500);
      const p = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml', { ignoreError: true });
      if (p.includes('name="flutter.db_version" value="373"')) break;
    }
    navigateToZech46WordStudyScreen('cards_suite');
  } else {
    // Re-enter WordStudyScreen cleanly from top so frame 0 starts at row 1
    navigateToZech46WordStudyScreen('cards_suite');
  }

  const isDarkForCards = t2Passed; // Upgrade preserved dark mode; clean fallback is light mode

  function captureFastEngModal() {
    const localPath = path.join(evidenceDir, 'modal_fast.png');
    execAdb('shell screencap -p /sdcard/modal_fast.png');
    execAdb(`pull /sdcard/modal_fast.png "${localPath}"`);
    return { localPath, ocr: runFastEngOcr(localPath, isDarkForCards) };
  }

  function ensureBackOnWordStudy() {
    for (let i = 0; i < 2; i++) {
      execAdb('shell input keyevent 4');
      sleep(800);
      const localPath = path.join(evidenceDir, 'back_check.png');
      execAdb('shell screencap -p /sdcard/back_check.png');
      execAdb(`pull /sdcard/back_check.png "${localPath}"`);
      const chkAraEng = runOcr(localPath, !isDarkForCards);
      if (chkAraEng.includes('اضغط على الرمز') || chkAraEng.includes('سترونج والنطق') || chkAraEng.includes('الأصل المعجمي') || !isModalOpenOcr(chkAraEng)) {
        break;
      }
    }
  }

  function inspectTargetCardModal(mFast) {
    const o = mFast.ocr;
    const hasChayil = /chay[il1t]{1,2}|hay[il1]{2}/i.test(o);
    const hasKoach  = /\bk[oô0da]?[ae]?ch|k[oô0]ac/i.test(o);
    const hasRuwach = /\br[uûi]w?[aâe]c/i.test(o);
    const hasDabar  = /\bd[aâe]?b[aâe]?r|dbar/i.test(o);

    let targetKey = null;
    if (!cardResults.H1697 && (o.includes('1697') || o.includes('Ncmsc') || hasDabar) && !hasChayil && !hasKoach && !hasRuwach && !o.includes('2428') && !o.includes('3581') && !o.includes('7307')) {
      targetKey = 'H1697';
    } else if (!cardResults.H2428 && (o.includes('2428') || hasChayil) && !hasDabar && !hasKoach && !hasRuwach && !o.includes('3581') && !o.includes('7307') && !o.includes('1697')) {
      targetKey = 'H2428';
    } else if (!cardResults.H3581 && (o.includes('3581') || hasKoach) && !hasDabar && !hasChayil && !hasRuwach && !o.includes('2428') && !o.includes('7307') && !o.includes('1697')) {
      targetKey = 'H3581';
    } else if (!cardResults.H7307 && (o.includes('7307') || o.includes('Ncbsc') || o.includes('Sp1cs') || hasRuwach) && !hasDabar && !hasChayil && !hasKoach && !o.includes('2428') && !o.includes('3581') && !o.includes('1697')) {
      targetKey = 'H7307';
    }
    if (!targetKey) return false;

    const spec = cardTargets[targetKey];
    const cardStart = Date.now();
    console.log(`\nOpened named card ${targetKey}! Capturing & verifying Bet / Construct values...`);
    let snap = captureAndOcr(spec.shotName, `/sdcard/${spec.shotName}`, false);

    const needsScroll = () => {
      if (spec.expectBet && !hasBetPrefixValueOcr(snap.ocr)) return true;
      if (spec.expectConstruct && !hasConstructValueOcr(snap.ocr)) return true;
      return false;
    };

    for (let s = 0; s < 2 && needsScroll(); s++) {
      execAdb(`shell input swipe ${Math.round(W * 0.50)} ${Math.round(H * 0.68)} ${Math.round(W * 0.50)} ${Math.round(H * 0.46)} 320`);
      sleep(1400);
      snap = captureAndOcr(spec.shotName, `/sdcard/${spec.shotName}`, false);
    }

    fs.writeFileSync(path.join(evidenceDir, spec.shotName.replace('.png', '_ocr.txt')), snap.ocr, 'utf8');
    capturedEvidenceFiles.push(spec.shotName);

    const betValueOk = hasBetPrefixValueOcr(snap.ocr);
    const constructValueOk = hasConstructValueOcr(snap.ocr);
    const ocrOneLine = snap.ocr.replace(/\r?\n/g, ' | ').slice(0, 350);

    let err = '';
    if (spec.expectBet && !betValueOk) {
      err += `Bet prefix VALUE ("باء الجر" / "الظرفية") NOT visible! `;
    }
    if (spec.expectConstruct && !constructValueOk) {
      err += `Construct state VALUE ("Construct" / "الإضافة العبرية") NOT visible! `;
    }
    if (err) {
      err += `OCR: "${ocrOneLine}"`;
    }

    cardResults[targetKey] = {
      passed: err === '',
      durationSec: (Date.now() - cardStart) / 1000,
      err,
      info: `betValue=${betValueOk}, constructValue=${constructValueOk}, ocr="${ocrOneLine.slice(0, 180)}"`
    };
    return true;
  }

  const requiredKeys = Object.keys(cardTargets);
  const frame0Offsets = [0.48, 0.525, 0.57, 0.615, 0.66, 0.705, 0.75, 0.795, 0.84, 0.885];
  const frameNOffsets = [0.20, 0.245, 0.29, 0.335, 0.38, 0.425, 0.47, 0.515, 0.56, 0.605, 0.65, 0.695, 0.74, 0.785, 0.83, 0.875];

  for (let frame = 0; frame < 10; frame++) {
    const remaining = requiredKeys.filter(k => !cardResults[k]);
    if (remaining.length === 0) break;

    if (frame > 0) {
      console.log(`Scrolling down in WordStudyScreen (frame ${frame}, remaining: ${remaining.join(', ')})...`);
      execAdb(`shell input swipe ${Math.round(W * 0.50)} ${Math.round(H * 0.84)} ${Math.round(W * 0.50)} ${Math.round(H * 0.18)} 500`);
      sleep(1100);
    }

    const scanPath = path.join(evidenceDir, `ws_cards_frame_${frame}.png`);
    execAdb('shell screencap -p /sdcard/ws_cards_frame.png');
    execAdb(`pull /sdcard/ws_cards_frame.png "${scanPath}"`);

    const tsvHits = findTargetRowYsFromTsv(scanPath, remaining, H);
    console.log(`TSV hits on frame ${frame}:`, JSON.stringify(tsvHits));

    for (const key of remaining) {
      for (const yPx of (tsvHits[key] || [])) {
        if (cardResults[key]) break;
        execAdb(`shell input tap ${Math.round(W * 0.50)} ${yPx}`);
        sleep(1400);
        const mFast = captureFastEngModal();
        if (isModalOpenOcr(mFast.ocr)) {
          inspectTargetCardModal(mFast);
          ensureBackOnWordStudy();
        }
      }
    }

    if (!requiredKeys.every(k => cardResults[k])) {
      const offsets = frame === 0 ? frame0Offsets : frameNOffsets;
      for (const yRatio of offsets) {
        if (requiredKeys.every(k => cardResults[k])) break;
        execAdb(`shell input tap ${Math.round(W * 0.50)} ${Math.round(H * yRatio)}`);
        sleep(1300);
        const mFast = captureFastEngModal();
        if (isModalOpenOcr(mFast.ocr)) {
          inspectTargetCardModal(mFast);
          ensureBackOnWordStudy();
        }
      }
    }
  }
} catch (navErr) {
  console.error('Suite 3 setup error:', navErr.message);
}

for (const [key, spec] of Object.entries(cardTargets)) {
  const res = cardResults[key];
  if (res) {
    recordTest(spec.testName, res.durationSec, res.passed, res.err, res.info);
  } else {
    recordTest(spec.testName, (Date.now() - suite3Start) / 1000, false, `Card ${key} was not opened/detected in WordStudyScreen.`);
  }
}

// ============================================================================
// SUITE 4: LOGCAT CLEANLINESS, SCREENSHOT UNIQUENESS & EVIDENCE BUNDLE
// ============================================================================
console.log('\n--- SUITE 4: LOGCAT CLEANLINESS & EVIDENCE PACKAGING ---');
const t4Start = Date.now();
let t4Passed = false;
let t4Error = '';

try {
  const finalLogcatPath = path.join(evidenceDir, 'final_logcat.txt');
  execAdb('shell "logcat -d > /sdcard/final_logcat_v373.txt"');
  execAdb(`pull /sdcard/final_logcat_v373.txt "${finalLogcatPath}"`);
  const finalLogcat = fs.readFileSync(finalLogcatPath, 'utf8');

  if (finalLogcat.includes('FATAL EXCEPTION: main') || finalLogcat.includes('AndroidRuntime: FATAL') || finalLogcat.includes('AssetNotFoundException')) {
    throw new Error('Fatal crash or AssetNotFoundException found in final_logcat.txt!');
  }

  const expectedShots = [
    'clean_install_zech46_wordstudy.png',
    'upgrade_search_history.png',
    'upgrade_zech46_wordstudy.png',
    'zech46_h1697_construct_card.png',
    'zech46_h2428_bet_card.png',
    'zech46_h3581_bet_card.png',
    'zech46_h7307_bet_construct_card.png',
  ];
  const imageHashes = {};
  const uniqueSet = new Set();
  for (const s of expectedShots) {
    const p = path.join(evidenceDir, s);
    if (!fs.existsSync(p) || fs.statSync(p).size < 10000) {
      throw new Error(`Screenshot ${s} missing or invalid!`);
    }
    const h = getFileSha256(p);
    imageHashes[s] = { sha256: h, size: fs.statSync(p).size };
    uniqueSet.add(h);
  }
  if (uniqueSet.size !== expectedShots.length) {
    throw new Error(`Duplicate screenshot hashes detected (${uniqueSet.size}/${expectedShots.length})!`);
  }
  fs.writeFileSync(path.join(evidenceDir, 'image_hashes.json'), JSON.stringify(imageHashes, null, 2), 'utf8');

  t4Passed = true;
} catch (e) {
  t4Error = e.message;
}
recordTest('test_zero_fatal_crashes_and_distinct_evidence', (Date.now() - t4Start) / 1000, t4Passed, t4Error);

// Write JUnit XML
const totalTime = testResults.reduce((s, t) => s + t.durationSec, 0);
const failuresCount = testResults.filter(t => !t.passed).length;
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites tests="${testResults.length}" failures="${failuresCount}" time="${totalTime.toFixed(2)}">\n  <testsuite name="v1.0.373.AndroidEmulatorVerification" tests="${testResults.length}" failures="${failuresCount}" time="${totalTime.toFixed(2)}">\n`;
for (const t of testResults) {
  xml += `    <testcase classname="v1.0.373.AndroidEmulatorVerification" name="${t.name}" time="${t.durationSec.toFixed(2)}">\n`;
  if (!t.passed) xml += `      <failure message="${t.failureMsg.replace(/"/g, '&quot;')}">${t.failureMsg}</failure>\n`;
  xml += `    </testcase>\n`;
}
xml += `  </testsuite>\n</testsuites>\n`;
fs.writeFileSync(path.join(evidenceDir, 'test-results.xml'), xml, 'utf8');

try {
  child.execSync(`cd "${evidenceDir}" && zip -r "../android_emulator_v373_evidence.zip" ./*`, { timeout: 30000 });
} catch (_) {}

console.log(`\nSUMMARY: ${testResults.length - failuresCount}/${testResults.length} Emulator Verification Suites Passed.`);
if (failuresCount > 0) process.exit(1);
process.exit(0);
