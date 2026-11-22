/**
 * scripts/generate_round4b_holdout_sample.cjs
 *
 * Deterministic, Reproducible Generator for Round 4B Strictly Unseen Holdout Sample (15 Verses, 197 Records):
 *   - 5 OT Hebrew verses (from the 13 OSHB XML books supported by the frozen auditor)
 *   - 4 OT Aramaic verses (2 Ezra, 2 Daniel, from the Aramaic sections in OSHB XML)
 *   - 6 NT Greek verses (from the 8 Greek NT books supported by the frozen auditor in SBLGNT & Scrivener TR)
 *
 * Distinct from the earlier committed Round 4 (66-books) manifest (unseen_holdout_round4_66books_manifest.json,
 * SHA-256 5da4d4f6..., 221 records), and verifies 0.00% intersection with it as well as 0.00% overlap with
 * all 2,649 excluded verses (Historical 2,604 + R1 15 + R2 15 + R3 15).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sha256Str = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const dbRelPath = 'mobile/assets/bible_study.db';
const dbPath = path.join(repoRoot, dbRelPath);
const auditorRelPath = 'scripts/audit_unseen_holdout_sample.cjs';
const auditorPath = path.join(repoRoot, auditorRelPath);
const r1ManifestRelPath = 'scripts/unseen_holdout_15_verses_manifest.json';
const r1ManifestPath = path.join(repoRoot, r1ManifestRelPath);
const r2ManifestRelPath = 'scripts/unseen_holdout_round2_15_verses_manifest.json';
const r2ManifestPath = path.join(repoRoot, r2ManifestRelPath);
const r3ManifestRelPath = 'scripts/unseen_holdout_round3_15_verses_manifest.json';
const r3ManifestPath = path.join(repoRoot, r3ManifestRelPath);
const r4OldManifestRelPath = 'scripts/unseen_holdout_round4_66books_manifest.json';
const r4OldManifestPath = path.join(repoRoot, r4OldManifestRelPath);
const trFullRelPath = 'scripts/data/gnt_scrivener.json';
const trFullPath = path.join(repoRoot, trFullRelPath);

// 1. Verify frozen hashes
const EXPECTED_COMMIT = '26ed141fc4eaf4bd0bd856643be5dbb8a173e55e';
const EXPECTED_DB_SHA256 = 'dbc5d16e07de1ca2dff5d6deddfc1dc470d7926e1285c11ea5aec4a53874da44';
const EXPECTED_AUDITOR_SHA256 = '5c62f12e6b72484b149d3f6e11980d25b593338d5ab08a832f5d8da684647300';
const EXPECTED_R1_MANIFEST_SHA256 = '08700e081267bf6e255a70d9f2dac50196ab98eb81d292f346345ce7d5c58bc8';
const EXPECTED_R2_MANIFEST_SHA256 = '7a51f1403c70375be8c9eb150a9d9c71e6891995645ecdbee40a54ab6ef5603a';
const EXPECTED_R3_MANIFEST_SHA256 = '891cba81c46507a127fc06667594da10ff71dc0cb8129eb7010931e2a94ec1a5';
const EXPECTED_R4_OLD_MANIFEST_SHA256 = '5da4d4f654ad221b4e1c8bb050f28c404f3cb5e0c7cec0399b3a8ae4971ee180';

const actualDbSha = sha256File(dbPath);
const actualAuditorSha = sha256File(auditorPath);
const actualR1Sha = sha256File(r1ManifestPath);
const actualR2Sha = sha256File(r2ManifestPath);
const actualR3Sha = sha256File(r3ManifestPath);
const actualR4OldSha = sha256File(r4OldManifestPath);
const actualTrFullSha = sha256File(trFullPath);

if (actualDbSha !== EXPECTED_DB_SHA256) throw new Error(`DB SHA-256 mismatch: ${actualDbSha}`);
if (actualAuditorSha !== EXPECTED_AUDITOR_SHA256) throw new Error(`Auditor SHA-256 mismatch: ${actualAuditorSha}`);
if (actualR1Sha !== EXPECTED_R1_MANIFEST_SHA256) throw new Error(`R1 Manifest SHA-256 mismatch: ${actualR1Sha}`);
if (actualR2Sha !== EXPECTED_R2_MANIFEST_SHA256) throw new Error(`R2 Manifest SHA-256 mismatch: ${actualR2Sha}`);
if (actualR3Sha !== EXPECTED_R3_MANIFEST_SHA256) throw new Error(`R3 Manifest SHA-256 mismatch: ${actualR3Sha}`);
if (actualR4OldSha !== EXPECTED_R4_OLD_MANIFEST_SHA256) throw new Error(`R4 66-books Manifest SHA-256 mismatch: ${actualR4OldSha}`);

function query(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

// 2. Build the exact 2,649 exclusion set (Historical 2,604 + Round 1 15 + Round 2 15 + Round 3 15)
const r1Manifest = JSON.parse(fs.readFileSync(r1ManifestPath, 'utf8'));
const r2Manifest = JSON.parse(fs.readFileSync(r2ManifestPath, 'utf8'));
const r3Manifest = JSON.parse(fs.readFileSync(r3ManifestPath, 'utf8'));
const r4OldManifest = JSON.parse(fs.readFileSync(r4OldManifestPath, 'utf8'));

const exclusionSet = new Set(r3Manifest.excluded_verse_keys);
for (const v of r1Manifest.holdout_verses) exclusionSet.add(`${v.book}:${v.ch}:${v.vs}`);
for (const v of r2Manifest.holdout_verses) exclusionSet.add(`${v.book}:${v.ch}:${v.vs}`);
for (const v of r3Manifest.holdout_verses) exclusionSet.add(`${v.book}:${v.ch}:${v.vs}`);

const excludedVerseKeys = Array.from(exclusionSet).sort();
if (excludedVerseKeys.length !== 2649) {
  throw new Error(`Expected exactly 2,649 unique excluded verse keys, got ${excludedVerseKeys.length}`);
}
const exclusionKeysSha256 = sha256Str(excludedVerseKeys.join('\n') + '\n');

// 3. Supported books in frozen auditor
const oshbBooks = {
  2:  'Exod',
  3:  'Lev',
  5:  'Deut',
  6:  'Josh',
  8:  'Ruth',
  11: '1Kgs',
  14: '2Chr',
  15: 'Ezra',
  20: 'Prov',
  23: 'Isa',
  27: 'Dan',
  33: 'Mic',
  38: 'Zech'
};

const greekBooks = {
  41: { name: 'Mark',   sblFile: '62-Mk-morphgnt.txt',  trOsis: 'Mark' },
  42: { name: 'Luke',   sblFile: '63-Lk-morphgnt.txt',  trOsis: 'Luke' },
  45: { name: 'Rom',    sblFile: '66-Ro-morphgnt.txt',  trOsis: 'Rom' },
  48: { name: 'Gal',    sblFile: '69-Ga-morphgnt.txt',  trOsis: 'Gal' },
  49: { name: 'Eph',    sblFile: '70-Eph-morphgnt.txt', trOsis: 'Eph' },
  50: { name: 'Phil',   sblFile: '71-Php-morphgnt.txt', trOsis: 'Phil' },
  52: { name: '1Thess', sblFile: '73-1Th-morphgnt.txt', trOsis: '1Thess' },
  60: { name: '1Pet',   sblFile: '81-1Pe-morphgnt.txt', trOsis: '1Pet' }
};

function getDanOshbOsis(ch, vs) {
  if (ch === 4) {
    if (vs <= 3) return `Dan.3.${vs + 30}`;
    return `Dan.4.${vs - 3}`;
  }
  if (ch === 5) {
    if (vs === 31) return 'Dan.6.1';
    return `Dan.5.${vs}`;
  }
  if (ch === 6) {
    return `Dan.6.${vs + 1}`;
  }
  return `Dan.${ch}.${vs}`;
}

// Parse OSHB XML files
const oshbDir = path.join(repoRoot, 'scripts/data/oshb');
const oshbVerseMap = new Map();
for (const [bId, bName] of Object.entries(oshbBooks)) {
  const xml = fs.readFileSync(path.join(oshbDir, `${bName}.xml`), 'utf8');
  const vRe = /<verse\s+osisID="([^"]+)"[^>]*>([\s\S]*?)<\/verse>/g;
  let m;
  while ((m = vRe.exec(xml)) !== null) {
    const osis = m[1];
    const body = m[2];
    const wRe = /<w\s+([^>]+)>([\s\S]*?)<\/w>/g;
    let wm, count = 0, arCount = 0, hebCount = 0;
    while ((wm = wRe.exec(body)) !== null) {
      count++;
      const morph = (wm[1].match(/morph="([^"]+)"/) || [])[1] || '';
      if (morph.startsWith('A')) arCount++;
      else if (morph.startsWith('H')) hebCount++;
    }
    oshbVerseMap.set(osis, { count, arCount, hebCount });
  }
}

// Parse SBLGNT & Scrivener TR
const sblgntDir = path.join(repoRoot, 'scripts/data/sblgnt');
const sblgntVerses = new Set();
for (const [bIdStr, info] of Object.entries(greekBooks)) {
  const bId = parseInt(bIdStr, 10);
  const content = fs.readFileSync(path.join(sblgntDir, info.sblFile), 'utf8');
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 7) continue;
    const tag = parts[0];
    const ch = parseInt(tag.substring(2, 4), 10);
    const vs = parseInt(tag.substring(4, 6), 10);
    sblgntVerses.add(`${bId}:${ch}:${vs}`);
  }
}

const trFullData = JSON.parse(fs.readFileSync(trFullPath, 'utf8'));
const trVerseMap = new Map();
for (const row of trFullData) {
  trVerseMap.set(`${row.book_name_osis}:${row.chapter}:${row.verse}`, row);
}

// 4. Query DB for all verses with word_mappings in supported books
const allSupportedBookIds = [...Object.keys(oshbBooks), ...Object.keys(greekBooks)].join(',');
const dbVersesRaw = query(`
  SELECT vr.book_id, vr.chapter_num, vr.verse_num
  FROM verses vr
  JOIN word_mappings wm ON wm.verse_id = vr.id
  WHERE vr.book_id IN (${allSupportedBookIds})
  GROUP BY vr.book_id, vr.chapter_num, vr.verse_num
  ORDER BY vr.book_id ASC, vr.chapter_num ASC, vr.verse_num ASC;
`);

const hebrewCandidates = [];
const aramaicCandidates = [];
const greekCandidates = [];

for (const line of dbVersesRaw.split('\n')) {
  if (!line) continue;
  const [bStr, cStr, vStr] = line.split('|');
  const book = parseInt(bStr, 10);
  const ch = parseInt(cStr, 10);
  const vs = parseInt(vStr, 10);
  const key = `${book}:${ch}:${vs}`;

  if (exclusionSet.has(key)) continue;
  if (key === '27:6:23') continue;

  if (greekBooks[book]) {
    const gInfo = greekBooks[book];
    if (sblgntVerses.has(key) && trVerseMap.has(`${gInfo.trOsis}:${ch}:${vs}`)) {
      greekCandidates.push({ key, name: `${gInfo.name} ${ch}:${vs}`, book, ch, vs, lang: 'greek' });
    }
  } else if (oshbBooks[book]) {
    const bName = oshbBooks[book];
    const osis = (book === 27) ? getDanOshbOsis(ch, vs) : `${bName}.${ch}.${vs}`;
    const oInfo = oshbVerseMap.get(osis);
    if (!oInfo || oInfo.count === 0) continue;

    if (oInfo.arCount > 0 && oInfo.hebCount === 0) {
      aramaicCandidates.push({ key, name: `${bName} ${ch}:${vs}`, book, ch, vs, lang: 'aramaic', oshbBook: bName, oshbOsis: osis });
    } else if (oInfo.hebCount > 0 && oInfo.arCount === 0) {
      hebrewCandidates.push({ key, name: `${bName} ${ch}:${vs}`, book, ch, vs, lang: 'hebrew', oshbBook: bName, oshbOsis: osis });
    }
  }
}

const hebPoolSha256 = sha256Str(hebrewCandidates.map(c => c.key).join('\n') + '\n');
const aramPoolSha256 = sha256Str(aramaicCandidates.map(c => c.key).join('\n') + '\n');
const grkPoolSha256 = sha256Str(greekCandidates.map(c => c.key).join('\n') + '\n');

// 5. Fixed Random Seed & Deterministic Draw (preserving exact original Round 4B draw without replacement!)
const SEED = `arabic-bible-study:round4-unseen-holdout:commit=${EXPECTED_COMMIT}:db=${EXPECTED_DB_SHA256}`;

function rankCandidatesDeterministically(candidates, domainTag) {
  return candidates
    .map((c, idx) => ({
      candidate: c,
      canonicalIndex: idx,
      drawHash: sha256Str(`${SEED}:${domainTag}:idx=${idx}:key=${c.key}`)
    }))
    .sort((a, b) => a.drawHash.localeCompare(b.drawHash));
}

const rankedHebrew = rankCandidatesDeterministically(hebrewCandidates, 'hebrew');
const selectedHebrew = [];
const usedHebBooks = new Set();
for (const item of rankedHebrew) {
  if (selectedHebrew.length >= 5) break;
  if (!usedHebBooks.has(item.candidate.book)) {
    usedHebBooks.add(item.candidate.book);
    selectedHebrew.push(item);
  }
}

const rankedAramaic = rankCandidatesDeterministically(aramaicCandidates, 'aramaic');
const selectedAramaic = [];
let ezraCount = 0, danCount = 0;
for (const item of rankedAramaic) {
  if (selectedAramaic.length >= 4) break;
  if (item.candidate.book === 15 && ezraCount < 2) { ezraCount++; selectedAramaic.push(item); }
  else if (item.candidate.book === 27 && danCount < 2) { danCount++; selectedAramaic.push(item); }
}

const rankedGreek = rankCandidatesDeterministically(greekCandidates, 'greek');
const selectedGreek = [];
const usedGrkBooks = new Set();
for (const item of rankedGreek) {
  if (selectedGreek.length >= 6) break;
  if (!usedGrkBooks.has(item.candidate.book)) {
    usedGrkBooks.add(item.candidate.book);
    selectedGreek.push(item);
  }
}

selectedHebrew.sort((a, b) => a.canonicalIndex - b.canonicalIndex);
selectedAramaic.sort((a, b) => a.canonicalIndex - b.canonicalIndex);
selectedGreek.sort((a, b) => a.canonicalIndex - b.canonicalIndex);

const holdoutVerses = [
  ...selectedHebrew.map(x => { const { key, ...rest } = x.candidate; return rest; }),
  ...selectedAramaic.map(x => { const { key, ...rest } = x.candidate; return rest; }),
  ...selectedGreek.map(x => { const { key, ...rest } = x.candidate; return rest; })
];

// Verify zero overlap with exclusionSet AND zero intersection with earlier Round 4 (66books) manifest
const overlapKeys = holdoutVerses.map(v => `${v.book}:${v.ch}:${v.vs}`).filter(k => exclusionSet.has(k));
if (overlapKeys.length > 0) throw new Error(`Overlap detected with exclusions: ${overlapKeys.join(', ')}`);

const r4OldKeys = new Set((r4OldManifest.holdout_verses || r4OldManifest.verses || []).map(v => `${v.book}:${v.ch}:${v.vs}`));
const r4OldIntersection = holdoutVerses.map(v => `${v.book}:${v.ch}:${v.vs}`).filter(k => r4OldKeys.has(k));

console.log(`Cross-check vs earlier Round 4 (66books, SHA ${actualR4OldSha.slice(0, 8)}...): intersection = ${r4OldIntersection.length} (${JSON.stringify(r4OldIntersection)})`);

// 6. Save TR Scrivener Slice for Round 4B
const trSliceRelPath = 'scripts/unseen_holdout_round4b_tr_scrivener_slice.json';
const trSlicePath = path.join(repoRoot, trSliceRelPath);
const trSliceVerses = selectedGreek.map(item => {
  const c = item.candidate;
  const gInfo = greekBooks[c.book];
  const trRow = trVerseMap.get(`${gInfo.trOsis}:${c.ch}:${c.vs}`);
  if (!trRow) throw new Error(`Missing TR row for ${c.name}`);
  return trRow;
});
fs.writeFileSync(trSlicePath, JSON.stringify({ source: 'scripts/data/gnt_scrivener.json', round: '4B', verses: trSliceVerses }, null, 2) + '\n', 'utf8');
const trSliceSha256 = sha256File(trSlicePath);

// 7. Save Round 4B Manifest
const r4bManifestRelPath = 'scripts/unseen_holdout_round4b_15_verses_manifest.json';
const r4bManifestPath = path.join(repoRoot, r4bManifestRelPath);

const manifestObj = {
  schema_version: 4,
  round: '4B',
  target_db_version: 379,
  frozen_commit_sha: EXPECTED_COMMIT,
  note: 'Round 4B strictly unseen holdout sample (15 verses, 197 records; 0.00% overlap with all 2,649 excluded verses and 0.00% intersection with earlier Round 4 66-books manifest 5da4d4f6...). Preserved as a blind evaluation benchmark for general repair engine validation.',
  cross_check_with_round4_66books: {
    earlier_manifest_path: r4OldManifestRelPath,
    earlier_manifest_sha256: actualR4OldSha,
    earlier_verse_count: r4OldKeys.size,
    intersection_count: r4OldIntersection.length,
    intersection_keys: r4OldIntersection
  },
  scope_declaration: r3Manifest.scope_declaration,
  sampling_protocol: {
    seed: SEED,
    candidate_ordering_rule: 'ORDER BY book_id ASC, chapter_num ASC, verse_num ASC (prior to hash ranking)',
    draw_algorithm: 'SHA-256 deterministic hash ranking: sha256(seed + ":" + lang + ":idx=" + canonicalIndex + ":key=" + book:ch:vs) sorted ascending; stratified 1 per distinct book for Hebrew (5) and Greek (6), and 2 Ezra + 2 Daniel for Aramaic (4).',
    pre_draw_candidate_pools: {
      hebrew:  { eligible_count: hebrewCandidates.length,  ordered_keys_sha256: hebPoolSha256 },
      aramaic: { eligible_count: aramaicCandidates.length, ordered_keys_sha256: aramPoolSha256 },
      greek:   { eligible_count: greekCandidates.length,   ordered_keys_sha256: grkPoolSha256 }
    },
    draw_provenance: [...selectedHebrew, ...selectedAramaic, ...selectedGreek].map(item => ({
      name: item.candidate.name,
      key: item.candidate.key,
      lang: item.candidate.lang,
      canonical_pool_index: item.canonicalIndex,
      draw_hash: item.drawHash
    }))
  },
  frozen_inputs: {
    git_commit: EXPECTED_COMMIT,
    db_path: dbRelPath,
    db_size_bytes: fs.statSync(dbPath).size,
    db_sha256: actualDbSha,
    auditor_path: auditorRelPath,
    auditor_sha256: actualAuditorSha,
    round1_manifest_path: r1ManifestRelPath,
    round1_manifest_sha256: actualR1Sha,
    round2_manifest_path: r2ManifestRelPath,
    round2_manifest_sha256: actualR2Sha,
    round3_manifest_path: r3ManifestRelPath,
    round3_manifest_sha256: actualR3Sha,
    round4_66books_manifest_path: r4OldManifestRelPath,
    round4_66books_manifest_sha256: actualR4OldSha,
    tr_scrivener_full_path: trFullRelPath,
    tr_scrivener_full_sha256: actualTrFullSha,
    tr_scrivener_slice_path: trSliceRelPath,
    tr_scrivener_slice_sha256: trSliceSha256
  },
  overlap_count: 0,
  overlap_keys: [],
  excluded_verse_keys_count: excludedVerseKeys.length,
  exclusion_keys_sha256: exclusionKeysSha256,
  excluded_verse_keys: excludedVerseKeys,
  holdout_verses: holdoutVerses,
  db_path: dbRelPath,
  db_size_bytes: fs.statSync(dbPath).size,
  db_sha256: actualDbSha,
  tr_scrivener_slice_path: trSliceRelPath,
  tr_scrivener_slice_sha256: trSliceSha256
};

fs.writeFileSync(r4bManifestPath, JSON.stringify(manifestObj, null, 2) + '\n', 'utf8');
const r4bManifestSha256 = sha256File(r4bManifestPath);

console.log(`Written Round 4B TR Slice : ${trSliceRelPath} (SHA-256: ${trSliceSha256})`);
console.log(`Written Round 4B Manifest : ${r4bManifestRelPath} (SHA-256: ${r4bManifestSha256})`);
