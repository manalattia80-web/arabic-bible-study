const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function querySql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_indep_query.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    const res = execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { encoding: 'utf8', windowsHide: true });
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    return res.trim();
  } catch (e) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw e;
  }
}

console.log('=== Establishing Unified Manifest of Excluded Verses & Zero-Intersection Verification ===');

// Explicit list of known audited benchmark and repair loci
const explicitLoci = [
  { book_id: 1, ch: 3, vs: 6, ref: 'Gen 3:6' },
  { book_id: 1, ch: 3, vs: 18, ref: 'Gen 3:18' },
  { book_id: 1, ch: 4, vs: 18, ref: 'Gen 4:18' },
  { book_id: 1, ch: 7, vs: 3, ref: 'Gen 7:3' },
  { book_id: 2, ch: 8, vs: 10, ref: 'Exod 8:10' },
  { book_id: 3, ch: 12, vs: 4, ref: 'Lev 12:4' },
  { book_id: 3, ch: 25, vs: 52, ref: 'Lev 25:52' },
  { book_id: 5, ch: 23, vs: 2, ref: 'Deut 23:2' },
  { book_id: 7, ch: 14, vs: 5, ref: 'Judg 14:5' },
  { book_id: 9, ch: 19, vs: 15, ref: '1 Sam 19:15' },
  { book_id: 9, ch: 25, vs: 43, ref: '1 Sam 25:43' },
  { book_id: 11, ch: 8, vs: 32, ref: '1 Kings 8:32' },
  { book_id: 17, ch: 8, vs: 3, ref: 'Esth 8:3' },
  { book_id: 18, ch: 31, vs: 14, ref: 'Job 31:14' },
  { book_id: 20, ch: 15, vs: 6, ref: 'Prov 15:6' },
  { book_id: 23, ch: 17, vs: 1, ref: 'Isa 17:1' },
  { book_id: 23, ch: 53, vs: 5, ref: 'Isa 53:5' },
  { book_id: 24, ch: 32, vs: 13, ref: 'Jer 32:13' },
  { book_id: 24, ch: 42, vs: 5, ref: 'Jer 42:5' },
  { book_id: 24, ch: 51, vs: 22, ref: 'Jer 51:22' },
  { book_id: 24, ch: 51, vs: 64, ref: 'Jer 51:64' },
  { book_id: 26, ch: 40, vs: 34, ref: 'Ezek 40:34' },
  { book_id: 27, ch: 3, vs: 30, ref: 'Dan 3:30' },
  { book_id: 28, ch: 7, vs: 3, ref: 'Hos 7:3' },
  { book_id: 30, ch: 1, vs: 4, ref: 'Amos 1:4' },
  { book_id: 40, ch: 17, vs: 20, ref: 'Matt 17:20' },
  { book_id: 40, ch: 25, vs: 37, ref: 'Matt 25:37' },
  { book_id: 42, ch: 4, vs: 16, ref: 'Luke 4:16' },
  { book_id: 42, ch: 5, vs: 22, ref: 'Luke 5:22' },
  { book_id: 43, ch: 1, vs: 36, ref: 'John 1:36' },
  { book_id: 43, ch: 3, vs: 16, ref: 'John 3:16' },
  { book_id: 43, ch: 6, vs: 44, ref: 'John 6:44' },
  { book_id: 43, ch: 13, vs: 8, ref: 'John 13:8' },
  { book_id: 43, ch: 14, vs: 19, ref: 'John 14:19' },
  { book_id: 43, ch: 18, vs: 25, ref: 'John 18:25' },
  { book_id: 44, ch: 1, vs: 8, ref: 'Acts 1:8' },
  { book_id: 44, ch: 4, vs: 18, ref: 'Acts 4:18' },
  { book_id: 44, ch: 6, vs: 8, ref: 'Acts 6:8' },
  { book_id: 44, ch: 7, vs: 44, ref: 'Acts 7:44' },
  { book_id: 44, ch: 22, vs: 30, ref: 'Acts 22:30' },
  { book_id: 45, ch: 9, vs: 23, ref: 'Rom 9:23' },
  { book_id: 46, ch: 1, vs: 11, ref: '1 Cor 1:11' },
  { book_id: 46, ch: 2, vs: 1, ref: '1 Cor 2:1' },
  { book_id: 46, ch: 7, vs: 7, ref: '1 Cor 7:7' },
  { book_id: 47, ch: 1, vs: 10, ref: '2 Cor 1:10' },
  { book_id: 47, ch: 1, vs: 24, ref: '2 Cor 1:24' },
  { book_id: 48, ch: 2, vs: 4, ref: 'Gal 2:4' },
  { book_id: 49, ch: 2, vs: 8, ref: 'Eph 2:8' },
  { book_id: 51, ch: 1, vs: 23, ref: 'Col 1:23' },
  { book_id: 58, ch: 10, vs: 18, ref: 'Heb 10:18' },
  { book_id: 58, ch: 11, vs: 1, ref: 'Heb 11:1' },
  { book_id: 59, ch: 1, vs: 17, ref: 'Jas 1:17' },
  { book_id: 66, ch: 1, vs: 8, ref: 'Rev 1:8' },
  { book_id: 66, ch: 13, vs: 5, ref: 'Rev 13:5' },
];

