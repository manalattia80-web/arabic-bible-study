/**
 * run_android_emulator_v375_test.cjs
 * Official Android Emulator Verification Suite for Release v1.0.375
 * Cleanly separates:
 *   Suite 1 (Clean Install): Fresh install of published v1.0.375 APK -> verifies bible_study_v375.db
 *     (363,433,984 bytes from 70 parts), zero AssetNotFoundException, opens Ezra 5:8.
 *   Suite 2 (Direct Ezra 5:8 Cards Verification on v1.0.375 Package in Light Mode):
 *     Opens 4 target cards in Ezra 5:8 WordStudyScreen cleanly:
 *       - H3046 ("مَعْلُومًا"): Peil passive participle ("Peil", "اسم مفعول" / "Passive Participle", NEVER Hebrew stem label)
 *       - H1005 ("بَيْتِ"): Construct state ("الإضافة الآرامية" / "Construct" — NEVER "الإضافة العبرية")
 *       - H69   ("بِحِجَارَةٍ"): Construct state ("الإضافة الآرامية" / "Construct" — NEVER "الإضافة العبرية") AND NO Bet prefix
 *       - H3028 ("أَيْدِيهِمْ"): BOTH Aramaic Bet prefix VALUE ("باء الجر" / "الظرفية") AND Construct ("الإضافة الآرامية", NEVER "الإضافة العبرية")
 *   Suite 3 (Actual Upgrade v374 -> v375): Installs v1.0.374 baseline, seeds user prefs/history
 *     (is_dark_mode=true, db_version=374, recent_search_queries), upgrades in-place via
 *     `adb install -r v375_candidate.apk`, verifies bible_study_v374.db deleted, bible_study_v375.db
 *     opened cleanly, 100% user prefs & dark mode preserved, opens Ezra 5:8 post-upgrade.
 *   Suite 4 (Logcat Cleanliness & Distinct 7-Screenshot Evidence Packaging).
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
        child.execSync(`ffmpeg -y -i "${imagePath}" -vf "format=gray,negate,eq=contrast=1.6" "${inverted}"`, {
          stdio: 'ignore',
          timeout: 15000
        });
        if (fs.existsSync(inverted)) targetImg = inverted;
      } catch (_) {}
    }
    let out = '';
    for (const psm of ['3', '6']) {
      try {
        out += child.execSync(`tesseract "${targetImg}" stdout -l eng --psm ${psm}`, {
          encoding: 'utf8',
          timeout: 20000,
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim() + ' ';
      } catch (_) {}
    }
    if (isDark) {
      try { if (fs.existsSync(inverted)) fs.unlinkSync(inverted); } catch (_) {}
    }
    return out.trim();
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
        child.execSync(`ffmpeg -y -i "${imagePath}" -vf "format=gray,negate,eq=contrast=1.5" "${inverted}"`, {
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
    child.execSync(`ffmpeg -y -i "${imagePath}" -vf "format=gray,negate,eq=contrast=1.5" "${inverted}"`, {
      stdio: 'ignore',
      timeout: 15000
    });
    if (fs.existsSync(inverted)) imagesToScan.push(inverted);
  } catch (_) {}

  const tsvAliases = {
    H3046: ['3046', 'yeda'],
    H1005: ['1005', 'bayith', 'bayit'],
    H69:   ['h69', 'eben'],
    H3028: ['3028', 'yad'],
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
            if (code === 'H69') {
              if (rawText === '69' || rawText === 'H69' || lower.includes('eben')) {
                if (!found[code]) found[code] = [];
                if (!found[code].some(existingY => Math.abs(existingY - tapY) < 40)) {
                  found[code].push(tapY);
                }
              }
            } else if ((tsvAliases[code] || [code.replace(/^H/, '')]).some(a => lower.includes(a))) {
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
console.log('  ANDROID EMULATOR VERIFICATION SUITE v1.0.375 (EZRA 5:8 ARAMAIC UI)');
console.log('========================================================================\n');

const evidenceDir = path.resolve(process.cwd(), 'emulator_evidence_v375');
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

execAdb('root', { ignoreError: true });
sleep(2000);

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
      ocr.includes('15 5 8')
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
      if (i > 0) execAdb('shell input keyevent 62');
      if (parts[i].length > 0) execAdb(`shell input text "${parts[i]}"`);
    }
  } else {
    execAdb(`shell input text "${queryText}"`);
  }
  sleep(800);
  execAdb('shell input keyevent 66');
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
    /\b(Noun|Verb|Preposition|Conjunction|Pronoun|Particle|Adjective|Masculine|Feminine|Singular|Plural|Construct|Absolute|Hebrew|Aramaic|Peil|Peal|Hithpeel|Aphel|yeda|bayith|eben|yad)\b/i.test(ocr)
  );
}

function hasBetPrefixValueOcr(ocr) {
  return (
    ocr.includes('باء الجر') ||
    ocr.includes('والظرفية') ||
    ocr.includes('الظرفية') ||
    /باء\s*الجر/.test(ocr)
  );
}

function hasAramaicConstructValueOcr(ocr) {
  return (
    ocr.includes('الإضافة الآرامية') ||
    (/Construct/i.test(ocr) && (ocr.includes('الآرامية') || ocr.includes('آرامية')))
  );
}

function hasForbiddenHebrewConstructOcr(ocr) {
  return ocr.includes('الإضافة العبرية');
}

function hasPeilPassiveOcr(ocr) {
  const hasPeil = /\bPe[il1t]{2,3}\b/i.test(ocr) || ocr.includes('بَعِيل') || ocr.includes('بعيل') || /[بت]عيل/.test(ocr) || ocr.includes('الآرامي المجهول');
  const hasPassive = /\bPassive\b/i.test(ocr) || ocr.includes('المجهول') || /م[فقع]عول/.test(ocr) || /Passive\s*Participle/i.test(ocr);
  const hasArStemLabel = !ocr.includes('الوزن الصرفي العبري') && (ocr.includes('الوزن الصرفي الآرامي') || /ال[آأا]رامي|آرامي|الأنامي/.test(ocr));
  return hasPeil && hasPassive && hasArStemLabel;
}

function navigateToEzra58WordStudyScreen(prefixLabel) {
  execAdb('shell am force-stop com.arabicbible.study');
  sleep(1500);
  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  sleep(3500);

  executeSearch('15 5 8');

  const searchResSnap = captureAndOcr(`${prefixLabel}_search_ezra58_results.png`, `/sdcard/${prefixLabel}_search_ezra58_results.png`);
  console.log('Search 15 5 8 OCR sample:', searchResSnap.ocr.slice(0, 300).replace(/\n/g, ' | '));
  const hasSearchResult = (o) =>
    o.includes('15 5 8') ||
    o.includes('وجدنا 1') ||
    o.includes('الإصحاح 5') ||
    o.includes('الآية 8') ||
    o.includes('في القارئ') ||
    o.includes('عزرا') ||
    o.includes('يهوذا');
  if (!hasSearchResult(searchResSnap.ocr)) {
    execAdb(`shell input tap ${searchBtnX} ${searchBtnY}`);
    sleep(2500);
    const retrySnap = captureAndOcr(`${prefixLabel}_search_ezra58_results.png`, `/sdcard/${prefixLabel}_search_ezra58_results.png`);
    if (!hasSearchResult(retrySnap.ocr)) {
      throw new Error(`Search '15 5 8' did not return Ezra 5:8 result card! OCR: "${retrySnap.ocr.replace(/\r?\n/g, ' | ').slice(0, 320)}"`);
    }
  }

  const cardTapOffsets = [0.34, 0.38, 0.42, 0.30, 0.46, 0.52];
  let enteredReader = false;
  let lastReaderCheckOcr = '';
  for (const yRatio of cardTapOffsets) {
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
      break;
    }
    const isReaderScreen =
      (check.ocr.includes('التالي') || check.ocr.includes('السابق') || check.ocr.includes('الإصحاح 5') || check.ocr.includes('عزرا')) &&
      !check.ocr.includes('نتائج') &&
      !check.ocr.includes('وجدنا') &&
      !check.ocr.includes('اقتراحات') &&
      !check.ocr.includes('الأصل المعجمي') &&
      !check.ocr.includes('سترونج والنطق');
    if (isReaderScreen) {
      enteredReader = true;
      break;
    }
  }

  if (!enteredReader) {
    throw new Error(`Could not navigate to Ezra 5:8 in ChapterReaderScreen from 15 5 8 search. Last OCR: "${lastReaderCheckOcr.replace(/\r?\n/g, ' | ').slice(0, 280)}"`);
  }

  const verseTapOffsets = [0.24, 0.28, 0.32, 0.20, 0.36, 0.42, 0.48];
  let enteredWordStudy = false;
  let lastWsCheckOcr = '';
  const wsShotName = `${prefixLabel}_ezra58_wordstudy.png`;
  for (const yRatio of verseTapOffsets) {
    execAdb(`shell input tap ${Math.round(W * 0.60)} ${Math.round(H * yRatio)}`);
    sleep(3500);

    const wsCheck = captureAndOcr(wsShotName, `/sdcard/${wsShotName}`);
    lastWsCheckOcr = wsCheck.ocr;
    const isWordStudy = wsCheck.ocr.includes('الأصل المعجمي') || wsCheck.ocr.includes('سترونج والنطق') || wsCheck.ocr.includes('الرمز المعجمي') || wsCheck.ocr.includes('دراسة');
    if (isWordStudy) {
      const isEzra58 =
        wsCheck.ocr.includes('الآية 8') ||
        wsCheck.ocr.includes('الآية ٨') ||
        (/عزرا.*الإصحاح\s*5/.test(wsCheck.ocr) && /\b8\b/.test(wsCheck.ocr)) ||
        (/الإصحاح\s*5.*الآية/.test(wsCheck.ocr) && /\b8\b/.test(wsCheck.ocr)) ||
        wsCheck.ocr.includes('29 كلمة') ||
        wsCheck.ocr.includes('1934') ||
        wsCheck.ocr.includes('3046') ||
        wsCheck.ocr.includes('1005');
      if (isEzra58) {
        enteredWordStudy = true;
        console.log('Confirmed WordStudyScreen for Ezra 5:8 is open!');
        break;
      }
      execAdb('shell input keyevent 4');
      sleep(1200);
    }
  }

  if (!enteredWordStudy) {
    throw new Error(`Could not open WordStudyScreen for Ezra 5:8 (Verse 8). Last OCR: "${lastWsCheckOcr.replace(/\r?\n/g, ' | ').slice(0, 280)}"`);
  }
  return wsShotName;
}

// ============================================================================
// SUITE 1: CLEAN INSTALL OF v1.0.375
// ============================================================================
console.log('--- SUITE 1: CLEAN INSTALL OF v1.0.375 ---');
const t1Start = Date.now();
let t1Passed = false;
let t1Error = '';

try {
  execAdb('logcat -c');
  execAdb('uninstall com.arabicbible.study', { ignoreError: true });
  sleep(1500);

  const instRes = execAdb('install v375_candidate.apk', { timeout: 90000 });
  console.log('Clean install result:', instRes);
  if (!instRes.toLowerCase().includes('success')) {
    throw new Error(`Clean install failed: ${instRes}`);
  }

  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  console.log('Waiting for v1.0.375 initial DB extraction (70 parts)...');

  let cleanMigrated = false;
  for (let poll = 0; poll < 45; poll++) {
    sleep(1500);
    const prefsXml = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml', { ignoreError: true });
    if (prefsXml.includes('name="flutter.db_version" value="375"')) {
      cleanMigrated = true;
      console.log(`Clean install DB v375 confirmed ready on disk at ${(poll + 1) * 1.5}s!`);
      break;
    }
  }
  if (!cleanMigrated) {
    throw new Error('Timed out waiting for clean install to write db_version = 375!');
  }

  const dbPathClean = '/data/data/com.arabicbible.study/databases/bible_study_v375.db';
  const statOutClean = execAdb(`shell stat -c %s ${dbPathClean}`);
  const bytesClean = parseInt(statOutClean.trim(), 10);
  if (isNaN(bytesClean) || bytesClean < 363400000 || bytesClean > 363500000) {
    throw new Error(`Unexpected DB size on clean install: ${bytesClean} (expected ~363433984)`);
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

  navigateToEzra58WordStudyScreen('clean_install');
  t1Passed = true;
} catch (e) {
  t1Error = e.message;
}
recordTest('test_clean_install_v375_opens_db_and_reaches_ezra58', (Date.now() - t1Start) / 1000, t1Passed, t1Error);

// ============================================================================
// SUITE 2: DIRECT EZRA 5:8 ARAMAIC CARDS VERIFICATION ON v1.0.375 (LIGHT MODE)
// ============================================================================
console.log('\n--- SUITE 2: DIRECT EZRA 5:8 ARAMAIC CARDS ON v1.0.375 ---');

const cardTargets = {
  H3046: { testName: 'test_ezra58_card_H3046_peil_passive', shotName: 'ezra58_h3046_peil_card.png', expectPeil: true, expectBet: false, expectAramaicConstruct: false },
  H1005: { testName: 'test_ezra58_card_H1005_aramaic_construct', shotName: 'ezra58_h1005_construct_card.png', expectPeil: false, expectBet: false, expectAramaicConstruct: true },
  H69:   { testName: 'test_ezra58_card_H69_aramaic_construct_no_bet', shotName: 'ezra58_h69_construct_card.png', expectPeil: false, expectBet: false, expectForbidBet: true, expectAramaicConstruct: true },
  H3028: { testName: 'test_ezra58_card_H3028_bet_and_aramaic_construct', shotName: 'ezra58_h3028_bet_construct_card.png', expectPeil: false, expectBet: true, expectAramaicConstruct: true },
};

const cardResults = {};
const seenModalSnippets = [];
const suite2Start = Date.now();

try {
  if (!t1Passed) {
    navigateToEzra58WordStudyScreen('clean_install');
  }

  function captureFastEngModal() {
    const localPath = path.join(evidenceDir, 'modal_fast.png');
    execAdb('shell screencap -p /sdcard/modal_fast.png');
    execAdb(`pull /sdcard/modal_fast.png "${localPath}"`);
    return { localPath, ocr: runFastEngOcr(localPath, false) };
  }

  function ensureBackOnWordStudy() {
    for (let i = 0; i < 2; i++) {
      execAdb('shell input keyevent 4');
      sleep(750);
      const localPath = path.join(evidenceDir, 'back_check.png');
      execAdb('shell screencap -p /sdcard/back_check.png');
      execAdb(`pull /sdcard/back_check.png "${localPath}"`);
      const chkAraEng = runOcr(localPath, true);
      if (chkAraEng.includes('اضغط على الرمز') || chkAraEng.includes('سترونج والنطق') || chkAraEng.includes('الأصل المعجمي') || !isModalOpenOcr(chkAraEng)) {
        break;
      }
    }
  }

  function detectTargetFromText(o) {
    const hasYeda   = /\by[eé]d[aâ]\b/i.test(o) || /\bAVQsmsa\b/i.test(o);
    const hasBayith = /\bbayith\b|\bbayit\b/i.test(o) || /\bAR\/Ncmsc\b/i.test(o);
    const hasEben   = /\b[eé]?ben\b/i.test(o) || /\bANcfsc\b/i.test(o) || /\bH69\b/.test(o);
    const hasYad    = /\byad\b/i.test(o) || /\bSp3mp\b/i.test(o);

    if (!cardResults.H3046 && (/\bH?3046\b/.test(o) || hasYeda) && !/\b(1005|3028)\b/.test(o)) return 'H3046';
    if (!cardResults.H1005 && (/\bH?1005\b/.test(o) || hasBayith) && !/\b(3046|3028)\b/.test(o)) return 'H1005';
    if (!cardResults.H69 && (/\bH69\b/.test(o) || hasEben) && !/\b(3046|1005|3028|1934|4430|1768|4083|3061|7229|1932|1124|1560|7761|3797|1791|5673|5648|6744)\b/.test(o)) return 'H69';
    if (!cardResults.H3028 && (/\bH?3028\b/.test(o) || hasYad) && !/\b(3046|1005)\b/.test(o)) return 'H3028';
    return null;
  }

  function inspectTargetCardModal(mFast) {
    const o = mFast.ocr;
    const snip = o.replace(/\r?\n/g, ' | ').slice(0, 95);
    if (!seenModalSnippets.some(s => s.slice(0, 40) === snip.slice(0, 40))) {
      seenModalSnippets.push(snip);
    }

    let targetKey = detectTargetFromText(o);

    const isKnownOther =
      /\b(1934|9005|4430|1768|236|4083|3061|426|7229|1932|1124|1560|7761|636|3797|1791|5673|5648|629|6744)\b/.test(o);
    if (!targetKey && !isKnownOther) {
      const fullTopOcr = runOcr(mFast.localPath, true);
      targetKey = detectTargetFromText(fullTopOcr);
    }

    if (!targetKey) return false;

    const spec = cardTargets[targetKey];
    const cardStart = Date.now();
    console.log(`\nOpened named card ${targetKey}! Capturing & verifying Aramaic labels...`);
    let snap = captureAndOcr(spec.shotName, `/sdcard/${spec.shotName}`, false);

    const needsScroll = () => {
      if (spec.expectPeil && !hasPeilPassiveOcr(snap.ocr)) return true;
      if (spec.expectBet && !hasBetPrefixValueOcr(snap.ocr)) return true;
      if (spec.expectAramaicConstruct && !hasAramaicConstructValueOcr(snap.ocr)) return true;
      return false;
    };

    for (let s = 0; s < 2 && needsScroll(); s++) {
      execAdb(`shell input swipe ${Math.round(W * 0.50)} ${Math.round(H * 0.68)} ${Math.round(W * 0.50)} ${Math.round(H * 0.46)} 320`);
      sleep(1400);
      snap = captureAndOcr(spec.shotName, `/sdcard/${spec.shotName}`, false);
    }

    fs.writeFileSync(path.join(evidenceDir, spec.shotName.replace('.png', '_ocr.txt')), snap.ocr, 'utf8');

    const peilOk = hasPeilPassiveOcr(snap.ocr);
    const betValueOk = hasBetPrefixValueOcr(snap.ocr);
    const aramaicConstructOk = hasAramaicConstructValueOcr(snap.ocr);
    const forbiddenHebrewConstruct = hasForbiddenHebrewConstructOcr(snap.ocr);
    const ocrOneLine = snap.ocr.replace(/\r?\n/g, ' | ').slice(0, 350);

    let err = '';
    if (spec.expectPeil && !peilOk) {
      err += `Peil passive participle / Aramaic stem label NOT visible! `;
    }
    if (spec.expectBet && !betValueOk) {
      err += `Aramaic Bet prefix VALUE ("باء الجر" / "الظرفية") NOT visible! `;
    }
    if (spec.expectForbidBet && betValueOk) {
      err += `Forbidden Bet prefix appeared on H69 ("بِحِجَارَةٍ")! `;
    }
    if (spec.expectAramaicConstruct && !aramaicConstructOk) {
      err += `Aramaic Construct label ("الإضافة الآرامية") NOT visible! `;
    }
    if (spec.expectAramaicConstruct && forbiddenHebrewConstruct) {
      err += `Forbidden Hebrew Construct ("الإضافة العبرية") rendered on Aramaic card! `;
    }
    if (err) {
      err += `OCR: "${ocrOneLine}"`;
    }

    cardResults[targetKey] = {
      passed: err === '',
      durationSec: (Date.now() - cardStart) / 1000,
      err,
      info: `peil=${peilOk}, bet=${betValueOk}, aramaicConstruct=${aramaicConstructOk}, hebConstruct=${forbiddenHebrewConstruct}`
    };
    return true;
  }

  const requiredKeys = Object.keys(cardTargets);
  const frame0Offsets = [0.48, 0.525, 0.57, 0.615, 0.66, 0.705, 0.75, 0.795, 0.84, 0.885];
  const frameNOffsets = [0.20, 0.245, 0.29, 0.335, 0.38, 0.425, 0.47, 0.515, 0.56, 0.605, 0.65, 0.695, 0.74, 0.785, 0.83, 0.875];

  for (let frame = 0; frame < 14; frame++) {
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
  console.error('Suite 2 cards error:', navErr.message);
}

const diagSummary = `SeenModals(${seenModalSnippets.length}): ${seenModalSnippets.slice(0, 8).join(' || ')}`;
for (const [key, spec] of Object.entries(cardTargets)) {
  const res = cardResults[key];
  if (res) {
    recordTest(spec.testName, res.durationSec, res.passed, res.err, res.info);
  } else {
    recordTest(spec.testName, (Date.now() - suite2Start) / 1000, false, `Card ${key} was not opened/detected in WordStudyScreen. ${diagSummary}`);
  }
}

// ============================================================================
// SUITE 3: ACTUAL UPGRADE FROM v1.0.374 TO v1.0.375
// ============================================================================
console.log('\n--- SUITE 3: UPGRADE FROM v1.0.374 TO v1.0.375 ---');
const t3Start = Date.now();
let t3Passed = false;
let t3Error = '';

try {
  execAdb('logcat -c');
  execAdb('uninstall com.arabicbible.study', { ignoreError: true });
  sleep(1500);

  const inst374 = execAdb('install v374_baseline.apk', { timeout: 90000 });
  console.log('Baseline v374 install result:', inst374);
  if (!inst374.toLowerCase().includes('success')) {
    throw new Error(`Baseline v374 install failed: ${inst374}`);
  }

  const seedXml = `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <boolean name="flutter.is_dark_mode" value="true" />
    <long name="flutter.db_version" value="374" />
    <string name="flutter.recent_search_queries">VGhpcyBpcyB0aGUgcHJlZml4IGZvciBhIGxpc3Qu![&quot;G561&quot;,&quot;H5587&quot;,&quot;H7307&quot;]</string>
</map>
`;
  const seedLocal = path.join(evidenceDir, 'seed_v374.xml');
  fs.writeFileSync(seedLocal, seedXml, 'utf8');
  execAdb('shell mkdir -p /data/data/com.arabicbible.study/shared_prefs', { ignoreError: true });
  execAdb(`push "${seedLocal}" /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml`);
  execAdb('shell chmod 666 /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  execAdb('shell "if [ -d /data/data/com.arabicbible.study ]; then chown -R $(stat -c \'%u:%g\' /data/data/com.arabicbible.study) /data/data/com.arabicbible.study/shared_prefs; fi"', { ignoreError: true });

  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  console.log('Waiting for baseline v374 DB initialization on device...');
  let v374Ready = false;
  for (let poll = 0; poll < 45; poll++) {
    sleep(1500);
    const sz = parseInt(execAdb('shell stat -c %s /data/data/com.arabicbible.study/databases/bible_study_v374.db', { ignoreError: true }).trim(), 10);
    if (!isNaN(sz) && sz >= 363400000) {
      v374Ready = true;
      console.log(`Baseline bible_study_v374.db ready (${sz} bytes) at ${(poll + 1) * 1.5}s!`);
      break;
    }
  }
  if (!v374Ready) {
    throw new Error('Timed out waiting for baseline v374 database bible_study_v374.db to initialize!');
  }
  sleep(3500);
  ensureAppInForeground();

  console.log('Performing organic search in baseline v374 UI...');
  executeSearch('G561');
  sleep(1500);
  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  sleep(1500);

  execAdb('shell am force-stop com.arabicbible.study');
  sleep(2000);

  const prefsBefore = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  fs.writeFileSync(path.join(evidenceDir, 'prefs_before_upgrade.xml'), prefsBefore, 'utf8');

  console.log('\nExecuting in-place upgrade (`adb install -r v375_candidate.apk`)...');
  execAdb('logcat -c');
  const upgradeOut = execAdb('install -r v375_candidate.apk', { timeout: 90000 });
  console.log('In-place upgrade output:', upgradeOut);
  if (!upgradeOut.toLowerCase().includes('success')) {
    throw new Error(`In-place upgrade failed: ${upgradeOut}`);
  }

  execAdb('shell am start -n com.arabicbible.study/.MainActivity');
  console.log('Waiting for v1.0.375 upgrade migration from v374...');

  let upgradeMigrated = false;
  for (let poll = 0; poll < 45; poll++) {
    sleep(1500);
    const prefsPoll = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml', { ignoreError: true });
    if (prefsPoll.includes('name="flutter.db_version" value="375"')) {
      upgradeMigrated = true;
      console.log(`Upgrade migration to db_version = 375 confirmed on disk at ${(poll + 1) * 1.5}s!`);
      break;
    }
  }
  if (!upgradeMigrated) {
    throw new Error('Timed out waiting for upgrade migration to write db_version = 375!');
  }

  const upgradeLogcat = execAdb('logcat -d', { timeout: 45000 });
  fs.writeFileSync(path.join(evidenceDir, 'upgrade_logcat.txt'), upgradeLogcat, 'utf8');
  if (upgradeLogcat.includes('AssetNotFoundException') || upgradeLogcat.includes('part_70.dat')) {
    throw new Error('CRITICAL: Detected AssetNotFoundException or part_70.dat reference during upgrade!');
  }

  const legacyExistsCheck = execAdb('shell ls /data/data/com.arabicbible.study/databases/bible_study_v374.db', { ignoreError: true });
  if (!legacyExistsCheck.includes('No such file') && legacyExistsCheck.includes('bible_study_v374.db')) {
    throw new Error('Legacy database bible_study_v374.db was NOT cleaned up after upgrade!');
  }
  console.log('[PASS] Verified legacy bible_study_v374.db was cleanly deleted.');

  const dbPathUpgrade = '/data/data/com.arabicbible.study/databases/bible_study_v375.db';
  const bytesUpgrade = parseInt(execAdb(`shell stat -c %s ${dbPathUpgrade}`).trim(), 10);
  if (isNaN(bytesUpgrade) || bytesUpgrade < 363400000 || bytesUpgrade > 363500000) {
    throw new Error(`Upgraded DB size mismatch: ${bytesUpgrade} (expected ~363433984)`);
  }
  console.log(`[PASS] Verified bible_study_v375.db present & opened on disk (${bytesUpgrade} bytes).`);
  const headerUpgrade = execAdb(`shell head -c 16 ${dbPathUpgrade}`);
  if (!headerUpgrade.includes('SQLite format 3')) {
    throw new Error(`Invalid SQLite header on upgraded DB: ${headerUpgrade}`);
  }

  const prefsAfter = execAdb('shell cat /data/data/com.arabicbible.study/shared_prefs/FlutterSharedPreferences.xml');
  fs.writeFileSync(path.join(evidenceDir, 'prefs_after_upgrade.xml'), prefsAfter, 'utf8');

  const hasDark = prefsAfter.includes('is_dark_mode') && prefsAfter.includes('value="true"');
  const hasDb375 = prefsAfter.includes('db_version') && prefsAfter.includes('value="375"');
  const hasSearchQueries = prefsAfter.includes('recent_search_queries') && (prefsAfter.includes('H7307') || prefsAfter.includes('VGhpcy'));

  if (!hasDark || !hasDb375 || !hasSearchQueries) {
    throw new Error(`User data loss detected in SharedPreferences after upgrade! hasDark=${hasDark}, hasDb375=${hasDb375}, hasSearchQueries=${hasSearchQueries}`);
  }

  ensureSearchScreen();
  dismissKeyboard();
  sleep(1500);
  const searchUiSnap = captureAndOcr('upgrade_search_history.png', '/sdcard/upgrade_search_history.png');
  fs.writeFileSync(path.join(evidenceDir, 'upgrade_search_history_ocr.txt'), searchUiSnap.ocr, 'utf8');

  navigateToEzra58WordStudyScreen('upgrade');
  t3Passed = true;
} catch (e) {
  t3Error = e.message;
}
recordTest('test_upgrade_v374_to_v375_retains_user_data_and_opens_db', (Date.now() - t3Start) / 1000, t3Passed, t3Error);

// ============================================================================
// SUITE 4: LOGCAT CLEANLINESS, SCREENSHOT UNIQUENESS & EVIDENCE BUNDLE
// ============================================================================
console.log('\n--- SUITE 4: LOGCAT CLEANLINESS & EVIDENCE PACKAGING ---');
const t4Start = Date.now();
let t4Passed = false;
let t4Error = '';

try {
  const finalLogcatPath = path.join(evidenceDir, 'final_logcat.txt');
  execAdb('shell "logcat -d > /sdcard/final_logcat_v375.txt"');
  execAdb(`pull /sdcard/final_logcat_v375.txt "${finalLogcatPath}"`);
  const finalLogcat = fs.readFileSync(finalLogcatPath, 'utf8');

  if (finalLogcat.includes('FATAL EXCEPTION: main') || finalLogcat.includes('AndroidRuntime: FATAL') || finalLogcat.includes('AssetNotFoundException')) {
    throw new Error('Fatal crash or AssetNotFoundException found in final_logcat.txt!');
  }

  const expectedShots = [
    'clean_install_ezra58_wordstudy.png',
    'ezra58_h3046_peil_card.png',
    'ezra58_h1005_construct_card.png',
    'ezra58_h69_construct_card.png',
    'ezra58_h3028_bet_construct_card.png',
    'upgrade_search_history.png',
    'upgrade_ezra58_wordstudy.png',
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
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites tests="${testResults.length}" failures="${failuresCount}" time="${totalTime.toFixed(2)}">\n  <testsuite name="v1.0.375.AndroidEmulatorVerification" tests="${testResults.length}" failures="${failuresCount}" time="${totalTime.toFixed(2)}">\n`;
for (const t of testResults) {
  xml += `    <testcase classname="v1.0.375.AndroidEmulatorVerification" name="${t.name}" time="${t.durationSec.toFixed(2)}">\n`;
  if (!t.passed) xml += `      <failure message="${t.failureMsg.replace(/"/g, '&quot;')}">${t.failureMsg}</failure>\n`;
  xml += `    </testcase>\n`;
}
xml += `  </testsuite>\n</testsuites>\n`;
fs.writeFileSync(path.join(evidenceDir, 'test-results.xml'), xml, 'utf8');

try {
  child.execSync(`cd "${evidenceDir}" && zip -r "../android_emulator_v375_evidence.zip" ./*`, { timeout: 30000 });
} catch (_) {}

console.log(`\nSUMMARY: ${testResults.length - failuresCount}/${testResults.length} Emulator Verification Suites Passed.`);
if (failuresCount > 0) process.exit(1);
process.exit(0);
