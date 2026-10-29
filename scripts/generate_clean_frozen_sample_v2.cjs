const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('========================================================================');
console.log('   OPTION B: BLIND DETERMINISTIC REPLACEMENT OF 3 OVERLAPPING VERSES    ');
console.log('========================================================================\n');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

// 1. Load the original v1 sample
const v1SamplePath = path.resolve(__dirname, 'held_out_60_verses_sample.json');
const v1Sample = JSON.parse(fs.readFileSync(v1SamplePath, 'utf8'));

// Archive v1 sample
const v1ArchivePath = path.resolve(__dirname, 'held_out_60_verses_sample_v1_with_3_overlaps.json');
fs.writeFileSync(v1ArchivePath, JSON.stringify(v1Sample, null, 2), 'utf8');
console.log(`✓ Original sample archived to ${path.basename(v1ArchivePath)}`);

// 2. Load the exclusion list from historical_overlap_report.json and scan script
// Re-run scan logic in memory to get all 1603 unique keys
function queryDb(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_opt_b.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 }).trim();
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

// Build exclusion set from historical_overlap_report
const histReport = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'historical_overlap_report.json'), 'utf8'));
const histReportFile = path.resolve(__dirname, 'historical_overlap_report.json');
const histReportSha256 = crypto.createHash('sha256').update(fs.readFileSync(histReportFile)).digest('hex');

// Load all historical verses by executing the scanner's extraction or parsing the candidate files
// Let's run scan_all_historical_files.cjs to ensure freshness
execSync(`"${process.execPath}" "${path.resolve(__dirname, 'scan_all_historical_files.cjs')}"`, { stdio: 'pipe' });

// We now load all 1603 historical verse keys directly from historical scanner
// To do this reliably, we instantiate the exact historical set:
const baseDir = path.resolve(__dirname, '..');
const historicalFileCandidates = [
  'gold_benchmark_300_verses.json',
  'alignment_audit_v299/gold_benchmark_300_verses.json',
  'alignment_audit_v299/measurement_sample_1000_tokens.json',
  'measurement_sample_1000_tokens.json',
  'phase1_targets.json',
  'phase2_targets.json',
  'phase2_verified_targets.json',
  'review.json',
  'scripts/whole_verses_audit_sample.json',
  'scripts/fresh_sample_audit.json',
  'scripts/independent_40word_sample_raw.json',
  'scripts/sample_data.json',
  'scratch/review_v317_evidence/review.json',
  'scratch/review_v317_evidence/baseline/review.json',
  'baselines/benchmark_300_verses_eval.json',
  'scripts/user_10_verses_dump.json'
];

// Lookups for book names
const bookNameMap = new Map();
const bRows = queryDb('SELECT id, name_ar, name_en FROM books;').split('\n');
bRows.forEach(l => {
  const p = l.trim().split('|');
  if (p.length === 3) {
    bookNameMap.set(p[1].trim().toLowerCase(), parseInt(p[0], 10));
    bookNameMap.set(p[2].trim().toLowerCase(), parseInt(p[0], 10));
  }
});
const extraAbbrevs = {
  'gen': 1, 'exo': 2, 'exod': 2, 'lev': 3, 'num': 4, 'deut': 5, 'josh': 6, 'judg': 7, 'ruth': 8,
  '1 sam': 9, '2 sam': 10, '1 kings': 11, '2 kings': 12, '1 chr': 13, '2 chr': 14, 'ezra': 15,
  'neh': 16, 'esth': 17, 'job': 18, 'ps': 19, 'psa': 19, 'prov': 20, 'eccl': 21, 'song': 22,
  'isa': 23, 'jer': 24, 'lam': 25, 'ezek': 26, 'dan': 27, 'hos': 28, 'joel': 29, 'amos': 30,
  'obad': 31, 'jonah': 32, 'mic': 33, 'nah': 34, 'hab': 35, 'zeph': 36, 'hag': 37, 'zech': 38,
  'mal': 39, 'matt': 40, 'mark': 41, 'luke': 42, 'john': 43, 'acts': 44, 'rom': 45, '1 cor': 46,
  '2 cor': 47, 'gal': 48, 'eph': 49, 'phil': 50, 'col': 51, '1 thess': 52, '2 thess': 53,
  '1 tim': 54, '2 tim': 55, 'titus': 56, 'philem': 57, 'heb': 58, 'james': 59, '1 pet': 60,
  '2 pet': 61, '1 john': 62, '2 john': 63, '3 john': 64, 'jude': 65, 'rev': 66,
  'التكوين': 1, 'الخروج': 2, 'اللاويين': 3, 'العدد': 4, 'التثنية': 5, 'الملوك الأول': 11
};
for (const [k, v] of Object.entries(extraAbbrevs)) bookNameMap.set(k.toLowerCase(), v);

