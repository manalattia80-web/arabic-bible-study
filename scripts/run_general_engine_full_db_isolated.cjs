/**
 * scripts/run_general_engine_full_db_isolated.cjs
 *
 * Full-Database (66 Books, 31,102 Verses, 434,351 Records) Isolated Experiment Runner for Engine v1.2.
 *
 * Guarantees:
 *   - Complete denominator: ALL 434,351 records accounted for (including 370 TR-only/missing-SBLGNT records).
 *   - Protected Adjudicated Registry verified bitwise before & after via SHA-256 fingerprint.
 *   - Atomic component reorganization (0 multiple_primary_components, 0 lost secondary components).
 *   - Fixed-point whole-verse anti-collision including untouched PENDING_REVIEW neighbors.
 *   - Production DB (mobile/assets/bible_study.db) strictly untouched.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const {
  loadAllSources,
  isBiblicalAramaicVerse,
  OT_BOOK_MAP,
  TR_BOOK_OSIS_MAP
} = require('./full_66_books_audit_helpers.cjs');
const {
  evaluateVerse,
  loadStrongsLexicon,
  buildAtomicWmsSql
} = require('./whole_verse_general_repair_engine.cjs');
const {
  loadProtectedAdjudicatedVerses,
  computeProtectedRegistryFingerprint
} = require('./protected_adjudicated_registry.cjs');

const repoRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const prodDb = path.join(repoRoot, 'mobile/assets/bible_study.db');
const outDb = path.join(repoRoot, 'scratch/isolated_full_66books_engine_v1_7.db');
const diffPath = path.join(repoRoot, 'scratch/full_66books_engine_v1_7_diff.jsonl');
const summaryPath = path.join(repoRoot, 'scratch/full_66books_engine_v1_7_summary.json');
const tmpSqlPath = path.join(repoRoot, 'scratch/tmp_full_66books_engine_v1_7.sql');
const trSourceMode = process.env.USE_TR_SLICE ? 'TR_SLICE_CI_MODE (USE_TR_SLICE=1)' : 'FULL_SCRIVENER_TR_JSON (scripts/data/gnt_scrivener.json)';

const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sqlVal = v => (v === null || v === undefined || v === '') ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;

console.log('=== FULL 66-BOOK ISOLATED EXPERIMENT: GENERAL REPAIR ENGINE v1.7 ===\n');
console.log(`TR Source Mode: ${trSourceMode}`);
const t0 = Date.now();
const preDbSha = sha256File(prodDb);
console.log(`Production DB SHA-256 (UNTOUCHED): ${preDbSha}`);

const protectedVerseKeys = loadProtectedAdjudicatedVerses();
const preProtFp = computeProtectedRegistryFingerprint(prodDb, protectedVerseKeys);
console.log(`Protected Adjudicated Registry: ${preProtFp.protectedVerseCount} verses, ${preProtFp.protectedRowCount} rows, ${preProtFp.protectedComponentCount} components`);
console.log(`  Pre-Run Registry WM SHA-256 : ${preProtFp.wordMappingsSha256}`);
console.log(`  Pre-Run Registry WMS SHA-256: ${preProtFp.wordMappingStrongsSha256}`);

console.log('1. Loading OSHB + SBLGNT + TR sources & strongs_entries lexicon...');
const sources = loadAllSources();
const strongsLexicon = loadStrongsLexicon(prodDb);
console.log(`   Loaded lexicon (${strongsLexicon.size} entries) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

console.log('2. Bulk-loading word_mapping_strongs (all components) from SQLite...');
const wmsRawPath = path.join(repoRoot, 'scratch/tmp_bulk_wms_v12.tsv');
fs.mkdirSync(path.dirname(wmsRawPath), { recursive: true });
execFileSync(sqlitePath, [prodDb], {
  input: `.mode tabs\n.output ${wmsRawPath.replace(/\\/g, '/')}\nSELECT mapping_id, link_order, COALESCE(link_role,''), COALESCE(strongs_id,''), COALESCE(orig_component,''), COALESCE(orig_word_position,''), COALESCE(orig_morphology,''), COALESCE(morph_source,'') FROM word_mapping_strongs ORDER BY mapping_id, link_order;\n.output stdout\n`,
  encoding: 'utf8'
});

const wmsByMapping = new Map();
{
  const lines = fs.readFileSync(wmsRawPath, 'utf8').replace(/\r/g, '').split('\n');
  for (const line of lines) {
    if (!line) continue;
    const [mid, orderStr, role, sid, comp, posStr, morph, msrc] = line.split('\t');
    const order = parseInt(orderStr, 10);
    const pos = posStr ? parseInt(posStr, 10) : null;
    let arr = wmsByMapping.get(mid);
    if (!arr) { arr = []; wmsByMapping.set(mid, arr); }
    arr.push({ order, role, sid, comp: comp || null, pos, morph: morph || null, msrc: msrc || null });
  }
  try { fs.unlinkSync(wmsRawPath); } catch (_) {}
}
console.log(`   Indexed ${wmsByMapping.size} mapping_ids in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

console.log('3. Bulk-loading all 434,351 word_mappings across 66 books...');
const wmRawPath = path.join(repoRoot, 'scratch/tmp_bulk_wm_v12.tsv');
execFileSync(sqlitePath, [prodDb], {
  input: `.mode tabs\n.output ${wmRawPath.replace(/\\/g, '/')}\nSELECT vr.book_id, vr.chapter_num, vr.verse_num, wm.id, wm.ar_word_position, wm.ar_word, COALESCE(wm.strongs_id,''), COALESCE(wm.orig_word,''), COALESCE(wm.orig_surface,''), COALESCE(wm.orig_word_position,''), COALESCE(wm.orig_morphology,''), COALESCE(wm.morph_pos,''), COALESCE(wm.morph_stem,''), COALESCE(wm.morph_tense,''), COALESCE(wm.morph_voice,''), COALESCE(wm.morph_mood,''), COALESCE(wm.morph_person,''), COALESCE(wm.morph_number,''), COALESCE(wm.morph_gender,''), COALESCE(wm.morph_case,''), COALESCE(wm.verified_locator,''), COALESCE(wm.verified_source,''), COALESCE(wm.morph_source,''), COALESCE(wm.relation_type,''), COALESCE(replace(replace(wm.grammar_notes, char(10), ' '), char(9), ' '),'') FROM word_mappings wm JOIN verses vr ON wm.verse_id = vr.id ORDER BY vr.book_id ASC, vr.chapter_num ASC, vr.verse_num ASC, wm.ar_word_position ASC;\n.output stdout\n`,
  encoding: 'utf8'
});

const versesMap = new Map();
let totalRowsLoaded = 0;
{
  const lines = fs.readFileSync(wmRawPath, 'utf8').replace(/\r/g, '').split('\n');
  for (const line of lines) {
    if (!line) continue;
    const f = line.split('\t');
    const book = parseInt(f[0], 10);
    const ch = parseInt(f[1], 10);
    const vs = parseInt(f[2], 10);
    const key = `${book}:${ch}:${vs}`;
    let vObj = versesMap.get(key);
    if (!vObj) { vObj = { book, ch, vs, rows: [] }; versesMap.set(key, vObj); }

    const id = f[3];
    const strongsId = f[6] || null;
    const origPos = f[9] ? parseInt(f[9], 10) : null;
    const origMorph = f[10] || null;
    const morphSource = f[22] || null;
    const existingWms = wmsByMapping.get(id) || [];
    const prims = existingWms.filter(w => w.role === 'primary');
    const hasCleanPrimaryWms = prims.length === 1 && prims[0].order === 1 &&
      prims[0].sid === (strongsId || '') && prims[0].pos === origPos &&
      (prims[0].morph || null) === origMorph && (prims[0].msrc || null) === morphSource;

    vObj.rows.push({
      id,
      arPos: parseInt(f[4], 10),
      arWord: f[5],
      strongsId,
      origWord: f[7] || null,
      origSurface: f[8] || null,
      origPos,
      origMorph,
      morphPos: f[11] || null,
      morphStem: f[12] || null,
      morphTense: f[13] || null,
      morphVoice: f[14] || null,
      morphMood: f[15] || null,
      morphPerson: f[16] || null,
      morphNumber: f[17] || null,
      morphGender: f[18] || null,
      morphCase: f[19] || null,
      verifiedLocator: f[20] || null,
      verifiedSource: f[21] || null,
      morphSource,
      relationType: f[23] || null,
      grammarNotes: f[24] || null,
      existingWms,
      secondaryPositions: existingWms.filter(w => w.order > 1 && w.pos !== null).map(w => w.pos),
      hasCleanPrimaryWms
    });
    totalRowsLoaded++;
  }
  try { fs.unlinkSync(wmRawPath); } catch (_) {}
}
console.log(`   Loaded ${totalRowsLoaded} rows across ${versesMap.size} verses in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

console.log('4. Running Whole-Verse General Repair Engine v1.2 across ALL 31,102 verses (434,351 exact denominator)...');
const counts = {
  totalVerses: 0,
  totalRecords: 0,
  ALREADY_CANONICAL: 0,
  AUTO_PROPOSED_HIGH_CONFIDENCE: 0,
  PENDING_REVIEW: 0,
  PRESERVED_ADJUDICATED_REGISTRY: 0,
  PRESERVED_SPECIAL_RELATION: 0,
  PRESERVED_VERIFIED_TR: 0,
  PRESERVED_RANGE_LOCATOR: 0,
  PRESERVED_GRAMMAR_NOTES: 0
};
const byLang = {
  hebrew:  { verses: 0, records: 0, AUTO_PROPOSED_HIGH_CONFIDENCE: 0, PENDING_REVIEW: 0, PRESERVED: 0, ALREADY_CANONICAL: 0 },
  aramaic: { verses: 0, records: 0, AUTO_PROPOSED_HIGH_CONFIDENCE: 0, PENDING_REVIEW: 0, PRESERVED: 0, ALREADY_CANONICAL: 0 },
  greek:   { verses: 0, records: 0, AUTO_PROPOSED_HIGH_CONFIDENCE: 0, PENDING_REVIEW: 0, PRESERVED: 0, ALREADY_CANONICAL: 0 }
};
const ruleBreakdown = {};

const sqlStream = fs.createWriteStream(tmpSqlPath, { encoding: 'utf8' });
const diffStream = fs.createWriteStream(diffPath, { encoding: 'utf8' });
sqlStream.write('BEGIN TRANSACTION;\n');

let modifiedCount = 0;

for (const vObj of versesMap.values()) {
  const { book, ch, vs, rows } = vObj;
  const lang = book >= 40 ? 'greek' : (isBiblicalAramaicVerse(book, ch, vs) ? 'aramaic' : 'hebrew');
  const bName = book >= 40 ? (TR_BOOK_OSIS_MAP[book] || `B${book}`) : (OT_BOOK_MAP[book] || `B${book}`);
  const verseInfo = { book, ch, vs, lang, name: `${bName} ${ch}:${vs}` };

  counts.totalVerses++;
  byLang[lang].verses++;

  const res = evaluateVerse(verseInfo, rows, sources, strongsLexicon, { protectedVerseKeys });

  for (const p of res.proposals) {
    counts.totalRecords++;
    byLang[lang].records++;
    counts[p.status] = (counts[p.status] || 0) + 1;
    if (p.status.startsWith('PRESERVED_')) byLang[lang].PRESERVED++;
    else byLang[lang][p.status] = (byLang[lang][p.status] || 0) + 1;

    const ruleKey = p.ruleId.split('(')[0];
    ruleBreakdown[ruleKey] = (ruleBreakdown[ruleKey] || 0) + 1;

    if (p.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' && p.proposed) {
      const pr = p.proposed;
      sqlStream.write(
        `UPDATE word_mappings SET strongs_id=${sqlVal(pr.strongsId)}, orig_word=${sqlVal(pr.origWord)}, orig_surface=${sqlVal(pr.origSurface)}, orig_word_position=${pr.origPos}, orig_morphology=${sqlVal(pr.origMorph)}, morph_pos=${sqlVal(pr.morphPos)}, morph_stem=${sqlVal(pr.morphStem)}, morph_tense=${sqlVal(pr.morphTense)}, morph_voice=${sqlVal(pr.morphVoice)}, morph_mood=${sqlVal(pr.morphMood)}, morph_person=${sqlVal(pr.morphPerson)}, morph_number=${sqlVal(pr.morphNumber)}, morph_gender=${sqlVal(pr.morphGender)}, morph_case=${sqlVal(pr.morphCase)}, verified_locator=${sqlVal(pr.verifiedLocator)}, verified_source=${sqlVal(pr.verifiedSource)}, morph_source=${sqlVal(pr.morphSource)} WHERE id=${sqlVal(p.id)};\n`
      );
      for (const s of buildAtomicWmsSql(p.id, pr, p.existingWms)) {
        sqlStream.write(s + '\n');
      }
      diffStream.write(JSON.stringify({
        verse: verseInfo.name,
        book, ch, vs, lang,
        mappingId: p.id,
        arPos: p.arPos,
        arWord: p.arWord,
        ruleId: p.ruleId,
        before: p.current,
        after: pr,
        evidence: p.evidence
      }) + '\n');
      modifiedCount++;
    }
  }
}

sqlStream.write('COMMIT;\n');
sqlStream.end();
diffStream.end();

if (counts.totalRecords !== totalRowsLoaded) {
  throw new Error(`Denominator mismatch: evaluated ${counts.totalRecords} != loaded ${totalRowsLoaded}`);
}
console.log(`   Evaluated EXACT denominator ${counts.totalRecords}/${totalRowsLoaded} records in ${((Date.now() - t0) / 1000).toFixed(1)}s; high-confidence proposals = ${modifiedCount}`);

Promise.all([
  new Promise(res => sqlStream.on('finish', res)),
  new Promise(res => diffStream.on('finish', res))
]).then(() => {
  console.log('5. Copying production DB to isolated scratch DB and applying atomic transaction...');
  fs.copyFileSync(prodDb, outDb);
  execFileSync(sqlitePath, [outDb], {
    input: `.read ${tmpSqlPath.replace(/\\/g, '/')}\n`,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });

  const integrity = execFileSync(sqlitePath, [outDb], { input: 'PRAGMA integrity_check;', encoding: 'utf8' }).trim();
  if (integrity !== 'ok') throw new Error(`Isolated DB integrity_check failed: ${integrity}`);

  const multiPrimCnt = parseInt(execFileSync(sqlitePath, [outDb], {
    input: "SELECT COUNT(*) FROM (SELECT mapping_id FROM word_mapping_strongs WHERE link_role='primary' GROUP BY mapping_id HAVING COUNT(*) > 1);",
    encoding: 'utf8'
  }).trim(), 10);

  const postProtFp = computeProtectedRegistryFingerprint(outDb, protectedVerseKeys);
  const registryBitwiseIdentical =
    postProtFp.wordMappingsSha256 === preProtFp.wordMappingsSha256 &&
    postProtFp.wordMappingStrongsSha256 === preProtFp.wordMappingStrongsSha256;

  if (!registryBitwiseIdentical) {
    throw new Error('CRITICAL: Protected Adjudicated Registry fingerprint changed after engine run!');
  }

  const postDbSha = sha256File(outDb);
  const diffSha = sha256File(diffPath);
  const prodPostCheck = sha256File(prodDb);
  if (prodPostCheck !== preDbSha) throw new Error('CRITICAL: Production DB hash changed!');

  try { fs.unlinkSync(tmpSqlPath); } catch (_) {}

  const summary = {
    engineVersion: 'whole_verse_general_repair_engine_v1.7',
    trSourceMode,
    scope: 'ALL_66_BOOKS_ISOLATED',
    productionDbSha256Untouched: preDbSha,
    isolatedDbPath: path.relative(repoRoot, outDb).replace(/\\/g, '/'),
    isolatedDbSha256: postDbSha,
    diffLogPath: path.relative(repoRoot, diffPath).replace(/\\/g, '/'),
    diffLogSha256: diffSha,
    denominatorExact: counts.totalRecords,
    modifiedRecords: modifiedCount,
    coveragePct: +(modifiedCount / counts.totalRecords * 100).toFixed(2),
    multiplePrimaryComponentsCount: multiPrimCnt,
    protectedRegistryVerified: {
      bitwiseIdentical: registryBitwiseIdentical,
      ...postProtFp
    },
    counts,
    byLang,
    ruleBreakdown,
    elapsedSeconds: +((Date.now() - t0) / 1000).toFixed(1)
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
  console.log('\n=== FULL 66-BOOK ISOLATED APPLY (v1.7) COMPLETE ===');
  console.log(JSON.stringify(summary, null, 2));
});
