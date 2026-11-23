/**
 * scripts/generate_round6_holdout_sample.cjs
 *
 * Deterministic, Reproducible Generator for Round 6 STRICTLY BLIND Holdout Sample (15 Verses):
 *   - 5 OT Hebrew verses (5 distinct OSHB books)
 *   - 4 OT Aramaic verses (2 Ezra, 2 Daniel)
 *   - 6 NT Greek verses (6 distinct SBLGNT/TR books)
 *
 * Strictly zero-overlap (0.00%) against ALL previously excluded/seen verses:
 *   Historical (2,604) + R1 (15) + R2 (15) + R3 (15) + R4B (15) + R4_66books (15) + R5 (15)
 *   + Protected Adjudicated Registry (92 verses) + 27:6:23.
 * Tied cryptographically to v1.0.381 commit (39fac51), v381 DB (51320ced...),
 * and FROZEN Engine v1.4 (7e2ced15...) PRIOR to sampling.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { loadProtectedAdjudicatedVerses } = require('./protected_adjudicated_registry.cjs');

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
const engineRelPath = 'scripts/whole_verse_general_repair_engine.cjs';
const enginePath = path.join(repoRoot, engineRelPath);
const r5ManifestRelPath = 'scripts/unseen_holdout_round5_15_verses_manifest.json';
const r5ManifestPath = path.join(repoRoot, r5ManifestRelPath);
const trFullRelPath = 'scripts/data/gnt_scrivener.json';
const trFullPath = path.join(repoRoot, trFullRelPath);

const EXPECTED_COMMIT = '39fac5159110e3790973e1d4eb256dd83280b31f';
const EXPECTED_DB_SHA256 = '51320cedde4a1bd801b7c108b5566d8879e88cf10998d11b42a75975323c7496';
const EXPECTED_AUDITOR_SHA256 = '5c62f12e6b72484b149d3f6e11980d25b593338d5ab08a832f5d8da684647300';
const EXPECTED_ENGINE_V14_SHA256 = '7e2ced154095cc94e33ddbc24da01178ea7a7c82bfdb44ee34176f2e77eeb74b';
const EXPECTED_R5_SHA256 = 'defc65bba30137deaa042901166f6870c40ec16abb4c198f95d9a3a579f7bc97';

const actualDbSha = sha256File(dbPath);
const actualAuditorSha = sha256File(auditorPath);
const actualEngineSha = sha256File(enginePath);
const actualR5Sha = sha256File(r5ManifestPath);
const actualTrFullSha = sha256File(trFullPath);

if (actualDbSha !== EXPECTED_DB_SHA256) throw new Error(`DB SHA-256 mismatch: ${actualDbSha}`);
if (actualAuditorSha !== EXPECTED_AUDITOR_SHA256) throw new Error(`Auditor SHA-256 mismatch: ${actualAuditorSha}`);
if (actualEngineSha !== EXPECTED_ENGINE_V14_SHA256) throw new Error(`Engine v1.4 SHA-256 mismatch: ${actualEngineSha}`);
if (actualR5Sha !== EXPECTED_R5_SHA256) throw new Error(`R5 Manifest SHA-256 mismatch: ${actualR5Sha}`);

function query(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

const r5Manifest = JSON.parse(fs.readFileSync(r5ManifestPath, 'utf8'));
const protectedKeys = loadProtectedAdjudicatedVerses();

const exclusionSet = new Set(r5Manifest.excluded_verse_keys);
for (const v of r5Manifest.holdout_verses) exclusionSet.add(`${v.book}:${v.ch}:${v.vs}`);
for (const k of protectedKeys) exclusionSet.add(k);
exclusionSet.add('27:6:23');

const excludedVerseKeys = Array.from(exclusionSet).sort();
const exclusionKeysSha256 = sha256Str(excludedVerseKeys.join('\n') + '\n');

const oshbBooks = {
  2: 'Exod', 3: 'Lev', 5: 'Deut', 6: 'Josh', 8: 'Ruth', 11: '1Kgs',
  14: '2Chr', 15: 'Ezra', 20: 'Prov', 23: 'Isa', 27: 'Dan', 33: 'Mic', 38: 'Zech'
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
  if (ch === 4) return vs <= 3 ? `Dan.3.${vs + 30}` : `Dan.4.${vs - 3}`;
  if (ch === 5) return vs === 31 ? 'Dan.6.1' : `Dan.5.${vs}`;
  if (ch === 6) return `Dan.6.${vs + 1}`;
  return `Dan.${ch}.${vs}`;
}

const oshbDir = path.join(repoRoot, 'scripts/data/oshb');
const oshbVerseMap = new Map();
for (const [bId, bName] of Object.entries(oshbBooks)) {
  const xml = fs.readFileSync(path.join(oshbDir, `${bName}.xml`), 'utf8');
  const vRe = /<verse\s+osisID="([^"]+)"[^>]*>([\s\S]*?)<\/verse>/g;
  let m;
  while ((m = vRe.exec(xml)) !== null) {
    const osis = m[1], body = m[2];
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
    sblgntVerses.add(`${bId}:${parseInt(tag.substring(2, 4), 10)}:${parseInt(tag.substring(4, 6), 10)}`);
  }
}

const trFullData = JSON.parse(fs.readFileSync(trFullPath, 'utf8'));
const trVerseMap = new Map();
for (const row of trFullData) trVerseMap.set(`${row.book_name_osis}:${row.chapter}:${row.verse}`, row);

const allSupportedBookIds = [...Object.keys(oshbBooks), ...Object.keys(greekBooks)].join(',');
const dbVersesRaw = query(`
  SELECT vr.book_id, vr.chapter_num, vr.verse_num
  FROM verses vr JOIN word_mappings wm ON wm.verse_id = vr.id
  WHERE vr.book_id IN (${allSupportedBookIds})
  GROUP BY vr.book_id, vr.chapter_num, vr.verse_num
  ORDER BY vr.book_id ASC, vr.chapter_num ASC, vr.verse_num ASC;
`);

const hebrewCandidates = [], aramaicCandidates = [], greekCandidates = [];
for (const line of dbVersesRaw.split('\n')) {
  if (!line) continue;
  const [bStr, cStr, vStr] = line.split('|');
  const book = parseInt(bStr, 10), ch = parseInt(cStr, 10), vs = parseInt(vStr, 10);
  const key = `${book}:${ch}:${vs}`;
  if (exclusionSet.has(key)) continue;

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

const SEED = `arabic-bible-study:round6-blind-holdout-v1.4:commit=${EXPECTED_COMMIT}:db=${EXPECTED_DB_SHA256}:engine=${EXPECTED_ENGINE_V14_SHA256}`;
function rank(candidates, tag) {
  return candidates
    .map((c, idx) => ({ candidate: c, canonicalIndex: idx, drawHash: sha256Str(`${SEED}:${tag}:idx=${idx}:key=${c.key}`) }))
    .sort((a, b) => a.drawHash.localeCompare(b.drawHash));
}

const selectedHebrew = [], usedHeb = new Set();
for (const item of rank(hebrewCandidates, 'hebrew')) {
  if (selectedHebrew.length >= 5) break;
  if (!usedHeb.has(item.candidate.book)) { usedHeb.add(item.candidate.book); selectedHebrew.push(item); }
}
const selectedAramaic = [];
let ezraC = 0, danC = 0;
for (const item of rank(aramaicCandidates, 'aramaic')) {
  if (selectedAramaic.length >= 4) break;
  if (item.candidate.book === 15 && ezraC < 2) { ezraC++; selectedAramaic.push(item); }
  else if (item.candidate.book === 27 && danC < 2) { danC++; selectedAramaic.push(item); }
}
const selectedGreek = [], usedGrk = new Set();
for (const item of rank(greekCandidates, 'greek')) {
  if (selectedGreek.length >= 6) break;
  if (!usedGrk.has(item.candidate.book)) { usedGrk.add(item.candidate.book); selectedGreek.push(item); }
}

selectedHebrew.sort((a, b) => a.canonicalIndex - b.canonicalIndex);
selectedAramaic.sort((a, b) => a.canonicalIndex - b.canonicalIndex);
selectedGreek.sort((a, b) => a.canonicalIndex - b.canonicalIndex);

const holdoutVerses = [
  ...selectedHebrew.map(x => { const { key, ...rest } = x.candidate; return rest; }),
  ...selectedAramaic.map(x => { const { key, ...rest } = x.candidate; return rest; }),
  ...selectedGreek.map(x => { const { key, ...rest } = x.candidate; return rest; })
];

// Double-check 0% overlap against exclusionSet & Protected Adjudicated Registry
const overlapKeys = holdoutVerses
  .map(v => `${v.book}:${v.ch}:${v.vs}`)
  .filter(k => exclusionSet.has(k) || protectedKeys.has(k));
if (overlapKeys.length > 0) throw new Error(`FATAL overlap detected: ${overlapKeys.join(', ')}`);

const trSliceRelPath = 'scripts/unseen_holdout_round6_tr_scrivener_slice.json';
const trSlicePath = path.join(repoRoot, trSliceRelPath);
const trSliceVerses = selectedGreek.map(item => trVerseMap.get(`${greekBooks[item.candidate.book].trOsis}:${item.candidate.ch}:${item.candidate.vs}`));
fs.writeFileSync(trSlicePath, JSON.stringify({ source: 'scripts/data/gnt_scrivener.json', round: 6, verses: trSliceVerses }, null, 2) + '\n', 'utf8');
const trSliceSha256 = sha256File(trSlicePath);

const r6ManifestRelPath = 'scripts/unseen_holdout_round6_15_verses_manifest.json';
const r6ManifestPath = path.join(repoRoot, r6ManifestRelPath);
const manifestObj = {
  schema_version: 6,
  round: 6,
  target_db_version: 381,
  frozen_commit_sha: EXPECTED_COMMIT,
  frozen_engine_v14_sha256: actualEngineSha,
  note: `Round 6 STRICTLY BLIND holdout sample for frozen Engine v1.4 evaluation (0.00% overlap with all ${excludedVerseKeys.length} excluded verses: Historical + R1 + R2 + R3 + R4B + R4_66books + R5 + Protected Adjudicated Registry + 27:6:23).`,
  scope_declaration: r5Manifest.scope_declaration,
  sampling_protocol: {
    seed: SEED,
    candidate_ordering_rule: 'ORDER BY book_id ASC, chapter_num ASC, verse_num ASC (prior to hash ranking)',
    draw_algorithm: 'SHA-256 deterministic hash ranking: stratified 1 per distinct book for Hebrew (5) and Greek (6), and 2 Ezra + 2 Daniel for Aramaic (4).',
    pre_draw_candidate_pools: {
      hebrew:  { eligible_count: hebrewCandidates.length,  ordered_keys_sha256: hebPoolSha256 },
      aramaic: { eligible_count: aramaicCandidates.length, ordered_keys_sha256: aramPoolSha256 },
      greek:   { eligible_count: greekCandidates.length,   ordered_keys_sha256: grkPoolSha256 }
    },
    draw_provenance: [...selectedHebrew, ...selectedAramaic, ...selectedGreek].map(item => ({
      name: item.candidate.name, key: item.candidate.key, lang: item.candidate.lang,
      canonical_pool_index: item.canonicalIndex, draw_hash: item.drawHash
    }))
  },
  frozen_inputs: {
    git_commit: EXPECTED_COMMIT,
    db_path: dbRelPath, db_size_bytes: fs.statSync(dbPath).size, db_sha256: actualDbSha,
    engine_v14_path: engineRelPath, engine_v14_sha256: actualEngineSha,
    auditor_path: auditorRelPath, auditor_sha256: actualAuditorSha,
    round5_manifest_path: r5ManifestRelPath, round5_manifest_sha256: actualR5Sha,
    tr_scrivener_full_path: trFullRelPath, tr_scrivener_full_sha256: actualTrFullSha,
    tr_scrivener_slice_path: trSliceRelPath, tr_scrivener_slice_sha256: trSliceSha256
  },
  overlap_count: 0,
  overlap_keys: [],
  protected_registry_overlap_count: 0,
  excluded_verse_keys_count: excludedVerseKeys.length,
  exclusion_keys_sha256: exclusionKeysSha256,
  excluded_verse_keys: excludedVerseKeys,
  holdout_verses: holdoutVerses,
  db_path: dbRelPath, db_size_bytes: fs.statSync(dbPath).size, db_sha256: actualDbSha,
  tr_scrivener_slice_path: trSliceRelPath, tr_scrivener_slice_sha256: trSliceSha256
};

fs.writeFileSync(r6ManifestPath, JSON.stringify(manifestObj, null, 2) + '\n', 'utf8');
console.log(`Excluded verses: ${excludedVerseKeys.length} (0.00% overlap, 0 protected overlap)`);
console.log(`Written Round 6 TR Slice : ${trSliceRelPath} (SHA-256: ${trSliceSha256})`);
console.log(`Written Round 6 Manifest : ${r6ManifestRelPath} (SHA-256: ${sha256File(r6ManifestPath)})`);
console.log('\nSelected 15 Round 6 STRICTLY BLIND Verses:');
for (const v of holdoutVerses) console.log(`  [${v.lang.padEnd(7)}] ${v.name}`);
