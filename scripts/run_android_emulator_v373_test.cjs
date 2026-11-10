/**
 * run_android_emulator_v373_test.cjs
 * Official Android Emulator Automated Runtime & Upgrade Verification Suite for v1.0.373
 * Tests BOTH required tracks on a live Android API 33 KVM Emulator:
 *   1. Track A (Clean Install): Fresh install of v1.0.373 APK -> confirms bible_study_v373.db
 *      (363,438,080 bytes from 70 parts) opens cleanly with ZERO AssetNotFoundException,
 *      and Zechariah 4:6 Word Study Cards render Bet prefix ("باء الجر والظرفية") on
 *      H2428 ("بِالْقُدْرَةِ"), H3581 ("بِالْقُوَّةِ"), H7307 ("بِرُوحِي") and Construct state
 *      ("حالة الإضافة العبرية (Construct)") on H1697 ("كَلِمَةُ") & H7307 ("بِرُوحِي").
 *   2. Track B (Upgrade from v372): Installs v1.0.372 baseline, seeds user preferences
 *      (dark mode, search history, db_version=372), performs in-place upgrade via
 *      `adb install -r v373_candidate.apk` without wiping data, verifies bible_study_v373.db
 *      opens cleanly, bible_study_v372.db is deleted, 100% user prefs/history are preserved,
 *      and Zechariah 4:6 cards display Bet prefix and Construct state in live UI.
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

function runOcr(imagePath, fastSinglePass = false) {
  try {
    let combined = '';
    try {
      combined += child.execSync(`tesseract "${imagePath}" stdout -l eng+ara`, {
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim() + ' ';
    } catch (_) {}

    if (!fastSinglePass) {
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
    }

    return combined.trim();
  } catch (err) {
    console.warn(`OCR warning on ${imagePath}:`, err.message);
    return '';
  }
}

/**
 * Finds exact pixel Y coordinates of target Strong's codes on WordStudyScreen using Tesseract TSV.
 */