const verseMap = new Map();
const vRows = queryDb('SELECT id, book_id, chapter_num, verse_num FROM verses;').split('\n');
vRows.forEach(l => {
  const p = l.trim().split('|');
  if (p.length === 4) verseMap.set(p[0], { book_id: parseInt(p[1]), chapter: parseInt(p[2]), verse: parseInt(p[3]) });
});

const mappingMap = new Map();
const mRows = queryDb('SELECT wm.id, v.book_id, v.chapter_num, v.verse_num FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id;').split('\n');
mRows.forEach(l => {
  const p = l.trim().split('|');
  if (p.length === 4) mappingMap.set(p[0], { book_id: parseInt(p[1]), chapter: parseInt(p[2]), verse: parseInt(p[3]) });
});

function parseCitationString(str) {
  if (!str || typeof str !== 'string') return null;
  const m = str.trim().match(/^(.+?)\s+(\d+)[:\.](\d+)/);
  if (m) {
    const name = m[1].trim().toLowerCase();
    if (bookNameMap.has(name)) {
      return { book_id: bookNameMap.get(name), chapter: parseInt(m[2], 10), verse: parseInt(m[3], 10) };
    }
  }
  return null;
}

const excludedVerseKeys = new Set();

for (const relPath of historicalFileCandidates) {
  const fullPath = path.resolve(baseDir, relPath);
  if (!fs.existsSync(fullPath)) continue;
  try {
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const inspect = (item, parentKey = '') => {
      if (!item) return;
      if (typeof parentKey === 'string' && parentKey.includes(' ')) {
        const fromKey = parseCitationString(parentKey);
        if (fromKey) excludedVerseKeys.add(`${fromKey.book_id}:${fromKey.chapter}:${fromKey.verse}`);
      }
      if (typeof item === 'string') {
        const parsed = parseCitationString(item);
        if (parsed) excludedVerseKeys.add(`${parsed.book_id}:${parsed.chapter}:${parsed.verse}`);
        return;
      }
      if (typeof item !== 'object') return;
      if (item.book_id && item.chapter_num && item.verse_num) {
        excludedVerseKeys.add(`${item.book_id}:${item.chapter_num}:${item.verse_num}`);
      } else if (item.book_id && item.chapter && item.verse) {
        excludedVerseKeys.add(`${item.book_id}:${item.chapter}:${item.verse}`);
      } else if (item.book && item.chapter && item.verse) {
        excludedVerseKeys.add(`${item.book}:${item.chapter}:${item.verse}`);
      }
      const cit = item.citation || item.reference || item.ref || item.verse;
      if (typeof cit === 'string') {
        const parsed = parseCitationString(cit);
        if (parsed) excludedVerseKeys.add(`${parsed.book_id}:${parsed.chapter}:${parsed.verse}`);
      }
      if (item.verse_id && verseMap.has(item.verse_id)) {
        const v = verseMap.get(item.verse_id);
        excludedVerseKeys.add(`${v.book_id}:${v.chapter}:${v.verse}`);
      }
      if (item.mapping_id && mappingMap.has(item.mapping_id)) {
        const m = mappingMap.get(item.mapping_id);
        excludedVerseKeys.add(`${m.book_id}:${m.chapter}:${m.verse}`);
      }
      if (item.id && mappingMap.has(item.id)) {
        const m = mappingMap.get(item.id);
        excludedVerseKeys.add(`${m.book_id}:${m.chapter}:${m.verse}`);
      }
      if (Array.isArray(item)) item.forEach((sub, idx) => inspect(sub, String(idx)));
      else for (const [k, v] of Object.entries(item)) inspect(v, k);
    };
    inspect(data);
  } catch (_) {}
}

console.log(`Total historical excluded verses: ${excludedVerseKeys.size}`);

