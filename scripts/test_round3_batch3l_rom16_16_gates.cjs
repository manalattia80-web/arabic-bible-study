/**
 * test_round3_batch3l_rom16_16_gates.cjs
 *
 * Mandatory CI Gate Suite for Round 3 Holdout Batch 3L: Romans 16:16 (ALL 10 records, 12 components, 11/11 unique Greek tokens).
 * Verifies exact fields, elimination of false-negative at #3 «عَلَى» (AR_SYNTACTIC), compound_phrase #2+#4 on w2 ἀλλήλους,
 * TR alignment on second clause #7..#10 (w6..w11 matching SVD), live frozen auditor 10/10 (0 alerts),
 * negative mutation gate reverting #3 back to G1722@w3, and untouched frozen baseline & auditor SHA-256.
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

console.log('=== RUNNING ROUND 3 BATCH 3L (ROMANS 16:16 — GREEK) QUALITY GATES ===\n');

const EXPECTED = [
  {"pos":1,"ar":"سَلِّمُوا","s":"G782","orig":"ἀσπάζομαι","surf":"Ἀσπάσασθε","w":1,"m":"V- 2AMD-P--","mp":"verb","tn":"aorist","vc":"middle","md":"imperative","pr":"2","nm":"plural","gn":null,"cs":null,"loc":"SBLGNT:B45.C16.V16.w1","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G782:1:V- 2AMD-P--"]},
  {"pos":2,"ar":"بَعْضُكُمْ","s":"G240","orig":"ἀλλήλων","surf":"ἀλλήλους","w":2,"m":"RP ----APM-","mp":"personal_pronoun","tn":null,"vc":null,"md":null,"pr":null,"nm":"plural","gn":"masculine","cs":"accusative","loc":"SBLGNT:B45.C16.V16.w2","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":"compound_phrase","comps":["1:primary:G240:2:RP ----APM-"]},
  {"pos":3,"ar":"عَلَى","s":null,"orig":"—","surf":"—","w":null,"m":null,"mp":"syntactic_ar","tn":null,"vc":null,"md":null,"pr":null,"nm":null,"gn":null,"cs":null,"loc":"AR_SYNTACTIC:B45.C16.V16.w3","vs":"syntactic_ar","ms":"syntactic_ar","rel":"syntactic_ar","comps":[]},
  {"pos":4,"ar":"بَعْضٍ","s":"G240","orig":"ἀλλήλων","surf":"ἀλλήλους","w":2,"m":"RP ----APM-","mp":"personal_pronoun","tn":null,"vc":null,"md":null,"pr":null,"nm":"plural","gn":"masculine","cs":"accusative","loc":"SBLGNT:B45.C16.V16.w2","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":"compound_phrase","comps":["1:primary:G240:2:RP ----APM-"]},
  {"pos":5,"ar":"بِقُبْلَةٍ","s":"G5370","orig":"φίλημα","surf":"φιλήματι","w":4,"m":"N- ----DSN-","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"neuter","cs":"dative","loc":"SBLGNT:B45.C16.V16.w4","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G5370:4:N- ----DSN-","2:secondary:G1722:3:P- --------"]},
  {"pos":6,"ar":"مُقَدَّسَةٍ","s":"G40","orig":"ἅγιος","surf":"ἁγίῳ","w":5,"m":"A- ----DSN-","mp":"adjective","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"neuter","cs":"dative","loc":"SBLGNT:B45.C16.V16.w5","vs":"morphgnt_sblgnt","ms":"morphgnt_sblgnt","rel":null,"comps":["1:primary:G40:5:A- ----DSN-"]},
  {"pos":7,"ar":"كَنَائِسُ","s":"G1577","orig":"ἐκκλησία","surf":"ἐκκλησίαι","w":9,"m":"N-NPF","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"plural","gn":"feminine","cs":"nominative","loc":"TR:B45.C16.V16.w9","vs":"morphgnt_tr","ms":"morphgnt_tr","rel":null,"comps":["1:primary:G1577:9:N-NPF","2:secondary:G3588:8:T-NPF"]},
  {"pos":8,"ar":"الْمَسِيحِ","s":"G5547","orig":"Χριστός","surf":"Χριστοῦ","w":11,"m":"N-GSM","mp":"noun","tn":null,"vc":null,"md":null,"pr":null,"nm":"singular","gn":"masculine","cs":"genitive","loc":"TR:B45.C16.V16.w11","vs":"morphgnt_tr","ms":"morphgnt_tr","rel":null,"comps":["1:primary:G5547:11:N-GSM","2:secondary:G3588:10:T-GSM"]},
  {"pos":9,"ar":"تُسَلِّمُ","s":"G782","orig":"ἀσπάζομαι","surf":"ἀσπάζονται","w":6,"m":"V-PNI-3P","mp":"verb","tn":"present","vc":"middle_deponent","md":"indicative","pr":"3","nm":"plural","gn":null,"cs":null,"loc":"TR:B45.C16.V16.w6","vs":"morphgnt_tr","ms":"morphgnt_tr","rel":null,"comps":["1:primary:G782:6:V-PNI-3P"]},
  {"pos":10,"ar":"عَلَيْكُمْ","s":"G4771","orig":"σύ","surf":"ὑμᾶς","w":7,"m":"P-2AP","mp":"personal_pronoun","tn":null,"vc":null,"md":null,"pr":"2","nm":"plural","gn":null,"cs":"accusative","loc":"TR:B45.C16.V16.w7","vs":"morphgnt_tr","ms":"morphgnt_tr","rel":null,"comps":["1:primary:G4771:7:P-2AP"]}
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
  WHERE vr.book_id = 45 AND vr.chapter_num = 16 AND vr.verse_num = 16
  ORDER BY wm.ar_word_position ASC;
`).split('\n').filter(Boolean).map(l => JSON.parse(l));

assert(rows.length === 10, `Rom 16:16 has exactly 10 Arabic word_mappings (got ${rows.length})`);

const compRows = q(`
  SELECT wm.ar_word_position, wms.link_order, wms.link_role, wms.strongs_id, wms.orig_word_position, wms.orig_morphology
  FROM word_mapping_strongs wms
  JOIN word_mappings wm ON wms.mapping_id = wm.id
  JOIN verses vr ON wm.verse_id = vr.id
  WHERE vr.book_id = 45 AND vr.chapter_num = 16 AND vr.verse_num = 16
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

assert(compRows.length === 12, `Rom 16:16 has exactly 12 word_mapping_strongs components (9 primary + 3 secondary, 0 for #3 syntactic_ar; got ${compRows.length})`);
assert(coveredTokens.size === 11 && maxW === 11, `Rom 16:16 covers all 11/11 unique Greek tokens w1..w11 (covered=${coveredTokens.size}, maxW=${maxW})`);

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
  assert(okRow, `Rom 16:16 #${exp.pos} (${exp.ar}) exact fields -> ${exp.s || 'AR_SYNTACTIC'} @ ${exp.loc}`, JSON.stringify({ act, exp }));

  const actComps = compsByPos.get(exp.pos) || [];
  assert(JSON.stringify(actComps) === JSON.stringify(exp.comps), `Rom 16:16 #${exp.pos} (${exp.ar}) exact components (${exp.comps.length})`, JSON.stringify({ actComps, expected: exp.comps }));
}

if (!process.env.SKIP_LIVE_AUDITOR) {
  const tmpOut = path.join(repoRoot, 'scratch/tmp_live_batch3l_rom16_16_audit.json');
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
    const rom = rep.perVerse.find(v => v.verse === 'Rom 16:16');
    assert(
      rep.dbSha256 === sha256File(dbPath) &&
      rep.manifestSha256 === sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_15_verses_manifest.json')),
      'Live frozen auditor report matches exact DB & Round 3 manifest SHA-256'
    );
    assert(
      Boolean(rom && rom.clean === 10 && rom.total === 10 && rom.alerts === 0 && rom.axisAlerts.lexical === 0 && rom.axisAlerts.lemmaSurface === 0 && rom.axisAlerts.morphology === 0 && rom.axisAlerts.sourceLocator === 0),
      'Live frozen auditor confirms Rom 16:16 = 10/10 (100.0%) with 0 alerts across all 4 axes',
      JSON.stringify(rom)
    );
    try { fs.unlinkSync(tmpOut); } catch (_) {}
  }
}

// Negative mutation gate: reverting #3 «عَلَى» back to false-negative G1722 ἐν@w3 MUST fail!
if (!process.env.SKIP_NEG_TEST) {
  const scratchNegDb = path.join(repoRoot, 'scratch/test_rom16_16_neg_pos3_g1722.db');
  fs.mkdirSync(path.dirname(scratchNegDb), { recursive: true });
  try {
    fs.copyFileSync(dbPath, scratchNegDb);
    q(`
      UPDATE word_mappings
      SET strongs_id = 'G1722', orig_word = 'ἐν', orig_surface = 'ἐν', orig_word_position = 3,
          orig_morphology = 'P- --------', morph_pos = 'preposition',
          verified_locator = 'SBLGNT:B45.C16.V16.w3', verified_source = 'morphgnt_sblgnt',
          morph_source = 'morphgnt_sblgnt', relation_type = NULL
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 45 AND chapter_num = 16 AND verse_num = 16)
        AND ar_word_position = 3;
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
    assert(negFailed && negOut.includes('[FAIL] Rom 16:16 #3'), 'Negative gate rejects reverting #3 «عَلَى» back to false-negative G1722@w3');
  } finally {
    try { fs.unlinkSync(scratchNegDb); } catch (_) {}
  }
}

const rawBaselineSha = sha256File(path.join(repoRoot, 'scripts/unseen_holdout_round3_4axis_raw_baseline_v379.json'));
const frozenAuditorSha = sha256File(path.join(repoRoot, 'scripts/audit_unseen_holdout_sample.cjs'));
assert(rawBaselineSha === '12de8cc5e3cc1b2d05dc20371928d4c1191a2f9f7255d70fbaf17e6fcb84da88', 'Frozen Round 3 raw baseline SHA-256 untouched (12de8cc5...)', rawBaselineSha);
assert(frozenAuditorSha === '5c62f12e6b72484b149d3f6e11980d25b593338d5ab08a832f5d8da684647300', 'Frozen auditor SHA-256 untouched (5c62f12e...)', frozenAuditorSha);

console.log('\n================================================================================');
console.log(`  ROUND 3 BATCH 3L (ROMANS 16:16) GATES SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
console.log('================================================================================');

if (failed > 0) process.exit(1);
