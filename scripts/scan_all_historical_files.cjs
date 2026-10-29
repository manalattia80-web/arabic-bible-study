const fs = require('fs');
const path = require('path');

console.log('========================================================================');
console.log('   DEEP HISTORICAL SAMPLE INDEPENDENCE & EXCLUSION SCANNER             ');
console.log('========================================================================\n');

// 1. Load the held-out 60-verse sample
const sampleFile = path.resolve(__dirname, 'held_out_60_verses_sample.json');
if (!fs.existsSync(sampleFile)) {
  console.error(`CRITICAL: Sample file not found at ${sampleFile}`);
  process.exit(1);
}
const sampleData = JSON.parse(fs.readFileSync(sampleFile, 'utf8'));

const all60SampleVerses = [
  ...sampleData.hebrew.map(v => ({ ...v, lang: 'hebrew', key: `${v.book_id}:${v.chapter}:${v.verse}` })),
  ...sampleData.greek.map(v => ({ ...v, lang: 'greek', key: `${v.book_id}:${v.chapter}:${v.verse}` })),
  ...sampleData.aramaic.map(v => ({ ...v, lang: 'aramaic', key: `${v.book_id}:${v.chapter}:${v.verse}` }))
];

const sampleKeyMap = new Map();
all60SampleVerses.forEach(v => sampleKeyMap.set(v.key, v));

console.log(`Audited Sample Size: 60 verses (${sampleData.hebrew.length} Hebrew, ${sampleData.greek.length} Greek, ${sampleData.aramaic.length} Aramaic)`);

// 2. Comprehensive manifest of all known historical measurement/benchmark/review files
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
  'user_10_verses_dump.json',
  'scripts/user_10_verses_dump.json'
];

const filesFound = [];
const filesMissing = [];
const historicalVerses = new Map();

console.log('\n▶ Scanning Historical Candidate Files:');

for (const relPath of historicalFileCandidates) {
  const fullPath = path.resolve(baseDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [MISSING] File not found on disk: ${relPath}`);
    filesMissing.push(relPath);
    continue;
  }

  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(raw);

    let extractedCount = 0;
    const inspect = (item) => {
      if (!item || typeof item !== 'object') return;
      if (item.book_id && item.chapter_num && item.verse_num) {
        const k = `${item.book_id}:${item.chapter_num}:${item.verse_num}`;
        historicalVerses.set(k, { file: relPath, book_id: item.book_id, chapter: item.chapter_num, verse: item.verse_num });
        extractedCount++;
      } else if (item.book_id && item.chapter && item.verse) {
        const k = `${item.book_id}:${item.chapter}:${item.verse}`;
        historicalVerses.set(k, { file: relPath, book_id: item.book_id, chapter: item.chapter, verse: item.verse });
        extractedCount++;
      } else if (item.verse_id && typeof item.verse_id === 'string' && item.verse_id.includes('-')) {
        const parts = item.verse_id.split('-');
        if (parts.length === 3) {
          const b = parseInt(parts[0], 10);
          const c = parseInt(parts[1], 10);
          const v = parseInt(parts[2], 10);
          if (!isNaN(b) && !isNaN(c) && !isNaN(v)) {
            const k = `${b}:${c}:${v}`;
            historicalVerses.set(k, { file: relPath, book_id: b, chapter: c, verse: v });
            extractedCount++;
          }
        }
      }
      if (Array.isArray(item)) {
        item.forEach(inspect);
      } else {
        Object.values(item).forEach(inspect);
      }
    };
    inspect(data);

    filesFound.push({ path: relPath, size_bytes: raw.length, extracted_verses: extractedCount });
    console.log(`  [SCANNED] ${relPath} (extracted ${extractedCount} verse references)`);
  } catch (e) {
    console.error(`  [ERROR] Parsing failed for ${relPath}: ${e.message}`);
    filesMissing.push(relPath);
  }
}

console.log(`\nScan Summary:`);
console.log(`- Files configured to search: ${historicalFileCandidates.length}`);
console.log(`- Files actually found and parsed: ${filesFound.length}`);
console.log(`- Files missing on current filesystem: ${filesMissing.length}`);
console.log(`- Total unique historical verses extracted: ${historicalVerses.size}`);

// 3. Mathematical intersection check between 60 sample verses and historical files
const overlaps = [];
for (const [key, sv] of sampleKeyMap.entries()) {
  if (historicalVerses.has(key)) {
    overlaps.push({
      sample_verse: sv,
      historical_source: historicalVerses.get(key)
    });
  }
}

console.log(`\nOverlaps between 60-verse sample and historical benchmark files: ${overlaps.length}`);
if (overlaps.length > 0) {
  console.log('Overlapping verses detected:');
  overlaps.forEach(o => {
    console.log(`  - ${o.sample_verse.name_en} ${o.sample_verse.chapter}:${o.sample_verse.verse} (found in ${o.historical_source.file})`);
  });
} else {
  console.log('✓ 100% CLEAN: Zero overlaps detected.');
}

// 4. Save results to manifest
const report = {
  scan_timestamp: new Date().toISOString(),
  files_configured_to_search: historicalFileCandidates.length,
  files_found_count: filesFound.length,
  files_missing_count: filesMissing.length,
  files_found: filesFound,
  files_missing: filesMissing,
  total_historical_unique_verses: historicalVerses.size,
  sample_verses_count: 60,
  overlap_count: overlaps.length,
  overlaps: overlaps.map(o => ({
    book_id: o.sample_verse.book_id,
    chapter: o.sample_verse.chapter,
    verse: o.sample_verse.verse,
    name_en: o.sample_verse.name_en,
    matched_historical_file: o.historical_source.file
  }))
};

const reportPath = path.resolve(__dirname, 'historical_overlap_report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`\nReport successfully written to ${reportPath}`);

// If strict zero overlap flag passed, fail CI
const strictMode = process.argv.includes('--fail-on-overlap');
if (strictMode && overlaps.length > 0) {
  console.error(`STRICT MODE FAILURE: Detected ${overlaps.length} overlapping verses!`);
  process.exit(1);
}
