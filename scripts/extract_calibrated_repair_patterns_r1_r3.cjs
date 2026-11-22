/**
 * scripts/extract_calibrated_repair_patterns_r1_r3.cjs
 *
 * Strictly extracts recurring alignment & morphology patterns ONLY from the 65 already-adjudicated
 * verses (B20 [20] + R1 [15] + R2 [15] + R3 [15] = 1,053 calibrated records).
 * Does NOT read or inspect Round 4B or Round 4 (66books) in any way.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');

const q = sql => execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).replace(/\r/g, '').trim();

const b20 = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/batch_20_verses_manifest.json'), 'utf8')).verses;
const r1 = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_15_verses_manifest.json'), 'utf8')).holdout_verses;
const r2 = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_round2_15_verses_manifest.json'), 'utf8')).holdout_verses;
const r3 = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json'), 'utf8')).holdout_verses;

const allCalibrated = [
  ...b20.map(v => ({ set: 'B20', book: v.book, ch: v.ch, vs: v.vs, name: v.name, lang: v.lang })),
  ...r1.map(v => ({ set: 'R1', ...v })),
  ...r2.map(v => ({ set: 'R2', ...v })),
  ...r3.map(v => ({ set: 'R3', ...v }))
];

const stats = {
  totalVerses: allCalibrated.length,
  totalRecords: 0,
  byLang: {
    hebrew:  { verses: 0, records: 0, displacedPos: 0, multiComponent: 0, compoundPhrase: 0, syntacticAr: 0, trEdition: 0, versificationOffset: 0 },
    aramaic: { verses: 0, records: 0, displacedPos: 0, multiComponent: 0, compoundPhrase: 0, syntacticAr: 0, trEdition: 0, versificationOffset: 0 },
    greek:   { verses: 0, records: 0, displacedPos: 0, multiComponent: 0, compoundPhrase: 0, syntacticAr: 0, trEdition: 0, versificationOffset: 0 }
  },
  totals: {
    displacedPos: 0,
    multiComponent: 0,
    compoundPhrase: 0,
    syntacticAr: 0,
    trEdition: 0,
    versificationOffset: 0
  }
};

for (const v of allCalibrated) {
  const langStats = stats.byLang[v.lang];
  langStats.verses++;

  const rows = q(`
    SELECT wm.ar_word_position, COALESCE(wm.orig_word_position,''), COALESCE(wm.relation_type,''),
           COALESCE(wm.verified_source,''), COALESCE(wm.verified_locator,''),
           (SELECT COUNT(*) FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id) AS comp_cnt
    FROM word_mappings wm
    JOIN verses vr ON wm.verse_id = vr.id
    WHERE vr.book_id = ${v.book} AND vr.chapter_num = ${v.ch} AND vr.verse_num = ${v.vs}
    ORDER BY wm.ar_word_position;
  `).split('\n').filter(Boolean);

  for (const r of rows) {
    const [arPosStr, origPosStr, relType, vSrc, vLoc, compCntStr] = r.split('|');
    const arPos = parseInt(arPosStr, 10);
    const origPos = origPosStr ? parseInt(origPosStr, 10) : null;
    const compCnt = parseInt(compCntStr, 10);

    stats.totalRecords++;
    langStats.records++;

    if (vSrc === 'syntactic_ar' || relType === 'syntactic_ar') {
      langStats.syntacticAr++;
      stats.totals.syntacticAr++;
    } else if (origPos !== null && origPos !== arPos) {
      langStats.displacedPos++;
      stats.totals.displacedPos++;
    }

    if (compCnt > 1) {
      langStats.multiComponent++;
      stats.totals.multiComponent++;
    }
    if (relType === 'compound_phrase') {
      langStats.compoundPhrase++;
      stats.totals.compoundPhrase++;
    }
    if (vSrc === 'morphgnt_tr' || vLoc.startsWith('TR:')) {
      langStats.trEdition++;
      stats.totals.trEdition++;
    }
    if (vLoc.startsWith('OSHB:')) {
      const m = vLoc.match(/C(\d+)\.V(\d+)/);
      if (m && (parseInt(m[1], 10) !== v.ch || parseInt(m[2], 10) !== v.vs)) {
        langStats.versificationOffset++;
        stats.totals.versificationOffset++;
      }
    }
  }
}

const outPath = path.join(repoRoot, 'scripts/calibrated_repair_patterns_b20_r1_r3.json');
fs.writeFileSync(outPath, JSON.stringify(stats, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(stats, null, 2));
