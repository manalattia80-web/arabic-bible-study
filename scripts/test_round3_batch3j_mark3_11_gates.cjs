/**
 * test_round3_batch3j_mark3_11_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3J: Mark 3:11 (ALL 12 records, 20 components, 20/20 Greek SBLGNT tokens).
 * Verifies exact fields, elimination of BOTH false-negative AR_SYNTACTIC records (#8 قَائِلَةً: -> G3004@w13, #9 «إِنَّكَ -> G3754@w14),
 * live frozen auditor 12/12 (0 alerts across all 4 axes), and untouched frozen raw baseline & auditor SHA-256.
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

console.log('=== RUNNING ROUND 3 BATCH 3J (MARK 3:11 — GREEK) QUALITY GATES ===\n');

const EXPECTED = [
  { pos: 1,  ar: 'وَالأَرْوَاحُ', s: 'G4151', orig: 'πνεῦμα',    surf: 'πνεύματα',    w: 3,  m: 'N- ----NPN-', mp: 'noun',             tn: null,        vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'neuter',    cs: 'nominative', comps: ['1:primary:G4151:3:N- ----NPN-', '2:secondary:G2532:1:C- --------', '3:secondary:G3588:2:RA ----NPN-'] },
  { pos: 2,  ar: 'النَّجِسَةُ',   s: 'G169',  orig: 'ἀκάθαρτος', surf: 'ἀκάθαρτα',    w: 5,  m: 'A- ----NPN-', mp: 'adjective',        tn: null,        vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'neuter',    cs: 'nominative', comps: ['1:primary:G169:5:A- ----NPN-', '2:secondary:G3588:4:RA ----NPN-'] },
  { pos: 3,  ar: 'حِينَمَا',      s: 'G3752', orig: 'ὅταν',      surf: 'ὅταν',        w: 6,  m: 'C- --------', mp: 'conjunction',      tn: null,        vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,         comps: ['1:primary:G3752:6:C- --------'] },
  { pos: 4,  ar: 'نَظَرَتْهُ',    s: 'G2334', orig: 'θεωρέω',    surf: 'ἐθεώρουν',    w: 8,  m: 'V- 3IAI-P--', mp: 'verb',             tn: 'imperfect', vc: 'active', md: 'indicative', pr: '3',  nm: 'plural',   gn: null,        cs: null,         comps: ['1:primary:G2334:8:V- 3IAI-P--', '2:secondary:G846:7:RP ----ASM-'] },
  { pos: 5,  ar: 'خَرَّتْ',       s: 'G4363', orig: 'προσπίπτω', surf: 'προσέπιπτον', w: 9,  m: 'V- 3IAI-P--', mp: 'verb',             tn: 'imperfect', vc: 'active', md: 'indicative', pr: '3',  nm: 'plural',   gn: null,        cs: null,         comps: ['1:primary:G4363:9:V- 3IAI-P--'] },
  { pos: 6,  ar: 'لَهُ',          s: 'G846',  orig: 'αὐτός',     surf: 'αὐτῷ',        w: 10, m: 'RP ----DSM-', mp: 'personal_pronoun', tn: null,        vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'dative',     comps: ['1:primary:G846:10:RP ----DSM-'] },
  { pos: 7,  ar: 'وَصَرَخَتْ',    s: 'G2896', orig: 'κράζω',     surf: 'ἔκραζον',     w: 12, m: 'V- 3IAI-P--', mp: 'verb',             tn: 'imperfect', vc: 'active', md: 'indicative', pr: '3',  nm: 'plural',   gn: null,        cs: null,         comps: ['1:primary:G2896:12:V- 3IAI-P--', '2:secondary:G2532:11:C- --------'] },
  { pos: 8,  ar: 'قَائِلَةً:',    s: 'G3004', orig: 'λέγω',      surf: 'λέγοντα',     w: 13, m: 'V- -PAPNPN-', mp: 'verb',             tn: 'present',   vc: 'active', md: 'participle', pr: null, nm: 'plural',   gn: 'neuter',    cs: 'nominative', comps: ['1:primary:G3004:13:V- -PAPNPN-'] },
  { pos: 9,  ar: '«إِنَّكَ',      s: 'G3754', orig: 'ὅτι',       surf: 'ὅτι',         w: 14, m: 'C- --------', mp: 'conjunction',      tn: null,        vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,         comps: ['1:primary:G3754:14:C- --------'] },
  { pos: 10, ar: 'أَنْتَ',        s: 'G4771', orig: 'σύ',        surf: 'Σὺ',          w: 15, m: 'RP ----NS--', mp: 'personal_pronoun', tn: null,        vc: null,     md: null,         pr: null, nm: 'singular', gn: null,        cs: 'nominative', comps: ['1:primary:G4771:15:RP ----NS--', '2:secondary:G1510:16:V- 2PAI-S--'] },
  { pos: 11, ar: 'ابْنُ',         s: 'G5207', orig: 'υἱός',      surf: 'υἱὸς',        w: 18, m: 'N- ----NSM-', mp: 'noun',             tn: null,        vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'nominative', comps: ['1:primary:G5207:18:N- ----NSM-', '2:secondary:G3588:17:RA ----NSM-'] },
  { pos: 12, ar: 'اللهِ!».',      s: 'G2316', orig: 'θεός',      surf: 'θεοῦ',        w: 20, m: 'N- ----GSM-', mp: 'noun',             tn: null,        vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'genitive',   comps: ['1:primary:G2316:20:N- ----GSM-', '2:secondary:G3588:19:RA ----GSM-'] }
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
    'tn', wm.morph_tense,
    'vc', wm.morph_voice,
    'md', wm.morph_mood,
    'pr', wm.morph_person,
    'nm', wm.morph_number,
    'gn', wm.morph_gender,
    'cs', wm.morph_case,
    'loc', wm.verified_locator,
    'vs', wm.verified_source,
    'ms', wm.morph_source
  )
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 41 AND vr.chapter_num = 3 AND vr.verse_num = 11
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 12, `Mark 3:11 has exactly 12 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 41 AND vr.chapter_num = 3 AND vr.verse_num = 11
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

assert(compRows.length === 20, `Mark 3:11 has exactly 20 word_mapping_strongs components (12 primary + 8 secondary; got ${compRows.length})`);
assert(coveredTokens.size === 20 && maxW === 20, `Mark 3:11 covers all 20/20 unique Greek SBLGNT tokens w1..w20 (covered=${coveredTokens.size}, maxW=${maxW})`);

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
    act.tn === exp.tn &&
    act.vc === exp.vc &&
    act.md === exp.md &&
    act.pr === exp.pr &&
    act.nm === exp.nm &&
    act.gn === exp.gn &&
    act.cs === exp.cs &&
    act.loc === `SBLGNT:B41.C3.V11.w${exp.w}` &&
    act.vs === 'morphgnt_sblgnt' &&
    act.ms === 'morphgnt_sblgnt';
  assert(okRow, `Mark 3:11 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s} @ w${exp.w} (${exp.m})`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  const okComps = JSON.stringify(actComps) === JSON.stringify(exp.comps);
  assert(okComps, `Mark 3:11 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

const syntacticCount = rows.filter(r => r.mp === 'syntactic_ar').length;
assert(syntacticCount === 0, `Mark 3:11 has 0 syntactic_ar records (both false negatives #8 & #9 restored to w13 & w14; got ${syntacticCount})`);

// Live frozen auditor verification for Mark 3:11 (never swallow execError!)
const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3j_mark3_11_audit.json');
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
  const mk = rep.perVerse.find(v => v.verse === 'Mark 3:11');
  assert(
    rep.dbSha256 === sha256File(dbPath) &&
    rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
    'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
  );
  assert(
    Boolean(mk && mk.clean === 12 && mk.total === 12 && mk.alerts === 0 && mk.axisAlerts.lexical === 0 && mk.axisAlerts.lemmaSurface === 0 && mk.axisAlerts.morphology === 0 && mk.axisAlerts.sourceLocator === 0),
    'Live frozen auditor confirms Mark 3:11 = 12/12 (100.0%) with 0 alerts across all 4 axes',
    JSON.stringify(mk)
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
console.log(`  ROUND 3 BATCH 3J (MARK 3:11) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
