/**
 * test_round3_batch3d_dan10_13_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3D: Daniel 10:13 (ALL 22 records, 29 components, 21/21 OSHB tokens).
 * Verifies:
 *   - All 22 records exact fields & all 29 word_mapping_strongs components (21 primary + 8 secondary, 0 for syntactic_ar #12),
 *   - #2 «مَمْلَكَةِ» fixed from Aramaic H4437 to Hebrew H4438 (HNcfsc),
 *   - Swapped compound numeral order #6 «وَاحِدًا» -> w7 (וְאֶחָ֣ד + H9002) & #7 «وَعِشْرِينَ» -> w6 (עֶשְׂרִ֣ים),
 *   - #11 «وَاحِدٌ» exact w11 אַחַ֛ד (HAcmsa), #12 «مِنَ» AR_SYNTACTIC:B27.C10.V13.w12, #14 «الأَوَّلِينَ» H7223@w13 + H9009,
 *   - Elimination of out-of-bounds w22 (#22 فَارِسَ -> w21 פָרָֽס),
 *   - Live frozen auditor check confirming Dan 10:13 = 22/22 (100.0%, 0 alerts across all 4 axes),
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

console.log('=== RUNNING ROUND 3 BATCH 3D (DANIEL 10:13) QUALITY GATES ===\n');

const EXPECTED = [
  { pos: 1,  ar: 'وَرَئِيسُ',    s: 'H8269', orig: 'שַׂר',      surf: 'וְשַׂ֣ר',      w: 1,    m: 'HC/Ncmsc',     mp: 'noun',         st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'construct', loc: 'OSHB:B27.C10.V13.w1',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H8269:1:HC/Ncmsc', '2:secondary:H9002:1:HC'] },
  { pos: 2,  ar: 'مَمْلَكَةِ',   s: 'H4438', orig: 'מַלְכוּת',  surf: 'מַלְכ֣וּת',    w: 2,    m: 'HNcfsc',       mp: 'noun',         st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'singular', gn: 'feminine',  cs: 'construct', loc: 'OSHB:B27.C10.V13.w2',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H4438:2:HNcfsc'] },
  { pos: 3,  ar: 'فَارِسَ',      s: 'H6539', orig: 'פָּרַס',    surf: 'פָּרַ֗ס',      w: 3,    m: 'HNp',          mp: 'proper_noun',  st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'singular', gn: null,        cs: null,        loc: 'OSHB:B27.C10.V13.w3',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H6539:3:HNp'] },
  { pos: 4,  ar: 'وَقَفَ',       s: 'H5975', orig: 'עָמַד',     surf: 'עֹמֵ֤ד',       w: 4,    m: 'HVqrmsa',      mp: 'verb',         st: 'qal',    tn: null,    vc: 'active',  md: 'participle',           pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  loc: 'OSHB:B27.C10.V13.w4',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H5975:4:HVqrmsa'] },
  { pos: 5,  ar: 'مُقَابِلِي',    s: 'H5048', orig: 'נֶגֶד',     surf: 'לְנֶגְדִּי֙',   w: 5,    m: 'HR/R/Sp1cs',   mp: 'preposition',  st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: null,       gn: null,        cs: null,        loc: 'OSHB:B27.C10.V13.w5',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H5048:5:HR/R/Sp1cs', '2:secondary:H9005:5:HR'] },
  { pos: 6,  ar: 'وَاحِدًا',     s: 'H259',  orig: 'אֶחָד',     surf: 'וְאֶחָ֣ד',     w: 7,    m: 'HC/Acmsa',     mp: 'adjective',    st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  loc: 'OSHB:B27.C10.V13.w7',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H259:7:HC/Acmsa', '2:secondary:H9002:7:HC'] },
  { pos: 7,  ar: 'وَعِشْرِينَ',  s: 'H6242', orig: 'עֶשְׂרִים', surf: 'עֶשְׂרִ֣ים',   w: 6,    m: 'HAcbpa',       mp: 'adjective',    st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'plural',   gn: 'common',    cs: 'absolute',  loc: 'OSHB:B27.C10.V13.w6',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H6242:6:HAcbpa'] },
  { pos: 8,  ar: 'يَوْمًا',      s: 'H3117', orig: 'יוֹם',      surf: 'י֔וֹם',        w: 8,    m: 'HNcmsa',       mp: 'noun',         st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  loc: 'OSHB:B27.C10.V13.w8',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H3117:8:HNcmsa'] },
  { pos: 9,  ar: 'وَهُوَذَا',    s: 'H2009', orig: 'הִנֵּה',    surf: 'וְהִנֵּ֣ה',    w: 9,    m: 'HC/Tm',        mp: 'particle',     st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: null,       gn: null,        cs: null,        loc: 'OSHB:B27.C10.V13.w9',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H2009:9:HC/Tm', '2:secondary:H9002:9:HC'] },
  { pos: 10, ar: 'مِيخَائِيلُ',   s: 'H4317', orig: 'מִיכָאֵל',  surf: 'מִֽיכָאֵ֗ל',   w: 10,   m: 'HNp',          mp: 'proper_noun',  st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'singular', gn: null,        cs: null,        loc: 'OSHB:B27.C10.V13.w10',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H4317:10:HNp'] },
  { pos: 11, ar: 'وَاحِدٌ',      s: 'H259',  orig: 'אֶחָד',     surf: 'אַחַ֛ד',       w: 11,   m: 'HAcmsa',       mp: 'adjective',    st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  loc: 'OSHB:B27.C10.V13.w11',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H259:11:HAcmsa'] },
  { pos: 12, ar: 'مِنَ',         s: null,    orig: '—',         surf: '—',            w: null, m: null,           mp: 'syntactic_ar', st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: null,       gn: null,        cs: null,        loc: 'AR_SYNTACTIC:B27.C10.V13.w12', vs: 'syntactic_ar', ms: 'syntactic_ar', rel: 'syntactic_ar', comps: [] },
  { pos: 13, ar: 'الرُّؤَسَاءِ',  s: 'H8269', orig: 'שַׂר',      surf: 'הַשָּׂרִ֥ים',  w: 12,   m: 'HTd/Ncmpa',    mp: 'noun',         st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'plural',   gn: 'masculine', cs: 'absolute',  loc: 'OSHB:B27.C10.V13.w12',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H8269:12:HTd/Ncmpa', '2:secondary:H9009:12:HTd'] },
  { pos: 14, ar: 'الأَوَّلِينَ',  s: 'H7223', orig: 'רִאשׁוֹן',  surf: 'הָרִאשֹׁנִ֖ים', w: 13,   m: 'HTd/Aampa',    mp: 'adjective',    st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'plural',   gn: 'masculine', cs: 'absolute',  loc: 'OSHB:B27.C10.V13.w13',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H7223:13:HTd/Aampa', '2:secondary:H9009:13:HTd'] },
  { pos: 15, ar: 'جَاءَ',        s: 'H935',  orig: 'בּוֹא',     surf: 'בָּ֣א',        w: 14,   m: 'HVqp3ms',      mp: 'verb',         st: 'qal',    tn: 'qatal', vc: 'active',  md: 'indicative',           pr: '3',  nm: 'singular', gn: 'masculine', cs: null,        loc: 'OSHB:B27.C10.V13.w14',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H935:14:HVqp3ms'] },
  { pos: 16, ar: 'لإِعَانَتِي',   s: 'H5826', orig: 'עָזַר',     surf: 'לְעָזְרֵ֑נִי',  w: 15,   m: 'HR/Vqc/Sp1cs', mp: 'verb',         st: 'qal',    tn: null,    vc: 'active',  md: 'infinitive_construct', pr: null, nm: null,       gn: null,        cs: null,        loc: 'OSHB:B27.C10.V13.w15',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H5826:15:HR/Vqc/Sp1cs', '2:secondary:H9005:15:HR'] },
  { pos: 17, ar: 'وَأَنَا',      s: 'H589',  orig: 'אֲנִי',     surf: 'וַאֲנִי֙',     w: 16,   m: 'HC/Pp1cs',     mp: 'pronoun',      st: null,     tn: null,    vc: null,      md: null,                   pr: '1',  nm: 'singular', gn: 'common',    cs: null,        loc: 'OSHB:B27.C10.V13.w16',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H589:16:HC/Pp1cs', '2:secondary:H9002:16:HC'] },
  { pos: 18, ar: 'أُبْقِيتُ',    s: 'H3498', orig: 'יָתַר',     surf: 'נוֹתַ֣רְתִּי', w: 17,   m: 'HVNp1cs',      mp: 'verb',         st: 'niphal', tn: 'qatal', vc: 'passive', md: 'indicative',           pr: '1',  nm: 'singular', gn: 'common',    cs: null,        loc: 'OSHB:B27.C10.V13.w17',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H3498:17:HVNp1cs'] },
  { pos: 19, ar: 'هُنَاكَ',      s: 'H8033', orig: 'שָׁם',      surf: 'שָׁ֔ם',        w: 18,   m: 'HD',           mp: 'adverb',       st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: null,       gn: null,        cs: null,        loc: 'OSHB:B27.C10.V13.w18',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H8033:18:HD'] },
  { pos: 20, ar: 'عِنْدَ',       s: 'H681',  orig: 'אֵצֶל',     surf: 'אֵ֖צֶל',       w: 19,   m: 'HR',           mp: 'preposition',  st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: null,       gn: null,        cs: null,        loc: 'OSHB:B27.C10.V13.w19',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H681:19:HR'] },
  { pos: 21, ar: 'مُلُوكِ',      s: 'H4428', orig: 'מֶלֶךְ',    surf: 'מַלְכֵ֥י',     w: 20,   m: 'HNcmpc',       mp: 'noun',         st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct', loc: 'OSHB:B27.C10.V13.w20',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H4428:20:HNcmpc'] },
  { pos: 22, ar: 'فَارِسَ',      s: 'H6539', orig: 'פָּרַס',    surf: 'פָרָֽס',       w: 21,   m: 'HNp',          mp: 'proper_noun',  st: null,     tn: null,    vc: null,      md: null,                   pr: null, nm: 'singular', gn: null,        cs: null,        loc: 'OSHB:B27.C10.V13.w21',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,           comps: ['1:primary:H6539:21:HNp'] }
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
  WHERE vr.book_id = 27 AND vr.chapter_num = 10 AND vr.verse_num = 13
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 22, `Dan 10:13 has exactly 22 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 27 AND vr.chapter_num = 10 AND vr.verse_num = 13
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

assert(compRows.length === 29, `Dan 10:13 has exactly 29 word_mapping_strongs components (21 primary + 8 secondary, 0 for syntactic_ar #12; got ${compRows.length})`);
assert(coveredTokens.size === 21 && maxW === 21, `Dan 10:13 covers all 21/21 unique OSHB tokens w1..w21 with zero out-of-bounds positions (covered=${coveredTokens.size}, maxW=${maxW})`);

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
  assert(okRow, `Dan 10:13 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s || 'AR_SYNTACTIC'} @ ${exp.loc}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  const okComps = JSON.stringify(actComps) === JSON.stringify(exp.comps);
  assert(okComps, `Dan 10:13 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

// Live frozen auditor verification for Dan 10:13 (never swallow execError!)
const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3d_dan10_13_audit.json');
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
  const dan = rep.perVerse.find(v => v.verse === 'Dan 10:13');
  assert(
    rep.dbSha256 === sha256File(dbPath) &&
    rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
    'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
  );
  assert(
    Boolean(dan && dan.clean === 22 && dan.total === 22 && dan.alerts === 0 && dan.axisAlerts.lexical === 0 && dan.axisAlerts.lemmaSurface === 0 && dan.axisAlerts.morphology === 0 && dan.axisAlerts.sourceLocator === 0),
    'Live frozen auditor confirms Dan 10:13 = 22/22 (100.0%) with 0 alerts across all 4 axes',
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
console.log(`  ROUND 3 BATCH 3D (DAN 10:13) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
