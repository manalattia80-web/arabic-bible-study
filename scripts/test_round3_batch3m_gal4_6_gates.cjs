/**
 * test_round3_batch3m_gal4_6_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3M: Galatians 4:6 (ALL 14 records, 20 components, 20/20 unique Greek tokens).
 * Verifies exact fields, restoration of false-negative #11 «صَارِخًا:» (G2896 κρᾶζον @ w17), TR ὑμῶν at #10 «قُلُوبِكُمْ»,
 * G5 αββα at #13 «أَبَا», live frozen auditor 14/14 (0 alerts), negative mutation gate reverting #11 to AR_SYNTACTIC,
 * and untouched frozen baseline & auditor SHA-256.
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

console.log('=== RUNNING ROUND 3 BATCH 3M (GALATIANS 4:6 — GREEK) QUALITY GATES ===\n');

const EXPECTED = [
  {"pos":1,"ar":"ثُمَّ","s":"G1161","orig":"δέ","surf":"δέ","w":2,"m":"C- --------","mp":"conjunction","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B48.C4.V6.w2","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1161:2:C- --------"]},
  {"pos":2,"ar":"بِمَا","s":"G3754","orig":"ὅτι","surf":"ὅτι","w":1,"m":"C- --------","mp":"conjunction","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B48.C4.V6.w1","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3754:1:C- --------"]},
  {"pos":3,"ar":"أَنَّكُمْ","s":"G1510","orig":"εἰμί","surf":"ἐστε","w":3,"m":"V- 2PAI-P--","mp":"verb","tn":"present","vc":"active","md":"indicative","pr":"2","nm":"plural","gn":null,"cs":null,"loc":"SBLGNT:B48.C4.V6.w3","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1510:3:V- 2PAI-P--"]},
  {"pos":4,"ar":"أَبْنَاءٌ،","s":"G5207","orig":"υἱός","surf":"υἱοί","w":4,"m":"N- ----NPM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"plural","gn":"masculine","cs":"nominative","loc":"SBLGNT:B48.C4.V6.w4","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G5207:4:N- ----NPM-"]},
  {"pos":5,"ar":"أَرْسَلَ","s":"G1821","orig":"ἐξαποστέλλω","surf":"ἐξαπέστειλεν","w":5,"m":"V- 3AAI-S--","mp":"verb","tn":"aorist","vc":"active","md":"indicative","pr":"3","nm":"singular","gn":null,"cs":null,"loc":"SBLGNT:B48.C4.V6.w5","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1821:5:V- 3AAI-S--"]},
  {"pos":6,"ar":"اللهُ","s":"G2316","orig":"θεός","surf":"θεὸς","w":7,"m":"N- ----NSM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"nominative","loc":"SBLGNT:B48.C4.V6.w7","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2316:7:N- ----NSM-","2:secondary:G3588:6:RA ----NSM-"]},
  {"pos":7,"ar":"رُوحَ","s":"G4151","orig":"πνεῦμα","surf":"πνεῦμα","w":9,"m":"N- ----ASN-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"neuter","cs":"accusative","loc":"SBLGNT:B48.C4.V6.w9","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G4151:9:N- ----ASN-","2:secondary:G3588:8:RA ----ASN-"]},
  {"pos":8,"ar":"ابْنِهِ","s":"G5207","orig":"υἱός","surf":"υἱοῦ","w":11,"m":"N- ----GSM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"genitive","loc":"SBLGNT:B48.C4.V6.w11","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G5207:11:N- ----GSM-","2:secondary:G3588:10:RA ----GSM-","3:secondary:G846:12:RP ----GSM-"]},
  {"pos":9,"ar":"إِلَى","s":"G1519","orig":"εἰς","surf":"εἰς","w":13,"m":"P- --------","mp":"preposition","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B48.C4.V6.w13","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1519:13:P- --------"]},
  {"pos":10,"ar":"قُلُوبِكُمْ","s":"G2588","orig":"καρδία","surf":"καρδίας","w":15,"m":"N-APF","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"plural","gn":"feminine","cs":"accusative","loc":"TR:B48.C4.V6.w15","vs":"morphgnt_tr","ms":"morphgnt_tr","rel":null,"comps":["1:primary:G2588:15:N-APF","2:secondary:G3588:14:T-APF","3:secondary:G4771:16:P-2GP"]},
  {"pos":11,"ar":"صَارِخًا:","s":"G2896","orig":"κράζω","surf":"κρᾶζον","w":17,"m":"V- -PAPASN-","mp":"verb","tn":"present","vc":"active","md":"participle","pr":null,"nm":"singular","gn":"neuter","cs":"accusative","loc":"SBLGNT:B48.C4.V6.w17","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2896:17:V- -PAPASN-"]},
  {"pos":12,"ar":"«يَا","s":null,"orig":"—","surf":"—","w":null,"m":null,"mp":"syntactic_ar","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"AR_SYNTACTIC:B48.C4.V6.w12","vs":"syntactic_ar","ms":"syntactic_ar","rel":"syntactic_ar","comps":[]},
  {"pos":13,"ar":"أَبَا","s":"G5","orig":"αββα","surf":"Αββα","w":18,"m":"N- ----VSM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"vocative","loc":"SBLGNT:B48.C4.V6.w18","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G5:18:N- ----VSM-"]},
  {"pos":14,"ar":"الآبُ».","s":"G3962","orig":"πατήρ","surf":"πατήρ","w":20,"m":"N- ----NSM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"nominative","loc":"SBLGNT:B48.C4.V6.w20","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3962:20:N- ----NSM-","2:secondary:G3588:19:RA ----NSM-"]}
];

const rows = q(`
  SELECT json_object(
    'pos', wm.ar_word_position, 'ar', wm.ar_word, 's', wm.strongs_id,
    'orig', wm.orig_word, 'surf', wm.orig_surface, 'w', wm.orig_word_position,
    'm', wm.orig_morphology, 'mp', wm.morph_pos, 'tn', wm.morph_tense,
    'vc', wm.morph_voice, 'md', wm.morph_mood, 'pr', wm.morph_person,
    'nm', wm.morph_number, 'gn', wm.morph_gender, 'cs', wm.morph_case,
    'loc', wm.verified_locator, 'vs', wm.verified_source, 'ms', wm.morph_source,
    'rel', wm.relation_type
  )
  FROM word_mappings wm
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 48 AND vr.chapter_num = 4 AND vr.verse_num = 6
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 14, `Gal 4:6 has exactly 14 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 48 AND vr.chapter_num = 4 AND vr.verse_num = 6
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

assert(compRows.length === 20, `Gal 4:6 has exactly 20 word_mapping_strongs components (13 primary + 7 secondary, 0 for #12 syntactic_ar; got ${compRows.length})`);
assert(coveredTokens.size === 20 && maxW === 20, `Gal 4:6 covers all 20/20 unique Greek tokens w1..w20 (covered=${coveredTokens.size}, maxW=${maxW})`);

for (let i = 0; i < EXPECTED.length; i++) {
  const exp = EXPECTED[i];
  const act = rows[i];
  const okRow =
    act.pos === exp.pos && act.ar === exp.ar && act.s === exp.s &&
    act.orig === exp.orig && act.surf === exp.surf && act.w === exp.w &&
    act.m === exp.m && act.mp === exp.mp && act.tn === exp.tn &&
    act.vc === exp.vc && act.md === exp.md && act.pr === exp.pr &&
    act.nm === exp.nm && act.gn === exp.gn && act.cs === exp.cs &&
    act.loc === exp.loc && act.vs === exp.vs && act.ms === exp.ms &&
    act.rel === exp.rel;
  assert(okRow, `Gal 4:6 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s || 'AR_SYNTACTIC'} @ ${exp.loc}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  assert(JSON.stringify(actComps) === JSON.stringify(exp.comps), `Gal 4:6 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

if (!process.env.SKIP_LIVE_AUDITOR) {
  const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3m_gal4_6_audit.json');
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
    const gal = rep.perVerse.find(v => v.verse === 'Gal 4:6');
    assert(
      rep.dbSha256 === sha256File(dbPath) &&
      rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
      'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
    );
    assert(
      Boolean(gal && gal.clean === 14 && gal.total === 14 && gal.alerts === 0 && gal.axisAlerts.lexical === 0 && gal.axisAlerts.lemmaSurface === 0 && gal.axisAlerts.morphology === 0 && gal.axisAlerts.sourceLocator === 0),
      'Live frozen auditor confirms Gal 4:6 = 14/14 (100.0%) with 0 alerts across all 4 axes',
      JSON.stringify(gal)
    );
    try { fs.unlinkSync(tmpOut); } catch (_) {}
  }
}

// Negative mutation gate: reverting #11 «صَارِخًا:» back to false-negative AR_SYNTACTIC MUST fail!
if (!process.env.SKIP_NEG_TEST) {
  const scratchNegDb = path.join(repoRoot, 'scratch/test_gal4_6_neg_pos11_syntactic.db');
  fs.mkdirSync(path.dirname(scratchNegDb), { recursive: true });
  try {
    fs.copyFileSync(dbPath, scratchNegDb);
    q(`
      UPDATE word_mappings
      SET strongs_id = NULL, orig_word = '—', orig_surface = '—', orig_word_position = NULL,
          orig_morphology = NULL, morph_pos = 'syntactic_ar',
          verified_locator = 'AR_SYNTACTIC:B48.C4.V6.w11', verified_source = 'syntactic_ar',
          morph_source = 'syntactic_ar', relation_type = 'syntactic_ar'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 48 AND chapter_num = 4 AND verse_num = 6)
        AND ar_word_position = 11;
    `, scratchNegDb);
    let negFailed = false;
    let negOut = '';
    try {
      execFileSync(process.execPath, [__filename], {
        cwd: repoRoot,
        env: { ...process.env, AUDIT_DB_PATH: scratchNegDb, SKIP_LIVE_AUDITOR: '1', SKIP_NEG_TEST: '1' },
        stdio: 'pipe'
      });
    } catch (e) {
      negFailed = true;
      negOut = (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
    }
    assert(negFailed && negOut.includes('[FAIL] Gal 4:6 #11'), 'Negative gate rejects reverting #11 «صَارِخًا:» back to false-negative AR_SYNTACTIC');
  } finally {
    try { fs.unlinkSync(scratchNegDb); } catch (_) {}
  }
}

const rawBaselineSha = sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_4axis_raw_baseline_v379.json'));
const frozenAuditorSha = sha256File(path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'));
assert(rawBaselineSha === '12de8cc5e3cc1b2d05dc20371928d4c1191a2f9f7255d70fbaf17e6fcb84da88', 'Frozen Round 3 raw baseline SHA-256 untouched (12de8cc5...)', rawBaselineSha);
assert(frozenAuditorSha === '5c62f12e6b72484b149d3f6e11980d25b593338d5ab08a832f5d8da684647300', 'Frozen auditor SHA-256 untouched (5c62f12e...)', frozenAuditorSha);

console.log('\n================================================================================');
console.log(`  ROUND 3 BATCH 3M (GALATIANS 4:6) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) process.exit(1);
