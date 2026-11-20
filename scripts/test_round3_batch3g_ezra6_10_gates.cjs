/**
 * test_round3_batch3g_ezra6_10_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3G: Ezra 6:10 (ALL 11 records, 16 components, 10/10 Aramaic OSHB tokens).
 * Verifies exact fields, both compound_phrase units (#3+#4 -> w4 נִיחוֹחִ֖ין, #8+#9 -> w8 לְחַיֵּ֥י),
 * elimination of out-of-bounds w11, morph_case=determined on w6 & w9, live frozen auditor 11/11 (0 alerts),
 * and untouched frozen raw baseline & auditor SHA-256.
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

console.log('=== RUNNING ROUND 3 BATCH 3G (EZRA 6:10 — ARAMAIC) QUALITY GATES ===\n');

const EXPECTED = [
  { pos: 1,  ar: 'عَنْ',        s: 'H1768', orig: 'דִּי',      surf: 'דִּֽי',        w: 1,  m: 'AC',             mp: 'conjunction', st: null,     tn: null, vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,         rel: null,              comps: ['1:primary:H1768:1:AC'] },
  { pos: 2,  ar: 'تَقْرِيبِ',   s: 'H7127', orig: 'קְרֵב',     surf: 'מְהַקְרְבִ֛ין', w: 3,  m: 'AVhrmpa',        mp: 'verb',        st: 'haphel', tn: null, vc: 'active', md: 'participle', pr: null, nm: 'plural',   gn: 'masculine', cs: 'absolute',   rel: null,              comps: ['1:primary:H7127:3:AVhrmpa', '2:secondary:H1934:2:AVqi3mp'] },
  { pos: 3,  ar: 'رَوَائِحِ',   s: 'H5208', orig: 'נִיחוֹחַ',  surf: 'נִיחוֹחִ֖ין',   w: 4,  m: 'ANcmpa',         mp: 'noun',        st: null,     tn: null, vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'absolute',   rel: 'compound_phrase', comps: ['1:primary:H5208:4:ANcmpa'] },
  { pos: 4,  ar: 'سُرُورٍ',     s: 'H5208', orig: 'נִיחוֹחַ',  surf: 'נִיחוֹחִ֖ין',   w: 4,  m: 'ANcmpa',         mp: 'noun',        st: null,     tn: null, vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'absolute',   rel: 'compound_phrase', comps: ['1:primary:H5208:4:ANcmpa'] },
  { pos: 5,  ar: 'لإِلهِ',      s: 'H426',  orig: 'אֱלָהּ',    surf: 'לֶאֱלָ֣הּ',     w: 5,  m: 'AR/Ncmsc',       mp: 'noun',        st: null,     tn: null, vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'construct',  rel: null,              comps: ['1:primary:H426:5:AR/Ncmsc', '2:secondary:H9005:5:AR'] },
  { pos: 6,  ar: 'السَّمَاءِ',  s: 'H8065', orig: 'שָׁמַיִן',  surf: 'שְׁמַיָּ֑א',    w: 6,  m: 'ANcmpd/Td',      mp: 'noun',        st: null,     tn: null, vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'determined', rel: null,              comps: ['1:primary:H8065:6:ANcmpd/Td'] },
  { pos: 7,  ar: 'وَالصَّلاَةِ', s: 'H6739', orig: 'צְלָא',     surf: 'וּמְצַלַּ֕יִן', w: 7,  m: 'AC/Vprmpa',      mp: 'verb',        st: 'pael',   tn: null, vc: 'active', md: 'participle', pr: null, nm: 'plural',   gn: 'masculine', cs: 'absolute',   rel: null,              comps: ['1:primary:H6739:7:AC/Vprmpa', '2:secondary:H9002:7:AC'] },
  { pos: 8,  ar: 'لأَجْلِ',     s: 'H9005', orig: 'לְ',        surf: 'לְ',           w: 8,  m: 'AR',             mp: 'preposition', st: null,     tn: null, vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,         rel: 'compound_phrase', comps: ['1:primary:H9005:8:AR'] },
  { pos: 9,  ar: 'حَيَاةِ',     s: 'H2417', orig: 'חַי',       surf: 'לְחַיֵּ֥י',     w: 8,  m: 'AR/Ncmpc',       mp: 'noun',        st: null,     tn: null, vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct',  rel: 'compound_phrase', comps: ['1:primary:H2417:8:AR/Ncmpc', '2:secondary:H9005:8:AR'] },
  { pos: 10, ar: 'الْمَلِكِ',   s: 'H4430', orig: 'מֶלֶךְ',    surf: 'מַלְכָּ֖א',     w: 9,  m: 'ANcmsd/Td',      mp: 'noun',        st: null,     tn: null, vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'determined', rel: null,              comps: ['1:primary:H4430:9:ANcmsd/Td'] },
  { pos: 11, ar: 'وَبَنِيهِ',   s: 'H1123', orig: 'בֵּן',      surf: 'וּבְנֽוֹהִי',   w: 10, m: 'AC/Ncmpc/Sp3ms', mp: 'noun',        st: null,     tn: null, vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct',  rel: null,              comps: ['1:primary:H1123:10:AC/Ncmpc/Sp3ms', '2:secondary:H9002:10:AC'] }
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
  WHERE vr.book_id = 15 AND vr.chapter_num = 6 AND vr.verse_num = 10
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 11, `Ezra 6:10 has exactly 11 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 15 AND vr.chapter_num = 6 AND vr.verse_num = 10
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

assert(compRows.length === 16, `Ezra 6:10 has exactly 16 word_mapping_strongs components (11 primary + 5 secondary; got ${compRows.length})`);
assert(coveredTokens.size === 10 && maxW === 10, `Ezra 6:10 covers all 10/10 unique Aramaic OSHB tokens w1..w10 with zero out-of-bounds positions (covered=${coveredTokens.size}, maxW=${maxW})`);

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
    act.loc === `OSHB:B15.C6.V10.w${exp.w}` &&
    act.vs === 'oshb_wlc' &&
    act.ms === 'oshb_wlc' &&
    act.rel === exp.rel;
  assert(okRow, `Ezra 6:10 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s} @ w${exp.w} (${exp.m})${exp.rel ? ' [' + exp.rel + ']' : ''}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  const okComps = JSON.stringify(actComps) === JSON.stringify(exp.comps);
  assert(okComps, `Ezra 6:10 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

const w4Sharers = rows.filter(r => r.w === 4 && r.rel === 'compound_phrase').map(r => r.pos);
const w8Sharers = rows.filter(r => r.w === 8 && r.rel === 'compound_phrase').map(r => r.pos);
assert(
  JSON.stringify(w4Sharers) === JSON.stringify([3, 4]) && JSON.stringify(w8Sharers) === JSON.stringify([8, 9]),
  'Ezra 6:10 documents both compound_phrase units (#3+#4 -> w4 נִיחוֹחִ֖ין, #8+#9 -> w8 לְחַיֵּ֥י)',
  JSON.stringify({ w4Sharers, w8Sharers })
);

// Live frozen auditor verification for Ezra 6:10 (never swallow execError!)
const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3g_ezra6_10_audit.json');
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
  const ezra = rep.perVerse.find(v => v.verse === 'Ezra 6:10');
  assert(
    rep.dbSha256 === sha256File(dbPath) &&
    rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
    'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
  );
  assert(
    Boolean(ezra && ezra.clean === 11 && ezra.total === 11 && ezra.alerts === 0 && ezra.axisAlerts.lexical === 0 && ezra.axisAlerts.lemmaSurface === 0 && ezra.axisAlerts.morphology === 0 && ezra.axisAlerts.sourceLocator === 0),
    'Live frozen auditor confirms Ezra 6:10 = 11/11 (100.0%) with 0 alerts across all 4 axes',
    JSON.stringify(ezra)
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
console.log(`  ROUND 3 BATCH 3G (EZRA 6:10) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
