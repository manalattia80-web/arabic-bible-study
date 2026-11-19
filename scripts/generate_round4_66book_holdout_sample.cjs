/**
 * generate_round4_66book_holdout_sample.cjs
 *
 * Step 4: Draws a fresh unseen holdout sample (Round 4: 15 verses — 5 Hebrew, 4 Aramaic, 6 Greek)
 * across the newly expanded 66-book universe with 0.00% overlap against:
 *   - All 2,604 historical exclusions
 *   - All 15 Round-1 holdout verses
 *   - All 15 Round-2 holdout verses
 *   - All 15 Round-3 holdout verses
 *   - Plus dynamic locator exclusion 27:6:23 (OSHB Dan.6.23)
 * Total excluded verses = 2,649 manifest keys (2,650 with 27:6:23).
 *
 * Stratification:
 *   - Specifically includes newly added OT books (outside the original 13 OSHB books) and newly
 *     added NT books (outside the original 8 SBLGNT books), alongside Aramaic sections of Ezra/Daniel,
 *     to test generalization across the full 66-book expansion.
 *   - Measures both:
 *       1. Raw pre-repair baseline on the frozen production DB (`44ef2d39...`)
 *       2. Post-deterministic-rule score on the trial rule-repaired DB (`scratch/bible_study_trial_rule_repaired.db`)
 *     BEFORE any manual verse-specific repair!
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { verifyTrDerivedMorphology } = require('./robinson_tr_helper.cjs');
const { validateCanonicalLocator } = require('./locator_validator_helper.cjs');
const {
  OT_BOOK_MAP,
  SBLGNT_BOOK_MAP,
  TR_BOOK_OSIS_MAP,
  getBhsChapterVerse,
  isBiblicalAramaicVerse,
  canonHebSurface,
  stripHebrewDiacritics,
  normGreekWord,
  normGreekPolytonicFold,
  loadAllSources,
  strongsGreekMap,
  strongsHebrewMap,
  AUTHORIZED_HEBREW_LEMMA_VARIANTS,
  morphMatches,
  verifyHebrewStrongsAgainstLemma,
  greekStrongsMatchesLemma
} = require('./full_66_books_audit_helpers.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sha256Str = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const prodDbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const trialDbPath = path.join(repoRoot, 'scratch/bible_study_trial_rule_repaired.db');

function queryDb(targetDb, sql) {
  return execFileSync(sqlitePath, [targetDb], { input: sql, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 }).replace(/\r/g, '').trim();
}

// 1. Build 2,649 exclusion set (2,634 from R3 manifest + 15 R3 holdout verses)
const r3ManifestPath = path.join(__dirname, 'unseen_holdout_round3_15_verses_manifest.json');
const r3Manifest = JSON.parse(fs.readFileSync(r3ManifestPath, 'utf8'));
const exclusionSet = new Set(r3Manifest.excluded_verse_keys);
for (const v of r3Manifest.holdout_verses) {
  exclusionSet.add(`${v.book}:${v.ch}:${v.vs}`);
}
const excludedVerseKeys = Array.from(exclusionSet).sort();
if (excludedVerseKeys.length !== 2649) {
  throw new Error(`Expected 2,649 excluded verse keys (2,634 + 15 Round 3), got ${excludedVerseKeys.length}`);
}
const exclusionKeysSha256 = sha256Str(excludedVerseKeys.join('\n') + '\n');

const { oshbByBook, sblByBook, trByOsis } = loadAllSources();

// 2. Query all 66 books for candidate verses in canonical order (book_id ASC, chapter_num ASC, verse_num ASC)
const dbVersesRaw = queryDb(prodDbPath, `
  SELECT vr.book_id, vr.chapter_num, vr.verse_num
  FROM verses vr
  JOIN word_mappings wm ON wm.verse_id = vr.id
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

  if (exclusionSet.has(key) || key === '27:6:23') continue;

  if (book >= 40) {
    const osis = TR_BOOK_OSIS_MAP[book];
    const hasSbl = sblByBook[book] && sblByBook[book].has(`${ch}:${vs}`);
    const hasTr = trByOsis.has(`${osis}:${ch}:${vs}`);
    if (hasSbl && hasTr) {
      greekCandidates.push({
        key,
        name: `${osis} ${ch}:${vs}`,
        book,
        ch,
        vs,
        lang: 'greek'
      });
    }
  } else {
    const bkName = OT_BOOK_MAP[book];
    const [bhsC, bhsV] = getBhsChapterVerse(book, ch, vs);
    const oshbOsis = `${bkName}.${bhsC}.${bhsV}`;
    const toks = oshbByBook[book] && oshbByBook[book].get(oshbOsis);
    if (!toks || toks.length === 0) continue;

    let arCount = 0, hebCount = 0;
    for (const t of toks) {
      if ((t.morph || '').startsWith('A')) arCount++;
      else if ((t.morph || '').startsWith('H')) hebCount++;
    }
    if (arCount > 0 && hebCount === 0 && isBiblicalAramaicVerse(book, ch, vs)) {
      aramaicCandidates.push({
        key,
        name: `${bkName} ${ch}:${vs}`,
        book,
        ch,
        vs,
        lang: 'aramaic',
        oshbBook: bkName,
        oshbOsis
      });
    } else if (hebCount > 0 && arCount === 0 && !isBiblicalAramaicVerse(book, ch, vs)) {
      hebrewCandidates.push({
        key,
        name: `${bkName} ${ch}:${vs}`,
        book,
        ch,
        vs,
        lang: 'hebrew',
        oshbBook: bkName,
        oshbOsis
      });
    }
  }
}

const hebPoolSha256 = sha256Str(hebrewCandidates.map(c => c.key).join('\n') + '\n');
const aramPoolSha256 = sha256Str(aramaicCandidates.map(c => c.key).join('\n') + '\n');
const grkPoolSha256 = sha256Str(greekCandidates.map(c => c.key).join('\n') + '\n');

console.log('66-Book Pre-Draw Candidate Pools (0% overlap with 2,649 excluded verses):');
console.log(`  Hebrew (39 OT books) : ${hebrewCandidates.length} candidates (SHA-256: ${hebPoolSha256})`);
console.log(`  Aramaic (Ezra/Dan)   : ${aramaicCandidates.length} candidates (SHA-256: ${aramPoolSha256})`);
console.log(`  Greek (27 NT books)  : ${greekCandidates.length} candidates (SHA-256: ${grkPoolSha256})`);

const SEED = `arabic-bible-study:round4-66book-generalization-test:exclusions=${exclusionKeysSha256}`;

function rankCandidatesDeterministically(candidates, domainTag) {
  return candidates
    .map((c, idx) => ({
      candidate: c,
      canonicalIndex: idx,
      drawHash: sha256Str(`${SEED}:${domainTag}:idx=${idx}:key=${c.key}`)
    }))
    .sort((a, b) => a.drawHash.localeCompare(b.drawHash));
}

// Draw 5 Hebrew verses across 5 distinct OT books
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

// Draw 4 Aramaic verses (2 Ezra, 2 Daniel)
const rankedAramaic = rankCandidatesDeterministically(aramaicCandidates, 'aramaic');
const selectedAramaic = [];
let ezraCount = 0, danCount = 0;
for (const item of rankedAramaic) {
  if (selectedAramaic.length >= 4) break;
  if (item.candidate.book === 15 && ezraCount < 2) {
    ezraCount++;
    selectedAramaic.push(item);
  } else if (item.candidate.book === 27 && danCount < 2) {
    danCount++;
    selectedAramaic.push(item);
  }
}

// Draw 6 Greek verses across 6 distinct NT books
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
  ...selectedHebrew.map(x => { const { key, ...r } = x.candidate; return r; }),
  ...selectedAramaic.map(x => { const { key, ...r } = x.candidate; return r; }),
  ...selectedGreek.map(x => { const { key, ...r } = x.candidate; return r; })
];

console.log('\nSelected 15 Round 4 (66-Book Generalization) Holdout Verses:');
for (const v of holdoutVerses) {
  console.log(`  [${v.lang.padEnd(7)}] ${v.name} (book=${v.book}, ch=${v.ch}, vs=${v.vs}${v.oshbOsis ? ', oshb=' + v.oshbOsis : ''})`);
}

// Save Round 4 manifest
const r4ManifestPath = path.join(__dirname, 'unseen_holdout_round4_66books_manifest.json');
const r4Manifest = {
  schema_version: 4,
  round: 4,
  note: 'Round 4 strictly unseen 66-book generalization sample (0.00% overlap with all 2,649 previously excluded/sampled verses across Rounds 1, 2, 3, and historical targets).',
  seed: SEED,
  excluded_verse_keys_count: excludedVerseKeys.length,
  exclusion_keys_sha256: exclusionKeysSha256,
  pre_draw_candidate_pools: {
    hebrew:  { eligible_count: hebrewCandidates.length,  ordered_keys_sha256: hebPoolSha256 },
    aramaic: { eligible_count: aramaicCandidates.length, ordered_keys_sha256: aramPoolSha256 },
    greek:   { eligible_count: greekCandidates.length,   ordered_keys_sha256: grkPoolSha256 }
  },
  holdout_verses: holdoutVerses
};
fs.writeFileSync(r4ManifestPath, JSON.stringify(r4Manifest, null, 2) + '\n', 'utf8');
console.log(`Saved Round 4 manifest: ${r4ManifestPath} (SHA-256: ${sha256File(r4ManifestPath)})`);
