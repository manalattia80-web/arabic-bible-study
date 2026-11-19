/**
 * test_round3_batch3a_lev17_5_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3A: Leviticus 17:5 (ALL 22 records, 32 components, 26/26 OSHB tokens).
 * Also verifies live frozen auditor output for Lev 17:5 (22/22 clean, 0 alerts across all 4 axes) and
 * confirms frozen raw baseline & frozen auditor SHA-256 fingerprints remain untouched.
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

console.log('=== RUNNING ROUND 3 BATCH 3A (LEVITICUS 17:5) QUALITY GATES ===\n');

const EXPECTED = [
  { pos: 1,  ar: 'لِكَيْ',        s: 'H4616', orig: 'מַעַן',     surf: 'לְמַעַן֩',     w: 1,  m: 'HR',              mp: 'preposition',      st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        comps: ['1:primary:H4616:1:HR', '2:secondary:H834:2:HTr'] },
  { pos: 2,  ar: 'يَأْتِيَ',       s: 'H935',  orig: 'בּוֹא',     surf: 'יָבִ֜יאוּ',     w: 3,  m: 'HVhi3mp',         mp: 'verb',             st: 'hiphil', tn: 'yiqtol',  vc: 'active', md: 'indicative', pr: '3',  nm: 'plural',   gn: 'masculine', cs: null,        comps: ['1:primary:H935:3:HVhi3mp'] },
  { pos: 3,  ar: 'بَنُو',         s: 'H1121', orig: 'בֵּן',      surf: 'בְּנֵ֣י',      w: 4,  m: 'HNcmpc',          mp: 'noun',             st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct', comps: ['1:primary:H1121:4:HNcmpc'] },
  { pos: 4,  ar: 'إِسْرَائِيلَ',   s: 'H3478', orig: 'יִשְׂרָאֵל', surf: 'יִשְׂרָאֵ֗ל',   w: 5,  m: 'HNp',             mp: 'proper_noun',      st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'singular', gn: null,        cs: null,        comps: ['1:primary:H3478:5:HNp'] },
  { pos: 5,  ar: 'بِذَبَائِحِهِمِ', s: 'H2077', orig: 'זֶבַח',     surf: 'זִבְחֵיהֶם֮',   w: 7,  m: 'HNcmpc/Sp3mp',    mp: 'noun',             st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct', comps: ['1:primary:H2077:7:HNcmpc/Sp3mp', '2:secondary:H853:6:HTo'] },
  { pos: 6,  ar: 'الَّتِي',       s: 'H834',  orig: 'אֲשֶׁר',    surf: 'אֲשֶׁ֣ר',      w: 8,  m: 'HTr',             mp: 'relative_pronoun', st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        comps: ['1:primary:H834:8:HTr'] },
  { pos: 7,  ar: 'يَذْبَحُونَهَا', s: 'H2076', orig: 'זָבַח',     surf: 'זֹבְחִים֮',     w: 10, m: 'HVqrmpa',         mp: 'verb',             st: 'qal',    tn: null,      vc: 'active', md: 'participle', pr: null, nm: 'plural',   gn: 'masculine', cs: 'absolute',  comps: ['1:primary:H2076:10:HVqrmpa', '2:secondary:H1992:9:HPp3mp'] },
  { pos: 8,  ar: 'عَلَى',         s: 'H5921', orig: 'עַל',       surf: 'עַל',          w: 11, m: 'HR',              mp: 'preposition',      st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        comps: ['1:primary:H5921:11:HR'] },
  { pos: 9,  ar: 'وَجْهِ',        s: 'H6440', orig: 'פָּנִים',   surf: 'פְּנֵ֣י',      w: 12, m: 'HNcbpc',          mp: 'noun',             st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'common',    cs: 'construct', comps: ['1:primary:H6440:12:HNcbpc'] },
  { pos: 10, ar: 'الصَّحْرَاءِ',   s: 'H7704', orig: 'שָׂדֶה',    surf: 'הַשָּׂדֶה֒',    w: 13, m: 'HTd/Ncmsa',       mp: 'noun',             st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  comps: ['1:primary:H7704:13:HTd/Ncmsa', '2:secondary:H9009:13:HTd'] },
  { pos: 11, ar: 'وَيُقَدِّمُوهَا', s: 'H935',  orig: 'בּוֹא',     surf: 'וֶֽהֱבִיאֻ֣ם',  w: 14, m: 'HC/Vhq3cp/Sp3mp', mp: 'verb',             st: 'hiphil', tn: 'weqatal', vc: 'active', md: 'indicative', pr: '3',  nm: 'plural',   gn: 'common',    cs: null,        comps: ['1:primary:H935:14:HC/Vhq3cp/Sp3mp', '2:secondary:H9002:14:HC'] },
  { pos: 12, ar: 'لِلرَّبِّ',      s: 'H3068', orig: 'יְהֹוָה',   surf: 'לַֽיהוָ֗ה',    w: 15, m: 'HR/Np',           mp: 'proper_noun',      st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'singular', gn: null,        cs: null,        comps: ['1:primary:H3068:15:HR/Np', '2:secondary:H9005:15:HR'] },
  { pos: 13, ar: 'إِلَى',         s: 'H413',  orig: 'אֵל',       surf: 'אֶל',          w: 16, m: 'HR',              mp: 'preposition',      st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        comps: ['1:primary:H413:16:HR'] },
  { pos: 14, ar: 'بَابِ',         s: 'H6607', orig: 'פֶּתַח',    surf: 'פֶּ֛תַח',      w: 17, m: 'HNcmsc',          mp: 'noun',             st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'construct', comps: ['1:primary:H6607:17:HNcmsc'] },
  { pos: 15, ar: 'خَيْمَةِ',      s: 'H168',  orig: 'אֹהֶל',     surf: 'אֹ֥הֶל',       w: 18, m: 'HNcmsc',          mp: 'noun',             st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'construct', comps: ['1:primary:H168:18:HNcmsc'] },
  { pos: 16, ar: 'الاجْتِمَاعِ',   s: 'H4150', orig: 'מוֹעֵד',    surf: 'מוֹעֵ֖ד',      w: 19, m: 'HNcmsa',          mp: 'noun',             st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  comps: ['1:primary:H4150:19:HNcmsa'] },
  { pos: 17, ar: 'إِلَى',         s: 'H413',  orig: 'אֵל',       surf: 'אֶל',          w: 20, m: 'HR',              mp: 'preposition',      st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        comps: ['1:primary:H413:20:HR'] },
  { pos: 18, ar: 'الْكَاهِنِ،',    s: 'H3548', orig: 'כֹּהֵן',    surf: 'הַכֹּהֵ֑ן',    w: 21, m: 'HTd/Ncmsa',       mp: 'noun',             st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  comps: ['1:primary:H3548:21:HTd/Ncmsa', '2:secondary:H9009:21:HTd'] },
  { pos: 19, ar: 'وَيَذْبَحُوهَا', s: 'H2076', orig: 'זָבַח',     surf: 'וְזָ֨בְח֜וּ',   w: 22, m: 'HC/Vqq3cp',       mp: 'verb',             st: 'qal',    tn: 'weqatal', vc: 'active', md: 'indicative', pr: '3',  nm: 'plural',   gn: 'common',    cs: null,        comps: ['1:primary:H2076:22:HC/Vqq3cp', '2:secondary:H9002:22:HC', '3:secondary:H853:26:HTo/Sp3mp'] },
  { pos: 20, ar: 'ذَبَائِحَ',     s: 'H2077', orig: 'זֶבַח',     surf: 'זִבְחֵ֧י',     w: 23, m: 'HNcmpc',          mp: 'noun',             st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct', comps: ['1:primary:H2077:23:HNcmpc'] },
  { pos: 21, ar: 'سَلاَمَةٍ',     s: 'H8002', orig: 'שֶׁלֶם',    surf: 'שְׁלָמִ֛ים',   w: 24, m: 'HNcmpa',          mp: 'noun',             st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'masculine', cs: 'absolute',  comps: ['1:primary:H8002:24:HNcmpa'] },
  { pos: 22, ar: 'لِلرَّبِّ.',     s: 'H3068', orig: 'יְהֹוָה',   surf: 'לַֽיהוָ֖ה',    w: 25, m: 'HR/Np',           mp: 'proper_noun',      st: null,     tn: null,      vc: null,     md: null,         pr: null, nm: 'singular', gn: null,        cs: null,        comps: ['1:primary:H3068:25:HR/Np', '2:secondary:H9005:25:HR'] }
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
    'rel', wm.relation_type,
    'notes', wm.grammar_notes
  )
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 3 AND vr.chapter_num = 17 AND vr.verse_num = 5
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 22, `Lev 17:5 has exactly 22 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 3 AND vr.chapter_num = 17 AND vr.verse_num = 5
  ORDER BY wm.ar_word_position, wms.link_order;
`).split('\n').filter(Boolean);

const compsByPos = new Map();
const coveredTokens = new Set();
for (const c of compRows) {
  const [arPos, order, role, sid, wPos, morph] = c.split('|');
  const p = parseInt(arPos, 10);
  if (!compsByPos.has(p)) compsByPos.set(p, []);
  compsByPos.get(p).push(`${order}:${role}:${sid}:${wPos}:${morph}`);
  coveredTokens.add(parseInt(wPos, 10));
}

assert(compRows.length === 32, `Lev 17:5 has exactly 32 word_mapping_strongs components (22 primary + 10 secondary, got ${compRows.length})`);
assert(coveredTokens.size === 26, `Lev 17:5 covers all 26/26 OSHB tokens w1..w26 bijectively (got ${coveredTokens.size})`);

const primaryPositions = new Set();
for (let i = 0; i < EXPECTED.length; i++) {
  const exp = EXPECTED[i];
  const act = rows[i];
  primaryPositions.add(act.w);
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
    act.loc === `OSHB:B3.C17.V5.w${exp.w}` &&
    act.vs === 'oshb_wlc' &&
    act.ms === 'oshb_wlc' &&
    act.rel === null &&
    act.notes === null;
  assert(okRow, `Lev 17:5 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s} @ w${exp.w} (${exp.m})`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  const okComps = JSON.stringify(actComps) === JSON.stringify(exp.comps);
  assert(okComps, `Lev 17:5 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

assert(primaryPositions.size === 22, `All 22 primary positions in Lev 17:5 are strictly unique (no repeated_referent collisions, got ${primaryPositions.size})`);

// Live frozen auditor verification for Lev 17:5 (never swallow execError!)
const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3a_lev17_5_audit.json');
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
  const lev = rep.perVerse.find(v => v.verse === 'Lev 17:5');
  assert(
    rep.dbSha256 === sha256File(dbPath) &&
    rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
    'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
  );
  assert(
    Boolean(lev && lev.clean === 22 && lev.total === 22 && lev.alerts === 0 && lev.axisAlerts.lexical === 0 && lev.axisAlerts.lemmaSurface === 0 && lev.axisAlerts.morphology === 0 && lev.axisAlerts.sourceLocator === 0),
    'Live frozen auditor confirms Lev 17:5 = 22/22 (100.0%) with 0 alerts across all 4 axes',
    JSON.stringify(lev)
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
console.log(`  ROUND 3 BATCH 3A (LEV 17:5) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
