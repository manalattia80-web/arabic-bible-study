/**
 * test_round3_batch3c_isa62_5_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3C: Isaiah 62:5 (ALL 13 records, 15 components, 13/13 OSHB tokens).
 * Verifies:
 *   - #1 «لأَنَّهُ» + #2 «كَمَا» linked as compound_phrase to H3588 @ w1 (כִּֽי, HC), counted once among 13 source tokens,
 *   - All 4 false-negative AR_SYNTACTIC records (#3, #6, #7, #8) restored to their true OSHB tokens (0 syntactic_ar),
 *   - #10 «بِالْعَرُوسِ» fixed from H2860 to H3618@w10 + secondary H5921@w9,
 *   - #12 «بِكِ» fixed to H5921@w12 (HR/Sp2fs) and #13 «إِلهُكِ» fixed from Aramaic H426 to Hebrew H430@w13 (HNcmpc/Sp2fs),
 *   - Live frozen auditor check confirming Isa 62:5 = 13/13 (100.0%, 0 alerts across all 4 axes),
 *   - Frozen raw baseline & frozen auditor SHA-256 untouched.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = process.env.AUDIT_DB_PATH || path.join(repoRoot, 'mobile/assets/bible_study.db');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

function q(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).replace(/\r/g, '').trim();
}

let passed = 0;
let failed = 0;
function assert(cond, msg, detail = '') {
  if (cond) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}${detail ? ' -> ' + detail : ''}`);
    failed++;
  }
}

console.log('=== RUNNING ROUND 3 BATCH 3C (ISAIAH 62:5) QUALITY GATES ===\n');

const EXPECTED = [
  { pos: 1,  ar: 'لأَنَّهُ',     s: 'H3588', orig: 'כִּי',      surf: 'כִּֽי',       w: 1,  m: 'HC',            mp: 'conjunction', st: null,  tn: null,     vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        rel: 'compound_phrase', comps: ['1:primary:H3588:1:HC'] },
  { pos: 2,  ar: 'كَمَا',       s: 'H3588', orig: 'כִּי',      surf: 'כִּֽי',       w: 1,  m: 'HC',            mp: 'conjunction', st: null,  tn: null,     vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        rel: 'compound_phrase', comps: ['1:primary:H3588:1:HC'] },
  { pos: 3,  ar: 'يَتَزَوَّجُ',  s: 'H1166', orig: 'בָּעַל',    surf: 'יִבְעַ֤ל',     w: 2,  m: 'HVqi3ms',       mp: 'verb',        st: 'qal', tn: 'yiqtol', vc: 'active', md: 'indicative', pr: '3',  nm: 'singular', gn: 'masculine', cs: null,        rel: null,              comps: ['1:primary:H1166:2:HVqi3ms'] },
  { pos: 4,  ar: 'الشَّابُّ',    s: 'H970',  orig: 'בָּחוּר',   surf: 'בָּחוּר֙',     w: 3,  m: 'HNcmsa',        mp: 'noun',        st: null,  tn: null,     vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  rel: null,              comps: ['1:primary:H970:3:HNcmsa'] },
  { pos: 5,  ar: 'عَذْرَاءَ',    s: 'H1330', orig: 'בְּתוּלָה', surf: 'בְּתוּלָ֔ה',   w: 4,  m: 'HNcfsa',        mp: 'noun',        st: null,  tn: null,     vc: null,     md: null,         pr: null, nm: 'singular', gn: 'feminine',  cs: 'absolute',  rel: null,              comps: ['1:primary:H1330:4:HNcfsa'] },
  { pos: 6,  ar: 'يَتَزَوَّجُكِ', s: 'H1166', orig: 'בָּעַל',    surf: 'יִבְעָל֖וּךְ',  w: 5,  m: 'HVqi3mp/Sp2fs', mp: 'verb',        st: 'qal', tn: 'yiqtol', vc: 'active', md: 'indicative', pr: '3',  nm: 'plural',   gn: 'masculine', cs: null,        rel: null,              comps: ['1:primary:H1166:5:HVqi3mp/Sp2fs'] },
  { pos: 7,  ar: 'بَنُوكِ',      s: 'H1121', orig: 'בֵּן',      surf: 'בָּנָ֑יִךְ',    w: 6,  m: 'HNcmpc/Sp2fs',  mp: 'noun',        st: null,  tn: null,     vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct', rel: null,              comps: ['1:primary:H1121:6:HNcmpc/Sp2fs'] },
  { pos: 8,  ar: 'وَكَفَرَحِ',   s: 'H4885', orig: 'מָשׂוֹשׂ',  surf: 'וּמְשׂ֤וֹשׂ',  w: 7,  m: 'HC/Ncmsc',      mp: 'noun',        st: null,  tn: null,     vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'construct', rel: null,              comps: ['1:primary:H4885:7:HC/Ncmsc', '2:secondary:H9002:7:HC'] },
  { pos: 9,  ar: 'الْعَرِيسِ',   s: 'H2860', orig: 'חָתָן',     surf: 'חָתָן֙',       w: 8,  m: 'HNcmsa',        mp: 'noun',        st: null,  tn: null,     vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  rel: null,              comps: ['1:primary:H2860:8:HNcmsa'] },
  { pos: 10, ar: 'بِالْعَرُوسِ', s: 'H3618', orig: 'כַּלָּה',   surf: 'כַּלָּ֔ה',     w: 10, m: 'HNcfsa',        mp: 'noun',        st: null,  tn: null,     vc: null,     md: null,         pr: null, nm: 'singular', gn: 'feminine',  cs: 'absolute',  rel: null,              comps: ['1:primary:H3618:10:HNcfsa', '2:secondary:H5921:9:HR'] },
  { pos: 11, ar: 'يَفْرَحُ',     s: 'H7797', orig: 'שׂוּשׂ',    surf: 'יָשִׂ֥ישׂ',    w: 11, m: 'HVqi3ms',       mp: 'verb',        st: 'qal', tn: 'yiqtol', vc: 'active', md: 'indicative', pr: '3',  nm: 'singular', gn: 'masculine', cs: null,        rel: null,              comps: ['1:primary:H7797:11:HVqi3ms'] },
  { pos: 12, ar: 'بِكِ',        s: 'H5921', orig: 'עַל',       surf: 'עָלַ֖יִךְ',    w: 12, m: 'HR/Sp2fs',      mp: 'preposition', st: null,  tn: null,     vc: null,     md: null,         pr: '2',  nm: 'singular', gn: 'feminine',  cs: null,        rel: null,              comps: ['1:primary:H5921:12:HR/Sp2fs'] },
  { pos: 13, ar: 'إِلهُكِ',      s: 'H430',  orig: 'אֱלֹהִים',  surf: 'אֱלֹהָֽיִךְ',   w: 13, m: 'HNcmpc/Sp2fs',  mp: 'noun',        st: null,  tn: null,     vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct', rel: null,              comps: ['1:primary:H430:13:HNcmpc/Sp2fs'] }
];

const rows = q(`
  SELECT json_object(
    'pos', wm.ar_word_position,
    'ar', wm.ar_word,
    's', wm.strongs_id,
    'orig', wm.orig_word,
    'surf', wm.orig_surface,
    'w', wm.orig_word_position,
    'm', wm.orig_morphology,
    'mp', wm.morph_pos,
    'st', wm.morph_stem,
    'tn', wm.morph_tense,
    'vc', wm.morph_voice,
    'md', wm.morph_mood,
    'pr', wm.morph_person,
    'nm', wm.morph_number,
    'gn', wm.morph_gender,
    'cs', wm.morph_case,
    'loc', wm.verified_locator,
    'vs', wm.verified_source,
    'ms', wm.morph_source,
    'rel', wm.relation_type
  )
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 23 AND vr.chapter_num = 62 AND vr.verse_num = 5
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 13, `Isa 62:5 has exactly 13 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 23 AND vr.chapter_num = 62 AND vr.verse_num = 5
  ORDER BY wm.ar_word_position, wms.link_order;
`).split('\n').filter(Boolean);

const compsByPos = new Map();
const coveredTokens = new Set();
let maxW = 0;
for (const c of compRows) {
  const [arPos, order, role, sid, wPos, morph] = c.split('|');
  const p = parseInt(arPos, 10);
  const wNum = parseInt(wPos, 10);
  if (!compsByPos.has(p)) compsByPos.set(p, []);
  compsByPos.get(p).push(`${order}:${role}:${sid}:${wPos}:${morph}`);
  coveredTokens.add(wNum);
  if (wNum > maxW) maxW = wNum;
}

assert(compRows.length === 15, `Isa 62:5 has exactly 15 word_mapping_strongs components (13 primary + 2 secondary; got ${compRows.length})`);
assert(coveredTokens.size === 13 && maxW === 13, `Isa 62:5 covers all 13/13 unique OSHB tokens w1..w13 (covered=${coveredTokens.size}, maxW=${maxW})`);

for (let i = 0; i < EXPECTED.length; i++) {
  const exp = EXPECTED[i];
  const act = rows[i];
  const okRow =
    act.pos === exp.pos &&
    act.ar === exp.ar &&
    act.s === exp.s &&
    act.orig === exp.orig &&
    act.surf === exp.surf &&
    act.w === exp.w &&
    act.m === exp.m &&
    act.mp === exp.mp &&
    act.st === exp.st &&
    act.tn === exp.tn &&
    act.vc === exp.vc &&
    act.md === exp.md &&
    act.pr === exp.pr &&
    act.nm === exp.nm &&
    act.gn === exp.gn &&
    act.cs === exp.cs &&
    act.loc === `OSHB:B23.C62.V5.w${exp.w}` &&
    act.vs === 'oshb_wlc' &&
    act.ms === 'oshb_wlc' &&
    act.rel === exp.rel;
  assert(okRow, `Isa 62:5 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s} @ w${exp.w} (${exp.m})${exp.rel ? ' [' + exp.rel + ']' : ''}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  const okComps = JSON.stringify(actComps) === JSON.stringify(exp.comps);
  assert(okComps, `Isa 62:5 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

const syntacticCount = rows.filter(r => r.mp === 'syntactic_ar' || r.rel === 'syntactic_ar').length;
assert(syntacticCount === 0, `Isa 62:5 has 0 syntactic_ar records (all 4 false-negative AR_SYNTACTIC rows #3,#6,#7,#8 restored and #1+#2 linked via compound_phrase; got ${syntacticCount})`);

const w1Sharers = rows.filter(r => r.w === 1 && r.rel === 'compound_phrase').map(r => r.pos);
assert(JSON.stringify(w1Sharers) === JSON.stringify([1, 2]), 'Isa 62:5 #1+#2 («لأَنَّهُ كَمَا») share H3588@w1 as compound_phrase', JSON.stringify(w1Sharers));

// Live frozen auditor verification for Isa 62:5 (never swallow execError!)
const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3c_isa62_5_audit.json');
fs.mkdirSync(path.dirname(tmpOut), { recursive: true });
let auditorExitOk = false;
try {
  execFileSync(process.execPath, [
    path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'),
    '--manifest', path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json'),
    '--out', tmpOut
  ], { cwd: repoRoot, env: { ...process.env, AUDIT_DB_PATH: dbPath }, stdio: 'pipe' });
  auditorExitOk = true;
} catch (err) {
  assert(false, `Live frozen auditor exited with error`, err.message);
}

if (auditorExitOk) {
  const rep = JSON.parse(fs.readFileSync(tmpOut, 'utf8'));
  const isa = rep.perVerse.find(v => v.verse === 'Isa 62:5');
  assert(
    rep.dbSha256 === sha256File(dbPath) &&
    rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
    'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
  );
  assert(
    Boolean(isa && isa.clean === 13 && isa.total === 13 && isa.alerts === 0 && isa.axisAlerts.lexical === 0 && isa.axisAlerts.lemmaSurface === 0 && isa.axisAlerts.morphology === 0 && isa.axisAlerts.sourceLocator === 0),
    'Live frozen auditor confirms Isa 62:5 = 13/13 (100.0%) with 0 alerts across all 4 axes',
    JSON.stringify(isa)
  );
  try { fs.unlinkSync(tmpOut); } catch (_) {}
}

// Verify frozen raw baseline and frozen auditor are strictly untouched
const rawBaselineSha = sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_4axis_raw_baseline_v379.json'));
const frozenAuditorSha = sha256File(path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'));
assert(
  rawBaselineSha === '12de8cc5e3cc1b2d05dc20371928d4c1191a2f9f7255d70fbaf17e6fcb84da88',
  'Frozen Round 3 raw baseline SHA-256 untouched (12de8cc5...)',
  rawBaselineSha
);
assert(
  frozenAuditorSha === '5c62f12e6b72484b149d3f6e11980d25b593338d5ab08a832f5d8da684647300',
  'Frozen auditor SHA-256 untouched (5c62f12e...)',
  frozenAuditorSha
);

console.log('\n================================================================================');
console.log(`  ROUND 3 BATCH 3C (ISA 62:5) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