// Query all verses in database marked by verified tags, manual audits, or historical repairs
const dbVerifiedVersesSql = `
  SELECT DISTINCT v.book_id, b.name_en, v.chapter_num, v.verse_num
  FROM verses v
  JOIN books b ON v.book_id = b.id
  WHERE v.id IN (
    SELECT DISTINCT verse_id FROM word_mappings 
    WHERE is_verified=1 
       OR verified_source IS NOT NULL
       OR morph_source IN ('expert_philological_audit', 'manual_review')
  )
  ORDER BY v.book_id, v.chapter_num, v.verse_num;
`;

const dbRows = querySql(dbVerifiedVersesSql).split('\n').filter(Boolean);

// Union all into a canonical set
const exclusionMap = new Map();

for (const loc of explicitLoci) {
  const key = `${loc.book_id}:${loc.ch}:${loc.vs}`;
  exclusionMap.set(key, { book_id: loc.book_id, chapter: loc.ch, verse: loc.vs, label: loc.ref, source: 'audit_benchmark_locus' });
}

for (const r of dbRows) {
  const [b, name_en, c, v] = r.split('|');
  const key = `${b}:${c}:${v}`;
  if (!exclusionMap.has(key)) {
    exclusionMap.set(key, { book_id: Number(b), chapter: Number(c), verse: Number(v), label: `${name_en} ${c}:${v}`, source: 'database_verified_flag' });
  }
}

const unifiedExclusions = Array.from(exclusionMap.values());
unifiedExclusions.sort((a, b) => a.book_id - b.book_id || a.chapter - b.chapter || a.verse - b.verse);

// Write unified exclusion list manifest
const exclusionFile = path.resolve(__dirname, 'unified_exclusion_manifest.json');
fs.writeFileSync(exclusionFile, JSON.stringify(unifiedExclusions, null, 2), 'utf8');

const exclusionHash = crypto.createHash('sha256').update(fs.readFileSync(exclusionFile)).digest('hex');
console.log(`Total excluded verses registered: ${unifiedExclusions.length}`);
console.log(`Exclusion Manifest SHA256: ${exclusionHash}`);

// 2. Load the frozen held-out 60-verse sample
const sampleFile = path.resolve(__dirname, 'held_out_60_verses_sample.json');
if (!fs.existsSync(sampleFile)) {
  console.error(`Sample file not found: ${sampleFile}`);
  process.exit(1);
}

const sampleData = JSON.parse(fs.readFileSync(sampleFile, 'utf8'));
const sampleHash = crypto.createHash('sha256').update(fs.readFileSync(sampleFile)).digest('hex');

const allSampleVerses = [
  ...sampleData.hebrew.map(v => ({ ...v, lang: 'hebrew' })),
  ...sampleData.greek.map(v => ({ ...v, lang: 'greek' })),
  ...sampleData.aramaic.map(v => ({ ...v, lang: 'aramaic' }))
];

console.log(`Loaded held-out evaluation sample: ${allSampleVerses.length} verses`);
console.log(`Sample Manifest SHA256: ${sampleHash}`);

// 3. Compute mathematical intersection
console.log('\n--- Computing Intersection: Exclusions ∩ Held-Out Sample ---');
const intersection = [];

for (const sv of allSampleVerses) {
  const key = `${sv.book_id}:${sv.chapter}:${sv.verse}`;
  if (exclusionMap.has(key)) {
    intersection.push({
      verse: sv,
      conflict_with: exclusionMap.get(key)
    });
  }
}

console.log(`Intersection Size: ${intersection.length}`);
if (intersection.length === 0) {
  console.log('✓ MATHEMATICAL PROOF PASSED: The held-out 60-verse sample is strictly DISJOINT from all prior audit and correction loci (Zero Intersection).');
} else {
  console.error(`✗ INTERSECTION FAILURE: Found ${intersection.length} overlapping verses!`);
  console.error(JSON.stringify(intersection, null, 2));
  process.exit(1);
}

// 4. Save audit verification certificate
const cert = {
  verification_date: new Date().toISOString(),
  exclusion_manifest: {
    total_verses: unifiedExclusions.length,
    sha256: exclusionHash
  },
  held_out_sample: {
    total_verses: allSampleVerses.length,
    languages: {
      hebrew: sampleData.hebrew.length,
      greek: sampleData.greek.length,
      aramaic: sampleData.aramaic.length
    },
    sha256: sampleHash
  },
  intersection_size: intersection.length,
  status: 'STRICTLY_DISJOINT_AND_FROZEN'
};

fs.writeFileSync(path.resolve(__dirname, 'sample_independence_certificate.json'), JSON.stringify(cert, null, 2), 'utf8');
console.log('Saved certificate to: sample_independence_certificate.json');
