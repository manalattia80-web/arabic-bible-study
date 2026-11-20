/**
 * test_round3_batch3i_dan7_26_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3I: Daniel 7:26 (ALL 9 records, 15 components, 8/8 Aramaic OSHB tokens).
 * Verifies exact fields, elimination of all catastrophic lexical errors (H3428, H1782, H5758, H7986, H5487, H6566, H5482)
 * and out-of-bounds w9, live frozen auditor 9/9 (0 alerts), and untouched frozen raw baseline & auditor SHA-256.
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

console.log('=== RUNNING ROUND 3 BATCH 3I (DANIEL 7:26 — ARAMAIC) QUALITY GATES ===\n');

const EXPECTED = [
  { pos: 1, ar: 'فَيَجْلِسُ',   s: 'H3488', orig: 'יְתִב',    surf: 'יִתִּ֑ב',      w: 2,    m: 'AVqi3ms',        mp: 'verb',         st: 'peal',   tn: 'yiqtol', vc: 'active', md: 'indicative',           pr: '3',  nm: 'singular', gn: 'masculine', cs: null,         loc: 'OSHB:B27.C7.V26.w2',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H3488:2:AVqi3ms', '2:secondary:H9002:1:AC'] },
  { pos: 2, ar: 'الدِّينُ',      s: 'H1780', orig: 'דִּין',    surf: 'וְדִינָ֖א',    w: 1,    m: 'AC/Ncmsd/Td',    mp: 'noun',         st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'determined', loc: 'OSHB:B27.C7.V26.w1',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H1780:1:AC/Ncmsd/Td', '2:secondary:H9002:1:AC'] },
  { pos: 3, ar: 'وَيَنْزِعُونَ', s: 'H5709', orig: 'עֲדָא',    surf: 'יְהַעְדּ֔וֹן', w: 4,    m: 'AVhi3mp',        mp: 'verb',         st: 'haphel', tn: 'yiqtol', vc: 'active', md: 'indicative',           pr: '3',  nm: 'plural',   gn: 'masculine', cs: null,         loc: 'OSHB:B27.C7.V26.w4',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H5709:4:AVhi3mp', '2:secondary:H9002:3:AC'] },
  { pos: 4, ar: 'عَنْهُ',        s: null,    orig: '—',        surf: '—',            w: null, m: null,             mp: 'syntactic_ar', st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,         loc: 'AR_SYNTACTIC:B27.C7.V26.w4',  vs: 'syntactic_ar', ms: 'syntactic_ar', rel: 'syntactic_ar', comps: [] },
  { pos: 5, ar: 'سُلْطَانَهُ',   s: 'H7985', orig: 'שׇׁלְטָן', surf: 'וְשָׁלְטָנֵ֣הּ', w: 3,  m: 'AC/Ncmsc/Sp3ms', mp: 'noun',         st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'construct',  loc: 'OSHB:B27.C7.V26.w3',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H7985:3:AC/Ncmsc/Sp3ms', '2:secondary:H9002:3:AC'] },
  { pos: 6, ar: 'لِيَفْنَوْا',   s: 'H8046', orig: 'שְׁמַד',   surf: 'לְהַשְׁמָדָ֥ה', w: 5,   m: 'AR/Vhc',         mp: 'verb',         st: 'haphel', tn: null,     vc: 'active', md: 'infinitive_construct', pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B27.C7.V26.w5',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H8046:5:AR/Vhc', '2:secondary:H9005:5:AR'] },
  { pos: 7, ar: 'وَيَبِيدُوا',   s: 'H7',    orig: 'אֲבַד',    surf: 'וּלְהוֹבָדָ֖ה', w: 6,   m: 'AC/R/Vhc',       mp: 'verb',         st: 'haphel', tn: null,     vc: 'active', md: 'infinitive_construct', pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B27.C7.V26.w6',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H7:6:AC/R/Vhc', '2:secondary:H9002:6:AC', '3:secondary:H9005:6:R'] },
  { pos: 8, ar: 'إِلَى',         s: 'H5705', orig: 'עַד',      surf: 'עַד',          w: 7,    m: 'AR',             mp: 'preposition',  st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B27.C7.V26.w7',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H5705:7:AR'] },
  { pos: 9, ar: 'الْمُنْتَهَى',  s: 'H5491', orig: 'סוֹף',     surf: 'סוֹפָֽא',      w: 8,    m: 'ANcmsd/Td',      mp: 'noun',         st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'determined', loc: 'OSHB:B27.C7.V26.w8',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H5491:8:ANcmsd/Td'] }
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
  WHERE vr.book_id = 27 AND vr.chapter_num = 7 AND vr.verse_num = 26
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 9, `Dan 7:26 has exactly 9 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 27 AND vr.chapter_num = 7 AND vr.verse_num = 26
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

assert(compRows.length === 15, `Dan 7:26 has exactly 15 word_mapping_strongs components (8 primary + 7 secondary, 0 for syntactic_ar #4; got ${compRows.length})`);
assert(coveredTokens.size === 8 && maxW === 8, `Dan 7:26 covers all 8/8 unique Aramaic OSHB tokens w1..w8 with zero out-of-bounds positions (covered=${coveredTokens.size}, maxW=${maxW})`);

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
  assert(okRow, `Dan 7:26 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s || 'AR_SYNTACTIC'} @ ${exp.loc}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  const okComps = JSON.stringify(actComps) === JSON.stringify(exp.comps);
  assert(okComps, `Dan 7:26 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

// Live frozen auditor verification for Dan 7:26 (never swallow execError!)
const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3i_dan7_26_audit.json');
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
  const dan = rep.perVerse.find(v => v.verse === 'Dan 7:26');
  assert(
    rep.dbSha256 === sha256File(dbPath) &&
    rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
    'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
  );
  assert(
    Boolean(dan && dan.clean === 9 && dan.total === 9 && dan.alerts === 0 && dan.axisAlerts.lexical === 0 && dan.axisAlerts.lemmaSurface === 0 && dan.axisAlerts.morphology === 0 && dan.axisAlerts.sourceLocator === 0),
    'Live frozen auditor confirms Dan 7:26 = 9/9 (100.0%) with 0 alerts across all 4 axes',
    JSON.stringify(dan)
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
console.log(`  ROUND 3 BATCH 3I (DAN 7:26) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
