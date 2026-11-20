/**
 * test_round3_batch3f_ezra5_10_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3F: Ezra 5:10 (ALL 9 records, 15 components, 11/11 Aramaic OSHB tokens).
 * Verifies exact fields, Aramaic Strong's IDs (H638 not H637, H3790 not H3792), morph_case=determined on w9,
 * non-adjacent secondary components (w1/w4 on #1, w6 on #6, w10 on #9), live frozen auditor 9/9 (0 alerts),
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

console.log('=== RUNNING ROUND 3 BATCH 3F (EZRA 5:10 — ARAMAIC) QUALITY GATES ===\n');

const EXPECTED = [
  { pos: 1, ar: 'وَسَأَلْنَاهُمْ', s: 'H7593', orig: 'שְׁאֵל', surf: 'שְׁאֵ֥לְנָא',   w: 3,    m: 'AVqp1cp',        mp: 'verb',         st: 'peal',   tn: 'qatal',  vc: 'active', md: 'indicative',           pr: '1',  nm: 'plural',   gn: 'common',    cs: null,         loc: 'OSHB:B15.C5.V10.w3',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,                   comps: ['1:primary:H7593:3:AVqp1cp', '2:secondary:H9002:1:AC', '3:secondary:H9005:4:AR/Sp3mp'] },
  { pos: 2, ar: 'أَيْضًا',        s: 'H638',  orig: 'אַף',   surf: 'וְאַ֧ף',       w: 1,    m: 'AC/Ta',          mp: 'particle',     st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B15.C5.V10.w1',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,                   comps: ['1:primary:H638:1:AC/Ta', '2:secondary:H9002:1:AC'] },
  { pos: 3, ar: 'عَنْ',           s: null,    orig: '—',     surf: '—',            w: null, m: null,             mp: 'syntactic_ar', st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,         loc: 'AR_SYNTACTIC:B15.C5.V10.w3',  vs: 'syntactic_ar', ms: 'syntactic_ar', rel: 'preposition_particle', comps: [] },
  { pos: 4, ar: 'أَسْمَائِهِمْ',  s: 'H8036', orig: 'שֻׁם',  surf: 'שְׁמָהָתְהֹ֛ם', w: 2,    m: 'ANcmpc/Sp3mp',   mp: 'noun',         st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct',  loc: 'OSHB:B15.C5.V10.w2',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,                   comps: ['1:primary:H8036:2:ANcmpc/Sp3mp'] },
  { pos: 5, ar: 'لِنُعْلِمَكَ',    s: 'H3046', orig: 'יְדַע', surf: 'לְהוֹדָעוּתָ֑ךְ', w: 5,  m: 'AR/Vhc/Sp2ms',   mp: 'verb',         st: 'haphel', tn: null,     vc: 'active', md: 'infinitive_construct', pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B15.C5.V10.w5',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,                   comps: ['1:primary:H3046:5:AR/Vhc/Sp2ms', '2:secondary:H9005:5:AR'] },
  { pos: 6, ar: 'وَكَتَبْنَا',    s: 'H3790', orig: 'כְּתַב', surf: 'נִכְתֻּ֥ב',    w: 7,    m: 'AVqi1cp',        mp: 'verb',         st: 'peal',   tn: 'yiqtol', vc: 'active', md: 'indicative',           pr: '1',  nm: 'plural',   gn: 'common',    cs: null,         loc: 'OSHB:B15.C5.V10.w7',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,                   comps: ['1:primary:H3790:7:AVqi1cp', '2:secondary:H1768:6:ATr'] },
  { pos: 7, ar: 'أَسْمَاءَ',      s: 'H8036', orig: 'שֻׁם',  surf: 'שֻׁם',          w: 8,    m: 'ANcmsc',         mp: 'noun',         st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'construct',  loc: 'OSHB:B15.C5.V10.w8',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,                   comps: ['1:primary:H8036:8:ANcmsc'] },
  { pos: 8, ar: 'الرِّجَالِ',     s: 'H1400', orig: 'גְּבַר', surf: 'גֻּבְרַיָּ֖א', w: 9,    m: 'ANcmpd/Td',      mp: 'noun',         st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'plural',   gn: 'masculine', cs: 'determined', loc: 'OSHB:B15.C5.V10.w9',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,                   comps: ['1:primary:H1400:9:ANcmpd/Td'] },
  { pos: 9, ar: 'رُؤُوسِهِمْ',    s: 'H7217', orig: 'רֵאשׁ', surf: 'בְרָאשֵׁיהֹֽם', w: 11,   m: 'AR/Ncmpc/Sp3mp', mp: 'noun',         st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct',  loc: 'OSHB:B15.C5.V10.w11',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,                   comps: ['1:primary:H7217:11:AR/Ncmpc/Sp3mp', '2:secondary:H9003:11:AR', '3:secondary:H1768:10:ATr'] }
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
  WHERE vr.book_id = 15 AND vr.chapter_num = 5 AND vr.verse_num = 10
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 9, `Ezra 5:10 has exactly 9 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 15 AND vr.chapter_num = 5 AND vr.verse_num = 10
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

assert(compRows.length === 15, `Ezra 5:10 has exactly 15 word_mapping_strongs components (8 primary + 7 secondary, 0 for syntactic_ar #3; got ${compRows.length})`);
assert(coveredTokens.size === 11 && maxW === 11, `Ezra 5:10 covers all 11/11 unique Aramaic OSHB tokens w1..w11 (covered=${coveredTokens.size}, maxW=${maxW})`);

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
    act.loc === exp.loc &&
    act.vs === exp.vs &&
    act.ms === exp.ms &&
    act.rel === exp.rel;
  assert(okRow, `Ezra 5:10 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s || 'AR_SYNTACTIC'} @ ${exp.loc}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  const okComps = JSON.stringify(actComps) === JSON.stringify(exp.comps);
  assert(okComps, `Ezra 5:10 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

// Live frozen auditor verification for Ezra 5:10 (never swallow execError!)
const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3f_ezra5_10_audit.json');
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
  const ezra = rep.perVerse.find(v => v.verse === 'Ezra 5:10');
  assert(
    rep.dbSha256 === sha256File(dbPath) &&
    rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
    'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
  );
  assert(
    Boolean(ezra && ezra.clean === 9 && ezra.total === 9 && ezra.alerts === 0 && ezra.axisAlerts.lexical === 0 && ezra.axisAlerts.lemmaSurface === 0 && ezra.axisAlerts.morphology === 0 && ezra.axisAlerts.sourceLocator === 0),
    'Live frozen auditor confirms Ezra 5:10 = 9/9 (100.0%) with 0 alerts across all 4 axes',
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
console.log(`  ROUND 3 BATCH 3F (EZRA 5:10) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
