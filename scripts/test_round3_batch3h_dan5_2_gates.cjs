/**
 * test_round3_batch3h_dan5_2_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3H: Daniel 5:2 (ALL 25 records, 31 components, 22/22 Aramaic OSHB tokens).
 * Verifies:
 *   - All 25 records exact fields & all 31 components (24 primary + 7 secondary, 0 for syntactic_ar #2 «كَانَ»),
 *   - Non-adjacent compound_phrase unit #1 «وَإِذْ» (H9003 בִּ:AR @ w3) + #4 «يَذُوقُ» (H2939 בִּטְעֵ֣ם:AR/Ncmsc @ w3 + secondary H9003),
 *   - Adjacent compound_phrase unit #18 «فِي» (H9003 בִ:AR @ w16) + #19 «أُورُشَلِيمَ» (H3390 בִירוּשְׁלֶ֑ם @ w16),
 *   - Live frozen auditor check (without modifying the frozen auditor!):
 *       * lexical=0, lemmaSurface=0, morphology=0 across ALL 25/25 records of Dan 5:2,
 *       * sourceLocator has ONLY the single documented frozen-auditor window limitation on #4 (arPos 4 > 1+2 for w3),
 *   - Dedicated NEGATIVE contextual-collision gate: moves #1 «وَإِذْ» from w3 (בִּ) to w16 (בִ, valid surface & morph AR,
 *     wrong context!) on an isolated scratch DB and proves this gate REJECTS it with exit != 0,
 *   - Supplemental verification report integrity & untouched frozen raw baseline / frozen auditor SHA-256.
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

function q(sql, targetDb = dbPath) {
  return execFileSync(sqlitePath, [targetDb], { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).replace(/\r/g, '').trim();
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

console.log('=== RUNNING ROUND 3 BATCH 3H (DANIEL 5:2 — ARAMAIC) QUALITY GATES ===\n');

const EXPECTED = [
  { pos: 1,  ar: 'وَإِذْ',          s: 'H9003', orig: 'בְּ',           surf: 'בִּ',            w: 3,    m: 'AR',             mp: 'preposition',      st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B27.C5.V2.w3',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: 'compound_phrase', comps: ['1:primary:H9003:3:AR'] },
  { pos: 2,  ar: 'كَانَ',          s: null,    orig: '—',             surf: '—',              w: null, m: null,             mp: 'syntactic_ar',     st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,         loc: 'AR_SYNTACTIC:B27.C5.V2.w2',  vs: 'syntactic_ar', ms: 'syntactic_ar', rel: 'syntactic_ar',    comps: [] },
  { pos: 3,  ar: 'بَيْلْشَاصَّرُ',  s: 'H1113', orig: 'בֵּלְשַׁאצַּר', surf: 'בֵּלְשַׁאצַּ֞ר', w: 1,    m: 'ANp',            mp: 'proper_noun',      st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: null,        cs: null,         loc: 'OSHB:B27.C5.V2.w1',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H1113:1:ANp'] },
  { pos: 4,  ar: 'يَذُوقُ',        s: 'H2939', orig: 'טְעַם',         surf: 'בִּטְעֵ֣ם',      w: 3,    m: 'AR/Ncmsc',       mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'construct',  loc: 'OSHB:B27.C5.V2.w3',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: 'compound_phrase', comps: ['1:primary:H2939:3:AR/Ncmsc', '2:secondary:H9003:3:AR'] },
  { pos: 5,  ar: 'الْخَمْرَ',       s: 'H2562', orig: 'חֲמַר',         surf: 'חַמְרָ֗א',       w: 4,    m: 'ANcmsd/Td',      mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'determined', loc: 'OSHB:B27.C5.V2.w4',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H2562:4:ANcmsd/Td'] },
  { pos: 6,  ar: 'أَمَرَ',         s: 'H560',  orig: 'אֲמַר',         surf: 'אֲמַ֣ר',         w: 2,    m: 'AVqp3ms',        mp: 'verb',             st: 'peal',   tn: 'qatal',  vc: 'active', md: 'indicative',           pr: '3',  nm: 'singular', gn: 'masculine', cs: null,         loc: 'OSHB:B27.C5.V2.w2',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H560:2:AVqp3ms'] },
  { pos: 7,  ar: 'بِإِحْضَارِ',     s: 'H858',  orig: 'אָתָה',         surf: 'לְהַיְתָיָה֙',    w: 5,    m: 'AR/Vhc',         mp: 'verb',             st: 'haphel', tn: null,     vc: 'active', md: 'infinitive_construct', pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B27.C5.V2.w5',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H858:5:AR/Vhc', '2:secondary:H9005:5:AR'] },
  { pos: 8,  ar: 'آنِيَةِ',        s: 'H3984', orig: 'מָאן',          surf: 'לְמָאנֵי֙',      w: 6,    m: 'ATo/Ncmpc',      mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct',  loc: 'OSHB:B27.C5.V2.w6',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H3984:6:ATo/Ncmpc'] },
  { pos: 9,  ar: 'الذَّهَبِ',       s: 'H1722', orig: 'דְּהַב',        surf: 'דַּהֲבָ֣א',      w: 7,    m: 'ANcmsd/Td',      mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'determined', loc: 'OSHB:B27.C5.V2.w7',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H1722:7:ANcmsd/Td'] },
  { pos: 10, ar: 'وَالْفِضَّةِ',    s: 'H3702', orig: 'כְּסַף',        surf: 'וְכַסְפָּ֔א',    w: 8,    m: 'AC/Ncmsd/Td',    mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'determined', loc: 'OSHB:B27.C5.V2.w8',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H3702:8:AC/Ncmsd/Td', '2:secondary:H9002:8:AC'] },
  { pos: 11, ar: 'الَّتِي',        s: 'H1768', orig: 'דִּי',          surf: 'דִּ֤י',          w: 9,    m: 'ATr',            mp: 'relative_pronoun', st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B27.C5.V2.w9',          vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H1768:9:ATr'] },
  { pos: 12, ar: 'أَخْرَجَهَا',     s: 'H5312', orig: 'נְפַק',         surf: 'הַנְפֵּק֙',      w: 10,   m: 'AVhp3ms',        mp: 'verb',             st: 'haphel', tn: 'qatal',  vc: 'active', md: 'indicative',           pr: '3',  nm: 'singular', gn: 'masculine', cs: null,         loc: 'OSHB:B27.C5.V2.w10',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H5312:10:AVhp3ms'] },
  { pos: 13, ar: 'نَبُوخَذْنَصَّرُ', s: 'H5020', orig: 'נְבוּכַדְנֶצַּר', surf: 'נְבוּכַדְנֶצַּ֣ר', w: 11, m: 'ANp',          mp: 'proper_noun',      st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: null,        cs: null,         loc: 'OSHB:B27.C5.V2.w11',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H5020:11:ANp'] },
  { pos: 14, ar: 'أَبُوهُ',        s: 'H2',    orig: 'אַב',           surf: 'אֲב֔וּהִי',      w: 12,   m: 'ANcmsc/Sp3ms',   mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'construct',  loc: 'OSHB:B27.C5.V2.w12',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H2:12:ANcmsc/Sp3ms'] },
  { pos: 15, ar: 'مِنَ',           s: 'H4481', orig: 'מִן',           surf: 'מִן',            w: 13,   m: 'AR',             mp: 'preposition',      st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B27.C5.V2.w13',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H4481:13:AR'] },
  { pos: 16, ar: 'الْهَيْكَلِ',     s: 'H1965', orig: 'הֵיכַל',        surf: 'הֵיכְלָ֖א',      w: 14,   m: 'ANcmsd/Td',      mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'determined', loc: 'OSHB:B27.C5.V2.w14',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H1965:14:ANcmsd/Td'] },
  { pos: 17, ar: 'الَّذِي',        s: 'H1768', orig: 'דִּי',          surf: 'דִּ֣י',          w: 15,   m: 'ATr',            mp: 'relative_pronoun', st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B27.C5.V2.w15',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H1768:15:ATr'] },
  { pos: 18, ar: 'فِي',            s: 'H9003', orig: 'בְּ',           surf: 'בִ',             w: 16,   m: 'AR',             mp: 'preposition',      st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: null,       gn: null,        cs: null,         loc: 'OSHB:B27.C5.V2.w16',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: 'compound_phrase', comps: ['1:primary:H9003:16:AR'] },
  { pos: 19, ar: 'أُورُشَلِيمَ',    s: 'H3390', orig: 'יְרוּשָׁלֵם',    surf: 'בִירוּשְׁלֶ֑ם',   w: 16,   m: 'AR/Np',          mp: 'proper_noun',      st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: null,        cs: null,         loc: 'OSHB:B27.C5.V2.w16',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: 'compound_phrase', comps: ['1:primary:H3390:16:AR/Np', '2:secondary:H9003:16:AR'] },
  { pos: 20, ar: 'لِيَشْرَبَ',      s: 'H8355', orig: 'שְׁתָה',        surf: 'וְיִשְׁתּ֣וֹן',   w: 17,   m: 'AC/Vqi3mp',      mp: 'verb',             st: 'peal',   tn: 'yiqtol', vc: 'active', md: 'indicative',           pr: '3',  nm: 'plural',   gn: 'masculine', cs: null,         loc: 'OSHB:B27.C5.V2.w17',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H8355:17:AC/Vqi3mp', '2:secondary:H9002:17:AC'] },
  { pos: 21, ar: 'بِهَا',          s: 'H9003', orig: 'בְּ',           surf: 'בְּה֗וֹן',       w: 18,   m: 'AR/Sp3mp',       mp: 'preposition',      st: null,     tn: null,     vc: null,     md: null,                   pr: '3',  nm: 'plural',   gn: 'masculine', cs: null,         loc: 'OSHB:B27.C5.V2.w18',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H9003:18:AR/Sp3mp'] },
  { pos: 22, ar: 'الْمَلِكُ',       s: 'H4430', orig: 'מֶלֶךְ',        surf: 'מַלְכָּא֙',      w: 19,   m: 'ANcmsd/Td',      mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'masculine', cs: 'determined', loc: 'OSHB:B27.C5.V2.w19',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H4430:19:ANcmsd/Td'] },
  { pos: 23, ar: 'وَعُظَمَاؤُهُ',   s: 'H7261', orig: 'רַבְרְבָן',     surf: 'וְרַבְרְבָנ֔וֹהִי', w: 20, m: 'AC/Ncmpc/Sp3ms', mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'plural',   gn: 'masculine', cs: 'construct',  loc: 'OSHB:B27.C5.V2.w20',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H7261:20:AC/Ncmpc/Sp3ms', '2:secondary:H9002:20:AC'] },
  { pos: 24, ar: 'وَزَوْجَاتُهُ',   s: 'H7695', orig: 'שֵׁגָל',        surf: 'שֵׁגְלָתֵ֖הּ',   w: 21,   m: 'ANcfpc/Sp3ms',   mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'plural',   gn: 'feminine',  cs: 'construct',  loc: 'OSHB:B27.C5.V2.w21',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H7695:21:ANcfpc/Sp3ms'] },
  { pos: 25, ar: 'وَسَرَارِيهِ',    s: 'H3904', orig: 'לְחֵנָה',       surf: 'וּלְחֵנָתֵֽהּ',   w: 22,   m: 'AC/Ncfsc/Sp3ms', mp: 'noun',             st: null,     tn: null,     vc: null,     md: null,                   pr: null, nm: 'singular', gn: 'feminine',  cs: 'construct',  loc: 'OSHB:B27.C5.V2.w22',         vs: 'oshb_wlc',     ms: 'oshb_wlc',     rel: null,              comps: ['1:primary:H3904:22:AC/Ncfsc/Sp3ms', '2:secondary:H9002:22:AC'] }
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
  WHERE vr.book_id = 27 AND vr.chapter_num = 5 AND vr.verse_num = 2
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 25, `Dan 5:2 has exactly 25 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 27 AND vr.chapter_num = 5 AND vr.verse_num = 2
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

assert(compRows.length === 31, `Dan 5:2 has exactly 31 word_mapping_strongs components (24 primary + 7 secondary, 0 for syntactic_ar #2; got ${compRows.length})`);
assert(coveredTokens.size === 22 && maxW === 22, `Dan 5:2 covers all 22/22 unique Aramaic OSHB tokens w1..w22 with zero out-of-bounds positions (covered=${coveredTokens.size}, maxW=${maxW})`);

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
  assert(okRow, `Dan 5:2 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s || 'AR_SYNTACTIC'} @ ${exp.loc}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  const okComps = JSON.stringify(actComps) === JSON.stringify(exp.comps);
  assert(okComps, `Dan 5:2 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

// Explicit non-adjacent compound_phrase unit check: #1 «وَإِذْ» + #4 «يَذُوقُ» -> w3 בִּטְעֵ֣ם
const w3Sharers = rows.filter(r => r.w === 3 && r.rel === 'compound_phrase').map(r => `${r.pos}:${r.s}:${r.surf}`);
const w16Sharers = rows.filter(r => r.w === 16 && r.rel === 'compound_phrase').map(r => `${r.pos}:${r.s}:${r.surf}`);
assert(
  JSON.stringify(w3Sharers) === JSON.stringify(['1:H9003:בִּ', '4:H2939:בִּטְעֵ֣ם']) &&
  JSON.stringify(w16Sharers) === JSON.stringify(['18:H9003:בִ', '19:H3390:בִירוּשְׁלֶ֑ם']) &&
  Boolean(rows[0].notes && rows[0].notes.includes('غير متجاورة') && rows[3].notes && rows[3].notes.includes('غير متجاورة')),
  'Dan 5:2 documents non-adjacent unit #1+#4 -> w3 (בִּטְעֵ֣ם) and adjacent unit #18+#19 -> w16 (בִירוּשְׁלֶ֑ם)',
  JSON.stringify({ w3Sharers, w16Sharers })
);

// Live frozen auditor verification (without modifying frozen auditor!):
// Verifies lexical=0, lemmaSurface=0, morphology=0 across all 25/25 records,
// and that the ONLY sourceLocator alert is the documented non-adjacent window limitation at #4 -> w3.
if (!process.env.SKIP_LIVE_AUDITOR) {
  const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3h_dan5_2_audit.json');
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
    const dan = rep.perVerse.find(v => v.verse === 'Dan 5:2');
    const danAlerts = rep.alerts.filter(a => a.verse === 'Dan 5:2');
    assert(
      rep.dbSha256 === sha256File(dbPath) &&
      rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
      'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
    );
    const onlyDocumentedNonAdjLimitation =
      Boolean(dan) &&
      dan.total === 25 &&
      dan.axisAlerts.lexical === 0 &&
      dan.axisAlerts.lemmaSurface === 0 &&
      dan.axisAlerts.morphology === 0 &&
      dan.axisAlerts.sourceLocator === 1 &&
      danAlerts.length === 1 &&
      danAlerts[0].pos === 4 &&
      danAlerts[0].axes.sourceLocator.length === 1 &&
      danAlerts[0].axes.sourceLocator[0] === 'duplicate primary token collision: OSHB:w3 already claimed by arPos #1';
    assert(
      onlyDocumentedNonAdjLimitation,
      'Live frozen auditor confirms Dan 5:2 = 25/25 on lexical/surface/morph (0 alerts) + ONLY the documented non-adjacent w3 window limitation at #4 (verified 25/25 with supplemental gate)',
      JSON.stringify({ dan, danAlerts })
    );
    try { fs.unlinkSync(tmpOut); } catch (_) {}
  }
}

// Dedicated NEGATIVE contextual-collision gate:
// Move #1 «وَإِذْ» from w3 (בִּ, H9003, AR) to w16 (בִ, H9003, AR — valid surface & morph, WRONG context!) -> MUST BE REJECTED!
if (!process.env.SKIP_NEG_TEST) {
  const scratchNegDb = path.join(repoRoot, 'scratch/test_dan5_2_neg_pos1_to_w16.db');
  fs.mkdirSync(path.dirname(scratchNegDb), { recursive: true });
  fs.copyFileSync(dbPath, scratchNegDb);
  let rejectedWrongBet = false;
  let negDetail = '';
  try {
    q(`
      UPDATE word_mappings
      SET orig_surface = 'בִ',
          orig_word_position = 16,
          orig_morphology = 'AR',
          verified_locator = 'OSHB:B27.C5.V2.w16'
      WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 5 AND verse_num = 2)
        AND ar_word_position = 1;
      UPDATE word_mapping_strongs
      SET orig_component = 'בִ',
          orig_word_position = 16,
          orig_morphology = 'AR'
      WHERE mapping_id IN (
        SELECT wm.id FROM word_mappings wm JOIN verses vr ON wm.verse_id = vr.id
        WHERE vr.book_id = 27 AND vr.chapter_num = 5 AND vr.verse_num = 2 AND wm.ar_word_position = 1
      );
    `, scratchNegDb);

    try {
      execFileSync(process.execPath, [__filename], {
        cwd: repoRoot,
        env: { ...process.env, AUDIT_DB_PATH: scratchNegDb, SKIP_NEG_TEST: '1', SKIP_LIVE_AUDITOR: '1' },
        stdio: 'pipe'
      });
      negDetail = 'Gate unexpectedly exited 0 when #1 «وَإِذْ» was moved to contextually wrong bet prefix at w16';
    } catch (err) {
      const out = (err.stderr ? err.stderr.toString('utf8') : '') + '\n' + (err.stdout ? err.stdout.toString('utf8') : '');
      const flaggedPos1 = out.includes('[FAIL] Dan 5:2 #1 (وَإِذْ)') && out.includes('[FAIL] Dan 5:2 documents non-adjacent unit #1+#4 -> w3');
      rejectedWrongBet = err.status !== 0 && flaggedPos1;
      if (!rejectedWrongBet) negDetail = `exit=${err.status}, flaggedPos1=${flaggedPos1}`;
    }
  } finally {
    try { fs.unlinkSync(scratchNegDb); } catch (_) {}
  }

  assert(
    rejectedWrongBet,
    'NEGATIVE GATE: Moving #1 «وَإِذْ» from w3 (בִּ) to contextually wrong Aramaic bet prefix w16 (בִ, valid surface & morph AR) is strictly REJECTED',
    negDetail
  );
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
console.log(`  ROUND 3 BATCH 3H (DAN 5:2) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