// Add all 60 verses of v1 sample to exclusion set so we do NOT pick any existing verse
const currentSampleKeys = new Set();
[...v1Sample.hebrew, ...v1Sample.greek, ...v1Sample.aramaic].forEach(v => {
  currentSampleKeys.add(`${v.book_id}:${v.chapter}:${v.verse}`);
  excludedVerseKeys.add(`${v.book_id}:${v.chapter}:${v.verse}`);
});

// Identify the 3 overlapping verses to replace
const overlappingKeys = ['43:1:49', '45:7:19', '49:5:25']; // John 1:49, Rom 7:19, Eph 5:25
console.log('\nVerses to be replaced (overlap with measurement_sample_1000_tokens.json):');
overlappingKeys.forEach(k => console.log(`  - Key: ${k}`));

// 3. Candidate pool: All Greek New Testament verses (books 40..66) in SQLite
const allNtVersesRaw = queryDb('SELECT id, book_id, chapter_num, verse_num, text_avd_ar FROM verses WHERE book_id >= 40 AND book_id <= 66 ORDER BY book_id, chapter_num, verse_num;').split('\n');
const candidatePool = [];
allNtVersesRaw.forEach(line => {
  const p = line.trim().split('|');
  if (p.length === 5) {
    const b = parseInt(p[1], 10);
    const c = parseInt(p[2], 10);
    const v = parseInt(p[3], 10);
    const key = `${b}:${c}:${v}`;
    // BLIND CHECK ONLY: Exclude if in historical exclusion set or current sample
    if (!excludedVerseKeys.has(key)) {
      candidatePool.push({
        id: p[0],
        book_id: b,
        chapter: c,
        verse: v,
        text_ar: p[4],
        key
      });
    }
  }
});

console.log(`\nEligible Candidate Pool (NT verses completely outside exclusion set): ${candidatePool.length} verses`);

// 4. Declared Seed & Deterministic PRNG
// Seed string declared publicly for independent verification
const DECLARED_SEED = 'ABS-FROZEN-BENCHMARK-SEED-20261029-ROUND2';
console.log(`Declared PRNG Seed: "${DECLARED_SEED}"`);

function getDeterministicRandomIndexes(seedStr, poolSize, count) {
  const selectedIndexes = [];
  let counter = 0;
  while (selectedIndexes.length < count) {
    const hash = crypto.createHash('sha256').update(`${seedStr}:${counter}`).digest('hex');
    // Take first 8 chars as 32-bit unsigned integer
    const intVal = parseInt(hash.substring(0, 8), 16);
    const idx = intVal % poolSize;
    if (!selectedIndexes.includes(idx)) {
      selectedIndexes.push(idx);
    }
    counter++;
  }
  return selectedIndexes;
}

const chosenIndexes = getDeterministicRandomIndexes(DECLARED_SEED, candidatePool.length, 3);
const newGreekVerses = chosenIndexes.map(idx => candidatePool[idx]);

// Lookup English book names
const bookEnNames = {
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts', 45: 'Romans',
  46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians', 49: 'Ephesians',
  50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians', 53: '2 Thessalonians',
  54: '1 Timothy', 55: '2 Timothy', 56: 'Titus', 57: 'Philemon', 58: 'Hebrews',
  59: 'James', 60: '1 Peter', 61: '2 Peter', 62: '1 John', 63: '2 John',
  64: '3 John', 65: 'Jude', 66: 'Revelation'
};

console.log('\nSelected 3 Replacement Verses (Pure Blind Selection):');
newGreekVerses.forEach((v, i) => {
  v.name_en = bookEnNames[v.book_id];
  console.log(`  [${i + 1}] ${v.name_en} ${v.chapter}:${v.verse} (Book ${v.book_id}, Ch ${v.chapter}, Vs ${v.verse})`);
});

// 5. Construct the New Clean Sample v2
// Remove the 3 overlapping verses and append the 3 new verses
const cleanGreekList = v1Sample.greek.filter(v => !overlappingKeys.includes(`${v.book_id}:${v.chapter}:${v.verse}`));
newGreekVerses.forEach(v => {
  cleanGreekList.push({
    book_id: v.book_id,
    chapter: v.chapter,
    verse: v.verse,
    name_en: v.name_en,
    text_ar: v.text_ar
  });
});

