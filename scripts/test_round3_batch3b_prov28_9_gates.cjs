/**
 * test_round3_batch3b_prov28_9_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3B: Proverbs 28:9 (ALL 9 records, 9 components, 7/7 OSHB tokens).
 * Verifies:
 *   - #1 «مَنْ» as AR_SYNTACTIC:B20.C28.V9.w1 (0 strongs components),
 *   - Shared compound_phrase unit #4 «عَنْ» (H4480 מִ:HR @ w3) + #5 «سَمَاعِ» (H8085 מִשְּׁמֹ֣עַ:HR/Vqc @ w3 + secondary H4480),
 *   - Hebrew-to-Arabic word-order alignment (#7 فَصَلاَتُهُ @ w6, #8 أَيْضًا @ w5) and elimination of out-of-bounds w8/w9,
 *   - Live frozen auditor check confirming Prov 28:9 = 9/9 (100.0%, 0 alerts across all 4 axes),
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

console.log('=== RUNNING ROUND 3 BATCH 3B (PROVERBS 28:9) QUALITY GATES ===\n');

const EXPECTED = [
  { pos: 1, ar: 'مَنْ',        s: null,    orig: '—',       surf: '—',          w: null, m: null,           mp: 'syntactic_ar', st: null,     tn: null, vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,        loc: 'AR_SYNTACTIC:B20.C28.V9.w1', vs: 'syntactic_ar', ms: 'syntactic_ar', rel: 'syntactic_ar',    comps: [] },
  { pos: 2, ar: 'يُحَوِّلُ',    s: 'H5493', orig: 'סוּר',    surf: 'מֵסִ֣יר',     w: 1,    m: 'HVhrmsa',      mp: 'verb',         st: 'hiphil', tn: null, vc: 'active', md: 'participle',           pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  loc: 'OSHB:B20.C28.V9.w1',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H5493:1:HVhrmsa'] },
  { pos: 3, ar: 'أُذْنَهُ',    s: 'H241',  orig: 'אֹזֶן',   surf: 'אָ֭זְנוֹ',    w: 2,    m: 'HNcfsc/Sp3ms', mp: 'noun',         st: null,     tn: null, vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'feminine',  cs: 'construct', loc: 'OSHB:B20.C28.V9.w2',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H241:2:HNcfsc/Sp3ms'] },
  { pos: 4, ar: 'عَنْ',        s: 'H4480', orig: 'מִן',     surf: 'מִ',         w: 3,    m: 'HR',           mp: 'preposition',  st: null,     tn: null, vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,        loc: 'OSHB:B20.C28.V9.w3',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: 'compound_phrase', comps: ['1:primary:H4480:3:HR'] },
  { pos: 5, ar: 'سَمَاعِ',     s: 'H8085', orig: 'שָׁמַע',  surf: 'מִשְּׁמֹ֣עַ', w: 3,    m: 'HR/Vqc',       mp: 'verb',         st: 'qal',    tn: null, vc: 'active', md: 'infinitive_construct', pr: null, nm: null,       gn: null,        cs: null,        loc: 'OSHB:B20.C28.V9.w3',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: 'compound_phrase', comps: ['1:primary:H8085:3:HR/Vqc', '2:secondary:H4480:3:HR'] },
  { pos: 6, ar: 'الشَّرِيعَةِ', s: 'H8451', orig: 'תּוֹרָה', surf: 'תּוֹרָ֑ה',    w: 4,    m: 'HNcfsa',       mp: 'noun',         st: null,     tn: null, vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'feminine',  cs: 'absolute',  loc: 'OSHB:B20.C28.V9.w4',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H8451:4:HNcfsa'] },
  { pos: 7, ar: 'فَصَلاَتُهُ', s: 'H8605', orig: 'תְּפִלָּה', surf: 'תְּ֝פִלָּת֗וֹ', w: 6, m: 'HNcfsc/Sp3ms', mp: 'noun',         st: null,     tn: null, vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'feminine',  cs: 'construct', loc: 'OSHB:B20.C28.V9.w6',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H8605:6:HNcfsc/Sp3ms'] },
  { pos: 8, ar: 'أَيْضًا',     s: 'H1571', orig: 'גַּם',    surf: 'גַּֽם',       w: 5,    m: 'HTa',          mp: 'particle',     st: null,     tn: null, vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,        loc: 'OSHB:B20.C28.V9.w5',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H1571:5:HTa'] },
  { pos: 9, ar: 'مَكْرَهَةٌ',   s: 'H8441', orig: 'תּוֹעֵבַה', surf: 'תּוֹעֵבָֽה',  w: 7,    m: 'HNcfsa',       mp: 'noun',         st: null,     tn: null, vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'feminine',  cs: 'absolute',  loc: 'OSHB:B20.C28.V9.w7',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H8441:7:HNcfsa'] }
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
  WHERE vr.book_id = 20 AND vr.chapter_num = 28 AND vr.verse_num = 9
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 9, `Prov 28:9 has exactly 9 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 20 AND vr.chapter_num = 28 AND vr.verse_num = 9
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

assert(compRows.length === 9, `Prov 28:9 has exactly 9 word_mapping_strongs components (8 primary + 1 secondary, 0 for syntactic_ar #1; got ${compRows.length})`);
assert(coveredTokens.size === 7 && maxW === 7, `Prov 28:9 covers all 7/7 OSHB tokens w1..w7 with zero out-of-bounds positions (covered=${coveredTokens.size}, maxW=${maxW})`);

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
  assert(okRow, `Prov 28:9 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s || 'AR_SYNTACTIC'} @ ${exp.loc}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  const okComps = JSON.stringify(actComps) === JSON.stringify(exp.comps);
  assert(okComps, `Prov 28:9 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

// Live frozen auditor verification for Prov 28:9 (never swallow execError!)
const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3b_prov28_9_audit.json');
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
  const prov = rep.perVerse.find(v => v.verse === 'Prov 28:9');
  assert(
    rep.dbSha256 === sha256File(dbPath) &&
    rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
    'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
  );
  assert(
    Boolean(prov && prov.clean === 9 && prov.total === 9 && prov.alerts === 0 && prov.axisAlerts.lexical === 0 && prov.axisAlerts.lemmaSurface === 0 && prov.axisAlerts.morphology === 0 && prov.axisAlerts.sourceLocator === 0),
    'Live frozen auditor confirms Prov 28:9 = 9/9 (100.0%) with 0 alerts across all 4 axes',
    JSON.stringify(prov)
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
console.log(`  ROUND 3 BATCH 3B (PROV 28:9) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
