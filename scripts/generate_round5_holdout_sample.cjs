/**
 * scripts/generate_round5_holdout_sample.cjs
 *
 * Deterministic, Reproducible Generator for Round 5 FINAL Blind Holdout Sample (15 Verses):
 *   - 5 OT Hebrew verses (5 distinct OSHB books)
 *   - 4 OT Aramaic verses (2 Ezra, 2 Daniel)
 *   - 6 NT Greek verses (6 distinct SBLGNT/TR books)
 *
 * Strictly zero-overlap (0.00%) against ALL 2,679 previously excluded/seen verses:
 *   Historical (2,604) + R1 (15) + R2 (15) + R3 (15) + R4B (15) + R4_66books (15).
 * Tied cryptographically to frozen v1.2 commit (e50ebe6) and frozen production DB (dbc5d16e...).
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
const r4bManifestRelPath = 'scripts/unseen_holdout_round4b_15_verses_manifest.json';
const r4bManifestPath = path.join(repoRoot, r4bManifestRelPath);
const r4OldManifestRelPath = 'scripts/unseen_holdout_round4_66books_manifest.json';
const r4OldManifestPath = path.join(repoRoot, r4OldManifestRelPath);
const trFullRelPath = 'scripts/data/gnt_scrivener.json';
const trFullPath = path.join(repoRoot, trFullRelPath);

const EXPECTED_COMMIT = 'e50ebe605f9d84f8d68cbd12cdb1d9ab9be419cb';
const EXPECTED_DB_SHA256 = 'dbc5d16e07de1ca2dff5d6deddfc1dc470d7926e1285c11ea5aec4a53874da44';
const EXPECTED_AUDITOR_SHA256 = '5c62f12e6b72484b149d3f6e11980d25b593338d5ab08a832f5d8da684647300';
const EXPECTED_R4B_SHA256 = '52d261ceb4c478063f0e0bc9bac2da8fd4439c080b6f543d20fc3a2112cd0b1b';
const EXPECTED_R4_OLD_SHA256 = '5da4d4f654ad221b4e1c8bb050f28c404f3cb5e0c7cec0399b3a8ae4971ee180';

const actualDbSha = sha256File(dbPath);
const actualAuditorSha = sha256File(auditorPath);
const actualR4bSha = sha256File(r4bManifestPath);
const actualR4OldSha = sha256File(r4OldManifestPath);
const actualTrFullSha = sha256File(trFullPath);

if (actualDbSha !== EXPECTED_DB_SHA256) throw new Error(`DB SHA-256 mismatch: ${actualDbSha}`);
if (actualAuditorSha !== EXPECTED_AUDITOR_SHA256) throw new Error(`Auditor SHA-256 mismatch: ${actualAuditorSha}`);
if (actualR4bSha !== EXPECTED_R4B_SHA256) throw new Error(`R4B Manifest SHA-256 mismatch: ${actualR4bSha}`);
if (actualR4OldSha !== EXPECTED_R4_OLD_SHA256) throw new Error(`R4 66-books Manifest SHA-256 mismatch: ${actualR4OldSha}`);

function query(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();
}

const r4bManifest = JSON.parse(fs.readFileSync(r4bManifestPath, 'utf8'));
const r4OldManifest = JSON.parse(fs.readFileSync(r4OldManifestPath, 'utf8'));

const exclusionSet = new Set(r4bManifest.excluded_verse_keys);
for (const v of r4bManifest.holdout_verses) exclusionSet.add(`${v.book}:${v.ch}:${v.vs}`);
for (const v of (r4OldManifest.holdout_verses || r4OldManifest.verses || [])) exclusionSet.add(`${v.book}:${v.ch}:${v.vs}`);

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
  if (exclusionSet.has(key) || key === '27:6:23') continue;

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

const SEED = `arabic-bible-study:round5-final-blind-holdout:commit=${EXPECTED_COMMIT}:db=${EXPECTED_DB_SHA256}`;
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

const trSliceRelPath = 'scripts/unseen_holdout_round5_tr_scrivener_slice.json';
const trSlicePath = path.join(repoRoot, trSliceRelPath);
const trSliceVerses = selectedGreek.map(item => trVerseMap.get(`${greekBooks[item.candidate.book].trOsis}:${item.candidate.ch}:${item.candidate.vs}`));
fs.writeFileSync(trSlicePath, JSON.stringify({ source: 'scripts/data/gnt_scrivener.json', round: 5, verses: trSliceVerses }, null, 2) + '\n', 'utf8');
const trSliceSha256 = sha256File(trSlicePath);

const r5ManifestRelPath = 'scripts/unseen_holdout_round5_15_verses_manifest.json';
const r5ManifestPath = path.join(repoRoot, r5ManifestRelPath);
const manifestObj = {
  schema_version: 5,
  round: 5,
  target_db_version: 379,
  frozen_commit_sha: EXPECTED_COMMIT,
  note: `Round 5 FINAL blind holdout sample for frozen Engine v1.2 evaluation (0.00% overlap with all ${excludedVerseKeys.length} excluded verses: Historical + R1 + R2 + R3 + R4B + R4_66books).`,
  scope_declaration: r4bManifest.scope_declaration,
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
    auditor_path: auditorRelPath, auditor_sha256: actualAuditorSha,
    round4b_manifest_path: r4bManifestRelPath, round4b_manifest_sha256: actualR4bSha,
    round4_66books_manifest_path: r4OldManifestRelPath, round4_66books_manifest_sha256: actualR4OldSha,
    tr_scrivener_full_path: trFullRelPath, tr_scrivener_full_sha256: actualTrFullSha,
    tr_scrivener_slice_path: trSliceRelPath, tr_scrivener_slice_sha256: trSliceSha256
  },
  overlap_count: 0,
  overlap_keys: [],
  excluded_verse_keys_count: excludedVerseKeys.length,
  exclusion_keys_sha256: exclusionKeysSha256,
  excluded_verse_keys: excludedVerseKeys,
  holdout_verses: holdoutVerses,
  db_path: dbRelPath, db_size_bytes: fs.statSync(dbPath).size, db_sha256: actualDbSha,
  tr_scrivener_slice_path: trSliceRelPath, tr_scrivener_slice_sha256: trSliceSha256
};

fs.writeFileSync(r5ManifestPath, JSON.stringify(manifestObj, null, 2) + '\n', 'utf8');
console.log(`Excluded verses: ${excludedVerseKeys.length} (0.00% overlap)`);
console.log(`Written Round 5 TR Slice : ${trSliceRelPath} (SHA-256: ${trSliceSha256})`);
console.log(`Written Round 5 Manifest : ${r5ManifestRelPath} (SHA-256: ${sha256File(r5ManifestPath)})`);
console.log('\nSelected 15 Round 5 FINAL Blind Verses:');
for (const v of holdoutVerses) console.log(`  [${v.lang.padEnd(7)}] ${v.name}`);