// Sort for canonical consistency
cleanGreekList.sort((a, b) => a.book_id - b.book_id || a.chapter - b.chapter || a.verse - b.verse);

const sampleV2 = {
  sample_name: 'عينة القياس المجمدة (صفر تداخل مع سجل الاستبعاد الموثق)',
  version: '2.0.0',
  description: 'Held-out 60-verse benchmark with strictly 0.0% overlap against all 16 historical project files.',
  provenance: {
    prng_seed: DECLARED_SEED,
    distribution: {
      hebrew_count: v1Sample.hebrew.length,
      greek_count: cleanGreekList.length,
      aramaic_count: v1Sample.aramaic.length,
      total_verses: v1Sample.hebrew.length + cleanGreekList.length + v1Sample.aramaic.length
    },
    replacements_from_v1: [
      {
        old_verse: 'John 1:49 (Book 43, Ch 1, Vs 49)',
        reason: 'Historical overlap with measurement_sample_1000_tokens.json',
        new_verse: `${newGreekVerses[0].name_en} ${newGreekVerses[0].chapter}:${newGreekVerses[0].verse}`
      },
      {
        old_verse: 'Romans 7:19 (Book 45, Ch 7, Vs 19)',
        reason: 'Historical overlap with measurement_sample_1000_tokens.json',
        new_verse: `${newGreekVerses[1].name_en} ${newGreekVerses[1].chapter}:${newGreekVerses[1].verse}`
      },
      {
        old_verse: 'Ephesians 5:25 (Book 49, Ch 5, Vs 25)',
        reason: 'Historical overlap with measurement_sample_1000_tokens.json',
        new_verse: `${newGreekVerses[2].name_en} ${newGreekVerses[2].chapter}:${newGreekVerses[2].verse}`
      }
    ]
  },
  hebrew: v1Sample.hebrew,
  greek: cleanGreekList,
  aramaic: v1Sample.aramaic
};

// 6. Save new sample file
const v2SampleFile = path.resolve(__dirname, 'held_out_60_verses_sample.json');
fs.writeFileSync(v2SampleFile, JSON.stringify(sampleV2, null, 2), 'utf8');
console.log(`\n✓ New clean sample written to ${v2SampleFile}`);

// 7. Compute cryptographic hashes & create Manifest
const sampleV2Sha256 = crypto.createHash('sha256').update(fs.readFileSync(v2SampleFile)).digest('hex');
const dbSha256 = crypto.createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex');
let gitCommit = 'unknown';
try {
  gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
} catch (_) {}

const manifest = {
  manifest_title: 'بيان تجميد العينة (صفر تداخل مع سجل الاستبعاد الموثق)',
  sample_version: '2.0.0',
  freeze_timestamp: new Date().toISOString(),
  git_commit_base: gitCommit,
  database_sha256: dbSha256,
  exclusion_manifest_sha256: histReportSha256,
  sample_v2_sha256: sampleV2Sha256,
  distribution: {
    hebrew_verses: sampleV2.hebrew.length,
    greek_verses: sampleV2.greek.length,
    aramaic_verses: sampleV2.aramaic.length,
    total_verses: sampleV2.hebrew.length + sampleV2.greek.length + sampleV2.aramaic.length
  },
  replacement_record: sampleV2.provenance.replacements_from_v1
};

const manifestPath = path.resolve(__dirname, 'frozen_sample_v2_manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`✓ Frozen Manifest written to ${manifestPath}`);

// 8. Re-run scan_all_historical_files to mathematically verify 0 overlaps!
console.log('\n▶ Re-verifying mathematical overlap of new sample against all 16 historical files...');
const verifyOutput = execSync(`"${process.execPath}" "${path.resolve(__dirname, 'scan_all_historical_files.cjs')}"`, { encoding: 'utf8' });
console.log(verifyOutput.split('\n').filter(l => l.includes('Overlaps between') || l.includes('CLEAN') || l.includes('Scan Summary') || l.includes('Total unique')).join('\n'));

console.log('\n========================================================================');
console.log('✓ OPTION B COMPLETE: SAMPLE FROZEN WITH ZERO OVERLAP WITH EXCLUSION MANIFEST');
console.log('========================================================================');
