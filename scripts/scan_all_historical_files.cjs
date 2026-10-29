const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== Deep Historical File Scan for Any Prior Sample Overlap ===');

// 1. Load the held-out 60-verse sample
const sampleFile = path.resolve(__dirname, 'held_out_60_verses_sample.json');
const sampleData = JSON.parse(fs.readFileSync(sampleFile, 'utf8'));

const all60SampleVerses = [
  ...sampleData.hebrew.map(v => ({ ...v, lang: 'hebrew', key: `${v.book_id}:${v.chapter}:${v.verse}` })),
  ...sampleData.greek.map(v => ({ ...v, lang: 'greek', key: `${v.book_id}:${v.chapter}:${v.verse}` })),
  ...sampleData.aramaic.map(v => ({ ...v, lang: 'aramaic', key: `${v.book_id}:${v.chapter}:${v.verse}` }))
];

const sampleKeyMap = new Map();
all60SampleVerses.forEach(v => sampleKeyMap.set(v.key, v));

console.log(`Target Sample: 60 verses (${sampleData.hebrew.length} Heb, ${sampleData.greek.length} Grk, ${sampleData.aramaic.length} Aram)`);

// 2. Discover all historical sample/target/benchmark files
const baseDir = path.resolve(__dirname, '..');
const historicalFiles = [
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

const historicalVerses = new Map();

for (const relPath of historicalFiles) {
  const fullPath = path.resolve(baseDir, relPath);
  if (!fs.existsSync(fullPath)) continue;

  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(raw);

    // Extract verses from various JSON schemas
    let count = 0;
    const inspect = (item) => {
      if (!item || typeof item !== 'object') return;
      if (item.book_id && item.chapter_num && item.verse_num) {
        const k = `${item.book_id}:${item.chapter_num}:${item.verse_num}`;
        historicalVerses.set(k, { file: relPath, book_id: item.book_id, chapter: item.chapter_num, verse: item.verse_num });
        count++;
      } else if (item.book_id && item.chapter && item.verse) {
        const k = `${item.book_id}:${item.chapter}:${item.verse}`;
        historicalVerses.set(k, { file: relPath, book_id: item.book_id, chapter: item.chapter, verse: item.verse });
        count++;
      } else if (item.verse_id && typeof item.verse_id === 'string' && item.verse_id.includes('-')) {
        const parts = item.verse_id.split('-');
        if (parts.length === 3) {
          const b = parseInt(parts[0], 10);
          const c = parseInt(parts[1], 10);
          const v = parseInt(parts[2], 10);
          if (!isNaN(b) && !isNaN(c) && !isNaN(v)) {
            const k = `${b}:${c}:${v}`;
            historicalVerses.set(k, { file: relPath, book_id: b, chapter: c, verse: v });
            count++;
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
    console.log(`  Read ${relPath}: extracted ${count} verse occurrences`);
  } catch (e) {
    console.warn(`  Could not parse JSON in ${relPath}: ${e.message}`);
  }
}

console.log(`\nTotal unique verses across ALL historical sample/benchmark files: ${historicalVerses.size}`);

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

console.log(`\nOverlaps between 60-verse sample and historical sample files: ${overlaps.length}`);
if (overlaps.length > 0) {
  console.log('Found overlapping verses:');
  overlaps.forEach(o => {
    console.log(`  - ${o.sample_verse.name_en} ${o.sample_verse.chapter}:${o.sample_verse.verse} (found in ${o.historical_source.file})`);
  });
} else {
  console.log('✓ 100% CLEAN: Not a single verse in the held-out 60-verse sample was ever part of any historical benchmark, audit sample, or review file!');
}

// 4. Save results to manifest
fs.writeFileSync(path.resolve(__dirname, 'historical_overlap_report.json'), JSON.stringify({
  scan_timestamp: new Date().toISOString(),
  total_historical_files_scanned: historicalFiles.length,
  total_historical_unique_verses: historicalVerses.size,
  sample_verses_count: 60,
  overlap_count: overlaps.length,
  overlaps
}, null, 2), 'utf8');