function findTargetRowYsFromTsv(imagePath, targetCodes, H) {
  const found = {}; // code -> [tapY, ...]
  const imagesToScan = [imagePath];
  const inverted = imagePath.replace(/\.png$/i, '_tsv_neg.png');
  try {
    child.execSync(`ffmpeg -y -i "${imagePath}" -vf "negate" "${inverted}"`, {
      stdio: 'ignore',
      timeout: 15000
    });
    if (fs.existsSync(inverted)) imagesToScan.push(inverted);
  } catch (_) {}

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

          for (const code of targetCodes) {
            const digits = code.replace(/^H/, '');
            if (rawText.includes(digits)) {
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
console.log('  ANDROID EMULATOR VERIFICATION SUITE v1.0.373 (CLEAN INSTALL & UPGRADE)');
console.log('========================================================================\n');

const evidenceDir = path.resolve(process.cwd(), 'emulator_evidence_v373');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

const testResults = [];
function recordTest(name, durationSec, passed, failureMsg = '') {
  const cleanMsg = String(failureMsg || '').replace(/\r?\n/g, ' | ');
  testResults.push({ name, durationSec, passed, failureMsg: cleanMsg });
  if (passed) {
    console.log(`[PASS] ${name} (${durationSec.toFixed(1)}s)`);
    console.log(`::notice::PASS ${name} (${durationSec.toFixed(1)}s)`);
  } else {
    console.error(`[FAIL] ${name} (${durationSec.toFixed(1)}s): ${cleanMsg}`);
    console.log(`::error::FAIL ${name}: ${cleanMsg.slice(0, 500)}`);
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
  return (
    ocr.includes('المدخل المعجمي') ||
    ocr.includes('الرمز القياسي') ||
    ocr.includes('نطق آلي') ||
    ocr.includes('عرض المعجم') ||
    ocr.includes('المعنى المعجمي') ||
    ocr.includes('التحليل النحوي')
  );
}

function hasBetPrefixOcr(ocr) {
  return (
    ocr.includes('باء الجر') ||
    ocr.includes('والظرفية') ||
    ocr.includes('الحروف والزوائد') ||
    /باء\s*الجر/.test(ocr)
  );
}

function hasConstructOcr(ocr) {
  return (
    ocr.includes('Construct') ||
    ocr.includes('construct') ||
    ocr.includes('الإضافة العبرية') ||
    ocr.includes('حالة الإضافة')
  );
}

/**
 * Navigates Search('38 4 6') -> Zechariah 4:6 Reader -> WordStudyScreen
 * Uses TSV Strong's coordinate targeting + dense fallback to open & verify:
 *   - H1697 ("كَلِمَةُ"): Construct state
 *   - H2428 ("بِالْقُدْرَةِ"): Bet prefix
 *   - H3581 ("بِالْقُوَّةِ"): Bet prefix
 *   - H7307 ("بِرُوحِي"): Bet prefix + Construct state
 */
function openZech46CardsAndVerify(prefixLabel) {
  execAdb('shell am force-stop com.arabicbible.study');
  sleep(1500);
  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  sleep(3500);

  // Use space-separated book chapter verse reference supported by SearchScreen
  executeSearch('38 4 6');

  const searchResSnap = captureAndOcr(`${prefixLabel}_search_zech46_results.png`, `/sdcard/${prefixLabel}_search_zech46_results.png`);
  console.log('Search 38 4 6 OCR sample:', searchResSnap.ocr.slice(0, 300).replace(/\n/g, ' | '));
  if (!searchResSnap.ocr.includes('زربابل') && !searchResSnap.ocr.includes('زكريا') && !searchResSnap.ocr.includes('نتيجة') && !searchResSnap.ocr.includes('بالقدرة')) {
    console.log('Retrying Search submit button tap at', searchBtnX, searchBtnY);
    execAdb(`shell input tap ${searchBtnX} ${searchBtnY}`);
    sleep(2500);
    const retrySnap = captureAndOcr(`${prefixLabel}_search_zech46_results.png`, `/sdcard/${prefixLabel}_search_zech46_results.png`);
    if (!retrySnap.ocr.includes('زربابل') && !retrySnap.ocr.includes('زكريا') && !retrySnap.ocr.includes('نتيجة') && !retrySnap.ocr.includes('بالقدرة')) {
      throw new Error(`Search '38 4 6' did not return Zechariah 4:6 result card! OCR: "${retrySnap.ocr.replace(/\r?\n/g, ' | ').slice(0, 320)}"`);
    }
  }

  const cardTapOffsets = [0.36, 0.42, 0.48, 0.30, 0.54, 0.60];
  let enteredReader = false;
  for (const yRatio of cardTapOffsets) {
    console.log(`Tapping Zechariah 4:6 result card at (${Math.round(W * 0.50)}, ${Math.round(H * yRatio)})...`);
    execAdb(`shell input tap ${Math.round(W * 0.50)} ${Math.round(H * yRatio)}`);
    sleep(4000);

    const check = captureAndOcr('reader_entry_check.png', '/sdcard/reader_entry_check.png');
    if (isModalOpenOcr(check.ocr)) {
      execAdb('shell input keyevent 4');
      sleep(1200);
      continue;
    }
    const isReaderScreen =
      (check.ocr.includes('التالي') || check.ocr.includes('السابق')) &&
      !check.ocr.includes('نتائج') &&
      !check.ocr.includes('وجدنا') &&
      !check.ocr.includes('اقتراحات');
    if (isReaderScreen) {
      enteredReader = true;
      console.log('Entered Zechariah 4 ChapterReaderScreen successfully!');
      break;
    }
  }

  if (!enteredReader) {
    throw new Error('Could not navigate to Zechariah 4:6 in ChapterReaderScreen from 38 4 6 search.');
  }

  // ChapterReaderScreen aligns target verse with alignment: 0.15 -> ~0.23..0.35 * H
  const verseTapOffsets = [0.26, 0.31, 0.22, 0.36, 0.42, 0.48, 0.54];
  let enteredWordStudy = false;
  for (const yRatio of verseTapOffsets) {
    console.log(`Tapping Verse 6 card at (${Math.round(W * 0.60)}, ${Math.round(H * yRatio)}) to open WordStudyScreen...`);
    execAdb(`shell input tap ${Math.round(W * 0.60)} ${Math.round(H * yRatio)}`);
    sleep(3500);

    const wsCheck = captureAndOcr('wordstudy_entry_check.png', '/sdcard/wordstudy_entry_check.png');
    const isWordStudy = wsCheck.ocr.includes('الأصل المعجمي') || wsCheck.ocr.includes('سترونج والنطق') || wsCheck.ocr.includes('الرمز المعجمي') || wsCheck.ocr.includes('دراسة');
    if (isWordStudy) {
      const isZech46 =
        wsCheck.ocr.includes('الآية 6') ||
        wsCheck.ocr.includes('بالقدرة') ||
        wsCheck.ocr.includes('زربابل') ||
        wsCheck.ocr.includes('بروحي') ||
        wsCheck.ocr.includes('الجنود');
      if (isZech46) {
        enteredWordStudy = true;
        console.log('Confirmed WordStudyScreen for Zechariah 4:6 is open!');
        break;
      }
      console.log(`Opened WordStudyScreen for wrong verse (OCR: ${wsCheck.ocr.slice(0, 120).replace(/\n/g, ' ')}), pressing Back...`);
      execAdb('shell input keyevent 4');
      sleep(1200);
    }
  }

  if (!enteredWordStudy) {
    throw new Error('Could not open WordStudyScreen for Zechariah 4:6 (Verse 6).');
  }

  const captured = {};

  function inspectOpenedModal(modalCheck) {
    const o = modalCheck.ocr;
    console.log(`[MODAL OCR SAMPLE]: ${o.slice(0, 200).replace(/\n/g, ' ')}`);

    // Match STRICTLY by Strong's code or unambiguous morphology code (never common Arabic substrings)
    let targetKey = null;
    if (!captured.H1697 && (o.includes('1697') || o.includes('Ncmsc')) && !o.includes('2428') && !o.includes('3581') && !o.includes('7307') && !o.includes('6030') && !o.includes('559')) {
      targetKey = 'H1697';
    } else if (!captured.H2428 && o.includes('2428') && !o.includes('3581') && !o.includes('7307') && !o.includes('1697')) {
      targetKey = 'H2428';
    } else if (!captured.H3581 && o.includes('3581') && !o.includes('2428') && !o.includes('7307') && !o.includes('1697')) {
      targetKey = 'H3581';
    } else if (!captured.H7307 && (o.includes('7307') || o.includes('Ncbsc')) && !o.includes('2428') && !o.includes('3581') && !o.includes('1697')) {
      targetKey = 'H7307';
    }

    if (!targetKey) {
      return false;
    }

    console.log(`Target card ${targetKey} opened! Verifying Morphology Card UI rows...`);
    const shotMap = {
      H1697: `${prefixLabel}_zech_h1697_construct_card.png`,
      H2428: `${prefixLabel}_zech_h2428_bet_card.png`,
      H3581: `${prefixLabel}_zech_h3581_bet_card.png`,
      H7307: `${prefixLabel}_zech_h7307_bet_construct_card.png`,
    };
    const shotName = shotMap[targetKey];

    // Capture full dual-pass OCR right away before any modal scroll
    let snap = captureAndOcr(shotName, `/sdcard/${shotName}`, false);

    const needsScroll = () => {
      if (targetKey === 'H1697') return !hasConstructOcr(snap.ocr);
      if (targetKey === 'H2428' || targetKey === 'H3581') return !hasBetPrefixOcr(snap.ocr);
      return !(hasBetPrefixOcr(snap.ocr) && hasConstructOcr(snap.ocr));
    };

    if (needsScroll()) {
      // Gentle swipe inside single-Strong's modal so Morphology table centers cleanly without overshooting
      execAdb(`shell input swipe ${Math.round(W * 0.50)} ${Math.round(H * 0.68)} ${Math.round(W * 0.50)} ${Math.round(H * 0.46)} 320`);
      sleep(1400);
      snap = captureAndOcr(shotName, `/sdcard/${shotName}`, false);
      if (needsScroll()) {
        execAdb(`shell input swipe ${Math.round(W * 0.50)} ${Math.round(H * 0.68)} ${Math.round(W * 0.50)} ${Math.round(H * 0.46)} 320`);
        sleep(1400);
        snap = captureAndOcr(shotName, `/sdcard/${shotName}`, false);
      }
    }

    fs.writeFileSync(path.join(evidenceDir, shotName.replace('.png', '_ocr.txt')), snap.ocr, 'utf8');
    console.log(`${shotName} OCR sample:`, snap.ocr.slice(0, 420).replace(/\n/g, ' '));

    const betOk = hasBetPrefixOcr(snap.ocr);
    const constructOk = hasConstructOcr(snap.ocr);
    console.log(`${targetKey} Card Assertions: betOk=${betOk}, constructOk=${constructOk}`);

    if (targetKey === 'H1697' && !constructOk) {
      throw new Error(`Expected Construct state not visible on H1697 ("كَلِمَةُ") card! OCR: "${snap.ocr.slice(0, 350)}"`);
    }
    if ((targetKey === 'H2428' || targetKey === 'H3581') && !betOk) {
      throw new Error(`Expected Bet prefix ("باء الجر والظرفية") not visible on ${targetKey} card! OCR: "${snap.ocr.slice(0, 350)}"`);
    }
    if (targetKey === 'H7307' && (!betOk || !constructOk)) {
      throw new Error(`Expected BOTH Bet prefix and Construct state on H7307 ("بِرُوحِي") card! betOk=${betOk}, constructOk=${constructOk}`);
    }

    captured[targetKey] = shotName;
    return true;
  }

  function ensureBackOnWordStudy() {
    for (let i = 0; i < 2; i++) {
      execAdb('shell input keyevent 4');
      sleep(900);
      const chk = captureAndOcr('back_check.png', '/sdcard/back_check.png', true);
      if (!isModalOpenOcr(chk.ocr)) break;
    }
  }

  // Scan WordStudyScreen top-to-bottom in small overlapping swipes using TSV Strong's targeting
  const requiredKeys = ['H1697', 'H2428', 'H3581', 'H7307'];
  for (let pass = 0; pass < 7; pass++) {
    const remaining = requiredKeys.filter(k => !captured[k]);
    if (remaining.length === 0) break;

    if (pass > 0) {
      console.log(`Scrolling down in WordStudyScreen (pass ${pass}, remaining: ${remaining.join(', ')})...`);
      execAdb(`shell input swipe ${Math.round(W * 0.50)} ${Math.round(H * 0.72)} ${Math.round(W * 0.50)} ${Math.round(H * 0.42)} 350`);
      sleep(1200);
    }

    const scanPath = path.join(evidenceDir, `ws_pass_${pass}.png`);
    execAdb('shell screencap -p /sdcard/ws_pass.png');
    execAdb(`pull /sdcard/ws_pass.png "${scanPath}"`);

    const tsvHits = findTargetRowYsFromTsv(scanPath, remaining, H);
    console.log(`TSV hits on pass ${pass}:`, JSON.stringify(tsvHits));

    for (const key of remaining) {
      const ys = tsvHits[key] || [];
      for (const yPx of ys) {
        if (captured[key]) break;
        console.log(`Tapping TSV coordinate for ${key} at (${Math.round(W * 0.50)}, ${yPx})...`);
        execAdb(`shell input tap ${Math.round(W * 0.50)} ${yPx}`);
        sleep(2000);
        const modalCheck = captureAndOcr('modal_check.png', '/sdcard/modal_check.png', true);
        if (isModalOpenOcr(modalCheck.ocr)) {
          inspectOpenedModal(modalCheck);
          ensureBackOnWordStudy();
        }
      }
    }
  }

  // Fallback sweep if any card still missed by TSV
  const stillMissing = requiredKeys.filter(k => !captured[k]);
  if (stillMissing.length > 0) {
    console.log(`Fallback dense sweep for missing keys: ${stillMissing.join(', ')}...`);
    // Scroll back to top if H1697 missing, otherwise scan from current/middle
    if (stillMissing.includes('H1697')) {
      for (let up = 0; up < 4; up++) {
        execAdb(`shell input swipe ${Math.round(W * 0.50)} ${Math.round(H * 0.35)} ${Math.round(W * 0.50)} ${Math.round(H * 0.80)} 300`);
        sleep(800);
      }
    }
    const denseOffsets = [0.24, 0.30, 0.36, 0.42, 0.48, 0.54, 0.60, 0.66, 0.72, 0.78, 0.84];
    for (let s = 0; s < 5; s++) {
      if (requiredKeys.every(k => captured[k])) break;
      if (s > 0) {
        execAdb(`shell input swipe ${Math.round(W * 0.50)} ${Math.round(H * 0.74)} ${Math.round(W * 0.50)} ${Math.round(H * 0.44)} 350`);
        sleep(1100);
      }
      for (const yRatio of denseOffsets) {
        if (requiredKeys.every(k => captured[k])) break;
        execAdb(`shell input tap ${Math.round(W * 0.50)} ${Math.round(H * yRatio)}`);
        sleep(1800);
        const modalCheck = captureAndOcr('modal_check.png', '/sdcard/modal_check.png', true);
        if (isModalOpenOcr(modalCheck.ocr)) {
          inspectOpenedModal(modalCheck);
          ensureBackOnWordStudy();
        }
      }
    }
  }

  for (const reqKey of requiredKeys) {
    if (!captured[reqKey]) {
      throw new Error(`Did not capture and verify Zechariah 4:6 card ${reqKey}. Captured: ${JSON.stringify(captured)}`);
    }
  }
  return captured;
}

// ============================================================================
// TRACK 1: CLEAN INSTALL OF v1.0.373
// ============================================================================
console.log('--- TRACK 1: CLEAN INSTALL OF v1.0.373 ---');
const t1Start = Date.now();
let t1Passed = false;
let t1Error = '';
let cleanShots = {};

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
  console.log(`Clean install physical DB size on Android device: ${bytesClean} bytes (base 363438080 + sqflite open overhead)`);
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

  cleanShots = openZech46CardsAndVerify('clean_install');
  t1Passed = true;
} catch (e) {
  t1Error = e.message;
}
recordTest('test_clean_install_v373_opens_db_and_renders_zech46_bet_and_construct_cards', (Date.now() - t1Start) / 1000, t1Passed, t1Error);

// ============================================================================
// TRACK 2: ACTUAL UPGRADE FROM v1.0.372 TO v1.0.373
// ============================================================================
console.log('\n--- TRACK 2: UPGRADE FROM v1.0.372 TO v1.0.373 ---');
const t2Start = Date.now();
let t2Passed = false;
let t2Error = '';
let upgradeShots = {};

try {
  execAdb('logcat -c');
  execAdb('uninstall com.arabicbible.study', { ignoreError: true });
  sleep(1500);

  const inst372 = execAdb('install v372_baseline.apk', { timeout: 90000 });
  console.log('Baseline v372 install result:', inst372);
  if (!inst372.toLowerCase().includes('success')) {
    throw new Error(`Baseline v372 install failed: ${inst372}`);
  }

  // Seed user state in v372 SharedPreferences BEFORE launching
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

  // Launch v372 to initialize bible_study_v372.db
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

  // Execute an organic search in baseline v372 UI before upgrade
  console.log('Performing organic search in baseline v372 UI...');
  executeSearch('G561');
  sleep(1500);
  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  sleep(1500);

  // Force-stop to flush prefs and verify v372 state on device
  execAdb('shell am force-stop com.arabicbible.study');
  sleep(2000);

  const prefsBefore = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  fs.writeFileSync(path.join(evidenceDir, 'prefs_before_upgrade.xml'), prefsBefore, 'utf8');
  console.log('Captured prefs_before_upgrade.xml:\n', prefsBefore);

  const db372Check = execAdb('shell ls -l /data/data/com.arabicbible.study/databases/bible_study_v372.db');
  console.log('Verified baseline bible_study_v372.db exists:', db372Check);

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

  // Verify v372 legacy DB was deleted and v373 DB is open & exact size
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

  // Verify user preferences 100% intact
  const prefsAfter = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  fs.writeFileSync(path.join(evidenceDir, 'prefs_after_upgrade.xml'), prefsAfter, 'utf8');
  console.log('Captured prefs_after_upgrade.xml:\n', prefsAfter);

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
  console.log('Upgrade Search History UI OCR sample:', searchUiSnap.ocr.slice(0, 250).replace(/\n/g, ' '));
  fs.writeFileSync(path.join(evidenceDir, 'upgrade_search_history_ocr.txt'), searchUiSnap.ocr, 'utf8');

  upgradeShots = openZech46CardsAndVerify('upgrade');
  t2Passed = true;
} catch (e) {
  t2Error = e.message;
}
recordTest('test_upgrade_v372_to_v373_retains_user_data_and_renders_zech46_bet_and_construct_cards', (Date.now() - t2Start) / 1000, t2Passed, t2Error);

// ============================================================================
// TRACK 3: LOGCAT CLEANLINESS, SCREENSHOT UNIQUENESS & EVIDENCE BUNDLE
// ============================================================================
console.log('\n--- TRACK 3: LOGCAT CLEANLINESS & EVIDENCE PACKAGING ---');
const t3Start = Date.now();
let t3Passed = false;
let t3Error = '';

try {
  const finalLogcatPath = path.join(evidenceDir, 'final_logcat.txt');
  execAdb('shell "logcat -d > /sdcard/final_logcat_v373.txt"');
  execAdb(`pull /sdcard/final_logcat_v373.txt "${finalLogcatPath}"`);
  const finalLogcat = fs.readFileSync(finalLogcatPath, 'utf8');

  if (finalLogcat.includes('FATAL EXCEPTION: main') || finalLogcat.includes('AndroidRuntime: FATAL') || finalLogcat.includes('AssetNotFoundException')) {
    throw new Error('Fatal crash or AssetNotFoundException found in final_logcat.txt!');
  }

  const shotNames = [
    ...Object.values(cleanShots),
    'upgrade_search_history.png',
    ...Object.values(upgradeShots),
  ];
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
  if (shotNames.length < 9 || uniqueSet.size !== shotNames.length) {
    throw new Error(`Expected 9 distinct screenshots, got ${uniqueSet.size}/${shotNames.length}!`);
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
