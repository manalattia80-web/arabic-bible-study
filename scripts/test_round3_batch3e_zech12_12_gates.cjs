/**
 * test_round3_batch3e_zech12_12_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3E: Zechariah 12:12 (ALL 22 records, 31 components, 17/17 OSHB tokens).
 * Verifies:
 *   - All 5 contextual occurrences of לְבָד (w5, w9, w11, w15, w17) mapped as documented compound_phrase pairs,
 *   - Elimination of all 5 out-of-bounds positions (w18..w22) and the false-negative collision at #11 (w11 -> w9),
 *   - Dedicated NEGATIVE contextual-occurrence collision test: moves #11 «حِدَتِهَا» from w9 (לְבָד֙) to w11 (לְבָ֔ד)
 *     WITH w11's valid surface & morphology on an isolated scratch DB and proves this gate REJECTS it with exit != 0,
 *   - Live frozen auditor check confirming Zech 12:12 = 22/22 (100.0%, 0 alerts across all 4 axes),
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

console.log('=== RUNNING ROUND 3 BATCH 3E (ZECHARIAH 12:12) QUALITY GATES ===\n');

const EXPECTED = [
  { pos: 1,  ar: 'وَتَنُوحُ',    s: 'H5594', orig: 'סָפַד',      surf: 'וְסָפְדָ֣ה',    w: 1,  m: 'HC/Vqp3fs',      mp: 'verb',        st: 'qal', tn: 'qatal', vc: 'active', md: 'indicative', pr: '3',  nm: 'singular', gn: 'feminine',  cs: null,        rel: null,              comps: ['1:primary:H5594:1:HC/Vqp3fs', '2:secondary:H9002:1:HC'] },
  { pos: 2,  ar: 'الأَرْضُ',     s: 'H776',  orig: 'אֶרֶץ',      surf: 'הָאָ֔רֶץ',     w: 2,  m: 'HTd/Ncbsa',      mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: 'common',    cs: 'absolute',  rel: null,              comps: ['1:primary:H776:2:HTd/Ncbsa', '2:secondary:H9009:2:HTd'] },
  { pos: 3,  ar: 'عَشَائِرَ',    s: 'H4940', orig: 'מִשְׁפָּחָה', surf: 'מִשְׁפָּח֥וֹת', w: 3,  m: 'HNcfpa',         mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'feminine',  cs: 'absolute',  rel: null,              comps: ['1:primary:H4940:3:HNcfpa'] },
  { pos: 4,  ar: 'عَشَائِرَ',    s: 'H4940', orig: 'מִשְׁפָּחָה', surf: 'מִשְׁפָּח֖וֹת', w: 4,  m: 'HNcfpa',         mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'feminine',  cs: 'absolute',  rel: null,              comps: ['1:primary:H4940:4:HNcfpa'] },
  { pos: 5,  ar: 'عَلَى',        s: 'H9005', orig: 'לְ',         surf: 'לְ',           w: 5,  m: 'HR',             mp: 'preposition', st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        rel: 'compound_phrase', comps: ['1:primary:H9005:5:HR'] },
  { pos: 6,  ar: 'حِدَتِهَا',    s: 'H905',  orig: 'בַּד',       surf: 'לְבָ֑ד',       w: 5,  m: 'HR/Ncmsa',       mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  rel: 'compound_phrase', comps: ['1:primary:H905:5:HR/Ncmsa', '2:secondary:H9005:5:HR'] },
  { pos: 7,  ar: 'عَشِيرَةُ',    s: 'H4940', orig: 'מִשְׁפָּחָה', surf: 'מִשְׁפַּ֨חַת',  w: 6,  m: 'HNcfsc',         mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: 'feminine',  cs: 'construct', rel: null,              comps: ['1:primary:H4940:6:HNcfsc'] },
  { pos: 8,  ar: 'بَيْتِ',       s: 'H1004', orig: 'בַּיִת',     surf: 'בֵּית',        w: 7,  m: 'HNcmsc',         mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'construct', rel: null,              comps: ['1:primary:H1004:7:HNcmsc'] },
  { pos: 9,  ar: 'دَاوُدَ',      s: 'H1732', orig: 'דָּוִד',     surf: 'דָּוִ֤יד',      w: 8,  m: 'HNp',            mp: 'proper_noun', st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: null,        cs: null,        rel: null,              comps: ['1:primary:H1732:8:HNp'] },
  { pos: 10, ar: 'عَلَى',        s: 'H9005', orig: 'לְ',         surf: 'לְ',           w: 9,  m: 'HR',             mp: 'preposition', st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        rel: 'compound_phrase', comps: ['1:primary:H9005:9:HR'] },
  { pos: 11, ar: 'حِدَتِهَا',    s: 'H905',  orig: 'בַּד',       surf: 'לְבָד֙',       w: 9,  m: 'HR/Ncmsa',       mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  rel: 'compound_phrase', comps: ['1:primary:H905:9:HR/Ncmsa', '2:secondary:H9005:9:HR'] },
  { pos: 12, ar: 'وَنِسَاؤُهُمْ', s: 'H802',  orig: 'אִשָּׁה',    surf: 'וּנְשֵׁיהֶ֣ם',  w: 10, m: 'HC/Ncfpc/Sp3mp', mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'feminine',  cs: 'construct', rel: null,              comps: ['1:primary:H802:10:HC/Ncfpc/Sp3mp', '2:secondary:H9002:10:HC'] },
  { pos: 13, ar: 'عَلَى',        s: 'H9005', orig: 'לְ',         surf: 'לְ',           w: 11, m: 'HR',             mp: 'preposition', st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        rel: 'compound_phrase', comps: ['1:primary:H9005:11:HR'] },
  { pos: 14, ar: 'حِدَتِهِنَّ',  s: 'H905',  orig: 'בַּד',       surf: 'לְבָ֔ד',       w: 11, m: 'HR/Ncmsa',       mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  rel: 'compound_phrase', comps: ['1:primary:H905:11:HR/Ncmsa', '2:secondary:H9005:11:HR'] },
  { pos: 15, ar: 'عَشِيرَةُ',    s: 'H4940', orig: 'מִשְׁפָּחָה', surf: 'מִשְׁפַּ֤חַת',  w: 12, m: 'HNcfsc',         mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: 'feminine',  cs: 'construct', rel: null,              comps: ['1:primary:H4940:12:HNcfsc'] },
  { pos: 16, ar: 'بَيْتِ',       s: 'H1004', orig: 'בַּיִת',     surf: 'בֵּית',        w: 13, m: 'HNcmsc',         mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'construct', rel: null,              comps: ['1:primary:H1004:13:HNcmsc'] },
  { pos: 17, ar: 'نَاثَانَ',     s: 'H5416', orig: 'נָתָן',      surf: 'נָתָן֙',       w: 14, m: 'HNp',            mp: 'proper_noun', st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: null,        cs: null,        rel: null,              comps: ['1:primary:H5416:14:HNp'] },
  { pos: 18, ar: 'عَلَى',        s: 'H9005', orig: 'לְ',         surf: 'לְ',           w: 15, m: 'HR',             mp: 'preposition', st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        rel: 'compound_phrase', comps: ['1:primary:H9005:15:HR'] },
  { pos: 19, ar: 'حِدَتِهَا',    s: 'H905',  orig: 'בַּד',       surf: 'לְבָ֔ד',       w: 15, m: 'HR/Ncmsa',       mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  rel: 'compound_phrase', comps: ['1:primary:H905:15:HR/Ncmsa', '2:secondary:H9005:15:HR'] },
  { pos: 20, ar: 'وَنِسَاؤُهُمْ', s: 'H802',  orig: 'אִשָּׁה',    surf: 'וּנְשֵׁיהֶ֖ם',  w: 16, m: 'HC/Ncfpc/Sp3mp', mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'plural',   gn: 'feminine',  cs: 'construct', rel: null,              comps: ['1:primary:H802:16:HC/Ncfpc/Sp3mp', '2:secondary:H9002:16:HC'] },
  { pos: 21, ar: 'عَلَى',        s: 'H9005', orig: 'לְ',         surf: 'לְ',           w: 17, m: 'HR',             mp: 'preposition', st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: null,       gn: null,        cs: null,        rel: 'compound_phrase', comps: ['1:primary:H9005:17:HR'] },
  { pos: 22, ar: 'حِدَتِهِنَّ',  s: 'H905',  orig: 'בַּד',       surf: 'לְבָֽד',       w: 17, m: 'HR/Ncmsa',       mp: 'noun',        st: null,  tn: null,    vc: null,     md: null,         pr: null, nm: 'singular', gn: 'masculine', cs: 'absolute',  rel: 'compound_phrase', comps: ['1:primary:H905:17:HR/Ncmsa', '2:secondary:H9005:17:HR'] }
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
  WHERE vr.book_id = 38 AND vr.chapter_num = 12 AND vr.verse_num = 12
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 22, `Zech 12:12 has exactly 22 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 38 AND vr.chapter_num = 12 AND vr.verse_num = 12
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

assert(compRows.length === 31, `Zech 12:12 has exactly 31 word_mapping_strongs components (22 primary + 9 secondary; got ${compRows.length})`);
assert(coveredTokens.size === 17 && maxW === 17, `Zech 12:12 covers all 17/17 unique OSHB tokens w1..w17 with zero out-of-bounds positions (covered=${coveredTokens.size}, maxW=${maxW})`);

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
    act.loc === `OSHB:B38.C12.V12.w${exp.w}` &&
    act.vs === 'oshb_wlc' &&
    act.ms === 'oshb_wlc' &&
    act.rel === exp.rel;
  assert(okRow, `Zech 12:12 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s} @ w${exp.w} (${exp.m})${exp.rel ? ' [' + exp.rel + ']' : ''}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  const okComps = JSON.stringify(actComps) === JSON.stringify(exp.comps);
  assert(okComps, `Zech 12:12 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

// Contextual disambiguation check for all 5 occurrences of לְבָד (H905)
const h905Occurrences = rows.filter(r => r.s === 'H905').map(r => `${r.pos}:w${r.w}:${r.surf}`);
const expectedH905 = ['6:w5:לְבָ֑ד', '11:w9:לְבָד֙', '14:w11:לְבָ֔ד', '19:w15:לְבָ֔ד', '22:w17:לְבָֽד'];
assert(
  JSON.stringify(h905Occurrences) === JSON.stringify(expectedH905),
  'Zech 12:12 all 5 occurrences of לְבָד (H905) are contextually distinct and strictly monotonic (#6@w5, #11@w9, #14@w11, #19@w15, #22@w17)',
  JSON.stringify(h905Occurrences)
);

// Live frozen auditor verification for Zech 12:12 (never swallow execError!)
if (!process.env.SKIP_LIVE_AUDITOR) {
  const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3e_zech12_12_audit.json');
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
    const zech = rep.perVerse.find(v => v.verse === 'Zech 12:12');
    assert(
      rep.dbSha256 === sha256File(dbPath) &&
      rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
      'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
    );
    assert(
      Boolean(zech && zech.clean === 22 && zech.total === 22 && zech.alerts === 0 && zech.axisAlerts.lexical === 0 && zech.axisAlerts.lemmaSurface === 0 && zech.axisAlerts.morphology === 0 && zech.axisAlerts.sourceLocator === 0),
      'Live frozen auditor confirms Zech 12:12 = 22/22 (100.0%) with 0 alerts across all 4 axes',
      JSON.stringify(zech)
    );
    try { fs.unlinkSync(tmpOut); } catch (_) {}
  }
}

// Dedicated NEGATIVE contextual-occurrence collision test:
// Move #11 «حِدَتِهَا» from w9 (לְבָד֙) to w11 (לְבָ֔ד) WITH w11's exact valid surface & morphology -> MUST BE REJECTED!
if (!process.env.SKIP_NEG_TEST) {
  const scratchNegDb = path.join(repoRoot, 'scratch/test_zech12_12_neg_pos11_to_w11.db');
  fs.mkdirSync(path.dirname(scratchNegDb), { recursive: true });
  fs.copyFileSync(dbPath, scratchNegDb);
  let rejectedWrongOccurrence = false;
  let negDetail = '';
  try {
    q(`
      UPDATE word_mappings
      SET orig_surface = 'לְבָ֔ד',
          orig_word_position = 11,
          orig_morphology = 'HR/Ncmsa',
          verified_locator = 'OSHB:B38.C12.V12.w11'
      WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 38 AND chapter_num = 12 AND verse_num = 12)
        AND ar_word_position = 11;
      UPDATE word_mapping_strongs
      SET orig_component = CASE WHEN link_role = 'primary' THEN 'לְבָ֔ד' ELSE orig_component END,
          orig_word_position = 11
      WHERE mapping_id IN (
        SELECT wm.id FROM word_mappings wm JOIN verses vr ON wm.verse_id = vr.id
        WHERE vr.book_id = 38 AND vr.chapter_num = 12 AND vr.verse_num = 12 AND wm.ar_word_position = 11
      );
    `, scratchNegDb);

    try {
      execFileSync(process.execPath, [__filename], {
        cwd: repoRoot,
        env: { ...process.env, AUDIT_DB_PATH: scratchNegDb, SKIP_NEG_TEST: '1', SKIP_LIVE_AUDITOR: '1' },
        stdio: 'pipe'
      });
      negDetail = 'Gate unexpectedly exited 0 when #11 was moved to contextually wrong occurrence w11';
    } catch (err) {
      const out = (err.stderr ? err.stderr.toString('utf8') : '') + '\n' + (err.stdout ? err.stdout.toString('utf8') : '');
      const flaggedPos11 = out.includes('[FAIL] Zech 12:12 #11 (حِدَتِهَا)') && out.includes('[FAIL] Zech 12:12 all 5 occurrences of לְבָד');
      rejectedWrongOccurrence = err.status !== 0 && flaggedPos11;
      if (!rejectedWrongOccurrence) negDetail = `exit=${err.status}, flaggedPos11=${flaggedPos11}`;
    }
  } finally {
    try { fs.unlinkSync(scratchNegDb); } catch (_) {}
  }

  assert(
    rejectedWrongOccurrence,
    'NEGATIVE GATE: Moving #11 «حِدَتِهَا» from w9 (לְבָד֙) to w11 (לְבָ֔ד) with valid surface & morph is strictly REJECTED as contextually wrong occurrence',
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
console.log(`  ROUND 3 BATCH 3E (ZECH 12:12) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) {
  process.exit(1);
}
