/**
 * test_round3_batch3n_eph1_21_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3N: Ephesians 1:21 (ALL 18 records, 24 components, 24/24 unique Greek SBLGNT tokens).
 * Verifies exact fields, disambiguation of duplicate ἐν occurrences (#11 -> w16, #16 -> w22),
 * live frozen auditor 18/18 (0 alerts), DEDICATED NEGATIVE CONTEXTUAL-COLLISION GATE moving #16 «فِي» from w22 back to w16
 * (valid surface & morph, wrong occurrence -> MUST BE REJECTED!), and untouched frozen baseline & auditor SHA-256.
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

console.log('=== RUNNING ROUND 3 BATCH 3N (EPHESIANS 1:21 — GREEK) QUALITY GATES ===\n');

const EXPECTED = [
  {"pos":1,"ar":"فَوْقَ","s":"G5231","orig":"ὑπεράνω","surf":"ὑπεράνω","w":1,"m":"P- --------","mp":"preposition","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B49.C1.V21.w1","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G5231:1:P- --------"]},
  {"pos":2,"ar":"كُلِّ","s":"G3956","orig":"πᾶς","surf":"πάσης","w":2,"m":"A- ----GSF-","mp":"adjective","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"feminine","cs":"genitive","loc":"SBLGNT:B49.C1.V21.w2","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3956:2:A- ----GSF-"]},
  {"pos":3,"ar":"رِيَاسَةٍ","s":"G746","orig":"ἀρχή","surf":"ἀρχῆς","w":3,"m":"N- ----GSF-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"feminine","cs":"genitive","loc":"SBLGNT:B49.C1.V21.w3","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G746:3:N- ----GSF-"]},
  {"pos":4,"ar":"وَسُلْطَانٍ","s":"G1849","orig":"ἐξουσία","surf":"ἐξουσίας","w":5,"m":"N- ----GSF-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"feminine","cs":"genitive","loc":"SBLGNT:B49.C1.V21.w5","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1849:5:N- ----GSF-","2:secondary:G2532:4:C- --------"]},
  {"pos":5,"ar":"وَقُوَّةٍ","s":"G1411","orig":"δύναμις","surf":"δυνάμεως","w":7,"m":"N- ----GSF-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"feminine","cs":"genitive","loc":"SBLGNT:B49.C1.V21.w7","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1411:7:N- ----GSF-","2:secondary:G2532:6:C- --------"]},
  {"pos":6,"ar":"وَسِيَادَةٍ","s":"G2963","orig":"κυριότης","surf":"κυριότητος","w":9,"m":"N- ----GSF-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"feminine","cs":"genitive","loc":"SBLGNT:B49.C1.V21.w9","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2963:9:N- ----GSF-","2:secondary:G2532:8:C- --------"]},
  {"pos":7,"ar":"وَكُلِّ","s":"G3956","orig":"πᾶς","surf":"παντὸς","w":11,"m":"A- ----GSN-","mp":"adjective","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"neuter","cs":"genitive","loc":"SBLGNT:B49.C1.V21.w11","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3956:11:A- ----GSN-","2:secondary:G2532:10:C- --------"]},
  {"pos":8,"ar":"اسْمٍ","s":"G3686","orig":"ὄνομα","surf":"ὀνόματος","w":12,"m":"N- ----GSN-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"neuter","cs":"genitive","loc":"SBLGNT:B49.C1.V21.w12","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3686:12:N- ----GSN-"]},
  {"pos":9,"ar":"يُسَمَّى","s":"G3687","orig":"ὀνομάζω","surf":"ὀνομαζομένου","w":13,"m":"V- -PPPGSN-","mp":"verb","tn":"present","vc":"passive","md":"participle","pr":null,"nm":"singular","gn":"neuter","cs":"genitive","loc":"SBLGNT:B49.C1.V21.w13","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3687:13:V- -PPPGSN-"]},
  {"pos":10,"ar":"لَيْسَ","s":"G3756","orig":"οὐ","surf":"οὐ","w":14,"m":"D- --------","mp":"adverb","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B49.C1.V21.w14","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3756:14:D- --------"]},
  {"pos":11,"ar":"فِي","s":"G1722","orig":"ἐν","surf":"ἐν","w":16,"m":"P- --------","mp":"preposition","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B49.C1.V21.w16","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1722:16:P- --------"]},
  {"pos":12,"ar":"هذَا","s":"G3778","orig":"οὗτος","surf":"τούτῳ","w":19,"m":"RD ----DSM-","mp":"demonstrative","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"dative","loc":"SBLGNT:B49.C1.V21.w19","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3778:19:RD ----DSM-"]},
  {"pos":13,"ar":"الدَّهْرِ","s":"G165","orig":"αἰών","surf":"αἰῶνι","w":18,"m":"N- ----DSM-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"dative","loc":"SBLGNT:B49.C1.V21.w18","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G165:18:N- ----DSM-","2:secondary:G3588:17:RA ----DSM-"]},
  {"pos":14,"ar":"فَقَطْ","s":"G3441","orig":"μόνος","surf":"μόνον","w":15,"m":"A- ----ASN-","mp":"adjective","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"neuter","cs":"accusative","loc":"SBLGNT:B49.C1.V21.w15","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3441:15:A- ----ASN-"]},
  {"pos":15,"ar":"بَلْ","s":"G235","orig":"ἀλλά","surf":"ἀλλὰ","w":20,"m":"C- --------","mp":"conjunction","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B49.C1.V21.w20","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G235:20:C- --------"]},
  {"pos":16,"ar":"فِي","s":"G1722","orig":"ἐν","surf":"ἐν","w":22,"m":"P- --------","mp":"preposition","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B49.C1.V21.w22","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G1722:22:P- --------"]},
  {"pos":17,"ar":"الْمُسْتَقْبَلِ","s":"G3195","orig":"μέλλω","surf":"μέλλοντι","w":24,"m":"V- -PAPDSM-","mp":"verb","tn":"present","vc":"active","md":"participle","pr":null,"nm":"singular","gn":"masculine","cs":"dative","loc":"SBLGNT:B49.C1.V21.w24","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G3195:24:V- -PAPDSM-","2:secondary:G3588:23:RA ----DSM-"]},
  {"pos":18,"ar":"أَيْضًا","s":"G2532","orig":"καί","surf":"καὶ","w":21,"m":"D- --------","mp":"adverb","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"SBLGNT:B49.C1.V21.w21","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G2532:21:D- --------"]}
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
  WHERE vr.book_id = 49 AND vr.chapter_num = 1 AND vr.verse_num = 21
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 18, `Eph 1:21 has exactly 18 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 49 AND vr.chapter_num = 1 AND vr.verse_num = 21
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

assert(compRows.length === 24, `Eph 1:21 has exactly 24 word_mapping_strongs components (18 primary + 6 secondary; got ${compRows.length})`);
assert(coveredTokens.size === 24 && maxW === 24, `Eph 1:21 covers all 24/24 unique Greek SBLGNT tokens w1..w24 (covered=${coveredTokens.size}, maxW=${maxW})`);

// Explicit contextual disambiguation check for the two occurrences of ἐν (G1722): w16 vs w22
const enOrder = rows.filter(r => r.s === 'G1722').map(r => `${r.pos}:w${r.w}`);
assert(JSON.stringify(enOrder) === JSON.stringify(['11:w16', '16:w22']), `Eph 1:21 strictly disambiguates the two ἐν occurrences (#11->w16, #16->w22)`, JSON.stringify(enOrder));

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
  assert(okRow, `Eph 1:21 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s} @ ${exp.loc}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  assert(JSON.stringify(actComps) === JSON.stringify(exp.comps), `Eph 1:21 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

if (!process.env.SKIP_LIVE_AUDITOR) {
  const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3n_eph1_21_audit.json');
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
    const eph = rep.perVerse.find(v => v.verse === 'Eph 1:21');
    assert(
      rep.dbSha256 === sha256File(dbPath) &&
      rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
      'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
    );
    assert(
      Boolean(eph && eph.clean === 18 && eph.total === 18 && eph.alerts === 0 && eph.axisAlerts.lexical === 0 && eph.axisAlerts.lemmaSurface === 0 && eph.axisAlerts.morphology === 0 && eph.axisAlerts.sourceLocator === 0),
      'Live frozen auditor confirms Eph 1:21 = 18/18 (100.0%) with 0 alerts across all 4 axes',
      JSON.stringify(eph)
    );
    try { fs.unlinkSync(tmpOut); } catch (_) {}
  }
}

// DEDICATED NEGATIVE CONTEXTUAL-COLLISION GATE:
// Move #16 «فِي» from w22 (second ἐν) back to w16 (first ἐν — identical surface & morph, WRONG occurrence!) -> MUST BE REJECTED!
if (!process.env.SKIP_NEG_TEST) {
  const scratchNegDb = path.join(repoRoot, 'scratch/test_eph1_21_neg_pos16_to_w16.db');
  fs.mkdirSync(path.dirname(scratchNegDb), { recursive: true });
  try {
    fs.copyFileSync(dbPath, scratchNegDb);
    q(`
      UPDATE word_mappings
      SET orig_word_position = 16, verified_locator = 'SBLGNT:B49.C1.V21.w16'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 49 AND chapter_num = 1 AND verse_num = 21)
        AND ar_word_position = 16;
      UPDATE word_mapping_strongs
      SET orig_word_position = 16
      WHERE mapping_id = (
        SELECT wm.id FROM word_mappings wm JOIN verses vr ON wm.verse_id = vr.id
        WHERE vr.book_id = 49 AND vr.chapter_num = 1 AND vr.verse_num = 21 AND wm.ar_word_position = 16
      );
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
    assert(
      negFailed && negOut.includes('disambiguates the two ἐν occurrences') && negOut.includes('[FAIL] Eph 1:21 #16'),
      'Negative contextual-collision gate rejects moving #16 «فِي» from w22 to w16 despite valid surface & morph'
    );
  } finally {
    try { fs.unlinkSync(scratchNegDb); } catch (_) {}
  }
}

const rawBaselineSha = sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_4axis_raw_baseline_v379.json'));
const frozenAuditorSha = sha256File(path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'));
assert(rawBaselineSha === '12de8cc5e3cc1b2d05dc20371928d4c1191a2f9f7255d70fbaf17e6fcb84da88', 'Frozen Round 3 raw baseline SHA-256 untouched (12de8cc5...)', rawBaselineSha);
assert(frozenAuditorSha === '5c62f12e6b72484b149d3f6e11980d25b593338d5ab08a832f5d8da684647300', 'Frozen auditor SHA-256 untouched (5c62f12e...)', frozenAuditorSha);

console.log('\n================================================================================');
console.log(`  ROUND 3 BATCH 3N (EPHESIANS 1:21) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) process.exit(1);
